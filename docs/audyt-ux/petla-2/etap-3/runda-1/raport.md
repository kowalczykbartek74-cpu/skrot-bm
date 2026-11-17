# UX-2 · etap 3 · runda 1

Testy etapu: **26 ✓ / 0 ✗** (docs/gry/test/ux2-etap3.mjs)

## Kryteria (asercje)
- ✓ K1 przerwa 5 dni: „Dobrze, że jesteś. Ostatnio 5 dni temu.” nad kartą dnia, ze Stasiem
- ✓ K1 najwyżej 3 punkty i tylko te, które są (liczby > 0)
- ✓ K1 jeden przycisk „Wracam: 3 minuty”
- ✓ K1 390-jasny: nic poza ekranem
- ✓ K1 360-jasny: nic poza ekranem
- ✓ K1 390-ciemny: nic poza ekranem
- ✓ K1 1280-jasny: nic poza ekranem
- ✓ K1 EN: „Good to see you. Last time: 5 days ago.”, „I'm back: 3 minutes”
- ✓ K1 390-jasny-en: nic poza ekranem
- ✓ K1 wczoraj była nauka (1 dzień): bez karty powrotu
- ✓ K1 dziś już XP: karta znika
- ✓ K2 trybDnia uwzględnia przerwaDni (5) → „lekko”
- ✓ K2 karta powrotu: tryb lekko, bez nowego, 3 min, rozgrzewka 6 + 1 pytanie, odtwarzacz otwarty
- ✓ K2/K3 testy jednostkowe (lekcja-dnia: przerwaDni, kartaPowrotu; nawyk: naprawa)
- ✓ K3 seria 12 spadła po 3 dniach: wiersz „Twoja seria 12 dni się przerwała. Zrób dziś i jutro po 5 minut, a wróci.”
- ✓ K3 dzień 1 naprawy: seria 1, streakRepair zapisany, baner naprawy, pigułka „· jutro seria wróci do 14 dni”
- ✓ K3 dzień 2 przed nauką: „· ucz się dziś: seria wróci do 14 dni”
- ✓ K3 dzień 2 z XP: seria 14 (n + 2), baner „Seria odzyskana: 14 dni”, zapisany dzień naprawy
- ✓ K3 naprawa raz na 30 dni: 10 dni po poprzedniej bez wiersza naprawy (zamiast tego jasny komunikat o końcu serii)
- ✓ K4 ?wracam=1: karta powrotu widoczna i w widoku, adres bez parametru, bez „Nie ma takiej strony”
- ✓ K4 po przeładowaniu tego samego dnia karta zostaje (skrot-wracam)
- ✓ K4 mail „powrót”: link /?pz=…&wracam=1#/ (tests/przypomnienia.test.js)
- ✓ K5 390-jasny: od wejścia pigułka „koniec serii 10 dni” i w karcie „Seria 10 dni się skończyła. Dziś zaczynasz nową.”
- ✓ K5 390-ciemny: od wejścia pigułka „koniec serii 10 dni” i w karcie „Seria 10 dni się skończyła. Dziś zaczynasz nową.”
- ✓ K5 EN: „Your 10 days streak ended”
- ✓ konsola bez błędów (wszystkie stany)

## Pomiary (kontrast każdego tekstu WCAG AA, axe, cele < 44 px, poziome przewijanie, konsola)
| stan | teksty | < AA | tekst < 12 px | axe | cele < 44 px | poziome przewijanie | błędy konsoli |
|---|---|---|---|---|---|---|---|
| Karta powrotu 390-jasny | 6 | 0 | 0 | 0 | 0 | nie | 0 |
| Karta powrotu 360-jasny | 6 | 0 | 0 | 0 | 0 | nie | 0 |
| Karta powrotu 390-ciemny | 6 | 0 | 0 | 0 | 0 | nie | 0 |
| Karta powrotu 1280-jasny | 6 | 0 | 0 | 0 | 0 | nie | 0 |
| Karta powrotu 390-jasny-en | 6 | 0 | 0 | 0 | 0 | nie | 0 |
| Karta powrotu z naprawą 390 | 6 | 0 | 0 | 0 | 0 | nie | 0 |
| Utrata serii od wejścia 390-jasny | 104 | 0 | 4 | 0 | 0 | nie | 0 |
| Utrata serii od wejścia 390-ciemny | 104 | 0 | 4 | 0 | 0 | nie | 0 |
| Utrata serii od wejścia 360-jasny-en | 104 | 0 | 4 | 0 | 0 | nie | 0 |

## Szczegóły naruszeń
- Utrata serii od wejścia 390-jasny · kontrast `SMALL` „dni” 16.44:1 (wymagane 4.5:1, 9.92px)
- Utrata serii od wejścia 390-jasny · kontrast `SPAN` „data szacowana” 8.6:1 (wymagane 4.5:1, 10.24px)
- Utrata serii od wejścia 390-jasny · kontrast `SMALL` „dni” 16.44:1 (wymagane 4.5:1, 9.92px)
- Utrata serii od wejścia 390-jasny · kontrast `SMALL` „dni” 16.44:1 (wymagane 4.5:1, 9.92px)
- Utrata serii od wejścia 390-ciemny · kontrast `SMALL` „dni” 13.63:1 (wymagane 4.5:1, 9.92px)
- Utrata serii od wejścia 390-ciemny · kontrast `SPAN` „data szacowana” 9.53:1 (wymagane 4.5:1, 10.24px)
- Utrata serii od wejścia 390-ciemny · kontrast `SMALL` „dni” 13.63:1 (wymagane 4.5:1, 9.92px)
- Utrata serii od wejścia 390-ciemny · kontrast `SMALL` „dni” 13.63:1 (wymagane 4.5:1, 9.92px)
- Utrata serii od wejścia 360-jasny-en · kontrast `SMALL` „days” 16.44:1 (wymagane 4.5:1, 9.92px)
- Utrata serii od wejścia 360-jasny-en · kontrast `SPAN` „estimated date” 8.6:1 (wymagane 4.5:1, 10.24px)
- Utrata serii od wejścia 360-jasny-en · kontrast `SMALL` „days” 16.44:1 (wymagane 4.5:1, 9.92px)
- Utrata serii od wejścia 360-jasny-en · kontrast `SMALL` „days” 16.44:1 (wymagane 4.5:1, 9.92px)

## Ruch (animationName; przy reduced-motion i html.calm ma być „none”)

Punkty karty powrotu (390 jasny): ["Zajęcia, które minęły: 5","Nowe terminy: 1"]
## node --test tests/lekcja-dnia.test.js tests/nawyk.test.js
```
▶ powrót po przerwie (pętla UX-2, etap 3)
✔ powrót po przerwie (pętla UX-2, etap 3) (0.222792ms)
✔ naprawa serii wysiłkiem: seria ≥ 3, 2–4 opuszczone dni, 2 dni nauki z rzędu → n + 2, raz na 30 dni (0.241875ms)
ℹ tests 68
ℹ pass 68
ℹ fail 0
```

## Zrzuty
- k1-powrot-390-jasny.png
- k1-powrot-360-jasny.png
- k1-powrot-390-ciemny.png
- k1-powrot-1280-jasny.png
- k1-powrot-390-jasny-en.png
- k2-wracam-odtwarzacz-390-jasny.png
- k3-naprawa-wiersz-390-jasny.png
- k3-seria-odzyskana-390-jasny.png
- k4-z-maila-390-jasny.png
- k5-utrata-390-jasny.png
- k5-utrata-390-ciemny.png
- k5-utrata-360-jasny-en.png
