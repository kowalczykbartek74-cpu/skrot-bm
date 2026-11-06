# Etap 10: paczka i duet tygodnia

Spec: „Systemy z Zdawalni w Skrócie”, etap 10. Gałąź `zdawalni/paczka` (skrot-bm, od `zdawalni/sprawdziany` 5a3d5c5). SQL: `supabase/skrot-v37-paczka.sql` (po v36).
Źródło: `matura-app` `origin/feat/l7-learner-bundle` (9417ccf) `lib/domain/squad.ts`, `lib/domain/duo.ts`, `app/(app)/paczka/*`, `supabase/migrations/20261029000100_squads.sql` + `tests/unit/squad.test.ts`, `tests/unit/duo.test.ts`.
Zasada: widać wysiłek, nigdy wyniki. Bez rankingu, bez lig, bez szturchnięć i bez wolnego tekstu.

## Co jest
- **`paczka.js`** (bez DOM i bazy, `window.SKROT_PACZKA`): `squadWeek`, `squadHistory`, `normalizeSquadCode`, `duoQuest` (+ `startOfWeek`, `addDays`) przepisane 1:1, testy z Zdawalni przeniesione. Dla Skrótu: tydzień pon–nd w czasie polskim (`dzisWarszawa`, `tydzienWarszawa`, `dniDoKonca`), `celPaczki`, `postepDuetu`, `nazwa` („Osoba N” bez pseudonimu), `link`, `kodZAdresu`, `opisDuetu`. Liczby (`CFG`) są te same co `nauka_paczka_cfg()` w SQL (test to sprawdza); baza odsyła swoje i one wygrywają.
- **SQL v37**: tabele `nauka_paczki` (kod, `wlasciciel`), `nauka_paczka_czlonkowie` (`user_id`, jedna paczka na osobę), `nauka_duety` (`user_id` = kto zaprosił, `partner_id`, stan, `od`). RLS bez reguł + `revoke`: przeglądarka czyta tylko przez funkcje `security definer`. Wyzwalacz po wyjściu osoby: jej duety znikają, prowadzenie przechodzi na osobę najdłużej w paczce, ostatnia osoba = paczka znika (działa tak samo przy usuwaniu konta z v32).
- **Dzień nauki / sesja**: jak „dzień nauki” w v35 (`nauka_lejek_dni_nauki`): dzień (czas polski) ze zdarzeniem nauki (`nauka_zdarzenia` bez `profile_test`) albo powtórką (`nauka_powtorki_log`). Sesja duetu = dzień nauki jednej osoby (para zbiera najwyżej 14 w tygodniu).
- **Monety za duet** liczy i przyznaje wyłącznie baza (`nauka_duet_rozlicz`): razem ≥ 8 sesji pon–nd od dnia przyjęcia → każda osoba z dostępem dostaje 20 🪙 (`nauka_monety`, źródło `misja`, klucz `misja:duet:<poniedziałek>`, opis „Duet tygodnia”). Unikalny klucz (user_id, klucz) = raz w tygodniu na osobę, więc też na parę. Rozliczenie: wyzwalacz po każdym zdarzeniu nauki / powtórce (tydzień tego dnia nauki; błąd nigdy nie zatrzymuje zapisu nauki) i otwarcie widoku paczki (bieżący i miniony tydzień). Blokada `nauka_mon:<osoba>` jak przy Zadaniach, `max_saldo` z v14.
- **Widok** `#/paczka` (Więcej → Ty → „Paczka i duet”, podpis: liczba osób i cel tygodnia): bez paczki „Załóż paczkę” i pole na kod; w paczce: wspólny cel tygodnia (pasek), duet tygodnia (propozycje do przyjęcia, „Ty + X”, postęp, ile Ty / ile X, informacja o monetach, „Zakończ duet” / „Cofnij propozycję”), lista osób (pseudonim, „dziś: nauka ✓ / jeszcze nie”, dni nauki w tygodniu, „w duecie”; „Duet?” przy wolnych osobach, „Usuń” dla prowadzącego), zaproszenie (kod, link, „Kopiuj link”, „Udostępnij” na telefonie), „Jak to działa?”, „Wyjdź z paczki” z potwierdzeniem.
- **Link `zdawalni.pl/?paczka=KOD`**: kod trafia do `localStorage` („skrot-paczka-kod”) i znika z adresu. Bez logowania: na ekranie logowania zdanie „Zaloguj się, żeby dołączyć do paczki znajomych. Kod zaproszenia zapamiętamy.” Po zalogowaniu (strona się przeładowuje): okno „Dołączyć do paczki: <pseudonim prowadzącego>?” z liczbą osób, „Dołącz” / „Nie teraz”; pełna paczka albo inna paczka → jasny komunikat.
- `skrot.paczka` w `skrot-supabase.js` (wywołania RPC; brak v37 w bazie → „Paczki jeszcze nie działają”). EN: wszystkie nowe teksty w `i18n-en.js` (+ liczby mnogie „dzień nauki”, „dnia nauki”; „osoba/osób” ma własną funkcję `pkOsob`, bo wpis „osoba” w słowniku zmieniał zdania statystyk w Haśle dnia i Drabinie); pseudonimy oznaczone `data-noi18n`.

