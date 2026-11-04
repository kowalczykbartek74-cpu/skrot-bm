-- Testy P1–P11 dla skrot-v30-profil.sql (Profil nauki; na gałęzi L7 był to v22). Uruchamiaj po test/v18.sql.
reset role;
insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000000221', 'ucz22@x.pl'), ('00000000-0000-0000-0000-000000000222', 'inny22@x.pl');
select test.jako('ucz22@x.pl'); set role authenticated;
do $$ declare r jsonb; b jsonb := jsonb_build_array(
    jsonb_build_object('id', '11111111-1111-4111-8111-111111111111', 'typ', 'review_graded', 'kiedy', now(), 'dane', jsonb_build_object('cardId', 'm1:abc', 'rating', 3, 'elapsedDays', 0)),
    jsonb_build_object('id', '11111111-1111-4111-8111-111111111112', 'typ', 'session_ended', 'kiedy', now(), 'dane', jsonb_build_object('activeMs', 600000)),
    jsonb_build_object('id', '11111111-1111-4111-8111-111111111113', 'typ', 'klawisze', 'kiedy', now(), 'dane', '{}'::jsonb),
    jsonb_build_object('id', '11111111-1111-4111-8111-111111111114', 'typ', 'exit_ticket', 'kiedy', '2020-01-01T00:00:00Z', 'dane', jsonb_build_object('score', 2, 'max', 3)));
begin
  r := public.nauka_zdarzenia_zapisz(b);
  perform test.chk('P1 zapis paczki: 3 znane typy, nieznany odrzucony', r->>'n' = '3', r);
  r := public.nauka_zdarzenia_zapisz(b);
  perform test.chk('P2 ta sama paczka drugi raz: 0 (duplikaty)', r->>'n' = '0', r);
  perform test.chk('P3 za duża paczka odrzucona', public.nauka_zdarzenia_zapisz((select jsonb_agg(x) from generate_series(1, 101) x))->>'code' = 'bad_batch', null);
end $$;
do $$ begin
  perform test.chk('P4 przeglądarka nie czyta tabeli zdarzeń', (select count(*) from public.nauka_zdarzenia) = 0, null);
exception when insufficient_privilege then perform test.chk('P4 przeglądarka nie czyta tabeli zdarzeń', true, null);
end $$;
reset role;
do $$ begin
  perform test.chk('P5 zły zegar przycięty do 48 h i oznaczony',
    (select przesuniety_zegar and kiedy > now() - interval '49 hours' from public.nauka_zdarzenia where klient_id = '11111111-1111-4111-8111-111111111114'), null);
end $$;
select test.jako('ucz22@x.pl'); set role authenticated;
do $$ declare r jsonb;
begin
  perform test.chk('P6 test bez liczby ze stresu: zapisany',
    public.nauka_profil_nauki_test('{"bedtime": 1380, "stressHigh": false}', '{"stabilityMultiplier": {"value": 1.1, "source": "test"}}', '{}')->>'ok' = 'true', null);
  perform test.chk('P7 liczba ze stresu odrzucona', public.nauka_profil_nauki_test('{"stress": 5}', '{}', '{}')->>'code' = 'bad_input', null);
  r := public.nauka_profil_nauki();
  perform test.chk('P8 profil: deklaracje, startowe, włączone', (r->'profil'->'deklaracje'->>'bedtime') = '1380' and (r->'profil'->>'wlaczone') = 'true'
    and (r->'profil'->'startowe'->'stabilityMultiplier'->>'value') = '1.1', r);
  perform public.nauka_profil_nauki_wlacz(false);
  r := public.nauka_zdarzenia_zapisz(jsonb_build_array(
    jsonb_build_object('id', '22222222-2222-4222-8222-222222222221', 'typ', 'session_started', 'kiedy', now(), 'dane', '{}'::jsonb),
    jsonb_build_object('id', '22222222-2222-4222-8222-222222222222', 'typ', 'review_graded', 'kiedy', now(), 'dane', '{}'::jsonb),
    jsonb_build_object('id', '22222222-2222-4222-8222-222222222223', 'typ', 'activity', 'kiedy', now(), 'dane', '{"kind": "quiz", "ok": 3, "total": 5}'::jsonb)));
  perform test.chk('P9 wyłączone: tylko zdarzenia potrzebne do działania (ocena fiszki i aktywność)', r->>'n' = '2', r);
  perform public.nauka_profil_nauki_wlacz(true);
  r := public.nauka_zdarzenia_usun();
  perform test.chk('P10 usunięcie danych o aktywności', (r->>'n')::int = 5, r);
end $$;
reset role; select test.jako('inny22@x.pl'); set role authenticated;
do $$ begin
  perform test.chk('P11 inna osoba nie widzi cudzego profilu', public.nauka_profil_nauki()->'profil' = 'null'::jsonb, public.nauka_profil_nauki());
end $$;
reset role;
do $$ begin raise notice 'WSZYSTKIE TESTY v30 OK'; end $$;
