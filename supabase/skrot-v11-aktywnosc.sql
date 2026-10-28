-- Skrót BM v11: panel starosty „Aktywność” – kto jest teraz na stronie i kto kiedy się logował.
--   • nauka_obecny()      – sygnał z każdej zalogowanej karty (co 45 s, gdy karta jest na wierzchu). Dotyczy wszystkich
--                           zalogowanych: płacących, bez dostępu i starosty. Po 30 min ciszy kolejny sygnał zaczyna nową wizytę.
--   • nauka_zalogowano()  – strona woła ją raz po udanym logowaniu (kod z maila, hasło albo link z maila).
--   • nauka_admin_aktywnosc() – dane dla panelu: online teraz, ostatnie logowania, ostatnie wizyty i lista kont
--                           (z datą ostatniego logowania z Supabase Auth, więc widać też logowania sprzed tej wersji).
-- Historia logowań i wizyt jest trzymana 12 miesięcy (polityka prywatności, „Jak długo przechowujemy dane”).
-- Wymaga nauka.sql i skrot-v8-urzadzenia.sql. Wklej w Supabase → SQL Editor → Run. Można uruchamiać wielokrotnie.
-- Strona działa też bez tego pliku (panel pokaże wtedy prośbę o jego uruchomienie).

-- ---------- Tabele ----------
create table if not exists public.nauka_obecnosc (
  user_id    uuid not null,
  device_id  text not null default '',
  email      text not null default '',
  nazwa      text not null default '',
  ip         text,
  wizyta_id  bigint,
  od         timestamptz not null default now(),   -- początek bieżącej wizyty
  last_seen  timestamptz not null default now(),
  primary key (user_id, device_id)
);
create index if not exists nauka_obecnosc_seen on public.nauka_obecnosc (last_seen desc);

create table if not exists public.nauka_wizyty (
  id         bigint generated always as identity primary key,
  user_id    uuid not null,
  email      text not null default '',
  device_id  text,
  nazwa      text not null default '',
  ip         text,
  od         timestamptz not null default now(),
  koniec     timestamptz not null default now()
);
create index if not exists nauka_wizyty_od on public.nauka_wizyty (od desc);
create index if not exists nauka_wizyty_user on public.nauka_wizyty (user_id, od desc);

create table if not exists public.nauka_logowania (
  id         bigint generated always as identity primary key,
  user_id    uuid not null,
  email      text not null default '',
  metoda     text not null default '',   -- kod | haslo | link
  device_id  text,
  nazwa      text not null default '',
  ip         text,
  at         timestamptz not null default now()
);
create index if not exists nauka_logowania_at on public.nauka_logowania (at desc);
create index if not exists nauka_logowania_user on public.nauka_logowania (user_id, at desc);

alter table public.nauka_obecnosc  enable row level security;
alter table public.nauka_wizyty    enable row level security;
alter table public.nauka_logowania enable row level security;
revoke all on public.nauka_obecnosc, public.nauka_wizyty, public.nauka_logowania from anon, authenticated;
-- brak reguł: tabele czytają i zmieniają tylko funkcje poniżej

-- ---------- Ustawienia ----------
-- „Online”: sygnał w ciągu ostatnich 2 minut (strona wysyła go co 45 s). Nowa wizyta: po 30 minutach ciszy.
create or replace function public.nauka_online_okno() returns interval language sql immutable as $$ select interval '2 minutes' $$;
create or replace function public.nauka_wizyta_przerwa() returns interval language sql immutable as $$ select interval '30 minutes' $$;
create or replace function public.nauka_historia_trzymaj() returns interval language sql immutable as $$ select interval '12 months' $$;

-- ---------- Sygnał obecności ----------
create or replace function public.nauka_obecny(p_nazwa text default '') returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  dev text := coalesce(public.nauka_urzadzenie_id(), '');
  adres text := public.nauka_ip();
  mail text := public.nauka_email();
  o public.nauka_obecnosc;
  w bigint;
