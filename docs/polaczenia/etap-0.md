# Połączenia funkcji, etap 0: rozpoznanie (4.11.2026)

Stan kodu: `origin/main` af2fbc1 (skrot-bm) i `origin/main` 8954118 (plan-bm).

## 1. Ogłoszenia z Teams w „Ostatnio dodane” (`feedItems()`)

- `feedItems()` (index.html) bierze pozycje `kind: "t"` z `myTasks()`, czyli z `S.tasks` przefiltrowanych po grupie (`forMyGroup`).
- `S.tasks` = kolekcja **`tasks`** w tabeli `nauka_docs` (Supabase), czytana na żywo:
  `db.collection("tasks").orderBy("createdAt","desc").limit(300).onSnapshot(...)`.
  Pola: `title, kind` (`info` = ogłoszenie, `projekt`, `test`, `zadanie`, `prezentacja`, `formalnosci`), `subjectId, groups[], due, dueTime, dueText, summary, details[], source {team, author, postedAt}, createdAt`.
- Czas ostatniej synchronizacji: dokument `meta/sync` (`lastRun`), stopka Terminów (`syncLine`).
- **Kto wpisuje:** w repozytoriach nie ma skryptu, który pobiera Teams. Strona tylko czyta `tasks`.
  Zapis hurtowy jest możliwy wyłącznie kontem starosty (`skrot.putMany`, kolekcja `tasks` na liście `KNOWN`).
  W notatkach projektu (CLAUDE.md) jest uwaga, że automatyczna synchronizacja z Teams nie działa przez blokadę logowania M365.
  **Do potwierdzenia przez Ciebie:** skąd teraz przychodzą ogłoszenia (np. ręczny import z czatu). Etap 1 nie zależy od tego, bo czyta gotowe `tasks`.
- Zadania z datą mają kopię w `deadlines/task-<id>` (stąd trafiają do linku .ics).

## 2. `plan-bm/scripts/dziekanat.mjs` i `PLAN.dziekanat`

- Uruchamia go GitHub Actions (`aktualizacja-planu.yml`): rano z planem, potem co godzinę 8:20–19:20. Drugi przebieg dla Prawa (`--rocznik wpia-prawo-0-st-2026`).
- Czyta listę wpisów https://dos.usz.edu.pl/cukrowa/zajecia-cukrowa/ (do 8 stron), bierze wpisy dla C111–C113 (`groupsOf(title)`), pobiera treść, `readNotice()` wyciąga zdarzenia, `resolve()` przypina je do zajęć z planu.
- Zapis: `plan.json` → pole `dziekanat` (i kopia w `index.html` plan-bm, znaczniki `/*PLAN_DATA_*/`).
  ```
  dziekanat = { source, updatedAt,
    posts: [{ url, title, ym, pub, text }],
    zmiany: { C111: [...], C112: [...], C113: [...] } }
  ```
  Wpis w `zmiany[grupa]`:
  - `{ type:"cancel", date, start, pl, g?, sg?, guess?, moved?, post, posts[] }`
  - `{ type:"extra", kind:"makeup"|"change", date, start, end, pl, en?, k, p?, r?, g?, post, dup? }`
  - `{ type:"note", date, post }`
  `post` to indeks w `posts`.
- Skrót czyta to przez `fetch("https://plan.skrotbm.pl/plan.json")` → `Object.assign(PLAN, d)` (kopia zapasowa `const PLAN = {...}` w index.html). `classesDz()` nakłada `cancel` (`e.off`) i `extra` (`e.add`) na surowy `classesOn()`; `dzInfo()` robi plakietkę.

## 3. XP, monety, ranking, Zadania dnia

