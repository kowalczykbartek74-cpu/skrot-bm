// Migracje SQL: strażnik kodowania na początku każdej nowej migracji (od v44) i aktualny plik naprawczy.
// node --test tests/*.test.js   (sam PGlite: node supabase/test/pglite.mjs)
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

const SB = path.join(__dirname, "..", "supabase");
const STRAZNIK = fs.readFileSync(path.join(SB, "straznik-kodowania.sql"), "utf8");
// sam blok „do $$ … end $$;” bez komentarzy nad nim
const BLOK = STRAZNIK.slice(STRAZNIK.indexOf("do $$")).trim();
const bezKomentarzy = (sql) => sql.split("\n").filter((l) => !/^\s*--/.test(l) && l.trim()).join("\n");

test("strażnik: polskie litery wprost i jako kody to te same znaki", () => {
  const m = BLOK.match(/if '([^']+)' <> U&'([^']+)'/);
  assert.ok(m, "brak warunku w strażniku");
  const zKodow = m[2].replace(/\\([0-9A-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  assert.strictEqual(m[1], "ąćęłńóśźż");
  assert.strictEqual(zKodow, m[1]);
  assert.ok(/^[\x00-\x7f]*$/.test(m[2]), "kody muszą być samym ASCII");
});

test("każda migracja od v44 zaczyna się strażnikiem kodowania", () => {
  const pliki = fs.readdirSync(SB).filter((f) => /^skrot-v(\d+)-.*\.sql$/.test(f) && +f.match(/^skrot-v(\d+)/)[1] >= 44);
  for (const f of pliki) {
    const sql = bezKomentarzy(fs.readFileSync(path.join(SB, f), "utf8"));
    assert.ok(sql.startsWith(BLOK), `${f}: pierwszą instrukcją musi być blok z supabase/straznik-kodowania.sql`);
  }
});

test("pliki do ręcznego uruchomienia mają strażnika", () => {
  for (const f of ["naprawa-znakow.sql", "sprawdz-znaki.sql"]) {
    assert.ok(bezKomentarzy(fs.readFileSync(path.join(SB, f), "utf8")).startsWith(BLOK), f);
  }
});

test("naprawa-znakow.sql jest aktualna (node scripts/funkcje-sql.mjs --naprawa > supabase/naprawa-znakow.sql)", async () => {
  const { naprawa } = await import("../scripts/funkcje-sql.mjs");
  const { sql, funkcje } = naprawa();
  assert.ok(funkcje >= 30, "za mało funkcji z polskimi literami: " + funkcje);
  assert.strictEqual(fs.readFileSync(path.join(SB, "naprawa-znakow.sql"), "utf8"), sql);
});

test("funkcje-sql: sygnatury jak w to_regprocedure", async () => {
  const { typy, definicje } = await import("../scripts/funkcje-sql.mjs");
  assert.deepStrictEqual(typy("p_kod text, p_n int default 3, out x jsonb"), ["text", "int"]);
  assert.deepStrictEqual(typy("p_do date = current_date, p_x numeric(5, 2)"), ["date", "numeric(5, 2)"]);
  assert.deepStrictEqual(typy(""), []);
  const d = definicje("create or replace function public.f(a text, b text default 'x') returns int language sql as $q$ select 1 $q$;\nselect 2;");
  assert.strictEqual(d.length, 1);
  assert.strictEqual(d[0].sygn, "public.f(text, text)");
  assert.ok(d[0].tekst.endsWith("$q$;"));
});
