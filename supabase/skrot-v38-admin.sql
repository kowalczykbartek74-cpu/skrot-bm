-- Skrót v38: panel administratora (etap 11 „Systemy z Zdawalni w Skrócie”): karnety, źródła wejść, lejek według źródła.
-- Wklej w Supabase → SQL Editor → Run, po v37. Można uruchamiać wielokrotnie.
--
-- Port matura-app app/admin/karnety (ręczne nadanie dostępu, lista, cofnięcie) i app/admin/zaproszenia (linki z kodem → tu linki
-- ze źródłem ?z=…). „Podgląd jako” nie potrzebuje bazy: działa tylko w przeglądarce administratora (admin.js) i blokuje zapisy.
--
-- 1. Karnet = wiersz w nauka_dostep ze źródłem 'karnet' (+ rocznik, powód, kto wydał, kiedy). Dostęp działa jak opłacony
--    (nauka_platny_konto patrzy tylko na do_kiedy), bez Stripe. Wydaje WYŁĄCZNIE administrator (nauka_admin(), decyzja D10).
--    E-mail jest kluczem nauka_dostep, więc:
--      • ktoś ma TRWAJĄCY dostęp z innego źródła (Stripe, ręczny wpis) → odmowa 'ma_dostep' z datą (karnet niczego nie skraca
--        ani nie nadpisuje płatnego dostępu);
--      • dostęp z innego źródła już wygasł → wiersz zmienia się w karnet, kolumny stripe_* zostają (lejek dalej widzi zakup);
--      • ma karnet (trwający, wygasły albo cofnięty) → nowa data, rocznik i powód.
--    Cofnięcie dotyczy tylko wierszy 'karnet': do_kiedy = wczoraj, cofniety_at = teraz. Dostępu ze Stripe nie da się cofnąć tutaj.
--    Gdy osoba z karnetem zapłaci w Stripe, webhook nadpisuje źródło na 'stripe…' (do_kiedy tylko rośnie) i karnet znika z listy cofania.
-- 2. Źródło wejścia: link ?z=<źródło> (np. ig-zarzadzanie, plakat-cukrowa). Pierwsze źródło wizyty pamięta przeglądarka
--    (sessionStorage, admin.js) i dopisuje je do: zapisu na listę oczekujących (nauka_oczekujacy.zrodlo, etap 5), konta
--    (nauka_konto_zrodlo, raz, tylko dla świeżego konta), okresu próbnego (nauka_proby.zrodlo, wyzwalacz) i zakupu
--    (nauka_dostep.zrodlo_wejscia, webhook Stripe z client_reference_id „<konto>__<kod>__<źródło>”). Kody polecające (v17) działają
--    jak dotąd, obok źródła.
-- 3. Lejek z v35 dostaje w podsumowaniu „*” pole 'zrodla': { '<źródło>': { d28: {…}, wszystko: {…} } } z krokami wejścia → konta →
--    wybór kierunku → okres próbny → zakup i potwierdzonymi zapisami na listę. '' = bez źródła. Panel ukrywa liczby < 5.
-- Usuwanie konta (v32) kasuje nauka_konto_zrodlo (kolumna user_id) i wiersz nauka_dostep po e-mailu, także karnet.

