-- Skrót BM v14: monety 🪙, Zadania dnia / tygodnia i Sklep z motywami.
-- Wklej w Supabase → SQL Editor → Run, PO skrot-v13-gry.sql i skrot-v15-gry2.sql (na produkcji v15 jest już w bazie,
-- więc ten plik idzie po nim; numer v14 został z kolejności pisania). Można uruchamiać wielokrotnie (nie kasuje danych).
-- Nie zmienia niczego z v13/v15 (nauka_rp_pula, nauka_rp_zrodlo_check, nauka_rp_dodaj zostają z v15): tylko dokłada
-- trigger na nauka_rp i własne tabele/funkcje. Działa też bez v15 (wtedy bez Hasła dnia w limicie i w Zadaniach dnia).
--
-- Zasady:
--   • Monety liczy WYŁĄCZNIE baza. Przeglądarka nie ma prawa czytać ani pisać tabel nauka_monety i nauka_posiadane
--     (RLS włączone, zero reguł); wszystko idzie przez funkcje security definer poniżej.
--   • Monety z nauki wynikają z księgi punktów rankingu nauka_rp (v13): 10 pkt dnia = 1 moneta (w dół), przeliczane
--     triggerem po każdym wpisie, ze WSZYSTKICH źródeł (także 'haslo' i 'boss' z v15). Limity dzienne nauka_rp dają
--     najwyżej 64 monety dziennie z nauki (62 + Hasło dnia), do tego jednorazowo +5 za Bossa. Nigdy z XP (XP jest w przeglądarce).
--   • Saldo = suma wpisów księgi. Każdy wpis ma unikalny klucz, więc ta sama nagroda / zakup nie wpadnie dwa razy.
--   • Zarabiają tylko osoby z pełnym dostępem (nauka_rp_mozna). Kupować może każdy zalogowany, kto ma monety.
--   • Zakupy są ostateczne. Ręcznie dodać / odjąć monety albo dać motyw może tylko starosta.
--   • Ceny, nagrody i katalog są tylko tutaj: zmiana = edycja tego pliku i ponowne uruchomienie.

-- =====================================================================
-- 1) Ustawienia
-- =====================================================================
create or replace function public.nauka_mon_cfg() returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object(
    'kurs_pkt', 10,              -- tyle pkt rankingu = 1 moneta
    'max_saldo', 100000          -- bezpiecznik
  )
$$;

-- =====================================================================
-- 2) Tabele
-- =====================================================================
-- Księga monet: jeden wiersz = jedna zmiana salda (+ zarobek, − zakup).
-- Klucze: nauka:<dzień>, misja:<id>:<dzień|poniedziałek>, zakup:<item>, admin:<uuid>.
create table if not exists public.nauka_monety (
  id         bigint generated always as identity primary key,
  user_id    uuid not null,
  dzien      date not null default public.nauka_dzis(),
  delta      int  not null check (delta between -100000 and 100000 and delta <> 0),
  zrodlo     text not null check (zrodlo in ('nauka','misja','zakup','admin')),
  klucz      text not null check (char_length(klucz) between 1 and 200),
  opis       text,
  created_at timestamptz not null default now(),
  unique (user_id, klucz)
);
create index if not exists nauka_monety_user_idx on public.nauka_monety (user_id, created_at desc);
create index if not exists nauka_monety_dzien_idx on public.nauka_monety (dzien, user_id);

-- Rzeczy kupione w sklepie (albo dane przez starostę: cena 0 i powód).
create table if not exists public.nauka_posiadane (
  user_id    uuid not null,
  item       text not null,
  cena       int  not null check (cena >= 0),
  powod      text,
  created_at timestamptz not null default now(),
  primary key (user_id, item)
);
alter table public.nauka_posiadane add column if not exists powod text;

alter table public.nauka_monety    enable row level security;
alter table public.nauka_posiadane enable row level security;
revoke all on public.nauka_monety, public.nauka_posiadane from anon, authenticated;

