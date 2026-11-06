// Pilot etapu 14: porównanie sylabusa z kolejki importów (AI + Twoje zatwierdzenie) z obecnym sylabus.json (scripts/sylabus-parse.py).
// Użycie: node scripts/importy-porownaj.mjs ~/Downloads/sylabus.json [sylabus.json]
// Wypisuje: ile przedmiotów zgodnych, które się różnią i w których polach (z pierwszą różnicą), których brakuje po każdej stronie.
import fs from "node:fs";
import { createRequire } from "node:module";
const I = createRequire(import.meta.url)("../importy.js");
const [a, b = new URL("../sylabus.json", import.meta.url).pathname] = process.argv.slice(2);
if (!a) { console.log("Użycie: node scripts/importy-porownaj.mjs POBRANY-sylabus.json [sylabus.json]"); process.exit(2); }
const A = JSON.parse(fs.readFileSync(a, "utf8")), B = JSON.parse(fs.readFileSync(b, "utf8"));
const r = I.porownajSylabusy(A, B);
const mapa = (s) => Object.fromEntries(s.courses.map((c) => [c.id, c]));
const MA = mapa(A), MB = mapa(B);
console.log(`Import: ${A.courses.length} przedmiotów, obecny: ${B.courses.length}. Zgodne: ${r.zgodne}, różne: ${r.rozne.length}, kolejność ${r.kolejnosc ? "ta sama" : "inna"}.`);
if (r.tylkoA.length) console.log("Tylko w imporcie:", r.tylkoA.join(", "));
if (r.tylkoB.length) console.log("Tylko w obecnym:", r.tylkoB.join(", "));
const pola = {};
for (const x of r.rozne) {
  for (const p of x.pola) {
    pola[p] = (pola[p] || 0) + 1;
    const va = JSON.stringify(MA[x.id][p]), vb = JSON.stringify(MB[x.id][p]);
    let i = 0; while (i < va.length && va[i] === vb[i]) i++;
    console.log(`- ${x.id}.${p}: import …${va.slice(Math.max(0, i - 30), i + 60)}… | obecny …${vb.slice(Math.max(0, i - 30), i + 60)}…`);
  }
}
if (Object.keys(pola).length) console.log("Pola z różnicami (ile przedmiotów):", Object.entries(pola).sort((x, y) => y[1] - x[1]).map(([k, n]) => `${k} ${n}`).join(", "));
process.exit(r.rozne.length || r.tylkoA.length || r.tylkoB.length ? 1 : 0);