-- ---------- 1) karnety: kolumny w nauka_dostep ----------
alter table public.nauka_dostep add column if not exists rocznik_id text;
alter table public.nauka_dostep add column if not exists powod text;
alter table public.nauka_dostep add column if not exists wydal text;
alter table public.nauka_dostep add column if not exists wydano_at timestamptz;
alter table public.nauka_dostep add column if not exists cofniety_at timestamptz;
alter table public.nauka_dostep add column if not exists zrodlo_wejscia text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'nauka_dostep_zrodlo_wejscia_chk') then
    alter table public.nauka_dostep add constraint nauka_dostep_zrodlo_wejscia_chk check (zrodlo_wejscia is null or zrodlo_wejscia ~ '^[a-z0-9._-]{1,40}$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'nauka_dostep_powod_chk') then
    alter table public.nauka_dostep add constraint nauka_dostep_powod_chk check (powod is null or length(powod) <= 200);
  end if;
end $$;
create index if not exists nauka_dostep_karnet on public.nauka_dostep (wydano_at desc) where zrodlo = 'karnet';

-- Wydaje albo zmienia karnet. p_do = ostatni dzień dostępu (dziś … dziś + 400 dni). Błędy (ok:false, code):
-- not_admin | email | data | rocznik | powod | ma_dostep (z do_kiedy i zrodlo).
create or replace function public.nauka_admin_karnet_wydaj(p_email text, p_do date, p_rocznik text default null, p_powod text default null) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  em text := lower(trim(coalesce(p_email, '')));
  pw text := nullif(trim(coalesce(p_powod, '')), '');
  rk text := nullif(trim(coalesce(p_rocznik, '')), '');
  t date := (now() at time zone 'Europe/Warsaw')::date;
  cur public.nauka_dostep; uid uuid; nowy boolean;
begin
  if not public.nauka_admin() then return jsonb_build_object('ok', false, 'code', 'not_admin'); end if;
  if em !~ '^[^@\s]+@[^@\s]+\.[a-z]{2,}$' or length(em) > 254 then return jsonb_build_object('ok', false, 'code', 'email'); end if;
  if p_do is null or p_do < t or p_do > t + 400 then return jsonb_build_object('ok', false, 'code', 'data'); end if;
  if rk is not null and not exists (select 1 from public.nauka_roczniki r where r.id = rk) then return jsonb_build_object('ok', false, 'code', 'rocznik'); end if;
  if pw is null or length(pw) < 3 or length(pw) > 200 then return jsonb_build_object('ok', false, 'code', 'powod'); end if;
  select * into cur from public.nauka_dostep d where d.email = em for update;
  if found and coalesce(cur.zrodlo, '') <> 'karnet' and cur.do_kiedy >= current_date then
    return jsonb_build_object('ok', false, 'code', 'ma_dostep', 'do_kiedy', cur.do_kiedy, 'zrodlo', cur.zrodlo);
  end if;
  nowy := not found;
  select u.id into uid from auth.users u where lower(u.email) = em limit 1;
  insert into public.nauka_dostep as d (email, do_kiedy, zrodlo, user_id, rocznik_id, powod, wydal, wydano_at, cofniety_at)
  values (em, p_do, 'karnet', uid, rk, pw, public.nauka_email(), now(), null)
  on conflict (email) do update set do_kiedy = excluded.do_kiedy, zrodlo = 'karnet', user_id = coalesce(excluded.user_id, d.user_id),
    rocznik_id = excluded.rocznik_id, powod = excluded.powod, wydal = excluded.wydal, wydano_at = excluded.wydano_at, cofniety_at = null;
  return jsonb_build_object('ok', true, 'email', em, 'do_kiedy', p_do, 'nowy', nowy, 'konto', uid is not null);
end $$;

-- Cofa karnet (tylko źródło 'karnet'). Błędy: not_admin | brak | nie_karnet | juz_cofniety.
create or replace function public.nauka_admin_karnet_cofnij(p_email text) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare em text := lower(trim(coalesce(p_email, ''))); cur public.nauka_dostep;
begin
  if not public.nauka_admin() then return jsonb_build_object('ok', false, 'code', 'not_admin'); end if;
  select * into cur from public.nauka_dostep d where d.email = em for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'brak'); end if;
  if coalesce(cur.zrodlo, '') <> 'karnet' then return jsonb_build_object('ok', false, 'code', 'nie_karnet', 'zrodlo', cur.zrodlo); end if;
  if cur.cofniety_at is not null then return jsonb_build_object('ok', false, 'code', 'juz_cofniety'); end if;
  update public.nauka_dostep set do_kiedy = least(do_kiedy, current_date - 1), cofniety_at = now() where email = em;
  return jsonb_build_object('ok', true, 'email', em);
end $$;

-- Lista karnetów (ostatnie 300) i liczby. Stan: aktywny | wygasl | cofniety.
create or replace function public.nauka_admin_karnety() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.nauka_admin() then return jsonb_build_object('ok', false, 'code', 'not_admin'); end if;
  return jsonb_build_object('ok', true, 'dzis', current_date,
    'aktywne', (select count(*) from public.nauka_dostep d where d.zrodlo = 'karnet' and d.cofniety_at is null and d.do_kiedy >= current_date),
    'karnety', coalesce((select jsonb_agg(x order by x.wydano_at desc nulls last) from (
      select d.email, d.do_kiedy, d.rocznik_id, d.powod, d.wydal, d.wydano_at, d.cofniety_at,
             case when d.cofniety_at is not null then 'cofniety' when d.do_kiedy >= current_date then 'aktywny' else 'wygasl' end as stan,
             exists (select 1 from auth.users u where u.id = d.user_id or lower(u.email) = d.email) as konto
      from public.nauka_dostep d where d.zrodlo = 'karnet' order by d.wydano_at desc nulls last limit 300) x), '[]'::jsonb));
end $$;

revoke execute on function public.nauka_admin_karnet_wydaj(text, date, text, text), public.nauka_admin_karnet_cofnij(text), public.nauka_admin_karnety() from public, anon;
grant execute on function public.nauka_admin_karnet_wydaj(text, date, text, text), public.nauka_admin_karnet_cofnij(text), public.nauka_admin_karnety() to authenticated;

