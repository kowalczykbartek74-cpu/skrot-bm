-- Skrót v47: rocznik Zarządzanie, 1. stopnia, stacjonarne, nabór 2026 (wefiz-zarz-1-st-2026).
-- Wygenerowane: node scripts/kierunek.mjs kierunki/wefiz-zarz-1-st-2026.json (nie edytuj ręcznie).
-- Wklej w Supabase → SQL Editor → Run, po v46. Kopiuj z github.com (przycisk „Copy raw file”), nie przez Terminal.
-- Można uruchomić ponownie. Dla BM nic się nie zmienia. Status („oczekujacy”) zmieniasz potem ręcznie; ponowne uruchomienie nie cofnie go niżej.

-- Strażnik kodowania: polskie litery wpisane wprost muszą być równe tym samym literom zapisanym kodami (same znaki ASCII).
-- Gdy plik przeszedł przez Terminal albo zły schowek, litery z pierwszej strony się psują („Ňā”, „√≥”), a kody nie,
-- więc warunek nie przechodzi i plik zatrzymuje się na pierwszej instrukcji, zanim cokolwiek zmieni.
-- Ten blok wklejamy na sam początek każdej nowej migracji (od v44); pilnuje tego tests/migracje.test.js.
do $$ begin
  if 'ąćęłńóśźż' <> U&'\0105\0107\0119\0142\0144\00F3\015B\017A\017C' then
    raise exception 'Polskie znaki doszły zepsute. Skopiuj plik z github.com (Raw), nie przez Terminal.';
  end if;
end $$;

-- Wydział musi już być w bazie (v31): bez niego nie wiadomo, jak go nazwać ani gdzie są komunikaty DOS.
do $$ begin
  if not exists (select 1 from public.nauka_wydzialy where kod = 'WEFiZ') then
    raise exception 'Brak wydziału WEFiZ w nauka_wydzialy (uruchom najpierw v31).';
  end if;
end $$;

-- Kierunek (często już jest z listy kierunków v34; wtedy uzupełniamy tylko nazwę EN i język zajęć).
insert into public.nauka_kierunki (id, wydzial, kod, nazwa_pl, nazwa_en, stopien, tryb, jezyk)
values ('wefiz-zarz-1-st', 'WEFiZ', 'ZARZ', 'Zarządzanie', 'Management', 1, 'st', 'pl')
on conflict (id) do update set nazwa_en = coalesce(public.nauka_kierunki.nazwa_en, excluded.nazwa_en), jezyk = excluded.jezyk;

-- Rocznik: adres planu (plan.skrotbm.pl/plan/<id>.json) wpisuje sam wyzwalacz z v46.
-- Istniejący rocznik dostaje status z pliku tylko wtedy, gdy to krok naprzód (plan → oczekujacy → platny), nigdy wstecz.
insert into public.nauka_roczniki (id, kierunek_id, nabor, status)
values ('wefiz-zarz-1-st-2026', 'wefiz-zarz-1-st', 2026, 'oczekujacy')
on conflict (id) do update set status = excluded.status
  where array_position(array['plan', 'oczekujacy', 'platny'], public.nauka_roczniki.status)
      < array_position(array['plan', 'oczekujacy', 'platny'], excluded.status);

-- Podgląd po Run: jeden wiersz z rocznikiem, statusem i adresem planu.
select r.id, r.status, r.plan_url, k.nazwa_pl, k.nazwa_en from public.nauka_roczniki r
join public.nauka_kierunki k on k.id = r.kierunek_id where r.id = 'wefiz-zarz-1-st-2026';