## Kroki dla Bartka (klik po kliku)
1. Supabase → projekt Skrótu → **SQL Editor** → **New query**.
2. Wklej całą zawartość `supabase/skrot-v37-paczka.sql` (po v36) → **Run**. Ma być „Success. No rows returned”. Można uruchomić drugi raz (nic się nie zdubluje).
3. Sprawdzenie (to samo okno, nowe zapytanie): `select public.nauka_paczka_cfg();` → `{"max_osob": 8, "duet_cel": 8, ...}`.
4. Wdróż stronę z tej gałęzi dopiero po kroku 2 (bez v37 widok mówi „Paczki jeszcze nie działają”, nic się nie psuje).
5. Bez sekretów, bez funkcji Edge, bez pg_cron.

## Do decyzji (podjęte sam, do ewentualnej zmiany)
- **Cel duetu 8 sesji, nagroda 20 🪙 dla każdej osoby**: w Zdawalni 10 sesji planu i 40 kratek; w Skrócie sesja = dzień nauki, więc 8 z 14 możliwych (np. po 4 dni). 20 🪙 raz w tygodniu to mniej niż Zadanie tygodnia (40–50 🪙) i nie rusza limitu 64 🪙 dziennie z nauki (nie jest liczone z punktów). Zmiana = `nauka_paczka_cfg()` + `paczka.js` `CFG` (test pilnuje zgodności).
- **Wspólny cel paczki = 70% z 3 dni nauki na osobę** (Skrót nie ma planu sesji jak Zdawalni; `plan_dni` 3). Bez monet za cel paczki (spec mówi o monetach tylko przy duecie).
- **Właściciel wychodzi → prowadzenie przechodzi** na osobę najdłużej w paczce (zamiast rozwiązywać paczkę pozostałym); ostatnia osoba wychodzi → paczka znika. Tak samo przy usunięciu konta.
- **Kto może**: zakładać i dołączać może każde zalogowane konto (to tylko wysiłek, nic płatnego); monety za duet dostaje tylko osoba z dostępem (opłacony, okres próbny, starosta) i niezablokowanym kontem. Druga osoba nie traci swoich, gdy pierwsza nie ma dostępu. Sprawdzenie dostępu drugiej osoby bez urządzenia (nie da się sprawdzić cudzego urządzenia).
- **Duet za zgodą obu**: propozycja → przyjęcie (wzajemna propozycja = start od razu). Jedna własna propozycja naraz, jeden duet na osobę. Duet trwa tydzień po tygodniu, aż ktoś go zakończy albo wyjdzie z paczki. Nagroda już przyznana zostaje po zakończeniu; nowa para w tym samym tygodniu nie daje drugiej nagrody tej samej osobie.
- **Widać „Ty: X · Kasia: Y”** w duecie (jak `mine`/`theirs` w Zdawalni): to liczba dni nauki, czyli wysiłek, nie wynik.
- **Bez szturchnięć i rankingu „kratek”** z Zdawalni (zasada etapu), więc `NUDGES`, `canNudge`, `rankingOn` i tabela `nudges` nie są przeniesione.
- **Zdarzenie nauki z przesuniętym zegarem** liczy się jak w v35 (baza i tak przycina `kiedy` do ±48 h). Poprawka przy porcie: `squadWeek` zaokrągla 0,7 × 10 do 7 (w JS bez poprawki wyszłoby 8 przez błąd liczb zmiennoprzecinkowych).

