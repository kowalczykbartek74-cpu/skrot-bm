// Wygląd H (15.11.2026): karta „Dziś · 5 min” na górze, Staś w pierścieniu, kafle „Temat X z Y” + „Zaczynamy”, quiz 3D.
// BASE=http://127.0.0.1:8799/ node docs/gry/test/wyglad-h.mjs
import { chromium, BASE, OUT, page } from "./lib.mjs";
let pass = 0, fail = 0;
const ok = (name, cond, info) => { if (cond) { pass++; console.log("✓", name); } else { fail++; console.log("✗", name, JSON.stringify(info ?? "").slice(0, 300)); } };
const b = await chromium.launch();
// Te same dane co lekcja-dnia-4.mjs (5 lekcji w 3 przedmiotach), zegar 6.11.2026 17:00.
const UID = "00000000-0000-4000-8000-000000000001";
const A = "analiza-matematyczna", M = "logistyka", Z = "podstawy-zarzadzania";
const sec = (t, i) => ({ h: `${i + 1}. ${t} ${i + 1}`, body: `Akapit ${i + 1} o **pojęciu ${i + 1}** w temacie ${t}.`, check: { q: `Check ${t} ${i + 1}?`, options: ["Dobrze", "Źle"], correct: 0 } });
const lesson = (t) => ({ sections: [0, 1, 2, 3, 4, 5].map((i) => sec(t, i)), exit: [0, 1, 2].map((i) => ({ q: `Bilet ${t} ${i + 1}?`, options: ["Tak", "Nie"], correct: 0 })), recap: { prompt: `Wyjaśnij ${t}.`, keys: ["a"], model: "Wzór." }, exercises: [{ task: "Ćwiczenie", answer: "1", level: 2 }], faded: {}, formulas: [] });
const quiz = (t) => Array.from({ length: 10 }, (_, i) => ({ q: `Quiz ${t} ${i + 1}?`, options: ["Dobra", "Zła", "Zła 2", "Zła 3"], correct: 0 }));
const concepts = (t) => Array.from({ length: 8 }, (_, i) => ({ term: `Term ${t} ${i}`, definition: `Definicja ${i}.` }));
const mat = (sid, order, title) => ({ subjectId: sid, kind: "lesson", order, unit: 1, unitTitle: "Dział", title, minutes: 35, quizCount: 10, flashcardCount: 0, conceptCount: 8, createdAt: Date.now(), v: 2 });
const content = (t) => ({ v: 2, lesson: lesson(t), quiz: quiz(t), flashcards: [], concepts: concepts(t), notes: [], tldr: "" });
const docs = {
  materials: { A1: mat(A, 1, "Lekcja 1: Pochodne funkcji"), A2: mat(A, 2, "Lekcja 2: Całki oznaczone"), M1: mat(M, 1, "Lekcja 1: Łańcuch dostaw"), M2: mat(M, 2, "Lekcja 2: Zapasy i magazyny"), Z1: mat(Z, 1, "Lekcja 1: Funkcje zarządzania") },
  materialContent: { A1: content("pochodne"), A2: content("całki"), M1: content("łańcuch"), M2: content("zapasy"), Z1: content("funkcje") },
  meta: { po: { items: {} }, stas: { items: {} } },
};
const ls0 = { "mock-docs": JSON.stringify(docs), "mock-progress": JSON.stringify({ [UID]: {} }) };
const openFast = async (o = {}) => {
  const p = await page(b, { konto: "starosta", w: o.w || 375, h: o.h || 812, ls: { ...ls0, "bm-ld-flag": "1" } });
  await p.clock.setFixedTime(new Date("2026-11-06T17:00:00+01:00"));
  await p.goto(BASE + "index.html?ld=1#/"); await p.locator(".ld-block").waitFor({ timeout: 15000 });
  return p;
};
const open = async (o = {}) => {
  const p = await page(b, { konto: "starosta", w: o.w || 375, h: o.h || 812, lang: o.lang || "pl", ls: { ...ls0, "bm-ld-flag": "1" }, ctx: o.dark ? { colorScheme: "dark" } : {} });
  await p.clock.setFixedTime(new Date("2026-11-06T17:00:00+01:00"));
  await p.goto(BASE + "index.html?ld=1#/"); await p.waitForTimeout(3500);
  return p;
};

