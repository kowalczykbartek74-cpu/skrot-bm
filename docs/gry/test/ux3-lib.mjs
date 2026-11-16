// Pętla UX-3 (lekcja: reakcja, tempo, ekran końca): wspólne dane i pomocniki testów ux3-etap*.mjs.
// Lekcje testowe mają długie pytania (3 linie przy 360 px), 4 odpowiedzi po ~12 słów, „Dlaczego” i „Czemu nie”.
// BASE=http://127.0.0.1:8813/ OUT=/tmp/ux-3 node docs/gry/test/ux3-etapN.mjs   (SHOTS=katalog → zrzuty do raportu)
import fs from "fs";
import { chromium, BASE, OUT, page } from "./lib.mjs";
export { chromium, BASE, OUT };
export const UID = "00000000-0000-4000-8000-000000000001";
export const A = "analiza-matematyczna";
const LONGQ = (k) => `Część ${k + 1}: która z poniższych odpowiedzi najlepiej opisuje, co dzieje się z popytem na dobro, gdy jego cena rośnie, a wszystkie inne czynniki pozostają bez zmian?`;
const OPTS = [
  "Właściwie: popyt maleje, bo przy wyższej cenie kupujący chcą kupić mniej tego dobra",
  "Błędnie: popyt rośnie, bo wyższa cena zawsze oznacza lepszą jakość tego samego dobra",
  "Błędnie: popyt zostaje bez zmian, bo cena nie ma wpływu na decyzje kupujących na rynku",
  "Błędnie: popyt znika całkowicie, bo żaden kupujący nie zapłaci więcej za to samo dobro",
];
export const WHY = "Prawo popytu mówi, że przy innych czynnikach bez zmian wyższa cena zmniejsza ilość, którą kupujący chcą nabyć. Dzieje się tak z dwóch powodów: dobro staje się relatywnie droższe od zamienników (efekt substytucyjny), a za te same pieniądze można kupić mniej (efekt dochodowy). Wyjątki, takie jak dobra Giffena czy dobra luksusowe kupowane dla prestiżu, są rzadkie i na kolokwium trzeba je wyraźnie uzasadnić. W zadaniach zakładamy więc ujemne nachylenie krzywej popytu.";
const NOT = { 1: "Wyższa cena nie zmienia jakości dobra. Mylisz popyt z oczekiwaniami co do jakości.", 2: "Cena wpływa na decyzje kupujących, to podstawa prawa popytu.", 3: "Popyt zwykle maleje stopniowo, a nie znika całkowicie." };
const sec = (i, o = {}) => ({ h: `${i + 1}. Temat ${i + 1}`, body: o.body || `Akapit ${i + 1}. Krótki tekst o popycie i cenie, bez pogrubionych pojęć, żeby karta była do przeczytania.`, check: { q: LONGQ(i), options: OPTS, correct: 0, why: WHY, not: NOT } });
export const lesson = (n = 4, o = {}) => ({ v2: true, sections: Array.from({ length: n }, (_, i) => sec(i, o)), exit: [0, 1, 2].map((i) => ({ q: `Bilet ${i + 1}: czy prawo popytu mówi, że wyższa cena zmniejsza ilość kupowaną?`, options: ["Tak, przy innych czynnikach bez zmian", "Nie, zawsze ją zwiększa"], correct: 0, why: "Tak mówi prawo popytu." })), recap: null, exercises: [], faded: {}, formulas: [] });
const mat = (order, title) => ({ subjectId: A, kind: "lesson", order, unit: 1, unitTitle: "Dział", title, minutes: 20, quizCount: 10, flashcardCount: 0, conceptCount: 0, createdAt: Date.now(), v: 2 });
const quiz = () => Array.from({ length: 10 }, (_, i) => ({ q: `Quiz ${i + 1}?`, options: ["Dobra", "Zła", "Zła 2", "Zła 3"], correct: 0 }));
const content = (L) => ({ v: 2, lesson: L, quiz: quiz(), flashcards: [], concepts: [], notes: [], tldr: "" });
export function docsWith(lessons) {
  const materials = {}, materialContent = {};
  lessons.forEach(([id, title, L], i) => { materials[id] = mat(i + 1, title); materialContent[id] = content(L); });
  return { materials, materialContent, meta: { po: { items: {} }, stas: { items: {} } } };
}
export const docs = docsWith([["U1", "Lekcja 1: Popyt i cena", lesson(4)], ["U2", "Lekcja 2: Podaż", lesson(4)]]);
export async function open(b, o = {}) {
  const d = o.docs || docs;
  const ls = { "mock-docs": JSON.stringify(d), "mock-progress": JSON.stringify({ [UID]: o.progress || {} }), "bm-ld-flag": "1", ...(o.theme ? { "skrot-theme": o.theme } : {}), ...(o.ls || {}) };
  const p = await page(b, { konto: o.konto || "platne", w: o.w || 360, h: o.h || 640, lang: o.lang || "pl", ls, ctx: { ...(o.dark ? { colorScheme: "dark" } : {}), ...(o.motion ? { reducedMotion: o.motion } : {}) } });
  if (o.init) await p.addInitScript(o.init);
  await p.clock.setFixedTime(new Date(o.now || "2026-11-06T17:00:00+01:00"));
  await p.goto(BASE + "index.html#" + (o.hash || "/material/U1")); await p.waitForTimeout(o.wait ?? 2500);
  for (let i = 0; i < 3 && await p.locator("#layer .scrim").count(); i++) { await p.keyboard.press("Escape"); await p.waitForTimeout(300); }
  return p;
}
export async function startLesson(p) { await p.locator(".lp-start").click(); await p.locator(".lp").waitFor({ timeout: 10000 }); await p.waitForTimeout(500); }
export function tester() {
  let pass = 0, fail = 0; const log = [];
  const ok = (name, cond, info) => { const l = cond ? `✓ ${name}` : `✗ ${name} ${JSON.stringify(info ?? "").slice(0, 400)}`; log.push(l); console.log(l); cond ? pass++ : fail++; };
  const end = () => { console.log(`${pass}/${pass + fail}`); if (process.env.LOG) fs.writeFileSync(process.env.LOG, log.join("\n") + `\n${pass}/${pass + fail}\n`); process.exit(fail ? 1 : 0); };
  return { ok, end, stats: () => ({ pass, fail }) };
}
// Kontrast WCAG z kolorów rgb()/rgba() (alfa mieszana z tłem).
const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const rgb = (c) => (String(c).match(/[\d.]+/g) || [0, 0, 0]).map(Number);
const lum = (c) => { const m = rgb(c); return 0.2126 * lin(m[0]) + 0.7152 * lin(m[1]) + 0.0722 * lin(m[2]); };
export const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
// Tekst i jego faktyczne tło (pierwszy przodek z nieprzezroczystym tłem) dla każdego węzła tekstowego w el.
export async function textContrast(p, sel) {
  return p.evaluate((sel) => {
    const out = [];
    const bgOf = (e) => { for (let x = e; x; x = x.parentElement) { const c = getComputedStyle(x).backgroundColor; const m = c.match(/[\d.]+/g); if (m && (m.length < 4 || +m[3] > 0.9)) return c; } return "rgb(255,255,255)"; };
    document.querySelectorAll(sel).forEach((root) => {
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        const t = n.textContent.trim(); if (!t) continue; const e = n.parentElement; const cs = getComputedStyle(e);
        if (cs.visibility === "hidden" || cs.display === "none" || e.closest("[aria-hidden=true]") && !e.closest(".lp-fb-xp")) continue;
        const r = e.getBoundingClientRect(); if (!r.width) continue;
        out.push({ t: t.slice(0, 40), fg: cs.color, bg: bgOf(e), fs: parseFloat(cs.fontSize), fw: +cs.fontWeight });
      }
    });
    return out;
  }, sel);
}
export const contrastFails = (list) => list.map((x) => ({ ...x, r: Math.round(cr(x.fg, x.bg) * 100) / 100 })).filter((x) => x.r < ((x.fs >= 24 || (x.fs >= 18.66 && x.fw >= 700)) ? 3 : 4.5));
// Przechodzi do karty spełniającej warunek (np. mc z kontrolą części), klikając „Dalej” na kartach do czytania.
export async function goToCard(p, test, max = 40) {
  for (let i = 0; i < max; i++) {
    const info = await p.evaluate(() => { const LP = window.ZD_APP?.LP; const c = LP?.open ? window.ZD_APP.lpCur() : null; return !LP?.open ? null : c ? { id: c.id, type: c.type, check: !!c.check, again: !!c.again, exit: !!c.exit, done: LP.st.ans[c.id] != null } : { end: true }; });
    if (!info) return null;
    if (!info.end && test(info)) return info;
    if (await p.locator(".lp-done-screen, .lp-step").count()) { const c = p.locator(".lp-bottom .lp-cta:not([disabled]):not([hidden])"); if (await c.count()) { await c.click(); await p.waitForTimeout(450); continue; } }
    if (info.type === "hook" && !info.done) { await p.locator(".lp-opts .opt").first().click(); await p.waitForTimeout(200); }
    else if ((info.type === "mc" || info.type === "rvmc") && !info.done) { await answer(p, true); }
    const cta = p.locator(".lp-bottom .lp-cta:not([disabled]):not([hidden])");
    if (await cta.count()) { await cta.click(); await p.waitForTimeout(420); } else await p.waitForTimeout(250);
  }
  return null;
}
// Odpowiada na kartę mc: good = opcja „Właściwie…”, inaczej „Błędnie…”. Działa i przy „zaznacz + Sprawdź” (etap 3), i przy starym jednym kliknięciu.
export async function answer(p, good, conf) {
  const opt = p.locator(".lp-opts .opt:not([disabled])").filter({ hasText: good ? /^.?Właściwie|Dobra|Tak, przy/ : /Błędnie|Zła|Nie, zawsze/ }).first();
  await opt.click(); await p.waitForTimeout(120);
  const sure = p.locator(`.lp-bottom [data-conf="${conf ?? 1}"]:not([disabled])`);
  if (await sure.count()) { await sure.click(); await p.waitForTimeout(350); return; }
  const chk = p.locator(".lp-bottom .lp-cta:not([disabled]):not([hidden])").filter({ hasText: /^(Sprawdź|Check)/ });
  if (await chk.count()) await chk.click();
  await p.waitForTimeout(350);
}
export function shotsDir() { const d = process.env.SHOTS; if (d) fs.mkdirSync(d, { recursive: true }); return d; }
export async function noHScroll(p) { return p.evaluate(() => ({ sw: Math.max(document.documentElement.scrollWidth, document.querySelector(".lp")?.scrollWidth || 0), w: innerWidth })); }
