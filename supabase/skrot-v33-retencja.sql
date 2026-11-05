-- Skrót v33: kasowanie starych danych raz dziennie (retencja, etap 4 „Systemy z Zdawalni w Skrócie”).
-- Wklej w Supabase → SQL Editor → Run, po v32. Można uruchamiać wielokrotnie.
-- NAJPIERW Bartek zatwierdza okresy z tabeli poniżej (docs/zdawalni/etap-4.md). Zmiana okresu = zmiana liczby w nauka_retencja().
-- Przed uruchomieniem włącz pg_cron: Supabase → Integrations → Cron → Enable (bez tego funkcja jest, ale nie chodzi sama).
--
-- Tabela okresów (od daty zdarzenia):
--   nauka_logowania, nauka_wizyty ............ 12 mies.  (polityka prywatności: „historia logowań i wizyt”)
--   nauka_obecnosc ........................... 30 dni   (kto jest teraz online; starsze wpisy nic nie znaczą)
--   nauka_urzadzenia_log ..................... 12 mies.  („historia zmian urządzeń”)
--   nauka_urzadzenia (usunięte z listy) ...... 12 mies. od usunięcia
--   nauka_odp, nauka_gry, nauka_haslo ........ 12 mies.  („wyniki gier i odpowiedzi do rankingu”; dotąd czyszczone przy okazji)
--   nauka_powtorki_log ....................... 400 dni  (miara „czy strona uczy”, jak zdarzenia nauki)
--   nauka_zdarzenia .......................... 400 dni  (profil nauki; dotąd czyszczone tylko przy zapisie tej samej osoby)
--   nauka_ocena_ai ........................... 90 dni   (licznik dziennego limitu oceny AI)
--   nauka_ocena_odwolania .................... 12 mies.  (odwołania od oceny AI z treścią odpowiedzi)
--   nauka_misja_osobista ..................... 90 dni   (Zadanie dnia)
--   admin_proby .............................. 1 dzień  (próby hasła starosty; jak dotąd)
-- Bez zmian (nie kasujemy z czasem): punkty rankingu i monety (z nich liczą się poziomy i saldo), kupione rzeczy, profil,
-- postęp, materiały, dostęp, zgody, polecenia (płatności i przepisy podatkowe), kody, kalendarz.

create or replace function public.nauka_retencja() returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare out jsonb := '{}'::jsonb; n bigint;
begin
  delete from public.nauka_logowania where at < now() - interval '12 months';          get diagnostics n = row_count; out := out || jsonb_build_object('nauka_logowania', n);
  delete from public.nauka_wizyty where od < now() - interval '12 months';             get diagnostics n = row_count; out := out || jsonb_build_object('nauka_wizyty', n);
  delete from public.nauka_obecnosc where last_seen < now() - interval '30 days';      get diagnostics n = row_count; out := out || jsonb_build_object('nauka_obecnosc', n);
  delete from public.nauka_urzadzenia_log where at < now() - interval '12 months';     get diagnostics n = row_count; out := out || jsonb_build_object('nauka_urzadzenia_log', n);
  delete from public.nauka_urzadzenia where usuniete_at < now() - interval '12 months'; get diagnostics n = row_count; out := out || jsonb_build_object('nauka_urzadzenia', n);
  delete from public.nauka_odp where created_at < now() - interval '12 months';        get diagnostics n = row_count; out := out || jsonb_build_object('nauka_odp', n);
  delete from public.nauka_gry where start < now() - interval '12 months';             get diagnostics n = row_count; out := out || jsonb_build_object('nauka_gry', n);
  delete from public.nauka_haslo where dzien < (now() - interval '12 months')::date;   get diagnostics n = row_count; out := out || jsonb_build_object('nauka_haslo', n);
  delete from public.nauka_powtorki_log where at < now() - interval '400 days';        get diagnostics n = row_count; out := out || jsonb_build_object('nauka_powtorki_log', n);
  delete from public.nauka_zdarzenia where kiedy < now() - interval '400 days';        get diagnostics n = row_count; out := out || jsonb_build_object('nauka_zdarzenia', n);
  delete from public.nauka_ocena_ai where at < now() - interval '90 days';             get diagnostics n = row_count; out := out || jsonb_build_object('nauka_ocena_ai', n);
  delete from public.nauka_ocena_odwolania where at < now() - interval '12 months';    get diagnostics n = row_count; out := out || jsonb_build_object('nauka_ocena_odwolania', n);
  delete from public.nauka_misja_osobista where dzien < (now() - interval '90 days')::date; get diagnostics n = row_count; out := out || jsonb_build_object('nauka_misja_osobista', n);
  if to_regclass('public.admin_proby') is not null then -- z v12 (w testach PGlite go nie ma)
    execute $q$delete from public.admin_proby where at < now() - interval '1 day'$q$; get diagnostics n = row_count; out := out || jsonb_build_object('admin_proby', n);
  end if;
  return out;
end $$;
revoke execute on function public.nauka_retencja() from public, anon, authenticated;
grant execute on function public.nauka_retencja() to service_role;

-- Codziennie o 2:30 UTC (3:30 / 4:30 w Polsce). Bez pg_cron (np. przed włączeniem w panelu): tylko komunikat.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') or exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron with schema pg_catalog;
    if exists (select 1 from cron.job where jobname = 'skrot-retencja') then perform cron.unschedule('skrot-retencja'); end if;
    perform cron.schedule('skrot-retencja', '30 2 * * *', 'select public.nauka_retencja()');
    raise notice 'OK retencja: zadanie skrot-retencja codziennie 2:30 UTC';
  else
    raise notice 'pg_cron niedostępny: włącz Integrations → Cron i uruchom ten plik jeszcze raz';
  end if;
end $$;

notify pgrst, 'reload schema';
