-- Skrót BM v8: jedno konto = jedna osoba.
--   • do 3 urządzeń na konto (telefon, laptop, tablet); urządzenie nieużywane 60 dni samo wypada z listy,
--   • usunąć urządzenie z listy można raz na 30 dni (inaczej dwie osoby by się co chwilę wymieniały),
--   • w jednej chwili konto działa na jednym urządzeniu; drugie widzi „Konto jest używane na innym urządzeniu”
--     i może przejąć sesję (każde przejęcie zapisuje się w dzienniku),
--   • starosta widzi podejrzane konta i może je ostrzec, zablokować albo wyczyścić im urządzenia.
-- Urządzenie przedstawia się nagłówkiem x-skrot-device (losowe ID z przeglądarki, skrot-supabase.js).
-- Pilnuje tego baza: nauka_platny() jest prawdą tylko dla zarejestrowanego, aktywnego urządzenia,
-- więc wszystkie reguły tabel (i funkcje AI) działają tak samo bez zmian w nich.
--
-- KOLEJNOŚĆ: najpierw strona z nową wersją skrot-supabase.js (wysyła nagłówek), potem ten plik,
-- potem wdrożenie funkcji „claude” (przekazuje nagłówek dalej). Wymaga skrot-v7-subskrypcja.sql.
-- Wklej w Supabase → SQL Editor → Run. Można uruchamiać wielokrotnie.

-- ---------- Tabele ----------
create table if not exists public.nauka_urzadzenia (
  user_id     uuid not null,
  device_id   text not null,
  nazwa       text not null default '',
  ip          text,
  created_at  timestamptz not null default now(),
  last_seen   timestamptz not null default now(),
  usuniete_at timestamptz,
  primary key (user_id, device_id)
);

create table if not exists public.nauka_konta (
  user_id             uuid primary key,
  email               text not null default '',
  aktywne_urzadzenie  text,
  aktywne_ping        timestamptz,
  ostatnie_usuniecie  timestamptz,
  zablokowane         boolean not null default false,
  powod               text,
  ostrzezenie_at      timestamptz
);

create table if not exists public.nauka_urzadzenia_log (
  id         bigserial primary key,
  user_id    uuid not null,
  device_id  text,
  zdarzenie  text not null,   -- nowe | usuniete | przejecie | limit | blokada | odblokowanie | reset | ostrzezenie
  ip         text,
  at         timestamptz not null default now()
);
create index if not exists nauka_urzadzenia_log_user on public.nauka_urzadzenia_log (user_id, at desc);

alter table public.nauka_urzadzenia     enable row level security;
alter table public.nauka_konta          enable row level security;
alter table public.nauka_urzadzenia_log enable row level security;
revoke all on public.nauka_urzadzenia, public.nauka_konta, public.nauka_urzadzenia_log from anon, authenticated;
-- brak reguł: tabele czytają i zmieniają tylko funkcje poniżej

-- ---------- Ustawienia (zmień tutaj, jeśli trzeba) ----------
create or replace function public.nauka_urz_limit() returns int language sql immutable as $$ select 3 $$;
create or replace function public.nauka_urz_wygasa() returns interval language sql immutable as $$ select interval '60 days' $$;
create or replace function public.nauka_urz_zmiana() returns interval language sql immutable as $$ select interval '30 days' $$;
-- Strona wysyła sygnał co 45 s, gdy karta jest na wierzchu; po 2 min ciszy urządzenie przestaje być „aktywne”.
create or replace function public.nauka_urz_okno() returns interval language sql immutable as $$ select interval '2 minutes' $$;

-- ---------- Z nagłówków zapytania ----------
create or replace function public.nauka_naglowek(n text) returns text
language sql stable set search_path = '' as $$
  select nullif(nullif(current_setting('request.headers', true), '')::json ->> n, '')
$$;

create or replace function public.nauka_urzadzenie_id() returns text
language sql stable set search_path = '' as $$
  select d from (select lower(public.nauka_naglowek('x-skrot-device')) d) x
  where d ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
$$;

create or replace function public.nauka_ip() returns text
language sql stable set search_path = '' as $$
  select left(trim(coalesce(public.nauka_naglowek('cf-connecting-ip'), public.nauka_naglowek('x-real-ip'),
                            split_part(coalesce(public.nauka_naglowek('x-forwarded-for'), ''), ',', 1))), 64)
