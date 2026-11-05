-- Skrót v37: paczka i duet tygodnia (etap 10 „Systemy z Zdawalni w Skrócie”).
-- Wklej w Supabase → SQL Editor → Run, po v36. Można uruchamiać wielokrotnie (nie kasuje danych).
--
-- Port matura-app lib/domain/squad.ts (paczka: 2–8 osób, kod zaproszenia, wspólny cel tygodnia = 70% zaplanowanych sesji)
-- i lib/domain/duo.ts (duet tygodnia: para ze wspólnym celem pon–nd, licząc od dnia, w którym para powstała).
-- Zasada: widać wysiłek, nigdy wyniki. Bez rankingu, bez lig, bez szturchnięć i bez wolnego tekstu.
--
--   • Paczka jest MIĘDZYKIERUNKOWA (bez rocznik_id): znajomi z różnych kierunków i lat mogą być razem. Jedna paczka na osobę.
--   • Przeglądarka nie czyta tabel wprost (RLS bez reguł, revoke); wszystko przez funkcje poniżej. Członek widzi o innych
--     tylko: pseudonim (nauka_profil.nick), czy uczył(a) się dziś, ile dni nauki w tym tygodniu, czy jest w duecie.
--     Nigdy: punktów, wyników, monet, kierunku, e-maila.
--   • Dzień nauki = jak w v35 (nauka_lejek_dni_nauki, etap 6): dzień (czas polski) ze zdarzeniem nauki (nauka_zdarzenia bez
--     testu „Jak się uczysz?”) albo z powtórką (nauka_powtorki_log). „Sesja nauki” w duecie = jeden dzień nauki jednej osoby,
--     więc para może zebrać najwyżej 14 sesji w tygodniu.
--   • Duet: osoba A proponuje duet osobie B z tej samej paczki, B przyjmuje. Cel: łącznie duet_cel sesji od poniedziałku do
--     niedzieli (liczą się dni od przyjęcia). Monety przyznaje WYŁĄCZNIE baza: wyzwalacz po każdym zdarzeniu nauki / powtórce
--     i przy otwarciu widoku paczki (też za miniony tydzień, gdyby nikt nie zajrzał do niedzieli). Obie osoby dostają
--     duet_nagroda monet, wpis w nauka_monety o źródle 'misja' i kluczu misja:duet:<poniedziałek>: unikalny klucz (user_id,
--     klucz) = najwyżej raz w tygodniu na osobę, więc i na parę (zmiana pary w tym samym tygodniu nie daje drugiej nagrody).
--     Te same zasady co przy Zadaniach (v14): zarabia tylko osoba z dostępem i niezablokowanym kontem, saldo ≤ max_saldo.
--     20 monet raz w tygodniu to mniej niż Zadanie tygodnia (40–50): mieści się w obecnych limitach i nie rusza dziennego
--     limitu monet z nauki (64), bo nie jest liczone z punktów.
--   • Ranking (nauka_rp), statystyki rocznika (nauka_kierunek_stat) i punkty nie zmieniają się: ten plik nie dotyka nauka_rp.
--   • Wyjście z paczki: osoba sama (nauka_paczka_wyjdz) albo właściciel usuwa osobę (nauka_paczka_usun_osobe). Gdy wychodzi
--     właściciel (albo usuwa konto), własność przechodzi na osobę najdłużej w paczce; ostatnia osoba = paczka znika.
--     Duety tej osoby znikają. Działa to wyzwalaczem, więc tak samo przy usuwaniu konta (v32 przechodzi po tabelach
--     z kolumną user_id: nauka_paczka_czlonkowie i nauka_duety ją mają; nauka_paczki trzyma właściciela w kolumnie
--     wlasciciel, żeby usunięcie konta właściciela nie kasowało paczki pozostałym).

