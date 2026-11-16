-- Testy Z1–Z9 dla skrot-v55-seria-zamrozenia.sql (po dwóch uruchomieniach migracji). Tylko lokalnie (PGlite, test/stub.sql).
reset role;
insert into auth.users (id, email) values
  ('55555555-0000-4000-8000-000000000001', 'seria1@x.pl'), ('55555555-0000-4000-8000-000000000002', 'seria2@x.pl'),
  ('55555555-0000-4000-8000-000000000003', 'seria3@x.pl') on conflict do nothing;
create or replace function test.rp55(u uuid, d date) returns void language sql as $$
  insert into public.nauka_rp (user_id, dzien, tydzien, zrodlo, klucz, sid, pkt) values (u, d, public.nauka_tydzien(d), 'quiz', 'q:t55:' || d::text, 'makro', 5)
  on conflict do nothing $$;
create or replace function test.zam55(u uuid, n int) returns void language sql as $$
  insert into public.nauka_zamrozenia (user_id, req, cena) select u, 'test55:' || substr(md5(random()::text || g::text), 1, 24), 40 from generate_series(1, n) g $$;
do $$ declare u1 uuid := '55555555-0000-4000-8000-000000000001'; u2 uuid := '55555555-0000-4000-8000-000000000002'; d date := (now() at time zone 'Europe/Warsaw')::date; begin
  perform test.rp55(u1, d - 3); perform test.zam55(u1, 2);
  perform test.rp55(u2, d - 3); perform test.zam55(u2, 1);
end $$;

-- Z1: weekend (2 opuszczone dni) + 2 zamrożenia → oba dni chronione; drugi raz „juz” bez zużycia
select test.jako('seria1@x.pl'); set role authenticated;
do $$ declare r jsonb; d date := (now() at time zone 'Europe/Warsaw')::date; begin
  r := public.nauka_zamrozenie_uzyj_dni(array[d - 2, d - 1]);
  perform test.chk('Z1 2 dni bez nauki + 2 zamrożenia: oba użyte, zostało 0', (r->>'ok')::boolean and r->'dni'->0->>'wynik' = 'uzyte' and r->'dni'->1->>'wynik' = 'uzyte' and (r->>'zostalo')::int = 0, r);
  r := public.nauka_zamrozenie_uzyj_dni(array[d - 2, d - 1]);
  perform test.chk('Z1 drugie wywołanie: juz, juz (bez zużycia)', (r->>'ok')::boolean and r->'dni'->0->>'wynik' = 'juz' and r->'dni'->1->>'wynik' = 'juz', r);
end $$;
reset role;
do $$ declare u uuid := '55555555-0000-4000-8000-000000000001'; d date := (now() at time zone 'Europe/Warsaw')::date; begin
  perform test.chk('Z1 seria w bazie po weekendzie: 1 dzień nauki + 2 zamrożone = 1', public.nauka_seria_na(u, d) = 1, to_jsonb(public.nauka_seria_na(u, d)));
end $$;
select test.rp55('55555555-0000-4000-8000-000000000001', (now() at time zone 'Europe/Warsaw')::date);
do $$ begin perform test.chk('Z1 seria po dzisiejszej nauce = 2', public.nauka_seria_na('55555555-0000-4000-8000-000000000001', (now() at time zone 'Europe/Warsaw')::date) = 2, null); end $$;

