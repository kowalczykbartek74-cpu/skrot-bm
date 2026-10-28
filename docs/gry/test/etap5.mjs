// Etap 5 (SPEC 11.2): demo z ekranu logowania bez bazy, odznaki zapisują się raz, rozmiar gry.js, płynność przy CPU 4×.
import fs from "fs";
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = [];
const ok = (nazwa, warunek, info) => { wyniki.push([warunek ? "✓" : "✗", nazwa, warunek ? "" : JSON.stringify(info)?.slice(0, 400)]); };
const state = (p) => p.evaluate(() => window.SKROT_GRY?._state?.()?.state);
const until = async (p, want, ms = 8000) => { const t = Date.now(); while (Date.now() - t < ms) { if (want.includes(await state(p))) return true; await p.waitForTimeout(60); } return false; };
const key = (p, k) => p.evaluate((k) => document.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true })), k);
const UID = "00000000-0000-4000-8000-000000000001";
const odznaki = (p) => p.evaluate((u) => JSON.parse(localStorage.getItem("mock-progress") || "{}")[u]?.odznaki || {}, UID);

// rozmiar
const size = fs.statSync(new URL("../../../gry.js", import.meta.url)).size;
ok(`gry.js ≤ 60 kB (${(size / 1000).toFixed(1)} kB)`, size <= 60000, size);

// demo z ekranu logowania
for (const lang of ["pl", "en"]) {
  const p = await page(b, { konto: "brak", lang });
  const sb = []; p.on("request", (r) => { if (/supabase\.co/.test(r.url())) sb.push(r.url()); });
  await p.goto(BASE + "index.html"); await p.waitForTimeout(1500);
  const rpc0 = await p.evaluate(() => window.__rpc.length), sb0 = sb.length;
  const link = p.locator("#loginDemo");
  ok(`${lang}: link demo pod formularzem`, (await link.isVisible()) && (await link.textContent()) === (lang === "en" ? "Play the demo (1 min) →" : "Zagraj w demo (1 min) →"), await link.textContent());
  await link.click();
  ok(`${lang}: demo otwiera Fruń nad ekranem logowania`, await until(p, ["gra"]) && (await p.locator(".gry.demo").isVisible()));
  await shot(p, "e5-demo-" + lang);
  await key(p, " "); await until(p, ["pytanie"]);
  await p.locator(".gry-opt").first().click(); await p.waitForTimeout(200);
  const cta = p.locator(".gry-foot .btn.primary"); const t = await cta.textContent(); await cta.click(); await p.waitForTimeout(300);
  if (t !== "Zobacz wynik" && t !== "See score") { await key(p, " "); await until(p, ["pytanie", "wynik"]); if ((await state(p)) === "pytanie") { await p.locator(".gry-foot .link").click(); await p.waitForTimeout(300); } }
  await until(p, ["wynik"]);
  const res = await p.locator(".gry-res").innerText();
  await shot(p, "e5-demo-wynik-" + lang);
  ok(`${lang}: wynik demo z zaproszeniem, bez punktów rankingu`, (lang === "en" ? /In the full version/.test(res) : /W pełnej wersji pytania są z Twoich przedmiotów/.test(res)) && !/pkt rankingu|ranking pts/.test(res), res);
  await p.locator(".gry-demo-cta").click(); await p.waitForTimeout(400);
  ok(`${lang}: „Zaloguj się albo kup dostęp” zamyka grę, fokus w formularzu`, !(await p.locator(".gry").count()) && (await p.evaluate(() => !!document.activeElement?.closest("#loginBox"))));
  ok(`${lang}: demo bez zapytań do bazy`, (await p.evaluate(() => window.__rpc.length)) === rpc0 && sb.length === sb0, { rpc: await p.evaluate(() => window.__rpc.slice(-3)), sb });
  ok(`${lang}: zero błędów`, !p.errors.length, p.errors);
  await p.context().close();
}

