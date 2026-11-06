# „Dla Ciebie na dziś”, etap 0: rozpoznanie

Stan: `main` @ c6a04d1, baza produkcyjna (tylko odczyt, 6.11.2026). Kod bez zmian.

## 1. Treści per temat

Jednostka „temat” dla silnika to **lekcja kursu** (`materials.kind = "lesson"`, 115 sztuk w 10 przedmiotach), bo to na niej liczy się `topicPriority(m)`. Podsumowania „5 minut” i Staś są przypięte do tematów sylabusa (`meta/po`, `meta/stas`, po 107), a nie do materiałów. Przypisałem je do lekcji tak jak strona (`sylTopicMat`: kod sylabusa w `sylRef`, inaczej podobny tytuł). Bez lekcji zostały 2 z 107. Kazusy są w `examBank/<sid>.items` (`type: "case"`, pole `mid` = lekcja).

Liczba lekcji, w których dany klocek lub mechanika jest możliwa:

| Przedmiot | lekcji | Pary | Hasło* | Wyjaśn. | 5 min | Wizual. | Prościej | Check | Rozróżnij | Staś | Zadanie (worked) | Ćwicz. lekcji | Liczbowa (gen) | Kazus | Wyjaśnij (recap) | Fruń/Przejdź (≥8 ABCD) | Drabina (≥6) | Bilet | Pełny szablon 6.3 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Analiza matematyczna | 19 | 19 | 19 | 19 | 3 | 19 | 19 | 19 | 0 | 3 | 19 | 19 | 0 | 0 | 19 | 19 | 19 | 19 | 3 |
| Ekonomia biznesu | 10 | 10 | 10 | 10 | 7 | 10 | 10 | 10 | 0 | 7 | 10 | 10 | 0 | 1 | 10 | 10 | 10 | 10 | 7 |
| Logistyka | 10 | 10 | 10 | 10 | 8 | 10 | 10 | 10 | 0 | 8 | 0 | 10 | 0 | 0 | 10 | 10 | 10 | 10 | 8 |
| Makroekonomia | 11 | 11 | 11 | 11 | 4 | 11 | 11 | 11 | 0 | 4 | 0 | 11 | 0 | 0 | 11 | 11 | 11 | 11 | 4 |
| Narzędzia IT w zarządzaniu | 11 | 11 | 11 | 11 | 6 | 11 | 11 | 11 | 0 | 6 | 0 | 11 | 0 | 0 | 11 | 11 | 11 | 11 | 6 |
| Ochrona własności intelektualnej | 6 | 6 | 6 | 6 | 5 | 6 | 6 | 6 | 0 | 5 | 0 | 6 | 0 | 5 | 6 | 6 | 6 | 6 | 5 |
| Podstawy finansów | 11 | 11 | 11 | 11 | 10 | 11 | 11 | 11 | 0 | 10 | 0 | 11 | 0 | 0 | 11 | 11 | 11 | 11 | 10 |
| Podstawy zarządzania | 13 | 13 | 13 | 13 | 10 | 13 | 13 | 13 | 0 | 10 | 0 | 13 | 0 | 0 | 13 | 13 | 13 | 13 | 10 |
| Prawo | 12 | 12 | 12 | 12 | 11 | 12 | 12 | 12 | 0 | 11 | 0 | 12 | 0 | 5 | 12 | 12 | 12 | 12 | 11 |
| Zarządzanie zasobami ludzkimi | 12 | 12 | 12 | 12 | 12 | 12 | 12 | 12 | 0 | 12 | 0 | 12 | 0 | 0 | 12 | 12 | 12 | 12 | 12 |
| **Razem** | **115** | **115** | **115** | **115** | **76** | **115** | **115** | **115** | **0** | **76** | **29** | **115** | **0** | **11** | **115** | **115** | **115** | **115** | **76** |

\* Hasło: każda lekcja ma pojęcia, ale tylko **84** z nich ma pojęcie, które jest jednym słowem z 4–12 liter (192 takie słowa). W pozostałych 31 haczykiem musi być Pary.

Mediany na lekcję: 6 sekcji, 6 checków, 3 pytania biletu, 27 pytań ABCD (quiz + quizPlus + check + bilet), 12 fiszek, 12 pojęć, 7 ćwiczeń. Pełna lekcja ma 30–40 min, więc treści na 15–25 min wystarcza wszędzie. Wizualizacje: compare 160, chart 123, flow 104, layers 37. „Dlaczego?” (`quizWhy`) i „Prościej · PL” mają wszystkie lekcje, „Jeszcze prościej” (`~ez`) tylko 19 (Analiza).

