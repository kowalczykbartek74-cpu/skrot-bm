// UX-3 etap 2: darmowe dźwięki ok/no, pytanie o dźwięki raz, wibracja także przy reduced-motion, Staś w panelu, combo „×3 z rzędu”.
// BASE=http://127.0.0.1:8813/ node docs/gry/test/ux3-etap2.mjs
import { chromium, open, startLesson, tester, goToCard, answer, textContrast, contrastFails, shotsDir, noHScroll } from "./ux3-lib.mjs";
const { ok, end } = tester();
const SH = shotsDir();
const b = await chromium.launch();
const shot = async (p, n) => { if (SH) await p.screenshot({ path: `${SH}/${n}.png` }); };
const isQ = (c) => c.type === "mc" && (c.check || c.exit || c.again) && !c.done;
// Szpiedzy: AudioContext liczy createOscillator, navigator.vibrate zapisuje wywołania.
const SPY = () => {
  window.__osc = 0; window.__vib = [];
  class FakeAC { constructor() { this.state = "running"; this.currentTime = 0; this.destination = {}; }
    resume() {} createOscillator() { window.__osc++; const p = { setValueAtTime() {}, exponentialRampToValueAtTime() {} }; return { type: "", frequency: p, connect() {}, start() {}, stop() {} }; }
    createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; } }
  window.AudioContext = FakeAC; window.webkitAudioContext = FakeAC;
  Object.defineProperty(navigator, "vibrate", { configurable: true, value: (x) => { window.__vib.push(x); return true; } });
};
const osc = (p) => p.evaluate(() => window.__osc), vib = (p) => p.evaluate(() => window.__vib.slice());

