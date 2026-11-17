# Kontrola automatyczna UX-5 (2026-11-16T22:01, względem origin/main)

## 1. git diff --stat
```
docs/audyt-ux/petla-5/PROGRESS.md                  |   28 +
 docs/audyt-ux/petla-5/etap-1/runda-1/kontrola.md   |   48 +
 .../etap-1/runda-1/material-390-jasny-ekran1.png   |  Bin 0 -> 74401 bytes
 .../petla-5/etap-1/runda-1/material-390-jasny.png  |  Bin 0 -> 194652 bytes
 docs/audyt-ux/petla-5/etap-1/runda-1/ocena.json    |    1 +
 .../przedmiot-darmowe-1280-jasny-ekran1.png        |  Bin 0 -> 119723 bytes
 .../runda-1/przedmiot-darmowe-1280-jasny.png       |  Bin 0 -> 241256 bytes
 .../przedmiot-darmowe-360-ciemny-ekran1.png        |  Bin 0 -> 45320 bytes
 .../runda-1/przedmiot-darmowe-360-ciemny.png       |  Bin 0 -> 193386 bytes
 .../runda-1/przedmiot-darmowe-360-jasny-ekran1.png |  Bin 0 -> 45731 bytes
 .../etap-1/runda-1/przedmiot-darmowe-360-jasny.png |  Bin 0 -> 195567 bytes
 .../przedmiot-darmowe-390-ciemny-ekran1.png        |  Bin 0 -> 70499 bytes
 .../runda-1/przedmiot-darmowe-390-ciemny.png       |  Bin 0 -> 194453 bytes
 .../runda-1/przedmiot-darmowe-390-jasny-ekran1.png |  Bin 0 -> 74449 bytes
 .../etap-1/runda-1/przedmiot-darmowe-390-jasny.png |  Bin 0 -> 197614 bytes
 ...rzedmiot-dzial-zaliczony-1280-ciemny-ekran1.png |  Bin 0 -> 115872 bytes
 .../przedmiot-dzial-zaliczony-1280-ciemny.png      |  Bin 0 -> 245686 bytes
 ...przedmiot-dzial-zaliczony-1280-jasny-ekran1.png |  Bin 0 -> 127902 bytes
 .../przedmiot-dzial-zaliczony-1280-jasny.png       |  Bin 0 -> 258192 bytes
 ...przedmiot-dzial-zaliczony-360-ciemny-ekran1.png |  Bin 0 -> 45320 bytes
 .../przedmiot-dzial-zaliczony-360-ciemny.png       |  Bin 0 -> 204630 bytes
 .../przedmiot-dzial-zaliczony-360-jasny-ekran1.png |  Bin 0 -> 45455 bytes
 .../przedmiot-dzial-zaliczony-360-jasny.png        |  Bin 0 -> 206611 bytes
 ...przedmiot-dzial-zaliczony-390-ciemny-ekran1.png |  Bin 0 -> 72639 bytes
 .../przedmiot-dzial-zaliczony-390-ciemny.png       |  Bin 0 -> 206132 bytes
 .../przedmiot-dzial-zaliczony-390-jasny-ekran1.png |  Bin 0 -> 75860 bytes
 .../przedmiot-dzial-zaliczony-390-jasny.png        |  Bin 0 -> 208774 bytes
 .../przedmiot-w-trakcie-1280-ciemny-ekran1.png     |  Bin 0 -> 109595 bytes
 .../runda-1/przedmiot-w-trakcie-1280-ciemny.png    |  Bin 0 -> 236900 bytes
 .../przedmiot-w-trakcie-1280-jasny-ekran1.png      |  Bin 0 -> 120823 bytes
 .../runda-1/przedmiot-w-trakcie-1280-jasny.png     |  Bin 0 -> 247828 bytes
 .../przedmiot-w-trakcie-360-ciemny-ekran1.png      |  Bin 0 -> 45157 bytes
 .../runda-1/przedmiot-w-trakcie-360-ciemny.png     |  Bin 0 -> 200620 bytes
 .../przedmiot-w-trakcie-360-jasny-ekran1.png       |  Bin 0 -> 45303 bytes
 .../runda-1/przedmiot-w-trakcie-360-jasny.png      |  Bin 0 -> 203146 bytes
 .../przedmiot-w-trakcie-390-ciemny-ekran1.png      |  Bin 0 -> 71604 bytes
 .../runda-1/przedmiot-w-trakcie-390-ciemny.png     |  Bin 0 -> 201778 bytes
 .../runda-1/przedmiot-w-trakcie-390-en-ekran1.png  |  Bin 0 -> 74300 bytes
 .../etap-1/runda-1/przedmiot-w-trakcie-390-en.png  |  Bin 0 -> 202883 bytes
 .../przedmiot-w-trakcie-390-jasny-ekran1.png       |  Bin 0 -> 75338 bytes
 .../runda-1/przedmiot-w-trakcie-390-jasny.png      |  Bin 0 -> 205140 bytes
 .../petla-5/etap-1/runda-1/przejscie-1-przed.png   |  Bin 0 -> 75244 bytes
 .../petla-5/etap-1/runda-1/przejscie-2-baner.png   |  Bin 0 -> 86725 bytes
 .../petla-5/etap-1/runda-1/przejscie-3-po.png      |  Bin 0 -> 216758 bytes
 docs/audyt-ux/petla-5/etap-1/runda-1/raport.json   | 1646 +++++++++++++++++++
 docs/audyt-ux/petla-5/etap-1/runda-1/raport.md     |  296 ++++
 docs/audyt-ux/petla-5/etap-1/runda-1/testy.log     |   66 +
 docs/audyt-ux/petla-5/etap-1/runda-2/kontrola.md   |   46 +
 .../etap-1/runda-2/material-390-jasny-ekran1.png   |  Bin 0 -> 74386 bytes
 .../petla-5/etap-1/runda-2/material-390-jasny.png  |  Bin 0 -> 194652 bytes
 docs/audyt-ux/petla-5/etap-1/runda-2/ocena.json    |    1 +
 .../petla-5/etap-1/runda-2/odbior-1-przed.png      |  Bin 0 -> 87136 bytes
 .../petla-5/etap-1/runda-2/odbior-2-po.png         |  Bin 0 -> 101404 bytes
 .../przedmiot-darmowe-1280-jasny-ekran1.png        |  Bin 0 -> 135562 bytes
 .../runda-2/przedmiot-darmowe-1280-jasny.png       |  Bin 0 -> 269098 bytes
 .../przedmiot-darmowe-360-ciemny-ekran1.png        |  Bin 0 -> 45273 bytes
 .../runda-2/przedmiot-darmowe-360-ciemny.png       |  Bin 0 -> 214331 bytes
 .../runda-2/przedmiot-darmowe-360-jasny-ekran1.png |  Bin 0 -> 45719 bytes
 .../etap-1/runda-2/przedmiot-darmowe-360-jasny.png |  Bin 0 -> 219605 bytes
 .../przedmiot-darmowe-390-ciemny-ekran1.png        |  Bin 0 -> 79251 bytes
 .../runda-2/przedmiot-darmowe-390-ciemny.png       |  Bin 0 -> 218293 bytes
 .../runda-2/przedmiot-darmowe-390-jasny-ekran1.png |  Bin 0 -> 85852 bytes
 .../etap-1/runda-2/przedmiot-darmowe-390-jasny.png |  Bin 0 -> 225310 bytes
 ...rzedmiot-dzial-zaliczony-1280-ciemny-ekran1.png |  Bin 0 -> 123711 bytes
 .../przedmiot-dzial-zaliczony-1280-ciemny.png      |  Bin 0 -> 263314 bytes
 ...przedmiot-dzial-zaliczony-1280-jasny-ekran1.png |  Bin 0 -> 140270 bytes
 .../przedmiot-dzial-zaliczony-1280-jasny.png       |  Bin 0 -> 280142 bytes
 ...przedmiot-dzial-zaliczony-360-ciemny-ekran1.png |  Bin 0 -> 45241 bytes
 .../przedmiot-dzial-zaliczony-360-ciemny.png       |  Bin 0 -> 221013 bytes
 .../przedmiot-dzial-zaliczony-360-jasny-ekran1.png |  Bin 0 -> 45469 bytes
 .../przedmiot-dzial-zaliczony-360-jasny.png        |  Bin 0 -> 225587 bytes
 ...przedmiot-dzial-zaliczony-390-ciemny-ekran1.png |  Bin 0 -> 81332 bytes
 .../przedmiot-dzial-zaliczony-390-ciemny.png       |  Bin 0 -> 221397 bytes
 .../przedmiot-dzial-zaliczony-390-jasny-ekran1.png |  Bin 0 -> 87136 bytes
 .../przedmiot-dzial-zaliczony-390-jasny.png        |  Bin 0 -> 227287 bytes
 .../przedmiot-w-trakcie-1280-ciemny-ekran1.png     |  Bin 0 -> 120773 bytes
 .../runda-2/przedmiot-w-trakcie-1280-ciemny.png    |  Bin 0 -> 249805 bytes
 .../przedmiot-w-trakcie-1280-jasny-ekran1.png      |  Bin 0 -> 136871 bytes
 .../runda-2/przedmiot-w-trakcie-1280-jasny.png     |  Bin 0 -> 265963 bytes
 .../przedmiot-w-trakcie-360-ciemny-ekran1.png      |  Bin 0 -> 45092 bytes
 .../runda-2/przedmiot-w-trakcie-360-ciemny.png     |  Bin 0 -> 212213 bytes
 .../przedmiot-w-trakcie-360-jasny-ekran1.png       |  Bin 0 -> 45321 bytes
 .../runda-2/przedmiot-w-trakcie-360-jasny.png      |  Bin 0 -> 216813 bytes
 .../przedmiot-w-trakcie-390-ciemny-ekran1.png      |  Bin 0 -> 80418 bytes
 .../runda-2/przedmiot-w-trakcie-390-ciemny.png     |  Bin 0 -> 213450 bytes
 .../runda-2/przedmiot-w-trakcie-390-en-ekran1.png  |  Bin 0 -> 84176 bytes
 .../etap-1/runda-2/przedmiot-w-trakcie-390-en.png  |  Bin 0 -> 219464 bytes
 .../przedmiot-w-trakcie-390-jasny-ekran1.png       |  Bin 0 -> 86633 bytes
 .../runda-2/przedmiot-w-trakcie-390-jasny.png      |  Bin 0 -> 220222 bytes
 .../petla-5/etap-1/runda-2/przejscie-1-przed.png   |  Bin 0 -> 86535 bytes
 .../petla-5/etap-1/runda-2/przejscie-2-baner.png   |  Bin 0 -> 90728 bytes
 .../petla-5/etap-1/runda-2/przejscie-3-po.png      |  Bin 0 -> 237400 bytes
 docs/audyt-ux/petla-5/etap-1/runda-2/raport.json   | 1651 +++++++++++++++++++
 docs/audyt-ux/petla-5/etap-1/runda-2/raport.md     |  301 ++++
 docs/audyt-ux/petla-5/etap-1/runda-2/testy.log     |   27 +
 docs/audyt-ux/petla-5/etap-1/runda-3/kontrola.md   |   46 +
 .../etap-1/runda-3/material-390-jasny-ekran1.png   |  Bin 0 -> 74416 bytes
 .../petla-5/etap-1/runda-3/material-390-jasny.png  |  Bin 0 -> 194652 bytes
 docs/audyt-ux/petla-5/etap-1/runda-3/ocena.json    |    1 +
 .../petla-5/etap-1/runda-3/odbior-1-przed.png      |  Bin 0 -> 95243 bytes
 .../petla-5/etap-1/runda-3/odbior-2-po.png         |  Bin 0 -> 101542 bytes
 .../przedmiot-darmowe-1280-jasny-ekran1.png        |  Bin 0 -> 142144 bytes
 .../runda-3/przedmiot-darmowe-1280-jasny.png       |  Bin 0 -> 280101 bytes
 .../przedmiot-darmowe-360-ciemny-ekran1.png        |  Bin 0 -> 45233 bytes
 .../runda-3/przedmiot-darmowe-360-ciemny.png       |  Bin 0 -> 227835 bytes
 .../runda-3/przedmiot-darmowe-360-jasny-ekran1.png |  Bin 0 -> 45501 bytes
 .../etap-1/runda-3/przedmiot-darmowe-360-jasny.png |  Bin 0 -> 234510 bytes
 .../przedmiot-darmowe-390-ciemny-ekran1.png        |  Bin 0 -> 85960 bytes
 .../runda-3/przedmiot-darmowe-390-ciemny.png       |  Bin 0 -> 230814 bytes
 .../runda-3/przedmiot-darmowe-390-jasny-ekran1.png |  Bin 0 -> 94014 bytes
 .../etap-1/runda-3/przedmiot-darmowe-390-jasny.png |  Bin 0 -> 239368 bytes
 ...rzedmiot-dzial-zaliczony-1280-ciemny-ekran1.png |  Bin 0 -> 130090 bytes
 .../przedmiot-dzial-zaliczony-1280-ciemny.png      |  Bin 0 -> 269537 bytes
 ...przedmiot-dzial-zaliczony-1280-jasny-ekran1.png |  Bin 0 -> 146684 bytes
 .../przedmiot-dzial-zaliczony-1280-jasny.png       |  Bin 0 -> 287035 bytes
 ...przedmiot-dzial-zaliczony-360-ciemny-ekran1.png |  Bin 0 -> 45217 bytes
 .../przedmiot-dzial-zaliczony-360-ciemny.png       |  Bin 0 -> 228364 bytes
 .../przedmiot-dzial-zaliczony-360-jasny-ekran1.png |  Bin 0 -> 45175 bytes
 .../przedmiot-dzial-zaliczony-360-jasny.png        |  Bin 0 -> 234401 bytes
 ...przedmiot-dzial-zaliczony-390-ciemny-ekran1.png |  Bin 0 -> 87737 bytes
 .../przedmiot-dzial-zaliczony-390-ciemny.png       |  Bin 0 -> 229397 bytes
 .../przedmiot-dzial-zaliczony-390-jasny-ekran1.png |  Bin 0 -> 95186 bytes
 .../przedmiot-dzial-zaliczony-390-jasny.png        |  Bin 0 -> 237363 bytes
 .../przedmiot-w-trakcie-1280-ciemny-ekran1.png     |  Bin 0 -> 127202 bytes
 .../runda-3/przedmiot-w-trakcie-1280-ciemny.png    |  Bin 0 -> 255921 bytes
 .../przedmiot-w-trakcie-1280-jasny-ekran1.png      |  Bin 0 -> 143091 bytes
 .../runda-3/przedmiot-w-trakcie-1280-jasny.png     |  Bin 0 -> 272675 bytes
 .../przedmiot-w-trakcie-360-ciemny-ekran1.png      |  Bin 0 -> 45071 bytes
 .../runda-3/przedmiot-w-trakcie-360-ciemny.png     |  Bin 0 -> 220933 bytes
 .../przedmiot-w-trakcie-360-jasny-ekran1.png       |  Bin 0 -> 45031 bytes
 .../runda-3/przedmiot-w-trakcie-360-jasny.png      |  Bin 0 -> 227137 bytes
 .../przedmiot-w-trakcie-390-ciemny-ekran1.png      |  Bin 0 -> 86710 bytes
 .../runda-3/przedmiot-w-trakcie-390-ciemny.png     |  Bin 0 -> 222479 bytes
 .../runda-3/przedmiot-w-trakcie-390-en-ekran1.png  |  Bin 0 -> 93876 bytes
 .../etap-1/runda-3/przedmiot-w-trakcie-390-en.png  |  Bin 0 -> 229942 bytes
 .../przedmiot-w-trakcie-390-jasny-ekran1.png       |  Bin 0 -> 94623 bytes
 .../runda-3/przedmiot-w-trakcie-390-jasny.png      |  Bin 0 -> 230578 bytes
 .../petla-5/etap-1/runda-3/przejscie-1-przed.png   |  Bin 0 -> 94496 bytes
 .../petla-5/etap-1/runda-3/przejscie-2-baner.png   |  Bin 0 -> 99419 bytes
 .../petla-5/etap-1/runda-3/przejscie-3-po.png      |  Bin 0 -> 246160 bytes
 docs/audyt-ux/petla-5/etap-1/runda-3/raport.json   | 1659 ++++++++++++++++++++
 docs/audyt-ux/petla-5/etap-1/runda-3/raport.md     |  306 ++++
 docs/audyt-ux/petla-5/etap-1/runda-3/testy.log     |   80 +
 .../runda-rec2/material-390-jasny-ekran1.png       |  Bin 0 -> 74401 bytes
 .../etap-1/runda-rec2/material-390-jasny.png       |  Bin 0 -> 194652 bytes
 .../petla-5/etap-1/runda-rec2/odbior-1-przed.png   |  Bin 0 -> 87136 bytes
 .../petla-5/etap-1/runda-rec2/odbior-2-po.png      |  Bin 0 -> 101404 bytes
 .../przedmiot-darmowe-1280-jasny-ekran1.png        |  Bin 0 -> 135555 bytes
 .../runda-rec2/przedmiot-darmowe-1280-jasny.png    |  Bin 0 -> 269098 bytes
 .../przedmiot-darmowe-360-ciemny-ekran1.png        |  Bin 0 -> 45273 bytes
 .../runda-rec2/przedmiot-darmowe-360-ciemny.png    |  Bin 0 -> 214331 bytes
 .../przedmiot-darmowe-360-jasny-ekran1.png         |  Bin 0 -> 45719 bytes
 .../runda-rec2/przedmiot-darmowe-360-jasny.png     |  Bin 0 -> 219605 bytes
 .../przedmiot-darmowe-390-ciemny-ekran1.png        |  Bin 0 -> 79251 bytes
 .../runda-rec2/przedmiot-darmowe-390-ciemny.png    |  Bin 0 -> 218293 bytes
 .../przedmiot-darmowe-390-jasny-ekran1.png         |  Bin 0 -> 85841 bytes
 .../runda-rec2/przedmiot-darmowe-390-jasny.png     |  Bin 0 -> 225161 bytes
 ...rzedmiot-dzial-zaliczony-1280-ciemny-ekran1.png |  Bin 0 -> 123716 bytes
 .../przedmiot-dzial-zaliczony-1280-ciemny.png      |  Bin 0 -> 263314 bytes
 ...przedmiot-dzial-zaliczony-1280-jasny-ekran1.png |  Bin 0 -> 140266 bytes
 .../przedmiot-dzial-zaliczony-1280-jasny.png       |  Bin 0 -> 280142 bytes
 ...przedmiot-dzial-zaliczony-360-ciemny-ekran1.png |  Bin 0 -> 45241 bytes
 .../przedmiot-dzial-zaliczony-360-ciemny.png       |  Bin 0 -> 221013 bytes
 .../przedmiot-dzial-zaliczony-360-jasny-ekran1.png |  Bin 0 -> 45469 bytes
 .../przedmiot-dzial-zaliczony-360-jasny.png        |  Bin 0 -> 225587 bytes
 ...przedmiot-dzial-zaliczony-390-ciemny-ekran1.png |  Bin 0 -> 81332 bytes
 .../przedmiot-dzial-zaliczony-390-ciemny.png       |  Bin 0 -> 221397 bytes
 .../przedmiot-dzial-zaliczony-390-jasny-ekran1.png |  Bin 0 -> 87136 bytes
 .../przedmiot-dzial-zaliczony-390-jasny.png        |  Bin 0 -> 227287 bytes
 .../przedmiot-w-trakcie-1280-ciemny-ekran1.png     |  Bin 0 -> 120768 bytes
 .../runda-rec2/przedmiot-w-trakcie-1280-ciemny.png |  Bin 0 -> 249805 bytes
 .../przedmiot-w-trakcie-1280-jasny-ekran1.png      |  Bin 0 -> 136871 bytes
 .../runda-rec2/przedmiot-w-trakcie-1280-jasny.png  |  Bin 0 -> 265963 bytes
 .../przedmiot-w-trakcie-360-ciemny-ekran1.png      |  Bin 0 -> 45092 bytes
 .../runda-rec2/przedmiot-w-trakcie-360-ciemny.png  |  Bin 0 -> 212213 bytes
 .../przedmiot-w-trakcie-360-jasny-ekran1.png       |  Bin 0 -> 45321 bytes
 .../runda-rec2/przedmiot-w-trakcie-360-jasny.png   |  Bin 0 -> 216813 bytes
 .../przedmiot-w-trakcie-390-ciemny-ekran1.png      |  Bin 0 -> 80418 bytes
 .../runda-rec2/przedmiot-w-trakcie-390-ciemny.png  |  Bin 0 -> 213450 bytes
 .../przedmiot-w-trakcie-390-en-ekran1.png          |  Bin 0 -> 84176 bytes
 .../runda-rec2/przedmiot-w-trakcie-390-en.png      |  Bin 0 -> 219464 bytes
 .../przedmiot-w-trakcie-390-jasny-ekran1.png       |  Bin 0 -> 86633 bytes
 .../runda-rec2/przedmiot-w-trakcie-390-jasny.png   |  Bin 0 -> 220222 bytes
 .../etap-1/runda-rec2/przejscie-1-przed.png        |  Bin 0 -> 86535 bytes
 .../etap-1/runda-rec2/przejscie-2-baner.png        |  Bin 0 -> 90728 bytes
 .../petla-5/etap-1/runda-rec2/przejscie-3-po.png   |  Bin 0 -> 237400 bytes
 .../audyt-ux/petla-5/etap-1/runda-rec2/raport.json | 1651 +++++++++++++++++++
 docs/audyt-ux/petla-5/etap-1/runda-rec2/raport.md  |  301 ++++
 docs/audyt-ux/petla-5/kontrola.mjs                 |  107 ++
 docs/audyt-ux/petla-5/runda.sh                     |   21 +
 docs/audyt-ux/petla-5/uwagi-dla-innych.md          |   22 +
 docs/gry/test/atrapa-supabase.js                   |   19 +
 docs/gry/test/etap9.mjs                            |    8 +-
 docs/gry/test/lib.mjs                              |    6 +
 docs/gry/test/poziomy.mjs                          |   12 +-
 docs/gry/test/ux5-etap1.mjs                        |  158 ++
 docs/gry/test/ux5-lib.mjs                          |  118 ++
 i18n-en.js                                         |   86 +-
 index.html                                         |  273 ++--
 nagrody.js                                         |  235 +++
 supabase/skrot-v58-nagroda-dzial.sql               |   51 +
 supabase/test/pglite.mjs                           |    2 +-
 supabase/test/v58.sql                              |   86 +
 203 files changed, 9255 insertions(+), 104 deletions(-)
```

