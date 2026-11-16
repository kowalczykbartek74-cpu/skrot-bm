// Przegląd ekranu wejścia (wybór kierunku → rok i grupa → logowanie): zrzuty, kontrast każdego tekstu, cele 44 px,
// poziome przewijanie, ruch (normalnie / reduced-motion / Mniej animacji), konsola. Wyniki: docs/logowanie-review/<RUNDA>/.
// RUNDA=przed BASE=http://127.0.0.1:8831/ node docs/gry/test/logowanie-review.mjs
import fs from "fs";
import { chromium, page, BASE } from "./lib.mjs";
const N = process.env.RUNDA || "0";
const DIR = new URL(`../../logowanie-review/${N}/`, import.meta.url).pathname;
fs.mkdirSync(DIR, { recursive: true });
const b = await chromium.launch();
const R = { przypadki: [], ruch: [] };
const fresh = async (o = {}) => {
  const p = await page(b, { konto: "brak", ...o });
  await p.context().route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (r) => r.continue());
  if (o.motion) await p.emulateMedia({ reducedMotion: o.motion });
  await p.addInitScript(() => { if (!sessionStorage.getItem("k-init")) { sessionStorage.setItem("k-init", "1"); for (const k of ["bm-group", "bm-sub", "skrot-rocznik", "skrot-kierunek"]) localStorage.removeItem(k); } });
  return p;
};
const pomiar = (p) => p.evaluate(() => {
  const rgba = (c) => { const f = /^color\(srgb/.test(c), m = (c.replace(/^color\(srgb/, "").match(/[\d.]+/g) || []).map(Number); if (m.length < 3) return null; const k = f ? 255 : 1; return { r: m[0] * k, g: m[1] * k, b: m[2] * k, a: m.length > 3 ? m[3] : 1 }; };
  const over = (t, b) => ({ r: t.r * t.a + b.r * (1 - t.a), g: t.g * t.a + b.g * (1 - t.a), b: t.b * t.a + b.b * (1 - t.a), a: 1 });
  const L = (c) => [c.r, c.g, c.b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
  const ratio = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const stops = (e) => { const bi = getComputedStyle(e).backgroundImage; if (!/gradient/.test(bi)) return null; const cs = (bi.match(/rgba?\([^)]*\)/g) || []).map(rgba).filter((c) => c.a > 0.5); return cs.length ? cs : null; };
  const bgs = (el) => { const st = []; let g = null; for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const c = rgba(getComputedStyle(e).backgroundColor), gs = stops(e); if (gs && !(c && c.a >= 1)) { g = gs; break; } if (c && c.a > 0) { st.push(c); if (c.a >= 1) break; } } const base = g ? g.map((c) => ({ ...c, a: 1 })) : [{ r: 255, g: 255, b: 255, a: 1 }]; return base.map((b0) => { let b = b0; for (let i = st.length - 1; i >= 0; i--) b = over(st[i], b); return b; }); };
  const root = document.getElementById("login"), low = [], seen = new Set(); let n = 0;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let t; (t = w.nextNode());) {
    const el = t.parentElement, s = t.textContent.trim(); if (!s || seen.has(el)) continue; seen.add(el);
    if (el.closest("[hidden], svg, .lg-side[aria-hidden] .lg-card-bar, details:not([open]) > :not(summary)")) continue;
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el); if (!r.width || !r.height || cs.visibility === "hidden") continue;
    let op = 1; for (let e = el; e; e = e.parentElement) op *= +getComputedStyle(e).opacity; if (op < 0.05) continue; n++;
    const px = parseFloat(cs.fontSize), big = px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700), need = big ? 3 : 4.5;
    const fg = rgba(cs.color), cr = Math.min(...bgs(el).map((bg) => ratio(over({ ...fg, a: fg.a * op }, bg), bg)));
    if (cr < need) low.push({ tekst: s.slice(0, 40), kontrast: +cr.toFixed(2), wymagany: need });
  }
  const cele = [...root.querySelectorAll("button, a[href], input, select, summary, [role=tab]")].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.height && getComputedStyle(e).visibility !== "hidden" && !e.closest("[hidden]") && (Math.round(r.height) < 44 || Math.round(r.width) < 44); })
    .map((e) => { const r = e.getBoundingClientRect(); return `${e.tagName} „${(e.innerText || e.value || e.getAttribute("aria-label") || "").trim().slice(0, 30)}” ${Math.round(r.width)}×${Math.round(r.height)}`; });
  return { teksty: n, ponizejAA: low, cele, poziomo: root.scrollWidth > innerWidth || document.documentElement.scrollWidth > innerWidth };
});
const krok = async (p, n, nazwa) => { await p.mouse.move(2, 2); await p.waitForTimeout(1300); await p.screenshot({ path: `${DIR}${n}.png`, fullPage: true, animations: "disabled" }); if (/1280/.test(n)) await p.screenshot({ path: `${DIR}${n}-ekran1.png` }); R.przypadki.push({ n, krok: nazwa, ...(await pomiar(p)), bledy: [...p.errors] }); };
for (const lang of ["pl", "en"]) for (const [w, hh] of [[375, 812], [1280, 900]]) {
  if (lang === "en" && w === 1280) continue;
  const p = await fresh({ lang, w, h: hh }), t = `${lang}-${w}`;
  await p.goto(BASE + "index.html"); await p.waitForSelector("#lgKierunek .lk-card");
  await krok(p, `${t}-1-kierunek`, "1. kierunek");
  await p.click('#lgKierunek [data-k="wefiz-bm-1-st-2026"]'); await p.click('#lgKierunek [data-g="C112"]');
  await krok(p, `${t}-2-grupa`, "2. rok i grupa");
  await p.click('#lgKierunek [data-a="dalej"]'); await p.waitForSelector("#loginBox .btn, #loginBox input");
  await krok(p, `${t}-3-logowanie`, "3. logowanie");
  await p.context().close();
}
// Ruch: każda zamówiona animacja na 375 i 1280 (krok 1 i krok 3), normalnie / reduced-motion / Mniej animacji.
const ANIM = { "karta kierunku (wejście)": "#lgKierunek .lk-card", "nagłówek kroku": "#lgKierunek h2", "pasek kroków (napełnianie)": "#login .lk-bar i.on", "Staś przy nagłówku (telefon)": "#login .lg-intro > .stas-face",
  "Staś w panelu (komputer)": "#login .lg-stas .stas-face", "dymek Stasia": "#login .lg-stas-b", "karta z przykładem (unosi się)": "#login .lg-card", "lista zalet": "#login .lg-side li", "połysk przycisku 3 dni": "#login .lg-trial .btn.primary::after", "karta 3 dni (wejście)": "#login .lg-trial" };
