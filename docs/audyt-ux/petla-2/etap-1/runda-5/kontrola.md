# Kontrola automatyczna UX-2

Gałąź: ux/2-nawyk · HEAD 418d9d2 · origin/main da5c455

## git diff --stat origin/main...HEAD
```
docs/audyt-ux/petla-2/PROGRESS.md                  |  29 +
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
 docs/audyt-ux/petla-2/etap-1/runda-1/kontrola.md   | 100 ++++
 docs/audyt-ux/petla-2/etap-1/runda-1/ocena.json    |   1 +
 .../etap-1/runda-1/okno-serii-1280-jasny.png       | Bin 0 -> 174605 bytes
 .../etap-1/runda-1/okno-serii-360-jasny.png        | Bin 0 -> 47433 bytes
 .../etap-1/runda-1/okno-serii-390-ciemny.png       | Bin 0 -> 62301 bytes
 .../etap-1/runda-1/okno-serii-390-jasny-en.png     | Bin 0 -> 62244 bytes
 .../etap-1/runda-1/okno-serii-390-jasny.png        | Bin 0 -> 61782 bytes
 docs/audyt-ux/petla-2/etap-1/runda-1/raport.json   | 475 ++++++++++++++++
 docs/audyt-ux/petla-2/etap-1/runda-1/raport.md     | 129 +++++
 docs/audyt-ux/petla-2/etap-1/runda-1/regresja.md   |  84 +++
 docs/audyt-ux/petla-2/etap-1/runda-1/test.log      |  39 ++
 .../petla-2/etap-1/runda-2/dzis-17-1280-ciemny.png | Bin 0 -> 158324 bytes
 .../petla-2/etap-1/runda-2/dzis-17-1280-jasny.png  | Bin 0 -> 162293 bytes
 .../petla-2/etap-1/runda-2/dzis-17-360-ciemny.png  | Bin 0 -> 67769 bytes
 .../petla-2/etap-1/runda-2/dzis-17-360-jasny.png   | Bin 0 -> 68053 bytes
 .../petla-2/etap-1/runda-2/dzis-17-390-ciemny.png  | Bin 0 -> 91380 bytes
 .../petla-2/etap-1/runda-2/dzis-17-390-jasny.png   | Bin 0 -> 93655 bytes
 .../petla-2/etap-1/runda-2/dzis-19-1280-ciemny.png | Bin 0 -> 167950 bytes
 .../petla-2/etap-1/runda-2/dzis-19-1280-jasny.png  | Bin 0 -> 166775 bytes
 .../petla-2/etap-1/runda-2/dzis-19-360-ciemny.png  | Bin 0 -> 71010 bytes
 .../etap-1/runda-2/dzis-19-360-jasny-en.png        | Bin 0 -> 65525 bytes
 .../petla-2/etap-1/runda-2/dzis-19-360-jasny.png   | Bin 0 -> 71395 bytes
 .../petla-2/etap-1/runda-2/dzis-19-390-ciemny.png  | Bin 0 -> 94418 bytes
 .../petla-2/etap-1/runda-2/dzis-19-390-jasny.png   | Bin 0 -> 96752 bytes
 .../etap-1/runda-2/dzis-cala-390-ciemny.png        | Bin 0 -> 244832 bytes
 .../petla-2/etap-1/runda-2/dzis-cala-390-jasny.png | Bin 0 -> 246772 bytes
 .../etap-1/runda-2/dzis-po-nauce-1280-ciemny.png   | Bin 0 -> 159306 bytes
 .../etap-1/runda-2/dzis-po-nauce-1280-jasny.png    | Bin 0 -> 162586 bytes
 .../etap-1/runda-2/dzis-po-nauce-360-ciemny.png    | Bin 0 -> 68092 bytes
 .../etap-1/runda-2/dzis-po-nauce-360-jasny.png     | Bin 0 -> 68091 bytes
 .../etap-1/runda-2/dzis-po-nauce-390-ciemny.png    | Bin 0 -> 91474 bytes
 .../etap-1/runda-2/dzis-po-nauce-390-jasny.png     | Bin 0 -> 93653 bytes
 .../runda-2/ekran-seria-plus1-390-ciemny.png       | Bin 0 -> 75901 bytes
 .../etap-1/runda-2/ekran-seria-plus1-390-jasny.png | Bin 0 -> 82885 bytes
 docs/audyt-ux/petla-2/etap-1/runda-2/kontrola.md   | 193 +++++++
 docs/audyt-ux/petla-2/etap-1/runda-2/ocena.json    |   1 +
 .../etap-1/runda-2/okno-serii-1280-jasny.png       | Bin 0 -> 182863 bytes
 .../etap-1/runda-2/okno-serii-360-jasny.png        | Bin 0 -> 49686 bytes
 .../etap-1/runda-2/okno-serii-390-ciemny.png       | Bin 0 -> 73899 bytes
 .../etap-1/runda-2/okno-serii-390-jasny-en.png     | Bin 0 -> 73708 bytes
 .../etap-1/runda-2/okno-serii-390-jasny.png        | Bin 0 -> 73612 bytes
 docs/audyt-ux/petla-2/etap-1/runda-2/raport.json   | 527 ++++++++++++++++++
 docs/audyt-ux/petla-2/etap-1/runda-2/raport.md     | 142 +++++
 docs/audyt-ux/petla-2/etap-1/runda-2/regresja.md   |  70 +++
 docs/audyt-ux/petla-2/etap-1/runda-2/test.log      |  52 ++
 .../etap-1/runda-3/baner-zamrozenia-390-jasny.png  | Bin 0 -> 99440 bytes
 .../petla-2/etap-1/runda-3/dzis-17-1280-ciemny.png | Bin 0 -> 157801 bytes
 .../petla-2/etap-1/runda-3/dzis-17-1280-jasny.png  | Bin 0 -> 163041 bytes
 .../petla-2/etap-1/runda-3/dzis-17-360-ciemny.png  | Bin 0 -> 68702 bytes
 .../petla-2/etap-1/runda-3/dzis-17-360-jasny.png   | Bin 0 -> 69011 bytes
 .../petla-2/etap-1/runda-3/dzis-17-390-ciemny.png  | Bin 0 -> 88678 bytes
 .../petla-2/etap-1/runda-3/dzis-17-390-jasny.png   | Bin 0 -> 89763 bytes
 .../petla-2/etap-1/runda-3/dzis-19-1280-ciemny.png | Bin 0 -> 164454 bytes
 .../petla-2/etap-1/runda-3/dzis-19-1280-jasny.png  | Bin 0 -> 168170 bytes
 .../petla-2/etap-1/runda-3/dzis-19-360-ciemny.png  | Bin 0 -> 72754 bytes
 .../etap-1/runda-3/dzis-19-360-jasny-en.png        | Bin 0 -> 68293 bytes
 .../petla-2/etap-1/runda-3/dzis-19-360-jasny.png   | Bin 0 -> 72764 bytes
 .../petla-2/etap-1/runda-3/dzis-19-390-ciemny.png  | Bin 0 -> 91783 bytes
 .../petla-2/etap-1/runda-3/dzis-19-390-jasny.png   | Bin 0 -> 93056 bytes
 .../etap-1/runda-3/dzis-19-chroni-390-jasny.png    | Bin 0 -> 93465 bytes
 .../etap-1/runda-3/dzis-cala-390-ciemny.png        | Bin 0 -> 248899 bytes
 .../petla-2/etap-1/runda-3/dzis-cala-390-jasny.png | Bin 0 -> 249180 bytes
 .../etap-1/runda-3/dzis-po-nauce-1280-ciemny.png   | Bin 0 -> 160697 bytes
 .../etap-1/runda-3/dzis-po-nauce-1280-jasny.png    | Bin 0 -> 162980 bytes
 .../etap-1/runda-3/dzis-po-nauce-360-ciemny.png    | Bin 0 -> 69155 bytes
 .../etap-1/runda-3/dzis-po-nauce-360-jasny.png     | Bin 0 -> 69285 bytes
 .../etap-1/runda-3/dzis-po-nauce-390-ciemny.png    | Bin 0 -> 88402 bytes
 .../etap-1/runda-3/dzis-po-nauce-390-jasny.png     | Bin 0 -> 90320 bytes
 .../runda-3/dzis-przerwa-28-12-390-jasny.png       | Bin 0 -> 92686 bytes
 .../runda-3/ekran-seria-plus1-390-ciemny.png       | Bin 0 -> 77582 bytes
 .../etap-1/runda-3/ekran-seria-plus1-390-jasny.png | Bin 0 -> 77982 bytes
 docs/audyt-ux/petla-2/etap-1/runda-3/kontrola.md   | 273 ++++++++++
 docs/audyt-ux/petla-2/etap-1/runda-3/ocena.json    |   1 +
 .../etap-1/runda-3/okno-serii-1280-jasny.png       | Bin 0 -> 184376 bytes
 .../etap-1/runda-3/okno-serii-360-jasny.png        | Bin 0 -> 49564 bytes
 .../etap-1/runda-3/okno-serii-390-ciemny.png       | Bin 0 -> 74536 bytes
 .../etap-1/runda-3/okno-serii-390-jasny-en.png     | Bin 0 -> 75528 bytes
 .../etap-1/runda-3/okno-serii-390-jasny.png        | Bin 0 -> 74090 bytes
 docs/audyt-ux/petla-2/etap-1/runda-3/raport.json   | 565 +++++++++++++++++++
 docs/audyt-ux/petla-2/etap-1/runda-3/raport.md     | 151 ++++++
 docs/audyt-ux/petla-2/etap-1/runda-3/regresja.md   |  71 +++
 docs/audyt-ux/petla-2/etap-1/runda-3/test.log      |  54 ++
 .../runda-4/baner-koniec-serii-390-jasny.png       | Bin 0 -> 93294 bytes
 .../etap-1/runda-4/baner-prezent-390-jasny.png     | Bin 0 -> 90371 bytes
 .../etap-1/runda-4/baner-zamrozenia-390-jasny.png  | Bin 0 -> 91379 bytes
 .../petla-2/etap-1/runda-4/dzis-17-1280-ciemny.png | Bin 0 -> 160094 bytes
 .../petla-2/etap-1/runda-4/dzis-17-1280-jasny.png  | Bin 0 -> 163930 bytes
 .../petla-2/etap-1/runda-4/dzis-17-360-ciemny.png  | Bin 0 -> 70952 bytes
 .../petla-2/etap-1/runda-4/dzis-17-360-jasny.png   | Bin 0 -> 71107 bytes
 .../petla-2/etap-1/runda-4/dzis-17-390-ciemny.png  | Bin 0 -> 90759 bytes
 .../petla-2/etap-1/runda-4/dzis-17-390-jasny.png   | Bin 0 -> 91897 bytes
 .../petla-2/etap-1/runda-4/dzis-19-1280-ciemny.png | Bin 0 -> 164689 bytes
 .../petla-2/etap-1/runda-4/dzis-19-1280-jasny.png  | Bin 0 -> 166177 bytes
 .../petla-2/etap-1/runda-4/dzis-19-360-ciemny.png  | Bin 0 -> 73092 bytes
 .../etap-1/runda-4/dzis-19-360-jasny-en.png        | Bin 0 -> 68769 bytes
 .../petla-2/etap-1/runda-4/dzis-19-360-jasny.png   | Bin 0 -> 72581 bytes
 .../petla-2/etap-1/runda-4/dzis-19-390-ciemny.png  | Bin 0 -> 91930 bytes
 .../petla-2/etap-1/runda-4/dzis-19-390-jasny.png   | Bin 0 -> 93481 bytes
 .../etap-1/runda-4/dzis-19-chroni-390-jasny.png    | Bin 0 -> 94314 bytes
 .../etap-1/runda-4/dzis-cala-390-ciemny.png        | Bin 0 -> 247890 bytes
 .../petla-2/etap-1/runda-4/dzis-cala-390-jasny.png | Bin 0 -> 249492 bytes
 .../etap-1/runda-4/dzis-po-nauce-1280-ciemny.png   | Bin 0 -> 160850 bytes
 .../etap-1/runda-4/dzis-po-nauce-1280-jasny.png    | Bin 0 -> 162934 bytes
 .../etap-1/runda-4/dzis-po-nauce-360-ciemny.png    | Bin 0 -> 69566 bytes
 .../etap-1/runda-4/dzis-po-nauce-360-jasny.png     | Bin 0 -> 69077 bytes
 .../etap-1/runda-4/dzis-po-nauce-390-ciemny.png    | Bin 0 -> 89258 bytes
 .../etap-1/runda-4/dzis-po-nauce-390-jasny.png     | Bin 0 -> 90708 bytes
 .../runda-4/dzis-pon-rano-zamrozenia-390-jasny.png | Bin 0 -> 94664 bytes
 .../runda-4/dzis-przerwa-28-12-390-jasny.png       | Bin 0 -> 92611 bytes
 .../runda-4/ekran-seria-plus1-390-ciemny.png       | Bin 0 -> 77081 bytes
 .../etap-1/runda-4/ekran-seria-plus1-390-jasny.png | Bin 0 -> 78018 bytes
 docs/audyt-ux/petla-2/etap-1/runda-4/kontrola.md   | 354 ++++++++++++
 docs/audyt-ux/petla-2/etap-1/runda-4/ocena.json    |   1 +
 .../etap-1/runda-4/okno-serii-1280-jasny.png       | Bin 0 -> 185293 bytes
 .../etap-1/runda-4/okno-serii-360-jasny.png        | Bin 0 -> 50407 bytes
 .../etap-1/runda-4/okno-serii-390-ciemny.png       | Bin 0 -> 67242 bytes
 .../etap-1/runda-4/okno-serii-390-jasny-en.png     | Bin 0 -> 63787 bytes
 .../etap-1/runda-4/okno-serii-390-jasny.png        | Bin 0 -> 67193 bytes
 docs/audyt-ux/petla-2/etap-1/runda-4/raport.json   | 601 +++++++++++++++++++++
 docs/audyt-ux/petla-2/etap-1/runda-4/raport.md     | 162 ++++++
 docs/audyt-ux/petla-2/etap-1/runda-4/regresja.md   |  77 +++
 docs/audyt-ux/petla-2/etap-1/runda-4/test.log      |  60 ++
 docs/audyt-ux/petla-2/kontrola.mjs                 | 135 +++++
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
 docs/audyt-ux/petla-2/recenzja/etap-1.md           | 117 ++++
 docs/audyt-ux/petla-2/regresja.mjs                 |  47 ++
 docs/audyt-ux/petla-2/uwagi-dla-innych.md          |  15 +
 docs/gry/test/atrapa-supabase.js                   |  55 ++
 docs/gry/test/poziomy.mjs                          |   4 +-
 docs/gry/test/ux2-etap1.mjs                        | 242 +++++++++
 docs/gry/test/ux2-lib.mjs                          | 107 ++++
 i18n-en.js                                         |  56 +-
 index.html                                         |  15 +-
 nawyk.js                                           | 574 ++++++++++++++++++++
 supabase/skrot-v55-seria-zamrozenia.sql            | 127 +++++
 supabase/test/pglite.mjs                           |   2 +-
 supabase/test/v55.sql                              | 108 ++++
 tests/nawyk.test.js                                | 115 ++++
 174 files changed, 5960 insertions(+), 6 deletions(-)
```

