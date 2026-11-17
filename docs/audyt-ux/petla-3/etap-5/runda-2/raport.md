# UX-3 · etap 5 · runda 2: pomiary

| scena | axe | kontrast < AA | cele < 44 px | przewijanie w bok | konsola | animacje | ruch wyłączony |
|---|---|---|---|---|---|---|---|
| 390-jasny-karta-przejscia | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, sf-float, sf-brow, sf-blink, sf-glint, h-shine, lp-out, lpux-fbin, lp-ok, sf-hop, lp-float | — |
| 360-ciemny-karta-przejscia | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, sf-float, sf-brow, sf-blink, sf-glint, h-shine, lp-out, lpux-fbin, lp-ok, sf-hop, lp-float | — |
| 390-jasny-koniec-lekcji | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, sf-float, sf-brow, sf-blink, sf-glint, h-shine, lp-out, lpux-fbin, lp-ok, sf-hop, lp-float, h-pop, lpux-hop, h-flame, h-toast, lp-banner, lp-star, lp-fall | — |
| 390-ciemny-koniec-lekcji | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, sf-float, sf-brow, sf-blink, sf-glint, h-shine, lp-out, lpux-fbin, lp-ok, sf-hop, lp-float, h-pop, lpux-hop, h-flame, h-toast, lp-banner, lp-star, lp-fall | — |
| 360-jasny-koniec-niezdany | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, sf-float, sf-brow, sf-blink, sf-glint, h-shine, lp-out, lpux-fbin, lp-ok, sf-hop, lp-float, h-pop, lpux-hop, lp-shake, sf-nope, h-toast, lp-banner, h-flame, lp-star | — |
| 1280-jasny-koniec-lekcji | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, sf-float, sf-brow, sf-blink, sf-glint, h-shine, lp-out, lpux-fbin, lp-ok, sf-hop, lp-float, h-pop, lpux-hop, h-flame, h-toast, lp-banner, lp-star, lp-fall | — |
| 390-jasny-dzis-koniec-zle | 0 | 0 | 0 | nie | 0 | h-shine, sf-float, sf-brow, sf-blink, sf-glint, bs-sway, g-wave, lp-in, lp-mark, lp-out, lp-pop, lpux-fbin, lp-ok, sf-hop, lp-float, lp-shake, sf-nope, h-pop, h-flame | — |
| 390-ciemny-dzis-koniec-dobrze | 0 | 0 | 0 | nie | 0 | h-shine, sf-float, sf-brow, sf-blink, sf-glint, bs-sway, g-wave, lp-in, lp-mark, lp-out, lp-pop, lpux-fbin, lp-ok, sf-hop, lp-float, h-pop, lpux-hop, lp-fall, h-flame | — |
| 360-jasny-dzis-koniec-zle | 0 | 0 | 0 | nie | 0 | h-shine, sf-float, sf-brow, sf-blink, sf-glint, bs-sway, g-wave, lp-in, lp-mark, lp-out, lp-pop, lpux-fbin, lp-ok, sf-hop, lp-float, lp-shake, sf-nope, h-pop, h-flame | — |
| 1280-ciemny-dzis-koniec-zle | 0 | 0 | 0 | nie | 0 | h-shine, sf-float, sf-brow, sf-blink, sf-glint, bs-sway, g-wave, lp-in, lp-mark, lp-out, lp-pop, lpux-fbin, lp-ok, sf-hop, lp-float, lp-shake, sf-nope, h-pop, h-flame | — |
| 390-en-koniec-lekcji | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, sf-float, sf-brow, sf-blink, sf-glint, h-shine, lp-out, lpux-fbin, lp-ok, sf-hop, lp-float, h-pop, lpux-hop, h-flame, h-toast, lp-banner, lp-star, lp-fall | — |
| 390-en-dzis-koniec | 0 | 0 | 0 | nie | 0 | h-shine, sf-float, sf-brow, sf-blink, sf-glint, bs-sway, g-wave, lp-in, lp-mark, lp-out, lp-pop, lpux-fbin, lp-ok, sf-hop, lp-float, lp-shake, sf-nope, h-pop | — |
| 360-reduced-koniec-lekcji | 0 | 0 | 0 | nie | 0 | — | tak |
| 360-calm-dzis-koniec | 0 | 0 | 0 | nie | 0 | g-wave, lp-pop | NIE |
| 390-pink-koniec-lekcji | 0 | 0 | 0 | nie | 0 | lp-in, lp-pop, sf-float, sf-brow, sf-blink, sf-glint, lp-out, lpux-fbin, lp-ok, lp-float, lp-ring, lp-banner, lp-star, lp-fall | — |
| 390-noc-karta-przejscia | 0 | 0 | 0 | nie | 0 | lp-in, lp-pop, sf-float, sf-brow, sf-blink, sf-glint, lp-out, lpux-fbin, lp-ok, lp-float | — |

Szczegóły (axe, kontrast, cele) w `raport.json`. Zrzuty: pliki `*.png` w tym katalogu.

