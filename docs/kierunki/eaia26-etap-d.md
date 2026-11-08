# EaIA (wefiz-eaia-1-st-2026), Etap D: raport

8.11.2026. Gałąź `kierunek-eaia/abc`.

## Mapa tematów z modelu (Haiku 5.5, Batch): 0,0032 $

K1 50 · K2 0 · K3 73 (123 tematy). Mapa: `scratch/eaia26/mapa.html`.

| Przedmiot | K1 | K3 | Uwagi |
|---|---|---|---|
| Analiza matematyczna | 16 | 0 | |
| Makroekonomia | 7 | 4 | egzamin |
| Ochrona własności intelektualnej | 4 | 3 | |
| Prawo | 11 | 0 | |
| Statystyka opisowa | 12 | 0 | egzamin; **BM nie ma jeszcze lekcji** (eksport 8.11: 0) → nic do kopiowania, temat z sylabusa BM |
| Technologie informacyjne | 0 | 12 | model nie uznał „IT tools in management” (BM) za ten sam zakres |
| Finanse | 0 | 13 | egzamin, bez BM → pilot K3 |
| Informatyka w ekonomii, Systemy pozyskiwania danych, Zarządzanie organizacją, Zarządzanie pracą zespołową | 0 | 41 | bez BM |

## K1: kopia lekcji BM, 0 zł

`lekcje-z-bm.py … k1`: 41 lekcji (eksport lekcji i dodatków BM z 8.11, z worktree FiR).
Paczka **`scratch/eaia26/paczka-k1-39.json`** (= `~/Downloads/paczka-eaia-k1-39.json`, 2,7 MB): 39 lekcji (Analiza 16, Makro 8, OWI 4, Prawo 11), Prościej 55, Dlaczego? 39; kontrola przed wgraniem: 0 błędów, 260 rachunków OK, 580 wartości zgodnych z BM (`przeglad-ze-zrodlem.py`).

Poza paczką (błąd w źródle BM, ten sam co w FiR; `scratch/eaia26/zablokowane/`):
- `eaia26-mk-07-money`: „3.67 × 300 = 1,100” (wychodzi 1101; w BM powinno być „≈”);
- `eaia26-pr-01-law-basics`: „wstyd” w Prościej · PL.

Poprawka kontroli: lekcje BM mieszają przecinek tysięcy z dziesiętnym („0,2 × 3,000 = 600”) – 8 fałszywych błędów; `tresci.js` liczy taki rachunek drugi raz.

## Pilot K3 (1 lekcja): wysłany, Sonnet 5.5, 0,066 $

Finanse 1 „The field and functions of finance…”: kontrola bez AI OK, kontrola Haiku OK (ocena 4; jedyna uwaga „lekcja po angielsku” = fałszywy alarm).
Paczka `scratch/eaia26/paczka-pilot.json` (= `~/Downloads/paczka-eaia-pilot-k3.json`, 27 KB: 4 sekcje, quiz 8, fiszki 10, Prościej PL).
21 wartości (same liczby z przykładów, rachunki się zgadzają) oznaczone przez Claude jako przejrzane (kopia: `scratch/tresci-przeglad.przed-pilot-eaia.json`).

**Próba 1 (odłożona, `.tresci/…/finanse/proba-1/`):** pojęcia po polsku i w złych polach; generator poprawiony.
**Próba 2 = pilot:** pojęcia jak w BM (term EN, pl, definicja EN), kontrola bez AI OK, Haiku ocena 4 (uwaga o „dlaczego” po polsku = fałszywy alarm, prompt kontroli poprawiony).
Paczka `scratch/eaia26/paczka-pilot.json` (= `~/Downloads/paczka-eaia-pilot-k3.json`, 25 KB), kontrola przed wgraniem 0 błędów, 11 rachunków OK; 13 nowych wartości (przykłady) oznaczone przez Claude.
**Koszt pilota razem (2 próby): 0,131 $.** Szacunek całych Finansów (7 lekcji): ~0,46 $.
Do obejrzenia: lekcja jest w formacie generatora (mniejsza niż lekcje BM v4), kwoty w „zł”/„mld zł” i z przecinkiem dziesiętnym w tekście angielskim.

## Dalej

1. Przegląd pilota na telefonie (po wgraniu) → akcept: `node scripts/kierunek-start.mjs --wzorzec k3 wefiz-eaia-1-st-2026 eaia26-finanse-01`, potem Etap E.
2. Wgranie paczki K1 (Bartek): dopiero po wdrożeniu strony i „Dodaj do bazy” (Etap F).
3. mk-07 / pr-01: poprawić w BM (wtedy w obu) albo zostawić poza EaIA.
