-- Test naprawy znaków, część 2 (po znaki-psuj.sql i dwóch uruchomieniach naprawa-znakow.sql).
do $$
declare wzor text := 'Ň|ń[ÖáôĄÜė]|√[≥ď]'; x text;
begin
  -- Z1: żadna funkcja nie ma już zepsutych liter
  select string_agg(p.oid::regprocedure::text, ', ') into x from pg_proc p
   where p.pronamespace = 'public'::regnamespace and p.prosrc ~ wzor;
  if x is not null then raise exception 'Z1: dalej zepsute funkcje: %', x; end if;
  -- Z2: nazwy wydziału i kierunków jak w plikach
  if (select nazwa_pl from public.nauka_wydzialy where kod = 'WEFiZ') <> 'Wydział Ekonomii, Finansów i Zarządzania' then
    raise exception 'Z2: zła nazwa wydziału';
  end if;
  if (select nazwa_pl from public.nauka_kierunki where id = 'wefiz-fir-1-st') <> 'Finanse i Rachunkowość' then
    raise exception 'Z2: zła nazwa kierunku';
  end if;
  if exists (select 1 from public.nauka_kierunki where nazwa_pl ~ wzor) then raise exception 'Z2: zepsuty kierunek'; end if;
  -- Z3: drugie uruchomienie niczego nie podmieniło, a sprawdzenie jest puste
  if exists (select 1 from znaki_naprawione) then raise exception 'Z3: drugie uruchomienie coś podmieniło'; end if;
  if exists (select 1 from znaki_zostalo) then
    raise exception 'Z3: sprawdzenie nie jest puste: %', (select string_agg(co, '; ') from znaki_zostalo);
  end if;
  -- Z4: naprawiona funkcja działa i ma polskie litery (lista roczników z nazwą wydziału)
  if (select public.nauka_roczniki_lista()->0->'wydzial'->>'pl') <> 'Wydział Ekonomii, Finansów i Zarządzania' then
    raise exception 'Z4: lista roczników ma złą nazwę wydziału';
  end if;
  raise notice 'OK znaki: Z1–Z4';
end $$;
