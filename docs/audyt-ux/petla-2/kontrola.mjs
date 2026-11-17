// Część automatyczna raportu rundy pętli UX-2 (A5 b): diff względem origin/main, zmienione funkcje w index.html
// i skrot-supabase.js porównane z listą B3, emoji w dodanych liniach kodu, skrót tablic quiz (atrapa i docs/) przed i po,
// nowe migracje z wynikiem funkcje-sql.mjs --nadpisane, nowe polskie teksty bez pary EN.
// node docs/audyt-ux/petla-2/kontrola.mjs > kontrola.md   (kod wyjścia 1, gdy coś jest poza zasadami)
import { execSync } from "child_process";
import fs from "fs";
import crypto from "crypto";
const ROOT = new URL("../../../", import.meta.url).pathname;
const sh = (c) => execSync(c, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "ignore"] });
const out = [], problemy = [];
// Porównujemy z punktem rozgałęzienia (merge-base), nie z bieżącym origin/main: gdy na main wejdą inne pętle, ich zmiany
// nie mogą wyglądać na nasze.
const BAZA = execSync("git merge-base HEAD origin/main", { cwd: ROOT, encoding: "utf8" }).trim();
const P = (...l) => out.push(...l);

// Lista z B3 (pętla 2) + funkcje nowe w tej pętli. Wywołania z umów i blok mostu wypisujemy osobno.
const MOJE = new Set(["viewHome", "lpLevelBar", "streakNext", "kStreakAlive", "kFreezeUse", "xpFlush", "LP_DAILY_GOAL", "przypHomeCard", "ptsDzis", "ptsHome", "ldBlock",
  "misjaClaim", "viewReview", "openPhoneCal", "homeQuests", "greetBadges", "CAL_FN", "termIcs", "przypStan",
  "setPrzyp" // B3 „funkcja przypomnienia”: wiersz „Seria dni” w rodzajach maili (recenzja etapu 4, runda 1)
]);
const UMOWY = [/window\.ZD_WEJSCIE\?\./, /window\.ZD_NAWYK\?\./, /window\.ZD_NAGRODY\?\./];

P("# Kontrola automatyczna UX-2", "", `Gałąź: ${sh("git branch --show-current").trim()} · HEAD ${sh("git rev-parse --short HEAD").trim()} · origin/main ${sh("git rev-parse --short origin/main").trim()}`, "");
P(`## git diff --stat ${BAZA.slice(0, 7)}..HEAD`, "```", sh(`git diff --stat ${BAZA}..HEAD`).trim() || "(brak commitów)", "```", "");
P(`## Zmiany w drzewie roboczym względem punktu rozgałęzienia ${BAZA.slice(0, 7)} (z niezacommitowanymi)`, "```", sh(`git diff --stat ${BAZA}`).trim(), sh("git ls-files --others --exclude-standard").trim(), "```", "");