## Zmiany w drzewie roboczym względem origin/main (z niezacommitowanymi)
```
docs/audyt-ux/petla-2/PROGRESS.md                  |  32 ++
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
 docs/audyt-ux/petla-2/etap-1/runda-1/kontrola.md   | 100 ++++
 docs/audyt-ux/petla-2/etap-1/runda-1/ocena.json    |   1 +
 .../etap-1/runda-1/okno-serii-1280-jasny.png       | Bin 0 -> 174605 bytes
 .../etap-1/runda-1/okno-serii-360-jasny.png        | Bin 0 -> 47433 bytes
 .../etap-1/runda-1/okno-serii-390-ciemny.png       | Bin 0 -> 62301 bytes
 .../etap-1/runda-1/okno-serii-390-jasny-en.png     | Bin 0 -> 62244 bytes
 .../etap-1/runda-1/okno-serii-390-jasny.png        | Bin 0 -> 61782 bytes
 docs/audyt-ux/petla-2/etap-1/runda-1/raport.json   | 475 ++++++++++++++++
 docs/audyt-ux/petla-2/etap-1/runda-1/raport.md     | 129 +++++
 docs/audyt-ux/petla-2/etap-1/runda-1/regresja.md   |  84 +++
 docs/audyt-ux/petla-2/etap-1/runda-1/test.log      |  39 ++
 .../petla-2/etap-1/runda-2/dzis-17-1280-ciemny.png | Bin 0 -> 158324 bytes
 .../petla-2/etap-1/runda-2/dzis-17-1280-jasny.png  | Bin 0 -> 162293 bytes
 .../petla-2/etap-1/runda-2/dzis-17-360-ciemny.png  | Bin 0 -> 67769 bytes
 .../petla-2/etap-1/runda-2/dzis-17-360-jasny.png   | Bin 0 -> 68053 bytes
 .../petla-2/etap-1/runda-2/dzis-17-390-ciemny.png  | Bin 0 -> 91380 bytes
 .../petla-2/etap-1/runda-2/dzis-17-390-jasny.png   | Bin 0 -> 93655 bytes
 .../petla-2/etap-1/runda-2/dzis-19-1280-ciemny.png | Bin 0 -> 167950 bytes
 .../petla-2/etap-1/runda-2/dzis-19-1280-jasny.png  | Bin 0 -> 166775 bytes
 .../petla-2/etap-1/runda-2/dzis-19-360-ciemny.png  | Bin 0 -> 71010 bytes
 .../etap-1/runda-2/dzis-19-360-jasny-en.png        | Bin 0 -> 65525 bytes
 .../petla-2/etap-1/runda-2/dzis-19-360-jasny.png   | Bin 0 -> 71395 bytes
 .../petla-2/etap-1/runda-2/dzis-19-390-ciemny.png  | Bin 0 -> 94418 bytes
 .../petla-2/etap-1/runda-2/dzis-19-390-jasny.png   | Bin 0 -> 96752 bytes
 .../etap-1/runda-2/dzis-cala-390-ciemny.png        | Bin 0 -> 244832 bytes
 .../petla-2/etap-1/runda-2/dzis-cala-390-jasny.png | Bin 0 -> 246772 bytes
 .../etap-1/runda-2/dzis-po-nauce-1280-ciemny.png   | Bin 0 -> 159306 bytes
 .../etap-1/runda-2/dzis-po-nauce-1280-jasny.png    | Bin 0 -> 162586 bytes
 .../etap-1/runda-2/dzis-po-nauce-360-ciemny.png    | Bin 0 -> 68092 bytes
 .../etap-1/runda-2/dzis-po-nauce-360-jasny.png     | Bin 0 -> 68091 bytes
 .../etap-1/runda-2/dzis-po-nauce-390-ciemny.png    | Bin 0 -> 91474 bytes
 .../etap-1/runda-2/dzis-po-nauce-390-jasny.png     | Bin 0 -> 93653 bytes
 .../runda-2/ekran-seria-plus1-390-ciemny.png       | Bin 0 -> 75901 bytes
 .../etap-1/runda-2/ekran-seria-plus1-390-jasny.png | Bin 0 -> 82885 bytes
 docs/audyt-ux/petla-2/etap-1/runda-2/kontrola.md   | 193 +++++++
 docs/audyt-ux/petla-2/etap-1/runda-2/ocena.json    |   1 +
 .../etap-1/runda-2/okno-serii-1280-jasny.png       | Bin 0 -> 182863 bytes
 .../etap-1/runda-2/okno-serii-360-jasny.png        | Bin 0 -> 49686 bytes
 .../etap-1/runda-2/okno-serii-390-ciemny.png       | Bin 0 -> 73899 bytes
 .../etap-1/runda-2/okno-serii-390-jasny-en.png     | Bin 0 -> 73708 bytes
 .../etap-1/runda-2/okno-serii-390-jasny.png        | Bin 0 -> 73612 bytes
 docs/audyt-ux/petla-2/etap-1/runda-2/raport.json   | 527 ++++++++++++++++++
 docs/audyt-ux/petla-2/etap-1/runda-2/raport.md     | 142 +++++
 docs/audyt-ux/petla-2/etap-1/runda-2/regresja.md   |  70 +++
 docs/audyt-ux/petla-2/etap-1/runda-2/test.log      |  52 ++
 .../etap-1/runda-3/baner-zamrozenia-390-jasny.png  | Bin 0 -> 99440 bytes
 .../petla-2/etap-1/runda-3/dzis-17-1280-ciemny.png | Bin 0 -> 157801 bytes
 .../petla-2/etap-1/runda-3/dzis-17-1280-jasny.png  | Bin 0 -> 163041 bytes
 .../petla-2/etap-1/runda-3/dzis-17-360-ciemny.png  | Bin 0 -> 68702 bytes
 .../petla-2/etap-1/runda-3/dzis-17-360-jasny.png   | Bin 0 -> 69011 bytes
 .../petla-2/etap-1/runda-3/dzis-17-390-ciemny.png  | Bin 0 -> 88678 bytes
 .../petla-2/etap-1/runda-3/dzis-17-390-jasny.png   | Bin 0 -> 89763 bytes
 .../petla-2/etap-1/runda-3/dzis-19-1280-ciemny.png | Bin 0 -> 164454 bytes
 .../petla-2/etap-1/runda-3/dzis-19-1280-jasny.png  | Bin 0 -> 168170 bytes
 .../petla-2/etap-1/runda-3/dzis-19-360-ciemny.png  | Bin 0 -> 72754 bytes
 .../etap-1/runda-3/dzis-19-360-jasny-en.png        | Bin 0 -> 68293 bytes
 .../petla-2/etap-1/runda-3/dzis-19-360-jasny.png   | Bin 0 -> 72764 bytes
 .../petla-2/etap-1/runda-3/dzis-19-390-ciemny.png  | Bin 0 -> 91783 bytes
 .../petla-2/etap-1/runda-3/dzis-19-390-jasny.png   | Bin 0 -> 93056 bytes
 .../etap-1/runda-3/dzis-19-chroni-390-jasny.png    | Bin 0 -> 93465 bytes
 .../etap-1/runda-3/dzis-cala-390-ciemny.png        | Bin 0 -> 248899 bytes
 .../petla-2/etap-1/runda-3/dzis-cala-390-jasny.png | Bin 0 -> 249180 bytes
 .../etap-1/runda-3/dzis-po-nauce-1280-ciemny.png   | Bin 0 -> 160697 bytes
 .../etap-1/runda-3/dzis-po-nauce-1280-jasny.png    | Bin 0 -> 162980 bytes
 .../etap-1/runda-3/dzis-po-nauce-360-ciemny.png    | Bin 0 -> 69155 bytes
 .../etap-1/runda-3/dzis-po-nauce-360-jasny.png     | Bin 0 -> 69285 bytes
 .../etap-1/runda-3/dzis-po-nauce-390-ciemny.png    | Bin 0 -> 88402 bytes
 .../etap-1/runda-3/dzis-po-nauce-390-jasny.png     | Bin 0 -> 90320 bytes
 .../runda-3/dzis-przerwa-28-12-390-jasny.png       | Bin 0 -> 92686 bytes
 .../runda-3/ekran-seria-plus1-390-ciemny.png       | Bin 0 -> 77582 bytes
 .../etap-1/runda-3/ekran-seria-plus1-390-jasny.png | Bin 0 -> 77982 bytes
 docs/audyt-ux/petla-2/etap-1/runda-3/kontrola.md   | 273 +++++++++
 docs/audyt-ux/petla-2/etap-1/runda-3/ocena.json    |   1 +
 .../etap-1/runda-3/okno-serii-1280-jasny.png       | Bin 0 -> 184376 bytes
 .../etap-1/runda-3/okno-serii-360-jasny.png        | Bin 0 -> 49564 bytes
 .../etap-1/runda-3/okno-serii-390-ciemny.png       | Bin 0 -> 74536 bytes
 .../etap-1/runda-3/okno-serii-390-jasny-en.png     | Bin 0 -> 75528 bytes
 .../etap-1/runda-3/okno-serii-390-jasny.png        | Bin 0 -> 74090 bytes
 docs/audyt-ux/petla-2/etap-1/runda-3/raport.json   | 565 +++++++++++++++++++
 docs/audyt-ux/petla-2/etap-1/runda-3/raport.md     | 151 +++++
 docs/audyt-ux/petla-2/etap-1/runda-3/regresja.md   |  71 +++
 docs/audyt-ux/petla-2/etap-1/runda-3/test.log      |  54 ++
 .../runda-4/baner-koniec-serii-390-jasny.png       | Bin 0 -> 93294 bytes
 .../etap-1/runda-4/baner-prezent-390-jasny.png     | Bin 0 -> 90371 bytes
 .../etap-1/runda-4/baner-zamrozenia-390-jasny.png  | Bin 0 -> 91379 bytes
 .../petla-2/etap-1/runda-4/dzis-17-1280-ciemny.png | Bin 0 -> 160094 bytes
 .../petla-2/etap-1/runda-4/dzis-17-1280-jasny.png  | Bin 0 -> 163930 bytes
 .../petla-2/etap-1/runda-4/dzis-17-360-ciemny.png  | Bin 0 -> 70952 bytes
 .../petla-2/etap-1/runda-4/dzis-17-360-jasny.png   | Bin 0 -> 71107 bytes
 .../petla-2/etap-1/runda-4/dzis-17-390-ciemny.png  | Bin 0 -> 90759 bytes
 .../petla-2/etap-1/runda-4/dzis-17-390-jasny.png   | Bin 0 -> 91897 bytes
 .../petla-2/etap-1/runda-4/dzis-19-1280-ciemny.png | Bin 0 -> 164689 bytes
 .../petla-2/etap-1/runda-4/dzis-19-1280-jasny.png  | Bin 0 -> 166177 bytes
 .../petla-2/etap-1/runda-4/dzis-19-360-ciemny.png  | Bin 0 -> 73092 bytes
 .../etap-1/runda-4/dzis-19-360-jasny-en.png        | Bin 0 -> 68769 bytes
 .../petla-2/etap-1/runda-4/dzis-19-360-jasny.png   | Bin 0 -> 72581 bytes
 .../petla-2/etap-1/runda-4/dzis-19-390-ciemny.png  | Bin 0 -> 91930 bytes
 .../petla-2/etap-1/runda-4/dzis-19-390-jasny.png   | Bin 0 -> 93481 bytes
 .../etap-1/runda-4/dzis-19-chroni-390-jasny.png    | Bin 0 -> 94314 bytes
 .../etap-1/runda-4/dzis-cala-390-ciemny.png        | Bin 0 -> 247890 bytes
 .../petla-2/etap-1/runda-4/dzis-cala-390-jasny.png | Bin 0 -> 249492 bytes
 .../etap-1/runda-4/dzis-po-nauce-1280-ciemny.png   | Bin 0 -> 160850 bytes
 .../etap-1/runda-4/dzis-po-nauce-1280-jasny.png    | Bin 0 -> 162934 bytes
 .../etap-1/runda-4/dzis-po-nauce-360-ciemny.png    | Bin 0 -> 69566 bytes
 .../etap-1/runda-4/dzis-po-nauce-360-jasny.png     | Bin 0 -> 69077 bytes
 .../etap-1/runda-4/dzis-po-nauce-390-ciemny.png    | Bin 0 -> 89258 bytes
 .../etap-1/runda-4/dzis-po-nauce-390-jasny.png     | Bin 0 -> 90708 bytes
 .../runda-4/dzis-pon-rano-zamrozenia-390-jasny.png | Bin 0 -> 94664 bytes
 .../runda-4/dzis-przerwa-28-12-390-jasny.png       | Bin 0 -> 92611 bytes
 .../runda-4/ekran-seria-plus1-390-ciemny.png       | Bin 0 -> 77081 bytes
 .../etap-1/runda-4/ekran-seria-plus1-390-jasny.png | Bin 0 -> 78018 bytes
 docs/audyt-ux/petla-2/etap-1/runda-4/kontrola.md   | 354 ++++++++++++
 docs/audyt-ux/petla-2/etap-1/runda-4/ocena.json    |   1 +
 .../etap-1/runda-4/okno-serii-1280-jasny.png       | Bin 0 -> 185293 bytes
 .../etap-1/runda-4/okno-serii-360-jasny.png        | Bin 0 -> 50407 bytes
 .../etap-1/runda-4/okno-serii-390-ciemny.png       | Bin 0 -> 67242 bytes
 .../etap-1/runda-4/okno-serii-390-jasny-en.png     | Bin 0 -> 63787 bytes
 .../etap-1/runda-4/okno-serii-390-jasny.png        | Bin 0 -> 67193 bytes
 docs/audyt-ux/petla-2/etap-1/runda-4/raport.json   | 601 ++++++++++++++++++++
 docs/audyt-ux/petla-2/etap-1/runda-4/raport.md     | 162 ++++++
 docs/audyt-ux/petla-2/etap-1/runda-4/regresja.md   |  77 +++
 docs/audyt-ux/petla-2/etap-1/runda-4/test.log      |  60 ++
 docs/audyt-ux/petla-2/kontrola.mjs                 | 135 +++++
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
 docs/audyt-ux/petla-2/recenzja/etap-1.md           | 117 ++++
 docs/audyt-ux/petla-2/regresja.mjs                 |  56 ++
 docs/audyt-ux/petla-2/uwagi-dla-innych.md          |  15 +
 docs/gry/test/atrapa-supabase.js                   |  55 ++
 docs/gry/test/poziomy.mjs                          |   4 +-
 docs/gry/test/ux2-etap1.mjs                        | 253 +++++++++
 docs/gry/test/ux2-lib.mjs                          | 107 ++++
 i18n-en.js                                         |  63 ++-
 index.html                                         |  15 +-
 nawyk.js                                           | 610 +++++++++++++++++++++
 supabase/skrot-v55-seria-zamrozenia.sql            | 127 +++++
 supabase/test/pglite.mjs                           |   2 +-
 supabase/test/v55.sql                              | 108 ++++
 tests/nawyk.test.js                                | 115 ++++
 174 files changed, 6026 insertions(+), 6 deletions(-)
docs/audyt-ux/petla-2/etap-1/runda-5/baner-koniec-serii-390-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-5/baner-prezent-390-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-5/baner-zamrozenia-390-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-5/dzis-17-1280-ciemny.png
docs/audyt-ux/petla-2/etap-1/runda-5/dzis-17-1280-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-5/dzis-17-360-ciemny.png
docs/audyt-ux/petla-2/etap-1/runda-5/dzis-17-360-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-5/dzis-17-390-ciemny.png
docs/audyt-ux/petla-2/etap-1/runda-5/dzis-17-390-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-5/dzis-19-1280-ciemny.png
docs/audyt-ux/petla-2/etap-1/runda-5/dzis-19-1280-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-5/dzis-19-360-ciemny.png
docs/audyt-ux/petla-2/etap-1/runda-5/dzis-19-360-jasny-en.png
docs/audyt-ux/petla-2/etap-1/runda-5/dzis-19-360-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-5/dzis-19-390-ciemny.png
docs/audyt-ux/petla-2/etap-1/runda-5/dzis-19-390-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-5/dzis-19-chroni-390-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-5/dzis-cala-390-ciemny.png
docs/audyt-ux/petla-2/etap-1/runda-5/dzis-cala-390-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-5/dzis-po-nauce-1280-ciemny.png
docs/audyt-ux/petla-2/etap-1/runda-5/dzis-po-nauce-1280-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-5/dzis-po-nauce-360-ciemny.png
docs/audyt-ux/petla-2/etap-1/runda-5/dzis-po-nauce-360-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-5/dzis-po-nauce-390-ciemny.png
docs/audyt-ux/petla-2/etap-1/runda-5/dzis-po-nauce-390-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-5/dzis-pon-rano-zamrozenia-390-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-5/dzis-przerwa-28-12-390-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-5/ekran-seria-plus1-390-ciemny.png
docs/audyt-ux/petla-2/etap-1/runda-5/ekran-seria-plus1-390-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-5/kontrola.md
docs/audyt-ux/petla-2/etap-1/runda-5/okno-serii-1280-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-5/okno-serii-360-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-5/okno-serii-390-ciemny.png
docs/audyt-ux/petla-2/etap-1/runda-5/okno-serii-390-jasny-en.png
docs/audyt-ux/petla-2/etap-1/runda-5/okno-serii-390-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-5/okno-serii-chroni-390-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-5/raport.json
docs/audyt-ux/petla-2/etap-1/runda-5/raport.md
docs/audyt-ux/petla-2/etap-1/runda-5/regresja.md
docs/audyt-ux/petla-2/etap-1/runda-5/test.log
supabase/skrot-v56-dni-nauki.sql
supabase/test/v56.sql
```

