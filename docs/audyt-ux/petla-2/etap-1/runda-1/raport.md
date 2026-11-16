# UX-2 · etap 1 · runda 1

Testy etapu: **38 ✓ / 0 ✗** (docs/gry/test/ux2-etap1.mjs)

## Kryteria (asercje)
- ✓ K1 360px 17:00: pigułka szara (streak-todo) z title
- ✓ K2 360px: pierścień celu 20 px z aria-label „Cel dnia: 0/30 XP”
- ✓ K3 360px: pigułka to button ≥ 44×44
- ✓ K4 360px 17:00 ranga „Systematyczny poz. 4”: nic poza ekranem
- ✓ K1 360-jasny 19:00: streak-risk z „· do północy”, kolory --warn/--warn-soft, kontrast AA
- ✓ K4 360-jasny 19:00: nic poza ekranem
- ✓ K1 360px po nauce: streak-done, pełny płomień, pierścień 12/30
- ✓ K1 360-ciemny 19:00: streak-risk z „· do północy”, kolory --warn/--warn-soft, kontrast AA
- ✓ K4 360-ciemny 19:00: nic poza ekranem
- ✓ K1 390px 17:00: pigułka szara (streak-todo) z title
- ✓ K2 390px: pierścień celu 20 px z aria-label „Cel dnia: 0/30 XP”
- ✓ K3 390px: pigułka to button ≥ 44×44
- ✓ K4 390px 17:00 ranga „Systematyczny poz. 4”: nic poza ekranem
- ✓ K1 390-jasny 19:00: streak-risk z „· do północy”, kolory --warn/--warn-soft, kontrast AA
- ✓ K4 390-jasny 19:00: nic poza ekranem
- ✓ K1 390px po nauce: streak-done, pełny płomień, pierścień 12/30
- ✓ K6 Dziś bez „najdłuższa seria” (seria = tylko dni)
- ✓ K1 390-ciemny 19:00: streak-risk z „· do północy”, kolory --warn/--warn-soft, kontrast AA
- ✓ K4 390-ciemny 19:00: nic poza ekranem
- ✓ K1 po pierwszym XP dnia: streak-done, seria 7, dzień w progress.nd
- ✓ K2 cel dnia po 37 XP: pierścień pełny (37/30)
- ✓ K3 najlepsza seria (progress.streakBest) rośnie z serią
- ✓ K3 okno „Twoja seria”: seria 6, kalendarz 28 dni (nauka + zamrożony), „Masz 1/2” z przyciskiem do sklepu, najlepsza seria 9
- ✓ K3 każdy dzień kalendarza ma aria-label
- ✓ K3 „Kup w sklepie” otwiera Sklep
- ✓ EN okno serii: bez polskich tekstów
- ✓ K5 ekranSerii(): 7 dni z rzędu, płomień 64 px, 7 kropek z aria-label, kamień milowy 7 z konfetti
- ✓ K5 celDnia() → { xp: 12, cel: 30 }
- ✓ K5 zwykle: po przeładowaniu ekran nie wraca tego samego dnia
- ✓ K5 reduced-motion: bez konfetti i bez animacji
- ✓ K5 reduced-motion: po przeładowaniu ekran nie wraca tego samego dnia
- ✓ K5 calm: bez konfetti i bez animacji
- ✓ K5 calm: po przeładowaniu ekran nie wraca tego samego dnia
- ✓ K5 seria 5 (nie kamień milowy): bez konfetti i bez napisu kamienia
- ✓ EN pigułka 19:00: „· until midnight”, title i pierścień po angielsku, nic poza ekranem
- ✓ K1 szara pigułka: płomień bez animacji
- ✓ K5 test jednostkowy tests/nawyk.test.js
- ✓ konsola bez błędów (wszystkie stany)