-- =====================================================================
-- 1) Ustawienia (jedno miejsce; paczka.js ma te same liczby jako zapas)
-- =====================================================================
create or replace function public.nauka_paczka_cfg() returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object(
    'min_osob', 2,         -- SQUAD.minMembers
    'max_osob', 8,         -- SQUAD.maxMembers
    'plan_dni', 3,         -- zaplanowane dni nauki na osobę w tygodniu (Skrót nie ma planu sesji, więc stała)
    'udzial', 0.7,         -- SQUAD.goalShare: cel paczki = 70% zaplanowanych dni wszystkich
    'duet_cel', 8,         -- DUO_TARGET w Skrócie: 8 sesji (dni nauki) łącznie, np. po 4 na osobę
    'duet_nagroda', 20     -- monety dla każdej z dwóch osób, raz w tygodniu
  )
$$;

-- =====================================================================
-- 2) Tabele
-- =====================================================================
create table if not exists public.nauka_paczki (
  id          uuid primary key default gen_random_uuid(),
  kod         text not null unique check (kod ~ '^[A-Z0-9]{6}$'),
  wlasciciel  uuid not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.nauka_paczka_czlonkowie (
  paczka_id    uuid not null references public.nauka_paczki (id) on delete cascade,
  user_id      uuid not null unique,               -- jedna paczka na osobę
  dolaczyl_at  timestamptz not null default now(),
  primary key (paczka_id, user_id)
);

-- Duet: user_id = osoba, która zaproponowała; partner_id = druga osoba. od = dzień przyjęcia (czas polski).
create table if not exists public.nauka_duety (
  id          uuid primary key default gen_random_uuid(),
  paczka_id   uuid not null references public.nauka_paczki (id) on delete cascade,
  user_id     uuid not null,
  partner_id  uuid not null,
  stan        text not null default 'zaproszenie' check (stan in ('zaproszenie', 'aktywny')),
  od          date,
  created_at  timestamptz not null default now(),
  check (user_id <> partner_id),
  unique (user_id, partner_id)
);
create index if not exists nauka_duety_user_idx on public.nauka_duety (user_id);
create index if not exists nauka_duety_partner_idx on public.nauka_duety (partner_id);

alter table public.nauka_paczki enable row level security;
alter table public.nauka_paczka_czlonkowie enable row level security;
alter table public.nauka_duety enable row level security;
revoke all on public.nauka_paczki, public.nauka_paczka_czlonkowie, public.nauka_duety from anon, authenticated;

-- =====================================================================
-- 3) Wyjście osoby (samo, przez właściciela albo przy usuwaniu konta): duety znikają, własność przechodzi dalej
-- =====================================================================
create or replace function public.nauka_paczka_po_wyjsciu() returns trigger
language plpgsql security definer set search_path = '' as $$
declare nast uuid;
begin
  delete from public.nauka_duety d where d.paczka_id = old.paczka_id and (d.user_id = old.user_id or d.partner_id = old.user_id);
  select c.user_id into nast from public.nauka_paczka_czlonkowie c where c.paczka_id = old.paczka_id
   order by c.dolaczyl_at, c.user_id limit 1;
  if nast is null then
    delete from public.nauka_paczki p where p.id = old.paczka_id;
  else
    update public.nauka_paczki p set wlasciciel = nast where p.id = old.paczka_id and p.wlasciciel = old.user_id;
  end if;
  return null;
end $$;
drop trigger if exists nauka_paczka_wyjscie on public.nauka_paczka_czlonkowie;
create trigger nauka_paczka_wyjscie after delete on public.nauka_paczka_czlonkowie
  for each row execute function public.nauka_paczka_po_wyjsciu();

-- =====================================================================
-- 4) Pomocnicze (tylko dla innych funkcji bazy)
-- =====================================================================
-- Dni nauki osoby w przedziale dat (czas polski), definicja jak nauka_lejek_dni_nauki (v35).
create or replace function public.nauka_paczka_dni(p_user uuid, p_od date, p_do date) returns setof date
language sql stable security definer set search_path = '' as $$
  select (z.kiedy at time zone 'Europe/Warsaw')::date from public.nauka_zdarzenia z
   where z.user_id = p_user and z.typ <> 'profile_test'
     and z.kiedy >= (p_od::timestamp at time zone 'Europe/Warsaw') and z.kiedy < ((p_do + 1)::timestamp at time zone 'Europe/Warsaw')
  union
  select (l.at at time zone 'Europe/Warsaw')::date from public.nauka_powtorki_log l
   where l.user_id = p_user
     and l.at >= (p_od::timestamp at time zone 'Europe/Warsaw') and l.at < ((p_do + 1)::timestamp at time zone 'Europe/Warsaw')
