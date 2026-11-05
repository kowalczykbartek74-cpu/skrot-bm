-- Testy A1–A14 dla skrot-v38-admin.sql (po test/v37.sql): karnety, źródło konta i okresu próbnego, lejek według źródła.
-- Osoby: adm38 (administrator), ala38 (bez dostępu, świeże konto), bob38 (opłacony Stripe), cyr38 (Stripe wygasł),
-- dan38 (stare konto, okres próbny z wizyty), 5 osób z plakatu (p1–p5), 6 z Instagrama (i1–i6).
reset role;
grant execute on function test.chk(text, boolean, jsonb) to anon, authenticated, service_role;
insert into auth.users (id, email, created_at)
select ('00000000-0000-0000-0000-0000000038' || lpad(i::text, 2, '0'))::uuid, e, now() - make_interval(days => d)
from (values (1,'adm38@x.pl',0),(2,'ala38@x.pl',0),(3,'bob38@x.pl',30),(4,'cyr38@x.pl',90),(5,'dan38@x.pl',10),
             (11,'p1-38@x.pl',0),(12,'p2-38@x.pl',0),(13,'p3-38@x.pl',0),(14,'p4-38@x.pl',0),(15,'p5-38@x.pl',0),
             (21,'i1-38@x.pl',0),(22,'i2-38@x.pl',0),(23,'i3-38@x.pl',0),(24,'i4-38@x.pl',0),(25,'i5-38@x.pl',0),(26,'i6-38@x.pl',0)) v(i, e, d)
on conflict do nothing;
insert into public.nauka_admini (email) values ('adm38@x.pl') on conflict do nothing;
insert into public.nauka_dostep (email, do_kiedy, zrodlo, user_id, stripe_session, plan) values
  ('bob38@x.pl', current_date + 200, 'stripe', '00000000-0000-0000-0000-000000003803', 'cs_test_bob38', 'rok'),
  ('cyr38@x.pl', current_date - 5, 'stripe-miesiac', '00000000-0000-0000-0000-000000003804', 'cs_test_cyr38', 'miesiac')
on conflict (email) do nothing;

-- A1: anon nie woła funkcji panelu; zalogowany nie-admin dostaje not_admin i nie czyta tabeli źródeł
set role anon;
do $$ begin
  begin perform public.nauka_admin_karnety(); perform test.chk('A1 anon nie woła nauka_admin_karnety', false, null);
  exception when insufficient_privilege then perform test.chk('A1 anon nie woła nauka_admin_karnety', true, null); end;
  begin perform public.nauka_zrodlo_ustaw('ig'); perform test.chk('A1 anon nie woła nauka_zrodlo_ustaw', false, null);
  exception when insufficient_privilege then perform test.chk('A1 anon nie woła nauka_zrodlo_ustaw', true, null); end;
end $$;
reset role;
select test.jako('ala38@x.pl'); set role authenticated;
do $$ begin
  perform test.chk('A1 nie-admin: wydanie, cofnięcie i lista karnetów → not_admin',
    public.nauka_admin_karnet_wydaj('ala38@x.pl', current_date + 30, null, 'sama sobie')->>'code' = 'not_admin'
    and public.nauka_admin_karnet_cofnij('bob38@x.pl')->>'code' = 'not_admin'
    and public.nauka_admin_karnety()->>'code' = 'not_admin', null);
  begin perform count(*) from public.nauka_konto_zrodlo; perform test.chk('A1 nie czyta nauka_konto_zrodlo', false, null);
  exception when insufficient_privilege then perform test.chk('A1 nie czyta nauka_konto_zrodlo', true, null); end;
  begin perform public.nauka_lejek_zrodla_dane(); perform test.chk('A1 nie woła nauka_lejek_zrodla_dane', false, null);
  exception when insufficient_privilege then perform test.chk('A1 nie woła nauka_lejek_zrodla_dane', true, null); end;
  perform test.chk('A1 ala bez dostępu przed karnetem', not public.nauka_platny_konto(), null);
end $$;
reset role;

