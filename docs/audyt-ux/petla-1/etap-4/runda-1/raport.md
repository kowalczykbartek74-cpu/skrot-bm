# Pętla UX-1 · etap 4 · runda 1

Etap 4: paywall lekcji (199 zł z przeliczeniem na miesiąc na górze, 35 zł drugi, co jest w lekcji), wybór planu z „to ok. X zł miesięcznie”, przycisk płatności bez zgód z komunikatem, karta „+2 dni przed kolokwium” (SQL v54), arkusz przed portalem Stripe przy planie miesięcznym, licznik rocznika od 15 osób, FAQ „Kto to robi?”, link „Usuń konto i dane”. Do tego poprawki po etapie 3 (koniec próby z bazy, mail w dzień, karty planów jako wybór z przyklejonym przyciskiem).

Pomiary: axe-core (color-contrast, target-size), własny pomiar kontrastu każdego widocznego tekstu w `#login`, `#main`, `#layer` (tekst ≥ 4,5:1, duży ≥ 3:1; tło złożone z przodków, gradient = najgorszy przystanek; teksty < 12 px też na liście), cele dotyku < 44 px (faktyczne pole), poziome przewijanie, CLS (PerformanceObserver layout-shift), błędy konsoli, `undefined/null/NaN` w tekście ekranu. Zegar atrapy: 17.11.2026 10:00 (chyba że scenariusz mówi inaczej).