begin
  if uid is null then raise exception 'nie_zalogowany'; end if;
  p_nazwa := left(coalesce(p_nazwa, ''), 60);
  select * into o from public.nauka_obecnosc where user_id = uid and device_id = dev;
  -- Częściej niż co 20 s nic nie zapisujemy (np. kilka kart naraz).
  if found and o.last_seen > now() - interval '20 seconds' then return jsonb_build_object('ok', true); end if;

  if not found or o.wizyta_id is null or o.last_seen < now() - public.nauka_wizyta_przerwa() then
    insert into public.nauka_wizyty (user_id, email, device_id, nazwa, ip) values (uid, mail, nullif(dev, ''), p_nazwa, adres)
      returning id into w;
    insert into public.nauka_obecnosc (user_id, device_id, email, nazwa, ip, wizyta_id, od, last_seen)
      values (uid, dev, mail, p_nazwa, adres, w, now(), now())
      on conflict (user_id, device_id) do update
        set email = excluded.email, nazwa = excluded.nazwa, ip = excluded.ip, wizyta_id = excluded.wizyta_id, od = now(), last_seen = now();
    -- Sprzątanie starej historii przy okazji (rzadko: tylko przy nowej wizycie).
    delete from public.nauka_wizyty where od < now() - public.nauka_historia_trzymaj();
  else
    update public.nauka_obecnosc
       set last_seen = now(), email = mail, ip = coalesce(adres, ip), nazwa = case when p_nazwa <> '' then p_nazwa else nazwa end
     where user_id = uid and device_id = dev;
    update public.nauka_wizyty set koniec = now() where id = o.wizyta_id;
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- ---------- Zapis logowania ----------
create or replace function public.nauka_zalogowano(p_metoda text default '', p_nazwa text default '') returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  dev text := public.nauka_urzadzenie_id();
begin
  if uid is null then raise exception 'nie_zalogowany'; end if;
  p_metoda := case when p_metoda in ('kod', 'haslo', 'link') then p_metoda else '' end;
  -- To samo logowanie zgłoszone dwa razy (np. dwie karty) zapisujemy raz.
  if exists (select 1 from public.nauka_logowania l where l.user_id = uid and l.device_id is not distinct from dev
               and l.at > now() - interval '2 minutes') then
    return jsonb_build_object('ok', true);
  end if;
  insert into public.nauka_logowania (user_id, email, metoda, device_id, nazwa, ip)
    values (uid, public.nauka_email(), p_metoda, dev, left(coalesce(p_nazwa, ''), 60), public.nauka_ip());
  delete from public.nauka_logowania where at < now() - public.nauka_historia_trzymaj();
  return jsonb_build_object('ok', true);
end $$;

-- ---------- Panel starosty ----------
create or replace function public.nauka_admin_aktywnosc() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  konta jsonb;
begin
  if not public.nauka_admin() then raise exception 'brak_dostepu'; end if;

  -- Wszystkie konta z Supabase Auth (data założenia i ostatniego logowania). Gdyby dostęp do auth był zablokowany,
  -- panel i tak działa, tylko bez tej listy.
  begin
    select coalesce(jsonb_agg(jsonb_build_object(
             'user_id', u.id, 'email', lower(coalesce(u.email, '')), 'od', u.created_at, 'logowanie', u.last_sign_in_at,
             'ostatnio', (select max(o.last_seen) from public.nauka_obecnosc o where o.user_id = u.id),
             'platny', exists (select 1 from public.nauka_dostep d where d.do_kiedy >= current_date
                                 and (d.user_id = u.id or d.email = lower(coalesce(u.email, '')))),
             'admin', exists (select 1 from public.nauka_admini a where a.email = lower(coalesce(u.email, '')))
           ) order by greatest(u.last_sign_in_at,
                               (select max(o.last_seen) from public.nauka_obecnosc o where o.user_id = u.id)) desc nulls last), '[]'::jsonb)
      into konta
      from auth.users u;
  exception when others then
    konta := null;
  end;

  return jsonb_build_object(
    'teraz', now(),
    'online', coalesce((
      select jsonb_agg(jsonb_build_object('user_id', o.user_id, 'email', o.email, 'nazwa', o.nazwa, 'od', o.od, 'last_seen', o.last_seen)
                       order by o.od)
      from public.nauka_obecnosc o where o.last_seen >= now() - public.nauka_online_okno()), '[]'::jsonb),
    'dzis', (select count(distinct w.user_id) from public.nauka_wizyty w where w.koniec >= date_trunc('day', now() at time zone 'Europe/Warsaw') at time zone 'Europe/Warsaw'),
    'tydzien', (select count(distinct w.user_id) from public.nauka_wizyty w where w.koniec >= now() - interval '7 days'),
    'logowania', coalesce((
      select jsonb_agg(jsonb_build_object('user_id', l.user_id, 'email', l.email, 'metoda', l.metoda, 'nazwa', l.nazwa, 'ip', l.ip, 'at', l.at) order by l.at desc)
      from (select * from public.nauka_logowania order by at desc limit 300) l), '[]'::jsonb),
    'wizyty', coalesce((
      select jsonb_agg(jsonb_build_object('user_id', w.user_id, 'email', w.email, 'nazwa', w.nazwa, 'od', w.od, 'koniec', w.koniec) order by w.od desc)
      from (select * from public.nauka_wizyty order by od desc limit 300) w), '[]'::jsonb),
    'konta', konta
  );
end $$;

-- ---------- Uprawnienia ----------
revoke all on function public.nauka_obecny(text), public.nauka_zalogowano(text, text), public.nauka_admin_aktywnosc() from public, anon;
grant execute on function public.nauka_obecny(text), public.nauka_zalogowano(text, text), public.nauka_admin_aktywnosc() to authenticated;
grant execute on function public.nauka_online_okno(), public.nauka_wizyta_przerwa(), public.nauka_historia_trzymaj() to authenticated;
