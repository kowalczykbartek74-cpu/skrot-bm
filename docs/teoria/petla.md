# Mapa teorii: do każdego tematu BM cała teoria jako tekstowa mapa (kod + pętla treści z oceną ≥ 8/10)

Stan na 20.11.2026. Plik dla Claude Code na komputerze Bartka.

> **Stan 20.11.2026: etap A (kod) jest zrobiony** na gałęzi `teoria` w `skrot-bm` (ekran, wejścia, przełącznik, Panel AI → „Paczka teorii”, testy `tests/teoria.test.js` i `docs/gry/test/teoria.mjs`, opis w README „Mapa teorii”). Pętla zaczyna od **etapu B** (sekcja 5). Etapu A nie budujesz od nowa. Jeśli gałąź `teoria` nie jest jeszcze scalona z `main`, przypomnij o tym Bartkowi w `RANO.md` (treści i tak powstają w `zdawalni-tresci`). Gdzie kod różni się od tej specyfikacji, wygrywa kod: znacznik „przeczytane” jest tylko w `localStorage` (`skrot-teoria-czytane`), pogrubione pojęcia nie otwierają jeszcze okna z tłumaczeniem (jest tabela „Słowa EN–PL”), wiersz „Mapy teorii” jest w zakładce Ucz się przedmiotu. Wzór poprawnego dokumentu: `skrot-bm/docs/teoria/przyklad-inflation.json`, walidator: `ZD_TEORIA.waliduj` w `skrot-bm/teoria.js` (twój `narz/teoria-sprawdz.py` ma dawać te same wyniki; sprawdź go na tym przykładzie i na przypadkach z `tests/teoria.test.js`).

> **Jak uruchomić:** zapisz ten plik jako `~/zdawalni/teoria/petla.md`, a prototyp `prototyp.html` jako `~/zdawalni/teoria/prototyp.html`. W nowym czacie Claude Code (katalog `~/zdawalni`) napisz: **„Wykonaj ~/zdawalni/teoria/petla.md”**. Uruchom w trybie bez pytań o każde polecenie (jak pętle UX i nocne).
>
> **Wznowienie:** „Kontynuuj pętlę według ~/zdawalni/teoria/petla.md i ~/zdawalni/zdawalni-tresci/docs/teoria/STAN.md”.

| Etap | Repo · gałąź | Katalog roboczy | Port strony | SQL |
|---|---|---|---|---|
| A · kod | `skrot-bm` · `teoria` | `~/zdawalni/teoria-kod` (worktree) | 8836 | **brak** (sekcja 3.3) |
| B · treści | `zdawalni-tresci` · `teoria/bm` | `~/zdawalni/teoria-tresci` (worktree) | – | brak |
| C · paczki | `zdawalni-tresci` | jak B | – | brak |

Obowiązują też: `docs/CLAUDE.md` (sekcja 4), `docs/lekcje-v4/zasady.md`, `DESIGN.md`, `PALETA.md`, zasady pisania z `docs/klocki-start-noc.md` sekcja 2 i sekcje 7–9 z `~/zdawalni/starsze/petla.md` (poprawność, recenzent, kontroler). Gdy ten plik się od nich różni, w sprawach mapy teorii wygrywa ten plik.

---

## 0. Cel

Część studentów nie chce zaczynać od kart z pytaniami. Chce **najpierw spokojnie przeczytać całą teorię tematu**, zobaczyć, jak się składa, i dopiero potem ćwiczyć. Dla nich każdy temat dostaje **Mapę teorii**:

- **cała teoria tematu** w jednym miejscu: wszystko, co jest w lekcji (każdy atom, wzór, rozróżnienie, typowy błąd), i wszystko, czego wymaga sylabus z tego tematu;
- ułożona jak **mapa myśli**, tylko w tekście: środek (temat w jednym zdaniu) → 3–6 numerowanych gałęzi (pytania, na które temat odpowiada) → węzły (definicja, wzór, przykład, „nie myl”, typowy błąd, połączenie) → najwyżej jeden poziom głębiej;
- **prowadzi po temacie**: na górze kolejność czytania z minutami, na końcu „Jak to się łączy”, „Na egzaminie”, „Słowa EN–PL” i jeden przycisk „Zacznij lekcję”;
- **bez animacji, celowo**: zero przejść, pulsowania, konfetti, płynnego przewijania, nagród w trakcie czytania. Sam tekst, spokojny, do druku.

