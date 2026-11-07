# Nowy kierunek w Skrócie (później: Zdawalni) – specyfikacja dla Claude Code

Cel: ta sama aplikacja co dla 1. roku Business Management (skrotbm.pl) działa dla kolejnego kierunku Uniwersytetu Szczecińskiego. Wszystko, co się da, jest **wspólne z BM** (kod, animacje, gry, lekcje v3, fiszki, quizy, powtórki, ranking, monety, sklep, Moje materiały, wersja EN). Zmienia się tylko to, co zależy od kierunku: **sylabus, plan zajęć, przedmioty, lekcje i zasady zaliczeń**. Bez ściągania materiałów z Teams.

Najważniejsze: ma być świetnie zrobione i **tanio w kredytach**. Zasady oszczędzania są w sekcji 2 i obowiązują w każdym etapie.

---

## 0. Dane wejściowe (Bartek uzupełnia przed startem)

| Pole | Wartość |
|---|---|
| Kierunek | `[np. Zarządzanie]` |
| Wydział | `[np. WEFiZ]` |
| Stopień / tryb | `[I stopnia / stacjonarne]` |
| Rok naboru | `[2026]` (1. rok w 2026/27) |
| Język zajęć | `[pl albo en]` |
| Sylabus (PDF) | `[link albo plik w repo]` (sylabusy WEFiZ: dsm.usz.edu.pl) |
| Plan zajęć | `[np. system planyzajec-efz.usz.edu.pl, kierunek …]` |
| Administrator | Bartek – jedyny. Nie ma starostów ani redaktorów roczników: terminy, ogłoszenia, materiały i lekcje każdego rocznika dodaje on przez Narzędzia → „Edytuję rocznik”. |
| Źródła treści | sylabus, materiały, do których Bartek ma dostęp (wgrywa je sam), i „Moje materiały” studentów. **Bez Teams** (`teams: false`). |
| Grupy | `[lista grup ćwiczeniowych albo „brak” – wtedy bez wyboru grupy]` |

Brakuje sylabusa albo źródła planu → zapytaj i nic nie zaczynaj.

---

## 1. Zanim cokolwiek zrobisz

1. Przeczytaj `claude/CLAUDE.md` (projekt „szkoła app”) albo jego kopię, potem w repo `skrot-bm` w `README.md` sekcję **„Kierunki i roczniki”**. Tam jest mechanizm, na którym budujesz: `rocznik.js` (`window.SKROT_ROCZNIK`, w `index.html` stała `ROK`), `skrot-v31-roczniki.sql` (wydziały, kierunki, roczniki, wybór w profilu) i **fundament pod inne kierunki** (`docs/kierunki/fundament-etap-0…7.md`): v44 treści per rocznik, v45 dostęp i płatność per rocznik, v46 plan, kalendarz, ranking i Hasło dnia per rocznik, przełącznik admina „Edytuję rocznik”. Testy: `tests/rocznik.test.js`, `supabase/test/v31.sql`, `v44.sql`–`v46.sql`, `docs/gry/test/fundament-etap7.mjs` (przejście całości na roczniku testowym).
2. Pracuj na gałęzi od `main` (po scaleniu fundamentu). Nowa gałąź: `kierunek-<kod>`. Każda nowa migracja zaczyna się strażnikiem kodowania (`supabase/straznik-kodowania.sql`, pilnuje tego `tests/migracje.test.js`), a SQL Bartek kopiuje z github.com („Copy raw file”), nie z Terminala.
3. Wszystkie zasady z CLAUDE.md sekcja 4 obowiązują: nic do produkcyjnej bazy bez zgody (SQL jako plik), pytania quizu tylko dopisywane, slajdy tylko jako mapa tematów, każdy nowy polski tekst z parą w `i18n-en.js`, `?v=` podbite, telefon pierwszy, testy przed pushem.
4. Praca etapami: **jeden etap → pokaż wynik (krótko, zrzuty) → czekaj na „dalej”**.

