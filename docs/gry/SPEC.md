# Skrót BM: Gry i Ranking – specyfikacja dla Claude Code
2026-10-28 · @Bartek
## 0. Jak pracować z tym dokumentem
To jest specyfikacja wykonawcza dla Claude Code. Repo: `kowalczykbartek74-cpu/skrot-bm`, gałąź `main`, strona statyczna na GitHub Pages (`skrotbm.pl`), baza i logowanie w Supabase (projekt `zkyxujkdrovfzpasocmv`). Opis decyzji produktowych jest w dokumencie „Skrót BM: Gry i Ranking kierunku”; tutaj jest tylko to, co trzeba zbudować i jak.
Zasady (obowiązują w każdym etapie):
1. Rób jeden etap na raz, na osobnej gałęzi `gry-etap-N`. Nie zaczynaj kolejnego, dopóki checklista etapu (sekcja 11) nie jest cała zielona.
2. Nie przepisuj istniejącego kodu. Dopinasz się do funkcji, które już są (lista w sekcji 1). Jeśli coś trzeba zmienić w istniejącej funkcji, zmiana ma być minimalna i opisana w commicie.
3. Kod gier idzie do nowego pliku gry.js, ładowanego dopiero po wejściu w grę. `index.html` dostaje tylko widoki, wpięcia i CSS.
4. Cała logika punktów rankingu jest w bazie (funkcje RPC). Przeglądarka nigdy nie wpisuje punktów sama.
5. Każda nowa funkcja SQL: `security definer`, `set search_path = ''`, a na końcu `revoke all … from public, anon` i `grant execute … to authenticated` tylko dla tych, które woła strona. Funkcje pomocnicze: `revoke … from public, anon, authenticated` (patrz komentarz w `skrot-v12-zabezpieczenia.sql`).
6. Funkcje RPC zwracają `jsonb` w formacie `{ "ok": true, … }` albo `{ "ok": false, "code": "…" }`, tak jak `nauka_zgoda`. Błąd SQL tylko przy naprawdę nieoczekiwanej sytuacji.
7. Każdy nowy tekst na ekranie: polski w kodzie + para w `i18n-en.js` (`"exact"`). Tekst rysowany na `<canvas>` przechodzi przez `T(s) = window.SKROT_I18N?.t?.(s) ?? s`, bo słownik nie widzi canvasu.
8. Ruch i konfetti tylko gdy `!lpReduced()`. Każda gra ma działać przy „Mniej animacji” (bez wstrząsów, bez migania, bez konfetti).
9. Motyw różowy (`data-theme="pink"`) musi działać: kolory w grach czytaj z CSS (`getComputedStyle(document.documentElement).getPropertyValue("--accent")` itd.) przy starcie rundy, nie wpisuj hexów na sztywno poza rysunkami postaci.
10. Po każdym etapie: dopisz rozdział do `README.md` (format jak istniejące rozdziały: co robi, gdzie jest kod, jak wdrożyć) i podbij `?v=` przy zmienionych skryptach.
11. Commity z dopiskiem `Co-Authored-By` jak dotychczas. Push na main dopiero po testach z sekcji 11. SQL uruchamia Bartek ręcznie w Supabase → SQL Editor; strona musi działać także zanim go uruchomi (wtedy pokazuje „Gry i ranking nie są jeszcze włączone na serwerze”, tak jak „Moje materiały”).
Kolejność etapów: 0 (baza + API) → 1 (Druga szansa + Fruń) → 2 (Ranking) → 3 (Pary) → 4 (Przejdź) → 5 (szlif). Etap 1 da się wypuścić bez rankingu: punkty zapisują się od razu, a lista pojawi się w etapie 2.
Definicja „zrobione” dla etapu: kod na gałęzi, testy z sekcji 11 przechodzą lokalnie (Playwright, 390 px i 1280 px, PL i EN, płatny / darmowy / starosta), zero błędów w konsoli, README uzupełnione, krótka notatka dla Bartka: co ma uruchomić w Supabase i w jakiej kolejności.
## 1. Stan obecny: na czym budujemy
Sprawdzone w repo 28.10.2026 (commit na `main`). Numery linii są orientacyjne – szukaj po nazwach.
Pliki: `index.html` (cała aplikacja, ~10 300 linii, jeden `<script>`), `skrot-supabase.js` (klient Supabase jako `window.skrot`, logowanie, płatności, wywołania RPC), `i18n.js` + `i18n-en.js` (tłumaczenie EN), `supabase/*.sql` (ostatni plik: `skrot-v12-zabezpieczenia.sql`). CSP w `<head>` pozwala na skrypty z `'self'`, więc `gry.js` z tego samego repo działa bez zmian CSP.
Dane, z których gry biorą treść:
| Co | Gdzie | Kształt |
| Pytania ABCD | `nauka_docs`, kolekcja `materialContent`, pole `quiz[]`; w przeglądarce `getContent(mid)` | `{ q, options[2–4], correct (indeks), explanation, slide, slides }`; pytanie identyfikuje para `materialId` + `index` |
| „Dlaczego?” do pytań | `getWhy(mid)` → `S.why[mid].items[index].why` | tekst |
| Zadania liczbowe | `materialContent.worked[]` → `w.similar[j]` | `{ task, result (liczba), tol?, unit?, steps?, hint? }`; klucz `${mid}:${w.id}:${j}`; sprawdzanie `numMatch(val, s)`, parsowanie `parseNum` |
| Słowniczek | `loadGlossary()` → `GL.terms` | `{ en, pl?, def?, s: [sid…] }`; klucz powtórki `glKey(sid, en)` |
| Przedmioty | `SUBJECTS` (z planu) | `{ id (slug), pl, en, color, abbr }`; `subjectById(id)` |
| Materiały | `S.materials`, `materialsOf(sid)`, `readable(m)`, `isMine(m)`, `isLesson(m)` | materiały własne (`isMine`) nie biorą udziału w grach rankingowych |
| Najbliższe zaliczenie | `nextExam(sid)`, `termItems` | `{ part, date }` |
| Grupa | `S.group` (`"C111"`, `"C112"`, `"C113"`), zapisywana też w dokumencie postępu (`progress.group`) przez `setGroup` | baza czyta grupę z `nauka_docs` kolekcja `progress`, id = `user_id` |
Mechanizmy do użycia (nie budować drugi raz):
| Mechanizm | Funkcje | Jak używamy |
| XP i seria | `xpFlush(n)` (jedyny zapis XP), `xpTake(pool, n)`, `XP_CAP` | gry dają też XP z nowej puli `games` (sekcja 2) |
| Powtórki | `srsAdd(keys)`, `cardKey(mid, card)`, `glKey(sid, en)` | po złej odpowiedzi w grze fiszki tego materiału idą do Powtórek |
| Odtwarzacz kart | `playerOpen(src)`, `quizSource(qs, key, o)`, `lpSwap` | „Powtórz pomylone” po grze otwiera zwykły quiz z pomylonych pytań |
| Efekty | `lpConfetti(n)`, `lpBanner(t)`, `lpBuzz(ok)`, `lpReduced()` | nowy rekord, wynik końcowy |
| UI | `h(tag, attrs, …children)`, `modal(build)`, `toast(msg)`, `icon(k)`, `go(route)`, `render()`, komponenty `sk-*` | widoki Graj i Ranking |
| Ładowanie | `S.ready`, `PAID()`, `window.skrot.state`, `window.skrot.admin` | blokada dla niezalogowanych i bez dostępu |
| RPC | `window.skrot.sb.rpc(nazwa, args)`, `rpcErr` w `skrot-supabase.js` | nowy obiekt `window.skrot.rp` (sekcja 4) |
Ważne ograniczenie (zmienia założenie z planu): odpowiedzi do quizów są dziś czytelne w przeglądarce (to materiał do nauki, a stary quiz sprawdza się lokalnie). Nie ukrywamy ich. Uczciwość rankingu opiera się na tym, że każdą odpowiedź sprawdza baza, punkty są tylko za pytania z materiałów roku (nie z „Moich materiałów”), to samo pytanie liczy się raz dziennie, a dzienne limity punktów są twarde. Kto „oszuka”, czytając klucz, dostanie najwyżej tyle, ile pilny student – i musi to robić codziennie.
XP a punkty rankingu: zostają dwie osobne liczby. XP (⚡) dalej liczy przeglądarka (poziomy, cel dnia). Ranking liczy nowe punkty rankingu (🏆, w tekstach „pkt rankingu”), zapisywane wyłącznie przez bazę. Nie mylić z „pkt” lekcji ze specyfikacji postępu (`lessonPts`).
## 2. Stałe i nazwy
Wszystkie liczby, które Bartek może chcieć zmienić, są w dwóch miejscach: `GRY_CFG` na górze `gry.js` (zachowanie gier) i `nauka_rp_cfg()` w SQL (punkty i limity). Nigdzie indziej nie wpisuj tych liczb na sztywno.
Nazwy (używaj dokładnie tych):
| Rzecz | Id w kodzie | Nazwa PL / EN |
| Gra 1 (lot) | `frun` | Fruń / Fly |
| Gra 2 (memory) | `pary` | Pary / Pairs |
| Gra 3 (przejście) | `przejdz` | Przejdź / Cross |
| Pytanie po śmierci | `drugaSzansa` | Druga szansa / Second chance |
| Punkty do rankingu | `rp` | pkt rankingu / ranking pts (ikona 🏆) |
| Widok gier | trasa `#/gry`, `view: "gry"` | Graj / Play |
| Widok rankingu | trasa `#/ranking`, `view: "ranking"` | Ranking kierunku / Programme ranking |
| Plik SQL | `supabase/skrot-v13-gry.sql` | – |
| Plik gier | `gry.js` (w katalogu głównym, obok `skrot-supabase.js`) | – |
gry.js – konfiguracja (wklej dokładnie, potem stroimy):
```
const GRY_CFG = {
  step: 1 / 60,            // stały krok fizyki (s)
  maxSteps: 5,             // max kroków fizyki na klatkę (po zawieszeniu karty nie nadrabiamy wieczności)
  dprMax: 2,               // ostrość canvasu: min(devicePixelRatio, 2)
  W: 360,                  // szerokość świata w jednostkach logicznych; wysokość z proporcji ekranu
  revive: { max: 2, abcdSec: 20, taskSec: 60, invulnSec: 2 },
  minQuestions: 20,        // przedmiot z mniejszą liczbą pytań ABCD jest wyszarzony
  runQuestionsMax: 12,     // tyle pytań najwyżej na rundę (wskrzeszenia + bramki)
  xpPerCorrect: 5,         // XP (⚡) za dobrą odpowiedź w grze, pula "games"
  frun: {
    gravity: 1500, flapV: -440, maxFall: 700, x: 100, r: 12, // promień kolizji mniejszy niż rysunek (14) – gra wybacza
    pipeW: 64, gap0: 170, gapMin: 130, gapStep: 4,          // przerwa maleje o 4 co 10 kolumn
    spacing: 210, speed0: 140, speedStep: 8, speedMax: 220,  // prędkość rośnie o 8 co 10 kolumn
    ground: 80, gapMaxShift: 180, margin: 110,
  },
  przejdz: {
    cols: 9, cell: 40, hopMs: 120, startRows: 4,
    carSpeed0: 60, carSpeedStep: 15, carSpeedMax: 160,
    logSpeed0: 40, logSpeedStep: 10, logLen: [2, 4],
    tramEvery: [4, 7], tramWarn: 1.2, tramSpeed: 900,
    autoScrollFrom: 10, autoScroll: 0.25,   // od 10. rzędu ekran sam jedzie 0,25 rzędu/s
    gateEvery: 25,                          // co 25 rzędów bramka z pytaniem
  },
  pary: { sizes: { latwy: [4, 3], sredni: [4, 4], trudny: [5, 4] }, flipBackMs: 900, explainMs: 1500 },
};
```
SQL – konfiguracja punktów (część pliku skrot-v13-gry.sql):
```
create or replace function public.nauka_rp_cfg() returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object(
    'kierunek', 'BM', 'rocznik', 2026,
    'semestr_od', '2026-10-01',        -- początek semestru do widoku "Semestr"; zmień w lutym na datę 2. semestru
    'pkt_abcd', 10, 'pkt_zadanie', 20, 'pkt_powtorka', 1, 'pkt_lekcja', 30, 'pkt_seria', 5,
    'max_dzien_gry', 150,              -- odpowiedzi w grach + punkty za wynik
    'max_dzien_quiz', 300,
    'max_dzien_powtorki', 20,
    'max_dzien_lekcje', 150,
    'max_wynik_runda', 20, 'rundy_z_pkt_dzien', 3,
    'max_odp_minuta', 20, 'max_rund_dzien', 40, 'max_pytan_runda', 12,
    'min_osob_stat', 5, 'min_odp_stat', 20,
    'ukryj_adminow', true
  )
$$;
```
Czas w bazie zawsze liczony w strefie `Europe/Warsaw`: dzień = `(now() at time zone 'Europe/Warsaw')::date`, tydzień = poniedziałek tego dnia (`date_trunc('week', dzień)::date`).
## 3. Etap 0: baza (`supabase/skrot-v13-gry.sql`)
Cały plik poniżej jest gotowy i przetestowany 28.10.2026 na PostgreSQL 16 z kopią wszystkich migracji z repo (nauka.sql → v12) i atrapą `auth.uid()` / `auth.jwt()`. Claude Code wkleja go do repo bez zmian w logice; jedyne miejsce do uzupełnienia to lista wulgaryzmów w `nauka_nick_ok`.
Co robi:
| Element | Rola |
| `nauka_profil` | pseudonim, widoczność w rankingu (opt-in), kierunek i rocznik |
| `nauka_rp` | księga punktów rankingu; unikalne `(user_id, dzien, klucz)` = to samo pytanie raz dziennie |
| `nauka_odp` | każda odpowiedź sprawdzona przez bazę (statystyki rocznika, limit tempa 20/min) |
| `nauka_gry` | rundy gier: start, koniec, wynik, status `ok` / `podejrzana` / `porzucona` |
| `nauka_rp_dodaj` | jedyne miejsce, które wpisuje punkty; pilnuje dziennych pul i dokłada +5 za serię |
| `nauka_rp_odpowiedz`, `nauka_rp_zadanie` | sprawdzają odpowiedź w `materialContent` i przyznają punkty |
| `nauka_rp_powtorka`, `nauka_rp_lekcja` | +1 za ocenioną fiszkę (max 20/dzień), +30 raz na lekcję |
| `nauka_gra_start`, `nauka_gra_koniec` | runda; koniec sprawdza, czy wynik był możliwy w czasie zmierzonym przez serwer |
| `nauka_ranking`, `nauka_rekordy`, `nauka_kierunek_stat` | widoki dla studentów |
| `nauka_admin_gry`, `nauka_admin_nick_usun` | panel starosty |
Wyniki testów lokalnych (powtórz je w sekcji 11): zła długość / zastrzeżony pseudonim → odrzucony; ten sam pseudonim inną wielkością liter → `nick_zajety`; dobra odpowiedź +10, ta sama drugi raz tego dnia +0; zadanie 251 przy wyniku 250 → zaliczone (tolerancja 0,5%); lekcja +30 tylko raz; odpowiedź „gra” bez rundy → `bad_run`; Fruń 500 kolumn w 1 s → `podejrzana`, 0 pkt; Fruń 40 kolumn w 60 s → `ok`, +20 pkt, nowy rekord; konto bez dostępu → `no_access` wszędzie; 30 powtórek → razem 20 pkt; 25 odpowiedzi w minutę → 5 odrzuconych `too_fast`; starosta ma punkty, ale nie ma go na liście; osoba ukryta widzi swoje „miejsce, gdybyś był widoczny”; osoba z C111 przy filtrze C112 nie dostaje miejsca; statystyki pokazują przedmiot dopiero od 5 osób; `select` z tabel jako `authenticated` → `permission denied`.
Wdrożenie (Bartek): Supabase → SQL Editor → wklej plik → Run. Strona sprawdza obecność bazy wywołaniem `nauka_profil_moj`; błąd „function … does not exist” (kod PostgREST `PGRST202`) = pokaż „Gry i ranking nie są jeszcze włączone na serwerze”.
Prywatność (prywatnosc.html, przed włączeniem rankingu) – dopisz akapit: „Ranking i gry. Gdy grasz albo odpowiadasz na pytania, zapisujemy wynik, poprawność odpowiedzi i czas (do 12 miesięcy), żeby liczyć punkty i statystyki rocznika. W rankingu pokazujemy wyłącznie wybrany przez Ciebie pseudonim i punkty – tylko jeśli sam włączysz widoczność; możesz ją wyłączyć w każdej chwili (Więcej → Ranking). Statystyki rocznika są zbiorcze i pokazujemy je dopiero przy co najmniej 5 osobach. Starosta widzi rundy oznaczone jako podejrzane (adres e-mail, gra, wynik), żeby chronić uczciwość rankingu.” Regulamin – dopisz: pseudonim nie może być obraźliwy ani podszywać się pod inną osobę, administrator może go usunąć; wyniki zdobyte przez oszukiwanie mogą zostać unieważnione.
Pełny plik supabase/skrot-v13-gry.sql:
```
-- Skrót BM v13: gry (Fruń, Pary, Przejdź), punkty rankingu i Ranking kierunku.
-- Wklej w Supabase → SQL Editor → Run. Można uruchamiać wielokrotnie (nie kasuje danych).
-- Wymaga wcześniej: nauka.sql … skrot-v12-zabezpieczenia.sql (korzysta z nauka_platny, nauka_admin, nauka_konta).
--
-- Zasady:
--   • Punkty rankingu (🏆) wpisuje WYŁĄCZNIE baza, w funkcjach poniżej. Przeglądarka nie ma prawa zapisu do tabel.
--   • Odpowiedź ABCD i wynik zadania liczbowego sprawdza baza na podstawie materialContent (materiały roku).
--     „Moje materiały” (myContent) nie dają punktów rankingu.
--   • To samo pytanie daje punkty raz dziennie (klucz w nauka_rp). Dzienne limity na źródło są twarde.
--   • W rankingu widać tylko pseudonim i tylko osoby, które same włączyły widoczność (opt-in).
--   • Grupę (C111/C112/C113) baza czyta z dokumentu postępu osoby (nauka_docs, kolekcja progress, pole group).

-- =====================================================================
-- 1) Ustawienia
-- =====================================================================
create or replace function public.nauka_rp_cfg() returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object(
    'kierunek', 'BM', 'rocznik', 2026,
    'semestr_od', '2026-10-01',        -- początek semestru do widoku „Semestr”; w lutym zmień na datę 2. semestru
    'pkt_abcd', 10, 'pkt_zadanie', 20, 'pkt_powtorka', 1, 'pkt_lekcja', 30, 'pkt_seria', 5,
    'max_dzien_gry', 150,              -- odpowiedzi w grach + punkty za wynik
    'max_dzien_quiz', 300,
    'max_dzien_powtorki', 20,
    'max_dzien_lekcje', 150,
    'max_wynik_runda', 20, 'rundy_z_pkt_dzien', 3,
    'max_odp_minuta', 20, 'max_rund_dzien', 40, 'max_pytan_runda', 12,
    'min_osob_stat', 5, 'min_odp_stat', 20,
    'ukryj_adminow', true
  )
$$;

create or replace function public.nauka_dzis() returns date
language sql stable set search_path = '' as $$ select (now() at time zone 'Europe/Warsaw')::date $$;

create or replace function public.nauka_tydzien(d date) returns date
language sql immutable set search_path = '' as $$ select date_trunc('week', d::timestamp)::date $$;

-- =====================================================================
-- 2) Tabele (dostęp tylko przez funkcje; brak reguł = przeglądarka nie czyta i nie pisze)
-- =====================================================================
create table if not exists public.nauka_profil (
  user_id      uuid primary key,
  kierunek     text not null default 'BM' check (kierunek ~ '^[A-Z]{2,6}$'),
  rocznik      int  not null default 2026 check (rocznik between 2020 and 2100),
  nick         text check (nick is null or char_length(nick) between 3 and 20),
  w_rankingu   boolean not null default false,
  nick_zmiana  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create unique index if not exists nauka_profil_nick_uq
  on public.nauka_profil (kierunek, rocznik, lower(nick)) where nick is not null;

-- Księga punktów rankingu: jeden wiersz = jedno przyznanie punktów.
create table if not exists public.nauka_rp (
  id         bigint generated always as identity primary key,
  user_id    uuid not null,
  dzien      date not null,
  tydzien    date not null,
  zrodlo     text not null check (zrodlo in ('gra','wynik','quiz','powtorka','lekcja','seria')),
  klucz      text not null check (char_length(klucz) between 1 and 200),
  sid        text,
  pkt        int  not null check (pkt between 0 and 100),
  run_id     uuid,
  created_at timestamptz not null default now(),
  unique (user_id, dzien, klucz)
);
alter table public.nauka_rp add column if not exists run_id uuid;
create index if not exists nauka_rp_tydzien_idx on public.nauka_rp (tydzien, user_id);
create index if not exists nauka_rp_dzien_idx   on public.nauka_rp (dzien, user_id);
create index if not exists nauka_rp_user_idx    on public.nauka_rp (user_id, dzien desc);

-- Wszystkie odpowiedzi sprawdzone przez bazę (do statystyk rocznika i limitu tempa).
create table if not exists public.nauka_odp (
  id         bigint generated always as identity primary key,
  user_id    uuid not null,
  mid        text not null,
  idx        text not null,            -- ABCD: indeks pytania; zadanie: "<w.id>:<j>"
  sid        text,
  rodzaj     text not null check (rodzaj in ('abcd','zadanie')),
  ok         boolean not null,
  zrodlo     text not null check (zrodlo in ('gra','quiz')),
  run_id     uuid,
  created_at timestamptz not null default now()
);
create index if not exists nauka_odp_user_idx on public.nauka_odp (user_id, created_at desc);
create index if not exists nauka_odp_sid_idx  on public.nauka_odp (sid, created_at desc);
create index if not exists nauka_odp_mid_idx  on public.nauka_odp (mid, created_at desc);

-- Rundy gier.
create table if not exists public.nauka_gry (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  gra        text not null check (gra in ('frun','pary','przejdz')),
  sid        text,
  seed       int  not null,
  start      timestamptz not null default now(),
  koniec     timestamptz,
  wynik      int,
  czas_ms    int,
  bledy      int,
  pytania    int not null default 0,
  ozywienia  int not null default 0,
  status     text not null default 'trwa' check (status in ('trwa','ok','podejrzana','porzucona')),
  powod      text,
  pkt        int not null default 0
);
create index if not exists nauka_gry_user_idx on public.nauka_gry (user_id, start desc);
create index if not exists nauka_gry_start_idx on public.nauka_gry (start desc);

alter table public.nauka_profil enable row level security;
alter table public.nauka_rp     enable row level security;
alter table public.nauka_odp    enable row level security;
alter table public.nauka_gry    enable row level security;
revoke all on public.nauka_profil, public.nauka_rp, public.nauka_odp, public.nauka_gry from anon, authenticated;

-- =====================================================================
-- 3) Funkcje pomocnicze (tylko dla innych funkcji bazy)
-- =====================================================================
-- Czy ta osoba może zdobywać punkty: zalogowana, pełny dostęp z tego urządzenia, konto nie zablokowane.
create or replace function public.nauka_rp_mozna() returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and public.nauka_platny()
     and not exists (select 1 from public.nauka_konta k where k.user_id = auth.uid() and k.zablokowane)
$$;

create or replace function public.nauka_rp_pula(z text) returns text
language sql immutable set search_path = '' as $$
  select case when z in ('gra','wynik') then 'gry' when z = 'quiz' then 'quiz'
              when z = 'powtorka' then 'powtorki' when z = 'lekcja' then 'lekcje' else 'seria' end
$$;

-- Przyznaje punkty z limitem dziennym puli. Zwraca, ile faktycznie przyznano (0 = limit albo już było dziś).
-- Pierwsze punkty dnia dokładają +pkt_seria, jeśli wczoraj też były punkty.
create or replace function public.nauka_rp_dodaj(p_user uuid, p_zrodlo text, p_klucz text, p_sid text, p_pkt int, p_run uuid default null)
returns int
language plpgsql security definer set search_path = '' as $$
declare
  c jsonb := public.nauka_rp_cfg();
  d date := public.nauka_dzis();
  pula text := public.nauka_rp_pula(p_zrodlo);
  limit_ int;
  uzyte int;
  dam int;
  n int;
  pierwsze boolean;
begin
  if p_pkt is null or p_pkt <= 0 then return 0; end if;
  limit_ := case pula when 'gry' then (c->>'max_dzien_gry')::int when 'quiz' then (c->>'max_dzien_quiz')::int
                      when 'powtorki' then (c->>'max_dzien_powtorki')::int when 'lekcje' then (c->>'max_dzien_lekcje')::int
                      else 1000 end;
  -- blokada na osobę, żeby dwa równoległe zapytania nie przekroczyły limitu
  perform pg_advisory_xact_lock(hashtext('nauka_rp:' || p_user::text));
  select coalesce(sum(r.pkt), 0) into uzyte from public.nauka_rp r
   where r.user_id = p_user and r.dzien = d and public.nauka_rp_pula(r.zrodlo) = pula;
  dam := least(p_pkt, greatest(0, limit_ - uzyte));
  if dam <= 0 then return 0; end if;
  pierwsze := not exists (select 1 from public.nauka_rp r where r.user_id = p_user and r.dzien = d);
  insert into public.nauka_rp (user_id, dzien, tydzien, zrodlo, klucz, sid, pkt, run_id)
  values (p_user, d, public.nauka_tydzien(d), p_zrodlo, left(p_klucz, 200), p_sid, dam, p_run)
  on conflict (user_id, dzien, klucz) do nothing;
  get diagnostics n = row_count;
  if n = 0 then return 0; end if;
  if pierwsze and exists (select 1 from public.nauka_rp r where r.user_id = p_user and r.dzien = d - 1) then
    insert into public.nauka_rp (user_id, dzien, tydzien, zrodlo, klucz, sid, pkt)
    values (p_user, d, public.nauka_tydzien(d), 'seria', 'seria', null, (c->>'pkt_seria')::int)
    on conflict (user_id, dzien, klucz) do nothing;
  end if;
  return dam;
end $$;

-- Limit tempa odpowiedzi: true = za szybko.
create or replace function public.nauka_rp_za_szybko(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select (select count(*) from public.nauka_odp o
          where o.user_id = p_user and o.created_at > now() - interval '1 minute')
         >= (public.nauka_rp_cfg()->>'max_odp_minuta')::int
$$;

-- Przedmiot materiału roku (null, gdy materiał nie istnieje).
create or replace function public.nauka_rp_sid(p_mid text) returns text
language sql stable security definer set search_path = '' as $$
  select data->>'subjectId' from public.nauka_docs where kolekcja = 'materials' and id = p_mid
$$;

-- Runda gry tej osoby, jeszcze trwająca, w której wolno zadać kolejne pytanie. Zwraca id albo null.
create or replace function public.nauka_rp_runda_pytanie(p_run uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare r public.nauka_gry;
begin
  if p_run is null then return null; end if;
  select * into r from public.nauka_gry g where g.id = p_run and g.user_id = auth.uid() for update;
  if not found or r.status <> 'trwa' or r.gra = 'pary' then return null; end if;
  if r.start < now() - interval '2 hours' then return null; end if;
  if r.pytania >= (public.nauka_rp_cfg()->>'max_pytan_runda')::int then return null; end if;
  update public.nauka_gry set pytania = pytania + 1 where id = r.id;
  return r.id;
end $$;

-- Czy konto to starosta (do ukrywania w rankingu).
create or replace function public.nauka_rp_admin_uid(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from auth.users u join public.nauka_admini a on a.email = lower(u.email) where u.id = p_user)
$$;

-- Grupa z dokumentu postępu.
create or replace function public.nauka_rp_grupa(p_user uuid) returns text
language sql stable security definer set search_path = '' as $$
  select nullif(data->>'group', '') from public.nauka_docs where kolekcja = 'progress' and id = p_user::text
$$;

-- Pseudonim: 3–20 znaków, litery (także polskie), cyfry, spacja, _ . -; bez słów zastrzeżonych.
create or replace function public.nauka_nick_ok(p text) returns text
language plpgsql immutable set search_path = '' as $$
declare n text := regexp_replace(btrim(coalesce(p, '')), '\s+', ' ', 'g'); l text;
begin
  if char_length(n) < 3 or char_length(n) > 20 then return 'nick_dlugosc'; end if;
  if n !~ '^[A-Za-z0-9ĄĆĘŁŃÓŚŹŻąćęłńóśźż _.-]+$' then return 'nick_znaki'; end if;
  l := lower(translate(n, 'ĄĆĘŁŃÓŚŹŻąćęłńóśźż0134', 'acelnoszzacelnoszzoiea'));
  -- Zastrzeżone i wulgarne rdzenie. Claude Code: uzupełnij listę o typowe polskie i angielskie wulgaryzmy (rdzenie, bez spacji).
  if l ~ '(admin|starost|skrot|moderat|support|pomoc|anthropic|claude)' then return 'nick_zastrzezony'; end if;
  return null;
end $$;

-- =====================================================================
-- 4) Funkcje dla strony
-- =====================================================================

-- Profil rankingowy zalogowanej osoby (tworzy pusty przy pierwszym wywołaniu).
create or replace function public.nauka_profil_moj() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare p public.nauka_profil; c jsonb := public.nauka_rp_cfg();
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  insert into public.nauka_profil (user_id, kierunek, rocznik) values (auth.uid(), c->>'kierunek', (c->>'rocznik')::int)
  on conflict (user_id) do nothing;
  select * into p from public.nauka_profil where user_id = auth.uid();
  return jsonb_build_object('ok', true, 'nick', p.nick, 'w_rankingu', p.w_rankingu, 'kierunek', p.kierunek,
    'rocznik', p.rocznik, 'grupa', public.nauka_rp_grupa(auth.uid()),
    'nick_zmiana_od', case when p.nick_zmiana is null then null else p.nick_zmiana + interval '7 days' end);
end $$;

-- Ustawia pseudonim i/lub widoczność. null = bez zmian. Pseudonim zmienia się najwyżej raz na 7 dni.
create or replace function public.nauka_profil_ustaw(p_nick text default null, p_w_rankingu boolean default null)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare p public.nauka_profil; blad text; n text;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  perform public.nauka_profil_moj();
  select * into p from public.nauka_profil where user_id = auth.uid() for update;
  if p_nick is not null then
    n := regexp_replace(btrim(p_nick), '\s+', ' ', 'g');
    if p.nick is distinct from n then
      blad := public.nauka_nick_ok(n);
      if blad is not null then return jsonb_build_object('ok', false, 'code', blad); end if;
      if p.nick is not null and p.nick_zmiana is not null and p.nick_zmiana > now() - interval '7 days' then
        return jsonb_build_object('ok', false, 'code', 'nick_za_wczesnie', 'od', p.nick_zmiana + interval '7 days');
      end if;
      if exists (select 1 from public.nauka_profil x where x.kierunek = p.kierunek and x.rocznik = p.rocznik
                 and lower(x.nick) = lower(n) and x.user_id <> p.user_id) then
        return jsonb_build_object('ok', false, 'code', 'nick_zajety');
      end if;
      update public.nauka_profil set nick = n, nick_zmiana = case when p.nick is null then null else now() end,
        updated_at = now() where user_id = p.user_id;
    end if;
  end if;
  if p_w_rankingu is not null then
    if p_w_rankingu and coalesce(n, p.nick) is null then
      return jsonb_build_object('ok', false, 'code', 'nick_brak');
    end if;
    update public.nauka_profil set w_rankingu = p_w_rankingu, updated_at = now() where user_id = p.user_id;
  end if;
  return public.nauka_profil_moj();
end $$;

-- Start rundy gry.
create or replace function public.nauka_gra_start(p_gra text, p_sid text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare c jsonb := public.nauka_rp_cfg(); v_id uuid; v_seed int;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_rp_mozna() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  if p_gra not in ('frun','pary','przejdz') then return jsonb_build_object('ok', false, 'code', 'bad_game'); end if;
  if p_sid is not null and char_length(p_sid) > 80 then return jsonb_build_object('ok', false, 'code', 'bad_subject'); end if;
  if (select count(*) from public.nauka_gry g where g.user_id = auth.uid() and g.start >= (public.nauka_dzis()::timestamp at time zone 'Europe/Warsaw'))
     >= (c->>'max_rund_dzien')::int then
    return jsonb_build_object('ok', false, 'code', 'too_many_runs');
  end if;
  -- stare, niezakończone rundy tej osoby zamykamy jako porzucone
  update public.nauka_gry set status = 'porzucona', koniec = now()
   where user_id = auth.uid() and status = 'trwa' and start < now() - interval '2 hours';
  v_seed := floor(random() * 2147483646)::int + 1;
  insert into public.nauka_gry (user_id, gra, sid, seed) values (auth.uid(), p_gra, p_sid, v_seed) returning id into v_id;
  -- sprzątanie historii starszej niż 12 miesięcy (tanio, przy okazji)
  delete from public.nauka_odp where created_at < now() - interval '12 months';
  delete from public.nauka_gry where start < now() - interval '12 months';
  delete from public.nauka_rp  where dzien < public.nauka_dzis() - 400;
  return jsonb_build_object('ok', true, 'run', v_id, 'seed', v_seed);
end $$;

-- Odpowiedź ABCD. p_wybor = indeks w ORYGINALNEJ kolejności odpowiedzi (przed tasowaniem na ekranie).
-- p_zrodlo: 'gra' (wtedy p_run wymagany) albo 'quiz'.
create or replace function public.nauka_rp_odpowiedz(p_mid text, p_idx int, p_wybor int, p_zrodlo text, p_run uuid default null)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  c jsonb := public.nauka_rp_cfg();
  q jsonb; v_sid text; v_ok boolean; v_correct int; v_pkt int := 0; v_run uuid;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_rp_mozna() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  if p_zrodlo not in ('gra','quiz') then return jsonb_build_object('ok', false, 'code', 'bad_source'); end if;
  if public.nauka_rp_za_szybko(auth.uid()) then return jsonb_build_object('ok', false, 'code', 'too_fast'); end if;
  select data->'quiz'->p_idx into q from public.nauka_docs where kolekcja = 'materialContent' and id = p_mid;
  if q is null or jsonb_typeof(q->'correct') <> 'number' then return jsonb_build_object('ok', false, 'code', 'no_question'); end if;
  v_sid := public.nauka_rp_sid(p_mid);
  if v_sid is null then return jsonb_build_object('ok', false, 'code', 'no_question'); end if;
  if p_zrodlo = 'gra' then
    v_run := public.nauka_rp_runda_pytanie(p_run);
    if v_run is null then return jsonb_build_object('ok', false, 'code', 'bad_run'); end if;
  end if;
  v_correct := (q->>'correct')::int;
  v_ok := p_wybor is not null and p_wybor = v_correct;
  insert into public.nauka_odp (user_id, mid, idx, sid, rodzaj, ok, zrodlo, run_id)
  values (auth.uid(), p_mid, p_idx::text, v_sid, 'abcd', v_ok, p_zrodlo, v_run);
  if v_ok then
    v_pkt := public.nauka_rp_dodaj(auth.uid(), p_zrodlo, 'q:' || p_mid || ':' || p_idx, v_sid, (c->>'pkt_abcd')::int, v_run);
    if v_run is not null then update public.nauka_gry set ozywienia = ozywienia + 1 where id = v_run; end if;
  end if;
  return jsonb_build_object('ok', true, 'poprawna', v_ok, 'correct', v_correct, 'pkt', v_pkt);
end $$;

-- Zadanie liczbowe z materialContent.worked[].similar[]. p_wid = w.id (porównywane jako tekst), p_j = indeks w similar.
create or replace function public.nauka_rp_zadanie(p_mid text, p_wid text, p_j int, p_wynik numeric, p_zrodlo text, p_run uuid default null)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  c jsonb := public.nauka_rp_cfg();
  s jsonb; v_sid text; v_res numeric; v_tol numeric; v_ok boolean; v_pkt int := 0; v_run uuid;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_rp_mozna() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  if p_zrodlo not in ('gra','quiz') then return jsonb_build_object('ok', false, 'code', 'bad_source'); end if;
  if public.nauka_rp_za_szybko(auth.uid()) then return jsonb_build_object('ok', false, 'code', 'too_fast'); end if;
  select w->'similar'->p_j into s
    from public.nauka_docs d, jsonb_array_elements(coalesce(d.data->'worked', '[]'::jsonb)) w
   where d.kolekcja = 'materialContent' and d.id = p_mid and w->>'id' = p_wid
   limit 1;
  if s is null or jsonb_typeof(s->'result') <> 'number' then return jsonb_build_object('ok', false, 'code', 'no_task'); end if;
  v_sid := public.nauka_rp_sid(p_mid);
  if v_sid is null then return jsonb_build_object('ok', false, 'code', 'no_task'); end if;
  if p_zrodlo = 'gra' then
    v_run := public.nauka_rp_runda_pytanie(p_run);
    if v_run is null then return jsonb_build_object('ok', false, 'code', 'bad_run'); end if;
  end if;
  v_res := (s->>'result')::numeric;
  -- ta sama tolerancja co numMatch() w index.html
  v_tol := coalesce((s->>'tol')::numeric, greatest(0.01, abs(v_res) * 0.005));
  v_ok := p_wynik is not null and abs(p_wynik - v_res) <= v_tol;
  insert into public.nauka_odp (user_id, mid, idx, sid, rodzaj, ok, zrodlo, run_id)
  values (auth.uid(), p_mid, p_wid || ':' || p_j, v_sid, 'zadanie', v_ok, p_zrodlo, v_run);
  if v_ok then
    v_pkt := public.nauka_rp_dodaj(auth.uid(), p_zrodlo, 'z:' || p_mid || ':' || p_wid || ':' || p_j, v_sid, (c->>'pkt_zadanie')::int, v_run);
    if v_run is not null then update public.nauka_gry set ozywienia = ozywienia + 1 where id = v_run; end if;
  end if;
  return jsonb_build_object('ok', true, 'poprawna', v_ok, 'wynik', v_res, 'pkt', v_pkt);
end $$;

-- Fiszka oceniona w Powtórkach (+1, najwyżej 20 dziennie). Klucz = klucz karty z index.html (cardKey / glKey).
create or replace function public.nauka_rp_powtorka(p_klucz text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_sid text; v_pkt int;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_rp_mozna() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  if p_klucz is null or char_length(p_klucz) not between 3 and 180 then return jsonb_build_object('ok', false, 'code', 'bad_key'); end if;
  v_sid := case when p_klucz like 'g:%' then split_part(p_klucz, ':', 2) else public.nauka_rp_sid(split_part(p_klucz, ':', 1)) end;
  v_pkt := public.nauka_rp_dodaj(auth.uid(), 'powtorka', 'p:' || p_klucz, v_sid, (public.nauka_rp_cfg()->>'pkt_powtorka')::int);
  return jsonb_build_object('ok', true, 'pkt', v_pkt);
end $$;

-- Lekcja zakończona zdanym biletem wyjścia: +30 raz na zawsze (nie raz dziennie).
create or replace function public.nauka_rp_lekcja(p_lid text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_sid text; v_pkt int := 0;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_rp_mozna() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  select data->>'subjectId' into v_sid from public.nauka_docs
   where kolekcja = 'materials' and id = p_lid and data->>'kind' = 'lesson';
  if v_sid is null then return jsonb_build_object('ok', false, 'code', 'no_lesson'); end if;
  if exists (select 1 from public.nauka_rp r where r.user_id = auth.uid() and r.klucz = 'l:' || p_lid) then
    return jsonb_build_object('ok', true, 'pkt', 0, 'juz', true);
  end if;
  v_pkt := public.nauka_rp_dodaj(auth.uid(), 'lekcja', 'l:' || p_lid, v_sid, (public.nauka_rp_cfg()->>'pkt_lekcja')::int);
  return jsonb_build_object('ok', true, 'pkt', v_pkt);
end $$;

-- Koniec rundy. p_wynik: frun = kolumny, przejdz = najdalszy rząd, pary = znalezione pary.
-- p_bledy: tylko pary (pomyłki). Baza sprawdza, czy wynik jest możliwy w czasie, który minął na serwerze.
create or replace function public.nauka_gra_koniec(p_run uuid, p_wynik int, p_czas_ms int, p_bledy int default 0)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  c jsonb := public.nauka_rp_cfg();
  r public.nauka_gry; v_s numeric; v_max int; v_status text := 'ok'; v_powod text; v_pkt int := 0; v_raw int;
  v_rekord int; v_nowy boolean;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  select * into r from public.nauka_gry g where g.id = p_run and g.user_id = auth.uid() for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'bad_run'); end if;
  if r.status <> 'trwa' then return jsonb_build_object('ok', false, 'code', 'already_finished'); end if;
  v_s := extract(epoch from (now() - r.start));
  if p_wynik is null or p_wynik < 0 or p_wynik > 100000 then v_status := 'podejrzana'; v_powod := 'wynik spoza zakresu'; end if;
  if v_status = 'ok' and p_czas_ms is not null and p_czas_ms > v_s * 1000 + 5000 then
    v_status := 'podejrzana'; v_powod := 'czas z przeglądarki dłuższy niż na serwerze';
  end if;
  if v_status = 'ok' then
    v_max := case r.gra
      when 'frun'    then ceil(v_s * 1.1)::int + 3       -- max ~1,05 kolumny/s przy prędkości 220 i odstępie 210
      when 'przejdz' then ceil(v_s * 5)::int + 5         -- max ~5 skoków/s
      when 'pary'    then 10 end;                          -- największa plansza 5×4 = 10 par
    if p_wynik > v_max then v_status := 'podejrzana'; v_powod := format('wynik %s > możliwe %s w %ss', p_wynik, v_max, round(v_s)); end if;
    if r.gra = 'pary' and p_wynik > 0 and v_s < p_wynik * 1.2 then v_status := 'podejrzana'; v_powod := 'plansza za szybko'; end if;
  end if;
  if v_status = 'ok' then
    v_raw := case r.gra
      when 'frun'    then p_wynik / 2
      when 'przejdz' then p_wynik / 5
      when 'pary'    then 2 * p_wynik + case when coalesce(p_bledy, 0) = 0 and p_wynik >= 6 then 10 else 0 end end;
    v_raw := least(v_raw, (c->>'max_wynik_runda')::int);
    if (select count(*) from public.nauka_gry g where g.user_id = auth.uid() and g.gra = r.gra and g.status = 'ok' and g.pkt > 0
          and g.start >= (public.nauka_dzis()::timestamp at time zone 'Europe/Warsaw')) < (c->>'rundy_z_pkt_dzien')::int then
      v_pkt := public.nauka_rp_dodaj(auth.uid(), 'wynik', 'r:' || r.id::text, r.sid, v_raw, r.id);
    end if;
  end if;
  select max(g.wynik) into v_rekord from public.nauka_gry g
   where g.user_id = auth.uid() and g.gra = r.gra and g.status = 'ok' and g.id <> r.id
     and (r.gra <> 'pary' or g.sid is not distinct from r.sid);
  v_nowy := v_status = 'ok' and p_wynik > coalesce(v_rekord, 0);
  update public.nauka_gry set koniec = now(), wynik = p_wynik, czas_ms = p_czas_ms, bledy = p_bledy,
    status = v_status, powod = v_powod, pkt = v_pkt where id = r.id;
  return jsonb_build_object('ok', true, 'status', v_status, 'pkt', v_pkt,
    'rekord', greatest(coalesce(v_rekord, 0), case when v_status = 'ok' then p_wynik else 0 end), 'nowy_rekord', v_nowy,
    'pkt_runda', (select coalesce(sum(x.pkt), 0) from public.nauka_rp x where x.user_id = auth.uid() and x.run_id = r.id));
end $$;

-- Ranking. p_zakres: 'tydzien' | 'semestr'. p_grupa: null = cały kierunek, albo 'C111'…; p_sid: null = wszystkie przedmioty.
create or replace function public.nauka_ranking(p_zakres text default 'tydzien', p_grupa text default null, p_sid text default null)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  c jsonb := public.nauka_rp_cfg();
  v_d date := public.nauka_dzis();
  v_od date; v_do date; me public.nauka_profil; v_moje int; v_out jsonb;
  v_w_grupie boolean := p_grupa is null or public.nauka_rp_grupa(auth.uid()) = p_grupa;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_platny() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  if p_zakres = 'semestr' then v_od := (c->>'semestr_od')::date; v_do := v_d;
  else v_od := public.nauka_tydzien(v_d); v_do := v_od + 6; end if;
  select * into me from public.nauka_profil where user_id = auth.uid();
  select coalesce(sum(r.pkt), 0) into v_moje from public.nauka_rp r
   where r.user_id = auth.uid() and r.dzien between v_od and v_do and (p_sid is null or r.sid = p_sid);

  with suma as (
    select r.user_id, sum(r.pkt)::int pkt from public.nauka_rp r
     where r.dzien between v_od and v_do and (p_sid is null or r.sid = p_sid)
     group by r.user_id),
  widoczni as (
    select s.user_id, p.nick, s.pkt from suma s join public.nauka_profil p on p.user_id = s.user_id
     where p.w_rankingu and p.nick is not null and s.pkt > 0
       and p.kierunek = coalesce(me.kierunek, c->>'kierunek') and p.rocznik = coalesce(me.rocznik, (c->>'rocznik')::int)
       and (p_grupa is null or public.nauka_rp_grupa(s.user_id) = p_grupa)
       and not exists (select 1 from public.nauka_konta k where k.user_id = s.user_id and k.zablokowane)
       and not ((c->>'ukryj_adminow')::boolean and public.nauka_rp_admin_uid(s.user_id))),
  miejsca as (
    select w.*, rank() over (order by w.pkt desc) miejsce, row_number() over (order by w.pkt desc, lower(w.nick)) lp
      from widoczni w),
  ja as (select * from miejsca where user_id = auth.uid())
  select jsonb_build_object(
    'ok', true, 'zakres', coalesce(p_zakres, 'tydzien'), 'od', v_od, 'do', v_do, 'grupa', p_grupa, 'sid', p_sid,
    'n', (select count(*) from miejsca),
    'top', coalesce((select jsonb_agg(jsonb_build_object('miejsce', m.miejsce, 'nick', m.nick, 'pkt', m.pkt, 'ja', m.user_id = auth.uid()) order by m.lp)
                     from miejsca m where m.lp <= 10), '[]'::jsonb),
    'sasiedzi', coalesce((select jsonb_agg(jsonb_build_object('miejsce', m.miejsce, 'nick', m.nick, 'pkt', m.pkt, 'ja', m.user_id = auth.uid()) order by m.lp)
                          from miejsca m, ja where m.lp between ja.lp - 2 and ja.lp + 2 and ja.lp > 10), '[]'::jsonb),
    -- „ja”: moje miejsce. Gdy jestem ukryty, liczymy, które miejsce bym miał (inni widzą listę bez mnie).
    -- Gdy filtr grupy to nie moja grupa: tylko moje punkty, bez miejsca.
    'ja', jsonb_build_object(
       'pkt', v_moje,
       'widoczny', exists (select 1 from ja),
       'w_grupie', v_w_grupie,
       'miejsce', case when not v_w_grupie then null
                       else coalesce((select miejsce from ja), case when v_moje > 0 then 1 + (select count(*) from miejsca where pkt > v_moje) end) end,
       'z', case when not v_w_grupie then null
                 else (select count(*) from miejsca) + case when exists (select 1 from ja) or v_moje = 0 then 0 else 1 end end)
  ) into v_out;
  return v_out;
end $$;

-- Rekordy gry w tym tygodniu (top 10 widocznych + mój najlepszy wynik).
create or replace function public.nauka_rekordy(p_gra text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare c jsonb := public.nauka_rp_cfg(); v_od timestamptz := (public.nauka_tydzien(public.nauka_dzis())::timestamp at time zone 'Europe/Warsaw');
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_platny() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  return jsonb_build_object('ok', true, 'gra', p_gra,
    'top', coalesce((select jsonb_agg(jsonb_build_object('nick', x.nick, 'wynik', x.wynik, 'ja', x.user_id = auth.uid()) order by x.wynik desc, lower(x.nick))
      from (select g.user_id, p.nick, max(g.wynik) wynik from public.nauka_gry g join public.nauka_profil p on p.user_id = g.user_id
             where g.gra = p_gra and g.status = 'ok' and g.start >= v_od and p.w_rankingu and p.nick is not null
               and not ((c->>'ukryj_adminow')::boolean and public.nauka_rp_admin_uid(g.user_id))
             group by g.user_id, p.nick order by max(g.wynik) desc, lower(p.nick) limit 10) x), '[]'::jsonb),
    'moj_tydzien', (select max(g.wynik) from public.nauka_gry g where g.user_id = auth.uid() and g.gra = p_gra and g.status = 'ok' and g.start >= v_od),
    'moj_rekord',  (select max(g.wynik) from public.nauka_gry g where g.user_id = auth.uid() and g.gra = p_gra and g.status = 'ok'));
end $$;

-- „Jak radzi sobie kierunek”: dane zbiorcze, bez osób. Przedmiot / materiał pokazujemy dopiero przy ≥ min_osob_stat osobach.
create or replace function public.nauka_kierunek_stat() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  c jsonb := public.nauka_rp_cfg();
  v_t date := public.nauka_tydzien(public.nauka_dzis());
  v_od timestamptz := (v_t::timestamp at time zone 'Europe/Warsaw');
  v_min_o int := (c->>'min_osob_stat')::int; v_min_a int := (c->>'min_odp_stat')::int;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_platny() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  return jsonb_build_object('ok', true, 'tydzien', v_t,
    'aktywni', (select count(distinct r.user_id) from public.nauka_rp r where r.tydzien = v_t),
    'przedmioty', coalesce((
      select jsonb_agg(jsonb_build_object('sid', x.sid, 'proc', x.proc, 'proc_poprz', x.proc_poprz, 'osob', x.osob, 'odp', x.odp, 'moj_proc', x.moj_proc,
                                          'lepiej_niz', x.lepiej_niz) order by x.proc)
      from (
        select o.sid,
               round(100.0 * avg((o.ok)::int) filter (where o.created_at >= v_od))::int proc,
               round(100.0 * avg((o.ok)::int) filter (where o.created_at < v_od))::int proc_poprz,
               count(distinct o.user_id) filter (where o.created_at >= v_od) osob,
               count(*) filter (where o.created_at >= v_od) odp,
               round(100.0 * avg((o.ok)::int) filter (where o.created_at >= v_od and o.user_id = auth.uid()))::int moj_proc,
               -- odsetek osób z niższą skutecznością niż moja w tym tygodniu (tylko gdy mam ≥ 10 odpowiedzi)
               (select round(100.0 * count(*) filter (where u.p < m.p) / nullif(count(*), 0))::int
                  from (select o2.user_id, avg((o2.ok)::int) p from public.nauka_odp o2
                         where o2.sid = o.sid and o2.created_at >= v_od group by o2.user_id having count(*) >= 10) u,
                       (select avg((o3.ok)::int) p from public.nauka_odp o3
                         where o3.sid = o.sid and o3.created_at >= v_od and o3.user_id = auth.uid() having count(*) >= 10) m) lepiej_niz
          from public.nauka_odp o
         where o.created_at >= v_od - interval '7 days' and o.sid is not null
         group by o.sid
        having count(distinct o.user_id) filter (where o.created_at >= v_od) >= v_min_o
           and count(*) filter (where o.created_at >= v_od) >= v_min_a) x), '[]'::jsonb),
    'trudne', coalesce((
      select jsonb_agg(jsonb_build_object('mid', y.mid, 'sid', y.sid, 'proc', y.proc, 'odp', y.odp) order by y.proc)
      from (select o.mid, max(o.sid) sid, round(100.0 * avg((o.ok)::int))::int proc, count(*) odp
              from public.nauka_odp o where o.created_at >= v_od - interval '7 days'
             group by o.mid having count(*) >= v_min_a and count(distinct o.user_id) >= v_min_o
             order by avg((o.ok)::int) limit 5) y), '[]'::jsonb));
end $$;

-- Starosta: statystyki gier, podejrzane rundy, pseudonimy do ewentualnej moderacji.
create or replace function public.nauka_admin_gry() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_t date := public.nauka_tydzien(public.nauka_dzis());
begin
  if not public.nauka_admin() then return jsonb_build_object('ok', false, 'code', 'not_admin'); end if;
  return jsonb_build_object('ok', true,
    'aktywni_tydzien', (select count(distinct user_id) from public.nauka_rp where tydzien = v_t),
    'widoczni', (select count(*) from public.nauka_profil where w_rankingu),
    'rundy_tydzien', (select jsonb_object_agg(gra, n) from (select gra, count(*) n from public.nauka_gry
                       where start >= (v_t::timestamp at time zone 'Europe/Warsaw') group by gra) z),
    'podejrzane', coalesce((select jsonb_agg(jsonb_build_object('run', g.id, 'email', u.email, 'nick', p.nick, 'gra', g.gra, 'wynik', g.wynik,
                       'czas_s', round(extract(epoch from (g.koniec - g.start))), 'powod', g.powod, 'start', g.start) order by g.start desc)
                       from public.nauka_gry g left join auth.users u on u.id = g.user_id left join public.nauka_profil p on p.user_id = g.user_id
                      where g.status = 'podejrzana' and g.start > now() - interval '14 days'), '[]'::jsonb),
    'pseudonimy', coalesce((select jsonb_agg(jsonb_build_object('user_id', p.user_id, 'nick', p.nick, 'w_rankingu', p.w_rankingu, 'email', u.email) order by lower(p.nick))
                       from public.nauka_profil p left join auth.users u on u.id = p.user_id where p.nick is not null), '[]'::jsonb));
end $$;

-- Starosta: usuwa pseudonim (np. obraźliwy). Osoba znika z rankingu, dopóki nie ustawi nowego.
create or replace function public.nauka_admin_nick_usun(p_user uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if not public.nauka_admin() then return jsonb_build_object('ok', false, 'code', 'not_admin'); end if;
  update public.nauka_profil set nick = null, w_rankingu = false, nick_zmiana = null, updated_at = now() where user_id = p_user;
  return jsonb_build_object('ok', found);
end $$;

-- =====================================================================
-- 5) Uprawnienia
-- =====================================================================
-- Supabase domyślnie daje anon/authenticated prawo do każdej nowej funkcji – odbieramy wszystkim (jak w v12)
revoke execute on function
  public.nauka_rp_cfg(), public.nauka_dzis(), public.nauka_tydzien(date), public.nauka_rp_mozna(), public.nauka_rp_pula(text),
  public.nauka_rp_dodaj(uuid, text, text, text, int, uuid), public.nauka_rp_za_szybko(uuid), public.nauka_rp_sid(text),
  public.nauka_rp_runda_pytanie(uuid), public.nauka_rp_admin_uid(uuid), public.nauka_rp_grupa(uuid), public.nauka_nick_ok(text),
  public.nauka_profil_moj(), public.nauka_profil_ustaw(text, boolean), public.nauka_gra_start(text, text),
  public.nauka_rp_odpowiedz(text, int, int, text, uuid), public.nauka_rp_zadanie(text, text, int, numeric, text, uuid),
  public.nauka_rp_powtorka(text), public.nauka_rp_lekcja(text), public.nauka_gra_koniec(uuid, int, int, int),
  public.nauka_ranking(text, text, text), public.nauka_rekordy(text), public.nauka_kierunek_stat(),
  public.nauka_admin_gry(), public.nauka_admin_nick_usun(uuid)
from public, anon, authenticated;

-- …i dajemy z powrotem tylko to, co woła strona
grant execute on function
  public.nauka_profil_moj(), public.nauka_profil_ustaw(text, boolean), public.nauka_gra_start(text, text),
  public.nauka_rp_odpowiedz(text, int, int, text, uuid), public.nauka_rp_zadanie(text, text, int, numeric, text, uuid),
  public.nauka_rp_powtorka(text), public.nauka_rp_lekcja(text), public.nauka_gra_koniec(uuid, int, int, int),
  public.nauka_ranking(text, text, text), public.nauka_rekordy(text), public.nauka_kierunek_stat(),
  public.nauka_admin_gry(), public.nauka_admin_nick_usun(uuid)
to authenticated;

notify pgrst, 'reload schema';
```
## 4. Etap 0: API w przeglądarce (`skrot-supabase.js` → `window.skrot.rp`)
Jeden obiekt z cienkimi opakowaniami na RPC. Dopisz go obok `skrot.mojeStan` / `skrot.mojeStart` (ok. linii 252), tym samym stylem. Żadna inna część strony nie woła tych RPC bezpośrednio.
```
// ---------- Gry i ranking (skrot-v13-gry.sql) ----------
// Każda funkcja zwraca obiekt z bazy ({ ok: true, … } albo { ok: false, code }).
// Brak bazy v13 → { ok: false, code: "not_enabled" }; brak sieci → { ok: false, code: "offline" }.
const rpCall = async (fn, args) => {
  await ready;
  if (!sb) return { ok: false, code: "offline" };
  try {
    const { data, error } = await sb.rpc(fn, args || {});
    if (error) {
      if (error.code === "PGRST202" || /does not exist/i.test(error.message || "")) return { ok: false, code: "not_enabled" };
      return { ok: false, code: error.code || "error" };
    }
    return data || { ok: false, code: "empty" };
  } catch { return { ok: false, code: "offline" }; }
};
skrot.rp = {
  profil:   ()                       => rpCall("nauka_profil_moj"),
  ustaw:    ({ nick = null, widoczny = null } = {}) => rpCall("nauka_profil_ustaw", { p_nick: nick, p_w_rankingu: widoczny }),
  start:    (gra, sid = null)        => rpCall("nauka_gra_start", { p_gra: gra, p_sid: sid }),
  odp:      ({ mid, idx, wybor, zrodlo, run = null }) => rpCall("nauka_rp_odpowiedz", { p_mid: mid, p_idx: idx, p_wybor: wybor, p_zrodlo: zrodlo, p_run: run }),
  zadanie:  ({ mid, wid, j, wynik, zrodlo, run = null }) => rpCall("nauka_rp_zadanie", { p_mid: mid, p_wid: String(wid), p_j: j, p_wynik: wynik, p_zrodlo: zrodlo, p_run: run }),
  powtorka: (klucz)                  => rpCall("nauka_rp_powtorka", { p_klucz: klucz }),
  lekcja:   (lid)                    => rpCall("nauka_rp_lekcja", { p_lid: lid }),
  koniec:   ({ run, wynik, czasMs, bledy = 0 }) => rpCall("nauka_gra_koniec", { p_run: run, p_wynik: wynik, p_czas_ms: czasMs, p_bledy: bledy }),
  ranking:  ({ zakres = "tydzien", grupa = null, sid = null } = {}) => rpCall("nauka_ranking", { p_zakres: zakres, p_grupa: grupa, p_sid: sid }),
  rekordy:  (gra)                    => rpCall("nauka_rekordy", { p_gra: gra }),
  stat:     ()                       => rpCall("nauka_kierunek_stat"),
  admin:    ()                       => rpCall("nauka_admin_gry"),
  nickUsun: (userId)                 => rpCall("nauka_admin_nick_usun", { p_user: userId }),
};
```
`sb` w tym pliku wysyła już nagłówek `x-skrot-device`, więc `nauka_platny()` działa bez dodatkowej pracy.
Odpowiedzi – przykłady (dokładnie z testów):
| Wywołanie | Odpowiedź |
| `odp({ mid:"m1", idx:0, wybor:1, zrodlo:"quiz" })` | `{ ok: true, poprawna: true, correct: 1, pkt: 10 }` |
| to samo drugi raz tego dnia | `{ ok: true, poprawna: true, correct: 1, pkt: 0 }` |
| `zadanie({ mid:"m1", wid:"w1", j:0, wynik:251, zrodlo:"quiz" })` | `{ ok: true, poprawna: true, wynik: 250, pkt: 20 }` |
| `start("frun","makroekonomia")` | `{ ok: true, run: "<uuid>", seed: 123456789 }` |
| `koniec({ run, wynik: 40, czasMs: 58000 })` | `{ ok: true, status: "ok", pkt: 20, rekord: 40, nowy_rekord: true, pkt_runda: 20 }` |
| `koniec` z niemożliwym wynikiem | `{ ok: true, status: "podejrzana", pkt: 0, … }` |
| `ranking()` | `{ ok, zakres, od, do, n, top: [{ miejsce, nick, pkt, ja }], sasiedzi: […], ja: { pkt, widoczny, w_grupie, miejsce, z } }` |
| `stat()` | `{ ok, tydzien, aktywni, przedmioty: [{ sid, proc, proc_poprz, osob, odp, moj_proc, lepiej_niz }], trudne: [{ mid, sid, proc, odp }] }` |
Kody błędów i co pokazać (polskie teksty + EN do słownika):
| `code` | Kiedy | Tekst na ekranie |
| `not_enabled` | SQL v13 nieuruchomiony | „Gry i ranking nie są jeszcze włączone na serwerze.” |
| `offline` | brak sieci | „Brak połączenia. Grasz dalej, ale punkty rankingu się nie zapiszą.” |
| `no_access` | darmowe konto / inne urządzenie | ekran blokady z przyciskiem „Kup dostęp” (`window.skrot.buy()`) |
| `too_many_runs` | > 40 rund dziennie | „Na dziś wystarczy grania. Wróć jutro albo zrób Powtórki.” |
| `too_fast` | > 20 odpowiedzi/min | nic nie pokazuj; ta odpowiedź po prostu nie daje punktów |
| `bad_run` | runda zamknięta / > 12 pytań | nic nie pokazuj (punkty tylko lokalnie nie wpadną) |
| `nick_dlugosc` | < 3 lub > 20 znaków | „Pseudonim: od 3 do 20 znaków.” |
| `nick_znaki` | niedozwolone znaki | „Dozwolone: litery, cyfry, spacja, _ . -” |
| `nick_zastrzezony` | zakazane słowo | „Ten pseudonim jest niedozwolony. Wybierz inny.” |
| `nick_zajety` | ktoś już ma | „Ten pseudonim jest zajęty.” |
| `nick_za_wczesnie` | zmiana < 7 dni | „Pseudonim zmienisz od {data}.” (`od` z odpowiedzi, `fmtDate`) |
| `nick_brak` | widoczność bez pseudonimu | „Najpierw wybierz pseudonim.” |
Zasada dla gier: przeglądarka sprawdza odpowiedź sama (ma `correct` z treści materiału) i od razu pokazuje wynik oraz wskrzesza gracza. Wywołanie `rp.odp` / `rp.zadanie` idzie w tle i tylko dolicza punkty rankingu (odpowiedź z bazy sumujemy w `run.pkt`). Gra nigdy nie czeka na bazę z decyzją o wskrzeszeniu.
Wpięcia punktów poza grami (etap 0, w index.html):
1. Quiz – w `quizSource` dodaj hak `onCard(card)`. Odtwarzacz woła go po każdej ocenionej odpowiedzi (`lpAward`, linia ~5684). `LP.st.ans[card.id]` trzyma już indeks w oryginalnej kolejności opcji (tak samo porównuje go `onFinish` z `x.correct`), więc `wybor = LP.st.ans[card.id]`. Pytanie to `qs[+card.id.slice(1)]`. Wysyłaj tylko pierwszą odpowiedź na kartę (zbiór `sent` w domknięciu `quizSource`), żeby druga szansa w quizie nie wysyłała drugiego wywołania. Pomiń pytania bez `materialId` i z materiałów `isMine`. Wywołanie: `window.skrot.rp?.odp({ mid: q.materialId, idx: q.index, wybor, zrodlo: "quiz" })`.
2. Zadania krok po kroku – w `simBox` → `check()`: gdy `numMatch` zwróci `true` lub `false` (nie `null`) i materiał nie jest `isMine`, wołaj `rp.zadanie({ mid: m.id, wid: w.id, j, wynik: parseNum(z.val), zrodlo: "quiz" })` – tylko przy pierwszej próbie danego zadania w tej sesji (`z.sent = true`).
3. Powtórki – w `rvGrade(g)` po `srsGrade`: `rp.powtorka(card.key)`.
4. Lekcje – w `lpFinishLesson()`, gdy bilet zdany (`ok === true`): `rp.lekcja(m.id)`.
Wszystkie cztery: bez `await`, bez toastów, `.catch(() => {})`. Gdy `window.skrot.rp` nie istnieje albo konto nie jest `PAID()`, nie wołaj.
## 5. Etap 1a: rdzeń `gry.js` i Druga szansa
### 5.1 Ładowanie i kontrakt z `index.html`
`gry.js` to zwykły skrypt (nie moduł) w katalogu głównym. Ładuje go `index.html` dopiero przy pierwszym wejściu w grę:
```
// index.html
let gryP = null;
function loadGry() {
  return gryP ||= new Promise((ok, err) => {
    const s = document.createElement("script"); s.src = "gry.js?v=20261101-1"; s.onload = () => ok(window.SKROT_GRY); s.onerror = () => { gryP = null; err(); };
    document.head.append(s);
  });
}
async function grajOpen(gra, opts = {}) {   // opts: { sid, trudnosc, tryb } — tryb tylko dla Par
  try { const G = await loadGry(); G.open(gra, { ...opts, api: GRY_API }); }
  catch { toast("Nie udało się wczytać gry. Sprawdź połączenie."); }
}
```
`gry.js` nie sięga do zmiennych `index.html`. Wszystko, czego potrzebuje, dostaje w obiekcie `GRY_API` (definiuje go `index.html`, raz, obok `grajOpen`):
| Pole `GRY_API` | Co to jest |
| `h, toast, modal, icon` | istniejące pomocniki UI |
| `T(s)` | `window.SKROT_I18N?.t?.(s) ?? s` – tłumaczenie tekstu rysowanego na canvasie |
| `EN` | `true` w wersji angielskiej |
| `reduced()` | `lpReduced` |
| `confetti(n), banner(t), buzz(ok)` | `lpConfetti`, `lpBanner`, `lpBuzz` |
| `xp(n)` | `xpFlush(xpTake("games", n))`; dopisz `games: 30` do `XP_CAP` |
| `subjects()` | `SUBJECTS.map(s => ({ id: s.id, name: EN && s.en ? s.en : s.pl, color: s.color }))` |
| `defaultSid()` | przedmiot z najbliższym zaliczeniem: najmniejsza data z `nextExam(s.id)` po wszystkich `SUBJECTS`, a przy braku – ostatnio otwarty przedmiot albo `null` (Mix) |
| `questions(sid, n)` | Promise → tablica pytań do rundy (5.3) |
| `tasks(sid, n)` | Promise → zadania liczbowe (5.3) |
| `pairs(sid, n, tryb)` | Promise → pary do Par (sekcja 8) |
| `onWrong(q)` | po złej odpowiedzi: fiszki tego materiału do Powtórek (5.4) |
| `replayWrong(qs)` | otwiera zwykły quiz z pomylonych: `quizOpen(qs, "gry:" + Date.now(), { title: "Pomylone w grze", save: false, noXp: true })` |
| `rp` | `window.skrot.rp` |
| `css(name)` | `getComputedStyle(document.documentElement).getPropertyValue(name).trim()` |
| `close()` | po zamknięciu gry: `render()` (odświeża rekord na kafelku) |
### 5.2 Budowa `gry.js`
```
(() => {
  const GRY_CFG = { /* sekcja 2 */ };
  const GAMES = { frun: FRUN, przejdz: PRZEJDZ, pary: PARY };     // obiekty gier (sekcje 6, 8, 9)
  let A = null;                                                  // GRY_API z open()
  const run = { /* stan bieżącej rundy, 5.5 */ };
  window.SKROT_GRY = { open, cfg: GRY_CFG };
})();
```
Interfejs gry na canvasie (Fruń, Przejdź) – każda gra to obiekt:
```
{
  id: "frun", title: "Fruń", revive: true,
  init(ctx),            // ctx = { W, H, rnd, cfg, colors } – raz na rundę; rnd = generator z seeda bazy
  update(dt, input),    // dt = GRY_CFG.step; input = { tap, left, right, up, down } (zdarzenia od ostatniego kroku)
  draw(g, alpha),       // g = CanvasRenderingContext2D w jednostkach logicznych; alpha = ułamek kroku do płynnego rysowania
  score(),              // bieżący wynik (liczba całkowita)
  dead(),               // true = gracz właśnie zginął (rdzeń przechodzi do Drugiej szansy)
  deathText(),          // np. "Zderzenie z książkami"
  revive(),             // przywraca gracza (sekcja gry mówi jak); po tym rdzeń włącza nietykalność invulnSec
  wantsQuestion(),      // tylko Przejdź: true, gdy gracz wszedł na bramkę (pytanie bez śmierci)
}
```
Generator losowy: `mulberry32(seed)` z seeda z `rp.start` (offline: `Date.now() | 0`). Wszystko losowe w grze (przeszkody, pasy, pary) idzie z `ctx.rnd()`, nigdy z `Math.random()` – runda jest odtwarzalna z seeda przy szukaniu błędów.
Pętla: `requestAnimationFrame`, akumulator czasu, krok fizyki `GRY_CFG.step`, najwyżej `maxSteps` kroków na klatkę (po powrocie do karty nie przewijamy minut). Pauza: `visibilitychange` (karta schowana) → stan `pauza`, ekran „Pauza – dotknij, żeby grać dalej”; to samo przycisk ⏸ w rogu i klawisz `P`/`Escape`.
Canvas: jeden `<canvas>` na całą nakładkę, `width = cssW * dpr`, `dpr = Math.min(devicePixelRatio, GRY_CFG.dprMax)`; świat ma szerokość `W = 360` jednostek, wysokość `H = 360 * cssH / cssW` (Fruń: H przycięte do zakresu 560–760, reszta to tło nad i pod). `resize` i obrót ekranu przeliczają skalę bez restartu rundy.
Nakładka (DOM): `div.gry` na pełnym ekranie (`position: fixed; inset: 0; z-index` jak `.lp`), `role="dialog"`, `aria-modal="true"`, `aria-label` = nazwa gry. Na górze pasek: ✕ (zamknij, z pytaniem „Przerwać rundę?” gdy trwa), wynik (duża liczba, `aria-live="polite"` aktualizowany co 1 s, nie co klatkę), ⏸, 🔇/🔊. Klasa `lp-lock` na `<html>` jak w odtwarzaczu (blokuje przewijanie strony). Przycisk Wstecz w telefonie: `history.pushState({ gry: 1 })` przy otwarciu, `popstate` = jak ✕.
Dźwięk: domyślnie wyłączony (`localStorage["bm-gry-dzwiek"]`). Trzy krótkie dźwięki z WebAudio (bez plików): skok/krok, punkt, zderzenie.
### 5.3 Pytania do rundy
`questions(sid, n)` w `index.html`:
1. Materiały: `sid` ? `materialsOf(sid)` : wszystkie `S.materials`; filtr `readable(m) && !isMine(m) && !isLesson(m)` oraz lekcje v2 z `quiz` (lekcje też mają `materialContent.quiz` – sprawdź; jeśli tak, wchodzą).
2. Treść: `loadContents(ms)` (istniejąca funkcja) → pytania `{ ...q, materialId: m.id, index: i }` z `c.quiz`; odrzuć pytania z `options.length < 2`.
3. Kolejność: najpierw pytania z listy „pomylone” (`localStorage["bm-gry-zle"]`, max 200 kluczy `mid:idx` z datą; bierz te sprzed ≥ 1 dnia), potem pytania z materiałów w zakresie najbliższego zaliczenia (`scopeOf(sid, nextExam(sid)?.part)`), potem reszta. W każdej grupie tasowanie `lpShuffle(…, seed)`.
4. Zwróć `n` pytań, bez powtórzeń w rundzie. Dla Mix: max 3 pytania z jednego materiału.
5. Pobierz „Dlaczego?”: `Promise.all(mids.map(getWhy))` przed startem, żeby nakładka miała `why` od razu.
Przedmiot z mniej niż `GRY_CFG.minQuestions` (20) pytaniami jest na ekranie wyboru wyszarzony z dopiskiem „za mało pytań (12/20)”.
`tasks(sid, n)`: z tych samych materiałów `c.worked[].similar[j]` z `typeof s.result === "number"` → `{ mid, wid: w.id, j, task: s.task, unit: s.unit, result: s.result, tol: s.tol }`. Brak zadań → pusta tablica (wtedy druga Druga szansa to trudniejsze ABCD, 5.4).
### 5.4 Druga szansa – zachowanie
Stan nakładki: `ukryta → pytanie → odpowiedz → (ok: wracam | zle: koniec)`. Rdzeń ją otwiera, gdy `game.dead()` i `run.revives < 2`; przy trzeciej śmierci od razu ekran wyniku.
|  | 1. śmierć | 2. śmierć |
| Typ | ABCD (lub prawda/fałsz, gdy 2 opcje) | zadanie liczbowe; gdy brak – ABCD z innego materiału, nagłówek „Trudniejsze pytanie” |
| Czas | 20 s | 60 s |
| Nagłówek | „Druga szansa · 1/2” | „Ostatnia szansa · 2/2” |
| Dobra odpowiedź | wskrzeszenie, +5 ⚡, w tle `rp.odp` | wskrzeszenie, +5 ⚡, w tle `rp.zadanie` |
| Zła / koniec czasu | koniec rundy | koniec rundy |
Wygląd (styl lekcji v3, komponenty sk-* / lp-*): gra zamarza, canvas dostaje `filter: blur(3px) saturate(.6)` (bez blura przy `reduced()`), od dołu wjeżdża karta (`sk-sheet`, 240 ms): pasek czasu na górze (zielony → bursztynowy przy 25% → czerwony przy 10%), nazwa przedmiotu jako `sk-chip`, treść pytania (`translate="no"`), opcje jako duże przyciski 56 px z literami A–D (klawisze 1–4 i A–D), pod spodem link „Zakończ rundę”. Opcje tasowane `lpShuffle` z seedem rundy; do bazy idzie indeks oryginalny.
Zadanie: treść (`translate="no"`), pole liczbowe `inputmode="decimal"` z jednostką w placeholderze, przycisk „Sprawdź” (Enter). Sprawdzanie `numMatch` po stronie strony (przekaż do `gry.js` funkcję `A.numMatch`). Puste/niezrozumiałe → komunikat „Wpisz liczbę” bez zużycia próby.
Po odpowiedzi (karta zostaje, 1 kliknięcie):
- dobrze: zielony kolor opcji, `buzz(true)`, tekst „Dobrze! Grasz dalej.”, jedno zdanie „Dlaczego?” (`lpFirstSentence(why)`), przycisk „Graj dalej” (autofocus). Po kliknięciu karta zjeżdża, gra wraca w stanie „Dotknij, żeby grać dalej” (nie rusza sama).
- źle: wybrana na czerwono, poprawna na zielono, „To nie to. Poprawna: B.”, zdanie „Dlaczego?”, przycisk „Zobacz wynik”. Wywołaj `A.onWrong(q)` – fiszki tego materiału trafiają do Powtórek: `srsAdd((c.flashcards || []).map(f => cardKey(mid, f)))`, najwyżej 5 kart z jednego materiału; klucz `mid:idx` dopisz do `bm-gry-zle`.
- koniec czasu = źle, z tekstem „Czas minął.”
Dostępność: karta `role="dialog"`, fokus na pierwszej opcji, `aria-live="assertive"` dla werdyktu, pozostały czas czytany co 5 s (`aria-live="polite"`), cały canvas `aria-hidden="true"`.
### 5.5 Runda – stan i koniec
```
run = { gra, sid, id: null /* z rp.start */, seed, t0: performance.now(), revives: 0, asked: [], wrong: [], okN: 0, pkt: 0, xp: 0, offline: false }
```
- Start: `rp.start(gra, sid)`. `ok:false` z `no_access` → ekran blokady; `not_enabled`/`offline` → gra działa, `run.offline = true`, na ekranie wyniku „Punkty rankingu się nie zapisały”. `too_many_runs` → komunikat z tabeli w sekcji 4, gra się nie zaczyna.
- Koniec: `rp.koniec({ run: run.id, wynik, czasMs: performance.now() - run.t0 })`, potem ekran wyniku. Zamknięcie ✕ w trakcie rundy też wysyła `koniec` z bieżącym wynikiem.
- Rekord lokalny: `localStorage["bm-gry-rekord:" + gra]` (dla Par: `+ ":" + sid + ":" + trudnosc`) – pokazywany od razu, zanim odpowie baza.
Ekran wyniku (ten sam dla wszystkich gier, wzór jak ekran końcowy talii `done(st)`):
```
          🏆 Nowy rekord!            (tylko gdy nowy; confetti 40)
               27                    (wynik, sk-bignum)
        kolumn · rekord 31
 ┌─────────┬──────────────┬─────────┐
 │ 2/2     │ +34          │ +10 ⚡   │
 │ dobrze  │ pkt rankingu │ XP      │
 └─────────┴──────────────┴─────────┘
 Do powtórki: Elastyczność cenowa popytu →   (pierwsze pomylone pytanie → materiał)
 [ Jeszcze raz ]  [ Powtórz pomylone (1) ]  Wróć
```
„pkt rankingu” = suma `pkt` z `rp.odp`/`rp.zadanie` w tej rundzie + `pkt` z `rp.koniec`. Gdy dzienny limit z gier jest już wyczerpany (wszystkie odpowiedzi `pkt: 0` mimo `poprawna: true`), pod liczbą mała linia „Dzisiejszy limit punktów z gier wyczerpany – nauka dalej się liczy w Powtórkach i quizach.”
### 5.6 Teksty Drugiej szansy (PL → EN)
| PL | EN |
| Druga szansa · 1/2 | Second chance · 1/2 |
| Ostatnia szansa · 2/2 | Last chance · 2/2 |
| Trudniejsze pytanie | Harder question |
| Zakończ rundę | End the round |
| Dobrze! Grasz dalej. | Correct! Keep playing. |
| To nie to. Poprawna: {0}. | Not quite. Correct: {0}. |
| Czas minął. | Time's up. |
| Graj dalej | Keep playing |
| Zobacz wynik | See your score |
| Wpisz liczbę | Enter a number |
| Sprawdź | Check |
| Dotknij, żeby grać dalej | Tap to keep playing |
| Pauza – dotknij, żeby grać dalej | Paused – tap to keep playing |
| Przerwać rundę? | End this round? |
| Nowy rekord! | New record! |
| pkt rankingu | ranking pts |
| Do powtórki: | To review: |
| Jeszcze raz | Play again |
| Powtórz pomylone ({0}) | Review mistakes ({0}) |
| Punkty rankingu się nie zapisały | Ranking points weren't saved |
| Dzisiejszy limit punktów z gier wyczerpany – nauka dalej się liczy w Powtórkach i quizach. | Today's game points limit is reached – learning still counts in Reviews and quizzes. |
## 6. Etap 1b: ekran Graj i Fruń
### 6.1 Widok `gry` (`#/gry`) w `index.html`
Dopisz `gry: viewGames` do mapy w `render()`. Bez szóstej zakładki w nawigacji – wejścia opisuje 6.4.
```
← Powtórki
Graj i powtarzaj                                   (h1, falka jak na innych ekranach)
Każda porażka to pytanie z przedmiotu. Dobra odpowiedź = grasz dalej.

Przedmiot:  [ Makroekonomia ▾ ]   (domyślnie A.defaultSid(); opcja „Mix – wszystko”)
            egzamin za 9 dni · 64 pytania

┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│  🍃 Fruń             │ │  🃏 Pary             │ │  🚶 Przejdź          │
│  Leć między półkami  │ │  Dopasuj pojęcia     │ │  Przejdź przez       │
│  z książkami.        │ │  EN–PL i definicje.  │ │  Cukrową.            │
│  rekord 31 · ok. 2 min│ │  najlepiej 0 błędów  │ │  wkrótce             │
│  [ Graj ]            │ │  [ Graj ]            │ │                      │
└──────────────────────┘ └──────────────────────┘ └──────────────────────┘

Rekordy tygodnia (Fruń)   1. Łoś Ania 40 · 2. Cela 31 · … Ty: 27      (z rp.rekordy, od etapu 2)
```
- Kafelki `sk-card`, ilustracja z istniejącego `ART` albo prosty SVG w tym samym stylu (obrys `#0E5A30`, wypełnienia z palety). Gra jeszcze niezbudowana → kafelek z chipem „wkrótce”, bez przycisku.
- Wybór przedmiotu: `<select>` z `A.subjects()`; przedmiot z < 20 pytaniami: `disabled` + „(za mało pytań)”. Zapamiętaj wybór w `localStorage["bm-gry-sid"]`.
- Niezalogowany / bez dostępu: zamiast kafelków `paywallCard(null)` (istniejąca) z tekstem „Gry są w pełnym dostępie.”; wyjątek – etap 5 (demo).
- Starosta z wyłączonym trybem starosty widzi to samo co student.
### 6.2 Fruń – zasady
Gracz steruje zielonym listkiem z logo Skrót BM (własny rysunek: liść jak w `ART` – `a-leaf`, z kropką-okiem). Listek leci w prawo między pionowymi półkami z książkami (kolumny z przerwą). Dotknięcie / spacja / strzałka w górę / kliknięcie = podskok.
| Parametr | Wartość (z `GRY_CFG.frun`) |
| Grawitacja | 1500 j/s² w dół; prędkość spadania max 700 j/s |
| Podskok | prędkość ustawiana na −440 j/s (nie dodawana) |
| Pozycja listka | x = 100, start y = środek pola gry |
| Kolizja | koło r = 12 (rysunek ma 14 – gra wybacza) |
| Kolumny | szerokość 64, odstęp między kolumnami 210 (od krawędzi do krawędzi) |
| Przerwa w kolumnie | 170 na start, −4 co 10 kolumn, min 130 |
| Prędkość przesuwu | 140 j/s, +8 co 10 kolumn, max 220 |
| Środek przerwy | losowo w [margin, H − ground − margin], margin 110; zmiana względem poprzedniej najwyżej ±180 |
| Podłoga | pas 80 j na dole (chodnik); dotknięcie = śmierć |
| Sufit | nie zabija: listek zatrzymuje się na górnej krawędzi, prędkość 0 |
| Punkt | +1, gdy prawa krawędź kolumny minie x listka |
Stany: `gotowy` (listek unosi się sinusoidą ±6 j, napis „Dotknij, żeby lecieć”) → `gra` → `smierc` (600 ms: listek obraca się w dół i spada; wstrząs ekranu 4 j przez 200 ms, bez wstrząsu przy `reduced()`) → Druga szansa albo ekran wyniku.
Wskrzeszenie (revive): usuń kolumny, których lewa krawędź jest bliżej niż 220 j przed listkiem; listek na środek pola, prędkość 0, kąt 0; stan `gotowy` z napisem „Dotknij, żeby grać dalej”. Po pierwszym dotknięciu 2 s nietykalności: listek miga (alfa 0,4 ↔ 1 co 120 ms; przy `reduced()` zamiast migania obwódka). Wynik zostaje.
Rysowanie (kolejność): tło (`--green-50` + delikatna kratka 24 j jak tło strony), daleki plan: sylwetka budynku Cukrowa 8 przesuwana z prędkością 0,2× (paralaksa; przy `reduced()` stoi), kolumny: półki w `--green-600` z grzbietami książek w kolorach przedmiotów (`A.subjects()` → `color`), listek, podłoga (`--green-200` z kreskami chodnika przesuwanymi z prędkością gry), wynik (pasek DOM, nie canvas). Listek obraca się zgodnie z prędkością: kąt = clamp(vy / 700 × 60°, −25°, 70°).
Pytania w rundzie Fruń: tylko po śmierci (max 2). Rdzeń pobiera na start `questions(sid, 6)` i `tasks(sid, 3)` – zapas na wypadek pominiętych.
Wynik do bazy: `wynik = liczba kolumn`. Kontrola w bazie: ≤ 1,1 × sekundy + 3 (sekcja 3). Nie zmieniaj prędkości ani odstępu bez zmiany tej granicy w SQL.
### 6.3 Teksty Fruń i ekranu Graj (PL → EN)
| PL | EN |
| Graj i powtarzaj | Play and review |
| Każda porażka to pytanie z przedmiotu. Dobra odpowiedź = grasz dalej. | Every crash is a question from your subject. Right answer = keep playing. |
| Przedmiot: | Subject: |
| Mix – wszystko | Mix – everything |
| za mało pytań | not enough questions |
| Fruń | Fly |
| Leć między półkami z książkami. | Fly between the bookshelves. |
| Dotknij, żeby lecieć | Tap to fly |
| Zderzenie z półką | Hit a bookshelf |
| Spadek na chodnik | Hit the pavement |
| kolumn | columns |
| rekord {0} | record {0} |
| wkrótce | coming soon |
| Gry są w pełnym dostępie. | Games are part of full access. |
| Rekordy tygodnia | This week's records |
### 6.4 Wejścia do gier
| Miejsce | Element | Warunek |
| Powtórki (`reviewHome`) | sekcja „Powtarzaj grając” pod przyciskiem Zacznij: 3 małe kafelki → `go({ view: "gry" })` z przewinięciem do gry albo od razu `grajOpen(gra, { sid })` | `PAID()` |
| Dziś (`viewHome`) | jedna linia-karta `sk-row-big`: „Masz 3 minuty? Zagraj z {przedmiot}” → `grajOpen("frun", { sid: defaultSid() })` | `PAID()`, najwyżej raz dziennie (po kliknięciu albo po 3 wyświetleniach znika do jutra: `bm-gry-dzis`) |
| Przedmiot → Ćwicz | przycisk „Zagraj z tym przedmiotem” | ≥ 20 pytań |
| Słowniczek | przycisk „Pary ze słowniczka” (od etapu 3) | ≥ 6 pojęć |
| Więcej → Nauka | wiersz „Graj i powtarzaj” | zawsze |
## 7. Etap 2: Ranking kierunku
Baza jest gotowa od etapu 0 (punkty zbierają się od wydania etapu 1). Ten etap to tylko ekrany.
### 7.1 Widok `ranking` (`#/ranking`)
Dopisz `ranking: viewRanking` do mapy w `render()`. Dane: `rp.profil()`, `rp.ranking({ zakres, grupa, sid })`, `rp.stat()` – pobierane przy wejściu i po zmianie filtra; trzymaj w `S.rank = { profil, lista, stat, filtr, loading }`. Nie odpytuj częściej niż raz na 30 s przy tym samym filtrze.
```
← Więcej
Ranking kierunku                                    Business Management · 1. rok
Tydzień 26.10–1.11                                   [ Tydzień | Semestr ]
[ Cały rok ] [ C111 ] [ C112 ] [ C113 ]             [ Wszystkie przedmioty ▾ ]

┌ Ty ─────────────────────────────────────────────────────────┐
│  #7 z 41 · 340 pkt rankingu                    🏆           │
│  Lepiej niż 83% osób z rankingu · +120 pkt od zeszłego tyg. │
│  Do #6 brakuje Ci 15 pkt – to 2 dobre odpowiedzi.           │
└─────────────────────────────────────────────────────────────┘

 1  Łoś Ania ......................... 610
 2  Kuba_Z ........................... 540
 3  Marta K .......................... 515
 4–10 …
 ⋯
 6  Ola.B ............................ 355
 7  Ty (Bartek) ...................... 340     ← podświetlony wiersz
 8  M.Nowak .......................... 330

Jak radzi sobie kierunek (ten tydzień, 37 aktywnych osób)
 Prawo          ███████████░░░░  72%  (tydz. temu 65%)   Ty 80% · lepiej niż 61%
 Makroekonomia  ████████░░░░░░░  54%                      Ty 48%
 …
Najtrudniejsze w tym tygodniu
 1. Elastyczność cenowa popytu (Makro) · 41% dobrych →    (link do materiału)
 …
```
Szczegóły:
- Przełącznik zakresu `sk-seg` (Tydzień | Semestr). Filtr grupy jako `fchip` (`aria-pressed`); domyślnie „Cały rok”. Filtr przedmiotu `<select>` z `SUBJECTS`.
- Karta „Ty” (`sk-hero`): miejsce `#{ja.miejsce} z {ja.z}` (`ja.miejsce == null` i `ja.pkt == 0` → „Zdobądź pierwsze punkty: zagraj albo zrób quiz.”; `ja.w_grupie === false` → „Nie jesteś w tej grupie” + same punkty). Gdy `ja.widoczny === false`: dopisek „Jesteś ukryty – tak wyglądałoby Twoje miejsce” + przycisk „Pokaż mnie w rankingu”.
- „Lepiej niż X%” = `round(100 × (z − miejsce) / max(1, z − 1))`, pokazuj od `z ≥ 5`.
- „+N od zeszłego tygodnia” = drugi `rp.ranking` z zakresem poprzedniego tygodnia nie istnieje – zamiast tego licz w przeglądarce: zapisuj `localStorage["bm-rank-tydz:" + od] = ja.pkt` przy każdym wejściu; różnica względem poprzedniego zapisanego tygodnia. Brak danych = brak linii.
- „Do #k brakuje Ci N pkt” = różnica do osoby z miejscem `miejsce − 1` (z `top` lub `sasiedzi`), N/10 zaokrąglone w górę → „to {n} dobre odpowiedzi” (`plural`). Nie pokazuj na miejscu 1 ani gdy ukryty.
- Lista: `top` (do 10 wierszy), potem `⋯` i `sasiedzi`, gdy jestem poza top 10. Wiersz `ja: true` podświetlony (`--green-100`, pogrubiony, „Ty” przed pseudonimem). Miejsca 1–3: medal w kolorach `--lime-400` / `--green-200` / `--teal-100` (nie złoto/srebro/brąz – zostajemy w palecie). Remisy: ten sam numer miejsca (z bazy).
- Nigdy nie pokazuj całej listy od końca ani liczby osób „poniżej”.
- „Jak radzi sobie kierunek”: wiersz na przedmiot z `stat.przedmioty` (już przefiltrowane w bazie: ≥ 5 osób, ≥ 20 odpowiedzi), pasek 8 px, procent, poprzedni tydzień szarym. „Ty X%” tylko gdy `moj_proc != null`; „lepiej niż Y%” gdy `lepiej_niz != null`. Brak wierszy → „Za mało danych w tym tygodniu. Statystyki pojawią się, gdy pouczy się co najmniej 5 osób.”
- „Najtrudniejsze”: `stat.trudne` → tytuł z `materialById(mid)`, link `go({ view: "material", id: mid })`; pomiń materiały, których nie ma lokalnie.
- Stan ładowania: szkielet (szare paski), bez spinnera. `not_enabled` → komunikat z sekcji 4. Brak dostępu → `paywallCard`.
### 7.2 Pierwsze wejście: pseudonim i zgoda (opt-in)
Gdy `profil.nick == null`, na górze widoku ranking zamiast karty „Ty” pokaż kartę:
```
Wybierz pseudonim do rankingu
W rankingu widać tylko pseudonim i punkty. Imienia i maila nie pokazujemy nikomu.
[ pseudonim ______________ ]   3–20 znaków
[x] Pokaż mnie w rankingu kierunku   (domyślnie ZAZNACZONE w tym oknie – osoba sama tu przyszła)
[ Zapisz ]   Nie teraz
```
- Podpowiedź pseudonimu: brak (nie proponuj imienia z maila).
- Zapis: `rp.ustaw({ nick, widoczny })`; błędy z tabeli w sekcji 4 pod polem (`aria-describedby`).
- „Nie teraz” → ranking widoczny, osoba ukryta; karta wraca dopiero po kliknięciu „Pokaż mnie w rankingu”.
- Ta karta pojawia się tylko w widoku ranking. Nigdzie indziej nie pytamy o pseudonim.
### 7.3 Ustawienia w Więcej
W grupie „Ty” dodaj wiersz `row("user", "Ranking: pseudonim i widoczność", <opis>, openRankSettings)`; opis: „{nick} · widoczny” / „{nick} · ukryty” / „nie ustawiono”. Okno (`modal`): pole pseudonimu (z informacją „zmiana raz na 7 dni”), przełącznik `role="switch"` „Pokaż mnie w rankingu”, link „Zobacz ranking →”.
W grupie „Nauka” dodaj: `row("spark", "Graj i powtarzaj", "Fruń, Pary, Przejdź", () => go({ view: "gry" }))` i `row("flag", "Ranking kierunku", <"#7 w tym tygodniu" albo "zobacz, jak idzie rokowi">, () => go({ view: "ranking" }))`.
### 7.4 Ekran Dziś
Pod kartą „Twój postęp” jedna linia (nie karta): „🏆 #7 na kierunku w tym tygodniu · 340 pkt →” (klik → ranking). Tylko gdy `ja.miejsce != null` i ranking był pobrany w tej sesji (nie odpytuj bazy tylko dla tej linii: pobierz `rp.ranking()` raz na sesję, leniwie po 3 s od wyrenderowania Dziś).
### 7.5 Panel starosty
W „Tryb starosty” (widoczne przy `S.canEdit`) dodaj wiersz „Gry i ranking” → `modal` z `rp.admin()`:
- liczby: aktywni w tym tygodniu, widoczni w rankingu, rundy w tym tygodniu na grę;
- tabela „Podejrzane rundy (14 dni)”: data, e-mail, pseudonim, gra, wynik, czas, powód;
- lista pseudonimów z przyciskiem „Usuń pseudonim” → `confirm("Usunąć pseudonim {nick}? Osoba zniknie z rankingu, dopóki nie wybierze nowego.")` → `rp.nickUsun(user_id)` → odśwież.
### 7.6 Teksty rankingu (PL → EN)
| PL | EN |
| Ranking kierunku | Programme ranking |
| Tydzień | Week |
| Semestr | Semester |
| Cały rok | Whole year |
| Wszystkie przedmioty | All subjects |
| pkt rankingu | ranking pts |
| Lepiej niż {0}% osób z rankingu | Better than {0}% of the ranking |
| Do #{0} brakuje Ci {1} pkt | {1} pts to #{0} |
| Jesteś ukryty – tak wyglądałoby Twoje miejsce | You're hidden – this is where you'd be |
| Pokaż mnie w rankingu | Show me in the ranking |
| Pokaż mnie w rankingu kierunku | Show me in the programme ranking |
| Wybierz pseudonim do rankingu | Choose a ranking nickname |
| W rankingu widać tylko pseudonim i punkty. Imienia i maila nie pokazujemy nikomu. | The ranking shows only your nickname and points. We never show your name or email. |
| Nie teraz | Not now |
| Zdobądź pierwsze punkty: zagraj albo zrób quiz. | Earn your first points: play or take a quiz. |
| Nie jesteś w tej grupie | You're not in this group |
| Jak radzi sobie kierunek | How the programme is doing |
| Najtrudniejsze w tym tygodniu | Hardest this week |
| Za mało danych w tym tygodniu. Statystyki pojawią się, gdy pouczy się co najmniej 5 osób. | Not enough data this week. Stats appear once at least 5 people have studied. |
| Ranking: pseudonim i widoczność | Ranking: nickname and visibility |
| zmiana raz na 7 dni | can be changed once every 7 days |
| Gry i ranking | Games and ranking |
| Podejrzane rundy | Suspicious rounds |
| Usuń pseudonim | Remove nickname |
## 8. Etap 3: Pary (memory)
Pary to gra w DOM, nie na canvasie (przyciski = dostępność za darmo, tłumaczenie interfejsu działa samo). Używa rdzenia z sekcji 5 (nakładka, pasek, ekran wyniku, `rp.start`/`rp.koniec`), ale nie ma Drugiej szansy – tu uczy samo dopasowywanie.
### 8.1 Treść planszy
`pairs(sid, n, tryb)` w `index.html`:
- `await loadGlossary()` → `GL.terms`; filtr `sid ? t.s.includes(sid) : true`.
- tryb `enpl`: pary `{ a: t.en, b: t.pl }` tylko dla pojęć z `pl`.
- tryb `def`: pary `{ a: t.en, b: firstSentence(t.def, 90) }` tylko dla pojęć z `def`; w wersji EN dla definicji użyj `t.defEn`, gdy jest.
- Odrzuć pary, w których `a` albo `b` > 60 znaków (enpl) / > 90 (def), oraz duplikaty `b`.
- Kolejność: najpierw pojęcia z kluczem w Powtórkach z terminem ≤ dziś (`srsAll()[glKey(sid, t.en)]`), potem losowo `lpShuffle(…, seed)`.
- Każda para niesie `key: glKey(t.s[0], t.en)` i `sid: t.s[0]`.
- Za mało par na wybraną planszę → plansza o rozmiar mniejsza; < 6 par → kafelek wyszarzony „za mało pojęć”.
### 8.2 Zasady
|  | Łatwy | Średni | Trudny |
| Siatka (kolumny × wiersze) | 4 × 3 | 4 × 4 | 5 × 4 |
| Par | 6 | 8 | 10 |
| Na telefonie < 400 px | 3 × 4 | 4 × 4 | 4 × 5 |
1. Karty zakryte (rewers: logo-listek na `--green-100`, wzór słojów). Karta „A” pokazuje termin EN (pogrubiony), karta „B” – tłumaczenie albo definicję (zwykły tekst, mniejsza czcionka, `hyphens: auto`).
2. Dotknięcie odkrywa kartę (obrót 3D 300 ms; przy `reduced()` od razu). Dwie odkryte:
  - para pasuje → obie zostają odkryte, obwódka `--green-600`, ✓, `buzz(true)`; pod planszą przez 1,5 s pasek: „Inflation = inflacja” (tryb enpl) albo „Inflation: ogólny wzrost cen…” (def).
  - nie pasuje → obie dostają czerwoną obwódkę na 900 ms i się zakrywają; `bledy++`; para (obie karty) trafia na listę pomylonych.
