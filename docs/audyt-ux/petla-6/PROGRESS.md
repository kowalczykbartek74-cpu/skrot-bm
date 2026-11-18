# Pętla UX-6 – Łatwość i instynktowność: PROGRESS

Gałąź `ux/6-latwosc`, katalog `~/zdawalni/ux-6`, port strony 8816, sonda 8826.
Wznowienie: „Kontynuuj pętlę UX-6 według ~/zdawalni/ux/petla-6.md i docs/audyt-ux/petla-6/PROGRESS.md”.

## Krok 0 (18.11.2026)
- Baza: wszystkie gałęzie ux/1–5 są w `origin/main` → baza = `origin/main` (c1356b9).
- `node --test tests/*.test.js`: 394/395 pass, 0 fail (1 pominięty). PGlite działa (koniec: v60b ✓, roczniki ✓, strażnik ✓).
- Wykluczenia w `.git/info/exclude`: zrzuty rund, `docs/dzis-review/runda-ux-6*/`, `docs/audyt-ux/petla-6/tmp/`.
- Narzędzia:
  - `stany.mjs` – stany startowe z C (termin z prawa za 3 dni, fiszki na dziś, w trakcie nauki, 7 dni przerwy, saldo 150, grupa C112, nowy gość). Wspólne terminy: kolokwium OWI 20.11 z zakresem w notatce, kolokwium z logistyki 4.12.
  - `sonda.mjs` – gotowa i sprawdzona (Z1 przechodzi do Dziś w próbie). Dodatkowe polecenie `/poczta` (mail z kodem logowania).
  - `docs/gry/test/ux6-zadania.mjs` – szkic ścieżek wzorcowych Z1–Z18, w trakcie dopasowywania.
  - `kontrola.mjs` – jeszcze nie.
- Atrapa (`// === ux-6 ===`): `verifyOtp` dla gościa „brak” zakłada konto „darmowe” (bez tego kod z maila nie logował w atrapie).

## Gdzie jestem
- Krok 0, punkt 6: dopasowanie `ux6-zadania.mjs`, potem `kontrola.mjs`, commit „UX-6 krok 0 – narzędzia audytu”.
- Uwaga: pierwszy przebieg `ux6-zadania.mjs` przerwało zamknięcie aplikacji (kod 137). Testy uruchamiam w tle z logiem w `/tmp/ux-6/`.

## Decyzje
- Zegar stron w sondzie i testach = 6.11.2026 17:00 (jak `h2-lib.mjs`), więc „termin za 3 dni” = 9.11.
- Sonda: element, którego jedyny tekst to symbol (np. „→”), liczy się jako „tylko ikona”.

## Spostrzeżenia z rozpoznania (do audytu, nie poprawiane przed rundą 0)
- Przycisk „→ Przygotuj się” przy kolokwium z przedmiotu bez materiałów (OWI) nic nie robi.
- Dziś przy kolokwium z prawa za 3 dni dalej proponuje „Lekcja 1: Pochodne funkcji”.
- Menu „Więcej” w nagłówku to sama ikona 40×40 px.
