// Etap 2 – widoczna próba i uczciwe przyciski zakupu: ekrany, przejścia, przewijanie i ruch dla pomiary.mjs.
const DO = "2026-11-19T17:00:00+01:00"; // próba do czwartku 17:00 (start 16.11 17:00)
const LD = { "bm-ld-flag": "1" };
const ST = { "skrot-roczniki-status": JSON.stringify({ "wefiz-zarz-1-st-2026": "oczekujacy", "wefiz-fir-1-st-2026": "platny" }), "bm-group": "" };
const PK = { "skrot-proba-do": "2026-11-14T10:00:00+01:00", "bm-proba-koniec-pokazane": "1", ...LD };
export default {
  opis: "Etap 2: „Kup dostęp” na Dziś w kolorze akcentu i najwyżej raz; pigułka „Próba · dzień X z 3 · do czw 17:00” nad panelem Stasia (ostatnie 24 h: kolor ostrzeżenia + raz dziennie arkusz z planami); przyciskZakupu() = „Wypróbuj 3 dni” albo „Kup dostęp”; Ustawienia → Konto w próbie; okno błędu startu próby; kierunki „Wkrótce” i SQL v52. Zegar: 18.11.2026 10:00 (dzień 2), 19.11 13:00 (ostatnie 4 h).",
  ekrany: [
    { nazwa: "dzis-proba-dzien2", konto: "proba", time: "2026-11-18T10:00:00+01:00", ls: { "mock-proba-do": DO, ...LD }, jezyki: ["pl", "en"], root: "#main", widoczne: [["pigułka próby", ".uxw-proba"], ["„Plany”", ".uxw-pasek-link"]] },
    { nazwa: "dzis-proba-ostatnie-godziny", konto: "proba", time: "2026-11-19T13:00:00+01:00", ls: { "mock-proba-do": DO, "bm-proba-ost-2026-11-19": "1", ...LD }, rozmiary: [[360, 640], [390, 844]], root: "#main", widoczne: [["pigułka (ostrzeżenie)", ".uxw-proba.warn"]], cala: false },
    { nazwa: "arkusz-ostatnie-godziny", konto: "proba", time: "2026-11-19T13:00:00+01:00", ls: { "mock-proba-do": DO, ...LD }, jezyki: ["pl", "en"], root: "#layer", wait: 4000, widoczne: [["arkusz", ".uxw-ost"], ["plan 199 zł", ".uxw-plan.on"]], cala: false },
    { nazwa: "dzis-proba-koniec", konto: "proba-koniec", ls: PK, jezyki: ["pl", "en"], root: "#main", widoczne: [["„Kup dostęp”", ".uxw-kup"]] },
    { nazwa: "dzis-proba-koniec-bez-bloku-lekcji", konto: "proba-koniec", ls: { ...PK, "bm-ld-flag": "0" }, rozmiary: [[390, 844]], root: "#main" },
    { nazwa: "dzis-darmowe", konto: "darmowe", ls: LD, rozmiary: [[360, 640], [390, 844]], jezyki: ["pl", "en"], root: "#main", widoczne: [["pasek „Masz jeszcze 3 dni”", ".uxw-pasek"]] },
    { nazwa: "dzis-darmowe-bez-bloku-lekcji", konto: "darmowe", ls: { "bm-ld-flag": "0" }, rozmiary: [[390, 844]], root: "#main" },
    { nazwa: "ustawienia-konto-proba", konto: "proba", time: "2026-11-18T10:00:00+01:00", hash: "/ustawienia/konto", ls: { "mock-proba-do": DO }, rozmiary: [[390, 844], [1280, 900]], jezyki: ["pl", "en"], root: "#main", cala: false },
    { nazwa: "blad-wykorzystany", konto: "darmowe", ls: { "mock-proba-blad": "wykorzystany", ...LD }, jezyki: ["pl", "en"], root: "#layer", akcja: (p) => p.click(".uxw-pasek-b"), cala: false },
    { nazwa: "blad-urzadzenie", konto: "darmowe", ls: { "mock-proba-blad": "urzadzenie", ...LD }, rozmiary: [[390, 844]], jezyki: ["pl", "en"], root: "#layer", akcja: (p) => p.click(".uxw-pasek-b"), cala: false },
    { nazwa: "logowanie-kierunki", konto: "brak", ls: ST, rozmiary: [[390, 844], [1280, 900]], jezyki: ["pl", "en"], root: "#login" },
  ],
  przejscia: [
    { nazwa: "proba-ostatni-dzien", opis: "próba, 4 h do końca: arkusz raz dziennie → „199 zł” → „Zanim zapłacisz”; po przeładowaniu sama pigułka", konto: "proba", time: "2026-11-19T13:00:00+01:00", ls: { "mock-proba-do": DO, ...LD }, wait: 4000, kroki: [
      { opis: "arkusz „Zostało 4 godz. próby”", stan: () => ({ h2: document.querySelector(".uxw-ost h2")?.textContent, plany: [...document.querySelectorAll(".uxw-plan")].map((x) => x.innerText.replace(/\s+/g, " ")) }) },
      { opis: "klik „Wybierz 199 zł” → okno zgód przed płatnością", zrob: (p) => p.click(".uxw-ost .uxw-dol .uxw-kup"), stan: () => document.querySelector('[aria-label="Zanim zapłacisz"] h2')?.textContent },
      { opis: "przeładowanie → bez arkusza, pigułka w kolorze ostrzeżenia", zrob: (p) => p.reload(), czekaj: 4000, stan: () => ({ arkusz: !!document.querySelector(".uxw-ost"), pigulka: document.querySelector(".uxw-proba")?.className }) },
    ] },
    { nazwa: "proba-koniec-kup", opis: "po próbie: jeden zielony „Kup dostęp” na Dziś → wybór planu", konto: "proba-koniec", ls: PK, wait: 3000, kroki: [
      { opis: "Dziś: „Kup dostęp” (jeden, akcent)", stan: () => [...document.querySelectorAll("#main button")].filter((b) => b.offsetParent && b.textContent.trim() === "Kup dostęp").map((b) => getComputedStyle(b).backgroundColor) },
      { opis: "klik → „Wybierz plan”", zrob: (p) => p.click(".uxw-kup"), stan: () => !!document.querySelector('[aria-label="Wybierz plan"]') },
    ] },
    { nazwa: "blad-proby-plan", opis: "darmowe, próba już wykorzystana: „Włącz” → okno błędu → „Wybierz plan”", konto: "darmowe", ls: { "mock-proba-blad": "wykorzystany", ...LD }, wait: 3000, kroki: [
      { opis: "Dziś z paskiem", stan: () => document.querySelector(".uxw-pasek")?.innerText },
      { opis: "klik „Włącz” → okno błędu", zrob: (p) => p.click(".uxw-pasek-b"), stan: () => document.querySelector(".uxw-blad")?.innerText },
      { opis: "klik „Wybierz plan” → wybór planu", zrob: (p) => p.click(".uxw-blad .btn.primary"), stan: () => !!document.querySelector('[aria-label="Wybierz plan"]') },
    ] },
    { nazwa: "kierunek-wkrotce", opis: "gość: kierunek oczekujący → „Wkrótce” → lista oczekujących z tym kierunkiem", konto: "brak", ls: ST, kroki: [
      { opis: "lista kierunków", stan: () => [...document.querySelectorAll(".lk-card.lk-wkr b")].map((x) => x.textContent) },
      { opis: "klik „Zarządzanie” → lista oczekujących", zrob: (p) => p.click('.lk-card[data-k="wefiz-zarz-1-st-2026"]'), stan: () => document.querySelector("#lgKierunek h2")?.textContent },
    ] },
  ],
  przewijanie: [{ nazwa: "dzis-proba", konto: "proba", ls: { "mock-proba-do": DO, ...LD } }, { nazwa: "dzis-proba-koniec", konto: "proba-koniec", ls: PK }, { nazwa: "logowanie-kierunki", konto: "brak", ls: ST }],
  ruch: [
    { nazwa: "dzis-proba", konto: "proba", time: "2026-11-18T10:00:00+01:00", ls: { "mock-proba-do": DO, ...LD }, wait: 2500, elementy: [".uxw-proba", ".uxw-kup, .uxw-pasek-link"] },
    { nazwa: "arkusz-ostatnie-godziny", konto: "proba", time: "2026-11-19T13:00:00+01:00", ls: { "mock-proba-do": DO, ...LD }, wait: 3500, elementy: [".uxw-ost", ".uxw-plan.on"] },
  ],
};
