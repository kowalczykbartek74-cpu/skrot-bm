fatal: path 'docs/audyt-ux/petla-1/etap-1/runda-1/raport.json' exists on disk, but not in 'origin/main'
fatal: path 'docs/logowanie-review/0/raport.json' exists on disk, but not in 'origin/main'
# Kontrola automatyczna – pętla UX-1

Stan: fcb74f9 UX-1 etap 1 runda 1 – logowanie od góry bez skoków, jeden główny przycisk, arkusz próby po logowaniu, pasek na Dziś, ciemny wariant, limit maili i „Wyślij ponownie” (ocena 8,5/10) (+ zmiany niezacommitowane)

## git diff --stat origin/main

```
docs/audyt-ux/petla-1/PROGRESS.md                  |   42 +
 .../runda-1/arkusz-proby-1280-ciemny-ekran1.png    |  Bin 0 -> 171729 bytes
 .../runda-1/arkusz-proby-1280-jasny-ekran1.png     |  Bin 0 -> 164582 bytes
 .../runda-1/arkusz-proby-360-ciemny-ekran1.png     |  Bin 0 -> 61827 bytes
 .../runda-1/arkusz-proby-360-jasny-ekran1.png      |  Bin 0 -> 61140 bytes
 .../runda-1/arkusz-proby-390-ciemny-ekran1.png     |  Bin 0 -> 87793 bytes
 .../runda-1/arkusz-proby-390-jasny-ekran1.png      |  Bin 0 -> 86194 bytes
 .../runda-1/arkusz-proby-390-jasny-en-ekran1.png   |  Bin 0 -> 84222 bytes
 .../runda-1/blad-limitu-390-ciemny-ekran1.png      |  Bin 0 -> 67937 bytes
 .../runda-1/blad-limitu-390-jasny-ekran1.png       |  Bin 0 -> 70266 bytes
 .../runda-1/blad-limitu-390-jasny-en-ekran1.png    |  Bin 0 -> 67025 bytes
 .../runda-1/dzis-darmowe-1280-ciemny-ekran1.png    |  Bin 0 -> 134243 bytes
 .../etap-1/runda-1/dzis-darmowe-1280-ciemny.png    |  Bin 0 -> 253446 bytes
 .../runda-1/dzis-darmowe-1280-jasny-ekran1.png     |  Bin 0 -> 131666 bytes
 .../etap-1/runda-1/dzis-darmowe-1280-jasny.png     |  Bin 0 -> 269940 bytes
 .../runda-1/dzis-darmowe-360-ciemny-ekran1.png     |  Bin 0 -> 65836 bytes
 .../etap-1/runda-1/dzis-darmowe-360-ciemny.png     |  Bin 0 -> 201082 bytes
 .../runda-1/dzis-darmowe-360-jasny-ekran1.png      |  Bin 0 -> 64532 bytes
 .../etap-1/runda-1/dzis-darmowe-360-jasny.png      |  Bin 0 -> 203662 bytes
 .../runda-1/dzis-darmowe-390-ciemny-ekran1.png     |  Bin 0 -> 83603 bytes
 .../etap-1/runda-1/dzis-darmowe-390-ciemny.png     |  Bin 0 -> 202726 bytes
 .../runda-1/dzis-darmowe-390-jasny-ekran1.png      |  Bin 0 -> 81413 bytes
 .../runda-1/dzis-darmowe-390-jasny-en-ekran1.png   |  Bin 0 -> 83192 bytes
 .../etap-1/runda-1/dzis-darmowe-390-jasny-en.png   |  Bin 0 -> 202084 bytes
 .../etap-1/runda-1/dzis-darmowe-390-jasny.png      |  Bin 0 -> 206240 bytes
 .../dzis-platne-bez-paska-390-ciemny-ekran1.png    |  Bin 0 -> 88300 bytes
 .../dzis-platne-bez-paska-390-jasny-ekran1.png     |  Bin 0 -> 89073 bytes
 .../runda-1/kod-po-60s-360-ciemny-ekran1.png       |  Bin 0 -> 57704 bytes
 .../etap-1/runda-1/kod-po-60s-360-ciemny.png       |  Bin 0 -> 90831 bytes
 .../etap-1/runda-1/kod-po-60s-360-jasny-ekran1.png |  Bin 0 -> 58209 bytes
 .../etap-1/runda-1/kod-po-60s-360-jasny.png        |  Bin 0 -> 90616 bytes
 .../runda-1/kod-po-60s-390-ciemny-ekran1.png       |  Bin 0 -> 68809 bytes
 .../etap-1/runda-1/kod-po-60s-390-ciemny.png       |  Bin 0 -> 88301 bytes
 .../etap-1/runda-1/kod-po-60s-390-jasny-ekran1.png |  Bin 0 -> 69014 bytes
 .../runda-1/kod-po-60s-390-jasny-en-ekran1.png     |  Bin 0 -> 63490 bytes
 .../etap-1/runda-1/kod-po-60s-390-jasny-en.png     |  Bin 0 -> 85987 bytes
 .../etap-1/runda-1/kod-po-60s-390-jasny.png        |  Bin 0 -> 88655 bytes
 .../runda-1/kod-tryb-proby-1280-ciemny-ekran1.png  |  Bin 0 -> 183756 bytes
 .../runda-1/kod-tryb-proby-1280-jasny-ekran1.png   |  Bin 0 -> 181929 bytes
 .../runda-1/kod-tryb-proby-390-ciemny-ekran1.png   |  Bin 0 -> 70163 bytes
 .../runda-1/kod-tryb-proby-390-jasny-ekran1.png    |  Bin 0 -> 70661 bytes
 .../runda-1/kod-tryb-proby-390-jasny-en-ekran1.png |  Bin 0 -> 65945 bytes
 docs/audyt-ux/petla-1/etap-1/runda-1/kontrola.md   |   67 +
 .../runda-1/logowanie-1280-ciemny-ekran1.png       |  Bin 0 -> 196861 bytes
 .../etap-1/runda-1/logowanie-1280-ciemny.png       |  Bin 0 -> 138643 bytes
 .../etap-1/runda-1/logowanie-1280-jasny-ekran1.png |  Bin 0 -> 198873 bytes
 .../etap-1/runda-1/logowanie-1280-jasny.png        |  Bin 0 -> 140210 bytes
 .../etap-1/runda-1/logowanie-360-ciemny-ekran1.png |  Bin 0 -> 71842 bytes
 .../etap-1/runda-1/logowanie-360-ciemny.png        |  Bin 0 -> 124509 bytes
 .../etap-1/runda-1/logowanie-360-jasny-ekran1.png  |  Bin 0 -> 76840 bytes
 .../petla-1/etap-1/runda-1/logowanie-360-jasny.png |  Bin 0 -> 129271 bytes
 .../etap-1/runda-1/logowanie-390-ciemny-ekran1.png |  Bin 0 -> 87940 bytes
 .../etap-1/runda-1/logowanie-390-ciemny.png        |  Bin 0 -> 123768 bytes
 .../etap-1/runda-1/logowanie-390-jasny-ekran1.png  |  Bin 0 -> 92813 bytes
 .../runda-1/logowanie-390-jasny-en-ekran1.png      |  Bin 0 -> 94404 bytes
 .../etap-1/runda-1/logowanie-390-jasny-en.png      |  Bin 0 -> 128730 bytes
 .../petla-1/etap-1/runda-1/logowanie-390-jasny.png |  Bin 0 -> 128534 bytes
 .../logowanie-bez-grupy-1280-ciemny-ekran1.png     |  Bin 0 -> 183791 bytes
 .../runda-1/logowanie-bez-grupy-1280-ciemny.png    |  Bin 0 -> 155359 bytes
 .../logowanie-bez-grupy-1280-jasny-ekran1.png      |  Bin 0 -> 182134 bytes
 .../runda-1/logowanie-bez-grupy-1280-jasny.png     |  Bin 0 -> 152781 bytes
 .../logowanie-bez-grupy-390-ciemny-ekran1.png      |  Bin 0 -> 89283 bytes
 .../runda-1/logowanie-bez-grupy-390-ciemny.png     |  Bin 0 -> 170356 bytes
 .../logowanie-bez-grupy-390-jasny-ekran1.png       |  Bin 0 -> 91066 bytes
 .../runda-1/logowanie-bez-grupy-390-jasny.png      |  Bin 0 -> 170644 bytes
 .../logowanie-tryb-proby-390-ciemny-ekran1.png     |  Bin 0 -> 86766 bytes
 .../logowanie-tryb-proby-390-jasny-ekran1.png      |  Bin 0 -> 90362 bytes
 .../logowanie-tryb-proby-390-jasny-en-ekran1.png   |  Bin 0 -> 88994 bytes
 .../runda-1/przejscie-darmowe-arkusz-pozniej-1.png |  Bin 0 -> 86162 bytes
 .../runda-1/przejscie-darmowe-arkusz-pozniej-2.png |  Bin 0 -> 81670 bytes
 .../runda-1/przejscie-darmowe-arkusz-pozniej-3.png |  Bin 0 -> 81470 bytes
 .../runda-1/przejscie-darmowe-arkusz-tak-1.png     |  Bin 0 -> 85366 bytes
 .../runda-1/przejscie-darmowe-arkusz-tak-2.png     |  Bin 0 -> 76721 bytes
 .../runda-1/przejscie-darmowe-pasek-wlacz-1.png    |  Bin 0 -> 81413 bytes
 .../runda-1/przejscie-darmowe-pasek-wlacz-2.png    |  Bin 0 -> 77373 bytes
 .../runda-1/przejscie-kod-wyslij-ponownie-1.png    |  Bin 0 -> 60840 bytes
 .../runda-1/przejscie-kod-wyslij-ponownie-2.png    |  Bin 0 -> 77147 bytes
 .../runda-1/przejscie-kod-wyslij-ponownie-3.png    |  Bin 0 -> 79806 bytes
 .../runda-1/przejscie-nowa-osoba-proba-1.png       |  Bin 0 -> 92869 bytes
 .../runda-1/przejscie-nowa-osoba-proba-2.png       |  Bin 0 -> 89945 bytes
 .../runda-1/przejscie-nowa-osoba-proba-3.png       |  Bin 0 -> 70670 bytes
 .../runda-1/przejscie-nowa-osoba-proba-4.png       |  Bin 0 -> 69846 bytes
 docs/audyt-ux/petla-1/etap-1/runda-1/raport.json   | 1719 ++++++++++++++++++++
 docs/audyt-ux/petla-1/etap-1/runda-1/raport.md     |  175 ++
 docs/audyt-ux/petla-1/etap-1/runda-1/test.log      |   90 +
 docs/audyt-ux/petla-1/kontrola.mjs                 |  114 ++
 docs/audyt-ux/petla-1/pomiary.mjs                  |  125 ++
 docs/audyt-ux/petla-1/recenzja/etap-1.md           |  167 ++
 docs/audyt-ux/petla-1/scenariusze-1.mjs            |   52 +
 docs/audyt-ux/petla-1/uwagi-dla-innych.md          |   10 +
 docs/gry/test/atrapa-supabase.js                   |    9 +-
 docs/gry/test/h2-etap9.mjs                         |    3 +-
 docs/gry/test/ux1-etap1.mjs                        |  190 +++
 docs/gry/test/ux1-etap2.mjs                        |  171 ++
 docs/logowanie-review/0/en-375-1-kierunek.png      |  Bin 0 -> 164775 bytes
 docs/logowanie-review/0/en-375-2-grupa.png         |  Bin 0 -> 109437 bytes
 docs/logowanie-review/0/en-375-3-logowanie.png     |  Bin 0 -> 139615 bytes
 .../0/pl-1280-1-kierunek-ekran1.png                |  Bin 0 -> 172639 bytes
 docs/logowanie-review/0/pl-1280-1-kierunek.png     |  Bin 0 -> 231210 bytes
 docs/logowanie-review/0/pl-1280-2-grupa-ekran1.png |  Bin 0 -> 181979 bytes
 docs/logowanie-review/0/pl-1280-2-grupa.png        |  Bin 0 -> 192614 bytes
 .../0/pl-1280-3-logowanie-ekran1.png               |  Bin 0 -> 183915 bytes
 docs/logowanie-review/0/pl-1280-3-logowanie.png    |  Bin 0 -> 220302 bytes
 docs/logowanie-review/0/pl-375-1-kierunek.png      |  Bin 0 -> 169929 bytes
 docs/logowanie-review/0/pl-375-2-grupa.png         |  Bin 0 -> 109102 bytes
 docs/logowanie-review/0/pl-375-3-logowanie.png     |  Bin 0 -> 138124 bytes
 docs/logowanie-review/0/raport.json                |  171 ++
 docs/logowanie-review/0/raport.md                  |   85 +
 i18n-en.js                                         |   24 +-
 index.html                                         |   13 +-
 skrot-supabase.js                                  |   98 +-
 supabase/skrot-v52-proba-rocznik.sql               |   54 +
 supabase/test/pglite.mjs                           |    2 +-
 supabase/test/v52.sql                              |   54 +
 ux-wejscie.css                                     |  133 ++
 ux-wejscie.js                                      |   63 +
 116 files changed, 3606 insertions(+), 25 deletions(-)
nowy (niedodany): docs/audyt-ux/petla-1/etap-1/runda-2/
```

