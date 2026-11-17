# UX-2 · etap 5 · runda 1

Testy etapu: **63 ✓ / 0 ✗** (docs/gry/test/ux2-etap5.mjs)

## Kryteria (asercje)
- ✓ K1 390-jasny: powitanie → karta dnia (hero → linia zadań → Lekcje dla Ciebie) → Twój postęp → „Więcej na dziś”
- ✓ K1 390-jasny: w „Więcej na dziś” Boss (trwa) → Na luzie → nowości; bez Przewodnika i Profilu nauki (konto starsze niż 3 dni)
- ✓ K1 390-jasny: wysokość Dziś (treść bez stopki) ≤ 1800 px
- ✓ K1 390-jasny: bez poziomego przewijania
- ✓ K1 „Więcej na dziś” rozwija Bossa i Na luzie
- ✓ K1 360-ciemny: powitanie → karta dnia (hero → linia zadań → Lekcje dla Ciebie) → Twój postęp → „Więcej na dziś”
- ✓ K1 360-ciemny: w „Więcej na dziś” Boss (trwa) → Na luzie → nowości; bez Przewodnika i Profilu nauki (konto starsze niż 3 dni)
- ✓ K1 360-ciemny: wysokość Dziś (treść bez stopki) ≤ 1800 px
- ✓ K1 360-ciemny: bez poziomego przewijania
- ✓ K1 390-jasny-en: powitanie → karta dnia (hero → linia zadań → Lekcje dla Ciebie) → Twój postęp → „Więcej na dziś”
- ✓ K1 390-jasny-en: w „Więcej na dziś” Boss (trwa) → Na luzie → nowości; bez Przewodnika i Profilu nauki (konto starsze niż 3 dni)
- ✓ K1 390-jasny-en: wysokość Dziś (treść bez stopki) ≤ 1800 px
- ✓ K1 390-jasny-en: bez poziomego przewijania
- ✓ K1 ZD_WEJSCIE.pasekProby() pierwsza pod powitaniem, przed kartą dnia
- ✓ K1 nowe konto (1. dzień): Profil nauki na karcie dnia i Przewodnik w „Więcej na dziś”
- ✓ K1 przyciski zakupu na Dziś (ldBlock, ptsHome, ptsDzis) przez ZD_WEJSCIE.przyciskZakupu z komentarzem // ux-1 (jak na gałęzi pętli 1)
- ✓ K2 360 pl: wszystkie chipy pod „Zaczynamy” w całości w karcie (zawijają się, tekst nieucięty, ≥ 44 px)
- ✓ K2 360 pl: Lekcje dla Ciebie jedna pod drugą (ta sama kolumna, cała szerokość)
- ✓ K2 360 en: wszystkie chipy pod „Zaczynamy” w całości w karcie (zawijają się, tekst nieucięty, ≥ 44 px)
- ✓ K2 360 en: Lekcje dla Ciebie jedna pod drugą (ta sama kolumna, cała szerokość)
- ✓ K2 390 pl: wszystkie chipy pod „Zaczynamy” w całości w karcie (zawijają się, tekst nieucięty, ≥ 44 px)
- ✓ K2 390 pl: Lekcje dla Ciebie jedna pod drugą (ta sama kolumna, cała szerokość)
- ✓ K3 390-jasny: „Zadania dnia: 1/3 · +8 · nowe za H h” z monetą SVG (bez emoji)
- ✓ K3 390-jasny: rozwinięta lista: 3 zadania dnia + zadanie tygodnia; zrobione „Odebrane +8” bez wchodzenia do Sklepu
- ✓ K3 atrapa: nagroda za zrobione zadanie w księdze monet raz (auto-odbiór, bez Sklepu)
- ✓ K3 ZD_NAWYK.zadaniaStan() i zadaniaLinia() dla Sklepu i ekranu końca
- ✓ K3 360-ciemny: „Zadania dnia: 1/3 · +8 · nowe za H h” z monetą SVG (bez emoji)
- ✓ K3 360-ciemny: rozwinięta lista: 3 zadania dnia + zadanie tygodnia; zrobione „Odebrane +8” bez wchodzenia do Sklepu
- ✓ K3 390-jasny-en: „Daily tasks: 1/3 · +8 · new in H h”
- ✓ K3 link z maila ?zadania=1#/ rozwija linię zadań, przewija do niej i czyści adres
- ✓ K3 przypomnienia.js: rodzaj „zadanie” z path „?zadania=1#/” (PL i EN), kopia w funkcji Edge identyczna
- ✓ K3 PGlite v57: 10 dobrych odpowiedzi → +8 bez Sklepu, bez podwójnej nagrody, ręczny odbiór → already
- ✓ K4 390-jasny: „Duet z Kasia: 5/8 w tym tygodniu · Kasia dziś ✓”
- ✓ K4 wiersz duetu otwiera Paczkę i duet
- ✓ K4 360-ciemny: „Duet z Kasia: 5/8 w tym tygodniu · Kasia dziś ✓”
- ✓ K4 390-jasny-en: „Duo with Kasia: 5/8 this week · Kasia today ✓”
- ✓ K4 390-jasny: bez duetu, 4. dzień nauki – zaproszenie „Ucz się w duecie… Wyślij link”
- ✓ K4 „Wyślij link”: zakłada paczkę i wywołuje navigator.share z linkiem ?paczka=KOD; po wysłaniu zaproszenie znika
- ✓ K4 360-ciemny: bez duetu, 4. dzień nauki – zaproszenie „Ucz się w duecie… Wyślij link”
- ✓ K4 390-jasny-en: EN „Study as a duo… Send link”
- ✓ K4 bez navigator.share: link do schowka (kopiuj link)
- ✓ K4 zaproszenie tylko jednego dnia (pokazane wczoraj → dziś brak)
- ✓ K4 przed 3. dniem nauki bez zaproszenia
- ✓ K5 390-jasny: przy przedmiocie z najbliższym terminem „W tym tygodniu: 0 z 1 tematu”
- ✓ K5 390-jasny: przedmiot bez daty – „Znasz datę kolokwium? Wpisz” (z nazwą, gdy przedmiot schowany)
- ✓ K5 „Wpisz” otwiera pole daty (to samo co w „Przygotuj się”: examSet().date)
- ✓ K5 zapis daty: progress.exams[…].date + toast „Plan i przypomnienia ułożą się do …”
- ✓ K5 360-ciemny: przy przedmiocie z najbliższym terminem „W tym tygodniu: 0 z 1 tematu”
- ✓ K5 360-ciemny: przedmiot bez daty – „Znasz datę kolokwium? Wpisz” (z nazwą, gdy przedmiot schowany)
- ✓ K5 390-jasny-en: EN „This week: 0 of 1 topic”
- ✓ K5 starosta (> 3 zaliczenia bez daty): „N zaliczeń bez daty. Uzupełnij, a rok dostanie plan i bossa.” + Terminy
- ✓ K5 link prowadzi do Terminów
- ✓ K5 zwykłe konto: bez linii starosty
- ✓ K6 390-jasny: „Jeszcze nic do powtórki. Zrób dziś kartę 5 minut, a fiszki z niej wrócą tu jutro.” + „Karta 5 minut” + „Wybierz przedmiot”
- ✓ K6 „Karta 5 minut” prowadzi na Dziś i otwiera kartę dnia
- ✓ K6 360-ciemny: „Jeszcze nic do powtórki. Zrób dziś kartę 5 minut, a fiszki z niej wrócą tu jutro.” + „Karta 5 minut” + „Wybierz przedmiot”
- ✓ K6 390-jasny-en: EN „Nothing to review yet… 5-minute card”
- ✓ K6 390-jasny: wersja darmowa – kafelki terminów widoczne, notka „Plan nauki do każdego terminu jest w pełnej wersji.”
- ✓ K6 360-ciemny: wersja darmowa – kafelki terminów widoczne, notka „Plan nauki do każdego terminu jest w pełnej wersji.”
- ✓ K6 390-jasny-en: EN „A study plan for every deadline is in the full version.”
- ✓ ruch: html.calm – ikona Przewodnika bez animacji g-wave
- ✓ testy jednostkowe nawyk + przypomnienia
- ✓ konsola bez błędów (wszystkie stany)

