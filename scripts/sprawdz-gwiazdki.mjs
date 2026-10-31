#!/usr/bin/env node
// Kontrola treści: przechodzi po wszystkich materiałach (kolekcja materialContent w nauka_docs)
// i krzyczy, gdy treść da na ekranie surowy markdown albo urwany wzór:
//   - nieparzysta liczba „**” (np. „**intangible goods” bez zamknięcia),
//   - „\(” bez „\)” albo „\[” bez „\]” (MathJax tego nie narysuje, student widzi surowy LaTeX),
//   - definicje pojęć w jednym materiale raz po polsku, raz po angielsku.
// Gotowe ekrany sprawdza strona: rawMarkupCheck() po każdym render() (błąd w konsoli), a starosta może
// w konsoli przeglądarki wpisać skrotSprawdzTeksty(): strona otworzy po kolei każdy materiał (opracowanie,
// lekcja jako tekst, fiszki, quiz, zadania) i wypisze ekrany, na których zostało „**”.
//
// Uruchomienie (klucz service_role z Supabase → Project Settings → API; nie trafia do repo):
//   SUPABASE_SERVICE_KEY=... node scripts/sprawdz-gwiazdki.mjs
// albo na eksporcie tabeli (JSON: [{ id, data }] albo { id: data }):
//   node scripts/sprawdz-gwiazdki.mjs eksport.json
// Kod wyjścia 1, gdy coś znaleziono.
import { readFileSync } from "node:fs";

const URL = "https://zkyxujkdrovfzpasocmv.supabase.co";

async function load() {
  const file = process.argv[2];
  if (file) {
    const j = JSON.parse(readFileSync(file, "utf8"));
    return Array.isArray(j) ? j.map((r) => ({ id: r.id, data: r.data ?? r })) : Object.entries(j).map(([id, data]) => ({ id, data }));
  }
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!key) { console.error("Brak SUPABASE_SERVICE_KEY (albo podaj plik z eksportem)."); process.exit(2); }
  let all = [];
  for (let from = 0; ; from += 1000) {
    const r = await fetch(`${URL}/rest/v1/nauka_docs?select=id,data&kolekcja=eq.materialContent`, { headers: { apikey: key, Authorization: `Bearer ${key}`, Range: `${from}-${from + 999}` } });
    if (!r.ok) { console.error("Supabase:", r.status, await r.text()); process.exit(2); }
    const rows = await r.json();
    all = all.concat(rows);
    if (rows.length < 1000) break;
  }
  return all;
}

// inline() pogrubia co drugi kawałek między „**”. Nieparzysta liczba „**” = niezamknięte pogrubienie
// (pogrubi się reszta zdania albo, w polu pokazywanym bez inline(), zostaną gwiazdki).
const unclosed = (s) => (s.split("**").length - 1) % 2 === 1;
// Pola, których strona nie pokazuje jako tekstu (identyfikatory, adresy, dane wykresów).
const SKIP = /^(id|key|mid|materialId|link|url|src|slides?|i|n|v|at|createdAt|by|createdBy|color|svg|points|series|marks)$/;

function* strings(x, path) {
  if (typeof x === "string") yield [path, x];
  else if (Array.isArray(x)) for (let i = 0; i < x.length; i++) yield* strings(x[i], `${path}[${i}]`);
  else if (x && typeof x === "object") for (const [k, v] of Object.entries(x)) if (!SKIP.test(k)) yield* strings(v, path ? `${path}.${k}` : k);
}

function problems(s) {
  const out = [];
  if (unclosed(s)) out.push("niezamknięte **");
  const open = (s.match(/\\\(/g) || []).length, close = (s.match(/\\\)/g) || []).length;
  if (open !== close) out.push(`wzór \\( ${open}× / \\) ${close}×`);
  const openD = (s.match(/\\\[/g) || []).length, closeD = (s.match(/\\\]/g) || []).length;
  if (openD !== closeD) out.push(`wzór \\[ ${openD}× / \\] ${closeD}×`);
  return out;
}

// Definicje pojęć w jednym materiale mają być w jednym języku (ten sam test co defLang w index.html).
const PL_HINT = /[ąćęłńóśźż]|\b(jest|się|oraz|które|który|która|czyli|albo|gdy|lub|przez|dla|na przykład)\b/i;
function mixedLang(data) {
  const defs = (data.concepts || []).map((x) => x.definition).filter(Boolean);
  const pl = defs.filter((d) => PL_HINT.test(d)).length;
  return pl && pl < defs.length ? `  concepts: ${pl} z ${defs.length} definicji po polsku, reszta po angielsku` : null;
}

const rows = await load();
let bad = 0, mats = 0;
for (const { id, data } of rows) {
  const hits = [];
  const ml = mixedLang(data); if (ml) hits.push(ml);
  for (const [path, s] of strings(data, "")) for (const p of problems(s)) hits.push(`  ${path}: ${p} · „${s.slice(0, 90).replace(/\s+/g, " ")}${s.length > 90 ? "…" : ""}”`);
  if (hits.length) { mats++; bad += hits.length; console.log(`✗ ${id} (${hits.length})`); console.log(hits.join("\n")); }
}
console.log(`\nSprawdzono ${rows.length} materiałów: ${bad ? `${bad} problemów w ${mats} materiałach` : "czysto"}.`);
process.exit(bad ? 1 : 0);
