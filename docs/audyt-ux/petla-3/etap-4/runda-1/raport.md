# UX-3 · etap 4 · runda 1: pomiary

| scena | axe | kontrast < AA | cele < 44 px | przewijanie w bok | konsola | animacje | ruch wyłączony |
|---|---|---|---|---|---|---|---|
| 360-jasny-czytaj | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, h-shine, lp-fall, lp-out, sf-float, sf-brow, sf-blink | — |
| 360-ciemny-czytaj | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, h-shine, lp-fall, lp-out, sf-float, sf-brow, sf-blink, sf-hello | — |
| 390-jasny-czytaj | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, h-shine, lp-fall, lp-out, sf-float, sf-brow, sf-blink, sf-hello | — |
| 1280-jasny-czytaj | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, lp-fall, h-shine, lp-out, sf-float, sf-brow, sf-blink | — |
| 1280-ciemny-czytaj | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, lp-fall, h-shine, lp-out, sf-float, sf-brow, sf-blink, sf-hello | — |
| 360-jasny-combo3 | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, h-shine, lp-fall, lp-out, sf-float, sf-brow, sf-blink, lpux-fbin, lp-ok, lp-float, lpux-hop | — |
| 360-jasny-fiszki | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, h-shine, lp-fall, lp-out, sf-float, sf-brow, sf-blink, lpux-fbin, lp-ok, lp-float, lp-banner | — |
| 360-jasny-dzis-pomin | 0 | 0 | 0 | nie | 0 | h-shine, sf-float, sf-brow, sf-blink, sf-glint, bs-sway, g-wave, lp-in, lp-mark, sf-hello | — |
| 360-ciemny-dzis-pomin | 0 | 0 | 0 | nie | 0 | h-shine, sf-float, sf-brow, sf-blink, sf-glint, bs-sway, g-wave, lp-in, lp-mark, sf-hello | — |
| 390-jasny-pominieto-cofnij | 0 | 0 | 0 | nie | 0 | h-shine, sf-float, sf-brow, sf-blink, sf-glint, bs-sway, g-wave, lp-in, lp-mark, lp-out | — |
| 390-en-czytaj | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, h-shine, lp-fall, lp-out, sf-float, sf-brow, sf-blink | — |
| 390-en-dzis | 0 | 0 | 0 | nie | 0 | h-shine, sf-float, sf-brow, sf-blink, sf-glint, bs-sway, g-wave, lp-in, lp-mark, sf-hello | — |
| 360-reduced-czytaj | 0 | 0 | 0 | nie | 0 | — | tak |
| 360-calm-dzis | 0 | 0 | 0 | nie | 0 | g-wave | NIE |
| 390-pink-czytaj | 0 | 0 | 0 | nie | 0 | lp-in, lp-pop, lp-fall, lp-draw, lp-out | — |
| 390-noc-pytanie | 0 | 0 | 0 | nie | 0 | lp-in, lp-pop, lp-fall, lp-draw, lp-out | — |

Szczegóły (axe, kontrast, cele) w `raport.json`. Zrzuty: pliki `*.png` w tym katalogu.

