# Skrót BM

Płatna platforma do nauki dla 1. roku Business Management (Uniwersytet Szczeciński): skróty, fiszki, quizy, wersje prostym językiem, zadania i terminy. Strona: **https://skrotbm.pl**

Darmowy plan zajęć i skrzynka do opiekunki roku są w osobnym repozytorium [plan-bm](https://github.com/kowalczykbartek74-cpu/plan-bm) pod adresem https://plan.skrotbm.pl.

## Układ strony
Pięć zakładek, każda odpowiada na jedno pytanie ucznia (plan: „Skrót BM: plan przejrzystości”):
- **Postęp do nauki** to jedna miara: „tematy do zaliczeń, które umiesz” (np. 3/14), liczona z zakresu najbliższego zaliczenia (`knowOf` w `index.html`). Temat umiesz po zdanym bilecie wyjścia lekcji albo gdy w mapie postępów jest „umiesz”. Karta „Twój postęp” na Dziś pokazuje tylko to (plus poziom, serię i cel dnia do zabawy); punkty kursu są w przedmiocie i w lekcji.
- **Dziś** – krótki ekran: karta „Teraz zrób to” z jednym przyciskiem (kolejność: zaliczenie ≤ 7 dni → zadanie ≤ 2 dni → fiszki do powtórki → nowy materiał → ostatnio otwarty), zajęcia dziś lub jutro i najbliższy termin. „Twój postęp” i „Nowe od ostatniej wizyty” są zwinięte (`homeFold`, stan otwarcia w `bm-fold:*`).
- **Przedmioty** – wyszukiwarka (przedmioty, materiały, pojęcia, terminy; skrót `/`) i siatka przedmiotów. Przedmiot ma zawsze 3 zakładki: **Ucz się · Ćwicz · Zaliczenie**. Materiał to 3 kroki: **Przeczytaj (Normalnie | Prościej) · Fiszki · Quiz**.
- **Powtórki** – ile fiszek dziś, przycisk Zacznij, pod spodem mapa postępów.
- **Terminy** – jedna lista „co i na kiedy” (zadania z Teams, terminy roku, daty zaliczeń) jako oś czasu: karta „Najbliższe”, chipsy rodzaju (zapamiętane w `skrot-termcat`), sekcje Po terminie / Ten tydzień / Następny tydzień / miesiące / Bez daty (dalsze niż 2 miesiące zwinięte), szczegóły w wysuwanym okienku, odhaczanie z „Cofnij”. Rzadsze akcje (kalendarz w telefonie, widok kalendarza, Zrobione) są w menu ⋯. Na komputerze (≥ 1024 px) dwie kolumny z mini-kalendarzem miesiąca. Logika bez DOM w `terminy.js` (strefa Europe/Warsaw, tydzień od poniedziałku, filtr grupy i labu, scalanie tego samego terminu wpisanego dla kilku grup w jedną kartę z tagami); testy: `node --test tests/*.test.js`. Starosta ma przełącznik Moja grupa | Cały rok (`skrot-termscope`). Zrzuty przed/po: `docs/terminy/`.
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
- **Teksty wpisane ręcznie** (tytuły i opisy terminów, zadania z Teams, ogłoszenia) tłumaczy AI w przeglądarce starosty (`enSync` w `index.html`, kilka sekund po wczytaniu strony i po każdej zmianie) i zapisuje w `meta/en` jako `{ t: { "polski tekst": "English text" } }`. W trybie EN strona podaje je do `SKROT_I18N.user()`. Gdy tekst jest tylko częścią napisu („Ogłoszenie: …”, „… · za 3 dni”), `i18n.js` podmienia go w całości, a resztę tłumaczy słownikiem, więc nie tnie go już na pojedyncze słowa. Nowy termin dostaje tłumaczenie, gdy starosta następnym razem otworzy stronę. Bez SQL: `meta` czytają osoby z dostępem, zapisuje starosta.

## Jak to działa
- `index.html` – cała aplikacja (jedna strona). Plan zajęć pobiera z `https://plan.skrotbm.pl/plan.json`.
- `skrot-supabase.js` – baza, logowanie mailem i zakup dostępu (Supabase + Stripe Payment Link).
- `supabase/` – reguły bazy (uruchamiane w SQL Editor w kolejności: `nauka.sql`, `skrot.sql`, `skrot-platnosci.sql`, `skrot-darmowe.sql`, `skrot-v2.sql`, `skrot-v3.sql`, `skrot-v4-moje.sql`, `skrot-v5.sql`, `skrot-v6.sql`, `skrot-v7-subskrypcja.sql`, `skrot-v8-urzadzenia.sql`, `skrot-v9-limit-moje.sql`, `skrot-v10-zgody.sql`, `skrot-v11-aktywnosc.sql`, `skrot-v12-zabezpieczenia.sql`, `skrot-v13-gry.sql`) i funkcje serwerowe:
  - `functions/stripe-webhook` – po płatności w Stripe (konto live „skrotbm”, endpoint „skrotbm-supabase”) wpisuje dostęp (sekret `STRIPE_WEBHOOK_SECRET`, bez weryfikacji JWT),
  - `functions/kalendarz` – osobisty kalendarz do telefonu (zajęcia + zaliczenia + zadania) pod tajnym linkiem; reguły w `skrot-kalendarz.sql`, wdrażanie z `--no-verify-jwt`,
  - `functions/claude` – AI (sekret `ANTHROPIC_API_KEY`): starosta bez limitu, osoby z pełnym dostępem tylko do „Moich materiałów”, z biletem i limitem plików. Prosty język i „Dlaczego?” materiałów roku powstają z góry.
- Maile logowania: Resend (SMTP) z domeny skrotbm.pl.
- Kalendarz roku (tygodnie parzyste/nieparzyste, dni wolne, przerwy) strona bierze z `https://plan.skrotbm.pl/plan.json` (pole `kalendarz`, edytowane w `kalendarz.json` w repozytorium plan-bm). W `index.html` jest tylko kopia zapasowa.

## Ekran logowania
Bez zalogowania strona pokazuje tylko osobny ekran logowania (`#login` w `index.html`). Na komputerze (od 900 px) po lewej jest zielony panel z hasłem strony i trzema korzyściami, po prawej formularz; na telefonie tylko logo i formularz. Kod z maila albo hasło, regulamin, prywatność, kontakt i przełącznik EN/PL. Aplikacja pojawia się dopiero po zalogowaniu.
- Skrypt w `<head>` sprawdza, czy w przeglądarce jest sesja Supabase (`sb-zkyxujkdrovfzpasocmv-auth-token`); jeśli nie, od razu dodaje klasę `needlogin`, więc aplikacja nie miga.
- `skrot-supabase.js` (`showLoginPage`) wypełnia ekran tym samym logowaniem co okno (`openLogin` z `page: true`). Komunikaty po płatności, po nieważnym linku i pole na kod po przeładowaniu działają jak wcześniej, tylko na tym ekranie.
- Strona jest otwarta (bez kodu dostępu przed startem, bez `noindex`), od 27.10.2026. Pierwszy ekran to logowanie.
- Przed płatnością okno „Zanim zapłacisz”: akceptacja regulaminu i zgoda na natychmiastowe dostarczenie Treści (utrata prawa odstąpienia, regulamin § 5). Bez obu ptaszków nie da się przejść do Stripe. Zgoda trafia do tabeli `nauka_zgody` przez `nauka_zgoda()` (`supabase/skrot-v10-zgody.sql`, uruchom raz w SQL Editor); gdy zapis się nie uda, zakup idzie dalej, a ślad zostaje w `localStorage["skrot-zgoda"]`. Treść zgody i `CONSENT_V` w `skrot-supabase.js` zmieniaj razem z regulaminem.
- Gdy baza jest nieosiągalna, strona pokazuje aplikację (stan offline), żeby nikt nie utknął.

## Hasło do logowania (opcjonalne)
- Logowanie: zakładka **Kod z maila** (jak dotąd) albo **Hasło**. Strona pamięta ostatnio użytą zakładkę i e-mail.
- Hasło ustawia się po zalogowaniu kodem: Więcej → Hasło do logowania (po pierwszym logowaniu kodem strona raz to proponuje). Min. 8 znaków; zapisuje się w Supabase Auth (`updateUser`), a w `user_metadata.haslo` znacznik, że jest ustawione.
- Gdy w Supabase włączone jest „Secure password change”, strona sama prosi o kod z maila (`reauthenticate`) i dopiero wtedy zapisuje hasło.
- Zapomniane hasło = zaloguj się kodem i ustaw nowe. Konto bez hasła loguje się tylko kodem.
- Dzielenie się hasłem nic nie daje: dalej działa limit 3 urządzeń i jedna aktywna sesja (`skrot-v8-urzadzenia.sql`).
- Supabase → Authentication → Sign In / Providers → Email musi być włączony (jest, bo działa kod); hasło nie wymaga dodatkowych ustawień.

## Gry i ranking (v13, `skrot-v13-gry.sql`)
- Pełny opis i etapy: `docs/gry/SPEC.md`. Punkty rankingu (🏆) to osobna liczba od XP (⚡): XP liczy przeglądarka, punkty rankingu **wyłącznie baza**. Przeglądarka nie ma prawa czytać ani pisać tabel `nauka_profil`, `nauka_rp`, `nauka_odp`, `nauka_gry`; wszystko idzie przez funkcje RPC.
- Za co są punkty: dobra odpowiedź w quizie albo grze +10, zadanie liczbowe +20, oceniona fiszka w Powtórkach +1 (max 20 dziennie), zdana lekcja +30 (raz), seria dni +5. To samo pytanie liczy się raz dziennie i tylko za pierwszą odpowiedź tego dnia. Dzienne limity: gry 150, quizy 300, lekcje 150. Liczby zmienia się w jednym miejscu: `nauka_rp_cfg()` w SQL.
- Odpowiedź sprawdza baza na podstawie `materialContent` (materiały roku). „Moje materiały” nie dają punktów rankingu.
- Kod w przeglądarce: `window.skrot.rp` w `skrot-supabase.js` (jedyne miejsce, które woła te RPC). `index.html` wysyła punkty w tle funkcją `rpSend` z czterech miejsc: quiz (`quizSource` → `onCard`, pierwsza odpowiedź na pytanie, indeks w oryginalnej kolejności opcji), zadanie krok po kroku (`simBox` → `check`), Powtórki (ocena karty w odtwarzaczu `grade4` i stary widok `rvGrade`), lekcja ze zdanym biletem (`lpFinishLesson`). Bez pełnego dostępu nic nie jest wysyłane. Gdy SQL v13 nie jest uruchomiony, wywołania zwracają `not_enabled` i strona działa jak dotąd.
- XP z gier ma własną dzienną pulę `games: 30` w `XP_CAP`.
- Testy bazy: `supabase/test/stub.sql` (atrapa Supabase) + `supabase/test/v13.sql` (przypadki B1–B20). Bez Postgresa: `node supabase/test/pglite.mjs` (PGlite).
- **Wdrożenie**: Supabase → SQL Editor → wklej `supabase/skrot-v13-gry.sql` → Run (po v12; plik można uruchomić ponownie). Strona działa też bez niego.
- **Gry (etap 1: Fruń i Druga szansa)**: kod gier w `gry.js`, ładowany dopiero przy pierwszym wejściu w grę (`loadGry` / `grajOpen` w `index.html`). `gry.js` nie widzi zmiennych strony; wszystko dostaje w `GRY_API` (pytania do rundy `gryQuestions`, zadania `gryTasks`, fiszki po błędzie `gryOnWrong`, XP z puli `games`). Liczby gier (fizyka Fruń, czasy pytań) są w `GRY_CFG` na górze `gry.js`; prędkości i odstępów Fruń nie zmieniaj bez zmiany granicy w `nauka_gra_koniec` (SQL).
- Ekran **Graj** (`#/gry`, `viewGames`): wybór przedmiotu (domyślnie ten z najbliższym zaliczeniem; < 20 pytań = wyszarzony), kafelki Fruń / Pary / Przejdź (dwie ostatnie „wkrótce”). Wejścia: Powtórki („Powtarzaj grając”), Dziś (raz dziennie „Masz 3 minuty?”), Przedmiot → Ćwicz, Więcej → Nauka.
- Fruń: każda porażka otwiera Drugą szansę (1. ABCD 20 s, 2. zadanie liczbowe 60 s albo trudniejsze ABCD), dobra odpowiedź = grasz dalej. Przeglądarka sprawdza odpowiedź sama i od razu wskrzesza; baza w tle dolicza punkty rankingu. Zła odpowiedź: fiszki materiału (max 5) do Powtórek, pytanie na listę `bm-gry-zle` (wraca w kolejnych rundach). Rekord lokalny: `bm-gry-rekord:frun`.
- **Ranking kierunku (etap 2)**: widok `#/ranking` (`viewRanking`), wejścia: Więcej → Nauka „Ranking kierunku” i Więcej → Ty „Ranking: pseudonim i widoczność” (okno `openRankSettings`), linia z miejscem na Dziś (ranking pobierany raz na sesję, 3 s po pokazaniu Dziś), rekordy tygodnia na ekranie Graj. Dane w `S.rank`; jedno zapytanie na zmianę filtra, ten sam filtr najwyżej raz na 30 s. Pierwsze wejście pyta o pseudonim (zgoda zaznaczona, „Nie teraz” = ukryty; pyta znowu dopiero po „Pokaż mnie w rankingu”). „+N od zeszłego tygodnia” liczy przeglądarka (`bm-rank-tydz:<poniedziałek>`). Starosta: Tryb starosty → „Gry i ranking” (podejrzane rundy, usuwanie pseudonimów).
- **Pary (etap 3)**: memory w DOM (nie canvas) w `gry.js` (`PARY`), pojęcia ze słowniczka (`gryPairs` / `gryPairList`: EN–PL albo definicje, najpierw pojęcia czekające dziś w Powtórkach). Start: okno trybu i planszy (`openParyStart`, wybór w `bm-gry-pary`), wejścia z ekranu Graj, Powtórek i Słowniczka („Pary ze słowniczka”, od 6 pojęć). Plansze 6 / 8 / 10 par (na telefonie węższe), strzałki i Enter na kartach, etykiety dla czytnika ekranu. Pomylone pojęcia idą do Powtórek, od 4 pomylonych przycisk „Ćwicz pomylone słówka”. Rekord lokalny: `bm-gry-rekord:pary:<przedmiot>:<plansza>` (najmniej pomyłek, przy remisie krótszy czas).
- **Przejdź (etap 4)**: gra na canvasie w `gry.js` (`PRZEJDZ`): student z plecakiem idzie w górę przez trawnik, ulicę, tory (tramwaj co 4–7 s, czerwone światło 1,2 s wcześniej) i Odrę (kłody). Wynik = najdalszy rząd. Ruch: tap / swipe (≥ 24 px) na telefonie, strzałki i WASD na komputerze; skok co najmniej co 200 ms (= max 5 rzędów/s, granica w `nauka_gra_koniec` – nie zmieniaj jednego bez drugiego). Od rzędu 10 ekran sam jedzie. Co 25 rzędów bramka z pytaniem ABCD bez śmierci (punkty jak w grze). Generator rzędów jest czystą funkcją seeda z bazy: `node docs/gry/test/przejdz-generator.mjs` sprawdza 200 seedów (droga przez trawę zawsze istnieje). Śmierć i Druga szansa jak we Fruń; wskrzeszenie na najbliższej trawie, pojazdy stoją 2 s, potem 2 s nietykalności. Tekst śmierci („Wpadłeś do Odry”, „Zderzenie z półką”…) widać w karcie pytania i na ekranie wyniku.
- **Szlif (etap 5)**: **demo Fruń** na ekranie logowania („Zagraj w demo (1 min) →”): ładuje `gry.js` i `gry-demo.js` (6 własnych pytań PL/EN i minimalny zestaw zamiast `GRY_API`), nie woła bazy i niczego nie zapisuje; wynik zaprasza do logowania. **Odznaki** (Pierwszy lot, Ponad półkami, Druga szansa, Bez pomyłki, Na drugi brzeg, Dziesiątka) zapisują się raz w `progress.odznaki` (`gryBadge`, `gryAfterRound`), widać je w Więcej → Twój postęp. **Przejdź** jest w osobnym pliku `gry-przejdz.js`, ładowanym przy pierwszym wejściu w tę grę (`gry.js` ≤ 60 kB, szybszy start Fruń i Par); wersja `?v=` ta sama co `gry.js`. Przy zmianie skryptów gier podbij `?v=` w `index.html` (`loadGry` i skrypt demo na ekranie logowania).
- Testy w przeglądarce: `docs/gry/test/etap0.mjs`, `etap1.mjs`, `etap2.mjs`, `etap3.mjs`, `etap4.mjs`, `etap5.mjs` (Playwright na atrapie Supabase, opis w `docs/gry/test/README.md`).

## Gry 2 (v15, `skrot-v15-gry2.sql`)
- Pełny opis i etapy 6–9: `docs/gry/SPEC-2.md`. Trzy nowe rzeczy: **Hasło dnia** (`haslo`, jedno pojęcie EN dziennie dla całego roku, 6 prób, litery sprawdza baza), **Drabina** (`drabina`, 12 pytań od najłatwiejszego wg skuteczności rocznika, koło „Zapytaj rok”), **Boss przed kolokwium** (`boss`, 7 dni przed ogłoszonym kolokwium/egzaminem; każda dobra odpowiedź z przedmiotu to cios). Etap 6 = tylko baza i API; ekrany gier przychodzą w etapach 7–9.
- Co zmienia w v13: `nauka_odp.wybor` (która odpowiedź, indeks w **oryginalnej** kolejności opcji), `nauka_rp_odpowiedz` zapisuje `wybor`, `nauka_gra_start` / `nauka_gra_koniec` znają grę `drabina` (szczebli ≤ dobrych odpowiedzi tej rundy w bazie, min. 2 s na pytanie), nowe źródła punktów `haslo` i `boss` z własnymi pulami. Liczby nowych gier są w jednym miejscu: `nauka_gry2_cfg()`.
- Nowe tabele (przeglądarka nie ma do nich dostępu): `nauka_haslo_dni` (słowo dnia, wybierane raz z `concepts[]` materiałów roku: jedno słowo z liter A–Z, 5–9 znaków, nieużyte w ostatnim roku), `nauka_haslo` (próby osoby), `nauka_boss` (bossy z kolekcji `deadlines`, tylko terminy bez `approx`; życie = max(150, 12 × aktywni z 14 dni) ustalane przy utworzeniu). Ciosy liczy `nauka_boss_ciosy` z `nauka_odp` (pytanie raz na osobę dziennie, zadanie = 3, max 40 dziennie na osobę).
- Kod w przeglądarce: nowe funkcje w `window.skrot.rp` (`skrot-supabase.js`): `trudnosc(klucze)`, `rok(mid, idx)`, `haslo()`, `hasloProba(slowo)`, `bossy()`, `bossOdbierz(id)`, `bossAdmin(id, { hp, ukryty })`. Kształty odpowiedzi: SPEC-2, sekcja 3. Bez v15 w bazie każda zwraca `not_enabled` (gry pokażą chip „wkrótce”), a reszta strony działa jak dotąd.
- Testy bazy: `supabase/test/v15.sql` (H1–H8, D1–D6, B1–B9), uruchamiany po `test/v13.sql`: `node supabase/test/pglite.mjs` (v13 dwa razy, v15 dwa razy, potem oba pliki testów; na końcu „✓ test/v13.sql” i „✓ test/v15.sql”). Atrapa do Playwrighta (`docs/gry/test/atrapa-supabase.js`) ma funkcje v15 i przełączniki `mock-v15`, `mock-boss`, `mock-rok`, `mock-haslo-*` (opis na górze pliku).
- **Hasło dnia (etap 7)**: widok `#/haslo` w `index.html` (blok „HASŁO DNIA”: `viewHaslo`, `hdLoad`, `hdSubmit`, `hdEnd`, `hdShare`; CSS `.hd-*`), bez `gry.js`. Plansza 6 × długość słowa (`role="grid"`, `translate="no"`), klawiatura ekranowa QWERTY i fizyczna (litery, Enter, Backspace), kolory liter tylko z `wzor` z bazy (2 = `--accent` + ciągła gruba obwódka, 1 = `--lime-400` + przerywana, 0 = `--sunk`), obrót kafelków co 250 ms (bez niego przy „Mniej animacji”), po próbie `#hd-live` czyta cały wiersz. Wpisywany wiersz przeżywa odświeżenie (`sessionStorage["bm-haslo-wpis"]`), zapisane próby zawsze z `rp.haslo()`; przed próbą porównanie dnia z datą w Polsce (nowe hasło → nowa plansza). Brak sieci: komunikat, wiersz zostaje. Po końcu: słowo, PL, definicja, „Z materiału”, „Dodaj do Powtórek” (pełny dostęp), seria, rozkład wyników roku, licznik do północy, „Udostępnij wynik” (tekst bez słowa z 🟩🟨⬜: `navigator.share` na telefonie, schowek na komputerze). Konto bez dostępu gra normalnie (0 pkt) i widzi „Z pełnym dostępem to byłoby +N pkt rankingu”. Wejścia: karta na Dziś (`hdHomeCard`, `rp.haslo()` raz na sesję, po 2 s; po końcu mała linia z wynikiem), kafelek na Graj (`hdTile`, także bez dostępu), wiersz w Więcej → Nauka (`hdMoreRow`). `not_enabled` (brak v15) → wejść nie ma; `no_words` → wejść nie ma, starosta widzi „Hasło dnia czeka na pojęcia w materiałach”. Teksty EN w `i18n-en.js` (blok „etap 7”); test: `node docs/gry/test/etap7.mjs` (zrzuty `e7-*`), `en-tabele.mjs` sprawdza też tabelę 5.6 z SPEC-2.
- **Wdrożenie**: Supabase → SQL Editor → wklej `supabase/skrot-v15-gry2.sql` → Run (po v13, a jeśli jest – po v14; plik można uruchomić ponownie). Strona działa też bez niego.

## Aktywność dla starosty (`skrot-v11-aktywnosc.sql`)
- Więcej → Tryb starosty → **Aktywność**: kto jest teraz na stronie (sygnał z karty w ostatnich 2 min), historia logowań (kod / hasło / link, urządzenie, godzina), wizyty (początek i długość; nowa wizyta po 30 min przerwy) i wszystkie konta z datą ostatniego logowania z Supabase Auth i ostatnią obecnością. Panel odświeża się co 30 s, ma wyszukiwarkę po e-mailu.
- Każda zalogowana karta na wierzchu woła `nauka_obecny()` co 45 s; po udanym logowaniu strona raz woła `nauka_zalogowano()`. Historia trzymana 12 miesięcy (sprzątają ją same funkcje), opisana w polityce prywatności.
- **Wdrożenie**: uruchom `skrot-v11-aktywnosc.sql` w SQL Editor. Strona działa też bez niego (panel poprosi o uruchomienie pliku).

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

**Testy wyglądu (lokalnie).** Przy przemianie każdy etap był sprawdzany w Playwright na atrapie `skrot-supabase.js` (dane w pamięci, nic nie idzie do bazy): zrzut `getComputedStyle` przed/po, brak poziomego przewijania na 375/360/1280 px, EN bez polskich napisów, zero błędów konsoli i test regresji lekcji (ta sama trasa kart, XP, gwiazdki i wznowienie co przed zmianą).

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
Potem w aplikacji: Terminy → ⋯ → „Dodaj do kalendarza w telefonie”. Każda osoba z dostępem dostaje swój link; grupę bierze z „Twoja grupa”. Po wygaśnięciu dostępu w kalendarzu zostają same zajęcia.

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
- **Tryb przed kolokwium** – przycisk w przedmiocie, przy formie zaliczenia i przy terminie. Plan na dni do zaliczenia (`dayPlan`: tematy, których jeszcze nie umiesz, rozłożone równo do daty, najsłabsze najpierw; ostatnie 7 dni to powtórki i dzień przed zaliczeniem próbny test; na ekranie 3 najbliższe wiersze, reszta pod „Cały plan”; minuty dziennie liczone z planu), zakres bez dubli (stary materiał z prezentacji o tym samym co lekcja albo jej dział – `lessonTwin`, podobieństwo tytułów bez słów typu „lecture slides” – jest w zwiniętej sekcji „Dodatkowo”, poza planem i licznikiem tematów; przycisk „To osobny temat” zapisuje wyjątek w `exams[…].keep`), zakres, kluczowe tematy (starosta oznacza ★ w materiale) i próbny test z timerem: pytania z `examBank` (Panel AI → „Pytania do testów”), a gdy ich brak, z quizów, fiszek i zadań. Szablon testu (czas, próg, sekcje) w Panelu AI; domyślny wynika z formy zaliczenia w sylabusie. Pytania otwarte student ocenia sam według rubryki.
- **Ściągawki** – jedna strona A4 na materiał albo przedmiot, drukowanie przez przeglądarkę („Zapisz jako PDF”), w stopce e-mail kupującego.

## Moje materiały (v4): własne pliki studentów
Każda osoba z pełnym dostępem wgrywa własny plik (PPTX, PDF, DOCX, TXT): Więcej → „Moje materiały” (albo ostatni kafelek na Przedmiotach) → „Wgraj swój materiał”. Plik przechodzi **ten sam proces co materiały roku** (mapa tematów → opracowanie bez tekstu pliku → fiszki i quiz → kontrola podobieństwa → prosty język i „Dlaczego?”), a wynik trafia do sekcji wybranej przez tę osobę. Domyślna sekcja to „Materiały”; można tworzyć nowe, zmieniać nazwy, przenosić materiały i usuwać sekcje.

- Materiały są prywatne: kolekcje `myMaterials` i `myContent`, widzi je i zmienia tylko właściciel. Tekst pliku nie jest zapisywany. Sekcje są w postępie nauki tej osoby (`myFolders`).
- Koszt AI pilnuje baza: przed każdym plikiem strona pobiera bilet (`nauka_moje_start`), jeden bilet = jeden plik = do 10 zapytań do AI w ciągu 2 godzin. Limit: **2 pliki dziennie i 40 w miesiącu na osobę** (liczby w `nauka_moje_stan`, aktualna wersja w `skrot-v9-limit-moje.sql`). Starosta nie ma limitu.

Włączenie (jednorazowo):
1. Supabase → SQL Editor: wklej `supabase/skrot-v4-moje.sql` → Run.
2. W terminalu, w folderze tego repozytorium: `npx supabase functions deploy claude`

Dopóki tego nie zrobisz, strona pokazuje studentom „nie jest jeszcze włączone na serwerze” zamiast błędu.
