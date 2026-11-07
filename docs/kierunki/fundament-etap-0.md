# Fundament pod inne kierunki – Etap 0 (rozpoznanie)

Stan: `main` 9bfe1ad, migracje do v43, 7.11.2026. Bez zmian w kodzie.

## 1. Zapytania dla Bartka (tylko odczyt)

Wyniki wpisuje Bartek. Zapytania sprawdzone z kolumnami w v31 (`nauka_wydzialy.nazwa_pl`, `nauka_kierunki.nazwa_pl`).

```sql
select email from public.nauka_admini;

select 'funkcja: ' || proname from pg_proc
 where pronamespace = 'public'::regnamespace and prosrc ~ '(Ň|√|ńÖ|Ňā|ńô|Ňõ)'
union all select 'wydzial: ' || kod from public.nauka_wydzialy where nazwa_pl ~ '(Ň|√|ńÖ)'
union all select 'kierunek: ' || id from public.nauka_kierunki where nazwa_pl ~ '(Ň|√|ńÖ)';

select kolekcja, count(*) from public.nauka_docs group by 1 order by 1;
```

## 2. Najważniejsze ustalenie: klucz `nauka_docs` to `(kolekcja, id)`

`nauka.sql:21` – klucz główny bez rocznika. Dwa roczniki **nie mogą** mieć dokumentu o tym samym id w tej samej kolekcji: upsert (`onConflict: "kolekcja,id"`) drugiego rocznika nadpisze pierwszy. Dlatego każde id stałe albo zbudowane z przedmiotu musi być inne w każdym roczniku. Id losowe (`crypto.randomUUID()` w `makeDb`) są bezpieczne.

## 3. Stałe i zbudowane id dokumentów

| Dokument | Gdzie (strona) | Gdzie (baza) | Per rocznik? |
|---|---|---|---|
| `meta/en` (słownik EN) | index.html 15733, 15753, 21051 | – | **wspólny** |
| `meta/sync` (stan synchronizacji z Teams) | 21048 | – | BM (Teams) |
| `meta/odwolania` (odwołania z Teams) | 5496, 5499, 21049 | v26 `nauka_odwolania_publiczne` (publicznie, strona planu BM) | BM (Teams) |
| `meta/po` (spis „Po zajęciach”) | 12259, 12547–12568 | v28 `nauka_rp_po` (`id = 'po'`, l. 29) | tak |
| `meta/po~<sid>~<k>~<hash>` | 12458, 12546, 17968 (`poSylId` 12232) | v28 l. 27 (`v_mid`) | tak |
| `meta/stas` | 12656, 12880–12882 | v28 `nauka_rp_stas` (`id = 'stas'`, l. 62) | tak |
| `meta/stas~<sid>~<k>~<hash>` | 12773, 12879, 17969 | v28 l. 60 | tak |
| `examBank/<sid>` | 17970, 19703, 20597, 20647, 20761, 20825, 20935 | – | tak |
| `exams/<sid>-<część>` (`exKey` 17309) | 19675, 20879, 20888 | – | tak |
| `glossary/<sid>` | 19198–19199 | – | tak |
| `materialSimple/<id>~ez` | 15623, 16072, 16088, 7660, 8177 | – | tak (id materiału) |
| `materialSimple/owi-01-principles` (lekcja dla gościa) | `skrotPokaz` | v19 polityka „nauka pokaz” | BM; osobna polityka, nie zależy od reguły rocznika |
| `deadlines/task-<id>` (zadanie z Teams) | 5814, 5955 | – | BM (Teams) |
| `progress/<uid>` | `data/users/<uid>` | wiele (v13, v24, v27, v31…) | osobisty |

**Rozbieżność ze specem:** w kodzie nie ma id `materials/syl-…`. Materiały strony mają id losowe (UUID), a materiały BM z importu mają czytelne id (np. `owi-01-principles`) nadane poza stroną. Prefiks rocznika jest więc potrzebny tylko dla generatora z `nowy-kierunek-spec.md` i importów z czytelnym id.