-- =====================================================================
-- 3) Monety z nauki: trigger na nauka_rp
-- =====================================================================
-- Po każdym wpisie punktów przelicza monety za ten dzień i nadpisuje jeden wiersz nauka:<dzień> (tylko w górę).
create or replace function public.nauka_mon_z_rp() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  kurs int := (public.nauka_mon_cfg()->>'kurs_pkt')::int;
  suma int; ile int;
begin
  select coalesce(sum(pkt), 0) into suma from public.nauka_rp where user_id = new.user_id and dzien = new.dzien;
  ile := suma / kurs;                                  -- dzielenie całkowite = w dół
  if ile <= 0 then return null; end if;
  insert into public.nauka_monety (user_id, dzien, delta, zrodlo, klucz, opis)
  values (new.user_id, new.dzien, ile, 'nauka', 'nauka:' || new.dzien::text, 'Nauka: ' || suma || ' pkt')
  on conflict (user_id, klucz) do update set delta = excluded.delta, opis = excluded.opis
  where public.nauka_monety.delta < excluded.delta;    -- tylko w górę
  return null;
end $$;

drop trigger if exists nauka_rp_monety on public.nauka_rp;
create trigger nauka_rp_monety after insert on public.nauka_rp
  for each row execute function public.nauka_mon_z_rp();

-- Jednorazowo (i bezpiecznie przy każdym ponownym uruchomieniu): monety za dni sprzed v14.
insert into public.nauka_monety (user_id, dzien, delta, zrodlo, klucz, opis)
select user_id, dzien, (sum(pkt) / 10)::int, 'nauka', 'nauka:' || dzien::text, 'Nauka: ' || sum(pkt) || ' pkt'
from public.nauka_rp group by user_id, dzien having sum(pkt) >= 10
on conflict (user_id, klucz) do update set delta = excluded.delta, opis = excluded.opis
where public.nauka_monety.delta < excluded.delta;

-- =====================================================================
-- 4) Funkcje pomocnicze (tylko dla innych funkcji bazy)
-- =====================================================================
create or replace function public.nauka_saldo(p_user uuid) returns int
language sql stable security definer set search_path = '' as $$
  select coalesce(sum(delta), 0)::int from public.nauka_monety where user_id = p_user
$$;

-- Najwięcej monet z nauki dziennie (wynika z limitów v13: gry + quiz + powtórki + lekcje + seria, i z v15: Hasło dnia).
-- Nagrody za Bossa (v15) tu nie liczymy: to jednorazowy bonus, nie codzienny limit.
-- plpgsql, bo nauka_gry2_cfg() (v15) może jeszcze nie istnieć.
create or replace function public.nauka_mon_dzis_max() returns int
language plpgsql stable set search_path = '' as $$
declare c jsonb := public.nauka_rp_cfg(); haslo int := 0;
begin
  if to_regprocedure('public.nauka_gry2_cfg()') is not null then
    select coalesce(max(v::int), 0) into haslo from jsonb_array_elements_text(public.nauka_gry2_cfg()->'haslo_pkt') v;
  end if;
  return ((c->>'max_dzien_gry')::int + (c->>'max_dzien_quiz')::int + (c->>'max_dzien_powtorki')::int
        + (c->>'max_dzien_lekcje')::int + (c->>'pkt_seria')::int + haslo) / (public.nauka_mon_cfg()->>'kurs_pkt')::int;
end $$;