| przypadek | scrollY | CLS | poziome przewijanie | sprawdzone teksty | teksty < AA / < 12 px | axe | cele < 44 px (w tym linki w tekście) | undefined/null | błędy konsoli | elementy w 1. ekranie |
|---|---|---|---|---|---|---|---|---|---|---|
| paywall-lekcji-po-probie-360-jasny | 0 | 0.0102 | nie | 21 | 0 | 0 | 6 (0) | nie | 0 | „199 zł do lipca…”: tak (342–390, h 48); spis lekcji: tak (456–634, h 178) |
| paywall-lekcji-po-probie-360-ciemny | 0 | 0.0102 | nie | 21 | 0 | 0 | 6 (0) | nie | 0 | „199 zł do lipca…”: tak (342–390, h 48); spis lekcji: tak (456–634, h 178) |
| paywall-lekcji-po-probie-390-jasny | 0 | 0.0109 | nie | 21 | 0 | 0 | 6 (0) | nie | 0 | „199 zł do lipca…”: tak (318–366, h 48); spis lekcji: tak (432–610, h 178) |
| paywall-lekcji-po-probie-390-jasny-en | 0 | 0.007 | nie | 21 | 0 | 0 | 6 (0) | nie | 0 | „199 zł do lipca…”: tak (318–366, h 48); spis lekcji: tak (432–610, h 178) |
| paywall-lekcji-po-probie-390-ciemny | 0 | 0.0108 | nie | 21 | 0 | 0 | 6 (0) | nie | 0 | „199 zł do lipca…”: tak (318–366, h 48); spis lekcji: tak (432–610, h 178) |
| paywall-lekcji-po-probie-1280-jasny | 0 | 0.0014 | nie | 21 | 0 | 0 | 8 (0) | nie | 0 | „199 zł do lipca…”: tak (300–343, h 43); spis lekcji: tak (353–531, h 178) |
| paywall-lekcji-po-probie-1280-ciemny | 0 | 0.0326 | nie | 21 | 0 | 0 | 8 (0) | nie | 0 | „199 zł do lipca…”: tak (300–343, h 43); spis lekcji: tak (353–531, h 178) |
| paywall-lekcji-darmowe-360-jasny | 0 | 0.0102 | nie | 23 | 0 | 0 | 6 (0) | nie | 0 | przyciski: tak (342–502, h 160) |
| paywall-lekcji-darmowe-360-ciemny | 0 | 0.0102 | nie | 23 | 0 | 0 | 6 (0) | nie | 0 | przyciski: tak (342–502, h 160) |
| paywall-lekcji-darmowe-390-jasny | 0 | 0.007 | nie | 23 | 0 | 0 | 6 (0) | nie | 0 | przyciski: tak (318–478, h 160) |
| paywall-lekcji-darmowe-390-ciemny | 0 | 0.007 | nie | 23 | 0 | 0 | 6 (0) | nie | 0 | przyciski: tak (318–478, h 160) |
| wybor-planu-360-jasny | 0 | 0.0103 | nie | 16 | 0 | 0 | 2 (2) | nie | 0 |  |
| wybor-planu-360-ciemny | 0 | 0.0103 | nie | 16 | 0 | 0 | 2 (2) | nie | 0 |  |
| wybor-planu-390-jasny | 0 | 0.0064 | nie | 16 | 0 | 0 | 2 (2) | nie | 0 |  |
| wybor-planu-390-jasny-en | 0 | 0.006 | nie | 16 | 0 | 0 | 2 (2) | nie | 0 |  |
| wybor-planu-390-ciemny | 0 | 0.006 | nie | 16 | 0 | 0 | 2 (2) | nie | 0 |  |
| wybor-planu-1280-jasny | 0 | 0.0002 | nie | 16 | 0 | 0 | 2 (2) | nie | 0 |  |
| wybor-planu-1280-ciemny | 0 | 0.0001 | nie | 16 | 0 | 0 | 2 (2) | nie | 0 |  |
| zgody-bez-zaznaczenia-390-jasny | 0 | 0.0059 | nie | 13 | 0 | 0 | 4 (2) | nie | 0 |  |
| zgody-bez-zaznaczenia-390-jasny-en | 0 | 0.0059 | nie | 13 | 0 | 0 | 4 (2) | nie | 0 |  |
| zgody-bez-zaznaczenia-390-ciemny | 0 | 0.006 | nie | 13 | 0 | 0 | 4 (2) | nie | 0 |  |
| dzis-plus-2-dni-360-jasny | 0 | 0.0103 | nie | 72 | 1 | 0 | 0 (0) | nie | 0 | karta „+2 dni”: tak (215–383, h 168) |
| dzis-plus-2-dni-360-ciemny | 0 | 0.0103 | nie | 72 | 1 | 0 | 0 (0) | nie | 0 | karta „+2 dni”: tak (215–383, h 168) |
| dzis-plus-2-dni-390-jasny | 0 | 0.006 | nie | 72 | 1 | 0 | 0 (0) | nie | 0 | karta „+2 dni”: tak (215–383, h 168) |
| dzis-plus-2-dni-390-jasny-en | 0 | 0.0059 | nie | 72 | 1 | 0 | 0 (0) | nie | 0 | karta „+2 dni”: tak (215–359, h 144) |
| dzis-plus-2-dni-390-ciemny | 0 | 0.006 | nie | 72 | 1 | 0 | 0 (0) | nie | 0 | karta „+2 dni”: tak (215–383, h 168) |
| dzis-plus-2-dni-1280-jasny | 0 | 0.0002 | nie | 72 | 1 | 0 | 0 (0) | nie | 0 | karta „+2 dni”: tak (231–375, h 144) |
| dzis-plus-2-dni-1280-ciemny | 0 | 0.0001 | nie | 72 | 1 | 0 | 0 (0) | nie | 0 | karta „+2 dni”: tak (231–375, h 144) |
| przed-portalem-390-jasny | 0 | 0.0064 | nie | 7 | 0 | 0 | 0 (0) | nie | 0 |  |
| przed-portalem-390-jasny-en | 0 | 0.006 | nie | 7 | 0 | 0 | 0 (0) | nie | 0 |  |
| przed-portalem-390-ciemny | 0 | 0.0064 | nie | 7 | 0 | 0 | 0 (0) | nie | 0 |  |
| przed-portalem-1280-jasny | 0 | 0.0001 | nie | 7 | 0 | 0 | 0 (0) | nie | 0 |  |
| przed-portalem-1280-ciemny | 0 | 0 | nie | 7 | 0 | 0 | 0 (0) | nie | 0 |  |
| logowanie-licznik-faq-390-jasny | 753 | 0.0335 | nie | 35 | 0 | 0 | 0 (0) | nie | 0 |  |
| logowanie-licznik-faq-390-jasny-en | 796 | 0.0431 | nie | 35 | 0 | 0 | 0 (0) | nie | 0 |  |
| logowanie-licznik-faq-390-ciemny | 753 | 0.0335 | nie | 35 | 0 | 0 | 0 (0) | nie | 0 |  |
| logowanie-licznik-faq-1280-jasny | 575 | 0.0051 | nie | 31 | 0 | 0 | 0 (0) | nie | 0 |  |
| logowanie-licznik-faq-1280-ciemny | 575 | 0.0051 | nie | 31 | 0 | 0 | 0 (0) | nie | 0 |  |
| koniec-proby-360-360-jasny | 0 | 0.0103 | nie | 13 | 0 | 0 | 0 (0) | nie | 0 | „Wybierz 199 zł”: tak (518–570, h 52) |
| koniec-proby-360-360-ciemny | 0 | 0.0103 | nie | 13 | 0 | 0 | 0 (0) | nie | 0 | „Wybierz 199 zł”: tak (518–570, h 52) |