## Test etapu `docs/gry/test/ux3-etap4.mjs`: 50/50
```
✓ K1 360 px: pasek postępu ≥ 200 px
✓ K1 stałe chipy XP i monet zdjęte z nagłówka (w DOM, niewidoczne)
✓ K1 przy combo pasek nadal ≥ 200 px (w nagłówku krótko „×3”, pełny tekst w DOM i aria-label)
✓ K1 lpFloat dalej działa (pastylka „+N” przy werdykcie)
✓ bez przewijania w bok
✓ bez błędów (K1)
✓ K1 w serii fiszek pasek rośnie po każdej fiszce
✓ bez błędów (fiszki)
✓ 360: K2 „Pomiń krok” w dolnym pasku, ≥ 44 px
✓ 360: K2 w nagłówku nie ma już „Pomiń”
✓ 360: segment karty jako cienki napis pod paskiem
✓ 360: K2 toast „Pominięto. Cofnij”
✓ 360: K2 „Cofnij” przywraca kartę
✓ 360: K2 toast znika po ok. 4 s
✓ 360: bez przewijania w bok (Dziś 5 min)
✓ 360: bez błędów (pomiń)
✓ 390: K2 „Pomiń krok” w dolnym pasku, ≥ 44 px
✓ 390: K2 w nagłówku nie ma już „Pomiń”
✓ 390: segment karty jako cienki napis pod paskiem
✓ 390: K2 toast „Pominięto. Cofnij”
✓ 390: K2 „Cofnij” przywraca kartę
✓ 390: K2 toast znika po ok. 4 s
✓ 390: bez przewijania w bok (Dziś 5 min)
✓ 390: bez błędów (pomiń)
✓ 360: K3 karta wyśrodkowana w pionie (odstęp góra ≈ dół)
✓ 360: K3 tekst 20 px
✓ 360: K3 dół karty → przycisk < 30% wysokości ekranu
✓ 360: K3 mały Staś przy karcie
✓ 360: bez błędów (czytaj)
✓ 390: K3 karta wyśrodkowana w pionie (odstęp góra ≈ dół)
✓ 390: K3 tekst 20 px
✓ 390: K3 dół karty → przycisk < 30% wysokości ekranu
✓ 390: K3 mały Staś przy karcie
✓ 390: bez błędów (czytaj)
✓ 1280: K3 karta wyśrodkowana w pionie (odstęp góra ≈ dół)
✓ 1280: K3 tekst 20 px
✓ 1280: K3 dół karty → przycisk < 30% wysokości ekranu
✓ 1280: K3 mały Staś przy karcie
✓ 1280: K3 ≥ 900 px karta ≤ 720 px, Staś obok
✓ 1280: bez błędów (czytaj)
✓ 390-ciemny: K3 karta wyśrodkowana w pionie (odstęp góra ≈ dół)
✓ 390-ciemny: K3 tekst 20 px
✓ 390-ciemny: K3 dół karty → przycisk < 30% wysokości ekranu
✓ 390-ciemny: K3 mały Staś przy karcie
✓ 390-ciemny: bez błędów (czytaj)
✓ K4 zielony motyw: w odtwarzaczu (poza treścią lekcji) brak emoji
✓ K4 ikony dopisane do H2_ICO (Object.assign)
✓ bez błędów (K4)
✓ pink: odtwarzacz działa (kicker z tekstem), bez błędów
✓ EN: bez błędów
50/50
```

## Pozostałe testy
- `node --test tests/*.test.js`: 368 ✓, 0 ✗ (raz 1 ✗ w `mapa-tematow.test.js` – niestabilny plik tymczasowy skryptu Pythona, poza lekcją; przy powtórce zielony)
- Regresja: `ux3-etap1` 74/74, `ux3-etap2` 61/61, `ux3-etap3` 50/50 (warunek K3 „w następnej części” zaostrzony po uwadze recenzenta etapu 3)
- `h2-etap4` 33/33, `h2-etap5` 36/36, `h2-etap8` 85/85, `h2-etap9` 92/92, `lekcje-v4` 31/31, `lekcja-dnia-4` 103/103, `lekcja-dnia-5` 24/24, `lekcja-dnia-6` 21/21, `rewanze` 23/23, `sprawdzian` 50/50
- `360-calm-dzis`: jedyna animacja to `g-wave` na ekranie Dziś przed otwarciem odtwarzacza (nie w `.lp`, obszar pętli 2); w odtwarzaczu przy calm zero animacji.
- Decyzje etapu 4: emoji z etykiet zdejmuje w zielonych motywach obserwator w `lekcja-ux.js` po tłumaczeniu EN (teksty i pary i18n bez zmian, treść lekcji nietknięta); w kickerach w ich miejscu ikony SVG (`book`, `bulb`, `check`, `warn`, `eye`, `ticket`, `retry`, `bolt` + własne `ux3-*`), gwiazdki jako SVG. Chip combo przy ≤ 420 px pokazuje „×3” (pełny tekst w DOM i aria-label). „Pomiń krok” w dolnym pasku karty 5 min, toast „Pominięto. Cofnij” nad paskiem przez 4 s.
- Poprawki z recenzji etapu 3: wyjaśnienie przy złym pojęciu („Twój wybór” + zdanie z pojęciem), nieprzezroczysty dolny pasek nad konfetti we wszystkich motywach, konfetti gaśnie przy nowej karcie, krótszy stagger opcji (40 ms), „Wcześniej: błąd w części N” na drugiej szansie.
- Część automatyczna pkt 3: zostały tylko (a) mapa `KICK` w `lekcja-ux.js` (emoji jako klucze do ZAMIANY na ikony SVG, nie jako ikony) i (b) stara etykieta „✅ Prawda / ❌ Fałsz” w linii `LPR.tf`, do której doszedł tylko atrybut `data-ux3ico` (ikona SVG); emoji z niej zdejmuje obserwator po tłumaczeniu, więc na ekranie w zielonych motywach go nie ma (test K4 skanuje cały odtwarzacz).

