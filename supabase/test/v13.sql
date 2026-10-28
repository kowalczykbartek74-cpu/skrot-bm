-- Testy B1–B20 dla skrot-v13-gry.sql (SPEC gier, sekcja 11.1). Tylko lokalnie, na atrapie z test/stub.sql.
-- Pomocnicze funkcje i tabela są w schemacie test (pg_temp nie jest dostępny dla roli authenticated).
-- Każdy test kończy się komunikatem „OK Bn …”; pierwszy błąd przerywa plik wyjątkiem „BŁĄD Bn …”.

-- ---------- dane ----------
reset role;
create schema if not exists test;
grant usage on schema test to authenticated;
create or replace function test.jako(u text) returns void language plpgsql as $$
declare uid uuid; em text;
begin
  select id, email into uid, em from auth.users where email = u;
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'email', em, 'role','authenticated')::text, false);
  perform set_config('request.headers', json_build_object('x-skrot-device','11111111-1111-1111-1111-'||right(uid::text,12))::text, false);
end $$;
create or replace function test.chk(nazwa text, warunek boolean, co jsonb default null) returns void language plpgsql as $$
begin
  if warunek is not true then raise exception 'BŁĄD % → %', nazwa, co; end if;
  raise notice 'OK %', nazwa;
end $$;
grant execute on function test.chk(text, boolean, jsonb) to authenticated;

