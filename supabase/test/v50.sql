-- Testy Z1–Z4 dla skrot-v50-plan-zdawalni.sql (po test/v49.sql): plan zajęć na plan.zdawalni.pl.
reset role;
do $$
declare n int;
begin
  perform test.chk('Z1 BM: plan.json na plan.zdawalni.pl',
    (select plan_url from public.nauka_roczniki where id = 'wefiz-bm-1-st-2026') = 'https://plan.zdawalni.pl/plan.json', null);
  select count(*) into n from public.nauka_roczniki where plan_url like 'https://plan.skrotbm.pl/%';
  perform test.chk('Z2 żaden rocznik nie został na plan.skrotbm.pl', n = 0, to_jsonb(n));
  insert into public.nauka_roczniki (id, kierunek_id, nabor, status) values ('wefiz-bm-1-st-2030', 'wefiz-bm-1-st', 2030, 'plan');
  perform test.chk('Z3 nowy rocznik: adres na plan.zdawalni.pl',
    (select plan_url from public.nauka_roczniki where id = 'wefiz-bm-1-st-2030') = 'https://plan.zdawalni.pl/plan/wefiz-bm-1-st-2030.json', null);
  update public.nauka_roczniki set plan_url = 'https://plan.skrotbm.pl/plan/wefiz-bm-1-st-2030.json' where id = 'wefiz-bm-1-st-2030';
  begin
    update public.nauka_roczniki set plan_url = 'https://zly.example.com/plan.json' where id = 'wefiz-bm-1-st-2030';
    perform test.chk('Z4 stary host dozwolony, obcy zatrzymany', false, null);
  exception when check_violation then perform test.chk('Z4 stary host dozwolony, obcy zatrzymany', true, null); end;
  delete from public.nauka_roczniki where id = 'wefiz-bm-1-st-2030';
end $$;