## Pomiary (kontrast każdego tekstu WCAG AA, axe, cele < 44 px, poziome przewijanie, konsola)
| stan | teksty | < AA | tekst < 12 px | axe | cele < 44 px | poziome przewijanie | błędy konsoli |
|---|---|---|---|---|---|---|---|
| K1 Dziś 390-jasny | 81 | 0 | 6 | 0 | 0 | nie | 0 |
| K1 Dziś 360-ciemny | 81 | 0 | 6 | 0 | 0 | nie | 0 |
| K1 Dziś 390-jasny-en | 81 | 0 | 6 | 0 | 0 | nie | 0 |
| K3 linia zadań rozwinięta 390-jasny | 16 | 0 | 0 | 0 | 0 | nie | 0 |
| K3 linia zadań rozwinięta 360-ciemny | 16 | 0 | 0 | 0 | 0 | nie | 0 |
| K3 linia zadań rozwinięta 390-jasny-en | 16 | 0 | 0 | 0 | 0 | nie | 0 |
| K4 zaproszenie do duetu 390-jasny | 5 | 0 | 0 | 0 | 0 | nie | 0 |
| K4 zaproszenie do duetu 360-ciemny | 5 | 0 | 0 | 0 | 0 | nie | 0 |
| K4 zaproszenie do duetu 390-jasny-en | 5 | 0 | 0 | 0 | 0 | nie | 0 |
| K5 Twój postęp 390-jasny | 27 | 0 | 4 | 0 | 0 | nie | 0 |
| K5 Twój postęp 360-ciemny | 27 | 0 | 4 | 0 | 0 | nie | 0 |
| K5 Twój postęp 390-jasny-en | 27 | 0 | 4 | 0 | 0 | nie | 0 |
| K6 pusty stan Powtórek 390-jasny | 5 | 0 | 0 | 0 | 0 | nie | 0 |
| K6 pusty stan Powtórek 360-ciemny | 5 | 0 | 0 | 0 | 0 | nie | 0 |
| K6 pusty stan Powtórek 390-jasny-en | 5 | 0 | 0 | 0 | 0 | nie | 0 |

