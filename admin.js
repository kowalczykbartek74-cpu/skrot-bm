/* Skrót: panel administratora (etap 11 „Systemy z Zdawalni w Skrócie”). Bez DOM i bez bazy.
   Port matura-app: app/admin/karnety (ręczny dostęp, „Podgląd pakietu” z lib/tier-preview.ts) i app/admin/zaproszenia
   (tu: linki ze źródłem ?z=…). Baza: supabase/skrot-v38-admin.sql.
   1. Źródła wejść: pierwsze źródło wizyty (?z=, a także ?zrodlo= i ?zapisz= z etapu 5) w sessionStorage „skrot-zrodlo”;
      dopisywane do zapisu na listę oczekujących, konta i okresu próbnego (nauka_zrodlo_ustaw) i zakupu (client_reference_id).
      Generator linków: napis → bezpieczne źródło ^[a-z0-9-]{2,40}$ → link do skopiowania.
   2. Karnety: sprawdzenie formularza, stan wiersza, komunikaty błędów bazy. Wydaje tylko administrator (D10).
   3. Podgląd jako (gość / okres próbny / płatny / inny rocznik): tylko w przeglądarce administratora, sessionStorage
      „skrot-podglad” (12 godzin, jak TIER_PREVIEW_HOURS), prawdziwy wybór rocznika („skrot-rocznik”) zostaje nietknięty.
      W podglądzie wszystkie zapisy są zablokowane: zapisDozwolony(fn) przepuszcza tylko odczyty z listy CZYTA.
   index.html i skrot-supabase.js biorą to z window.SKROT_ADMIN (ładowany przed rocznik.js), testy z require("./admin.js"). */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SKROT_ADMIN = api;
})(typeof self !== "undefined" ? self : this, function (root) {
  "use strict";

  // ---------- 1) źródła wejść ----------
  var KLUCZ_ZRODLO = "skrot-zrodlo";
  var RE_ZRODLO = /^[a-z0-9-]{2,40}$/;            // nowe linki z generatora
  var RE_ZRODLO_BAZA = /^[a-z0-9._-]{1,40}$/;     // to, co przyjmuje baza (także stare ?zapisz=plan)
  var PL = { "ą": "a", "ć": "c", "ę": "e", "ł": "l", "ń": "n", "ó": "o", "ś": "s", "ź": "z", "ż": "z" };

  // Źródło z adresu: ?z=… (pierwszeństwo), potem ?zrodlo=… i ?zapisz=…. Napis spoza wzoru bazy → null.
  function zrodloZ(search) {
    var s = String(search || "");
    var keys = ["z", "zrodlo", "zapisz"];
    for (var i = 0; i < keys.length; i++) {
      var m = new RegExp("[?&]" + keys[i] + "=([^&#]*)").exec(s);
      if (!m) continue;
      var v = "";
      try { v = decodeURIComponent(m[1]).toLowerCase(); } catch (e) { v = ""; }
      if (RE_ZRODLO_BAZA.test(v)) return v;
    }
    return null;
  }
  // Pierwsze źródło wizyty: zapamiętane wygrywa; inaczej z adresu. null = wizyta bez źródła.
  function pierwszeZrodlo(zapamietane, search) {
    if (zapamietane && RE_ZRODLO_BAZA.test(zapamietane)) return zapamietane;
    return zrodloZ(search);
  }
  // Generator: dowolny napis → źródło (małe litery, bez polskich znaków, każdy inny znak → „-”). Zwraca { ok, zrodlo } albo { ok:false, blad }.
  function zrodloNorm(t) {
    var s = String(t == null ? "" : t).trim().toLowerCase().replace(/[ąćęłńóśźż]/g, function (c) { return PL[c]; });
    try { s = s.normalize("NFD").replace(/[̀-ͯ]/g, ""); } catch (e) { /* stara przeglądarka */ }
    return s.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function zrodloSprawdz(t) {
    var z = zrodloNorm(t);
    if (!z) return { ok: false, blad: "Wpisz nazwę źródła, np. ig-zarzadzanie." };
    if (z.length < 2) return { ok: false, blad: "Źródło musi mieć co najmniej 2 znaki.", zrodlo: z };
    if (z.length > 40) return { ok: false, blad: "Źródło może mieć najwyżej 40 znaków.", zrodlo: z };
    if (!RE_ZRODLO.test(z)) return { ok: false, blad: "Tylko litery a–z, cyfry i myślnik.", zrodlo: z };
    return { ok: true, zrodlo: z };
  }
  // Link ze źródłem: baza = adres strony (bez parametrów i #), np. https://skrotbm.pl/.
  function link(baza, zrodlo) {
    var b = String(baza || "").replace(/[?#].*$/, "");
    if (/^https?:\/\/[^/]+$/i.test(b)) b += "/";
    return b + "?z=" + zrodlo;
  }
  // client_reference_id dla Stripe: „<konto>__<KOD>__<źródło>” (kod może być pusty). Bez źródła: jak dotąd (kody polecające, v17).
  // Źródło z „_” pomijamy, bo „__” rozdziela części.
  function refStripe(uid, kod, zrodlo) {
    var z = zrodlo && /^[a-z0-9.-]{1,40}$/.test(zrodlo) ? zrodlo : "";
    if (!z) return kod ? uid + "__" + kod : String(uid);
    return [uid, kod || "", z].join("__");
  }

  // ---------- 2) karnety ----------
  var RE_EMAIL = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/;
  var RE_DATA = /^\d{4}-\d{2}-\d{2}$/;
  var dodajDni = function (iso, n) { var d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  // Formularz karnetu → { ok, args } (argumenty nauka_admin_karnet_wydaj) albo { error, pole }. dzis = "RRRR-MM-DD".
  function karnetSprawdz(f, dzis) {
    f = f || {};
    var email = String(f.email || "").trim().toLowerCase();
    var doKiedy = String(f.doKiedy || "").trim();
    var powod = String(f.powod || "").trim();
    var rocznik = String(f.rocznik || "").trim();
    if (!RE_EMAIL.test(email) || email.length > 254) return { error: "Wpisz poprawny adres e-mail.", pole: "email" };
    if (!RE_DATA.test(doKiedy)) return { error: "Wybierz datę końca karnetu.", pole: "doKiedy" };
    if (dzis && doKiedy < dzis) return { error: "Data końca nie może być w przeszłości.", pole: "doKiedy" };
    if (dzis && doKiedy > dodajDni(dzis, 400)) return { error: "Karnet może trwać najwyżej 400 dni.", pole: "doKiedy" };
    if (powod.length < 3) return { error: "Wpisz powód (co najmniej 3 znaki), np. „pomoc przy testach”.", pole: "powod" };
    if (powod.length > 200) return { error: "Powód może mieć najwyżej 200 znaków.", pole: "powod" };
    return { ok: true, args: { p_email: email, p_do: doKiedy, p_rocznik: rocznik || null, p_powod: powod } };
  }
  // Gotowe okresy w formularzu (dni od dziś).
  var OKRESY = [[7, "7 dni"], [30, "30 dni"], [90, "90 dni"]];
  function karnetDo(dzis, dni) { return dodajDni(dzis, dni); }
  var KARNET_BLEDY = {
    not_admin: "Karnety wydaje tylko administrator.",
    email: "Wpisz poprawny adres e-mail.",
    data: "Data końca: od dziś do 400 dni.",
    rocznik: "Nie ma takiego rocznika.",
    powod: "Wpisz powód (3–200 znaków).",
    ma_dostep: "Ta osoba ma już opłacony dostęp do {0}. Karnet go nie zmienia.",
    brak: "Nie ma karnetu dla tego adresu.",
    nie_karnet: "To dostęp opłacony, nie karnet. Cofnąć można tylko karnet.",
    juz_cofniety: "Ten karnet jest już cofnięty.",
    not_enabled: "Karnety nie są jeszcze włączone (SQL v38).",
    offline: "Brak internetu. Spróbuj za chwilę.",
  };
  function karnetBlad(r) {
    var code = (r && r.code) || "error";
    var t = KARNET_BLEDY[code] || "Nie udało się. Spróbuj za chwilę.";
    return t.replace("{0}", r && r.do_kiedy ? data(r.do_kiedy) : "");
  }
  var STANY = { aktywny: "aktywny", wygasl: "wygasł", cofniety: "cofnięty" };
  function karnetStan(row, dzis) {
    if (!row) return null;
    if (row.cofniety_at) return "cofniety";
    return row.do_kiedy && dzis && row.do_kiedy < dzis ? "wygasl" : "aktywny";
  }
  // Lista z bazy: aktywne najpierw, potem od najnowszego wydania.
  function karnetyLista(list, dzis) {
    var rank = { aktywny: 0, wygasl: 1, cofniety: 2 };
    return (Array.isArray(list) ? list : []).map(function (r) { var s = karnetStan(r, dzis); return Object.assign({}, r, { stan: s, stanTxt: STANY[s] }); })
      .sort(function (a, b) { return rank[a.stan] - rank[b.stan] || String(b.wydano_at || "").localeCompare(String(a.wydano_at || "")); });
  }
  function data(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || "")); return m ? m[3] + "." + m[2] + "." + m[1] : String(iso || ""); }

  // ---------- 3) podgląd jako ----------
  var KLUCZ_PODGLAD = "skrot-podglad";
  var PODGLAD_GODZ = 12;
  var TRYBY = ["gosc", "proba", "platny"];
  var TRYB_TXT = { gosc: "Gość (konto bez dostępu)", proba: "Okres próbny", platny: "Płatny dostęp" };
  var RE_ROCZNIK = /^[a-z]+-[a-z0-9]+-[012]-(st|nst)-20[0-9]{2}$/;
  // Co zapisać w sessionStorage: { tryb, rocznik (albo null = jak teraz), od (ms) }.
  function podgladNowy(tryb, rocznik, teraz) {
    if (TRYBY.indexOf(tryb) < 0) return null;
    return { tryb: tryb, rocznik: rocznik && RE_ROCZNIK.test(rocznik) ? rocznik : null, od: teraz || Date.now() };
  }
  // Odczyt: zły napis, nieznany tryb albo starszy niż 12 h → null.
  function podgladZ(raw, teraz) {
    var p = null;
    try { p = typeof raw === "string" ? JSON.parse(raw) : raw; } catch (e) { return null; }
    if (!p || TRYBY.indexOf(p.tryb) < 0 || typeof p.od !== "number") return null;
    if ((teraz || Date.now()) - p.od > PODGLAD_GODZ * 36e5 || p.od - (teraz || Date.now()) > 6e4) return null;
    return { tryb: p.tryb, rocznik: p.rocznik && RE_ROCZNIK.test(p.rocznik) ? p.rocznik : null, od: p.od };
  }
  // Jak strona ma widzieć konto w podglądzie (pola window.skrot). Administrator w podglądzie nie jest administratorem.
  function podgladKonto(p, teraz, dostepDo) {
    var t = teraz || Date.now();
    if (!p) return null;
    if (p.tryb === "gosc") return { admin: false, paid: false, paidAccount: false, trialUntil: null, trialCan: true, until: null, plan: null };
    if (p.tryb === "proba") return { admin: false, paid: true, paidAccount: true, trialUntil: new Date(t + 3 * 864e5).toISOString(), trialCan: false, until: null, plan: null };
    return { admin: false, paid: true, paidAccount: true, trialUntil: null, trialCan: false, until: dostepDo || null, plan: "rok" };
  }
  // Napis na pasku: „Podgląd: okres próbny · Zarządzanie, 1. rok”.
  function podgladOpis(p, nazwaRocznika) {
    if (!p) return "";
    return "Podgląd: " + TRYB_TXT[p.tryb] + (p.rocznik && nazwaRocznika ? " · " + nazwaRocznika : "");
  }
  // Odczyty, które podgląd przepuszcza (wszystko inne, także nieznane nowe funkcje, jest blokowane).
  var CZYTA = ["nauka_ja", "nauka_ping", "nauka_rocznik_moj", "nauka_bossy", "nauka_haslo_dzis", "nauka_kierunek_stat", "nauka_misje",
    "nauka_moje_stan", "nauka_monety_historia", "nauka_paczka", "nauka_paczka_podglad", "nauka_polec_moj", "nauka_polec_sprawdz",
    "nauka_profil_moj", "nauka_profil_nauki", "nauka_przypomnienia_moje", "nauka_pyt_rok", "nauka_pyt_trudnosc", "nauka_ranking",
    "nauka_rekordy", "nauka_sklep_stan", "nauka_urzadzenia_moje", "nauka_sklep_katalog"];
  function zapisDozwolony(fn) { return CZYTA.indexOf(String(fn || "")) >= 0; }
  // Zapis do tabeli (supabase-js): insert/upsert/update/delete są zapisami, select nie.
  function metodaZapisu(m) { return ["insert", "upsert", "update", "delete"].indexOf(m) >= 0; }

  // ---------- przeglądarka: sessionStorage (bez DOM) ----------
  var ss = function () { try { return root && root.sessionStorage; } catch (e) { return null; } };
  function zrodloWizyty() {
    var s = ss(); if (!s) return null;
    try { return pierwszeZrodlo(s.getItem(KLUCZ_ZRODLO), null); } catch (e) { return null; }
  }
  function podglad() {
    var s = ss(); if (!s) return null;
    var p = null;
    try { p = podgladZ(s.getItem(KLUCZ_PODGLAD)); } catch (e) { return null; }
    if (!p) try { s.removeItem(KLUCZ_PODGLAD); } catch (e) { /* nic */ }
    return p;
  }
  function podgladUstaw(p) {
    var s = ss(); if (!s) return false;
    try { if (p) s.setItem(KLUCZ_PODGLAD, JSON.stringify(p)); else s.removeItem(KLUCZ_PODGLAD); return true; } catch (e) { return false; }
  }
  // Na starcie strony: zapamiętaj pierwsze źródło tej wizyty (raz).
  (function zapamietaj() {
    var s = ss(); if (!s || !root.location) return;
    try {
      if (s.getItem(KLUCZ_ZRODLO)) return;
      var z = zrodloZ(root.location.search);
      if (z) s.setItem(KLUCZ_ZRODLO, z);
    } catch (e) { /* tryb prywatny */ }
  })();

  return { RE_ZRODLO: RE_ZRODLO, KLUCZ_ZRODLO: KLUCZ_ZRODLO, KLUCZ_PODGLAD: KLUCZ_PODGLAD, PODGLAD_GODZ: PODGLAD_GODZ, TRYBY: TRYBY, TRYB_TXT: TRYB_TXT,
    OKRESY: OKRESY, STANY: STANY, KARNET_BLEDY: KARNET_BLEDY, CZYTA: CZYTA,
    zrodloZ: zrodloZ, pierwszeZrodlo: pierwszeZrodlo, zrodloNorm: zrodloNorm, zrodloSprawdz: zrodloSprawdz, link: link, refStripe: refStripe,
    karnetSprawdz: karnetSprawdz, karnetDo: karnetDo, karnetBlad: karnetBlad, karnetStan: karnetStan, karnetyLista: karnetyLista, data: data,
    podgladNowy: podgladNowy, podgladZ: podgladZ, podgladKonto: podgladKonto, podgladOpis: podgladOpis, zapisDozwolony: zapisDozwolony, metodaZapisu: metodaZapisu,
    zrodloWizyty: zrodloWizyty, podglad: podglad, podgladUstaw: podgladUstaw };
});
