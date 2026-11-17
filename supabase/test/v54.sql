-- Testy B1–B7 (+2 dni przed kolokwium) i L1–L3 (licznik rocznika) dla skrot-v54-odzyskiwanie.sql. Po test/v53.sql.
reset role;
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000005401', 'b54a@x.pl'), ('00000000-0000-0000-0000-000000005402', 'b54b@x.pl'), ('00000000-0000-0000-0000-000000005403', 'b54c@x.pl')
on conflict do nothing;
-- a: próba minęła wczoraj; b: próba trwa; c: próba minęła, ale kupił
insert into public.nauka_proby (user_id, email, do_kiedy) values
  ('00000000-0000-0000-0000-000000005401', 'b54a@x.pl', now() - interval '1 day'),
  ('00000000-0000-0000-0000-000000005402', 'b54b@x.pl', now() + interval '1 day'),
  ('00000000-0000-0000-0000-000000005403', 'b54c@x.pl', now() - interval '1 day')
on conflict (user_id) do update set do_kiedy = excluded.do_kiedy, bonus_at = null;
insert into public.nauka_dostep (email, do_kiedy, zrodlo, user_id, rocznik_id) values ('b54c@x.pl', current_date + 200, 'stripe', '00000000-0000-0000-0000-000000005403', 'wefiz-bm-1-st-2026')
on conflict (email, rocznik_id) do update set do_kiedy = excluded.do_kiedy;
-- b54a w roczniku testowym (bez innych terminów), żeby terminy z wcześniejszych testów BM nie wpływały na wynik
insert into public.nauka_profil (user_id, rocznik_id) values ('00000000-0000-0000-0000-000000005401', 'wefiz-test-1-st-2026') on conflict (user_id) do update set rocznik_id = excluded.rocznik_id;
delete from public.nauka_docs where kolekcja = 'deadlines' and rocznik_id = 'wefiz-test-1-st-2026';
create or replace function test.blad54(f text) returns text language plpgsql as $$
begin execute 'select public.' || f; return null; exception when others then return sqlerrm; end $$;
grant execute on function test.blad54(text) to authenticated;

-- B1: bez terminu w 7 dniach → nie
select test.jako('b54a@x.pl'); set role authenticated;
select test.chk('B1 brak kolokwium w 7 dniach: mozna = false', not (public.nauka_proba_bonus_stan()->>'mozna')::boolean, public.nauka_proba_bonus_stan());
select test.chk('B1 nauka_proba_bonus → brak_terminu', test.blad54('nauka_proba_bonus()') like '%brak_terminu%', to_jsonb(test.blad54('nauka_proba_bonus()')));
reset role;
-- kolokwium BM za 10 dni (poza oknem) i za 5 dni (w oknie)
insert into public.nauka_docs (kolekcja, id, data, rocznik_id) values
  ('deadlines', 'd54far', jsonb_build_object('title', 'Kolokwium: Makro', 'type', 'kolokwium', 'subjectId', 'makro', 'date', to_char(current_date + 10, 'YYYY-MM-DD')), 'wefiz-test-1-st-2026')
on conflict (kolekcja, id) do update set data = excluded.data;
select test.jako('b54a@x.pl'); set role authenticated;
select test.chk('B2 kolokwium za 10 dni (poza oknem 7 dni): mozna = false', not (public.nauka_proba_bonus_stan()->>'mozna')::boolean, public.nauka_proba_bonus_stan());
reset role;
insert into public.nauka_docs (kolekcja, id, data, rocznik_id) values
  ('deadlines', 'd54near', jsonb_build_object('title', 'Kolokwium: Prawo', 'type', 'kolokwium', 'subjectId', 'prawo', 'date', to_char(current_date + 5, 'YYYY-MM-DD')), 'wefiz-test-1-st-2026')
on conflict (kolekcja, id) do update set data = excluded.data;
-- B3: po próbie, kolokwium za 5 dni → karta i +2 dni
select test.jako('b54a@x.pl'); set role authenticated;
do $$ declare s jsonb := public.nauka_proba_bonus_stan(); r jsonb; begin
  perform test.chk('B3 stan: mozna, termin za 5 dni (Prawo)', (s->>'mozna')::boolean and (s->'termin'->>'n')::int = 5 and s->'termin'->>'subjectId' = 'prawo', s);
  r := public.nauka_proba_bonus();
  perform test.chk('B3 bonus: próba znów trwa ok. 48 h (nauka_proba_do)', (r->>'do_kiedy')::timestamptz between now() + interval '47 hours' and now() + interval '49 hours' and public.nauka_proba_do() is not null, jsonb_build_array(r, public.nauka_proba_do()));
