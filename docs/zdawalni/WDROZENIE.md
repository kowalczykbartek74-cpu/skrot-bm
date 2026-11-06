# Wdrożenie etapów 5–14 („Systemy z Zdawalni w Skrócie”), kolejność dla Bartka

Stan 6.11.2026. Na produkcji są etapy 1–4 (strona i SQL do v32, funkcja `usun-konto`). Etapy 5–14 są gotowe na gałęzi **`zdawalni/importy`** (zawiera wszystkie, scalona z `main` po przejściu na zdawalni.pl, `main` przewinie się bez konfliktów). Szczegóły każdego etapu: `docs/zdawalni/etap-N.md`.

## 1. Supabase → SQL Editor (po kolei, każdy plik w całości → Run)
Najpierw: **Integrations → Cron → Enable** i **Database → Extensions → `pg_net`** (dla v35, v36, v40).

| Plik | Etap | Uwagi |
|---|---|---|
| `skrot-v33-retencja.sql` | 4 | dopiero po akceptacji okresów (etap-4.md); można pominąć, reszta nie zależy |
| `skrot-v34-oczekujacy.sql` | 5 | lista oczekujących + kierunki z planów WEFiZ |
| `skrot-v35-lejek.sql` | 6 | lejek, cron 3:15 UTC |
| `skrot-v36-przypomnienia.sql` | 7 | najpierw Vault: `przypomnienia_cron` i `przypomnienia_url` (etap-7.md) |
| `skrot-v37-paczka.sql` | 10 | paczka i duet |
| `skrot-v38-admin.sql` | 11 | karnety, źródła wejść |
| `skrot-v39-zdjecie.sql` | 13 | limit sprawdzeń zdjęć |
| `skrot-v40-importy.sql` | 14 | kolejka importów, bucket `importy` |

Etapy 8, 9 i 12 nie mają SQL.

## 2. Supabase → Edge Functions → Secrets (wartości tylko tam, nigdzie indziej)
- `STRIPE_SECRET_KEY`: klucz ograniczony (Customers: Read, Subscriptions: Write), etap 4.
- `RESEND_API_KEY` i `RESEND_FROM` = `Zdawalni <zapisy@skrotbm.pl>`: etapy 5 i 7 (Resend Free: 100 maili/dzień wspólnie z logowaniem; przypomnienia mają limit 60/dzień).
- `ZAPISY_SALT`: losowy napis, etap 5.
- `PRZYPOMNIENIA_CRON`: `openssl rand -hex 32`, ten sam co w Vault, etap 7.

## 3. Funkcje do wdrożenia (mogę zrobić to ja przez `npx supabase`, jak `usun-konto`: napisz „wysyłaj funkcje”)
- `zapisz-sie --no-verify-jwt` (5), `przypomnienia --no-verify-jwt` (7), `sprawdz-zdjecie` (13), `importy` (14).
- Ponownie z nowymi adresami: `usun-konto`, `claude`, `grade-open`, `kalendarz` (wymagane po przejściu na zdawalni.pl, patrz `PRZELACZENIE.md`).
- Opcjonalnie `stripe-webhook --no-verify-jwt` (11: źródło wejścia przy zakupie).

## 4. Strona
- `skrot-bm`: `main` ← `zdawalni/importy` (fast-forward). Bez SQL z punktu 1 każdy nowy ekran mówi „jeszcze nie działa”, nic się nie psuje.
- `plan-bm`: `main` ← `zdawalni-zapisz-sie` (przycisk listy oczekujących) i `zdawalni-importy` (odczyt zatwierdzonego planu).

## 5. Sprawdzenie na swoim koncie (opisane w etapach)
- 4: usunięcie konta testowego → `select public.nauka_konto_slady(...)` = `{}`.
- 5: zapis drugim adresem → mail → „Potwierdź” → Narzędzia starosty → Kierunki.
- 7: data zaliczenia za 3 dni + najbliższa pełna godzina → jeden mail, drugi nie wychodzi, wypisanie jednym kliknięciem.
- 12: eksport lekcji (`docs/lekcje-v4/eksport.js`) → `node scripts/tresci-kontrola.mjs ~/Downloads/lekcje-eksport.json`.
- 14: pilot: Importy → PDF sylabusa BM → przegląd → „Porównaj z obecnym sylabusem” (koszt ok. 2–3,5 $).

## 6. Decyzje, które czekają na Ciebie
- **D3 z księgową:** czy przy usuwaniu konta zostawić `nauka_zgody` (dowód zgody, art. 38) i zapisy poleceń (etap-4.md).
- **Okresy przechowywania** (v33, etap-4.md).
- **Polityka prywatności i regulamin:** gotowe zdania w etap-4 (usuwanie, okresy), 5 (lista oczekujących), 6 (statystyki bez cookies), 7 (przypomnienia), 13 (zdjęcia do AI), 14 (dokumenty uczelni do AI). Wgram wszystkie naraz po akceptacji, z nową datą „obowiązuje od”.
- **Lista zakazanych sformułowań** w treściach (`scripts/tresci-zakazane.json`, etap 12).
- **Kolor motywu „Jednorożec”:** biały tekst na `#E0438F` ma kontrast poniżej AA; propozycja `#C92F7B` (etap 12).
- **Push** (etap 7b): zgodnie z D5 dopiero po 2 tygodniach działania maili.
- Drobne: w kodzie z `main` zostały teksty „Przewodnik po Skrócie BM” i „…dzień w Skrócie BM?” (PL), a w plan-bm etykieta „Skrót BM ↗” przy linku na zdawalni.pl.

## Testy na `zdawalni/importy` (6.11)
`node --test`: 188/188 · PGlite v13–v40 zielone (poza oczekiwanym v12 `limit_wpisow`) · Playwright etapów zielone · pełny zestaw: tylko stare błędy `etap7` (3) i `scalanie` (2), oba padały już na `main`.
