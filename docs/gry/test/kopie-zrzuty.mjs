// Zrzuty etapu 3: test oddany bez sieci (czeka na AI) i przywrócony wpis w kalendarzu, 375 i 1280 px, PL i EN.
// BASE=http://127.0.0.1:8811/ OUT=… node docs/gry/test/kopie-zrzuty.mjs
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const SID = "ochrona-wlasnosci-intelektualnej", now = Date.now();
const quiz = (n, tag) => Array.from({ length: n }, (_, i) => ({ q: `${tag}: question ${i + 1}?`, options: ["A" + i, "B" + i, "C" + i, "D" + i], correct: i % 4 }));
const DOCS = {
  materials: Object.fromEntries([0, 1, 2, 3, 4, 5].map((i) => ["o" + i, { subjectId: SID, title: "Topic " + i, quizCount: 8, flashcardCount: 0, createdAt: now - (9 - i) * 1e6, v: 2, source: "sylabus" }])),
  materialContent: Object.fromEntries([0, 1, 2, 3, 4, 5].map((i) => ["o" + i, { v: 2, tldr: "T" + i, quiz: quiz(8, "T" + i), flashcards: [] }])),
  deadlines: { d1: { title: "Kolokwium OWI", subjectId: SID, type: "kolokwium", part: "W", date: new Date(now + 10 * 864e5).toISOString().slice(0, 10), approx: true } },
  examBank: { [SID]: { items: [{ id: "ob1", type: "open", mid: "o3", q: "What is the right of quotation?", answer: "Using fragments.", rubric: [{ t: "Explains quotation", p: 2 }] }], done: [] } },
};
for (const [w, h] of [[375, 812], [1280, 900]]) for (const lang of ["pl", "en"]) {
  const p = await page(b, { konto: "platne", lang, w, h, ls: { "mock-docs": JSON.stringify(DOCS), "skrot:kopia:kalendarz:nowy:co": JSON.stringify({ v: "Powtórka rozdziału 3", at: now }) } });
  await p.context().route(/functions\/v1\/grade-open/, (r) => r.abort("internetdisconnected"));
  await p.goto(BASE + "index.html#/exam/" + SID); await p.waitForTimeout(2500);
  await p.locator(".plan-test-row button").first().click(); await p.waitForTimeout(1500);
  await p.click(".sk-gridbtn"); await p.waitForTimeout(300);
  await p.locator(".lp-sheet button, button").filter({ hasText: /Pokaż jako listę|Show as a list/ }).first().click(); await p.waitForTimeout(600);
  for (const ta of await p.locator(".ex-item textarea").all()) await ta.fill("Cytat to fragment utworu z autorem i źródłem.");
  await p.context().setOffline(true);
  await p.locator(".exam-bar button").filter({ hasText: /Oddaj test|Submit/ }).first().click(); await p.waitForTimeout(200);
  await p.locator(".modal button").filter({ hasText: /^Oddaj$|^Submit$/ }).first().click(); await p.waitForTimeout(1500);
  await shot(p, `kop-${w}-${lang}-test-offline`);
  await p.context().setOffline(false);
  await p.goto(BASE + "index.html#/calendar"); await p.waitForTimeout(1500);
  await p.locator("button").filter({ hasText: /Mój wpis|My entry/ }).first().click(); await p.waitForTimeout(500);
  await shot(p, `kop-${w}-${lang}-kalendarz`);
  if (p.errors.length) console.log(w, lang, p.errors);
  await p.context().close();
}
await b.close();
console.log("ok");
