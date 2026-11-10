-- Skrót v51: lekcje EaIA wgrane 9.11.2026 do rocznika BM wracają do rocznika EaIA.
-- Wklej w Supabase → SQL Editor → Run, po v49 i po „Dodaj do bazy” rocznika wefiz-eaia-1-st-2026.
-- Kopiuj z github.com (przycisk „Copy raw file”), nie przez Terminal. Można uruchomić ponownie (drugi raz nic nie zmienia).
--
-- Co się stało: 9.11 paczki EaIA były wgrywane, zanim rocznik EaIA trafił do tabeli nauka_roczniki. Baza odrzuciła zapis
-- (klucz obcy rocznik_id), strona wzięła ten błąd za „brak kolumny” i zapisała to samo bez rocznika, a wyzwalacz
-- przypisał wtedy rocznik administratora, czyli BM. Skutek: 48 lekcji „eaia26-…” (i ich „Prościej”, quizy „dlaczego”,
-- treść, źródła) leży w roczniku BM, studenci BM widzą je jako dodatkowe lekcje, a rocznik EaIA jest pusty.
-- Ta migracja przepisuje te wiersze do rocznika EaIA. Treści nie zmienia, niczego nie usuwa.
-- Wyzwalacz nauka_przed_zapisem blokuje zmianę rocznika (inny_rocznik), więc na czas tej jednej zmiany jest wyłączony
-- (tak samo robi v44). Strona od tej wersji takiego błędu już nie obchodzi (skrot-supabase.js, „brak_rocznika”).

do $$ begin
  if 'ąćęłńóśźż' <> U&'\0105\0107\0119\0142\0144\00F3\015B\017A\017C' then
    raise exception 'Polskie znaki doszły zepsute. Skopiuj plik z github.com (Raw), nie przez Terminal.';
  end if;
end $$;

do $$ begin
  if not exists (select 1 from public.nauka_roczniki where id = 'wefiz-eaia-1-st-2026') then
    raise exception 'Rocznika wefiz-eaia-1-st-2026 nie ma w bazie. Najpierw Panel kierunków → „Dodaj do bazy”, potem ten plik.';
  end if;
end $$;

alter table public.nauka_docs disable trigger nauka_przed_zapisem;
update public.nauka_docs
   set rocznik_id = 'wefiz-eaia-1-st-2026'
 where rocznik_id = public.nauka_bm()
   and id like 'eaia26-%'
   and public.nauka_kolekcja_rocznika(kolekcja, id);
alter table public.nauka_docs enable trigger nauka_przed_zapisem;

-- Sprawdzenie: wszystkie wiersze „eaia26-…” mają być w roczniku wefiz-eaia-1-st-2026 (żadnego w wefiz-bm-1-st-2026)
select kolekcja, rocznik_id, count(*) as ile
  from public.nauka_docs
 where id like 'eaia26-%'
 group by kolekcja, rocznik_id
 order by kolekcja, rocznik_id;
