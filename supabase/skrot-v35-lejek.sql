-- Skrót v35: lejek i retencja bez cookies (etap 6 „Systemy z Zdawalni w Skrócie”).
-- Wklej w Supabase → SQL Editor → Run, po v34. Można uruchamiać wielokrotnie.
-- Przed uruchomieniem włącz pg_cron (Supabase → Integrations → Cron → Enable), tak jak przy v33; bez niego wszystko działa,
-- tylko podsumowanie liczy się po kliknięciu „Przelicz teraz” w panelu, a nie samo w nocy.
--
-- Port matura-app lib/data/analytics.ts (lejek), lib/data/retention-metrics.ts (powroty D1/D7/D30, dni nauki w tygodniu)
-- i lib/domain/learner/metrics.ts („czy strona uczy”, n = liczba osób, grupy < 5 ukrywa panel).
--
-- 1. nauka_wejscia_dzien: anonimowe wejścia jako SUMY DZIENNE (dzień × rocznik × źródło → liczba). Bez identyfikatora osoby,
--    bez IP, bez cookies. Przeglądarka woła nauka_wejscie() najwyżej raz dziennie (flaga z datą w localStorage, lejek.js).
--    Rocznik = wybór z ekranu wejścia (localStorage „skrot-rocznik”), pusty, gdy jeszcze nie wybrany. Źródło = ?z=… z linku
--    (etap 11 zbuduje na tym źródła wejść; kolumna już jest).
-- 2. Lejek z kont i zdarzeń: konto → wybrany kierunek (nauka_profil.rocznik_wybrany_at) → okres próbny (nauka_proby) →
--    zakup (nauka_dostep, zrodlo 'stripe…'); osobno: potwierdzone zapisy na listę oczekujących (nauka_oczekujacy).
-- 3. Retencja: dzień nauki = dzień ze zdarzeniem nauki (nauka_zdarzenia, bez testu „Jak się uczysz?”) albo powtórką
--    (nauka_powtorki_log). D1 = nauka dzień po założeniu konta, D7 = w dniach 7–13, D30 = w dniach 30–36 (jak w Zdawalni).
-- 4. „Czy strona uczy”: % dobrych PIERWSZYCH odpowiedzi w powtórkach przy wieku ≥ 7 dni, na przedmiot i tydzień;
--    rewanże wygrane / wszystkie (zdarzenia activity z kind 'rewanz'); test A/B haczyka lekcji (exit_ticket, pole 'hak').
-- 5. nauka_lejek_dzien: nocne podsumowanie (pg_cron, 3:15 UTC) na każdy rocznik z tabeli nauka_roczniki + '*' (wszystkie)
--    + '' (konta bez profilu). Nowy rocznik pojawia się w panelu sam. Panel czyta tylko to podsumowanie.
-- Wszystko tylko dla administratora (nauka_admin()). Przeglądarka nie czyta żadnej z nowych tabel wprost.

-- ---------- 1) wejścia: sumy dzienne ----------
create table if not exists public.nauka_wejscia_dzien (
  dzien      date not null,
  rocznik_id text not null default '' check (rocznik_id = '' or rocznik_id ~ '^[a-z]+-[a-z0-9]+-[012]-(st|nst)-20[0-9]{2}$'),
  zrodlo     text not null default '' check (zrodlo = '' or zrodlo ~ '^[a-z0-9._-]{1,40}$'),
  wejscia    int  not null default 0 check (wejscia >= 0),
  primary key (dzien, rocznik_id, zrodlo)
);
alter table public.nauka_wejscia_dzien enable row level security;
revoke all on public.nauka_wejscia_dzien from anon, authenticated;

-- Jedno wejście (bez logowania). Nieznany rocznik → pusty; źródło spoza wzoru → puste. Najwyżej 50 różnych źródeł dziennie,
-- kolejne liczą się jako „inne” (losowe ?z= nie zapchają tabeli). Odpowiedź zawsze ta sama.
create or replace function public.nauka_wejscie(p_rocznik text default null, p_zrodlo text default null) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare d date := (now() at time zone 'Europe/Warsaw')::date; r text := ''; z text := '';
begin
  if p_rocznik is not null and length(p_rocznik) <= 40 and exists (select 1 from public.nauka_roczniki x where x.id = p_rocznik) then r := p_rocznik; end if;
  if coalesce(p_zrodlo ~ '^[a-z0-9._-]{1,40}$', false) then z := p_zrodlo; end if;
  if z <> '' and not exists (select 1 from public.nauka_wejscia_dzien w where w.dzien = d and w.zrodlo = z)
     and (select count(distinct w.zrodlo) from public.nauka_wejscia_dzien w where w.dzien = d) >= 50 then
    z := 'inne';
  end if;
  insert into public.nauka_wejscia_dzien (dzien, rocznik_id, zrodlo, wejscia) values (d, r, z, 1)
  on conflict (dzien, rocznik_id, zrodlo) do update set wejscia = public.nauka_wejscia_dzien.wejscia + 1;
  return jsonb_build_object('ok', true);
