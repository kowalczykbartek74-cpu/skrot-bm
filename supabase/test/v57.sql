-- Testy K1–K4 dla skrot-v57-kanal-zadania.sql (po v36 i v16 – osoby przyp1@x.pl i t1@x.pl z ich testów). Tylko lokalnie (PGlite).
reset role;
set role service_role;
do $$ declare r jsonb; o jsonb; begin
  r := public.nauka_przypomnienia_kandydaci('2026-11-06 18:00:00+01');
  select x into o from jsonb_array_elements(r->'osoby') x where x->>'email' = 'przyp1@x.pl';
  perform test.chk('K1 historia przypomnień z rodzajem (rotacja wariantów)', o->'historia'->0->>'rodzaj' = 'termin' and o->'historia'->0->>'day' = '2026-11-05', o->'historia');
end $$;
reset role;
do $$ begin
  perform test.chk('K2 kalendarz: bez progress.calStudy → false', public.nauka_kalendarz_nauka('tok-t1') = false, null);
  update public.nauka_docs set data = data || '{"calStudy": true}' where kolekcja = 'progress' and id = (select id::text from auth.users where email = 't1@x.pl');
  if not found then insert into public.nauka_docs (kolekcja, id, data) select 'progress', id::text, '{"calStudy": true}' from auth.users where email = 't1@x.pl'; end if;
  perform test.chk('K2 kalendarz: calStudy = true → true', public.nauka_kalendarz_nauka('tok-t1') = true, null);
  perform test.chk('K2 zły token → false', public.nauka_kalendarz_nauka('nie-ma') = false, null);
  perform test.chk('K3 zalogowany ani anon nie wołają nauka_kalendarz_nauka', not has_function_privilege('authenticated', 'public.nauka_kalendarz_nauka(text)', 'execute')
    and not has_function_privilege('anon', 'public.nauka_kalendarz_nauka(text)', 'execute'), null);
end $$;
select test.jako('przyp1@x.pl'); set role authenticated;
do $$ declare r jsonb; begin
  r := public.nauka_przypomnienia_ustaw('{"co": {"terminy": true, "powtorki": true, "zadanie": true, "seria": false}}');
  perform test.chk('K4 ustawienia: rodzaj „seria” zapisany (false)', (r->>'ok')::boolean and (r->'co'->>'seria')::boolean = false, r);
  r := public.nauka_przypomnienia_ustaw('{"co": {"terminy": true}}');
  perform test.chk('K4 brak pola „seria” → domyślnie true', (r->'co'->>'seria')::boolean = true, r);
end $$;
reset role;
-- ---------- K5 auto-odbiór zadań: 10 dobrych odpowiedzi → +8 bez Sklepu, bez podwójnej nagrody ----------
insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000005701', 'z57@x.pl');
insert into public.nauka_dostep (email, do_kiedy, user_id) values ('z57@x.pl', current_date + 300, '00000000-0000-0000-0000-000000005701');
insert into public.nauka_urzadzenia (user_id, device_id, nazwa) values ('00000000-0000-0000-0000-000000005701', '11111111-1111-1111-1111-000000005701', 'test');
do $$ declare u uuid := '00000000-0000-0000-0000-000000005701'; d date; s0 int; n int;
begin
  select public.nauka_dzis() + i into d from generate_series(0, 14) i
   where public.nauka_misje_na(public.nauka_dzis() + i) @> '[{"id":"odp10"}]' order by i limit 1;
  perform test.chk('K5 odp10 w rotacji w ciągu 2 tygodni', d is not null, null);
  s0 := public.nauka_saldo(u);
  insert into public.nauka_rp (user_id, dzien, tydzien, zrodlo, klucz, sid, pkt)
  select u, d, public.nauka_tydzien(d), 'quiz', 'q:t57:' || i, 'makro', 1 from generate_series(1, 9) i;
  perform test.chk('K5 9 odpowiedzi: zadanie jeszcze nieodebrane', not exists (select 1 from public.nauka_monety m where m.user_id = u and m.klucz = 'misja:odp10:' || d::text), null);
  insert into public.nauka_rp (user_id, dzien, tydzien, zrodlo, klucz, sid, pkt) values (u, d, public.nauka_tydzien(d), 'quiz', 'q:t57:10', 'makro', 1);
  perform test.chk('K5 10. dobra odpowiedź → zadanie odebrane samo: +8 (i 1 moneta za 10 pkt)',
    (select delta from public.nauka_monety m where m.user_id = u and m.klucz = 'misja:odp10:' || d::text) = 8 and public.nauka_saldo(u) = s0 + 9, to_jsonb(public.nauka_saldo(u) - s0));
  insert into public.nauka_rp (user_id, dzien, tydzien, zrodlo, klucz, sid, pkt) values (u, d, public.nauka_tydzien(d), 'quiz', 'q:t57:11', 'makro', 1);
  select count(*) into n from public.nauka_monety m where m.user_id = u and m.zrodlo = 'misja' and m.klucz = 'misja:odp10:' || d::text;
  perform test.chk('K5 kolejne odpowiedzi: bez podwójnej nagrody', n = 1, to_jsonb(n));
  perform test.chk('K5 funkcja auto niedostępna dla stron', not has_function_privilege('authenticated', 'public.nauka_misje_auto(uuid, date)', 'execute')
    and not has_function_privilege('anon', 'public.nauka_misje_auto(uuid, date)', 'execute'), null);
end $$;
-- ręczny odbiór dalej działa: dzisiejsze zadanie zrobione → auto już odebrało → „already”
do $$ declare u uuid := '00000000-0000-0000-0000-000000005701'; d date := public.nauka_dzis(); begin
  insert into public.nauka_rp (user_id, dzien, tydzien, zrodlo, klucz, sid, pkt)
  select u, d, public.nauka_tydzien(d), z, k, 'makro', 1
  from (select 'quiz' z, 'q:d57:' || i k from generate_series(1, 25) i
        union all select 'quiz', 'z:d57:' || i from generate_series(1, 2) i
        union all select 'powtorka', 'p:d57:' || i from generate_series(1, 10) i
        union all select 'lekcja', 'l:d57:' || i from generate_series(1, 5) i
        union all select 'gra', 'g:d57' union all select 'wynik', 'r:d57' union all select 'haslo', 'h:d57') x;
end $$;
select test.jako('z57@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_misje(); m jsonb; a jsonb; begin
  select e into m from jsonb_array_elements(r->'misje') e where (e->>'postep')::int >= (e->>'ile')::int limit 1;
  a := public.nauka_misja_odbierz(m->>'id');
  perform test.chk('K5 zrobione dziś: w nauka_misje „odebrana”, ręczny odbiór → already', m is not null and (m->>'odebrana')::boolean and a->>'code' = 'already', jsonb_build_array(m, a));
end $$;
reset role;
do $$ begin raise notice 'OK v57: K1–K5'; end $$;
