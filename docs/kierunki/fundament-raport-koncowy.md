# Fundament pod inne kierunki – raport końcowy (Etapy 0–7, 7.11.2026)

Wszystko jest na gałęziach `fundament/etap-0` … `fundament/etap-7` (każda zawiera poprzednie; ostatnia = całość); `fundament/etap-7` jest scalona do `main` (strona). SQL i funkcje Supabase czekają na Bartka. Na produkcji nic nie uruchamiałem. Raporty etapów: `docs/kierunki/fundament-etap-0.md` … `fundament-etap-6.md`, ten plik = Etap 7.

## Kroki dla Bartka, po kolei

Każdy plik SQL: otwórz link → przycisk **„Copy raw file”** (dwa kwadraty nad treścią, po prawej) → Supabase → projekt **skrzynka-bm** → **SQL Editor** → **New query** → Cmd+V → **Run**. Nigdy przez Terminal. Jeśli wyskoczy „Polskie znaki doszły zepsute…” – nic się nie zmieniło, skopiuj jeszcze raz przyciskiem.

1. **Naprawa znaków (Etap 1)**: https://github.com/kowalczykbartek74-cpu/skrot-bm/blob/main/supabase/naprawa-znakow.sql → Run → wynik wklej mi (wiersze „ZOSTAŁO”). Drugi Run ma dać pusty wynik. Ten plik sam pomija funkcje z v33/v41/v42 (mogą czekać na uruchomienie).
2. **v44 – treści per rocznik**: https://github.com/kowalczykbartek74-cpu/skrot-bm/blob/main/supabase/skrot-v44-roczniki-tresci.sql → Run (po v43).
3. **Strona jest już na `main`** (zdawalni.pl, 7.11 na prośbę Bartka „dodaj na main”). Działa też ze starszą bazą: bez v44/v45/v46 zachowuje się jak dotąd, a po każdym Run sama zaczyna korzystać z nowych kolumn i funkcji.
4. **v45 – dostęp i płatność per rocznik**: https://github.com/kowalczykbartek74-cpu/skrot-bm/blob/main/supabase/skrot-v45-dostep-rocznik.sql → Run.
5. **Funkcja `stripe-webhook`** (najprościej: jeden plik `supabase/functions/stripe-webhook/jeden-plik.ts` wklejony w `index.ts` – panel nie zawsze pozwala dodać drugi plik): Supabase → Edge Functions → `stripe-webhook` → edycja kodu: podmień `index.ts` i dodaj plik `obsluga.ts` (oba z `supabase/functions/stripe-webhook/` na gałęzi) → **Deploy updates**. „Verify JWT” zostaje wyłączone. (Albo z Terminala, jeśli CLI jest zalogowane: `npx supabase functions deploy stripe-webhook --no-verify-jwt`.)
6. **Test płatności**: na koncie testowym BM kup plan BLIK-iem → dostęp jest (Więcej → Konto i dostęp) → zwrot w panelu Stripe.
7. **v46 – plan, kalendarz, ranking, Hasło dnia per rocznik**: https://github.com/kowalczykbartek74-cpu/skrot-bm/blob/main/supabase/skrot-v46-roczniki-plan-ranking.sql → Run.
8. **Funkcje `kalendarz` i `grade-open`**: jak w kroku 5 – `kalendarz`: `index.ts`; `grade-open`: `supabase/functions/grade-open/jeden-plik.ts` wklejony w `index.ts` (zamiast `index.ts` + `system.ts`) → Deploy updates.
9. **Test na żywej stronie** (zdawalni.pl, Twoje konto i konto testowe BM): logowanie; Dziś, Przedmioty, Terminy, Więcej wyglądają jak wcześniej; ranking (Więcej → Ranking) ma te same osoby; kalendarz w telefonie (link z Terminy → Do kalendarza w telefonie) ma zajęcia i zaliczenia jak dotąd; Hasło dnia i Boss działają; Narzędzia → „Edytuję rocznik” pokazuje listę (na razie sam BM, bo innego wpisu w `rocznik.js` nie ma).

## Do decyzji