// --- zmienione funkcje: dla każdej zmienionej linii najbliższa definicja powyżej (2 spacje wcięcia w index.html)
function funkcje(plik) {
  if (!fs.existsSync(ROOT + plik)) return null;
  const now = fs.readFileSync(ROOT + plik, "utf8").split("\n");
  const diff = sh(`git diff -U0 ${BAZA} -- ${plik}`);
  const hunks = [...diff.matchAll(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/gm)];
  const lines = diff.split("\n");
  const def = /^\s{0,4}(?:async\s+)?function\s+([A-Za-z0-9_$]+)|^\s{0,4}(?:const|let)\s+([A-Za-z0-9_$]+)\s*=/;
  const res = new Map(); // nazwa → { linie, umowy, most }
  let cur = null, ln = 0;
  for (const l of lines) {
    const m = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(l);
    if (m) { ln = +m[1]; cur = true; continue; }
    if (!cur || l.startsWith("+++") || l.startsWith("---")) continue;
    if (l.startsWith("+")) {
      const at = ln - 1;
      let name = "(poza funkcją)";
      if (/=== most ux-2 ===|ZD_APP \|\|=|=== koniec mostu ux-2 ===/.test(l)) name = "(blok mostu ux-2)";
      else if (/<script src="nawyk\.js/.test(l)) name = "(linia <script> nawyk.js)";
      else for (let i = at; i >= 0; i--) { const d = def.exec(now[i]); if (d && (/^\s{2}\S/.test(now[i]) || /^\S/.test(now[i]))) { name = d[1] || d[2]; break; } }
      const e = res.get(name) || { dodane: 0, usuniete: 0, umowy: 0, przyklad: l.slice(1, 140).trim() };
      e.dodane++; if (UMOWY.some((r) => r.test(l))) e.umowy++;
      res.set(name, e); ln++;
    } else if (l.startsWith("-")) {
      // usunięta linia: funkcja z bieżącego miejsca
      let name = "(poza funkcją)";
      for (let i = ln - 1; i >= 0; i--) { const d = def.exec(now[i]); if (d && (/^\s{2}\S/.test(now[i]) || /^\S/.test(now[i]))) { name = d[1] || d[2]; break; } }
      const e = res.get(name) || { dodane: 0, usuniete: 0, umowy: 0, przyklad: l.slice(1, 140).trim() }; e.usuniete++; res.set(name, e);
    }
  }
  return res;
}
for (const plik of ["index.html", "skrot-supabase.js"]) {
  const r = funkcje(plik);
  P(`## Zmienione funkcje: ${plik}`);
  if (!r || !r.size) { P("- brak zmian", ""); continue; }
  P("| funkcja | + | − | wywołania z umów | na liście B3 pętli 2 | przykład |", "|---|---|---|---|---|---|");
  for (const [n, e] of r) {
    const specj = /^\(blok mostu|^\(linia <script>/.test(n), lista = MOJE.has(n);
    const tylkoUmowy = e.umowy && e.umowy === e.dodane && !lista;
    const okk = lista || specj || tylkoUmowy;
    if (!okk) problemy.push(`${plik}: zmiana w ${n} spoza listy B3`);
    P(`| ${n} | ${e.dodane} | ${e.usuniete} | ${e.umowy} | ${specj ? "most / ładowanie pliku" : lista ? "tak" : tylkoUmowy ? "tylko wywołanie z umowy" : "**NIE**"} | \`${e.przyklad.replace(/\|/g, "\\|").slice(0, 90)}\` |`);
  }
  P("");
}

// --- emoji w dodanych liniach kodu (poza tekstami treści i komentarzami z cytatami)
const EMO = /\p{Extended_Pictographic}/u;
const added = sh(`git diff -U0 ${BAZA} -- '*.js' '*.html' '*.css' '*.mjs' '*.ts'`).split("\n");
let file = "", emo = [];
// Emoji, które były już w usuniętej (starej) wersji tego samego pliku, to tekst sprzed pętli w zmienionej linii (np. tytuł wpisu
// w kalendarzu) – wypisujemy je osobno, nie jako nowe emoji.
const stareEmo = {}; { let f = ""; for (const l of added) { if (l.startsWith("+++ b/")) { f = l.slice(6); continue; } if (l.startsWith("-") && !l.startsWith("---")) for (const m of l.match(new RegExp(EMO.source, "gu")) || []) (stareEmo[f] ||= new Set()).add(m); } }
const emoStare = [];
for (const l of added) {
  if (l.startsWith("+++ b/")) { file = l.slice(6); continue; }
  if (!l.startsWith("+") || l.startsWith("+++")) continue;
  const code = l.slice(1);
  if (/^\s*\/\//.test(code)) continue; // komentarz
  if (/i18n-en\.js$/.test(file)) continue; // słownik
  if ((/^docs\/gry\/test\//.test(file) && !/atrapa/.test(file)) || /^docs\/audyt-ux\//.test(file)) continue; // testy (asercje na istniejących tekstach)
  const m = code.match(new RegExp(EMO.source, "gu"));
  if (m && m.every((x) => stareEmo[file]?.has(x))) emoStare.push(`${file}: ${m.join(" ")} · \`${code.trim().slice(0, 120)}\``);
  else if (m) emo.push(`${file}: ${m.join(" ")} · \`${code.trim().slice(0, 120)}\``);
}
for (const f of sh("git ls-files --others --exclude-standard").split("\n").filter((f) => /\.(js|css|html|ts)$/.test(f) && !/^docs\//.test(f))) {
  fs.readFileSync(ROOT + f, "utf8").split("\n").forEach((code, i) => { if (/^\s*\/\//.test(code)) return; const m = code.match(new RegExp(EMO.source, "gu")); if (m) emo.push(`${f}:${i + 1}: ${m.join(" ")} · \`${code.trim().slice(0, 120)}\``); });
}
P("## Emoji w dodanych liniach kodu", ...(emo.length ? emo.map((x) => "- " + x) : ["- brak"]), "");
if (emoStare.length) P("### Emoji sprzed pętli w zmienionych liniach (były już w usuniętej wersji linii)", ...emoStare.map((x) => "- " + x), "");
if (emo.length) problemy.push(`emoji w kodzie: ${emo.length}`);

// --- skrót tablic quiz w atrapie i w docs/ (origin/main vs teraz)
const quizHash = (txt) => crypto.createHash("sha256").update((txt.match(/quiz[\s\S]{0,4000}?\]/g) || []).join("\n")).digest("hex").slice(0, 16);
const pliki = sh("git ls-files docs/ | grep -E '\\.(js|json|mjs)$'").split("\n").filter(Boolean);
const zmienione = [];
let hA = crypto.createHash("sha256"), hB = crypto.createHash("sha256");
for (const f of pliki) {
  let a = ""; try { a = sh(`git show ${BAZA}:${f}`); } catch { continue; }
  const b = fs.existsSync(ROOT + f) ? fs.readFileSync(ROOT + f, "utf8") : "";
  const x = quizHash(a), y = quizHash(b); hA.update(x); hB.update(y);
  if (x !== y) zmienione.push(`${f}: ${x} → ${y}`);
}
hA = hA.digest("hex").slice(0, 16); hB = hB.digest("hex").slice(0, 16);
P("## Skrót tablic `quiz` (atrapa i docs/)", `- przed (origin/main): \`${hA}\``, `- po (drzewo robocze): \`${hB}\``, `- ${hA === hB ? "równe ✓" : "**RÓŻNE**: " + zmienione.join("; ")}`, "");
if (hA !== hB) problemy.push("zmienione tablice quiz");

// --- nowe migracje + nadpisane funkcje
const nowe = sh(`git diff --name-only --diff-filter=A ${BAZA} -- supabase/; git ls-files --others --exclude-standard supabase/`).split("\n").filter((f) => /supabase\/skrot-v\d+.*\.sql$/.test(f));
P("## Nowe migracje", ...(nowe.length ? [] : ["- brak"]));
for (const f of [...new Set(nowe)]) {
  let w; try { w = sh(`node scripts/funkcje-sql.mjs --nadpisane ${f.replace("supabase/", "")}`).trim(); } catch (e) { w = "BŁĄD: " + String(e.stderr || e.message).trim(); problemy.push(`${f}: funkcje-sql --nadpisane nie działa (brak w kolejce pglite.mjs?)`); }
  P(`### ${f}`, "```", w, "```");
}
P("");

// --- nowe polskie teksty bez EN: PL z nawyk.js + literały z polskimi literami w dodanych liniach index.html / przypomnienia.js / lekcja-dnia.js
let dict = null; new Function("window", fs.readFileSync(ROOT + "i18n-en.js", "utf8"))({ SKROT_I18N: { load: (d) => { dict = d; } } });
const exact = dict.exact;
const brak = [];
const PLX = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;
try { const N = (await import(ROOT + "nawyk.js")).default; for (const v of Object.values(N.PL)) if (!(v in exact)) brak.push(`nawyk.js PL: „${v}”`); } catch (e) { brak.push("nawyk.js: " + e.message); }
let f2 = "";
for (const l of sh(`git diff -U0 ${BAZA} -- index.html lekcja-dnia.js`).split("\n")) {
  if (l.startsWith("+++ b/")) { f2 = l.slice(6); continue; }
  if (!l.startsWith("+") || l.startsWith("+++") || /^\+\s*\/\//.test(l)) continue;
  for (const m of l.matchAll(/(["'`])((?:(?!\1)[^\\]|\\.)*?)\1/g)) {
    let s = m[2]; if (!PLX.test(s) || s.length < 2) continue;
    if (/^[a-z-]+:|^bm-|^skrot-|^\.|^#|class|=>/.test(s)) continue;
    let k = 0; s = s.replace(/\$\{[^}]*\}/g, () => `{${k++}}`).trim();
    if (!(s in exact) && !(s.replace(/^[·\s]+/, "") in exact)) brak.push(`${f2}: „${s.slice(0, 90)}”`);
  }
}
P("## Nowe polskie teksty bez pary EN", ...(brak.length ? brak.map((x) => "- " + x) : ["- brak"]), "");
if (brak.length) problemy.push(`teksty bez EN: ${brak.length}`);

P("## Wynik", ...(problemy.length ? problemy.map((x) => "- ✗ " + x) : ["- ✓ wszystko w zasadach"]));
console.log(out.join("\n"));
process.exit(problemy.length ? 1 : 0);
