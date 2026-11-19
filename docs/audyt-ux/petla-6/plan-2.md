# Plan rundy 2 (po audycie rundy 1: 7,1/10, bez twardych błędów; ★ Z4 i Z5 = 1)

| # | Problem (audyt 1) | Zadania | Ekran | Zmiana | Sprawdzenie | Koszt |
|---|---|---|---|---|---|---|
| 1 | P1 „pierwsze dotknięcie nic nie robi” (4×) | Z4, Z5, Z12, C3 | różne | sprawdzone: aplikacja reaguje za pierwszym razem; sonda podawała tytuł ekranu pod oknem (tester widział „Terminy” zamiast otwartego arkusza) i nie umiała kliknąć elementu po przerysowaniu → sonda: tytuł z okna, ponowne wyszukanie elementu po podpisie | dziennik sondy (`przerysowanie`, `nieudany`) | S |
| 2 | P1 Dziś zawsze „Lekcja 1 · Zacznijmy od pierwszego tematu” | Z5, Z6, C3 | Dziś | (a) atrapa jak produkcja: lekcje z prawa i makroekonomii – karta mówi wtedy „Przed kolokwium · zostało 3 dni”; (b) „Utrwalanie” tylko po przerobionej lekcji, dymek „Utrwalmy temat z ostatniej lekcji”; (c) „Na rozgrzewkę: N fiszek do powtórki” | ręcznie (tekst Dziś dla stanów) | M |
| 3 | P1 obietnice bez pokrycia: „Przygotuj się” przy przedmiocie bez materiałów | Z4 | Terminy | „Przygotuj się” tylko gdy przedmiot ma materiały | Z4, Z5 | S |
| 4 | P1 Sklep: „Tylko wygląd” przy zamrożeniu | Z9 | Sklep | „Chroni serię w dzień bez nauki.” | ręcznie | S |
| 5 | P2 arkusz terminu: główny „Odhacz” | Z4, Z5 | Terminy | „Przygotuj się” główny, „Odhacz” drugorzędny | W1 | S |
| 6 | P2 starosta: „Edytuj termin” mały link | Z16 | Terminy | zwykły przycisk; data w formacie PL (sonda: locale pl-PL, wcześniej gubione w h2-lib) | Z16 6/6 | S |
| 7 | P2 Kalendarz: „Widok miesiąca” vs „2 tygodnie”, „5 minutach po zajęciach” vs „pół godziny” | Z14 | Kalendarz | spójne opisy | ux2-etap4 (test: nowy podpis) | S |
| 8 | P2 pusty Staś bez akcji | C3 | Staś | „Wróć do nauki na dziś” | ręcznie | S |
| 9 | P1 XP 0/30 bez podpisu | C3 | Dziś | „cel 0/30 XP” | zrzut 360 | S |
| 10 | Technika: więcej niż 1 główny przycisk | – | Dziś, Gry, Przygotuj się, Sklep, przedmiot | jeden główny na ekran (pozostałe drugorzędne) | kontrola | S |
| 11 | Technika: główna akcja poniżej 360×640 | – | przedmiot, materiał, Sklep bez dostępu | przedmiot: „Następna lekcja” przed statystyką, mniejsza okładka na niskim ekranie; materiał: „Dalej” przyklejone nad dolnym paskiem; Sklep: „Kup dostęp” pod tytułem | kontrola | M |
| 12 | (znalezione przy okazji) konto bez dostępu: „Wszystkie lekcje przerobione 🎉” przy zamkniętych lekcjach | Z18 | przedmiot | „Lekcje są w pełnym dostępie: wypróbuj 3 dni / zobacz plany” | ręcznie | S |
| 13 | Technika: tekst < 12 px w tabeli ocen 1280 | – | Kalkulator ocen | 12 px | kontrola | S |

Przeniesione: kilka miar postępu przedmiotu (pasek, „umiesz”, Opanowanie, „Zrobione lekcje”), wiele nazw sesji 5 min, rodzaje zaliczeń (kolokwium/zaliczenie wykładu) w Przedmiotach, format próbnego testu vs opis zaliczenia (szablon z sylabusa), Sklep bez sortowania po cenie, ranking: domyślnie ukryty po zapisie pseudonimu (prywatność – do-decyzji, jeśli wróci).
Znane ograniczenie: przy 360×640 przycisk „Następna lekcja” na ekranie przedmiotu kończy się na 611 px, czyli w oknie, ale częściowo pod dolnym paskiem (72 px).