# Część automatyczna
## 1. `git diff --stat origin/main` (z niezacommitowanymi)
```
docs/audyt-ux/petla-3/PROGRESS.md                  |  35 ++
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
 docs/audyt-ux/petla-3/etap-1/runda-1/raport.md     | 182 +++++++
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
 docs/audyt-ux/petla-3/etap-2/runda-1/raport.md     | 214 ++++++++
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
 docs/audyt-ux/petla-3/etap-3/runda-1/raport.json   | 602 +++++++++++++++++++++
 docs/audyt-ux/petla-3/etap-3/runda-1/raport.md     | 259 +++++++++
 docs/audyt-ux/petla-3/etap-3/runda-1/recenzja.json |   1 +
 .../audyt-ux/petla-3/etap-3/runda-1/test-etapu.log |  51 ++
 docs/audyt-ux/petla-3/kontrola.mjs                 | 108 ++++
 docs/audyt-ux/petla-3/pomiar.mjs                   | 142 +++++
 docs/audyt-ux/petla-3/raport.mjs                   |  24 +
 docs/audyt-ux/petla-3/uwagi-dla-innych.md          |   6 +
 docs/gry/test/h2-etap4.mjs                         |  17 +-
 docs/gry/test/lekcje-v4.mjs                        |  24 +-
 docs/gry/test/poziomy.mjs                          |   2 +
 docs/gry/test/rewanze.mjs                          |   4 +-
 docs/gry/test/sprawdzian.mjs                       |   9 +-
 docs/gry/test/ux3-etap1.mjs                        | 101 ++++
 docs/gry/test/ux3-etap2.mjs                        | 138 +++++
 docs/gry/test/ux3-etap3.mjs                        | 187 +++++++
 docs/gry/test/ux3-etap4.mjs                        | 135 +++++
 docs/gry/test/ux3-lib.mjs                          | 110 ++++
 i18n-en.js                                         |  44 +-
 index.html                                         | 233 +++++---
 kosmetyki.js                                       |   4 +
 lekcja-ux.js                                       | 302 +++++++++++
 114 files changed, 3938 insertions(+), 90 deletions(-)
```
Nowe pliki (jeszcze nie w git):
```
docs/audyt-ux/petla-3/etap-4/runda-1/1280-ciemny-czytaj.png
docs/audyt-ux/petla-3/etap-4/runda-1/1280-czytaj.png
docs/audyt-ux/petla-3/etap-4/runda-1/1280-jasny-czytaj.png
docs/audyt-ux/petla-3/etap-4/runda-1/360-calm-dzis.png
docs/audyt-ux/petla-3/etap-4/runda-1/360-ciemny-czytaj.png
docs/audyt-ux/petla-3/etap-4/runda-1/360-ciemny-dzis-pomin.png
docs/audyt-ux/petla-3/etap-4/runda-1/360-czytaj.png
docs/audyt-ux/petla-3/etap-4/runda-1/360-fiszki-pasek.png
docs/audyt-ux/petla-3/etap-4/runda-1/360-ikony.png
docs/audyt-ux/petla-3/etap-4/runda-1/360-jasny-combo3.png
docs/audyt-ux/petla-3/etap-4/runda-1/360-jasny-czytaj.png
docs/audyt-ux/petla-3/etap-4/runda-1/360-jasny-dzis-pomin.png
docs/audyt-ux/petla-3/etap-4/runda-1/360-jasny-fiszki.png
docs/audyt-ux/petla-3/etap-4/runda-1/360-pasek-combo.png
docs/audyt-ux/petla-3/etap-4/runda-1/360-pasek.png
docs/audyt-ux/petla-3/etap-4/runda-1/360-pomin.png
docs/audyt-ux/petla-3/etap-4/runda-1/360-pominieto.png
docs/audyt-ux/petla-3/etap-4/runda-1/360-reduced-czytaj.png
docs/audyt-ux/petla-3/etap-4/runda-1/390-ciemny-czytaj.png
docs/audyt-ux/petla-3/etap-4/runda-1/390-czytaj.png
docs/audyt-ux/petla-3/etap-4/runda-1/390-en-czytaj.png
docs/audyt-ux/petla-3/etap-4/runda-1/390-en-dzis.png
docs/audyt-ux/petla-3/etap-4/runda-1/390-jasny-czytaj.png
docs/audyt-ux/petla-3/etap-4/runda-1/390-jasny-pominieto-cofnij.png
docs/audyt-ux/petla-3/etap-4/runda-1/390-noc-pytanie.png
docs/audyt-ux/petla-3/etap-4/runda-1/390-pink-czytaj.png
docs/audyt-ux/petla-3/etap-4/runda-1/390-pink-pytanie.png
docs/audyt-ux/petla-3/etap-4/runda-1/390-pomin.png
docs/audyt-ux/petla-3/etap-4/runda-1/390-pominieto.png
docs/audyt-ux/petla-3/etap-4/runda-1/pomiary.md
docs/audyt-ux/petla-3/etap-4/runda-1/raport.json
docs/audyt-ux/petla-3/etap-4/runda-1/raport.md
docs/audyt-ux/petla-3/etap-4/runda-1/test-etapu.log
docs/gry/test/ux3-etap5.mjs
```