-- Z2: 1 zamrożenie na 2 dni → pierwszy dzień chroniony, drugi „brak”, ok = false (strona zeruje serię)
select test.jako('seria2@x.pl'); set role authenticated;
do $$ declare r jsonb; d date := (now() at time zone 'Europe/Warsaw')::date; begin
  r := public.nauka_zamrozenie_uzyj_dni(array[d - 1, d - 2]);
  perform test.chk('Z2 2 dni, 1 zamrożenie: wszystkie albo żaden – brak + brak, ok = false, zamrożenie zostaje (1)', not (r->>'ok')::boolean and r->'dni'->0->>'wynik' = 'brak' and r->'dni'->1->>'wynik' = 'brak' and (r->>'zostalo')::int = 1, r);
  r := public.nauka_zamrozenie_uzyj_dni(array[d - 1]);
  perform test.chk('Z2 jeden dzień, 1 zamrożenie: uzyte, zostało 0', (r->>'ok')::boolean and r->'dni'->0->>'wynik' = 'uzyte' and (r->>'zostalo')::int = 0, r);
  -- Z3: dzisiaj i dni starsze niż 3 dni nie przechodzą; pusta lista i więcej niż 3 dni = bad_days
  r := public.nauka_zamrozenie_uzyj_dni(array[d, d - 4]);
  perform test.chk('Z3 dziś i dzień sprzed 4 dni: za_stary', not (r->>'ok')::boolean and r->'dni'->0->>'wynik' = 'za_stary' and r->'dni'->1->>'wynik' = 'za_stary', r);
  perform test.chk('Z3 pusta lista / 4 dni: bad_days', public.nauka_zamrozenie_uzyj_dni(array[]::date[])->>'code' = 'bad_days'
    and public.nauka_zamrozenie_uzyj_dni(array[d - 1, d - 2, d - 3, d - 4])->>'code' = 'bad_days', null);
  -- Z4: dzień z nauką (punkty) nie zużywa zamrożenia
  r := public.nauka_zamrozenie_uzyj_dni(array[d - 3]);
  perform test.chk('Z4 dzień z nauką: „nauka”, nic nie zużyte', (r->>'ok')::boolean and r->'dni'->0->>'wynik' = 'nauka', r);
end $$;

-- Z5: przerwa świąteczna nie zrywa serii i nie dodaje dni (ten sam wzór co strona: 28.12 po nauce 21–23.12 → seria 3)
reset role;
do $$ declare u uuid := '55555555-0000-4000-8000-000000000003'; begin
  perform test.chk('Z5 nauka_przerwa: 24.12, 1.01, 6.01, 11.11, 18.02 tak; 23.12, 7.01, 12.11 nie',
    public.nauka_przerwa('2026-12-24') and public.nauka_przerwa('2027-01-01') and public.nauka_przerwa('2027-01-06') and public.nauka_przerwa('2026-11-11') and public.nauka_przerwa('2027-02-18')
    and not public.nauka_przerwa('2026-12-23') and not public.nauka_przerwa('2027-01-07') and not public.nauka_przerwa('2026-11-12'), null);
  perform test.rp55(u, '2026-12-21'); perform test.rp55(u, '2026-12-22'); perform test.rp55(u, '2026-12-23');
  perform test.chk('Z5 28.12 (przerwa), ostatnia nauka 23.12: seria czeka = 3', public.nauka_seria_na(u, '2026-12-28') = 3, to_jsonb(public.nauka_seria_na(u, '2026-12-28')));
  perform test.chk('Z5 7.01 (pierwszy dzień zajęć) bez nauki: seria nadal 3', public.nauka_seria_na(u, '2027-01-07') = 3, null);
  perform test.chk('Z5 8.01 bez nauki 7.01: seria 0 (7.01 to zwykły opuszczony dzień)', public.nauka_seria_na(u, '2027-01-08') = 0, null);
  perform test.rp55(u, '2027-01-07');
  perform test.chk('Z5 nauka 7.01: seria 4 (przerwa nie dodała dni)', public.nauka_seria_na(u, '2027-01-07') = 4, null);
  perform test.chk('Z5 zwykły dzień bez nauki zrywa: 20.12 bez nauki, seria na 19.12 = 0', public.nauka_seria_na(u, '2026-12-19') = 0, null);
end $$;

