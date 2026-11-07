# Fundament pod inne kierunki – Etap 5 (plan i kalendarz per rocznik)

## Co zmieniono

- `supabase/skrot-v46-roczniki-plan-ranking.sql`, część „Etap 5” (cały plik uruchamiasz raz, po Etapie 6):
  - `nauka_roczniki.plan_url` (tylko `https://plan.skrotbm.pl/….json`): BM `plan.json`, inne `plan/<id>.json`; wyzwalacz uzupełnia adres nowego rocznika;
  - `nauka_kalendarz_dane` (wersja z v45) podaje `plan_url` rocznika właściciela linku;
  - `nauka_roczniki_lista()` podaje `plan_url` i `wydzial.dos_url` (sekcja DOS z v31).
- `supabase/functions/kalendarz/index.ts`: plan z `plan_url` (tylko z hosta `plan.skrotbm.pl`, inaczej plan BM jak dotąd). UID-y wydarzeń i adres `plan.json` BM bez zmian.
- `rocznik.js`: zasada adresów w komentarzu i teście (CSP bez zmian, bo host ten sam).
- `index.html`: tylko `?v=` (`rocznik.js`). Strona już wcześniej startowała inny rocznik z pustym planem (kopia wbudowana jest tylko dla BM).

## Rozbieżność ze specem

Pkt 3 (odwołania bez Teams z `nauka_wydzialy.dos_url` zamiast adresu w `dziekanat.mjs`) dotyczy repo `plan-bm`. Lokalna gałąź `kierunki` w `~/plan-bm` (praca nad Prawem, niewypchnięta) ma już źródło DOS przypisane do rocznika i plik `plan/<rocznik>.json`. Nie ruszałem jej, żeby nie mieszać dwóch prac. Baza podaje teraz `dos_url` w `nauka_roczniki_lista()`, więc importer (Etap 1 z `nowy-kierunek-spec.md`) może brać adres z bazy zamiast ze stałej.

## Jak sprawdzone

- `tests/kalendarz.test.js`: funkcja `kalendarz` uruchomiona w Node (atrapa Deno, bazy i `fetch`) na prawdziwym `plan.json` BM. Złoty plik `.ics` (161 wydarzeń) wygenerowany ze **starej** wersji z `main` 9bfe1ad; nowa wersja daje bajt w bajt to samo (bez `plan_url` i z `plan_url` BM). Rocznik testowy pobiera `plan/wefiz-test-1-st-2026.json`; obcy host, `http://`, `..` i zły typ → plan BM. UID-y `@skrotbm.pl`.
- PGlite `test/v46.sql` P1–P5 (v46 uruchomione 2×).
- `node --test` 265/265.

## Kroki dla Bartka (zbiorczo w raporcie końcowym)

Run v46 (po Etapie 6, jeden plik) → Supabase → Edge Functions → `kalendarz` → wdrożenie nowej wersji („Verify JWT” wyłączone jak dotąd).

## Dla kolejnego rocznika

Plan wrzucony do `plan.skrotbm.pl/plan/<id>.json` od razu działa na stronie i w kalendarzu w telefonie.
