# UX-3 · etap 1 · runda 1: pomiary

| scena | axe | kontrast < AA | cele < 44 px | przewijanie w bok | konsola | animacje | ruch wyłączony |
|---|---|---|---|---|---|---|---|
| 360-jasny-zla | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, h-shine, lp-fall, lp-out, lpux-fbin, lp-shake, lp-ok | — |
| 360-ciemny-zla | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, h-shine, lp-fall, lp-out, lpux-fbin, lp-shake, lp-ok | — |
| 360-jasny-dobra | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, h-shine, lp-fall, lp-out, lpux-fbin, lp-ok, lp-float | — |
| 360-ciemny-dobra | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, h-shine, lp-fall, lp-out, lpux-fbin, lp-ok, lp-float | — |
| 375-jasny-zla | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, h-shine, lp-fall, lp-out, lpux-fbin, lp-shake, lp-ok | — |
| 390-jasny-zla | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, h-shine, lp-fall, lp-out, lpux-fbin, lp-shake, lp-ok | — |
| 390-ciemny-zla | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, h-shine, lp-fall, lp-out, lpux-fbin, lp-shake, lp-ok | — |
| 1280-jasny-zla | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, lp-fall, h-shine, lp-out, lpux-fbin, lp-shake, lp-ok | — |
| 1280-ciemny-dobra | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, h-shine, lp-fall, lp-out, lpux-fbin, lp-ok, lp-float | — |
| 390-en-zla | 0 | 0 | 0 | nie | 0 | lp-in, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, h-shine, lp-fall, lp-out, lpux-fbin, lp-shake, lp-ok | — |
| 360-reduced-zla | 0 | 0 | 0 | nie | 0 | — | tak |
| 360-calm-zla | 0 | 0 | 0 | nie | 0 | — | tak |
| 390-pink-zla | 0 | 0 | 0 | nie | 0 | lp-in, h-shine, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, lp-fall, lp-out, lpux-fbin, lp-shake, lp-ok | — |
| 390-noc-zla | 0 | 0 | 0 | nie | 0 | lp-in, h-shine, lp-ring, lp-pop, h-pop, sf-hop, sf-glint, h-flame, lp-fall, lp-out, lpux-fbin, lp-shake, lp-ok | — |
| 390-jasny-powtorki | 0 | 0 | Wybierz przedmiot 173×43 | nie | 0 | art-in, a-bob | — |
| 390-ciemny-powtorki | 0 | 0 | Wybierz przedmiot 173×43 | nie | 0 | art-in, a-bob | — |

Szczegóły (axe, kontrast, cele) w `raport.json`. Zrzuty: pliki `*.png` w tym katalogu.

