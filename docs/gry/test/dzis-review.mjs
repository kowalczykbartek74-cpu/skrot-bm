// Przegląd ekranu „Dziś” (gałąź dzis-duolingo): zrzuty, axe-core (kontrast, cele dotyku), poziome przewijanie, konsola,
// wysokość „Twój postęp”, brak Hasła dnia. Wyniki: docs/dzis-review/runda-N/ (zrzuty + raport.json + raport.md).
// RUNDA=1 BASE=http://127.0.0.1:8831/ node docs/gry/test/dzis-review.mjs
import fs from "fs";
import { createRequire } from "module";
import { chromium, open as open0, docs } from "./h2-lib.mjs";
// Dane: jak w testach H2 + jeden termin z datą szacowaną (projekt z Podstaw zarządzania), żeby było widać etykietę na kafelku.
const DOCS = { ...docs, deadlines: { est1: { title: "Projekt: Podstawy zarządzania", type: "projekt", subjectId: "podstawy-zarzadzania", date: "2026-11-25", approx: true, createdAt: Date.now() } } };
const open = (b, o) => open0(b, { fonts: true, ...o, ls: { "mock-docs": JSON.stringify(DOCS), ...(o.ls || {}) } });
const require = createRequire(process.env.HOME + "/matura-app/package.json");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const N = process.env.RUNDA || "0";
const DIR = new URL(`../../dzis-review/runda-${N}/`, import.meta.url).pathname;
fs.mkdirSync(DIR, { recursive: true });
const b = await chromium.launch();
const R = { runda: +N, przypadki: [], motywy: [], przewijanie: [], en: null };

async function axe(p) {
  await p.addScriptTag({ content: AXE });
  return p.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: { type: "rule", values: ["color-contrast", "target-size"] }, resultTypes: ["violations"] });
    return r.violations.map((v) => ({ id: v.id, n: v.nodes.length, nodes: v.nodes.slice(0, 12).map((x) => ({ cel: x.target.join(" "), html: x.html.slice(0, 140), info: (x.any[0]?.message || "").slice(0, 160) })) }));
  });
}
// Własny pomiar kontrastu każdego widocznego tekstu w <main> (axe nie liczy tła z gradientem: tło strony ma kratkę).
// Tło = złożenie półprzezroczystych teł przodków aż do pełnego; pod spodem --paper strony.
const kontrast = (p) => p.evaluate(() => {
  const rgba = (c) => { const f = /^color\(srgb/.test(c), m = (c.replace(/^color\(srgb/, "").match(/[\d.]+/g) || []).map(Number); if (m.length < 3) return null; const k = f ? 255 : 1; return { r: m[0] * k, g: m[1] * k, b: m[2] * k, a: m.length > 3 ? m[3] : 1 }; };
  const over = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
  const L = (c) => [c.r, c.g, c.b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
  const ratio = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const probe = document.createElement("i"); probe.style.color = getComputedStyle(document.documentElement).getPropertyValue("--paper").trim() || "#fff"; document.body.append(probe);
  const paper = rgba(getComputedStyle(probe).color); probe.remove();
  // Gradient na elemencie (przyciski w motywach): bierzemy kolory jego przystanków, a wynik to najgorszy z nich.
  const stops = (e) => { const bi = getComputedStyle(e).backgroundImage; if (!/gradient/.test(bi) || e === document.body || e.tagName === "MAIN") return null; const cs = (bi.match(/rgba?\([^)]*\)/g) || []).map(rgba).filter((c) => c.a > 0.5); return cs.length ? cs : null; };
  const bgsOf = (el) => { const st = []; let g = null; for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const c = rgba(getComputedStyle(e).backgroundColor); const gs = stops(e); if (gs && !(c && c.a >= 1)) { g = gs; break; } if (c && c.a > 0) { st.push(c); if (c.a >= 1) break; } } const bases = g ? g.map((c) => ({ ...c, a: 1 })) : [paper]; return bases.map((b0) => { let b = b0; for (let i = st.length - 1; i >= 0; i--) b = over(st[i], b); return b; }); };
  const out = [], seen = new Set(), w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n = 0;
  for (let t; (t = w.nextNode());) {
    const el = t.parentElement, s = t.textContent.trim(); if (!s || !el || seen.has(el)) continue; seen.add(el);
    // #skrot-wm = celowy znak wodny z adresem konta (aria-hidden, ochrona przed wyciekiem), nie tekst do czytania.
    if (el.closest("svg, script, style, [hidden], #skrot-wm, #login, details:not([open]) > :not(summary)")) continue;
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el); if (!r.width || !r.height || cs.visibility === "hidden" || +cs.opacity === 0) continue; n++;
    let op = 1; for (let e = el; e; e = e.parentElement) op *= +getComputedStyle(e).opacity;
    const px = parseFloat(cs.fontSize), big = px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700), need = big ? 3 : 4.5;
    const cr = Math.min(...bgsOf(el).map((bg) => ratio(over({ ...rgba(cs.color), a: rgba(cs.color).a * op }, bg), bg)));
    if (cr < need) out.push({ tekst: s.slice(0, 50), cel: (el.className && typeof el.className === "string" ? "." + el.className.split(" ").join(".") : el.tagName), kontrast: +cr.toFixed(2), wymagany: need });
  }
  return { n, out };
});
// Cele dotyku: każdy przycisk, link, pole i podsumowanie w <main> ma mieć co najmniej 44×44 px (wymóg zlecenia, ostrzej niż axe 24 px).
const cele = (p) => p.evaluate(() => [...document.querySelectorAll("#main :is(button, a[href], input, select, summary, label)")].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.height && getComputedStyle(e).visibility !== "hidden" && !e.closest("[hidden], details:not([open]) > :not(summary), .ld-lessons > :not(:first-child) *") && (Math.round(r.width) < 44 || Math.round(r.height) < 44) && !(e.tagName === "INPUT" && e.closest("label")); }).map((e) => { const r = e.getBoundingClientRect(); return { cel: e.tagName + (typeof e.className === "string" && e.className ? "." + e.className.split(" ").join(".") : ""), tekst: (e.innerText || e.getAttribute("aria-label") || "").trim().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height) }; }));
// Ruch: nazwy animacji kart przy wejściu i przejście przy najechaniu.
const ruch = (p) => p.evaluate(() => { const q = (s) => document.querySelector(s); const an = (e) => e ? getComputedStyle(e).animationName : "brak"; const tr = (e) => e ? getComputedStyle(e).transitionProperty + " " + getComputedStyle(e).transitionDuration : "brak";
  return { wejscie_kafelka: an(q(".pz-tile")), wejscie_wiersza: an(q(".pz-row")), wejscie_lekcji: an(q(".ld-tile")), wejscie_ekranu: an(q("#main > section, #main > div")), hover_lekcji: tr(q(".ld-tile")), hover_kafelka: tr(q(".pz-tile")) }; });