## Test etapu `docs/gry/test/ux3-etap5.mjs`: 67/67
```
✓ K3 rozgrzewka (≤ 2 karty) bez osobnej części
✓ K3 karta przejścia: „Część k z n ✓” + „+XP · wynik z pierwszej próby”, bez Stasia
✓ K3 dokładnie 1 pełny ekran końca, między częściami karty przejścia
✓ K3 konfetti tylko na finale
✓ K3 okno awansu dopiero na finale
✓ K4 główny przycisk „Następna lekcja: Lekcja 2: Podaż →”
✓ K4 „Wróć do mapy lekcji” jako drugorzędny
✓ K6 bez kafli „+0” i „—”
✓ K6 pasek poziomu jest, XP bez powtórek (najwyżej 2 wystąpienia „XP”: licznik i pasek)
✓ K3 okno awansu pokazane na finale (przekroczony próg w tej lekcji)
✓ K4 „Następna lekcja” otwiera odtwarzacz lekcji U2
✓ bez błędów (lekcja)
✓ K6 przy < 3 gwiazdkach linia „3. gwiazdka: … (masz 75%)”
✓ K6 przycisk „Popraw część 2”
✓ K6 przy 2 gwiazdkach Staś bez pełnej radości
✓ K4 bez następnej lekcji, z kartami na dziś: „Powtórki: N kart”
✓ K4 „Powtórki: N kart” przenosi do Powtórek
✓ bez błędów (2 gwiazdki)
✓ K4 niezdany bilet: główny „Spróbuj biletu jeszcze raz”
✓ K2 słaby wynik: tytuł bez „✓”, Staś „oops” albo „think”
✓ bez przewijania w bok (koniec)
✓ K1 karta przejścia części z błędem: „0/1 z pierwszej próby”
✓ K1 „+1 poprawione w drugiej szansie” przy części z drugą szansą
✓ K1 karta przejścia części 2: „1/2 z pierwszej próby”
✓ K1 karta części 3: „+1 poprawione w drugiej szansie (z części 2)”
✓ bez błędów (1/2)
✓ K1 Powtórki: 1 karta źle, potem dobrze → „0/1 z pierwszej próby” i „+1 poprawione w drugiej szansie”
✓ bez błędów (Powtórki)
✓ bez-nawyku-zle: ekran końca karty 5 min
✓ bez-nawyku-zle: K5 bez ZD_NAWYK: Staś + tytuł → pasek celu z LP_DAILY_GOAL
✓ bez-nawyku-zle: K5 jeden główny przycisk „Jeszcze 5 min do celu” / „Gotowe na dziś”
✓ bez-nawyku-zle: K5 wynik i passa w zwijanych „Szczegółach”
✓ bez-nawyku-zle: K5 premia +10 XP za kartę dnia (XP ≥ 10 nawet przy złych odpowiedziach)
✓ bez-nawyku-zle: K2 słaby wynik: tytuł „Dobrze, że to wyszło teraz, a nie na kolokwium”, Staś „oops”
✓ bez-nawyku-zle: K2 pierwszy przycisk „Powtórz błędne (N)”
✓ bez-nawyku-zle: najwyżej 2 przyciski na widoku (główny + „Powtórz błędne”)
✓ bez-nawyku-zle: K6 bez kafli „+0” i „—”
✓ bez-nawyku-zle: K2 „Powtórz błędne” uruchamia błędne pytania tej sesji
✓ bez-nawyku-zle: bez błędów
✓ nawyk-zle: ekran końca karty 5 min
✓ nawyk-zle: K5 kolejność: Staś + tytuł → seria → zamrożenie → cel dnia → jutro → przypomnienie → zadania
✓ nawyk-zle: K5 jeden główny przycisk „Jeszcze 5 min do celu” / „Gotowe na dziś”
✓ nawyk-zle: K5 wynik i passa w zwijanych „Szczegółach”
✓ nawyk-zle: K5 premia +10 XP za kartę dnia (XP ≥ 10 nawet przy złych odpowiedziach)
✓ nawyk-zle: K2 słaby wynik: tytuł „Dobrze, że to wyszło teraz, a nie na kolokwium”, Staś „oops”
✓ nawyk-zle: K2 pierwszy przycisk „Powtórz błędne (N)”
✓ nawyk-zle: najwyżej 2 przyciski na widoku (główny + „Powtórz błędne”)
✓ nawyk-zle: K6 bez kafli „+0” i „—”
✓ nawyk-zle: bez błędów
✓ nawyk-dobrze: ekran końca karty 5 min
✓ nawyk-dobrze: K5 kolejność: Staś + tytuł → seria → zamrożenie → cel dnia → jutro → przypomnienie → zadania
✓ nawyk-dobrze: K5 jeden główny przycisk „Jeszcze 5 min do celu” / „Gotowe na dziś”
✓ nawyk-dobrze: K5 wynik i passa w zwijanych „Szczegółach”
✓ nawyk-dobrze: K5 premia +10 XP za kartę dnia (XP ≥ 10 nawet przy złych odpowiedziach)
✓ nawyk-dobrze: K2 dobry wynik: „Świetnie! ✓”, Staś „ok”, bez „Powtórz błędne”
✓ nawyk-dobrze: K6 bez kafli „+0” i „—”
✓ nawyk-dobrze: K5 główny przycisk zielony (primary)
✓ nawyk-dobrze: K5 „Jeszcze 5 min do celu” prowadzi do nauki (lekcja dnia albo Powtórki)
✓ nawyk-dobrze: bez błędów
✓ ciemny-dobrze: ekran końca karty 5 min
✓ ciemny-dobrze: K5 bez ZD_NAWYK: Staś + tytuł → pasek celu z LP_DAILY_GOAL
✓ ciemny-dobrze: K5 jeden główny przycisk „Jeszcze 5 min do celu” / „Gotowe na dziś”
✓ ciemny-dobrze: K5 wynik i passa w zwijanych „Szczegółach”
✓ ciemny-dobrze: K5 premia +10 XP za kartę dnia (XP ≥ 10 nawet przy złych odpowiedziach)
✓ ciemny-dobrze: K2 dobry wynik: „Świetnie! ✓”, Staś „ok”, bez „Powtórz błędne”
✓ ciemny-dobrze: K6 bez kafli „+0” i „—”
✓ ciemny-dobrze: bez błędów
67/67
```

