# Audyt użyteczności – pętla 6, runda 0

**Wynik: 4,9 / 10**

Oceniał student 1. roku Business Management, który pierwszy raz otwiera Zdawalni na telefonie. Robiłem wszystko wyłącznie przez sondę, oglądałem każdy zrzut i porównywałem z Duolingo, Headspace, Brilliant oraz z zasadami Nielsena.

| Kryterium | Punkty | Max |
|---|---|---|
| Wykonanie zadań (21 zadań, 28 z 42 pkt) | 2,7 | 4 |
| Zrozumiałość | 0,9 | 2 |
| Pierwsze minuty | 0,9 | 1,5 |
| Błędy i wyjścia | 0,4 | 1 |
| Technika (z kontroli automatycznej) | 0,0 | 1,5 |
| **Razem** | **4,9** | 10 |

## Twarde błędy (każdy ogranicza wynik do 5)

1. **Czerwone testy:** 3 testy Playwright nie przechodzą: `ux2-etap4` (1 ✗), `ux2-etap5` (3 ✗) i `ux4-etapW1` (1 ✗). Z kontroli wynika, że na kodzie wyjściowym nie przechodzą tak samo.
2. **Tekst poniżej normy kontrastu (AA):** 5 ekranów. Najgorzej wypada ciemny „Przygotuj się”, gdzie zdanie „Zrób test diagnostyczny…” ma kontrast 1,1:1, czyli jest praktycznie niewidoczne. Do tego ciemna ściągawka (1,5:1) i Kalendarz na komputerze (3,0:1).
3. **Tekst bez wersji EN:** 16 ekranów po angielsku zawiera polskie słowa, np. „Nie udało się wczytać. Odśwież stronę.”, „35 zł / mies.”, „próba 1 of 6”, „Kolokwium: …”, „Polityka pieniężna”.

Tych błędów nie znalazłem: zadanie ★ za 0 pkt, `undefined`/`null`/`NaN`, przewijanie w bok przy 360 px, błąd konsoli, ruch przy włączonym „Mniej animacji”. Kontrola nie znalazła też ślepych uliczek. Ja trafiłem na jedną *prawie* ślepą uliczkę: arkusz terminu nie znika po przycisku „wstecz” (opis w P1-2). Nie liczę jej jako twardego błędu, bo klawisz Esc go zamyka. Telefon nie ma jednak Esc.

**Do wiadomości, bez wpływu na ocenę:** ceny 199 zł do 11 lipca 2027 oraz 35 zł/mies. (sprawdź, czy miesięczna cena jest ta, którą planujesz). Zakup wymaga 2 zgód: regulaminu i rezygnacji z 14 dni na odstąpienie. Przy zakładaniu konta zgoda jest dorozumiana („Zakładając konto, akceptujesz regulamin”). Próba trwa 3 dni. Adres pomocy jest na Gmailu. Treść lekcji i quizów w tym środowisku to dane testowe („Akapit 1 o pojęciu 1”, „Quiz pochodne 10?”), więc jej nie oceniam.

## Pierwsze 3 minuty (konto próbne, świeże)

- **Co to za apka:** od razu widać, że to apka do nauki na studia. Wita mnie „Cześć, Student”, na środku jest „Lekcja 1: Pochodne funkcji” i duży limonkowy przycisk „Zaczynamy · 5 min”.
- **Co kliknąłbym najpierw:** „Zaczynamy · 5 min”. To jedyna duża, jaskrawa rzecz i mówi, ile to zajmie.
- **Czego nie rozumiem:**
  - „Świeżak”: to ranga? Po co?
  - Dwa różne paski XP: „0/30 XP” na Dziś i „0/100 XP” w Więcej.
  - Kółka „Ten tydzień: 0/4 dni”, a w poniedziałek „przerwa”. Dlaczego 4?
  - Napis „Utrwalanie” nad *pierwszą* lekcją. Co mam utrwalać, skoro nic jeszcze nie zrobiłem?
  - Kim jest „Staś”?
  - Na karcie lekcji pierwsze są „Fiszki”, a sesja zaczyna się od „Najważniejsze”.
  - „Jestem w drodze”: zaznaczyłem i nic się nie zmieniło.
  - „Stażysta Staś”, „Lekcja na przejazd”, „10 minut przed snem”, „Powtórka w 5 minut”: cztery podobne rzeczy, nie wiem, czym się różnią.
  - Gry „Fruń”, „Przejdź”, „Drabina”: same nazwy nic mi nie mówią.
  - Skrót „OWI” w Kalendarzu.
  - Kalendarz w opisie mówi „Widok miesiąca”, a włączone jest „Najbliższe 2 tygodnie”.