// odznaki: Pierwszy lot (Fruń 10), Bez pomyłki (Pary trudna), Dziesiątka (ranking), zapis raz
{
  const p = await page(b, { ls: { "mock-rank": "daleko", "mock-ja": "4", "mock-nick": "Bartek B", "mock-vis": "1" } });
  await p.goto(BASE + "index.html#/ranking"); await p.waitForTimeout(1500);
  let o = {}; for (let i = 0; i < 40 && o.top10 == null; i++) { await p.waitForTimeout(200); o = await odznaki(p); } // zapis postępu jest odroczony (progSoon)
  ok("Dziesiątka po rankingu (miejsce ≤ 10 przy ≥ 10 osobach)", o.top10 != null, o);
  // Pary trudna bez błędu
  await p.goto(BASE + "index.html#/gry"); await p.waitForTimeout(2200);
  await p.locator("#gra-pary button.primary").click(); await p.waitForTimeout(300);
  await p.locator(".modal .sk-seg button", { hasText: "Trudna" }).click(); await p.getByRole("button", { name: "Zaczynamy" }).click();
  for (let i = 0; i < 40 && !(await p.locator(".pk").count()); i++) await p.waitForTimeout(100);
  const d = await p.evaluate(() => window.SKROT_GRY._dbg());
  for (let pid = 0; pid < d.n; pid++) { const ix = d.cards.map((c, i) => (c.pid === pid ? i : -1)).filter((i) => i >= 0); await p.locator(".pk").nth(ix[0]).click(); await p.locator(".pk").nth(ix[1]).click(); await p.waitForTimeout(40); }
  await until(p, ["wynik"]); await p.waitForTimeout(2500);
  o = await odznaki(p);
  ok("Bez pomyłki po trudnej planszy Par", o.pary0 != null, o);
  // Fruń: 10 kolumn autopilotem
  await p.locator(".gry-acts .btn.ghost").click(); await p.waitForTimeout(300);
  await p.goto(BASE + "index.html#/gry"); await p.waitForTimeout(1800);
  await p.locator("#gra-frun button.primary").click(); await until(p, ["gra"]);
  await p.evaluate(() => { window.__auto = setInterval(() => { const d = window.SKROT_GRY._dbg(); if (!d || d.st === "smierc") return; const nx = d.pipes.filter((q) => q.x + 64 > 86).sort((a, c) => a.x - c.x)[0]; const tg = nx ? nx.gy + 22 : (d.H - d.ground) / 2; if (d.st === "gotowy" || (d.y > tg && d.vy > -60)) document.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true })); }, 16); });
  for (let i = 0; i < 300 && ((await p.evaluate(() => window.SKROT_GRY._state().score)) < 10); i++) await p.waitForTimeout(100);
  await p.evaluate(() => clearInterval(window.__auto));
  await p.locator(".gry-x").click(); await p.waitForTimeout(200); await p.locator(".modal .btn.primary").click(); await p.waitForTimeout(2500);
  o = await odznaki(p);
  ok("Pierwszy lot po 10 kolumnach", o.frun10 != null && o.frun30 == null, o);
  const zapis = JSON.stringify(o);
  // drugi raz: ta sama odznaka się nie nadpisuje
  await p.goto(BASE + "index.html#/ranking"); await p.reload(); await p.waitForTimeout(2500);
  ok("odznaki zapisują się raz", JSON.stringify(await odznaki(p)) === zapis, [zapis, await odznaki(p)]);
  await p.goto(BASE + "index.html#/more"); await p.waitForTimeout(1200);
  const on = await p.locator(".gry-badge:not(.off)").count(), all = await p.locator(".gry-badge").count();
  ok("Więcej → profil: rząd odznak (3 zdobyte z 6)", on === 3 && all === 6, { on, all });
  await p.locator(".gry-badges").scrollIntoViewIfNeeded(); await shot(p, "e5-odznaki");
  ok("zero błędów (odznaki)", !p.errors.length, p.errors);
  await p.context().close();
}

// płynność: Fruń i Przejdź przy CPU 4× (Chrome DevTools)
for (const gra of ["frun", "przejdz"]) {
  const p = await page(b);
  await p.goto(BASE + "index.html#/gry"); await p.waitForTimeout(2000);
  await p.locator(`#gra-${gra} button.primary`).click(); await until(p, ["gra"]);
  const cdp = await p.context().newCDPSession(p); await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await key(p, gra === "frun" ? " " : "ArrowUp");
  const fps = await p.evaluate(() => new Promise((res) => { let n = 0, worst = 0, last = performance.now(); const t0 = last;
    const f = (t) => { n++; worst = Math.max(worst, t - last); last = t; if (t - t0 < 2000) requestAnimationFrame(f); else res({ fps: Math.round((n * 1000) / (t - t0)), worst: Math.round(worst) }); }; requestAnimationFrame(f); }));
  ok(`${gra}: płynność przy CPU 4× (${fps.fps} kl./s, najdłuższa klatka ${fps.worst} ms)`, fps.fps >= 50, fps);
  await p.context().close();
}
await b.close();
for (const w of wyniki) console.log(w.join(" "));
console.log(wyniki.filter((w) => w[0] === "✓").length + "/" + wyniki.length);
process.exit(wyniki.some((w) => w[0] === "✗") ? 1 : 0);
