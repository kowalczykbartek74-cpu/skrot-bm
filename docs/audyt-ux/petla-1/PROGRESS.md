# Pętla UX-1 – Wejście, okres próbny i zakup · PROGRESS

Gałąź `ux/1-wejscie`, katalog `~/zdawalni/ux-1`, port 8811. Polecenie: `~/zdawalni/ux/petla-1.md`.
Start: 17.11.2026, `origin/main` = `da5c455` (zawiera już commit f5728e6 „Ekran wejścia w stylu nowego Dziś”: Staś na logowaniu,
limonkowa karta próby, ikona oka – część znalezisk C1 była więc już częściowo zrobiona; numery linii z polecenia przesunięte o ok. +200).

## Środowisko (krok 0)
- `~/zdawalni/ux-1` istniał, gałąź `ux/1-wejscie` z `origin/main`, czysty. PGlite działa. Serwer: `python3 -m http.server 8811 --bind 127.0.0.1`.
- `docs/dzis-review/runda-ux-*/` dopisane do `.git/info/exclude` (wspólny katalog .git w `skrot-bm`).
- Stan testów na `main` przed zmianami: `node --test` 368/368 (1 pominięty); PGlite: `✗ skrot-v12-zabezpieczenia.sql → limit_wpisow() does not exist` (pierwsze uruchomienie v12, SQL nieruszany przez tę pętlę – jest tak samo na main).

