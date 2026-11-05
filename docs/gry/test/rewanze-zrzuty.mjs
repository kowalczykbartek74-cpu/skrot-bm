// Zrzuty etapu 2 (rewanże): Powtórki z blokiem „Rewanże” i karta rewanżu, 375 i 1280 px, PL i EN.
// BASE=http://127.0.0.1:8811/ OUT=… node docs/gry/test/rewanze-zrzuty.mjs
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const UID = "00000000-0000-4000-8000-000000000001";
const now = new Date("2026-11-04T18:00:00+01:00").getTime();
const quiz = (tag) => Array.from({ length: 4 }, (_, i) => ({ q: `${tag}: pytanie ${i}?`, options: ["Pierwsza", "Druga", "Trzecia", "Czwarta"], correct: i % 4 }));
const docs = {
  materials: { m1: { subjectId: "makroekonomia", title: "PKB i inflacja", quizCount: 4, flashcardCount: 0, createdAt: now - 1e6, v: 2 } },
  materialContent: { m1: { v: 2, summary: "x", quiz: quiz("Makro"), flashcards: [] } },
};
const day = Math.round((new Date(2026, 10, 4) - new Date(2026, 0, 1)) / 864e5);
const prog = { group: "C111", sub: "A", rewPok: 2, rew: { "z:m1:0": [[day - 1, 0]], "z:m1:1": [[day - 1, 0]], "z:m1:2": [[day, 0]] } };
for (const [w, h] of [[375, 812], [1280, 900]]) for (const lang of ["pl", "en"]) {
  const p = await page(b, { konto: "platne", lang, w, h, ls: { "mock-docs": JSON.stringify(docs), "mock-progress": JSON.stringify({ [UID]: prog }) } });
  await p.clock.install({ time: new Date(now) });
  await p.goto(BASE + "index.html#/review"); await p.waitForTimeout(2500);
  await shot(p, `rew-${w}-${lang}-powtorki`);
  await p.locator(".rv-rew").scrollIntoViewIfNeeded().catch(() => {});
  await shot(p, `rew-${w}-${lang}-blok`);
  await p.getByRole("button", { name: /Zaczynamy|Let's go|Start/ }).first().click().catch(() => {}); await p.waitForTimeout(900);
  await shot(p, `rew-${w}-${lang}-karta`);
  if (p.errors.length) console.log(w, lang, p.errors);
  await p.context().close();
}
await b.close();
console.log("ok");
