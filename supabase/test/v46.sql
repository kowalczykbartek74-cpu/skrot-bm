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

-- ================= Etap 6: ranking i statystyki po roczniku =================
-- R1: dla BM i admina wszystko jak przed v46
do $$ declare r record; w jsonb; begin
  for r in select * from test.v46_przed order by email, co loop
    perform test.jako(r.email); set local role authenticated;
    w := case r.co when 'ranking-tydzien' then public.nauka_ranking('tydzien') when 'ranking-semestr' then public.nauka_ranking('semestr')
                   when 'ranking-grupa' then public.nauka_ranking('semestr', 'C111') when 'wyglad' then public.nauka_wyglad(array['Ania', 'Bartek', 'Ola'])
                   when 'stat' then public.nauka_kierunek_stat() when 'rekordy' then public.nauka_rekordy('frun') else public.nauka_haslo_dzis() end;
    reset role;
    perform test.chk('R1 ' || r.email || ' ' || r.co || ' jak przed v46', w = r.wynik, jsonb_build_object('przed', r.wynik, 'po', w));
  end loop;
end $$;

-- Rocznik testowy (ten sam kod kierunku BM, inny wydział): 6 osób z dostępem, pseudonimami i punktami z przedmiotu „makro”
do $$ declare i int; u uuid; begin
  for i in 1..6 loop
    u := ('00000000-0000-0000-0000-0000000046' || lpad(i::text, 2, '0'))::uuid;
    insert into auth.users (id, email) values (u, 'r46-' || i || '@x.pl') on conflict do nothing;
    insert into public.nauka_dostep (email, do_kiedy, user_id, rocznik_id) values ('r46-' || i || '@x.pl', current_date + 100, u, 'wefiz-test-1-st-2026') on conflict do nothing;
    insert into public.nauka_urzadzenia (user_id, device_id, nazwa) values (u, '11111111-1111-1111-1111-' || right(u::text, 12), 'test') on conflict do nothing;
    insert into public.nauka_profil (user_id, kierunek, rocznik, rocznik_id, nick, w_rankingu)
    values (u, 'BM', 2026, 'wefiz-test-1-st-2026', 'Test' || i, true) on conflict (user_id) do update set rocznik_id = excluded.rocznik_id, nick = excluded.nick, w_rankingu = true;
    perform public.nauka_rp_dodaj(u, 'quiz', 'q:r46:' || i, 'makro', 10 * i);
    insert into public.nauka_odp (user_id, mid, idx, sid, rodzaj, ok, zrodlo) select u, 'tm1', j::text, 'makro', 'abcd', j % 2 = 0, 'quiz' from generate_series(0, 11) j;
  end loop;
end $$;
-- R2: BM nie widzi rocznika testowego, rocznik testowy nie widzi BM (ranking, statystyki, wygląd, rekordy)
select test.jako('a@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_ranking('semestr'); s jsonb := public.nauka_kierunek_stat(); begin
  perform test.chk('R2 ranking BM bez osób z rocznika testowego', not exists (select 1 from jsonb_array_elements(r->'top') x where x->>'nick' like 'Test%'), r);
  perform test.chk('R2 statystyki BM bez odpowiedzi rocznika testowego (ten sam przedmiot makro)',
    s = (select wynik from test.v46_przed where email = 'a@x.pl' and co = 'stat'), s);
  perform test.chk('R2 wygląd: pseudonim z innego rocznika niewidoczny', not (public.nauka_wyglad(array['Test1'])->'osoby' ? 'Test1'), null);
end $$;
reset role;
select test.jako('r46-1@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_ranking('semestr'); s jsonb := public.nauka_kierunek_stat(); begin
  perform test.chk('R2 ranking testowy: tylko 6 osób z rocznika testowego', (r->>'n')::int = 6
    and not exists (select 1 from jsonb_array_elements(r->'top') x where x->>'nick' not like 'Test%') and (r->'top'->0->>'nick') = 'Test6', r);
  perform test.chk('R2 statystyki testowe: aktywni i przedmiot makro tylko z rocznika testowego (od 5 osób)',
    (s->>'aktywni')::int = 6 and exists (select 1 from jsonb_array_elements(s->'przedmioty') x where x->>'sid' = 'makro' and (x->>'osob')::int = 6), s);
  perform test.chk('R2 wygląd: swój rocznik widoczny', public.nauka_wyglad(array['Test2'])->'osoby' ? 'Test2', null);
end $$;
reset role;
-- R3: pseudonim unikalny w roczniku, nie w kodzie kierunku
update public.nauka_profil set nick = 'Wspolny' where user_id = '00000000-0000-0000-0000-000000000001';
select test.jako('r46-2@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_profil_ustaw('Wspolny'); begin
  perform test.chk('R3 ten sam pseudonim w innym roczniku → ok', (r->>'ok')::boolean and r->>'nick' = 'Wspolny', r);
end $$;
reset role;
select test.jako('r46-3@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_profil_ustaw('wspolny'); begin
  perform test.chk('R3 ten sam pseudonim w tym samym roczniku → nick_zajety', r->>'code' = 'nick_zajety', r);
end $$;
reset role;
-- R4: Hasło dnia per rocznik: słowo z materiałów rocznika testowego, osobne od słowa BM
insert into public.nauka_docs (kolekcja, id, data, rocznik_id) values
  ('materials', 'th46', '{"subjectId":"makro","title":"Hasło testowe"}', 'wefiz-test-1-st-2026'),
  ('materialContent', 'th46', '{"concepts":[{"term":"Kartel","definition":"Porozumienie firm.","pl":"kartel"}]}', 'wefiz-test-1-st-2026');
select test.jako('r46-4@x.pl'); set role authenticated;
do $$ declare h jsonb := public.nauka_haslo_dzis(); begin
  perform test.chk('R4 Hasło rocznika testowego: słowo z jego materiału', (h->>'ok')::boolean and (h->>'dlugosc')::int = 6 and h->>'sid' = 'makro', h);
end $$;
reset role;
do $$ begin
  perform test.chk('R4 dwa słowa na dziś: BM i testowe', (select count(*) from public.nauka_haslo_dni where dzien = public.nauka_dzis()) = 2
    and (select slowo from public.nauka_haslo_dni where dzien = public.nauka_dzis() and rocznik_id = 'wefiz-test-1-st-2026') = 'KARTEL', null);
  raise notice 'WSZYSTKIE testy v46 OK';
end $$;
