# Audyt użyteczności – pętla 6, runda 2

Patrzyłem na apkę jak student 1. roku Business Management, który otwiera Zdawalni pierwszy raz na telefonie, i jednocześnie jak surowy recenzent, który porównuje ją z Duolingo, Headspace i Brilliant. Wszystko robiłem przez sondę i oglądałem każdy zrzut ekranu.

## Wynik: **8,0 / 10**

| Kryterium | Punkty | Skąd |
|---|---|---|
| Wykonanie zadań (21 zadań) | **3,62 / 4** | 38 z 42 możliwych punktów (szczegóły niżej) |
| Zrozumiałość | **1,3 / 2** | dużo nazw na jedną rzecz, niespójne liczby postępu |
| Pierwsze minuty | **1,1 / 1,5** | główny przycisk jasny, ale ekran przeładowany licznikami |
| Błędy i wyjścia | **0,7 / 1** | „Wyloguj” nie działa, mylący przycisk wstecz, sklep bez cen |
| Technika | **1,25 / 1,5** | z kontroli automatycznej: jeden rodzaj naruszenia (2 główne przyciski na ekranie przedmiotu po końcu próby) |

**Twarde błędy: brak.** Żadne zadanie z gwiazdką nie skończyło się porażką. Kontrola nie znalazła ślepych uliczek, `undefined`/`null`, poziomego przewijania, błędów konsoli, słabego kontrastu, polskiego tekstu w wersji EN ani ruchu przy „Mniej animacji”. Testy są zielone.

Rzeczy, które tylko odnotowuję (nie wpływają na ocenę): ceny 199 zł do 11 lipca 2027 i 35 zł/mies., plakietka „Najtaniej” przy 199 zł, regulamin i zgoda na utratę prawa odstąpienia przed płatnością, próba trwa 3 dni, marka „Zdawalni”, treść lekcji to szablon testowy („Akapit 1 o pojęciu 1”, „Check pochodne 1?”, w lekcji o inflacji są akapity o pochodnych, „dział 1: Dział”), tytuły lekcji i wpisów zostają po polsku w wersji EN.

## Pierwsze 3 minuty (konto na próbie, świeży start)

**Co to za apka:** apka do nauki na studia. Codziennie krótka sesja 5 minut (fiszki, najważniejsze z tematu, 2 pytania) pod moje przedmioty z BM, do tego terminy kolokwiów i plan zajęć. Jestem na 3-dniowej próbie.

**Co kliknąłbym najpierw:** „Zaczynamy · 5 min”. To jedyny duży, jaskrawy przycisk, obiecuje tylko 5 minut i od razu mówi, co w nich będzie. Dobra robota.

**Czego nie rozumiałem:**
- Pasek u góry: „Świeżak”, „0” (moneta), „0 dni”, „cel 0/30 XP”, siedem kółek „Ten tydzień: 0/4 dni”. To pięć liczników bez słowa wyjaśnienia.
- U góry jest „Lekcja 1: Pochodne funkcji”, a niżej „Najważniejsze teraz: Lekcja 2: Całki oznaczone”. Która z nich jest najważniejsza?
- „Inny temat” i „Wybierz temat” stoją obok siebie. Czym się różnią?
- W menu jest „Stażysta Staś”. Nie wiadomo, co to jest, a po kliknięciu jest pusto („Staś jeszcze nic nie przygotował”).
- Krótka nauka ma pięć nazw: „Zaczynamy · 5 min”, „Karta 5 minut”, „Powtórka w 5 minut”, „Lekcja na przejazd”, „10 minut przed snem”.
- W Kalendarzu jest „OWI” bez rozwinięcia. Gry „Fruń”, „Przejdź”, „Drabina” nic nie mówią. Nie wiem też, czym jest „Skrzynka do opiekunki roku” w stopce.
- Ten sam termin to raz „Kolokwium”, raz „zaliczenie wykładu”. W Przedmiotach przy OWI jest „Jeszcze bez materiałów”, a w Kalendarzu „Plan nauki OWI · Test diagnostyczny”.
- Na Dziś próba to „dzień 1 z 3 · do nd 22:00”, a w Przedmiotach „zostały 2 dni”.

Nigdzie nie zgubiłem drogi powrotnej: dolne zakładki są zawsze widoczne, a zamknięcie sesji zapisuje postęp („Wróć · zostało ok. 4 min”).