-- ---------- 2) źródło konta i okresu próbnego ----------
-- zrodlo = pierwsze źródło przy zakładaniu konta (raz, '' = bez źródła); wizyta = pierwsze źródło ostatniej wizyty z linkiem.
create table if not exists public.nauka_konto_zrodlo (
  user_id   uuid primary key,
  zrodlo    text not null default '' check (zrodlo = '' or zrodlo ~ '^[a-z0-9._-]{1,40}$'),
  wizyta    text check (wizyta is null or wizyta ~ '^[a-z0-9._-]{1,40}$'),
  wizyta_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.nauka_konto_zrodlo enable row level security;
revoke all on public.nauka_konto_zrodlo from anon, authenticated;

-- Przeglądarka woła raz na wizytę, gdy wizyta ma źródło. Konto założone w ciągu 2 dni dostaje je jako źródło konta
-- (starsze konto: źródło konta zostaje puste, liczy się tylko wizyta, np. przy okresie próbnym). Odpowiedź bez danych.
create or replace function public.nauka_zrodlo_ustaw(p_zrodlo text) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare uid uuid := auth.uid(); z text := lower(coalesce(p_zrodlo, '')); swieze boolean;
begin
  if uid is null then return jsonb_build_object('ok', false, 'code', 'nie_zalogowany'); end if;
  if z !~ '^[a-z0-9._-]{1,40}$' then return jsonb_build_object('ok', false, 'code', 'zrodlo'); end if;
  select u.created_at > now() - interval '2 days' into swieze from auth.users u where u.id = uid;
  insert into public.nauka_konto_zrodlo as k (user_id, zrodlo, wizyta, wizyta_at)
  values (uid, case when coalesce(swieze, false) then z else '' end, z, now())
  on conflict (user_id) do update set wizyta = excluded.wizyta, wizyta_at = excluded.wizyta_at;
  return jsonb_build_object('ok', true);
end $$;
revoke execute on function public.nauka_zrodlo_ustaw(text) from public, anon;
grant execute on function public.nauka_zrodlo_ustaw(text) to authenticated;

-- Okres próbny dostaje źródło sam (nauka_proba_start z v16 bez zmian): źródło wizyty z ostatniego dnia, inaczej źródło konta.
alter table public.nauka_proby add column if not exists zrodlo text;
create or replace function public.nauka_proby_zrodlo() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.zrodlo is null then
    select coalesce(case when k.wizyta_at > now() - interval '1 day' then k.wizyta end, nullif(k.zrodlo, '')) into new.zrodlo
    from public.nauka_konto_zrodlo k where k.user_id = new.user_id;
  end if;
  return new;
end $$;
revoke execute on function public.nauka_proby_zrodlo() from public, anon, authenticated;
drop trigger if exists nauka_proby_zrodlo on public.nauka_proby;
create trigger nauka_proby_zrodlo before insert on public.nauka_proby for each row execute function public.nauka_proby_zrodlo();

-- ---------- 3) lejek według źródła ----------
-- Zakup = dostęp ze Stripe (także wiersz, który po wygaśnięciu zmienił się w karnet: zostają kolumny stripe_*). Karnet to nie zakup.
create or replace function public.nauka_lejek_konta()
returns table (user_id uuid, rocznik_id text, d0 date, wybrany boolean, proba boolean, zakup boolean)
language sql stable security definer set search_path = public as $$
  select u.id, coalesce(p.rocznik_id, ''), (u.created_at at time zone 'Europe/Warsaw')::date,
         p.rocznik_wybrany_at is not null,
         exists (select 1 from public.nauka_proby x where x.user_id = u.id),
         exists (select 1 from public.nauka_dostep d where (d.user_id = u.id or d.email = lower(u.email))
                   and (d.zrodlo like 'stripe%' or d.stripe_session is not null or d.stripe_subscription is not null))
  from auth.users u left join public.nauka_profil p on p.user_id = u.id
  where not exists (select 1 from public.nauka_admini a where a.email = lower(coalesce(u.email, '')))
$$;

