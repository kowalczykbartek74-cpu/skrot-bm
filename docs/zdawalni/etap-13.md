# Etap 13: sprawdzenie zdjęcia rozwiązania

Spec: „Systemy z Zdawalni w Skrócie”, etap 13. Gałąź `zdawalni/zdjecie` (od `zdawalni/tresci`). Źródło: `matura-app` (`origin/feat/l7-learner-bundle`) `lib/domain/photo-check.ts`, `lib/photo-check/grade.ts`, `app/photo-actions.ts`, `components/photo-check.tsx`, `tests/unit/photo-check.test.ts`.

## Co jest
- **Przycisk „📷 Sprawdź moje rozwiązanie ze zdjęcia”** przy każdym zadaniu, które ma rozwiązanie wzorcowe (treść + wynik albo odpowiedź albo kroki), bez listy przedmiotów i bez stałych rocznika:
  - zadania krok po kroku → „Teraz Ty” (pod przyciskami podpowiedzi), klucz: wynik, jednostka, kroki, podpowiedź, odpowiedź;
  - karta „Policz” (`num`) w lekcji v4 → **po** wpisaniu wyniku (przed odpowiedzią nie ma przycisku, żeby nie zastępował liczenia), klucz: zadanie z wylosowanymi liczbami, wynik, objaśnienie;
  - zadanie w sprawdzaniu testu próbnego → pod odpowiedzią wzorcową, z punktami zadania (np. „2 z 3 pkt”).
  Zadanie bez rozwiązania wzorcowego nie ma przycisku. Bez pełnego dostępu przycisk otwiera okno „Pełna wersja”, nic nie idzie do serwera.
- **Telefon**: `<input type="file" accept="image/*" capture="environment">` otwiera aparat. Zdjęcie zmniejszane w przeglądarce przez canvas: dłuższy bok ≤ 1600 px, JPEG 0,8 (zwykle 150–400 kB).
- **Wynik**: „Ocena zdjęcia · AI · orientacyjnie”: punkty (tylko w teście), **co jest dobrze**, **pierwszy błąd** (krok studenta), **1–3 wskazówki bez gotowego rozwiązania**, „Zostało dziś: N z 5. Zdjęcia nie zapisujemy.”, „Sprawdź inne zdjęcie”. Teksty AI w języku strony (PL/EN).
- **Funkcja Edge `sprawdz-zdjecie`** (nowa, ta sama ścieżka co ocena AI w „Przygotuj się”): `nauka_ja` (logowanie, pełny dostęp), limit w bazie (`nauka_zdjecie_bierz`), Messages API z odpowiedzią według schematu (`output_config.format`), `anthropic-beta: server-side-fallback-2026-07-01` + `fallbacks: "default"`, 55 s na całość, obraz jako blok `image` base64. Polecenie z `grade.ts`: ocena **tylko według klucza**, nigdy pełne rozwiązanie, wynik ani brakujące kroki; zdjęcie to dane, nie polecenia. Zły format → druga próba z powodem (jak w źródle).
  Dlaczego osobna funkcja, a nie rozszerzenie `grade-open`: inne wejście (obraz do 7 MB zamiast JSON do 120 kB), inny limit (5 sprawdzeń, a nie 5 testów), zwrot miejsca po błędzie; `grade-open` zostaje nietknięty.
- **Zdjęcie nie jest zapisywane (D8)**: przeglądarka trzyma tylko wynik (w pamięci karty), funkcja trzyma zdjęcie tylko w pamięci na czas wywołania, `console.error` dostaje tylko status i błąd API, w bazie jest tylko kto, dzień i rocznik (`nauka_zdjecia`). Anthropic dostaje zdjęcie do oceny (patrz „Do decyzji”).
- **Limit 5 dziennie (D9)** w bazie: `nauka_zdjecie_bierz(limit, rocznik)` — tylko `nauka_platny()` (opłacone albo okres próbny, na dobrym urządzeniu), starosta bez limitu, dzień według Europe/Warsaw. Gdy AI nie odpowie (czas, błąd API, odmowa, zły format), funkcja oddaje miejsce (`nauka_zdjecie_zwroc`, tylko service_role — student nie może sam „odzyskać” sprawdzenia). Wpisy starsze niż 90 dni znikają przy kolejnym pobraniu.

