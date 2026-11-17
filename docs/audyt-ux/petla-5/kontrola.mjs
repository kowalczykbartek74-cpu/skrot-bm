// Część automatyczna raportu pętli UX-5 (A5 b): node docs/audyt-ux/petla-5/kontrola.mjs [plik-wyjścia.md]
// 1) git diff --stat origin/main; 2) zmienione funkcje index.html / skrot-supabase.js vs lista B3 (+ most, wywołania z umów, CSS);
// 3) emoji w dodanych liniach kodu; 4) hash tablic quiz (atrapa + docs/) przed i po; 5) nowe migracje + funkcje-sql --nadpisane;
// 6) nowe teksty PL bez pary EN (przybliżenie: literały z polskimi literami w dodanych liniach nagrody.js i index.html).
import { execSync } from "child_process";
import fs from "fs";
import crypto from "crypto";
const ROOT = new URL("../../../", import.meta.url).pathname;
const sh = (c) => execSync(c, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "ignore"] });
const BAZA = process.env.BAZA || "origin/main";
const out = [];
out.push(`# Kontrola automatyczna UX-5 (${new Date().toISOString().slice(0, 16)}, względem ${BAZA})`, "");
out.push("## 1. git diff --stat", "```", sh(`git diff --stat ${BAZA}`).trim(), "```", "");

// 2) funkcje
const B3 = ["viewSubject", "subjectHero", "subjectLearn", "courseSection", "subjectPts", "ptsMilestone", "viewShop", "shopHero", "shopMisje", "misjaCard", "levelUpShow", "lvHowShow", "lpLevelsShow",
  "ODZNAKI", "GRY_BADGES", "gryBadge", "gryBadgeRow", "viewProfil", "viewRanking", "rankMeCard", "rankList", "rankWeekDiff", "kProfilShow", "viewGames", "gryRecords", "hdRes", "hdShare", "hdLoad", "viewHaslo",
  "bsClaim", "bsLoad", "bsAnnText", "viewBoss", "viewPaczka", "viewPolec", "THEME_SHOP", "PINK_LEVEL", "BOW_LEVEL", "MEADOW_LV", "LILIA_LEVEL", "SEA_LEVEL", "NOC_LEVEL", "RIWIERA_LEVEL", "KLUB_LEVEL", "themeOwned", "viewMaterial", "materialHead",
  "THEME_CHOICE", "shopBuy", "kosmShop", "rankGroups", "coinTxt"];