## 2. Zmienione funkcje (lista B3 pętli 5)
### index.html
- ✓ `[linia 1: ?v= i18n.js]` (1 linii)
- ✓ `[CSS/HTML przed skryptem]` (5 linii)
- ✓ `MEADOW_LV` (1 linii)
- ✓ `SEA_LEVEL` (1 linii)
- ✓ `subjectHero` (6 linii)
- ✓ `courseSection` (32 linii)
- ✓ `viewMaterial` (1 linii)
- ✓ `PINK_LEVEL` (1 linii)
- ✓ `BOW_LEVEL` (1 linii)
- ✓ `LILIA_LEVEL` (1 linii)
- ✓ `NOC_LEVEL` (1 linii)
- ✓ `RIWIERA_LEVEL` (1 linii)
- ✓ `KLUB_LEVEL` (1 linii)
- ✓ `THEME_CHOICE` (nowa funkcja pętli 5) (2 linii)
- ✓ `THEME_LATE` (nowa funkcja pętli 5) (1 linii)
- ✓ `THEME_BASE` (nowa funkcja pętli 5) (1 linii)
- ✓ `THEME_OLD` (nowa funkcja pętli 5) (2 linii)
- ✓ `themePair` (nowa funkcja pętli 5) (1 linii)
- ✓ `themePicked` (nowa funkcja pętli 5) (3 linii)
- ✓ `themeFreeLvl` (nowa funkcja pętli 5) (4 linii)
- ✓ `themeLv` (nowa funkcja pętli 5) (1 linii)
- ✓ `themeChoicePending` (nowa funkcja pętli 5) (2 linii)
- ✓ `themeChoose` (nowa funkcja pętli 5) (1 linii)
- ✓ `THEME_SHOP` (10 linii)
- ✓ `themeMigDone` (nowa funkcja pętli 5) (1 linii)
- ✓ `themeMig` (nowa funkcja pętli 5) (7 linii)
- ✓ `themeByLevel` (7 linii)
- ✓ `lvPrizeLine` (nowa funkcja pętli 5) (8 linii)
- ✓ `lpLevelsShow` (1 linii)
- ✓ `lvRewardLine` (7 linii)
- ✓ `lvHowShow` (2 linii)
- ✓ `themeChoiceCards` (nowa funkcja pętli 5) (10 linii)
- ✓ `themeChoiceShow` (nowa funkcja pętli 5) (5 linii)
- ✓ `levelUpShow` (8 linii)
- ✓ `ptsMilestone` (1 linii)
- ✓ `rankMeCard` (4 linii)
- ✓ `rankList` (1 linii)
- ✓ `hdHomeCard` (1 linii)
- ✓ `hdMoreRow` (1 linii)
- ✓ `hdSubmit` (2 linii)
- ✓ `hdEnd` (3 linii)
- ✓ `viewHaslo` (1 linii)
- ✓ `bsClaim` (2 linii)
- ✓ `bsAnnText` (1 linii)
- ✓ `bsBody` (1 linii)
- ✓ `viewBoss` (1 linii)
- ✓ `shopThemeCard` (11 linii)
- ✓ `shopHero` (7 linii)
- ✓ `kProfilShow` (1 linii)
- ✓ `K_TABS` (1 linii)
- ✓ `kShopTabs` (1 linii)
- ✓ `[most ux-5]` (3 linii)
- ✓ `[ładowanie nagrody.js]` (1 linii)
- CSS (dodane/zmienione reguły):
  - `.sk-node, .lp-node { display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: 12px`
  - `.sk-node .t, .lp-node .t { min-width: 0; overflow-wrap: anywhere; display: grid; gap: 2px`
  - `.sk-node.now, .lp-node.now, .sk-node.opt, .lp-node.opt { display: grid; grid-template-col`
  - `.sk-node.lock { white-space: normal; font-size: inherit; color: inherit; } /* ux-5: ogóln`
  - `.sk-node .t { grid-template-columns: minmax(0, 1fr); }`
