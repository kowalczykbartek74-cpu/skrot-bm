# Audyt UX – pętla 6, runda 4

Zrobił go student 1. roku Business Management (US), który pierwszy raz otwiera Zdawalni na telefonie, i jednocześnie surowy recenzent użyteczności. Za punkt odniesienia wziąłem Duolingo, Headspace, Brilliant i heurystyki Nielsena. Apkę oglądałem wyłącznie przez sondę: zrzuty ekranu i listę przycisków. Kodu nie czytałem.

## Wynik: **8,3 / 10**

| Kryterium | Punkty | Skąd |
|---|---|---|
| Wykonanie zadań (18 + 3 niespodzianki) | **3,71 / 4** | 39 z 42 możliwych punktów → 4 × 39 / 42 |
| Zrozumiałość | **1,2 / 2** | jedną rzecz nazywa się na kilka sposobów (egzaminy, sesje 5-minutowe, postęp) |
| Pierwsze minuty | **1,1 / 1,5** | jeden główny przycisk jest, ale obok wiszą sprzeczne podpowiedzi i dużo liczb bez objaśnienia |
| Błędy i wyjścia | **0,8 / 1** | cofanie działa wszędzie, ślepych uliczek nie ma; próbny test rusza bez ostrzeżenia, a dwie funkcje w menu są puste |
| Technika | **1,5 / 1,5** | kontrola automatyczna: 0 rodzajów naruszeń na 166 ekranach |

**Twarde błędy: brak.** Żadne zadanie ★ nie skończyło się zerem. Nie ma ślepych uliczek, nie widać `undefined`/`null`/`NaN`, nie ma poziomego przewijania ani błędów konsoli, kontrast trzyma AA. Testy są zielone (394/394, regresja zadań 20/20). Wersja EN jest kompletna, a „Mniej animacji” działa.

**Wypisuję tylko informacyjnie (to nie obniża oceny):**
- ceny: 199 zł jednorazowo do 11 lipca 2027 albo 35 zł/mies.,
- próba trwa 3 dni bez karty,
- przed płatnością są 2 zgody (regulamin i rezygnacja z 14 dni na odstąpienie),
- marka to „Zdawalni”,
- treść lekcji w danych testowych to zaślepki, np. lekcja „Inflacja i jej pomiar” pokazuje „Akapit 1 o pojęciu 1 w temacie pochodne”.

---

## 1. Pierwsze 3 minuty (konto próbne, świeży start)

**Co to za apka (po pierwszym ekranie):** apka do nauki na studia. Codziennie 5 minut (fiszki, najważniejsze z tematu, 2 pytania), do tego terminy kolokwiów i plan zajęć mojego roku. To wiem od razu.

**Co kliknąłbym najpierw:** „Zaczynamy · 5 min”. To największy przycisk i mówi, ile to potrwa. Pod tym względem jest jak w Duolingo.

**Czego nie rozumiem (słowa, ikony, liczby):**
- „Świeżak” (to poziom? ranga?), „cel 0/30 XP” (co to XP i po co 30), „Ten tydzień: 0/4 dni” z siedmioma kółkami (skąd 4, skoro kółek jest 7; pierwsze kółko jest przekreślone jako „przerwa”).
- „Staś”: kim jest i czemu podpisuje się pod radą?
- Na Dziś jest „Próba · dzień 1 z 3 · do nd 22:00”, a w Przedmiotach „zostały 2 dni pełnego dostępu”. Która liczba jest prawdziwa?
- „Inny temat” i „Wybierz temat” obok siebie. Czym się różnią?
- Karta mówi „Lekcja 1: Pochodne funkcji”, a niżej „Najważniejsze teraz: Lekcja 2: Całki oznaczone”. Co jest w końcu najważniejsze?
- Pole „Jestem w drodze”: co się stanie, jak je zaznaczę?
- W menu: „Stażysta Staś”, „Paczka i duet”, „Fruń / Przejdź / Drabina”, „Skrzynka do opiekunki roku”, „Profil nauki 6 minut”. Same nazwy nic nie mówią.
- Skróty „OWI”, „W”, „LAB” w Kalendarzu. Dla studenta są OK, ale nikt ich nie objaśnia.

