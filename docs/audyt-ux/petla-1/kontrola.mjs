// Pętla UX-1: część automatyczna raportu rundy (A5 b). Uruchom z katalogu repo:
//   node docs/audyt-ux/petla-1/kontrola.mjs > docs/audyt-ux/petla-1/etap-X/runda-R/kontrola.md
// Porównuje z origin/main (także zmiany jeszcze niezacommitowane).
import { execSync } from "child_process";
import fs from "fs";
import crypto from "crypto";
const sh = (c) => { try { return execSync(c, { encoding: "utf8", maxBuffer: 1 << 28 }); } catch (e) { return e.stdout || ""; } };
const out = [];
const P = (...a) => out.push(a.join("\n"));

// Dozwolone miejsca pętli 1 (B3). Wywołania z umów i blok mostu wypisujemy osobno.
const DOZWOLONE = {
  "index.html": ["buyBanner", "paywallCard", "trialBtn", "trialLabel", "canTrial", "lockModal", "lockBox", "showWelcome", "showTrialEnded", "tryStart", "openAccount", "skrotPokaz", "lgStas",
    "(linia 1: #login)", "(CSS #login / .lg-*)", "(CSS szarego .btn na Dziś)", "(tekst konta w Ustawieniach)"],
  "skrot-supabase.js": ["openLogin", "emailStep", "passStep", "codeStep", "modeSwitch", "trialCard", "orLogin", "otpErr", "startTrial", "trialOffer", "TRIAL_ERR", "choosePlan", "goPay", "planCompare", "manage",
    "refreshMe", "afterReady", "info", "buy", "trialLeftText", "trialUntilText", "trialDayText", "proba", "(ux-1)"],
};
const UMOWY = /\/\/ ux-1( tymczasowo)?\b|ZD_WEJSCIE\?\./;

P("# Kontrola automatyczna – pętla UX-1", "", `Stan: ${sh("git log -1 --format='%h %s'").trim()} (+ zmiany niezacommitowane)`, "");
P("## git diff --stat origin/main", "", "```", sh("git diff --stat origin/main").trim(), sh("git status --porcelain | grep '^??' | sed 's/^?? /nowy (niedodany): /'").trim(), "```", "");

