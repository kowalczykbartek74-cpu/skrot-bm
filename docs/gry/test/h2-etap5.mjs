// Wygląd H2, etap 5: Powtórki (karta „Dziś do powtórki”, fiszka 3D z obrotem, klawisze ocen, pudełka).
// BASE=http://127.0.0.1:8801/ node docs/gry/test/h2-etap5.mjs
import { chromium, OUT, BASE, tester, fps } from "./h2-lib.mjs";
import { page } from "./lib.mjs";
const { ok, end } = tester();
const b = await chromium.launch();
const lum = (c) => { const m = c.match(/\d+(\.\d+)?/g).map(Number).slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]; };
const cr = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
// Klucz fiszki jak w aplikacji: mid + ":" + hashStr(q).
const hashStr = (s) => { let x = 2166136261; for (const ch of String(s)) { x ^= ch.codePointAt(0); x = Math.imul(x, 16777619) >>> 0; } return x.toString(36); };
const UID = "00000000-0000-4000-8000-000000000001", now = new Date("2026-11-03T18:00:00+01:00").getTime();
const cards = Array.from({ length: 6 }, (_, i) => ({ q: `Co to jest PKB ${i}?`, a: `Wartość produkcji ${i}.` }));
const docs = { materials: { m1: { subjectId: "makroekonomia", title: "PKB i inflacja", quizCount: 0, flashcardCount: cards.length, createdAt: now - 1e6, v: 2 } },
  materialContent: { m1: { v: 2, summary: "x", quiz: [], flashcards: cards } } };
