// Poziomy, rangi i widoczne monety (SQL v22 + lpLevelBar / levelUpShow / gainPop) na atrapie.
// 1) Dziś: zwarta ranga (Ogarnięty, poz. 5) + monety + seria; 2) Więcej: karta rangi, najbliższa nagroda, ściąga;
// 3) quiz: dobra odpowiedź → „+1 🪙” w odtwarzaczu od razu (dzis_pkt z v22), ekran końca z monetami i rosnącym paskiem;
// 4) awans po zamknięciu quizu: okno „Poziom 6 · Bystrzak”; 5) bez v22: moneta po odświeżeniu salda (dymek);
// 6) drabinka rang; 7) EN; 8) „Mniej animacji”. Zrzuty 390 i 1280: $OUT/poziomy/.
import { chromium, page, BASE, OUT } from "./lib.mjs";
import fs from "fs";
const D = OUT + "/poziomy"; fs.mkdirSync(D, { recursive: true });
const shot = (p, n, full) => p.screenshot({ path: `${D}/${n}.png`, fullPage: !!full });
const UID = "00000000-0000-4000-8000-000000000001";
const dayN = (() => { const d = new Date(); return Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(2026, 0, 1)) / 864e5); })();
const prog = (t, n = 30) => JSON.stringify({ [UID]: { xp: { t, d: dayN, n }, streak: { d: dayN, n: 4 } } });
const b = await chromium.launch();
const wyniki = [], errs = [];
const ok = (nazwa, w, info) => wyniki.push([w ? "✓" : "✗", nazwa, w ? "" : JSON.stringify(info)?.slice(0, 400)]);
const txt = async (p, sel) => ((await p.locator(sel).count()) ? (await p.locator(sel).first().innerText()).replace(/\s+/g, " ") : "");
const done = (p, n) => { if (p.errors.length) errs.push([n, p.errors]); return p.context().close(); };
// Dobra odpowiedź w quizie atrapy: poprawna to „Odpowiedź <ABCD[i % 4]><i>”, i = numer pytania − 1.
async function dobrze(p) {
  await p.locator(".lp-opts .opt").first().waitFor({ timeout: 5000 });
  const opts = await p.locator(".lp-opts .opt").allInnerTexts();
  const k = opts.findIndex((t) => { const m = t.match(/Odpowiedź ([ABCD])(\d+)/); return m && "ABCD".indexOf(m[1]) === +m[2] % 4; });
  await p.locator(".lp-opts .opt").nth(k).click();
}
const dalej = async (p) => { await p.locator(".lp-cta").click({ timeout: 4000 }).catch(() => {}); await p.waitForTimeout(300); };

// 1–2) Dziś i Więcej
for (const [w, hh] of [[390, 844], [1280, 800]]) {
  const p = await page(b, { w, h: hh, ls: { "mock-progress": prog(1250), "mock-saldo": "85" } });
  await p.goto(BASE + "index.html#/"); await p.waitForTimeout(2500);
  const g = await txt(p, ".greet .rk-line");
  ok(`${w} Dziś: ranga Ogarnięty, poz. 5, monety 85, seria 4`, /Ogarnięty/.test(g) && /poz\. 5/.test(g) && /🪙\s*85/.test(g) && /🔥\s*4/.test(g), g);
  await shot(p, `dzis-${w}`);
  const sw = await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  ok(`${w} Dziś: bez poziomego przewijania`, sw);
  await p.evaluate(() => { location.hash = "#/more"; }); await p.waitForTimeout(900);
  const m = await txt(p, ".sk-profile");
  ok(`${w} Więcej: karta rangi z XP do poziomu 6 i nagrodą Nenufary (poziom 7)`, /Ogarnięty/.test(m) && /250 \/ 500 XP do poziomu 6/.test(m) && /Następna nagroda: motyw Nenufary/.test(m) && /brakuje 850 XP/.test(m), m);
  await shot(p, `wiecej-${w}`);
  if (w === 390) {
    await p.locator(".lv-howlink").click(); await p.waitForTimeout(400);
    const how = await txt(p, ".lv-how-modal");
    ok("Ściąga: XP, monety, seria", /XP → poziom i ranga/.test(how) && /Monety → sklep/.test(how) && /Skończona lekcja\s*3 🪙/.test(how), how.slice(0, 300));
    await shot(p, "sciaga-390");
    await p.evaluate(() => document.getElementById("layer").replaceChildren());
    await p.locator(".sk-profile .rk").click(); await p.waitForTimeout(600);
    const lv = await txt(p, ".lv-modal");
    ok("Drabinka rang: Tu jesteś przy Ogarnięty, Świeżak i Mistrz na liście", /Tu jesteś/.test(lv) && /Świeżak/.test(lv) && /Mistrz/.test(lv), lv.slice(0, 200));
    await shot(p, "drabinka-390");
  }
  await done(p, `dzis/wiecej ${w}`);
}