-- A2–A7: administrator wydaje karnety
select test.jako('adm38@x.pl'); set role authenticated;
do $$ declare r jsonb; begin
  r := public.nauka_admin_karnet_wydaj(' Ala38@X.pl ', current_date + 60, 'wefiz-zarz-1-st-2026', 'Pomoc przy teście lekcji');
  perform test.chk('A2 karnet dla ali: ok, konto istnieje, nowy wiersz', (r->>'ok')::boolean and (r->>'konto')::boolean and (r->>'nowy')::boolean and r->>'email' = 'ala38@x.pl', r);
  r := public.nauka_admin_karnet_wydaj('bob38@x.pl', current_date + 365, null, 'nadpisz płatny');
  perform test.chk('A3 opłacony dostęp (Stripe, trwa): odmowa ma_dostep z datą', r->>'code' = 'ma_dostep' and (r->>'do_kiedy')::date = current_date + 200 and r->>'zrodlo' = 'stripe', r);
  r := public.nauka_admin_karnet_wydaj('cyr38@x.pl', current_date + 20, null, 'Przerwa w subskrypcji');
  perform test.chk('A4 Stripe wygasł: karnet ok (wiersz istniał)', (r->>'ok')::boolean and not (r->>'nowy')::boolean, r);
  r := public.nauka_admin_karnet_wydaj('nowy38@x.pl', current_date + 10, null, 'Zanim założy konto');
  perform test.chk('A5 karnet na e-mail bez konta: ok, konto=false', (r->>'ok')::boolean and not (r->>'konto')::boolean, r);
  -- daty od „dziś” w Polsce, jak w funkcji (current_date to UTC: między północą w PL i UTC granica wypadała o dzień obok)
  perform test.chk('A6 walidacja: e-mail, data w przeszłości, data > 400 dni, nieznany rocznik, za krótki powód',
    public.nauka_admin_karnet_wydaj('zly-email', (now() at time zone 'Europe/Warsaw')::date + 5, null, 'powód')->>'code' = 'email'
    and public.nauka_admin_karnet_wydaj('x38@x.pl', (now() at time zone 'Europe/Warsaw')::date - 1, null, 'powód')->>'code' = 'data'
    and public.nauka_admin_karnet_wydaj('x38@x.pl', (now() at time zone 'Europe/Warsaw')::date + 401, null, 'powód')->>'code' = 'data'
    and public.nauka_admin_karnet_wydaj('x38@x.pl', (now() at time zone 'Europe/Warsaw')::date + 5, 'wefiz-xx-1-st-2099', 'powód')->>'code' = 'rocznik'
    and public.nauka_admin_karnet_wydaj('x38@x.pl', (now() at time zone 'Europe/Warsaw')::date + 5, null, ' a ')->>'code' = 'powod', null);
end $$;
reset role;
do $$ begin
  perform test.chk('A3 płatny dostep boba bez zmian', (select do_kiedy = current_date + 200 and zrodlo = 'stripe' and powod is null from public.nauka_dostep where email = 'bob38@x.pl'), null);
  perform test.chk('A4 karnet cyra: zrodlo karnet, stripe_session zostaje, wydal = admin',
    (select zrodlo = 'karnet' and stripe_session = 'cs_test_cyr38' and wydal = 'adm38@x.pl' and wydano_at is not null from public.nauka_dostep where email = 'cyr38@x.pl'), null);
  perform test.chk('A4 lejek: cyr dalej liczy się jako zakup (stripe_*), ala z karnetem nie',
    (select zakup from public.nauka_lejek_konta() where user_id = '00000000-0000-0000-0000-000000003804')
    and not (select zakup from public.nauka_lejek_konta() where user_id = '00000000-0000-0000-0000-000000003802'), null);
  perform test.chk('A2 wiersz ali: rocznik, powód, user_id', (select rocznik_id = 'wefiz-zarz-1-st-2026' and powod = 'Pomoc przy teście lekcji' and user_id = '00000000-0000-0000-0000-000000003802' from public.nauka_dostep where email = 'ala38@x.pl'), null);
end $$;

-- A7: karnet daje dostęp bez Stripe (to samo co opłacone konto: nauka_platny_konto, nauka_ja)
select test.jako('ala38@x.pl'); set role authenticated;
do $$ declare j jsonb := public.nauka_ja(); begin
  perform test.chk('A7 ala z karnetem: pełny dostęp, data karnetu, bez okresu próbnego',
    public.nauka_platny_konto() and (j->>'platny_konto')::boolean and (j->>'dostep_do')::date = current_date + 60 and j->'proba_do' = 'null'::jsonb and not (j->>'proba_mozna')::boolean, j);
end $$;
reset role;

