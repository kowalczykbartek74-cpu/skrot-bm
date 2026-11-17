# Pętla UX-4 – Wygląd, spójność i szybkość – RAPORT etapu A (W1–W4)

Gałąź `ux/4-wyglad` (wypchnięta), katalog `~/zdawalni/ux-4`. Start: `origin/main` = `da5c455`; `main` nie zmienił się w czasie pętli
(`git merge origin/main` = „Already up to date”). **Etap B (W5–W7) czeka** na zdanie „Kontynuuj pętlę UX-4 etap B według ~/zdawalni/ux/petla-4.md”
po scaleniu pętli 1, 2, 3, 5 i tego etapu A do `main`.

## 1. Etapy

| etap | wynik | rundy | zaliczony | commit |
|---|---|---|---|---|
| W1 czcionki i typografia | 8/10 | 3 (7 → 5 → 8) | tak | `a1a4f1a` |
| W2 dotyk, pomoc, toast | 8/10 | 1 | tak | `787be50` (+ `ae45e57` test h2-etap10) |
| W3 Przedmioty, stany puste, znak wodny, marka | 8,5/10 | 1 | tak | `6e9bad8` |
| W4 ikony SVG | 8,5/10 | 2 (8, K1 false → 8,5) | tak | `cd66df1` |

Testy na końcu (port 8814, atrapa): `node --test tests/*.test.js` 368 ✓ / 0 ✗; `h2-etap1…10` wszystkie zielone (25, 24, 33, 48, 33, 36, 27, 47, 85, 92);
`ux4-etapW1` 50/50, `ux4-etapW2` 104/104 (w tym `ux4-cele` 22/22), `ux4-etapW3` 59/59, `ux4-etapW4` 35/35;
`RUNDA=ux-4 dzis-review.mjs`: 0 tekstów < AA, 0 axe, 0 celów < 44 px, 0 błędów konsoli, bez poziomego przewijania – jak w `runda-3` (wysokość „Twój postęp” 474 zamiast 463 px przy 375, limit 520).
SQL i funkcje Edge: brak (pętla bez SQL). Skrót tablic quiz w atrapie i `docs/`: bez zmian.

## 2. Ostatnia ocena recenzenta każdego etapu

