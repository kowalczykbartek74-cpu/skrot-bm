// 18.11.2026: Dziś bez „Jedziesz na zajęcia?” i bez „Więcej na dziś”. Przejazd dalej w Więcej. Zegar jak w przejazd-noc.mjs.
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 400)]);
const errs = [];
for (const [lang, w] of [["pl", 390], ["en", 360], ["pl", 1280]]) {
  const p = await page(b, { konto: "platne", w, h: 844, lang });
  p.on("pageerror", (e) => errs.push(String(e))); p.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errs.push(m.text()));
  await p.clock.setFixedTime(new Date("2026-11-06T10:30:00+01:00"));
  await p.goto(BASE + "index.html#/"); await p.waitForTimeout(2500);
  const t = await p.locator("#main").innerText();
  ok(`${lang} ${w}: Dziś się wyświetla`, /\S/.test(t) && (await p.locator("#main .greet").count()) > 0, t.slice(0, 200));
  ok(`${lang} ${w}: brak karty przejazdu`, (await p.locator(".jz-card").count()) === 0 && !/Jedziesz na zajęcia|Heading to class/.test(t), "");
  ok(`${lang} ${w}: brak „Więcej na dziś”`, (await p.locator(".nw-wiecej").count()) === 0 && !/Więcej na dziś|More for today/.test(t), "");
  ok(`${lang} ${w}: bez poziomego przewijania`, await p.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), "");
  await shot(p, `dzis-prosciej-${lang}-${w}`);
  if (lang === "pl" && w === 390) {
    await p.goto(BASE + "index.html#/more"); await p.waitForTimeout(1200);
    ok("Więcej: kafelek „5 minut · w drodze” zostaje", /5 minut · w drodze/.test(await p.locator("#main").innerText()), "");
    await p.goto(BASE + "index.html#/jazda"); await p.waitForTimeout(1000);
    ok("#/jazda dalej działa", /Ile jedziesz/.test(await p.locator("#main").innerText()), "");
  }
  await p.close();
}
ok("konsola bez błędów", errs.length === 0, errs);
await b.close();
for (const r of wyniki) console.log(r.join(" "));
process.exit(wyniki.some((r) => r[0] === "✗") ? 1 : 0);
