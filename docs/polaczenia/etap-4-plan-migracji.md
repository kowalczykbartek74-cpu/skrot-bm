# Połączenia, etap 4 (i 5): plan migracji bazy do akceptacji

Plik: `supabase/skrot-v28-zdarzenia-nauki.sql`, uruchamiany po v27 (v26 i v27 z etapów 1 i 3 też czekają na uruchomienie).
Nic nie kasuje, można uruchomić kilka razy. Nie zmienia tabel ani limitów z v13/v14/v15.

## Zasady, które zostają

- Punkty rankingu i monety liczy tylko baza (`nauka_rp_dodaj` z v13).
- 10 pkt = 1 🪙 (trigger z v14). Limity dzienne pul (quiz 300 pkt, gry 150, powtórki 20, lekcje 150) zostają, więc limit **64 🪙 dziennie z nauki** się nie zmienia.
- „Każde pytanie daje monetę raz dziennie”: klucz `q:…` w `nauka_rp` jest unikalny na dzień. Liczy się tylko **pierwsza** odpowiedź dnia na dane pytanie (`nauka_odp`, jak w quizie lekcji), więc zgadywanie A, B, C, D po kolei nic nie daje.
- Limit tempa (`nauka_rp_za_szybko`) i dostęp (`nauka_rp_mozna`) jak w quizie.

## 1. Po zajęciach w 5 min: „Sprawdź się” (nowa funkcja `nauka_rp_po`)

`nauka_rp_po(p_id text, p_idx int, p_wybor int)`:
- baza czyta pytanie z `meta/po~<id>` → `quiz[p_idx].correct` (jak `nauka_rp_odpowiedz` czyta `materialContent`);
- zapis odpowiedzi w `nauka_odp` (`mid = 'po~<id>'`, `rodzaj = 'abcd'`, `zrodlo = 'quiz'`), przedmiot z `meta/po` (`items[id].sid`);
- dobra i pierwsza dziś → `nauka_rp_dodaj(…, 'quiz', 'q:po~<id>:<idx>', sid, 10)`, czyli **tyle samo co pytanie w quizie lekcji: 10 pkt = 1 🪙**, z puli quizu;
- klucz zaczyna się od `q:`, więc liczy się też do Zadań dnia „Odpowiedz dobrze na 10 / 25 pytań”.
- „Pierwsze przeczytanie: +10 XP” jest tylko w przeglądarce (XP nie trafia do bazy).

## 2. Staś (nowa funkcja `nauka_rp_stas`)

`nauka_rp_stas(p_id text, p_zdania int[])`. Strona wysyła numery zdań, które osoba oznaczyła jako błędne:
- baza sprawdza w `meta/stas~<id>` → `sentences[i].isWrong`;
- każde zdanie zapisuje się raz w `nauka_odp` (`mid = 'stas~<id>'`). Dobrze znaleziony błąd przy pierwszym podejściu dnia daje +10 pkt z puli quizu (`q:stas~<id>:<i>`);
- źle oznaczone poprawne zdanie: zapis `ok = false`, bez punktów; najwyżej 12 zdań w jednym wywołaniu.

Pytanie do Ciebie: czy Staś ma dawać monety (propozycja: tak, jak pytanie w quizie), czy tylko XP jak dziś?

## 3. Osobiste zadanie dnia (etap 5; nowa tabela + 2 funkcje, zmiana `nauka_misje` i `nauka_misja_odbierz`)

- Tabela `nauka_misja_osobista (user_id, dzien, typ, cel jsonb)` z kluczem `(user_id, dzien)`, RLS bez reguł, jak inne tabele punktów.
- `nauka_misja_osobista_ustaw(p_typ text, p_cel jsonb)`: strona wybiera zadanie z priorytetu raz dziennie. Pierwszy zapis dnia jest ostateczny, więc nie da się podmienić zadania na łatwiejsze po fakcie.
- Postęp liczy baza z wierszy `nauka_rp` z dziś:

