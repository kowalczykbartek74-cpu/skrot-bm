-- Skrót BM v15: Hasło dnia, Drabina, Boss przed kolokwium (docs/gry/SPEC-2.md).
-- Wklej w Supabase → SQL Editor → Run. Można uruchamiać wielokrotnie (nie kasuje danych).
-- Wymaga skrot-v13-gry.sql. Nie wymaga v14 (monety): gdy v14 jest w bazie, monety za nowe punkty naliczą się same.
--
-- Zasady jak w v13:
--   • punkty wpisuje wyłącznie baza (nauka_rp_dodaj), przeglądarka nie ma dostępu do tabel;
--   • litery w Haśle dnia sprawdza baza, a słowo trafia do przeglądarki dopiero po końcu gry;
--   • statystyki rocznika pokazujemy dopiero od 5 osób.

-- =====================================================================
-- 1) Rozszerzenia tabel z v13
-- =====================================================================
-- Która odpowiedź została wybrana (indeks w oryginalnej kolejności) – do koła „Zapytaj rok”.
alter table public.nauka_odp add column if not exists wybor smallint;

-- Nowe źródła punktów: haslo (Hasło dnia), boss (nagroda za pokonanego bossa).
alter table public.nauka_rp drop constraint if exists nauka_rp_zrodlo_check;
alter table public.nauka_rp add constraint nauka_rp_zrodlo_check
  check (zrodlo in ('gra','wynik','quiz','powtorka','lekcja','seria','haslo','boss'));

-- Nowa gra w rundach: drabina.
alter table public.nauka_gry drop constraint if exists nauka_gry_gra_check;
alter table public.nauka_gry add constraint nauka_gry_gra_check check (gra in ('frun','pary','przejdz','drabina'));

-- Pule dzienne: haslo i boss mają własne (bez limitu dziennego – same pilnują „raz”).
create or replace function public.nauka_rp_pula(z text) returns text
language sql immutable set search_path = '' as $$
  select case when z in ('gra','wynik') then 'gry' when z = 'quiz' then 'quiz'
              when z = 'powtorka' then 'powtorki' when z = 'lekcja' then 'lekcje'
              when z = 'haslo' then 'haslo' when z = 'boss' then 'boss' else 'seria' end
$$;

-- Ustawienia v15.
create or replace function public.nauka_gry2_cfg() returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object(
    'haslo_min', 5, 'haslo_max', 9,           -- długość słowa (same litery A–Z)
    'haslo_proby', 6,
    'haslo_pkt', '[0,20,20,15,12,10,8]'::jsonb, -- punkty za rozwiązanie w 1…6 próbie (indeks = numer próby)
    'drabina_progi', '[4,8]'::jsonb,           -- szczeble gwarantowane
    'drabina_s_min', 2,                       -- min. sekund na pytanie (kontrola wyniku)
    'boss_dni', 7,                            -- boss pojawia się tyle dni przed terminem
    'boss_hp_osoba', 12, 'boss_hp_min', 150,  -- życie = 12 × aktywne osoby (14 dni), co najmniej 150
    'boss_cios_dzien', 40,                    -- max ciosów jednej osoby dziennie
    'boss_cios_zadanie', 3,                   -- zadanie liczbowe = 3 ciosy, ABCD = 1
    'boss_min_ciosow', 10,                    -- tyle ciosów, żeby odebrać nagrodę
    'boss_pkt', 50, 'boss_odbior_dni', 14,
    'min_osob', 5
  )
$$;

