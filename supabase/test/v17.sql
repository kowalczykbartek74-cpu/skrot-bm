-- Testy K1–K12 dla skrot-v17-polecenia.sql (kody polecające). Tylko lokalnie, na atrapie z test/stub.sql.
-- Uruchamiaj po test/v16.sql (test.jako, test.chk z test/v13.sql). Każdy test kończy się „OK …”, pierwszy błąd przerywa plik.

reset role;
-- service_role (webhook) też korzysta z test.chk i schematu public
grant usage on schema test, public, auth to service_role; grant execute on all functions in schema test, auth to service_role;
insert into auth.users (id, email)
select ('00000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid, e
from (values (71,'pol@x.pl'),(72,'kup1@x.pl'),(73,'kup2@x.pl'),(74,'proba@x.pl'),(75,'kup3@x.pl'),(76,'inny@x.pl')) v(i, e);
-- pol@x.pl i inny@x.pl mają opłacony dostęp; proba@x.pl tylko okres próbny
insert into public.nauka_dostep (email, do_kiedy, zrodlo, plan) values ('pol@x.pl', current_date + 200, 'stripe', 'rok'), ('inny@x.pl', current_date + 200, 'stripe', 'rok');
insert into public.nauka_proby (user_id, email, do_kiedy) select id, email, now() + interval '3 days' from auth.users where email = 'proba@x.pl';

-- ---------- K1 bez opłaconego dostępu nie ma kodu (także na próbie) ----------
select test.jako('kup1@x.pl'); set role authenticated;
do $$ begin
  perform test.chk('K1a bez dostępu: brak_dostepu', public.nauka_polec_ustaw('KUPIEC')->>'code' = 'brak_dostepu', null);
  perform test.chk('K1b bez dostępu: mozna = false', not (public.nauka_polec_moj()->>'mozna')::boolean, public.nauka_polec_moj());
end $$;
reset role; select test.jako('proba@x.pl'); set role authenticated;
do $$ begin
  perform test.chk('K1c sama próba nie wystarcza', public.nauka_polec_ustaw('PROBA1')->>'code' = 'brak_dostepu', null);
end $$;

-- ---------- K2 zakładanie: normalizacja, format, zarezerwowane, zajęty ----------
reset role; select test.jako('pol@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_polec_ustaw(' bart ek-ł1 ');
begin
  perform test.chk('K2a normalizacja: BARTEKL1', r->>'ok' = 'true' and r->>'kod' = 'BARTEKL1', r);
  perform test.chk('K2b za krótki', public.nauka_polec_ustaw('ab')->>'code' = 'zly_kod', null);
  perform test.chk('K2c za długi', public.nauka_polec_ustaw('ABCDEFGHIJKLMNOPQ')->>'code' = 'zly_kod', null);
  perform test.chk('K2d zarezerwowany', public.nauka_polec_ustaw('admin')->>'code' = 'zarezerwowany', null);
  perform test.chk('K2e mój kod w stanie', public.nauka_polec_moj()->>'kod' = 'BARTEKL1' and (public.nauka_polec_moj()->>'mozna')::boolean, public.nauka_polec_moj());
  perform test.chk('K2f wypłata przyjęta', public.nauka_polec_wyplata('BLIK 600 100 200')->>'ok' = 'true', null);
  perform test.chk('K2g wypłata za krótka', public.nauka_polec_wyplata('ab')->>'code' = 'zle_dane', null);
  raise notice 'OK K2 zakładanie kodu';
end $$;
do $$ begin perform test.chk('K2j wypłata w stanie', public.nauka_polec_moj()->>'wyplata' = 'BLIK 600 100 200', public.nauka_polec_moj()); end $$;
reset role; select test.jako('inny@x.pl'); set role authenticated;
do $$ begin
  perform test.chk('K2h zajęty kod innej osoby', public.nauka_polec_ustaw('bartekl1')->>'code' = 'zajety', null);
  perform test.chk('K2i inny wolny kod', public.nauka_polec_ustaw('INNY')->>'ok' = 'true', null);
end $$;

-- ---------- K3 sprawdzanie przed płatnością ----------
reset role; select test.jako('pol@x.pl'); set role authenticated;
do $$ begin perform test.chk('K3a własny kod', public.nauka_polec_sprawdz('BARTEKL1')->>'code' = 'wlasny', null); end $$;
reset role; select test.jako('kup1@x.pl'); set role authenticated;
do $$ begin
  perform test.chk('K3b dobry kod (małe litery)', public.nauka_polec_sprawdz('bartekl1')->>'ok' = 'true', public.nauka_polec_sprawdz('bartekl1'));
  perform test.chk('K3c nieznany', public.nauka_polec_sprawdz('NIEMA')->>'code' = 'brak', null);
  raise notice 'OK K3 sprawdzanie kodu';
end $$;

-- ---------- K4 przeglądarka nie dotyka tabel ani funkcji webhooka ----------
do $$ declare e text;
begin
  begin perform count(*) from public.nauka_kody; e := 'czyta'; exception when others then e := 'blokada'; end;
  perform test.chk('K4a brak odczytu nauka_kody', e = 'blokada', null);
  begin insert into public.nauka_polecenia (kod, polecajacy, kupujacy_email, stripe_session, nagroda_gr) values ('X', gen_random_uuid(), 'a@b.pl', 's', 3000); e := 'pisze'; exception when others then e := 'blokada'; end;
  perform test.chk('K4b brak zapisu nauka_polecenia', e = 'blokada', null);
  begin perform public.nauka_polec_zapisz('BARTEKL1', 'cs_hack', 'kup1@x.pl', null, 19900, 'pi_hack'); e := 'woła'; exception when others then e := 'blokada'; end;
  perform test.chk('K4c brak wywołania nauka_polec_zapisz', e = 'blokada', null);
  begin perform public.nauka_admin_polecenia(); e := 'woła'; exception when others then e := 'blokada'; end;
  perform test.chk('K4d panel starosty tylko dla starosty', e = 'blokada', null);
  raise notice 'OK K4 zabezpieczenia';
end $$;

-- ---------- K5 webhook: zapis polecenia, duplikat, plan miesięczny, samopolecenie ----------
reset role; set role service_role; select set_config('request.jwt.claims', '', false);
do $$ declare kup1 uuid := '00000000-0000-0000-0000-000000000072'; pol uuid := '00000000-0000-0000-0000-000000000071'; r jsonb;
begin
  r := public.nauka_polec_zapisz('bartekl1', 'cs_1', 'KUP1@x.pl', kup1, 19900, 'pi_1');
  perform test.chk('K5a zapis', r->>'ok' = 'true', r);
  perform test.chk('K5b ta sama sesja drugi raz', public.nauka_polec_zapisz('BARTEKL1', 'cs_1', 'kup1@x.pl', kup1, 19900, 'pi_1')->>'code' = 'duplikat', null);
  perform test.chk('K5c ten sam kupujący, nowa sesja', public.nauka_polec_zapisz('BARTEKL1', 'cs_1b', 'kup1@x.pl', kup1, 19900, 'pi_1b')->>'code' = 'juz_polecony', null);
  perform test.chk('K5d plan miesięczny (3500 gr) się nie liczy', public.nauka_polec_zapisz('BARTEKL1', 'cs_2', 'kup2@x.pl', null, 3500, 'pi_2')->>'code' = 'zly_plan', null);
  perform test.chk('K5e samopolecenie po uid', public.nauka_polec_zapisz('BARTEKL1', 'cs_3', 'inny-adres@x.pl', pol, 19900, 'pi_3')->>'code' = 'wlasny', null);
  perform test.chk('K5f samopolecenie po e-mailu', public.nauka_polec_zapisz('BARTEKL1', 'cs_4', 'pol@x.pl', null, 19900, 'pi_4')->>'code' = 'wlasny', null);
  perform test.chk('K5g nieznany kod', public.nauka_polec_zapisz('NIEMA', 'cs_5', 'kup2@x.pl', null, 19900, 'pi_5')->>'code' = 'brak', null);
  perform test.chk('K5h drugi kupujący', public.nauka_polec_zapisz('BARTEKL1', 'cs_6', 'kup2@x.pl', null, 19900, 'pi_6')->>'ok' = 'true', null);
  perform test.chk('K5i trzeci kupujący', public.nauka_polec_zapisz('BARTEKL1', 'cs_7', 'kup3@x.pl', null, 19900, 'pi_7')->>'ok' = 'true', null);
  raise notice 'OK K5 zapis po płatności';
end $$;

-- ---------- K6 kupujący już polecony nie przejdzie sprawdzenia ----------
reset role; select test.jako('kup1@x.pl'); set role authenticated;
do $$ begin perform test.chk('K6 już polecony', public.nauka_polec_sprawdz('INNY')->>'code' = 'juz_polecony', null); end $$;

-- ---------- K7 14 dni: czeka → do wypłaty ----------
reset role;
update public.nauka_polecenia set created_at = now() - interval '15 days' where stripe_session in ('cs_1', 'cs_6');
select test.jako('pol@x.pl'); set role authenticated;
do $$ declare m jsonb := public.nauka_polec_moj();
begin
  perform test.chk('K7 2 do wypłaty (6000 gr), 1 czeka (3000 gr), 3 polecone',
    (m->>'do_wyplaty_gr')::int = 6000 and (m->>'czeka_gr')::int = 3000 and (m->>'polecone')::int = 3
    and jsonb_array_length(m->'lista') = 3 and not (m::text like '%kup1@x.pl%'), m);
  raise notice 'OK K7 stan nagród (bez e-maili kupujących)';
end $$;

-- ---------- K8 zwrot przed wypłatą anuluje, po wypłacie tylko oznacza ----------
reset role; set role service_role;
do $$ declare r jsonb := public.nauka_polec_cofnij('pi_6', 'Zwrot w Stripe');
begin perform test.chk('K8a zwrot anuluje 1', (r->>'anulowane')::int = 1, r); end $$;
reset role; select test.jako('pol@x.pl'); set role authenticated;
do $$ declare m jsonb := public.nauka_polec_moj();
begin perform test.chk('K8b po zwrocie: 3000 do wypłaty, 2 polecone', (m->>'do_wyplaty_gr')::int = 3000 and (m->>'polecone')::int = 2, m); end $$;

-- ---------- K9 starosta: lista, wypłata, ponowna wypłata = 0 ----------
reset role; insert into public.nauka_admini (email) values ('star@x.pl') on conflict do nothing;
insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000000079', 'star@x.pl') on conflict do nothing;
select test.jako('star@x.pl'); set role authenticated;
do $$ declare a jsonb := public.nauka_admin_polecenia(); w jsonb; o jsonb;
begin
  select x into o from jsonb_array_elements(a->'osoby') x where x->>'kod' = 'BARTEKL1';
  perform test.chk('K9a panel: BARTEKL1 3000 do wypłaty, dane BLIK widoczne', (o->>'do_wyplaty_gr')::int = 3000 and o->>'wyplata' = 'BLIK 600 100 200', a);
  w := public.nauka_admin_polec_wyplac('00000000-0000-0000-0000-000000000071');
  perform test.chk('K9b wypłacono 3000', (w->>'wyplacone_gr')::int = 3000, w);
  perform test.chk('K9c druga wypłata 0 (to, co czeka, nie wypłaca się)', (public.nauka_admin_polec_wyplac('00000000-0000-0000-0000-000000000071')->>'wyplacone_gr')::int = 0, null);
  raise notice 'OK K9 panel starosty';
end $$;

-- ---------- K10 zwrot po wypłacie: zostaje „wypłacone”, z powodem ----------
reset role; set role service_role;
do $$ declare r jsonb := public.nauka_polec_cofnij('pi_1', 'Spór (chargeback) w Stripe');
begin perform test.chk('K10 po wypłacie: 0 anulowanych, 1 oznaczone', (r->>'anulowane')::int = 0 and (r->>'po_wyplacie')::int = 1, r); end $$;

-- ---------- K11 kod osoby, której dostęp wygasł, przestaje działać ----------
reset role; update public.nauka_dostep set do_kiedy = current_date - 1 where email = 'inny@x.pl';
set role service_role;
do $$ begin perform test.chk('K11 nieaktywny kod', public.nauka_polec_zapisz('INNY', 'cs_8', 'nowy@x.pl', null, 19900, 'pi_8')->>'code' = 'nieaktywny', null); end $$;

-- ---------- K12 starosta usuwa kod; stare polecenia zostają ----------
reset role; select test.jako('star@x.pl'); set role authenticated;
do $$ begin
  perform test.chk('K12a usunięty', public.nauka_admin_kod_usun('00000000-0000-0000-0000-000000000071')->>'ok' = 'true', null);
  perform test.chk('K12b polecenia zostały', jsonb_array_length(public.nauka_admin_polecenia()->'polecenia') = 3, null);
  raise notice 'OK K12 usuwanie kodu';
end $$;

reset role;
do $$ begin raise notice 'WSZYSTKIE TESTY v17 OK'; end $$;
