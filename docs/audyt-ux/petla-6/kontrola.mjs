// Pętla UX-6 (B2): kontrola automatyczna całej strony. Wolno używać adresów. Wynik: runda-R/kontrola.json i kontrola.md.
// BASE=http://127.0.0.1:8816/ RUNDA=0 node docs/audyt-ux/petla-6/kontrola.mjs [szybko]
// shortcut: gry sprawdzane na liście i ekranie startu Hasła/Bossa (bez ekranu końca każdej gry), odtwarzacz do pierwszej karty i werdyktu; pełniej, gdy audyt wskaże problem w grach.
import fs from "fs";
import { chromium, open } from "../../gry/test/h2-lib.mjs";
import { kontrast, polskie } from "../../gry/test/ux5-lib.mjs";
import { emoji, hit } from "../../gry/test/ux4-lib.mjs";
import { axe } from "../../gry/test/ux2-lib.mjs";
import { STANY } from "./stany.mjs";

const R = process.env.RUNDA ?? "0";
const DIR = new URL(`./runda-${R}/`, import.meta.url).pathname, ZR = DIR + "zrzuty/kontrola/";
fs.mkdirSync(ZR, { recursive: true });
const SZYBKO = process.argv.includes("szybko");

const klikTekst = (re) => async (p) => { const l = p.locator("button, [role=tab], a").filter({ hasText: re }).first(); if (await l.count()) await l.click({ timeout: 4000 }).catch(() => {}); await p.waitForTimeout(1200); };
const E = {
  dzis: { h: "/", glowna: true }, przedmioty: { h: "/materials" }, przedmiot: { h: "/subject/makroekonomia", glowna: true },
  przygotuj: { h: "/subject/prawo", po: async (p) => { await klikTekst(/^Zaliczenie$|^Exam$/)(p); await klikTekst(/plan i próbny test|plan and mock test/i)(p); } }, material: { h: "/material/m1", glowna: true },
  lekcja: { h: "/material/A1", po: async (p) => { await p.locator(".lp-start").first().click({ timeout: 4000 }).catch(() => {}); await p.waitForTimeout(1500); } },
  werdykt: { h: "/material/A1", po: async (p) => { await p.locator(".lp-start").first().click({ timeout: 4000 }).catch(() => {}); await p.waitForTimeout(1500); for (let i = 0; i < 6; i++) { const o = p.locator(".lp button:has-text('Dobrze')").first(); if (await o.count()) { await o.click().catch(() => {}); await p.waitForTimeout(900); break; } const d = p.locator(".lp :is(button.lp-next, button:has-text('Dalej'))").first(); if (!(await d.count())) break; await d.click().catch(() => {}); await p.waitForTimeout(700); } } },
  powtorki: { h: "/review", glowna: true }, terminy: { h: "/terms", glowna: true }, kalendarz: { h: "/calendar" }, wiecej: { h: "/more" }, ustawienia: { h: "/ustawienia" },
  profil: { h: "/profil" }, ranking: { h: "/ranking" }, sklep: { h: "/shop", glowna: true }, gry: { h: "/gry" }, haslo: { h: "/haslo" }, boss: { h: "/boss" },
  slowniczek: { h: "/glossary" }, sciaga: { h: "/cheat/makroekonomia" }, oceny: { h: "/grading" }, moje: { h: "/mine" }, paczka: { h: "/paczka" }, polec: { h: "/polec" },
  przewodnik: { h: "/guide" }, profil_nauki: { h: "/learn" }, starosta: { h: "/starosta" }, logowanie: { h: "/" },
};
const PLATNE = Object.keys(E).filter((k) => !["starosta", "logowanie"].includes(k));
const UKLADY = [];
const dodaj = (konto, w, h, dark, lang, ekrany) => UKLADY.push({ konto, w, h, dark, lang, ekrany });
dodaj("platne", 390, 844, false, "pl", PLATNE);
if (!SZYBKO) { dodaj("platne", 360, 640, false, "pl", PLATNE); dodaj("platne", 1280, 900, false, "pl", PLATNE); dodaj("platne", 390, 844, true, "pl", PLATNE); dodaj("platne", 390, 844, false, "en", PLATNE); }
dodaj("starosta", 390, 844, false, "pl", ["dzis", "terminy", "starosta", "wiecej"]);
for (const k of ["darmowe", "proba", "proba-koniec"]) { dodaj(k, 390, 844, false, "pl", ["dzis", "przedmiot", "material", "wiecej", "sklep"]); if (!SZYBKO) dodaj(k, 360, 640, false, "pl", ["dzis", "przedmiot", "material", "sklep"]); }
for (const [w, h, d, l] of SZYBKO ? [[390, 844, false, "pl"]] : [[360, 640, false, "pl"], [390, 844, false, "pl"], [1280, 900, false, "pl"], [390, 844, true, "pl"], [390, 844, false, "en"]]) dodaj("brak", w, h, d, l, ["logowanie"]);