- **Nie wiem, jak wrócić / nie zadziałało:** pierwsze dotknięcie zakładki „Kalendarz” nic nie zrobiło, zadziałało dopiero drugie. „Stażysta Staś” pokazuje „Staś jeszcze nic nie przygotował. Zajrzyj później.” i nie daje żadnej akcji.
- **Ocena:** główny przycisk jest jeden i dobry. Nad nim są jednak 4 pigułki grywalizacji z liczbami, których nowy student nie rozumie. Pod nim dochodzą „Zadania dnia”, „Lekcje dla Ciebie” z inną lekcją („Lekcja 2: Całki oznaczone”) i prośba o mail. Kontrola liczy na Dziś 5 „głównych” przycisków. Headspace czy Duolingo pokazują w tym miejscu jedną rzecz.

## Zadania

| # | Wynik | Kroki / limit | Co się działo |
|---|---|---|---|
| Z1 ★ | 2 | 7 / 8 | Kierunek → Dalej → „Zacznij 3 dni za darmo” → mail → kod. Szybko i jasno, bez karty. |
| Z2 ★ | 2 | 1 / 4 | „Zaczynamy · 5 min” startuje od razu, a ekran końcowy jest czytelny. |
| Z3 ★ | 2 | 3 / 5 | Przedmioty → wyszukiwarka „inflacja” → „PKB i inflacja”. (Pierwsze podejście unieważniłem: sam podałem w sondzie zły numer pola.) |
| Z4 ★ | 1 | 3 / 4 | Terminy → kliknąłem tytuł kolokwium i **nic się nie stało** → „Przygotuj się”. Informacja o teście jest konkretna. |
| Z5 ★ | 1 | 5 / 5 | Dziś w ogóle nie mówi o teście za 3 dni. W Terminach duży „Przygotuj się” **nie reaguje**, działa mała strzałka. Otwiera się Prawo z napisem **„81 dni · wtorek, 26 sty”**, choć kolokwium jest za 3 dni. |
| Z6 | 2 | 2 / 3 | Powtórki → „Zaczynamy”, 8 fiszek. Na ekranie końcowym w tle widać przez chwilę „3 fiszki do powtórki”. |
| Z7 | 2 | 2 / 4 | Wyszukiwarka pokazuje „Opportunity cost · koszt alternatywny” z definicją. Świetnie. |
| Z8 | 2 | 3 / 4 | Analiza jest na samym dole listy, pod przedmiotami „Jeszcze bez materiałów”. W środku: „Opanowanie 25%”, „lekcje 1 z 2”, a na karcie „umiesz 0 z 2”. Trzy różne liczby. |
| Z9 | 1 | 7 / 5 | Sklep nie ma pełnej listy z cenami ani sortowania, nie wiem, co jest najtańsze. Kupiłem „Zamrożenie serii” (40). Okno potwierdzenia pisze „Tylko wygląd: nie zmienia punktów”, co tu jest nieprawdą. |
| Z10 | 0 | 8 / 4 | Ranking pokazuje osoby, nie grupy. Tydzień to 26.10–01.11, czyli poprzedni. „Jak radzi sobie kierunek”: „Za mało danych”. Porównania grup nie znalazłem. |
| Z11 | 2 | 4 / 6 | Więcej → na dół → „Język strony · switch to English” zmienia język od razu. Dobrze podpisane w obu językach. |
| Z12 | 1 | 5 / 6 | Księżyc w górnym pasku włącza ciemny wygląd. Pierwsze kliknięcie w wiersz „Mniej animacji” **nie przełączyło** go, zadziałało dopiero drugie. |
| Z13 ★ | 1 | 5 / 4 | Ekran nie mówi, że próba się skończyła, jest tylko „Pełny dostęp · 199 zł…”. Dalej: plan → 2 zgody → atrapa płatności. W tekście błąd: „co miesiąc wyszłoby ok. 315 zł”. |
| Z14 | 1 | 5 / 5 | Szukałem w Kalendarzu (nie ma tam tej opcji). Znalazłem w Terminach → „⋯” → „Dodaj do kalendarza w telefonie”. Po kliknięciu **nic się nie pokazuje**, nie wiem, czy się udało. |
| Z15 | 1 | 5 / 4 | Wyszukanie „napisz do nas” nic nie dało. „Kontakt” w stopce nic nie pokazał. Dopiero wyszukanie „kontakt” → „Pomoc i kontakt” z adresem mail. |
| Z16 | 0 | 7 / 6 | W szczegółach terminu nie ma żadnej edycji. „Tryb starosty” jest wyłączony i da się go znaleźć tylko przez wyszukiwarkę funkcji (sprawdziłem w osobnym, nieliczonym podejściu), czyli to ukryta funkcja. Do tego „wstecz” przy otwartym arkuszu zostawił arkusz na ekranie Dziś i zablokował zakładki. Drugi „wstecz” wyrzucił mnie z apki. |
| Z17 | 2 | 1 / 3 | Wzorcowy ekran powrotu: „Dobrze, że jesteś. Ostatnio 7 dni temu… Wracam: 3 minuty”. |
| Z18 | 0 | 7 / 4 | Cenę widać w 2 krokach. Nigdzie (arkusz planów, Przedmioty, Konto) nie ma jednak listy, co dostanę po zakupie w porównaniu z darmowym kontem. |
| N10 | 2 | 1 / 6 | Kliknięcie pigułki serii pokazuje kalendarz serii i zasadę zamrożeń. Ta zasada („do 2 dni”) przeczy opisowi w sklepie („jeden dzień”). |
| N12 | 2 | 3 / 6 | Wyszukanie „instrukcja” → „Przewodnik po stronie” (11 rozdziałów). |
| N5 | 1 | 7 / 6 | Wyszukanie „zaproś” prowadzi do „Polecaj i zarabiaj” (pieniądze), a nie do wspólnej nauki. Dopiero „znajomy” → „Paczka i duet” → „Załóż paczkę” → kod i „Kopiuj link”. |

