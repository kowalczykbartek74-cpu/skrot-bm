// Pętla UX-1: pomiary i zrzuty rundy (A5 b). Wzór: docs/gry/test/dzis-review.mjs (axe, kontrast każdego tekstu, cele, przewijanie).
//   ETAP=1 RUNDA=1 BASE=http://127.0.0.1:8811/ node docs/audyt-ux/petla-1/pomiary.mjs
// Wynik: docs/audyt-ux/petla-1/etap-X/runda-R/ (zrzuty *.png, raport.md, raport.json). Test etapu uruchamiany osobno (log w test.log).
import fs from "fs";
import { createRequire } from "module";
import { chromium, page as page0, BASE } from "../../gry/test/lib.mjs";
import { docs as H2DOCS } from "../../gry/test/h2-lib.mjs";
const require = createRequire(process.env.PW_FROM || process.env.HOME + "/matura-app/package.json");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const ETAP = process.env.ETAP || "1", RUNDA = process.env.RUNDA || "1";
const DIR = new URL(`./etap-${ETAP}/runda-${RUNDA}/`, import.meta.url).pathname;
fs.mkdirSync(DIR, { recursive: true });
const SCEN = (await import(`./scenariusze-${ETAP}.mjs`)).default;
const b = await chromium.launch();

// Strona z atrapą; zegar ustawiony (o.time), prawdziwe czcionki Google (zrzuty jak u studenta).
async function open(o) {
  const ls = { "mock-docs": JSON.stringify(H2DOCS), "skrot-green": o.dark ? "dark" : "light", ...(o.ls || {}) };
  const p = await page0(b, { konto: o.konto || "brak", w: o.w || 390, h: o.h || 844, lang: o.lang || "pl", ls, ctx: o.dark ? { colorScheme: "dark" } : {} });
  await p.context().route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (r) => r.continue());
  await p.addInitScript(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true }); });
  if (o.motion) await p.emulateMedia({ reducedMotion: o.motion });
  if (o.clock) await p.clock.install({ time: new Date(o.time || "2026-11-17T10:00:00+01:00") });
  else await p.clock.setFixedTime(new Date(o.time || "2026-11-17T10:00:00+01:00"));
  await p.goto(BASE + "index.html" + (o.q || "") + (o.hash ? "#" + o.hash : ""));
  if (o.clock) await p.clock.runFor(o.wait ?? 3000); else await p.waitForTimeout(o.wait ?? 3000);
  return p;
}
async function axe(p) {
  await p.addScriptTag({ content: AXE });
  return p.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: { type: "rule", values: ["color-contrast", "target-size"] }, resultTypes: ["violations"] });
    return r.violations.map((v) => ({ id: v.id, n: v.nodes.length, nodes: v.nodes.slice(0, 12).map((x) => ({ cel: x.target.join(" "), info: (x.any[0]?.message || "").slice(0, 160) })) }));
  });
}
// Kontrast każdego widocznego tekstu w obszarze (root): tło = złożenie teł przodków; gradient = najgorszy przystanek.
const kontrast = (p, root) => p.evaluate((root) => {
  const rgba = (c) => { const f = /^color\(srgb/.test(c), m = (c.replace(/^color\(srgb/, "").match(/[\d.]+/g) || []).map(Number); if (m.length < 3) return null; const k = f ? 255 : 1; return { r: m[0] * k, g: m[1] * k, b: m[2] * k, a: m.length > 3 ? m[3] : 1 }; };
  const over = (t, b) => ({ r: t.r * t.a + b.r * (1 - t.a), g: t.g * t.a + b.g * (1 - t.a), b: t.b * t.a + b.b * (1 - t.a), a: 1 });
  const L = (c) => [c.r, c.g, c.b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
  const ratio = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const paper = rgba(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
  const stops = (e) => { const bi = getComputedStyle(e).backgroundImage; if (!/gradient/.test(bi) || e === document.body) return null; const cs = (bi.match(/rgba?\([^)]*\)/g) || []).map(rgba).filter((c) => c.a > 0.5); return cs.length ? cs : null; };
  const bgsOf = (el) => { const st = []; let g = null; for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const c = rgba(getComputedStyle(e).backgroundColor); const gs = stops(e); if (gs && !(c && c.a >= 1)) { g = gs; break; } if (c && c.a > 0) { st.push(c); if (c.a >= 1) break; } } const bases = g ? g.map((c) => ({ ...c, a: 1 })) : [paper.a >= 1 ? paper : { r: 255, g: 255, b: 255, a: 1 }]; return bases.map((b0) => { let b = b0; for (let i = st.length - 1; i >= 0; i--) b = over(st[i], b); return b; }); };
  const out = [], seen = new Set(), roots = [...document.querySelectorAll(root)]; let n = 0;
  for (const R of roots) { const w = document.createTreeWalker(R, NodeFilter.SHOW_TEXT);
    for (let t; (t = w.nextNode());) {
      const el = t.parentElement, s = t.textContent.trim(); if (!s || !el || seen.has(el)) continue; seen.add(el);
      if (el.closest("svg, script, style, [hidden], #skrot-wm, details:not([open]) > :not(summary), [aria-hidden=true]")) continue;
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el); if (!r.width || !r.height || cs.visibility === "hidden" || +cs.opacity === 0) continue; n++;
      let op = 1; for (let e = el; e; e = e.parentElement) op *= +getComputedStyle(e).opacity;
      const px = parseFloat(cs.fontSize), big = px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700), need = big ? 3 : 4.5;
      const fg = rgba(cs.color); const cr = Math.min(...bgsOf(el).map((bg) => ratio(over({ ...fg, a: fg.a * op }, bg), bg)));
      if (cr < need) out.push({ tekst: s.slice(0, 50), cel: el.tagName + (typeof el.className === "string" && el.className ? "." + el.className.split(" ").join(".") : ""), kontrast: +cr.toFixed(2), wymagany: need });
      if (px < 12) out.push({ tekst: s.slice(0, 50), cel: el.tagName, maly_tekst: px });
    } }
  return { n, out };
}, root);
const cele = (p, root) => p.evaluate((root) => [...document.querySelectorAll(`:is(${root}) :is(button, a[href], input, select, summary, [role=tab], [role=button])`)].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.height && getComputedStyle(e).visibility !== "hidden" && !e.closest("[hidden], details:not([open]) > :not(summary)") && (Math.round(r.width) < 44 || Math.round(r.height) < 44) && !(e.tagName === "INPUT" && e.closest("label")); }).map((e) => { const r = e.getBoundingClientRect(); const inl = e.tagName === "A" && getComputedStyle(e).display === "inline"; return { cel: e.tagName + (typeof e.className === "string" && e.className ? "." + e.className.split(" ").join(".") : ""), tekst: (e.innerText || e.getAttribute("aria-label") || "").trim().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height), w_tekscie: inl }; }), root);
const ruch = (p, sels) => p.evaluate((sels) => Object.fromEntries(sels.map((s) => { const e = document.querySelector(s); if (!e) return [s, "brak elementu"]; const cs = getComputedStyle(e), af = getComputedStyle(e, "::after"); return [s, { animacja: cs.animationName, przejscie: cs.transitionDuration, after: af.animationName }]; })), sels);