3. W trakcie odkrywania pary nie da się kliknąć trzeciej karty.
4. Czas liczy się od pierwszego dotknięcia (licznik `mm:ss` na pasku). Wynik do bazy: `wynik = znalezione pary`, `bledy`, `czasMs`.
5. Klawiatura: strzałki przesuwają fokus po siatce (roving tabindex), Enter/Spacja odkrywa. Karta ma `aria-label` „Karta 3, zakryta” / „Karta 3: Inflation” / „Karta 3: Inflation, dopasowana”.
Punkty rankingu (baza): 2 × pary, +10 za całą planszę bez pomyłki przy ≥ 6 parach, max 20 za rundę, punkty tylko z pierwszych 3 rund dziennie (wszystkie gry osobno). XP: +1 ⚡ za parę, +5 za planszę bez błędu (pula `games`).
Po rundzie: pomylone pojęcia → `srsAdd([...new Set(wrong.map(p => p.key))])` (do Powtórek). Ekran wyniku z sekcji 5.5 z liczbami: „{pary} par · {bledy} pomyłek · {mm:ss}”, rekord = najmniej błędów, przy remisie krótszy czas (lokalnie, `bm-gry-rekord:pary:<sid>:<trudnosc>`). Zamiast „Powtórz pomylone” przycisk „Ćwicz pomylone słówka” → istniejące `glossarySource(pomylone, sid)` przez `playerOpen` (ta funkcja chce par w kształcie { t, d }, więc przekaż pomylone.map(p => ({ t: p.a, d: p.b })); min. 4 pary; mniej → przycisk ukryty).
Kontrola w bazie: `wynik ≤ 10` i czas ≥ 1,2 s na parę (sekcja 3).
### 8.3 Ekran startu Par
Po kliknięciu „Graj” na kafelku Pary: mały `modal` – Tryb: `[ EN – PL ] [ Definicje ]`, Plansza: `[ Łatwa 6 ] [ Średnia 8 ] [ Trudna 10 ]`, przycisk „Zaczynamy”. Wybory zapamiętane w `localStorage["bm-gry-pary"]`.
### 8.4 Teksty (PL → EN)
| PL | EN |
| Pary | Pairs |
| Dopasuj pojęcia EN–PL i definicje. | Match EN–PL terms and definitions. |
| Tryb: | Mode: |
| Definicje | Definitions |
| Plansza: | Board: |
| Łatwa | Easy |
| Średnia | Medium |
| Trudna | Hard |
| Zaczynamy | Let's go |
| za mało pojęć | not enough terms |
| par | pairs |
| pomyłek | mistakes |
| Ćwicz pomylone słówka | Practise missed terms |
| Karta {0}, zakryta | Card {0}, face down |
| dopasowana | matched |
| Pary ze słowniczka | Pairs from the glossary |
## 9. Etap 4: Przejdź
Gracz to student z plecakiem (widok z góry, prosty rysunek: głowa, plecak w `--lime-400`). Idzie w górę planszy przez pasy: trawnik kampusu, ulicę, tory tramwajowe i rzekę (Odra) z pływającymi kłodami i stertami papierów. Wynik = najdalszy rząd, do którego doszedł. Gra na canvasie, interfejs z sekcji 5.2 (`revive: true`, `wantsQuestion()` dla bramek).
### 9.1 Plansza
- Siatka: 9 kolumn × `cell = 40` j (szerokość świata 360). Rząd 0 = start na dole. Rzędy generowane leniwie, 20 do przodu; rzędy > 12 za kamerą są usuwane.
- Kamera: przesuwa się płynnie tak, żeby gracz był na wysokości 70% ekranu od góry (lerp 0,15 na krok). Od rzędu 10 kamera sama jedzie w górę 0,25 rzędu/s. Gracz poniżej dolnej krawędzi ekranu = śmierć „Spóźniłeś się na zajęcia”.
- Rodzaje rzędów:
| Rodzaj | Co jest | Śmierć |
| `trawa` | 0–4 drzewa/ławki (przeszkody: nie da się wejść) | nie |
| `ulica` | 1–3 samochody (długość 1–2 kratki) jadące w jedną stronę ze stałą prędkością, zawijane za krawędzią | potrącenie |
| `tory` | co 4–7 s tramwaj (cała szerokość + zapas) z prędkością 900 j/s; 1,2 s wcześniej miga czerwone światło przy torach | potrącenie |
| `rzeka` | 2–3 kłody długości 2–4 kratki, jedna strona, prędkość stała | wejście do wody, wyniesienie poza krawędź |
| `bramka` | trawa z tablicą „?” na całej szerokości, co 25 rzędów | nie – pytanie po wejściu (9.3) |
### 9.2 Generator (`ctx.rnd`, poziom `d = floor(najdalszy_rząd / 20)`)
1. Rzędy 0–3: `trawa` bez drzew.
2. Dalej losuj grupy: `trawa` (1–2 rzędy), `ulica` (1–4 rzędy), `tory` (1), `rzeka` (1–3 rzędy); nigdy dwie grupy `rzeka` obok siebie, nigdy `tory` zaraz po `tory`. Prawdopodobieństwo grup: trawa 30%, ulica 40%, tory 10%, rzeka 20%; od `d ≥ 2` ulica 45%, trawa 25%.
3. Prędkości: samochody `min(60 + 15·d, 160)` j/s, kłody `40 + 10·d` j/s (max 100); kierunek losowy na rząd, sąsiednie rzędy ulicy naprzemiennie, gdy to możliwe.
4. Odstęp między samochodami w rzędzie ≥ 2 kratki. Kłody: przerwa między kłodami 1–3 kratki.
5. Przejezdność: w każdym rzędzie `trawa` co najmniej 4 wolne pola. Po wygenerowaniu rzędu `trawa` sprawdź BFS po polach trawy od poprzedniego rzędu `trawa`, traktując ulice/tory/rzeki jako przejezdne we wszystkich kolumnach; gdy brak drogi – usuń drzewo blokujące najkrócej. Start i bramki bez drzew.
6. Rząd `bramka` co `gateEvery` (25) rzędów: 25, 50, 75…
### 9.3 Ruch, kolizje, bramki
- Ruch o 1 kratkę: tap / swipe w górę / strzałka w górę / W = do przodu; swipe w lewo/prawo, strzałki, A/D = w bok; swipe w dół / S / strzałka w dół = do tyłu. Swipe = ruch palca ≥ 24 px; krótki tap = do przodu.
- Skok trwa `hopMs = 120` ms (płynna animacja, mały łuk), a kolejny skok może zacząć się najwcześniej 200 ms po poprzednim – to daje max 5 skoków/s, czyli dokładnie granicę sprawdzaną w bazie (nie zmieniaj jednego bez drugiego). Wejścia w trakcie skoku są buforowane (max 1 w kolejce). Na pole z drzewem / poza boczną krawędź – brak ruchu, lekkie drgnięcie.
- Kolizja z samochodem/tramwajem: prostokąt gracza zmniejszony o 6 j z każdej strony vs prostokąt pojazdu.
- Rzeka: gdy gracz kończy skok na rzędzie `rzeka`, sprawdź kłodę pod środkiem gracza; jest → gracz jedzie z kłodą (x += prędkość × dt), ruch w bok dalej po kratkach względem kłody; nie ma → woda = śmierć „Wpadłeś do Odry”. Środek gracza poza ekranem → śmierć „Kłoda odpłynęła za daleko”.
- Bramka: wejście na rząd `bramka` pierwszy raz → `wantsQuestion() = true` → gra pauzuje, nakładka z pytaniem ABCD (ta sama co Druga szansa, nagłówek „Bramka · pytanie za punkty”, 20 s). Dobra lub zła odpowiedź – gra toczy się dalej (bramka nie zabija). Wywołanie w tle `rp.odp(..., zrodlo: "gra", run)` – liczy się do tych samych 12 pytań na rundę.
- Wynik = najdalszy rząd (cofanie się go nie zmniejsza). Kontrola w bazie: ≤ 5 rzędów na sekundę + 5.
Śmierć i wskrzeszenie: animacja 500 ms (potrącenie: spłaszczenie; woda: plusk – bez animacji przy `reduced()`), potem Druga szansa. `revive()`: gracz wraca na najbliższy rząd `trawa` na lub poniżej miejsca śmierci, w wolnej kolumnie najbliżej środka; kamera ustawia się na nim; ruch pojazdów na 2 s zatrzymany; potem 2 s nietykalności (gracz przezroczysty 60%). Automatyczny przesuw kamery wznawia się po pierwszym ruchu.
### 9.4 Rysowanie
Widok z góry, płaskie kształty w palecie strony: trawa `--green-100` w kratkę, drzewa koła `--green-400` z obrysem `#0E5A30`, ulica `#5B6660` z białymi przerywanymi liniami, samochody prostokąty z zaokrągleniem w kolorach przedmiotów, tramwaj żółto-kremowy (szczeciński), tory szare z podkładami, rzeka `--teal-600` 50% z falkami, kłody brązowe, bramka – limonkowa szarfa z „?” i numerem. Cienie płaskie, bez gradientów. Nie przypominaj wyglądem żadnej istniejącej gry (bez kanciastych „voxeli”, bez kurczaka).
### 9.5 Teksty (PL → EN)
| PL | EN |
| Przejdź | Cross |
| Przejdź przez Cukrową. | Cross Cukrowa Street. |
| Dotknij, żeby iść | Tap to walk |
| Potrącił Cię samochód | Hit by a car |
| Tramwaj! | Tram! |
| Wpadłeś do Odry | You fell into the Oder |
| Kłoda odpłynęła za daleko | The log drifted too far |
| Spóźniłeś się na zajęcia | You were late for class |
| Bramka · pytanie za punkty | Gate · question for points |
| rzędów | rows |
## 10. Etap 5: szlif
### 10.1 Demo Fruń na ekranie logowania
- Na `#login` pod formularzem link „Zagraj w demo (1 min) →”. Otwiera Fruń w trybie `demo: true`.
- Demo nie woła bazy ani nie zapisuje niczego. Pytania: stała tablica `DEMO_QS` w `gry.js` – 6 pytań ABCD po polsku i angielsku (pole `en`) z tematów 1. roku (makroekonomia, prawo, finanse), napisanych od nowa, nie kopiowanych z materiałów.
- `gry.js` ładuje się w demo bez `GRY_API` z `index.html` – użyj minimalnego zestawu (własne `h`, `T`, `reduced`), bo przed zalogowaniem aplikacja jest ukryta (`html.needlogin`). Nakładka gry musi mieć `z-index` wyższy niż `#login` (9998).
- Ekran wyniku demo: „W pełnej wersji pytania są z Twoich przedmiotów, a punkty liczą się do rankingu roku.” + przycisk „Zaloguj się albo kup dostęp” (zamyka grę, fokus na formularzu).
### 10.2 Odznaki (lokalne, bez bazy)
Zapis w dokumencie postępu: `progress.odznaki = { [id]: dzienN }` (przez `progSoon`), sprawdzane po ekranie wyniku gry i po rankingu. Pokazane w Więcej → profil jako rząd małych ikon z `title`.
| id | Nazwa | Warunek |
| `frun10` | Pierwszy lot | 10 kolumn we Fruń |
| `frun30` | Ponad półkami | 30 kolumn we Fruń |
| `szansa` | Druga szansa | 10 wskrzeszeń łącznie |
| `pary0` | Bez pomyłki | plansza Par trudna bez błędu |
| `przejdz50` | Na drugi brzeg | 50 rzędów w Przejdź |
| `top10` | Dziesiątka | top 10 rankingu tygodnia (przy ≥ 10 osobach) |
### 10.3 Wydajność i jakość
- `gry.js` ≤ 60 kB nieskompresowany (bez bibliotek). Pierwsza klatka gry < 300 ms od kliknięcia na telefonie średniej klasy (pliki już w pamięci podręcznej).
- 60 kl./s na iPhone SE (2. gen.) i tanim Androidzie: zero alokacji w pętli `update`/`draw` (tablice obiektów z puli, bez tworzenia obiektów co klatkę), tekst na canvasie tylko w napisach stanów.
- Pętla zatrzymuje się całkowicie (`cancelAnimationFrame`) przy pauzie i po zamknięciu.
- Przegląd EN: każda nowa linijka z sekcji 5.6, 6.3, 7.6, 8.4, 9.5 jest w `i18n-en.js`.
### 10.4 Odłożone (nie robić teraz)
Ranking międzykierunkowy (gdy dojdzie drugi kierunek – baza ma już `kierunek`/`rocznik`), wyzwania 1:1 między znajomymi, sezonowe nagrody, dźwięki z plików.
## 11. Testy i checklisty odbioru
### 11.1 Baza – lokalnie, nigdy na produkcji
Nie testuj na bazie Supabase z prawdziwymi studentami. Postaw lokalny PostgreSQL 16 z atrapą Supabase i uruchom po kolei wszystkie pliki z `supabase/` (kolejność z README; `skrot-kalendarz.sql` przed `skrot-v8-urzadzenia.sql`; w v12 błąd o `limit_wpisow()` jest oczekiwany – to funkcja z repo plan-bm), potem `skrot-v13-gry.sql` dwa razy (drugi raz bez błędów).
Atrapa (`supabase/test/stub.sql`, dodaj do repo, ukryta w `_config.yml` jak reszta `supabase/`):
```
create role anon nologin; create role authenticated nologin; create role service_role nologin;
create schema auth; create schema extensions; create extension pgcrypto schema extensions;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}', last_sign_in_at timestamptz, created_at timestamptz default now());
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true),''),'{}')::jsonb $$;
create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt()->>'sub','')::uuid $$;
grant usage on schema auth to anon, authenticated; grant execute on all functions in schema auth to anon, authenticated;
grant usage on schema public, extensions to anon, authenticated;
```
Przełączanie na studenta w teście (płatne konto potrzebuje wpisu w `nauka_dostep` i urządzenia w `nauka_urzadzenia`):
```
create or replace function pg_temp.jako(u text) returns void language plpgsql as $$
declare uid uuid; em text;
begin
  select id, email into uid, em from auth.users where email = u;
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'email', em, 'role','authenticated')::text, false);
  perform set_config('request.headers', json_build_object('x-skrot-device','11111111-1111-1111-1111-'||right(uid::text,12))::text, false);
end $$;
-- użycie: reset role; select pg_temp.jako('a@x.pl'); set role authenticated; select nauka_ranking();
```
Przypadki (wszystkie przeszły 28.10.2026; zapisz je jako `supabase/test/v13.sql` i uruchamiaj po każdej zmianie SQL):
| # | Sprawdzenie | Oczekiwane |
| B1 | pseudonim „ad” / „Starosta123” / widoczność bez pseudonimu | `nick_dlugosc` / `nick_zastrzezony` / `nick_brak` |
| B2 | „Łoś Ania”, potem inna osoba „Łoś ania” | ok / `nick_zajety` |
| B3 | dobra odpowiedź quiz, ta sama drugi raz | +10 / +0 |
| B4 | zła odpowiedź, nieistniejące pytanie | `poprawna:false, pkt:0` / `no_question` |
| B5 | zadanie 251 przy wyniku 250; 0,75 przy 0,5 z `tol` 0,1 | +20 / `poprawna:false` |
| B6 | lekcja dwa razy | +30 / `juz:true, pkt:0` |
| B7 | odpowiedź `gra` bez rundy | `bad_run` |
| B8 | Fruń 500 w 1 s; 40 w 60 s; koniec drugi raz | `podejrzana` 0 pkt; `ok` +20 `nowy_rekord:true`; `already_finished` |
| B9 | konto bez dostępu: start / ranking / odpowiedź | `no_access` ×3 |
| B10 | 30 powtórek jednego dnia | razem 20 pkt |
| B11 | 25 odpowiedzi w minutę | 5 × `too_fast` |
| B12 | starosta z punktami i widocznością | brak na liście `top` |
| B13 | osoba ukryta | `ja.widoczny:false`, `ja.miejsce` liczone, brak na liście |
| B14 | osoba z C111, filtr C112 | `ja.w_grupie:false, miejsce:null` |
| B15 | statystyki przy 4 osobach / przy 10 | `przedmioty: []` / wiersz z `proc`, `moj_proc`, `lepiej_niz` |
| B16 | `select * from nauka_rp` jako `authenticated` | `permission denied` |
| B17 | `select nauka_rp_dodaj(…)` jako `authenticated` | `permission denied for function` |
| B18 | 13. pytanie w jednej rundzie | `bad_run` |
| B19 | punkty z gier powyżej 150 jednego dnia | odpowiedzi `pkt:0`, suma puli `gry` = 150 |
| B20 | punkty dziś i wczoraj | jeden wiersz `seria` +5 dziś |
### 11.2 Strona – Playwright na atrapie
Tak jak przy lekcjach v3 i przemianie: lokalna kopia strony z atrapą `skrot-supabase.js` (dane w pamięci). Atrapa `window.skrot.rp` zwraca odpowiedzi w kształtach z sekcji 4 i liczy punkty po swojej stronie. Rozdzielczości: 390 × 844 i 1280 × 800. Języki PL i EN. Konta: płatne, darmowe, starosta.
Etap 0
- Quiz: pierwsza odpowiedź na kartę wywołuje `rp.odp` z indeksem oryginalnym (sprawdź na pytaniu z przetasowanymi opcjami); druga szansa w quizie nie wywołuje drugi raz; materiał `isMine` – brak wywołania
- Zadanie krok po kroku, Powtórki, lekcja z biletem – po jednym wywołaniu
- Brak bazy v13 (`not_enabled`) – nic się nie psuje, brak toastów
Etap 1 (Druga szansa + Fruń)
- Ekran Graj: domyślny przedmiot = najbliższe zaliczenie; przedmiot < 20 pytań wyszarzony; darmowe konto widzi paywall
- Fruń: podskok, kolizja z kolumną i podłogą, sufit nie zabija, wynik rośnie po minięciu kolumny
- 1. śmierć → ABCD 20 s; dobra → „Graj dalej” → listek na środku, kolumny usunięte, 2 s nietykalności; 2. śmierć → zadanie 60 s (albo „Trudniejsze pytanie”); 3. śmierć → od razu wynik
- Zła odpowiedź → fiszki materiału w Powtórkach (max 5), klucz w `bm-gry-zle`
- Koniec czasu = zła odpowiedź
- Ekran wyniku: rekord lokalny, pkt rankingu z bazy, „Powtórz pomylone” otwiera quiz
- Ukrycie karty → pauza; powrót nie „przeskakuje” czasu
- ✕ w trakcie → „Przerwać rundę?” → `rp.koniec` wysłane
- Przycisk Wstecz telefonu zamyka grę, nie stronę
- „Mniej animacji”: bez wstrząsu, migania, blura, konfetti; gra grywalna
- Motyw różowy: kolory gry z CSS (różowe)
- Klawiatura: spacja/strzałka – skok; 1–4 – odpowiedź; Enter – zadanie; fokus widoczny
- EN: zero polskich napisów w interfejsie gry (treść pytań może być PL)
- 60 kl./s w Chrome DevTools z ograniczeniem CPU 4×
Etap 2 (Ranking)
- Pierwsze wejście → karta pseudonimu; błędy pseudonimu pod polem; „Nie teraz” → ukryty
- Tydzień/Semestr, filtr grupy, przedmiot – każda zmiana jedno zapytanie
- Ja poza top 10 → `⋯` i sąsiedzi; ja podświetlony; remisy z tym samym numerem
- Ukryty: dopisek i przycisk „Pokaż mnie w rankingu”
- Statystyki: brak danych → komunikat; z danymi → paski, „Ty X%”
- Więcej → ustawienia rankingu; Dziś → linia z miejscem (nie dodatkowe zapytanie przy każdym renderze)
- Starosta: panel „Gry i ranking”, usunięcie pseudonimu
Etap 3 (Pary)
- Trzy rozmiary, oba tryby; < 6 par → wyszarzone
- Dopasowanie / pomyłka / blokada trzeciej karty; wyjaśnienie 1,5 s
- Czytnik ekranu: etykiety kart; strzałki po siatce
- Pomylone → Powtórki; „Ćwicz pomylone słówka” otwiera odtwarzacz
Etap 4 (Przejdź)
- 200 rund generatora (seedy 1–200) w teście bez grafiki: zawsze istnieje droga przez trawę (BFS)
- Samochody, tramwaj ze światłem 1,2 s, rzeka z kłodami, wyniesienie poza ekran, autoprzesuw od rzędu 10
- Bramka co 25 rzędów: pytanie bez śmierci
- Swipe na telefonie, strzałki/WASD na komputerze; skoki nie częściej niż co 200 ms
- Wskrzeszenie na trawie, pojazdy stoją 2 s
Etap 5
- Demo z ekranu logowania bez sieci do bazy (zero zapytań do Supabase w zakładce Network)
- Odznaki zapisują się raz
- `gry.js` ≤ 60 kB
## 12. Prompty do Claude Code
Przed pierwszym promptem: wyeksportuj ten dokument jako Markdown i zapisz w repo jako `docs/gry/SPEC.md` (katalog `docs/` nie jest publikowany na stronie – sprawdź `_config.yml`). Każdy prompt wklejasz w nowej sesji Claude Code otwartej w folderze `skrot-bm`. Po każdym etapie Claude Code zostawia notatkę, co masz uruchomić w Supabase.
Etap 0 – baza i punkty
```
Przeczytaj docs/gry/SPEC.md, sekcje 0–4 i 11.1. Zrób etap 0 na gałęzi gry-etap-0:
1. Utwórz supabase/skrot-v13-gry.sql dokładnie z sekcji 3 (uzupełnij tylko listę wulgaryzmów w nauka_nick_ok).
2. Postaw lokalny PostgreSQL z atrapą z 11.1, uruchom wszystkie migracje i v13 dwa razy, potem testy B1–B20 jako supabase/test/v13.sql. Pokaż mi wyniki.
3. Dodaj window.skrot.rp do skrot-supabase.js (sekcja 4).
4. Dodaj 4 wpięcia punktów w index.html (sekcja 4, „Wpięcia punktów”) i dopisz games: 30 do XP_CAP.
5. Dopisz akapit do prywatnosc.html i regulamin.html (koniec sekcji 3).
6. Testy z 11.2 „Etap 0” w Playwright na atrapie. README: nowy rozdział „Gry i ranking (v13)”.
Nie pushuj na main. Na koniec napisz mi po polsku, co mam wkleić w Supabase i w jakiej kolejności.
```
Etap 1 – Druga szansa i Fruń
```
Przeczytaj docs/gry/SPEC.md, sekcje 0–2, 5, 6 i 11.2 „Etap 1”. Etap 0 jest już na main.
Zrób etap 1 na gałęzi gry-etap-1:
1. gry.js: rdzeń (5.2), Druga szansa (5.4), runda i ekran wyniku (5.5), gra Fruń (6.2).
2. index.html: loadGry, grajOpen, GRY_API (5.1), questions/tasks (5.3), widok gry (6.1), wejścia (6.4; kafelki Pary i Przejdź jako „wkrótce”).
3. Teksty z 5.6 i 6.3 do i18n-en.js.
4. Cała checklista 11.2 „Etap 1” w Playwright (390 i 1280 px, PL i EN, płatne/darmowe/starosta) + nagranie zrzutów ekranu kluczowych stanów.
Nie zmieniaj stałych fizyki Fruń bez zmiany granicy w SQL (sekcja 6.2). Nie pushuj na main.
```
Etap 2 – Ranking
```
Przeczytaj docs/gry/SPEC.md, sekcje 0, 4, 7 i 11.2 „Etap 2”. Zrób etap 2 na gałęzi gry-etap-2:
widok ranking (7.1), pseudonim i zgoda (7.2), ustawienia w Więcej (7.3), linia na Dziś (7.4), panel starosty (7.5),
rekordy tygodnia na ekranie Graj (6.1), teksty 7.6. Checklista 11.2 „Etap 2”. Nie pushuj na main.
```
Etap 3 – Pary
```
Przeczytaj docs/gry/SPEC.md, sekcje 0, 5, 8 i 11.2 „Etap 3”. Zrób grę Pary (gra w DOM, nie canvas) na gałęzi gry-etap-3,
z pairs() w index.html, ekranem startu (8.3), wpięciem w Słowniczek i tekstami 8.4. Checklista 11.2 „Etap 3”. Nie pushuj na main.
```
Etap 4 – Przejdź
```
Przeczytaj docs/gry/SPEC.md, sekcje 0, 2, 5 i 9 oraz 11.2 „Etap 4”. Zrób grę Przejdź w gry.js na gałęzi gry-etap-4.
Najpierw generator z testem 200 seedów (droga przez trawę zawsze istnieje), dopiero potem rysowanie i sterowanie.
Odstęp między skokami min. 200 ms (granica w SQL). Teksty 9.5. Checklista 11.2 „Etap 4”. Nie pushuj na main.
```
Etap 5 – szlif
```
Przeczytaj docs/gry/SPEC.md, sekcje 0 i 10 oraz 11.2 „Etap 5”. Zrób demo Fruń na ekranie logowania (10.1), odznaki (10.2)
i przegląd wydajności i EN (10.3) na gałęzi gry-etap-5. Nie pushuj na main.
```
Po każdym etapie (Ty): przejrzyj zmiany, uruchom SQL, jeśli etap go zmienia, zagraj na telefonie, dopiero potem poproś Claude Code o merge do `main`.