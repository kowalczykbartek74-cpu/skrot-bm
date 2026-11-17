# Pętla UX-1 · etap 3 · runda 1

Etap 3: powitanie próby z przełącznikiem „Przypomnij mi mailem dzień przed końcem próby” (domyślnie wyłączony), SQL v53 i mail „próba” w funkcji przypomnienia (testy w test.log), ?plan=1 → wybór planu, jednorazowy ekran „Twoje 3 dni minęły” (postęp, najbliższe kolokwium, plany z 199 zł na górze) i pasek zakupu nad panelem przy kolejnych wejściach.

Pomiary: axe-core (color-contrast, target-size), własny pomiar kontrastu każdego widocznego tekstu w `#login`, `#main`, `#layer` (tekst ≥ 4,5:1, duży ≥ 3:1; tło złożone z przodków, gradient = najgorszy przystanek; teksty < 12 px też na liście), cele dotyku < 44 px (faktyczne pole), poziome przewijanie, CLS (PerformanceObserver layout-shift), błędy konsoli, `undefined/null/NaN` w tekście ekranu. Zegar atrapy: 17.11.2026 10:00 (chyba że scenariusz mówi inaczej).

| przypadek | scrollY | CLS | poziome przewijanie | sprawdzone teksty | teksty < AA / < 12 px | axe | cele < 44 px (w tym linki w tekście) | undefined/null | błędy konsoli | elementy w 1. ekranie |
|---|---|---|---|---|---|---|---|---|---|---|
| powitanie-proby-360-jasny | 0 | 0.0102 | nie | 15 | 0 | color-contrast: 1 | 0 (0) | nie | 0 | przełącznik: tak (325–373, h 48) |
| powitanie-proby-360-ciemny | 13 | 0.0102 | nie | 15 | 0 | color-contrast: 1 | 0 (0) | nie | 0 | przełącznik: tak (325–373, h 48) |
| powitanie-proby-390-jasny | 13 | 0.0059 | nie | 15 | 0 | color-contrast: 1 | 0 (0) | nie | 0 | przełącznik: tak (326–374, h 48) |
| powitanie-proby-390-jasny-en | 0 | 0.0059 | nie | 15 | 0 | color-contrast: 1 | 0 (0) | nie | 0 | przełącznik: tak (350–398, h 48) |
| powitanie-proby-390-ciemny | 0 | 0.0059 | nie | 15 | 0 | color-contrast: 1 | 0 (0) | nie | 0 | przełącznik: tak (326–374, h 48) |
| powitanie-proby-1280-jasny | 0 | 0 | nie | 15 | 0 | 0 | 0 (0) | nie | 0 | przełącznik: tak (338–386, h 48) |
| powitanie-proby-1280-ciemny | 0 | 0 | nie | 15 | 0 | 0 | 0 (0) | nie | 0 | przełącznik: tak (338–386, h 48) |
| koniec-proby-360-jasny | 0 | 0.0102 | nie | 20 | 0 | 0 | 0 (0) | nie | 0 | ekran: tak (77–640, h 563); plan 199 zł: tak (381–521, h 141) |
| koniec-proby-360-ciemny | 0 | 0.0102 | nie | 20 | 0 | 0 | 0 (0) | nie | 0 | ekran: tak (77–640, h 563); plan 199 zł: tak (381–521, h 141) |
| koniec-proby-390-jasny | 0 | 0.0059 | nie | 20 | 0 | 0 | 0 (0) | nie | 0 | ekran: tak (101–844, h 743); plan 199 zł: tak (381–522, h 141) |
| koniec-proby-390-jasny-en | 0 | 0.0059 | nie | 20 | 0 | 0 | 0 (0) | nie | 0 | ekran: tak (113–844, h 731); plan 199 zł: tak (393–512, h 119) |
| koniec-proby-390-ciemny | 0 | 0.0059 | nie | 20 | 0 | 0 | 0 (0) | nie | 0 | ekran: tak (101–844, h 743); plan 199 zł: tak (381–522, h 141) |
| koniec-proby-1280-jasny | 0 | 0 | nie | 20 | 0 | 0 | 0 (0) | nie | 0 | ekran: tak (100–800, h 700); plan 199 zł: tak (364–483, h 119) |
| koniec-proby-1280-ciemny | 0 | 0 | nie | 20 | 0 | 0 | 0 (0) | nie | 0 | ekran: tak (100–800, h 700); plan 199 zł: tak (364–483, h 119) |
| koniec-proby-zero-390-jasny | 0 | 0.0059 | nie | 14 | 0 | 0 | 0 (0) | nie | 0 |  |
| koniec-proby-zero-390-jasny-en | 0 | 0.0059 | nie | 14 | 0 | 0 | 0 (0) | nie | 0 |  |
| koniec-proby-zero-390-ciemny | 0 | 0.0059 | nie | 14 | 0 | 0 | 0 (0) | nie | 0 |  |
| dzis-po-probie-360-jasny | 0 | 0.0102 | nie | 71 | 1 | 0 | 0 (0) | nie | 0 | pasek „Próba minęła”: tak (215–271, h 56); „Kup dostęp”: tak (219–267, h 48) |
| dzis-po-probie-360-ciemny | 0 | 0.0102 | nie | 71 | 1 | 0 | 0 (0) | nie | 0 | pasek „Próba minęła”: tak (215–271, h 56); „Kup dostęp”: tak (219–267, h 48) |
| dzis-po-probie-390-jasny | 0 | 0.0059 | nie | 71 | 1 | 0 | 0 (0) | nie | 0 | pasek „Próba minęła”: tak (215–271, h 56); „Kup dostęp”: tak (219–267, h 48) |
| dzis-po-probie-390-jasny-en | 0 | 0.0059 | nie | 71 | 1 | 0 | 0 (0) | nie | 0 | pasek „Próba minęła”: tak (215–271, h 56); „Kup dostęp”: tak (219–267, h 48) |
| dzis-po-probie-390-ciemny | 0 | 0.0059 | nie | 71 | 1 | 0 | 0 (0) | nie | 0 | pasek „Próba minęła”: tak (215–271, h 56); „Kup dostęp”: tak (219–267, h 48) |
| dzis-po-probie-1280-jasny | 0 | 0 | nie | 71 | 1 | 0 | 0 (0) | nie | 0 | pasek „Próba minęła”: tak (231–287, h 56); „Kup dostęp”: tak (235–283, h 48) |
| dzis-po-probie-1280-ciemny | 0 | 0 | nie | 71 | 1 | 0 | 0 (0) | nie | 0 | pasek „Próba minęła”: tak (231–287, h 56); „Kup dostęp”: tak (235–283, h 48) |
| plan-z-maila-390-jasny | 0 | 0.0059 | nie | 15 | 0 | 0 | 3 (2) | nie | 0 |  |
| plan-z-maila-390-ciemny | 0 | 0.0059 | nie | 15 | 0 | 0 | 3 (2) | nie | 0 |  |

