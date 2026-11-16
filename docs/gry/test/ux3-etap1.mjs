// UX-3 etap 1: panel werdyktu na dole ekranu (zielony / czerwony dolny pasek, „Poprawna”, „Dlaczego”, ✓/✗, „+10 XP”, limonkowa karta Powtórek).
// BASE=http://127.0.0.1:8813/ node docs/gry/test/ux3-etap1.mjs
import { chromium, open, startLesson, tester, goToCard, answer, textContrast, contrastFails, cr, shotsDir, noHScroll, WHY } from "./ux3-lib.mjs";
const { ok, end } = tester();
const SH = shotsDir();
const b = await chromium.launch();
const shot = async (p, n) => { if (SH) await p.screenshot({ path: `${SH}/${n}.png` }); };
const isCheck = (c) => c.type === "mc" && c.check && !c.again && !c.done;

for (const v of [{ n: "jasny" }, { n: "ciemny", dark: true }, { n: "reduced", motion: "reduce" }, { n: "calm", ls: { "skrot-calm": "1" } }]) {
  const p = await open(b, { dark: v.dark, motion: v.motion, ls: v.ls });
  await startLesson(p);
  const c = await goToCard(p, isCheck);
  ok(`${v.n}: doszliśmy do pytania kontrolnego części`, !!c, c);
  if (!c) { await p.close(); continue; }
  ok(`${v.n}: przed odpowiedzią dolny pasek bez werdyktu`, (await p.locator(".lp[data-fb]").count()) === 0 && (await p.locator(".lp-fbar:empty").count()) === 1, "");
  await answer(p, false);
  await p.waitForTimeout(400);
  await shot(p, `360-${v.n}-zla`);
  const m = await p.evaluate(() => {
    const v = document.querySelector(".lp-fbar .v"), bar = document.querySelector(".lp-fbar"), bot = document.querySelector(".lp-bottom"), cta = document.querySelector(".lp-cta");
    const r = v?.getBoundingClientRect(), br = bar?.getBoundingClientRect();
    return { fb: document.querySelector(".lp")?.dataset.fb, top: r?.top, bottom: r?.bottom, vh: innerHeight, barH: br?.height, barMax: getComputedStyle(bar).maxHeight, scroll: bar.scrollHeight > bar.clientHeight + 2, ov: getComputedStyle(bar).overflowY,
      bg: getComputedStyle(bot).backgroundColor, vcol: getComputedStyle(v).color, cta: cta.textContent.trim(), ctaBg: getComputedStyle(cta).backgroundColor, ctaCol: getComputedStyle(cta).color, ctaTop: cta.getBoundingClientRect().top,
      text: bar.innerText, svg: !!v.querySelector("svg"), badSoft: getComputedStyle(document.documentElement).getPropertyValue("--bad-soft").trim(),
      inCard: !!document.querySelector(".lp-card .lp-fb"), right: !!document.querySelector(".lp-card .opt.right") };
  });
  ok(`${v.n}: K1 werdykt w całości w oknie 360×640 (góra ${Math.round(m.top)}, dół ${Math.round(m.bottom)})`, m.top >= 0 && m.bottom <= m.vh, m);
  ok(`${v.n}: K1 „Dlaczego” przewija się wewnątrz panelu (maks. 38dvh, overflow auto)`, m.barH <= m.vh * 0.38 + 1 && m.ov === "auto" && m.scroll, { h: m.barH, max: m.barMax, ov: m.ov, scroll: m.scroll });
  ok(`${v.n}: K2 data-fb="no", dolny pasek w czerwieni z palety (--bad-soft)`, m.fb === "no" && (v.n === "ciemny" ? m.bg === "rgb(58, 21, 24)" : m.bg === "rgb(253, 236, 234)"), { fb: m.fb, bg: m.bg });
  ok(`${v.n}: K2 przycisk „Rozumiem” na dole`, m.cta === "Rozumiem" && m.ctaTop > m.vh * 0.75, m.cta);
  ok(`${v.n}: K3 „Poprawna: …” + Dlaczego + „Czemu nie …?”`, /Nie tym razem\. Poprawna: [A-D]\./.test(m.text) && m.text.includes(WHY.slice(0, 40)) && /Czemu nie [A-D]\?/.test(m.text), m.text.slice(0, 200));
  ok(`${v.n}: K3 poprawna odpowiedź podświetlona w karcie, stary panel w karcie zniknął`, m.right && !m.inCard, m);
  ok(`${v.n}: K4 ikona ✗ (SVG) obok werdyktu`, m.svg, "");
  const cf = contrastFails(await textContrast(p, ".lp-fbar, .lp-bottom .lp-cta"));
  ok(`${v.n}: K4 kontrast tytułu, treści i przycisku AA`, cf.length === 0 && cr(m.vcol, m.bg) >= 4.5 && cr(m.ctaCol, m.ctaBg) >= 4.5, { cf: cf.slice(0, 4), v: cr(m.vcol, m.bg), cta: cr(m.ctaCol, m.ctaBg) });
  const hs = await noHScroll(p);
  ok(`${v.n}: bez przewijania w bok przy 360 px`, hs.sw <= hs.w, hs);
  // „Rozumiem” → następna karta bez werdyktu
  await p.locator(".lp-bottom .lp-cta").click(); await p.waitForTimeout(500);
  ok(`${v.n}: K2 po „Dalej” data-fb znika`, (await p.locator(".lp[data-fb]").count()) === 0 && (await p.locator(".lp-fbar:empty").count()) === 1, "");
  // dobra odpowiedź (druga szansa albo kolejne pytanie kontrolne)
  const c2 = await goToCard(p, (x) => x.type === "mc" && (x.check || x.again) && !x.done);
  if (c2) {
    let fl = null;
    await answer(p, true);
    // pastylka i widoczna (nie zasłonięta paskiem) część tekstu wybranej opcji w tej samej chwili
    const fx = await p.evaluate(() => { const f = document.querySelector(".lp-float"); if (!f) return {}; const r = f.getBoundingClientRect(), st = document.querySelector(".lp-stage").getBoundingClientRect();
      const o = document.querySelector(".lp-card .opt.right span:last-child").getBoundingClientRect(), y0 = Math.max(o.top, st.top), y1 = Math.min(o.bottom, st.bottom);
      return { fl: { x: r.left, y: r.top, w: r.width, h: r.height, t: f.textContent }, box: y1 > y0 ? { x: o.left, y: y0, width: o.width, height: y1 - y0 } : null }; });
    fl = fx.fl || null; const box = fx.box;
    await p.waitForTimeout(150);
    await shot(p, `360-${v.n}-dobra`);
    const g = await p.evaluate(() => { const bot = document.querySelector(".lp-bottom"), v = document.querySelector(".lp-fbar .v"); return { fb: document.querySelector(".lp")?.dataset.fb, bg: getComputedStyle(bot).backgroundColor, v: v?.innerText || "", vcol: getComputedStyle(v).color, cta: document.querySelector(".lp-cta").textContent.trim(), soft: getComputedStyle(document.documentElement).getPropertyValue("--h-acc-soft").trim() }; });
    ok(`${v.n}: K2 dobra odpowiedź → data-fb="ok", pasek w zieleni H2 (--h-acc-soft)`, g.fb === "ok" && g.bg === (v.dark ? "rgb(24, 51, 36)" : "rgb(221, 243, 208)"), g);
    ok(`${v.n}: K4 kontrast tytułu „ok” AA`, cr(g.vcol, g.bg) >= 4.5, cr(g.vcol, g.bg));
    if (v.motion || v.ls) ok(`${v.n}: K5 przy ograniczonym ruchu „+N XP” jest w tytule panelu`, /\+\d+ XP/.test(g.v) && !fl, { v: g.v, fl });
    else {
      const hit = !!fl && !!box && !(fl.x + fl.w <= box.x || fl.x >= box.x + box.width || fl.y + fl.h <= box.y || fl.y >= box.y + box.height);
      ok(`${v.n}: K5 pastylka „+N” nie przecina tekstu wybranej opcji`, !!fl && !hit, { fl, box });
    }
  } else ok(`${v.n}: druga karta z pytaniem`, false, "");
  ok(`${v.n}: bez błędów w konsoli`, p.errors.length === 0, p.errors);
  await p.close();
}
// EN: „Got it” po złej odpowiedzi, werdykt po angielsku.
{
  const p = await open(b, { lang: "en" });
  await startLesson(p);
  await goToCard(p, isCheck);
  await answer(p, false); await p.waitForTimeout(500);
  await shot(p, "360-en-zla");
  const t = await p.evaluate(() => ({ v: document.querySelector(".lp-fbar .v")?.innerText, cta: document.querySelector(".lp-cta").textContent.trim() }));
  ok("EN: przycisk „Got it” i werdykt po angielsku", t.cta === "Got it" && /Not this time/i.test(t.v || ""), t);
  ok("EN: bez błędów w konsoli", p.errors.length === 0, p.errors);
  await p.close();
}
// K6: karta „Dziś do powtórki” w limonce, bez pomarańczu i brązu.
for (const dark of [false, true]) {
  const n = dark ? "ciemny" : "jasny";
  const p = await open(b, { dark, w: 390, h: 844, hash: "/review" });
  const r = await p.evaluate(() => { const e = document.querySelector(".rv-hero"); if (!e) return null; const c = getComputedStyle(e), ey = e.querySelector(".eyebrow"); return { bg: c.backgroundColor, edge: c.borderBottomColor, ey: ey ? getComputedStyle(ey).color : null }; });
  await shot(p, `390-${n}-powtorki`);
  const lime = dark ? "rgb(28, 38, 20)" : "rgb(243, 249, 221)";
  ok(`${n}: K6 karta „Dziś do powtórki” w limonce (${lime})`, r && r.bg === lime, r);
  ok(`${n}: K6 bez pomarańczu/brązu na karcie`, r && !/rgb\(2(55|33|42), (246|221|31)/.test(r.bg + r.edge), r);
  const cf = contrastFails(await textContrast(p, ".rv-hero"));
  ok(`${n}: K6 kontrast tekstów karty AA`, cf.length === 0, cf.slice(0, 4));
  ok(`${n}: bez błędów w konsoli (Powtórki)`, p.errors.length === 0, p.errors);
  await p.close();
}
// Zrzuty do raportu: 390×844 i 1280×900, jasny i ciemny, motyw pink (nic się nie psuje).
if (SH) for (const v of [{ n: "390-jasny", w: 390, h: 844 }, { n: "390-ciemny", w: 390, h: 844, dark: true }, { n: "1280-jasny", w: 1280, h: 900 }, { n: "1280-ciemny", w: 1280, h: 900, dark: true }, { n: "390-pink", w: 390, h: 844, theme: "pink" }]) {
  const p = await open(b, { w: v.w, h: v.h, dark: v.dark, theme: v.theme });
  await startLesson(p); await goToCard(p, isCheck); await answer(p, false); await p.waitForTimeout(500);
  await shot(p, `${v.n}-zla`);
  if (v.theme) ok(`${v.n}: inny motyw: odtwarzacz działa, bez błędów`, p.errors.length === 0 && (await p.locator(".lp-fbar .v").count()) === 1, p.errors);
  await p.close();
}
await b.close();
end();
