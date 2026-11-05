# Skrót BM

Płatna platforma do nauki dla 1. roku Business Management (Uniwersytet Szczeciński): skróty, fiszki, quizy, wersje prostym językiem, zadania i terminy. Strona: **https://skrotbm.pl**

Darmowy plan zajęć i skrzynka do opiekunki roku są w osobnym repozytorium [plan-bm](https://github.com/kowalczykbartek74-cpu/plan-bm) pod adresem https://plan.skrotbm.pl.

## Kierunki i roczniki (`rocznik.js`, `skrot-v31-roczniki.sql`)
Przygotowanie pod inne kierunki US (plan: „Skrót – plan wdrożenia na cały Uniwersytet Szczeciński”, Etap 2). Dla BM nic się nie zmienia.
- **Rocznik** = kierunek × stopień × tryb × rok naboru, id `<wydział>-<kierunek>-<stopień>-<tryb>-<nabór>`, np. `wefiz-bm-1-st-2026`. Rok studiów liczy się z daty (od 1 października), więc nabór 2026 sam przechodzi na 2. rok w 2027/28.
- `rocznik.js` (w `<head>` po `i18n.js`, przed `skrot-supabase.js`) daje `window.SKROT_ROCZNIK`: kierunek, wydział, adres `plan.json` i strony planu, skrzynka (albo `null`), pliki sylabusa i pojęć (albo `null`), `dostepDo` (koniec planu 199 zł, wspólny dla uczelni), gotowe teksty PL/EN (`teksty.*`, dopisywane do słownika EN) i opis odbiorców dla AI (`ai.en`, `ai.pl`, `ai.kontekst`). W `index.html` to stała `ROK`.
- Z planu (`PLAN.groups`) liczą się: przedmioty (`buildSubjects`, liczone od nowa po pobraniu świeżego planu), grupy (`planGroups`) i podgrupy lab (`planSubs`; brak = brak wyboru lab). Wbudowana kopia planu (`PLAN_WBUDOWANY`) dotyczy tylko BM.
- Zasady zaliczeń wpisane ręcznie (`ZAL`, `CALC_RULES`) działają tylko dla rocznika z `zasadyZaliczen: true` (BM). Inne roczniki dostaną je z bazy.
- Prompty AI biorą odbiorców z `ROK.ai`; funkcja `claude` sprawdza prompty studentów wzorcem (dowolny kierunek i rok), nie jednym napisem. Dla BM tekst promptów jest bajt w bajt taki sam jak wcześniej.
- Baza (v31; na gałęzi `kierunki` był to v22): `nauka_wydzialy`, `nauka_kierunki`, `nauka_roczniki` (status `plan` / `oczekujacy` / `platny`), `nauka_profil.rocznik_id` (istniejące i nowe profile = BM 2026), RPC `nauka_roczniki_lista()` (też bez logowania). Reguły dostępu bez zmian.
- **Ekran wejścia** (skrypt na początku `index.html`): karty kierunków z `SKROT_ROCZNIKI`, w kroku 2 rok z daty i grupy z `grupy` rocznika (brak = bez wyboru grupy). Wybór: `skrot-rocznik` (+ dawne `skrot-kierunek` = `bm`, `bm-group`); inny rocznik niż wczytany = przeładowanie. Po zalogowaniu `syncRocznik` w `skrot-supabase.js` zapisuje wybór w profilu (`nauka_rocznik_ustaw`, raz; konta sprzed v31, płacące i z okresem próbnym liczą się jako wybrane BM), a rocznik z bazy wygrywa z przeglądarką.
- `teams: true` (tylko BM): zadania i odwołania z Teams, „Ostatnia aktualizacja z Teams”, „Odwołania z Teams” w Narzędziach starosty i teksty o Teams. Rocznik bez Teams ich nie widzi.
- **Nowy kierunek**: wpis w `ROCZNIKI` w `rocznik.js` + wiersze w `nauka_kierunki` i `nauka_roczniki` + jego `plan.json` (host dopisać do `connect-src` w CSP) + opcjonalnie sylabus. Test: `localStorage["skrot-rocznik"] = "<id>"`.
- Testy: `node --test tests/*.test.js` (rocznik i wzorce promptów), `supabase/test/v31.sql` w PGlite (R1–R10), `docs/gry/test/kierunek.mjs` (ekran wejścia), `docs/gry/test/scalenie-zdawalni.mjs` (D: zapis w profilu, atrapa `mock-v31`).
- Jeszcze nie zrobione (kolejne etapy, `docs/kierunki/nowy-kierunek-spec.md` etap 2): terminy/ogłoszenia/ranking per rocznik w regułach bazy, dostęp per rocznik (Stripe: rocznik w metadanych, tabela dostępów), funkcja `kalendarz` z planem rocznika, klucze `bm-*` w localStorage (zostają), nazwa i domena (Zdawalni), regulamin § 2.

## Układ strony
Pięć zakładek, każda odpowiada na jedno pytanie ucznia (plan: „Skrót BM: plan przejrzystości”):
- **Postęp do nauki** to jedna miara: „tematy do zaliczeń, które umiesz” (np. 3/14), liczona z zakresu najbliższego zaliczenia (`knowOf` w `index.html`). Temat umiesz po zdanym bilecie wyjścia lekcji albo gdy w mapie postępów jest „umiesz”. Karta „Twój postęp” na Dziś pokazuje tylko to (plus poziom, serię i cel dnia do zabawy); punkty kursu są w przedmiocie i w lekcji. Pod paskiem jest „Zaczęte: N” (temat otwarty, zaczęta lekcja, quiz albo fiszki, ale jeszcze nie „umiesz”), żeby wysiłek był widać. W hero przedmiotu punkty kursu, działy i „przerobione” są zwinięte (`ptsFold`), a prowadzący i prawdopodobny temat zajęć w „Prowadzący i temat zajęć”. Kółko na kafelku przedmiotu to lekcje (podpis „lekcji”). Terminy: licznik pod „Najbliższe” liczy 30 dni od dziś (`nextDaysCounts` w `terminy.js`). Wybór planu liczy miesiące do 11.07.2027 i daje „Najtaniej” planowi, który naprawdę wychodzi taniej (`planCompare` w `skrot-supabase.js`). Na Dziś miejsce w rankingu widać dopiero przy co najmniej 5 osobach; ukrytym pokazuje zaproszenie do rankingu.
- **Dziś** – krótki ekran: karta „Teraz zrób to” z jednym przyciskiem (kolejność: zaliczenie ≤ 7 dni → zadanie ≤ 2 dni → fiszki do powtórki → nowy materiał → ostatnio otwarty), zajęcia dziś lub jutro i najbliższy termin. Hasło dnia i „Masz 3 minuty?” są niżej, w rzędzie „Na luzie” (`funRow`), pod zajęciami i terminem. „Twój postęp” i „Nowe od ostatniej wizyty” są zwinięte (`homeFold`, stan otwarcia w `bm-fold:*`).
- **Przedmioty** – wyszukiwarka (przedmioty, materiały, pojęcia, terminy; skrót `/`) i siatka przedmiotów. Przedmiot ma zawsze 3 zakładki: **Ucz się · Ćwicz · Zaliczenie**. Materiał to 3 kroki: **Przeczytaj (Normalnie | Prościej) · Fiszki · Quiz**.
- **Powtórki** – ile fiszek dziś, przycisk Zacznij, pod spodem mapa postępów.
- **Terminy** – jedna lista „co i na kiedy” (zadania z Teams, terminy roku, daty zaliczeń) jako oś czasu: karta „Najbliższe”, chipsy rodzaju (zapamiętane w `skrot-termcat`), sekcje Po terminie / Ten tydzień / Następny tydzień / miesiące / Bez daty (dalsze niż 2 miesiące zwinięte), szczegóły w wysuwanym okienku, odhaczanie z „Cofnij”. Rzadsze akcje (kalendarz w telefonie, widok kalendarza, Zrobione) są w menu ⋯. Na komputerze (≥ 1024 px) dwie kolumny z mini-kalendarzem miesiąca. Logika bez DOM w `terminy.js` (strefa Europe/Warsaw, tydzień od poniedziałku, filtr grupy i labu, scalanie tego samego terminu wpisanego dla kilku grup w jedną kartę z tagami); testy: `node --test tests/*.test.js`. Starosta ma przełącznik Moja grupa | Cały rok (`skrot-termscope`). Zrzuty przed/po: `docs/terminy/`.
  Kolokwia i egzaminy mają pole **part** (`W` / `CW` / `LAB`, w oknie terminu „Część przedmiotu”): po nim „Przygotuj się” wybiera datę właściwej części. Stare wpisy bez pola dopasowuje słowo w tytule („wykład”, „ćwicz”, „lab”), potem data z opisu zaliczenia (`ZAL`). Terminy sprzed dołączenia osoby (`progress.joined`) trafiają do zwiniętej sekcji „Minione”, a nie „po terminie”.
- **Więcej** – Nauka, Studia, Ty oraz przełącznik **Tryb starosty** (widoczny tylko dla starosty; wyłączony = widok studenta z pełnym dostępem).

**Przewodnik** (`#/guide`, wejście: Więcej → „Przewodnik po stronie” i pasek na ekranie Dziś, dopóki ktoś go nie ukończy albo nie zamknie): 9 rozdziałów (`GUIDE` w `index.html`), w każdym karty z ćwiczeniem na przykładowych danych (działa bez dostępu i bez materiałów), na końcu „Pokaż mi to na stronie” podświetla to samo na prawdziwych ekranach (`startTour(kroki, opcje)`), a po wszystkim test z 8 pytań (`GTEST`) z odznaką od 7 punktów. Postęp przewodnika zapisuje się w `progress.guide` (i w `bm-guide` w przeglądarce). Szybki tour po zakładkach (`QUICK`, minuta) startuje tylko osobom z dostępem; po zakupie najpierw ekran „Dostęp aktywny” z trzema krokami (`showWelcome`, znacznik `skrot-welcome`). Grupa i lab to pierwszy krok na ekranie Dziś (bez domyślnego labu A); do tego czasu strona nie pokazuje zajęć ani terminów konkretnych grup. Gdy zmieniasz ekran, sprawdź selektory w `tour` danego rozdziału (atrybuty `data-tour`).

Stare adresy (`#/tasks`, `#/calendar`, `#/progress`) prowadzą do nowych ekranów. Adres w pasku (`#/subject/makroekonomia`) działa z przyciskiem Wstecz.

## Układ: drobne zasady (30.10.2026)
- **Wyjaśnienia raz**: stałe akapity typu „Fiszki wracają…”, „Nasze lekcje…” idą przez `onceHelp(klucz, tekst)`. Po „Rozumiem” (`bm-hint:<klucz>`) zostaje tylko „?”.
- **Pasek „umiesz”** ma jaśniejszą, kreskowaną część za tematy zaczęte (`knowBar`, kafelek przedmiotu).
- **Przedmioty**: kolejność wg najbliższego zaliczenia (`subjectLabel().pin`), plakietka z terminem na każdej karcie, niższy pasek ze wzorem, bez pierścienia lekcji.
- **Przedmiot**: Z sylabusa / Z prezentacji pamiętane osobno dla każdego przedmiotu (`bm-src:<id>`), domyślnie sylabus; jeden główny przycisk w hero; „Mapa tematów” zwinięta na dole (`bm-fold:pmap-<id>`).
- **Kalendarz**: na telefonie domyślnie lista „Najbliższe 7 dni” (`calAgenda`), przełącznik Miesiąc (`bm-calmode`); siatka mieści niedzielę także na 601–820 px.

## Wersja angielska (PL / EN)
Przełącznik **EN/PL** jest w górnym pasku, w Więcej → „Język” i na ekranie kodu dostępu. Wybór zapisuje się w przeglądarce (`skrot-lang`); bez wyboru strona otwiera się po angielsku, gdy przeglądarka nie ma ustawionego polskiego. Link `?lang=en` albo `?lang=pl` też ustawia język.

- `i18n.js` (ładowany w `<head>`) w trybie EN dociąga `i18n-en.js` i tłumaczy wszystko, co pojawia się na ekranie: teksty, `title`, `placeholder`, `aria-label`, okna `confirm`/`alert`. Kod strony zostaje po polsku.
- `i18n-en.js` to słownik `"polski tekst": "English text"`. Teksty z wstawkami mają `{0}`, `{1}` (np. `"Powtórz {0} {1}": "Review {0} {1}"`). Liczebniki (`plural`), dni tygodnia i miesiące przełącza `index.html` (stała `EN`). Nazwy przedmiotów biorą angielską nazwę z planu i sylabusa.
- **Nowy tekst na stronie** bez wpisu w słowniku pokaże się po polsku. Dopisz parę do `"exact"` w `i18n-en.js` (dokładnie ten sam tekst, łącznie z dwukropkiem czy kropką).
- Teksty z CSS (`content: "…"`) mają osobne reguły `html[lang="en"] …`.
- Zostają po polsku: wersja „Prościej · PL” i wyjaśnienia „Dlaczego?” (tak powstają w bazie), polskie odpowiedniki w słowniczku EN–PL, nazwiska, polskie tytuły lektur oraz to, co wpisujesz ręcznie (ogłoszenia, nazwy terminów). Regulamin i polityka prywatności mają tłumaczenia `regulamin-en.html` i `prywatnosc-en.html` (wiążąca jest wersja polska); w trybie EN `i18n.js` sam podmienia linki na nie. Zmieniasz regulamin albo politykę: popraw też wersję EN.
- Definicje pojęć z sylabusa mają pole `defEn` w `sylabus-pojecia.json`.
- **Teksty wpisane ręcznie** (tytuły i opisy terminów, zadania z Teams, ogłoszenia) tłumaczy AI w przeglądarce starosty (`enSync` w `index.html`, kilka sekund po wczytaniu strony i po każdej zmianie) i zapisuje w `meta/en` jako `{ t: { "polski tekst": "English text" } }`. W trybie EN strona podaje je do `SKROT_I18N.user()`. Gdy tekst jest tylko częścią napisu („Ogłoszenie: …”, „… · za 3 dni”), `i18n.js` podmienia go w całości, a resztę tłumaczy słownikiem, więc nie tnie go już na pojedyncze słowa. Nowy termin dostaje tłumaczenie, gdy starosta następnym razem otworzy stronę. Bez SQL: `meta` czytają osoby z dostępem, zapisuje starosta.

## Jak to działa
- `index.html` – cała aplikacja (jedna strona). Plan zajęć pobiera z `https://plan.skrotbm.pl/plan.json`.
- `skrot-supabase.js` – baza, logowanie mailem i zakup dostępu (Supabase + Stripe Payment Link).
- `supabase/` – reguły bazy (uruchamiane w SQL Editor w kolejności: `nauka.sql`, `skrot.sql`, `skrot-platnosci.sql`, `skrot-darmowe.sql`, `skrot-v2.sql`, `skrot-v3.sql`, `skrot-v4-moje.sql`, `skrot-v5.sql`, `skrot-v6.sql`, `skrot-v7-subskrypcja.sql`, `skrot-v8-urzadzenia.sql`, `skrot-v9-limit-moje.sql`, `skrot-v10-zgody.sql`, `skrot-v11-aktywnosc.sql`, `skrot-v12-zabezpieczenia.sql`, `skrot-v13-gry.sql`, `skrot-v15-gry2.sql`, `skrot-v14-monety.sql`, `skrot-v16-proba.sql`, `skrot-v17-polecenia.sql`, `skrot-v18-imie-polecajacego.sql`, `skrot-v19-pokaz.sql`, `skrot-v20-jednorozec.sql`, `skrot-v21-nokturn.sql`, `skrot-v22-monety-widoczne.sql`, `skrot-v24-kosmetyki.sql`, `skrot-v25-ocena-ai.sql`, `skrot-v26-odwolania.sql`, `skrot-v27-kalendarz-moje.sql`, `skrot-v28-zdarzenia-nauki.sql`, `skrot-v29-powtorki.sql`, `skrot-v30-profil.sql`, `skrot-v31-roczniki.sql`, `skrot-v32-usun-konto.sql`, `skrot-v33-retencja.sql`, `skrot-v34-oczekujacy.sql`, `skrot-v35-lejek.sql`, `skrot-v36-przypomnienia.sql`, `skrot-v37-paczka.sql` – v14 i v16 celowo po v15, bo tak trafiają na produkcję; v23 zarezerwowane dla rocznika Prawa z gałęzi `kierunek-prawo`, które przy scaleniu dostanie kolejny wolny numer po v31) i funkcje serwerowe:
  - `functions/stripe-webhook` – po płatności w Stripe (konto live „skrotbm”, endpoint „skrotbm-supabase”) wpisuje dostęp (sekret `STRIPE_WEBHOOK_SECRET`, bez weryfikacji JWT),
  - `functions/kalendarz` – osobisty kalendarz do telefonu (zajęcia + zaliczenia + zadania) pod tajnym linkiem; reguły w `skrot-kalendarz.sql`, wdrażanie z `--no-verify-jwt`,
  - `functions/claude` – AI (sekret `ANTHROPIC_API_KEY`): starosta bez limitu, osoby z pełnym dostępem tylko do „Moich materiałów”, z biletem i limitem plików. Prosty język i „Dlaczego?” materiałów roku powstają z góry.
- Maile logowania: Resend (SMTP) z domeny skrotbm.pl.
- Kalendarz roku (tygodnie parzyste/nieparzyste, dni wolne, przerwy) strona bierze z `https://plan.skrotbm.pl/plan.json` (pole `kalendarz`, edytowane w `kalendarz.json` w repozytorium plan-bm). W `index.html` jest tylko kopia zapasowa.

## Kody polecające (Więcej → Polecaj i zarabiaj)
Osoba z dostępem **opłaconym przez Stripe** (sam okres próbny ani dostęp dany ręcznie nie wystarcza) zakłada kod (4–16 liter i cyfr) i podaje imię i nazwisko (v18, wymagane; kto ma kod bez imienia, widzi prośbę o uzupełnienie) ( `#/polec`, `viewPolec` w `index.html`). Kto wpisze go przy zakupie planu **do końca 2. semestru (199 zł)**, płaci normalną cenę, a właścicielowi kodu należy się **30 zł**. Zasady: regulamin § 9.
- Kod wpisuje się w oknie „Zanim zapłacisz” (`goPay` w `skrot-supabase.js`, tylko plan `rok`). Link **https://skrotbm.pl/?kod=KOD** zapamiętuje kod na 30 dni (`skrot-kod`) i wpisuje go w to pole. Przed płatnością strona sprawdza kod (`nauka_polec_sprawdz`: nie ma, własny, już użyty, nieaktywny).
- Kod idzie do Stripe w `client_reference_id` jako `<id konta>__KOD`. `stripe-webhook` po opłaceniu jednorazowego planu woła `nauka_polec_zapisz` (baza sprawdza kod, kwotę ≥ 199 zł, samopolecenie i to, czy kupujący nie był już polecony). Błąd przy kodzie nigdy nie blokuje dostępu.
- Nagroda **czeka 14 dni**, potem jest **do wypłaty**. `charge.refunded` (pełny zwrot) i `charge.dispute.created` anulują niewypłaconą nagrodę (`nauka_polec_cofnij`); wypłaconą tylko oznaczają powodem. **W Stripe dodaj te dwa zdarzenia do endpointu „skrotbm-supabase”.**
- Wypłaty ręcznie (BLIK / przelew): Więcej → Tryb starosty → **Kody polecające** (`openAdminReferrals`): kto ma kod, dane do wypłaty, „Wypłacone” oznacza wszystko, co było do wypłaty; można anulować podejrzane polecenie i usunąć kod.
- Właściciel kodu widzi tylko daty i stan swoich poleceń, nigdy e-maili kupujących. Tabele `nauka_kody` i `nauka_polecenia` bez dostępu z przeglądarki (RLS bez reguł). Kwota, 14 dni i minimalna cena są w `nauka_polec_cfg()` w `supabase/skrot-v17-polecenia.sql`.
- Testy bazy: `supabase/test/v17.sql` (K1–K12) i `supabase/test/v18.sql` (I1–I5).

## Ekran logowania
Bez zalogowania strona pokazuje tylko osobny ekran logowania (`#login` w `index.html`). Na komputerze (od 900 px) po lewej jest zielony panel z hasłem strony i trzema korzyściami, po prawej formularz; na telefonie tylko logo i formularz. Kod z maila albo hasło, regulamin, prywatność, kontakt i przełącznik EN/PL. Aplikacja pojawia się dopiero po zalogowaniu.

**Wybór kierunku (4.11.2026)**: przed formularzem są kroki Kierunek → Rok i grupa → Logowanie (`#lgKierunek`, logika w skrypcie zaraz za `#login`). Wybór zapisuje się w `localStorage` (`skrot-kierunek` = `bm`, grupa w `bm-group`), bez bazy. Krok jest pomijany, gdy kierunek był już wybrany, ktoś ma zapisaną grupę (dotychczasowi użytkownicy), czeka na kod z maila albo wchodzi z `?proba=` / `?kod=`. „Inny kierunek” prowadzi do listy oczekujących: na razie gotowy mail do skrotbm@outlook.com (zapis do bazy dojdzie z modelem roczników). Karta „BM · 1. rok · grupa” nad formularzem ma przycisk „Zmień”. Test: `docs/gry/test/kierunek.mjs`.
- Skrypt w `<head>` sprawdza, czy w przeglądarce jest sesja Supabase (`sb-zkyxujkdrovfzpasocmv-auth-token`); jeśli nie, od razu dodaje klasę `needlogin`, więc aplikacja nie miga.
- `skrot-supabase.js` (`showLoginPage`) wypełnia ekran tym samym logowaniem co okno (`openLogin` z `page: true`). Komunikaty po płatności, po nieważnym linku i pole na kod po przeładowaniu działają jak wcześniej, tylko na tym ekranie.
- Strona jest otwarta (bez kodu dostępu przed startem, bez `noindex`), od 27.10.2026. Pierwszy ekran to logowanie.
- **Okres próbny z ekranu logowania**: nad formularzem jest karta „3 dni za darmo” z przyciskiem „Wypróbuj za darmo przez 3 dni” (a na komputerze czwarta korzyść w zielonym panelu). Klik zapisuje znacznik `skrot-trial` i przełącza formularz w tryb „Wyślij kod i zacznij”; po zalogowaniu `afterReady` sam wywołuje `startTrial` (RPC `nauka_proba_start`). „Mam już konto: zwykłe logowanie” kasuje znacznik. Link do promocji: **https://skrotbm.pl/?proba=1** otwiera od razu tryb próbny (parametr znika z adresu; zalogowanemu bez dostępu od razu włącza próbę).
- Przed płatnością okno „Zanim zapłacisz”: akceptacja regulaminu i zgoda na natychmiastowe dostarczenie Treści (utrata prawa odstąpienia, regulamin § 5). Bez obu ptaszków nie da się przejść do Stripe. Zgoda trafia do tabeli `nauka_zgody` przez `nauka_zgoda()` (`supabase/skrot-v10-zgody.sql`, uruchom raz w SQL Editor); gdy zapis się nie uda, zakup idzie dalej, a ślad zostaje w `localStorage["skrot-zgoda"]`. Treść zgody i `CONSENT_V` w `skrot-supabase.js` zmieniaj razem z regulaminem.
- Gdy baza jest nieosiągalna, strona pokazuje aplikację (stan offline), żeby nikt nie utknął.
- Na telefonie (poniżej 900 px) nad kartą okresu próbnego jest krótki opis strony (`.lg-intro`; znika na etapie wpisywania kodu). W karcie jest linijka z ceną po okresie próbnym (na sztywno: przy zmianie cen popraw ją razem z `CONFIG.plans`, regulaminem i `i18n-en.js`), a pod formularzem kodu informacja o akceptacji regulaminu przy zakładaniu konta (regulamin § 3 ust. 1).
- Nieważna stara sesja w przeglądarce („Invalid Refresh Token”) jest po cichu czyszczona (`signOut({ scope: "local" })`).

## Hasło do logowania (opcjonalne)
- Logowanie: zakładka **Kod z maila** (jak dotąd) albo **Hasło**. Strona pamięta ostatnio użytą zakładkę i e-mail.
- Hasło ustawia się po zalogowaniu kodem: Więcej → Hasło do logowania (po pierwszym logowaniu kodem strona raz to proponuje). Min. 8 znaków; zapisuje się w Supabase Auth (`updateUser`), a w `user_metadata.haslo` znacznik, że jest ustawione.
- Gdy w Supabase włączone jest „Secure password change”, strona sama prosi o kod z maila (`reauthenticate`) i dopiero wtedy zapisuje hasło.
- Zapomniane hasło = zaloguj się kodem i ustaw nowe. Konto bez hasła loguje się tylko kodem.
- Dzielenie się hasłem nic nie daje: dalej działa limit 3 urządzeń i jedna aktywna sesja (`skrot-v8-urzadzenia.sql`).
- Supabase → Authentication → Sign In / Providers → Email musi być włączony (jest, bo działa kod); hasło nie wymaga dodatkowych ustawień.

## Profil nauki i powtórki FSRS (v30, `skrot-v30-profil.sql`, `learner.js`)
Ten sam model nauki co w Zdawalni (matura-app, `docs/plan-profil-nauki.md`, etap L7). `learner.js` jest **generowany** z `lib/domain/learner/*` w matura-app: `npm run learner:build -- ../skrot-bm/learner.js` (nagłówek pliku podaje commit). Nie poprawiaj go ręcznie; po przebudowaniu podbij `?v=` w `index.html`.
- **Powtórki**: termin następnej fiszki liczy FSRS (`fsrsNext` w `index.html`), oceny Nie pamiętam / Trudne / Pamiętam / Łatwe = Again / Hard / Good / Easy. Karta w `progress.srs` to `[pudełko, dzień, stabilność, trudność, powtórki, pomyłki, stan, dzień ostatniej powtórki]`; karty sprzed FSRS (`[pudełko, dzień]`) zaczynają nową kartę przy następnej ocenie. Pudełko zostaje jako znak postępu (mapa postępów, „umiesz” od 3), zasada „przed zaliczeniem każda karta wraca raz” też. Bez `learner.js` działają stare pudełka. Mapa „Gdzie są Twoje fiszki” liczy, za ile dni wraca każda karta.
- **Profil nauki** (`#/learn`, Więcej → Ty → Profil nauki): test „Jak się uczysz?” w wariancie 19+ (rytm, gra pamięciowa z 6 słowami, skupienie, co Cię nakręca, zainteresowania), ok. 6 minut. Wynik gry lekko wydłuża albo skraca pierwsze odstępy fiszek (znika po 10 powtórkach). Ze stresu zapisujemy tylko „wysoki albo nie” (baza odrzuca liczbę). Panel: karty z „Dlaczego?”, przełącznik **Ucz się na moich danych**, „Zrób test jeszcze raz”, „Zacznij profil od nowa”, „Usuń dane o aktywności”.
- **Zdarzenia nauki** (`skrot.learn.track` w `skrot-supabase.js`, kolejka `bm-learn-q`): `review_graded`, `exit_ticket`, `activity` (potrzebne do działania, idą zawsze; `activity` od v30) i `profile_test` (tylko przy włączonym przełączniku). Baza (`nauka_zdarzenia_zapisz`) przyjmuje tylko typy z `nauka_zdarzenia_typy()`, pomija duplikaty, przycina zegar do ±48 h, ma limit 1000/h i usuwa zdarzenia starsze niż 400 dni. Tabele `nauka_zdarzenia` i `nauka_profil_nauki` bez dostępu z przeglądarki.
- Model z danych (rytm, długość bloku z prawdziwej nauki) jeszcze nie jest liczony w Skrócie: `z_danych` czeka na osobny krok.
- Razem z lekcjami v4: FSRS liczy termin także kart `q:`, `d:`, `n:`; limit dnia 30 zaległych + 20 nowych (`srsDue`) i „przed zaliczeniem każda karta wraca raz” działają na terminach FSRS; zła/zgadnięta odpowiedź w bilecie (`srsMiss`) daje pudełko 1 na jutro, stan FSRS zostaje. Bez `learner.js` stare pudełka.
- Testy: `supabase/test/v30.sql` (P1–P11, v30 uruchamiane dwa razy), `node --test tests/*.test.js` (`tests/learner.test.js`), Playwright `docs/gry/test/profil-nauki.mjs` (atrapa: `mock-v22`, `mock-profil`) i `docs/gry/test/scalenie-zdawalni.mjs` (limit dnia, zaliczenie, bez `learner.js`).

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
- Nowe tabele (przeglądarka nie ma do nich dostępu): `nauka_haslo_dni` (słowo dnia, wybierane raz z `concepts[]` materiałów roku: jedno słowo z liter A–Z, 5–9 znaków, nieużyte w ostatnim roku), `nauka_haslo` (próby osoby; usuwane po 12 miesiącach przy pierwszej próbie dnia), `nauka_boss` (bossy z kolekcji `deadlines`, tylko terminy bez `approx`; życie = max(150, 12 × aktywni z 14 dni) ustalane przy utworzeniu). Ciosy liczy `nauka_boss_ciosy` z `nauka_odp` (pytanie raz na osobę dziennie, zadanie = 3, max 40 dziennie na osobę).
- Kod w przeglądarce: nowe funkcje w `window.skrot.rp` (`skrot-supabase.js`): `trudnosc(klucze)`, `rok(mid, idx)`, `haslo()`, `hasloProba(slowo)`, `bossy()`, `bossOdbierz(id)`, `bossAdmin(id, { hp, ukryty })`. Kształty odpowiedzi: SPEC-2, sekcja 3. Bez v15 w bazie każda zwraca `not_enabled` (gry pokażą chip „wkrótce”), a reszta strony działa jak dotąd.
- Testy bazy: `supabase/test/v15.sql` (H1–H8, D1–D6, B1–B9), uruchamiany po `test/v13.sql`: `node supabase/test/pglite.mjs` (v13, v15, v14, v16 – każdy dwa razy – potem testy; na końcu „✓ test/v13.sql”, „✓ test/v15.sql”, „✓ test/v14.sql”, „✓ test/v16.sql”). Atrapa do Playwrighta (`docs/gry/test/atrapa-supabase.js`) ma funkcje v15 i przełączniki `mock-v15`, `mock-boss`, `mock-rok`, `mock-haslo-*` (opis na górze pliku).
- **Hasło dnia (etap 7)**: widok `#/haslo` w `index.html` (blok „HASŁO DNIA”: `viewHaslo`, `hdLoad`, `hdSubmit`, `hdEnd`, `hdShare`; CSS `.hd-*`), bez `gry.js`. Plansza 6 × długość słowa (`role="grid"`, `translate="no"`), klawiatura ekranowa QWERTY i fizyczna (litery, Enter, Backspace), kolory liter tylko z `wzor` z bazy (2 = `--accent` + ciągła gruba obwódka, 1 = `--lime-400` + przerywana, 0 = `--sunk`), obrót kafelków co 250 ms (bez niego przy „Mniej animacji”), po próbie `#hd-live` czyta cały wiersz. Wpisywany wiersz przeżywa odświeżenie (`sessionStorage["bm-haslo-wpis"]`), zapisane próby zawsze z `rp.haslo()`; przed próbą porównanie dnia z datą w Polsce (nowe hasło → nowa plansza). Brak sieci: komunikat, wiersz zostaje. Po końcu: słowo, PL, definicja, „Z materiału”, „Dodaj do Powtórek” (pełny dostęp), seria, rozkład wyników roku, licznik do północy, „Udostępnij wynik” (tekst bez słowa z 🟩🟨⬜: `navigator.share` na telefonie, schowek na komputerze). Konto bez dostępu gra normalnie (0 pkt) i widzi „Z pełnym dostępem to byłoby +N pkt rankingu”. Wejścia: karta na Dziś (`hdHomeCard`, `rp.haslo()` raz na sesję, po 2 s; po końcu mała linia z wynikiem), kafelek na Graj (`hdTile`, także bez dostępu), wiersz w Więcej → Nauka (`hdMoreRow`). `not_enabled` (brak v15) → wejść nie ma; `no_words` → wejść nie ma, starosta widzi „Hasło dnia czeka na pojęcia w materiałach”. Teksty EN w `i18n-en.js` (blok „etap 7”); test: `node docs/gry/test/etap7.mjs` (zrzuty `e7-*`), `en-tabele.mjs` sprawdza też tabelę 5.6 z SPEC-2.
- **Drabina (etap 8)**: gra w DOM w nakładce `gry.js`, kod w osobnym `gry-drabina.js` (ładowany leniwie jak `gry-przejdz.js`: `LAZY.drabina`, ta sama wersja `?v=` co `gry.js`; w `gry.js` tylko `GRY_CFG.drabina = { n: 12, progi: [4, 8], sec: [30, 45], noteSec: 15 }`, `UNITS`, `TITLES`). 12 pytań z `A.ladder(sid)` (`gryLadder` w `index.html`: `gryQuestions(sid, 40)` → `rp.trudnosc` → łatwość = % roku albo 60, +10 za prawda/fałsz → sortowanie malejąco, remisy tasowane seedem rundy, indeksy `round(i × (N − 1) / 11)`; < 12 pytań → toast i koniec). Zegar 30 s (szczeble 1–8) / 45 s (9–12), nie stoi przy kołach; zła odpowiedź albo koniec czasu → wynik = ostatni próg (0/4/8), „Zatrzymaj się” → obecny szczebel. Koła raz na rundę: 50:50 (2 złe z seeda; wyłączone przy 2 opcjach), Zapytaj rok (`rp.rok`, rozkład z indeksów oryginalnych przeliczony na kolejność z ekranu; `za_malo`/błąd → komunikat, koło się nie zużywa; offline wyłączone), Notatka (`A.noteOf(mid)` = pierwsze zdanie `tldr`/`purpose`, 15 s; brak → wyszarzone). Klawisze 1–4 / A–D, F, R, N, S; Esc = zamknij. `rp.odp` w tle z `zrodlo: "gra"`, `run` i indeksem oryginalnym (koniec czasu nie idzie do bazy), `rp.koniec` z wynikiem w szczeblach; XP +5 za dobrą, pomyłka → `A.onWrong`. Ekran wyniku wspólny („szczebli”, rekord lokalny `bm-gry-rekord:drabina` dla całej gry). Układ: ≥ 900 px drabina w kolumnie 160 px z lewej, telefon – pasek 12 kropek (gwarantowane rombem `--lime-400`, bieżąca pulsuje, bez tego przy „Mniej animacji”); CSS `.dr-*` w `index.html`. Kafelek 🪜 na Graj i w pasku „Powtarzaj grając”, rekordy tygodnia Fruń i Drabiny (`gryRecords`, `rp.rekordy` każdej gry raz na 30 s).
- **Rdzeń gier DOM (etap 8, SPEC-2 4.6)**: gra `dom: true` deklaruje `load(A, sid, run)` (Pary: `A.pairs`, Drabina: `A.ladder`), `enough(treść)` (`true` albo tekst toastu) i `mount({ content, rnd, box, cb, run, A })`; opcjonalnie `key(e)` (klawisze w trakcie) i `noTime` w wyniku `mount` (ukrywa licznik czasu na pasku). `cb.track(p)` dolicza punkty z odpowiedzi wysłanych przez grę do ekranu wyniku. `run.seedP` = seed rundy z `rp.start`. Pary działają jak dotąd (`etap3.mjs` 47/47).
- Testy etapu 8: `node docs/gry/test/etap8.mjs` (atrapa: `mock-trud=liniowo` – trudność 95 → 20, `mock-pf=1` – pytania prawda/fałsz w m2, `mock-rok=malo`; zrzuty w `$OUT/etap8/`), `en-tabele.mjs` sprawdza też tabelę 4.7.
- **Boss przed kolokwium (etap 9)**: blok „BOSS PRZED KOLOKWIUM” w `index.html` (bez `gry.js`). Dane tylko z `rp.bossy()` (`bsLoad`: na Dziś najwyżej raz na 60 s, w widoku przy wejściu i co 60 s, po powrocie z quizu/gry jeszcze raz – `BS.wait` zapamiętuje „moje” sprzed ciosów). Karta na Dziś (`bsHomeCard`, pierwsza na liście, ramka w kolorze przedmiotu): trwa – pasek **zabranego** życia, liczby, „Zadaj cios →” (`quizOpen` z `gryQuestions(sid, 10)`, tytuł „Cios w …”) i „albo zagraj” (Graj z tym przedmiotem); pokonany – „Odbierz +50 pkt” (`rp.bossOdbierz`: ok → `lpConfetti(46)` + banner, `already` → karta znika, `too_few` / za mało ciosów → „Zadałeś {moje} z {trzeba} ciosów…”); uciekł – „Zabrakło N% życia” + Zamknij (`localStorage["bm-boss-ukryte"]`). Kilka bossów → najbliższy termin + chip „+1 boss”. Trafienie po powrocie: rysunek mruga na czerwono i „−n” unosi się (600 ms, nic przy „Mniej animacji”). Widok `#/boss/<id>` (`viewBoss`): duży rysunek, pasek, życie / zabrane / osoby / licznik do terminu (dni i godz.), Twoje ciosy, najlepsi wojownicy (`top`, tylko pseudonimy), zwijane zasady, inne bossy. Starosta: chip „Nowy boss – ogłoś rokowi” (pokonany: „Ogłoś rokowi”) → modal z tekstem do skopiowania (`bsAnnText`), w „Gry i ranking” sekcja „Bossy” (`bsAdminSection`: „Zmień życie” → `rp.bossAdmin(id, { hp })`, „Ukryj” z `confirm` → `{ ukryty: true }`). Imiona `BOSS_NAMES` (mianownik + biernik; EN w `i18n-en.js`), dopełniacz przedmiotu `SUBJ_GEN`. Rysunki `BOSS_ART(sid, stan, kolor)`: własne płaskie SVG 120 × 120 w stylu `ART` (szablon ciało + oczy + rekwizyt, obrys `#0E5A30`, kolor przedmiotu), stany `trwa` (kołysanie `.bs-sway`), `slaby` (< 25% życia: pot i plaster), `pokonany` (leży, X zamiast oczu, gwiazdki), `uciekl` (kurz i strzałka); przedmiot bez wpisu → „Potwór z …” (kleks z rogami). CSS `.bs-*`. Konto bez pełnego dostępu i baza bez v15 (`not_enabled`): brak karty, zero błędów.
- Testy etapu 9: `node docs/gry/test/etap9.mjs` (atrapa: `mock-boss` = trwa / slaby / pokonany / malo / uciekl / dwa / brak, dobra odpowiedź z przedmiotu bossa = cios, `window.__bossyN` = licznik wywołań `nauka_bossy`; zrzuty w `$OUT/etap9/`, w tym arkusz wszystkich rysunków `arkusz-*.png`), `en-tabele.mjs` sprawdza też tabelę 6.6.
- **Wdrożenie**: Supabase → SQL Editor → wklej `supabase/skrot-v15-gry2.sql` → Run (po v13; v14 i v16 idą po nim; plik można uruchomić ponownie). Strona działa też bez niego.

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
- **kartach lekcji** – każde pogrubione (wyróżnione) słowo z treści (`b.md`, także w odpowiedziach, podpowiedziach i wyjaśnieniach po odpowiedzi) po dotknięciu otwiera panel z polskim odpowiednikiem i definicją (`lpTerms` → `termFind`). Źródła po kolei: definicje pogrubień lekcji (`materialContent.lessonTerms`, Panel AI → „Definicje w lekcjach”, także „Uzupełnij we wszystkich przedmiotach”), pojęcia lekcji, słowniczek przedmiotu, wyjaśnienia w zadaniach, `sylabus-pojecia.json`, reszta słowniczka. Pasuje nazwa z nawiasem („Intellectual property (IP)”), liczba mnoga i odmiana. Bez wpisu nigdzie (poza pytaniami): zdanie z lekcji, w którym słowo jest wyjaśnione. Nowa lekcja: uruchom „Definicje w lekcjach”, żeby każde pogrubienie miało prawdziwą definicję,
- **Panelu AI → Mapy przedmiotów z sylabusa BM** – materiał startowy (opracowanie, fiszki, quiz, prosty język) z oficjalnych tematów i efektów; zastępuje starą mapę z sylabusa.

Próbne testy: pytania z „Pytania do testów” dostają kody efektów (`ep`). Materiały, których pytania nie mają jeszcze kodów, Panel AI → „Pytania do testów” zrobi ponownie.

Przedmioty z planu łączą się po polskiej nazwie (slug). Nowy sylabus (np. na kolejny rok):
```
python3 scripts/sylabus-parse.py SYLABUS.pdf      # tworzy syl.json
python3 scripts/sylabus-build.py sylabus.json
```
Wymaga `pip install pdfplumber`.

## Lekcje v4 (`lekcje-v4.js`, `skrot-v29-powtorki.sql`)
Spec lekcji v4 (`lekcja-v4-spec.md`, wklejony w czacie 2.11.2026) jest **wdrożony w kodzie** (etapy A–C; decyzje z sekcji 11 domyślne: spadek punktów tak, A/B haczyka tak, 30 + 20 powtórek). Etap D (poprawki treści modelem) to skrypty w `scripts/lekcje-*.py` i `docs/lekcje-v4/README.md`; uruchomienie poprawek na treściach to osobna decyzja Bartka.
- **A**: po każdej lekcji fiszki i pytania `check`/`exit` trafiają do powtórek (klucze `q:<mid>:<hash>`, `d:<mid>:<atom>`, `n:<mid>:<szablon>`, od etapu rewanży też `z:<mid>:<idx>`; przedmiot i temat z klucza przez `keyMid`), w Powtórkach pytania z opcjami, zła odpowiedź wraca w sesji (maks. 3×), poziomy lekcji Zrobione → Utrwalone → Opanowane (`progress.lv` = dni powtórek), limit dnia 30 zaległych + 20 nowych (kolejność: wspólny priorytet tematu z Połączeń), jednorazowa migracja zdanych lekcji (`v4seed`).
- **B**: haczyk z biletu (test A/B `HOOK_AB`), „Pewny / Zgaduję” w bilecie (zgadnięte poprawne = jak błędne; trafia do zdarzeń nauki, `exit_ticket.odp`), „przed i po”, rozgrzewka.
- **C**: atomy i pytania rozróżniające, zadania liczbowe z szablonów `gen` (parser bez `eval`), „Wyjaśnij” z kluczem, krótsze „Prościej”.
- Termin karty liczy FSRS (patrz „Profil nauki”), poziomy v4 liczą tylko dni powtórek.
- **SQL**: `supabase/skrot-v29-powtorki.sql` (po v28; na gałęzi `lekcje/v4` był to `skrot-v22-powtorki.sql`): `nauka_rp_powtorka(klucz, ok, first, wiek)` + log `nauka_powtorki_log` do miary „czy strona uczy” (% dobrych pierwszych odpowiedzi przy wieku ≥ 7 dni). Bez niego strona woła starą wersję (bez pomiaru).
- Testy: `node --test tests/*.test.js` (`num-parser`, `poziomy`, `srs-q`), `supabase/test/v29.sql` (W1–W5), Playwright `docs/gry/test/lekcje-v4.mjs` (30/30).

## Rewanże (`rewanze.js`, bez SQL)
Etap 2 specu „Systemy z Zdawalni w Skrócie”: zeszyt błędów z Zdawalni (`matura-app/lib/domain/mistakes.ts` + `rematch.ts`, wersja z FSRS) przeniesiony 1:1.
- **Skąd**: zła albo zgadnięta („Zgaduję”) odpowiedź w quizie przedmiotu, grach, `check`/bilecie lekcji, zadaniu liczbowym lekcji i pytaniu zamkniętym próbnego testu. Pytania otwarte z oceną AI tu nie trafiają (zostają w „Co poprawić”), pytania z „Po zajęciach” też nie (nie ma ich w materiałach).
- **Zapis**: `progress.rew = { klucz: [[dzień, wynik 0–1], …] }` (jeden wpis na dzień, decyduje najgorsza odpowiedź; najwyżej 400 kluczy, 12 dni na klucz), `progress.rewPok` = liczba pokonanych (odznaka 🏆), `progress.rewDay` = rewanże rozegrane dziś. Klucze jak w Powtórkach; pytanie z quizu przedmiotu ma nowy klucz `z:<mid>:<idx>` (indeksy są stałe, bo pytania tylko dopisujemy).
- **Zasady**: rewanż wraca, gdy powie karta FSRS odtworzona z dni odpowiedzi (`SkrotLearner.memory.replayCard`; zwykle jutro, potem po 3 i po ok. 8 dniach; bez `learner.js` stałe 1 → 3 → 7). Wygrana = pełna dobra odpowiedź **innego dnia** niż błąd; trzecia wygrana z rzędu = pokonane i pytanie dalej wraca w zwykłych powtórkach (karta FSRS w `progress.srs`). Dopóki pytanie jest w zeszycie, `srsDue` pomija je w zwykłych powtórkach.
- **Widok**: w Powtórkach blok „⚔️ Rewanże” (ile dziś, ile czeka, ile pokonanych), sesja zaczyna się serią „Rewanże” (najwyżej 10 dziennie, reszta czeka bez zaległości); licznik na Dziś („W tym N rewanży”) i plakietka Powtórek liczą je razem z fiszkami.
- **Gry**: lista pomylonych w grach to teraz rewanże (`gryWrong` czyta z `progress.rew`); stara `bm-gry-zle` z localStorage przechodzi jednorazowo (`progress.rewMig` = dzień przeniesienia, potem klucz znika). Dobra odpowiedź w grze też liczy się do rewanżu.
- **Punkty**: bez nowych punktów rankingu i monet (wszystko liczy przeglądarka).
- Testy: `node --test tests/rewanze.test.js` (port testów z Zdawalni, w tym terminy FSRS 3 i 8 dni), Playwright `docs/gry/test/rewanze.mjs`.

## Ochrona wpisanych odpowiedzi (`kopie.js`, bez SQL)
Etap 3 specu „Systemy z Zdawalni w Skrócie” (port `matura-app/lib/draft-backup.ts` i zasad z `docs/error-recovery.md`): nikt nie traci tego, co wpisał.
- **Kopie**: `skrot:kopia:<miejsce>:<id>` w localStorage, najwyżej 7 dni (stare sprząta start strony), kasowane po zapisie na serwerze. Każdy dostęp w `try/catch` (tryb prywatny = brak kopii). Pole z kopią: `KOP.podepnij(pole, miejsce, id)`, przy przywróceniu okno mówi „Przywróciliśmy tekst…”.
- **Podpięte**: „Zgłoś błąd” (`zgloszenie`), własny wpis w kalendarzu (`kalendarz`, tytuł i notatka), podsumowanie „Po zajęciach” starosty (`po-temat`, `po-notatki`), otwarte odpowiedzi próbnego testu (`test:<start>:<id>`, obok całego testu w `bm-exam-run`; znikają po ocenie albo przerwaniu). „Wyjaśnij” w lekcji ma kopię w stanie lekcji (`bm-pl:*`, zapis przy każdym znaku). Staś nie ma pola do pisania.
- **Test próbny bez sieci**: oddanie bez internetu nie przechodzi na samoocenę. Test czeka w „Sprawdzamy odpowiedzi…” z komunikatem „Nie zapisało się, spróbuję jeszcze raz” i wysyła je do AI po powrocie sieci (albo co 15 s); student może też wybrać „Oceń sam według klucza”. Funkcja `grade-open` liczy ponowienie tego samego testu raz.
- **Zapis odpowiedzi w bazie** (`skrot-supabase.js`): `nauka_rp_odpowiedz`, `_zadanie`, `_powtorka`, `_lekcja`, `_po`, `_stas` bez sieci trafiają do kolejki `skrot:kopia:zapisy` (max 200, 7 dni) i idą ponownie po powrocie sieci, co 20 s i po zalogowaniu. Strona mówi raz na minutę „Nie zapisało się, spróbuję jeszcze raz”, po wysłaniu „Zapisane ✓”. Punkt liczy baza tylko za pierwszą odpowiedź, więc ponowienie nie dubluje punktów. Zapis postępu (`flushProgress`) i zdarzenia nauki (`bm-learn-q`) już wcześniej czekały na sieć.
- Testy: `node --test tests/kopie.test.js`, Playwright `docs/gry/test/kopie.mjs` (odświeżenie w połowie testu, `context.setOffline` przy oddaniu i w quizie, zgłoszenie, kalendarz). Atrapa Supabase przy `setOffline` zwraca „Failed to fetch” jak prawdziwe supabase-js.

## Usuwanie konta i kasowanie starych danych (`skrot-v32-usun-konto.sql`, `skrot-v33-retencja.sql`, `functions/usun-konto`)
Etap 4 specu „Systemy z Zdawalni w Skrócie”.
- **Ekran**: Ustawienia → Konto → „Usuń konto” (`#/usunKonto`): co zniknie, ostrzeżenie o opłaconym dostępie, potwierdzenie wpisanym własnym e-mailem. Konto administratora tak się nie usuwa.
- **Funkcja Edge `usun-konto`** (JWT): 1) anuluje żywe subskrypcje w Stripe (z `nauka_dostep.stripe_subscription` i z klientów Stripe o tym e-mailu); gdy Stripe nie odpowie, nic nie usuwa, 2) `nauka_konto_usun_dane` kasuje dane, 3) usuwa konto w Auth, 4) `nauka_konto_slady` sprawdza, że nic nie zostało. Sekret `STRIPE_SECRET_KEY` (klucz ograniczony: Customers – Read, Subscriptions – Write). Bez klucza konto z subskrypcją nie zostanie usunięte.
- **SQL v32**: funkcja przechodzi po **każdej** tabeli w `public` z kolumną `user_id` albo `email` (nowe tabele też), więc nie trzeba jej poprawiać przy nowych migracjach. Ręcznie: `nauka_docs` (postęp i „Moje materiały” znikają, zgłoszenia zostają bez autora), `nauka_polecenia` (własne polecenia znikają, zakup przez cudze polecenie zostaje bez danych kupującego), `nauka_admini` (odmowa). Decyzja D3: z bazy znika wszystko, historia transakcji zostaje w Stripe (do potwierdzenia z księgową). „Moje materiały” nie używają Storage, więc plików nie ma.
- **SQL v33 (retencja)**: `nauka_retencja()` codziennie o 2:30 UTC przez pg_cron (zadanie `skrot-retencja`), okresy w nagłówku pliku. Punkty rankingu, monety, postęp, dostęp, zgody i polecenia nie są kasowane z czasem.
- Testy: `supabase/test/v32.sql` (U1–U8: konto z danymi z wcześniejszych testów, po usunięciu zero śladów, inna osoba nietknięta), `test/v33.sql` (T1–T4), Playwright `docs/gry/test/usun-konto.mjs`.