## Przejścia krok po kroku
### start-proby-przypomnienie: darmowe: „Włącz” → powitanie z przełącznikiem → włączenie → potwierdzenie
1. klik „Włącz” na pasku → powitanie próby → `przejscie-start-proby-przypomnienie-1.png` · stan: `{"h2":"Masz 3 dni pełnego dostępu","przelacznik":false}`
2. klik przełącznika → zgoda zapisana → `przejscie-start-proby-przypomnienie-2.png` · stan: `{"wlaczony":true,"komunikat":"Przypomnimy jednym mailem dzień przed końcem.","baza":"true"}`
- teksty < AA na końcu: 4; błędy konsoli: 0

### koniec-proby: po próbie: ekran „Twoje 3 dni minęły” → „Zostaję przy darmowych próbkach” → drugie wejście z paskiem → „Kup dostęp”
1. ekran końca próby → `przejscie-koniec-proby-1.png` · stan: `"OKRES PRÓBNY MINĄŁ Twoje 3 dni minęły Przez 3 dni zrobiłeś: 2 lekcje 3 fiszki 85 XP Kolokwium · Makroekonomia · za 66 dni Do końca 2. semestru Najtaniej 199 zł to ok. 25 zł miesięcznie · jednorazowo, BLIK, bez odnawiania Co miesiąc 35 zł / mies. kartą, odnawia się co miesiąc, anulujesz w każdej chw`
2. klik „Zostaję przy darmowych próbkach” → Dziś z paskiem → `przejscie-koniec-proby-2.png` · stan: `"Próba minęła · 199 zł do 11 lipca 2027 albo 35 zł / mies.\nKup dostęp"`
3. przeładowanie → bez ekranu, pasek nad panelem → `przejscie-koniec-proby-3.png` · stan: `{"ekran":false,"pasek":56}`
4. klik „Kup dostęp” na pasku → wybór planu → `przejscie-koniec-proby-4.png` · stan: `true`
- teksty < AA na końcu: 1; błędy konsoli: 0

### koniec-proby-plan: ekran końca próby → plan 199 zł → okno zgód przed płatnością
1. ekran końca próby → `przejscie-koniec-proby-plan-1.png` · stan: `true`
2. klik plan 199 zł → „Zanim zapłacisz” → `przejscie-koniec-proby-plan-2.png` · stan: `"Zanim zapłacisz"`
- teksty < AA na końcu: 2; błędy konsoli: 0

## Poziome przewijanie (360 i 375 px)
- koniec-proby 360 px jasny: nie; błędy: 0
- dzis-po-probie 360 px jasny: nie; błędy: 0
- koniec-proby 360 px ciemny: nie; błędy: 0
- dzis-po-probie 360 px ciemny: nie; błędy: 0
- koniec-proby 375 px jasny: nie; błędy: 0
- dzis-po-probie 375 px jasny: nie; błędy: 0
- koniec-proby 375 px ciemny: nie; błędy: 0
- dzis-po-probie 375 px ciemny: nie; błędy: 0

