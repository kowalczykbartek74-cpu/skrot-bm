// Pętla UX-4: część automatyczna raportu rundy (A5 b). node docs/audyt-ux/petla-4/kontrola.mjs [> kontrola.md]
// Porównuje drzewo robocze z origin/main: diff --stat, zmienione funkcje w index.html i skrot-supabase.js (vs lista B3),
// emoji w dodanych liniach kodu, skrót tablic quiz (atrapa i docs/), nowe migracje SQL, nowe teksty PL bez pary EN.
import { execSync } from "child_process";
import fs from "fs";
import crypto from "crypto";
const ROOT = new URL("../../../", import.meta.url).pathname;
const sh = (c) => execSync(c, { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 28 });
const BASEREF = process.env.REF || "origin/main";
const out = [];
const P = (...a) => out.push(...a);

// Miejsca pętli 4 z B3 (etap A). Wywołania z umów i blok mostu wypisujemy osobno.
const MOJE = new Set(["toast", "viewMaterials", "viewPo", "viewGuide", "guideTest", "gRing", "viewTerms", "viewCalendar", "viewReview", "viewGlossary", "viewMaterial",
  "viewMore", "viewUstawienia", "font", "apply" /* motyw nocny: usunięte ładowanie Cormorant z Google (B4) */, "nocOn", "theme", "h2Ico", "saveErr", "CSS (główny arkusz)", "<head> (czcionki)", "linia ładowania własnych plików", "most ux-4", "ładowanie własnych plików"]);

P(`# Kontrola automatyczna – ${new Date().toISOString().slice(0, 16)} (porównanie z ${BASEREF}, z niezatwierdzonymi zmianami)`, "");
P("## git diff --stat", "```", sh(`git diff --stat ${BASEREF}`).trim(), "```", "");
const untracked = sh("git ls-files --others --exclude-standard").trim();
if (untracked) P("Nowe pliki (nieśledzone):", "```", untracked, "```", "");

