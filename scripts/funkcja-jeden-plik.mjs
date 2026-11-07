// Skleja funkcję Edge z lokalnymi importami („./plik.ts”) w jeden plik do wklejenia w panelu Supabase, gdy edytor nie pozwala
// dodać drugiego pliku: node scripts/funkcja-jeden-plik.mjs grade-open > supabase/functions/grade-open/jeden-plik.ts
// Test aktualności: tests/grade-open.test.js. (stripe-webhook ma własny skrypt webhook-jeden-plik.mjs.)
import fs from "fs";
export function jedenPlik(nazwa) {
  const D = new URL(`../supabase/functions/${nazwa}/`, import.meta.url).pathname;
  const idx = fs.readFileSync(D + "index.ts", "utf8").split("\n");
  const lokalne = idx.filter((l) => /^import .* from "\.\/[a-z-]+\.ts";$/.test(l)).map((l) => l.match(/"\.\/([a-z-]+\.ts)"/)[1]);
  const obce = idx.filter((l) => /^import /.test(l) && !/from "\.\//.test(l));
  const reszta = idx.filter((l) => !/^import /.test(l)).join("\n");
  const czesci = lokalne.map((f) => {
    const t = fs.readFileSync(D + f, "utf8");
    if (/^import /m.test(t)) throw new Error(f + " ma własne importy");
    return `// ===== ${f} =====\n` + t;
  });
  return `// JEDEN PLIK DO WKLEJENIA w Supabase → Edge Functions → ${nazwa} → index.ts (zamiast index.ts + ${lokalne.join(" + ")}).\n`
    + "// Wygenerowane: node scripts/funkcja-jeden-plik.mjs " + nazwa + ". Nie poprawiaj ręcznie.\n"
    + obce.join("\n") + "\n\n" + czesci.join("\n") + "\n// ===== index.ts =====\n" + reszta;
}
if (import.meta.url === "file://" + process.argv[1]) process.stdout.write(jedenPlik(process.argv[2]));
