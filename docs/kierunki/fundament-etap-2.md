# Fundament pod inne kierunki – Etap 2 (rocznik przy treściach, v44)

## Co zmieniono

- `supabase/skrot-v44-roczniki-tresci.sql` (strażnik kodowania na początku):
  - `nauka_docs.rocznik_id` + indeks; dotychczasowe treści rocznika → BM (bez wyzwalacza, więc `updated_at` się nie zmienia i strony nie pobierają wszystkiego od nowa);
  - `nauka_bm()`, `nauka_kolekcja_rocznika()`, `nauka_rocznik_uid()`, `nauka_moj_rocznik()`, `nauka_docs_id()` / `nauka_docs_id_dla()`;
  - reguła „nauka czytaj” = v4 + warunek rocznika (admin widzi wszystko); reguły zapisu bez zmian;
  - wyzwalacz `nauka_przed_zapisem` = v4 + rocznik (decyzje Bartka 2 i 3: brak → rocznik z profilu; nie-admin zawsze swój; zmiana rocznika wiersza → `inny_rocznik`);
  - nadpisane w całości (ta sama sygnatura, baza: najnowsza wersja z repo): `nauka_rp_po`, `nauka_rp_stas` (v28), `nauka_kalendarz_dane` (v27), `nauka_przypomnienia_kandydaci` (v36), `nauka_boss_odswiez`, `nauka_boss_ciosy`, `nauka_bossy`, `nauka_boss_odbierz` (v15) + `nauka_boss.rocznik_id`.
- `rocznik.js`: `KOLEKCJE_ROCZNIKA`, `KOLEKCJE_STALE_ID`, `kolekcjaRocznika`, `docId`, `docIdStrony`.
- `skrot-supabase.js` → `makeDb`, `putMany`, `ids`, `list`: filtr rocznika, `rocznik_id` przy zapisie, sufiks `@<rocznik>` dla stałych id; bez v44 w bazie strona działa jak dotąd.
- `index.html`: tylko `?v=` dwóch plików.
- `scripts/funkcje-sql.mjs`: plik naprawczy z Etapu 1 bierze funkcje tylko do v43 (`NA_PRODUKCJI`), żeby uruchomiony przed v44 nie wstawił funkcji z v44.
- Testy: `supabase/test/v44-przed.sql`, `v44.sql`, `tests/rocznik.test.js`, `docs/gry/test/fundament-etap2.mjs`, `fundament-bm-tekst.mjs`, `rocznik-testowy.mjs`, atrapa (`mock-v44`, `mock-docs-rok`, `.or()`).

## Rozbieżności ze specem

1. **Sufiks tylko dla stałych id** (`meta`, `examBank`, `exams`, `glossary`), nie dla materiałów. Materiały mają losowe id, a funkcje punktów (v13/v15) szukają ich po id podanym przez stronę – sufiks by je zepsuł, a niczego nie chroni.
2. **Studenci nie dodają terminów** (od v5 tylko admin) – w Etapie 0 pomyliłem się, czytając v4.
3. **Hasło dnia** (v15, `nauka_haslo_dni`) to jedno słowo dziennie dla wszystkich z materiałów wszystkich roczników. Spec go nie wymienia – przenoszę do v46 (Etap 6).
4. Tekst pustych Terminów „…gdy starosta je wpisze” – w innych rocznikach nie ma starosty; poprawka w Etapie 6.

## Jak sprawdzone

- PGlite: cała kolejka 2×, v44 2×, `test/v44.sql` T1–T16: BM, gość i admin widzą po v44 dokładnie to samo co przed (porównanie id + skrótu treści); student rocznika testowego widzi tylko swoje, BM nie widzi testowego; upsert dokumentu BM z innym rocznikiem i zmiana rocznika zatrzymane; nieistniejący rocznik zatrzymany; Po zajęciach z sufiksem; kalendarz i przypomnienia bez cudzych terminów; Boss tylko w swoim roczniku i bez ciosów od osób z BM.
- `node --test tests/*.test.js`: wszystkie przechodzą (lista kolekcji w `rocznik.js` = lista w SQL).
- Playwright `fundament-bm-tekst.mjs`: tekst Dziś, Przedmioty, Powtórki, Terminy, Więcej (student i admin, PL i EN, 375 px) na `main` 9bfe1ad i na gałęzi identyczny, konsola bez błędów.
- Playwright `fundament-etap2.mjs` 22/22: rocznik testowy – pusta lista terminów i materiałów (PL/EN, 375/1280, bez poziomego przewijania); admin w roczniku testowym zapisuje `po@<rocznik>`, `makro@<rocznik>`, `meta/en` wspólny; baza bez v44 – strona działa jak dotąd.

## Kroki dla Bartka (zbiorczo w raporcie końcowym)

Run `skrot-v44-roczniki-tresci.sql` (github.com → „Copy raw file”), dopiero potem wdrożenie strony. Strona z tej gałęzi działa też ze starą bazą, więc kolejność nie jest groźna.

## Dla kolejnego rocznika

Nowy rocznik nie potrzebuje nic w kodzie: wiersz w `nauka_roczniki`, wpis w `ROCZNIKI`, a treści same trafiają do jego rocznika (filtr i wyzwalacz).
