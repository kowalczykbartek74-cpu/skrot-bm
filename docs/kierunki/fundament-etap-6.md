# Fundament pod inne kierunki – Etap 6 (stałe BM i ranking po roczniku, v46)

## Co zmieniono

### Baza (`skrot-v46-roczniki-plan-ranking.sql`, część „Etap 6”; ten sam plik co Etap 5)
- Ranking (`nauka_ranking`), wygląd osób z rankingu (`nauka_wyglad`), pseudonim (`nauka_profil_ustaw` + indeks unikalny `(rocznik_id, lower(nick))` zamiast `(kierunek, rocznik, lower(nick))`) – po `nauka_profil.rocznik_id`, nie po kodzie kierunku + roku naboru. Dwa roczniki z tym samym kodem się nie mieszają, „od 5 osób” liczy się w roczniku.
- Poza specem, bo też mieszały roczniki: statystyki „Twój kierunek” (`nauka_kierunek_stat`: aktywni, przedmioty, trudne pytania – tylko odpowiedzi osób z tego rocznika; przedmiot o tej samej nazwie w dwóch rocznikach się nie miesza), rekordy gier (`nauka_rekordy`) i **Hasło dnia** (`nauka_haslo_dni` z kluczem `(dzien, rocznik_id)`: jedno słowo dziennie na rocznik, z jego materiałów; statystyki dnia i numer Hasła w roczniku).
- Konto admina zostaje w BM, więc ranking i statystyki BM bez zmian.

### Strona
- `<head>` i `manifest.webmanifest`: opis ogólny – **do zatwierdzenia przez Bartka**: „Skróty, fiszki, quizy i wersje prostym językiem dla studentów Uniwersytetu Szczecińskiego.”, tytuł podglądu „Zdawalni – nauka do zaliczeń na studiach”, opis obrazka „Zdawalni: skróty, fiszki i quizy dla studentów”.
- `termsPrompt` → `${ROK.ai.en}` (dla BM bajt w bajt to samo; to polecenie Panelu AI admina, funkcja `claude` przepuszcza admina bez wzorca).
- Polecenie tłumaczenia (meta/en): przykład kodów grup z `ROK.grupy` (BM: „C111, C112, lab A” jak dawniej).
- `LAW_SUBJECTS`, `CALC_SUBJECTS`, `EZ_SUBJ` → `rocznik.js` `przedmioty.prawne / rachunkowe / jeszczeProsciej` (BM te same wartości, inne roczniki puste listy).
- Ekran logowania: „Czym to się różni od slajdów z Teams?” tylko przy `teams: true`, inaczej „…od slajdów prowadzących?”.
- Przewodnik: demo rankingu i podgląd wyboru grupy z `ROK.grupy`; rocznik bez grup – bez filtra grupy (krok sam się zalicza).
- Terminy bez Teams: „…gdy je dodamy.” (bez starosty – jest tylko admin).
- Wiersz źródeł z „zespół Business Management” w zasadach zaliczeń tylko przy `ROK.zasadyZaliczen`.
- Boss dla przedmiotu spoza `SUBJ_GEN`: „Potwór z przedmiotu „Statystyka”” zamiast „Potwór z Statystyka”. `SUBJ_SHORT_PL` ma zapas (nazwa z planu), więc bez zmian.
- `grade-open`: polecenie systemowe w `system.ts`; odbiorcy z `ROK.ai.en` przysłanego przez stronę (ten sam wzorzec co w funkcji `claude`), język zajęć z `ROK.jezykZajec`, domyślnie „first-year university students”. Zmienia się tylko pierwsze zdanie (dla BM: „first-year Business Management students (taught in English)” zamiast „first-year university students (Business Management and Law, taught in English)”).

## Kryterium „gotowe”

`grep` po `index.html` (C111–C116, „Business Management”, listy przedmiotów) znajduje tylko: wbudowany plan BM, komentarze i dane `ZAL` (za `ROK.zasadyZaliczen`).

## Jak sprawdzone

- PGlite `test/v46-przed.sql` + `v46.sql` R1–R4: ranking (tydzień, semestr, grupa), wygląd, statystyki, rekordy i Hasło konta BM, drugiego konta BM i admina identyczne jak przed v46 (21 porównań); rocznik testowy z tym samym kodem BM: osobny ranking (6 osób), osobne statystyki przedmiotu „makro”, pseudonim zajęty tylko w swoim roczniku, osobne słowo Hasła z jego materiału.
- `tests/grade-open.test.js` (polecenie: reszta bez zmian względem starej wersji; złe napisy odbiorców odrzucone), `tests/rocznik.test.js` (przedmioty), `node --test` 268/268.
- Playwright `fundament-etap6.mjs` 7/7; ekrany BM bez zmian (zrzuty `main` i gałęzi w tej samej chwili); etapy 2–4: 22/22, 23/23, 18/18.

## Kroki dla Bartka (zbiorczo w raporcie końcowym)

Run v46 → wdrożenie `kalendarz` i `grade-open` (`index.ts` + `system.ts`).

## Dla kolejnego rocznika

Ranking, statystyki i Hasło dnia działają od pierwszego dnia w obrębie rocznika; listy przedmiotów prawnych i rachunkowych wpisuje się w jego wpisie w `rocznik.js`.
