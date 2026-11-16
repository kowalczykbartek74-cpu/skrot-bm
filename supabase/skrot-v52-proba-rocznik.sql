-- Strażnik kodowania: polskie litery wpisane wprost muszą być równe tym samym literom zapisanym kodami (same znaki ASCII).
-- Gdy plik przeszedł przez Terminal albo zły schowek, litery z pierwszej strony się psują („Ňā”, „√≥”), a kody nie,
-- więc warunek nie przechodzi i plik zatrzymuje się na pierwszej instrukcji, zanim cokolwiek zmieni.
-- Ten blok wklejamy na sam początek każdej nowej migracji (od v44); pilnuje tego tests/migracje.test.js.
do $$ begin
  if 'ąćęłńóśźż' <> U&'\0105\0107\0119\0142\0144\00F3\015B\017A\017C' then
    raise exception 'Polskie znaki doszły zepsute. Skopiuj plik z github.com (Raw), nie przez Terminal.';
  end if;
end $$;
-- Skrót v52 (pętla UX-1, etap 2): okres próbny tylko dla kierunku, który już ruszył (rocznik ze statusem „platny”).
-- Wklej w Supabase → SQL Editor → Run, po v51. Kopiuj z github.com („Copy raw file”), nie przez Terminal.
-- Można uruchomić ponownie (drugi raz nic nie zmienia).
--
-- Dotąd student kierunku „oczekujacy” (lekcje w przygotowaniu) mógł włączyć próbę – jedną na konto i urządzenie – a przy zakupie
-- słyszał, że kierunek jeszcze nie ruszył. Teraz nauka_proba_start() odrzuca start z błędem „rocznik”, a próba czeka na start
-- kierunku. BM (nauka_bm()) jak dotąd bez sprawdzenia. Reszta funkcji bez zmian względem v16 (te same błędy i kolejność).
-- Nadpisuje tylko nauka_proba_start() (właściciel: pętla 1; ostatnia wersja w skrot-v16-proba.sql).

create or replace function public.nauka_proba_start() returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  em text := public.nauka_email();
  dev text := public.nauka_urzadzenie_id();
  rok text := public.nauka_moj_rocznik();
  koniec timestamptz;
begin
  if uid is null or coalesce(em, '') = '' then raise exception 'nie_zalogowany'; end if;
  if public.nauka_admin() or exists (select 1 from public.nauka_dostep d
                                     where d.do_kiedy >= current_date and (d.email = em or d.user_id = uid)) then
    raise exception 'ma_dostep';
  end if;
  -- v52: kierunek, który jeszcze nie ruszył (status inny niż „platny”), nie spala próby.
  if rok is not null and rok <> public.nauka_bm() and not public.nauka_rocznik_do_kupienia(rok) then
    raise exception 'rocznik';
  end if;
  if exists (select 1 from public.nauka_proby p where p.user_id = uid or p.email = em)
     or exists (select 1 from public.nauka_dostep d where d.email = em or d.user_id = uid) then
    raise exception 'wykorzystany';
  end if;
  if dev is not null and exists (select 1 from public.nauka_proby p where p.device_id = dev) then
    raise exception 'urzadzenie';
  end if;
  begin
    insert into public.nauka_proby (user_id, email, device_id, do_kiedy)
    values (uid, em, dev, now() + make_interval(days => public.nauka_proba_dni()))
    returning do_kiedy into koniec;
  exception when unique_violation then
    raise exception 'wykorzystany';
  end;
  return jsonb_build_object('do_kiedy', koniec);
end $$;
revoke all on function public.nauka_proba_start() from public, anon;
grant execute on function public.nauka_proba_start() to authenticated;
