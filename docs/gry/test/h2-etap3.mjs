// Wygląd H2, etap 3: nawigacja (zakładki, plakietki) i nagłówek (pasek, poziom, monety, seria).
// BASE=http://127.0.0.1:8801/ node docs/gry/test/h2-etap3.mjs
import { chromium, OUT, open, tester, fps } from "./h2-lib.mjs";
const { ok, end } = tester();
const b = await chromium.launch();
const lum = (c) => { const m = c.match(/\d+(\.\d+)?/g).map(Number).slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]; };
const cr = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
for (const dark of [false, true]) for (const [w, hh] of [[375, 812], [1280, 900]]) {
  const n = `${dark ? "ciemny" : "jasny"}-${w}`;
  const p = await open(b, { dark, w, h: hh });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${OUT}/h2e3-${n}.png` });
  ok(`${n}: moneta i płomień jako SVG (bez emoji)`, await p.locator(".greet .h2-coin svg").count() === 1 && await p.locator(".greet .h2-flame svg").count() === 1 && !/🪙|🔥/.test(await p.locator(".greet").innerText()), await p.locator(".greet").innerText());
  const chip = await p.locator(".greet .xp-chip").first().evaluate((e) => { const c = getComputedStyle(e); return [c.color, c.backgroundColor, c.boxShadow]; });
  ok(`${n}: pigułki statystyk 3D i czytelne`, /px/.test(chip[2]) && cr(chip[0], chip[1]) >= 4.5, chip);
  ok(`${n}: na starcie żadna zakładka nie podskakuje`, await p.locator(".navbtn.h-bump").count() === 0, "");
  await p.locator('.navbtn[data-key="terms"]').click(); await p.waitForTimeout(250);
  ok(`${n}: po zmianie zakładki nowa ikona podskakuje`, await p.locator('.navbtn.h-bump[data-key="terms"]').count() === 1, "");
  await p.evaluate(() => window.dispatchEvent(new Event("resize"))); await p.locator("main").click({ position: { x: 5, y: 5 } }).catch(() => {});
  await p.waitForTimeout(800);
  // kolejny render na tej samej zakładce (np. odświeżenie): bez podskoku
  await p.evaluate(() => { location.hash = "#/terms"; }); await p.waitForTimeout(300);
  const act = await p.locator('.navbtn[aria-current="page"]').evaluate((e) => { const c = getComputedStyle(e), l = e.querySelector(".lbl"); const lc = l ? getComputedStyle(l).color : c.color; return [lc, getComputedStyle(document.querySelector(".nav")).backgroundColor === "rgba(0, 0, 0, 0)" ? getComputedStyle(document.body).backgroundColor : getComputedStyle(document.querySelector(".nav")).backgroundColor]; });
  ok(`${n}: podpis aktywnej zakładki czytelny`, cr(act[0], act[1]) >= 4.5, act);
  ok(`${n}: bez błędów w konsoli`, p.errors.length === 0, p.errors);
  await p.close();
}
{ // ponowny render na tej samej zakładce nie powtarza podskoku
  const p = await open(b);
  await p.locator('.navbtn[data-key="review"]').click(); await p.waitForTimeout(800);
  await p.locator('.navbtn[data-key="review"]').click(); await p.waitForTimeout(300); // ta sama zakładka: render bez zmiany
  const again = await p.evaluate(() => [...document.querySelectorAll(".navbtn.h-bump")].map((e) => e.dataset.key));
  ok("kolejny render tej samej zakładki: bez podskoku", again.length === 0, again);
  await p.close();
}
for (const th of ["riwiera", "pink"]) {
  const p = await open(b, { theme: th });
  ok(`motyw ${th}: zostają emoji (bez ikon H2)`, await p.locator(".greet .h2-ico").count() === 0, "");
  await p.close();
}
const f = await open(b);
const v = await fps(f, async () => { for (const k of ["materials", "review", "terms", "calendar", "home"]) { await f.locator(`.navbtn[data-key="${k}"]`).click(); await f.waitForTimeout(250); } });
console.log("   fps przy CPU 4× (przełączanie 5 zakładek):", v);
ok("płynność przy przełączaniu zakładek: ≥ 45 fps przy CPU 4×", v >= 45, v);
await f.close();
await b.close();
end();