-- A8–A9: lista i cofnięcie (tylko karnety)
select test.jako('adm38@x.pl'); set role authenticated;
do $$ declare r jsonb; l jsonb; begin
  l := public.nauka_admin_karnety();
  perform test.chk('A8 lista: 3 karnety z tego testu, aktywne, bez wiersza boba',
    (select count(*) from jsonb_array_elements(l->'karnety') x where x->>'email' like '%38@x.pl' and x->>'stan' = 'aktywny') = 3
    and not exists (select 1 from jsonb_array_elements(l->'karnety') x where x->>'email' = 'bob38@x.pl')
    and (l->>'aktywne')::int >= 3, l);
  r := public.nauka_admin_karnet_cofnij('bob38@x.pl');
  perform test.chk('A9 cofnięcie dostępu ze Stripe: odmowa nie_karnet', r->>'code' = 'nie_karnet' and r->>'zrodlo' = 'stripe', r);
  perform test.chk('A9 cofnięcie nieznanego e-maila: brak', public.nauka_admin_karnet_cofnij('nikt38@x.pl')->>'code' = 'brak', null);
  r := public.nauka_admin_karnet_cofnij('ala38@x.pl');
  perform test.chk('A9 cofnięcie karnetu ali: ok', (r->>'ok')::boolean, r);
  perform test.chk('A9 drugie cofnięcie: juz_cofniety', public.nauka_admin_karnet_cofnij('ala38@x.pl')->>'code' = 'juz_cofniety', null);
  l := public.nauka_admin_karnety();
  perform test.chk('A9 na liście: ala cofnięta', exists (select 1 from jsonb_array_elements(l->'karnety') x where x->>'email' = 'ala38@x.pl' and x->>'stan' = 'cofniety'), l);
end $$;
reset role;
do $$ begin
  perform test.chk('A9 bob dalej z płatnym dostępem', (select do_kiedy = current_date + 200 from public.nauka_dostep where email = 'bob38@x.pl'), null);
