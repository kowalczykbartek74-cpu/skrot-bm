-- Skrót v36: przypomnienia mailem (etap 7a „Systemy z Zdawalni w Skrócie”).
-- Wklej w Supabase → SQL Editor → Run, po v35. Można uruchamiać wielokrotnie.
-- Przed uruchomieniem włącz pg_cron i pg_net (Supabase → Integrations → Cron → Enable; Database → Extensions → pg_net),
-- a w Vault dodaj dwa sekrety (docs/zdawalni/etap-7.md): „przypomnienia_url” (adres funkcji) i „przypomnienia_cron” (losowy
-- ciąg, ten sam co sekret PRZYPOMNIENIA_CRON funkcji Edge). Bez nich wszystko się zapisuje, tylko maile same nie wychodzą.
--
-- Port matura-app: profiles.email_reminders / email_reminder_token / push_hour → nauka_przypomnienia,
-- notification_log → nauka_przypomnienia_log (jeden wiersz na wysłane przypomnienie, bez treści; unikalne user + dzień,
-- czyli najwyżej jedno dziennie przez wszystkie kanały, także push w etapie 7b).
-- Decyzja D6: domyślnie WYŁĄCZONE, domyślna godzina 18:00. Wybór treści: przypomnienia.js (strona) = logika.js (funkcja Edge).
--
-- Co robi baza:
-- 1. nauka_przypomnienia: ustawienia osoby (włącz/wyłącz, godzina co 30 min 6:00–22:00, co przypominać, język maila)
--    i „stan” = mały wyciąg z postępu, który liczy strona (terminy zaliczeń w ciągu 14 dni, liczby zaległych powtórek
--    i rewanży na dziś i 7 kolejnych dni, czy jest Zadanie dnia). Stan trzymamy tylko przy włączonych przypomnieniach.
--    token = losowy ciąg do linku „wyłącz” w mailu (nie wymaga logowania).
-- 2. nauka_przypomnienia_kandydaci (tylko service_role): osoby, którym teraz wypada godzina (czas polski, okno 60 min, więc
--    przerwa jednego uruchomienia nic nie gubi), bez przypomnienia dziś, w dziennym limicie (Resend Free: 100 maili na dobę
--    UTC razem z mailami logowania → limit_dzien w nauka_przypomnienia_cfg). Z każdą osobą: dni nauki z ostatnich 3 tygodni
--    (zdarzenie nauki albo powtórka; „już się dziś uczył” → brak maila), ostatni dzień nauki, 14 ostatnich przypomnień
--    (otwarte?) i aktualne daty terminów starosty, które są w stanie (przesunięty termin = nowa data, usunięty = znika).
-- 3. pg_cron co 15 min → nauka_przypomnienia_wyzwol() → pg_net POST do funkcji Edge z sekretem z Vault.

-- ---------- 1) ustawienia ----------
create table if not exists public.nauka_przypomnienia (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  rocznik_id  text references public.nauka_roczniki (id) on delete set null,
  wlaczone    boolean not null default false,
  godz        int not null default 1080 check (godz between 360 and 1320 and godz % 30 = 0),  -- minuta doby, 1080 = 18:00
  co          jsonb not null default '{"terminy": true, "powtorki": true, "zadanie": true}'::jsonb,
  jezyk       text not null default 'pl' check (jezyk in ('pl', 'en')),
  stan        jsonb not null default '{}'::jsonb check (octet_length(stan::text) < 6000),
  stan_at     timestamptz,
  token       text not null unique default encode(extensions.gen_random_bytes(18), 'hex'),
  wlaczone_at timestamptz,
  wypisane_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists nauka_przypomnienia_godz on public.nauka_przypomnienia (godz) where wlaczone;
alter table public.nauka_przypomnienia enable row level security;
revoke all on public.nauka_przypomnienia from anon, authenticated;

-- ---------- log wysłanych (port notification_log) ----------
create table if not exists public.nauka_przypomnienia_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  rocznik_id  text,
  dzien       date not null,
  kanal       text not null default 'email' check (kanal in ('email', 'push')),
  rodzaj      text not null check (rodzaj ~ '^[a-z_]{2,20}$'),
  wyslano_at  timestamptz not null default now(),
  otwarte_at  timestamptz,
  unique (user_id, dzien)
);
create index if not exists nauka_przypomnienia_log_wyslano on public.nauka_przypomnienia_log (wyslano_at);
alter table public.nauka_przypomnienia_log enable row level security;
revoke all on public.nauka_przypomnienia_log from anon, authenticated;