$$;

-- ---------- Kto zapłacił (samo konto, bez urządzenia) ----------
create or replace function public.nauka_platny_konto() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.nauka_dostep d
                 where d.do_kiedy >= current_date
                   and (d.email = public.nauka_email() or d.user_id = auth.uid()))
$$;

-- Czy to urządzenie może teraz czytać: zarejestrowane, niewygasłe, konto nie zablokowane
-- i żadne inne urządzenie nie jest w tej chwili aktywne.
create or replace function public.nauka_urzadzenie_ok() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.nauka_urzadzenia u
    left join public.nauka_konta k on k.user_id = u.user_id
    where u.user_id = auth.uid()
      and u.device_id = public.nauka_urzadzenie_id()
      and u.usuniete_at is null
      and u.last_seen >= now() - public.nauka_urz_wygasa()
      and not coalesce(k.zablokowane, false)
      and (k.aktywne_urzadzenie is null or k.aktywne_urzadzenie = u.device_id
           or k.aktywne_ping is null or k.aktywne_ping < now() - public.nauka_urz_okno())
  )
$$;

-- Pełny dostęp = starosta albo (opłacone konto i to urządzenie jest w porządku).
-- Wszystkie reguły tabel i funkcje (AI, Moje materiały, kalendarz) pytają właśnie o to.
create or replace function public.nauka_platny() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.nauka_admin() or (public.nauka_platny_konto() and public.nauka_urzadzenie_ok())
$$;

create or replace function public.nauka_ja() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'email', public.nauka_email(),
    'admin', public.nauka_admin(),
    'platny', public.nauka_platny(),
    'czytelnik', public.nauka_platny(),
    'platny_konto', public.nauka_admin() or public.nauka_platny_konto(),
    'dostep_do', (select max(d.do_kiedy) from public.nauka_dostep d
                  where d.email = public.nauka_email() or d.user_id = auth.uid()),
    'plan', (select d.plan from public.nauka_dostep d
             where d.email = public.nauka_email() or d.user_id = auth.uid()
             order by d.do_kiedy desc limit 1)
  )
$$;

-- ---------- Lista urządzeń osoby ----------
create or replace function public.nauka_urz_lista(p_user uuid, p_dev text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', u.device_id, 'nazwa', u.nazwa, 'od', u.created_at, 'ostatnio', u.last_seen,
           'to', u.device_id = p_dev,
           'aktywne', coalesce(k.aktywne_urzadzenie = u.device_id and k.aktywne_ping >= now() - public.nauka_urz_okno(), false))
         order by (u.device_id = p_dev) desc, u.last_seen desc), '[]'::jsonb)
  from public.nauka_urzadzenia u
  left join public.nauka_konta k on k.user_id = u.user_id
  where u.user_id = p_user and u.usuniete_at is null and u.last_seen >= now() - public.nauka_urz_wygasa()
$$;

create or replace function public.nauka_urz_zmiana_od(p_user uuid) returns timestamptz
language sql stable security definer set search_path = '' as $$
  select k.ostatnie_usuniecie + public.nauka_urz_zmiana() from public.nauka_konta k
  where k.user_id = p_user and k.ostatnie_usuniecie > now() - public.nauka_urz_zmiana()
$$;

-- ---------- Sygnał z przeglądarki ----------
-- Wołane przy wejściu na stronę i co 45 s, gdy karta jest na wierzchu.
--   p_przejmij = true: „Używaj tutaj” (to urządzenie staje się aktywne, poprzednie dostaje komunikat),
--   p_zwolnij  = true: karta schowana albo zamknięta, inne urządzenie może od razu zacząć.
-- Zwraca stan: ok | zajete | limit | zablokowane | brak_dostepu | brak_id.
drop function if exists public.nauka_ping(text, boolean, boolean);
create or replace function public.nauka_ping(p_nazwa text default '', p_przejmij boolean default false, p_zwolnij boolean default false)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  dev text := public.nauka_urzadzenie_id();
  adres text := public.nauka_ip();
  k public.nauka_konta;
  u public.nauka_urzadzenia;
  ile int;
  inne text;
