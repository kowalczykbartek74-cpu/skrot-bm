# UX-2 · etap 4 · runda 2

Testy etapu: **63 ✓ / 0 ✗** (docs/gry/test/ux2-etap4.mjs)

## Kryteria (asercje)
- ✓ K1 390-jasny: przed skończoną kartą dnia – brak propozycji
- ✓ K1 390-jasny: „Przypomnieć Ci jutro o 16:30?” (godzina z planu, pełne 30 min, ≤ 21:00), opis i „Tak, przypominaj” / „Nie teraz”
- ✓ K1 „Tak” włącza przypomnienia z godziną z planu
- ✓ K1 po włączeniu propozycja znika
- ✓ K1 360-jasny: przed skończoną kartą dnia – brak propozycji
- ✓ K1 360-jasny: „Przypomnieć Ci jutro o 16:30?” (godzina z planu, pełne 30 min, ≤ 21:00), opis i „Tak, przypominaj” / „Nie teraz”
- ✓ K1 390-ciemny: przed skończoną kartą dnia – brak propozycji
- ✓ K1 390-ciemny: „Przypomnieć Ci jutro o 16:30?” (godzina z planu, pełne 30 min, ≤ 21:00), opis i „Tak, przypominaj” / „Nie teraz”
- ✓ K1 390-jasny-en: przed skończoną kartą dnia – brak propozycji
- ✓ K1 EN: „Remind you tomorrow at 4:30 pm?” (godzina po angielsku) / „Yes, remind me”
- ✓ K1 „Nie teraz” chowa propozycję na dziś
- ✓ K1 trzecie „Nie teraz” → propozycja wraca dopiero za 30 dni
- ✓ K1 propozycja najwyżej raz dziennie (już pokazana dziś na innym ekranie → brak)
- ✓ K1 konto bez dostępu: brak propozycji
- ✓ K1 przypomnienia już włączone: brak propozycji
- ✓ K1 godzina z planu: test jednostkowy (koniec + 60, w górę do 30 min, ≤ 21:00, bez planu 18:00)
- ✓ K2 390-jasny: bez zaliczenia w 14 dni, po 1 dniu nauki – „Przypomnieć Ci mailem?” z godziną z planu
- ✓ K2 390-jasny: nic poza ekranem
- ✓ K2 390-jasny: karta tuż pod kartą dnia (wyżej na Dziś), zielony przycisk ≥ 48 px
- ✓ K2 „Nie teraz” chowa kartę (30 dni)
- ✓ K2 360-ciemny: bez zaliczenia w 14 dni, po 1 dniu nauki – „Przypomnieć Ci mailem?” z godziną z planu
- ✓ K2 360-ciemny: nic poza ekranem
- ✓ K2 360-ciemny: karta tuż pod kartą dnia (wyżej na Dziś), zielony przycisk ≥ 48 px
- ✓ K2 EN: „Get an email reminder?” (istniejące tłumaczenie) z godziną
- ✓ K2 390-jasny-en: nic poza ekranem
- ✓ K2 390-jasny-en: karta tuż pod kartą dnia (wyżej na Dziś), zielony przycisk ≥ 48 px
- ✓ K2 przy serii: powód „Żeby nie zgubić serii 6 dni.”
- ✓ K2 karta z zaliczeniem: opis z tą samą godziną, którą zapisze „Włącz” (nie zawsze 18:00)
- ✓ K2 przed pierwszym dniem nauki: bez karty przypomnień
- ✓ K3 tests/przypomnienia.test.js (rodzaj „seria”, warianty A/B/C, rotacja, studiedToday → null, termin pierwszy)
- ✓ K3/K4 PGlite v57: historia z rodzajem (seria_x), flaga kalendarza
- ✓ K3 funkcja Edge zapisuje wariant w rodzaju logu („seria_b”)
- ✓ K4 tests/kalendarz.test.js: złoty plik, UID-y @skrotbm.pl bez zmian, wpis nauki tylko po włączeniu, VALARM, Zdawalni
- ✓ K4 różnica złotego pliku .ics: tylko linie z nazwą (PRODID, X-WR-CALNAME, opisy), bez UID
- ✓ K4 jednorazowe .ics (termIcs): PRODID Zdawalni
- ✓ K4 390-jasny: w oknie „Kalendarz w telefonie” przełącznik „Przypominaj o 5 minutach po zajęciach”, domyślnie wyłączony
- ✓ K4 390-jasny: przełącznik nad przyciskami Google/Apple/Outlook
- ✓ K4 włączenie zapisuje progress.calStudy = true
- ✓ K4 po przełączeniu potwierdzenie „Zapisano. Wpisy pojawią się…”
- ✓ K4 360-jasny: w oknie „Kalendarz w telefonie” przełącznik „Przypominaj o 5 minutach po zajęciach”, domyślnie wyłączony
- ✓ K4 360-jasny: przełącznik nad przyciskami Google/Apple/Outlook
- ✓ K4 390-ciemny: w oknie „Kalendarz w telefonie” przełącznik „Przypominaj o 5 minutach po zajęciach”, domyślnie wyłączony
- ✓ K4 390-ciemny: przełącznik nad przyciskami Google/Apple/Outlook
- ✓ K4 EN: „Remind me about 5 minutes after class”
- ✓ K4 390-jasny-en: przełącznik nad przyciskami Google/Apple/Outlook
- ✓ K5 service worker zarejestrowany i steruje stroną (127.0.0.1 z ?sw=on)
- ✓ K5 w pamięci tylko adresy z tej samej domeny (bez Supabase, Stripe, plan.zdawalni.pl, CDN)
- ✓ K5 nowe ?v= wymienia plik w pamięci (jeden nawyk.js, najnowszy)
- ✓ K5 offline po pierwszym wejściu: Dziś się renderuje (powitanie z serią)
- ✓ K5 offline: seria z ostatniego zapisanego postępu (2 dni, nie 0)
- ✓ K5 kopia strony aplikacji offline = najnowszy index.html (ten sam ?v= co na serwerze)
- ✓ K5 inna strona HTML (regulamin) nie nadpisuje kopii aplikacji
- ✓ K5 ?sw=off wyrejestrowuje workera i kasuje pamięci
- ✓ K5 sw.js: tylko GET z tej samej domeny, stała wersji, kasowanie starych pamięci
- ✓ K5 bez ?sw=on na 127.0.0.1 worker się nie rejestruje (zwykłe testy bez pamięci podręcznej)
- ✓ K5 390-jasny: 2. dzień nauki na iPhonie – „Dodaj Zdawalni do ekranu głównego…” z 2 krokami (Udostępnij → Do ekranu początkowego)
- ✓ K5 „Nie teraz” chowa zachętę (30 dni)
- ✓ K5 360-ciemny: 2. dzień nauki na iPhonie – „Dodaj Zdawalni do ekranu głównego…” z 2 krokami (Udostępnij → Do ekranu początkowego)
- ✓ K5 EN: „Add Zdawalni to your home screen” + „Add to Home Screen”
- ✓ K5 konto z 5 dniami nauki też dostaje zachętę (raz)
- ✓ K5 iPadOS (Macintosh + dotyk): zachęta z krokami Safari
- ✓ K5 przeglądarka w Instagramie: bez zachęty
- ✓ konsola bez błędów (wszystkie stany)

