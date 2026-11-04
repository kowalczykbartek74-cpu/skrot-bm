-- Skrót BM v31: roczniki – przygotowanie pod inne kierunki Uniwersytetu Szczecińskiego.
-- Wklej w Supabase → SQL Editor → Run, po v30. Można uruchamiać wielokrotnie. (Na gałęzi kierunki ten plik nazywał się
-- skrot-v22-roczniki.sql; jeśli już był uruchomiony, ten plik przejdzie bez błędów i doda tylko część 5.)
--
-- Co robi:
--   • trzy nowe tabele: wydziały, kierunki (kierunek × stopień × tryb) i roczniki (kierunek × rok naboru);
--   • wpisuje pierwszy rocznik: WEFiZ / Business Management / I stopnia / stacjonarne / nabór 2026
--     (ten sam identyfikator co w rocznik.js: „wefiz-bm-1-st-2026”);
--   • przypina do niego każdy profil rankingu (nauka_profil.rocznik_id); nowe profile dostają go same;
--   • funkcja nauka_roczniki_lista() dla wyboru kierunku i listy oczekujących;
--   • wybór kierunku zapisany w profilu: nauka_rocznik_moj(), nauka_rocznik_ustaw() (raz; później zmienia starosta).
--     Te same funkcje (z tą samą sygnaturą) rozszerza później migracja rocznika Prawa (gałąź kierunek-prawo).
-- Czego NIE robi: nie zmienia reguł dostępu, cen, rankingu ani treści. Dla obecnych użytkowników nic się nie zmienia.
--
-- Rocznik = grupa ludzi, którzy zaczęli razem. Rok studiów (1., 2., 3.) liczy się z daty, więc rocznik
-- „nabór 2026” jest 1. rokiem w 2026/27 i sam staje się 2. rokiem w 2027/28 (postępy zostają przy nim).
-- Status rocznika: 'plan' = tylko darmowy plan zajęć, 'oczekujacy' = plan + lista oczekujących na treści,
-- 'platny' = pełne treści w sprzedaży.

-- =====================================================================
-- 1) Tabele (dostęp tylko przez funkcje, jak reszta tabel nauka_*)
-- =====================================================================
create table if not exists public.nauka_wydzialy (
  kod        text primary key check (kod ~ '^[A-Za-z]{2,8}$'),
  nazwa_pl   text not null,
  nazwa_en   text,
  kampus     text,                 -- np. „Cukrowa 8”
  dos_url    text,                 -- sekcja Działu Obsługi Studenta z ogłoszeniami (odwołane zajęcia)
  created_at timestamptz not null default now()
);

create table if not exists public.nauka_kierunki (
  id         text primary key check (id ~ '^[a-z]+-[a-z0-9]+-[012]-(st|nst)$'),  -- wydział-kod-stopień-tryb
  wydzial    text not null references public.nauka_wydzialy (kod),
  kod        text not null check (kod ~ '^[A-Z]{2,6}$'),                       -- jak nauka_profil.kierunek
  nazwa_pl   text not null,
  nazwa_en   text,
  stopien    smallint not null check (stopien in (0, 1, 2)),                   -- 0 = jednolite magisterskie
  tryb       text not null check (tryb in ('st', 'nst')),
  jezyk      text not null default 'pl' check (jezyk in ('pl', 'en')),          -- język zajęć
  created_at timestamptz not null default now(),
  unique (wydzial, kod, stopien, tryb)
);

create table if not exists public.nauka_roczniki (
  id          text primary key check (id ~ '^[a-z]+-[a-z0-9]+-[012]-(st|nst)-20[0-9]{2}$'),
  kierunek_id text not null references public.nauka_kierunki (id),
  nabor       int  not null check (nabor between 2020 and 2100),
  status      text not null default 'plan' check (status in ('plan', 'oczekujacy', 'platny')),
  created_at  timestamptz not null default now(),
  unique (kierunek_id, nabor),
  check (id = kierunek_id || '-' || nabor)
);

alter table public.nauka_wydzialy enable row level security;
alter table public.nauka_kierunki enable row level security;
alter table public.nauka_roczniki enable row level security;
revoke all on public.nauka_wydzialy, public.nauka_kierunki, public.nauka_roczniki from anon, authenticated;

-- =====================================================================
-- 2) Pierwszy rocznik: 1. rok Business Management 2026/27
-- =====================================================================
insert into public.nauka_wydzialy (kod, nazwa_pl, nazwa_en, kampus, dos_url)
values ('WEFiZ', 'Wydział Ekonomii, Finansów i Zarządzania', 'Faculty of Economics, Finance and Management',
        'Cukrowa 8', 'https://dos.usz.edu.pl/cukrowa/zajecia-cukrowa/')
on conflict (kod) do update set nazwa_pl = excluded.nazwa_pl, nazwa_en = excluded.nazwa_en,
  kampus = excluded.kampus, dos_url = excluded.dos_url;

insert into public.nauka_kierunki (id, wydzial, kod, nazwa_pl, nazwa_en, stopien, tryb, jezyk)
values ('wefiz-bm-1-st', 'WEFiZ', 'BM', 'Business Management', 'Business Management', 1, 'st', 'en')
on conflict (id) do update set nazwa_pl = excluded.nazwa_pl, nazwa_en = excluded.nazwa_en, jezyk = excluded.jezyk;

insert into public.nauka_roczniki (id, kierunek_id, nabor, status)
values ('wefiz-bm-1-st-2026', 'wefiz-bm-1-st', 2026, 'platny')
on conflict (id) do nothing;   -- status zmieniasz ręcznie; ponowne uruchomienie go nie nadpisze