## Pozostałe testy
- `node --test tests/*.test.js`: 367 ✓ + `mapa-tematow.test.js` niestabilny przy uruchomieniu całego zestawu (osobno 4/4, jak na `origin/main`; plik tymczasowy skryptu Pythona, poza lekcją)
- Regresja: `ux3-etap1` 74/74, `ux3-etap2` 61/61, `ux3-etap3` 50/50, `ux3-etap4` 50/50
- Stare testy (po poprawce asercji w osobnym commicie „test: …”: karta przejścia między częściami, wyniki karty 5 min w „Szczegółach”, mina Stasia według wyniku): `h2-etap4` 33/33, `lekcje-v4` 31/31; bez zmian: `h2-etap5` 36/36, `h2-etap8` 85/85, `h2-etap9` 92/92, `lekcja-dnia-4` 103/103, `lekcja-dnia-5` 24/24, `lekcja-dnia-6` 21/21, `rewanze` 23/23, `sprawdzian` 50/50; `poziomy` 3 ✗ jak na czystym `origin/main`.
- Ruch przy reduced/calm: w odtwarzaczu (`.lp`) zero animacji. Kolumna „NIE” w dwóch scenach to `lp-pop` w oknie „Awans!” (`#layer .lvup`, treść okna należy do pętli 5; pętla 3 zmieniła tylko moment: finał lekcji) oraz `g-wave` na ekranie Dziś przed otwarciem odtwarzacza (pętla 2). Zapisane w `uwagi-dla-innych.md`.
- Decyzje etapu 5: karta przejścia (`.lp-step`) po każdej części lekcji krótszej niż 4 min, pełny ekran tylko na finale (i po części ≥ 4 min); rozgrzewka ≤ 2 kart dołącza do części 1 (migracja `done.warm`); konfetti w lekcji tylko na finale; awans w lekcji czeka w `LP.lvPending` do finału albo zamknięcia (✕). Karta 5 min: tytuł i Staś według wyniku (≥ 80% / 40–80% / < 40%), „Powtórz błędne (N)” = błędne pytania tej sesji jako talia Powtórek, kolejność `ZD_NAWYK` (atrapa w teście) albo sam pasek celu z `LP_DAILY_GOAL`, wyniki w „Szczegółach”, premia +10 XP raz dziennie. „+N XP” stale w tytule werdyktu (uwaga recenzenta etapu 4). Karta czytania: min. wysokość zmniejszona do min(34dvh, 300px) (uwaga recenzenta, z zachowaniem K3 etapu 4).
- Część automatyczna pkt 3: emoji zostały tylko w starych danych/tekstach linii, do których doszła zmiana: ikona części „Rozgrzewka” (`icon: "🔥"`, dane talii; w zielonych motywach ikona SVG płomienia), baner awansu poza lekcją (`🎉 Awans`, ścieżka bez zmian), etykiety „✅ Prawda / ❌ Fałsz” (ikony SVG przez `data-ux3ico`) i mapa `KICK` (klucze do zamiany na SVG). Obserwator w `lekcja-ux.js` zdejmuje emoji z tekstów odtwarzacza w zielonych motywach (test K4 etapu 4).
- Runda 2 (poprawki recenzenta rundy 1): test K1 rozszerzony o Powtórki (1 karta: źle, potem dobrze → „0/1 z pierwszej próby · +1 poprawione w drugiej szansie”) i część z 2 pytaniami („1/2”, poprawka w następnej części jako „+1 poprawione w drugiej szansie (z części 2)”); „N do powtórki jutro” zamiast „+0 poprawione”; odznaka rangi nie jest już czyszczona z emoji (`.rk-badge` w wyjątkach); „Jeszcze 5 min do celu” bez lekcji dnia otwiera Powtórki, główny przycisk karty dnia zawsze zielony; XP sesji przy pasku celu (pasek rośnie od wartości sprzed sesji) i linia „Karta dnia: +10 XP”; „Szczegóły” z chevronem; przy 2 gwiazdkach bez następnej lekcji i Powtórek głównym przyciskiem jest „Popraw część k”, mina Stasia „hi”; fokus nagłówka finału bez ramki przy dotyku; okno awansu po 2,8 s (po doliczeniu liczb) albo przy zamknięciu; EN chip combo „×N in a row”; progi miny i tytułu 80% / 40% także dla lekcji dnia; test gałęzi „Powtórki: N kart” z kliknięciem.
- „Część k z n”: n to liczba części na mapie lekcji (z biletem wyjścia), tak jak na mapie i w nagłówkach kart; pasek u góry pokazuje karty bieżącej części, nie części (bez zmiany, żeby mapa i karta przejścia mówiły to samo).
- `360-calm-dzis-koniec`: jedyna animacja to `g-wave` na ekranie Dziś przed otwarciem odtwarzacza (pętla 2); w odtwarzaczu zero.