## 2. Zmienione miejsca w `index.html` i `skrot-supabase.js` (porównanie z listą B3)
**index.html**: 
- ?v= w linii 1 (tylko i18n.js) (1 linii): dozwolone (umowa / most)
- ?v= w linii skryptów (1 linii): dozwolone (umowa / most)
- lpCards (7 linii): TWOJA (B3)
- lpRetryLater (1 linii): TWOJA (B3)
- playerOpen (4 linii): TWOJA (B3)
- lpBuild (7 linii): TWOJA (B3)
- lpTop (7 linii): TWOJA (B3)
- lpAward (7 linii): TWOJA (B3)
- lpFloat (3 linii): TWOJA (B3)
- lpBanner (1 linii): TWOJA (B3)
- lpBuzz (1 linii): TWOJA (B3)
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
- lpBiteDone (5 linii): TWOJA (B3)
- lpSrcDone (1 linii): TWOJA (B3)
- Ustawienia: jeden wiersz (D3) (1 linii): dozwolone (umowa / most)
- kSoundOn (1 linii): TWOJA (B3)
- kSound (5 linii): TWOJA (B3)
- ldSource (4 linii): TWOJA (B3)
- most ux-3 (3 linii): dozwolone (umowa / most)
- skrypt lekcja-ux.js (1 linii): dozwolone (umowa / most)
**skrot-supabase.js**: bez zmian

## 3. Emoji w dodanych liniach kodu (bez i18n-en.js i testów)
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
