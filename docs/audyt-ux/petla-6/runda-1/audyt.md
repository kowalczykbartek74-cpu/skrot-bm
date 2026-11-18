# Audyt UX – pętla 6, runda 1

Wynik: **7,1 / 10**. Twardych błędów nie ma.

Test robiłem jako student 1. roku Business Management, który pierwszy raz otwiera Zdawalni na telefonie. Każdy krok robiłem przez sondę i oglądałem zrzut ekranu. Porównuję z Duolingo, Headspace i Brilliant.

## Punkty

| Kryterium | Punkty | Skąd |
|---|---|---|
| Wykonanie zadań (18 + 3 niespodzianki) | **3,52 / 4** | 37 z 42 punktów: 16 zadań sprawnie, 5 z trudem, 0 porażek |
| Zrozumiałość | **1,2 / 2** | za dużo nazw na jedną rzecz (XP, postęp, sesja 5 minut, rodzaje zaliczeń) |
| Pierwsze minuty | **1,0 / 1,5** | od razu wiadomo, co to jest, ale Dziś ma za dużo elementów i 2–3 główne przyciski |
| Błędy i wyjścia | **0,6 / 1** | wstecz i zamykanie działają; pierwsze dotknięcia nie działały, puste stany bez akcji, obietnice bez treści |
| Technika (z kontroli) | **0,75 / 1,5** | 3 rodzaje naruszeń: tekst < 12 px, więcej niż 1 główny przycisk, główna akcja poniżej ekranu przy 360 px |
| **Razem** | **7,1** | |

**Twarde błędy:** brak. Żadne zadanie ★ nie skończyło się zerem. Kontrola nie znalazła ślepych uliczek, `undefined`, poziomego przewijania, błędów konsoli, tekstu poniżej AA, polskiego w wersji EN ani ruchu przy „Mniej animacji”. Testy: 394/394 i 20/20 zielone. Pełny przebieg Playwright na końcowym kodzie jeszcze trwał (patrz kontrola.md), więc nie liczę go jako czerwonego.

**Nie obniżają oceny, tylko wypisuję:** ceny 199 zł / 35 zł; dwie zgody przed płatnością; długość próby opisana na 4 sposoby („dzień 1 z 3”, „zostały 2 dni”, „do nd 22:00”, „do 9 listopada 17:00”); nazwa planu („do końca 2. semestru”, „do 11 lipca 2027”, „do końca roku akademickiego”, „Plan roczny”); próbna treść lekcji („Akapit 1 o pojęciu 1”); adres pomocy na gmail.com.

## Pierwsze 3 minuty

- **Co to za apka:** do nauki na studia. Ma 5-minutowe lekcje, fiszki, quizy, terminy kolokwiów i plan zajęć mojego roku, a do tego serię dni, XP i monety jak w Duolingo.
- **Co kliknąłbym najpierw:** „Zaczynamy · 5 min”, bo to największy jasny przycisk i obiecuje tylko 5 minut.
- **Czego nie rozumiem:** „Świeżak”; „0/30 XP” na Dziś i „0/100 XP” w Więcej; „Ten tydzień: 0/4 dni” z przekreślonym kółkiem; „Utrwalanie” przy pierwszej lekcji w życiu; czym różni się „Inny temat” od „Wybierz temat”; dlaczego główna karta to Pochodne, a „Najważniejsze teraz” to Całki; pole „Jestem w drodze”; nazwy „Stażysta Staś”, „Fruń”, „Przejdź”; skrót „OWI”; „Skrzynka do opiekunki roku”.
- **„Nie wiem, jak wrócić”:** nie trafiłem na taki ekran. Przycisk wstecz telefonu zamknął grę, a ekrany mają „← Więcej” albo „← Przedmioty”.
- **„Nie wiem, co to”:** Stażysta Staś był pusty („Zajrzyj później”) i nie miał żadnego przycisku. Gra „Fruń” przypomina Flappy Bird i nie mówi, gdzie w niej są pytania.

## Zadania

