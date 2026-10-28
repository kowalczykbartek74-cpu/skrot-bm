# Skrót BM: Gry 2 – specyfikacja dla Claude Code

Oct 28, 2026 · @Bartek

## 0. Zakres i zasady

Trzy nowe gry dla Skrót BM, dopinane do tego, co jest już na `main` (commity „Gry etap 0–5”, stan z 28.10.2026, ostatni `a3bee73`):

| Gra | Id | Rodzaj | W skrócie |
| --- | --- | --- | --- |
| **Drabina** | `drabina` | DOM, runda jak Pary | 12 pytań od najłatwiejszego do najtrudniejszego (trudność = jak radził sobie rok), 3 koła ratunkowe, w tym „Zapytaj rok” |
| **Hasło dnia** | `haslo` | DOM, jedna gra dziennie | jedno pojęcie EN dla całego roku, 6 prób, litery sprawdza baza, wynik do skopiowania na grupę |
| **Boss przed kolokwium** | `boss` | nie gra, wspólne wydarzenie | 7 dni przed kolokwium/egzaminem pojawia się boss; każda dobra odpowiedź kogokolwiek z roku z tego przedmiotu to cios |

**Obowiązują wszystkie zasady z sekcji 0 dokumentu `docs/gry/SPEC.md`** (jeden etap na gałąź, punkty tylko w bazie, nowe teksty w `i18n-en.js`, `lpReduced()`, motywy z CSS, README po każdym etapie, push na `main` po testach). Ten dokument zapisz w repo jako `docs/gry/SPEC-2.md`.

**Kolejność etapów:**

| Etap | Gałąź | Zawartość | Zależy od |
| --- | --- | --- | --- |
| 6 | `gry-etap-6` | SQL v15 + API (sekcje 2–3) | v13 w bazie |
| 7 | `gry-etap-7` | Hasło dnia (sekcja 5) | etap 6 |
| 8 | `gry-etap-8` | Drabina (sekcja 4) | etap 6 |
| 9 | `gry-etap-9` | Boss (sekcja 6) | etap 6 |

Hasło dnia idzie pierwsze, bo najszybciej przyciąga ludzi: codziennie nowa zagadka i wynik do wklejenia na grupę roku.

**Monety (specyfikacja „Monety, Zadania dnia i Sklep”, SQL v14):** v15 od niej nie zależy. Wszystkie nowe punkty idą do księgi `nauka_rp`, więc gdy v14 jest w bazie, monety za nowe gry naliczą się same (trigger `nauka_rp_monety`). Kolejność uruchamiania: v13 → v14 (jeśli jest) → v15.

## 1. Dane, z których korzystają

Sprawdzone w repo (`a3bee73`). Nowe gry nie potrzebują żadnej nowej treści – wszystko już jest w bazie.

| Gra | Dane | Gdzie | Kształt |
| --- | --- | --- | --- |
| Hasło dnia | pojęcia z materiałów roku | `nauka_docs`, kolekcja `materialContent`, pole `concepts[]` (to samo, z czego `glossaryFrom()` buduje słowniczek) | `{ term, pl?, definition? }`; przedmiot z `materials.data.subjectId` |
| Drabina | pytania ABCD | `gryQuestions(sid, n)` w `index.html` (już używane przez Fruń i Przejdź) | `{ q, options, correct, explanation, materialId, index }` |
| Drabina | jak odpowiadał rok | tabela `nauka_odp` z v13 | dziś zapisuje tylko `ok`; v15 dopisuje kolumnę `wybor` (która odpowiedź) |
| Boss | terminy zaliczeń | `nauka_docs`, kolekcja `deadlines` (dodaje je tylko starosta) | `{ title, date: "YYYY-MM-DD", type: "kolokwium" \| "egzamin" \| …, subjectId, groups?: ["C112"], subs?, part?, approx? }` |
| Boss | ciosy | `nauka_odp` (dobre odpowiedzi z quizów i gier, sprawdzone przez bazę) | bez nowych zapisów przy odpowiedzi |
| Wszystkie | punkty | `nauka_rp_dodaj()` z v13 | nowe źródła `haslo` i `boss` (v15 rozszerza listę) |

**Rdzeń gier, do którego się dopinamy (`gry.js`):** rejestr `GAMES = { frun, pary }` + `LAZY = { przejdz: "gry-przejdz.js" }`, `open(gra, opts)` → `newRun()`. Gra w DOM ma `dom: true` i `mount(ctx)` zwracające `{ n, … }`; dziś `newRun()` dla każdej gry DOM pobiera `A.pairs(...)` i woła `mountDom()`. Etap 8 uogólnia to tak, żeby gra DOM sama mówiła, jakiej treści potrzebuje (sekcja 4.6).

**Uwaga przy terminach:** termin z `approx: true` to data orientacyjna z sylabusa. Boss pojawia się **tylko** przy terminie bez `approx` (data ogłoszona przez prowadzącego), żeby rok nie walczył z bossem przed kolokwium, które się przesunie.

## 2. Baza: `supabase/skrot-v15-gry2.sql`

Plik poniżej jest gotowy i **przetestowany** 28.10.2026 na PostgreSQL 16: wszystkie migracje z repo (nauka.sql → v13), potem v15 dwa razy. Repo-owy `supabase/test/v13.sql` po v15 dalej kończy się „WSZYSTKIE TESTY B1–B20 OK”. Claude Code wkleja plik bez zmian w logice.

**Co zmienia w v13 (świadomie, z kopiami funkcji z repo):**

| Element | Zmiana |
| --- | --- |
| `nauka_odp.wybor` | nowa kolumna: która odpowiedź została wybrana (do „Zapytaj rok”) |
| `nauka_rp_odpowiedz` | ta sama co w v13, tylko zapisuje `wybor` |
| `nauka_gra_start`, `nauka_gra_koniec` | te same co w v13 + gra `drabina` (kontrola: szczebli ≤ dobrych odpowiedzi tej rundy w bazie, min. 2 s na pytanie) |
| `nauka_rp.zrodlo`, `nauka_rp_pula` | nowe źródła `haslo` i `boss`, każde z własną pulą (bez limitu dziennego, same pilnują „raz”) |
| `nauka_gry.gra` | dopuszcza `drabina` |

**Nowe:**

| Element | Rola |
| --- | --- |
| `nauka_gry2_cfg()` | wszystkie liczby nowych gier w jednym miejscu |
| `nauka_pyt_trudnosc(text[])` | skuteczność rocznika dla listy pytań (`'<mid>:<idx>'`), tylko pierwsza odpowiedź każdej osoby, od 5 osób |
| `nauka_pyt_rok(mid, idx)` | rozkład wyborów rocznika (bez mojego), od 5 osób; inaczej `za_malo: true` |
| `nauka_haslo_dni`, `nauka_haslo` | słowo dnia (wybierane raz, zapisane) i próby każdej osoby |
| `nauka_haslo_dzis()`, `nauka_haslo_proba(text)` | stan gry i jedna próba; słowo wraca dopiero po końcu |
| `nauka_boss`, `nauka_bossy()`, `nauka_boss_odbierz(id)` | bossy z terminów, ciosy liczone z `nauka_odp`, nagroda |
| `nauka_admin_boss(id, hp, ukryty)` | starosta zmienia życie albo ukrywa bossa |

**Wyniki testów (zapisz je jako `supabase/test/v15.sql`, w tym samym stylu co `test/v13.sql`, i dopisz do `test/pglite.mjs` po `skrot-v15-gry2.sql`):**

| # | Sprawdzenie | Oczekiwane |
| --- | --- | --- |
| H1 | słowo dnia z puli `Inflation, GDP, Supply chain, Revenue` | jedno z: INFLATION, REVENUE (GDP za krótkie, „Supply chain” ma spację) |
| H2 | `nauka_haslo_wzor('LEVEL','LLAMA')`, `('ABBEY','BABES')` | `21000`, `11220` (powtórzone litery liczone poprawnie) |
| H3 | próba złej długości / ze znakami spoza A–Z | `bad_length` / `bad_letters` (próba się nie zużywa) |
| H4 | ta sama próba drugi raz | `repeated` |
| H5 | 3 nieudane próby | `podpowiedz` = definicja (słowo w niej zakryte `_`) |
| H6 | trafienie w 4. próbie | `wynik: 4, pkt: 12, koniec: true`; potem `nauka_haslo_dzis` zwraca słowo, PL, definicję, `seria: 1` |
| H7 | próba po końcu | `finished` |
| H8 | konto bez dostępu trafia | `wynik: 1, pkt: 0` (gra jest dla wszystkich zalogowanych, punkty tylko z dostępem) |
| D1 | 6 osób: m1:0 wybory 1,1,1,0,2,3 (dobra = 1), m1:1 wszyscy dobrze | `nauka_pyt_trudnosc` → m1:0 50%, m1:1 100%; m1:2 brak (0 osób) |
| D2 | `nauka_pyt_rok('m1',0)` / `('m1',2)` | `rozklad: [1,3,1,1], n: 6` / `za_malo: true` |
| D3 | Drabina: 2 dobre odpowiedzi, wynik 5 | `podejrzana`, 0 pkt |
| D4 | 1 szczebel w 1 s | `podejrzana` (za szybko) |
| D5 | 4 szczeble w 40 s, 4 dobre w bazie | `ok`, +5 pkt, `nowy_rekord: true` |
| D6 | odpowiedź `quiz` z wyborem 3 | w `nauka_odp.wybor` = 3 |
| B1 | terminy: kolokwium za 5 dni, egzamin za 20 dni, `approx` za 3 dni, kolokwium tylko C111 za 4 dni | bossy tylko dla 1. i 4.; życie = max(150, 12 × aktywni) |
| B2 | osoba z C112 / C111 | widzi tylko bossa całego roku / oba |
| B3 | odbiór przed pokonaniem | `not_defeated` |
| B4 | starosta zmienia życie na 20; zwykłe konto próbuje | `ok` / `not_admin` |
| B5 | 12 różnych dobrych ABCD + te same 12 drugi raz + 1 zadanie | ciosy +12 (duplikaty nie liczą się) +3 za zadanie; boss `pokonany` |
| B6 | odbiór nagrody dwa razy | +50 pkt / `already` |
| B7 | osoba z 2 ciosami odbiera | `too_few` (trzeba 10) |
| B8 | 100 dobrych odpowiedzi jednej osoby jednego dnia | 40 ciosów |
| B9 | `select` z `nauka_boss`, `nauka_haslo_dni`; wywołanie `nauka_boss_ciosy`, `nauka_haslo_slowo` jako `authenticated` | `permission denied` ×4 |

