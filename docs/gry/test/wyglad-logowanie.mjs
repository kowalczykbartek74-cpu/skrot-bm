// Wygląd ekranu wejścia i przykładowej lekcji (przegląd 8.11.2026): tryb ciemny systemu, przewijanie strony,
// cele dotyku ≥ 44 px, „Krok 3 z 3”, plakietka na karcie kierunku, podpowiedź przy tabeli w polityce prywatności.
import fs from "fs";
import { chromium, page, BASE, shot } from "./lib.mjs";
const DOC = JSON.parse(fs.readFileSync(new URL("./pokaz-owi.json", import.meta.url), "utf8"));
const b = await chromium.launch();
let bad = 0;
const ok = (t, v, info) => { console.log((v ? "OK  " : "BŁĄD") + " " + t + (v || info === undefined ? "" : "  → " + JSON.stringify(info))); if (!v) bad++; };
const fresh = async (opts) => {
  const p = await page(b, { konto: "brak", ls: { "mock-docs": JSON.stringify({ materialSimple: { "owi-01-principles": DOC } }) }, ...opts });
  await p.addInitScript(() => { if (!sessionStorage.getItem("k-init")) { sessionStorage.setItem("k-init", "1"); for (const k of ["bm-group", "bm-sub", "skrot-rocznik", "skrot-kierunek"]) localStorage.removeItem(k); } });
  return p;
};
// Najniższy kontrast tekstu w elemencie (WCAG; tło = pierwszy nieprzezroczysty przodek).
const kontrast = (sel) => (s) => {
  const P = (c) => (c.match(/[\d.]+/g) || [0, 0, 0, 0]).map(Number);
  const L = (c) => { const a = c.slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; };
  const out = [];
  document.querySelectorAll(s + " *").forEach((e) => {
    const t = [...e.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent.trim()).join(" ");
    if (!t || !e.getClientRects().length) return;
    let p = e, bg = null; while (p) { const c = P(getComputedStyle(p).backgroundColor); if (c.length < 4 || c[3] > 0.5) { bg = c; break; } p = p.parentElement; }
    const r1 = L(P(getComputedStyle(e).color)), r2 = L(bg || [255, 255, 255]);
    out.push({ r: (Math.max(r1, r2) + 0.05) / (Math.min(r1, r2) + 0.05), t: t.slice(0, 40) });
  });
  out.sort((a, b) => a.r - b.r);
  return out.slice(0, 3);
};

for (const scheme of ["light", "dark"]) for (const w of [375, 1280]) for (const lang of ["pl", "en"]) {
  const tag = `${scheme} ${w} ${lang}`;
  const p = await fresh({ lang, w, h: w > 900 ? 860 : 812, ctx: { colorScheme: scheme } });
  await p.goto(BASE + "index.html");
  await p.waitForSelector("#lgKierunek .lk-card");
  ok(`${tag}: bez poziomego przewijania`, await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  if (w < 900) ok(`${tag}: przewija się dokument, nie wewnętrzny kontener`, await p.evaluate(() => getComputedStyle(document.getElementById("login")).overflowY !== "auto" && document.scrollingElement.scrollHeight > innerHeight));
  const male = await p.evaluate(() => [...document.querySelectorAll("#login .lg-lang, #login .lg-demo summary, #login .lg-foot a, #login .lk-card")].filter((e) => e.getClientRects().length).map((e) => {
    const r = e.getBoundingClientRect(), a = getComputedStyle(e, "::after"); let hgt = r.height;
    if (a.content !== "none" && a.position === "absolute") hgt += -parseFloat(a.top) - parseFloat(a.bottom);
    return { t: e.textContent.trim().slice(0, 25), h: Math.round(hgt) };
  }).filter((x) => x.h < 44));
  ok(`${tag}: cele dotyku ≥ 44 px`, male.length === 0, male);
  const tagi = await p.evaluate(() => [...document.querySelectorAll("#lgKierunek .lk-card")].map((c) => { const a = c.querySelector(".lk-tag").getBoundingClientRect(), t = c.querySelector(".lk-txt").getBoundingClientRect(); return { zachodzi: a.left < t.right - 1 && a.right > t.left + 1 && a.top < t.bottom - 1 && a.bottom > t.top + 1, wEkranie: a.right <= innerWidth }; }));
  ok(`${tag}: plakietka nie zasłania nazwy kierunku`, tagi.every((x) => !x.zachodzi && x.wEkranie), tagi);
  const k1 = await p.evaluate(kontrast("#login .lg-form-in"), "#login .lg-form-in");
  ok(`${tag}: kontrast ekranu wejścia ≥ 4.5`, k1[0].r >= 4.5, k1);
  await shot(p, `wyglad-1-${scheme}-${w}-${lang}`);
  // Przykładowa lekcja
  await p.click("#login .lg-demo-btn");
  await p.waitForSelector("#login .lg-pokaz .simple");
  const k2 = await p.evaluate(kontrast("#login .lg-pokaz"), "#login .lg-pokaz");
  ok(`${tag}: kontrast przykładowej lekcji ≥ 4.5`, k2[0].r >= 4.5, k2);
  await shot(p, `wyglad-pokaz-${scheme}-${w}-${lang}`);
  await p.click("#login .lg-pokaz-top button");
  ok(`${tag}: „Zamknij” zamyka lekcję`, (await p.locator("#login .lg-pokaz").count()) === 0);
  // Krok 3 z 3
  await p.click('#lgKierunek [data-k="wefiz-bm-1-st-2026"]');
  await p.click('#lgKierunek [data-a="dalej"]');
  const k3 = await p.locator("#lgKrok .lk-krok");
  ok(`${tag}: po „Dalej” widać „Krok 3 z 3” i pasek`, (await k3.isVisible()) && (await k3.innerText()).toLowerCase() === (lang === "en" ? "step 3 of 3" : "krok 3 z 3") && (await p.locator("#lgKrok .lk-bar i.on").count()) === 3, await k3.innerText().catch(() => ""));
  await shot(p, `wyglad-3-${scheme}-${w}-${lang}`);
  await p.click("#lgWybrany button");
  ok(`${tag}: „Zmień” chowa „Krok 3 z 3”`, await p.locator("#lgKrok").isHidden());
  // Powracający gość: bez paska kroku
  await p.click('#lgKierunek [data-k="wefiz-bm-1-st-2026"]'); await p.click('#lgKierunek [data-a="dalej"]');
  await p.reload(); await p.waitForSelector("#loginBox .btn, #loginBox input");
  ok(`${tag}: po przeładowaniu bez „Krok 3 z 3”`, await p.locator("#lgKrok").isHidden());
  ok(`${tag}: konsola bez błędów`, p.errors.length === 0, p.errors);
  await p.context().close();
}
// Polityka prywatności: podpowiedź przy tabeli tylko na wąskim ekranie
for (const [f, w, widac] of [["prywatnosc.html", 375, true], ["prywatnosc.html", 1280, false], ["prywatnosc-en.html", 375, true]]) {
  const p = await page(b, { konto: "brak", w, h: 812 });
  await p.goto(BASE + f);
  ok(`${f} ${w}: podpowiedź przy tabeli ${widac ? "widać" : "ukryta"}`, (await p.locator(".tbl-hint").isVisible()) === widac);
  ok(`${f} ${w}: strona bez poziomego przewijania`, await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await shot(p, `wyglad-prywatnosc-${f}-${w}`);
  await p.context().close();
}
await b.close();
console.log(bad ? `${bad} błędów` : "wszystko OK");
process.exit(bad ? 1 : 0);
