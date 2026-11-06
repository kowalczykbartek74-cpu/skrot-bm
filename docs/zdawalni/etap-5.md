# Etap 5: lista oczekujących + panel kierunków

Spec: „Systemy z Zdawalni w Skrócie”, etap 5. Gałęzie: `zdawalni/oczekujacy` (skrot-bm, od `main` 253dce3) i `zdawalni-zapisz-sie` (plan-bm, od `main` 97adecd).

## Co jest
- **Ekran wejścia zdawalni.pl → „Inny kierunek”**: zamiast otwierać maila zapisuje na listę. Kierunek z listy (z planów WEFiZ, bez działającego BM 1. st.), rok z planów albo „nie wiem”, albo „Nie ma mojego kierunku” z wpisaną nazwą; e-mail; zgoda na jeden mail.
- **plan.skrotbm.pl**: w stopce przycisk „Studiujesz inny kierunek? Zdawalni dla Twojego kierunku: zapisz się ↗” → `zdawalni.pl/?zapisz=plan` (formularz od razu, źródło „plan”).
- **Mail z linkami** „Potwierdź zapis” i „Usuń mój zapis” (PL i EN). Link otwiera stronę z przyciskiem; samo otwarcie linku (np. przez skaner poczty Microsoft 365) niczego nie potwierdza.
- **Panel** Narzędzia starosty → „Kierunki” (tylko administrator): potwierdzone zapisy na kierunek i rok, wpisane nazwy pogrupowane, źródła, „Pobierz CSV”.
- **Kierunki z systemu planów WEFiZ**: `scripts/kierunki-wefiz.mjs` przeszedł 24 kierunki × 6 lat (1 zapytanie/s). Wyszło 29 par kierunek-stopień z planem na 2026/27. „Ekonomiczno-prawny” i „Green Economy” są w formularzu uczelni, ale bez planu w tym roku, więc nie ma ich na liście (można wpisać ręcznie). Skróty jednoliterowe uczelni zamieniłem na kody: L → LOG, M → MKT, Z → ZARZ.

## Kroki dla Bartka

**A. SQL v34**: Supabase → skrzynka-bm → SQL Editor → New query → wklej całe `supabase/skrot-v34-oczekujacy.sql` → Run → „Success. No rows returned”.

**B. Resend** (mail z linkiem):
1. resend.com → **API Keys** → **Create API Key** → nazwa „skrot zapisz-sie”, Permission: **Sending access**, Domain: skrotbm.pl → Create → skopiuj klucz (`re_…`).
2. Sprawdź **Domains**: skrotbm.pl ma status Verified (te same ustawienia co maile logowania).
3. Supabase → Edge Functions → **Secrets** → dodaj:
   - `RESEND_API_KEY` = klucz z punktu 1,
   - `RESEND_FROM` = `Zdawalni <zapisy@skrotbm.pl>` (nazwa nadawcy „Zdawalni”; adres może zostać w domenie skrotbm.pl, bo ta jest zweryfikowana w Resend),
   - `ZAPISY_SALT` = dowolny długi losowy napis (np. 40 znaków z menedżera haseł). Nie wklejaj go nigdzie indziej.
   Uwaga: Resend Free to 100 maili dziennie razem z mailami logowania.

**C. Funkcja `zapisz-sie`** (bez weryfikacji JWT, bo działa bez logowania). Mogę ją wysłać sam jak `usun-konto` (`npx supabase functions deploy zapisz-sie --no-verify-jwt`), napisz „wysyłaj funkcję”. Albo w panelu: Edge Functions → Deploy a new function → Via Editor → nazwa `zapisz-sie` → wklej `supabase/functions/zapisz-sie/index.ts` → w ustawieniach funkcji wyłącz **Verify JWT** → Deploy.

**D. Sprawdzenie**: po wdrożeniu strony zapisz się na zdawalni.pl → Inny kierunek (swoim drugim adresem) → mail → „Potwierdź zapis” → przycisk → Narzędzia starosty → Kierunki: 1 potwierdzony.

**E. plan.skrotbm.pl**: po D scalam `zdawalni-zapisz-sie` do `main` repo plan-bm (strona planu).

## Do decyzji
- **Polityka prywatności** (dopiszę po akceptacji, razem z tekstem z etapu 4): „Lista oczekujących: e-mail, kierunek i rok z formularza „Inny kierunek”, żeby wysłać jeden mail w dniu startu Twojego kierunku (Twoja zgoda). Przechowujemy do startu kierunku albo do usunięcia zapisu linkiem z maila; niepotwierdzone zapisy usuwamy po 30 dniach. Skrót adresu IP (nie sam adres) przez dobę chroni formularz przed spamem. Maile wysyła Resend.”
- Spec etapu 5 nie mówi, kiedy wysłać mail startowy do listy: to osobna rzecz (CSV z panelu albo etap 7).

## Testy
- `node --test tests/*.test.js`: 62/62 (`zapisy` 5).
- PGlite `supabase/test/v34.sql` O1–O10 (bez dostępu z przeglądarki, send/noop, limit 5 z sieci, potwierdzenie raz, wypisanie i ponowny zapis, panel tylko dla admina i tylko potwierdzone, CSV, usuwanie konta widzi zapis).
- Playwright `docs/gry/test/zapisy.mjs` 29/29 (375/1280, PL/EN). Przycisk na planie sprawdzony osobno (46 px, PL/EN).
- Funkcja Edge: sprawdzona składnia TypeScript; maile sprawdzi krok D.

## Dla kolejnego rocznika
Nowy kierunek w `nauka_roczniki` (status `platny`/`oczekujacy`) sam znika z listy wyboru („jest”); lista kierunków odświeża się skryptem raz w roku.
