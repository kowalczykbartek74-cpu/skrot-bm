# Kontrola automatyczna – pętla UX-1

Stan: da5c455 Merge remote-tracking branch 'origin/main' into logowanie-h (+ zmiany niezacommitowane)

## git diff --stat origin/main

```
docs/gry/test/atrapa-supabase.js |  9 +++-
 docs/gry/test/h2-etap9.mjs       |  3 +-
 i18n-en.js                       | 23 ++++++++--
 index.html                       | 13 +++++-
 skrot-supabase.js                | 90 ++++++++++++++++++++++++++++++++++------
 supabase/test/pglite.mjs         |  2 +-
 6 files changed, 118 insertions(+), 22 deletions(-)
nowy (niedodany): docs/audyt-ux/
nowy (niedodany): docs/gry/test/ux1-etap1.mjs
nowy (niedodany): docs/gry/test/ux1-etap2.mjs
nowy (niedodany): docs/logowanie-review/0/
nowy (niedodany): supabase/skrot-v52-proba-rocznik.sql
nowy (niedodany): supabase/test/v52.sql
nowy (niedodany): ux-wejscie.css
nowy (niedodany): ux-wejscie.js
```

## Zmienione funkcje (porównanie z listą B3)

### index.html

- ✓ `(linia 1: #login)` (linie 1)
- ✗ POZA LISTĄ `(CSS)` (linie 5376)
- ◦ umowa/most `(ładowanie własnego pliku)` (linie 5379, 22931)
- ◦ umowa/most `(linia <script src> – ?v=)` (linie 5391)
- ◦ umowa/most `(wywołanie z umowy)` (linie 8005)
- ◦ umowa/most `(blok mostu)` (linie 22926)

### skrot-supabase.js

- ✓ `otpErr` (linie 973)
- ✓ `codeStep` (linie 1019, 1033, 1046, 1070, 1072)
- ✓ `passStep` (linie 1079, 1096, 1110, 1113, 1115, 1122)
- ✓ `modeSwitch` (linie 1126)
- ✓ `emailStep` (linie 1131, 1145, 1156, 1160, 1162, 1171, 1178)
- ✓ `trialOffer` (linie 1480)
- ✓ `afterReady` (linie 1575)

## Emoji w dodanych liniach kodu

brak ✓

## Skrót tablic quiz (przed → po)

- docs/gry/test/atrapa-supabase.js: 05e07dea5687 → 05e07dea5687 ✓
- pliki JSON w docs/: 15, wszystkie równe: tak ✓

## Nowe migracje

### supabase/skrot-v52-proba-rocznik.sql

```
(brak wyniku)
```

## Nowe teksty PL bez pary EN (przybliżenie: literały z polskimi słowami w dodanych liniach)

brak ✓

(sprawdzonych literałów: 20; teksty złożone sprawdza test Playwright w trybie EN)