## Zadania

| # | Wynik | Kroki / limit | Co się działo |
|---|---|---|---|
| Z1 ★ | 2 | 8 / 8 | Kierunek → rok i grupa → „Zacznij 3 dni za darmo” → e-mail → kod. Na pierwszym ekranie nie ma jeszcze słowa „za darmo”. |
| Z2 ★ | 2 | 1 / 4 | „Zaczynamy · 5 min” startuje od razu, sesja kończy się ekranem z serią. |
| Z3 ★ | 2 | 5 / 5 | Przedmioty → szukaj „inflacja” → lekcja. Wystarczą 3 kroki; 2 dodatkowe to moja pomyłka w sondzie. |
| Z4 ★ | 2 | 2 / 4 | Terminy → kolokwium: data, zakres, kto wpisał. Brakuje godziny. |
| Z5 ★ | 2 | 4 / 5 | Na Dziś nie ma próbnego testu. Trzeba wejść w Terminy → Przygotuj się → przewinąć → „Rozpocznij próbny test”. |
| Z6 | 2 | 2 / 3 | Powtórki (plakietka 8) → „Zaczynamy” → 8 fiszek. |
| Z7 | 2 | 2 / 4 | Wyszukiwarka od razu pokazuje „koszt alternatywny”. |
| Z8 | 2 | 3 / 4 | Lista mówi „umiesz 0 z 2”, a w środku jest „Opanowanie 25%, 1 z 2 lekcji”. |
| Z9 | **1** | 8 / 5 | Droższe rzeczy w sklepie nie mają ceny, tylko „Brakuje 50”, więc musiałem przewinąć cały sklep. Po zakupie nie widać salda. |
| Z10 | 2 | 2 / 4 | Więcej → Ranking kierunku → grupy roku. |
| Z11 | 2 | 4 / 6 | Język zmienia się jednym dotknięciem w obie strony. |
| Z12 | 2 | 4 / 6 | Księżyc w pasku daje ciemny motyw; Więcej → Wygląd → „Mniej animacji”. |
| Z13 ★ | 2 | 4 / 4 | „Wybierz 199 zł” → 2 zgody → płatność. Na styk. |
| Z14 | 2 | 3 / 5 | Kalendarz → „Do telefonu” → Google, Apple albo Outlook. |
| Z15 | 2 | 3 / 4 | Więcej → Pomoc → adres (na gmailu). |
| Z16 | 2 | 6 / 6 | Edycja terminu jako starosta. Dymek zasłania jedno pole. |
| Z17 | **1** | 1 / 3 | „Wracam: 3 minuty” nie mówi, gdzie skończyłem, więc zgadywałem. |
| Z18 | 2 | 2 / 4 | „Kup dostęp” jest dopiero w Więcej, a okno planów jest jasne. |
| N12 | 2 | 3 / 6 | Szukaj „instrukcja” → Przewodnik. Przycisk wstecz mówi „Ustawienia”. |
| N10 | 2 | 1 / 6 | Po dotknięciu „0 dni” widać serię i zamrożenia. |
| N11 | **0** | 6 / 6 | **„Wyloguj” nic nie robi**, nadal jestem zalogowany. |

Zadania niespodzianki (wylosowane): **N12, N10, N11**.

## Najważniejsze problemy (od największego wpływu)

**P0. „Wyloguj” nie działa** (N11). Kliknąłem dwa razy: nie było pytania ani komunikatu i dalej byłem zalogowany. To blokuje zadanie i jest ryzykiem dla prywatności na cudzym telefonie. *Trzeba sprawdzić, czy to nie skutek udawanego logowania w sondzie.* Docelowo powinno pojawić się pytanie „Wylogować się z tego urządzenia? / Log out of this device?”, a po wylogowaniu dymek „Wylogowano. / You're logged out.”.

**P1. Przed kolokwium Dziś nie prowadzi do próbnego testu** (Z5). Karta mówi „Do zaliczenia z Prawo zostało 3 dni”, ale główny przycisk to zwykłe 5 minut. Jest tam też błąd odmiany („z Prawo”). Propozycja: gdy do terminu zostało 7 dni albo mniej, główny przycisk to „Próbny test · 45 min / Practice test · 45 min”, a pod nim mniejszy „Albo 5 minut powtórki”. Nagłówek: „Prawo: zaliczenie za 3 dni”.