const R = { etap: +ETAP, runda: +RUNDA, data: new Date().toISOString(), przypadki: [], przejscia: [], ruch: [], przewijanie: [] };
for (const s of SCEN.ekrany) for (const [w, h] of s.rozmiary || [[360, 640], [390, 844], [1280, 900]]) for (const dark of s.motywy || [false, true]) for (const lang of s.jezyki || ["pl"]) {
  if (lang === "en" && (dark || w !== 390)) continue;
  const n = `${s.nazwa}-${w}-${dark ? "ciemny" : "jasny"}${lang === "en" ? "-en" : ""}`;
  const p = await open({ ...s, w, h, dark, lang });
  if (s.akcja) await s.akcja(p);
  await p.waitForTimeout(s.po ?? 1800);
  await p.screenshot({ path: `${DIR}${n}-ekran1.png` });
  if (s.cala !== false) await p.screenshot({ path: `${DIR}${n}.png`, fullPage: true });
  const info = await p.evaluate((q) => ({ y: scrollY, cls: +(window.__cls || 0).toFixed(4), poziomo: document.documentElement.scrollWidth > innerWidth, ih: innerHeight,
    widoczne: Object.fromEntries((q || []).map(([k, sel]) => { const e = document.querySelector(sel); const r = e?.getBoundingClientRect(); return [k, r ? { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height), w_pierwszym_ekranie: r.top >= 0 && r.bottom <= innerHeight } : null]; })),
    undef: /\bundefined\b|\bnull\b|NaN/.test(document.body.innerText) }), s.widoczne || []);
  const a = await axe(p); const K = await kontrast(p, s.root || "#login, #main, #layer");
  const C = await cele(p, s.root || "#login, #main, #layer");
  R.przypadki.push({ n, ...info, axe: a, tekstow: K.n, kontrast_ponizej: K.out, cele44: C, bledy: p.errors });
  console.log(n, JSON.stringify({ y: info.y, cls: info.cls, poziomo: info.poziomo, axe: a.map((x) => `${x.id}:${x.n}`), kontrast: K.out.length, cele: C.length, bledy: p.errors.length }));
  await p.close();
}
for (const f of SCEN.przejscia || []) {
  const p = await open({ ...f, w: f.w || 390, h: f.h || 844, dark: !!f.dark });
  const kroki = [];
  for (const [i, k] of f.kroki.entries()) {
    try { await k.zrob?.(p); } catch (e) { kroki.push({ krok: k.opis, blad: String(e).slice(0, 200) }); break; }
    await p.waitForTimeout(k.czekaj ?? 900);
    const nm = `przejscie-${f.nazwa}-${i + 1}`;
    await p.screenshot({ path: `${DIR}${nm}.png` });
    kroki.push({ krok: k.opis, zrzut: nm + ".png", stan: k.stan ? await p.evaluate(k.stan) : null });
  }
  const K = await kontrast(p, "#login, #main, #layer");
  R.przejscia.push({ nazwa: f.nazwa, opis: f.opis, kroki, kontrast_ponizej_na_koncu: K.out, bledy: p.errors });
  console.log("przejście", f.nazwa, kroki.length, "kroków, błędy:", p.errors.length);
  await p.close();
}
for (const w of [360, 375]) for (const dark of [false, true]) for (const s of SCEN.przewijanie || []) {
  const p = await open({ ...s, w, h: 800, dark });
  if (s.akcja) await s.akcja(p);
  await p.waitForTimeout(800);
  R.przewijanie.push({ ekran: s.nazwa, w, dark, poziomo: await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), bledy: p.errors });
  await p.close();
}
for (const [nazwa, o] of [["zwykle", {}], ["reduced-motion", { motion: "reduce" }], ["Mniej animacji (html.calm)", { ls: { "skrot-calm": "1" }, calm: true }]]) for (const s of SCEN.ruch || []) {
  const p = await open({ wait: 500, ...s, ...o, ls: { ...(s.ls || {}), ...(o.ls || {}) } });
  if (o.calm) await p.evaluate(() => document.documentElement.classList.add("calm"));
  if (s.akcja) await s.akcja(p);
  R.ruch.push({ ekran: s.nazwa, tryb: nazwa, ...(await ruch(p, s.elementy)) });
  await p.close();
}
await b.close();
fs.writeFileSync(DIR + "raport.json", JSON.stringify(R, null, 1));
const sum = (x, f) => x.reduce((a, y) => a + f(y), 0);
const md = [`# Pętla UX-1 · etap ${ETAP} · runda ${RUNDA}`, "", SCEN.opis || "", "",
  "Pomiary: axe-core (color-contrast, target-size), własny pomiar kontrastu każdego widocznego tekstu w `#login`, `#main`, `#layer` (tekst ≥ 4,5:1, duży ≥ 3:1; tło złożone z przodków, gradient = najgorszy przystanek; teksty < 12 px też na liście), cele dotyku < 44 px (faktyczne pole), poziome przewijanie, CLS (PerformanceObserver layout-shift), błędy konsoli, `undefined/null/NaN` w tekście ekranu. Zegar atrapy: 17.11.2026 10:00 (chyba że scenariusz mówi inaczej).", "",
  "| przypadek | scrollY | CLS | poziome przewijanie | sprawdzone teksty | teksty < AA / < 12 px | axe | cele < 44 px (w tym linki w tekście) | undefined/null | błędy konsoli | elementy w 1. ekranie |", "|---|---|---|---|---|---|---|---|---|---|---|",
  ...R.przypadki.map((x) => `| ${x.n} | ${x.y} | ${x.cls} | ${x.poziomo ? "TAK" : "nie"} | ${x.tekstow} | ${x.kontrast_ponizej.length} | ${x.axe.map((v) => `${v.id}: ${v.n}`).join(", ") || "0"} | ${x.cele44.length} (${x.cele44.filter((c) => c.w_tekscie).length}) | ${x.undef ? "TAK" : "nie"} | ${x.bledy.length} | ${Object.entries(x.widoczne).map(([k, v]) => `${k}: ${v ? (v.w_pierwszym_ekranie ? "tak" : "NIE") + ` (${v.top}–${v.bottom}, h ${v.h})` : "brak"}`).join("; ")} |`),
  "", "## Przejścia krok po kroku", ...R.przejscia.flatMap((f) => [`### ${f.nazwa}: ${f.opis || ""}`, ...f.kroki.map((k, i) => `${i + 1}. ${k.krok}${k.blad ? " — BŁĄD: " + k.blad : ""} → \`${k.zrzut || "—"}\`${k.stan ? " · stan: `" + JSON.stringify(k.stan).slice(0, 300) + "`" : ""}`), `- teksty < AA na końcu: ${f.kontrast_ponizej_na_koncu.length}; błędy konsoli: ${f.bledy.length}${f.bledy.length ? " " + JSON.stringify(f.bledy).slice(0, 300) : ""}`, ""]),
  "## Poziome przewijanie (360 i 375 px)", ...R.przewijanie.map((x) => `- ${x.ekran} ${x.w} px ${x.dark ? "ciemny" : "jasny"}: ${x.poziomo ? "TAK" : "nie"}; błędy: ${x.bledy.length}`),
  "", "## Ruch (nazwy animacji i czas przejść; przy reduced-motion i html.calm ma być none / 0s)", ...R.ruch.map((x) => `- ${x.ekran} · ${x.tryb}: ` + Object.entries(x).filter(([k]) => !["ekran", "tryb"].includes(k)).map(([k, v]) => `\`${k}\` ${typeof v === "string" ? v : `anim ${v.animacja}, ::after ${v.after}, przejście ${v.przejscie}`}`).join("; ")),
  "", "## Teksty poniżej AA i < 12 px (szczegóły)", ...R.przypadki.filter((x) => x.kontrast_ponizej.length).flatMap((x) => [`### ${x.n}`, ...x.kontrast_ponizej.map((k) => `- \`${k.cel}\` „${k.tekst}” ${k.kontrast ? `${k.kontrast}:1 < ${k.wymagany}:1` : `${k.maly_tekst} px`}`)]),
  "", "## Cele dotyku < 44 px (szczegóły)", ...R.przypadki.filter((x) => x.cele44.length).flatMap((x) => [`### ${x.n}`, ...x.cele44.map((c) => `- \`${c.cel}\` „${c.tekst}” ${c.w}×${c.h}${c.w_tekscie ? " (link w zdaniu)" : ""}`)]),
  "", "## Naruszenia axe (szczegóły)", ...R.przypadki.filter((x) => x.axe.length).flatMap((x) => [`### ${x.n}`, ...x.axe.flatMap((v) => v.nodes.map((d) => `- ${v.id} · \`${d.cel}\` · ${d.info}`))]),
  "", "## Błędy konsoli", ...[...R.przypadki, ...R.przejscia.map((f) => ({ n: "przejście " + f.nazwa, bledy: f.bledy }))].filter((x) => x.bledy.length).map((x) => `- ${x.n}: ${JSON.stringify(x.bledy).slice(0, 400)}`),
  sum(R.przypadki, (x) => x.bledy.length) + sum(R.przejscia, (x) => x.bledy.length) ? "" : "brak ✓"].join("\n");
fs.writeFileSync(DIR + "raport.md", md + "\n");
console.log("zapisano", DIR);
