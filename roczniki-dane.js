/* Roczniki poza BM: dane, nie kod. Czyta je rocznik.js (ładowany po tym pliku), testy przez require.
   Wygenerowane: node scripts/kierunek.mjs kierunki/<id>.json (jeden wpis na plik kierunku). Nie edytuj ręcznie: popraw plik kierunku i uruchom skrypt.
   Pole status = z jakim statusem rocznik trafia do bazy (Panel kierunków → „Dodaj do bazy”, SQL v49); potem status zmienia się tylko w bazie. */
(function (root) {
  var DANE = [
    // ROCZNIK-START wefiz-zarz-1-st-2026 (kierunki/wefiz-zarz-1-st-2026.json)
    {
      id: "wefiz-zarz-1-st-2026",
      status: "oczekujacy",
      wydzial: { kod: "WEFiZ", pl: "Wydział Ekonomii, Finansów i Zarządzania", en: "Faculty of Economics, Finance and Management" },
      kierunek: { kod: "ZARZ", pl: "Zarządzanie", en: "Management" },
      stopien: 1,
      tryb: "st",
      nabor: 2026,
      jezykZajec: "pl",
      plan: { json: "https://plan.zdawalni.pl/plan/wefiz-zarz-1-st-2026.json", strona: "https://plan.zdawalni.pl/?k=zarz26", skrzynka: null },
      sylabus: { plik: "sylabus-zarz.json", pojecia: null, pdf: { pl: "Sylabusy WEFiZ 2026/27 (PDF)", url: "https://efz.usz.edu.pl/wp-content/uploads/sylabusy/26-27/sylabus_zarzadzanie_studia_stacjonarne_I_stopnia_2026_2027.pdf" } },
      grupy: ["C151", "C152", "C153"],
      teams: false,
      zasadyZaliczen: false,
      przedmioty: { prawne: ["podstawy-prawa", "ochrona-wlasnosci-intelektualnej"], rachunkowe: ["matematyka", "podstawy-finansow", "podstawy-ekonomii"], jeszczeProsciej: ["matematyka"] },
    },
    // ROCZNIK-KONIEC wefiz-zarz-1-st-2026
    // ROCZNIK-START wefiz-fir-1-st-2026 (kierunki/wefiz-fir-1-st-2026.json)
    {
      id: "wefiz-fir-1-st-2026",
      status: "oczekujacy",
      wydzial: { kod: "WEFiZ", pl: "Wydział Ekonomii, Finansów i Zarządzania", en: "Faculty of Economics, Finance and Management" },
      kierunek: { kod: "FIR", pl: "Finanse i Rachunkowość", en: "Finance and Accounting" },
      stopien: 1,
      tryb: "st",
      nabor: 2026,
      jezykZajec: "pl",
      plan: { json: "https://plan.zdawalni.pl/plan/wefiz-fir-1-st-2026.json", strona: "https://plan.zdawalni.pl/?k=fir26", skrzynka: null },
      sylabus: { plik: "sylabus-fir.json", pojecia: null, pdf: { pl: "Sylabusy WEFiZ 2026/27 (PDF)", url: "https://efz.usz.edu.pl/wp-content/uploads/sylabusy/26-27/sylabus_finanse_i_rachunkowosc_studia_stacjonarne_I_stopnia_2026_2027.pdf" } },
      grupy: ["M120", "M121", "M122", "M123"],
      teams: false,
      zasadyZaliczen: false,
      przedmioty: { prawne: ["podstawy-prawa", "ochrona-wlasnosci-intelektualnej"], rachunkowe: ["matematyka", "makroekonomia", "podstawy-finansow", "podstawy-rachunkowosci", "arkusz-kalkulacyjny-w-finansach-i-rachunkowosci"], jeszczeProsciej: ["matematyka", "podstawy-rachunkowosci"] },
    },
    // ROCZNIK-KONIEC wefiz-fir-1-st-2026
    // ROCZNIK-START wefiz-eaia-1-st-2026 (kierunki/wefiz-eaia-1-st-2026.json)
    {
      id: "wefiz-eaia-1-st-2026",
      status: "oczekujacy",
      wydzial: { kod: "WEFiZ", pl: "Wydział Ekonomii, Finansów i Zarządzania", en: "Faculty of Economics, Finance and Management" },
      kierunek: { kod: "EAIA", pl: "Economics and IT Applications", en: "Economics and IT Applications" },
      stopien: 1,
      tryb: "st",
      nabor: 2026,
      jezykZajec: "en",
      plan: { json: "https://plan.zdawalni.pl/plan/wefiz-eaia-1-st-2026.json", strona: "https://plan.zdawalni.pl/?k=eaia26", skrzynka: null },
      sylabus: { plik: "sylabus-eaia26.json", pojecia: null, pdf: { pl: "Sylabusy WEFiZ 2026/27 (PDF)", url: "https://efz.usz.edu.pl/wp-content/uploads/sylabusy/26-27/sylabus_economics_and_IT_applications_studia_stacjonarne_I_stopnia_2026_2027_ang.pdf" } },
      grupy: ["M190"],
      teams: false,
      zasadyZaliczen: false,
      przedmioty: { prawne: ["ochrona-wlasnosci-intelektualnej", "prawo"], rachunkowe: ["analiza-matematyczna", "finanse", "informatyka-w-ekonomii", "makroekonomia", "statystyka-opisowa"], jeszczeProsciej: ["analiza-matematyczna", "statystyka-opisowa"] },
    },
    // ROCZNIK-KONIEC wefiz-eaia-1-st-2026
    // ROCZNIK-START wefiz-kipb-1-st-2026 (kierunki/wefiz-kipb-1-st-2026.json)
    {
      id: "wefiz-kipb-1-st-2026",
      status: "oczekujacy",
      wydzial: { kod: "WEFiZ", pl: "Wydział Ekonomii, Finansów i Zarządzania", en: "Faculty of Economics, Finance and Management" },
      kierunek: { kod: "KIPB", pl: "Komunikacja i psychologia w biznesie", en: "Communication and Psychology in Business" },
      stopien: 1,
      tryb: "st",
      nabor: 2026,
      jezykZajec: "pl",
      plan: { json: "https://plan.zdawalni.pl/plan/wefiz-kipb-1-st-2026.json", strona: "https://plan.zdawalni.pl/?k=kipb26", skrzynka: null },
      sylabus: { plik: "sylabus-kipb26.json", pojecia: null, pdf: { pl: "Sylabusy WEFiZ 2026/27 (PDF)", url: "https://efz.usz.edu.pl/wp-content/uploads/sylabusy/26-27/sylabus_komunikacja_i_psychologia_w_biznesie_studia_stacjonarne_I_stopnia_2026_2027.pdf" } },
      grupy: ["C121", "C122", "C123"],
      teams: false,
      zasadyZaliczen: false,
      przedmioty: { prawne: ["ochrona-wlasnosci-intelektualnej"], rachunkowe: ["podstawy-ekonomii"], jeszczeProsciej: [] },
    },
    // ROCZNIK-KONIEC wefiz-kipb-1-st-2026
    // ROCZNIK-START wefiz-log-1-st-2026 (kierunki/wefiz-log-1-st-2026.json)
    {
      id: "wefiz-log-1-st-2026",
      status: "oczekujacy",
      wydzial: { kod: "WEFiZ", pl: "Wydział Ekonomii, Finansów i Zarządzania", en: "Faculty of Economics, Finance and Management" },
      kierunek: { kod: "LOG", pl: "Logistyka", en: "Logistics" },
      stopien: 1,
      tryb: "st",
      nabor: 2026,
      jezykZajec: "pl",
      plan: { json: "https://plan.zdawalni.pl/plan/wefiz-log-1-st-2026.json", strona: "https://plan.zdawalni.pl/?k=log26", skrzynka: null },
      sylabus: { plik: "sylabus-log26.json", pojecia: null, pdf: { pl: "Sylabusy WEFiZ 2026/27 (PDF)", url: "https://efz.usz.edu.pl/wp-content/uploads/sylabusy/26-27/sylabus_logistyka_studia_stacjonarne_I_stopnia_2026_2027.pdf" } },
      grupy: ["C131", "C132"],
      teams: false,
      zasadyZaliczen: false,
      przedmioty: { prawne: ["ochrona-wlasnosci-intelektualnej-i-przemyslowej"], rachunkowe: ["podstawy-ekonomii", "podstawy-rachunkowosci"], jeszczeProsciej: ["podstawy-rachunkowosci"] },
    },
    // ROCZNIK-KONIEC wefiz-log-1-st-2026
    // ROCZNIK-START wefiz-li-1-st-2026 (kierunki/wefiz-li-1-st-2026.json)
    {
      id: "wefiz-li-1-st-2026",
      status: "oczekujacy",
      wydzial: { kod: "WEFiZ", pl: "Wydział Ekonomii, Finansów i Zarządzania", en: "Faculty of Economics, Finance and Management" },
      kierunek: { kod: "LI", pl: "Logistyka inż.", en: "Logistics (engineering)" },
      stopien: 1,
      tryb: "st",
      nabor: 2026,
      jezykZajec: "pl",
      plan: { json: "https://plan.zdawalni.pl/plan/wefiz-li-1-st-2026.json", strona: "https://plan.zdawalni.pl/?k=li26", skrzynka: null },
      sylabus: { plik: "sylabus-li26.json", pojecia: null, pdf: { pl: "Sylabusy WEFiZ 2026/27 (PDF)", url: "https://efz.usz.edu.pl/wp-content/uploads/sylabusy/26-27/sylabus_logistyka_inzynierskie_studia_stacjonarne_I_stopnia_2026_2027.pdf" } },
      grupy: ["C161"],
      teams: false,
      zasadyZaliczen: false,
      przedmioty: { prawne: ["elementy-prawa", "ochrona-wlasnosci-intelektualnej-i-przemyslowej"], rachunkowe: ["inzynieria-systemow-i-analiza-systemowa", "matematyka"], jeszczeProsciej: ["matematyka"] },
    },
    // ROCZNIK-KONIEC wefiz-li-1-st-2026
    // ROCZNIK-START wefiz-pii-1-st-2026 (kierunki/wefiz-pii-1-st-2026.json)
    {
      id: "wefiz-pii-1-st-2026",
      status: "oczekujacy",
      wydzial: { kod: "WEFiZ", pl: "Wydział Ekonomii, Finansów i Zarządzania", en: "Faculty of Economics, Finance and Management" },
      kierunek: { kod: "PII", pl: "Przedsiębiorczość i Inwestycje", en: "Entrepreneurship and Investment" },
      stopien: 1,
      tryb: "st",
      nabor: 2026,
      jezykZajec: "pl",
      plan: { json: "https://plan.zdawalni.pl/plan/wefiz-pii-1-st-2026.json", strona: "https://plan.zdawalni.pl/?k=pii26", skrzynka: null },
      sylabus: { plik: "sylabus-pii26.json", pojecia: null, pdf: { pl: "Sylabusy WEFiZ 2026/27 (PDF)", url: "https://efz.usz.edu.pl/wp-content/uploads/sylabusy/26-27/sylabus_przedsiebiorczosc_i_inwestycje_studia_stacjonarne_I_stopnia_2026_2027.pdf" } },
      grupy: ["C181"],
      teams: false,
      zasadyZaliczen: false,
      przedmioty: { prawne: ["ochrona-wlasnosci-intelektualnej", "podstawy-prawa-dla-ekonomistow"], rachunkowe: ["podstawy-ekonomiki-przedsiebiorstw", "podstawy-makroekonomii", "podstawy-prawa-dla-ekonomistow"], jeszczeProsciej: [] },
    },
    // ROCZNIK-KONIEC wefiz-pii-1-st-2026
    // ROCZNIK-START wefiz-iwb-1-st-2026 (kierunki/wefiz-iwb-1-st-2026.json)
    {
      id: "wefiz-iwb-1-st-2026",
      status: "oczekujacy",
      wydzial: { kod: "WEFiZ", pl: "Wydział Ekonomii, Finansów i Zarządzania", en: "Faculty of Economics, Finance and Management" },
      kierunek: { kod: "IWB", pl: "Informatyka w Biznesie", en: "Business Informatics" },
      stopien: 1,
      tryb: "st",
      nabor: 2026,
      jezykZajec: "pl",
      plan: { json: "https://plan.zdawalni.pl/plan/wefiz-iwb-1-st-2026.json", strona: "https://plan.zdawalni.pl/?k=iwb26", skrzynka: null },
      sylabus: { plik: "sylabus-iwb26.json", pojecia: null, pdf: { pl: "Sylabusy WEFiZ 2026/27 (PDF)", url: "https://efz.usz.edu.pl/wp-content/uploads/sylabusy/26-27/sylabus_informatyka_w_biznesie_studia_stacjonarne_I_stopnia_2026_2027.pdf" } },
      grupy: ["C171"],
      teams: false,
      zasadyZaliczen: false,
      przedmioty: { prawne: ["ochrona-wlasnosci-intelektualnej"], rachunkowe: ["podstawy-mikroekonomii"], jeszczeProsciej: [] },
    },
    // ROCZNIK-KONIEC wefiz-iwb-1-st-2026
  ];
  if (typeof module !== "undefined" && module.exports) module.exports = DANE;
  else root.SKROT_ROCZNIKI_DANE = DANE;
})(typeof window !== "undefined" ? window : globalThis);
