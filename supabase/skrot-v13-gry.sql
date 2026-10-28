-- Skrót BM v13: gry (Fruń, Pary, Przejdź), punkty rankingu i Ranking kierunku.
-- Wklej w Supabase → SQL Editor → Run. Można uruchamiać wielokrotnie (nie kasuje danych).
-- Wymaga wcześniej: nauka.sql … skrot-v12-zabezpieczenia.sql (korzysta z nauka_platny, nauka_admin, nauka_konta).
--
-- Zasady:
--   • Punkty rankingu (🏆) wpisuje WYŁĄCZNIE baza, w funkcjach poniżej. Przeglądarka nie ma prawa zapisu do tabel.
--   • Odpowiedź ABCD i wynik zadania liczbowego sprawdza baza na podstawie materialContent (materiały roku).
--     „Moje materiały” (myContent) nie dają punktów rankingu.
--   • To samo pytanie daje punkty raz dziennie (klucz w nauka_rp) i tylko za PIERWSZĄ odpowiedź tego dnia
--     (bez zgadywania A, B, C, D po kolei). Dzienne limity na źródło są twarde.
--   • W rankingu widać tylko pseudonim i tylko osoby, które same włączyły widoczność (opt-in).
--   • Grupę (C111/C112/C113) baza czyta z dokumentu postępu osoby (nauka_docs, kolekcja progress, pole group).

-- =====================================================================
-- 1) Ustawienia
-- =====================================================================
create or replace function public.nauka_rp_cfg() returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object(
    'kierunek', 'BM', 'rocznik', 2026,
    'semestr_od', '2026-10-01',        -- początek semestru do widoku „Semestr”; w lutym zmień na datę 2. semestru
    'pkt_abcd', 10, 'pkt_zadanie', 20, 'pkt_powtorka', 1, 'pkt_lekcja', 30, 'pkt_seria', 5,
    'max_dzien_gry', 150,              -- odpowiedzi w grach + punkty za wynik
    'max_dzien_quiz', 300,
    'max_dzien_powtorki', 20,
    'max_dzien_lekcje', 150,
    'max_wynik_runda', 20, 'rundy_z_pkt_dzien', 3,
    'max_odp_minuta', 20, 'max_rund_dzien', 40, 'max_pytan_runda', 12,
    'min_osob_stat', 5, 'min_odp_stat', 20,
    'ukryj_adminow', true
  )
$$;

create or replace function public.nauka_dzis() returns date
language sql stable set search_path = '' as $$ select (now() at time zone 'Europe/Warsaw')::date $$;

create or replace function public.nauka_tydzien(d date) returns date
language sql immutable set search_path = '' as $$ select date_trunc('week', d::timestamp)::date $$;

-- =====================================================================
-- 2) Tabele (dostęp tylko przez funkcje; brak reguł = przeglądarka nie czyta i nie pisze)
-- =====================================================================
create table if not exists public.nauka_profil (
  user_id      uuid primary key,
  kierunek     text not null default 'BM' check (kierunek ~ '^[A-Z]{2,6}$'),
  rocznik      int  not null default 2026 check (rocznik between 2020 and 2100),
  nick         text check (nick is null or char_length(nick) between 3 and 20),
  w_rankingu   boolean not null default false,
  nick_zmiana  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create unique index if not exists nauka_profil_nick_uq
  on public.nauka_profil (kierunek, rocznik, lower(nick)) where nick is not null;

-- Księga punktów rankingu: jeden wiersz = jedno przyznanie punktów.
create table if not exists public.nauka_rp (
  id         bigint generated always as identity primary key,
  user_id    uuid not null,
  dzien      date not null,
  tydzien    date not null,
  zrodlo     text not null check (zrodlo in ('gra','wynik','quiz','powtorka','lekcja','seria')),
  klucz      text not null check (char_length(klucz) between 1 and 200),
  sid        text,
  pkt        int  not null check (pkt between 0 and 100),
  run_id     uuid,
  created_at timestamptz not null default now(),
  unique (user_id, dzien, klucz)
);
alter table public.nauka_rp add column if not exists run_id uuid;
create index if not exists nauka_rp_tydzien_idx on public.nauka_rp (tydzien, user_id);
create index if not exists nauka_rp_dzien_idx   on public.nauka_rp (dzien, user_id);
create index if not exists nauka_rp_user_idx    on public.nauka_rp (user_id, dzien desc);

-- Wszystkie odpowiedzi sprawdzone przez bazę (do statystyk rocznika i limitu tempa).
create table if not exists public.nauka_odp (
  id         bigint generated always as identity primary key,
  user_id    uuid not null,
  mid        text not null,
  idx        text not null,            -- ABCD: indeks pytania; zadanie: "<w.id>:<j>"
  sid        text,
  rodzaj     text not null check (rodzaj in ('abcd','zadanie')),
  ok         boolean not null,
  zrodlo     text not null check (zrodlo in ('gra','quiz')),
  run_id     uuid,
  created_at timestamptz not null default now()
);
create index if not exists nauka_odp_user_idx on public.nauka_odp (user_id, created_at desc);
create index if not exists nauka_odp_sid_idx  on public.nauka_odp (sid, created_at desc);
create index if not exists nauka_odp_mid_idx  on public.nauka_odp (mid, created_at desc);

-- Rundy gier.
create table if not exists public.nauka_gry (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  gra        text not null check (gra in ('frun','pary','przejdz')),
  sid        text,
  seed       int  not null,
  start      timestamptz not null default now(),
  koniec     timestamptz,
  wynik      int,
  czas_ms    int,
  bledy      int,
  pytania    int not null default 0,
  ozywienia  int not null default 0,
  status     text not null default 'trwa' check (status in ('trwa','ok','podejrzana','porzucona')),
  powod      text,
  pkt        int not null default 0
);
create index if not exists nauka_gry_user_idx on public.nauka_gry (user_id, start desc);
create index if not exists nauka_gry_start_idx on public.nauka_gry (start desc);

alter table public.nauka_profil enable row level security;
alter table public.nauka_rp     enable row level security;
alter table public.nauka_odp    enable row level security;
alter table public.nauka_gry    enable row level security;
revoke all on public.nauka_profil, public.nauka_rp, public.nauka_odp, public.nauka_gry from anon, authenticated;

-- =====================================================================
-- 3) Funkcje pomocnicze (tylko dla innych funkcji bazy)
-- =====================================================================
-- Czy ta osoba może zdobywać punkty: zalogowana, pełny dostęp z tego urządzenia, konto nie zablokowane.
create or replace function public.nauka_rp_mozna() returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and public.nauka_platny()
     and not exists (select 1 from public.nauka_konta k where k.user_id = auth.uid() and k.zablokowane)