**Zasada nadrzędna: nie kopiujesz aplikacji.** Nie ma `index-zarz.html` ani drugiego repo. Jest jedna aplikacja, a nowy kierunek to nowy wpis w `rocznik.js`, wiersz w bazie i jego dane (plan, sylabus, treści). „Kopiowanie wszystkiego z BM” = to samo kod działa dla obu kierunków.

---

## 2. Oszczędzanie kredytów (obowiązkowe)

- **Nie czytaj całego `index.html`** (~1,4 MB). Szukaj `grep -n` i czytaj tylko potrzebne fragmenty (`sed -n a,bp`). To samo z `i18n-en.js` (300 KB) i `sylabus.json`.
- **Nie pisz treści lekcji w czacie.** Lekcje, fiszki, quizy i pojęcia generuje skrypt przez API Anthropic (sekcja Etap 4): Batch API (połowa ceny), prompt caching (wspólny przewodnik stylu i wzorcowa lekcja w cache), tańszy model do kontroli jakości. Ty piszesz skrypt i robisz pilotaż na jednym przedmiocie.
- **Najpierw istniejące skrypty i funkcje**: `scripts/sylabus-parse.py`, `scripts/sylabus-build.py`, importer planu w repo `plan-bm`, panel AI starosty (Mapy z sylabusa, Uzupełnij brakujące, paczki JSON). Poprawiasz je pod nowy kierunek zamiast pisać od zera.
- **Zmiany w dużych plikach skryptem** z asercją „dokładnie jedno trafienie”, nie przez wielokrotne czytanie i edycję.
- **Zrzuty ekranu**: jeden komplet na etap (375 i 1280 px, PL i EN, tylko zmienione ekrany), nie po każdej poprawce.
- **Subagenty tylko do szerokiego przeszukiwania**, nie do pisania treści.
- **Treści tylko na bieżący i najbliższy semestr** i najpierw przedmioty kończące się egzaminem. Reszta po decyzji Bartka.

---

## Etap 1 – plan zajęć kierunku

Repo `plan-bm` (plan.skrotbm.pl). Najpierw przeczytaj jego README i obecny importer WEFiZ.

1. Rozszerz importer o ten kierunek (ten sam system uczelni → ten sam importer, inny filtr kierunku/roku). Wynik w **tym samym formacie co dzisiejszy `plan.json` BM** (`groups → odd/even`, `kalendarz`, `dziekanat`), w osobnym pliku **`plan/<id-rocznika>.json`** na plan.skrotbm.pl (ta zasada jest już w `rocznik.js`, w bazie `nauka_roczniki.plan_url` i w funkcji `kalendarz`; host ten sam, więc CSP bez zmian). Plik BM `plan.json` zostaje pod tym samym adresem.
2. Odwołane zajęcia: **tylko komunikaty DOS** (bez Teams). Adres sekcji DOS bierz z bazy (`nauka_roczniki_lista()` → `wydzial.dos_url`, v31/v46), nie wpisuj go na stałe w `dziekanat.mjs`.
3. Strona planu: wybór kierunku na plan.skrotbm.pl (kierunek → rok → grupa), adres planu do wysłania na grupę roku. Grzeczność wobec uczelni jak dziś (≤ 1 zapytanie/s, pełne pobranie tylko przy zmianie, walidacja przed publikacją).
4. Test: plan wygląda jak u BM, grupy i laby się zgadzają z systemem uczelni.

**Stop: pokaż plan kierunku i czekaj na „dalej”.**

## Etap 2 – rocznik w aplikacji i w bazie

Rocznik przy treściach, terminach i ogłoszeniach, dostęp i płatność, ranking, statystyki, Hasło dnia, kalendarz i przełącznik admina są już zrobione w fundamencie (v44–v46). Zostaje sam rocznik i jego dane.

