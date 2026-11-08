-- Testy dla skrot-v48-fir26.sql (wygenerowane przez scripts/kierunek.mjs, po dwóch uruchomieniach migracji).
reset role;
do $$ begin
  perform test.chk('K1 jeden rocznik wefiz-fir-1-st-2026 ze statusem oczekujacy',
    (select count(*) = 1 from public.nauka_roczniki where id = 'wefiz-fir-1-st-2026' and status = 'oczekujacy'), null);
  perform test.chk('K2 adres planu wpisany sam (v46)',
    (select plan_url from public.nauka_roczniki where id = 'wefiz-fir-1-st-2026') = 'https://plan.skrotbm.pl/plan/wefiz-fir-1-st-2026.json', null);
  perform test.chk('K3 kierunek z nazwą PL i EN, język zajęć pl',
    (select count(*) = 1 from public.nauka_kierunki where id = 'wefiz-fir-1-st' and nazwa_pl = 'Finanse i Rachunkowość'
       and nazwa_en is not null and jezyk = 'pl'), (select to_jsonb(x) from public.nauka_kierunki x where id = 'wefiz-fir-1-st'));
  perform test.chk('K4 BM bez zmian (platny, plan.json)',
    (select status = 'platny' and plan_url = 'https://plan.skrotbm.pl/plan.json' from public.nauka_roczniki where id = 'wefiz-bm-1-st-2026'), null);
end $$;
-- K5: lista roczników (też bez logowania) pokazuje nowy rocznik z sekcją DOS wydziału
set role anon;
do $$ declare x jsonb; begin
  select e into x from jsonb_array_elements(public.nauka_roczniki_lista()) e where e->>'id' = 'wefiz-fir-1-st-2026';
  perform test.chk('K5 lista roczników: nowy rocznik, status, plan, DOS',
    x->>'status' = 'oczekujacy' and x->>'plan_url' = 'https://plan.skrotbm.pl/plan/wefiz-fir-1-st-2026.json' and coalesce(x->'wydzial'->>'dos_url', '') <> '', x);
end $$;
reset role;
-- K6: rocznik bez statusu „platny” nie jest do kupienia (v45), więc strona pokazuje listę oczekujących
do $$ begin
  perform test.chk('K6 do kupienia tylko przy statusie platny',
    public.nauka_rocznik_do_kupienia('wefiz-fir-1-st-2026') = ('oczekujacy' = 'platny'), null);
end $$;