**P1. Opis zaliczenia nie zgadza się z próbnym testem** (Z5, Z4). Ten sam termin to „Kolokwium” albo „zaliczenie wykładu”. Opis mówi „test jednokrotnego wyboru”, a próbny test ma studium przypadku i pytania otwarte. Student ćwiczy inny format niż na prawdziwym teście. Propozycja: jedna nazwa z sylabusa wszędzie, a jeśli format się różni, napisać to wprost („Na teście będą tylko pytania zamknięte, tu ćwiczysz też otwarte”).

**P1. Pięć nazw na krótką naukę.** „Zaczynamy · 5 min”, „Karta 5 minut”, „Powtórka w 5 minut”, „Lekcja na przejazd”, „10 minut przed snem” i „Po zajęciach w 5 minut”. Propozycja: jedna nazwa „5 minut na dziś / Today's 5 minutes”, jeden kafelek w Więcej, a warianty jako przełącznik w karcie Dziś.

**P1. Postęp przedmiotu pokazują cztery różne liczby** (Z8). Lista mówi „umiesz 0 z 2” mimo zrobionej lekcji, a w środku jest „Opanowanie 25%”, „1 z 2 lekcji” i gwiazdki. Propozycja: wszędzie „25% opanowane · 1 z 2 lekcji”.

**P1. Sklep ukrywa ceny i nie potwierdza zakupu** (Z9). Propozycja: „200 monet · brakuje 50” na przycisku, sortowanie „Od najtańszych”, a po zakupie dymek „Kupione: Zamrożenie serii. Zostało 110 monet.”.

**P1. Po przerwie apka nie mówi, gdzie skończyłem** (Z17). Do tego obiecuje „jedno pytanie”, a są co najmniej dwa. Propozycja: „Skończyłeś na: Analiza matematyczna · Lekcja 2: Całki oznaczone. Najpierw 3 minuty rozgrzewki, potem wracasz tam.”.

**Drobne (P2):**
- Dziś ma dwie różne „najważniejsze” lekcje i pięć liczników bez podpisów.
- Na końcu sesji licznik „×3”/„×8” jest ucięty przy prawej krawędzi, a „Seria przedłużona!” pojawia się już przy pierwszym dniu.
- U starosty dymek zasłania pole „Data orientacyjna” (13×13 px), a baner jest przycięty.
- Na kroku „1 Przeczytaj” przycisk „Dalej: Quiz” pomija Fiszki.
- Przycisk wstecz mówi „← Ustawienia”, choć wszedłem z Więcej.
- Na telefonie pojawia się „naciśnij spację”.
- Odpowiedzi są tylko w formie męskiej („Wiedziałem”, „Pewny”).
- Małe cele dotyku, których kontrola nie złapała: „Ściągawka do druku” i „Klasyczny widok” mają 21 px wysokości, zgody przy płatności 20 px.
- Kontakt to adres na gmailu.
- Link kalendarza pokazuje surowy adres serwera.
- Pole daty pokazuje 12/04/2026, czyli najpierw miesiąc (może to zależeć od języka przeglądarki).

## Co działa dobrze

- Wejście dla nowego studenta zajmuje 3 kroki, a cena i „bez karty, nic się samo nie przedłuża” są podane uczciwie przed założeniem konta.
- Na Dziś jest jeden wyraźny główny przycisk z rozpisaniem, co jest w tych 5 minutach.
- Zamknięcie sesji nie gubi postępu.
- Wyszukiwarka znajduje pojęcia EN↔PL i lekcje od jednego słowa.
- Karta terminu podaje datę, zakres i źródło. Starosta zmienia termin dla całego roku w 6 krokach.
- Język, ciemny motyw i „Mniej animacji” są jasne i działają od razu.
- Kalendarz w telefonie to subskrypcja z instrukcją dla Google, Apple i Outlooka.
- Zakup to 4 kroki ze zgodami opisanymi zwykłym językiem.
- Kontrola automatyczna jest prawie czysta, a testy są zielone.

Pliki: `audyt.json` (dane), zrzuty w `zrzuty/` (np. `N11-05.png`, `Z5-01.png`, `Z9-05.png`, `Z8-04.png`).
