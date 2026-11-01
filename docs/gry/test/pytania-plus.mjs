// „Dorób pytania (+10)” w Panelu AI i kolejność „najpierw niewidziane” (bm-q-seen) – na atrapie bazy, z udawanym AI.
// Uruchom: python3 -m http.server 8765 --bind 127.0.0.1 w katalogu repo, potem node docs/gry/test/pytania-plus.mjs
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = [];
const ok = (nazwa, warunek, info) => { wyniki.push([warunek ? "✓" : "✗", nazwa, warunek ? "" : JSON.stringify(info)?.slice(0, 400)]); };

// ---------- dane testowe: 4 materiały w przedmiotach z egzaminem + jeden obcy ----------
const now = Date.now();
const quiz = (n, tag, extra = {}) => Array.from({ length: n }, (_, i) => ({ q: `${tag}: stare pytanie numer ${i + 1} o temacie ${i % 3}?`, options: ["A" + i, "B" + i, "C" + i, "D" + i], correct: i % 4, explanation: "Stare.", ...extra }));
const topics = (tag) => [0, 1, 2].map((i) => ({ t: `${tag} temat ${i}`, slides: [i * 5 + 1, i * 5 + 4], summary: `Opis ${i}`, why: "Po co", remember: ["Zapamiętaj"], example: "Przykład" }));
const why = (n) => ({ items: Object.fromEntries(Array.from({ length: n }, (_, i) => [String(i), { why: `Stare wyjaśnienie ${i}`, example: "", not: [] }])), at: 1 });
const DOCS = {
  materials: {
    am1: { subjectId: "analiza-matematyczna", title: "Pochodne", quizCount: 10, flashcardCount: 0, createdAt: now - 9e6, v: 2 },
    pz1: { subjectId: "podstawy-zarzadzania", title: "Planowanie", quizCount: 10, flashcardCount: 0, createdAt: now - 8e6, v: 2 },
    eb1: { subjectId: "ekonomia-biznesu", title: "Pełny quiz", quizCount: 20, flashcardCount: 0, createdAt: now - 7e6, v: 2 },
    hr1: { subjectId: "zarzadzanie-zasobami-ludzkimi", kind: "lesson", title: "Rekrutacja", quizCount: 10, flashcardCount: 0, createdAt: now - 6e6, v: 2 },
  },
  materialContent: {
    am1: { v: 2, tldr: "Pochodne.", topics: topics("AM"), concepts: [{ term: "derivative", definition: "rate of change" }], notes: [{ point: "f' mierzy zmianę" }], quiz: quiz(10, "AM", { slide: 1, slides: [1, 4] }) },
    pz1: { v: 2, tldr: "Planowanie.", topics: topics("PZ"), concepts: [], quiz: quiz(10, "PZ") },
    eb1: { v: 2, tldr: "Pełny.", topics: topics("EB"), concepts: [], quiz: quiz(20, "EB") },
    hr1: { v: 2, lesson: { v2: true, intro: "Rekrutacja", sections: [{ h: "1. Ogłoszenie", body: "Treść ogłoszenia" }, { h: "2. Selekcja", body: "Treść selekcji" }] }, concepts: [], quiz: quiz(10, "HR") },
  },
  quizWhy: { am1: why(10), pz1: why(10), eb1: why(20) },
};
const SLAJDY = "TO JEST TEKST SLAJDÓW";

