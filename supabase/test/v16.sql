-- Testy P1–P8 dla skrot-v16-proba.sql (okres próbny), uruchomionego na końcu (po v13, v15, v14) jak na produkcji.
-- Tylko lokalnie, na atrapie z test/stub.sql. Uruchamiaj po test/v13.sql (test.jako, test.chk; h1@x.pl ma opłacony dostęp z test/v15.sql).
-- Każdy test kończy się komunikatem „OK …”; pierwszy błąd przerywa plik wyjątkiem „BŁĄD …”.

reset role;
create or replace function test.blad(f text) returns text language plpgsql as $$
begin execute 'select public.' || f; return null; exception when others then return sqlerrm; end $$;
grant execute on function test.blad(text) to authenticated;

insert into auth.users (id, email)
select ('00000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid, e
from (values (61,'t1@x.pl'),(62,'t2@x.pl'),(63,'t3@x.pl')) v(i, e);
-- urządzenia zarejestrowane (jak po nauka_ping), bez opłaconego dostępu
insert into public.nauka_urzadzenia (user_id, device_id, nazwa)
select u.id, '11111111-1111-1111-1111-' || right(u.id::text, 12), 'test' from auth.users u where u.email in ('t1@x.pl','t2@x.pl','t3@x.pl');
insert into public.nauka_kalendarz (user_id, email, token)
select u.id, u.email, 'tok-t1' from auth.users u where u.email = 't1@x.pl';

-- ---------- P1 przed okresem próbnym ----------
select test.jako('t1@x.pl'); set role authenticated;
do $$ declare j jsonb := public.nauka_ja();
begin
  perform test.chk('P1 bez dostępu: proba_mozna, proba_dni 3, brak gier i punktów',
    (j->>'proba_mozna')::boolean and (j->>'proba_dni')::int = 3 and j->>'proba_do' is null
    and not (j->>'platny')::boolean and not (public.nauka_sklep_stan()->>'mozna')::boolean
    and public.nauka_gra_start('frun')->>'code' = 'no_access', j);
end $$;

-- ---------- P2 start: pełny dostęp jak opłacone konto, z grami, punktami i Zadaniami dnia ----------
do $$ declare r jsonb := public.nauka_proba_start(); j jsonb := public.nauka_ja(); g jsonb := public.nauka_gra_start('drabina');
begin
  perform test.chk('P2 start: do_kiedy za 3 dni, platny, proba_do, nie da się drugi raz, gry i Zadania dnia odblokowane',
    (r->>'do_kiedy')::timestamptz between now() + interval '71 hours' and now() + interval '73 hours'
    and (j->>'platny')::boolean and (j->>'platny_konto')::boolean and j->>'proba_do' is not null
    and not (j->>'proba_mozna')::boolean
    and (g->>'ok')::boolean and not (public.nauka_misje()->>'zablokowane')::boolean
    and (public.nauka_sklep_stan()->>'mozna')::boolean, jsonb_build_array(r, j, g));
end $$;

-- ---------- P3 punkty w okresie próbnym dają monety ----------
reset role;
do $$ declare u uuid := (select id from auth.users where email = 't1@x.pl');
begin perform public.nauka_rp_dodaj(u, 'lekcja', 'l:proba', 'makro', 30); end $$;
select test.jako('t1@x.pl'); set role authenticated;
select test.chk('P3 okres próbny: 30 pkt → 3 monety', (public.nauka_sklep_stan()->>'saldo')::int = 3, public.nauka_sklep_stan());

-- ---------- P4 drugi raz → wykorzystany ----------
select test.chk('P4 drugi start → wykorzystany', test.blad('nauka_proba_start()') like '%wykorzystany%', to_jsonb(test.blad('nauka_proba_start()')));

-- ---------- P5 to samo urządzenie, inne konto → urzadzenie ----------
reset role;
select test.jako('t2@x.pl');
select set_config('request.headers', json_build_object('x-skrot-device', '11111111-1111-1111-1111-' || right((select id from auth.users where email = 't1@x.pl')::text, 12))::text, false);
set role authenticated;
select test.chk('P5 to samo urządzenie → urzadzenie', test.blad('nauka_proba_start()') like '%urzadzenie%', to_jsonb(test.blad('nauka_proba_start()')));

-- ---------- P6 opłacone konto → ma_dostep, bez przycisku ----------
reset role;
select test.jako('h1@x.pl'); set role authenticated;
select test.chk('P6 opłacone konto: ma_dostep, proba_mozna = false',
  test.blad('nauka_proba_start()') like '%ma_dostep%' and not (public.nauka_ja()->>'proba_mozna')::boolean and public.nauka_ja()->>'proba_do' is null,
  public.nauka_ja());

-- ---------- P7 kalendarz w telefonie w okresie próbnym ----------
reset role;
select test.chk('P7 kalendarz: platny w okresie próbnym', (public.nauka_kalendarz_dane('tok-t1')->>'platny')::boolean, public.nauka_kalendarz_dane('tok-t1'));

-- ---------- P8 koniec okresu próbnego: blokada, monety i postępy zostają ----------
update public.nauka_proby set od = now() - interval '4 days', do_kiedy = now() - interval '1 minute'
 where user_id = (select id from auth.users where email = 't1@x.pl');
select test.jako('t1@x.pl'); set role authenticated;
do $$ declare j jsonb := public.nauka_ja();
begin
  perform test.chk('P8 po końcu: bez dostępu i bez gier, proba_mozna = false, saldo zostaje, kalendarz pusty',
    not (j->>'platny')::boolean and j->>'proba_do' is null and not (j->>'proba_mozna')::boolean
    and not (public.nauka_sklep_stan()->>'mozna')::boolean and public.nauka_gra_start('frun')->>'code' = 'no_access'
    and (public.nauka_misje()->>'zablokowane')::boolean and (public.nauka_sklep_stan()->>'saldo')::int = 3
    and test.blad('nauka_proba_start()') like '%wykorzystany%', j);
end $$;
reset role;
select test.chk('P8b kalendarz po końcu: platny = false', not (public.nauka_kalendarz_dane('tok-t1')->>'platny')::boolean, null);

do $$ begin raise notice 'WSZYSTKIE TESTY P1–P8 OK'; end $$;
