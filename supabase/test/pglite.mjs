// Testy bazy bez instalowania Postgresa: PGlite (Postgres w Node).
// Uruchom z katalogu z @electric-sql/pglite@0.2 w node_modules:  node supabase/test/pglite.mjs
// Błąd v12 o limit_wpisow() jest oczekiwany (funkcja z repo plan-bm). Na końcu muszą być „✓ test/v13.sql”, „✓ test/v15.sql”,
// „✓ test/v14.sql”, „✓ test/v16.sql”, „✓ test/v17.sql”, „✓ test/v18.sql” „✓ test/v22.sql” i „✓ test/v24.sql”, „✓ test/v25.sql”, „✓ test/v26.sql”, „✓ test/v27.sql”, „✓ test/v28.sql”, „✓ test/v29.sql”, „✓ test/v30.sql”, „✓ test/v31.sql”.
// Kolejność jak na produkcji: …, v13, v15 (już są w bazie), potem v14-monety, v16-proba i v17-polecenia (każdy dwa razy = ponowne uruchomienie).
import { PGlite } from "@electric-sql/pglite";

import fs from "fs";
import { createRequire } from "module";
const R = new URL("../", import.meta.url).pathname;
const order = ["test/stub.sql","nauka.sql","skrot.sql","skrot-platnosci.sql","skrot-darmowe.sql","skrot-v2.sql","skrot-v3.sql","skrot-v4-moje.sql","skrot-v5.sql","skrot-v6.sql","skrot-v7-subskrypcja.sql","skrot-kalendarz.sql","skrot-v8-urzadzenia.sql","skrot-v9-limit-moje.sql","skrot-v10-zgody.sql","skrot-v11-aktywnosc.sql","skrot-v12-zabezpieczenia.sql","skrot-v13-gry.sql","skrot-v13-gry.sql","skrot-v15-gry2.sql","skrot-v15-gry2.sql","skrot-v14-monety.sql","skrot-v14-monety.sql","skrot-v16-proba.sql","skrot-v16-proba.sql","skrot-v17-polecenia.sql","skrot-v17-polecenia.sql","test/v13.sql","test/v15.sql","test/v14.sql","test/v16.sql","test/v17.sql","skrot-v18-imie-polecajacego.sql","skrot-v18-imie-polecajacego.sql","test/v18.sql","skrot-v20-jednorozec.sql","skrot-v21-nokturn.sql","skrot-v22-monety-widoczne.sql","skrot-v22-monety-widoczne.sql","test/v22.sql","skrot-v24-kosmetyki.sql","skrot-v24-kosmetyki.sql","test/v24.sql","skrot-v25-ocena-ai.sql","skrot-v25-ocena-ai.sql","test/v25.sql","skrot-v26-odwolania.sql","skrot-v26-odwolania.sql","test/v26.sql","skrot-v27-kalendarz-moje.sql","skrot-v27-kalendarz-moje.sql","test/v27.sql","skrot-v28-zdarzenia-nauki.sql","skrot-v28-zdarzenia-nauki.sql","test/v28.sql","skrot-v29-powtorki.sql","skrot-v29-powtorki.sql","test/v29.sql","skrot-v30-profil.sql","skrot-v30-profil.sql","test/v30.sql","skrot-v31-roczniki.sql","skrot-v31-roczniki.sql","test/v31.sql","skrot-v32-usun-konto.sql","skrot-v32-usun-konto.sql","test/v32.sql","skrot-v33-retencja.sql","skrot-v33-retencja.sql","test/v33.sql","skrot-v34-oczekujacy.sql","skrot-v34-oczekujacy.sql","test/v34.sql","skrot-v35-lejek.sql","skrot-v35-lejek.sql","test/v35.sql","skrot-v36-przypomnienia.sql","skrot-v36-przypomnienia.sql","test/v36.sql","skrot-v37-paczka.sql","skrot-v37-paczka.sql","test/v37.sql","skrot-v38-admin.sql","skrot-v38-admin.sql","test/v38.sql","skrot-v39-zdjecie.sql","skrot-v39-zdjecie.sql","test/v39.sql","skrot-v40-importy.sql","skrot-v40-importy.sql","test/v40.sql","skrot-v41-riwiera.sql","skrot-v42-jachtklub.sql","skrot-v43-lekcja-dnia.sql","skrot-v43-lekcja-dnia.sql","test/v43.sql","test/v44-przed.sql","skrot-v44-roczniki-tresci.sql","skrot-v44-roczniki-tresci.sql","test/v44.sql","test/v45-przed.sql","skrot-v45-dostep-rocznik.sql","skrot-v45-dostep-rocznik.sql","test/v45.sql","test/v46-przed.sql","skrot-v46-roczniki-plan-ranking.sql","skrot-v46-roczniki-plan-ranking.sql","test/v46.sql","skrot-v47-zarz26.sql","skrot-v47-zarz26.sql","test/v47.sql","skrot-v48-fir26.sql","skrot-v48-fir26.sql","test/v48.sql","skrot-v49-roczniki-dane.sql","skrot-v49-roczniki-dane.sql","test/v49.sql","skrot-v50-plan-zdawalni.sql","skrot-v50-plan-zdawalni.sql","test/v50.sql"];
// Naprawa znaków: zaraz po ostatniej migracji z produkcji (NA_PRODUKCJI, jak w scripts/funkcje-sql.mjs) psujemy polskie litery
// jak na produkcji 7.11.2026 i naprawiamy (2×). Nowe migracje dopisuj do order wyżej; tu przesuwasz tylko NA_PRODUKCJI.
const NA_PRODUKCJI = "skrot-v43-lekcja-dnia.sql";
order.splice(order.indexOf("test/" + NA_PRODUKCJI.match(/^skrot-(v\d+)/)[1] + ".sql") + 1, 0, "test/znaki-psuj.sql", "naprawa-znakow.sql", "naprawa-znakow.sql", "test/znaki.sql");
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

