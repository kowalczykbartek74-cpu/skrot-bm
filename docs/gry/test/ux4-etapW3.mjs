// Pętla UX-4, etap W3 – Przedmioty, stany puste, znak wodny, marka. BASE=http://127.0.0.1:8814/ node docs/gry/test/ux4-etapW3.mjs
import fs from "fs";
import { chromium, OUT, open, goto, poziomo, kontrast, tester } from "./ux4-lib.mjs";
const { ok, end } = tester();
const ROOT = new URL("../../../", import.meta.url).pathname;
const b = await chromium.launch();
// ---------- K1: kafle Przedmiotów ----------
for (const [w, lang, dark] of [[360, "pl", false], [390, "pl", true], [1280, "pl", false], [390, "en", false], [360, "en", true]]) {
  const p = await open(b, { konto: "starosta", w, h: 900, lang, ls: { "skrot-green": dark ? "dark" : "light" } });
  await goto(p, "materials", 1500);
  const r = await p.evaluate(() => {
    const tiles = [...document.querySelectorAll("#main .nb")].filter((e) => e.getBoundingClientRect().width);
    const bars = tiles.map((t) => t.querySelector(".nb-bar")).filter(Boolean);
    const widths = [...new Set(bars.map((x) => Math.round(x.getBoundingClientRect().width)))];
    const nad = bars.every((bar) => { const txt = bar.parentElement.querySelector(":scope > :not(.nb-bar)"); const B = bar.getBoundingClientRect(), T = txt?.getBoundingClientRect(); return !txt || B.bottom <= T.top + 1 || (B.right <= T.left + 1 && B.top >= T.top - 1 && B.bottom <= T.bottom + 1); }); // Wygląd pro: pasek może stać w jednym wierszu przed tekstem
    const tileW = [...new Set(tiles.filter((t) => !t.classList.contains("nb-mine")).map((t) => Math.round(t.getBoundingClientRect().width)))];
    const pills = [...document.querySelectorAll("#main .nb .chip")].map((c) => c.innerText.replace(/\s+/g, " ").trim());
    const nw = [...document.querySelectorAll("#main .nb .nw")].map((e) => ({ t: e.textContent, lines: new Set([...e.getClientRects()].map((x) => Math.round(x.top))).size }));
    return { n: bars.length, widths, nad, tileW, pills, nw };
  });
  const tag = `${w} ${lang}${dark ? " ciemny" : ""}`;
  ok(`K1 ${tag}: wszystkie paski tej samej szerokości (${r.n} pasków)`, r.n >= 3 && Math.max(...r.widths) - Math.min(...r.widths) <= 1, r.widths); // ±1 px z zaokrąglenia
  ok(`K1 ${tag}: pasek nad tekstem albo w tym samym wierszu przed nim`, r.nad);
  ok(`K1 ${tag}: „77 dni” / „77 days” w jednej linii`, r.nw.length >= 3 && r.nw.every((x) => x.lines === 1), r.nw.filter((x) => x.lines !== 1));
  ok(`K1 ${tag}: krótkie pigułki terminów (bez „zaliczenie wykładu”)`, r.pills.length >= 3 && r.pills.every((t) => !/zaliczenie wykładu|lecture exam/.test(t)) && r.pills.some((t) => lang === "en" ? /^lecture in \d+ days$/.test(t) : /^wykład za \d+ dni$/.test(t)), r.pills);
  ok(`K1 ${tag}: bez poziomego przewijania, bez błędów`, !(await poziomo(p)) && p.errors.length === 0, p.errors);
  if (w === 390) await p.screenshot({ path: `${OUT}/w3-przedmioty-${lang}${dark ? "-ciemny" : ""}.png`, fullPage: true });
  await p.close();
}
// ---------- K2: stany puste ze Stasiem, txt(), brak „undefined”/„null” ----------
for (const [w, lang, dark] of [[390, "pl", false], [360, "en", true], [1280, "pl", false]]) {
  const p = await open(b, { konto: "platne", w, h: 844, lang, ls: { "skrot-green": dark ? "dark" : "light" } });
  await goto(p, "po5/nie-ma-takiego", 1600);
  const e = await p.evaluate(() => { const x = document.querySelector("#main .empty.ux4-empty"); if (!x) return null; const r = x.getBoundingClientRect();
    return { stas: !!x.querySelector(".stas-face svg"), btn: [...x.querySelectorAll("button")].map((b) => ({ c: b.className, t: b.textContent, h: b.getBoundingClientRect().height })), h2: x.querySelector("h2")?.textContent, art: [...x.querySelectorAll(".art")].filter((a) => a.getBoundingClientRect().width).length, pod: getComputedStyle(x, "::before").content, w: r.width }; });
  const tag = `${w} ${lang}${dark ? " ciemny" : ""}`;
  ok(`K2 ${tag}: wygasłe „Po zajęciach” = .empty ze Stasiem i jednym głównym przyciskiem`, e && e.stas && e.btn.length === 1 && /primary/.test(e.btn[0].c) && e.btn[0].h >= 44 && e.art === 0 && e.pod === "none", e);
  ok(`K2 ${tag}: tytuł i przycisk przetłumaczone`, e && (lang === "en" ? e.h2 === "This summary has expired" && e.btn[0].t === "5 minutes · from class" : e.h2 === "To podsumowanie wygasło" && e.btn[0].t === "5 minut · z zajęć"), e);
  const k = await kontrast(p); ok(`K2 ${tag}: kontrast AA w stanie pustym`, k.out.length === 0, k.out);
  if (w === 390) await p.screenshot({ path: `${OUT}/w3-pusty-po5.png` });
  await p.locator("#main .ux4-empty button").click(); await p.waitForTimeout(800);
  ok(`K2 ${tag}: przycisk prowadzi do Powtórki w 5 minut (#/po)`, await p.evaluate(() => /#\/?po$/.test(location.hash)), await p.evaluate(() => location.hash));
  ok(`K2 bez błędów konsoli (${tag})`, p.errors.length === 0, p.errors);
  await p.close();
}
{
  const p = await open(b, { konto: "platne", w: 390, h: 844 });
  ok("K2 txt() globalnie: undefined/null → pusty tekst", await p.evaluate(() => typeof window.txt === "function" && window.txt(undefined) === "" && window.txt(null) === "" && window.txt(0) === "0" && window.ZD_UX4.txt("a") === "a"));
  // „rozdz. undefined” na ścieżce przedmiotu (courseSection) to obszar pętli 5 – ten ekran pomijamy (uwagi-dla-innych.md).
  const zle = [];
  for (const h of ["/", "materials", "review", "terms", "calendar", "more", "ustawienia", "glossary", "guide", "material/A1", "po", "po5/nie-ma"]) {
    await goto(p, h, 1300);
    const t = await p.evaluate(() => document.querySelector("#main").innerText);
    if (/\bundefined\b|\bnull\b|\bNaN\b/.test(t)) zle.push(`${h}: ${t.match(/.{0,30}\b(undefined|null|NaN)\b.{0,10}/)[0]}`);
  }
  ok("K2 na ekranach pętli innerText bez „undefined”, „null”, „NaN”", zle.length === 0, zle);
  await p.close();
}
// ---------- K3: znak wodny ----------
for (const w of [360, 390, 430, 768, 1280]) {
  const p = await open(b, { konto: "platne", w, h: 844, ls: { "skrot-green": "light" } });
  const zle = [];
  let geo;
  for (const h of ["/", "materials", "review", "terms", "calendar", "more", "glossary", "guide"]) {
    await goto(p, h, 1300);
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += 500) {
      await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(80);
      const r = await p.evaluate(() => {
        const wm = document.getElementById("skrot-wm"); if (!wm) return { brak: true };
        const a = wm.getBoundingClientRect(), wrap = document.querySelector("#main").getBoundingClientRect();
        const kol = (() => { const c = getComputedStyle(document.querySelector("#main")); return { l: wrap.left + parseFloat(c.paddingLeft), r: wrap.right - parseFloat(c.paddingRight) }; })();
        const hits = [...document.querySelectorAll("#main *, header.bar *, nav *")].filter((e) => { const c = getComputedStyle(e); if (c.visibility === "hidden") return false; const tlo = c.backgroundColor !== "rgba(0, 0, 0, 0)" || parseFloat(c.borderRightWidth) > 0 || c.boxShadow !== "none" || c.backgroundImage !== "none"; if (!tlo) return false; const r = e.getBoundingClientRect(); return r.width > 30 && r.height > 10 && r.right > a.left && r.left < a.right && r.bottom > a.top && r.top < a.bottom; }).map((e) => `${e.tagName}.${String(e.className).split(" ")[0]}`);
        // Znak leży pod treścią (z-index < 0): karty go przykrywają, więc liczymy tylko przecięcia, gdy byłby nad treścią.
        const pod = +getComputedStyle(wm).zIndex < 0;
        return { pod, op: +getComputedStyle(wm).opacity, l: Math.round(a.left), r: Math.round(a.right), kolR: Math.round(kol.r), hits: [...new Set(hits)].slice(0, 5) };
      });
      geo = r;
      if (r.brak || (!r.pod && r.hits.length) || r.l < r.kolR) zle.push(`${h}@${w} y=${y}: ${JSON.stringify(r)}`);
    }
  }
  ok(`K3 ${w}: znak wodny w marginesie poza kolumną treści, nie przecina żadnej karty (8 ekranów, cała wysokość)`, zle.length === 0, zle.slice(0, 5));
  ok(`K3 ${w}: krycie ${w <= 430 ? "0,14 na telefonie" : "0,22"}`, geo && geo.op === (w <= 430 ? 0.14 : 0.22), geo);
  await p.close();
}
// ---------- K4: marka ----------
const html = fs.readFileSync(ROOT + "index.html", "utf8").split("\n");
const marka = html.map((l, i) => [i + 1, l]).filter(([, l]) => /Skr[óo]c|Skr[óo]t BM|emblem\.png/.test(l)).filter(([, l]) => !/^\s*\/\//.test(l) && !/PRODID:-\/\/Skrot BM\/\/Terminy/.test(l));
ok("K4 grep „Skróc|Skrót BM|emblem.png” w index.html: tylko komentarze i jednorazowe .ics (pętla 2)", marka.length === 0, marka.map(([n, l]) => `${n}: ${l.trim().slice(0, 80)}`));
const svg = fs.readFileSync(ROOT + "icons/odznaka-zdawalni.svg", "utf8");
ok(`K4 odznaka „Mistrz Zdawalni” jako SVG < 4 KB (${svg.length} B)`, svg.length < 4096 && /<svg/.test(svg) && /ZDAWALNI/.test(svg));
ok("K4 odznaka używana w przewodniku", html.filter((l) => /icons\/odznaka-zdawalni\.svg/.test(l)).length === 2);
const pal = fs.readFileSync(ROOT + "PALETA.md", "utf8");
ok("K4 PALETA.md: tytuł Zdawalni, krój Onest, ciemny motyw, pigułki dla chipów", /^# Paleta Zdawalni/.test(pal) && /Onest/.test(pal) /* Wygląd pro: jeden krój Onest zamiast dwóch */ && /[Cc]iemny/.test(pal) && /Pigułki \(999 px\) dla chipów/.test(pal) && !/bez trybu ciemnego/.test(pal));
for (const lang of ["pl", "en"]) {
  const p = await open(b, { konto: "platne", w: 390, h: 844, lang });
  await goto(p, "guide", 1500);
  const t = await p.evaluate(() => document.querySelector("#main").innerText);
  ok(`K4 przewodnik ${lang}: „${lang === "en" ? "Guide to Zdawalni" : "Przewodnik po Zdawalni"}”, bez „Skrót BM”`, (lang === "en" ? /GUIDE TO ZDAWALNI|Guide to Zdawalni/i : /PRZEWODNIK PO ZDAWALNI/i).test(t) && !/Skr[óo]t BM|Skr[óo]cie BM/i.test(t), t.slice(0, 200));
  await p.screenshot({ path: `${OUT}/w3-przewodnik-${lang}.png` });
  await p.close();
}
{
  // odznaka po zdanym teście przewodnika: obraz SVG się wczytuje
  const p = await open(b, { konto: "platne", w: 390, h: 844 });
  await goto(p, "guide", 1200);
  const r = await p.evaluate(async () => { const i = new Image(); i.src = "icons/odznaka-zdawalni.svg"; await i.decode(); return { w: i.naturalWidth, h: i.naturalHeight }; });
  ok("K4 odznaka SVG wczytuje się w przeglądarce", r.w > 0 && r.h > 0, r);
  await p.close();
}
await b.close();
end();
