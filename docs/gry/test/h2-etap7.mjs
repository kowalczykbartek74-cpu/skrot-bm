// Wygląd H2, etap 7: Terminy (karta „Najbliższe”, wiersze, filtry) i Kalendarz (dni jako klawisze, dziś, karty zaliczeń).
// BASE=http://127.0.0.1:8801/ node docs/gry/test/h2-etap7.mjs
import { chromium, OUT, open, tester, fps } from "./h2-lib.mjs";
const { ok, end } = tester();
const b = await chromium.launch();
const lum = (c) => { const m = c.match(/\d+(\.\d+)?/g).map(Number).slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]; };
const cr = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
for (const dark of [false, true]) for (const [w, hh] of [[375, 812], [1280, 900]]) {
  const n = `${dark ? "ciemny" : "jasny"}-${w}`;
  const p = await open(b, { dark, w, h: hh, hash: "/terms" });
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${OUT}/h2e7-${n}-terminy.png`, fullPage: true });
  const hero = await p.locator(".th-hero").first().evaluate((e) => { const c = getComputedStyle(e), big = e.querySelector(".th-big"), bc = getComputedStyle(big), t = e.querySelector(".th-hero-title"); return { bb: c.borderBottomWidth, r: bc.borderTopLeftRadius, bigCol: bc.color, bigBg: bc.backgroundColor, tCol: getComputedStyle(t).color, bg: c.backgroundColor }; }).catch(() => null);
  ok(`${n}: karta „Najbliższe” 3D, licznik dni w kółku, czytelna`, hero && ["6px", "2px"].includes(hero.bb) && hero.r === "50%" && cr(hero.bigCol, hero.bigBg) >= 4.5 && cr(hero.tCol, hero.bg) >= 4.5, hero); /* Wygląd pro: płaska karta z brzegiem 2 px zamiast dołu 3D */
  const term = await p.locator(".tl-list .tl").first().evaluate((e) => { const c = getComputedStyle(e), t = e.querySelector(".tl-t") || e; return { bb: c.borderBottomWidth, stripe: /inset/.test(c.boxShadow) && /6px 0px 0px/.test(c.boxShadow), col: getComputedStyle(t).color, bg: c.backgroundColor }; }).catch(() => null);
  ok(`${n}: wiersze terminów 3D z płaskim paskiem koloru (inset), czytelne`, term && ((term.bb === "4px" && term.stripe) || term.bb === "2px") && cr(term.col, term.bg) >= 4.5 /* Wygląd pro: płaski wiersz */, term);
  const chip = await p.locator('.tchip[aria-pressed="true"]').first().evaluate((e) => { const c = getComputedStyle(e); return { bb: c.borderBottomWidth, col: c.color, bg: c.backgroundColor }; }).catch(() => null);
  ok(`${n}: wybrany filtr 3D i czytelny`, chip && chip.bb === "4px" && cr(chip.col, chip.bg) >= 4.5, chip);
  const meta = await p.locator(".tl-meta").first().evaluate((e) => [...e.children].map((c) => getComputedStyle(c, "::after").content)).catch(() => []);
  ok(`${n}: meta-linia terminu bez kropek-separatorów (nie wiszą przy zawijaniu)`, meta.every((c) => c === "none" || c === "normal"), meta);
  const gap = await p.locator(".tl-list .tl").first().evaluate((e) => { const m = e.querySelector(".tl-main"), r = e.getBoundingClientRect(), t = m.getBoundingClientRect(); return Math.round(t.left - r.left); }).catch(() => 99);
  ok(`${n}: wiersz terminu bez pustej kolumny przed tytułem (≤ 24 px)`, gap <= 24, gap);
  ok(`${n}: Terminy bez poziomego przewijania`, await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "");
  await p.evaluate(() => { location.hash = "#/calendar"; }); await p.waitForTimeout(1800);
  await p.screenshot({ path: `${OUT}/h2e7-${n}-kalendarz.png`, fullPage: true });
  const day = await p.locator(".cal .day").first().evaluate((e) => getComputedStyle(e).borderBottomWidth).catch(() => "brak");
  const today = await p.locator(".day.today").first().evaluate((e) => { const c = getComputedStyle(e), a = getComputedStyle(e, "::after"), d = e.querySelector(".dn") || e; return { anim: a.animationName, shadow: c.boxShadow, col: getComputedStyle(d).color, bg: c.backgroundColor }; }).catch(() => null);
  ok(`${n}: dni kalendarza jako klawisze 3D (dół ${w < 421 ? 3 : 4} px)`, day === (w < 421 ? "3px" : "4px") || day === "brak", day);
  ok(`${n}: dziś wyróżnione (pulsuje kilka razy) i czytelne`, !today || (today.anim === "h-today" && cr(today.col, today.bg) >= 4.5), today);
  const ex = await p.locator(".exam-card").first().evaluate((e) => getComputedStyle(e).borderBottomWidth).catch(() => "brak");
  ok(`${n}: karty zaliczeń 3D`, ex === "5px" || ex === "brak", ex);
  ok(`${n}: Kalendarz bez poziomego przewijania`, await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "");
  ok(`${n}: bez błędów w konsoli`, p.errors.length === 0, p.errors);
  await p.close();
}
for (const th of ["riwiera", "pink"]) {
  const p = await open(b, { theme: th, hash: "/terms" });
  const bb = await p.locator(".tl-list .tl").first().evaluate((e) => getComputedStyle(e).borderBottomWidth).catch(() => "brak");
  ok(`motyw ${th}: wiersze terminów bez stylu H2`, bb !== "4px", bb);
  await p.close();
}
const f = await open(b, { hash: "/terms" });
const v = await fps(f, async () => { await f.mouse.wheel(0, 1500); await f.waitForTimeout(400); await f.evaluate(() => { location.hash = "#/calendar"; }); await f.waitForTimeout(600); await f.mouse.wheel(0, 800); });
console.log("   fps przy CPU 4× (Terminy → Kalendarz):", v);
ok("płynność: ≥ 45 fps przy CPU 4×", v >= 45, v);
await f.close();
await b.close();
end();
