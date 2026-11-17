do $$ begin
  if 'ąćęłńóśźż' <> U&'\0105\0107\0119\0142\0144\00F3\015B\017A\017C' then
    raise exception 'Polskie znaki doszły zepsute. Skopiuj plik z github.com (Raw), nie przez Terminal.';
  end if;
end $$;
-- Skrót v59 (pętla UX-5, etap G2): monety jako realny skrót do motywów. Nowe progi poziomów i ceny (tabela B1 z pętli 5):
--   poziom 4: wybór Jednorożec (80) albo Nocny rejs (450) · poziom 6: wybór Kokardka (200) albo Nokturn (600)
--   poziom 8: Łąka (200) · 9: Nenufary (350) · 10 / 12: motyw niewybrany na 4 / 6 · 14: Riwiera (750) · 16: Jachtklub (900)
-- Wklej w Supabase → SQL Editor → Run, po v58. Kopiuj z github.com („Copy raw file”). Można uruchomić ponownie.
-- Zmienia tylko pola cena / poziom / poziom_wybor motywów w katalogu (także Riwiera z v41 i Jachtklub z v42);
-- reszty katalogu nie rusza. Poziom „za darmo” sprawdza przeglądarka (stałe w index.html, test ux5-etap2 porównuje je z tym plikiem).
-- Kupione motywy zostają kupione (nauka_posiadane bez zmian); motyw zdobyty z poziomu po starych progach zostaje (index.html, motywyZPoz).

-- Jedno źródło liczb (czyta je też test strony): id motywu → cena, poziom (od którego za darmo), poziom_wybor (dla pary: poziom niewybranego).
create or replace function public.nauka_motywy_cfg() returns jsonb
language sql immutable set search_path = '' as $$
  select '{
    "pink":    {"cena": 80,  "poziom": 4,  "poziom_wybor": 10, "para": "sea"},
    "sea":     {"cena": 450, "poziom": 4,  "poziom_wybor": 10, "para": "pink"},
    "bow":     {"cena": 200, "poziom": 6,  "poziom_wybor": 12, "para": "noc"},
    "noc":     {"cena": 600, "poziom": 6,  "poziom_wybor": 12, "para": "bow"},
    "meadow":  {"cena": 200, "poziom": 8},
    "lilia":   {"cena": 350, "poziom": 9},
    "riwiera": {"cena": 750, "poziom": 14},
    "klub":    {"cena": 900, "poziom": 16}
  }'::jsonb
$$;

do $do$
declare
  kat jsonb := public.nauka_sklep_katalog(); cfg jsonb := public.nauka_motywy_cfg(); nowy jsonb := '[]'::jsonb; e jsonb; c jsonb;
begin
  for e in select value from jsonb_array_elements(kat) loop
    if e->>'typ' = 'motyw' and cfg ? (e->>'theme') then
      c := cfg -> (e->>'theme');
      e := (e - 'poziom_wybor' - 'para') || jsonb_build_object('cena', c->'cena', 'poziom', c->'poziom')
           || case when c ? 'poziom_wybor' then jsonb_build_object('poziom_wybor', c->'poziom_wybor', 'para', c->'para') else '{}'::jsonb end;
    end if;
    nowy := nowy || jsonb_build_array(e);
  end loop;
  execute format($f$
    create or replace function public.nauka_sklep_katalog() returns jsonb
    language sql immutable set search_path = '' as $b$ select %L::jsonb $b$
  $f$, nowy::text);
end
$do$;

revoke execute on function public.nauka_motywy_cfg() from public, anon;
grant execute on function public.nauka_motywy_cfg() to authenticated;

notify pgrst, 'reload schema';
