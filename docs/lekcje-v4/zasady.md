# Zasady pisania lekcji v4 (instrukcja dla modelu przy poprawkach D4 i przy nowych lekcjach)

- Język: treść lekcji po angielsku, `simple` i `pl` po polsku.
- **Atom** = jedna rzecz do zapamiętania albo umiejętność. 6–12 na lekcję. `d` ≤ 25 słów, `a` ≤ 15 słów.
  `conf` = atomy, które studenci realnie mylą (koszt jawny/ukryty, PKB nominalny/realny, prawo autorskie/patent).
  Atom z innej lekcji tego przedmiotu: `"<id lekcji>#<id atomu>"`.
- **Sekcja** = jedna idea: `intuition` ≤ 40 słów (konkret z życia studenta, bez wzoru) → `body` ≤ 120 słów
  (pogrubione tylko pojęcia z atomów) → `example` → `mistake` (mit, który ludzie naprawdę mają) → `check`.
- **`check` i `exit` sprawdzają zastosowanie:** nowa sytuacja, liczby albo przypadek, nie „co to jest X”.
  Złe odpowiedzi = typowe błędy, nie absurdy. Każda zła ma `not` (1 zdanie: na czym polega błąd); `not[correct]` = null,
  `not` ma tyle pozycji co `options`. Poprawna opcja nie może być wyraźnie dłuższa od pozostałych.
- **`simple`** ≤ 60 słów, po polsku, jak dla 12–13-latka, z przykładem.
- **`gen`** tylko gdy wynik da się policzyć wzorem. Format: `{ "id": "g1", "task": "… {a} … {b} …", "vars": { "a": [min, max, krok] },
  "answer": "wyrażenie", "unit": "zł", "tol": 0, "why": "1 zdanie" }`. W `answer` wolno: liczby, zmienne z `vars`, `+ - * / ^ ( )`,
  `max min abs round sqrt ln`. Zakresy tak, żeby wynik był „ładny” (bez 0, bez ujemnych, gdy nie mają sensu, maks. 2 miejsca po przecinku).
  Każda zmienna z `task` jest w `vars` i odwrotnie.
- Szablony per typ przedmiotu:
  - `quant`: intuicja → wzór → przykład rozwiązany → błąd w liczeniu; `faded` + `gen`.
  - `law`: stan faktyczny → przepis z numerem artykułu → rozstrzygnięcie → częsty błąd interpretacji; `check` jako mini-kazus.
  - `theory`: problem → model/teoria → przykład firmy → z czym się myli; `check` „która teoria wyjaśnia ten przypadek?”.
- Nie piszemy: `notes`, `tldr`, pełnej wersji „Prościej”, osobnego quizu ani pliku z wyjaśnieniami.

## Jak odpowiadasz (poprawki D4)

Dostajesz tylko pola do poprawy. Zwracasz łatkę: listę `{ path, value_json }`, gdzie `path` to ścieżka jak
`lesson.sections[1].check.not`, a `value_json` to nowa wartość zapisana jako JSON. Nie zwracasz całej lekcji
i nie zmieniasz pól, o które nikt nie prosił. Kolejność: `conf` → `not` → pytania „na definicję” przepisane na
zastosowanie (nowa sytuacja, ta sama idea, ten sam `correct` i liczba opcji) → skrócone `simple` → `gen` → brakujące pola.
