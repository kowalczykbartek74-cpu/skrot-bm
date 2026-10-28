-- Testy H1–H8, D1–D6, B1–B9 dla skrot-v15-gry2.sql (docs/gry/SPEC-2.md, sekcja 2). Tylko lokalnie, na atrapie z test/stub.sql.
-- Uruchamiaj po test/v13.sql (korzysta z jego kont, schematu test i funkcji test.jako / test.chk).
-- Własne materiały i przedmioty (hm, md, bs, bs2), żeby dane z test/v13.sql nie wpływały na wyniki.
-- Daty terminów liczone od nauka_dzis(). Cały plik idzie w jednej transakcji, więc now() jest stałe:
-- czas rund przesuwamy ręcznie (jak w B8 z v13), a ciosy w bossa wpisujemy wprost do nauka_odp jako właściciel bazy.
-- Każdy test kończy się komunikatem „OK …”; pierwszy błąd przerywa plik wyjątkiem „BŁĄD …”.

-- ---------- dane ----------
reset role;
create table if not exists test.kv (k text primary key, v text);
grant select, insert, update on test.kv to authenticated;
create or replace function test.boss(r jsonb, p_id text) returns jsonb language sql immutable as $$
  select e from jsonb_array_elements(coalesce(r->'bossy', '[]'::jsonb)) e where e->>'id' = p_id
$$;
grant execute on function test.boss(jsonb, text) to authenticated;

insert into auth.users (id, email)
select ('00000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid, e
from (values (31,'h1@x.pl'),(32,'d1@x.pl'),(33,'d2@x.pl'),(34,'d3@x.pl'),(35,'d4@x.pl'),(36,'d5@x.pl'),(37,'d6@x.pl'),
             (38,'d7@x.pl'),(39,'dg@x.pl'),(40,'bx@x.pl'),(41,'by@x.pl'),(42,'bz@x.pl')) v(i, e);
insert into public.nauka_dostep (email, do_kiedy, user_id)
select u.email, current_date + 300, u.id from auth.users u where u.email ~ '^(h1|d[1-7g]|b[xyz])@x\.pl$';
insert into public.nauka_urzadzenia (user_id, device_id, nazwa)
select u.id, '11111111-1111-1111-1111-' || right(u.id::text, 12), 'test' from auth.users u where u.email ~ '^(h1|d[1-7g]|b[xyz])@x\.pl$';

insert into public.nauka_docs (kolekcja, id, data) values
  ('materials', 'hm', '{"subjectId":"hs","title":"Hasło"}'),
  ('materialContent', 'hm', '{"concepts":[
     {"term":"Inflation","pl":"inflacja","definition":"Inflation is a general rise in prices."},
     {"term":"GDP","pl":"PKB","definition":"Gross domestic product."},
     {"term":"Supply chain","pl":"łańcuch dostaw","definition":"Supply chain links suppliers."},
     {"term":"Revenue","pl":"przychód","definition":"Revenue is the total income from sales."}]}'),
  ('materials', 'md', '{"subjectId":"drab","title":"Drabina"}'),
  ('materialContent', 'md', jsonb_build_object(
     'quiz', (select jsonb_agg(jsonb_build_object('q', 'Pytanie ' || i, 'options', jsonb_build_array('A','B','C','D'), 'correct', 1)) from generate_series(0, 11) i))),
  ('deadlines', 'tb1', jsonb_build_object('title','Kolokwium A','type','kolokwium','subjectId','bs','date', to_char(public.nauka_dzis() + 5, 'YYYY-MM-DD'))),
  ('deadlines', 'tb2', jsonb_build_object('title','Egzamin','type','egzamin','subjectId','bs','date', to_char(public.nauka_dzis() + 20, 'YYYY-MM-DD'))),
  ('deadlines', 'tb3', jsonb_build_object('title','Orientacyjne','type','kolokwium','subjectId','bs','approx',true,'date', to_char(public.nauka_dzis() + 3, 'YYYY-MM-DD'))),
  ('deadlines', 'tb4', jsonb_build_object('title','Kolokwium C111','type','kolokwium','subjectId','bs2','groups',jsonb_build_array('C111'),'date', to_char(public.nauka_dzis() + 4, 'YYYY-MM-DD')));