## Test etapu `docs/gry/test/ux3-etap1.mjs`: 75/75
```
✓ jasny: doszliśmy do pytania kontrolnego części
✓ jasny: przed odpowiedzią dolny pasek bez werdyktu
✓ jasny: K1 werdykt w całości w oknie 360×640 (góra 323, dół 347)
✓ jasny: K1 „Dlaczego” przewija się wewnątrz panelu (maks. 38dvh, overflow auto)
✓ jasny: K2 data-fb="no", dolny pasek w czerwieni z palety (--bad-soft)
✓ jasny: K2 przycisk „Rozumiem” na dole
✓ jasny: K3 „Poprawna: …” + Dlaczego + „Czemu nie …?”
✓ jasny: K3 poprawna odpowiedź podświetlona w karcie, stary panel w karcie zniknął
✓ jasny: K4 ikona ✗ (SVG) obok werdyktu
✓ jasny: K4 kontrast tytułu, treści i przycisku AA
✓ jasny: bez przewijania w bok przy 360 px
✓ jasny: K2 po „Dalej” data-fb znika
✓ jasny: K2 dobra odpowiedź → data-fb="ok", pasek w zieleni H2 (--h-acc-soft)
✓ jasny: K4 kontrast tytułu „ok” AA
✓ jasny: K5 pastylka „+N” nie przecina tekstu wybranej opcji
✓ jasny: bez błędów w konsoli
✓ ciemny: doszliśmy do pytania kontrolnego części
✓ ciemny: przed odpowiedzią dolny pasek bez werdyktu
✓ ciemny: K1 werdykt w całości w oknie 360×640 (góra 323, dół 347)
✓ ciemny: K1 „Dlaczego” przewija się wewnątrz panelu (maks. 38dvh, overflow auto)
✓ ciemny: K2 data-fb="no", dolny pasek w czerwieni z palety (--bad-soft)
✓ ciemny: K2 przycisk „Rozumiem” na dole
✓ ciemny: K3 „Poprawna: …” + Dlaczego + „Czemu nie …?”
✓ ciemny: K3 poprawna odpowiedź podświetlona w karcie, stary panel w karcie zniknął
✓ ciemny: K4 ikona ✗ (SVG) obok werdyktu
✓ ciemny: K4 kontrast tytułu, treści i przycisku AA
✓ ciemny: bez przewijania w bok przy 360 px
✓ ciemny: K2 po „Dalej” data-fb znika
✓ ciemny: K2 dobra odpowiedź → data-fb="ok", pasek w zieleni H2 (--h-acc-soft)
✓ ciemny: K4 kontrast tytułu „ok” AA
✓ ciemny: K5 pastylka „+N” nie przecina tekstu wybranej opcji
✓ ciemny: bez błędów w konsoli
✓ reduced: doszliśmy do pytania kontrolnego części
✓ reduced: przed odpowiedzią dolny pasek bez werdyktu
✓ reduced: K1 werdykt w całości w oknie 360×640 (góra 323, dół 347)
✓ reduced: K1 „Dlaczego” przewija się wewnątrz panelu (maks. 38dvh, overflow auto)
✓ reduced: K2 data-fb="no", dolny pasek w czerwieni z palety (--bad-soft)
✓ reduced: K2 przycisk „Rozumiem” na dole
✓ reduced: K3 „Poprawna: …” + Dlaczego + „Czemu nie …?”
✓ reduced: K3 poprawna odpowiedź podświetlona w karcie, stary panel w karcie zniknął
✓ reduced: K4 ikona ✗ (SVG) obok werdyktu
✓ reduced: K4 kontrast tytułu, treści i przycisku AA
✓ reduced: bez przewijania w bok przy 360 px
✓ reduced: K2 po „Dalej” data-fb znika
✓ reduced: K2 dobra odpowiedź → data-fb="ok", pasek w zieleni H2 (--h-acc-soft)
✓ reduced: K4 kontrast tytułu „ok” AA
✓ reduced: K5 przy ograniczonym ruchu „+N XP” jest w tytule panelu
✓ reduced: bez błędów w konsoli
✓ calm: doszliśmy do pytania kontrolnego części
✓ calm: przed odpowiedzią dolny pasek bez werdyktu
✓ calm: K1 werdykt w całości w oknie 360×640 (góra 323, dół 347)
✓ calm: K1 „Dlaczego” przewija się wewnątrz panelu (maks. 38dvh, overflow auto)
✓ calm: K2 data-fb="no", dolny pasek w czerwieni z palety (--bad-soft)
✓ calm: K2 przycisk „Rozumiem” na dole
✓ calm: K3 „Poprawna: …” + Dlaczego + „Czemu nie …?”
✓ calm: K3 poprawna odpowiedź podświetlona w karcie, stary panel w karcie zniknął
✓ calm: K4 ikona ✗ (SVG) obok werdyktu
✓ calm: K4 kontrast tytułu, treści i przycisku AA
✓ calm: bez przewijania w bok przy 360 px
✓ calm: K2 po „Dalej” data-fb znika
✓ calm: K2 dobra odpowiedź → data-fb="ok", pasek w zieleni H2 (--h-acc-soft)
✓ calm: K4 kontrast tytułu „ok” AA
✓ calm: K5 przy ograniczonym ruchu „+N XP” jest w tytule panelu
✓ calm: bez błędów w konsoli
✓ EN: przycisk „Got it” i werdykt po angielsku
✓ EN: bez błędów w konsoli
✓ jasny: K6 karta „Dziś do powtórki” w limonce (rgb(243, 249, 221))
✓ jasny: K6 bez pomarańczu/brązu na karcie
✓ jasny: K6 kontrast tekstów karty AA
✓ jasny: bez błędów w konsoli (Powtórki)
✓ ciemny: K6 karta „Dziś do powtórki” w limonce (rgb(28, 38, 20))
✓ ciemny: K6 bez pomarańczu/brązu na karcie
✓ ciemny: K6 kontrast tekstów karty AA
✓ ciemny: bez błędów w konsoli (Powtórki)
✓ 390-pink: inny motyw: odtwarzacz działa, bez błędów
75/75
```

