// Kontrast (WCAG AA, tekst ≥ 4,5:1) kolorów nicku, tytułów i litery awatara: w rankingu (zwykły wiersz i mój wiersz),
// w każdym motywie strony, w jasnym i ciemnym trybie. Tło liczone z rzeczywistych kolorów elementów (z przezroczystością).
// node docs/kosmetyki/test/kontrast.mjs   (BASE=http://127.0.0.1:PORT/)
import { chromium, page, BASE } from "../../gry/test/lib.mjs";
const UID = "00000000-0000-4000-8000-000000000001";
const MOTYWY = [["jasny", { "skrot-green": "light" }], ["ciemny", { "skrot-green": "dark" }], ["pink", { "skrot-theme": "pink" }], ["bow", { "skrot-theme": "bow" }],
  ["lilia", { "skrot-theme": "lilia" }], ["meadow", { "skrot-theme": "meadow" }], ["sea", { "skrot-theme": "sea" }], ["noc", { "skrot-theme": "noc" }]];
const KOLORY = ["las", "morze", "oliwka", "glebia", "bursztyn", "wrzos"];
let ok = 0, bad = 0, min = 99;
const b = await chromium.launch();
for (const [name, extra] of MOTYWY) {
  const p = await page(b, { w: 1100, h: 900, ls: { "mock-v24": "1", "mock-nick": "Bartek", "mock-vis": "1", "mock-progress": JSON.stringify({ [UID]: { xp: { t: 4600 } } }),
    "mock-mon": JSON.stringify({ start: 0, ksiega: [], pos: ["tytul:nocny-marek"], zal: { tytul: "tytul:nocny-marek" } }), ...extra } });
  await p.goto(BASE + "index.html#/ranking"); await p.waitForSelector(".rk-row.me .nk"); await p.waitForTimeout(700);
  const theme = await p.evaluate(() => (document.documentElement.getAttribute("data-theme") || "") + "/" + document.documentElement.getAttribute("data-green"));
  const res = await p.evaluate((KOLORY) => {
    const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return [0, 0, 0, 0]; const v = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [v[0], v[1], v[2], v[3] ?? 1]; };
    const over = (top, bot) => { const a = top[3]; return [top[0] * a + bot[0] * (1 - a), top[1] * a + bot[1] * (1 - a), top[2] * a + bot[2] * (1 - a), 1]; };
    const bgOf = (el) => { const st = []; for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c[3] > 0) { st.push(c); if (c[3] >= 1) break; } }
      let acc = [255, 255, 255, 1]; for (let i = st.length - 1; i >= 0; i--) acc = over(st[i], acc); return acc; };
    const lum = ([r, g, b]) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const out = [];
    const rows = [document.querySelector(".rk-row:not(.me)"), document.querySelector(".rk-row.me")];
    for (const row of rows) {
      const nk = row.querySelector(".nk"), base = nk.className;
      for (const k of KOLORY) { nk.className = "nk nk-" + k; out.push([`${row.classList.contains("me") ? "mój wiersz" : "wiersz"} · ${k}`, cr(over(parse(getComputedStyle(nk).color), bgOf(nk)), bgOf(nk))]); }
      nk.className = base;
    }
    // tytuł kupiony i za osiągnięcie (w moim wierszu i w zwykłym)
    const me = document.querySelector(".rk-row.me .ktl");
    out.push(["tytuł kupiony", cr(parse(getComputedStyle(me).color), bgOf(me))]);
    me.classList.add("ktl-a"); out.push(["tytuł za osiągnięcie", cr(parse(getComputedStyle(me).color), bgOf(me))]); me.classList.remove("ktl-a");
    // wygląd fiszek: tekst i nadtytuł na przedniej i tylnej stronie (te same zmienne co w odtwarzaczu)
    for (const f of ["papier", "kreda", "nocny"]) for (const back of [false, true]) {
      const card = document.createElement("div"); card.className = "kpv-card kf-" + f;
      card.innerHTML = `<div class="face${back ? " back" : ""}"><span class="eyebrow">Pojęcie</span><span class="tx">Inflacja</span></div>`;
      document.body.append(card);
      const face = card.querySelector(".face"), bg = bgOf(face);
      out.push([`fiszki ${f}${back ? " (tył)" : ""}: tekst`, cr(parse(getComputedStyle(card.querySelector(".tx")).color), bg)]);
      out.push([`fiszki ${f}${back ? " (tył)" : ""}: nadtytuł`, cr(parse(getComputedStyle(card.querySelector(".eyebrow")).color), bg)]);
      card.remove();
    }
    // litera awatara na jego tle
    for (const av of document.querySelectorAll(".kav")) { const l = av.querySelector(".kav-l"), f = av.querySelector("svg circle").getAttribute("fill"); out.push(["litera awatara " + f, cr(parse(getComputedStyle(l).color), parse(f.replace(/^#/, "")) )]); }
    return out;
  }, KOLORY);
  for (const [what, c] of res) {
    if (!isFinite(c)) continue;
    min = Math.min(min, c);
    if (c >= 4.5) ok++; else { bad++; console.log(`✗ ${name} (${theme}) ${what}: ${c.toFixed(2)}:1`); }
  }
  console.log(`  ${name} (${theme}): najmniej ${Math.min(...res.map((r) => r[1])).toFixed(2)}:1`);
  if (p.errors.length) { bad++; console.log("✗ błędy:", p.errors); }
  await p.context().close();
}
// litera awatara: biała na każdym tle z palety (niezależnie od motywu – kolory są chronione przed przemalowaniem)
const { AV_FILL } = await (async () => { const src = (await import("fs")).readFileSync(new URL("../../../kosmetyki.js", import.meta.url), "utf8"); return { AV_FILL: JSON.parse(src.match(/AV_FILL = (\[[^\]]+\])/)[1].replace(/'/g, '"')) }; })();
const L = (hx) => { const v = [1, 3, 5].map((i) => parseInt(hx.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4))); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
for (const f of AV_FILL) { const c = 1.05 / (L(f) + 0.05); min = Math.min(min, c); if (c >= 4.5) ok++; else { bad++; console.log(`✗ litera awatara na ${f}: ${c.toFixed(2)}:1`); } }
await b.close();
console.log(`${ok}/${ok + bad} par ≥ 4,5:1 · najsłabsza ${min.toFixed(2)}:1`);
process.exit(bad ? 1 : 0);