$$;

-- Czy ta osoba może dostać monety (jak nauka_rp_mozna, ale dla dowolnej osoby, bez sprawdzania urządzenia):
-- starosta albo opłacony dostęp / trwający okres próbny, i konto nie zablokowane.
create or replace function public.nauka_paczka_moze_zarobic(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select not exists (select 1 from public.nauka_konta k where k.user_id = p_user and k.zablokowane)
     and exists (select 1 from auth.users u where u.id = p_user and (
           exists (select 1 from public.nauka_admini a where lower(a.email) = lower(coalesce(u.email, '')))
        or exists (select 1 from public.nauka_dostep d where d.do_kiedy >= current_date and (d.user_id = p_user or d.email = lower(coalesce(u.email, ''))))
        or exists (select 1 from public.nauka_proby p where p.user_id = p_user and p.do_kiedy > now())))
$$;

-- Kod paczki: 6 znaków bez łatwych do pomylenia (bez 0/O, 1/I/L).
create or replace function public.nauka_paczka_kod_nowy() returns text
language plpgsql volatile security definer set search_path = '' as $$
declare a text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; k text; i int;
begin
  loop
    k := '';
    for i in 1..6 loop k := k || substr(a, 1 + floor(random() * length(a))::int, 1); end loop;
    exit when not exists (select 1 from public.nauka_paczki p where p.kod = k);
  end loop;
  return k;
end $$;

-- Sesje duetu w tygodniu (poniedziałek p_tydzien), licząc od dnia przyjęcia, do dziś.
create or replace function public.nauka_duet_sesje(p_user uuid, p_od date, p_tydzien date) returns int
language sql stable security definer set search_path = '' as $$
  select count(distinct d)::int from public.nauka_paczka_dni(p_user, greatest(p_od, p_tydzien), least(p_tydzien + 6, public.nauka_dzis())) d
   where greatest(p_od, p_tydzien) <= least(p_tydzien + 6, public.nauka_dzis())
$$;

-- Rozliczenie duetu za tydzień: gdy razem ≥ duet_cel sesji, każda z dwóch osób dostaje monety (raz w tygodniu).
-- Zwraca, ile wpisów dodano (0, 1 albo 2).
create or replace function public.nauka_duet_rozlicz(p_duet uuid, p_tydzien date) returns int
language plpgsql volatile security definer set search_path = '' as $$
declare
  c jsonb := public.nauka_paczka_cfg();
  d public.nauka_duety; v_klucz text := 'misja:duet:' || p_tydzien::text; nagroda int := (c->>'duet_nagroda')::int;
  u uuid; n int; dodane int := 0; v_dzien date;
begin
  select * into d from public.nauka_duety x where x.id = p_duet and x.stan = 'aktywny';
  if not found or d.od is null or d.od > p_tydzien + 6 or p_tydzien > public.nauka_dzis() then return 0; end if;
  -- obie osoby już mają nagrodę za ten tydzień: nic nie liczymy
  if (select count(*) from public.nauka_monety m where m.klucz = v_klucz and m.user_id in (d.user_id, d.partner_id)) >= 2 then return 0; end if;
  if public.nauka_duet_sesje(d.user_id, d.od, p_tydzien) + public.nauka_duet_sesje(d.partner_id, d.od, p_tydzien) < (c->>'duet_cel')::int then
    return 0;
  end if;
  v_dzien := least(p_tydzien + 6, public.nauka_dzis());
  -- blokady w stałej kolejności (bez zakleszczeń), jak nauka_misja_odbierz
  for u in select x from unnest(array[d.user_id, d.partner_id]) x order by x loop
    perform pg_advisory_xact_lock(hashtext('nauka_mon:' || u::text));
  end loop;
  foreach u in array array[d.user_id, d.partner_id] loop
    continue when not public.nauka_paczka_moze_zarobic(u);
    continue when public.nauka_saldo(u) + nagroda > (public.nauka_mon_cfg()->>'max_saldo')::int;
    insert into public.nauka_monety (user_id, dzien, delta, zrodlo, klucz, opis)
    values (u, v_dzien, nagroda, 'misja', v_klucz, 'Duet tygodnia')
    on conflict (user_id, klucz) do nothing;
    get diagnostics n = row_count;
    dodane := dodane + n;
  end loop;
  return dodane;
end $$;

-- Wyzwalacz po zdarzeniu nauki / powtórce: rozlicza tydzień tego dnia nauki w duecie tej osoby (zdarzenie z kolejki może
-- dojść po północy w poniedziałek i należeć do minionego tygodnia). Błąd nigdy nie zatrzymuje zapisu nauki.
create or replace function public.nauka_duet_po_nauce() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v uuid; kiedy timestamptz;
begin
  begin
    select x.id into v from public.nauka_duety x
     where x.stan = 'aktywny' and (x.user_id = new.user_id or x.partner_id = new.user_id) limit 1;
    if v is not null then
      if tg_table_name = 'nauka_powtorki_log' then kiedy := new.at; else kiedy := new.kiedy; end if;
      perform public.nauka_duet_rozlicz(v, public.nauka_tydzien(least((kiedy at time zone 'Europe/Warsaw')::date, public.nauka_dzis())));
    end if;
  exception when others then null;
  end;
  return null;
end $$;
drop trigger if exists nauka_zdarzenia_duet on public.nauka_zdarzenia;
create trigger nauka_zdarzenia_duet after insert on public.nauka_zdarzenia
  for each row execute function public.nauka_duet_po_nauce();
drop trigger if exists nauka_powtorki_duet on public.nauka_powtorki_log;
create trigger nauka_powtorki_duet after insert on public.nauka_powtorki_log
  for each row execute function public.nauka_duet_po_nauce();

-- =====================================================================
-- 5) Funkcje dla strony
-- =====================================================================
-- Stan paczki dla zalogowanej osoby. Rozlicza też duet (bieżący i miniony tydzień), więc jest volatile.
create or replace function public.nauka_paczka() returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  me uuid := auth.uid(); c jsonb := public.nauka_paczka_cfg();
  dz date := public.nauka_dzis(); t date := public.nauka_tydzien(public.nauka_dzis());
  p public.nauka_paczki; d public.nauka_duety; z uuid; czl jsonb; duet jsonb := null; zapr jsonb;
