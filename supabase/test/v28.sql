-- Testy Z1–Z9 dla skrot-v28-zdarzenia-nauki.sql. Własne konto z1 (dostęp) i z2 (bez dostępu).
reset role;
insert into auth.users (id, email)
select ('00000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid, e from (values (181,'z1@x.pl'),(182,'z2@x.pl')) v(i, e);
insert into public.nauka_dostep (email, do_kiedy, user_id) select u.email, current_date + 300, u.id from auth.users u where u.email = 'z1@x.pl';
insert into public.nauka_urzadzenia (user_id, device_id, nazwa)
select u.id, '11111111-1111-1111-1111-' || right(u.id::text, 12), 'test' from auth.users u where u.email in ('z1@x.pl','z2@x.pl');
insert into public.nauka_docs (kolekcja, id, data) values
  ('meta', 'po', '{"items": {"logistyka~W~0": {"sid": "logistyka", "k": "W", "t": "Essence", "syl": true}}}'),
  ('meta', 'po~logistyka~W~0', '{"title": "x", "quiz": [{"q": "a", "options": ["A","B","C","D"], "correct": 2}, {"q": "b", "options": ["A","B"], "correct": 0}, {"q": "c", "options": ["A","B"], "correct": 1}]}'),
  ('meta', 'stas', '{"items": {"ochrona~W~ind": {"sid": "ochrona-wlasnosci-intelektualnej", "k": "W", "t": "Industrial"}}}'),
  ('meta', 'stas~ochrona~W~ind', '{"title": "x", "sentences": [{"text": "a", "isWrong": false}, {"text": "b", "isWrong": true}, {"text": "c", "isWrong": true}, {"text": "d", "isWrong": false}]}')
on conflict (kolekcja, id) do update set data = excluded.data;

select test.jako('z1@x.pl'); set role authenticated;
-- Z1 Po zajęciach: zła odpowiedź 0 pkt, potem dobra tego samego pytania też 0 (liczy się pierwsza dziś)
do $$ declare a jsonb := public.nauka_rp_po('logistyka~W~0', 0, 1); b jsonb := public.nauka_rp_po('logistyka~W~0', 0, 2);
begin perform test.chk('Z1 pierwsza zła, potem dobra: 0 pkt', not (a->>'poprawna')::boolean and (b->>'poprawna')::boolean and (b->>'pkt')::int = 0, jsonb_build_array(a, b)); end $$;
-- Z2 dobra przy pierwszej: 10 pkt, drugi raz 0
do $$ declare a jsonb := public.nauka_rp_po('logistyka~W~0', 1, 0); b jsonb := public.nauka_rp_po('logistyka~W~0', 1, 0);
begin perform test.chk('Z2 dobra: 10 pkt raz dziennie', (a->>'pkt')::int = 10 and (b->>'pkt')::int = 0, jsonb_build_array(a, b)); end $$;
-- Z3 nie ma takiego pytania
do $$ declare a jsonb := public.nauka_rp_po('logistyka~W~0', 9, 0); b jsonb := public.nauka_rp_po('nie-ma', 0, 0);
begin perform test.chk('Z3 brak pytania', a->>'code' = 'no_question' and b->>'code' = 'no_question', jsonb_build_array(a, b)); end $$;
-- Z4 Staś: 2 prawdziwe błędy + 1 źle oznaczone = 20 pkt; drugi raz 0
do $$ declare a jsonb := public.nauka_rp_stas('ochrona~W~ind', array[1,2,3]); b jsonb := public.nauka_rp_stas('ochrona~W~ind', array[1,2]);
begin perform test.chk('Z4 Staś: 2 dobre, 1 zła, 20 pkt; powtórka 0', (a->>'dobre')::int = 2 and (a->>'zle')::int = 1 and (a->>'pkt')::int = 20 and (b->>'pkt')::int = 0, jsonb_build_array(a, b)); end $$;
-- Z5 monety z punktów (trigger v14) i wiersze q:po~ / q:stas~ w księdze
reset role;
do $$ declare u uuid := (select id from auth.users where email = 'z1@x.pl'); n int; mon int;
begin
  select count(*) into n from public.nauka_rp where user_id = u and (klucz like 'q:po~%' or klucz like 'q:stas~%');
  select coalesce(sum(delta), 0) into mon from public.nauka_monety where user_id = u and zrodlo = 'nauka';
  perform test.chk('Z5 3 wiersze punktów, 3 monety', n = 3 and mon = 3, jsonb_build_object('n', n, 'mon', mon));
end $$;
select test.jako('z1@x.pl'); set role authenticated;
-- Z6 osobiste zadanie: wybór raz dziennie, drugi wybór nie zmienia
do $$ declare a jsonb := public.nauka_misja_osobista_ustaw('stas', '{"pl": "Popraw Stasia", "en": "Fix Staś"}'); b jsonb := public.nauka_misja_osobista_ustaw('po', '{"pl": "Inne"}');
begin perform test.chk('Z6 osobista: stas, nie da się podmienić', a #>> '{osobista,typ}' = 'stas' and b #>> '{osobista,typ}' = 'stas' and b #>> '{osobista,opis_pl}' = 'Popraw Stasia'
  and (b #>> '{osobista,postep}')::int = 2 and jsonb_array_length(b->'misje') = 4, b); end $$;
-- Z7 odbiór: 8 monet raz
do $$ declare a jsonb := public.nauka_misja_odbierz('osobista'); b jsonb := public.nauka_misja_odbierz('osobista');
begin perform test.chk('Z7 odbiór 8 🪙 raz', (a->>'ok')::boolean and (a->>'nagroda')::int = 8 and b->>'code' = 'already', jsonb_build_array(a, b)); end $$;
-- Z8 sprint bez przedmiotu: bad_input; wspólne zadania dalej działają (not_done albo ok)
do $$ declare a jsonb := public.nauka_misja_odbierz('odp10');
begin perform test.chk('Z8 wspólne zadanie dalej przez tę samą funkcję', a->>'code' in ('not_done','not_today') or (a->>'ok')::boolean, a); end $$;
-- Z9 bez dostępu
reset role; select test.jako('z2@x.pl'); set role authenticated;
do $$ declare a jsonb := public.nauka_rp_po('logistyka~W~0', 1, 0); b jsonb := public.nauka_rp_stas('ochrona~W~ind', array[1]); c jsonb := public.nauka_misja_osobista_ustaw('po', '{}');
begin perform test.chk('Z9 bez dostępu: no_access', a->>'code' = 'no_access' and b->>'code' = 'no_access' and c->>'code' = 'no_access', jsonb_build_array(a, b, c)); end $$;
reset role;
select 'OK v28' as wynik;
