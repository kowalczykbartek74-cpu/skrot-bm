// Połączenia, etap 2: wspólny priorytet tematu (Powtórki, Staś, podpowiedź na górze Powtórek).
// Konto: kolokwium z OWI 23.11 (za 19 dni od 4.11), „Selected aspects of industrial property law” słabo w quizie,
// zaległe fiszki z Podstaw finansów (Debt management) i z Logistyki czekają dłużej niż te z OWI.
// Uruchom: python3 -m http.server 8790, potem BASE=http://127.0.0.1:8790/ node docs/gry/test/polaczenia-2.mjs
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 700)]);
const CZAS = new Date("2026-11-04T12:00:00+01:00");
const UID = "00000000-0000-4000-8000-000000000001";
const hashStr = (s) => { let x = 2166136261; for (const ch of String(s)) { x ^= ch.codePointAt(0); x = Math.imul(x, 16777619) >>> 0; } return x.toString(36); };
const dayN = (k) => { const [y, m, d] = k.split("-").map(Number); return Math.round((new Date(y, m - 1, d) - new Date(2026, 0, 1)) / 864e5); };
const T = dayN("2026-11-04");
const OWI = "ochrona-wlasnosci-intelektualnej", PF = "podstawy-finansow";
const cards = (tag) => [1, 2, 3, 4].map((i) => ({ q: `${tag}: pojęcie ${i}`, a: `Definicja ${i}` }));
const quiz = (tag) => Array.from({ length: 10 }, (_, i) => ({ q: `${tag} ${i}?`, options: ["A", "B", "C", "D"], correct: i % 4 }));
const now = Date.parse("2026-10-20T10:00:00+02:00");
const MAT = {
  owi5: { subjectId: OWI, kind: "lesson", order: 5, unit: 2, unitTitle: "Industrial property", sylRef: "W5", title: "Industrial property: patents and trademarks", quizCount: 10, flashcardCount: 4, createdAt: now, v: 2 },
  owi1: { subjectId: OWI, kind: "lesson", order: 1, unit: 1, unitTitle: "Basics", sylRef: "W1", title: "Basic principles of IP law", quizCount: 10, flashcardCount: 4, createdAt: now - 1e5, v: 2 },
  pf3: { subjectId: PF, title: "Debt management", quizCount: 10, flashcardCount: 4, createdAt: now - 2e5, v: 2 },
  log1: { subjectId: "logistyka", title: "Warehouse management", quizCount: 10, flashcardCount: 4, createdAt: now - 3e5, v: 2 },
};
const TAG = { owi5: "IND", owi1: "IPB", pf3: "DEBT", log1: "WARE" };
const CONTENT = Object.fromEntries(Object.keys(MAT).map((id) => [id, { v: 2, summary: "x", quiz: quiz(TAG[id]), flashcards: cards(TAG[id]) }]));
const srs = {};
for (const [id, due] of [["pf3", T - 9], ["log1", T - 8], ["owi1", T - 1], ["owi5", T - 1]]) for (const c of cards(TAG[id])) srs[`${id}:${hashStr(c.q)}`] = [2, due];
const prog = { [UID]: { group: "C112", sub: "A", srs, quiz: { owi5: { best: 2, last: 2, total: 10, at: now }, owi1: { best: 9, last: 9, total: 10, at: now }, pf3: { best: 8, last: 8, total: 10, at: now } } } };
const DL = { "d-owi": { subjectId: OWI, type: "kolokwium", title: "Kolokwium z OWI", date: "2026-11-23", createdAt: now } };
const STAS = { [`${PF}~CW~debt`]: { sid: PF, k: "CW", t: "Debt management", n: 3 }, [`logistyka~W~ware`]: { sid: "logistyka", k: "W", t: "Warehouse management, transport, loading units and packaging in the functioning of the company's logistics", n: 3 },
  [`${OWI}~W~ind`]: { sid: OWI, k: "W", t: "Selected aspects of industrial property law", n: 3 }, [`${OWI}~W~basic`]: { sid: OWI, k: "W", t: "Basic principles of intellectual property law", n: 3 } };
const LS = { "bm-group": "C112", "bm-sub": "A", "mock-progress": JSON.stringify(prog),
  "mock-docs": JSON.stringify({ materials: MAT, materialContent: CONTENT, deadlines: DL, meta: { stas: { items: STAS } } }) };

const p = await page(b, { konto: "platne", ls: LS });
await p.clock.setFixedTime(CZAS);
await p.goto(BASE + "index.html#/review"); await p.waitForTimeout(2500);
const hint = await p.locator(".hint").first().innerText().catch(() => "");
ok("Powtórki: podpowiedź o OWI z powodem", /Industrial property/.test(hint) && /OWI: (kolokwium|zaliczenie wykładu) za 19 dni/.test(hint) && /słabo w quizach/.test(hint), hint);
ok("Powtórki: nie zaczyna od Debt management", !/Najważniejsze teraz: powtórki z Debt/.test(hint), hint);
// start powtórki → pierwsza karta
await p.getByRole("button", { name: /Powtórz teraz|Zacznij|Start/ }).first().click(); await p.waitForTimeout(1500);
const first = await p.locator(".lp-root, .lp, [class*=lp-card]").first().innerText().catch(() => "");
ok("pierwsza karta w powtórce: OWI (IND)", /IND: pojęcie/.test(first) && !/DEBT|WARE/.test(first.split("\n").slice(0, 12).join(" ")), first.slice(0, 400));
await shot(p, "polaczenia2-powtorka");
await p.keyboard.press("Escape"); await p.waitForTimeout(300);

// Dziś: Staś proponuje OWI (najsłabszy temat z najbliższego zaliczenia), „Inny temat” zmienia propozycję
await p.goto(BASE + "index.html#/"); await p.waitForTimeout(1500);
const stas = await p.locator(".stas-card").innerText().catch(() => "");
ok("Staś na Dziś: OWI, industrial property", /Ochrona własności intelektualnej/.test(stas) && /industrial property/i.test(stas) && /OWI: (kolokwium|zaliczenie wykładu) za 19 dni/.test(stas), stas);
await p.locator(".stas-card").getByRole("button", { name: "Inny temat ↻" }).click(); await p.waitForTimeout(300);
const stas2 = await p.locator(".stas-card").innerText().catch(() => "");
ok("Staś: Inny temat daje kolejny (OWI basic)", /Basic principles of intellectual property law/.test(stas2), stas2);
await shot(p, "polaczenia2-stas");
ok("bez błędów w konsoli", !p.errors.length, p.errors);

// EN
const en = await page(b, { konto: "platne", lang: "en", ls: LS });
await en.clock.setFixedTime(CZAS);
await en.goto(BASE + "index.html#/review"); await en.waitForTimeout(2500);
const hintEn = await en.locator(".hint").first().innerText().catch(() => "");
ok("EN: powód po angielsku", /IP Protection/.test(hintEn) && /in 19 days/.test(hintEn) && !/Najważniejsze|słabo/.test(hintEn), hintEn);
ok("EN: bez błędów", !en.errors.length, en.errors);

await b.close();
for (const w of wyniki) console.log(w.join(" "));
const bad = wyniki.filter((w) => w[0] === "✗").length;
console.log(`\n${wyniki.length - bad}/${wyniki.length}`);
process.exit(bad ? 1 : 0);
