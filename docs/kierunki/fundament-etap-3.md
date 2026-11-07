# Fundament pod inne kierunki – Etap 3 („Edytuję rocznik”, tylko admin)

## Co zmieniono

- `rocznik.js` → `wybrany()`: Podgląd jako → `skrot-admin-rocznik` (admin) → `skrot-rocznik` → BM. Użyty klucz admina ustawia `window.SKROT_EDYCJA`.
- `skrot-supabase.js`:
  - po zalogowaniu: konto bez roli admina (albo wylogowane) z kluczem → klucz kasowany i przeładowanie (wraca do swojego rocznika);
  - `syncRocznik`: gdy admin edytuje inny rocznik, nie zapisuje go w profilu i nie przełącza z powrotem – profil admina zostaje w BM (ranking, statystyki);
  - `skrot.edycja`, `skrot.edycjaUstaw(id|null)`, `skrot.rocznikiLista()` (RPC `nauka_roczniki_lista`, v31).
- `index.html`:
  - Narzędzia starosty → „Edytuję rocznik” (tylko prawdziwy admin, nie w Podglądzie) i ta sama pozycja w wyszukiwarce funkcji;
  - ekran `#/rocznikAdmin`: roczniki z `nauka_roczniki_lista()`, które mają wpis w `ROCZNIKI` (wszystkie statusy), z wydziałem i statusem; „Edytuj” / „Wróć do BM”;
  - stały pasek u góry „Edytujesz: <kierunek>, <rok>. rok · <status>” z „Zmień” i „Wróć do BM” (zieleń z `PALETA.md`: `--green-100`, `--green-900`, `--green-600`; przyciski ≥ 44 px);
  - bez Teams (`ROK.teams === false`): opis zakładki „Z prezentacji”, pusty stan, odsyłacz do slajdu, „Wgraj prezentację” i odpowiedź FAQ „Skąd są materiały?” bez słowa Teams („Wgraj materiał – prezentacja dla całego roku” był już zrobiony).
- `i18n-en.js`: 23 nowe pary; `?v=` podbite (`i18n.js`, `rocznik.js`, `skrot-supabase.js`).
- Atrapa: `nauka_roczniki_lista` (`mock-roczniki-lista`), zapisy po przeładowaniu (`mock-docs-trwale`).

Zapisy w trybie edycji idą do `ROK.id` (Etap 2: `makeDb`), więc terminy, ogłoszenia, „Wgraj materiał”, Panel AI i importy trafiają do edytowanego rocznika. „Podgląd jako” dalej nic nie zapisuje i ma pierwszeństwo.

## Jak sprawdzone

- `docs/gry/test/fundament-etap3.mjs` 23/23: admin przełącza się na rocznik testowy (lista ze statusem „lista oczekujących”), pasek u góry, profil zostaje BM, bez pętli przeładowań; ogłoszenie i termin dodane formularzami mają rocznik testowy; po „Wróć do BM” w Terminach i na Dziś ich nie ma; pasek PL/EN, 375/1280 px, bez poziomego przewijania i błędów konsoli; konto bez roli admina i wylogowane z ręcznie wpisanym kluczem wracają do BM.
- `node --test tests/*.test.js` 251/251 (nowy: kolejność `wybrany()`).
- Ekrany BM (Dziś, Przedmioty, Powtórki, Terminy, Więcej; student i admin; PL/EN) identyczne z `main`; `fundament-etap2.mjs` 22/22.

## SQL

Brak.

## Dla kolejnego rocznika

Wpis w `ROCZNIKI` + wiersz w `nauka_roczniki` wystarczy, żeby rocznik pojawił się w „Edytuję rocznik”.
