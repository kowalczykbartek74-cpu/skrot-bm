-- Test naprawy znaków, część 1: psujemy bazę tak jak na produkcji 7.11.2026 (UTF-8 czytane jako Mac Central European:
-- ł → „Ňā”, ą → „ńÖ”, ó → „√≥”). Potem pglite.mjs uruchamia naprawa-znakow.sql dwa razy i test/znaki.sql.
create function pg_temp.psuj(t text) returns text language sql immutable as $$
  select string_agg(coalesce(m.z, s.c), '' order by s.n)
    from regexp_split_to_table(t, '') with ordinality s(c, n)
    left join (values ('ą','ńÖ'),('ć','ńá'),('ę','ńô'),('ł','Ňā'),('ń','ŇĄ'),('ó','√≥'),('ś','Ňõ'),('ź','Ňļ'),('ż','Ňľ'),
                      ('Ą','ńĄ'),('Ć','ńÜ'),('Ę','ńė'),('Ł','ŇĀ'),('Ń','ŇÉ'),('Ó','√ď'),('Ś','Ňö'),('Ź','ŇĻ'),('Ż','ŇĽ')) m(p, z)
      on m.p = s.c
$$;

do $$
declare f record; n int := 0;
begin
  if pg_temp.psuj('Wydział Ekonomii, Finansów i Zarządzania') <> 'WydziaŇā Ekonomii, Finans√≥w i ZarzńÖdzania' then
    raise exception 'psuj() nie odtwarza napisu z produkcji: %', pg_temp.psuj('Wydział Ekonomii, Finansów i Zarządzania');
  end if;
  -- wszystkie funkcje z polskimi literami poza tymi z migracji, które mogą czekać (CZEKA w scripts/funkcje-sql.mjs)
  for f in select p.oid from pg_proc p
            where p.pronamespace = 'public'::regnamespace and p.prosrc ~ '[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]'
              and p.proname not in ('nauka_retencja', 'nauka_sklep_katalog') loop
    execute pg_temp.psuj(pg_get_functiondef(f.oid));
    n := n + 1;
  end loop;
  if n < 30 then raise exception 'Za mało zepsutych funkcji: %', n; end if;
  update public.nauka_wydzialy set nazwa_pl = pg_temp.psuj(nazwa_pl);
  update public.nauka_kierunki set nazwa_pl = pg_temp.psuj(nazwa_pl) where wydzial = 'WEFiZ';
  if not exists (select 1 from public.nauka_kierunki where nazwa_pl ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    raise exception 'Nazwy kierunków się nie zepsuły';
  end if;
  raise notice 'OK znaki-psuj: zepsute funkcje: %', n;
end $$;