// ---------- udawane AI: pytania (część złych, żeby sprawdzić kontrolę) i „Dlaczego?” ----------
const SLOWA = "budżet klient cena popyt zysk koszt rynek kadra lider premia umowa zespół marka sklep magazyn podatek kredyt odsetki eksport import pensja szkolenie awans projekt termin raport faktura dostawca hurtownia ryzyko inwestor akcja obligacja inflacja stopa granica pochodna funkcja wykres całka".split(" ");
let licznik = 0;
const nowe = (tag) => { const k = licznik++; return `${tag}: co się stanie, gdy ${SLOWA[k % SLOWA.length]} i ${SLOWA[(k * 7 + 3) % SLOWA.length]} rosną, a ${SLOWA[(k * 13 + 5) % SLOWA.length]} spada (${k})?`; };
const prompty = [], proby = {};
function fakeAi(prompt) {
  prompty.push(prompt);
  if (prompt.startsWith("Based ONLY on the study material below, write")) {
    const n = +prompt.match(/write (\d+) NEW/)[1];
    const tag = /AM temat/.test(prompt) ? "AM" : /PZ temat/.test(prompt) ? "PZ" : "HR";
    const out = [], pierwsza = !proby[tag]; proby[tag] = (proby[tag] || 0) + 1;
    if (pierwsza) { // kopia starego pytania, przeformułowanie, 4 × prawda/fałsz (limit 3), zły indeks tematu, reszta dobra
      const stare = JSON.parse(prompt.split("EXISTING QUESTIONS (do not repeat these questions or their rephrasings):\n")[1].split("\nMATERIAL")[0])[0].q;
      out.push({ q: stare, options: ["a", "b", "c", "d"], correct: 0, i: 0 });
      out.push({ q: stare.replace("stare pytanie", "pytanie stare"), options: ["a", "b", "c", "d"], correct: 1, i: 0 });
      for (let k = 0; k < 4; k++) out.push({ q: `${tag}: ${SLOWA[licznik++ % SLOWA.length]} zawsze zwiększa ${SLOWA[(licznik * 11) % SLOWA.length]} (${licznik}).`, options: ["True", "False"], correct: k % 2, i: k % 2, explanation: "TF" });
      out.push({ q: nowe(tag), options: ["a", "b", "c", "d"], correct: 0, i: 99 });
      for (let k = 0; k < n - 7; k++) out.push({ q: nowe(tag), options: ["w", "x", "y", "z"], correct: k % 4, i: k % 2, explanation: "Nowe." });
    } else for (let k = 0; k < n; k++) out.push({ q: nowe(tag), options: ["w", "x", "y", "z"], correct: (k + 1) % 4, i: 1, explanation: "Nowe 2." });
    return { quiz: out };
  }
  if (prompt.startsWith("Jesteś cierpliwym korepetytorem")) {
    const qs = JSON.parse(prompt.split("PYTANIA:\n")[1]);
    return { items: qs.map((x) => ({ i: x.i, why: `Nowe wyjaśnienie ${x.i}`, example: "", not: x.options.map(() => "") })) };
  }
  return {};
}

const p = await page(b, { konto: "starosta", ls: { "mock-docs": JSON.stringify(DOCS), "bm-starosta": "1" } });
await p.context().route(/functions\/v1\/claude/, async (r) => { const { prompt } = JSON.parse(r.request().postData()); r.fulfill({ contentType: "application/json", body: JSON.stringify({ json: fakeAi(prompt) }) }); });
await p.goto(BASE + "index.html#/ai"); await p.waitForTimeout(2500);
const sec = p.locator("section.panel", { has: p.locator("h2", { hasText: "Dorób pytania (+10)" }) });
ok("sekcja „Dorób pytania (+10)” w Panelu AI", await sec.count() === 1, await p.locator("main").innerText().catch(() => ""));
const boxes = await sec.locator("label").allInnerTexts();
ok("domyślnie zaznaczone wszystkie przedmioty z materiałami (6)", (await sec.locator("input[type=checkbox]").count()) === 6 && (await sec.locator("input[type=checkbox]:checked").count()) === 6, boxes);
ok("podgląd przy wszystkich: 6 materiałów (z makro i prawem)", (await sec.locator(".chip").allInnerTexts()).some((c) => /do dorobienia: 6/.test(c)), await sec.locator(".chip").allInnerTexts());
// test odznaczania: Makroekonomia i Prawo zostają nietknięte
for (const n of ["Makroekonomia", "Prawo"]) { await sec.locator("label", { hasText: n }).locator("input").uncheck(); await p.waitForTimeout(150); }
const chips = await sec.locator(".chip").allInnerTexts();
ok("podgląd: 3 materiały, ok. 30 pytań (pełny pominięty)", chips.some((c) => /do dorobienia: 3/.test(c)) && chips.some((c) => /ok\. 30/.test(c)), chips);
await shot(p, "pp-panel-przed");
// przerwanie po pierwszym materiale i wznowienie: zrobiony materiał jest pomijany
await sec.getByRole("button", { name: /^Start/ }).click();
await p.waitForFunction(() => { const x = [...document.querySelectorAll("button")].find((y) => /Zatrzymaj po bieżącym/.test(y.textContent)); x?.click(); return !!x; }, null, { timeout: 5000 });
await p.waitForFunction(() => !/Dorabiam/.test(document.body.innerText), null, { timeout: 30000 });
const log1 = await sec.locator("ul.pipeline li").allInnerTexts();
const chipsStop = await sec.locator(".chip").allInnerTexts();
ok("zatrzymanie po bieżącym: 1 materiał gotowy, zostały 2", log1.length === 1 && chipsStop.some((c) => /do dorobienia: 2/.test(c)), { log1, chipsStop });
const pierwszy = log1[0]?.split(":")[0];
await sec.getByRole("button", { name: /^Start \(2\)/ }).click();
await p.waitForFunction(() => !/Dorabiam/.test(document.body.innerText), null, { timeout: 30000 });
await p.waitForTimeout(500);
await shot(p, "pp-panel-po");
const log = await sec.locator("ul.pipeline li").allInnerTexts();
ok("wznowienie: 2 pozostałe materiały, bez tego zrobionego", log.length === 2 && (await sec.locator(".sdot.ok").count()) === 2 && !log.some((l) => l.startsWith(pierwszy)), { log, pierwszy });
ok("pasek postępu 2 z 2", /2 z 2/.test(await sec.innerText()) && (await sec.locator("progress").getAttribute("value")) === "2", await sec.innerText());