-- =====================================================================
-- Hasło dnia
-- =====================================================================
-- ---------- H1 słowo dnia ----------
do $$ declare s public.nauka_haslo_dni := public.nauka_haslo_slowo(public.nauka_dzis());
begin
  perform test.chk('H1 słowo dnia z puli (INFLATION / REVENUE)', s.slowo in ('INFLATION','REVENUE'), to_jsonb(s));
  insert into test.kv values ('slowo', s.slowo), ('term', s.term), ('pl', s.pl), ('def', s.def),
    ('podpowiedz', case s.slowo when 'INFLATION' then '_________ is a general rise in prices.' else '_______ is the total income from sales.' end);
end $$;

-- ---------- H2 wzór ----------
select test.chk('H2 wzór (powtórzone litery)',
  public.nauka_haslo_wzor('LEVEL','LLAMA') = '21000' and public.nauka_haslo_wzor('ABBEY','BABES') = '11220',
  jsonb_build_array(public.nauka_haslo_wzor('LEVEL','LLAMA'), public.nauka_haslo_wzor('ABBEY','BABES')));

-- ---------- H3 zła długość / znaki ----------
select test.jako('h1@x.pl'); set role authenticated;
do $$ declare n int := char_length((select v from test.kv where k = 'slowo'));
  r1 jsonb := public.nauka_haslo_proba(repeat('Q', n + 1)); r2 jsonb := public.nauka_haslo_proba(repeat('Q', n - 1) || '1');
  r3 jsonb := public.nauka_haslo_proba(repeat('Ą', n)); d jsonb := public.nauka_haslo_dzis();
begin perform test.chk('H3 bad_length / bad_letters, próba się nie zużywa',
  r1->>'code' = 'bad_length' and r2->>'code' = 'bad_letters' and r3->>'code' = 'bad_letters'
  and jsonb_array_length(d->'proby') = 0 and (d->>'dlugosc')::int = n and (d->>'nr')::int = 1 and (d->>'max')::int = 6
  and d->'slowo' = 'null'::jsonb and not (d->>'koniec')::boolean, jsonb_build_array(r1, r2, r3, d)); end $$;

-- ---------- H4 powtórzona próba ----------
do $$ declare n int := char_length((select v from test.kv where k = 'slowo'));
  r1 jsonb := public.nauka_haslo_proba(lower(repeat('Q', n))); r2 jsonb := public.nauka_haslo_proba(repeat('Q', n));
begin perform test.chk('H4 repeated',
  (r1->>'ok')::boolean and r1->>'wzor' = repeat('0', n) and (r1->>'proba')::int = 1 and not (r1->>'koniec')::boolean
  and r2->>'code' = 'repeated', jsonb_build_array(r1, r2)); end $$;

-- ---------- H5 podpowiedź po 3 próbach ----------
do $$ declare n int := char_length((select v from test.kv where k = 'slowo')); d0 jsonb := public.nauka_haslo_dzis(); d jsonb;
begin
  perform public.nauka_haslo_proba(repeat('Z', n));
  d := public.nauka_haslo_dzis();
  perform test.chk('H5a 2 próby → brak podpowiedzi', d0->'podpowiedz' = 'null'::jsonb and d->'podpowiedz' = 'null'::jsonb, jsonb_build_array(d0, d));
  perform public.nauka_haslo_proba(repeat('X', n));
  d := public.nauka_haslo_dzis();
  perform test.chk('H5 3 próby → podpowiedź z zakrytym słowem', d->>'podpowiedz' = (select v from test.kv where k = 'podpowiedz')
    and jsonb_array_length(d->'proby') = 3 and jsonb_array_length(d->'wzory') = 3 and d->'slowo' = 'null'::jsonb, d);
end $$;