**Wdrożenie (Bartek):** Supabase → SQL Editor → wklej plik → Run (po v13, a jeśli jest – po v14). Strona działa także bez v15: nowe gry pokazują wtedy „Gry i ranking nie są jeszcze włączone na serwerze” (kod `not_enabled`, jak w etapach 0–5).

**Prywatność (`prywatnosc.html`)** – dopisz do akapitu o grach: „Zapisujemy też, którą odpowiedź wybrałeś, żeby pokazać rozkład odpowiedzi rocznika (koło „Zapytaj rok”); rozkład jest zbiorczy i widoczny dopiero przy co najmniej 5 osobach. W Haśle dnia zapisujemy Twoje próby z danego dnia.”

**Pełny plik `supabase/skrot-v15-gry2.sql`:**

```sql
-- Skrót BM v15: Hasło dnia, Drabina, Boss przed kolokwium (docs/gry/SPEC-2.md).
-- Wklej w Supabase → SQL Editor → Run. Można uruchamiać wielokrotnie (nie kasuje danych).
-- Wymaga skrot-v13-gry.sql. Nie wymaga v14 (monety): gdy v14 jest w bazie, monety za nowe punkty naliczą się same.
--
-- Zasady jak w v13:
--   • punkty wpisuje wyłącznie baza (nauka_rp_dodaj), przeglądarka nie ma dostępu do tabel;
--   • litery w Haśle dnia sprawdza baza, a słowo trafia do przeglądarki dopiero po końcu gry;
--   • statystyki rocznika pokazujemy dopiero od 5 osób.

-- =====================================================================
-- 1) Rozszerzenia tabel z v13
-- =====================================================================
-- Która odpowiedź została wybrana (indeks w oryginalnej kolejności) – do koła „Zapytaj rok”.
alter table public.nauka_odp add column if not exists wybor smallint;

-- Nowe źródła punktów: haslo (Hasło dnia), boss (nagroda za pokonanego bossa).
alter table public.nauka_rp drop constraint if exists nauka_rp_zrodlo_check;
alter table public.nauka_rp add constraint nauka_rp_zrodlo_check
  check (zrodlo in ('gra','wynik','quiz','powtorka','lekcja','seria','haslo','boss'));

-- Nowa gra w rundach: drabina.
alter table public.nauka_gry drop constraint if exists nauka_gry_gra_check;
alter table public.nauka_gry add constraint nauka_gry_gra_check check (gra in ('frun','pary','przejdz','drabina'));

-- Pule dzienne: haslo i boss mają własne (bez limitu dziennego – same pilnują „raz”).
create or replace function public.nauka_rp_pula(z text) returns text
language sql immutable set search_path = '' as $$
  select case when z in ('gra','wynik') then 'gry' when z = 'quiz' then 'quiz'
              when z = 'powtorka' then 'powtorki' when z = 'lekcja' then 'lekcje'
              when z = 'haslo' then 'haslo' when z = 'boss' then 'boss' else 'seria' end
$$;

-- Ustawienia v15.
create or replace function public.nauka_gry2_cfg() returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object(
    'haslo_min', 5, 'haslo_max', 9,           -- długość słowa (same litery A–Z)
    'haslo_proby', 6,
    'haslo_pkt', '[0,20,20,15,12,10,8]'::jsonb, -- punkty za rozwiązanie w 1…6 próbie (indeks = numer próby)
    'drabina_progi', '[4,8]'::jsonb,           -- szczeble gwarantowane
    'drabina_s_min', 2,                       -- min. sekund na pytanie (kontrola wyniku)
    'boss_dni', 7,                            -- boss pojawia się tyle dni przed terminem
    'boss_hp_osoba', 12, 'boss_hp_min', 150,  -- życie = 12 × aktywne osoby (14 dni), co najmniej 150
    'boss_cios_dzien', 40,                    -- max ciosów jednej osoby dziennie
    'boss_cios_zadanie', 3,                   -- zadanie liczbowe = 3 ciosy, ABCD = 1
    'boss_min_ciosow', 10,                    -- tyle ciosów, żeby odebrać nagrodę
    'boss_pkt', 50, 'boss_odbior_dni', 14,
    'min_osob', 5
  )
$$;

-- =====================================================================
-- 2) Odpowiedź ABCD zapisuje też wybór (zmiana tylko w insert do nauka_odp; reszta jak w v13)
-- =====================================================================
create or replace function public.nauka_rp_odpowiedz(p_mid text, p_idx int, p_wybor int, p_zrodlo text, p_run uuid default null)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  c jsonb := public.nauka_rp_cfg();
  q jsonb; v_sid text; v_ok boolean; v_correct int; v_pkt int := 0; v_run uuid; v_pierwsza boolean;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_rp_mozna() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  if p_zrodlo not in ('gra','quiz') then return jsonb_build_object('ok', false, 'code', 'bad_source'); end if;
  if p_idx is null or p_idx < 0 then return jsonb_build_object('ok', false, 'code', 'no_question'); end if;
  if public.nauka_rp_za_szybko(auth.uid()) then return jsonb_build_object('ok', false, 'code', 'too_fast'); end if;
  select data->'quiz'->p_idx into q from public.nauka_docs where kolekcja = 'materialContent' and id = p_mid;
  if q is null or coalesce(jsonb_typeof(q->'correct'), '') <> 'number' then return jsonb_build_object('ok', false, 'code', 'no_question'); end if;
  v_sid := public.nauka_rp_sid(p_mid);
  if v_sid is null then return jsonb_build_object('ok', false, 'code', 'no_question'); end if;
  if p_zrodlo = 'gra' then
    v_run := public.nauka_rp_runda_pytanie(p_run);
    if v_run is null then return jsonb_build_object('ok', false, 'code', 'bad_run'); end if;
  end if;
  v_correct := (q->>'correct')::int;
  v_ok := p_wybor is not null and p_wybor = v_correct;
  v_pierwsza := not exists (select 1 from public.nauka_odp o where o.user_id = auth.uid() and o.rodzaj = 'abcd'
                 and o.mid = p_mid and o.idx = p_idx::text
                 and o.created_at >= (public.nauka_dzis()::timestamp at time zone 'Europe/Warsaw'));
  insert into public.nauka_odp (user_id, mid, idx, sid, rodzaj, ok, zrodlo, run_id, wybor)
  values (auth.uid(), p_mid, p_idx::text, v_sid, 'abcd', v_ok, p_zrodlo, v_run,
          case when p_wybor between 0 and 9 then p_wybor end);
  if v_ok then
    if v_pierwsza then
      v_pkt := public.nauka_rp_dodaj(auth.uid(), p_zrodlo, 'q:' || p_mid || ':' || p_idx, v_sid, (c->>'pkt_abcd')::int, v_run);
    end if;
    if v_run is not null then update public.nauka_gry set ozywienia = ozywienia + 1 where id = v_run; end if;
  end if;
  return jsonb_build_object('ok', true, 'poprawna', v_ok, 'correct', v_correct, 'pkt', v_pkt);
end $$;

-- =====================================================================
-- 3) Start i koniec rundy: Drabina jako nowa gra (reszta jak w v13)
-- =====================================================================
create or replace function public.nauka_gra_start(p_gra text, p_sid text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare c jsonb := public.nauka_rp_cfg(); v_id uuid; v_seed int;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_rp_mozna() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  if p_gra not in ('frun','pary','przejdz','drabina') then return jsonb_build_object('ok', false, 'code', 'bad_game'); end if;
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


create or replace function public.nauka_gra_koniec(p_run uuid, p_wynik int, p_czas_ms int, p_bledy int default 0)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  c jsonb := public.nauka_rp_cfg(); c2 jsonb := public.nauka_gry2_cfg();
  r public.nauka_gry; v_s numeric; v_max int; v_status text := 'ok'; v_powod text; v_pkt int := 0; v_raw int;
  v_rekord int; v_nowy boolean; v_dobre int;
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
      when 'frun'    then ceil(v_s * 1.1)::int + 3
      when 'przejdz' then ceil(v_s * 5)::int + 5
      when 'pary'    then 10
      when 'drabina' then 12 end;
    if p_wynik > v_max then v_status := 'podejrzana'; v_powod := format('wynik %s > możliwe %s w %ss', p_wynik, v_max, round(v_s)); end if;
    if r.gra = 'pary' and p_wynik > 0 and v_s < p_wynik * 1.2 then v_status := 'podejrzana'; v_powod := 'plansza za szybko'; end if;
    if r.gra = 'drabina' and v_status = 'ok' then
      -- każdy szczebel = dobra odpowiedź sprawdzona przez bazę w tej rundzie
      select count(*) into v_dobre from public.nauka_odp o where o.run_id = r.id and o.ok;
      if p_wynik > v_dobre then v_status := 'podejrzana'; v_powod := format('szczeble %s > dobre odpowiedzi %s', p_wynik, v_dobre);
      elsif p_wynik > 0 and v_s < p_wynik * (c2->>'drabina_s_min')::int then v_status := 'podejrzana'; v_powod := 'drabina za szybko';
      end if;
    end if;
  end if;
  if v_status = 'ok' and public.nauka_rp_mozna() then
    v_raw := case r.gra
      when 'frun'    then p_wynik / 2
      when 'przejdz' then p_wynik / 5
      when 'pary'    then 2 * p_wynik + case when coalesce(p_bledy, 0) = 0 and p_wynik >= 6 then 10 else 0 end
      when 'drabina' then case when p_wynik >= 12 then 20 when p_wynik >= 8 then 10 when p_wynik >= 4 then 5 else 0 end end;
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

-- =====================================================================
-- 4) Drabina: trudność pytań i „Zapytaj rok”
-- =====================================================================
-- Skuteczność rocznika dla listy pytań. p_klucze = ['<mid>:<idx>', …] (max 80).
-- Liczy tylko pierwszą odpowiedź każdej osoby na dane pytanie; zwraca tylko pytania z ≥ min_osob osobami.
create or replace function public.nauka_pyt_trudnosc(p_klucze text[]) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_min int := (public.nauka_gry2_cfg()->>'min_osob')::int;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if p_klucze is null or array_length(p_klucze, 1) is null then return jsonb_build_object('ok', true, 'pyt', '{}'::jsonb); end if;
  if array_length(p_klucze, 1) > 80 then return jsonb_build_object('ok', false, 'code', 'too_many'); end if;
  return jsonb_build_object('ok', true, 'pyt', coalesce((
    select jsonb_object_agg(k, jsonb_build_object('n', n, 'proc', proc))
    from (select f.mid || ':' || f.idx k, count(*) n, round(100.0 * avg(f.ok::int))::int proc
            from (select distinct on (o.user_id, o.mid, o.idx) o.mid, o.idx, o.ok
                    from public.nauka_odp o
                   where o.rodzaj = 'abcd' and (o.mid || ':' || o.idx) = any (p_klucze)
                   order by o.user_id, o.mid, o.idx, o.created_at) f
           group by f.mid, f.idx having count(*) >= v_min) x), '{}'::jsonb));
end $$;

-- Rozkład wyborów rocznika dla jednego pytania (pierwsza odpowiedź każdej osoby, bez mojej).
create or replace function public.nauka_pyt_rok(p_mid text, p_idx int) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_min int := (public.nauka_gry2_cfg()->>'min_osob')::int; v_n int; v_roz jsonb; v_opcji int;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_platny() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  select jsonb_array_length(coalesce(data->'quiz'->p_idx->'options', '[]'::jsonb)) into v_opcji
    from public.nauka_docs where kolekcja = 'materialContent' and id = p_mid;
  if coalesce(v_opcji, 0) < 2 then return jsonb_build_object('ok', false, 'code', 'no_question'); end if;
  with f as (
    select distinct on (o.user_id) o.wybor from public.nauka_odp o
     where o.rodzaj = 'abcd' and o.mid = p_mid and o.idx = p_idx::text and o.wybor is not null and o.user_id <> auth.uid()
     order by o.user_id, o.created_at)
  select (select count(*) from f),
         (select jsonb_agg((select count(*) from f where f.wybor = i) order by i) from generate_series(0, v_opcji - 1) i)
    into v_n, v_roz;
  if v_n < v_min then return jsonb_build_object('ok', true, 'n', v_n, 'za_malo', true); end if;
  return jsonb_build_object('ok', true, 'n', v_n, 'za_malo', false, 'rozklad', v_roz);
end $$;

-- =====================================================================
-- 5) Hasło dnia
-- =====================================================================
create table if not exists public.nauka_haslo_dni (
  dzien      date primary key,
  slowo      text not null check (slowo ~ '^[A-Z]{3,12}$'),
  term       text not null,
  pl         text,
  def        text,
  sid        text,
  mid        text,
  created_at timestamptz not null default now()
);
create table if not exists public.nauka_haslo (
  user_id    uuid not null,
  dzien      date not null,
  proby      text[] not null default '{}',
  wzory      text[] not null default '{}',
  wynik      smallint,            -- null = w trakcie, 1–6 = zgadnięte w tej próbie, 0 = nie zgadnięte
  pkt        int not null default 0,
  koniec     timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, dzien)
);
create index if not exists nauka_haslo_dzien_idx on public.nauka_haslo (dzien);
alter table public.nauka_haslo_dni enable row level security;
alter table public.nauka_haslo     enable row level security;
revoke all on public.nauka_haslo_dni, public.nauka_haslo from anon, authenticated;

-- Słowo na dany dzień: wybierane raz (pierwsze wywołanie dnia) i zapisane, więc dodanie materiałów w ciągu dnia go nie zmienia.
-- Pula: pojęcia z materiałów roku, jedno słowo z samych liter, długość haslo_min–haslo_max, nieużyte w ostatnim roku.
create or replace function public.nauka_haslo_slowo(p_dzien date) returns public.nauka_haslo_dni
language plpgsql security definer set search_path = '' as $$
declare c jsonb := public.nauka_gry2_cfg(); r public.nauka_haslo_dni;
begin
  select * into r from public.nauka_haslo_dni where dzien = p_dzien;
  if found then return r; end if;
  insert into public.nauka_haslo_dni (dzien, slowo, term, pl, def, sid, mid)
  select p_dzien, upper(t.term), t.term, t.pl, t.def, t.sid, t.mid
    from (select distinct on (upper(btrim(x->>'term')))
                 btrim(x->>'term') term, nullif(btrim(x->>'pl'), '') pl, nullif(btrim(x->>'definition'), '') def,
                 m.data->>'subjectId' sid, m.id mid
            from public.nauka_docs d
            join public.nauka_docs m on m.kolekcja = 'materials' and m.id = d.id
            cross join lateral jsonb_array_elements(case when jsonb_typeof(d.data->'concepts') = 'array' then d.data->'concepts' else '[]'::jsonb end) x
           where d.kolekcja = 'materialContent'
             and btrim(x->>'term') ~ '^[A-Za-z]+$'
             and char_length(btrim(x->>'term')) between (c->>'haslo_min')::int and (c->>'haslo_max')::int
           order by upper(btrim(x->>'term')), (x->>'definition') is null, m.id) t
   where not exists (select 1 from public.nauka_haslo_dni u where u.slowo = upper(t.term) and u.dzien > p_dzien - 365)
   order by md5(upper(t.term) || p_dzien::text)
   limit 1
  on conflict (dzien) do nothing;
  select * into r from public.nauka_haslo_dni where dzien = p_dzien;
  return r;  -- null, gdy pula jest pusta
end $$;

-- Wzór próby: dla każdej litery 2 = dobre miejsce, 1 = jest w słowie gdzie indziej, 0 = brak. Powtórzone litery liczone jak w znanych grach słownych.
create or replace function public.nauka_haslo_wzor(p_slowo text, p_proba text) returns text
language plpgsql immutable set search_path = '' as $$
declare n int := char_length(p_slowo); w int[] := array_fill(0, array[n]); zostalo text[] := '{}'; i int; j int; ch text;
begin
  for i in 1..n loop
    if substr(p_proba, i, 1) = substr(p_slowo, i, 1) then w[i] := 2; else zostalo := zostalo || substr(p_slowo, i, 1); end if;
  end loop;
  for i in 1..n loop
    if w[i] = 0 then
      ch := substr(p_proba, i, 1);
      j := array_position(zostalo, ch);
      if j is not null then w[i] := 1; zostalo := zostalo[1:j-1] || zostalo[j+1:]; end if;
    end if;
  end loop;
  return array_to_string(w, '');
end $$;

-- Stan Hasła na dziś (bez słowa, dopóki gra trwa).
create or replace function public.nauka_haslo_dzis() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  c jsonb := public.nauka_gry2_cfg(); d date := public.nauka_dzis(); s public.nauka_haslo_dni; g public.nauka_haslo;
  v_koniec boolean; v_stat jsonb; v_seria int; v_d date;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  s := public.nauka_haslo_slowo(d);
  if s.dzien is null then return jsonb_build_object('ok', false, 'code', 'no_words'); end if;
  select * into g from public.nauka_haslo where user_id = auth.uid() and dzien = d;
  v_koniec := g.wynik is not null;
  -- seria: kolejne dni z rozwiązanym Hasłem, kończąca się dziś (albo wczoraj, gdy dziś jeszcze nie rozwiązane)
  v_seria := 0; v_d := case when g.wynik > 0 then d else d - 1 end;
  while exists (select 1 from public.nauka_haslo h where h.user_id = auth.uid() and h.dzien = v_d and h.wynik > 0) loop
    v_seria := v_seria + 1; v_d := v_d - 1;
  end loop;
  -- statystyki dnia: tylko po końcu własnej gry i przy ≥ min_osob zakończonych
  if v_koniec then
    select case when count(*) >= (c->>'min_osob')::int then jsonb_build_object(
             'grali', count(*), 'zgadli', count(*) filter (where wynik > 0),
             'rozklad', (select jsonb_agg((select count(*) from public.nauka_haslo x where x.dzien = d and x.wynik = k) order by k)
                           from generate_series(0, (c->>'haslo_proby')::int) k)) end
      into v_stat from public.nauka_haslo where dzien = d and wynik is not null;
  end if;
  return jsonb_build_object('ok', true, 'dzien', d, 'nr', (select count(*) from public.nauka_haslo_dni x where x.dzien <= d),  -- numer Hasła (od pierwszego dnia gry)
    'dlugosc', char_length(s.slowo), 'sid', s.sid, 'max', (c->>'haslo_proby')::int,
    'proby', coalesce(to_jsonb(g.proby), '[]'::jsonb), 'wzory', coalesce(to_jsonb(g.wzory), '[]'::jsonb),
    -- po 3 nieudanych próbach podpowiedź: definicja z ukrytym słowem
    'podpowiedz', case when coalesce(array_length(g.proby, 1), 0) >= 3 and s.def is not null
                       then regexp_replace(s.def, s.term, repeat('_', char_length(s.term)), 'gi') end,
    'koniec', v_koniec, 'wynik', g.wynik, 'pkt', coalesce(g.pkt, 0), 'seria', coalesce(v_seria, 0),
    'slowo', case when v_koniec then s.term end, 'pl', case when v_koniec then s.pl end,
    'def', case when v_koniec then s.def end, 'mid', case when v_koniec then s.mid end,
    'stat', v_stat);
end $$;

-- Jedna próba. Litery A–Z, długość jak słowo dnia.
create or replace function public.nauka_haslo_proba(p_proba text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  c jsonb := public.nauka_gry2_cfg(); d date := public.nauka_dzis(); s public.nauka_haslo_dni; g public.nauka_haslo;
  v_p text := upper(btrim(coalesce(p_proba, ''))); v_w text; v_n int; v_max int := (c->>'haslo_proby')::int; v_pkt int := 0;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  s := public.nauka_haslo_slowo(d);
  if s.dzien is null then return jsonb_build_object('ok', false, 'code', 'no_words'); end if;
  if v_p !~ '^[A-Z]+$' then return jsonb_build_object('ok', false, 'code', 'bad_letters'); end if;
  if char_length(v_p) <> char_length(s.slowo) then return jsonb_build_object('ok', false, 'code', 'bad_length'); end if;
  insert into public.nauka_haslo (user_id, dzien) values (auth.uid(), d) on conflict do nothing;
  select * into g from public.nauka_haslo where user_id = auth.uid() and dzien = d for update;
  if g.wynik is not null then return jsonb_build_object('ok', false, 'code', 'finished'); end if;
  if v_p = any (g.proby) then return jsonb_build_object('ok', false, 'code', 'repeated'); end if;
  v_w := public.nauka_haslo_wzor(s.slowo, v_p);
  v_n := coalesce(array_length(g.proby, 1), 0) + 1;
  g.proby := g.proby || v_p; g.wzory := g.wzory || v_w;
  if v_p = s.slowo then
    g.wynik := v_n;
    if public.nauka_rp_mozna() then
      v_pkt := public.nauka_rp_dodaj(auth.uid(), 'haslo', 'h:' || d::text, s.sid, (c->'haslo_pkt'->>v_n)::int);
    end if;
  elsif v_n >= v_max then
    g.wynik := 0;
  end if;
  update public.nauka_haslo set proby = g.proby, wzory = g.wzory, wynik = g.wynik, pkt = v_pkt,
    koniec = case when g.wynik is not null then now() end
   where user_id = auth.uid() and dzien = d;
  return jsonb_build_object('ok', true, 'wzor', v_w, 'proba', v_n, 'koniec', g.wynik is not null, 'wynik', g.wynik, 'pkt', v_pkt);
end $$;

-- =====================================================================
-- 6) Boss przed kolokwium
-- =====================================================================
create table if not exists public.nauka_boss (
  id           text primary key,          -- id terminu z kolekcji deadlines
  sid          text not null,
  typ          text not null,
  tytul        text,
  termin       date not null,
  start        date not null,
  grupy        text[] not null default '{}',
  hp           int  not null check (hp > 0),
  ukryty       boolean not null default false,
  pokonany_at  timestamptz,
  created_at   timestamptz not null default now()
);
alter table public.nauka_boss enable row level security;
revoke all on public.nauka_boss from anon, authenticated;

-- Ciosy w bossa: dobre odpowiedzi z przedmiotu w oknie [start, termin), każde pytanie liczone raz na osobę dziennie,
-- max boss_cios_dzien na osobę dziennie; przy terminie dla grup – tylko osoby z tych grup.
create or replace function public.nauka_boss_ciosy(p_id text) returns table (user_id uuid, ciosy int)
language sql stable security definer set search_path = '' as $$
  with b as (select * from public.nauka_boss where id = p_id),
  c as (select public.nauka_gry2_cfg() v),
  t as (
    select distinct o.user_id, (o.created_at at time zone 'Europe/Warsaw')::date d, o.rodzaj, o.mid, o.idx
      from public.nauka_odp o, b
     where o.ok and o.sid = b.sid
       and o.created_at >= (b.start::timestamp at time zone 'Europe/Warsaw')
       and o.created_at <  (b.termin::timestamp at time zone 'Europe/Warsaw')
       and (cardinality(b.grupy) = 0 or public.nauka_rp_grupa(o.user_id) = any (b.grupy))),
  dz as (
    select t.user_id, t.d, least(sum(case when t.rodzaj = 'zadanie' then (c.v->>'boss_cios_zadanie')::int else 1 end),
                                (c.v->>'boss_cios_dzien')::int) n
      from t, c group by t.user_id, t.d, c.v)
  select dz.user_id, sum(dz.n)::int from dz group by dz.user_id
$$;

-- Życie nowego bossa: boss_hp_osoba × osoby aktywne w ostatnich 14 dniach (z tych grup), co najmniej boss_hp_min.
create or replace function public.nauka_boss_hp(p_grupy text[]) returns int
language sql stable security definer set search_path = '' as $$
  select greatest((c.v->>'boss_hp_min')::int, (c.v->>'boss_hp_osoba')::int * (
           select count(distinct r.user_id)::int from public.nauka_rp r
            where r.dzien > public.nauka_dzis() - 14
              and (cardinality(p_grupy) = 0 or public.nauka_rp_grupa(r.user_id) = any (p_grupy))))
    from (select public.nauka_gry2_cfg() v) c
$$;

-- Tworzy bossy dla terminów w oknie (raz; życie ustalane przy utworzeniu) i oznacza pokonane.
create or replace function public.nauka_boss_odswiez() returns void
language plpgsql security definer set search_path = '' as $$
declare c jsonb := public.nauka_gry2_cfg(); d date := public.nauka_dzis(); b record;
begin
  insert into public.nauka_boss (id, sid, typ, tytul, termin, start, grupy, hp)
  select x.id, x.data->>'subjectId', x.data->>'type', x.data->>'title', (x.data->>'date')::date,
         greatest(d, (x.data->>'date')::date - (c->>'boss_dni')::int), gr.g, public.nauka_boss_hp(gr.g)
    from public.nauka_docs x
    cross join lateral (select coalesce(array(select jsonb_array_elements_text(
                          case when jsonb_typeof(x.data->'groups') = 'array' then x.data->'groups' else '[]'::jsonb end)), '{}') g) gr
   where x.kolekcja = 'deadlines'
     and x.data->>'type' in ('kolokwium', 'egzamin')
     and coalesce(x.data->>'subjectId', '') <> ''
     and coalesce((x.data->>'approx')::boolean, false) = false
     and x.data->>'date' ~ '^\d{4}-\d{2}-\d{2}$'
     and (x.data->>'date')::date > d
     and (x.data->>'date')::date <= d + (c->>'boss_dni')::int
  on conflict (id) do nothing;
  -- termin przeniesiony przez starostę: boss idzie za nim (życie bez zmian)
  update public.nauka_boss nb set termin = (x.data->>'date')::date
    from public.nauka_docs x
   where x.kolekcja = 'deadlines' and x.id = nb.id and nb.pokonany_at is null
     and x.data->>'date' ~ '^\d{4}-\d{2}-\d{2}$' and (x.data->>'date')::date <> nb.termin;
  for b in select * from public.nauka_boss where pokonany_at is null and termin > d - 1 and not ukryty loop
    if (select coalesce(sum(ciosy), 0) from public.nauka_boss_ciosy(b.id)) >= b.hp then
      update public.nauka_boss set pokonany_at = now() where id = b.id and pokonany_at is null;
    end if;
  end loop;
end $$;

-- Bossy widoczne dla mnie: trwające i z ostatnich boss_odbior_dni dni (do odebrania nagrody / podsumowania).
create or replace function public.nauka_bossy() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare c jsonb := public.nauka_gry2_cfg(); d date := public.nauka_dzis(); v_grupa text; v_out jsonb;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  perform public.nauka_boss_odswiez();
  v_grupa := public.nauka_rp_grupa(auth.uid());
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', b.id, 'sid', b.sid, 'typ', b.typ, 'tytul', b.tytul, 'termin', b.termin, 'start', b.start, 'grupy', b.grupy,
      'hp', b.hp, 'zadane', z.suma, 'osob', z.osob, 'moje', coalesce(z.moje, 0),
      'stan', case when b.pokonany_at is not null then 'pokonany' when b.termin <= d then 'uciekl' else 'trwa' end,
      'pokonany_at', b.pokonany_at,
      'odebrane', exists (select 1 from public.nauka_rp r where r.user_id = auth.uid() and r.klucz = 'b:' || b.id),
      'mozna_odebrac', b.pokonany_at is not null and coalesce(z.moje, 0) >= (c->>'boss_min_ciosow')::int
                       and d <= b.termin + (c->>'boss_odbior_dni')::int
                       and not exists (select 1 from public.nauka_rp r where r.user_id = auth.uid() and r.klucz = 'b:' || b.id),
      'top', z.top) order by b.termin), '[]'::jsonb)
    into v_out
    from public.nauka_boss b
    cross join lateral (
      select coalesce(sum(k.ciosy), 0)::int suma, count(*) filter (where k.ciosy > 0)::int osob,
             max(k.ciosy) filter (where k.user_id = auth.uid()) moje,
             coalesce((select jsonb_agg(jsonb_build_object('nick', p.nick, 'ciosy', k2.ciosy, 'ja', k2.user_id = auth.uid()) order by k2.ciosy desc, lower(p.nick))
                         from (select * from public.nauka_boss_ciosy(b.id) order by ciosy desc limit 50) k2
                         join public.nauka_profil p on p.user_id = k2.user_id and p.w_rankingu and p.nick is not null
                        where not public.nauka_rp_admin_uid(k2.user_id)
                        limit 5), '[]'::jsonb) top
        from public.nauka_boss_ciosy(b.id) k) z
   where not b.ukryty
     and b.start <= d and d <= b.termin + (c->>'boss_odbior_dni')::int
     and (cardinality(b.grupy) = 0 or v_grupa = any (b.grupy) or public.nauka_admin());
  return jsonb_build_object('ok', true, 'bossy', v_out, 'min_ciosow', (c->>'boss_min_ciosow')::int, 'pkt', (c->>'boss_pkt')::int);
end $$;

-- Nagroda za pokonanego bossa: raz na bossa, dla osób z ≥ boss_min_ciosow ciosami, do boss_odbior_dni po terminie.
create or replace function public.nauka_boss_odbierz(p_id text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare c jsonb := public.nauka_gry2_cfg(); d date := public.nauka_dzis(); b public.nauka_boss; v_moje int; v_pkt int;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_rp_mozna() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  perform pg_advisory_xact_lock(hashtext('nauka_boss:' || auth.uid()::text));
  select * into b from public.nauka_boss where id = p_id and not ukryty;
  if not found then return jsonb_build_object('ok', false, 'code', 'no_boss'); end if;
  if b.pokonany_at is null then return jsonb_build_object('ok', false, 'code', 'not_defeated'); end if;
  if d > b.termin + (c->>'boss_odbior_dni')::int then return jsonb_build_object('ok', false, 'code', 'too_late'); end if;
  if exists (select 1 from public.nauka_rp r where r.user_id = auth.uid() and r.klucz = 'b:' || b.id) then
    return jsonb_build_object('ok', false, 'code', 'already');
  end if;
  select coalesce(max(ciosy), 0) into v_moje from public.nauka_boss_ciosy(b.id) where user_id = auth.uid();
  if v_moje < (c->>'boss_min_ciosow')::int then
    return jsonb_build_object('ok', false, 'code', 'too_few', 'moje', v_moje, 'trzeba', (c->>'boss_min_ciosow')::int);
  end if;
  v_pkt := public.nauka_rp_dodaj(auth.uid(), 'boss', 'b:' || b.id, b.sid, (c->>'boss_pkt')::int);
  return jsonb_build_object('ok', true, 'pkt', v_pkt);
end $$;

-- Starosta: zmiana życia bossa albo ukrycie (np. termin odwołany).
create or replace function public.nauka_admin_boss(p_id text, p_hp int default null, p_ukryty boolean default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if not public.nauka_admin() then return jsonb_build_object('ok', false, 'code', 'not_admin'); end if;
  if p_hp is not null and (p_hp < 10 or p_hp > 100000) then return jsonb_build_object('ok', false, 'code', 'bad_hp'); end if;
  update public.nauka_boss set hp = coalesce(p_hp, hp), ukryty = coalesce(p_ukryty, ukryty) where id = p_id;
  return jsonb_build_object('ok', found);
end $$;

-- =====================================================================
-- 7) Uprawnienia
-- =====================================================================
revoke execute on function
  public.nauka_rp_pula(text), public.nauka_gry2_cfg(),
  public.nauka_rp_odpowiedz(text, int, int, text, uuid), public.nauka_gra_start(text, text), public.nauka_gra_koniec(uuid, int, int, int),
  public.nauka_pyt_trudnosc(text[]), public.nauka_pyt_rok(text, int),
  public.nauka_haslo_slowo(date), public.nauka_haslo_wzor(text, text), public.nauka_haslo_dzis(), public.nauka_haslo_proba(text),
  public.nauka_boss_ciosy(text), public.nauka_boss_hp(text[]), public.nauka_boss_odswiez(), public.nauka_bossy(), public.nauka_boss_odbierz(text),
  public.nauka_admin_boss(text, int, boolean)
from public, anon, authenticated;

grant execute on function
  public.nauka_rp_odpowiedz(text, int, int, text, uuid), public.nauka_gra_start(text, text), public.nauka_gra_koniec(uuid, int, int, int),
  public.nauka_pyt_trudnosc(text[]), public.nauka_pyt_rok(text, int),
  public.nauka_haslo_dzis(), public.nauka_haslo_proba(text),
  public.nauka_bossy(), public.nauka_boss_odbierz(text), public.nauka_admin_boss(text, int, boolean)
to authenticated;

notify pgrst, 'reload schema';
```

