-- Testy L1–L12 dla skrot-v35-lejek.sql (po test/v34.sql). PGlite nie ma pg_cron: sprawdzamy same funkcje.
-- Osobny rocznik testowy (Ekonomia 2026), żeby dane z wcześniejszych testów nie mieszały się z liczbami.
reset role;
insert into public.nauka_roczniki (id, kierunek_id, nabor, status) values ('wefiz-ek-1-st-2026', 'wefiz-ek-1-st', 2026, 'plan') on conflict do nothing;
grant execute on function test.chk(text, boolean, jsonb) to anon, service_role;

-- L1: wejście bez logowania: sumy dzienne, bez osoby; zły rocznik i złe źródło → puste
set role anon;
do $$ declare r jsonb; begin
  r := public.nauka_wejscie('wefiz-ek-1-st-2026', 'ig');
  perform public.nauka_wejscie('wefiz-ek-1-st-2026', 'ig');
  perform public.nauka_wejscie(null, null);
  perform public.nauka_wejscie('nie-ma-takiego', 'Zle Zrodlo!');
  perform test.chk('L1 anon liczy wejście', (r->>'ok')::boolean, r);
  begin perform count(*) from public.nauka_wejscia_dzien; perform test.chk('L1 anon nie czyta sum', false, null);
  exception when insufficient_privilege then perform test.chk('L1 anon nie czyta sum', true, null); end;
  begin perform public.nauka_lejek_policz(); perform test.chk('L1 anon nie liczy podsumowania', false, null);
  exception when insufficient_privilege then perform test.chk('L1 anon nie liczy podsumowania', true, null); end;
  begin perform public.nauka_admin_lejek(); perform test.chk('L1 anon nie widzi panelu', false, null);
  exception when insufficient_privilege then perform test.chk('L1 anon nie widzi panelu', true, null); end;
end $$;
reset role;
do $$ declare d date := (now() at time zone 'Europe/Warsaw')::date; begin
  perform test.chk('L2 dwa wejścia z ig w jednym wierszu, puste rocznik/źródło dla złych danych',
    (select wejscia from public.nauka_wejscia_dzien where dzien = d and rocznik_id = 'wefiz-ek-1-st-2026' and zrodlo = 'ig') = 2
    and (select wejscia from public.nauka_wejscia_dzien where dzien = d and rocznik_id = '' and zrodlo = '') = 2,
    (select jsonb_agg(to_jsonb(w)) from public.nauka_wejscia_dzien w));
  perform test.chk('L2 tabela nie ma kolumny z osobą ani IP',
    not exists (select 1 from information_schema.columns where table_name = 'nauka_wejscia_dzien' and column_name in ('user_id', 'ip', 'email', 'device_id')), null);
end $$;
-- L3: najwyżej 50 różnych źródeł dziennie, dalej „inne”
do $$ declare i int; d date := (now() at time zone 'Europe/Warsaw')::date; begin
  for i in 1..60 loop perform public.nauka_wejscie(null, 'zr' || i); end loop;
  perform test.chk('L3 ≤ 50 źródeł dziennie + „inne”',
    (select count(distinct zrodlo) from public.nauka_wejscia_dzien where dzien = d) <= 51
    and (select wejscia from public.nauka_wejscia_dzien where dzien = d and zrodlo = 'inne' and rocznik_id = '') >= 10, null);
  delete from public.nauka_wejscia_dzien where zrodlo ~ '^zr[0-9]+$' or zrodlo = 'inne';
end $$;

