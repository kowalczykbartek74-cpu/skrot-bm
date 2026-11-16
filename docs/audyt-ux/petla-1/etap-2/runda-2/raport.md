# Pętla UX-1 · etap 2 · runda 2

Etap 2: „Kup dostęp” na Dziś w kolorze akcentu i najwyżej raz; pigułka „Próba · dzień X z 3 · do czw 17:00” nad panelem Stasia (ostatnie 24 h: kolor ostrzeżenia + raz dziennie arkusz z planami); przyciskZakupu() = „Wypróbuj 3 dni” albo „Kup dostęp”; Ustawienia → Konto w próbie; okno błędu startu próby; kierunki „Wkrótce” i SQL v52. Zegar: 18.11.2026 10:00 (dzień 2), 19.11 13:00 (ostatnie 4 h).

Pomiary: axe-core (color-contrast, target-size), własny pomiar kontrastu każdego widocznego tekstu w `#login`, `#main`, `#layer` (tekst ≥ 4,5:1, duży ≥ 3:1; tło złożone z przodków, gradient = najgorszy przystanek; teksty < 12 px też na liście), cele dotyku < 44 px (faktyczne pole), poziome przewijanie, CLS (PerformanceObserver layout-shift), błędy konsoli, `undefined/null/NaN` w tekście ekranu. Zegar atrapy: 17.11.2026 10:00 (chyba że scenariusz mówi inaczej).

