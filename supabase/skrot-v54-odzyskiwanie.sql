-- Strażnik kodowania: polskie litery wpisane wprost muszą być równe tym samym literom zapisanym kodami (same znaki ASCII).
-- Gdy plik przeszedł przez Terminal albo zły schowek, litery z pierwszej strony się psują („Ňā”, „√≥”), a kody nie,
-- więc warunek nie przechodzi i plik zatrzymuje się na pierwszej instrukcji, zanim cokolwiek zmieni.
-- Ten blok wklejamy na sam początek każdej nowej migracji (od v44); pilnuje tego tests/migracje.test.js.
do $$ begin
  if 'ąćęłńóśźż' <> U&'\0105\0107\0119\0142\0144\00F3\015B\017A\017C' then
    raise exception 'Polskie znaki doszły zepsute. Skopiuj plik z github.com (Raw), nie przez Terminal.';
  end if;
end $$;
-- Skrót v54 (pętla UX-1, etap 4): odzyskiwanie po próbie i dowód społeczny.
-- Wklej w Supabase → SQL Editor → Run, po v53. Kopiuj z github.com („Copy raw file”), nie przez Terminal.
-- Można uruchomić ponownie (drugi raz nic nie zmienia). Nic nie nadpisuje (nowe funkcje i kolumna).
--
-- 1. „+2 dni przed kolokwium”: raz na konto, tylko po zakończonej próbie bez zakupu, tylko gdy najbliższe kolokwium / egzamin
--    rocznika (terminy starosty, nauka_docs 'deadlines') wypada w ciągu 7 dni. nauka_proba_bonus_stan() mówi stronie, czy
--    pokazać kartę; nauka_proba_bonus() sprawdza to samo w bazie i przedłuża próbę o 2 dni (bonus_at = znacznik „raz”).
-- 1b. nauka_proba_stan(): czy próba tej osoby już minęła (bez zakupu, nigdy nie płaciła) – ekran „Twoje 3 dni minęły” także na
--     innym urządzeniu niż to, na którym trwała próba.
-- 2. nauka_rocznik_licznik(rocznik) dla gościa: ile osób z rocznika uczyło się w ostatnich 7 dniach (punkty nauki nauka_rp),
--    tylko gdy co najmniej 15 (mniej → null: mała liczba działa odwrotnie). Zwraca samą liczbę, bez żadnych danych osób.
-- 3. nauka_lekcja_spis(id): same tytuły sekcji lekcji (najwyżej 6, bez treści) z rocznika osoby – podgląd na ekranie z kłódką,
--    żeby student widział, co jest w lekcji, zanim kupi. Treść lekcji dalej tylko z pełnym dostępem.

alter table public.nauka_proby add column if not exists bonus_at timestamptz;