create or replace function public.nauka_przypomnienia_cfg() returns jsonb
language sql immutable set search_path = '' as $$
  -- limit_dzien: najwyżej tyle przypomnień na dobę UTC (Resend Free = 100 maili na dobę razem z mailami logowania).
  -- Po przejściu na Resend Pro podnieś (np. 1500). okno_min: jak długo po wybranej godzinie mail może jeszcze wyjść.
  select '{"limit_dzien": 60, "okno_min": 60, "log_dni": 180}'::jsonb
$$;

-- Ustawienia zalogowanej osoby (domyślne, gdy jeszcze nic nie zapisała).
create or replace function public.nauka_przypomnienia_moje() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r public.nauka_przypomnienia;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  select * into r from public.nauka_przypomnienia where user_id = auth.uid();
  if not found then
    return jsonb_build_object('ok', true, 'wlaczone', false, 'godz', 1080, 'co', '{"terminy": true, "powtorki": true, "zadanie": true}'::jsonb, 'jezyk', 'pl', 'nowe', true);
  end if;
  return jsonb_build_object('ok', true, 'wlaczone', r.wlaczone, 'godz', r.godz, 'co', r.co, 'jezyk', r.jezyk, 'nowe', false,
    'wypisane', r.wypisane_at is not null and not r.wlaczone);
end $$;

-- Zapis ustawień: p = { wlaczone?, godz?, co?: {terminy, powtorki, zadanie}, jezyk? }. Brak pola = bez zmian.
-- Wyłączenie czyści stan (bez przypomnień baza nie trzyma wyciągu z postępu).
create or replace function public.nauka_przypomnienia_ustaw(p jsonb) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare u uuid := auth.uid(); w boolean; g int; c jsonb; j text; rid text; stare public.nauka_przypomnienia;
begin
  if u is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if jsonb_typeof(p) is distinct from 'object' then return jsonb_build_object('ok', false, 'code', 'bad_input'); end if;
  select * into stare from public.nauka_przypomnienia where user_id = u;
  w := case when jsonb_typeof(p->'wlaczone') = 'boolean' then (p->>'wlaczone')::boolean else coalesce(stare.wlaczone, false) end;
  if p ? 'godz' then
    if jsonb_typeof(p->'godz') <> 'number' or (p->>'godz') !~ '^[0-9]{3,4}$' then return jsonb_build_object('ok', false, 'code', 'bad_input'); end if;
    g := (p->>'godz')::int;
    if g < 360 or g > 1320 or g % 30 <> 0 then return jsonb_build_object('ok', false, 'code', 'bad_input'); end if;
  else g := coalesce(stare.godz, 1080); end if;
  if p ? 'co' then
    if jsonb_typeof(p->'co') <> 'object' then return jsonb_build_object('ok', false, 'code', 'bad_input'); end if;
    c := jsonb_build_object('terminy', case when jsonb_typeof(p->'co'->'terminy') = 'boolean' then (p->'co'->>'terminy')::boolean else true end,
                            'powtorki', case when jsonb_typeof(p->'co'->'powtorki') = 'boolean' then (p->'co'->>'powtorki')::boolean else true end,
                            'zadanie', case when jsonb_typeof(p->'co'->'zadanie') = 'boolean' then (p->'co'->>'zadanie')::boolean else true end);
  else c := coalesce(stare.co, '{"terminy": true, "powtorki": true, "zadanie": true}'::jsonb); end if;
  j := case when p->>'jezyk' in ('pl', 'en') then p->>'jezyk' else coalesce(stare.jezyk, 'pl') end;
  select x.rocznik_id into rid from public.nauka_profil x where x.user_id = u;
  insert into public.nauka_przypomnienia as t (user_id, rocznik_id, wlaczone, godz, co, jezyk, wlaczone_at)
  values (u, rid, w, g, c, j, case when w then now() end)
  on conflict (user_id) do update set rocznik_id = excluded.rocznik_id, wlaczone = excluded.wlaczone, godz = excluded.godz, co = excluded.co,
    jezyk = excluded.jezyk, updated_at = now(),
    wlaczone_at = case when excluded.wlaczone and not t.wlaczone then now() else t.wlaczone_at end,
    wypisane_at = case when excluded.wlaczone then null else t.wypisane_at end,
    stan = case when excluded.wlaczone then t.stan else '{}'::jsonb end,
    stan_at = case when excluded.wlaczone then t.stan_at end;
  return public.nauka_przypomnienia_moje();
