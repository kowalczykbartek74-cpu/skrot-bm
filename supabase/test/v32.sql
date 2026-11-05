-- Testy U1–U8 dla skrot-v32-usun-konto.sql. Uruchamiaj na końcu (po test/v31.sql): bierze konta z danymi z wcześniejszych testów.
reset role;
grant usage on schema public, test to service_role; grant execute on function test.chk(text, boolean, jsonb) to service_role;
create table if not exists test.v32 (k text primary key, v jsonb);
grant all on test.v32 to service_role;
-- Osoba z największą liczbą tabel ze śladami (konto z kilku testów naraz) i druga osoba do porównania.
do $$
declare best uuid; best_email text; best_n int := -1; other uuid; other_email text; u record; s jsonb;
begin
  for u in select id, email from auth.users where email is not null loop
    s := public.nauka_konto_slady(u.id, u.email);
    if (select count(*) from jsonb_object_keys(s)) > best_n and not exists (select 1 from public.nauka_admini a where lower(a.email) = lower(u.email)) then
      other := best; other_email := best_email; best := u.id; best_email := u.email; best_n := (select count(*) from jsonb_object_keys(s));
    elsif other is null then other := u.id; other_email := u.email;
    end if;
  end loop;
  insert into test.v32 values ('kto', jsonb_build_object('uid', best, 'email', best_email, 'other', other, 'other_email', other_email)) on conflict (k) do update set v = excluded.v;
end $$;
-- Dorzucamy ślady w miejscach obsługiwanych ręcznie: postęp, „Moje materiały”, zgłoszenie we wspólnej kolekcji, polecenia.
do $$
declare kk jsonb := (select v from test.v32 where k = 'kto'); uid uuid := (kk->>'uid')::uuid; em text := lower(kk->>'email'); ot uuid := (kk->>'other')::uuid;
begin
  -- autora dokumentu ustawia baza z sesji (wyzwalacz), jak przy zapisie ze strony
  perform set_config('request.jwt.claims', jsonb_build_object('sub', uid, 'email', em)::text, true);
  insert into public.nauka_docs (kolekcja, id, data, created_by) values ('progress', uid::text, '{"srs":{}}', uid) on conflict (kolekcja, id) do update set data = excluded.data;
  insert into public.nauka_docs (kolekcja, id, data, created_by) values ('myMaterials', 'u32-m', '{"title":"moje"}', uid) on conflict (kolekcja, id) do nothing;
  insert into public.nauka_docs (kolekcja, id, data, created_by) values ('reports', 'u32-r', jsonb_build_object('note', 'zła odpowiedź', 'by', uid::text), uid) on conflict (kolekcja, id) do nothing;
  perform set_config('request.jwt.claims', jsonb_build_object('sub', ot)::text, true);
  insert into public.nauka_docs (kolekcja, id, data, created_by) values ('progress', ot::text, '{"srs":{"a":1}}', ot) on conflict (kolekcja, id) do nothing;
  perform set_config('request.jwt.claims', '', true);
  insert into public.nauka_dostep (email, do_kiedy, zrodlo, plan, user_id) values (em, current_date + 30, 'stripe-miesiac', 'miesiac', uid) on conflict do nothing;
  insert into public.nauka_polecenia (kod, polecajacy, kupujacy_email, kupujacy_uid, stripe_session, nagroda_gr) values ('U32A', uid, 'ktos32@x.pl', null, 'cs_u32_a', 2000);
  insert into public.nauka_polecenia (kod, polecajacy, kupujacy_email, kupujacy_uid, stripe_session, nagroda_gr) values ('U32B', ot, em, uid, 'cs_u32_b', 2000);
  insert into test.v32 values ('przed', public.nauka_konto_slady(uid, em)), ('inny_przed', public.nauka_konto_slady(ot, kk->>'other_email'))
    on conflict (k) do update set v = excluded.v;
end $$;

