// Wygląd H2, etap 10: szlif – ikony gier SVG (zielone motywy; emoji w innych), mapa postępów 3D, karta „Na dziś”,
// „Teraz” bez zależności od motywu w chwili rysowania, pierścień „dziś” na jasnym, puste kafle Hasła.
// BASE=http://127.0.0.1:8801/ node docs/gry/test/h2-etap10.mjs
import { chromium, OUT, open, tester, fps, UID, A } from "./h2-lib.mjs";
const { ok, end } = tester();
const b = await chromium.launch();
const lum = (c) => { const srgb = /^color\(srgb/.test(c); const m = c.match(/\d+(\.\d+)?/g).map(Number).slice(0, 3).map((v) => { if (!srgb) v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]; };
const cr = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
for (const dark of [false, true]) {
  const n = dark ? "ciemny" : "jasny";
  let p = await open(b, { dark, hash: "/gry" });
  await p.screenshot({ path: `${OUT}/h2e10-${n}-gry.png`, fullPage: true });
  const svgs = await p.locator(".gry-tile-art").evaluateAll((es) => es.map((e) => !!e.querySelector("svg") && !/\p{Extended_Pictographic}/u.test(e.textContent)));
  ok(`${n}: ikony gier jako SVG (bez emoji)`, svgs.length >= 4 && svgs.every(Boolean), svgs);
  await p.close();
  p = await open(b, { dark, hash: "/review" });
  await p.screenshot({ path: `${OUT}/h2e10-${n}-powtorki.png`, fullPage: true });
  const mini = await p.locator(".gry-mini-b .ic").evaluateAll((es) => es.map((e) => !!e.querySelector("svg")));
  ok(`${n}: małe kafle gier w Powtórkach też z SVG`, mini.length >= 2 && mini.every(Boolean), mini);
  const sq = await p.locator(".pm-grid .pm-sq").first().evaluate((e) => { const c = getComputedStyle(e); return { bb: c.borderBottomWidth, w: e.getBoundingClientRect().width }; }).catch(() => null);
  // UX-4 W2: kwadrat mapy 28 px co 44 px (pole trafienia ≥ 44 px bez nakładania sąsiadów); wcześniej 24 px.
  ok(`${n}: mapa postępów – kwadraty 3D (28 px, dół 4 px)`, sq && sq.bb === "4px" && sq.w === 28, sq);
  const pm = await p.evaluate(() => { const q = (sel) => { const e = document.querySelector(sel); if (!e) return null; const c = getComputedStyle(e); return { w: Math.round(e.getBoundingClientRect().width), st: c.borderTopStyle, bi: c.backgroundImage }; };
    const leg = document.querySelector(".pm-legend"); const ls = leg ? [...leg.children].map((x) => Math.round(x.getBoundingClientRect().top)) : [];
    return { extra: q(".pm-sq.extra"), lk: q(".pm-sq.lk"), leg: q("i.pm-sq"), legRows: new Set(ls).size }; });
  ok(`${n}: mapa: „dodatkowe” mniejsze i przerywane, legenda drobna w jednym rzędzie, zablokowane kreskowane`, (!pm.extra || (pm.extra.w <= 18 && pm.extra.st === "dashed")) && (!pm.leg || pm.leg.w <= 16) && pm.legRows <= 1 && (!pm.lk || /gradient/.test(pm.lk.bi)), pm);
  const mc = await p.locator(".gry-mini-b .ic").evaluateAll((es) => es.map((e) => getComputedStyle(e).backgroundColor));
  ok(`${n}: małe kafle gier z kolorowym tłem ikony (≥ 2 kolory)`, new Set(mc).size >= 2, mc);
  await p.evaluate(() => { const x = document.createElement("section"); x.className = "hint"; x.innerHTML = '<span class="eyebrow">Na dziś</span><p>Test</p>'; document.querySelector("main").prepend(x); });
  const hint = await p.locator("main > .hint").first().evaluate((e) => { const c = getComputedStyle(e); return { bb: c.borderBottomWidth, bi: c.backgroundImage, col: getComputedStyle(e.querySelector("p")).color, bg: c.backgroundColor, ey: getComputedStyle(e.querySelector(".eyebrow")).color }; });
  ok(`${n}: karta „Na dziś” 3D bez gradientu, czytelna`, ["5px", "2px"].includes(hint.bb) && hint.bi === "none" && cr(hint.col, hint.bg) >= 4.5 && cr(hint.ey, hint.bg) >= 4.5, hint); /* Wygląd pro: płaska karta z brzegiem 2 px zamiast dołu 3D */
  ok(`${n}: Powtórki bez błędów`, p.errors.length === 0, p.errors);
  await p.close();
  p = await open(b, { dark, hash: "/calendar" });
  const ring = await p.locator(".day.today").first().evaluate((e) => [getComputedStyle(e, "::after").borderTopColor, getComputedStyle(e).backgroundColor]).catch(() => null);
  ok(`${n}: pierścień „dziś” odcina się od komórki (≥ 1,9:1)`, !ring || cr(ring[0], ring[1]) >= 1.9, ring);
  await p.close();
  p = await open(b, { dark, hash: "/haslo" });
  for (let i = 0; i < 40 && !(await p.locator(".hd-board").count()); i++) await p.waitForTimeout(100);
  const em = await p.locator(".hd-row:not(.cur) .hd-t:not(.s0):not(.s1):not(.s2)").first().evaluate((e) => [getComputedStyle(e).borderBottomColor, getComputedStyle(document.body).backgroundColor]).catch(() => null);
  ok(`${n}: puste kafle Hasła z widocznym dołem (≥ 1,3:1 do tła)`, !em || cr(em[0], em[1]) >= 1.3, em);
  await p.close();
}
for (const dark of [false, true]) { const p = await open(b, { dark, hash: "/more", konto: "platne" });
  const g = await p.locator(".more-tile .ico.h2g svg").count();
  ok(`${dark ? "ciemny" : "jasny"}: w Więcej gry mają te same kolorowe ikony co w #/gry`, g >= 2, g); await p.close(); }
{ // Teraz: zmiana motywu po narysowaniu ścieżki nie zostawia pigułki w innym motywie (i odwrotnie)
  const prog = JSON.stringify({ [UID]: { done: { A1: true } } });
  const p = await open(b, { hash: "/subject/" + A, ls: { "mock-progress": prog } });
  const vis = () => p.locator(".h2-now").evaluateAll((es) => es.map((e) => getComputedStyle(e).display));
  const v1 = await vis();
  await p.evaluate(() => document.documentElement.setAttribute("data-theme", "riwiera")); await p.waitForTimeout(50);
  const v2 = await vis();
  ok("„Teraz” widać w zielonym, a po przełączeniu na inny motyw znika bez przerysowania", v1.length === 1 && v1[0] !== "none" && v2[0] === "none", { v1, v2 });
  await p.close();
}
for (const th of ["riwiera", "pink"]) {
  const p = await open(b, { theme: th, hash: "/gry" });
  const e = await p.locator(".gry-tile-art").first().evaluate((x) => [!!x.querySelector("svg"), x.textContent]);
  ok(`motyw ${th}: ikony gier jako emoji (bez zmian)`, !e[0] && e[1].length > 0, e);
  await p.close();
}
const f = await open(b, { hash: "/review" });
const v = await fps(f, async () => { await f.mouse.wheel(0, 1200); await f.waitForTimeout(300); await f.evaluate(() => { location.hash = "#/gry"; }); await f.waitForTimeout(600); });
console.log("   fps przy CPU 4×:", v);
ok("płynność: ≥ 45 fps przy CPU 4×", v >= 45, v);
await f.close();
await b.close();
end();
