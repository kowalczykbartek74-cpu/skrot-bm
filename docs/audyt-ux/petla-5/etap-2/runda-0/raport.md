# UX-5 etap G2 – jedna miara i sensowne monety, runda 0

Data: 2026-11-17T23:06 · BASE http://127.0.0.1:8915/

Kontrast: własny pomiar każdego widocznego tekstu (tekst ≥ 4,5:1, duży ≥ 3:1; tło z przodków; tekst < 12 px też zgłaszany) + axe-core (color-contrast, target-size). Cele dotyku: każdy przycisk/link/pole w #main i #layer ≥ 44×44 px.

| ekran | sprawdzone teksty | teksty < AA / < 12 px | axe | cele < 44 px | poziome przewijanie | błędy konsoli |
|---|---|---|---|---|---|---|
| sklep-360-jasny | 102 | 2 | 0 | 1 | nie | 0 |
| ranking-360-jasny | 49 | 3 | 0 | 3 | nie | 0 |
| profil-360-jasny | 72 | 3 | 0 | 2 | nie | 0 |
| awans-4-360-jasny | 15 | 0 | 0 | 0 | nie | 0 |
| sklep-360-ciemny | 102 | 2 | 0 | 1 | nie | 0 |
| ranking-360-ciemny | 49 | 0 | 0 | 3 | nie | 0 |
| profil-360-ciemny | 72 | 2 | 0 | 2 | nie | 0 |
| awans-4-360-ciemny | 15 | 0 | 0 | 0 | nie | 0 |
| sklep-390-jasny | 102 | 2 | 0 | 1 | nie | 0 |
| ranking-390-jasny | 49 | 3 | 0 | 3 | nie | 0 |
| profil-390-jasny | 72 | 3 | 0 | 2 | nie | 0 |
| awans-4-390-jasny | 15 | 0 | 0 | 0 | nie | 0 |
| sklep-390-ciemny | 102 | 2 | 0 | 1 | nie | 0 |
| ranking-390-ciemny | 49 | 0 | 0 | 3 | nie | 0 |
| profil-390-ciemny | 72 | 2 | 0 | 2 | nie | 0 |
| awans-4-390-ciemny | 15 | 0 | 0 | 0 | nie | 0 |
| sklep-1280-jasny | 111 | 2 | 0 | 1 | nie | 0 |
| ranking-1280-jasny | 50 | 3 | 0 | 3 | nie | 0 |
| profil-1280-jasny | 74 | 3 | 0 | 2 | nie | 0 |
| sklep-1280-ciemny | 111 | 2 | 0 | 1 | nie | 0 |
| ranking-1280-ciemny | 50 | 0 | 0 | 3 | nie | 0 |
| sklep-390-en | 102 | 2 | 0 | 1 | nie | 0 |
| ranking-390-en | 51 | 5 | 0 | 3 | nie | 0 |
| poziomy-i-rangi-390-jasny | 97 | 0 | 0 | 0 | nie | 0 |
| jak-zdobywac-390-jasny | 48 | 0 | 0 | 2 | nie | 0 |

## Testy etapu

