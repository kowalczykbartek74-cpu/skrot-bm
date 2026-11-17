# UX-3 · etap 3 · runda 1: pomiary

| scena | axe | kontrast < AA | cele < 44 px | przewijanie w bok | konsola | animacje | ruch wyłączony |
|---|---|---|---|---|---|---|---|
| 360-jasny-zaznaczona | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, h-shine, lp-fall, lp-out | — |
| 360-ciemny-zaznaczona | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, h-shine, lp-fall, lp-out | — |
| 360-jasny-pewnosc | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, h-shine, lp-fall, lp-out, lpux-fbin, lp-ok, lp-float, lpux-hop | — |
| 360-ciemny-pewnosc | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, h-shine, lp-fall, lp-out, lpux-fbin, lp-ok, lp-float, lpux-hop | — |
| 360-jasny-bank | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, h-shine, lp-fall, lp-out | — |
| 360-ciemny-bank | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, h-shine, lp-fall, lp-out | — |
| 360-jasny-blad-druga-szansa-pozniej | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, h-shine, lp-fall, lp-out, lp-mark, lpux-fbin, lp-float, lp-ok, lpux-hop, lp-shake, sf-float, sf-nope, sf-blink | — |
| 360-jasny-grade4 | 0 | 0 | 0 | nie | 0 | art-in, a-bob, lp-in | — |
| 360-ciemny-grade4 | 0 | 0 | 0 | nie | 0 | art-in, a-bob, lp-in | — |
| 390-jasny-grade4 | 0 | 0 | 0 | nie | 0 | art-in, a-bob, lp-in | — |
| 360-jasny-swipe | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, h-shine, lp-fall, lp-out, lpux-fbin, lp-ok, lp-float, lp-banner | — |
| 1280-jasny-pewnosc | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, h-shine, lp-fall, lp-out, lpux-fbin, lp-ok, lp-float, lpux-hop | — |
| 1280-ciemny-grade4 | 0 | 0 | 0 | nie | 0 | art-in, a-bob, lp-in | — |
| 390-en-pewnosc | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, h-shine, lp-fall, lp-out, lpux-fbin, lp-ok, lp-float, lpux-hop | — |
| 390-en-grade4 | 0 | 0 | 0 | nie | 0 | art-in, a-bob, lp-in | — |
| 360-reduced-pewnosc | 0 | 0 | 0 | nie | 0 | — | tak |
| 360-calm-bank | 0 | 0 | 0 | nie | 0 | — | tak |
| 390-pink-pewnosc | 0 | 0 | 0 | nie | 0 | lp-in, lp-pop, lp-fall, lp-draw, lp-out, lpux-fbin, lp-ok, lp-float, lp-ring | — |
| 390-noc-grade4 | 0 | 0 | 0 | nie | 0 | art-in, a-bob, lp-in | — |

Szczegóły (axe, kontrast, cele) w `raport.json`. Zrzuty: pliki `*.png` w tym katalogu.

