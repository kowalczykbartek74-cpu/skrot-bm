-- Testy O1–O5 dla skrot-v24-ocena-ai.sql (dzienny limit oceny AI i odwołania). Konta m1/m2 z test/v14.sql.
-- Tylko lokalnie, na atrapie z test/stub.sql. Każdy test kończy się „OK …”; pierwszy błąd przerywa plik.

-- ---------- O1 limit 2: dwa różne testy przechodzą, trzeci nie ----------
reset role;
select test.jako('m1@x.pl'); set role authenticated;
do $$ declare a jsonb := public.nauka_ocena_ai_bierz('run-a', 2); b jsonb := public.nauka_ocena_ai_bierz('run-b', 2); c jsonb := public.nauka_ocena_ai_bierz('run-c', 2);
begin
  perform test.chk('O1 limit 2: run-a i run-b ok, run-c odrzucony',
    (a->>'ok')::boolean and (b->>'ok')::boolean and not (c->>'ok')::boolean and (c->>'uzyte')::int = 2, jsonb_build_array(a, b, c));
end $$;

-- ---------- O2 ten sam test drugi raz (odświeżenie) nie zjada limitu ----------
do $$ declare a jsonb := public.nauka_ocena_ai_bierz('run-a', 2);
begin
  perform test.chk('O2 run-a jeszcze raz: ok, licznik dalej 2', (a->>'ok')::boolean and (a->>'uzyte')::int = 2, a);
end $$;

-- ---------- O3 inne konto ma własny limit ----------
reset role;
select test.jako('m2@x.pl'); set role authenticated;
do $$ declare a jsonb := public.nauka_ocena_ai_bierz('run-a', 2);
begin
  perform test.chk('O3 m2: własny licznik od 1', (a->>'ok')::boolean and (a->>'uzyte')::int = 1, a);
end $$;

-- ---------- O4 odwołanie: zapis i nadpisanie tego samego pytania, bez dostępu do tabeli wprost ----------
do $$ declare n int; ok1 boolean := public.nauka_ocena_odwolanie('run-a', 'ob1', '{"ai": {"items": []}}'); ok2 boolean := public.nauka_ocena_odwolanie('run-a', 'ob1', '{"ai": {"items": [1]}}');
begin
  reset role; select count(*) into n from public.nauka_ocena_odwolania where item = 'ob1';
  perform test.chk('O4 odwołanie zapisane raz (nadpisane)', ok1 and ok2 and n = 1, jsonb_build_array(ok1, ok2, n));
end $$;
select test.jako('m2@x.pl'); set role authenticated;
do $$ begin
  begin perform 1 from public.nauka_ocena_odwolania; perform test.chk('O5 student nie czyta tabeli odwołań', false, null);
  exception when insufficient_privilege then perform test.chk('O5 student nie czyta tabeli odwołań ani licznika', true, null); end;
end $$;

-- ---------- O6 niezalogowany (anon) nie wywoła funkcji ----------
reset role; set request.jwt.claims = '{}'; set role anon;
do $$ begin
  begin perform public.nauka_ocena_ai_bierz('x', 5); perform set_config('test.o6', 'wolno', false);
  exception when insufficient_privilege then perform set_config('test.o6', 'zablokowane', false); end;
end $$;
reset role;
do $$ begin perform test.chk('O6 anon nie wywoła funkcji', current_setting('test.o6') = 'zablokowane', to_jsonb(current_setting('test.o6'))); end $$;