| przypadek | scrollY | CLS | poziome przewijanie | sprawdzone teksty | teksty < AA / < 12 px | axe | cele < 44 px (w tym linki w tekście) | undefined/null | błędy konsoli | elementy w 1. ekranie |
|---|---|---|---|---|---|---|---|---|---|---|
| dzis-proba-dzien2-360-jasny | 0 | 0.0102 | nie | 101 | 4 | 0 | 0 (0) | nie | 0 | pigułka próby: tak (215–267, h 52); „Plany”: tak (219–263, h 44) |
| dzis-proba-dzien2-360-ciemny | 0 | 0.0103 | nie | 101 | 4 | 0 | 0 (0) | nie | 0 | pigułka próby: tak (215–267, h 52); „Plany”: tak (219–263, h 44) |
| dzis-proba-dzien2-390-jasny | 0 | 0.0059 | nie | 101 | 4 | 0 | 0 (0) | nie | 0 | pigułka próby: tak (215–267, h 52); „Plany”: tak (219–263, h 44) |
| dzis-proba-dzien2-390-jasny-en | 0 | 0.0117 | nie | 101 | 4 | 0 | 0 (0) | nie | 0 | pigułka próby: tak (215–267, h 52); „Plany”: tak (219–263, h 44) |
| dzis-proba-dzien2-390-ciemny | 0 | 0.006 | nie | 101 | 4 | 0 | 0 (0) | nie | 0 | pigułka próby: tak (215–267, h 52); „Plany”: tak (219–263, h 44) |
| dzis-proba-dzien2-1280-jasny | 0 | 0.0001 | nie | 101 | 4 | 0 | 0 (0) | nie | 0 | pigułka próby: tak (231–283, h 52); „Plany”: tak (235–279, h 44) |
| dzis-proba-dzien2-1280-ciemny | 0 | 0.0001 | nie | 101 | 4 | 0 | 0 (0) | nie | 0 | pigułka próby: tak (231–283, h 52); „Plany”: tak (235–279, h 44) |
| dzis-proba-ostatnie-godziny-360-jasny | 0 | 0.0103 | nie | 98 | 4 | 0 | 0 (0) | nie | 0 | pigułka (ostrzeżenie): tak (215–267, h 52) |
| dzis-proba-ostatnie-godziny-360-ciemny | 0 | 0.0103 | nie | 98 | 4 | 0 | 0 (0) | nie | 0 | pigułka (ostrzeżenie): tak (215–267, h 52) |
| dzis-proba-ostatnie-godziny-390-jasny | 0 | 0.006 | nie | 98 | 4 | 0 | 0 (0) | nie | 0 | pigułka (ostrzeżenie): tak (215–267, h 52) |
| dzis-proba-ostatnie-godziny-390-ciemny | 0 | 0.006 | nie | 98 | 4 | 0 | 0 (0) | nie | 0 | pigułka (ostrzeżenie): tak (215–267, h 52) |
| arkusz-ostatnie-godziny-360-jasny | 0 | 0.0103 | nie | 18 | 0 | color-contrast: 1 | 0 (0) | nie | 0 | arkusz: tak (77–640, h 563); plan 199 zł: tak (320–460, h 141) |
| arkusz-ostatnie-godziny-360-ciemny | 0 | 0.0103 | nie | 18 | 0 | color-contrast: 1 | 0 (0) | nie | 0 | arkusz: tak (77–640, h 563); plan 199 zł: tak (320–460, h 141) |
| arkusz-ostatnie-godziny-390-jasny | 0 | 0.0059 | nie | 18 | 0 | color-contrast: 1 | 0 (0) | nie | 0 | arkusz: tak (162–844, h 682); plan 199 zł: tak (405–545, h 141) |
| arkusz-ostatnie-godziny-390-jasny-en | 0 | 0.0061 | nie | 18 | 0 | color-contrast: 1 | 0 (0) | nie | 0 | arkusz: tak (205–844, h 639); plan 199 zł: tak (448–567, h 119) |
| arkusz-ostatnie-godziny-390-ciemny | 0 | 0.006 | nie | 18 | 0 | color-contrast: 1 | 0 (0) | nie | 0 | arkusz: tak (162–844, h 682); plan 199 zł: tak (405–545, h 141) |
| arkusz-ostatnie-godziny-1280-jasny | 0 | 0.0002 | nie | 18 | 0 | 0 | 0 (0) | nie | 0 | arkusz: tak (135–765, h 630); plan 199 zł: tak (362–481, h 119) |
| arkusz-ostatnie-godziny-1280-ciemny | 0 | 0.0001 | nie | 18 | 0 | 0 | 0 (0) | nie | 0 | arkusz: tak (135–765, h 630); plan 199 zł: tak (362–481, h 119) |
| dzis-proba-koniec-360-jasny | 0 | 0.0103 | nie | 71 | 1 | 0 | 0 (0) | nie | 0 | „Kup dostęp”: tak (219–267, h 48) |
| dzis-proba-koniec-360-ciemny | 0 | 0.0104 | nie | 71 | 1 | 0 | 0 (0) | nie | 0 | „Kup dostęp”: tak (219–267, h 48) |
| dzis-proba-koniec-390-jasny | 0 | 0.006 | nie | 71 | 1 | 0 | 0 (0) | nie | 0 | „Kup dostęp”: tak (219–267, h 48) |
| dzis-proba-koniec-390-jasny-en | 0 | 0.0059 | nie | 71 | 1 | 0 | 0 (0) | nie | 0 | „Kup dostęp”: tak (219–267, h 48) |
| dzis-proba-koniec-390-ciemny | 0 | 0.006 | nie | 71 | 1 | 0 | 0 (0) | nie | 0 | „Kup dostęp”: tak (219–267, h 48) |
| dzis-proba-koniec-1280-jasny | 0 | 0.0002 | nie | 71 | 1 | 0 | 0 (0) | nie | 0 | „Kup dostęp”: tak (235–283, h 48) |
| dzis-proba-koniec-1280-ciemny | 0 | 0 | nie | 71 | 1 | 0 | 0 (0) | nie | 0 | „Kup dostęp”: tak (235–283, h 48) |
| dzis-proba-koniec-bez-bloku-lekcji-390-jasny | 0 | 0.0061 | nie | 53 | 1 | 0 | 4 (0) | nie | 0 |  |
| dzis-proba-koniec-bez-bloku-lekcji-390-ciemny | 0 | 0.0061 | nie | 53 | 1 | 0 | 4 (0) | nie | 0 |  |
| dzis-darmowe-360-jasny | 0 | 0.0103 | nie | 72 | 1 | 0 | 0 (0) | nie | 0 | pasek „Masz jeszcze 3 dni”: tak (215–267, h 52) |
| dzis-darmowe-360-ciemny | 0 | 0.0103 | nie | 72 | 1 | 0 | 0 (0) | nie | 0 | pasek „Masz jeszcze 3 dni”: tak (215–267, h 52) |
| dzis-darmowe-390-jasny | 0 | 0.006 | nie | 72 | 1 | 0 | 0 (0) | nie | 0 | pasek „Masz jeszcze 3 dni”: tak (215–267, h 52) |
| dzis-darmowe-390-jasny-en | 0 | 0.006 | nie | 72 | 1 | 0 | 0 (0) | nie | 0 | pasek „Masz jeszcze 3 dni”: tak (215–267, h 52) |
| dzis-darmowe-390-ciemny | 0 | 0.006 | nie | 72 | 1 | 0 | 0 (0) | nie | 0 | pasek „Masz jeszcze 3 dni”: tak (215–267, h 52) |
| dzis-darmowe-bez-bloku-lekcji-390-jasny | 0 | 0.0059 | nie | 54 | 1 | 0 | 4 (0) | nie | 0 |  |
| dzis-darmowe-bez-bloku-lekcji-390-ciemny | 0 | 0.006 | nie | 54 | 1 | 0 | 4 (0) | nie | 0 |  |
| ustawienia-konto-proba-390-jasny | 0 | 0.0059 | nie | 22 | 0 | 0 | 10 (0) | nie | 0 |  |
| ustawienia-konto-proba-390-jasny-en | 0 | 0.0059 | nie | 22 | 0 | 0 | 10 (0) | nie | 0 |  |
| ustawienia-konto-proba-390-ciemny | 0 | 0.0059 | nie | 22 | 0 | 0 | 10 (0) | nie | 0 |  |
| ustawienia-konto-proba-1280-jasny | 0 | 0.0006 | nie | 22 | 0 | 0 | 6 (0) | nie | 0 |  |
| ustawienia-konto-proba-1280-ciemny | 0 | 0.0006 | nie | 22 | 0 | 0 | 6 (0) | nie | 0 |  |
| blad-wykorzystany-360-jasny | 0 | 0.0102 | nie | 6 | 0 | 0 | 0 (0) | nie | 0 |  |
| blad-wykorzystany-360-ciemny | 0 | 0.0103 | nie | 6 | 0 | 0 | 0 (0) | nie | 0 |  |
| blad-wykorzystany-390-jasny | 0 | 0.006 | nie | 6 | 0 | 0 | 0 (0) | nie | 0 |  |
| blad-wykorzystany-390-jasny-en | 0 | 0.0059 | nie | 6 | 0 | 0 | 0 (0) | nie | 0 |  |
| blad-wykorzystany-390-ciemny | 0 | 0.006 | nie | 6 | 0 | 0 | 0 (0) | nie | 0 |  |
| blad-wykorzystany-1280-jasny | 0 | 0.0002 | nie | 6 | 0 | 0 | 0 (0) | nie | 0 |  |
| blad-wykorzystany-1280-ciemny | 0 | 0.0001 | nie | 6 | 0 | 0 | 0 (0) | nie | 0 |  |
| blad-urzadzenie-390-jasny | 0 | 0.006 | nie | 6 | 0 | 0 | 0 (0) | nie | 0 |  |
| blad-urzadzenie-390-jasny-en | 0 | 0.0059 | nie | 6 | 0 | 0 | 0 (0) | nie | 0 |  |
| blad-urzadzenie-390-ciemny | 0 | 0.006 | nie | 6 | 0 | 0 | 0 (0) | nie | 0 |  |
| logowanie-kierunki-390-jasny | 0 | 0.0001 | nie | 62 | 0 | 0 | 0 (0) | nie | 0 |  |
| logowanie-kierunki-390-jasny-en | 0 | 0 | nie | 62 | 0 | 0 | 0 (0) | nie | 0 |  |
| logowanie-kierunki-390-ciemny | 0 | 0.0001 | nie | 62 | 0 | 0 | 0 (0) | nie | 0 |  |
| logowanie-kierunki-1280-jasny | 0 | 0 | nie | 56 | 0 | 0 | 0 (0) | nie | 0 |  |
| logowanie-kierunki-1280-ciemny | 0 | 0 | nie | 56 | 0 | 0 | 0 (0) | nie | 0 |  |

