/* Rocznik: dla kogo jest ta strona (kierunek × stopień × tryb × nabór).
   Jedno miejsce z danymi, które dawniej były wpisane w kod jako „1. rok Business Management”:
   adres planu, sylabus, opis kierunku w nagłówkach i w poleceniach dla AI, koniec dostępu.
   Nowy kierunek = nowy wpis w ROCZNIKI (te same pola) + wiersz w tabeli nauka_roczniki (supabase/skrot-v22-roczniki.sql).

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
        strona: "https://plan.skrotbm.pl/",             // darmowa strona z planem
        skrzynka: "https://plan.skrotbm.pl/skrzynka.html", // skrzynka do opiekunki roku (null = rocznik nie ma skrzynki)
      },
      sylabus: {
        plik: "sylabus.json",            // z PDF-u sylabusa (scripts/sylabus-*.py); null = brak sylabusa w aplikacji
        pojecia: "sylabus-pojecia.json", // pojęcia PL/EN do słowniczka; null = brak
        pdf: { pl: "Sylabusy WEFiZ 2026/27 (PDF)", url: "https://dsm.usz.edu.pl/wp-content/uploads/wefiz-26-27-sylab.pdf" },
      },
      // Zasady zaliczeń wpisane ręcznie w index.html (ZAL, CALC_RULES) dotyczą tylko tego rocznika.
      // Inne roczniki dostaną je z bazy (panel redakcyjny, Etap 4 planu wdrożenia).
      zasadyZaliczen: true,
    },
  };
  var DOMYSLNY = "wefiz-bm-1-st-2026";

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
    out.id = id;
    out.rok = rok;
    out.rokAkademicki = rokAk(r.nabor + rok - 1);
    out.uczelnia = UCZELNIA;
    out.dostepDo = UCZELNIA.dostepDo;
    out.teksty = teksty(r, rok);
    out.ai = ai(r, rok);
    return out;
  }

  // Który rocznik pokazać. Na razie jest jeden (BM). Wybór przy pierwszym logowaniu dojdzie w kolejnym etapie;
  // klucz „skrot-rocznik” w localStorage już teraz pozwala go przełączyć (np. w testach).
  function wybrany() {
    var id = null;
    try { id = root.localStorage && root.localStorage.getItem("skrot-rocznik"); } catch (e) { /* tryb prywatny */ }
    return id && ROCZNIKI[id] ? id : DOMYSLNY;
  }

  var API = { ROCZNIKI: ROCZNIKI, DOMYSLNY: DOMYSLNY, UCZELNIA: UCZELNIA, zbuduj: zbuduj, rokStudiow: rokStudiow };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else {
    root.SKROT_ROCZNIKI = API;
    root.SKROT_ROCZNIK = zbuduj(wybrany());
  }
})(typeof window !== "undefined" ? window : globalThis);
