# Pętla UX-2 · Nawyk, seria i powroty — PROGRESS

Gałąź `ux/2-nawyk`, katalog `~/zdawalni/ux-2`, port 8812, własny plik `nawyk.js`, SQL v55–v57.
Wznowienie: „Kontynuuj pętlę UX-2 według ~/zdawalni/ux/petla-2.md i docs/audyt-ux/petla-2/PROGRESS.md”.

## Etapy
| etap | runda | wynik | twarde błędy | stan | commit |
|---|---|---|---|---|---|
| 1 Seria i cel dnia na Dziś | 1 | — | — | w toku | — |
| 2 Zasady serii | — | — | — | — | — |
| 3 Powroty | — | — | — | — | — |
| 4 Kanał poza stroną | — | — | — | — | — |
| 5 Dziś: układ, zadania, duet, tempo | — | — | — | — | — |

## Decyzje
- Start 17.11.2026: katalog `~/zdawalni/ux-2` był gotowy (skrypt Bartka), gałąź `ux/2-nawyk` = `origin/main` (`da5c455`). PGlite działa.
- B1 przyjęte bez zmian (Bartek nic nie zmienił): D2 seria (2 zamrożenia z rzędu, 1 w prezencie, przerwy `CAL.PERIODS` z „Przerwa” i `OFF` nie zrywają), D5 `LP_DAILY_GOAL = 30`, naprawa wysiłkiem (2 dni × 5 min, raz na 30 dni, seria ≥ 3, przerwa 2–4 dni), przypomnienia maks. 1 mail dziennie, godzina z planu, web push tylko po zaliczeniu 1–5, ranking „Ten tydzień” nie tutaj.
- D5: wyboru celu 30/50/80 w Ustawieniach nie robię w etapie 1 (Ustawienia i tekst konta to miejsca innych pętli) — zapis w RAPORT do decyzji Bartka.
- Dni nauki do kalendarza serii: nowe pole `progress.nd` (lista dayN, 120 ostatnich), dopisywane w `xpFlush` przez `ZD_NAWYK.poXp`. Konta sprzed zmiany: kalendarz liczy dni wstecz z `streak` (bez dni zamrożonych i przerw) — przybliżenie, tylko do wyświetlania.
- `OFF` (dni wolne z kalendarza uczelni, np. „Dzień rektorski”, 11 listopada) liczę jako przerwę (jak święta w D2).
- Most wystawia też `xpFlush` (test etapu 1 symuluje pierwszą naukę dnia) i `celXp()` (stała `LP_DAILY_GOAL`).
- Pigułka serii przy 360 px w stanie „do północy”: rząd powitania łamie się (seria w drugim wierszu), zamiast ucinać; ranga < 420 px bez „poz. N”, nazwa do 9 znaków z wielokropkiem (poziom jest w odznace).
- `xpFlush` nie rysuje ekranu, więc `ZD_NAWYK.poXp` odświeża pigułki w miejscu (np. gra na Dziś).
