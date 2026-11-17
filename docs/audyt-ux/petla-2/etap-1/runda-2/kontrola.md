# Kontrola automatyczna UX-2

Gałąź: ux/2-nawyk · HEAD f713c8c · origin/main da5c455

## git diff --stat origin/main...HEAD
```
docs/audyt-ux/petla-2/PROGRESS.md                  |  23 +
 docs/audyt-ux/petla-2/brief.py                     |  35 ++
 .../petla-2/etap-1/runda-1/dzis-17-1280-ciemny.png | Bin 0 -> 156742 bytes
 .../petla-2/etap-1/runda-1/dzis-17-1280-jasny.png  | Bin 0 -> 160179 bytes
 .../petla-2/etap-1/runda-1/dzis-17-360-ciemny.png  | Bin 0 -> 67744 bytes
 .../petla-2/etap-1/runda-1/dzis-17-360-jasny.png   | Bin 0 -> 67575 bytes
 .../petla-2/etap-1/runda-1/dzis-17-390-ciemny.png  | Bin 0 -> 92812 bytes
 .../petla-2/etap-1/runda-1/dzis-17-390-jasny.png   | Bin 0 -> 94565 bytes
 .../petla-2/etap-1/runda-1/dzis-19-1280-ciemny.png | Bin 0 -> 162295 bytes
 .../petla-2/etap-1/runda-1/dzis-19-1280-jasny.png  | Bin 0 -> 165577 bytes
 .../petla-2/etap-1/runda-1/dzis-19-360-ciemny.png  | Bin 0 -> 71240 bytes
 .../etap-1/runda-1/dzis-19-360-jasny-en.png        | Bin 0 -> 67596 bytes
 .../petla-2/etap-1/runda-1/dzis-19-360-jasny.png   | Bin 0 -> 70817 bytes
 .../petla-2/etap-1/runda-1/dzis-19-390-ciemny.png  | Bin 0 -> 90323 bytes
 .../petla-2/etap-1/runda-1/dzis-19-390-jasny.png   | Bin 0 -> 91687 bytes
 .../etap-1/runda-1/dzis-cala-390-ciemny.png        | Bin 0 -> 245264 bytes
 .../petla-2/etap-1/runda-1/dzis-cala-390-jasny.png | Bin 0 -> 246912 bytes
 .../etap-1/runda-1/dzis-po-nauce-1280-ciemny.png   | Bin 0 -> 158219 bytes
 .../etap-1/runda-1/dzis-po-nauce-1280-jasny.png    | Bin 0 -> 161438 bytes
 .../etap-1/runda-1/dzis-po-nauce-360-ciemny.png    | Bin 0 -> 68627 bytes
 .../etap-1/runda-1/dzis-po-nauce-360-jasny.png     | Bin 0 -> 68359 bytes
 .../etap-1/runda-1/dzis-po-nauce-390-ciemny.png    | Bin 0 -> 93517 bytes
 .../etap-1/runda-1/dzis-po-nauce-390-jasny.png     | Bin 0 -> 95319 bytes
 .../runda-1/ekran-seria-plus1-390-ciemny.png       | Bin 0 -> 74684 bytes
 .../etap-1/runda-1/ekran-seria-plus1-390-jasny.png | Bin 0 -> 79957 bytes
 docs/audyt-ux/petla-2/etap-1/runda-1/kontrola.md   | 100 +++++
 docs/audyt-ux/petla-2/etap-1/runda-1/ocena.json    |   1 +
 .../etap-1/runda-1/okno-serii-1280-jasny.png       | Bin 0 -> 174605 bytes
 .../etap-1/runda-1/okno-serii-360-jasny.png        | Bin 0 -> 47433 bytes
 .../etap-1/runda-1/okno-serii-390-ciemny.png       | Bin 0 -> 62301 bytes
 .../etap-1/runda-1/okno-serii-390-jasny-en.png     | Bin 0 -> 62244 bytes
 .../etap-1/runda-1/okno-serii-390-jasny.png        | Bin 0 -> 61782 bytes
 docs/audyt-ux/petla-2/etap-1/runda-1/raport.json   | 475 +++++++++++++++++++++
 docs/audyt-ux/petla-2/etap-1/runda-1/raport.md     | 129 ++++++
 docs/audyt-ux/petla-2/etap-1/runda-1/regresja.md   |  84 ++++
 docs/audyt-ux/petla-2/etap-1/runda-1/test.log      |  39 ++
 docs/audyt-ux/petla-2/kontrola.mjs                 | 135 ++++++
 .../petla-2/przed/dzis-1280-ciemny-cala.png        | Bin 0 -> 308357 bytes
 docs/audyt-ux/petla-2/przed/dzis-1280-ciemny.png   | Bin 0 -> 155568 bytes
 .../petla-2/przed/dzis-1280-jasny-cala.png         | Bin 0 -> 311468 bytes
 docs/audyt-ux/petla-2/przed/dzis-1280-jasny.png    | Bin 0 -> 158625 bytes
 .../petla-2/przed/dzis-360-ciemny-cala.png         | Bin 0 -> 242690 bytes
 docs/audyt-ux/petla-2/przed/dzis-360-ciemny.png    | Bin 0 -> 68459 bytes
 .../audyt-ux/petla-2/przed/dzis-360-jasny-cala.png | Bin 0 -> 244640 bytes
 docs/audyt-ux/petla-2/przed/dzis-360-jasny.png     | Bin 0 -> 68573 bytes
 .../petla-2/przed/dzis-390-ciemny-cala.png         | Bin 0 -> 243368 bytes
 docs/audyt-ux/petla-2/przed/dzis-390-ciemny.png    | Bin 0 -> 92657 bytes
 .../audyt-ux/petla-2/przed/dzis-390-jasny-cala.png | Bin 0 -> 244832 bytes
 docs/audyt-ux/petla-2/przed/dzis-390-jasny.png     | Bin 0 -> 94777 bytes
 docs/audyt-ux/petla-2/recenzja/etap-1.md           | 117 +++++
 docs/audyt-ux/petla-2/regresja.mjs                 |  47 ++
 docs/audyt-ux/petla-2/uwagi-dla-innych.md          |  12 +
 docs/gry/test/poziomy.mjs                          |   4 +-
 docs/gry/test/ux2-etap1.mjs                        | 159 +++++++
 docs/gry/test/ux2-lib.mjs                          | 106 +++++
 i18n-en.js                                         |  35 +-
 index.html                                         |  11 +-
 nawyk.js                                           | 386 +++++++++++++++++
 tests/nawyk.test.js                                |  86 ++++
 59 files changed, 1980 insertions(+), 4 deletions(-)
```

