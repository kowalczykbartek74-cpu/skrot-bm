-- Skrót BM v21: motyw „Nokturn” (czarno-srebrna noc) w sklepie. Do tej pory był za darmo dla wszystkich;
-- teraz jest za darmo od poziomu 10 (sprawdza przeglądarka, NOC_LEVEL w index.html) albo wcześniej za 1000 monet.
-- Katalog jak w v20 + jedna pozycja. Uruchom w Supabase → SQL Editor (po v20). Można uruchomić ponownie.

create or replace function public.nauka_sklep_katalog() returns jsonb
language sql immutable set search_path = '' as $$
  select '[
    {"id":"motyw:pink",   "typ":"motyw", "theme":"pink",   "cena":150,  "poziom":3,  "pl":"Jednorożec", "en":"Unicorn"},
    {"id":"motyw:bow",    "typ":"motyw", "theme":"bow",    "cena":350,  "poziom":5,  "pl":"Kokardka",   "en":"Bow"},
    {"id":"motyw:meadow", "typ":"motyw", "theme":"meadow", "cena":350,  "poziom":5,  "pl":"Łąka",       "en":"Meadow"},
    {"id":"motyw:lilia",  "typ":"motyw", "theme":"lilia",  "cena":600,  "poziom":7,  "pl":"Nenufary",   "en":"Water Lilies"},
    {"id":"motyw:sea",    "typ":"motyw", "theme":"sea",    "cena":800,  "poziom":8,  "pl":"Nocny rejs", "en":"Night Sail"},
    {"id":"motyw:noc",    "typ":"motyw", "theme":"noc",    "cena":1000, "poziom":10, "pl":"Nokturn",    "en":"Nocturne"}
  ]'::jsonb
$$;

notify pgrst, 'reload schema';