## Test etapu `docs/gry/test/ux3-etap3.mjs`: 50/50
```
✓ K1 przed wyborem „Sprawdź” nieaktywne, na dole
✓ K1 klik w opcję tylko ją zaznacza (.opt.sel, bez odpowiedzi, bez werdyktu)
✓ K1 wybór można zmienić
✓ K1 „Sprawdź” zatwierdza
✓ K1 klawiatura: 2 zaznacza, Enter sprawdza
✓ bez błędów (K1)
✓ doszliśmy do biletu
✓ K1 dwa przyciski „Zgaduję” / „Pewny ✓” w dolnym pasku, ≥ 48 px, nieaktywne do wyboru
✓ K1 bez starych chipów pewności w karcie
✓ K1 po wyborze oba aktywne
✓ K1 + K2 klawisz G = „Zgaduję”, conf = 0 zapisane
✓ K2 „Pewny ✓” zapisuje conf = 1
✓ K2 dobra odpowiedź zgadnięta (conf 0) trafia do rewanży (rewAnswer z wynikiem 0)
✓ bez błędów (K2)
✓ abcd: K3 przy błędzie od razu „Poprawna:” i zapowiedź drugiej szansy później
✓ abcd: K3 druga szansa ≥ 2 karty po błędzie, w następnej części (nie jako kolejna karta)
✓ abcd: K3 sukces drugiej szansy „Teraz siedzi.”
✓ abcd: bez błędów (K3)
✓ luka: K3 przy błędzie od razu „Poprawna:” i zapowiedź drugiej szansy później
✓ luka: K3 druga szansa ≥ 2 karty po błędzie, w następnej części (nie jako kolejna karta)
✓ luka: K3 druga szansa jako luka z bankiem pojęć zamiast tego samego ABCD
✓ luka: K3 sukces drugiej szansy „Teraz siedzi.”
✓ luka: bez błędów (K3)
✓ K5 karta „Szybkie przypomnienie” w lekcji z ≥ 3 pojęciami
✓ K5 3 przyciski-pojęcia pod luką
✓ K5 wybór pojęcia tylko zaznacza
✓ K5 złe pojęcie → data-fb=no, bez XP
✓ K5 przyciski banku ≥ 44 px
✓ bez błędów (K5 bank)
✓ K5/K4 < 3 pojęć: karta samooceny
✓ K4 recall: „Nie wiedziałem / Wiedziałem” w dolnym pasku (top > 0,75 × wysokość), nie w karcie
✓ K5 „Wiedziałem” bez XP za samą samoocenę
✓ bez błędów (samoocena)
✓ 360: doszliśmy do serii fiszek
✓ 360: K4 swipe: „← Nie wiem / Wiem →” w dolnym pasku
✓ 360: doszliśmy do oceny w Powtórkach
✓ 360: K4 grade4: 4 oceny w dolnym pasku (top > 0,75 × wysokość, ≥ 52 px), nie w karcie
✓ 360: K4 krótkie etykiety ocen
✓ 360: bez przewijania w bok (oceny)
✓ 360: K4 klawisz 3 ocenia (Pamiętam)
✓ 360: bez błędów (fiszki, Powtórki)
✓ 390: doszliśmy do serii fiszek
✓ 390: K4 swipe: „← Nie wiem / Wiem →” w dolnym pasku
✓ 390: doszliśmy do oceny w Powtórkach
✓ 390: K4 grade4: 4 oceny w dolnym pasku (top > 0,75 × wysokość, ≥ 52 px), nie w karcie
✓ 390: bez przewijania w bok (oceny)
✓ 390: K4 klawisz 3 ocenia (Pamiętam)
✓ 390: bez błędów (fiszki, Powtórki)
✓ EN: „Guessing” i „Sure ✓”
✓ EN: bez błędów
50/50
```

## Pozostałe testy
- `node --test tests/*.test.js`: 368 ✓, 0 ✗
- Regresja: `ux3-etap1` 74/74, `ux3-etap2` 61/61
- Stare testy po poprawce asercji w osobnych commitach „test: …” (nowa mechanika: zaznacz + „Sprawdź”, pewność i przyciski kart w dolnym pasku): `h2-etap4` 33/33, `lekcje-v4` 31/31, `rewanze` 23/23, `sprawdzian` 50/50, `poziomy` (3 ✗ – te same co na czystym `origin/main`)
- Bez zmian: `h2-etap5` 36/36, `h2-etap8` 85/85, `h2-etap9` 92/92, `lekcja-dnia-4` 103/103, `lekcja-dnia-5` 24/24, `lekcja-dnia-6` 21/21; `stazysta-stas` pada tak samo jak na `main` (strict mode `.stas-face` w teście)
- Decyzja: `tf` (Prawda / Fałsz) zostaje jednym dotknięciem (dwie duże odpowiedzi, brak pewności); zaznacz + Sprawdź dotyczy `mc`, `rvmc` i banku pojęć.
- Decyzja: na kartach z pewnością (bilet, `askConf`) odpowiedź zawsze ma pewność („Zgaduję” albo „Pewny ✓”), więc kalibracja i rewanże dostają dane przy każdej odpowiedzi.
- Krótkie etykiety ocen przy ≤ 400 px: „Nie / Trudne / Pamiętam / Łatwe” (pełne w aria-label).

