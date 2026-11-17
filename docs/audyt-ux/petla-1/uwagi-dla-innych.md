# Pętla UX-1 – uwagi dla innych pętli

Rzeczy zauważone poza obszarem pętli 1 (nie poprawiane tutaj).

- **Pętla 2 / nagłówek aplikacji** (`index.html` ok. 6275, przycisk „Kup dostęp” w pasku górnym ukryty na Dziś): C1 pkt 3 proponuje pokazać tam „Wypróbuj” dla `canTrial()`. Pasek górny nie jest na liście B3 żadnej pętli; pętla 1 zastępuje to pigułką `ZD_WEJSCIE.pasekProby()` na Dziś. Jeśli przy scalaniu ktoś przebudowuje nagłówek, może użyć `ZD_WEJSCIE.przyciskZakupu("naglowek")`.
- **Pętla 4 (skala tekstu ≥ 12 px) / pętla 2 (plakietki Dziś):** na Dziś istniejące teksty „poz. 1” (11,84 px, plakietka poziomu pod powitaniem) i „dni” (9,92 px, kółka terminów w „Twój postęp”) są poniżej 12 px. Istnieją na `main`, nie są z pętli 1.
- **Pętla 2/3 (Dziś, karta 5 min):** przyciski „5 min” / „15 min” na Dziś mają 66×36 i 72×36 px (< 44 px). Istnieją na `main`.
- **Pętla 2 (`ldBlock`, układ):** wiersz „Codziennie dwie lekcje… [Kup dostęp]” (`.row.ld-done`) nie ma tła karty (C2 P0 pkt 5) – tekst przyklejony do lewej krawędzi. Pętla 1 podmienia tylko wyrażenie przycisku.
- **`docs/gry/test/scalanie.mjs`:** 4 asercje padają także na czystym `main` (ranga/monety pod powitaniem, Zadania dnia) – do poprawy przez właściciela Sklepu/Dziś.
- **Pętla 2/5 (Dziś, karta „Zadanie dnia” `.jz-card`):** po ok. 2–3 s karta zmienia wysokość (134→112 px) i przesuwa sąsiadów: CLS ok. 0,06 na Dziś 390 px (konto darmowe). Istnieje na `main`.
- **Nagłówek aplikacji (poza B3):** na ekranie paywalla lekcji w pasku górnym jest zielony „Kup dostęp” obok zielonego „199 zł do lipca…” w paywallu (dwa zielone wezwania). Pętla 1 nie zmienia nagłówka; przy przebudowie można tam użyć `ZD_WEJSCIE.przyciskZakupu("naglowek")` albo ukryć przycisk, gdy na ekranie jest `.paywall`.
