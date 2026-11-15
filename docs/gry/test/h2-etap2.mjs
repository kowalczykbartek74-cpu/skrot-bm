// Wygląd H2, etap 2: elementy bazowe (przyciski 3D, karty, przełączniki, pola, komunikaty, okna jako arkusz, puste stany).
// BASE=http://127.0.0.1:8801/ node docs/gry/test/h2-etap2.mjs
import { chromium, OUT, open, tester, fps } from "./h2-lib.mjs";
const { ok, end } = tester();
const b = await chromium.launch();
const lum = (c) => { const m = c.match(/\d+(\.\d+)?/g).map(Number).slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]; };
const cr = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
// Element wstawiony do <main>, żeby sprawdzić wygląd niezależnie od tego, czy ekran go akurat ma.
const probe = (p, html, sel) => p.evaluate(([html, sel]) => {
  const box = document.createElement("div"); box.innerHTML = html; document.querySelector("main").prepend(box);
  const el = box.querySelector(sel), c = getComputedStyle(el), bf = getComputedStyle(el, "::before");
  const r = { color: c.color, bg: c.backgroundColor, shadow: c.boxShadow, bb: c.borderBottomWidth, radius: c.borderTopLeftRadius, before: bf.backgroundImage.slice(0, 30) };
  box.remove(); return r;
}, [html, sel]);
for (const dark of [false, true]) {
  const n = dark ? "ciemny" : "jasny";
  const p = await open(b, { dark });
  const prim = await probe(p, '<button class="btn primary">Zapisz</button>', ".btn");
  ok(`${n}: przycisk główny 3D (cień brzegu) i czytelny (≥ 4.5:1)`, /px/.test(prim.shadow) && prim.shadow !== "none" && cr(prim.color, prim.bg) >= 4.5, prim);
  const sec = await probe(p, '<button class="btn">Anuluj</button>', ".btn");
  ok(`${n}: przycisk drugorzędny 3D i czytelny`, sec.shadow !== "none" && cr(sec.color, sec.bg) >= 4.5, sec);
  const dan = await probe(p, '<button class="btn danger">Usuń</button>', ".btn");
  ok(`${n}: przycisk „usuń” czytelny (≥ 4.5:1)`, cr(dan.color, dan.bg) >= 4.5, dan);
  const pan = await probe(p, '<section class="panel"><p>x</p></section>', ".panel");
  ok(`${n}: panel = karta z grubszym dołem (5 px) i promieniem 22 px`, pan.bb === "5px" && pan.radius === "22px", pan);
  const emp = await probe(p, '<div class="empty"><p>Nic tu jeszcze nie ma.</p></div>', ".empty");
  ok(`${n}: pusty stan ze Stasiem`, /data:image\/svg/.test(emp.before), emp);
  const no = await probe(p, '<p class="notice err">Błąd</p>', ".notice");
  ok(`${n}: komunikat błędu czytelny (≥ 4.5:1)`, cr(no.color, no.bg) >= 4.5, no);
  const to = await probe(p, '<div class="toast" style="position:static;transform:none">Zapisano</div>', ".toast");
  ok(`${n}: toast czytelny (≥ 4.5:1)`, cr(to.color, to.bg) >= 4.5, to);
  // Wciśnięcie przycisku: przesuwa się w dół i chowa brzeg.
  await p.evaluate(() => { const bt = document.createElement("button"); bt.className = "btn primary"; bt.id = "h2press"; bt.textContent = "Naciśnij"; document.querySelector("main").prepend(bt); });
  const bt = p.locator("#h2press"), bb = await bt.boundingBox();
  await p.mouse.move(bb.x + 10, bb.y + 10); await p.mouse.down(); await p.waitForTimeout(150);
  const pressed = await bt.evaluate((e) => getComputedStyle(e).transform);
  await p.mouse.up();
  ok(`${n}: wciśnięty przycisk zjeżdża w dół`, /matrix\(1, 0, 0, 1, 0, [34]\)/.test(pressed), pressed);
  for (const [hash, name] of [["/", "dzis"], ["/more", "wiecej"], ["/terms", "terminy"], ["/materials", "przedmioty"], ["/ustawienia/wyglad", "ustawienia"]]) {
    await p.evaluate((h) => { location.hash = "#" + h; }, hash); await p.waitForTimeout(1800);
    await p.screenshot({ path: `${OUT}/h2e2-${n}-${name}.png`, fullPage: true });
  }
  // Okno (modal): na telefonie arkusz od dołu ekranu.
  await p.evaluate(() => { location.hash = "#/terms"; }); await p.waitForTimeout(1500);
  const add = p.locator("main").getByText("Zarządzanie zasobami ludzkimi", { exact: true }).first();
  if (await add.count()) {
    await add.click(); await p.waitForTimeout(600);
    const m = await p.locator(".modal").boundingBox();
    await p.screenshot({ path: `${OUT}/h2e2-${n}-okno.png` });
    ok(`${n}: okno na telefonie jako arkusz przy dolnej krawędzi`, m && Math.abs(m.y + m.height - 812) <= 2 && m.width >= 370, m);
    await p.keyboard.press("Escape");
  } else ok(`${n}: znaleziono przycisk otwierający okno`, false, await p.locator("main").innerText());
  ok(`${n}: bez błędów w konsoli`, p.errors.length === 0, p.errors);
  await p.close();
}
for (const th of ["riwiera", "pink"]) {
  const p = await open(b, { theme: th });
  const r = await probe(p, '<section class="panel"><p>x</p></section>', ".panel");
  ok(`motyw ${th}: panel bez stylu H2 (dół ≠ 5 px)`, r.bb !== "5px", r);
  await p.close();
}
const f = await open(b);
await f.evaluate(() => { location.hash = "#/terms"; }); await f.waitForTimeout(1500);
const add = f.locator("main").getByText("Zarządzanie zasobami ludzkimi", { exact: true }).first();
const v = await fps(f, async () => { if (await add.count()) await add.click(); await f.waitForTimeout(500); await f.keyboard.press("Escape"); await f.mouse.wheel(0, 800); });
console.log("   fps przy CPU 4× (okno + przewijanie):", v);
ok("płynność: ≥ 45 fps przy CPU 4×", v >= 45, v);
await f.close();
await b.close();
end();