Wzór wyglądu i poziomu treści: `~/zdawalni/teoria/prototyp.html` (Macroeconomics · Inflation). Skopiuj go do `skrot-bm/docs/teoria/prototyp.html` w pierwszym commicie etapu A.

**Miara sukcesu:** każdy temat główny BM semestru 1 ma mapę, którą nowy recenzent ocenił na ≥ 8/10 bez twardego błędu; student, który przeczyta tylko mapę, odpowie na pytanie egzaminacyjne z tego tematu; ekran przechodzi kontrolę techniczną (360/375/1280 px, AA, 44 px, EN, druk).

## 1. Tryb pracy

- Autopilot: pracujesz sam, bez pytań. Ten plik **zastępuje** zasadę „etap → raport → czekaj na »dalej«”. Wątpliwość → rozsądny wariant, zapis w `STAN.md` („Decyzje”).
- Kolejność: **A (kod) → pilot treści (B1) → B2 (reszta treści) → C (paczki)**. B1 możesz zacząć równolegle z A, bo format danych jest ustalony w sekcji 3.
- Kończysz, gdy kolejka B jest pusta, gdy brakuje repo albo jest konflikt gita nie do rozwiązania bez Bartka, albo przed limitem sesji (sekcja 9).

## 2. Decyzje przyjęte domyślnie (Bartek może zmienić przed startem: „D1 inaczej: …”)

1. **D1 Język:** treść mapy po angielsku (jak lekcje BM i egzaminy), napisy interfejsu z i18n (PL/EN), na końcu tabela „Słowa EN–PL”. Bez osobnej polskiej wersji mapy (od tego jest „Prościej · PL”).
2. **D2 Zakres i kolejność:** każdy temat z `topicsOf(sid).main` rocznika `wefiz-bm-1-st-2026`, semestr 1: najpierw przedmioty z testem (OWI, Prawo, Makroekonomia, Podstawy finansów), potem Analiza matematyczna, potem reszta. W przedmiocie według kolejności lekcji. Materiały z prezentacji, które są osobnym tematem (nie bliźniakiem lekcji), robisz po lekcjach swojego przedmiotu. Inne kierunki: później, tym samym kodem (sekcja 10).
3. **D3 Zapis bez SQL:** mapa = dokument `materialSimple/<id tematu>~teoria` (tak jak „Jeszcze prościej” w `materialSimple/<id>~ez`). Ta sama kolekcja, te same zasady dostępu, ten sam `rocznik_id`, czytany dopiero po otwarciu mapy. Żadnej migracji.
4. **D4 Wejście:** na ekranie tematu (lekcja albo materiał) drugi przycisk **„Najpierw teoria”** obok głównego (główny zostaje jeden). W Ustawieniach → Nauka przełącznik **„Najpierw teoria”** (domyślnie wyłączony, `localStorage skrot-teoria-1st`): gdy włączony, pierwsze uruchomienie lekcji tematu, którego mapa nie jest przeczytana, otwiera mapę; koniec mapy prowadzi do lekcji. Na Dziś nic nowego. W przedmiocie wiersz „Teoria przedmiotu”: lista map w kolejności lekcji ze znacznikiem „przeczytane”.
5. **D5 Dostęp:** jak lekcje (płatni i próba). Gość i konto bez dostępu widzą środek mapy i gałąź 1, potem zwykły ekran zakupu (tak jak lekcja pokazowa).
6. **D6 Bez nagród:** przeczytanie mapy daje tylko znacznik „przeczytane” (`localStorage skrot-teoria-czytane`, gdy student doszedł do końca albo kliknął „Zacznij lekcję”). Zero XP, monet, punktów kursu i rankingu, żeby nikt nie przewijał map dla nagród. Mapa nie liczy się do „umiesz z zakresu”.

## 3. Format danych `teoria` v1

