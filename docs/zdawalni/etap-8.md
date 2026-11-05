# Etap 8: „Mam dziś tylko X minut” i „Jedno zadanie”

Spec: „Systemy z Zdawalni w Skrócie”, etap 8. Gałąź `zdawalni/dzien` (skrot-bm, od `zdawalni/przypomnienia` 026bf3f). Bez SQL.
Źródło: `matura-app` `origin/feat/l7-learner-bundle` (9417ccf) `lib/domain/fit-day.ts`, `lib/domain/one-task.ts` + `tests/unit/fit-day.test.ts`, `one-task.test.ts`.

## Co jest
- **`dzien.js`** (bez DOM i bazy, `window.SKROT_DZIEN`): `fitDay`, `scaledTaskCount`, `fitOptions`, `pickOneTask`, `weakestTopics`, `parseExcluded`, `enoughForTodayText` przepisane 1:1 (testy z Zdawalni przeniesione jeden do jednego). Dla Skrótu: `ulozDzien` (lista → `fitDay` z najkrótszą sesją 5 min; przy 5 min jedna rzecz), `jedno` (kolejność specu), `najstarszeZalegle`, szacunki minut.
- **Dziś → karta „Teraz zrób to” → „🎯 Jedno zadanie”** (pod dużym przyciskiem, z podpisem, co otworzy): rewanż na dziś → najstarsza zaległa powtórka → temat z najwyższym priorytetem → kolejny materiał. Rewanż i powtórka otwierają sesję z jedną kartą.
- **Dziś → „Ile masz dziś czasu?”** (5 / 15 / 30 / 60 min, panel pod kartą): lista rewanże → powtórki → krok planu → osobiste Zadanie dnia → temat/lekcja, przycięta do czasu; ostatni element skrócony („ok. 5 z 25 min · zrób, ile zdążysz”), stopka „Reszta poczeka do jutra” albo „Zmieścisz wszystko”. Przy wybranym czasie znika druga karta „Powtórz N fiszek” (jest na liście).
- Koniec powtórki, gdy w porcji na dziś coś zostało: „Na dziś wystarczy. Reszta poczeka do następnego razu.” zamiast „Wszystko na dziś powtórzone.”
- EN: wszystkie nowe teksty w `i18n-en.js`.

## Kroki dla Bartka
Nic do uruchamiania (bez SQL, bez funkcji, bez sekretów). Po scaleniu wystarczy zwykłe wdrożenie strony.

## Decyzje (podjęte sam, do ewentualnej zmiany)
- **Gdzie**: „Jedno zadanie” w karcie „Teraz zrób to” jako drugi, mniejszy przycisk (jedna karta, jedno miejsce decyzji), „Ile masz dziś czasu?” jako jeden panel pod kartą; lista pojawia się dopiero po wyborze czasu, więc prosty ekran Dziś się nie wydłuża.
- **Opcje 5 / 15 / 30 / 60** (spec) zamiast 15 / 30 / 45 / 60 z Zdawalni; najkrótsza skrócona sesja 5 min (Zdawalni 15) — parametr `fitDay`, logika bez zmian. **Przy 5 min jedna rzecz**, nawet gdy zmieściłyby się dwie (np. rewanż 2 min + 3 fiszki) — tak mówi „Gotowe, gdy”.
- **„Temat z najwyższym priorytetem”** = te same tematy, które pokazuje karta: krok planu (najpierw temat, który otworzy „Zrób dzisiejszy krok”), dalej zakres tego zaliczenia albo zaliczenia w ciągu 7 dni, ułożone `topicPriority` (priorytet nie jest liczony drugi raz). Bez planu i bliskiego zaliczenia pusto, więc wchodzi „kolejny materiał” = `nextToLearn`, ten sam co karta. Dzięki temu bez rewanży i zaległości Jedno zadanie i karta zawsze wskazują to samo, z wyjątkiem karty „Oddaj: <termin>” i karty „Powtórz N fiszek” z samymi nowymi fiszkami (Jedno zadanie daje wtedy temat).
- **Szacunki minut**: powtórki ~3 karty/min (jak `srsTodayTxt`), rewanż ~2 min, Zadanie dnia ~5 min (nie jest skracane: ma stały cel), lekcja z `lessonMinutes`, materiał bez długości ~15 min. Próbny test z planu jak `mock_exam` w Zdawalni: przeniesiony, nigdy cięty.
- Zadanie dnia na liście tylko wtedy, gdy baza już je wybrała (`SHOP.misje.osobista`, wczytywane po wyborze czasu), nie jest zrobione i nie jest tym samym krokiem planu.
- Bez „Jeszcze jedno” z Zdawalni (`exclude` jest w `jedno`, ale przycisku nie dodałem — nie dokładać chaosu na Dziś).
- Wybrany czas pamięta przeglądarka do końca dnia (`bm-czas`), nie baza.

## Testy
- `node --test tests/*.test.js`: 106/106 (`dzien` 26: port fit-day i one-task + przypadki Skrótu).
- Playwright `docs/gry/test/dzien.mjs` 27/27: A bez rewanży/zaległości/planu (5 min = jedna rzecz, karta = Jedno zadanie = ta rzecz, pamięć wyboru), B rewanż + zaległe (Jedno = rewanż, sesja z 1 pytaniem; bez rewanży najstarsza zaległa; 5 min = tylko rewanż; 30 min = rewanż, powtórki, temat), C plan „Przygotuj się” (karta, Jedno i krok planu skrócony do 5 min → ten sam temat), D EN 375/1280 bez polskich znaków, dotyk ≥ 44 px.
- Pełny zestaw Playwright (39 plików): bez nowych błędów; te same stare co na `zdawalni/przypomnienia` (`etap5.mjs` timeout `#loginDemo`, `etap7.mjs` 3, `scalanie.mjs` 2).

## Dla kolejnego rocznika
Nic: przedmioty, plany, zaliczenia i priorytet biorą się z rocznika i z bazy, teksty nie mają nazwy kierunku.