**Dziury, które zmieniają plan:**
1. **Rozróżnij pojęcia (`d:`) i karty liczbowe (`n:` / `gen`) nie istnieją na produkcji.** Żadna lekcja nie ma `lesson.atoms` ani `lesson.gen` (generacja v4 z etapu D nie była uruchomiona). `distinctOf` wymaga atomów z `d` i `conf`, a stara treść ich nie daje. Przykład ze specu „brak Stasia → Rozróżnij” w praktyce nie zadziała.
2. **Staś jest w 76 lekcjach, brakuje go w 39.** Najgorzej jest w Analizie matematycznej: 3 z 19, bo sylabus ma tam tylko 5 tematów W/ĆW na 19 lekcji. To samo dotyczy „5 minut”.
3. **Kazusy są tylko w 11 lekcjach** (OWI 5, Prawo 5, Ekonomia 1) i w 1 materiale z Teams. „Zadanie krok po kroku” (`worked`) jest w 29 lekcjach (Analiza 19, Ekonomia 10).
4. Mechanika „tworzę” jest możliwa wszędzie: Wyjaśnij własnymi słowami (`recap`, 115 lekcji) i ćwiczenia z lekcji (`lesson.exercises`, 813 sztuk, poziom 2/3, z podpowiedzią i odpowiedzią).
5. Pytania quizu nie mają pola trudności. Drabina układa je po `rp.trudnosc`, czyli po odsetku dobrych odpowiedzi z bazy. Nowe pytania tematu nie mają tej danej, więc w lekcji trzeba mieć zapasową kolejność (quiz → quizPlus → bilet).

**Wniosek:** z zastępstwami (sprawdzam: brak Stasia → pytania z quizu z „Pewny / Zgaduję” i „Dlaczego?”; w przedmiotach ilościowych → zadanie krok po kroku) **pełną 20-minutową lekcję da się złożyć ze wszystkich 115 lekcji**. 76 dostaje szablon dokładnie jak w 6.3 (ze Stasiem). Pozostałe 43 materiały (slajdy, Teams) mają tylko quiz, fiszki, pojęcia i czasem `worked`. Proponuję, żeby były źródłem fiszek i rewanży, a nie tematem lekcji.

## 2. Profil nauki w bazie

- RPC `nauka_profil_nauki` istnieje (5 funkcji `nauka_profil_nauki*`), więc błędu `not_enabled` nie ma.
- **Test zrobiło 0 osób** (0 wierszy w `nauka_profil_nauki`). Dziś wszyscy dostaliby domyślne wartości, więc etap 5 ma znaczenie dopiero wtedy, gdy ktoś zrobi test.
- Wynik gry pamięciowej (`memory`) zostaje tylko w przeglądarce (`S.learner.memory`). W bazie są `deklaracje`, `startowe` (`priors`) i puste `z_danych`.
- `learner.js` jest wczytany jako `window.SkrotLearner`. Strona korzysta z `memory`, `scoring`, `pairs` i `questions`. Moduły `sessionLength` (`dropPoint`, `blockMinutes`), `rhythm` (`bucketStats`, `proposeBucket`), `breaks.suggestBreak` i `reviewBudget.needsLighterPlan` są w paczce, ale **nikt ich nie woła**. `priors.stabilityMultiplier` działa tylko w FSRS (`fsrsNext`, `index.html:17462`).
- Pola, z których skorzysta silnik:
  - `declared`: `bedtime`, `clearest` (morning, afternoon albo evening), `focus`, `motivations[≤2]`, `stressHigh`, `interests`;
  - `priors`: `blockMinutes.value`, `stabilityMultiplier.value`, `bestBucket`.

## 3. Karty na Dziś (`viewHome`, `index.html:6445`), od góry

Karty zaznaczone ✱ zastępuje blok według D2.

1. Powitanie, pasek zakupu, ogłoszenie starosty, `v4Notice`.
2. `nocHomeCard` (21:30–4:00, dzisiejsze błędy). Zostaje.
3. ✱ `poHomeCard("top")`: tylko gdy najlepsza propozycja `poSuggest()` ma `kind: "swieze"`.
4. `jzHomeCard` („Jedziesz na zajęcia?”, zajęcia za 5–120 min). Zostaje.
5. `bsHomeCard` (Boss). Zostaje.
6. ✱ `nowCard` = „Teraz zrób to” (`nowAction()`, `index.html:6315`). Pierwszy pasujący wariant: krok `planToday()[0]` → zaliczenie w ciągu ≤ 7 dni → termin oddania w ciągu 0–2 dni → `srsToday().n` fiszek → mini-sprawdzian → `nextToLearn` → najnowszy materiał. Wewnątrz jest `dzOne()` (dzien.js `jedno`: rewanż → najstarsza zaległa → priorytetowy temat → lekcja).
7. ✱ `nowSecond` („Powtórz N fiszek”): tylko gdy pierwsza karta jest krokiem planu, a fiszki czekają.
8. ✱ `dzPanel` „Ile masz dziś czasu?”: `dzItems()` (rewanże, fiszki, plan, misja, lekcja z minutami) → `DZ.ulozDzien`, wybór 5/15/30/60 min w `bm-czas`.
9. ✱ `poHomeCard("mid")`: „Powtórka w 5 minut” (`odswiez`, przeczytane ≥ 3 dni temu), „5 min przed zajęciami” (`przed`), „Po zajęciach w 5 minut” (`nowe`).
10. Przewodnik, `todayPanel` (zajęcia), `upcomingPanel` (termin), `przypHomeCard`, `stasHomeCard`. Zostają.
11. Rząd „Na luzie”: Hasło dnia i „Masz 3 minuty?”. Zostaje.
12. Zwinięte „Twój postęp” i nowości.

