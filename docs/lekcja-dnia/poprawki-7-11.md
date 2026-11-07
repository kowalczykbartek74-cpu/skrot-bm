# „Dla Ciebie na dziś”: poprawki 7.11

Bez SQL. Zmienione pliki: `lekcja-dnia.js`, `index.html`, `gry.js`, `i18n-en.js`, testy.

## Co jest
- **Wybór tematu karty „Dziś · 5 min”**
  - Obok „Inny temat ↻” jest przycisk „Wybierz temat ▾”.
  - Rozwija listę wszystkich dostępnych tematów, pogrupowanych według przedmiotów.
  - Po wyborze karta układa się z tego tematu. Kroki są te same co w karcie dnia (rozgrzewka, najważniejsze, 2 pytania), a pierwszy powód w „Dlaczego to?” brzmi „Temat wybrany przez Ciebie”.
  - Wybór zapisuje się w planie dnia i zostaje też po otwarciu karty (`LDE.wybranaKarta`).
  - Przycisku nie ma w zaczętej karcie, tak jak przycisku „Inny temat”.
- **Zgadnij hasło (w lekcji): 5 podpowiedzi.** Po każdej złej próbie dochodzi jedna podpowiedź (prób jest 6, więc piąta przychodzi przed ostatnią). Kolejność:
  1. pierwsza litera;
  2. znaczenie z definicji pojęcia, z ukrytym hasłem („…”);
  3. ostatnia litera;
  4. co druga litera (np. `C _ N _ R _ C T`);
  5. wszystkie litery w porządku alfabetycznym.
  - Bez definicji drugą podpowiedzią są samogłoski hasła.
  - Hasło dnia (`#/haslo`) zostaje bez zmian: słowo zna tylko baza, więc podpowiedzi wymagałyby SQL.
- **Fruń: pytanie po każdych 20 kolumnach**, w każdej rundzie, nie tylko w lekcji.
  - Gra się zatrzymuje, nagłówek to „20 kolumn · pytanie”, a pod spodem pytanie ABCD z przedmiotu.
  - Nie ma „Pomiń pytanie”: trzeba odpowiedzieć albo poczekać, aż skończy się czas.
  - Dobra odpowiedź daje ⚡ i punkty rankingu jak każde pytanie w grze. Po złej gra pokazuje poprawną odpowiedź i leci dalej.
  - Po pytaniu listek czeka na dotknięcie i przez 2 s jest nietykalny, jak po Drugiej szansie.
  - Pytania z bramek liczą się do limitu 12 pytań na rundę.

- **Podkreślone pojęcia w nowych lekcjach** (dopisane później tego samego dnia)
  - Pogrubione pojęcia w kartach „Dla Ciebie na dziś” są podkreślone kropkami, tak jak w zwykłej lekcji. Dotknięcie otwiera wyjaśnienie: pojęcie, polskie tłumaczenie, definicja i przycisk „Jasne, wracam”.
  - Definicje są brane z tematu bieżącej karty, bo lekcja może łączyć kilka tematów. Kolejność źródeł jak w lekcji: pojęcia tematu, sylabus, słowniczek, a na końcu zdanie z lekcji.
  - Podkreślenia w przykładach, zadaniach i rozwiązaniach z lukami działają tak samo.

## Decyzje (moje, do zmiany na Twoje słowo)
- **Zła odpowiedź we Fruń nie kończy rundy.** „Musisz odpowiedzieć” rozumiem tak, że nie da się pominąć pytania. Jeśli zła odpowiedź ma kończyć grę, to jedna linijka.
- **Podpowiedzi idą od najsłabszej do najmocniejszej.** Znaczenie jest drugie, bo uczy najwięcej.

## Testy
- `node --test tests/*.test.js`: 243/243. Nowe testy: 5 podpowiedzi z ukrytym hasłem, samogłoski bez definicji, wybrana karta.
- Nowy `docs/gry/test/lekcja-dnia-6.mjs`: 18/18 (w tym pojęcie podkreślone w lekcji, wyjaśnienie z definicją i zamknięcie). Sprawdza:
  - listę tematów z przedmiotami;
  - wybór, powód i zapis w planie, także po otwarciu karty;
  - Hasło: podpowiedzi 1…5 po złych próbach, ich treść, ukryte słowo i zniknięcie po zgadnięciu;
  - Fruń: pytanie przy 20, brak „Pomiń”, po odpowiedzi stan „gotowy” z nietykalnością, odpowiedź w bazie.
