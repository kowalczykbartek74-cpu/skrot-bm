# Pętla UX-1 · etap 1 · runda 2

Etap 1: logowanie od góry bez skoków, jeden główny przycisk „Zacznij 3 dni za darmo”, Staś, ciemny wariant (prefers-color-scheme: dark), ikona play, propozycja próby po pierwszym logowaniu, pasek „Masz jeszcze 3 dni za darmo” na Dziś, komunikat limitu i „Wyślij ponownie”, teksty EN.

Pomiary: axe-core (color-contrast, target-size), własny pomiar kontrastu każdego widocznego tekstu w `#login`, `#main`, `#layer` (tekst ≥ 4,5:1, duży ≥ 3:1; tło złożone z przodków, gradient = najgorszy przystanek; teksty < 12 px też na liście), cele dotyku < 44 px (faktyczne pole), poziome przewijanie, CLS (PerformanceObserver layout-shift), błędy konsoli, `undefined/null/NaN` w tekście ekranu. Zegar atrapy: 17.11.2026 10:00 (chyba że scenariusz mówi inaczej).

| przypadek | scrollY | CLS | poziome przewijanie | sprawdzone teksty | teksty < AA / < 12 px | axe | cele < 44 px (w tym linki w tekście) | undefined/null | błędy konsoli | elementy w 1. ekranie |
|---|---|---|---|---|---|---|---|---|---|---|
| logowanie-360-jasny | 0 | 0 | nie | 32 | 0 | 0 | 0 (0) | nie | 0 | cta „Zacznij 3 dni”: tak (512–564, h 52); nagłówek (telefon): tak (104–152, h 48); nagłówek (komputer): tak (0–0, h 0) |
| logowanie-360-ciemny | 0 | 0.0003 | nie | 32 | 0 | 0 | 0 (0) | nie | 0 | cta „Zacznij 3 dni”: tak (512–564, h 52); nagłówek (telefon): tak (104–152, h 48); nagłówek (komputer): tak (0–0, h 0) |
| logowanie-390-jasny | 0 | 0 | nie | 32 | 0 | 0 | 0 (0) | nie | 0 | cta „Zacznij 3 dni”: tak (501–553, h 52); nagłówek (telefon): tak (112–160, h 48); nagłówek (komputer): tak (0–0, h 0) |
| logowanie-390-jasny-en | 0 | 0 | nie | 32 | 0 | 0 | 0 (0) | nie | 0 | cta „Zacznij 3 dni”: tak (501–553, h 52); nagłówek (telefon): tak (112–160, h 48); nagłówek (komputer): tak (0–0, h 0) |
| logowanie-390-ciemny | 0 | 0 | nie | 32 | 0 | 0 | 0 (0) | nie | 0 | cta „Zacznij 3 dni”: tak (501–553, h 52); nagłówek (telefon): tak (112–160, h 48); nagłówek (komputer): tak (0–0, h 0) |
| logowanie-1280-jasny | 0 | 0 | nie | 28 | 0 | 0 | 0 (0) | nie | 0 | cta „Zacznij 3 dni”: tak (409–461, h 52); nagłówek (telefon): tak (0–0, h 0); nagłówek (komputer): tak (276–359, h 83) |
| logowanie-1280-ciemny | 0 | 0 | nie | 28 | 0 | 0 | 0 (0) | nie | 0 | cta „Zacznij 3 dni”: tak (409–461, h 52); nagłówek (telefon): tak (0–0, h 0); nagłówek (komputer): tak (276–359, h 83) |
| logowanie-bez-grupy-390-jasny | 0 | 0 | nie | 42 | 0 | 0 | 0 (0) | nie | 0 | nagłówek (telefon): tak (118–204, h 86); nagłówek (komputer): tak (0–0, h 0) |
| logowanie-bez-grupy-390-ciemny | 0 | 0.0001 | nie | 42 | 0 | 0 | 0 (0) | nie | 0 | nagłówek (telefon): tak (118–204, h 86); nagłówek (komputer): tak (0–0, h 0) |
| logowanie-bez-grupy-1280-jasny | 0 | 0 | nie | 36 | 0 | 0 | 0 (0) | nie | 0 | nagłówek (telefon): tak (0–0, h 0); nagłówek (komputer): tak (276–359, h 83) |
| logowanie-bez-grupy-1280-ciemny | 0 | 0.0029 | nie | 36 | 0 | 0 | 0 (0) | nie | 0 | nagłówek (telefon): tak (0–0, h 0); nagłówek (komputer): tak (270–353, h 83) |
| logowanie-tryb-proby-390-jasny | 0 | 0.0002 | nie | 26 | 0 | 0 | 0 (0) | nie | 0 |  |
| logowanie-tryb-proby-390-jasny-en | 0 | 0 | nie | 26 | 0 | 0 | 0 (0) | nie | 0 |  |
| logowanie-tryb-proby-390-ciemny | 0 | 0 | nie | 26 | 0 | 0 | 0 (0) | nie | 0 |  |
| kod-tryb-proby-390-jasny | 0 | 0 | nie | 23 | 0 | 0 | 0 (0) | nie | 0 |  |
| kod-tryb-proby-390-jasny-en | 0 | 0.0003 | nie | 23 | 0 | 0 | 0 (0) | nie | 0 |  |
| kod-tryb-proby-390-ciemny | 0 | 0.0002 | nie | 23 | 0 | 0 | 0 (0) | nie | 0 |  |
| kod-tryb-proby-1280-jasny | 0 | 0 | nie | 22 | 0 | 0 | 0 (0) | nie | 0 |  |
| kod-tryb-proby-1280-ciemny | 0 | 0.0028 | nie | 22 | 0 | 0 | 0 (0) | nie | 0 |  |
| kod-po-60s-360-jasny | 390 | 0 | nie | 23 | 0 | 0 | 0 (0) | nie | 0 |  |
| kod-po-60s-360-ciemny | 390 | 0 | nie | 23 | 0 | 0 | 0 (0) | nie | 0 |  |
| kod-po-60s-390-jasny | 163 | 0 | nie | 23 | 0 | 0 | 0 (0) | nie | 0 |  |
| kod-po-60s-390-jasny-en | 197 | 0 | nie | 23 | 0 | 0 | 0 (0) | nie | 0 |  |
| kod-po-60s-390-ciemny | 163 | 0 | nie | 23 | 0 | 0 | 0 (0) | nie | 0 |  |
| blad-limitu-390-jasny | 508 | 0 | nie | 33 | 0 | 0 | 0 (0) | nie | 0 |  |
| blad-limitu-390-jasny-en | 530 | 0 | nie | 33 | 0 | 0 | 0 (0) | nie | 0 |  |
| blad-limitu-390-ciemny | 508 | 0 | nie | 33 | 0 | 0 | 0 (0) | nie | 0 |  |
| arkusz-proby-360-jasny | 0 | 0.0102 | nie | 4 | 0 | 0 | 0 (0) | nie | 0 | arkusz: tak (242–640, h 398); „Tak, zaczynam 3 dni”: tak (508–560, h 52) |
| arkusz-proby-360-ciemny | 0 | 0.0104 | nie | 4 | 0 | 0 | 0 (0) | nie | 0 | arkusz: tak (242–640, h 398); „Tak, zaczynam 3 dni”: tak (508–560, h 52) |
| arkusz-proby-390-jasny | 0 | 0.0689 | nie | 4 | 0 | 0 | 0 (0) | nie | 0 | arkusz: tak (467–844, h 377); „Tak, zaczynam 3 dni”: tak (712–764, h 52) |
| arkusz-proby-390-jasny-en | 0 | 0.0061 | nie | 4 | 0 | 0 | 0 (0) | nie | 0 | arkusz: tak (467–844, h 377); „Tak, zaczynam 3 dni”: tak (712–764, h 52) |
| arkusz-proby-390-ciemny | 0 | 0.0059 | nie | 4 | 0 | 0 | 0 (0) | nie | 0 | arkusz: tak (467–844, h 377); „Tak, zaczynam 3 dni”: tak (712–764, h 52) |
| arkusz-proby-1280-jasny | 0 | 0.0001 | nie | 4 | 0 | 0 | 0 (0) | nie | 0 | arkusz: tak (278–622, h 344); „Tak, zaczynam 3 dni”: tak (483–535, h 52) |
| arkusz-proby-1280-ciemny | 0 | 0.0001 | nie | 4 | 0 | 0 | 0 (0) | nie | 0 | arkusz: tak (278–622, h 344); „Tak, zaczynam 3 dni”: tak (483–535, h 52) |
| dzis-darmowe-360-jasny | 0 | 0.0104 | nie | 53 | 1 | 0 | 0 (0) | nie | 0 | pasek „Masz jeszcze 3 dni”: tak (215–267, h 52); „Włącz”: tak (219–263, h 44) |
| dzis-darmowe-360-ciemny | 0 | 0.0104 | nie | 53 | 1 | 0 | 0 (0) | nie | 0 | pasek „Masz jeszcze 3 dni”: tak (215–267, h 52); „Włącz”: tak (219–263, h 44) |
| dzis-darmowe-390-jasny | 0 | 0.0689 | nie | 53 | 1 | 0 | 4 (0) | nie | 0 | pasek „Masz jeszcze 3 dni”: tak (215–267, h 52); „Włącz”: tak (219–263, h 44) |
| dzis-darmowe-390-jasny-en | 0 | 0.0061 | nie | 53 | 1 | 0 | 4 (0) | nie | 0 | pasek „Masz jeszcze 3 dni”: tak (215–267, h 52); „Włącz”: tak (219–263, h 44) |
| dzis-darmowe-390-ciemny | 0 | 0.082 | nie | 53 | 1 | 0 | 4 (0) | nie | 0 | pasek „Masz jeszcze 3 dni”: tak (215–267, h 52); „Włącz”: tak (219–263, h 44) |
| dzis-darmowe-1280-jasny | 0 | 0 | nie | 53 | 1 | 0 | 4 (0) | nie | 0 | pasek „Masz jeszcze 3 dni”: tak (231–283, h 52); „Włącz”: tak (235–279, h 44) |
| dzis-darmowe-1280-ciemny | 0 | 0 | nie | 53 | 1 | 0 | 4 (0) | nie | 0 | pasek „Masz jeszcze 3 dni”: tak (231–283, h 52); „Włącz”: tak (235–279, h 44) |
| dzis-platne-bez-paska-390-jasny | 0 | 0.0059 | nie | 71 | 4 | 0 | 4 (0) | nie | 0 | pasek (ma go nie być): brak |
| dzis-platne-bez-paska-390-ciemny | 0 | 0.0062 | nie | 71 | 4 | 0 | 4 (0) | nie | 0 | pasek (ma go nie być): brak |