## Przejścia krok po kroku
### paywall-kup: po próbie: lekcja z kłódką → „199 zł do lipca” → okno zgód → klik bez zgód → komunikat i fokus
1. paywall lekcji → `przejscie-paywall-kup-1.png` · stan: `["199 zł do lipca · ok. 25 zł / mies.","35 zł / mies."]`
2. klik „199 zł do lipca…” → „Zanim zapłacisz” → `przejscie-paywall-kup-2.png` · stan: `"Zanim zapłacisz"`
3. klik „Przejdź do płatności” bez zgód → komunikat, fokus na 1. zgodzie → `przejscie-paywall-kup-3.png` · stan: `{"msg":"Zaznacz obie zgody powyżej, żeby przejść do płatności.","fokus":"checkbox"}`
- teksty < AA na końcu: 0; błędy konsoli: 0

### plus-2-dni: po próbie, kolokwium za 5 dni: karta „+2 dni” → „Włącz 2 dni za darmo” → próba znów trwa
1. Dziś z kartą → `przejscie-plus-2-dni-1.png` · stan: `"Kolokwium · Prawo · za 5 dni\n\nMasz jeszcze jedne 2 dni pełnego dostępu, żeby się przygotować.\n\nWłącz 2 dni za darmo"`
2. klik → przeładowanie, powitanie próby → `przejscie-plus-2-dni-2.png` · stan: `{"konto":"proba","h2":"Masz 3 dni pełnego dostępu"}`
- teksty < AA na końcu: 4; błędy konsoli: 0

### anulowanie-miesiecznego: plan miesięczny: Zarządzaj → arkusz porównania → „Przejdź na 199 zł” → zgody 199 zł
1. arkusz przed portalem → `przejscie-anulowanie-miesiecznego-1.png` · stan: `"PLAN MIESIĘCZNY Zanim anulujesz Zostało ok. 8 mies. do lipca. Co miesiąc to ok. 280 zł, a plan do końca 2. semestru kosztuje 199 zł. Po zakupie 199 zł anuluj subskrypcję w portalu, żeby nie płacić co miesiąc. Opłacony miesiąc i tak działa do końca. Przejdź na 199 zł Anuluj subskrypcję Zamknij"`
2. klik „Przejdź na 199 zł” → `przejscie-anulowanie-miesiecznego-2.png` · stan: `"Przejdź do płatności (199 zł)"`
- teksty < AA na końcu: 4; błędy konsoli: 0

## Poziome przewijanie (360 i 375 px)
- paywall-lekcji 360 px jasny: nie; błędy: 0
- dzis-plus-2-dni 360 px jasny: nie; błędy: 0
- logowanie 360 px jasny: nie; błędy: 0
- paywall-lekcji 360 px ciemny: nie; błędy: 0
- dzis-plus-2-dni 360 px ciemny: nie; błędy: 0
- logowanie 360 px ciemny: nie; błędy: 0
- paywall-lekcji 375 px jasny: nie; błędy: 0
- dzis-plus-2-dni 375 px jasny: nie; błędy: 0
- logowanie 375 px jasny: nie; błędy: 0
- paywall-lekcji 375 px ciemny: nie; błędy: 0
- dzis-plus-2-dni 375 px ciemny: nie; błędy: 0
- logowanie 375 px ciemny: nie; błędy: 0

## Ruch (nazwy animacji i czas przejść; przy reduced-motion i html.calm ma być none / 0s)
- dzis-plus-2-dni · zwykle: `.uxw-bonus` anim none, ::after none, przejście 0s; `.uxw-bonus .btn` anim none, ::after none, przejście 0.08s, 0.08s, 0.15s
- dzis-plus-2-dni · reduced-motion: `.uxw-bonus` anim none, ::after none, przejście 0.001s; `.uxw-bonus .btn` anim none, ::after none, przejście 0.001s
- dzis-plus-2-dni · Mniej animacji (html.calm): `.uxw-bonus` anim none, ::after none, przejście 0.001s; `.uxw-bonus .btn` anim none, ::after none, przejście 0.001s

