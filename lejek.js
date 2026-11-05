/* Skrót: lejek i retencja bez cookies (etap 6 „Systemy z Zdawalni w Skrócie”). Bez DOM i bez bazy.
   1. Licznik wejść: najwyżej raz dziennie na przeglądarkę (flaga „bm-wejscie” = data w localStorage; to nie cookie
      i nie identyfikuje osoby), z rocznikiem z ekranu wejścia i źródłem z linku (?z=…). skrot-supabase.js wysyła
      wynik do nauka_wejscie (SQL v35), które dodaje 1 do sumy dnia.
   2. Panel administratora (Narzędzia starosty → Lejek i retencja): z podsumowania nauka_admin_lejek robi wiersze do tabel;
      grupy poniżej 5 osób są ukryte (jak MIN_GROUP w matura-app lib/domain/learner/metrics.ts i ranking).
   Wszystko po rocznikach z danych: nowy rocznik pojawia się w panelu bez zmian w kodzie.
   index.html bierze to z window.SKROT_LEJEK, testy z require("./lejek.js"). */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SKROT_LEJEK = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var MIN = 5;
  var FLAGA = "bm-wejscie";
  var RE_ROCZNIK = /^[a-z]+-[a-z0-9]+-[012]-(st|nst)-20[0-9]{2}$/;

  // Źródło wejścia z adresu: ?z=… (etap 11), a także ?zrodlo=… i ?zapisz=… (linki z etapu 5). Krótki, bezpieczny napis albo null.
  function zrodloZ(search) {
    var p = /[?&](?:z|zrodlo|zapisz)=([a-z0-9._-]{1,40})(?:&|#|$)/.exec(String(search || ""));
    return p ? p[1] : null;
  }
  // Czy policzyć to wejście: null, gdy dziś już policzone; inaczej argumenty do nauka_wejscie.
  function wejscie(flaga, dzis, search, rocznik) {
    if (!dzis || flaga === dzis) return null;
    return { p_rocznik: RE_ROCZNIK.test(String(rocznik || "")) ? rocznik : null, p_zrodlo: zrodloZ(search) };
  }

  var pct = function (a, b) { return b > 0 && a != null ? Math.round((a / b) * 100) : null; };
  var liczba = function (v) { var n = Number(v); return Number.isFinite(n) ? n : 0; };
  var ukryj = function (n) { return liczba(n) < MIN; };

  // Kroki lejka (okres 'd28' albo 'wszystko'). Procent z poprzedniego kroku i z kont; ukryty krok = mniej niż 5.
  var KROKI = [["wejscia", "Wejścia"], ["konta", "Konta"], ["wybor", "Wybrany kierunek"], ["proba", "Okres próbny"], ["zakup", "Zakup"]];
  function kroki(l) {
    l = l || {};
    var out = [], prev = null;
    KROKI.forEach(function (k) {
      var n = liczba(l[k[0]]), u = ukryj(n);
      var kont = liczba(l.konta), kontU = ukryj(kont);
      out.push({ klucz: k[0], nazwa: k[1], n: u ? null : n, ukryte: u,
        zPoprz: prev && !u && !prev.ukryte ? pct(n, prev.n) : null,
        zKont: k[0] !== "wejscia" && k[0] !== "konta" && !u && !kontU ? pct(n, kont) : null });
      prev = out[out.length - 1];
    });
    return out;
  }

  // Powroty D1 / D7 / D30: grupa = konta dość stare (mozliwe); poniżej 5 ukryta.
  var POWROTY = [["d1", "Dzień 1"], ["d7", "Dni 7–13"], ["d30", "Dni 30–36"]];
  function powroty(r) {
    r = r || {};
    return POWROTY.map(function (k) {
      var x = r[k[0]] || {}, m = liczba(x.mozliwe), a = liczba(x.aktywne), u = ukryj(m);
      return { klucz: k[0], nazwa: k[1], mozliwe: u ? null : m, aktywne: u ? null : a, pct: u ? null : pct(a, m), ukryte: u };
    });
  }

  // Dni nauki w tygodniu (4 ostatnie pełne tygodnie, od najnowszego).
  function tygodnie(list) {
    return (Array.isArray(list) ? list : []).slice().sort(function (a, b) { return String(b.tydzien).localeCompare(String(a.tydzien)); }).map(function (x) {
      var u = ukryj(x.osoby);
      return { tydzien: x.tydzien, osoby: u ? null : liczba(x.osoby), mediana: u ? null : liczba(x.mediana), srednio: u ? null : liczba(x.srednio), ukryte: u };
    });
  }

  // „Czy strona uczy”: tabela przedmiot × tydzień (% dobrych pierwszych odpowiedzi po ≥ 7 dniach). Wiersz „*” (razem) pierwszy,
  // potem przedmioty od największej liczby odpowiedzi. Tygodnie od najnowszego, najwyżej `ile`.
  function uczy(list, ile) {
    list = Array.isArray(list) ? list : [];
    var tyg = [], by = {}, odp = {};
    list.forEach(function (x) {
      if (!x || !x.tydzien || !x.sid) return;
      if (tyg.indexOf(x.tydzien) < 0) tyg.push(x.tydzien);
      (by[x.sid] = by[x.sid] || {})[x.tydzien] = x;
      odp[x.sid] = (odp[x.sid] || 0) + liczba(x.odp);
    });
    tyg.sort(function (a, b) { return b.localeCompare(a); });
    tyg = tyg.slice(0, ile || 8);
    var sids = Object.keys(by).sort(function (a, b) { return (a === "*" ? -1 : b === "*" ? 1 : 0) || odp[b] - odp[a] || a.localeCompare(b); });
    return { tygodnie: tyg, wiersze: sids.map(function (sid) {
      return { sid: sid, komorki: tyg.map(function (t) {
        var x = by[sid][t];
        if (!x) return { tydzien: t, brak: true, ukryte: false, pct: null, osoby: 0 };
        var u = ukryj(x.osoby);
        return { tydzien: t, brak: false, ukryte: u, pct: u ? null : pct(liczba(x.ok), liczba(x.odp)), osoby: u ? null : liczba(x.osoby), odp: u ? null : liczba(x.odp) };
      }) };
    }) };
  }

  function rewanze(r) {
    r = r || {};
    var u = ukryj(r.osoby);
    return { ukryte: u, osoby: u ? null : liczba(r.osoby), wygrane: u ? null : liczba(r.wygrane), wszystkie: u ? null : liczba(r.wszystkie),
      pokonane: u ? null : liczba(r.pokonane), pct: u ? null : pct(liczba(r.wygrane), liczba(r.wszystkie)) };
  }

  // Testy A/B ({ test: { wariant: liczby } }): bilety zdane i „czy uczy” w powtórkach z tych lekcji, każde z własną grupą.
  function ab(t) {
    var out = [];
    Object.keys(t || {}).sort().forEach(function (test) {
      var w = t[test] || {};
      out.push({ test: test, warianty: Object.keys(w).sort().map(function (v) {
        var x = w[v] || {}, ub = ukryj(x.osoby), uo = ukryj(x.osoby_odp);
        return { wariant: v, bilety: ub ? null : liczba(x.bilety), zdanePct: ub ? null : pct(liczba(x.zdane), liczba(x.bilety)), osoby: ub ? null : liczba(x.osoby), ukryteBilety: ub,
          uczyPct: uo ? null : pct(liczba(x.ok), liczba(x.odp)), odp: uo ? null : liczba(x.odp), osobyOdp: uo ? null : liczba(x.osoby_odp), ukryteUczy: uo };
      }) });
    });
    return out;
  }

  // Lista oczekujących (z podsumowania „*”): kierunki od największej liczby; poniżej 5 osób bez liczby.
  function oczekujacy(o) {
    o = o || {};
    var p = liczba(o.potwierdzone);
    return { potwierdzone: ukryj(p) ? null : p, ukryte: ukryj(p),
      kierunki: (Array.isArray(o.kierunki) ? o.kierunki : []).slice().sort(function (a, b) { return liczba(b.n) - liczba(a.n) || String(a.nazwa).localeCompare(String(b.nazwa), "pl"); })
        .map(function (k) { var u = ukryj(k.n); return { nazwa: k.nazwa, n: u ? null : liczba(k.n), ukryte: u }; }),
      zrodla: zrodla(o.zrodla) };
  }
  // Źródła ({ źródło: liczba }): od największej; puste = „bez źródła” (klucz "").
  function zrodla(z) {
    return Object.keys(z || {}).map(function (k) { var n = liczba(z[k]), u = ukryj(n); return { zrodlo: k, n: u ? null : n, ukryte: u, sort: n }; })
      .sort(function (a, b) { return b.sort - a.sort || a.zrodlo.localeCompare(b.zrodlo); });
  }

  // Roczniki do wyboru: „*” (wszystkie) pierwszy, potem roczniki z bazy, które mają podsumowanie, na końcu '' (konta bez profilu).
  function roczniki(lista, dane) {
    dane = dane || {};
    var out = [];
    if (dane["*"]) out.push({ id: "*" });
    (Array.isArray(lista) ? lista : []).forEach(function (r) { if (r && r.id && dane[r.id]) out.push({ id: r.id, r: r }); });
    if (dane[""]) out.push({ id: "" });
    return out;
  }

  return { MIN: MIN, FLAGA: FLAGA, zrodloZ: zrodloZ, wejscie: wejscie, pct: pct, ukryj: ukryj, kroki: kroki, powroty: powroty,
    tygodnie: tygodnie, uczy: uczy, rewanze: rewanze, ab: ab, oczekujacy: oczekujacy, zrodla: zrodla, roczniki: roczniki };
});