## Przejścia krok po kroku
### nowa-osoba-proba: konto brak, grupa wybrana: „Zacznij 3 dni za darmo” → e-mail → kod (przycisk „Zacznij 3 dni za darmo”)
1. ekran wejścia (od góry, bez fokusu) → `przejscie-nowa-osoba-proba-1.png` · stan: `{"y":0,"fokus":"BODY"}`
2. klik „Zacznij 3 dni za darmo” → formularz e-mail w trybie próby → `przejscie-nowa-osoba-proba-2.png` · stan: `{"h2":"3 dni za darmo","przycisk":"Wyślij kod i zacznij","fokus":"skrot-login-email"}`
3. wpisany e-mail i „Wyślij kod i zacznij” → krok kodu → `przejscie-nowa-osoba-proba-3.png` · stan: `{"przycisk":"Zacznij 3 dni za darmo","notka":"Po wpisaniu kodu od razu włączy się 3 dni pełnego dostępu za darmo.","ponownie":"Wyślij ponownie za 60 s"}`
4. wpisany kod → logowanie (znacznik skrot-z-logowania) → `przejscie-nowa-osoba-proba-4.png` · stan: `{"z_logowania":"1","proba":"1"}`
- teksty < AA na końcu: 1; błędy konsoli: 0

### darmowe-arkusz-tak: konto darmowe po pierwszym logowaniu z pełnego ekranu: arkusz → „Tak, zaczynam 3 dni” → powitanie próby
1. arkusz „Włączyć teraz 3 dni pełnego dostępu?” → `przejscie-darmowe-arkusz-tak-1.png` · stan: `{"h2":"Włączyć teraz 3 dni pełnego dostępu?","fokus":"Tak, zaczynam 3 dni"}`
2. klik „Tak, zaczynam 3 dni” → próba i powitanie → `przejscie-darmowe-arkusz-tak-2.png` · stan: `{"konto":"proba","h2":"Masz 3 dni pełnego dostępu"}`
- teksty < AA na końcu: 4; błędy konsoli: 0