### Propozycja nazw

BM bez zmian. Inne roczniki: `<id>@<rocznik_id>`, np. `po@wefiz-test-1-st-2026`, `examBank/makro@…`.

**Propozycja wykonania (do decyzji):** zamiast podmieniać ~40 miejsc w `index.html`, sufiks dokleja i odcina `makeDb` w `skrot-supabase.js` (`ref`, `fetchCol`, `putMany`, `ids`) dla kolekcji per rocznik, gdy `ROK.id` ≠ BM. Strona dalej pisze `S.db.doc("meta/po")`, a w bazie ląduje `po@<rocznik>`. W SQL jedna funkcja `nauka_docs_id(text)` (BM → bez zmian, inni → z sufiksem) dla v28. Uwaga: limit id to 120 znaków (`nauka.sql:16`), sufiks zabiera ~22; v44 sprawdzi to testem.

## 4. Kolekcje

Podział ze specu potwierdzony, z wyjątkami:

- **per rocznik:** `materials`, `materialContent`, `materialSimple`, `quizWhy`, `materialSources`, `tasks`, `deadlines`, `announcements`, `exams`, `examBank`, `glossary`, `meta`.
- **wspólne (`rocznik_id is null`):** tylko `meta/en`.
- **osobiste:** `progress`, `myMaterials`, `myContent`, `reports` (zgłoszenia czyta tylko admin).

Rzeczy, które trzeba wiedzieć do v44:

1. `materials` czyta dziś **każdy, także gość** (`skrot-v4-moje.sql:23`) – lista bez treści. Po v44 gość widzi listę BM (`nauka_moj_rocznik()` dla gościa = BM).
2. **Studenci sami dodają `deadlines`** (polityka „nauka dodaj”, `nauka_platny()`) i zmieniają swoje. Trigger musi im **wymuszać** `rocznik_id := nauka_moj_rocznik()`, inaczej student mógłby wpisać termin innemu rocznikowi.
3. **Kolejność wdrożenia:** po Run v44, a przed wdrożeniem strony (i w starych kartach PWA) strona zapisuje bez `rocznik_id`. Jeśli brak rocznika daje błąd `brak_rocznika`, przez ten czas nie da się dodać terminu w BM. Propozycja: brak → rocznik z profilu (BM); błąd tylko wtedy, gdy podany rocznik nie istnieje albo jest inny niż w wierszu (UPDATE).
4. Reguła odczytu ma dziś 7 wersji (nauka.sql → v4); ostatnia pełna jest w `skrot-v4-moje.sql:22`, v19 dokłada osobną politykę gościa. v44 nadpisze tę z v4 w całości.
5. Trigger `nauka_przed_zapisem` – ostatnia wersja w `skrot-v4-moje.sql:72`. v32 wyłącza go na czas usuwania konta, co dalej będzie działać.

## 5. Funkcje serwerowe czytające wspólne treści

| Funkcja (ostatnia wersja) | Co czyta | Zmiana w v44 |
|---|---|---|
| `nauka_kalendarz_dane` (v27) | wszystkie `deadlines` | filtr po roczniku osoby |
| `nauka_przypomnienia_kandydaci` (v36:177) | `deadlines` o id z `stan.ter` osoby | już zawężone do terminów osoby; filtr dla pewności |
| Boss: `nauka_boss_odswiez` (v15:425–440) → tabela `nauka_boss` | wszystkie kolokwia/egzaminy | boss musi znać rocznik: kolumna `nauka_boss.rocznik_id` albo filtr przez `deadlines` przy odczycie |
| `nauka_rp_po`, `nauka_rp_stas` (v28) | `meta/po`, `meta/stas`, `meta/po~…` | id rocznika osoby |
| v13/v15 punkty za quiz (`materialContent` po `p_mid`) | materiał po id | id losowe, osoba nie widzi cudzych; opcjonalnie sprawdzić rocznik |
| `nauka_odwolania_publiczne` (v26) | `meta/odwolania` | bez zmian (BM, strona planu) |

