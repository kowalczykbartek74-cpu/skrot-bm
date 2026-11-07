// Składa supabase/functions/stripe-webhook/index.ts + obsluga.ts w jeden plik do wklejenia w panelu Supabase
// (gdy edytor nie pozwala dodać drugiego pliku): node scripts/webhook-jeden-plik.mjs > supabase/functions/stripe-webhook/jeden-plik.ts
// Test: tests/stripe-webhook.test.js sprawdza, że jeden-plik.ts jest aktualny.
import fs from "fs";
const D = new URL("../supabase/functions/stripe-webhook/", import.meta.url).pathname;
export function jedenPlik() {
  const idx = fs.readFileSync(D + "index.ts", "utf8"), obs = fs.readFileSync(D + "obsluga.ts", "utf8");
  const imp = idx.split("\n").filter((l) => /^import /.test(l) && !l.includes("./obsluga.ts"));
  const reszta = idx.split("\n").filter((l) => !/^import /.test(l)).join("\n");
  return "// JEDEN PLIK DO WKLEJENIA w Supabase → Edge Functions → stripe-webhook → index.ts (zamiast index.ts + obsluga.ts).\n"
    + "// Wygenerowane: node scripts/webhook-jeden-plik.mjs. Nie poprawiaj ręcznie – zmieniaj index.ts i obsluga.ts.\n"
    + imp.join("\n") + "\n\n// ===== obsluga.ts =====\n" + obs + "\n// ===== index.ts =====\n" + reszta;
}
if (import.meta.url === "file://" + process.argv[1]) process.stdout.write(jedenPlik());
