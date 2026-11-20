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
  ok(`${n}: wiersze i kafle Więcej czytelne (3D albo płaskie z Wygląd pro; przezroczyste tło sprawdza kontrola AA)`, rows.length > 6 && rows.every((r) => ["4px", "2px", "0px"].includes(r.bb) && (r.bg === "rgba(0, 0, 0, 0)" || cr(r.col, r.bg) >= 4.5)) /* Wygląd pro: płaskie wiersze */, rows.filter((r) => !["4px", "2px", "0px"].includes(r.bb) || (r.bg !== "rgba(0, 0, 0, 0)" && cr(r.col, r.bg) < 4.5)).slice(0, 3));
  ok(`${n}: ikony w co najmniej 3 kolorach`, new Set(rows.map((r) => r.ic)).size >= 3, [...new Set(rows.map((r) => r.ic))]);
  const edge = await p.locator("main .more-row").first().evaluate((e) => [getComputedStyle(e).borderBottomColor, getComputedStyle(document.body).backgroundColor, getComputedStyle(e).backgroundColor]);
  ok(`${n}: dolny brzeg 3D odcina się od tła i karty (≥ 1,4:1)`, (edge[2] === "rgba(0, 0, 0, 0)" || (cr(edge[0], edge[1]) >= 1.4 && cr(edge[0], edge[2]) >= 1.3)), edge); /* Wygląd pro: wiersz bez tła i brzegu */
  if (w < 500) { const H = await p.evaluate(() => document.documentElement.scrollHeight); ok(`${n}: Więcej na telefonie krótsze (≤ 2150 px)`, H <= 2150, H);
    const clip = await p.locator("main .more-row .more-txt small, main .more-tile small").evaluateAll((es) => es.filter((e) => e.scrollHeight > e.clientHeight + 2).map((e) => e.textContent));
    ok(`${n}: opisy w Więcej nie ucięte`, clip.length === 0, clip);
    const tl = await p.locator(".more-tile-t").evaluateAll((ts) => ts.map((t) => Math.round(t.getBoundingClientRect().height / parseFloat(getComputedStyle(t).lineHeight || 20))));
    ok(`${n}: tytuły kafli najwyżej w 2 liniach`, tl.every((x) => x <= 2), tl); }
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
  const cut = await p.locator(".more-row .more-txt small").evaluateAll((es) => es.filter((e) => e.scrollWidth > e.clientWidth + 1).length);
  ok(`${n}: opisy w ustawieniach nie ucięte`, cut === 0, cut);
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
    return { btn: cs(btn)?.boxShadow, btnR: cs(btn)?.borderTopLeftRadius, btnCol: cs(btn)?.color, btnBg: cs(btn)?.backgroundColor, trial: cs(trial)?.borderBottomWidth, trialBg: cs(trial)?.backgroundColor, demo: cs(demo)?.borderBottomWidth, ghost: ghost ? cs(ghost).boxShadow : "none", bg: getComputedStyle(document.body).backgroundColor }; });
  // Ekran wejścia w stylu nowego „Dziś” (gałąź logowanie-h): pastylki z miękkim cieniem zamiast brzegu 3D, próba jako ciemny panel Stasia.
  ok(`${n}: logowanie: główny przycisk – pastylka z miękkim cieniem, czytelny`, lg.btn !== "none" && parseFloat(lg.btnR) >= 12 && cr(lg.btnCol, lg.btnBg) >= 4.5 /* Wygląd pro: promień 16 px, cień brzegu */, lg);
  ok(`${n}: logowanie: karta próby jako ciemny panel, przykładowa lekcja bez obrysu`, (!lg.trial || lg.trialBg === "rgb(19, 59, 42)") && lg.demo === "0px", lg);
  ok(`${n}: logowanie: przyciski-linki bez cienia`, lg.ghost === "none", lg.ghost);
  const tb = await p.locator("#loginBox [role=tab]").evaluateAll((ts) => ts.map((t) => { const c = getComputedStyle(t), bg = c.backgroundColor === "rgba(0, 0, 0, 0)" ? getComputedStyle(t.parentElement).backgroundColor : c.backgroundColor; return { r: c.borderTopLeftRadius, sel: t.getAttribute("aria-selected"), col: c.color, bg }; }));
  ok(`${n}: logowanie: zakładki „Kod z maila / Hasło” jako przełącznik w pastylce, czytelne`, tb.length === 2 && tb.every((t) => parseFloat(t.r) >= 22 && cr(t.col, t.bg) >= 4.5) && tb[0].bg !== tb[1].bg, tb);
  await p.evaluate(() => document.querySelectorAll("details.lg-konto").forEach((d) => { d.open = true; })); // logowanie zwinięte pod „Masz już konto?”
  const tw = await p.locator("#loginBox [role=tab]").evaluateAll((ts) => ts.map((t) => Math.round(t.getBoundingClientRect().width)));
  ok(`${n}: obie zakładki logowania równej szerokości`, tw.length === 2 && Math.abs(tw[0] - tw[1]) <= 2, tw);
  const th1 = await p.locator("#loginBox [role=tab]").evaluateAll((ts) => ts.map((t) => Math.round(t.getBoundingClientRect().height)));
  ok(`${n}: zakładki logowania w jednej linii`, th1.every((x) => x <= 50), th1);
  // Pętla UX-1 etap 1 (K4): logowanie ma ciemny wariant przy ciemnym motywie systemu (data-green="dark"), jasne w jasnym.
  ok(`${n}: logowanie jasne w jasnym, ciemne (#0F1A14) w ciemnym`, lg.bg === (/ciemny/.test(n) ? "rgb(15, 26, 20)" : "rgb(244, 245, 240)"), lg.bg);
  ok(`${n}: logowanie bez poziomego przewijania i błędów`, (await noH(p)) && p.errors.length === 0, p.errors);
  await p.close();
}
{ const p = await open(b, { konto: "brak", ls: { "skrot-calm": "1" } });
  const t = await p.evaluate(() => { const e = document.querySelector("#login .lg-demo-btn"), r = [...document.styleSheets].length; e.dispatchEvent(new PointerEvent("pointerdown")); return document.documentElement.classList.contains("calm"); });
  ok("logowanie: „Mniej animacji” działa też tu (html.calm)", t, t); await p.close(); }
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
