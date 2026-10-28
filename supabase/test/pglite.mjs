// Testy bazy bez instalowania Postgresa: PGlite (Postgres w Node).
// Uruchom z katalogu z @electric-sql/pglite@0.2 w node_modules:  node supabase/test/pglite.mjs
// Błąd v12 o limit_wpisow() jest oczekiwany (funkcja z repo plan-bm). Na końcu muszą być „✓ test/v13.sql” i „✓ test/v15.sql”.
import { PGlite } from "@electric-sql/pglite";

import fs from "fs";
const R = new URL("../", import.meta.url).pathname;
const order = ["test/stub.sql","nauka.sql","skrot.sql","skrot-platnosci.sql","skrot-darmowe.sql","skrot-v2.sql","skrot-v3.sql","skrot-v4-moje.sql","skrot-v5.sql","skrot-v6.sql","skrot-v7-subskrypcja.sql","skrot-kalendarz.sql","skrot-v8-urzadzenia.sql","skrot-v9-limit-moje.sql","skrot-v10-zgody.sql","skrot-v11-aktywnosc.sql","skrot-v12-zabezpieczenia.sql","skrot-v13-gry.sql","skrot-v13-gry.sql","skrot-v15-gry2.sql","skrot-v15-gry2.sql","test/v13.sql","test/v15.sql"];
const db = new PGlite();
// PGlite nie ma pgcrypto: zamienniki dwóch funkcji, których używają migracje
await db.exec(`create schema if not exists extensions;
create function extensions.gen_random_bytes(n int) returns bytea language sql as $$ select substring(decode(md5(random()::text) || md5(random()::text), 'hex') from 1 for n) $$;
create function extensions.digest(t text, a text) returns bytea language sql as $$ select sha256(convert_to(t, 'utf8')) $$;`);
for (const f of order) {
  const sql = fs.readFileSync(R + f, "utf8").replace("create schema extensions;", "").replace(/create extension[^;]*pgcrypto[^;]*;/gi, "").replace(/^notify pgrst.*$/gm, "");
  try {
    const res = await db.exec(sql, { onNotice: (n) => /^(OK|WSZYSTKIE)/.test(n.message) && console.log("   ", n.message) });
    console.log("✓", f);
  } catch (e) { console.log("✗", f, "→", e.message.slice(0, 300)); if (f.startsWith("test/")) process.exit(1); }
}
