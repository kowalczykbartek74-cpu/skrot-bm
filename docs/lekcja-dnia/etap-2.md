# „Dla Ciebie na dziś”, etap 2: odtwarzanie karty 5 min i segmentów nauki

Gałąź `lekcja-dnia/odtwarzacz` (od `lekcja-dnia/silnik`). Bez SQL. Na Dziś nic się nie zmienia: blok dojdzie w etapie 4. Do testów służy ekran próbny **`#/ld`**, do którego nie prowadzi żaden link.

## Co jest
- **`index.html`, blok „Dla Ciebie na dziś”:**
  - dane dla silnika z tego, co strona już liczy:
    - `topicPriority`, FSRS (pamięć kart z `lekcja-dnia.js → pamiec`), rewanże na dziś;
    - `poSuggest` (zajęcia), poziomy v4, pierwsza nieprzerobiona część lekcji, aktywny Boss;
    - Profil nauki (`S.learner`);
    - spisy „5 minut” i Stasia przypięte do lekcji (`poLesson`), kazusy z `examBank`.
  - plan dnia liczony raz dziennie i **zamrażany** (`bm-ld:<dzień>`), żeby tematy nie skakały po każdej odpowiedzi. Plan segmentów lekcji zamraża się przy pierwszym otwarciu: „Wróć” trafia w to samo miejsce.
- **Źródło odtwarzacza `ld`:**
  - wszystkie segmenty w jednej części, bez ekranów przerwy między segmentami;
  - w pasku u góry nazwa segmentu i **„Pomiń ⏭”** (D8, zawsze dostępne);
  - na końcu „Zrobione ✓”: XP, wynik, „Przejdź do lekcji” po karcie, „Następna lekcja” po lekcji 1 i „Na dziś zrobione. Jutro ułożymy nowe.” po wszystkich trzech.
- **Karty segmentów (istniejące typy kart, bez nowych):**

  | Segment | Karty |
  |---|---|
  | Rozgrzewka | rewanże i najstarsze zaległe fiszki (te same karty co w Powtórkach); bez nich fiszki z tematu |
  | Wyjaśnienie | jedna część lekcji (czytanie, wizualizacja krok po kroku, przypomnienie, check, „Nie łapię” / „Jeszcze prościej”) |
  | Przypomnienie | część podsumowania „5 minut” + jego „Sprawdź się”; bez podsumowania: najważniejsze z lekcji (recap) |
  | Pytania / Sprawdzenie | pytania z quizu tematu z „Pewny / Zgaduję” i „Dlaczego?” |
  | Rewanże | rewanże z tego tematu |
  | Wyjaśnij | „Powiedz własnymi słowami” z wzorem |
  | Ćwiczenie | zadanie z lekcji (najpierw łatwiejsze) |
  | Bilet wyjścia | bilet lekcji |
  | Rozróżnij, Karta liczbowa | karty v4, gdy będzie treść (dziś 0 w bazie) |

- **Zastępcze karty do etapu 3** (segment zostaje, etap 3 podmieni tylko karty):
  - Hasło / Pary → dopasuj pary z pojęć tematu;
  - Fruń / Przejdź → 2 szybkie pytania;
  - Staś → 2 pytania;
  - Drabina → bilet wyjścia;
  - zadanie krok po kroku i kazus → zadanie z odpowiedzią do samooceny.
- **Każda odpowiedź idzie tymi samymi ścieżkami co dziś:**
  - fiszki i rewanże przez FSRS (`srsGrade`);
  - pytania quizu: `qSeen`, błędy dnia, „Pewny / Zgaduję”, rewanże, punkty `odp` (liczą się też do Bossa);
  - check i bilet: rewanże z kluczem lekcji;
  - podsumowanie „5 minut”: `poAnswer`;
  - na końcu `learnEvent({ kind: "ld", materialId, ok, total })` dla każdego tematu.
- **Stan i XP:**
  - przerwij i wróć tego dnia: stan odtwarzacza `bm-pl:ld:<dzień>:<karta|l0|l1>`, wpisany tekst w „Wyjaśnij” dodatkowo w `kopie.js`; stare dni sprzątają się same;
  - XP tylko za pierwsze przejście danej karty lub lekcji tego dnia („Zrób jeszcze raz” bez XP).
- **Historia mechanik (6.4):**
  - `bm-ld-mech` zapisuje, czy mechanikę ukończono (i czy z dobrym wynikiem) albo pominięto;
  - `bm-ld-ost` trzyma mechaniki dwóch ostatnich lekcji;
  - silnik już z tego korzysta. Zdarzenia do bazy dojdą w etapie 5.
- **Silnik:** `pamiec` (retrievability FSRS) i prawdziwa liczba części podsumowania „5 minut”.
- **CSS**: tylko układ paska odtwarzacza, w jednym bloku `/* Lekcja dnia */`. Kolory, kształty i chipy pochodzą z `.lp-chip` i `.sk-chip`.
- **EN**: nowe napisy w `i18n-en.js` (`i18n.js?v=20261106-ld`). Mechanikę „Hasło” nazywam w lekcji „Zgadnij hasło”, bo słowo „Hasło” jest już w słowniku jako „Password”.

## Decyzje (moje, do zmiany na Twoje słowo)
- **Jedna część na lekcję.** Bez ekranu „zrobione” po każdym segmencie, za to nazwa segmentu w pasku. Przy 7–9 segmentach przerwy byłyby męczące.
- **Plan dnia zamrożony do północy.** Zmienić go może tylko „Ułóż od nowa” na `#/ld`. W etapie 4 dojdą „Inny temat” i nowy plan po zrobieniu wszystkiego.
- **„Pomiń” w segmencie** zapisuje mechanikę jako pominiętą. Licznik silnika (porzucona 3×) bierze tylko porzucenia w połowie, które policzy etap 5. Samo pominięcie mechaniki nie wyrzuca.
- **Przedmioty ilościowe** (Analiza, Ekonomia, Makro, Finanse) dostają jako „tworzę” najpierw zadanie albo ćwiczenie, a dopiero potem „Wyjaśnij”.

## Testy
- `node --test tests/*.test.js`: 235/235 (silnik 47/47).
- **Nowy `docs/gry/test/lekcja-dnia.mjs`: 30/30.** Sprawdza:
  - kartę 5 min z fiszkami z Powtórek (termin FSRS się przesuwa) i zdarzenie `ld`;
  - przejście do lekcji, „Pomiń” i zapis historii mechanik;
  - przerwanie i „Wróć (zostało ok. N min)” po odświeżeniu, w to samo miejsce;
  - powrót wpisanego tekstu i jego kopię;
  - obie lekcje i „Na dziś zrobione”, brak XP przy powtórce;
  - 360 px w ciemnym motywie bez przewijania w bok, EN, brak błędów w konsoli.
- Regresja w porównaniu z `main` (wszędzie ten sam wynik, bez błędów): lekcje-v4 31/31, rewanze 23/23, przejazd-noc 19/19, sprawdzian 50/50, kopie 20/20, dzien 27/27, poziomy i jeszcze-prosciej bez ✗.
