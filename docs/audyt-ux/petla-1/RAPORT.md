# Pętla UX-1 – Wejście, okres próbny i zakup · RAPORT

Gałąź `ux/1-wejscie` (scalony z `origin/main` po pętli 3, bez rebase). Szczegóły rund: `PROGRESS.md`, katalogi `etap-N/runda-R/`.

## 1. Etapy

| etap | wynik | rundy | zaliczony |
|---|---|---|---|
| 1 Pierwszy ekran i jedna ścieżka do próby | 9,0 | 2 | tak |
| 2 Widoczna próba i uczciwe przyciski zakupu | 8,5 | 2 | tak |
| 3 Koniec próby jako wydarzenie | 8,0 | 1 | tak |
| 4 Paywall, odzyskiwanie i zaufanie | 8,0 | 2 | tak |
| 5 Lekcja dla gościa przed e-mailem | – | 0 | **nie (odłożony)** – wymaga trybu gościa w odtwarzaczu pętli 3 (szczegóły w PROGRESS) |

Regresja po scaleniu z `origin/main` (pętla 3 już na main): `node --test` 374/374, PGlite bez nowych błędów (✗ v12 `limit_wpisow` jak na main), H2 etapy 1–10 zielone, `ux1-etap1…4` 89/83/54/89, `ux3-etap1…5` zielone, `lekcja-dnia-4/5/6`, `lekcje-v4`, `wyglad-logowanie` zielone, przegląd Dziś (`RUNDA=ux-1-po-scaleniu`) bez naruszeń jak `runda-3`. Padają tak samo jak na czystym `origin/main`: `scalanie.mjs` (4 stare asercje), `lekcja-dnia-3.mjs` (2) i `lekcja-dnia.mjs` (timeout) – oba po scaleniu pętli 3 (uwagi-dla-innych.md).

## 2. Ostatnia ocena recenzenta każdego etapu (skrót JSON)

- **Etap 1 (runda 2):** `{"wynik": 9.0, "punkty": {"jasnosc": "2.5/3", "uczciwosc": "2/2", "spojnosc_H2": "1.5/2", "logika": "2/2", "telefon_dostepnosc": "1/1"}, "twarde_bledy": [], "kryteria": {"K1".."K6": true}}`. Poprawki (przeniesione do etapu 2 i zrobione): limonkowe „Włącz”, pasek w jednej linii, pierścień fokusu tylko przy klawiaturze, odstęp Stasia, przyciski powitania ≥ 44 px.
- **Etap 2 (runda 2):** `{"wynik": 8.5, "punkty": {"jasnosc": "2.5/3", "uczciwosc": "1.5/2", "spojnosc_H2": "1.5/2", "logika": "2/2", "telefon_dostepnosc": "1/1"}, "twarde_bledy": [], "kryteria": {"K1".."K6": true}}`. Poprawki zrobione w etapie 3: cena bez wielokropka, kafelki postępu tylko > 0 z odmianą, jedno wezwanie do próby przy pasku, tag „Dostępne” w karcie.
- **Etap 3 (runda 1):** `{"wynik": 8, "punkty": {"jasnosc": "2.5/3", "uczciwosc": "1.5/2", "spojnosc_H2": "2/2", "logika": "1.5/2", "telefon_dostepnosc": "0.75/1"}, "twarde_bledy": [], "kryteria": {"K1".."K5": true}}`. Poprawki zrobione na początku etapu 4: koniec próby z bazy, czyszczenie klucza po zakupie, mail tylko w dzień i dzień tygodnia z kalendarza, przyklejony przycisk na 360 px, karty planów jako wybór, tytuł jako h2, tor przełącznika ≥ 3:1.
- **Etap 4 (runda 2):** `{"wynik": 8.0, "punkty": {"jasnosc": "2.5/3", "uczciwosc": "1.5/2", "spojnosc_H2": "1.5/2", "logika": "1.5/2", "telefon_dostepnosc": "1/1"}, "twarde_bledy": [], "kryteria": {"K1".."K6": true}}`. Zrobione po ocenie: przypomnienie o anulowaniu subskrypcji w oknie zgód, „+2 dni” tylko dla kogoś, kto nigdy nie płacił (v54 B6b), spis lekcji jako lista. Reszta w pkt 5.

## 3. Zrzuty przed i po

`przed-po/` (390 i 1280 px, jasny i ciemny): ekran logowania, Dziś w próbie, Dziś po próbie, paywall lekcji. „Przed” = `origin/main` z 17.11.2026 (przed scaleniem pętli 1), „po” = ta gałąź.

## 4. Do wdrożenia przez Bartka, klik po kliku

Kod strony (HTML/JS/CSS) działa także **przed** wklejeniem SQL: brakujące funkcje są obsłużone (bez karty „+2 dni”, bez licznika, spis lekcji znika). Jedyna widoczna różnica przed SQL v53: przełącznik „Przypomnij mi mailem…” w powitaniu próby pokaże „Nie udało się zapisać”. Dlatego **SQL wklej przed albo zaraz po wdrożeniu strony.**

