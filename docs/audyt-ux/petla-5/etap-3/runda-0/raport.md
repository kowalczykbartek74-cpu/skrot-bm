# UX-5 etap G3 – odznaki, start, ranga, runda 0

Data: 2026-11-17T22:25 · BASE http://127.0.0.1:8915/

Kontrast: własny pomiar każdego widocznego tekstu (tekst ≥ 4,5:1, duży ≥ 3:1; tło z przodków; tekst < 12 px też zgłaszany) + axe-core (color-contrast, target-size). Cele dotyku: każdy przycisk/link/pole w #main i #layer ≥ 44×44 px.

| ekran | sprawdzone teksty | teksty < AA / < 12 px | axe | cele < 44 px | poziome przewijanie | błędy konsoli |
|---|---|---|---|---|---|---|
| profil-360-jasny | 77 | 1 | 0 | 2 | nie | 0 |
| arkusz-360-jasny | 9 | 0 | 0 | 0 | nie | 0 |
| sklep-360-jasny | 99 | 0 | 0 | 1 | nie | 0 |
| poziomy-360-jasny | 97 | 0 | 0 | 0 | nie | 0 |
| ranking-360-jasny | 49 | 3 | 0 | 3 | nie | 0 |
| profil-360-ciemny | 77 | 0 | 0 | 2 | nie | 0 |
| arkusz-360-ciemny | 9 | 0 | 0 | 0 | nie | 0 |
| sklep-360-ciemny | 99 | 0 | 0 | 1 | nie | 0 |
| poziomy-360-ciemny | 97 | 0 | 0 | 0 | nie | 0 |
| ranking-360-ciemny | 49 | 0 | 0 | 3 | nie | 0 |
| profil-390-jasny | 77 | 1 | 0 | 2 | nie | 0 |
| arkusz-390-jasny | 9 | 0 | 0 | 0 | nie | 0 |
| sklep-390-jasny | 99 | 0 | 0 | 1 | nie | 0 |
| poziomy-390-jasny | 97 | 0 | 0 | 0 | nie | 0 |
| ranking-390-jasny | 49 | 3 | 0 | 3 | nie | 0 |
| profil-390-ciemny | 77 | 0 | 0 | 2 | nie | 0 |
| arkusz-390-ciemny | 9 | 0 | 0 | 0 | nie | 0 |
| sklep-390-ciemny | 99 | 0 | 0 | 1 | nie | 0 |
| poziomy-390-ciemny | 97 | 0 | 0 | 0 | nie | 0 |
| ranking-390-ciemny | 49 | 0 | 0 | 3 | nie | 0 |
| profil-1280-jasny | 78 | 1 | 0 | 2 | nie | 0 |
| arkusz-1280-jasny | 9 | 0 | 0 | 0 | nie | 0 |
| sklep-1280-jasny | 108 | 0 | 0 | 1 | nie | 0 |
| poziomy-1280-jasny | 97 | 0 | 0 | 0 | nie | 0 |
| ranking-1280-jasny | 50 | 3 | 0 | 3 | nie | 0 |
| profil-1280-ciemny | 78 | 0 | 0 | 2 | nie | 0 |
| arkusz-1280-ciemny | 9 | 0 | 0 | 0 | nie | 0 |
| profil-390-en | 78 | 2 | 0 | 2 | nie | 0 |

## Testy etapu

```
✓ K1 sekcja „Na start”: Pierwszy krok, Trzy dni, Pierwsza powtórka, Pierwszy cios, Cel 3 razy
✓ K1 sekcja „Nauka”: Seria, Lekcje, Przedmiot przerobiony, Boss pokonany, Przygotowany, Rekord dnia, Duet tygodnia
✓ K1 odznaki z gier w osobnej sekcji „Gry” (zwiniętej)
✓ K1 z postępu przyznane: start1, seria3, pow1, lekcje1, cel3, rekord60, przygotowany
✓ K1 baner przy zdobyciu (kilka naraz: „Nowe odznaki: N”)
✓ K1 „Pierwszy cios” po ciosie w bossa (bsLoad)
✓ K2 każda odznaka to przycisk ≥ 44×44 px
✓ K2 arkusz „Seria”: nazwa, data zdobycia, jak zdobyć, postęp „Seria 5/7”, stopnie
✓ K2 ZD_NAGRODY.odznaka(id) przyznaje raz i pokazuje baner „Odznaka: Duet tygodnia”
✓ K2 po przyznaniu siatka odświeżona: kafel „Duet tygodnia” zdobyty (.on)
✓ K3 PGlite: v60 (start +100 raz przez wyzwalacze na próbie i dostępie, gablota 3, zwrot, nagrody 15/17/20)
✓ K3 Sklep przy 100 monetach bez zakupów: „Kup coś za monety z prezentu” (zamrożenie i kolor pseudonimu)
✓ K3 sklep bez miejsc gabloty do kupienia
✓ K3 przy 30 monetach karty prezentu nie ma
✓ K3 „Prezent na start: +100” widać raz (okno z „Do Sklepu”), po przeładowaniu już nie
✓ K3 gablota: 3 miejsca bez dopłaty (bez kłódek)
✓ K4 ranking: plakietka w linii nicku (≤ 24 px wysokości), tytuły ≥ 12 px
✓ K4 ranking: plakietka poziomu przy nicku (ikona SVG + numer)
✓ K4 „Poziomy i rangi”: nagrody na 15 (Platynowa ramka), 17 (Prezes roku), 20 (Ramka Geniusza)
✓ K4 ikony poziomów: 20 SVG, bez emoji
✓ K4 zablokowane poziomy: przerywany obrys, bez przezroczystości
✓ K4 nagroda w jednej (najwyżej dwóch) liniach
✓ K4 awans na 15: okno pokazuje „Nagroda: Platynowa ramka”
✓ K4 karta nagrody za poziom na pełną szerokość z podglądem ramki (bez łamania po słowie)
✓ EN odznaki: bez polskich tekstów
✓ EN arkusz odznaki: bez polskich tekstów
✓ EN karta prezentu
```

