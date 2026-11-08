# System dodawania kierunków: 10 optymalizacji (8.11.2026)

Gałąź `kierunki/system` w **skrot-bm** (6 commitów) i w **plan-bm** (1 commit), od `main` z 8.11. Nic nie jest scalone ani uruchomione na produkcji.
Koszt API: 0 zł (nic nie poszło do modelu).

## Przebieg nowego kierunku po zmianach

| Krok | Polecenie | Kto | Koszt |
|---|---|---|---|
| 1. Plany całego wydziału (raz w semestrze) | plan-bm: `node scripts/wefiz-wszystkie.mjs --na-sucho`, potem bez `--na-sucho` | Claude Code u Ciebie (potrzebna sieć) | 0 |
| 2. Sylabusy i macierz (raz w semestrze) | `python3 scripts/sylabusy-hurt.py`, `python3 scripts/macierz-przedmiotow.py [--oczekujacy lista.json]` | Claude Code | 0 |
| 3. Kierunek A–C | `node scripts/kierunek-start.mjs --nowy wefiz-<kod>-1-st-2026` → `scratch/<prefiks>/raport.html` | Claude Code | 0 |
| 4. Przegląd | raport + mapa z filtrem „tylko do przejrzenia” → „ok” / „wysyłaj” | **Ty** | — |
| 5. Treści | mapa z modelu, potem `lekcje-z-bm.py k2 --wszystkie` (pilot tylko bez wzorca), w kolejności z `harmonogram-tresci.mjs`, próbka `kierunek-start.mjs --probka` | Claude Code | API |
| 6. Na stronę | Panel kierunków → Baza → „Dodaj do bazy”; Panel AI → Paczka lekcji (wiele plików); „Zacznij sprzedaż” | **Ty** | — |

Twoich kroków na kierunek: 3 (przegląd, „wysyłaj”, kliknięcia w panelu), wcześniej ok. 8. Bez migracji SQL na kierunek.

## 10 punktów: co zrobione

1. **Rocznik jako dane.** `roczniki-dane.js` (Zarządzanie i FiR przeniesione z `rocznik.js`, ROCZNIKI identyczne). SQL **v49** raz na zawsze: `nauka_admin_rocznik_zapisz` (status tylko w górę), `nauka_admin_rocznik_status`. Panel kierunków → sekcja **Baza**: „Dodaj do bazy”, „Dodaj wszystkie”, „Zacznij sprzedaż” z potwierdzeniem. `kierunek.mjs` pisze do danych; stara migracja tylko z `--sql`.
2. **Plany całego WEFiZ.** plan-bm `scripts/wefiz-wszystkie.mjs`: kierunki z formularza uczelni, grupy z planu kierunku (a bez nich: lista grup + rok po wspólnych przedmiotach), każda sprawdzona; zapisuje brakujące `kierunki/<id>.json` (plików ze Skrótu nie rusza). Strona planu: I i II stopień jako osobne pozycje. Codzienny automat nie pobiera grup innych roczników, gdy uczelnia nic nie zmieniła; ≥ 1 s między zapytaniami.
3. **Macierz przedmiotów.** `sylabusy-hurt.py` (PDF-y z listy wydziału albo ze wzoru adresu, ten sam parser) i `macierz-przedmiotow.py` → `scratch/macierz/bank-plan.md`: przedmiot ogólny × kierunki × egzaminy × lista oczekujących. Dziś (BM, Zarządzanie, FiR): 1. Podstawy zarządzania i Podstawy finansów (oba kierunki, egzamin), 3. Matematyka.
4. **Plik kierunku automatycznie.** `kierunek-nowy.mjs` z konfiguracji planu + planu + danych wspólnych (`kierunki/wspolne/`). Test: z danych plan-bm odtwarza Zarządzanie i FiR (id, grupy, DOS, adresy sylabusa, przedmioty) jak pliki pisane ręcznie.
5. **A–C jednym poleceniem.** `kierunek-start.mjs`: jeden raport z samymi wątpliwościami i 3 krokami. Mapa ma pole `pewny` i filtr „tylko do przejrzenia”.
6. **Pilot tylko raz.** `kierunki/wspolne/wzorce.json` (dziś puste: Zarządzanie robi pilot). Po akcepcie: `kierunek-start.mjs --wzorzec k2 wefiz-zarz-1-st-2026 <id lekcji>`; kolejne kierunki: `k2 --wszystkie` + `--probka`.
7. **Rytm kolokwiów.** `harmonogram-tresci.mjs`: termin z bazy (Panel kierunków → „Pobierz terminy do harmonogramu”) albo sesja / koniec zajęć, „generuj do” = termin − 21 dni, polecenie na ten tydzień.
8. **Paczki hurtem.** Panel AI → Paczka lekcji: kilka plików naraz, jeden zapis, zły plik zatrzymuje całość z nazwą.
9. **Bank odświeża kopie.** `tresci-bank.py dodaj | kopiuj | synchronizuj | pochodne` + odciski `zrodloHash`/`kopiaHash` (K1, paczka, eksport). Poprawka w banku → nowa kopia w każdym roczniku, który jej nie zmieniał; zmienione obie → lista do ręcznego scalenia.
10. **Jeden test dla wszystkich.** `tests/roczniki-wszystkie.test.js`, PGlite (każdy rocznik przez v49), `docs/gry/test/wszystkie-roczniki.mjs`.

