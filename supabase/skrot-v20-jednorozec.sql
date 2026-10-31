-- Skrót BM v20: motyw „Jednorożec” (różowy) w sklepie. Do tej pory był za darmo dla wszystkich;
-- teraz jest za darmo od poziomu 3 (sprawdza przeglądarka, PINK_LEVEL w index.html) albo wcześniej za 150 monet.
-- Katalog jak w v14 + jedna pozycja. Uruchom w Supabase → SQL Editor (po v19). Można uruchomić ponownie.

create or replace function public.nauka_sklep_katalog() returns jsonb
language sql immutable set search_path = '' as $$
  select '[
    {"id":"motyw:pink",   "typ":"motyw", "theme":"pink",   "cena":150, "poziom":3, "pl":"Jednorożec", "en":"Unicorn"},
    {"id":"motyw:bow",    "typ":"motyw", "theme":"bow",    "cena":350, "poziom":5, "pl":"Kokardka",   "en":"Bow"},
    {"id":"motyw:meadow", "typ":"motyw", "theme":"meadow", "cena":350, "poziom":5, "pl":"Łąka",       "en":"Meadow"},
    {"id":"motyw:lilia",  "typ":"motyw", "theme":"lilia",  "cena":600, "poziom":7, "pl":"Nenufary",   "en":"Water Lilies"},
    {"id":"motyw:sea",    "typ":"motyw", "theme":"sea",    "cena":800, "poziom":8, "pl":"Nocny rejs", "en":"Night Sail"}
  ]'::jsonb
$$;

notify pgrst, 'reload schema';
