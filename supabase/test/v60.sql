-- Testy S1–S8 dla skrot-v60-start-gablota.sql (pętla UX-5, etap G3). Tylko lokalnie (PGlite, po test/v59.sql).
reset role;
select set_config('request.jwt.claims', '', false);
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000006001', 'ux5s1@x.pl'), ('00000000-0000-0000-0000-000000006002', 'ux5s2@x.pl'),
  ('00000000-0000-0000-0000-000000006003', 'ux5s3@x.pl') on conflict do nothing;
-- S1: start próby → +100 raz
insert into public.nauka_proby (user_id, email, do_kiedy) values ('00000000-0000-0000-0000-000000006001', 'ux5s1@x.pl', now() + interval '3 days') on conflict do nothing;
do $$ begin perform test.chk('V60 S1 próba: +100 na start', (select sum(delta) from public.nauka_monety where user_id = '00000000-0000-0000-0000-000000006001' and klucz = 'start') = 100, null); end $$;
-- S2: potem zakup → bez drugiej nagrody
insert into public.nauka_dostep (email, do_kiedy, user_id) values ('ux5s1@x.pl', current_date + 300, '00000000-0000-0000-0000-000000006001') on conflict do nothing;
do $$ begin perform test.chk('V60 S2 zakup po próbie: nadal jeden wpis start', (select count(*) from public.nauka_monety where user_id = '00000000-0000-0000-0000-000000006001' and klucz = 'start') = 1, null); end $$;
-- S3: zakup bez próby (po e-mailu, bez user_id) → +100
insert into public.nauka_dostep (email, do_kiedy) values ('ux5s2@x.pl', current_date + 300) on conflict do nothing;
do $$ begin perform test.chk('V60 S3 zakup bez próby (po e-mailu): +100', (select sum(delta) from public.nauka_monety where user_id = '00000000-0000-0000-0000-000000006002' and klucz = 'start') = 100, null); end $$;
-- S4: dostęp przed rejestracją, user_id dopisany później → +100 raz
delete from auth.users where id = '00000000-0000-0000-0000-000000006003';
insert into public.nauka_dostep (email, do_kiedy) values ('ux5s3@x.pl', current_date + 300) on conflict do nothing;
insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000006003', 'ux5s3@x.pl') on conflict do nothing;
update public.nauka_dostep set user_id = '00000000-0000-0000-0000-000000006003' where email = 'ux5s3@x.pl';
update public.nauka_dostep set do_kiedy = do_kiedy + 1 where email = 'ux5s3@x.pl';
do $$ begin perform test.chk('V60 S4 user_id dopisany później: +100 raz', (select count(*) from public.nauka_monety where user_id = '00000000-0000-0000-0000-000000006003' and klucz = 'start') = 1, null); end $$;
-- S5: gablota 3 miejsca, bez gablota:2/3 w katalogu
do $$ begin
  perform test.chk('V60 S5 gablota: 3 miejsca bazowo', public.nauka_gablota_miejsca('00000000-0000-0000-0000-000000006001') = 3, null);
  perform test.chk('V60 S5 katalog bez gablota:2 i gablota:3', not exists (select 1 from jsonb_array_elements(public.nauka_sklep_katalog()) where value->>'id' in ('gablota:2','gablota:3')), null);
  perform test.chk('V60 S6 nagrody 15/17/20 w katalogu, tylko za poziom', (select count(*) from jsonb_array_elements(public.nauka_sklep_katalog()) where value->>'id' in ('ramka:platynowa','tytul:prezes-roku','ramka:geniusz') and value->'cena' = 'null'::jsonb and (value->>'tylko_za_poziom')::int in (15,17,20)) = 3, null);
  perform test.chk('V60 S6 Złota ramka zostaje (poziom 10), motywy z v59 zostają', exists (select 1 from jsonb_array_elements(public.nauka_sklep_katalog()) where value->>'id' = 'ramka:zlota' and (value->>'tylko_za_poziom')::int = 10)
    and exists (select 1 from jsonb_array_elements(public.nauka_sklep_katalog()) where value->>'id' = 'motyw:pink' and (value->>'cena')::int = 80), null);
end $$;
-- S7: zwrot za kupione miejsce (symulacja: kupione przed v60, potem v60 jeszcze raz)
insert into public.nauka_posiadane (user_id, item, cena) values ('00000000-0000-0000-0000-000000006002', 'gablota:2', 600) on conflict do nothing;