### 3.1 Dokument `materialSimple/<id>~teoria`
```json
{
  "format": "zdawalni-teoria", "v": 1, "lang": "en",
  "mid": "<id tematu>", "sylRef": "W2, CW2",
  "core": { "one": "jedno zdanie: czym jest temat", "why": "1–2 zdania: po co to jest i na co odpowiada" },
  "prereq": [ { "text": "co trzeba umieć wcześniej, 1 zdanie", "ref": "<id lekcji albo null>" } ],
  "branches": [
    { "id": "b1", "q": "pytanie w spisie (do 60 znaków)", "title": "nagłówek gałęzi", "lead": "1–2 zdania prowadzące",
      "nodes": [
        { "id": "b1-1", "t": "def", "h": "krótki nagłówek", "md": "tekst węzła",
          "f": "wzór (LaTeX \\(...\\)) albo brak", "legend": "co znaczy każda litera albo brak",
          "table": { "head": ["…"], "rows": [["…"]] },
          "steps": ["krok 1", "krok 2"],
          "ref": "<id lekcji albo materiału, tylko przy t = link>",
          "kids": [ { "id": "b1-1a", "t": "vs", "h": "…", "md": "…" } ] }
      ] }
  ],
  "links": [ { "from": "b2", "to": "b4", "why": "1 zdanie" }, { "from": "b1", "toLesson": "<id>", "why": "…" } ],
  "exam": [ "typ zadania na egzaminie + gałąź, 1 zdanie" ],
  "terms": [ { "en": "…", "pl": "…" } ],
  "zrodla": [ "pozycja z literatury sylabusa albo źródło urzędowe" ],
  "spr": { "autor": "…", "recenzja": "8.6/10, 2 rundy, 2026-11-21", "hash": "<odcisk lekcji, na której oparto mapę>" }
}
```

### 3.2 Reguły formatu (sprawdza `narz/teoria-sprawdz.py`)
- Typy węzłów `t`: `def` (Definicja), `idea` (Idea), `formula` (Wzór), `ex` (Przykład), `vs` (Nie myl), `err` (Typowy błąd), `exam` (Na egzaminie), `link` (Połączenie). Napisy etykiet z i18n, nie z danych.
- Gałęzie 3–6, w gałęzi 2–6 węzłów, `kids` najwyżej jeden poziom (środek → gałąź → węzeł → dziecko). Id unikalne, `b<n>`, `b<n>-<m>`, `b<n>-<m><litera>`.
- Długość: cała mapa **900–2400 słów** (bez tabeli słów), `md` węzła ≤ 120 słów, `lead` ≤ 40, `core.one` ≤ 25. Czas czytania liczy strona (200 słów/min, zaokrąglony do minuty), nie zapisujesz go.
- `md`: ten sam podzbiór markdown co karty lekcji (pogrubienie, kursywa, listy jednego poziomu) i LaTeX `\(…\)`. Tabele tylko w `table`, kroki tylko w `steps`.
- Pogrubione są tylko pojęcia, które mają wpis w `terms` albo w słowniczku przedmiotu.
- Każdy `ref` istnieje w roczniku. `links[].from/to` wskazują istniejące gałęzie.
- Węzeł `ex` i `formula` z liczbami: każda liczba pochodzi z `NN.teoria.obliczenia.py` (sekcja 6.2).

### 3.3 Dlaczego bez SQL
`materialSimple` jest już na liście kolekcji rocznika (`skrot-v44-roczniki-tresci.sql`), a `~ez` pokazuje, że przyrostek działa w zapisie, odczycie i usuwaniu. Gdy w etapie A okaże się, że coś jednak wymaga SQL (np. limit rozmiaru dokumentu), **nie piszesz migracji**: zapisujesz to w `do-decyzji.md` z propozycją i robisz wersję bez SQL.

## 4. Etap A: kod w `skrot-bm` (gałąź `teoria`)

### A0. Przygotowanie
`git -C ~/zdawalni/skrot-bm fetch origin && git -C ~/zdawalni/skrot-bm worktree add ~/zdawalni/teoria-kod -b teoria origin/main`. Przeczytaj: ten plik, prototyp, `README.md` (sekcje „Lekcje v4”, „Jeden licznik tematów”, „Sylabus kierunku” o pogrubieniach), `DESIGN.md`, `PALETA.md`, `docs/gry/test/README.md`, `lib.mjs`, `h2-lib.mjs`, opis kont w `atrapa-supabase.js`. Serwer: `python3 -m http.server 8836 --bind 127.0.0.1 &`. Testy zielone przed pierwszą zmianą.

