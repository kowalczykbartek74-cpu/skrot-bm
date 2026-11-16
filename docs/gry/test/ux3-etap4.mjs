// UX-3 etap 4: pasek postępu ≥ 200 px przy 360, rośnie w serii fiszek, bez stałych chipów XP i monet; „Pomiń krok” w dolnym
// pasku z „Cofnij”; karta czytania wyśrodkowana, tekst 20 px, mały Staś, ≥ 900 px karta ≤ 720 px i Staś obok; bez emoji w odtwarzaczu.
// BASE=http://127.0.0.1:8813/ node docs/gry/test/ux3-etap4.mjs
import { chromium, open, startLesson, tester, goToCard, answer, shotsDir, noHScroll, docsWith, lesson } from "./ux3-lib.mjs";
import { open as openDzis } from "./h2-lib.mjs";
const { ok, end } = tester();
const SH = shotsDir();
const b = await chromium.launch();
const shot = async (p, n) => { if (SH) await p.screenshot({ path: `${SH}/${n}.png` }); };
const EMO = /\p{Extended_Pictographic}/u;
// Tekst odtwarzacza poza treścią lekcji (pytania, akapity, odpowiedzi, fiszki, wzory).
const chrome = (p) => p.evaluate(() => {
  const root = document.querySelector(".lp"); if (!root) return "";
  const skip = ".lp-text, .lp-big, .lp-quote, .q, [translate=no], .lp-sw .face, .lp-formula, textarea, .lp-gap, .lp-flow, .lp-steps, .lp-marks, .lp-layers, .lv-table, .lv-chart, .lp-fb-why";
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let out = "";
  for (let n = w.nextNode(); n; n = w.nextNode()) { const e = n.parentElement; if (!e || e.closest(skip) || e.closest("[hidden]")) continue; const cs = getComputedStyle(e); if (cs.display === "none" || cs.visibility === "hidden") continue; out += n.textContent + " "; }
  return out;
});
const scanEmoji = async (p, tag, acc) => { const t = await chrome(p); const m = [...t].filter((c) => EMO.test(c)); if (m.length) acc.push(tag + ": " + [...new Set(m)].join("")); };