**3 minuty chodzenia (10 ruchów):**
- „Nie wiem, co to”: „Stażysta Staś” w menu otwiera pusty ekran z napisem „Staś jeszcze nic nie przygotował. Zajrzyj później.”
- W Terminach ten sam kolokwium podpisany jest dwa razy: „Kolokwium: Ochrona własności intelektualnej” i pod spodem znów „Ochrona własności intelektualnej”.
- „Nie wiem, jak wrócić”: **nie zdarzyło się ani razu.** Każdy podekran ma „← Więcej” albo „← Przedmioty”, a wstecz w telefonie działa. Wyjątek: z formularza „Wgraj swój materiał” przycisk wraca do „← Przedmioty”, choć wszedłem z „Więcej”.

---

## 2. Zadania

| # | Wynik | Kroki / limit | Co się działo |
|---|---|---|---|
| Z1 ★ wypróbować za darmo | 2 | 7 / 8 | kierunek → rok → „Zacznij 3 dni za darmo” → e-mail → kod. Kod zatwierdził się sam po wpisaniu, więc moje ostatnie kliknięcie trafiło w pustkę. Ekran powitalny jest jasny. |
| Z2 ★ 5 minut w tramwaju | 2 | 1 / 4 do startu | „Zaczynamy · 5 min”, sesja przeszła płynnie i skończyła się ekranem serii. Znacznik „×3” w prawym górnym rogu jest ucięty, a po skończeniu nadal widać „Zadania dnia: 0/3”. |
| Z3 ★ lekcja o inflacji | 2 | 3 / 5 | Przedmioty → szukaj „inflacja” → „Lekcja 1: Inflacja i jej pomiar”. (Pierwsze podejście powtórzyłem, bo sam pomyliłem numer elementu. To nie wina apki.) |
| Z4 ★ test z OWI: kiedy i co | 2 | 2 / 4 | Terminy → kolokwium. Widać datę, zakres, źródło („Wpisał(a) starosta”). Brakuje godziny, a główny przycisk to „Odhacz”. |
| Z5 ★ próbny test z prawa (360×640) | 2 | 2 / 5 | „Próbny test: Prawo” jest pod zgięciem, trzeba przewinąć. Test **rusza od razu z zegarem 45:00**, bez ekranu „zaczynamy?”. |
| Z6 powtórz, co apka chce | 2 | 2 / 3 | Plakietka „8” na Powtórkach → „Zaczynamy →”. Podpowiedź „naciśnij spację” na telefonie nie ma sensu. |
| Z7 „opportunity cost” po polsku | 2 | 2 / 4 | Wyszukiwarka w Przedmiotach od razu daje „koszt alternatywny” z definicją. Świetne. |
| Z8 jak idzie z analizy | 2 | 3 / 4 | Analiza jest na dole listy, trzeba przewinąć. W środku są trzy różne miary: „umiesz 0 z 2 tematów” (kafelek), „Opanowanie 25%”, „Zrobione lekcje 1 z 2”. |
| Z9 kup najtańszą rzecz za monety | **1** | 7 / 5 | Katalog jest podzielony na zakładki i przeplata się z Zadaniami dnia, więc nie da się sprawdzić, co jest najtańsze. Zgadłem, że polecane „Zamrożenie serii 40”. Kliknięcie w polecaną rzecz tylko przewinęło stronę. Potwierdzenie zakupu było dobre, ale po zakupie zabrakło komunikatu. |
| Z10 czy grupa wypada lepiej | 2 | 2 / 4 | Więcej → Ranking kierunku: C112 „Twoja” 112 XP, inne grupy niżej. Ranking da się znaleźć tylko w menu. |
| Z11 angielski i z powrotem | 2 | 5 / 6 | Przełącznik języka jest na samym dole menu „Więcej” (2 przewinięcia). Zmienia język od razu i na całej stronie. |
| Z12 bez animacji + ciemny (komputer) | 2 | 4 / 6 | Więcej → Wygląd → „Mniej animacji” + „Zielony ciemny”. Opisy są jasne. |
| Z13 ★ kup dostęp po próbie | 2 | 4 / 4 | Okno „Twoje 3 dni minęły” → „Wybierz 199 zł” → 2 zgody → atrapa płatności. Pola zgód są malutkie (20×20). |
| Z14 terminy w kalendarzu telefonu | 2 | 3 / 5 | Kalendarz → „Do telefonu” → Google / Apple / Outlook. Widać surowy link „…supabase.co/functions…”. |
| Z15 napisać do twórców | 2 | 4 / 4 | Szukaj w menu („napisz”) → Pomoc i kontakt. Adres to zdawalni.support@**gmail.com**. |
| Z16 starosta: logistyka na 15 grudnia | 2 | 6 / 6 | Terminy → kolokwium → „Edytuj termin” → data → Zapisz. Domyślnie ustawione „Dla kogo: Cały rok”. Na ikonie menu widnieje niewyjaśniona plakietka „11”. |
| Z17 wróć po tygodniu | **1** | 1 / 3 | Karta powrotu jest dobra („Ostatnio 7 dni temu, zajęcia od tego czasu: 5, nowe terminy: 3”), ale ma **dwa** wyjścia: „Ostatnia lekcja: …” i „Wracam: 3 minuty”. Wybrałem na wyczucie. Lekcja otworzyła się od początku („krok 1 z 3”), bez śladu, gdzie skończyłem. |
| Z18 darmowe: co dostanę i za ile | 2 | 2 / 4 | Na Dziś nie ma „Kup dostęp”, jest tylko „Masz jeszcze 3 dni za darmo · Włącz”. Przycisk znalazłem w nagłówku menu. Okno planów jest jasne. |
| N2 gra z pytaniami | 2 | 3 / 6 | Powtórki → Wszystkie gry → Fruń. |
| N1 wgraj prezentację | 2 | 3 / 6 | Więcej → Moje materiały → „Wgraj swój materiał”. Na telefonie widnieje „Upuść plik tutaj”, a przycisk cofania prowadzi do „← Przedmioty”. |
| N8 prostsze wyjaśnienie po polsku | **1** | 4 / 6 | Przełącznik „Prościej · PL” jest w lekcji, ale treści nie ma („jeszcze w przygotowaniu”). Jest wskazówka, co robić dalej. |

