# Kontrola automatyczna UX-2

Gałąź: ux/2-nawyk · HEAD 872c9d9 · origin/main 78dfd1f

## git diff --stat da5c455..HEAD
```
docs/audyt-ux/petla-2/PROGRESS.md                  |   75 ++
 docs/audyt-ux/petla-2/brief.py                     |   35 +
 .../petla-2/etap-1/runda-1/dzis-17-1280-ciemny.png |  Bin 0 -> 156742 bytes
 .../petla-2/etap-1/runda-1/dzis-17-1280-jasny.png  |  Bin 0 -> 160179 bytes
 .../petla-2/etap-1/runda-1/dzis-17-360-ciemny.png  |  Bin 0 -> 67744 bytes
 .../petla-2/etap-1/runda-1/dzis-17-360-jasny.png   |  Bin 0 -> 67575 bytes
 .../petla-2/etap-1/runda-1/dzis-17-390-ciemny.png  |  Bin 0 -> 92812 bytes
 .../petla-2/etap-1/runda-1/dzis-17-390-jasny.png   |  Bin 0 -> 94565 bytes
 .../petla-2/etap-1/runda-1/dzis-19-1280-ciemny.png |  Bin 0 -> 162295 bytes
 .../petla-2/etap-1/runda-1/dzis-19-1280-jasny.png  |  Bin 0 -> 165577 bytes
 .../petla-2/etap-1/runda-1/dzis-19-360-ciemny.png  |  Bin 0 -> 71240 bytes
 .../etap-1/runda-1/dzis-19-360-jasny-en.png        |  Bin 0 -> 67596 bytes
 .../petla-2/etap-1/runda-1/dzis-19-360-jasny.png   |  Bin 0 -> 70817 bytes
 .../petla-2/etap-1/runda-1/dzis-19-390-ciemny.png  |  Bin 0 -> 90323 bytes
 .../petla-2/etap-1/runda-1/dzis-19-390-jasny.png   |  Bin 0 -> 91687 bytes
 .../etap-1/runda-1/dzis-cala-390-ciemny.png        |  Bin 0 -> 245264 bytes
 .../petla-2/etap-1/runda-1/dzis-cala-390-jasny.png |  Bin 0 -> 246912 bytes
 .../etap-1/runda-1/dzis-po-nauce-1280-ciemny.png   |  Bin 0 -> 158219 bytes
 .../etap-1/runda-1/dzis-po-nauce-1280-jasny.png    |  Bin 0 -> 161438 bytes
 .../etap-1/runda-1/dzis-po-nauce-360-ciemny.png    |  Bin 0 -> 68627 bytes
 .../etap-1/runda-1/dzis-po-nauce-360-jasny.png     |  Bin 0 -> 68359 bytes
 .../etap-1/runda-1/dzis-po-nauce-390-ciemny.png    |  Bin 0 -> 93517 bytes
 .../etap-1/runda-1/dzis-po-nauce-390-jasny.png     |  Bin 0 -> 95319 bytes
 .../runda-1/ekran-seria-plus1-390-ciemny.png       |  Bin 0 -> 74684 bytes
 .../etap-1/runda-1/ekran-seria-plus1-390-jasny.png |  Bin 0 -> 79957 bytes
 docs/audyt-ux/petla-2/etap-1/runda-1/kontrola.md   |  100 ++
 docs/audyt-ux/petla-2/etap-1/runda-1/ocena.json    |    1 +
 .../etap-1/runda-1/okno-serii-1280-jasny.png       |  Bin 0 -> 174605 bytes
 .../etap-1/runda-1/okno-serii-360-jasny.png        |  Bin 0 -> 47433 bytes
 .../etap-1/runda-1/okno-serii-390-ciemny.png       |  Bin 0 -> 62301 bytes
 .../etap-1/runda-1/okno-serii-390-jasny-en.png     |  Bin 0 -> 62244 bytes
 .../etap-1/runda-1/okno-serii-390-jasny.png        |  Bin 0 -> 61782 bytes
 docs/audyt-ux/petla-2/etap-1/runda-1/raport.json   |  475 +++++++++
 docs/audyt-ux/petla-2/etap-1/runda-1/raport.md     |  129 +++
 docs/audyt-ux/petla-2/etap-1/runda-1/regresja.md   |   84 ++
 docs/audyt-ux/petla-2/etap-1/runda-1/test.log      |   39 +
 .../petla-2/etap-1/runda-2/dzis-17-1280-ciemny.png |  Bin 0 -> 158324 bytes
 .../petla-2/etap-1/runda-2/dzis-17-1280-jasny.png  |  Bin 0 -> 162293 bytes
 .../petla-2/etap-1/runda-2/dzis-17-360-ciemny.png  |  Bin 0 -> 67769 bytes
 .../petla-2/etap-1/runda-2/dzis-17-360-jasny.png   |  Bin 0 -> 68053 bytes
 .../petla-2/etap-1/runda-2/dzis-17-390-ciemny.png  |  Bin 0 -> 91380 bytes
 .../petla-2/etap-1/runda-2/dzis-17-390-jasny.png   |  Bin 0 -> 93655 bytes
 .../petla-2/etap-1/runda-2/dzis-19-1280-ciemny.png |  Bin 0 -> 167950 bytes
 .../petla-2/etap-1/runda-2/dzis-19-1280-jasny.png  |  Bin 0 -> 166775 bytes
 .../petla-2/etap-1/runda-2/dzis-19-360-ciemny.png  |  Bin 0 -> 71010 bytes
 .../etap-1/runda-2/dzis-19-360-jasny-en.png        |  Bin 0 -> 65525 bytes
 .../petla-2/etap-1/runda-2/dzis-19-360-jasny.png   |  Bin 0 -> 71395 bytes
 .../petla-2/etap-1/runda-2/dzis-19-390-ciemny.png  |  Bin 0 -> 94418 bytes
 .../petla-2/etap-1/runda-2/dzis-19-390-jasny.png   |  Bin 0 -> 96752 bytes
 .../etap-1/runda-2/dzis-cala-390-ciemny.png        |  Bin 0 -> 244832 bytes
 .../petla-2/etap-1/runda-2/dzis-cala-390-jasny.png |  Bin 0 -> 246772 bytes
 .../etap-1/runda-2/dzis-po-nauce-1280-ciemny.png   |  Bin 0 -> 159306 bytes
 .../etap-1/runda-2/dzis-po-nauce-1280-jasny.png    |  Bin 0 -> 162586 bytes
 .../etap-1/runda-2/dzis-po-nauce-360-ciemny.png    |  Bin 0 -> 68092 bytes
 .../etap-1/runda-2/dzis-po-nauce-360-jasny.png     |  Bin 0 -> 68091 bytes
 .../etap-1/runda-2/dzis-po-nauce-390-ciemny.png    |  Bin 0 -> 91474 bytes
 .../etap-1/runda-2/dzis-po-nauce-390-jasny.png     |  Bin 0 -> 93653 bytes
 .../runda-2/ekran-seria-plus1-390-ciemny.png       |  Bin 0 -> 75901 bytes
 .../etap-1/runda-2/ekran-seria-plus1-390-jasny.png |  Bin 0 -> 82885 bytes
 docs/audyt-ux/petla-2/etap-1/runda-2/kontrola.md   |  193 ++++
 docs/audyt-ux/petla-2/etap-1/runda-2/ocena.json    |    1 +
 .../etap-1/runda-2/okno-serii-1280-jasny.png       |  Bin 0 -> 182863 bytes
 .../etap-1/runda-2/okno-serii-360-jasny.png        |  Bin 0 -> 49686 bytes
 .../etap-1/runda-2/okno-serii-390-ciemny.png       |  Bin 0 -> 73899 bytes
 .../etap-1/runda-2/okno-serii-390-jasny-en.png     |  Bin 0 -> 73708 bytes
 .../etap-1/runda-2/okno-serii-390-jasny.png        |  Bin 0 -> 73612 bytes
 docs/audyt-ux/petla-2/etap-1/runda-2/raport.json   |  527 ++++++++++
 docs/audyt-ux/petla-2/etap-1/runda-2/raport.md     |  142 +++
 docs/audyt-ux/petla-2/etap-1/runda-2/regresja.md   |   70 ++
 docs/audyt-ux/petla-2/etap-1/runda-2/test.log      |   52 +
 .../etap-1/runda-3/baner-zamrozenia-390-jasny.png  |  Bin 0 -> 99440 bytes
 .../petla-2/etap-1/runda-3/dzis-17-1280-ciemny.png |  Bin 0 -> 157801 bytes
 .../petla-2/etap-1/runda-3/dzis-17-1280-jasny.png  |  Bin 0 -> 163041 bytes
 .../petla-2/etap-1/runda-3/dzis-17-360-ciemny.png  |  Bin 0 -> 68702 bytes
 .../petla-2/etap-1/runda-3/dzis-17-360-jasny.png   |  Bin 0 -> 69011 bytes
 .../petla-2/etap-1/runda-3/dzis-17-390-ciemny.png  |  Bin 0 -> 88678 bytes
 .../petla-2/etap-1/runda-3/dzis-17-390-jasny.png   |  Bin 0 -> 89763 bytes
 .../petla-2/etap-1/runda-3/dzis-19-1280-ciemny.png |  Bin 0 -> 164454 bytes
 .../petla-2/etap-1/runda-3/dzis-19-1280-jasny.png  |  Bin 0 -> 168170 bytes
 .../petla-2/etap-1/runda-3/dzis-19-360-ciemny.png  |  Bin 0 -> 72754 bytes
 .../etap-1/runda-3/dzis-19-360-jasny-en.png        |  Bin 0 -> 68293 bytes
 .../petla-2/etap-1/runda-3/dzis-19-360-jasny.png   |  Bin 0 -> 72764 bytes
 .../petla-2/etap-1/runda-3/dzis-19-390-ciemny.png  |  Bin 0 -> 91783 bytes
 .../petla-2/etap-1/runda-3/dzis-19-390-jasny.png   |  Bin 0 -> 93056 bytes
 .../etap-1/runda-3/dzis-19-chroni-390-jasny.png    |  Bin 0 -> 93465 bytes
 .../etap-1/runda-3/dzis-cala-390-ciemny.png        |  Bin 0 -> 248899 bytes
 .../petla-2/etap-1/runda-3/dzis-cala-390-jasny.png |  Bin 0 -> 249180 bytes
 .../etap-1/runda-3/dzis-po-nauce-1280-ciemny.png   |  Bin 0 -> 160697 bytes
 .../etap-1/runda-3/dzis-po-nauce-1280-jasny.png    |  Bin 0 -> 162980 bytes
 .../etap-1/runda-3/dzis-po-nauce-360-ciemny.png    |  Bin 0 -> 69155 bytes
 .../etap-1/runda-3/dzis-po-nauce-360-jasny.png     |  Bin 0 -> 69285 bytes
 .../etap-1/runda-3/dzis-po-nauce-390-ciemny.png    |  Bin 0 -> 88402 bytes
 .../etap-1/runda-3/dzis-po-nauce-390-jasny.png     |  Bin 0 -> 90320 bytes
 .../runda-3/dzis-przerwa-28-12-390-jasny.png       |  Bin 0 -> 92686 bytes
 .../runda-3/ekran-seria-plus1-390-ciemny.png       |  Bin 0 -> 77582 bytes
 .../etap-1/runda-3/ekran-seria-plus1-390-jasny.png |  Bin 0 -> 77982 bytes
 docs/audyt-ux/petla-2/etap-1/runda-3/kontrola.md   |  273 +++++
 docs/audyt-ux/petla-2/etap-1/runda-3/ocena.json    |    1 +
 .../etap-1/runda-3/okno-serii-1280-jasny.png       |  Bin 0 -> 184376 bytes
 .../etap-1/runda-3/okno-serii-360-jasny.png        |  Bin 0 -> 49564 bytes
 .../etap-1/runda-3/okno-serii-390-ciemny.png       |  Bin 0 -> 74536 bytes
 .../etap-1/runda-3/okno-serii-390-jasny-en.png     |  Bin 0 -> 75528 bytes
 .../etap-1/runda-3/okno-serii-390-jasny.png        |  Bin 0 -> 74090 bytes
 docs/audyt-ux/petla-2/etap-1/runda-3/raport.json   |  565 +++++++++++
 docs/audyt-ux/petla-2/etap-1/runda-3/raport.md     |  151 +++
 docs/audyt-ux/petla-2/etap-1/runda-3/regresja.md   |   71 ++
 docs/audyt-ux/petla-2/etap-1/runda-3/test.log      |   54 +
 .../runda-4/baner-koniec-serii-390-jasny.png       |  Bin 0 -> 93294 bytes
 .../etap-1/runda-4/baner-prezent-390-jasny.png     |  Bin 0 -> 90371 bytes
 .../etap-1/runda-4/baner-zamrozenia-390-jasny.png  |  Bin 0 -> 91379 bytes
 .../petla-2/etap-1/runda-4/dzis-17-1280-ciemny.png |  Bin 0 -> 160094 bytes
 .../petla-2/etap-1/runda-4/dzis-17-1280-jasny.png  |  Bin 0 -> 163930 bytes
 .../petla-2/etap-1/runda-4/dzis-17-360-ciemny.png  |  Bin 0 -> 70952 bytes
 .../petla-2/etap-1/runda-4/dzis-17-360-jasny.png   |  Bin 0 -> 71107 bytes
 .../petla-2/etap-1/runda-4/dzis-17-390-ciemny.png  |  Bin 0 -> 90759 bytes
 .../petla-2/etap-1/runda-4/dzis-17-390-jasny.png   |  Bin 0 -> 91897 bytes
 .../petla-2/etap-1/runda-4/dzis-19-1280-ciemny.png |  Bin 0 -> 164689 bytes
 .../petla-2/etap-1/runda-4/dzis-19-1280-jasny.png  |  Bin 0 -> 166177 bytes
 .../petla-2/etap-1/runda-4/dzis-19-360-ciemny.png  |  Bin 0 -> 73092 bytes
 .../etap-1/runda-4/dzis-19-360-jasny-en.png        |  Bin 0 -> 68769 bytes
 .../petla-2/etap-1/runda-4/dzis-19-360-jasny.png   |  Bin 0 -> 72581 bytes
 .../petla-2/etap-1/runda-4/dzis-19-390-ciemny.png  |  Bin 0 -> 91930 bytes
 .../petla-2/etap-1/runda-4/dzis-19-390-jasny.png   |  Bin 0 -> 93481 bytes
 .../etap-1/runda-4/dzis-19-chroni-390-jasny.png    |  Bin 0 -> 94314 bytes
 .../etap-1/runda-4/dzis-cala-390-ciemny.png        |  Bin 0 -> 247890 bytes
 .../petla-2/etap-1/runda-4/dzis-cala-390-jasny.png |  Bin 0 -> 249492 bytes
 .../etap-1/runda-4/dzis-po-nauce-1280-ciemny.png   |  Bin 0 -> 160850 bytes
 .../etap-1/runda-4/dzis-po-nauce-1280-jasny.png    |  Bin 0 -> 162934 bytes
 .../etap-1/runda-4/dzis-po-nauce-360-ciemny.png    |  Bin 0 -> 69566 bytes
 .../etap-1/runda-4/dzis-po-nauce-360-jasny.png     |  Bin 0 -> 69077 bytes
 .../etap-1/runda-4/dzis-po-nauce-390-ciemny.png    |  Bin 0 -> 89258 bytes
 .../etap-1/runda-4/dzis-po-nauce-390-jasny.png     |  Bin 0 -> 90708 bytes
 .../runda-4/dzis-pon-rano-zamrozenia-390-jasny.png |  Bin 0 -> 94664 bytes
 .../runda-4/dzis-przerwa-28-12-390-jasny.png       |  Bin 0 -> 92611 bytes
 .../runda-4/ekran-seria-plus1-390-ciemny.png       |  Bin 0 -> 77081 bytes
 .../etap-1/runda-4/ekran-seria-plus1-390-jasny.png |  Bin 0 -> 78018 bytes
 docs/audyt-ux/petla-2/etap-1/runda-4/kontrola.md   |  354 +++++++
 docs/audyt-ux/petla-2/etap-1/runda-4/ocena.json    |    1 +
 .../etap-1/runda-4/okno-serii-1280-jasny.png       |  Bin 0 -> 185293 bytes
 .../etap-1/runda-4/okno-serii-360-jasny.png        |  Bin 0 -> 50407 bytes
 .../etap-1/runda-4/okno-serii-390-ciemny.png       |  Bin 0 -> 67242 bytes
 .../etap-1/runda-4/okno-serii-390-jasny-en.png     |  Bin 0 -> 63787 bytes
 .../etap-1/runda-4/okno-serii-390-jasny.png        |  Bin 0 -> 67193 bytes
 docs/audyt-ux/petla-2/etap-1/runda-4/raport.json   |  601 +++++++++++
 docs/audyt-ux/petla-2/etap-1/runda-4/raport.md     |  162 +++
 docs/audyt-ux/petla-2/etap-1/runda-4/regresja.md   |   77 ++
 docs/audyt-ux/petla-2/etap-1/runda-4/test.log      |   60 ++
 .../runda-5/baner-koniec-serii-390-jasny.png       |  Bin 0 -> 94386 bytes
 .../etap-1/runda-5/baner-prezent-390-jasny.png     |  Bin 0 -> 91615 bytes
 .../etap-1/runda-5/baner-zamrozenia-390-jasny.png  |  Bin 0 -> 92545 bytes
 .../petla-2/etap-1/runda-5/dzis-17-1280-ciemny.png |  Bin 0 -> 161447 bytes
 .../petla-2/etap-1/runda-5/dzis-17-1280-jasny.png  |  Bin 0 -> 165584 bytes
 .../petla-2/etap-1/runda-5/dzis-17-360-ciemny.png  |  Bin 0 -> 71284 bytes
 .../petla-2/etap-1/runda-5/dzis-17-360-jasny.png   |  Bin 0 -> 71412 bytes
 .../petla-2/etap-1/runda-5/dzis-17-390-ciemny.png  |  Bin 0 -> 90703 bytes
 .../petla-2/etap-1/runda-5/dzis-17-390-jasny.png   |  Bin 0 -> 92682 bytes
 .../petla-2/etap-1/runda-5/dzis-19-1280-ciemny.png |  Bin 0 -> 163618 bytes
 .../petla-2/etap-1/runda-5/dzis-19-1280-jasny.png  |  Bin 0 -> 167889 bytes
 .../petla-2/etap-1/runda-5/dzis-19-360-ciemny.png  |  Bin 0 -> 73369 bytes
 .../etap-1/runda-5/dzis-19-360-jasny-en.png        |  Bin 0 -> 68989 bytes
 .../petla-2/etap-1/runda-5/dzis-19-360-jasny.png   |  Bin 0 -> 73042 bytes
 .../petla-2/etap-1/runda-5/dzis-19-390-ciemny.png  |  Bin 0 -> 92973 bytes
 .../petla-2/etap-1/runda-5/dzis-19-390-jasny.png   |  Bin 0 -> 94027 bytes
 .../etap-1/runda-5/dzis-19-chroni-390-jasny.png    |  Bin 0 -> 96002 bytes
 .../etap-1/runda-5/dzis-cala-390-ciemny.png        |  Bin 0 -> 249993 bytes
 .../petla-2/etap-1/runda-5/dzis-cala-390-jasny.png |  Bin 0 -> 251418 bytes
 .../etap-1/runda-5/dzis-po-nauce-1280-ciemny.png   |  Bin 0 -> 160501 bytes
 .../etap-1/runda-5/dzis-po-nauce-1280-jasny.png    |  Bin 0 -> 165294 bytes
 .../etap-1/runda-5/dzis-po-nauce-360-ciemny.png    |  Bin 0 -> 70499 bytes
 .../etap-1/runda-5/dzis-po-nauce-360-jasny.png     |  Bin 0 -> 70324 bytes
 .../etap-1/runda-5/dzis-po-nauce-390-ciemny.png    |  Bin 0 -> 89584 bytes
 .../etap-1/runda-5/dzis-po-nauce-390-jasny.png     |  Bin 0 -> 91294 bytes
 .../runda-5/dzis-pon-rano-zamrozenia-390-jasny.png |  Bin 0 -> 95160 bytes
 .../runda-5/dzis-przerwa-28-12-390-jasny.png       |  Bin 0 -> 93802 bytes
 .../runda-5/ekran-seria-plus1-390-ciemny.png       |  Bin 0 -> 78742 bytes
 .../etap-1/runda-5/ekran-seria-plus1-390-jasny.png |  Bin 0 -> 79678 bytes
 docs/audyt-ux/petla-2/etap-1/runda-5/kontrola.md   |  441 ++++++++
 docs/audyt-ux/petla-2/etap-1/runda-5/ocena.json    |    1 +
 .../etap-1/runda-5/okno-serii-1280-jasny.png       |  Bin 0 -> 185837 bytes
 .../etap-1/runda-5/okno-serii-360-jasny.png        |  Bin 0 -> 48435 bytes
 .../etap-1/runda-5/okno-serii-390-ciemny.png       |  Bin 0 -> 73383 bytes
 .../etap-1/runda-5/okno-serii-390-jasny-en.png     |  Bin 0 -> 70415 bytes
 .../etap-1/runda-5/okno-serii-390-jasny.png        |  Bin 0 -> 73177 bytes
 .../etap-1/runda-5/okno-serii-chroni-390-jasny.png |  Bin 0 -> 72089 bytes
 docs/audyt-ux/petla-2/etap-1/runda-5/raport.json   |  635 ++++++++++++
 docs/audyt-ux/petla-2/etap-1/runda-5/raport.md     |  172 ++++
 docs/audyt-ux/petla-2/etap-1/runda-5/regresja.md   |   77 ++
 docs/audyt-ux/petla-2/etap-1/runda-5/test.log      |   68 ++
 .../petla-2/etap-2/runda-1/chroni-390-jasny.png    |  Bin 0 -> 94463 bytes
 .../etap-2/runda-1/k1-pon-2zam-po-nauce.png        |  Bin 0 -> 97454 bytes
 .../petla-2/etap-2/runda-1/k1-pon-2zam-przed.png   |  Bin 0 -> 93796 bytes
 .../etap-2/runda-1/k3-dzis-przerwa-1280-ciemny.png |  Bin 0 -> 168524 bytes
 .../etap-2/runda-1/k3-dzis-przerwa-1280-jasny.png  |  Bin 0 -> 171619 bytes
 .../etap-2/runda-1/k3-dzis-przerwa-360-ciemny.png  |  Bin 0 -> 72371 bytes
 .../runda-1/k3-dzis-przerwa-360-jasny-en.png       |  Bin 0 -> 71238 bytes
 .../etap-2/runda-1/k3-dzis-przerwa-360-jasny.png   |  Bin 0 -> 71624 bytes
 .../etap-2/runda-1/k3-dzis-przerwa-390-ciemny.png  |  Bin 0 -> 93666 bytes
 .../runda-1/k3-dzis-przerwa-390-jasny-en.png       |  Bin 0 -> 93489 bytes
 .../etap-2/runda-1/k3-dzis-przerwa-390-jasny.png   |  Bin 0 -> 93746 bytes
 .../etap-2/runda-1/k3-okno-przerwa-390-jasny.png   |  Bin 0 -> 73275 bytes
 .../etap-2/runda-1/k4-tydzien-1280-jasny.png       |  Bin 0 -> 169216 bytes
 .../etap-2/runda-1/k4-tydzien-360-jasny-en.png     |  Bin 0 -> 68356 bytes
 .../etap-2/runda-1/k4-tydzien-360-jasny.png        |  Bin 0 -> 70564 bytes
 .../etap-2/runda-1/k4-tydzien-390-ciemny.png       |  Bin 0 -> 92564 bytes
 .../etap-2/runda-1/k4-tydzien-390-jasny.png        |  Bin 0 -> 91969 bytes
 .../runda-1/k5-karta-zamrozenia-360-jasny.png      |  Bin 0 -> 65439 bytes
 .../runda-1/k5-karta-zamrozenia-390-ciemny.png     |  Bin 0 -> 89011 bytes
 .../runda-1/k5-karta-zamrozenia-390-jasny-en.png   |  Bin 0 -> 86176 bytes
 .../runda-1/k5-karta-zamrozenia-390-jasny.png      |  Bin 0 -> 88072 bytes
 .../petla-2/etap-2/runda-1/k5-kbuy-390-jasny.png   |  Bin 0 -> 61052 bytes
 .../petla-2/etap-2/runda-1/k5-oferta-390-jasny.png |  Bin 0 -> 88729 bytes
 docs/audyt-ux/petla-2/etap-2/runda-1/kontrola.md   |  516 ++++++++++
 docs/audyt-ux/petla-2/etap-2/runda-1/ocena.json    |    1 +
 .../etap-2/runda-1/prezent-baner-390-jasny.png     |  Bin 0 -> 88436 bytes
 docs/audyt-ux/petla-2/etap-2/runda-1/raport.json   |  470 +++++++++
 docs/audyt-ux/petla-2/etap-2/runda-1/raport.md     |  242 +++++
 docs/audyt-ux/petla-2/etap-2/runda-1/regresja.md   |   87 ++
 docs/audyt-ux/petla-2/etap-2/runda-1/test.log      |   53 +
 .../etap-2/runda-2/baner-uzupelnij-390-jasny.png   |  Bin 0 -> 92773 bytes
 .../petla-2/etap-2/runda-2/chroni-390-jasny.png    |  Bin 0 -> 95175 bytes
 .../etap-2/runda-2/k1-pon-2zam-po-nauce.png        |  Bin 0 -> 93056 bytes
 .../petla-2/etap-2/runda-2/k1-pon-2zam-przed.png   |  Bin 0 -> 94172 bytes
 .../etap-2/runda-2/k3-dzis-przerwa-1280-ciemny.png |  Bin 0 -> 177784 bytes
 .../etap-2/runda-2/k3-dzis-przerwa-1280-jasny.png  |  Bin 0 -> 180545 bytes
 .../etap-2/runda-2/k3-dzis-przerwa-360-ciemny.png  |  Bin 0 -> 72491 bytes
 .../runda-2/k3-dzis-przerwa-360-jasny-en.png       |  Bin 0 -> 70797 bytes
 .../etap-2/runda-2/k3-dzis-przerwa-360-jasny.png   |  Bin 0 -> 71875 bytes
 .../etap-2/runda-2/k3-dzis-przerwa-390-ciemny.png  |  Bin 0 -> 94004 bytes
 .../runda-2/k3-dzis-przerwa-390-jasny-en.png       |  Bin 0 -> 92963 bytes
 .../etap-2/runda-2/k3-dzis-przerwa-390-jasny.png   |  Bin 0 -> 93537 bytes
 .../etap-2/runda-2/k3-okno-przerwa-390-jasny.png   |  Bin 0 -> 63763 bytes
 .../etap-2/runda-2/k4-tydzien-1280-jasny.png       |  Bin 0 -> 182284 bytes
 .../etap-2/runda-2/k4-tydzien-360-jasny-en.png     |  Bin 0 -> 69178 bytes
 .../etap-2/runda-2/k4-tydzien-360-jasny.png        |  Bin 0 -> 71696 bytes
 .../etap-2/runda-2/k4-tydzien-390-ciemny.png       |  Bin 0 -> 93890 bytes
 .../etap-2/runda-2/k4-tydzien-390-jasny.png        |  Bin 0 -> 93138 bytes
 .../runda-2/k5-karta-zamrozenia-360-jasny.png      |  Bin 0 -> 65552 bytes
 .../runda-2/k5-karta-zamrozenia-390-ciemny.png     |  Bin 0 -> 89399 bytes
 .../runda-2/k5-karta-zamrozenia-390-jasny-en.png   |  Bin 0 -> 85775 bytes
 .../runda-2/k5-karta-zamrozenia-390-jasny.png      |  Bin 0 -> 88477 bytes
 .../petla-2/etap-2/runda-2/k5-kbuy-390-jasny.png   |  Bin 0 -> 61052 bytes
 .../petla-2/etap-2/runda-2/k5-oferta-390-jasny.png |  Bin 0 -> 88491 bytes
 .../runda-2/koniec-serii-od-wejscia-390-jasny.png  |  Bin 0 -> 93321 bytes
 docs/audyt-ux/petla-2/etap-2/runda-2/kontrola.md   |  581 +++++++++++
 docs/audyt-ux/petla-2/etap-2/runda-2/ocena.json    |    1 +
 .../runda-2/piatek-weekend-chroniony-390-jasny.png |  Bin 0 -> 93209 bytes
 .../etap-2/runda-2/prezent-baner-390-jasny.png     |  Bin 0 -> 85315 bytes
 docs/audyt-ux/petla-2/etap-2/runda-2/raport.json   |  527 ++++++++++
 docs/audyt-ux/petla-2/etap-2/runda-2/raport.md     |  260 +++++
 docs/audyt-ux/petla-2/etap-2/runda-2/regresja.md   |  131 +++
 docs/audyt-ux/petla-2/etap-2/runda-2/test.log      |   62 ++
 .../etap-3/runda-1/k1-powrot-1280-jasny.png        |  Bin 0 -> 164170 bytes
 .../petla-2/etap-3/runda-1/k1-powrot-360-jasny.png |  Bin 0 -> 70216 bytes
 .../etap-3/runda-1/k1-powrot-390-ciemny.png        |  Bin 0 -> 94477 bytes
 .../etap-3/runda-1/k1-powrot-390-jasny-en.png      |  Bin 0 -> 90346 bytes
 .../petla-2/etap-3/runda-1/k1-powrot-390-jasny.png |  Bin 0 -> 92634 bytes
 .../runda-1/k2-wracam-odtwarzacz-390-jasny.png     |  Bin 0 -> 19742 bytes
 .../etap-3/runda-1/k3-naprawa-wiersz-390-jasny.png |  Bin 0 -> 95930 bytes
 .../runda-1/k3-seria-odzyskana-390-jasny.png       |  Bin 0 -> 92234 bytes
 .../etap-3/runda-1/k4-z-maila-390-jasny.png        |  Bin 0 -> 91655 bytes
 .../etap-3/runda-1/k5-utrata-360-jasny-en.png      |  Bin 0 -> 82480 bytes
 .../etap-3/runda-1/k5-utrata-390-ciemny.png        |  Bin 0 -> 87756 bytes
 .../petla-2/etap-3/runda-1/k5-utrata-390-jasny.png |  Bin 0 -> 85439 bytes
 docs/audyt-ux/petla-2/etap-3/runda-1/kontrola.md   |  641 ++++++++++++
 docs/audyt-ux/petla-2/etap-3/runda-1/ocena.json    |    1 +
 docs/audyt-ux/petla-2/etap-3/runda-1/raport.json   |  318 ++++++
 docs/audyt-ux/petla-2/etap-3/runda-1/raport.md     |   85 ++
 docs/audyt-ux/petla-2/etap-3/runda-1/regresja.md   |   78 ++
 docs/audyt-ux/petla-2/etap-3/runda-1/test.log      |   27 +
 .../etap-3/runda-2/k1-powrot-1280-jasny.png        |  Bin 0 -> 132446 bytes
 .../petla-2/etap-3/runda-2/k1-powrot-360-jasny.png |  Bin 0 -> 61666 bytes
 .../etap-3/runda-2/k1-powrot-390-ciemny.png        |  Bin 0 -> 86620 bytes
 .../etap-3/runda-2/k1-powrot-390-jasny-en.png      |  Bin 0 -> 83056 bytes
 .../petla-2/etap-3/runda-2/k1-powrot-390-jasny.png |  Bin 0 -> 91107 bytes
 .../runda-2/k2-wracam-odtwarzacz-390-jasny.png     |  Bin 0 -> 38957 bytes
 .../etap-3/runda-2/k3-naprawa-wiersz-390-jasny.png |  Bin 0 -> 84273 bytes
 .../runda-2/k3-seria-odzyskana-390-jasny.png       |  Bin 0 -> 71751 bytes
 .../etap-3/runda-2/k4-z-maila-390-jasny.png        |  Bin 0 -> 82796 bytes
 .../etap-3/runda-2/k5-utrata-360-jasny-en.png      |  Bin 0 -> 75209 bytes
 .../etap-3/runda-2/k5-utrata-390-ciemny.png        |  Bin 0 -> 79879 bytes
 .../petla-2/etap-3/runda-2/k5-utrata-390-jasny.png |  Bin 0 -> 78077 bytes
 docs/audyt-ux/petla-2/etap-3/runda-2/kontrola.md   |  685 +++++++++++++
 docs/audyt-ux/petla-2/etap-3/runda-2/ocena.json    |    1 +
 docs/audyt-ux/petla-2/etap-3/runda-2/raport.json   |  379 +++++++
 docs/audyt-ux/petla-2/etap-3/runda-2/raport.md     |   97 ++
 docs/audyt-ux/petla-2/etap-3/runda-2/regresja.md   |   84 ++
 docs/audyt-ux/petla-2/etap-3/runda-2/test.log      |   36 +
 .../etap-3/runda-3/k1-powrot-1280-jasny.png        |  Bin 0 -> 133740 bytes
 .../petla-2/etap-3/runda-3/k1-powrot-360-jasny.png |  Bin 0 -> 62044 bytes
 .../etap-3/runda-3/k1-powrot-390-ciemny.png        |  Bin 0 -> 88527 bytes
 .../etap-3/runda-3/k1-powrot-390-jasny-en.png      |  Bin 0 -> 84131 bytes
 .../petla-2/etap-3/runda-3/k1-powrot-390-jasny.png |  Bin 0 -> 93141 bytes
 .../runda-3/k2-wracam-odtwarzacz-390-jasny.png     |  Bin 0 -> 38648 bytes
 .../runda-3/k3-naprawa-bez-karty-390-jasny.png     |  Bin 0 -> 93844 bytes
 .../etap-3/runda-3/k3-naprawa-wiersz-390-jasny.png |  Bin 0 -> 84550 bytes
 .../runda-3/k3-seria-odzyskana-390-jasny.png       |  Bin 0 -> 71938 bytes
 .../etap-3/runda-3/k4-z-maila-390-jasny.png        |  Bin 0 -> 82737 bytes
 .../etap-3/runda-3/k5-utrata-360-jasny-en.png      |  Bin 0 -> 75746 bytes
 .../etap-3/runda-3/k5-utrata-390-ciemny.png        |  Bin 0 -> 80151 bytes
 .../petla-2/etap-3/runda-3/k5-utrata-390-jasny.png |  Bin 0 -> 78322 bytes
 docs/audyt-ux/petla-2/etap-3/runda-3/kontrola.md   |  723 +++++++++++++
 docs/audyt-ux/petla-2/etap-3/runda-3/ocena.json    |    1 +
 docs/audyt-ux/petla-2/etap-3/runda-3/raport.json   |  388 +++++++
 docs/audyt-ux/petla-2/etap-3/runda-3/raport.md     |  100 ++
 docs/audyt-ux/petla-2/etap-3/runda-3/regresja.md   |   85 ++
 docs/audyt-ux/petla-2/etap-3/runda-3/test.log      |   38 +
 .../runda-1/k1-oferta-przypomnienia-360-jasny.png  |  Bin 0 -> 58939 bytes
 .../runda-1/k1-oferta-przypomnienia-390-ciemny.png |  Bin 0 -> 85607 bytes
 .../k1-oferta-przypomnienia-390-jasny-en.png       |  Bin 0 -> 83447 bytes
 .../runda-1/k1-oferta-przypomnienia-390-jasny.png  |  Bin 0 -> 87890 bytes
 .../etap-4/runda-1/k2-przyp-dzis-360-ciemny.png    |  Bin 0 -> 71194 bytes
 .../etap-4/runda-1/k2-przyp-dzis-390-jasny-en.png  |  Bin 0 -> 70802 bytes
 .../etap-4/runda-1/k2-przyp-dzis-390-jasny.png     |  Bin 0 -> 71164 bytes
 .../etap-4/runda-1/k4-kalendarz-okno-360-jasny.png |  Bin 0 -> 84411 bytes
 .../runda-1/k4-kalendarz-okno-390-ciemny.png       |  Bin 0 -> 91845 bytes
 .../runda-1/k4-kalendarz-okno-390-jasny-en.png     |  Bin 0 -> 84690 bytes
 .../etap-4/runda-1/k4-kalendarz-okno-390-jasny.png |  Bin 0 -> 90436 bytes
 .../etap-4/runda-1/k5-dzis-offline-390-jasny.png   |  Bin 0 -> 83180 bytes
 .../etap-4/runda-1/k5-instalacja-360-ciemny.png    |  Bin 0 -> 72746 bytes
 .../etap-4/runda-1/k5-instalacja-390-jasny-en.png  |  Bin 0 -> 72643 bytes
 .../etap-4/runda-1/k5-instalacja-390-jasny.png     |  Bin 0 -> 72767 bytes
 .../petla-2/etap-4/runda-1/kalendarz-roznica.diff  |   26 +
 docs/audyt-ux/petla-2/etap-4/runda-1/kontrola.md   |  785 +++++++++++++++
 docs/audyt-ux/petla-2/etap-4/runda-1/ocena.json    |    1 +
 docs/audyt-ux/petla-2/etap-4/runda-1/raport.json   |  348 +++++++
 docs/audyt-ux/petla-2/etap-4/runda-1/raport.md     |  122 +++
 docs/audyt-ux/petla-2/etap-4/runda-1/regresja.md   |   88 ++
 docs/audyt-ux/petla-2/etap-4/runda-1/test.log      |   47 +
 docs/audyt-ux/petla-2/etap-4/runda-2.log           |   64 ++
 .../runda-2/k1-oferta-przypomnienia-360-jasny.png  |  Bin 0 -> 58894 bytes
 .../runda-2/k1-oferta-przypomnienia-390-ciemny.png |  Bin 0 -> 88964 bytes
 .../k1-oferta-przypomnienia-390-jasny-en.png       |  Bin 0 -> 85636 bytes
 .../runda-2/k1-oferta-przypomnienia-390-jasny.png  |  Bin 0 -> 87407 bytes
 .../etap-4/runda-2/k2-przyp-dzis-360-ciemny.png    |  Bin 0 -> 74661 bytes
 .../etap-4/runda-2/k2-przyp-dzis-390-jasny-en.png  |  Bin 0 -> 71649 bytes
 .../etap-4/runda-2/k2-przyp-dzis-390-jasny.png     |  Bin 0 -> 75242 bytes
 .../etap-4/runda-2/k4-kalendarz-okno-360-jasny.png |  Bin 0 -> 84730 bytes
 .../runda-2/k4-kalendarz-okno-390-ciemny.png       |  Bin 0 -> 91885 bytes
 .../runda-2/k4-kalendarz-okno-390-jasny-en.png     |  Bin 0 -> 84597 bytes
 .../etap-4/runda-2/k4-kalendarz-okno-390-jasny.png |  Bin 0 -> 90486 bytes
 .../etap-4/runda-2/k5-dzis-offline-390-jasny.png   |  Bin 0 -> 77686 bytes
 .../etap-4/runda-2/k5-instalacja-360-ciemny.png    |  Bin 0 -> 74848 bytes
 .../etap-4/runda-2/k5-instalacja-390-jasny-en.png  |  Bin 0 -> 73214 bytes
 .../etap-4/runda-2/k5-instalacja-390-jasny.png     |  Bin 0 -> 75623 bytes
 .../petla-2/etap-4/runda-2/kalendarz-roznica.diff  |   26 +
 docs/audyt-ux/petla-2/etap-4/runda-2/kontrola.md   |  839 +++++++++++++++
 docs/audyt-ux/petla-2/etap-4/runda-2/ocena.json    |    1 +
 docs/audyt-ux/petla-2/etap-4/runda-2/raport.json   |  416 ++++++++
 docs/audyt-ux/petla-2/etap-4/runda-2/raport.md     |  139 +++
 docs/audyt-ux/petla-2/etap-4/runda-2/regresja.md   |  127 +++
 docs/audyt-ux/petla-2/kontrola.mjs                 |  146 +++
 .../petla-2/przed/dzis-1280-ciemny-cala.png        |  Bin 0 -> 308357 bytes
 docs/audyt-ux/petla-2/przed/dzis-1280-ciemny.png   |  Bin 0 -> 155568 bytes
 .../petla-2/przed/dzis-1280-jasny-cala.png         |  Bin 0 -> 311468 bytes
 docs/audyt-ux/petla-2/przed/dzis-1280-jasny.png    |  Bin 0 -> 158625 bytes
 .../petla-2/przed/dzis-360-ciemny-cala.png         |  Bin 0 -> 242690 bytes
 docs/audyt-ux/petla-2/przed/dzis-360-ciemny.png    |  Bin 0 -> 68459 bytes
 .../audyt-ux/petla-2/przed/dzis-360-jasny-cala.png |  Bin 0 -> 244640 bytes
 docs/audyt-ux/petla-2/przed/dzis-360-jasny.png     |  Bin 0 -> 68573 bytes
 .../petla-2/przed/dzis-390-ciemny-cala.png         |  Bin 0 -> 243368 bytes
 docs/audyt-ux/petla-2/przed/dzis-390-ciemny.png    |  Bin 0 -> 92657 bytes
 .../audyt-ux/petla-2/przed/dzis-390-jasny-cala.png |  Bin 0 -> 244832 bytes
 docs/audyt-ux/petla-2/przed/dzis-390-jasny.png     |  Bin 0 -> 94777 bytes
 docs/audyt-ux/petla-2/recenzja/etap-1.md           |  117 +++
 docs/audyt-ux/petla-2/recenzja/etap-2.md           |  119 +++
 docs/audyt-ux/petla-2/recenzja/etap-3.md           |   95 ++
 docs/audyt-ux/petla-2/recenzja/etap-4.md           |  150 +++
 docs/audyt-ux/petla-2/regresja.mjs                 |   56 +
 docs/audyt-ux/petla-2/uwagi-dla-innych.md          |   21 +
 docs/gry/test/atrapa-supabase.js                   |   61 ++
 docs/gry/test/poziomy.mjs                          |    4 +-
 docs/gry/test/przypomnienia.mjs                    |   10 +-
 docs/gry/test/ux2-etap1.mjs                        |  254 +++++
 docs/gry/test/ux2-etap2.mjs                        |  255 +++++
 docs/gry/test/ux2-etap3.mjs                        |  175 ++++
 docs/gry/test/ux2-etap4.mjs                        |  223 ++++
 docs/gry/test/ux2-lib.mjs                          |  107 ++
 i18n-en.js                                         |  131 ++-
 index.html                                         |   45 +-
 lekcja-dnia.js                                     |   21 +-
 nawyk.js                                           | 1065 ++++++++++++++++++++
 przypomnienia.js                                   |   64 +-
 supabase/functions/kalendarz/index.ts              |   56 +-
 supabase/functions/przypomnienia/logika.js         |   64 +-
 supabase/functions/przypomnienia/obsluga.ts        |    5 +-
 supabase/skrot-v55-seria-zamrozenia.sql            |  151 +++
 supabase/skrot-v56-dni-nauki.sql                   |   77 ++
 supabase/skrot-v57-kanal-zadania.sql               |  105 ++
 supabase/test/pglite.mjs                           |    2 +-
 supabase/test/v55.sql                              |  129 +++
 supabase/test/v56.sql                              |   75 ++
 supabase/test/v57.sql                              |   27 +
 sw.js                                              |   79 ++
 tests/fixtures/kalendarz-bm.ics                    |   14 +-
 tests/kalendarz.test.js                            |   27 +-
 tests/lekcja-dnia.test.js                          |   20 +
 tests/nawyk.test.js                                |  137 +++
 tests/przypomnienia.test.js                        |   55 +-
 398 files changed, 19496 insertions(+), 60 deletions(-)
```

