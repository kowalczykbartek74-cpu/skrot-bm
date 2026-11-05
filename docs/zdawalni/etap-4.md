# Etap 4: usuwanie konta i kasowanie starych danych

Spec: „Systemy z Zdawalni w Skrócie”, etap 4. Gałąź `zdawalni/usun-konto` (od `main` 6fa158e).

## Co jest
- Ekran **Ustawienia → Konto → Usuń konto** (`#/usunKonto`): co zostanie usunięte, ostrzeżenie, że opłacony dostęp przepada, potwierdzenie wpisanym własnym e-mailem. Po usunięciu: wylogowanie i wyczyszczona przeglądarka.
- Funkcja Edge `supabase/functions/usun-konto`: Stripe (anulowanie subskrypcji od razu) → dane w bazie → konto w Auth → kontrola, że nic nie zostało. Gdy Stripe nie odpowie, **nic nie jest usuwane**.
- `supabase/skrot-v32-usun-konto.sql`: `nauka_konto_usun_dane` i zapytanie kontrolne `nauka_konto_slady`. Przechodzi po każdej tabeli z `user_id` albo `email`, więc przyszłe tabele są objęte same.
- `supabase/skrot-v33-retencja.sql`: codzienne kasowanie starych wpisów (pg_cron). **Do Twojej akceptacji przed uruchomieniem** (tabela niżej).
- „Moje materiały” nie używają Supabase Storage (plik czyta przeglądarka, treść jest w `nauka_docs`), więc plików do kasowania nie ma.

## Do decyzji

### 1. D3 i księgowa (ważne)
Robię według D3: z Supabase znika wszystko, historia transakcji zostaje w Stripe. Trzy miejsca, które warto pokazać księgowej, bo obecna polityka prywatności obiecuje przechowywanie:
- `nauka_dostep` (kiedy i za ile kupiony dostęp): znika; te same dane są w Stripe.
- `nauka_zgody` (dowód zgody na natychmiastowe dostarczenie treści, czyli utrata prawa odstąpienia, art. 38 pkt 13): znika. To dowód na wypadek sporu o zwrot. Jeśli księgowa albo prawnik każe go trzymać, wystarczy dopisać `nauka_zgody` do `nauka_konto_wyjatki()`.
- `nauka_polecenia`: polecenia osoby, która usuwa konto (jej nagrody i wypłaty), znikają. Zakup przez cudze polecenie zostaje, ale bez danych kupującego, bo to nagroda innej osoby.

### 2. Okresy przechowywania (v33)
| Dane | Tabela | Okres |
|---|---|---|
| Historia logowań i wizyt | `nauka_logowania`, `nauka_wizyty` | 12 mies. (jak w polityce) |
| „Jest teraz online” | `nauka_obecnosc` | 30 dni |
| Historia zmian urządzeń | `nauka_urzadzenia_log`; usunięte urządzenia | 12 mies. |
| Wyniki gier, odpowiedzi do rankingu, Hasło dnia | `nauka_odp`, `nauka_gry`, `nauka_haslo` | 12 mies. (jak w polityce; dotąd czyszczone tylko przy okazji) |
| Pomiar powtórek | `nauka_powtorki_log` | 400 dni |
| Zdarzenia nauki (profil nauki) | `nauka_zdarzenia` | 400 dni (dotąd tylko przy zapisie tej samej osoby) |
| Licznik limitu oceny AI | `nauka_ocena_ai` | 90 dni |
| Odwołania od oceny AI (z treścią odpowiedzi) | `nauka_ocena_odwolania` | 12 mies. |
| Zadanie dnia | `nauka_misja_osobista` | 90 dni |
| Próby hasła starosty | `admin_proby` | 1 dzień (jak dotąd) |

Nie kasujemy z czasem: punktów rankingu i monet (z nich liczą się poziomy i saldo), kupionych rzeczy, profilu, postępu, materiałów, dostępu, zgód, poleceń, kodów i kalendarza. Konta nieużywane ponad 12 miesięcy (polityka na to pozwala) nie są usuwane automatycznie.

