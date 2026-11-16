# Pętla UX-4 – Wygląd, spójność i szybkość – postęp

Gałąź `ux/4-wyglad`, katalog `~/zdawalni/ux-4`, port 8814. Start z `origin/main` = `da5c455` (16.11.2026).
Polecenie: `~/zdawalni/ux/petla-4.md`. Własne pliki: `wyglad-ux.css`, `ikony-ux.js`, `fonts/`.
Narzędzia: `docs/gry/test/ux4-lib.mjs` (pomiary), `docs/gry/test/ux4-runda.mjs` (zrzuty + raport rundy),
`docs/audyt-ux/petla-4/kontrola.mjs` (część automatyczna), testy etapów `docs/gry/test/ux4-etapW*.mjs`.

## Decyzje
- B1 przyjęte bez zmian (D12: Bricolage Grotesque 700 na h1/h2/h3 i nagłówkach sekcji, Plus Jakarta Sans w tekście; skala 12/14/16/18/22/28/36; pole dotyku przez `::after`; znak wodny zostaje w marginesie, krycie 0,14 na telefonie).
- Czcionki: pliki zmienne z Google Fonts zapisane w `fonts/` (podzbiory latin + latin-ext). Jeden plik obejmuje wszystkie grubości, więc „grubości, które kod używa” (PJS 400–800, Bricolage 600–700) to 2 pliki na krój, a nie 5. Preload tylko `pjs-latin.woff2`.
- Czcionki zastępcze `PJS-fallback` / `BG-fallback` (Arial z `size-adjust` i `ascent/descent-override`) zmierzone w przeglądarce na polskim zdaniu (`/tmp/ux-4/metryki.mjs`): PJS ≈ Arial 100 %, Bricolage 700 ≈ Arial 89,4 %.
- Kroje motywów (Cormorant, Playfair) jako `@font-face` w `wyglad-ux.css`: przeglądarka pobiera plik dopiero, gdy motyw użyje kroju. `font()` w motywach i ładowanie Cormorant w motywie nocnym zostały puste/usunięte.
- Hierarchia nagłówków (zielone motywy): tytuł ekranu h1 28 px, h2 18 px, h3 16 px (kafle lekcji na Dziś 18 px); na Dziś powitanie 22 px (28 px od 768 px), tytuł lekcji 28 px, nagłówki sekcji 18 px.
- Podłoga 12 px przez jedną regułę z `!important` w `wyglad-ux.css` (część starych reguł ma `!important`); kreski wpisów w siatce kalendarza na telefonie (font-size 0) zostają.
- Wpis w CSP (`fonts.googleapis.com`, `fonts.gstatic.com`) zostaje do etapu B (A4c).

## Etapy
| etap | stan | runda | wynik | twarde błędy | commit |
|---|---|---|---|---|---|
| W1 czcionki i typografia | **ZALICZONY 8/10** | 3 | r1: 7, r2: 5, r3: 8 | r2: 1 (kontrast .ev), r3: 0 | (ten commit) |
| W2 dotyk, pomoc, toast | – | – | – | – | – |
| W3 Przedmioty, stany puste, znak wodny, marka | – | – | – | – | – |
| W4 ikony SVG | – | – | – | – | – |

## Dziennik rund
- **W1 r1 – 7/10**, kryteria K1–K4 true, bez twardych błędów. Poprawki: kafle Przedmiotów łamały słowa („Makroekonomi/a”) przy 18 px → 16 px, łamanie tylko między słowami; pigułki terminów (W3); tytuły kart Terminów i dni agendy krojem nagłówków; powitanie na Dziś 28 px od 768 px; dni spoza miesiąca w kalendarzu bez `opacity` (kontrast); podpis pierścienia przewodnika w ciemnym; „Słowniczek” z falą `.ptitle`; „undefined” w materiale → W3 (`txt`).
  Ustalenie przy K4: przeskok logowania (CLS 0,25) to wypełnianie `#loginBox` (pętla 1); na main schowany przez blokujący arkusz Google Fonts. Zapisane w `uwagi-dla-innych.md`; test mierzy wkład czcionek osobno (0,000).
- **W1 r2 – 5/10**, twardy błąd: wpis `.day .ev.approx` w siatce kalendarza 1280 (4,1:1 jasny, 2,6:1 ciemny) po powiększeniu do 12 px. Poprawki: tekst wpisów tuszem `--h-ink`; powitanie na Dziś 22 px na każdej szerokości (tytuł lekcji 28 px jest jedynym największym); tytuły kart lekcji na Dziś 16 px; kafle Przedmiotów interlinia 1,2; przecinek dla czytnika w nagłówkach miesięcy Terminów. Test W1 sprawdza teraz kontrast każdego tekstu w kalendarzu, przewodniku i Terminach (1280, jasny i ciemny).
- **W1 r3 – 8/10 ZALICZONY**, twarde błędy: brak, K1–K4 true. Przed commitem poprawiona wskazana regresja: plakietka „data szacowana” na Dziś ucinała się przy 360 px po podniesieniu do 12 px (teraz dwie linie w kaflu) i test sprawdza, czy wszystkie elementy podniesione do 12 px mieszczą się (50/50). Pozostałe uwagi recenzenta na później: krój „Listopad 2026”/nagłówka agendy (to już h2 Bricolage – do sprawdzenia przy W2 na zrzutach), `.tl-t` 16 px z balance, podtytuł powitania przygaszony; „Jeszcze nic tu nie ma.” w `.rv-hero` → pętla 3 (uwagi).
- Zrzuty: w repo tylko pierwszy ekran z rundy zaliczonej (`etap-X/zaliczone/`); zrzuty pozostałych rund i całe strony są lokalnie w `etap-X/runda-R/` (wykluczone w `.git/info/exclude`, ok. 30 MB na rundę), raporty `raport.md`/`raport.json` wszystkich rund są w repo.