$$;

create or replace function public.nauka_rp_pula(z text) returns text
language sql immutable set search_path = '' as $$
  select case when z in ('gra','wynik') then 'gry' when z = 'quiz' then 'quiz'
              when z = 'powtorka' then 'powtorki' when z = 'lekcja' then 'lekcje' else 'seria' end
$$;

-- Przyznaje punkty z limitem dziennym puli. Zwraca, ile faktycznie przyznano (0 = limit albo już było dziś).
-- Pierwsze punkty dnia dokładają +pkt_seria, jeśli wczoraj też były punkty.
create or replace function public.nauka_rp_dodaj(p_user uuid, p_zrodlo text, p_klucz text, p_sid text, p_pkt int, p_run uuid default null)
returns int
language plpgsql security definer set search_path = '' as $$
declare
  c jsonb := public.nauka_rp_cfg();
  d date := public.nauka_dzis();
  pula text := public.nauka_rp_pula(p_zrodlo);
  limit_ int;
  uzyte int;
  dam int;
  n int;
  pierwsze boolean;
begin
  if p_pkt is null or p_pkt <= 0 then return 0; end if;
  limit_ := case pula when 'gry' then (c->>'max_dzien_gry')::int when 'quiz' then (c->>'max_dzien_quiz')::int
                      when 'powtorki' then (c->>'max_dzien_powtorki')::int when 'lekcje' then (c->>'max_dzien_lekcje')::int
                      else 1000 end;
  -- blokada na osobę, żeby dwa równoległe zapytania nie przekroczyły limitu
  perform pg_advisory_xact_lock(hashtext('nauka_rp:' || p_user::text));
  select coalesce(sum(r.pkt), 0) into uzyte from public.nauka_rp r
   where r.user_id = p_user and r.dzien = d and public.nauka_rp_pula(r.zrodlo) = pula;
  dam := least(p_pkt, greatest(0, limit_ - uzyte));
  if dam <= 0 then return 0; end if;
  pierwsze := not exists (select 1 from public.nauka_rp r where r.user_id = p_user and r.dzien = d);
  insert into public.nauka_rp (user_id, dzien, tydzien, zrodlo, klucz, sid, pkt, run_id)
  values (p_user, d, public.nauka_tydzien(d), p_zrodlo, left(p_klucz, 200), p_sid, dam, p_run)
  on conflict (user_id, dzien, klucz) do nothing;
  get diagnostics n = row_count;
  if n = 0 then return 0; end if;
  if pierwsze and exists (select 1 from public.nauka_rp r where r.user_id = p_user and r.dzien = d - 1) then
    insert into public.nauka_rp (user_id, dzien, tydzien, zrodlo, klucz, sid, pkt)
    values (p_user, d, public.nauka_tydzien(d), 'seria', 'seria', null, (c->>'pkt_seria')::int)
    on conflict (user_id, dzien, klucz) do nothing;
  end if;
  return dam;
end $$;

