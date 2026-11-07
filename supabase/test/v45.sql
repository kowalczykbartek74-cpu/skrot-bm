-- Testy D1–D14 dla skrot-v45-dostep-rocznik.sql (po test/v45-przed.sql i dwóch uruchomieniach v45).
-- Rocznik testowy wefiz-test-1-st-2026 i konto t44@x.pl (profil w roczniku testowym) są z test/v44.sql.
reset role;
-- D1: stare wiersze = BM, klucz (email, rocznik_id), rocznik obowiązkowy
do $$ begin
  perform test.chk('D1 wszystkie dotychczasowe dostępy w BM (t44 też: kupił przed v45, czyli BM)',
    not exists (select 1 from public.nauka_dostep where rocznik_id <> 'wefiz-bm-1-st-2026'), (select jsonb_agg(d) from public.nauka_dostep d where rocznik_id <> 'wefiz-bm-1-st-2026'));
  perform test.chk('D1 klucz główny (email, rocznik_id)',
    (select array_agg(a.attname::text order by a.attname) from pg_constraint c join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
      where c.conrelid = 'public.nauka_dostep'::regclass and c.contype = 'p') = array['email', 'rocznik_id'], null);
  begin
    insert into public.nauka_dostep (email, do_kiedy, rocznik_id) values ('zly45@x.pl', current_date, null);
    perform test.chk('D1 rocznik obowiązkowy', false, null);
  exception when not_null_violation then perform test.chk('D1 rocznik obowiązkowy', true, null); end;
end $$;
-- D2: dla kont BM i admina nauka_ja() i nauka_platny_konto() bez zmian
do $$ declare r record; ja jsonb; k boolean; begin
  for r in select * from test.v45_przed loop
    perform test.jako(r.email); set local role authenticated;
    ja := public.nauka_ja(); k := public.nauka_platny_konto();
    reset role;
    perform test.chk('D2 ' || r.email || ': nauka_ja i dostęp jak przed v45', ja = r.ja and k = r.konto, jsonb_build_object('przed', r.ja, 'po', ja));
  end loop;
end $$;

-- D3: zakup BM nie otwiera rocznika testowego (t44 ma tylko wiersz BM, profil w roczniku testowym)
select test.jako('t44@x.pl'); set role authenticated;
do $$ begin
  perform test.chk('D3 zakup BM nie daje dostępu w roczniku testowym', not public.nauka_platny_konto() and (public.nauka_ja()->>'dostep_do') is null, public.nauka_ja());
end $$;
reset role;
-- D4: zakup rocznika testowego (jak webhook: upsert po (email, rocznik_id)) otwiera rocznik testowy
insert into public.nauka_dostep (email, do_kiedy, zrodlo, user_id, plan, rocznik_id)
values ('t44@x.pl', current_date + 200, 'stripe', '00000000-0000-0000-0000-000000004401', 'rok', 'wefiz-test-1-st-2026')
on conflict (email, rocznik_id) do update set do_kiedy = excluded.do_kiedy;
select test.jako('t44@x.pl'); set role authenticated;
do $$ begin
  perform test.chk('D4 dostęp w roczniku testowym, data i plan z jego wiersza',
    public.nauka_platny_konto() and (public.nauka_ja()->>'dostep_do')::date = current_date + 200 and public.nauka_ja()->>'plan' = 'rok', public.nauka_ja());
end $$;
reset role;
-- D5: odwrotnie: osoba z BM, która kupiła tylko rocznik testowy, nie ma dostępu w BM
insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000004501', 'b45@x.pl') on conflict do nothing;
insert into public.nauka_dostep (email, do_kiedy, zrodlo, user_id, rocznik_id) values ('b45@x.pl', current_date + 100, 'stripe', '00000000-0000-0000-0000-000000004501', 'wefiz-test-1-st-2026');
select test.jako('b45@x.pl'); set role authenticated;
do $$ begin
  perform test.chk('D5 zakup rocznika testowego nie daje dostępu w BM', not public.nauka_platny_konto() and (public.nauka_ja()->>'dostep_do') is null, public.nauka_ja());
  perform test.chk('D5 ktoś, kto już płacił (inny rocznik), nie dostaje okresu próbnego', not (public.nauka_ja()->>'proba_mozna')::boolean, public.nauka_ja());
end $$;
reset role;

-- D6–D9: karnety na rocznik
insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000004502', 'k45@x.pl') on conflict do nothing;
insert into public.nauka_profil (user_id, rocznik_id) values ('00000000-0000-0000-0000-000000004502', 'wefiz-test-1-st-2026') on conflict (user_id) do update set rocznik_id = excluded.rocznik_id;
select test.jako('s@x.pl'); set role authenticated;
do $$ declare r jsonb; begin
  r := public.nauka_admin_karnet_wydaj('k45@x.pl', current_date + 30, null, 'test karnetu');
  perform test.chk('D6 karnet bez rocznika → rocznik z profilu konta', (r->>'ok')::boolean and r->>'rocznik_id' = 'wefiz-test-1-st-2026', r);
  r := public.nauka_admin_karnet_wydaj('nowy45@x.pl', current_date + 30, null, 'bez konta');
  perform test.chk('D6 karnet bez konta i bez rocznika → BM', (r->>'ok')::boolean and r->>'rocznik_id' = 'wefiz-bm-1-st-2026', r);
  r := public.nauka_admin_karnet_wydaj('a@x.pl', current_date + 30, 'wefiz-bm-1-st-2026', 'ma płatny');
  perform test.chk('D7 karnet BM dla osoby z płatnym BM → ma_dostep', r->>'code' = 'ma_dostep', r);
  r := public.nauka_admin_karnet_wydaj('a@x.pl', current_date + 30, 'wefiz-test-1-st-2026', 'drugi rocznik');
  perform test.chk('D7 karnet na inny rocznik tej osoby → ok (płatny BM zostaje)', (r->>'ok')::boolean, r);
