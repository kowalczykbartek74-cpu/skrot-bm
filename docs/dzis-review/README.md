# Dziś – pętla przeglądu (gałąź dzis-duolingo, 16.11.2026)

| runda | wynik | twarde błędy | co zmieniono |
|---|---|---|---|
| 0 | — | (pomiar startowy na main) | panel calm: 15 tekstów < AA, warn: 12; Hasło dnia na Dziś |
| 1 | 3/10 | 2 (znak wodny konta; brak pomiaru każdego tekstu w raporcie) | panel ciemny przy calm/warn, zwarty „Twój postęp” z kafelkami, bez Hasła dnia, styl H pod panelem |
| 2 | 8/10 | 0 → koniec pętli | panel #133B2A/#1D4A36, jedno główne CTA, ikony SVG zamiast ↻ ▾ → ✕, cele ≥ 44 px, pomiar kontrastu każdego tekstu, ruch w raporcie, prawdziwe czcionki na zrzutach |
| 3 (szlif na prośbę Bartka) | **9/10** | 0 | tory pasków bez obrysu, pełne nazwy w kafelkach (3 linie, dzielenie wyrazów), „Otwórz lekcję” zamiast drugiego „Zaczynamy”, pastylki powitania z miękkim cieniem i ≥ 44 px w każdym motywie, Profil nauki jako karta z ikoną, przyciski panelu w jednym przewijanym rzędzie, jaśniejszy pierścień i krawędź panelu w ciemnym, stopka, boss: „Zadaj cios” obok „albo zagraj” |

Każda runda: `runda-N/raport.md` (pomiary), `runda-N/ocena.json` (recenzent), zrzuty. Skrypt: `docs/gry/test/dzis-review.mjs`
(`RUNDA=N BASE=http://127.0.0.1:<port>/ node docs/gry/test/dzis-review.mjs`). Wyciąg specyfikacji H: `spec-H.md`
(plik `claude/wyglad-redesign.md` nie istnieje w repo).