### darmowe-arkusz-pozniej: konto darmowe: arkusz → „Później…” → Dziś z paskiem; po przeładowaniu bez arkusza
1. arkusz → `przejscie-darmowe-arkusz-pozniej-1.png` · stan: `true`
2. klik „Później, zostawię na kolokwium” → Dziś z paskiem → `przejscie-darmowe-arkusz-pozniej-2.png` · stan: `{"arkusz":false,"pasek":"Masz jeszcze 3 dni za darmo\nWłącz"}`
3. przeładowanie → bez arkusza, pasek zostaje → `przejscie-darmowe-arkusz-pozniej-3.png` · stan: `{"arkusz":false,"pasek":"Masz jeszcze 3 dni za darmo\nWłącz"}`
- teksty < AA na końcu: 1; błędy konsoli: 0

### darmowe-pasek-wlacz: konto darmowe bez znacznika: pasek na Dziś → „Włącz” → próba
1. Dziś z paskiem → `przejscie-darmowe-pasek-wlacz-1.png` · stan: `"Masz jeszcze 3 dni za darmo\nWłącz"`
2. klik „Włącz” → próba i powitanie → `przejscie-darmowe-pasek-wlacz-2.png` · stan: `{"konto":"proba","h2":"Masz 3 dni pełnego dostępu"}`
- teksty < AA na końcu: 4; błędy konsoli: 0