-- Wszystkie roczniki razem, na źródło: wejścia (sumy dzienne), konta ze źródłem konta, wybór kierunku, okres próbny ze źródłem
-- próby, zakup ze źródłem zakupu (a bez niego ze źródłem konta), potwierdzone zapisy na listę. Okna: 28 dni i od początku.
-- Najwyżej 60 źródeł (od największej liczby wejść); reszta i tak jest w 'inne' po stronie nauka_wejscie.
create or replace function public.nauka_lejek_zrodla_dane() returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare t date := (now() at time zone 'Europe/Warsaw')::date; w int; out jsonb := '{}'::jsonb; x jsonb;
begin
  create temp table if not exists lejek_z (user_id uuid primary key, zrodlo text, d0 date, wybrany boolean, zakup boolean, zakup_z text, zakup_d date) on commit drop;
  truncate pg_temp.lejek_z;
  insert into pg_temp.lejek_z
  select k.user_id, coalesce(nullif(kz.zrodlo, ''), ''), k.d0, k.wybrany, k.zakup,
         (select coalesce(d.zrodlo_wejscia, nullif(kz.zrodlo, ''), '') from public.nauka_dostep d
           where (d.user_id = k.user_id or d.email = lower(u.email)) and (d.zrodlo like 'stripe%' or d.stripe_session is not null or d.stripe_subscription is not null) limit 1),
         (select (d.created_at at time zone 'Europe/Warsaw')::date from public.nauka_dostep d
           where (d.user_id = k.user_id or d.email = lower(u.email)) and (d.zrodlo like 'stripe%' or d.stripe_session is not null or d.stripe_subscription is not null) limit 1)
  from public.nauka_lejek_konta() k join auth.users u on u.id = k.user_id
  left join public.nauka_konto_zrodlo kz on kz.user_id = k.user_id;

  foreach w in array array[28, 0] loop
    select coalesce(jsonb_object_agg(s.z, jsonb_build_object(
             'wejscia', (select coalesce(sum(e.wejscia), 0) from public.nauka_wejscia_dzien e where e.zrodlo = s.z and (w = 0 or e.dzien > t - w)),
             'konta', (select count(*) from pg_temp.lejek_z k where k.zrodlo = s.z and (w = 0 or k.d0 > t - w)),
             'wybor', (select count(*) from pg_temp.lejek_z k where k.zrodlo = s.z and k.wybrany and (w = 0 or k.d0 > t - w)),
             'proba', (select count(*) from public.nauka_proby p join pg_temp.lejek_z k on k.user_id = p.user_id
                        where coalesce(p.zrodlo, '') = s.z and (w = 0 or (p.od at time zone 'Europe/Warsaw')::date > t - w)),
             'zakup', (select count(*) from pg_temp.lejek_z k where k.zakup and k.zakup_z = s.z and (w = 0 or k.zakup_d > t - w)),
             'lista', (select count(*) from public.nauka_oczekujacy o where o.status = 'confirmed' and coalesce(o.zrodlo, '') = s.z
                        and (w = 0 or o.confirmed_at > now() - make_interval(days => w))))), '{}'::jsonb)
      into x
    from (select q.z from (
            select e.zrodlo as z, sum(e.wejscia) as n from public.nauka_wejscia_dzien e group by 1
            union all select k.zrodlo, 0 from pg_temp.lejek_z k
            union all select coalesce(p.zrodlo, ''), 0 from public.nauka_proby p
            union all select coalesce(o.zrodlo, ''), 0 from public.nauka_oczekujacy o where o.status = 'confirmed') q
          group by q.z order by sum(q.n) desc, q.z limit 60) s;
    out := out || jsonb_build_object(case when w = 0 then 'wszystko' else 'd' || w end, x);
  end loop;
  -- { d28: { źródło: kroki }, wszystko: {…} } → { źródło: { d28: kroki, wszystko: kroki } }
  return coalesce((select jsonb_object_agg(k.z, jsonb_build_object('d28', out->'d28'->k.z, 'wszystko', out->'wszystko'->k.z))
                   from jsonb_object_keys(out->'wszystko') k(z)), '{}'::jsonb);
end $$;

-- Nocne liczenie (v35) + źródła w podsumowaniu „*”. Reszta bez zmian.
create or replace function public.nauka_lejek_policz() returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare t date := (now() at time zone 'Europe/Warsaw')::date; r text; n int := 0; dane jsonb;
begin
  for r in select '*' union select x.id from public.nauka_roczniki x
           union select distinct k.rocznik_id from public.nauka_lejek_konta() k loop
    dane := public.nauka_lejek_dane(r);
    if r = '*' then dane := dane || jsonb_build_object('zrodla', public.nauka_lejek_zrodla_dane()); end if;
    insert into public.nauka_lejek_dzien (dzien, rocznik_id, dane, policzono_at) values (t, r, dane, now())
    on conflict (dzien, rocznik_id) do update set dane = excluded.dane, policzono_at = excluded.policzono_at;
    n := n + 1;
  end loop;
  delete from public.nauka_lejek_dzien where dzien < t - 400;
  delete from public.nauka_wejscia_dzien where dzien < t - 400;
  return jsonb_build_object('ok', true, 'dzien', t, 'roczniki', n);
end $$;

revoke execute on function public.nauka_lejek_konta(), public.nauka_lejek_zrodla_dane(), public.nauka_lejek_policz() from public, anon, authenticated;
grant execute on function public.nauka_lejek_policz() to service_role;

notify pgrst, 'reload schema';
