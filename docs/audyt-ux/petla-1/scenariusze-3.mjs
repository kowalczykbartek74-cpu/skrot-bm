// Etap 3 – koniec próby jako wydarzenie: ekrany, przejścia, przewijanie i ruch dla pomiary.mjs.
const UID = "00000000-0000-4000-8000-000000000001";
const LD = { "bm-ld-flag": "1" };
const KONIEC = { "skrot-proba-do": "2026-11-14T17:00:00+01:00", ...LD };
const PROG = JSON.stringify({ [UID]: { done: { A1: Date.parse("2026-11-12T12:00:00+01:00"), M1: Date.parse("2026-11-13T12:00:00+01:00") }, xp: { t: 85, d: 0, n: 0 }, srs: { "A1:a": [1, 0], "A1:b": [1, 0], "A1:c": [1, 0] }, streak: { d: 0, n: 2 } } });
const ZERO = JSON.stringify({ [UID]: {} });
const START = async (p) => { await p.click(".uxw-pasek-b"); await p.waitForSelector(".uxw-przyp", { timeout: 15000 }).catch(() => {}); };
export default {
  opis: "Etap 3: powitanie próby z przełącznikiem „Przypomnij mi mailem dzień przed końcem próby” (domyślnie wyłączony), SQL v53 i mail „próba” w funkcji przypomnienia (testy w test.log), ?plan=1 → wybór planu, jednorazowy ekran „Twoje 3 dni minęły” (postęp, najbliższe kolokwium, plany z 199 zł na górze) i pasek zakupu nad panelem przy kolejnych wejściach.",
  ekrany: [
    { nazwa: "powitanie-proby", konto: "darmowe", ls: LD, wait: 3000, jezyki: ["pl", "en"], root: "#layer", akcja: START, widoczne: [["przełącznik", ".uxw-przyp"]], cala: false },
    { nazwa: "koniec-proby", konto: "proba-koniec", ls: { ...KONIEC, "mock-progress": PROG }, wait: 4000, jezyki: ["pl", "en"], root: "#layer", widoczne: [["ekran", ".uxw-koniec"], ["plan 199 zł", ".uxw-koniec .uxw-plan.on"]], cala: false },
    { nazwa: "koniec-proby-zero", konto: "proba-koniec", ls: { ...KONIEC, "mock-progress": ZERO }, wait: 4000, rozmiary: [[390, 844]], jezyki: ["pl", "en"], root: "#layer", cala: false },
    { nazwa: "dzis-po-probie", konto: "proba-koniec", ls: { ...KONIEC, "bm-proba-koniec-pokazane": "1" }, jezyki: ["pl", "en"], root: "#main", widoczne: [["pasek „Próba minęła”", ".uxw-pasek.uxw-po"], ["„Kup dostęp”", ".uxw-pasek.uxw-po .uxw-kup"]] },
    { nazwa: "plan-z-maila", konto: "darmowe", q: "?plan=1", ls: LD, rozmiary: [[390, 844]], root: "#layer", cala: false },
  ],
  przejscia: [
    { nazwa: "start-proby-przypomnienie", opis: "darmowe: „Włącz” → powitanie z przełącznikiem → włączenie → potwierdzenie", konto: "darmowe", ls: LD, wait: 3000, kroki: [
      { opis: "klik „Włącz” na pasku → powitanie próby", zrob: START, czekaj: 800, stan: () => ({ h2: document.querySelector("#layer .modal h2")?.textContent, przelacznik: document.querySelector(".uxw-przyp input")?.checked }) },
      { opis: "klik przełącznika → zgoda zapisana", zrob: (p) => p.click(".uxw-przyp"), czekaj: 600, stan: () => ({ wlaczony: document.querySelector(".uxw-przyp input")?.checked, komunikat: document.querySelector(".uxw-przyp-msg")?.textContent, baza: localStorage.getItem("mock-proba-przypomnij") }) },
    ] },
    { nazwa: "koniec-proby", opis: "po próbie: ekran „Twoje 3 dni minęły” → „Zostaję przy darmowych próbkach” → drugie wejście z paskiem → „Kup dostęp”", konto: "proba-koniec", ls: { ...KONIEC, "mock-progress": PROG }, wait: 4000, kroki: [
      { opis: "ekran końca próby", stan: () => document.querySelector(".uxw-koniec")?.innerText.replace(/\s+/g, " ").slice(0, 300) },
      { opis: "klik „Zostaję przy darmowych próbkach” → Dziś z paskiem", zrob: (p) => p.click(".uxw-koniec .btn.ghost"), stan: () => document.querySelector(".uxw-po")?.innerText },
      { opis: "przeładowanie → bez ekranu, pasek nad panelem", zrob: (p) => p.reload(), czekaj: 3500, stan: () => ({ ekran: !!document.querySelector(".uxw-koniec"), pasek: document.querySelector(".uxw-po")?.getBoundingClientRect().height }) },
      { opis: "klik „Kup dostęp” na pasku → wybór planu", zrob: (p) => p.click(".uxw-po .uxw-kup"), stan: () => !!document.querySelector('[aria-label="Wybierz plan"]') },
    ] },
    { nazwa: "koniec-proby-plan", opis: "ekran końca próby → plan 199 zł → okno zgód przed płatnością", konto: "proba-koniec", ls: { ...KONIEC, "mock-progress": PROG }, wait: 4000, kroki: [
      { opis: "ekran końca próby", stan: () => !!document.querySelector(".uxw-koniec") },
      { opis: "klik plan 199 zł → „Zanim zapłacisz”", zrob: (p) => p.click(".uxw-koniec .uxw-plan.on"), stan: () => document.querySelector('[aria-label="Zanim zapłacisz"] h2')?.textContent },
    ] },
  ],
  przewijanie: [{ nazwa: "koniec-proby", konto: "proba-koniec", ls: { ...KONIEC, "mock-progress": PROG } }, { nazwa: "dzis-po-probie", konto: "proba-koniec", ls: { ...KONIEC, "bm-proba-koniec-pokazane": "1" } }],
  ruch: [
    { nazwa: "koniec-proby", konto: "proba-koniec", ls: { ...KONIEC, "mock-progress": PROG }, wait: 3500, elementy: [".uxw-koniec", ".uxw-koniec .uxw-stat", ".uxw-koniec .uxw-plan.on"] },
    { nazwa: "powitanie-proby", konto: "darmowe", ls: LD, wait: 3000, akcja: START, elementy: [".uxw-przyp .uxw-sw", ".uxw-przyp .uxw-sw::after"] },
  ],
};