```
✓ K1 ranking podpisany „XP w tym tygodniu”
✓ K1 bez „pkt” na Przedmiocie, Sklepie, Rankingu, Bossie, Grach i w Haśle po grze
✓ K1 Hasło po grze: „+N XP” i seria „Hasło: N dni z rzędu”
✓ K2 wygrana w Haśle dodaje XP
✓ K2 samo Hasło przedłuża główną serię: wczoraj 2 → dziś 3
✓ K2 Hasło dodaje tyle XP, ile pokazuje („+N XP” = przyrost XP)
✓ K2 odbiór bossa: przycisk „Odbierz +N XP” i XP rośnie
✓ K3 SQL v59 = tabela B1 (poziomy i ceny 8 motywów; niewybrane 10/12)
✓ K3 stałe index.html (THEME_BASE, THEME_CHOICE, THEME_LATE) zgodne z SQL v59
✓ K3 katalog w sklepie (atrapa = SQL po v59) ma ceny z tabeli
✓ K3 karta Kokardki: „Albo wybór na poziomie 6”, Jednorożca: kup za 80 (przy 120 monetach aktywne)
✓ K3 motywy zdobyte z poziomu po starych progach zostają (Jednorożec, Kokardka, Łąka), reszta nie
✓ K4 awans na 4: dwie karty „Wybieram” (pink / sea)
✓ K4 wybór pink: zapisany, pink odblokowany, sea dopiero na poziomie 10
✓ K4 poziom 10: niewybrany sea odblokowany
✓ K4 awans na 6: dwie karty „Wybieram” (bow / noc)
✓ K4 wybór bow: zapisany, bow odblokowany, noc dopiero na poziomie 12
✓ K4 poziom 12: niewybrany noc odblokowany
✓ K4 odłożony wybór: w Sklepie „Wybierz motyw za poziom 4” i „Wybierz za darmo” na kartach pary
✓ K4 odłożony wybór otwiera okno z dwiema kartami
✓ K4 „Poziomy i rangi”: wybór na 4 i 6, niewybrany na 10 i 12, nagroda najwyżej w 2 liniach
✓ K5 /shop: bez emoji 🪙 ⚡ 🔥 jako ikon
✓ K5 sklep: moneta SVG (saldo, zadania, ceny), bez „Do następnej monety”
✓ K5 okno „Jak zdobywać XP i monety”: bez emoji monety i XP
✓ K5 /profil: bez emoji 🪙 ⚡ 🔥 jako ikon
✓ K4 Profil: następna nagroda to wybór na poziomie 6 (nie jeden motyw)
✓ K5 /ranking: bez emoji 🪙 ⚡ 🔥 jako ikon
✓ K5 z Dziś: „Poziomy i rangi” i „Jak zdobywać XP i monety” bez emoji 🪙 ⚡ 🔥
✓ EN sklep: bez polskich tekstów
✓ EN okno wyboru motywu: bez polskich tekstów
✓ EN ranking: „XP this week”
✓ K1 wiersze rankingu z jednostką „XP”
```

## Ruch (nazwa animacji / czas)
- zwykle: `#layer .modal` h-sheet 0.35s · `#layer .lvup-burst` none 0s · `.lp-confetti i` lp-fall 2.2s
- reduced-motion: `#layer .modal` none 0s · `#layer .lvup-burst` none 0.001s · `.lp-confetti i` brak
- calm: `#layer .modal` none 0s · `#layer .lvup-burst` none 0.001s · `.lp-confetti i` brak

## Wynik testów: 32 ✓ / 0 ✗