| # | Wynik | Ruchy / limit | Co się działo |
|---|---|---|---|
| Z1 ★ | 2 | 6 / 8 | Wejście bez płacenia jest jasne, kod z maila sam się zatwierdza. Po zalogowaniu apka drugi raz pyta o grupę. |
| Z2 ★ | 2 | 1 / 4 | „Zaczynamy · 5 min” prowadzi do końca. Ekran końcowy: plakietka ×3 ucięta, a po zrobionej karcie dalej „Zadania dnia 0/3”. |
| Z3 ★ | 2 | 5 / 5 | Przedmioty → szukaj „inflacja” → „PKB i inflacja”. Jeden ruch był zbędny przez mój błąd w sondzie, nie przez apkę. |
| Z4 ★ | 1 | 3 / 4 | Tytuł w karcie „Najbliższe” wygląda na przycisk, ale nic nie robi. Szczegóły dopiero z listy. Brak godziny i sali. |
| Z5 ★ | 1 | 5 / 5 | Dziś nie mówi o teście za 3 dni. Pierwszy klik „Przygotuj się” nic nie zrobił. Próbny test ma inny format niż opis zaliczenia. |
| Z6 | 2 | 2 / 3 | Pomogła plakietka „8” na Powtórkach. Karta na Dziś o fiszkach milczy. |
| Z7 | 2 | 2 / 4 | Wyszukiwarka od razu daje „koszt alternatywny”. |
| Z8 | 2 | 3 / 4 | Analiza jest na końcu listy. Cztery różne liczby postępu. |
| Z9 | 1 | 7 / 5 | Długi sklep, nie da się posortować po cenie. Okno zakupu pisze nieprawdę („Tylko wygląd”). Po zakupie brak potwierdzenia. |
| Z10 | 2 | 2 / 4 | Ranking → Grupy roku jest czytelny. |
| Z11 | 2 | 4 / 6 | Język jest na samym dole Więcej. |
| Z12 | 1 | 5 / 6 | Ciemny wygląd włącza ikona księżyca bez podpisu. Pierwszy klik w „Mniej animacji” nic nie zrobił. |
| Z13 ★ | 2 | 4 / 4 | Okno po próbie jest od razu na starcie. Pola zgód są małe (20 px). |
| Z14 | 2 | 2 / 5 | Kalendarz → Do telefonu. Opis mówi raz „5 minut po zajęciach”, raz „pół godziny po”. |
| Z15 | 2 | 3 / 4 | Więcej → Pomoc → adres e-mail. |
| Z16 | 1 | 7 / 6 | „Edytuj termin” jest schowane. Data w formacie amerykańskim, dymek zasłania pole, a po zapisie apka nie mówi, że widzi to cały rok. |
| Z17 | 2 | 1 / 3 | Bardzo dobry ekran powrotu „Wracam: 3 minuty”. |
| Z18 | 2 | 2 / 4 | Więcej → Kup dostęp. Na Dziś nie ma przycisku „Kup dostęp”. |
| N10 | 2 | 1 / 6 | Klik w „0 dni” → „Twoja seria” z jasnymi zasadami. |
| N3 | 2 | 2 / 6 | Więcej → Hasło dnia (liter nie liczę). Brak legendy kolorów, dwa dymki „+20 XP” na sobie. |
| N4 | 2 | 5 / 6 | Pseudonim zmieniony, ale zostaję „ukryty”, bo przełącznik był wyłączony. |

Wylosowane niespodzianki: **N10, N3, N4**.

## Najważniejsze problemy (od największego wpływu)

1. **P1 – Dziś nie reaguje na sytuację studenta.** W każdym stanie główna karta to „Lekcja 1: Pochodne · Utrwalanie · Zacznijmy od pierwszego tematu”: przy teście z prawa za 3 dni, przy 8 fiszkach do powtórki i przy już zrobionej lekcji. Niżej „Najważniejsze teraz” poleca inną lekcję.
   *Zmiana:* karta pokazuje jedną rzecz według kolejności: najpierw test w ciągu 7 dni („Kolokwium z prawa za 3 dni · Zrób próbny test (45 min)” / „Law test in 3 days · Take a practice test (45 min)”), potem fiszki („8 fiszek czeka · ok. 3 min” / „8 flashcards due · about 3 min”), potem następna lekcja. Przy nowym temacie zamiast „Utrwalanie” pisze „Nowy temat” / „New topic”.
2. **P1 – Pierwsze dotknięcie czasem nie działa.** Zdarzyło się 4 razy: Kalendarz, karta „Najbliższe”, „Przygotuj się”, „Mniej animacji”. Drugie dotknięcie działało. Może to wina szybkości sondy, więc trzeba sprawdzić na telefonie. Prawdopodobna przyczyna: animacja wejścia ekranu blokuje dotyk.
3. **P1 – Kilka nazw i liczb na jedną rzecz.**
   - XP: „0/30” i „0/100”, a nigdzie nie pisze „cel dnia”.
   - Postęp przedmiotu: pasek ~50%, „umiesz 0 z 2”, „Opanowanie 25%”, „1 z 2 lekcji”.
   - Krótka sesja ma 6 nazw: „Zaczynamy · 5 min”, „Karta 5 minut”, „Powtórka w 5 minut”, „Lekcja na przejazd”, „Po zajęciach w 5 minut”, „10 minut przed snem”.

   *Zmiana:* „Cel dnia 0/30 XP” / „Daily goal 0/30 XP”; jedna miara „Opanowanie 25% · 1 z 2 lekcji” / „Mastery 25% · 1 of 2 lessons”; jedna nazwa „Karta 5 minut” / „5-minute card”.
