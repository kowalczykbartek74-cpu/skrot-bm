# UX-5 etap G1 – ścieżka przedmiotu, runda rec2

Data: 2026-11-16T19:26 · BASE http://127.0.0.1:8815/

Kontrast: własny pomiar każdego widocznego tekstu (tekst ≥ 4,5:1, duży ≥ 3:1; tło z przodków; tekst < 12 px też zgłaszany) + axe-core (color-contrast, target-size). Cele dotyku: każdy przycisk/link/pole w #main i #layer ≥ 44×44 px.

| ekran | sprawdzone teksty | teksty < AA / < 12 px | axe | cele < 44 px | poziome przewijanie | błędy konsoli |
|---|---|---|---|---|---|---|
| przedmiot-w-trakcie-360-jasny | 70 | 6 | 0 | 6 | nie | 0 |
| przedmiot-dzial-zaliczony-360-jasny | 71 | 6 | 0 | 6 | nie | 0 |
| przedmiot-darmowe-360-jasny | 69 | 6 | 0 | 6 | nie | 0 |
| przedmiot-w-trakcie-360-ciemny | 70 | 6 | 0 | 6 | nie | 0 |
| przedmiot-dzial-zaliczony-360-ciemny | 71 | 6 | 0 | 6 | nie | 0 |
| przedmiot-darmowe-360-ciemny | 69 | 6 | 0 | 6 | nie | 0 |
| przedmiot-w-trakcie-390-jasny | 70 | 6 | 0 | 6 | nie | 0 |
| przedmiot-dzial-zaliczony-390-jasny | 71 | 6 | 0 | 6 | nie | 0 |
| przedmiot-darmowe-390-jasny | 69 | 6 | 0 | 6 | nie | 0 |
| przedmiot-w-trakcie-390-ciemny | 70 | 6 | 0 | 6 | nie | 0 |
| przedmiot-dzial-zaliczony-390-ciemny | 71 | 6 | 0 | 6 | nie | 0 |
| przedmiot-darmowe-390-ciemny | 69 | 6 | 0 | 6 | nie | 0 |
| przedmiot-w-trakcie-1280-jasny | 72 | 1 | 0 | 6 | nie | 0 |
| przedmiot-dzial-zaliczony-1280-jasny | 73 | 1 | 0 | 6 | nie | 0 |
| przedmiot-darmowe-1280-jasny | 71 | 1 | 0 | 6 | nie | 0 |
| przedmiot-w-trakcie-1280-ciemny | 72 | 1 | 0 | 6 | nie | 0 |
| przedmiot-dzial-zaliczony-1280-ciemny | 73 | 1 | 0 | 6 | nie | 0 |
| przedmiot-w-trakcie-390-en | 69 | 6 | 0 | 6 | nie | 0 |
| material-390-jasny | 77 | 5 | 0 | 14 | nie | 0 |

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
✓ K3 karta przedmiotu: „Opanowanie N%” i „1 z 3 lekcji zrobione”
✓ K3 jeden procent w karcie przedmiotu i na ścieżce
✓ K3 bez „pkt”, „Lekcje: k z n” i „Umiesz z zakresu” na ekranie przedmiotu
✓ K3 ✓✓ Utrwalona i Opanowana (ikona SVG w kropce)
✓ K3 awatar Stasia przy „Teraz” mieści się w ekranie (360, 390)
✓ K4 rysowanie ścieżki nie woła bazy (odbiór tylko przyciskiem)
✓ K4 dział 1 zrobiony: przycisk „Odbierz +20” ≥ 44 px
✓ K4 po kliknięciu +20 z bazy (wpis misja:dzial:…:1)
✓ K4 skrzynka działu 1: „Dział 1 zaliczony” i „Odebrane”, ikona otwartej skrzynki
✓ K4 bez drugiego dymka „+20” z emoji
✓ K4 dział 2 (niezrobiony): „Nagroda za dział 2” i ile zostało
✓ K4 po przeładowaniu bez drugiej nagrody i bez przycisku; drugie wywołanie → juz
✓ K4 konsola bez błędów
✓ K4 bez v58 w bazie: ścieżka działa, komunikat zamiast nagrody, bez błędów
✓ K4 darmowe: skrzynka z przyciskiem zakupu ≥ 44 px
✓ K4 PGlite: v58 2× + testy D1–D7
✓ EN: stany i nagroda po angielsku
✓ EN: bez polskich słów w kursie i karcie przedmiotu (poza tytułami lekcji z treści)
✓ K4 przejście: po ostatniej lekcji działu baner „Dział 1 zaliczony! Nagroda czeka na ścieżce: +20”
```

## Ruch (nazwa animacji / czas)
- zwykle: `.sk-node.now .sk-dot` h-pop 0.45s · `.g-path2 .sk-node` brak · `.lp-banner` brak
- reduced-motion: `.sk-node.now .sk-dot` none 0s · `.g-path2 .sk-node` brak · `.lp-banner` brak
- calm: `.sk-node.now .sk-dot` none 0s · `.g-path2 .sk-node` brak · `.lp-banner` brak

## Wynik testów: 28 ✓ / 0 ✗

## Szczegóły
- przedmiot-w-trakcie-360-jasny · kontrast `SPAN` „Dziś” 16.79:1 (11.84 px)
- przedmiot-w-trakcie-360-jasny · kontrast `SPAN` „Przedmioty” 8.32:1 (11.84 px)
- przedmiot-w-trakcie-360-jasny · kontrast `SPAN` „Powtórki” 16.79:1 (11.84 px)
- przedmiot-w-trakcie-360-jasny · kontrast `SPAN` „Terminy” 16.79:1 (11.84 px)
- przedmiot-w-trakcie-360-jasny · kontrast `SPAN` „Kalendarz” 16.79:1 (11.84 px)
- przedmiot-w-trakcie-360-jasny · kontrast `SPAN` „Teraz” 12.88:1 (11.84 px)
- przedmiot-w-trakcie-360-jasny · cel `BUTTON.back` „←
Przedmioty” 127×36
- przedmiot-w-trakcie-360-jasny · cel `A` „Plan zajęć (za darmo)” 133×21
- przedmiot-w-trakcie-360-jasny · cel `A` „Skrzynka do opiekunki roku” 174×21
- przedmiot-w-trakcie-360-jasny · cel `A` „Regulamin” 67×21
- przedmiot-w-trakcie-360-jasny · cel `A` „Polityka prywatności” 133×21
- przedmiot-w-trakcie-360-jasny · cel `A` „Kontakt” 51×21
- przedmiot-dzial-zaliczony-360-jasny · kontrast `SPAN` „Dziś” 16.79:1 (11.84 px)
- przedmiot-dzial-zaliczony-360-jasny · kontrast `SPAN` „Przedmioty” 8.32:1 (11.84 px)
- przedmiot-dzial-zaliczony-360-jasny · kontrast `SPAN` „Powtórki” 16.79:1 (11.84 px)
- przedmiot-dzial-zaliczony-360-jasny · kontrast `SPAN` „Terminy” 16.79:1 (11.84 px)
- przedmiot-dzial-zaliczony-360-jasny · kontrast `SPAN` „Kalendarz” 16.79:1 (11.84 px)
- przedmiot-dzial-zaliczony-360-jasny · kontrast `SPAN` „Teraz” 12.88:1 (11.84 px)
- przedmiot-dzial-zaliczony-360-jasny · cel `BUTTON.back` „←
Przedmioty” 127×36
- przedmiot-dzial-zaliczony-360-jasny · cel `A` „Plan zajęć (za darmo)” 133×21
- przedmiot-dzial-zaliczony-360-jasny · cel `A` „Skrzynka do opiekunki roku” 174×21
- przedmiot-dzial-zaliczony-360-jasny · cel `A` „Regulamin” 67×21
- przedmiot-dzial-zaliczony-360-jasny · cel `A` „Polityka prywatności” 133×21
- przedmiot-dzial-zaliczony-360-jasny · cel `A` „Kontakt” 51×21
- przedmiot-darmowe-360-jasny · kontrast `SPAN` „Dziś” 16.79:1 (11.84 px)
- przedmiot-darmowe-360-jasny · kontrast `SPAN` „Przedmioty” 8.32:1 (11.84 px)
- przedmiot-darmowe-360-jasny · kontrast `SPAN` „Powtórki” 16.79:1 (11.84 px)
- przedmiot-darmowe-360-jasny · kontrast `SPAN` „Terminy” 16.79:1 (11.84 px)
- przedmiot-darmowe-360-jasny · kontrast `SPAN` „Kalendarz” 16.79:1 (11.84 px)
- przedmiot-darmowe-360-jasny · kontrast `SPAN` „Teraz” 12.88:1 (11.84 px)
- przedmiot-darmowe-360-jasny · cel `BUTTON.back` „←
Przedmioty” 127×36
- przedmiot-darmowe-360-jasny · cel `A` „Plan zajęć (za darmo)” 133×21
- przedmiot-darmowe-360-jasny · cel `A` „Skrzynka do opiekunki roku” 174×21
- przedmiot-darmowe-360-jasny · cel `A` „Regulamin” 67×21
- przedmiot-darmowe-360-jasny · cel `A` „Polityka prywatności” 133×21
- przedmiot-darmowe-360-jasny · cel `A` „Kontakt” 51×21
- przedmiot-w-trakcie-360-ciemny · kontrast `SPAN` „Dziś” 11.3:1 (11.84 px)
- przedmiot-w-trakcie-360-ciemny · kontrast `SPAN` „Przedmioty” 10.29:1 (11.84 px)
- przedmiot-w-trakcie-360-ciemny · kontrast `SPAN` „Powtórki” 11.3:1 (11.84 px)
- przedmiot-w-trakcie-360-ciemny · kontrast `SPAN` „Terminy” 11.3:1 (11.84 px)
- przedmiot-w-trakcie-360-ciemny · kontrast `SPAN` „Kalendarz” 11.3:1 (11.84 px)
- przedmiot-w-trakcie-360-ciemny · kontrast `SPAN` „Teraz” 12.88:1 (11.84 px)
- przedmiot-w-trakcie-360-ciemny · cel `BUTTON.back` „←
Przedmioty” 127×36
- przedmiot-w-trakcie-360-ciemny · cel `A` „Plan zajęć (za darmo)” 133×21
- przedmiot-w-trakcie-360-ciemny · cel `A` „Skrzynka do opiekunki roku” 174×21
- przedmiot-w-trakcie-360-ciemny · cel `A` „Regulamin” 67×21
- przedmiot-w-trakcie-360-ciemny · cel `A` „Polityka prywatności” 133×21
- przedmiot-w-trakcie-360-ciemny · cel `A` „Kontakt” 51×21
- przedmiot-dzial-zaliczony-360-ciemny · kontrast `SPAN` „Dziś” 11.3:1 (11.84 px)
- przedmiot-dzial-zaliczony-360-ciemny · kontrast `SPAN` „Przedmioty” 10.29:1 (11.84 px)
- przedmiot-dzial-zaliczony-360-ciemny · kontrast `SPAN` „Powtórki” 11.3:1 (11.84 px)
- przedmiot-dzial-zaliczony-360-ciemny · kontrast `SPAN` „Terminy” 11.3:1 (11.84 px)
- przedmiot-dzial-zaliczony-360-ciemny · kontrast `SPAN` „Kalendarz” 11.3:1 (11.84 px)
- przedmiot-dzial-zaliczony-360-ciemny · kontrast `SPAN` „Teraz” 12.88:1 (11.84 px)
- przedmiot-dzial-zaliczony-360-ciemny · cel `BUTTON.back` „←
Przedmioty” 127×36
- przedmiot-dzial-zaliczony-360-ciemny · cel `A` „Plan zajęć (za darmo)” 133×21
- przedmiot-dzial-zaliczony-360-ciemny · cel `A` „Skrzynka do opiekunki roku” 174×21
- przedmiot-dzial-zaliczony-360-ciemny · cel `A` „Regulamin” 67×21
- przedmiot-dzial-zaliczony-360-ciemny · cel `A` „Polityka prywatności” 133×21
- przedmiot-dzial-zaliczony-360-ciemny · cel `A` „Kontakt” 51×21
- przedmiot-darmowe-360-ciemny · kontrast `SPAN` „Dziś” 11.3:1 (11.84 px)
- przedmiot-darmowe-360-ciemny · kontrast `SPAN` „Przedmioty” 10.29:1 (11.84 px)
- przedmiot-darmowe-360-ciemny · kontrast `SPAN` „Powtórki” 11.3:1 (11.84 px)
- przedmiot-darmowe-360-ciemny · kontrast `SPAN` „Terminy” 11.3:1 (11.84 px)
- przedmiot-darmowe-360-ciemny · kontrast `SPAN` „Kalendarz” 11.3:1 (11.84 px)
- przedmiot-darmowe-360-ciemny · kontrast `SPAN` „Teraz” 12.88:1 (11.84 px)
- przedmiot-darmowe-360-ciemny · cel `BUTTON.back` „←
Przedmioty” 127×36
- przedmiot-darmowe-360-ciemny · cel `A` „Plan zajęć (za darmo)” 133×21
- przedmiot-darmowe-360-ciemny · cel `A` „Skrzynka do opiekunki roku” 174×21
- przedmiot-darmowe-360-ciemny · cel `A` „Regulamin” 67×21
- przedmiot-darmowe-360-ciemny · cel `A` „Polityka prywatności” 133×21
- przedmiot-darmowe-360-ciemny · cel `A` „Kontakt” 51×21
- przedmiot-w-trakcie-390-jasny · kontrast `SPAN` „Dziś” 16.79:1 (11.84 px)
- przedmiot-w-trakcie-390-jasny · kontrast `SPAN` „Przedmioty” 8.32:1 (11.84 px)
- przedmiot-w-trakcie-390-jasny · kontrast `SPAN` „Powtórki” 16.79:1 (11.84 px)
- przedmiot-w-trakcie-390-jasny · kontrast `SPAN` „Terminy” 16.79:1 (11.84 px)
- przedmiot-w-trakcie-390-jasny · kontrast `SPAN` „Kalendarz” 16.79:1 (11.84 px)
- przedmiot-w-trakcie-390-jasny · kontrast `SPAN` „Teraz” 12.88:1 (11.84 px)
- przedmiot-w-trakcie-390-jasny · cel `BUTTON.back` „←
Przedmioty” 127×36
- przedmiot-w-trakcie-390-jasny · cel `A` „Plan zajęć (za darmo)” 133×21
- przedmiot-w-trakcie-390-jasny · cel `A` „Skrzynka do opiekunki roku” 174×21
- przedmiot-w-trakcie-390-jasny · cel `A` „Regulamin” 67×21
- przedmiot-w-trakcie-390-jasny · cel `A` „Polityka prywatności” 133×21
- przedmiot-w-trakcie-390-jasny · cel `A` „Kontakt” 51×21
- przedmiot-dzial-zaliczony-390-jasny · kontrast `SPAN` „Dziś” 16.79:1 (11.84 px)
- przedmiot-dzial-zaliczony-390-jasny · kontrast `SPAN` „Przedmioty” 8.32:1 (11.84 px)
- przedmiot-dzial-zaliczony-390-jasny · kontrast `SPAN` „Powtórki” 16.79:1 (11.84 px)
- przedmiot-dzial-zaliczony-390-jasny · kontrast `SPAN` „Terminy” 16.79:1 (11.84 px)
- przedmiot-dzial-zaliczony-390-jasny · kontrast `SPAN` „Kalendarz” 16.79:1 (11.84 px)
- przedmiot-dzial-zaliczony-390-jasny · kontrast `SPAN` „Teraz” 12.88:1 (11.84 px)
- przedmiot-dzial-zaliczony-390-jasny · cel `BUTTON.back` „←
Przedmioty” 127×36
- przedmiot-dzial-zaliczony-390-jasny · cel `A` „Plan zajęć (za darmo)” 133×21
- przedmiot-dzial-zaliczony-390-jasny · cel `A` „Skrzynka do opiekunki roku” 174×21
- przedmiot-dzial-zaliczony-390-jasny · cel `A` „Regulamin” 67×21
- przedmiot-dzial-zaliczony-390-jasny · cel `A` „Polityka prywatności” 133×21
- przedmiot-dzial-zaliczony-390-jasny · cel `A` „Kontakt” 51×21
- przedmiot-darmowe-390-jasny · kontrast `SPAN` „Dziś” 16.79:1 (11.84 px)
- przedmiot-darmowe-390-jasny · kontrast `SPAN` „Przedmioty” 8.32:1 (11.84 px)
- przedmiot-darmowe-390-jasny · kontrast `SPAN` „Powtórki” 16.79:1 (11.84 px)
- przedmiot-darmowe-390-jasny · kontrast `SPAN` „Terminy” 16.79:1 (11.84 px)
- przedmiot-darmowe-390-jasny · kontrast `SPAN` „Kalendarz” 16.79:1 (11.84 px)
- przedmiot-darmowe-390-jasny · kontrast `SPAN` „Teraz” 12.88:1 (11.84 px)
- przedmiot-darmowe-390-jasny · cel `BUTTON.back` „←
Przedmioty” 127×36
- przedmiot-darmowe-390-jasny · cel `A` „Plan zajęć (za darmo)” 133×21
- przedmiot-darmowe-390-jasny · cel `A` „Skrzynka do opiekunki roku” 174×21
- przedmiot-darmowe-390-jasny · cel `A` „Regulamin” 67×21
- przedmiot-darmowe-390-jasny · cel `A` „Polityka prywatności” 133×21
- przedmiot-darmowe-390-jasny · cel `A` „Kontakt” 51×21
- przedmiot-w-trakcie-390-ciemny · kontrast `SPAN` „Dziś” 11.3:1 (11.84 px)
- przedmiot-w-trakcie-390-ciemny · kontrast `SPAN` „Przedmioty” 10.29:1 (11.84 px)
- przedmiot-w-trakcie-390-ciemny · kontrast `SPAN` „Powtórki” 11.3:1 (11.84 px)
- przedmiot-w-trakcie-390-ciemny · kontrast `SPAN` „Terminy” 11.3:1 (11.84 px)
- przedmiot-w-trakcie-390-ciemny · kontrast `SPAN` „Kalendarz” 11.3:1 (11.84 px)
- przedmiot-w-trakcie-390-ciemny · kontrast `SPAN` „Teraz” 12.88:1 (11.84 px)
- przedmiot-w-trakcie-390-ciemny · cel `BUTTON.back` „←
Przedmioty” 127×36
- przedmiot-w-trakcie-390-ciemny · cel `A` „Plan zajęć (za darmo)” 133×21
- przedmiot-w-trakcie-390-ciemny · cel `A` „Skrzynka do opiekunki roku” 174×21
- przedmiot-w-trakcie-390-ciemny · cel `A` „Regulamin” 67×21
- przedmiot-w-trakcie-390-ciemny · cel `A` „Polityka prywatności” 133×21
- przedmiot-w-trakcie-390-ciemny · cel `A` „Kontakt” 51×21
- przedmiot-dzial-zaliczony-390-ciemny · kontrast `SPAN` „Dziś” 11.3:1 (11.84 px)
- przedmiot-dzial-zaliczony-390-ciemny · kontrast `SPAN` „Przedmioty” 10.29:1 (11.84 px)
- przedmiot-dzial-zaliczony-390-ciemny · kontrast `SPAN` „Powtórki” 11.3:1 (11.84 px)
- przedmiot-dzial-zaliczony-390-ciemny · kontrast `SPAN` „Terminy” 11.3:1 (11.84 px)
- przedmiot-dzial-zaliczony-390-ciemny · kontrast `SPAN` „Kalendarz” 11.3:1 (11.84 px)
- przedmiot-dzial-zaliczony-390-ciemny · kontrast `SPAN` „Teraz” 12.88:1 (11.84 px)
- przedmiot-dzial-zaliczony-390-ciemny · cel `BUTTON.back` „←
Przedmioty” 127×36
- przedmiot-dzial-zaliczony-390-ciemny · cel `A` „Plan zajęć (za darmo)” 133×21
- przedmiot-dzial-zaliczony-390-ciemny · cel `A` „Skrzynka do opiekunki roku” 174×21
- przedmiot-dzial-zaliczony-390-ciemny · cel `A` „Regulamin” 67×21
- przedmiot-dzial-zaliczony-390-ciemny · cel `A` „Polityka prywatności” 133×21
- przedmiot-dzial-zaliczony-390-ciemny · cel `A` „Kontakt” 51×21
- przedmiot-darmowe-390-ciemny · kontrast `SPAN` „Dziś” 11.3:1 (11.84 px)
- przedmiot-darmowe-390-ciemny · kontrast `SPAN` „Przedmioty” 10.29:1 (11.84 px)
- przedmiot-darmowe-390-ciemny · kontrast `SPAN` „Powtórki” 11.3:1 (11.84 px)
- przedmiot-darmowe-390-ciemny · kontrast `SPAN` „Terminy” 11.3:1 (11.84 px)
- przedmiot-darmowe-390-ciemny · kontrast `SPAN` „Kalendarz” 11.3:1 (11.84 px)
- przedmiot-darmowe-390-ciemny · kontrast `SPAN` „Teraz” 12.88:1 (11.84 px)
- przedmiot-darmowe-390-ciemny · cel `BUTTON.back` „←
Przedmioty” 127×36
- przedmiot-darmowe-390-ciemny · cel `A` „Plan zajęć (za darmo)” 133×21
- przedmiot-darmowe-390-ciemny · cel `A` „Skrzynka do opiekunki roku” 174×21
- przedmiot-darmowe-390-ciemny · cel `A` „Regulamin” 67×21
- przedmiot-darmowe-390-ciemny · cel `A` „Polityka prywatności” 133×21
- przedmiot-darmowe-390-ciemny · cel `A` „Kontakt” 51×21
- przedmiot-w-trakcie-1280-jasny · kontrast `SPAN` „Teraz” 12.88:1 (11.84 px)
- przedmiot-w-trakcie-1280-jasny · cel `BUTTON.back` „←
Przedmioty” 127×36
- przedmiot-w-trakcie-1280-jasny · cel `A` „Plan zajęć (za darmo)” 133×21
- przedmiot-w-trakcie-1280-jasny · cel `A` „Skrzynka do opiekunki roku” 174×21
- przedmiot-w-trakcie-1280-jasny · cel `A` „Regulamin” 67×21
- przedmiot-w-trakcie-1280-jasny · cel `A` „Polityka prywatności” 133×21
- przedmiot-w-trakcie-1280-jasny · cel `A` „Kontakt” 51×21
- przedmiot-dzial-zaliczony-1280-jasny · kontrast `SPAN` „Teraz” 12.88:1 (11.84 px)
- przedmiot-dzial-zaliczony-1280-jasny · cel `BUTTON.back` „←
Przedmioty” 127×36
- przedmiot-dzial-zaliczony-1280-jasny · cel `A` „Plan zajęć (za darmo)” 133×21
- przedmiot-dzial-zaliczony-1280-jasny · cel `A` „Skrzynka do opiekunki roku” 174×21
- przedmiot-dzial-zaliczony-1280-jasny · cel `A` „Regulamin” 67×21
- przedmiot-dzial-zaliczony-1280-jasny · cel `A` „Polityka prywatności” 133×21
- przedmiot-dzial-zaliczony-1280-jasny · cel `A` „Kontakt” 51×21
- przedmiot-darmowe-1280-jasny · kontrast `SPAN` „Teraz” 12.88:1 (11.84 px)
- przedmiot-darmowe-1280-jasny · cel `BUTTON.back` „←
Przedmioty” 127×36
- przedmiot-darmowe-1280-jasny · cel `A` „Plan zajęć (za darmo)” 133×21
- przedmiot-darmowe-1280-jasny · cel `A` „Skrzynka do opiekunki roku” 174×21
- przedmiot-darmowe-1280-jasny · cel `A` „Regulamin” 67×21
- przedmiot-darmowe-1280-jasny · cel `A` „Polityka prywatności” 133×21
- przedmiot-darmowe-1280-jasny · cel `A` „Kontakt” 51×21
- przedmiot-w-trakcie-1280-ciemny · kontrast `SPAN` „Teraz” 12.88:1 (11.84 px)
- przedmiot-w-trakcie-1280-ciemny · cel `BUTTON.back` „←
Przedmioty” 127×36
- przedmiot-w-trakcie-1280-ciemny · cel `A` „Plan zajęć (za darmo)” 133×21
- przedmiot-w-trakcie-1280-ciemny · cel `A` „Skrzynka do opiekunki roku” 174×21
- przedmiot-w-trakcie-1280-ciemny · cel `A` „Regulamin” 67×21
- przedmiot-w-trakcie-1280-ciemny · cel `A` „Polityka prywatności” 133×21
- przedmiot-w-trakcie-1280-ciemny · cel `A` „Kontakt” 51×21
- przedmiot-dzial-zaliczony-1280-ciemny · kontrast `SPAN` „Teraz” 12.88:1 (11.84 px)
- przedmiot-dzial-zaliczony-1280-ciemny · cel `BUTTON.back` „←
Przedmioty” 127×36
- przedmiot-dzial-zaliczony-1280-ciemny · cel `A` „Plan zajęć (za darmo)” 133×21
- przedmiot-dzial-zaliczony-1280-ciemny · cel `A` „Skrzynka do opiekunki roku” 174×21
- przedmiot-dzial-zaliczony-1280-ciemny · cel `A` „Regulamin” 67×21
- przedmiot-dzial-zaliczony-1280-ciemny · cel `A` „Polityka prywatności” 133×21
- przedmiot-dzial-zaliczony-1280-ciemny · cel `A` „Kontakt” 51×21
- przedmiot-w-trakcie-390-en · kontrast `SPAN` „Today” 16.79:1 (11.84 px)
- przedmiot-w-trakcie-390-en · kontrast `SPAN` „Subjects” 8.32:1 (11.84 px)
- przedmiot-w-trakcie-390-en · kontrast `SPAN` „Reviews” 16.79:1 (11.84 px)
- przedmiot-w-trakcie-390-en · kontrast `SPAN` „Deadlines” 16.79:1 (11.84 px)
- przedmiot-w-trakcie-390-en · kontrast `SPAN` „Calendar” 16.79:1 (11.84 px)
- przedmiot-w-trakcie-390-en · kontrast `SPAN` „Now” 12.88:1 (11.84 px)
- przedmiot-w-trakcie-390-en · cel `BUTTON.back` „←
Subjects” 109×36
- przedmiot-w-trakcie-390-en · cel `A` „Timetable (free)” 102×21
- przedmiot-w-trakcie-390-en · cel `A` „Message box for the year supervisor” 229×21
- przedmiot-w-trakcie-390-en · cel `A` „Terms of service” 103×21
- przedmiot-w-trakcie-390-en · cel `A` „Privacy policy” 89×21
- przedmiot-w-trakcie-390-en · cel `A` „Contact” 53×21
- material-390-jasny · kontrast `SPAN` „Dziś” 16.79:1 (11.84 px)
- material-390-jasny · kontrast `SPAN` „Przedmioty” 8.32:1 (11.84 px)
- material-390-jasny · kontrast `SPAN` „Powtórki” 16.79:1 (11.84 px)
- material-390-jasny · kontrast `SPAN` „Terminy” 16.79:1 (11.84 px)
- material-390-jasny · kontrast `SPAN` „Kalendarz” 16.79:1 (11.84 px)
- material-390-jasny · cel `BUTTON.back` „←
Analiza matematyczna” 202×36
- material-390-jasny · cel `BUTTON.link` „Ściągawka do druku” 135×21
- material-390-jasny · cel `BUTTON.step` „1
Przeczytaj” 123×34
- material-390-jasny · cel `BUTTON.step` „2
Fiszki” 86×34
- material-390-jasny · cel `BUTTON.step` „3
Quiz” 79×34
- material-390-jasny · cel `BUTTON` „Normalnie · EN” 125×36
- material-390-jasny · cel `BUTTON` „Prościej · PL” 108×36
- material-390-jasny · cel `SUMMARY` „Odpowiedź” 324×23
- material-390-jasny · cel `BUTTON.btn.ghost` „✓ Przerobione (cofnij)” 193×43
- material-390-jasny · cel `A` „Plan zajęć (za darmo)” 133×21
- material-390-jasny · cel `A` „Skrzynka do opiekunki roku” 174×21
- material-390-jasny · cel `A` „Regulamin” 67×21
- material-390-jasny · cel `A` „Polityka prywatności” 133×21
- material-390-jasny · cel `A` „Kontakt” 51×21
