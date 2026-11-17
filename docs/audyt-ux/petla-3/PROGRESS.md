# Pętla UX-3 · Lekcja: reakcja, tempo i ekran końca — stan

Gałąź `ux/3-lekcja`, katalog `~/zdawalni/ux-3`, port 8813, własny plik `lekcja-ux.js`. Polecenie: `~/zdawalni/ux/petla-3.md`.
Wznowienie: „Kontynuuj pętlę UX-3 według ~/zdawalni/ux/petla-3.md i docs/audyt-ux/petla-3/PROGRESS.md”.

## Etapy

| Etap | Stan | Runda | Wynik | Twarde błędy | Ostatni commit |
|---|---|---|---|---|---|
| 1 Panel werdyktu na dole | ZALICZONY | 1 | 8/10 | brak | 6a7ed93 |
| 2 Dźwięk, dotyk, Staś, combo | ZALICZONY | 1 | 8/10 | brak | 50f7c2c |
| 3 Mechanika odpowiedzi | ZALICZONY | 1 | 8/10 | brak | 1928926 |
| 4 Pasek, karty, ikony | ZALICZONY | 1 | 8/10 | brak | 121d6e1 |
| 5 Ekran końca | ZALICZONY | 2 | 8/10 | brak | (ten commit) |

## Decyzje (B1 przyjęte domyślnie, plik polecenia bez zmian)
- D3 dźwięk: darmowe „ok” / „no” dla wszystkich, jedno pytanie po pierwszej skończonej części (`bm-dzwieki` = „1”/„0”), paczki ze sklepu jako inne brzmienia (`<paczka>-no`), przełącznik w Ustawieniach (jeden wiersz).
- Wibracja: domyślnie włączona, `bm-wibracje`, niezależna od reduced-motion.
- D9: zła odpowiedź w czerwieni z palety (`--bad-soft` / `--bad`) z ikoną ✗; biały tekst na `--bad` (#8C140C) ma 8,9:1, więc przycisk „Rozumiem” jest czerwony; w ciemnym `--bad` jest jasny (#FF9A90), więc tekst przycisku ciemny (`--accent-ink`, ≥ 9:1).
- D5: +10 XP za skończoną kartę „Dziś · 5 min” (`lpBonus(10)` w `done()`); cel dnia 30 XP ustawia pętla 2.
- Bez serc i energii.
- Seria, cel, „Jutro”, przypomnienie, zadania: z `window.ZD_NAWYK` (pętla 2); bez niego tylko pasek celu z `LP_DAILY_GOAL`.
- Etap 1: werdykt jest w `footer.lp-bottom` (`.lp-fbar`), renderery `mc`, `rvmc`, `tf`, `num`, `order` zwracają `fb: { ok, title, body }`. Bez `lekcja-ux.js` `lpBuild` wkłada stary panel `.lp-fb` do karty (zabezpieczenie).
- Etap 1: przy pierwszym błędzie zawsze „Poprawna: X.” + „Dlaczego” (także gdy pytanie wróci w drugiej szansie); poprawna opcja podświetlona, karta przewija się do niej nad panelem.
- Etap 1: pastylka „+N” przy odpowiedzi z opcji stoi za tytułem werdyktu w dolnym pasku (nie na opcji); przy reduced-motion / calm „· +N XP” jest w tytule.
- Etap 1: karta „Dziś do powtórki” w limonce przez lokalne nadpisanie zmiennych `--h-rv-*` tylko na `.rv-hero` (reszta Powtórek bez zmian).
- Etap 1: przy reduced-motion i `html.calm` odtwarzacz i mapa lekcji bez żadnych animacji (także starych `lp-in`, `lp-pop`, `lp-ok`); ✕ w odtwarzaczu 44×44.
- `?v=` pliku `i18n.js` jest w linii 1 (`<head>`), nie w linii skryptów: zmieniona tylko ta wartość (EN dociąga się z tą samą wersją).

## Dziennik rund
- Etap 1 runda 1: 8/10, twarde błędy: brak, K1–K6 true → ZALICZONY. Poprawki recenzenta (kolejność treści panelu, krótkie „Dlaczego” po dobrej, XP jako pastylka, prawdziwy test innych motywów) wchodzą w etap 2 (ten sam panel).
- Etap 2 runda 1: 8/10, twarde błędy: brak, K1–K4 true → ZALICZONY. Drobne poprawki recenzenta (dymek z ogonkiem i losowy, pytanie o dźwięki najwyżej raz także bez wyboru, kafelek ikony w Ustawieniach, błyskawica w innych motywach) wchodzą razem z etapem 3.
- Decyzja etap 2: stałe chipy XP i monet w nagłówku odtwarzacza schowane już teraz (wizualnie, w DOM zostają dla lpFloat), bo combo przy 360 px dawało przewijanie w bok; etap 4 to domyka.
- Etap 3 runda 1: 8/10, twarde błędy: brak, K1–K5 true → ZALICZONY. Poprawki recenzenta (emoji w kickerach, wyjaśnienie złego pojęcia, nieprzezroczysty dolny pasek w motywach, konfetti gaśnie przy zmianie karty, krótszy stagger, „Wcześniej: błąd w części N”, twardszy test K3) wchodzą w etap 4.
- Decyzje etap 3: `tf` zostaje jednym dotknięciem; karty z pewnością zawsze ją zapisują; druga szansa na koniec części po ≥ 2 kartach, inaczej w następnej części (indeks 3), w formie luki z bankiem pojęć, gdy w lekcji są ≥ 3 pojęcia.
- Etap 4 runda 1: 8/10, twarde błędy: brak, K1–K4 true → ZALICZONY (recenzja przerwana limitem API, wznowiona 17.11). Drobne poprawki (toast nad paskiem, „Pomiń krok” w rzędzie z podpowiedzią, karta czytania bez pustej bieli, nowrap „Część N”, stałe „+N XP” w werdykcie) wchodzą w etap 5.
- Etap 5 runda 1: 7/10, twarde błędy: brak, K1 false (brak sprawdzenia Powtórek/rewanży i wariantu „1/2”) → poprawki.
- Etap 5 runda 2: 8/10, twarde błędy: brak, K1–K6 true → ZALICZONY. Przed commitem poprawione 2 błędy z uwag (oceny fiszki w dolnym pasku na ekranie końca Powtórek, cel dnia z ZD_NAWYK = max z wartością po zapisie XP). Pozostałe uwagi (kosmetyka ekranów końca Powtórek i karty przejścia) w RAPORT.md.
