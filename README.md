# Skrót BM

Płatna platforma do nauki dla 1. roku Business Management (Uniwersytet Szczeciński): skróty, fiszki, quizy, wersje prostym językiem, zadania i terminy. Strona: **https://skrotbm.pl**

Darmowy plan zajęć i skrzynka do opiekunki roku są w osobnym repozytorium [plan-bm](https://github.com/kowalczykbartek74-cpu/plan-bm) pod adresem https://plan.skrotbm.pl.

## Jak to działa
- `index.html` – cała aplikacja (jedna strona). Plan zajęć pobiera z `https://plan.skrotbm.pl/plan.json`.
- `skrot-supabase.js` – baza, logowanie mailem i zakup dostępu (Supabase + Stripe Payment Link).
- `supabase/` – reguły bazy (uruchamiane w SQL Editor w kolejności: `nauka.sql`, `skrot.sql`, `skrot-platnosci.sql`, `skrot-darmowe.sql`) i funkcje serwerowe:
  - `functions/stripe-webhook` – po płatności w Stripe wpisuje roczny dostęp (sekret `STRIPE_WEBHOOK_SECRET`, bez weryfikacji JWT),
  - `functions/claude` – AI dla starosty (sekret `ANTHROPIC_API_KEY`). Studenci nie wołają AI: prosty język i „Dlaczego?” powstają z góry.
- Maile logowania: Resend (SMTP) z domeny skrotbm.pl.
- Kalendarz roku (tygodnie parzyste/nieparzyste, dni wolne, przerwy) strona bierze z `https://plan.skrotbm.pl/plan.json` (pole `kalendarz`, edytowane w `kalendarz.json` w repozytorium plan-bm). W `index.html` jest tylko kopia zapasowa.

## Prosty język i „Dlaczego?”
Każdy materiał ma dwie dodatkowe wersje zapisane w bazie: `materialSimple` (prosty język) i `quizWhy` (wyjaśnienia do quizu).
Powstają przy wgrywaniu materiału, a brakujące uzupełnia starosta w **Panelu AI** (menu po zalogowaniu jako starosta):
- **Uzupełnij brakujące** – przez funkcję `claude` na serwerze,
- **Pobierz paczkę / Wgraj gotowe wyjaśnienia** – bez serwera: paczkę JSON wrzucasz do czatu z Claude, a plik wynikowy wgrywasz z powrotem.

## Funkcja AI (jednorazowo)
W terminalu, w folderze tego repozytorium:
```
npx supabase login
npx supabase link --project-ref zkyxujkdrovfzpasocmv
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
npx supabase functions deploy claude
```
Sprawdzenie: Panel AI → „Uzupełnij brakujące”. Jeśli funkcja nie odpowiada, panel to napisze.
