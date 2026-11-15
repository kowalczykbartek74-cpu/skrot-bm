// Wygląd H2, etap 1: paleta jasnego i ciemnego zielonego, wejście ekranu raz, inne motywy bez zmian, płynność.
// BASE=http://127.0.0.1:8801/ node docs/gry/test/h2-etap1.mjs
import { chromium, OUT, open, tester, fps } from "./h2-lib.mjs";
const { ok, end } = tester();
const b = await chromium.launch();
const css = (p, sel, prop) => p.locator(sel).first().evaluate((e, prop) => getComputedStyle(e)[prop], prop);
const lum = (c) => { const m = c.match(/\d+(\.\d+)?/g).map(Number).slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]; };
const cr = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
for (const dark of [false, true]) {
  const n = dark ? "ciemny" : "jasny";
  const p = await open(b, { dark, wait: 0 });
  await p.locator("main .ld-block").waitFor({ timeout: 15000 }); await p.waitForTimeout(150);
  ok(`${n}: pierwsze wejście animuje ekran (h-ent, także po dociągnięciu danych)`, await p.locator("main.h-ent").count() === 1, "");
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `${OUT}/h2e1-${n}-375.png`, fullPage: true });
  const bg = await css(p, "body", "backgroundColor"), ink = await css(p, "body", "color");
  ok(`${n}: tło strony z palety (${dark ? "#0F1A14" : "#F7F8F4"})`, bg === (dark ? "rgb(15, 26, 20)" : "rgb(247, 248, 244)"), bg);
  ok(`${n}: tekst na tle ≥ 7:1`, cr(bg, ink) >= 7, [bg, ink, cr(bg, ink).toFixed(1)]);
  const mut = await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--muted").trim());
  ok(`${n}: tekst drugorzędny ≥ 4.5:1 na karcie`, cr(await p.evaluate(() => { const d = document.createElement("i"); d.style.color = "var(--surface)"; document.body.append(d); const c = getComputedStyle(d).color; d.remove(); return c; }), await p.evaluate((m) => { const d = document.createElement("i"); d.style.color = m; document.body.append(d); const c = getComputedStyle(d).color; d.remove(); return c; }, mut)) >= 4.5, mut);
  await p.waitForTimeout(500); // po oknie 1,4 s
  await p.locator(".zh-hero").getByRole("button", { name: /Mam więcej czasu/ }).click(); await p.waitForTimeout(200);
  ok(`${n}: kolejny render (kliknięcie) nic nie animuje`, await p.locator("main.h-ent").count() === 0, "");
  await p.evaluate(() => { location.hash = "#/terms"; }); await p.waitForTimeout(300);
  ok(`${n}: przejście na inny ekran znowu animuje raz`, await p.locator("main.h-ent").count() === 1, await p.evaluate(() => location.hash));
  ok(`${n}: bez błędów w konsoli`, p.errors.length === 0, p.errors);
  await p.close();
}
for (const th of ["riwiera", "pink", "noc"]) {
  const p = await open(b, { theme: th });
  ok(`motyw ${th}: bez zmian (brak zmiennych H2 i animacji wejścia)`, await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--h-paper").trim() === "" && !document.querySelector("main.h-ent")), "");
  await p.close();
}
const f = await open(b, { wait: 0 });
const v = await fps(f, async () => { await f.locator("main .ld-block").waitFor({ timeout: 15000 }); await f.mouse.wheel(0, 900); await f.waitForTimeout(400); await f.mouse.wheel(0, -900); });
console.log("   fps przy CPU 4× (wejście + przewijanie):", v);
ok("płynność: ≥ 45 fps przy procesorze spowolnionym 4×", v >= 45, v);
await f.close();
await b.close();
end();
