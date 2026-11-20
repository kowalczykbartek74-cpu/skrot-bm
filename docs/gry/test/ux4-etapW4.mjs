// Pętla UX-4, etap W4 – ikony SVG zamiast emoji na ekranach pętli. BASE=http://127.0.0.1:8814/ node docs/gry/test/ux4-etapW4.mjs
import fs from "fs";
import { chromium, OUT, open, goto, emoji, poziomo, kontrast, tester } from "./ux4-lib.mjs";
const { ok, end } = tester();
const ROOT = new URL("../../../", import.meta.url).pathname;
const b = await chromium.launch();
const EKRANY = ["more", "ustawienia/wyglad", "ustawienia/przypomnienia", "ustawienia/konto", "ustawienia/pomoc", "guide", "terms", "calendar", "glossary", "materials"];
// ---------- K1: brak emoji jako ikon (zielone motywy, jasny i ciemny, PL i EN, konto płatne i starosta) ----------
for (const [konto, dark, lang, w] of [["platne", false, "pl", 390], ["platne", true, "pl", 360], ["starosta", false, "en", 390], ["platne", false, "pl", 1280]]) {
  const p = await open(b, { konto, w, h: 844, lang, ls: { "skrot-green": dark ? "dark" : "light" } });
  const zle = [];
  for (const h of EKRANY) {
    await goto(p, h, 1300);
    await p.evaluate(() => document.querySelectorAll("#main details").forEach((d) => (d.open = true)));
    const e = await emoji(p, "#main, header.bar, #nav, #layer"); // cały widok: treść, górny pasek, nawigacja i okna
    if (e.length) zle.push(`${h}: ${e.map((x) => `${x.e} ${x.cel} „${x.t}”`).join("; ")}`);
    if (w <= 390 && (await poziomo(p))) zle.push(`${h}: poziome przewijanie`);
  }
  const tag = `${konto} ${w}${dark ? " ciemny" : ""} ${lang}`;
  ok(`K1 ${tag}: bez emoji jako ikon na Więcej, Ustawieniach, Przewodniku, Terminach, Kalendarzu, Słowniczku, Przedmiotach`, zle.length === 0, zle);
  ok(`K1 ${tag}: bez błędów konsoli`, p.errors.length === 0, p.errors);
  await p.close();
}
// ---------- K2: ikony motywów różne dla każdego motywu ----------
for (const [dark, w] of [[false, 390], [true, 1280]]) {
  const p = await open(b, { konto: "platne", w, h: 900, ls: { "skrot-green": dark ? "dark" : "light" } });
  await goto(p, "ustawienia/wyglad", 1500);
  const r = await p.evaluate(() => [...document.querySelectorAll("#main .set-theme")].map((t) => ({ name: t.querySelector("b")?.textContent, svg: t.querySelector(".e svg")?.innerHTML || null })));
  const svgs = r.map((x) => x.svg);
  ok(`K2 ${w}${dark ? " ciemny" : ""}: każdy kafel motywu ma ikonę SVG (${r.length} kafli)`, r.length >= 10 && svgs.every(Boolean), r.filter((x) => !x.svg));
  ok(`K2 ${w}${dark ? " ciemny" : ""}: ikony motywów są różne (np. „Zielony ciemny” ≠ „Nocny rejs”)`, new Set(svgs).size === svgs.length && r.find((x) => x.name === "Zielony ciemny")?.svg !== r.find((x) => x.name === "Nocny rejs")?.svg, r.map((x) => x.name));
  const k = await kontrast(p); ok(`K2 ${w}${dark ? " ciemny" : ""}: kontrast AA w Ustawieniach`, k.out.length === 0, k.out);
  await p.screenshot({ path: `${OUT}/w4-ustawienia-${w}${dark ? "-ciemny" : ""}.png`, fullPage: true });
  await p.close();
}
// ---------- K3: jeden styl ikon, dopisane w ikony-ux.js przez Object.assign(H2_ICO, …), nazwy i rysunki z A4d ----------
const A4D = {
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 21.5V4.5"/>',
  bulb: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.6 2.6L16 9.5"/>',
  cross: '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
  retry: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  skip: '<path d="M5 5l9 7-9 7z"/><path d="M18 5v14"/>',
  warn: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  ticket: '<path d="M3 8a2 2 0 0 0 0 4v4h18v-4a2 2 0 0 0 0-4V4H3z"/><path d="M13 4v16" stroke-dasharray="2 2"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5l5.5 3.5-5.5 3.5z"/>',
  snow: '<path d="M12 2v20M4.9 6.5l14.2 11M19.1 6.5L4.9 17.5"/><path d="M9.5 3.5L12 6l2.5-2.5M9.5 20.5L12 18l2.5 2.5"/>',
  share: '<path d="M12 3v12M7.5 7.5L12 3l4.5 4.5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
};
const src = fs.readFileSync(ROOT + "ikony-ux.js", "utf8");
ok("K3 ikony-ux.js dopisuje ikony przez Object.assign(I = H2_ICO, …)", /Object\.assign\(I, dod\)/.test(src) && /const I = A\(\)\.H2_ICO/.test(src));
for (const [k, v] of Object.entries(A4D)) ok(`K3 wspólna ikona „${k}” dokładnie jak w A4d`, src.includes(`${k}: ${" ".repeat(Math.max(1, 7 - k.length))}'${v}'`) || src.includes(`${k}:${" ".repeat(Math.max(1, 8 - k.length))}'${v}'`) || src.includes(`'${v}'`), k);
const wlasne = [...src.matchAll(/"(ux4-[a-z-]+)":/g)].map((m) => m[1]);
ok(`K3 własne ikony z prefiksem ux4- (${wlasne.length})`, wlasne.length >= 10 && wlasne.every((n) => /^ux4-/.test(n)));
{
  const p = await open(b, { konto: "platne", w: 390, h: 844 });
  const styl = [];
  for (const h of ["more", "ustawienia/wyglad", "ustawienia/przypomnienia", "glossary"]) {
    await goto(p, h, 1300);
    styl.push(...(await p.evaluate(() => [...document.querySelectorAll("#main .ux4-ico svg")].map((s) => ({ vb: s.getAttribute("viewBox"), st: s.getAttribute("stroke"), sw: +s.getAttribute("stroke-width"), fill: s.getAttribute("fill"), cap: s.getAttribute("stroke-linecap") })))));
  }
  ok(`K3 ikony na ekranach w jednym stylu: viewBox 24, currentColor, kreska 2–2,2, bez wypełnienia (${styl.length} ikon)`, styl.length >= 8 && styl.every((x) => x.vb === "0 0 24 24" && x.st === "currentColor" && x.sw >= 2 && x.sw <= 2.2 && x.fill === "none" && x.cap === "round"), styl.filter((x) => !(x.vb === "0 0 24 24" && x.st === "currentColor")));
  const h2 = await p.evaluate(() => { const I = window.ZD_APP.H2_ICO; return { bolt: I.bolt, lock: I.lock, ux4: Object.keys(I).filter((k) => k.startsWith("ux4-")).length, coin: !!I.coin, flame: !!I.flame }; });
  ok("K3 H2_ICO ma wspólne i własne ikony; coin i flame bez zmian", /M13 2L4 14h7l-1 8 9-12h-7z/.test(h2.bolt || "") && /rect x="5" y="11"/.test(h2.lock || "") && h2.ux4 >= 10 && h2.coin && h2.flame, h2);
  await goto(p, "more", 1300);
  await p.screenshot({ path: `${OUT}/w4-wiecej.png`, fullPage: true });
  const k = await kontrast(p); ok("K3 Więcej: kontrast AA", k.out.length === 0, k.out);
  await p.close();
}
// emoji w dodanym kodzie (poza komentarzami i zachowaniem zastępczym bez ikony-ux.js) – część automatyczna (kontrola.mjs) też to liczy
const dodane = fs.readFileSync(ROOT + "ikony-ux.js", "utf8").split("\n").filter((l) => /\p{Emoji_Presentation}/u.test(l) && !/^\s*\/\//.test(l) && !/h2Ico\("(coin|flame)", "(🪙|🔥)"\)/.test(l) && !/^\s*(const MAP = \{)?\s*("[^"]+": "[\w-]+",?\s*)+(\};?)?\s*$/.test(l) && !/^\s*const \w+ = \/\[[^\]]*\]\/u;/.test(l)); // wiersze MAP i wyrażenia do rozpoznawania emoji = słownik zamiany emoji na ikony SVG, nie użycie emoji
ok("ikony-ux.js: bez emoji (poza zastępczymi dla h2Ico w motywach ze sklepu)", dodane.length === 0, dodane);
await b.close();
end();