**W1 (runda 3)**
```json
{"wynik": 8, "punkty": {"spojnosc": 2.5, "czytelnosc": 2, "dostepnosc": 2, "jakosc": 1, "ruch": 0.5}, "twarde_bledy": [], "kryteria": {"K1": true, "K2": true, "K3": true, "K4": true},
 "poprawki": ["Dziś: plakietka „data szacowana” ucięta przy 360 px (poprawione przed commitem + test ucięć)", "sonda ucięć dla elementów podniesionych do 12 px (dodana)", "„Jeszcze nic tu nie ma.” w karcie Powtórek innym krojem (pętla 3/2 – uwagi)", "nagłówek miesiąca i agendy krojem nagłówków", ".tl-t 16 px z balance", "przygaszony podtytuł powitania", "font-display: optional dla Bricolage"]}
```
**W2 (runda 1)**
```json
{"wynik": 8, "punkty": {"spojnosc": 2, "czytelnosc": 2, "dostepnosc": 2, "jakosc": 1, "ruch": 1}, "twarde_bledy": [], "kryteria": {"K1": true, "K2": true, "K3": true},
 "poprawki": ["„Wszystkie gry →” przy 360 px (poprawione)", "„?” w Kalendarzu przy prawej krawędzi (poprawione)", "„⋯” w Terminach w rozmiarze „?” (poprawione)", "„?” na ścieżce przedmiotu (pętla 5 – uwagi)", "zrzuty toastu błędu 360/390/ciemny, lżejszy dół", "ikona × w toaście", "„Zamknij” jako pełny przycisk (poprawione)", "summary „Prowadzący i temat zajęć” (pętla 5 – uwagi)", "„undefined” (zrobione w W3)"]}
```
**W3 (runda 1)**
```json
{"wynik": 8.5, "punkty": {"spojnosc": 2, "czytelnosc": 2, "dostepnosc": 2, "jakosc": 2, "ruch": 0.5}, "twarde_bledy": [], "kryteria": {"K1": true, "K2": true, "K3": true, "K4": true},
 "poprawki": ["stan pusty wyśrodkowany, Staś większy, przycisk na pełną szerokość, karta do 560 px (poprawione)", "smutniejsza mina Stasia", "wejście stanu pustego (dodane, wyłączane przez calm/reduced-motion)", "pusty stan Powtórek tym samym komponentem (pętla 2 – uwagi)", "ikona kafla „Moje materiały”", "pigułki w rzędzie na jednej linii", "„0 z 2” bez łamania", "zapas znaku wodnego przy 360 px"]}
```
**W4 (runda 2)**
```json
{"wynik": 8.5, "punkty": {"spojnosc": 2.5, "czytelnosc": 2, "dostepnosc": 2, "jakosc": 1, "ruch": 1}, "twarde_bledy": [], "kryteria": {"K1": true, "K2": true, "K3": true},
 "poprawki": ["prostszy jednorożec (uproszczony)", "łąka i lotos mniej ścieżek (uproszczone)", "„Jachtklub” w jednej kolumnie (poprawione)", "ikona kafla „Moje materiały”", "ikony i chevron w „Dla wszystkich przedmiotów”", "strzałki „→” jako SVG", "FAQ przewodnika ≥ 44 px (poprawione)", "krótszy podpis „Ranking kierunku”", "kolumna emoji w raporcie także dla górnego paska"]}
```
Pełne oceny, raporty rund i część automatyczna: `docs/audyt-ux/petla-4/etap-W*/runda-*/raport.md`, dziennik w `PROGRESS.md`.

## 3. Przed i po

`docs/audyt-ux/petla-4/przed-po/`: `przed-<ekran>-<390|1280>-<jasny|ciemny>.png` (stan `main`) i `po-…` (koniec etapu A, starosta) dla:
przedmioty, terminy, kalendarz, powtorki, wiecej, ustawienia, slowniczek, przewodnik. Zrzuty pierwszego ekranu z rund zaliczonych: `etap-W*/zaliczone/`.
Najważniejsze różnice: wszystkie nagłówki Bricolage 700 z jedną hierarchią (28/18/16, Dziś 22/28/18) i czcionki z repo;
„?” zawsze w wierszu tytułu po prawej; równe paski i krótkie pigułki w Przedmiotach; ikony SVG zamiast emoji (Więcej, Ustawienia, górny pasek);
stan pusty ze Stasiem; znak wodny w marginesie.

## 4. SQL i funkcje Edge do wdrożenia

Brak. Pętla 4 nie ma migracji ani funkcji Edge. Wdrożenie strony: zwykłe scalenie gałęzi (pliki `fonts/*.woff2`, `wyglad-ux.css`, `ikony-ux.js`,
`icons/odznaka-zdawalni.svg` muszą trafić na serwer razem z `index.html`).

## 5. Do decyzji Bartka

1. **CSP w linii 1:** wpisy `fonts.googleapis.com` / `fonts.gstatic.com` zostają do etapu B (A4c). Strona już ich nie używa.
2. **Stare grafiki:** `icons/emblem.png` (heksagon SB) i `icons/logo.png` („Skrót BM”) nie są już używane w aplikacji – usunąć z repo?
3. **Maile logowania z `skrotbm.pl`** (README) – nadawca w Supabase → Auth → SMTP powinien brzmieć „Zdawalni” (ustawienie panelu, poza pętlą).
4. **Znak wodny** leży teraz pod kartami (`z-index: -1`): widać go na tle strony i na wydrukach, ale nie na kartach. Jeśli ma być widoczny także na treści, trzeba wrócić do nakładki i zgodzić się, że karuzele na Dziś (dochodzące do krawędzi ekranu) będą go przecinać.
5. **Mina Stasia w stanie pustym** to istniejąca „oops” (kropla potu); prawdziwie smutna mina wymaga nowego nastroju w `STAS_MOOD` (kod Stasia nie jest w obszarze pętli 4).

