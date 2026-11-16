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
- Etap 1: przycisk przykładowej lekcji dostaje ikonę `play` (A4d) już teraz; przeniesienie nad formularz i prawdziwa lekcja to etap 5.

## Etapy
| etap | stan | rundy | ostatni wynik | twarde błędy | ostatni commit |
|---|---|---|---|---|---|
| 1 Pierwszy ekran i jedna ścieżka | **ZALICZONY** | 2 | 9,0 | brak | (ten commit) |
| 2 Widoczna próba i przyciski zakupu | w toku | 0 | – | – | – |
| 3 Koniec próby jako wydarzenie | – | – | – | – | – |
| 4 Paywall, odzyskiwanie, zaufanie | – | – | – | – | – |
| 5 Lekcja dla gościa | – | – | – | – | – |

## Dziennik rund

### Etap 1 · runda 1 – 8,5/10, twarde błędy: brak, K4 = false → poprawki
Recenzent: reguła bramki widoczności w głównym `<style>` (poza `ux-wejscie.css`) → K4 ✗; Staś w arkuszu za duży; różne kolory przycisku na ścieżce próby; pusta przestrzeń i osierocone „Zmień e-mail” w kroku kodu; za dużo wezwań na Dziś (pasek + dolna karta); EN „Start”; brak zdania „czym jest Zdawalni” w wariancie z grupą; bramka 1 s; Staś na telefonie 48 px bez machania.
Poprawione: reguła w `ux-wejscie.css` + zapas 2,5 s, limit 0,6 s; Staś 96 px wyśrodkowany; limonkowy przycisk na całej ścieżce; „Zmień e-mail” jako link w akapicie; `buyBanner` znika przy pasku; EN „Start”; podtytuł `.lg-sub` w wariancie z grupą; Staś 56 px z machaniem; ciemny wariant przykładowej lekcji (zmienne aplikacji w `#login`). Stara asercja `h2-etap9` „logowanie zawsze jasne” poprawiona osobnym commitem „test: …”.

### Etap 1 · runda 2 – 9,0/10, twarde błędy: brak, K1–K6 = true → ZALICZONY
Przed rundą 2 dodatkowo: bramka widoczności czeka na faktyczne załadowanie czcionek (Bricolage + Plus Jakarta, najwyżej 2,5 s; `document.fonts.ready` rozwiązywało się wcześniej, niż czcionki były zadeklarowane), nagłówek panelu na komputerze zawsze w 2 liniach (`min(44px, 3vw)`, podział przed „zdanych”) – CLS logowania z prawdziwymi czcionkami ≈ 0 we wszystkich rozmiarach.
Uwagi recenzenta przeniesione do etapu 2 (te same elementy): „Włącz” na pasku limonkowe jak reszta ścieżki próby; pasek w jednej linii przy 360 px; „Kup dostęp” w „Twój postęp” przez `przyciskZakupu()`; pierścień fokusu w arkuszu tylko przy klawiaturze; odstęp Stasia od nagłówka w arkuszu; przyciski powitania próby ≥ 44 px; tekst lewego panelu zależny od stanu; krótszy przycisk przykładowej lekcji z ikoną w linii; jedna wzmianka o spamie; „6-cyfrowy” z łącznikiem; mniej pustego miejsca pod „Wyślij ponownie”.