## Pomiary (kontrast każdego tekstu WCAG AA, axe, cele < 44 px, poziome przewijanie, konsola)
| stan | teksty | < AA | tekst < 12 px | axe | cele < 44 px | poziome przewijanie | błędy konsoli |
|---|---|---|---|---|---|---|---|
| K1 oferta przypomnienia 390-jasny | 4 | 0 | 0 | 0 | 0 | nie | 0 |
| K1 oferta przypomnienia 360-jasny | 4 | 0 | 0 | 0 | 0 | nie | 0 |
| K1 oferta przypomnienia 390-ciemny | 4 | 0 | 0 | 0 | 0 | nie | 0 |
| K1 oferta przypomnienia 390-jasny-en | 4 | 0 | 0 | 0 | 0 | nie | 0 |
| K2 karta przypomnień na Dziś 390-jasny | 4 | 0 | 0 | 0 | 0 | nie | 0 |
| K2 karta przypomnień na Dziś 360-ciemny | 4 | 0 | 0 | 0 | 0 | nie | 0 |
| K2 karta przypomnień na Dziś 390-jasny-en | 4 | 0 | 0 | 0 | 0 | nie | 0 |
| K4 okno kalendarza 390-jasny | 18 | 0 | 0 | 0 | 0 | nie | 0 |
| K4 okno kalendarza 360-jasny | 18 | 0 | 0 | 0 | 0 | nie | 0 |
| K4 okno kalendarza 390-ciemny | 18 | 0 | 0 | 0 | 0 | nie | 0 |
| K4 okno kalendarza 390-jasny-en | 18 | 0 | 0 | 0 | 0 | nie | 0 |
| K5 zachęta do instalacji 390-jasny | 4 | 0 | 0 | 0 | 0 | nie | 0 |
| K5 zachęta do instalacji 360-ciemny | 4 | 0 | 0 | 0 | 0 | nie | 0 |
| K5 zachęta do instalacji 390-jasny-en | 4 | 0 | 0 | 0 | 0 | nie | 0 |