-- Z6: zamrożenie w prezencie raz na konto, po 2 dniach nauki; pełny zapas = czeka
insert into auth.users (id, email) values ('55555555-0000-4000-8000-000000000004', 'seria4@x.pl'), ('55555555-0000-4000-8000-000000000005', 'seria5@x.pl') on conflict do nothing;
select test.rp55('55555555-0000-4000-8000-000000000004', (now() at time zone 'Europe/Warsaw')::date);
select test.jako('seria4@x.pl'); set role authenticated;
do $$ declare r jsonb; begin
  r := public.nauka_zamrozenie_prezent();
  perform test.chk('Z6 1 dzień nauki: za_wczesnie', r->>'code' = 'za_wczesnie', r);
end $$;
reset role; select test.rp55('55555555-0000-4000-8000-000000000004', (now() at time zone 'Europe/Warsaw')::date - 1);
select test.jako('seria4@x.pl'); set role authenticated;
do $$ declare r jsonb; begin
  r := public.nauka_zamrozenie_prezent();
  perform test.chk('Z6 2 dni nauki: prezent (nowe), zostało 1', (r->>'ok')::boolean and (r->>'nowe')::boolean and (r->>'zostalo')::int = 1, r);
  r := public.nauka_zamrozenie_prezent();
  perform test.chk('Z6 drugi raz: juz, nadal 1', (r->>'ok')::boolean and (r->>'juz')::boolean and (r->>'zostalo')::int = 1, r);
end $$;
reset role;
do $$ begin
  perform test.chk('Z6 jeden wpis prezentu z ceną 0, bez wpisu w księdze monet',
    (select count(*) = 1 and min(cena) = 0 from public.nauka_zamrozenia where user_id = '55555555-0000-4000-8000-000000000004' and req = 'prezent:konto')
    and not exists (select 1 from public.nauka_monety where user_id = '55555555-0000-4000-8000-000000000004'), null);
  perform test.rp55('55555555-0000-4000-8000-000000000005', (now() at time zone 'Europe/Warsaw')::date); perform test.rp55('55555555-0000-4000-8000-000000000005', (now() at time zone 'Europe/Warsaw')::date - 2);
  perform test.zam55('55555555-0000-4000-8000-000000000005', 2);
end $$;
select test.jako('seria5@x.pl'); set role authenticated;
do $$ declare r jsonb; begin
  r := public.nauka_zamrozenie_prezent();
  perform test.chk('Z6 pełny zapas (2/2): pelne, bez wpisu', r->>'code' = 'pelne', r);
end $$;

-- Z7: nauka_seria() dla zalogowanego
reset role; select test.jako('seria1@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_seria(); begin
  perform test.chk('Z7 nauka_seria(): ok, seria 2, dzień = dziś', (r->>'ok')::boolean and (r->>'seria')::int = 2 and (r->>'dzien')::date = (now() at time zone 'Europe/Warsaw')::date, r);
end $$;

-- Z8: stara funkcja zostaje; Z9: anon nie woła nowych funkcji
reset role;
do $$ begin
  perform test.chk('Z8 nauka_zamrozenie_uzyj() nadal istnieje', to_regprocedure('public.nauka_zamrozenie_uzyj()') is not null, null);
  perform test.chk('Z9 anon bez prawa do uzyj_dni i prezentu', not has_function_privilege('anon', 'public.nauka_zamrozenie_uzyj_dni(date[])', 'execute')
    and not has_function_privilege('anon', 'public.nauka_zamrozenie_prezent()', 'execute') and has_function_privilege('authenticated', 'public.nauka_zamrozenie_uzyj_dni(date[])', 'execute'), null);
  perform test.chk('Z9 nauka_seria_na i nauka_dzien_nauki niedostępne dla zalogowanych (tylko wewnątrz bazy)',
    not has_function_privilege('authenticated', 'public.nauka_seria_na(uuid, date)', 'execute') and not has_function_privilege('authenticated', 'public.nauka_dzien_nauki(uuid, date)', 'execute'), null);
end $$;
do $$ begin raise notice 'OK v55: Z1–Z9'; end $$;