end $$;
select test.jako('ala38@x.pl'); set role authenticated;
do $$ begin perform test.chk('A9 ala po cofnięciu bez dostępu', not public.nauka_platny_konto(), null); end $$;
reset role;
-- ponowny karnet po cofnięciu
select test.jako('adm38@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_admin_karnet_wydaj('ala38@x.pl', current_date + 7, null, 'Jednak tydzień'); begin
  perform test.chk('A9 ponowny karnet po cofnięciu: ok', (r->>'ok')::boolean, r);
end $$;
reset role;
do $$ begin perform test.chk('A9 ponowny karnet zdejmuje cofniety_at', (select cofniety_at is null and do_kiedy = current_date + 7 from public.nauka_dostep where email = 'ala38@x.pl'), null); end $$;

-- A10: źródło konta (świeże konto) i wizyty (stare konto)
select test.jako('ala38@x.pl'); set role authenticated;
do $$ begin
  perform test.chk('A10 złe źródło odrzucone', public.nauka_zrodlo_ustaw('Zły napis!')->>'code' = 'zrodlo', null);
  perform test.chk('A10 ala: ig-test38', (public.nauka_zrodlo_ustaw('ig-test38')->>'ok')::boolean, null);
  perform public.nauka_zrodlo_ustaw('plakat-test38'); -- druga wizyta z innym linkiem: źródło konta zostaje pierwsze
end $$;
reset role;
select test.jako('dan38@x.pl'); set role authenticated;
do $$ begin perform public.nauka_zrodlo_ustaw('plakat-test38'); end $$;
reset role;
do $$ begin
  perform test.chk('A10 świeże konto: źródło konta = pierwsze, wizyta = ostatnia',
    (select zrodlo = 'ig-test38' and wizyta = 'plakat-test38' from public.nauka_konto_zrodlo where user_id = '00000000-0000-0000-0000-000000003802'), null);
  perform test.chk('A10 konto sprzed 10 dni: bez źródła konta, wizyta zapisana',
    (select zrodlo = '' and wizyta = 'plakat-test38' from public.nauka_konto_zrodlo where user_id = '00000000-0000-0000-0000-000000003805'), null);
end $$;

-- A11: okres próbny dostaje źródło wizyty (wyzwalacz; nauka_proba_start bez zmian)
select test.jako('dan38@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_proba_start(); begin perform test.chk('A11 dan włącza okres próbny', r ? 'do_kiedy', r); end $$;
reset role;
do $$ begin perform test.chk('A11 próba dana ze źródłem plakat-test38', (select zrodlo = 'plakat-test38' from public.nauka_proby where user_id = '00000000-0000-0000-0000-000000003805'), null); end $$;

-- A12: dwa testowe źródła w lejku: 6 wejść z ig-test38, 5 z plakat-test38; konta, próby, zakup, lista
set role anon;
do $$ begin
  for i in 1..6 loop perform public.nauka_wejscie(null, 'ig-test38'); end loop;
  for i in 1..5 loop perform public.nauka_wejscie(null, 'plakat-test38'); end loop;
end $$;
reset role;
do $$ declare u uuid; begin
  for u in select id from auth.users where email ~ '^i[1-6]-38@x\.pl$' loop
    perform set_config('request.jwt.claims', json_build_object('sub', u, 'email', (select email from auth.users where id = u), 'role', 'authenticated')::text, false);
    perform public.nauka_zrodlo_ustaw('ig-test38');
  end loop;
  for u in select id from auth.users where email ~ '^p[1-5]-38@x\.pl$' loop
    perform set_config('request.jwt.claims', json_build_object('sub', u, 'email', (select email from auth.users where id = u), 'role', 'authenticated')::text, false);
    perform public.nauka_zrodlo_ustaw('plakat-test38');
  end loop;
  perform set_config('request.jwt.claims', '', false);
  -- dwie próby z Instagrama (wyzwalacz bierze źródło wizyty)
  insert into public.nauka_proby (user_id, email, do_kiedy) select id, email, now() + interval '3 days' from auth.users where email in ('i1-38@x.pl', 'i2-38@x.pl') on conflict do nothing;
  -- zakup i1 przez Stripe ze źródłem z client_reference_id (webhook dopisuje zrodlo_wejscia), zakup p1 bez niego (źródło konta)
  insert into public.nauka_dostep (email, do_kiedy, zrodlo, user_id, stripe_session, plan, zrodlo_wejscia) values
    ('i1-38@x.pl', current_date + 200, 'stripe', (select id from auth.users where email = 'i1-38@x.pl'), 'cs_test_i1', 'rok', 'ig-test38'),
    ('p1-38@x.pl', current_date + 200, 'stripe', (select id from auth.users where email = 'p1-38@x.pl'), 'cs_test_p1', 'rok', null)
  on conflict (email) do nothing;
  -- potwierdzony zapis na listę oczekujących z plakatu
  insert into public.nauka_oczekujacy (email, kierunek_tekst, zrodlo, status, token_hash, zgoda_wersja, confirmed_at)
  values ('lista38@x.pl', 'Psychologia', 'plakat-test38', 'confirmed', 'th-lista38', 'test', now()) on conflict (email) do nothing;
end $$;
select test.jako('adm38@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_admin_lejek_przelicz(); z jsonb; ig jsonb; pl jsonb; begin
  z := r->'dane'->'*'->'zrodla';
  ig := z->'ig-test38'->'d28'; pl := z->'plakat-test38'->'d28';
  perform test.chk('A12 lejek „*” ma podział na dwa testowe źródła', z ? 'ig-test38' and z ? 'plakat-test38', z);
  perform test.chk('A12 ig-test38 (28 dni): wejścia 6, konta 7 (ala + i1–i6), próby 2, zakup 1',
    (ig->>'wejscia')::int = 6 and (ig->>'konta')::int = 7 and (ig->>'proba')::int = 2 and (ig->>'zakup')::int = 1 and (ig->>'lista')::int = 0, ig);
  perform test.chk('A12 plakat-test38 (28 dni): wejścia 5, konta 5, próba 1 (dan, stare konto), zakup 1 (ze źródła konta), lista 1',
    (pl->>'wejscia')::int = 5 and (pl->>'konta')::int = 5 and (pl->>'proba')::int = 1 and (pl->>'zakup')::int = 1 and (pl->>'lista')::int = 1, pl);
  perform test.chk('A12 od początku też jest', (z->'ig-test38'->'wszystko'->>'wejscia')::int = 6, z->'ig-test38');
  perform test.chk('A12 bez źródła = klucz pusty', z ? '', null);
  perform test.chk('A12 rocznik (nie „*”) bez podziału na źródła', not ((r->'dane'->'wefiz-zarz-1-st-2026') ? 'zrodla') or r->'dane'->'wefiz-zarz-1-st-2026'->'zrodla' = 'null'::jsonb, null);
end $$;
reset role;

-- A13: usuwanie konta (v32) kasuje źródło konta i karnet po e-mailu
do $$ declare r jsonb := public.nauka_konto_usun_dane('00000000-0000-0000-0000-000000003802', 'ala38@x.pl'); begin
  perform test.chk('A13 po usunięciu ali: brak źródła konta i karnetu',
    not exists (select 1 from public.nauka_konto_zrodlo where user_id = '00000000-0000-0000-0000-000000003802')
    and not exists (select 1 from public.nauka_dostep where email = 'ala38@x.pl'), r);
end $$;

-- A14: ponowne uruchomienie v38 nie gubi karnetów (sprawdzane w pglite.mjs: plik 2× przed testem) — tu tylko kolumny
do $$ begin
  perform test.chk('A14 kolumny karnetu i źródła są', (select count(*) from information_schema.columns where table_name = 'nauka_dostep'
    and column_name in ('rocznik_id', 'powod', 'wydal', 'wydano_at', 'cofniety_at', 'zrodlo_wejscia')) = 6, null);
end $$;
do $$ begin raise notice 'OK v38: wszystkie testy karnetów, źródeł i lejka według źródła'; end $$;