## 3. API: `skrot-supabase.js` → `window.skrot.rp`

Dopisz do istniejącego obiektu `skrot.rp` (linia \~271), tym samym `rpCall`:

```js
    // v15 (docs/gry/SPEC-2.md)
    trudnosc: (klucze)                 => rpCall("nauka_pyt_trudnosc", { p_klucze: klucze }),          // ["<mid>:<idx>", …] max 80
    rok:      (mid, idx)               => rpCall("nauka_pyt_rok", { p_mid: mid, p_idx: idx }),
    haslo:    ()                       => rpCall("nauka_haslo_dzis"),
    hasloProba: (slowo)                => rpCall("nauka_haslo_proba", { p_proba: slowo }),
    bossy:    ()                       => rpCall("nauka_bossy"),
    bossOdbierz: (id)                  => rpCall("nauka_boss_odbierz", { p_id: id }),
    bossAdmin: (id, { hp = null, ukryty = null } = {}) => rpCall("nauka_admin_boss", { p_id: id, p_hp: hp, p_ukryty: ukryty }),
```

**Odpowiedzi (dokładnie z testów):**

| Wywołanie | Odpowiedź |
| --- | --- |
| `trudnosc(["m1:0","m1:1","m1:2"])` | `{ ok: true, pyt: { "m1:0": { n: 6, proc: 50 }, "m1:1": { n: 6, proc: 100 } } }` (brak klucza = za mało danych) |
| `rok("m1", 0)` | `{ ok: true, n: 6, za_malo: false, rozklad: [1, 3, 1, 1] }` – indeksy w **oryginalnej** kolejności opcji |
| `rok("m1", 2)` | `{ ok: true, n: 0, za_malo: true }` |
| `haslo()` w trakcie | `{ ok, dzien, nr: 1, dlugosc: 7, sid, max: 6, proby: ["QQQQQQQ"], wzory: ["0000000"], podpowiedz: null, koniec: false, wynik: null, pkt: 0, seria: 0, slowo: null, pl: null, def: null, mid: null, stat: null }` |
| `hasloProba("QQQQQQQ")` | `{ ok: true, wzor: "0000000", proba: 1, koniec: false, wynik: null, pkt: 0 }` |
| `hasloProba(<dobre>)` | `{ ok: true, wzor: "2222222", proba: 4, koniec: true, wynik: 4, pkt: 12 }` |
| `haslo()` po końcu | jak wyżej + `slowo: "Revenue", pl: "przychód", def, mid, seria: 1, stat: { grali, zgadli, rozklad: [nieudane, w 1., … w 6.] }` (`stat` = `null` przy < 5 osobach) |
| `bossy()` | `{ ok, min_ciosow: 10, pkt: 50, bossy: [{ id, sid, typ, tytul, termin, start, grupy, hp, zadane, osob, moje, stan: "trwa" \| "pokonany" \| "uciekl", pokonany_at, odebrane, mozna_odebrac, top: [{ nick, ciosy, ja }] }] }` |
| `bossOdbierz(id)` | `{ ok: true, pkt: 50 }` albo `code`: `not_defeated`, `too_few` (+ `moje`, `trzeba`), `already`, `too_late`, `no_access` |

