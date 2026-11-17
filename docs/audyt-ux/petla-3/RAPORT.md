# Pętla UX-3 · Lekcja: reakcja, tempo i ekran końca — RAPORT

Gałąź `ux/3-lekcja` (katalog `~/zdawalni/ux-3`), własny plik `lekcja-ux.js`. Bez SQL i bez funkcji Edge. `origin/main` nie miał nowych commitów w chwili oddania (scalenie bez zmian).

## 1. Etapy

| Etap | Wynik | Rundy | Zaliczony |
|---|---|---|---|
| 1 Panel werdyktu na dole | 8/10 | 1 | tak |
| 2 Dźwięk, dotyk, Staś, combo | 8/10 | 1 | tak |
| 3 Mechanika odpowiedzi | 8/10 | 1 | tak |
| 4 Pasek, karty, ikony | 8/10 | 1 | tak (recenzja przerwana limitem API, wznowiona następnego dnia) |
| 5 Ekran końca | 7/10 → 8/10 | 2 | tak (runda 1: K1 bez testu Powtórek i wariantu „1/2”) |

Testy etapów: `docs/gry/test/ux3-etap1.mjs` … `ux3-etap5.mjs` (wspólne dane i pomocniki: `ux3-lib.mjs`). Pomiary rund: `docs/audyt-ux/petla-3/pomiar.mjs`, część automatyczna: `kontrola.mjs`, raport rundy: `raport.mjs`. Każda runda ma katalog `etap-N/runda-R/` z `raport.md`, `raport.json`, zrzutami i `recenzja.json`.

## 2. Ostatni JSON recenzenta każdego etapu

Pełne listy poprawek są w `etap-N/runda-R/recenzja.json`. Wyniki i kryteria:

- **Etap 1** (runda 1): `{"wynik": 8, "punkty": {"reakcja": 2.5, "tempo": 1.5, "uczciwosc": 2, "telefon": 1.5, "spojnosc": 0.5}, "twarde_bledy": [], "kryteria": {"K1": true, "K2": true, "K3": true, "K4": true, "K5": true, "K6": true}}`
- **Etap 2** (runda 1): `{"wynik": 8, "punkty": {"reakcja": 2.5, "tempo": 2, "uczciwosc": 2, "telefon": 1.5, "spojnosc": 0.5}, "twarde_bledy": [], "kryteria": {"K1": true, "K2": true, "K3": true, "K4": true}}`
- **Etap 3** (runda 1): `{"wynik": 8, "punkty": {"reakcja": 2.5, "tempo": 1.5, "uczciwosc": 2, "telefon": 1.5, "spojnosc": 0.5}, "twarde_bledy": [], "kryteria": {"K1": true, "K2": true, "K3": true, "K4": true, "K5": true}}`
- **Etap 4** (runda 1): `{"wynik": 8, "punkty": {"reakcja": 2.5, "tempo": 1.5, "uczciwosc": 2, "telefon": 1.5, "spojnosc": 0.5}, "twarde_bledy": [], "kryteria": {"K1": true, "K2": true, "K3": true, "K4": true}}`
- **Etap 5** (runda 2): `{"wynik": 8, "punkty": {"reakcja": 2.5, "tempo": 1.5, "uczciwosc": 1.5, "telefon": 1.5, "spojnosc": 1}, "twarde_bledy": [], "kryteria": {"K1": true, "K2": true, "K3": true, "K4": true, "K5": true, "K6": true}}`

Poprawki z recenzji wchodziły w kolejną rundę albo etap (dziennik w `PROGRESS.md`). Z ostatniej recenzji etapu 5 dwie rzeczy, które były błędami, poprawiłem przed commitem: oceny ostatniej fiszki zostawały w dolnym pasku na ekranie końca Powtórek, a cel dnia z `ZD_NAWYK` był brany sprzed zapisu XP. Reszta jest w punkcie 5.

## 3. Przed i po

Zrzuty w `docs/audyt-ux/petla-3/przed-po/`: `przed-*` to czysty `origin/main`, `po-*` to ta gałąź. Ten sam stan, 390 i 1280 px, jasny i ciemny:

