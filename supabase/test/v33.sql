-- Testy T1–T4 dla skrot-v33-retencja.sql (po test/v32.sql). PGlite nie ma pg_cron: sprawdzamy samą funkcję.
reset role;
do $$
declare u uuid := '00000000-0000-0000-0000-000000000331';
begin
  insert into auth.users (id, email) values (u, 'ret33@x.pl') on conflict do nothing;
  insert into public.nauka_logowania (user_id, email, metoda, at) values (u, 'ret33@x.pl', 'kod', now() - interval '13 months'), (u, 'ret33@x.pl', 'kod', now() - interval '1 month');
  insert into public.nauka_powtorki_log (user_id, klucz, ok, first, at) values (u, 'q:a:1', true, true, now() - interval '401 days'), (u, 'q:a:2', true, true, now() - interval '10 days');
  insert into public.nauka_ocena_ai (user_id, dzien, run, at) values (u, (now() - interval '100 days')::date, 'r33a', now() - interval '100 days'), (u, current_date, 'r33b', now());
  if to_regclass('public.admin_proby') is not null then
    execute $q$insert into public.admin_proby (at, ip) values (now() - interval '2 days', '1.2.3.4'), (now(), '1.2.3.4')$q$;
  end if;
end $$;

set role authenticated;
do $$ begin
  begin perform public.nauka_retencja(); perform test.chk('T1 przeglądarka nie uruchamia retencji', false, null);
  exception when insufficient_privilege then perform test.chk('T1 przeglądarka nie uruchamia retencji', true, null); end;
end $$;
reset role;

set role service_role;
do $$ declare r jsonb := public.nauka_retencja(); begin
  perform test.chk('T2 wynik mówi, ile z której tabeli', r ? 'nauka_logowania' and r ? 'nauka_zdarzenia' and (r->>'nauka_logowania')::int >= 1, r);
end $$;
reset role;

do $$ declare u uuid := '00000000-0000-0000-0000-000000000331'; begin
  perform test.chk('T3 stare usunięte, świeże zostają',
    (select count(*) from public.nauka_logowania where user_id = u) = 1
    and (select count(*) from public.nauka_powtorki_log where user_id = u) = 1
    and (select count(*) from public.nauka_ocena_ai where user_id = u) = 1, null);
end $$;
set role service_role;
do $$ declare r jsonb := public.nauka_retencja(); begin
  perform test.chk('T4 drugie uruchomienie nic nie kasuje', (select bool_and(v::int = 0) from jsonb_each_text(r) x(k, v)), r);
end $$;
reset role;