-- U1: przeglądarka (anon, authenticated) nie może wołać funkcji
set role authenticated;
do $$ begin
  begin perform public.nauka_konto_usun_dane('00000000-0000-0000-0000-000000000001', 'x@x.pl'); perform test.chk('U1 authenticated nie usuwa', false, null);
  exception when insufficient_privilege then perform test.chk('U1 authenticated nie usuwa', true, null); end;
  begin perform public.nauka_konto_slady('00000000-0000-0000-0000-000000000001', 'x@x.pl'); perform test.chk('U1 authenticated nie czyta śladów', false, null);
  exception when insufficient_privilege then perform test.chk('U1 authenticated nie czyta śladów', true, null); end;
end $$;
reset role;

-- U2: usuwanie jako service_role
set role service_role;
do $$
declare kk jsonb := (select v from test.v32 where k = 'kto'); r jsonb;
begin
  r := public.nauka_konto_usun_dane((kk->>'uid')::uuid, kk->>'email');
  insert into test.v32 values ('wynik', r) on conflict (k) do update set v = excluded.v;
end $$;
reset role;

do $$
declare kk jsonb := (select v from test.v32 where k = 'kto'); uid uuid := (kk->>'uid')::uuid; em text := lower(kk->>'email'); ot uuid := (kk->>'other')::uuid;
  przed jsonb := (select v from test.v32 where k = 'przed'); po jsonb := public.nauka_konto_slady(uid, em);
begin
  perform test.chk('U2 przed usunięciem ślady w wielu tabelach (≥ 8)', (select count(*) from jsonb_object_keys(przed)) >= 8, przed);
  perform test.chk('U3 po usunięciu w bazie zostaje tylko konto w Auth (kasuje je funkcja Edge)', po - 'auth.users' = '{}'::jsonb, po);
  perform test.chk('U4 postęp i „Moje materiały” usunięte, zgłoszenie zostaje bez autora',
    not exists (select 1 from public.nauka_docs where (kolekcja = 'progress' and id = uid::text) or id = 'u32-m')
    and exists (select 1 from public.nauka_docs where id = 'u32-r' and created_by is null and not (data ? 'by') and data->>'note' = 'zła odpowiedź'), null);
  perform test.chk('U5 polecenia: własne usunięte, zakup przez cudze polecenie bez danych kupującego',
    not exists (select 1 from public.nauka_polecenia where stripe_session = 'cs_u32_a')
    and exists (select 1 from public.nauka_polecenia where stripe_session = 'cs_u32_b' and kupujacy_uid is null and kupujacy_email like 'usuniete-%@usuniete.invalid' and polecajacy = ot), null);
  perform test.chk('U6 dane innej osoby nietknięte',
    public.nauka_konto_slady(ot, kk->>'other_email') = (select v from test.v32 where k = 'inny_przed'), jsonb_build_object('po', public.nauka_konto_slady(ot, kk->>'other_email'), 'przed', (select v from test.v32 where k = 'inny_przed')));
  perform test.chk('U7 wynik mówi, z których tabel ile usunięto', (select v from test.v32 where k = 'wynik') ? 'nauka_dostep', (select v from test.v32 where k = 'wynik'));
end $$;

-- U8: konta administratora tak się nie usuwa; po usunięciu z Auth zapytanie kontrolne jest puste
insert into test.v32 values ('admin', to_jsonb((select email from public.nauka_admini limit 1))) on conflict (k) do update set v = excluded.v;
set role service_role;
do $$
declare a text := (select v #>> '{}' from test.v32 where k = 'admin');
begin
  if a is null then perform test.chk('U8 jest administrator w danych testowych', false, null); return; end if;
  begin perform public.nauka_konto_usun_dane('00000000-0000-0000-0000-0000000000aa', a); perform test.chk('U8 administrator odmowa', false, null);
  exception when others then perform test.chk('U8 administrator odmowa', sqlerrm like '%administratora%', to_jsonb(sqlerrm)); end;
end $$;
reset role;
do $$
declare kk jsonb := (select v from test.v32 where k = 'kto');
begin
  delete from auth.users where id = (kk->>'uid')::uuid;
  perform test.chk('U8 po usunięciu konta w Auth: zero śladów', public.nauka_konto_slady((kk->>'uid')::uuid, kk->>'email') = '{}'::jsonb, public.nauka_konto_slady((kk->>'uid')::uuid, kk->>'email'));
end $$;
