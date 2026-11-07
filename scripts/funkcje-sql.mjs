// Funkcje SQL w migracjach: gdzie jest najnowsza wersja każdej (kolejność jak w supabase/test/pglite.mjs = jak na produkcji)
// i plik naprawczy dla zepsutych polskich znaków.
// Użycie:
//   node scripts/funkcje-sql.mjs                         → lista: sygnatura → plik z najnowszą wersją (PL = ma polskie litery)
//   node scripts/funkcje-sql.mjs --nadpisane skrot-v31-roczniki.sql → które funkcje z pliku mają nowszą wersję później
//   node scripts/funkcje-sql.mjs --naprawa > supabase/naprawa-znakow.sql → plik naprawczy (strażnik, nazwy, zepsute funkcje)
import fs from "fs";
const R = new URL("../supabase/", import.meta.url).pathname;

export function kolejnosc() {
  const src = fs.readFileSync(R + "test/pglite.mjs", "utf8");
  const arr = JSON.parse(src.match(/const order = (\[[^\]]*\])/)[1]);
  return [...new Set(arr.filter((f) => !f.startsWith("test/") && f !== "naprawa-znakow.sql"))];
}

// Wszystkie definicje „create [or replace] function public.X(…) … $tag$ … $tag$ …;” w tekście pliku.
// sygn = nazwa i typy argumentów, jak w to_regprocedure, np. „public.nauka_sklep_kup(text, text)”.
export function definicje(sql) {
  const out = [], re = /create\s+(?:or\s+replace\s+)?function\s+public\.([a-z0-9_]+)\s*\(/gi;
  let m;
  while ((m = re.exec(sql))) {
    const start = m.index;
    let depth = 1, i = re.lastIndex;
    for (; i < sql.length && depth; i++) { if (sql[i] === "(") depth++; else if (sql[i] === ")") depth--; }
    const args = sql.slice(re.lastIndex, i - 1);
    const tagM = /\$[A-Za-z_]*\$/.exec(sql.slice(i));
    if (!tagM) break;
    const tag = tagM[0], bodyStart = i + tagM.index + tag.length;
    const close = sql.indexOf(tag, bodyStart);
    if (close < 0) break;
    const semi = sql.indexOf(";", close + tag.length);
    const end = semi < 0 ? sql.length : semi + 1;
    const nazwa = m[1].toLowerCase();
    out.push({ nazwa, sygn: `public.${nazwa}(${typy(args).join(", ")})`, tekst: sql.slice(start, end), cialo: sql.slice(bodyStart, close) });
    re.lastIndex = end;
  }
  return out;
}

// „p_kod text, p_n int default 3, out x jsonb” → ["text", "int"] (bez wartości domyślnych i parametrów out).
export function typy(args) {
  const parts = [];
  let depth = 0, cur = "";
  for (const ch of args) {
    if (ch === "(") depth++; else if (ch === ")") depth--;
    if (ch === "," && !depth) { parts.push(cur); cur = ""; } else cur += ch;
  }
  if (cur.trim()) parts.push(cur);
  const out = [];
  for (let p of parts) {
    p = p.replace(/\s+(default\s|=)[\s\S]*$/i, "").trim().replace(/\s+/g, " ");
    let w = p.split(" ");
    if (/^(in|out|inout|variadic)$/i.test(w[0])) { if (/^out$/i.test(w[0])) continue; w = w.slice(1); }
    out.push((w.length > 1 ? w.slice(1) : w).join(" ").toLowerCase());
  }
  return out;
}

// Najnowsza wersja każdej sygnatury (stare przeciążenia, których nikt nie usunął, też tu są).
export function najnowsze(doPliku = null) {
  const map = new Map(), kol = kolejnosc();
  const lista = doPliku ? kol.slice(0, kol.indexOf(doPliku) + 1) : kol;
  if (doPliku && !kol.includes(doPliku)) throw new Error("Nie ma pliku w kolejce: " + doPliku);
  for (const f of lista) for (const d of definicje(fs.readFileSync(R + f, "utf8"))) map.set(d.sygn, { ...d, plik: f });
  return map;
}

export const STRAZNIK = fs.readFileSync(R + "straznik-kodowania.sql", "utf8").trim();
const SPRAWDZ = fs.readFileSync(R + "sprawdz-znaki.sql", "utf8");
const PL = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;
// Tak wyglądają polskie litery po złym schowku (UTF-8 czytane jako Mac Central European): ł → „Ňā”, ą → „ńÖ”, ó → „√≥”.
export const ZEPSUTE = "Ň|ń[ÖáôĄÜė]|√[≥ď]";
// Migracje, które mogły jeszcze nie być uruchomione na produkcji: ich funkcji nie podmieniamy (zepsute pokaże sprawdzenie).
// Ostatnia migracja uruchomiona na produkcji: plik naprawczy bierze funkcje tylko do niej (gdyby wziął z v44+, a naprawę
// uruchomiono przed v44, funkcja odwołałaby się do kolumn, których jeszcze nie ma). Przesuń razem z NA_PRODUKCJI w pglite.mjs.
export const NA_PRODUKCJI = "skrot-v43-lekcja-dnia.sql";
export const CZEKA = ["skrot-v33-retencja.sql", "skrot-v41-riwiera.sql", "skrot-v42-jachtklub.sql"];

const bezSrednika = (t) => t.replace(/;\s*$/, "");
function bezpieczny(t, zakazane) { for (const z of zakazane) if (t.includes(z)) throw new Error("Tekst zawiera " + z); return t; }

// Plik naprawczy: strażnik → nazwy wydziału i kierunków → każda funkcja z polskimi literami, ale tylko jeśli na tej
// bazie jest zepsuta (wtedy jej najnowsza wersja z repo) → na końcu to samo co sprawdz-znaki.sql.
export function naprawa() {
  const naj = najnowsze(NA_PRODUKCJI), out = [];
  out.push(`-- Skrót: naprawa zepsutych polskich znaków w bazie (wygenerowane: node scripts/funkcje-sql.mjs --naprawa).
-- Wklej w Supabase → SQL Editor → Run. Kopiuj z github.com (przycisk „Copy raw file”), nie przez Terminal.
-- Można uruchamiać wiele razy. Funkcję podmienia tylko wtedy, gdy ta w bazie ma zepsute litery (wtedy na najnowszą wersję
-- z repo), więc niczego, co działa, nie cofa. Na końcu lista: co naprawiono i co dalej jest zepsute.
`);
  out.push(STRAZNIK, "");
  out.push(`create temp table if not exists znaki_naprawione (co text);\ntruncate znaki_naprawione;\n`);
  // wydział i kierunek BM jak w v31 (tam „on conflict do update” poprawia nazwy)
  const v31 = fs.readFileSync(R + "skrot-v31-roczniki.sql", "utf8");
  for (const tab of ["nauka_wydzialy", "nauka_kierunki"]) {
    const m = v31.match(new RegExp(`insert into public\\.${tab} [\\s\\S]*?;`));
    if (!m) throw new Error("Nie ma wpisu " + tab + " w v31");
    out.push(`-- ${tab}: jak w skrot-v31-roczniki.sql\n${m[0]}\n`);
  }
  // nazwy kierunków z v34 (tam „on conflict” nie zmienia nazw, więc ponowne v34 by ich nie poprawiło)
  const v34 = fs.readFileSync(R + "skrot-v34-oczekujacy.sql", "utf8");
  const rows = [...v34.matchAll(/\('(wefiz-[a-z0-9]+-[012]-(?:st|nst))', 'WEFiZ', '[A-Z]+', '([^']+)'/g)].map((x) => `('${x[1]}', '${x[2]}')`);
  if (rows.length < 20) throw new Error("Za mało kierunków z v34: " + rows.length);
  out.push(`-- nazwy kierunków jak w skrot-v34-oczekujacy.sql (${rows.length})
update public.nauka_kierunki k set nazwa_pl = v.nazwa
  from (values
    ${rows.join(",\n    ")}) v(id, nazwa)
 where k.id = v.id and k.nazwa_pl ~ '${ZEPSUTE}';
`);
  let n = 0;
  for (const [sygn, d] of [...naj].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (!PL.test(d.cialo) || CZEKA.includes(d.plik)) continue;
    n++;
    out.push(`-- ${sygn}: ${d.plik}
do $napraw$ begin
  if to_regprocedure('${sygn}') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('${sygn}') and p.prosrc ~ '${ZEPSUTE}') then
    execute $tresc$${bezpieczny(bezSrednika(d.tekst), ["$tresc$", "$napraw$"])}$tresc$;
    insert into znaki_naprawione values ('${sygn} (${d.plik})');
  end if;
end $napraw$;
`);
  }
  const s = SPRAWDZ.indexOf("-- SPRAWDZENIE-START"), e = SPRAWDZ.indexOf("-- SPRAWDZENIE-KONIEC");
  if (s < 0 || e < 0) throw new Error("sprawdz-znaki.sql bez znaczników SPRAWDZENIE-START/KONIEC");
  out.push(SPRAWDZ.slice(s, e).trim());
  out.push(`
select 'naprawiono: ' || co as wynik from znaki_naprawione
union all select 'ZOSTAŁO: ' || co from znaki_zostalo;
`);
  return { sql: out.join("\n"), funkcje: n };
}

if (import.meta.url === "file://" + process.argv[1]) {
  const [, , opt, arg] = process.argv;
  const naj = najnowsze();
  if (opt === "--nadpisane") {
    if (!kolejnosc().includes(arg)) { console.error("Nie ma pliku w kolejce: " + arg); process.exit(1); }
    for (const d of definicje(fs.readFileSync(R + arg, "utf8"))) {
      const x = naj.get(d.sygn);
      if (x.plik !== arg) console.log(`${d.sygn}: nowsza wersja w ${x.plik}`);
    }
  } else if (opt === "--naprawa") {
    process.stdout.write(naprawa().sql);
  } else {
    for (const [sygn, d] of [...naj].sort((a, b) => a[0].localeCompare(b[0]))) console.log(`${sygn}\t${d.plik}\t${PL.test(d.cialo) ? "PL" : ""}`);
  }
}