// stan bazy w atrapie (window.skrot.db = ta sama atrapa)
const stan = await p.evaluate(async () => {
  const db = window.claude?.use ? await window.claude.use("db") : null;
  const g = async (c, id) => { const s = await db.doc(c + "/" + id).get(); return s.exists ? s.data() : null; };
  const out = {};
  for (const id of ["am1", "pz1", "eb1", "hr1"]) out[id] = { c: await g("materialContent", id), m: await g("materials", id), w: await g("quizWhy", id) };
  out.my = await g("myContent", "my1"); out.m1 = await g("materialContent", "m1");
  return out;
});
for (const id of ["am1", "pz1", "hr1"]) {
  const { c, m, w } = stan[id], old = DOCS.materialContent[id].quiz;
  ok(`${id}: 10 → 20 pytań`, c.quiz.length === 20, c.quiz.length);
  ok(`${id}: stare pytania 0–9 bez zmian (kolejność i treść)`, JSON.stringify(c.quiz.slice(0, 10)) === JSON.stringify(old), c.quiz.slice(0, 2));
  ok(`${id}: quizCount = 20`, m.quizCount === 20 && m.quizPlus?.base === 10 && m.quizPlus?.why === true, m);
  const nowe = c.quiz.slice(10);
  ok(`${id}: nowe pytania poprawne (2 albo 4 opcje, correct w zakresie)`, nowe.every((q) => q.q && (q.options.length === 4 || q.options.length === 2) && q.correct >= 0 && q.correct < q.options.length), nowe);
  ok(`${id}: max 3 prawda/fałsz`, nowe.filter((q) => q.options.length === 2).length <= 3, nowe.map((q) => q.options.length));
  ok(`${id}: brak kopii i przeformułowań starych`, !nowe.some((q) => /stare pytanie|pytanie stare/.test(q.q)), nowe.map((q) => q.q));
  ok(`${id}: quizWhy ma wpisy 10–19`, Array.from({ length: 10 }, (_, k) => 10 + k).every((i) => w?.items?.[i]?.why === `Nowe wyjaśnienie ${i}`), w && Object.keys(w.items));
  if (id !== "hr1") ok(`${id}: stare quizWhy 0–9 bez zmian`, Array.from({ length: 10 }, (_, i) => i).every((i) => JSON.stringify(w.items[i]) === JSON.stringify(DOCS.quizWhy[id].items[i])), w.items[0]);
}
ok("hr1 (bez quizWhy): „Dlaczego?” do wszystkich 20", Object.keys(stan.hr1.w?.items || {}).length === 20, stan.hr1.w);
ok("am1: odsyłacz do slajdów przy nowych pytaniach", stan.am1.c.quiz.slice(10).every((q) => Array.isArray(q.slides)), stan.am1.c.quiz[12]);
ok("pz1: bez pola slide, gdy stare pytania go nie mają", stan.pz1.c.quiz.slice(10).every((q) => !("slide" in q)), stan.pz1.c.quiz[12]);
ok("eb1 (już 20): nietknięty", JSON.stringify(stan.eb1.c.quiz) === JSON.stringify(DOCS.materialContent.eb1.quiz) && !stan.eb1.m.quizPlus, stan.eb1.m);
ok("inne przedmioty i Moje materiały nietknięte", stan.m1.quiz.length === 14 && stan.my.quiz.length === 5, [stan.m1.quiz.length, stan.my.quiz.length]);
const gen = prompty.filter((x) => x.startsWith("Based ONLY on the study material below, write"));
ok("prompt: bez tekstu slajdów, z istniejącymi pytaniami i opracowaniem", gen.length >= 3 && gen.every((x) => !x.includes(SLAJDY) && /EXISTING QUESTIONS/.test(x) && /MATERIAL \(our own notes\)/.test(x) && /do not repeat/i.test(x)), gen[0]?.slice(0, 300));
ok("prompt AM: zadania z liczeniem", gen.some((x) => /Analiza|Mathematical/i.test(x) && /short calculation/.test(x)), gen.map((x) => x.slice(0, 160)));
ok("dogenerowanie po odrzuceniu (max 3 zapytania na materiał)", gen.length >= 4 && gen.length <= 9, gen.length);

