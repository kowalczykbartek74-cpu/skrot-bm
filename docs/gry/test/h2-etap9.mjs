// Wygląd H2, etap 9: Więcej (wiersze i kafle 3D, kolorowe ikony), profil, ustawienia (zakładki-pigułki, kafle motywów 3D,
// przełącznik), ekran logowania (zawsze jasny, przyciski i karty 3D).
// BASE=http://127.0.0.1:8801/ node docs/gry/test/h2-etap9.mjs
import { chromium, OUT, open, tester, fps } from "./h2-lib.mjs";
const { ok, end } = tester();
const b = await chromium.launch();
const lum = (c) => { const srgb = /^color\(srgb/.test(c); const m = c.match(/\d+(\.\d+)?/g).map(Number).slice(0, 3).map((v) => { if (!srgb) v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]; };
const cr = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
const noH = (p) => p.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
for (const dark of [false, true]) for (const w of [360, 1280]) {
  const n = `${dark ? "ciemny" : "jasny"}-${w}`;
  let p = await open(b, { dark, w, h: w > 500 ? 900 : 740, hash: "/more", konto: "platne" });
  await p.screenshot({ path: `${OUT}/h2e9-${n}-wiecej.png`, fullPage: true });
  const rows = await p.locator("main :is(.more-row, .more-tile)").evaluateAll((rs) => rs.map((r) => { const c = getComputedStyle(r), t = r.querySelector(".more-txt > span, .more-tile-t") || r; return { bb: c.borderBottomWidth, col: getComputedStyle(t).color, bg: c.backgroundColor, ic: getComputedStyle(r.querySelector(".ico") || r).backgroundColor }; }));
  ok(`${n}: wiersze i kafle Więcej jako karty 3D (dół 4 px), czytelne`, rows.length > 6 && rows.every((r) => r.bb === "4px" && cr(r.col, r.bg) >= 4.5), rows.slice(0, 2));
  ok(`${n}: ikony w co najmniej 3 kolorach`, new Set(rows.map((r) => r.ic)).size >= 3, [...new Set(rows.map((r) => r.ic))]);
  ok(`${n}: Więcej bez poziomego przewijania`, await noH(p), "");
  ok(`${n}: Więcej bez błędów`, p.errors.length === 0, p.errors);
  await p.close();
  p = await open(b, { dark, w, h: w > 500 ? 900 : 740, hash: "/ustawienia", konto: "platne" });
  await p.screenshot({ path: `${OUT}/h2e9-${n}-ustawienia.png`, fullPage: true });
  const tabs = await p.locator(".set-tabs .tab").evaluateAll((ts) => ts.map((t) => { const r = t.getBoundingClientRect(), c = getComputedStyle(t); return { r: Math.round(r.right), h: Math.round(r.height), bb: c.borderBottomWidth, sel: t.getAttribute("aria-selected"), col: c.color, bg: c.backgroundColor }; }));
  ok(`${n}: zakładki ustawień jako pigułki 3D, wszystkie widoczne w oknie, ≥ 40 px`, tabs.length >= 3 && tabs.every((t) => t.bb === "4px" && t.r <= w && t.h >= 40 && cr(t.col, t.bg) >= 4.5), tabs);
  const th = await p.locator(".set-theme").evaluateAll((ts) => ts.map((t) => { const c = getComputedStyle(t), b = t.querySelector("b"); return { bb: c.borderBottomWidth, on: t.getAttribute("aria-pressed"), col: getComputedStyle(b).color, bg: c.backgroundColor, top: Math.round(t.getBoundingClientRect().top) }; }));
  ok(`${n}: kafle motywów 3D (dół 5 px), czytelne`, th.length >= 4 && th.every((t) => t.bb === "5px" && cr(t.col, t.bg) >= 4.5), th.slice(0, 2));
  if (w < 500) ok(`${n}: na telefonie motywy po 3 w rzędzie`, th.length >= 3 && th[0].top === th[2].top, th.slice(0, 3).map((t) => t.top));
  const sw = await p.locator(".switch").first().evaluate((e) => { const i = e.querySelector("i"); return { w: e.getBoundingClientRect().width, sh: getComputedStyle(i).boxShadow }; }).catch(() => null);
  ok(`${n}: przełącznik większy, gałka 3D`, sw && sw.w === 50 && /2px 0px/.test(sw.sh), sw);
  ok(`${n}: Ustawienia bez poziomego przewijania`, await noH(p), "");
  ok(`${n}: Ustawienia bez błędów`, p.errors.length === 0, p.errors);
  await p.close();
  p = await open(b, { dark, w, h: w > 500 ? 900 : 740, hash: "/profil", konto: "platne" });
  await p.screenshot({ path: `${OUT}/h2e9-${n}-profil.png`, fullPage: true });
  ok(`${n}: Profil bez poziomego przewijania i błędów`, (await noH(p)) && p.errors.length === 0, p.errors);
  await p.close();
  p = await open(b, { dark, w, h: w > 500 ? 900 : 740, konto: "brak" });
  await p.screenshot({ path: `${OUT}/h2e9-${n}-logowanie.png`, fullPage: true });
  const lg = await p.evaluate(() => { const q = (s) => document.querySelector(s), cs = (e) => e && getComputedStyle(e);
    const btn = q("#loginBox .btn.primary"), trial = q("#login .lg-trial"), demo = q("#login .lg-demo-btn"), ghost = q("#loginBox .btn.ghost");
    return { btn: cs(btn)?.boxShadow, btnCol: cs(btn)?.color, btnBg: cs(btn)?.backgroundColor, trial: cs(trial)?.borderBottomWidth, demo: cs(demo)?.borderBottomWidth, ghost: ghost ? cs(ghost).boxShadow : "none", bg: getComputedStyle(document.body).backgroundColor }; });
  ok(`${n}: logowanie: główny przycisk 3D i czytelny`, /4px 0px/.test(lg.btn) && cr(lg.btnCol, lg.btnBg) >= 4.5, lg);
  ok(`${n}: logowanie: karta próby i przycisk przykładowej lekcji 3D`, (!lg.trial || lg.trial === "6px") && lg.demo === "4px", lg);
  ok(`${n}: logowanie: przyciski-linki bez cienia`, lg.ghost === "none", lg.ghost);
  ok(`${n}: logowanie zawsze jasne`, lg.bg === "rgb(255, 255, 255)", lg.bg);
  ok(`${n}: logowanie bez poziomego przewijania i błędów`, (await noH(p)) && p.errors.length === 0, p.errors);
  await p.close();
}
for (const th of ["riwiera", "pink"]) {
  const p = await open(b, { theme: th, hash: "/more" });
  const bb = await p.locator("main .more-row").first().evaluate((e) => getComputedStyle(e).borderBottomWidth).catch(() => "brak");
  ok(`motyw ${th}: Więcej bez stylu H2`, bb !== "4px", bb);
  await p.close();
}
const f = await open(b, { hash: "/more", konto: "platne" });
const v = await fps(f, async () => { await f.mouse.wheel(0, 1200); await f.waitForTimeout(300); await f.evaluate(() => { location.hash = "#/ustawienia"; }); await f.waitForTimeout(600); await f.mouse.wheel(0, 800); });
console.log("   fps przy CPU 4× (Więcej → Ustawienia):", v);
ok("płynność: ≥ 45 fps przy CPU 4×", v >= 45, v);
await f.close();
await b.close();
end();