## Testy
- PGlite `supabase/test/v37.sql` (K1–K14, migracja 2×): anon i zalogowany nie czytają tabel ani funkcji wewnętrznych; założenie, kod, podgląd, dołączenie kodem z myślnikiem i małymi literami; dwa konta z różnych roczników (BM i ZARZ) w jednej paczce widzą tylko `dni, dzis, id, ja, nick, w_duecie, wlasciciel` (bez rocznika, punktów, e-maili); `profile_test` to nie nauka; 7 sesji → bez monet, 8. sesja (powtórka) → wyzwalacz daje obu po 20 🪙; kolejne otwarcia / zdarzenia / ręczne rozliczenie → dalej jeden wpis na osobę; **ranking (`nauka_ranking`), statystyki rocznika (`nauka_kierunek_stat`) i `nauka_rp` identyczne przed i po**; bez dostępu brak monet (partner dostaje); limit 8 osób; usuwanie tylko przez właściciela; wyjście właściciela → prowadzenie przechodzi; `nauka_konto_slady` widzi `nauka_paczka_czlonkowie`, `nauka_duety`, `nauka_monety`, po `nauka_konto_usun_dane` zostaje tylko `auth.users`, paczka pozostałych działa (także po usunięciu konta prowadzącego); ostatnia osoba wychodzi → paczki nie ma. Cały łańcuch v13–v37 zielony (oczekiwany błąd v12 `limit_wpisow`).
- `node --test tests/*.test.js`: 135/135 (`paczka` 11: port squad.test.ts i duo.test.ts + zgodność z SQL, tydzień w Warszawie i zmiana czasu, cel paczki, postęp, link i kod z adresu).
- Playwright `docs/gry/test/paczka.mjs` 58/58: A Więcej → widok, bez paczki, zły / nieznany kod, założenie (kod, link), B paczka 3 osób (cel 6/7, tylko wysiłek, duet 5/8, „Usuń” ≥ 44 px, usunięcie z potwierdzeniem), C zaproszenie do duetu → przyjęcie, zakończenie, propozycja z wiersza, D link `?paczka=` bez logowania (zdanie na ekranie logowania, kod zapamiętany, adres czysty) i po zalogowaniu (okno → dołączenie, bez ponownej propozycji), E wyjście prowadzącego, F bez v37 i bez logowania, G EN bez polskich znaków. Zrzuty 375/1280 PL/EN.
- Pełny zestaw Playwright (41 plików): bez nowych błędów (stare: `etap5.mjs` `#loginDemo`, `etap7.mjs` 3, `scalanie.mjs` 2, `po-zajeciach.mjs` 26/28). `ustawienia.mjs` poprawiony z komentarzem: nowy wiersz „Paczka i duet” w „Ty” i limit wysokości Więcej 2000 → 2100 px.

## Nie sprawdzone
- Prawdziwa baza Supabase (tylko PGlite) i prawdziwe logowanie z linku (w testach atrapa: logowanie = przeładowanie strony z zapamiętanym kodem).
- Obciążenie wyzwalacza przy dużej liczbie zdarzeń (jedno zapytanie po indeksie na zdarzenie, gdy osoba nie ma duetu).

## Dla kolejnego rocznika
Nic: paczka jest międzykierunkowa (bez `rocznik_id`), teksty nie mają nazwy kierunku, a dzień nauki liczy się z tych samych zdarzeń dla każdego rocznika.