-- =====================================================================
-- 3) Profile rankingu przypięte do rocznika
-- =====================================================================
alter table public.nauka_profil add column if not exists rocznik_id text references public.nauka_roczniki (id);
update public.nauka_profil p set rocznik_id = 'wefiz-bm-1-st-2026'
 where p.rocznik_id is null and p.kierunek = 'BM' and p.rocznik = 2026;
-- Profil bez wyboru to BM 2026, tak jak dziś (nauka_rp_cfg); wybór z ekranu wejścia zapisuje nauka_rocznik_ustaw (część 5).
alter table public.nauka_profil alter column rocznik_id set default 'wefiz-bm-1-st-2026';
create index if not exists nauka_profil_rocznik_idx on public.nauka_profil (rocznik_id);

-- =====================================================================
-- 4) Lista roczników dla strony (bez danych osób; można czytać bez logowania)
-- =====================================================================
create or replace function public.nauka_roczniki_lista() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', r.id, 'nabor', r.nabor, 'status', r.status,
    'kierunek', jsonb_build_object('id', k.id, 'kod', k.kod, 'pl', k.nazwa_pl, 'en', k.nazwa_en,
                                   'stopien', k.stopien, 'tryb', k.tryb, 'jezyk', k.jezyk),
    'wydzial', jsonb_build_object('kod', w.kod, 'pl', w.nazwa_pl, 'en', w.nazwa_en)
  ) order by w.kod, k.nazwa_pl, r.nabor desc), '[]'::jsonb)
  from public.nauka_roczniki r
  join public.nauka_kierunki k on k.id = r.kierunek_id
  join public.nauka_wydzialy w on w.kod = k.wydzial
$$;
revoke all on function public.nauka_roczniki_lista() from public;
grant execute on function public.nauka_roczniki_lista() to anon, authenticated;

-- =====================================================================
-- 5) Wybór kierunku zapisany w profilu (ekran wejścia → po zalogowaniu)
-- =====================================================================
-- Dotychczasowe osoby już „wybrały” BM: oznaczamy je tylko przy pierwszym uruchomieniu (ponowne uruchomienie
-- nie oznaczy nowych osób, które jeszcze nie wybierały).
do $$ begin
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'nauka_profil' and column_name = 'rocznik_wybrany_at') then
    alter table public.nauka_profil add column rocznik_wybrany_at timestamptz;
    update public.nauka_profil set rocznik_wybrany_at = created_at;
    insert into public.nauka_profil (user_id, rocznik_wybrany_at)
    select d.id::uuid, now() from public.nauka_docs d
     where d.kolekcja = 'progress' and d.id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       and exists (select 1 from auth.users u where u.id = d.id::uuid)
    on conflict (user_id) do nothing;
  end if;
end $$;

-- Mój rocznik i czy już wybrany. Wybrany = zapisany wybór, starosta, opłacony dostęp albo okres próbny (te konta to BM).
create or replace function public.nauka_rocznik_moj() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare uid uuid := auth.uid(); em text := public.nauka_email(); p public.nauka_profil; r text;
begin
  if uid is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  select * into p from public.nauka_profil where user_id = uid;
  r := coalesce(p.rocznik_id, 'wefiz-bm-1-st-2026');
  return jsonb_build_object('ok', true, 'rocznik_id', r,
    'wybrany', p.rocznik_wybrany_at is not null or public.nauka_admin()
               or exists (select 1 from public.nauka_dostep d where d.user_id = uid or (coalesce(em, '') <> '' and d.email = em))
               or exists (select 1 from public.nauka_proby x where x.user_id = uid),
    'status', (select x.status from public.nauka_roczniki x where x.id = r));
end $$;

-- Wspólna część zapisu rocznika w profilu (kierunek i rok naboru z rocznika).
create or replace function public.nauka_rocznik_zapisz(p_user uuid, p_rocznik text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare k record;
begin
  select r.id, r.nabor, kk.kod into k from public.nauka_roczniki r join public.nauka_kierunki kk on kk.id = r.kierunek_id
   where r.id = p_rocznik and r.status in ('oczekujacy', 'platny');
  if not found then return false; end if;
  begin
    insert into public.nauka_profil (user_id, kierunek, rocznik, rocznik_id, rocznik_wybrany_at)
    values (p_user, k.kod, k.nabor, k.id, now())
    on conflict (user_id) do update set kierunek = excluded.kierunek, rocznik = excluded.rocznik,
      rocznik_id = excluded.rocznik_id, rocznik_wybrany_at = now(), updated_at = now();
  exception when unique_violation then
    -- ten sam pseudonim jest już w rankingu nowego rocznika: pseudonim do ustawienia od nowa
    update public.nauka_profil set nick = null, w_rankingu = false, nick_zmiana = null, kierunek = k.kod, rocznik = k.nabor,
      rocznik_id = k.id, rocznik_wybrany_at = now(), updated_at = now() where user_id = p_user;
  end;
  return true;
end $$;

-- Wybór przy pierwszym logowaniu: tylko raz. Potem zmienia starosta.
create or replace function public.nauka_rocznik_ustaw(p_rocznik text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare m jsonb := public.nauka_rocznik_moj();
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if (m->>'wybrany')::boolean then return jsonb_build_object('ok', false, 'code', 'juz_wybrany', 'rocznik_id', m->>'rocznik_id'); end if;
  if not public.nauka_rocznik_zapisz(auth.uid(), p_rocznik) then return jsonb_build_object('ok', false, 'code', 'zly_rocznik'); end if;
  return public.nauka_rocznik_moj();
end $$;

revoke all on function public.nauka_rocznik_moj(), public.nauka_rocznik_ustaw(text), public.nauka_rocznik_zapisz(uuid, text) from public, anon;
grant execute on function public.nauka_rocznik_moj(), public.nauka_rocznik_ustaw(text) to authenticated;

notify pgrst, 'reload schema';
