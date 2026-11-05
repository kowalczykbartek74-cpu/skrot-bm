# Etap 7: przypomnienia (7a: mail)

Spec: „Systemy z Zdawalni w Skrócie”, etap 7, tylko **7a (mail)**. 7b (push) według decyzji D5 dopiero po 2 tygodniach działania
maili (niżej: „Co zostaje na 7b”). Gałąź: `zdawalni/przypomnienia` (skrot-bm, od `zdawalni/lejek`, bo migracja idzie po v35).
Źródło logiki: `matura-app` (`origin/feat/l7-learner-bundle`): `lib/domain/notifications.ts`, `lib/domain/reminder-voice.ts`,
`lib/reminder-email.ts`, `lib/data/notifications.ts`, `app/przypomnienia/wypisz/route.ts`, tabela `notification_log`,
testy `tests/unit/notifications.test.ts`, `reminder-voice.test.ts`, `reminder-email.test.ts`.

## Co jest
- **Ustawienia → Przypomnienia** (nowa zakładka, `#/ustawienia/przypomnienia`, i wiersz „Przypomnienia” w Więcej → Ty):
  włącz/wyłącz, godzina co 30 min od 6:00 do 22:00 (czas polski), co przypominać: zaliczenia za 7, 3 i 1 dzień / zaległe powtórki
  i rewanże / Zadanie dnia. Zapis w bazie (`nauka_przypomnienia`, RPC `nauka_przypomnienia_ustaw`). **Domyślnie wyłączone, 18:00 (D6).**
  Bez pełnego dostępu: komunikat i nieaktywny włącznik (terminy, powtórki i Zadanie dnia są w pełnym dostępie).
- **Propozycja na Dziś (D6)**: gdy jest zaliczenie w ciągu 14 dni, a przypomnienia są wyłączone: karta „Przypomnieć Ci mailem?”
  (przedmiot · rodzaj · za ile dni), jeden przycisk „Włącz” (18:00) i „Nie teraz” (chowa kartę na 30 dni).
- **Treść według ważności** (`przypomnienia.js`, pierwsza, która pasuje): zaliczenie za dokładnie 7 / 3 / 1 dzień (termin starosty
  albo własna data z „Przygotuj się”) → powrót po ≥ 4 dniach bez nauki („jedno krótkie zadanie”) → dzisiejsza porcja rewanży
  (≤ 5, 2 min) i powtórek (≤ 20, 30 s) → Zadanie dnia. Nauka już dziś (zdarzenie nauki poza testem „Jak się uczysz?” albo powtórka)
  albo nic do przypomnienia → **brak maila**. Zignorowane z rzędu zwalniają (port 1:1): po 3 co drugi dzień, po 7 tylko w niedzielę,
  tydzień po ostatnim; otwarcie przypomnienia albo dzień nauki to resetuje.
- **Ton** (port reminder-voice bez postaci; Majturka nie ma, Staś nie pasował do maila): fakty dokładne (data z dniem tygodnia,
  „termin szacunkowy”, gdy starosta tak oznaczył; liczby i minuty), jedno wezwanie (jeden przycisk), bez poczucia winy i odliczania
  (test pilnuje słów). PL albo EN według języka strony przy ostatnim zapisie ustawień.
- **Stan liczy strona**: przy włączonych przypomnieniach `index.html` liczy mały wyciąg (`stanZ`: zaliczenia w ciągu 14 dni z tej samej
  funkcji co „Przygotuj się” (`examDate`, z grupą i podgrupą osoby), liczby zaległych powtórek i rewanży na dziś i 7 kolejnych dni,
  czy jest Zadanie dnia) i zapisuje go, gdy się zmieni (`nauka_przypomnienia_stan`, < 2 kB, bez treści pytań). Po wyłączeniu baza go czyści.
- **Serwer**: `pg_cron` co 15 min → `nauka_przypomnienia_wyzwol()` → `pg_net` POST do funkcji Edge `przypomnienia` z sekretem z Vault
  → `nauka_przypomnienia_kandydaci`: osoby, którym wypada godzina (okno 60 min, więc przerwa jednego uruchomienia nic nie gubi),
  bez wpisu w logu na dziś, bez zablokowanego konta, w limicie dnia; z dniami nauki, ostatnim dniem nauki, historią 14 przypomnień
  i **aktualnymi datami terminów starosty** (przesunięty termin → nowa data, usunięty → znika). Funkcja woła tę samą logikę
  (`logika.js` = kopia `przypomnienia.js`), zapisuje wpis w logu (**unikalne user + dzień → najwyżej jeden mail dziennie**, także
  przy dwóch uruchomieniach naraz) i wysyła przez Resend. Mail nie wyszedł → wpis znika, następne uruchomienie w oknie próbuje znowu.
