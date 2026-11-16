# Uwagi pętli 5 dla innych pętli

Rzeczy zauważone poza obszarem pętli 5 (B3). Pętla 5 ich nie zmienia.

## Pętla 4 (wygląd, cele dotyku, skala tekstu)
- Dolny pasek zakładek: podpisy „Dziś”, „Przedmioty”, „Powtórki”, „Terminy”, „Kalendarz” mają 11,84 px (< 12 px) – wszystkie ekrany.
- `backLink` („← Przedmioty”): 127×36 px (< 44). Linki stopki („Plan zajęć (za darmo)”, „Regulamin”…): wysokość 21 px.
- Plakietka „Teraz” (`.h2-now`) przy następnej lekcji: 11,84 px.

## Pętla 3 (lekcja)
- `lessonsBar` na ekranie końca lekcji (`.pts-gain`) pokazuje „Lekcje: k z n · N%”; ścieżka przedmiotu mówi teraz „Opanowanie N%” i „k z n lekcji zrobione” (ta sama liczba, inne słowa). Warto ujednolicić podpis na „Opanowanie”.
- Widok lekcji w materiale: `h("p", { class: "lesson-intro" }, inline(L.intro))` pokazuje „undefined”, gdy treść lekcji nie ma pola `intro` (index.html ok. 9602 i 9850). Prawdziwe lekcje mają intro, ale zabezpieczenie `L.intro ? … : null` byłoby tanie.

## Pętla 4 – ekran materiału (cele dotyku < 44 px, stan z main)
- „Ściągawka do druku” 135×21, kroki `.step` 1/2/3, przełącznik „Normalnie · EN” / „Prościej · PL” (36 px), `summary` „Odpowiedź” (23 px), „✓ Przerobione (cofnij)” 193×43.
- `tests/mapa-tematow.test.js` „--bez-api” bywa czerwony przy równoległym `node --test` (wyścig na scratch/…/mapa.json); sekwencyjnie zielony. Do poprawy w teście (katalog tymczasowy).
