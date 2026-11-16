# UX-3 · etap 2 · runda 1: pomiary

| scena | axe | kontrast < AA | cele < 44 px | przewijanie w bok | konsola | animacje | ruch wyłączony |
|---|---|---|---|---|---|---|---|
| 360-jasny-zla-stas | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, h-shine, lp-fall, lp-out, lpux-fbin, lp-shake, lp-ok, sf-float, sf-nope, sf-blink | — |
| 360-ciemny-zla-stas | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, h-shine, lp-fall, lp-out, lpux-fbin, lp-shake, lp-ok, sf-float, sf-nope, sf-blink | — |
| 360-jasny-combo3 | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, h-shine, lp-fall, lp-out, lpux-fbin, lp-ok, lp-float, lpux-hop | — |
| 360-ciemny-combo5 | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, h-shine, lp-fall, lp-out, lpux-fbin, lp-ok, lp-float, lpux-hop | — |
| 360-jasny-pytanie-dzwieki | 0 | 0 | 0 53×30 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, h-shine, lp-fall | — |
| 360-ciemny-pytanie-dzwieki | 0 | 0 | 0 53×30 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, h-shine, lp-fall | — |
| 390-jasny-ustawienia | 0 | 0 | 0 | nie | 0 | h-hop | — |
| 390-ciemny-ustawienia | 0 | 0 | 0 | nie | 0 | h-hop | — |
| 390-jasny-combo3 | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, h-shine, lp-fall, lp-out, lpux-fbin, lp-ok, lp-float, lpux-hop | — |
| 1280-jasny-zla-stas | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, h-shine, lp-fall, lp-out, lpux-fbin, lp-shake, lp-ok, sf-float, sf-nope, sf-blink | — |
| 1280-ciemny-combo3 | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, h-shine, lp-fall, lp-out, lpux-fbin, lp-ok, lp-float, lpux-hop | — |
| 390-en-zla-stas | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, h-shine, lp-fall, lp-out, lpux-fbin, lp-shake, lp-ok, sf-float, sf-nope, sf-blink | — |
| 390-en-ustawienia | 0 | 0 | 0 | nie | 0 | h-hop | — |
| 360-reduced-combo3 | 0 | 0 | 0 | nie | 0 | — | tak |
| 360-calm-combo3 | 0 | 0 | 0 | nie | 0 | — | tak |
| 390-pink-zla | 0 | 0 | 0 | nie | 0 | lp-in, lp-pop, lp-fall, lp-draw, lp-out, lpux-fbin, lp-shake, lp-ok | — |
| 390-noc-combo3 | 0 | 1 | 0 | nie | 0 | lp-in, lp-pop, lp-fall, lp-draw, lp-out, lpux-fbin, lp-ok, lp-float, lp-ring | — |

Szczegóły (axe, kontrast, cele) w `raport.json`. Zrzuty: pliki `*.png` w tym katalogu.