begin
  if uid is null then raise exception 'nie_zalogowany'; end if;
  p_nazwa := left(coalesce(p_nazwa, ''), 60);
  -- Starosta: bez limitu i bez jednej sesji, ale jego urządzenia też trafiają na listę („Twoje urządzenia”).
  if public.nauka_admin() then
    if dev is not null and not p_zwolnij then
      insert into public.nauka_urzadzenia (user_id, device_id, nazwa, ip) values (uid, dev, p_nazwa, adres)
        on conflict (user_id, device_id) do update
          set nazwa = case when excluded.nazwa <> '' then excluded.nazwa else public.nauka_urzadzenia.nazwa end,
              ip = coalesce(excluded.ip, public.nauka_urzadzenia.ip), last_seen = now(), usuniete_at = null;
    end if;
    return jsonb_build_object('stan', 'ok', 'admin', true);
  end if;
  if not public.nauka_platny_konto() then return jsonb_build_object('stan', 'brak_dostepu'); end if;
  if dev is null then return jsonb_build_object('stan', 'brak_id'); end if;

  insert into public.nauka_konta (user_id, email) values (uid, public.nauka_email())
    on conflict (user_id) do update set email = excluded.email
    returning * into k;
  if k.zablokowane then return jsonb_build_object('stan', 'zablokowane', 'powod', k.powod); end if;

  select * into u from public.nauka_urzadzenia where user_id = uid and device_id = dev;
  if not found or u.usuniete_at is not null or u.last_seen < now() - public.nauka_urz_wygasa() then
    -- nowe urządzenie (albo wcześniej usunięte / dawno nieużywane): mieści się w limicie?
    select count(*) into ile from public.nauka_urzadzenia
     where user_id = uid and device_id <> dev and usuniete_at is null and last_seen >= now() - public.nauka_urz_wygasa();
    if ile >= public.nauka_urz_limit() then
      if not exists (select 1 from public.nauka_urzadzenia_log l where l.user_id = uid and l.device_id = dev
                       and l.zdarzenie = 'limit' and l.at > now() - interval '1 day') then
        insert into public.nauka_urzadzenia_log (user_id, device_id, zdarzenie, ip) values (uid, dev, 'limit', adres);
      end if;
      return jsonb_build_object('stan', 'limit', 'limit', public.nauka_urz_limit(),
        'urzadzenia', public.nauka_urz_lista(uid, dev), 'zmiana_od', public.nauka_urz_zmiana_od(uid));
    end if;
    insert into public.nauka_urzadzenia (user_id, device_id, nazwa, ip)
      values (uid, dev, p_nazwa, adres)
      on conflict (user_id, device_id) do update
        set nazwa = case when excluded.nazwa <> '' then excluded.nazwa else public.nauka_urzadzenia.nazwa end, ip = excluded.ip, created_at = now(), last_seen = now(), usuniete_at = null;
    insert into public.nauka_urzadzenia_log (user_id, device_id, zdarzenie, ip) values (uid, dev, 'nowe', adres);
  else
    update public.nauka_urzadzenia
       set last_seen = now(), ip = coalesce(adres, ip), nazwa = case when p_nazwa <> '' then p_nazwa else u.nazwa end
     where user_id = uid and device_id = dev;
  end if;

  if p_zwolnij then
    update public.nauka_konta set aktywne_ping = null where user_id = uid and aktywne_urzadzenie = dev;
    return jsonb_build_object('stan', 'ok');
  end if;

  if k.aktywne_urzadzenie is not null and k.aktywne_urzadzenie <> dev
     and k.aktywne_ping >= now() - public.nauka_urz_okno() then
    if not p_przejmij then
      select x.nazwa into inne from public.nauka_urzadzenia x where x.user_id = uid and x.device_id = k.aktywne_urzadzenie;
      return jsonb_build_object('stan', 'zajete', 'inne', coalesce(inne, ''));
    end if;
    insert into public.nauka_urzadzenia_log (user_id, device_id, zdarzenie, ip) values (uid, dev, 'przejecie', adres);
  end if;

  update public.nauka_konta set aktywne_urzadzenie = dev, aktywne_ping = now() where user_id = uid;
  return jsonb_build_object('stan', 'ok');
