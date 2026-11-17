// Pętla UX-3: część automatyczna raportu każdej rundy (A5 b).
// node docs/audyt-ux/petla-3/kontrola.mjs [plik.md]   (z katalogu repo; porównuje z origin/main, łącznie z niezacommitowanymi zmianami)
import { execSync } from "child_process";
import fs from "fs";
import crypto from "crypto";
const sh = (c) => execSync(c, { encoding: "utf8", maxBuffer: 64 << 20 });
const BASE = "origin/main";
const out = [];
const P = (s = "") => out.push(s);

// 1. diff --stat
P("## 1. `git diff --stat origin/main` (z niezacommitowanymi)"); P("```"); P(sh(`git diff --stat ${BASE}`).trim()); P("```");
const untracked = sh("git ls-files --others --exclude-standard").trim();
if (untracked) { P("Nowe pliki (jeszcze nie w git):"); P("```"); P(untracked); P("```"); }

// 2. zmienione funkcje w index.html i skrot-supabase.js vs lista z B3
const MINE = ["playerOpen", "lpOpen", "lpBuild", "lpBuildDeck", "lpCards", "lpSectionCards", "LPR", "lpAward", "lpBuzz", "lpFloat", "lpTop", "lpKeys", "kick", "lpConfChips", "lpBiteDone", "lpSrcDone", "lpFinishLesson", "ldSource", "kSound", "kSoundOn", "xpFlush", "rv-hero", "lp-css", "lpLoad", "lpBonus",
  // nowe funkcje odtwarzacza tej pętli (dopisane obok LPR, bez zmian w cudzym kodzie)
  "lpSel", "lpRetryAdd", "lpGapFor", "lpBank", "lpRetryLater", "lpBanner", "lpStep", "lpNextLesson", "lpDoneUx", "lpNo"];