## Przejścia krok po kroku
### proba-ostatni-dzien: próba, 4 h do końca: arkusz raz dziennie → „199 zł” → „Zanim zapłacisz”; po przeładowaniu sama pigułka
1. arkusz „Zostało 4 godz. próby” → `przejscie-proba-ostatni-dzien-1.png` · stan: `{"h2":"Zostało 4 godz. próby","plany":["Do końca 2. semestru Najtaniej 199 zł to ok. 25 zł miesięcznie · jednorazowo, BLIK, bez odnawiania","Co miesiąc 35 zł / mies. kartą, odnawia się co miesiąc, anulujesz w każdej chwili"]}`
2. klik plan 199 zł → okno zgód przed płatnością → `przejscie-proba-ostatni-dzien-2.png` · stan: `"Zanim zapłacisz"`
3. przeładowanie → bez arkusza, pigułka w kolorze ostrzeżenia → `przejscie-proba-ostatni-dzien-3.png` · stan: `{"arkusz":false,"pigulka":"uxw-pasek uxw-proba warn"}`
- teksty < AA na końcu: 4; błędy konsoli: 0

### proba-koniec-kup: po próbie: jeden zielony „Kup dostęp” na Dziś → wybór planu
1. Dziś: „Kup dostęp” (jeden, akcent) → `przejscie-proba-koniec-kup-1.png` · stan: `["rgb(26, 127, 69)"]`
2. klik → „Wybierz plan” → `przejscie-proba-koniec-kup-2.png` · stan: `true`
- teksty < AA na końcu: 1; błędy konsoli: 0