**Nowe kody błędów (teksty PL → EN w sekcjach gier):** `bad_length`, `bad_letters`, `repeated`, `finished`, `no_words` (Hasło), `too_many` (trudność), `not_defeated`, `too_few`, `already`, `too_late`, `no_boss` (Boss). Każdy `not_enabled` = brak v15 → kafelek gry z chipem „wkrótce”, bez błędu.

**Uwaga dla wszystkich miejsc, które wołają `rp.odp`:** v15 zapisuje `wybor`, więc musi to być indeks w **oryginalnej** kolejności opcji. Etap 0 już tak robi (quiz: `LP.st.ans[card.id]`, gry: indeks przed tasowaniem) – nie zmieniaj tego.

## 4. Drabina (etap 8)

Teleturniej dla jednej osoby: 12 pytań z wybranego przedmiotu, od najłatwiejszego do najtrudniejszego. Trudność to prawdziwa skuteczność roku na danym pytaniu, a nie zgadywanie. Gra w DOM w nakładce `gry.js` (jak Pary), z rundą `rp.start("drabina", sid)` / `rp.koniec`.

### 4.1 Zasady

|  | Wartość |
| --- | --- |
| Szczeble | 12 |
| Szczeble gwarantowane | 4 i 8 (z `nauka_gry2_cfg().drabina_progi`, w przeglądarce stała `GRY_CFG.drabina.progi = [4, 8]`) |
| Czas na pytanie | 30 s (szczeble 1–8), 45 s (9–12) |
| Dobra odpowiedź | wchodzisz o szczebel wyżej |
| Zła odpowiedź / koniec czasu | koniec; wynik = ostatni osiągnięty szczebel gwarantowany (0, 4 albo 8) |
| „Zatrzymaj się” | od szczebla 1: koniec z wynikiem = obecny szczebel (zabierasz wszystko) |
| Wynik do bazy | `wynik` = szczebel końcowy (0–12), `czasMs` |
| Punkty rankingu | +10 za każdą pierwszą dziś dobrą odpowiedź (jak wszędzie) + za wynik: 4 → +5, 8 → +10, 12 → +20 (baza) |
| XP | +5 ⚡ za dobrą odpowiedź (`A.xp(GRY_CFG.xpPerCorrect)`) |
| Pomyłka | `A.onWrong(q)` – fiszki materiału do Powtórek (jak w innych grach) |

