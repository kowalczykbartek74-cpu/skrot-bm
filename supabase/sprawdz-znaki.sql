-- Skrót: gdzie w bazie są zepsute polskie znaki (tylko odczyt; tabela tymczasowa znika po rozłączeniu).
-- Wklej w Supabase → SQL Editor → Run. Kopiuj z github.com (przycisk „Copy raw file”), nie przez Terminal.
-- Szuka w funkcjach i we wszystkich kolumnach tekstowych tabel public. Pusty wynik = wszystko dobrze.
-- Zepsute litery wyglądają tak: ł → „Ňā”, ą → „ńÖ”, ó → „√≥” (UTF-8 czytane jako Mac Central European).

do $$ begin
  if 'ąćęłńóśźż' <> U&'\0105\0107\0119\0142\0144\00F3\015B\017A\017C' then
    raise exception 'Polskie znaki doszły zepsute. Skopiuj plik z github.com (Raw), nie przez Terminal.';
  end if;
end $$;

-- SPRAWDZENIE-START
create temp table if not exists znaki_zostalo (co text);
truncate znaki_zostalo;
do $sprawdz$
declare c record; n bigint; wzor text := 'Ň|ń[ÖáôĄÜė]|√[≥ď]';
begin
  for c in select p.oid::regprocedure::text s from pg_proc p
            where p.pronamespace = 'public'::regnamespace and p.prosrc ~ wzor order by 1 loop
    insert into znaki_zostalo values ('funkcja ' || c.s);
  end loop;
  for c in select col.table_name t, col.column_name k
             from information_schema.columns col
             join information_schema.tables tb on tb.table_schema = col.table_schema and tb.table_name = col.table_name
            where col.table_schema = 'public' and tb.table_type = 'BASE TABLE'
              and col.data_type in ('text', 'jsonb', 'json', 'character varying', 'ARRAY')
            order by 1, 2 loop
    execute format('select count(*) from public.%I where %I::text ~ $1', c.t, c.k) into n using wzor;
    if n > 0 then insert into znaki_zostalo values ('tabela ' || c.t || '.' || c.k || ': ' || n || ' wierszy'); end if;
  end loop;
end $sprawdz$;
-- SPRAWDZENIE-KONIEC

select co as "zepsute polskie znaki (pusto = dobrze)" from znaki_zostalo;
