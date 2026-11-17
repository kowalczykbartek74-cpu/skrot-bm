// Wspólne dla testów pętli UX-5 (nagrody, ranking, udostępnianie): otwieranie strony na atrapie, pomiary jak w dzis-review.mjs
// (axe-core: kontrast i cele dotyku; własny pomiar kontrastu każdego tekstu; cele < 44 px; poziome przewijanie; ruch) i zapis raportu.
// BASE=http://127.0.0.1:8815/ OUT=/tmp/ux-5 node docs/gry/test/ux5-etapN.mjs
import fs from "fs";
import { createRequire } from "module";
import { chromium, BASE, OUT, page } from "./lib.mjs";
export { chromium, BASE, OUT };
export const UID = "00000000-0000-4000-8000-000000000001";
const require = createRequire(process.env.PW_FROM || process.env.HOME + "/matura-app/package.json");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

// Dane kursu: dwa przedmioty z dwoma działami; lekcje bez bookRef/sylRef (sprawdza „rozdz. undefined”), długi tytuł (przewijanie).
export const A = "analiza-matematyczna", M = "logistyka", Z = "podstawy-zarzadzania";
const sec = (t, i) => ({ h: `${i + 1}. ${t} ${i + 1}`, body: `Akapit ${i + 1} o **pojęciu ${i + 1}** w temacie ${t}.`, check: { q: `Check ${t} ${i + 1}?`, options: ["Dobrze", "Źle"], correct: 0 } });
const lesson = (t) => ({ intro: `Krótko o temacie ${t}.`, sections: [0, 1, 2, 3, 4, 5].map((i) => sec(t, i)), exit: [0, 1, 2].map((i) => ({ q: `Bilet ${t} ${i + 1}?`, options: ["Tak", "Nie"], correct: 0 })), recap: { prompt: `Wyjaśnij ${t}.`, keys: ["a"], model: "Wzór." }, exercises: [{ task: "Ćwiczenie", answer: "1", level: 2 }], faded: {}, formulas: [] });
const quiz = (t) => Array.from({ length: 10 }, (_, i) => ({ q: `Quiz ${t} ${i + 1}?`, options: ["Dobra", "Zła", "Zła 2", "Zła 3"], correct: 0 }));
const concepts = (t) => Array.from({ length: 8 }, (_, i) => ({ term: `Term ${t} ${i}`, definition: `Definicja ${i}.` }));
const mat = (sid, order, title, unit = 1, unitTitle = "Pochodne i granice") => ({ subjectId: sid, kind: "lesson", order, unit, unitTitle, title, minutes: 35, quizCount: 10, flashcardCount: 0, conceptCount: 8, createdAt: Date.now(), v: 2 });
const content = (t) => ({ v: 2, lesson: lesson(t), quiz: quiz(t), flashcards: [], concepts: concepts(t), notes: [], tldr: "" });
export const docs = {
  materials: {
    A1: mat(A, 1, "Lekcja 1: Pochodne funkcji"), A2: mat(A, 2, "Lekcja 2: Całki oznaczone"),
    A3: mat(A, 3, "Lekcja 3: Ekstrema funkcji wielu zmiennych i warunki konieczne istnienia ekstremum lokalnego", 2, "Funkcje wielu zmiennych"),
    M1: mat(M, 1, "Lekcja 1: Łańcuch dostaw", 1, "Podstawy"), M2: mat(M, 2, "Lekcja 2: Zapasy i magazyny", 1, "Podstawy"), Z1: mat(Z, 1, "Lekcja 1: Funkcje zarządzania", 1, "Wstęp"),
  },
  materialContent: { A1: content("pochodne"), A2: content("całki"), A3: content("ekstrema"), M1: content("łańcuch"), M2: content("zapasy"), Z1: content("funkcje") },
  meta: { po: { items: {} }, stas: { items: {} } },
};
// Postęp: lekcja zrobiona (zdany bilet) = done + mastery.ok; lv = dni powtórek (1 = utrwalona, 3 = opanowana).
export const prog = (o = {}) => JSON.stringify({ [UID]: o });
export async function open(b, o = {}) {
  const ls = { "mock-docs": JSON.stringify(o.docs || docs), "mock-progress": o.progress || prog({}), "bm-ld-flag": "1", "skrot-green": o.dark ? "dark" : "light", ...(o.ls || {}) };
  const p = await page(b, { konto: o.konto || "platne", w: o.w || 390, h: o.h || 844, lang: o.lang || "pl", ls, ctx: o.dark ? { colorScheme: "dark" } : {} });
  await p.clock.setFixedTime(new Date(o.time || "2026-11-06T17:00:00+01:00"));
  if (o.fonts !== false) await p.context().route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (r) => r.continue());
  if (o.motion) await p.emulateMedia({ reducedMotion: o.motion });
  if (o.init) await p.addInitScript(o.init);
  await p.goto(BASE + "index.html?ld=1#" + (o.hash || "/")); await p.waitForTimeout(o.wait ?? 2500);
  return p;
}
export function tester() {
  let pass = 0, fail = 0; const log = [];
  const ok = (name, cond, info) => { const l = (cond ? "✓ " : "✗ ") + name + (cond ? "" : " " + JSON.stringify(info ?? "").slice(0, 400)); log.push(l); console.log(l); cond ? pass++ : fail++; return !!cond; };
  return { ok, log, wynik: () => ({ pass, fail }), end: () => { console.log(`${pass}/${pass + fail}`); return fail; } };
}