// Każdy rocznik ze strony (rocznik.js + roczniki-dane.js) przechodzi „Dodaj do bazy” (v49) jako administrator, dwa razy,
// i jest potem na liście roczników z adresem planu: nowy kierunek bez migracji jest sprawdzony od razu (optymalizacja nr 10).
{
  const RJ = createRequire(import.meta.url)("../../rocznik.js");
  await db.exec("select test.jako('adm49@x.pl'); set role authenticated;");
  let zle = 0;
  for (const id of Object.keys(RJ.ROCZNIKI)) {
    for (const raz of [1, 2]) {
      const x = (await db.query("select public.nauka_admin_rocznik_zapisz($1::jsonb) as x", [JSON.stringify(RJ.doBazy(id))])).rows[0].x;
      if (!x.ok || (raz === 2 && x.nowy)) { zle++; console.log("    ✗", id, raz, JSON.stringify(x)); }
    }
  }
  await db.exec("reset role;");
  const lista = (await db.query("select public.nauka_roczniki_lista() as l")).rows[0].l;
  for (const id of Object.keys(RJ.ROCZNIKI)) {
    const r = lista.find((e) => e.id === id), plan = RJ.ROCZNIKI[id].plan.json;
    if (!r || r.plan_url !== plan) { zle++; console.log("    ✗ lista roczników", id, r?.plan_url, "≠", plan); }
  }
  if (zle) { console.log("✗ roczniki ze strony → v49"); process.exit(1); }
  console.log("✓ roczniki ze strony → v49:", Object.keys(RJ.ROCZNIKI).length, "(2× każdy, adres planu jak w rocznik.js)");
}
// Strażnik kodowania (supabase/straznik-kodowania.sql, na początku każdej migracji od v44): dobry plik przechodzi,
// plik po złym schowku (UTF-8 czytane jako Mac Central European, jak na produkcji 7.11.2026) zatrzymuje się i nic nie tworzy.
{
  const guard = fs.readFileSync(R + "straznik-kodowania.sql", "utf8");
  const MAC_CE = { "ą":"ńÖ","ć":"ńá","ę":"ńô","ł":"Ňā","ń":"ŇĄ","ó":"√≥","ś":"Ňõ","ź":"Ňļ","ż":"Ňľ","Ą":"ńĄ","Ć":"ńÜ","Ę":"ńė","Ł":"ŇĀ","Ń":"ŇÉ","Ó":"√ď","Ś":"Ňö","Ź":"ŇĻ","Ż":"ŇĽ" };
  const psuj = (t) => [...t].map((c) => MAC_CE[c] || c).join("");
  const plik = guard + "\ncreate table public.po_strazniku (x int);\n";
  const g = new PGlite();
  await g.exec(plik);
  if (!(await g.query("select to_regclass('public.po_strazniku') is not null as ok")).rows[0].ok) { console.log("✗ strażnik: dobry plik nie przeszedł"); process.exit(1); }
  await g.exec("drop table public.po_strazniku");
  let stop = null;
  try { await g.exec(psuj(plik)); } catch (e) { stop = e.message; }
  const zostal = (await g.query("select to_regclass('public.po_strazniku') is not null as ok")).rows[0].ok;
  if (!stop || !/zepsute/.test(stop) || zostal) { console.log("✗ strażnik: zepsuty plik nie został zatrzymany", stop, zostal); process.exit(1); }
  console.log("✓ strażnik kodowania: dobry plik przechodzi, zepsuty zatrzymany (" + stop.slice(0, 40) + "…)");
}
