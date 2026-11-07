-- Testy T1–T16 dla skrot-v44-roczniki-tresci.sql (po test/v44-przed.sql i dwóch uruchomieniach v44).
-- Rocznik testowy wefiz-test-1-st-2026 (tylko w testach): ten sam kod kierunku BM, inny wydział, przedmiot o tej samej nazwie (makro).
reset role;
grant usage on schema test to anon; grant execute on function test.chk(text, boolean, jsonb) to anon;
insert into public.nauka_wydzialy (kod, nazwa_pl) values ('TST', 'Wydział testowy') on conflict do nothing;
insert into public.nauka_kierunki (id, wydzial, kod, nazwa_pl, stopien, tryb) values ('wefiz-test-1-st', 'TST', 'BM', 'Test', 1, 'st') on conflict do nothing;
insert into public.nauka_roczniki (id, kierunek_id, nabor, status) values ('wefiz-test-1-st-2026', 'wefiz-test-1-st', 2026, 'platny') on conflict do nothing;
insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000004401', 't44@x.pl') on conflict do nothing;
insert into public.nauka_dostep (email, do_kiedy, user_id) values ('t44@x.pl', current_date + 300, '00000000-0000-0000-0000-000000004401') on conflict do nothing;
insert into public.nauka_urzadzenia (user_id, device_id, nazwa) values ('00000000-0000-0000-0000-000000004401', '11111111-1111-1111-1111-000000004401', 'test') on conflict do nothing;
insert into public.nauka_profil (user_id, rocznik_id, rocznik_wybrany_at) values ('00000000-0000-0000-0000-000000004401', 'wefiz-test-1-st-2026', now())
on conflict (user_id) do update set rocznik_id = excluded.rocznik_id;

-- T1/T2: po migracji BM, gość i admin widzą dokładnie to samo co przed
do $$ declare kto text; roznica int; begin
  perform test.chk('T1 każdy dotychczasowy dokument rocznika ma rocznik BM',
    not exists (select 1 from public.nauka_docs where public.nauka_kolekcja_rocznika(kolekcja, id) and rocznik_id is distinct from 'wefiz-bm-1-st-2026'), null);
  perform test.chk('T1 osobiste i meta/en bez rocznika',
    not exists (select 1 from public.nauka_docs where not public.nauka_kolekcja_rocznika(kolekcja, id) and rocznik_id is not null), null);
end $$;
create temp table v44_po (kto text, kolekcja text, id text, h text);
grant insert, select on v44_po to anon, authenticated;
select test.jako('a@x.pl'); set role authenticated;
insert into v44_po select 'a', kolekcja, id, md5(data::text) from public.nauka_docs;
reset role; select test.jako('s@x.pl'); set role authenticated;
insert into v44_po select 's', kolekcja, id, md5(data::text) from public.nauka_docs;
reset role; select set_config('request.jwt.claims', '', false); set role anon;
insert into v44_po select 'anon', kolekcja, id, md5(data::text) from public.nauka_docs;
reset role;
do $$ declare k text; begin
  foreach k in array array['a', 's', 'anon'] loop
    perform test.chk('T2 ' || k || ': ten sam zestaw dokumentów co przed v44',
      not exists ((select kolekcja, id, h from test.v44_przed where kto = k) except (select kolekcja, id, h from v44_po where kto = k))
      and not exists ((select kolekcja, id, h from v44_po where kto = k) except (select kolekcja, id, h from test.v44_przed where kto = k)),
      (select jsonb_agg(x) from ((select kolekcja, id from test.v44_przed where kto = k) except (select kolekcja, id from v44_po where kto = k)) x));
  end loop;
end $$;