end $$;
revoke execute on function public.nauka_wejscie(text, text) from public;
grant execute on function public.nauka_wejscie(text, text) to anon, authenticated;

-- ---------- 2) tabela zbiorcza ----------
create table if not exists public.nauka_lejek_dzien (
  dzien        date not null,
  rocznik_id   text not null,          -- id z nauka_roczniki, '*' = wszystkie, '' = konta bez profilu
  dane         jsonb not null,
  policzono_at timestamptz not null default now(),
  primary key (dzien, rocznik_id)
);
alter table public.nauka_lejek_dzien enable row level security;
revoke all on public.nauka_lejek_dzien from anon, authenticated;

-- Liczba całkowita z pola zdarzenia (zdarzenia przychodzą z przeglądarki: zły napis nie może zatrzymać nocnego liczenia).
create or replace function public.nauka_lejek_int(t text) returns int language sql immutable as $$
  select case when t ~ '^[0-9]{1,6}$' then t::int end
$$;

-- Konta (bez administratorów): rocznik z profilu ('' = bez profilu), dzień założenia (czas polski) i kroki lejka.
create or replace function public.nauka_lejek_konta()
returns table (user_id uuid, rocznik_id text, d0 date, wybrany boolean, proba boolean, zakup boolean)
language sql stable security definer set search_path = public as $$
  select u.id, coalesce(p.rocznik_id, ''), (u.created_at at time zone 'Europe/Warsaw')::date,
         p.rocznik_wybrany_at is not null,
         exists (select 1 from public.nauka_proby x where x.user_id = u.id),
         exists (select 1 from public.nauka_dostep d where (d.user_id = u.id or d.email = lower(u.email)) and d.zrodlo like 'stripe%')
  from auth.users u left join public.nauka_profil p on p.user_id = u.id
  where not exists (select 1 from public.nauka_admini a where a.email = lower(coalesce(u.email, '')))
$$;

-- Dni nauki (czas polski): zdarzenia nauki bez testu „Jak się uczysz?” i powtórki.
create or replace function public.nauka_lejek_dni_nauki()
returns table (user_id uuid, dzien date)
language sql stable security definer set search_path = public as $$
  select z.user_id, (z.kiedy at time zone 'Europe/Warsaw')::date from public.nauka_zdarzenia z where z.typ <> 'profile_test'
  union
  select l.user_id, (l.at at time zone 'Europe/Warsaw')::date from public.nauka_powtorki_log l
$$;

-- Wszystkie liczby jednego rocznika ('*' = wszystkie). Liczby surowe: panel ukrywa grupy < 5 osób (lejek.js, MIN = 5).
create or replace function public.nauka_lejek_dane(p_rocznik text) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  t date := (now() at time zone 'Europe/Warsaw')::date;
  tw date := date_trunc('week', (now() at time zone 'Europe/Warsaw'))::date;  -- poniedziałek bieżącego tygodnia
  lejek jsonb := '{}'::jsonb; w int; x jsonb;
  ret jsonb; tyg jsonb; uczy jsonb; rew jsonb; ab jsonb; ocz jsonb := null; zr jsonb := null;
