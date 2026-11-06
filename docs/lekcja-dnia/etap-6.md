# „Dla Ciebie na dziś”, etap 6: dla wszystkich + pomiar

Gałąź `lekcja-dnia/wszyscy` (od `main` 63460df).
- **Strona:** blok dla wszystkich.
- **SQL:** `supabase/skrot-v43-lekcja-dnia.sql`, do uruchomienia po v42 (podsumowanie do panelu lejka).

## Co jest
- **Blok „Dla Ciebie na dziś” jest dla wszystkich** (`LD_WSZYSCY = true`). Na Dziś nie ma już „Teraz zrób to”, drugiej karty, „Ile masz dziś czasu?” ani „Powtórki w 5 minut” (D2).
  - Ekran „Powtórka w 5 minut” w Więcej zostaje.
  - Funkcje starych kart zostają w kodzie. Używa ich `?ld=0`, a `nowCard` jest zapasem, gdy nie ma czego ułożyć (np. konto bez lekcji).
  - `?ld=0` w danej przeglądarce pokazuje stare karty, do porównania i dla starych testów. `?ld=1` wraca do bloku.
  - Szybki powrót dla wszystkich to jedna stała: `LD_WSZYSCY = false`. Wtedy blok widzi tylko admin z `?ld=1`, jak w etapach 4–5.
- **D5, bez pełnego dostępu** (konto bez zakupu, po okresie próbnym):
  - karta 5 min i jedna lekcja pokazowa z darmowych lekcji (np. OWI 1);
  - pod spodem „Codziennie dwie lekcje ułożone dla Ciebie są w pełnej wersji” i „Kup dostęp”.
  - W okresie próbnym jest pełna wersja.
- **Zdarzenie „koniec”**: po skończonej karcie albo lekcji strona zapisuje jedno zdarzenie `{ kind: "ld", koniec: "karta" | "lekcja", rola, segmenty }`, żeby panel liczył osoby i lekcje dziennie. Zdarzenia mechanik z etapu 5 zostają.
- **SQL v43** (bez nowych tabel):
  - `nauka_lejek_ld(rocznik)` liczy z `nauka_zdarzenia` i `nauka_powtorki_log`:
    - **dziennie (28 dni)**: ile osób skończyło kartę 5 min, ile kart, ile osób skończyło lekcję, ile lekcji;
    - **przerwania**: porzucenia na numer segmentu lekcji (gdzie ludzie najczęściej przerywają);
    - **mechaniki**: ukończone, z dobrym wynikiem, porzucone, pominięte i liczba osób;
    - **„czy uczy”**: odsetek dobrych pierwszych odpowiedzi w powtórkach po ≥ 7 dniach, osobno dla tematów, które ta osoba wcześniej robiła w bloku, i dla pozostałych.
  - `nauka_lejek_policz` (nocne liczenie z v35) dopisuje to jako pole `ld` do podsumowania każdego rocznika. „Przelicz teraz” w panelu też to liczy.
- **Panel „Lejek i retencja” → sekcja „Dla Ciebie na dziś”**: cztery tabele z powyższym. Grupy poniżej 5 osób są ukryte („< 5”), każdy wiersz osobno (`lejek.js → ld`).

## Do zrobienia przez Ciebie
1. Uruchomić SQL w Supabase. Bez tego panel pokazuje „Brak danych: uruchom SQL v43 i przelicz”, a strona działa normalnie:
   ```bash
   pbcopy < ~/skrot-bm-ld/supabase/skrot-v43-lekcja-dnia.sql
   ```
   Potem wklej w SQL Editor i uruchom. Mogę to też zrobić sam przez CLI, jak przy v34–v40.
2. W panelu „Lejek i retencja” kliknąć „Przelicz teraz”.

## Decyzje (moje, do zmiany na Twoje słowo)
- **Stare karty zostają w kodzie** (nie usuwam funkcji), bo `?ld=0` i `LD_WSZYSCY = false` to szybki powrót. Mogę je usunąć po tygodniu spokoju.
- **Stare testy Dziś** dostały w `docs/gry/test/lib.mjs` domyślnie `bm-ld-flag = 0`, więc dalej sprawdzają stare karty. Blok sprawdzają testy `lekcja-dnia*.mjs`.
- **„Czy uczy”**: temat liczy się jako „z bloku”, gdy osoba zrobiła go w karcie albo lekcji dla Ciebie przed powtórką.
- **D10**: punkty z gier w lekcji działają jak w zwykłej grze, bez zmian w SQL. Limit 3 rund z punktami dziennie zostaje. Jeśli chcesz to zmienić, będzie to osobny plik SQL.

## Testy
- `node --test tests/*.test.js`: 241/241 (w tym `lejek.ld`: ukrywanie < 5, kolejność mechanik, procenty).
- **PGlite**: cała seria migracji do v43, w tym v41 i v42, przechodzi. Nowy `supabase/test/v43.sql`: 8/8:
  - lejek dalej ma swoje pola;
  - dziennie 5 osób z kartą i 3 z lekcją;
  - przerwania w segmencie 3;
  - mechaniki (zły wpis pominięty);
  - „czy uczy” blok kontra reszta, rocznik „*”;
  - przeglądarka nie woła funkcji liczącej.
- **Przeglądarka:**
  - `lekcja-dnia-4.mjs` 103/103: blok dla konta płatnego bez admina, `?ld=0` = stare karty, D5;
  - `lekcja-dnia-5.mjs` 24/24: sekcja w panelu lejka z ukrywaniem < 5;
  - regresja w porównaniu z `main`: w czacie.
- Regresja w porównaniu z `main` (ten sam wynik): dzien 27/27, polaczenia-1…7 (22, 8, 16, 16, 11, 7, 10), Staś 40/40, przejazd-noc 19/19, ustawienia 29/29, lejek 53 ✓, profil-nauki 12 ✓, sprawdzian 50/50, rewanze 23/23, wyszukiwarka 34/34, lekcje-v4 31/31, scalenie 7/7; po-zajeciach 26/28 i etap9 74/82: te same ✗ co na `main` (etap9 po zmianie daty na 7.11).
