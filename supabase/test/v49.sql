-- Testy R1–R8 dla skrot-v49-roczniki-dane.sql (po test/v48.sql): rocznik dodawany przyciskiem administratora, bez migracji.
-- Osoby: adm49 (administrator), ala49 (zwykłe konto). Rocznik próbny: Logistyka 1. st. 2026 (kierunek jest z listy v34).
reset role;
insert into auth.users (id, email, created_at) values
  ('00000000-0000-0000-0000-000000004901', 'adm49@x.pl', now()),
  ('00000000-0000-0000-0000-000000004902', 'ala49@x.pl', now())
on conflict do nothing;
insert into public.nauka_admini (email) values ('adm49@x.pl') on conflict do nothing;
create or replace function test.log49(p_status text default 'plan') returns jsonb language sql as $$
  select jsonb_build_object('id', 'wefiz-log-1-st-2026', 'kierunek_id', 'wefiz-log-1-st', 'nabor', 2026, 'status', p_status,
    'kierunek', jsonb_build_object('kod', 'LOG', 'pl', 'Logistyka', 'en', 'Logistics', 'stopien', 1, 'tryb', 'st', 'jezyk', 'pl'),
    'wydzial', jsonb_build_object('kod', 'WEFiZ'))
$$;
grant execute on function test.log49(text) to anon, authenticated;

-- R1: bez logowania funkcji nie da się wywołać
set role anon;
do $$ begin
  begin perform public.nauka_admin_rocznik_zapisz(test.log49()); perform test.chk('R1 anon nie woła nauka_admin_rocznik_zapisz', false, null);
  exception when insufficient_privilege then perform test.chk('R1 anon nie woła nauka_admin_rocznik_zapisz', true, null); end;
  begin perform public.nauka_admin_rocznik_status('wefiz-bm-1-st-2026', 'plan'); perform test.chk('R1 anon nie woła nauka_admin_rocznik_status', false, null);
  exception when insufficient_privilege then perform test.chk('R1 anon nie woła nauka_admin_rocznik_status', true, null); end;
end $$;
reset role;

-- R2: zwykłe konto dostaje not_admin i nic się nie zapisuje
select test.jako('ala49@x.pl'); set role authenticated;
do $$ begin
  perform test.chk('R2 nie-admin: zapis i status → not_admin',
    public.nauka_admin_rocznik_zapisz(test.log49())->>'code' = 'not_admin'
    and public.nauka_admin_rocznik_status('wefiz-zarz-1-st-2026', 'platny')->>'code' = 'not_admin', null);
end $$;
reset role;
do $$ begin
  perform test.chk('R2 po próbie nie-admina rocznika nie ma, Zarządzanie dalej oczekujacy',
    not exists (select 1 from public.nauka_roczniki where id = 'wefiz-log-1-st-2026')
    and (select status from public.nauka_roczniki where id = 'wefiz-zarz-1-st-2026') = 'oczekujacy', null);
end $$;

-- R3: administrator dodaje rocznik; adres planu wpisuje wyzwalacz v46; kierunek dostaje nazwę EN
select test.jako('adm49@x.pl'); set role authenticated;
do $$ declare x jsonb; begin
  x := public.nauka_admin_rocznik_zapisz(test.log49());
  perform test.chk('R3 nowy rocznik: ok, plan, adres planu, nowy',
    (x->>'ok')::boolean and x->>'status' = 'plan' and (x->>'nowy')::boolean
    and x->>'plan_url' = 'https://plan.skrotbm.pl/plan/wefiz-log-1-st-2026.json', x);
end $$;
reset role;
do $$ begin
  perform test.chk('R3 kierunek Logistyka: nazwa EN i język pl',
    (select nazwa_en = 'Logistics' and jezyk = 'pl' from public.nauka_kierunki where id = 'wefiz-log-1-st'), null);
end $$;

-- R4: ponowne kliknięcie nic nie psuje; status z danych tylko w górę
select test.jako('adm49@x.pl'); set role authenticated;
do $$ declare a jsonb; b jsonb; c jsonb; begin
  a := public.nauka_admin_rocznik_zapisz(test.log49());
  b := public.nauka_admin_rocznik_zapisz(test.log49('oczekujacy'));
  c := public.nauka_admin_rocznik_zapisz(test.log49('plan'));
  perform test.chk('R4 drugi raz bez zmian, potem w górę (oczekujacy), w dół nie',
    not (a->>'nowy')::boolean and a->>'status' = 'plan' and b->>'status' = 'oczekujacy' and c->>'status' = 'oczekujacy', jsonb_build_array(a, b, c));