begin
  create temp table if not exists lejek_k (user_id uuid primary key, rocznik_id text, d0 date, wybrany boolean, proba boolean, zakup boolean) on commit drop;
  create temp table if not exists lejek_d (user_id uuid, dzien date) on commit drop;
  truncate pg_temp.lejek_k; truncate pg_temp.lejek_d;
  insert into pg_temp.lejek_k select * from public.nauka_lejek_konta() k where p_rocznik = '*' or k.rocznik_id = p_rocznik;
  insert into pg_temp.lejek_d select d.* from public.nauka_lejek_dni_nauki() d join pg_temp.lejek_k k on k.user_id = d.user_id;

  -- Lejek: ostatnie 28 dni i od początku. Kroki liczone z kont założonych w tym okresie (kohorta).
  foreach w in array array[28, 0] loop
    select jsonb_build_object(
      'wejscia', (select coalesce(sum(e.wejscia), 0) from public.nauka_wejscia_dzien e
                   where (p_rocznik = '*' or e.rocznik_id = p_rocznik) and (w = 0 or e.dzien > t - w)),
      'konta', count(*), 'wybor', count(*) filter (where k.wybrany),
      'proba', count(*) filter (where k.proba), 'zakup', count(*) filter (where k.zakup))
      into x from pg_temp.lejek_k k where w = 0 or k.d0 > t - w;
    lejek := lejek || jsonb_build_object(case when w = 0 then 'wszystko' else 'd' || w end, x);
  end loop;

  -- Powroty D1 / D7 / D30 (port retentionDays): konta dość stare i ile z nich się uczyło.
  select jsonb_build_object(
    'd1',  jsonb_build_object('mozliwe', count(*) filter (where k.d0 + 1 <= t),
             'aktywne', count(*) filter (where k.d0 + 1 <= t and exists (select 1 from pg_temp.lejek_d d where d.user_id = k.user_id and d.dzien = k.d0 + 1))),
    'd7',  jsonb_build_object('mozliwe', count(*) filter (where k.d0 + 13 <= t),
             'aktywne', count(*) filter (where k.d0 + 13 <= t and exists (select 1 from pg_temp.lejek_d d where d.user_id = k.user_id and d.dzien between k.d0 + 7 and k.d0 + 13))),
    'd30', jsonb_build_object('mozliwe', count(*) filter (where k.d0 + 36 <= t),
             'aktywne', count(*) filter (where k.d0 + 36 <= t and exists (select 1 from pg_temp.lejek_d d where d.user_id = k.user_id and d.dzien between k.d0 + 30 and k.d0 + 36))))
    into ret from pg_temp.lejek_k k;

  -- Dni nauki w tygodniu: 4 ostatnie pełne tygodnie, wśród osób, które w danym tygodniu uczyły się choć raz.
  select coalesce(jsonb_agg(jsonb_build_object('tydzien', to_char(q.tydzien, 'YYYY-MM-DD'), 'osoby', q.osoby, 'mediana', q.mediana, 'srednio', q.srednio)
           order by q.tydzien desc), '[]'::jsonb) into tyg
  from (select u.tydzien, count(*)::int as osoby,
               percentile_cont(0.5) within group (order by u.dni)::float8 as mediana, round(avg(u.dni)::numeric, 1)::float8 as srednio
        from (select date_trunc('week', d.dzien)::date as tydzien, d.user_id, count(distinct d.dzien)::int as dni
              from pg_temp.lejek_d d where d.dzien >= tw - 28 and d.dzien < tw group by 1, 2) u
        group by u.tydzien) q;

  -- „Czy strona uczy”: pierwsze odpowiedzi w powtórkach przy wieku ≥ 7 dni, 8 tygodni (z bieżącym), na przedmiot i razem ('*').
  select coalesce(jsonb_agg(jsonb_build_object('tydzien', to_char(q.tydzien, 'YYYY-MM-DD'), 'sid', q.sid, 'osoby', q.osoby, 'odp', q.odp, 'ok', q.ok)
           order by q.tydzien desc, q.sid), '[]'::jsonb) into uczy
  from (select s.tydzien, v.sid, count(distinct s.user_id)::int as osoby, count(*)::int as odp, count(*) filter (where s.ok)::int as ok
        from (select date_trunc('week', (l.at at time zone 'Europe/Warsaw'))::date as tydzien,
                     coalesce(public.nauka_rp_klucz_sid(l.klucz), '?') as sid0, l.user_id, l.ok
              from public.nauka_powtorki_log l join pg_temp.lejek_k k on k.user_id = l.user_id
              where l.first and l.wiek >= 7 and (l.at at time zone 'Europe/Warsaw')::date >= tw - 49) s
        cross join lateral (values (s.sid0), ('*')) v(sid)
        group by s.tydzien, v.sid) q;

  -- Rewanże z ostatnich 28 dni: wygrane (z pokonanymi) / wszystkie rozegrane.
  select jsonb_build_object('wygrane', count(*) filter (where z.dane->>'wynik' in ('won', 'defeated')),
           'pokonane', count(*) filter (where z.dane->>'wynik' = 'defeated'),
           'wszystkie', count(*), 'osoby', count(distinct z.user_id))
    into rew
  from public.nauka_zdarzenia z join pg_temp.lejek_k k on k.user_id = z.user_id
  where z.typ = 'activity' and z.dane->>'kind' = 'rewanz' and z.dane->>'wynik' in ('won', 'defeated', 'lost')
    and z.kiedy > now() - interval '28 days';

  -- Test A/B haczyka (od początku): wariant lekcji z biletu wyjścia (pole 'hak'), bilety zdane (≥ 2 z 3 albo wszystkie,
  -- gdy pytań mniej) i „czy uczy” w powtórkach z tych lekcji (klucze q:/d:/n:<lekcja>:…).
  with bil as (
    select z.user_id, z.dane->>'lessonId' as mid, z.dane->>'hak' as hak,
           public.nauka_lejek_int(z.dane->>'score') as sc, public.nauka_lejek_int(z.dane->>'max') as mx
    from public.nauka_zdarzenia z join pg_temp.lejek_k k on k.user_id = z.user_id
    where z.typ = 'exit_ticket' and z.dane->>'hak' in ('haczyk', 'bez')
  ), war as (select distinct on (b.mid) b.mid, b.hak from bil b where b.mid is not null order by b.mid, b.hak),
  pow as (
    select w.hak, l.user_id, l.ok
    from public.nauka_powtorki_log l join pg_temp.lejek_k k on k.user_id = l.user_id
    join war w on w.mid = split_part(l.klucz, ':', 2)
    where split_part(l.klucz, ':', 1) in ('q', 'd', 'n') and l.first and l.wiek >= 7
  )
  select coalesce(jsonb_object_agg(v.hak, jsonb_build_object(
           'bilety', (select count(*) from bil b where b.hak = v.hak),
           'zdane', (select count(*) from bil b where b.hak = v.hak and b.sc is not null and b.mx > 0 and b.sc >= least(2, b.mx)),
           'osoby', (select count(distinct b.user_id) from bil b where b.hak = v.hak),
           'odp', (select count(*) from pow p where p.hak = v.hak),
           'ok', (select count(*) from pow p where p.hak = v.hak and p.ok),
           'osoby_odp', (select count(distinct p.user_id) from pow p where p.hak = v.hak))), '{}'::jsonb)
    into ab
  from (values ('haczyk'), ('bez')) v(hak);

  -- Tylko w podsumowaniu wszystkich roczników: lista oczekujących (międzykierunkowa) i wejścia według źródła.
  if p_rocznik = '*' then
    foreach w in array array[28, 0] loop
      select jsonb_build_object('potwierdzone', count(*),
               'kierunki', coalesce((select jsonb_agg(jsonb_build_object('nazwa', g.nazwa, 'n', g.n) order by g.n desc, g.nazwa)
                 from (select coalesce(kk.nazwa_pl || case kk.stopien when 1 then ' · I st.' when 2 then ' · II st.' else '' end, 'wpisane ręcznie') as nazwa, count(*)::int as n
                       from public.nauka_oczekujacy o2 left join public.nauka_kierunki kk on kk.id = o2.kierunek_id
                       where o2.status = 'confirmed' and (w = 0 or o2.confirmed_at > now() - make_interval(days => w)) group by 1) g), '[]'::jsonb),
               'zrodla', coalesce((select jsonb_object_agg(g.z, g.n)
                 from (select coalesce(o3.zrodlo, '') as z, count(*)::int as n from public.nauka_oczekujacy o3
                       where o3.status = 'confirmed' and (w = 0 or o3.confirmed_at > now() - make_interval(days => w)) group by 1) g), '{}'::jsonb))
        into x from public.nauka_oczekujacy o where o.status = 'confirmed' and (w = 0 or o.confirmed_at > now() - make_interval(days => w));
      ocz := coalesce(ocz, '{}'::jsonb) || jsonb_build_object(case when w = 0 then 'wszystko' else 'd' || w end, x);
    end loop;
    select coalesce(jsonb_object_agg(g.zrodlo, g.n), '{}'::jsonb) into zr
    from (select e.zrodlo, sum(e.wejscia)::int as n from public.nauka_wejscia_dzien e where e.dzien > t - 28 group by 1) g;
  end if;

  return jsonb_build_object('rocznik', p_rocznik, 'dzien', t, 'lejek', lejek, 'retencja', ret, 'tygodnie', tyg,
    'uczy', uczy, 'rewanze', rew, 'ab', jsonb_build_object('haczyk', ab), 'oczekujacy', ocz, 'wejscia_zrodla', zr,
    -- etap 11 (źródła wejść kont) dopisze tu podział lejka na źródło: 'zrodla': { '<źródło>': { …jak lejek… } }
    'zrodla', null);