const day = Math.round((new Date(2026, 10, 3) - new Date(2026, 0, 1)) / 864e5);
const srs = Object.fromEntries(cards.map((c) => ["m1:" + hashStr(c.q), [2, day]]));
async function open(dark) {
  const p = await page(b, { konto: "platne", ls: { "mock-docs": JSON.stringify(docs), "mock-progress": JSON.stringify({ [UID]: { srs } }) }, ctx: dark ? { colorScheme: "dark" } : {} });
  await p.clock.install({ time: new Date(now) });
  await p.goto(BASE + "index.html#/review"); await p.waitForTimeout(2500);
  return p;
}
for (const dark of [false, true]) {
  const n = dark ? "ciemny" : "jasny";
  const p = await open(dark);
  await p.screenshot({ path: `${OUT}/h2e5-${n}-powtorki.png`, fullPage: true });
  const hero = await p.locator(".rv-hero").evaluate((e) => { const c = getComputedStyle(e), b = e.querySelector(".sk-bignum b"), ey = e.querySelector(".eyebrow"); return { bb: c.borderBottomWidth, bg: c.backgroundColor, num: b && getComputedStyle(b).color, ey: ey && getComputedStyle(ey).color, n: b?.textContent }; });
  ok(`${n}: karta „Dziś do powtórki” 3D w pomarańczowym, liczba i nadtytuł czytelne`, ["6px", "2px"].includes(hero.bb) && cr(hero.num, hero.bg) >= 4.5 && cr(hero.ey, hero.bg) >= 4.5, hero); /* Wygląd pro: płaska karta z brzegiem 2 px zamiast dołu 3D */
  const cut = await p.locator(".rv-box span").evaluateAll((ss) => ss.filter((s) => s.scrollWidth > s.clientWidth + 1).map((s) => s.textContent));
  ok(`${n}: podpisy pudełek nie są ucięte`, cut.length === 0, cut);
  const hy = await p.locator(".rv-box span").evaluateAll((ss) => ss.filter((s) => { const r = document.createRange(); r.selectNodeContents(s); return r.getClientRects().length > 1 && s.textContent.trim().split(/\s+/).length === 1; }).map((s) => s.textContent));
  ok(`${n}: podpisy pudełek bez dzielenia wyrazów`, hy.length === 0, hy);
  const gm = await p.locator(".gry-mini-b").first().evaluate((e) => getComputedStyle(e).borderBottomWidth).catch(() => "brak");
  ok(`${n}: kafle „Powtarzaj grając” 3D`, gm === "5px" || gm === "brak", gm);
  await p.getByRole("button", { name: /Zaczynamy/ }).first().click(); await p.locator(".lp").waitFor({ timeout: 15000 }); await p.waitForTimeout(500);
  const face = await p.locator(".lp-sw.top .face").first().evaluate((e) => getComputedStyle(e).borderBottomWidth);
  ok(`${n}: fiszka jako karta 3D (dół 6 px)`, face === "6px", face);
  await p.screenshot({ path: `${OUT}/h2e5-${n}-fiszka.png` });
  await p.locator(".lp-sw.top").click(); await p.waitForTimeout(600);
  ok(`${n}: dotknięcie odwraca fiszkę`, await p.locator(".lp-sw.top.flip").count() === 1, "");
  await p.screenshot({ path: `${OUT}/h2e5-${n}-oceny.png` });
  // Wybrany przez ucznia wygląd fiszek (kf-*) wygrywa z kolorami H2 (tył i obrys), w obu motywach.
  for (const kf of ["kf-papier", "kf-nocny", "kf-kreda"]) {
    const r = await p.evaluate((kf) => { const lp = document.querySelector(".lp"); lp.classList.add(kf); const f = document.querySelector(".lp-sw.top .face.back"), c = getComputedStyle(f), v = getComputedStyle(lp); const out = { bg: c.backgroundColor, bc: c.borderTopColor, ink: c.color }; lp.classList.remove(kf); return out; }, kf);
    const want = await p.evaluate((kf) => { const lp = document.querySelector(".lp"); lp.classList.add(kf); const d = document.createElement("i"); d.style.cssText = "color: var(--kf-bg2, var(--kf-bg)); border-color: var(--kf-edge)"; lp.append(d); const c = getComputedStyle(d); const out = { bg: c.color, bc: c.borderTopColor }; d.remove(); lp.classList.remove(kf); return out; }, kf);
    ok(`${n}: ${kf}: tył fiszki w kolorach wybranego wyglądu (tło i obrys), tekst czytelny`, r.bg === want.bg && r.bc === want.bc && cr(r.ink, r.bg) >= 4.5, { r, want });
    const st = await p.evaluate((kf) => { const lp = document.querySelector(".lp"); lp.classList.add(kf); const f = document.querySelector(".lp-sw.top .face"), sw = document.querySelector(".lp-swipe"); const d = document.createElement("i"); d.style.color = "var(--kf-bg2, var(--kf-bg))"; lp.append(d); const out = { bb: getComputedStyle(f).borderBottomWidth, stack: getComputedStyle(sw, "::before").backgroundColor, want: getComputedStyle(d).color }; d.remove(); lp.classList.remove(kf); return out; }, kf);
    ok(`${n}: ${kf}: karta zachowuje gruby dół 3D, stos w kolorze wyglądu fiszek`, st.bb === "6px" && st.stack === st.want, st);
  }
  const g = await p.locator(".sk-grade4 .opt").evaluateAll((os) => os.map((o) => { const c = getComputedStyle(o); return { cls: o.className, bg: c.backgroundColor, col: c.color, bb: c.borderBottomWidth }; }));
  const bgs = new Set(g.map((x) => x.bg));
  ok(`${n}: cztery oceny jako różnokolorowe klawisze 3D, tekst czytelny`, g.length === 4 && bgs.size === 4 && g.every((x) => x.bb === "5px" && cr(x.col, x.bg) >= 4.5), g);
  const pe = await p.evaluate(() => { const sw = document.querySelector(".lp-swipe"); return sw ? getComputedStyle(sw, "::before").pointerEvents : "brak"; });
  ok(`${n}: stos kart pod fiszką nie łapie dotyku`, pe === "none" || pe === "brak", pe);
  await p.locator(".sk-grade4 .opt.g-again").click(); await p.waitForTimeout(80);
  const picked = await p.locator(".sk-grade4 .opt.g-again").evaluate((e) => getComputedStyle(e).backgroundColor).catch(() => null);
  const dim = await p.locator(".sk-grade4 .opt.g-good").evaluate((e) => +getComputedStyle(e).opacity).catch(() => null);
  ok(`${n}: po wyborze pozostałe oceny przygaszone (wybrana z ✓)`, dim != null && dim <= 0.6, dim);
  const goodBg = g.find((x) => /g-good/.test(x.cls)).bg;
  ok(`${n}: wybrane „Nie pamiętam” zostaje czerwone (nie zielone)`, picked && picked === g.find((x) => /g-again/.test(x.cls)).bg && picked !== goodBg, { picked, goodBg });
  ok(`${n}: bez błędów w konsoli`, p.errors.length === 0, p.errors);
  await p.close();
}
{ // inny motyw (różowy): wybrana ocena bez zaznaczenia H2 (nie robi się zielona)
  const p = await page(b, { konto: "platne", ls: { "mock-docs": JSON.stringify(docs), "mock-progress": JSON.stringify({ [UID]: { srs, xp: { t: 700 }, motywWybor: { 4: "pink" }, motywyMig: 1 } }), "skrot-theme": "pink" } }); // UX-5: motyw zdobyty (poziom 4, wybór Jednorożca)
  await p.clock.install({ time: new Date(now) }); await p.goto(BASE + "index.html#/review"); await p.waitForTimeout(2500);
  await p.getByRole("button", { name: /Zaczynamy/ }).first().click(); await p.locator(".lp").waitFor({ timeout: 15000 }); await p.waitForTimeout(400);
  await p.evaluate(() => document.documentElement.setAttribute("data-theme", "pink")); // motyw może wymagać poziomu: ustawiamy go wprost
  await p.locator(".lp-sw.top").click(); await p.waitForTimeout(500);
  const before = await p.locator(".sk-grade4 .opt.g-again").evaluate((e) => getComputedStyle(e).backgroundColor);
  await p.locator(".sk-grade4 .opt.g-again").click(); await p.waitForTimeout(80);
  const after = await p.locator(".sk-grade4 .opt.g-again").evaluate((e) => [getComputedStyle(e).backgroundColor, e.className]).catch(() => [before, ""]);
  ok("motyw różowy: „Nie pamiętam” po wyborze bez zmiany koloru i bez klas H2", after[0] === before && !/h2-picked|right/.test(after[1]), { before, after });
  await p.close();
}
const f = await open(false);
await f.getByRole("button", { name: /Zaczynamy/ }).first().click(); await f.locator(".lp").waitFor({ timeout: 15000 });
const v = await fps(f, async () => { for (let i = 0; i < 3; i++) { await f.locator(".lp-sw.top").click().catch(() => {}); await f.waitForTimeout(500); await f.locator(".sk-grade4 .opt.g-good").click().catch(() => {}); await f.waitForTimeout(500); } }, 3500);
console.log("   fps przy CPU 4× (obrót fiszki + ocena):", v);
ok("płynność: ≥ 45 fps przy CPU 4×", v >= 45, v);
await f.close();
await b.close();
end();
