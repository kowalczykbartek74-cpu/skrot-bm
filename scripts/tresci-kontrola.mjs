#!/usr/bin/env node
// Kontrola jakości treści przed wgraniem paczki lekcji (etap 12 „Systemy z Zdawalni w Skrócie”).
//
//   node scripts/tresci-kontrola.mjs <paczka.json | katalog> [więcej…] [opcje]
//   node scripts/tresci-kontrola.mjs --strona            # tylko stałe pliki strony (płeć, zakazane frazy, kontrast)
//
// Paczka: eksport z docs/lekcje-v4/eksport.js (lekcje-eksport.json), katalog z <id>.json (scratch/lessons-v4/…),
// tablica dokumentów albo jeden dokument { id, subjectId, title, content: { lesson, … } }.
//
// Łączy: walidator v4 (python3 scripts/lekcje-walidator.py, także --zgodnosc dla szablonów gen) + kontrole z tresci.js:
//   BŁĘDY (kod wyjścia 1): walidator v4, niezgodność parserów gen, zakazane sformułowania (tresci-zakazane.json),
//     rachunek w tekście, który się nie zgadza (chyba że w przeglądzie „celowo”: true), pytanie z calc ≠ poprawna opcja;
//   PRZEGLĄD (nie blokuje, chyba że --przed-wgraniem): liczby, daty, kwoty, numery artykułów → plik przeglądu
//     z polami „zrodlo” i „przejrzane” (zostają między uruchomieniami);
//   OSTRZEŻENIA: formy zależne od płci, uwagi walidatora.
//
// Opcje:
//   --przeglad <plik>   plik przeglądu (domyślnie scratch/tresci-przeglad.json)
//   --raport <plik>     raport Markdown (domyślnie scratch/tresci-raport.md)
//   --przed-wgraniem    blokuj też, gdy jakaś wartość nie ma „przejrzane”: true
//   --bez-pythona       pomiń walidator v4 (tylko do testów; przed wgraniem zawsze z Pythonem)
//   --cicho             bez listy uwag na ekranie (sam wynik)
// Kody wyjścia: 0 = można wgrać, 1 = zatrzymane, 2 = zły argument / brak lekcji / brak python3.
// Skrypt tylko czyta paczkę i pisze pliki w scratch/ (poza repo). Niczego nie wysyła do bazy.

import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const T = require("./tresci.js");
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(HERE);

const argv = process.argv.slice(2);
const opt = (name, def) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : def; };
const flag = (name) => argv.includes(name);
const VALUED = new Set(["--przeglad", "--raport", "--zakazane"]);
const inputs = argv.filter((a, i) => !a.startsWith("--") && !VALUED.has(argv[i - 1]));
const quiet = flag("--cicho");
const log = (...a) => console.log(...a);
const rel = (p, base = process.cwd()) => { const r = path.relative(base, p); return !r || r.startsWith("..") ? p : r; };
const forbidden = T.loadForbidden(opt("--zakazane"));

// ---------- tryb --strona: stałe pliki ----------
if (flag("--strona")) {
  const L = ["# Kontrola tekstów strony (etap 12)", "", `Pliki: ${T.siteFiles(ROOT).join(", ")}`, ""];
  let bad = 0, warn = 0;
  const g = [];
  for (const f of T.siteFiles(ROOT)) {
    const src = T.stripCodeComments(fs.readFileSync(path.join(ROOT, f), "utf8"));
    for (const h of T.withLines(src, T.forbiddenHits(src, forbidden, "strona"))) { bad++; L.push(`- **BŁĄD** ${f}:${h.linia} zakazane „${h.tekst}” (${h.fraza}) · …${h.kontekst}…`); }
    for (const h of T.withLines(src, T.genderHits(src))) { warn++; g.push(`- ${f}:${h.linia} „${h.tekst}”`); }
  }
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const kontrast = T.themeContrast(T.cssThemes(html)).filter((r) => !r.ok);
  L.push("", `## Zakazane sformułowania: ${bad}`, "", `## Kontrast poniżej WCAG AA (motywy w index.html): ${kontrast.length}`, "");
  for (const r of kontrast) L.push(`- ${r.motyw}: ${r.para} ${r.fg} / ${r.bg} = ${r.kontrast}:1 (min. ${r.min})`);
  L.push("", `## Formy zależne od płci (ostrzeżenie, do przepisania przy okazji): ${warn}`, "", ...g);
  const out = opt("--raport", path.join(ROOT, "scratch", "tresci-strona.md"));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, L.join("\n") + "\n");
  log(`Strona: zakazane ${bad} · kontrast poniżej AA ${kontrast.length} · formy zależne od płci ${warn} (ostrzeżenie)`);
  log(`Raport: ${rel(out)}`);
  process.exit(bad ? 1 : 0);
}

if (!inputs.length) {
  console.error("Podaj paczkę: node scripts/tresci-kontrola.mjs lekcje-eksport.json (albo katalog z <id>.json). --strona sprawdza pliki strony.");
  process.exit(2);
}

