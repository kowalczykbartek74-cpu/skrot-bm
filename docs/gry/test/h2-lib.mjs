// Wspólne dla testów wyglądu H2 (jasny i ciemny zielony): dane jak w lekcja-dnia-4.mjs, zegar 6.11.2026 17:00.
import { chromium, BASE, OUT, page } from "./lib.mjs";
export { chromium, BASE, OUT };
export const UID = "00000000-0000-4000-8000-000000000001";
export const A = "analiza-matematyczna", M = "logistyka", Z = "podstawy-zarzadzania";
const sec = (t, i) => ({ h: `${i + 1}. ${t} ${i + 1}`, body: `Akapit ${i + 1} o **pojęciu ${i + 1}** w temacie ${t}.`, check: { q: `Check ${t} ${i + 1}?`, options: ["Dobrze", "Źle"], correct: 0 } });
const lesson = (t) => ({ sections: [0, 1, 2, 3, 4, 5].map((i) => sec(t, i)), exit: [0, 1, 2].map((i) => ({ q: `Bilet ${t} ${i + 1}?`, options: ["Tak", "Nie"], correct: 0 })), recap: { prompt: `Wyjaśnij ${t}.`, keys: ["a"], model: "Wzór." }, exercises: [{ task: "Ćwiczenie", answer: "1", level: 2 }], faded: {}, formulas: [] });
const quiz = (t) => Array.from({ length: 10 }, (_, i) => ({ q: `Quiz ${t} ${i + 1}?`, options: ["Dobra", "Zła", "Zła 2", "Zła 3"], correct: 0 }));
const concepts = (t) => Array.from({ length: 8 }, (_, i) => ({ term: `Term ${t} ${i}`, definition: `Definicja ${i}.` }));
const mat = (sid, order, title) => ({ subjectId: sid, kind: "lesson", order, unit: 1, unitTitle: "Dział", title, minutes: 35, quizCount: 10, flashcardCount: 0, conceptCount: 8, createdAt: Date.now(), v: 2 });
const content = (t) => ({ v: 2, lesson: lesson(t), quiz: quiz(t), flashcards: [], concepts: concepts(t), notes: [], tldr: "" });
export const docs = {
  materials: { A1: mat(A, 1, "Lekcja 1: Pochodne funkcji"), A2: mat(A, 2, "Lekcja 2: Całki oznaczone"), M1: mat(M, 1, "Lekcja 1: Łańcuch dostaw"), M2: mat(M, 2, "Lekcja 2: Zapasy i magazyny"), Z1: mat(Z, 1, "Lekcja 1: Funkcje zarządzania") },
  materialContent: { A1: content("pochodne"), A2: content("całki"), M1: content("łańcuch"), M2: content("zapasy"), Z1: content("funkcje") },
  meta: { po: { items: {} }, stas: { items: {} } },
};
export const ls0 = { "mock-docs": JSON.stringify(docs), "mock-progress": JSON.stringify({ [UID]: {} }) };
export async function open(b, o = {}) {
  const p = await page(b, { konto: o.konto || "starosta", w: o.w || 375, h: o.h || 812, lang: o.lang || "pl", ls: { ...ls0, "bm-ld-flag": "1", ...(o.theme ? { "skrot-theme": o.theme } : {}), ...(o.ls || {}) }, ctx: { ...(o.dark ? { colorScheme: "dark" } : {}), ...(o.ctx || {}) } /* ux-6: np. locale pl-PL w sondzie */ });
  await p.clock.setFixedTime(new Date("2026-11-06T17:00:00+01:00"));
  // o.fonts: prawdziwe czcionki z Google Fonts (inaczej lib.mjs blokuje wszystko spoza 127.0.0.1 i zrzuty mają czcionkę systemową).
  if (o.fonts) await p.context().route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (r) => r.continue());
  if (o.motion) await p.emulateMedia({ reducedMotion: o.motion });
  await p.goto(BASE + "index.html?ld=1#" + (o.hash || "/")); await p.waitForTimeout(o.wait ?? 3000);
  return p;
}
export function tester() {
  let pass = 0, fail = 0;
  const ok = (name, cond, info) => { if (cond) { pass++; console.log("✓", name); } else { fail++; console.log("✗", name, JSON.stringify(info ?? "").slice(0, 400)); } };
  const end = () => { console.log(`${pass}/${pass + fail}`); process.exit(fail ? 1 : 0); };
  return { ok, end };
}
// Klatki na sekundę przy spowolnionym procesorze (4×): liczymy requestAnimationFrame w czasie akcji.
export async function fps(p, action, ms = 1500) {
  const cdp = await p.context().newCDPSession(p);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await p.evaluate((ms) => { window.__f = 0; const t0 = performance.now(); const tick = () => { window.__f++; if (performance.now() - t0 < ms) requestAnimationFrame(tick); else window.__fps = window.__f / ((performance.now() - t0) / 1000); }; requestAnimationFrame(tick); }, ms);
  await action();
  await p.waitForTimeout(ms + 300);
  const r = await p.evaluate(() => window.__fps);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  return Math.round(r);
}