## Lista oczekujących i panel kierunków (`zapisy.js`, `skrot-v34-oczekujacy.sql`, `functions/zapisz-sie`)
Etap 5 specu „Systemy z Zdawalni w Skrócie” (port `matura-app/lib/waitlist.ts`).
- **Zapis bez logowania**: ekran wejścia → „Inny kierunek” (formularz zamiast maila) i przycisk na plan.skrotbm.pl (`skrotbm.pl/?zapisz=plan`, repo `plan-bm`). Kierunek z listy (I/II stopień, rok z planów uczelni) albo „Nie ma mojego kierunku” z wpisaną nazwą; zgoda na jeden mail; ukryte pole-pułapka na boty.
- **Funkcja `zapisz-sie`** (bez JWT): sprawdza pola, limit 5 zapisów z jednej sieci na godzinę (skrót IP z solą, po dobie znika), mail przez Resend z linkami „Potwierdź” i „Usuń mój zapis”. Odpowiedź jest ta sama dla nowego, czekającego i potwierdzonego adresu; mail ponownie najwyżej co 10 min i 4 razy. Linki prowadzą na `#/zapis/potwierdz.<token>` / `usun.<token>`: potwierdza dopiero przycisk (skanery poczty otwierają linki). Sekrety: `RESEND_API_KEY`, `RESEND_FROM`, opcjonalnie `ZAPISY_SALT`.
- **Kierunki** z publicznej strony planów WEFiZ: `node scripts/kierunki-wefiz.mjs` (≤ 1 zapytanie/s) → `supabase/kierunki-wefiz.json` → `node scripts/kierunki-sql.mjs` wpisuje je do v34 (`nauka_kierunki.lata`, `zapisy`). Raz w roku, gdy uczelnia opublikuje plany.
- **Panel** (Narzędzia starosty → „Kierunki”, tylko administrator): potwierdzone zapisy na kierunek i rok, wpisane nazwy pogrupowane, źródła, CSV (średnik, BOM). Niepotwierdzone się nie liczą; niepotwierdzone i wypisane znikają po 30 dniach. Usuwanie konta (v32) obejmuje też ten zapis (kolumna `email`).
- Testy: `node --test tests/zapisy.test.js`, `supabase/test/v34.sql` (O1–O10), Playwright `docs/gry/test/zapisy.mjs`.