Napięcie gry: po szczeblu 9 zła odpowiedź spycha na 8, a „Zatrzymaj się” daje 9. Przycisk zawsze pokazuje stawkę: „Zatrzymaj się (zabierasz 9)”, a pod pytaniem drobnym drukiem: „Zła odpowiedź = spadasz na 8”.

### 4.2 Dobór 12 pytań (`A.ladder(sid)` w `index.html`)

1. `pool = await gryQuestions(sid, 40)` (istniejąca funkcja; już bierze „pomylone” i zakres zaliczenia, już pobiera „Dlaczego?”).
2. `t = await rp.trudnosc(pool.map(q => q.materialId + ":" + q.index))` (offline / `not_enabled` → `t.pyt = {}`).
3. Łatwość pytania: `proc` z `t.pyt[klucz]`, a gdy brak – 60; +10, gdy pytanie ma 2 opcje (prawda/fałsz).
4. Posortuj malejąco po łatwości (remis: `lpShuffle` z seedem rundy). Przy `N ≥ 12` weź indeksy `round(i × (N − 1) / 11)` dla `i = 0…11` – drabina rozciąga się od najłatwiejszego do najtrudniejszego. Przy `N < 12` → kafelek wyszarzony „za mało pytań” (próg `GRY_CFG.minQuestions` = 20 i tak to wyłapuje).
5. Każde pytanie ma pole `rokProc` (albo `null`) – pokazujemy je **po** odpowiedzi: „64% roku odpowiada dobrze”.

### 4.3 Koła ratunkowe (każde raz na rundę)

| Koło | Działanie | Kiedy wyłączone |
| --- | --- | --- |
| **50:50** | ukrywa 2 złe odpowiedzi (losowo z seeda) | pytanie z 2 opcjami |
| **Zapytaj rok** | `rp.rok(mid, idx)` → poziome paski przy każdej odpowiedzi z % roku (indeksy oryginalne → przelicz na kolejność na ekranie); podpis „{n} osób z roku”. `za_malo: true` → komunikat „Rok jeszcze za mało odpowiadał na to pytanie” i **koło się nie zużywa** | offline |
| **Notatka** | na 15 s pokazuje pierwsze zdanie streszczenia materiału, z którego jest pytanie: `A.noteOf(mid)` = `lpFirstSentence(S.content[mid]?.tldr \|\| S.content[mid]?.purpose \|\| "")`; brak tekstu → koło wyszarzone dla tego pytania | brak notatki |