## Test etapu `docs/gry/test/ux3-etap2.mjs`: 61/61
```
✓ K1 dobra odpowiedź gra darmowy dźwięk „ok” (createOscillator)
✓ K2 wibracja 18 ms przy dobrej, także przy reduced-motion
✓ K1 zła odpowiedź gra darmowy dźwięk „no”
✓ K2 wibracja [24, 50, 24] przy złej
✓ bez błędów w konsoli (dźwięki)
✓ K1 przy bm-dzwieki=0 żaden dźwięk
✓ K2 przy bm-wibracje=0 bez wibracji
✓ K1 pytanie „Włączyć krótkie dźwięki…” po pierwszej części
✓ K1 treść pytania i dwa przyciski
✓ przyciski pytania ≥ 44 px
✓ K1 „Włącz” zapisuje bm-dzwieki=1
✓ K1 pytanie tylko raz
✓ jasny: K3 Staś 48 px w panelu, mina „oops” przy złej
✓ jasny: K3 dymek z jednym z 3 tekstów
✓ jasny: K3 mina „ok” przy dobrej
✓ jasny: K4 „3 z rzędu!” w tytule panelu, chip „×3 z rzędu” z błyskawicą
✓ jasny: K4 chip bez słowa „seria” i bez 🔥, w limonce
✓ jasny: K4 „5 z rzędu! +5 XP” w tytule, bez banera zasłaniającego kartę
✓ jasny: K3 podskok Stasia przy 3 z rzędu (lp-fb-hop)
✓ jasny: kontrast nagłówka (chip combo) AA
✓ jasny: bez przewijania w bok
✓ jasny: bez błędów w konsoli
✓ ciemny: K3 Staś 48 px w panelu, mina „oops” przy złej
✓ ciemny: K3 dymek z jednym z 3 tekstów
✓ ciemny: K3 mina „ok” przy dobrej
✓ ciemny: K4 „3 z rzędu!” w tytule panelu, chip „×3 z rzędu” z błyskawicą
✓ ciemny: K4 chip bez słowa „seria” i bez 🔥, w limonce
✓ ciemny: K4 „5 z rzędu! +5 XP” w tytule, bez banera zasłaniającego kartę
✓ ciemny: K3 podskok Stasia przy 3 z rzędu (lp-fb-hop)
✓ ciemny: kontrast nagłówka (chip combo) AA
✓ ciemny: bez przewijania w bok
✓ ciemny: bez błędów w konsoli
✓ calm: K3 Staś 48 px w panelu, mina „oops” przy złej
✓ calm: K3 dymek z jednym z 3 tekstów
✓ calm: K3 mina „ok” przy dobrej
✓ calm: K4 „3 z rzędu!” w tytule panelu, chip „×3 z rzędu” z błyskawicą
✓ calm: K4 chip bez słowa „seria” i bez 🔥, w limonce
✓ calm: K4 „5 z rzędu! +5 XP” w tytule, bez banera zasłaniającego kartę
✓ calm: K3 podskok przy 3 z rzędu wyłączony
✓ calm: kontrast nagłówka (chip combo) AA
✓ calm: bez przewijania w bok
✓ calm: bez błędów w konsoli
✓ reduced: K3 Staś 48 px w panelu, mina „oops” przy złej
✓ reduced: K3 dymek z jednym z 3 tekstów
✓ reduced: K3 mina „ok” przy dobrej
✓ reduced: K4 „3 z rzędu!” w tytule panelu, chip „×3 z rzędu” z błyskawicą
✓ reduced: K4 chip bez słowa „seria” i bez 🔥, w limonce
✓ reduced: K4 „5 z rzędu! +5 XP” w tytule, bez banera zasłaniającego kartę
✓ reduced: K3 podskok przy 3 z rzędu wyłączony
✓ reduced: kontrast nagłówka (chip combo) AA
✓ reduced: bez przewijania w bok
✓ reduced: bez błędów w konsoli
✓ pink: K3 bez Stasia w panelu (tylko zielone motywy)
✓ pink: bez błędów
✓ Ustawienia: przełączniki „Dźwięki przy odpowiedziach” i „Wibracje”
✓ Ustawienia: „Wibracje” wyłącza bm-wibracje=0
✓ Ustawienia: „Dźwięki” włącza bm-dzwieki=1
✓ Ustawienia: wiersze ≥ 44 px
✓ Ustawienia: bez błędów
✓ EN: dymek Stasia po angielsku
✓ EN: bez błędów
61/61
```

## Pozostałe testy
- `node --test tests/*.test.js`: 368 ✓, 0 ✗
- `ux3-etap1.mjs` 74/74 (regresja etapu 1), `h2-etap4` 33/33, `h2-etap5` 36/36, `h2-etap8` 85/85, `lekcje-v4` 31/31, `lekcja-dnia-5` 24/24, `lekcja-dnia-6` 21/21, `rewanze` 23/23
- Pomiar kontrastu: tła z gradientem (przyciski motywów pink/noc) pomijane we własnym pomiarze (axe liczy je osobno).
- Cel 53×30 na ekranie końca części („0” monet) to stary chip monet z `lpLevelBar` (zmienia go etap 5).
- `390-noc-combo3`: 1 tekst < AA to litera „C” (biała) na poprawnej opcji w motywie noc: reguła motywu noc sprzed pętli (`:is(.quiz, .lp-opts) .opt.right .k`, wspólna z quizem), nie zmieniana tutaj; zapisane w uwagi-dla-innych (pętla 4, motywy).