const info = (p) => p.evaluate(() => {
  const pts = document.querySelector(".pts-card");
  const txt = document.querySelector("#main")?.innerText || "";
  return {
    ptsH: pts ? Math.round(pts.getBoundingClientRect().height) : null,
    haslo: !!document.querySelector("#main .hd-home, #main .hd-home-done") || /Hasło dnia|Word of the day/i.test(txt),
    poziomo: document.documentElement.scrollWidth > innerWidth,
    wys: document.documentElement.scrollHeight,
  };
});

for (const konto of ["starosta", "platne"]) for (const [w, hh] of [[375, 812], [1280, 900]]) for (const dark of [false, true]) {
  const n = `${konto}-${w}-${dark ? "ciemny" : "jasny"}`;
  const p = await open(b, { konto, w, h: hh, dark, ls: { "skrot-green": dark ? "dark" : "light" } });
  await p.waitForTimeout(2600); // po animacjach wejścia
  // Zrzut całej strony bez przyklejonych pasków (na telefonie dolne zakładki zasłaniałyby środek strony); osobno pierwszy ekran z paskami.
  await p.screenshot({ path: `${DIR}${n}-ekran1.png` });
  await p.evaluate(() => document.querySelectorAll("body *").forEach((e) => { const c = getComputedStyle(e); if (c.position === "fixed" || c.position === "sticky") e.dataset.dzHid = e.style.visibility = "hidden"; }));
  await p.screenshot({ path: `${DIR}${n}.png`, fullPage: true });
  await p.evaluate(() => document.querySelectorAll("[data-dz-hid]").forEach((e) => { e.style.visibility = ""; delete e.dataset.dzHid; }));
  const pts = p.locator(".pts-card").first();
  if (await pts.count()) await pts.screenshot({ path: `${DIR}${n}-postep.png` }).catch(() => {});
  const i = await info(p), a = await axe(p);
  const K0 = await kontrast(p), k0 = K0.out; if (k0.length) a.push({ id: "kontrast-wlasny", n: k0.length, nodes: k0.map((x) => ({ cel: x.cel, info: `„${x.tekst}” ${x.kontrast}:1 < ${x.wymagany}:1` })) });
  const C0 = await cele(p);
  // Warianty panelu Stasia: tryb „lekko” (calm) i bliskie zaliczenie (warn) — te same klasy, które nadaje ldHero.
  if (konto === "starosta") for (const tone of ["calm", "warn"]) {
    await p.evaluate((t) => { const e = document.querySelector(".zh-hero"); e.classList.remove("calm", "warn"); e.classList.add(t); }, tone);
    await p.locator(".zh-hero").screenshot({ path: `${DIR}${n}-panel-${tone}.png` });
    const av = await axe(p); const KK = await kontrast(p), kk = KK.out; K0.n += KK.n; if (kk.length) av.push({ id: "kontrast-wlasny", n: kk.length, nodes: kk.map((x) => ({ cel: x.cel, info: `„${x.tekst}” ${x.kontrast}:1 < ${x.wymagany}:1` })) });
    for (const v of av) a.push({ ...v, id: v.id + ` (panel ${tone})` });
  }
  R.przypadki.push({ n, ...i, axe: a, tekstow: K0.n, cele44: C0, bledy: p.errors });
  console.log(n, JSON.stringify({ ptsH: i.ptsH, haslo: i.haslo, poziomo: i.poziomo, axe: a.map((x) => `${x.id}:${x.n}`), bledy: p.errors.length }));
  await p.close();
}
for (const w of [360, 375]) for (const dark of [false, true]) {
  const p = await open(b, { konto: "platne", w, h: 800, dark, ls: { "skrot-green": dark ? "dark" : "light" } });
  await p.waitForTimeout(1500);
  R.przewijanie.push({ w, dark, poziomo: await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), bledy: p.errors });
  await p.close();
}
R.ruch = [];
for (const [nazwa, o] of [["zwykle", {}], ["reduced-motion", { motion: "reduce" }], ["Mniej animacji (html.calm)", { ls: { "skrot-calm": "1" } }]]) {
  const p = await open(b, { konto: "platne", w: 375, h: 812, wait: 0, ...o });
  await p.locator(".pz-tile").first().waitFor({ timeout: 15000 }).catch(() => {});
  if (nazwa.includes("calm")) await p.evaluate(() => document.documentElement.classList.add("calm"));
  R.ruch.push({ nazwa, calm: await p.evaluate(() => document.documentElement.classList.contains("calm")), ...(await ruch(p)) });
  await p.close();
}
{
  const p = await open(b, { konto: "starosta", w: 375, h: 812, lang: "en", ls: { "skrot-green": "light" } });
  await p.waitForTimeout(2600);
  await p.screenshot({ path: `${DIR}en-starosta-375-jasny.png`, fullPage: true });
  // Polskie znaki w tekście ekranu po EN = brak tłumaczenia (poza nazwami własnymi z translate=no / lang=pl).
  const pl = await p.evaluate(() => {
    const out = [], w = document.createTreeWalker(document.querySelector("#main"), NodeFilter.SHOW_TEXT);
    for (let t; (t = w.nextNode());) { const s = t.textContent.trim(); if (!s || t.parentElement.closest('[translate="no"],[lang="pl"],script,style')) continue; if (/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]|\b(dni|temat|tematów|umiesz|w drodze|Pokaż|szacowana|kolokwium|egzamin)\b/i.test(s)) out.push(s); }
    return [...new Set(out)].slice(0, 30);
  });
  R.en = { pl, ...(await info(p)), axe: await axe(p), bledy: p.errors };
  console.log("EN", JSON.stringify(R.en.pl), R.en.ptsH);
  await p.close();
}
for (const theme of ["pink", "bow", "lilia", "meadow", "sea", "noc", "riwiera", "klub"]) {
  const p = await open(b, { konto: "starosta", w: 375, h: 812, theme });
  await p.waitForTimeout(2200);
  await p.screenshot({ path: `${DIR}motyw-${theme}-375.png`, fullPage: true });
  const a = await axe(p); const KM = await kontrast(p), km = KM.out; if (km.length) a.push({ id: "kontrast-wlasny", n: km.length, nodes: km.map((x) => ({ cel: x.cel, info: `„${x.tekst}” ${x.kontrast}:1 < ${x.wymagany}:1` })) });
  R.motywy.push({ theme, axe: a, tekstow: KM.n, cele44: await cele(p), bledy: p.errors, ...(await info(p)) });
  console.log("motyw", theme, a.map((x) => `${x.id}:${x.n}`).join(" ") || "ok");
  await p.close();
}
await b.close();
fs.writeFileSync(DIR + "raport.json", JSON.stringify(R, null, 1));
const md = [`# Dziś – runda ${N}`, "", "Limit „Twój postęp”: ≤ 520 px przy 375, ≤ 380 px przy 1280. Kontrast: własny pomiar każdego widocznego tekstu strony (tekst ≥ 4,5:1, duży ≥ 3:1; tło z przodków, gradient = najgorszy kolor) + axe-core (color-contrast, target-size). Pominięty tylko #skrot-wm: celowy znak wodny z adresem konta (aria-hidden, przezroczystość 0,22, ochrona przed wyciekiem treści).", "",
  "| przypadek | wys. „Twój postęp” | Hasło dnia | poziome przewijanie | sprawdzone teksty | teksty < AA | axe | cele < 44 px | błędy konsoli |", "|---|---|---|---|---|---|---|---|---|",
  ...R.przypadki.map((x) => `| ${x.n} | ${x.ptsH ?? "—"} px | ${x.haslo ? "TAK" : "nie"} | ${x.poziomo ? "TAK" : "nie"} | ${x.tekstow} | ${x.axe.filter((v) => v.id.startsWith("kontrast-wlasny")).reduce((a, v) => a + v.n, 0)} | ${x.axe.filter((v) => !v.id.startsWith("kontrast-wlasny")).map((v) => `${v.id}: ${v.n}`).join(", ") || "0"} | ${x.cele44.length} | ${x.bledy.length} |`),
  "", "(starosta: liczby obejmują też warianty panelu calm i warn)", "",
  "## Ruch (375 px, konto zwykłe)", ...R.ruch.map((x) => `- ${x.nazwa}: wejście kafelka terminu ${x.wejscie_kafelka}, wiersza ${x.wejscie_wiersza}, karty lekcji ${x.wejscie_lekcji}, ekranu ${x.wejscie_ekranu}; przejście karty lekcji: ${x.hover_lekcji}; kafelka: ${x.hover_kafelka}`),
  "", "## Cele dotyku < 44 px (szczegóły)", ...[...R.przypadki, ...R.motywy.map((x) => ({ n: "motyw-" + x.theme, cele44: x.cele44 }))].filter((x) => x.cele44.length).flatMap((x) => [`### ${x.n}`, ...x.cele44.map((c) => `- \`${c.cel}\` „${c.tekst}” ${c.w}×${c.h}`)]),
  "", "## Poziome przewijanie (konto zwykłe)", ...R.przewijanie.map((x) => `- ${x.w} px ${x.dark ? "ciemny" : "jasny"}: ${x.poziomo ? "TAK" : "nie"}`),
  "", "## EN", `- teksty z polskimi słowami/znakami: ${JSON.stringify(R.en.pl)}`, `- axe: ${R.en.axe.map((v) => `${v.id}: ${v.n}`).join(", ") || "0"}`, `- błędy konsoli: ${R.en.bledy.length}`,
  "", "## Motywy ze sklepu (375 px, axe)", ...R.motywy.map((x) => `- ${x.theme}: sprawdzone teksty ${x.tekstow}; ${x.axe.map((v) => `${v.id}: ${v.n}`).join(", ") || "0 naruszeń"}; cele < 44 px: ${x.cele44.length}; Hasło dnia: ${x.haslo ? "TAK" : "nie"}; przewijanie: ${x.poziomo ? "TAK" : "nie"}; błędy: ${x.bledy.length}`),
  "", "## Szczegóły naruszeń axe", ...[...R.przypadki, ...R.motywy.map((x) => ({ n: "motyw-" + x.theme, axe: x.axe })), { n: "en", axe: R.en.axe }].flatMap((x) => x.axe.length ? [`### ${x.n}`, ...x.axe.flatMap((v) => v.nodes.map((d) => `- ${v.id} · \`${d.cel}\` · ${d.info}`))] : [])].join("\n");
fs.writeFileSync(DIR + "raport.md", md + "\n");
console.log("zapisano", DIR);