-- Dane: 6 osób w roczniku Ekonomia 2026, konta założone 40 dni temu (5) i dziś (1).
do $$
declare i int; u uuid; t0 timestamptz := now() - interval '40 days';
begin
  insert into public.nauka_docs (kolekcja, id, data) values ('materials', 'ek-lekcja-1', '{"subjectId":"mikro"}'), ('materials', 'ek-lekcja-2', '{"subjectId":"mikro"}')
  on conflict do nothing;
  for i in 1..6 loop
    u := ('00000000-0000-0000-0000-0000000035' || lpad(i::text, 2, '0'))::uuid;
    insert into auth.users (id, email, created_at) values (u, 'lej' || i || '@x.pl', case when i = 6 then now() else t0 end) on conflict do nothing;
    insert into public.nauka_profil (user_id, rocznik_id, rocznik_wybrany_at) values (u, 'wefiz-ek-1-st-2026', case when i <= 5 then now() end)
    on conflict (user_id) do update set rocznik_id = excluded.rocznik_id, rocznik_wybrany_at = excluded.rocznik_wybrany_at;
    -- D1: osoby 1–4 uczyły się dzień po założeniu; D7: 1–3; D30: 1–2
    if i <= 4 then insert into public.nauka_zdarzenia (user_id, klient_id, typ, kiedy, dane) values (u, gen_random_uuid(), 'activity', t0 + interval '1 day', '{"kind":"quiz"}'); end if;
    if i <= 3 then insert into public.nauka_zdarzenia (user_id, klient_id, typ, kiedy, dane) values (u, gen_random_uuid(), 'activity', t0 + interval '8 days', '{"kind":"quiz"}'); end if;
    if i <= 2 then insert into public.nauka_powtorki_log (user_id, klucz, ok, first, wiek, at) values (u, 'q:ek-lekcja-1:x', true, true, 9, t0 + interval '31 days'); end if;
    -- test „Jak się uczysz?” nie jest dniem nauki
    if i = 5 then insert into public.nauka_zdarzenia (user_id, klient_id, typ, kiedy, dane) values (u, gen_random_uuid(), 'profile_test', t0 + interval '1 day', '{}'); end if;
    -- Czy uczy (ostatnie dni): każda z 5 osób 2 pierwsze odpowiedzi po ≥ 7 dniach w lekcji 1 (wariant „haczyk”), 1 dobra;
    -- osoba 1 dodatkowo: druga odpowiedź w sesji (first = false) i świeża (wiek 2) – nie liczą się
    if i <= 5 then
      insert into public.nauka_powtorki_log (user_id, klucz, ok, first, wiek, at) values
        (u, 'q:ek-lekcja-1:a', true, true, 8, now() - interval '1 hour'), (u, 'q:ek-lekcja-1:b', false, true, 10, now() - interval '1 hour');
      insert into public.nauka_zdarzenia (user_id, klient_id, typ, kiedy, dane) values
        (u, gen_random_uuid(), 'exit_ticket', now() - interval '2 days', jsonb_build_object('lessonId', 'ek-lekcja-1', 'score', case when i <= 4 then 3 else 1 end, 'max', 3, 'hak', 'haczyk')),
        (u, gen_random_uuid(), 'exit_ticket', now() - interval '2 days', jsonb_build_object('lessonId', 'ek-lekcja-2', 'score', 'zle', 'max', 3, 'hak', 'bez')),
        (u, gen_random_uuid(), 'activity', now() - interval '3 days', jsonb_build_object('kind', 'rewanz', 'wynik', case when i <= 3 then 'won' when i = 4 then 'defeated' else 'lost' end));
    end if;
    if i = 1 then insert into public.nauka_powtorki_log (user_id, klucz, ok, first, wiek, at) values (u, 'q:ek-lekcja-1:a', false, false, 8, now()), (u, 'q:ek-lekcja-1:c', false, true, 2, now()); end if;
  end loop;
  -- okres próbny: 3 osoby; zakup przez Stripe: 1 (po e-mailu), 1 ręczny dostęp się nie liczy
  insert into public.nauka_proby (user_id, email, od, do_kiedy) select ('00000000-0000-0000-0000-0000000035' || lpad(g::text, 2, '0'))::uuid, 'lej' || g || '@x.pl', now(), now() + interval '3 days'
    from generate_series(1, 3) g on conflict do nothing;
  insert into public.nauka_dostep (email, do_kiedy, zrodlo) values ('lej1@x.pl', current_date + 300, 'stripe'), ('lej2@x.pl', current_date + 300, 'recznie') on conflict (email) do nothing;
end $$;

-- L4: liczenie tylko dla service_role (cron) i administratora
set role authenticated;
do $$ begin
  begin perform public.nauka_lejek_policz(); perform test.chk('L4 przeglądarka nie woła liczenia wprost', false, null);
  exception when insufficient_privilege then perform test.chk('L4 przeglądarka nie woła liczenia wprost', true, null); end;
end $$;
reset role;
set role service_role;
do $$ declare r jsonb := public.nauka_lejek_policz(); begin
  perform test.chk('L4 nocne liczenie: wszystkie roczniki + „*”', (r->>'ok')::boolean and (r->>'roczniki')::int >= 3, r);
  r := public.nauka_lejek_policz();
  perform test.chk('L4 drugie liczenie tego samego dnia nadpisuje (bez duplikatów)', (r->>'ok')::boolean, r);
end $$;
reset role;

-- L5–L11: panel administratora
do $$ begin
  perform set_config('request.jwt.claims', jsonb_build_object('sub', gen_random_uuid(), 'email', 'student35@x.pl', 'role', 'authenticated')::text, false);
end $$;
set role authenticated;
do $$ begin
  perform test.chk('L5 nie-admin nie widzi panelu ani „Przelicz”', public.nauka_admin_lejek()->>'code' = 'not_admin' and public.nauka_admin_lejek_przelicz()->>'code' = 'not_admin', null);
end $$;
reset role;
do $$ declare a text := (select email from public.nauka_admini limit 1); begin
  perform set_config('request.jwt.claims', jsonb_build_object('sub', gen_random_uuid(), 'email', a, 'role', 'authenticated')::text, false);