Zegar pytania **nie** stoi podczas używania kół. Po użyciu koło jest przekreślone.

### 4.4 Ekran

```
✕  Drabina · Makroekonomia                        ⏸  🔇
┌── Drabina ──┐  ┌── Szczebel 6 z 12 · 0:23 ──────────────────┐
│ 12         │  │ Co się dzieje z popytem, gdy rośnie cena dobra    │
│ 11         │  │ komplementarnego?                                    │
│ 10         │  │                                                     │
│  9         │  │ [A] Rośnie                                           │
│  8 ◆       │  │ [B] Spada                         ███████ 64%       │
│  7         │  │ [C] Nie zmienia się                ██ 12%           │
│ ▶ 6       │  │ [D] Najpierw rośnie, potem spada   ███ 24%          │
│  5 ✓       │  │                                                     │
│  4 ◆✓      │  │ [ 50:50 ]  [ Zapytaj rok ✓ ]  [ Notatka ]          │
│  …         │  │ Zatrzymaj się (zabierasz 5) · Zła odpowiedź = spadasz na 4 │
└────────────┘  └────────────────────────────────────────────────────┘
```

- **Komputer (≥ 900 px):** drabina po lewej (kolumna 160 px), pytanie po prawej. **Telefon:** drabina jako poziomy pasek 12 kropek nad pytaniem (osiągnięte – pełne `--accent`, gwarantowane – romb `--lime-400`, bieżąca – pulsuje), pod spodem „Szczebel 6 z 12”.
- Pytanie i odpowiedzi `translate="no"`; opcje 56 px, litery A–D, klawisze 1–4 / A–D; koła: klawisze F (50:50), R (Zapytaj rok), N (Notatka); „Zatrzymaj się”: S.
- Po odpowiedzi: dobra – zielona, jedno zdanie „Dlaczego?”, „64% roku odpowiada dobrze” (gdy `rokProc`), przycisk „Wyżej →” (autofocus); wejście na szczebel gwarantowany – `banner("Szczebel 4 zabezpieczony")`. Zła – wybrana czerwona, dobra zielona, „Dlaczego?”, przycisk „Zobacz wynik”.
- Szczebel 12 – `confetti(46)`, `banner("Cała Drabina! 🏆")`.
- Ekran wyniku: wspólny z rdzenia (`endRound`), jednostka „szczebli”, rekord = najwyższy szczebel (dla całej gry, nie per przedmiot).

### 4.5 Wpięcie w `gry.js` i `index.html`

- `gry.js`: obiekt `DRABINA` w nowym pliku **`gry-drabina.js`**, ładowanym leniwie jak Przejdź: `LAZY.drabina = "gry-drabina.js"`, `UNITS.drabina = "szczebli"`, `TITLES.drabina = "Drabina"`. Rozmiar `gry.js` nie rośnie.
- `GRY_CFG.drabina = { n: 12, progi: [4, 8], sec: [30, 45], noteSec: 15 }`.
- `index.html`: `GRY_API.ladder = gryLadder` (4.2), `GRY_API.noteOf`, `GRY_TILES` + `{ id: "drabina", name: "Drabina", ic: "🪜", text: "12 pytań coraz trudniejszych. Zapytaj rok, gdy nie wiesz.", min: "ok. 4–6 min" }`, rekordy tygodnia `rp.rekordy("drabina")`.

### 4.6 Uogólnienie gier DOM w rdzeniu (zrób w tym etapie)

Dziś `newRun()` dla każdej gry `dom` pobiera `A.pairs(...)`, a `mountDom()` sprawdza „< 6 par”. Zmień na kontrakt:

```js
// gra DOM deklaruje:
{ dom: true,
  load: (A, sid, run) => Promise<treść>,          // Pary: A.pairs(sid, 10, run.tryb); Drabina: A.ladder(sid)
  enough: (treść) => true | "komunikat",            // Pary: >= 6 par; Drabina: === 12 pytań
  mount(ctx) { … },                                 // ctx = { content, rnd, box, cb, run, A } – Pary dostaje content zamiast pairs
}
```

Pary po zmianie muszą działać identycznie – powtórz checklistę Par z etapu 3.

### 4.7 Teksty (PL → EN)

| PL | EN |
| --- | --- |
| Drabina | Ladder |
| 12 pytań coraz trudniejszych. Zapytaj rok, gdy nie wiesz. | 12 questions, each harder. Ask your year when you're stuck. |
| Szczebel {0} z 12 | Step {0} of 12 |
| szczebli | steps |
| Zatrzymaj się (zabierasz {0}) | Stop here (keep {0}) |
| Zła odpowiedź = spadasz na {0} | Wrong answer = you drop to {0} |
| Szczebel {0} zabezpieczony | Step {0} secured |
| Cała Drabina! 🏆 | The whole Ladder! 🏆 |
| Wyżej → | Up → |
| Zapytaj rok | Ask your year |
| Notatka | Note |
| {0} osób z roku | {0} people from your year |
| Rok jeszcze za mało odpowiadał na to pytanie | Not enough of your year has answered this yet |
| {0}% roku odpowiada dobrze | {0}% of your year gets this right |

## 5. Hasło dnia (etap 7)

Codziennie jedno angielskie pojęcie z materiałów roku, takie samo dla wszystkich. 6 prób na odgadnięcie; po każdej próbie litery dostają kolory. Litery sprawdza baza, a słowo trafia do przeglądarki dopiero po końcu gry, więc nie da się go podejrzeć w kodzie strony.

To **osobny widok w `index.html`** (`#/haslo`, `view: "haslo"`), nie nakładka `gry.js`: jedna gra dziennie, bez rundy `rp.start` i bez canvasu.

### 5.1 Zasady

|  | Wartość |
| --- | --- |
| Słowo | jedno słowo EN z `concepts[].term` materiałów roku, same litery, 5–9 znaków; nie powtarza się przez rok |
| Próby | 6; próba = dowolne litery A–Z o długości słowa (bez słownika: to gra do nauki, nie ortografii) |
| Kolory | `2` dobre miejsce – `--accent` (biała litera) · `1` jest w słowie gdzie indziej – `--lime-400` (ciemna litera `--green-900`) · `0` brak – `--sunk` (szara litera) |
| Podpowiedź | po 3 nieudanych próbach baza zwraca `podpowiedz` = definicja ze słowem zakrytym `_____`; pokazujemy ją nad planszą |
| Przedmiot | widoczny od początku (chip z kolorem przedmiotu z `sid`) |
| Punkty rankingu | 1.–2. próba +20, 3. +15, 4. +12, 5. +10, 6. +8, nieodgadnięte 0 (baza, tylko z pełnym dostępem) |
| Kto gra | każdy **zalogowany**, także bez dostępu – to wizytówka strony; bez dostępu pod wynikiem: „Z pełnym dostępem to byłoby +12 pkt rankingu” + „Kup dostęp” |
| Nowe hasło | o północy czasu polskiego (`nauka_dzis()`) |

### 5.2 Plansza i klawiatura

```
← Graj                                       Hasło dnia #12   🔥 3
                 [ Makroekonomia ]   7 liter · próba 3 z 6

                 │Q│Q│Q│Q│Q│Q│Q│    ← szare
                 │R│A│T│E│S│ │ │    ← R zielone, E żółtolimonkowe…
                 │ │ │ │ │ │ │ │    ← bieżący wiersz (obwódka --accent)
                 │ │ │ │ │ │ │ │
                 │ │ │ │ │ │ │ │
                 │ │ │ │ │ │ │ │
 Podpowiedź: „Money a firm earns from _______.”   (po 3. próbie)

   Q W E R T Y U I O P
    A S D F G H J K L
  [Enter] Z X C V B N M [⌫]
```

- Kafelek: kwadrat `min(56px, (szerokość − 32 − odstępy) / długość)`, odstęp 6 px; słowo 9-literowe na 360 px musi się zmieścić bez przewijania.
- Klawiatura na ekranie (QWERTY, tylko A–Z) + fizyczna (litery, Enter, Backspace). Klawisze dostają najlepszy znany stan litery (2 > 1 > 0). Klawisz min. 32 × 48 px na telefonie.
- Enter przy niepełnym wierszu → wiersz drga 300 ms + „Wpisz {n} liter”. Powtórzona próba (`repeated`) → „To słowo już było”.
- Wysłanie: klawiatura zablokowana do odpowiedzi `rp.hasloProba`; potem kafelki obracają się po kolei co 250 ms (`reduced()` → od razu). Błąd sieci → „Nie udało się sprawdzić. Spróbuj jeszcze raz.”, wiersz zostaje wpisany, próba się nie zużywa (baza jej nie zapisała).
- **Daltonizm:** stan `1` ma dodatkowo przerywaną obwódkę, stan `2` – ciągłą grubą; nie polegamy tylko na kolorze.
- Dostępność: plansza `role="grid"`, każdy kafelek `aria-label` „Litera R, dobre miejsce” / „…jest gdzie indziej” / „…nie ma w słowie”; po próbie `aria-live="polite"` czyta cały wiersz.
- Cała plansza `translate="no"` (słownik EN nie może zmieniać liter).
- Stan wpisywanego wiersza w `sessionStorage["bm-haslo-wpis"]` (odświeżenie strony nie kasuje liter); zapisane próby zawsze z bazy (`rp.haslo()`).
- Zmiana dnia przy otwartym widoku: przed każdą próbą porównaj `dzien` z dzisiejszą datą; inna → `rp.haslo()` i nowa plansza z komunikatem „Jest już nowe hasło”.

### 5.3 Po końcu gry

```
✓ Hasło dnia #12 · 4/6                          +12 pkt rankingu
REVENUE — przychód
Money a firm earns from sales.
Z materiału: Przychód, koszty, zysk →
[ Udostępnij wynik ]  [ Dodaj do Powtórek ]

🔥 Seria: 3 dni
Jak poszło rokowi (41 osób, 78% zgadło)
1 ▂  2 ▅  3 ▇  4 █ ← Ty  5 ▄  6 ▂  ✗ ▃
Następne hasło za 5 h 12 min
```