for (const [w, h] of [[375, 812], [1280, 900]]) {
  const p = await open({ w, h });
  await p.screenshot({ path: `${OUT}/h-dzis-${w}.png` });
  await p.screenshot({ path: `${OUT}/h-dzis-${w}-cala.png`, fullPage: true });
  ok(`${w}: karta H na górze (zaraz po powitaniu)`, await p.evaluate(() => document.querySelector("main .greet")?.nextElementSibling?.classList.contains("ld-block")), "");
  ok(`${w}: Staś w pierścieniu postępu (SVG z segmentami, aria-label)`, await p.locator(".zh-hero .stas-ring svg circle.sr-on, .zh-hero .stas-ring svg circle.sr-off, .zh-hero .stas-ring svg circle.sr-next").count() > 0 && /Pierścień postępu/.test(await p.locator(".zh-hero .stas-ring").getAttribute("aria-label")), "");
  const cta = await p.locator(".zh-hero .zh-go.sk-start").boundingBox();
  ok(`${w}: przycisk „Zaczynamy” na pierwszym ekranie`, cta && cta.y + cta.height <= h, cta);
  ok(`${w}: kafle mają rodzaj, „Temat X z Y” i „Zaczynamy”`, (await p.locator(".ld-tile .zh-kind").count()) >= 2 && (await p.locator(".ld-tile .zh-tbar b").count()) >= 1 && (await p.locator(".ld-tile").getByRole("button", { name: /^Zaczynamy/ }).count()) >= 1, "");
  
  await p.locator(".zh-hero").getByRole("button", { name: /Mam więcej czasu/ }).click(); await p.waitForTimeout(300);
  ok(`${w}: po kliknięciu (render) karta nie animuje się od nowa`, await p.locator(".ld-block.zh-anim").count() === 0 && await p.locator(".zh-bubble").evaluate((e) => getComputedStyle(e).animationName === "none"), "");
  await p.locator(".zh-hero").getByRole("button", { name: /Mam więcej czasu/ }).click(); await p.waitForTimeout(300);
  ok(`${w}: bez poziomego przewijania strony`, await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "");
  ok(`${w}: bez błędów w konsoli`, p.errors.length === 0, p.errors);
  await p.close();
}
{ const f = await openFast(); ok("animacje wejścia przy pierwszym pokazaniu tematu", await f.locator(".ld-block.zh-anim").count() === 1, ""); await f.close(); }
// Ciemny i angielski
const d = await open({ dark: true });
await d.screenshot({ path: `${OUT}/h-dzis-375-ciemny.png` });
ok("ciemny: karta ciemnozielona z białym tekstem", await d.locator(".zh-hero").evaluate((e) => getComputedStyle(e).backgroundColor) === "rgb(21, 112, 60)", await d.locator(".zh-hero").evaluate((e) => getComputedStyle(e).backgroundColor));
await d.close();
const e = await open({ lang: "en" });
await e.screenshot({ path: `${OUT}/h-dzis-375-en.png` });
const enTxt = await e.locator(".ld-block").innerText();
ok("EN: bez polskich napisów H", !/Zaczynamy|Umiesz|Do zaliczenia|Temat \d|Najważniejsze teraz|Na zmianę|wystarczy/.test(enTxt), enTxt.slice(0, 400));
await e.close();
// Quiz: kafle 3D, po odpowiedzi zielona / czerwona
const q = await page(b, { konto: "starosta", w: 390, h: 844, ls: { ...ls0, "bm-ld-flag": "1" } });
await q.goto(BASE + "index.html#/"); await q.waitForTimeout(3000);
await q.evaluate((A) => { location.hash = "#/subjectQuiz/" + A; }, A); await q.waitForTimeout(3000);
for (const re of [/^Zaczynamy/, /Zacznij|Rozpocznij|Start/i]) { const s = q.locator("main").getByRole("button", { name: re }).first(); if (await s.count()) { await s.click().catch(() => {}); await q.waitForTimeout(1000); } }
const opts = q.locator(".lp-opts .opt, .quiz .opt");
if (await opts.count()) {
  await q.screenshot({ path: `${OUT}/h-quiz-czeka.png` });
  ok("quiz: kafle z grubszym dołem (3D)", await opts.first().evaluate((e) => parseFloat(getComputedStyle(e).borderBottomWidth) >= 5), "");
  await opts.first().click(); await q.waitForTimeout(600);
  await q.screenshot({ path: `${OUT}/h-quiz-odp.png` });
  // W odtwarzaczu zła odpowiedź daje drugą szansę (poprawna jeszcze ukryta), dobra od razu zielona.
ok("quiz: po odpowiedzi kafel oznaczony na zielono albo czerwono (3D zostaje)", (await q.locator(".lp-opts .opt.right, .lp-opts .opt.wrong, .quiz .opt.right, .quiz .opt.wrong").count()) >= 1, "");
} else ok("quiz: znaleziono pytania", false, await q.locator("main").innerText());
ok("quiz: bez błędów w konsoli", q.errors.length === 0, q.errors);
await b.close();
console.log(`${pass}/${pass + fail}`);
process.exit(fail ? 1 : 0);