insert into auth.users (id, email)
select ('00000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid, e
from (values (1,'a@x.pl'),(2,'b@x.pl'),(3,'c@x.pl'),(4,'s@x.pl'),(5,'r@x.pl'),(6,'p@x.pl'),(7,'l@x.pl'),(8,'w@x.pl'),(9,'h@x.pl'),
             (11,'st1@x.pl'),(12,'st2@x.pl'),(13,'st3@x.pl'),(14,'st4@x.pl'),(15,'st5@x.pl'),(16,'st6@x.pl'),(17,'st7@x.pl'),(18,'st8@x.pl'),(19,'st9@x.pl'),(20,'st10@x.pl')) v(i, e);
-- c@x.pl: bez dostępu; s@x.pl: starosta
insert into public.nauka_admini (email) values ('s@x.pl') on conflict do nothing;
insert into public.nauka_dostep (email, do_kiedy, user_id)
select u.email, current_date + 300, u.id from auth.users u where u.email not in ('c@x.pl','s@x.pl');
insert into public.nauka_urzadzenia (user_id, device_id, nazwa)
select u.id, '11111111-1111-1111-1111-' || right(u.id::text, 12), 'test' from auth.users u;
insert into public.nauka_docs (kolekcja, id, data) values
  ('materials', 'm1', '{"subjectId":"makro","title":"M1"}'),
  ('materials', 'l1', '{"subjectId":"makro","kind":"lesson","title":"L1"}'),
  ('materialContent', 'm1', jsonb_build_object(
     'quiz', (select jsonb_agg(jsonb_build_object('q', 'Pytanie ' || i, 'options', jsonb_build_array('A','B','C','D'), 'correct', 1)) from generate_series(0, 39) i),
     'worked', '[{"id":"w1","similar":[{"task":"t","result":250},{"task":"t2","result":0.5,"tol":0.1}]}]'::jsonb)),
  ('progress', '00000000-0000-0000-0000-000000000001', '{"group":"C111"}'),
  ('progress', '00000000-0000-0000-0000-000000000002', '{"group":"C112"}');

-- ---------- B1 pseudonim ----------
create table test.b8 (r1 uuid, r2 uuid);
grant select, insert on test.b8 to authenticated;
select test.jako('a@x.pl'); set role authenticated;
do $$ declare r1 jsonb := public.nauka_profil_ustaw('ad'); r2 jsonb := public.nauka_profil_ustaw('Starosta123'); r3 jsonb := public.nauka_profil_ustaw(null, true);
begin perform test.chk('B1 pseudonim', r1->>'code' = 'nick_dlugosc' and r2->>'code' = 'nick_zastrzezony' and r3->>'code' = 'nick_brak', jsonb_build_array(r1, r2, r3)); end $$;

-- ---------- B2 zajęty ----------
do $$ declare r jsonb := public.nauka_profil_ustaw('Łoś Ania', true); begin perform test.chk('B2a pseudonim ok', (r->>'ok')::boolean and r->>'nick' = 'Łoś Ania', r); end $$;
reset role; select test.jako('b@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_profil_ustaw('Łoś ania'); begin perform test.chk('B2b nick_zajety', r->>'code' = 'nick_zajety', r); end $$;
do $$ declare r jsonb := public.nauka_profil_ustaw('Bartek B', true); begin perform test.chk('B2c drugi pseudonim', (r->>'ok')::boolean, r); end $$;

-- ---------- B3 / B4 odpowiedzi ----------
reset role; select test.jako('a@x.pl'); set role authenticated;
do $$ declare r1 jsonb := public.nauka_rp_odpowiedz('m1', 0, 1, 'quiz'); r2 jsonb := public.nauka_rp_odpowiedz('m1', 0, 1, 'quiz');
begin perform test.chk('B3 +10 potem +0', (r1->>'pkt')::int = 10 and (r2->>'pkt')::int = 0 and (r2->>'poprawna')::boolean, jsonb_build_array(r1, r2)); end $$;
do $$ declare r1 jsonb := public.nauka_rp_odpowiedz('m1', 1, 3, 'quiz'); r2 jsonb := public.nauka_rp_odpowiedz('nie-ma', 0, 1, 'quiz');
  r3 jsonb := public.nauka_rp_odpowiedz('m1', 1, 1, 'quiz');
begin perform test.chk('B4 zła / brak pytania / druga próba bez punktów',
  not (r1->>'poprawna')::boolean and (r1->>'pkt')::int = 0 and r2->>'code' = 'no_question' and (r3->>'poprawna')::boolean and (r3->>'pkt')::int = 0,
  jsonb_build_array(r1, r2, r3)); end $$;

-- ---------- B5 zadania ----------
do $$ declare r1 jsonb := public.nauka_rp_zadanie('m1', 'w1', 0, 251, 'quiz'); r2 jsonb := public.nauka_rp_zadanie('m1', 'w1', 1, 0.75, 'quiz');
begin perform test.chk('B5 tolerancja', (r1->>'pkt')::int = 20 and not (r2->>'poprawna')::boolean, jsonb_build_array(r1, r2)); end $$;

-- ---------- B6 lekcja ----------
do $$ declare r1 jsonb := public.nauka_rp_lekcja('l1'); r2 jsonb := public.nauka_rp_lekcja('l1');
begin perform test.chk('B6 lekcja raz', (r1->>'pkt')::int = 30 and (r2->>'juz')::boolean and (r2->>'pkt')::int = 0, jsonb_build_array(r1, r2)); end $$;

-- ---------- B7 gra bez rundy ----------
do $$ declare r jsonb := public.nauka_rp_odpowiedz('m1', 2, 1, 'gra'); begin perform test.chk('B7 bad_run', r->>'code' = 'bad_run', r); end $$;

-- ---------- B8 Fruń ----------
do $$ declare s1 jsonb := public.nauka_gra_start('frun'); s2 jsonb := public.nauka_gra_start('frun');
begin
  -- czas startu przesuwamy niżej jako właściciel bazy (authenticated nie ma dostępu do tabel)
  perform test.chk('B8 start', (s1->>'ok')::boolean and (s2->>'ok')::boolean, jsonb_build_array(s1, s2));
  insert into test.b8 values ((s1->>'run')::uuid, (s2->>'run')::uuid);
end $$;
reset role;
update public.nauka_gry set start = now() - interval '1 second' where id = (select r1 from test.b8);
update public.nauka_gry set start = now() - interval '60 seconds' where id = (select r2 from test.b8);
set role authenticated;
do $$ declare k1 jsonb := public.nauka_gra_koniec((select r1 from test.b8), 500, 900); k2 jsonb := public.nauka_gra_koniec((select r2 from test.b8), 40, 58000);
  k3 jsonb := public.nauka_gra_koniec((select r2 from test.b8), 40, 58000);
begin perform test.chk('B8 podejrzana / ok / already_finished',
  k1->>'status' = 'podejrzana' and (k1->>'pkt')::int = 0 and k2->>'status' = 'ok' and (k2->>'pkt')::int = 20 and (k2->>'nowy_rekord')::boolean
  and k3->>'code' = 'already_finished', jsonb_build_array(k1, k2, k3)); end $$;

-- ---------- B9 bez dostępu ----------
reset role; select test.jako('c@x.pl'); set role authenticated;
do $$ declare r1 jsonb := public.nauka_gra_start('frun'); r2 jsonb := public.nauka_ranking(); r3 jsonb := public.nauka_rp_odpowiedz('m1', 0, 1, 'quiz');
begin perform test.chk('B9 no_access ×3', r1->>'code' = 'no_access' and r2->>'code' = 'no_access' and r3->>'code' = 'no_access', jsonb_build_array(r1, r2, r3)); end $$;

-- ---------- B10 powtórki ----------
reset role; select test.jako('p@x.pl'); set role authenticated;
do $$ declare s int := 0; begin
  for i in 1..30 loop s := s + (public.nauka_rp_powtorka('m1:karta' || i)->>'pkt')::int; end loop;
  perform test.chk('B10 powtórki razem 20', s = 20, to_jsonb(s)); end $$;

-- ---------- B11 tempo ----------
reset role; select test.jako('r@x.pl'); set role authenticated;
do $$ declare n int := 0; begin
  for i in 0..24 loop if public.nauka_rp_odpowiedz('m1', i, 1, 'quiz')->>'code' = 'too_fast' then n := n + 1; end if; end loop;
  perform test.chk('B11 5 × too_fast', n = 5, to_jsonb(n)); end $$;

-- ---------- B12 starosta ----------
reset role; select test.jako('s@x.pl'); set role authenticated;
do $$ declare r1 jsonb := public.nauka_profil_ustaw('Szef', true); r2 jsonb := public.nauka_rp_odpowiedz('m1', 5, 1, 'quiz'); r3 jsonb := public.nauka_ranking();
begin perform test.chk('B12 starosta poza listą', (r2->>'pkt')::int = 10
  and not exists (select 1 from jsonb_array_elements(r3->'top') x where x->>'nick' = 'Szef'), jsonb_build_array(r2, r3)); end $$;

-- ---------- B13 ukryty ----------
reset role; select test.jako('h@x.pl'); set role authenticated;
do $$ declare r0 jsonb := public.nauka_rp_odpowiedz('m1', 7, 1, 'quiz'); r jsonb := public.nauka_ranking();
begin perform test.chk('B13 ukryty: miejsce liczone, brak na liście',
  not (r->'ja'->>'widoczny')::boolean and (r->'ja'->>'miejsce') is not null and jsonb_array_length(r->'top') = (r->>'n')::int
  and (r->'ja'->>'z')::int = (r->>'n')::int + 1, r); end $$;

-- ---------- B14 inna grupa ----------
reset role; select test.jako('a@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_ranking('tydzien', 'C112'); r2 jsonb := public.nauka_ranking('tydzien', 'C111');
begin perform test.chk('B14 filtr cudzej grupy', not (r->'ja'->>'w_grupie')::boolean and r->'ja'->'miejsce' = 'null'::jsonb
  and (r2->'ja'->>'miejsce')::int = 1, jsonb_build_array(r, r2)); end $$;

-- ---------- B15 statystyki ----------
reset role;
delete from public.nauka_odp where sid = 'mikro';
insert into public.nauka_odp (user_id, mid, idx, sid, rodzaj, ok, zrodlo)
select ('00000000-0000-0000-0000-' || lpad(u::text, 12, '0'))::uuid, 'mx', i::text, 'mikro', 'abcd', (i + u) % 3 > 0, 'quiz'
from generate_series(11, 14) u, generate_series(1, 10) i;
select test.jako('st1@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_kierunek_stat();
begin perform test.chk('B15a 4 osoby → brak przedmiotu', not exists (select 1 from jsonb_array_elements(r->'przedmioty') x where x->>'sid' = 'mikro'), r); end $$;
reset role;
insert into public.nauka_odp (user_id, mid, idx, sid, rodzaj, ok, zrodlo)
select ('00000000-0000-0000-0000-' || lpad(u::text, 12, '0'))::uuid, 'mx', i::text, 'mikro', 'abcd', (i + u) % 3 > 0, 'quiz'
from generate_series(15, 20) u, generate_series(1, 10) i;
select test.jako('st1@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_kierunek_stat(); x jsonb;
begin
  select e into x from jsonb_array_elements(r->'przedmioty') e where e->>'sid' = 'mikro';
  perform test.chk('B15b 10 osób → proc, moj_proc, lepiej_niz', x ? 'proc' and (x->>'moj_proc') is not null and (x->>'lepiej_niz') is not null, r); end $$;

-- ---------- B16 / B17 uprawnienia ----------
do $$ begin
  begin perform 1 from public.nauka_rp limit 1; perform test.chk('B16 select z nauka_rp zablokowany', false);
  exception when insufficient_privilege then perform test.chk('B16 select z nauka_rp zablokowany', true); end;
  begin perform public.nauka_rp_dodaj(auth.uid(), 'quiz', 'x', null, 100); perform test.chk('B17 nauka_rp_dodaj zablokowana', false);
  exception when insufficient_privilege then perform test.chk('B17 nauka_rp_dodaj zablokowana', true); end;
end $$;

-- ---------- B18 13. pytanie w rundzie ----------
reset role; select test.jako('l@x.pl'); set role authenticated;
do $$ declare s jsonb := public.nauka_gra_start('frun'); r jsonb;
begin
  for i in 0..11 loop r := public.nauka_rp_odpowiedz('m1', i, 1, 'gra', (s->>'run')::uuid); end loop;
  r := public.nauka_rp_odpowiedz('m1', 12, 1, 'gra', (s->>'run')::uuid);
  perform test.chk('B18 13. pytanie → bad_run', r->>'code' = 'bad_run', r); end $$;

-- ---------- B19 limit gier 150 ----------
reset role;
insert into public.nauka_rp (user_id, dzien, tydzien, zrodlo, klucz, pkt)
select u.id, public.nauka_dzis(), public.nauka_tydzien(public.nauka_dzis()), 'wynik', 'r:test' || i, 20 from auth.users u, generate_series(1, 7) i where u.email = 'w@x.pl';
select test.jako('w@x.pl'); set role authenticated;
do $$ declare s jsonb := public.nauka_gra_start('frun'); r1 jsonb; r2 jsonb;
begin
  r1 := public.nauka_rp_odpowiedz('m1', 20, 1, 'gra', (s->>'run')::uuid);
  r2 := public.nauka_rp_odpowiedz('m1', 21, 1, 'gra', (s->>'run')::uuid);
  perform test.chk('B19 pula gier = 150', (r1->>'pkt')::int = 10 and (r2->>'pkt')::int = 0, jsonb_build_array(r1, r2)); end $$;
reset role;
select test.chk('B19 suma puli gry', (select sum(pkt) from public.nauka_rp r join auth.users u on u.id = r.user_id
  where u.email = 'w@x.pl' and r.dzien = public.nauka_dzis() and r.zrodlo in ('gra','wynik')) = 150);

-- ---------- B20 seria ----------
insert into public.nauka_rp (user_id, dzien, tydzien, zrodlo, klucz, pkt)
select u.id, public.nauka_dzis() - 1, public.nauka_tydzien(public.nauka_dzis() - 1), 'quiz', 'q:wczoraj', 10 from auth.users u where u.email = 'st2@x.pl';
select test.jako('st2@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_rp_odpowiedz('m1', 30, 1, 'quiz'); begin perform test.chk('B20a odpowiedź', (r->>'pkt')::int = 10, r); end $$;
do $$ declare r jsonb := public.nauka_rp_odpowiedz('m1', 31, 1, 'quiz'); begin perform test.chk('B20b druga odpowiedź', (r->>'pkt')::int = 10, r); end $$;
reset role;
select test.chk('B20 jeden wiersz seria +5', (select count(*) = 1 and sum(pkt) = 5 from public.nauka_rp r join auth.users u on u.id = r.user_id
  where u.email = 'st2@x.pl' and r.dzien = public.nauka_dzis() and r.zrodlo = 'seria'));

do $$ begin raise notice 'WSZYSTKIE TESTY B1–B20 OK'; end $$;
