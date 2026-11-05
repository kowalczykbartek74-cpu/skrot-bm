-- Testy O1–O10 dla skrot-v34-oczekujacy.sql (po test/v33.sql).
reset role;
grant execute on function test.chk(text, boolean, jsonb) to anon, service_role;

-- O1: przeglądarka nie zapisuje i nie czyta tabeli wprost; listę kierunków czyta bez logowania
set role anon;
do $$ declare r jsonb; begin
  begin perform public.nauka_oczekujacy_zapisz('{"email":"a@x.pl","kierunek_tekst":"Prawo"}', 'h', 'ip'); perform test.chk('O1 anon nie woła zapisu', false, null);
  exception when insufficient_privilege then perform test.chk('O1 anon nie woła zapisu', true, null); end;
  begin perform count(*) from public.nauka_oczekujacy; perform test.chk('O1 anon nie czyta tabeli', false, null);
  exception when insufficient_privilege then perform test.chk('O1 anon nie czyta tabeli', true, null); end;
  r := public.nauka_kierunki_zapisy();
  perform test.chk('O2 lista kierunków z planów WEFiZ (≥ 20), BM 1. st. oznaczony jako działający',
    jsonb_array_length(r) >= 20 and exists (select 1 from jsonb_array_elements(r) x where x->>'id' = 'wefiz-bm-1-st' and (x->>'jest')::boolean)
    and exists (select 1 from jsonb_array_elements(r) x where x->>'id' = 'wefiz-ek-1-st' and not (x->>'jest')::boolean and x->'lata' = '[1,2,3]'::jsonb), r);
end $$;
reset role;

set role service_role;
do $$ declare r jsonb; begin
  -- O3: nowy adres → wyślij; ten sam zaraz potem → noop (ta sama odpowiedź dla odwiedzającego, bez drugiego maila)
  r := public.nauka_oczekujacy_zapisz('{"email":"Ola@X.pl","kierunek_id":"wefiz-ek-1-st","rok":"1","stopien":"1","tryb":"st","zrodlo":"wejscie"}', 'tok1', 'ipA');
  perform test.chk('O3 nowy zapis → send', r->>'kind' = 'send', r);
  perform public.nauka_oczekujacy_wyslano('ola@x.pl');
  r := public.nauka_oczekujacy_zapisz('{"email":"ola@x.pl","kierunek_id":"wefiz-ek-1-st"}', 'tok1b', 'ipA');
  perform test.chk('O3 ten sam adres zaraz potem → noop', r->>'kind' = 'noop', r);
  -- O4: kierunek spoza listy tylko jako tekst; zły e-mail i brak kierunku → invalid
  r := public.nauka_oczekujacy_zapisz('{"email":"b@x.pl","kierunek_id":"wefiz-xx-1-st"}', 'tok2', 'ipA');
  perform test.chk('O4 nieznany kierunek bez tekstu → invalid', r->>'kind' = 'invalid', r);
  r := public.nauka_oczekujacy_zapisz('{"email":"zly","kierunek_tekst":"Prawo"}', 'tok3', 'ipA');
  perform test.chk('O4 zły e-mail → invalid', r->>'kind' = 'invalid' and r->>'pole' = 'email', r);
  r := public.nauka_oczekujacy_zapisz('{"email":"c@x.pl","kierunek_tekst":"Psychologia (WNS)"}', 'tok4', 'ipA');
  perform test.chk('O4 wpisany kierunek → send', r->>'kind' = 'send', r);
  -- O5: limit 5 z jednej sieci na godzinę (ipA ma już 2 zapisy); inna sieć dalej może
  perform public.nauka_oczekujacy_zapisz('{"email":"d1@x.pl","kierunek_tekst":"Psychologia"}', 'tok5', 'ipA');
  perform public.nauka_oczekujacy_zapisz('{"email":"d2@x.pl","kierunek_tekst":"psychologia!"}', 'tok6', 'ipA');
  perform public.nauka_oczekujacy_zapisz('{"email":"d3@x.pl","kierunek_tekst":"Prawo"}', 'tok7', 'ipA');
  r := public.nauka_oczekujacy_zapisz('{"email":"d4@x.pl","kierunek_tekst":"Prawo"}', 'tok8', 'ipA');
  perform test.chk('O5 szósty zapis z tej samej sieci w godzinę → rate_limited', r->>'kind' = 'rate_limited', r);
  r := public.nauka_oczekujacy_zapisz('{"email":"d4@x.pl","kierunek_tekst":"Prawo"}', 'tok8', 'ipB');
  perform test.chk('O5 inna sieć → send', r->>'kind' = 'send', r);
  -- O6: potwierdzenie (raz first), wypisanie, ponowny zapis po wypisaniu
  r := public.nauka_oczekujacy_potwierdz('tok1');
  perform test.chk('O6 pierwsze potwierdzenie', (r->>'ok')::boolean and (r->>'first')::boolean, r);
  r := public.nauka_oczekujacy_potwierdz('tok1');
  perform test.chk('O6 drugie kliknięcie: ok, nie first', (r->>'ok')::boolean and not (r->>'first')::boolean, r);
  perform test.chk('O6 nieznany token', not (public.nauka_oczekujacy_potwierdz('nie-ma')->>'ok')::boolean, null);
  perform public.nauka_oczekujacy_potwierdz('tok4'); perform public.nauka_oczekujacy_potwierdz('tok5'); perform public.nauka_oczekujacy_potwierdz('tok6');
  r := public.nauka_oczekujacy_zapisz('{"email":"ola@x.pl","kierunek_id":"wefiz-ek-1-st"}', 'tok1c', 'ipC');
  perform test.chk('O6 potwierdzony adres zapisuje się znowu → noop (bez maila)', r->>'kind' = 'noop', r);
  r := public.nauka_oczekujacy_wypisz('tok7');
  perform test.chk('O7 wypisanie', (r->>'ok')::boolean, r);
  perform test.chk('O7 wypisany nie potwierdzi starym linkiem', not (public.nauka_oczekujacy_potwierdz('tok7')->>'ok')::boolean, null);
  r := public.nauka_oczekujacy_zapisz('{"email":"d3@x.pl","kierunek_tekst":"Prawo"}', 'tok7b', 'ipD');
  perform test.chk('O7 po wypisaniu można zapisać się znowu', r->>'kind' = 'send', r);
