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
do $$ begin raise notice 'OK v57: K1–K3'; end $$;