### 3. Tekst polityki prywatności i regulaminu (wgram po akceptacji, z nową datą „obowiązuje od”)
Polityka prywatności, sekcja „Jak długo przechowujemy dane”, zmiany:
- „Dane konta i postępu: do usunięcia konta. Konto usuniesz sam w Ustawieniach (Konto → Usuń konto) albo pisząc do nas. Razem z kontem usuwamy postęp, Moje materiały, punkty, monety, kod polecający i dane do wypłaty; zgłoszenia błędów w materiałach zostają bez informacji, kto je wysłał. Nieużywane konta możemy usuwać po 12 miesiącach od zakończenia dostępu.”
- „Dane o płatnościach: historię transakcji przechowuje operator płatności (Stripe) przez okres wymagany przepisami podatkowymi (zwykle 5 lat od końca roku podatkowego). Po usunięciu konta nie przechowujemy ich w naszej bazie.”
- Nowe: „Profil nauki i zdarzenia nauki (jak odpowiadasz w powtórkach, lekcjach i testach): 400 dni od zdarzenia, potem są automatycznie usuwane.”
- Nowe: „Ocena AI w próbnym teście: licznik dziennego limitu 90 dni, odwołania od oceny 12 miesięcy.”
- Do „Historia logowań i wizyt”: „…; informacja, że jesteś teraz online: 30 dni.”
- „Program poleceń” zależy od decyzji w pkt 1 (jeśli zostaje jak w D3: „…do usunięcia kodu albo konta”).

Regulamin § 3, zdanie „Konto możesz w każdej chwili usunąć, pisząc na adres z § 1.” → „Konto możesz w każdej chwili usunąć sam (Ustawienia → Konto → Usuń konto) albo pisząc na adres z § 1. Usunięcie konta kończy Dostęp; plan miesięczny zostaje od razu anulowany, a za niewykorzystany okres nie zwracamy opłaty.”

Wersje angielskie (`prywatnosc-en.html`, `regulamin-en.html`) przetłumaczę 1:1 po akceptacji polskich.

## Kroki dla Bartka (klik po kliku)

**A. SQL v32** (można od razu): Supabase → projekt **skrzynka-bm** → SQL Editor → New query → wklej całe `supabase/skrot-v32-usun-konto.sql` → Run → „Success. No rows returned”.

**B. Klucz Stripe** (najlepiej ograniczony):
1. Stripe → Developers → API keys → **Create restricted key** → nazwa „skrot usun-konto”.
2. Uprawnienia: **Customers: Read**, **Subscriptions: Write**, reszta None → Create key → skopiuj (`rk_live_…`).
3. Supabase → skrzynka-bm → Edge Functions → **Secrets** → Add new secret → nazwa `STRIPE_SECRET_KEY`, wartość: wklej klucz → Save. Klucza nie wklejaj nigdzie indziej.

**C. Funkcja `usun-konto`**: Supabase → Edge Functions → **Deploy a new function** → **Via Editor** → nazwa `usun-konto` → wklej całe `supabase/functions/usun-konto/index.ts` → Deploy. (Albo w terminalu: `supabase functions deploy usun-konto`.) „Verify JWT” zostaw włączone.

**D. Sprawdzenie na koncie testowym** (nie na prawdziwym studencie):
1. Załóż konto na drugi adres e-mail, poucz się chwilę (quiz, fiszki), żeby były dane.
2. Ustawienia → Konto → Usuń konto → wpisz e-mail → Usuń konto na zawsze → „Konto usunięte”.
3. SQL Editor (tylko odczyt), wpisz id i e-mail konta testowego (id: Authentication → Users, zanim usuniesz; albo zapisz je wcześniej):
   ```sql
   select public.nauka_konto_slady('ID-KONTA'::uuid, 'adres@testowy.pl');
   ```
   Wynik ma być `{}`.
4. Jeśli konto miało plan miesięczny: Stripe → Subscriptions → subskrypcja ma status **Canceled**.

**E. SQL v33 (retencja)**, dopiero po akceptacji tabeli okresów: Supabase → **Integrations → Cron → Enable**, potem SQL Editor → wklej `supabase/skrot-v33-retencja.sql` → Run. W wyniku (Messages) ma być „OK retencja: zadanie skrot-retencja…”. Sprawdzenie: Integrations → Cron → Jobs → `skrot-retencja`.

Napisz, co z tego uruchomione i co akceptujesz (okresy, tekst, D3). Strona może wejść na `main` od razu po A–C (bez v33 i bez zmian w polityce): bez funkcji przycisk mówi „Usuwanie konta nie jest jeszcze włączone. Nic nie zostało usunięte.”

## Testy
- PGlite: `supabase/test/v32.sql` U1–U8 (przeglądarka nie ma dostępu; konto z danymi z kilku testów: przed ≥ 8 tabel, po usunięciu zero śladów; postęp i Moje materiały znikają, zgłoszenie zostaje bez autora; polecenia; inna osoba nietknięta; administrator odmowa), `test/v33.sql` T1–T4. Każda migracja 2×.
- Playwright `docs/gry/test/usun-konto.mjs` 25/25 (375 i 1280 px, błąd Stripe, sukces, administrator, EN).
- Funkcja Edge: sprawdzona składnia TypeScript; na prawdziwym Stripe i Supabase sprawdzi ją krok D.

## Dla kolejnego rocznika
Nic do zmiany: usuwanie i retencja nie zależą od rocznika, a nowe tabele z `user_id`/`email` są objęte same.
