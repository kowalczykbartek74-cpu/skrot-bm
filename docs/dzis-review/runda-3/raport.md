# Dziś – runda 3

Limit „Twój postęp”: ≤ 520 px przy 375, ≤ 380 px przy 1280. Kontrast: własny pomiar każdego widocznego tekstu strony (tekst ≥ 4,5:1, duży ≥ 3:1; tło z przodków, gradient = najgorszy kolor) + axe-core (color-contrast, target-size). Pominięty tylko #skrot-wm: celowy znak wodny z adresem konta (aria-hidden, przezroczystość 0,22, ochrona przed wyciekiem treści).

| przypadek | wys. „Twój postęp” | Hasło dnia | poziome przewijanie | sprawdzone teksty | teksty < AA | axe | cele < 44 px | błędy konsoli |
|---|---|---|---|---|---|---|---|---|
| starosta-375-jasny | 463 px | nie | nie | 297 | 0 | 0 | 0 | 0 |
| starosta-375-ciemny | 463 px | nie | nie | 297 | 0 | 0 | 0 | 0 |
| starosta-1280-jasny | 264 px | nie | nie | 303 | 0 | 0 | 0 | 0 |
| starosta-1280-ciemny | 264 px | nie | nie | 303 | 0 | 0 | 0 | 0 |
| platne-375-jasny | 463 px | nie | nie | 99 | 0 | 0 | 0 | 0 |
| platne-375-ciemny | 463 px | nie | nie | 99 | 0 | 0 | 0 | 0 |
| platne-1280-jasny | 264 px | nie | nie | 101 | 0 | 0 | 0 | 0 |
| platne-1280-ciemny | 264 px | nie | nie | 101 | 0 | 0 | 0 | 0 |

(starosta: liczby obejmują też warianty panelu calm i warn)

## Ruch (375 px, konto zwykłe)
- zwykle: wejście kafelka terminu dz-in, wiersza dz-in, karty lekcji dz-in, ekranu h-rise; przejście karty lekcji: transform, box-shadow 0.2s, 0.2s; kafelka: transform, box-shadow 0.2s, 0.2s
- reduced-motion: wejście kafelka terminu none, wiersza none, karty lekcji none, ekranu none; przejście karty lekcji: none 0s; kafelka: none 0s
- Mniej animacji (html.calm): wejście kafelka terminu none, wiersza none, karty lekcji none, ekranu none; przejście karty lekcji: none 0s; kafelka: none 0s

## Cele dotyku < 44 px (szczegóły)

## Poziome przewijanie (konto zwykłe)
- 360 px jasny: nie
- 360 px ciemny: nie
- 375 px jasny: nie
- 375 px ciemny: nie

## EN
- teksty z polskimi słowami/znakami: ["Staś"]
- axe: 0
- błędy konsoli: 0

## Motywy ze sklepu (375 px, axe)
- pink: sprawdzone teksty 104; 0 naruszeń; cele < 44 px: 0; Hasło dnia: nie; przewijanie: nie; błędy: 0
- bow: sprawdzone teksty 104; 0 naruszeń; cele < 44 px: 0; Hasło dnia: nie; przewijanie: nie; błędy: 0
- lilia: sprawdzone teksty 104; 0 naruszeń; cele < 44 px: 0; Hasło dnia: nie; przewijanie: nie; błędy: 0
- meadow: sprawdzone teksty 104; 0 naruszeń; cele < 44 px: 0; Hasło dnia: nie; przewijanie: nie; błędy: 0
- sea: sprawdzone teksty 103; 0 naruszeń; cele < 44 px: 0; Hasło dnia: nie; przewijanie: nie; błędy: 0
- noc: sprawdzone teksty 103; 0 naruszeń; cele < 44 px: 0; Hasło dnia: nie; przewijanie: nie; błędy: 0
- riwiera: sprawdzone teksty 104; 0 naruszeń; cele < 44 px: 0; Hasło dnia: nie; przewijanie: nie; błędy: 0
- klub: sprawdzone teksty 104; 0 naruszeń; cele < 44 px: 0; Hasło dnia: nie; przewijanie: nie; błędy: 0

## Szczegóły naruszeń axe