begin
  if me is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  select x.* into p from public.nauka_paczki x join public.nauka_paczka_czlonkowie m on m.paczka_id = x.id where m.user_id = me;
  if not found then return jsonb_build_object('ok', true, 'paczka', null, 'cfg', c, 'dzis', dz, 'tydzien', t); end if;

  select x.* into d from public.nauka_duety x where x.paczka_id = p.id and x.stan = 'aktywny' and (x.user_id = me or x.partner_id = me) limit 1;
  if found then
    perform public.nauka_duet_rozlicz(d.id, t - 7);
    perform public.nauka_duet_rozlicz(d.id, t);
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
      'id', m.user_id, 'nick', pr.nick, 'ja', m.user_id = me, 'wlasciciel', m.user_id = p.wlasciciel,
      'dzis', exists (select 1 from public.nauka_paczka_dni(m.user_id, dz, dz)),
      'dni', (select count(distinct x)::int from public.nauka_paczka_dni(m.user_id, t, dz) x),
      'w_duecie', exists (select 1 from public.nauka_duety x where x.paczka_id = p.id and x.stan = 'aktywny' and (x.user_id = m.user_id or x.partner_id = m.user_id)))
      order by m.dolaczyl_at, m.user_id), '[]'::jsonb)
    into czl
    from public.nauka_paczka_czlonkowie m left join public.nauka_profil pr on pr.user_id = m.user_id
   where m.paczka_id = p.id;

  if d.id is not null then
    z := case when d.user_id = me then d.partner_id else d.user_id end;
    duet := jsonb_build_object('id', d.id, 'stan', 'aktywny', 'z', z, 'od', d.od,
      'moje', public.nauka_duet_sesje(me, d.od, t), 'jego', public.nauka_duet_sesje(z, d.od, t),
      'cel', (c->>'duet_cel')::int, 'nagroda', (c->>'duet_nagroda')::int,
      'odebrane', exists (select 1 from public.nauka_monety m where m.user_id = me and m.klucz = 'misja:duet:' || t::text),
      'moze_zarobic', public.nauka_paczka_moze_zarobic(me));
  else
    select jsonb_build_object('id', x.id, 'stan', 'zaproszenie', 'z', x.partner_id, 'od_mnie', true) into duet
      from public.nauka_duety x where x.paczka_id = p.id and x.stan = 'zaproszenie' and x.user_id = me limit 1;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('id', x.id, 'od', x.user_id) order by x.created_at), '[]'::jsonb) into zapr
    from public.nauka_duety x where x.paczka_id = p.id and x.stan = 'zaproszenie' and x.partner_id = me;

  return jsonb_build_object('ok', true, 'cfg', c, 'dzis', dz, 'tydzien', t,
    'paczka', jsonb_build_object('kod', p.kod, 'wlasciciel', p.wlasciciel = me, 'czlonkowie', czl),
    'duet', duet, 'zaproszenia', zapr);
