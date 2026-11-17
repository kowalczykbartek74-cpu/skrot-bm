# UX-5 etap G2 – jedna miara i sensowne monety, runda 1

Data: 2026-11-16T20:21 · BASE http://127.0.0.1:8815/

Kontrast: własny pomiar każdego widocznego tekstu (tekst ≥ 4,5:1, duży ≥ 3:1; tło z przodków; tekst < 12 px też zgłaszany) + axe-core (color-contrast, target-size). Cele dotyku: każdy przycisk/link/pole w #main i #layer ≥ 44×44 px.

| ekran | sprawdzone teksty | teksty < AA / < 12 px | axe | cele < 44 px | poziome przewijanie | błędy konsoli |
|---|---|---|---|---|---|---|
| sklep-360-jasny | 94 | 5 | 0 | 6 | nie | 0 |
| ranking-360-jasny | 46 | 10 | 0 | 13 | nie | 0 |
| profil-360-jasny | 44 | 14 | 0 | 12 | nie | 0 |
| awans-4-360-jasny | 16 | 0 | color-contrast: 1 | 0 | nie | 0 |
| sklep-360-ciemny | 94 | 5 | 0 | 6 | nie | 0 |
| ranking-360-ciemny | 46 | 7 | 0 | 13 | nie | 0 |
| profil-360-ciemny | 44 | 13 | 0 | 12 | nie | 0 |
| awans-4-360-ciemny | 16 | 0 | color-contrast: 1 | 0 | nie | 0 |
| sklep-390-jasny | 94 | 5 | 0 | 6 | nie | 0 |
| ranking-390-jasny | 46 | 10 | 0 | 13 | nie | 0 |
| profil-390-jasny | 44 | 14 | 0 | 12 | nie | 0 |
| awans-4-390-jasny | 16 | 0 | color-contrast: 1 | 0 | nie | 0 |
| sklep-390-ciemny | 94 | 5 | 0 | 6 | nie | 0 |
| ranking-390-ciemny | 46 | 7 | 0 | 13 | nie | 0 |
| profil-390-ciemny | 44 | 13 | 0 | 12 | nie | 0 |
| awans-4-390-ciemny | 16 | 0 | color-contrast: 1 | 0 | nie | 0 |
| sklep-1280-jasny | 104 | 0 | 0 | 6 | nie | 0 |
| ranking-1280-jasny | 48 | 5 | 0 | 13 | nie | 0 |
| profil-1280-jasny | 46 | 9 | 0 | 12 | nie | 0 |
| sklep-1280-ciemny | 104 | 0 | 0 | 6 | nie | 0 |
| ranking-1280-ciemny | 48 | 2 | 0 | 13 | nie | 0 |
| sklep-390-en | 94 | 5 | 0 | 6 | nie | 0 |
| ranking-390-en | 46 | 10 | 0 | 13 | nie | 0 |
| poziomy-i-rangi-390-jasny | 113 | 37 | color-contrast: 1 | 2 | nie | 0 |
| jak-zdobywac-390-jasny | 49 | 0 | color-contrast: 1 | 2 | nie | 0 |

## Testy etapu

```
✓ K1 ranking podpisany „XP w tym tygodniu”
✓ K1 bez „pkt” na Przedmiocie, Sklepie, Rankingu, Bossie, Grach i w Haśle po grze
✓ K1 Hasło po grze: „+N XP” i seria „Hasło: N dni z rzędu”
✓ K2 wygrana w Haśle dodaje XP
✓ K2 samo Hasło przedłuża główną serię (dziś zapisane, n ≥ 1)
✓ K2 odbiór bossa: przycisk „Odbierz +N XP” i XP rośnie
✓ K3 SQL v59 = tabela B1 (poziomy i ceny 8 motywów; niewybrane 10/12)
✓ K3 stałe index.html (THEME_BASE, THEME_CHOICE, THEME_LATE) zgodne z SQL v59
✓ K3 katalog w sklepie (atrapa = SQL po v59) ma ceny z tabeli
✓ K3 karta Kokardki: „Albo poziom 6”, Jednorożca: kup za 80 (przy 120 monetach aktywne)
✓ K3 motywy zdobyte z poziomu po starych progach zostają (Jednorożec, Kokardka, Łąka), reszta nie
✓ K4 awans na 4: dwie karty „Wybieram” (pink / sea)
✓ K4 wybór pink: zapisany, pink odblokowany, sea dopiero na poziomie 10
✓ K4 poziom 10: niewybrany sea odblokowany
✓ K4 awans na 6: dwie karty „Wybieram” (bow / noc)
✓ K4 wybór bow: zapisany, bow odblokowany, noc dopiero na poziomie 12
✓ K4 poziom 12: niewybrany noc odblokowany
✓ K4 odłożony wybór: w Sklepie „Wybierz motyw za poziom 4” i „Wybierz za darmo” na kartach pary
✓ K4 odłożony wybór otwiera okno z dwiema kartami
✓ K4 „Poziomy i rangi”: wybór na 4 i 6, niewybrany na 10 i 12, nagroda w jednej linii
✓ K5 /shop: bez emoji 🪙 ⚡ 🔥 jako ikon
✓ K5 sklep: moneta SVG (saldo, zadania, ceny), bez „Do następnej monety”
✓ K5 okno „Jak zdobywać XP i monety”: bez emoji monety i XP
✓ K5 /profil: bez emoji 🪙 ⚡ 🔥 jako ikon
✓ K5 /ranking: bez emoji 🪙 ⚡ 🔥 jako ikon
✓ EN sklep: bez polskich tekstów
✓ EN okno wyboru motywu: bez polskich tekstów
✓ EN ranking: „XP this week”
```

