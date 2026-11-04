// Etap 1 specu „Systemy z Zdawalni w Skrócie”: lekcje v4 + FSRS razem. Zegar: wtorek 3.11.2026, 18:00.
//   A. limit dnia (30 zaległych + 20 nowych) działa na kartach FSRS i starych,
//   B. FSRS nie wypycha karty za zaliczenie (termin przycięty do dnia przed),
//   C. bez learner.js stare odstępy (pudełka), strona działa.
// BASE=http://127.0.0.1:8811/ node docs/gry/test/scalenie-zdawalni.mjs
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 600)]);
const UID = "00000000-0000-4000-8000-000000000001";
const hashStr = (s) => { let x = 2166136261; for (const ch of String(s)) { x ^= ch.codePointAt(0); x = Math.imul(x, 16777619) >>> 0; } return x.toString(36); };
const fl = Array.from({ length: 4 }, (_, i) => ({ q: `Pojęcie ${i + 1}: co to jest?`, a: `Definicja numer ${i + 1}.` }));
const docs = {
  materials: { L1: { subjectId: "makroekonomia", kind: "lesson", order: 1, title: "Lekcja 1: PKB", flashcardCount: 4, quizCount: 0, createdAt: Date.now(), v: 2 } },
  materialContent: { L1: { v: 2, lesson: { sections: [{ h: "1. PKB", intuition: "PKB to wartość produkcji.", body: "Treść." }] }, flashcards: fl, quiz: [] } },
};
const day = Math.round((new Date(2026, 10, 3) - new Date(2026, 0, 1)) / 864e5);
const dkey = (n) => { const d = new Date(2026, 0, 1 + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const keys = fl.map((f) => "L1:" + hashStr(f.q));
const srsOf = (p) => p.evaluate((u) => JSON.parse(localStorage.getItem("mock-progress") || "{}")[u]?.srs || {}, UID);
async function oceniaj(p, klawisz, n = 1) {
  await p.goto(BASE + "index.html#/review"); await p.waitForTimeout(2500);
  await p.getByRole("button", { name: /Zaczynamy/ }).first().click(); await p.waitForTimeout(800);
  for (let i = 0; i < n; i++) { await p.getByRole("button", { name: "Odwróć kartę" }).click(); await p.waitForTimeout(250); await p.keyboard.press(klawisz); await p.waitForTimeout(400); }
  await p.clock.runFor(3500);
}

// A. 40 zaległych (część FSRS, część stare) + 25 nowych → na dziś 30 + 20
{
  const srs = {};
  for (let i = 0; i < 40; i++) srs["L1:z" + i] = i % 2 ? [2, day - 1] : [2, day - 1, 3.1, 5.2, 2, 0, 2, day - 4];
  for (let i = 0; i < 25; i++) srs["L1:n" + i] = [0, day];
  const p = await page(b, { konto: "platne", ls: { "mock-docs": JSON.stringify(docs), "mock-progress": JSON.stringify({ [UID]: { srs } }) } });
  await p.clock.install({ time: new Date("2026-11-03T18:00:00+01:00") });
  await p.goto(BASE + "index.html#/review"); await p.waitForTimeout(2500);
  const hero = await p.locator(".rv-hero").innerText();
  ok("A: limit dnia 30 zaległych + 20 nowych (FSRS i stare karty)", /50\s*fisz/.test(hero), hero);
  await shot(p, "scal-limit");
  if (p.errors.length) ok("A: bez błędów w konsoli", false, p.errors);
  await p.context().close();
}

// B. zaliczenie za 3 dni: „Łatwe” na nowej karcie dałoby w FSRS więcej dni → termin przycięty do dnia przed zaliczeniem
{
  const srs = { [keys[0]]: [0, day] };
  const deadlines = { d1: { title: "Kolokwium z makro", subjectId: "makroekonomia", type: "kolokwium", part: "W", date: dkey(day + 3) } };
  const p = await page(b, { konto: "platne", ls: { "mock-docs": JSON.stringify({ ...docs, deadlines }), "mock-progress": JSON.stringify({ [UID]: { srs } }) } });
  await p.clock.install({ time: new Date("2026-11-03T18:00:00+01:00") });
  await oceniaj(p, "4");
  const v = (await srsOf(p))[keys[0]];
  ok("B: FSRS + zaliczenie za 3 dni → karta wraca dzień przed (stan FSRS zostaje)", v?.length === 8 && v[1] === day + 2, { v, day });
  if (p.errors.length) ok("B: bez błędów w konsoli", false, p.errors);
  await p.context().close();
}

// C. learner.js się nie wczytał → stare pudełka, wszystko działa
{
  const srs = { [keys[0]]: [0, day] };
  const p = await page(b, { konto: "platne", ls: { "mock-docs": JSON.stringify(docs), "mock-progress": JSON.stringify({ [UID]: { srs } }) } });
  await p.context().route(/learner\.js/, (r) => r.abort());
  await p.clock.install({ time: new Date("2026-11-03T18:00:00+01:00") });
  await oceniaj(p, "3");
  const v = (await srsOf(p))[keys[0]];
  ok("C: bez learner.js: SkrotLearner brak, „Pamiętam” = pudełko 1, jutro (stary odstęp)", !(await p.evaluate(() => !!window.SkrotLearner)) && v?.[0] === 1 && v[1] === day + 1, { v, day });
  ok("C: bez błędów w konsoli", !p.errors.length, p.errors);
  await p.context().close();
}
await b.close();
for (const [s, n, i] of wyniki) console.log(s, n, i);
console.log(`${wyniki.filter((x) => x[0] === "✓").length}/${wyniki.length}`);
