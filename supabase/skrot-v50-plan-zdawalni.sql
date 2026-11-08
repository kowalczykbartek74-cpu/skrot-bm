-- Skrót v50: plan zajęć pod adresem plan.zdawalni.pl. Wklej w Supabase → SQL Editor → Run, po v49.
-- Kopiuj z github.com (przycisk „Copy raw file”), nie przez Terminal. Można uruchomić ponownie.
--
-- Plan przenosi się z plan.skrotbm.pl na plan.zdawalni.pl (repo plan-bm). Stary adres dalej działa (repo
-- plan-skrotbm-przekierowanie trzyma kopie plików), ale świeże dane są na nowym. Ta migracja:
--   1) pozwala na adresy planu z obu hostów (stare wiersze nie łamią warunku w trakcie zmiany),
--   2) przepisuje adresy wszystkich roczników na plan.zdawalni.pl (ta sama ścieżka pliku),
--   3) nowy rocznik dostaje adres na plan.zdawalni.pl (wyzwalacz z v46).
-- Funkcja „kalendarz” i tak zamienia stary host na nowy, więc kolejność wdrożenia nie ma znaczenia.

do $$ begin
  if 'ąćęłńóśźż' <> U&'\0105\0107\0119\0142\0144\00F3\015B\017A\017C' then
    raise exception 'Polskie znaki doszły zepsute. Skopiuj plik z github.com (Raw), nie przez Terminal.';
  end if;
end $$;

alter table public.nauka_roczniki drop constraint if exists nauka_roczniki_plan_url_chk;
alter table public.nauka_roczniki add constraint nauka_roczniki_plan_url_chk
  check (plan_url is null or plan_url ~ '^https://plan\.(zdawalni|skrotbm)\.pl/[a-z0-9/._-]+\.json$');

update public.nauka_roczniki
   set plan_url = regexp_replace(plan_url, '^https://plan\.skrotbm\.pl/', 'https://plan.zdawalni.pl/')
 where plan_url like 'https://plan.skrotbm.pl/%';

create or replace function public.nauka_roczniki_plan_url() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.plan_url is null then
    new.plan_url := case when new.id = public.nauka_bm() then 'https://plan.zdawalni.pl/plan.json' else 'https://plan.zdawalni.pl/plan/' || new.id || '.json' end;
  end if;
  return new;
end $$;

-- Sprawdzenie: wszystkie roczniki na nowym adresie
select id, plan_url from public.nauka_roczniki order by id;