## Lejek i retencja bez cookies (`lejek.js`, `skrot-v35-lejek.sql`)
Etap 6 specu „Systemy z Zdawalni w Skrócie” (port `matura-app/lib/data/analytics.ts`, `lib/data/retention-metrics.ts`, `lib/domain/learner/metrics.ts`).
- **Wejścia bez cookies**: `skrot-supabase.js` woła `nauka_wejscie` najwyżej raz dziennie na przeglądarkę (flaga `bm-wejscie` = data w localStorage). Baza dodaje 1 do sumy dnia × rocznik (`skrot-rocznik`, jeśli wybrany) × źródło (`?z=`, też `?zrodlo=`/`?zapisz=`). Bez osoby, IP i urządzenia; najwyżej 50 źródeł dziennie, reszta jako „inne”.
- **Lejek z kont** (kohorta kont założonych w okresie): konto → wybrany kierunek (`rocznik_wybrany_at`) → okres próbny (`nauka_proby`) → zakup (`nauka_dostep`, `zrodlo` Stripe). Osobno: potwierdzone zapisy na listę oczekujących. Konta administratorów się nie liczą.
- **Retencja**: dzień nauki = zdarzenie nauki (bez testu profilu) albo powtórka. D1 / D7 (dni 7–13) / D30 (dni 30–36) jak w Zdawalni; mediana dni nauki w 4 ostatnich tygodniach.
- **„Czy strona uczy”**: % dobrych pierwszych odpowiedzi w powtórkach po ≥ 7 dniach (`nauka_powtorki_log`) na przedmiot i tydzień; rewanże wygrane / wszystkie (zdarzenie `activity` z `kind: "rewanz"`, wysyła je `rewAnswer` przez `learnEvent`); test A/B haczyka (pole `hak` w `exit_ticket`: `haczyk` / `bez` / `wlasny`).
- **Nocne podsumowanie** (`pg_cron` `skrot-lejek`, 3:15 UTC) do `nauka_lejek_dzien`: jeden wiersz na rocznik z `nauka_roczniki` + `*` (wszystkie) + `''` (konta bez profilu). Nowy rocznik pojawia się w panelu sam. Historia i sumy wejść 400 dni.
- **Panel** Narzędzia starosty → „Lejek i retencja” (`#/lejekAdmin`, tylko administrator, w bazie `nauka_admin()`): wybór rocznika, 28 dni / od początku, „Przelicz teraz”. Grupy < 5 ukrywa `lejek.js` („< 5”).
- Testy: `node --test tests/lejek.test.js`, `supabase/test/v35.sql` (L1–L12), Playwright `docs/gry/test/lejek.mjs`.