Niespodzianki wylosowane: **N2, N1, N8**.

---

## 3. Problemy (od największego wpływu na studenta)

**P0: brak.** Żadne zadanie ani zakup nie zostało zablokowane.

### P1 (spowalniają albo mylą wielu)

1. **Jedno zaliczenie, kilka nazw.** OWI jest „kolokwium za 14 dni” w Terminach i Przedmiotach, ale „zaliczenie wykładu za 14 dni” w „Sprint OWI” (Sklep → Zadania dnia). Prawo jest „Przed kolokwium” na karcie Dziś, a „zaliczenie wykładu za 81 dni” w Przedmiotach. Na kafelkach stoi samo „wykład za 77 dni”, co brzmi jak termin wykładu. Student nie wie, czy to ten sam sprawdzian.
   → Nazwa ma pochodzić z jednego miejsca, zawsze w formie „{rodzaj}: {przedmiot} · za N dni”. Kafelek: „zaliczenie wykładu za 77 dni” / EN „lecture exam in 77 days”. Na karcie Dziś używać tego samego rodzaju co w Terminach.

2. **Siedem nazw na „krótką naukę”.** Mamy „Dziś · 5 min / Zaczynamy · 5 min”, „Karta 5 minut” (Powtórki), „Powtórka w 5 minut”, „Lekcja na przejazd”, „10 minut przed snem” (menu), „Po zajęciach w 5 minut” (przedmiot), „Wracam: 3 minuty” i pole „Jestem w drodze”. Duolingo ma jedną lekcję dnia, a Headspace jedną sesję dnia.
   → Wszędzie jedna nazwa „Dziś · 5 min”. W Powtórkach przycisk „Zacznij Dziś · 5 min” / „Start Today · 5 min”. „Powtórka w 5 minut”, „Lekcja na przejazd” i „10 minut przed snem” połączyć w jedną listę „Mam więcej czasu ▾” na karcie Dziś i usunąć je z menu.

3. **Postęp w przedmiocie mierzony trzema liczbami** (Z8). Kafelek pokazuje „umiesz 0 z 2 tematów”, ekran przedmiotu „Opanowanie 25%” i „Zrobione lekcje 1 z 2”, a czytnik ekranu dodaje jeszcze „gwiazdki: 0”. Student widzi „0” na liście i „25%” w środku.
   → Jedna miara w obu miejscach: „Opanowanie 25% · lekcje 1/2” / „Mastery 25% · lessons 1/2”.