## Ruch (nazwy animacji i czas przejść; przy reduced-motion i html.calm ma być none / 0s)
- koniec-proby · zwykle: `.uxw-koniec` anim h-sheet, ::after none, przejście 0s; `.uxw-koniec .uxw-stat` anim none, ::after none, przejście 0s; `.uxw-koniec .uxw-plan.on` anim none, ::after none, przejście 0s
- powitanie-proby · zwykle: `.uxw-przyp .uxw-sw` anim none, ::after none, przejście 0.2s; `.uxw-przyp .uxw-sw::after` brak elementu
- koniec-proby · reduced-motion: `.uxw-koniec` anim none, ::after none, przejście 0.001s; `.uxw-koniec .uxw-stat` anim none, ::after none, przejście 0.001s; `.uxw-koniec .uxw-plan.on` anim none, ::after none, przejście 0s
- powitanie-proby · reduced-motion: `.uxw-przyp .uxw-sw` anim none, ::after none, przejście 0s; `.uxw-przyp .uxw-sw::after` brak elementu
- koniec-proby · Mniej animacji (html.calm): `.uxw-koniec` anim none, ::after none, przejście 0.001s; `.uxw-koniec .uxw-stat` anim none, ::after none, przejście 0.001s; `.uxw-koniec .uxw-plan.on` anim none, ::after none, przejście 0s
- powitanie-proby · Mniej animacji (html.calm): `.uxw-przyp .uxw-sw` anim none, ::after none, przejście 0s; `.uxw-przyp .uxw-sw::after` brak elementu

## Teksty poniżej AA i < 12 px (szczegóły)
### dzis-po-probie-360-jasny
- `SPAN` „poz. 1” 11.84 px
### dzis-po-probie-360-ciemny
- `SPAN` „poz. 1” 11.84 px
### dzis-po-probie-390-jasny
- `SPAN` „poz. 1” 11.84 px
### dzis-po-probie-390-jasny-en
- `SPAN` „lvl 1” 11.84 px
### dzis-po-probie-390-ciemny
- `SPAN` „poz. 1” 11.84 px
### dzis-po-probie-1280-jasny
- `SPAN` „poz. 1” 11.84 px
### dzis-po-probie-1280-ciemny
- `SPAN` „poz. 1” 11.84 px

## Cele dotyku < 44 px (szczegóły)
### plan-z-maila-390-jasny
- `A.link` „Regulamin” 70×17 (link w zdaniu)
- `A.link` „Prywatność” 80×17 (link w zdaniu)
- `BUTTON.btn.ghost` „Zamknij” 91×43
### plan-z-maila-390-ciemny
- `A.link` „Regulamin” 70×17 (link w zdaniu)
- `A.link` „Prywatność” 80×17 (link w zdaniu)
- `BUTTON.btn.ghost` „Zamknij” 91×43

## Naruszenia axe (szczegóły)
### powitanie-proby-360-jasny
- color-contrast · `#skrot-wm` · Element has insufficient color contrast of 1.57 (foreground color: #cacfcd, background color: #ffffff, font size: 7.5pt (10px), font weight: normal). Expected c
### powitanie-proby-360-ciemny
- color-contrast · `#skrot-wm` · Element has insufficient color contrast of 1.91 (foreground color: #4a5b52, background color: #1d3126, font size: 7.5pt (10px), font weight: normal). Expected c
### powitanie-proby-390-jasny
- color-contrast · `#skrot-wm` · Element has insufficient color contrast of 1.57 (foreground color: #cacfcd, background color: #ffffff, font size: 7.5pt (10px), font weight: normal). Expected c
### powitanie-proby-390-jasny-en
- color-contrast · `#skrot-wm` · Element has insufficient color contrast of 1.57 (foreground color: #cacfcd, background color: #ffffff, font size: 7.5pt (10px), font weight: normal). Expected c
### powitanie-proby-390-ciemny
- color-contrast · `#skrot-wm` · Element has insufficient color contrast of 1.91 (foreground color: #4a5b52, background color: #1d3126, font size: 7.5pt (10px), font weight: normal). Expected c

## Błędy konsoli
brak ✓

## Uwagi stałe
- `#skrot-wm` (axe color-contrast w oknach) to celowy znak wodny z adresem konta z `main` (aria-hidden), pomijany też w dzis-review.mjs.
- „poz. 1”/„lvl 1” (11,84 px) i „dni”/„days” (9,92 px) to plakietki Dziś z `main` (uwagi-dla-innych.md).
- Jeśli w tabeli CLS na Dziś przekracza 0,05, źródłem jest karta „Zadanie dnia” `.jz-card` z `main` (zmiana wysokości 134→112 px po 2–3 s; uwagi-dla-innych.md).
