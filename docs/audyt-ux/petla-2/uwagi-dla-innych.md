# Uwagi pętli UX-2 dla innych pętli

## Pętla 3 (lekcja)
- „najdłuższa seria” to seria dobrych odpowiedzi, a nie dni — na ekranach końca nadal to samo słowo co seria dni (C1 P0 pkt 4): `index.html` ok. 11236 (`lpSrcDone`/koniec lekcji: `lpStat(st.best, "najdłuższa seria")`), 12791 (koniec quizu), 19945 (`done()` źródła „ld”). Propozycja z audytu: PL „najlepsza passa” / EN „best run”, a `🔥 x{n}` w odtwarzaczu (ok. 10404) → `⚡ x{n}` (u nas SVG `bolt`). Płomień tylko dla dni.
- Ekran końca: `ZD_NAWYK.ekranSerii()` zwraca węzeł tylko przy pierwszej nauce dnia (raz dziennie, `skrot-streak-shown`); w tej samej karcie przeglądarki kolejne wywołania tego samego dnia rysują go ponownie bez konfetti, po przeładowaniu `null`. `ZD_NAWYK.celDnia()` → `{ xp, cel }` (cel 30).

## Pętla 4 (wygląd)
- `GTEST` (przewodnik) ok. 18759: „najdłuższa seria” w statystykach testu przewodnika — ta sama niejasność co wyżej.
- `docs/gry/test/poziomy.mjs` „koniec quizu: monety w statystykach i ranga z paskiem” czerwone też na `origin/main` (szuka emoji 🪙 na ekranie końca, H2 ma SVG) – ekran końca odtwarzacza, pętla 3.

## Pętla 1 / ogólne
- `docs/gry/test/scalenie-zdawalni.mjs` D (rocznik w profilu, `nauka_rocznik_ustaw`) i `dzien.mjs` (stare karty Dziś, EN „Teraz zrób to”, przyciski 36 px) czerwone też na `origin/main`.

## Pętla 5 (rangi) / pętla 4 (wygląd)
- Odznaka rangi poziomu 4 („Systematyczny”) ma ikonę kalendarza z liczbą „17”; obok „Dziś piątek…” wygląda jak data (recenzent UX-2 etap 1, runda 3). `lvBadge` / ikony rang to nie obszar pętli 2.