## Zmienione funkcje: index.html
| funkcja | + | − | wywołania z umów | na liście B3 pętli 2 | przykład |
|---|---|---|---|---|---|
| LP_DAILY_GOAL | 1 | 1 | 0 | tak | `const LP_DAILY_GOAL = 50; // XP dziennie` |
| lpLevelBar | 2 | 1 | 1 | tak | `h("span", { class: "xp-chip" + (sk ? "" : " off"), title: sk ? "Seria: dni nauki z rzędu" ` |
| xpFlush | 2 | 0 | 1 | tak | `// ux-2: dzień nauki w progress.nd (kalendarz serii) i najlepsza seria (progress.streakBes` |
| streakNext | 2 | 0 | 1 | tak | `// ux-2: zasady serii w nawyk.js (zamrożenia na 2 dni z rzędu, przerwy w zajęciach nie zry` |
| kStreakAlive | 1 | 1 | 1 | tak | `function kStreakAlive(st, t) { return st.d === t \|\| st.d === t - 1 \|\| (st.d === t - 2 ` |
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
### supabase/skrot-v55-seria-zamrozenia.sql
```
public.nauka_dzien_nauki(uuid, date): nowsza wersja w skrot-v56-dni-nauki.sql
```
### supabase/skrot-v56-dni-nauki.sql
```

```

## Nowe polskie teksty bez pary EN
- brak

## Wynik
- ✓ wszystko w zasadach