1. Supabase → SQL Editor → New query. Na github.com otwórz `supabase/skrot-v52-proba-rocznik.sql` → „Copy raw file” → wklej → **Run**. Ma być „Success. No rows returned”.
2. To samo dla `supabase/skrot-v53-proba-przypomnienie.sql` (po v52).
3. To samo dla `supabase/skrot-v54-odzyskiwanie.sql` (po v53).
   Każdy plik zaczyna się od strażnika kodowania (zły schowek → plik zatrzymuje się na pierwszej instrukcji, nic nie zmienia). Każdy można uruchomić ponownie.
4. Funkcja Edge **przypomnienia** (mail „jutro kończy się próba”): Supabase → Edge Functions → `przypomnienia` → wdróż nową wersję z katalogu `supabase/functions/przypomnienia/` (`index.ts`, `obsluga.ts`, `logika.js`; `logika.js` = kopia `przypomnienia.js`). Bez nowych sekretów. Do czasu wdrożenia mail „próba” po prostu nie wychodzi.
5. `stripe-webhook` – **bez zmian** w tej pętli.

Wynik `node scripts/funkcje-sql.mjs --nadpisane` (z kontroli automatycznej): v52 nadpisuje tylko `nauka_proba_start()` (właściciel: pętla 1, poprzednio v16); v53 i v54 tylko dodają nowe funkcje i kolumny.

## 5. Do decyzji Bartka

- **Automatyczne anulowanie subskrypcji po zakupie 199 zł** (przejście z planu miesięcznego): webhook nie ma klucza Stripe do wywołań API. Dziś arkusz i okno zgód mówią, żeby anulować w portalu. Pełne rozwiązanie: sekret `STRIPE_SECRET_KEY` w funkcji i anulowanie w `checkout.session.completed` (tryb `payment`) dla wiersza z `stripe_subscription`. Uwaga: dopóki subskrypcja trwa, `invoice.paid` może skrócić `do_kiedy` z 11 lipca do końca miesiąca (zachowanie sprzed pętli).
- **Adres pomocy w domenie** (`pomoc@zdawalni.pl`) – zostaje gmail (B1), wymaga skrzynki.
- **Płatny Resend i limity Supabase** (C1 pkt 1–2) – przed ogłoszeniem na grupie; potem można podnieść `limit_dzien` w `nauka_przypomnienia_cfg`.
- **Kupon retencyjny** – NIE (B1).
- **Etap 5** (lekcja dla gościa) – po scaleniu pętli 3 jako osobne zadanie (plan w PROGRESS).
- `nauka_ja().proba_mozna` zostaje `true` dla rocznika „oczekujacy” (funkcja niczyja); strona to uwzględnia, a v52 odrzuca start.
- `nauka_rocznik_licznik` (dla gościa) liczy osoby z punktów nauki z 7 dni przez `nauka_rocznik_uid` na wiersz – przy dużym ruchu warto dodać indeks `nauka_rp (dzien)` albo dzienne podsumowanie.
- Klucze `skrot-proba-do` i `bm-proba-koniec-pokazane` nie są przypięte do konta (wspólna przeglądarka dwóch osób) – w kodzie jako `shortcut:`.

## 6. Uwagi dla innych pętli

Pełna lista: `uwagi-dla-innych.md` (plakietki < 12 px na Dziś, przyciski „5 min / 15 min” 36 px, karta `.jz-card` z CLS 0,06, `.row.ld-done` bez tła karty, 4 stare asercje `scalanie.mjs` padające na `main`, „Kup dostęp” w nagłówku obok paywalla).

## 7. Ryzyka przy scalaniu z innymi pętlami

- `index.html`: linia 1 (blok `#login`: krytyczny CSS bramki widoczności i miejsca na Stasia, FAQ, licznik, ikona play, `lg-sub`), linia `<script src>` (`?v=` przy `skrot-supabase.js`, `przypomnienia.js`, `i18n.js`), most `// === most ux-1 ===`, `<link>` do `ux-wejscie.css` za głównym `</style>`, `<script src="ux-wejscie.js">` na końcu.
- `viewHome`: jedna linia `window.ZD_WEJSCIE?.pasekProby?.() ?? null, // ux-1 tymczasowo` – usuń przy scalaniu pętli 2, jeśli ta wstawia `pasekProby()` sama (A7).
- Trzy wyrażenia przycisku zakupu (`ldBlock`, `ptsHome`, `ptsDzis`) z komentarzem `// ux-1`; reguła szarego `.btn` na Dziś (`:not(.primary)` + akcent dla `.btn.primary`).
- `przypomnienia.js` (wspólny z pętlą 2): tylko blok `=== ux-1` (`mailProba`) i eksport; `supabase/functions/przypomnienia/obsluga.ts`: blok `=== ux-1` w `wyslij()` i funkcja `wyslijProby`. Po scaleniu: `cp przypomnienia.js supabase/functions/przypomnienia/logika.js`.
- `supabase/test/pglite.mjs`: v52–v54 dopisane za `test/v51.sql`.
- `docs/gry/test/atrapa-supabase.js`: blok `// === ux-1 ===` (RPC v53/v54) i `UX1_OTP` w `signInWithOtp`.
- Stare testy poprawione w osobnych commitach „test: …”: `h2-etap9` (logowanie ma ciemny wariant), `scalanie` (pasek próby, kropka, „Pełny dostęp/Próba minęła”), `wyglad-logowanie` (tag „Wkrótce” w linii podpisu).