Wylosowane niespodzianki: **N10, N12, N5**.

## Problemy (od największego wpływu na studenta)

### P0: blokują zadanie albo zakup

1. **Nie wiadomo, co daje zakup** (Z18, Z13). Arkusz „Wybierz plan” pokazuje tylko ceny i sposób płatności. Darmowe konto nie wie, co traci, a konto po próbie nie dostaje komunikatu „próba się skończyła”.
   *Propozycja:* nad planami dodać listę 3–4 punktów:
   - PL: „Z pełnym dostępem: wszystkie lekcje i fiszki · próbne testy przed kolokwium · gry i powtórki · terminy Twojej grupy. Za darmo zostaje: plan zajęć i Twoje wpisy w kalendarzu.”
   - EN: „With full access: all lessons and flashcards · practice tests before every test · games and reviews · your group's deadlines. Free forever: timetable and your own calendar entries.”

   Na Dziś po końcu próby:
   - PL: „Twoje 3 dni próbne minęły. Postępy zostały na koncie.” [Kup dostęp]
   - EN: „Your 3-day trial has ended. Your progress is saved.” [Get access]
2. **Starosta nie znajdzie, jak wpisać termin dla roku** (Z16). „Tryb starosty” jest wyłączony i schowany w wyszukiwarce, a w szczegółach terminu nie ma „Zmień datę”.
   *Propozycja:* konto starosty ma tryb włączony od razu, a w arkuszu terminu pojawia się przycisk „Zmień termin dla całego roku” / „Change date for the whole year”.
3. **Brak porównania grup** (Z10). Ranking pokazuje poprzedni tydzień i pojedyncze osoby.
   *Propozycja:* nad listą osób pokazać wiersz „Twoja grupa C112: 2. miejsce z 3 grup w tym tygodniu” / „Your group C112: 2nd of 3 groups this week”, a tydzień ustawić na bieżący.

### P1: spowalniają lub mylą wielu

1. **Ekran „Dziś” nie reaguje na stan studenta** (Z5, Z6, Z8, Z2). Zawsze widzę „Lekcja 1: Pochodne funkcji · Zacznijmy od pierwszego tematu”, nawet gdy kolokwium z prawa jest za 3 dni, czeka 8 fiszek albo lekcja jest już zrobiona. Ekran końcowy obiecuje „Jutro: Lekcja 2: Zapasy i magazyny”, a lista na Dziś pokazuje „Lekcja 2: Całki oznaczone”. Duolingo zawsze pokazuje *następny* krok.
   *Propozycja:* przy teście w ciągu 7 dni karta główna to:
   - PL: „Kolokwium z prawa za 3 dni · Próbny test 10 min” [Zacznij]
   - EN: „Law test in 3 days · 10-min practice test” [Start]

   Przy zaległych fiszkach: „8 fiszek czeka · 3 min” / „8 flashcards due · 3 min”.
2. **„Wstecz” nie zamyka arkuszy, a arkusze nie mają przycisku zamknięcia** (Z16, kontrola zwiad-arkusz). Wstecz przenosi stronę pod spodem na Dziś, arkusz zostaje na wierzchu i blokuje zakładki. Kolejny wstecz wychodzi z apki.
   *Propozycja:* wstecz zamyka najpierw arkusz, a każdy arkusz ma w rogu „✕ Zamknij” / „✕ Close”.