// ---------- pomiary (jak dzis-review.mjs) ----------
export async function axe(p) {
  await p.addScriptTag({ content: AXE });
  return p.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: { type: "rule", values: ["color-contrast", "target-size"] }, resultTypes: ["violations"] });
    return r.violations.map((v) => ({ id: v.id, n: v.nodes.length, nodes: v.nodes.slice(0, 12).map((x) => ({ cel: x.target.join(" "), html: x.html.slice(0, 140), info: (x.any[0]?.message || "").slice(0, 160) })) }));
  });
}
// Własny pomiar kontrastu każdego widocznego tekstu (root = selektor; domyślnie cała strona bez #login).
export const kontrast = (p, root = "body") => p.evaluate((root) => {
  const rgba = (c) => { const f = /^color\(srgb/.test(c), m = (c.replace(/^color\(srgb/, "").match(/[\d.]+/g) || []).map(Number); if (m.length < 3) return null; const k = f ? 255 : 1; return { r: m[0] * k, g: m[1] * k, b: m[2] * k, a: m.length > 3 ? m[3] : 1 }; };
  const over = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
  const L = (c) => [c.r, c.g, c.b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
  const ratio = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const probe = document.createElement("i"); probe.style.color = getComputedStyle(document.documentElement).getPropertyValue("--paper").trim() || "#fff"; document.body.append(probe);
  const paper = rgba(getComputedStyle(probe).color); probe.remove();
  const stops = (e) => { const bi = getComputedStyle(e).backgroundImage; if (!/gradient/.test(bi) || e === document.body || e.tagName === "MAIN") return null; const cs = (bi.match(/rgba?\([^)]*\)/g) || []).map(rgba).filter((c) => c.a > 0.5); return cs.length ? cs : null; };
  const bgsOf = (el) => { const st = []; let g = null; for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const c = rgba(getComputedStyle(e).backgroundColor); const gs = stops(e); if (gs && !(c && c.a >= 1)) { g = gs; break; } if (c && c.a > 0) { st.push(c); if (c.a >= 1) break; } } const bases = g ? g.map((c) => ({ ...c, a: 1 })) : [paper]; return bases.map((b0) => { let b = b0; for (let i = st.length - 1; i >= 0; i--) b = over(st[i], b); return b; }); };
  const out = [], seen = new Set(), base = document.querySelector(root) || document.body, w = document.createTreeWalker(base, NodeFilter.SHOW_TEXT); let n = 0;
  for (let t; (t = w.nextNode());) {
    const el = t.parentElement, s = t.textContent.trim(); if (!s || !el || seen.has(el)) continue; seen.add(el);
    if (el.closest("svg, script, style, [hidden], #skrot-wm, #login, details:not([open]) > :not(summary)")) continue;
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el); if (!r.width || !r.height || cs.visibility === "hidden" || +cs.opacity === 0) continue; n++;
    let op = 1; for (let e = el; e; e = e.parentElement) op *= +getComputedStyle(e).opacity;
    const px = parseFloat(cs.fontSize), big = px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700), need = big ? 3 : 4.5;
    const cr = Math.min(...bgsOf(el).map((bg) => ratio(over({ ...rgba(cs.color), a: rgba(cs.color).a * op }, bg), bg)));
    if (cr < need) out.push({ tekst: s.slice(0, 50), cel: (el.className && typeof el.className === "string" ? "." + el.className.split(" ").join(".") : el.tagName), kontrast: +cr.toFixed(2), wymagany: need, px });
    else if (px < 12) out.push({ tekst: s.slice(0, 50), cel: el.tagName, kontrast: +cr.toFixed(2), maly: px });
  }
  return { n, out };
}, root);
// Cele dotyku < 44×44 px (root = selektor obszaru etapu; domyślnie #main i #layer).
export const cele = (p, root = "#main, #layer") => p.evaluate((root) => [...document.querySelectorAll(root.split(",").map((r) => r.trim() + " :is(button, a[href], input, select, summary, label, [role=button], [tabindex='0'])").join(","))].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.height && getComputedStyle(e).visibility !== "hidden" && !e.closest("[hidden], details:not([open]) > :not(summary)") && (Math.round(r.width) < 44 || Math.round(r.height) < 44) && !(e.tagName === "INPUT" && e.closest("label")); }).map((e) => { const r = e.getBoundingClientRect(); return { cel: e.tagName + (typeof e.className === "string" && e.className ? "." + e.className.split(" ").join(".") : ""), tekst: (e.innerText || e.getAttribute("aria-label") || "").trim().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height) }; }), root);
export const poziomo = (p) => p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, poziomo: document.documentElement.scrollWidth > innerWidth }));
export const tekst = (p, sel = "#main") => p.evaluate((sel) => (document.querySelector(sel)?.innerText || ""), sel);
// Ruch: nazwy animacji wskazanych elementów (przy reduced-motion i html.calm mają być „none”).
export const ruch = (p, sels) => p.evaluate((sels) => Object.fromEntries(sels.map((s) => { const e = document.querySelector(s); return [s, e ? getComputedStyle(e).animationName + " " + getComputedStyle(e).animationDuration : "brak"]; })), sels);
// Zrzut całej strony bez przyklejonych pasków.
export async function zrzut(p, path, full = true) {
  if (full) await p.evaluate(() => document.querySelectorAll("body *").forEach((e) => { const c = getComputedStyle(e); if (c.position === "fixed" || c.position === "sticky") { e.dataset.uxHid = "1"; e.style.visibility = "hidden"; } }));
  await p.screenshot({ path, fullPage: full });
  if (full) await p.evaluate(() => document.querySelectorAll("[data-ux-hid]").forEach((e) => { e.style.visibility = ""; delete e.dataset.uxHid; }));
}
// Polskie słowa w tekście EN (brak tłumaczenia).
export const polskie = (p, sel = "#main") => p.evaluate((sel) => {
  const out = [], root = document.querySelector(sel); if (!root) return out; const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let t; (t = w.nextNode());) { const s = t.textContent.trim(); if (!s || t.parentElement.closest('[translate="no"],[lang="pl"],script,style,[hidden]')) continue; if (/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]|\b(lekcji|lekcja|lekcje|dział|zrobiona|nagroda|monet|monety)\b/i.test(s)) out.push(s); }
  return [...new Set(out)].slice(0, 30);
}, sel);

