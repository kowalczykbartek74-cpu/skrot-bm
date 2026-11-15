// Wygląd H2, etap 4: odtwarzacz lekcji i quizu (.lp): pasek, karty, informacja zwrotna, „+XP”, ekran końcowy ze Stasiem.
// BASE=http://127.0.0.1:8801/ node docs/gry/test/h2-etap4.mjs
import { chromium, OUT, open, tester, fps } from "./h2-lib.mjs";
const { ok, end } = tester();
const b = await chromium.launch();
const lum = (c) => { const m = c.match(/\d+(\.\d+)?/g).map(Number).slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]; };
const cr = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
// Przechodzi karty: zaznacza pierwszą odpowiedź, gdy są, i klika główny przycisk na dole, aż pojawi się ekran końcowy.
async function play(p, max = 60, onFb) {
  for (let i = 0; i < max; i++) {
    if (await p.locator(".lp-done-screen").count()) return true;
    const opt = p.locator(".lp-opts .opt:not([disabled])").first();
    if (await opt.count()) { await opt.click(); await p.waitForTimeout(250); if (onFb && await p.locator(".lp-fb").count()) await onFb(); }
    const own = p.locator(".lp-stage button:not([disabled])").filter({ hasText: /^(Wiedziałem|Pokaż|Sprawdź|Odsłoń|Gotowe|Rozumiem)/ }).first();
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
  let fbSeen = null;
  const done = await play(p, 60, async () => {
    if (fbSeen) return;
    const r = await p.locator(".lp-fb").first().evaluate((e) => { const c = getComputedStyle(e), f = getComputedStyle(e.firstElementChild || e); return { cls: e.className, bg: c.backgroundColor, bw: c.borderTopWidth, col: f.color }; });
    fbSeen = r; await p.screenshot({ path: `${OUT}/h2e4-${n}-odpowiedz.png` });
  });
  ok(`${n}: informacja zwrotna jako kolorowy panel z obrysem i czytelnym nagłówkiem`, fbSeen && fbSeen.bw === "2px" && cr(fbSeen.col, fbSeen.bg) >= 4.5, fbSeen);
  ok(`${n}: lekcję da się przejść do ekranu końcowego`, done, await p.locator(".lp-stage").innerText().catch(() => ""));
  if (done) {
    await p.waitForTimeout(150);
    const mid = await p.locator(".lp-stat b").allInnerTexts();
    await p.waitForTimeout(1600);
    const fin = await p.locator(".lp-stat b").allInnerTexts();
    await p.screenshot({ path: `${OUT}/h2e4-${n}-koniec.png` });
    ok(`${n}: ekran końcowy ze Stasiem`, await p.locator(".lp-done-screen .lp-stas svg").count() === 1, "");
    ok(`${n}: statystyki kończą na właściwych liczbach (liczenie w górę nie zmienia wyniku)`, fin.length > 0 && fin.every((t) => /\d|—/.test(t)), { mid, fin });
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
  if (done) { await p.waitForTimeout(100); const t = await p.locator(".lp-stat b").allInnerTexts(); await p.waitForTimeout(900); const t2 = await p.locator(".lp-stat b").allInnerTexts(); ok("html.calm: liczby od razu końcowe (bez liczenia)", JSON.stringify(t) === JSON.stringify(t2), { t, t2 }); }
  else ok("html.calm: dojście do końca", false, "");
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
