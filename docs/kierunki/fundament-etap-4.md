# Fundament pod inne kierunki – Etap 4 (dostęp i płatność per rocznik, v45)

## Co zmieniono

- `supabase/skrot-v45-dostep-rocznik.sql` (strażnik na początku, po v44):
  - `nauka_dostep.rocznik_id` (kolumna z v38, nie dublowana): stare wiersze i karnety bez rocznika → BM, `not null`, domyślnie BM, klucz obcy do `nauka_roczniki`; klucz główny `(email, rocznik_id)` zamiast `email`;
  - `nauka_platny_konto()`, `nauka_ja()` (`dostep_do`, `plan`, `proba_do`) i `nauka_kalendarz_dane` (wersja z v44) – dostęp do rocznika osoby; okres próbny jak dotąd;
  - karnety: `nauka_admin_karnet_wydaj` na rocznik (bez rocznika = rocznik z profilu konta, bez konta BM), `nauka_admin_karnet_cofnij(email, rocznik = null)` (stara jednoargumentowa usunięta; strona woła tak samo);
  - `nauka_rocznik_do_kupienia(rocznik)` – tylko status `platny`.
  - Bez zmian (działają na „dowolny wiersz osoby” i dla BM dają to samo): polecenia v17, lejek v35/v38, paczka v37, aktywność v11, okres próbny v16 (kto płacił za jakikolwiek rocznik, nie dostaje próby), wybór rocznika v31, usuwanie konta v32 (kasuje wszystkie wiersze osoby).
- `supabase/functions/stripe-webhook`: logika przeniesiona do `obsluga.ts` (testowalna w Node), `index.ts` tylko podpis i klient bazy.
  - rocznik z 4. części `client_reference_id`; brak albo nieznany → BM (z `uwaga: nieznany_rocznik`); rocznik bez statusu `platny` zostaje (osoba zapłaciła), z `uwaga: rocznik_nie_platny`;
  - upsert po `(email, rocznik_id)`; ponowiony webhook i „nigdy nie skracamy” jak dotąd, ale w obrębie rocznika;
  - `invoice.paid`: wiersz z tą subskrypcją (czyli jej rocznik); faktura przed zakupem → jedyny wiersz osoby, a przy kilku – BM;
  - zwroty i spory: tylko cofnięcie polecenia, jak dotąd (dostępu webhook nie skraca);
  - baza bez v45 (brak klucza) → zapis po starym kluczu `email`, nic się nie blokuje.
- `admin.js` → `refStripe(uid, kod, źródło, rocznik)`: 4. część tylko dla roczników innych niż BM, więc link BM jest bajt w bajt taki sam.
- `skrot-supabase.js` → `goPay`: rocznik inny niż BM bez statusu `platny` → okno „Ten kierunek jeszcze nie ruszył” z zapisem na listę oczekujących (v34, `zapisy.js`, ze zgodą jak na ekranie wejścia); bez v45 w bazie – płatność jak dotąd. BM bez tego sprawdzenia.
- `i18n-en.js` (5 nowych par), `?v=` podbite.

## Nie zmieniono

Ceny, regulamin (§ 2 – zakres kierunków, decyzja Bartka), dane w Stripe, Payment Links (te same dla każdego rocznika, D2).

## Jak sprawdzone

- PGlite: `supabase/test/v45-przed.sql` + `v45.sql` D1–D14 (v45 uruchomione 2×): stare dostępy w BM, nowy klucz, `nauka_ja` i dostęp 6 kont BM/admina identyczne jak przed v45; zakup BM nie otwiera rocznika testowego i odwrotnie; karnet testowy działa tylko tam i nie rusza płatnego BM; cofanie karnetów; kalendarz; `nauka_rocznik_do_kupienia`; usunięcie konta kasuje wiersze z obu roczników.
- `tests/stripe-webhook.test.js` 9/9 (atrapa bazy i zdarzeń Stripe): BM jak dotąd (data, polecenie, źródło), zakup rocznika testowego obok BM, duplikat, nieznany i nieopłacany rocznik, subskrypcja + odnowienia w swoim roczniku, faktura przed zakupem, zwrot, baza bez v45.
- `tests/admin.test.js`: `refStripe` z rocznikiem.
- Playwright `fundament-etap4.mjs` 18/18: BM – ten sam link i `client_reference_id`, bez pytania bazy; rocznik płatny – rocznik w 4. części; rocznik oczekujący – okno listy (PL/EN, 375/1280); bez v45 – jak dotąd.
- Ekrany BM bez zmian, `fundament-etap2.mjs` 22/22, `fundament-etap3.mjs` 23/23, `node --test` 261/261.

## Kroki dla Bartka (zbiorczo w raporcie końcowym)

1. Run `skrot-v45-dostep-rocznik.sql` (po v44).
2. Supabase → Edge Functions → `stripe-webhook` → wdrożenie nowej wersji (dwa pliki: `index.ts` i `obsluga.ts`; „Verify JWT” wyłączone jak dotąd).
3. Test: płatność BLIK na koncie testowym BM → dostęp jest → zwrot w panelu Stripe.

## Dla kolejnego rocznika

Status `platny` w `nauka_roczniki` włącza zakup; do tego czasu strona sama zbiera chętnych na listę oczekujących.
