// Wygląd H2, etap 6: Przedmioty (kafle-kursy 3D) i kurs przedmiotu (ścieżka przystanków falą, Staś przy następnym).
// BASE=http://127.0.0.1:8801/ node docs/gry/test/h2-etap6.mjs
import { chromium, OUT, open, tester, fps, UID, A } from "./h2-lib.mjs";
const { ok, end } = tester();
const b = await chromium.launch();
const lum = (c) => { const m = c.match(/\d+(\.\d+)?/g).map(Number).slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]; };
const cr = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
// Pierwsza lekcja analizy zrobiona: na ścieżce jeden przystanek „done”, następny „now”.
const prog = JSON.stringify({ [UID]: { done: { A1: true } } });
for (const dark of [false, true]) {
  const n = dark ? "ciemny" : "jasny";
  const p = await open(b, { dark, hash: "/materials", ls: { "mock-progress": prog } });
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${OUT}/h2e6-${n}-przedmioty.png`, fullPage: true });
  const nb = await p.locator("main .grid .nb").first().evaluate((e) => { const c = getComputedStyle(e), h = e.querySelector("h3"); return { bb: c.borderBottomWidth, r: c.borderTopLeftRadius, col: h && getComputedStyle(h).color, bg: c.backgroundColor }; });
  ok(`${n}: kafel przedmiotu jako karta 3D (dół 6 px, promień 22 px), nazwa czytelna`, nb.bb === "6px" && nb.r === "22px" && cr(nb.col, nb.bg) >= 4.5, nb);
  await p.evaluate((A) => { location.hash = "#/subject/" + A; }, A); await p.waitForTimeout(2200);
  await p.screenshot({ path: `${OUT}/h2e6-${n}-przedmiot.png`, fullPage: true });
  const nodes = await p.locator(".sk-course .sk-node").evaluateAll((ns) => ns.map((x) => { const d = x.querySelector(".sk-dot"), c = getComputedStyle(d); return { cls: x.className, left: Math.round(d.getBoundingClientRect().left), w: d.getBoundingClientRect().width, bb: c.borderBottomWidth, bg: c.backgroundColor, col: c.color, stas: getComputedStyle(d, "::after").backgroundImage.slice(0, 22) }; }));
  ok(`${n}: kurs ma przystanki`, nodes.length >= 2, nodes.length);
  ok(`${n}: przystanki 3D (64 px, dół 7 px)`, nodes.every((x) => x.w === 64 && x.bb === "7px"), nodes);
  ok(`${n}: przystanki ułożone falą (różne przesunięcia)`, new Set(nodes.map((x) => x.left)).size >= 2, nodes.map((x) => x.left));
  const done = nodes.find((x) => /done/.test(x.cls)), now = nodes.find((x) => /now/.test(x.cls));
  ok(`${n}: zrobiony przystanek zielony, czytelny znak`, done && cr(done.col, done.bg) >= 3, done);
  ok(`${n}: następny przystanek limonkowy ze Stasiem`, now && now.bg === "rgb(205, 242, 94)" && /data:image\/svg/.test(now.stas), now);
  const lbl = await p.locator(".sk-course .sk-node .t b").first().evaluate((e) => [getComputedStyle(e).color, getComputedStyle(document.body).backgroundColor]);
  ok(`${n}: tytuły lekcji czytelne`, cr(lbl[0], lbl[1]) >= 4.5, lbl);
  const starts = await p.locator(".sk-course .sk-node .t").evaluateAll((ts) => ts.map((t) => Math.round(t.getBoundingClientRect().left)));
  ok(`${n}: tytuły lekcji zaczynają się w jednej linii (fala przesuwa tylko kółka)`, new Set(starts).size === 1, starts);
  ok(`${n}: następna lekcja ma etykietę „Teraz” i „następna” dla czytnika`, await p.locator(".sk-course .sk-node.now .h2-now").count() === 1 && /następna/.test(await p.locator(".sk-course .sk-node.now .sk-dot").getAttribute("aria-label")), "");
  const rowBg = await p.locator(".sk-course .sk-node.now").evaluate((e) => getComputedStyle(e).backgroundImage);
  ok(`${n}: wiersz następnej lekcji bez prostokąta w tle`, rowBg === "none", rowBg);
  ok(`${n}: bez poziomego przewijania`, await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "");
  ok(`${n}: bez błędów w konsoli`, p.errors.length === 0, p.errors);
  await p.close();
}
for (const th of ["riwiera", "pink"]) {
  const p = await open(b, { theme: th, hash: "/materials" });
  const bb = await p.locator("main .grid .nb").first().evaluate((e) => getComputedStyle(e).borderBottomWidth).catch(() => "brak");
  ok(`motyw ${th}: kafle przedmiotów bez stylu H2`, bb !== "6px", bb);
  await p.close();
}
const f = await open(b, { hash: "/subject/" + A, ls: { "mock-progress": prog } });
const v = await fps(f, async () => { await f.mouse.wheel(0, 1200); await f.waitForTimeout(500); await f.mouse.wheel(0, -1200); await f.evaluate(() => { location.hash = "#/materials"; }); await f.waitForTimeout(500); });
console.log("   fps przy CPU 4× (przedmiot: przewijanie + przejście):", v);
ok("płynność: ≥ 45 fps przy CPU 4×", v >= 45, v);
await f.close();
await b.close();
end();