- **Wypisanie jednym kliknięciem**: nagłówki `List-Unsubscribe: <…/functions/v1/przypomnienia?t=TOKEN>` i
  `List-Unsubscribe-Post: List-Unsubscribe=One-Click` (przycisk „Wypisz” w Gmailu / Apple Mail woła funkcję POST i wyłącza od razu).
  Link w treści maila prowadzi (GET → przekierowanie) na `przypomnienia.html#t=TOKEN`: strona bez logowania z jednym przyciskiem
  „Wyłącz przypomnienia” (samo wejście niczego nie zmienia, bo skanery poczty otwierają linki). Token losowy, w tabeli.
- **Otwarcie z maila**: przycisk w mailu prowadzi na `skrotbm.pl/?pz=<id wpisu>#/…`; po zalogowaniu baza zapisuje „otwarte”
  (dławienie), adres jest czyszczony z `?pz`.
- **Log** `nauka_przypomnienia_log` (port `notification_log`): dzień, kanał (`email`, na 7b `push`), rodzaj, wysłano, otwarto; bez treści.
  Czyszczony po 180 dniach. Usunięcie konta kasuje wszystko (v32 bierze każdą tabelę z `user_id`, plus `on delete cascade`).

## Kroki dla Bartka (klik po kliku)
1. **pg_net**: Supabase → skrzynka-bm → Database → Extensions → wyszukaj `pg_net` → Enable. (pg_cron jest włączony od v33;
   jeśli nie: Integrations → Cron → Enable.)
2. **Sekret cron**: w Terminalu na Macu `openssl rand -hex 32` → skopiuj wynik (nie wklejaj go nigdzie poza krokami 3 i 4).
3. **Sekret funkcji**: Supabase → Edge Functions → Secrets → Add new secret: nazwa `PRZYPOMNIENIA_CRON`, wartość z kroku 2 → Save.
   `RESEND_API_KEY` i `RESEND_FROM` są już z etapu 5 (nadawca z domeny skrotbm.pl zweryfikowanej w Resend).
4. **Vault** (ten sam ciąg + adres funkcji): Supabase → SQL Editor → New query →
   ```sql
   select vault.create_secret('<wartość z kroku 2>', 'przypomnienia_cron');
   select vault.create_secret('https://zkyxujkdrovfzpasocmv.supabase.co/functions/v1/przypomnienia', 'przypomnienia_url');
   ```
   → Run. (Zmiana później: `select vault.update_secret((select id from vault.secrets where name = 'przypomnienia_cron'), '<nowa>');`
   i ta sama wartość w kroku 3.)
5. **SQL v36**: SQL Editor → New query → wklej całe `supabase/skrot-v36-przypomnienia.sql` → Run. W „Messages” ma być
   `OK przypomnienia: zadanie skrot-przypomnienia co 15 min`. Wymaga v31 (roczniki) i v35 (kolejność).
6. **Funkcja**: po scaleniu gałęzi, w `~/skrot-bm`: `supabase functions deploy przypomnienia --no-verify-jwt`
   (bez JWT, bo woła ją pg_cron i program pocztowy; wpuszcza tylko z sekretem cron albo z tokenem wypisania).
7. Napisz „uruchomione” → wdrażam stronę. Do tego czasu strona dostaje „brak funkcji” i zakładka mówi „jeszcze nie działają”.
8. **Sprawdzenie na swoim koncie** (pełny dostęp):
   - „Przygotuj się” w dowolnym przedmiocie → własna data zaliczenia za 3 dni (albo termin starosty za 3 dni);
   - Ustawienia → Przypomnienia → Włącz → godzina = najbliższe pełne pół godziny; **tego dnia nic nie rób w nauce** (quiz, powtórka
     itp. = „już się uczył” → brak maila);
   - o tej godzinie (do 15 min później) przychodzi jeden mail „Kolokwium: …, za 3 dni”; drugi tego dnia nie przyjdzie;
   - kontrola: `select dzien, rodzaj, wyslano_at, otwarte_at from nauka_przypomnienia_log order by wyslano_at desc limit 5;`
     i (gdy nic nie przyszło) `select status, return_message, start_time from cron.job_run_details where jobid = (select jobid from cron.job where jobname = 'skrot-przypomnienia') order by start_time desc limit 5;`
     oraz `select status_code, content from net._http_response order by created desc limit 5;` (401 = różne sekrety w krokach 3 i 4);
   - w mailu „Wyłącz przypomnienia mailem” → przycisk → Ustawienia → Przypomnienia pokazuje „wyłączone linkiem z maila”.
     W Gmailu działa też „Anuluj subskrypcję” obok nadawcy (jednym kliknięciem).