-- =====================================================================
-- 5) Zadania dnia i tygodnia (misje)
-- =====================================================================
-- „gra1” liczy rundy z punktami za wynik (Fruń, Pary, Przejdź, Drabina), „odp10/odp25/zad2” także odpowiedzi
-- w Drabinie i ciosy w Bossa (to zwykłe odpowiedzi quizu/gry), „haslo1” – rozwiązane Hasło dnia (v15, źródło 'haslo').
-- Katalog. co: wiersze (liczba wpisów nauka_rp o źródle z listy i kluczu z prefiksem) | pkt (suma punktów dnia)
-- | dni (dni z punktami w tygodniu). Kolejność dziennych ma znaczenie (wybór po kolei, patrz nauka_misje_na).
create or replace function public.nauka_misje_pula() returns jsonb
language sql immutable set search_path = '' as $$
  select '[
    {"id":"odp10",  "okres":"dzien",   "co":"wiersze", "zrodla":["quiz","gra"], "prefix":"q:", "ile":10, "nagroda":8,  "pl":"Odpowiedz dobrze na 10 pytań",            "en":"Answer 10 questions correctly"},
    {"id":"odp25",  "okres":"dzien",   "co":"wiersze", "zrodla":["quiz","gra"], "prefix":"q:", "ile":25, "nagroda":15, "pl":"Odpowiedz dobrze na 25 pytań",            "en":"Answer 25 questions correctly"},
    {"id":"zad2",   "okres":"dzien",   "co":"wiersze", "zrodla":["quiz","gra"], "prefix":"z:", "ile":2,  "nagroda":10, "pl":"Rozwiąż 2 zadania liczbowe",              "en":"Solve 2 numeric problems"},
    {"id":"pow10",  "okres":"dzien",   "co":"wiersze", "zrodla":["powtorka"],   "prefix":"p:", "ile":10, "nagroda":6,  "pl":"Zrób 10 powtórek fiszek",                 "en":"Do 10 flashcard reviews"},
    {"id":"lek1",   "okres":"dzien",   "co":"wiersze", "zrodla":["lekcja"],     "prefix":"l:", "ile":1,  "nagroda":10, "pl":"Skończ jedną lekcję",                     "en":"Finish one lesson"},
    {"id":"gra1",   "okres":"dzien",   "co":"wiersze", "zrodla":["wynik"],      "prefix":"r:", "ile":1,  "nagroda":5,  "pl":"Zagraj jedną rundę gry",                  "en":"Play one game round"},
    {"id":"haslo1", "okres":"dzien",   "co":"wiersze", "zrodla":["haslo"],      "prefix":"h:", "ile":1,  "nagroda":5,  "pl":"Rozwiąż Hasło dnia",                      "en":"Solve the Word of the Day"},
    {"id":"pkt60",  "okres":"dzien",   "co":"pkt",     "zrodla":null,           "prefix":null, "ile":60, "nagroda":8,  "pl":"Zbierz dziś 60 pkt",                      "en":"Earn 60 points today"},
    {"id":"tyd_l5", "okres":"tydzien", "co":"wiersze", "zrodla":["lekcja"],     "prefix":"l:", "ile":5,  "nagroda":40, "pl":"Skończ 5 lekcji w tym tygodniu",          "en":"Finish 5 lessons this week"},
    {"id":"tyd_d5", "okres":"tydzien", "co":"dni",     "zrodla":null,           "prefix":null, "ile":5,  "nagroda":50, "pl":"Ucz się 5 dni w tym tygodniu",            "en":"Study on 5 days this week"}
  ]'::jsonb
$$;

-- Misje na dzień d: 3 dzienne (te same dla wszystkich) + 1 tygodniowa.
-- Dzienne: 3 kolejne z puli od pozycji (d − 2026-01-01) mod liczba_dziennych; odp10 i odp25 nie razem
-- (wtedy odp25 zamieniamy na następną z kolei). Tygodniowa: tyd_l5 / tyd_d5 na zmianę wg numeru tygodnia.
create or replace function public.nauka_misje_na(d date) returns jsonb
language plpgsql immutable set search_path = '' as $$
declare
  pula jsonb := public.nauka_misje_pula();
  dz jsonb; ty jsonb; n int; s int; wyb jsonb := '[]'::jsonb; m jsonb; i int; tyg int;
