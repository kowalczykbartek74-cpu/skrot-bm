# UX-2 · etap 1 · runda 3

Testy etapu: **53 ✓ / 0 ✗** (docs/gry/test/ux2-etap1.mjs)

## Kryteria (asercje)
- ✓ K1 360px 17:00: pigułka szara (streak-todo) z title
- ✓ K2 360px: pierścień celu 20 px z aria-label „Cel dnia: 0/30 XP”
- ✓ K3 360px: pigułka to button ≥ 44×44
- ✓ K4 360px 17:00: wiersz 1 ranga (z nazwą) + monety, wiersz 2 pasek serii na całą szerokość z celem „0/30”
- ✓ K4 360px 17:00 ranga „Systematyczny poz. 4”: nic poza ekranem
- ✓ K1 360-jasny 19:00: streak-risk z „· do północy”, kolory --warn/--warn-soft, kontrast AA
- ✓ K1 360-jasny 19:00: klepsydra przy „do północy” (stan czytelny bez koloru)
- ✓ K4 360-jasny 19:00: nic poza ekranem
- ✓ K1 360px po nauce: streak-done, pełny płomień, pierścień 12/30
- ✓ K1 360-ciemny 19:00: streak-risk z „· do północy”, kolory --warn/--warn-soft, kontrast AA
- ✓ K1 360-ciemny 19:00: klepsydra przy „do północy” (stan czytelny bez koloru)
- ✓ K4 360-ciemny 19:00: nic poza ekranem
- ✓ K1 390px 17:00: pigułka szara (streak-todo) z title
- ✓ K2 390px: pierścień celu 20 px z aria-label „Cel dnia: 0/30 XP”
- ✓ K3 390px: pigułka to button ≥ 44×44
- ✓ K4 390px 17:00: wiersz 1 ranga (z nazwą) + monety, wiersz 2 pasek serii na całą szerokość z celem „0/30”
- ✓ K4 390px 17:00 ranga „Systematyczny poz. 4”: nic poza ekranem
- ✓ K1 390-jasny 19:00: streak-risk z „· do północy”, kolory --warn/--warn-soft, kontrast AA
- ✓ K1 390-jasny 19:00: klepsydra przy „do północy” (stan czytelny bez koloru)
- ✓ K4 390-jasny 19:00: nic poza ekranem
- ✓ K1 390px po nauce: streak-done, pełny płomień, pierścień 12/30
- ✓ K6 Dziś bez „najdłuższa seria” (seria = tylko dni)
- ✓ K1 390-ciemny 19:00: streak-risk z „· do północy”, kolory --warn/--warn-soft, kontrast AA
- ✓ K1 390-ciemny 19:00: klepsydra przy „do północy” (stan czytelny bez koloru)
- ✓ K4 390-ciemny 19:00: nic poza ekranem
- ✓ K1 po pierwszym XP dnia: streak-done, seria 7, dzień w progress.nd
- ✓ K2 cel dnia po 37 XP: pierścień pełny (37/30)
- ✓ K3 najlepsza seria (progress.streakBest) rośnie z serią
- ✓ K3 okno „Twoja seria”: seria 6, kalendarz 28 dni (nauka + zamrożony), „Masz 1/2” z przyciskiem do sklepu, najlepsza seria 9
- ✓ K3 kalendarz zgadza się z liczbą serii (dni nauki w bieżącej serii = 6), choć progress.nd nie zna jednego dnia
- ✓ K3 legenda: nauka, zamrożony, przerwa, bez nauki, dziś do zrobienia; jedna linia zasad
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
- ✓ K5 ciemny: dzisiejsza kropka widoczna (kolor nauki, pełna)
- ✓ K1 19:00 z 1 zamrożeniem: „· chroni zamrożenie” (bez „do północy” i bez pomarańczowego alarmu)
- ✓ K3 zasady działają jak w oknie: poniedziałek po weekendzie z 2 zamrożeniami seria 10 żyje, po nauce 11, oba dni zamrożone, baner bez emoji
- ✓ K3 ten sam weekend z 1 zamrożeniem: seria spada do 0 (zgodnie z zasadą „do 2 dni”)
- ✓ K3 przerwa świąteczna 28.12: „8 dni · przerwa, seria czeka”, bez alarmu
- ✓ K1 17:59 → 18:01 bez przeładowania: todo → risk (odświeżenie co minutę i po powrocie do karty)
- ✓ K1 telefon w Nowym Jorku (13:00 u niego): todo — godzina i granica dnia w tej samej strefie
- ✓ EN pigułka 19:00: „· until midnight”, title i pierścień po angielsku, nic poza ekranem
- ✓ K1 szara pigułka: płomień bez animacji
- ✓ K5 test jednostkowy tests/nawyk.test.js
- ✓ konsola bez błędów (wszystkie stany)

