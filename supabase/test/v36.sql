-- Testy P1–P12 dla skrot-v36-przypomnienia.sql (po test/v35.sql). PGlite nie ma pg_cron, pg_net ani Vault: sprawdzamy funkcje.
-- Konto testowe: kolokwium za 3 dni (termin starosty), godzina 18:00, „teraz” = 5.11.2026 18:05 w Warszawie.
reset role;
grant execute on function test.chk(text, boolean, jsonb) to anon, authenticated, service_role;
-- Na Supabase service_role ma dostęp do tabel public z domyślnych uprawnień; w PGlite nadajemy go tu (tylko do sprawdzeń).
grant select on public.nauka_przypomnienia, public.nauka_przypomnienia_log to service_role;
alter role service_role bypassrls; -- jak na Supabase
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000003601', 'przyp1@x.pl'),
  ('00000000-0000-0000-0000-000000003602', 'przyp2@x.pl'),
  ('00000000-0000-0000-0000-000000003603', 'przyp3@x.pl') on conflict do nothing;
insert into public.nauka_docs (kolekcja, id, data) values ('deadlines', 'dl-v36-kol', '{"date":"2026-11-08","type":"kolokwium","title":"Kolokwium z mikro","subjectId":"mikro"}')
on conflict (kolekcja, id) do update set data = excluded.data;

-- P1: anon nic nie widzi i nie woła; zalogowany nie woła funkcji serwera
set role anon;
do $$ begin
  begin perform count(*) from public.nauka_przypomnienia; perform test.chk('P1 anon nie czyta ustawień', false, null);
  exception when insufficient_privilege then perform test.chk('P1 anon nie czyta ustawień', true, null); end;
  begin perform public.nauka_przypomnienia_ustaw('{}'); perform test.chk('P1 anon nie zapisuje ustawień', false, null);
  exception when insufficient_privilege then perform test.chk('P1 anon nie zapisuje ustawień', true, null); end;
  begin perform public.nauka_przypomnienia_wypisz('a'); perform test.chk('P1 anon nie woła wypisania wprost', false, null);
  exception when insufficient_privilege then perform test.chk('P1 anon nie woła wypisania wprost', true, null); end;
end $$;
reset role;

set role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000003601","role":"authenticated"}', false);
do $$ declare r jsonb; begin
  begin perform public.nauka_przypomnienia_kandydaci(); perform test.chk('P1 zalogowany nie widzi kandydatów', false, null);
  exception when insufficient_privilege then perform test.chk('P1 zalogowany nie widzi kandydatów', true, null); end;
  begin perform count(*) from public.nauka_przypomnienia_log; perform test.chk('P1 zalogowany nie czyta logu wprost', false, null);
  exception when insufficient_privilege then perform test.chk('P1 zalogowany nie czyta logu wprost', true, null); end;
  -- P2: domyślnie wyłączone, 18:00 (D6); stan przy wyłączonych się nie zapisuje
  r := public.nauka_przypomnienia_moje();
  perform test.chk('P2 domyślnie wyłączone o 18:00', r->>'wlaczone' = 'false' and (r->>'godz')::int = 1080 and (r->'co'->>'terminy')::boolean, r);
  r := public.nauka_przypomnienia_stan('{"v":1,"od":"2026-11-05","ter":[],"pow":[],"rew":[]}');
  perform test.chk('P2 stan bez włączenia → off', r->>'code' = 'off', r);
  -- P3: złe dane odrzucone
  r := public.nauka_przypomnienia_ustaw('{"godz": 1085}');
  perform test.chk('P3 godzina spoza kroku 30 min → bad_input', r->>'code' = 'bad_input', r);
  r := public.nauka_przypomnienia_ustaw('{"godz": 120}');
  perform test.chk('P3 godzina w nocy → bad_input', r->>'code' = 'bad_input', r);
  r := public.nauka_przypomnienia_stan('{"od":"zly"}');
  perform test.chk('P3 zły stan → bad_input', r->>'code' = 'bad_input', r);
  -- P4: włączenie + stan z kolokwium za 3 dni (termin starosty dl-v36-kol, w stanie jeszcze stara data 7.11)
  r := public.nauka_przypomnienia_ustaw('{"wlaczone": true, "godz": 1080, "co": {"terminy": true, "powtorki": true, "zadanie": false}, "jezyk": "pl"}');
  perform test.chk('P4 włączone', r->>'wlaczone' = 'true' and (r->'co'->>'zadanie')::boolean = false, r);
  r := public.nauka_przypomnienia_stan('{"v":1,"od":"2026-11-05","ter":[{"d":"2026-11-07","n":"Mikroekonomia","r":"K","dl":"dl-v36-kol","sid":"mikro"}],"pow":[3,3,4,4,4,4,4,4],"rew":[1,1,1,1,1,1,1,1],"zad":false}');
  perform test.chk('P4 stan zapisany', (r->>'ok')::boolean, r);