## Teksty poniżej AA i < 12 px (szczegóły)
### dzis-plus-2-dni-360-jasny
- `SPAN` „poz. 1” 11.84 px
### dzis-plus-2-dni-360-ciemny
- `SPAN` „poz. 1” 11.84 px
### dzis-plus-2-dni-390-jasny
- `SPAN` „poz. 1” 11.84 px
### dzis-plus-2-dni-390-jasny-en
- `SPAN` „lvl 1” 11.84 px
### dzis-plus-2-dni-390-ciemny
- `SPAN` „poz. 1” 11.84 px
### dzis-plus-2-dni-1280-jasny
- `SPAN` „poz. 1” 11.84 px
### dzis-plus-2-dni-1280-ciemny
- `SPAN` „poz. 1” 11.84 px

## Cele dotyku < 44 px (szczegóły)
### paywall-lekcji-po-probie-360-jasny
- `BUTTON.back` „←
Analiza matematyczna” 202×36
- `A` „Plan zajęć (za darmo)” 133×21
- `A` „Skrzynka do opiekunki roku” 174×21
- `A` „Regulamin” 67×21
- `A` „Polityka prywatności” 133×21
- `A` „Kontakt” 51×21
### paywall-lekcji-po-probie-360-ciemny
- `BUTTON.back` „←
Analiza matematyczna” 202×36
- `A` „Plan zajęć (za darmo)” 133×21
- `A` „Skrzynka do opiekunki roku” 174×21
- `A` „Regulamin” 67×21
- `A` „Polityka prywatności” 133×21
- `A` „Kontakt” 51×21
### paywall-lekcji-po-probie-390-jasny
- `BUTTON.back` „←
Analiza matematyczna” 202×36
- `A` „Plan zajęć (za darmo)” 133×21
- `A` „Skrzynka do opiekunki roku” 174×21
- `A` „Regulamin” 67×21
- `A` „Polityka prywatności” 133×21
- `A` „Kontakt” 51×21
### paywall-lekcji-po-probie-390-jasny-en
- `BUTTON.back` „←
Mathematical Analysis” 202×36
- `A` „Timetable (free)” 102×21
- `A` „Message box for the year supervisor” 229×21
- `A` „Terms of service” 103×21
- `A` „Privacy policy” 89×21
- `A` „Contact” 53×21
### paywall-lekcji-po-probie-390-ciemny
- `BUTTON.back` „←
Analiza matematyczna” 202×36
- `A` „Plan zajęć (za darmo)” 133×21
- `A` „Skrzynka do opiekunki roku” 174×21
- `A` „Regulamin” 67×21
- `A` „Polityka prywatności” 133×21
- `A` „Kontakt” 51×21
### paywall-lekcji-po-probie-1280-jasny
- `BUTTON.back` „←
Analiza matematyczna” 202×36
- `BUTTON.btn.primary` „199 zł do lipca · ok. 25 zł / mies.” 256×43
- `BUTTON.btn` „35 zł / mies.” 121×43
- `A` „Plan zajęć (za darmo)” 133×21
- `A` „Skrzynka do opiekunki roku” 174×21
- `A` „Regulamin” 67×21
- `A` „Polityka prywatności” 133×21
- `A` „Kontakt” 51×21
### paywall-lekcji-po-probie-1280-ciemny
- `BUTTON.back` „←
Analiza matematyczna” 202×36
- `BUTTON.btn.primary` „199 zł do lipca · ok. 25 zł / mies.” 256×43
- `BUTTON.btn` „35 zł / mies.” 121×43
- `A` „Plan zajęć (za darmo)” 133×21
- `A` „Skrzynka do opiekunki roku” 174×21
- `A` „Regulamin” 67×21
- `A` „Polityka prywatności” 133×21
- `A` „Kontakt” 51×21
### paywall-lekcji-darmowe-360-jasny
- `BUTTON.back` „←
Analiza matematyczna” 202×36
- `A` „Plan zajęć (za darmo)” 133×21
- `A` „Skrzynka do opiekunki roku” 174×21
- `A` „Regulamin” 67×21
- `A` „Polityka prywatności” 133×21
- `A` „Kontakt” 51×21
### paywall-lekcji-darmowe-360-ciemny
- `BUTTON.back` „←
Analiza matematyczna” 202×36
- `A` „Plan zajęć (za darmo)” 133×21
- `A` „Skrzynka do opiekunki roku” 174×21
- `A` „Regulamin” 67×21
- `A` „Polityka prywatności” 133×21
- `A` „Kontakt” 51×21
### paywall-lekcji-darmowe-390-jasny
- `BUTTON.back` „←
Analiza matematyczna” 202×36
- `A` „Plan zajęć (za darmo)” 133×21
- `A` „Skrzynka do opiekunki roku” 174×21
- `A` „Regulamin” 67×21
- `A` „Polityka prywatności” 133×21
- `A` „Kontakt” 51×21
### paywall-lekcji-darmowe-390-ciemny
- `BUTTON.back` „←
Analiza matematyczna” 202×36
- `A` „Plan zajęć (za darmo)” 133×21
- `A` „Skrzynka do opiekunki roku” 174×21
- `A` „Regulamin” 67×21
- `A` „Polityka prywatności” 133×21
- `A` „Kontakt” 51×21
### wybor-planu-360-jasny
- `A.link` „Regulamin” 70×17 (link w zdaniu)
- `A.link` „Prywatność” 80×17 (link w zdaniu)
### wybor-planu-360-ciemny
- `A.link` „Regulamin” 70×17 (link w zdaniu)
- `A.link` „Prywatność” 80×17 (link w zdaniu)
### wybor-planu-390-jasny
- `A.link` „Regulamin” 70×17 (link w zdaniu)
- `A.link` „Prywatność” 80×17 (link w zdaniu)
### wybor-planu-390-jasny-en
- `A.link` „Terms of service” 108×17 (link w zdaniu)
- `A.link` „Privacy” 49×17 (link w zdaniu)
### wybor-planu-390-ciemny
- `A.link` „Regulamin” 70×17 (link w zdaniu)
- `A.link` „Prywatność” 80×17 (link w zdaniu)
### wybor-planu-1280-jasny
- `A.link` „Regulamin” 70×17 (link w zdaniu)
- `A.link` „Prywatność” 80×17 (link w zdaniu)
### wybor-planu-1280-ciemny
- `A.link` „Regulamin” 70×17 (link w zdaniu)
- `A.link` „Prywatność” 80×17 (link w zdaniu)
### zgody-bez-zaznaczenia-390-jasny
- `A.link` „Regulamin” 77×19 (link w zdaniu)
- `A.link` „Politykę prywatności” 299×41 (link w zdaniu)
- `BUTTON.btn.primary` „Przejdź do płatności (199 zł)” 233×43
- `BUTTON.btn.ghost` „Anuluj” 80×43
### zgody-bez-zaznaczenia-390-jasny-en
- `A.link` „Terms of service” 119×19 (link w zdaniu)
- `A.link` „Privacy Policy” 103×19 (link w zdaniu)
- `BUTTON.btn.primary` „Go to payment (199 zł)” 195×43
- `BUTTON.btn.ghost` „Cancel” 86×43
### zgody-bez-zaznaczenia-390-ciemny
- `A.link` „Regulamin” 77×19 (link w zdaniu)
- `A.link` „Politykę prywatności” 299×41 (link w zdaniu)
- `BUTTON.btn.primary` „Przejdź do płatności (199 zł)” 233×43
- `BUTTON.btn.ghost` „Anuluj” 80×43

## Naruszenia axe (szczegóły)

## Błędy konsoli
brak ✓

## Uwagi stałe
- `#skrot-wm` (axe color-contrast w oknach) to celowy znak wodny z adresem konta z `main` (aria-hidden), pomijany też w dzis-review.mjs.
- „poz. 1”/„lvl 1” (11,84 px) i „dni”/„days” (9,92 px) to plakietki Dziś z `main` (uwagi-dla-innych.md).
- Jeśli w tabeli CLS na Dziś przekracza 0,05, źródłem jest karta „Zadanie dnia” `.jz-card` z `main` (zmiana wysokości 134→112 px po 2–3 s; uwagi-dla-innych.md).