## Zmiany w drzewie roboczym względem punktu rozgałęzienia da5c455 (z niezacommitowanymi)
```
docs/audyt-ux/petla-2/PROGRESS.md                  |   75 ++
 docs/audyt-ux/petla-2/brief.py                     |   35 +
 .../petla-2/etap-1/runda-1/dzis-17-1280-ciemny.png |  Bin 0 -> 156742 bytes
 .../petla-2/etap-1/runda-1/dzis-17-1280-jasny.png  |  Bin 0 -> 160179 bytes
 .../petla-2/etap-1/runda-1/dzis-17-360-ciemny.png  |  Bin 0 -> 67744 bytes
 .../petla-2/etap-1/runda-1/dzis-17-360-jasny.png   |  Bin 0 -> 67575 bytes
 .../petla-2/etap-1/runda-1/dzis-17-390-ciemny.png  |  Bin 0 -> 92812 bytes
 .../petla-2/etap-1/runda-1/dzis-17-390-jasny.png   |  Bin 0 -> 94565 bytes
 .../petla-2/etap-1/runda-1/dzis-19-1280-ciemny.png |  Bin 0 -> 162295 bytes
 .../petla-2/etap-1/runda-1/dzis-19-1280-jasny.png  |  Bin 0 -> 165577 bytes
 .../petla-2/etap-1/runda-1/dzis-19-360-ciemny.png  |  Bin 0 -> 71240 bytes
 .../etap-1/runda-1/dzis-19-360-jasny-en.png        |  Bin 0 -> 67596 bytes
 .../petla-2/etap-1/runda-1/dzis-19-360-jasny.png   |  Bin 0 -> 70817 bytes
 .../petla-2/etap-1/runda-1/dzis-19-390-ciemny.png  |  Bin 0 -> 90323 bytes
 .../petla-2/etap-1/runda-1/dzis-19-390-jasny.png   |  Bin 0 -> 91687 bytes
 .../etap-1/runda-1/dzis-cala-390-ciemny.png        |  Bin 0 -> 245264 bytes
 .../petla-2/etap-1/runda-1/dzis-cala-390-jasny.png |  Bin 0 -> 246912 bytes
 .../etap-1/runda-1/dzis-po-nauce-1280-ciemny.png   |  Bin 0 -> 158219 bytes
 .../etap-1/runda-1/dzis-po-nauce-1280-jasny.png    |  Bin 0 -> 161438 bytes
 .../etap-1/runda-1/dzis-po-nauce-360-ciemny.png    |  Bin 0 -> 68627 bytes
 .../etap-1/runda-1/dzis-po-nauce-360-jasny.png     |  Bin 0 -> 68359 bytes
 .../etap-1/runda-1/dzis-po-nauce-390-ciemny.png    |  Bin 0 -> 93517 bytes
 .../etap-1/runda-1/dzis-po-nauce-390-jasny.png     |  Bin 0 -> 95319 bytes
 .../runda-1/ekran-seria-plus1-390-ciemny.png       |  Bin 0 -> 74684 bytes
 .../etap-1/runda-1/ekran-seria-plus1-390-jasny.png |  Bin 0 -> 79957 bytes
 docs/audyt-ux/petla-2/etap-1/runda-1/kontrola.md   |  100 ++
 docs/audyt-ux/petla-2/etap-1/runda-1/ocena.json    |    1 +
 .../etap-1/runda-1/okno-serii-1280-jasny.png       |  Bin 0 -> 174605 bytes
 .../etap-1/runda-1/okno-serii-360-jasny.png        |  Bin 0 -> 47433 bytes
 .../etap-1/runda-1/okno-serii-390-ciemny.png       |  Bin 0 -> 62301 bytes
 .../etap-1/runda-1/okno-serii-390-jasny-en.png     |  Bin 0 -> 62244 bytes
 .../etap-1/runda-1/okno-serii-390-jasny.png        |  Bin 0 -> 61782 bytes
 docs/audyt-ux/petla-2/etap-1/runda-1/raport.json   |  475 +++++++
 docs/audyt-ux/petla-2/etap-1/runda-1/raport.md     |  129 ++
 docs/audyt-ux/petla-2/etap-1/runda-1/regresja.md   |   84 ++
 docs/audyt-ux/petla-2/etap-1/runda-1/test.log      |   39 +
 .../petla-2/etap-1/runda-2/dzis-17-1280-ciemny.png |  Bin 0 -> 158324 bytes
 .../petla-2/etap-1/runda-2/dzis-17-1280-jasny.png  |  Bin 0 -> 162293 bytes
 .../petla-2/etap-1/runda-2/dzis-17-360-ciemny.png  |  Bin 0 -> 67769 bytes
 .../petla-2/etap-1/runda-2/dzis-17-360-jasny.png   |  Bin 0 -> 68053 bytes
 .../petla-2/etap-1/runda-2/dzis-17-390-ciemny.png  |  Bin 0 -> 91380 bytes
 .../petla-2/etap-1/runda-2/dzis-17-390-jasny.png   |  Bin 0 -> 93655 bytes
 .../petla-2/etap-1/runda-2/dzis-19-1280-ciemny.png |  Bin 0 -> 167950 bytes
 .../petla-2/etap-1/runda-2/dzis-19-1280-jasny.png  |  Bin 0 -> 166775 bytes
 .../petla-2/etap-1/runda-2/dzis-19-360-ciemny.png  |  Bin 0 -> 71010 bytes
 .../etap-1/runda-2/dzis-19-360-jasny-en.png        |  Bin 0 -> 65525 bytes
 .../petla-2/etap-1/runda-2/dzis-19-360-jasny.png   |  Bin 0 -> 71395 bytes
 .../petla-2/etap-1/runda-2/dzis-19-390-ciemny.png  |  Bin 0 -> 94418 bytes
 .../petla-2/etap-1/runda-2/dzis-19-390-jasny.png   |  Bin 0 -> 96752 bytes
 .../etap-1/runda-2/dzis-cala-390-ciemny.png        |  Bin 0 -> 244832 bytes
 .../petla-2/etap-1/runda-2/dzis-cala-390-jasny.png |  Bin 0 -> 246772 bytes
 .../etap-1/runda-2/dzis-po-nauce-1280-ciemny.png   |  Bin 0 -> 159306 bytes
 .../etap-1/runda-2/dzis-po-nauce-1280-jasny.png    |  Bin 0 -> 162586 bytes
 .../etap-1/runda-2/dzis-po-nauce-360-ciemny.png    |  Bin 0 -> 68092 bytes
 .../etap-1/runda-2/dzis-po-nauce-360-jasny.png     |  Bin 0 -> 68091 bytes
 .../etap-1/runda-2/dzis-po-nauce-390-ciemny.png    |  Bin 0 -> 91474 bytes
 .../etap-1/runda-2/dzis-po-nauce-390-jasny.png     |  Bin 0 -> 93653 bytes
 .../runda-2/ekran-seria-plus1-390-ciemny.png       |  Bin 0 -> 75901 bytes
 .../etap-1/runda-2/ekran-seria-plus1-390-jasny.png |  Bin 0 -> 82885 bytes
 docs/audyt-ux/petla-2/etap-1/runda-2/kontrola.md   |  193 +++
 docs/audyt-ux/petla-2/etap-1/runda-2/ocena.json    |    1 +
 .../etap-1/runda-2/okno-serii-1280-jasny.png       |  Bin 0 -> 182863 bytes
 .../etap-1/runda-2/okno-serii-360-jasny.png        |  Bin 0 -> 49686 bytes
 .../etap-1/runda-2/okno-serii-390-ciemny.png       |  Bin 0 -> 73899 bytes
 .../etap-1/runda-2/okno-serii-390-jasny-en.png     |  Bin 0 -> 73708 bytes
 .../etap-1/runda-2/okno-serii-390-jasny.png        |  Bin 0 -> 73612 bytes
 docs/audyt-ux/petla-2/etap-1/runda-2/raport.json   |  527 ++++++++
 docs/audyt-ux/petla-2/etap-1/runda-2/raport.md     |  142 ++
 docs/audyt-ux/petla-2/etap-1/runda-2/regresja.md   |   70 +
 docs/audyt-ux/petla-2/etap-1/runda-2/test.log      |   52 +
 .../etap-1/runda-3/baner-zamrozenia-390-jasny.png  |  Bin 0 -> 99440 bytes
 .../petla-2/etap-1/runda-3/dzis-17-1280-ciemny.png |  Bin 0 -> 157801 bytes
 .../petla-2/etap-1/runda-3/dzis-17-1280-jasny.png  |  Bin 0 -> 163041 bytes
 .../petla-2/etap-1/runda-3/dzis-17-360-ciemny.png  |  Bin 0 -> 68702 bytes
 .../petla-2/etap-1/runda-3/dzis-17-360-jasny.png   |  Bin 0 -> 69011 bytes
 .../petla-2/etap-1/runda-3/dzis-17-390-ciemny.png  |  Bin 0 -> 88678 bytes
 .../petla-2/etap-1/runda-3/dzis-17-390-jasny.png   |  Bin 0 -> 89763 bytes
 .../petla-2/etap-1/runda-3/dzis-19-1280-ciemny.png |  Bin 0 -> 164454 bytes
 .../petla-2/etap-1/runda-3/dzis-19-1280-jasny.png  |  Bin 0 -> 168170 bytes
 .../petla-2/etap-1/runda-3/dzis-19-360-ciemny.png  |  Bin 0 -> 72754 bytes
 .../etap-1/runda-3/dzis-19-360-jasny-en.png        |  Bin 0 -> 68293 bytes
 .../petla-2/etap-1/runda-3/dzis-19-360-jasny.png   |  Bin 0 -> 72764 bytes
 .../petla-2/etap-1/runda-3/dzis-19-390-ciemny.png  |  Bin 0 -> 91783 bytes
 .../petla-2/etap-1/runda-3/dzis-19-390-jasny.png   |  Bin 0 -> 93056 bytes
 .../etap-1/runda-3/dzis-19-chroni-390-jasny.png    |  Bin 0 -> 93465 bytes
 .../etap-1/runda-3/dzis-cala-390-ciemny.png        |  Bin 0 -> 248899 bytes
 .../petla-2/etap-1/runda-3/dzis-cala-390-jasny.png |  Bin 0 -> 249180 bytes
 .../etap-1/runda-3/dzis-po-nauce-1280-ciemny.png   |  Bin 0 -> 160697 bytes
 .../etap-1/runda-3/dzis-po-nauce-1280-jasny.png    |  Bin 0 -> 162980 bytes
 .../etap-1/runda-3/dzis-po-nauce-360-ciemny.png    |  Bin 0 -> 69155 bytes
 .../etap-1/runda-3/dzis-po-nauce-360-jasny.png     |  Bin 0 -> 69285 bytes
 .../etap-1/runda-3/dzis-po-nauce-390-ciemny.png    |  Bin 0 -> 88402 bytes
 .../etap-1/runda-3/dzis-po-nauce-390-jasny.png     |  Bin 0 -> 90320 bytes
 .../runda-3/dzis-przerwa-28-12-390-jasny.png       |  Bin 0 -> 92686 bytes
 .../runda-3/ekran-seria-plus1-390-ciemny.png       |  Bin 0 -> 77582 bytes
 .../etap-1/runda-3/ekran-seria-plus1-390-jasny.png |  Bin 0 -> 77982 bytes
 docs/audyt-ux/petla-2/etap-1/runda-3/kontrola.md   |  273 ++++
 docs/audyt-ux/petla-2/etap-1/runda-3/ocena.json    |    1 +
 .../etap-1/runda-3/okno-serii-1280-jasny.png       |  Bin 0 -> 184376 bytes
 .../etap-1/runda-3/okno-serii-360-jasny.png        |  Bin 0 -> 49564 bytes
 .../etap-1/runda-3/okno-serii-390-ciemny.png       |  Bin 0 -> 74536 bytes
 .../etap-1/runda-3/okno-serii-390-jasny-en.png     |  Bin 0 -> 75528 bytes
 .../etap-1/runda-3/okno-serii-390-jasny.png        |  Bin 0 -> 74090 bytes
 docs/audyt-ux/petla-2/etap-1/runda-3/raport.json   |  565 ++++++++
 docs/audyt-ux/petla-2/etap-1/runda-3/raport.md     |  151 +++
 docs/audyt-ux/petla-2/etap-1/runda-3/regresja.md   |   71 +
 docs/audyt-ux/petla-2/etap-1/runda-3/test.log      |   54 +
 .../runda-4/baner-koniec-serii-390-jasny.png       |  Bin 0 -> 93294 bytes
 .../etap-1/runda-4/baner-prezent-390-jasny.png     |  Bin 0 -> 90371 bytes
 .../etap-1/runda-4/baner-zamrozenia-390-jasny.png  |  Bin 0 -> 91379 bytes
 .../petla-2/etap-1/runda-4/dzis-17-1280-ciemny.png |  Bin 0 -> 160094 bytes
 .../petla-2/etap-1/runda-4/dzis-17-1280-jasny.png  |  Bin 0 -> 163930 bytes
 .../petla-2/etap-1/runda-4/dzis-17-360-ciemny.png  |  Bin 0 -> 70952 bytes
 .../petla-2/etap-1/runda-4/dzis-17-360-jasny.png   |  Bin 0 -> 71107 bytes
 .../petla-2/etap-1/runda-4/dzis-17-390-ciemny.png  |  Bin 0 -> 90759 bytes
 .../petla-2/etap-1/runda-4/dzis-17-390-jasny.png   |  Bin 0 -> 91897 bytes
 .../petla-2/etap-1/runda-4/dzis-19-1280-ciemny.png |  Bin 0 -> 164689 bytes
 .../petla-2/etap-1/runda-4/dzis-19-1280-jasny.png  |  Bin 0 -> 166177 bytes
 .../petla-2/etap-1/runda-4/dzis-19-360-ciemny.png  |  Bin 0 -> 73092 bytes
 .../etap-1/runda-4/dzis-19-360-jasny-en.png        |  Bin 0 -> 68769 bytes
 .../petla-2/etap-1/runda-4/dzis-19-360-jasny.png   |  Bin 0 -> 72581 bytes
 .../petla-2/etap-1/runda-4/dzis-19-390-ciemny.png  |  Bin 0 -> 91930 bytes
 .../petla-2/etap-1/runda-4/dzis-19-390-jasny.png   |  Bin 0 -> 93481 bytes
 .../etap-1/runda-4/dzis-19-chroni-390-jasny.png    |  Bin 0 -> 94314 bytes
 .../etap-1/runda-4/dzis-cala-390-ciemny.png        |  Bin 0 -> 247890 bytes
 .../petla-2/etap-1/runda-4/dzis-cala-390-jasny.png |  Bin 0 -> 249492 bytes
 .../etap-1/runda-4/dzis-po-nauce-1280-ciemny.png   |  Bin 0 -> 160850 bytes
 .../etap-1/runda-4/dzis-po-nauce-1280-jasny.png    |  Bin 0 -> 162934 bytes
 .../etap-1/runda-4/dzis-po-nauce-360-ciemny.png    |  Bin 0 -> 69566 bytes
 .../etap-1/runda-4/dzis-po-nauce-360-jasny.png     |  Bin 0 -> 69077 bytes
 .../etap-1/runda-4/dzis-po-nauce-390-ciemny.png    |  Bin 0 -> 89258 bytes
 .../etap-1/runda-4/dzis-po-nauce-390-jasny.png     |  Bin 0 -> 90708 bytes
 .../runda-4/dzis-pon-rano-zamrozenia-390-jasny.png |  Bin 0 -> 94664 bytes
 .../runda-4/dzis-przerwa-28-12-390-jasny.png       |  Bin 0 -> 92611 bytes
 .../runda-4/ekran-seria-plus1-390-ciemny.png       |  Bin 0 -> 77081 bytes
 .../etap-1/runda-4/ekran-seria-plus1-390-jasny.png |  Bin 0 -> 78018 bytes
 docs/audyt-ux/petla-2/etap-1/runda-4/kontrola.md   |  354 +++++
 docs/audyt-ux/petla-2/etap-1/runda-4/ocena.json    |    1 +
 .../etap-1/runda-4/okno-serii-1280-jasny.png       |  Bin 0 -> 185293 bytes
 .../etap-1/runda-4/okno-serii-360-jasny.png        |  Bin 0 -> 50407 bytes
 .../etap-1/runda-4/okno-serii-390-ciemny.png       |  Bin 0 -> 67242 bytes
 .../etap-1/runda-4/okno-serii-390-jasny-en.png     |  Bin 0 -> 63787 bytes
 .../etap-1/runda-4/okno-serii-390-jasny.png        |  Bin 0 -> 67193 bytes
 docs/audyt-ux/petla-2/etap-1/runda-4/raport.json   |  601 +++++++++
 docs/audyt-ux/petla-2/etap-1/runda-4/raport.md     |  162 +++
 docs/audyt-ux/petla-2/etap-1/runda-4/regresja.md   |   77 ++
 docs/audyt-ux/petla-2/etap-1/runda-4/test.log      |   60 +
 .../runda-5/baner-koniec-serii-390-jasny.png       |  Bin 0 -> 94386 bytes
 .../etap-1/runda-5/baner-prezent-390-jasny.png     |  Bin 0 -> 91615 bytes
 .../etap-1/runda-5/baner-zamrozenia-390-jasny.png  |  Bin 0 -> 92545 bytes
 .../petla-2/etap-1/runda-5/dzis-17-1280-ciemny.png |  Bin 0 -> 161447 bytes
 .../petla-2/etap-1/runda-5/dzis-17-1280-jasny.png  |  Bin 0 -> 165584 bytes
 .../petla-2/etap-1/runda-5/dzis-17-360-ciemny.png  |  Bin 0 -> 71284 bytes
 .../petla-2/etap-1/runda-5/dzis-17-360-jasny.png   |  Bin 0 -> 71412 bytes
 .../petla-2/etap-1/runda-5/dzis-17-390-ciemny.png  |  Bin 0 -> 90703 bytes
 .../petla-2/etap-1/runda-5/dzis-17-390-jasny.png   |  Bin 0 -> 92682 bytes
 .../petla-2/etap-1/runda-5/dzis-19-1280-ciemny.png |  Bin 0 -> 163618 bytes
 .../petla-2/etap-1/runda-5/dzis-19-1280-jasny.png  |  Bin 0 -> 167889 bytes
 .../petla-2/etap-1/runda-5/dzis-19-360-ciemny.png  |  Bin 0 -> 73369 bytes
 .../etap-1/runda-5/dzis-19-360-jasny-en.png        |  Bin 0 -> 68989 bytes
 .../petla-2/etap-1/runda-5/dzis-19-360-jasny.png   |  Bin 0 -> 73042 bytes
 .../petla-2/etap-1/runda-5/dzis-19-390-ciemny.png  |  Bin 0 -> 92973 bytes
 .../petla-2/etap-1/runda-5/dzis-19-390-jasny.png   |  Bin 0 -> 94027 bytes
 .../etap-1/runda-5/dzis-19-chroni-390-jasny.png    |  Bin 0 -> 96002 bytes
 .../etap-1/runda-5/dzis-cala-390-ciemny.png        |  Bin 0 -> 249993 bytes
 .../petla-2/etap-1/runda-5/dzis-cala-390-jasny.png |  Bin 0 -> 251418 bytes
 .../etap-1/runda-5/dzis-po-nauce-1280-ciemny.png   |  Bin 0 -> 160501 bytes
 .../etap-1/runda-5/dzis-po-nauce-1280-jasny.png    |  Bin 0 -> 165294 bytes
 .../etap-1/runda-5/dzis-po-nauce-360-ciemny.png    |  Bin 0 -> 70499 bytes
 .../etap-1/runda-5/dzis-po-nauce-360-jasny.png     |  Bin 0 -> 70324 bytes
 .../etap-1/runda-5/dzis-po-nauce-390-ciemny.png    |  Bin 0 -> 89584 bytes
 .../etap-1/runda-5/dzis-po-nauce-390-jasny.png     |  Bin 0 -> 91294 bytes
 .../runda-5/dzis-pon-rano-zamrozenia-390-jasny.png |  Bin 0 -> 95160 bytes
 .../runda-5/dzis-przerwa-28-12-390-jasny.png       |  Bin 0 -> 93802 bytes
 .../runda-5/ekran-seria-plus1-390-ciemny.png       |  Bin 0 -> 78742 bytes
 .../etap-1/runda-5/ekran-seria-plus1-390-jasny.png |  Bin 0 -> 79678 bytes
 docs/audyt-ux/petla-2/etap-1/runda-5/kontrola.md   |  441 +++++++
 docs/audyt-ux/petla-2/etap-1/runda-5/ocena.json    |    1 +
 .../etap-1/runda-5/okno-serii-1280-jasny.png       |  Bin 0 -> 185837 bytes
 .../etap-1/runda-5/okno-serii-360-jasny.png        |  Bin 0 -> 48435 bytes
 .../etap-1/runda-5/okno-serii-390-ciemny.png       |  Bin 0 -> 73383 bytes
 .../etap-1/runda-5/okno-serii-390-jasny-en.png     |  Bin 0 -> 70415 bytes
 .../etap-1/runda-5/okno-serii-390-jasny.png        |  Bin 0 -> 73177 bytes
 .../etap-1/runda-5/okno-serii-chroni-390-jasny.png |  Bin 0 -> 72089 bytes
 docs/audyt-ux/petla-2/etap-1/runda-5/raport.json   |  635 +++++++++
 docs/audyt-ux/petla-2/etap-1/runda-5/raport.md     |  172 +++
 docs/audyt-ux/petla-2/etap-1/runda-5/regresja.md   |   77 ++
 docs/audyt-ux/petla-2/etap-1/runda-5/test.log      |   68 +
 .../petla-2/etap-2/runda-1/chroni-390-jasny.png    |  Bin 0 -> 94463 bytes
 .../etap-2/runda-1/k1-pon-2zam-po-nauce.png        |  Bin 0 -> 97454 bytes
 .../petla-2/etap-2/runda-1/k1-pon-2zam-przed.png   |  Bin 0 -> 93796 bytes
 .../etap-2/runda-1/k3-dzis-przerwa-1280-ciemny.png |  Bin 0 -> 168524 bytes
 .../etap-2/runda-1/k3-dzis-przerwa-1280-jasny.png  |  Bin 0 -> 171619 bytes
 .../etap-2/runda-1/k3-dzis-przerwa-360-ciemny.png  |  Bin 0 -> 72371 bytes
 .../runda-1/k3-dzis-przerwa-360-jasny-en.png       |  Bin 0 -> 71238 bytes
 .../etap-2/runda-1/k3-dzis-przerwa-360-jasny.png   |  Bin 0 -> 71624 bytes
 .../etap-2/runda-1/k3-dzis-przerwa-390-ciemny.png  |  Bin 0 -> 93666 bytes
 .../runda-1/k3-dzis-przerwa-390-jasny-en.png       |  Bin 0 -> 93489 bytes
 .../etap-2/runda-1/k3-dzis-przerwa-390-jasny.png   |  Bin 0 -> 93746 bytes
 .../etap-2/runda-1/k3-okno-przerwa-390-jasny.png   |  Bin 0 -> 73275 bytes
 .../etap-2/runda-1/k4-tydzien-1280-jasny.png       |  Bin 0 -> 169216 bytes
 .../etap-2/runda-1/k4-tydzien-360-jasny-en.png     |  Bin 0 -> 68356 bytes
 .../etap-2/runda-1/k4-tydzien-360-jasny.png        |  Bin 0 -> 70564 bytes
 .../etap-2/runda-1/k4-tydzien-390-ciemny.png       |  Bin 0 -> 92564 bytes
 .../etap-2/runda-1/k4-tydzien-390-jasny.png        |  Bin 0 -> 91969 bytes
 .../runda-1/k5-karta-zamrozenia-360-jasny.png      |  Bin 0 -> 65439 bytes
 .../runda-1/k5-karta-zamrozenia-390-ciemny.png     |  Bin 0 -> 89011 bytes
 .../runda-1/k5-karta-zamrozenia-390-jasny-en.png   |  Bin 0 -> 86176 bytes
 .../runda-1/k5-karta-zamrozenia-390-jasny.png      |  Bin 0 -> 88072 bytes
 .../petla-2/etap-2/runda-1/k5-kbuy-390-jasny.png   |  Bin 0 -> 61052 bytes
 .../petla-2/etap-2/runda-1/k5-oferta-390-jasny.png |  Bin 0 -> 88729 bytes
 docs/audyt-ux/petla-2/etap-2/runda-1/kontrola.md   |  516 ++++++++
 docs/audyt-ux/petla-2/etap-2/runda-1/ocena.json    |    1 +
 .../etap-2/runda-1/prezent-baner-390-jasny.png     |  Bin 0 -> 88436 bytes
 docs/audyt-ux/petla-2/etap-2/runda-1/raport.json   |  470 +++++++
 docs/audyt-ux/petla-2/etap-2/runda-1/raport.md     |  242 ++++
 docs/audyt-ux/petla-2/etap-2/runda-1/regresja.md   |   87 ++
 docs/audyt-ux/petla-2/etap-2/runda-1/test.log      |   53 +
 .../etap-2/runda-2/baner-uzupelnij-390-jasny.png   |  Bin 0 -> 92773 bytes
 .../petla-2/etap-2/runda-2/chroni-390-jasny.png    |  Bin 0 -> 95175 bytes
 .../etap-2/runda-2/k1-pon-2zam-po-nauce.png        |  Bin 0 -> 93056 bytes
 .../petla-2/etap-2/runda-2/k1-pon-2zam-przed.png   |  Bin 0 -> 94172 bytes
 .../etap-2/runda-2/k3-dzis-przerwa-1280-ciemny.png |  Bin 0 -> 177784 bytes
 .../etap-2/runda-2/k3-dzis-przerwa-1280-jasny.png  |  Bin 0 -> 180545 bytes
 .../etap-2/runda-2/k3-dzis-przerwa-360-ciemny.png  |  Bin 0 -> 72491 bytes
 .../runda-2/k3-dzis-przerwa-360-jasny-en.png       |  Bin 0 -> 70797 bytes
 .../etap-2/runda-2/k3-dzis-przerwa-360-jasny.png   |  Bin 0 -> 71875 bytes
 .../etap-2/runda-2/k3-dzis-przerwa-390-ciemny.png  |  Bin 0 -> 94004 bytes
 .../runda-2/k3-dzis-przerwa-390-jasny-en.png       |  Bin 0 -> 92963 bytes
 .../etap-2/runda-2/k3-dzis-przerwa-390-jasny.png   |  Bin 0 -> 93537 bytes
 .../etap-2/runda-2/k3-okno-przerwa-390-jasny.png   |  Bin 0 -> 63763 bytes
 .../etap-2/runda-2/k4-tydzien-1280-jasny.png       |  Bin 0 -> 182284 bytes
 .../etap-2/runda-2/k4-tydzien-360-jasny-en.png     |  Bin 0 -> 69178 bytes
 .../etap-2/runda-2/k4-tydzien-360-jasny.png        |  Bin 0 -> 71696 bytes
 .../etap-2/runda-2/k4-tydzien-390-ciemny.png       |  Bin 0 -> 93890 bytes
 .../etap-2/runda-2/k4-tydzien-390-jasny.png        |  Bin 0 -> 93138 bytes
 .../runda-2/k5-karta-zamrozenia-360-jasny.png      |  Bin 0 -> 65552 bytes
 .../runda-2/k5-karta-zamrozenia-390-ciemny.png     |  Bin 0 -> 89399 bytes
 .../runda-2/k5-karta-zamrozenia-390-jasny-en.png   |  Bin 0 -> 85775 bytes
 .../runda-2/k5-karta-zamrozenia-390-jasny.png      |  Bin 0 -> 88477 bytes
 .../petla-2/etap-2/runda-2/k5-kbuy-390-jasny.png   |  Bin 0 -> 61052 bytes
 .../petla-2/etap-2/runda-2/k5-oferta-390-jasny.png |  Bin 0 -> 88491 bytes
 .../runda-2/koniec-serii-od-wejscia-390-jasny.png  |  Bin 0 -> 93321 bytes
 docs/audyt-ux/petla-2/etap-2/runda-2/kontrola.md   |  581 +++++++++
 docs/audyt-ux/petla-2/etap-2/runda-2/ocena.json    |    1 +
 .../runda-2/piatek-weekend-chroniony-390-jasny.png |  Bin 0 -> 93209 bytes
 .../etap-2/runda-2/prezent-baner-390-jasny.png     |  Bin 0 -> 85315 bytes
 docs/audyt-ux/petla-2/etap-2/runda-2/raport.json   |  527 ++++++++
 docs/audyt-ux/petla-2/etap-2/runda-2/raport.md     |  260 ++++
 docs/audyt-ux/petla-2/etap-2/runda-2/regresja.md   |  131 ++
 docs/audyt-ux/petla-2/etap-2/runda-2/test.log      |   62 +
 .../etap-3/runda-1/k1-powrot-1280-jasny.png        |  Bin 0 -> 164170 bytes
 .../petla-2/etap-3/runda-1/k1-powrot-360-jasny.png |  Bin 0 -> 70216 bytes
 .../etap-3/runda-1/k1-powrot-390-ciemny.png        |  Bin 0 -> 94477 bytes
 .../etap-3/runda-1/k1-powrot-390-jasny-en.png      |  Bin 0 -> 90346 bytes
 .../petla-2/etap-3/runda-1/k1-powrot-390-jasny.png |  Bin 0 -> 92634 bytes
 .../runda-1/k2-wracam-odtwarzacz-390-jasny.png     |  Bin 0 -> 19742 bytes
 .../etap-3/runda-1/k3-naprawa-wiersz-390-jasny.png |  Bin 0 -> 95930 bytes
 .../runda-1/k3-seria-odzyskana-390-jasny.png       |  Bin 0 -> 92234 bytes
 .../etap-3/runda-1/k4-z-maila-390-jasny.png        |  Bin 0 -> 91655 bytes
 .../etap-3/runda-1/k5-utrata-360-jasny-en.png      |  Bin 0 -> 82480 bytes
 .../etap-3/runda-1/k5-utrata-390-ciemny.png        |  Bin 0 -> 87756 bytes
 .../petla-2/etap-3/runda-1/k5-utrata-390-jasny.png |  Bin 0 -> 85439 bytes
 docs/audyt-ux/petla-2/etap-3/runda-1/kontrola.md   |  641 ++++++++++
 docs/audyt-ux/petla-2/etap-3/runda-1/ocena.json    |    1 +
 docs/audyt-ux/petla-2/etap-3/runda-1/raport.json   |  318 +++++
 docs/audyt-ux/petla-2/etap-3/runda-1/raport.md     |   85 ++
 docs/audyt-ux/petla-2/etap-3/runda-1/regresja.md   |   78 ++
 docs/audyt-ux/petla-2/etap-3/runda-1/test.log      |   27 +
 .../etap-3/runda-2/k1-powrot-1280-jasny.png        |  Bin 0 -> 132446 bytes
 .../petla-2/etap-3/runda-2/k1-powrot-360-jasny.png |  Bin 0 -> 61666 bytes
 .../etap-3/runda-2/k1-powrot-390-ciemny.png        |  Bin 0 -> 86620 bytes
 .../etap-3/runda-2/k1-powrot-390-jasny-en.png      |  Bin 0 -> 83056 bytes
 .../petla-2/etap-3/runda-2/k1-powrot-390-jasny.png |  Bin 0 -> 91107 bytes
 .../runda-2/k2-wracam-odtwarzacz-390-jasny.png     |  Bin 0 -> 38957 bytes
 .../etap-3/runda-2/k3-naprawa-wiersz-390-jasny.png |  Bin 0 -> 84273 bytes
 .../runda-2/k3-seria-odzyskana-390-jasny.png       |  Bin 0 -> 71751 bytes
 .../etap-3/runda-2/k4-z-maila-390-jasny.png        |  Bin 0 -> 82796 bytes
 .../etap-3/runda-2/k5-utrata-360-jasny-en.png      |  Bin 0 -> 75209 bytes
 .../etap-3/runda-2/k5-utrata-390-ciemny.png        |  Bin 0 -> 79879 bytes
 .../petla-2/etap-3/runda-2/k5-utrata-390-jasny.png |  Bin 0 -> 78077 bytes
 docs/audyt-ux/petla-2/etap-3/runda-2/kontrola.md   |  685 ++++++++++
 docs/audyt-ux/petla-2/etap-3/runda-2/ocena.json    |    1 +
 docs/audyt-ux/petla-2/etap-3/runda-2/raport.json   |  379 ++++++
 docs/audyt-ux/petla-2/etap-3/runda-2/raport.md     |   97 ++
 docs/audyt-ux/petla-2/etap-3/runda-2/regresja.md   |   84 ++
 docs/audyt-ux/petla-2/etap-3/runda-2/test.log      |   36 +
 .../etap-3/runda-3/k1-powrot-1280-jasny.png        |  Bin 0 -> 133740 bytes
 .../petla-2/etap-3/runda-3/k1-powrot-360-jasny.png |  Bin 0 -> 62044 bytes
 .../etap-3/runda-3/k1-powrot-390-ciemny.png        |  Bin 0 -> 88527 bytes
 .../etap-3/runda-3/k1-powrot-390-jasny-en.png      |  Bin 0 -> 84131 bytes
 .../petla-2/etap-3/runda-3/k1-powrot-390-jasny.png |  Bin 0 -> 93141 bytes
 .../runda-3/k2-wracam-odtwarzacz-390-jasny.png     |  Bin 0 -> 38648 bytes
 .../runda-3/k3-naprawa-bez-karty-390-jasny.png     |  Bin 0 -> 93844 bytes
 .../etap-3/runda-3/k3-naprawa-wiersz-390-jasny.png |  Bin 0 -> 84550 bytes
 .../runda-3/k3-seria-odzyskana-390-jasny.png       |  Bin 0 -> 71938 bytes
 .../etap-3/runda-3/k4-z-maila-390-jasny.png        |  Bin 0 -> 82737 bytes
 .../etap-3/runda-3/k5-utrata-360-jasny-en.png      |  Bin 0 -> 75746 bytes
 .../etap-3/runda-3/k5-utrata-390-ciemny.png        |  Bin 0 -> 80151 bytes
 .../petla-2/etap-3/runda-3/k5-utrata-390-jasny.png |  Bin 0 -> 78322 bytes
 docs/audyt-ux/petla-2/etap-3/runda-3/kontrola.md   |  723 +++++++++++
 docs/audyt-ux/petla-2/etap-3/runda-3/ocena.json    |    1 +
 docs/audyt-ux/petla-2/etap-3/runda-3/raport.json   |  388 ++++++
 docs/audyt-ux/petla-2/etap-3/runda-3/raport.md     |  100 ++
 docs/audyt-ux/petla-2/etap-3/runda-3/regresja.md   |   85 ++
 docs/audyt-ux/petla-2/etap-3/runda-3/test.log      |   38 +
 .../runda-1/k1-oferta-przypomnienia-360-jasny.png  |  Bin 0 -> 58939 bytes
 .../runda-1/k1-oferta-przypomnienia-390-ciemny.png |  Bin 0 -> 85607 bytes
 .../k1-oferta-przypomnienia-390-jasny-en.png       |  Bin 0 -> 83447 bytes
 .../runda-1/k1-oferta-przypomnienia-390-jasny.png  |  Bin 0 -> 87890 bytes
 .../etap-4/runda-1/k2-przyp-dzis-360-ciemny.png    |  Bin 0 -> 71194 bytes
 .../etap-4/runda-1/k2-przyp-dzis-390-jasny-en.png  |  Bin 0 -> 70802 bytes
 .../etap-4/runda-1/k2-przyp-dzis-390-jasny.png     |  Bin 0 -> 71164 bytes
 .../etap-4/runda-1/k4-kalendarz-okno-360-jasny.png |  Bin 0 -> 84411 bytes
 .../runda-1/k4-kalendarz-okno-390-ciemny.png       |  Bin 0 -> 91845 bytes
 .../runda-1/k4-kalendarz-okno-390-jasny-en.png     |  Bin 0 -> 84690 bytes
 .../etap-4/runda-1/k4-kalendarz-okno-390-jasny.png |  Bin 0 -> 90436 bytes
 .../etap-4/runda-1/k5-dzis-offline-390-jasny.png   |  Bin 0 -> 83180 bytes
 .../etap-4/runda-1/k5-instalacja-360-ciemny.png    |  Bin 0 -> 72746 bytes
 .../etap-4/runda-1/k5-instalacja-390-jasny-en.png  |  Bin 0 -> 72643 bytes
 .../etap-4/runda-1/k5-instalacja-390-jasny.png     |  Bin 0 -> 72767 bytes
 .../petla-2/etap-4/runda-1/kalendarz-roznica.diff  |   26 +
 docs/audyt-ux/petla-2/etap-4/runda-1/kontrola.md   |  785 ++++++++++++
 docs/audyt-ux/petla-2/etap-4/runda-1/ocena.json    |    1 +
 docs/audyt-ux/petla-2/etap-4/runda-1/raport.json   |  348 +++++
 docs/audyt-ux/petla-2/etap-4/runda-1/raport.md     |  122 ++
 docs/audyt-ux/petla-2/etap-4/runda-1/regresja.md   |   88 ++
 docs/audyt-ux/petla-2/etap-4/runda-1/test.log      |   47 +
 docs/audyt-ux/petla-2/etap-4/runda-2.log           |   64 +
 .../runda-2/k1-oferta-przypomnienia-360-jasny.png  |  Bin 0 -> 58894 bytes
 .../runda-2/k1-oferta-przypomnienia-390-ciemny.png |  Bin 0 -> 88964 bytes
 .../k1-oferta-przypomnienia-390-jasny-en.png       |  Bin 0 -> 85636 bytes
 .../runda-2/k1-oferta-przypomnienia-390-jasny.png  |  Bin 0 -> 87407 bytes
 .../etap-4/runda-2/k2-przyp-dzis-360-ciemny.png    |  Bin 0 -> 74661 bytes
 .../etap-4/runda-2/k2-przyp-dzis-390-jasny-en.png  |  Bin 0 -> 71649 bytes
 .../etap-4/runda-2/k2-przyp-dzis-390-jasny.png     |  Bin 0 -> 75242 bytes
 .../etap-4/runda-2/k4-kalendarz-okno-360-jasny.png |  Bin 0 -> 84730 bytes
 .../runda-2/k4-kalendarz-okno-390-ciemny.png       |  Bin 0 -> 91885 bytes
 .../runda-2/k4-kalendarz-okno-390-jasny-en.png     |  Bin 0 -> 84597 bytes
 .../etap-4/runda-2/k4-kalendarz-okno-390-jasny.png |  Bin 0 -> 90486 bytes
 .../etap-4/runda-2/k5-dzis-offline-390-jasny.png   |  Bin 0 -> 77686 bytes
 .../etap-4/runda-2/k5-instalacja-360-ciemny.png    |  Bin 0 -> 74848 bytes
 .../etap-4/runda-2/k5-instalacja-390-jasny-en.png  |  Bin 0 -> 73214 bytes
 .../etap-4/runda-2/k5-instalacja-390-jasny.png     |  Bin 0 -> 75623 bytes
 .../petla-2/etap-4/runda-2/kalendarz-roznica.diff  |   26 +
 docs/audyt-ux/petla-2/etap-4/runda-2/kontrola.md   |  839 ++++++++++++
 docs/audyt-ux/petla-2/etap-4/runda-2/ocena.json    |    1 +
 docs/audyt-ux/petla-2/etap-4/runda-2/raport.json   |  416 ++++++
 docs/audyt-ux/petla-2/etap-4/runda-2/raport.md     |  139 ++
 docs/audyt-ux/petla-2/etap-4/runda-2/regresja.md   |  127 ++
 docs/audyt-ux/petla-2/kontrola.mjs                 |  148 +++
 .../petla-2/przed/dzis-1280-ciemny-cala.png        |  Bin 0 -> 308357 bytes
 docs/audyt-ux/petla-2/przed/dzis-1280-ciemny.png   |  Bin 0 -> 155568 bytes
 .../petla-2/przed/dzis-1280-jasny-cala.png         |  Bin 0 -> 311468 bytes
 docs/audyt-ux/petla-2/przed/dzis-1280-jasny.png    |  Bin 0 -> 158625 bytes
 .../petla-2/przed/dzis-360-ciemny-cala.png         |  Bin 0 -> 242690 bytes
 docs/audyt-ux/petla-2/przed/dzis-360-ciemny.png    |  Bin 0 -> 68459 bytes
 .../audyt-ux/petla-2/przed/dzis-360-jasny-cala.png |  Bin 0 -> 244640 bytes
 docs/audyt-ux/petla-2/przed/dzis-360-jasny.png     |  Bin 0 -> 68573 bytes
 .../petla-2/przed/dzis-390-ciemny-cala.png         |  Bin 0 -> 243368 bytes
 docs/audyt-ux/petla-2/przed/dzis-390-ciemny.png    |  Bin 0 -> 92657 bytes
 .../audyt-ux/petla-2/przed/dzis-390-jasny-cala.png |  Bin 0 -> 244832 bytes
 docs/audyt-ux/petla-2/przed/dzis-390-jasny.png     |  Bin 0 -> 94777 bytes
 docs/audyt-ux/petla-2/recenzja/etap-1.md           |  117 ++
 docs/audyt-ux/petla-2/recenzja/etap-2.md           |  119 ++
 docs/audyt-ux/petla-2/recenzja/etap-3.md           |   95 ++
 docs/audyt-ux/petla-2/recenzja/etap-4.md           |  150 +++
 docs/audyt-ux/petla-2/regresja.mjs                 |   56 +
 docs/audyt-ux/petla-2/uwagi-dla-innych.md          |   21 +
 docs/gry/test/atrapa-supabase.js                   |   74 ++
 docs/gry/test/poziomy.mjs                          |    4 +-
 docs/gry/test/przypomnienia.mjs                    |   10 +-
 docs/gry/test/ux2-etap1.mjs                        |  254 ++++
 docs/gry/test/ux2-etap2.mjs                        |  255 ++++
 docs/gry/test/ux2-etap3.mjs                        |  175 +++
 docs/gry/test/ux2-etap4.mjs                        |  223 ++++
 docs/gry/test/ux2-lib.mjs                          |  107 ++
 i18n-en.js                                         |  157 ++-
 index.html                                         |  119 +-
 lekcja-dnia.js                                     |   21 +-
 nawyk.js                                           | 1350 ++++++++++++++++++++
 przypomnienia.js                                   |   68 +-
 supabase/functions/kalendarz/index.ts              |   56 +-
 supabase/functions/przypomnienia/logika.js         |   68 +-
 supabase/functions/przypomnienia/obsluga.ts        |    5 +-
 supabase/skrot-v55-seria-zamrozenia.sql            |  151 +++
 supabase/skrot-v56-dni-nauki.sql                   |   77 ++
 supabase/skrot-v57-kanal-zadania.sql               |  168 +++
 supabase/test/pglite.mjs                           |    2 +-
 supabase/test/v55.sql                              |  129 ++
 supabase/test/v56.sql                              |   75 ++
 supabase/test/v57.sql                              |   66 +
 sw.js                                              |   79 ++
 tests/fixtures/kalendarz-bm.ics                    |   14 +-
 tests/kalendarz.test.js                            |   27 +-
 tests/lekcja-dnia.test.js                          |   20 +
 tests/nawyk.test.js                                |  137 ++
 tests/przypomnienia.test.js                        |   55 +-
 398 files changed, 19973 insertions(+), 93 deletions(-)
docs/audyt-ux/petla-2/etap-5/runda-1.log
docs/audyt-ux/petla-2/etap-5/runda-1/k1-dzis-360-ciemny.png
docs/audyt-ux/petla-2/etap-5/runda-1/k1-dzis-390-jasny-en.png
docs/audyt-ux/petla-2/etap-5/runda-1/k1-dzis-390-jasny.png
docs/audyt-ux/petla-2/etap-5/runda-1/k1-wiecej-otwarte-390-jasny.png
docs/audyt-ux/petla-2/etap-5/runda-1/k2-chipy-lekcje-360-en.png
docs/audyt-ux/petla-2/etap-5/runda-1/k2-chipy-lekcje-360-pl.png
docs/audyt-ux/petla-2/etap-5/runda-1/k3-zadania-360-ciemny.png
docs/audyt-ux/petla-2/etap-5/runda-1/k3-zadania-390-jasny-en.png
docs/audyt-ux/petla-2/etap-5/runda-1/k3-zadania-390-jasny.png
docs/audyt-ux/petla-2/etap-5/runda-1/k4-duet-360-ciemny.png
docs/audyt-ux/petla-2/etap-5/runda-1/k4-duet-390-jasny-en.png
docs/audyt-ux/petla-2/etap-5/runda-1/k4-zaproszenie-360-ciemny.png
docs/audyt-ux/petla-2/etap-5/runda-1/k4-zaproszenie-390-jasny-en.png
docs/audyt-ux/petla-2/etap-5/runda-1/k4-zaproszenie-390-jasny.png
docs/audyt-ux/petla-2/etap-5/runda-1/k5-postep-360-ciemny.png
docs/audyt-ux/petla-2/etap-5/runda-1/k5-postep-390-jasny-en.png
docs/audyt-ux/petla-2/etap-5/runda-1/k5-postep-390-jasny.png
docs/audyt-ux/petla-2/etap-5/runda-1/k5-wpisz-date-390-jasny.png
docs/audyt-ux/petla-2/etap-5/runda-1/k6-darmowe-terminy-360-ciemny.png
docs/audyt-ux/petla-2/etap-5/runda-1/k6-darmowe-terminy-390-jasny-en.png
docs/audyt-ux/petla-2/etap-5/runda-1/k6-darmowe-terminy-390-jasny.png
docs/audyt-ux/petla-2/etap-5/runda-1/k6-powtorki-pusto-360-ciemny.png
docs/audyt-ux/petla-2/etap-5/runda-1/k6-powtorki-pusto-390-jasny-en.png
docs/audyt-ux/petla-2/etap-5/runda-1/k6-powtorki-pusto-390-jasny.png
docs/audyt-ux/petla-2/etap-5/runda-1/kontrola.md
docs/audyt-ux/petla-2/etap-5/runda-1/raport.json
docs/audyt-ux/petla-2/etap-5/runda-1/raport.md
docs/audyt-ux/petla-2/etap-5/runda-1/regresja.md
docs/audyt-ux/petla-2/recenzja/etap-5.md
docs/gry/test/ux2-etap5.mjs
```

