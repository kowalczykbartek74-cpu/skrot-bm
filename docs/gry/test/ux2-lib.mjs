// Wspólne dla testów pętli UX-2 (nawyk, seria, powroty): otwarcie strony na atrapie z zegarem, pomiary jak w dzis-review.mjs
// (axe: kontrast i cele dotyku, własny kontrast każdego tekstu, cele < 44 px, poziome przewijanie, błędy konsoli, ruch)
// i zapis raportu rundy do docs/audyt-ux/petla-2/etap-X/runda-R/ (gdy ustawione RUNDA).
import fs from "fs";
import { createRequire } from "module";
import { chromium, BASE, page } from "./lib.mjs";
import { docs, UID } from "./h2-lib.mjs";
export { chromium, BASE, docs, UID };
const require = createRequire(process.env.PW_FROM || process.env.HOME + "/matura-app/package.json");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

// dayN: numer dnia od 1.01.2026 (czas lokalny), jak w index.html.
export const dayN = (iso) => { const [y, m, d] = iso.slice(0, 10).split("-").map(Number); return Math.round((new Date(y, m - 1, d) - new Date(2026, 0, 1)) / 864e5); };
export const DOCS = { ...docs, deadlines: { est1: { title: "Projekt: Podstawy zarządzania", type: "projekt", subjectId: "podstawy-zarzadzania", date: "2026-11-25", approx: true, createdAt: Date.now() } } };

// o: konto, w, h, lang, dark, prog (obiekt progress), czas (ISO z +01:00), ls, hash, calm, motion, fonts (domyślnie tak), wait
export async function open(b, o = {}) {
  const ls = { "mock-docs": JSON.stringify(o.docs || DOCS), "mock-progress": JSON.stringify({ [UID]: o.prog || {} }), "bm-ld-flag": "1", "skrot-green": o.dark ? "dark" : "light", ...(o.calm ? { "skrot-calm": "1" } : {}), ...(o.ls || {}) };
  const p = await page(b, { konto: o.konto || "platne", w: o.w || 390, h: o.h || 844, lang: o.lang || "pl", ls, ctx: { ...(o.dark ? { colorScheme: "dark" } : {}), ...(o.ctx || {}) } });
  await p.clock.setFixedTime(new Date(o.czas || "2026-11-06T17:00:00+01:00"));
  if (o.fonts !== false) await p.context().route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (r) => r.continue());
  if (o.motion) await p.emulateMedia({ reducedMotion: o.motion });
  await p.goto(BASE + "index.html" + (o.query || "?ld=1") + "#" + (o.hash || "/"));
  await p.waitForTimeout(o.wait ?? 2600);
  if (o.calm) await p.evaluate(() => document.documentElement.classList.add("calm"));
  return p;
}

export async function axe(p, root = "body") {
  if (!(await p.evaluate(() => !!window.axe))) await p.addScriptTag({ content: AXE });
  return p.evaluate(async (root) => {
    const r = await window.axe.run(document.querySelector(root) || document, { runOnly: { type: "rule", values: ["color-contrast", "target-size", "button-name", "aria-allowed-attr", "aria-valid-attr-value", "image-alt", "list", "listitem"] }, resultTypes: ["violations"] });
    return r.violations.map((v) => ({ id: v.id, n: v.nodes.length, nodes: v.nodes.slice(0, 12).map((x) => ({ cel: x.target.join(" "), html: x.html.slice(0, 140), info: (x.any[0]?.message || x.all[0]?.message || "").slice(0, 160) })) }));
  }, root);
}
// Kontrast każdego widocznego tekstu w root (jak dzis-review.mjs: tło = złożenie teł przodków, gradient = najgorszy kolor).
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
    else if (px < 12) out.push({ tekst: s.slice(0, 50), cel: el.tagName, kontrast: +cr.toFixed(2), wymagany: need, px, maly: true });
  }
  return { n, out };
}, root);
// Cele dotyku < 44×44 px w root (przyciski, linki, pola, podsumowania, etykiety).
export const cele = (p, root = "#main") => p.evaluate((root) => [...(document.querySelector(root) || document).querySelectorAll(":is(button, a[href], input, select, summary, label)")].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.height && getComputedStyle(e).visibility !== "hidden" && !e.closest("[hidden], details:not([open]) > :not(summary), .ld-lessons > :not(:first-child) *") && (Math.round(r.width) < 44 || Math.round(r.height) < 44) && !(e.tagName === "INPUT" && e.closest("label")); }).map((e) => { const r = e.getBoundingClientRect(); return { cel: e.tagName + (typeof e.className === "string" && e.className ? "." + e.className.split(" ").join(".") : ""), tekst: (e.innerText || e.getAttribute("aria-label") || "").trim().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height) }; }), root);
export const poziomo = (p) => p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
// Elementy wychodzące poza prawą krawędź (bez rodzica z overflow-x: auto/hidden).
export const pozaEkranem = (p, sel) => p.evaluate((sel) => [...document.querySelectorAll(sel)].filter((e) => { const r = e.getBoundingClientRect(); if (!r.width) return false; for (let x = e.parentElement; x; x = x.parentElement) { const o = getComputedStyle(x).overflowX; if (o === "auto" || o === "scroll" || o === "hidden") { const pr = x.getBoundingClientRect(); return r.right > pr.right + 1 && x === document.body; } } return r.right > document.documentElement.clientWidth + 1 || r.left < -1; }).map((e) => ({ cel: e.className || e.tagName, r: Math.round(e.getBoundingClientRect().right) })), sel);
export const animacje = (p, sels) => p.evaluate((sels) => Object.fromEntries(sels.map((s) => { const e = document.querySelector(s); return [s, e ? getComputedStyle(e).animationName : "brak"]; })), sels);
// Ukryj przyklejone paski (zrzut całej strony), a potem przywróć.
export async function fullShot(p, path) {
  await p.evaluate(() => document.querySelectorAll("body *").forEach((e) => { const c = getComputedStyle(e); if (c.position === "fixed" || c.position === "sticky") { e.dataset.nwHid = "1"; e.style.visibility = "hidden"; } }));
  await p.screenshot({ path, fullPage: true });
  await p.evaluate(() => document.querySelectorAll("[data-nw-hid]").forEach((e) => { e.style.visibility = ""; delete e.dataset.nwHid; }));
}
// Pełny pomiar jednego stanu ekranu (root = część strony, której dotyczy etap).
export async function pomiar(p, nazwa, root = "#main", celeRoot = root) {
  const a = await axe(p, root), K = await kontrast(p, root), C = await cele(p, celeRoot);
  return { nazwa, teksty: K.n, kontrast: K.out, axe: a, cele44: C, poziomo: await poziomo(p), bledy: [...(p.errors || [])] };
}

