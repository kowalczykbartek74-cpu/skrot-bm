-- Skrót BM v6: lista materiałów (widoczna także bez logowania) nie pokazuje, kto wgrał materiał.
-- Wklej w Supabase → SQL Editor → Run. Można uruchamiać wielokrotnie.
-- Kto wgrał materiał, i tak zostaje w kolumnie created_by (niewidocznej dla studentów).
update public.nauka_docs
   set data = data - 'createdBy'
 where kolekcja = 'materials' and data ? 'createdBy';

-- Bilet AI na jeden plik w „Moich materiałach”: 10 zapytań zamiast 8.
-- Plik w najgorszym razie potrzebuje 9 (mapa, opracowanie, fiszki, kontrola i poprawki), więc 8 potrafiło urwać pracę w połowie.
alter table public.nauka_ai_bilety alter column zostalo set default 10;