### kod-wyslij-ponownie: krok kodu: odliczanie 60 s → notka o spamie i „Wyślij ponownie” → nowy kod
1. e-mail wysłany, krok kodu (odliczanie) → `przejscie-kod-wyslij-ponownie-1.png` · stan: `{"ponownie":"Wyślij ponownie za 60 s","aktywny":false}`
2. po 61 s: notka i aktywne „Wyślij ponownie” → `przejscie-kod-wyslij-ponownie-2.png` · stan: `{"notka":"Kod nie dochodzi? Sprawdź folder Oferty/Spam albo wpisz inny adres (np. prywatny Gmail).","ponownie":"Wyślij ponownie","aktywny":true}`
3. klik „Wyślij ponownie” → komunikat i nowe odliczanie → `przejscie-kod-wyslij-ponownie-3.png` · stan: `{"komunikat":"Wysłaliśmy nowy kod na nowy@stud.usz.edu.pl.","ponownie":"Wyślij ponownie za 60 s","wyslano":2}`
- teksty < AA na końcu: 0; błędy konsoli: 0

## Poziome przewijanie (360 i 375 px)
- logowanie 360 px jasny: nie; błędy: 0
- logowanie-bez-grupy 360 px jasny: nie; błędy: 0
- dzis-darmowe 360 px jasny: nie; błędy: 0
- arkusz-proby 360 px jasny: nie; błędy: 0
- logowanie 360 px ciemny: nie; błędy: 0
- logowanie-bez-grupy 360 px ciemny: nie; błędy: 0
- dzis-darmowe 360 px ciemny: nie; błędy: 0
- arkusz-proby 360 px ciemny: nie; błędy: 0
- logowanie 375 px jasny: nie; błędy: 0
- logowanie-bez-grupy 375 px jasny: nie; błędy: 0
- dzis-darmowe 375 px jasny: nie; błędy: 0
- arkusz-proby 375 px jasny: nie; błędy: 0
- logowanie 375 px ciemny: nie; błędy: 0
- logowanie-bez-grupy 375 px ciemny: nie; błędy: 0
- dzis-darmowe 375 px ciemny: nie; błędy: 0
- arkusz-proby 375 px ciemny: nie; błędy: 0

