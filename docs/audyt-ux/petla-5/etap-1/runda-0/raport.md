# UX-5 etap G1 – ścieżka przedmiotu, runda 0

Data: 2026-11-17T22:19 · BASE http://127.0.0.1:8915/

Kontrast: własny pomiar każdego widocznego tekstu (tekst ≥ 4,5:1, duży ≥ 3:1; tło z przodków; tekst < 12 px też zgłaszany) + axe-core (color-contrast, target-size). Cele dotyku: każdy przycisk/link/pole w #main i #layer ≥ 44×44 px.

| ekran | sprawdzone teksty | teksty < AA / < 12 px | axe | cele < 44 px | poziome przewijanie | błędy konsoli |
|---|---|---|---|---|---|---|
| przedmiot-w-trakcie-360-jasny | 71 | 1 | 0 | 1 | nie | 0 |
| przedmiot-dzial-zaliczony-360-jasny | 72 | 1 | 0 | 1 | nie | 0 |
| przedmiot-darmowe-360-jasny | 71 | 0 | 0 | 1 | nie | 0 |
| przedmiot-w-trakcie-360-ciemny | 71 | 1 | 0 | 1 | nie | 0 |
| przedmiot-dzial-zaliczony-360-ciemny | 72 | 1 | 0 | 1 | nie | 0 |
| przedmiot-darmowe-360-ciemny | 71 | 0 | 0 | 1 | nie | 0 |
| przedmiot-w-trakcie-390-jasny | 71 | 1 | 0 | 1 | nie | 0 |
| przedmiot-dzial-zaliczony-390-jasny | 72 | 1 | 0 | 1 | nie | 0 |
| przedmiot-darmowe-390-jasny | 71 | 0 | 0 | 1 | nie | 0 |
| przedmiot-w-trakcie-390-ciemny | 71 | 1 | 0 | 1 | nie | 0 |
| przedmiot-dzial-zaliczony-390-ciemny | 72 | 1 | 0 | 1 | nie | 0 |
| przedmiot-darmowe-390-ciemny | 71 | 0 | 0 | 1 | nie | 0 |
| przedmiot-w-trakcie-1280-jasny | 72 | 1 | 0 | 1 | nie | 0 |
| przedmiot-dzial-zaliczony-1280-jasny | 73 | 1 | 0 | 1 | nie | 0 |
| przedmiot-darmowe-1280-jasny | 72 | 0 | 0 | 1 | nie | 0 |
| przedmiot-w-trakcie-1280-ciemny | 72 | 1 | 0 | 1 | nie | 0 |
| przedmiot-dzial-zaliczony-1280-ciemny | 73 | 1 | 0 | 1 | nie | 0 |
| przedmiot-w-trakcie-390-en | 70 | 1 | 0 | 1 | nie | 0 |
| material-390-jasny | 78 | 1 | 0 | 6 | nie | 0 |

## Testy etapu

```
✓ K1 darmowe 360px: 10 przedmiotów bez przewijania w bok
✓ K1 darmowe 390px: 10 przedmiotów bez przewijania w bok
✓ K1 proba-koniec 360px: 10 przedmiotów bez przewijania w bok
✓ K1 proba-koniec 390px: 10 przedmiotów bez przewijania w bok
✓ K2 przedmiot: bez undefined/null
✓ K2 materiał: bez undefined/null
✓ K2 bez „rozdz.” przy lekcji bez numeru rozdziału
✓ K3 lekcja 1: „✓ Zrobiona · utrwal w Powtórkach”
✓ K3 pasek tylko przy lekcji w trakcie (2), bez starych mierników %
✓ K3 karta przedmiotu: „Opanowanie N%” i „Zrobione lekcje: 1 z 3” i reguła 60/80/100
✓ K3 jeden wynik procentowy (Opanowanie) w karcie przedmiotu i na ścieżce
✓ K3 bez „pkt”, „Lekcje: k z n” i „Umiesz z zakresu” na ekranie przedmiotu
✓ K3 ✓✓ Utrwalona i Opanowana (ikona SVG w kropce)
✓ K3 awatar Stasia przy „Teraz” mieści się w ekranie (360, 390)
✓ K4 rysowanie ścieżki nie woła odbioru (odbiór tylko przyciskiem)
✓ K4 dział 1 zrobiony: przycisk „Odbierz +20” ≥ 44 px
✓ K4 po kliknięciu +20 z bazy (wpis misja:dzial:…:1)
✓ K4 skrzynka działu 1: „Dział 1 zaliczony” i „Odebrane”, ikona otwartej skrzynki
✓ K4 bez drugiego dymka „+20” z emoji
✓ K4 dział 2 (niezrobiony): „Nagroda za dział 2” i ile zostało
✓ K4 po przeładowaniu bez drugiej nagrody i bez przycisku; drugie wywołanie → juz
✓ K4 konsola bez błędów
✓ K4 bez v58 w bazie: ścieżka działa, komunikat zamiast nagrody, bez błędów
✓ K4 lekcja bez zdanego biletu: „Zalicz bilet wyjścia w lekcji 2”, bez przycisku Odbierz
✓ K4 kwota nagrody z bazy (nauka_dzial_cfg): skrzynka pokazuje +25 przy kwocie 25
✓ K4 zgodność SQL ↔ strona: 20 = 20
✓ K4 darmowe: cel w zasięgu „Darmowe lekcje działu: 0/1”
✓ K4 darmowe: skrzynka z przyciskiem zakupu ≥ 44 px
✓ K4 PGlite: v58 2× + testy D1–D7
✓ EN: stany i nagroda po angielsku
✓ EN: bez polskich słów w kursie i karcie przedmiotu (poza tytułami lekcji z treści)
✓ K4 przejście: karta pod banerem już „Zrobione lekcje: 2 z 3”
✓ K4 przejście: po ostatniej lekcji działu baner „Dział 1 zaliczony! Nagroda czeka na ścieżce: +20”
```