# Część automatyczna
## 1. `git diff --stat origin/main` (z niezacommitowanymi)
```
docs/audyt-ux/petla-3/PROGRESS.md                  |  33 ++
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
 docs/audyt-ux/petla-3/etap-1/runda-1/raport.json   | 386 ++++++++++++++++
 docs/audyt-ux/petla-3/etap-1/runda-1/raport.md     | 182 ++++++++
 docs/audyt-ux/petla-3/etap-1/runda-1/recenzja.json |   1 +
 .../audyt-ux/petla-3/etap-1/runda-1/test-etapu.log |  76 ++++
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
 docs/audyt-ux/petla-3/etap-2/runda-1/raport.json   | 498 +++++++++++++++++++++
 docs/audyt-ux/petla-3/etap-2/runda-1/raport.md     | 214 +++++++++
 docs/audyt-ux/petla-3/etap-2/runda-1/recenzja.json |   1 +
 .../audyt-ux/petla-3/etap-2/runda-1/test-etapu.log |  62 +++
 docs/audyt-ux/petla-3/kontrola.mjs                 | 108 +++++
 docs/audyt-ux/petla-3/pomiar.mjs                   | 120 +++++
 docs/audyt-ux/petla-3/raport.mjs                   |  24 +
 docs/audyt-ux/petla-3/uwagi-dla-innych.md          |   6 +
 docs/gry/test/h2-etap4.mjs                         |  17 +-
 docs/gry/test/lekcje-v4.mjs                        |  24 +-
 docs/gry/test/poziomy.mjs                          |   2 +
 docs/gry/test/rewanze.mjs                          |   4 +-
 docs/gry/test/sprawdzian.mjs                       |   9 +-
 docs/gry/test/ux3-etap1.mjs                        | 101 +++++
 docs/gry/test/ux3-etap2.mjs                        | 138 ++++++
 docs/gry/test/ux3-lib.mjs                          | 110 +++++
 i18n-en.js                                         |  36 +-
 index.html                                         | 209 ++++++---
 kosmetyki.js                                       |   4 +
 lekcja-ux.js                                       | 207 +++++++++
 75 files changed, 2533 insertions(+), 84 deletions(-)
```
Nowe pliki (jeszcze nie w git):
```
docs/audyt-ux/petla-3/etap-3/runda-1/1280-ciemny-grade4.png
docs/audyt-ux/petla-3/etap-3/runda-1/1280-jasny-pewnosc.png
docs/audyt-ux/petla-3/etap-3/runda-1/360-abcd-blad-czesc2.png
docs/audyt-ux/petla-3/etap-3/runda-1/360-abcd-druga-szansa.png
docs/audyt-ux/petla-3/etap-3/runda-1/360-bank-zle.png
docs/audyt-ux/petla-3/etap-3/runda-1/360-bank.png
docs/audyt-ux/petla-3/etap-3/runda-1/360-bilet-pewnosc.png
docs/audyt-ux/petla-3/etap-3/runda-1/360-calm-bank.png
docs/audyt-ux/petla-3/etap-3/runda-1/360-ciemny-bank.png
docs/audyt-ux/petla-3/etap-3/runda-1/360-ciemny-grade4.png
docs/audyt-ux/petla-3/etap-3/runda-1/360-ciemny-pewnosc.png
docs/audyt-ux/petla-3/etap-3/runda-1/360-ciemny-zaznaczona.png
docs/audyt-ux/petla-3/etap-3/runda-1/360-grade4.png
docs/audyt-ux/petla-3/etap-3/runda-1/360-jasny-bank.png
docs/audyt-ux/petla-3/etap-3/runda-1/360-jasny-blad-druga-szansa-pozniej.png
docs/audyt-ux/petla-3/etap-3/runda-1/360-jasny-grade4.png
docs/audyt-ux/petla-3/etap-3/runda-1/360-jasny-pewnosc.png
docs/audyt-ux/petla-3/etap-3/runda-1/360-jasny-swipe.png
docs/audyt-ux/petla-3/etap-3/runda-1/360-jasny-zaznaczona.png
docs/audyt-ux/petla-3/etap-3/runda-1/360-luka-blad-czesc2.png
docs/audyt-ux/petla-3/etap-3/runda-1/360-luka-druga-szansa.png
docs/audyt-ux/petla-3/etap-3/runda-1/360-recall-samoocena.png
docs/audyt-ux/petla-3/etap-3/runda-1/360-reduced-pewnosc.png
docs/audyt-ux/petla-3/etap-3/runda-1/360-swipe.png
docs/audyt-ux/petla-3/etap-3/runda-1/360-zaznaczona.png
docs/audyt-ux/petla-3/etap-3/runda-1/390-en-grade4.png
docs/audyt-ux/petla-3/etap-3/runda-1/390-en-pewnosc.png
docs/audyt-ux/petla-3/etap-3/runda-1/390-grade4.png
docs/audyt-ux/petla-3/etap-3/runda-1/390-jasny-grade4.png
docs/audyt-ux/petla-3/etap-3/runda-1/390-noc-grade4.png
docs/audyt-ux/petla-3/etap-3/runda-1/390-pink-pewnosc.png
docs/audyt-ux/petla-3/etap-3/runda-1/390-swipe.png
docs/audyt-ux/petla-3/etap-3/runda-1/pomiary.md
docs/audyt-ux/petla-3/etap-3/runda-1/raport.json
docs/audyt-ux/petla-3/etap-3/runda-1/raport.md
docs/audyt-ux/petla-3/etap-3/runda-1/test-etapu.log
docs/gry/test/ux3-etap3.mjs
```