## Pomiary (kontrast każdego tekstu WCAG AA, axe, cele < 44 px, poziome przewijanie, konsola)
| stan | teksty | < AA | tekst < 12 px | axe | cele < 44 px | poziome przewijanie | błędy konsoli |
|---|---|---|---|---|---|---|---|
| Dziś 17:00 seria 6 360-jasny | 8 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś 19:00 seria 6 360-jasny | 9 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś po nauce seria 7 360-jasny | 8 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś 17:00 seria 6 360-ciemny | 8 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś 19:00 seria 6 360-ciemny | 9 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś po nauce seria 7 360-ciemny | 8 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś 17:00 seria 6 390-jasny | 8 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś 19:00 seria 6 390-jasny | 9 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś po nauce seria 7 390-jasny | 8 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś 17:00 seria 6 390-ciemny | 8 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś 19:00 seria 6 390-ciemny | 9 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś po nauce seria 7 390-ciemny | 8 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś 17:00 seria 6 1280-jasny | 9 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś 19:00 seria 6 1280-jasny | 10 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś po nauce seria 7 1280-jasny | 9 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś 17:00 seria 6 1280-ciemny | 9 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś 19:00 seria 6 1280-ciemny | 10 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś po nauce seria 7 1280-ciemny | 9 | 0 | 0 | 0 | 0 | nie | 0 |
| Okno „Twoja seria” 390-jasny | 31 | 0 | 0 | 0 | 0 | nie | 0 |
| Okno „Twoja seria” 360-jasny | 31 | 0 | 0 | 0 | 0 | nie | 0 |
| Okno „Twoja seria” 390-ciemny | 31 | 0 | 0 | 0 | 0 | nie | 0 |
| Okno „Twoja seria” 1280-jasny | 31 | 0 | 0 | 0 | 0 | nie | 0 |
| Okno „Twoja seria” 390-jasny-en | 31 | 0 | 0 | 0 | 0 | nie | 0 |
| Ekran „Seria +1” 390 jasny | 17 | 0 | 0 | 0 | 0 | nie | 0 |
| Ekran „Seria +1” 390 ciemny | 16 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś 19:00 EN 360 | 9 | 0 | 0 | 0 | 0 | nie | 0 |

## Szczegóły naruszeń

## Ruch (animationName; przy reduced-motion i html.calm ma być „none”)
- zwykle: {"nw-seria-flame":"nw-pop","konfetti":true}
- reduced-motion: {"nw-seria-flame":"none","konfetti":false}
- calm: {"nw-seria-flame":"none","konfetti":false}
- pigułka zwykle (po nauce): {"#main .nw-streak .h2-flame svg":"h-flame"}
- pigułka reduced-motion: {"#main .nw-streak .h2-flame svg":"none"}
- pigułka calm: {"#main .nw-streak .h2-flame svg":"none"}

## node --test tests/nawyk.test.js
```
✔ dzień tygodnia od poniedziałku: 1.01.2026 czwartek, 6.11.2026 piątek, 2.11.2026 poniedziałek (0.4875ms)
✔ stan pigułki: szary bez nauki dziś, ryzyko od 18:00, pełny po nauce, brak bez serii (0.082708ms)
✔ cel dnia: XP tylko z dzisiejszego dnia, cel 30 (0.396084ms)
✔ dni nauki: progress.nd + ostatni dzień XP; bez nd przybliżenie z serii z pominięciem zamrożeń i przerw (0.152875ms)
✔ seriaPatch: dopisuje dzisiejszy dzień raz, trzyma 120 dni, podbija najlepszą serię (0.180791ms)
✔ kalendarz 4 tygodni: od poniedziałku 3 tygodnie wstecz, stany dni i dziś (0.129666ms)
✔ kamienie milowe 3/7/14/30/50/100 i następny (0.106083ms)
✔ ekran „Seria +1”: tylko gdy seria przedłużona dziś i jeszcze nie pokazany dziś (0.070416ms)
✔ każdy polski tekst z nawyk.js ma parę EN w i18n-en.js (exact) (6.423125ms)
ℹ tests 9
ℹ pass 9
ℹ fail 0
```

## Zrzuty
- dzis-17-360-jasny.png
- dzis-19-360-jasny.png
- dzis-po-nauce-360-jasny.png
- dzis-17-360-ciemny.png
- dzis-19-360-ciemny.png
- dzis-po-nauce-360-ciemny.png
- dzis-17-390-jasny.png
- dzis-19-390-jasny.png
- dzis-po-nauce-390-jasny.png
- dzis-cala-390-jasny.png
- dzis-17-390-ciemny.png
- dzis-19-390-ciemny.png
- dzis-po-nauce-390-ciemny.png
- dzis-cala-390-ciemny.png
- dzis-17-1280-jasny.png
- dzis-19-1280-jasny.png
- dzis-po-nauce-1280-jasny.png
- dzis-17-1280-ciemny.png
- dzis-19-1280-ciemny.png
- dzis-po-nauce-1280-ciemny.png
- okno-serii-390-jasny.png
- okno-serii-360-jasny.png
- okno-serii-390-ciemny.png
- okno-serii-1280-jasny.png
- okno-serii-390-jasny-en.png
- ekran-seria-plus1-390-jasny.png
- ekran-seria-plus1-390-ciemny.png
- dzis-19-360-jasny-en.png