begin
  select jsonb_agg(e order by o) into dz from jsonb_array_elements(pula) with ordinality t(e, o) where e->>'okres' = 'dzien';
  select jsonb_agg(e order by o) into ty from jsonb_array_elements(pula) with ordinality t(e, o) where e->>'okres' = 'tydzien';
  n := jsonb_array_length(dz);
  s := (((d - date '2026-01-01') % n) + n) % n;
  for i in 0..2 loop wyb := wyb || jsonb_build_array(dz->((s + i) % n)); end loop;
  if wyb @> '[{"id":"odp10"}]' and wyb @> '[{"id":"odp25"}]' then
    select jsonb_agg(case when e->>'id' = 'odp25' then dz->((s + 3) % n) else e end order by o) into wyb
      from jsonb_array_elements(wyb) with ordinality t(e, o);
  end if;
  tyg := (public.nauka_tydzien(d) - date '2026-01-05') / 7;
  m := ty->(((tyg % jsonb_array_length(ty)) + jsonb_array_length(ty)) % jsonb_array_length(ty));
  return wyb || jsonb_build_array(m);
end $$;

-- Postęp osoby w misji m na dzień d (dla tygodniowej: cały tydzień, w którym jest d).
create or replace function public.nauka_misja_postep(p_user uuid, m jsonb, d date) returns int
language plpgsql stable security definer set search_path = '' as $$
declare
  tydz boolean := m->>'okres' = 'tydzien';
  t date := public.nauka_tydzien(d);
  zr text[] := case when jsonb_typeof(m->'zrodla') = 'array' then array(select jsonb_array_elements_text(m->'zrodla')) end;
  v int;
begin
  if m->>'co' = 'pkt' then
    select coalesce(sum(r.pkt), 0) into v from public.nauka_rp r
     where r.user_id = p_user and (case when tydz then r.tydzien = t else r.dzien = d end);
  elsif m->>'co' = 'dni' then
    select count(distinct r.dzien) into v from public.nauka_rp r
     where r.user_id = p_user and r.tydzien = t and r.pkt > 0;
  else
    select count(*) into v from public.nauka_rp r
     where r.user_id = p_user and (case when tydz then r.tydzien = t else r.dzien = d end)
       and (zr is null or r.zrodlo = any(zr))
       and (m->>'prefix' is null or r.klucz like (m->>'prefix') || '%');
  end if;
  return coalesce(v, 0);
end $$;

-- Klucz nagrody misji w księdze monet.
create or replace function public.nauka_misja_klucz(m jsonb, d date) returns text
language sql immutable set search_path = '' as $$
  select 'misja:' || (m->>'id') || ':' || (case when m->>'okres' = 'tydzien' then public.nauka_tydzien(d) else d end)::text
$$;

-- =====================================================================
-- 6) Funkcje dla strony: misje
-- =====================================================================
-- Dzisiejsze Zadania dnia (3) + Zadanie tygodnia (1) z postępem. Bez pełnego dostępu: postęp 0 i zablokowane.
create or replace function public.nauka_misje() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  d date := public.nauka_dzis();
  mozna boolean := public.nauka_rp_mozna();
  out_ jsonb := '[]'::jsonb; m jsonb; pst int;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  for m in select e from jsonb_array_elements(public.nauka_misje_na(d)) e loop
    pst := case when mozna then public.nauka_misja_postep(auth.uid(), m, d) else 0 end;
    out_ := out_ || jsonb_build_array(jsonb_build_object(
      'id', m->>'id', 'okres', m->>'okres', 'opis_pl', m->>'pl', 'opis_en', m->>'en',
      'ile', (m->>'ile')::int, 'postep', least(pst, (m->>'ile')::int), 'nagroda', (m->>'nagroda')::int,
      'odebrana', exists (select 1 from public.nauka_monety x where x.user_id = auth.uid() and x.klucz = public.nauka_misja_klucz(m, d)),
      'zablokowane', not mozna,
      'do_kiedy', case when m->>'okres' = 'tydzien' then (public.nauka_tydzien(d) + 7)::timestamp else (d + 1)::timestamp end
                  at time zone 'Europe/Warsaw'));
  end loop;
  return jsonb_build_object('ok', true, 'dzien', d, 'zablokowane', not mozna, 'teraz', now(), 'misje', out_);
