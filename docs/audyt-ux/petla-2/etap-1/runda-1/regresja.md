| test | ✓ | ✗ | kod |
|---|---|---|---|
| node --test tests/*.test.js | 377 | 0 | 0 |
| node supabase/test/pglite.mjs | 129 | 1 | 0 |
| node --check i18n-en.js | 1 | 0 | 0 |
| node --check nawyk.js | 1 | 0 | 0 |
| node --check tests/nawyk.test.js | 1 | 0 | 0 |
| docs/gry/test/h2-etap1.mjs | 25 | 0 | 0 |
| docs/gry/test/h2-etap2.mjs | 33 | 0 | 0 |
| docs/gry/test/h2-etap10.mjs | 24 | 0 | 0 |
| docs/gry/test/h2-etap5.mjs | 36 | 0 | 0 |
| docs/gry/test/h2-etap6.mjs | 27 | 0 | 0 |
| docs/gry/test/h2-etap3.mjs | 48 | 0 | 0 |
| docs/gry/test/h2-etap4.mjs | 33 | 0 | 0 |
| docs/gry/test/h2-etap9.mjs | 92 | 0 | 0 |
| docs/gry/test/h2-etap8.mjs | 85 | 0 | 0 |
| docs/gry/test/poziomy.mjs | 16 | 4 | 0 |
| docs/gry/test/h2-etap7.mjs | 47 | 0 | 0 |
| docs/gry/test/scalenie-zdawalni.mjs | 5 | 2 | 0 |
| docs/gry/test/lekcja-dnia-3.mjs | 29 | 0 | 0 |
| docs/gry/test/lekcja-dnia.mjs | 30 | 0 | 0 |
| docs/gry/test/lekcja-dnia-5.mjs | 24 | 0 | 0 |
| docs/gry/test/lekcja-dnia-6.mjs | 21 | 0 | 0 |
| docs/gry/test/paczka.mjs | 0 | 1 | 1 |
| docs/gry/test/przypomnienia.mjs | 61 | 0 | 0 |
| docs/gry/test/po-zajeciach.mjs | 0 | 0 | 0 |
| docs/gry/test/dzien.mjs | 24 | 3 | 0 |
| docs/gry/test/przygotuj-sie.mjs | 54 | 0 | 0 |
| docs/gry/test/smoke.mjs | 0 | 0 | 0 |
| docs/kosmetyki/test/etap4.mjs | 6 | 1 | 1 |
| docs/gry/test/kopie.mjs | 20 | 0 | 0 |
| docs/kosmetyki/test/podglad.mjs | 32 | 0 | 0 |
| docs/gry/test/lekcja-dnia-4.mjs | 103 | 0 | 0 |
| docs/gry/test/ux2-etap1.mjs | 31 | 1 | 1 |

Razem: 1415 ✓, 13 ✗

### ✗ node supabase/test/pglite.mjs
```
✗ skrot-v12-zabezpieczenia.sql → function public.limit_wpisow() does not exist
```

### ✗ docs/gry/test/poziomy.mjs
```
✗  390 Dziś: ranga Ogarnięty, poz. 5, monety 85, seria 4  "✅ Ogarnięty › 85 4 dni"
✗  1280 Dziś: ranga Ogarnięty, poz. 5, monety 85, seria 4  "✅ Ogarnięty poz. 5 › 85 4 dni"
✗  390 quiz: dobra odpowiedź → saldo 85 → 86 od razu i „+1 🪙” przy monetach  {"c0":"85","c1":"85","fl":0}
✗  koniec quizu: monety w statystykach i ranga z paskiem  "Pytania 1–5: zrobione! +52 +55 XP +5 monety 5/5 z pierwszej próby 5 s czas 📊 7 Analityk poz. 7 Awans! › 45 / 700 XP do poziomu 8 ⚡ 2 145 XP 90 4 dni z rzędu Dziś: +85 XP. Możesz teraz zrobić przerwę, wszystko jest zapisane. Przerwa, wrócę później"
```

### ✗ docs/gry/test/scalenie-zdawalni.mjs
```
✗ D: pierwsze logowanie zapisuje rocznik w profilu [{"id":"wefiz-bm-1-st-2026","wybrany":true},["nauka_rocznik_moj","nauka_roczniki_lista","nauka_rocznik_ustaw"]]
✗ D: kolejne wejście tylko czyta (bez drugiego zapisu) ["nauka_rocznik_moj","nauka_roczniki_lista"]
```

### ✗ docs/gry/test/paczka.mjs
```
  name: 'Error'
```

### ✗ docs/gry/test/dzien.mjs
```
✗ D: EN 375: How much time / One task / Rematches, bez polskich znaków "NOW ZRÓB TO · REVIEWS TODAY\nReview 4 flashcards\n\nIncluding 1 rematch. About 1 min.\n\nStart review\n→\n🎯\nOne task\nRematch · 1 question\nHow much time have you got today?\n5 min\n15 min\n30 min\n60 min\n⚔️\nRematches: 1 question\napprox. 2 min\n›\n🔁\nReview 3 flashcards\napprox. 1 min\n›\n📖\nTopic: PKB i inflacja\napprox. 15 min\n›\n\nEverything for today fits: about 18 min."
✗ D: EN 1280: How much time / One task / Rematches, bez polskich znaków "NOW ZRÓB TO · REVIEWS TODAY\nReview 4 flashcards\n\nIncluding 1 rematch. About 1 min.\n\nStart review\n→\n🎯\nOne task\nRematch · 1 question\nHow much time have you got today?\n5 min\n15 min\n30 min\n60 min\n⚔️\nRematches: 1 question\napprox. 2 min\n›\n🔁\nReview 3 flashcards\napprox. 1 min\n›\n📖\nTopic: PKB i inflacja\napprox. 15 min\n›\n\nEverything for today fits: about 18 min."
✗ Dotyk: przyciski ≥ 44 px [62,36,36,36,36,64,64,64]
```

### ✗ docs/kosmetyki/test/etap4.mjs
```
  name: 'TimeoutError'
```

### ✗ docs/gry/test/ux2-etap1.mjs
```
  name: 'TimeoutError'
```

## Porównanie czerwonych testów z czystym origin/main (kopia `git archive origin/main`, port 8822)
- `poziomy.mjs`: na `origin/main` te same 3 ✗ (asercje szukają emoji 🪙/🔥, które H2 zastąpiło ikonami SVG; „koniec quizu” to ekran odtwarzacza – pętla 3). Asercję „Dziś: ranga…” poprawiam osobnym commitem `test:` (ikony SVG + „poz. N” tylko ≥ 420 px, kryterium K4 etapu 1). Czwarty ✗ („+1 🪙 od razu”) tylko przy 3 testach naraz (obciążenie); osobno ✓.
- `scalenie-zdawalni.mjs`: na `origin/main` te same 2 ✗ (rocznik w profilu, `nauka_rocznik_ustaw`) – poza tą pętlą, zapis w uwagi-dla-innych.md.
- `dzien.mjs`: na `origin/main` te same 3 ✗ („Teraz zrób to” bez EN, przyciski 36 px w „Ile masz dziś czasu?” – stare karty Dziś przy `bm-ld-flag=0`).
- `paczka.mjs`, `kosmetyki/etap4.mjs`: przy 3 testach naraz przekroczony czas; osobno `paczka.mjs` 58/58 ✓; `kosmetyki/etap4.mjs` TimeoutError także na `origin/main`.
- PGlite: `✗ skrot-v12-zabezpieczenia.sql → limit_wpisow()` – oczekiwany (opis w `supabase/test/pglite.mjs`).