## Ruch (nazwa animacji / czas)
- zwykle: `.sk-node.now .sk-dot` h-pop 0.45s · `.g-path2 .sk-node` brak · `.ux5-chest.ux5-fresh .sk-dot (odbiór)` ux5-pop · `konfetti przy odbiorze` 1 elementów
- reduced-motion: `.sk-node.now .sk-dot` none 0s · `.g-path2 .sk-node` brak · `.ux5-chest.ux5-fresh .sk-dot (odbiór)` none · `konfetti przy odbiorze` 0 elementów
- calm: `.sk-node.now .sk-dot` none 0s · `.g-path2 .sk-node` brak · `.ux5-chest.ux5-fresh .sk-dot (odbiór)` none · `konfetti przy odbiorze` 0 elementów

## Wynik testów: 33 ✓ / 0 ✗

## Szczegóły
- przedmiot-w-trakcie-360-jasny · kontrast `SPAN` „Nowe odznaki: 2” 1:1 < 4.5:1
- przedmiot-w-trakcie-360-jasny · cel `BUTTON.back` „←
Przedmioty” 128×36
- przedmiot-dzial-zaliczony-360-jasny · kontrast `SPAN` „Nowe odznaki: 2” 1:1 < 4.5:1
- przedmiot-dzial-zaliczony-360-jasny · cel `BUTTON.back` „←
Przedmioty” 128×36
- przedmiot-darmowe-360-jasny · cel `BUTTON.back` „←
Przedmioty” 128×36
- przedmiot-w-trakcie-360-ciemny · kontrast `SPAN` „Nowe odznaki: 2” 1:1 < 4.5:1
- przedmiot-w-trakcie-360-ciemny · cel `BUTTON.back` „←
Przedmioty” 128×36
- przedmiot-dzial-zaliczony-360-ciemny · kontrast `SPAN` „Nowe odznaki: 2” 1:1 < 4.5:1
- przedmiot-dzial-zaliczony-360-ciemny · cel `BUTTON.back` „←
Przedmioty” 128×36
- przedmiot-darmowe-360-ciemny · cel `BUTTON.back` „←
Przedmioty” 128×36
- przedmiot-w-trakcie-390-jasny · kontrast `SPAN` „Nowe odznaki: 2” 1:1 < 4.5:1
- przedmiot-w-trakcie-390-jasny · cel `BUTTON.back` „←
Przedmioty” 128×36
- przedmiot-dzial-zaliczony-390-jasny · kontrast `SPAN` „Nowe odznaki: 2” 1:1 < 4.5:1
- przedmiot-dzial-zaliczony-390-jasny · cel `BUTTON.back` „←
Przedmioty” 128×36
- przedmiot-darmowe-390-jasny · cel `BUTTON.back` „←
Przedmioty” 128×36
- przedmiot-w-trakcie-390-ciemny · kontrast `SPAN` „Nowe odznaki: 2” 1:1 < 4.5:1
- przedmiot-w-trakcie-390-ciemny · cel `BUTTON.back` „←
Przedmioty” 128×36
- przedmiot-dzial-zaliczony-390-ciemny · kontrast `SPAN` „Nowe odznaki: 2” 1:1 < 4.5:1
- przedmiot-dzial-zaliczony-390-ciemny · cel `BUTTON.back` „←
Przedmioty” 128×36
- przedmiot-darmowe-390-ciemny · cel `BUTTON.back` „←
Przedmioty” 128×36
- przedmiot-w-trakcie-1280-jasny · kontrast `SPAN` „Nowe odznaki: 2” 1:1 < 4.5:1
- przedmiot-w-trakcie-1280-jasny · cel `BUTTON.back` „←
Przedmioty” 128×36
- przedmiot-dzial-zaliczony-1280-jasny · kontrast `SPAN` „Nowe odznaki: 2” 1:1 < 4.5:1
- przedmiot-dzial-zaliczony-1280-jasny · cel `BUTTON.back` „←
Przedmioty” 128×36
- przedmiot-darmowe-1280-jasny · cel `BUTTON.back` „←
Przedmioty” 128×36
- przedmiot-w-trakcie-1280-ciemny · kontrast `SPAN` „Nowe odznaki: 2” 1:1 < 4.5:1
- przedmiot-w-trakcie-1280-ciemny · cel `BUTTON.back` „←
Przedmioty” 128×36
- przedmiot-dzial-zaliczony-1280-ciemny · kontrast `SPAN` „Nowe odznaki: 2” 1:1 < 4.5:1
- przedmiot-dzial-zaliczony-1280-ciemny · cel `BUTTON.back` „←
Przedmioty” 128×36
- przedmiot-w-trakcie-390-en · kontrast `SPAN` „New badges: 2” 1:1 < 4.5:1
- przedmiot-w-trakcie-390-en · cel `BUTTON.back` „←
Subjects” 110×36
- material-390-jasny · kontrast `SPAN` „Nowe odznaki: 2” 1:1 < 4.5:1
- material-390-jasny · cel `BUTTON.back` „←
Analiza matematyczna” 203×36
- material-390-jasny · cel `BUTTON.link` „Ściągawka do druku” 135×21
- material-390-jasny · cel `BUTTON.step` „1
Przeczytaj” 123×34
- material-390-jasny · cel `BUTTON.step` „2
Fiszki” 86×34
- material-390-jasny · cel `BUTTON.step` „3
Quiz” 79×34
- material-390-jasny · cel `BUTTON.btn.ghost` „✓ Przerobione (cofnij)” 193×43