3. **„Przygotuj się” prowadzi do złego terminu** (Z5). Przy „Kolokwium: Prawo · 9 lis · 3 dni” strona przygotowania mówi „81 dni · zaliczenie wykładu · wtorek, 26 sty”. Student uczy się pod złą datę.
   *Propozycja:* strona przygotowania pokazuje termin, z którego przyszedłem: „Kolokwium · poniedziałek, 9 lis · za 3 dni”. Jeśli przedmiot ma dwa terminy, przełącznik: „Kolokwium 9 lis | Zaliczenie wykładu 26 sty”.
4. **Kliknięcia bez reakcji** (Z4, Z5, Z12, Z14, Z15). Dotyczy:
   - tytułu kolokwium w Terminach,
   - dużego „Przygotuj się” na karcie „Najbliższe” (360 px),
   - pierwszego kliknięcia w wiersz „Mniej animacji”,
   - „Dodaj do kalendarza w telefonie” (brak potwierdzenia),
   - „Kontakt” w stopce,
   - pierwszego dotknięcia zakładki „Kalendarz”.

   *Propozycja:* cały wiersz/karta działa jak przycisk. Po dodaniu kalendarza pojawia się okno: „Gotowe. Jeśli telefon zapyta, wybierz »Subskrybuj«. Terminy będą się same aktualizować.” / „Done. If your phone asks, choose “Subscribe”. Deadlines will update automatically.” „Kontakt” otwiera Pomoc i kontakt z adresem do skopiowania.
5. **Jedna rzecz ma wiele nazw** (pierwsze minuty, Z4, Z8, Z9):
   - Sesja 5 minut to: „Zaczynamy · 5 min”, „Karta 5 minut”, „Powtórka w 5 minut”, a obok niej są „Lekcja na przejazd”, „Jestem w drodze” i „10 minut przed snem”.
   - OWI to raz „Kolokwium”, raz „Zaliczenie wykładu”.
   - XP to raz „0/30”, raz „0/100”.
   - Postęp przedmiotu to „umiesz 0 z 2”, „lekcje 1 z 2”, „Opanowanie 25%” i gwiazdki.

   *Propozycja:* jedna nazwa „Sesja 5 min” / „5-min session”. Rodzaj zaliczenia zawsze ten sam co w Terminach. Rozróżnić „Cel dnia 0/30 XP” i „Poziom 1 · 0/100 XP”. Na karcie przedmiotu jedna liczba: „Opanowanie 25%” / „Mastery 25%”.
6. **Wyszukiwarka nie rozumie zwykłych słów i są dwie różne** (Z15, N5). „Napisz do nas” nic nie znajduje, „zaproś” prowadzi do zarabiania. Wyszukiwarka funkcji jest w Więcej, a wyszukiwarka treści w Przedmiotach.
   *Propozycja:* dodać synonimy: napisz/zgłoś/błąd/pomoc → „Pomoc i kontakt”, a zaproś/wspólna nauka/znajomy → „Paczka i duet” jako pierwszy wynik. Jedno pole „Szukaj tematu, pojęcia albo funkcji” / „Search topics, terms or features” w obu miejscach.
7. **„Normalnie · EN” pokazuje polski tekst** (Z3). Nie wiem, czy to przełącznik języka, czy trudności.
   *Propozycja:* „Po angielsku (jak na wykładzie)” / „Po polsku, prościej”. EN: „English (as in class)” / „Polish, simpler”.
8. **Sklep: brak przeglądu cen i błędne opisy** (Z9, N10). Nie da się zobaczyć wszystkiego naraz ani posortować po cenie. Potwierdzenie zakupu zamrożenia mówi „Tylko wygląd”. W sklepie zamrożenie chroni „jeden dzień”, a w oknie serii „do 2 dni”. Po zakupie nie widać nowego salda.
   *Propozycja:* sortowanie „Od najtańszych” / „Cheapest first”. W potwierdzeniu zamrożenia: „Chroni serię, gdy opuścisz 1 dzień. Zakupu nie da się cofnąć.” / „Protects your streak if you miss 1 day. This can't be undone.” Po zakupie komunikat: „Kupione. Zostało Ci 110 monet.” / „Bought. You have 110 coins left.”
9. **Mylący rachunek w arkuszu planów** (Z13). „Zostało ok. 9 miesięcy, a co miesiąc wyszłoby ok. 315 zł.”
   *Propozycja:* „Płacąc co miesiąc, za 9 miesięcy zapłacisz ok. 315 zł.” / „Paying monthly, 9 months would cost about 315 zł.”