### blad-proby-plan: darmowe, próba już wykorzystana: „Włącz” → okno błędu → „Wybierz plan”
1. Dziś z paskiem → `przejscie-blad-proby-plan-1.png` · stan: `"Masz jeszcze 3 dni za darmo\nWłącz"`
2. klik „Włącz” → okno błędu → `przejscie-blad-proby-plan-2.png` · stan: `"OKRES PRÓBNY\nOkresu próbnego nie da się włączyć\n\nNa tym koncie okres próbny już był. Twoje postępy z próby czekają. Dostęp: 199 zł do 11 lipca 2027 albo 35 zł / mies.\n\nWybierz plan\nNapisz do nas\nZamknij"`
3. klik „Wybierz plan” → wybór planu → `przejscie-blad-proby-plan-3.png` · stan: `true`
- teksty < AA na końcu: 1; błędy konsoli: 0

### kierunek-wkrotce: gość: kierunek oczekujący → „Wkrótce” → lista oczekujących z tym kierunkiem
1. lista kierunków → `przejscie-kierunek-wkrotce-1.png` · stan: `["Zarządzanie","Economics and IT Applications","Komunikacja i psychologia w biznesie","Logistyka","Logistyka inż.","Przedsiębiorczość i Inwestycje","Informatyka w Biznesie","Zarządzanie Logistyczne w Ochronie Zdrowia","Zarządzanie odnawialnymi źródłami energii"]`
2. klik „Zarządzanie” → lista oczekujących → `przejscie-kierunek-wkrotce-2.png` · stan: `"Ten kierunek jeszcze nie ruszył"`
- teksty < AA na końcu: 0; błędy konsoli: 0

