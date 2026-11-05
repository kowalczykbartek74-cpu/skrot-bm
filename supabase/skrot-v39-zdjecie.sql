-- Skrót v39: sprawdzenie zdjęcia rozwiązania (etap 13 „Systemy z Zdawalni w Skrócie”), funkcja serwerowa supabase/functions/sprawdz-zdjecie.
-- Wklej w Supabase → SQL Editor → Run, po v38. Można uruchamiać wielokrotnie.
--
-- Port matura-app supabase/migrations/20261016000200_photo_checks.sql (licznik photo_checks w kai_usage) i app/photo-actions.ts
-- (Pro, najwyżej 5 dziennie). Tu osobna tabela jak licznik oceny AI z v25 (nauka_ocena_ai).
--
-- 1. Limit dzienny (decyzja D9): najwyżej N sprawdzeń na osobę dziennie (N podaje funkcja Edge, domyślnie 5), dzień według
--    Europe/Warsaw. Tylko pełny dostęp: nauka_platny() (opłacone konto albo okres próbny, na dobrym urządzeniu; starosta zawsze).
--    Starosta (nauka_admin) bez limitu, jak w ocenie AI testu.
-- 2. Zdjęcie NIE jest zapisywane (decyzja D8): tabela ma tylko kto, kiedy i z którego rocznika było zadanie. Żadnej treści
--    zadania, zdjęcia ani wyniku. Funkcja Edge trzyma zdjęcie tylko w pamięci na czas jednego wywołania API.
-- 3. Zwrot miejsca: gdy AI nie odpowie (przekroczony czas, błąd API, zły format), funkcja Edge oddaje miejsce w limicie
--    (nauka_zdjecie_zwroc, tylko service_role — student nie może sam „odzyskać” sprawdzenia po udanej ocenie).
-- 4. Wpisy starsze niż 90 dni kasuje samo pobranie miejsca (wiersze tej osoby), więc nie trzeba osobnego zadania pg_cron.

create table if not exists public.nauka_zdjecia (
  id          bigint generated always as identity primary key,
  user_id     uuid not null,
  dzien       date not null,
  rocznik_id  text,
  at          timestamptz not null default now()
);
create index if not exists nauka_zdjecia_user_dzien on public.nauka_zdjecia (user_id, dzien);
alter table public.nauka_zdjecia enable row level security;
revoke all on public.nauka_zdjecia from public, anon, authenticated;

-- Bierze jedno miejsce z dziennego limitu. Zwraca {ok, id, u (auth.uid, do zwrotu), uzyte, limit, admin} albo {ok:false, code: not_granted | limit, uzyte, limit}.
create or replace function public.nauka_zdjecie_bierz(p_limit int, p_rocznik text default null) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  d date := (now() at time zone 'Europe/Warsaw')::date;
  lim int := greatest(0, least(coalesce(p_limit, 5), 50));
  n int;
  nid bigint;
begin
  if auth.uid() is null or not public.nauka_platny() then
    return jsonb_build_object('ok', false, 'code', 'not_granted', 'uzyte', 0, 'limit', lim);
  end if;
  perform pg_advisory_xact_lock(hashtext('nauka_zdjecia:' || auth.uid()::text));
  delete from public.nauka_zdjecia z where z.user_id = auth.uid() and z.dzien < d - 90;
  select count(*) into n from public.nauka_zdjecia z where z.user_id = auth.uid() and z.dzien = d;
  if n >= lim and not public.nauka_admin() then
    return jsonb_build_object('ok', false, 'code', 'limit', 'uzyte', n, 'limit', lim);
  end if;
  insert into public.nauka_zdjecia (user_id, dzien, rocznik_id)
  values (auth.uid(), d, nullif(left(coalesce(p_rocznik, ''), 80), ''))
  returning id into nid;
  return jsonb_build_object('ok', true, 'id', nid, 'u', auth.uid(), 'uzyte', n + 1, 'limit', lim, 'admin', public.nauka_admin());
end $$;
revoke all on function public.nauka_zdjecie_bierz(int, text) from public, anon;
grant execute on function public.nauka_zdjecie_bierz(int, text) to authenticated;

-- Ile sprawdzeń zostało dziś (strona pokazuje przed wysłaniem zdjęcia). {ok, uzyte, limit, admin}.
create or replace function public.nauka_zdjecie_stan(p_limit int default 5) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'ok', auth.uid() is not null and public.nauka_platny(),
    'uzyte', (select count(*) from public.nauka_zdjecia z where z.user_id = auth.uid() and z.dzien = (now() at time zone 'Europe/Warsaw')::date),
    'limit', greatest(0, least(coalesce(p_limit, 5), 50)),
    'admin', public.nauka_admin())
$$;
revoke all on function public.nauka_zdjecie_stan(int) from public, anon;
grant execute on function public.nauka_zdjecie_stan(int) to authenticated;

-- Oddaje miejsce w limicie po nieudanym sprawdzeniu. Tylko funkcja Edge (service_role) i tylko świeży wpis tej osoby.
create or replace function public.nauka_zdjecie_zwroc(p_user uuid, p_id bigint) returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare k int;
begin
  delete from public.nauka_zdjecia z where z.id = p_id and z.user_id = p_user and z.at > now() - interval '10 minutes';
  get diagnostics k = row_count;
  return k > 0;
end $$;
revoke all on function public.nauka_zdjecie_zwroc(uuid, bigint) from public, anon, authenticated;
grant execute on function public.nauka_zdjecie_zwroc(uuid, bigint) to service_role;

notify pgrst, 'reload schema';