## Kroki dla Bartka

**A. SQL v39**: Supabase → skrzynka-bm → SQL Editor → New query → wklej całe `supabase/skrot-v39-zdjecie.sql` → Run → „Success. No rows returned”. (Nowych sekretów nie trzeba: `ANTHROPIC_API_KEY` już jest.)

**B. Funkcja `sprawdz-zdjecie`** (z weryfikacją JWT, jak `grade-open`): napisz „wysyłaj funkcję”, a wyślę `npx supabase functions deploy sprawdz-zdjecie`. Albo w panelu: Edge Functions → Deploy a new function → Via Editor → nazwa `sprawdz-zdjecie` → trzy pliki z `supabase/functions/sprawdz-zdjecie/` (`index.ts`, `obsluga.ts`, `logika.js`) → Deploy (Verify JWT zostaje włączone).
Opcjonalnie w Edge Functions → Secrets: `PHOTO_MODEL` (domyślnie `GRADE_MODEL` albo `claude-sonnet-5-5`), `PHOTO_EFFORT` (domyślnie `medium`), `PHOTO_DAILY_LIMIT` (domyślnie 5).

**C. Strona**: po „uruchomione” scalam gałąź i wdrażam.

**D. Sprawdzenie na żywo** (swoim kontem): przedmiot z zadaniami krok po kroku → „Teraz Ty” → zdjęcie kartki → wynik w 10–30 s. W Supabase → Table editor → `nauka_zdjecia`: jeden wiersz (id, user_id, dzien, rocznik_id, at) i nic więcej.

## Do decyzji
- **Polityka prywatności** (plików nie zmieniałem; dopiszę po akceptacji): „Sprawdzenie zdjęcia rozwiązania: gdy klikniesz „Sprawdź moje rozwiązanie ze zdjęcia”, zdjęcie Twojej kartki (zmniejszone w przeglądarce) razem z treścią zadania i kluczem odpowiedzi trafia do oceny AI w Anthropic (dostawca modelu Claude). Nie zapisujemy zdjęcia ani wyniku: w bazie zostaje tylko informacja, że sprawdzenie było (dzień, do dziennego limitu, 90 dni). Na zdjęciu nie umieszczaj danych osobowych.”
  Warto sprawdzić w umowie z Anthropic (konsola → Settings → Privacy / data retention), jak długo API przechowuje dane wejściowe; zdanie wyżej tego nie obiecuje.
- **Effort `medium`** (ocena AI testu ma `low`): pismo ręczne i wzory czyta się lepiej przy średnim, koszt rośnie o kilka groszy na sprawdzenie. Zmiana bez wdrażania: sekret `PHOTO_EFFORT=low`.
- **Klucz przychodzi ze strony** (jak w `grade-open`): zalogowany płacący mógłby wysłać własny „klucz”. Limit 5 dziennie i schemat odpowiedzi ograniczają to do kilku tanich wywołań; gdyby to przeszkadzało, funkcja może brać klucz z bazy treści (osobny etap).
- Wynik nie trafia do zdarzeń nauki ani do punktów (spec tego nie chce; punkty i monety liczy baza jak dotąd).