## Pomiary (kontrast każdego tekstu WCAG AA, axe, cele < 44 px, poziome przewijanie, konsola)
| stan | teksty | < AA | tekst < 12 px | axe | cele < 44 px | poziome przewijanie | błędy konsoli |
|---|---|---|---|---|---|---|---|
| Dziś 17:00 seria 6 360-jasny | 9 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś 19:00 seria 6 360-jasny | 10 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś po nauce seria 7 360-jasny | 9 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś 17:00 seria 6 360-ciemny | 9 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś 19:00 seria 6 360-ciemny | 10 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś po nauce seria 7 360-ciemny | 9 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś 17:00 seria 6 390-jasny | 9 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś 19:00 seria 6 390-jasny | 10 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś po nauce seria 7 390-jasny | 9 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś 17:00 seria 6 390-ciemny | 9 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś 19:00 seria 6 390-ciemny | 10 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś po nauce seria 7 390-ciemny | 9 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś 17:00 seria 6 1280-jasny | 10 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś 19:00 seria 6 1280-jasny | 11 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś po nauce seria 7 1280-jasny | 10 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś 17:00 seria 6 1280-ciemny | 10 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś 19:00 seria 6 1280-ciemny | 11 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś po nauce seria 7 1280-ciemny | 10 | 0 | 0 | 0 | 0 | nie | 0 |
| Okno „Twoja seria” 390-jasny | 34 | 0 | 0 | 0 | 0 | nie | 0 |
| Okno „Twoja seria” 360-jasny | 34 | 0 | 0 | 0 | 0 | nie | 0 |
| Okno „Twoja seria” 390-ciemny | 34 | 0 | 0 | 0 | 0 | nie | 0 |
| Okno „Twoja seria” 1280-jasny | 34 | 0 | 0 | 0 | 0 | nie | 0 |
| Okno „Twoja seria” 390-jasny-en | 34 | 0 | 0 | 0 | 0 | nie | 0 |
| Ekran „Seria +1” 390 jasny | 19 | 0 | 0 | 0 | 0 | nie | 0 |
| Ekran „Seria +1” 390 ciemny | 18 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś 19:00 chroni zamrożenie 390 | 10 | 0 | 0 | 0 | 0 | nie | 0 |
| Baner zamrożeń 390 | 1 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś w przerwie 28.12 390 | 10 | 0 | 0 | 0 | 0 | nie | 0 |
| Dziś 19:00 EN 360 | 10 | 0 | 0 | 0 | 0 | nie | 0 |

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
✔ dzień tygodnia od poniedziałku: 1.01.2026 czwartek, 6.11.2026 piątek, 2.11.2026 poniedziałek (0.666917ms)
✔ stan pigułki: szary bez nauki dziś, ryzyko od 18:00, pełny po nauce, brak bez serii (0.564416ms)
✔ zasady serii: weekend na 2 zamrożeniach, 1 zamrożenie nie starczy, przerwa nie zrywa i nie dodaje dni (1.295917ms)
✔ cel dnia: XP tylko z dzisiejszego dnia, cel 30 (0.10875ms)
✔ dni nauki: progress.nd + ostatni dzień XP; bez nd przybliżenie z serii z pominięciem zamrożeń i przerw (0.15325ms)
✔ seriaPatch: dopisuje dzisiejszy dzień raz, trzyma 120 dni, podbija najlepszą serię (0.127958ms)
✔ kalendarz 4 tygodni: od poniedziałku 3 tygodnie wstecz, stany dni i dziś (0.128666ms)
✔ kamienie milowe 3/7/14/30/50/100 i następny (0.106833ms)
✔ ekran „Seria +1”: tylko gdy seria przedłużona dziś i jeszcze nie pokazany dziś (0.093708ms)
✔ każdy polski tekst z nawyk.js ma parę EN w i18n-en.js (exact) (6.297542ms)
ℹ tests 10
ℹ pass 10
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
- dzis-19-chroni-390-jasny.png
- baner-zamrozenia-390-jasny.png
- dzis-przerwa-28-12-390-jasny.png
- dzis-19-360-jasny-en.png