-- =====================================================================
-- 2) Odpowiedź ABCD zapisuje też wybór (zmiana tylko w insert do nauka_odp; reszta jak w v13)
-- =====================================================================
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
  insert into public.nauka_odp (user_id, mid, idx, sid, rodzaj, ok, zrodlo, run_id, wybor)
  values (auth.uid(), p_mid, p_idx::text, v_sid, 'abcd', v_ok, p_zrodlo, v_run,
          case when p_wybor between 0 and 9 then p_wybor end);
  if v_ok then
    if v_pierwsza then
      v_pkt := public.nauka_rp_dodaj(auth.uid(), p_zrodlo, 'q:' || p_mid || ':' || p_idx, v_sid, (c->>'pkt_abcd')::int, v_run);
    end if;
    if v_run is not null then update public.nauka_gry set ozywienia = ozywienia + 1 where id = v_run; end if;
  end if;
  return jsonb_build_object('ok', true, 'poprawna', v_ok, 'correct', v_correct, 'pkt', v_pkt);
end $$;

-- =====================================================================
-- 3) Start i koniec rundy: Drabina jako nowa gra (reszta jak w v13)
-- =====================================================================
create or replace function public.nauka_gra_start(p_gra text, p_sid text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare c jsonb := public.nauka_rp_cfg(); v_id uuid; v_seed int;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_rp_mozna() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  if p_gra not in ('frun','pary','przejdz','drabina') then return jsonb_build_object('ok', false, 'code', 'bad_game'); end if;
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


create or replace function public.nauka_gra_koniec(p_run uuid, p_wynik int, p_czas_ms int, p_bledy int default 0)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  c jsonb := public.nauka_rp_cfg(); c2 jsonb := public.nauka_gry2_cfg();
  r public.nauka_gry; v_s numeric; v_max int; v_status text := 'ok'; v_powod text; v_pkt int := 0; v_raw int;
  v_rekord int; v_nowy boolean; v_dobre int;
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
      when 'frun'    then ceil(v_s * 1.1)::int + 3
      when 'przejdz' then ceil(v_s * 5)::int + 5
      when 'pary'    then 10
      when 'drabina' then 12 end;
    if p_wynik > v_max then v_status := 'podejrzana'; v_powod := format('wynik %s > możliwe %s w %ss', p_wynik, v_max, round(v_s)); end if;
    if r.gra = 'pary' and p_wynik > 0 and v_s < p_wynik * 1.2 then v_status := 'podejrzana'; v_powod := 'plansza za szybko'; end if;
    if r.gra = 'drabina' and v_status = 'ok' then
      -- każdy szczebel = dobra odpowiedź sprawdzona przez bazę w tej rundzie
      select count(*) into v_dobre from public.nauka_odp o where o.run_id = r.id and o.ok;
      if p_wynik > v_dobre then v_status := 'podejrzana'; v_powod := format('szczeble %s > dobre odpowiedzi %s', p_wynik, v_dobre);
      elsif p_wynik > 0 and v_s < p_wynik * (c2->>'drabina_s_min')::int then v_status := 'podejrzana'; v_powod := 'drabina za szybko';
      end if;
    end if;
  end if;
  if v_status = 'ok' and public.nauka_rp_mozna() then
    v_raw := case r.gra
      when 'frun'    then p_wynik / 2
      when 'przejdz' then p_wynik / 5
      when 'pary'    then 2 * p_wynik + case when coalesce(p_bledy, 0) = 0 and p_wynik >= 6 then 10 else 0 end
      when 'drabina' then case when p_wynik >= 12 then 20 when p_wynik >= 8 then 10 when p_wynik >= 4 then 5 else 0 end end;
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

-- =====================================================================
-- 4) Drabina: trudność pytań i „Zapytaj rok”
-- =====================================================================
-- Skuteczność rocznika dla listy pytań. p_klucze = ['<mid>:<idx>', …] (max 80).
-- Liczy tylko pierwszą odpowiedź każdej osoby na dane pytanie; zwraca tylko pytania z ≥ min_osob osobami.
create or replace function public.nauka_pyt_trudnosc(p_klucze text[]) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_min int := (public.nauka_gry2_cfg()->>'min_osob')::int;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if p_klucze is null or array_length(p_klucze, 1) is null then return jsonb_build_object('ok', true, 'pyt', '{}'::jsonb); end if;
  if array_length(p_klucze, 1) > 80 then return jsonb_build_object('ok', false, 'code', 'too_many'); end if;
  return jsonb_build_object('ok', true, 'pyt', coalesce((
    select jsonb_object_agg(k, jsonb_build_object('n', n, 'proc', proc))
    from (select f.mid || ':' || f.idx k, count(*) n, round(100.0 * avg(f.ok::int))::int proc
            from (select distinct on (o.user_id, o.mid, o.idx) o.mid, o.idx, o.ok
                    from public.nauka_odp o
                   where o.rodzaj = 'abcd' and (o.mid || ':' || o.idx) = any (p_klucze)
                   order by o.user_id, o.mid, o.idx, o.created_at) f
           group by f.mid, f.idx having count(*) >= v_min) x), '{}'::jsonb));