end $$;

-- Stan liczony na stronie (przypomnienia.js stanZ). Tylko przy włączonych przypomnieniach.
create or replace function public.nauka_przypomnienia_stan(p_stan jsonb) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if jsonb_typeof(p_stan) is distinct from 'object' or octet_length(p_stan::text) >= 6000 or coalesce(p_stan->>'od', '') !~ '^\d{4}-\d{2}-\d{2}$'
     or jsonb_typeof(coalesce(p_stan->'ter', '[]')) <> 'array' or jsonb_typeof(coalesce(p_stan->'pow', '[]')) <> 'array' or jsonb_typeof(coalesce(p_stan->'rew', '[]')) <> 'array' then
    return jsonb_build_object('ok', false, 'code', 'bad_input');
  end if;
  update public.nauka_przypomnienia set stan = p_stan, stan_at = now() where user_id = auth.uid() and wlaczone;
  if not found then return jsonb_build_object('ok', false, 'code', 'off'); end if;
  return jsonb_build_object('ok', true);
end $$;

-- Kliknięcie w mailu (?pz=<id>): przypomnienie pomogło (dławienie liczy zignorowane z rzędu).
create or replace function public.nauka_przypomnienie_otwarte(p_id uuid) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  update public.nauka_przypomnienia_log set otwarte_at = now() where id = p_id and user_id = auth.uid() and otwarte_at is null;
  return jsonb_build_object('ok', true, 'pierwsze', found);
end $$;

revoke execute on function public.nauka_przypomnienia_moje(), public.nauka_przypomnienia_ustaw(jsonb), public.nauka_przypomnienia_stan(jsonb),
  public.nauka_przypomnienie_otwarte(uuid) from public, anon;
grant execute on function public.nauka_przypomnienia_moje(), public.nauka_przypomnienia_ustaw(jsonb), public.nauka_przypomnienia_stan(jsonb),
  public.nauka_przypomnienie_otwarte(uuid) to authenticated;

-- ---------- 2) dla funkcji Edge (service_role) ----------
create or replace function public.nauka_przypomnienia_kandydaci(p_teraz timestamptz default now()) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  cfg jsonb := public.nauka_przypomnienia_cfg();
  lokal timestamp := p_teraz at time zone 'Europe/Warsaw';
  d date := lokal::date;
  m int := extract(hour from lokal)::int * 60 + extract(minute from lokal)::int;
  okno int := (cfg->>'okno_min')::int;
  wyslane int; zostalo int; osoby jsonb;