// --- zmienione funkcje ---
function enclosing(lines, n) {
  // n: numer linii (1-based) w nowym pliku. CSS główny arkusz: między <style> (linia ~75) a pierwszym </style> po nim.
  const s0 = lines.findIndex((l, i) => i > 1 && l === "<style>"), s1 = lines.findIndex((l, i) => i > s0 && l === "</style>");
  if (n === 1) return "linia 1 (wspólna)";
  if (n - 1 > s0 && n - 1 < s1) return "CSS (główny arkusz)";
  if (n - 1 < s0) return "<head> (czcionki)";
  if (n - 1 === s1 + 1) return "ładowanie własnych plików";
  // Zmieniony komentarz nad funkcją liczymy do tej funkcji.
  while (/^\s*\/\//.test(lines[n - 1] || "") && !/=== (koniec )?mostu/.test(lines[n - 1]) && n < lines.length) n++;
  for (let i = n - 1; i >= 0; i--) {
    const l = lines[i];
    if (/\/\/ === most ux-4 ===/.test(l)) return "most ux-4";
    if (/\/\/ === koniec mostu ux-4 ===/.test(l) && i !== n - 1) break;
    const m = l.match(/^\s{0,6}(?:async\s+)?function\s+([\w$]+)\s*\(/) || l.match(/^\s{0,6}(?:const|let)\s+([\w$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[\w$]+)\s*=>/) || l.match(/^\s{0,6}(?:const|let)\s+([\w$]+)\s*=/);
    if (m) return m[1];
  }
  return "?";
}
for (const f of ["index.html", "skrot-supabase.js"]) {
  const diff = sh(`git diff -U0 ${BASEREF} -- ${f}`);
  if (!diff) { P(`## ${f}: bez zmian`, ""); continue; }
  const lines = fs.readFileSync(ROOT + f, "utf8").split("\n");
  const hunks = [...diff.matchAll(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/gm)].map((m) => ({ start: +m[3], len: m[4] === undefined ? 1 : +m[4] }));
  const fns = new Map();
  for (const h of hunks) { const ns = h.len ? Array.from({ length: h.len }, (_, i) => h.start + i) : [h.start]; for (const n of ns) { const e = enclosing(lines, n); fns.set(e, (fns.get(e) || 0) + 1); } }
  P(`## ${f}: zmienione miejsca (liczba zmienionych linii)`);
  for (const [k, v] of [...fns].sort((a, b) => b[1] - a[1])) P(`- ${MOJE.has(k) ? "✓ moje" : "⚠ SPRAWDŹ"} \`${k}\` – ${v}`);
  P("");
}
// --- emoji w dodanych liniach kodu ---
const added = sh(`git diff -U0 ${BASEREF} -- '*.js' '*.html' '*.css'`).split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++"));
let addedNew = [];
for (const f of untracked.split("\n").filter((x) => /\.(js|css|html)$/.test(x) && !x.startsWith("docs/"))) addedNew.push(...fs.readFileSync(ROOT + f, "utf8").split("\n").map((l) => "+" + l));
const EMO = /\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F/u;
const emo = [...added, ...addedNew].filter((l) => EMO.test(l) && !/^\+\s*\/\//.test(l));
P(`## Emoji w dodanych liniach kodu (poza komentarzami): ${emo.length}`);
for (const l of emo.slice(0, 40)) P("- `" + l.slice(1, 160).trim().replace(/`/g, "'") + "`");
P("");
// --- skrót tablic quiz ---
// Wszystkie linie, w których jest tablica albo generator pytań quizu (quiz: [...], const quiz = ..., "quiz":[...]).
const quizHash = (txt) => crypto.createHash("sha256").update(txt.split("\n").filter((l) => /\bquiz\b\s*["']?\s*[:=]/.test(l)).join("\n")).digest("hex").slice(0, 16);
P("## Skrót tablic quiz (przed → po)");
const files = sh(`git ls-files docs | grep -E '\\.(js|mjs|json)$'`).trim().split("\n");
let same = true;
for (const f of files) { let before = ""; try { before = sh(`git show ${BASEREF}:${f}`); } catch {} const after = fs.existsSync(ROOT + f) ? fs.readFileSync(ROOT + f, "utf8") : ""; const a = quizHash(before), b = quizHash(after); if (a !== b) same = false; if (a !== b || /atrapa|h2-lib/.test(f)) P(`- ${f}: ${a} → ${b} ${a === b ? "✓" : "✗ ZMIANA"}`); }
P(same ? "- wszystkie równe ✓" : "- ✗ są różnice", "");
// --- migracje ---
const mig = sh(`git diff --name-only --diff-filter=A ${BASEREF} -- supabase`).trim();
P("## Nowe migracje SQL", mig ? mig : "- brak (pętla 4 bez SQL)", "");
// --- nowe teksty PL bez pary EN ---
const en = fs.readFileSync(ROOT + "i18n-en.js", "utf8");
const PLX = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]|\b(i|w|z|na|do|po|nie|jak|się|jest|Twój|Twoje|dni|Wróć|Ponów)\b/;
const lits = new Set();
for (const l of [...added, ...addedNew]) {
  if (/^\+\s*\/\/|^\+\s*\/\*|^\+\s*\*/.test(l)) continue;
  const code = l.replace(/\/\/ .*$/, "");
  for (const m of code.matchAll(/(["'`])((?:\\.|(?!\1).){3,200}?)\1/g)) {
    const s = m[2]; if (/^[\w.#\-:\[\]=()>*+~ ,]*$/.test(s) && !/\s/.test(s)) continue; // selektory, klasy, identyfikatory
    if (/[{};<>]|var\(|px|rem|^\s*$|https?:|\.woff2|^M\d|^[a-z-]+$/.test(s) && !/\{\d\}/.test(s)) continue;
    if (PLX.test(s) && /[a-ząćęłńóśźż]{2}/i.test(s)) lits.add(s);
  }
}
const missing = [...lits].filter((s) => !en.includes(JSON.stringify(s)) && !en.includes(`"${s.replace(/\$\{[^}]+\}/g, "{0}")}"`));
P(`## Nowe teksty PL (literały w dodanych liniach): ${lits.size}, bez pary w i18n-en.js: ${missing.length}`);
for (const s of missing) P("- „" + s + "”");
P("");
console.log(out.join("\n"));