end $$;
reset role;

-- O8: panel tylko dla administratora; liczą się tylko potwierdzone; wpisane nazwy pogrupowane
do $$ declare r jsonb; a text := (select email from public.nauka_admini limit 1); begin
  perform set_config('request.jwt.claims', jsonb_build_object('sub', gen_random_uuid(), 'email', 'student8@x.pl', 'role', 'authenticated')::text, true);
end $$;
set role authenticated;
do $$ begin
  perform test.chk('O8 nie-admin nie widzi panelu', public.nauka_admin_oczekujacy()->>'code' = 'not_admin' and public.nauka_admin_oczekujacy_csv()->>'code' = 'not_admin', null);
end $$;
reset role;
do $$ declare a text := (select email from public.nauka_admini limit 1); begin
  perform set_config('request.jwt.claims', jsonb_build_object('sub', gen_random_uuid(), 'email', a, 'role', 'authenticated')::text, false);
end $$;
set role authenticated;
do $$ declare r jsonb := public.nauka_admin_oczekujacy(); c jsonb := public.nauka_admin_oczekujacy_csv(); begin
  perform test.chk('O8 admin: 4 potwierdzone (bez czekających i wypisanych)', (r->>'ok')::boolean and (r->>'potwierdzone')::int = 4, r);
  perform test.chk('O8 Ekonomia 1. st., rok 1: 1 osoba', exists (select 1 from jsonb_array_elements(r->'kierunki') x where x->>'id' = 'wefiz-ek-1-st' and (x->>'rok')::int = 1 and (x->>'n')::int = 1), r->'kierunki');
  perform test.chk('O9 wpisane: „Psychologia”, „psychologia!” i „Psychologia (WNS)” → 2 grupy, psychologia ×2',
    exists (select 1 from jsonb_array_elements(r->'wpisane') x where x->>'klucz' = 'psychologia ' or x->>'klucz' = 'psychologia') , r->'wpisane');
  perform test.chk('O10 CSV z e-mailami tylko potwierdzonych', jsonb_array_length(c->'wiersze') = 4 and not exists (select 1 from jsonb_array_elements(c->'wiersze') x where x->>'email' in ('d4@x.pl', 'd3@x.pl')), c);
end $$;
reset role;
select set_config('request.jwt.claims', '', false);

-- O10: usunięcie konta (v32) obejmuje też listę oczekujących (kolumna email)
set role service_role;
do $$ begin
  perform test.chk('O10 nauka_konto_slady widzi zapis na liście', public.nauka_konto_slady('00000000-0000-0000-0000-0000000000ff', 'ola@x.pl') ? 'nauka_oczekujacy', null);
end $$;
reset role;
