// Numer lekcji = miejsce w kursie przedmiotu (zawsze od 1), także gdy w bazie order = 91+ (uzupełnienia z paczek).
// Uruchom: python3 -m http.server 8765 w repo, potem PW_FROM=... node docs/gry/test/numer-od-1.mjs
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 700)]);
const UID = "00000000-0000-4000-8000-000000000001";
const Z = "podstawy-zarzadzania";
const sec = (t, i) => ({ h: `${i + 1}. ${t}`, body: `Akapit ${i + 1} w temacie ${t}.`, check: { q: `Check ${t} ${i + 1}?`, options: ["Dobra", "Zła"], correct: 0 } });
const lesson = (t) => ({ sections: [0, 1, 2].map((i) => sec(t, i)), exit: [{ q: `Bilet ${t}?`, options: ["Dobra", "Zła"], correct: 0 }], recap: { prompt: `Wyjaśnij ${t}.`, keys: ["a"], model: "Wzór." }, exercises: [], faded: {}, formulas: [] });
const quiz = (t) => Array.from({ length: 8 }, (_, i) => ({ q: `Quiz ${t} ${i + 1}?`, options: ["Dobra", "Zła", "Zła 2"], correct: 0, explanation: "Bo tak." }));
const mat = (order, title) => ({ subjectId: Z, kind: "lesson", order, sylRef: "W1", title, minutes: 20, quizCount: 8, flashcardCount: 0, conceptCount: 0, createdAt: Date.now(), v: 2 });
const content = (t) => ({ v: 2, lesson: lesson(t), quiz: quiz(t), flashcards: [], concepts: [], notes: [], tldr: "" });
const docs = {
  materials: { L91: mat(91, "Planowanie"), L92: mat(92, "Organizowanie"), L93: mat(93, "Motywowanie"), L95: mat(95, "Kontrola") },
  materialContent: { L91: content("plan"), L92: content("org"), L93: content("mot"), L95: content("kontrola") },
  meta: { po: { items: {} }, stas: { items: {} } },
};
const ls0 = { "mock-docs": JSON.stringify(docs), "mock-progress": JSON.stringify({ [UID]: {} }) };
const p = await page(b, { konto: "platne", w: 390, h: 844, ls: ls0 });
await p.goto(BASE + "index.html#/subject/" + Z); await p.waitForTimeout(3500);
const txt = await p.evaluate(() => document.body.innerText);
await shot(p, "numer-od-1-przedmiot");
ok("kurs: lekcje 1–4 widoczne", ["1. Planowanie", "2. Organizowanie", "3. Motywowanie", "4. Kontrola"].every((s) => txt.includes(s)), txt.slice(0, 1500));
ok("kurs: brak numerów 91+", !/\b9[1-5]\. (Planowanie|Organizowanie|Motywowanie|Kontrola)/.test(txt), txt.match(/9\d\. \w+/g));
await p.goto(BASE + "index.html#/material/L93"); await p.waitForTimeout(2500);
const t2 = await p.evaluate(() => document.body.innerText);
await shot(p, "numer-od-1-lekcja");
ok("lekcja: nagłówek „Lekcja 3”", /Lekcja 3\b/.test(t2) && !/Lekcja 93/.test(t2), t2.slice(0, 600));
ok("konsola bez błędów", p.errors.length === 0, p.errors);
await b.close();
for (const r of wyniki) console.log(r.join("  "));
process.exit(wyniki.some((r) => r[0] === "✗") ? 1 : 0);
