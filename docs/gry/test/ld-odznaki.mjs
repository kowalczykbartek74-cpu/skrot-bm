// Karty „Lekcje dla Ciebie”: odznaka przedmiotu i chipy nie mogą być przycięte (zgłoszenie 14.11: „Logis…”).
// Uruchom: python3 -m http.server 8765 w repo, potem node docs/gry/test/ld-odznaki.mjs
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 700)]);
const UID = "00000000-0000-4000-8000-000000000001";
const A = "analiza-matematyczna", M = "logistyka", Z = "podstawy-zarzadzania", P = "prawo", O = "ochrona-wlasnosci-intelektualnej";
const sec = (t, i) => ({ h: `${i + 1}. ${t}`, body: `Akapit ${i + 1} o **Contract** w temacie ${t}.`, check: { q: `Check ${t} ${i + 1}?`, options: ["Dobra", "Zła"], correct: 0 } });
const lesson = (t) => ({ sections: [0, 1, 2, 3].map((i) => sec(t, i)), exit: [{ q: `Bilet ${t}?`, options: ["Dobra", "Zła"], correct: 0 }], recap: { prompt: `Wyjaśnij ${t}.`, keys: ["a"], model: "Wzór." }, exercises: [], faded: {}, formulas: [] });
const quiz = (t) => Array.from({ length: 12 }, (_, i) => ({ q: `Quiz ${t} ${i + 1}?`, options: ["Dobra", "Zła", "Zła 2", "Zła 3"], correct: 0, explanation: "Bo tak." }));
const concepts = (t) => [{ term: "Contract", definition: "Umowa: zgodne oświadczenia woli stron." }, ...Array.from({ length: 7 }, (_, i) => ({ term: `Term ${t} ${i}`, definition: `Definicja ${i}.` }))];
const mat = (sid, order, title) => ({ subjectId: sid, kind: "lesson", order, unit: 1, unitTitle: "Dział", title, minutes: 35, quizCount: 12, flashcardCount: 0, conceptCount: 8, createdAt: Date.now(), v: 2 });
const content = (t) => ({ v: 2, lesson: lesson(t), quiz: quiz(t), flashcards: [], concepts: concepts(t), notes: [], tldr: "" });
const docs = {
  materials: { A1: mat(A, 1, "Lekcja 1: Pochodne funkcji"), M1: mat(M, 1, "Logistic processes in the enterprise and logistics customer service"), O1: mat(O, 1, "Lekcja 1: Prawo autorskie"), Z1: mat(Z, 1, "Lekcja 1: Funkcje zarządzania"), P1: mat(P, 1, "Lekcja 1: Umowy i zobowiązania") },
  materialContent: { A1: content("pochodne"), M1: content("logistyka"), O1: content("owi"), Z1: content("funkcje"), P1: content("umowy") },
  meta: { po: { items: {} }, stas: { items: {} } },
};
const ls0 = { "mock-docs": JSON.stringify(docs), "mock-progress": JSON.stringify({ [UID]: {} }), "bm-ld-flag": "1" };
// Pozwala wymusić tematy lekcji (np. Logistyka + Narzędzia IT), żeby sprawdzić najdłuższe nazwy.
const lang = process.env.LANG2 || "pl";
for (const [w, h] of [[1280, 900], [1024, 800], [390, 844], [360, 740]]) {
  const p = await page(b, { konto: "platne", w, h, lang, ls: ls0 });
  await p.clock.setFixedTime(new Date("2026-11-14T17:00:00+01:00"));
  await p.goto(BASE + "index.html?ld=1#/"); await p.waitForTimeout(3500);
  const tiles = p.locator(".ld-tile");
  const n = await tiles.count();
  ok(`${w}px: są karty lekcji`, n > 0, n);
  // każda odznaka: tekst mieści się (scrollWidth ≤ clientWidth) i nie wychodzi poza kartę
  const bad = await p.evaluate(() => [...document.querySelectorAll(".ld-tile")].flatMap((t) => {
    const tr = t.getBoundingClientRect(), out = [];
    for (const el of t.querySelectorAll(".nb-badge, .ld-subj, .ld-subj > span, .sk-chip, h3, .meta, .btn")) {
      const r = el.getBoundingClientRect();
      if (!r.width) continue; // ukryte na telefonie (display: none)
      if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).textOverflow !== "ellipsis") out.push(["przycięte", el.className, el.textContent]);
      if (r.right > tr.right + 0.5 || r.left < tr.left - 0.5) out.push(["poza kartą", el.className, el.textContent, Math.round(r.right), Math.round(tr.right)]);
    }
    return out;
  }));
  ok(`${w}px: nic nie przycięte i nic poza kartą`, bad.length === 0, bad);
  // nazwa przedmiotu cała widoczna (najdłuższe w tym teście: „Logistyka”, „OWI”, „Analiza matematyczna”…)
  const names = await p.evaluate(() => [...document.querySelectorAll(".ld-subj > span")].map((e) => [e.textContent, e.scrollWidth <= e.clientWidth]));
  ok(`${w}px: nazwa przedmiotu w pastylce widoczna w całości`, names.length && names.every((x) => x[1]), names);
  ok(`${w}px: bez poziomego przewijania`, await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "");
  ok(`${w}px: konsola bez błędów`, p.errors.length === 0, p.errors);
  if (n) { await tiles.first().scrollIntoViewIfNeeded(); await p.locator(".ld-lessons").screenshot({ path: `/tmp/gry-shots/ld-odznaki-${lang}-${w}.png` }); }
  await p.close();
}
await b.close();
for (const r of wyniki) console.log(r.join("  "));
process.exit(wyniki.some((r) => r[0] === "✗") ? 1 : 0);