// Obszary z B3 opisane słownie (Hasło, Boss, Sklep, motywy, poziomy, ranking, gry, paczka): funkcje pomocnicze tych ekranów.
const B3_PRE = /^(hd[A-Z]|HD_|bs[A-Z]|BS_|shop[A-Z]|SHOP|kShop|kGablota|K_TABS|K_GROUPS|kCard|kActs|theme[A-Z]|THEME_|lv[A-Z]|LP_LEVEL|rank[A-Z]|RANK|gry(Badge|Records)|ODZNAKI|pk[A-Z]|paczka|misja)/;
const funkcje = (plik) => {
  let diff = ""; try { diff = sh(`git diff -U0 ${BAZA} -- ${plik}`); } catch { return null; }
  if (!diff) return { zmiany: [] };
  const nowy = fs.readFileSync(ROOT + plik, "utf8").split("\n");
  let stary = ""; try { stary = sh(`git show ${BAZA}:${plik}`); } catch {}
  const istnialy = new Set([...stary.matchAll(/^ {2,4}(?:async )?function (\w+)|^ {2}(?:const|let|var) (\w+)\s*=/gm)].map((m) => m[1] || m[2]));
  const scriptOd = nowy.findIndex((l) => /^<script>|^\(\(\) => \{/.test(l));
  const linie = []; for (const m of diff.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)) { const a = +m[1], n = m[2] == null ? 1 : +m[2]; for (let i = 0; i < Math.max(n, 1); i++) linie.push(a + i - (n === 0 ? 0 : 0)); }
  const nazwa = (ln) => {
    const l = nowy[ln - 1] || "";
    if (/=== (koniec )?mostu? ux-5 ===|ZD_APP/.test(l)) return "[most ux-5]";
    if (/<script src="nagrody\.js/.test(l)) return "[ładowanie nagrody.js]";
    if (ln === 1) return "[linia 1: ?v= i18n.js]";
    if (/window\.ZD_NAGRODY\?\./.test(l)) { /* wywołanie z umowy, ale w czyjej funkcji? */ }
    // komentarz nad funkcją należy do funkcji pod nim
    if (/^\s*\/\//.test(l)) for (let j = ln; j < nowy.length && j < ln + 6; j++) { const m = nowy[j].match(/^ {2}(?:async )?function (\w+)|^ {2}(?:const|let|var) (\w+)\s*=/); if (m) return m[1] || m[2]; if (!/^\s*\/\//.test(nowy[j])) break; }
    for (let i = ln - 1; i >= 0; i--) {
      const m = nowy[i].match(/^ {2}(?:async )?function (\w+)|^ {2}(?:const|let|var) (\w+)\s*=|^ {4}(?:async )?function (\w+)/);
      if (m) return m[1] || m[2] || m[3];
      if (scriptOd > 0 && i < scriptOd) return "[CSS/HTML przed skryptem]";
    }
    return "[?]";
  };
  const by = new Map(), ex = new Map(); for (const ln of linie) { const n = nazwa(ln); by.set(n, (by.get(n) || 0) + 1); if (!ex.has(n)) ex.set(n, ln + ": " + (nowy[ln - 1] || "").trim().slice(0, 80)); }
  return { zmiany: [...by.entries()].map(([n, k]) => ({ n, k, ex: ex.get(n), ok: B3.includes(n) || B3_PRE.test(n) || n.startsWith("[") || !istnialy.has(n), nowa: !istnialy.has(n) && !n.startsWith("[") })) };
};
out.push("## 2. Zmienione funkcje (lista B3 pętli 5)");
for (const f of ["index.html", "skrot-supabase.js"]) {
  const r = funkcje(f);
  out.push(`### ${f}`);
  if (!r?.zmiany.length) { out.push("- bez zmian"); continue; }
  for (const z of r.zmiany) out.push(`- ${z.ok ? "✓" : "✗ POZA LISTĄ B3"} \`${z.n}\`${z.nowa ? " (nowa funkcja pętli 5)" : ""} (${z.k} linii)${z.ok ? "" : " · np. linia " + z.ex}`);
  // CSS: które selektory
  if (f === "index.html") {
    const css = sh(`git diff -U0 ${BAZA} -- index.html`).split("\n").filter((l) => /^\+[.#a-z].*\{/.test(l) && !/^\+\+\+/.test(l)).map((l) => l.slice(1, 90));
    if (css.length) out.push("- CSS (dodane/zmienione reguły):", ...css.map((c) => "  - `" + c + "`"));
    const wyw = sh(`git diff -U0 ${BAZA} -- index.html`).split("\n").filter((l) => /^\+.*window\.ZD_(NAGRODY|NAWYK|WEJSCIE)\?\./.test(l)).map((l) => l.trim().slice(1, 140));
    if (wyw.length) out.push("- wywołania z umów:", ...wyw.map((c) => "  - `" + c + "`"));
  }
}
out.push("");

// 3) emoji w dodanych liniach kodu (bez i18n-en.js: to słownik tekstów; bez docs/ i plików .md)
const EMO = /\p{Extended_Pictographic}/u;
const dod = sh(`git diff -U0 ${BAZA} -- . ':!i18n-en.js' ':!docs' ':!*.md' ':!supabase/test'`).split("\n").filter((l) => /^\+/.test(l) && !/^\+\+\+/.test(l));
const emo = dod.filter((l) => EMO.test(l.replace(/©|®|™/g, "")));
out.push("## 3. Emoji w dodanych liniach kodu", emo.length ? emo.map((l) => "- ✗ `" + l.slice(1, 160).trim() + "`").join("\n") : "- brak ✓", "");

// 4) hash quizów
const quizHash = (txt) => crypto.createHash("sha256").update((txt.match(/quiz[^\n]*/g) || []).join("\n")).digest("hex").slice(0, 16);
const pliki = sh(`git ls-files docs`).split("\n").filter((f) => /\.(json|js)$/.test(f) && !/ux5-/.test(f));
let rozne = [];
for (const f of pliki) { let a = ""; try { a = sh(`git show ${BAZA}:${f}`); } catch { continue; } const b = fs.readFileSync(ROOT + f, "utf8"); if (quizHash(a) !== quizHash(b)) rozne.push(f); }
const atA = quizHash(sh(`git show ${BAZA}:docs/gry/test/atrapa-supabase.js`)), atB = quizHash(fs.readFileSync(ROOT + "docs/gry/test/atrapa-supabase.js", "utf8"));
out.push("## 4. Tablice quiz (hash linii z „quiz”)", `- atrapa: przed ${atA} · po ${atB} ${atA === atB ? "✓ równe" : "✗ RÓŻNE"}`, `- pliki docs/*.json|js z innym hashem: ${rozne.length ? "✗ " + rozne.join(", ") : "brak ✓"}`, "");

// 5) migracje
const nowe = sh(`git diff --name-only --diff-filter=A ${BAZA} -- supabase`).split("\n").concat(sh("git ls-files --others --exclude-standard supabase").split("\n")).filter((f) => /^supabase\/skrot-v\d+/.test(f));
out.push("## 5. Nowe migracje");
for (const f of [...new Set(nowe)]) {
  const plik = f.replace(/^supabase\//, "");
  let r = ""; try { r = sh(`node scripts/funkcje-sql.mjs --nadpisane ${plik}`).trim(); } catch (e) { r = "błąd: " + e.message.slice(0, 200); }
  const straz = /^do \$\$ begin\n {2}if 'ąćęłńóśźż'/.test(fs.readFileSync(ROOT + f, "utf8"));
  out.push(`- \`${plik}\`: strażnik kodowania ${straz ? "✓" : "✗"}; \`funkcje-sql.mjs --nadpisane\`: ${r ? "\n```\n" + r + "\n```" : "(pusto: żadna funkcja nie ma późniejszej wersji) ✓"}`);
}
if (!nowe.length) out.push("- brak");
out.push("");

// 6) teksty PL bez EN
const en = fs.readFileSync(ROOT + "i18n-en.js", "utf8");
const klucze = new Set([...en.matchAll(/^"((?:[^"\\]|\\.)*)":/gm)].map((m) => JSON.parse('"' + m[1] + '"')));
const norm = (t) => { let i = 0; return t.replace(/\$\{[^}]*\}/g, () => `{${i++}}`).trim(); };
const kand = [];
for (const f of ["nagrody.js", "index.html"]) {
  let d = ""; try { d = f === "nagrody.js" && !sh(`git ls-files ${f}`).trim() ? fs.readFileSync(ROOT + f, "utf8").split("\n").map((l) => "+" + l).join("\n") : sh(`git diff -U0 ${BAZA} -- ${f}`); } catch { d = fs.readFileSync(ROOT + f, "utf8").split("\n").map((l) => "+" + l).join("\n"); }
  for (const l of d.split("\n").filter((x) => /^\+/.test(x) && !/^\+\+\+/.test(x) && !/^\+\s*\/\//.test(x) && x.length < 600 && !/^\+<!doctype/.test(x))) {
    for (const m of l.matchAll(/(["`])((?:(?!\1)[^\\]|\\.)*?[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ](?:(?!\1)[^\\]|\\.)*?)\1/g)) {
      const t = norm(m[2]); if (t.length < 3 || /^[a-z0-9_-]+$/.test(t) || /class|=>|\(|^\./.test(t) && !/\s/.test(t)) continue;
      if (!klucze.has(t)) kand.push(`${f}: ${t}`);
    }
  }
}
out.push("## 6. Nowe teksty PL bez pary EN (przybliżenie: literał w całości; zdania składane z kilku części mogą być fałszywym alarmem)", kand.length ? [...new Set(kand)].map((k) => "- " + k.slice(0, 200)).join("\n") : "- brak ✓", "");
const txt = out.join("\n") + "\n";
if (process.argv[2]) fs.writeFileSync(process.argv[2], txt);
console.log(txt);