end $$;
-- B4: drugi raz → nie (raz na konto), także po końcu tych 2 dni
reset role; update public.nauka_proby set do_kiedy = now() - interval '1 hour' where email = 'b54a@x.pl';
select test.jako('b54a@x.pl'); set role authenticated;
select test.chk('B4 drugi bonus: stan mozna = false', not (public.nauka_proba_bonus_stan()->>'mozna')::boolean, public.nauka_proba_bonus_stan());
select test.chk('B4 drugi bonus → wykorzystany', test.blad54('nauka_proba_bonus()') like '%wykorzystany%', to_jsonb(test.blad54('nauka_proba_bonus()')));
-- B5: próba trwa → nie
reset role; select test.jako('b54b@x.pl'); set role authenticated;
select test.chk('B5 próba trwa: mozna = false, bonus → trwa', not (public.nauka_proba_bonus_stan()->>'mozna')::boolean and test.blad54('nauka_proba_bonus()') like '%trwa%', null);
-- B6: po zakupie → nie
reset role; select test.jako('b54c@x.pl'); set role authenticated;
select test.chk('B6 po zakupie: mozna = false, bonus → ma_dostep', not (public.nauka_proba_bonus_stan()->>'mozna')::boolean and test.blad54('nauka_proba_bonus()') like '%ma_dostep%', null);
-- B7: gość i przeglądarka bez dostępu do funkcji pomocniczej
reset role; set role anon;
do $$ begin
  begin perform public.nauka_proba_bonus_termin('00000000-0000-0000-0000-000000005401'); perform test.chk('B7 anon nie wywoła nauka_proba_bonus_termin', false, null);
  exception when insufficient_privilege then perform test.chk('B7 anon nie wywoła nauka_proba_bonus_termin', true, null); end;
end $$;

-- L1–L3: licznik rocznika dla gościa (tylko od 15 osób, sama liczba)
reset role;
-- baza testowa: wcześniejsze testy zostawiły punkty osób z rocznika testowego; zaczynamy od zera
delete from public.nauka_rp where public.nauka_rocznik_uid(user_id) = 'wefiz-test-1-st-2026';
insert into auth.users (id, email) select ('00000000-0000-0000-0000-0000000055' || lpad(i::text, 2, '0'))::uuid, 'l54-' || i || '@x.pl' from generate_series(1, 20) i on conflict do nothing;
insert into public.nauka_profil (user_id, rocznik_id) select ('00000000-0000-0000-0000-0000000055' || lpad(i::text, 2, '0'))::uuid, 'wefiz-test-1-st-2026' from generate_series(1, 20) i
on conflict (user_id) do update set rocznik_id = excluded.rocznik_id;
insert into public.nauka_rp (user_id, dzien, tydzien, zrodlo, klucz, pkt)
select ('00000000-0000-0000-0000-0000000055' || lpad(i::text, 2, '0'))::uuid, current_date - 1, date_trunc('week', current_date)::date, 'quiz', 'l54:' || i, 5 from generate_series(1, 9) i;
set role anon;
select test.chk('L1 9 osób → null (mniej niż 15)', public.nauka_rocznik_licznik('wefiz-test-1-st-2026') is null, to_jsonb(public.nauka_rocznik_licznik('wefiz-test-1-st-2026')));
reset role;
insert into public.nauka_rp (user_id, dzien, tydzien, zrodlo, klucz, pkt)
select ('00000000-0000-0000-0000-0000000055' || lpad(i::text, 2, '0'))::uuid, current_date, date_trunc('week', current_date)::date, 'quiz', 'l54b:' || i, 5 from generate_series(1, 20) i;
insert into public.nauka_rp (user_id, dzien, tydzien, zrodlo, klucz, pkt)
select ('00000000-0000-0000-0000-0000000055' || lpad(i::text, 2, '0'))::uuid, current_date - 20, date_trunc('week', current_date - 20)::date, 'quiz', 'l54old:' || i, 5 from generate_series(1, 20) i;
set role anon;
select test.chk('L2 20 osób w tygodniu (dawna nauka się nie liczy) → co najmniej 20, liczba', public.nauka_rocznik_licznik('wefiz-test-1-st-2026') >= 20, to_jsonb(public.nauka_rocznik_licznik('wefiz-test-1-st-2026')));
select test.chk('L3 rocznik bez nauki → null', public.nauka_rocznik_licznik('wefiz-zarz-1-st-2026') is null, null);
reset role;
delete from public.nauka_rp where klucz like 'l54%';
delete from public.nauka_profil where user_id::text like '00000000-0000-0000-0000-0000000055%';
delete from public.nauka_docs where id in ('d54far', 'd54near');
delete from public.nauka_dostep where email = 'b54c@x.pl';
delete from public.nauka_proby where email like 'b54%';
delete from public.nauka_profil where user_id = '00000000-0000-0000-0000-000000005401';