- „Z materiału” → `go({ view: "material", id: mid })`, tylko gdy `materialById(mid)` jest dostępny (`readable`).
- „Dodaj do Powtórek” → `srsAdd([glKey(sid, slowo)])` + toast; przycisk znika, gdy klucz już jest w `srsAll()`.
- Wykres rozkładu: 7 poziomych pasków (`stat.rozklad[1..6]` + nieodgadnięte `stat.rozklad[0]`), mój wiersz pogrubiony; `stat: null` → „Statystyki roku pojawią się, gdy zagra co najmniej 5 osób”.
- Licznik do północy odliczany co minutę.
- Nieodgadnięte: „Tym razem się nie udało. Hasło: REVENUE” + to samo (definicja, materiał, Powtórki). Seria się zeruje.

### 5.4 Udostępnianie (najważniejsze dla promocji)

Tekst bez słowa, gotowy do wklejenia na grupę roku:

```
Hasło dnia Skrót BM #12 · 4/6 🔥3
⬜⬜⬜⬜⬜⬜⬜
🟩⬜⬜🟨⬜⬜⬜
🟩🟨⬜🟩⬜⬜⬜
🟩🟩🟩🟩🟩🟩🟩
skrotbm.pl
```

- `2` → 🟩, `1` → 🟨, `0` → ⬜; nieodgadnięte → „X/6”; seria tylko przy ≥ 2.
- `navigator.share({ text })`, gdy dostępne (telefon); inaczej `navigator.clipboard.writeText` + toast „Skopiowano – wklej na grupę roku”. W EN: „Skrót BM Word of the day #12”.

### 5.5 Wejścia

| Miejsce | Element | Warunek |
| --- | --- | --- |
| Dziś | karta `sk-row-big` na górze listy: „🔤 Hasło dnia #12 – 7 liter, Makroekonomia” → `go({ view: "haslo" })`; po rozwiązaniu zamienia się w małą linię „✓ Hasło dnia 4/6 · 🔥 3” | zalogowany; `rp.haslo()` pobierane raz na sesję, leniwie po 2 s |
| Graj | kafelek „Hasło dnia” (jak inne gry, ale prowadzi do widoku) z chipem „nowe” / „4/6” | zalogowany |
| Więcej → Nauka | wiersz „Hasło dnia” | zalogowany |

`no_words` (pusta pula) → wejścia ukryte; starosta (`S.canEdit`) widzi zamiast tego notkę „Hasło dnia czeka na pojęcia w materiałach”.

### 5.6 Teksty (PL → EN)

| PL | EN |
| --- | --- |
| Hasło dnia | Word of the day |
| Hasło dnia #{0} | Word of the day #{0} |
| {0} liter | {0} letters |
| próba {0} z {1} | try {0} of {1} |
| Wpisz {0} liter | Type {0} letters |
| To słowo już było | You already tried that |
| Podpowiedź: | Hint: |
| Litera {0}, dobre miejsce | Letter {0}, right spot |
| Litera {0}, jest gdzie indziej | Letter {0}, wrong spot |
| Litera {0}, nie ma w słowie | Letter {0}, not in the word |
| Nie udało się sprawdzić. Spróbuj jeszcze raz. | Couldn't check. Try again. |
| Jest już nowe hasło | There's a new word now |
| Udostępnij wynik | Share result |
| Skopiowano – wklej na grupę roku | Copied – paste it in your year's group chat |
| Dodaj do Powtórek | Add to Reviews |
| Z materiału: | From: |
| Seria: {0} dni | Streak: {0} days |
| Jak poszło rokowi | How your year did |
| Statystyki roku pojawią się, gdy zagra co najmniej 5 osób | Year stats appear once at least 5 people have played |
| Następne hasło za {0} | Next word in {0} |
| Tym razem się nie udało. Hasło: {0} | Not this time. The word was {0} |
| Z pełnym dostępem to byłoby +{0} pkt rankingu | With full access this would be +{0} ranking pts |
| Hasło dnia czeka na pojęcia w materiałach | Word of the day needs terms in the materials |

## 6. Boss przed kolokwium (etap 9)

Wspólna walka całego roku. 7 dni przed kolokwium albo egzaminem pojawia się boss przedmiotu z paskiem życia. Każda dobra odpowiedź kogokolwiek z roku na pytanie z tego przedmiotu – w quizie, grze, Drabinie, zadaniu – to cios. Jeśli rok pokona bossa przed terminem, każdy, kto zadał co najmniej 10 ciosów, odbiera +50 pkt rankingu. Nic nie trzeba robić „w grze”: boss liczy zwykłą naukę, a strona pokazuje jej efekt.

### 6.1 Zasady (liczy baza, sekcja 2)

|  | Wartość |
| --- | --- |
| Kiedy się pojawia | termin z kolekcji `deadlines`, typ `kolokwium` lub `egzamin`, z przedmiotem, **bez** `approx`, za 1–7 dni |
| Dla kogo | termin bez `groups` → cały rok; z `groups` → tylko te grupy (ciosy też tylko od nich) |
| Życie | ustalane raz, przy pojawieniu się: 12 × osoby aktywne w ostatnich 14 dniach (z tych grup), min. 150. Starosta może zmienić |
| Cios | dobra odpowiedź ABCD = 1, dobre zadanie liczbowe = 3; to samo pytanie liczy się raz na osobę dziennie; max 40 ciosów na osobę dziennie |
| Okno | od pojawienia się do północy przed dniem terminu |
| Pokonany | suma ciosów ≥ życie (baza oznacza moment) |
| Nagroda | +50 pkt rankingu (źródło `boss`), raz na bossa, przy ≥ 10 ciosach, do 14 dni po terminie; z v14 – także monety |
| Nie pokonany do terminu | stan `uciekl`, bez kary; podsumowanie „Zabrakło 12% życia” |
| Termin przesunięty przez starostę | boss idzie za nowym terminem, życie bez zmian |
| Termin usunięty / odwołany | starosta ukrywa bossa w panelu (6.5) |

### 6.2 Imiona i wygląd

Imię bossa zależy od przedmiotu (`BOSS_NAMES` w `index.html`); przedmiot bez wpisu → „Potwór z {przedmiot}”:

| Przedmiot (`sid`) | Imię PL | EN | Pomysł na rysunek |
| --- | --- | --- | --- |
| `makroekonomia` | Inflator | The Inflator | nadmuchany balon z banknotów |
| `prawo` | Paragrafus | Paragraphus | potwór w kształcie „§” w todze |
| `podstawy-finansow` | Odsetkus | Compoundus | świnka-skarbonka z kłami |
| `analiza-matematyczna` | Całkozaur | Integrasaurus | dinozaur z ogonem w kształcie ∫ |
| `ekonomia-biznesu` | Monopolis | Monopolis | wieżowiec z oczami |
| `logistyka` | Wielki Korek | Gridlock | ciężarówka z kontenerów |
| `podstawy-zarzadzania` | Biurokrator | Bureaucrator | stos segregatorów |
| `zarzadzanie-zasobami-ludzkimi` | Rekruter | The Recruiter | krawat z mackami |
| `ochrona-wlasnosci-intelektualnej` | Plagiator | Plagiator | kserokopiarka z zębami |
| `narzedzia-it-w-zarzadzaniu` | Bug | The Bug | robak z ikoną błędu |

Rysunki: prosty płaski SVG w stylu `ART` (obrys `#0E5A30`, wypełnienia z palety + kolor przedmiotu), jeden szablon „ciało + oczy + rekwizyt”, 120 × 120. Stany: `trwa` – lekko się kołysze (bez ruchu przy `reduced()`), przy życiu < 25% – pot i plaster; `pokonany` – leży z „X” zamiast oczu; `uciekl` – tylko kurz i strzałka. **Nie wzoruj się na postaciach z gier ani bajek.**

### 6.3 Widok `boss` (`#/boss/<id>`) i karta na Dziś

**Karta na Dziś** (pierwsza na liście, gdy jest boss `trwa` albo do odebrania; `sk-hero`, kolor obramowania = kolor przedmiotu):

```
⚔️  Inflator · kolokwium z Makroekonomii za 3 dni
[███████████░░░░░░░░░]  412 / 720 życia zabrane · 31 osób walczy
Twoje ciosy: 18   [ Zadaj cios → ]
```

- Pasek pokazuje **zabrane** życie (rośnie, jak postęp), kolor przedmiotu na `--sunk`.
- „Zadaj cios” → `quizOpen` z 10 pytań tego przedmiotu (`gryQuestions(sid, 10)`) z tytułem „Cios w Inflatora”. Pod spodem link „albo zagraj” → Graj z wybranym tym przedmiotem.
- Po powrocie z quizu/gry: `rp.bossy()` jeszcze raz; gdy `moje` wzrosło – animacja trafienia (boss mruga na czerwono, „−12” unosi się, 600 ms; nic przy `reduced()`).
- Karta `pokonany` + `mozna_odebrac`: „Rok pokonał Inflatora! \[ Odbierz +50 pkt \]” → `rp.bossOdbierz(id)` → `confetti(46)`, banner. `too_few` → „Zadałeś {moje} z {trzeba} ciosów – tym razem bez nagrody”.
- Kilka bossów naraz → jedna karta z najbliższym terminem + „+1 boss” (link do widoku).

**Widok pełny** (`#/boss/<id>`): duży rysunek, pasek, liczby (życie, zabrane, osoby, do terminu – licznik dni i godzin), „Twoje ciosy”, **najlepsi wojownicy** (`top`: max 5 pseudonimów z rankingu, widoczni tylko ci z włączoną widocznością), przycisk „Zadaj cios”, krótkie zasady (zwijane): „Każda dobra odpowiedź z {przedmiot} to cios, zadanie liczbowe – 3 ciosy. Nagroda dla osób z min. 10 ciosami.”

**Odświeżanie:** `rp.bossy()` przy wejściu na Dziś (raz na 60 s, nie przy każdym `render()`), przy wejściu w widok i co 60 s, gdy widok jest otwarty i karta na wierzchu.

### 6.4 Starosta i ogłoszenie

- Gdy boss się pojawia, na Dziś u starosty (`S.canEdit`) chip „Nowy boss – ogłoś rokowi” → `modal` z gotowym tekstem do skopiowania na grupę: „⚔️ Inflator atakuje! Kolokwium z Makro {data}. Każda dobra odpowiedź na skrotbm.pl to cios. Jeśli go pokonamy do {dzień przed}, każdy z 10+ ciosami dostaje +50 pkt.” (przycisk „Kopiuj”).
- Pokonany boss: ten sam chip z tekstem „Rok pokonał Inflatora w 3 dni! Odbierzcie nagrodę na Dziś.”

