// Połączenia, etap 5: osobiste Zadanie dnia z priorytetu obok wspólnych zadań roku.
// Uruchom: python3 -m http.server 8790, potem BASE=http://127.0.0.1:8790/ node docs/gry/test/polaczenia-5.mjs
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 700)]);
const CZAS = new Date("2026-11-04T12:00:00+01:00");
const UID = "00000000-0000-4000-8000-000000000001";
const OWI = "ochrona-wlasnosci-intelektualnej";
const now = Date.parse("2026-10-20T10:00:00+02:00");
const quiz = (tag) => Array.from({ length: 6 }, (_, i) => ({ q: `${tag} ${i}?`, options: ["A", "B", "C", "D"], correct: i % 4 }));
const MAT = { owi1: { subjectId: OWI, kind: "lesson", order: 1, unit: 1, unitTitle: "IP", sylRef: "W1", title: "Basic principles of IP law", quizCount: 6, flashcardCount: 0, createdAt: now, v: 2 },
  owi2: { subjectId: OWI, kind: "lesson", order: 2, unit: 1, unitTitle: "IP", sylRef: "W2", title: "Author's rights", quizCount: 6, flashcardCount: 0, createdAt: now - 1, v: 2 } };
const CONTENT = { owi1: { v: 2, summary: "x", quiz: quiz("o1") }, owi2: { v: 2, summary: "x", quiz: quiz("o2") } };
const base = (dl) => ({ "bm-group": "C112", "bm-sub": "A", "mock-progress": JSON.stringify({ [UID]: { group: "C112", sub: "A" } }),
  "mock-docs": JSON.stringify({ materials: MAT, materialContent: CONTENT, deadlines: dl, meta: { stas: { items: { "owi~W~x": { sid: OWI, k: "W", t: "Basic principles of intellectual property law", n: 2 } } } } }) });

// ---- 1. kolokwium z OWI za 10 dni → plan → osobiste zadanie „krok planu”
const p = await page(b, { konto: "platne", ls: base({ d1: { subjectId: OWI, type: "kolokwium", title: "Kolokwium z OWI", date: "2026-11-14", createdAt: now } }) });
await p.clock.setFixedTime(CZAS);
await p.goto(BASE + "index.html#/shop"); await p.waitForTimeout(3000);
const box = p.locator("#shop-misje");
const mine = await box.locator(".shop-mission.mine").innerText().catch(() => "");
ok("osobiste zadanie: dzisiejszy krok planu OWI", /Twoje zadanie dnia/i.test(mine) && /Zrób dzisiejszy krok planu: OWI · /.test(mine) && /0\/5/.test(mine) && /\+8 🪙/.test(mine), mine);
ok("wspólne zadania zostają (3 dnia + tydzień)", (await box.locator(".shop-mission:not(.mine)").count()) === 4 && /3 wspólne dla roku \+ 1 Twoje/.test(await box.innerText()), await box.innerText());
// odpowiedzi w quizie z materiałów kroku (baza liczy postęp z punktów)
const mids = await p.evaluate(async () => { const d = await window.skrot.misje(); return d.osobista?.cel?.mids || []; });
const odp = (await p.evaluate(async (mids) => { const out = []; for (const mid of mids) for (let i = 0; i < 5; i++) out.push(await window.skrot.rp.odp({ mid, idx: i, wybor: i % 4, zrodlo: "quiz" })); out.push(await window.skrot.misje()); return out; }, mids));
await p.evaluate(() => window.dispatchEvent(new CustomEvent("skrot:sklep"))); await p.waitForTimeout(1200);
await p.goto(BASE + "index.html#/"); await p.waitForTimeout(400); await p.goto(BASE + "index.html#/shop"); await p.waitForTimeout(1800);
const mine2 = await box.locator(".shop-mission.mine").innerText().catch(() => "");
ok("postęp z bazy: 5/5 i przycisk Odbierz", /5\/5/.test(mine2) && /Odbierz \+8 🪙/.test(mine2), { mine2, mids });
await box.locator(".shop-mission.mine").getByRole("button", { name: /Odbierz/ }).click(); await p.waitForTimeout(800);
ok("odebrane", /Odebrane/.test(await box.locator(".shop-mission.mine").innerText()), "");
// drugi wybór tego dnia nie zmienia zadania
const again = await p.evaluate(async () => (await window.skrot.misjaOsobista("po", { pl: "Inne" })).osobista?.typ);
ok("wybór ostateczny na dziś", again === "plan", again);
await shot(p, "polaczenia5-sklep");
ok("bez błędów", !p.errors.length, p.errors);

// ---- 2. bez zaliczenia i bez 5-minutówek: Staś z najsłabszego tematu
const q = await page(b, { konto: "platne", ls: base({}) });
await q.clock.setFixedTime(CZAS);
await q.goto(BASE + "index.html#/shop"); await q.waitForTimeout(3000);
const m2 = await q.locator("#shop-misje .shop-mission.mine").innerText().catch(() => "");
ok("bez zaliczenia: „Popraw Stasia z najsłabszego tematu”", /Popraw Stasia z najsłabszego tematu/.test(m2) && /0\/2/.test(m2), m2);
await q.locator("#shop-misje .shop-mission.mine").getByRole("button", { name: "Zacznij" }).click(); await q.waitForTimeout(600);
ok("Zacznij → ćwiczenie Stasia", /#\/stasx\//.test(q.url()), q.url());

// ---- 3. EN i bez v28 (stara baza): nic się nie psuje
const en = await page(b, { konto: "platne", lang: "en", w: 375, h: 800, ls: base({ d1: { subjectId: OWI, type: "kolokwium", title: "Kolokwium z OWI", date: "2026-11-14", createdAt: now } }) });
await en.clock.setFixedTime(CZAS);
await en.goto(BASE + "index.html#/shop"); await en.waitForTimeout(3000);
const mEn = await en.locator("#shop-misje .shop-mission.mine").innerText().catch(() => "");
ok("EN: Your daily task", /Do today's plan step: IP Protection/.test(mEn) && !/Zrób/.test(mEn), mEn);
ok("EN 375 px bez przewijania w bok", (await en.evaluate(() => document.documentElement.scrollWidth)) <= 375, "");
const old = await page(b, { konto: "platne", ls: { ...base({}), "mock-v28": "0" } });
await old.clock.setFixedTime(CZAS);
await old.goto(BASE + "index.html#/shop"); await old.waitForTimeout(3000);
ok("bez v28: tylko wspólne zadania, bez błędów", (await old.locator("#shop-misje .shop-mission.mine").count()) === 0 && (await old.locator("#shop-misje .shop-mission").count()) === 4 && !old.errors.length, old.errors);

await b.close();
for (const w of wyniki) console.log(w.join(" "));
const bad = wyniki.filter((w) => w[0] === "✗").length;
console.log(`\n${wyniki.length - bad}/${wyniki.length}`);
process.exit(bad ? 1 : 0);