- `*-zla-odpowiedz.png`: zła odpowiedź na pytaniu kontrolnym. Przed: „Nie tym razem.” jest pod przyciskiem i bez wyjaśnienia, „Dalej” zielone. Po: czerwony dolny pasek z ✗, „Poprawna: C.”, „Czemu nie A?”, „Dlaczego” (przewijane w panelu), Staś z dymkiem i czerwone „Rozumiem”; karta przewija się do poprawnej odpowiedzi.
- `*-koniec-karty-5min.png`: koniec „Dziś · 5 min”. Przed: „Zrobione ✓” przy każdym wyniku i 6 liczb. Po: tytuł i Staś według wyniku, pasek celu dnia z XP sesji, „Karta dnia: +10 XP”, wyniki w „Szczegółach”, jeden główny przycisk.

Dalsze zrzuty po zmianach są w katalogach rund (np. `etap-5/runda-2/390-karta-przejscia.png`, `390-koniec-lekcji.png`, `390-awans-na-finale.png`, `etap-3/runda-1/360-bilet-pewnosc.png`, `etap-4/runda-1/360-czytaj.png`, `1280-czytaj.png`).

## 4. SQL i funkcje Edge do wdrożenia

**Brak.** Pętla 3 nie ma migracji ani funkcji Edge. Wdrożenie to tylko scalenie gałęzi (pliki statyczne: `index.html`, `lekcja-ux.js`, `kosmetyki.js`, `i18n-en.js`).

## 5. Do decyzji Bartka

1. **„Prawda / Fałsz” jednym dotknięciem.** Zaznacz + „Sprawdź” dotyczy ABCD, Powtórek i banku pojęć. Karty `tf` zostawiłem z natychmiastową odpowiedzią (dwie duże odpowiedzi, bez pewności). Recenzent etapu 3 sugeruje ujednolicenie.
2. **Pewność na bilecie zawsze wymagana.** Nie da się odpowiedzieć „bez wyboru”: są dwa przyciski „Zgaduję” i „Pewny ✓”. Dzięki temu kalibracja i rewanże mają dane przy każdej odpowiedzi, ale w zdarzeniach nauki znika wartość `null`.
3. **Emoji w tekstach odtwarzacza.** Etykiety w kodzie mają dalej emoji (tak, jak są w `i18n-en.js`). W zielonych motywach obserwator w `lekcja-ux.js` zdejmuje je po tłumaczeniu, a w kickerach w ich miejscu stoją ikony SVG. Docelowo można usunąć emoji z samych tekstów i par EN (większa zmiana w słowniku).
4. **„Część k z n”.** `n` to liczba części z mapy lekcji (razem z biletem wyjścia), tak jak na mapie. Recenzent zwrócił uwagę, że pasek u góry pokazuje karty bieżącej części, nie części.
5. **Drobne uwagi recenzentów, których nie robiłem:**
   - ekran końca Powtórek nie ma jeszcze paska celu i ma podwójną serię (kafel i chip);
   - przy 2 gwiazdkach „Popraw część k” jest pod zgięciem, gdy główny przycisk to „Powtórki: N kart”;
   - karta przejścia jest pusta w 3/4 (można dodać kropki części albo „Teraz: …”);
   - „Na początku: haczyk ✓” jest mało zrozumiałe;
   - EN: dokładna para dla „Nie tym razem. Wynik: {0}{1}.” (z jednostką);
   - krótkie etykiety ocen w EN: „Nie” tłumaczy się jako „No”, a nie „Again”.

## 6. Uwagi dla innych pętli

Pełna lista jest w `uwagi-dla-innych.md`:

