-- Testy Z1–Z8 dla skrot-v39-zdjecie.sql (dzienny limit sprawdzeń zdjęcia rozwiązania). Po test/v38.sql.
-- Osoby: adm39 (starosta), ala39 (bez dostępu), bob39 i cyr39 (opłacone). Tylko lokalnie, na atrapie z test/stub.sql.
reset role;
grant execute on function test.chk(text, boolean, jsonb) to anon, authenticated, service_role;
insert into auth.users (id, email, created_at)
select ('00000000-0000-0000-0000-0000000039' || lpad(i::text, 2, '0'))::uuid, e, now()
from (values (1,'adm39@x.pl'),(2,'ala39@x.pl'),(3,'bob39@x.pl'),(4,'cyr39@x.pl')) v(i, e)
on conflict do nothing;
insert into public.nauka_admini (email) values ('adm39@x.pl') on conflict do nothing;
insert into public.nauka_dostep (email, do_kiedy, zrodlo, user_id) values
  ('bob39@x.pl', current_date + 200, 'stripe', '00000000-0000-0000-0000-000000003903'),
  ('cyr39@x.pl', current_date + 200, 'karnet', '00000000-0000-0000-0000-000000003904')
on conflict (email) do nothing;
insert into public.nauka_urzadzenia (user_id, device_id, nazwa)
select u.id, '11111111-1111-1111-1111-' || right(u.id::text, 12), 'test' from auth.users u where u.email in ('ala39@x.pl','bob39@x.pl','cyr39@x.pl')
on conflict do nothing;

-- Z1 anon nie woła żadnej funkcji
set request.jwt.claims = '{}'; set role anon;
do $$ begin
  begin perform public.nauka_zdjecie_bierz(5, null); perform test.chk('Z1 anon nie woła nauka_zdjecie_bierz', false, null);
  exception when insufficient_privilege then perform test.chk('Z1 anon nie woła nauka_zdjecie_bierz', true, null); end;
end $$;
reset role;

