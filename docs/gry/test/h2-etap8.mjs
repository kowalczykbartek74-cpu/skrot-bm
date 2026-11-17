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
  const gh = await p.evaluate(() => Math.round(document.querySelector(".gry-tiles").getBoundingClientRect().height));
  ok(`${n}: kafle gier na telefonie zwarte (≤ 820 px wysokości razem)`, gh <= 820, gh);
  const big = await p.locator(".gry-tile .gry-tile-art").first().evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
  ok(`${n}: ikona gry duża (≥ 26 px)`, big >= 26, big);
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
  await p.keyboard.press("A"); await p.waitForTimeout(40); await p.keyboard.press("B"); await p.waitForTimeout(40);
  const pop = await p.locator(".hd-row.cur .hd-t.fill").evaluateAll((es) => es.map((e) => getComputedStyle(e).animationName));
  ok(`${n}: wpisana litera wskakuje (h-tpop)`, pop[1] === "h-tpop", pop);
  await p.evaluate(() => { location.hash = "#/gry"; }); await p.waitForTimeout(500); await p.evaluate(() => { location.hash = "#/haslo"; }); await p.waitForTimeout(900);
  const pop2 = await p.locator(".hd-row.cur .hd-t.fill").evaluateAll((es) => es.map((e) => getComputedStyle(e).animationName));
  ok(`${n}: po ponownym rysowaniu zapisane litery nie wskakują wszystkie naraz`, pop2.length >= 1 && pop2.every((a) => a !== "h-tpop"), pop2);
  const fit = await p.evaluate(() => { const kb = document.querySelector(".hd-kb").getBoundingClientRect(), nav = [...document.querySelectorAll("nav")].find((e) => getComputedStyle(e).position === "fixed")?.getBoundingClientRect().top ?? innerHeight; return Math.round(nav - kb.bottom); });
  ok(`${n}: plansza i klawiatura mieszczą się nad dolnym paskiem (375 × 812)`, fit >= 0, fit);
  ok(`${n}: Hasło bez błędów w konsoli`, p.errors.length === 0, p.errors);
  await p.close();
  // Ranking
  p = await open(b, { dark, hash: "/ranking" });
  // UX-5 (etap G4): domyślna zakładka to „Grupy”; wiersze listy są w zakładce „Ten tydzień”.
  if (await p.locator(".ux5-rk-tab", { hasText: "Ten tydzień" }).count()) { await p.locator(".ux5-rk-tab", { hasText: "Ten tydzień" }).click(); await p.waitForTimeout(2000); }
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
  const wk = await p.locator(".shop-mission.week").first().evaluate((e) => { const bg = getComputedStyle(e).backgroundColor, pick = (q) => { const x = e.querySelector(q); if (!x) return null; const c = getComputedStyle(x); return { col: c.color, bg: c.backgroundColor === "rgba(0, 0, 0, 0)" ? bg : c.backgroundColor }; };
    const tr = e.querySelector(".lp-lvbar"); return { ey: pick(".eyebrow"), btn: pick(".btn"), num: pick(".num"), track: tr && getComputedStyle(tr).backgroundColor, bg }; }).catch(() => null);
  ok(`${n}: zadanie tygodnia czytelne (nagłówek, liczby, przycisk), jasny tor paska`, !wk || ([wk.ey, wk.num, wk.btn].every((x) => !x || cr(x.col, x.bg) >= 4.5) && !/^rgb\(0, 0, 0/.test(wk.track || "")), wk);
  const cols = await p.locator(".kshop-grid, .shop-grid").first().evaluate((e) => getComputedStyle(e).gridTemplateColumns.split(" ").length).catch(() => 0);
  ok(`${n}: sklep na telefonie w 2 kolumnach`, cols === 2, cols);
  const fl = await p.evaluate(async () => { document.querySelector(".shop-grid .shop-card, .kshop-grid .kcard")?.scrollIntoView(); const el = document.querySelector(".kshop-grid .kcard, .shop-grid .shop-card"); document.querySelector("main").classList.add("h-ent"); el.classList.add("flash"); await new Promise((r) => setTimeout(r, 400)); const c = getComputedStyle(el); return { sh: c.boxShadow, an: c.animationName }; });
  ok(`${n}: wskazana karta sklepu ma pierścień i własny podskok (także w trakcie wejścia ekranu)`, /(4|3\.9\d*)px/.test(fl.sh) && fl.an === "h-flash", fl);
  ok(`${n}: Sklep bez poziomego przewijania`, await noHScroll(p), "");
  ok(`${n}: Sklep bez błędów w konsoli`, p.errors.length === 0, p.errors);
  await p.close();
}
{ const p = await open(b, { hash: "/shop", ls: { "skrot-calm": "1" } });
  const fl = await p.evaluate(async () => { const el = document.querySelector(".kshop-grid .kcard, .shop-grid .shop-card"); el.classList.add("flash"); await new Promise((r) => setTimeout(r, 400)); return getComputedStyle(el).boxShadow; });
  ok("Mniej animacji: wskazana karta nadal wyróżniona pierścieniem", /4px/.test(fl), fl); await p.close(); }