begin
  -- doba UTC, jak licznik Resend
  select count(*) into wyslane from public.nauka_przypomnienia_log l
   where l.kanal = 'email' and l.wyslano_at >= date_trunc('day', p_teraz at time zone 'UTC') at time zone 'UTC';
  zostalo := greatest(0, (cfg->>'limit_dzien')::int - wyslane);
  select coalesce(jsonb_agg(o order by (o->>'godz')::int, o->>'user_id'), '[]'::jsonb) into osoby from (
    select jsonb_build_object(
      'user_id', p.user_id, 'email', u.email, 'token', p.token, 'jezyk', p.jezyk, 'co', p.co, 'stan', p.stan, 'godz', p.godz,
      'rocznik_id', p.rocznik_id,
      'dni_nauki', (select coalesce(jsonb_agg(distinct x.dz), '[]'::jsonb) from (
          select to_char((z.kiedy at time zone 'Europe/Warsaw')::date, 'YYYY-MM-DD') dz from public.nauka_zdarzenia z
           where z.user_id = p.user_id and z.typ <> 'profile_test' and z.kiedy >= (d - 21)::timestamp at time zone 'Europe/Warsaw'
          union
          select to_char((w.at at time zone 'Europe/Warsaw')::date, 'YYYY-MM-DD') from public.nauka_powtorki_log w
           where w.user_id = p.user_id and w.at >= (d - 21)::timestamp at time zone 'Europe/Warsaw') x),
      'ostatni', (select to_char(max(dd), 'YYYY-MM-DD') from (
          select max((z.kiedy at time zone 'Europe/Warsaw')::date) dd from public.nauka_zdarzenia z
           where z.user_id = p.user_id and z.typ <> 'profile_test' and z.kiedy < d::timestamp at time zone 'Europe/Warsaw'
          union all
          select max((w.at at time zone 'Europe/Warsaw')::date) from public.nauka_powtorki_log w
           where w.user_id = p.user_id and w.at < d::timestamp at time zone 'Europe/Warsaw') y),
      'historia', (select coalesce(jsonb_agg(jsonb_build_object('day', to_char(h.dzien, 'YYYY-MM-DD'), 'opened', h.otwarte_at is not null) order by h.dzien desc), '[]'::jsonb)
          from (select l.dzien, l.otwarte_at from public.nauka_przypomnienia_log l where l.user_id = p.user_id and l.dzien < d order by l.dzien desc limit 14) h),
      'dl', (select coalesce(jsonb_object_agg(x.id, jsonb_build_object('date', x.data->>'date', 'type', x.data->>'type', 'approx', coalesce(x.data->'approx', 'false'::jsonb))), '{}'::jsonb)
          from public.nauka_docs x where x.kolekcja = 'deadlines'
           and x.id in (select t->>'dl' from jsonb_array_elements(case when jsonb_typeof(p.stan->'ter') = 'array' then p.stan->'ter' else '[]'::jsonb end) t))
    ) o
    from public.nauka_przypomnienia p join auth.users u on u.id = p.user_id
    where p.wlaczone and coalesce(u.email, '') <> '' and p.godz <= m and m < p.godz + okno
      and not exists (select 1 from public.nauka_przypomnienia_log l where l.user_id = p.user_id and l.dzien = d)
      and not exists (select 1 from public.nauka_konta k where k.user_id = p.user_id and k.zablokowane)
    order by p.godz, p.user_id
    limit zostalo
  ) q;
  return jsonb_build_object('ok', true, 'dzien', to_char(d, 'YYYY-MM-DD'), 'minuta', m, 'zostalo', zostalo, 'osoby', osoby);
end $$;

-- Wpis przed wysłaniem (unikalne user + dzień → drugi tego dnia się nie zapisze i nie wyjdzie). null = już było.
create or replace function public.nauka_przypomnienia_log_dodaj(p_user uuid, p_dzien date, p_rodzaj text, p_kanal text default 'email') returns uuid
language plpgsql volatile security definer set search_path = public as $$
declare v uuid;
begin
  insert into public.nauka_przypomnienia_log (user_id, rocznik_id, dzien, kanal, rodzaj)
  values (p_user, (select x.rocznik_id from public.nauka_przypomnienia x where x.user_id = p_user), p_dzien, p_kanal, left(p_rodzaj, 20))
  on conflict (user_id, dzien) do nothing returning id into v;
  return v;
