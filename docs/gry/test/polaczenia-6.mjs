// Połączenia, etap 6: jeden licznik tematów na Dziś, w Przedmiotach, na stronie przedmiotu i na mapie postępów.
// Logistyka: 3 lekcje + prezentacja do tematu lekcji (dodatek) + osobny materiał z zajęć + Mój materiał (dodatek).
// Uruchom: python3 -m http.server 8790, potem BASE=http://127.0.0.1:8790/ node docs/gry/test/polaczenia-6.mjs
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 700)]);
const UID = "00000000-0000-4000-8000-000000000001";
const now = Date.parse("2026-10-20T10:00:00+02:00");
const L = (id, order, title) => [id, { subjectId: "logistyka", kind: "lesson", order, unit: 1, unitTitle: "Logistics", title, quizCount: 4, flashcardCount: 0, createdAt: now - order, v: 2 }];
const MAT = Object.fromEntries([L("l1", 1, "Supply chain management basics"), L("l2", 2, "Inventory control methods"), L("l3", 3, "Warehouse operations planning"),
  ["p1", { subjectId: "logistyka", title: "Inventory control methods: lecture slides", quizCount: 4, createdAt: now, v: 2 }],
  ["p2", { subjectId: "logistyka", title: "Reverse logistics in e-commerce", quizCount: 4, createdAt: now, v: 2 }]]);
const prog = { [UID]: { group: "C112", sub: "A", mastery: { l1: { ok: true, score: 3, total: 3, at: now } } } };
const LS = { "bm-group": "C112", "bm-sub": "A", "bm-fold:pts": "1", "mock-progress": JSON.stringify(prog), "mock-docs": JSON.stringify({ materials: MAT, myMaterials: { my2: { subjectId: "logistyka", title: "Moje notatki z logistyki", createdAt: now, created_by: UID } } }) };
const p = await page(b, { konto: "platne", ls: LS });
await p.clock.setFixedTime(new Date("2026-11-04T12:00:00+01:00"));
await p.goto(BASE + "index.html#/"); await p.waitForTimeout(2500);
const dz = await p.locator(".pts-row", { hasText: "Logistyka" }).innerText().catch(() => "");
ok("Dziś: Logistyka 1/4", /\b1\/4\b/.test(dz), dz);
await p.goto(BASE + "index.html#/materials"); await p.waitForTimeout(800);
const card = await p.locator(".nb", { hasText: "Logistyka" }).getAttribute("aria-label");
ok("Przedmioty: 1 z 4", /umiesz: 1 z 4/.test(card), card);
await p.goto(BASE + "index.html#/subject/logistyka"); await p.waitForTimeout(800);
const subj = await p.locator("main").innerText();
ok("strona przedmiotu: 1 z 4 tematów, bez „= lekcje + materiały”", /1 z 4 tematów/.test(subj) && !/tematy? = \d+ lekcj/.test(subj), subj.slice(0, 900));
await p.goto(BASE + "index.html#/review"); await p.waitForTimeout(900);
const row = p.locator(".pm-row", { hasText: "Logistyka" });
const rowTxt = await row.innerText();
ok("mapa: umiesz 1 z 4 tematów, dodatkowe 2 osobno", /umiesz: 1 z 4 tematów/.test(rowTxt) && /dodatkowe: 2/.test(rowTxt) && (await row.locator(".pm-sq.extra").count()) === 2, rowTxt);
ok("mapa: bez tekstu o różnicy liczników", !/Licznik „umiesz”/.test(await p.locator("main").innerText()), "");
await shot(p, "polaczenia6-mapa");
ok("bez błędów", !p.errors.length, p.errors);
const en = await page(b, { konto: "platne", lang: "en", w: 375, h: 800, ls: LS });
await en.clock.setFixedTime(new Date("2026-11-04T12:00:00+01:00"));
await en.goto(BASE + "index.html#/review"); await en.waitForTimeout(2500);
ok("EN: you know 1 of 4 topics, extra: 2", /you know: 1 of 4 topics/.test(await en.locator(".pm-row", { hasText: "Logistics" }).innerText().catch(() => "")) && (await en.evaluate(() => document.documentElement.scrollWidth)) <= 375, await en.locator(".pm-row").first().innerText().catch(() => ""));
await b.close();
for (const w of wyniki) console.log(w.join(" "));
const bad = wyniki.filter((w) => w[0] === "✗").length;
console.log(`\n${wyniki.length - bad}/${wyniki.length}`);
process.exit(bad ? 1 : 0);