### A1. Co budujesz
1. **`teoria.js`** (osobny plik, `?v=` w `<script src>`; bez przeformatowania linii ze skryptami ani linii 1 `index.html`): `ZD_TEORIA.render(doc, opts)` buduje widok z prototypu funkcją `h()`, komponenty H2, kolory tylko ze zmiennych `--h-*`, rozmiary `--fs-*`, zaokrąglenia `--r-*`, ikony z `ikony-ux.js` (strzałka wstecz, drukarka). Bez emoji. Markdown i LaTeX przez ten sam renderer co karty lekcji (znajdź funkcję, która w `lpBuildDeck` zamienia `b.md` na HTML, i użyj jej, nie pisz drugiej).
2. **Trasa `#/teoria/<id>`**: tytuł ekranu, przycisk wstecz do przedmiotu, „Drukuj”. Odczyt `materialSimple/<id>~teoria` dopiero po wejściu (jak `S.ez`), pamięć w `S.teoria[id]`. Brak dokumentu → pusty stan: „Mapa teorii do tego tematu jeszcze powstaje” + główny przycisk „Zacznij lekcję”. Błąd sieci → komunikat z „Spróbuj jeszcze raz”.
3. **Układ:** telefon: środek mapy z kolejnością czytania (linki do gałęzi), zwijany spis całej mapy, gałęzie jedna pod drugą jako drzewo (linia `--h-edge` 2 px i odgałęzienia jak w prototypie; to linie drzewa, nie kolorowy pasek karty, więc nie łamią zasady 5 z `DESIGN.md`), na końcu Połączenia, Na egzaminie, Słowa EN–PL, „Teoria przeczytana” z głównym przyciskiem „Zacznij lekcję”. Komputer (≥ 1000 px): po lewej przyklejona mini-mapa (gałęzie i węzły), po prawej treść, szerokość tekstu ≤ 72 znaki.
4. **Zero ruchu w widoku:** `transition`, `animation` i `scroll-behavior: smooth` wyłączone dla całego widoku (bez względu na `html.calm`), skok do gałęzi bez przewijania animowanego, żadnych toastów nagród. Fokus przenosi się na nagłówek gałęzi po skoku.
5. **Wejścia z D4:** przycisk „Najpierw teoria” na ekranie tematu (tylko gdy mapa istnieje; drugi przycisk `.btn`, nie `.primary`), przełącznik w Ustawieniach, wiersz „Teoria przedmiotu” na stronie przedmiotu, znacznik „przeczytane”. Odtwarzacz lekcji przy włączonym przełączniku: przy pierwszym starcie lekcji z nieprzeczytaną mapą otwiera mapę; „Zacznij lekcję” na końcu mapy otwiera lekcję od początku.
6. **Druk:** `@media print` z prototypu: cała mapa, bez paska, spisu i przycisków, węzeł nie łamie się w środku. W stopce druku e-mail kupującego jak w ściągawkach (ten sam znak wodny).
7. **Dostęp (D5):** gość i brak dostępu: środek + gałąź 1, potem komponent zakupu używany przy lekcjach.
8. **Panel AI → „Paczka teorii”**: przyjmuje pliki `{ "format": "zdawalni-paczka-teorii", "v": 1, "rocznik", "utworzono", "teoria": { "<id>": {…dokument 3.1…} } }`, pokazuje liczbę map na przedmiot, odrzuca mapę, której `<id>` nie ma w roczniku albo która nie przechodzi walidatora z `teoria.js` (`ZD_TEORIA.waliduj`, te same reguły co 3.2), zapisuje `materialSimple/<id>~teoria` w bieżącym roczniku. Usuwanie tematu kasuje też `~teoria` (tam, gdzie dziś kasuje `~ez`).
9. **i18n:** każdy nowy polski napis ma parę w `i18n-en.js` → `"exact"` w bloku `// teoria`. Treść mapy nie jest tłumaczona (już jest po angielsku). Etykiety typów węzłów: Definicja/Definition, Idea/Idea, Wzór/Formula, Przykład/Example, Nie myl/Don't confuse, Typowy błąd/Common mistake, Na egzaminie/On the exam, Połączenie/Link.
10. **Dostępność:** `h1` temat, `h2` gałęzie, `h3` węzły, `nav` dla spisu z `aria-label`, drzewo jako listy `ul`, tabele z `th scope`, cele ≥ 44 px, tekst ≥ 12 px, AA w jasnym i ciemnym, zero poziomego przewijania przy 360/375 px (wzory i tabele przewijają się w swoim polu).