end $$;

-- Mail nie wyszedł: wpis znika, następne uruchomienie (w oknie godziny) spróbuje jeszcze raz.
create or replace function public.nauka_przypomnienia_log_usun(p_id uuid) returns void
language sql volatile security definer set search_path = public as $$
  delete from public.nauka_przypomnienia_log where id = p_id and otwarte_at is null
$$;

-- Wypisanie linkiem z maila (bez logowania): wyłącza przypomnienia i czyści stan.
create or replace function public.nauka_przypomnienia_wypisz(p_token text) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
begin
  if coalesce(p_token, '') !~ '^[A-Za-z0-9_-]{20,80}$' then return jsonb_build_object('ok', false, 'code', 'token'); end if;
  update public.nauka_przypomnienia set wlaczone = false, wypisane_at = now(), stan = '{}'::jsonb, stan_at = null, updated_at = now()
   where token = p_token;
  return jsonb_build_object('ok', found);
end $$;

-- Uruchomienie z pg_cron: POST do funkcji Edge (pg_net), adres i sekret z Vault. Przy okazji czyści stary log.
create or replace function public.nauka_przypomnienia_wyzwol() returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare v_url text; v_sekret text; v_id bigint;
begin
  delete from public.nauka_przypomnienia_log where dzien < current_date - ((public.nauka_przypomnienia_cfg()->>'log_dni')::int);
  if to_regclass('vault.decrypted_secrets') is null then return jsonb_build_object('ok', false, 'code', 'no_vault'); end if;
  execute $q$select (select decrypted_secret from vault.decrypted_secrets where name = 'przypomnienia_url'),
                    (select decrypted_secret from vault.decrypted_secrets where name = 'przypomnienia_cron')$q$ into v_url, v_sekret;
  if v_url is null or v_sekret is null then return jsonb_build_object('ok', false, 'code', 'no_secret'); end if;
  if to_regprocedure('net.http_post(text,jsonb,jsonb,jsonb,integer)') is null then return jsonb_build_object('ok', false, 'code', 'no_pg_net'); end if;
  execute $q$select net.http_post(url := $1, body := '{}'::jsonb, headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', $2), timeout_milliseconds := 60000)$q$
    into v_id using v_url, v_sekret;
  return jsonb_build_object('ok', true, 'request_id', v_id);
end $$;

revoke execute on function public.nauka_przypomnienia_kandydaci(timestamptz), public.nauka_przypomnienia_log_dodaj(uuid, date, text, text),
  public.nauka_przypomnienia_log_usun(uuid), public.nauka_przypomnienia_wypisz(text), public.nauka_przypomnienia_wyzwol() from public, anon, authenticated;
grant execute on function public.nauka_przypomnienia_kandydaci(timestamptz), public.nauka_przypomnienia_log_dodaj(uuid, date, text, text),
  public.nauka_przypomnienia_log_usun(uuid), public.nauka_przypomnienia_wypisz(text) to service_role;

-- ---------- 3) co 15 minut ----------
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_net') then
    create extension if not exists pg_net;
  end if;
  if exists (select 1 from pg_extension where extname = 'pg_cron') or exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron with schema pg_catalog;
    if exists (select 1 from cron.job where jobname = 'skrot-przypomnienia') then perform cron.unschedule('skrot-przypomnienia'); end if;
    perform cron.schedule('skrot-przypomnienia', '*/15 * * * *', 'select public.nauka_przypomnienia_wyzwol()');
    raise notice 'OK przypomnienia: zadanie skrot-przypomnienia co 15 min';
  else
    raise notice 'pg_cron niedostępny: włącz Integrations → Cron i uruchom ten plik jeszcze raz';
  end if;
end $$;

notify pgrst, 'reload schema';
