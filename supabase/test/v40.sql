-- Testy I1–I10 dla skrot-v40-importy.sql (kolejka importów PDF → szkic AI → zatwierdzenie). Po test/v39.sql.
-- Osoby: adm40 (administrator), ala40 (zalogowana, bez uprawnień). Tylko lokalnie, na atrapie z test/stub.sql (bez schematu storage).
reset role;
insert into auth.users (id, email, created_at)
select ('00000000-0000-0000-0000-0000000040' || lpad(i::text, 2, '0'))::uuid, e, now()
from (values (1,'adm40@x.pl'),(2,'ala40@x.pl')) v(i, e)
on conflict do nothing;
insert into public.nauka_admini (email) values ('adm40@x.pl') on conflict do nothing;

-- I1 anon: żadnej funkcji administratora; publiczny plan bez zatwierdzonego importu → ok=false
set request.jwt.claims = '{}'; set role anon;
do $$ begin
  begin perform public.nauka_importy_lista(); perform test.chk('I1 anon nie woła nauka_importy_lista', false, null);
  exception when insufficient_privilege then perform test.chk('I1 anon nie woła nauka_importy_lista', true, null); end;
  begin perform public.nauka_import_nowy('sylabus','WEFiZ',null,null,repeat('a',64),'x.pdf',10,1,1); perform test.chk('I1 anon nie woła nauka_import_nowy', false, null);
  exception when insufficient_privilege then perform test.chk('I1 anon nie woła nauka_import_nowy', true, null); end;
  perform test.chk('I1 anon: plan publiczny bez importu → ok=false', not (public.nauka_import_plan_publiczny('wefiz-bm-1-st-2026')->>'ok')::boolean, null);
end $$;
reset role;