### A2. Testy
- `docs/gry/test/teoria.mjs` (Playwright na atrapie, `locale: 'pl-PL'`): do atrapy dopisz w bloku `// === teoria ===` dwie mapy (Inflation z prototypu przepisana do formatu 3.1 i jedna krótka) i jeden temat bez mapy. Sprawdź: wejście z tematu i z przedmiotu, przełącznik D4, pusty stan, gość (tylko gałąź 1), znacznik przeczytane, brak nagród (XP i monety bez zmian), Paczka teorii (dobra i zła paczka), druk (`page.emulateMedia({ media: 'print' })`: brak przycisków, widać wszystkie gałęzie), EN, 360/390/1280, jasny i ciemny, `getAnimations().length === 0` w widoku, konsola bez błędów.
- Wszystkie istniejące testy z `docs/CLAUDE.md` pkt 9 i `node --test tests/*.test.js` zielone, `node --check` na zmienionych JS.
- Test jednostkowy walidatora: `tests/teoria.test.js` (te same przypadki co `teoria-sprawdz.py`, żeby oba walidatory mówiły to samo).

### A3. Ocena kodu (nowy subagent, próg 8/10, maks. 4 rundy)
Recenzent dostaje tylko: sekcje 0, 2, 3, 4 tego pliku, prototyp, zrzuty 360×640 / 390×844 / 1280×900 jasny i ciemny (środek, gałąź z wzorem, koniec, pusty stan, gość, druk) i wynik testów. Nie widzi diffa ani Twoich uzasadnień.

| Kryterium | Pkt |
|---|---|
| Czyta się łatwo: hierarchia od razu widoczna, kolejność czytania, spokojny tekst bez ozdobników, zgodność z prototypem | 3 |
| Prowadzi: spis, skoki do gałęzi, „Jak to się łączy”, koniec z jednym przyciskiem, droga wstecz | 2 |
| Wejścia D4–D6 działają i nie dokładają drugiego głównego przycisku | 2 |
| Technika: 360 px, 44 px, AA, EN, ciemny, druk, zero animacji | 2 |
| Paczka teorii i pusty stan | 1 |

Twarde błędy (maks. 5): animacja albo przejście w widoku, poziome przewijanie, tekst poniżej AA, błąd konsoli, czerwony test, napis bez EN, nagroda za czytanie, zapis do produkcji. Poprawiasz według uwag, każda poprawka osobny commit „Teoria A runda R: …”. Push tylko gałęzi `teoria`. **Nie scalasz z `main`** (robi to Bartek po obejrzeniu).

## 5. Etap B: treści w `zdawalni-tresci`

### B0. Wejście
- Eksport lekcji BM: najnowszy `scratch/lessons/` z `docs/lekcje-v4/eksport.js`. Jeśli go nie ma albo jest starszy niż 7 dni, w `RANO.md` zapisz prośbę: „Uruchom eksport (Więcej → konsola, `docs/lekcje-v4/eksport.js`) i rozpakuj do `scratch/lessons/`”, a do tego czasu pracuj na tym, który jest, i zapisz jego datę w `spr.hash`.
- Karta przedmiotu z `sylabus.json` (tematy W/CW z godzinami, efekty, literatura).
- Dla tematów z prezentacji: tylko opracowanie z `materialContent` (`notes`, `concepts`, `topics`), **nigdy tekst slajdów** (zasada 3 z `docs/CLAUDE.md`).
- Kolejka `docs/teoria/kolejka.json` według D2, z liczbą słów lekcji (mapa nie powinna być krótsza niż połowa treści lekcji).

