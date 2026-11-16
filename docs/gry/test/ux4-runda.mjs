// Pętla UX-4: pomiary i zrzuty rundy (A5 b) do docs/audyt-ux/petla-4/etap-<ETAP>/runda-<RUNDA>/.
// ETAP=W1 RUNDA=1 EKRANY="/,materials,terms" TEST=docs/gry/test/ux4-etapW1.mjs BASE=http://127.0.0.1:8814/ node docs/gry/test/ux4-runda.mjs
// Zrzuty: 360×640, 390×844, 1280×900 × jasny/ciemny + EN (390, jasny). Raport: axe (kontrast, cele), własny kontrast każdego tekstu,
// cele < 44 px w <main>, poziome przewijanie, błędy konsoli, ruch (nazwy animacji i czy znikają przy reduced-motion / html.calm),
// czcionki i teksty < 12 px, emoji w interfejsie, wynik testu etapu i część automatyczna (kontrola.mjs).
import fs from "fs";
import { execSync } from "child_process";
import { chromium, open, goto, typo, emoji, poziomo, axe, kontrast, EKRANY, ROZMIARY } from "./ux4-lib.mjs";
const ETAP = process.env.ETAP || "W1", RUNDA = process.env.RUNDA || "1";
const ROOT = new URL("../../../", import.meta.url).pathname;
const DIR = `${ROOT}docs/audyt-ux/petla-4/etap-${ETAP}/runda-${RUNDA}/`;
fs.mkdirSync(DIR, { recursive: true });
const LISTA = process.env.EKRANY ? process.env.EKRANY.split(",").map((h) => [h, (EKRANY.find((e) => e[0] === h)?.[1]) || h.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "") || "dzis"]) : EKRANY;
const KONTO = process.env.KONTO || "starosta";
const b = await chromium.launch();
const R = { etap: ETAP, runda: +RUNDA, ekrany: [], ruch: [], test: null };
const cele = (p) => p.evaluate(() => [...document.querySelectorAll("#main :is(button, a[href], input, select, summary, label, [role=tab])")].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.height && getComputedStyle(e).visibility !== "hidden" && !e.closest("[hidden], details:not([open]) > :not(summary), .md, .site-foot p") && (Math.round(r.width) < 44 || Math.round(r.height) < 44) && !(e.tagName === "INPUT" && e.closest("label")); }).map((e) => {
  // faktyczne pole: rozszerzenie przez ::after liczymy z jego prostokąta (elementFromPoint wokół środka)
  const r = e.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2; const inn = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === e || e.contains(t)); };
  const span = (dx, dy) => { let d = 0; for (let i = 1; i < 40; i++) { if (inn(cx + dx * i, cy + dy * i)) d = i; else break; } return d; };
  const vis = cy > 0 && cy < innerHeight && inn(cx, cy);
  return { cel: e.tagName + (typeof e.className === "string" && e.className ? "." + e.className.split(" ").join(".") : ""), tekst: (e.innerText || e.getAttribute("aria-label") || "").trim().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height), pole: vis ? `${span(-1, 0) + span(1, 0) + 1}×${span(0, -1) + span(0, 1) + 1}` : "poza ekranem" };
}));
for (const [hash, n] of LISTA) for (const [w, hh] of ROZMIARY) for (const dark of [false, true]) {
  const p = await open(b, { konto: KONTO, w, h: hh, ls: { "skrot-green": dark ? "dark" : "light" }, wait: 1500 });
  await goto(p, hash, 2400);
  const nm = `${n}-${w}-${dark ? "ciemny" : "jasny"}`;
  await p.screenshot({ path: `${DIR}${nm}.png` });
  if (w !== 1280) { await p.evaluate(() => document.querySelectorAll("body *").forEach((e) => { const c = getComputedStyle(e); if (c.position === "fixed" || c.position === "sticky") e.dataset.dzHid = e.style.visibility = "hidden"; })); await p.screenshot({ path: `${DIR}${nm}-cala.png`, fullPage: true }); await p.evaluate(() => document.querySelectorAll("[data-dz-hid]").forEach((e) => { e.style.visibility = ""; delete e.dataset.dzHid; })); }
  const t = await typo(p), K = await kontrast(p), A = await axe(p);
  R.ekrany.push({ n: nm, kroje: [...new Set(t.heads.map((x) => x.fam))], naglowki: t.heads.map((x) => `${x.tag} ${x.px}px/${x.w} „${x.t}”`), male: t.small, emoji: await emoji(p), tekstow: K.n, kontrast: K.out, axe: A, cele44: await cele(p), poziomo: await poziomo(p), bledy: p.errors });
  console.log(nm, `teksty ${K.n} <AA ${K.out.length}`, A.map((v) => `${v.id}:${v.n}`).join(" "), "bledy", p.errors.length);
  await p.close();
}
for (const [hash, n] of LISTA) {
  const p = await open(b, { konto: KONTO, w: 390, h: 844, lang: "en", ls: { "skrot-green": "light" }, wait: 1500 });
  await goto(p, hash, 2400);
  await p.screenshot({ path: `${DIR}${n}-390-en.png` });
  const pl = await p.evaluate(() => { const out = [], w = document.createTreeWalker(document.querySelector("#main"), NodeFilter.SHOW_TEXT); for (let t; (t = w.nextNode());) { const s = t.textContent.trim(); if (!s || t.parentElement.closest('[translate="no"],[lang="pl"],script,style,.md')) continue; if (/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(s)) out.push(s.slice(0, 60)); } return [...new Set(out)].slice(0, 20); });
  R.ekrany.push({ n: `${n}-390-en`, pl, poziomo: await poziomo(p), bledy: p.errors, axe: await axe(p) });
  await p.close();
}
for (const [nazwa, o] of [["zwykle", {}], ["reduced-motion", { motion: "reduce" }], ["html.calm", { ls: { "skrot-calm": "1" } }]]) {
  const p = await open(b, { konto: KONTO, w: 390, h: 844, wait: 1500, ...o });
  await goto(p, LISTA[0][0], 300);
  if (nazwa === "html.calm") await p.evaluate(() => document.documentElement.classList.add("calm"));
  R.ruch.push({ nazwa, anim: await p.evaluate(() => [...new Set([...document.querySelectorAll("body *")].map((e) => getComputedStyle(e)).filter((c) => c.animationName !== "none" && parseFloat(c.animationDuration) > 0).map((c) => c.animationName))].slice(0, 20)), trans: await p.evaluate(() => [...new Set([...document.querySelectorAll("#main *, .toast")].map((e) => getComputedStyle(e)).filter((c) => parseFloat(c.transitionDuration) > 0.01).map((c) => c.transitionProperty.split(",")[0]))].slice(0, 12)) });
  await p.close();
}
await b.close();
if (process.env.TEST) { try { R.test = execSync(`node ${process.env.TEST}`, { cwd: ROOT, encoding: "utf8", env: process.env, maxBuffer: 1 << 26 }); } catch (e) { R.test = (e.stdout || "") + "\n" + (e.stderr || ""); } }
const kontrola = execSync("node docs/audyt-ux/petla-4/kontrola.mjs", { cwd: ROOT, encoding: "utf8" });
fs.writeFileSync(DIR + "raport.json", JSON.stringify(R, null, 1));
const zw = R.ekrany.filter((x) => !x.n.endsWith("-en"));
const testy = R.test ? R.test.match(/^(\d+)\/(\d+)$/m) : null;
const md = [`# UX-4 · etap ${ETAP} · runda ${RUNDA}`, "", `Ekrany: ${LISTA.map((x) => x[1]).join(", ")} · konto ${KONTO} · zegar 6.11.2026 17:00 · sieć zewnętrzna zablokowana (czcionki tylko z repo).`, "",
  `Test etapu: ${testy ? `${testy[1]}/${testy[2]} ✓, ${testy[2] - testy[1]} ✗` : "—"}`, "",
  "| zrzut | kroje nagłówków | teksty < 12 px | sprawdzone teksty | < AA (własny) | axe | cele < 44 px (widoczne) | emoji w UI | poziomo | błędy konsoli |", "|---|---|---|---|---|---|---|---|---|---|",
  ...zw.map((x) => `| ${x.n} | ${x.kroje.join(", ") || "—"} | ${x.male.length} | ${x.tekstow} | ${x.kontrast.length} | ${x.axe.map((v) => `${v.id}: ${v.n}`).join(", ") || "0"} | ${x.cele44.length} | ${x.emoji.map((e) => e.e).join("") || "0"} | ${x.poziomo ? "TAK" : "nie"} | ${x.bledy.length} |`),
  "", "## Nagłówki (390 jasny)", ...zw.filter((x) => x.n.includes("-390-jasny")).map((x) => `- **${x.n}**: ${x.naglowki.join(" · ")}`),
  "", "## Teksty poniżej AA (własny pomiar)", ...zw.filter((x) => x.kontrast.length).flatMap((x) => [`### ${x.n}`, ...x.kontrast.map((k) => `- \`${k.cel}\` „${k.tekst}” ${k.kontrast}:1 < ${k.wymagany}:1`)]),
  "", "## Cele dotyku < 44 px (wymiar elementu → faktyczne pole trafienia z sondy elementFromPoint)", ...zw.filter((x) => x.cele44.length).flatMap((x) => [`### ${x.n}`, ...x.cele44.map((c) => `- \`${c.cel}\` „${c.tekst}” ${c.w}×${c.h} → pole ${c.pole}`)]),
  "", "## Emoji w interfejsie", ...zw.filter((x) => x.emoji.length).map((x) => `- ${x.n}: ${x.emoji.map((e) => `${e.e} (${e.cel} „${e.t}”)`).join("; ")}`),
  "", "## EN (390 jasny)", ...R.ekrany.filter((x) => x.n.endsWith("-en")).map((x) => `- ${x.n}: polskie znaki ${JSON.stringify(x.pl)}; axe ${x.axe.map((v) => `${v.id}: ${v.n}`).join(", ") || "0"}; poziomo ${x.poziomo ? "TAK" : "nie"}; błędy ${x.bledy.length}`),
  "", "## Ruch (pierwszy ekran listy, 390)", ...R.ruch.map((x) => `- ${x.nazwa}: animacje [${x.anim.join(", ") || "brak"}]; przejścia [${x.trans.join(", ") || "brak"}]`),
  "", "## Szczegóły axe", ...R.ekrany.filter((x) => x.axe?.length).flatMap((x) => [`### ${x.n}`, ...x.axe.flatMap((v) => v.nodes.map((d) => `- ${v.id} · \`${d.cel}\` · ${d.info}`))]),
  "", "## Log testu etapu", "```", (R.test || "—").trim(), "```", "", kontrola].join("\n");
fs.writeFileSync(DIR + "raport.md", md + "\n");
console.log("zapisano", DIR);