4. **Ekran Dziś sam sobie przeczy.** Główna karta mówi „Lekcja 1: Pochodne funkcji”, a niżej „Najważniejsze teraz: Lekcja 2: Całki oznaczone”. Obok głównego przycisku są jeszcze trzy dodatkowe, w tym „Inny temat” i „Wybierz temat”, które robią prawie to samo. Do tego 5 liczników w nagłówku (Świeżak, monety, dni, cel XP, tydzień 0/4) bez objaśnień.
   → Połączyć „Inny temat” i „Wybierz temat” w „Zmień temat ▾” / „Change topic ▾”. Sekcję niżej nazwać „Po dzisiejszej lekcji” / „After today's lesson” zamiast „Najważniejsze teraz”. Przy pierwszym wejściu pokazać jedno zdanie pod licznikami: „XP zbierasz za naukę; 30 XP = cel dnia.” / „You earn XP for studying; 30 XP = daily goal.”

5. **Próbny test startuje bez pytania** (Z5). Zegar 45:00 rusza od razu po kliknięciu. Nielsen: kontrola użytkownika, zapobieganie błędom.
   → Najpierw okno: „Próbny test: Prawo · 14 pytań · 45 min. Odpowiedzi zapisują się same. [Zaczynam test] [Jeszcze nie]” / „Mock test: Law · 14 questions · 45 min. Answers save automatically. [Start test] [Not yet]”.

6. **Powrót po przerwie: dwa wyjścia i brak miejsca, w którym skończyłem** (Z17). „Ostatnia lekcja: …” i „Wracam: 3 minuty” walczą o uwagę, a lekcja otwiera się od kroku 1.
   → Jeden główny przycisk „Wróć do: Pochodne funkcji · krok 2 z 3” / „Back to: Derivatives · step 2 of 3”, pod nim zwykły link „Najpierw 3 min powtórki” / „Warm up first (3 min)”. Lekcja ma się otwierać na ostatnim kroku.

7. **Sklep: nie wiadomo, co jest najtańsze, a zakup kończy się bez echa** (Z9). Katalog siedzi w zakładkach (Motywy / Profil / Gry / Nauka…) i jest przemieszany z Zadaniami dnia. Kliknięcie w polecaną rzecz tylko przewija. Po zakupie nie ma komunikatu ani nowego salda.
   → Polecaną rzecz zrobić przyciskiem „Kup za 40”, który od razu otwiera potwierdzenie. Zadania dnia przenieść nad katalog albo na osobny ekran. Po zakupie pokazać komunikat „Kupione: Zamrożenie serii. Zostało 110 monet.” / „Bought: Streak freeze. 110 coins left.”

8. **Obietnica a stan materiałów.** Okno planów obiecuje „Lekcje, fiszki i quizy do każdego przedmiotu”, a 5 z 10 przedmiotów ma „Jeszcze bez materiałów”. Wśród nich jest OWI, mimo kolokwium za 14 dni i „Planu nauki OWI” w Kalendarzu. Konto darmowe nie ma też „Kup dostęp” na ekranie Dziś (Z18).
   → W oknie planów napisać uczciwie: „Lekcje do 5 z 10 przedmiotów, kolejne dochodzą co tydzień” / „Lessons for 5 of 10 subjects, more every week”. Na Dziś dla konta darmowego: „Masz jeszcze 3 dni za darmo [Włącz] · [Zobacz ceny]”.

### P2 (drobne)