## 6. `nauka_dostep` – kto czyta i zapisuje

Klucz dziś: `email` (`nauka.sql:31`). Ostatnie wersje funkcji:

| Funkcja / miejsce | Plik | Ocena przy kluczu (e-mail, rocznik) |
|---|---|---|
| `nauka_platny_konto()` | v16:35 | **zmiana**: dostęp do `nauka_moj_rocznik()`; okres próbny bez zmian |
| `nauka_platny()` | v8:106 | bez zmian (woła `nauka_platny_konto`) |
| `nauka_ja()` (`dostep_do`, `plan`, próba) | v16:46–63 | **zmiana**: `max(do_kiedy)` i `plan` (dziś najnowszy wiersz, `limit 1`) tylko dla mojego rocznika, inaczej zakup BM pokaże dostęp w innym roczniku |
| `nauka_proba_start()` | v16:79–84 | bez zmian (każdy wiersz = „już płacił”, próba raz na osobę) |
| `nauka_kalendarz_dane` | v27:20 | **zmiana**: dostęp do rocznika z profilu |
| `nauka_polec_mozna()`, `nauka_polec_mozna_uid()` | v17:73, 82 | bez zmian (dowolny zakup = może polecać, między rocznikami) |
| `nauka_admin_aktywnosc()` | v11:132 | bez zmian (`exists` po e-mailu) |
| `nauka_rocznik_moj()` (`wybrany`) | v31:133 | bez zmian (każdy dostęp blokuje wybór) |
| `nauka_lejek_konta()`, `nauka_lejek_zrodla_dane()` | v38:154, 171–173 | bez błędu (`exists`, `limit 1`); przy 2 zakupach źródło/data z dowolnego wiersza – dopisać `order by created_at` |
| `nauka_paczka_moze_zarobic()` | v37:125 | bez zmian (`exists`) |
| `nauka_admin_karnet_wydaj/cofnij()`, `nauka_admin_karnety()` | v38:51–96 | **zmiana**: `select … where email = em for update` i upsert po e-mailu → po `(email, rocznik_id)`; kolumna `rocznik_id` już jest (v38:26) – łączę, nie dubluję |
| `nauka_konto_usun_dane()` | v32:57 | bez zmian – kasuje ogólnie po `email`/`user_id` we wszystkich tabelach, więc zabierze wszystkie wiersze osoby |
| `stripe-webhook` | 103–177 | **zmiana**: `maybeSingle()` po `email` (105, 158) wybuchnie przy 2 wierszach; upsert po `(email, rocznik_id)`; rocznik z 4. części `client_reference_id` |
| `usun-konto` (Edge) | 76–77 | bez zmian (lista subskrypcji, wiele wierszy OK) |
| `nauka_czytelnik()` | nauka.sql:58 | stara, nieużywana przez reguły od skrot-platnosci; bez zmian |

**Rozbieżność ze specem:** v32 nie odwołuje się do `nauka_dostep` po nazwie (usuwa ogólnie), więc w v45 nie trzeba go przepisywać – tylko test.

## 7. Inne uwagi

- Gałąź `kierunek-prawo` (lokalna, niewypchnięta) ma `skrot-v23-rocznik-dostep.sql` ze starego specu – ten fundament ją zastępuje; Prawo trzeba będzie potem przenieść na v44–v46.
- `nauka_roczniki.id` ma wzorzec `^[a-z]+-[a-z0-9]+-[012]-(st|nst)-20[0-9]{2}$` – `wefiz-test-1-st-2026` pasuje.
- `nauka_rocznik_zapisz` (v31) pozwala wybrać tylko rocznik `oczekujacy`/`platny`; przełącznik admina (Etap 3) działa w `localStorage`, więc go to nie dotyczy.