## Jak sprawdzone

- `node --test tests/*.test.js`: 337 OK, 1 pominięty (jak dotąd). plan-bm: `node --test scripts/*.test.mjs` 20/20.
- PGlite: wszystkie migracje 2×, v49 R1–R8, roczniki ze strony przez v49 (próba z zepsutym kodem kierunku: zatrzymana).
- Playwright (`wszystkie-roczniki.mjs`): Zarządzanie i FiR ekrany 24/24 i paczka 22/22, Baza 16/16, **BM: 24 ekrany przed = po**.
  Regresje: panel-kierunkow 26/26, kierunek, zapisy 29/29, fundament 2/3/4/6, admin 80/80, rocznik testowy 20/20.
- Strona planu (plan-bm) z dodanym II stopniem: wybór PL/EN, 375 px, bez błędów.
- `kierunek-start.mjs --nowy` na sztucznej Logistyce: plik kierunku, dane, raport; sylabus z `scratch/sylabusy` → mapa tymczasowa i koszt.

## Czego nie dało się sprawdzić tutaj

- **Strony uczelni** (planyzajec-efz, efz.usz.edu.pl): ta sesja nie ma do nich dostępu. `wefiz-wszystkie.mjs` i `sylabusy-hurt.py` są przetestowane na atrapach;
  pierwszy prawdziwy przebieg: `--na-sucho` i przejrzenie `docs/wefiz-wszystkie.md` (szczególnie wiersze „rok dopasowany po przedmiotach”).
- Adresy sylabusów ze wzoru (`"zgadniety": true`) zgadzają się dla Zarządzania i FiR; dla „inż.” i II stopnia to przypuszczenie.

## Co kliknąć (kolejność)

1. **Supabase → SQL Editor:** `supabase/skrot-v49-roczniki-dane.sql` z github.com („Copy raw file”, gałąź `kierunki/system`) → Run. Na dole lista roczników.
2. **Scal `kierunki/system` do `main`** w skrot-bm i w plan-bm (albo powiedz Claude Code „scal”). Strona: tylko nowa sekcja w Panelu kierunków i wiele plików w Paczce lekcji; BM bez zmian.
3. Panel kierunków → Baza: „Wszystkie roczniki ze strony są w bazie” (Zarządzanie i FiR mają już v47/v48).

## Do Twojej decyzji

1. **Plany: tylko 1. rok czy wszystkie lata?** (domyślnie wszystkie lata z planów; `--lata 1` = sam 1. rok).
2. **Zapas w harmonogramie: 21 dni** przed kolokwium (`--zapas`).
3. **Aliasy przedmiotów ogólnych** (`kierunki/wspolne/przedmioty-ogolne.json`) są startowe; macierz wypisze „bez przypisania” do uzupełnienia.
