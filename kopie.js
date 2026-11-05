/* Skrót: kopie tego, co ktoś wpisał (etap 3 „Zdawalni w Skrócie”, port matura-app lib/draft-backup.ts).
   Kopia leży w localStorage pod skrot:kopia:<miejsce>:<id> najwyżej 7 dni i znika, gdy serwer potwierdzi zapis.
   Odświeżenie strony, zerwane połączenie albo błąd serwera nie kasują wpisanego tekstu.
   Każdy dostęp w try/catch: tryb prywatny albo pełna pamięć = po prostu brak kopii (tekst dalej jest na ekranie).
   Tu też kolejka zapisów, które nie doszły przez brak sieci (skrot-supabase.js ponawia je sam).
   index.html i skrot-supabase.js biorą to z window.SKROT_KOPIE, testy z require("./kopie.js"). */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SKROT_KOPIE = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var PREFIX = "skrot:kopia:";
  var TTL = 7 * 24 * 60 * 60 * 1000;
  var Q_KEY = PREFIX + "zapisy", Q_MAX = 200;

  // Czysta część: zapisana wartość, jeśli ma dobry kształt i nie jest starsza niż 7 dni.
  function parse(raw, now) {
    if (!raw) return null;
    try {
      var d = JSON.parse(raw);
      if (!d || typeof d.v !== "string" || typeof d.at !== "number") return null;
      return now - d.at > TTL ? null : d.v;
    } catch (e) { return null; }
  }
  var klucz = function (miejsce, id) { return PREFIX + miejsce + ":" + (id == null ? "" : String(id)); };

  // st: obiekt jak localStorage (w testach atrapa), now: () => ms.
  function utworz(st, now) {
    now = now || function () { return Date.now(); };
    var S = function () { return st || (typeof localStorage !== "undefined" ? localStorage : null); };
    function wczytaj(miejsce, id) {
      try {
        var k = klucz(miejsce, id), raw = S().getItem(k), v = parse(raw, now());
        if (raw && v === null) S().removeItem(k);
        return v;
      } catch (e) { return null; }
    }
    // Pusta wartość kasuje kopię.
    function zapisz(miejsce, id, value) {
      try {
        var k = klucz(miejsce, id);
        if (!String(value == null ? "" : value).trim()) { S().removeItem(k); return; }
        S().setItem(k, JSON.stringify({ v: String(value), at: now() }));
      } catch (e) { /* bez kopii tym razem; tekst dalej jest na ekranie */ }
    }
    function usun(miejsce, id) { try { S().removeItem(klucz(miejsce, id)); } catch (e) {} }
    // Kasuje wszystkie kopie z danego miejsca, których id zaczyna się od prefiksu (np. cały test po ocenie).
    function usunWszystkie(miejsce, prefix) {
      try {
        var p = klucz(miejsce, prefix || ""), s = S();
        for (var i = s.length - 1; i >= 0; i--) { var k = s.key(i); if (k && k.indexOf(p) === 0 && k !== Q_KEY) s.removeItem(k); }
      } catch (e) {}
    }
    // Przy starcie: kopie starsze niż 7 dni znikają.
    function sprzataj() {
      try {
        var s = S(), t = now();
        for (var i = s.length - 1; i >= 0; i--) {
          var k = s.key(i);
          if (!k || k.indexOf(PREFIX) !== 0 || k === Q_KEY) continue;
          if (parse(s.getItem(k), t) === null) s.removeItem(k);
        }
      } catch (e) {}
    }
    // Pole w formularzu: przywraca kopię (gdy pole jest puste albo ma inną treść niż zapisana na serwerze) i zapisuje przy każdym znaku.
    // Zwraca true, gdy coś przywrócono.
    function podepnij(el, miejsce, id) {
      if (!el) return false;
      var v = wczytaj(miejsce, id), back = false;
      if (v != null && v !== el.value) { el.value = v; back = true; }
      el.addEventListener("input", function () { zapisz(miejsce, id, el.value); });
      return back;
    }

    // ---------- kolejka zapisów (RPC odpowiedzi bez sieci) ----------
    function kolejka() {
      try {
        var raw = S().getItem(Q_KEY), list = raw ? JSON.parse(raw) : [];
        return swieze(Array.isArray(list) ? list : [], now());
      } catch (e) { return []; }
    }
    function kolejkaZapisz(list) {
      try { if (list.length) S().setItem(Q_KEY, JSON.stringify(list.slice(-Q_MAX))); else S().removeItem(Q_KEY); } catch (e) {}
    }
    function kolejkaDodaj(fn, args) { var l = kolejka(); l.push({ fn: fn, args: args || {}, at: now() }); kolejkaZapisz(l); return l.length; }
    return { wczytaj: wczytaj, zapisz: zapisz, usun: usun, usunWszystkie: usunWszystkie, sprzataj: sprzataj, podepnij: podepnij,
      kolejka: kolejka, kolejkaZapisz: kolejkaZapisz, kolejkaDodaj: kolejkaDodaj };
  }
  function swieze(list, now) {
    return list.filter(function (x) { return x && typeof x.fn === "string" && typeof x.at === "number" && now - x.at <= TTL; });
  }

  var api = { PREFIX: PREFIX, TTL: TTL, Q_KEY: Q_KEY, Q_MAX: Q_MAX, parse: parse, klucz: klucz, swieze: swieze, utworz: utworz };
  var dom = utworz(null);
  for (var k in dom) api[k] = dom[k];
  return api;
});
