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
  - `docs/gry/test/ux6-zadania.mjs` – ścieżki wzorcowe Z1–Z18, wszystkie przechodzą. Kroki liczą się same (klik, wpisz, każde przewinięcie, gdy elementu nie widać). Ponad limit (do 2×) = ⚠, nie błąd: test pilnuje, że droga istnieje. Dziś ponad limit: Z5 (9/5), Z13 (5/4), Z16 (11/6).
  - `kontrola.mjs` – pełna: platne × (360, 390, 1280, 390 ciemny, 390 EN) × 26 ekranów + starosta, darmowe, proba, proba-koniec, brak; `szybko` = tylko 390 jasny.
  - `runda.sh <R>` – kontrola + testy dopisane do kontrola.md + sonda w tle. `tester-prompt.md` – polecenie dla Tester-Sędziego (E1) z wpisanymi parametrami startu.
- Atrapa (`// === ux-6 ===`): `verifyOtp` dla gościa „brak” zakłada konto „darmowe” (bez tego kod z maila nie logował w atrapie); `update` dokumentu podbija `updated_at` i atrapa honoruje `order(updated_at)` + `limit` (bez tego strona nie widziała zmian, np. przesuniętego terminu – w prawdziwej bazie działa). Po zmianie zielone: H2 1–10, ux1 1–4, ux2 1–3, ux3 1–5, ux4 W2–W4, ux5 1–3. Czerwone **już na origin/main** (to samo z atrapą z main): `ux2-etap4` (K5 – adresy w pamięci sw), `ux2-etap5` (3 ✗: oczekuje bloku „Więcej na dziś”, usuniętego w c1356b9), `ux4-etapW1` (K2 – nagłówki sekcji Dziś 18 px). Do poprawy asercji w rundzie 1 osobnymi commitami „test: …”.

## Gdzie jestem
- Krok 0, punkt 7: narzędzia gotowe; czekam na koniec regresji, potem commit „UX-6 krok 0 – narzędzia audytu” i runda 0 (`runda.sh 0` + Tester-Sędzia).
- Uwaga: pierwszy przebieg `ux6-zadania.mjs` przerwało zamknięcie aplikacji (kod 137). Testy uruchamiam w tle z logiem w `/tmp/ux-6/`.

## Decyzje
- Zegar stron w sondzie i testach = 6.11.2026 17:00 (jak `h2-lib.mjs`), więc „termin za 3 dni” = 9.11.
- Sonda: element, którego jedyny tekst to symbol (np. „→”), liczy się jako „tylko ikona”. Widoczność przez `checkVisibility()` (sekcje `hidden=until-found` mają rozmiar, ale nie są widoczne).
- Kontrola: pomijane fałszywe alarmy pomiaru: cienka linia z gradientu (podkreślenie `.tl-t`), litery awatara na tle SVG (`.kav-l`), ozdobnik bez liter z kontrastem < 1,2 (✓ przed odhaczeniem, aria-hidden).
- Z16 w poleceniu testera: dopisane „Jesteś starostą roku.” (konto starosty, inaczej zadanie jest bez sensu dla „studenta”).
- Gry w kontroli: lista gier i ekrany Hasła/Bossa, bez ekranu końca każdej gry (shortcut w kontrola.mjs).

## Spostrzeżenia z rozpoznania (do audytu, nie poprawiane przed rundą 0)
- Przycisk „→ Przygotuj się” przy kolokwium z przedmiotu bez materiałów (OWI) nic nie robi.
- Dziś przy kolokwium z prawa za 3 dni dalej proponuje „Lekcja 1: Pochodne funkcji”.
- Menu „Więcej” w nagłówku to sama ikona 40×40 px.
- „Przygotuj się” z prawa przy kolokwium za 3 dni pokazuje zaliczenie wykładu za 81 dni (zła część), a plan dnia ma emoji 🧭 🔁 📝 ⚡.
- Okno zakupu: „Zostało ok. 9 miesięcy, a co miesiąc wyszłoby ok. 315 zł” – 315 zł to suma, nie kwota miesięczna (tekst ceny → do-decyzji, jeśli audyt to wskaże).
- Starosta: edycja terminu dopiero po włączeniu „Trybu starosty” głęboko w Więcej.