1. **`rocznik.js`**: nowy wpis w `ROCZNIKI` (te same pola co BM): `plan.json` = `https://plan.skrotbm.pl/plan/<id>.json` (test w `tests/rocznik.test.js` tego pilnuje), `skrzynka: null`, `sylabus` = plik z Etapu 3, `grupy` (albo `[]`), `teams: false`, `zasadyZaliczen: false`, `przedmioty: { prawne, rachunkowe, jeszczeProsciej }` (id przedmiotów z planu; puste listy, jeśli nie dotyczy). BM się nie zmienia.
2. **Przedmioty**: id przedmiotu dalej = slug polskiej nazwy z planu (bez prefiksu). Ten sam przedmiot na dwóch kierunkach się nie miesza, bo treści, terminy, ranking i punkty są per rocznik (osoba jest w jednym roczniku). Stałe id dokumentów (`meta/po`, `examBank/<przedmiot>`…) dostają sufiks `@<rocznik>` automatycznie (`skrot-supabase.js` → `makeDb`).
3. **SQL `skrot-v47-…sql`** (kolejny wolny numer po v46; strażnik na początku, idempotentny, test w PGlite, dopisany do kolejki w `supabase/test/pglite.mjs` 2×): wiersze w `nauka_kierunki` (jeśli kierunku jeszcze nie ma) i `nauka_roczniki` (status `oczekujacy` do startu sprzedaży; `plan_url` uzupełni się sam). Nic więcej – reguły, ranking i dostęp działają same.
4. **Wybór kierunku** przy pierwszym logowaniu już jest (ekran wejścia + `nauka_rocznik_ustaw`, v31); rocznik bez statusu `platny` zamiast płatności zbiera chętnych na listę oczekujących (v45).
5. Test: `docs/gry/test/fundament-etap7.mjs` z prawdziwym wpisem rocznika zamiast testowego (konto BM nie widzi niczego z nowego kierunku i odwrotnie, PL/EN, 375/1280) + porównanie tekstu ekranów BM przed/po (`docs/gry/test/fundament-bm-tekst.mjs`).

**Stop.**

## Etap 3 – sylabus i program studiów

1. `scripts/sylabus-parse.py` + `sylabus-build.py` na PDF-ie kierunku → `sylabus-<kod>.json` w tym samym formacie co `sylabus.json` (przedmioty PL/EN, ECTS, godziny, prowadzący, efekty EP, tematy z godzinami, literatura, forma i zasady zaliczenia). Jeśli układ PDF-u jest inny, popraw parser warunkowo, nie psując BM (`sylabus.json` po przebudowie bez zmian).
2. Ekrany z sylabusa działają same: program studiów, karta przedmiotu, lektury, porównanie fakultetów, kalkulator ocen.
3. **Zasady zaliczeń z sylabusa** zamiast ręcznego `ZAL`: forma (E / ZO), części (W/ĆW/LAB), reguła oceny końcowej z tekstu sylabusa. Dla nowego kierunku generowane, z oznaczeniem „z sylabusa, potwierdź u prowadzącego”. BM zostaje przy ręcznym `ZAL`.
4. Kontrola: lista przedmiotów z planu (Etap 1) ↔ sylabus. Rozbieżności (inna nazwa, brak przedmiotu) wypisz Bartkowi, nie zgaduj.

**Stop.**

## Etap 4 – lekcje, fiszki, quizy (generator, nie czat)

Format: **lekcje v3** jak 115 lekcji BM (haczyk, intuicja, treść, wizualizacja, przykład, typowy błąd, check, ćwiczenia stopniowane, faded, transfer, recap, bilet wyjścia; pole `lesson` w `materialContent`, wzór w `docs/lekcje-v3/` i istniejących lekcjach z Analizy). Jeśli `lekcja-v4-spec.md` jest już wdrożona, użyj v4. Język treści = język zajęć kierunku; „Prościej · PL” zawsze po polsku.