end $$;

-- Nocne liczenie: każdy rocznik z tabeli + '*' + '' (gdy są konta bez profilu). Historia 400 dni; wejścia też 400 dni.
create or replace function public.nauka_lejek_policz() returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare t date := (now() at time zone 'Europe/Warsaw')::date; r text; n int := 0;
begin
  for r in select '*' union select x.id from public.nauka_roczniki x
           union select distinct k.rocznik_id from public.nauka_lejek_konta() k loop
    insert into public.nauka_lejek_dzien (dzien, rocznik_id, dane, policzono_at) values (t, r, public.nauka_lejek_dane(r), now())
    on conflict (dzien, rocznik_id) do update set dane = excluded.dane, policzono_at = excluded.policzono_at;
    n := n + 1;
  end loop;
  delete from public.nauka_lejek_dzien where dzien < t - 400;
  delete from public.nauka_wejscia_dzien where dzien < t - 400;
  return jsonb_build_object('ok', true, 'dzien', t, 'roczniki', n);
end $$;

-- ---------- 3) panel administratora ----------
create or replace function public.nauka_admin_lejek() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare d date;
begin
  if not public.nauka_admin() then return jsonb_build_object('ok', false, 'code', 'not_admin'); end if;
  select max(x.dzien) into d from public.nauka_lejek_dzien x;
  return jsonb_build_object('ok', true, 'dzien', d,
    'policzono_at', (select max(x.policzono_at) from public.nauka_lejek_dzien x where x.dzien = d),
    'roczniki', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'nabor', r.nabor, 'status', r.status, 'kod', k.kod,
                   'pl', k.nazwa_pl, 'en', k.nazwa_en, 'stopien', k.stopien, 'tryb', k.tryb) order by k.nazwa_pl, r.nabor desc)
                 from public.nauka_roczniki r join public.nauka_kierunki k on k.id = r.kierunek_id), '[]'::jsonb),
    'dane', coalesce((select jsonb_object_agg(x.rocznik_id, x.dane) from public.nauka_lejek_dzien x where x.dzien = d), '{}'::jsonb));