## Pozostałe testy
- `node --test tests/*.test.js`: 368 ✓, 0 ✗
- `h2-etap1…10.mjs`: wszystkie ✓ (h2-etap4 33/33 i lekcje-v4 31/31 po poprawce asercji w osobnym commicie „test: …”: werdykt czytany z dolnego paska `.lp-fbar` zamiast z karty)
- `lekcja-dnia-5` 24/24, `lekcja-dnia-6` 21/21, `rewanze` 23/23, `h2-etap8` 85/85, `h2-etap9` 92/92
- `lekcja-dnia-4`, `stazysta-stas`, `poziomy` (3 ✗): dokładnie te same błędy na czystym `origin/main` (istniały wcześniej, nie z tej pętli)
- `RUNDA=ux-3 dzis-review.mjs`: tabela identyczna z `docs/dzis-review/runda-3/raport.md` (0 tekstów < AA, 0 axe, 0 celów < 44 px, 0 błędów konsoli)

# Część automatyczna
## 1. `git diff --stat origin/main` (z niezacommitowanymi)
```
docs/gry/test/h2-etap4.mjs  |  7 +++--
 docs/gry/test/lekcje-v4.mjs |  6 ++--
 i18n-en.js                  | 15 +++++++++-
 index.html                  | 68 ++++++++++++++++++++++++++-------------------
 4 files changed, 61 insertions(+), 35 deletions(-)
```
Nowe pliki (jeszcze nie w git):
```
docs/audyt-ux/petla-3/PROGRESS.md
docs/audyt-ux/petla-3/etap-1/runda-1/1280-ciemny-dobra.png
docs/audyt-ux/petla-3/etap-1/runda-1/1280-ciemny-zla.png
docs/audyt-ux/petla-3/etap-1/runda-1/1280-jasny-zla.png
docs/audyt-ux/petla-3/etap-1/runda-1/360-calm-dobra.png
docs/audyt-ux/petla-3/etap-1/runda-1/360-calm-zla.png
docs/audyt-ux/petla-3/etap-1/runda-1/360-ciemny-dobra.png
docs/audyt-ux/petla-3/etap-1/runda-1/360-ciemny-zla.png
docs/audyt-ux/petla-3/etap-1/runda-1/360-en-zla.png
docs/audyt-ux/petla-3/etap-1/runda-1/360-jasny-dobra.png
docs/audyt-ux/petla-3/etap-1/runda-1/360-jasny-zla.png
docs/audyt-ux/petla-3/etap-1/runda-1/360-reduced-dobra.png
docs/audyt-ux/petla-3/etap-1/runda-1/360-reduced-zla.png
docs/audyt-ux/petla-3/etap-1/runda-1/375-jasny-zla.png
docs/audyt-ux/petla-3/etap-1/runda-1/390-ciemny-powtorki.png
docs/audyt-ux/petla-3/etap-1/runda-1/390-ciemny-zla.png
docs/audyt-ux/petla-3/etap-1/runda-1/390-en-zla.png
docs/audyt-ux/petla-3/etap-1/runda-1/390-jasny-powtorki.png
docs/audyt-ux/petla-3/etap-1/runda-1/390-jasny-zla.png
docs/audyt-ux/petla-3/etap-1/runda-1/390-noc-zla.png
docs/audyt-ux/petla-3/etap-1/runda-1/390-pink-zla.png
docs/audyt-ux/petla-3/etap-1/runda-1/pomiary.md
docs/audyt-ux/petla-3/etap-1/runda-1/raport.json
docs/audyt-ux/petla-3/etap-1/runda-1/test-etapu.log
docs/audyt-ux/petla-3/kontrola.mjs
docs/audyt-ux/petla-3/pomiar.mjs
docs/audyt-ux/petla-3/raport.mjs
docs/audyt-ux/petla-3/uwagi-dla-innych.md
docs/gry/test/ux3-etap1.mjs
docs/gry/test/ux3-lib.mjs
lekcja-ux.js
```

## 2. Zmienione miejsca w `index.html` i `skrot-supabase.js` (porównanie z listą B3)
**index.html**: 
- ?v= w linii 1 (tylko i18n.js) (1 linii): dozwolone (umowa / most)
- playerOpen (3 linii): TWOJA (B3)
- lpBuild (4 linii): TWOJA (B3)
- lpAward (4 linii): TWOJA (B3)
- lpFloat (3 linii): TWOJA (B3)
- LPR.mc (8 linii): TWOJA (B3)
- LPR.tf (3 linii): TWOJA (B3)
- LPR.order (2 linii): TWOJA (B3)
- LPR.rvmc (4 linii): TWOJA (B3)
- LPR.num (4 linii): TWOJA (B3)
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
