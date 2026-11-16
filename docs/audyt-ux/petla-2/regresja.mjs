// Testy przed commitem pętli UX-2 (A4 pkt 8): node --test, PGlite, node --check zmienionych JS, istniejące testy Playwright
// (h2-*.mjs i te, które dotykają serii, celu dnia, Dziś, przypomnień, paczki, kalendarza) + testy etapów ux2-etap*.mjs.
// BASE=http://127.0.0.1:8812/ node docs/audyt-ux/petla-2/regresja.mjs [--szybko] > log
// Wynik: tabela plik → ✓/✗ i liczba; kod wyjścia 1 przy czerwonym teście.
import { spawn, execSync } from "child_process";
import fs from "fs";
const ROOT = new URL("../../../", import.meta.url).pathname;
const BASE = process.env.BASE || "http://127.0.0.1:8812/";
const T = "docs/gry/test/";
const PW = [
  ...fs.readdirSync(ROOT + T).filter((f) => /^h2-etap\d+\.mjs$/.test(f)).map((f) => T + f),
  T + "poziomy.mjs", T + "scalenie-zdawalni.mjs", T + "lekcja-dnia.mjs", T + "lekcja-dnia-3.mjs", T + "lekcja-dnia-4.mjs", T + "lekcja-dnia-5.mjs", T + "lekcja-dnia-6.mjs",
  T + "przypomnienia.mjs", T + "paczka.mjs", T + "dzien.mjs", T + "po-zajeciach.mjs", T + "przygotuj-sie.mjs", T + "kopie.mjs", T + "smoke.mjs",
  "docs/kosmetyki/test/etap4.mjs", "docs/kosmetyki/test/podglad.mjs",
  ...fs.readdirSync(ROOT + T).filter((f) => /^ux2-etap\d+\.mjs$/.test(f)).sort().map((f) => T + f),
].filter((f) => fs.existsSync(ROOT + f));
const run = (cmd, args, ms = 900000) => new Promise((res) => {
  const t0 = Date.now(), ch = spawn(cmd, args, { cwd: ROOT, env: { ...process.env, BASE, OUT: "/tmp/ux-2", RUNDA: "" } });
  let out = ""; ch.stdout.on("data", (d) => (out += d)); ch.stderr.on("data", (d) => (out += d));
  const k = setTimeout(() => { ch.kill("SIGKILL"); out += "\nTIMEOUT"; }, ms);
  ch.on("close", (code) => { clearTimeout(k); res({ code, out, s: Math.round((Date.now() - t0) / 1000) }); });
});
const wyniki = [];
const node = await run("node", ["--test", ...fs.readdirSync(ROOT + "tests").filter((f) => f.endsWith(".test.js")).map((f) => "tests/" + f)]);
const nm = node.out.match(/ℹ pass (\d+)[\s\S]*?ℹ fail (\d+)/);
wyniki.push({ f: "node --test tests/*.test.js", code: node.code, ok: nm ? +nm[1] : 0, zle: nm ? +nm[2] : 1, out: node.out });
const pg = await run("node", ["supabase/test/pglite.mjs"]);
wyniki.push({ f: "node supabase/test/pglite.mjs", code: pg.code, ok: (pg.out.match(/^✓/gm) || []).length, zle: (pg.out.match(/^✗/gm) || []).length + (pg.code ? 1 : 0), out: pg.out });
const changed = execSync("git diff --name-only origin/main -- '*.js' ; git ls-files --others --exclude-standard -- '*.js'", { cwd: ROOT, encoding: "utf8" }).split("\n").filter((f) => f && fs.existsSync(ROOT + f));
for (const f of changed) { const r = await run("node", ["--check", f]); wyniki.push({ f: "node --check " + f, code: r.code, ok: r.code ? 0 : 1, zle: r.code ? 1 : 0, out: r.out }); }
const kolejka = process.argv.includes("--szybko") ? PW.filter((f) => /ux2-|h2-etap(3|1)\b/.test(f)) : PW.slice();
const N = 3;
await Promise.all(Array.from({ length: N }, async () => {
  while (kolejka.length) {
    const f = kolejka.shift();
    const r = await run("node", [f]);
    const ok = (r.out.match(/^✓/gm) || []).length, zle = (r.out.match(/^✗/gm) || []).length;
    wyniki.push({ f, code: r.code, ok, zle: zle + (r.code && !zle ? 1 : 0), s: r.s, out: r.out });
    console.error(`${r.code || zle ? "✗" : "✓"} ${f} (${ok}/${ok + zle}, ${r.s}s)`);
  }
}));
const zle = wyniki.filter((w) => w.code || w.zle);
console.log("| test | ✓ | ✗ | kod |\n|---|---|---|---|");
for (const w of wyniki) console.log(`| ${w.f} | ${w.ok} | ${w.zle} | ${w.code} |`);
console.log(`\nRazem: ${wyniki.reduce((a, w) => a + w.ok, 0)} ✓, ${wyniki.reduce((a, w) => a + w.zle, 0)} ✗`);
for (const w of zle) console.log(`\n### ✗ ${w.f}\n\`\`\`\n${w.out.split("\n").filter((l) => /^✗|Error|TIMEOUT|not ok|✖/.test(l)).slice(0, 25).join("\n")}\n\`\`\``);
process.exit(zle.length ? 1 : 0);
