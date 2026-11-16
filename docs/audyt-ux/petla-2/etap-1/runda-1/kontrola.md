# Kontrola automatyczna UX-2

Gałąź: ux/2-nawyk · HEAD da5c455 · origin/main da5c455

## git diff --stat origin/main...HEAD
```
(brak commitów)
```

## Zmiany w drzewie roboczym względem origin/main (z niezacommitowanymi)
```
docs/gry/test/poziomy.mjs |  4 +++-
 i18n-en.js                | 35 ++++++++++++++++++++++++++++++++++-
 index.html                | 11 +++++++++--
 3 files changed, 46 insertions(+), 4 deletions(-)
docs/audyt-ux/petla-2/PROGRESS.md
docs/audyt-ux/petla-2/brief.py
docs/audyt-ux/petla-2/etap-1/runda-1/dzis-17-1280-ciemny.png
docs/audyt-ux/petla-2/etap-1/runda-1/dzis-17-1280-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-1/dzis-17-360-ciemny.png
docs/audyt-ux/petla-2/etap-1/runda-1/dzis-17-360-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-1/dzis-17-390-ciemny.png
docs/audyt-ux/petla-2/etap-1/runda-1/dzis-17-390-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-1/dzis-19-1280-ciemny.png
docs/audyt-ux/petla-2/etap-1/runda-1/dzis-19-1280-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-1/dzis-19-360-ciemny.png
docs/audyt-ux/petla-2/etap-1/runda-1/dzis-19-360-jasny-en.png
docs/audyt-ux/petla-2/etap-1/runda-1/dzis-19-360-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-1/dzis-19-390-ciemny.png
docs/audyt-ux/petla-2/etap-1/runda-1/dzis-19-390-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-1/dzis-cala-390-ciemny.png
docs/audyt-ux/petla-2/etap-1/runda-1/dzis-cala-390-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-1/dzis-po-nauce-1280-ciemny.png
docs/audyt-ux/petla-2/etap-1/runda-1/dzis-po-nauce-1280-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-1/dzis-po-nauce-360-ciemny.png
docs/audyt-ux/petla-2/etap-1/runda-1/dzis-po-nauce-360-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-1/dzis-po-nauce-390-ciemny.png
docs/audyt-ux/petla-2/etap-1/runda-1/dzis-po-nauce-390-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-1/ekran-seria-plus1-390-ciemny.png
docs/audyt-ux/petla-2/etap-1/runda-1/ekran-seria-plus1-390-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-1/kontrola.md
docs/audyt-ux/petla-2/etap-1/runda-1/okno-serii-1280-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-1/okno-serii-360-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-1/okno-serii-390-ciemny.png
docs/audyt-ux/petla-2/etap-1/runda-1/okno-serii-390-jasny-en.png
docs/audyt-ux/petla-2/etap-1/runda-1/okno-serii-390-jasny.png
docs/audyt-ux/petla-2/etap-1/runda-1/raport.json
docs/audyt-ux/petla-2/etap-1/runda-1/raport.md
docs/audyt-ux/petla-2/etap-1/runda-1/regresja.md
docs/audyt-ux/petla-2/etap-1/runda-1/test.log
docs/audyt-ux/petla-2/kontrola.mjs
docs/audyt-ux/petla-2/przed/dzis-1280-ciemny-cala.png
docs/audyt-ux/petla-2/przed/dzis-1280-ciemny.png
docs/audyt-ux/petla-2/przed/dzis-1280-jasny-cala.png
docs/audyt-ux/petla-2/przed/dzis-1280-jasny.png
docs/audyt-ux/petla-2/przed/dzis-360-ciemny-cala.png
docs/audyt-ux/petla-2/przed/dzis-360-ciemny.png
docs/audyt-ux/petla-2/przed/dzis-360-jasny-cala.png
docs/audyt-ux/petla-2/przed/dzis-360-jasny.png
docs/audyt-ux/petla-2/przed/dzis-390-ciemny-cala.png
docs/audyt-ux/petla-2/przed/dzis-390-ciemny.png
docs/audyt-ux/petla-2/przed/dzis-390-jasny-cala.png
docs/audyt-ux/petla-2/przed/dzis-390-jasny.png
docs/audyt-ux/petla-2/recenzja/etap-1.md
docs/audyt-ux/petla-2/regresja.mjs
docs/audyt-ux/petla-2/uwagi-dla-innych.md
docs/gry/test/ux2-etap1.mjs
docs/gry/test/ux2-lib.mjs
nawyk.js
tests/nawyk.test.js
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