## Zmienione funkcje (porównanie z listą B3)

### index.html

- ✓ `(linia 1: #login)` (linie 1)
- ◦ umowa/most `(ładowanie własnego pliku)` (linie 5377, 22931)
- ◦ umowa/most `(linia <script src> – ?v=)` (linie 5389)
- ◦ umowa/most `(wywołanie z umowy)` (linie 7741, 8005)
- ◦ umowa/most `(blok mostu)` (linie 22926)

### skrot-supabase.js

- ✓ `otpErr` (linie 973)
- ✓ `codeStep` (linie 1019, 1033, 1046, 1067, 1072)
- ✓ `passStep` (linie 1081, 1098, 1112, 1115, 1117, 1124)
- ✓ `modeSwitch` (linie 1128)
- ✓ `emailStep` (linie 1133, 1147, 1157, 1162, 1164, 1173, 1180)
- ✓ `trialOffer` (linie 1482)
- ✓ `afterReady` (linie 1577)

## Emoji w dodanych liniach kodu

brak ✓

## Skrót tablic quiz (przed → po)

- docs/gry/test/atrapa-supabase.js: 05e07dea5687 → 05e07dea5687 ✓
- pliki JSON w docs/: 17, wszystkie równe: tak ✓

## Nowe migracje

### supabase/skrot-v52-proba-rocznik.sql

```
(brak wyniku)
```

## Nowe teksty PL bez pary EN (przybliżenie: literały z polskimi słowami w dodanych liniach)

- „Wysłaliśmy 6-cyfrowy kod na ”
- „Kod wysłaliśmy na ”

(sprawdzonych literałów: 24; teksty złożone sprawdza test Playwright w trybie EN)