// Pomiar jednego ekranu: zrzuty + axe + kontrast + cele + przewijanie + błędy. Zwraca wiersz raportu.
export async function zmierz(p, dir, nazwa, o = {}) {
  fs.mkdirSync(dir, { recursive: true });
  await p.screenshot({ path: `${dir}${nazwa}-ekran1.png` });
  if (o.full !== false) await zrzut(p, `${dir}${nazwa}.png`);
  const a = await axe(p), K = await kontrast(p, o.root || "body"), C = await cele(p, o.cele || "#main, #layer");
  // o.root = okno (#layer): przewijanie w bok liczymy dla elementów okna (strona pod oknem to inny ekran).
  const P = o.root && o.root !== "body" ? await p.evaluate((r) => { const els = [...document.querySelectorAll(r + " *")]; const mx = Math.max(0, ...els.map((e) => e.getBoundingClientRect().right)); return { sw: Math.round(mx), iw: innerWidth, poziomo: mx > innerWidth + 1, strona: document.documentElement.scrollWidth }; }, o.root) : await poziomo(p);
  return { nazwa, axe: a.map((v) => ({ id: v.id, n: v.n, nodes: v.nodes })), tekstow: K.n, kontrast: K.out, cele44: C, ...P, bledy: [...p.errors] };
}
export function zapiszRaport(dir, tytul, R, extra = []) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(dir + "raport.json", JSON.stringify(R, null, 1));
  const ek = R.ekrany || [];
  const md = [`# ${tytul}`, "", `Data: ${new Date().toISOString().slice(0, 16)} · BASE ${BASE}`, "",
    "Kontrast: własny pomiar każdego widocznego tekstu (tekst ≥ 4,5:1, duży ≥ 3:1; tło z przodków; tekst < 12 px też zgłaszany) + axe-core (color-contrast, target-size). Cele dotyku: każdy przycisk/link/pole w #main i #layer ≥ 44×44 px.", "",
    "| ekran | sprawdzone teksty | teksty < AA / < 12 px | axe | cele < 44 px | poziome przewijanie | błędy konsoli |", "|---|---|---|---|---|---|---|",
    ...ek.map((x) => `| ${x.nazwa} | ${x.tekstow} | ${x.kontrast.length} | ${x.axe.map((v) => `${v.id}: ${v.n}`).join(", ") || "0"} | ${x.cele44.length} | ${x.poziomo ? `TAK (${x.sw} > ${x.iw})` : "nie"} | ${x.bledy.length} |`),
    "", "## Testy etapu", "", "```", ...(R.testy || []), "```", "", ...extra,
    "", "## Szczegóły", ...ek.flatMap((x) => [...x.kontrast.map((k) => `- ${x.nazwa} · kontrast \`${k.cel}\` „${k.tekst}” ${k.kontrast}:1${k.maly ? ` (${k.maly} px)` : ` < ${k.wymagany}:1`}`), ...x.cele44.map((c) => `- ${x.nazwa} · cel \`${c.cel}\` „${c.tekst}” ${c.w}×${c.h}`), ...x.axe.flatMap((v) => v.nodes.map((d) => `- ${x.nazwa} · axe ${v.id} · \`${d.cel}\` · ${d.info}`)), ...x.bledy.map((e) => `- ${x.nazwa} · konsola: ${e.slice(0, 200)}`)])].join("\n");
  fs.writeFileSync(dir + "raport.md", md + "\n");
}