## Przypomnienia mailem (`przypomnienia.js`, `skrot-v36-przypomnienia.sql`, funkcja `przypomnienia`)
Etap 7a specu „Systemy z Zdawalni w Skrócie” (port `matura-app/lib/domain/notifications.ts`, `reminder-voice.ts`, `lib/reminder-email.ts`, `notification_log`). Opis i kroki: `docs/zdawalni/etap-7.md`.
- **Ustawienia → Przypomnienia** (`#/ustawienia/przypomnienia`): włącz/wyłącz, godzina 6:00–22:00 co 30 min, co przypominać (zaliczenia za 7/3/1 dzień, zaległe powtórki i rewanże, Zadanie dnia). Domyślnie wyłączone, 18:00. Na Dziś karta „Przypomnieć Ci mailem?” z jednym przyciskiem „Włącz”, gdy jest zaliczenie w ciągu 14 dni (tylko pełny dostęp).
- **Wybór treści** w `przypomnienia.js` (bez DOM, testy `tests/przypomnienia.test.js`): zaliczenie → powrót po ≥ 4 dniach → powtórki i rewanże → Zadanie dnia; nauka dziś albo nic do przypomnienia → brak maila; dławienie zignorowanych jak w Zdawalni. Funkcja Edge ma kopię `supabase/functions/przypomnienia/logika.js` (po zmianie `cp przypomnienia.js supabase/functions/przypomnienia/logika.js`; test sprawdza, że są identyczne).
- **Stan** liczy strona (`stanZ`: terminy z „Przygotuj się”, liczby zaległych na 8 dni) i zapisuje go przy włączonych przypomnieniach (`nauka_przypomnienia_stan`); serwer sprawdza aktualne daty terminów starosty.
- **Wysyłka**: `pg_cron` co 15 min → `nauka_przypomnienia_wyzwol()` → `pg_net` → funkcja `przypomnienia` (sekret `PRZYPOMNIENIA_CRON`, w Vault `przypomnienia_cron` i `przypomnienia_url`) → `nauka_przypomnienia_kandydaci` → Resend. Najwyżej jeden mail dziennie (unikalne user + dzień w `nauka_przypomnienia_log`), najwyżej 60 na dobę UTC (Resend Free). Wypisanie: `List-Unsubscribe` + `List-Unsubscribe-Post` (one-click) i strona `przypomnienia.html#t=<token>`. Link z maila `?pz=<id>` oznacza przypomnienie jako otwarte.
- Testy: `node --test tests/przypomnienia.test.js` (też funkcja Edge z atrapą Resend), `supabase/test/v36.sql` (P1–P12), Playwright `docs/gry/test/przypomnienia.mjs`. Push (7b) jeszcze nie.