// K1 + K2: dźwięki włączone, wibracja przy reduced-motion
{
  const p = await open(b, { motion: "reduce", init: SPY, ls: { "bm-dzwieki": "1" } });
  await startLesson(p); await goToCard(p, isQ);
  const o0 = await osc(p); await answer(p, true); const o1 = await osc(p);
  const v1 = await vib(p);
  ok("K1 dobra odpowiedź gra darmowy dźwięk „ok” (createOscillator)", o1 > o0, { o0, o1 });
  ok("K2 wibracja 18 ms przy dobrej, także przy reduced-motion", JSON.stringify(v1.at(-1)) === "18", v1);
  await p.locator(".lp-bottom .lp-cta").click(); await p.waitForTimeout(400);
  await goToCard(p, isQ);
  const o2 = await osc(p); await answer(p, false); const o3 = await osc(p);
  const v2 = await vib(p);
  ok("K1 zła odpowiedź gra darmowy dźwięk „no”", o3 > o2, { o2, o3 });
  ok("K2 wibracja [24, 50, 24] przy złej", JSON.stringify(v2.at(-1)) === "[24,50,24]", v2);
  ok("bez błędów w konsoli (dźwięki)", p.errors.length === 0, p.errors);
  await p.close();
}
// K1: bm-dzwieki = 0 → cisza; K2: bm-wibracje = 0 → bez wibracji
{
  const p = await open(b, { init: SPY, ls: { "bm-dzwieki": "0", "bm-wibracje": "0" } });
  await startLesson(p); await goToCard(p, isQ);
  await answer(p, true); await p.locator(".lp-bottom .lp-cta").click(); await p.waitForTimeout(400);
  await goToCard(p, isQ); await answer(p, false);
  ok("K1 przy bm-dzwieki=0 żaden dźwięk", (await osc(p)) === 0, await osc(p));
  ok("K2 przy bm-wibracje=0 bez wibracji", (await vib(p)).length === 0, await vib(p));
  await p.close();
}
// K1: pytanie o dźwięki raz, po pierwszej skończonej części
{
  const p = await open(b, { init: SPY });
  await startLesson(p);
  let asked = 0, seenAt = null;
  for (let i = 0; i < 30 && !seenAt; i++) {
    const c = await goToCard(p, () => false, 1);
    if (await p.locator(".lp-snd-ask").count()) { seenAt = i; asked++; }
    if (c === null && !(await p.locator(".lp").count())) break;
  }
  ok("K1 pytanie „Włączyć krótkie dźwięki…” po pierwszej części", !!seenAt || seenAt === 0, seenAt);
  await shot(p, "360-pytanie-dzwieki");
  const txt = await p.locator(".lp-snd-ask").innerText().catch(() => "");
  ok("K1 treść pytania i dwa przyciski", /Włączyć krótkie dźwięki przy odpowiedziach\?/.test(txt) && (await p.locator(".lp-snd-ask button").count()) === 2, txt);
  const bs = await p.locator(".lp-snd-ask button").evaluateAll((x) => x.map((e) => Math.round(e.getBoundingClientRect().height)));
  ok("przyciski pytania ≥ 44 px", bs.every((h) => h >= 44), bs);
  await p.locator(".lp-snd-ask button").filter({ hasText: "Włącz" }).click(); await p.waitForTimeout(300);
  ok("K1 „Włącz” zapisuje bm-dzwieki=1", (await p.evaluate(() => localStorage.getItem("bm-dzwieki"))) === "1", "");
  // kolejna część: bez pytania
  let again = false;
  for (let i = 0; i < 25; i++) { await goToCard(p, () => false, 1); if (await p.locator(".lp-snd-ask").count()) { again = true; break; } if (!(await p.locator(".lp").count())) break; }
  ok("K1 pytanie tylko raz", !again, "");
  await p.close();
}
// K3 + K4: Staś w panelu, dymek przy błędzie, combo 3/5 w tytule, chip „×3 z rzędu” z błyskawicą w limonce
for (const v of [{ n: "jasny" }, { n: "ciemny", dark: true }, { n: "calm", ls: { "skrot-calm": "1" } }, { n: "reduced", motion: "reduce" }]) {
  const p = await open(b, { dark: v.dark, motion: v.motion, init: SPY, ls: { "bm-dzwieki": "0", ...(v.ls || {}) } });
  await startLesson(p);
  await goToCard(p, isQ); await answer(p, false);
  const bad = await p.evaluate(() => ({ mood: document.querySelector(".lp-fbar .lp-fb-stas")?.dataset.mood, w: document.querySelector(".lp-fbar .lp-fb-stas")?.getBoundingClientRect().width, say: document.querySelector(".lp-fbar .lp-fb-say")?.textContent.trim(), shake: getComputedStyle(document.querySelector(".lp-fbar .lp-fb-stas")).animationName }));
  await shot(p, `360-${v.n}-stas-zla`);
  ok(`${v.n}: K3 Staś 48 px w panelu, mina „oops” przy złej`, bad.mood === "oops" && Math.round(bad.w) === 48, bad);
  ok(`${v.n}: K3 dymek z jednym z 3 tekstów`, ["Spokojnie, ten błąd się przyda.", "Prawie. Spójrz na wyjaśnienie.", "To częsta pułapka."].includes(bad.say), bad.say);
  await p.locator(".lp-bottom .lp-cta").click(); await p.waitForTimeout(400);
  // 5 dobrych z rzędu (druga szansa + kolejne kontrole i bilet)
  const seen = {};
  for (let k = 1; k <= 5; k++) {
    const c = await goToCard(p, isQ); if (!c) break;
    await answer(p, true); await p.waitForTimeout(150);
    seen[k] = await p.evaluate(() => { const s = document.querySelector(".lp-fbar .lp-fb-stas"), cb = document.querySelector(".lp-combo"); return { mood: s?.dataset.mood, hop: s?.classList.contains("lp-fb-hop"), anim: s ? getComputedStyle(s).animationName : null, v: document.querySelector(".lp-fbar .v")?.innerText || "", chip: cb && !cb.hidden ? cb.innerText : null, chipSvg: !!cb?.querySelector("svg"), chipBg: cb ? getComputedStyle(cb).backgroundColor : null, chipCol: cb ? getComputedStyle(cb).color : null, banner: !!document.querySelector(".lp-banner") }; });
    if (k === 3) await shot(p, `360-${v.n}-combo3`);
    if (k === 5) await shot(p, `360-${v.n}-combo5`);
    await p.locator(".lp-bottom .lp-cta").click(); await p.waitForTimeout(400);
  }
  ok(`${v.n}: K3 mina „ok” przy dobrej`, seen[1]?.mood === "ok", seen[1]);
  ok(`${v.n}: K4 „3 z rzędu!” w tytule panelu, chip „×3 z rzędu” z błyskawicą`, /3 z rzędu!/.test(seen[3]?.v) && seen[3]?.chip === "×3 z rzędu" && seen[3]?.chipSvg, seen[3]);
  ok(`${v.n}: K4 chip bez słowa „seria” i bez 🔥, w limonce`, !/seria|🔥/.test(seen[3]?.chip || "") && /rgb\((205, 242, 94|243, 249, 221|28, 38, 20)\)/.test(seen[3]?.chipBg || ""), seen[3]);
  ok(`${v.n}: K4 „5 z rzędu! +5 XP” w tytule, bez banera zasłaniającego kartę`, /5 z rzędu! \+5 XP/.test(seen[5]?.v || "") && !seen[5]?.banner, seen[5]);
  if (v.ls || v.motion) ok(`${v.n}: K3 podskok przy 3 z rzędu wyłączony`, seen[3]?.hop && seen[3]?.anim === "none", seen[3]);
  else ok(`${v.n}: K3 podskok Stasia przy 3 z rzędu (lp-fb-hop)`, seen[3]?.hop && seen[3]?.anim !== "none", seen[3]);
  const cf = contrastFails(await textContrast(p, ".lp-top"));
  ok(`${v.n}: kontrast nagłówka (chip combo) AA`, cf.length === 0, cf);
  const hs = await noHScroll(p); ok(`${v.n}: bez przewijania w bok`, hs.sw <= hs.w, hs);
  ok(`${v.n}: bez błędów w konsoli`, p.errors.length === 0, p.errors);
  await p.close();
}
// K3: w innym motywie bez Stasia w panelu
{
  const p = await open(b, { theme: "pink", ls: { "bm-dzwieki": "0" } });
  await startLesson(p); await goToCard(p, isQ); await answer(p, false);
  ok("pink: K3 bez Stasia w panelu (tylko zielone motywy)", (await p.locator(".lp-fbar .lp-fb-stas").count()) === 0 && (await p.locator(".lp-fbar .v").count()) === 1, "");
  await shot(p, "390-pink-zla");
  ok("pink: bez błędów", p.errors.length === 0, p.errors);
  await p.close();
}
// Ustawienia: przełączniki dźwięków i wibracji
{
  const p = await open(b, { hash: "/ustawienia", w: 390, h: 844 });
  const rows = p.locator('[data-ux3="dzwieki"], [data-ux3="wibracje"]');
  ok("Ustawienia: przełączniki „Dźwięki przy odpowiedziach” i „Wibracje”", (await rows.count()) === 2, await rows.count());
  await p.locator('[data-ux3="wibracje"]').click(); await p.waitForTimeout(300);
  ok("Ustawienia: „Wibracje” wyłącza bm-wibracje=0", (await p.evaluate(() => localStorage.getItem("bm-wibracje"))) === "0", "");
  await p.locator('[data-ux3="dzwieki"]').click(); await p.waitForTimeout(300);
  ok("Ustawienia: „Dźwięki” włącza bm-dzwieki=1", (await p.evaluate(() => localStorage.getItem("bm-dzwieki"))) === "1", "");
  await p.locator('[data-ux3="dzwieki"]').scrollIntoViewIfNeeded(); await shot(p, "390-ustawienia");
  const hgt = await rows.evaluateAll((x) => x.map((e) => Math.round(e.getBoundingClientRect().height)));
  ok("Ustawienia: wiersze ≥ 44 px", hgt.every((h) => h >= 44), hgt);
  ok("Ustawienia: bez błędów", p.errors.length === 0, p.errors);
  await p.close();
}
// EN
{
  const p = await open(b, { lang: "en", ls: { "bm-dzwieki": "0" } });
  await startLesson(p); await goToCard(p, isQ); await answer(p, false);
  const say = await p.locator(".lp-fbar .lp-fb-say").innerText().catch(() => "");
  ok("EN: dymek Stasia po angielsku", ["No worries, this mistake is useful.", "Close. Check the explanation.", "It's a common trap."].includes(say.trim()), say);
  await shot(p, "390-en-stas");
  ok("EN: bez błędów", p.errors.length === 0, p.errors);
  await p.close();
}
await b.close();
end();