# Część automatyczna
## 1. `git diff --stat origin/main` (z niezacommitowanymi)
```
docs/audyt-ux/petla-3/PROGRESS.md                  |  36 ++
 .../petla-3/etap-1/runda-1/1280-ciemny-dobra.png   | Bin 0 -> 145003 bytes
 .../petla-3/etap-1/runda-1/1280-ciemny-zla.png     | Bin 0 -> 159292 bytes
 .../petla-3/etap-1/runda-1/1280-jasny-zla.png      | Bin 0 -> 157088 bytes
 .../petla-3/etap-1/runda-1/360-calm-dobra.png      | Bin 0 -> 76640 bytes
 .../petla-3/etap-1/runda-1/360-calm-zla.png        | Bin 0 -> 71666 bytes
 .../petla-3/etap-1/runda-1/360-ciemny-dobra.png    | Bin 0 -> 70793 bytes
 .../petla-3/etap-1/runda-1/360-ciemny-zla.png      | Bin 0 -> 72615 bytes
 .../audyt-ux/petla-3/etap-1/runda-1/360-en-zla.png | Bin 0 -> 71015 bytes
 .../petla-3/etap-1/runda-1/360-jasny-dobra.png     | Bin 0 -> 70445 bytes
 .../petla-3/etap-1/runda-1/360-jasny-zla.png       | Bin 0 -> 71736 bytes
 .../petla-3/etap-1/runda-1/360-reduced-dobra.png   | Bin 0 -> 76640 bytes
 .../petla-3/etap-1/runda-1/360-reduced-zla.png     | Bin 0 -> 71666 bytes
 .../petla-3/etap-1/runda-1/375-jasny-zla.png       | Bin 0 -> 94932 bytes
 .../petla-3/etap-1/runda-1/390-ciemny-powtorki.png | Bin 0 -> 67649 bytes
 .../petla-3/etap-1/runda-1/390-ciemny-zla.png      | Bin 0 -> 107169 bytes
 .../audyt-ux/petla-3/etap-1/runda-1/390-en-zla.png | Bin 0 -> 104425 bytes
 .../petla-3/etap-1/runda-1/390-jasny-powtorki.png  | Bin 0 -> 66651 bytes
 .../petla-3/etap-1/runda-1/390-jasny-zla.png       | Bin 0 -> 105147 bytes
 .../petla-3/etap-1/runda-1/390-noc-zla.png         | Bin 0 -> 105147 bytes
 .../petla-3/etap-1/runda-1/390-pink-zla.png        | Bin 0 -> 105147 bytes
 docs/audyt-ux/petla-3/etap-1/runda-1/pomiary.md    |  22 +
 docs/audyt-ux/petla-3/etap-1/runda-1/raport.json   | 386 +++++++++++++
 docs/audyt-ux/petla-3/etap-1/runda-1/raport.md     | 182 ++++++
 docs/audyt-ux/petla-3/etap-1/runda-1/recenzja.json |   1 +
 .../audyt-ux/petla-3/etap-1/runda-1/test-etapu.log |  76 +++
 .../petla-3/etap-2/runda-1/1280-ciemny-combo3.png  | Bin 0 -> 122720 bytes
 .../petla-3/etap-2/runda-1/1280-jasny-zla-stas.png | Bin 0 -> 161716 bytes
 .../petla-3/etap-2/runda-1/360-calm-combo3.png     | Bin 0 -> 60340 bytes
 .../petla-3/etap-2/runda-1/360-calm-combo5.png     | Bin 0 -> 53387 bytes
 .../petla-3/etap-2/runda-1/360-calm-stas-zla.png   | Bin 0 -> 64645 bytes
 .../petla-3/etap-2/runda-1/360-ciemny-combo3.png   | Bin 0 -> 61210 bytes
 .../petla-3/etap-2/runda-1/360-ciemny-combo5.png   | Bin 0 -> 53340 bytes
 .../etap-2/runda-1/360-ciemny-pytanie-dzwieki.png  | Bin 0 -> 48619 bytes
 .../petla-3/etap-2/runda-1/360-ciemny-stas-zla.png | Bin 0 -> 66308 bytes
 .../petla-3/etap-2/runda-1/360-ciemny-zla-stas.png | Bin 0 -> 66234 bytes
 .../petla-3/etap-2/runda-1/360-jasny-combo3.png    | Bin 0 -> 59653 bytes
 .../petla-3/etap-2/runda-1/360-jasny-combo5.png    | Bin 0 -> 54174 bytes
 .../etap-2/runda-1/360-jasny-pytanie-dzwieki.png   | Bin 0 -> 47464 bytes
 .../petla-3/etap-2/runda-1/360-jasny-stas-zla.png  | Bin 0 -> 65464 bytes
 .../petla-3/etap-2/runda-1/360-jasny-zla-stas.png  | Bin 0 -> 65303 bytes
 .../petla-3/etap-2/runda-1/360-pytanie-dzwieki.png | Bin 0 -> 53929 bytes
 .../petla-3/etap-2/runda-1/360-reduced-combo3.png  | Bin 0 -> 60340 bytes
 .../petla-3/etap-2/runda-1/360-reduced-combo5.png  | Bin 0 -> 53387 bytes
 .../etap-2/runda-1/360-reduced-stas-zla.png        | Bin 0 -> 64645 bytes
 .../etap-2/runda-1/390-ciemny-ustawienia.png       | Bin 0 -> 72364 bytes
 .../petla-3/etap-2/runda-1/390-en-stas.png         | Bin 0 -> 68418 bytes
 .../petla-3/etap-2/runda-1/390-en-ustawienia.png   | Bin 0 -> 69170 bytes
 .../petla-3/etap-2/runda-1/390-en-zla-stas.png     | Bin 0 -> 95038 bytes
 .../petla-3/etap-2/runda-1/390-jasny-combo3.png    | Bin 0 -> 90609 bytes
 .../etap-2/runda-1/390-jasny-ustawienia.png        | Bin 0 -> 70807 bytes
 .../petla-3/etap-2/runda-1/390-noc-combo3.png      | Bin 0 -> 96917 bytes
 .../petla-3/etap-2/runda-1/390-pink-zla.png        | Bin 0 -> 113947 bytes
 .../petla-3/etap-2/runda-1/390-ustawienia.png      | Bin 0 -> 70925 bytes
 docs/audyt-ux/petla-3/etap-2/runda-1/pomiary.md    |  23 +
 docs/audyt-ux/petla-3/etap-2/runda-1/raport.json   | 498 +++++++++++++++++
 docs/audyt-ux/petla-3/etap-2/runda-1/raport.md     | 214 +++++++
 docs/audyt-ux/petla-3/etap-2/runda-1/recenzja.json |   1 +
 .../audyt-ux/petla-3/etap-2/runda-1/test-etapu.log |  62 +++
 .../petla-3/etap-3/runda-1/1280-ciemny-grade4.png  | Bin 0 -> 35684 bytes
 .../petla-3/etap-3/runda-1/1280-jasny-pewnosc.png  | Bin 0 -> 54171 bytes
 .../etap-3/runda-1/360-abcd-blad-czesc2.png        | Bin 0 -> 68684 bytes
 .../etap-3/runda-1/360-abcd-druga-szansa.png       | Bin 0 -> 67422 bytes
 .../petla-3/etap-3/runda-1/360-bank-zle.png        | Bin 0 -> 57835 bytes
 docs/audyt-ux/petla-3/etap-3/runda-1/360-bank.png  | Bin 0 -> 56775 bytes
 .../petla-3/etap-3/runda-1/360-bilet-pewnosc.png   | Bin 0 -> 44894 bytes
 .../petla-3/etap-3/runda-1/360-calm-bank.png       | Bin 0 -> 41202 bytes
 .../petla-3/etap-3/runda-1/360-ciemny-bank.png     | Bin 0 -> 42730 bytes
 .../petla-3/etap-3/runda-1/360-ciemny-grade4.png   | Bin 0 -> 28271 bytes
 .../petla-3/etap-3/runda-1/360-ciemny-pewnosc.png  | Bin 0 -> 46403 bytes
 .../etap-3/runda-1/360-ciemny-zaznaczona.png       | Bin 0 -> 57741 bytes
 .../audyt-ux/petla-3/etap-3/runda-1/360-grade4.png | Bin 0 -> 27864 bytes
 .../petla-3/etap-3/runda-1/360-jasny-bank.png      | Bin 0 -> 42034 bytes
 .../360-jasny-blad-druga-szansa-pozniej.png        | Bin 0 -> 55179 bytes
 .../petla-3/etap-3/runda-1/360-jasny-grade4.png    | Bin 0 -> 27864 bytes
 .../petla-3/etap-3/runda-1/360-jasny-pewnosc.png   | Bin 0 -> 44900 bytes
 .../petla-3/etap-3/runda-1/360-jasny-swipe.png     | Bin 0 -> 26031 bytes
 .../etap-3/runda-1/360-jasny-zaznaczona.png        | Bin 0 -> 56274 bytes
 .../etap-3/runda-1/360-luka-blad-czesc2.png        | Bin 0 -> 56696 bytes
 .../etap-3/runda-1/360-luka-druga-szansa.png       | Bin 0 -> 52167 bytes
 .../etap-3/runda-1/360-recall-samoocena.png        | Bin 0 -> 43881 bytes
 .../petla-3/etap-3/runda-1/360-reduced-pewnosc.png | Bin 0 -> 42769 bytes
 docs/audyt-ux/petla-3/etap-3/runda-1/360-swipe.png | Bin 0 -> 26375 bytes
 .../petla-3/etap-3/runda-1/360-zaznaczona.png      | Bin 0 -> 56574 bytes
 .../petla-3/etap-3/runda-1/390-en-grade4.png       | Bin 0 -> 27623 bytes
 .../petla-3/etap-3/runda-1/390-en-pewnosc.png      | Bin 0 -> 47404 bytes
 .../audyt-ux/petla-3/etap-3/runda-1/390-grade4.png | Bin 0 -> 28953 bytes
 .../petla-3/etap-3/runda-1/390-jasny-grade4.png    | Bin 0 -> 28953 bytes
 .../petla-3/etap-3/runda-1/390-noc-grade4.png      | Bin 0 -> 23416 bytes
 .../petla-3/etap-3/runda-1/390-pink-pewnosc.png    | Bin 0 -> 56030 bytes
 docs/audyt-ux/petla-3/etap-3/runda-1/390-swipe.png | Bin 0 -> 28897 bytes
 docs/audyt-ux/petla-3/etap-3/runda-1/pomiary.md    |  25 +
 docs/audyt-ux/petla-3/etap-3/runda-1/raport.json   | 602 ++++++++++++++++++++
 docs/audyt-ux/petla-3/etap-3/runda-1/raport.md     | 259 +++++++++
 docs/audyt-ux/petla-3/etap-3/runda-1/recenzja.json |   1 +
 .../audyt-ux/petla-3/etap-3/runda-1/test-etapu.log |  51 ++
 .../petla-3/etap-4/runda-1/1280-ciemny-czytaj.png  | Bin 0 -> 43103 bytes
 .../petla-3/etap-4/runda-1/1280-czytaj.png         | Bin 0 -> 42409 bytes
 .../petla-3/etap-4/runda-1/1280-jasny-czytaj.png   | Bin 0 -> 42494 bytes
 .../petla-3/etap-4/runda-1/360-calm-dzis.png       | Bin 0 -> 24641 bytes
 .../petla-3/etap-4/runda-1/360-ciemny-czytaj.png   | Bin 0 -> 30926 bytes
 .../etap-4/runda-1/360-ciemny-dzis-pomin.png       | Bin 0 -> 26707 bytes
 .../audyt-ux/petla-3/etap-4/runda-1/360-czytaj.png | Bin 0 -> 29942 bytes
 .../petla-3/etap-4/runda-1/360-fiszki-pasek.png    | Bin 0 -> 26098 bytes
 docs/audyt-ux/petla-3/etap-4/runda-1/360-ikony.png | Bin 0 -> 35565 bytes
 .../petla-3/etap-4/runda-1/360-jasny-combo3.png    | Bin 0 -> 59018 bytes
 .../petla-3/etap-4/runda-1/360-jasny-czytaj.png    | Bin 0 -> 30110 bytes
 .../etap-4/runda-1/360-jasny-dzis-pomin.png        | Bin 0 -> 26317 bytes
 .../petla-3/etap-4/runda-1/360-jasny-fiszki.png    | Bin 0 -> 20312 bytes
 .../petla-3/etap-4/runda-1/360-pasek-combo.png     | Bin 0 -> 61537 bytes
 docs/audyt-ux/petla-3/etap-4/runda-1/360-pasek.png | Bin 0 -> 79345 bytes
 docs/audyt-ux/petla-3/etap-4/runda-1/360-pomin.png | Bin 0 -> 26145 bytes
 .../petla-3/etap-4/runda-1/360-pominieto.png       | Bin 0 -> 42314 bytes
 .../petla-3/etap-4/runda-1/360-reduced-czytaj.png  | Bin 0 -> 28920 bytes
 .../petla-3/etap-4/runda-1/390-ciemny-czytaj.png   | Bin 0 -> 33240 bytes
 .../audyt-ux/petla-3/etap-4/runda-1/390-czytaj.png | Bin 0 -> 32242 bytes
 .../petla-3/etap-4/runda-1/390-en-czytaj.png       | Bin 0 -> 31783 bytes
 .../petla-3/etap-4/runda-1/390-en-dzis.png         | Bin 0 -> 27492 bytes
 .../petla-3/etap-4/runda-1/390-jasny-czytaj.png    | Bin 0 -> 32403 bytes
 .../etap-4/runda-1/390-jasny-pominieto-cofnij.png  | Bin 0 -> 39113 bytes
 .../petla-3/etap-4/runda-1/390-noc-pytanie.png     | Bin 0 -> 93045 bytes
 .../petla-3/etap-4/runda-1/390-pink-czytaj.png     | Bin 0 -> 38121 bytes
 .../petla-3/etap-4/runda-1/390-pink-pytanie.png    | Bin 0 -> 85538 bytes
 docs/audyt-ux/petla-3/etap-4/runda-1/390-pomin.png | Bin 0 -> 27779 bytes
 .../petla-3/etap-4/runda-1/390-pominieto.png       | Bin 0 -> 44259 bytes
 docs/audyt-ux/petla-3/etap-4/runda-1/pomiary.md    |  22 +
 docs/audyt-ux/petla-3/etap-4/runda-1/raport.json   | 617 +++++++++++++++++++++
 docs/audyt-ux/petla-3/etap-4/runda-1/raport.md     | 297 ++++++++++
 docs/audyt-ux/petla-3/etap-4/runda-1/recenzja.json |   1 +
 .../audyt-ux/petla-3/etap-4/runda-1/test-etapu.log |  51 ++
 docs/audyt-ux/petla-3/kontrola.mjs                 | 110 ++++
 docs/audyt-ux/petla-3/pomiar.mjs                   | 164 ++++++
 docs/audyt-ux/petla-3/raport.mjs                   |  24 +
 docs/audyt-ux/petla-3/uwagi-dla-innych.md          |   9 +
 docs/gry/test/h2-etap4.mjs                         |  21 +-
 docs/gry/test/lekcje-v4.mjs                        |  28 +-
 docs/gry/test/poziomy.mjs                          |   2 +
 docs/gry/test/rewanze.mjs                          |   4 +-
 docs/gry/test/sprawdzian.mjs                       |   9 +-
 docs/gry/test/ux3-etap1.mjs                        | 101 ++++
 docs/gry/test/ux3-etap2.mjs                        | 138 +++++
 docs/gry/test/ux3-etap3.mjs                        | 187 +++++++
 docs/gry/test/ux3-etap4.mjs                        | 135 +++++
 docs/gry/test/ux3-lib.mjs                          | 111 ++++
 i18n-en.js                                         |  72 ++-
 index.html                                         | 351 +++++++++---
 kosmetyki.js                                       |   4 +
 lekcja-ux.js                                       | 370 ++++++++++++
 148 files changed, 5148 insertions(+), 119 deletions(-)
```
Nowe pliki (jeszcze nie w git):
```
docs/audyt-ux/petla-3/etap-5/runda-1/1280-ciemny-dzis-koniec-zle.png
docs/audyt-ux/petla-3/etap-5/runda-1/1280-jasny-koniec-lekcji.png
docs/audyt-ux/petla-3/etap-5/runda-1/360-calm-dzis-koniec.png
docs/audyt-ux/petla-3/etap-5/runda-1/360-ciemny-karta-przejscia.png
docs/audyt-ux/petla-3/etap-5/runda-1/360-jasny-dzis-koniec-zle.png
docs/audyt-ux/petla-3/etap-5/runda-1/360-jasny-koniec-niezdany.png
docs/audyt-ux/petla-3/etap-5/runda-1/360-koniec-niezdany.png
docs/audyt-ux/petla-3/etap-5/runda-1/360-reduced-koniec-lekcji.png
docs/audyt-ux/petla-3/etap-5/runda-1/390-awans-na-finale.png
docs/audyt-ux/petla-3/etap-5/runda-1/390-ciemny-dzis-koniec-dobrze.png
docs/audyt-ux/petla-3/etap-5/runda-1/390-ciemny-koniec-lekcji.png
docs/audyt-ux/petla-3/etap-5/runda-1/390-dzis-koniec-bez-nawyku-zle.png
docs/audyt-ux/petla-3/etap-5/runda-1/390-dzis-koniec-ciemny-dobrze.png
docs/audyt-ux/petla-3/etap-5/runda-1/390-dzis-koniec-nawyk-dobrze.png
docs/audyt-ux/petla-3/etap-5/runda-1/390-dzis-koniec-nawyk-zle.png
docs/audyt-ux/petla-3/etap-5/runda-1/390-en-dzis-koniec.png
docs/audyt-ux/petla-3/etap-5/runda-1/390-en-koniec-lekcji.png
docs/audyt-ux/petla-3/etap-5/runda-1/390-jasny-dzis-koniec-zle.png
docs/audyt-ux/petla-3/etap-5/runda-1/390-jasny-karta-przejscia.png
docs/audyt-ux/petla-3/etap-5/runda-1/390-jasny-koniec-lekcji.png
docs/audyt-ux/petla-3/etap-5/runda-1/390-karta-przejscia.png
docs/audyt-ux/petla-3/etap-5/runda-1/390-koniec-2-gwiazdki.png
docs/audyt-ux/petla-3/etap-5/runda-1/390-koniec-lekcji.png
docs/audyt-ux/petla-3/etap-5/runda-1/390-noc-karta-przejscia.png
docs/audyt-ux/petla-3/etap-5/runda-1/390-pink-koniec-lekcji.png
docs/audyt-ux/petla-3/etap-5/runda-1/pomiary.md
docs/audyt-ux/petla-3/etap-5/runda-1/raport.json
docs/audyt-ux/petla-3/etap-5/runda-1/raport.md
docs/audyt-ux/petla-3/etap-5/runda-1/recenzja.json
docs/audyt-ux/petla-3/etap-5/runda-1/test-etapu.log
docs/audyt-ux/petla-3/etap-5/runda-2/1280-ciemny-dzis-koniec-zle.png
docs/audyt-ux/petla-3/etap-5/runda-2/1280-jasny-koniec-lekcji.png
docs/audyt-ux/petla-3/etap-5/runda-2/360-calm-dzis-koniec.png
docs/audyt-ux/petla-3/etap-5/runda-2/360-ciemny-karta-przejscia.png
docs/audyt-ux/petla-3/etap-5/runda-2/360-jasny-dzis-koniec-zle.png
docs/audyt-ux/petla-3/etap-5/runda-2/360-jasny-koniec-niezdany.png
docs/audyt-ux/petla-3/etap-5/runda-2/360-koniec-niezdany.png
docs/audyt-ux/petla-3/etap-5/runda-2/360-reduced-koniec-lekcji.png
docs/audyt-ux/petla-3/etap-5/runda-2/390-awans-na-finale.png
docs/audyt-ux/petla-3/etap-5/runda-2/390-ciemny-dzis-koniec-dobrze.png
docs/audyt-ux/petla-3/etap-5/runda-2/390-ciemny-koniec-lekcji.png
docs/audyt-ux/petla-3/etap-5/runda-2/390-dzis-koniec-bez-nawyku-zle.png
docs/audyt-ux/petla-3/etap-5/runda-2/390-dzis-koniec-ciemny-dobrze.png
docs/audyt-ux/petla-3/etap-5/runda-2/390-dzis-koniec-nawyk-dobrze.png
docs/audyt-ux/petla-3/etap-5/runda-2/390-dzis-koniec-nawyk-zle.png
docs/audyt-ux/petla-3/etap-5/runda-2/390-en-dzis-koniec.png
docs/audyt-ux/petla-3/etap-5/runda-2/390-en-koniec-lekcji.png
docs/audyt-ux/petla-3/etap-5/runda-2/390-jasny-dzis-koniec-zle.png
docs/audyt-ux/petla-3/etap-5/runda-2/390-jasny-karta-przejscia.png
docs/audyt-ux/petla-3/etap-5/runda-2/390-jasny-koniec-lekcji.png
docs/audyt-ux/petla-3/etap-5/runda-2/390-karta-czesc2-1z2.png
docs/audyt-ux/petla-3/etap-5/runda-2/390-karta-przejscia.png
docs/audyt-ux/petla-3/etap-5/runda-2/390-koniec-2-gwiazdki.png
docs/audyt-ux/petla-3/etap-5/runda-2/390-koniec-lekcji.png
docs/audyt-ux/petla-3/etap-5/runda-2/390-noc-karta-przejscia.png
docs/audyt-ux/petla-3/etap-5/runda-2/390-pink-koniec-lekcji.png
docs/audyt-ux/petla-3/etap-5/runda-2/390-powtorki-koniec.png
docs/audyt-ux/petla-3/etap-5/runda-2/pomiary.md
docs/audyt-ux/petla-3/etap-5/runda-2/raport.json
docs/audyt-ux/petla-3/etap-5/runda-2/test-etapu.log
docs/gry/test/ux3-etap5.mjs
```