for (const dark of [false, true]) { // wąski telefon 360 px: karty sklepu i kafle gier zwarte
  const n = (dark ? "ciemny" : "jasny") + "-360";
  let p = await open(b, { dark, w: 360, h: 740, hash: "/shop" });
  await p.screenshot({ path: `${OUT}/h2e8-${n}-sklep.png`, fullPage: true });
  const cards = await p.locator(".shop-grid .shop-card").evaluateAll((cs) => cs.map((c) => Math.round(c.getBoundingClientRect().height)));
  ok(`${n}: karty motywów ≤ 330 px wysokości`, cards.length && cards.every((x) => x <= 330), cards);
  ok(`${n}: podgląd motywu po kliknięciu obrazka (przycisk z nazwą)`, await p.locator(".shop-sw-btn[aria-label^='Podgląd']").count() >= 1, "");
  const btnCut = await p.locator(".shop-act .btn:visible").evaluateAll((bs) => bs.filter((x) => x.scrollWidth > x.clientWidth + 1).length);
  ok(`${n}: napisy na przyciskach sklepu się mieszczą`, btnCut === 0, btnCut);
  ok(`${n}: Sklep bez poziomego przewijania`, await noHScroll(p), "");
  await p.close();
  p = await open(b, { dark, w: 360, h: 740, hash: "/gry" });
  await p.screenshot({ path: `${OUT}/h2e8-${n}-gry.png`, fullPage: true });
  const tx = await p.locator(".gry-tile > p.muted").evaluateAll((ps) => ps.map((x) => Math.round(x.getBoundingClientRect().width)));
  ok(`${n}: opis gry ma szeroką kolumnę (≥ 230 px)`, tx.length && tx.every((w) => w >= 230), tx);
  const th = await p.locator(".gry-tile").evaluateAll((ts) => ts.map((t) => Math.round(t.getBoundingClientRect().height)));
  ok(`${n}: kafle gier ≤ 170 px`, th.every((x) => x <= 170), th);
  ok(`${n}: bez błędów w konsoli`, p.errors.length === 0, p.errors);
  await p.close();
}
for (const konto of ["platne", "darmowe"]) { // zwykły uczeń (nie starosta): monety, poziomy, notki
  const n = `${konto}-360`;
  const p = await open(b, { konto, w: 360, h: 740, hash: "/shop" });
  await p.screenshot({ path: `${OUT}/h2e8-${n}-sklep.png`, fullPage: true });
  const c = await p.locator(".shop-grid .shop-card").evaluateAll((cs) => cs.map((x) => { const bt = [...x.querySelectorAll(".shop-act .btn")].filter((e) => e.offsetParent), sm = x.querySelector(".shop-note");
    return { h: Math.round(x.getBoundingClientRect().height), btns: bt.length, btnH: bt.map((e) => Math.round(e.getBoundingClientRect().height)), cut: sm ? sm.scrollHeight > sm.clientHeight + 1 : false, note: sm?.innerText }; }));
  ok(`${n}: każda karta motywu ma dokładnie jeden widoczny przycisk`, c.length && c.every((x) => x.btns === 1), c);
  ok(`${n}: przyciski w jednej linii (≤ 48 px)`, c.every((x) => x.btnH.every((v) => v <= 48)), c.map((x) => x.btnH));
  ok(`${n}: notki nie ucięte (widać, ile XP brakuje)`, c.every((x) => !x.cut), c.map((x) => x.note));
  ok(`${n}: karty ≤ 330 px`, c.every((x) => x.h <= 330), c.map((x) => x.h));
  for (let i = 0; i < 80; i++) { await p.keyboard.press("Tab"); if (await p.evaluate(() => document.activeElement?.classList.contains("shop-sw-btn"))) break; }
  const fr = await p.evaluate(() => { const e = document.activeElement; if (!e?.classList.contains("shop-sw-btn")) return null; const a = getComputedStyle(e, "::after"), r = e.getBoundingClientRect(); return { bw: /3px/.test(a.boxShadow) && /6px/.test(a.boxShadow) ? "ok" : a.boxShadow, z: a.zIndex, bottom: Math.round(r.bottom), nav: Math.round([...document.querySelectorAll("nav")].find((x) => getComputedStyle(x).position === "fixed")?.getBoundingClientRect().top ?? innerHeight) }; });
  ok(`${n}: obrazek-podgląd osiągalny Tabem, z widocznym obrysem nad obrazkiem, nie pod dolnym paskiem`, fr && fr.bw === "ok" && +fr.z >= 2 && fr.bottom <= fr.nav, fr);
  ok(`${n}: bez błędów w konsoli`, p.errors.length === 0, p.errors);
  await p.close();
}
{ const p = await open(b, { konto: "platne", w: 1280, h: 900, hash: "/shop" });
  const t = await p.locator(".shop-sw-btn").first().getAttribute("tabindex");
  ok("komputer: obrazek bez drugiego przystanku Taba (jest przycisk „Podgląd”)", t === "-1" && await p.locator(".shop-pv:visible").count() >= 1, t);
  ok("komputer: przycisk „🔒 Poziom” ukryty (jest długa notka)", await p.locator(".shop-lockbtn:visible").count() === 0, "");
  await p.setViewportSize({ width: 375, height: 812 }); await p.waitForTimeout(200);
  const t2 = await p.locator(".shop-sw-btn").first().getAttribute("tabindex");
  ok("po zwężeniu okna do telefonu obrazek wraca do kolejki Taba", t2 === null, t2);
  await p.close(); }
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
