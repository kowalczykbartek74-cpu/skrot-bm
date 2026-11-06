-- Skrót BM v42: motyw „Jachtklub” (granat na kremowym papierze) w sklepie: za darmo od poziomu 14
-- (sprawdza przeglądarka, KLUB_LEVEL w index.html) albo wcześniej za 1400 monet.
-- Bez tego pliku karta w sklepie pokazuje tylko „za darmo od poziomu 14”, a kupić się nie da.
-- Dokłada jedną pozycję do obecnego katalogu (nie przepisuje reszty), więc działa na każdej wersji katalogu od v24.
-- Uruchom w Supabase → SQL Editor (kolejność z v41 dowolna). Można uruchomić ponownie (drugi raz nic nie zmieni).

do $do$
declare
  kat jsonb := public.nauka_sklep_katalog();
  poz jsonb := '{"id":"motyw:klub", "kat":"motywy", "typ":"motyw", "theme":"klub", "cena":1400, "poziom":14, "pl":"Jachtklub", "en":"Yacht Club"}'::jsonb;
  i int; za int := 0;
begin
  if kat @> jsonb_build_array(jsonb_build_object('id', 'motyw:klub')) then
    raise notice 'Jachtklub już jest w katalogu';
    return;
  end if;
  -- wstawiamy zaraz za ostatnim motywem, żeby kolejność w sklepie była jak w index.html
  for i in 0 .. jsonb_array_length(kat) - 1 loop
    if kat -> i ->> 'typ' = 'motyw' then za := i + 1; end if;
  end loop;
  kat := jsonb_insert(kat, array[za::text], poz);
  execute format($f$
    create or replace function public.nauka_sklep_katalog() returns jsonb
    language sql immutable set search_path = '' as $b$ select %L::jsonb $b$
  $f$, kat::text);
end
$do$;

notify pgrst, 'reload schema';