1. **Opis strony w `<head>` i w manifeście** (Etap 6, już zmieniony na gałęzi): „Skróty, fiszki, quizy i wersje prostym językiem dla studentów Uniwersytetu Szczecińskiego.”; tytuł podglądu linku „Zdawalni – nauka do zaliczeń na studiach”. Zatwierdź albo podaj inny.
2. **D1 i D2** (domyślnie przyjęte): osobne treści tego samego przedmiotu w każdym roczniku; jeden zakup = jeden rocznik, te same ceny i Payment Links.
3. **Ocena AI** (`grade-open`): pierwsze zdanie polecenia mówi teraz „first-year Business Management students (taught in English)” zamiast „first-year university students (Business Management and Law, taught in English)”. Reszta bez zmian.
4. **v33, v41, v42**: według moich notatek czekają na Run. Jeśli już je uruchomiłeś, plik naprawczy może to uwzględnić (przesunę `NA_PRODUKCJI` / `CZEKA`).
5. **plan-bm**: odwołania z DOS dla roczników bez Teams mają brać adres z bazy (`wydzial.dos_url`). Gałąź `kierunki` w `~/plan-bm` (Prawo) ma to przypisane do rocznika na sztywno; nie ruszałem jej. To przy importerze nowego kierunku (Etap 1 z `nowy-kierunek-spec.md`).

## Co jest zrobione (w skrócie)

| Etap | Co | Gałąź |
|---|---|---|
| 0 | Rozpoznanie: klucz `(kolekcja, id)`, stałe id, kolekcje, `nauka_dostep` | `fundament/etap-0` |
| 1 | Strażnik kodowania, sprawdzenie i naprawa zepsutych znaków | `fundament/etap-1` |
| 2 | v44: rocznik przy treściach, filtr i sufiks id w `makeDb` | `fundament/etap-2` |
| 3 | „Edytuję rocznik” (admin), pasek u góry, teksty bez Teams | `fundament/etap-3` |
| 4 | v45: dostęp per rocznik, webhook Stripe (`obsluga.ts`), lista oczekujących | `fundament/etap-4` |
| 5 | v46: `plan_url`, funkcja `kalendarz` z planem rocznika | `fundament/etap-5` |
| 6 | v46: ranking, statystyki, rekordy, Hasło dnia po roczniku; stałe BM w kodzie; `grade-open` | `fundament/etap-6` |
| 7 | Przejście całości na roczniku testowym, wszystkie testy, spec nowego kierunku, README | `fundament/etap-7` |

## Jak sprawdzone (Etap 7)

- `docs/gry/test/fundament-etap7.mjs` 20/20: ekran wejścia → rocznik testowy (bez grup) → okres próbny → Dziś, Przedmioty, Powtórki, Terminy, Więcej (PL/EN, 375/1280): bez treści BM (nazwy przedmiotów z odmianą, bossy, materiały, terminy, ogłoszenia, grupy C11x) i bez słowa Teams, bez poziomego przewijania, konsola bez błędów; admin w „Edytuję rocznik” dodaje termin, ogłoszenie i materiał → student testowy je widzi, student BM nie.
- Etapy: `fundament-etap2.mjs` 22/22, `-etap3` 23/23, `-etap4` 18/18, `-etap6` 7/7; tekst ekranów BM (student i admin, PL/EN) identyczny z `main`.
- Wszystkie 51 dotychczasowych skryptów Playwright uruchomione na `main` 9bfe1ad i na gałęzi: **te same wyniki**. Różniły się dwa: `admin.mjs` (test sprzed v44 otwierał w „Podglądzie jako” Zarządzania materiał BM – poprawiony test, 80/80) i `etap8.mjs` (porównanie rozmiaru `gry.js` z gałęzią `gry-etap-7` działa tylko w checkoutcie z `.git`, `gry.js` bez zmian). Padające już na `main` (bez zmian): `bm-ekrany.mjs`, `etap5.mjs`, `etap7.mjs` (100/103), `lekcja-dnia-4.mjs` (limit czasu), `scalanie.mjs`.
- `node --test tests/*.test.js`: 268 zaliczonych, 0 błędów (1 pominięty: generator złotego pliku kalendarza).
- PGlite: cała kolejka migracji 2× (v44, v45, v46 też 2×) + testy v44 T1–T16, v45 D1–D14, v46 P1–P5 i R1–R4, naprawa znaków; jedyny ✗ to znany `limit_wpisow` z v12 (funkcja z repo plan-bm).

## Jak to działa dla kolejnego rocznika

Wpis w `ROCZNIKI` (`rocznik.js`) + migracja z wierszem w `nauka_roczniki` + plik `plan/<id>.json` na plan.skrotbm.pl. Treści, terminy, ogłoszenia, dostęp, ranking, Hasło dnia, Boss i kalendarz od razu działają w obrębie rocznika; Bartek dodaje treści przez „Edytuję rocznik”, a do statusu `platny` strona zbiera chętnych na listę oczekujących.