`stasHomeCard` i `jzHomeCard` konkurują z blokiem o to samo (Staś i krótka sesja). Proponuję ukrywać `stasHomeCard` w dniu, w którym Staś jest w lekcji dla Ciebie.

## 4. Gry i mechaniki: co trzeba dodać, żeby wywołać je z lekcji

Dziś gra otwiera się przez `grajOpen(gra, {sid, tryb, trudnosc})` (`index.html:9941`) → `SKROT_GRY.open(gra, {api: GRY_API})` (gry.js:417). **Najmniejsza pula to cały przedmiot** (`gryQuestions(sid, n)`), filtra tematu nie ma. Rundy nie mają limitu czasu. Koniec rundy (`endRound`, gry.js:698) zawsze pokazuje własny ekran wyniku i robi `render()`, bez callbacku do wywołującego.

| Mechanika | Brakuje |
|---|---|
| Wszystkie gry (gry.js) | opcje `pool`, `tasks`, `limitSec`, `onEnd(wynik)` w `open`/`runOpts`; w `newRun` pula z opcji zamiast `A.questions`; w `endRound` `onEnd` zamiast `showResult` i `render()`; obsługa `#/gra/` przy powrocie |
| Fruń, Przejdź | licznik czasu w pętli `frame`, który po `limitSec` kończy rundę |
| Pary | `pairs` z pojęć tematu zamiast `glossary` przedmiotu; odliczanie zamiast liczenia czasu w górę |
| Drabina | `n` i `progi` z opcji (dziś na sztywno 12, progi [4, 8] i `X.i < 8` w gry-drabina.js:62, `enough` wymaga dokładnie 12) |
| Hasło | nowy lokalny komponent. Hasło dnia losuje słowo na serwerze (`nauka_haslo_slowo`, jedno na dzień dla całego roku), więc nie da się go podpiąć pod temat |
| Staś | dziś to widok strony (`viewStasX`, `index.html:12436`), który kończy się `go({view:"stas"})`. Trzeba wydzielić render z `onDone` albo zrobić kartę odtwarzacza `stas` |
| Boss | nic: ciosy liczy baza z każdej dobrej odpowiedzi wysłanej przez `rpSend("odp"/"zadanie")` z przedmiotu (ABCD = 1, zadanie = 3). Po lekcji wystarczy `bsArm()` + `bsLoad(true)` dla animacji |
| Kazus, worked, ćwiczenia, zdjęcie | już są kartami odtwarzacza (`examCase`, `faded`/`exercise`, `num` + `fotoBox`). Wystarczy builder segmentu. Kazus ocenia AI (grade-open), a **AI jest zablokowane do 1.12** (limit konta Anthropic) |

Odtwarzacz `playerOpen(src)` (`index.html:8780`) jest gotowym szkieletem nowego źródła `ld`:
- kontrakt `{kind, build() → {bites}, onCard, onFinish, done, decorTop, xp, feedback}`;
- 21 typów kart w `LPR`, wzorem jest `reviewSource`/`sprSource`;
- `sprItemsOf(m, c)` (`index.html:17597`) już składa pulę pytań jednego tematu (`z:` + `q:` + `n:`);
- `jzBuild` (Lekcja na przejazd) już robi zachłanny budżet minut i przeplatanie.

**Limit w bazie do decyzji (D10):** każda gra w lekcji to zwykła runda `nauka_gra_start`. Limity: 40 rund dziennie, **punkty rankingu tylko z 3 rund dziennie**, 150 pkt dziennie. Dwie lekcje to 4–6 rund (2 gry-przerwy + Drabina na lekcję), więc po pierwszej lekcji uczeń nie dostanie już punktów za zwykłe gry. Według D10 to zgodne z zasadami. Druga możliwość: gry w lekcji bez `rp.start`/`rp.koniec`, czyli bez rundy rankingowej, ale z `rp.odp` (monety i ciosy Bossa za odpowiedzi zostają).

## 5. Propozycje zmian w specu przed etapem 1

1. Zastępstwa w katalogu (6.2/6.3):
   - **sprawdzam**: Staś → pytania z quizu tematu z „Pewny / Zgaduję” + „Dlaczego?”; Rozróżnij na razie wyłączone (0 treści);
   - **tworzę**: Wyjaśnij (`recap`) → ćwiczenie z lekcji → zadanie krok po kroku (`worked`) → kazus;
   - karta liczbowa (`gen`) na razie wyłączona.
2. Haczyk: Hasło tylko przy pojęciu-słowie z 4–12 liter, inaczej Pary.
3. Tematy lekcji: tylko `kind: "lesson"`. Slajdy i Teams dają fiszki i rewanże.
4. Kazus w lekcji: bez oceny AI do 1.12 (pokaż wzór odpowiedzi i rubrykę do samooceny) albo poza lekcjami do grudnia.
5. Dziury treści do osobnego zlecenia (poza tym specem): Staś i „5 minut” dla 39 lekcji (głównie Analiza), atomy `d:` i `gen` z etapu D lekcji v4.