end $$;

-- Rozkład wyborów rocznika dla jednego pytania (pierwsza odpowiedź każdej osoby, bez mojej).
create or replace function public.nauka_pyt_rok(p_mid text, p_idx int) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_min int := (public.nauka_gry2_cfg()->>'min_osob')::int; v_n int; v_roz jsonb; v_opcji int;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_platny() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  select jsonb_array_length(coalesce(data->'quiz'->p_idx->'options', '[]'::jsonb)) into v_opcji
    from public.nauka_docs where kolekcja = 'materialContent' and id = p_mid;
  if coalesce(v_opcji, 0) < 2 then return jsonb_build_object('ok', false, 'code', 'no_question'); end if;
  with f as (
    select distinct on (o.user_id) o.wybor from public.nauka_odp o
     where o.rodzaj = 'abcd' and o.mid = p_mid and o.idx = p_idx::text and o.wybor is not null and o.user_id <> auth.uid()
     order by o.user_id, o.created_at)
  select (select count(*) from f),
         (select jsonb_agg((select count(*) from f where f.wybor = i) order by i) from generate_series(0, v_opcji - 1) i)
    into v_n, v_roz;
  if v_n < v_min then return jsonb_build_object('ok', true, 'n', v_n, 'za_malo', true); end if;
  return jsonb_build_object('ok', true, 'n', v_n, 'za_malo', false, 'rozklad', v_roz);
end $$;

-- =====================================================================
-- 5) Hasło dnia
-- =====================================================================
create table if not exists public.nauka_haslo_dni (
  dzien      date primary key,
  slowo      text not null check (slowo ~ '^[A-Z]{3,12}$'),
  term       text not null,
  pl         text,
  def        text,
  sid        text,
  mid        text,
  created_at timestamptz not null default now()
);
create table if not exists public.nauka_haslo (
  user_id    uuid not null,
  dzien      date not null,
  proby      text[] not null default '{}',
  wzory      text[] not null default '{}',
  wynik      smallint,            -- null = w trakcie, 1–6 = zgadnięte w tej próbie, 0 = nie zgadnięte
  pkt        int not null default 0,
  koniec     timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, dzien)
);
create index if not exists nauka_haslo_dzien_idx on public.nauka_haslo (dzien);
alter table public.nauka_haslo_dni enable row level security;
alter table public.nauka_haslo     enable row level security;
revoke all on public.nauka_haslo_dni, public.nauka_haslo from anon, authenticated;

