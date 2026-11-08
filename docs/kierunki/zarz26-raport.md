# Zarządzanie (wefiz-zarz-1-st-2026): raport po etapach A–D (8.11.2026)

Spec: `kierunek-schemat-spec.md` (projekt „szkoła app”). Etapy A i B są zrobione. Etap C ma mapę tymczasową bez API (prawdziwa czeka na klucz). Etap D: skrypty gotowe, nic nie wysłane.
Na produkcji nic nie jest uruchomione ani scalone.

## Gałęzie

| Repo | Gałąź | Co |
|---|---|---|
| skrot-bm | `kierunek-zarz/a` | `scripts/kierunek.mjs`, `kierunki/*.json`, wpis w `rocznik.js`, SQL v47, testy |
| skrot-bm | `kierunek-zarz/b` (od a) | sylabus: `scripts/sylabus_pl.py`, `sylabus-zarz.json`, raport `docs/kierunki/zarz26-sylabus.md` |
| skrot-bm | `kierunek-zarz/c` (od b) | `scripts/mapa-tematow.py` (na sucho), ten raport |
| skrot-bm | `kierunek-zarz/d` (od c) | mapa tymczasowa `--bez-api`, `scripts/lekcje-z-bm.py` (K1 kopia, K2 na sucho, porównanie ze źródłem) |
| plan-bm | `kierunek-zarz/a` | importer z konfiguracji, `plan/wefiz-zarz-1-st-2026.json`, wybór Kierunek → Rok → Grupa |

## Co kliknąć, po kolei

1. **SQL v47.** Plik `supabase/skrot-v47-zarz26.sql` na gałęzi `kierunek-zarz/a` otwórz na github.com → „Copy raw file” → Supabase SQL Editor → Run.
   Na dole ma być jeden wiersz: `wefiz-zarz-1-st-2026`, status `oczekujacy`, `plan_url` = https://plan.skrotbm.pl/plan/wefiz-zarz-1-st-2026.json.
2. **plan-bm.** Scal `kierunek-zarz/a` do main. Potem **podmień workflow ręcznie**: zawartość `docs/aktualizacja-planu-kierunki.yml` wklej
   do `.github/workflows/aktualizacja-planu.yml` na github.com (Edit → wklej → Commit). Token automatu nie może zmieniać workflow, więc push go odrzucił.
   Bez tego plan Zarządzania jest na stronie w wersji z 8.11 i nie odświeża się sam.
   Sprawdź: https://plan.skrotbm.pl/?k=zarz26 (Kierunek Zarządzanie, grupy C151–C153, laby A/B). Plan BM bez zmian (tekst strony identyczny, doszły tylko pola Kierunek i Rok).
3. **skrot-bm.** Scal `kierunek-zarz/c` (zawiera a i b) do main, ale dopiero po kroku 1, bo bez v47 karta Zarządzania prowadzi do rocznika, którego baza nie zna.
   Sprawdź w oknie prywatnym zdawalni.pl: karta „Zarządzanie” na ekranie wejścia → rok 2026/27 → C151 → Dalej. „Kup dostęp” ma otworzyć listę oczekujących.
4. **Eksport lekcji BM (do Etapu C).** Na zdawalni.pl zalogowany wklej w konsoli `docs/lekcje-v4/eksport.js` i rozpakuj plik do `scratch/lessons/`
   (polecenie jest w nagłówku skryptu). Bez eksportu mapa tematów porównuje sylabus Zarządzania z tematami z sylabusa BM, a nie z lekcjami,
   i źródła w mapie mają postać `bm-syl:…`, a nie id lekcji.
5. **Etap C: koszt.** `python3 scripts/mapa-tematow.py kierunki/wefiz-zarz-1-st-2026.json --na-sucho`: 7 zapytań (88 tematów), Haiku 5.5, Batch,
   **ok. 0,002 $**. Trzy przedmioty bez odpowiednika w BM (Nauka o przedsiębiorstwie, Zachowania konsumentów, Zarządzanie własnym rozwojem) dostają K3 bez API.
   Wysyłka dopiero po Twoim „wysyłaj”: `--wyslij`, potem `--odbierz` → `scratch/zarz26/mapa.html` do przejrzenia i poprawienia koszyków.

## Etap C bez API i Etap D (8.11, po „wysyłaj” bez klucza)

- `ANTHROPIC_API_KEY` nie był ustawiony w żadnym terminalu, więc mapa z modelu nie poszła. Na Twoje „wstaw na razie bez”:
  `python3 scripts/mapa-tematow.py kierunki/wefiz-zarz-1-st-2026.json --bez-api` → `scratch/zarz26/mapa.html` z mapą **tymczasową**
  (koszyk całego przedmiotu z pliku kierunku: 88 tematów K2, 28 K3; źródło = przedmiot BM, nie lekcja). Strona ma żółty baner „tymczasowa”.
  Prawdziwą mapę robisz później: `export ANTHROPIC_API_KEY=…`, potem `--wyslij` i `--odbierz` (ok. 0,002 $); nadpisuje tymczasową, odwrotnie skrypt nie pozwoli.
