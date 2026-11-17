-- Testy D1–D6 dla skrot-v56-dni-nauki.sql (po v55 i dwóch uruchomieniach v56). Tylko lokalnie (PGlite, test/stub.sql).
reset role;
insert into auth.users (id, email) values ('56565656-0000-4000-8000-000000000001', 'dni1@x.pl'), ('56565656-0000-4000-8000-000000000002', 'dni2@x.pl') on conflict do nothing;
create or replace function test.dayn56(d date) returns int language sql immutable as $$ select d - date '2026-01-01' $$;

-- D1: zapis postępu z XP wczoraj (samo czytanie: XP > 0, 0 pkt) → wpis w nauka_dni ze źródłem xp
select test.jako('dni1@x.pl'); set role authenticated;
insert into public.nauka_docs (kolekcja, id, data) values ('progress', '56565656-0000-4000-8000-000000000001',
  jsonb_build_object('xp', jsonb_build_object('t', 40, 'd', test.dayn56((now() at time zone 'Europe/Warsaw')::date - 1), 'n', 12)))
on conflict (kolekcja, id) do update set data = excluded.data;
reset role;
do $$ declare u uuid := '56565656-0000-4000-8000-000000000001'; d date := (now() at time zone 'Europe/Warsaw')::date; begin
  perform test.chk('D1 XP wczoraj bez punktów → nauka_dni (wczoraj, xp)', exists (select 1 from public.nauka_dni where user_id = u and dzien = d - 1 and zrodlo = 'xp'), null);
  perform test.chk('D1 bez punktów rankingu', not exists (select 1 from public.nauka_rp where user_id = u), null);
  insert into public.nauka_zamrozenia (user_id, req, cena) values (u, 'test56:zam1', 40);
end $$;

-- D2: dzień z samym czytaniem nie zużywa zamrożenia następnego dnia (wynik „nauka”, zapas bez zmian)
select test.jako('dni1@x.pl'); set role authenticated;
do $$ declare r jsonb; d date := (now() at time zone 'Europe/Warsaw')::date; begin
  r := public.nauka_zamrozenie_uzyj_dni(array[d - 1]);
  perform test.chk('D2 wczoraj tylko czytanie: „nauka”, zamrożenie zostaje (1)', (r->>'ok')::boolean and r->'dni'->0->>'wynik' = 'nauka' and (r->>'zostalo')::int = 1, r);
  perform test.chk('D2 nauka_seria(): wczoraj = dzień nauki, seria 1', (public.nauka_seria()->>'seria')::int = 1, public.nauka_seria());
end $$;

-- D3: lista progress.nd z dokumentu NIE tworzy dni nauki (klient mógłby je dopisać); XP = 0 nie jest dniem nauki
reset role; select test.jako('dni2@x.pl'); set role authenticated;
insert into public.nauka_docs (kolekcja, id, data) values ('progress', '56565656-0000-4000-8000-000000000002',
  jsonb_build_object('xp', jsonb_build_object('t', 0, 'd', test.dayn56((now() at time zone 'Europe/Warsaw')::date), 'n', 0),
    'nd', jsonb_build_array(test.dayn56((now() at time zone 'Europe/Warsaw')::date - 2), test.dayn56((now() at time zone 'Europe/Warsaw')::date - 3),
      test.dayn56((now() at time zone 'Europe/Warsaw')::date - 30), test.dayn56((now() at time zone 'Europe/Warsaw')::date + 5), 'x')))
on conflict (kolekcja, id) do update set data = excluded.data;
reset role;
do $$ declare u uuid := '56565656-0000-4000-8000-000000000002'; d date := (now() at time zone 'Europe/Warsaw')::date; begin
  perform test.chk('D3 nd z dokumentu i XP 0 dziś: żadnego dnia nauki', not exists (select 1 from public.nauka_dni where user_id = u), (select jsonb_agg(dzien) from public.nauka_dni where user_id = u));
end $$;

