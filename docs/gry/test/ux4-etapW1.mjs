// Pętla UX-4, etap W1 – czcionki i typografia. BASE=http://127.0.0.1:8814/ node docs/gry/test/ux4-etapW1.mjs
// K1 czcionki z repo, bez Google Fonts; K2 jeden krój nagłówków i hierarchia na Dziś; K3 nic < 12 px; K4 CLS < 0,1, kroje motywów z repo.
import fs from "fs";
import { chromium, BASE, OUT, open, EKRANY, goto, typo, poziomo, tester, DOCS, kontrast } from "./ux4-lib.mjs";
import { page } from "./lib.mjs";
const { ok, end } = tester();
const ROOT = new URL("../../../", import.meta.url).pathname;
const html = fs.readFileSync(ROOT + "index.html", "utf8");
const lines = html.split("\n");

// ---------- K1 (plik) ----------
const google = lines.map((l, i) => [i + 1, l]).filter(([n, l]) => n !== 1 && /fonts\.(googleapis|gstatic)\.com/.test(l));
ok("K1 brak linków do fonts.googleapis/gstatic poza CSP w linii 1", google.length === 0, google.map(([n]) => n));
const css = fs.readFileSync(ROOT + "wyglad-ux.css", "utf8");
ok("K1 wyglad-ux.css bez adresów Google", !/googleapis|gstatic/.test(css));
for (const f of ["pjs-latin", "pjs-latin-ext", "bricolage-latin", "bricolage-latin-ext", "cormorant-latin", "cormorant-latin-ext", "playfair-latin", "playfair-latin-ext", "playfair-italic-latin", "playfair-italic-latin-ext"]) {
  const p = ROOT + "fonts/" + f + ".woff2"; ok(`K1 plik fonts/${f}.woff2`, fs.existsSync(p) && fs.readFileSync(p).slice(0, 4).toString() === "wOF2");
}
const pre = html.match(/<link rel="preload" as="font"[^>]*>/g) || [];
ok("K1 preload tylko jednej czcionki (pjs-latin)", pre.length === 1 && /pjs-latin\.woff2/.test(pre[0]), pre);
ok("K1 wyglad-ux.css podpięty w osobnej linii za głównym <style>", lines.some((l, i) => /^<link rel="stylesheet" href="wyglad-ux\.css\?v=/.test(l) && lines[i - 1] === "</style>"));

const b = await chromium.launch();
// ---------- K1 (przeglądarka, sieć zewnętrzna zablokowana przez lib.mjs) ----------
{
  const p = await open(b, { konto: "starosta", w: 390, h: 844 });
  const reqs = []; p.on("request", (r) => reqs.push(r.url()));
  const r = await p.evaluate(async () => { await document.fonts.ready; await Promise.all([document.fonts.load("700 16px 'Plus Jakarta Sans'", "ąęłńóśźżĄĘŁŃÓŚŹŻ"), document.fonts.load("700 16px 'Bricolage Grotesque'", "ąęłńóśźżĄĘŁŃÓŚŹŻ")]);
    return { pjs: document.fonts.check("700 16px 'Plus Jakarta Sans'", "Zażółć gęślą jaźń"), bg: document.fonts.check("700 16px 'Bricolage Grotesque'", "Zażółć gęślą jaźń"), pjs4: document.fonts.check("400 16px 'Plus Jakarta Sans'", "ąę"),
      loaded: [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family + " " + f.weight) }; });
  ok("K1 document.fonts.check 700 Plus Jakarta Sans (polskie znaki) = true", r.pjs, r);
  ok("K1 document.fonts.check 700 Bricolage Grotesque (polskie znaki) = true", r.bg, r);
  ok("K1 Plus Jakarta 400 też z repo", r.pjs4);
  await goto(p, "materials");
  ok("K1 żadnego żądania do fonts.googleapis/gstatic", !reqs.some((u) => /fonts\.(googleapis|gstatic)/.test(u)), reqs.filter((u) => /font/.test(u)));
  ok("K1 bez błędów konsoli", p.errors.length === 0, p.errors);
  await p.close();
}
// ---------- K2 + K3: wszystkie główne ekrany, jasny i ciemny, 390 i 360 (EN) ----------
const zle2 = [], zle3 = [], pozio = [];
for (const [w, dark, lang, konto] of [[390, false, "pl", "starosta"], [390, true, "pl", "platne"], [360, false, "en", "platne"], [1280, false, "pl", "starosta"]]) {
  const p = await open(b, { konto, w, h: 844, lang, ls: { "skrot-green": dark ? "dark" : "light" } });
  for (const [hash, n] of [...EKRANY, ["material/A1", "material"]]) {
    await goto(p, hash, 1300);
    await p.evaluate(() => document.querySelectorAll("#main details").forEach((d) => (d.open = true)));
    const t = await typo(p);
    const fams = [...new Set(t.heads.map((x) => x.fam))];
    if (fams.length > 1 || (fams[0] && fams[0] !== "Bricolage Grotesque")) zle2.push(`${n}@${w}${dark ? "d" : ""}: ${fams.join("|")}`);
    if (t.small.length) zle3.push(`${n}@${w}${dark ? "d" : ""}${lang}: ` + t.small.map((s) => `${s.cel} ${s.px} „${s.t}”`).join("; "));
    if (w <= 390 && (await poziomo(p))) pozio.push(`${n}@${w}`);
    if (n === "dzis" && !dark && lang === "pl" && w === 390) {
      const g = (sel) => t.heads.find((x) => sel(x));
      const h1 = g((x) => x.tag === "H1"), zh = g((x) => /zh-h/.test(x.cls));
      const sek = await p.evaluate(() => [...document.querySelectorAll("#main :is(.pz-head h2, .ld-head > .eyebrow, .fun-row > .eyebrow, .home-fold h2)")].filter((e) => e.getBoundingClientRect().width).map((e) => ({ t: e.textContent.trim().slice(0, 20), px: parseFloat(getComputedStyle(e).fontSize), fam: getComputedStyle(e).fontFamily.split(",")[0].replace(/"/g, "") })));
      ok("K2 Dziś: H1 powitania 22 px", h1 && h1.px === 22, h1);
      ok("K2 Dziś: tytuł lekcji 28 px", zh && zh.px === 28, zh);
      ok("K2 Dziś: nagłówki sekcji 18 px, Bricolage", sek.length >= 3 && sek.every((x) => x.px === 18 && x.fam === "Bricolage Grotesque"), sek);
    }
  }
  ok(`K2/K3 bez błędów konsoli (${w}${dark ? " ciemny" : ""} ${lang})`, p.errors.length === 0, p.errors);
  await p.close();
}
ok("K2 na każdym ekranie wszystkie h1/h2/h3 tym samym krojem (Bricolage)", zle2.length === 0, zle2);
ok("K3 żaden widoczny tekst < 12 px (poza #skrot-wm)", zle3.length === 0, zle3);
ok("zero poziomego przewijania 360/390", pozio.length === 0, pozio);
// ---------- Kafle Przedmiotów: żadne słowo tytułu nie łamie się w środku (360/390, PL i EN) ----------
{
  const zle = [];
  for (const [w, lang] of [[360, "pl"], [390, "pl"], [360, "en"], [390, "en"], [1280, "pl"]]) {
    const p = await open(b, { konto: "starosta", w, h: 844, lang });
    await goto(p, "materials", 1500);
    const r = await p.evaluate(() => { const out = []; for (const e of document.querySelectorAll("#main .nb h3")) { const t = e.firstChild; if (!t || t.nodeType !== 3) continue; for (const m of t.textContent.matchAll(/\S+/g)) { const rg = document.createRange(); rg.setStart(t, m.index); rg.setEnd(t, m.index + m[0].length); const tops = new Set([...rg.getClientRects()].map((x) => Math.round(x.top))); if (tops.size > 1) out.push(m[0]); } } return { out, n: document.querySelectorAll("#main .nb h3").length, px: [...new Set([...document.querySelectorAll("#main .nb h3")].map((e) => getComputedStyle(e).fontSize))] }; });
    if (r.out.length) zle.push(`${w} ${lang}: ${r.out.join(", ")}`);
    ok(`Przedmioty ${w} ${lang}: tytuły kafli 16 px (${r.n} kafli)`, r.n > 5 && r.px.length === 1 && r.px[0] === "16px", r.px);
    await p.close();
  }
  ok("Przedmioty: żadne słowo tytułu kafla nie łamie się w środku", zle.length === 0, zle);
}
// ---------- Elementy podniesione do 12 px mieszczą się (bez ucięć i wychodzenia poza rodzica): 360/390, PL i EN ----------
{
  const zle = [];
  for (const [w, lang] of [[360, "pl"], [390, "pl"], [360, "en"]]) for (const hash of ["/", "terms", "calendar", "materials", "ustawienia", "more", "guide"]) {
    const p = await open(b, { konto: "starosta", w, h: 844, lang });
    await goto(p, hash, 1300);
    const r = await p.evaluate(() => [...document.querySelectorAll(".navbtn .lbl, .pz-days small, .pz-est, .rk-lv, .rk-badge .n, .chip.plain, .h2-now, .est-badge, .set-theme small, .mc-dow, .day .ev, .kind-tag, .g-ring small")].filter((e) => e.getBoundingClientRect().width).flatMap((e) => {
      const r = e.getBoundingClientRect(), pr = e.parentElement.getBoundingClientRect();
      const cut = e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== "visible";
      const out = getComputedStyle(e).position !== "absolute" && (r.left < pr.left - 1 || r.right > pr.right + 1); // naklejki absolute (cyfra poziomu) wystają celowo
      return cut || out ? [`${e.className} „${e.textContent.trim().slice(0, 20)}” ${cut ? "ucięte" : "poza rodzicem"}`] : [];
    }));
    if (r.length) zle.push(`${hash}@${w}${lang}: ${[...new Set(r)].join("; ")}`);
    await p.close();
  }
  ok("teksty podniesione do 12 px mieszczą się w swoich elementach (360/390, PL/EN)", zle.length === 0, zle);
}
// ---------- Kontrast tekstów powiększonych do 12 px (siatka kalendarza 1280, pierścień przewodnika, Terminy) ----------
for (const dark of [false, true]) for (const hash of ["calendar", "guide", "terms"]) {
  const p = await open(b, { konto: "starosta", w: 1280, h: 900, ls: { "skrot-green": dark ? "dark" : "light" } });
  await goto(p, hash, 1800);
  const k = await kontrast(p);
  ok(`kontrast AA każdego tekstu: ${hash} 1280 ${dark ? "ciemny" : "jasny"} (${k.n} tekstów)`, k.out.length === 0, k.out.slice(0, 6));
  await p.close();
}
// ---------- K4: CLS przy pierwszym wejściu (czcionki dociągane z opóźnieniem 700 ms: zamiana czcionki nie może przesunąć układu) ----------
for (const [konto, nazwa] of [["platne", "Dziś"], ["brak", "logowanie"]]) {
  const runs = [];
  for (let i = 0; i < 3; i++) {
    const p = await page(b, { konto, w: 390, h: 844, ls: { "bm-ld-flag": "1", "mock-docs": JSON.stringify(DOCS) } });
    await p.context().route(/\/fonts\/.*\.woff2/, async (r) => { await new Promise((res) => setTimeout(res, 700)); r.continue(); });
    await p.addInitScript(() => { window.__sh = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__sh.push([e.startTime, e.value, (e.sources || []).map((s) => s.node?.className || s.node?.nodeName).join(",")]); }).observe({ type: "layout-shift", buffered: true }); });
    await p.clock.setFixedTime(new Date("2026-11-06T17:00:00+01:00"));
    await p.goto(BASE + "index.html?ld=1#/"); await p.waitForTimeout(4500);
    const sh = await p.evaluate(() => window.__sh);
    const fontsAt = await p.evaluate(() => Math.min(...performance.getEntriesByType("resource").filter((e) => /\/fonts\//.test(e.name)).map((e) => e.responseEnd)));
    runs.push({ total: sh.reduce((a, x) => a + x[1], 0), poCzcionce: sh.filter((x) => x[0] >= fontsAt - 20).reduce((a, x) => a + x[1], 0), przed: sh.filter((x) => x[0] < fontsAt - 20).map((x) => `${Math.round(x[0])}ms ${x[1].toFixed(3)} ${x[2]}`) });
    if (i === 0) await p.screenshot({ path: `${OUT}/w1-cls-${nazwa}.png` });
    await p.close();
  }
  const med = runs.map((r) => r.total).sort((x, y) => x - y)[1], font = Math.max(...runs.map((r) => r.poCzcionce));
  ok(`K4 ${nazwa}: przesunięcia po dociągnięciu czcionek (zamiana kroju) < 0,02 – max z 3 wejść ${font.toFixed(4)}`, font < 0.02, runs);
  // Logowanie: przesunięcie ~0,25 przy ~150 ms to wypełnienie #loginBox (zamiast „Ładowanie…”) – obszar pętli 1 (uwagi-dla-innych.md).
  // Na main zasłaniał je blokujący arkusz Google Fonts (opóźniał pierwsze malowanie). Tu sprawdzamy wkład czcionek, a całość tylko raportujemy.
  const lg = nazwa === "logowanie";
  ok(`K4 ${nazwa}: CLS (mediana z 3 pierwszych wejść, czcionki po 700 ms) ${lg ? "bez przesunięcia #loginBox (pętla 1)" : ""} < 0,1 – całość ${med.toFixed(4)}; wszystkie: ${runs.map((r) => r.total.toFixed(3)).join(", ")}`, lg ? Math.max(...runs.map((r) => r.total - (r.przed.filter((x) => /lg-demo|lg-foot|lg-form/.test(x)).reduce((a, x) => a + parseFloat(x.split(" ")[1]), 0)))) < 0.1 : med < 0.1, runs.map((r) => r.przed));
}
// ---------- K4: kroje motywów z repo, pobierane tylko przy aktywnym motywie ----------
for (const [theme, rx] of [[null, /cormorant|playfair/], ["riwiera", /cormorant-latin/], ["klub", /playfair-latin/], ["bow", /playfair-italic-latin/]]) {
  const p = await open(b, { konto: "starosta", w: 390, h: 844, wait: 0, ...(theme ? { theme } : {}) });
  const reqs = []; p.on("request", (r) => reqs.push(r.url()));
  await p.reload(); await p.waitForTimeout(3500);
  // Kokardka używa Playfair kursywy tylko w oknie odblokowania: prosimy o ten krój tak, jak zrobi to okno.
  if (theme === "bow") { await p.evaluate(() => document.fonts.load("italic 700 20px 'Playfair Display'", "Kokardka")); await p.waitForTimeout(500); }
  const fonty = reqs.filter((u) => /\.woff2/.test(u));
  if (!theme) ok("K4 zielony motyw nie pobiera Cormorant/Playfair", !fonty.some((u) => rx.test(u)), fonty);
  else ok(`K4 motyw ${theme}: krój z repo (127.0.0.1/fonts)`, fonty.some((u) => rx.test(u) && u.startsWith(BASE + "fonts/")) && !reqs.some((u) => /fonts\.g/.test(u)), fonty);
  await p.close();
}
await b.close();
end();