## „Ile masz dziś czasu?” i „Jedno zadanie” (`dzien.js`, bez SQL)
Etap 8 specu „Systemy z Zdawalni w Skrócie” (port 1:1 `matura-app/lib/domain/fit-day.ts` i `one-task.ts` z testami). Opis: `docs/zdawalni/etap-8.md`.
- **Jedno zadanie**: drugi przycisk w karcie „Teraz zrób to” na Dziś, pod dużym przyciskiem. Otwiera jedną rzecz, pierwszą pasującą: rewanż na dziś (sesja z 1 kartą) → najstarsza zaległa powtórka (1 karta) → temat z najwyższym wspólnym priorytetem (`topicPriority`; te same tematy co karta: krok planu, potem zakres zaliczenia) → kolejny materiał (`nextToLearn`, jak karta). Bez rewanży i zaległości wskazuje to samo co karta.
- **Ile masz dziś czasu?**: panel pod kartą z 5 / 15 / 30 / 60 min. Po wyborze lista na dziś w kolejności ważności: rewanże (~2 min) → powtórki (~3 karty/min) → krok planu „Przygotuj się” → osobiste Zadanie dnia (~5 min) → temat albo lekcja (jej długość, gdy znana), przycięta `fitDay` (ostatni element skrócony w krokach po 5 min, próbny test nigdy nie jest cięty); przy 5 min jedna rzecz. Skrócona powtórka bierze tylko część kart (`reviewStart(sid, { keys })`). Wybór pamięta przeglądarka do końca dnia (`bm-czas`), drugi klik chowa listę.
- Logika bez DOM w `dzien.js` (`window.SKROT_DZIEN`), testy `node --test tests/dzien.test.js`, Playwright `docs/gry/test/dzien.mjs`.

## Mini-sprawdziany i „Pewny / Zgaduję” (`sprawdzian.js`, bez SQL)
Etap 9 specu „Systemy z Zdawalni w Skrócie” (port 1:1 `matura-app/lib/domain/checkpoint.ts` i `lib/domain/learner/calibration.ts` z testami). Opis: `docs/zdawalni/etap-9.md`.
- **Pewny / Zgaduję**: chipy z biletu lekcji v4 także w quizie (materiału i przedmiotu), w mini-sprawdzianie i przy pytaniach zamkniętych testu próbnego, najwyżej przy co 3. pytaniu (`askConfidenceNow`: 1., 4., 7.…; w teście liczone tylko zamknięte). Wybór jest dobrowolny. Zapis: zdarzenie nauki `activity` z `kind: "pewnosc"` (`learnEvent`, bez nowego typu w bazie) i licznik `progress.kal` (`s`/`g` = [odpowiedzi, dobre]). Zgadnięta dobra odpowiedź idzie do rewanżu jak błędna (`rewQuiz(mid, idx, false)`); punkty rankingu (`nauka_rp_odpowiedz`) bez zmian.
- **Profil nauki → „Pewny czy zgadujesz?”**: „Gdy mówisz „Pewny”, masz rację w X% odpowiedzi” od 20 odpowiedzi z wybraną pewnością (licznik `progress.kal`: bilety lekcji, quizy, testy próbne, sprawdziany); wcześniej „Jeszcze N odpowiedzi…”.
- **Mini-sprawdzian**: gdy „umiesz z zakresu” przedmiotu (`knowOf`, najbliższe zaliczenie) ≥ 70% (D7) i jest co najmniej 6 pytań, których osoba jeszcze nie widziała (quiz: `bm-q-seen` i rewanże; `check`/`exit` i `gen` lekcji: lekcja nieruszona i pytanie nie w powtórkach), karta „Teraz zrób to” na Dziś proponuje „Sprawdź się: <przedmiot>” (niski priorytet: po planie, terminach i powtórkach; „Później” chowa na 3 dni). 6 pytań, jeden temat na pytanie, ważniejsze tematy (`topicPriority`) najpierw. Zdany = 5 z 6: odznaka przy przedmiocie (hero i lista Przedmiotów); niezdany: tematy do powtórki (ekran końcowy i hero przez 14 dni), kolejna szansa po 7 dniach. Bez XP, punktów rankingu i monet. Zapis: `progress.spr["<sid>|<część>"]` (rekordy jak `checkpoint_tests` w Zdawalni) + zdarzenie `activity` `kind: "sprawdzian"`.
- Logika bez DOM w `sprawdzian.js` (`window.SKROT_SPR`), testy `node --test tests/sprawdzian.test.js`, Playwright `docs/gry/test/sprawdzian.mjs`.

