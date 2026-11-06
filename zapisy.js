/* Skrót: lista oczekujących na kierunki (etap 5 „Systemy z Zdawalni w Skrócie”). Bez DOM i bez logowania.
   Ekran wejścia w index.html (krok „Inny kierunek”) i link z plan.skrotbm.pl (?zapisz=plan) wołają window.SKROT_ZAPISY;
   testy biorą to z require("./zapisy.js"). Te same zasady sprawdzania są w funkcji Edge supabase/functions/zapisz-sie.
   Adres i klucz publishable są publiczne z założenia (jak w skrot-supabase.js). */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SKROT_ZAPISY = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var URL = "https://zkyxujkdrovfzpasocmv.supabase.co", KEY = "sb_publishable_lVORMiTz9DlQaekBlfKf3Q_qPbKDHxb";
  var str = function (v, max) { return typeof v === "string" ? v.trim().slice(0, max) : ""; };
  var int = function (v, lo, hi) { var n = Number(v); return Number.isInteger(n) && n >= lo && n <= hi ? n : null; };

  // Sprawdzenie formularza: { error } albo { dane } gotowe do wysłania.
  function sprawdz(b) {
    b = b || {};
    var email = str(b.email, 300).toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email) || email.length > 254) return { error: "Wpisz poprawny adres e-mail.", pole: "email" };
    var kid = str(b.kierunek_id, 40), ktxt = str(b.kierunek_tekst, 120);
    if (kid && !/^[a-z]+-[a-z0-9]+-[012]-(st|nst)$/.test(kid)) kid = "";
    if (!kid && ktxt.length < 2) return { error: "Wybierz kierunek z listy albo wpisz jego nazwę.", pole: "kierunek" };
    if (b.zgoda !== true) return { error: "Zaznacz zgodę na jeden mail w dniu startu kierunku.", pole: "zgoda" };
    var z = str(b.zrodlo, 40);
    return { dane: { akcja: "zapisz", email: email, kierunek_id: kid || null, kierunek_tekst: kid ? null : ktxt, wydzial: str(b.wydzial, 20) || null,
      stopien: int(b.stopien, 0, 2), rok: int(b.rok, 1, 6), tryb: b.tryb === "st" || b.tryb === "nst" ? b.tryb : null,
      zrodlo: /^[a-z0-9._-]{1,40}$/.test(z) ? z : null, zgoda: true, www: str(b.www, 200) } };
  }
  // Link z maila: #/zapis/potwierdz.<token> albo #/zapis/usun.<token>.
  function zLinku(hash) {
    var m = /^#\/zapis\/(potwierdz|usun)\.([A-Za-z0-9_-]{20,80})$/.exec(String(hash || ""));
    return m ? { akcja: m[1], token: m[2] } : null;
  }
  // Źródło zapisu z adresu (?zapisz=plan, ?zrodlo=…): krótki, bezpieczny napis albo null.
  function zrodloZ(search) {
    var p = /[?&](?:zapisz|zrodlo)=([a-z0-9._-]{1,40})/.exec(String(search || ""));
    return p ? p[1] : null;
  }
  // Lista do wyboru: kierunki z bazy pogrupowane po nazwie (I i II stopień razem), od A do Z, bez tych, które już działają.
  function grupuj(list) {
    var by = {};
    (list || []).forEach(function (k) { if (!k || k.jest) return; var n = k.nazwa; (by[n] = by[n] || { nazwa: n, wydzial: k.wydzial, stopnie: [] }).stopnie.push({ id: k.id, stopien: k.stopien, lata: k.lata || [] }); });
    return Object.keys(by).sort(function (a, b) { return a.localeCompare(b, "pl"); }).map(function (n) { by[n].stopnie.sort(function (a, b) { return a.stopien - b.stopien; }); return by[n]; });
  }

  function post(path, body, fetchImpl) {
    var f = fetchImpl || (typeof fetch !== "undefined" ? fetch : null);
    if (!f) return Promise.reject(Object.assign(new Error("Brak połączenia."), { code: "offline" }));
    return f(URL + path, { method: "POST", headers: { "Content-Type": "application/json", apikey: KEY, Authorization: "Bearer " + KEY }, body: JSON.stringify(body || {}) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, j: j }; }); },
        function () { throw Object.assign(new Error("Brak internetu. Spróbuj jeszcze raz."), { code: "offline" }); });
  }
  function kierunki(fetchImpl) {
    return post("/rest/v1/rpc/nauka_kierunki_zapisy", {}, fetchImpl).then(function (r) { return Array.isArray(r.j) ? r.j : []; }, function () { return []; });
  }
  function wynik(r) {
    if (r.status === 404 && r.j && r.j.code === "NOT_FOUND") throw Object.assign(new Error("Zapisy jeszcze nie działają. Napisz na zdawalni.support@gmail.com."), { code: "not_deployed" });
    if (!r.j || !r.j.ok) throw Object.assign(new Error((r.j && r.j.message) || "Coś poszło nie tak. Spróbuj za chwilę."), { code: (r.j && r.j.code) || "error" });
    return r.j;
  }
  function zapisz(b, fetchImpl) {
    var v = sprawdz(b);
    if (v.error) return Promise.reject(Object.assign(new Error(v.error), { code: "invalid", pole: v.pole }));
    return post("/functions/v1/zapisz-sie", v.dane, fetchImpl).then(wynik);
  }
  function link(akcja, token, fetchImpl) { return post("/functions/v1/zapisz-sie", { akcja: akcja, token: token }, fetchImpl).then(wynik); }

  // Eksport CSV dla administratora: średnik i BOM, żeby polski Excel od razu dobrze czytał znaki i kolumny.
  var CSV_KOL = ["email", "wydzial", "kierunek", "kierunek_id", "stopien", "rok", "tryb", "zrodlo", "zapis", "potwierdzony"];
  function csv(wiersze) {
    var pole = function (v) { var t = v == null ? "" : String(v); if (/^[=+\-@]/.test(t)) t = "'" + t; return /[";\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
    return "\ufeff" + [CSV_KOL.join(";")].concat((wiersze || []).map(function (w) { return CSV_KOL.map(function (k) { return pole(w[k]); }).join(";"); })).join("\r\n") + "\r\n";
  }

  return { URL: URL, csv: csv, sprawdz: sprawdz, zLinku: zLinku, zrodloZ: zrodloZ, grupuj: grupuj, kierunki: kierunki, zapisz: zapisz,
    potwierdz: function (t, f) { return link("potwierdz", t, f); }, usun: function (t, f) { return link("usun", t, f); } };
});
