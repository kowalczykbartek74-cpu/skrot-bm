-- Testy D1–D7 dla skrot-v58-nagroda-dzial.sql (pętla UX-5, etap G1). Tylko lokalnie (PGlite, po test/v51.sql).
-- Osoby: d1 (dostęp), d2 (bez dostępu), d3 (dostęp, inny rocznik). Lekcje: przedmiot ux5-makro, dział 1 (dl1, dl2), dział 2 (dl3).
reset role;
insert into auth.users (id, email)
select ('00000000-0000-0000-0000-0000000058' || lpad(i::text, 2, '0'))::uuid, e
from (values (1,'ux5d1@x.pl'),(2,'ux5d2@x.pl'),(3,'ux5d3@x.pl')) v(i, e) on conflict do nothing;
insert into public.nauka_dostep (email, do_kiedy, user_id) select u.email, current_date + 300, u.id from auth.users u where u.email in ('ux5d1@x.pl') on conflict do nothing;
insert into public.nauka_dostep (email, do_kiedy, user_id, rocznik_id) select u.email, current_date + 300, u.id, 'wefiz-zarz-1-st-2026' from auth.users u where u.email in ('ux5d3@x.pl') on conflict do nothing;
insert into public.nauka_urzadzenia (user_id, device_id, nazwa)
select u.id, '11111111-1111-1111-1111-' || right(u.id::text, 12), 'test' from auth.users u where u.email in ('ux5d1@x.pl','ux5d2@x.pl','ux5d3@x.pl') on conflict do nothing;
insert into public.nauka_profil (user_id, kierunek, rocznik, nick, rocznik_id) values
  ('00000000-0000-0000-0000-000000005801', 'BM', 2026, 'Dzial1', 'wefiz-bm-1-st-2026'),
  ('00000000-0000-0000-0000-000000005803', 'ZARZ', 2026, 'Dzial3', 'wefiz-zarz-1-st-2026')
on conflict (user_id) do update set rocznik_id = excluded.rocznik_id, kierunek = excluded.kierunek;
insert into public.nauka_docs (kolekcja, id, data, rocznik_id) values
  ('materials', 'dl1', '{"subjectId":"ux5-makro","kind":"lesson","unit":1,"title":"L1"}', 'wefiz-bm-1-st-2026'),
  ('materials', 'dl2', '{"subjectId":"ux5-makro","kind":"lesson","unit":1,"title":"L2"}', 'wefiz-bm-1-st-2026'),
  ('materials', 'dl3', '{"subjectId":"ux5-makro","kind":"lesson","unit":2,"title":"L3"}', 'wefiz-bm-1-st-2026'),
  ('materials', 'dz1', '{"subjectId":"ux5-makro","kind":"lesson","unit":1,"title":"Z1"}', 'wefiz-zarz-1-st-2026')
on conflict do nothing;

-- D1: bez logowania i bez dostępu nic
select set_config('request.jwt.claims', '', false);
do $$ declare r jsonb := public.nauka_dzial_nagroda('ux5-makro', '1');
begin perform test.chk('V58 D1 bez logowania: not_logged_in', r->>'code' = 'not_logged_in', r); end $$;
select test.jako('ux5d2@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_dzial_nagroda('ux5-makro', '1');
begin perform test.chk('V58 D1 bez dostępu: no_access', r->>'code' = 'no_access', r); end $$;
reset role;

-- D2: tylko jedna lekcja działu z punktem → nie_wszystkie, bez monet
select test.jako('ux5d1@x.pl'); set role authenticated;
do $$ declare r jsonb;
begin
  perform public.nauka_rp_lekcja('dl1');
  r := public.nauka_dzial_nagroda('ux5-makro', '1');
  perform test.chk('V58 D2 jedna z dwóch lekcji: nie_wszystkie (brak 1)', r->>'code' = 'nie_wszystkie' and (r->>'brak')::int = 1, r);
end $$;
reset role;
do $$ begin perform test.chk('V58 D2 bez wpisu monet za dział', not exists (select 1 from public.nauka_monety where klucz like 'misja:dzial:%'), null); end $$;

-- D3: obie lekcje → +20 raz; D4: drugie wywołanie → juz, bez podwójnej nagrody
select test.jako('ux5d1@x.pl'); set role authenticated;
do $$ declare r jsonb; r2 jsonb;
begin
  perform public.nauka_rp_lekcja('dl2');
  r := public.nauka_dzial_nagroda('ux5-makro', '1');
  perform test.chk('V58 D3 dział 1 zaliczony: +20', (r->>'ok')::boolean and (r->>'monety')::int = 20 and not (r->>'juz')::boolean, r);
  r2 := public.nauka_dzial_nagroda('ux5-makro', '1');
  perform test.chk('V58 D4 drugi raz: juz, 0 monet', (r2->>'ok')::boolean and (r2->>'juz')::boolean and (r2->>'monety')::int = 0, r2);
end $$;
reset role;
do $$ declare u uuid := '00000000-0000-0000-0000-000000005801';
begin
  perform test.chk('V58 D4 jeden wpis +20 z kluczem misja:dzial:ux5-makro:1',
    (select count(*) from public.nauka_monety where user_id = u and klucz = 'misja:dzial:ux5-makro:1' and delta = 20) = 1, null);
end $$;

-- D5: inny dział, bez lekcji z punktem → nie_wszystkie; nieistniejący dział → no_unit
select test.jako('ux5d1@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_dzial_nagroda('ux5-makro', '2'); r2 jsonb := public.nauka_dzial_nagroda('ux5-makro', '9');
begin
  perform test.chk('V58 D5 dział 2 bez lekcji: nie_wszystkie', r->>'code' = 'nie_wszystkie', r);
  perform test.chk('V58 D5 dział bez lekcji w bazie: no_unit', r2->>'code' = 'no_unit', r2);
end $$;
reset role;

-- D6: lekcje innego rocznika nie liczą się do działu (d3 z rocznika ZARZ widzi tylko dz1)
select test.jako('ux5d3@x.pl'); set role authenticated;
do $$ declare r jsonb;
begin
  r := public.nauka_dzial_nagroda('ux5-makro', '1');
  perform test.chk('V58 D6 inny rocznik: liczy tylko swoje lekcje (1)', r->>'code' = 'nie_wszystkie' and (r->>'lekcji')::int = 1, r);
end $$;
reset role;

-- D7: konfiguracja do odczytu dla zalogowanego (strona pokazuje kwotę), a anon nie
select test.jako('ux5d1@x.pl'); set role authenticated;
do $$ begin perform test.chk('V58 D7 zalogowany czyta kwotę nagrody (20)', (public.nauka_dzial_cfg()->>'monety')::int = 20, public.nauka_dzial_cfg()); end $$;
reset role;
set role anon;
do $$ begin
  begin perform public.nauka_dzial_cfg(); perform test.chk('V58 D7 anon nie czyta konfiguracji', false, null);
  exception when insufficient_privilege then perform test.chk('V58 D7 anon nie czyta konfiguracji', true, null); end;
end $$;
reset role;
