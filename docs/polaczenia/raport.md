# Połączenia funkcji: raport końcowy (4.11.2026)

Gałąź `polaczenia/etapy` w skrot-bm (wypchnięta, **nie** na main) i `polaczenia/odwolania-teams` w plan-bm (tylko lokalnie, worktree ~/plan-bm-polaczenia).
Testy: `docs/gry/test/polaczenia-1…7.mjs` (atrapa, Playwright) i `supabase/test/v26.sql`, `v27.sql`, `v28.sql` (PGlite, wszystkie migracje po kolei, każda 2×).

## Etap 0: rozpoznanie
- Notatka: `docs/polaczenia/etap-0.md`.
- Ogłoszenia z Teams = kolekcja `tasks` (+ `meta/sync`). W repozytoriach nie ma skryptu, który je pobiera: **do wyjaśnienia, skąd przychodzą**.

## Etap 1: odwołania z Teams (8c8f409, plan-bm eb51f90)
- **Zmiany:** `index.html` (propozycja z ogłoszenia, Narzędzia starosty → Odwołania z Teams, pasek w „Ostatnio dodane”, `meta/odwolania` → `dzList`/`classesDz`, `meetingsOf`/`topicAt` po odwołaniach, link do ogłoszenia).
  Do tego `supabase/skrot-v26-odwolania.sql`, `functions/kalendarz` (ODWOŁANE / odrabianie), plan-bm: `scripts/dziekanat.mjs`, `scripts/ics.mjs`, `index.html`, `README.md`.
- **Sprawdzenie:** `polaczenia-1.mjs` 22/22. Dla C112:
  - Logistyka 3 i 4.11 znika z Dziś i z Po zajęciach;
  - Kalendarz 4.11 pokazuje ją przekreśloną, z „Odwołane” i linkiem;
  - 18.11 to „Zajęcia 3 z 7” z tematem, który miał być 4.11.
  
  Plan.skrotbm.pl sprawdzony offline z `--teams-file`.

## Etap 2: wspólny priorytet (203656e)
- **Zmiany:** `topicPriority`, `srsDue`, podpowiedź w Powtórkach, `stasHomeCard` z „Inny temat ↻”, `poSuggest`, `gryQuestions`.
- **Sprawdzenie:** `polaczenia-2.mjs` 8/8 (pierwsza karta i Staś z OWI). Gry: etap1 70/70.

## Etap 3: plan i daty zaliczeń wszędzie (7ad5e26)
- **Zmiany:**
  - „Dziś według planu…” i fiszki jako druga karta;
  - „Plan nauki” w Kalendarzu;
  - „Twoja data” w Terminach i Kalendarzu;
  - „Mój wpis” typu „Zaliczenie / kolokwium” zapisuje datę przez `saveExamSet`;
  - `skrot-v27-kalendarz-moje.sql` i funkcja `kalendarz` z wpisami ✏️ / 📅 / 📘.
- **Sprawdzenie:** `polaczenia-3.mjs` 16/16, Przygotuj się 54/54.

## Etap 4: wspólne zdarzenie nauki (6e31bf7, plan migracji bf50396)
- **Zmiany:**
  - `learnEvent` (quiz, lekcja, fiszki, gry, Po zajęciach, Staś);
  - Po zajęciach: XP, monety (`nauka_rp_po`), pomylone pytania, pojęcia do fiszek, link do lekcji;
  - Staś: monety (`nauka_rp_stas`), wynik do tematu, link do lekcji;
  - `lvHowShow` z nowymi źródłami;
  - `skrot-supabase.js` i `skrot-v28-zdarzenia-nauki.sql`.
- **Sprawdzenie:** `polaczenia-4.mjs` 16/16: XP rośnie, monety są, błędne pytanie wraca w grze następnego dnia, pojęcia są w powtórkach, link prowadzi do lekcji. `v28.sql` 9/9.

## Etap 5: osobiste zadanie dnia (ee7048b)
- **Zmiany:** „Twoje zadanie dnia” w Zadaniach dnia (krok planu → sprint → 5-minutówka → Staś). Wspólne zadania bez zmian.
- **Sprawdzenie:** `polaczenia-5.mjs` 11/11 (także bez v28: strona działa po staremu).

## Etap 6: jeden licznik (9b9ad4c)
- **Zmiany:** `topicsOf`. Dziś, Przedmioty, strona przedmiotu i mapa pokazują ten sam licznik. Dodatki są osobno. Usunięte teksty o różnicy liczników.
- **Sprawdzenie:** `polaczenia-6.mjs` 7/7.

## Etap 7: projekty w Terminach (ad9aab6)
- **Zmiany:** strzałka przy projekcie, `#/projekt/<klucz>`: co oddać i %, etapy wstecz od terminu, lista kontrolna, etapy do kalendarza.
- **Sprawdzenie:** `polaczenia-7.mjs` 10/10 (projekt IT 40%).

## Drobne (26775f5)
- „Structured Query Language” w `sylabus.json` i poprawka w `scripts/sylabus-build.py`.

## Wdrożenie (4.11.2026 wieczorem)
- SQL v26–v28 uruchomione na produkcji, funkcja `kalendarz` wdrożona ponownie.
- skrot-bm main ecb4068 (z poprawką: ogłoszenia o odrabianiu nie dają automatycznej propozycji), plan-bm main eb51f90.

## Do zrobienia / Twoja decyzja
1. Zatwierdzić w Narzędziach starosty → Odwołania z Teams „Odwołane wykłady z Logistyki 3 i 4.11”.
4. Skąd teraz przychodzą ogłoszenia z Teams (`tasks`).
5. OWI w zasadach zaliczeń to „zaliczenie wykładu”, więc teksty mówią „OWI: zaliczenie wykładu za N dni”.
6. **Testy, które nie przechodziły już na main przed tymi zmianami:**
   - `po-zajeciach` #17 i #19;
   - `etap7`: motyw różowy i EN „próba”;
   - `etap5` (#loginDemo).