// K1: szerokość paska, chipy, combo, lpFloat
{
  const p = await open(b, { ls: { "bm-dzwieki": "0" } });
  await startLesson(p); await goToCard(p, (c) => c.type === "mc" && c.check && !c.done);
  const m = await p.evaluate(() => { const bar = document.querySelector(".lp-bar").getBoundingClientRect(), xp = document.querySelector(".lp-xpchip")?.getBoundingClientRect(), co = document.querySelector(".lp-coinchip")?.getBoundingClientRect(); return { bar: Math.round(bar.width), xp: xp ? Math.round(xp.width) : 0, coin: co ? Math.round(co.width) : 0 }; });
  ok("K1 360 px: pasek postępu ≥ 200 px", m.bar >= 200, m);
  ok("K1 stałe chipy XP i monet zdjęte z nagłówka (w DOM, niewidoczne)", m.xp <= 1 && m.coin <= 1 && (await p.locator(".lp-xpchip").count()) === 1, m);
  await shot(p, "360-pasek");
  // 3 dobre z rzędu → combo w nagłówku, pasek nadal ≥ 200 px
  for (let k = 0; k < 3; k++) { await goToCard(p, (c) => c.type === "mc" && (c.check || c.exit || c.again) && !c.done); await answer(p, true); if (k < 2) { await p.locator(".lp-bottom .lp-cta").click(); await p.waitForTimeout(400); } }
  const m2 = await p.evaluate(() => ({ bar: Math.round(document.querySelector(".lp-bar").getBoundingClientRect().width), chip: document.querySelector(".lp-combo")?.textContent.trim(), vis: document.querySelector(".lp-combo")?.innerText.trim(), float: !!document.querySelector(".lp-float") }));
  await shot(p, "360-pasek-combo");
  ok("K1 przy combo pasek nadal ≥ 200 px (w nagłówku „×3”, pełny tekst „×3 z rzędu” dla czytnika)", m2.bar >= 200 && m2.chip === "×3 z rzędu" && /^×3$/.test(m2.vis), m2);
  ok("K1 lpFloat dalej działa (pastylka „+N” przy werdykcie)", m2.float, m2);
  const hs = await noHScroll(p); ok("bez przewijania w bok", hs.sw <= hs.w, hs);
  ok("bez błędów (K1)", p.errors.length === 0, p.errors);
  await p.close();
}
// K1: seria fiszek: pasek rośnie po każdej fiszce
{
  const fl = Array.from({ length: 5 }, (_, i) => ({ q: `Fiszka ${i + 1}?`, a: `Odpowiedź ${i + 1}.` }));
  const d = docsWith([["U1", "Lekcja 1: Fiszki", lesson(1)]]); d.materialContent.U1.flashcards = fl; d.materials.U1.flashcardCount = 5;
  const p = await open(b, { docs: d });
  await startLesson(p);
  await goToCard(p, (c) => c.type === "swipe", 30);
  const ps = [];
  const pOf = () => p.evaluate(() => { const b = document.querySelector(".lp-bar"); const i = b.querySelector("i"); return b.classList.contains("cont") ? +getComputedStyle(i).getPropertyValue("--p") : [...b.children].filter((x) => x.classList.contains("on")).length / b.children.length; });
  ps.push(await pOf());
  for (let k = 0; k < 4; k++) { await p.locator(".lp-bottom .lp-cta").filter({ hasText: "Odwróć" }).click(); await p.waitForTimeout(300); await p.locator(".lp-bottom .lp-barx .btn.primary").click(); await p.waitForTimeout(600); ps.push(await pOf()); }
  await shot(p, "360-fiszki-pasek");
  ok("K1 w serii fiszek pasek rośnie po każdej fiszce", ps.every((v, i) => i === 0 || v > ps[i - 1]), ps);
  ok("bez błędów (fiszki)", p.errors.length === 0, p.errors);
  await p.close();
}
// K2: „Pomiń krok” w dolnym pasku karty „Dziś · 5 min” + „Cofnij”
for (const w of [360, 390]) {
  const p = await openDzis(b, { w, h: w === 360 ? 640 : 844 });
  await p.locator(".zh-hero .zh-go").click(); await p.locator(".lp").waitFor({ timeout: 15000 }); await p.waitForTimeout(800);
  const sk = p.locator(".lp-bottom .ld-skip");
  const r = await sk.evaluate((e) => { const x = e.getBoundingClientRect(); return { t: e.innerText.trim(), h: Math.round(x.height), top: Math.round(x.top), vh: innerHeight, inHead: !!e.closest(".lp-top") }; }).catch(() => null);
  await shot(p, `${w}-pomin`);
  ok(`${w}: K2 „Pomiń krok” w dolnym pasku, ≥ 44 px`, r && /Pomiń krok/.test(r.t) && r.h >= 44 && r.top > r.vh * 0.7 && !r.inHead, r);
  ok(`${w}: K2 w nagłówku nie ma już „Pomiń”`, (await p.locator(".lp-top .ld-skip").count()) === 0, "");
  const seg = await p.evaluate(() => { const s = document.querySelector(".ld-seg"); if (!s) return null; const r = s.getBoundingClientRect(), bar = document.querySelector(".lp-bar").getBoundingClientRect(); return { t: s.innerText.trim(), below: r.top >= bar.bottom - 2, fs: parseFloat(getComputedStyle(s).fontSize) }; });
  ok(`${w}: segment karty jako cienki napis pod paskiem`, seg && seg.below && seg.fs <= 13.5 && seg.fs >= 12, seg);
  const before = await p.evaluate(() => ({ idx: window.ZD_APP.LP.st.idx, id: window.ZD_APP.lpCur()?.id }));
  await sk.click(); await p.waitForTimeout(500);
  const toast = await p.evaluate(() => { const t = document.querySelector(".lp-undo"); return t ? { t: t.innerText, h: Math.round(t.querySelector("button").getBoundingClientRect().height) } : null; });
  await shot(p, `${w}-pominieto`);
  ok(`${w}: K2 toast „Pominięto. Cofnij”`, toast && /Pominięto\./.test(toast.t) && /Cofnij/.test(toast.t) && toast.h >= 44, toast);
  const mid = await p.evaluate(() => window.ZD_APP.LP.st.idx);
  await p.locator(".lp-undo button").click(); await p.waitForTimeout(600);
  const after = await p.evaluate(() => ({ idx: window.ZD_APP.LP.st.idx, id: window.ZD_APP.lpCur()?.id, undo: !!document.querySelector(".lp-undo") }));
  ok(`${w}: K2 „Cofnij” przywraca kartę`, mid !== before.idx && after.idx === before.idx && after.id === before.id && !after.undo, { before, mid, after });
  // toast znika sam po 4 s
  await sk.click(); await p.waitForTimeout(4400);
  ok(`${w}: K2 toast znika po ok. 4 s`, (await p.locator(".lp-undo").count()) === 0, "");
  const hs = await noHScroll(p); ok(`${w}: bez przewijania w bok (Dziś 5 min)`, hs.sw <= hs.w, hs);
  ok(`${w}: bez błędów (pomiń)`, p.errors.length === 0, p.errors);
  await p.close();
}
// K3: karta czytania
for (const v of [{ w: 360, h: 640 }, { w: 390, h: 844 }, { w: 1280, h: 900 }, { w: 390, h: 844, dark: true }]) {
  const n = `${v.w}${v.dark ? "-ciemny" : ""}`;
  const p = await open(b, { w: v.w, h: v.h, dark: v.dark });
  await startLesson(p); await goToCard(p, (c) => c.type === "read");
  await p.waitForTimeout(500);
  const m = await p.evaluate(() => { const c = document.querySelector(".lp-card[data-type=read]"), r = c.getBoundingClientRect(), st = document.querySelector(".lp-stage").getBoundingClientRect(), cta = document.querySelector(".lp-cta").getBoundingClientRect(), t = c.querySelector(".lp-text p, .lp-text"), s = document.querySelector(".lp-read-stas"), sr = s?.getBoundingClientRect();
    return { top: r.top - st.top, bot: st.bottom - r.bottom, gap: cta.top - r.bottom, vh: innerHeight, w: r.width, fs: parseFloat(getComputedStyle(t).fontSize), stas: !!s, sw: sr ? Math.round(sr.width) : 0, beside: sr ? sr.right <= r.left + 4 : false, inside: sr ? sr.top >= r.top - 2 && sr.right <= r.right + 2 : false }; });
  await shot(p, `${n}-czytaj`);
  ok(`${n}: K3 karta wyśrodkowana w pionie (odstęp góra ≈ dół)`, Math.abs(m.top - m.bot) <= 24, m);
  ok(`${n}: K3 tekst 20 px`, Math.round(m.fs) === 20, m.fs);
  ok(`${n}: K3 dół karty → przycisk < 30% wysokości ekranu`, m.gap < 0.3 * m.vh, { gap: m.gap, vh: m.vh });
  ok(`${n}: K3 mały Staś przy karcie`, m.stas && m.sw >= 36, m);
  if (v.w >= 900) ok(`${n}: K3 ≥ 900 px karta ≤ 720 px, Staś obok`, m.w <= 721 && m.beside, m);
  ok(`${n}: bez błędów (czytaj)`, p.errors.length === 0, p.errors);
  await p.close();
}
// K4: bez emoji w odtwarzaczu (zielony motyw), ikony SVG; inny motyw bez zmian
{
  const acc = [];
  const fl = Array.from({ length: 5 }, (_, i) => ({ q: `Fiszka ${i + 1}?`, a: `Odpowiedź ${i + 1}.` }));
  const L = lesson(2); L.sections[0].mistake = { wrong: "Wyższa cena zawsze zwiększa popyt.", right: "Wyższa cena zwykle zmniejsza popyt.", why: "Prawo popytu." }; L.sections[0].tip = "Na egzaminie pisz pełne zdania."; L.sections[0].intuition = "Pomyśl o kawie w drodze na zajęcia.";
  const d = docsWith([["U1", "Lekcja 1", L], ["U2", "Lekcja 2", lesson(1)]]); d.materialContent.U1.flashcards = fl; d.materials.U1.flashcardCount = 5;
  const p = await open(b, { docs: d, ls: { "bm-dzwieki": "0" } });
  await startLesson(p);
  for (let i = 0; i < 60; i++) {
    await scanEmoji(p, "krok " + i, acc);
    const c = await goToCard(p, () => false, 1);
    if (c === null && !(await p.locator(".lp").count())) break;
    if (i === 3) await shot(p, "360-ikony");
    if (await p.locator(".lp-done-screen").count() && /Lekcja (zrobiona|przerobiona)/.test(await p.locator(".lp-done-screen").innerText())) { await scanEmoji(p, "koniec", acc); break; }
  }
  ok("K4 zielony motyw: w odtwarzaczu (poza treścią lekcji) brak emoji", acc.length === 0, acc.slice(0, 8));
  const ic = await p.evaluate(() => Object.keys(window.ZD_APP.H2_ICO).filter((k) => ["bolt", "book", "bulb", "check", "retry", "skip", "warn", "eye", "ticket", "help"].includes(k)).length);
  ok("K4 ikony dopisane do H2_ICO (Object.assign)", ic === 10, ic);
  ok("bez błędów (K4)", p.errors.length === 0, p.errors);
  await p.close();
}
{
  const p = await open(b, { theme: "pink" });
  await startLesson(p); await goToCard(p, (c) => c.type === "mc" && c.check && !c.done);
  await shot(p, "390-pink-pytanie");
  ok("pink: odtwarzacz działa (kicker z tekstem), bez błędów", p.errors.length === 0 && /Sprawdź się/.test(await p.locator(".lp-kick").first().innerText()), p.errors);
  await p.close();
}
{
  const p = await open(b, { lang: "en" });
  await startLesson(p); await goToCard(p, (c) => c.type === "read");
  await shot(p, "390-en-czytaj");
  ok("EN: bez błędów", p.errors.length === 0, p.errors);
  await p.close();
}
await b.close();
end();