// ponowne uruchomienie nic nie dubluje (bez przeładowania: atrapa trzyma bazę tylko w pamięci strony)
await p.evaluate(() => { location.hash = "#/home"; }); await p.waitForTimeout(600);
await p.evaluate(() => { location.hash = "#/ai"; }); await p.waitForTimeout(1200);
const chips2 = await sec.locator(".chip").allInnerTexts();
ok("po przeładowaniu: nic do dorobienia", chips2.some((c) => /do dorobienia: 0/.test(c)) && !(await sec.getByRole("button", { name: /^Start/ }).count()), chips2);
const n0 = prompty.length;
const stan2 = await p.evaluate(async () => { const db = await window.claude.use("db"); return Promise.all(["am1", "pz1", "hr1"].map(async (id) => (await db.doc("materialContent/" + id).get()).data().quiz.length)); });
ok("ponownie: dalej po 20 pytań i bez zapytań do AI", stan2.every((n) => n === 20) && prompty.length === n0, stan2);
ok("bez błędów konsoli (starosta)", !p.errors.length, p.errors);

// ---------- kolejność „najpierw niewidziane”: quiz z całego przedmiotu (makroekonomia: 14 + 12 = 26 pytań) ----------
const s = await page(b, { konto: "platne" });
const calls = () => s.evaluate(() => window.__rpc.filter((x) => x.fn === "nauka_rp_odpowiedz").map((x) => x.args.p_mid + ":" + x.args.p_idx));
async function quizZPrzedmiotu() {
  await s.goto(BASE + "index.html#/subject/makroekonomia"); await s.reload(); await s.waitForTimeout(1500);
  await s.getByRole("tab", { name: "Ćwicz" }).or(s.getByRole("button", { name: "Ćwicz" })).first().click(); await s.waitForTimeout(400);
  await s.locator(".sk-row-big", { hasText: "Quiz z całego przedmiotu" }).click(); await s.waitForTimeout(900);
  for (let i = 0; i < 60 && (await s.locator(".lp").count()); i++) {
    if (await s.locator(".lp-opts .opt:not([disabled])").count()) { await s.locator(".lp-opts .opt").first().click(); await s.waitForTimeout(150); }
    const n = s.locator(".lp .lp-cta").last();
    if (await n.count()) await n.click({ timeout: 2000 }).catch(() => {}); else break;
    await s.waitForTimeout(200);
    if (/Wynik:/.test(await s.locator(".lp").innerText().catch(() => ""))) break;
  }
  await s.keyboard.press("Escape"); await s.waitForTimeout(400);
  if (await s.locator(".lp").count()) { await s.locator(".lp-x").click().catch(() => {}); await s.waitForTimeout(400); }
}
await quizZPrzedmiotu();
const r1 = [...new Set(await calls())];
const seen1 = await s.evaluate(() => JSON.parse(localStorage.getItem("bm-q-seen") || "{}"));
ok("quiz z przedmiotu: 15 pytań zapisanych w bm-q-seen", r1.length === 15 && r1.every((k) => k in seen1), { r1, seen1 });
await s.evaluate(() => { window.__rpc.length = 0; });
await quizZPrzedmiotu();
const r2 = [...new Set(await calls())];
ok("2. quiz: najpierw 11 niewidzianych, żadne nie powtarza się, dopóki są niewidziane", r2.length === 15 && r2.slice(0, 11).every((k) => !r1.includes(k)), { r1, r2 });
ok("bm-q-seen: wszystkie 26 widziane", Object.keys(await s.evaluate(() => JSON.parse(localStorage.getItem("bm-q-seen") || "{}"))).length === 26, "");
// limit 2000 wpisów
const lim = await s.evaluate(() => { const o = {}; for (let i = 0; i < 2100; i++) o["x" + i + ":0"] = i % 50; localStorage.setItem("bm-q-seen", JSON.stringify(o)); return 0; });
await quizZPrzedmiotu();
const seen3 = await s.evaluate(() => JSON.parse(localStorage.getItem("bm-q-seen") || "{}"));
const v3 = Object.entries(seen3), dzis = Math.max(...v3.map(([, v]) => v));
ok("bm-q-seen: max 2000 wpisów, najstarsze wypadają", v3.length === 2000 && v3.filter(([k, v]) => !k.startsWith("x") && v === dzis).length >= 15 && v3.filter(([, v]) => v === 0).length < 42 && v3.filter(([, v]) => v === 49).length === 42, v3.length);
ok("bez błędów konsoli (student)", !s.errors.length, s.errors);

await b.close();
for (const w of wyniki) console.log(w.join(" "));
const zle = wyniki.filter((w) => w[0] === "✗").length;
console.log(zle ? `\n${zle} błędów` : "\nwszystko OK");
process.exit(zle ? 1 : 0);