## 6. Uwagi dla innych pętli

Pełna lista: `docs/audyt-ux/petla-4/uwagi-dla-innych.md`. Najważniejsze:
- **pętla 1:** przeskok pola logowania (CLS ≈ 0,25) – `#loginBox` maluje się jako „Ładowanie…” (23 px), a po ~60 ms jako formularz (656 px). Na `main` schowany przez blokujący arkusz Google Fonts; po przeniesieniu czcionek do repo widać go. Poprawka: zarezerwować wysokość pola.
- **pętla 2:** pusty stan Powtórek tym samym komponentem `ZD_UX4.pusty()`; tytuł „Jeszcze nic tu nie ma.” jako nagłówek.
- **pętla 5:** „rozdz. undefined” na ścieżce przedmiotu (`courseSection`); „?” ścieżki na `ZD_UX4.pomoc()`; `summary` „Prowadzący i temat zajęć” 32 px; emoji poziomów (`LP_LEVEL_ICO`) poza ekranem Więcej.

## 7. Ryzyka przy scalaniu

Pliki i miejsca poza własnymi plikami (`wyglad-ux.css`, `ikony-ux.js`, `fonts/`, `icons/odznaka-zdawalni.svg`):
- **`index.html` linia 1:** tylko `i18n.js?v=20261117-ux4` (podbite, bo zmienił się `i18n-en.js`) – przy konflikcie wyższa wersja.
- **`index.html` linie 74–76:** linki Google Fonts zastąpione jednym `<link rel="preload" … fonts/pjs-latin.woff2>`.
- **za głównym `</style>`:** nowa linia `<link rel="stylesheet" href="wyglad-ux.css?v=…">`; **za głównym `</script>`:** nowa linia `<script src="ikony-ux.js?v=…">`; **przed końcem aplikacji:** blok `// === most ux-4 ===` (zachować wszystkie mosty).
- **funkcje w `index.html`** (wszystkie z listy B3 pętli 4, wywołania przez `window.ZD_UX4?.… ?? <stary kod>`): `toast`, `flushProgress` (tylko komunikat), `viewTerms`, `openTermsHelp`, `tlSection`/`pastBox`/`estBox` (przecinek dla czytnika), `viewCalendar`, `reviewHome` (tylko nagłówek – pętle 2 i 3 też dotykają Powtórek), `viewGlossary`, `subjectLabel`/`subjectTile` (kafle `.nb`), `viewMaterial`/`lessonPanel`/`lessonPanel2` (bez „undefined”), `viewPo5` (stan wygasły), `viewMore`/`moreProfile`, `setWyglad`, `setPrzyp` (ikona), `renderNav` (tylko ikona przełącznika motywu), `guideHome`/`guideSource`/`guideTest`/`GTEST` (marka i FAQ), `font()` w `pinkTheme` i ładowanie Cormorant w `seaTheme` (usunięte linki Google).
- **`i18n-en.js`:** pary w bloku `// ux-4` na końcu `exact` (zachować obie strony).
- **`docs/gry/test/h2-etap10.mjs`:** asercja kwadratu mapy postępów 24 → 28 px (osobny commit `ae45e57`).
- **`PALETA.md`:** przepisany początek (Zdawalni H2); jeśli inna pętla też go zmieniała, zachować sekcje zmiennych bazowych `:root` (czyta je `tests/tresci.test.js`).
- **Wspólne ikony:** `ikony-ux.js` dopisuje do `H2_ICO` tylko nazwy, których tam jeszcze nie ma (rysunki dosłownie z A4d), więc nie nadpisze ikon innych pętli; własne mają prefiks `ux4-`.
- Po scaleniu uruchomić też `ux4-etapW1…W4.mjs` i `ux4-cele.mjs` (`BASE=…`).