## Szczegóły naruszeń
- K1 Dziś 390-jasny · kontrast `BUTTON` „Otwórz lekcję” 14.38:1 (wymagane 4.5:1, 0px)
- K1 Dziś 390-jasny · kontrast `BUTTON` „Otwórz lekcję” 14.38:1 (wymagane 4.5:1, 0px)
- K1 Dziś 390-jasny · kontrast `SMALL` „dni” 16.44:1 (wymagane 4.5:1, 9.92px)
- K1 Dziś 390-jasny · kontrast `SPAN` „data szacowana” 8.6:1 (wymagane 4.5:1, 10.24px)
- K1 Dziś 390-jasny · kontrast `SMALL` „dni” 16.44:1 (wymagane 4.5:1, 9.92px)
- K1 Dziś 390-jasny · kontrast `SMALL` „dni” 16.44:1 (wymagane 4.5:1, 9.92px)
- K1 Dziś 360-ciemny · kontrast `BUTTON` „Otwórz lekcję” 12.07:1 (wymagane 4.5:1, 0px)
- K1 Dziś 360-ciemny · kontrast `BUTTON` „Otwórz lekcję” 12.07:1 (wymagane 4.5:1, 0px)
- K1 Dziś 360-ciemny · kontrast `SMALL` „dni” 13.63:1 (wymagane 4.5:1, 9.92px)
- K1 Dziś 360-ciemny · kontrast `SPAN` „data szacowana” 9.53:1 (wymagane 4.5:1, 10.24px)
- K1 Dziś 360-ciemny · kontrast `SMALL` „dni” 13.63:1 (wymagane 4.5:1, 9.92px)
- K1 Dziś 360-ciemny · kontrast `SMALL` „dni” 13.63:1 (wymagane 4.5:1, 9.92px)
- K1 Dziś 390-jasny-en · kontrast `BUTTON` „Open lesson” 14.38:1 (wymagane 4.5:1, 0px)
- K1 Dziś 390-jasny-en · kontrast `BUTTON` „Open lesson” 14.38:1 (wymagane 4.5:1, 0px)
- K1 Dziś 390-jasny-en · kontrast `SMALL` „days” 16.44:1 (wymagane 4.5:1, 9.92px)
- K1 Dziś 390-jasny-en · kontrast `SPAN` „estimated date” 8.6:1 (wymagane 4.5:1, 10.24px)
- K1 Dziś 390-jasny-en · kontrast `SMALL` „days” 16.44:1 (wymagane 4.5:1, 9.92px)
- K1 Dziś 390-jasny-en · kontrast `SMALL` „days” 16.44:1 (wymagane 4.5:1, 9.92px)
- K5 Twój postęp 390-jasny · kontrast `SMALL` „dni” 16.44:1 (wymagane 4.5:1, 9.92px)
- K5 Twój postęp 390-jasny · kontrast `SPAN` „data szacowana” 8.6:1 (wymagane 4.5:1, 10.24px)
- K5 Twój postęp 390-jasny · kontrast `SMALL` „dni” 16.44:1 (wymagane 4.5:1, 9.92px)
- K5 Twój postęp 390-jasny · kontrast `SMALL` „dni” 16.44:1 (wymagane 4.5:1, 9.92px)
- K5 Twój postęp 360-ciemny · kontrast `SMALL` „dni” 13.63:1 (wymagane 4.5:1, 9.92px)
- K5 Twój postęp 360-ciemny · kontrast `SPAN` „data szacowana” 9.53:1 (wymagane 4.5:1, 10.24px)
- K5 Twój postęp 360-ciemny · kontrast `SMALL` „dni” 13.63:1 (wymagane 4.5:1, 9.92px)
- K5 Twój postęp 360-ciemny · kontrast `SMALL` „dni” 13.63:1 (wymagane 4.5:1, 9.92px)
- K5 Twój postęp 390-jasny-en · kontrast `SMALL` „days” 16.44:1 (wymagane 4.5:1, 9.92px)
- K5 Twój postęp 390-jasny-en · kontrast `SPAN` „estimated date” 8.6:1 (wymagane 4.5:1, 10.24px)
- K5 Twój postęp 390-jasny-en · kontrast `SMALL` „days” 16.44:1 (wymagane 4.5:1, 9.92px)
- K5 Twój postęp 390-jasny-en · kontrast `SMALL` „days” 16.44:1 (wymagane 4.5:1, 9.92px)

