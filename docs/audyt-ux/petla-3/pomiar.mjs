// Pętla UX-3: pomiary rundy (A5 b): axe (kontrast, cele dotyku), własny kontrast każdego tekstu, cele < 44 px,
// poziome przewijanie, błędy konsoli, animacje i czy znikają przy reduced-motion / html.calm. Zrzuty każdej sceny.
// ETAP=1 RUNDA=1 BASE=http://127.0.0.1:8813/ node docs/audyt-ux/petla-3/pomiar.mjs
import fs from "fs";
import { createRequire } from "module";
import { chromium, open, startLesson, goToCard, answer, textContrast, contrastFails } from "../../gry/test/ux3-lib.mjs";
const require = createRequire(process.env.HOME + "/matura-app/package.json");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const ETAP = process.env.ETAP || "1", RUNDA = process.env.RUNDA || "1";
const DIR = new URL(`./etap-${ETAP}/runda-${RUNDA}/`, import.meta.url).pathname;
fs.mkdirSync(DIR, { recursive: true });
const isCheck = (c) => c.type === "mc" && c.check && !c.again && !c.done;
const toWrong = async (p) => { await startLesson(p); await goToCard(p, isCheck); await answer(p, false); await p.waitForTimeout(500); };
const toRight = async (p) => { await startLesson(p); await goToCard(p, isCheck); await answer(p, true); await p.waitForTimeout(500); };
const isQ = (c) => c.type === "mc" && (c.check || c.exit || c.again) && !c.done;
const toCombo = (n) => async (p) => { await startLesson(p); for (let k = 0; k < n; k++) { await goToCard(p, isQ); await answer(p, true); if (k < n - 1) { await p.locator(".lp-bottom .lp-cta").click(); await p.waitForTimeout(400); } } await p.waitForTimeout(300); };
const toAsk = async (p) => { await startLesson(p); for (let i = 0; i < 30 && !(await p.locator(".lp-snd-ask").count()); i++) await goToCard(p, () => false, 1); };
const SC = {
  2: [
    { n: "360-jasny-zla-stas", o: {}, run: toWrong, scope: ".lp" },
    { n: "360-ciemny-zla-stas", o: { dark: true }, run: toWrong, scope: ".lp" },
    { n: "360-jasny-combo3", o: { ls: { "bm-dzwieki": "0" } }, run: toCombo(3), scope: ".lp" },
    { n: "360-ciemny-combo5", o: { dark: true, ls: { "bm-dzwieki": "0" } }, run: toCombo(5), scope: ".lp" },
    { n: "360-jasny-pytanie-dzwieki", o: {}, run: toAsk, scope: ".lp" },
    { n: "360-ciemny-pytanie-dzwieki", o: { dark: true }, run: toAsk, scope: ".lp" },
    { n: "390-jasny-ustawienia", o: { w: 390, h: 844, hash: "/ustawienia" }, run: async (p) => { await p.locator('[data-ux3="dzwieki"]').scrollIntoViewIfNeeded(); }, scope: '.more-list' },
    { n: "390-ciemny-ustawienia", o: { w: 390, h: 844, hash: "/ustawienia", dark: true }, run: async (p) => { await p.locator('[data-ux3="dzwieki"]').scrollIntoViewIfNeeded(); }, scope: '.more-list' },
    { n: "390-jasny-combo3", o: { w: 390, h: 844, ls: { "bm-dzwieki": "0" } }, run: toCombo(3), scope: ".lp" },
    { n: "1280-jasny-zla-stas", o: { w: 1280, h: 900 }, run: toWrong, scope: ".lp" },
    { n: "1280-ciemny-combo3", o: { w: 1280, h: 900, dark: true, ls: { "bm-dzwieki": "0" } }, run: toCombo(3), scope: ".lp" },
    { n: "390-en-zla-stas", o: { w: 390, h: 844, lang: "en" }, run: toWrong, scope: ".lp" },
    { n: "390-en-ustawienia", o: { w: 390, h: 844, lang: "en", hash: "/ustawienia" }, run: async (p) => { await p.locator('[data-ux3="dzwieki"]').scrollIntoViewIfNeeded(); }, scope: '.more-list' },
    { n: "360-reduced-combo3", o: { motion: "reduce", ls: { "bm-dzwieki": "0" } }, run: toCombo(3), scope: ".lp", motion: true },
    { n: "360-calm-combo3", o: { ls: { "skrot-calm": "1", "bm-dzwieki": "0" } }, run: toCombo(3), scope: ".lp", motion: true },
    { n: "390-pink-zla", o: { w: 390, h: 844, theme: "pink" }, run: toWrong, scope: ".lp", other: true },
    { n: "390-noc-combo3", o: { w: 390, h: 844, theme: "noc", ls: { "bm-dzwieki": "0" } }, run: toCombo(3), scope: ".lp", other: true },
  ],
  1: [
    { n: "360-jasny-zla", o: {}, run: toWrong, scope: ".lp" },
    { n: "360-ciemny-zla", o: { dark: true }, run: toWrong, scope: ".lp" },
    { n: "360-jasny-dobra", o: {}, run: toRight, scope: ".lp" },
    { n: "360-ciemny-dobra", o: { dark: true }, run: toRight, scope: ".lp" },
    { n: "375-jasny-zla", o: { w: 375, h: 812 }, run: toWrong, scope: ".lp" },
    { n: "390-jasny-zla", o: { w: 390, h: 844 }, run: toWrong, scope: ".lp" },
    { n: "390-ciemny-zla", o: { w: 390, h: 844, dark: true }, run: toWrong, scope: ".lp" },
    { n: "1280-jasny-zla", o: { w: 1280, h: 900 }, run: toWrong, scope: ".lp" },
    { n: "1280-ciemny-dobra", o: { w: 1280, h: 900, dark: true }, run: toRight, scope: ".lp" },
    { n: "390-en-zla", o: { w: 390, h: 844, lang: "en" }, run: toWrong, scope: ".lp" },
    { n: "360-reduced-zla", o: { motion: "reduce" }, run: toWrong, scope: ".lp", motion: true },
    { n: "360-calm-zla", o: { ls: { "skrot-calm": "1" } }, run: toWrong, scope: ".lp", motion: true },
    { n: "390-pink-zla", o: { w: 390, h: 844, theme: "pink" }, run: toWrong, scope: ".lp", other: true },
    { n: "390-noc-zla", o: { w: 390, h: 844, theme: "noc" }, run: toWrong, scope: ".lp", other: true },
    { n: "390-jasny-powtorki", o: { w: 390, h: 844, hash: "/review" }, run: async () => {}, scope: ".rv-hero" },
    { n: "390-ciemny-powtorki", o: { w: 390, h: 844, hash: "/review", dark: true }, run: async () => {}, scope: ".rv-hero" },
  ],
};
const scenes = (globalThis.UX3_SCENES || SC)[ETAP] || [];
const b = await chromium.launch();
const R = { etap: +ETAP, runda: +RUNDA, sceny: [] };
for (const s of scenes) {
  const p = await open(b, s.o);
  const anims = new Set();
  await p.exposeFunction("__anim", (n) => anims.add(n)).catch(() => {});
  await p.evaluate(() => document.addEventListener("animationstart", (e) => window.__anim?.(e.animationName), true));
  try { await s.run(p); } catch (e) { p.errors.push("scena: " + String(e).slice(0, 200)); }
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${DIR}${s.n}.png` });
  await p.addScriptTag({ content: AXE });
  const axe = await p.evaluate(async (sc) => {
    const ctx = document.querySelector(sc) ? sc : document;
    const r = await window.axe.run(ctx, { runOnly: { type: "rule", values: ["color-contrast", "target-size"] }, resultTypes: ["violations"] });
    return r.violations.map((v) => ({ id: v.id, n: v.nodes.length, nodes: v.nodes.slice(0, 6).map((x) => ({ cel: x.target.join(" "), info: (x.any[0]?.message || "").slice(0, 160) })) }));
  }, s.scope);
  const own = contrastFails(await textContrast(p, s.scope));
  const small = await p.evaluate((sc) => [...document.querySelectorAll(`${sc} button, ${sc} a, ${sc} [role=button], ${sc} input`)].filter((e) => { const r = e.getBoundingClientRect(), c = getComputedStyle(e); return r.width > 0 && r.height > 0 && c.visibility !== "hidden" && (r.width < 44 || r.height < 44) && !e.closest(".lp-text, .lp-big, .lp-quote") && !e.classList.contains("lp-term"); }).map((e) => ({ el: (e.className || e.tagName).toString().slice(0, 50), t: (e.textContent || e.getAttribute("aria-label") || "").trim().slice(0, 30), w: Math.round(e.getBoundingClientRect().width), h: Math.round(e.getBoundingClientRect().height) })), s.scope);
  const hs = await p.evaluate(() => ({ sw: Math.max(document.documentElement.scrollWidth, document.querySelector(".lp")?.scrollWidth || 0), w: innerWidth }));
  const running = await p.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && a.effect?.target?.closest?.(".lp, .rv-hero")).map((a) => a.animationName || a.constructor.name));
  R.sceny.push({ scena: s.n, axe, kontrast_ponizej_AA: own, cele_ponizej_44: small, przewijanie_w_bok: hs.sw > hs.w ? hs : false, konsola: p.errors, animacje: [...anims], animacje_teraz: running, ruch_wylaczony: s.motion ? [...anims].filter((a) => !/^(lp-float|none)$/.test(a)).length === 0 : null, inny_motyw: !!s.other });
  await p.close();
}
await b.close();
fs.writeFileSync(DIR + "raport.json", JSON.stringify(R, null, 2));
const md = [`# UX-3 · etap ${ETAP} · runda ${RUNDA}: pomiary`, "", "| scena | axe | kontrast < AA | cele < 44 px | przewijanie w bok | konsola | animacje | ruch wyłączony |", "|---|---|---|---|---|---|---|---|"];
for (const x of R.sceny) md.push(`| ${x.scena} | ${x.axe.map((v) => v.id + "×" + v.n).join(", ") || "0"} | ${x.kontrast_ponizej_AA.length} | ${x.cele_ponizej_44.length ? x.cele_ponizej_44.map((c) => `${c.t || c.el} ${c.w}×${c.h}`).join("; ") : "0"} | ${x.przewijanie_w_bok ? "TAK" : "nie"} | ${x.konsola.length} | ${x.animacje.join(", ") || "—"} | ${x.ruch_wylaczony == null ? "—" : x.ruch_wylaczony ? "tak" : "NIE"} |`);
md.push("", "Szczegóły (axe, kontrast, cele) w `raport.json`. Zrzuty: pliki `*.png` w tym katalogu.");
fs.writeFileSync(DIR + "pomiary.md", md.join("\n") + "\n");
console.log(md.join("\n"));