-- I2 zalogowany bez uprawnień administratora: not_admin wszędzie, nic nie zapisane
select test.jako('ala40@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_import_nowy('sylabus','WEFiZ',null,null,repeat('b',64),'x.pdf',10,3,1);
begin
  perform test.chk('I2 nie-admin: nowy → not_admin', r->>'code' = 'not_admin', r);
  perform test.chk('I2 nie-admin: lista → not_admin', public.nauka_importy_lista()->>'code' = 'not_admin', null);
  perform test.chk('I2 nie-admin: do_sprzatniecia pusta', public.nauka_importy_do_sprzatniecia() = '[]'::jsonb, null);
  begin perform public.nauka_importy_retencja(); perform test.chk('I2 authenticated nie woła retencji', false, null);
  exception when insufficient_privilege then perform test.chk('I2 authenticated nie woła retencji', true, null); end;
end $$;
reset role;
select test.chk('I2 nic nie zapisane', (select count(*) = 0 from public.nauka_importy where plik_sha256 = repeat('b', 64)), null);

-- I3 admin: nowy import; ten sam plik jeszcze raz → ten sam import; zły rocznik i typ odrzucone
select test.jako('adm40@x.pl'); set role authenticated;
do $$ declare a jsonb; b jsonb; c jsonb; t jsonb;
begin
  a := public.nauka_import_nowy('sylabus','WEFiZ','wefiz-bm-1-st-2026','Sylabus BM 2026/27',repeat('c',64),'sylabus.pdf',880000,227,2);
  b := public.nauka_import_nowy('sylabus','WEFiZ','wefiz-bm-1-st-2026','drugi raz',repeat('c',64),'sylabus.pdf',880000,227,2);
  c := public.nauka_import_nowy('sylabus','WEFiZ','nie-ma-takiego-1-st-2026',null,repeat('d',64),'x.pdf',10,1,1);
  t := public.nauka_import_nowy('quiz','WEFiZ',null,null,repeat('d',64),'x.pdf',10,1,1);
  perform test.chk('I3 nowy: ok, ścieżka <id>.pdf', (a->>'ok')::boolean and not (a->>'istnieje')::boolean and a->>'sciezka' = (a->>'id') || '.pdf', a);
  perform test.chk('I3 ten sam plik → ten sam import', (b->>'istnieje')::boolean and b->>'id' = a->>'id', b);
  perform test.chk('I3 zły rocznik / typ', c->>'code' = 'bad_rocznik' and t->>'code' = 'bad_type', jsonb_build_array(c, t));
  perform set_config('test.imp', a->>'id', false);
end $$;

-- I4 części: druga lektura części 1 podmienia jej pozycje; po wszystkich częściach → do_sprawdzenia; numery po kolei
do $$ declare id uuid := current_setting('test.imp')::uuid; r jsonb; s jsonb; w jsonb; p jsonb; bad jsonb;
begin
  r := public.nauka_import_czesc(id, 1, '[{"strona":4,"fragment":"B","dane":{"code":"B"}},{"strona":1,"fragment":"A","dane":{"code":"A"}}]', 'uwaga 1', 'claude-sonnet-5-5', '{"input_tokens":1000,"output_tokens":200}');
  perform test.chk('I4 część 1: szkic, 2 pozycje', r->>'stan' = 'szkic' and (r->>'pozycji')::int = 2, r);
  r := public.nauka_import_czesc(id, 1, '[{"strona":1,"fragment":"A","dane":{"code":"A"}},{"strona":5,"fragment":"C","dane":{"code":"C"}}]', null, 'claude-sonnet-5-5', '{"input_tokens":1000,"output_tokens":200}');
  perform test.chk('I4 część 1 jeszcze raz: podmienione, nadal 2', r->>'stan' = 'szkic' and (r->>'pozycji')::int = 2, r);
  bad := public.nauka_import_czesc(id, 3, '[]', null, null, null);
  perform test.chk('I4 nie ma części 3', bad->>'code' = 'bad_part', bad);
  bad := public.nauka_import_czesc(id, 2, '[{"strona":"x","dane":1}]', null, null, null);
  perform test.chk('I4 złe pozycje odrzucone', bad->>'code' = 'bad_items', bad);
  bad := public.nauka_import_decyzja(id, 1, 'tak');
  perform test.chk('I4 decyzja w szkicu → bad_state', bad->>'code' = 'bad_state', bad);
  s := public.nauka_import_czesc(id, 2, '[{"strona":14,"fragment":"D","dane":{"code":"D"}}]', 'strona 20 nieczytelna', 'claude-sonnet-5-5', '{"input_tokens":500,"output_tokens":100}');
  perform test.chk('I4 część 2: do_sprawdzenia, 3 pozycje', s->>'stan' = 'do_sprawdzenia' and (s->>'pozycji')::int = 3 and s->'przeczytane' = '[1,2]'::jsonb, s);
  w := public.nauka_import_pobierz(id)->'import';
  p := w->'pozycje';
  perform test.chk('I4 kolejność i numery: A1 C2 D3, decyzje null',
    (select string_agg((e->'dane'->>'code') || (e->>'n'), ' ' order by (e->>'n')::int) from jsonb_array_elements(p) e) = 'A1 C2 D3'
    and (select bool_and(e->'decyzja' = 'null'::jsonb) from jsonb_array_elements(p) e), p);
  perform test.chk('I4 tokeny zsumowane, uwagi części 2', (w->'tokeny'->>'input_tokens')::int = 2500 and w->'uwagi_ai'->>'2' = 'strona 20 nieczytelna' and not (w->'uwagi_ai' ? '1'), w->'tokeny');
  bad := public.nauka_import_czesc(id, 1, '[]', null, null, null);
  perform test.chk('I4 po przeczytaniu części już nie przyjmuje', bad->>'code' = 'bad_state', bad);
end $$;

-- I5 decyzje per pozycja i zatwierdzenie całości
do $$ declare id uuid := current_setting('test.imp')::uuid; r jsonb;
begin
  r := public.nauka_import_zakoncz(id, 'zatwierdzony', '{"courses":[]}');
  perform test.chk('I5 zatwierdzenie z pozycjami bez decyzji → undecided', r->>'code' = 'undecided' and (r->>'czeka')::int = 3, r);
  r := public.nauka_import_decyzja(id, 2, 'zle');
  perform test.chk('I5 nieznana decyzja', r->>'code' = 'bad_decision', r);
  r := public.nauka_import_decyzja(id, 2, 'popraw', null);
  perform test.chk('I5 popraw bez danych → bad_data', r->>'code' = 'bad_data', r);
  r := public.nauka_import_decyzja(id, 9, 'tak');
  perform test.chk('I5 nie ma pozycji 9', r->>'code' = 'not_found', r);
  r := public.nauka_import_decyzja(id, 1, 'tak');
  r := public.nauka_import_decyzja(id, 2, 'popraw', '{"code":"C2"}', 'literówka w nazwie');
  r := public.nauka_import_decyzja(id, 3, 'nie');
  perform test.chk('I5 licznik: tak 1, popraw 1, nie 1', r->'licznik' @> '{"tak":1,"popraw":1,"nie":1,"czeka":0}'::jsonb, r);
  r := public.nauka_import_decyzja(id, 3, null);
  perform test.chk('I5 cofnięcie decyzji', (r->'licznik'->>'czeka')::int = 1, r);
  r := public.nauka_import_reszta_tak(id);
  perform test.chk('I5 zatwierdź pozostałe: 1 zmieniona', (r->>'zmienione')::int = 1 and (r->'licznik'->>'tak')::int = 2, r);
  perform test.chk('I5 poprawione dane i uwaga zapisane',
    (select e->'poprawione'->>'code' = 'C2' and e->>'uwaga' = 'literówka w nazwie' and e->'dane'->>'code' = 'C'
       from jsonb_array_elements(public.nauka_import_pobierz(id)->'import'->'pozycje') e where (e->>'n')::int = 2), null);
  r := public.nauka_import_zakoncz(id, 'zatwierdzony', null);
  perform test.chk('I5 bez wyniku → bad_result', r->>'code' = 'bad_result', r);
  r := public.nauka_import_zakoncz(id, 'zatwierdzony', '{"source":"x","courses":[{"id":"a"}]}', 'pilot');
  perform test.chk('I5 zatwierdzony', (r->>'ok')::boolean and r->>'stan' = 'zatwierdzony', r);
  r := public.nauka_import_decyzja(id, 1, 'nie');
  perform test.chk('I5 po zatwierdzeniu decyzje zamknięte', r->>'code' = 'bad_state', r);
  r := public.nauka_import_zakoncz(id, 'odrzucony');
  perform test.chk('I5 zatwierdzonego nie da się odrzucić', r->>'code' = 'bad_state', r);
  perform test.chk('I5 lista: stan i licznik', exists (select 1 from jsonb_array_elements(public.nauka_importy_lista()->'importy') e
    where e->>'id' = id::text and e->>'stan' = 'zatwierdzony' and not (e ? 'pozycje') and (e->'licznik'->>'razem')::int = 3), null);
end $$;

-- I6 nic do zatwierdzenia → nothing_approved; odrzucenie szkicu
do $$ declare a jsonb; id uuid; r jsonb;
begin
  a := public.nauka_import_nowy('tresc','WEFiZ',null,null,repeat('e',64),'t.pdf',100,1,1); id := (a->>'id')::uuid;
  r := public.nauka_import_czesc(id, 1, '[{"strona":1,"fragment":"x","dane":{"t":"x"}}]', null, null, null);
  r := public.nauka_import_decyzja(id, 1, 'nie');
  r := public.nauka_import_zakoncz(id, 'zatwierdzony', '{"pozycje":[]}');
  perform test.chk('I6 same odrzucone pozycje → nothing_approved', r->>'code' = 'nothing_approved', r);
  r := public.nauka_import_zakoncz(id, 'odrzucony', null, 'zły plik');
  perform test.chk('I6 odrzucony z do_sprawdzenia', r->>'stan' = 'odrzucony', r);
  a := public.nauka_import_nowy('tresc','WEFiZ',null,null,repeat('e',64),'t.pdf',100,1,1);
  perform test.chk('I6 ten sam plik po odrzuceniu → nowy import', not (a->>'istnieje')::boolean and a->>'id' <> id::text, a);
  r := public.nauka_import_zakoncz((a->>'id')::uuid, 'odrzucony');
  perform test.chk('I6 odrzucony ze szkicu', r->>'stan' = 'odrzucony', r);
  r := public.nauka_import_zakoncz((a->>'id')::uuid, 'szkic');
  perform test.chk('I6 nieznany stan końcowy', r->>'code' = 'bad_state', r);
end $$;

-- I7 zatwierdzony plan → plan-bm (anon) dostaje grupy; sylabus i inny rocznik nie
do $$ declare a jsonb; id uuid; r jsonb;
begin
  a := public.nauka_import_nowy('plan','WEFiZ','wefiz-bm-1-st-2026','Plan zimowy',repeat('f',64),'plan.pdf',100,2,1); id := (a->>'id')::uuid;
  r := public.nauka_import_czesc(id, 1, '[{"strona":1,"fragment":"C111 Prawo","dane":{"grupa":"C111"}}]', null, null, null);
  r := public.nauka_import_reszta_tak(id);
  r := public.nauka_import_zakoncz(id, 'zatwierdzony', '{"source":"Plan zimowy","groups":{"C114":{"odd":[{"d":0,"s":0,"pl":"Prawo","k":"W"}],"even":[]}}}');
  perform test.chk('I7 plan zatwierdzony', r->>'stan' = 'zatwierdzony', r);
end $$;
reset role;
set request.jwt.claims = '{}'; set role anon;
do $$ declare r jsonb := public.nauka_import_plan_publiczny('wefiz-bm-1-st-2026'); x jsonb := public.nauka_import_plan_publiczny('wefiz-xx-1-st-2026');
begin
  perform test.chk('I7 anon: grupy z zatwierdzonego planu', (r->>'ok')::boolean and r->'groups'->'C114'->'odd'->0->>'pl' = 'Prawo' and r->>'source' = 'Plan zimowy' and not (r ? 'pozycje'), r);
  perform test.chk('I7 inny rocznik → ok=false', not (x->>'ok')::boolean, x);
end $$;
reset role;

-- I8 sprzątanie: zatwierdzone/odrzucone i stare szkice; po oznaczeniu znikają z listy
update public.nauka_importy set utworzony_at = now() - interval '31 days' where plik_sha256 = repeat('c', 64) and stan = 'zatwierdzony';
select test.jako('adm40@x.pl'); set role authenticated;
do $$ declare a jsonb; l jsonb; n int;
begin
  a := public.nauka_import_nowy('sylabus','WEFiZ',null,null,repeat('9',64),'nowy.pdf',100,1,1);
  l := public.nauka_importy_do_sprzatniecia();
  perform test.chk('I8 do skasowania: zatwierdzone i odrzucone, bez świeżego szkicu',
    jsonb_array_length(l) = 4 and not exists (select 1 from jsonb_array_elements(l) e where e->>'id' = a->>'id'), l);
  perform test.chk('I8 oznaczenie skasowanego PDF-u', public.nauka_import_pdf_usuniety(((l->0)->>'id')::uuid) and not public.nauka_import_pdf_usuniety(((l->0)->>'id')::uuid), null);
  perform test.chk('I8 skasowany znika z listy', jsonb_array_length(public.nauka_importy_do_sprzatniecia()) = 3, null);
end $$;
reset role;
update public.nauka_importy set utworzony_at = now() - interval '31 days' where plik_sha256 = repeat('9', 64);
select test.jako('adm40@x.pl'); set role authenticated;
select test.chk('I8 szkic starszy niż 30 dni też do skasowania', jsonb_array_length(public.nauka_importy_do_sprzatniecia()) = 4, null);
reset role;

-- I9 retencja z pg_cron: bez schematu storage nic nie kasuje i nie wybucha (service_role)
set role service_role;
select test.chk('I9 retencja bez storage: ok, 0', public.nauka_importy_retencja() = '{"ok":true,"usuniete":0}'::jsonb, public.nauka_importy_retencja());
reset role;

-- I10 RLS: tabela niewidoczna dla anon i authenticated
set role authenticated;
do $$ begin
  begin perform 1 from public.nauka_importy limit 1; perform test.chk('I10 authenticated nie czyta tabeli', false, null);
  exception when insufficient_privilege then perform test.chk('I10 authenticated nie czyta tabeli', true, null); end;
end $$;
reset role;