end $$;
reset role;
do $$ begin
  perform test.chk('D7 a@x.pl: dwa wiersze, BM płatny bez zmian',
    (select count(*) from public.nauka_dostep where email = 'a@x.pl') = 2
    and (select zrodlo is distinct from 'karnet' from public.nauka_dostep where email = 'a@x.pl' and rocznik_id = 'wefiz-bm-1-st-2026'), null);
end $$;
select test.jako('k45@x.pl'); set role authenticated;
do $$ begin perform test.chk('D8 karnet działa w roczniku testowym', public.nauka_platny_konto(), public.nauka_ja()); end $$;
reset role;
select test.jako('a@x.pl'); set role authenticated;
do $$ begin perform test.chk('D8 karnet testowy nie zmienia dostępu a@x.pl w BM', public.nauka_platny_konto() and (public.nauka_ja()->>'dostep_do')::date = current_date + 300, public.nauka_ja()); end $$;
reset role;
select test.jako('s@x.pl'); set role authenticated;
do $$ declare r jsonb; begin
  r := public.nauka_admin_karnet_cofnij('a@x.pl');
  perform test.chk('D9 cofnięcie po e-mailu: tylko karnet, płatny BM zostaje', (r->>'ok')::boolean and (r->>'cofniete')::int = 1, r);
  r := public.nauka_admin_karnet_cofnij('a@x.pl');
  perform test.chk('D9 drugi raz → juz_cofniety', r->>'code' = 'juz_cofniety', r);
  r := public.nauka_admin_karnet_cofnij('a@x.pl', 'wefiz-bm-1-st-2026');
  perform test.chk('D9 płatnego BM nie da się cofnąć → nie_karnet', r->>'code' = 'nie_karnet', r);
  r := public.nauka_admin_karnet_cofnij('k45@x.pl', 'wefiz-test-1-st-2026');
  perform test.chk('D9 cofnięcie po e-mailu i roczniku', (r->>'ok')::boolean, r);
end $$;
reset role;
do $$ begin
  perform test.chk('D9 a@x.pl dalej ma płatny BM', (select do_kiedy >= current_date from public.nauka_dostep where email = 'a@x.pl' and rocznik_id = 'wefiz-bm-1-st-2026'), null);
end $$;

-- D10: kalendarz: dostęp z rocznika właściciela linku
do $$ declare t jsonb := public.nauka_kalendarz_dane('tok-v44-test'); b jsonb := public.nauka_kalendarz_dane('tok-v44-bm'); begin
  perform test.chk('D10 kalendarz rocznika testowego: płatny (wiersz rocznika testowego), terminy tylko jego',
    (t->>'platny')::boolean and (select array_agg(x->>'id') from jsonb_array_elements(t->'terminy') x) = array['td1'], t);
  perform test.chk('D10 kalendarz BM bez zmian', (b->>'platny')::boolean and jsonb_array_length(b->'terminy') > 0, b);
end $$;
-- D11: kupno tylko rocznika ze statusem platny
update public.nauka_roczniki set status = 'oczekujacy' where id = 'wefiz-test-1-st-2026';
do $$ begin
  perform test.chk('D11 BM da się kupić, rocznik oczekujący nie, nieznany nie',
    public.nauka_rocznik_do_kupienia('wefiz-bm-1-st-2026') and not public.nauka_rocznik_do_kupienia('wefiz-test-1-st-2026')
    and not public.nauka_rocznik_do_kupienia('nie-ma-1-st-2026'), null);
end $$;
update public.nauka_roczniki set status = 'platny' where id = 'wefiz-test-1-st-2026';
-- D12: nieistniejący rocznik zatrzymany
do $$ begin
  begin insert into public.nauka_dostep (email, do_kiedy, rocznik_id) values ('x45@x.pl', current_date, 'nie-ma-1-st-2026'); perform test.chk('D12 nieznany rocznik', false, null);
  exception when foreign_key_violation then perform test.chk('D12 nieznany rocznik zatrzymany', true, null); end;
end $$;
-- D13: usunięcie konta kasuje wszystkie wiersze osoby (oba roczniki)
do $$ begin
  perform test.chk('D13 przed usunięciem: t44 ma wiersze w dwóch rocznikach', (select count(distinct rocznik_id) from public.nauka_dostep where email = 't44@x.pl') = 2, null);
end $$;
set role service_role;
select public.nauka_konto_usun_dane('00000000-0000-0000-0000-000000004401', 't44@x.pl');
reset role;
do $$ begin
  perform test.chk('D13 usunięcie konta: oba wiersze nauka_dostep znikają', not exists (select 1 from public.nauka_dostep where email = 't44@x.pl'), null);
end $$;
-- D14: stare wywołanie karnetu z jednym argumentem dalej działa (strona woła { p_email })
do $$ begin
  perform test.chk('D14 jedna funkcja cofania (bez starej jednoargumentowej)',
    (select count(*) from pg_proc where proname = 'nauka_admin_karnet_cofnij' and pronamespace = 'public'::regnamespace) = 1, null);
  raise notice 'WSZYSTKIE testy v45 OK';
end $$;