- `scripts/lekcje-z-bm.py` (Etap D, K1 + K2):
  - `k1`: kopia lekcji BM przypisanych w mapie → `scratch/zarz26/paczki/zarz26-<id BM>.json` (`rocznik_id`, `zrodlo: "bm:<id>"`), 0 zł.
  - `k2 --na-sucho` (domyślnie 2 lekcje z Podstaw zarządzania, Sonnet 5.5, Batch): model dostaje **tylko teksty** (ścieżka → EN) i tematy z sylabusa,
    oddaje PL dla tych samych ścieżek. `correct`, `calc`, zmienne i wzory `gen`, `simple` (już PL) i struktura nie przechodzą przez model.
  - `porownaj`: spec 4.4 pkt 2, ta sama struktura i pola nie-tekstowe, te same liczby i zmienne `{a}` w tekstach; kod 1 = do poprawy.
  - **Wymaga eksportu lekcji BM** (krok 4 wyżej). Bez niego skrypt kończy się komunikatem, a szacunku kosztu K2 nie da się policzyć.
- K3 (1 lekcja z Nauki o przedsiębiorstwie): generator `scripts/lekcje-z-sylabusa.mjs` jest na gałęzi `kierunek-prawo` (Prawo, lekcje v3, nie na main).
  Spec każe wzorować K3 na pierwszej zatwierdzonej lekcji K2, więc K3 robię dopiero po pilocie K2. Wtedy przeniosę generator z Prawa (v4, wzorzec PL).
- Kolejność, gdy będzie klucz i eksport: `mapa-tematow.py --wyslij/--odbierz` → przegląd mapy → `lekcje-z-bm.py k1` → `k2 --na-sucho` (koszt do akceptu) → „wysyłaj” → `k2 --odbierz` → `porownaj` → `tresci-kontrola.mjs scratch/zarz26/paczki --przed-wgraniem`.

## Jak sprawdzone

- `node --test tests/*.test.js`: 288 testów (287 OK, 1 pominięty jak dotąd), 0 błędów; nowe: `lekcje-z-bm.test.js` (sztuczna lekcja), `--bez-api` w `mapa-tematow.test.js` (w tym `kierunek.test.js`: plik BM odtworzony skryptem = dzisiejszy wpis BM; drugi przebieg bez zmian).
- PGlite: wszystkie migracje po kolei, v47 2×, testy K1–K6.
- `fundament-etap7.mjs` na prawdziwym roczniku Zarządzania: 24/24 (PL/EN, 375/1280, bez śladów BM, lista oczekujących). Tryb testowy dalej 20/20.
- `fundament-bm-tekst.mjs`: tekst 24 ekranów BM przed i po identyczny. Regresje: kierunek, fundament-etap2/3/4/6, zapisy: wszystko OK.
- plan-bm: parser na dzisiejszych stronach C111–C113 daje bajt w bajt `plan.json`; `node --test scripts/*.test.mjs` 8/8.
- Sylabus: tryb BM w `sylabus-build.py` porównany ze starą wersją z main na tych samych danych (złoty plik). PDF-u BM nie da się dziś pobrać
  (adres z `rocznik.js` zwraca stronę HTML), więc samego `sylabus-parse.py` BM nie przebudowałem; jego kod BM jest nietknięty.

## Do Twojej decyzji

1. **OWI w Zarządzaniu.** Plan i sylabus mają „Ochronę własności intelektualnej” (wykład e-learning, 8 h, zaliczenie z oceną), której nie było w tabeli w specu.
   Dopisałem ją do pliku kierunku jako K2 z OWI BM i do roli `prawne`, jak w BM. Zostawić?
2. **Model do mapy tematów.** Domyślnie `claude-haiku-5-5` (spec: tani model do klasyfikacji). Przy tej cenie można też dać Sonnet 5.5 (`--model claude-sonnet-5-5`, ok. 0,04 $).
3. **Kalendarz .ics na plan.skrotbm.pl** jest na razie tylko dla BM (przycisk ukryty dla innych roczników). Zarządzanie ma osobisty kalendarz w aplikacji. Dorobić pliki .ics dla C151–C153?

## Drobiazgi zauważone (kod aplikacji, nie ruszałem)

- Na 375 px nazwa „Nauka o przedsiębiorstwie” na kafelku przedmiotu łamie się w środku słowa („przedsiębiorstw-ie”).
- W trybie EN słownik tłumaczy pojedyncze polskie słowa w tematach sylabusa („Wprowadzenie **to** teorii…”).
- W repo `~/skrot-bm-fir` inna sesja robi FiR (gałąź `kierunek-fir/a` od Etapu A Zarządzania). Uwaga na numery SQL: v47 = Zarządzanie.