### B1. Pilot (przed resztą)
Jedna mapa na typ przedmiotu: **Makroekonomia** (temat z inflacją, `theory`), **Prawo** (`law`), **Podstawy finansów** (`quant`). Każda przechodzi pełną recenzję z 6.3 i dodatkowo porównanie z prototypem (poziom, długość, styl). Uwagi recenzentów do pilotów stosujesz w całej kolejce i dopisujesz do `docs/teoria/zasady-autora.md`.

### B2. Pętla jednego tematu
1. **Autor** (subagent, paczka do 3 map jednego przedmiotu) pisze `scratch/teoria/<przedmiot>/<id>.teoria.json` i `<id>.teoria.obliczenia.py` (każda liczba z mapy z asercją, uruchomiony, wynik w `.txt`).
2. `python3 -I narz/teoria-sprawdz.py <plik> --lekcja scratch/lessons/<id>.json --sylabus sylabus.json` aż do OK. Skrypt piszesz raz. Sprawdza 3.2 oraz **pokrycie**: każdy atom lekcji (`lesson.atoms[].d`), każde pogrubione pojęcie lekcji, każdy wzór, każda para `conf` (jako węzeł `vs`) i każdy `mistake` sekcji ma swój węzeł w mapie (dopasowanie po pojęciu, wynik jako lista „brak: …”); każdy temat z `sylRef` ma gałąź; kontrola 7 kolejnych słów wspólnych z lekcją (mapa ma być nowym tekstem, nie sklejką kart: najwyżej 3 takie ciągi na mapę) i z `materialSources` (zero).
3. `python3 narz/teoria-czytaj.py <plik> > <id>.teoria.txt`: mapa w kolejności czytania, z typami węzłów, do czytania przez recenzenta.
4. **Recenzja** (nowy subagent w każdej rundzie, sekcja 6). Decyzja jak w `~/zdawalni/starsze/petla.md` 6f: ≥ 8, brak twardych błędów, wszystkie kryteria `true` → zatwierdzona (`bank/teoria/<rocznik>/<id>.teoria.json`, JSON recenzji do `docs/teoria/recenzje/`). Inaczej autor poprawia dokładnie `poprawki`, maks. 3 rundy; potem `scratch/teoria/do-poprawy/`.
5. **Kontroler** (sekcja 9 nocnej pętli): co 10. zatwierdzona mapa i każda mapa z Prawa i OWI.
6. Koniec przedmiotu: commit i push („Teoria BM: <przedmiot> – N map, średnio X/10”), `STAN.md`.

### B3. Gdy mapa znajdzie błąd w lekcji
Mapa ma być zgodna z lekcją. Gdy autor albo recenzent znajdzie błąd w lekcji, **lekcji nie poprawiasz**. Mapa podaje wersję poprawną ze źródłem, a sprawa trafia do `docs/teoria/bledy-w-lekcjach.md` (lekcja, miejsce, co jest źle, źródło, proponowane brzmienie) do decyzji Bartka.

## 6. Recenzent mapy (kopiujesz mu całą sekcję)

### 6.1 Rola
Jesteś surowym recenzentem tekstów do nauki dla studentów 1. roku Business Management (studia po angielsku) na Uniwersytecie Szczecińskim. Oceniasz **Mapę teorii**: tekst, który student czyta przed lekcją, żeby poznać całą teorię tematu. Student, który opuścił wykład, ma z samej mapy zrozumieć temat i odpowiedzieć na pytanie egzaminacyjne. Błąd merytoryczny jest gorszy niż brak mapy.

### 6.2 Co robisz po kolei
1. Sprawdź **co najmniej 8** twierdzeń (definicje, wzory, przepisy, instytucje, liczby, wyniki przykładów); przy prawie, podatkach, polityce pieniężnej i danych **co najmniej 4 w źródłach** z adresem. Uruchom `*.teoria.obliczenia.py`.
2. Porównaj z lekcją (`lekcja.txt`): czy mapa ma wszystko z lekcji (lista pokrycia ze `teoria-sprawdz.py`) i czy nic jej nie przeczy.
3. Porównaj z kartą przedmiotu: czy każdy temat z `sylRef` ma gałąź na poziomie egzaminu.
4. Przeczytaj `*.teoria.txt` jak student: zaznacz każde miejsce, gdzie się gubisz (słowo bez wyjaśnienia, skok w rozumowaniu, gałąź wymagająca późniejszej, za długie zdanie).
5. Oceń według 6.3 i 6.4.

