-- Testy dla skrot-v46-roczniki-plan-ranking.sql (po test/v45.sql i dwóch uruchomieniach v46).
-- Etap 5 (plan): P1–P5. Etap 6 (ranking, Hasło dnia): niżej.
reset role;
-- P1: adresy planów: BM bez zmian, inne roczniki plan/<id>.json (także dopisany po v46)
insert into public.nauka_roczniki (id, kierunek_id, nabor, status) values ('wefiz-test-1-st-2027', 'wefiz-test-1-st', 2027, 'plan') on conflict do nothing;
do $$ begin
  perform test.chk('P1 BM: plan.json', (select plan_url from public.nauka_roczniki where id = 'wefiz-bm-1-st-2026') = 'https://plan.skrotbm.pl/plan.json', null);
  perform test.chk('P1 rocznik testowy: plan/<id>.json',
    (select plan_url from public.nauka_roczniki where id = 'wefiz-test-1-st-2026') = 'https://plan.skrotbm.pl/plan/wefiz-test-1-st-2026.json', null);
  perform test.chk('P1 nowy rocznik dostaje adres sam',
    (select plan_url from public.nauka_roczniki where id = 'wefiz-test-1-st-2027') = 'https://plan.skrotbm.pl/plan/wefiz-test-1-st-2027.json', null);
  begin
    update public.nauka_roczniki set plan_url = 'https://zly.example.com/plan.json' where id = 'wefiz-test-1-st-2027';
    perform test.chk('P2 adres spoza plan.skrotbm.pl zatrzymany', false, null);
  exception when check_violation then perform test.chk('P2 adres spoza plan.skrotbm.pl zatrzymany', true, null); end;
end $$;
delete from public.nauka_roczniki where id = 'wefiz-test-1-st-2027';
-- P3: lista roczników z adresem planu i sekcją DOS wydziału (bez danych osób)
set role anon;
do $$ declare l jsonb := public.nauka_roczniki_lista(); bm jsonb; begin
  select x into bm from jsonb_array_elements(l) x where x->>'id' = 'wefiz-bm-1-st-2026';
  perform test.chk('P3 lista: plan_url i dos_url', bm->>'plan_url' = 'https://plan.skrotbm.pl/plan.json'
    and bm->'wydzial'->>'dos_url' = 'https://dos.usz.edu.pl/cukrowa/zajecia-cukrowa/' and l::text not like '%@%', bm);
end $$;
reset role;
-- P4/P5: kalendarz: plan rocznika właściciela linku; BM jak dotąd + plan.json
insert into public.nauka_kalendarz (user_id, email, token) values ('00000000-0000-0000-0000-000000004502', 'k45@x.pl', 'tok-v46-test')
on conflict (user_id) do update set token = excluded.token;
do $$ declare t jsonb := public.nauka_kalendarz_dane('tok-v46-test'); b jsonb := public.nauka_kalendarz_dane('tok-v44-bm'); begin
  perform test.chk('P4 kalendarz rocznika testowego: jego plan', t->>'plan_url' = 'https://plan.skrotbm.pl/plan/wefiz-test-1-st-2026.json', t);
  perform test.chk('P5 kalendarz BM: plan.json i dane jak dotąd', b->>'plan_url' = 'https://plan.skrotbm.pl/plan.json' and (b->>'platny')::boolean and b->>'grupa' = 'C111', b);
end $$;