## Zmienione funkcje: index.html
| funkcja | + | − | wywołania z umów | na liście B3 pętli 2 | przykład |
|---|---|---|---|---|---|
| termIcs | 1 | 1 | 0 | tak | `const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Skrot BM//Terminy//PL", "BEGIN:` |
| viewHome | 23 | 16 | 6 | tak | `// Od góry: „Twój postęp” z najbliższymi terminami (mniejszy), potem karta 5 min i lekcje ` |
| openPhoneCal | 2 | 0 | 1 | tak | `// ux-2: opcjonalny wpis „Zdawalni · 5 min po zajęciach” z alarmem (domyślnie wyłączony, S` |
| LP_DAILY_GOAL | 1 | 1 | 0 | tak | `const LP_DAILY_GOAL = 50; // XP dziennie` |
| lpLevelBar | 3 | 1 | 2 | tak | `h("span", { class: "xp-chip" + (sk ? "" : " off"), title: sk ? "Seria: dni nauki z rzędu" ` |
| xpFlush | 2 | 0 | 1 | tak | `// ux-2: dzień nauki w progress.nd (kalendarz serii) i najlepsza seria (progress.streakBes` |
| ptsHome | 1 | 1 | 1 | tak | `!PAID() && lockedN ? h("p", { class: "muted pts-lockline" }, h("span", { text: `${lockedN}` |
| ptsDzis | 18 | 8 | 6 | tak | `const top = rows.slice(0, 3), rest = rows.slice(3);` |
| przypStan | 2 | 1 | 1 | tak | `return PZ.stanZ({ od: todayKey(), terminy: paid ? przypTerminy() : [], pow, rew, zadanie: ` |
| przypHomeCard | 5 | 3 | 3 | tak | `if (!ex) return null;` |
| setPrzyp | 2 | 1 | 0 | tak | `["powtorki", "Zaległe powtórki i rewanże", "dzisiejsza porcja i ile to minut"], ["zadanie"` |
| streakNext | 2 | 0 | 1 | tak | `// ux-2: zasady serii w nawyk.js (zamrożenia na 2 dni z rzędu, przerwy w zajęciach nie zry` |
| kStreakAlive | 1 | 1 | 1 | tak | `function kStreakAlive(st, t) { return st.d === t \|\| st.d === t - 1 \|\| (st.d === t - 2 ` |
| ldKontekst | 1 | 0 | 1 | tylko wywołanie z umowy | `przerwaDni: window.ZD_NAWYK?.przerwaDni?.() ?? 0, // ux-2: powrót po przerwie włącza „lekk` |
| ldBlock | 6 | 3 | 4 | tak | `const road = ls.get("bm-ld-droga") === "1", prof = !(S.learner && !S.learner.off && S.lear` |
| reviewHome | 4 | 3 | 2 | tak | `: h("p", { class: "big", style: "margin:0", text: has ? (tomorrow ? `Na dziś koniec. Nastę` |
| (blok mostu ux-2) | 4 | 0 | 0 | most / ładowanie pliku | `// === most ux-2 ===` |
| (linia <script> nawyk.js) | 1 | 0 | 0 | most / ładowanie pliku | `<script src="nawyk.js?v=20261117-ux2"></script>` |

## Zmienione funkcje: skrot-supabase.js
- brak zmian

## Emoji w dodanych liniach kodu
- brak

### Emoji sprzed pętli w zmienionych liniach (były już w usuniętej wersji linii)
- supabase/functions/kalendarz/index.ts: ✏ · `const title = `✏️ Mój wpis: ${e.title}${e.sid && names[e.sid] ? ` (${names[e.sid]})` : ""}`, desc = [e.note || null, `Tw`

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
### supabase/skrot-v57-kanal-zadania.sql
```

```

## Nowe polskie teksty bez pary EN
- brak

## Wynik
- ✓ wszystko w zasadach