for (const w of [375, 1280]) for (const [nazwa, o] of [["zwykle", {}], ["reduced-motion", { motion: "reduce" }], ["Mniej animacji", { ls: { "skrot-calm": "1" } }]]) {
  const p = await fresh({ w, h: 900, ...o });
  await p.goto(BASE + "index.html"); await p.waitForSelector("#lgKierunek .lk-card");
  const zmierz = () => p.evaluate((A) => Object.fromEntries(Object.entries(A).map(([k, s]) => { const [sel, pse] = s.split("::"); const e = document.querySelector(sel); if (!e || !e.getClientRects().length) return [k, null]; const c = getComputedStyle(e, pse ? "::" + pse : null); return [k, `${c.animationName}${c.animationIterationCount === "infinite" ? " (w pętli)" : ""}; przejście ${c.transitionDuration}`]; })), ANIM);
  const a1 = await zmierz();
  await p.click('#lgKierunek [data-k="wefiz-bm-1-st-2026"]'); await p.click('#lgKierunek [data-a="dalej"]'); await p.waitForSelector("#loginBox .lg-trial, #loginBox input");
  const a3 = await zmierz();
  const all = {}; for (const k of Object.keys(ANIM)) all[k] = a1[k] || a3[k];
  R.ruch.push({ nazwa: `${w} px, ${nazwa}`, calm: await p.evaluate(() => document.documentElement.classList.contains("calm")), ...all });
  await p.context().close();
}
await b.close();
fs.writeFileSync(DIR + "raport.json", JSON.stringify(R, null, 1));
fs.writeFileSync(DIR + "raport.md", [`# Ekran wejścia – ${N}`, "", "Kontrast: każdy widoczny tekst w #login (tekst ≥ 4,5:1, duży ≥ 3:1; tło z przodków, gradient = najgorszy kolor). Cele: przyciski, linki, pola, zakładki ≥ 44×44 px.", "",
  "| zrzut | krok | sprawdzone teksty | < AA | cele < 44 px | poziome przewijanie | błędy konsoli |", "|---|---|---|---|---|---|---|",
  ...R.przypadki.map((x) => `| ${x.n} | ${x.krok} | ${x.teksty} | ${x.ponizejAA.length} | ${x.cele.length} | ${x.poziomo ? "TAK" : "nie"} | ${x.bledy.length} |`),
  "", "## Ruch (krok 1 i 3; „none” = wyłączone, „—” = elementu nie ma przy tej szerokości)", ...R.ruch.flatMap((x) => [`### ${x.nazwa}${x.calm ? " (html.calm)" : ""}`, ...Object.keys(ANIM).map((k) => `- ${k}: ${x[k] ?? "—"}`)]),
  "", "## Szczegóły", ...R.przypadki.flatMap((x) => x.ponizejAA.length || x.cele.length || x.bledy.length ? [`### ${x.n}`, ...x.ponizejAA.map((l) => `- kontrast „${l.tekst}” ${l.kontrast}:1 < ${l.wymagany}:1`), ...x.cele.map((c) => `- cel ${c}`), ...x.bledy.map((e) => `- konsola: ${e}`)] : [])].join("\n") + "\n");
console.log(fs.readFileSync(DIR + "raport.md", "utf8"));