-- Najbliższe kolokwium / egzamin rocznika osoby w oknie 0–7 dni (data w formacie RRRR-MM-DD) albo null.
create or replace function public.nauka_proba_bonus_termin(p_user uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('title', d.data->>'title', 'subjectId', d.data->>'subjectId', 'type', d.data->>'type', 'date', d.data->>'date',
                            'n', (d.data->>'date')::date - (now() at time zone 'Europe/Warsaw')::date)
  from public.nauka_docs d
  where d.kolekcja = 'deadlines'
    and coalesce(d.rocznik_id, public.nauka_bm()) = public.nauka_rocznik_uid(p_user)
    and d.data->>'type' in ('kolokwium', 'egzamin')
    and d.data->>'date' ~ '^\d{4}-\d{2}-\d{2}$'
    and (d.data->>'date')::date between (now() at time zone 'Europe/Warsaw')::date and (now() at time zone 'Europe/Warsaw')::date + 7
  order by (d.data->>'date')::date, d.id
  limit 1
$$;
revoke all on function public.nauka_proba_bonus_termin(uuid) from public, anon, authenticated;

create or replace function public.nauka_proba_bonus_stan() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare uid uuid := auth.uid(); p public.nauka_proby; t jsonb;
begin
  if uid is null then return jsonb_build_object('mozna', false); end if;
  select * into p from public.nauka_proby where user_id = uid;
  if not found or p.do_kiedy > now() or p.bonus_at is not null
     or exists (select 1 from public.nauka_dostep d where d.do_kiedy >= current_date and (d.user_id = uid or d.email = p.email)) then
    return jsonb_build_object('mozna', false);
  end if;
  t := public.nauka_proba_bonus_termin(uid);
  return jsonb_build_object('mozna', t is not null, 'termin', t);
end $$;
revoke all on function public.nauka_proba_bonus_stan() from public, anon;
grant execute on function public.nauka_proba_bonus_stan() to authenticated;

-- Błędy: nie_zalogowany | brak_proby | trwa | wykorzystany | ma_dostep | brak_terminu.
create or replace function public.nauka_proba_bonus() returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := auth.uid(); p public.nauka_proby; t jsonb; koniec timestamptz;
begin
  if uid is null then raise exception 'nie_zalogowany'; end if;
  select * into p from public.nauka_proby where user_id = uid for update;
  if not found then raise exception 'brak_proby'; end if;
  if p.do_kiedy > now() then raise exception 'trwa'; end if;
  if p.bonus_at is not null then raise exception 'wykorzystany'; end if;
  if exists (select 1 from public.nauka_dostep d where d.do_kiedy >= current_date and (d.user_id = uid or d.email = p.email)) then raise exception 'ma_dostep'; end if;
  t := public.nauka_proba_bonus_termin(uid);
  if t is null then raise exception 'brak_terminu'; end if;
  update public.nauka_proby set do_kiedy = now() + interval '2 days', bonus_at = now() where user_id = uid returning do_kiedy into koniec;
  return jsonb_build_object('ok', true, 'do_kiedy', koniec, 'termin', t);
end $$;
revoke all on function public.nauka_proba_bonus() from public, anon;
grant execute on function public.nauka_proba_bonus() to authenticated;

create or replace function public.nauka_proba_stan() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce((select jsonb_build_object('minela', p.do_kiedy <= now(), 'do_kiedy', p.do_kiedy, 'bonus', p.bonus_at is not null)
                   from public.nauka_proby p
                   where p.user_id = auth.uid()
                     and not exists (select 1 from public.nauka_dostep d where d.user_id = p.user_id or d.email = p.email)),
                  jsonb_build_object('minela', false))
$$;
revoke all on function public.nauka_proba_stan() from public, anon;
grant execute on function public.nauka_proba_stan() to authenticated;

create or replace function public.nauka_rocznik_licznik(p_rocznik text) returns int
language sql stable security definer set search_path = '' as $$
  select case when n >= 15 then n end from (
    select count(distinct r.user_id)::int n from public.nauka_rp r
    where r.dzien >= (now() at time zone 'Europe/Warsaw')::date - 6
      and public.nauka_rocznik_uid(r.user_id) = p_rocznik) x
$$;
revoke all on function public.nauka_rocznik_licznik(text) from public;
grant execute on function public.nauka_rocznik_licznik(text) to anon, authenticated;

create or replace function public.nauka_lekcja_spis(p_id text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce((select jsonb_agg(left(x.h, 120) order by x.i) from (
      select e->>'h' h, i from public.nauka_docs d,
        jsonb_array_elements(case when jsonb_typeof(d.data->'lesson'->'sections') = 'array' then d.data->'lesson'->'sections' else '[]'::jsonb end) with ordinality as t(e, i)
      where d.kolekcja = 'materialContent' and d.id = public.nauka_docs_id_dla(p_id, public.nauka_moj_rocznik())
        and coalesce(e->>'h', '') <> ''
      order by i limit 6) x), '[]'::jsonb)
$$;
revoke all on function public.nauka_lekcja_spis(text) from public, anon;
grant execute on function public.nauka_lekcja_spis(text) to authenticated;
