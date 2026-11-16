// Pętla UX-4 (wygląd): wspólne pomiary dla testów ux4-*.mjs. Dane i zegar jak w h2-lib.mjs (6.11.2026 17:00).
// Bez dostępu do sieci zewnętrznej (lib.mjs blokuje wszystko spoza 127.0.0.1): czcionki muszą przyjść z repo.
import fs from "fs";
import { createRequire } from "module";
import { chromium, BASE, open as open0, docs, tester } from "./h2-lib.mjs";
export { chromium, BASE, tester, docs };
export const OUT = process.env.OUT || "/tmp/ux-4";
fs.mkdirSync(OUT, { recursive: true });
const require = createRequire(process.env.PW_FROM || process.env.HOME + "/matura-app/package.json");
export const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
// Jeden termin z datą (Podstawy zarządzania), żeby na Dziś i w Przedmiotach były pigułki terminów.
export const DOCS = { ...docs, deadlines: { est1: { title: "Projekt: Podstawy zarządzania", type: "projekt", subjectId: "podstawy-zarzadzania", date: "2026-11-25", approx: true, createdAt: Date.now() } } };
export const open = (b, o = {}) => open0(b, { ...o, ls: { "mock-docs": JSON.stringify(DOCS), ...(o.ls || {}) } });
// Główne ekrany pętli (K2 W1): adres → nazwa.
export const EKRANY = [
  ["/", "dzis"], ["materials", "przedmioty"], ["subject/analiza-matematyczna", "przedmiot"], ["review", "powtorki"],
  ["terms", "terminy"], ["calendar", "kalendarz"], ["more", "wiecej"], ["shop", "sklep"], ["profil", "profil"], ["ustawienia", "ustawienia"],
  ["glossary", "slowniczek"], ["guide", "przewodnik"],
];
export async function goto(p, hash, wait = 1600) {
  await p.evaluate((h) => { location.hash = "#/" + h; }, hash);
  await p.waitForTimeout(wait);
}
// Kroje i rozmiary nagłówków oraz teksty < 12 px (poza #skrot-wm).
export const typo = (p) => p.evaluate(() => {
  const vis = (e) => { const r = e.getBoundingClientRect(), c = getComputedStyle(e); return r.width > 0 && r.height > 0 && c.visibility !== "hidden" && +c.opacity > 0 && !e.closest("[hidden], details:not([open]) > :not(summary)"); };
  const fam = (e) => getComputedStyle(e).fontFamily.split(",")[0].replace(/["']/g, "").trim();
  const heads = [...document.querySelectorAll("#main :is(h1,h2,h3), #layer :is(h1,h2,h3)")].filter(vis).map((e) => ({ tag: e.tagName, cls: e.className, t: e.textContent.trim().slice(0, 40), fam: fam(e), px: +parseFloat(getComputedStyle(e).fontSize).toFixed(2), w: getComputedStyle(e).fontWeight }));
  const small = [], seen = new Set(), w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let t; (t = w.nextNode());) {
    const el = t.parentElement, s = t.textContent.trim(); if (!s || !el || seen.has(el)) continue; seen.add(el);
    if (el.closest("svg, script, style, #skrot-wm, #login, noscript")) continue;
    if (!vis(el)) continue;
    const px = parseFloat(getComputedStyle(el).fontSize); if (px < 11.995) small.push({ t: s.slice(0, 30), cel: el.tagName + (typeof el.className === "string" && el.className ? "." + el.className.split(" ").join(".") : ""), px: +px.toFixed(2) });
  }
  return { heads, small };
});
// Emoji widoczne w interfejsie (poza treściami pisanymi przez ludzi: .md, materiały, ogłoszenia).
export const emoji = (p, root = "#main, header.bar, nav, #layer") => p.evaluate((root) => {
  const out = [], w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let t; (t = w.nextNode());) {
    const el = t.parentElement; if (!el || !el.closest(root) || el.closest("script, style, [hidden], .ann-text, .announce .md, .md, [data-ludzie]")) continue;
    const m = t.textContent.match(/\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F/gu); if (!m) continue;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
    out.push({ e: m.join(""), t: t.textContent.trim().slice(0, 40), cel: el.tagName + (typeof el.className === "string" && el.className ? "." + el.className.split(" ")[0] : "") });
  }
  return out;
}, root);
// Faktyczne pole trafienia: sonda elementFromPoint w siatce wokół elementu (krok 1 px po krawędziach), zwraca szerokość i wysokość
// obszaru, w którym trafienie wpada w element (albo jego potomka).
export const hit = (p, sel) => p.evaluate((sel) => [...document.querySelectorAll(sel)].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.height && getComputedStyle(e).visibility !== "hidden" && !e.closest("[hidden], details:not([open]) > :not(summary)"); }).map((e) => {
  e.scrollIntoView({ block: "center", inline: "center" });
  const r = e.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const inn = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === e || e.contains(t)); };
  const span = (dx, dy) => { let d = 0; for (let i = 1; i < 60; i++) { if (inn(cx + dx * i, cy + dy * i)) d = i; else break; } return d; };
  const W = inn(cx, cy) ? span(-1, 0) + span(1, 0) + 1 : 0, H = inn(cx, cy) ? span(0, -1) + span(0, 1) + 1 : 0;
  return { sel, cel: e.tagName + (typeof e.className === "string" && e.className ? "." + e.className.split(" ").join(".") : ""), t: (e.innerText || e.getAttribute("aria-label") || "").trim().slice(0, 30), w: W, h: H, vw: Math.round(r.width), vh: Math.round(r.height) };
}), sel);
export const poziomo = (p) => p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
export async function axe(p, rules = ["color-contrast", "target-size"]) {
  if (!(await p.evaluate(() => !!window.axe))) await p.addScriptTag({ content: AXE });
  return p.evaluate(async (rules) => {
    const r = await window.axe.run(document, { runOnly: { type: "rule", values: rules }, resultTypes: ["violations"] });
    return r.violations.map((v) => ({ id: v.id, n: v.nodes.length, nodes: v.nodes.slice(0, 8).map((x) => ({ cel: x.target.join(" "), info: (x.any[0]?.message || "").slice(0, 140) })) }));
  }, rules);
}
// Własny pomiar kontrastu każdego widocznego tekstu (jak dzis-review.mjs): tło z przodków, gradient = najgorszy przystanek.
export const kontrast = (p) => p.evaluate(() => {
  const rgba = (c) => { const f = /^color\(srgb/.test(c), m = (c.replace(/^color\(srgb/, "").match(/[\d.]+/g) || []).map(Number); if (m.length < 3) return null; const k = f ? 255 : 1; return { r: m[0] * k, g: m[1] * k, b: m[2] * k, a: m.length > 3 ? m[3] : 1 }; };
  const over = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
  const L = (c) => [c.r, c.g, c.b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
  const ratio = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const probe = document.createElement("i"); probe.style.color = getComputedStyle(document.documentElement).getPropertyValue("--paper").trim() || "#fff"; document.body.append(probe);
  const paper = rgba(getComputedStyle(probe).color); probe.remove();
  // Gradient-podkreślenie (np. background-size 0px 2px pod tytułem) nie jest tłem tekstu: pomijamy, gdy któryś wymiar < 8 px.
  const stops = (e) => { const cs0 = getComputedStyle(e), bi = cs0.backgroundImage; if (!/gradient/.test(bi) || e === document.body || e.tagName === "MAIN") return null; if ((cs0.backgroundSize.match(/[\d.]+px/g) || []).some((v) => parseFloat(v) < 8)) return null; const cs = (bi.match(/rgba?\([^)]*\)/g) || []).map(rgba).filter((c) => c.a > 0.5); return cs.length ? cs : null; };
  const bgsOf = (el) => { const st = []; let g = null; for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const c = rgba(getComputedStyle(e).backgroundColor); const gs = stops(e); if (gs && !(c && c.a >= 1)) { g = gs; break; } if (c && c.a > 0) { st.push(c); if (c.a >= 1) break; } } const bases = g ? g.map((c) => ({ ...c, a: 1 })) : [paper]; return bases.map((b0) => { let b = b0; for (let i = st.length - 1; i >= 0; i--) b = over(st[i], b); return b; }); };
  const out = [], seen = new Set(), w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n = 0;
  for (let t; (t = w.nextNode());) {
    const el = t.parentElement, s = t.textContent.trim(); if (!s || !el || seen.has(el)) continue; seen.add(el);
    if (el.closest("svg, script, style, [hidden], #skrot-wm, #login, details:not([open]) > :not(summary)")) continue;
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el); if (!r.width || !r.height || cs.visibility === "hidden" || +cs.opacity === 0) continue;
    if (rgba(cs.color)?.a === 0) continue; // celowo niewidoczny znak (np. ptaszek Terminów pokazywany przy najechaniu)
    n++;
    let op = 1; for (let e = el; e; e = e.parentElement) op *= +getComputedStyle(e).opacity;
    const px = parseFloat(cs.fontSize), big = px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700), need = big ? 3 : 4.5;
    const cr = Math.min(...bgsOf(el).map((bg) => ratio(over({ ...rgba(cs.color), a: rgba(cs.color).a * op }, bg), bg)));
    if (cr < need) out.push({ tekst: s.slice(0, 50), cel: (el.className && typeof el.className === "string" ? "." + el.className.split(" ").join(".") : el.tagName), kontrast: +cr.toFixed(2), wymagany: need });
  }
  return { n, out };
});
// Zrzuty ekranu w trzech szerokościach × jasny/ciemny (+ EN osobno w testach).
export const ROZMIARY = [[360, 640], [390, 844], [1280, 900]];
