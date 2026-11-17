// Etap 4 – paywall, odzyskiwanie, zaufanie: ekrany, przejścia, przewijanie i ruch dla pomiary.mjs.
const LD = { "bm-ld-flag": "1" };
const PK = { "skrot-proba-do": "2026-11-14T17:00:00+01:00", "bm-proba-koniec-pokazane": "1", ...LD };
const KUP = (plan) => async (p) => { await p.evaluate((x) => window.skrot.buy(x), plan); };
export default {
  opis: "Etap 4: paywall lekcji (199 zł z przeliczeniem na miesiąc na górze, 35 zł drugi, co jest w lekcji), wybór planu z „to ok. X zł miesięcznie”, przycisk płatności bez zgód z komunikatem, karta „+2 dni przed kolokwium” (SQL v54), arkusz przed portalem Stripe przy planie miesięcznym, licznik rocznika od 15 osób, FAQ „Kto to robi?”, link „Usuń konto i dane”. Do tego poprawki po etapie 3 (koniec próby z bazy, mail w dzień, karty planów jako wybór z przyklejonym przyciskiem).",
  ekrany: [
    { nazwa: "paywall-lekcji-po-probie", konto: "proba-koniec", ls: PK, hash: "/material/A2", wait: 4000, jezyki: ["pl", "en"], root: "#main", widoczne: [["„199 zł do lipca…”", ".uxw-paywall-act .btn.primary"], ["spis lekcji", ".uxw-spis"]] },
    { nazwa: "paywall-lekcji-darmowe", konto: "darmowe", ls: LD, hash: "/material/A2", wait: 4000, rozmiary: [[360, 640], [390, 844]], root: "#main", widoczne: [["przyciski", ".uxw-paywall-act"]] },
    { nazwa: "wybor-planu", konto: "proba-koniec", ls: PK, akcja: KUP(), jezyki: ["pl", "en"], root: "#layer", cala: false },
    { nazwa: "zgody-bez-zaznaczenia", konto: "proba-koniec", ls: PK, rozmiary: [[390, 844]], jezyki: ["pl", "en"], root: "#layer", akcja: async (p) => { await KUP("rok")(p); await p.waitForTimeout(400); await p.click(".modal .btn.primary"); }, cala: false },
    { nazwa: "dzis-plus-2-dni", konto: "proba-koniec", ls: { ...PK, "mock-bonus": "1" }, wait: 4000, jezyki: ["pl", "en"], root: "#main", widoczne: [["karta „+2 dni”", ".uxw-bonus"]] },
    { nazwa: "przed-portalem", konto: "platne", ls: LD, rozmiary: [[390, 844], [1280, 900]], jezyki: ["pl", "en"], root: "#layer", akcja: (p) => p.evaluate(() => { window.skrot.plan = "miesiac"; window.skrot.manage(); }), cala: false },
    { nazwa: "logowanie-licznik-faq", konto: "brak", ls: { "mock-licznik": "40" }, rozmiary: [[390, 844], [1280, 900]], jezyki: ["pl", "en"], root: "#login", akcja: (p) => p.evaluate(() => { const d = [...document.querySelectorAll("#login .lg-demo details")].find((x) => /Kto to robi|Who makes/.test(x.textContent)); if (d) { d.open = true; d.scrollIntoView({ block: "center" }); } }) },
    { nazwa: "koniec-proby-360", konto: "proba-koniec", ls: { "skrot-proba-do": "2026-11-14T17:00:00+01:00", ...LD }, wait: 4000, rozmiary: [[360, 640]], root: "#layer", widoczne: [["„Wybierz 199 zł”", ".uxw-koniec .uxw-dol .uxw-kup"]], cala: false },
  ],
  przejscia: [
    { nazwa: "paywall-kup", opis: "po próbie: lekcja z kłódką → „199 zł do lipca” → okno zgód → klik bez zgód → komunikat i fokus", konto: "proba-koniec", ls: PK, hash: "/material/A2", wait: 4000, kroki: [
      { opis: "paywall lekcji", stan: () => [...document.querySelectorAll(".uxw-paywall-act button")].map((x) => x.textContent) },
      { opis: "klik „199 zł do lipca…” → „Zanim zapłacisz”", zrob: (p) => p.click(".uxw-paywall-act .btn.primary"), stan: () => document.querySelector('[aria-label="Zanim zapłacisz"] h2')?.textContent },
      { opis: "klik „Przejdź do płatności” bez zgód → komunikat, fokus na 1. zgodzie", zrob: (p) => p.click('[aria-label="Zanim zapłacisz"] .btn.primary'), stan: () => ({ msg: document.querySelector(".uxw-zgody")?.textContent, fokus: document.activeElement?.type }) },
    ] },
    { nazwa: "plus-2-dni", opis: "po próbie, kolokwium za 5 dni: karta „+2 dni” → „Włącz 2 dni za darmo” → próba znów trwa", konto: "proba-koniec", ls: { ...PK, "mock-bonus": "1" }, wait: 4000, kroki: [
      { opis: "Dziś z kartą", stan: () => document.querySelector(".uxw-bonus")?.innerText },
      { opis: "klik → przeładowanie, powitanie próby", zrob: (p) => p.click(".uxw-bonus .btn"), czekaj: 4000, stan: () => ({ konto: localStorage.getItem("mock-konto"), h2: document.querySelector("#layer .modal h2")?.textContent }) },
    ] },
    { nazwa: "anulowanie-miesiecznego", opis: "plan miesięczny: Zarządzaj → arkusz porównania → „Przejdź na 199 zł” → zgody 199 zł", konto: "platne", ls: LD, wait: 3000, kroki: [
      { opis: "arkusz przed portalem", zrob: (p) => p.evaluate(() => { window.skrot.plan = "miesiac"; window.skrot.manage(); }), stan: () => document.querySelector(".uxw-porownanie")?.innerText.replace(/\s+/g, " ") },
      { opis: "klik „Przejdź na 199 zł”", zrob: (p) => p.click('.uxw-porownanie button:has-text("Przejdź na 199 zł")'), stan: () => document.querySelector('[aria-label="Zanim zapłacisz"] .btn.primary')?.textContent },
    ] },
  ],
  przewijanie: [{ nazwa: "paywall-lekcji", konto: "proba-koniec", ls: PK, hash: "/material/A2" }, { nazwa: "dzis-plus-2-dni", konto: "proba-koniec", ls: { ...PK, "mock-bonus": "1" } }, { nazwa: "logowanie", konto: "brak", ls: { "mock-licznik": "40" } }],
  ruch: [{ nazwa: "dzis-plus-2-dni", konto: "proba-koniec", ls: { ...PK, "mock-bonus": "1" }, wait: 3500, elementy: [".uxw-bonus", ".uxw-bonus .btn"] }],
};