## Szczegóły naruszeń

## Ruch (animationName; przy reduced-motion i html.calm ma być „none”)

Godzina przypomnienia z planu C111 (jutro): 16:30
## Różnica złotego pliku tests/fixtures/kalendarz-bm.ics (stary → nowy)
```diff
3c3
< PRODID:-//skrotbm.pl//Skrot BM//PL
---
> PRODID:-//zdawalni.pl//Zdawalni//PL
6c6
< X-WR-CALNAME:Skrót BM · C111 lab A
---
> X-WR-CALNAME:Zdawalni · C111 lab A
1911c1911
< DESCRIPTION:Szczegóły w Skrócie BM: https://zdawalni.pl
---
> DESCRIPTION:Szczegóły w Zdawalni: https://zdawalni.pl
1927c1927
<  kładnego terminu.\nSzczegóły w Skrócie BM: https://zdawalni.pl
---
>  kładnego terminu.\nSzczegóły w Zdawalni: https://zdawalni.pl
1942c1942
< DESCRIPTION:Twój wpis w Skrócie BM: https://zdawalni.pl
---
> DESCRIPTION:Twój wpis w Zdawalni: https://zdawalni.pl
1951,1952c1951,1952
< DESCRIPTION:Data wpisana przez Ciebie w Skrócie BM (Przygotuj się). Plan 
<  nauki liczy się do niej.\nhttps://zdawalni.pl
---
> DESCRIPTION:Data wpisana przez Ciebie w Zdawalni (Przygotuj się). Plan nau
>  ki liczy się do niej.\nhttps://zdawalni.pl
```
Pamięć service workera po wejściu: 30 adresów, np. http://127.0.0.1:8812/index.html, http://127.0.0.1:8812/i18n.js?v=20261116-logowanie1, http://127.0.0.1:8812/admin.js?v=20261107-rok4, http://127.0.0.1:8812/importy.js?v=20261106-kanon, http://127.0.0.1:8812/roczniki-dane.js?v=20261114-cukrowa, http://127.0.0.1:8812/rocznik.js?v=20261108-planzdawalni

## Zrzuty
- k1-oferta-przypomnienia-390-jasny.png
- k1-oferta-przypomnienia-360-jasny.png
- k1-oferta-przypomnienia-390-ciemny.png
- k1-oferta-przypomnienia-390-jasny-en.png
- k2-przyp-dzis-390-jasny.png
- k2-przyp-dzis-360-ciemny.png
- k2-przyp-dzis-390-jasny-en.png
- k4-kalendarz-okno-390-jasny.png
- k4-kalendarz-okno-360-jasny.png
- k4-kalendarz-okno-390-ciemny.png
- k4-kalendarz-okno-390-jasny-en.png
- k5-dzis-offline-390-jasny.png
- k5-instalacja-390-jasny.png
- k5-instalacja-360-ciemny.png
- k5-instalacja-390-jasny-en.png