## Ruch (animationName; przy reduced-motion i html.calm ma być „none”)
- undefined: undefined

Wysokość Dziś 390-jasny (od góry #main do dołu „Więcej na dziś”, bez stopki): 1744 px
Wysokość Dziś 360-ciemny (od góry #main do dołu „Więcej na dziś”, bez stopki): 1785 px
Wysokość Dziś 390-jasny-en (od góry #main do dołu „Więcej na dziś”, bez stopki): 1760 px

## Zrzuty
- k1-dzis-390-jasny.png
- k1-wiecej-otwarte-390-jasny.png
- k1-dzis-360-ciemny.png
- k1-dzis-390-jasny-en.png
- k2-chipy-lekcje-360-pl.png
- k2-chipy-lekcje-360-en.png
- k3-zadania-390-jasny.png
- k3-zadania-360-ciemny.png
- k3-zadania-390-jasny-en.png
- k4-duet-360-ciemny.png
- k4-duet-390-jasny-en.png
- k4-zaproszenie-390-jasny.png
- k4-zaproszenie-360-ciemny.png
- k4-zaproszenie-390-jasny-en.png
- k5-postep-390-jasny.png
- k5-wpisz-date-390-jasny.png
- k5-postep-360-ciemny.png
- k5-postep-390-jasny-en.png
- k6-powtorki-pusto-390-jasny.png
- k6-powtorki-pusto-360-ciemny.png
- k6-powtorki-pusto-390-jasny-en.png
- k6-darmowe-terminy-390-jasny.png
- k6-darmowe-terminy-360-ciemny.png
- k6-darmowe-terminy-390-jasny-en.png