// ---------- wczytanie paczki ----------
const items = [];
for (const inp of inputs) {
  const p = path.resolve(inp);
  if (!fs.existsSync(p)) { console.error(`Nie ma pliku ani katalogu: ${inp}`); process.exit(2); }
  const files = fs.statSync(p).isDirectory() ? fs.readdirSync(p).filter((f) => f.endsWith(".json")).sort().map((f) => path.join(p, f)) : [p];
  for (const f of files) {
    let json;
    try { json = JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { console.error(`Zły JSON: ${f} (${e.message})`); process.exit(2); }
    const got = T.docsFrom(json, path.relative(process.cwd(), f));
    if (!got.length) log(`uwaga: ${path.relative(process.cwd(), f)} nie zawiera lekcji (pomijam)`);
    items.push(...got);
  }
}
if (!items.length) { console.error("W paczce nie ma żadnej lekcji (content.lesson)."); process.exit(2); }

const lessons = new Map(); // id → { doc, zrodlo, bledy, ostrzezenia }
const dupl = [];
for (const { doc, zrodlo } of items) {
  const id = String(doc.id || "");
  if (!id) { dupl.push(`${zrodlo}: lekcja bez id`); continue; }
  if (lessons.has(id)) { dupl.push(`${id}: dwa razy w paczce (${lessons.get(id).zrodlo}, ${zrodlo})`); continue; }
  lessons.set(id, { doc, zrodlo, bledy: [], ostrzezenia: [] });
}

// ---------- walidator v4 (Python) ----------
const ogolne = [...dupl]; // błędy paczki poza lekcjami
const py = { uruchomiony: false, bledy: 0, ostrzezenia: 0, zgodnosc: "", wynik: "" };
if (!flag("--bez-pythona")) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tresci-"));
  const paths = [];
  let k = 0;
  for (const [id, L] of lessons) {
    const f = path.join(tmp, `${String(++k).padStart(4, "0")}-${id.replace(/[^\w.-]+/g, "_").slice(0, 80)}.json`);
    fs.writeFileSync(f, JSON.stringify(L.doc));
    paths.push(f);
  }
  const run = (extra) => spawnSync("python3", [path.join(HERE, "lekcje-walidator.py"), ...extra, ...paths], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const r = run([]);
  if (r.error) { console.error("Brak python3 (potrzebny do walidatora v4). Zainstaluj Pythona 3 albo uruchom z --bez-pythona tylko do testów."); process.exit(2); }
  if (r.status > 1) { console.error("Walidator v4 się wysypał:\n" + (r.stderr || "").slice(-1500)); process.exit(2); }
  py.uruchomiony = true;
  let cur = null;
  for (const line of (r.stdout || "").split("\n")) {
    const head = /^(\S.*?) · /.exec(line);
    if (head && lessons.has(head[1])) { cur = lessons.get(head[1]); continue; }
    const e = /^\s+BŁĄD\s+(.*)$/.exec(line), w = /^\s+uwaga\s+(.*)$/.exec(line);
    if (cur && e) { cur.bledy.push(`walidator v4: ${e[1]}`); py.bledy++; }
    if (cur && w) { cur.ostrzezenia.push(`walidator v4: ${w[1]}`); py.ostrzezenia++; }
  }
  py.wynik = (r.stdout || "").trim().split("\n").pop();
  if (r.status === 1 && !py.bledy) { ogolne.push("walidator v4: kod 1 bez rozpoznanych błędów: " + py.wynik); py.bledy = 1; }
  const z = run(["--zgodnosc"]);
  py.zgodnosc = (z.stdout || "").trim().split("\n").pop() || "";
  py.zgodnoscBledy = z.status === 0 ? [] : (z.stdout || "").split("\n").filter((l) => l.startsWith("NIEZGODNOŚĆ"));
  if (z.status !== 0 && !py.zgodnoscBledy.length) py.zgodnoscBledy = [(z.stderr || z.stdout || "zgodność: błąd").trim().slice(-500)];
  ogolne.push(...py.zgodnoscBledy);
  fs.rmSync(tmp, { recursive: true, force: true });
}

// ---------- kontrole JS + przegląd ----------
const reviewFile = path.resolve(opt("--przeglad", path.join(ROOT, "scratch", "tresci-przeglad.json")));
let old = { wartosci: [], rachunki: [] };
try { old = JSON.parse(fs.readFileSync(reviewFile, "utf8")); } catch { /* pierwszy raz */ }
const oldV = new Map((old.wartosci || []).map((w) => [w.klucz, w]));
const oldR = new Map((old.rachunki || []).map((w) => [w.klucz, w]));

const wartosci = [], rachunkiZle = [];
let nRach = 0;
for (const [id, L] of lessons) {
  const r = T.checkLesson(L.doc, forbidden);
  L.bledy.push(...r.bledy);
  L.ostrzezenia.push(...r.ostrzezenia);
  nRach += r.rachunki.length;
  for (const x of r.rachunki.filter((x) => !x.ok)) {
    const prev = oldR.get(x.klucz) || {};
    const row = { klucz: x.klucz, lekcja: id, pole: x.pole, tekst: x.tekst, wychodzi: x.policzone, celowo: prev.celowo === true, uwagi: prev.uwagi || "" };
    rachunkiZle.push(row);
    if (!row.celowo) L.bledy.push(`${x.pole}: rachunek się nie zgadza „${x.tekst}” (wychodzi ${x.policzone})`);
  }
  for (const w of r.wartosci) {
    const prev = oldV.get(w.klucz) || {};
    wartosci.push({ ...w, zrodlo: prev.zrodlo || "", przejrzane: prev.przejrzane === true, uwagi: prev.uwagi || "" });
  }
}

fs.mkdirSync(path.dirname(reviewFile), { recursive: true });
fs.writeFileSync(reviewFile, JSON.stringify({
  opis: "Przegląd liczb, dat, kwot i numerów artykułów z lekcji (etap 12). Dla każdej pozycji wpisz źródło (sylabus, ustawa z datą, wykład, podręcznik) i zmień przejrzane na true. Rachunki: celowo = true tylko dla świadomie błędnego przykładu. Plik zostaje między uruchomieniami (po kluczu). Nie wrzucaj go do repo (treści są płatne).",
  at: new Date().toISOString(),
  paczka: inputs,
  wartosci,
  rachunki: rachunkiZle,
}, null, 1) + "\n");

// ---------- wynik ----------
const all = [...lessons.values()];
const nErr = all.reduce((s, L) => s + L.bledy.length, 0) + ogolne.length;
const nWarn = all.reduce((s, L) => s + L.ostrzezenia.length, 0);
const unreviewed = wartosci.filter((w) => !w.przejrzane).length;
const before = flag("--przed-wgraniem");
const stop = nErr > 0 || (before && unreviewed > 0);

const md = ["# Kontrola treści (etap 12)", "", `Paczka: ${inputs.join(", ")} · ${new Date().toISOString().slice(0, 16).replace("T", " ")}`, "",
  `- Lekcji: **${lessons.size}**`,
  `- Błędy (blokują): **${nErr}**${py.uruchomiony ? ` (walidator v4: ${py.bledy})` : " (walidator v4 pominięty)"}`,
  `- Zgodność szablonów gen (Python = parser strony): ${py.uruchomiony ? py.zgodnosc : "pominięta"}`,
  `- Rachunki w tekstach: ${nRach} sprawdzonych, ${rachunkiZle.length} się nie zgadza${rachunkiZle.some((r) => r.celowo) ? ` (celowo: ${rachunkiZle.filter((r) => r.celowo).length})` : ""}`,
  `- Wartości do przejrzenia ze źródłem: ${wartosci.length} (nieprzejrzane: ${unreviewed}) → \`${rel(reviewFile, ROOT)}\``,
  `- Ostrzeżenia: ${nWarn}`,
  `- Wynik: **${stop ? "ZATRZYMANE" : "można wgrać"}**${before ? " (tryb przed wgraniem)" : ""}`, ""];
if (ogolne.length) md.push("## Błędy paczki", "", ...ogolne.map((l) => `- **BŁĄD** ${l}`), "");
md.push("## Lekcje", "");
for (const [id, L] of lessons) {
  const vs = wartosci.filter((w) => w.lekcja === id);
  if (!L.bledy.length && !L.ostrzezenia.length && !vs.length) continue;
  md.push(`### ${id} · ${L.doc.title || ""}`, "");
  for (const e of L.bledy) md.push(`- **BŁĄD** ${e}`);
  for (const w of L.ostrzezenia) md.push(`- uwaga ${w}`);
  if (vs.length) md.push(`- do przejrzenia (${vs.filter((w) => !w.przejrzane).length}/${vs.length}): ` + vs.map((w) => `${w.typ} „${w.tekst}”${w.przejrzane ? " ✓" : ""}`).join(" · "));
  md.push("");
}
const reportFile = path.resolve(opt("--raport", path.join(ROOT, "scratch", "tresci-raport.md")));
fs.mkdirSync(path.dirname(reportFile), { recursive: true });
fs.writeFileSync(reportFile, md.join("\n") + "\n");

if (!quiet) {
  for (const [id, L] of lessons) {
    if (!L.bledy.length) continue;
    log(`\n${id} · ${L.doc.title || ""}`);
    for (const e of L.bledy.slice(0, 12)) log("  BŁĄD  " + e);
    if (L.bledy.length > 12) log(`  … i ${L.bledy.length - 12} więcej (raport)`);
  }
  for (const l of ogolne) log("BŁĄD  " + l);
}
log("");
log(md.slice(4, 11).join("\n"));
log(`Raport: ${rel(reportFile)} · przegląd: ${rel(reviewFile)}`);
process.exit(stop ? 1 : 0);