## Zmiany w drzewie roboczym względem origin/main (z niezacommitowanymi)
```
docs/audyt-ux/petla-2/PROGRESS.md                  |  23 +
 docs/audyt-ux/petla-2/brief.py                     |  35 ++
 .../petla-2/etap-1/runda-1/dzis-17-1280-ciemny.png | Bin 0 -> 156742 bytes
 .../petla-2/etap-1/runda-1/dzis-17-1280-jasny.png  | Bin 0 -> 160179 bytes
 .../petla-2/etap-1/runda-1/dzis-17-360-ciemny.png  | Bin 0 -> 67744 bytes
 .../petla-2/etap-1/runda-1/dzis-17-360-jasny.png   | Bin 0 -> 67575 bytes
 .../petla-2/etap-1/runda-1/dzis-17-390-ciemny.png  | Bin 0 -> 92812 bytes
 .../petla-2/etap-1/runda-1/dzis-17-390-jasny.png   | Bin 0 -> 94565 bytes
 .../petla-2/etap-1/runda-1/dzis-19-1280-ciemny.png | Bin 0 -> 162295 bytes
 .../petla-2/etap-1/runda-1/dzis-19-1280-jasny.png  | Bin 0 -> 165577 bytes
 .../petla-2/etap-1/runda-1/dzis-19-360-ciemny.png  | Bin 0 -> 71240 bytes
 .../etap-1/runda-1/dzis-19-360-jasny-en.png        | Bin 0 -> 67596 bytes
 .../petla-2/etap-1/runda-1/dzis-19-360-jasny.png   | Bin 0 -> 70817 bytes
 .../petla-2/etap-1/runda-1/dzis-19-390-ciemny.png  | Bin 0 -> 90323 bytes
 .../petla-2/etap-1/runda-1/dzis-19-390-jasny.png   | Bin 0 -> 91687 bytes
 .../etap-1/runda-1/dzis-cala-390-ciemny.png        | Bin 0 -> 245264 bytes
 .../petla-2/etap-1/runda-1/dzis-cala-390-jasny.png | Bin 0 -> 246912 bytes
 .../etap-1/runda-1/dzis-po-nauce-1280-ciemny.png   | Bin 0 -> 158219 bytes
 .../etap-1/runda-1/dzis-po-nauce-1280-jasny.png    | Bin 0 -> 161438 bytes
 .../etap-1/runda-1/dzis-po-nauce-360-ciemny.png    | Bin 0 -> 68627 bytes
 .../etap-1/runda-1/dzis-po-nauce-360-jasny.png     | Bin 0 -> 68359 bytes
 .../etap-1/runda-1/dzis-po-nauce-390-ciemny.png    | Bin 0 -> 93517 bytes
 .../etap-1/runda-1/dzis-po-nauce-390-jasny.png     | Bin 0 -> 95319 bytes
 .../runda-1/ekran-seria-plus1-390-ciemny.png       | Bin 0 -> 74684 bytes
 .../etap-1/runda-1/ekran-seria-plus1-390-jasny.png | Bin 0 -> 79957 bytes
 docs/audyt-ux/petla-2/etap-1/runda-1/kontrola.md   | 100 +++++
 docs/audyt-ux/petla-2/etap-1/runda-1/ocena.json    |   1 +
 .../etap-1/runda-1/okno-serii-1280-jasny.png       | Bin 0 -> 174605 bytes
 .../etap-1/runda-1/okno-serii-360-jasny.png        | Bin 0 -> 47433 bytes
 .../etap-1/runda-1/okno-serii-390-ciemny.png       | Bin 0 -> 62301 bytes
 .../etap-1/runda-1/okno-serii-390-jasny-en.png     | Bin 0 -> 62244 bytes
 .../etap-1/runda-1/okno-serii-390-jasny.png        | Bin 0 -> 61782 bytes
 docs/audyt-ux/petla-2/etap-1/runda-1/raport.json   | 475 +++++++++++++++++++++
 docs/audyt-ux/petla-2/etap-1/runda-1/raport.md     | 129 ++++++
 docs/audyt-ux/petla-2/etap-1/runda-1/regresja.md   |  84 ++++
 docs/audyt-ux/petla-2/etap-1/runda-1/test.log      |  39 ++
 docs/audyt-ux/petla-2/kontrola.mjs                 | 135 ++++++
 .../petla-2/przed/dzis-1280-ciemny-cala.png        | Bin 0 -> 308357 bytes
 docs/audyt-ux/petla-2/przed/dzis-1280-ciemny.png   | Bin 0 -> 155568 bytes
 .../petla-2/przed/dzis-1280-jasny-cala.png         | Bin 0 -> 311468 bytes
 docs/audyt-ux/petla-2/przed/dzis-1280-jasny.png    | Bin 0 -> 158625 bytes
 .../petla-2/przed/dzis-360-ciemny-cala.png         | Bin 0 -> 242690 bytes
 docs/audyt-ux/petla-2/przed/dzis-360-ciemny.png    | Bin 0 -> 68459 bytes
 .../audyt-ux/petla-2/przed/dzis-360-jasny-cala.png | Bin 0 -> 244640 bytes
 docs/audyt-ux/petla-2/przed/dzis-360-jasny.png     | Bin 0 -> 68573 bytes
 .../petla-2/przed/dzis-390-ciemny-cala.png         | Bin 0 -> 243368 bytes
 docs/audyt-ux/petla-2/przed/dzis-390-ciemny.png    | Bin 0 -> 92657 bytes
 .../audyt-ux/petla-2/przed/dzis-390-jasny-cala.png | Bin 0 -> 244832 bytes
 docs/audyt-ux/petla-2/przed/dzis-390-jasny.png     | Bin 0 -> 94777 bytes
 docs/audyt-ux/petla-2/recenzja/etap-1.md           | 117 +++++
 docs/audyt-ux/petla-2/regresja.mjs                 |  47 ++
 docs/audyt-ux/petla-2/uwagi-dla-innych.md          |  12 +
 docs/gry/test/poziomy.mjs                          |   4 +-
 docs/gry/test/ux2-etap1.mjs                        | 179 ++++++++
 docs/gry/test/ux2-lib.mjs                          | 107 +++++
 i18n-en.js                                         |  40 +-
 index.html                                         |  11 +-
 nawyk.js                                           | 438 +++++++++++++++++++
 tests/nawyk.test.js                                |  86 ++++
 59 files changed, 2058 insertions(+), 4 deletions(-)
docs/audyt-ux/petla-2/etap-1/runda-2/dzis-17-1280-ciemny.png
docs/audyt-ux/petla-2/etap-1/runda-2/dzis-17-1280-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-2/dzis-17-360-ciemny.png
docs/audyt-ux/petla-2/etap-1/runda-2/dzis-17-360-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-2/dzis-17-390-ciemny.png
docs/audyt-ux/petla-2/etap-1/runda-2/dzis-17-390-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-2/dzis-19-1280-ciemny.png
docs/audyt-ux/petla-2/etap-1/runda-2/dzis-19-1280-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-2/dzis-19-360-ciemny.png
docs/audyt-ux/petla-2/etap-1/runda-2/dzis-19-360-jasny-en.png
docs/audyt-ux/petla-2/etap-1/runda-2/dzis-19-360-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-2/dzis-19-390-ciemny.png
docs/audyt-ux/petla-2/etap-1/runda-2/dzis-19-390-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-2/dzis-cala-390-ciemny.png
docs/audyt-ux/petla-2/etap-1/runda-2/dzis-cala-390-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-2/dzis-po-nauce-1280-ciemny.png
docs/audyt-ux/petla-2/etap-1/runda-2/dzis-po-nauce-1280-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-2/dzis-po-nauce-360-ciemny.png
docs/audyt-ux/petla-2/etap-1/runda-2/dzis-po-nauce-360-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-2/dzis-po-nauce-390-ciemny.png
docs/audyt-ux/petla-2/etap-1/runda-2/dzis-po-nauce-390-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-2/ekran-seria-plus1-390-ciemny.png
docs/audyt-ux/petla-2/etap-1/runda-2/ekran-seria-plus1-390-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-2/kontrola.md
docs/audyt-ux/petla-2/etap-1/runda-2/okno-serii-1280-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-2/okno-serii-360-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-2/okno-serii-390-ciemny.png
docs/audyt-ux/petla-2/etap-1/runda-2/okno-serii-390-jasny-en.png
docs/audyt-ux/petla-2/etap-1/runda-2/okno-serii-390-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-2/raport.json
docs/audyt-ux/petla-2/etap-1/runda-2/raport.md
docs/audyt-ux/petla-2/etap-1/runda-2/regresja.md
docs/audyt-ux/petla-2/etap-1/runda-2/test.log
```