-- Admin wpisuje treści rocznika testowego (jak strona w „Edytuję rocznik”: id z sufiksem tam, gdzie id jest stałe)
select test.jako('s@x.pl'); set role authenticated;
insert into public.nauka_docs (kolekcja, id, data, rocznik_id) values
  ('materials', 'tm1', '{"subjectId":"makro","title":"Test M1"}', 'wefiz-test-1-st-2026'),
  ('materialContent', 'tm1', '{"quiz":[]}', 'wefiz-test-1-st-2026'),
  ('deadlines', 'td1', jsonb_build_object('title', 'Kolokwium testowe', 'type', 'kolokwium', 'subjectId', 'makro', 'date', to_char(current_date + 3, 'YYYY-MM-DD')), 'wefiz-test-1-st-2026'),
  ('announcements', 'ta1', '{"text":"Ogłoszenie testowe"}', 'wefiz-test-1-st-2026'),
  ('meta', 'po@wefiz-test-1-st-2026', '{"items":{"x1":{"sid":"makro","k":"W","t":"Temat"}}}', 'wefiz-test-1-st-2026'),
  ('meta', 'po~x1@wefiz-test-1-st-2026', '{"quiz":[{"q":"?","options":["A","B"],"correct":1}]}', 'wefiz-test-1-st-2026'),
  ('examBank', 'makro@wefiz-test-1-st-2026', '{"items":[]}', 'wefiz-test-1-st-2026');
-- T6: admin bez rocznika → rocznik z profilu (BM); meta/en zawsze wspólne
insert into public.nauka_docs (kolekcja, id, data) values ('announcements', 'ba44', '{"text":"BM bez rocznika"}');
insert into public.nauka_docs (kolekcja, id, data, rocznik_id) values ('meta', 'en', '{"t":{}}', 'wefiz-test-1-st-2026')
on conflict (kolekcja, id) do update set data = excluded.data, rocznik_id = excluded.rocznik_id;
reset role;
do $$ begin
  perform test.chk('T6 admin bez rocznika → BM', (select rocznik_id from public.nauka_docs where kolekcja = 'announcements' and id = 'ba44') = 'wefiz-bm-1-st-2026', null);
  perform test.chk('T6 meta/en zawsze bez rocznika', (select rocznik_id from public.nauka_docs where kolekcja = 'meta' and id = 'en') is null, null);
end $$;

-- T3/T4/T5: kto co widzi
select test.jako('t44@x.pl'); set role authenticated;
do $$ begin
  perform test.chk('T3 student testowy widzi swoje treści',
    (select count(*) from public.nauka_docs where id in ('tm1', 'td1', 'ta1', 'po@wefiz-test-1-st-2026', 'po~x1@wefiz-test-1-st-2026', 'makro@wefiz-test-1-st-2026')) = 7, null);
  perform test.chk('T3 student testowy nie widzi niczego z BM',
    not exists (select 1 from public.nauka_docs where rocznik_id = 'wefiz-bm-1-st-2026'),
    (select jsonb_agg(kolekcja || '/' || id) from public.nauka_docs where rocznik_id = 'wefiz-bm-1-st-2026'));
  perform test.chk('T3 słownik EN widzi każdy rocznik', exists (select 1 from public.nauka_docs where kolekcja = 'meta' and id = 'en'), null);
  perform test.chk('T11 nauka_docs_id z sufiksem rocznika', public.nauka_docs_id('po') = 'po@wefiz-test-1-st-2026' and public.nauka_moj_rocznik() = 'wefiz-test-1-st-2026', null);
end $$;
reset role; select test.jako('a@x.pl'); set role authenticated;
do $$ begin
  perform test.chk('T4 student BM nie widzi rocznika testowego', not exists (select 1 from public.nauka_docs where rocznik_id = 'wefiz-test-1-st-2026'), null);
  perform test.chk('T4 student BM widzi nowe ogłoszenie BM', exists (select 1 from public.nauka_docs where id = 'ba44'), null);
  perform test.chk('T11 BM: id bez sufiksu', public.nauka_docs_id('po') = 'po' and public.nauka_moj_rocznik() = 'wefiz-bm-1-st-2026', null);
end $$;
reset role; select set_config('request.jwt.claims', '', false); set role anon;
do $$ begin
  perform test.chk('T4 gość nie widzi materiałów rocznika testowego', not exists (select 1 from public.nauka_docs where id = 'tm1'), null);
  perform test.chk('T4 gość widzi listę materiałów BM', exists (select 1 from public.nauka_docs where kolekcja = 'materials' and id = 'm1'), null);