4. **P1 – Kolokwium, egzamin i zaliczenie wykładu się mieszają.**
   - Przedmioty piszą „wykład za 77 dni”.
   - Makroekonomia ma tego samego dnia „Kolokwium” i „Zaliczenie wykładu”.
   - Zadanie dnia „Sprint OWI (zaliczenie wykładu za 14 dni)” dotyczy kolokwium.

   *Zmiana:* zawsze pełna nazwa rodzaju („zaliczenie wykładu za 77 dni” / „lecture exam in 77 days”), bez zdublowanych wpisów.
5. **P1 – OWI „jeszcze bez materiałów”, a apka proponuje przygotowanie.** To najbliższe kolokwium, a mimo to apka pokazuje „Przygotuj się”, Sprint OWI i plan nauki OWI w kalendarzu.
   *Zmiana:* „Materiały do OWI w przygotowaniu · powiadomimy Cię mailem” / „OWI materials coming soon · we'll email you”, bez zadań z OWI.
6. **P1 – Próbny test z prawa nie pasuje do opisu.** Opis zaliczenia mówi o teście jednokrotnego wyboru. Próbny test zapowiada 14 pytań, w tym otwarte, a w środku ma 10 i zaczyna od pytania otwartego. Format i liczba pytań muszą się zgadzać z opisem.
7. **P1 – Sklep.** Zadania dnia są w środku sklepu i nie da się posortować po cenie. Okno zakupu Zamrożenia serii pisze „Tylko wygląd” (nieprawda), a po zakupie nie ma potwierdzenia.
   *Zmiana:* dymek „Kupiono: Zamrożenie serii. Zostało 110 monet.” / „Bought: Streak freeze. 110 coins left.” i opis „Chroni serię, gdy opuścisz jeden dzień.”
8. **P2 – Edycja terminu przez starostę.** Potrzebny wyraźny przycisk „Zmień datę dla całego roku” i data po polsku (dd.mm.rrrr). Po zapisie: „Zapisano. Cały rok widzi nową datę: wt 15 gru.” / „Saved. The whole year now sees: Tue 15 Dec.”
9. **P2 – Arkusz terminu.** Głównym przyciskiem jest „Odhacz”. Powinno być „Przygotuj się”, a obok godzina i sala, albo „Godzina i sala: jeszcze nie podano”.
10. **P2 – Drobne:**
    - Stażysta Staś pusty bez akcji. Proponuję: „Staś przygotuje błędy po Twojej pierwszej lekcji” + „Zrób kartę 5 minut”.
    - Pseudonim zapisany, ale „ukryty”.
    - Kalendarz: opis mówi o widoku miesiąca, a otwiera się widok 2 tygodni; sprzeczne „5 minut” i „pół godziny”.
    - Plakietka ×3 ucięta na ekranie końcowym.
    - Hasło dnia bez legendy kolorów.
    - Przełącznik „Normalnie · EN” pokazuje polski tekst.
    - „Naciśnij spację” na telefonie.
    - Grupa pytana dwa razy przy wejściu.
    - Małe cele dotyku według sondy: „?” i „…” 32 px, zgody 20 px, „Data orientacyjna” 13 px, „Ściągawka do druku” 21 px. Kontrola automatyczna pokazała tu 0 naruszeń, więc trzeba sprawdzić, jak liczy.

## Mocne strony

- Wejście jest proste: 3 kroki, „Bez karty i bez płatności”, kod z maila zatwierdza się sam.
- Karta 5 minut ma pasek kroków, „Zgaduję / Pewny”, zamknięcie z dopiskiem „postęp się zapisze” i ekran końcowy z serią i planem na jutro, jak w Duolingo.
- Ekran powrotu po przerwie jest dobry: ciepły tekst, bez wyrzutów, jeden przycisk.
- Wyszukiwarka pojęć EN–PL działa w 2 ruchach.
- Terminy mają duży licznik dni, plakietkę na dolnym pasku i źródło wpisu.
- Kalendarz do telefonu ma instrukcję dla Google, Apple i Outlooka.
- Ekran zakupu jest uczciwy: co dostajesz, ile oszczędzasz, „Nic się samo nie odnawia”.
- Arkusz serii dobrze tłumaczy zasady.
- Pusty stan Powtórek ma przycisk do działania.
- Na komputerze ciemny wygląd i EN są jednym kliknięciem.

Zrzuty wszystkich kroków są w `zrzuty/` (C3-…, Z1-… do Z18-…, N3-…, N4-…, N10-…), a pełne dane w `audyt.json`.
