# „Dla Ciebie na dziś”, etap 4: blok na Dziś (na razie tylko dla Ciebie)

Gałąź `lekcja-dnia/blok` (od `lekcja-dnia/mechaniki`). Bez SQL.

## Jak włączyć
Wejdź na stronę z **`?ld=1`**, np. `https://zdawalni.pl/?ld=1`. Flaga zapisuje się w tej przeglądarce (`bm-ld-flag`), więc dalej wystarczy zwykłe wejście. **`?ld=0`** wyłącza blok.

Blok widzi tylko konto admina (`skrot.admin`). Wszyscy inni, także z `?ld=1`, mają stare karty bez zmian.

## Co jest na Dziś (z flagą)
- **Zastąpione karty (D2):** blok zastępuje „Teraz zrób to”, drugą kartę, „Ile masz dziś czasu?” i „Powtórkę w 5 minut” u góry i w środku. Ekran „Powtórka w 5 minut” w Więcej zostaje.
- **Gdy Staś jest dziś w lekcji dla Ciebie,** osobna karta Stasia znika.
- **Bez zmian zostaje:** karta przed snem, przejazd, Boss, zajęcia i termin, przypomnienia, gry, Hasło dnia.
- **Karta „Dziś · 5 min”**, ten sam element co „Teraz zrób to” (`section.sk-hero.sk-now`, `.warn` przy zaliczeniu za ≤ 3 dni, `.calm` w trybie Lekko):
  - tryb dnia, temat i 1–2 powody;
  - trzy kroki jako wiersze `.sk-row-big` z kółkiem `.ic`;
  - „Zaczynam · 5 min”, a po przerwaniu „Wróć · zostało ok. N min”.
- **Pod kartą trzy przyciski:**
  - **„Inny temat ↻”**: nowa karta bez tego tematu i bez tematów lekcji; temat pominięty 2× silnik odkłada do jutra;
  - **„Mam więcej czasu ▾”**: 15 / 30 / 60 min, a pod spodem kolejność, co zrobić (`fitDay` z `dzien.js`), z linkami do otwarcia;
  - **„Dlaczego to?”**: 2–3 powody po ludzku.
- **Po karcie** jest „Zrobione ✓” oraz przyciski „Jeszcze 5 min” (nowa karta z innego tematu) i „Przejdź do lekcji”.
- **„Lekcje dla Ciebie”**: dwa kafelki takie jak kafelki przedmiotów (`.nb`, okładka przedmiotu `pat` w jego odcieniu, skrót przedmiotu). Każdy kafelek ma:
  - długość i rolę („Najważniejsze teraz” / „Na zmianę”);
  - chipy mechanik `.sk-chip`;
  - jeden powód i „Dlaczego to?”;
  - pasek postępu, gdy lekcja jest zaczęta;
  - przycisk „Zacznij” / „Wróć (zostało ok. N min)” / „Zrobione ✓ · jeszcze raz”.
- **Przełącznik „Jestem w drodze”** układa niezaczęte lekcje jeszcze raz, tylko z mechanik pod kciuk: bez pisania, bez zdjęć i bez gier na czas.
- **Po wszystkim** pojawia się „Na dziś zrobione. Jutro ułożymy nowe.” i „Jeszcze jedna lekcja” (D9, bez limitu; dochodzi trzeci kafelek).
- **Bez Profilu nauki** pod blokiem jest link „Ułożymy lepiej po 6-minutowym Profilu nauki”. Znika po teście, a ✕ chowa go na dziś.
- **Telefon pierwszy:** na 375 px lekcje są jedna pod drugą, od 600 px obok siebie. Wszystkie przyciski bloku mają co najmniej 44 px. Jest wersja EN.

## Wygląd (5.1)
- Blok nie ma własnych kolorów, cieni ani gradientów. Nowy CSS służy tylko do układu (siatka, odstępy, wysokość celów) i jest w jednym bloku `/* Lekcja dnia */`.
- Test porównuje wyliczone style:
  - karta 5 min ma tło, gradient, rogi i kolor tekstu takie same jak „Teraz zrób to” w tym samym motywie;
  - kafelek lekcji ma tło i rogi takie same jak kafelek przedmiotu.
- Sprawdzone w każdym motywie ze sklepu i w domyślnym (Łąka, Nenufary, Nocny rejs, Kokardka, Jednorożec, Nokturn), w jasnym i ciemnym, na 375 i 1280 px: 28 wariantów, wszystkie zgodne.
- Zrzuty (nowe obok starych) są w arkuszach wysłanych w czacie.

## Decyzje (moje, do zmiany na Twoje słowo)
- **„Inny temat”** jest tylko przy karcie 5 min. Lekcje mają „Dlaczego to?”, ale nie mają „Inny temat”, bo spec go tam nie ma. Łatwo dodać, jeśli chcesz.
- **Bez lekcji do ułożenia** (np. nowe konto bez materiałów) blok pokazuje starą kartę „Teraz zrób to”, żeby Dziś nie było puste.
- **D5 (gość, po okresie próbnym)** czeka na etap 6. Teraz blok widzi tylko admin, który ma pełny dostęp.

## Testy
- `node --test tests/*.test.js`: 237/237.
- **Nowy `docs/gry/test/lekcja-dnia-4.mjs`: 85/85.** Sprawdza:
  - flagę (admin / nie-admin, zapamiętanie) i brak starych kart;
  - klasy karty i kafelka, „Dlaczego to?”, „Mam więcej czasu” (30 min), „Inny temat”, „Jestem w drodze”;
  - „Wróć” po przerwaniu, „Zrobione”, „Na dziś zrobione” i „Jeszcze jedna lekcja”;
  - układ 375 / 1280 px, cele ≥ 44 px, brak przewijania w bok;
  - 28 wariantów motywów (style identyczne ze starymi kartami), EN na 375 i 1280 px, brak błędów w konsoli.
- Regresja w porównaniu z `main` (ten sam wynik): dzien 27/27, po-zajeciach 26/28 (te same 2 co na `main`), Staś 40/40, Boss etap9 82/82, polaczenia-3 16/16; lekcja-dnia 30/30, lekcja-dnia-3 29/29.