const ALLOWED_EXTRA = ["most ux-3", "skrypt lekcja-ux.js", "?v= w linii skryptów", "?v= w linii 1 (tylko i18n.js)", "Ustawienia: jeden wiersz (D3)"];
function changedFns(file) {
  let diff = ""; try { diff = sh(`git diff -U0 ${BASE} -- ${file}`); } catch { return []; }
  if (!diff) return [];
  const lines = fs.readFileSync(file, "utf8").split("\n");
  const res = new Map();
  for (const m of diff.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)) {
    const start = +m[1], n = m[2] == null ? 1 : +m[2];
    for (let ln = start; ln < start + Math.max(n, 1); ln++) {
      const txt = lines[ln - 1] || "";
      let name = null;
      if (/=== most ux-3 ===|ZD_APP \|\|= |koniec mostu ux-3/.test(txt)) name = "most ux-3";
      else if (/lekcja-ux\.js\?v=/.test(txt)) name = "skrypt lekcja-ux.js";
      else if (/<script src="kopie\.js/.test(txt)) name = "?v= w linii skryptów";
      else if (ln === 1) name = "?v= w linii 1 (tylko i18n.js)";
      else if (/ZD_LEKCJA\?\.ustawienia/.test(txt)) name = "Ustawienia: jeden wiersz (D3)";
      else {
        for (let i = ln - 1; i >= 0; i--) {
          const l = lines[i];
          let mm = l.match(/^\s{2,4}(?:async )?function (\w+)\s*\(/) || l.match(/^\s{2}const (\w+) = (?:\(|async|\w+ =>|\{)/) || l.match(/^\s{4}(\w+)\(card(?:, ctx)?\) \{/);
          if (mm) { name = mm[1]; if (/^\s{4}\w+\(card/.test(l)) name = "LPR." + mm[1]; break; }
          if (/^(html|\.|@media|@keyframes|:root)/.test(l)) { name = /rv-hero/.test(txt) ? "rv-hero" : /\.lp/.test(txt) ? "lp-css" : "CSS?"; break; }
        }
      }
      res.set(name || "?", (res.get(name || "?") || 0) + 1);
    }
  }
  return [...res.entries()];
}
P("\n## 2. Zmienione miejsca w `index.html` i `skrot-supabase.js` (porównanie z listą B3)");
for (const f of ["index.html", "skrot-supabase.js"]) {
  const fns = changedFns(f);
  P(`**${f}**: ${fns.length ? "" : "bez zmian"}`);
  for (const [n, c] of fns) {
    const own = MINE.some((x) => n === x || n.startsWith(x + ".") || n === "LPR." + x) || n.startsWith("LPR.");
    P(`- ${n} (${c} linii): ${own ? "TWOJA (B3)" : ALLOWED_EXTRA.includes(n) ? "dozwolone (umowa / most)" : "**POZA LISTĄ – sprawdź**"}`);
  }
}

// 3. emoji w dodanych liniach kodu
P("\n## 3. Emoji w dodanych liniach kodu (bez i18n-en.js i testów)");
const added = sh(`git diff -U0 ${BASE} -- . ':!i18n-en.js' ':!docs'`).split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++"));
let addedNew = [];
for (const f of untracked.split("\n").filter((x) => x && /\.(js|html|css)$/.test(x) && !x.startsWith("docs/"))) addedNew.push(...fs.readFileSync(f, "utf8").split("\n").map((l) => "+" + l));
const EMO = /\p{Extended_Pictographic}/u;
const emo = [...added, ...addedNew].filter((l) => EMO.test(l.replace(/\/\/.*$/, "")));
P(emo.length ? emo.map((l) => "- `" + l.slice(0, 160).replace(/`/g, "'") + "`").join("\n") : "brak");

// 4. skrót tablic quiz w atrapie i w docs/
P("\n## 4. Skrót tablic `quiz` (atrapa i docs/) przed i po");
function quizHash(rev) {
  const files = sh(`git ls-tree -r --name-only ${rev} -- docs`).split("\n").filter((f) => /\.(js|json|mjs)$/.test(f));
  const h = crypto.createHash("sha256");
  for (const f of files.sort()) { let t = ""; try { t = rev ? sh(`git show ${rev}:${f}`) : fs.readFileSync(f, "utf8"); } catch { continue; } for (const m of t.matchAll(/"?quiz"?\s*:\s*\[[\s\S]*?\]\s*[,}]/g)) h.update(f + m[0]); }
  return h.digest("hex").slice(0, 16);
}
function quizHashWork() {
  const files = sh("git ls-files -- docs").split("\n").filter((f) => /\.(js|json|mjs)$/.test(f) && !/ux3-/.test(f));
  const h = crypto.createHash("sha256");
  for (const f of files.sort()) { let t = ""; try { t = fs.readFileSync(f, "utf8"); } catch { continue; } for (const m of t.matchAll(/"?quiz"?\s*:\s*\[[\s\S]*?\]\s*[,}]/g)) h.update(f + m[0]); }
  return h.digest("hex").slice(0, 16);
}
const qa = quizHash(BASE), qb = quizHashWork();
P(`- origin/main: \`${qa}\`  ·  teraz: \`${qb}\`  →  ${qa === qb ? "RÓWNE" : "**RÓŻNE**"}`);

// 5. migracje
P("\n## 5. Nowe migracje SQL");
const mig = sh(`git diff --name-only --diff-filter=A ${BASE} -- supabase`).trim() + (untracked.split("\n").filter((f) => f.startsWith("supabase/")).join("\n"));
P(mig ? mig : "brak (pętla 3 nie ma numerów SQL)");

// 6. nowe teksty PL bez pary EN
P("\n## 6. Nowe teksty PL bez pary w `i18n-en.js`");
const en = fs.readFileSync("i18n-en.js", "utf8");
const keys = new Set([...en.matchAll(/^"((?:[^"\\]|\\.)*)":/gm)].map((m) => JSON.parse('"' + m[1] + '"')));
const src = [...added.filter((l) => !/^\+\s*\/\//.test(l) && !/^\+<!doctype|^\+<script src="kopie/.test(l)), ...addedNew].join("\n");
const old = sh(`git show ${BASE}:index.html`) + sh(`git show ${BASE}:kosmetyki.js`);
const lits = new Set();
for (const m of src.matchAll(/(["`])((?:(?!\1)[^\\\n]|\\.)*?)\1/g)) {
  let t = m[2]; if (m[1] === "`") { let i = 0; t = t.replace(/\$\{[^}]*\}/g, () => `{${i++}}`); }
  if (!/[a-ząćęłńóśźż]{3}/i.test(t) || !/[ąćęłńóśźż]|\s/i.test(t)) continue;
  if (/^[\w.-]+$|^[.#]?[a-z0-9-]+(\s[.#]?[a-z0-9-:()"=\[\]]+)+$|var\(--|\bpx\b|rgb|svg|stroke|viewBox|=>|\(\)|querySelector|^lp-|^h2-|^btn|^opt|aria-|data-|^\s|\s$/.test(t) && !/[ąćęłńóśźż]/i.test(t)) continue;
  if (/[{}]/.test(t) && !/\{\d\}/.test(t)) continue;
  lits.add(t.trim());
}
const miss = [...lits].filter((t) => t && !keys.has(t) && !keys.has(t.replace(/\s+$/, "")) && !old.includes(t) && !/^[.#][a-z]/.test(t));
P(miss.length ? "Kandydaci (sprawdź; część to złożenia albo teksty z istniejącymi parami częściowymi):\n" + miss.map((t) => "- `" + t.slice(0, 140) + "`").join("\n") : "brak");
const md = out.join("\n");
if (process.argv[2]) fs.writeFileSync(process.argv[2], md + "\n");
console.log(md);