end $$;
reset role; select test.jako('s@x.pl'); set role authenticated;
do $$ begin
  perform test.chk('T5 admin widzi oba roczniki',
    exists (select 1 from public.nauka_docs where id = 'tm1') and exists (select 1 from public.nauka_docs where kolekcja = 'materials' and id = 'm1'), null);
end $$;

-- T8: dokument BM nie da się „przepisać” do innego rocznika (upsert z innym rocznikiem o tym samym id)
do $$ begin
  begin
    insert into public.nauka_docs (kolekcja, id, data, rocznik_id) values ('materials', 'm1', '{"title":"nadpisane"}', 'wefiz-test-1-st-2026')
    on conflict (kolekcja, id) do update set data = excluded.data, rocznik_id = excluded.rocznik_id;
    perform test.chk('T8 upsert z innym rocznikiem zatrzymany', false, null);
  exception when others then
    perform test.chk('T8 upsert z innym rocznikiem zatrzymany (inny_rocznik)', sqlerrm like 'inny_rocznik%', jsonb_build_object('e', sqlerrm));
  end;
  begin
    update public.nauka_docs set rocznik_id = 'wefiz-test-1-st-2026' where kolekcja = 'materials' and id = 'm1';
    perform test.chk('T8 update rocznika zatrzymany', false, null);
  exception when others then perform test.chk('T8 update rocznika zatrzymany', sqlerrm like 'inny_rocznik%', null); end;
  begin
    insert into public.nauka_docs (kolekcja, id, data, rocznik_id) values ('materials', 'zly44', '{}', 'nie-ma-takiego-1-st-2026');
    perform test.chk('T8 nieistniejący rocznik zatrzymany', false, null);
  exception when foreign_key_violation then perform test.chk('T8 nieistniejący rocznik zatrzymany', true, null); end;
end $$;
reset role;
do $$ begin
  perform test.chk('T8 m1 nadal w BM i bez zmian', (select rocznik_id = 'wefiz-bm-1-st-2026' and data->>'title' = 'M1' from public.nauka_docs where kolekcja = 'materials' and id = 'm1'), null);
end $$;

-- T7: student nie dodaje terminów (od v5 tylko admin), a jego zgłoszenie (osobiste) jest bez rocznika
select test.jako('t44@x.pl'); set role authenticated;
do $$ begin
  begin
    insert into public.nauka_docs (kolekcja, id, data, rocznik_id) values ('deadlines', 'td-student', '{"title":"Mój"}', 'wefiz-bm-1-st-2026');
    perform test.chk('T7 student nie dodaje terminów', false, null);
  exception when insufficient_privilege then perform test.chk('T7 student nie dodaje terminów (jak od v5)', true, null); end;
  insert into public.nauka_docs (kolekcja, id, data, rocznik_id) values ('reports', 'tr44', '{"note":"błąd"}', 'wefiz-bm-1-st-2026');
end $$;
reset role;
-- T9: zmiana treści przez admina zostawia rocznik wiersza (strona nie wysyła rocznika przy update)
select test.jako('s@x.pl'); set role authenticated;
update public.nauka_docs set data = data || '{"title":"Kolokwium testowe 2"}' where kolekcja = 'deadlines' and id = 'td1';
reset role;
do $$ begin
  perform test.chk('T7 zgłoszenie bez rocznika', (select rocznik_id from public.nauka_docs where kolekcja = 'reports' and id = 'tr44') is null, null);
  perform test.chk('T9 po zmianie dalej rocznik testowy', (select rocznik_id = 'wefiz-test-1-st-2026' and data->>'title' = 'Kolokwium testowe 2' from public.nauka_docs where kolekcja = 'deadlines' and id = 'td1'), null);
end $$;

