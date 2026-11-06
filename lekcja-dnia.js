/* Skrót: „Dla Ciebie na dziś” bez DOM i bazy (spec „Dziś · 5 min + 2 lekcje”, etap 1; raport etapu 0: docs/lekcja-dnia/etap-0.md).
   Układamy, nie generujemy: karta 5 min i dwie lekcje z klocków, które już są na stronie (sekcje lekcji, podsumowania
   „5 minut”, quiz, fiszki, rewanże, gry, Staś, kazusy). Plik ładują index.html (window.SKROT_LD) i testy
   (tests/lekcja-dnia.test.js). Wszystkie liczby, które da się stroić, są w WAGI i w KATALOG.

   Wejście (liczy index.html, tu tylko dane):
   temat = {
     id, sid, title,
     p,            // topicPriority(m).p: jedyna miara ważności tematu (nie liczymy jej drugi raz)
     why,          // topicPriority(m).why (teksty), opcjonalnie
     zapominanie,  // 0–1: 1 − średnia retrievability FSRS kart tematu (0, gdy brak kart)
     rewanz,       // true, gdy rewanż z tego tematu jest na dziś
     zajecia,      // "dzis" | "wczoraj" | "jutro" | "pojutrze" | null
     nieprzeczytany, // temat zajęć jeszcze nieprzeczytany (podsumowanie / lekcja)
     egzaminDni,   // dni do najbliższego zaliczenia przedmiotu albo null
     poziom,       // "nowy" | "zrobione" | "utrwalone" | "opanowane" (poziomy v4)
     boss,         // aktywny Boss przedmiotu
     sekcjaOd,     // pierwsza nieprzerobiona sekcja (domyślnie 0)
     tresc: { sekcje, check, wizualizacje, po, stas, haslo, pojecia, fiszki, abcd, quiz, bilet, recap, cwiczenia,
              worked, kazus, atomy, gen, rewanze }   // liczby albo true/false, braki = 0
   }
   kontekst = {
     dayN, teraz (minuty od północy),
     profil: null | { blockMinutes, bedtime "HH:MM", stressHigh, motivations[], clearest },
     dobraPora,     // false = poza najjaśniejszą porą z profilu (rytm); null = nie wiadomo
     rewanzeDzis, fiszkiZalegle,   // liczby na rozgrzewkę karty
     nieudaneDni,   // seria dni z nieudaną nauką
     wDrodze,       // przełącznik „Jestem w drodze”
     hist: {
       dzis: [id tematów już ćwiczonych dziś (karta, lekcje)],
       pominiete: { id: ile razy „Inny temat” dziś },
       przedCzasem: ile lekcji / kart z rzędu skończonych przed czasem,
       ostatnieLekcje: [[mech…], [mech…]]   // mechaniki dwóch ostatnich lekcji, najnowsza pierwsza
       mech: { mechId: [{ d: dayN, stan: "ukonczona" | "porzucona" | "pominieta", dobrze: bool }] }
     }
   } */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SKROT_LD = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // ---------------- wagi (4.4 specu + progi trybów) ----------------
  var WAGI = {
    zapominanie: 25, rewanz: 20, zajecia: 10, dzis: -30, pominiety: -40, pominietyProg: 2,
    doUtrwalenia: 15,     // lekcja 2: temat Zrobione → Utrwalone
    nowyZlaPora: -10,     // nowy temat poza najjaśniejszą porą
    kolokwiumDni: 7, bezNowegoDni: 2, tonWarnDni: 3,
    przedSnemMin: 60, poSnieMin: 180, nieudaneLekko: 3, przedCzasemProg: 3,
    porzuconaProg: 3, porzuconaDni: 7, lubianaDni: 14, lubianaProg: 2,
    nowoscKara: 2, lubianaBonus: 1.5,
  };
  var DLUGOSCI = [15, 20, 25], DOMYSLNA_DLUGOSC = 20, DOMYSLNIE_GRA_CO = 5, PODSUMOWANIE_MIN = 1;

  // ---------------- katalog mechanik (6.2, z zastępstwami z etapu 0) ----------------
  // typ: ucze | gram | sprawdzam | tworze; energia: spokojna | zywa; min: minuty w lekcji; naCzas: gra / pytania na czas;
  // pisanie: wymaga pisania albo liczenia na kartce (nie ma w trybie „w drodze”); rola: miejsca w szablonie.
  var t0 = function (x) { return +x || 0; };
  var KATALOG = [
    { id: "haslo", nazwa: "Zgadnij hasło", typ: "gram", energia: "spokojna", min: 1, rola: ["haczyk", "przerwa"], wymaga: function (c) { return t0(c.haslo) >= 1; } },
    { id: "pary", nazwa: "Pary", typ: "gram", energia: "zywa", min: 1.5, naCzas: true, rola: ["haczyk"], wymaga: function (c) { return t0(c.pojecia) >= 6 || t0(c.fiszki) >= 6; } },
    { id: "wyjasnienie", nazwa: "Wyjaśnienie", typ: "ucze", energia: "spokojna", min: 3, rola: ["ucze"], nowe: true, wiele: true, wymaga: function (c) { return t0(c.sekcje) >= 1; } },
    { id: "przypomnienie", nazwa: "Przypomnienie", typ: "ucze", energia: "spokojna", min: 2, rola: ["ucze"], wiele: true, wymaga: function (c) { return !!c.po || !!c.recap; } },
    { id: "frun", nazwa: "Fruń", typ: "gram", energia: "zywa", min: 1.5, naCzas: true, wiele: true, rola: ["przerwa"], wymaga: function (c) { return t0(c.abcd) >= 8; } },
    { id: "przejdz", nazwa: "Przejdź", typ: "gram", energia: "zywa", min: 1.5, naCzas: true, wiele: true, rola: ["przerwa"], wymaga: function (c) { return t0(c.abcd) >= 8; } },
    { id: "stas", nazwa: "Staś się myli", typ: "sprawdzam", energia: "spokojna", min: 2.5, rola: ["sprawdzam"], wymaga: function (c) { return !!c.stas; } },
    { id: "rozroznij", nazwa: "Rozróżnij", typ: "sprawdzam", energia: "zywa", min: 1, rola: ["sprawdzam"], wymaga: function (c) { return t0(c.atomy) >= 2; } },
    // Zastępstwo z etapu 0: pytania z quizu tematu z „Pewny / Zgaduję” i „Dlaczego?”.
    { id: "pytania", nazwa: "Pytania", typ: "sprawdzam", energia: "spokojna", min: 2, rola: ["sprawdzam"], wymaga: function (c) { return t0(c.quiz) >= 3; } },
    { id: "rewanze", nazwa: "Rewanże", typ: "sprawdzam", energia: "spokojna", min: 1.5, rola: ["poGrze"], wymaga: function (c) { return t0(c.rewanze) >= 1; } },
    { id: "wyjasnij", nazwa: "Wyjaśnij", typ: "tworze", energia: "spokojna", min: 2.5, pisanie: true, rola: ["tworze"], wymaga: function (c) { return !!c.recap; } },
    { id: "cwiczenie", nazwa: "Ćwiczenie", typ: "tworze", energia: "spokojna", min: 3, pisanie: true, rola: ["tworze"], wymaga: function (c) { return t0(c.cwiczenia) >= 1; } },
    { id: "zadanie", nazwa: "Zadanie krok po kroku", typ: "tworze", energia: "spokojna", min: 3, pisanie: true, opcje: ["zdjecie"], rola: ["tworze"], wymaga: function (c) { return t0(c.worked) >= 1; } },
    { id: "liczbowa", nazwa: "Karta liczbowa", typ: "tworze", energia: "spokojna", min: 2, pisanie: true, opcje: ["zdjecie"], rola: ["tworze"], wymaga: function (c) { return t0(c.gen) >= 1; } },
    { id: "kazus", nazwa: "Kazus", typ: "tworze", energia: "spokojna", min: 3.5, pisanie: true, rola: ["tworze"], wymaga: function (c) { return t0(c.kazus) >= 1; } },
    { id: "drabina", nazwa: "Drabina", typ: "sprawdzam", energia: "zywa", min: 2.5, naCzas: true, rola: ["final"], wymaga: function (c) { return t0(c.abcd) >= 6; } },
    { id: "bilet", nazwa: "Bilet wyjścia", typ: "sprawdzam", energia: "spokojna", min: 1.5, rola: ["final"], wymaga: function (c) { return t0(c.bilet) >= 1; } },
  ];
  var MECH = {};
  KATALOG.forEach(function (m) { MECH[m.id] = m; });
  // Kolejność preferencji w każdej roli (pierwsza = domyślna). Przedmioty ilościowe: zadanie przed ćwiczeniem i Wyjaśnij.
  var ROLE = {
    haczyk: ["haslo", "pary"],
    ucze: ["wyjasnienie", "przypomnienie"],
    przerwa: ["frun", "przejdz", "haslo"],
    poGrze: ["rewanze"],
    sprawdzam: ["stas", "rozroznij", "pytania"],
    tworze: ["wyjasnij", "cwiczenie", "zadanie", "liczbowa", "kazus"],
    final: ["drabina", "bilet"],
  };
  // Typy, które nie znikają całkiem, gdy uczeń je porzuca (6.4): mogą tylko zmienić formę.
  var ZAWSZE = { sprawdzam: true, tworze: true };

  // ---------------- drobne ----------------
  var has = function (a, x) { return (a || []).indexOf(x) >= 0; };
  var cnt = function (t) { return (t && t.tresc) || {}; };
  function hm(s) { var m = /^(\d{1,2}):(\d{2})$/.exec(String(s || "")); return m ? +m[1] * 60 + +m[2] : null; }
  /** Minuty do snu albo null; po godzinie snu (do 3 h) liczy się jak „przed snem” (0). */
  function doSnu(profil, teraz) {
    var b = hm(profil && profil.bedtime);
    if (b == null || teraz == null) return null;
    var d = (b - teraz + 1440) % 1440;
    return d >= 1440 - WAGI.poSnieMin ? 0 : d;
  }
  function przedSnem(k) { var d = doSnu(k.profil, k.teraz); return d != null && d <= WAGI.przedSnemMin; }
  var stres = function (k) { return !!(k.profil && k.profil.stressHigh); };
  var motyw = function (k, x) { return has(k.profil && k.profil.motivations, x); };
  var nieNowy = function (t) { return t.poziom && t.poziom !== "nowy"; };

  /** Ile części ma podsumowanie „5 minut” (true = nie wiadomo jeszcze, przyjmujemy 5). */
  function czesciPo(c) { return c.po === true ? 5 : t0(c.po); }
  /** Pamięć karty FSRS dziś (0–1) z wpisu srs [pudełko, termin, stabilność, trudność, powtórki, pomyłki, stan, dzień ostatniej].
   *  Karty sprzed FSRS: 1 przed terminem, 0,5 po terminie. Nowa karta (pudełko 0) → null (nie liczy się do zapominania). */
  function pamiec(v, t) {
    if (!Array.isArray(v) || !(v[0] > 0)) return null;
    if (v.length >= 8 && v[2] > 0) { var el = Math.max(0, t - v[7]); return Math.pow(1 + (19 / 81) * el / v[2], -0.5); }
    return t < v[1] ? 1 : 0.5;
  }

  // ---------------- Hasło w lekcji (lokalnie, bez bazy) ----------------
  /** Wielkie litery A–Z bez polskich znaków („Łąka” → „LAKA”), bez spacji i cyfr. */
  function hasloNorm(s) { return String(s || "").replace(/[łŁ]/g, "L").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z]/g, ""); }
  /** Ocena próby jak w Haśle dnia: 2 = litera na miejscu, 1 = jest w słowie gdzie indziej, 0 = nie ma (powtórzone litery liczone uczciwie). */
  function hasloOcena(guess, word) {
    var g = hasloNorm(guess), w = hasloNorm(word), out = [], left = {};
    for (var i = 0; i < w.length; i++) { if (g[i] === w[i]) out[i] = 2; else { out[i] = 0; left[w[i]] = (left[w[i]] || 0) + 1; } }
    for (var j = 0; j < w.length; j++) if (out[j] !== 2 && g[j] && left[g[j]] > 0) { out[j] = 1; left[g[j]]--; }
    return out;
  }

  // ---------------- aktywność na stronie (4.2): dziennik dni i odpowiedzi ----------------
  /** Seria nieudanych dni przed dziś: dni z planem, w których nic z bloku nie zostało zrobione (dzień bez wejścia przerywa serię). dni: { dayN: { plan, done } } */
  function serieNieudanych(dni, dzis) {
    var n = 0;
    for (var d = dzis - 1; d > dzis - 30; d--) { var x = dni && dni[d]; if (!x) break; if (x.plan > 0 && !(x.done > 0)) n++; else break; }
    return n;
  }
  /** Odsetek zrobionych rzeczy z bloku w pełnych tygodniach (od najstarszego), do reviewBudget.needsLighterPlan. */
  function tygodnie(dni, dzis, ile) {
    var out = [];
    for (var w = (ile || 4); w >= 1; w--) {
      var plan = 0, done = 0;
      for (var d = dzis - 7 * w; d < dzis - 7 * (w - 1); d++) { var x = dni && dni[d]; if (x) { plan += x.plan || 0; done += Math.min(x.done || 0, x.plan || 0); } }
      if (plan > 0) out.push(done / plan);
    }
    return out;
  }
  /** Dziennik odpowiedzi → kształt z learner.js: { score, difficulty, minuteOfDay, minuteInSitting, timeMs, sittingId, day }. */
  function odpowiedziLearner(log) {
    return (log || []).filter(function (x) { return x && x.d != null; }).map(function (x) {
      return { score: x.s ? 1 : 0, difficulty: x.k || "ld", minuteOfDay: x.m || 0, minuteInSitting: x.mi || 0, timeMs: x.t > 0 ? x.t : null, sittingId: String(x.sid || ""), day: x.iso || "" };
    });
  }
  /** Reszty (wynik − średnia dla trudności), jak te() w learner.js: do breaks.suggestBreak. */
  function reszty(odp) {
    var m = {};
    odp.forEach(function (x) { var k = x.difficulty, v = m[k] || (m[k] = [0, 0]); v[0] += x.score; v[1]++; });
    return odp.map(function (x) { var v = m[x.difficulty]; return { residual: x.score - v[0] / v[1], timeMs: x.timeMs }; });
  }

  // ---------------- długość lekcji i rytm gier (4.3) ----------------
  /** 15 / 20 / 25 min z bloku skupienia; 3× z rzędu przed czasem → o stopień krócej. */
  function dlugoscLekcji(profil, hist) {
    var b = profil && +profil.blockMinutes, i = DLUGOSCI.indexOf(DOMYSLNA_DLUGOSC);
    if (b > 0) i = b <= 15 ? 0 : b <= 25 ? 1 : 2;
    if (hist && hist.przedCzasem >= WAGI.przedCzasemProg) i = Math.max(0, i - 1);
    return DLUGOSCI[i];
  }
  /** Co ile minut gra-przerwa: krótkie skupienie ~4, długie ~7, bez profilu 5. */
  function graCo(profil) {
    var b = profil && +profil.blockMinutes;
    if (!(b > 0)) return DOMYSLNIE_GRA_CO;
    return b <= 15 ? 4 : b >= 30 ? 7 : 5;
  }

  // ---------------- punktacja tematu (4.4) ----------------
  function pominiety(t, hist) { return ((hist && hist.pominiete) || {})[t.id] >= WAGI.pominietyProg; }
  function wynikTematu(t, k) {
    var hist = (k && k.hist) || {}, w = +t.p || 0;
    w += WAGI.zapominanie * Math.max(0, Math.min(1, +t.zapominanie || 0));
    if (t.rewanz) w += WAGI.rewanz;
    if (t.zajecia === "dzis" || t.zajecia === "jutro") w += WAGI.zajecia;
    if (has(hist.dzis, t.id)) w += WAGI.dzis;
    if (pominiety(t, hist)) w += WAGI.pominiety;
    if (k && k.dobraPora === false && !nieNowy(t)) w += WAGI.nowyZlaPora;
    return w;
  }
  /** Powody „Dlaczego to?” jako kody (tekst PL: powodTekst; EN robi słownik strony). Najwyżej 3. */
  function powody(t, extra) {
    var r = [].concat(extra || []);
    if (t.egzaminDni != null && t.egzaminDni <= WAGI.kolokwiumDni) r.push({ k: "kolokwium", dni: t.egzaminDni });
    if (t.rewanz) r.push({ k: "rewanz" });
    if (t.zajecia === "dzis" || t.zajecia === "wczoraj") r.push({ k: "po-zajeciach", kiedy: t.zajecia });
    if (t.zajecia === "jutro" || t.zajecia === "pojutrze") r.push({ k: "przed-zajeciami", kiedy: t.zajecia });
    if ((+t.zapominanie || 0) >= 0.3) r.push({ k: "zapominanie" });
    if (t.poziom === "zrobione") r.push({ k: "utrwal" });
    (t.why || []).forEach(function (s) { r.push({ k: "tekst", t: s }); });
    var seen = {};
    return r.filter(function (x) { var key = x.k + (x.t || ""); if (seen[key]) return false; seen[key] = 1; return true; }).slice(0, 3);
  }
  var KIEDY = { dzis: "dziś", wczoraj: "wczoraj", jutro: "jutro", pojutrze: "pojutrze" };
  function powodTekst(p) {
    switch (p.k) {
      case "kolokwium": return p.dni <= 0 ? "Zaliczenie dziś" : p.dni === 1 ? "Zaliczenie jutro" : "Zaliczenie za " + p.dni + " dni";
      case "rewanz": return "Czeka rewanż na dziś";
      case "po-zajeciach": return "Zajęcia z tego tematu były " + KIEDY[p.kiedy];
      case "przed-zajeciami": return "Zajęcia z tego tematu " + KIEDY[p.kiedy];
      case "zapominanie": return "Fiszki z tego tematu właśnie się zapominają";
      case "utrwal": return "Zrobione, jeszcze nieutrwalone";
      case "na-zmiane": return "Inny przedmiot na zmianę lepiej utrwala";
      case "mieszanka": return "Mieszanka tematów z zakresu";
      case "przed-snem": return "Przed snem: same powtórki, spokojnie";
      case "lekko": return "Dziś lżej: powtórki bez nowego materiału";
      case "tekst": return p.t;
      default: return "";
    }
  }

  // ---------------- tryby (3) ----------------
  /** Tryb dnia (karta) i ustawienia: { tryb, nowe, spokojnie, przedSnem, egzamin: { sid, dni } | null }. */
  function trybDnia(tematy, k) {
    var snem = przedSnem(k), lekko = snem || (k.nieudaneDni || 0) >= WAGI.nieudaneLekko;
    var ex = null;
    (tematy || []).forEach(function (t) { if (t.egzaminDni != null && t.egzaminDni >= 0 && (!ex || t.egzaminDni < ex.dni)) ex = { sid: t.sid, dni: t.egzaminDni }; });
    var blisko = ex && ex.dni <= WAGI.kolokwiumDni;
    var tryb = lekko ? "lekko" : blisko ? "przed-kolokwium" : stres(k) ? "lekko"
      : (tematy || []).some(function (t) { return (t.zajecia === "dzis" || t.zajecia === "wczoraj") && t.nieprzeczytany; }) ? "po-zajeciach"
      : (tematy || []).some(function (t) { return t.zajecia === "jutro" || t.zajecia === "pojutrze"; }) ? "przed-zajeciami" : "utrwalanie";
    var nowe = tryb !== "lekko" && !(blisko && ex.dni <= WAGI.bezNowegoDni);
    return { tryb: tryb, nowe: nowe, spokojnie: tryb === "lekko" || stres(k), przedSnem: snem, egzamin: blisko ? ex : null };
  }
  /** Tryb konkretnej lekcji z jej tematu (karta ma tryb dnia). */
  function trybTematu(t, d) {
    if (d.tryb === "lekko") return "lekko";
    if (t.egzaminDni != null && t.egzaminDni <= WAGI.kolokwiumDni) return "przed-kolokwium";
    if (t.zajecia === "dzis" || t.zajecia === "wczoraj") return "po-zajeciach";
    if (t.zajecia === "jutro" || t.zajecia === "pojutrze") return "przed-zajeciami";
    return "utrwalanie";
  }

  // ---------------- wybór tematów (6.1) ----------------
  /** Najlepszy temat spośród list (null, gdy pusto). Pominięte 2× wypadają, o ile jest coś innego. */
  function najlepszy(lista, k, bonus) {
    var hist = (k && k.hist) || {};
    var ok = lista.filter(function (t) { return !pominiety(t, hist); });
    if (!ok.length) ok = lista;
    var best = null, bw = -Infinity;
    ok.forEach(function (t) { var w = wynikTematu(t, k) + (bonus ? bonus(t) : 0); if (w > bw) { bw = w; best = t; } });
    return best;
  }
  function wybierzKarte(tematy, d, k) {
    var pick = function (f) { var l = tematy.filter(f); return l.length ? najlepszy(l, k) : null; };
    var t = null;
    if (d.tryb === "przed-kolokwium") t = pick(function (x) { return x.sid === d.egzamin.sid && (d.nowe || nieNowy(x)); }) || pick(function (x) { return x.sid === d.egzamin.sid; });
    else if (d.tryb === "po-zajeciach") t = pick(function (x) { return (x.zajecia === "dzis" || x.zajecia === "wczoraj") && x.nieprzeczytany; });
    else if (d.tryb === "przed-zajeciami") t = pick(function (x) { return x.zajecia === "jutro" || x.zajecia === "pojutrze"; });
    else if (d.tryb === "lekko") t = pick(function (x) { return nieNowy(x) || x.rewanz; });
    return t || najlepszy(tematy, k);
  }

  // ---------------- karta „Dziś · 5 min” (3) ----------------
  /** Kroki karty: rozgrzewka (rewanż albo zapominana fiszka), jeden kawałek + pytanie, 2 pytania „Pewny / Zgaduję”. */
  function ulozKarte(t, d, k) {
    if (!t) return null;
    var c = cnt(t), rew = (k.rewanzeDzis || 0) > 0 || t0(c.rewanze) > 0;
    var poPiece = !!c.po && (!d.nowe || d.tryb === "po-zajeciach" || d.tryb === "przed-zajeciami" || !t0(c.sekcje));
    var glowny = poPiece ? { k: "glowny", mech: "przypomnienie", zrodlo: "po", min: 3 }
      : d.nowe && t0(c.sekcje) ? { k: "glowny", mech: "wyjasnienie", zrodlo: "sekcja", sekcja: Math.min(t.sekcjaOd || 0, t0(c.sekcje) - 1), min: 3 }
      : { k: "glowny", mech: "przypomnienie", zrodlo: c.recap ? "recap" : "sekcja", sekcja: 0, min: 3 };
    var kroki = [
      { k: "rozgrzewka", mech: rew ? "rewanze" : "fiszki", n: rew ? 2 : 3, min: 1 },
      glowny,
      { k: "sprawdzenie", mech: "pytania", n: 2, pewnosc: true, min: 1 },
    ];
    var ex = [];
    if (d.przedSnem) ex.push({ k: "przed-snem" }); else if (d.tryb === "lekko") ex.push({ k: "lekko" });
    return {
      temat: t.id, sid: t.sid, tryb: d.tryb, nowe: d.nowe, kroki: kroki, min: 5,
      ton: t.egzaminDni != null && t.egzaminDni <= WAGI.tonWarnDni ? "warn" : d.tryb === "lekko" ? "calm" : null,
      powody: powody(t, ex),
    };
  }

  // ---------------- historia mechanik (6.4) ----------------
  /** Porzucona ≥ 3× od ostatniego ukończenia, ostatni raz w ciągu tygodnia → wypada z szablonu. */
  function zablokowana(id, hist, dayN) {
    var ev = ((hist && hist.mech) || {})[id] || [], drop = 0, last = null;
    ev.slice().sort(function (a, b) { return a.d - b.d; }).forEach(function (e) {
      if (e.stan === "ukonczona") { drop = 0; last = null; }
      else if (e.stan === "porzucona") { drop++; last = e.d; }
    });
    return drop >= WAGI.porzuconaProg && last != null && dayN - last < WAGI.porzuconaDni;
  }
  function lubiana(id, hist, dayN) {
    var ev = ((hist && hist.mech) || {})[id] || [];
    return ev.filter(function (e) { return e.stan === "ukonczona" && e.dobrze && dayN - e.d < WAGI.lubianaDni; }).length >= WAGI.lubianaProg;
  }
  function nowoscKara(id, hist) {
    var o = (hist && hist.ostatnieLekcje) || [];
    return o.length >= 2 && has(o[0], id) && has(o[1], id);
  }

  // ---------------- składanie lekcji (6.3) ----------------
  /** Kandydaci na rolę w kolejności wyniku. opt: { spokojnie, wDrodze, nowe, uzyte{}, ilosciowy, finalPref } */
  function kandydaci(rola, tresc, opt, k) {
    var hist = (k && k.hist) || {}, dayN = (k && k.dayN) || 0;
    var ids = ROLE[rola].slice();
    if (rola === "tworze" && opt.ilosciowy) ids = ["zadanie", "liczbowa", "cwiczenie", "wyjasnij", "kazus"];
    if (rola === "final" && opt.finalPref) ids = [opt.finalPref].concat(ids.filter(function (x) { return x !== opt.finalPref; }));
    if (rola === "sprawdzam" && opt.ciekawosc) ids = ["stas"].concat(ids.filter(function (x) { return x !== "stas"; }));
    var mozliwe = ids.map(function (id, i) { return { m: MECH[id], s: -i }; }).filter(function (x) {
      var m = x.m;
      if (!m.wymaga(tresc)) return false;
      if (opt.spokojnie && (m.energia !== "spokojna" || m.naCzas)) return false;
      if (opt.wDrodze && (m.pisanie || m.naCzas)) return false;
      if (m.nowe && !opt.nowe) return false;
      return true;
    });
    var nieuzyta = function (x) { return x.m.wiele || !opt.uzyte[x.m.id]; };
    var wolne = mozliwe.filter(function (x) { return nieuzyta(x) && !zablokowana(x.m.id, hist, dayN); });
    // Sprawdzam i tworzę nie znikają całkiem: gdy każda forma jest zablokowana, zostaje najlepsza nieużyta.
    var wszystkieZabl = mozliwe.length && mozliwe.every(function (x) { return zablokowana(x.m.id, hist, dayN); });
    if (!wolne.length && wszystkieZabl && ZAWSZE[mozliwe[0].m.typ]) wolne = mozliwe.filter(nieuzyta).slice(0, 1);
    wolne.forEach(function (x) {
      if (nowoscKara(x.m.id, hist)) x.s -= WAGI.nowoscKara;
      if (lubiana(x.m.id, hist, dayN)) x.s += WAGI.lubianaBonus;
      if (opt.uzyte[x.m.id] && x.m.typ === "gram") x.s -= 2 * opt.uzyte[x.m.id]; // gry na zmianę: Fruń, potem Przejdź
    });
    return wolne.sort(function (a, b) { return b.s - a.s; }).map(function (x) { return x.m; });
  }

  /** Lekcja: lista segmentów. tematy = [główny, …pokrewne] (pokrewne dokładane, gdy brakuje treści).
   *  o: { tryb, nowe, spokojnie, wDrodze, rola, mieszanka, min, graCo } (brak → z profilu). */
  function ulozLekcje(tematy, o, k) {
    tematy = [].concat(tematy || []).filter(Boolean);
    if (!tematy.length) return null;
    k = k || {}; o = o || {};
    var profil = k.profil || null, hist = k.hist || {};
    var cel = o.min || dlugoscLekcji(profil, hist), co = o.graCo || graCo(profil);
    var spokojnie = !!o.spokojnie, wDrodze = !!(o.wDrodze != null ? o.wDrodze : k.wDrodze), nowe = o.nowe !== false;
    var glowny = tematy[0];
    var finalPref = spokojnie || motyw(k, "spokoj") || stres(k) ? "bilet" : "drabina";
    var opt = { spokojnie: spokojnie, wDrodze: wDrodze, nowe: nowe, uzyte: {}, ilosciowy: !!o.ilosciowy, finalPref: finalPref, ciekawosc: motyw(k, "ciekawosc") };
    var segs = [], t = 0, lastGame = null;
    // Kawałki do nauki: kolejne sekcje głównego tematu, potem pokrewnych (w mieszance: po jednym z każdego tematu na zmianę).
    var kursor = tematy.map(function (x) { return { t: x, sek: x.sekcjaOd || 0, po: 0 }; }), ki = 0;
    function nastepnyKawalek() {
      // Najpierw nowe sekcje (główny temat, potem pokrewne), dopiero potem przypomnienia; w mieszance tematy na zmianę.
      var razem = { sekcje: 0, po: false, recap: false };
      kursor.forEach(function (x) { var c = cnt(x.t); razem.sekcje += t0(c.sekcje); razem.po = razem.po || !!c.po; razem.recap = razem.recap || !!c.recap; });
      var cand = kandydaci("ucze", razem, opt, k);
      for (var j = 0; j < cand.length; j++) {
        for (var n = 0; n < kursor.length; n++) {
          var i = o.mieszanka ? (ki + n) % kursor.length : n, kk = kursor[i], c = cnt(kk.t), m = cand[j];
          if (!m.wymaga(c)) continue;
          if (m.id === "wyjasnienie" && kk.sek < t0(c.sekcje)) { ki = i + 1; return { mech: m, temat: kk.t, sekcja: kk.sek++ }; }
          if (m.id === "przypomnienie" && kk.po < czesciPo(c) + (c.recap ? 1 : 0)) { ki = i + 1; return { mech: m, temat: kk.t, czesc: kk.po++ }; }
        }
      }
      return null;
    }
    function dodaj(m, extra) {
      var s = { i: segs.length, typ: m.typ, mech: m.id, nazwa: m.nazwa, min: m.min, temat: (extra && extra.temat ? extra.temat : glowny).id, od: t };
      if (extra) { if (extra.sekcja != null) s.sekcja = extra.sekcja; if (extra.czesc != null) s.czesc = extra.czesc; }
      if (m.opcje) s.opcje = m.opcje.slice();
      if (m.naCzas && m.typ === "gram") s.limitSec = 90;
      if (m.id === "drabina") s.szczeble = 6;
      segs.push(s); t += m.min; opt.uzyte[m.id] = (opt.uzyte[m.id] || 0) + 1;
      if (m.typ === "gram") lastGame = t;
      return s;
    }
    var prev = function () { return segs.length ? segs[segs.length - 1].typ : null; };
    // Gra-przerwa (z ewentualnymi rewanżami po niej, jeśli następny segment nie jest „sprawdzam”).
    function przerwa(nastepnyTyp) {
      if (prev() === "gram") return false;
      var g = kandydaci("przerwa", cnt(glowny), opt, k)[0];
      if (!g) return false;
      dodaj(g);
      if (nastepnyTyp !== "sprawdzam" && !opt.uzyte.rewanze) { var r = kandydaci("poGrze", cnt(glowny), opt, k)[0]; if (r) dodaj(r); }
      return true;
    }
    var finalMech = kandydaci("final", cnt(glowny), opt, k)[0] || null;
    // Zapas na finał, podsumowanie i ewentualną grę-przerwę przed finałem (finał „sprawdzam” nie może iść po „sprawdzam”).
    var zapas = (finalMech ? finalMech.min + MECH.frun.min : 0) + PODSUMOWANIE_MIN;
    var miesci = function (min) { return t + min + zapas <= cel + 0.5; };

    // 1. Haczyk.
    var h = kandydaci("haczyk", cnt(glowny), opt, k)[0];
    if (h) dodaj(h);
    // 2–7. Na zmianę: uczę się → sprawdzam → uczę się → tworzę → …; gra-przerwa co `co` minut i między dwoma takimi samymi typami.
    var wzor = ["ucze", "sprawdzam", "tworze", "ucze", "sprawdzam", "ucze", "tworze", "ucze"], wi = 0, bezPostepu = 0;
    while (wi < wzor.length && bezPostepu < wzor.length) {
      var rola = wzor[wi++], item = null;
      if (rola === "ucze") item = nastepnyKawalek();
      else { var m = kandydaci(rola, cnt(glowny), opt, k)[0]; if (m) item = { mech: m }; }
      if (!item) { bezPostepu++; continue; }
      var potrzebaGry = (lastGame == null ? t : t - lastGame) >= co || item.mech.typ === prev();
      var zGra = potrzebaGry && prev() !== "gram" ? (kandydaci("przerwa", cnt(glowny), opt, k)[0] || null) : null;
      if (!miesci(item.mech.min + (zGra ? zGra.min : 0))) {
        if (rola === "ucze") { var kk2 = kursor.find(function (x) { return x.t === item.temat; }); if (item.sekcja != null) kk2.sek--; else kk2.po--; }
        break;
      }
      if (potrzebaGry) przerwa(item.mech.typ);
      if (item.mech.typ === prev()) { if (rola === "ucze") { var kk3 = kursor.find(function (x) { return x.t === item.temat; }); if (item.sekcja != null) kk3.sek--; else kk3.po--; } bezPostepu++; continue; }
      dodaj(item.mech, item);
      bezPostepu = 0;
    }
    // Co najmniej 2 gry (poza trybem spokojnym i „w drodze”) i 1 „tworzę” (poza „w drodze”).
    var ile = function (typ) { return segs.filter(function (s) { return s.typ === typ; }).length; };
    if (!ile("tworze") && !wDrodze) {
      var tw = kandydaci("tworze", cnt(glowny), opt, k)[0];
      if (tw) { if (prev() === "tworze") przerwa("tworze"); dodaj(tw); }
    }
    if (!spokojnie && !wDrodze && ile("gram") < 2 && prev() !== "gram") przerwa(finalMech ? finalMech.typ : null);
    // 8. Finał (nie po segmencie tego samego typu: wtedy najpierw gra-przerwa).
    if (finalMech) {
      if (prev() === finalMech.typ && !przerwa(finalMech.typ)) finalMech = finalMech.typ === "sprawdzam" ? null : finalMech;
      if (finalMech) dodaj(finalMech);
    }
    var mechaniki = [];
    segs.forEach(function (s) { if (mechaniki.indexOf(s.nazwa) < 0) mechaniki.push(s.nazwa); });
    return {
      temat: glowny.id, sid: glowny.sid, tematy: tematy.map(function (x) { return x.id; }),
      rola: o.rola || null, tryb: o.tryb || null, nowe: nowe, spokojnie: spokojnie, wDrodze: wDrodze, mieszanka: !!o.mieszanka,
      min: cel, szac: Math.round(t + PODSUMOWANIE_MIN), graCo: co, segmenty: segs, mechaniki: mechaniki,
      final: finalMech ? finalMech.id : null, boss: !!glowny.boss,
      podsumowanie: {
        ranking: motyw(k, "rywalizacja") && !stres(k) && !spokojnie,
        poziomy: motyw(k, "postep") || !profil,
        liczby: !motyw(k, "spokoj"),
        czas: !motyw(k, "spokoj") && !spokojnie,
      },
    };
  }

  // ---------------- cały dzień (6.1) ----------------
  /** Karta 5 min + dwie lekcje. Zwraca { dzien, karta, lekcje: [l1, l2], dlugosc, graCo, bezProfilu }. */
  function ulozDzien(tematy, k) {
    k = k || {}; k.hist = k.hist || {};
    tematy = (tematy || []).filter(function (t) { return t && t.id; });
    var d = trybDnia(tematy, k), out = { dzien: d, karta: null, lekcje: [], dlugosc: dlugoscLekcji(k.profil, k.hist), graCo: graCo(k.profil), bezProfilu: !k.profil };
    if (!tematy.length) return out;
    var kt = wybierzKarte(tematy, d, k);
    out.karta = ulozKarte(kt, d, k);
    var zajete = [kt.id];
    var wolne = function (f) { return tematy.filter(function (t) { return zajete.indexOf(t.id) < 0 && (!f || f(t)); }); };
    var tylkoZnane = function (l) { if (d.nowe) return l; var z = l.filter(nieNowy); return z.length ? z : l; };
    var pokrewne = function (t) { return wolne(function (x) { return x.sid === t.sid && x.id !== t.id; }).sort(function (a, b) { return wynikTematu(b, k) - wynikTematu(a, k); }); };
    var lekcja = function (t, rola, extraPow, over) {
      var tryb = over && over.tryb || trybTematu(t, d);
      var nowe = d.nowe && !(over && over.nowe === false) && !(t.egzaminDni != null && t.egzaminDni <= WAGI.bezNowegoDni);
      var spok = d.spokojnie || !!(over && over.spokojnie);
      var l = ulozLekcje([t].concat(over && over.tematy || pokrewne(t).slice(0, 2)), { rola: rola, tryb: tryb, nowe: nowe, spokojnie: spok, mieszanka: !!(over && over.mieszanka), ilosciowy: !!t.ilosciowy }, k);
      l.powody = powody(t, extraPow);
      return l;
    };
    // Lekcja 1 „Najważniejsze teraz”: najwyższy wynik, w trybie przed kolokwium z przedmiotu z zaliczeniem.
    var c1 = d.egzamin ? wolne(function (t) { return t.sid === d.egzamin.sid; }) : wolne();
    var t1 = najlepszy(tylkoZnane(c1.length ? c1 : wolne()), k);
    if (!t1) return out;
    zajete.push(t1.id);
    out.lekcje.push(lekcja(t1, "najwazniejsze", d.przedSnem ? [{ k: "przed-snem" }] : d.tryb === "lekko" ? [{ k: "lekko" }] : null, d.przedSnem ? { nowe: false, spokojnie: true } : null));
    // Lekcja 2 „Na zmianę”: inny przedmiot (poza ostatnimi 2 dniami przed kolokwium: wtedy mieszanka zakresu).
    var mieszanka = d.egzamin && d.egzamin.dni <= WAGI.bezNowegoDni;
    var c2 = mieszanka ? wolne(function (t) { return t.sid === t1.sid; }) : wolne(function (t) { return t.sid !== t1.sid; });
    if (!c2.length) c2 = wolne();
    var t2 = najlepszy(tylkoZnane(c2), k, function (t) { return t.poziom === "zrobione" ? WAGI.doUtrwalenia : 0; });
    if (t2) {
      zajete.push(t2.id);
      var over = null, pw = [];
      if (d.przedSnem) { over = { tryb: "przed-snem", nowe: false, spokojnie: true }; pw.push({ k: "przed-snem" }); }
      if (mieszanka) { over = Object.assign(over || {}, { mieszanka: true, tryb: (over && over.tryb) || "mieszanka", tematy: wolne(function (x) { return x.sid === t2.sid; }).sort(function (a, b) { return wynikTematu(b, k) - wynikTematu(a, k); }).slice(0, 3) }); pw.push({ k: "mieszanka" }); }
      else if (t2.sid !== t1.sid) pw.push({ k: "na-zmiane" });
      if (mieszanka) zajete.push.apply(zajete, over.tematy.map(function (x) { return x.id; }));
      out.lekcje.push(lekcja(t2, "na-zmiane", pw, over));
    }
    return out;
  }

  /** „Jeszcze jedna lekcja” po obu: następny temat spoza dzisiejszych (hist.dzis musi mieć już zrobione). */
  function jeszczeJedna(tematy, k) {
    k = k || {}; k.hist = k.hist || {};
    var dzis = k.hist.dzis || [];
    var l = (tematy || []).filter(function (t) { return t && dzis.indexOf(t.id) < 0; });
    if (!l.length) return null;
    var d = trybDnia(tematy, k), t = najlepszy(l, k);
    var r = ulozLekcje([t], { rola: "dodatkowa", tryb: trybTematu(t, d), nowe: d.nowe, spokojnie: d.spokojnie, ilosciowy: !!t.ilosciowy }, k);
    r.powody = powody(t);
    return r;
  }

  return {
    WAGI: WAGI, KATALOG: KATALOG, MECH: MECH, ROLE: ROLE, DLUGOSCI: DLUGOSCI,
    dlugoscLekcji: dlugoscLekcji, graCo: graCo, pamiec: pamiec, czesciPo: czesciPo, hasloNorm: hasloNorm, hasloOcena: hasloOcena, serieNieudanych: serieNieudanych, tygodnie: tygodnie, odpowiedziLearner: odpowiedziLearner, reszty: reszty, doSnu: doSnu, wynikTematu: wynikTematu, powody: powody, powodTekst: powodTekst,
    trybDnia: trybDnia, trybTematu: trybTematu, ulozKarte: ulozKarte, ulozLekcje: ulozLekcje, ulozDzien: ulozDzien, jeszczeJedna: jeszczeJedna,
    zablokowana: zablokowana, lubiana: lubiana, kandydaci: kandydaci,
  };
});