## Limit Resend
- **Free: 100 maili na dobę (UTC) i 3000 na miesiąc, wspólne z mailami logowania** (Supabase wysyła kody przez Resend) i z mailami
  listy oczekujących (etap 5). Dlatego baza wysyła najwyżej **60 przypomnień na dobę UTC** (`limit_dzien` w `nauka_przypomnienia_cfg()`),
  zostawiając 40 na logowania. Po wyczerpaniu limitu reszta osób tego dnia nie dostaje maila (kolejność: wcześniejsze godziny pierwsze).
  60 × 30 = 1800 przypomnień w miesiącu + logowania mieszczą się w 3000, dopóki logowań jest ≤ ok. 40 dziennie.
- **Ile osób to wytrzyma**: mail wychodzi tylko w dni bez nauki i gdy jest coś do przypomnienia, a dławienie zwalnia zignorowane.
  Przy założeniu, że danego dnia mail dostaje ok. 60% osób z włączonymi przypomnieniami: **ok. 100 osób z włączonymi przypomnieniami**
  (mniej w sesji, gdy jest dużo logowań).
- **Kiedy Pro (20 $/mies., 50 000 maili/mies., bez limitu dziennego)**: gdy przypomnienia ma włączone ok. 80+ osób
  (`select count(*) from nauka_przypomnienia where wlaczone;`) albo gdy w jakiś dzień limit się wyczerpał
  (`select dzien, count(*) from nauka_przypomnienia_log group by 1 order by 1 desc limit 14;` pokazuje 60), albo gdy maile logowania
  zaczynają nie dochodzić. Po przejściu: w `nauka_przypomnienia_cfg()` zmień `limit_dzien` na np. 1500 i uruchom tę funkcję w SQL Editor.

## Do decyzji
- **Polityka prywatności** (nie zmieniałem `prywatnosc*.html`). Propozycja wiersza do tabeli celów:
  > „Przypomnienia mailem (tylko gdy je włączysz w Ustawieniach): adres e-mail, wybrana godzina i rodzaje przypomnień, daty Twoich
  > najbliższych zaliczeń, liczba zaległych powtórek i rewanży, dni nauki i historia wysłanych przypomnień (bez treści, 180 dni).
  > Podstawa: zgoda (art. 6 ust. 1 lit. a), którą wycofasz w Ustawieniach albo linkiem w każdym mailu.”

  EN: “Email reminders (only if you turn them on in Settings): email address, chosen time and reminder types, dates of your upcoming
  tests and exams, number of overdue reviews and rematches, study days and the history of sent reminders (no content, 180 days).
  Basis: consent (Art. 6(1)(a)), which you can withdraw in Settings or with the link in every email.”
  W „Komu przekazujemy”: Resend – „wysyłka maili z kodem do logowania **i przypomnień**”.
- **Stan liczy strona, nie serwer** (zamiast czytać `progress` jsonb w funkcji): grupa i podgrupa są tylko w przeglądarce,
  dopasowanie terminu do części przedmiotu (`examDate`) i karty FSRS rewanży (`learner.js`) też. Serwer sprawdza za to aktualną datę
  każdego terminu starosty ze stanu. Skutek: **nowy termin dodany przez starostę trafia do przypomnień po najbliższym otwarciu strony**
  przez tę osobę; liczby powtórek po > 7 dniach bez otwierania strony są „co najmniej” (ostatnia znana liczba, w mailu dzisiejsza porcja).
  Gdy terminy dostaną `rocznik_id` i grupę w bazie, funkcja może dobierać nowe terminy sama.
- Z portu wypadły warunki, których w Skrócie nie ma: „dzień bez sesji w planie” (dzień odpoczynku), „Przerwa” i „dzień kryzysowy
  Majturka”. Kolejność: zaliczenie przed „powrotem” (w Zdawalni powrót był pierwszy, ale tam nie było terminów w przypomnieniu).
