# Etap 1: scalenie lekcji v4, profilu nauki (FSRS) i roczników

Spec: „Systemy z Zdawalni w Skrócie: raz dla wszystkich kierunków”, etap 1 (wklejony w czacie 4.11.2026).

## Gałęzie

| Gałąź | Od | Zawiera |
|---|---|---|
| `zdawalni/scal-lekcje-v4` | `main` (2de1bef) | `lekcje/v4` (etapy A–D) + migracja v29 |
| `zdawalni/scal-profil` | `zdawalni/scal-lekcje-v4` | `feat/l7-profil-nauki` (FSRS, profil nauki) + migracja v30 + jedna ścieżka zdarzeń |
| `zdawalni/scal-kierunki` | `zdawalni/scal-profil` | `kierunki` (rocznik.js) + migracja v31 + ekran wejścia i Teams z rocznika |

Ostatnia (`zdawalni/scal-kierunki`) ma wszystko. Na `main` trafi po Twoim „uruchomione” (fast-forward).

## SQL dla Bartka (klik po kliku)

Supabase → projekt **skrzynka-bm** → **SQL Editor** → **New query**. Każdy plik osobno, w tej kolejności:

1. Wklej całe `supabase/skrot-v29-powtorki.sql` → **Run**. Oczekiwany wynik: „Success. No rows returned”.
2. Wklej całe `supabase/skrot-v30-profil.sql` → **Run**. Ten sam wynik.
3. Wklej całe `supabase/skrot-v31-roczniki.sql` → **Run**. Ten sam wynik.
4. Sprawdzenie (tylko odczyt), wklej i **Run**:

```sql
select 'funkcja: ' || p.proname || '(' || p.pronargs || ' arg)' as co from pg_proc p
where p.pronamespace = 'public'::regnamespace
  and p.proname in ('nauka_rp_powtorka','nauka_zdarzenia_zapisz','nauka_profil_nauki','nauka_roczniki_lista','nauka_rocznik_moj','nauka_rocznik_ustaw')
union all
select 'tabela: ' || c.relname from pg_class c
where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'
  and c.relname in ('nauka_powtorki_log','nauka_zdarzenia','nauka_profil_nauki','nauka_roczniki','nauka_kierunki','nauka_wydzialy')
union all
select 'typy zdarzeń: ' || (select string_agg(k, ', ' order by k) from jsonb_object_keys(public.nauka_zdarzenia_typy()) k)
union all
select 'profile z rocznikiem: ' || count(*) filter (where rocznik_id is not null) || ' / wybrane: ' || count(*) filter (where rocznik_wybrany_at is not null) || ' / wszystkie: ' || count(*) from public.nauka_profil
order by 1;
```

Powinno być: `nauka_rp_powtorka` z 1 i z 4 argumentami, pięć pozostałych funkcji, sześć tabel, typy zdarzeń z `activity`, a w ostatnim wierszu zaraz po uruchomieniu trzy równe liczby (każdy dotychczasowy profil ma rocznik BM i liczy się jako wybrany; nowe konta dostają „wybrane” przy pierwszym wejściu na stronę).

Każdy plik można uruchomić ponownie. Jeśli kiedyś były już uruchomione stare pliki z gałęzi (`skrot-v22-powtorki.sql`, `skrot-v22-profil.sql`, `skrot-v22-roczniki.sql`), nowe przejdą bez błędów (test PGlite: stare v22 + nowe v29–v31).

5. Napisz „uruchomione” – wtedy scalam na `main` (strona skrotbm.pl).

Bez SQL strona też działa: pomiar powtórek, zdarzenia nauki i zapis kierunku w profilu po cichu się wyłączają.

## Funkcja `claude` (nie trzeba teraz)

Gałąź `kierunki` zmieniła sprawdzanie poleceń w `supabase/functions/claude/index.ts` (wzorzec dla dowolnego kierunku). Dla BM polecenia są takie same jak dotąd, więc obecna wersja na produkcji działa. Wdrożenie potrzebne dopiero przy drugim kierunku (i po 1.12, gdy wróci limit Anthropic).

## Jak sprawdzone

- `node --test tests/*.test.js`: wszystkie.
- PGlite (`supabase/test/pglite.mjs`, każda migracja 2×): `test/v29.sql` W1–W5, `test/v30.sql` P1–P11, `test/v31.sql` R1–R10; osobno baza ze starymi v22 + nowe v29–v31.
- Playwright: `lekcje-v4.mjs` 30/30, `profil-nauki.mjs`, `scalenie-zdawalni.mjs` 7/7, `kierunek.mjs`, cały zestaw `docs/gry/test` porównany z `main` przed scaleniem, `bm-ekrany.mjs` (64 ekrany BM, PL/EN, płatne/gość/starosta).