end $$;
reset role;

-- Druga osoba: włączone o 18:00, ale dziś już się uczyła (zdarzenie nauki); trzecia: zablokowane konto
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000003602","role":"authenticated"}', false);
do $$ begin perform public.nauka_przypomnienia_ustaw('{"wlaczone": true}'); end $$;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000003603","role":"authenticated"}', false);
do $$ begin perform public.nauka_przypomnienia_ustaw('{"wlaczone": true, "godz": 1080}'); end $$;
reset role;
insert into public.nauka_zdarzenia (user_id, klient_id, typ, kiedy, dane)
values ('00000000-0000-0000-0000-000000003602', gen_random_uuid(), 'activity', '2026-11-05 09:00:00+01', '{"kind":"quiz"}'),
       ('00000000-0000-0000-0000-000000003601', gen_random_uuid(), 'activity', '2026-11-03 20:00:00+01', '{"kind":"quiz"}'),
       ('00000000-0000-0000-0000-000000003601', gen_random_uuid(), 'profile_test', '2026-11-05 08:00:00+01', '{}');
insert into public.nauka_konta (user_id, email, zablokowane) values ('00000000-0000-0000-0000-000000003603', 'przyp3@x.pl', true)
on conflict (user_id) do update set zablokowane = true;

set role service_role;
do $$
declare r jsonb; o jsonb; id1 uuid; id2 uuid; t timestamptz := '2026-11-05 18:05:00+01';
begin
  -- P5: przed godziną nikogo; o 18:05 osoba 1 (i 2: wybór „uczyła się dziś” robi logika, baza podaje dni nauki); zablokowana nie
  r := public.nauka_przypomnienia_kandydaci('2026-11-05 17:50:00+01');
  perform test.chk('P5 17:50 → nikt z testowych', not exists (select 1 from jsonb_array_elements(r->'osoby') x where x->>'email' like 'przyp%'), r);
  r := public.nauka_przypomnienia_kandydaci(t);
  select x into o from jsonb_array_elements(r->'osoby') x where x->>'email' = 'przyp1@x.pl';
  perform test.chk('P5 18:05 → osoba 1 z tokenem, stanem i dniem', o is not null and r->>'dzien' = '2026-11-05' and (r->>'minuta')::int = 1085
    and length(o->>'token') >= 20 and o->'stan'->'ter'->0->>'dl' = 'dl-v36-kol', r);
  perform test.chk('P5 zablokowane konto pominięte', not exists (select 1 from jsonb_array_elements(r->'osoby') x where x->>'email' = 'przyp3@x.pl'), r);
  -- P6: aktualna data terminu starosty (8.11, nie 7.11 ze stanu), dni nauki bez testu „Jak się uczysz?”, ostatni dzień nauki
  perform test.chk('P6 data terminu z bazy', o->'dl'->'dl-v36-kol'->>'date' = '2026-11-08' and o->'dl'->'dl-v36-kol'->>'type' = 'kolokwium', o);
  perform test.chk('P6 dni nauki: 3.11 tak, dziś (sam test profilu) nie', o->'dni_nauki' = '["2026-11-03"]'::jsonb and o->>'ostatni' = '2026-11-03', o);
  select x into o from jsonb_array_elements(r->'osoby') x where x->>'email' = 'przyp2@x.pl';
  perform test.chk('P6 osoba 2: dziś jest dniem nauki', o->'dni_nauki' ? '2026-11-05', o);
  -- P7: jeden mail dziennie: pierwszy wpis → id, drugi tego samego dnia → null; po wpisie osoba znika z kandydatów
  id1 := public.nauka_przypomnienia_log_dodaj('00000000-0000-0000-0000-000000003601', '2026-11-05', 'termin');
  id2 := public.nauka_przypomnienia_log_dodaj('00000000-0000-0000-0000-000000003601', '2026-11-05', 'powtorki');
  perform test.chk('P7 pierwszy wpis jest, drugi tego dnia nie', id1 is not null and id2 is null, jsonb_build_object('id1', id1, 'id2', id2));
  r := public.nauka_przypomnienia_kandydaci('2026-11-05 18:20:00+01');
  perform test.chk('P7 po wysłaniu osoba 1 nie jest kandydatem tego dnia', not exists (select 1 from jsonb_array_elements(r->'osoby') x where x->>'email' = 'przyp1@x.pl'), r);
  -- P8: poza oknem 60 min nikt; następnego dnia osoba 1 znów, z historią (wczoraj, nieotwarte)
  r := public.nauka_przypomnienia_kandydaci('2026-11-05 19:10:00+01');
  perform test.chk('P8 19:10 → poza oknem', not exists (select 1 from jsonb_array_elements(r->'osoby') x where x->>'email' like 'przyp%'), r);
  r := public.nauka_przypomnienia_kandydaci('2026-11-06 18:00:00+01');
  select x into o from jsonb_array_elements(r->'osoby') x where x->>'email' = 'przyp1@x.pl';
  perform test.chk('P8 następny dzień: osoba 1 z historią', o->'historia' = '[{"day":"2026-11-05","opened":false}]'::jsonb, o);
  -- P9: nieudana wysyłka → wpis usunięty (można spróbować jeszcze raz)
  id2 := public.nauka_przypomnienia_log_dodaj('00000000-0000-0000-0000-000000003602', '2026-11-05', 'zadanie');
  perform test.chk('P9 wpis przed wysyłką widoczny', exists (select 1 from public.nauka_przypomnienia_log where id = id2), null);
  perform public.nauka_przypomnienia_log_usun(id2);
  perform test.chk('P9 wpis po błędzie wysyłki usunięty', not exists (select 1 from public.nauka_przypomnienia_log where id = id2), null);
  -- P10: limit dzienny (doba UTC, jak licznik Resend) → zostalo maleje o wysłane dziś
  perform test.chk('P10 limit dnia liczy wysłane', (public.nauka_przypomnienia_kandydaci(now())->>'zostalo')::int
    = (public.nauka_przypomnienia_cfg()->>'limit_dzien')::int - (select count(*) from public.nauka_przypomnienia_log where wyslano_at >= date_trunc('day', now() at time zone 'UTC') at time zone 'UTC'), public.nauka_przypomnienia_kandydaci(now()));