## Zmienione funkcje: index.html
| funkcja | + | − | wywołania z umów | na liście B3 pętli 2 | przykład |
|---|---|---|---|---|---|
| LP_DAILY_GOAL | 1 | 1 | 0 | tak | `const LP_DAILY_GOAL = 50; // XP dziennie` |
| lpLevelBar | 2 | 1 | 1 | tak | `h("span", { class: "xp-chip" + (sk ? "" : " off"), title: sk ? "Seria: dni nauki z rzędu" ` |
| xpFlush | 2 | 0 | 1 | tak | `// ux-2: dzień nauki w progress.nd (kalendarz serii) i najlepsza seria (progress.streakBes` |
| (blok mostu ux-2) | 3 | 0 | 0 | most / ładowanie pliku | `// === most ux-2 ===` |
| (linia <script> nawyk.js) | 1 | 0 | 0 | most / ładowanie pliku | `<script src="nawyk.js?v=20261117-ux2"></script>` |

## Zmienione funkcje: skrot-supabase.js
- brak zmian

## Emoji w dodanych liniach kodu
- brak

## Skrót tablic `quiz` (atrapa i docs/)
- przed (origin/main): `ad674b998719aa96`
- po (drzewo robocze): `ad674b998719aa96`
- równe ✓

## Nowe migracje
- brak

## Nowe polskie teksty bez pary EN
- brak

## Wynik
- ✓ wszystko w zasadach