end $$;

-- Lista moich urządzeń (okno „Twoje urządzenia”).
create or replace function public.nauka_urzadzenia_moje() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'nie_zalogowany'; end if;
  return jsonb_build_object('limit', public.nauka_urz_limit(),
    'urzadzenia', public.nauka_urz_lista(auth.uid(), public.nauka_urzadzenie_id()),
    'zmiana_od', case when public.nauka_admin() then null else public.nauka_urz_zmiana_od(auth.uid()) end,
    'admin', public.nauka_admin());
end $$;

-- Usunięcie urządzenia z listy: raz na 30 dni.
create or replace function public.nauka_urzadzenie_usun(p_device text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := auth.uid(); od timestamptz;
begin
  if uid is null then raise exception 'nie_zalogowany'; end if;
  od := case when public.nauka_admin() then null else public.nauka_urz_zmiana_od(uid) end;
  if od is not null then raise exception 'za_wczesnie %', to_char(od at time zone 'Europe/Warsaw', 'YYYY-MM-DD'); end if;
  update public.nauka_urzadzenia set usuniete_at = now()
   where user_id = uid and device_id = p_device and usuniete_at is null;
  if not found then raise exception 'nie_ma'; end if;
  if not public.nauka_admin() then
    insert into public.nauka_konta (user_id, email, ostatnie_usuniecie) values (uid, public.nauka_email(), now())
      on conflict (user_id) do update set ostatnie_usuniecie = now();
  end if;
  update public.nauka_konta set aktywne_urzadzenie = null, aktywne_ping = null
   where user_id = uid and aktywne_urzadzenie = p_device;
  insert into public.nauka_urzadzenia_log (user_id, device_id, zdarzenie, ip) values (uid, p_device, 'usuniete', public.nauka_ip());
  return public.nauka_urzadzenia_moje();
end $$;

-- ---------- Panel starosty ----------
-- Konta z urządzeniami: liczby z ostatnich dni i flaga „podejrzane”
-- (co najmniej 6 przejęć sesji w 7 dni albo co najmniej 5 nowych urządzeń w 30 dni).
create or replace function public.nauka_admin_konta() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.nauka_admin() then raise exception 'brak_dostepu'; end if;
  return coalesce((
    select jsonb_agg(r order by (r ->> 'podejrzane')::boolean desc, (r ->> 'zablokowane')::boolean desc, r ->> 'email')
    from (
      select jsonb_build_object(
        'user_id', k.user_id, 'email', k.email, 'zablokowane', k.zablokowane, 'powod', k.powod,
        'ostrzezenie_at', k.ostrzezenie_at,
        'urzadzenia', (select count(*) from public.nauka_urzadzenia u
                        where u.user_id = k.user_id and u.usuniete_at is null and u.last_seen >= now() - public.nauka_urz_wygasa()),
        'nowe_30d', s.nowe_30d, 'przejecia_7d', s.przejecia_7d, 'limit_7d', s.limit_7d, 'ip_7d', s.ip_7d,
        'ostatnio', (select max(u.last_seen) from public.nauka_urzadzenia u where u.user_id = k.user_id),
        'podejrzane', s.przejecia_7d >= 6 or s.nowe_30d >= 5,
        'lista', public.nauka_urz_lista(k.user_id, null)
      ) r
      from public.nauka_konta k
      cross join lateral (
        select count(*) filter (where l.zdarzenie = 'nowe' and l.at > now() - interval '30 days') nowe_30d,
               count(*) filter (where l.zdarzenie = 'przejecie' and l.at > now() - interval '7 days') przejecia_7d,
               count(*) filter (where l.zdarzenie = 'limit' and l.at > now() - interval '7 days') limit_7d,
               count(distinct l.ip) filter (where l.at > now() - interval '7 days' and l.ip <> '') ip_7d
        from public.nauka_urzadzenia_log l where l.user_id = k.user_id
      ) s
    ) x
  ), '[]'::jsonb);
end $$;

-- akcja: blokuj | odblokuj | reset (czyści urządzenia i pozwala od razu dodać nowe) | ostrzezenie (zapisuje datę ostrzeżenia)
create or replace function public.nauka_admin_konto(p_user uuid, akcja text, p_powod text default null) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
begin
  if not public.nauka_admin() then raise exception 'brak_dostepu'; end if;
  if akcja = 'blokuj' then
    update public.nauka_konta set zablokowane = true, powod = nullif(left(coalesce(p_powod, ''), 300), ''),
      aktywne_urzadzenie = null, aktywne_ping = null where user_id = p_user;
    insert into public.nauka_urzadzenia_log (user_id, zdarzenie) values (p_user, 'blokada');
  elsif akcja = 'odblokuj' then
    update public.nauka_konta set zablokowane = false, powod = null where user_id = p_user;
    insert into public.nauka_urzadzenia_log (user_id, zdarzenie) values (p_user, 'odblokowanie');
  elsif akcja = 'reset' then
    update public.nauka_urzadzenia set usuniete_at = now() where user_id = p_user and usuniete_at is null;
    update public.nauka_konta set ostatnie_usuniecie = null, aktywne_urzadzenie = null, aktywne_ping = null where user_id = p_user;
    insert into public.nauka_urzadzenia_log (user_id, zdarzenie) values (p_user, 'reset');
  elsif akcja = 'ostrzezenie' then
    update public.nauka_konta set ostrzezenie_at = now() where user_id = p_user;
    insert into public.nauka_urzadzenia_log (user_id, zdarzenie) values (p_user, 'ostrzezenie');
  else
    raise exception 'nieznana_akcja';
  end if;
  return public.nauka_admin_konta();
end $$;

-- ---------- Kalendarz w telefonie: zablokowane konto nie dostaje terminów ----------
create or replace function public.nauka_kalendarz_dane(p_token text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare k public.nauka_kalendarz; prog jsonb; ok boolean;
begin
  select * into k from public.nauka_kalendarz where token = p_token;
  if not found then return null; end if;
  update public.nauka_kalendarz set uzyty_at = now() where user_id = k.user_id;
  ok := exists (select 1 from public.nauka_admini a where a.email = k.email)
     or (exists (select 1 from public.nauka_dostep d
                 where d.do_kiedy >= current_date and (d.user_id = k.user_id or (k.email <> '' and d.email = k.email)))
         and not exists (select 1 from public.nauka_konta b where b.user_id = k.user_id and b.zablokowane));
  select d.data into prog from public.nauka_docs d where d.kolekcja = 'progress' and d.id = k.user_id::text;
  return jsonb_build_object(
    'platny', ok,
    'grupa', prog ->> 'group',
    'podgrupa', prog ->> 'sub',
    'terminy', case when ok then coalesce((select jsonb_agg(d.data || jsonb_build_object('id', d.id))
                                            from public.nauka_docs d where d.kolekcja = 'deadlines'), '[]'::jsonb)
                    else '[]'::jsonb end
  );
end $$;
revoke all on function public.nauka_kalendarz_dane(text) from public, anon, authenticated;
grant execute on function public.nauka_kalendarz_dane(text) to service_role;

-- ---------- Uprawnienia ----------
revoke all on function public.nauka_naglowek(text), public.nauka_urzadzenie_id(), public.nauka_ip(),
  public.nauka_platny_konto(), public.nauka_urzadzenie_ok(), public.nauka_urz_lista(uuid, text),
  public.nauka_urz_zmiana_od(uuid), public.nauka_ping(text, boolean, boolean), public.nauka_urzadzenia_moje(),
  public.nauka_urzadzenie_usun(text), public.nauka_admin_konta(), public.nauka_admin_konto(uuid, text, text)
  from public;
grant execute on function public.nauka_naglowek(text), public.nauka_urzadzenie_id(), public.nauka_ip(),
  public.nauka_platny_konto(), public.nauka_urzadzenie_ok(), public.nauka_platny(),
  public.nauka_urz_limit(), public.nauka_urz_wygasa(), public.nauka_urz_zmiana(), public.nauka_urz_okno()
  to anon, authenticated;
grant execute on function public.nauka_ja(), public.nauka_ping(text, boolean, boolean), public.nauka_urzadzenia_moje(),
  public.nauka_urzadzenie_usun(text), public.nauka_admin_konta(), public.nauka_admin_konto(uuid, text, text)
  to authenticated;