end $$;

-- Odbiór nagrody za misję: tylko z dzisiejszej listy i tylko gdy baza sama policzy, że jest zrobiona.
create or replace function public.nauka_misja_odbierz(p_id text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  d date := public.nauka_dzis();
  m jsonb; n int; s int;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_rp_mozna() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  select e into m from jsonb_array_elements(public.nauka_misje_na(d)) e where e->>'id' = p_id;
  if m is null then return jsonb_build_object('ok', false, 'code', 'not_today'); end if;
  perform pg_advisory_xact_lock(hashtext('nauka_mon:' || auth.uid()::text));
  if public.nauka_misja_postep(auth.uid(), m, d) < (m->>'ile')::int then
    return jsonb_build_object('ok', false, 'code', 'not_done');
  end if;
  s := public.nauka_saldo(auth.uid());
  if s + (m->>'nagroda')::int > (public.nauka_mon_cfg()->>'max_saldo')::int then
    return jsonb_build_object('ok', false, 'code', 'max_saldo');
  end if;
  insert into public.nauka_monety (user_id, dzien, delta, zrodlo, klucz, opis)
  values (auth.uid(), d, (m->>'nagroda')::int, 'misja', public.nauka_misja_klucz(m, d),
          case when m->>'okres' = 'tydzien' then 'Zadanie tygodnia: ' else 'Zadanie dnia: ' end || (m->>'pl'))
  on conflict (user_id, klucz) do nothing;
  get diagnostics n = row_count;
  if n = 0 then return jsonb_build_object('ok', false, 'code', 'already', 'saldo', s); end if;
  return jsonb_build_object('ok', true, 'id', p_id, 'nagroda', (m->>'nagroda')::int, 'saldo', s + (m->>'nagroda')::int);
end $$;

-- =====================================================================
-- 7) Sklep
-- =====================================================================
-- Katalog. poziom = od którego poziomu motyw jest za darmo (sprawdza przeglądarka; baza nie zna XP).
create or replace function public.nauka_sklep_katalog() returns jsonb
language sql immutable set search_path = '' as $$
  select '[
    {"id":"motyw:bow",    "typ":"motyw", "theme":"bow",    "cena":350, "poziom":5, "pl":"Kokardka",   "en":"Bow"},
    {"id":"motyw:meadow", "typ":"motyw", "theme":"meadow", "cena":350, "poziom":5, "pl":"Łąka",       "en":"Meadow"},
    {"id":"motyw:lilia",  "typ":"motyw", "theme":"lilia",  "cena":600, "poziom":7, "pl":"Nenufary",   "en":"Water Lilies"},
    {"id":"motyw:sea",    "typ":"motyw", "theme":"sea",    "cena":800, "poziom":8, "pl":"Nocny rejs", "en":"Night Sail"}
  ]'::jsonb
$$;

-- Saldo, dzisiejsze monety z nauki, posiadane rzeczy i katalog.
create or replace function public.nauka_sklep_stan() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare u uuid := auth.uid();
begin
  if u is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  return jsonb_build_object('ok', true,
    'saldo', public.nauka_saldo(u),
    'dzis_nauka', coalesce((select delta from public.nauka_monety where user_id = u and klucz = 'nauka:' || public.nauka_dzis()::text), 0),
    'dzis_max', public.nauka_mon_dzis_max(),
    'kurs_pkt', (public.nauka_mon_cfg()->>'kurs_pkt')::int,
    'mozna', public.nauka_rp_mozna(),
    'posiadane', coalesce((select jsonb_agg(item order by created_at) from public.nauka_posiadane where user_id = u), '[]'::jsonb),
    'katalog', public.nauka_sklep_katalog(),
    'zarobione_lacznie', coalesce((select sum(delta) from public.nauka_monety where user_id = u and delta > 0), 0),
    'wydane_lacznie', coalesce((select -sum(delta) from public.nauka_monety where user_id = u and zrodlo = 'zakup'), 0));
