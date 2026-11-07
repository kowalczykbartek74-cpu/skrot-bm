-- Przed v44: co widzą student BM (a@x.pl), gość i administrator. test/v44.sql porówna to samo po migracji (dla BM nic się nie zmienia).
reset role;
create table if not exists test.v44_przed (kto text, kolekcja text, id text, h text);
truncate test.v44_przed;
grant insert on test.v44_przed to anon, authenticated;
select test.jako('a@x.pl'); set role authenticated;
insert into test.v44_przed select 'a', kolekcja, id, md5(data::text) from public.nauka_docs;
reset role;
select test.jako('s@x.pl'); set role authenticated;
insert into test.v44_przed select 's', kolekcja, id, md5(data::text) from public.nauka_docs;
reset role;
select set_config('request.jwt.claims', '', false); set role anon;
insert into test.v44_przed select 'anon', kolekcja, id, md5(data::text) from public.nauka_docs;
reset role;
do $$ begin
  if (select count(*) from test.v44_przed where kto = 'a') < 5 then raise exception 'v44-przed: student BM widzi za mało'; end if;
  raise notice 'OK v44-przed: % / % / % dokumentów (BM, admin, gość)',
    (select count(*) from test.v44_przed where kto = 'a'), (select count(*) from test.v44_przed where kto = 's'),
    (select count(*) from test.v44_przed where kto = 'anon');
end $$;
