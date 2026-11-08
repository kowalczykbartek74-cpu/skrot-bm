# Finanse i Rachunkowość (wefiz-fir-1-st-2026): Etap A

Stan 8.11.2026. Gałąź `kierunek-fir/a` w obu repozytoriach, od `kierunek-zarz/a` (Etap A Zarządzania).
Koszt API: 0 zł (bez wywołań AI).

## Co zrobione

- `kierunki/wefiz-fir-1-st-2026.json`: plik od Bartka plus jedno nowe pole `dos` (sekcja DOS Mickiewicza, niżej).
- `node scripts/kierunek.mjs kierunki/wefiz-fir-1-st-2026.json --plan-bm ~/plan-bm-fir` dał:
  - `rocznik.js`: wpis FiR (KIERUNEK-START/KONIEC), plan `plan.skrotbm.pl/plan/wefiz-fir-1-st-2026.json`, strona `?k=fir26`, grupy M120–M123;
  - `supabase/skrot-v48-fir26.sql` + `supabase/test/v48.sql` (kolejny numer po v47 Zarządzania), kolejka PGlite;
  - w plan-bm: `kierunki/wefiz-fir-1-st-2026.json`.
- plan-bm: `node scripts/update-plan.mjs --kierunek kierunki/wefiz-fir-1-st-2026.json`, `kalendarz.mjs`,
  `dziekanat.mjs --kierunki`, `kierunki.mjs` → `plan/wefiz-fir-1-st-2026.json`, wybór kierunku na stronie planu.
- `--sprawdz`: **bez rozbieżności**. 4 grupy i 8 przedmiotów z planu uczelni = slugi z pliku kierunku
  (`arkusz-kalkulacyjny-w-finansach-i-rachunkowosci`, `makroekonomia`, `matematyka`, `ochrona-wlasnosci-intelektualnej`,
  `podstawy-finansow`, `podstawy-prawa`, `podstawy-rachunkowosci`, `podstawy-zarzadzania`). Sylabus dopiero w Etapie B.

## Zmiany kodu (ogólne, bez wyjątków dla FiR)

Spec: jeśli FiR wymaga zmiany kodu, to błąd schematu. Były cztery takie miejsca:

1. **Parser planu (plan-bm `parse.mjs`).** FiR ma w planie uczelni nazwy w innym zapisie niż Zarządzanie:
   „makroekonomia (ćw)(30)”, „podstawy finansów (lab gr. A)(15)”. Wcześniej wszystko wychodziło jako rodzaj „X”,
   bez grup labów, i `--sprawdz` nie widział żadnego przedmiotu. Teraz rodzaj → `k`, grupa labów → `g`, godziny → `h`.
   Sale „s.N019 lab Mic.64” → „s. N019 (lab)”, tak jak Cukrowa. Kropka po dacie w wpisie ręcznym („08.10.2026.”) nie trafia do opisu.
2. **Sekcja DOS (plan-bm `dziekanat.mjs`).** Adres brał się z wydziału (WEFiZ → Cukrowa), a FiR ma komunikaty
   w sekcji Mickiewicza. Nowe opcjonalne pole `dos` w pliku kierunku (sprawdzane w `sprawdzPlik`) → konfiguracja planu →
   pierwszeństwo przed `wydzial.dos_url`. Bez pola wszystko działa jak dotąd (Zarządzanie, BM).
3. **Lista wpisów DOS (`parseList`)** rozpoznawała tylko `/cukrowa/` i `zajecia-cukrowa`. Teraz sekcja jest brana z adresu źródła.
4. **Test `tests/kierunek.test.js`** zakładał, że Zarządzanie jest ostatnim wpisem w `rocznik.js`. Teraz bierze ostatni wpis.

`scripts/kierunek.mjs` zmienił się tylko o pole `dos` (walidacja + przekazanie); FiR przeszedł przez niego bez innych zmian.

## Testy

- skrot-bm: `node --test tests/*.test.js` 279/279; nowy test „rocznik FiR” (M120–M123, v48, `dos`).
- PGlite: `node supabase/test/pglite.mjs`: v48 dwa razy + K1–K6 OK, BM bez zmian.
- Przejście ekranów (`ROCZNIK_PLIK=kierunki/wefiz-fir-1-st-2026.json PLAN_PLIK=…/plan-bm-fir/plan/wefiz-fir-1-st-2026.json … fundament-etap7.mjs`): **24/24**
  (karta FiR na ekranie wejścia, grupy M120–M123 w kroku 2, przedmioty z planu, brak treści BM i słowa Teams, PL/EN, 375/1280 px,
  admin edytuje rocznik, lista oczekujących zamiast płatności).
- BM bez zmian: `fundament-bm-tekst.mjs`, 24 ekrany przed (`kierunek-zarz/a`) i po: identyczne.
- plan-bm: `node --test scripts/*.test.mjs` 12/12; plan C111–C113 i komunikaty BM identyczne jak przed zmianą parsera.
- Strona planu `?k=fir26` (375 px): Finanse i Rachunkowość, 1. rok, M120–M123, laby A/B, konsola bez błędów.

## Do wiadomości

- W sekcji DOS Mickiewicza teraz nie ma żadnego wpisu dla M120–M123. Część wpisów ma tytuł w stylu „1 rok TiR- odwołanie…”
  (kierunek zamiast numeru grupy); automat rozpoznaje tylko numery grup, więc taki wpis dla „1 rok FiR” zostałby pominięty.
  Do decyzji przy Etapie F (czy rozpoznawać też „1 rok <kod kierunku>”).
- Szkolenie z obrony cywilnej (8.10, Aula WNS) jest w planie jako wpis ręczny z opisem miejsca, jak w BM.
- Strona planu ma w nagłówku przycisk „Skrót BM ↗” także dla FiR i Zarządzania (z Etapu A Zarządzania, nie zmieniałem).

## Kroki dla Bartka (lista z `scratch/fir26/lista.md`)

1. plan-bm: scalić `kierunek-fir/a` (po `kierunek-zarz/a`); po publikacji https://plan.skrotbm.pl/?k=fir26.
2. SQL v48: `supabase/skrot-v48-fir26.sql` z github.com („Copy raw file”) → SQL Editor → Run, **po v47**.
   Na dole jeden wiersz: `wefiz-fir-1-st-2026`, `oczekujacy`, `plan_url` = https://plan.skrotbm.pl/plan/wefiz-fir-1-st-2026.json.
3. skrot-bm: scalić `kierunek-fir/a`; okno prywatne → karta „Finanse i Rachunkowość”, grupy M120–M123, lista oczekujących.

Dalej: Etap B (sylabus FiR, przedmioty z egzaminem w zimie). Etapy C–E dopiero po zatwierdzeniu lekcji Zarządzania w banku PL.