| Co | Kto liczy | Gdzie |
|---|---|---|
| XP, poziom, seria, cel dnia | **przeglądarka** | `lpAward()` w odtwarzaczu, `xpFlush()` = jedyny zapis `progress.xp` / `progress.streak` (dokument `progress/<uid>`), limity dzienne w localStorage `bm-xpcap:<dzień>` (`XP_CAP = {srs:40, words:20, games:30}`), `xpOnceMark` |
| Punkty rankingu 🏆 | **baza** | `rpSend(fn, …)` → `skrot.rp.*` → RPC `nauka_rp_odpowiedz` (`odp`: pytanie ABCD, sprawdza baza, +10), `nauka_rp_zadanie` (`zadanie`: wynik liczbowy, +20), `nauka_rp_powtorka` (`powtorka`: +1, max 20/dzień), `nauka_rp_lekcja` (`lekcja`: +30 raz na zawsze). Wszystko przez `nauka_rp_dodaj` z limitem puli (`nauka_rp_cfg`: gry 150, quiz 300, powtórki 20, lekcje 150 pkt/dzień) i kluczem „raz dziennie” (`q:<mid>:<idx>`). Gry/Hasło/Boss: v15. |
| Ranking | **baza** | `nauka_ranking` (v13), widoczność od 5 osób |
| Monety 🪙 | **baza** | v14: trigger `nauka_mon_z_rp` na `nauka_rp`, 10 pkt dnia = 1 moneta → limity puli dają max 64 🪙/dzień |
| Zadania dnia/tygodnia | **baza** | v14: `nauka_misje_pula()` (katalog), `nauka_misje_na(d)` (3 dzienne + 1 tygodniowa, **takie same dla wszystkich**), `nauka_misja_postep` liczy wiersze `nauka_rp` po źródle i prefiksie klucza, `nauka_misja_odbierz` |

Źródła bez punktów rankingu dziś: „Po zajęciach w 5 min” (tylko `bm-po-seen` w localStorage), Staś (wynik w `bm-stas-done`, bez `rpSend`).

## 4. Funkcja Supabase `kalendarz` (link .ics)

`supabase/functions/kalendarz/index.ts` + `nauka_kalendarz_dane(token)` (skrot-kalendarz.sql). Zwraca:
- zajęcia grupy z **surowego** planu (`plan.json` → `groups`, `kalendarz`), dni wolne i okresy;
- wszystkie `deadlines` pasujące do grupy/labu (kolokwia, zadania z Teams z datą), z przypomnieniem; data szacowana z „~”.

Nie zawiera: odwołań i odrabiania z `dziekanat` (brak „ODWOŁANE:”), własnych wpisów („Mój wpis”), własnych dat zaliczeń, dni planu nauki.
`nauka_kalendarz_dane` oddaje tylko `grupa`, `podgrupa` i `deadlines`, więc etap 3 wymaga zmiany SQL (dodać `progress` osoby) i ponownego wdrożenia funkcji.

## 5. Literówka „Strucured Query Language”

`sylabus.json` → Narzędzia IT w zarządzaniu → `topics.LAB` (temat 4 labów). Plik powstaje z PDF-u programu (`scripts/sylabus-*.py`), więc literówka jest w źródle uczelni. Ekran Dziś bierze ją z `topicAt()` („prawdopodobny temat”).

## Nazwy inne niż w specyfikacji

- `examSet` to stała-funkcja `examSet(sid, part)` (czyta `progress.exams[exKey]`), a nie `function`.
- `viewExam` to widok `#/exam/<sid>`; `examPlan(s, part, parts)` i `dayPlan(sid, part, dateKey)` są osobno.
- Zadania dnia w kodzie: `nauka_misje*` (SQL v14), w stronie `SHOP.misje`, `skrot.misje()`.
- `gryWrong` to obiekt z localStorage `bm-gry-zle`, nie funkcja.
- `poSeen` i `stasDone`: obiekty z localStorage (`bm-po-seen`, `bm-stas-done`).
- Numer SQL v23 jest zajęty (rocznik Prawa na gałęzi `kierunek-prawo`), ostatni na main to v25 → kolejne migracje od v26.