### 6.3 Tabela ocen (razem 10)
| Kryterium | Pkt |
|---|---|
| Poprawność: fakty, definicje, wzory, liczby, aktualność, zgodność z lekcją | 4 |
| Kompletność: cała teoria tematu z lekcji i sylabusa, nic istotnego dla egzaminu nie brakuje | 2 |
| Prowadzenie: kolejność gałęzi od podstaw, każda gałąź używa poprzednich, sensowne połączenia, środek mówi, o co chodzi | 2 |
| Czytelność: krótkie zdania (do ok. 20 słów), słowo fachowe wyjaśnione przy pierwszym użyciu, przykład przy każdej trudnej idei, poprawny angielski | 2 |

### 6.4 Kryteria (każde `true`)
- **T1** `teoria-sprawdz.py` = OK, lista pokrycia bez braków.
- **T2** Każda liczba zgadza się z obliczeniami.
- **T3** Każdy temat z `sylRef` ma gałąź (podaj temat → gałąź).
- **T4** Każda para mylonych pojęć z lekcji ma węzeł „Nie myl”, każdy wzór ma objaśnione litery i przykład.
- **T5** Fakty zmienne w czasie mają „sprawdź aktualne” i źródło, bez kwot zmieniających się co rok.
- **T6** Mapa nie przeczy lekcji (albo rozbieżność jest wpisana do `bledy-w-lekcjach.md` z źródłem).
- **T7** `zrodla` ma co najmniej 1 pozycję z literatury sylabusa albo źródło urzędowe.

**Twarde błędy (maks. 5):** błąd merytoryczny; liczba niezgodna z obliczeniem; brak tematu z `sylRef`; fragment przepisany ze źródła albo ze slajdów; błędy w angielskim albo mieszanie języków poza tabelą słów; stronniczość polityczna; nieobowiązujący przepis podany jako obowiązujący; `teoria-sprawdz.py` nie OK.

### 6.5 Odpowiedź (tylko JSON)
```json
{ "mapy": [ { "plik": "<id>.teoria.json", "wynik": 0, "punkty": {"poprawnosc": 0, "kompletnosc": 0, "prowadzenie": 0, "czytelnosc": 0},
  "twarde_bledy": [], "kryteria": {"T1": true, "T2": true, "T3": true, "T4": true, "T5": true, "T6": true, "T7": true},
  "sprawdzone_fakty": [{"twierdzenie": "…", "zrodlo": "…", "ok": true}], "miejsca_trudne": ["…"],
  "poprawki": ["konkretnie: węzeł, co zmienić, proponowane brzmienie"] } ] }
```
Recenzent bez 8 sprawdzonych faktów albo bez uruchomienia obliczeń: ocena się nie liczy, nowy recenzent.

## 7. Jak pisać mapę (dla autora; zapisz też jako `docs/teoria/zasady-autora.md`)

- **Środek:** jedno zdanie, które student powtórzy na egzaminie, i 1–2 zdania „po co”.
- **Gałęzie = pytania studenta** w kolejności, w jakiej trzeba je zrozumieć („What is it?” → „How is it measured?” → „Why does it happen?” → „Who wins and loses?” → „What can be done?”). Typowe szkielety:
  - `theory`: czym jest → jak mierzymy / jak działa model → przyczyny → skutki → co z tym robimy;
  - `law`: pojęcie i źródło prawa (artykuł) → przesłanki → skutki → wyjątki → jak rozstrzygnąć kazus;
  - `quant`: idea → wzór i litery → przykład krok po kroku → warianty → typowe błędy w liczeniu.
