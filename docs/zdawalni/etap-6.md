# Etap 6: lejek i retencja bez cookies

Spec: „Systemy z Zdawalni w Skrócie”, etap 6. Gałąź: `zdawalni/lejek` (skrot-bm, od `zdawalni/oczekujacy`, bo potrzebuje v34).
Źródło logiki: `matura-app` (`origin/feat/l7-learner-bundle`): `lib/data/analytics.ts` (lejek), `lib/data/retention-metrics.ts`
(D1/D7/D30, dni nauki w tygodniu), `lib/domain/learner/metrics.ts` (MIN_GROUP = 5, n = liczba osób), `app/admin/lejek`, `app/admin/nagrody`.

## Co jest
- **Wejścia bez cookies**: przy otwarciu strony przeglądarka najwyżej raz dziennie dodaje 1 do sumy dnia (`nauka_wejscie`).
  Zapisuje się tylko: dzień, rocznik (jeśli wybrany na ekranie wejścia) i źródło z linku (`?z=ig`, także `?zapisz=plan`).
  Bez osoby, IP, urządzenia i cookies; „raz dziennie” pilnuje flaga z datą w localStorage (`bm-wejscie`).
- **Lejek** (ostatnie 28 dni albo od początku): wejścia → konta → wybrany kierunek → okres próbny → zakup (Stripe), z procentem
  z poprzedniego kroku i z kont. Kroki po wejściach liczone są z kont założonych w tym okresie. Osobno: potwierdzone zapisy
  na listę oczekujących (wszystkie kierunki) i wejścia według źródła.
- **Retencja**: powroty D1 / dni 7–13 / dni 30–36 (dzień nauki = lekcja, quiz, fiszki, gra, Po zajęciach, Staś albo powtórka),
  mediana i średnia dni nauki w 4 ostatnich tygodniach.
- **„Czy strona uczy”**: % dobrych pierwszych odpowiedzi w powtórkach po ≥ 7 dniach, przedmiot × tydzień (8 tygodni) + „Razem”;
  rewanże wygrane / wszystkie z 28 dni; test A/B haczyka lekcji (bilety zdane i „czy uczy” dla „z haczykiem” i „bez”).
- **Nowe zdarzenia nauki** (przez istniejący `learnEvent`, bez zmian zasad): bilet wyjścia dostaje pole `hak`
  (`haczyk` / `bez` / `wlasny`, z talii lekcji), a wynik rewanżu (wygrany, przegrany, pokonany) idzie jako `activity` z `kind: "rewanz"`
  (bez materiału, więc nie zmienia statystyk tematu; bez punktów i monet).
- **Nocne podsumowanie** `pg_cron` (`skrot-lejek`, 3:15 UTC) do `nauka_lejek_dzien`; panel czyta tylko je. Przycisk „Przelicz teraz”.
- **Panel** Narzędzia starosty → „Lejek i retencja” (tylko administrator). Grupy < 5 osób: „< 5”. PL i EN.

## Kroki dla Bartka
1. **pg_cron** (jeśli jeszcze nie jest po v33): Supabase → skrzynka-bm → Integrations → Cron → Enable.
2. **SQL v35**: Supabase → SQL Editor → New query → wklej całe `supabase/skrot-v35-lejek.sql` → Run.
   W „Messages” ma być `OK lejek: zadanie skrot-lejek codziennie 3:15 UTC` (bez pg_cron: komunikat, że trzeba go włączyć).
   Wymaga v34 (lista oczekujących) i v31 (roczniki).
3. Napisz „uruchomione” → wdrażam stronę (scalenie gałęzi). Do tego czasu strona woła `nauka_wejscie` i dostaje „brak funkcji”,
   co niczego nie psuje (flaga się nie zapisuje, wejście liczy się przy następnym otwarciu).
4. **Sprawdzenie** po wdrożeniu: Narzędzia starosty → Lejek i retencja → „Przelicz teraz” → rocznik Business Management:
   konta, próby i zakupy z prawdziwych danych. Wejścia zaczną się liczyć od dnia wdrożenia (wcześniej ich nie zbieraliśmy),
   pole `hak` i rewanże też od wdrożenia.

## Do decyzji
- **Polityka prywatności** (nie zmieniałem `prywatnosc*.html`; dopiszę po akceptacji, razem z tekstami z etapów 4 i 5). Propozycja:
  > „Statystyki odwiedzin: nie używamy cookies ani zewnętrznych narzędzi analitycznych. Liczymy tylko, ile razy dziennie otwarto
  > stronę (łącznie, z wybranym kierunkiem i źródłem linku, np. z Instagrama), bez danych, które pozwalają rozpoznać osobę.
  > Żeby nie liczyć tej samej przeglądarki kilka razy dziennie, w pamięci przeglądarki zostaje sama data ostatniego wejścia.
  > Zestawienia z kont (np. ile osób wróciło po tygodniu) widzi tylko administrator, zawsze w grupach co najmniej 5 osób.”

  EN: “Visit statistics: we don't use cookies or external analytics tools. We only count how many times a day the site is opened
  (in total, with the chosen programme and the link source, e.g. Instagram), without any data that identifies a person. So the same
  browser isn't counted several times a day, the browser's storage keeps only the date of the last visit. Summaries from accounts
  (e.g. how many people came back after a week) are seen only by the admin, always in groups of at least 5 people.”
- Liczby wejść są przybliżone z założenia: bez identyfikatora ktoś może je sztucznie podbić (np. skryptem). Na lejek kont to nie wpływa.
- Kroki lejka liczę z kohorty kont (założonych w okresie), a „wejścia” to przeglądarko-dni, nie osoby: procent wejścia → konto
  jest orientacyjny. Wybór kierunku zapisuje się w profilu dopiero po zalogowaniu, dlatego krok „Wybrany kierunek” jest po „Kontach”.
- Konta sprzed v31 mają `rocznik_wybrany_at` = data profilu, więc w BM „od początku” krok „Wybrany kierunek” ≈ konta.
- Podział lejka na źródło konta (etap 11) jeszcze nie istnieje: w podsumowaniu jest puste pole `zrodla` na ten podział.

## Testy
- `node --test tests/*.test.js`: 69/69 (`lejek` 7).
- PGlite `supabase/test/v35.sql` L1–L12: anon tylko zwiększa sumę (nie czyta, nie liczy, nie widzi panelu), zły rocznik/źródło → puste,
  limit 50 źródeł, liczenie tylko service_role/admin, lejek (Stripe tak, ręczny dostęp nie), D1/D7/D30 (test profilu to nie nauka),
  czy uczy na przedmiot i „*”, rewanże, A/B (zły wynik w zdarzeniu nie zatrzymuje liczenia), lista oczekujących tylko w „*”,
  administratorzy poza lejkiem, jeden wiersz na dzień i rocznik. Migracja uruchomiona 2×.
- Playwright `docs/gry/test/lejek.mjs` 53/53 (375/1280, PL/EN): licznik raz dziennie, bez cookies; panel z dwoma rocznikami
  (drugi z danych), ukrywanie < 5, okresy, „Przelicz teraz”, dotyk ≥ 44 px, bez przewijania w bok; student bez panelu;
  wygrany rewanż → zdarzenie. `lekcje-v4.mjs`: bilet L4 ma `hak: "haczyk"`.

## Dla kolejnego rocznika
Nic: nowy wiersz w `nauka_roczniki` dostaje swoje podsumowanie przy najbliższym liczeniu i pojawia się w wyborze rocznika w panelu.
