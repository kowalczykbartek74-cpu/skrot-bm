// Etap 8 specu „Systemy z Zdawalni w Skrócie”: „Ile masz dziś czasu?” i „Jedno zadanie” (dzien.js). Zegar: czwartek 5.11.2026, 12:00.
//   A. bez rewanży i zaległości, bez planu: 5 min → jedna krótka rzecz; Jedno zadanie = to samo co duży przycisk karty,
//   B. rewanż i zaległe powtórki: Jedno zadanie = rewanż (sesja z 1 kartą), potem najstarsza zaległa; 5 min → tylko rewanż,
//      30 min → rewanż, powtórki, temat (ostatni skrócony); skrócona powtórka bierze tylko część kart,
//   C. plan „Przygotuj się” (kolokwium za 10 dni): Jedno zadanie, karta i 5 min wskazują ten sam temat z planu,
//   D. EN + zrzuty 375 / 1280.
// BASE=http://127.0.0.1:8811/ node docs/gry/test/dzien.mjs
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 700)]);
const UID = "00000000-0000-4000-8000-000000000001";
const now = new Date("2026-11-05T12:00:00+01:00").getTime();
const day = Math.round((new Date(2026, 10, 5) - new Date(2026, 0, 1)) / 864e5);
const quiz = (tag) => Array.from({ length: 4 }, (_, i) => ({ q: `${tag}: pytanie ${i}?`, options: ["Pierwsza", "Druga", "Trzecia", "Czwarta"], correct: i % 4, why: "Bo tak." }));
const DOCS = {
  materials: {
    m1: { subjectId: "makroekonomia", title: "PKB i inflacja", quizCount: 4, flashcardCount: 0, createdAt: now - 3e6, v: 2 },
    m2: { subjectId: "mikroekonomia", title: "Popyt i podaż", quizCount: 4, flashcardCount: 0, createdAt: now - 2e6, v: 2 },
  },
  materialContent: { m1: { v: 2, summary: "x", quiz: quiz("Makro"), flashcards: [] }, m2: { v: 2, summary: "x", quiz: quiz("Mikro"), flashcards: [] } },
};
// Plan „Przygotuj się” jak w przygotuj-sie.mjs: kolokwium za 10 dni (data orientacyjna), tematy z sylabusa.
const SID = "ochrona-wlasnosci-intelektualnej";
const dkey = (d) => { const x = new Date(now + d * 864e5); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
const T = ["Basic principles of intellectual property law", "Introduction to Intellectual Property Protection", "Author's personal and property rights", "Permitted use of works and plagiarism"];
const quizEn = (n, tag) => Array.from({ length: n }, (_, i) => ({ q: `${tag}: question ${i + 1}?`, options: ["A" + i, "B" + i, "C" + i, "D" + i], correct: i % 4, explanation: "Because." }));
const DOCS_PLAN = {
  materials: Object.fromEntries(T.map((t, i) => ["o" + i, { subjectId: SID, title: t, quizCount: 8, flashcardCount: 0, createdAt: now - (9 - i) * 1e6, v: 2, source: "sylabus" }])),
  materialContent: Object.fromEntries(T.map((t, i) => ["o" + i, { v: 2, tldr: t + ".", quiz: quizEn(8, "T" + i), flashcards: [] }])),
  deadlines: { d1: { title: "Kolokwium OWI", subjectId: SID, type: "kolokwium", part: "W", date: dkey(10), approx: true } },
};
const srsCard = (due) => [3, due, 0, 0, 0, 0, 0, 0];

async function strona(prog, { docs = DOCS, lang = "pl", w = 390, h = 900, ls = {} } = {}) {
  const p = await page(b, { konto: "platne", lang, w, h, ls: { "mock-docs": JSON.stringify(docs), "mock-progress": JSON.stringify({ [UID]: { group: "C111", sub: "A", ...prog } }), ...ls } });
  await p.clock.install({ time: new Date(now) });
  await p.goto(BASE + "index.html#/"); await p.waitForTimeout(2600);
  return p;
}
const hash = (p) => p.evaluate(() => location.hash);
const one = (p) => p.locator(".sk-now .dz-one").getAttribute("data-one").catch(() => null);
async function czas(p, m) { await p.locator(".dz-seg button").nth([5, 15, 30, 60].indexOf(m)).click(); await p.waitForTimeout(500); }
const wiersze = (p) => p.locator(".dz-row").evaluateAll((xs) => xs.map((x) => x.getAttribute("data-dz") + " | " + x.innerText.replace(/\s+/g, " ")));
// Klik w duży przycisk karty i w Jedno zadanie: dokąd prowadzą (adres po kliknięciu).
async function dokad(p, sel) { await p.goto(BASE + "index.html#/"); await p.waitForTimeout(900); await p.locator(sel).first().click(); await p.waitForTimeout(900); return hash(p); }

// ---------- A ----------
{
  const p = await strona({});
  const card = await p.locator(".sk-now").innerText();
  const o = await one(p);
  ok("A: karta i Jedno zadanie na Dziś, Jedno = kolejny materiał (brak rewanży i zaległości)", /Jedno zadanie/.test(card) && /^lesson:/.test(o || ""), { card, o });
  const a1 = await dokad(p, ".sk-now .sk-start"), a2 = await dokad(p, ".sk-now .dz-one");
  ok("A: duży przycisk karty i Jedno zadanie otwierają to samo", a1 === a2 && /#\/material\//.test(a1), { a1, a2 });
  await p.goto(BASE + "index.html#/"); await p.waitForTimeout(900);
  const pan = await p.locator(".dz-panel").innerText();
  ok("A: panel „Ile masz dziś czasu?” z 5 / 15 / 30 / 60 min, przed wyborem bez listy", /Ile masz dziś czasu\?/.test(pan) && (await p.locator(".dz-seg button").count()) === 4 && !(await p.locator(".dz-row").count()), pan);
  await czas(p, 5);
  const w = await wiersze(p);
  ok("A: 5 min → jedna krótka rzecz (temat skrócony do 5 min)", w.length === 1 && /^mat \|/.test(w[0]) && /ok\. 5 (z \d+ )?min/.test(w[0]), w);
  const a3 = await dokad(p, ".dz-row");
  ok("A: ta jedna rzecz = to samo co Jedno zadanie i karta", a3 === a1, { a3, a1 });
  await p.goto(BASE + "index.html#/"); await p.waitForTimeout(900);
  ok("A: wybór czasu pamiętany do końca dnia", (await p.locator('.dz-seg button[aria-pressed="true"]').innerText()) === "5 min", null);
  await czas(p, 5);
  ok("A: drugi klik w ten sam czas chowa listę", !(await p.locator(".dz-row").count()), null);
  ok("A: bez błędów w konsoli", !p.errors.length, p.errors);
  await p.context().close();
}
// ---------- B ----------
const progB = { rew: { "z:m1:0": [[day - 1, 0]] }, srs: { "z:m1:0": srsCard(day), "z:m2:1": srsCard(day - 2), "z:m2:2": srsCard(day - 5), "z:m2:3": srsCard(day - 1) } };
{
  const p = await strona(progB, { w: 375, h: 900 });
  ok("B: Jedno zadanie = rewanż na dziś", (await one(p)) === "rematch:z:m1:0", await one(p));
  await shot(p, "dz-1-dzis-375");
  await czas(p, 5);
  const w5 = await wiersze(p);
  ok("B: 5 min → tylko rewanż (~2 min), nawet gdy powtórki też by weszły (przy 5 min jedna rzecz)", w5.length === 1 && /^rew \| .*Rewanże: 1 pytanie/.test(w5[0]) && /ok\. 2 min/.test(w5[0]), w5);
  await czas(p, 30);
  const w30 = await wiersze(p), foot = await p.locator(".dz-panel .dz-foot").innerText();
  ok("B: 30 min → rewanż, powtórki, temat; kolejność ważności", w30.map((x) => x.split(" | ")[0]).join(",") === "rew,srs,mat", w30);
  ok("B: stopka z czasem i „Reszta poczeka do jutra” albo „Zmieścisz wszystko”", /Zmieścisz wszystko na dziś|Reszta poczeka do jutra/.test(foot), foot);
  await shot(p, "dz-2-30min-375");
  await czas(p, 30);
  await p.locator(".sk-now .dz-one").click(); await p.waitForTimeout(1500);
  const lp = await p.locator(".lp").innerText().catch(() => "");
  ok("B: Jedno zadanie otwiera sesję z jednym pytaniem (rewanż z quizu)", /Makro: pytanie 0\?/.test(lp) && /Rewanż/i.test(lp), lp.slice(0, 300));
  ok("B: bez błędów w konsoli", !p.errors.length, p.errors);
  await p.context().close();
}
{
  // bez rewanży: najstarsza zaległa powtórka (z:m2:2, termin 5 dni temu)
  const p = await strona({ srs: progB.srs });
  ok("B2: bez rewanży Jedno zadanie = najstarsza zaległa powtórka", (await one(p)) === "due:z:m2:2", await one(p));
  await p.locator(".sk-now .dz-one").click(); await p.waitForTimeout(1500);
  const lp = await p.locator(".lp").innerText().catch(() => "");
  ok("B2: sesja z tą jedną kartą", /Mikro: pytanie 2\?/.test(lp), lp.slice(0, 300));
  ok("B2: bez błędów w konsoli", !p.errors.length, p.errors);
  await p.context().close();
}
// ---------- C ----------
{
  const p = await strona({}, { docs: DOCS_PLAN, w: 1280, h: 900 });
  const card = await p.locator(".sk-now").innerText(), o = await one(p);
  ok("C: karta „Dziś według planu”, Jedno zadanie = temat z priorytetu", /Dziś według planu/.test(card) && /^priority:o\d$/.test(o || ""), { card: card.slice(0, 300), o });
  const c1 = await dokad(p, ".sk-now .sk-start"), c2 = await dokad(p, ".sk-now .dz-one");
  ok("C: karta priorytetu i Jedno zadanie otwierają ten sam temat", c1 === c2 && c1.includes(o.split(":")[1]), { c1, c2, o });
  await p.goto(BASE + "index.html#/"); await p.waitForTimeout(900);
  await czas(p, 5);
  const w = await wiersze(p);
  ok("C: 5 min → jedna rzecz: krok planu skrócony do 5 min", w.length === 1 && /^plan \| .*Krok planu/.test(w[0]) && /ok\. 5 z \d+ min/.test(w[0]), w);
  const c3 = await dokad(p, ".dz-row");
  ok("C: krok planu z listy = ten sam temat", c3 === c1, { c3, c1 });
  await p.goto(BASE + "index.html#/"); await p.waitForTimeout(900);
  await shot(p, "dz-3-plan-5min-1280");
  ok("C: bez błędów w konsoli", !p.errors.length, p.errors);
  await p.context().close();
}
// ---------- D: EN ----------
for (const [w, h] of [[375, 900], [1280, 900]]) {
  const p = await strona(progB, { lang: "en", w, h });
  await czas(p, 30);
  const txt = (await p.locator(".sk-now").innerText()) + "\n" + (await p.locator(".dz-panel").innerText());
  ok(`D: EN ${w}: How much time / One task / Rematches, bez polskich znaków`, /How much time have you got today\?/.test(txt) && /One task/.test(txt) && /Rematch · 1 question/.test(txt) && /Rematches: 1 question/.test(txt) && !/[ąćęłńóśżź]/i.test(txt), txt);
  await shot(p, `dz-4-en-${w}`);
  ok(`D: EN ${w}: bez błędów w konsoli`, !p.errors.length, p.errors);
  await p.context().close();
}
{
  const p = await strona(progB, { w: 1280, h: 900 });
  await czas(p, 30);
  await shot(p, "dz-5-30min-1280");
  // Dotyk ≥ 44 px: przyciski czasu i Jedno zadanie.
  const hs = await p.locator(".dz-seg button, .sk-now .dz-one, .dz-row").evaluateAll((xs) => xs.map((x) => Math.round(x.getBoundingClientRect().height)));
  ok("Dotyk: przyciski ≥ 44 px", hs.every((x) => x >= 44), hs);
  await p.context().close();
}
await b.close();
for (const w of wyniki) console.log(w.join(" "));
console.log(`${wyniki.filter((w) => w[0] === "✓").length}/${wyniki.length}`);