- W gałęzi: najpierw intuicja w `lead` (sytuacja z życia, najlepiej Szczecin, studia, praca), potem `def`/`formula`, potem `ex`, potem `vs`/`err`.
- **Cała teoria, ale bez wody:** wszystko z lekcji i sylabusa, plus rzeczy z literatury sylabusa, których egzamin wymaga, a lekcja pominęła (ze źródłem). Bez ciekawostek spoza tematu.
- Wzór: każda litera w `legend`, potem przykład liczbowy w `steps`. Liczby tylko z obliczeń.
- `link` do innych lekcji tylko tam, gdzie temat naprawdę na nich stoi; „Jak to się łączy”: 3–5 zdań typu „2 → 4: potrzebujesz X, żeby policzyć Y”.
- „Na egzaminie”: 3–5 typów zadań z odesłaniem do gałęzi (z karty przedmiotu i pytań lekcji, bez zgadywania, co da prowadzący).
- Własne słowa: nie przepisujesz kart lekcji (to mapa, nie sklejka) ani źródeł. Krótkie zdania, angielski prosty i poprawny.
- Prawo i liczby zmienne: „sprawdź aktualne” (w mapach BM po angielsku: „Check current figures”) + źródło urzędowe (ISAP, NBP, GUS), bez kwot zmieniających się co rok.
- Format: bez form zależnych od płci w polskich napisach, bez zakazanych słów (`scripts/tresci-zakazane.json`), bez cyrylicy, bez emoji.

## 8. Etap C: paczki
Po każdym przedmiocie: `python3 narz/paczka-teorii.py bm <przedmiot>` (napisz raz) składa `zdawalni-tresci/paczki/teoria-bm26-<przedmiot>.json` w formacie z A1 pkt 8 (`{ "format": "zdawalni-paczka-teorii", "v": 1, "rocznik": "wefiz-bm-1-st-2026", "utworzono": …, "teoria": { "<id tematu>": dokument z "mid" = id } }`), tylko z zatwierdzonych map, po kontroli `teoria-sprawdz.py` i `node scripts/tresci-kontrola.mjs` (zakazane frazy, liczby). **Nie wgrywasz.** Instrukcja dla Bartka w `RANO.md`: scal gałąź `teoria` w `skrot-bm` → poczekaj na wdrożenie (1–2 min) → zdawalni.pl → Więcej → „Edytuję rocznik: Business Management” → Panel AI → „Paczka teorii” → wybierz pliki → „Wgraj”.

## 9. Stan, commity, wznowienie, raport
- `docs/teoria/STAN.md`: etap, pozycja w kolejce, mapy (zatwierdzona / runda R / do poprawy) z ocenami, decyzje, ostatni commit. Aktualizacja po każdej mapie.
- Commity po polsku, autor `git -c user.name="Bartek Kowalczyk" -c user.email="kowalczykbartek74@gmail.com"`. Push tylko gałęzi `teoria` (skrot-bm) i `teoria/bm` (zdawalni-tresci). **Nigdy push na `main`, nigdy `--force`.**
- Nic na produkcję: bez łączenia z Supabase, SQL, wgrywania paczek, wdrażania funkcji. Bez wywołań Anthropic API.
- Przed limitem: dokończ albo porzuć bieżącą rundę (plik zostaje w `scratch/`), `STAN.md`, commit, push.
- **`docs/teoria/RANO.md`**, na górze maks. 15 linii: stan kodu (ocena recenzenta A, gałąź gotowa do scalenia tak/nie, zrzuty `docs/teoria/zrzuty/`), tabela przedmiot → mapy zatwierdzone / wszystkie → średnia ocena → paczka gotowa, 3 mapy do obejrzenia (ścieżki), `bledy-w-lekcjach.md` w skrócie, `do-decyzji.md` z propozycjami domyślnymi („odpowiedz numerami”), instrukcja wgrania z sekcji 8, zdanie do wznowienia.

### Praca równoległa (opcjonalnie)
Czat 1: etap A. Czaty 2–3 po pilocie B1: „Wykonaj ~/zdawalni/teoria/petla.md, tylko etap B, kolejka X” (X1 = OWI, Prawo, Makroekonomia, Podstawy finansów; X2 = Analiza i reszta), każdy we własnym worktree `teoria/bm-X`, własny `STAN-X.md`. Rano jedna sesja scala gałęzie treści i składa paczki.

## 10. Później (nie w tej pętli)
Inne kierunki: ten sam kod, mapy z banku klocków (`bank/teoria/`) kopiowane jak K1, po polsku dla kierunków PL. Mapa przedmiotu (wszystkie tematy na jednej stronie) i wydruk całego przedmiotu przed sesją. Zapisz pomysły w `RANO.md`, nie buduj ich teraz.