-- Słowo na dany dzień: wybierane raz (pierwsze wywołanie dnia) i zapisane, więc dodanie materiałów w ciągu dnia go nie zmienia.
-- Pula: pojęcia z materiałów roku, jedno słowo z samych liter, długość haslo_min–haslo_max, nieużyte w ostatnim roku.
create or replace function public.nauka_haslo_slowo(p_dzien date) returns public.nauka_haslo_dni
language plpgsql security definer set search_path = '' as $$
declare c jsonb := public.nauka_gry2_cfg(); r public.nauka_haslo_dni;
begin
  select * into r from public.nauka_haslo_dni where dzien = p_dzien;
  if found then return r; end if;
  insert into public.nauka_haslo_dni (dzien, slowo, term, pl, def, sid, mid)
  select p_dzien, upper(t.term), t.term, t.pl, t.def, t.sid, t.mid
    from (select distinct on (upper(btrim(x->>'term')))
                 btrim(x->>'term') term, nullif(btrim(x->>'pl'), '') pl, nullif(btrim(x->>'definition'), '') def,
                 m.data->>'subjectId' sid, m.id mid
            from public.nauka_docs d
            join public.nauka_docs m on m.kolekcja = 'materials' and m.id = d.id
            cross join lateral jsonb_array_elements(case when jsonb_typeof(d.data->'concepts') = 'array' then d.data->'concepts' else '[]'::jsonb end) x
           where d.kolekcja = 'materialContent'
             and btrim(x->>'term') ~ '^[A-Za-z]+$'
             and char_length(btrim(x->>'term')) between (c->>'haslo_min')::int and (c->>'haslo_max')::int
           order by upper(btrim(x->>'term')), (x->>'definition') is null, m.id) t
   where not exists (select 1 from public.nauka_haslo_dni u where u.slowo = upper(t.term) and u.dzien > p_dzien - 365)
   order by md5(upper(t.term) || p_dzien::text)
   limit 1
  on conflict (dzien) do nothing;
  select * into r from public.nauka_haslo_dni where dzien = p_dzien;
  return r;  -- null, gdy pula jest pusta
end $$;

-- Wzór próby: dla każdej litery 2 = dobre miejsce, 1 = jest w słowie gdzie indziej, 0 = brak. Powtórzone litery liczone jak w znanych grach słownych.
create or replace function public.nauka_haslo_wzor(p_slowo text, p_proba text) returns text
language plpgsql immutable set search_path = '' as $$
declare n int := char_length(p_slowo); w int[] := array_fill(0, array[n]); zostalo text[] := '{}'; i int; j int; ch text;
begin
  for i in 1..n loop
    if substr(p_proba, i, 1) = substr(p_slowo, i, 1) then w[i] := 2; else zostalo := zostalo || substr(p_slowo, i, 1); end if;
  end loop;
  for i in 1..n loop
    if w[i] = 0 then
      ch := substr(p_proba, i, 1);
      j := array_position(zostalo, ch);
      if j is not null then w[i] := 1; zostalo := zostalo[1:j-1] || zostalo[j+1:]; end if;
    end if;
  end loop;
  return array_to_string(w, '');
end $$;