## Ruch (nazwa animacji / czas)
- zwykle: `#layer .modal` h-sheet 0.35s · `#layer .lvup-burst` none 0s · `.lp-confetti i` lp-fall 2.2s
- reduced-motion: `#layer .modal` none 0s · `#layer .lvup-burst` none 0.001s · `.lp-confetti i` brak
- calm: `#layer .modal` none 0s · `#layer .lvup-burst` none 0.001s · `.lp-confetti i` brak

## Wynik testów: 28 ✓ / 0 ✗

## Szczegóły
- sklep-360-jasny · kontrast `SPAN` „Dziś” 16.79:1 (11.84 px)
- sklep-360-jasny · kontrast `SPAN` „Przedmioty” 16.79:1 (11.84 px)
- sklep-360-jasny · kontrast `SPAN` „Powtórki” 16.79:1 (11.84 px)
- sklep-360-jasny · kontrast `SPAN` „Terminy” 16.79:1 (11.84 px)
- sklep-360-jasny · kontrast `SPAN` „Kalendarz” 16.79:1 (11.84 px)
- sklep-360-jasny · cel `BUTTON.back` „←
Więcej” 96×36
- sklep-360-jasny · cel `A` „Plan zajęć (za darmo)” 133×21
- sklep-360-jasny · cel `A` „Skrzynka do opiekunki roku” 174×21
- sklep-360-jasny · cel `A` „Regulamin” 67×21
- sklep-360-jasny · cel `A` „Polityka prywatności” 133×21
- sklep-360-jasny · cel `A` „Kontakt” 51×21
- ranking-360-jasny · kontrast `SPAN` „Dziś” 16.79:1 (11.84 px)
- ranking-360-jasny · kontrast `SPAN` „Przedmioty” 16.79:1 (11.84 px)
- ranking-360-jasny · kontrast `SPAN` „Powtórki” 16.79:1 (11.84 px)
- ranking-360-jasny · kontrast `SPAN` „Terminy” 16.79:1 (11.84 px)
- ranking-360-jasny · kontrast `SPAN` „Kalendarz” 16.79:1 (11.84 px)
- ranking-360-jasny · kontrast `.kav-l` „Ł” 1:1 < 4.5:1
- ranking-360-jasny · kontrast `SPAN` „Nocny Marek” 14.97:1 (11.84 px)
- ranking-360-jasny · kontrast `.kav-l` „C” 1:1 < 4.5:1
- ranking-360-jasny · kontrast `SPAN` „Pogromca Makro” 12.03:1 (11.84 px)
- ranking-360-jasny · kontrast `.kav-l` „B” 1.18:1 < 4.5:1
- ranking-360-jasny · cel `BUTTON.back` „←
Więcej” 96×36
- ranking-360-jasny · cel `BUTTON.btn.small` „Pseudonim: Bartek · widoczny” 226×35
- ranking-360-jasny · cel `BUTTON.fchip` „Cały rok” 88×40
- ranking-360-jasny · cel `BUTTON.fchip` „C111” 59×40
- ranking-360-jasny · cel `BUTTON.fchip` „C112” 62×40
- ranking-360-jasny · cel `BUTTON.fchip` „C113” 62×40
- ranking-360-jasny · cel `SELECT.input.rk-sel` „Wszystkie przedmioty
Analiza matematyczn” 320×43
- ranking-360-jasny · cel `BUTTON.rk-who` „B
Ty (Bartek)” 189×34
- ranking-360-jasny · cel `A` „Plan zajęć (za darmo)” 133×21
- ranking-360-jasny · cel `A` „Skrzynka do opiekunki roku” 174×21
- ranking-360-jasny · cel `A` „Regulamin” 67×21
- ranking-360-jasny · cel `A` „Polityka prywatności” 133×21
- ranking-360-jasny · cel `A` „Kontakt” 51×21
- profil-360-jasny · kontrast `SPAN` „Dziś” 16.79:1 (11.84 px)
- profil-360-jasny · kontrast `SPAN` „Przedmioty” 16.79:1 (11.84 px)
- profil-360-jasny · kontrast `SPAN` „Powtórki” 16.79:1 (11.84 px)
- profil-360-jasny · kontrast `SPAN` „Terminy” 16.79:1 (11.84 px)
- profil-360-jasny · kontrast `SPAN` „Kalendarz” 16.79:1 (11.84 px)
- profil-360-jasny · kontrast `.kav-l` „B” 1.08:1 < 3:1
- profil-360-jasny · kontrast `SMALL` „2. miejsce” 7.75:1 (10.6667 px)
- profil-360-jasny · kontrast `SMALL` „3. miejsce” 7.75:1 (10.6667 px)
- profil-360-jasny · kontrast `SPAN` „4” 5.04:1 (11.2 px)
- profil-360-jasny · kontrast `.gry-badge.off` „🍃” 2.11:1 < 4.5:1
- profil-360-jasny · kontrast `.gry-badge.off` „📚” 2.11:1 < 4.5:1
- profil-360-jasny · kontrast `.gry-badge.off` „💚” 2.11:1 < 4.5:1
- profil-360-jasny · kontrast `.gry-badge.off` „🃏” 2.11:1 < 4.5:1
- profil-360-jasny · kontrast `.gry-badge.off` „🌉” 2.11:1 < 4.5:1
- profil-360-jasny · cel `BUTTON.back` „←
Więcej” 96×36
- profil-360-jasny · cel `BUTTON.kgab-slot.is-empty` „+” 39×34
- profil-360-jasny · cel `BUTTON.kgab-slot.is-lock` „2. miejsce” 95×34
- profil-360-jasny · cel `BUTTON.kgab-slot.is-lock` „3. miejsce” 95×34
- profil-360-jasny · cel `BUTTON.btn.small.kprof-btn` „Zmień wygląd” 119×35
- profil-360-jasny · cel `BUTTON.xp-chip.hud-coin.h-shine` „120” 69×30
- profil-360-jasny · cel `BUTTON.link.lv-howlink` „Jak zdobywać XP i monety?” 187×22
- profil-360-jasny · cel `A` „Plan zajęć (za darmo)” 133×21
- profil-360-jasny · cel `A` „Skrzynka do opiekunki roku” 174×21
- profil-360-jasny · cel `A` „Regulamin” 67×21
- profil-360-jasny · cel `A` „Polityka prywatności” 133×21
- profil-360-jasny · cel `A` „Kontakt” 51×21
- awans-4-360-jasny · axe color-contrast · `#skrot-wm` · Element has insufficient color contrast of 1.57 (foreground color: #cacfcd, background color: #ffffff, font size: 7.5pt (10px), font weight: normal). Expected c
- sklep-360-ciemny · kontrast `SPAN` „Dziś” 11.3:1 (11.84 px)
- sklep-360-ciemny · kontrast `SPAN` „Przedmioty” 11.3:1 (11.84 px)
- sklep-360-ciemny · kontrast `SPAN` „Powtórki” 11.3:1 (11.84 px)
- sklep-360-ciemny · kontrast `SPAN` „Terminy” 11.3:1 (11.84 px)
- sklep-360-ciemny · kontrast `SPAN` „Kalendarz” 11.3:1 (11.84 px)
- sklep-360-ciemny · cel `BUTTON.back` „←
Więcej” 96×36
- sklep-360-ciemny · cel `A` „Plan zajęć (za darmo)” 133×21
- sklep-360-ciemny · cel `A` „Skrzynka do opiekunki roku” 174×21
- sklep-360-ciemny · cel `A` „Regulamin” 67×21
- sklep-360-ciemny · cel `A` „Polityka prywatności” 133×21
- sklep-360-ciemny · cel `A` „Kontakt” 51×21
- ranking-360-ciemny · kontrast `SPAN` „Dziś” 11.3:1 (11.84 px)
- ranking-360-ciemny · kontrast `SPAN` „Przedmioty” 11.3:1 (11.84 px)
- ranking-360-ciemny · kontrast `SPAN` „Powtórki” 11.3:1 (11.84 px)
- ranking-360-ciemny · kontrast `SPAN` „Terminy” 11.3:1 (11.84 px)
- ranking-360-ciemny · kontrast `SPAN` „Kalendarz” 11.3:1 (11.84 px)
- ranking-360-ciemny · kontrast `SPAN` „Nocny Marek” 12.07:1 (11.84 px)
- ranking-360-ciemny · kontrast `SPAN` „Pogromca Makro” 10.29:1 (11.84 px)
- ranking-360-ciemny · cel `BUTTON.back` „←
Więcej” 96×36
- ranking-360-ciemny · cel `BUTTON.btn.small` „Pseudonim: Bartek · widoczny” 226×35
- ranking-360-ciemny · cel `BUTTON.fchip` „Cały rok” 88×40
- ranking-360-ciemny · cel `BUTTON.fchip` „C111” 59×40
- ranking-360-ciemny · cel `BUTTON.fchip` „C112” 62×40
- ranking-360-ciemny · cel `BUTTON.fchip` „C113” 62×40
- ranking-360-ciemny · cel `SELECT.input.rk-sel` „Wszystkie przedmioty
Analiza matematyczn” 320×43
- ranking-360-ciemny · cel `BUTTON.rk-who` „B
Ty (Bartek)” 189×34
- ranking-360-ciemny · cel `A` „Plan zajęć (za darmo)” 133×21
- ranking-360-ciemny · cel `A` „Skrzynka do opiekunki roku” 174×21
- ranking-360-ciemny · cel `A` „Regulamin” 67×21
- ranking-360-ciemny · cel `A` „Polityka prywatności” 133×21
- ranking-360-ciemny · cel `A` „Kontakt” 51×21
- profil-360-ciemny · kontrast `SPAN` „Dziś” 11.3:1 (11.84 px)
- profil-360-ciemny · kontrast `SPAN` „Przedmioty” 11.3:1 (11.84 px)
- profil-360-ciemny · kontrast `SPAN` „Powtórki” 11.3:1 (11.84 px)
- profil-360-ciemny · kontrast `SPAN` „Terminy” 11.3:1 (11.84 px)
- profil-360-ciemny · kontrast `SPAN` „Kalendarz” 11.3:1 (11.84 px)
- profil-360-ciemny · kontrast `SMALL` „2. miejsce” 7.93:1 (10.6667 px)
- profil-360-ciemny · kontrast `SMALL` „3. miejsce” 7.93:1 (10.6667 px)
- profil-360-ciemny · kontrast `SPAN` „4” 8.92:1 (11.2 px)
- profil-360-ciemny · kontrast `.gry-badge.off` „🍃” 2.8:1 < 4.5:1
- profil-360-ciemny · kontrast `.gry-badge.off` „📚” 2.8:1 < 4.5:1
- profil-360-ciemny · kontrast `.gry-badge.off` „💚” 2.8:1 < 4.5:1
- profil-360-ciemny · kontrast `.gry-badge.off` „🃏” 2.8:1 < 4.5:1
- profil-360-ciemny · kontrast `.gry-badge.off` „🌉” 2.8:1 < 4.5:1
- profil-360-ciemny · cel `BUTTON.back` „←
Więcej” 96×36
- profil-360-ciemny · cel `BUTTON.kgab-slot.is-empty` „+” 39×34
- profil-360-ciemny · cel `BUTTON.kgab-slot.is-lock` „2. miejsce” 95×34
- profil-360-ciemny · cel `BUTTON.kgab-slot.is-lock` „3. miejsce” 95×34
- profil-360-ciemny · cel `BUTTON.btn.small.kprof-btn` „Zmień wygląd” 119×35
- profil-360-ciemny · cel `BUTTON.xp-chip.hud-coin.h-shine` „120” 69×30
- profil-360-ciemny · cel `BUTTON.link.lv-howlink` „Jak zdobywać XP i monety?” 187×22
- profil-360-ciemny · cel `A` „Plan zajęć (za darmo)” 133×21
- profil-360-ciemny · cel `A` „Skrzynka do opiekunki roku” 174×21
- profil-360-ciemny · cel `A` „Regulamin” 67×21
- profil-360-ciemny · cel `A` „Polityka prywatności” 133×21
- profil-360-ciemny · cel `A` „Kontakt” 51×21
- awans-4-360-ciemny · axe color-contrast · `#skrot-wm` · Element has insufficient color contrast of 1.91 (foreground color: #4a5b52, background color: #1d3126, font size: 7.5pt (10px), font weight: normal). Expected c
- sklep-390-jasny · kontrast `SPAN` „Dziś” 16.79:1 (11.84 px)
- sklep-390-jasny · kontrast `SPAN` „Przedmioty” 16.79:1 (11.84 px)
- sklep-390-jasny · kontrast `SPAN` „Powtórki” 16.79:1 (11.84 px)
- sklep-390-jasny · kontrast `SPAN` „Terminy” 16.79:1 (11.84 px)
- sklep-390-jasny · kontrast `SPAN` „Kalendarz” 16.79:1 (11.84 px)
- sklep-390-jasny · cel `BUTTON.back` „←
Więcej” 96×36
- sklep-390-jasny · cel `A` „Plan zajęć (za darmo)” 133×21
- sklep-390-jasny · cel `A` „Skrzynka do opiekunki roku” 174×21
- sklep-390-jasny · cel `A` „Regulamin” 67×21
- sklep-390-jasny · cel `A` „Polityka prywatności” 133×21
- sklep-390-jasny · cel `A` „Kontakt” 51×21
- ranking-390-jasny · kontrast `SPAN` „Dziś” 16.79:1 (11.84 px)
- ranking-390-jasny · kontrast `SPAN` „Przedmioty” 16.79:1 (11.84 px)
- ranking-390-jasny · kontrast `SPAN` „Powtórki” 16.79:1 (11.84 px)
- ranking-390-jasny · kontrast `SPAN` „Terminy” 16.79:1 (11.84 px)
- ranking-390-jasny · kontrast `SPAN` „Kalendarz” 16.79:1 (11.84 px)
- ranking-390-jasny · kontrast `.kav-l` „Ł” 1:1 < 4.5:1
- ranking-390-jasny · kontrast `SPAN` „Nocny Marek” 14.97:1 (11.84 px)
- ranking-390-jasny · kontrast `.kav-l` „C” 1:1 < 4.5:1
- ranking-390-jasny · kontrast `SPAN` „Pogromca Makro” 12.03:1 (11.84 px)
- ranking-390-jasny · kontrast `.kav-l` „B” 1.18:1 < 4.5:1
- ranking-390-jasny · cel `BUTTON.back` „←
Więcej” 96×36
- ranking-390-jasny · cel `BUTTON.btn.small` „Pseudonim: Bartek · widoczny” 226×35
- ranking-390-jasny · cel `BUTTON.fchip` „Cały rok” 88×40
- ranking-390-jasny · cel `BUTTON.fchip` „C111” 59×40
- ranking-390-jasny · cel `BUTTON.fchip` „C112” 62×40
- ranking-390-jasny · cel `BUTTON.fchip` „C113” 62×40
- ranking-390-jasny · cel `SELECT.input.rk-sel` „Wszystkie przedmioty
Analiza matematyczn” 320×43
- ranking-390-jasny · cel `BUTTON.rk-who` „B
Ty (Bartek)” 219×34
- ranking-390-jasny · cel `A` „Plan zajęć (za darmo)” 133×21
- ranking-390-jasny · cel `A` „Skrzynka do opiekunki roku” 174×21
- ranking-390-jasny · cel `A` „Regulamin” 67×21
- ranking-390-jasny · cel `A` „Polityka prywatności” 133×21
- ranking-390-jasny · cel `A` „Kontakt” 51×21
- profil-390-jasny · kontrast `SPAN` „Dziś” 16.79:1 (11.84 px)
- profil-390-jasny · kontrast `SPAN` „Przedmioty” 16.79:1 (11.84 px)
- profil-390-jasny · kontrast `SPAN` „Powtórki” 16.79:1 (11.84 px)
- profil-390-jasny · kontrast `SPAN` „Terminy” 16.79:1 (11.84 px)
- profil-390-jasny · kontrast `SPAN` „Kalendarz” 16.79:1 (11.84 px)
- profil-390-jasny · kontrast `.kav-l` „B” 1.08:1 < 3:1
- profil-390-jasny · kontrast `SMALL` „2. miejsce” 7.75:1 (10.6667 px)
- profil-390-jasny · kontrast `SMALL` „3. miejsce” 7.75:1 (10.6667 px)
- profil-390-jasny · kontrast `SPAN` „4” 5.04:1 (11.2 px)
- profil-390-jasny · kontrast `.gry-badge.off` „🍃” 2.11:1 < 4.5:1
- profil-390-jasny · kontrast `.gry-badge.off` „📚” 2.11:1 < 4.5:1
- profil-390-jasny · kontrast `.gry-badge.off` „💚” 2.11:1 < 4.5:1
- profil-390-jasny · kontrast `.gry-badge.off` „🃏” 2.11:1 < 4.5:1
- profil-390-jasny · kontrast `.gry-badge.off` „🌉” 2.11:1 < 4.5:1
- profil-390-jasny · cel `BUTTON.back` „←
Więcej” 96×36
- profil-390-jasny · cel `BUTTON.kgab-slot.is-empty` „+” 39×34
- profil-390-jasny · cel `BUTTON.kgab-slot.is-lock` „2. miejsce” 95×34
- profil-390-jasny · cel `BUTTON.kgab-slot.is-lock` „3. miejsce” 95×34
- profil-390-jasny · cel `BUTTON.btn.small.kprof-btn` „Zmień wygląd” 119×35
- profil-390-jasny · cel `BUTTON.xp-chip.hud-coin.h-shine` „120” 69×30
- profil-390-jasny · cel `BUTTON.link.lv-howlink` „Jak zdobywać XP i monety?” 187×22
- profil-390-jasny · cel `A` „Plan zajęć (za darmo)” 133×21
- profil-390-jasny · cel `A` „Skrzynka do opiekunki roku” 174×21
- profil-390-jasny · cel `A` „Regulamin” 67×21
- profil-390-jasny · cel `A` „Polityka prywatności” 133×21
- profil-390-jasny · cel `A` „Kontakt” 51×21
- awans-4-390-jasny · axe color-contrast · `#skrot-wm` · Element has insufficient color contrast of 1.57 (foreground color: #cacfcd, background color: #ffffff, font size: 7.5pt (10px), font weight: normal). Expected c
- sklep-390-ciemny · kontrast `SPAN` „Dziś” 11.3:1 (11.84 px)
- sklep-390-ciemny · kontrast `SPAN` „Przedmioty” 11.3:1 (11.84 px)
- sklep-390-ciemny · kontrast `SPAN` „Powtórki” 11.3:1 (11.84 px)
- sklep-390-ciemny · kontrast `SPAN` „Terminy” 11.3:1 (11.84 px)
- sklep-390-ciemny · kontrast `SPAN` „Kalendarz” 11.3:1 (11.84 px)
- sklep-390-ciemny · cel `BUTTON.back` „←
Więcej” 96×36
- sklep-390-ciemny · cel `A` „Plan zajęć (za darmo)” 133×21
- sklep-390-ciemny · cel `A` „Skrzynka do opiekunki roku” 174×21
- sklep-390-ciemny · cel `A` „Regulamin” 67×21
- sklep-390-ciemny · cel `A` „Polityka prywatności” 133×21
- sklep-390-ciemny · cel `A` „Kontakt” 51×21
- ranking-390-ciemny · kontrast `SPAN` „Dziś” 11.3:1 (11.84 px)
- ranking-390-ciemny · kontrast `SPAN` „Przedmioty” 11.3:1 (11.84 px)
- ranking-390-ciemny · kontrast `SPAN` „Powtórki” 11.3:1 (11.84 px)
- ranking-390-ciemny · kontrast `SPAN` „Terminy” 11.3:1 (11.84 px)
- ranking-390-ciemny · kontrast `SPAN` „Kalendarz” 11.3:1 (11.84 px)
- ranking-390-ciemny · kontrast `SPAN` „Nocny Marek” 12.07:1 (11.84 px)
- ranking-390-ciemny · kontrast `SPAN` „Pogromca Makro” 10.29:1 (11.84 px)
- ranking-390-ciemny · cel `BUTTON.back` „←
Więcej” 96×36
- ranking-390-ciemny · cel `BUTTON.btn.small` „Pseudonim: Bartek · widoczny” 226×35
- ranking-390-ciemny · cel `BUTTON.fchip` „Cały rok” 88×40
- ranking-390-ciemny · cel `BUTTON.fchip` „C111” 59×40
- ranking-390-ciemny · cel `BUTTON.fchip` „C112” 62×40
- ranking-390-ciemny · cel `BUTTON.fchip` „C113” 62×40
- ranking-390-ciemny · cel `SELECT.input.rk-sel` „Wszystkie przedmioty
Analiza matematyczn” 320×43
- ranking-390-ciemny · cel `BUTTON.rk-who` „B
Ty (Bartek)” 219×34
- ranking-390-ciemny · cel `A` „Plan zajęć (za darmo)” 133×21
- ranking-390-ciemny · cel `A` „Skrzynka do opiekunki roku” 174×21
- ranking-390-ciemny · cel `A` „Regulamin” 67×21
- ranking-390-ciemny · cel `A` „Polityka prywatności” 133×21
- ranking-390-ciemny · cel `A` „Kontakt” 51×21
- profil-390-ciemny · kontrast `SPAN` „Dziś” 11.3:1 (11.84 px)
- profil-390-ciemny · kontrast `SPAN` „Przedmioty” 11.3:1 (11.84 px)
- profil-390-ciemny · kontrast `SPAN` „Powtórki” 11.3:1 (11.84 px)
- profil-390-ciemny · kontrast `SPAN` „Terminy” 11.3:1 (11.84 px)
- profil-390-ciemny · kontrast `SPAN` „Kalendarz” 11.3:1 (11.84 px)
- profil-390-ciemny · kontrast `SMALL` „2. miejsce” 7.93:1 (10.6667 px)
- profil-390-ciemny · kontrast `SMALL` „3. miejsce” 7.93:1 (10.6667 px)
- profil-390-ciemny · kontrast `SPAN` „4” 8.92:1 (11.2 px)
- profil-390-ciemny · kontrast `.gry-badge.off` „🍃” 2.8:1 < 4.5:1
- profil-390-ciemny · kontrast `.gry-badge.off` „📚” 2.8:1 < 4.5:1
- profil-390-ciemny · kontrast `.gry-badge.off` „💚” 2.8:1 < 4.5:1
- profil-390-ciemny · kontrast `.gry-badge.off` „🃏” 2.8:1 < 4.5:1
- profil-390-ciemny · kontrast `.gry-badge.off` „🌉” 2.8:1 < 4.5:1
- profil-390-ciemny · cel `BUTTON.back` „←
Więcej” 96×36
- profil-390-ciemny · cel `BUTTON.kgab-slot.is-empty` „+” 39×34
- profil-390-ciemny · cel `BUTTON.kgab-slot.is-lock` „2. miejsce” 95×34
- profil-390-ciemny · cel `BUTTON.kgab-slot.is-lock` „3. miejsce” 95×34
- profil-390-ciemny · cel `BUTTON.btn.small.kprof-btn` „Zmień wygląd” 119×35
- profil-390-ciemny · cel `BUTTON.xp-chip.hud-coin.h-shine` „120” 69×30
- profil-390-ciemny · cel `BUTTON.link.lv-howlink` „Jak zdobywać XP i monety?” 187×22
- profil-390-ciemny · cel `A` „Plan zajęć (za darmo)” 133×21
- profil-390-ciemny · cel `A` „Skrzynka do opiekunki roku” 174×21
- profil-390-ciemny · cel `A` „Regulamin” 67×21
- profil-390-ciemny · cel `A` „Polityka prywatności” 133×21
- profil-390-ciemny · cel `A` „Kontakt” 51×21
- awans-4-390-ciemny · axe color-contrast · `#skrot-wm` · Element has insufficient color contrast of 1.91 (foreground color: #4a5b52, background color: #1d3126, font size: 7.5pt (10px), font weight: normal). Expected c
- sklep-1280-jasny · cel `BUTTON.back` „←
Więcej” 96×36
- sklep-1280-jasny · cel `A` „Plan zajęć (za darmo)” 133×21
- sklep-1280-jasny · cel `A` „Skrzynka do opiekunki roku” 174×21
- sklep-1280-jasny · cel `A` „Regulamin” 67×21
- sklep-1280-jasny · cel `A` „Polityka prywatności” 133×21
- sklep-1280-jasny · cel `A` „Kontakt” 51×21
- ranking-1280-jasny · kontrast `.kav-l` „Ł” 1:1 < 4.5:1
- ranking-1280-jasny · kontrast `SPAN` „Nocny Marek” 14.97:1 (11.84 px)
- ranking-1280-jasny · kontrast `.kav-l` „C” 1:1 < 4.5:1
- ranking-1280-jasny · kontrast `SPAN` „Pogromca Makro” 12.03:1 (11.84 px)
- ranking-1280-jasny · kontrast `.kav-l` „B” 1.18:1 < 4.5:1
- ranking-1280-jasny · cel `BUTTON.back` „←
Więcej” 96×36
- ranking-1280-jasny · cel `BUTTON.btn.small` „Pseudonim: Bartek · widoczny” 226×35
- ranking-1280-jasny · cel `BUTTON.fchip` „Cały rok” 88×40
- ranking-1280-jasny · cel `BUTTON.fchip` „C111” 59×40
- ranking-1280-jasny · cel `BUTTON.fchip` „C112” 62×40
- ranking-1280-jasny · cel `BUTTON.fchip` „C113” 62×40
- ranking-1280-jasny · cel `SELECT.input.rk-sel` „Wszystkie przedmioty
Analiza matematyczn” 320×43
- ranking-1280-jasny · cel `BUTTON.rk-who` „B
Ty (Bartek)” 869×34
- ranking-1280-jasny · cel `A` „Plan zajęć (za darmo)” 133×21
- ranking-1280-jasny · cel `A` „Skrzynka do opiekunki roku” 174×21
- ranking-1280-jasny · cel `A` „Regulamin” 67×21
- ranking-1280-jasny · cel `A` „Polityka prywatności” 133×21
- ranking-1280-jasny · cel `A` „Kontakt” 51×21
- profil-1280-jasny · kontrast `.kav-l` „B” 1.08:1 < 3:1
- profil-1280-jasny · kontrast `SMALL` „2. miejsce” 7.75:1 (10.6667 px)
- profil-1280-jasny · kontrast `SMALL` „3. miejsce” 7.75:1 (10.6667 px)
- profil-1280-jasny · kontrast `SPAN` „4” 5.04:1 (11.2 px)
- profil-1280-jasny · kontrast `.gry-badge.off` „🍃” 2.11:1 < 4.5:1
- profil-1280-jasny · kontrast `.gry-badge.off` „📚” 2.11:1 < 4.5:1
- profil-1280-jasny · kontrast `.gry-badge.off` „💚” 2.11:1 < 4.5:1
- profil-1280-jasny · kontrast `.gry-badge.off` „🃏” 2.11:1 < 4.5:1
- profil-1280-jasny · kontrast `.gry-badge.off` „🌉” 2.11:1 < 4.5:1
- profil-1280-jasny · cel `BUTTON.back` „←
Więcej” 96×36
- profil-1280-jasny · cel `BUTTON.kgab-slot.is-empty` „+” 39×34
- profil-1280-jasny · cel `BUTTON.kgab-slot.is-lock` „2. miejsce” 95×34
- profil-1280-jasny · cel `BUTTON.kgab-slot.is-lock` „3. miejsce” 95×34
- profil-1280-jasny · cel `BUTTON.btn.small.kprof-btn` „Zmień wygląd” 119×35
- profil-1280-jasny · cel `BUTTON.xp-chip.hud-coin.h-shine` „120” 69×30
- profil-1280-jasny · cel `BUTTON.link.lv-howlink` „Jak zdobywać XP i monety?” 187×22
- profil-1280-jasny · cel `A` „Plan zajęć (za darmo)” 133×21
- profil-1280-jasny · cel `A` „Skrzynka do opiekunki roku” 174×21
- profil-1280-jasny · cel `A` „Regulamin” 67×21
- profil-1280-jasny · cel `A` „Polityka prywatności” 133×21
- profil-1280-jasny · cel `A` „Kontakt” 51×21
- sklep-1280-ciemny · cel `BUTTON.back` „←
Więcej” 96×36
- sklep-1280-ciemny · cel `A` „Plan zajęć (za darmo)” 133×21
- sklep-1280-ciemny · cel `A` „Skrzynka do opiekunki roku” 174×21
- sklep-1280-ciemny · cel `A` „Regulamin” 67×21
- sklep-1280-ciemny · cel `A` „Polityka prywatności” 133×21
- sklep-1280-ciemny · cel `A` „Kontakt” 51×21
- ranking-1280-ciemny · kontrast `SPAN` „Nocny Marek” 12.07:1 (11.84 px)
- ranking-1280-ciemny · kontrast `SPAN` „Pogromca Makro” 10.29:1 (11.84 px)
- ranking-1280-ciemny · cel `BUTTON.back` „←
Więcej” 96×36
- ranking-1280-ciemny · cel `BUTTON.btn.small` „Pseudonim: Bartek · widoczny” 226×35
- ranking-1280-ciemny · cel `BUTTON.fchip` „Cały rok” 88×40
- ranking-1280-ciemny · cel `BUTTON.fchip` „C111” 59×40
- ranking-1280-ciemny · cel `BUTTON.fchip` „C112” 62×40
- ranking-1280-ciemny · cel `BUTTON.fchip` „C113” 62×40
- ranking-1280-ciemny · cel `SELECT.input.rk-sel` „Wszystkie przedmioty
Analiza matematyczn” 320×43
- ranking-1280-ciemny · cel `BUTTON.rk-who` „B
Ty (Bartek)” 869×34
- ranking-1280-ciemny · cel `A` „Plan zajęć (za darmo)” 133×21
- ranking-1280-ciemny · cel `A` „Skrzynka do opiekunki roku” 174×21
- ranking-1280-ciemny · cel `A` „Regulamin” 67×21
- ranking-1280-ciemny · cel `A` „Polityka prywatności” 133×21
- ranking-1280-ciemny · cel `A` „Kontakt” 51×21
- sklep-390-en · kontrast `SPAN` „Today” 16.79:1 (11.84 px)
- sklep-390-en · kontrast `SPAN` „Subjects” 16.79:1 (11.84 px)
- sklep-390-en · kontrast `SPAN` „Reviews” 16.79:1 (11.84 px)
- sklep-390-en · kontrast `SPAN` „Deadlines” 16.79:1 (11.84 px)
- sklep-390-en · kontrast `SPAN` „Calendar” 16.79:1 (11.84 px)
- sklep-390-en · cel `BUTTON.back` „←
More” 84×36
- sklep-390-en · cel `A` „Timetable (free)” 102×21
- sklep-390-en · cel `A` „Message box for the year supervisor” 229×21
- sklep-390-en · cel `A` „Terms of service” 103×21
- sklep-390-en · cel `A` „Privacy policy” 89×21
- sklep-390-en · cel `A` „Contact” 53×21
- ranking-390-en · kontrast `SPAN` „Today” 16.79:1 (11.84 px)
- ranking-390-en · kontrast `SPAN` „Subjects” 16.79:1 (11.84 px)
- ranking-390-en · kontrast `SPAN` „Reviews” 16.79:1 (11.84 px)
- ranking-390-en · kontrast `SPAN` „Deadlines” 16.79:1 (11.84 px)
- ranking-390-en · kontrast `SPAN` „Calendar” 16.79:1 (11.84 px)
- ranking-390-en · kontrast `.kav-l` „Ł” 1:1 < 4.5:1
- ranking-390-en · kontrast `SPAN` „Night Owl” 14.97:1 (11.84 px)
- ranking-390-en · kontrast `.kav-l` „C” 1:1 < 4.5:1
- ranking-390-en · kontrast `SPAN` „Macro Conqueror” 12.03:1 (11.84 px)
- ranking-390-en · kontrast `.kav-l` „B” 1.18:1 < 4.5:1
- ranking-390-en · cel `BUTTON.back` „←
More” 84×36
- ranking-390-en · cel `BUTTON.btn.small` „Nickname: Bartek · visible” 197×35
- ranking-390-en · cel `BUTTON.fchip` „Whole year” 107×40
- ranking-390-en · cel `BUTTON.fchip` „C111” 59×40
- ranking-390-en · cel `BUTTON.fchip` „C112” 62×40
- ranking-390-en · cel `BUTTON.fchip` „C113” 62×40
- ranking-390-en · cel `SELECT.input.rk-sel` „All subjects
Mathematical Analysis
Busin” 320×43
- ranking-390-en · cel `BUTTON.rk-who` „B
You (Bartek)” 219×34
- ranking-390-en · cel `A` „Timetable (free)” 102×21
- ranking-390-en · cel `A` „Message box for the year supervisor” 229×21
- ranking-390-en · cel `A` „Terms of service” 103×21
- ranking-390-en · cel `A` „Privacy policy” 89×21
- ranking-390-en · cel `A` „Contact” 53×21
- poziomy-i-rangi-390-jasny · kontrast `SPAN` „1” 10.37:1 (10.88 px)
- poziomy-i-rangi-390-jasny · kontrast `SPAN` „2” 8.6:1 (10.88 px)
- poziomy-i-rangi-390-jasny · kontrast `.ico` „🔍” 3.19:1 < 4.5:1
- poziomy-i-rangi-390-jasny · kontrast `SPAN` „3” 8.6:1 (10.88 px)
- poziomy-i-rangi-390-jasny · kontrast `.ico` „📅” 3.19:1 < 4.5:1
- poziomy-i-rangi-390-jasny · kontrast `SPAN` „4” 8.6:1 (10.88 px)
- poziomy-i-rangi-390-jasny · kontrast `.ico` „✅” 3.19:1 < 4.5:1
- poziomy-i-rangi-390-jasny · kontrast `SPAN` „5” 8.6:1 (10.88 px)
- poziomy-i-rangi-390-jasny · kontrast `.ico` „💡” 3.19:1 < 4.5:1
- poziomy-i-rangi-390-jasny · kontrast `SPAN` „6” 8.6:1 (10.88 px)
- poziomy-i-rangi-390-jasny · kontrast `.ico` „📊” 3.19:1 < 4.5:1
- poziomy-i-rangi-390-jasny · kontrast `SPAN` „7” 8.6:1 (10.88 px)
- poziomy-i-rangi-390-jasny · kontrast `.ico` „♟️” 3.19:1 < 4.5:1
- poziomy-i-rangi-390-jasny · kontrast `SPAN` „8” 8.6:1 (10.88 px)
- poziomy-i-rangi-390-jasny · kontrast `.ico` „🎓” 3.19:1 < 4.5:1
- poziomy-i-rangi-390-jasny · kontrast `SPAN` „9” 8.6:1 (10.88 px)
- poziomy-i-rangi-390-jasny · kontrast `SPAN` „10” 8.6:1 (10.88 px)
- poziomy-i-rangi-390-jasny · kontrast `.ico` „🧭” 3.19:1 < 4.5:1
- poziomy-i-rangi-390-jasny · kontrast `SPAN` „11” 8.6:1 (10.88 px)
- poziomy-i-rangi-390-jasny · kontrast `.ico` „🚀” 3.19:1 < 4.5:1
- poziomy-i-rangi-390-jasny · kontrast `SPAN` „12” 8.6:1 (10.88 px)
- poziomy-i-rangi-390-jasny · kontrast `.ico` „🔭” 3.19:1 < 4.5:1
- poziomy-i-rangi-390-jasny · kontrast `SPAN` „13” 8.6:1 (10.88 px)
- poziomy-i-rangi-390-jasny · kontrast `.ico` „🦉” 3.19:1 < 4.5:1
- poziomy-i-rangi-390-jasny · kontrast `SPAN` „14” 8.6:1 (10.88 px)
- poziomy-i-rangi-390-jasny · kontrast `.ico` „💼” 3.19:1 < 4.5:1
- poziomy-i-rangi-390-jasny · kontrast `SPAN` „15” 8.6:1 (10.88 px)
- poziomy-i-rangi-390-jasny · kontrast `.ico` „🏢” 3.19:1 < 4.5:1
- poziomy-i-rangi-390-jasny · kontrast `SPAN` „16” 8.6:1 (10.88 px)
- poziomy-i-rangi-390-jasny · kontrast `.ico` „👔” 3.19:1 < 4.5:1
- poziomy-i-rangi-390-jasny · kontrast `SPAN` „17” 8.6:1 (10.88 px)
- poziomy-i-rangi-390-jasny · kontrast `.ico` „👑” 3.19:1 < 4.5:1
- poziomy-i-rangi-390-jasny · kontrast `SPAN` „18” 8.6:1 (10.88 px)
- poziomy-i-rangi-390-jasny · kontrast `.ico` „🌟” 3.19:1 < 4.5:1
- poziomy-i-rangi-390-jasny · kontrast `SPAN` „19” 8.6:1 (10.88 px)
- poziomy-i-rangi-390-jasny · kontrast `.ico` „💎” 3.19:1 < 4.5:1
- poziomy-i-rangi-390-jasny · kontrast `SPAN` „20” 8.6:1 (10.88 px)
- poziomy-i-rangi-390-jasny · cel `BUTTON.link` „Jak zdobywać XP i monety?” 174×20
- poziomy-i-rangi-390-jasny · cel `BUTTON.btn.primary` „Jasne” 318×43
- poziomy-i-rangi-390-jasny · axe color-contrast · `#skrot-wm` · Element has insufficient color contrast of 1.57 (foreground color: #cacfcd, background color: #ffffff, font size: 7.5pt (10px), font weight: normal). Expected c
- jak-zdobywac-390-jasny · cel `BUTTON.btn.primary` „Jasne” 76×43
- jak-zdobywac-390-jasny · cel `BUTTON.btn.ghost` „Sklep i Zadania dnia” 175×43
- jak-zdobywac-390-jasny · axe color-contrast · `#skrot-wm` · Element has insufficient color contrast of 1.57 (foreground color: #cacfcd, background color: #ffffff, font size: 7.5pt (10px), font weight: normal). Expected c
