-- Skrót BM: ocena pytań otwartych w próbnym teście przez AI (funkcja serwerowa supabase/functions/grade-open).
-- Można uruchamiać wielokrotnie. Na produkcji: po skrot-v22-monety-widoczne.sql (numer v23 zajmuje rocznik Prawa).
--
-- 1) Limit kosztów: najwyżej N ocenionych testów na osobę dziennie (N podaje funkcja, domyślnie 5).
--    Jeden test (run) liczy się raz, więc ponowne wysłanie tego samego testu (np. po odświeżeniu) nie zjada limitu.
-- 2) Odwołania: „Nie zgadzam się” przy pytaniu zapisuje pytanie, odpowiedź i ocenę AI,
--    żeby starosta widział, gdzie AI się myli (Supabase → Table editor → nauka_ocena_odwolania).

create table if not exists public.nauka_ocena_ai (
  user_id  uuid not null,
  dzien    date not null,
  run      text not null,
  at       timestamptz not null default now(),
  primary key (user_id, dzien, run)
);
alter table public.nauka_ocena_ai enable row level security;
revoke all on public.nauka_ocena_ai from anon, authenticated;

-- Bierze jedno miejsce z dziennego limitu dla testu p_run. Zwraca {ok, uzyte, limit}.
create or replace function public.nauka_ocena_ai_bierz(p_run text, p_limit int) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  d date := (now() at time zone 'Europe/Warsaw')::date;
  n int;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'uzyte', 0, 'limit', p_limit); end if;
  if p_run is null or length(p_run) > 120 then return jsonb_build_object('ok', false, 'uzyte', 0, 'limit', p_limit); end if;
  -- Ten test już był liczony dziś: można go ocenić jeszcze raz bez kosztu w limicie.
  if exists (select 1 from public.nauka_ocena_ai o where o.user_id = auth.uid() and o.dzien = d and o.run = p_run) then
    select count(*) into n from public.nauka_ocena_ai o where o.user_id = auth.uid() and o.dzien = d;
    return jsonb_build_object('ok', true, 'uzyte', n, 'limit', p_limit);
  end if;
  perform pg_advisory_xact_lock(hashtext('nauka_ocena_ai:' || auth.uid()::text));
  select count(*) into n from public.nauka_ocena_ai o where o.user_id = auth.uid() and o.dzien = d;
  if n >= greatest(0, coalesce(p_limit, 5)) and not public.nauka_admin() then
    return jsonb_build_object('ok', false, 'uzyte', n, 'limit', p_limit);
  end if;
  insert into public.nauka_ocena_ai (user_id, dzien, run) values (auth.uid(), d, p_run) on conflict do nothing;
  return jsonb_build_object('ok', true, 'uzyte', n + 1, 'limit', p_limit);
end $$;
revoke all on function public.nauka_ocena_ai_bierz(text, int) from public, anon;
grant execute on function public.nauka_ocena_ai_bierz(text, int) to authenticated;

create table if not exists public.nauka_ocena_odwolania (
  id       bigint generated always as identity primary key,
  user_id  uuid not null,
  run      text not null,
  item     text not null,
  dane     jsonb not null,
  at       timestamptz not null default now(),
  unique (user_id, run, item)
);
alter table public.nauka_ocena_odwolania enable row level security;
revoke all on public.nauka_ocena_odwolania from anon, authenticated;

-- dane = {sid, question, modelAnswer, rubric, studentAnswer, ai}; najwyżej 20 kB.
create or replace function public.nauka_ocena_odwolanie(p_run text, p_item text, p_dane jsonb) returns boolean
language plpgsql volatile security definer set search_path = '' as $$
begin
  if auth.uid() is null or p_run is null or p_item is null or length(p_dane::text) > 20000 then return false; end if;
  insert into public.nauka_ocena_odwolania (user_id, run, item, dane) values (auth.uid(), left(p_run, 120), left(p_item, 200), p_dane)
  on conflict (user_id, run, item) do update set dane = excluded.dane, at = now();
  return true;
end $$;
revoke all on function public.nauka_ocena_odwolanie(text, text, jsonb) from public, anon;
grant execute on function public.nauka_ocena_odwolanie(text, text, jsonb) to authenticated;