- wywołania z umów:
  - `    return txt ? h("span", { class: "lv-prize ux5-prize", title: pair ? `Drugi motyw za darmo na poziomie ${THEME_LATE[n]} albo w sklepie` `
  - `      window.ZD_NAGRODY?.ikona?.("ux5-palette", "lv-reward-ico") ?? null,`
  - `      window.ZD_NAGRODY?.ikona?.("ux5-palette", "lv-reward-ico") ?? null,`
  - `        window.ZD_NAGRODY?.nagrodaPoziomuOkno?.(from, to) ?? null,`
  - `        window.ZD_NAGRODY?.pokazZnajomym?.({ rodzaj: "awans", poziom: to, ranga: lvName(to) }) ?? null,`
  - `    window.ZD_NAGRODY?.dzialSprawdz?.(sid); // ux-5: koniec działu = nagroda z bazy (v58)`
  - `      d.seria > 0 ? h("p", { class: "hd-seria" }, window.ZD_NAGRODY?.ikona?.("ux5-word", "hd-seria-ico") ?? null, h("span", { text: d.seria`
  - `        d?.seria ? h("span", { class: "sk-chip hd-streak", title: `Hasło: ${d.seria} dni z rzędu`, "aria-label": `Hasło: ${d.seria} dni z r`
  - `    else if (!it) { btn = sk.state === "out" ? h("button", { type: "button", class: "btn", onclick: signIn }, "Zaloguj się, żeby kupić") : `
  - `    const pv = on ? null : h("button", { type: "button", class: "btn shop-pv", onclick: () => themePreview(t.id) }, window.ZD_NAGRODY?.ikon`
  - `        : h("button", { type: "button", class: "shop-sw shop-sw-btn", "aria-label": `Podgląd: ${t.name}`, tabindex: shopSwTab() ? null : "-`
  - `      h("p", { class: "sk-bignum", id: "shop-saldo" }, window.ZD_NAGRODY?.ikona?.("coin", "shop-bigcoin") ?? null, h("b", { class: "num", t`
  - `      window.ZD_NAGRODY?.ikona?.(ic) ?? null, h("span", { text: t }),`
### skrot-supabase.js
- bez zmian

## 3. Emoji w dodanych liniach kodu
- ✗ `{ id: "pink",   item: "motyw:pink",   name: "Jednorożec", ico: "🦄" },`
- ✗ `{ id: "bow",    item: "motyw:bow",    name: "Kokardka",   ico: "🎀" },`
- ✗ `{ id: "meadow", item: "motyw:meadow", name: "Łąka",       ico: "🌾" },`
- ✗ `{ id: "lilia",  item: "motyw:lilia",  name: "Nenufary",   ico: "🪷" },`
- ✗ `{ id: "sea",    item: "motyw:sea",    name: "Nocny rejs", ico: "🌙" },`
- ✗ `{ id: "noc",    item: "motyw:noc",    name: "Nokturn",    ico: "🌘" },`
- ✗ `{ id: "riwiera", item: "motyw:riwiera", name: "Riwiera",  ico: "🌴" },`
- ✗ `{ id: "klub",   item: "motyw:klub",   name: "Jachtklub",  ico: "⚓" },`
- ✗ `h("p", { class: "rk-place" }, h("b", { class: "num", text: m != null ? `#${m}` : "–" }), h("span", { text: m != null ? `z ${z} · ${fmtN(ja.pkt || 0)} XP`
- ✗ `return `⚔️ ${name} atakuje! ${b.typ === "egzamin" ? "Egzamin" : "Kolokwium"} z ${g} ${fmtDate(b.termin + "T12:00")}. Każda dobra odpowiedź na zdawalni.pl t`
- ✗ `else if (coins() >= it.cena) { btn = h("button", { type: "button", class: "btn primary", onclick: () => shopBuy(t) }, `Kup za ${fmtN(it.cena)} 🪙`); note =`
- ✗ `else { btn = h("button", { type: "button", class: "btn shop-short", disabled: true }, `Brakuje ${fmtN(it.cena - coins())} 🪙`); note = lvlTxt; noteS = pbW`
- ✗ `// „N [moneta]” jako tekst z ikoną SVG (zamiast emoji 🪙). Zwraca span: liczba czytana przez czytnik + „monet”.`
- ✗ `// Teksty w kodzie zostają (słownik EN ich szuka), a na ekranie znak 🪙 / ⚡ / 🔥 zamieniamy na ikonę SVG z H2`
- ✗ `const ZNAKI = { "🪙": "coin", "⚡": "bolt", "🔥": "flame", "🏆": "ux5-trophy", "🏅": "ux5-medal", "🔒": "lock" }, ZNAK_RE = /(🪙|⚡️?|🔥|🏆|🏅|🔒)/u;`

## 4. Tablice quiz (hash linii z „quiz”)
- atrapa: przed d9b925bb92c73b96 · po d9b925bb92c73b96 ✓ równe
- pliki docs/*.json|js z innym hashem: brak ✓

## 5. Nowe migracje
- `skrot-v58-nagroda-dzial.sql`: strażnik kodowania ✓; `funkcje-sql.mjs --nadpisane`: (pusto: żadna funkcja nie ma późniejszej wersji) ✓
- `skrot-v59-motywy-ceny.sql`: strażnik kodowania ✓; `funkcje-sql.mjs --nadpisane`: (pusto: żadna funkcja nie ma późniejszej wersji) ✓

## 6. Nowe teksty PL bez pary EN (przybliżenie: literał w całości; zdania składane z kilku części mogą być fałszywym alarmem)
- index.html: : hasU ? `Dział {0}: ${u.title ||
- index.html: {0}. {1}{2}{3}{4}
- index.html: Wybór: {0}
- index.html: , { text: `Poziom {0}: wybór ${wyb.join(
- index.html: }), h("small", { class: "num", text: L.n >= pb ? "wybór czeka · drugi za darmo na poziomie " + THEME_LATE[pb] :
- index.html: {0}{1} XP od zeszłego tygodnia
- index.html: · Hasło: {0} {1} z rzędu
- index.html: , title: `Hasło: {0} dni z rzędu`,
- index.html: : `Hasło: {0} dni z rzędu` }, window.ZD_NAGRODY?.ikona?.(
- index.html: ⚔️ {0} atakuje! {1} z {2} {3}. Każda dobra odpowiedź na zdawalni.pl to cios. Jeśli go pokonamy do {4}, każdy z {5}+ ciosami dostaje +{6} XP.
- index.html: : `Podgląd: {0}`, tabindex: shopSwTab() ? null :