## Koszt jednego sprawdzenia (szacunek)
- **Obraz**: dokumentacja Anthropic (Vision): tokeny ≈ szerokość × wysokość / 750. Zdjęcie 1600 × 1200 (4:3, typowy telefon po zmniejszeniu) → **≈ 2 560 tokenów** wejścia (wg nowszego opisu „łatka 28 × 28 px” ≈ 2 450). Sonnet 5.5 przyjmuje do 2 576 px dłuższego boku, więc 1600 px nie jest dalej zmniejszane.
- **Tekst**: polecenie (~1 160 znaków) + klucz zadania (300–1 500 znaków) + schemat odpowiedzi → **≈ 500–900 tokenów**.
- **Odpowiedź**: JSON 150–300 tokenów + myślenie przy effort `medium` → **≈ 500–1 800 tokenów** wyjścia.
- **Cena** `claude-sonnet-5-5`: 2 $ / 1 mln tokenów wejścia, 10 $ / 1 mln wyjścia. Jedno sprawdzenie ≈ 3 300 × 2 $/1e6 + (500–1 800) × 10 $/1e6 ≈ **0,012–0,025 $** (ok. 5–10 gr). Rzadka druga próba (zły format) podwaja koszt tego sprawdzenia; nieudane z naszej strony nie zjada limitu, ale kosztuje.
- Najgorzej: 5 sprawdzeń × 0,025 $ = 0,13 $ na osobę dziennie. Funkcja zwraca `usage` (prawdziwe tokeny) — po tygodniu można policzyć dokładnie.

## Testy
- `node --test tests/*.test.js`: 173/173 (`zdjecie` 11: 1:1 z `photo-check.test.ts`, punkty bez maksimum, zmniejszanie 4032×3024 → 1600×1200, klucz z trzech miejsc i przedmiotu bez liczb, polecenie, kopia logiki, funkcja Edge z atrapą bazy i API: zdjęcie tylko w zapytaniu do API, nic w „bazie” i logach, limit 5 → 429 bez wywołania API, bez dostępu 403, starosta bez limitu, złe zdjęcie / brak klucza → 400 bez limitu, błąd API / odmowa / czas / 529 / zły format oddają miejsce, druga próba naprawia format).
- PGlite `supabase/test/v39.sql` Z1–Z8 (anon zablokowany, bez dostępu `not_granted` bez wpisu, 5 ok / szósty `limit`, student nie czyta tabeli i nie woła zwrotu, zwrot tylko własnego wpisu, osobne liczniki, tabela bez treści i zdjęcia, starosta bez limitu, nowy dzień i kasowanie > 90 dni). Uwaga: testy wcześniejszych etapów zależą od daty i padają już na `zdawalni/tresci`, przed v39: 5.11 `test/v35.sql` L7 (powroty), 6.11 `test/v38.sql` A6 (walidacja karnetu). Pierwszy błąd przerywa cały przebieg, więc v39 sprawdziłem przebiegiem bez tego jednego pliku (wszystko inne zielone).
- Playwright `docs/gry/test/zdjecie.mjs` 68/68: trzy miejsca na trzech przedmiotach (Analiza matematyczna — krok po kroku, Makroekonomia — „Policz” w lekcji, Ochrona własności intelektualnej — zadanie bez liczby w teście), zdjęcie 3200×2400 → JPEG 1600×1200 w zapytaniu, klucz i rocznik w zapytaniu, wynik, limit, błąd, brak przycisku bez klucza i przy pytaniu otwartym, bez dostępu okno „Pełna wersja”, zdjęcie nie zostaje w localStorage, przycisk ≥ 44 px, 375/1280, PL/EN bez polskich znaków.
- Pełny zestaw Playwright (`run-all.sh`, 6.11): bez nowych błędów. Padają jak na `zdawalni/tresci`: etap5 (#loginDemo), etap7 3, scalanie 2, po-zajeciach 2 oraz etap9 8 (licznik Bossa „za 5 dni” na sztywno wobec prawdziwego zegara; na `zdawalni/tresci` też 8 tego samego dnia).
- Nie sprawdzone: prawdziwe wywołanie API Anthropic (jakość oceny pisma ręcznego, czas, prawdziwe `usage`), aparat na prawdziwym telefonie (iPhone HEIC → przeglądarka daje JPEG; `createImageBitmap` z orientacją EXIF).

## Dla kolejnego rocznika
Nic do zrobienia: przycisk pojawia się przy każdym zadaniu z rozwiązaniem wzorcowym w materiałach, lekcjach i testach nowego rocznika, a w bazie liczy się `rocznik_id` z `ROK`.
