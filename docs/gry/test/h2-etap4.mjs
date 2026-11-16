// Wygląd H2, etap 4: odtwarzacz lekcji i quizu (.lp): pasek, karty, informacja zwrotna, „+XP”, ekran końcowy ze Stasiem.
// BASE=http://127.0.0.1:8801/ node docs/gry/test/h2-etap4.mjs
import { chromium, OUT, open, tester, fps } from "./h2-lib.mjs";
const { ok, end } = tester();
const b = await chromium.launch();
const finals = {};
const lum = (c) => { const m = c.match(/\d+(\.\d+)?/g).map(Number).slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]; };
const cr = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
// Przechodzi karty: zaznacza pierwszą odpowiedź, gdy są, i klika główny przycisk na dole, aż pojawi się ekran końcowy.
async function play(p, max = 60, onFb) {
  for (let i = 0; i < max; i++) {
    if (await p.locator(".lp-done-screen").count()) return true;
    const opt = p.locator(".lp-opts .opt:not([disabled]):not(.sel), .lp-bank .opt:not([disabled]):not(.sel)").first();
    if (await opt.count()) { await opt.click(); await p.waitForTimeout(120); const ck = p.locator('.lp-bottom [data-conf="1"]:not([disabled]), .lp-bottom .lp-cta:not([disabled]):not([hidden])').filter({ hasText: /^(Sprawdź|Pewny)/ }).first(); if (await ck.count()) await ck.click(); /* UX-3 etap 3: zaznacz + Sprawdź */ await p.waitForTimeout(250); if (onFb && await p.locator(".lp-fbar .v").count()) await onFb(); }
    const own = p.locator(".lp-stage button:not([disabled]), .lp-bottom .lp-barx button:not([disabled])").filter({ hasText: /^(Wiedziałem|Pokaż|Sprawdź|Odsłoń|Gotowe|Rozumiem)/ }).first(); /* UX-3: przyciski karty w dolnym pasku */
    if (!(await p.locator(".lp-opts .opt").count()) && await own.count()) { await own.click(); await p.waitForTimeout(250); }
    const cta = p.locator(".lp-bottom .lp-cta:not([disabled]):not([hidden])").first();
    if (await cta.count()) { await cta.click(); await p.waitForTimeout(250); } else await p.waitForTimeout(200);
  }
  return !!(await p.locator(".lp-done-screen").count());
}
for (const dark of [false, true]) {
  const n = dark ? "ciemny" : "jasny";
  const p = await open(b, { dark });
  await p.locator(".zh-hero .zh-go").click(); await p.locator(".lp").waitFor({ timeout: 15000 }); await p.waitForTimeout(700);
  await p.screenshot({ path: `${OUT}/h2e4-${n}-start.png` });
  ok(`${n}: pasek postępu gruby (16 px)`, (await p.locator(".lp-bar").evaluate((e) => getComputedStyle(e).height)) === "16px", "");
  ok(`${n}: przycisk zamknięcia 3D`, (await p.locator(".lp-x").first().evaluate((e) => getComputedStyle(e).borderBottomWidth)) === "4px", "");
  ok(`${n}: moneta w odtwarzaczu jako SVG`, await p.locator(".lp-coinchip .h2-coin svg").count() === 1 || await p.locator(".lp-coinchip[hidden]").count() === 1, "");
  let fbSeen = null, wide = { sw: 0, bar: 999 };
  const done = await play(p, 60, async () => {
    if (fbSeen) return;
    // UX-3: werdykt jest w dolnym pasku (.lp-fbar w .lp-bottom), pasek barwi się na zielono / czerwono.
    const r = await p.locator(".lp-bottom").evaluate((e) => { const c = getComputedStyle(e), f = getComputedStyle(e.querySelector(".lp-fbar .v")); return { cls: e.className, bg: c.backgroundColor, bw: c.borderTopWidth, col: f.color }; });
    fbSeen = r; await p.screenshot({ path: `${OUT}/h2e4-${n}-odpowiedz.png` });
    wide = await p.evaluate(() => { const xp = document.querySelector(".lp-xpchip"); return { sw: document.querySelector(".lp").scrollWidth, bar: Math.round(document.querySelector(".lp-bar").getBoundingClientRect().width), xp: !!xp && xp.getBoundingClientRect().width > 2 }; });
  });
  ok(`${n}: odtwarzacz mieści się w 375 px (bez przewijania w bok), pasek postępu ≥ 72 px (UX-3: bez stałej pigułki XP w nagłówku)`, (wide.sw <= 376) && wide.bar >= 72 && !wide.xp, wide);
  ok(`${n}: informacja zwrotna jako kolorowy dolny pasek z obrysem i czytelnym nagłówkiem`, fbSeen && fbSeen.bw === "2px" && cr(fbSeen.col, fbSeen.bg) >= 4.5, fbSeen);
  ok(`${n}: lekcję da się przejść do ekranu końcowego`, done, await p.locator(".lp-stage").innerText().catch(() => ""));
  if (done) {
    await p.waitForTimeout(150);
    const mid = await p.locator(".lp-stat b").allInnerTexts();
    await p.waitForTimeout(1600);
    const fin = await p.locator(".lp-stat b").evaluateAll((bs) => bs.map((b) => (b.querySelector('[aria-hidden="true"]') || b).textContent.trim()));
    await p.screenshot({ path: `${OUT}/h2e4-${n}-koniec.png` });
    ok(`${n}: ekran końcowy ze Stasiem`, await p.locator(".lp-done-screen .lp-stas svg").count() === 1, "");
    finals[n] = fin;
    ok(`${n}: w trakcie liczenia czytnik dostaje wynik końcowy (ukryty tekst), liczba animowana ukryta`, await p.locator(".lp-stat b .h2-sr").count() === 0 || await p.locator('.lp-stat b > [aria-hidden="true"]').count() >= 1, "");
    const fs = await p.locator(".lp-stat b").evaluateAll((bs) => bs.map((b) => parseFloat(getComputedStyle(b.querySelector(".h2-cnt") || b).fontSize)));
    ok(`${n}: liczona liczba ma ten sam rozmiar co pozostałe (np. „1/3”)`, fs.length > 1 && fs.every((v) => Math.abs(v - fs[fs.length - 1]) < 0.5), fs);
    ok(`${n}: Staś zamiast ptaszka (bez obu naraz)`, await p.locator(".lp-done-screen .lp-bigcheck").count() === 0, "");
    const st = await p.locator(".lp-stat").first().evaluate((e) => { const c = getComputedStyle(e), bb = getComputedStyle(e.querySelector("b")); return [c.borderBottomWidth, bb.color, c.backgroundColor]; });
    ok(`${n}: kafelki statystyk 3D i czytelne`, st[0] === "4px" && cr(st[1], st[2]) >= 4.5, st);
  }
  ok(`${n}: bez błędów w konsoli`, p.errors.length === 0, p.errors);
  await p.close();
}
{ // ruch wyłączony: bez liczenia w górę
  const p = await open(b, { ctx: undefined, ls: { "skrot-calm": "1" } });
  await p.locator(".zh-hero .zh-go").click(); await p.locator(".lp").waitFor({ timeout: 15000 });
  const done = await play(p, 60);
  if (done) { await p.waitForTimeout(100); const t = await p.locator(".lp-stat b").allInnerTexts(); await p.waitForTimeout(900); const t2 = await p.locator(".lp-stat b").allInnerTexts(); ok("html.calm: liczby od razu końcowe (bez liczenia)", JSON.stringify(t) === JSON.stringify(t2), { t, t2 });
    ok("liczenie w górę kończy na tych samych liczbach co ekran bez animacji", JSON.stringify(finals.jasny) === JSON.stringify(t2), { anim: finals.jasny, calm: t2 }); }
  else ok("html.calm: dojście do końca", false, "");
  await p.close();
}
{ // Quiz z całego przedmiotu, same złe odpowiedzi: ekran części ze Stasiem „myślę”, potem gwiazdki
  const p = await open(b, { wait: 2500 });
  await p.evaluate((A) => { location.hash = "#/subjectQuiz/" + A; }, "analiza-matematyczna"); await p.waitForTimeout(2500);
  await p.locator("main").getByRole("button", { name: /^Zaczynamy/ }).first().click(); await p.locator(".lp").waitFor({ timeout: 15000 });
  let part = null, stars = null;
  for (let i = 0; i < 120 && !stars; i++) {
    if (await p.locator(".lp-done-screen .lp-bigstars").count()) { stars = true; break; }
    if (!part && await p.locator(".lp-done-screen").count()) { part = await p.locator(".lp-done-screen .lp-stas").getAttribute("data-mood").catch(() => null); await p.screenshot({ path: `${OUT}/h2e4-quiz-czesc.png` }); }
    const bad = p.locator(".lp-opts .opt:not([disabled])").filter({ hasText: /Zła/ }).first();
    if (await bad.count()) { await bad.click(); await p.waitForTimeout(120); const g = p.locator('.lp-bottom [data-conf="0"]:not([disabled])'); if (await g.count()) await g.click(); /* UX-3: pewność w dolnym pasku */ await p.waitForTimeout(200); }
    const cta = p.locator(".lp-bottom .lp-cta:not([disabled]):not([hidden])").first();
    if (await cta.count()) { await cta.click(); await p.waitForTimeout(200); } else await p.waitForTimeout(150);
  }
  ok("quiz, złe odpowiedzi: na końcu części Staś „myślę” (nie radość)", part === "think", part);
  if (stars) {
    await p.waitForTimeout(1200); await p.screenshot({ path: `${OUT}/h2e4-quiz-gwiazdki.png` });
    const off = await p.locator(".lp-bigstars .off").evaluateAll((e) => e.map((x) => +getComputedStyle(x).opacity));
    ok("gwiazdki: nieaktywne przygaszone (≤ 0.3)", off.length > 0 && off.every((o) => o <= 0.3), off);
    ok("gwiazdki: czytane jako jeden obraz (role=img)", await p.locator(".lp-bigstars[role=img]").count() === 1, "");
    const prim = await p.locator(".lp-done-screen .lp-actions .btn.primary").count();
    const ctaBg = await p.locator(".lp-bottom .lp-cta").evaluate((e) => getComputedStyle(e).backgroundColor);
    const surf = await p.evaluate(() => getComputedStyle(document.querySelector(".lp-card, .lp-stat") || document.body).backgroundColor);
    ok("ekran końcowy: jeden główny przycisk (dolny drugorzędny, gdy w treści jest główny)", !prim || ctaBg === surf, { prim, ctaBg, surf });
    const cols = await p.locator(".lp-done-screen .lp-stats").first().evaluate((e) => [e.children.length, getComputedStyle(e).gridTemplateColumns.split(" ").length]);
    ok("statystyki: przy 4 kafelkach układ 2×2 na telefonie", cols[0] < 4 || cols[1] === 2, cols);
  } else ok("quiz: dojście do gwiazdek", false, await p.locator(".lp-stage").innerText().catch(() => ""));
  ok("quiz: bez błędów w konsoli", p.errors.length === 0, p.errors);
  await p.close();
}
const f = await open(b);
await f.locator(".zh-hero .zh-go").click(); await f.locator(".lp").waitFor({ timeout: 15000 });
const v = await fps(f, async () => { await play(f, 6); }, 2500);
console.log("   fps przy CPU 4× (odpowiadanie w lekcji):", v);
ok("płynność w lekcji: ≥ 45 fps przy CPU 4×", v >= 45, v);
await f.close();
await b.close();
end();