## Decyzje (B1 przyjęte domyślnie, Bartek nic nie zmienił)
- D4: przełącznik maila przed końcem próby widoczny w powitaniu, domyślnie odznaczony; jeden mail dzień przed końcem.
- Kierunki oczekujące: tag „Wkrótce” + lista oczekujących; próba dla rocznika nie-`platny` odrzucana w SQL.
- +2 dni przed kolokwium: raz na konto, po próbie bez zakupu, tylko gdy do najbliższego terminu ≤ 7 dni.
- Kupon retencyjny w Stripe: NIE. Arkusz przed anulowaniem tylko porównuje plany.
- Adres pomocy bez zmian (decyzja Bartka w RAPORT). FAQ „Kto to robi?” bez imienia i nazwiska, chyba że jest w regulaminie § 1.
- Licznik „N osób z kierunku…” dopiero od 15.
- Etap 5 (lekcja dla gościa) tylko, jeśli etapy 1–4 zaliczone albo zamknięte.
- Regulamin i treść zgód bez zmian (`CONSENT_V` bez zmian).
- Etap 1, decyzja własna: arkusz „Włączyć teraz 3 dni?” pokazujemy **po** obsłudze `skrot-buy` (kto kliknął „Kup dostęp” przed logowaniem, idzie prosto do wyboru planu), a nie przed nim, jak w C1 pkt 1 – zakup to silniejsza intencja niż próba.
- Etap 1: krytyczny CSS rezerwujący miejsce (#loginBox przed wstawieniem formularza, miejsce na Stasia w nagłówku) jest w linii 1 `index.html` w bloku `#login` – plik `ux-wejscie.css` ładuje się dopiero po pierwszym malowaniu ekranu logowania i sam nie usunąłby skoku (zmierzone: CLS 0,045 przez min-height dodany z opóźnieniem).
- Etap 1 (po rundzie 1): ekran logowania jest niewidoczny, dopóki nie wczytają się główny styl, `ux-wejscie.css` i czcionki (najwyżej 0,6 s; zapas w skrypcie logowania odsłania go po 2,5 s, gdyby plik CSS się nie wczytał). Bez tego CLS z prawdziwymi czcionkami wynosił 0,15–0,67 na komputerze.
- Etap 1 (po rundzie 1): cała ścieżka próby ma jeden wygląd głównego przycisku – limonkowa pastylka z ciemnym tekstem („Zacznij 3 dni za darmo”, „Wyślij kod i zacznij”, przycisk po kodzie, „Tak, zaczynam 3 dni”).
- Etap 1 (po rundzie 1): EN przycisku na pasku „Masz jeszcze 3 dni za darmo · Włącz” to „Start” (jak w C1); „Włącz” ma w słowniku ogólne „Turn on”, więc tekst EN ustawia `ux-wejscie.js` (`data-noi18n`).
- Etap 1: na Dziś, gdy jest pigułka „Masz jeszcze 3 dni za darmo”, dolna karta próby (`buyBanner`) się nie pokazuje (jedna akcja).
- Etap 2: „Kup dostęp” najwyżej raz na Dziś: pierwszy rysujący (pasek nad panelem, potem `ldBlock`, `ptsDzis`, `buyBanner`) dostaje zielony przycisk, kolejne `przyciskZakupu()` – link „Zobacz plany”. Licznik zeruje `pasekProby()` (pierwsza rzecz w `viewHome`).
- Etap 2: dzień próby liczony z `trialUntil − 3 dni` (bez zmiany `nauka_ja`, która nie należy do żadnej pętli).
- Etap 2: status rocznika z bazy zapisywany w nowym kluczu `skrot-roczniki-status` (format `skrot-roczniki-baza` bez zmian, czyta go `rocznik.js`); bez odpowiedzi bazy – `STATUS_DANYCH` z `roczniki-dane.js`. Rocznik nie-`platny` → `trialCan = false` (bez przycisków próby), v52 i tak odrzuca start.
- Etap 2: na Dziś bez dostępu i bez możliwej próby pasek nad panelem: po próbie „Próba minęła · 199 zł do 11 lipca 2027 albo 35 zł / mies. · Kup dostęp”, w pozostałych przypadkach „Pełny dostęp · …” (nie dla kierunku oczekującego).
- Etap 2: tekst pigułki próby w EN składany w `ux-wejscie.js` (data i godzina w jednym kawałku bez łamania); pary PL→EN i tak w słowniku.
- Etap 2 (świadome): `nauka_ja().proba_mozna` dalej `true` dla rocznika oczekującego – `nauka_ja` nie należy do pętli 1; ekrany próby biorą `skrot.trialCan`, który uwzględnia status rocznika, a v52 i tak odrzuca start („rocznik”). Do RAPORT.
- Etap 4: spis sekcji w paywallu z nowej funkcji v54 `nauka_lekcja_spis` (same tytuły, maks. 6) – treść zablokowanej lekcji jest dla konta bez dostępu nieczytelna (RLS). `paywallCard` sam bierze materiał z trasy (bez zmiany cudzego `viewMaterial`).
- Etap 4: licznik „N osób z {kierunek}…” nad FAQ na ekranie logowania (pod pierwszym ekranem), a nie pod nagłówkiem – liczba przychodzi z bazy po wyrenderowaniu i pod nagłówkiem przesuwałaby ekran (CLS).
- Etap 4: FAQ „Kto to robi?” z imieniem i nazwiskiem, bo są w regulaminie § 1 (B1).
- Etap 4: przejście z planu miesięcznego na 199 zł bez automatycznego anulowania subskrypcji – webhook nie ma klucza Stripe do wywołań API (tylko podpis); arkusz mówi wprost, żeby anulować w portalu. Automatyczne anulowanie = decyzja Bartka (sekret STRIPE_SECRET_KEY w funkcji) → RAPORT.
- Etap 4 (poprawki po etapie 3): koniec próby także z bazy (`nauka_proba_stan`, v54); po zakupie `skrot-proba-do` czyszczony; mail „próba” tylko 9:00–20:59 w Warszawie, w temacie „Dziś/Jutro/W czwartek” z kalendarza; karty planów jako wybór (radio) + jeden przyklejony przycisk „Wybierz …”.
- Etap 1: przycisk przykładowej lekcji dostaje ikonę `play` (A4d) już teraz; przeniesienie nad formularz i prawdziwa lekcja to etap 5.

## Etapy
| etap | stan | rundy | ostatni wynik | twarde błędy | ostatni commit |
|---|---|---|---|---|---|
| 1 Pierwszy ekran i jedna ścieżka | **ZALICZONY** | 2 | 9,0 | brak | (ten commit) |
| 2 Widoczna próba i przyciski zakupu | **ZALICZONY** | 2 | 8,5 | brak | (ten commit) |
| 3 Koniec próby jako wydarzenie | **ZALICZONY** | 1 | 8,0 | brak | (ten commit) |
| 4 Paywall, odzyskiwanie, zaufanie | **ZALICZONY** | 2 | 8,0 | brak | (ten commit) |
| 5 Lekcja dla gościa | **NIEZROBIONY (odłożony)** | 0 | – | – | – |

## Dziennik rund

### Etap 1 · runda 1 – 8,5/10, twarde błędy: brak, K4 = false → poprawki
Recenzent: reguła bramki widoczności w głównym `<style>` (poza `ux-wejscie.css`) → K4 ✗; Staś w arkuszu za duży; różne kolory przycisku na ścieżce próby; pusta przestrzeń i osierocone „Zmień e-mail” w kroku kodu; za dużo wezwań na Dziś (pasek + dolna karta); EN „Start”; brak zdania „czym jest Zdawalni” w wariancie z grupą; bramka 1 s; Staś na telefonie 48 px bez machania.
Poprawione: reguła w `ux-wejscie.css` + zapas 2,5 s, limit 0,6 s; Staś 96 px wyśrodkowany; limonkowy przycisk na całej ścieżce; „Zmień e-mail” jako link w akapicie; `buyBanner` znika przy pasku; EN „Start”; podtytuł `.lg-sub` w wariancie z grupą; Staś 56 px z machaniem; ciemny wariant przykładowej lekcji (zmienne aplikacji w `#login`). Stara asercja `h2-etap9` „logowanie zawsze jasne” poprawiona osobnym commitem „test: …”.

### Etap 1 · runda 2 – 9,0/10, twarde błędy: brak, K1–K6 = true → ZALICZONY
Przed rundą 2 dodatkowo: bramka widoczności czeka na faktyczne załadowanie czcionek (Bricolage + Plus Jakarta, najwyżej 2,5 s; `document.fonts.ready` rozwiązywało się wcześniej, niż czcionki były zadeklarowane), nagłówek panelu na komputerze zawsze w 2 liniach (`min(44px, 3vw)`, podział przed „zdanych”) – CLS logowania z prawdziwymi czcionkami ≈ 0 we wszystkich rozmiarach.
Uwagi recenzenta przeniesione do etapu 2 (te same elementy): „Włącz” na pasku limonkowe jak reszta ścieżki próby; pasek w jednej linii przy 360 px; „Kup dostęp” w „Twój postęp” przez `przyciskZakupu()`; pierścień fokusu w arkuszu tylko przy klawiaturze; odstęp Stasia od nagłówka w arkuszu; przyciski powitania próby ≥ 44 px; tekst lewego panelu zależny od stanu; krótszy przycisk przykładowej lekcji z ikoną w linii; jedna wzmianka o spamie; „6-cyfrowy” z łącznikiem; mniej pustego miejsca pod „Wyślij ponownie”.

### Etap 2 · runda 1 – 5/10 (twardy błąd), K1–K6 = true → poprawki
Twardy błąd: „Napisz do nas” (`<a class="btn">`) w oknie błędu próby miało niebieski kolor linku przeglądarki. Poprawki recenzenta: stan „po próbie” widoczny w 1. ekranie (pasek „Próba minęła · … · Kup dostęp”, jedyny „Kup dostęp”); w ostatnich 24 h pigułka mówi też „zostało N godz.”; data i godzina bez łamania; arkusz 24 h z kafelkami postępu i jednym głównym „Wybierz 199 zł”; lista oczekujących z zaznaczonym kierunkiem; po błędzie „wykorzystany/urządzenie” próba znika z Dziś; gotowe kierunki na górze z tagiem „Dostępne”; na Dziś „Wypróbuj 3 dni” jako link, gdy jest pasek; temat maila w EN. Do tego: po wczytaniu `ux-wejscie.js` jedno przerysowanie aplikacji (gdy ekran powstał wcześniej, zostawały zapasowe przyciski – złapane przez test).

### Etap 2 · runda 2 – 8,5/10, twarde błędy: brak, K1–K6 = true → ZALICZONY
Uwagi przeniesione do etapu 3 (te same elementy): pasek „Próba minęła / Pełny dostęp” nie może ucinać ceny (2 linie zamiast wielokropka); kafelki postępu tylko dla wartości > 0 z poprawną odmianą; panel Stasia po próbie słabszy od „Kup dostęp” (C2 P0 pkt 4 – panel należy do pętli 2/3, w etapie 3 tylko ekran końca próby i pasek); przy pasku próby kolejne `przyciskZakupu()` jednolite; tag „Dostępne” w linii jak „Wkrótce”; po zamknięciu arkusza bez przewinięcia; poprawiona liczba CLS w „Uwagach stałych” (0,06 dotyczy tylko konta darmowego z kartą „Zadanie dnia”).

### Etap 3 · runda 1 – 8,0/10, twarde błędy: brak, K1–K5 = true → ZALICZONY
Uwagi recenzenta naprawiane na początku etapu 4 (logika, która trafi na stronę): po zakupie czyścić `skrot-proba-do` (inaczej po wygaśnięciu płatnego dostępu fałszywe „Próba minęła”); mail „próba” tylko w dzień (9–21 Warszawa) i dzień tygodnia w temacie liczony z kalendarza; koniec próby także bez localStorage (nowe RPC `nauka_proba_stan()` w v54); 360 px: główny przycisk przyklejony na dole arkusza, bez podwójnego tytułu; karty planów jako wybór + jeden przycisk; wariant bez postępu bez dubla; tytuł jako `h2`; tor przełącznika ≥ 3:1; „Zamknij” w „Wybierz plan” ≥ 44 px; seria w kafelkach i postęp ucięty na końcu próby; test etapu 3 odporny na cudze pliki PGlite.

### Etap 4 · runda 1 – 5/10 (twardy błąd), K1–K6 = true → poprawki
Twardy błąd: przyciski 43 px w paywallu przy 1280 px i w oknie „Zanim zapłacisz”. Poprawione: wszystkie ≥ 48 px (test sprawdza 390 i 1280); powitanie po „+2 dni” mówi „Masz 2 dni” (liczba dni z faktycznego końca próby); arkusz przed portalem jako „Twoja subskrypcja” z „Otwórz portal płatności (karta, faktury, anulowanie)” i jasnym zdaniem o sumie do lipca; spis lekcji z nagłówkiem „W tej lekcji:” i kłódkami; próba w paywallu limonkowa; stopka paywalla lekcji bez powtórzonych cen; bez ramki fokusu na nagłówku arkusza.
Zostaje (RAPORT / uwagi): zielony „Kup dostęp” w nagłówku aplikacji obok paywalla (nagłówek poza B3); przypomnienie o anulowaniu subskrypcji po zakupie 199 zł (wymaga automatycznego anulowania w webhooku – decyzja Bartka); licznik nad FAQ (decyzja: bez CLS); „Wybierz plan” bez przycisku „Dalej” (karty same są przyciskami – zostawione jak było).

### Etap 4 · runda 2 – 8,0/10, twarde błędy: brak, K1–K6 = true → ZALICZONY
Po ocenie, przed wdrożeniem: w oknie zgód przy przejściu z planu miesięcznego linia „Pamiętaj: po zakupie anuluj subskrypcję 35 zł…”; v54 – „+2 dni” tylko dla kogoś, kto nigdy nie płacił (ta sama reguła co `nauka_proba_stan`, test B6b); spis lekcji jako zwykła lista.
Zostaje do RAPORT: automatyczne anulowanie subskrypcji w webhooku, przycisk „Kup dostęp” w nagłówku obok paywalla, „Wybierz plan” w tym samym wzorze co ekran końca próby, powitanie po „+2 dni” z przedmiotem kolokwium, indeks pod `nauka_rocznik_licznik` przy dużym ruchu.

### Etap 5 – NIEZROBIONY (odłożony)
Blokada: K1 wymaga „prawdziwego odtwarzacza” (`lpOpen`, `lpBuild`, `lpCards`…) w trybie gościa bez zapisu do bazy – to obszar pętli 3, przebudowywany w tym samym czasie. Zmiana w środku odtwarzacza z tej pętli zderzyłaby się przy scalaniu (A4 pkt 10–11). Poprawka: po scaleniu pętli 3 dodać w odtwarzaczu opcję `opts.gosc` (bez `progSoon`/RPC, XP w `sessionStorage`), w `skrotPokaz` wołać ją z 4 kartami, a w v55+ dać `anon` jawną listę par (kolekcja, id) na rocznik (`nauka_pokaz_lista`). Nic z etapu 5 nie jest w kodzie.

## KONIEC PĘTLI (17.11.2026)
Scalone `origin/main` (z pętlą 3) do `ux/1-wejscie` (merge, bez rebase); konflikty tylko w miejscach z A7 (linia 1 i linia `<script src>` w `index.html`, mosty, blok `i18n-en.js`), obie strony zachowane. Regresja po scaleniu i RAPORT: `RAPORT.md`. Na prośbę Bartka („jak skończyłeś, dodaj na stronę”) gałąź wypchnięta także na `main` (fast-forward).