## Ruch (nazwa animacji / czas)
- zwykle: `#layer .modal` h-sheet 0.35s · `.ux5-odz` none 0s
- reduced-motion: `#layer .modal` none 0s · `.ux5-odz` none 0.001s
- calm: `#layer .modal` none 0s · `.ux5-odz` none 0.001s

## Wynik testów: 27 ✓ / 0 ✗

## Szczegóły
- profil-360-jasny · kontrast `.kav-l` „B” 1.08:1 < 3:1
- profil-360-jasny · cel `BUTTON.back` „←
Więcej” 96×36
- profil-360-jasny · cel `BUTTON.xp-chip.hud-coin.h-shine` „100” 69×30
- sklep-360-jasny · cel `BUTTON.back` „←
Więcej” 96×36
- ranking-360-jasny · kontrast `.kav-l` „Ł” 1:1 < 4.5:1
- ranking-360-jasny · kontrast `.kav-l` „C” 1:1 < 4.5:1
- ranking-360-jasny · kontrast `.kav-l` „B” 1.18:1 < 4.5:1
- ranking-360-jasny · cel `BUTTON.back` „←
Więcej” 96×36
- ranking-360-jasny · cel `BUTTON.btn.small` „Pseudonim: Bartek · widoczny” 226×35
- ranking-360-jasny · cel `SELECT.input.rk-sel` „Wszystkie przedmioty
Analiza matematyczn” 320×43
- profil-360-ciemny · cel `BUTTON.back` „←
Więcej” 96×36
- profil-360-ciemny · cel `BUTTON.xp-chip.hud-coin.h-shine` „100” 69×30
- sklep-360-ciemny · cel `BUTTON.back` „←
Więcej” 96×36
- ranking-360-ciemny · cel `BUTTON.back` „←
Więcej” 96×36
- ranking-360-ciemny · cel `BUTTON.btn.small` „Pseudonim: Bartek · widoczny” 226×35
- ranking-360-ciemny · cel `SELECT.input.rk-sel` „Wszystkie przedmioty
Analiza matematyczn” 320×43
- profil-390-jasny · kontrast `.kav-l` „B” 1.08:1 < 3:1
- profil-390-jasny · cel `BUTTON.back` „←
Więcej” 96×36
- profil-390-jasny · cel `BUTTON.xp-chip.hud-coin.h-shine` „100” 69×30
- sklep-390-jasny · cel `BUTTON.back` „←
Więcej” 96×36
- ranking-390-jasny · kontrast `.kav-l` „Ł” 1:1 < 4.5:1
- ranking-390-jasny · kontrast `.kav-l` „C” 1:1 < 4.5:1
- ranking-390-jasny · kontrast `.kav-l` „B” 1.18:1 < 4.5:1
- ranking-390-jasny · cel `BUTTON.back` „←
Więcej” 96×36
- ranking-390-jasny · cel `BUTTON.btn.small` „Pseudonim: Bartek · widoczny” 226×35
- ranking-390-jasny · cel `SELECT.input.rk-sel` „Wszystkie przedmioty
Analiza matematyczn” 320×43
- profil-390-ciemny · cel `BUTTON.back` „←
Więcej” 96×36
- profil-390-ciemny · cel `BUTTON.xp-chip.hud-coin.h-shine` „100” 69×30
- sklep-390-ciemny · cel `BUTTON.back` „←
Więcej” 96×36
- ranking-390-ciemny · cel `BUTTON.back` „←
Więcej” 96×36
- ranking-390-ciemny · cel `BUTTON.btn.small` „Pseudonim: Bartek · widoczny” 226×35
- ranking-390-ciemny · cel `SELECT.input.rk-sel` „Wszystkie przedmioty
Analiza matematyczn” 320×43
- profil-1280-jasny · kontrast `.kav-l` „B” 1.08:1 < 3:1
- profil-1280-jasny · cel `BUTTON.back` „←
Więcej” 96×36
- profil-1280-jasny · cel `BUTTON.xp-chip.hud-coin.h-shine` „100” 69×30
- sklep-1280-jasny · cel `BUTTON.back` „←
Więcej” 96×36
- ranking-1280-jasny · kontrast `.kav-l` „Ł” 1:1 < 4.5:1
- ranking-1280-jasny · kontrast `.kav-l` „C” 1:1 < 4.5:1
- ranking-1280-jasny · kontrast `.kav-l` „B” 1.18:1 < 4.5:1
- ranking-1280-jasny · cel `BUTTON.back` „←
Więcej” 96×36
- ranking-1280-jasny · cel `BUTTON.btn.small` „Pseudonim: Bartek · widoczny” 226×35
- ranking-1280-jasny · cel `SELECT.input.rk-sel` „Wszystkie przedmioty
Analiza matematyczn” 320×43
- profil-1280-ciemny · cel `BUTTON.back` „←
Więcej” 96×36
- profil-1280-ciemny · cel `BUTTON.xp-chip.hud-coin.h-shine` „100” 69×30
- profil-390-en · kontrast `.kav-l` „B” 1.08:1 < 3:1
- profil-390-en · kontrast `SPAN` „New badges: 6” 1:1 < 4.5:1
- profil-390-en · cel `BUTTON.back` „←
More” 84×36
- profil-390-en · cel `BUTTON.xp-chip.hud-coin.h-shine` „100” 69×30