## 2. Zmienione miejsca w `index.html` i `skrot-supabase.js` (porównanie z listą B3)
**index.html**: 
- ?v= w linii 1 (tylko i18n.js) (1 linii): dozwolone (umowa / most)
- ?v= w linii skryptów (1 linii): dozwolone (umowa / most)
- lpCards (7 linii): TWOJA (B3)
- lpRetryLater (1 linii): TWOJA (B3)
- playerOpen (3 linii): TWOJA (B3)
- lpBuild (7 linii): TWOJA (B3)
- lpAward (7 linii): TWOJA (B3)
- lpFloat (3 linii): TWOJA (B3)
- lpBanner (1 linii): TWOJA (B3)
- lpBuzz (1 linii): TWOJA (B3)
- lpKeys (4 linii): TWOJA (B3)
- kick (2 linii): TWOJA (B3)
- lpSel (12 linii): TWOJA (B3)
- lpRetryAdd (10 linii): TWOJA (B3)
- lpGapFor (6 linii): TWOJA (B3)
- lpBank (6 linii): TWOJA (B3)
- LPR.mc (13 linii): TWOJA (B3)
- LPR.recall (17 linii): TWOJA (B3)
- LPR.tf (4 linii): TWOJA (B3)
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
- ldSource (1 linii): TWOJA (B3)
- most ux-3 (3 linii): dozwolone (umowa / most)
- skrypt lekcja-ux.js (1 linii): dozwolone (umowa / most)
**skrot-supabase.js**: bez zmian

## 3. Emoji w dodanych liniach kodu (bez i18n-en.js i testów)
- `+        return { el: [kick(card.again ? "Druga szansa" : "🧠 Szybkie przypomnienie", card), h("p", { class: "muted", style: "margin:0", text: "Które pojęcie pa`

## 4. Skrót tablic `quiz` (atrapa i docs/) przed i po
- origin/main: `5c05c75cf22f420a`  ·  teraz: `5c05c75cf22f420a`  →  RÓWNE

## 5. Nowe migracje SQL
brak (pętla 3 nie ma numerów SQL)

## 6. Nowe teksty PL bez pary w `i18n-en.js`
Kandydaci (sprawdź; część to złożenia albo teksty z istniejącymi parami częściowymi):
- `Nie tym razem. Wynik: {0}{1}.`
