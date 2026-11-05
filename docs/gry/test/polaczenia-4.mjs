// Połączenia, etap 4: wspólne zdarzenie nauki (Po zajęciach w 5 min i Staś: XP, monety z bazy, pomylone pytania,
// pojęcia do fiszek, link do lekcji). Zegar: środa 4.11.2026, 12:00.
// Uruchom: python3 -m http.server 8790, potem BASE=http://127.0.0.1:8790/ node docs/gry/test/polaczenia-4.mjs
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 700)]);
const CZAS = new Date("2026-11-04T12:00:00+01:00");
const UID = "00000000-0000-4000-8000-000000000001";
const now = Date.parse("2026-10-20T10:00:00+02:00");
const T0 = "The essence of logistics, process and system approach in logistics";
const MAT = { log1: { subjectId: "logistyka", kind: "lesson", order: 1, unit: 1, unitTitle: "Logistics", sylRef: "W1 · ĆW1", title: "What logistics is about", quizCount: 4, flashcardCount: 2, createdAt: now, v: 2 } };
const CONTENT = { log1: { v: 2, summary: "x", quiz: [0, 1, 2, 3].map((i) => ({ q: `L${i}?`, options: ["A", "B", "C", "D"], correct: i })), flashcards: [{ q: "LC1", a: "a" }, { q: "LC2", a: "b" }] } };
const PO_ID = "logistyka~W~essence";
const PO = { title: "Czym jest logistyka", lead: "Zajęcia o tym, czym jest logistyka.",
  parts: [1, 2, 3].map((i) => ({ h: `Część ${i}`, t: `Tekst ${i}.`, ex: "" })), key: ["Raz", "Dwa", "Trzy"],
  terms: [{ en: "supply chain", pl: "łańcuch dostaw" }, { en: "inventory", pl: "zapasy" }],
  quiz: [{ q: "Pytanie A?", options: ["a1", "a2", "a3", "a4"], correct: 1, why: "Bo a2." }, { q: "Pytanie B?", options: ["b1", "b2", "b3", "b4"], correct: 2, why: "Bo b3." }, { q: "Pytanie C?", options: ["c1", "c2", "c3", "c4"], correct: 0, why: "Bo c1." }] };
const STAS_ID = "logistyka~W~essence-s";
const STAS = { title: "Staś o logistyce", sentences: [{ text: "Zdanie 1.", isWrong: false }, { text: "Zdanie 2 zły.", isWrong: true, fix: "Dobrze 2.", alts: ["Źle 2a.", "Źle 2b."], why: "Bo 2." }, { text: "Zdanie 3.", isWrong: false }, { text: "Zdanie 4 zły.", isWrong: true, fix: "Dobrze 4.", alts: ["Źle 4a."], why: "Bo 4." }] };
const meta = { po: { items: { [PO_ID]: { sid: "logistyka", k: "W", t: T0, syl: true, at: 1 } } }, ["po~" + PO_ID]: PO,
  stas: { items: { [STAS_ID]: { sid: "logistyka", k: "W", t: T0, n: 2 } } }, ["stas~" + STAS_ID]: STAS };
const LS = { "bm-group": "C112", "bm-sub": "A", "mock-progress": JSON.stringify({ [UID]: { group: "C112", sub: "A", xp: { t: 0, d: 0, n: 0 } } }),
  "mock-docs": JSON.stringify({ materials: MAT, materialContent: CONTENT, meta }) };
const getProg = (p) => p.evaluate((u) => JSON.parse(localStorage.getItem("mock-progress") || "{}")[u] || {}, UID);