-- Stan Hasła na dziś (bez słowa, dopóki gra trwa).
create or replace function public.nauka_haslo_dzis() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  c jsonb := public.nauka_gry2_cfg(); d date := public.nauka_dzis(); s public.nauka_haslo_dni; g public.nauka_haslo;
  v_koniec boolean; v_stat jsonb; v_seria int; v_d date;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  s := public.nauka_haslo_slowo(d);
  if s.dzien is null then return jsonb_build_object('ok', false, 'code', 'no_words'); end if;
  select * into g from public.nauka_haslo where user_id = auth.uid() and dzien = d;
  v_koniec := g.wynik is not null;
  -- seria: kolejne dni z rozwiązanym Hasłem, kończąca się dziś (albo wczoraj, gdy dziś jeszcze nie rozwiązane)
  v_seria := 0; v_d := case when g.wynik > 0 then d else d - 1 end;
  while exists (select 1 from public.nauka_haslo h where h.user_id = auth.uid() and h.dzien = v_d and h.wynik > 0) loop
    v_seria := v_seria + 1; v_d := v_d - 1;
  end loop;
  -- statystyki dnia: tylko po końcu własnej gry i przy ≥ min_osob zakończonych
  if v_koniec then
    select case when count(*) >= (c->>'min_osob')::int then jsonb_build_object(
             'grali', count(*), 'zgadli', count(*) filter (where wynik > 0),
             'rozklad', (select jsonb_agg((select count(*) from public.nauka_haslo x where x.dzien = d and x.wynik = k) order by k)
                           from generate_series(0, (c->>'haslo_proby')::int) k)) end
      into v_stat from public.nauka_haslo where dzien = d and wynik is not null;
  end if;
  return jsonb_build_object('ok', true, 'dzien', d, 'nr', (select count(*) from public.nauka_haslo_dni x where x.dzien <= d),  -- numer Hasła (od pierwszego dnia gry)
    'dlugosc', char_length(s.slowo), 'sid', s.sid, 'max', (c->>'haslo_proby')::int,
    'proby', coalesce(to_jsonb(g.proby), '[]'::jsonb), 'wzory', coalesce(to_jsonb(g.wzory), '[]'::jsonb),
    -- po 3 nieudanych próbach podpowiedź: definicja z ukrytym słowem
    'podpowiedz', case when coalesce(array_length(g.proby, 1), 0) >= 3 and s.def is not null
                       then regexp_replace(s.def, s.term, repeat('_', char_length(s.term)), 'gi') end,
    'koniec', v_koniec, 'wynik', g.wynik, 'pkt', coalesce(g.pkt, 0), 'seria', coalesce(v_seria, 0),
    'slowo', case when v_koniec then s.term end, 'pl', case when v_koniec then s.pl end,
    'def', case when v_koniec then s.def end, 'mid', case when v_koniec then s.mid end,
    'stat', v_stat);
end $$;

-- Jedna próba. Litery A–Z, długość jak słowo dnia.
create or replace function public.nauka_haslo_proba(p_proba text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  c jsonb := public.nauka_gry2_cfg(); d date := public.nauka_dzis(); s public.nauka_haslo_dni; g public.nauka_haslo;
  v_p text := upper(btrim(coalesce(p_proba, ''))); v_w text; v_n int; v_max int := (c->>'haslo_proby')::int; v_pkt int := 0;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  s := public.nauka_haslo_slowo(d);
  if s.dzien is null then return jsonb_build_object('ok', false, 'code', 'no_words'); end if;
  if v_p !~ '^[A-Z]+$' then return jsonb_build_object('ok', false, 'code', 'bad_letters'); end if;
  if char_length(v_p) <> char_length(s.slowo) then return jsonb_build_object('ok', false, 'code', 'bad_length'); end if;
  insert into public.nauka_haslo (user_id, dzien) values (auth.uid(), d) on conflict do nothing;
  select * into g from public.nauka_haslo where user_id = auth.uid() and dzien = d for update;
  if g.wynik is not null then return jsonb_build_object('ok', false, 'code', 'finished'); end if;
  if v_p = any (g.proby) then return jsonb_build_object('ok', false, 'code', 'repeated'); end if;
  v_w := public.nauka_haslo_wzor(s.slowo, v_p);
  v_n := coalesce(array_length(g.proby, 1), 0) + 1;
  g.proby := g.proby || v_p; g.wzory := g.wzory || v_w;
  if v_p = s.slowo then
    g.wynik := v_n;
    if public.nauka_rp_mozna() then
      v_pkt := public.nauka_rp_dodaj(auth.uid(), 'haslo', 'h:' || d::text, s.sid, (c->'haslo_pkt'->>v_n)::int);
    end if;
  elsif v_n >= v_max then
    g.wynik := 0;
  end if;
  update public.nauka_haslo set proby = g.proby, wzory = g.wzory, wynik = g.wynik, pkt = v_pkt,
    koniec = case when g.wynik is not null then now() end
   where user_id = auth.uid() and dzien = d;
  return jsonb_build_object('ok', true, 'wzor', v_w, 'proba', v_n, 'koniec', g.wynik is not null, 'wynik', g.wynik, 'pkt', v_pkt);
end $$;

-- =====================================================================
-- 6) Boss przed kolokwium
-- =====================================================================
create table if not exists public.nauka_boss (
  id           text primary key,          -- id terminu z kolekcji deadlines
  sid          text not null,
  typ          text not null,
  tytul        text,
  termin       date not null,
  start        date not null,
  grupy        text[] not null default '{}',
  hp           int  not null check (hp > 0),
  ukryty       boolean not null default false,
  pokonany_at  timestamptz,
  created_at   timestamptz not null default now()
);
alter table public.nauka_boss enable row level security;
revoke all on public.nauka_boss from anon, authenticated;

