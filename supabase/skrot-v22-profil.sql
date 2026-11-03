-- Skrót BM v22: Profil nauki (Zdawalni docs/plan-profil-nauki.md, etap L7).
-- Wklej w Supabase → SQL Editor → Run. Można uruchamiać wielokrotnie.
--
-- 1. nauka_zdarzenia: zdarzenia nauki (oceny fiszek, bilety wyjścia, sesje, test „Jak się uczysz?”).
--    Tylko z listy typów, każde z celem; bez treści odpowiedzi. Przeglądarka nie czyta tabeli, zapis przez RPC.
-- 2. nauka_profil_nauki: odpowiedzi z testu („deklaracje”), ustawienia startowe („startowe”) i przełącznik
--    „Ucz się na moich danych”. „z_danych” (model z prawdziwej nauki) na razie puste: liczy je Zdawalni nocą,
--    w Skrócie dojdzie osobno.
-- Retencja: zdarzenia starsze niż 400 dni usuwa każdy zapis tej osoby; usunięcie konta kasuje wszystko (cascade).

create table if not exists public.nauka_zdarzenia (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  klient_id uuid not null,
  typ text not null,
  kiedy timestamptz not null,
  odebrane timestamptz not null default now(),
  przesuniety_zegar boolean not null default false,
  dane jsonb not null default '{}'::jsonb,
  unique (user_id, klient_id)
);
create index if not exists nauka_zdarzenia_user_kiedy on public.nauka_zdarzenia (user_id, kiedy);
alter table public.nauka_zdarzenia enable row level security;
revoke all on public.nauka_zdarzenia from anon, authenticated;

