-- Test dla skrot-v26-odwolania.sql: gość (anon) czyta tylko zatwierdzone wpisy, bez odrzuconych i bez „by”.
reset role;
grant usage on schema test to anon; grant execute on function test.chk(text, boolean, jsonb) to anon;
insert into public.nauka_docs (kolekcja, id, data) values ('meta', 'odwolania', '{"items": {"o1": {"id": "o1", "tid": "t1", "kind": "cancel", "title": "Odwołane wykłady z Logistyki 3 i 4.11", "team": "Logistics", "pub": 1, "by": "u-staro", "z": {"C112": [{"type": "cancel", "date": "2026-11-04", "start": "8:15", "pl": "Logistyka"}]}}}, "rejected": {"t9": 1}}')
  on conflict (kolekcja, id) do update set data = excluded.data;
set role anon;
do $$ declare r jsonb := public.nauka_odwolania_publiczne();
begin
  perform test.chk('W1 anon: wpis C112 4.11 8:15', r #>> '{items,o1,z,C112,0,start}' = '8:15' and r #>> '{items,o1,title}' like 'Odwołane%', r);
  perform test.chk('W2 bez by i bez rejected', not (r->'items'->'o1' ? 'by') and not (r ? 'rejected'), r);
end $$;
reset role;
delete from public.nauka_docs where kolekcja = 'meta' and id = 'odwolania';
set role anon;
do $$ declare r jsonb := public.nauka_odwolania_publiczne();
begin
  perform test.chk('W3 bez dokumentu: puste items', r = '{"items": {}}'::jsonb, r);
end $$;
reset role;
select 'OK v26' as wynik;