end $$;
reset role;

-- P11: otwarcie z maila oznacza tylko własny wpis
select set_config('test.log36', (select id::text from public.nauka_przypomnienia_log where user_id = '00000000-0000-0000-0000-000000003601' limit 1), false);
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000003602","role":"authenticated"}', false);
do $$ declare r jsonb; begin
  r := public.nauka_przypomnienie_otwarte(current_setting('test.log36')::uuid);
  perform test.chk('P11 cudzy wpis się nie zmienia', r->>'pierwsze' = 'false', r);
end $$;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000003601","role":"authenticated"}', false);
do $$ declare r jsonb; begin
  r := public.nauka_przypomnienie_otwarte(current_setting('test.log36')::uuid);
  perform test.chk('P11 własny wpis otwarty', r->>'pierwsze' = 'true', r);
end $$;
reset role;

-- P12: wypisanie tokenem z maila wyłącza i czyści stan; zły token nic nie robi; ponowne włączenie w Ustawieniach działa
set role service_role;
do $$ declare r jsonb; tok text; begin
  r := public.nauka_przypomnienia_wypisz('zly-token-zly-token-zly');
  perform test.chk('P12 zły token → ok false', r->>'ok' = 'false', r);
  select token into tok from public.nauka_przypomnienia where user_id = '00000000-0000-0000-0000-000000003601';
  r := public.nauka_przypomnienia_wypisz(tok);
  perform test.chk('P12 wypisanie → ok', (r->>'ok')::boolean, r);
  perform test.chk('P12 wyłączone, stan wyczyszczony',
    (select not wlaczone and stan = '{}'::jsonb and wypisane_at is not null from public.nauka_przypomnienia where user_id = '00000000-0000-0000-0000-000000003601'), null);
  r := public.nauka_przypomnienia_kandydaci('2026-11-06 18:00:00+01');
  perform test.chk('P12 po wypisaniu nie jest kandydatem', not exists (select 1 from jsonb_array_elements(r->'osoby') x where x->>'email' = 'przyp1@x.pl'), r);
end $$;
reset role;
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000003601","role":"authenticated"}', false);
do $$ declare r jsonb; begin
  r := public.nauka_przypomnienia_moje();
  perform test.chk('P12 Ustawienia widzą wypisanie', (r->>'wypisane')::boolean and r->>'wlaczone' = 'false', r);
  r := public.nauka_przypomnienia_ustaw('{"wlaczone": true}');
  perform test.chk('P12 ponowne włączenie', r->>'wlaczone' = 'true' and r->>'wypisane' = 'false', r);
end $$;
reset role;
select set_config('request.jwt.claims', '', false);
do $$ begin raise notice 'OK v36: przypomnienia'; end $$;