-- Ciosy w bossa: dobre odpowiedzi z przedmiotu w oknie [start, termin), każde pytanie liczone raz na osobę dziennie,
-- max boss_cios_dzien na osobę dziennie; przy terminie dla grup – tylko osoby z tych grup.
create or replace function public.nauka_boss_ciosy(p_id text) returns table (user_id uuid, ciosy int)
language sql stable security definer set search_path = '' as $$
  with b as (select * from public.nauka_boss where id = p_id),
  c as (select public.nauka_gry2_cfg() v),
  t as (
    select distinct o.user_id, (o.created_at at time zone 'Europe/Warsaw')::date d, o.rodzaj, o.mid, o.idx
      from public.nauka_odp o, b
     where o.ok and o.sid = b.sid
       and o.created_at >= (b.start::timestamp at time zone 'Europe/Warsaw')
       and o.created_at <  (b.termin::timestamp at time zone 'Europe/Warsaw')
       and (cardinality(b.grupy) = 0 or public.nauka_rp_grupa(o.user_id) = any (b.grupy))),
  dz as (
    select t.user_id, t.d, least(sum(case when t.rodzaj = 'zadanie' then (c.v->>'boss_cios_zadanie')::int else 1 end),
                                (c.v->>'boss_cios_dzien')::int) n
      from t, c group by t.user_id, t.d, c.v)
  select dz.user_id, sum(dz.n)::int from dz group by dz.user_id
$$;

-- Życie nowego bossa: boss_hp_osoba × osoby aktywne w ostatnich 14 dniach (z tych grup), co najmniej boss_hp_min.
create or replace function public.nauka_boss_hp(p_grupy text[]) returns int
language sql stable security definer set search_path = '' as $$
  select greatest((c.v->>'boss_hp_min')::int, (c.v->>'boss_hp_osoba')::int * (
           select count(distinct r.user_id)::int from public.nauka_rp r
            where r.dzien > public.nauka_dzis() - 14
              and (cardinality(p_grupy) = 0 or public.nauka_rp_grupa(r.user_id) = any (p_grupy))))
    from (select public.nauka_gry2_cfg() v) c
$$;