const p = await page(b, { konto: "platne", ls: LS });
await p.clock.setFixedTime(CZAS);
await p.addInitScript(() => { let g; Object.defineProperty(window, "SKROT_GRY", { configurable: true, get: () => g, set: (v) => { const o = v.open; v.open = (gra, opts) => { window.__gryApi = opts.api; return o(gra, opts); }; g = v; } }); });
await p.goto(BASE + "index.html#/po5/" + encodeURIComponent(PO_ID)); await p.waitForTimeout(2500);
for (let i = 0; i < 3; i++) { await p.getByRole("button", { name: /Dalej →|Podsumowanie →/ }).click(); await p.waitForTimeout(150); }
const last = await p.locator("main").innerText();
ok("ostatni krok: link do pełnej lekcji", /Pełna lekcja: Lekcja 1: What logistics is about/.test(last), last.slice(-600));
ok("ostatni krok: „Dodaj pojęcia do fiszek” zaznaczone", await p.locator(".po-addterms input").isChecked(), "");
const qs = p.locator(".po-q");
await qs.nth(0).getByRole("button", { name: "a2" }).click(); await qs.nth(1).getByRole("button", { name: "b1" }).click(); await qs.nth(2).getByRole("button", { name: "c1" }).click();
await p.waitForTimeout(500);
const rpc = await p.evaluate(() => (window.__rpc || []).filter((x) => x.fn === "nauka_rp_po" || x.name === "nauka_rp_po"));
const calls = await p.evaluate(() => window.__rpPo || []);
ok("3 odpowiedzi wysłane do bazy (nauka_rp_po)", calls.length === 3 && calls[1].p_idx === 1 && calls[1].p_wybor === 0, { calls, rpc });
const wrong = await p.evaluate(() => [JSON.parse(localStorage.getItem("bm-po-zle") || "{}"), JSON.parse(localStorage.getItem("bm-gry-zle") || "{}")]);
// Od etapu rewanży lista pomylonych z gier jest w progress.rew; pytania z „Po zajęciach” zostają tylko w bm-po-zle (gry czytają obie).
ok("błędne pytanie trafia do pomylonych", !!wrong[0][`po~${PO_ID}:1`] && wrong[1][`po~${PO_ID}:1`] == null && !wrong[0][`po~${PO_ID}:0`], wrong);
await p.getByRole("button", { name: "Gotowe ✓" }).click(); await p.waitForTimeout(3300);
const pr = await getProg(p);
ok("XP rośnie: 10 za przeczytanie + 2 × 10 za dobre odpowiedzi", pr.xp?.t === 30, pr.xp);
const gk = Object.keys(pr.srs || {}).filter((k) => k.startsWith("g:logistyka:"));
ok("pojęcia w powtórkach (bez duplikatów) + kopia pojęć", gk.length === 2 && Object.keys(pr.poTerms || {}).length === 2, { gk, poTerms: pr.poTerms });
ok("wynik do statystyk tematu lekcji (learn)", JSON.stringify(pr.learn?.log1?.po) === "[2,3]", pr.learn);
// monety: saldo ze sklepu (atrapa liczy 10 pkt = 1 🪙)
const st = await p.evaluate(async () => (await window.skrot.sklep?.stan?.()) || null).catch(() => null);
const stan = await p.evaluate(async () => { try { return await window.skrot.sb.rpc("nauka_sklep_stan"); } catch (e) { return String(e); } });
ok("monety są (2 dobre = 20 pkt = 2 🪙)", /"saldo":2\b/.test(JSON.stringify(stan)) || /"saldo":2\b/.test(JSON.stringify(st)), { st, stan });
// fiszki z pojęć w powtórce: karta ma treść
await p.goto(BASE + "index.html#/review"); await p.waitForTimeout(2500);
await p.getByRole("button", { name: /^Zaczynamy/ }).first().click(); await p.waitForTimeout(1500);
const card = await p.evaluate(() => document.body.innerText);
ok("powtórka: karta z pojęciem po zajęciach", /PO ZAJĘCIACH · POJĘCIA EN → PL/i.test(card) && /supply chain|inventory/.test(card), card.slice(-300));
await p.keyboard.press("Escape"); await p.waitForTimeout(300);
// lekcja z linku
await p.goto(BASE + "index.html#/po5/" + encodeURIComponent(PO_ID)); await p.waitForTimeout(800);
for (let i = 0; i < 3 && await p.getByRole("button", { name: /Dalej →|Podsumowanie →/ }).count(); i++) { await p.getByRole("button", { name: /Dalej →|Podsumowanie →/ }).click(); await p.waitForTimeout(120); }
await p.getByRole("button", { name: /Pełna lekcja/ }).click(); await p.waitForTimeout(600);
ok("link prowadzi do właściwej lekcji kursu", /#\/material\/log1/.test(p.url()), p.url());

// ---- Staś: oznaczenia → baza, wynik do tematu, link do lekcji
await p.goto(BASE + "index.html#/stasx/" + encodeURIComponent(STAS_ID)); await p.waitForTimeout(1200);
await p.locator(".stas-s", { hasText: "Zdanie 2 zły." }).click(); await p.locator(".stas-s", { hasText: "Zdanie 1." }).click();
await p.getByRole("button", { name: "Sprawdź ✓" }).click(); await p.waitForTimeout(400);
const sc = await p.evaluate(() => window.__rpStas || []);
ok("Staś: oznaczone zdania idą do bazy (nauka_rp_stas)", sc.length === 1 && sc[0].p_zdania.sort().join() === "0,1", sc);
for (const fx of await p.locator(".stas-fix.is-hit").all()) await fx.getByRole("button", { name: "Dobrze 2." }).click();
await p.waitForTimeout(200);
ok("Staś: link do lekcji pod wynikiem", /Pełna lekcja: Lekcja 1/.test(await p.locator(".stas-sum").innerText().catch(() => "")), await p.locator("main").innerText().then((x) => x.slice(-500)));
await p.locator(".stas-sum").getByRole("button", { name: "Gotowe ✓" }).click(); await p.waitForTimeout(3200);
const pr2 = await getProg(p);
ok("Staś: wynik do tematu (słaby: 1/4) i XP", JSON.stringify(pr2.learn?.log1?.stas) === "[1,4]" && pr2.xp?.t === 35, { learn: pr2.learn, xp: pr2.xp });
// ---- Jak zdobywać XP i monety
await p.goto(BASE + "index.html#/profil"); await p.waitForTimeout(800);
ok("bez błędów w konsoli", !p.errors.length, p.errors);

// ---- następny dzień: pomylone pytanie wraca w grze
const g = await page(b, { konto: "platne", ls: { ...LS, "bm-po-zle": await p.evaluate(() => localStorage.getItem("bm-po-zle")), "bm-gry-zle": await p.evaluate(() => localStorage.getItem("bm-gry-zle")) } });
await g.clock.setFixedTime(new Date("2026-11-05T12:00:00+01:00"));
await g.addInitScript(() => { let v0; Object.defineProperty(window, "SKROT_GRY", { configurable: true, get: () => v0, set: (v) => { const o = v.open; v.open = (gra, opts) => { window.__gryApi = opts.api; return o(gra, opts); }; v0 = v; } }); });
await g.goto(BASE + "index.html#/gra/frun"); await g.waitForTimeout(3500);
const gq = await g.evaluate(async () => (window.__gryApi ? (await window.__gryApi.questions("logistyka", 12)).map((q) => q.q) : null));
ok("pomylone pytanie z Po zajęciach wraca w grze (na początku)", gq?.[0] === "Pytanie B?", gq);
ok("gra: bez błędów", !g.errors.length, g.errors);

await b.close();
for (const w of wyniki) console.log(w.join(" "));
const bad = wyniki.filter((w) => w[0] === "✗").length;
console.log(`\n${wyniki.length - bad}/${wyniki.length}`);
process.exit(bad ? 1 : 0);