## 2. Zmienione miejsca w `index.html` i `skrot-supabase.js` (porównanie z listą B3)
**index.html**: 
- ?v= w linii 1 (tylko i18n.js) (1 linii): dozwolone (umowa / most)
- ?v= w linii skryptów (1 linii): dozwolone (umowa / most)
- lpBuildDeck (4 linii): TWOJA (B3)
- lpLoad (2 linii): TWOJA (B3)
- lpCards (8 linii): TWOJA (B3)
- lpRetryLater (1 linii): TWOJA (B3)
- playerOpen (4 linii): TWOJA (B3)
- lpClose (1 linii): TWOJA (B3)
- lpBuild (7 linii): TWOJA (B3)
- lpTop (7 linii): TWOJA (B3)
- lpAward (9 linii): TWOJA (B3)
- lpFloat (3 linii): TWOJA (B3)
- lpBanner (1 linii): TWOJA (B3)
- lpBuzz (1 linii): TWOJA (B3)
- xpFlush (2 linii): TWOJA (B3)
- lpKeys (4 linii): TWOJA (B3)
- lpNo (1 linii): TWOJA (B3)
- kick (4 linii): TWOJA (B3)
- lpSel (12 linii): TWOJA (B3)
- lpRetryAdd (10 linii): TWOJA (B3)
- lpGapFor (6 linii): TWOJA (B3)
- lpBank (6 linii): TWOJA (B3)
- LPR.mc (13 linii): TWOJA (B3)
- LPR.read (1 linii): TWOJA (B3)
- LPR.recall (19 linii): TWOJA (B3)
- LPR.tf (5 linii): TWOJA (B3)
- LPR.order (2 linii): TWOJA (B3)
- LPR.swipe (3 linii): TWOJA (B3)
- LPR.grade4 (6 linii): TWOJA (B3)
- LPR.rvmc (8 linii): TWOJA (B3)
- LPR.num (5 linii): TWOJA (B3)
- lpBiteDone (58 linii): TWOJA (B3)
- lpBeforeAfter (1 linii): TWOJA (B3)
- lpFinishLesson (1 linii): TWOJA (B3)
- lpSrcDone (7 linii): TWOJA (B3)
- Ustawienia: jeden wiersz (D3) (1 linii): dozwolone (umowa / most)
- kSoundOn (1 linii): TWOJA (B3)
- kSound (5 linii): TWOJA (B3)
- ldSource (25 linii): TWOJA (B3)
- most ux-3 (3 linii): dozwolone (umowa / most)
- skrypt lekcja-ux.js (1 linii): dozwolone (umowa / most)
**skrot-supabase.js**: bez zmian