## Ruch (nazwy animacji i czas przejść; przy reduced-motion i html.calm ma być none / 0s)
- logowanie · zwykle: `#login .lg-trial` anim lg-rise, ::after none, przejście 0s; `#login .lg-trial .btn.primary` anim none, ::after uxw-shine, przejście 0.15s, 0.15s, 0.15s; `#login .lg-intro > .stas-face` anim lg-hop, lg-wave, ::after none, przejście 0s; `#loginBox form` anim lg-rise, ::after none, przejście 0s; `#login .lg-demo` anim lg-rise, ::after none, przejście 0s
- arkusz-proby · zwykle: `.uxw-sheet` anim h-sheet, ::after none, przejście 0s; `.uxw-sheet .btn.primary` anim none, ::after none, przejście 0.08s, 0.08s, 0.15s
- logowanie · reduced-motion: `#login .lg-trial` anim none, ::after none, przejście 0s; `#login .lg-trial .btn.primary` anim none, ::after none, przejście 0s; `#login .lg-intro > .stas-face` anim none, ::after none, przejście 0s; `#loginBox form` anim none, ::after none, przejście 0s; `#login .lg-demo` anim none, ::after none, przejście 0s
- arkusz-proby · reduced-motion: `.uxw-sheet` anim none, ::after none, przejście 0s; `.uxw-sheet .btn.primary` anim none, ::after none, przejście 0s
- logowanie · Mniej animacji (html.calm): `#login .lg-trial` anim none, ::after none, przejście 0s; `#login .lg-trial .btn.primary` anim none, ::after none, przejście 0s; `#login .lg-intro > .stas-face` anim none, ::after none, przejście 0s; `#loginBox form` anim none, ::after none, przejście 0s; `#login .lg-demo` anim none, ::after none, przejście 0s
- arkusz-proby · Mniej animacji (html.calm): `.uxw-sheet` anim none, ::after none, przejście 0s; `.uxw-sheet .btn.primary` anim none, ::after none, przejście 0s

## Teksty poniżej AA i < 12 px (szczegóły)
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
### dzis-darmowe-1280-jasny
- `SPAN` „poz. 1” 11.84 px
### dzis-darmowe-1280-ciemny
- `SPAN` „poz. 1” 11.84 px
### dzis-platne-bez-paska-390-jasny
- `SPAN` „poz. 1” 11.84 px
- `SMALL` „dni” 9.92 px
- `SMALL` „dni” 9.92 px
- `SMALL` „dni” 9.92 px
### dzis-platne-bez-paska-390-ciemny
- `SPAN` „poz. 1” 11.84 px
- `SMALL` „dni” 9.92 px
- `SMALL` „dni” 9.92 px
- `SMALL` „dni” 9.92 px

## Cele dotyku < 44 px (szczegóły)
### dzis-darmowe-390-jasny
- `BUTTON` „5 min” 66×36
- `BUTTON` „15 min” 72×36
- `BUTTON` „30 min” 76×36
- `BUTTON` „60 min” 76×36
### dzis-darmowe-390-jasny-en
- `BUTTON` „5 min” 66×36
- `BUTTON` „15 min” 72×36
- `BUTTON` „30 min” 76×36
- `BUTTON` „60 min” 76×36
### dzis-darmowe-390-ciemny
- `BUTTON` „5 min” 66×36
- `BUTTON` „15 min” 72×36
- `BUTTON` „30 min” 76×36
- `BUTTON` „60 min” 76×36
### dzis-darmowe-1280-jasny
- `BUTTON` „5 min” 66×36
- `BUTTON` „15 min” 72×36
- `BUTTON` „30 min” 76×36
- `BUTTON` „60 min” 76×36
### dzis-darmowe-1280-ciemny
- `BUTTON` „5 min” 66×36
- `BUTTON` „15 min” 72×36
- `BUTTON` „30 min” 76×36
- `BUTTON` „60 min” 76×36
### dzis-platne-bez-paska-390-jasny
- `BUTTON` „5 min” 66×36
- `BUTTON` „15 min” 72×36
- `BUTTON` „30 min” 76×36
- `BUTTON` „60 min” 76×36
### dzis-platne-bez-paska-390-ciemny
- `BUTTON` „5 min” 66×36
- `BUTTON` „15 min” 72×36
- `BUTTON` „30 min” 76×36
- `BUTTON` „60 min” 76×36

## Naruszenia axe (szczegóły)

## Błędy konsoli
brak ✓