-- Limit tempa odpowiedzi: true = za szybko.
create or replace function public.nauka_rp_za_szybko(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select (select count(*) from public.nauka_odp o
          where o.user_id = p_user and o.created_at > now() - interval '1 minute')
         >= (public.nauka_rp_cfg()->>'max_odp_minuta')::int
$$;

-- Przedmiot materiału roku (null, gdy materiał nie istnieje).
create or replace function public.nauka_rp_sid(p_mid text) returns text
language sql stable security definer set search_path = '' as $$
  select data->>'subjectId' from public.nauka_docs where kolekcja = 'materials' and id = p_mid
$$;

-- Runda gry tej osoby, jeszcze trwająca, w której wolno zadać kolejne pytanie. Zwraca id albo null.
create or replace function public.nauka_rp_runda_pytanie(p_run uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare r public.nauka_gry;
begin
  if p_run is null then return null; end if;
  select * into r from public.nauka_gry g where g.id = p_run and g.user_id = auth.uid() for update;
  if not found or r.status <> 'trwa' or r.gra = 'pary' then return null; end if;
  if r.start < now() - interval '2 hours' then return null; end if;
  if r.pytania >= (public.nauka_rp_cfg()->>'max_pytan_runda')::int then return null; end if;
  update public.nauka_gry set pytania = pytania + 1 where id = r.id;
  return r.id;
end $$;

-- Czy konto to starosta (do ukrywania w rankingu).
create or replace function public.nauka_rp_admin_uid(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from auth.users u join public.nauka_admini a on a.email = lower(u.email) where u.id = p_user)
$$;

-- Grupa z dokumentu postępu.
create or replace function public.nauka_rp_grupa(p_user uuid) returns text
language sql stable security definer set search_path = '' as $$
  select nullif(data->>'group', '') from public.nauka_docs where kolekcja = 'progress' and id = p_user::text
$$;

-- Pseudonim: 3–20 znaków, litery (także polskie), cyfry, spacja, _ . -; bez słów zastrzeżonych i wulgaryzmów.
-- Sprawdzamy po ujednoliceniu: bez polskich znaków, 0/1/3/4 → o/i/e/a, bez spacji i _ . - (więc „k.u r-w_a” też odpada).
create or replace function public.nauka_nick_ok(p text) returns text
language plpgsql immutable set search_path = '' as $$
declare n text := regexp_replace(btrim(coalesce(p, '')), '\s+', ' ', 'g'); l text;
begin
  if char_length(n) < 3 or char_length(n) > 20 then return 'nick_dlugosc'; end if;
  if n !~ '^[A-Za-z0-9ĄĆĘŁŃÓŚŹŻąćęłńóśźż _.-]+$' then return 'nick_znaki'; end if;
  l := lower(translate(n, 'ĄĆĘŁŃÓŚŹŻąćęłńóśźż0134 _.-', 'acelnoszzacelnoszzoiea'));
  if l ~ '(admin|starost|skrot|moderat|support|pomoc|anthropic|claude)' then return 'nick_zastrzezony'; end if;
  -- Rdzenie wulgaryzmów i obelg (PL + EN). Celowo bez krótkich rdzeni, które psują zwykłe słowa (np. „anal” → analiza, „rape” → grape).
  if l ~ ('(kurw|kurew|huj|jeb|pierd|pizd|cipa|cipk|kutas|fiut|dziwk|szmat|dupa|dupek|cwel|ciota|pedal|frajer|debil|kretyn|idiot|zjeb|sperm'
        || '|fuck|fuk|shit|bitch|cunt|dick|cock|pussy|whore|slut|nigg|fag|retard|asshole|bastard|penis|vagin|porn|nazi|hitler)') then
    return 'nick_zastrzezony';
  end if;
  return null;
end $$;

-- =====================================================================
-- 4) Funkcje dla strony
-- =====================================================================

-- Profil rankingowy zalogowanej osoby (tworzy pusty przy pierwszym wywołaniu).
create or replace function public.nauka_profil_moj() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare p public.nauka_profil; c jsonb := public.nauka_rp_cfg();
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  insert into public.nauka_profil (user_id, kierunek, rocznik) values (auth.uid(), c->>'kierunek', (c->>'rocznik')::int)
  on conflict (user_id) do nothing;
  select * into p from public.nauka_profil where user_id = auth.uid();
  return jsonb_build_object('ok', true, 'nick', p.nick, 'w_rankingu', p.w_rankingu, 'kierunek', p.kierunek,
    'rocznik', p.rocznik, 'grupa', public.nauka_rp_grupa(auth.uid()),
    'nick_zmiana_od', case when p.nick_zmiana is null then null else p.nick_zmiana + interval '7 days' end);
end $$;

-- Ustawia pseudonim i/lub widoczność. null = bez zmian. Pseudonim zmienia się najwyżej raz na 7 dni.
create or replace function public.nauka_profil_ustaw(p_nick text default null, p_w_rankingu boolean default null)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare p public.nauka_profil; blad text; n text;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  perform public.nauka_profil_moj();
  select * into p from public.nauka_profil where user_id = auth.uid() for update;
  if p_nick is not null then
    n := regexp_replace(btrim(p_nick), '\s+', ' ', 'g');
    if p.nick is distinct from n then
      blad := public.nauka_nick_ok(n);
      if blad is not null then return jsonb_build_object('ok', false, 'code', blad); end if;
      if p.nick is not null and p.nick_zmiana is not null and p.nick_zmiana > now() - interval '7 days' then
        return jsonb_build_object('ok', false, 'code', 'nick_za_wczesnie', 'od', p.nick_zmiana + interval '7 days');
      end if;
      if exists (select 1 from public.nauka_profil x where x.kierunek = p.kierunek and x.rocznik = p.rocznik
                 and lower(x.nick) = lower(n) and x.user_id <> p.user_id) then
        return jsonb_build_object('ok', false, 'code', 'nick_zajety');
      end if;
      update public.nauka_profil set nick = n, nick_zmiana = case when p.nick is null then null else now() end,
        updated_at = now() where user_id = p.user_id;
    end if;
  end if;
  if p_w_rankingu is not null then
    if p_w_rankingu and coalesce(n, p.nick) is null then
      return jsonb_build_object('ok', false, 'code', 'nick_brak');
    end if;
    update public.nauka_profil set w_rankingu = p_w_rankingu, updated_at = now() where user_id = p.user_id;
  end if;
  return public.nauka_profil_moj();
end $$;

-- Start rundy gry.
create or replace function public.nauka_gra_start(p_gra text, p_sid text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare c jsonb := public.nauka_rp_cfg(); v_id uuid; v_seed int;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_rp_mozna() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  if p_gra not in ('frun','pary','przejdz') then return jsonb_build_object('ok', false, 'code', 'bad_game'); end if;
  if p_sid is not null and char_length(p_sid) > 80 then return jsonb_build_object('ok', false, 'code', 'bad_subject'); end if;
  if (select count(*) from public.nauka_gry g where g.user_id = auth.uid() and g.start >= (public.nauka_dzis()::timestamp at time zone 'Europe/Warsaw'))
     >= (c->>'max_rund_dzien')::int then
    return jsonb_build_object('ok', false, 'code', 'too_many_runs');
  end if;
  -- stare, niezakończone rundy tej osoby zamykamy jako porzucone
  update public.nauka_gry set status = 'porzucona', koniec = now()
   where user_id = auth.uid() and status = 'trwa' and start < now() - interval '2 hours';
  v_seed := floor(random() * 2147483646)::int + 1;
  insert into public.nauka_gry (user_id, gra, sid, seed) values (auth.uid(), p_gra, p_sid, v_seed) returning id into v_id;
  -- sprzątanie historii starszej niż 12 miesięcy (tanio, przy okazji)
  delete from public.nauka_odp where created_at < now() - interval '12 months';
  delete from public.nauka_gry where start < now() - interval '12 months';
  delete from public.nauka_rp  where dzien < public.nauka_dzis() - 400;
  return jsonb_build_object('ok', true, 'run', v_id, 'seed', v_seed);
end $$;

-- Odpowiedź ABCD. p_wybor = indeks w ORYGINALNEJ kolejności odpowiedzi (przed tasowaniem na ekranie).
-- p_zrodlo: 'gra' (wtedy p_run wymagany) albo 'quiz'.
-- Punkty tylko za pierwszą odpowiedź na to pytanie dzisiaj (inaczej dałoby się klikać A, B, C, D po kolei).
create or replace function public.nauka_rp_odpowiedz(p_mid text, p_idx int, p_wybor int, p_zrodlo text, p_run uuid default null)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  c jsonb := public.nauka_rp_cfg();
  q jsonb; v_sid text; v_ok boolean; v_correct int; v_pkt int := 0; v_run uuid; v_pierwsza boolean;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_rp_mozna() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  if p_zrodlo not in ('gra','quiz') then return jsonb_build_object('ok', false, 'code', 'bad_source'); end if;
  if p_idx is null or p_idx < 0 then return jsonb_build_object('ok', false, 'code', 'no_question'); end if;
  if public.nauka_rp_za_szybko(auth.uid()) then return jsonb_build_object('ok', false, 'code', 'too_fast'); end if;
  select data->'quiz'->p_idx into q from public.nauka_docs where kolekcja = 'materialContent' and id = p_mid;
  if q is null or coalesce(jsonb_typeof(q->'correct'), '') <> 'number' then return jsonb_build_object('ok', false, 'code', 'no_question'); end if;
  v_sid := public.nauka_rp_sid(p_mid);
  if v_sid is null then return jsonb_build_object('ok', false, 'code', 'no_question'); end if;
  if p_zrodlo = 'gra' then
    v_run := public.nauka_rp_runda_pytanie(p_run);
    if v_run is null then return jsonb_build_object('ok', false, 'code', 'bad_run'); end if;
  end if;
  v_correct := (q->>'correct')::int;
  v_ok := p_wybor is not null and p_wybor = v_correct;
  v_pierwsza := not exists (select 1 from public.nauka_odp o where o.user_id = auth.uid() and o.rodzaj = 'abcd'
                 and o.mid = p_mid and o.idx = p_idx::text
                 and o.created_at >= (public.nauka_dzis()::timestamp at time zone 'Europe/Warsaw'));
  insert into public.nauka_odp (user_id, mid, idx, sid, rodzaj, ok, zrodlo, run_id)
  values (auth.uid(), p_mid, p_idx::text, v_sid, 'abcd', v_ok, p_zrodlo, v_run);
  if v_ok then
    if v_pierwsza then
      v_pkt := public.nauka_rp_dodaj(auth.uid(), p_zrodlo, 'q:' || p_mid || ':' || p_idx, v_sid, (c->>'pkt_abcd')::int, v_run);
    end if;
    if v_run is not null then update public.nauka_gry set ozywienia = ozywienia + 1 where id = v_run; end if;
  end if;
  return jsonb_build_object('ok', true, 'poprawna', v_ok, 'correct', v_correct, 'pkt', v_pkt);
end $$;

-- Zadanie liczbowe z materialContent.worked[].similar[]. p_wid = w.id (porównywane jako tekst), p_j = indeks w similar.
create or replace function public.nauka_rp_zadanie(p_mid text, p_wid text, p_j int, p_wynik numeric, p_zrodlo text, p_run uuid default null)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  c jsonb := public.nauka_rp_cfg();
  s jsonb; v_sid text; v_res numeric; v_tol numeric; v_ok boolean; v_pkt int := 0; v_run uuid; v_pierwsza boolean;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_rp_mozna() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  if p_zrodlo not in ('gra','quiz') then return jsonb_build_object('ok', false, 'code', 'bad_source'); end if;
  if p_j is null or p_j < 0 then return jsonb_build_object('ok', false, 'code', 'no_task'); end if;
  if public.nauka_rp_za_szybko(auth.uid()) then return jsonb_build_object('ok', false, 'code', 'too_fast'); end if;
  select w->'similar'->p_j into s
    from public.nauka_docs d, jsonb_array_elements(coalesce(d.data->'worked', '[]'::jsonb)) w
   where d.kolekcja = 'materialContent' and d.id = p_mid and w->>'id' = p_wid
   limit 1;
  if s is null or coalesce(jsonb_typeof(s->'result'), '') <> 'number' then return jsonb_build_object('ok', false, 'code', 'no_task'); end if;
  v_sid := public.nauka_rp_sid(p_mid);
  if v_sid is null then return jsonb_build_object('ok', false, 'code', 'no_task'); end if;
  if p_zrodlo = 'gra' then
    v_run := public.nauka_rp_runda_pytanie(p_run);
    if v_run is null then return jsonb_build_object('ok', false, 'code', 'bad_run'); end if;
  end if;
  v_res := (s->>'result')::numeric;
  -- ta sama tolerancja co numMatch() w index.html
  v_tol := coalesce(case when jsonb_typeof(s->'tol') = 'number' then (s->>'tol')::numeric end, greatest(0.01, abs(v_res) * 0.005));
  v_ok := p_wynik is not null and abs(p_wynik - v_res) <= v_tol;
  v_pierwsza := not exists (select 1 from public.nauka_odp o where o.user_id = auth.uid() and o.rodzaj = 'zadanie'
                 and o.mid = p_mid and o.idx = p_wid || ':' || p_j
                 and o.created_at >= (public.nauka_dzis()::timestamp at time zone 'Europe/Warsaw'));
  insert into public.nauka_odp (user_id, mid, idx, sid, rodzaj, ok, zrodlo, run_id)
  values (auth.uid(), p_mid, p_wid || ':' || p_j, v_sid, 'zadanie', v_ok, p_zrodlo, v_run);
  if v_ok then
    if v_pierwsza then
      v_pkt := public.nauka_rp_dodaj(auth.uid(), p_zrodlo, 'z:' || p_mid || ':' || p_wid || ':' || p_j, v_sid, (c->>'pkt_zadanie')::int, v_run);
    end if;
    if v_run is not null then update public.nauka_gry set ozywienia = ozywienia + 1 where id = v_run; end if;
  end if;
  return jsonb_build_object('ok', true, 'poprawna', v_ok, 'wynik', v_res, 'pkt', v_pkt);
end $$;

-- Fiszka oceniona w Powtórkach (+1, najwyżej 20 dziennie). Klucz = klucz karty z index.html (cardKey / glKey).
create or replace function public.nauka_rp_powtorka(p_klucz text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_sid text; v_pkt int;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_rp_mozna() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  if p_klucz is null or char_length(p_klucz) not between 3 and 180 then return jsonb_build_object('ok', false, 'code', 'bad_key'); end if;
  v_sid := case when p_klucz like 'g:%' then split_part(p_klucz, ':', 2) else public.nauka_rp_sid(split_part(p_klucz, ':', 1)) end;
  v_pkt := public.nauka_rp_dodaj(auth.uid(), 'powtorka', 'p:' || p_klucz, v_sid, (public.nauka_rp_cfg()->>'pkt_powtorka')::int);
  return jsonb_build_object('ok', true, 'pkt', v_pkt);
end $$;

-- Lekcja zakończona zdanym biletem wyjścia: +30 raz na zawsze (nie raz dziennie).
create or replace function public.nauka_rp_lekcja(p_lid text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_sid text; v_pkt int := 0;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_rp_mozna() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  select data->>'subjectId' into v_sid from public.nauka_docs
   where kolekcja = 'materials' and id = p_lid and data->>'kind' = 'lesson';
  if v_sid is null then return jsonb_build_object('ok', false, 'code', 'no_lesson'); end if;
  if exists (select 1 from public.nauka_rp r where r.user_id = auth.uid() and r.klucz = 'l:' || p_lid) then
    return jsonb_build_object('ok', true, 'pkt', 0, 'juz', true);
  end if;
  v_pkt := public.nauka_rp_dodaj(auth.uid(), 'lekcja', 'l:' || p_lid, v_sid, (public.nauka_rp_cfg()->>'pkt_lekcja')::int);
  return jsonb_build_object('ok', true, 'pkt', v_pkt);
end $$;

-- Koniec rundy. p_wynik: frun = kolumny, przejdz = najdalszy rząd, pary = znalezione pary.
-- p_bledy: tylko pary (pomyłki). Baza sprawdza, czy wynik jest możliwy w czasie, który minął na serwerze.
create or replace function public.nauka_gra_koniec(p_run uuid, p_wynik int, p_czas_ms int, p_bledy int default 0)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  c jsonb := public.nauka_rp_cfg();
  r public.nauka_gry; v_s numeric; v_max int; v_status text := 'ok'; v_powod text; v_pkt int := 0; v_raw int;
  v_rekord int; v_nowy boolean;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  select * into r from public.nauka_gry g where g.id = p_run and g.user_id = auth.uid() for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'bad_run'); end if;
  if r.status <> 'trwa' then return jsonb_build_object('ok', false, 'code', 'already_finished'); end if;
  v_s := extract(epoch from (now() - r.start));
  if p_wynik is null or p_wynik < 0 or p_wynik > 100000 then v_status := 'podejrzana'; v_powod := 'wynik spoza zakresu'; end if;
  if v_status = 'ok' and p_czas_ms is not null and p_czas_ms > v_s * 1000 + 5000 then
    v_status := 'podejrzana'; v_powod := 'czas z przeglądarki dłuższy niż na serwerze';
  end if;
  if v_status = 'ok' then
    v_max := case r.gra
      when 'frun'    then ceil(v_s * 1.1)::int + 3       -- max ~1,05 kolumny/s przy prędkości 220 i odstępie 210
      when 'przejdz' then ceil(v_s * 5)::int + 5         -- max ~5 skoków/s
      when 'pary'    then 10 end;                          -- największa plansza 5×4 = 10 par
    if p_wynik > v_max then v_status := 'podejrzana'; v_powod := format('wynik %s > możliwe %s w %ss', p_wynik, v_max, round(v_s)); end if;
    if r.gra = 'pary' and p_wynik > 0 and v_s < p_wynik * 1.2 then v_status := 'podejrzana'; v_powod := 'plansza za szybko'; end if;
  end if;
  -- punkty za wynik tylko z pełnym dostępem (jak przy odpowiedziach); rekord liczy się i bez nich
  if v_status = 'ok' and public.nauka_rp_mozna() then
    v_raw := case r.gra
      when 'frun'    then p_wynik / 2
      when 'przejdz' then p_wynik / 5
      when 'pary'    then 2 * p_wynik + case when coalesce(p_bledy, 0) = 0 and p_wynik >= 6 then 10 else 0 end end;
    v_raw := least(v_raw, (c->>'max_wynik_runda')::int);
    if (select count(*) from public.nauka_gry g where g.user_id = auth.uid() and g.gra = r.gra and g.status = 'ok' and g.pkt > 0
          and g.start >= (public.nauka_dzis()::timestamp at time zone 'Europe/Warsaw')) < (c->>'rundy_z_pkt_dzien')::int then
      v_pkt := public.nauka_rp_dodaj(auth.uid(), 'wynik', 'r:' || r.id::text, r.sid, v_raw, r.id);
    end if;
  end if;
  select max(g.wynik) into v_rekord from public.nauka_gry g
   where g.user_id = auth.uid() and g.gra = r.gra and g.status = 'ok' and g.id <> r.id
     and (r.gra <> 'pary' or g.sid is not distinct from r.sid);
  v_nowy := v_status = 'ok' and p_wynik > coalesce(v_rekord, 0);
  update public.nauka_gry set koniec = now(), wynik = p_wynik, czas_ms = p_czas_ms, bledy = p_bledy,
    status = v_status, powod = v_powod, pkt = v_pkt where id = r.id;
  return jsonb_build_object('ok', true, 'status', v_status, 'pkt', v_pkt,
    'rekord', greatest(coalesce(v_rekord, 0), case when v_status = 'ok' then p_wynik else 0 end), 'nowy_rekord', v_nowy,
    'pkt_runda', (select coalesce(sum(x.pkt), 0) from public.nauka_rp x where x.user_id = auth.uid() and x.run_id = r.id));
end $$;

-- Ranking. p_zakres: 'tydzien' | 'semestr'. p_grupa: null = cały kierunek, albo 'C111'…; p_sid: null = wszystkie przedmioty.
create or replace function public.nauka_ranking(p_zakres text default 'tydzien', p_grupa text default null, p_sid text default null)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  c jsonb := public.nauka_rp_cfg();
  v_d date := public.nauka_dzis();
  v_od date; v_do date; me public.nauka_profil; v_moje int; v_out jsonb;
  v_w_grupie boolean := p_grupa is null or coalesce(public.nauka_rp_grupa(auth.uid()) = p_grupa, false);
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_platny() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  if p_zakres = 'semestr' then v_od := (c->>'semestr_od')::date; v_do := v_d;
  else v_od := public.nauka_tydzien(v_d); v_do := v_od + 6; end if;
  select * into me from public.nauka_profil where user_id = auth.uid();
  select coalesce(sum(r.pkt), 0) into v_moje from public.nauka_rp r
   where r.user_id = auth.uid() and r.dzien between v_od and v_do and (p_sid is null or r.sid = p_sid);

  with suma as (
    select r.user_id, sum(r.pkt)::int pkt from public.nauka_rp r
     where r.dzien between v_od and v_do and (p_sid is null or r.sid = p_sid)
     group by r.user_id),
  widoczni as (
    select s.user_id, p.nick, s.pkt from suma s join public.nauka_profil p on p.user_id = s.user_id
     where p.w_rankingu and p.nick is not null and s.pkt > 0
       and p.kierunek = coalesce(me.kierunek, c->>'kierunek') and p.rocznik = coalesce(me.rocznik, (c->>'rocznik')::int)
       and (p_grupa is null or public.nauka_rp_grupa(s.user_id) = p_grupa)
       and not exists (select 1 from public.nauka_konta k where k.user_id = s.user_id and k.zablokowane)
       and not ((c->>'ukryj_adminow')::boolean and public.nauka_rp_admin_uid(s.user_id))),
  miejsca as (
    select w.*, rank() over (order by w.pkt desc) miejsce, row_number() over (order by w.pkt desc, lower(w.nick)) lp
      from widoczni w),
  ja as (select * from miejsca where user_id = auth.uid())
  select jsonb_build_object(
    'ok', true, 'zakres', coalesce(p_zakres, 'tydzien'), 'od', v_od, 'do', v_do, 'grupa', p_grupa, 'sid', p_sid,
    'n', (select count(*) from miejsca),
    'top', coalesce((select jsonb_agg(jsonb_build_object('miejsce', m.miejsce, 'nick', m.nick, 'pkt', m.pkt, 'ja', m.user_id = auth.uid()) order by m.lp)
                     from miejsca m where m.lp <= 10), '[]'::jsonb),
    'sasiedzi', coalesce((select jsonb_agg(jsonb_build_object('miejsce', m.miejsce, 'nick', m.nick, 'pkt', m.pkt, 'ja', m.user_id = auth.uid()) order by m.lp)
                          from miejsca m, ja where m.lp between ja.lp - 2 and ja.lp + 2 and ja.lp > 10), '[]'::jsonb),
    -- „ja”: moje miejsce. Gdy jestem ukryty, liczymy, które miejsce bym miał (inni widzą listę bez mnie).
    -- Gdy filtr grupy to nie moja grupa: tylko moje punkty, bez miejsca.
    'ja', jsonb_build_object(
       'pkt', v_moje,
       'widoczny', exists (select 1 from ja),
       'w_grupie', v_w_grupie,
       'miejsce', case when not v_w_grupie then null
                       else coalesce((select miejsce from ja), case when v_moje > 0 then 1 + (select count(*) from miejsca where pkt > v_moje) end) end,
       'z', case when not v_w_grupie then null
                 else (select count(*) from miejsca) + case when exists (select 1 from ja) or v_moje = 0 then 0 else 1 end end)
  ) into v_out;
  return v_out;
end $$;

-- Rekordy gry w tym tygodniu (top 10 widocznych + mój najlepszy wynik).
create or replace function public.nauka_rekordy(p_gra text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare c jsonb := public.nauka_rp_cfg(); v_od timestamptz := (public.nauka_tydzien(public.nauka_dzis())::timestamp at time zone 'Europe/Warsaw');
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_platny() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  return jsonb_build_object('ok', true, 'gra', p_gra,
    'top', coalesce((select jsonb_agg(jsonb_build_object('nick', x.nick, 'wynik', x.wynik, 'ja', x.user_id = auth.uid()) order by x.wynik desc, lower(x.nick))
      from (select g.user_id, p.nick, max(g.wynik) wynik from public.nauka_gry g join public.nauka_profil p on p.user_id = g.user_id
             where g.gra = p_gra and g.status = 'ok' and g.start >= v_od and p.w_rankingu and p.nick is not null
               and not exists (select 1 from public.nauka_konta k where k.user_id = g.user_id and k.zablokowane)
               and not ((c->>'ukryj_adminow')::boolean and public.nauka_rp_admin_uid(g.user_id))
             group by g.user_id, p.nick order by max(g.wynik) desc, lower(p.nick) limit 10) x), '[]'::jsonb),
    'moj_tydzien', (select max(g.wynik) from public.nauka_gry g where g.user_id = auth.uid() and g.gra = p_gra and g.status = 'ok' and g.start >= v_od),
    'moj_rekord',  (select max(g.wynik) from public.nauka_gry g where g.user_id = auth.uid() and g.gra = p_gra and g.status = 'ok'));
end $$;

-- „Jak radzi sobie kierunek”: dane zbiorcze, bez osób. Przedmiot / materiał pokazujemy dopiero przy ≥ min_osob_stat osobach.
create or replace function public.nauka_kierunek_stat() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  c jsonb := public.nauka_rp_cfg();
  v_t date := public.nauka_tydzien(public.nauka_dzis());
  v_od timestamptz := (v_t::timestamp at time zone 'Europe/Warsaw');
  v_min_o int := (c->>'min_osob_stat')::int; v_min_a int := (c->>'min_odp_stat')::int;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_platny() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  return jsonb_build_object('ok', true, 'tydzien', v_t,
    'aktywni', (select count(distinct r.user_id) from public.nauka_rp r where r.tydzien = v_t),
    'przedmioty', coalesce((
      select jsonb_agg(jsonb_build_object('sid', x.sid, 'proc', x.proc, 'proc_poprz', x.proc_poprz, 'osob', x.osob, 'odp', x.odp, 'moj_proc', x.moj_proc,
                                          'lepiej_niz', x.lepiej_niz) order by x.proc)
      from (
        select o.sid,
               round(100.0 * avg((o.ok)::int) filter (where o.created_at >= v_od))::int proc,
               round(100.0 * avg((o.ok)::int) filter (where o.created_at < v_od))::int proc_poprz,
               count(distinct o.user_id) filter (where o.created_at >= v_od) osob,
               count(*) filter (where o.created_at >= v_od) odp,
               round(100.0 * avg((o.ok)::int) filter (where o.created_at >= v_od and o.user_id = auth.uid()))::int moj_proc,
               -- odsetek osób z niższą skutecznością niż moja w tym tygodniu (tylko gdy mam ≥ 10 odpowiedzi)
               (select round(100.0 * count(*) filter (where u.p < m.p) / nullif(count(*), 0))::int
                  from (select o2.user_id, avg((o2.ok)::int) p from public.nauka_odp o2
                         where o2.sid = o.sid and o2.created_at >= v_od group by o2.user_id having count(*) >= 10) u,
                       (select avg((o3.ok)::int) p from public.nauka_odp o3
                         where o3.sid = o.sid and o3.created_at >= v_od and o3.user_id = auth.uid() having count(*) >= 10) m) lepiej_niz
          from public.nauka_odp o
         where o.created_at >= v_od - interval '7 days' and o.sid is not null
         group by o.sid
        having count(distinct o.user_id) filter (where o.created_at >= v_od) >= v_min_o
           and count(*) filter (where o.created_at >= v_od) >= v_min_a) x), '[]'::jsonb),
    'trudne', coalesce((
      select jsonb_agg(jsonb_build_object('mid', y.mid, 'sid', y.sid, 'proc', y.proc, 'odp', y.odp) order by y.proc)
      from (select o.mid, max(o.sid) sid, round(100.0 * avg((o.ok)::int))::int proc, count(*) odp
              from public.nauka_odp o where o.created_at >= v_od - interval '7 days'
             group by o.mid having count(*) >= v_min_a and count(distinct o.user_id) >= v_min_o
             order by avg((o.ok)::int) limit 5) y), '[]'::jsonb));
end $$;

-- Starosta: statystyki gier, podejrzane rundy, pseudonimy do ewentualnej moderacji.
create or replace function public.nauka_admin_gry() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_t date := public.nauka_tydzien(public.nauka_dzis());
begin
  if not public.nauka_admin() then return jsonb_build_object('ok', false, 'code', 'not_admin'); end if;
  return jsonb_build_object('ok', true,
    'aktywni_tydzien', (select count(distinct user_id) from public.nauka_rp where tydzien = v_t),
    'widoczni', (select count(*) from public.nauka_profil where w_rankingu),
    'rundy_tydzien', (select jsonb_object_agg(gra, n) from (select gra, count(*) n from public.nauka_gry
                       where start >= (v_t::timestamp at time zone 'Europe/Warsaw') group by gra) z),
    'podejrzane', coalesce((select jsonb_agg(jsonb_build_object('run', g.id, 'email', u.email, 'nick', p.nick, 'gra', g.gra, 'wynik', g.wynik,
                       'czas_s', round(extract(epoch from (g.koniec - g.start))), 'powod', g.powod, 'start', g.start) order by g.start desc)
                       from public.nauka_gry g left join auth.users u on u.id = g.user_id left join public.nauka_profil p on p.user_id = g.user_id
                      where g.status = 'podejrzana' and g.start > now() - interval '14 days'), '[]'::jsonb),
    'pseudonimy', coalesce((select jsonb_agg(jsonb_build_object('user_id', p.user_id, 'nick', p.nick, 'w_rankingu', p.w_rankingu, 'email', u.email) order by lower(p.nick))
                       from public.nauka_profil p left join auth.users u on u.id = p.user_id where p.nick is not null), '[]'::jsonb));
end $$;

-- Starosta: usuwa pseudonim (np. obraźliwy). Osoba znika z rankingu, dopóki nie ustawi nowego.
create or replace function public.nauka_admin_nick_usun(p_user uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if not public.nauka_admin() then return jsonb_build_object('ok', false, 'code', 'not_admin'); end if;
  update public.nauka_profil set nick = null, w_rankingu = false, nick_zmiana = null, updated_at = now() where user_id = p_user;
  return jsonb_build_object('ok', found);
end $$;

-- =====================================================================
-- 5) Uprawnienia
-- =====================================================================
-- Supabase domyślnie daje anon/authenticated prawo do każdej nowej funkcji – odbieramy wszystkim (jak w v12)
revoke execute on function
  public.nauka_rp_cfg(), public.nauka_dzis(), public.nauka_tydzien(date), public.nauka_rp_mozna(), public.nauka_rp_pula(text),
  public.nauka_rp_dodaj(uuid, text, text, text, int, uuid), public.nauka_rp_za_szybko(uuid), public.nauka_rp_sid(text),
  public.nauka_rp_runda_pytanie(uuid), public.nauka_rp_admin_uid(uuid), public.nauka_rp_grupa(uuid), public.nauka_nick_ok(text),
  public.nauka_profil_moj(), public.nauka_profil_ustaw(text, boolean), public.nauka_gra_start(text, text),
  public.nauka_rp_odpowiedz(text, int, int, text, uuid), public.nauka_rp_zadanie(text, text, int, numeric, text, uuid),
  public.nauka_rp_powtorka(text), public.nauka_rp_lekcja(text), public.nauka_gra_koniec(uuid, int, int, int),
  public.nauka_ranking(text, text, text), public.nauka_rekordy(text), public.nauka_kierunek_stat(),
  public.nauka_admin_gry(), public.nauka_admin_nick_usun(uuid)
from public, anon, authenticated;

-- …i dajemy z powrotem tylko to, co woła strona
grant execute on function
  public.nauka_profil_moj(), public.nauka_profil_ustaw(text, boolean), public.nauka_gra_start(text, text),
  public.nauka_rp_odpowiedz(text, int, int, text, uuid), public.nauka_rp_zadanie(text, text, int, numeric, text, uuid),
  public.nauka_rp_powtorka(text), public.nauka_rp_lekcja(text), public.nauka_gra_koniec(uuid, int, int, int),
  public.nauka_ranking(text, text, text), public.nauka_rekordy(text), public.nauka_kierunek_stat(),
  public.nauka_admin_gry(), public.nauka_admin_nick_usun(uuid)
to authenticated;

notify pgrst, 'reload schema';
