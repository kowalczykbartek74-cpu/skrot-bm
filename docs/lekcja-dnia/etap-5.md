# „Dla Ciebie na dziś”, etap 5: Profil nauki i aktywność

Gałąź `lekcja-dnia/profil` (od `main` po wdrożeniu etapów 0–4). Bez SQL i bez nowej tabeli. Nadal tylko za flagą `?ld=1` dla admina.

## Co jest
- **Profil nauki (test)**:
  - skupienie ustala długość lekcji (15 / 20 / 25 min) i to, co ile minut wpada gra (4 / 5 / 7 min);
  - godzina snu: godzinę przed snem tylko powtórki, a lekcja 2 przechodzi w tryb „Przed snem”;
  - stres daje tryb „Lekko”, spokojne mechaniki i brak rankingu;
  - motywacja wybiera finał i podsumowanie: rywalizacja (`buddy`, `rewards`) → Drabina i ranking, postęp (`progress`, `plan`) → poziomy, spokój (`calm`) → bilet, bez liczb i bez czasu.
  - Profil czeka na odpowiedź bazy, zanim plan dnia się zamrozi.
- **Prawdziwa nauka zamiast deklaracji (`learner.js`)**, liczona z lokalnego dziennika odpowiedzi z lekcji dla Ciebie (`bm-ld-odp`: wynik, pora dnia, minuta sesji, czas odpowiedzi, sesja):
  - **długość bloku** (`sessionLength.blockMinutes`): po 5 sesjach z danymi zastępuje wartość z testu;
  - **najlepsza pora** (`rhythm.bestBucket` z sesjami `bm-ld-sesje`): po wystarczającej liczbie odpowiedzi zastępuje porę z testu. Poza najlepszą porą nowy temat dostaje −10 w wyniku tematu, a w dobrej porze „Dlaczego to?” mówi „Teraz jest Twoja najlepsza pora na nowy materiał”;
  - **lżejszy plan** (`reviewBudget.needsLighterPlan`): dwa tygodnie z mniej niż 60% zrobionego z bloku (dziennik dni `bm-ld-dni`) dają tryb „Lekko”;
  - **seria nieudanych dni**: 3 dni z planem i bez niczego zrobionego dają tryb „Lekko”;
  - **„przed czasem”**: lekcja zamknięta przed końcem zwiększa licznik, a lekcja do końca go zeruje. 3× z rzędu oznacza lekcje o stopień krótsze.
- **Propozycja przerwy** (`breaks`):
  - pojawia się po bloku skupienia z profilu albo gdy odpowiedzi wyraźnie słabną i zwalniają w porównaniu z początkiem sesji (`suggestBreak`);
  - okno „Krótka przerwa?” daje wybór „Przerwa 4 min” (zapisuje postęp i zamyka) albo „Uczę się dalej”;
  - odmowa liczy się jak w Zdawalni (`afterSuggestion`): po 3 odmowach z rzędu próg rośnie;
  - tylko w lekcjach, nie w karcie 5 min.
- **Uczenie się z aktywności (6.4), teraz pełne**:
  - „ukończona” (z „dobrze” przy co najmniej 70% dobrze), „pominięta” („Pomiń”) i **„porzucona”** (zamknięcie w połowie segmentu albo przerwana gra);
  - silnik wyrzuca na tydzień mechanikę porzuconą 3× od ostatniego ukończenia; „sprawdzam” i „tworzę” tylko zmieniają formę.
- **Zdarzenia do bazy**: `learnEvent({ kind: "ld", ev: { seg, mech, stan, dobrze } })`. Trafiają do istniejącej tabeli `nauka_zdarzenia` (typ `activity`) przez kolejkę zdarzeń nauki, tak jak reszta strony. Panel lejka policzy je w etapie 6.
- **„Dlaczego to?” przy lekcji** mówi teraz też, skąd długość i rytm gier: „z Twojego Profilu nauki”, „tyle zwykle wytrzymujesz bez spadku” (z danych) albo „wartości domyślne”. Pojawia się tam też „Ostatnio było ciężko…” przy lżejszym planie.
- **Link „Ułożymy lepiej po 6-minutowym Profilu nauki”** znika po teście (już z etapu 4).

## Decyzje (moje, do zmiany na Twoje słowo)
- **Dziennik odpowiedzi jest w przeglądarce**, najwyżej 800 odpowiedzi, czyli ok. 2–3 tygodnie nauki. Do bazy idą tylko zdarzenia mechanik, bez treści odpowiedzi. Na innym urządzeniu rytm i skupienie liczą się od nowa.
- **„Przed czasem”** liczę jako zamknięcie lekcji przed końcem, po co najmniej jednej karcie. Spec nie definiuje dokładnie; `sessionLength.dropPoint` potrzebuje 15+ odpowiedzi w sesji, a tylu nie ma w 15-minutowej lekcji.
- **Grupa wieku do `learner.js`** to „19+” (studenci), więc blok skupienia ma 10–40 min, a przerwa 4 min.

## Testy
- `node --test tests/*.test.js`: 240/240 (silnik 52/52, w tym seria nieudanych dni, tygodnie, dziennik w kształcie `learner.js`, reszty).
- **Nowy `docs/gry/test/lekcja-dnia-5.mjs`: 20/20.** Sprawdza:
  - profil z testu: 15 min, gra co 4 min, Drabina i ranking, „Dlaczego to?”;
  - porzucenie, pominięcie, licznik „przed czasem”, zdarzenia w kolejce i w RPC, sesja „przerwana”;
  - „3× przed czasem” → krótsze lekcje;
  - 3 nieudane dni → tryb Lekko (`calm`, bez gier na czas);
  - przerwę po 12 min z zapisem postępu i dziennik odpowiedzi;
  - rytm z danych („rano” zamiast deklaracji „wieczorem”);
  - wartości domyślne bez profilu.
- Pozostałe testy: lekcja-dnia 30/30, lekcja-dnia-3 29/29 (zmienione jedno oczekiwanie: przerwana runda Par to teraz „porzucona”), lekcja-dnia-4 101/101, profil-nauki bez ✗, dzien 27/27.