-- ---------- H6 trafienie w 4. próbie ----------
do $$ declare r jsonb := public.nauka_haslo_proba((select v from test.kv where k = 'slowo')); d jsonb := public.nauka_haslo_dzis();
begin
  perform test.chk('H6a trafienie w 4. próbie', (r->>'ok')::boolean and (r->>'wynik')::int = 4 and (r->>'pkt')::int = 12
    and (r->>'koniec')::boolean and r->>'wzor' = repeat('2', char_length((select v from test.kv where k = 'slowo'))), r);
  perform test.chk('H6b po końcu: słowo, PL, definicja, seria 1', d->>'slowo' = (select v from test.kv where k = 'term')
    and d->>'pl' = (select v from test.kv where k = 'pl') and d->>'def' = (select v from test.kv where k = 'def')
    and d->>'mid' = 'hm' and (d->>'seria')::int = 1 and (d->>'koniec')::boolean and (d->>'wynik')::int = 4 and (d->>'pkt')::int = 12
    and d->'stat' = 'null'::jsonb, d);
end $$;
reset role;
select test.chk('H6c punkty w księdze (źródło haslo)', (select sum(pkt) = 12 from public.nauka_rp r join auth.users u on u.id = r.user_id
  where u.email = 'h1@x.pl' and r.zrodlo = 'haslo'));