-- Tworzy bossy dla terminów w oknie (raz; życie ustalane przy utworzeniu) i oznacza pokonane.
create or replace function public.nauka_boss_odswiez() returns void
language plpgsql security definer set search_path = '' as $$
declare c jsonb := public.nauka_gry2_cfg(); d date := public.nauka_dzis(); b record;
begin
  insert into public.nauka_boss (id, sid, typ, tytul, termin, start, grupy, hp)
  select x.id, x.data->>'subjectId', x.data->>'type', x.data->>'title', (x.data->>'date')::date,
         greatest(d, (x.data->>'date')::date - (c->>'boss_dni')::int), gr.g, public.nauka_boss_hp(gr.g)
    from public.nauka_docs x
    cross join lateral (select coalesce(array(select jsonb_array_elements_text(
                          case when jsonb_typeof(x.data->'groups') = 'array' then x.data->'groups' else '[]'::jsonb end)), '{}') g) gr
   where x.kolekcja = 'deadlines'
     and x.data->>'type' in ('kolokwium', 'egzamin')
     and coalesce(x.data->>'subjectId', '') <> ''
     and coalesce((x.data->>'approx')::boolean, false) = false
     and x.data->>'date' ~ '^\d{4}-\d{2}-\d{2}$'
     and (x.data->>'date')::date > d
     and (x.data->>'date')::date <= d + (c->>'boss_dni')::int
  on conflict (id) do nothing;
  -- termin przeniesiony przez starostę: boss idzie za nim (życie bez zmian)
  update public.nauka_boss nb set termin = (x.data->>'date')::date
    from public.nauka_docs x
   where x.kolekcja = 'deadlines' and x.id = nb.id and nb.pokonany_at is null
     and x.data->>'date' ~ '^\d{4}-\d{2}-\d{2}$' and (x.data->>'date')::date <> nb.termin;
  for b in select * from public.nauka_boss where pokonany_at is null and termin > d - 1 and not ukryty loop
    if (select coalesce(sum(ciosy), 0) from public.nauka_boss_ciosy(b.id)) >= b.hp then
      update public.nauka_boss set pokonany_at = now() where id = b.id and pokonany_at is null;
    end if;
  end loop;
end $$;

-- Bossy widoczne dla mnie: trwające i z ostatnich boss_odbior_dni dni (do odebrania nagrody / podsumowania).
create or replace function public.nauka_bossy() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare c jsonb := public.nauka_gry2_cfg(); d date := public.nauka_dzis(); v_grupa text; v_out jsonb;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  perform public.nauka_boss_odswiez();
  v_grupa := public.nauka_rp_grupa(auth.uid());
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', b.id, 'sid', b.sid, 'typ', b.typ, 'tytul', b.tytul, 'termin', b.termin, 'start', b.start, 'grupy', b.grupy,
      'hp', b.hp, 'zadane', z.suma, 'osob', z.osob, 'moje', coalesce(z.moje, 0),
      'stan', case when b.pokonany_at is not null then 'pokonany' when b.termin <= d then 'uciekl' else 'trwa' end,
      'pokonany_at', b.pokonany_at,
      'odebrane', exists (select 1 from public.nauka_rp r where r.user_id = auth.uid() and r.klucz = 'b:' || b.id),
      'mozna_odebrac', b.pokonany_at is not null and coalesce(z.moje, 0) >= (c->>'boss_min_ciosow')::int
                       and d <= b.termin + (c->>'boss_odbior_dni')::int
                       and not exists (select 1 from public.nauka_rp r where r.user_id = auth.uid() and r.klucz = 'b:' || b.id),
      'top', z.top) order by b.termin), '[]'::jsonb)
    into v_out
    from public.nauka_boss b
    cross join lateral (
      select coalesce(sum(k.ciosy), 0)::int suma, count(*) filter (where k.ciosy > 0)::int osob,
             max(k.ciosy) filter (where k.user_id = auth.uid()) moje,
             coalesce((select jsonb_agg(jsonb_build_object('nick', p.nick, 'ciosy', k2.ciosy, 'ja', k2.user_id = auth.uid()) order by k2.ciosy desc, lower(p.nick))
                         from (select * from public.nauka_boss_ciosy(b.id) order by ciosy desc limit 50) k2
                         join public.nauka_profil p on p.user_id = k2.user_id and p.w_rankingu and p.nick is not null
                        where not public.nauka_rp_admin_uid(k2.user_id)
                        limit 5), '[]'::jsonb) top
        from public.nauka_boss_ciosy(b.id) k) z
   where not b.ukryty
     and b.start <= d and d <= b.termin + (c->>'boss_odbior_dni')::int
     and (cardinality(b.grupy) = 0 or v_grupa = any (b.grupy) or public.nauka_admin());
  return jsonb_build_object('ok', true, 'bossy', v_out, 'min_ciosow', (c->>'boss_min_ciosow')::int, 'pkt', (c->>'boss_pkt')::int);
