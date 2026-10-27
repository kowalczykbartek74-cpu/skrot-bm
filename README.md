# Skrót BM

Płatna platforma do nauki dla 1. roku Business Management (Uniwersytet Szczeciński): skróty, fiszki, quizy, wersje prostym językiem, zadania i terminy. Strona: **https://skrotbm.pl**

Darmowy plan zajęć i skrzynka do opiekunki roku są w osobnym repozytorium [plan-bm](https://github.com/kowalczykbartek74-cpu/plan-bm) pod adresem https://plan.skrotbm.pl.

## Układ strony
Pięć zakładek, każda odpowiada na jedno pytanie ucznia (plan: „Skrót BM: plan przejrzystości”):
- **Dziś** – karta „Teraz zrób to” z jednym przyciskiem (kolejność: zaliczenie ≤ 7 dni → zadanie ≤ 2 dni → fiszki do powtórki → nowy materiał → ostatnio otwarty), zajęcia, 3 najbliższe terminy, „Nowe od ostatniej wizyty”.
- **Przedmioty** – wyszukiwarka (przedmioty, materiały, pojęcia, terminy; skrót `/`) i siatka przedmiotów. Przedmiot ma zawsze 3 zakładki: **Ucz się · Ćwicz · Zaliczenie**. Materiał to 3 kroki: **Przeczytaj (Normalnie | Prościej) · Fiszki · Quiz**.
- **Powtórki** – ile fiszek dziś, przycisk Zacznij, pod spodem mapa postępów.
- **Terminy** – jedna lista „co i na kiedy” (zadania z Teams, terminy roku, daty zaliczeń) z przełącznikiem Lista | Kalendarz.
  Kolokwia i egzaminy mają pole **part** (`W` / `CW` / `LAB`, w oknie terminu „Część przedmiotu”): po nim „Przygotuj się” wybiera datę właściwej części. Stare wpisy bez pola dopasowuje słowo w tytule („wykład”, „ćwicz”, „lab”), potem data z opisu zaliczenia (`ZAL`). Terminy sprzed dołączenia osoby (`progress.joined`) trafiają do zwiniętej sekcji „Minione”, a nie „po terminie”.
- **Więcej** – Nauka, Studia, Ty oraz przełącznik **Tryb starosty** (widoczny tylko dla starosty; wyłączony = widok studenta z pełnym dostępem).

**Przewodnik** (`#/guide`, wejście: Więcej → „Przewodnik po stronie” i pasek na ekranie Dziś, dopóki ktoś go nie ukończy albo nie zamknie): 9 rozdziałów (`GUIDE` w `index.html`), w każdym karty z ćwiczeniem na przykładowych danych (działa bez dostępu i bez materiałów), na końcu „Pokaż mi to na stronie” podświetla to samo na prawdziwych ekranach (`startTour(kroki, opcje)`), a po wszystkim test z 8 pytań (`GTEST`) z odznaką od 7 punktów. Postęp przewodnika zapisuje się w `progress.guide` (i w `bm-guide` w przeglądarce). Szybki tour po zakładkach (`QUICK`, minuta) startuje tylko osobom z dostępem; po zakupie najpierw ekran „Dostęp aktywny” z trzema krokami (`showWelcome`, znacznik `skrot-welcome`). Grupa i lab to pierwszy krok na ekranie Dziś (bez domyślnego labu A); do tego czasu strona nie pokazuje zajęć ani terminów konkretnych grup. Gdy zmieniasz ekran, sprawdź selektory w `tour` danego rozdziału (atrybuty `data-tour`).

Stare adresy (`#/tasks`, `#/calendar`, `#/progress`) prowadzą do nowych ekranów. Adres w pasku (`#/subject/makroekonomia`) działa z przyciskiem Wstecz.

## Wersja angielska (PL / EN)
Przełącznik **EN/PL** jest w górnym pasku, w Więcej → „Język” i na ekranie kodu dostępu. Wybór zapisuje się w przeglądarce (`skrot-lang`); bez wyboru strona otwiera się po angielsku, gdy przeglądarka nie ma ustawionego polskiego. Link `?lang=en` albo `?lang=pl` też ustawia język.

- `i18n.js` (ładowany w `<head>`) w trybie EN dociąga `i18n-en.js` i tłumaczy wszystko, co pojawia się na ekranie: teksty, `title`, `placeholder`, `aria-label`, okna `confirm`/`alert`. Kod strony zostaje po polsku.
- `i18n-en.js` to słownik `"polski tekst": "English text"`. Teksty z wstawkami mają `{0}`, `{1}` (np. `"Powtórz {0} {1}": "Review {0} {1}"`). Liczebniki (`plural`), dni tygodnia i miesiące przełącza `index.html` (stała `EN`). Nazwy przedmiotów biorą angielską nazwę z planu i sylabusa.
- **Nowy tekst na stronie** bez wpisu w słowniku pokaże się po polsku. Dopisz parę do `"exact"` w `i18n-en.js` (dokładnie ten sam tekst, łącznie z dwukropkiem czy kropką).
- Teksty z CSS (`content: "…"`) mają osobne reguły `html[lang="en"] …`.
- Zostają po polsku: wersja „Prościej · PL” i wyjaśnienia „Dlaczego?” (tak powstają w bazie), polskie odpowiedniki w słowniczku EN–PL, nazwiska, polskie tytuły lektur oraz to, co wpisujesz ręcznie (ogłoszenia, nazwy terminów). Regulamin i polityka prywatności są tylko po polsku.
- Definicje pojęć z sylabusa mają pole `defEn` w `sylabus-pojecia.json`.

## Jak to działa
- `index.html` – cała aplikacja (jedna strona). Plan zajęć pobiera z `https://plan.skrotbm.pl/plan.json`.
- `skrot-supabase.js` – baza, logowanie mailem i zakup dostępu (Supabase + Stripe Payment Link).
- `supabase/` – reguły bazy (uruchamiane w SQL Editor w kolejności: `nauka.sql`, `skrot.sql`, `skrot-platnosci.sql`, `skrot-darmowe.sql`, `skrot-v2.sql`, `skrot-v3.sql`, `skrot-v4-moje.sql`, `skrot-v5.sql`, `skrot-v6.sql`, `skrot-v7-subskrypcja.sql`, `skrot-v8-urzadzenia.sql`) i funkcje serwerowe:
  - `functions/stripe-webhook` – po płatności w Stripe wpisuje roczny dostęp (sekret `STRIPE_WEBHOOK_SECRET`, bez weryfikacji JWT),
  - `functions/kalendarz` – osobisty kalendarz do telefonu (zajęcia + zaliczenia + zadania) pod tajnym linkiem; reguły w `skrot-kalendarz.sql`, wdrażanie z `--no-verify-jwt`,
  - `functions/claude` – AI (sekret `ANTHROPIC_API_KEY`): starosta bez limitu, osoby z pełnym dostępem tylko do „Moich materiałów”, z biletem i limitem plików. Prosty język i „Dlaczego?” materiałów roku powstają z góry.
- Maile logowania: Resend (SMTP) z domeny skrotbm.pl.
- Kalendarz roku (tygodnie parzyste/nieparzyste, dni wolne, przerwy) strona bierze z `https://plan.skrotbm.pl/plan.json` (pole `kalendarz`, edytowane w `kalendarz.json` w repozytorium plan-bm). W `index.html` jest tylko kopia zapasowa.

## Hasło do logowania (opcjonalne)
- Logowanie: zakładka **Kod z maila** (jak dotąd) albo **Hasło**. Strona pamięta ostatnio użytą zakładkę i e-mail.
- Hasło ustawia się po zalogowaniu kodem: Więcej → Hasło do logowania (po pierwszym logowaniu kodem strona raz to proponuje). Min. 8 znaków; zapisuje się w Supabase Auth (`updateUser`), a w `user_metadata.haslo` znacznik, że jest ustawione.
- Gdy w Supabase włączone jest „Secure password change”, strona sama prosi o kod z maila (`reauthenticate`) i dopiero wtedy zapisuje hasło.
- Zapomniane hasło = zaloguj się kodem i ustaw nowe. Konto bez hasła loguje się tylko kodem.
- Dzielenie się hasłem nic nie daje: dalej działa limit 3 urządzeń i jedna aktywna sesja (`skrot-v8-urzadzenia.sql`).
- Supabase → Authentication → Sign In / Providers → Email musi być włączony (jest, bo działa kod); hasło nie wymaga dodatkowych ustawień.

## Jedno konto = jedna osoba (`skrot-v8-urzadzenia.sql`)
- **Do 3 urządzeń** na konto. Każda przeglądarka ma losowe ID (`skrot-device` w localStorage), które `skrot-supabase.js` wysyła w nagłówku `x-skrot-device` przy każdym zapytaniu. Baza daje pełny dostęp (`nauka_platny()`) tylko urządzeniu z listy, więc pilnują tego wszystkie reguły tabel, bez zmian w nich. Urządzenie nieużywane 60 dni wypada z listy samo.
- **Zmiana urządzenia raz na 30 dni** (Więcej → Twoje urządzenia albo ekran „Masz już 3 urządzenia”).
- **Jedna aktywna sesja**: strona wysyła sygnał `nauka_ping` co 45 s, gdy karta jest na wierzchu, i zwalnia sesję, gdy karta się chowa. Drugie urządzenie widzi „Konto jest otwarte na innym urządzeniu” i może kliknąć „Używaj tutaj”; pierwsze traci dostęp od razu (baza) i przy następnym sygnale się przeładowuje. Każde przejęcie zapisuje się w `nauka_urzadzenia_log`.
- **Panel starosty**: Więcej → Tryb starosty → „Konta i urządzenia”. Podejrzane: ≥ 6 przejęć w 7 dni albo ≥ 5 nowych urządzeń w 30 dni. Przyciski: Ostrzeż mailem (otwiera gotowego maila), Zablokuj (z powodem, który widzi osoba), Odblokuj, Wyczyść urządzenia (np. po zgubieniu telefonu). Blokuje zawsze człowiek, nie automat.
- **Znak wodny**: adres konta przy prawej krawędzi ekranu i na wydruku ściągawki.
- Starosta (nauka_admini) jest z tego zwolniony. Limity zmienia się w funkcjach `nauka_urz_limit/wygasa/zmiana/okno` na górze pliku SQL.
- Starosta też ma swoje urządzenia na liście (Więcej → Twoje urządzenia), ale bez limitu i bez blokady 30 dni.
- **Wdrożenie**: strona z nowym `skrot-supabase.js` działa także ze starą bazą (bez SQL zachowuje się jak dotąd). Potem: (1) ponownie wdrożyć funkcję `claude` (przepuszcza nagłówek `x-skrot-device`; do tego czasu AI na stronie nie odpowiada, bo przeglądarka blokuje nieznany nagłówek), (2) uruchomić `skrot-v8-urzadzenia.sql` w SQL Editor.

## Sylabus kierunku (`sylabus.json`)
Wszystkie 84 przedmioty z sylabusa „Business Management, studia stacjonarne I stopnia 2026/27” (program USEFZ-BM-O-I-S-26/27Z): ECTS, godziny, forma zaliczenia, koordynator, tematy zajęć z godzinami, efekty uczenia się, literatura, nakład pracy i oryginalne zasady oceniania. Strona pokazuje to w:
- **przedmiocie** – panel „Sylabus: tematy i wymagania” i „Pełna karta przedmiotu”,
- **Program studiów** (Więcej) – semestry 1–6, obowiązkowe i do wyboru,
- **Zasadach zaliczeń** (Więcej) – szkolenia obowiązkowe (BHP, e-learning, biblioteka, AI),
- **„Przygotuj się”** (dawny tryb przed kolokwium) – lista tematów danej części, efekty uczenia się sprawdzane na tym zaliczeniu (z wynikiem z ostatniego próbnego testu) i nakład nauki z sylabusa przeliczony na dzień,
- **Kalkulator ocen** (Więcej → Zasady zaliczeń) – ocena z przedmiotu według reguły z sylabusa (`CALC_RULES` w `index.html`), średnia semestru zwykła i ważona ECTS; oceny zapisują się w postępie osoby,
- **zajęciach na Starcie i w przedmiocie** – „Zajęcia 3/8, pewnie: …”: szacunek, który temat sylabusa wypada na które zajęcia Twojej grupy (tematy rozłożone według godzin),
- **Lektury** (Więcej) – literatura z semestru z wyszukiwaniem w katalogu Biblioteki Głównej US,
- **Porównanie** przedmiotów do wyboru (Program studiów → „porównaj” przy 2–3 przedmiotach),
- **Słowniczku** – pojęcia z tematów sylabusa z `sylabus-pojecia.json` (definicje własne), także dla przedmiotów bez materiałów,
- **zadaniach i przykładach** (lekcje, „Zadania krok po kroku”) – trudne pojęcia i nowe konteksty są podkreślone, kliknięcie pokazuje okienko „Co to właściwie jest?”. Źródła po kolei: wyjaśnienia dopisane do zadań (`materialContent.explain`, Panel AI → „Wyjaśnienia w zadaniach”), pojęcia materiału, `sylabus-pojecia.json` i słowniczek przedmiotu; jedno pojęcie raz na zadanie, najwyżej 5 podkreśleń,
- **Panelu AI → Mapy przedmiotów z sylabusa BM** – materiał startowy (opracowanie, fiszki, quiz, prosty język) z oficjalnych tematów i efektów; zastępuje starą mapę z sylabusa.

Próbne testy: pytania z „Pytania do testów” dostają kody efektów (`ep`). Materiały, których pytania nie mają jeszcze kodów, Panel AI → „Pytania do testów” zrobi ponownie.

Przedmioty z planu łączą się po polskiej nazwie (slug). Nowy sylabus (np. na kolejny rok):
```
python3 scripts/sylabus-parse.py SYLABUS.pdf      # tworzy syl.json
python3 scripts/sylabus-build.py sylabus.json
```
Wymaga `pip install pdfplumber`.

## Lekcje v3 (krótkie kroki)
- Lekcja z `lesson.v2` otwiera się jako mapa krótkich części (2–5 min) i odtwarzacz kart na pełnym ekranie: jedna myśl na kartę, co 2–3 karty coś do zrobienia, XP, seria, gwiazdki, cel dnia 50 XP. „Pokaż lekcję jako tekst” wraca do starego widoku (`lessonPanel2`).
- Kod: `lessonPanel3`, `lpBuildDeck` i funkcje `lp…` w `index.html` (blok „LEKCJE V3”); wzorzec z opisem zasad: `docs/lekcje-v3/prototyp.html`.
- Karty powstają w przeglądarce z obecnych danych lekcji v2 przy każdym otwarciu. Baza się nie zmienia: stan odtwarzacza jest w localStorage, a XP, gwiazdki (`lp`) i opanowanie w dokumencie postępu osoby.
- Poziomy: liczone z całego XP (`progress.xp.t`), próg poziomu n = 50·n·(n−1) XP (0, 100, 300, 600…), nazwy w `LP_LEVELS`. Pasek poziomu jest na mapie lekcji, na końcu każdej części i w Więcej → Ty.
- „Mniej animacji” (Więcej → Ty, `skrot-calm`) i `prefers-reduced-motion` wyłączają ruch i konfetti na całej stronie.

## Wygląd: styl lekcji na całej stronie
Cała strona używa języka wizualnego lekcji v3: jedna rzecz na ekranie, duże karty, jeden wyraźny przycisk, natychmiastowa informacja zwrotna i postęp widoczny na każdym kroku (specyfikacja: „Przemiana: cała strona w stylu lekcji v3”, etapy 0–6).

**Komponenty `sk-*`** (CSS w `index.html`). Reguły z bloku „LEKCJE V3” mają obok selektorów `lp-*` selektory `sk-*`, więc lekcje i reszta strony korzystają z tych samych reguł. Nowe rzeczy są w bloku „WSPÓLNE KOMPONENTY sk-*” i w blokach etapów pod nim.
- `sk-hero` (+ `.warn` bursztynowy, `.bad` czerwony, `.calm` spokojny): karta startowa ekranu. `sk-bignum` to duża liczba w hero.
- `sk-goal` / `sk-ring` (kółko postępu, `skGoal()`, `skRing(p)`), `sk-start` (duży przycisk w hero), `sk-cta` (główny przycisk ekranu: 54 px na telefonie, 48 px na komputerze).
- `sk-path`, `sk-node` (`.done` ✓, `.now` pulsuje, `.opt` przerywana), `sk-dot`: ścieżki (dzień na ekranie Dziś, mapa przedmiotu, plan przed kolokwium, przewodnik).
- `sk-card` (`.wide` = na całą szerokość), `sk-kick`, `sk-text`, `sk-chip` (`.warn`, `.bad`), `sk-fb` (`.ok`, `.no`), `sk-stats`/`sk-stat`, `sk-done`, `sk-level`/`sk-lvbar`, `sk-sheet` (panel od dołu), `sk-steps`, `sk-flow`, `sk-formula`, `sk-tip`.
- `sk-row-big`: duży wiersz listy (min. 56 px, ikona w kółku 40 px, tytuł, opis, coś na końcu). `sk-seg`: segmenty 44 px.
- Ruch: `sk-fresh` (wejście ekranu), `sk-stag > *` z `--i` (kolejne elementy co 90 ms). **Mniej animacji** (`html.calm`) i `prefers-reduced-motion` są w jednym miejscu na końcu `<style>` i obejmują całą stronę, także nowe animacje.
- Stany kropek `.now`/`.opt` mają te same nazwy co karta „Teraz zrób to” i odpowiedź w quizie; reguła na początku bloku etapu 2 zeruje to, co te klasy dokładają.
- `<main>` ma `data-view` z nazwą widoku (CSS ekranów do czytania).

**Odtwarzacz dla dowolnej talii.** `playerOpen(src, bi)` przyjmuje źródło: `{ kind, id, title, label, closeLabel, stateKey, build() → { sig, bites, simple }, xp, pool, retry, feedback, onCard, onFinish(st), done(st) → ekran końcowy, onX, decorTop, closeTo }`. Lekcja to jedno ze źródeł (`lpLessonSource`, `lpOpen` zostaje), klucz stanu lekcji bez zmian (`bm-lp:<id>`). Pozostałe źródła mają stan w `bm-pl:<kind>:…` i po ukończeniu zaczynają od nowa.

| Źródło | Gdzie | Karty |
|---|---|---|
| `quiz` | zakładka Quiz w materiale, quiz z całego przedmiotu | `mc` (druga szansa, „Dlaczego?” w „🤔 Nie łapię” po odpowiedzi) |
| `flash` | zakładka Fiszki w materiale | `swipe` („Wiem” nie przyspiesza karty z terminem w przyszłości) |
| `review` | Powtórki | `grade4` (4 oceny, spacja, 1–4, gest w lewo/prawo) |
| `exam` | próbny test przed kolokwium | `examAbcd`, `examOpen`, `examCase`; zegar, siatka pytań, ⚑; odpowiedzi w `bm-exam-run` |
| `glossary` | Słowniczek → „Ćwicz słówka” | `match` (4 pary, 3 rundy) |
| `guide` | Przewodnik → „Sprawdź się” | `mc`, odznaka od 7 punktów |

Stare widoki zostają pod „Pokaż jako listę” / „Klasyczny widok”. Treść pytań, fiszek i pojęć ma `translate="no"` (słownik EN nie zmienia treści materiałów).

**XP i limity.** Jedyne miejsce zapisu `progress.xp` i `progress.streak` to `xpFlush(n)` (`lpFlushXp` zostaje jako alias odtwarzacza). Limity liczy przeglądarka w `bm-xpcap:<dzień>`, bez nowych pól w bazie:

| Źródło | XP | Limit |
|---|---|---|
| lekcja | `LP_XP` (bez zmian) | — |
| quiz | 10 za dobrą odpowiedź z 1. próby, 5 z drugiej szansy, +10 za ukończenie | ten sam quiz raz dziennie |
| fiszki | 2 za „Wiem” | razem z Powtórkami 40 dziennie |
| Powtórki | 2 za „Pamiętam”/„Łatwe”, 1 za „Trudne”, +10 za wszystkie na dziś | wspólny z fiszkami |
| próbny test | po ocenie: wynik % × 0,5 (max 50) | raz dziennie na przedmiot i część |
| słówka | 10 za rundę bez błędu, 5 z błędami | 20 dziennie |

Combo (🔥 x5/x10, +5 XP) działa wszędzie poza próbnym testem.

**Testy wyglądu (lokalnie).** Bramka sprawdza `localStorage["skrot-gate"]` (hash `H` z `<head>`). Przy przemianie każdy etap był sprawdzany w Playwright na atrapie `skrot-supabase.js` (dane w pamięci, nic nie idzie do bazy): zrzut `getComputedStyle` przed/po, brak poziomego przewijania na 375/360/1280 px, EN bez polskich napisów, zero błędów konsoli i test regresji lekcji (ta sama trasa kart, XP, gwiazdki i wznowienie co przed zmianą).

## Jak powstają materiały z prezentacji (system v2)
Slajdy prowadzących służą tylko jako mapa tematów. Po wgraniu pliku:
1. **Mapa tematów** – AI czyta slajdy i zwraca wyłącznie listę tematów z numerami slajdów (bez streszczania).
2. **Opracowanie** – osobne zapytanie do AI, które nie dostaje tekstu slajdów, tylko nazwy tematów i pojęć: o co chodzi, po co to jest, co zapamiętać, własny przykład.
3. **Fiszki i quiz** – z naszego opracowania, nie ze slajdów.
4. **Kontrola** – porównanie gotowego tekstu z tekstem slajdów (wspólne ciągi 7 słów). Powyżej 5% AI pisze jeszcze raz, a jeśli dalej za dużo, starosta widzi wspólne fragmenty i decyduje.

Tekst slajdów nie jest zapisywany. Przy każdym temacie, fiszce i pytaniu zostaje tylko odsyłacz „📍 slajdy 12–15”.
Stare materiały (zrobione bezpośrednio ze slajdów) przerabia **Panel AI → Przerób materiały ze slajdów**; po przerobieniu ich tekst slajdów jest kasowany z bazy. `skrot-v2.sql` zamyka studentom odczyt tekstu slajdów (zostają tylko sekcje sylabusa).

## Prosty język i „Dlaczego?”
Każdy materiał ma dwie dodatkowe wersje zapisane w bazie: `materialSimple` (prosty język) i `quizWhy` (wyjaśnienia do quizu).
Powstają przy wgrywaniu materiału, a brakujące uzupełnia starosta w **Panelu AI** (menu po zalogowaniu jako starosta):
- **Uzupełnij brakujące** – przez funkcję `claude` na serwerze,
- **Pobierz paczkę / Wgraj gotowe wyjaśnienia** – bez serwera: paczkę JSON wrzucasz do czatu z Claude, a plik wynikowy wgrywasz z powrotem.

## Kalendarz w telefonie (jednorazowo)
1. Supabase → SQL Editor: wklej `supabase/skrot-kalendarz.sql` → Run.
2. W terminalu, w folderze tego repozytorium:
```
npx supabase login
npx supabase link --project-ref zkyxujkdrovfzpasocmv
npx supabase functions deploy kalendarz --no-verify-jwt
```
Potem w aplikacji: Terminy → „Do kalendarza w telefonie”. Każda osoba z dostępem dostaje swój link; grupę bierze z „Twoja grupa”. Po wygaśnięciu dostępu w kalendarzu zostają same zajęcia.

## Funkcja AI (jednorazowo)
W terminalu, w folderze tego repozytorium:
```
npx supabase login
npx supabase link --project-ref zkyxujkdrovfzpasocmv
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
npx supabase functions deploy claude
```
Sprawdzenie: Panel AI → „Uzupełnij brakujące”. Jeśli funkcja nie odpowiada, panel to napisze.

## Nauka+ (v3): powtórki, słowniczek, mapa postępów, zadania, tryb przed kolokwium, ściągawki
Jednorazowo: Supabase → SQL Editor → wklej `supabase/skrot-v3.sql` → Run (nowe kolekcje `exams`, `examBank`, `glossary`). Bez tego wszystko działa, tylko słowniczek składa się w przeglądarce, a testy używają szablonów domyślnych i pytań z quizów i fiszek.

- **Powtórki** – każda przejrzana fiszka wraca po 1, 3, 7, 14, 30 i 60 dniach (pudełka Leitnera), maks. 20 nowych kart dziennie; przed zaliczeniem z przedmiotu karta wraca przynajmniej raz. Zakładka Powtórki (spacja odwraca, klawisze 1–4 oceniają).
- **Słowniczek EN–PL** – z pól `concepts` wszystkich materiałów; skrót `/`. Panel AI → „Odśwież słowniczek” zapisuje go w kolekcji `glossary`; odświeża się też sam po wgraniu i przerobieniu materiału.
- **Mapa postępów** – wynik tematu: quiz 40%, fiszki 30%, zadania 15%, próbny test 15%; na Starcie podpowiedź „powtórz to przed piątkiem” przed najbliższym zaliczeniem (14 dni).
- **Zadania krok po kroku** – pole `worked` w `materialContent`, zakładka „Zadania”. Panel AI → „Zadania krok po kroku” (funkcją AI albo paczką JSON); wyniki liczbowe sprawdza wbudowany kalkulator, zadania ze złym kluczem odpadają.
- **Tryb przed kolokwium** – przycisk w przedmiocie, przy formie zaliczenia i przy terminie. Plan na dni do zaliczenia, zakres, kluczowe tematy (starosta oznacza ★ w materiale) i próbny test z timerem: pytania z `examBank` (Panel AI → „Pytania do testów”), a gdy ich brak, z quizów, fiszek i zadań. Szablon testu (czas, próg, sekcje) w Panelu AI; domyślny wynika z formy zaliczenia w sylabusie. Pytania otwarte student ocenia sam według rubryki.
- **Ściągawki** – jedna strona A4 na materiał albo przedmiot, drukowanie przez przeglądarkę („Zapisz jako PDF”), w stopce e-mail kupującego.

## Moje materiały (v4): własne pliki studentów
Każda osoba z pełnym dostępem wgrywa własny plik (PPTX, PDF, DOCX, TXT): Więcej → „Moje materiały” (albo ostatni kafelek na Przedmiotach) → „Wgraj swój materiał”. Plik przechodzi **ten sam proces co materiały roku** (mapa tematów → opracowanie bez tekstu pliku → fiszki i quiz → kontrola podobieństwa → prosty język i „Dlaczego?”), a wynik trafia do sekcji wybranej przez tę osobę. Domyślna sekcja to „Materiały”; można tworzyć nowe, zmieniać nazwy, przenosić materiały i usuwać sekcje.

- Materiały są prywatne: kolekcje `myMaterials` i `myContent`, widzi je i zmienia tylko właściciel. Tekst pliku nie jest zapisywany. Sekcje są w postępie nauki tej osoby (`myFolders`).
- Koszt AI pilnuje baza: przed każdym plikiem strona pobiera bilet (`nauka_moje_start`), jeden bilet = jeden plik = do 10 zapytań do AI w ciągu 2 godzin. Limit: **5 plików dziennie i 40 w miesiącu na osobę** (liczby w `nauka_moje_stan` i `nauka_moje_start` w `skrot-v4-moje.sql`). Starosta nie ma limitu.

Włączenie (jednorazowo):
1. Supabase → SQL Editor: wklej `supabase/skrot-v4-moje.sql` → Run.
2. W terminalu, w folderze tego repozytorium: `npx supabase functions deploy claude`

Dopóki tego nie zrobisz, strona pokazuje studentom „nie jest jeszcze włączone na serwerze” zamiast błędu.