## Paczka i duet tygodnia (`paczka.js`, `skrot-v37-paczka.sql`)
Etap 10 specu „Systemy z Zdawalni w Skrócie” (port 1:1 `matura-app/lib/domain/squad.ts` i `duo.ts` z testami, bez rankingu, lig i szturchnięć). Opis: `docs/zdawalni/etap-10.md`.
- **Paczka** (Więcej → Ty → „Paczka i duet”, `#/paczka`): 2–8 osób, międzykierunkowa (bez `rocznik_id`), jedna na osobę, kod 6 znaków i link `skrotbm.pl/?paczka=KOD`. Każdy widzi o innych tylko pseudonim (`nauka_profil.nick`, bez niego „Osoba N”), czy była dziś nauka i ile dni nauki w tym tygodniu. Wspólny cel tygodnia: 70% z 3 dni nauki na osobę. Właściciel usuwa osoby; gdy wychodzi (albo usuwa konto), prowadzenie przejmuje osoba najdłużej w paczce, ostatnia osoba = paczka znika.
- **Link**: `?paczka=KOD` zapisuje kod w `localStorage` („skrot-paczka-kod”) i usuwa go z adresu; bez logowania ekran logowania mówi, że kod czeka; po zalogowaniu okno „Dołączyć do paczki: …?”.
- **Duet tygodnia**: propozycja → przyjęcie; razem 8 sesji pon–nd (sesja = dzień nauki jednej osoby, jak „dzień nauki” w v35), liczone od dnia przyjęcia. Po osiągnięciu celu baza daje obu po 20 🪙 (`nauka_monety`, źródło `misja`, klucz `misja:duet:<poniedziałek>`, raz w tygodniu na osobę) — wyzwalacz po zdarzeniu nauki / powtórce i otwarcie widoku (też za miniony tydzień). Ranking (`nauka_rp`) i statystyki rocznika bez zmian.
- Dostęp tylko przez funkcje (`nauka_paczka`, `_zaloz`, `_podglad`, `_dolacz`, `_wyjdz`, `_usun_osobe`, `nauka_duet_zapros`, `_odpowiedz`, `_zakoncz`); `skrot.paczka` w `skrot-supabase.js`. Logika bez DOM w `paczka.js` (`window.SKROT_PACZKA`), testy `tests/paczka.test.js`, PGlite `supabase/test/v37.sql`, Playwright `docs/gry/test/paczka.mjs`.

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

## Dorób pytania (+10)
Panel AI → **Dorób pytania (+10)** (tylko starosta): każdy materiał roku z zaznaczonych przedmiotów (domyślnie wszystkich, które mają materiały roku; „Zaznacz / Odznacz wszystkie”) dostaje 10 nowych pytań quizu, więc z 10 robi się 20, oraz „Dlaczego?” do nich. Panel pokazuje, ile materiałów i pytań zostanie dorobionych, ma pasek postępu i „Zatrzymaj po bieżącym”; ponowny Start pomija materiały, które już mają 20 pytań (`materials.quizPlus = { base, why }` pamięta, ile było przed dorobieniem i czy „Dlaczego?” jest gotowe).
- AI dostaje tylko nasze opracowanie (`materialContent`: tematy, pojęcia, „o co chodzi / po co / co zapamiętać”) i listę istniejących pytań z prośbą, żeby ich nie powtarzać ani nie przeformułowywać. Tekstu slajdów nigdy.
- Nowe pytania: ten sam format (`q`, `options`, `correct`, `explanation`, `slide`/`slides`, gdy materiał ich używa, `ep`, gdy stare pytania mają kody efektów), 4 opcje albo prawda/fałsz (najwyżej 3 na materiał), po wszystkich tematach, więcej „zastosuj / co się stanie, gdy / który przykład pasuje” niż definicji; w Analizie ok. połowa, a w materiałach z rozwiązanymi zadaniami 2–4 pytania z krótkim liczeniem (dystraktory = typowe błędy).
- Kontrola podobieństwa: to samo porównanie ciągów 7 słów co przy slajdach (`overlapCheck`), tu między pytaniami, plus porównanie słów dla krótkich pytań i przeformułowań (`mqTooSimilar`). Odrzucone pytania AI dorabia jeszcze najwyżej 2 razy.
- `quizWhy/<id>` dostaje wpisy pod nowymi indeksami (10–19); stare wpisy zostają bez zmian. `quizCount` w `materials/<id>` jest aktualizowany (quiz z przedmiotu, próg gier `GRY_MIN_Q`). „Moje materiały” i inne przedmioty nie są ruszane.

**Zasada: pytania quizu tylko dopisujemy na koniec tablicy `quiz`.** Nigdy nie zmieniamy kolejności ani treści starych pytań i ich nie usuwamy: indeks pytania (`mid` + `idx`) jest w `nauka_odp`, `quizWhy`, `bm-gry-zle`, `bm-q-seen` i w punktach rankingu, więc przesunięcie zepsułoby postęp i ranking.

**Najpierw niewidziane.** Quiz z całego przedmiotu (`subjectQuizQs`) i gry (`gryQuestions`) zamiast czystego losowania dają najpierw pytania, których ta osoba jeszcze nie widziała, potem widziane najdawniej. Widziane = odpowiedź w quizie albo w grze, zapisane w `localStorage["bm-q-seen"]` = `{ "mid:idx": dzień }` (max 2000 wpisów, najstarsze wypadają; `qSeen`, `qFreshFirst`). Kolejność w grach: pomylone → niewidziane z zakresu najbliższego zaliczenia → niewidziane reszta → widziane od najdawniej. Bez zmian w SQL i w punktach. Test: `docs/gry/test/pytania-plus.mjs`.

## Odwołania z Teams (Narzędzia starosty → Odwołania z Teams, `#/odwolania`)

- Ogłoszenie z Teams (`tasks`) ze słowem „odwołane / cancelled” daje propozycję wpisów w formacie komunikatu dziekanatu (`odwGuess`: daty „3 i 4.11”, „03.11.2026”, „3 listopada”; przedmiot z `subjectId` albo z nazwy; rodzaj zajęć z „wykład / ćwiczenia / lab”). Propozycja sama nic nie zmienia.
- Starosta widzi ją w „Ostatnio dodane” na Dziś (pasek „To odwołanie?”: Zatwierdź / Popraw / Odrzuć), na ekranie `#/odwolania` i w oknie ogłoszenia („To odwołanie lub przeniesienie”, także ręcznie, z nową datą, godziną i salą).
- Zapis: `meta/odwolania` = `{ items: { <id>: { tid, kind, title, z: { C112: [wpisy] } } }, rejected }`. `dzList()` dokłada te wpisy do `PLAN.dziekanat.zmiany`, więc działają w `classesDz()` (Kalendarz, Dziś, „Jutro masz…”, Po zajęciach) i w `meetingsOf()`.
- Numeracja „Zajęcia 3 z 8 · prawdopodobny temat” liczy tylko zajęcia, które się odbyły (bez odwołanych, z odrabianiem). Godziny na spotkanie liczymy z planu bez odwołań, więc odwołane zajęcia przesuwają tematy o jedno spotkanie, a ostatnie spotkanie bierze resztę.
- Plan.skrotbm.pl i link .ics: `plan-bm/scripts/dziekanat.mjs` czyta zatwierdzone wpisy funkcją `nauka_odwolania_publiczne()` (**`supabase/skrot-v26-odwolania.sql`**, trzeba uruchomić) i dopisuje je do `plan.json` (`src: "teams"`). Funkcja `kalendarz` nakłada teraz `dziekanat.zmiany` (tytuł „ODWOŁANE: …”, odrabianie) – wymaga ponownego wdrożenia.
- Test: `docs/gry/test/polaczenia-1.mjs`.

## Wspólny priorytet tematu (`topicPriority`)

- `topicPriority(m)` → `{ p, why, ex, next, inScope, weak, taught, core }`: zaliczenie, którego zakres (`scopeOf`) obejmuje temat (data z `examDate`, więc też własna data z `examSet`), słabe wyniki (`topicScore` + `gryWrong`), czy temat był już na zajęciach (kody `sylRef` lekcji i `topicAt` po odwołaniach), ★ kluczowy (`m.core`). `why` to gotowe powody („OWI: kolokwium za 19 dni · słabo w quizach”), w EN pisane w kodzie (`PRIO_EN`).
- Czytają: `srsDue` (zaległe po priorytecie, nowe najpierw z zakresu najbliższego zaliczenia, potem omówione na zajęciach), podpowiedź na górze Powtórek (`studyHint`), `stasHomeCard` (po priorytecie, „Inny temat ↻”), `poSuggest` (`poPrio` zamiast premii za zaliczenie), `gryQuestions` (zakres najbliższego zaliczenia: `topicPriority().next`, kolejność gier bez zmian).
- Test: `docs/gry/test/polaczenia-2.mjs`.

## Plan „Przygotuj się” i własne daty zaliczeń wszędzie

- `studyPlans()`: plany osób z pełnym dostępem, gdy zaliczenie jest w ciągu 21 dni (`PLAN_NEAR`) albo plan był otwarty (`examSet().planAt`). Z nich: „Teraz zrób to” na Dziś (`planToday`, krok z największym priorytetem; fiszki jako druga karta `nowSecond`), Kalendarz („Plan nauki”, `planDaysOn`, dotknięcie otwiera plan) i kopia dni w `progress.planDays` (`planSync`) dla linku .ics.
- Własna data (`examSet().date`) w `termItems()` zastępuje u tej osoby terminy tej części (także szacowane), z plakietką „Twoja data” (`ownBadge`).
- „Mój wpis” ma rodzaj „Zaliczenie / kolokwium”; po zapisie z przedmiotem pyta, czy ustawić datę zaliczenia (`saveExamSet`), wtedy nie zostaje osobny wpis.
- Link do kalendarza w telefonie: **`supabase/skrot-v27-kalendarz-moje.sql`** (trzeba uruchomić) oddaje `moje`, `zaliczenia` i `plan`; funkcja `kalendarz` dopisuje „✏️ Mój wpis: …”, „📅 Twoja data: …”, „📘 Plan: …” i chowa szacowany termin części z własną datą (wymaga ponownego wdrożenia).
- Test: `docs/gry/test/polaczenia-3.mjs`, `supabase/test/v27.sql`.

## Wspólne zdarzenie nauki (`learnEvent`, SQL v28 i v30)

- **Jedyne wejście zdarzeń nauki.** `learnEvent` wysyła też zdarzenie do bazy (`learnTrack` → `skrot.learn.track` → `nauka_zdarzenia`, SQL v30): fiszka → `review_graded` (`ev`: karta, ocena, dni od ostatniej), lekcja → `exit_ticket` (`ev.odp` = `[dobrze 1/0, pewność 1/0/null]` przy każdym pytaniu biletu, „Pewny / Zgaduję” z v4 B2), test „Jak się uczysz?” → `profile_test`, reszta (quiz, gra, Po zajęciach, Staś…) → `activity` (rodzaj, temat, wynik). `review_graded`, `exit_ticket` i `activity` idą także przy wyłączonym „Ucz się na moich danych” (potrzebne do działania: powtórki, seria, przypomnienia, duet). Nowe aktywności wołają `learnEvent`, nie `learnTrack`.

- `learnEvent({ kind, materialId, ok, total, xp, once })`: XP przez `xpFlush` (seria, cel dnia), wynik do `progress.learn[mid]` (topicScore: źródło `act` z Po zajęciach i Stasia; temat ćwiczony dziś ma niższy priorytet). Wołają: quiz (`saveScore`), lekcja (bilet), fiszki (`srsGrade`), gry (`GRY_API.rp.odp`), Po zajęciach, Staś.
- Po zajęciach: pierwsze przeczytanie +10 XP, dobra odpowiedź w „Sprawdź się” = `LP_XP.mc` XP (raz dziennie) + `rpSend("po")` → **`nauka_rp_po`** (10 pkt = 1 🪙, pula quizu). Zła → `gryWrong` + `bm-po-zle` (wraca w grach od następnego dnia i w „10 minut przed snem”). „Dodaj pojęcia do fiszek” → karty `g:<sid>:…` z kopią w `progress.poTerms`. Link „Pełna lekcja” (`poLesson`: `sylRef`, temat z numeru zajęć, `lessonTwin`).
- Staś: „Sprawdź ✓” → **`nauka_rp_stas`** (10 pkt za prawdziwy błąd, raz dziennie), „Gotowe” → `learnEvent` (wynik do tematu, XP), link do lekcji.
- **`supabase/skrot-v28-zdarzenia-nauki.sql`** (trzeba uruchomić po v27): `nauka_rp_po`, `nauka_rp_stas`, osobiste Zadanie dnia. Bez niej XP działa, monet za Po zajęciach i Stasia nie ma.
- Test: `docs/gry/test/polaczenia-4.mjs`, `supabase/test/v28.sql`.

## Osobiste Zadanie dnia (SQL v28)