end $$;

-- „Przelicz teraz” (np. zaraz po uruchomieniu tego pliku albo bez pg_cron).
create or replace function public.nauka_admin_lejek_przelicz() returns jsonb
language plpgsql volatile security definer set search_path = public as $$
begin
  if not public.nauka_admin() then return jsonb_build_object('ok', false, 'code', 'not_admin'); end if;
  perform public.nauka_lejek_policz();
  return public.nauka_admin_lejek();
end $$;

revoke execute on function public.nauka_lejek_int(text), public.nauka_lejek_konta(), public.nauka_lejek_dni_nauki(),
  public.nauka_lejek_dane(text), public.nauka_lejek_policz() from public, anon, authenticated;
grant execute on function public.nauka_lejek_policz() to service_role;
revoke execute on function public.nauka_admin_lejek(), public.nauka_admin_lejek_przelicz() from public, anon;
grant execute on function public.nauka_admin_lejek(), public.nauka_admin_lejek_przelicz() to authenticated;

-- Codziennie o 3:15 UTC (4:15 / 5:15 w Polsce), po retencji (2:30). Bez pg_cron: tylko komunikat.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') or exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron with schema pg_catalog;
    if exists (select 1 from cron.job where jobname = 'skrot-lejek') then perform cron.unschedule('skrot-lejek'); end if;
    perform cron.schedule('skrot-lejek', '15 3 * * *', 'select public.nauka_lejek_policz()');
    raise notice 'OK lejek: zadanie skrot-lejek codziennie 3:15 UTC';
  else
    raise notice 'pg_cron niedostępny: włącz Integrations → Cron i uruchom ten plik jeszcze raz (do tego czasu „Przelicz teraz” w panelu)';
  end if;
end $$;

notify pgrst, 'reload schema';
