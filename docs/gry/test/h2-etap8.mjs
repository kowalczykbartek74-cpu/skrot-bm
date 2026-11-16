// Wygląd H2, etap 8: Gry (kafle, ikony 3D), Hasło dnia (kafle i klawisze 3D, daltonizm bez zmian), ranking (karty, medale), sklep (karty 3D).
// BASE=http://127.0.0.1:8801/ node docs/gry/test/h2-etap8.mjs
import { chromium, OUT, open, tester, fps } from "./h2-lib.mjs";
const { ok, end } = tester();
const b = await chromium.launch();
const lum = (c) => { const srgb = /^color\(srgb/.test(c); const m = c.match(/\d+(\.\d+)?/g).map(Number).slice(0, 3).map((v) => { if (!srgb) v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]; };
const cr = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
const wzor = (slowo, proba) => { const w = Array(slowo.length).fill(0), z = []; for (let i = 0; i < slowo.length; i++) { if (proba[i] === slowo[i]) w[i] = 2; else z.push(slowo[i]); }
  for (let i = 0; i < slowo.length; i++) if (!w[i]) { const j = z.indexOf(proba[i]); if (j >= 0) { w[i] = 1; z.splice(j, 1); } } return w.join(""); };
const stan = (proby, slowo = "REVENUE") => JSON.stringify({ dzien: "2026-11-06", proby, wzory: proby.map((x) => wzor(slowo, x)), wynik: null, pkt: 0 });
const HLS = { "mock-haslo-nr": "12", "mock-haslo-seria": "2", "mock-haslo-stat": "1", "mock-haslo-stan": stan(["QQQQQQQ", "EEEEEEE", "EEXXXXX"]) };
const noHScroll = (p) => p.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
for (const dark of [false, true]) {
  const n = dark ? "ciemny" : "jasny";
  // Gry
  let p = await open(b, { dark, hash: "/gry" });
  await p.screenshot({ path: `${OUT}/h2e8-${n}-gry.png`, fullPage: true });
  const art = await p.locator(".gry-tile .gry-tile-art").evaluateAll((es) => es.map((e) => { const c = getComputedStyle(e); return { bb: c.borderBottomWidth, bg: c.backgroundColor }; }));
  ok(`${n}: ikony gier jako klocki 3D (dół 5 px) w różnych kolorach`, art.length >= 2 && art.every((a) => a.bb === "5px") && new Set(art.map((a) => a.bg)).size >= 2, art);
  const tile = await p.locator(".gry-tile").first().evaluate((e) => { const c = getComputedStyle(e), h = e.querySelector("h2"); return { bb: c.borderBottomWidth, col: getComputedStyle(h).color, bg: c.backgroundColor }; });
  ok(`${n}: kafel gry 3D, nazwa czytelna`, tile.bb === "5px" && cr(tile.col, tile.bg) >= 4.5, tile);
  ok(`${n}: Gry bez poziomego przewijania`, await noHScroll(p), "");
  ok(`${n}: Gry bez błędów w konsoli`, p.errors.length === 0, p.errors);
  await p.close();
  // Hasło dnia
  p = await open(b, { dark, hash: "/haslo", ls: HLS });
  for (let i = 0; i < 40 && !(await p.locator(".hd-board").count()); i++) await p.waitForTimeout(100);
  await p.screenshot({ path: `${OUT}/h2e8-${n}-haslo.png` });
  const st = await p.evaluate(() => Object.fromEntries(["s0", "s1", "s2"].map((c) => { const e = document.querySelector(".hd-t." + c), t = getComputedStyle(e); return [c, { s: t.borderTopStyle, w: parseFloat(t.borderTopWidth), bb: parseFloat(t.borderBottomWidth), col: t.color, bg: t.backgroundColor }]; })));
  ok(`${n}: daltonizm zachowany (1 przerywana, 2 ciągła ≥ 3 px, 0 ciągła cienka)`, st.s1.s === "dashed" && st.s2.s === "solid" && st.s2.w >= 3 && st.s0.s === "solid" && st.s1.w < st.s2.w, st);
  ok(`${n}: kafle planszy 3D (dół ≥ 5 px)`, ["s0", "s1", "s2"].every((k) => st[k].bb >= 5), st);
  ok(`${n}: litery na kaflach stanu 1 i 2 czytelne`, cr(st.s1.col, st.s1.bg) >= 4.5 && cr(st.s2.col, st.s2.bg) >= 4.5, st);
  const keys = await p.locator(".hd-k").evaluateAll((ks) => ks.map((k) => { const r = k.getBoundingClientRect(), c = getComputedStyle(k); return { w: r.width, h: r.height, bb: c.borderBottomWidth }; }));
  ok(`${n}: klawisze 3D (dół 4 px), nie mniejsze niż 30 × 44 px`, keys.length > 20 && keys.every((k) => k.bb === "4px" && k.w >= 30 && k.h >= 44), keys.slice(0, 3));
  await p.keyboard.press("A"); await p.waitForTimeout(40);
  const pop = await p.locator(".hd-row.cur .hd-t.fill").first().evaluate((e) => getComputedStyle(e).animationName).catch(() => "brak");
  ok(`${n}: wpisana litera wskakuje (h-tpop)`, pop === "h-tpop", pop);
  const fit = await p.evaluate(() => { const kb = document.querySelector(".hd-kb").getBoundingClientRect(), nav = [...document.querySelectorAll("nav")].find((e) => getComputedStyle(e).position === "fixed")?.getBoundingClientRect().top ?? innerHeight; return Math.round(nav - kb.bottom); });
  ok(`${n}: plansza i klawiatura mieszczą się nad dolnym paskiem (375 × 812)`, fit >= 0, fit);
  ok(`${n}: Hasło bez błędów w konsoli`, p.errors.length === 0, p.errors);
  await p.close();
  // Ranking
  p = await open(b, { dark, hash: "/ranking" });
  await p.screenshot({ path: `${OUT}/h2e8-${n}-ranking.png`, fullPage: true });
  const rows = await p.locator(".rk-list .rk-row").evaluateAll((rs) => rs.map((r) => { const c = getComputedStyle(r), pos = r.querySelector(".rk-pos"), pc = pos && getComputedStyle(pos); return { me: r.classList.contains("me"), bb: c.borderBottomWidth, col: c.color, bg: c.backgroundColor, pcol: pc?.color, pbg: pc?.backgroundColor, m: pos?.className }; }));
  if (rows.length) {
    ok(`${n}: wiersze rankingu jako karty 3D, czytelne`, rows.every((r) => r.bb === "4px" && cr(r.col, r.bg) >= 4.5), rows.slice(0, 2));
    const med = rows.filter((r) => /m[123]/.test(r.m));
    ok(`${n}: podium jako medale z czytelnym numerem`, med.every((r) => cr(r.pcol, r.pbg) >= 4.5), med);
  } else ok(`${n}: ranking ma wiersze`, false, await p.locator("main").innerText());
  ok(`${n}: Ranking bez poziomego przewijania`, await noHScroll(p), "");
  ok(`${n}: Ranking bez błędów w konsoli`, p.errors.length === 0, p.errors);
  await p.close();
  // Sklep
  p = await open(b, { dark, hash: "/shop" });
  await p.screenshot({ path: `${OUT}/h2e8-${n}-sklep.png`, fullPage: true });
  const kc = await p.locator(".kcard, .shop-card").first().evaluate((e) => getComputedStyle(e).borderBottomWidth).catch(() => "brak");
  ok(`${n}: karty sklepu 3D (dół 5 px)`, kc === "5px", kc);
  const tab = await p.locator('.kshop-tab[aria-selected="true"]').first().evaluate((e) => { const c = getComputedStyle(e); return { bb: c.borderBottomWidth, col: c.color, bg: c.backgroundColor, h: e.getBoundingClientRect().height }; }).catch(() => null);
  ok(`${n}: wybrana zakładka sklepu 3D, czytelna, ≥ 44 px`, !tab || (tab.bb === "4px" && cr(tab.col, tab.bg) >= 4.5 && tab.h >= 44), tab);
  const ms = await p.locator(".shop-mission").evaluateAll((es) => es.map((e) => { const c = getComputedStyle(e), b = e.querySelector("b") || e; return { bb: c.borderBottomWidth, col: getComputedStyle(b).color, bg: c.backgroundColor }; }));
  ok(`${n}: zadania w sklepie 3D i czytelne`, ms.every((m) => m.bb === "5px" && cr(m.col, m.bg) >= 4.5), ms);
  ok(`${n}: Sklep bez poziomego przewijania`, await noHScroll(p), "");
  ok(`${n}: Sklep bez błędów w konsoli`, p.errors.length === 0, p.errors);
  await p.close();
}
for (const th of ["riwiera", "pink"]) {
  const p = await open(b, { theme: th, hash: "/haslo", ls: HLS });
  for (let i = 0; i < 40 && !(await p.locator(".hd-board").count()); i++) await p.waitForTimeout(100);
  const bb = await p.locator(".hd-k").first().evaluate((e) => getComputedStyle(e).borderBottomWidth).catch(() => "brak");
  ok(`motyw ${th}: klawisze Hasła bez stylu H2`, bb !== "4px", bb);
  await p.close();
}
const f = await open(b, { hash: "/gry" });
const v = await fps(f, async () => { await f.mouse.wheel(0, 900); await f.waitForTimeout(300); await f.evaluate(() => { location.hash = "#/shop"; }); await f.waitForTimeout(600); await f.mouse.wheel(0, 900); });
console.log("   fps przy CPU 4× (Gry → Sklep):", v);
ok("płynność: ≥ 45 fps przy CPU 4×", v >= 45, v);
await f.close();
await b.close();
end();