- W Sklepie → Zadania dnia: 3 wspólne zadania dnia i zadanie tygodnia zostają (te same dla roku, ranking uczciwy), a nad nimi „Twoje zadanie dnia” (`personalMission`): dzisiejszy krok planu → sprint z przedmiotu z zaliczeniem w ciągu 21 dni → 5-minutówka z ostatnich zajęć → Staś → sprint z przedmiotu o najwyższym priorytecie.
- Wybór zapisuje baza raz dziennie (`nauka_misja_osobista_ustaw`, ostateczny), postęp liczy z `nauka_rp`, nagroda 8 🪙 przez `nauka_misja_odbierz("osobista")`. Bez v28 karta się nie pokazuje.
- Test: `docs/gry/test/polaczenia-5.mjs`.

## Jeden licznik tematów (`topicsOf`)

- Temat do zaliczenia = lekcja albo materiał z zajęć, który nie jest dodatkiem do lekcji o tym samym temacie (`lessonTwin`, „to osobny temat” = `keep`). `topicsOf(sid)` → `{ main, extra, mine }`; `knowOf` liczy `main`, więc Dziś, Przedmioty, strona przedmiotu i mapa pokazują tę samą liczbę. Na mapie dodatki (prezentacje do tematów z lekcją i Moje materiały) są w rzędzie „dodatkowe”. Przygotuj się: `scopeOf` = ta sama lista bez tematów wyłączonych z danego zaliczenia.
- Test: `docs/gry/test/polaczenia-6.mjs`.

## Projekty w Terminach (`#/projekt/<klucz>`)

- Projekt albo prezentacja z przedmiotu i datą (`isProject`) ma w Terminach strzałkę (jak kolokwium) i przycisk „Plan projektu” w okienku terminu.
- Ekran: co oddać i ile procent oceny (`projRules`: zasady zaliczeń `ZAL`, sylabus `grading`, opis z Teams), etapy liczone wstecz od terminu (`projStages`, zapisane przy pierwszym otwarciu), lista kontrolna w `progress.projects[klucz]`, „Dodaj etapy do kalendarza” → Twoje wpisy rodzaju „Etap projektu” (Kalendarz i link .ics po v27).
- Test: `docs/gry/test/polaczenia-7.mjs`.

## Po zajęciach w 5 minut
Krótkie podsumowanie zajęć dla kogoś, kto nie był albo nie słuchał: klikasz przedmiot, wybierasz, o czym były zajęcia, i w 5 krokach (po ok. minucie) dostajesz wyjaśnienie po polsku z angielskimi terminami, na końcu „Zapamiętaj” (3 rzeczy), pojęcia EN–PL i 3 pytania sprawdzające.
- **Wejścia:** karta na górze ekranu Dziś w dniu zajęć (po ich końcu, także następnego dnia), link „⚡ Co było? 5 min →” przy zakończonych zajęciach na liście „Dziś masz…”, przycisk w okładce przedmiotu, Więcej → „Po zajęciach w 5 minut” (`#/po`, `#/po/<przedmiot>`, czytnik `#/po5/<id>`). Przeczytane: `localStorage["bm-po-seen"]`.
- **Skąd temat:** podsumowanie „z zajęć” od starosty z datą ma pierwszeństwo; bez niego temat z sylabusa według szacunku `topicAt` (kolejne zajęcia = kolejne tematy według godzin).
- **Starosta** (tryb starosty, w `#/po/<przedmiot>`): „Przygotuj brakujące z sylabusa” robi podsumowania wszystkich tematów wykładu/ćwiczeń (gotowe pomija, można zatrzymać), „+ Dodaj z dzisiejszych zajęć” robi podsumowanie z notatek (data, forma, temat z sylabusa albo własny, opcjonalnie nasz materiał jako podstawa) i od razu je publikuje; „Zrób od nowa”, „Usuń”. AI (`S.sample`, funkcja `claude`) dostaje temat, cele i efekty z sylabusa, notatki i nasze opracowanie, nigdy tekst slajdów.
- **Zapis bez SQL:** `meta/po` = spis `{ items: { id: { sid, k, t, syl, d, at } } }`, treść w `meta/po~<id>`. Kolekcję `meta` czytają osoby z dostępem, zapisuje starosta. Treść jest po polsku i ma `translate="no"` (jak „Prościej · PL”).
- Test: `docs/gry/test/po-zajeciach.mjs` (Playwright na atrapie, zegar ustawiony na piątek 6.11.2026).

## Stażysta Staś, który się myli
Staś, nowy stażysta, tłumaczy temat z sylabusa (9–12 zdań po polsku z angielskimi terminami), ale 3 zdania są merytorycznie złe. Student ma tyle „czerwonych długopisów”, ile jest błędów, klika zdania, które uważa za złe, i naciska „Sprawdź”. Trafione błędy poprawia, wybierając jedną z 3 wersji (dobra poprawka + 2 błędne), przegapione od razu widzi z poprawką i wyjaśnieniem. Wynik: znalezione błędy (minus zaznaczone dobre zdania) + dobre poprawki, maks. 2 × liczba błędów. Uczy przez efekt nauczyciela: poprawiając kogoś, rozumiesz głębiej.
- **Wejścia:** Więcej → „Stażysta Staś” (`#/stas`, `#/stas/<przedmiot>`, ćwiczenie `#/stasx/<id>`), przycisk „🤓 Popraw Stasia” w okładce przedmiotu (gdy są gotowe wyjaśnienia), karta na ekranie Dziś (jeden niepoprawiony temat, najpierw z dzisiejszych zajęć, znika po poprawieniu Stasia tego dnia), pytanie w FAQ przewodnika. Wyniki (najlepszy): `localStorage["bm-stas-done"]`. Pełna wersja (paywall jak w „Po zajęciach”).
- **Starosta** (w `#/stas/<przedmiot>`): „Przygotuj brakujące z sylabusa” (gotowe pomija, można zatrzymać), „Zrób wyjaśnienie Stasia” / „Zrób od nowa” przy każdym temacie. AI (`S.sample`, funkcja `claude`) generuje raz, studenci tylko klikają: bez kosztów AI na żywo. `stasClean` odrzuca odpowiedź z mniej niż 6 zdaniami albo innym niż 2–4 błędami.
- **Zapis bez SQL:** `meta/stas` = spis `{ items: { id: { sid, k, t, n, at } } }`, treść w `meta/stas~<id>` = `{ title, sentences: [{ text, isWrong, fix, alts, why }], at }`. Id jak w „Po zajęciach” (`<sid>~<forma>~<skrót tematu>`).
- Test: `docs/gry/test/stazysta-stas.mjs` (Playwright na atrapie, 34 sprawdzenia).

## Jeszcze prościej (Analiza matematyczna)
W Analizie matematycznej każde wyjaśnienie da się kliknąć: „O co chodzi”, każdy temat opracowania, każda część lekcji (widok tekstowy i karty, przycisk „🤔 Nie łapię”) i każdy przykład w „Zadaniach krok po kroku”. Kliknięcie w tekst albo w przycisk „💡 Nie łapię – wytłumacz prościej” otwiera okno z DUŻO prostszą wersją po polsku (2–4 krótkie zdania, obrazki z życia, angielski termin w nawiasie) i łatwym przykładem na małych liczbach, policzonym krok po kroku.
- Powstaje z góry w **Panelu AI → Jeszcze prościej (Analiza)** (tylko starosta, funkcja `claude`, ok. 1–2 min na materiał). Gotowe bloki są pomijane, więc można przerwać i wrócić. Bez wygenerowania przyciski się nie pokazują.
- Zapis: osobny dokument `materialSimple/<id>~ez` = `{ items: { klucz: { t, ex } }, at }`, żeby „Prościej · PL” i paczki go nie nadpisywały. Klucz = rodzaj bloku (`o` o co chodzi, `t` temat, `s` część lekcji, `w` przykład) + skrót tekstu bloku (`ezBlocks` w `index.html`): po zmianie opracowania stare wyjaśnienie przestaje pasować i znika, a ponowny Start w Panelu AI robi nowe. Bez SQL.
- Inne przedmioty: dopisz id do `EZ_SUBJ`. Materiały oznaczone jako darmowe nie pokazują tej wersji osobom bez dostępu (reguła `nauka_darmowy` patrzy na id materiału).
- Test: `docs/gry/test/jeszcze-prosciej.mjs`, Playwright na atrapie (Panel AI generuje, bloki klikalne w opracowaniu, lekcji i zadaniach, inne przedmioty bez zmian).

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
- **Tryb przed kolokwium** – przycisk w przedmiocie, przy formie zaliczenia i przy terminie. Plan na dni do zaliczenia (`dayPlan`: tematy, których jeszcze nie umiesz, rozłożone równo do daty, najsłabsze najpierw; ostatnie 7 dni to powtórki i dzień przed zaliczeniem próbny test; na ekranie 3 najbliższe wiersze, reszta pod „Cały plan”; minuty dziennie liczone z planu), zakres bez dubli (stary materiał z prezentacji o tym samym co lekcja albo jej dział – `lessonTwin`, podobieństwo tytułów bez słów typu „lecture slides” – jest w zwiniętej sekcji „Dodatkowo”, poza planem i licznikiem tematów; przycisk „To osobny temat” zapisuje wyjątek w `exams[…].keep`), zakres, kluczowe tematy (starosta oznacza ★ w materiale) i próbny test z timerem: pytania z `examBank` (Panel AI → „Pytania do testów”), a gdy ich brak, z quizów, fiszek i zadań. Szablon testu (czas, próg, sekcje) w Panelu AI; domyślny wynika z formy zaliczenia w sylabusie. Pytania otwarte ocenia AI (`grade-open`, niżej), a bez niej student sam według rubryki.
- **Ściągawki** – jedna strona A4 na materiał albo przedmiot, drukowanie przez przeglądarkę („Zapisz jako PDF”), w stopce e-mail kupującego.

## „Przygotuj się” 2.0: ocena AI, testy wcześniej, plan naprawczy (`skrot-v25-ocena-ai.sql`, `functions/grade-open`)
Jednorazowo (po zatwierdzeniu zdania w polityce prywatności):
1. Supabase → SQL Editor → wklej `supabase/skrot-v25-ocena-ai.sql` → Run (dzienny licznik ocen i tabela odwołań).
2. W terminalu, w folderze repozytorium: `npx supabase functions deploy grade-open` (ten sam sekret `ANTHROPIC_API_KEY` co funkcja `claude`).

- **Ocena AI** – po „Oddaj test” ABCD liczy strona, a pytania otwarte, zadania i podpunkty kazusów idą jednym wywołaniem do `grade-open` (model `claude-sonnet-5-5`, odpowiedź według schematu JSON, effort `low`). Funkcja sprawdza logowanie i pełny dostęp albo okres próbny, limit 5 ocenionych testów dziennie na osobę (`DAILY_LIMIT`, ten sam test po odświeżeniu nie zjada limitu). Wynik leży w `run.ai`, więc odświeżenie nie ocenia drugi raz. Limit, błąd albo przekroczony czas (60 s) → samoocena jak wcześniej. „Nie zgadzam się” odblokowuje ręczne zaznaczanie i zapisuje odwołanie w tabeli `nauka_ocena_odwolania` (Table editor), w podejściu jest `appeal`.
- **Rodzaje testu** (`run.kind`, `att.kind`; brak = pełny): `diag` (ok. 10 min, 5 ABCD z różnych tematów + 1 otwarte), `full`, `fix` (błędy z 2 ostatnich podejść + po jednym nowym z tych tematów), `sprint` (4 ABCD + 1 otwarte z 3 najsłabszych tematów, bez pytań z ostatnich podejść). Efekty uczenia się liczy tylko pełny test.
- **Plan** (`dayPlan`): dzień 0 test diagnostyczny (gdy nie było żadnego testu), 4–5 dni przed pełny test, dzień przed test z błędów; do 3 dni: diagnostyczny + pełny, 1 dzień: pełny. Tematy poniżej 50% w ostatnim teście (`testWeak`) idą na początek z chipem „do poprawy”.
- **Plan naprawczy**: pytania poniżej 50% punktów trafiają do Powtórek (`mistakesToSrs`): fiszka z materiału dostaje swój zwykły klucz, reszta `<mid>:x-<hash>` z treścią w `progress.exCards` (najwyżej 300). Na wyniku „Co poprawić”.
- **Gotowość**: średnia ważona godzinami tematów z sylabusa (`topicWeights`, dopasowanie po słowach tytułu), ostatni pełny test 60% wyniku tematu.
- **Kazusy**: OWI i Prawo mają domyślnie szablon 1 kazus + 3 otwarte + 10 ABCD. Treść w `docs/kazusy/kazusy.json` (nie jest publikowana), Panel AI → przedmiot → „Kazusy do próbnych testów” → „Wgraj plik z kazusami” → „Zapisz”.
- **Panel AI**: „Lepsze klucze oceniania” (próbka 5 pytań, potem reszta po 8) i „Zakres a sylabus” (tematy bez odpowiednika i podejrzane duble, tylko lista; też `skrotZakresSylabus()` w konsoli).
- Testy: `docs/gry/test/przygotuj-sie.mjs` (Playwright na atrapie), `supabase/test/v25.sql` (PGlite).