// Pomiary jednego ekranu (poza kontrastem/axe/emoji/celami z bibliotek pętli 2–5).
const ekranInfo = (p) => p.evaluate(() => {
  const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 1 && r.height > 1 && cs.visibility !== "hidden" && !e.closest("[hidden],[inert]") && (e.checkVisibility?.({ checkOpacity: true, checkVisibilityCSS: true }) ?? true); };
  const body = document.body.innerText;
  const smieci = [...new Set((body.match(/\bundefined\b|\bnull\b|\bNaN\b|\[object Object\]|\(\s*\)|\{\d\}/g) || []))];
  const nm = (e) => (e.getAttribute("aria-label") || e.getAttribute("aria-labelledby") && document.getElementById(e.getAttribute("aria-labelledby"))?.innerText || e.innerText || e.title || e.querySelector("img[alt]")?.alt || "").replace(/\s+/g, " ").trim();
  const bezPodpisu = [...document.querySelectorAll("button, a[href], [role=button], input:not([type=hidden]), select")].filter((e) => vis(e) && !e.closest("#skrot-wm")).filter((e) => { const n = /^(INPUT|SELECT)$/.test(e.tagName) ? (e.getAttribute("aria-label") || e.labels?.[0]?.innerText || e.placeholder || e.title || "") : nm(e); return !/[\p{L}\p{N}]/u.test(n); }).map((e) => e.outerHTML.slice(0, 120));
  const prim = [...document.querySelectorAll(".btn.primary, .ld-go, .lp-start")].filter((e) => vis(e) && !e.closest("nav, header.bar")).length;
  const nav = [...document.querySelectorAll("nav button, nav a, .tabs button, .tabbar button")].some(vis);
  const wstecz = [...document.querySelectorAll("button, a")].some((e) => vis(e) && /^(←|wróć|zamknij|close|back|×|✕)|wróć|zamknij|← /i.test(nm(e)));
  const primAny = [...document.querySelectorAll(".btn.primary, button.primary, .ld-go, .lp-start, .lk-go")].some(vis);
  const glowna = [...document.querySelectorAll(".btn.primary, .ld-go, .lp-start, #main button.primary")].find((e) => vis(e) && !e.closest("nav, header.bar"));
  const g = glowna?.getBoundingClientRect();
  const nazwy = { zakladki: [...document.querySelectorAll("nav button, nav a")].filter(vis).map((e) => nm(e).replace(/,.*$/, "").replace(/\d+$/, "").trim()), naglowki: [...document.querySelectorAll("#main h1, #main h2, #layer h1, #layer h2, [role=dialog] h2")].filter(vis).map((e) => e.innerText.replace(/\s+/g, " ").trim().slice(0, 60)), przyciski: [...document.querySelectorAll("#main button, #layer button, [role=dialog] button")].filter(vis).map((e) => nm(e).slice(0, 50)).filter((t) => t && t.length < 50) };
  return { poziomo: document.documentElement.scrollWidth > innerWidth, sw: document.documentElement.scrollWidth, smieci, bezPodpisu: bezPodpisu.slice(0, 8), nBezPodpisu: bezPodpisu.length, prim, slepa: !nav && !wstecz && !primAny, glownaWidoczna: g ? g.top >= 0 && g.bottom <= innerHeight : null, nazwy };
});
// Ruch przy „Mniej animacji” (html.calm) i prefers-reduced-motion: animacje, które dalej trwają po przerysowaniu ekranu.
const ruchCalm = (p) => p.evaluate(async () => { document.documentElement.classList.add("calm"); await new Promise((r) => setTimeout(r, 50)); const h = location.hash; location.hash = "#/__"; await new Promise((r) => setTimeout(r, 250)); location.hash = h; await new Promise((r) => setTimeout(r, 900));
  return [...new Set(document.getAnimations().filter((a) => a.playState === "running" && (a.effect?.getComputedTiming?.().duration || 0) > 0 && a.effect?.target && getComputedStyle(a.effect.target).visibility !== "hidden").map((a) => a.animationName || a.transitionProperty || "anim"))]; });