## 3. Emoji w dodanych liniach kodu (bez i18n-en.js i testów)
- `+    if (warm.length > 2) bites.push({ id: "warm", kind: "warm", title: "Rozgrzewka", icon: "🔥", cards: warm });`
- `+    if (after.n > before.n) { if (LP.open && LP.src?.kind === "lesson") { LP.lvPending = [Math.min(LP.lvPending?.[0] ?? before.n, before.n), after.n]; return; `
- `+        h("div", { class: "lp-two lp-opts" }, [[true, "✅ Prawda"], [false, "❌ Fałsz"]].map(([v, l]) => h("button", { type: "button", "data-ux3ico": v ? "check"`
- `+  const KICK = { "📖": "book", "🧠": "bulb", "✅": "check", "⚠": "warn", "👀": "eye", "🔢": "ux3-num", "✍": "ux3-pen", "🧩": "ux3-puzzle", "💡": "bulb", "🎯": "`
- `+    if (k === "🔥" || k === "⚔") { const H = A().h2Ico; return H ? H(k === "🔥" ? "flame" : "miecze", e) : null; }`

## 4. Skrót tablic `quiz` (atrapa i docs/) przed i po
- origin/main: `5c05c75cf22f420a`  ·  teraz: `5c05c75cf22f420a`  →  RÓWNE

## 5. Nowe migracje SQL
brak (pętla 3 nie ma numerów SQL)

## 6. Nowe teksty PL bez pary w `i18n-en.js`
Kandydaci (sprawdź; część to złożenia albo teksty z istniejącymi parami częściowymi):
- `Nie tym razem. Wynik: {0}{1}.`
- `Popraw część`
- `· {0} do powtórki jutro`