## Poziome przewijanie (360 i 375 px)
- dzis-proba 360 px jasny: nie; błędy: 0
- dzis-proba-koniec 360 px jasny: nie; błędy: 0
- logowanie-kierunki 360 px jasny: nie; błędy: 0
- dzis-proba 360 px ciemny: nie; błędy: 0
- dzis-proba-koniec 360 px ciemny: nie; błędy: 0
- logowanie-kierunki 360 px ciemny: nie; błędy: 0
- dzis-proba 375 px jasny: nie; błędy: 0
- dzis-proba-koniec 375 px jasny: nie; błędy: 0
- logowanie-kierunki 375 px jasny: nie; błędy: 0
- dzis-proba 375 px ciemny: nie; błędy: 0
- dzis-proba-koniec 375 px ciemny: nie; błędy: 0
- logowanie-kierunki 375 px ciemny: nie; błędy: 0

## Ruch (nazwy animacji i czas przejść; przy reduced-motion i html.calm ma być none / 0s)
- dzis-proba · zwykle: `.uxw-proba` anim none, ::after none, przejście 0s; `.uxw-kup, .uxw-pasek-link` anim none, ::after none, przejście 0s
- arkusz-ostatnie-godziny · zwykle: `.uxw-ost` anim h-sheet, ::after none, przejście 0s; `.uxw-plan.on` anim none, ::after none, przejście 0s
- dzis-proba · reduced-motion: `.uxw-proba` anim none, ::after none, przejście 0s; `.uxw-kup, .uxw-pasek-link` anim none, ::after none, przejście 0s
- arkusz-ostatnie-godziny · reduced-motion: `.uxw-ost` anim none, ::after none, przejście 0.001s; `.uxw-plan.on` anim none, ::after none, przejście 0s
- dzis-proba · Mniej animacji (html.calm): `.uxw-proba` anim none, ::after none, przejście 0s; `.uxw-kup, .uxw-pasek-link` anim none, ::after none, przejście 0s
- arkusz-ostatnie-godziny · Mniej animacji (html.calm): `.uxw-ost` anim none, ::after none, przejście 0.001s; `.uxw-plan.on` anim none, ::after none, przejście 0s

