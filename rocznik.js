/* Rocznik: dla kogo jest ta strona (kierunek × stopień × tryb × nabór).
   Jedno miejsce z danymi, które dawniej były wpisane w kod jako „1. rok Business Management”:
   adres planu, sylabus, opis kierunku w nagłówkach i w poleceniach dla AI, koniec dostępu.
   BM jest wpisany tu wprost. Każdy kolejny rocznik to wpis w roczniki-dane.js (te same pola, robi go scripts/kierunek.mjs)
   + wiersz w nauka_roczniki dodany przyciskiem „Dodaj do bazy” w Panelu kierunków (SQL v49).

   Identyfikator: <wydział>-<kierunek>-<stopień>-<tryb>-<rok naboru>, np. „wefiz-bm-1-st-2026”.
   Rocznik to grupa ludzi, którzy zaczęli razem: rok studiów (1., 2., 3.) liczy się z daty, więc
   1. rok 2026/27 sam staje się 2. rokiem 2027/28 i nie trzeba nic przepisywać.
   Ładowany w <head> po i18n.js, przed skrot-supabase.js (który czyta datę końca dostępu).
   Testy: node --test tests/*.test.js */
(function (root) {
  "use strict";

  // Wspólne dla całej uczelni: kalendarz roku jest jeden (zarządzenie nr 59/2026).
  var UCZELNIA = {
    kod: "US", pl: "Uniwersytet Szczeciński", en: "University of Szczecin",
    // Koniec letniej sesji egzaminacyjnej 2026/27. Plan „do końca 2. semestru” (199 zł) trwa do tego dnia,
    // tak samo w regulaminie § 4 i w funkcji stripe-webhook. Poprawkowa (wrzesień) jest poza planem.
    dostepDo: "2027-07-11",
  };

  var ROCZNIKI = {
    "wefiz-bm-1-st-2026": {
      wydzial: { kod: "WEFiZ", pl: "Wydział Ekonomii, Finansów i Zarządzania", en: "Faculty of Economics, Finance and Management" },
      kierunek: { kod: "BM", pl: "Business Management", en: "Business Management" },
      stopien: 1,          // 1 = I stopnia (licencjat / inżynier), 2 = II stopnia (magister), 0 = jednolite magisterskie
      tryb: "st",          // "st" = stacjonarne, "nst" = niestacjonarne
      nabor: 2026,         // rok, w którym rocznik zaczął 1. rok
      jezykZajec: "en",    // w jakim języku są zajęcia (treści EN, „Prościej · PL” po polsku)
      plan: {
        json: "https://plan.skrotbm.pl/plan.json",      // plan zajęć grup, kalendarz roku, odwołane zajęcia (repo plan-bm)
        // Inne roczniki: https://plan.skrotbm.pl/plan/<id rocznika>.json (ten sam host = CSP bez zmian; w bazie nauka_roczniki.plan_url, v46).
        strona: "https://plan.skrotbm.pl/",             // darmowa strona z planem
        skrzynka: "https://plan.skrotbm.pl/skrzynka.html", // skrzynka do opiekunki roku (null = rocznik nie ma skrzynki)
      },
      sylabus: {
        plik: "sylabus.json",            // z PDF-u sylabusa (scripts/sylabus-*.py); null = brak sylabusa w aplikacji
        pojecia: "sylabus-pojecia.json", // pojęcia PL/EN do słowniczka; null = brak
        pdf: { pl: "Sylabusy WEFiZ 2026/27 (PDF)", url: "https://dsm.usz.edu.pl/wp-content/uploads/wefiz-26-27-sylab.pdf" },
      },
      // Grupy ćwiczeniowe na ekranie wejścia (krok 2), zanim wczyta się plan. Pełna lista grup i podgrup lab jest w planie.
      grupy: ["C111", "C112", "C113"],
      // Rocznik ma zespoły w Teams: zadania i odwołania z postów prowadzących (plan-bm, meta/odwolania). Inne roczniki: false.
      teams: true,
      // Zasady zaliczeń wpisane ręcznie w index.html (ZAL, CALC_RULES) dotyczą tylko tego rocznika.
      // Inne roczniki dostaną je z bazy (panel redakcyjny, Etap 4 planu wdrożenia).
      zasadyZaliczen: true,
      // Przedmioty, które strona traktuje inaczej (dawniej listy w index.html): prawne = kazusy i test z kazusem (LAW_SUBJECTS),
      // rachunkowe = zadania z liczeniem (CALC_SUBJECTS), jeszczeProsciej = przyciski „Jeszcze prościej” w Analizie (EZ_SUBJ).
      // Id przedmiotu = slug nazwy z planu. Inny rocznik: puste albo z sylabusa.
      przedmioty: {
        prawne: ["ochrona-wlasnosci-intelektualnej", "prawo"],
        rachunkowe: ["analiza-matematyczna", "ekonomia-biznesu", "makroekonomia", "podstawy-finansow"],
        jeszczeProsciej: ["analiza-matematyczna"],
      },
    },
  };
  // Pozostałe roczniki to dane, nie kod: roczniki-dane.js (ładowany przed tym plikiem; robi go scripts/kierunek.mjs z kierunki/<id>.json).
  // Nowy kierunek = nowy wpis w danych + „Dodaj do bazy” w Panelu kierunków (SQL v49, jedna migracja na zawsze), bez zmian w kodzie.
  // Wpis wpisany wyżej wprost (BM, rocznik testowy w testach) wygrywa z danymi o tym samym id.
  var DANE = [];
  if (typeof module !== "undefined" && module.exports) { try { DANE = require("./roczniki-dane.js"); } catch (e) { DANE = []; } }
  else DANE = root.SKROT_ROCZNIKI_DANE || [];
  var STATUS_DANYCH = {}; // status, z którym rocznik ma trafić do bazy (Panel kierunków → „Dodaj do bazy”)
  (Array.isArray(DANE) ? DANE : []).forEach(function (d) {
    if (!d || typeof d.id !== "string" || ROCZNIKI[d.id] || !d.kierunek || !d.plan || !d.wydzial) return;
    var e = {};
    for (var key in d) if (key !== "id" && key !== "status") e[key] = d[key];
    ROCZNIKI[d.id] = e;
    STATUS_DANYCH[d.id] = d.status || "plan";
  });
  var DOMYSLNY = "wefiz-bm-1-st-2026";
  var KLUCZ_EDYCJA = "skrot-admin-rocznik"; // localStorage: rocznik edytowany przez administratora

  var STOPIEN_PL = { 0: "jednolite magisterskie", 1: "I stopnia", 2: "II stopnia" };
  var STOPIEN_EN = { 0: "long-cycle master's", 1: "first-cycle", 2: "second-cycle" };
  var ORD_EN = ["", "1st", "2nd", "3rd", "4th", "5th", "6th"];
  var ORD_EN_SLOWO = ["", "first", "second", "third", "fourth", "fifth", "sixth"];

  // Rok studiów dziś: rok akademicki zaczyna się 1 października.
  function rokStudiow(r, teraz) {
    var d = teraz || new Date();
    var start = d.getMonth() >= 9 ? d.getFullYear() : d.getFullYear() - 1; // getMonth: 9 = październik
    return Math.max(1, start - r.nabor + 1);
  }
  function rokAk(n) { return n + "/" + String((n + 1) % 100).padStart(2, "0"); }

  // Gotowe teksty z parą PL/EN. index.html dopisuje pary do słownika (SKROT_I18N.add), więc wersja EN działa dla każdego kierunku.
  function teksty(r, rok) {
    var k = r.kierunek, st = r.tryb === "st";
    var studiaPl = "studia " + (st ? "stacjonarne " : "niestacjonarne ") + STOPIEN_PL[r.stopien];
    var studiaEn = (st ? "full-time " : "part-time ") + STOPIEN_EN[r.stopien] + " studies";
    return {
      // „Business Management · 1. rok” (podtytuł rankingu)
      opis: { pl: k.pl + " · " + rok + ". rok", en: k.en + " · " + ORD_EN[rok] + " year" },
      // nagłówek programu studiów
      program: { pl: k.pl + " · " + studiaPl + " · nabór " + rokAk(r.nabor), en: k.en + " · " + studiaEn + " · " + rokAk(r.nabor) + " intake" },
      // źródło zasad zaliczeń
      sylabusNazwa: { pl: "Sylabus " + k.pl + " " + rokAk(r.nabor) + ", " + studiaPl, en: k.en + " syllabus " + rokAk(r.nabor) + ", " + studiaEn },
      // przedmiot „ogólny” w Moich materiałach
      ogolny: { pl: "studia " + k.pl + ", " + rok + ". rok", en: k.en + " (" + ORD_EN_SLOWO[rok] + " year)" },
      // tekst do udostępnienia kodu polecającego („dla 1. roku BM”)
      dlaKogo: { pl: rok + ". roku " + k.kod, en: ORD_EN[rok] + "-year " + k.kod },
    };
  }

  // Opis odbiorców w poleceniach dla AI. Te same słowa sprawdza funkcja serwerowa „claude” (supabase/functions/claude).
  function ai(r, rok) {
    return {
      en: ORD_EN_SLOWO[rok] + "-year " + r.kierunek.en + " students",       // „first-year Business Management students”
      pl: rok + ". roku " + r.kierunek.pl,                                    // „studentów 1. roku Business Management”
      kierunek: r.kierunek.pl,                                                // „ze studiów (Business Management)”
      kontekst: UCZELNIA.pl + ", zajęcia " + (r.jezykZajec === "en" ? "po angielsku" : "po polsku"),
    };
  }

  function zbuduj(id, teraz) {
    var r = ROCZNIKI[id];
    if (!r) return null;
    var rok = rokStudiow(r, teraz);
    var out = {};
    for (var key in r) out[key] = r[key];
    var pr = r.przedmioty || {};
    out.przedmioty = { prawne: pr.prawne || [], rachunkowe: pr.rachunkowe || [], jeszczeProsciej: pr.jeszczeProsciej || [] };
    out.id = id;
    out.rok = rok;
    out.rokAkademicki = rokAk(r.nabor + rok - 1);
    out.uczelnia = UCZELNIA;
    out.dostepDo = UCZELNIA.dostepDo;
    out.teksty = teksty(r, rok);
    out.ai = ai(r, rok);
    return out;
  }

  // Który rocznik pokazać: „skrot-rocznik” w localStorage (ekran wejścia, a po zalogowaniu wybór zapisany w profilu,
  // skrot-supabase.js → nauka_rocznik_moj, v31). Nieznany albo brak → domyślny (BM).
  function wybrany() {
    var id = null;
    // „Podgląd jako” administratora (admin.js, etap 11): inny rocznik tylko w tej karcie (sessionStorage), wybór w localStorage zostaje.
    var pg = null;
    try { pg = root.SKROT_ADMIN && root.SKROT_ADMIN.podglad && root.SKROT_ADMIN.podglad(); } catch (e) { pg = null; }
    if (pg && pg.rocznik && ROCZNIKI[pg.rocznik]) return pg.rocznik;
    // „Edytuję rocznik” administratora (Narzędzia, fundament Etap 3): treści innego rocznika z zapisem. Obowiązuje dopiero, gdy
    // skrot-supabase.js potwierdzi, że konto to admin (inaczej kasuje klucz i przeładowuje); profil admina zostaje w BM.
    var ed = null;
    try { ed = root.localStorage && root.localStorage.getItem(KLUCZ_EDYCJA); } catch (e) { ed = null; }
    if (ed && ROCZNIKI[ed] && ed !== DOMYSLNY) { root.SKROT_EDYCJA = ed; return ed; }
    try { id = root.localStorage && root.localStorage.getItem("skrot-rocznik"); } catch (e) { /* tryb prywatny */ }
    return id && ROCZNIKI[id] ? id : DOMYSLNY;
  }

  // Treści należące do rocznika (nauka_docs.rocznik_id, supabase/skrot-v44-roczniki-tresci.sql → nauka_kolekcja_rocznika).
  // Reszta jest osobista (progress, myMaterials, myContent, reports) albo wspólna (meta/en = słownik EN).
  var KOLEKCJE_ROCZNIKA = ["materials", "materialContent", "materialSimple", "quizWhy", "materialSources", "tasks", "deadlines",
    "announcements", "exams", "examBank", "glossary", "meta"];
  // Kolekcje ze stałymi id albo zbudowanymi z przedmiotu (meta/po, examBank/<przedmiot>, exams/<przedmiot>-<część>, glossary/<przedmiot>).
  // Klucz nauka_docs to (kolekcja, id), więc w innych rocznikach niż BM id dostaje sufiks „@<rocznik>” (BM bez zmian).
  // Materiały, terminy i ogłoszenia mają losowe id (albo z prefiksem rocznika z generatora), więc sufiksu nie potrzebują.
  var KOLEKCJE_STALE_ID = ["meta", "examBank", "exams", "glossary"];
  function kolekcjaRocznika(col, id) { return KOLEKCJE_ROCZNIKA.indexOf(col) >= 0 && !(col === "meta" && id === "en"); }
  function sufiks(col, id, rocznikId) {
    return rocznikId && rocznikId !== DOMYSLNY && KOLEKCJE_STALE_ID.indexOf(col) >= 0 && kolekcjaRocznika(col, id) ? "@" + rocznikId : "";
  }
  // id na stronie → id w bazie
  function docId(col, id, rocznikId) { return String(id) + sufiks(col, String(id), rocznikId); }
  // id w bazie → id na stronie (odcina sufiks tego rocznika)
  function docIdStrony(col, id, rocznikId) {
    id = String(id);
    var s = "@" + rocznikId;
    if (!rocznikId || rocznikId === DOMYSLNY || KOLEKCJE_STALE_ID.indexOf(col) < 0 || id.slice(-s.length) !== s) return id;
    return id.slice(0, -s.length);
  }

  // To, co Panel kierunków → „Dodaj do bazy” wysyła do nauka_admin_rocznik_zapisz (SQL v49). Jedno miejsce dla strony,
  // scripts/kierunek.mjs (doBazy) i testu bazy (supabase/test/pglite.mjs: każdy rocznik z danych przechodzi przez v49).
  function doBazy(id) {
    var r = ROCZNIKI[id];
    if (!r) return null;
    return { id: id, kierunek_id: String(id).replace(/-\d{4}$/, ""), nabor: r.nabor, status: STATUS_DANYCH[id] || (id === DOMYSLNY ? "platny" : "plan"),
      kierunek: { kod: r.kierunek.kod, pl: r.kierunek.pl, en: r.kierunek.en, stopien: r.stopien, tryb: r.tryb, jezyk: r.jezykZajec },
      wydzial: { kod: r.wydzial.kod } };
  }

  var API = { ROCZNIKI: ROCZNIKI, DOMYSLNY: DOMYSLNY, STATUS_DANYCH: STATUS_DANYCH, doBazy: doBazy, UCZELNIA: UCZELNIA, zbuduj: zbuduj, rokStudiow: rokStudiow, wybrany: wybrany, KLUCZ_EDYCJA: KLUCZ_EDYCJA,
    KOLEKCJE_ROCZNIKA: KOLEKCJE_ROCZNIKA, KOLEKCJE_STALE_ID: KOLEKCJE_STALE_ID, kolekcjaRocznika: kolekcjaRocznika, docId: docId, docIdStrony: docIdStrony };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else {
    root.SKROT_ROCZNIKI = API;
    root.SKROT_ROCZNIK = zbuduj(wybrany());
  }
})(typeof window !== "undefined" ? window : globalThis);