9. **Przełącznik języka zakopany na dole menu** (Z11). Na komputerze w nagłówku jest „EN”, na telefonie go nie ma. → Dodać „EN” / „PL” w nagłówku telefonu obok logo.
10. **Puste funkcje w menu.** „Stażysta Staś” pokazuje „jeszcze nic nie przygotował”, a „Prościej · PL” jest „w przygotowaniu” (N8). → Ukryć, dopóki nie ma treści, albo napisać: „Staś przygotuje błędy po Twojej pierwszej lekcji. [Zrób lekcję]” / „Staś will prepare mistakes after your first lesson. [Do a lesson]”.
11. **W lekcji przycisk „Dalej: Quiz →” na kroku „Przeczytaj”**, choć krok 2 to Fiszki. Kontrola pokazuje 8 ekranów z „Dalej: Quiz →” i 10 z „Dalej: Fiszki →”. → Zawsze następny krok: „Dalej: Fiszki →” / „Next: Flashcards →”.
12. **Okno kolokwium: główny przycisk to „Odhacz”** dla testu za 14 dni. Przy OWI brakuje „Przygotuj się”, choć przy Logistyce jest. Nazwa przedmiotu powtarza się pod tytułem. → Główny: „Przygotuj się” / „Get ready”, drugi: „Oznacz jako zaliczone” / „Mark as passed”. Pod tytułem pokazać datę i godzinę zamiast powtórzonej nazwy.
13. **Teksty jak z komputera na telefonie:** „Dotknij karty albo naciśnij spację” i „Upuść plik tutaj”. → Na ekranie dotykowym: „Dotknij karty, żeby zobaczyć odpowiedź.” / „Tap the card to see the answer.” oraz „Wybierz plik z telefonu” / „Choose a file from your phone”.
14. **Zaufanie:** link do kalendarza na surowym adresie „…supabase.co/functions…”, a kontakt przez zdawalni.support@gmail.com. → Własna domena: „kalendarz.zdawalni.pl/…”, „pomoc@zdawalni.pl”.
15. **Ranking:** filtr „Cały rok” stoi obok „Tydzień / Semestr” i myli czas z ludźmi. → „Wszystkie grupy” / „All groups”.
16. **Ekran ukończenia sesji:** ucięty znacznik „×3” w rogu, a „Zadania dnia: 0/3” po skończonej sesji wygląda, jakby nauka się nie liczyła. → Nie ucinać znacznika. Pod paskiem dopisać „Sesja 5 min nie liczy się do Zadań dnia” albo zaliczać ją do jednego z zadań.
17. **Starosta:** plakietka „11” na ikonie menu bez wyjaśnienia. Data w formularzu na zrzucie ma postać 12/04/2026 (miesiąc/dzień), co Polak przeczyta jako 12 kwietnia. Trzeba sprawdzić na prawdziwym telefonie z polskim językiem. Komunikat „Tryb starosty włączony” zasłania formularz.
18. **Małe pola dotykowe widoczne w sondzie,** mimo 0 naruszeń w kontroli: pola zgód przed płatnością 20×20 px, „Data orientacyjna” 13×13 px, „Ściągawka do druku” i „Klasyczny widok” mają 21 px wysokości, pytania w Pomocy 24 px, przyciski wyboru w formularzu terminu 36 px. → Całe wiersze z podpisem klikalne, min. 44 px. Warto sprawdzić, dlaczego kontrola ich nie łapie.
19. **Logowanie na pierwszym ekranie:** osoba, która już ma konto, zobaczy „Zaloguj się” dopiero w kroku 3 z 3, po wybraniu kierunku. → Na pierwszym ekranie link „Mam już konto” / „I already have an account”.

---

## 4. Mocne strony

- Start próby jest wzorowy: 3 kroki, „Bez karty i bez płatności”, ceny i „Po okresie próbnym nic nie pobieramy samo” podane od razu, kod z maila działa sam.
- Wyszukiwarka w Przedmiotach od razu znajduje pojęcia EN–PL z definicją („opportunity cost → koszt alternatywny”) i lekcje.
- Terminy pokazują zakres i źródło informacji („Wpisał(a) starosta · 3 godz. temu”), a starosta zmienia datę w kilku ruchach.
- Sesja 5 minut ma pasek postępu, natychmiastową informację zwrotną („Trafione! +10 XP”), pytanie „Zgaduję / Pewny” i przyjemny ekran końcowy z serią.
- Zakupy są uczciwe: monety mają potwierdzenie z ceną, saldem po zakupie i zdaniem „Zakupu nie da się cofnąć”. Okno po próbie przypomina najbliższe kolokwium i obiecuje, że postępy zostaną.
- Karta powrotu po przerwie pokazuje, co się zmieniło („zajęcia od ostatniej nauki: 5, nowe terminy: 3”).
- Cofanie działa wszędzie, puste Powtórki mówią, co zrobić („Zrób dziś kartę 5 minut, a fiszki z niej wrócą tu jutro”).
- Angielski przełącza się natychmiast i w całości. „Mniej animacji” ma jasny opis. Kontrola techniczna jest czysta na 166 ekranach.