- **Pętla 4:** w Powtórkach przycisk „Wybierz przedmiot” ma 173×43 px; w motywie noc litera poprawnej odpowiedzi (`:is(.quiz, .lp-opts) .opt.right .k`) ma biały tekst na jasnozielonym tle (1,6:1).
- **Pętla 2:** animacja `g-wave` na Dziś działa przy `html.calm`.
- **Pętla 5:** w oknie „Awans!” animacje `lp-pop` nie znikają przy reduced-motion i calm. Plakietka „Awans!” w `lpLevelBar` ma 11,8 px, a w ciemnym zielonym słaby kontrast (na ekranie końca lekcji nadpisuję kolor).
- **Pętla 5 (Sklep):** przełącznik dźwięków w Sklepie zapisuje `""` zamiast `"0"`. Działa, bo dźwięk gra tylko przy `"1"`. Przełącznik jest teraz w Ustawieniach, więc w Sklepie wystarczy link.

## 7. Ryzyka przy scalaniu

- **`index.html`, linia 1:** zmieniony tylko `?v=` pliku `i18n.js` (`20261117-ux3g`). EN dociąga się z tą wersją. Przy konflikcie weź wyższą wersję.
- **`index.html`, linia skryptów:** zmienione tylko `kosmetyki.js?v=20261117-ux3`. Osobna nowa linia `<script src="lekcja-ux.js?v=20261117-ux3g">` jest za głównym `</script>`.
- **Most ux-3:** blok przed końcem aplikacji wystawia `h, S, go, render, toast, modal, H2_ICO, h2Ico, stasFace, LP, lpReduced, lpCards, lpCur, lpFloat, inline, ls, icon, kSound, LP_DAILY_GOAL`.
- **Funkcje w `index.html` zmienione poza samym odtwarzaczem:**
  - `ldSource`: `decorTop` („Pomiń krok” do dolnego paska, nazwa kroku pod paskiem) i `done(st)`. Pętla 2 też dotyka karty dnia (`lekcja-dnia.js`), ale nie tej funkcji;
  - `lpClose`: pokazuje awans odłożony z lekcji;
  - `xpFlush`: tylko moment awansu w lekcji (`LP.lvPending`; część serii jest pętli 2, jej nie ruszałem);
  - `kSound` / `kSoundOn`;
  - jeden wiersz w Ustawieniach: `...(window.ZD_LEKCJA?.ustawienia?.() || [])` za wierszem „Mniej animacji”.
- **Nowe funkcje odtwarzacza** obok `LPR`: `lpSel`, `lpRetryAdd`, `lpGapFor`, `lpBank`.
- **Zmiana zachowania odtwarzacza dla wszystkich źródeł** (quiz, Powtórki, karta dnia, egzamin bez zmian): zaznacz + „Sprawdź” i przyciski kart w dolnym pasku. Stare testy, które klikały odpowiedź jednym dotknięciem, poprawiłem w osobnych commitach „test: …”: `h2-etap4`, `lekcje-v4`, `rewanze`, `sprawdzian`, `poziomy`. Testy innych pętli, które przechodzą przez odtwarzacz, mogą wymagać tego samego. Wzór to funkcja `zatwierdz` w `lekcje-v4.mjs`.
- **Talia lekcji:** rozgrzewka z ≤ 2 kart dołącza do części 1, więc `sig` i liczba części się zmieniają. Migracja w `lpLoad` zachowuje zrobione części (`done.warm` traktowane jako zrobione).
- **`i18n-en.js`:** blok `// ux-3` na końcu `exact` (przy konflikcie zachowaj obie strony). Para `"×{0} z rzędu"` jest nowa.
- **Umowa `ZD_NAWYK`:** wołane przez `?.`: `ekranSerii`, `ofertaZamrozenia`, `celDnia`, `jutro`, `ofertaPrzypomnienia`, `zadaniaLinia`. Bez pętli 2 jest sam pasek celu z `LP_DAILY_GOAL`. Test z atrapą jest w `ux3-etap5.mjs`.
- **Testy niezwiązane z lekcją:**
  - `poziomy.mjs` ma 3 ✗ dokładnie jak na czystym `main`;
  - `stazysta-stas.mjs` pada jak na `main` (strict mode `.stas-face` w samym teście);
  - `tests/mapa-tematow.test.js` bywa niestabilny przy uruchomieniu całego zestawu (osobno 4/4, także na `main`).