-- T12: Po zajęciach (v28) w roczniku testowym czyta dokumenty z sufiksem
select test.jako('t44@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_rp_po('x1', 0, 1); begin
  perform test.chk('T12 nauka_rp_po w roczniku testowym', (r->>'ok')::boolean and (r->>'poprawna')::boolean, r);
end $$;
reset role; select test.jako('st10@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_rp_po('x1', 0, 1); begin
  perform test.chk('T12 student BM nie odpowie na pytanie z rocznika testowego', r->>'code' = 'no_question', r);
end $$;
reset role;

-- T13: kalendarz w telefonie (v27): terminy tylko z rocznika osoby
insert into public.nauka_kalendarz (user_id, email, token) values
  ('00000000-0000-0000-0000-000000004401', 't44@x.pl', 'tok-v44-test'), ('00000000-0000-0000-0000-000000000001', 'a@x.pl', 'tok-v44-bm')
on conflict (user_id) do update set token = excluded.token;
do $$ declare t jsonb := public.nauka_kalendarz_dane('tok-v44-test'); b jsonb := public.nauka_kalendarz_dane('tok-v44-bm'); begin
  perform test.chk('T13 kalendarz testowy: tylko jego terminy',
    (t->>'platny')::boolean and (select array_agg(x->>'id' order by x->>'id') from jsonb_array_elements(t->'terminy') x) = array['td1'], t->'terminy');
  perform test.chk('T13 kalendarz BM: bez terminów rocznika testowego',
    (b->>'platny')::boolean and jsonb_array_length(b->'terminy') > 0
    and not exists (select 1 from jsonb_array_elements(b->'terminy') x where x->>'id' = 'td1'), b->'terminy');
end $$;

-- T14: przypomnienia (v36): termin BM w stanie osoby z innego rocznika nie przechodzi
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000004401","email":"t44@x.pl","role":"authenticated"}', false);
set role authenticated;
do $$ begin
  perform public.nauka_przypomnienia_ustaw('{"wlaczone": true, "godz": 1080}');
  perform public.nauka_przypomnienia_stan(('{"v":1,"od":"2026-11-10","ter":[{"d":"2026-11-15","n":"X","dl":"dl-v36-kol"},{"d":"2026-11-15","n":"Y","dl":"td1"}],"pow":[],"rew":[],"zad":false}')::jsonb);
end $$;
reset role; set role service_role;
do $$ declare r jsonb := public.nauka_przypomnienia_kandydaci('2026-11-12 18:05:00+01'); o jsonb; begin
  select x into o from jsonb_array_elements(r->'osoby') x where x->>'email' = 't44@x.pl';
  perform test.chk('T14 przypomnienia: tylko termin z rocznika osoby', o is not null and o->'dl' ? 'td1' and not (o->'dl' ? 'dl-v36-kol'), o);
end $$;
reset role;

-- T15: Boss: termin rocznika testowego tworzy bossa tylko dla tego rocznika
select test.jako('t44@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_bossy(); begin
  perform test.chk('T15 student testowy widzi swojego bossa i tylko jego',
    (select bool_and(x->>'id' = 'td1') and count(*) = 1 from jsonb_array_elements(r->'bossy') x), r);
end $$;
reset role; select test.jako('a@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_bossy(); begin
  perform test.chk('T15 student BM nie widzi bossa rocznika testowego', not exists (select 1 from jsonb_array_elements(r->'bossy') x where x->>'id' = 'td1'), r);
  r := public.nauka_boss_odbierz('td1');
  perform test.chk('T15 student BM nie odbierze nagrody za cudzego bossa', r->>'code' = 'no_boss', r);
end $$;
reset role;
do $$ begin
  perform test.chk('T15 boss ma rocznik testowy, stare bossy BM',
    (select rocznik_id from public.nauka_boss where id = 'td1') = 'wefiz-test-1-st-2026'
    and not exists (select 1 from public.nauka_boss where id <> 'td1' and rocznik_id <> 'wefiz-bm-1-st-2026'), null);
end $$;
-- T16: odpowiedzi osób z BM nie są ciosami w bossa rocznika testowego (ten sam przedmiot makro)
insert into public.nauka_odp (user_id, mid, idx, sid, rodzaj, ok, zrodlo) values ('00000000-0000-0000-0000-000000000001', 'm1', '0', 'makro', 'abcd', true, 'quiz');
do $$ begin
  perform test.chk('T16 ciosy bossa testowego tylko od osób z rocznika testowego',
    not exists (select 1 from public.nauka_boss_ciosy('td1') c where c.user_id = '00000000-0000-0000-0000-000000000001'), null);
  raise notice 'WSZYSTKIE testy v44 OK';
end $$;