-- ---------- H7 próba po końcu ----------
select test.jako('h1@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_haslo_proba(repeat('W', char_length((select v from test.kv where k = 'slowo'))));
begin perform test.chk('H7 finished', r->>'code' = 'finished', r); end $$;

-- ---------- H8 konto bez dostępu ----------
reset role; select test.jako('c@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_haslo_proba((select v from test.kv where k = 'slowo'));
begin perform test.chk('H8 bez dostępu: wynik 1, 0 pkt', (r->>'ok')::boolean and (r->>'wynik')::int = 1 and (r->>'pkt')::int = 0, r); end $$;

-- =====================================================================
-- Drabina
-- =====================================================================
-- ---------- D1 / D6 trudność, zapis wyboru ----------
reset role;
create or replace function test.odp(u text, p_idx int, p_wybor int) returns jsonb language plpgsql as $$
declare r jsonb;
begin
  perform test.jako(u); set local role authenticated;
  r := public.nauka_rp_odpowiedz('md', p_idx, p_wybor, 'quiz');
  reset role;
  return r;
end $$;
do $$ declare w int[] := array[1,1,1,0,2,3]; r jsonb;
begin
  for i in 1..6 loop
    r := test.odp('d' || i || '@x.pl', 0, w[i]);
    if not (r->>'ok')::boolean then raise exception 'BŁĄD D1 odpowiedź → %', r; end if;
    r := test.odp('d' || i || '@x.pl', 1, 1);
    if not (r->>'poprawna')::boolean then raise exception 'BŁĄD D1 odpowiedź → %', r; end if;
  end loop;
end $$;
reset role;
select test.chk('D6 nauka_odp.wybor = 3', exists (select 1 from public.nauka_odp o join auth.users u on u.id = o.user_id
  where u.email = 'd6@x.pl' and o.mid = 'md' and o.idx = '0' and o.wybor = 3));

select test.jako('d7@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_pyt_trudnosc(array['md:0','md:1','md:2']);
begin perform test.chk('D1 trudność: md:0 50%, md:1 100%, md:2 brak',
  (r->>'ok')::boolean and r->'pyt'->'md:0' = '{"n":6,"proc":50}'::jsonb and r->'pyt'->'md:1' = '{"n":6,"proc":100}'::jsonb
  and not (r->'pyt' ? 'md:2'), r); end $$;
do $$ declare r jsonb := public.nauka_pyt_trudnosc((select array_agg('md:' || i) from generate_series(1, 81) i));
begin perform test.chk('D1b > 80 kluczy → too_many', r->>'code' = 'too_many', r); end $$;

-- ---------- D2 Zapytaj rok ----------
do $$ declare r1 jsonb := public.nauka_pyt_rok('md', 0); r2 jsonb := public.nauka_pyt_rok('md', 2);
begin perform test.chk('D2 rozkład [1,3,1,1] / za_malo',
  (r1->>'ok')::boolean and r1->'rozklad' = '[1,3,1,1]'::jsonb and (r1->>'n')::int = 6 and not (r1->>'za_malo')::boolean
  and (r2->>'ok')::boolean and (r2->>'za_malo')::boolean and (r2->>'n')::int = 0, jsonb_build_array(r1, r2)); end $$;
reset role; select test.jako('d1@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_pyt_rok('md', 0);
begin perform test.chk('D2b bez mojej odpowiedzi (5 osób)', (r->>'n')::int = 5 and r->'rozklad' = '[1,2,1,1]'::jsonb, r); end $$;
reset role; select test.jako('c@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_pyt_rok('md', 0);
begin perform test.chk('D2c bez dostępu → no_access', r->>'code' = 'no_access', r); end $$;

-- ---------- D3 / D4 / D5 wynik Drabiny ----------
reset role; select test.jako('dg@x.pl'); set role authenticated;
do $$ declare s3 jsonb := public.nauka_gra_start('drabina', 'drab'); s4 jsonb := public.nauka_gra_start('drabina', 'drab');
  s5 jsonb := public.nauka_gra_start('drabina', 'drab'); r jsonb; n int := 0;
begin
  perform test.chk('D start drabina', (s3->>'ok')::boolean and (s4->>'ok')::boolean and (s5->>'ok')::boolean, jsonb_build_array(s3, s4, s5));
  insert into test.kv values ('d3', s3->>'run'), ('d4', s4->>'run'), ('d5', s5->>'run');
  for i in 2..3 loop r := public.nauka_rp_odpowiedz('md', i, 1, 'gra', (s3->>'run')::uuid); if (r->>'poprawna')::boolean then n := n + 1; end if; end loop;
  r := public.nauka_rp_odpowiedz('md', 4, 1, 'gra', (s4->>'run')::uuid); if (r->>'poprawna')::boolean then n := n + 1; end if;
  for i in 5..8 loop r := public.nauka_rp_odpowiedz('md', i, 1, 'gra', (s5->>'run')::uuid); if (r->>'poprawna')::boolean then n := n + 1; end if; end loop;
  perform test.chk('D odpowiedzi w rundach', n = 7, to_jsonb(n));
end $$;
reset role;
update public.nauka_gry set start = now() - interval '60 seconds' where id = (select v::uuid from test.kv where k = 'd3');
update public.nauka_gry set start = now() - interval '1 second'   where id = (select v::uuid from test.kv where k = 'd4');
update public.nauka_gry set start = now() - interval '40 seconds' where id = (select v::uuid from test.kv where k = 'd5');
set role authenticated;
do $$ declare k3 jsonb := public.nauka_gra_koniec((select v::uuid from test.kv where k = 'd3'), 5, 55000);
  k4 jsonb := public.nauka_gra_koniec((select v::uuid from test.kv where k = 'd4'), 1, 1000);
  k5 jsonb := public.nauka_gra_koniec((select v::uuid from test.kv where k = 'd5'), 4, 39000);
begin
  perform test.chk('D3 5 szczebli przy 2 dobrych → podejrzana, 0 pkt', k3->>'status' = 'podejrzana' and (k3->>'pkt')::int = 0, k3);
  perform test.chk('D4 1 szczebel w 1 s → podejrzana', k4->>'status' = 'podejrzana' and (k4->>'pkt')::int = 0, k4);
  perform test.chk('D5 4 szczeble w 40 s → ok, +5, nowy rekord', k5->>'status' = 'ok' and (k5->>'pkt')::int = 5 and (k5->>'nowy_rekord')::boolean, k5);
end $$;
reset role;
select test.chk('D4b powód: za szybko', (select powod = 'drabina za szybko' from public.nauka_gry where id = (select v::uuid from test.kv where k = 'd4')));

-- =====================================================================
-- Boss przed kolokwium
-- =====================================================================
-- ---------- B1 bossy z terminów ----------
insert into test.kv values
  ('hp1', greatest(150, 12 * (select count(distinct r.user_id) from public.nauka_rp r where r.dzien > public.nauka_dzis() - 14))::text),
  ('hp4', greatest(150, 12 * (select count(distinct r.user_id) from public.nauka_rp r where r.dzien > public.nauka_dzis() - 14
                                 and public.nauka_rp_grupa(r.user_id) = 'C111'))::text);
select test.jako('a@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_bossy(); begin insert into test.kv values ('b1', r::text); end $$;
reset role;
select test.chk('B1 bossy tylko dla kolokwium (5 dni) i kolokwium C111 (4 dni); życie = max(150, 12 × aktywni)',
  (select array_agg(id order by id) from public.nauka_boss where id like 'tb%') = array['tb1','tb4']
  and (select hp from public.nauka_boss where id = 'tb1') = (select v::int from test.kv where k = 'hp1')
  and (select hp from public.nauka_boss where id = 'tb4') = (select v::int from test.kv where k = 'hp4')
  and (select grupy from public.nauka_boss where id = 'tb4') = array['C111']
  and (select start from public.nauka_boss where id = 'tb1') = public.nauka_dzis(),
  (select jsonb_agg(to_jsonb(b)) from public.nauka_boss b));
do $$ begin raise notice 'B1 życie: tb1 = %, tb4 = %', (select v from test.kv where k = 'hp1'), (select v from test.kv where k = 'hp4'); end $$;

-- ---------- B2 widoczność według grupy ----------
select test.jako('b@x.pl'); set role authenticated;
do $$ declare rb jsonb := public.nauka_bossy(); ra jsonb := (select v::jsonb from test.kv where k = 'b1');
begin perform test.chk('B2 C112 widzi bossa roku, C111 oba',
  test.boss(rb, 'tb1') is not null and test.boss(rb, 'tb4') is null
  and test.boss(ra, 'tb1') is not null and test.boss(ra, 'tb4') is not null
  and test.boss(ra, 'tb1')->>'stan' = 'trwa' and (ra->>'min_ciosow')::int = 10 and (ra->>'pkt')::int = 50,
  jsonb_build_array(rb, ra)); end $$;

-- ---------- B3 odbiór przed pokonaniem ----------
reset role; select test.jako('bx@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_boss_odbierz('tb1'); r2 jsonb := public.nauka_boss_odbierz('tb2');
begin perform test.chk('B3 not_defeated (i no_boss dla terminu bez bossa)', r->>'code' = 'not_defeated' and r2->>'code' = 'no_boss', jsonb_build_array(r, r2)); end $$;

-- ---------- B4 starosta zmienia życie ----------
reset role; select test.jako('s@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_admin_boss('tb1', 20); begin perform test.chk('B4a starosta: ok', (r->>'ok')::boolean, r); end $$;
reset role; select test.jako('bx@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_admin_boss('tb1', 1000); begin perform test.chk('B4b zwykłe konto: not_admin', r->>'code' = 'not_admin', r); end $$;
reset role;
select test.chk('B4c życie = 20', (select hp from public.nauka_boss where id = 'tb1') = 20);

-- ---------- B5 ciosy ----------
-- 12 różnych dobrych ABCD + te same 12 drugi raz + 1 zadanie liczbowe (wpisane wprost: tempo odpowiedzi ma osobny test w v13)
insert into public.nauka_odp (user_id, mid, idx, sid, rodzaj, ok, zrodlo, wybor)
select u.id, 'bm', i::text, 'bs', 'abcd', true, 'quiz', 1 from auth.users u, generate_series(0, 11) i, generate_series(1, 2) k where u.email = 'bx@x.pl';
insert into public.nauka_odp (user_id, mid, idx, sid, rodzaj, ok, zrodlo)
select u.id, 'bm', 'w1:0', 'bs', 'zadanie', true, 'quiz' from auth.users u where u.email = 'bx@x.pl';
-- zła odpowiedź nie jest ciosem
insert into public.nauka_odp (user_id, mid, idx, sid, rodzaj, ok, zrodlo, wybor)
select u.id, 'bm', '20', 'bs', 'abcd', false, 'quiz', 0 from auth.users u where u.email = 'bx@x.pl';
select test.jako('bx@x.pl'); set role authenticated;
do $$ declare b jsonb := test.boss(public.nauka_bossy(), 'tb1');
begin perform test.chk('B5a ciosy +12 (bez duplikatów) +3 za zadanie', (b->>'moje')::int = 15 and (b->>'zadane')::int = 15
  and b->>'stan' = 'trwa' and (b->>'osob')::int = 1 and not (b->>'mozna_odebrac')::boolean, b); end $$;
reset role;
insert into public.nauka_odp (user_id, mid, idx, sid, rodzaj, ok, zrodlo, wybor)
select u.id, 'bm', i::text, 'bs', 'abcd', true, 'quiz', 1 from auth.users u, generate_series(0, 1) i where u.email = 'by@x.pl';
insert into public.nauka_odp (user_id, mid, idx, sid, rodzaj, ok, zrodlo)
select u.id, 'bm', 'w1:0', 'bs', 'zadanie', true, 'quiz' from auth.users u where u.email = 'bz@x.pl';
select test.jako('bz@x.pl'); set role authenticated;
do $$ declare b jsonb := test.boss(public.nauka_bossy(), 'tb1');
begin perform test.chk('B5 boss pokonany (20/20)', b->>'stan' = 'pokonany' and (b->>'zadane')::int = 20 and (b->>'osob')::int = 3
  and b->'pokonany_at' <> 'null'::jsonb, b); end $$;

-- ---------- B6 nagroda ----------
reset role; select test.jako('bx@x.pl'); set role authenticated;
do $$ declare b0 jsonb := test.boss(public.nauka_bossy(), 'tb1'); r1 jsonb := public.nauka_boss_odbierz('tb1'); r2 jsonb := public.nauka_boss_odbierz('tb1');
  b1 jsonb := test.boss(public.nauka_bossy(), 'tb1');
begin perform test.chk('B6 +50 pkt / already', (b0->>'mozna_odebrac')::boolean and (r1->>'ok')::boolean and (r1->>'pkt')::int = 50
  and r2->>'code' = 'already' and (b1->>'odebrane')::boolean and not (b1->>'mozna_odebrac')::boolean, jsonb_build_array(b0, r1, r2, b1)); end $$;
reset role;
select test.chk('B6b punkty w księdze (źródło boss)', (select sum(pkt) = 50 from public.nauka_rp r join auth.users u on u.id = r.user_id
  where u.email = 'bx@x.pl' and r.zrodlo = 'boss' and r.klucz = 'b:tb1'));

-- ---------- B7 za mało ciosów ----------
select test.jako('by@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_boss_odbierz('tb1');
begin perform test.chk('B7 too_few (2 z 10)', r->>'code' = 'too_few' and (r->>'moje')::int = 2 and (r->>'trzeba')::int = 10, r); end $$;

-- ---------- B8 limit ciosów dziennie ----------
reset role;
insert into public.nauka_odp (user_id, mid, idx, sid, rodzaj, ok, zrodlo, wybor)
select u.id, 'bm2', i::text, 'bs2', 'abcd', true, 'quiz', 1 from auth.users u, generate_series(0, 99) i where u.email = 'a@x.pl';
select test.jako('a@x.pl'); set role authenticated;
do $$ declare b jsonb := test.boss(public.nauka_bossy(), 'tb4');
begin perform test.chk('B8 100 dobrych jednego dnia → 40 ciosów', (b->>'moje')::int = 40 and b->>'stan' = 'trwa', b); end $$;

-- ---------- B9 uprawnienia ----------
do $$ declare n int := 0; begin
  begin perform 1 from public.nauka_boss limit 1; exception when insufficient_privilege then n := n + 1; end;
  begin perform 1 from public.nauka_haslo_dni limit 1; exception when insufficient_privilege then n := n + 1; end;
  begin perform * from public.nauka_boss_ciosy('tb1'); exception when insufficient_privilege then n := n + 1; end;
  begin perform public.nauka_haslo_slowo(public.nauka_dzis()); exception when insufficient_privilege then n := n + 1; end;
  perform test.chk('B9 permission denied ×4', n = 4, to_jsonb(n));
end $$;
reset role;

do $$ begin raise notice 'WSZYSTKIE TESTY H1–H8, D1–D6, B1–B9 OK'; end $$;