-- D4: punkt rankingu też jest dniem nauki (wyzwalacz na nauka_rp), bez dubli
do $$ declare u uuid := '56565656-0000-4000-8000-000000000002'; d date := (now() at time zone 'Europe/Warsaw')::date; begin
  insert into public.nauka_rp (user_id, dzien, tydzien, zrodlo, klucz, sid, pkt) values (u, d, public.nauka_tydzien(d), 'quiz', 'q:t56', 'makro', 5);
  insert into public.nauka_rp (user_id, dzien, tydzien, zrodlo, klucz, sid, pkt) values (u, d, public.nauka_tydzien(d), 'quiz', 'q:t56b', 'makro', 5);
  perform test.chk('D4 punkty dziś → jeden wpis (dziś, pkt)', (select count(*) = 1 from public.nauka_dni where user_id = u and dzien = d and zrodlo = 'pkt'), null);
end $$;

-- D7: ten sam zapis bez wzrostu XP i dzień sprzed 2 dni nie tworzą dnia nauki
reset role; insert into auth.users (id, email) values ('56565656-0000-4000-8000-000000000003', 'dni3@x.pl') on conflict do nothing;
select test.jako('dni3@x.pl'); set role authenticated;
insert into public.nauka_docs (kolekcja, id, data) values ('progress', '56565656-0000-4000-8000-000000000003',
  jsonb_build_object('xp', jsonb_build_object('t', 50, 'd', test.dayn56((now() at time zone 'Europe/Warsaw')::date - 2), 'n', 5)));
update public.nauka_docs set data = jsonb_build_object('xp', jsonb_build_object('t', 50, 'd', test.dayn56((now() at time zone 'Europe/Warsaw')::date - 1), 'n', 5))
 where kolekcja = 'progress' and id = '56565656-0000-4000-8000-000000000003';
reset role;
do $$ begin
  perform test.chk('D7 dzień sprzed 2 dni i zapis bez wzrostu XP: brak dnia nauki', not exists (select 1 from public.nauka_dni where user_id = '56565656-0000-4000-8000-000000000003'), null);
end $$;
-- D5: student nie czyta i nie pisze nauka_dni bezpośrednio
select test.jako('dni2@x.pl'); set role authenticated;
do $$ begin
  begin perform 1 from public.nauka_dni limit 1; perform test.chk('D5 student nie czyta nauka_dni', false, null);
  exception when insufficient_privilege then perform test.chk('D5 student nie czyta nauka_dni', true, null); end;
  begin insert into public.nauka_dni (user_id, dzien, zrodlo) values (auth.uid(), current_date - 1, 'xp'); perform test.chk('D5 student nie pisze nauka_dni', false, null);
  exception when insufficient_privilege then perform test.chk('D5 student nie pisze nauka_dni', true, null); end;
end $$;

-- D6: uzupełnienie wstecz (drugie uruchomienie migracji nie dubluje) i inne kolekcje bez wpisów
reset role;
do $$ begin
  perform test.chk('D6 jeden wiersz na osobę i dzień', not exists (select user_id, dzien from public.nauka_dni group by 1, 2 having count(*) > 1), null);
  perform test.chk('D6 wpisy z nauka_rp sprzed v56 są w nauka_dni', not exists (select 1 from public.nauka_rp r where not exists (select 1 from public.nauka_dni d where d.user_id = r.user_id and d.dzien = r.dzien)), null);
end $$;
-- D8: v55 uruchomione jeszcze raz po v56 nie cofa dnia nauki z nauka_dni (samo czytanie dalej chroni przed zużyciem zamrożenia)
do $$ begin
  perform test.chk('D8 nauka_dzien_nauki widzi dzień z nauka_dni', public.nauka_dzien_nauki('56565656-0000-4000-8000-000000000001', (now() at time zone 'Europe/Warsaw')::date - 1), null);
end $$;
do $$ begin raise notice 'OK v56: D1–D6'; end $$;