end $$;

-- Nagroda za pokonanego bossa: raz na bossa, dla osób z ≥ boss_min_ciosow ciosami, do boss_odbior_dni po terminie.
create or replace function public.nauka_boss_odbierz(p_id text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare c jsonb := public.nauka_gry2_cfg(); d date := public.nauka_dzis(); b public.nauka_boss; v_moje int; v_pkt int;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_rp_mozna() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  perform pg_advisory_xact_lock(hashtext('nauka_boss:' || auth.uid()::text));
  select * into b from public.nauka_boss where id = p_id and not ukryty;
  if not found then return jsonb_build_object('ok', false, 'code', 'no_boss'); end if;
  if b.pokonany_at is null then return jsonb_build_object('ok', false, 'code', 'not_defeated'); end if;
  if d > b.termin + (c->>'boss_odbior_dni')::int then return jsonb_build_object('ok', false, 'code', 'too_late'); end if;
  if exists (select 1 from public.nauka_rp r where r.user_id = auth.uid() and r.klucz = 'b:' || b.id) then
    return jsonb_build_object('ok', false, 'code', 'already');
  end if;
  select coalesce(max(ciosy), 0) into v_moje from public.nauka_boss_ciosy(b.id) where user_id = auth.uid();
  if v_moje < (c->>'boss_min_ciosow')::int then
    return jsonb_build_object('ok', false, 'code', 'too_few', 'moje', v_moje, 'trzeba', (c->>'boss_min_ciosow')::int);
  end if;
  v_pkt := public.nauka_rp_dodaj(auth.uid(), 'boss', 'b:' || b.id, b.sid, (c->>'boss_pkt')::int);
  return jsonb_build_object('ok', true, 'pkt', v_pkt);
end $$;

-- Starosta: zmiana życia bossa albo ukrycie (np. termin odwołany).
create or replace function public.nauka_admin_boss(p_id text, p_hp int default null, p_ukryty boolean default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if not public.nauka_admin() then return jsonb_build_object('ok', false, 'code', 'not_admin'); end if;
  if p_hp is not null and (p_hp < 10 or p_hp > 100000) then return jsonb_build_object('ok', false, 'code', 'bad_hp'); end if;
  update public.nauka_boss set hp = coalesce(p_hp, hp), ukryty = coalesce(p_ukryty, ukryty) where id = p_id;
  return jsonb_build_object('ok', found);
end $$;

-- =====================================================================
-- 7) Uprawnienia
-- =====================================================================
revoke execute on function
  public.nauka_rp_pula(text), public.nauka_gry2_cfg(),
  public.nauka_rp_odpowiedz(text, int, int, text, uuid), public.nauka_gra_start(text, text), public.nauka_gra_koniec(uuid, int, int, int),
  public.nauka_pyt_trudnosc(text[]), public.nauka_pyt_rok(text, int),
  public.nauka_haslo_slowo(date), public.nauka_haslo_wzor(text, text), public.nauka_haslo_dzis(), public.nauka_haslo_proba(text),
  public.nauka_boss_ciosy(text), public.nauka_boss_hp(text[]), public.nauka_boss_odswiez(), public.nauka_bossy(), public.nauka_boss_odbierz(text),
  public.nauka_admin_boss(text, int, boolean)
from public, anon, authenticated;

grant execute on function
  public.nauka_rp_odpowiedz(text, int, int, text, uuid), public.nauka_gra_start(text, text), public.nauka_gra_koniec(uuid, int, int, int),
  public.nauka_pyt_trudnosc(text[]), public.nauka_pyt_rok(text, int),
  public.nauka_haslo_dzis(), public.nauka_haslo_proba(text),
  public.nauka_bossy(), public.nauka_boss_odbierz(text), public.nauka_admin_boss(text, int, boolean)
to authenticated;

notify pgrst, 'reload schema';
