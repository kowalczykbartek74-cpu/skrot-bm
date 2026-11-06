-- Skrót v43: „Dla Ciebie na dziś” w panelu lejka (spec „Dziś · 5 min + 2 lekcje”, etap 6). Po v35 (lejek) i v42.
-- Wklej w Supabase → SQL Editor → Run. Można uruchamiać wielokrotnie. Bez nowych tabel: liczy z nauka_zdarzenia (activity,
-- kind „ld”, zapisuje je strona od etapu 5) i nauka_powtorki_log (v29), w tym samym nocnym podsumowaniu co lejek.
--
-- Zdarzenia ze strony (bez treści odpowiedzi):
--   koniec karty / lekcji:   { kind: 'ld', koniec: 'karta' | 'lekcja', rola, segmenty }
--   mechanika w segmencie:   { kind: 'ld', seg, mech, stan: 'ukonczona' | 'porzucona' | 'pominieta', dobrze }
--   temat zrobiony w bloku:  { kind: 'ld', materialId, ok, total, ld: 'karta' | rola }
-- Liczby surowe z liczbą osób: panel ukrywa grupy < 5 osób (lejek.js, MIN = 5).

create or replace function public.nauka_lejek_ld(p_rocznik text) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  t date := (now() at time zone 'Europe/Warsaw')::date;
  tw date := date_trunc('week', (now() at time zone 'Europe/Warsaw'))::date;
  dni jsonb; segi jsonb; mech jsonb; uczy jsonb;