### 6.5 Panel starosty

W „Gry i ranking” (etap 2) nowa sekcja „Bossy”: lista z `rp.bossy()` (starosta widzi wszystkie grupy), przy każdym: „Zmień życie” (pole liczby → `rp.bossAdmin(id, { hp })`) i „Ukryj” (`confirm` → `{ ukryty: true }`).

### 6.6 Teksty (PL → EN)

| PL | EN |
| --- | --- |
| Zadaj cios | Strike |
| Cios w {0} | Strike at {0} |
| {0} / {1} życia zabrane | {0} / {1} health taken |
| {0} osób walczy | {0} people fighting |
| Twoje ciosy: {0} | Your strikes: {0} |
| kolokwium z {0} za {1} dni | {0} test in {1} days |
| Rok pokonał {0}! | Your year beat {0}! |
| Odbierz +{0} pkt | Claim +{0} pts |
| Zadałeś {0} z {1} ciosów – tym razem bez nagrody | You struck {0} of {1} times – no reward this time |
| {0} uciekł. Zabrakło {1}% życia. | {0} got away. {1}% health left. |
| Najlepsi wojownicy | Top fighters |
| Nowy boss – ogłoś rokowi | New boss – tell your year |
| Potwór z {0} | The {0} Monster |
| Zmień życie | Change health |
| Ukryj | Hide |

### 6.7 Cykl bossa

&#91;embedded content: cykl bossa · od terminu do nagrody\]

Ciosy płyną przez całe okno z dobrych odpowiedzi w quizach, grach i zadaniach; nagrodę odbiera się ręcznie na ekranie Dziś.

## 7. Testy i checklisty odbioru

**Baza:** przypadki H1–H8, D1–D6, B1–B9 z sekcji 2 jako `supabase/test/v15.sql` (styl jak `test/v13.sql`: schemat `test`, komunikat „OK …” po każdym, wyjątek przy pierwszym błędzie), dopisane do kolejności w `test/pglite.mjs`: `… "skrot-v13-gry.sql", "skrot-v15-gry2.sql", "skrot-v15-gry2.sql", "test/v13.sql", "test/v15.sql"`. Oba pliki testów muszą przejść po v15. Uwaga przy terminach w testach: daty licz od `nauka_dzis()`, nie wpisuj na sztywno.

**Strona:** Playwright na atrapie `skrot-supabase.js` jak w etapach 1–5 (390 × 844 i 1280 × 800, PL i EN, konto płatne / darmowe / starosta, „Mniej animacji”, motyw różowy). Atrapa `rp` dostaje nowe funkcje z kształtami z sekcji 3.

**Etap 6 (SQL + API)**

- [ ] `test/v13.sql` i `test/v15.sql` przechodzą po v15 uruchomionym dwa razy
- [ ] Strona bez v15 (`not_enabled`): Fruń, Pary, Przejdź, quizy działają jak dotąd, zero błędów w konsoli

**Etap 7 (Hasło dnia)**

- [ ] Pusta plansza w długości słowa; 9 liter mieści się na 360 px
- [ ] Klawiatura ekranowa i fizyczna; Enter przy niepełnym wierszu – drgnięcie i komunikat
- [ ] Kolory i klawisze zgodne z `wzor` z bazy (w tym powtórzone litery: test na słowie z dwoma „E”)
- [ ] Po 3 próbach pojawia się podpowiedź
- [ ] Trafienie i 6 nieudanych – ekran końca, słowo, definicja, materiał, „Dodaj do Powtórek”
- [ ] Odświeżenie strony w trakcie: zapisane próby wracają z bazy, wpisywany wiersz z `sessionStorage`
- [ ] Udostępnij: tekst bez słowa, emoji zgodne z planszą; `navigator.share` na telefonie, schowek na komputerze
- [ ] Konto bez dostępu: gra działa, 0 pkt, linia z zachętą
- [ ] Karta na Dziś przed i po rozwiązaniu; kafelek na Graj
- [ ] Daltonizm: stany 1 i 2 różnią się obwódką (zrzut w skali szarości)
- [ ] Czytnik ekranu czyta wiersz po próbie
- [ ] Brak sieci przy wysyłaniu – komunikat, próba nie znika

**Etap 8 (Drabina)**

- [ ] Pary po uogólnieniu rdzenia (4.6) przechodzą całą checklistę z etapu 3
- [ ] 12 pytań ułożonych od łatwych (atrapa `trudnosc`: proc 95 → 20)
- [ ] Dobra odpowiedź – szczebel wyżej; szczebel 4 i 8 – banner „zabezpieczony”
- [ ] Zła na 6 → wynik 4; zła na 3 → wynik 0; „Zatrzymaj się” na 9 → wynik 9
- [ ] Koniec czasu = zła odpowiedź
- [ ] 50:50 ukrywa 2 złe; wyłączone przy 2 opcjach
- [ ] Zapytaj rok: paski w kolejności z ekranu (sprawdź na pytaniu z przetasowanymi opcjami); `za_malo` – koło się nie zużywa
- [ ] Notatka na 15 s; brak notatki – koło wyszarzone
- [ ] Klawisze 1–4, F, R, N, S
- [ ] `rp.odp` z `zrodlo: "gra"`, `run` i indeksem oryginalnym; `rp.koniec` z wynikiem jak wyżej
- [ ] Układ: drabina z boku (1280), pasek kropek (390)
- [ ] `gry.js` nie urósł (Drabina w `gry-drabina.js`)

**Etap 9 (Boss)**

- [ ] Atrapa `bossy`: `trwa` / `pokonany` + `mozna_odebrac` / `uciekl` / dwa bossy naraz – karta na Dziś dla każdego stanu
- [ ] „Zadaj cios” otwiera quiz 10 pytań z przedmiotu; po powrocie odświeżenie i animacja trafienia (bez niej przy „Mniej animacji”)
- [ ] Odbiór: ok → konfetti; `too_few` → komunikat z liczbami; `already` → karta znika
- [ ] Widok `#/boss/<id>`: licznik do terminu, najlepsi wojownicy tylko z pseudonimami
- [ ] Starosta: chip „ogłoś rokowi” z tekstem do skopiowania; panel – zmiana życia, ukrycie
- [ ] `rp.bossy()` najwyżej raz na 60 s na Dziś (licznik wywołań w atrapie)
- [ ] Rysunki 10 bossów + domyślny; stany trwa / < 25% / pokonany / uciekł
- [ ] EN: imiona i teksty z 6.6

## 8. Prompty do Claude Code

Najpierw wyeksportuj ten dokument jako Markdown i zapisz w repo jako `docs/gry/SPEC-2.md`. Każdy prompt wklejasz w nowej sesji Claude Code w folderze `skrot-bm`. Plik SQL z sekcji 2 leży też w projekcie „szkoła app” jako `claude/skrot-v15-gry2.sql`.

**Etap 6 – baza i API**

```
Przeczytaj docs/gry/SPEC.md (sekcja 0) i docs/gry/SPEC-2.md (sekcje 0–3, 7). Zrób etap 6 na gałęzi gry-etap-6:
1. Utwórz supabase/skrot-v15-gry2.sql dokładnie z sekcji 2 SPEC-2.
2. Napisz supabase/test/v15.sql (przypadki H1–H8, D1–D6, B1–B9) w stylu test/v13.sql i dopisz v15 + testy do test/pglite.mjs.
   Uruchom: oba pliki testów mają przejść. Pokaż mi wynik.
3. Dopisz nowe funkcje do skrot.rp w skrot-supabase.js (sekcja 3).
4. Dopisz akapit do prywatnosc.html (koniec sekcji 2). README: rozdział „Gry 2 (v15)”.
5. Sprawdź, że bez v15 w bazie strona działa jak dotąd.
Nie pushuj na main. Na koniec napisz mi po polsku, co mam wkleić w Supabase.
```

**Etap 7 – Hasło dnia**

```
Przeczytaj docs/gry/SPEC.md (sekcja 0) i docs/gry/SPEC-2.md (sekcje 3, 5, 7 „Etap 7”). Etap 6 jest na main.
Zrób Hasło dnia na gałęzi gry-etap-7: widok #/haslo w index.html (plansza, klawiatura, ekran końca, udostępnianie),
wejścia z 5.5, teksty 5.6 do i18n-en.js. Cała checklista „Etap 7” w Playwright + zrzuty ekranu planszy w trakcie i po końcu
(390 i 1280 px, PL i EN). Nie pushuj na main.
```

**Etap 8 – Drabina**

```
Przeczytaj docs/gry/SPEC.md (sekcje 0, 5) i docs/gry/SPEC-2.md (sekcje 3, 4, 7 „Etap 8”). Zrób etap 8 na gałęzi gry-etap-8:
1. Najpierw uogólnienie gier DOM w gry.js (4.6) i pełna checklista Par z etapu 3 – Pary mają działać identycznie.
2. Potem Drabina w nowym pliku gry-drabina.js (ładowanym jak gry-przejdz.js), A.ladder i A.noteOf w index.html, kafelek, rekordy.
3. Teksty 4.7. Checklista „Etap 8”. Nie pushuj na main.
```

**Etap 9 – Boss przed kolokwium**

```
Przeczytaj docs/gry/SPEC.md (sekcja 0) i docs/gry/SPEC-2.md (sekcje 3, 6, 7 „Etap 9”). Zrób etap 9 na gałęzi gry-etap-9:
karta na Dziś, widok #/boss/<id>, rysunki 10 bossów + domyślny (własne, płaskie SVG w stylu ART, bez wzorowania się na istniejących postaciach),
ogłoszenie dla starosty, sekcja Bossy w panelu „Gry i ranking”, teksty 6.6. Checklista „Etap 9”. Nie pushuj na main.
```

**Po każdym etapie (Ty):** przejrzyj zmiany, uruchom SQL po etapie 6, zagraj na telefonie, dopiero potem merge do `main`. Hasło dnia warto ogłosić na grupie roku pierwszego dnia z wynikiem do wklejenia – to najprostsza reklama Skrót BM.