end $$;
set role authenticated;
do $$ declare r jsonb := public.nauka_admin_lejek_przelicz(); e jsonb; l jsonb; u jsonb; begin
  e := r->'dane'->'wefiz-ek-1-st-2026';
  perform test.chk('L5 admin: podsumowanie z dzisiaj, rocznik testowy na liście roczników',
    (r->>'ok')::boolean and (r->>'dzien')::date = (now() at time zone 'Europe/Warsaw')::date
    and exists (select 1 from jsonb_array_elements(r->'roczniki') x where x->>'id' = 'wefiz-ek-1-st-2026' and x->>'pl' = 'Ekonomia') and e is not null, r->'roczniki');
  l := e->'lejek'->'wszystko';
  perform test.chk('L6 lejek od początku: wejścia 2, konta 6, wybór 5, próba 3, zakup 1 (tylko Stripe)',
    (l->>'wejscia')::int = 2 and (l->>'konta')::int = 6 and (l->>'wybor')::int = 5 and (l->>'proba')::int = 3 and (l->>'zakup')::int = 1, l);
  l := e->'lejek'->'d28';
  perform test.chk('L6 lejek 28 dni: tylko konto z dzisiaj', (l->>'konta')::int = 1 and (l->>'wejscia')::int = 2, l);
  perform test.chk('L7 powroty: D1 4/5, D7 3/5, D30 2/5 (konto z dzisiaj jeszcze nie liczy się; test profilu to nie nauka)',
    e->'retencja'->'d1' = '{"mozliwe":5,"aktywne":4}' and e->'retencja'->'d7' = '{"mozliwe":5,"aktywne":3}' and e->'retencja'->'d30' = '{"mozliwe":5,"aktywne":2}', e->'retencja');
  select x into u from jsonb_array_elements(e->'uczy') x where x->>'sid' = 'mikro' and x->>'tydzien' = to_char(date_trunc('week', now() at time zone 'Europe/Warsaw'), 'YYYY-MM-DD');
  perform test.chk('L8 czy uczy (ten tydzień, przedmiot mikro): 5 osób, 10 pierwszych odpowiedzi po ≥ 7 dniach, 5 dobrych',
    (u->>'osoby')::int = 5 and (u->>'odp')::int = 10 and (u->>'ok')::int = 5, e->'uczy');
  perform test.chk('L8 wiersz „razem” (*) obok przedmiotu', exists (select 1 from jsonb_array_elements(e->'uczy') x where x->>'sid' = '*' and (x->>'odp')::int >= 10), e->'uczy');
  perform test.chk('L9 rewanże 28 dni: 4 wygrane (1 pokonane) z 5, 5 osób',
    e->'rewanze' = '{"wygrane":4,"pokonane":1,"wszystkie":5,"osoby":5}', e->'rewanze');
  perform test.chk('L10 A/B haczyka: „haczyk” 5 biletów, 4 zdane, 12 odp. po 7 dniach (od początku: 10 z tego tygodnia + 2 sprzed miesiąca); „bez”: zły wynik nie psuje liczenia',
    (e->'ab'->'haczyk'->'haczyk'->>'bilety')::int = 5 and (e->'ab'->'haczyk'->'haczyk'->>'zdane')::int = 4 and (e->'ab'->'haczyk'->'haczyk'->>'odp')::int = 12 and (e->'ab'->'haczyk'->'haczyk'->>'ok')::int = 7
    and (e->'ab'->'haczyk'->'bez'->>'bilety')::int = 5 and (e->'ab'->'haczyk'->'bez'->>'zdane')::int = 0, e->'ab');
  perform test.chk('L11 „*”: wszystkie roczniki, lista oczekujących i wejścia według źródła',
    r->'dane'->'*'->'oczekujacy'->'wszystko' ? 'potwierdzone' and (r->'dane'->'*'->'wejscia_zrodla'->>'ig')::int = 2
    and (r->'dane'->'*'->'lejek'->'wszystko'->>'konta')::int >= 6, r->'dane'->'*'->'oczekujacy');
  perform test.chk('L11 rocznik bez zapisów list i źródeł (są tylko w „*”)', e->'oczekujacy' = 'null'::jsonb and e->'wejscia_zrodla' = 'null'::jsonb, null);
end $$;
reset role;
select set_config('request.jwt.claims', '', false);

-- L12: administrator nie liczy się w lejku; historia: jeden wiersz na dzień i rocznik
do $$ begin
  perform test.chk('L12 jeden wiersz na dzień i rocznik', (select count(*) from public.nauka_lejek_dzien where rocznik_id = 'wefiz-ek-1-st-2026') = 1, null);
  perform test.chk('L12 konta administratorów poza lejkiem',
    not exists (select 1 from public.nauka_lejek_konta() k join auth.users u on u.id = k.user_id join public.nauka_admini a on a.email = lower(u.email)), null);
end $$;