10. **Przedmioty z materiałami są na dole** (Z8). Najpierw jest 6 kart „Jeszcze bez materiałów”, a Analiza i Logistyka (jedyne z lekcjami) na końcu.
    *Propozycja:* sortować najpierw przedmioty z materiałami albo z najbliższym terminem i materiałami. Puste karty zebrać pod nagłówkiem „Wkrótce” / „Coming soon”.

### P2: drobne

1. Po wejściu w „Przygotuj się” z Terminów podświetlona zakładka przeskakuje na „Przedmioty”. Nie wiem, gdzie jestem.
2. Pole daty w polskiej wersji pokazuje format amerykański „11/20/2026”.
3. Przyciski tylko w formie męskiej: „Wiedziałem”, „Nie wiedziałem”, „Pewny”. Lepiej: „Wiem” / „Nie wiem” / „Na pewno”.
4. Na ekranie końcowym sesji odznaka „×3” / „×8” jest ucięta przy prawej krawędzi.
5. Po sesji „Zadania dnia: 0/3” się nie zmieniają. Za modalem końcowym przez chwilę widać stare „3 fiszki”.
6. Kalendarz: opis „Widok miesiąca” przy włączonych „2 tygodniach”.
7. Ranking: „3 aktywne osoby”, a na liście 2. Tydzień jest poprzedni.
8. Sprzeczne informacje o teście OWI: termin 20 lis, a opis „zaliczenie najpewniej na ostatnim wykładzie (23.11)”. W Prawie opis mówi „test jednokrotnego wyboru”, a próbny test ma pytania otwarte i 10 pytań zamiast zapowiedzianych 14.
9. „Opanowanie 25%” nie zgadza się z podanym wzorem: 1 z 2 lekcji zrobiona po 60% daje 30%.
10. Małe cele dotyku (kontrola: 161 ekranów):
    - pole „Jestem w drodze” i zgody przy zakupie mają 20×20 px,
    - „Ściągawka do druku” ma 21 px wysokości,
    - „Wyłącz” (tryb starosty) ma 50×21 px,
    - ikony „?” i „⋯” mają 32 px,
    - linki „Regulamin · Prywatność” mają 17 px wysokości.
11. „Stażysta Staś” z pustym stanem bez akcji. Lepiej: „Staś przygotuje błędy po Twojej pierwszej lekcji.” [Zrób lekcję]
12. Pole „Jestem w drodze” po zaznaczeniu nic widocznie nie zmienia.

## Wyniki kontroli automatycznej (skrót)

- Technika 0/1,5. Naruszeń jest 7 rodzajów, a każdy odejmuje 0,25 pkt:
  - kontrast (5 ekranów),
  - cele < 44 px (161),
  - tekst < 12 px (14),
  - emoji jako ikony (5),
  - więcej niż 1 główny przycisk (21),
  - główna akcja poniżej ekranu przy 360 px (13),
  - polskie słowa w EN (16).
- Czysto: brak przewijania w bok, błędów konsoli, `undefined`, przycisków bez podpisu, ślepych uliczek i ruchu przy „Mniej animacji”.
- Testy: 394/394 testów jednostkowych zielone, test regresji zadań 18/18, 3 testy Playwright czerwone.

## Mocne strony

- Start bez karty: kierunek, rok i kod z maila zajmują 7 kroków. Jasno napisane „Bez karty i bez płatności” i „Nic się samo nie przedłuża”.
- „Zaczynamy · 5 min” startuje sesję jednym dotknięciem. Sesja ma pasek postępu, „✕” z podpisem „postęp się zapisze” i czytelne podsumowanie z serią i XP.
- Ekran powrotu po 7 dniach (Z17) jest na poziomie Duolingo: przywitanie, co się zmieniło, jedna akcja na 3 minuty.
- Wyszukiwarka pojęć z parą EN–PL i definicją (Z7) to dokładnie to, czego potrzebuje student zajęć po angielsku.
- Strona „Przygotuj się” podaje konkrety: forma zaliczenia, ECTS, daty wykładów, próg 50%.
- Zmiana języka działa od razu i jest podpisana w obu językach. Ciemny wygląd jest jednym kliknięciem w górnym pasku na komputerze.
- „Mniej animacji” ma jasny opis, a po włączeniu pokazuje stan („Włączone: cała strona bez ruchu”).
- Pusty stan Powtórek mówi, co zrobić, i daje przycisk.
- Arkusz planów jest uczciwy: „Nic się samo nie odnawia”, „Anulujesz w każdej chwili”.