# Część automatyczna
## 1. `git diff --stat origin/main` (z niezacommitowanymi)
```
docs/audyt-ux/petla-3/PROGRESS.md                  |  31 ++
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
 docs/audyt-ux/petla-3/etap-1/runda-1/pomiary.md    |  22 ++
 docs/audyt-ux/petla-3/etap-1/runda-1/raport.json   | 386 +++++++++++++++++++++
 docs/audyt-ux/petla-3/etap-1/runda-1/raport.md     | 182 ++++++++++
 docs/audyt-ux/petla-3/etap-1/runda-1/recenzja.json |   1 +
 .../audyt-ux/petla-3/etap-1/runda-1/test-etapu.log |  76 ++++
 docs/audyt-ux/petla-3/kontrola.mjs                 | 105 ++++++
 docs/audyt-ux/petla-3/pomiar.mjs                   |  87 +++++
 docs/audyt-ux/petla-3/raport.mjs                   |  24 ++
 docs/audyt-ux/petla-3/uwagi-dla-innych.md          |   6 +
 docs/gry/test/h2-etap4.mjs                         |   7 +-
 docs/gry/test/lekcje-v4.mjs                        |   6 +-
 docs/gry/test/ux3-etap1.mjs                        | 101 ++++++
 docs/gry/test/ux3-etap2.mjs                        | 138 ++++++++
 docs/gry/test/ux3-lib.mjs                          |  97 ++++++
 i18n-en.js                                         |  30 +-
 index.html                                         |  98 ++++--
 kosmetyki.js                                       |   4 +
 lekcja-ux.js                                       | 186 ++++++++++
 39 files changed, 1543 insertions(+), 44 deletions(-)
```
Nowe pliki (jeszcze nie w git):
```
docs/audyt-ux/petla-3/etap-2/runda-1/1280-ciemny-combo3.png
docs/audyt-ux/petla-3/etap-2/runda-1/1280-jasny-zla-stas.png
docs/audyt-ux/petla-3/etap-2/runda-1/360-calm-combo3.png
docs/audyt-ux/petla-3/etap-2/runda-1/360-calm-combo5.png
docs/audyt-ux/petla-3/etap-2/runda-1/360-calm-stas-zla.png
docs/audyt-ux/petla-3/etap-2/runda-1/360-ciemny-combo3.png
docs/audyt-ux/petla-3/etap-2/runda-1/360-ciemny-combo5.png
docs/audyt-ux/petla-3/etap-2/runda-1/360-ciemny-pytanie-dzwieki.png
docs/audyt-ux/petla-3/etap-2/runda-1/360-ciemny-stas-zla.png
docs/audyt-ux/petla-3/etap-2/runda-1/360-ciemny-zla-stas.png
docs/audyt-ux/petla-3/etap-2/runda-1/360-jasny-combo3.png
docs/audyt-ux/petla-3/etap-2/runda-1/360-jasny-combo5.png
docs/audyt-ux/petla-3/etap-2/runda-1/360-jasny-pytanie-dzwieki.png
docs/audyt-ux/petla-3/etap-2/runda-1/360-jasny-stas-zla.png
docs/audyt-ux/petla-3/etap-2/runda-1/360-jasny-zla-stas.png
docs/audyt-ux/petla-3/etap-2/runda-1/360-pytanie-dzwieki.png
docs/audyt-ux/petla-3/etap-2/runda-1/360-reduced-combo3.png
docs/audyt-ux/petla-3/etap-2/runda-1/360-reduced-combo5.png
docs/audyt-ux/petla-3/etap-2/runda-1/360-reduced-stas-zla.png
docs/audyt-ux/petla-3/etap-2/runda-1/390-ciemny-ustawienia.png
docs/audyt-ux/petla-3/etap-2/runda-1/390-en-stas.png
docs/audyt-ux/petla-3/etap-2/runda-1/390-en-ustawienia.png
docs/audyt-ux/petla-3/etap-2/runda-1/390-en-zla-stas.png
docs/audyt-ux/petla-3/etap-2/runda-1/390-jasny-combo3.png
docs/audyt-ux/petla-3/etap-2/runda-1/390-jasny-ustawienia.png
docs/audyt-ux/petla-3/etap-2/runda-1/390-noc-combo3.png
docs/audyt-ux/petla-3/etap-2/runda-1/390-pink-zla.png
docs/audyt-ux/petla-3/etap-2/runda-1/390-ustawienia.png
docs/audyt-ux/petla-3/etap-2/runda-1/pomiary.md
docs/audyt-ux/petla-3/etap-2/runda-1/raport.json
docs/audyt-ux/petla-3/etap-2/runda-1/raport.md
docs/audyt-ux/petla-3/etap-2/runda-1/test-etapu.log
```

## 2. Zmienione miejsca w `index.html` i `skrot-supabase.js` (porównanie z listą B3)
**index.html**: 
- ?v= w linii 1 (tylko i18n.js) (1 linii): dozwolone (umowa / most)
- ?v= w linii skryptów (1 linii): dozwolone (umowa / most)
- playerOpen (3 linii): TWOJA (B3)
- lpBuild (4 linii): TWOJA (B3)
- lpAward (7 linii): TWOJA (B3)
- lpFloat (3 linii): TWOJA (B3)
- lpBanner (1 linii): **POZA LISTĄ – sprawdź**
- lpBuzz (1 linii): TWOJA (B3)
- LPR.mc (8 linii): TWOJA (B3)
- LPR.tf (4 linii): TWOJA (B3)
- LPR.order (2 linii): TWOJA (B3)
- LPR.rvmc (5 linii): TWOJA (B3)
- LPR.num (5 linii): TWOJA (B3)
- lpBiteDone (3 linii): TWOJA (B3)
- lpSrcDone (1 linii): TWOJA (B3)
- setWyglad (1 linii): **POZA LISTĄ – sprawdź**
- kSoundOn (1 linii): TWOJA (B3)
- kSound (5 linii): TWOJA (B3)
- ldSource (1 linii): TWOJA (B3)
- most ux-3 (3 linii): dozwolone (umowa / most)
- skrypt lekcja-ux.js (1 linii): dozwolone (umowa / most)
**skrot-supabase.js**: bez zmian

## 3. Emoji w dodanych liniach kodu (bez i18n-en.js i testów)
brak

## 4. Skrót tablic `quiz` (atrapa i docs/) przed i po
- origin/main: `5c05c75cf22f420a`  ·  teraz: `5c05c75cf22f420a`  →  RÓWNE

## 5. Nowe migracje SQL
brak (pętla 3 nie ma numerów SQL)

## 6. Nowe teksty PL bez pary w `i18n-en.js`
Kandydaci (sprawdź; część to złożenia albo teksty z istniejącymi parami częściowymi):
- `Nie tym razem. Wynik: {0}{1}.`