end $$;

-- Zakup. Pod blokadą na osobę: dwa kliknięcia naraz (albo dwie karty) nie wydadzą monet dwa razy.
create or replace function public.nauka_sklep_kup(p_item text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare it jsonb; cena int; s int;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  perform pg_advisory_xact_lock(hashtext('nauka_mon:' || auth.uid()::text));
  select e into it from jsonb_array_elements(public.nauka_sklep_katalog()) e where e->>'id' = p_item;
  if it is null then return jsonb_build_object('ok', false, 'code', 'no_item'); end if;
  s := public.nauka_saldo(auth.uid());
  if exists (select 1 from public.nauka_posiadane where user_id = auth.uid() and item = p_item) then
    return jsonb_build_object('ok', false, 'code', 'owned', 'saldo', s);
  end if;
  cena := (it->>'cena')::int;
  if s < cena then return jsonb_build_object('ok', false, 'code', 'no_coins', 'brakuje', cena - s, 'saldo', s); end if;
  insert into public.nauka_posiadane (user_id, item, cena) values (auth.uid(), p_item, cena);
  if cena > 0 then
    insert into public.nauka_monety (user_id, delta, zrodlo, klucz, opis)
    values (auth.uid(), -cena, 'zakup', 'zakup:' || p_item, 'Zakup: ' || (it->>'pl'));
  end if;
  return jsonb_build_object('ok', true, 'item', p_item, 'saldo', s - cena);
end $$;

-- Ostatnie wpisy księgi do ekranu „Historia monet”.
create or replace function public.nauka_monety_historia(p_limit int default 30) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  return jsonb_build_object('ok', true, 'wpisy', coalesce((
    select jsonb_agg(jsonb_build_object('dzien', x.dzien, 'delta', x.delta, 'zrodlo', x.zrodlo, 'klucz', x.klucz, 'opis', x.opis, 'at', x.created_at) order by x.created_at desc)
      from (select * from public.nauka_monety where user_id = auth.uid()
             order by created_at desc limit least(greatest(coalesce(p_limit, 30), 1), 100)) x), '[]'::jsonb));
end $$;

-- =====================================================================
-- 8) Starosta
-- =====================================================================
-- Dodaje (p_delta > 0) albo odejmuje monety z powodem. Saldo nie zejdzie poniżej zera.
create or replace function public.nauka_admin_monety(p_user uuid, p_delta int, p_powod text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare s int; pw text := btrim(coalesce(p_powod, ''));
begin
  if not public.nauka_admin() then return jsonb_build_object('ok', false, 'code', 'not_admin'); end if;
  if p_user is null or p_delta is null or p_delta = 0 or abs(p_delta) > 100000 then return jsonb_build_object('ok', false, 'code', 'bad_delta'); end if;
  if char_length(pw) not between 1 and 200 then return jsonb_build_object('ok', false, 'code', 'no_reason'); end if;
  perform pg_advisory_xact_lock(hashtext('nauka_mon:' || p_user::text));
  s := public.nauka_saldo(p_user);
  if s + p_delta < 0 then return jsonb_build_object('ok', false, 'code', 'below_zero', 'saldo', s); end if;
  if s + p_delta > (public.nauka_mon_cfg()->>'max_saldo')::int then return jsonb_build_object('ok', false, 'code', 'max_saldo', 'saldo', s); end if;
  insert into public.nauka_monety (user_id, delta, zrodlo, klucz, opis)
  values (p_user, p_delta, 'admin', 'admin:' || gen_random_uuid()::text, 'Od starosty: ' || pw);
  return jsonb_build_object('ok', true, 'saldo', s + p_delta);
end $$;

-- Daje rzecz z katalogu za darmo (np. nagroda w konkursie). Powód zostaje przy rzeczy.
create or replace function public.nauka_admin_daj_item(p_user uuid, p_item text, p_powod text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  if not public.nauka_admin() then return jsonb_build_object('ok', false, 'code', 'not_admin'); end if;
  if not exists (select 1 from jsonb_array_elements(public.nauka_sklep_katalog()) e where e->>'id' = p_item) then
    return jsonb_build_object('ok', false, 'code', 'no_item');
  end if;
  insert into public.nauka_posiadane (user_id, item, cena, powod)
  values (p_user, p_item, 0, nullif(left(btrim(coalesce(p_powod, '')), 200), ''))
  on conflict (user_id, item) do nothing;
  get diagnostics n = row_count;
  return jsonb_build_object('ok', true, 'juz', n = 0);
end $$;

-- Panel „Aktywność”: monety dziś i w tym tygodniu na osobę (do wyłapania dziwnych wyników) i saldo.
create or replace function public.nauka_admin_monety_stat() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare d date := public.nauka_dzis(); t date := public.nauka_tydzien(public.nauka_dzis());
begin
  if not public.nauka_admin() then return jsonb_build_object('ok', false, 'code', 'not_admin'); end if;
  return jsonb_build_object('ok', true, 'dzien', d, 'tydzien', t, 'dzis_max', public.nauka_mon_dzis_max(),
    'konta', coalesce((
      select jsonb_agg(jsonb_build_object('user_id', x.user_id, 'email', lower(coalesce(u.email, '')), 'dzis', x.dzis, 'tydzien', x.tydz,
                                          'saldo', x.saldo, 'posiadane', x.pos) order by x.tydz desc, x.saldo desc)
        from (select m.user_id,
                     coalesce(sum(m.delta) filter (where m.delta > 0 and m.zrodlo in ('nauka','misja') and m.dzien = d), 0)::int dzis,
                     coalesce(sum(m.delta) filter (where m.delta > 0 and m.zrodlo in ('nauka','misja') and m.dzien >= t), 0)::int tydz,
                     sum(m.delta)::int saldo,
                     (select jsonb_agg(p.item) from public.nauka_posiadane p where p.user_id = m.user_id) pos
                from public.nauka_monety m group by m.user_id) x
        left join auth.users u on u.id = x.user_id), '[]'::jsonb));
end $$;

-- =====================================================================
-- 9) Uprawnienia
-- =====================================================================
-- Supabase domyślnie daje anon/authenticated prawo do każdej nowej funkcji – odbieramy wszystkim (jak w v12, v13)
revoke execute on function
  public.nauka_mon_cfg(), public.nauka_mon_z_rp(), public.nauka_saldo(uuid), public.nauka_mon_dzis_max(),
  public.nauka_misje_pula(), public.nauka_misje_na(date), public.nauka_misja_postep(uuid, jsonb, date), public.nauka_misja_klucz(jsonb, date),
  public.nauka_misje(), public.nauka_misja_odbierz(text),
  public.nauka_sklep_katalog(), public.nauka_sklep_stan(), public.nauka_sklep_kup(text), public.nauka_monety_historia(int),
  public.nauka_admin_monety(uuid, int, text), public.nauka_admin_daj_item(uuid, text, text), public.nauka_admin_monety_stat()
from public, anon, authenticated;

-- …i dajemy z powrotem tylko to, co woła strona (funkcje starosty w środku sprawdzają nauka_admin())
grant execute on function
  public.nauka_misje(), public.nauka_misja_odbierz(text),
  public.nauka_sklep_stan(), public.nauka_sklep_kup(text), public.nauka_monety_historia(int),
  public.nauka_admin_monety(uuid, int, text), public.nauka_admin_daj_item(uuid, text, text), public.nauka_admin_monety_stat()
to authenticated;

notify pgrst, 'reload schema';
