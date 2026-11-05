// Wpisuje kierunki z supabase/kierunki-wefiz.json (scripts/kierunki-wefiz.mjs) do SQL v34 między znacznikami
// KIERUNKI-START / KIERUNKI-KONIEC. Uruchom po pobraniu listy:  node scripts/kierunki-sql.mjs
import fs from "node:fs";
const J = JSON.parse(fs.readFileSync(new URL("../supabase/kierunki-wefiz.json", import.meta.url), "utf8"));
const P = new URL("../supabase/skrot-v34-oczekujacy.sql", import.meta.url);
const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";
const rows = J.kierunki.map((k) => `  (${q(`wefiz-${k.kod.toLowerCase()}-${k.stopien}-${J.tryb}`)}, 'WEFiZ', ${q(k.kod)}, ${q(k.nazwa)}, ${k.stopien}, ${q(J.tryb)}, array[${k.lata.join(", ")}]::smallint[], true)`);
const blok = `-- KIERUNKI-START (${J.zrodlo}, pobrano ${J.pobrano}, ${J.kierunki.length} pozycji: kierunek + stopień)
insert into public.nauka_kierunki (id, wydzial, kod, nazwa_pl, stopien, tryb, lata, zapisy) values
${rows.join(",\n")}
on conflict (id) do update set lata = excluded.lata, zapisy = true;
-- Kierunek, którego uczelnia już nie ma w planach, znika z listy wyboru (zapisy zostają).
update public.nauka_kierunki set zapisy = false where wydzial = 'WEFiZ' and tryb = ${q(J.tryb)} and id not in (${J.kierunki.map((k) => q(`wefiz-${k.kod.toLowerCase()}-${k.stopien}-${J.tryb}`)).join(", ")});
-- KIERUNKI-KONIEC`;
const s = fs.readFileSync(P, "utf8");
const a = s.indexOf("-- KIERUNKI-START"), b = s.indexOf("-- KIERUNKI-KONIEC");
if (a < 0 || b < 0) throw new Error("Brak znaczników KIERUNKI-START/KONIEC w v34.");
fs.writeFileSync(P, s.slice(0, a) + blok + s.slice(b + "-- KIERUNKI-KONIEC".length));
console.log("Wpisano", J.kierunki.length, "pozycji do", P.pathname);