// 3–4) quiz: monety od razu, koniec z monetami, awans po zamknięciu
for (const [w, hh] of [[390, 844], [1280, 800]]) {
  const p = await page(b, { w, h: hh, ls: { "mock-progress": prog(1480), "mock-saldo": "85" } });
  await p.goto(BASE + "index.html#/material/m1"); await p.waitForTimeout(1800);
  await p.getByRole("button", { name: /Quiz/ }).first().click();
  await p.getByRole("button", { name: /Zaczynamy/ }).click(); await p.waitForTimeout(700);
  const c0 = await txt(p, ".lp-coinchip");
  await dobrze(p); await p.waitForTimeout(250);
  const c1 = await txt(p, ".lp-coinchip"), fl = await p.locator(".lp-float.coin").count();
  ok(`${w} quiz: dobra odpowiedź → saldo 85 → 86 od razu i „+1 🪙” przy monetach`, /85/.test(c0) && /86/.test(c1) && fl >= 1, { c0, c1, fl });
  if (w === 390) await shot(p, "quiz-moneta-390");
  for (let i = 0; i < 4; i++) { await dalej(p); if (await p.locator(".lp-opts .opt").count()) await dobrze(p).catch(() => {}); await p.waitForTimeout(150); }
  await p.waitForTimeout(1800);
  const c2 = await p.evaluate(() => window.skrot.sklep.saldo);
  const shown = await txt(p, ".lp-coinchip");
  ok(`${w} quiz: po odświeżeniu z bazy saldo = to na ekranie (bez podwójnego liczenia)`, shown.includes(String(c2)), { c2, shown });
  // zamknięcie: XP z quizu przekracza 1500 → awans
  await p.locator(".lp-x").first().click(); await p.waitForTimeout(1200);
  const up = await txt(p, ".lvup");
  ok(`${w} awans: okno „Poziom 6 · Bystrzak”`, /Awans!/i.test(up) && /Poziom 6 · Bystrzak/.test(up) && /Następna nagroda: motyw Nenufary na poziomie 7/.test(up), up);
  await shot(p, `awans-${w}`);
  await done(p, `quiz ${w}`);
}
// awans z nagrodą (poziom 7 → Nenufary) i ekran końca quizu
{
  const p = await page(b, { ls: { "mock-progress": prog(2090), "mock-saldo": "85" } });
  await p.goto(BASE + "index.html#/material/m1"); await p.waitForTimeout(1800);
  await p.getByRole("button", { name: /Quiz/ }).first().click();
  await p.getByRole("button", { name: /Zaczynamy/ }).click(); await p.waitForTimeout(700);
  for (let i = 0; i < 40 && !(await p.locator(".lp-done-screen").count()); i++) { if (await p.locator(".lp-opts .opt").count()) await dobrze(p).catch(() => {}); await dalej(p); }
  await p.waitForTimeout(600);
  const end = await txt(p, ".lp-done-screen");
  ok("koniec quizu: monety w statystykach i ranga z paskiem", /🪙/.test(end) && /monety/.test(end) && /poz\. 7|poz\. 6/.test(end), end.slice(0, 300));
  await shot(p, "koniec-quizu-390");
  await p.waitForTimeout(1800);
  const up = await txt(p, ".lvup");
  ok("awans na 7: nagroda Nenufary z przyciskiem Włącz", /Poziom 7 · Analityk/.test(up) && /Nagroda: motyw Nenufary/.test(up) && /Włącz/.test(up), up);
  await shot(p, "awans-nagroda-390");
  await done(p, "awans 7");
}
// 5) bez v22: moneta pokazuje się po odświeżeniu salda (dymek poza odtwarzaczem)
{
  const p = await page(b, { ls: { "mock-progress": prog(300), "mock-saldo": "10", "mock-v22": "0" } });
  await p.goto(BASE + "index.html#/"); await p.waitForTimeout(2500);
  await p.evaluate(() => window.skrot.rp.odp({ mid: "m1", idx: 0, wybor: 0, zrodlo: "quiz" }));
  await p.waitForTimeout(400);
  const before = await p.locator(".gain-coin").count();
  await p.waitForTimeout(1800);
  const pop = await txt(p, ".gain-tray"), chip = await txt(p, ".greet .hud-coin");
  ok("bez v22: brak monety przed odświeżeniem, potem dymek „+1 🪙” i 11 na Dziś", before === 0 && /\+1 🪙/.test(pop) && /11/.test(chip), { before, pop, chip });
  await shot(p, "bez-v22-dymek-390");
  await done(p, "bez v22");
}
// 7) EN
{
  const p = await page(b, { lang: "en", ls: { "mock-progress": prog(1250), "mock-saldo": "85" } });
  await p.goto(BASE + "index.html#/more"); await p.waitForTimeout(2500);
  const m = await txt(p, ".sk-profile");
  ok("EN: karta rangi po angielsku", /Your level/i.test(m) && /lvl 5/.test(m) && /Next reward/.test(m) && !/Następna|poziomu|brakuje/.test(m), m);
  await shot(p, "en-wiecej-390");
  await p.locator(".lv-howlink").click(); await p.waitForTimeout(400);
  const how = await txt(p, ".lv-how-modal");
  ok("EN: ściąga po angielsku", /How to earn XP and coins/.test(how) && !/Skończona|Dobra odpowiedź/.test(how), how.slice(0, 300));
  await shot(p, "en-sciaga-390");
  await done(p, "EN");
}
// 8) Mniej animacji: dymek widoczny bez animacji
{
  const p = await page(b, { ls: { "mock-progress": prog(300), "mock-saldo": "10", "skrot-calm": "1" } });
  await p.goto(BASE + "index.html#/"); await p.waitForTimeout(2500);
  await p.evaluate(() => window.skrot.rp.odp({ mid: "m1", idx: 0, wybor: 0, zrodlo: "quiz" }));
  await p.waitForTimeout(300);
  const op = await p.evaluate(() => { const g = document.querySelector(".gain"); return g ? getComputedStyle(g).opacity : null; });
  ok("calm: dymek „+1 🪙” widoczny (bez animacji)", op === "1", op);
  await done(p, "calm");
}
await b.close();
for (const r of wyniki) console.log(r.join("  "));
if (errs.length) console.log("BŁĘDY KONSOLI:", JSON.stringify(errs, null, 1).slice(0, 2000));
console.log(wyniki.filter((r) => r[0] === "✗").length ? "SĄ BŁĘDY" : "WSZYSTKO OK");
