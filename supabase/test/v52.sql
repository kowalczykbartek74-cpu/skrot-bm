-- Testy R1–R5 dla skrot-v52-proba-rocznik.sql (próba tylko dla rocznika „platny”; BM bez zmian). Po test/v51.sql.
reset role;
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000005201', 'r52a@x.pl'), ('00000000-0000-0000-0000-000000005202', 'r52b@x.pl'), ('00000000-0000-0000-0000-000000005203', 'r52c@x.pl')
on conflict do nothing;
insert into public.nauka_profil (user_id, rocznik_id) values ('00000000-0000-0000-0000-000000005201', 'wefiz-test-1-st-2026'), ('00000000-0000-0000-0000-000000005203', 'wefiz-test-1-st-2026')
on conflict (user_id) do update set rocznik_id = excluded.rocznik_id;
update public.nauka_roczniki set status = 'oczekujacy' where id = 'wefiz-test-1-st-2026';

-- R1: kierunek „oczekujacy” → błąd „rocznik”, nic nie zapisane (próba czeka)
select test.jako('r52a@x.pl'); set role authenticated;
do $$ declare e text; begin
  begin perform public.nauka_proba_start(); e := null; exception when others then e := sqlerrm; end;
  perform test.chk('R1 rocznik oczekujacy: start próby odrzucony (rocznik)', e = 'rocznik', to_jsonb(e));
  perform test.chk('R1 nauka_ja: proba_mozna dalej true (próba czeka na start kierunku)', (public.nauka_ja()->>'proba_mozna')::boolean, public.nauka_ja());
end $$;
reset role;
select test.chk('R1 brak wiersza w nauka_proby po odrzuceniu', not exists (select 1 from public.nauka_proby where email = 'r52a@x.pl'), null);

-- R2: BM (bez profilu = nauka_bm()) jak dotąd: próba startuje
select test.jako('r52b@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_proba_start(); begin
  perform test.chk('R2 BM: próba startuje (do_kiedy za 3 dni)', (r->>'do_kiedy')::timestamptz between now() + interval '71 hours' and now() + interval '73 hours', r);
end $$;
reset role;

-- R3: kierunek rusza (status platny) → ta sama osoba włącza próbę
update public.nauka_roczniki set status = 'platny' where id = 'wefiz-test-1-st-2026';
select test.jako('r52a@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_proba_start(); begin
  perform test.chk('R3 po starcie kierunku: próba startuje', r ? 'do_kiedy', r);
end $$;

-- R4: kolejność błędów jak w v16: drugi start → wykorzystany (nie „rocznik”)
do $$ declare e text; begin
  begin perform public.nauka_proba_start(); exception when others then e := sqlerrm; end;
  perform test.chk('R4 drugi start → wykorzystany', e = 'wykorzystany', to_jsonb(e));
end $$;
reset role;

-- R5: kierunek wraca do „oczekujacy”: osoba z wcześniejszym dostępem dostaje „ma_dostep”, nie „rocznik” (kolejność sprawdzeń)
update public.nauka_roczniki set status = 'oczekujacy' where id = 'wefiz-test-1-st-2026';
insert into public.nauka_dostep (email, do_kiedy, zrodlo, user_id, rocznik_id) values ('r52c@x.pl', current_date + 30, 'stripe', '00000000-0000-0000-0000-000000005203', 'wefiz-test-1-st-2026')
on conflict (email, rocznik_id) do update set do_kiedy = excluded.do_kiedy;
select test.jako('r52c@x.pl'); set role authenticated;
do $$ declare e text; begin
  begin perform public.nauka_proba_start(); exception when others then e := sqlerrm; end;
  perform test.chk('R5 opłacony dostęp przy kierunku oczekujacy → ma_dostep', e = 'ma_dostep', to_jsonb(e));
end $$;
reset role;
update public.nauka_roczniki set status = 'platny' where id = 'wefiz-test-1-st-2026';
delete from public.nauka_dostep where email = 'r52c@x.pl';
delete from public.nauka_proby where email in ('r52a@x.pl', 'r52b@x.pl', 'r52c@x.pl');
delete from public.nauka_profil where user_id in ('00000000-0000-0000-0000-000000005201', '00000000-0000-0000-0000-000000005203');
