| test | ✓ | ✗ | kod |
|---|---|---|---|
| node --test tests/*.test.js | 379 | 0 | 0 |
| node supabase/test/pglite.mjs | 135 | 1 | 0 |
| node --check docs/gry/test/atrapa-supabase.js | 1 | 0 | 0 |
| node --check i18n-en.js | 1 | 0 | 0 |
| node --check nawyk.js | 1 | 0 | 0 |
| node --check tests/nawyk.test.js | 1 | 0 | 0 |
| docs/gry/test/h2-etap1.mjs | 25 | 0 | 0 |
| docs/gry/test/h2-etap2.mjs | 33 | 0 | 0 |
| docs/gry/test/h2-etap10.mjs | 24 | 0 | 0 |
| docs/gry/test/h2-etap5.mjs | 36 | 0 | 0 |
| docs/gry/test/h2-etap6.mjs | 27 | 0 | 0 |
| docs/gry/test/h2-etap4.mjs | 33 | 0 | 0 |
| docs/gry/test/poziomy.mjs | 19 | 1 | 0 |
| docs/gry/test/scalenie-zdawalni.mjs | 5 | 2 | 0 |
| docs/gry/test/h2-etap9.mjs | 92 | 0 | 0 |
| docs/gry/test/lekcja-dnia-3.mjs | 29 | 0 | 0 |
| docs/gry/test/lekcja-dnia.mjs | 0 | 1 | 1 |
| docs/gry/test/lekcja-dnia-5.mjs | 24 | 0 | 0 |
| docs/gry/test/lekcja-dnia-6.mjs | 21 | 0 | 0 |
| docs/gry/test/lekcja-dnia-4.mjs | 0 | 1 | 1 |
| docs/gry/test/dzien.mjs | 24 | 3 | 0 |
| docs/gry/test/po-zajeciach.mjs | 0 | 0 | 0 |
| docs/gry/test/przypomnienia.mjs | 60 | 1 | 1 |
| docs/gry/test/smoke.mjs | 0 | 0 | 0 |
| docs/gry/test/przygotuj-sie.mjs | 0 | 1 | 1 |
| docs/gry/test/kopie.mjs | 0 | 0 | null |
| docs/kosmetyki/test/podglad.mjs | 0 | 0 | null |
| docs/gry/test/h2-etap3.mjs (pojedynczo) | 0 | 1 | null |
| docs/gry/test/h2-etap7.mjs (pojedynczo) | 0 | 1 | null |
| docs/gry/test/h2-etap8.mjs (pojedynczo) | 0 | 1 | null |
| docs/gry/test/paczka.mjs (pojedynczo) | 0 | 0 | null |
| docs/kosmetyki/test/etap4.mjs (pojedynczo) | 0 | 0 | null |
| docs/gry/test/ux2-etap1.mjs (pojedynczo) | 2 | 1 | 1 |
| docs/gry/test/ux2-etap2.mjs (pojedynczo) | 0 | 3 | null |

Razem: 972 ✓, 18 ✗

### ✗ node supabase/test/pglite.mjs
```
✗ skrot-v12-zabezpieczenia.sql → function public.limit_wpisow() does not exist
```

### ✗ docs/gry/test/poziomy.mjs
```
✗  koniec quizu: monety w statystykach i ranga z paskiem  "Pytania 1–5: zrobione! +51 +55 XP +5 monety 5/5 z pierwszej próby 5 s czas 📊 7 Analityk poz. 7 Awans! › 45 / 700 XP do poziomu 8 ⚡ 2 145 XP 90 4 dni z rzędu · dziś ✓ Dziś: +85 XP. Możesz teraz zrobić przerwę, wszystko jest zapisane. Przerwa, wrócę później"
```

### ✗ docs/gry/test/scalenie-zdawalni.mjs
```
✗ D: pierwsze logowanie zapisuje rocznik w profilu [{"id":"wefiz-bm-1-st-2026","wybrany":true},["nauka_rocznik_moj","nauka_roczniki_lista","nauka_rocznik_ustaw"]]
✗ D: kolejne wejście tylko czyta (bez drugiego zapisu) ["nauka_rocznik_moj","nauka_roczniki_lista"]
```

### ✗ docs/gry/test/lekcja-dnia.mjs
```
  name: 'TimeoutError'
```

### ✗ docs/gry/test/lekcja-dnia-4.mjs
```
  name: 'TimeoutError'
```

### ✗ docs/gry/test/dzien.mjs
```
✗ D: EN 375: How much time / One task / Rematches, bez polskich znaków "NOW ZRÓB TO · REVIEWS TODAY\nReview 4 flashcards\n\nIncluding 1 rematch. About 1 min.\n\nStart review\n→\n🎯\nOne task\nRematch · 1 question\nHow much time have you got today?\n5 min\n15 min\n30 min\n60 min\n⚔️\nRematches: 1 question\napprox. 2 min\n›\n🔁\nReview 3 flashcards\napprox. 1 min\n›\n📖\nTopic: PKB i inflacja\napprox. 15 min\n›\n\nEverything for today fits: about 18 min."
✗ D: EN 1280: How much time / One task / Rematches, bez polskich znaków "NOW ZRÓB TO · REVIEWS TODAY\nReview 4 flashcards\n\nIncluding 1 rematch. About 1 min.\n\nStart review\n→\n🎯\nOne task\nRematch · 1 question\nHow much time have you got today?\n5 min\n15 min\n30 min\n60 min\n⚔️\nRematches: 1 question\napprox. 2 min\n›\n🔁\nReview 3 flashcards\napprox. 1 min\n›\n📖\nTopic: PKB i inflacja\napprox. 15 min\n›\n\nEverything for today fits: about 18 min."
✗ Dotyk: przyciski ≥ 44 px [62,36,36,36,36,64,64,64]
```

### ✗ docs/gry/test/przypomnienia.mjs
```
✗ A: stan zapisany: termin starosty z id, za 3 dni, 8 dni liczb 
```

### ✗ docs/gry/test/przygotuj-sie.mjs
```
TypeError: Cannot read properties of undefined (reading 'ochrona-wlasnosci-intelektualnej-W')
```

### ✗ docs/gry/test/h2-etap3.mjs (pojedynczo)
```
✗ jasny-375: moneta i płomień jako SVG (bez emoji) "Cześć\n\nDziś piątek, tydzień nieparzysty.\n\n🌱\nŚwieżak\n›\n0\ndni\n0/30 XP\nTen tydzień: 0/4 dni"
TIMEOUT
```

### ✗ docs/gry/test/h2-etap7.mjs (pojedynczo)
```
✗ jasny-375: karta „Najbliższe” 3D, licznik dni w kółku, czytelna ""
TIMEOUT
```

### ✗ docs/gry/test/h2-etap8.mjs (pojedynczo)
```
✗ jasny: ikony gier jako klocki 3D (dół 5 px) w różnych kolorach []
  name: 'TimeoutError'
TIMEOUT
```

### ✗ docs/gry/test/ux2-etap1.mjs (pojedynczo)
```
✗ K1 360px 17:00: pigułka szara (streak-todo) z title i słowami „· dziś jeszcze nie” {"tag":"BUTTON","cls":"xp-chip nw-streak streak-none off","title":"Ucz się dziś, żeby zacząć serię","txt":"0 dni 0/30 XP","w":328,"h":44,"right":344,"ring":{"label":"Cel dnia: 0/30 XP","role":"img","w":20,"h":20},"flameFilter":"grayscale(1)","bg":"rgb(255, 255, 255)","color":"rgb(62, 80, 70)"}
page.evaluate: TypeError: Cannot read properties of null (reading 'getBoundingClientRect')
```

### ✗ docs/gry/test/ux2-etap2.mjs (pojedynczo)
```
✗ K1 weekend + 2 zamrożenia: seria trwa, szary płomień „10 dni” {"cls":"xp-chip nw-streak streak-none off","txt":"0 dni 0/30 XP","title":"Ucz się dziś, żeby zacząć serię"}
✗ K1 po nauce: seria 11, zamrożone sob. i niedz. (jedno wywołanie bazy z 2 dniami), zapas 0 {"s":{"streak":{"d":312,"n":1},"zam":{"ma":0,"max":2,"dni":[]},"ux2":[]},"b2":{"cls":"xp-chip nw-streak streak-done","txt":"1 dzień · dziś ✓ 12/30 XP","title":"Dziś już się uczysz. Seria bezpieczna."}}
✗ K1 baner „Zamrożenia uratowały serię … zostało 0/2” nad dolnym paskiem (ikona SVG, bez emoji) ""
TIMEOUT
```
## Porównanie czerwonych testów z czystym origin/main (kopia `git archive origin/main`, port 8822)
- `poziomy.mjs`: na `origin/main` te same 3 ✗ (asercje szukają emoji 🪙/🔥, które H2 zastąpiło ikonami SVG; „koniec quizu” to ekran odtwarzacza – pętla 3). Asercję „Dziś: ranga…” poprawiam osobnym commitem `test:` (ikony SVG + „poz. N” tylko ≥ 420 px, kryterium K4 etapu 1). Czwarty ✗ („+1 🪙 od razu”) tylko przy 3 testach naraz (obciążenie); osobno ✓.
- `scalenie-zdawalni.mjs`: na `origin/main` te same 2 ✗ (rocznik w profilu, `nauka_rocznik_ustaw`) – poza tą pętlą, zapis w uwagi-dla-innych.md.
- `dzien.mjs`: na `origin/main` te same 3 ✗ („Teraz zrób to” bez EN, przyciski 36 px w „Ile masz dziś czasu?” – stare karty Dziś przy `bm-ld-flag=0`).
- `paczka.mjs`, `kosmetyki/etap4.mjs`: przy 3 testach naraz przekroczony czas; osobno `paczka.mjs` 58/58 ✓; `kosmetyki/etap4.mjs` TimeoutError także na `origin/main`.
- PGlite: `✗ skrot-v12-zabezpieczenia.sql → limit_wpisow()` – oczekiwany (opis w `supabase/test/pglite.mjs`).

## Powtórka pojedynczo (komputer przeciążony w trakcie regresji: load ≈ 7, cztery inne pętle testowały równolegle; testy przerwane z kodem null/Timeout)
- lekcja-dnia: 30 ✓ 0 ✗ 
- lekcja-dnia-4: 103 ✓ 0 ✗ 
- przypomnienia: 61 ✓ 0 ✗ 
- przygotuj-sie: 54 ✓ 0 ✗ 
- h2-etap3: 48 ✓ 0 ✗ 
- h2-etap7: 47 ✓ 0 ✗ 
- h2-etap8: 85 ✓ 0 ✗ 
- ux2-etap1: 67 ✓ 0 ✗ 
- ux2-etap2: 61 ✓ 0 ✗ 