1. **Skrypt `scripts/lekcje-z-sylabusa.mjs`**:
   - wejście: `sylabus-<kod>.json` + lista przedmiotów do zrobienia;
   - mapa tematów przedmiotu z sylabusa → jedna lekcja na temat (albo połączone krótkie tematy);
   - system prompt = przewodnik stylu (plan przejrzystości + zasady lekcji v3 z README) + **jedna wzorcowa lekcja BM**, w prompt caching;
   - wysyłka przez **Message Batches API**; model do pisania wybierz rozsądnie (dobry stosunek jakości do ceny), tańszy model do kontroli: poprawny JSON, komplet pól, pytania `check`/`exit` sprawdzają zastosowanie, każda zła odpowiedź ma `not`, LaTeX `\(…\)` się zamyka;
   - fiszki, quiz, pojęcia PL/EN (słowniczek), „Prościej” i „Dlaczego?” w tej samej paczce albo drugiej rundzie batcha;
   - wynik: pliki JSON w formacie paczek, które Panel AI już umie wczytać – Bartek wczytuje je w trybie „Edytuję rocznik”, więc trafiają do tego rocznika (albo plik SQL do wklejenia, z `rocznik_id`). **Skrypt nic nie zapisuje do bazy sam.**
   - **id materiałów z prefiksem rocznika**, np. `zarz26-syl-makro-01` (krótki kod kierunku + rok naboru, `syl`, przedmiot, numer): materiały mają w bazie wspólny klucz `(kolekcja, id)`, więc id nie może się powtórzyć z BM ani z innym rocznikiem;
   - klucz API: Bartek ustawia `ANTHROPIC_API_KEY` w swoim terminalu; Ty go nie widzisz i nie zapisujesz.
2. **Pilotaż**: jeden przedmiot kończący się egzaminem. Pokaż 2 lekcje w aplikacji (zrzuty), koszt pilotażu z konsoli i szacunek kosztu całości. **Czekaj na akcept.**
3. Po akcepcie: reszta przedmiotów z egzaminem w bieżącym/najbliższym semestrze, potem pozostałe (decyzja Bartka).
4. Treści oznaczone „z sylabusa”; w miejscu „przejrzane przez osobę, która zdała przedmiot” na razie nic (to dojdzie z autorami).
5. **Kontrola jakości przed każdym wgraniem** (pilotaż i każda kolejna paczka): `node scripts/tresci-kontrola.mjs <paczka> --przed-wgraniem` musi skończyć się kodem 0. Błędy (walidator v4, zakazane sformułowania z `scripts/tresci-zakazane.json`, rachunki i pytania z `calc`, które się nie zgadzają) poprawia generator albo łatka; liczby, daty, kwoty i numery artykułów Bartek (albo autor) przegląda w `scratch/tresci-przeglad.json`, wpisując źródło. Pytania liczbowe generator pisze z polem `calc`. Opis: README → „Kontrola jakości treści”, `docs/zdawalni/etap-12.md`.

**Stop.**

## Etap 5 – sprawdzenie i start

1. Testy: `node --test tests/*.test.js`, PGlite (wszystkie migracje 2×), Playwright na atrapie dla obu roczników (PL/EN, 375/1280, konsola bez błędów, bez poziomego przewijania).
2. Lista dla Bartka, klik po kliku: SQL do uruchomienia, funkcje do wdrożenia, paczki treści do wczytania, co sprawdzić na żywej stronie.
3. Decyzje, które zostawiasz Bartkowi (nie robisz ich sam): regulamin § 2 (zakres kierunków, mail 14 dni wcześniej), nazwa/domena Zdawalni, status rocznika `oczekujacy` → `platny` (wtedy rusza zakup: te same ceny i Payment Links, rocznik w 4. części `client_reference_id`, v45).

---

## Czego nie robisz

- Nie kopiujesz `index.html` ani repo dla nowego kierunku.
- Nie budujesz ról starostów ani redaktorów roczników (jest jeden administrator).
- Nie pobierasz niczego z Teams ani z e-proDziekana; nie logujesz się na strony uczelni.
- Nie publikujesz prezentacji prowadzących.
- Nie zmieniasz niczego, co widzi BM (sprawdzasz porównaniem przed/po).
- Nie piszesz treści lekcji ręcznie w rozmowie poza pilotażowym przykładem do sprawdzenia formatu.