end $$;

-- R5: złe dane zatrzymane, zanim cokolwiek się zapisze
do $$ begin
  perform test.chk('R5 id niezgodne z kierunkiem / naborem → id',
    public.nauka_admin_rocznik_zapisz(test.log49() || '{"nabor": 2027}')->>'code' = 'id'
    and public.nauka_admin_rocznik_zapisz(test.log49() || '{"id": "Zly id"}')->>'code' = 'id'
    and public.nauka_admin_rocznik_zapisz(jsonb_set(test.log49(), '{kierunek,kod}', '"LOGI"'))->>'code' = 'id', null);
  perform test.chk('R5 nieznany wydział → wydzial; zły status → status; zły kierunek → kierunek; brak danych → dane',
    public.nauka_admin_rocznik_zapisz(jsonb_build_object('id', 'wnex-log-1-st-2026', 'kierunek_id', 'wnex-log-1-st', 'nabor', 2026,
      'kierunek', test.log49()->'kierunek', 'wydzial', jsonb_build_object('kod', 'WNEX')))->>'code' = 'wydzial'
    and public.nauka_admin_rocznik_zapisz(test.log49('darmowy'))->>'code' = 'status'
    and public.nauka_admin_rocznik_zapisz(jsonb_set(test.log49(), '{kierunek,pl}', '""'))->>'code' = 'kierunek'
    and public.nauka_admin_rocznik_zapisz('[]'::jsonb)->>'code' = 'dane'
    and public.nauka_admin_rocznik_zapisz(test.log49() || '{"nabor": "dwa"}')->>'code' = 'dane', null);
end $$;
reset role;
do $$ begin
  perform test.chk('R5 po złych danych nie ma roczników wnex ani 2027',
    not exists (select 1 from public.nauka_roczniki where id in ('wnex-log-1-st-2026', 'wefiz-log-1-st-2027')), null);
end $$;

-- R6: świadoma zmiana statusu w obie strony; BM zostaje płatny; nieznany rocznik → brak
select test.jako('adm49@x.pl'); set role authenticated;
do $$ declare a jsonb; b jsonb; begin
  a := public.nauka_admin_rocznik_status('wefiz-log-1-st-2026', 'platny');
  perform test.chk('R6 start sprzedaży: platny i do kupienia',
    (a->>'ok')::boolean and a->>'byl' = 'oczekujacy' and public.nauka_rocznik_do_kupienia('wefiz-log-1-st-2026'), a);
  b := public.nauka_admin_rocznik_status('wefiz-log-1-st-2026', 'oczekujacy');
  perform test.chk('R6 cofnięcie: oczekujacy i nie do kupienia', (b->>'ok')::boolean and not public.nauka_rocznik_do_kupienia('wefiz-log-1-st-2026'), b);
  perform test.chk('R6 BM nie da się wyłączyć, nieznany rocznik, zły status',
    public.nauka_admin_rocznik_status('wefiz-bm-1-st-2026', 'plan')->>'code' = 'status'
    and public.nauka_admin_rocznik_status('wefiz-nie-1-st-2026', 'plan')->>'code' = 'brak'
    and public.nauka_admin_rocznik_status('wefiz-log-1-st-2026', 'x')->>'code' = 'status', null);
end $$;
reset role;

-- R7: lista roczników (też bez logowania) pokazuje nowy rocznik z planem i sekcją DOS wydziału
set role anon;
do $$ declare x jsonb; begin
  select e into x from jsonb_array_elements(public.nauka_roczniki_lista()) e where e->>'id' = 'wefiz-log-1-st-2026';
  perform test.chk('R7 lista roczników: Logistyka, oczekujacy, plan, DOS',
    x->>'status' = 'oczekujacy' and x->'kierunek'->>'en' = 'Logistics' and x->>'plan_url' like 'https://plan.skrotbm.pl/plan/%'
    and coalesce(x->'wydzial'->>'dos_url', '') <> '', x);
end $$;
reset role;

-- R8: BM i roczniki z v47/v48 bez zmian
do $$ begin
  perform test.chk('R8 BM platny, Zarządzanie i FiR oczekujacy, adresy planów jak były',
    (select status = 'platny' and plan_url = 'https://plan.skrotbm.pl/plan.json' from public.nauka_roczniki where id = 'wefiz-bm-1-st-2026')
    and (select count(*) = 2 from public.nauka_roczniki where id in ('wefiz-zarz-1-st-2026', 'wefiz-fir-1-st-2026') and status = 'oczekujacy'), null);
end $$;
