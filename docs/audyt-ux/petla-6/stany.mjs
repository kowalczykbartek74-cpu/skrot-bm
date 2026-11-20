// Stany startowe zadań pętli UX-6 (sekcja C) na atrapie: wspólne dla sondy, kontroli i ux6-zadania.mjs.
// Zegar stron = 6.11.2026 17:00 (h2-lib.mjs). STANY(nazwa) → { ls } (dokładane do localStorage przed załadowaniem strony).
import { docs, UID } from "../../gry/test/h2-lib.mjs";

const dayN = (iso) => { const [y, m, d] = iso.slice(0, 10).split("-").map(Number); return Math.round((new Date(y, m - 1, d) - new Date(2026, 0, 1)) / 864e5); };
export const T = dayN("2026-11-06");
const NOW = new Date("2026-11-06T17:00:00+01:00").getTime();
const hashStr = (s) => { let x = 2166136261; for (const ch of String(s)) { x ^= ch.codePointAt(0); x = Math.imul(x, 16777619) >>> 0; } return x.toString(36); };

// Terminy widoczne dla wszystkich (rok i grupa C111): kolokwium z OWI z zakresem, kolokwium z logistyki (do przesunięcia przez starostę).
export const DEADLINES = {
  owi1: { title: "Kolokwium: Ochrona własności intelektualnej", type: "kolokwium", subjectId: "ochrona-wlasnosci-intelektualnej", part: "W", date: "2026-11-20", note: "Zakres: prawo autorskie, znaki towarowe, patenty (wykłady 1–5).", createdAt: NOW - 9e6 },
  log1: { title: "Kolokwium: Logistyka", type: "kolokwium", subjectId: "logistyka", date: "2026-12-04", createdAt: NOW - 8e6 },
  est1: { title: "Projekt: Podstawy zarządzania", type: "projekt", subjectId: "podstawy-zarzadzania", date: "2026-11-25", approx: true, createdAt: NOW - 7e6 },
};
// Jak na produkcji każdy przedmiot BM z terminem ma lekcje: dokładamy lekcje z prawa i makroekonomii (treść = kopia lekcji testowej z h2-lib).
const kopia = (id, sid, order, title) => [id, { ...docs.materials.A1, subjectId: sid, order, title }, JSON.parse(JSON.stringify(docs.materialContent.A1))];
const LEKCJE = [kopia("P1", "prawo", 1, "Lekcja 1: Źródła prawa i hierarchia aktów"), kopia("P2", "prawo", 2, "Lekcja 2: Umowy i odpowiedzialność"), kopia("K1", "makroekonomia", 1, "Lekcja 1: Inflacja i jej pomiar")];
const DOCS6 = { ...docs, materials: { ...docs.materials, ...Object.fromEntries(LEKCJE.map(([id, m]) => [id, m])) }, materialContent: { ...docs.materialContent, ...Object.fromEntries(LEKCJE.map(([id, , c]) => [id, c])) } };
const docsZ = (extra = {}) => JSON.stringify({ ...DOCS6, deadlines: { ...DEADLINES, ...extra } });
const prog = (o) => JSON.stringify({ [UID]: o });
const srs = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => ["m1:" + hashStr(`PKB: pojęcie ${i + 1}`), [3, T - 1 - (i % 3), 0, 0, 0, 0, 0, 0]]));

export function STANY(nazwa) {
  // mock-proba-koniec-do: koniec próby przed zegarem stron (6.11), inaczej konto „proba-koniec” wygląda jak próba w przyszłości
  const ls = { "mock-docs": docsZ(), "mock-progress": prog({}), "mock-v24": "1", "mock-proba-koniec-do": "2026-11-05T17:00:00+01:00" };
  for (const s of String(nazwa || "").split(",").filter(Boolean)) {
    if (s === "termin-prawo-3dni") ls["mock-docs"] = docsZ({ pr1: { title: "Kolokwium: Prawo", type: "kolokwium", subjectId: "prawo", date: "2026-11-09", createdAt: NOW - 6e6 } });
    else if (s === "fiszki") ls["mock-progress"] = prog({ srs: srs(8), xp: { t: 120, d: T - 1, n: 10 }, streak: { d: T - 1, n: 2 }, nd: [T - 2, T - 1] });
    else if (s === "w-trakcie") ls["mock-progress"] = prog({ done: { A1: NOW - 2 * 864e5 }, seen: ["A1"], xp: { t: 260, d: T - 1, n: 20 }, streak: { d: T - 1, n: 3 }, nd: [T - 3, T - 2, T - 1] });
    else if (s === "przerwa-7") ls["mock-progress"] = prog({ done: { A1: NOW - 8 * 864e5 }, seen: ["A1", "A2"], xp: { t: 400, d: T - 7, n: 15 }, streak: { d: T - 7, n: 3 }, nd: [T - 9, T - 8, T - 7] });
    else if (s === "saldo") { ls["mock-saldo"] = "150"; ls["mock-rp-trwale"] = "1"; }
    else if (s === "grupa-C112") ls["bm-group"] = "C112";
    else if (s === "swiezy") ls["mock-progress"] = prog({});
    // nowy gość z linku: bez zapisanej grupy i labu (lib.mjs ustawia C111/A) → strona zaczyna od wyboru kierunku
    else if (s === "nowy") { ls["bm-group"] = ""; ls["bm-sub"] = ""; }
    else throw new Error("nieznany stan: " + s);
  }
  return { ls };
}