begin
  create temp table if not exists ld_k (user_id uuid primary key) on commit drop;
  create temp table if not exists ld_z (user_id uuid, kiedy timestamptz, dane jsonb) on commit drop;
  truncate pg_temp.ld_k; truncate pg_temp.ld_z;
  insert into pg_temp.ld_k select k.user_id from public.nauka_lejek_konta() k where p_rocznik = '*' or k.rocznik_id = p_rocznik;
  insert into pg_temp.ld_z select z.user_id, z.kiedy, z.dane from public.nauka_zdarzenia z join pg_temp.ld_k k on k.user_id = z.user_id
    where z.typ = 'activity' and z.dane->>'kind' = 'ld' and z.kiedy > now() - interval '63 days';

  -- Dziennie (28 dni): ile osób skończyło kartę 5 min, ile osób skończyło lekcję i ile lekcji.
  select coalesce(jsonb_agg(jsonb_build_object('dzien', to_char(q.dzien, 'YYYY-MM-DD'), 'karta_osoby', q.ko, 'karty', q.kn, 'lekcja_osoby', q.lo, 'lekcje', q.ln)
           order by q.dzien desc), '[]'::jsonb) into dni
  from (select (z.kiedy at time zone 'Europe/Warsaw')::date as dzien,
               count(distinct z.user_id) filter (where z.dane->>'koniec' = 'karta')::int as ko, count(*) filter (where z.dane->>'koniec' = 'karta')::int as kn,
               count(distinct z.user_id) filter (where z.dane->>'koniec' = 'lekcja')::int as lo, count(*) filter (where z.dane->>'koniec' = 'lekcja')::int as ln
        from pg_temp.ld_z z where z.dane ? 'koniec' and (z.kiedy at time zone 'Europe/Warsaw')::date > t - 28 group by 1) q;

  -- W którym segmencie lekcji ludzie najczęściej przerywają (porzucenia na numer segmentu, 28 dni).
  select coalesce(jsonb_agg(jsonb_build_object('seg', q.seg, 'porzucone', q.n, 'osoby', q.o) order by q.seg), '[]'::jsonb) into segi
  from (select public.nauka_lejek_int(z.dane->>'seg') as seg, count(*)::int as n, count(distinct z.user_id)::int as o
        from pg_temp.ld_z z where z.dane->>'stan' = 'porzucona' and z.kiedy > now() - interval '28 days' and public.nauka_lejek_int(z.dane->>'seg') is not null group by 1) q;

  -- Mechaniki (28 dni): ukończone (z „dobrze”), porzucone, pominięte i liczba osób.
  select coalesce(jsonb_agg(jsonb_build_object('mech', q.mech, 'ukonczone', q.u, 'dobrze', q.d, 'porzucone', q.p, 'pominiete', q.s, 'osoby', q.o) order by q.u + q.p + q.s desc, q.mech), '[]'::jsonb) into mech
  from (select z.dane->>'mech' as mech,
               count(*) filter (where z.dane->>'stan' = 'ukonczona')::int as u, count(*) filter (where z.dane->>'stan' = 'ukonczona' and z.dane->>'dobrze' = 'true')::int as d,
               count(*) filter (where z.dane->>'stan' = 'porzucona')::int as p, count(*) filter (where z.dane->>'stan' = 'pominieta')::int as s,
               count(distinct z.user_id)::int as o
        from pg_temp.ld_z z where z.dane ? 'stan' and z.dane->>'mech' ~ '^[a-z]{2,20}$' and z.kiedy > now() - interval '28 days' group by 1) q;

  -- „Czy uczy”: dobre PIERWSZE odpowiedzi w powtórkach przy wieku ≥ 7 dni (8 tygodni), osobno dla tematów, które ta osoba
  -- wcześniej robiła w bloku „Dla Ciebie na dziś” (materialId ze zdarzeń), i dla pozostałych.
  with ldm as (
    select z.user_id, z.dane->>'materialId' as mid, min(z.kiedy) as od from pg_temp.ld_z z where z.dane ? 'materialId' and z.dane->>'materialId' <> '' group by 1, 2
  ), log as (
    select l.user_id, l.ok, l.at,
           case when split_part(l.klucz, ':', 1) in ('q', 'd', 'n', 'z') then split_part(l.klucz, ':', 2) when split_part(l.klucz, ':', 1) = 'g' then null else split_part(l.klucz, ':', 1) end as mid
    from public.nauka_powtorki_log l join pg_temp.ld_k k on k.user_id = l.user_id
    where l.first and l.wiek >= 7 and (l.at at time zone 'Europe/Warsaw')::date >= tw - 49
  ), oz as (
    select g.user_id, g.ok, case when exists (select 1 from ldm m where m.user_id = g.user_id and m.mid = g.mid and m.od < g.at) then 'ld' else 'inne' end as grupa
    from log g where g.mid is not null
  )
  select coalesce(jsonb_object_agg(v.grupa, jsonb_build_object('odp', (select count(*) from oz where oz.grupa = v.grupa), 'ok', (select count(*) from oz where oz.grupa = v.grupa and oz.ok),
           'osoby', (select count(distinct oz.user_id) from oz where oz.grupa = v.grupa))), '{}'::jsonb) into uczy
  from (values ('ld'), ('inne')) v(grupa);

  return jsonb_build_object('dni', dni, 'segmenty', segi, 'mechaniki', mech, 'uczy', uczy,
    'osoby', (select count(distinct z.user_id) from pg_temp.ld_z z where z.kiedy > now() - interval '28 days'));
end $$;

-- Nocne liczenie lejka (v35) z dopisanym „ld” (reszta bez zmian).
create or replace function public.nauka_lejek_policz() returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare t date := (now() at time zone 'Europe/Warsaw')::date; r text; n int := 0;
begin
  for r in select '*' union select x.id from public.nauka_roczniki x
           union select distinct k.rocznik_id from public.nauka_lejek_konta() k loop
    insert into public.nauka_lejek_dzien (dzien, rocznik_id, dane, policzono_at)
    values (t, r, public.nauka_lejek_dane(r) || jsonb_build_object('ld', public.nauka_lejek_ld(r)), now())
    on conflict (dzien, rocznik_id) do update set dane = excluded.dane, policzono_at = excluded.policzono_at;
    n := n + 1;
  end loop;
  delete from public.nauka_lejek_dzien where dzien < t - 400;
  delete from public.nauka_wejscia_dzien where dzien < t - 400;
  return jsonb_build_object('ok', true, 'dzien', t, 'roczniki', n);
end $$;

revoke execute on function public.nauka_lejek_ld(text), public.nauka_lejek_policz() from public, anon, authenticated;
grant execute on function public.nauka_lejek_policz() to service_role;

do $$ begin raise notice 'OK v43: „Dla Ciebie na dziś” w lejku (przelicz w panelu albo poczekaj na noc)'; end $$;
