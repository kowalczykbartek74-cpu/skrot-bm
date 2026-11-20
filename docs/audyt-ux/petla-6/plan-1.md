# Plan rundy 1 (po audycie rundy 0: 4,9/10)

Kolejność: twarde błędy → P0 → zadania ★ < 2 → P1 dla wielu zadań. Sprawdzenie: `ux6-zadania.mjs` (Z…) albo pomiar w `kontrola.mjs`.

| # | Problem (audyt) | Zadania | Ekran | Zmiana | Sprawdzenie | Koszt |
|---|---|---|---|---|---|---|
| 1 | Twardy: czerwone testy ux2-etap4/5, ux4-etapW1 | – | – | asercje po c1356b9 (zrobione w czasie audytu: 96cdf2d, f19c1df, 974ee7d) | testy zielone | S |
| 2 | Twardy: tekst < AA (ciemne Przygotuj się 1,1:1, ciemna ściągawka, Hasło 4,44, Kalendarz 1280, Boss 1280) | Z5 | Przygotuj się, ściągawka, Hasło, Kalendarz, Boss | kolory z palety H2 (`--h-*`, `--ink`, `--muted`) w ciemnym i na kafelkach kalendarza | kontrola: kontrast 0 | S |
| 3 | Twardy: teksty bez EN („Nie udało się wczytać. Odśwież stronę.”, „35 zł / mies.”, „próba 1 of 6”, „Nasze lekcje i przegląd…”, „Pokazuje, co jest w całym przedmiocie.” i inne z kontroli) | Z11 | wiele | pary w `i18n-en.js` (blok `// ux-6`); pomiar nie liczy treści, którą README każe zostawić po polsku (nazwiska, tytuły i treść lekcji, wpisy starosty, „zł”) | kontrola: polskie_w_en 0 | M |
| 4 | P0: nie wiadomo, co daje zakup; po próbie brak informacji, że się skończyła | Z18, Z13 | okno „Wybierz plan” | nad planami lista „W pełnym dostępie” (lekcje i fiszki do każdego przedmiotu, próbne testy i plan przed kolokwium, Powtórki i gry, terminy i kalendarz w telefonie); po próbie tytuł „Twój okres próbny się skończył” i zdanie, że postępy zostają; „co miesiąc wyszłoby ok. 315 zł” → „na planie miesięcznym to ok. 315 zł” | Z13, Z18 (asercja: lista i 199 zł) | S |
| 5 | P0: starosta nie znajdzie edycji terminu | Z16 | szczegóły terminu | starosta widzi „Edytuj termin” zawsze; przy wyłączonym trybie przycisk sam go włącza | Z16 ≤ 6 kroków | S |
| 6 | P0: brak porównania grup | Z10 | Ranking | zakładka „Grupy” na górze rankingu: średnia punktów na aktywną osobę w każdej grupie tego tygodnia (moja wyróżniona), grupa < 3 aktywnych osób → „za mało osób”; SQL v63 `nauka_ranking_grupy` (tylko sumy, bez nicków) | Z10, PGlite v63 | M |
| 7 | P1: „wstecz” nie zamyka arkusza, brak ✕ | wiele | wszystkie arkusze | otwarcie arkusza dopisuje wpis w historii, „wstecz” zamyka arkusz; ✕ w rogu każdego arkusza | asercja w ux6-zadania (wstecz zamyka) | M |
| 8 | P1: „Przygotuj się” pokazuje zły termin (81 dni zamiast 3) | Z5 | Przygotuj się | przedmiot z jedną częścią: bliższe kolokwium wpisane bez części wygrywa z datą z opisu zaliczenia | Z5 (widać „3 dni”) | S |
| 9 | P1: kliknięcia bez reakcji (tytuł kolokwium, „Przygotuj się” przy 360, pierwszy klik „Mniej animacji”, kalendarz bez potwierdzenia, „Kontakt” w stopce) | Z4, Z5, Z12, Z14, Z15 | Terminy, Wygląd, stopka | tytuł otwiera szczegóły; cały wiersz przełącznika działa; toast po dodaniu kalendarza; „Kontakt” → Pomoc z adresem | Z4, Z12, Z15 | M |
| 10 | P1: wyszukiwarka funkcji bez „napisz do nas”, „kontakt”, „zaproś” | Z15, N5 | Więcej → Szukaj | słowa kluczowe przy Pomocy (kontakt, napisz, błąd, problem) i Paczce (zaproś, znajomy, razem) | ręcznie przez sondę | S |
| 11 | Technika: cele < 44 px (menu 40 px, logo 28 px, małe pola), tekst < 12 px, emoji w Przygotuj się i kalendarzu | wszystkie | nagłówek, Przygotuj się, Kalendarz | menu i logo 44 px, „Menu” podpisane, min. 12 px, SVG zamiast emoji | kontrola | M |

Przeniesione do rundy 2 (jeśli zostaną w audycie): Dziś zawsze proponuje Lekcję 1 (P1 #4), wiele nazw sesji 5 min (P1 #8), Sklep bez listy cen (P1 #11), kolejność Przedmiotów (P1 #13), pigułki na pierwszym ekranie (P1 #14), P2.
Do decyzji Bartka: nic nowego (ceny bez zmian; zmieniam tylko zdanie o porównaniu).