| typ | przykład na stronie | warunek w bazie |
|---|---|---|
| `sprint` | „Sprint OWI: 8 dobrych odpowiedzi (kolokwium za 19 dni)” | ≥ 8 wierszy `q:%` z quizu lub gry z `sid` = przedmiot |
| `po` | „Przeczytaj 5-minutówkę z dzisiejszych zajęć i odpowiedz na 2 pytania” | ≥ 2 wiersze `q:po~%` |
| `stas` | „Popraw Stasia z najsłabszego tematu: znajdź 2 błędy” | ≥ 2 wiersze `q:stas~%` |
| `plan` | „Zrób dzisiejszy krok planu: OWI · Industrial property” | ≥ 5 wierszy `q:<mid>:%` albo `l:<mid>` dla materiałów z kroku (`cel.mids`, najwyżej 6) |

- Nagroda **8 🪙**, jak `odp10` i `pkt60`. Klucz w księdze to `misja:osobista:<dzień>`, więc nagroda wpada raz dziennie.
- `nauka_misje()` oddaje dodatkowo pole `osobista` (opis, postęp, odebrana). Wspólne 3 zadania dnia i zadanie tygodnia **zostają bez zmian i takie same dla wszystkich**, więc ranking zostaje uczciwy.
- Jedyne nowe źródło monet: +8 🪙 dziennie z osobistego zadania. Limit 64 🪙 z nauki się nie zmienia, bo zadania dnia są poza nim (jak dziś).

## 4. Czego nie zmieniam

- `nauka_ranking`: sumuje `nauka_rp`, więc nowe punkty liczą się same.
- `nauka_kierunek_stat`: odpowiedzi z Po zajęciach i Stasia wchodzą do statystyk przedmiotu. Na liście „najtrudniejsze pytania” strona i tak pokazuje tylko materiały (`materialById`), więc `po~…` i `stas~…` się tam nie pojawią.
- Żadnych zmian w tabelach `nauka_rp`, `nauka_odp`, `nauka_monety`: źródło `quiz` i rodzaj `abcd` już są dozwolone.

## Test przed oddaniem

`supabase/test/v28.sql` w PGlite po wszystkich migracjach, każda 2×:
- pytanie z `meta/po~` daje 10 pkt raz dziennie, tylko przy pierwszej odpowiedzi;
- zła odpowiedź = 0;
- limit puli quizu działa;
- Staś: tylko prawdziwe błędy dają punkty;
- osobiste zadanie: nie da się zmienić po pierwszym zapisie, postęp z `nauka_rp`, nagroda raz;
- bez dostępu = `no_access`.

## Strona (po Twoim OK, bez wpływu na bazę)

- `learnEvent({ kind, sid, materialId, ok, total })`: XP (`xpTake` / `xpFlush`, więc też seria i cel dnia), wysyłka do bazy (`rpSend` z nowymi typami `po` i `stas`), statystyki tematu (`progress.learn`).
  `topicScore` czyta `progress.learn` jako nowe źródło, więc priorytet i mapa postępów widzą Po zajęciach i Stasia.
- Po zajęciach:
  - błędne odpowiedzi trafiają do pomylonych pytań (`gryWrong`);
  - „Dodaj pojęcia do fiszek” (zaznaczone przy „Gotowe”) dodaje karty `g:…` bez duplikatów;
  - link „Pełna lekcja: …” (dopasowanie przez `sylRef`, numer zajęć z etapu 1, `lessonTwin`).
- Staś: wynik do `learnEvent`, słaby wynik oznacza temat jako słaby, link do lekcji.
- `lvHowShow()` wymienia też Po zajęciach i Stasia.
- Bez uruchomionej v28 strona działa dalej: XP i fiszki są, a monety za Po zajęciach i Stasia nie przychodzą (RPC zwraca „does not exist”, strona to przemilcza).