## Szczegóły
- sklep-360-jasny · kontrast `SPAN` „Odznaka:” 1:1 < 4.5:1
- sklep-360-jasny · kontrast `B` „Pierwszy krok” 1:1 < 4.5:1
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
- profil-360-jasny · kontrast `.kav-l` „B” 1.08:1 < 3:1
- profil-360-jasny · kontrast `SPAN` „Odznaka:” 1:1 < 4.5:1
- profil-360-jasny · kontrast `B` „Pierwszy krok” 1:1 < 4.5:1
- profil-360-jasny · cel `BUTTON.back` „←
Więcej” 96×36
- profil-360-jasny · cel `BUTTON.xp-chip.hud-coin.h-shine` „120” 69×30
- sklep-360-ciemny · kontrast `SPAN` „Odznaka:” 1:1 < 4.5:1
- sklep-360-ciemny · kontrast `B` „Pierwszy krok” 1:1 < 4.5:1
- sklep-360-ciemny · cel `BUTTON.back` „←
Więcej” 96×36
- ranking-360-ciemny · cel `BUTTON.back` „←
Więcej” 96×36
- ranking-360-ciemny · cel `BUTTON.btn.small` „Pseudonim: Bartek · widoczny” 226×35
- ranking-360-ciemny · cel `SELECT.input.rk-sel` „Wszystkie przedmioty
Analiza matematyczn” 320×43
- profil-360-ciemny · kontrast `SPAN` „Odznaka:” 1:1 < 4.5:1
- profil-360-ciemny · kontrast `B` „Pierwszy krok” 1:1 < 4.5:1
- profil-360-ciemny · cel `BUTTON.back` „←
Więcej” 96×36
- profil-360-ciemny · cel `BUTTON.xp-chip.hud-coin.h-shine` „120” 69×30
- sklep-390-jasny · kontrast `SPAN` „Odznaka:” 1:1 < 4.5:1
- sklep-390-jasny · kontrast `B` „Pierwszy krok” 1:1 < 4.5:1
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
- profil-390-jasny · kontrast `.kav-l` „B” 1.08:1 < 3:1
- profil-390-jasny · kontrast `SPAN` „Odznaka:” 1:1 < 4.5:1
- profil-390-jasny · kontrast `B` „Pierwszy krok” 1:1 < 4.5:1
- profil-390-jasny · cel `BUTTON.back` „←
Więcej” 96×36
- profil-390-jasny · cel `BUTTON.xp-chip.hud-coin.h-shine` „120” 69×30
- sklep-390-ciemny · kontrast `SPAN` „Odznaka:” 1:1 < 4.5:1
- sklep-390-ciemny · kontrast `B` „Pierwszy krok” 1:1 < 4.5:1
- sklep-390-ciemny · cel `BUTTON.back` „←
Więcej” 96×36
- ranking-390-ciemny · cel `BUTTON.back` „←
Więcej” 96×36
- ranking-390-ciemny · cel `BUTTON.btn.small` „Pseudonim: Bartek · widoczny” 226×35
- ranking-390-ciemny · cel `SELECT.input.rk-sel` „Wszystkie przedmioty
Analiza matematyczn” 320×43
- profil-390-ciemny · kontrast `SPAN` „Odznaka:” 1:1 < 4.5:1
- profil-390-ciemny · kontrast `B` „Pierwszy krok” 1:1 < 4.5:1
- profil-390-ciemny · cel `BUTTON.back` „←
Więcej” 96×36
- profil-390-ciemny · cel `BUTTON.xp-chip.hud-coin.h-shine` „120” 69×30
- sklep-1280-jasny · kontrast `SPAN` „Odznaka:” 1:1 < 4.5:1
- sklep-1280-jasny · kontrast `B` „Pierwszy krok” 1:1 < 4.5:1
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
- profil-1280-jasny · kontrast `.kav-l` „B” 1.08:1 < 3:1
- profil-1280-jasny · kontrast `SPAN` „Odznaka:” 1:1 < 4.5:1
- profil-1280-jasny · kontrast `B` „Pierwszy krok” 1:1 < 4.5:1
- profil-1280-jasny · cel `BUTTON.back` „←
Więcej” 96×36
- profil-1280-jasny · cel `BUTTON.xp-chip.hud-coin.h-shine` „120” 69×30
- sklep-1280-ciemny · kontrast `SPAN` „Odznaka:” 1:1 < 4.5:1
- sklep-1280-ciemny · kontrast `B` „Pierwszy krok” 1:1 < 4.5:1
- sklep-1280-ciemny · cel `BUTTON.back` „←
Więcej” 96×36
- ranking-1280-ciemny · cel `BUTTON.back` „←
Więcej” 96×36
- ranking-1280-ciemny · cel `BUTTON.btn.small` „Pseudonim: Bartek · widoczny” 226×35
- ranking-1280-ciemny · cel `SELECT.input.rk-sel` „Wszystkie przedmioty
Analiza matematyczn” 320×43
- sklep-390-en · kontrast `SPAN` „Badge:” 1:1 < 4.5:1
- sklep-390-en · kontrast `B` „First step” 1:1 < 4.5:1
- sklep-390-en · cel `BUTTON.back` „←
More” 84×36
- ranking-390-en · kontrast `.kav-l` „Ł” 1:1 < 4.5:1
- ranking-390-en · kontrast `.kav-l` „C” 1:1 < 4.5:1
- ranking-390-en · kontrast `.kav-l` „B” 1.18:1 < 4.5:1
- ranking-390-en · kontrast `SPAN` „Badge:” 1:1 < 4.5:1
- ranking-390-en · kontrast `B` „First step” 1:1 < 4.5:1
- ranking-390-en · cel `BUTTON.back` „←
More” 84×36
- ranking-390-en · cel `BUTTON.btn.small` „Nickname: Bartek · visible” 197×35
- ranking-390-en · cel `SELECT.input.rk-sel` „All subjects
Mathematical Analysis
Busin” 320×43
- jak-zdobywac-390-jasny · cel `BUTTON.btn.primary` „Jasne” 76×43
- jak-zdobywac-390-jasny · cel `BUTTON.btn.ghost` „Sklep i Zadania dnia” 175×43