## Teksty poniżej AA i < 12 px (szczegóły)
### dzis-proba-dzien2-360-jasny
- `SPAN` „poz. 1” 11.84 px
- `SMALL` „dni” 9.92 px
- `SMALL` „dni” 9.92 px
- `SMALL` „dni” 9.92 px
### dzis-proba-dzien2-360-ciemny
- `SPAN` „poz. 1” 11.84 px
- `SMALL` „dni” 9.92 px
- `SMALL` „dni” 9.92 px
- `SMALL` „dni” 9.92 px
### dzis-proba-dzien2-390-jasny
- `SPAN` „poz. 1” 11.84 px
- `SMALL` „dni” 9.92 px
- `SMALL` „dni” 9.92 px
- `SMALL` „dni” 9.92 px
### dzis-proba-dzien2-390-jasny-en
- `SPAN` „lvl 1” 11.84 px
- `SMALL` „days” 9.92 px
- `SMALL` „days” 9.92 px
- `SMALL` „days” 9.92 px
### dzis-proba-dzien2-390-ciemny
- `SPAN` „poz. 1” 11.84 px
- `SMALL` „dni” 9.92 px
- `SMALL` „dni” 9.92 px
- `SMALL` „dni” 9.92 px
### dzis-proba-dzien2-1280-jasny
- `SPAN` „poz. 1” 11.84 px
- `SMALL` „dni” 9.92 px
- `SMALL` „dni” 9.92 px
- `SMALL` „dni” 9.92 px
### dzis-proba-dzien2-1280-ciemny
- `SPAN` „poz. 1” 11.84 px
- `SMALL` „dni” 9.92 px
- `SMALL` „dni” 9.92 px
- `SMALL` „dni” 9.92 px
### dzis-proba-ostatnie-godziny-360-jasny
- `SPAN` „poz. 1” 11.84 px
- `SMALL` „dni” 9.92 px
- `SMALL` „dni” 9.92 px
- `SMALL` „dni” 9.92 px
### dzis-proba-ostatnie-godziny-360-ciemny
- `SPAN` „poz. 1” 11.84 px
- `SMALL` „dni” 9.92 px
- `SMALL` „dni” 9.92 px
- `SMALL` „dni” 9.92 px
### dzis-proba-ostatnie-godziny-390-jasny
- `SPAN` „poz. 1” 11.84 px
- `SMALL` „dni” 9.92 px
- `SMALL` „dni” 9.92 px
- `SMALL` „dni” 9.92 px
### dzis-proba-ostatnie-godziny-390-ciemny
- `SPAN` „poz. 1” 11.84 px
- `SMALL` „dni” 9.92 px
- `SMALL` „dni” 9.92 px
- `SMALL` „dni” 9.92 px
### dzis-proba-koniec-360-jasny
- `SPAN` „poz. 1” 11.84 px
### dzis-proba-koniec-360-ciemny
- `SPAN` „poz. 1” 11.84 px
### dzis-proba-koniec-390-jasny
- `SPAN` „poz. 1” 11.84 px
### dzis-proba-koniec-390-jasny-en
- `SPAN` „lvl 1” 11.84 px
### dzis-proba-koniec-390-ciemny
- `SPAN` „poz. 1” 11.84 px
### dzis-proba-koniec-1280-jasny
- `SPAN` „poz. 1” 11.84 px
### dzis-proba-koniec-1280-ciemny
- `SPAN` „poz. 1” 11.84 px
### dzis-proba-koniec-bez-bloku-lekcji-390-jasny
- `SPAN` „poz. 1” 11.84 px
### dzis-proba-koniec-bez-bloku-lekcji-390-ciemny
- `SPAN` „poz. 1” 11.84 px
### dzis-darmowe-360-jasny
- `SPAN` „poz. 1” 11.84 px
### dzis-darmowe-360-ciemny
- `SPAN` „poz. 1” 11.84 px
### dzis-darmowe-390-jasny
- `SPAN` „poz. 1” 11.84 px
### dzis-darmowe-390-jasny-en
- `SPAN` „lvl 1” 11.84 px
### dzis-darmowe-390-ciemny
- `SPAN` „poz. 1” 11.84 px
### dzis-darmowe-bez-bloku-lekcji-390-jasny
- `SPAN` „poz. 1” 11.84 px
### dzis-darmowe-bez-bloku-lekcji-390-ciemny
- `SPAN` „poz. 1” 11.84 px