export function tester(R) {
  let pass = 0, fail = 0;
  R.testy = [];
  const ok = (name, cond, info) => { R.testy.push({ name, ok: !!cond, info: cond ? undefined : info }); if (cond) { pass++; console.log("✓", name); } else { fail++; console.log("✗", name, JSON.stringify(info ?? "").slice(0, 500)); } };
  return { ok, wynik: () => ({ pass, fail }) };
}

// Raport rundy: raport.json + raport.md w katalogu rundy.
export function zapiszRaport(DIR, R) {
  fs.writeFileSync(DIR + "raport.json", JSON.stringify(R, null, 1));
  const P = R.pomiary || [];
  const sum = (x) => x.kontrast.filter((k) => !k.maly).length;
  const md = [`# UX-2 · etap ${R.etap} · runda ${R.runda}`, "", `Testy etapu: **${R.wynik.pass} ✓ / ${R.wynik.fail} ✗** (docs/gry/test/ux2-etap${R.etap}.mjs)`, "",
    "## Kryteria (asercje)", ...R.testy.map((t) => `- ${t.ok ? "✓" : "✗"} ${t.name}${t.ok ? "" : " — " + JSON.stringify(t.info ?? "").slice(0, 300)}`), "",
    "## Pomiary (kontrast każdego tekstu WCAG AA, axe, cele < 44 px, poziome przewijanie, konsola)",
    "| stan | teksty | < AA | tekst < 12 px | axe | cele < 44 px | poziome przewijanie | błędy konsoli |", "|---|---|---|---|---|---|---|---|",
    ...P.map((x) => `| ${x.nazwa} | ${x.teksty} | ${sum(x)} | ${x.kontrast.filter((k) => k.maly).length} | ${x.axe.map((v) => `${v.id}: ${v.n}`).join(", ") || "0"} | ${x.cele44.length} | ${x.poziomo ? "TAK" : "nie"} | ${x.bledy.length} |`), "",
    "## Szczegóły naruszeń", ...P.flatMap((x) => [...x.kontrast.map((k) => `- ${x.nazwa} · kontrast \`${k.cel}\` „${k.tekst}” ${k.kontrast}:1 (wymagane ${k.wymagany}:1, ${k.px}px)`), ...x.axe.flatMap((v) => v.nodes.map((d) => `- ${x.nazwa} · axe ${v.id} · \`${d.cel}\` · ${d.info}`)), ...x.cele44.map((c) => `- ${x.nazwa} · cel \`${c.cel}\` „${c.tekst}” ${c.w}×${c.h}`), ...x.bledy.map((e) => `- ${x.nazwa} · konsola: ${e}`)]), "",
    "## Ruch (animationName; przy reduced-motion i html.calm ma być „none”)", ...(R.ruch || []).map((r) => `- ${r.nazwa}: ${JSON.stringify(r.anim)}`), "",
    ...(R.dodatkowe || []), "",
    "## Zrzuty", ...(R.zrzuty || []).map((z) => `- ${z}`)].join("\n");
  fs.writeFileSync(DIR + "raport.md", md + "\n");
}
export function katalog(etap) {
  const N = process.env.RUNDA;
  if (!N) return null;
  const DIR = new URL(`../../audyt-ux/petla-2/etap-${etap}/runda-${N}/`, import.meta.url).pathname;
  fs.mkdirSync(DIR, { recursive: true });
  return DIR;
}