- Godziny 6:00–22:00 co 30 min (Zdawalni: 5–22 co godzinę). „Nie teraz” na Dziś = 30 dni spokoju.
- Mail w jednym języku (z ustawień), nadawca `RESEND_FROM` (wspólny z listą oczekujących; osobny adres, np. `przypomnienia@skrotbm.pl`,
  to tylko zmiana sekretu).

## Co zostaje na 7b (push, po 2 tygodniach działania maili, D5)
- `sw.js` (service worker) na GitHub Pages z obsługą `push` i `notificationclick` (otwiera `?pz=<id>#/…` jak mail).
- Klucze VAPID: generuje Bartek (`npx web-push generate-vapid-keys`), publiczny do strony, prywatny jako sekret funkcji (`VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`).
- Tabela subskrypcji push (`nauka_push`: user_id, endpoint, klucze, urządzenie) + RPC zapisu/usunięcia; zgoda w Ustawieniach →
  Przypomnienia („Powiadomienia na tym urządzeniu”); na iPhonie tylko po dodaniu strony do ekranu początkowego (jasny komunikat).
- Funkcja `przypomnienia`: kanał push przed mailem (jak w Zdawalni: push, jeśli jest urządzenie, inaczej mail), ta sama logika
  `wybierz()` i ten sam log (`kanal = 'push'`, nadal jeden wpis na dzień); wygasła subskrypcja (410) → usunięcie.
- Decyzja na podstawie logu maili: ile przypomnień jest otwieranych (`otwarte_at`) i czy dławienie nie jest za ostre.

## Testy
- `node --test tests/*.test.js`: 80/80 (`przypomnienia` 11: port testów notifications (kolejność, dławienie 1:1, bez poczucia winy),
  teksty PL/EN, stan i kontekst (przesunięty / usunięty termin starosty, stary stan), godziny i strefa (także czas letni), mail
  (escapowanie, jeden przycisk, `?pz`, link wypisania), kopia `logika.js` identyczna, **funkcja Edge z atrapą bazy i Resend**:
  zły sekret → 401; kolokwium za 3 dni → jeden mail z `List-Unsubscribe` i `List-Unsubscribe-Post`; drugie uruchomienie tego dnia
  i dwa naraz → bez drugiego maila; GET z linku niczego nie wyłącza; POST one-click wyłącza; po wypisaniu nic nie wychodzi;
  błąd Resend → wpis usunięty i ponowienie; brak sekretów Resend → nic).
- PGlite `supabase/test/v36.sql` P1–P12 (migracja 2×): uprawnienia (anon / zalogowany nie widzą tabel ani kandydatów), domyślnie
  wyłączone 18:00, walidacja, stan tylko przy włączonych, kandydat o 18:05 (nie o 17:50 i nie o 19:10), zablokowane konto pominięte,
  aktualna data terminu starosty, dni nauki bez testu profilu, **drugi wpis tego samego dnia odrzucony**, historia na następny dzień,
  usunięcie wpisu po błędzie, limit dnia, „otwarte” tylko własne, **wypisanie tokenem** (zły token nic nie robi), ponowne włączenie.
- Playwright `docs/gry/test/przypomnienia.mjs` 61/61 (375 i 1280, PL i EN): karta na Dziś (jeden przycisk, ≥ 44 px), włączenie
  i zapis stanu (termin starosty z id), „Nie teraz”, brak karty bez terminu i przy włączonych; zakładka Ustawień (godzina, rodzaje,
  wyłączenie, wiersz w Więcej); bez pełnego dostępu / bez v36 / bez logowania; `?pz`; strona wypisania (wejście nic nie robi,
  jedno kliknięcie, zły link); EN bez polskich znaków.
- Pełny zestaw Playwright: bez nowych błędów (stare na tej gałęzi: `etap7.mjs` 3, `scalanie.mjs` 2). `ustawienia.mjs` poprawiony celowo:
  w Więcej → Ty jest nowy wiersz „Przypomnienia” (29/29).
- Prawdziwego maila, pg_cron, pg_net i Vault nie sprawdzałem (tylko produkcja); funkcji w Deno nie uruchamiałem (brak Deno), składnię
  sprawdza TypeScript, a rdzeń (`obsluga.ts`) test w Node.

## Dla kolejnego rocznika
Nic: ustawienia i log mają `rocznik_id` z profilu, terminy i nazwy przedmiotów biorą się z rocznika na stronie, teksty nie mają nazwy kierunku.