end $$;

-- Załóż paczkę (gdy nie jesteś w żadnej). Zwraca stan jak nauka_paczka().
create or replace function public.nauka_paczka_zaloz() returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare me uuid := auth.uid(); v uuid;
begin
  if me is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  perform pg_advisory_xact_lock(hashtext('nauka_paczka:' || me::text));
  if exists (select 1 from public.nauka_paczka_czlonkowie m where m.user_id = me) then return jsonb_build_object('ok', false, 'code', 'juz_w_paczce'); end if;
  insert into public.nauka_paczki (kod, wlasciciel) values (public.nauka_paczka_kod_nowy(), me) returning id into v;
  insert into public.nauka_paczka_czlonkowie (paczka_id, user_id) values (v, me);
  return public.nauka_paczka();
end $$;

-- Kod z linku: czytelna forma (spacje, myślniki, małe litery) → 6 znaków albo null (port normalizeSquadCode).
create or replace function public.nauka_paczka_kod(p text) returns text
language sql immutable set search_path = '' as $$
  select case when x ~ '^[A-Z0-9]{6}$' then x end from (select upper(regexp_replace(coalesce(p, ''), '[\s-]', '', 'g')) x) s
$$;

-- Podgląd przed dołączeniem: ile osób, czy pełna, czy to Twoja paczka. Tylko dla zalogowanych.
create or replace function public.nauka_paczka_podglad(p_kod text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare me uuid := auth.uid(); k text := public.nauka_paczka_kod(p_kod); p public.nauka_paczki; n int; moja uuid;
begin
  if me is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if k is null then return jsonb_build_object('ok', false, 'code', 'zly_kod'); end if;
  select * into p from public.nauka_paczki x where x.kod = k;
  if not found then return jsonb_build_object('ok', false, 'code', 'nie_ma'); end if;
  select count(*) into n from public.nauka_paczka_czlonkowie m where m.paczka_id = p.id;
  select m.paczka_id into moja from public.nauka_paczka_czlonkowie m where m.user_id = me;
  return jsonb_build_object('ok', true, 'kod', k, 'osob', n, 'max', (public.nauka_paczka_cfg()->>'max_osob')::int,
    'pelna', n >= (public.nauka_paczka_cfg()->>'max_osob')::int, 'moja', coalesce(moja = p.id, false), 'inna', moja is not null and moja <> p.id,
    'wlasciciel_nick', (select pr.nick from public.nauka_profil pr where pr.user_id = p.wlasciciel));
end $$;

-- Dołącz kodem. Gdy jesteś w innej paczce: najpierw wyjdź (code 'juz_w_paczce').
create or replace function public.nauka_paczka_dolacz(p_kod text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare me uuid := auth.uid(); k text := public.nauka_paczka_kod(p_kod); p public.nauka_paczki; n int;
begin
  if me is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if k is null then return jsonb_build_object('ok', false, 'code', 'zly_kod'); end if;
  select * into p from public.nauka_paczki x where x.kod = k;
  if not found then return jsonb_build_object('ok', false, 'code', 'nie_ma'); end if;
  perform pg_advisory_xact_lock(hashtext('nauka_paczka_p:' || p.id::text));
  if exists (select 1 from public.nauka_paczka_czlonkowie m where m.user_id = me and m.paczka_id = p.id) then return public.nauka_paczka(); end if;
  if exists (select 1 from public.nauka_paczka_czlonkowie m where m.user_id = me) then return jsonb_build_object('ok', false, 'code', 'juz_w_paczce'); end if;
  select count(*) into n from public.nauka_paczka_czlonkowie m where m.paczka_id = p.id;
  if n >= (public.nauka_paczka_cfg()->>'max_osob')::int then return jsonb_build_object('ok', false, 'code', 'pelna'); end if;
  insert into public.nauka_paczka_czlonkowie (paczka_id, user_id) values (p.id, me) on conflict do nothing;
  if not found then return jsonb_build_object('ok', false, 'code', 'juz_w_paczce'); end if;
  return public.nauka_paczka();
end $$;

-- Wyjdź z paczki (właściciel też: własność przechodzi na osobę najdłużej w paczce, ostatnia osoba = paczka znika).
create or replace function public.nauka_paczka_wyjdz() returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare me uuid := auth.uid();
begin
  if me is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  delete from public.nauka_paczka_czlonkowie m where m.user_id = me;
  if not found then return jsonb_build_object('ok', false, 'code', 'brak_paczki'); end if;
  return jsonb_build_object('ok', true, 'paczka', null);
end $$;

-- Właściciel usuwa osobę z paczki.
create or replace function public.nauka_paczka_usun_osobe(p_user uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare me uuid := auth.uid(); p uuid;
begin
  if me is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  select x.id into p from public.nauka_paczki x join public.nauka_paczka_czlonkowie m on m.paczka_id = x.id where m.user_id = me and x.wlasciciel = me;
  if p is null then return jsonb_build_object('ok', false, 'code', 'nie_wlasciciel'); end if;
  if p_user is null or p_user = me then return jsonb_build_object('ok', false, 'code', 'sam_siebie'); end if;
  delete from public.nauka_paczka_czlonkowie m where m.paczka_id = p and m.user_id = p_user;
  if not found then return jsonb_build_object('ok', false, 'code', 'nie_ma_osoby'); end if;
  return public.nauka_paczka();
end $$;

-- Zaproponuj duet osobie z paczki. Jedno własne zaproszenie naraz (nowe zastępuje stare). Gdy ta osoba już zaprosiła
-- Ciebie, duet od razu startuje.
create or replace function public.nauka_duet_zapros(p_user uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare me uuid := auth.uid(); p uuid; v uuid;
begin
  if me is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  select m.paczka_id into p from public.nauka_paczka_czlonkowie m where m.user_id = me;
  if p is null then return jsonb_build_object('ok', false, 'code', 'brak_paczki'); end if;
  if p_user is null or p_user = me or not exists (select 1 from public.nauka_paczka_czlonkowie m where m.paczka_id = p and m.user_id = p_user) then
    return jsonb_build_object('ok', false, 'code', 'nie_ma_osoby');
  end if;
  perform pg_advisory_xact_lock(hashtext('nauka_paczka_p:' || p::text));
  if exists (select 1 from public.nauka_duety x where x.stan = 'aktywny' and me in (x.user_id, x.partner_id)) then return jsonb_build_object('ok', false, 'code', 'masz_duet'); end if;
  if exists (select 1 from public.nauka_duety x where x.stan = 'aktywny' and p_user in (x.user_id, x.partner_id)) then return jsonb_build_object('ok', false, 'code', 'zajety'); end if;
  select x.id into v from public.nauka_duety x where x.stan = 'zaproszenie' and x.user_id = p_user and x.partner_id = me;
  if v is not null then
    update public.nauka_duety set stan = 'aktywny', od = public.nauka_dzis() where id = v;
    delete from public.nauka_duety x where x.stan = 'zaproszenie' and (x.user_id in (me, p_user) or x.partner_id in (me, p_user));
    return public.nauka_paczka();
  end if;
  delete from public.nauka_duety x where x.stan = 'zaproszenie' and x.user_id = me;
  insert into public.nauka_duety (paczka_id, user_id, partner_id) values (p, me, p_user);
  return public.nauka_paczka();
end $$;

-- Odpowiedź na zaproszenie do duetu.
create or replace function public.nauka_duet_odpowiedz(p_duet uuid, p_tak boolean) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare me uuid := auth.uid(); d public.nauka_duety;
begin
  if me is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  select * into d from public.nauka_duety x where x.id = p_duet and x.partner_id = me and x.stan = 'zaproszenie';
  if not found then return jsonb_build_object('ok', false, 'code', 'nie_ma'); end if;
  perform pg_advisory_xact_lock(hashtext('nauka_paczka_p:' || d.paczka_id::text));
  if not coalesce(p_tak, false) then
    delete from public.nauka_duety where id = d.id;
    return public.nauka_paczka();
  end if;
  if exists (select 1 from public.nauka_duety x where x.stan = 'aktywny' and (me in (x.user_id, x.partner_id) or d.user_id in (x.user_id, x.partner_id))) then
    delete from public.nauka_duety where id = d.id;
    return jsonb_build_object('ok', false, 'code', 'zajety');
  end if;
  update public.nauka_duety set stan = 'aktywny', od = public.nauka_dzis() where id = d.id;
  delete from public.nauka_duety x where x.stan = 'zaproszenie' and (x.user_id in (me, d.user_id) or x.partner_id in (me, d.user_id));
  return public.nauka_paczka();
end $$;

-- Zakończ swój duet albo cofnij własne zaproszenie. Nagroda za ten tydzień, jeśli już przyznana, zostaje.
create or replace function public.nauka_duet_zakoncz() returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare me uuid := auth.uid();
begin
  if me is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  delete from public.nauka_duety x where (x.stan = 'aktywny' and me in (x.user_id, x.partner_id)) or (x.stan = 'zaproszenie' and x.user_id = me);
  return public.nauka_paczka();
end $$;

-- =====================================================================
-- 6) Uprawnienia
-- =====================================================================
revoke execute on function
  public.nauka_paczka_cfg(), public.nauka_paczka_po_wyjsciu(), public.nauka_paczka_dni(uuid, date, date),
  public.nauka_paczka_moze_zarobic(uuid), public.nauka_paczka_kod_nowy(), public.nauka_duet_sesje(uuid, date, date),
  public.nauka_duet_rozlicz(uuid, date), public.nauka_duet_po_nauce(), public.nauka_paczka_kod(text),
  public.nauka_paczka(), public.nauka_paczka_zaloz(), public.nauka_paczka_podglad(text), public.nauka_paczka_dolacz(text),
  public.nauka_paczka_wyjdz(), public.nauka_paczka_usun_osobe(uuid), public.nauka_duet_zapros(uuid),
  public.nauka_duet_odpowiedz(uuid, boolean), public.nauka_duet_zakoncz()
from public, anon, authenticated;
grant execute on function
  public.nauka_paczka(), public.nauka_paczka_zaloz(), public.nauka_paczka_podglad(text), public.nauka_paczka_dolacz(text),
  public.nauka_paczka_wyjdz(), public.nauka_paczka_usun_osobe(uuid), public.nauka_duet_zapros(uuid),
  public.nauka_duet_odpowiedz(uuid, boolean), public.nauka_duet_zakoncz()
to authenticated;

notify pgrst, 'reload schema';