// --- zmienione funkcje ---
function funkcje(file) {
  const diff = sh(`git diff -U0 origin/main -- ${file}`);
  const cur = fs.readFileSync(file, "utf8").split("\n");
  const hunks = [...diff.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@.*$/gm)].map((m) => ({ start: +m[1], n: m[2] == null ? 1 : +m[2] }));
  const res = [];
  for (const hk of hunks) {
    const lines = hk.n ? cur.slice(hk.start - 1, hk.start - 1 + hk.n) : [];
    const ln = hk.start;
    let name = null;
    if (file === "index.html" && ln === 1) name = "(linia 1: #login)";
    else if (lines.some((l) => /most ux-1/.test(l)) || lines.every((l) => /most ux-1|ZD_APP|koniec mostu/.test(l)) && lines.length) name = "(blok mostu)";
    else if (lines.length && lines.every((l) => UMOWY.test(l))) name = "(wywołanie z umowy)";
    else if (lines.some((l) => /ux-wejscie\.(js|css)/.test(l))) name = "(ładowanie własnego pliku)";
    else if (file === "index.html" && lines.some((l) => /\?v=/.test(l)) && ln > 5300 && ln < 5400) name = "(linia <script src> – ?v=)";
    else {
      // Nazwa: definicja w samym kawałku (wcięcie 2–4) albo najbliższa definicja powyżej z wcięciem 2–4 (kroki logowania, funkcje aplikacji).
      const def = (l) => l.match(/^\s{2,4}(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*\(/) || l.match(/^\s{2,4}(?:const|let)\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$]+)\s*=>/) || l.match(/^\s{2,4}skrot\.([A-Za-z0-9_$]+)\s*=/) || l.match(/^\s{2,4}const\s+([A-Z_]+)\s*=\s*\{/);
      for (const l of lines) { const m = def(l); if (m) { name = m[1]; break; } }
      for (let i = ln - 2; !name && i >= 0 && i > ln - 4000; i--) {
        const l = cur[i];
        const m = def(l);
        if (m) { name = m[1]; break; }
        if (file === "index.html" && /^<style>|^<\/style>/.test(l)) break;
      }
      if (file === "index.html" && !name && ln < 5400) name = "(CSS)";
      if (file === "index.html" && ln >= 5050 && ln < 5400 && lines.every((l) => /#login|lg-|lk-/.test(l))) name = "(CSS #login / .lg-*)";
      if (file === "index.html" && lines.every((l) => /main\[data-view="home"\].*\.btn/.test(l))) name = "(CSS szarego .btn na Dziś)";
    }
    res.push({ ln, n: hk.n, name: name || "?" });
  }
  return res;
}
P("## Zmienione funkcje (porównanie z listą B3)", "");
for (const f of ["index.html", "skrot-supabase.js"]) {
  const r = funkcje(f);
  const grp = {};
  for (const x of r) (grp[x.name] ||= []).push(x.ln);
  P(`### ${f}`, "");
  for (const [n, lns] of Object.entries(grp)) {
    const spec = /^\((blok mostu|wywołanie z umowy|ładowanie własnego pliku|linia <script src> – \?v=)\)$/.test(n);
    const okk = spec || DOZWOLONE[f].includes(n);
    P(`- ${okk ? (spec ? "◦ umowa/most" : "✓") : "✗ POZA LISTĄ"} \`${n}\` (linie ${lns.join(", ")})`);
  }
  P("");
}

// --- emoji w dodanych liniach kodu ---
const EMO = /\p{Extended_Pictographic}/u;
const added = sh("git diff -U0 origin/main -- '*.js' '*.html' '*.css' '*.mjs' ':!docs/audyt-ux'").split("\n").filter((l) => /^\+(?!\+\+)/.test(l));
const newFiles = sh("git status --porcelain | grep '^??' | cut -c4-").split("\n").filter((f) => /\.(js|css|html|mjs)$/.test(f) && !/^docs\/audyt-ux/.test(f));
for (const f of newFiles) for (const l of fs.readFileSync(f, "utf8").split("\n")) added.push("+" + l);
// Pomijamy komentarze i wykrywacze emoji w testach (wyrażenie z \p{Extended_Pictographic}).
const emo = added.filter((l) => EMO.test(l) && !/^\+\s*\/\//.test(l) && !/Extended_Pictographic/.test(l));
P("## Emoji w dodanych liniach kodu", "", emo.length ? emo.slice(0, 30).map((l) => "- `" + l.slice(0, 160) + "`").join("\n") : "brak ✓", "");

// --- skrót tablic quiz ---
const qhash = (src) => crypto.createHash("sha1").update(src.split("\n").filter((l) => /quiz/i.test(l)).join("\n")).digest("hex").slice(0, 12);
const qfiles = ["docs/gry/test/atrapa-supabase.js", ...sh("git ls-files 'docs/*.json'").split("\n").filter(Boolean)];
let qok = true; const qrows = [];
for (const f of qfiles) { const a = qhash(sh(`git show origin/main:${f}`)), b = fs.existsSync(f) ? qhash(fs.readFileSync(f, "utf8")) : "brak"; if (a !== b) qok = false; if (f.endsWith(".js") || a !== b) qrows.push(`- ${f}: ${a} → ${b} ${a === b ? "✓" : "✗ RÓŻNE"}`); }
P("## Skrót tablic quiz (przed → po)", "", ...qrows, `- pliki JSON w docs/: ${qfiles.length - 1}, wszystkie równe: ${qok ? "tak ✓" : "NIE ✗"}`, "");

// --- migracje ---
const mig = sh("git diff --name-only origin/main -- supabase/ ; git status --porcelain supabase/ | grep '^??' | cut -c4-").split("\n").filter((f) => /supabase\/skrot-v5[2-4]-.*\.sql$/.test(f));
P("## Nowe migracje", "");
if (!mig.length) P("brak (w tym etapie)", "");
for (const m of [...new Set(mig)]) P(`### ${m}`, "", "```", sh(`node scripts/funkcje-sql.mjs --nadpisane ${m.replace(/^supabase\//, "")}`).trim() || "(brak wyniku)", "```", "");

// --- nowe teksty PL bez pary EN ---
const EN = fs.readFileSync("i18n-en.js", "utf8");
const keys = new Set([...EN.matchAll(/^"((?:[^"\\]|\\.)*)":/gm)].map((m) => m[1]));
const norm = (s) => s.replace(/\$\{[^}]*\}/g, "{0}");
const has = (s) => { if (keys.has(s)) return true; let i = 0; const t = s.replace(/\{0\}/g, () => `{${i++}}`); if (keys.has(t)) return true; return false; };
const pl = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]|\b(nie|jest|dni|Masz|Kup|Wybierz|Zamknij|Włącz|Tak|Później|Zaloguj|Próba|próba|kolokwium|plan)\b/;
const plSrc = sh("git diff -U0 origin/main -- index.html skrot-supabase.js").split("\n").filter((l) => /^\+(?!\+\+)/.test(l));
for (const f of newFiles.filter((f) => /^ux-wejscie\.js$/.test(f))) for (const l of fs.readFileSync(f, "utf8").split("\n")) plSrc.push("+" + l);
for (const f of ["ux-wejscie.js"]) if (fs.existsSync(f) && !newFiles.includes(f)) for (const l of fs.readFileSync(f, "utf8").split("\n")) plSrc.push("+" + l);
const strs = new Set();
for (const l of plSrc) {
  if (/^\+\s*\/\//.test(l) || /console\.|ls\.(get|set)\(|localStorage|querySelector|class(Name)?:|aria-hidden|style:|"mock-/.test(l) && !/text:|\btext\b|, "|`/.test(l)) {}
  const code = l.replace(/\/\/.*$/, "");
  for (const m of code.matchAll(/(["`])((?:(?!\1)[^\\]|\\.)*?)\1/g)) {
    const s = m[2];
    if (s.length < 3 || !pl.test(s) || /^[a-z0-9-_.#:\[\]=" ]+$/.test(s) || /^(bm|skrot|mock|uxw|lg|ux1)-/.test(s) || /[<>{};]|=>/.test(s.replace(/\$\{[^}]*\}/g, ""))) continue;
    if (/\$\{[^}]*\?[^}]*:/.test(s)) continue; // złożone wyrażenia w szablonie – sprawdza test EN
    strs.add(norm(s));
  }
}
const brak = [...strs].filter((s) => !has(s));
P("## Nowe teksty PL bez pary EN (przybliżenie: literały z polskimi słowami w dodanych liniach)", "", brak.length ? brak.map((s) => "- „" + s + "”").join("\n") : "brak ✓", "", `(sprawdzonych literałów: ${strs.size}; teksty złożone sprawdza test Playwright w trybie EN)`);
console.log(out.join("\n"));