-- Z2 zalogowany bez pełnego dostępu: not_granted i nic nie zapisane
select test.jako('ala39@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_zdjecie_bierz(5, 'wefiz-bm-1-st-2026'); s jsonb := public.nauka_zdjecie_stan(5);
begin perform test.chk('Z2 bez dostępu: not_granted, stan ok=false', r->>'code' = 'not_granted' and not (s->>'ok')::boolean, jsonb_build_array(r, s)); end $$;
reset role;
select test.chk('Z2 bez dostępu: brak wpisu', (select count(*) = 0 from public.nauka_zdjecia where user_id = '00000000-0000-0000-0000-000000003902'), null);

-- Z3 płacący: 5 sprawdzeń przechodzi, szóste nie (D9); licznik rośnie po kolei
select test.jako('bob39@x.pl'); set role authenticated;
do $$ declare r jsonb; ok int := 0; last jsonb;
begin
  for i in 1..5 loop r := public.nauka_zdjecie_bierz(5, 'wefiz-bm-1-st-2026'); if (r->>'ok')::boolean and (r->>'uzyte')::int = i then ok := ok + 1; end if; end loop;
  last := public.nauka_zdjecie_bierz(5, 'wefiz-bm-1-st-2026');
  perform test.chk('Z3 płacący: 5 razy ok, szósty limit', ok = 5 and last->>'code' = 'limit' and (last->>'uzyte')::int = 5, jsonb_build_array(ok, last));
  perform test.chk('Z3 stan: uzyte 5 z 5', (public.nauka_zdjecie_stan(5)->>'uzyte')::int = 5, public.nauka_zdjecie_stan(5));
end $$;

-- Z4 student nie czyta tabeli i nie zwraca sobie miejsca
do $$ begin
  begin perform 1 from public.nauka_zdjecia; perform test.chk('Z4 student nie czyta nauka_zdjecia', false, null);
  exception when insufficient_privilege then perform test.chk('Z4 student nie czyta nauka_zdjecia', true, null); end;
  begin perform public.nauka_zdjecie_zwroc('00000000-0000-0000-0000-000000003903', 1); perform test.chk('Z4 student nie woła nauka_zdjecie_zwroc', false, null);
  exception when insufficient_privilege then perform test.chk('Z4 student nie woła nauka_zdjecie_zwroc', true, null); end;
end $$;
reset role;

-- Z5 zwrot przez funkcję Edge (service_role): miejsce wraca, cudzego wpisu nie zwróci
do $$ declare nid bigint; a boolean; b boolean;
begin
  select max(id) into nid from public.nauka_zdjecia where user_id = '00000000-0000-0000-0000-000000003903';
  set local role service_role;
  b := public.nauka_zdjecie_zwroc('00000000-0000-0000-0000-000000003904', nid);
  a := public.nauka_zdjecie_zwroc('00000000-0000-0000-0000-000000003903', nid);
  reset role;
  perform test.chk('Z5 zwrot: własny tak, cudzy nie', a and not b, jsonb_build_array(a, b));
end $$;
select test.jako('bob39@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_zdjecie_bierz(5, null);
begin perform test.chk('Z5 po zwrocie jedno miejsce wolne', (r->>'ok')::boolean and (r->>'uzyte')::int = 5, r); end $$;
reset role;

-- Z6 drugie konto ma własny licznik; wpis ma rocznik, a nie ma treści zadania ani zdjęcia (D8)
select test.jako('cyr39@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_zdjecie_bierz(5, 'wefiz-bm-1-st-2026');
begin perform test.chk('Z6 cyr: własny licznik od 1', (r->>'ok')::boolean and (r->>'uzyte')::int = 1, r); end $$;
reset role;
select test.chk('Z6 tabela ma tylko id, user_id, dzien, rocznik_id, at',
  (select array_agg(column_name::text order by column_name) from information_schema.columns where table_schema = 'public' and table_name = 'nauka_zdjecia')
    = array['at', 'dzien', 'id', 'rocznik_id', 'user_id'],
  (select jsonb_agg(column_name) from information_schema.columns where table_schema = 'public' and table_name = 'nauka_zdjecia'));
select test.chk('Z6 rocznik zapisany', (select rocznik_id from public.nauka_zdjecia where user_id = '00000000-0000-0000-0000-000000003904') = 'wefiz-bm-1-st-2026', null);

-- Z7 starosta bez limitu
select test.jako('adm39@x.pl'); set role authenticated;
do $$ declare r jsonb; ok int := 0;
begin
  for i in 1..7 loop r := public.nauka_zdjecie_bierz(5, null); if (r->>'ok')::boolean then ok := ok + 1; end if; end loop;
  perform test.chk('Z7 starosta: 7 z 7 mimo limitu 5', ok = 7 and (r->>'admin')::boolean, jsonb_build_array(ok, r));
end $$;
reset role;

-- Z8 wpisy starsze niż 90 dni znikają przy następnym pobraniu; wczorajsze nie liczą się do dzisiejszego limitu
update public.nauka_zdjecia set dzien = dzien - 100 where user_id = '00000000-0000-0000-0000-000000003903' and id in (select id from public.nauka_zdjecia where user_id = '00000000-0000-0000-0000-000000003903' limit 2);
update public.nauka_zdjecia set dzien = dzien - 1 where user_id = '00000000-0000-0000-0000-000000003903' and dzien = (now() at time zone 'Europe/Warsaw')::date;
select test.jako('bob39@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_zdjecie_bierz(5, null);
begin perform test.chk('Z8 nowy dzień: licznik od 1', (r->>'ok')::boolean and (r->>'uzyte')::int = 1, r); end $$;
reset role;
select test.chk('Z8 stare (> 90 dni) skasowane, wczorajsze zostają',
  (select count(*) from public.nauka_zdjecia where user_id = '00000000-0000-0000-0000-000000003903' and dzien < (now() at time zone 'Europe/Warsaw')::date - 90) = 0
  and (select count(*) from public.nauka_zdjecia where user_id = '00000000-0000-0000-0000-000000003903') = 4, null);