## Cele dotyku < 44 px (szczegóły)
### dzis-proba-koniec-bez-bloku-lekcji-390-jasny
- `BUTTON` „5 min” 66×36
- `BUTTON` „15 min” 72×36
- `BUTTON` „30 min” 76×36
- `BUTTON` „60 min” 76×36
### dzis-proba-koniec-bez-bloku-lekcji-390-ciemny
- `BUTTON` „5 min” 66×36
- `BUTTON` „15 min” 72×36
- `BUTTON` „30 min” 76×36
- `BUTTON` „60 min” 76×36
### dzis-darmowe-bez-bloku-lekcji-390-jasny
- `BUTTON` „5 min” 66×36
- `BUTTON` „15 min” 72×36
- `BUTTON` „30 min” 76×36
- `BUTTON` „60 min” 76×36
### dzis-darmowe-bez-bloku-lekcji-390-ciemny
- `BUTTON` „5 min” 66×36
- `BUTTON` „15 min” 72×36
- `BUTTON` „30 min” 76×36
- `BUTTON` „60 min” 76×36
### ustawienia-konto-proba-390-jasny
- `BUTTON.back` „←
Więcej” 96×36
- `BUTTON.tab` „Wygląd” 77×40
- `BUTTON.tab` „Przypomnienia” 124×40
- `BUTTON.tab` „Konto” 67×40
- `BUTTON.tab` „Pomoc” 74×40
- `A` „Plan zajęć (za darmo)” 133×21
- `A` „Skrzynka do opiekunki roku” 174×21
- `A` „Regulamin” 67×21
- `A` „Polityka prywatności” 133×21
- `A` „Kontakt” 51×21
### ustawienia-konto-proba-390-jasny-en
- `BUTTON.back` „←
More” 84×36
- `BUTTON.tab` „Looks” 76×40
- `BUTTON.tab` „Reminders” 106×40
- `BUTTON.tab` „Account” 93×40
- `BUTTON.tab` „Help” 67×40
- `A` „Timetable (free)” 102×21
- `A` „Message box for the year supervisor” 229×21
- `A` „Terms of service” 103×21
- `A` „Privacy policy” 89×21
- `A` „Contact” 53×21
### ustawienia-konto-proba-390-ciemny
- `BUTTON.back` „←
Więcej” 96×36
- `BUTTON.tab` „Wygląd” 77×40
- `BUTTON.tab` „Przypomnienia” 124×40
- `BUTTON.tab` „Konto” 67×40
- `BUTTON.tab` „Pomoc” 74×40
- `A` „Plan zajęć (za darmo)” 133×21
- `A` „Skrzynka do opiekunki roku” 174×21
- `A` „Regulamin” 67×21
- `A` „Polityka prywatności” 133×21
- `A` „Kontakt” 51×21
### ustawienia-konto-proba-1280-jasny
- `BUTTON.back` „←
Więcej” 96×36
- `A` „Plan zajęć (za darmo)” 133×21
- `A` „Skrzynka do opiekunki roku” 174×21
- `A` „Regulamin” 67×21
- `A` „Polityka prywatności” 133×21
- `A` „Kontakt” 51×21
### ustawienia-konto-proba-1280-ciemny
- `BUTTON.back` „←
Więcej” 96×36
- `A` „Plan zajęć (za darmo)” 133×21
- `A` „Skrzynka do opiekunki roku” 174×21
- `A` „Regulamin” 67×21
- `A` „Polityka prywatności” 133×21
- `A` „Kontakt” 51×21

## Naruszenia axe (szczegóły)
### arkusz-ostatnie-godziny-360-jasny
- color-contrast · `#skrot-wm` · Element has insufficient color contrast of 1.57 (foreground color: #cacfcd, background color: #ffffff, font size: 7.5pt (10px), font weight: normal). Expected c
### arkusz-ostatnie-godziny-360-ciemny
- color-contrast · `#skrot-wm` · Element has insufficient color contrast of 1.91 (foreground color: #4a5b52, background color: #1d3126, font size: 7.5pt (10px), font weight: normal). Expected c
### arkusz-ostatnie-godziny-390-jasny
- color-contrast · `#skrot-wm` · Element has insufficient color contrast of 1.57 (foreground color: #cacfcd, background color: #ffffff, font size: 7.5pt (10px), font weight: normal). Expected c
### arkusz-ostatnie-godziny-390-jasny-en
- color-contrast · `#skrot-wm` · Element has insufficient color contrast of 1.57 (foreground color: #cacfcd, background color: #ffffff, font size: 7.5pt (10px), font weight: normal). Expected c
### arkusz-ostatnie-godziny-390-ciemny
- color-contrast · `#skrot-wm` · Element has insufficient color contrast of 1.91 (foreground color: #4a5b52, background color: #1d3126, font size: 7.5pt (10px), font weight: normal). Expected c

## Błędy konsoli
brak ✓

## Uwagi stałe
- `#skrot-wm` (axe color-contrast w oknach) to celowy znak wodny z adresem konta z `main` (aria-hidden), pomijany też w dzis-review.mjs.
- „poz. 1”/„lvl 1” (11,84 px) i „dni”/„days” (9,92 px) to plakietki Dziś z `main` (uwagi-dla-innych.md).
- CLS ok. 0,06 na Dziś (karta „Zadanie dnia” `.jz-card`) – z `main`, uwagi-dla-innych.md.