create table if not exists public.nauka_profil_nauki (
  user_id uuid primary key references auth.users (id) on delete cascade,
  deklaracje jsonb not null default '{}'::jsonb,
  startowe jsonb not null default '{}'::jsonb,
  z_danych jsonb not null default '{}'::jsonb,
  test_odpowiedzi jsonb,
  test_at timestamptz,
  wlaczone boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.nauka_profil_nauki enable row level security;
revoke all on public.nauka_profil_nauki from anon, authenticated;

-- Typy zdarzeń: true = potrzebne do działania (zapisywane też przy wyłączonym „Ucz się na moich danych”).
create or replace function public.nauka_zdarzenia_typy()
returns jsonb language sql immutable set search_path = '' as $$
  select jsonb_build_object(
    'review_graded', true,   -- ocena fiszki: termin następnej powtórki (FSRS)
    'exit_ticket', true,     -- bilet wyjścia: „umiesz” i powtórki po lekcji
    'lesson_step', false,    -- kroki lekcji: które pomagają
    'session_started', false,
    'session_ended', false,  -- czas aktywny sesji: długość bloku
    'break_event', false,
    'profile_test', false    -- przebieg testu „Jak się uczysz?”
  );
$$;

create or replace function public.nauka_zdarzenia_zapisz(p_zdarzenia jsonb)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  typy jsonb := public.nauka_zdarzenia_typy();
  wl boolean;
  ostatnio int;
  zapisane int;
begin
  if uid is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if jsonb_typeof(p_zdarzenia) <> 'array' or jsonb_array_length(p_zdarzenia) > 100 then
    return jsonb_build_object('ok', false, 'code', 'bad_batch');
  end if;
  select count(*) into ostatnio from public.nauka_zdarzenia where user_id = uid and odebrane > now() - interval '1 hour';
  if ostatnio + jsonb_array_length(p_zdarzenia) > 1000 then return jsonb_build_object('ok', true, 'n', 0, 'code', 'limit'); end if;
  select coalesce((select p.wlaczone from public.nauka_profil_nauki p where p.user_id = uid), true) into wl;

  with wej as (
    select (e->>'id')::uuid as klient_id, e->>'typ' as typ, (e->>'kiedy')::timestamptz as kiedy, coalesce(e->'dane', '{}'::jsonb) as dane
    from jsonb_array_elements(p_zdarzenia) e
    where e->>'id' ~ '^[0-9a-fA-F-]{36}$' and typy ? (e->>'typ') and (wl or (typy->>(e->>'typ'))::boolean)
      and length(coalesce(e->'dane', '{}'::jsonb)::text) <= 2000
  ), ins as (
    insert into public.nauka_zdarzenia (user_id, klient_id, typ, kiedy, przesuniety_zegar, dane)
    select uid, klient_id, typ,
           least(greatest(kiedy, now() - interval '48 hours'), now() + interval '48 hours'),
           kiedy not between now() - interval '48 hours' and now() + interval '48 hours',
           dane
    from wej
    on conflict (user_id, klient_id) do nothing
    returning 1
  )
  select count(*) into zapisane from ins;

  delete from public.nauka_zdarzenia where user_id = uid and kiedy < now() - interval '400 days';
  return jsonb_build_object('ok', true, 'n', zapisane);
end;
$$;

create or replace function public.nauka_profil_nauki()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare uid uuid := auth.uid(); p public.nauka_profil_nauki;
begin
  if uid is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  select * into p from public.nauka_profil_nauki where user_id = uid;
  if not found then return jsonb_build_object('ok', true, 'profil', null); end if;
  return jsonb_build_object('ok', true, 'profil', jsonb_build_object(
    'deklaracje', p.deklaracje, 'startowe', p.startowe, 'z_danych', p.z_danych, 'wlaczone', p.wlaczone, 'test_at', p.test_at));
end;
$$;

-- Wynik testu: odpowiedzi (bez liczby ze stresu – tylko „wysoki albo nie”, liczy przeglądarka) i ustawienia startowe.
create or replace function public.nauka_profil_nauki_test(p_deklaracje jsonb, p_startowe jsonb, p_odpowiedzi jsonb)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if jsonb_typeof(p_deklaracje) <> 'object' or jsonb_typeof(p_startowe) <> 'object'
     or length(p_deklaracje::text) > 4000 or length(p_startowe::text) > 4000 or length(coalesce(p_odpowiedzi, '{}'::jsonb)::text) > 8000
     or p_deklaracje ? 'stress' then
    return jsonb_build_object('ok', false, 'code', 'bad_input');
  end if;
  insert into public.nauka_profil_nauki (user_id, deklaracje, startowe, test_odpowiedzi, test_at, updated_at)
  values (uid, p_deklaracje, p_startowe, p_odpowiedzi, now(), now())
  on conflict (user_id) do update set deklaracje = excluded.deklaracje, startowe = excluded.startowe,
    test_odpowiedzi = excluded.test_odpowiedzi, test_at = now(), updated_at = now();
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.nauka_profil_nauki_zmien(p_deklaracje jsonb)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if jsonb_typeof(p_deklaracje) <> 'object' or length(p_deklaracje::text) > 4000 or p_deklaracje ? 'stress' then
    return jsonb_build_object('ok', false, 'code', 'bad_input');
  end if;
  insert into public.nauka_profil_nauki (user_id, deklaracje) values (uid, p_deklaracje)
  on conflict (user_id) do update set deklaracje = public.nauka_profil_nauki.deklaracje || excluded.deklaracje, updated_at = now();
  return jsonb_build_object('ok', true);
end;
$$;

-- „Ucz się na moich danych”: wyłączone = bez zdarzeń opcjonalnych i bez modelu z danych.
create or replace function public.nauka_profil_nauki_wlacz(p_wlaczone boolean)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  insert into public.nauka_profil_nauki (user_id, wlaczone) values (uid, coalesce(p_wlaczone, true))
  on conflict (user_id) do update set wlaczone = excluded.wlaczone,
    z_danych = case when excluded.wlaczone then public.nauka_profil_nauki.z_danych else '{}'::jsonb end, updated_at = now();
  return jsonb_build_object('ok', true, 'wlaczone', coalesce(p_wlaczone, true));
end;
$$;

-- „Zacznij profil od nowa”: tylko model z danych; odpowiedzi z testu i postęp zostają.
create or replace function public.nauka_profil_nauki_od_nowa()
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  update public.nauka_profil_nauki set z_danych = '{}'::jsonb, updated_at = now() where user_id = uid;
  return jsonb_build_object('ok', true);
end;
$$;

-- „Usuń dane o aktywności”: zdarzenia i model z danych. Fiszki, lekcje i postęp (dokument progress) zostają.
create or replace function public.nauka_zdarzenia_usun()
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := auth.uid(); n int;
begin
  if uid is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  with d as (delete from public.nauka_zdarzenia where user_id = uid returning 1) select count(*) into n from d;
  update public.nauka_profil_nauki set z_danych = '{}'::jsonb, updated_at = now() where user_id = uid;
  return jsonb_build_object('ok', true, 'n', n);
end;
$$;

revoke all on function public.nauka_zdarzenia_typy() from public, anon;
revoke all on function public.nauka_zdarzenia_zapisz(jsonb) from public, anon;
revoke all on function public.nauka_profil_nauki() from public, anon;
revoke all on function public.nauka_profil_nauki_test(jsonb, jsonb, jsonb) from public, anon;
revoke all on function public.nauka_profil_nauki_zmien(jsonb) from public, anon;
revoke all on function public.nauka_profil_nauki_wlacz(boolean) from public, anon;
revoke all on function public.nauka_profil_nauki_od_nowa() from public, anon;
revoke all on function public.nauka_zdarzenia_usun() from public, anon;
grant execute on function public.nauka_zdarzenia_zapisz(jsonb) to authenticated;
grant execute on function public.nauka_profil_nauki() to authenticated;
grant execute on function public.nauka_profil_nauki_test(jsonb, jsonb, jsonb) to authenticated;
grant execute on function public.nauka_profil_nauki_zmien(jsonb) to authenticated;
grant execute on function public.nauka_profil_nauki_wlacz(boolean) to authenticated;
grant execute on function public.nauka_profil_nauki_od_nowa() to authenticated;
grant execute on function public.nauka_zdarzenia_usun() to authenticated;

notify pgrst, 'reload schema';