## Moje materiały (v4): własne pliki studentów
Każda osoba z pełnym dostępem wgrywa własny plik (PPTX, PDF, DOCX, TXT): Więcej → „Moje materiały” (albo ostatni kafelek na Przedmiotach) → „Wgraj swój materiał”. Plik przechodzi **ten sam proces co materiały roku** (mapa tematów → opracowanie bez tekstu pliku → fiszki i quiz → kontrola podobieństwa → prosty język i „Dlaczego?”), a wynik trafia do sekcji wybranej przez tę osobę. Domyślna sekcja to „Materiały”; można tworzyć nowe, zmieniać nazwy, przenosić materiały i usuwać sekcje.

- Materiały są prywatne: kolekcje `myMaterials` i `myContent`, widzi je i zmienia tylko właściciel. Tekst pliku nie jest zapisywany. Sekcje są w postępie nauki tej osoby (`myFolders`).
- Koszt AI pilnuje baza: przed każdym plikiem strona pobiera bilet (`nauka_moje_start`), jeden bilet = jeden plik = do 10 zapytań do AI w ciągu 2 godzin. Limit: **2 pliki dziennie i 40 w miesiącu na osobę** (liczby w `nauka_moje_stan`, aktualna wersja w `skrot-v9-limit-moje.sql`). Starosta nie ma limitu.

Włączenie (jednorazowo):
1. Supabase → SQL Editor: wklej `supabase/skrot-v4-moje.sql` → Run.
2. W terminalu, w folderze tego repozytorium: `npx supabase functions deploy claude`

Dopóki tego nie zrobisz, strona pokazuje studentom „nie jest jeszcze włączone na serwerze” zamiast błędu.

## Monety, Zadania dnia i Sklep (`skrot-v14-monety.sql`)

- Monety liczy tylko baza: trigger na `nauka_rp` zamienia punkty rankingu dnia na monety (10 pkt = 1 🪙), ze wszystkich źródeł, także Hasła dnia i Bossa z v15. Z nauki najwyżej 64 🪙 dziennie (`nauka_mon_dzis_max()`: limity v13 + Hasło dnia), nagroda za Bossa (+5 🪙) ponad to.
- Zadania dnia (3) i tygodnia (1) z puli `nauka_misje_pula()`: także „Zagraj jedną rundę gry” (Fruń, Pary, Przejdź, Drabina) i „Rozwiąż Hasło dnia”; odpowiedzi w Drabinie i ciosy w Bossa liczą się do „Odpowiedz dobrze na N pytań”.
- Sklep z motywami (`#/shop`, Więcej → „Sklep i monety”), saldo na Dziś pod powitaniem. Strona odświeża saldo 1,5 s po każdym zapytaniu, które dało punkty (`rpCall` → `skrot.sklepPozniej()` w `skrot-supabase.js`).
- Starosta: Aktywność → zakładka „Monety” (dziś / tydzień / saldo), „± monety” i „Daj motyw” przy kontach.
- Testy bazy: `supabase/test/v14.sql` (M1–M8), w `node supabase/test/pglite.mjs`.
- **Wdrożenie**: Supabase → SQL Editor → wklej `supabase/skrot-v14-monety.sql` → Run, PO v15 (numer został z kolejności pisania). Plik można uruchomić ponownie. Bez niego Sklep pokazuje „Zadania dnia jeszcze się nie wczytują”.

## Poziomy, rangi i widoczne monety (`skrot-v22-monety-widoczne.sql`)

- Trzy liczby, każda do czegoś innego: **⚡ XP → poziom i ranga** (20 rang od Świeżaka do Geniusza, `LP_LEVELS`, liczy przeglądarka, daje tylko wygląd i motywy za poziom), **🪙 monety → sklep** (liczy wyłącznie baza z punktów rankingu, nigdy z XP), **🔥 seria**.
- `lpLevelBar(xp, cls, { from })` w `index.html` rysuje je razem: odznaka rangi (ramka rośnie co 5 poziomów, `lvTier`), pasek do następnego poziomu, chipy XP / monet / serii. Wersja zwarta pod powitaniem na Dziś (`greet-badges`), pełna w Więcej („Twój poziom” + najbliższa nagroda `lvRewardLine` + ściąga `lvHowShow`), na ekranach końca w odtwarzaczu z paskiem rosnącym od XP sprzed sesji.
- Awans (`xpFlush` → `levelUpShow`): okno „Poziom N · ranga” z motywami za ten poziom (przycisk „Włącz”), w odtwarzaczu po konfetti części, w grach dopiero po zamknięciu gry (`whenFree`).
- Widoczne nagrody: dymki „+N XP” i „+N 🪙” (`gainPop`), w odtwarzaczu chip 🪙 w górnym pasku i „+N 🪙” przy nim. `skrot-supabase.js` wysyła zdarzenie `skrot:pkt` po każdym zapytaniu, które dało punkty; strona dolicza je do dzisiejszych pkt z bazy (`dzis_pkt` z v22) i po przekroczeniu kolejnej dziesiątki pokazuje monetę od razu (`monPkt`). Przy odświeżeniu salda baza ma ostatnie słowo (`monSync`). Bez v22 moneta pokazuje się po odświeżeniu salda.
- Testy: `supabase/test/v22.sql` (W1–W3) w `node supabase/test/pglite.mjs`; UI `node docs/gry/test/poziomy.mjs` (atrapa: `mock-v22`).
- **Wdrożenie**: Supabase → SQL Editor → wklej `supabase/skrot-v22-monety-widoczne.sql` → Run (po v21). Zmienia tylko `nauka_sklep_stan()` (dodaje `dzis_pkt`). Można uruchomić ponownie.


## Przedmioty kosmetyczne (`skrot-v24-kosmetyki.sql`)

- Jeden katalog w bazie (`nauka_sklep_katalog()`): motywy jak dotąd + ramki awatara, kolory nicku, tytuły, gablota odznak, skórki i tła gier, wygląd fiszek, efekty quizu, dźwięki, kolor płomienia, zamrożenie serii, zestawy i kolekcja sezonowa. Pola: `id, kat, slot, pl, en, opis_pl, opis_en, cena, min_poziom, tylko_za_poziom, sezon, wyglad, czesci, wymaga, max`.
- Wszystko to wyłącznie wygląd: nic nie zmienia punktów rankingu, XP ani wyników. Zamrożenie serii chroni tylko serię dni w przeglądarce i nie tworzy wpisów w `nauka_rp`.
- Zakup `nauka_sklep_kup(p_item, p_req)`: jedna transakcja pod blokadą na osobę (saldo, poziom, okno sezonu, posiadanie, `wymaga`), cena tylko z katalogu. Zestaw kosztuje najwyżej tyle, ile brakujące części osobno. Zamrożenie wymaga `p_req` (to samo `p_req` drugi raz = bez opłaty), najwyżej 2 naraz.
- Zakładanie `nauka_sklep_zaloz(p_slot, p_item)` (null = zdejmij) – tylko posiadane, jeden przedmiot na slot. Gablota `nauka_gablota_ustaw(p_odznaki)` – tylko zdobyte odznaki, 1 miejsce + kupione. Zamrożenie `nauka_zamrozenie_uzyj()` chroni wczoraj, gdy wczoraj nie było nauki. Wygląd innych w rankingu: `nauka_wyglad(p_nicki)` (osobno od `nauka_ranking`).
- Poziom, odznaki i tytuły za osiągnięcia (`tytul:pogromca:<przedmiot>`) baza czyta z dokumentu postępu (`nauka_docs`, kolekcja `progress`) – tym samym wzorem co strona (próg poziomu n = 50·n·(n−1)).
- Sezony: `nauka_sezony()` na górze pliku (daty po czasie warszawskim, obie włącznie). Zmiana dat = edycja i ponowne uruchomienie. Kupione przedmioty sezonowe zostają na zawsze.
- Strona (`index.html`, sekcja „PRZEDMIOTY KOSMETYCZNE”; grafiki w `kosmetyki.js`, `window.SKROT_KOSM`):
  - Sklep `#/shop`: zakładki Motywy / Profil / Gry / Nauka / Zestawy / Sezonowe (`kShopTabs`), karty z podglądem na żywo (Twój nick i awatar), „od poziomu X” z kłódką, Posiadasz / Załóż / Założone, potwierdzenie z ceną i saldem po zakupie (`kBuy`), dymek „−N 🪙” i odliczanie salda (`kSpent`).
  - Ranking: awatar z ramką (pierwsza litera nicku), kolor nicku, tytuł (kupiony = szara pigułka, za osiągnięcie = obrys i 🏅); klik w osobę = profil z gablotą (`kProfilShow`). Więcej: karta „Twój profil” z gablotą (`kProfilCard`, `kGablotaEdit`).
  - Gry: `GRY_API.kosm()` → skórka (`SKROT_KOSM.SIDE` we Fruń, `TOP` w Przejdź) i tło (`SKY`, `BOARD_COL`, `rowDecor`); kolizje bez zmian.
  - Nauka: klasa `kf-<wygląd>` na odtwarzaczu (fiszki), `kEffect()` zamiast konfetti na końcu quizu, `kSound()` w `lpBuzz(true)` (tylko z założoną paczką i przełącznikiem `bm-dzwieki`, domyślnie wyłączone), `kFlame()` zamiast 🔥, `streakNext()` z zamrożeniem.
  - Tytuły „Pogromca …” (`kTytulySprawdz`): wszystkie lekcje przedmiotu zrobione → `progress.tytuly`. Odznaka „Mistrz Skrótu BM” z testu przewodnika trafia do `progress.odznaki` (gablota).
- Kolory nicku, grafik i fiszek są zapisane jako zmienne CSS / atrybuty `rgb(r g b)` (ze spacjami), żeby silniki motywów (Jednorożec, Łąka, Nocny rejs, Nokturn) ich nie przemalowywały. Kontrast ≥ 4,5:1 sprawdza `docs/kosmetyki/test/kontrast.mjs` (8 motywów, jasny i ciemny tryb).
- Testy przeglądarkowe: `docs/kosmetyki/test/etap2.mjs` … `etap5.mjs` i `kontrast.mjs` (atrapa: `mock-v24 = "1"`, katalog wczytywany z tego pliku SQL przez `docs/gry/test/lib.mjs`).
- **Wdrożenie**: Supabase → SQL Editor → wklej `supabase/skrot-v24-kosmetyki.sql` → Run (po v22). Można uruchomić ponownie. Nie uruchamiaj potem starego v14 (odtworzyłby jednoargumentowe `nauka_sklep_kup`). Testy: `supabase/test/v25.sql` (w `pglite.mjs`). Bez v24 w bazie sklep pokazuje tylko motywy, jak dotąd.
## Okres próbny (`skrot-v16-proba.sql`, dawniej v9-proba)

- Student raz włącza **3 dni pełnego dostępu za darmo**, bez karty: przycisk „Wypróbuj za darmo przez 3 dni” w paskach zakupu, kłódkach i w „Konto i dostęp”. Niezalogowany najpierw się loguje, potem okres próbny włącza się sam.
- Jeden na konto, na adres e-mail i na urządzenie (`x-skrot-device`). Kto kiedyś zapłacił, nie dostaje okresu próbnego. Liczba dni: `nauka_proba_dni()`.
- W trakcie działa jak opłacone konto (`nauka_platny_konto`), z tymi samymi zasadami urządzeń; na górze widać pasek „Okres próbny · zostały 2 dni” z „Kup dostęp”. Po 3 dniach wszystko blokuje się samo, postępy zostają.
- W okresie próbnym działają też gry, ranking, Hasło dnia, Boss, monety i Zadania dnia (`nauka_platny` → `nauka_rp_mozna`). Monety i punkty zostają po końcu.
- Plik nadpisuje `nauka_platny_konto`, `nauka_ja` i `nauka_kalendarz_dane` – ich poprzednie wersje są w v8, a v9–v15 ich nie zmieniają, więc nic się nie cofa. Testy: `supabase/test/v16.sql` (P1–P8).
- **Wdrożenie**: Supabase → SQL Editor → wklej `supabase/skrot-v16-proba.sql` → Run, na końcu (po v15 i v14). Bez tego strona działa jak dotąd (po zalogowaniu przycisk się nie pokazuje).