// Polskie w EN liczymy tylko dla tekstów interfejsu (dosłownie w kodzie strony). Treść, która wg README zostaje po polsku
// (lekcje, nazwiska z planu, wpisy starosty, imię Stasia, etykieta „przełącz na polski”), nie jest w kodzie albo jest wyłączona.
const ROOT = new URL("../../../", import.meta.url).pathname;
const ZRODLO = ["index.html", ...fs.readdirSync(ROOT).filter((f) => /\.js$/.test(f) && f !== "i18n-en.js")].map((f) => fs.readFileSync(ROOT + f, "utf8")).join("\n");
const zInterfejsu = (t) => !/\b(dr|prof|mgr|inż)\b\.?|^Staś$|przełącz na polski/.test(t) && t.split(/[·|•]/).map((x) => x.trim()).some((x) => x.length >= 4 && ZRODLO.includes(x));
const b = await chromium.launch();
const wyniki = [];
for (const u of UKLADY) {
  const tag = `${u.konto}-${u.w}${u.dark ? "-ciemny" : ""}${u.lang === "en" ? "-en" : ""}`;
  const p = await open(b, { konto: u.konto, w: u.w, h: u.h, dark: u.dark, lang: u.lang, fonts: true, wait: 3000, ls: { "skrot-green": u.dark ? "dark" : "light", ...STANY("").ls } });
  const bledy = [];
  p.on("requestfailed", (r) => { const url = r.url(); if (/^http:\/\/127\.0\.0\.1/.test(url) && !/favicon/.test(url)) bledy.push("żądanie: " + url.replace(/^http:\/\/127\.0\.0\.1:\d+\//, "")); });
  p.on("response", (r) => { if (r.status() >= 400 && /^http:\/\/127\.0\.0\.1/.test(r.url())) bledy.push(`HTTP ${r.status()} ${r.url().replace(/^http:\/\/127\.0\.0\.1:\d+\//, "")}`); });
  for (const nazwa of u.ekrany) {
    const e = E[nazwa]; p.errors.length = 0; bledy.length = 0;
    if (nazwa !== "logowanie") { await p.evaluate((h) => { if (window.lpClose) try { lpClose(true); } catch {} document.querySelectorAll("#layer [aria-label=Zamknij], dialog[open]").forEach((d) => d.close?.()); location.hash = "#" + h; }, e.h); await p.waitForTimeout(1600); }
    if (e.po) await e.po(p);
    await p.waitForTimeout(400);
    const plik = `${tag}-${nazwa}.png`;
    await p.screenshot({ path: ZR + plik }).catch(() => {});
    const info = await ekranInfo(p);
    await p.evaluate(() => document.querySelectorAll("body *").forEach((e) => { const cs = getComputedStyle(e); if (/gradient/.test(cs.backgroundImage) && /(^|\s)[0-4](\.\d+)?px/.test(cs.backgroundSize)) { e.dataset.ux6bg = e.style.backgroundImage || "-"; e.style.backgroundImage = "none"; } }));
    // shortcut: litery awatara (.kav-l) leżą na tle z SVG, którego pomiar nie widzi – pomijane; sprawdzić ręcznie, gdy zmieni się awatar.
    const k0 = await kontrast(p, "body").catch(() => ({ out: [] })), k = { out: k0.out.filter((x) => !/kav-l/.test(x.cel) && !(x.kontrast < 1.2 && !/[\p{L}\p{N}]/u.test(x.tekst))) }; // znak-ozdobnik niewidoczny z założenia (np. ✓ przed odhaczeniem)
    await p.evaluate(() => document.querySelectorAll("[data-ux6bg]").forEach((e) => { e.style.backgroundImage = e.dataset.ux6bg === "-" ? "" : e.dataset.ux6bg; delete e.dataset.ux6bg; }));
    // #skrot-wm: celowo blady znak wodny z adresem konta (aria-hidden, ochrona przed wyciekiem), nie tekst do czytania – jak w dzis-review.mjs
    const ax = (await axe(p, "body").catch(() => [])).filter((v) => ["color-contrast", "target-size", "button-name", "link-name"].includes(v.id)).map((v) => ({ ...v, nodes: v.nodes.filter((n) => !/skrot-wm/.test(n.cel)) })).map((v) => ({ ...v, n: v.nodes.length })).filter((v) => v.n);
    const em = await emoji(p, "#main, header.bar, nav, #layer, #login").catch(() => []);
    const c44 = (await hit(p, ":is(#main, #layer, nav, header.bar, #login, [role=dialog]) :is(button, a[href], input:not([type=hidden]):not(label > [type=checkbox]):not(label > [type=radio]), select, summary, [role=button], [role=tab], label:has(> [type=checkbox]), label:has(> [type=radio]))").catch(() => [])).filter((x) => x.w && x.h && (x.w < 44 || x.h < 44) && !/hd-k/.test(x.cel)); // wyjątek: klawiatura QWERTY Hasła dnia (10 klawiszy w rzędzie – przy 360 px fizycznie max ~33 px szerokości; wysokość 48 px)
    await p.evaluate(() => scrollTo(0, 0));
    const pl = u.lang === "en" ? (await polskie(p, "body").catch(() => [])).filter(zInterfejsu) : [];
    let ruch = null; if (u.konto === "platne" && u.w === 390 && !u.dark && u.lang === "pl" && nazwa !== "logowanie") ruch = await ruchCalm(p).catch(() => null);
    if (ruch) await p.evaluate(() => document.documentElement.classList.remove("calm"));
    wyniki.push({ uklad: tag, ekran: nazwa, zrzut: "zrzuty/kontrola/" + plik, ...info, bledyKonsoli: [...p.errors, ...bledy].slice(0, 6),
      kontrast: k.out.filter((x) => x.wymagany).slice(0, 8), nKontrast: k.out.filter((x) => x.wymagany).length, tekst12: k.out.filter((x) => x.maly).slice(0, 6), nTekst12: k.out.filter((x) => x.maly).length,
      axe: ax.map((v) => ({ id: v.id, n: v.n, przyklad: v.nodes[0]?.cel })), emoji: em.slice(0, 6), cele44: c44.slice(0, 8), nCele44: c44.length, polskieWEn: pl.slice(0, 8), ruchPrzyCalm: ruch });
    process.stdout.write(".");
  }
  await p.context().close();
}
await b.close();

// Podsumowanie według rodzajów (kolumny B2). Ekrany z głównym przyciskiem sprawdzamy przy 360×640.
const RODZ = {
  poziome_przewijanie: (x) => x.poziomo && /-3[67]\d|-390/.test(x.uklad) === true && x.poziomo,
  bledy_konsoli: (x) => x.bledyKonsoli.length > 0,
  widoczne_undefined_null: (x) => x.smieci.length > 0,
  kontrast_ponizej_AA: (x) => x.nKontrast > 0 || x.axe.some((a) => a.id === "color-contrast"),
  cele_ponizej_44: (x) => x.nCele44 > 0,
  tekst_ponizej_12: (x) => x.nTekst12 > 0,
  bez_podpisu: (x) => x.nBezPodpisu > 0 || x.axe.some((a) => /button-name|link-name/.test(a.id)),
  emoji_jako_ikony: (x) => x.emoji.length > 0,
  wiecej_niz_1_glowny: (x) => x.prim > 1,
  slepe_uliczki: (x) => x.slepa,
  glowna_akcja_ponizej_ekranu_360: (x) => /-360$/.test(x.uklad) && E[x.ekran]?.glowna && x.glownaWidoczna === false,
  polskie_w_en: (x) => x.polskieWEn.length > 0,
  ruch_przy_calm: (x) => Array.isArray(x.ruchPrzyCalm) && x.ruchPrzyCalm.length > 0,
};
RODZ.poziome_przewijanie = (x) => x.poziomo;
const podsum = Object.fromEntries(Object.entries(RODZ).map(([k, f]) => [k, wyniki.filter(f).map((x) => `${x.uklad}/${x.ekran}`)]));
const rodzajeZNaruszeniami = Object.entries(podsum).filter(([, v]) => v.length).map(([k]) => k);
const technika = Math.max(0, 1.5 - 0.25 * rodzajeZNaruszeniami.length);
// Słownik nazw: ile razy która nazwa pojawia się jako zakładka / nagłówek / przycisk (PL, wszystkie układy).
const slownik = { zakladki: {}, naglowki: {}, przyciski: {} };
for (const x of wyniki.filter((x) => !/-en$/.test(x.uklad))) for (const [k, arr] of Object.entries(x.nazwy)) for (const t of new Set(arr)) if (t) slownik[k][t] = (slownik[k][t] || 0) + 1;
const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n);
const out = { runda: +R, kiedy: new Date().toISOString(), ekranow: wyniki.length, rodzaje: podsum, rodzaje_z_naruszeniami: rodzajeZNaruszeniami, technika_punkty: technika, slownik: { zakladki: top(slownik.zakladki, 40), naglowki: top(slownik.naglowki, 120), przyciski: top(slownik.przyciski, 200) }, ekrany: wyniki.map(({ nazwy, ...r }) => r) };
fs.writeFileSync(DIR + "kontrola.json", JSON.stringify(out, null, 1));
const md = [`# Kontrola automatyczna – runda ${R}`, "", `${wyniki.length} ekranów (konta: platne, starosta, darmowe, proba, proba-koniec, brak; 360×640, 390×844, 1280×900; jasny i ciemny; PL i EN). Zrzuty: \`zrzuty/kontrola/\`.`, "",
  `**Technika (z D): ${technika} / 1,5** – rodzaje z naruszeniami: ${rodzajeZNaruszeniami.length ? rodzajeZNaruszeniami.join(", ") : "brak"}.`, "",
  "| rodzaj | ekrany z naruszeniem | przykłady |", "|---|---|---|",
  ...Object.entries(podsum).map(([k, v]) => `| ${k} | ${v.length} | ${v.slice(0, 6).join(", ")}${v.length > 6 ? " …" : ""} |`), "",
  "## Szczegóły naruszeń (pierwsze przykłady)", "",
  ...wyniki.flatMap((x) => { const l = []; if (x.poziomo) l.push(`poziome przewijanie (scrollWidth ${x.sw})`); if (x.bledyKonsoli.length) l.push("konsola: " + x.bledyKonsoli.join(" · ").slice(0, 300)); if (x.smieci.length) l.push("widać: " + x.smieci.join(", ")); if (x.nKontrast) l.push(`kontrast (${x.nKontrast}): ` + x.kontrast.slice(0, 3).map((c) => `„${c.tekst}” ${c.kontrast}:1`).join("; ")); if (x.axe.length) l.push("axe: " + x.axe.map((a) => `${a.id}×${a.n}`).join(", ")); if (x.nCele44) l.push(`cele < 44 px (${x.nCele44}): ` + x.cele44.slice(0, 4).map((c) => JSON.stringify(c).slice(0, 90)).join("; ")); if (x.nTekst12) l.push(`tekst < 12 px (${x.nTekst12}): ` + x.tekst12.slice(0, 3).map((c) => `„${c.tekst}” ${c.maly}px`).join("; ")); if (x.nBezPodpisu) l.push(`bez podpisu (${x.nBezPodpisu}): \`${x.bezPodpisu[0]}\``); if (x.emoji.length) l.push("emoji: " + x.emoji.map((e) => e.e + " " + e.t).join("; ").slice(0, 160)); if (x.prim > 1) l.push(`głównych przycisków: ${x.prim}`); if (x.slepa) l.push("ŚLEPA ULICZKA"); if (/-360$/.test(x.uklad) && E[x.ekran]?.glowna && x.glownaWidoczna === false) l.push("główna akcja poniżej pierwszego ekranu"); if (x.polskieWEn.length) l.push("PL w EN: " + x.polskieWEn.slice(0, 4).join(" | ").slice(0, 200)); if (x.ruchPrzyCalm?.length) l.push("ruch przy calm: " + x.ruchPrzyCalm.join(", "));
    return l.length ? [`- **${x.uklad} / ${x.ekran}**: ${l.join(" · ")}`] : []; }), "",
  "## Słownik nazw (ile ekranów pokazuje daną nazwę)", "", "**Zakładki:** " + out.slownik.zakladki.map(([t, n]) => `${t} (${n})`).join(", "), "",
  "**Nagłówki:** " + out.slownik.naglowki.map(([t, n]) => `${t} (${n})`).join(", "), "", "**Przyciski:** " + out.slownik.przyciski.map(([t, n]) => `${t} (${n})`).join(", "), ""].join("\n");
fs.writeFileSync(DIR + "kontrola.md", md);
console.log(`\n${wyniki.length} ekranów · technika ${technika} · rodzaje: ${rodzajeZNaruszeniami.join(", ") || "brak"}`);
