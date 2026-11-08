# Zarządzanie + FiR: Etapy B i C (8.11.2026)

Gałąź `kierunek-fir/bc` (od main a5919d8). Bez treści lekcji, bez zapisu do bazy, bez wysyłki do API.

## Stan etapów przed tą sesją

| Etap | Zarządzanie (zarz26) | FiR (fir26) |
|---|---|---|
| A konfiguracja, plan, rocznik | wdrożone (v47, plan C151–C153) | wdrożone (v48, plan M120–M123) |
| B sylabus | `sylabus-zarz.json` (106 kart) | **brak** → zrobione teraz |
| C mapa | tymczasowa bez API (koszyk całego przedmiotu) | brak → zrobiona teraz (tymczasowa) |
| D pilotaż | skrypty K1/K2 gotowe, nic nie wysłane | — |
| E reszta | — | — |

## Etap B

- `sylabus-fir.json`: 99 kart z PDF-u FiR 2026/27 (ten sam parser co Zarządzanie; przebudowa Zarządzania daje bajt w bajt ten sam plik).
- `rocznik.js`: rocznik FiR wskazuje `sylabus-fir.json` (wpis zrobił `kierunek.mjs`), `?v=` podbite.
- Raport: `docs/kierunki/fir26-sylabus.md`.

**Egzaminy w zimie**
- Zarządzanie (5): Matematyka, Nauka o przedsiębiorstwie, Podstawy ekonomii, Podstawy finansów, Podstawy zarządzania.
- FiR (4): Makroekonomia (z planu studiów, karty brak), Podstawy finansów, Podstawy rachunkowości, Podstawy zarządzania.

**Rozbieżności plan ↔ sylabus**
- Zarządzanie: brak.
- FiR: **Makroekonomia nie ma karty w sylabusie** (jest w planie zajęć i w planie studiów: W 15 h egzamin + ĆW 30 h ZO, 4 ECTS).
  Do czasu karty mapa bierze tematy z sylabusa BM `makroekonomia` (uwaga przy każdym temacie); egzamin z planu studiów jest w pliku kierunku jako `egzaminyBezKarty`.
- FiR: Matematyka = zaliczenie z oceną (nie egzamin), 15+15 h; Podstawy zarządzania 15+15 h (w Zarządzaniu 30+30 h).

## Etap C

`scripts/mapa-tematow.py` (ogólnie, bez nazw kierunków):
- **bank PL**: pole `bank` w pliku kierunku. Zatwierdzone lekcje z `zdawalni-tresci/bank/indeks.json`; zanim bank powstanie, kandydatami są tematy
  tego przedmiotu z wcześniejszego kierunku PL (`kierunki/*.json`), ze statusem „czeka na zatwierdzenie zarz26”. Temat z banku = **K1**, nawet jeśli BM też go ma.
- przedmiot bez karty w sylabusie kierunku → tematy z sylabusa pierwszego przedmiotu BM;
- `--bez-api`: K1 z banku = dopasowanie słów PL↔PL (ważone rzadkością), K2/K3 z BM = koszyk całego przedmiotu (jak dotąd).

Mapy do przejrzenia: `scratch/zarz26/mapa.html`, `scratch/fir26/mapa.html` (obie **tymczasowe**: bez klucza API).

| Zarządzanie | K1 | K2 | K3 |  | FiR | K1 | K2 | K3 |
|---|---|---|---|---|---|---|---|---|
| Matematyka (E) | 0 | 9 | 0 |  | Podstawy zarządzania (E) | 12 | 5 | 0 |
| Podstawy zarządzania (E) | 0 | 26 | 0 |  | Podstawy finansów (E) | 5 | 14 | 0 |
| Podstawy finansów (E) | 0 | 12 | 0 |  | Podstawy prawa | 4 | 4 | 0 |
| Podstawy prawa | 0 | 13 | 0 |  | Matematyka | 7 | 6 | 0 |
| OWI | 0 | 5 | 0 |  | Makroekonomia (E) | 1 | 8 | 0 |
| Podstawy ekonomii (E) | 0 | 11 | 0 |  | OWI | 0 | 5 | 0 |
| Technologie informacyjne | 0 | 12 | 0 |  | Arkusz kalkulacyjny w F&R | 1 | 3 | 0 |
| Nauka o przedsiębiorstwie (E) | 0 | 0 | 17 |  | Podstawy rachunkowości (E) | 0 | 0 | 21 |
| Zachowania konsumentów | 0 | 0 | 6 |  | | | | |
| Zarządzanie własnym rozwojem | 0 | 0 | 5 |  | | | | |
| **Razem** | **0** | **88** | **28** |  | **Razem** | **30** | **45** | **21** |

Wszystkie 30 K1 w FiR czekają na zatwierdzenie lekcji Zarządzania. Matematyka i TI w Zarządzaniu mają w pliku „K2+K3”, ale mapa tymczasowa daje im K2 – podział zrobi dopiero mapa z modelu.

## Koszty (na sucho)

- **C, mapa z modelu** (`mapa-tematow.py --na-sucho`, Haiku 5.5, Batch): Zarządzanie ~0,002 $ (7 zapytań, 88 tematów), FiR ~0,002 $ (7 zapytań, 75 tematów, 83 kandydatów z banku).
- **D+E** (`scripts/koszt-tresci.py`, nowy): K2 Sonnet 5.5, K3 Opus 5.5 + kontrola Haiku, Batch i cache. Bez eksportu lekcji BM:
  ~0,94 lekcji na temat (115 lekcji BM / 122 tematy BM), rozmiar tekstów jak w lekcji wzorcowej z testów. Dokładność ±50%.

| | Wszystkie przedmioty zimy | Tylko z egzaminem |
|---|---|---|
| Zarządzanie (87 lekcji K2, 28 K3) | ~4,38 $ | ~2,75 $ |
| FiR (45 lekcji K2, 20 K3; K1 = 0 zł) | ~2,69 $ | ~2,23 $ |
| **Łącznie** | **~7,07 $** | **~4,98 $** |

Jeśli FiR ruszy przed zatwierdzeniem Zarządzania, jego 30 tematów K1 przejdzie do K2 (+~0,7 $). Dla porównania: K3 w Prawie liczono na ~0,11 $/lekcję, tu wychodzi ~0,08 $.

## Co blokuje dalsze kroki

1. **Klucz API**: `ANTHROPIC_API_KEY` nie jest ustawiony w tym terminalu (w login shell jest tylko `ANTHROPIC_BASE_URL`). Bez niego mapa z modelu nie pójdzie.
2. **Eksport lekcji BM** (`docs/lekcje-v4/eksport.js` na zalogowanej zdawalni.pl → `scratch/lessons/`): bez niego mapa porównuje z tematami sylabusa BM
   (źródła `bm-syl:…`), K1/K2 w Etapie D nie mają źródła, a szacunek K2 opiera się na wzorcu. Odczyt bazy przez CLI został zablokowany przez uprawnienia sesji.
3. **Bank `zdawalni-tresci`**: repo nie ma jeszcze na dysku; K1 FiR zostają w stanie „czeka”.

## Rozbieżności spec ↔ kod (wygrywa kod)

- Spec nazywa skrypty `mapa-tematow.mjs`, `lekcje-z-bm.mjs`, `tresci-kopiuj.mjs`; w repo są `mapa-tematow.py` i `lekcje-z-bm.py` (krok `k1` = kopiowanie).
  `lekcje-z-sylabusa.mjs` (K3) jest tylko na gałęzi `kierunek-prawo` (lekcje v3).
- Spec FiR: „8 przedmiotów” z Makroekonomią i „Matematyka (jeśli ma egzamin)”: w sylabusie nie ma karty Makroekonomii, Matematyka nie ma egzaminu.

## Jak sprawdzone

- `node --test tests/*.test.js`: 291 testów, 290 OK, 1 pominięty (jak dotąd); nowe testy banku, braku karty i `koszt-tresci.py`.
- `fundament-bm-tekst.mjs`: 24 ekrany BM przed (main) i po – identyczne.
- `fundament-etap7.mjs` na roczniku FiR: 24/24 (PL 375 px, EN 1280 px, lista oczekujących, bez poziomego przewijania).

## Mapa z modelu (8.11.2026, po „wysyłaj”)

Batch Haiku 5.5: Zarządzanie `msgbatch_01CvsSq76E2tR8b9ohmRaL9P` (0,0037 $), FiR `msgbatch_019hEEsirLTqknwB8uzUNJTH` (0,0051 $). Razem **0,0088 $** (szacunek był 0,004 $: model pisał dłuższe uwagi).
Kandydaci BM = tematy z sylabusa BM (bez eksportu lekcji), więc źródła K2 mają postać `bm-syl:…`.

| Zarządzanie | K1 | K2 | K3 |  | FiR | K1 | K2 | K3 |
|---|---|---|---|---|---|---|---|---|
| Matematyka (E) | 0 | 5 | 4 |  | Podstawy zarządzania (E) | 16 | 0 | 1 |
| Podstawy zarządzania (E) | 0 | 19 | 7 |  | Podstawy finansów (E) | 16 | 0 | 3 |
| Podstawy finansów (E) | 0 | 6 | 6 |  | Podstawy prawa | 6 | 0 | 2 |
| Podstawy prawa | 0 | 7 | 6 |  | Matematyka | 10 | 2 | 1 |
| OWI | 0 | 5 | 0 |  | Makroekonomia (E) | 8 | 1 | 0 |
| Podstawy ekonomii (E) | 0 | 11 | 0 |  | OWI | 0 | 5 | 0 |
| Technologie informacyjne | 0 | 0 | 12 |  | Arkusz kalkulacyjny w F&R | 2 | 1 | 1 |
| Nauka o przedsiębiorstwie (E) | 0 | 0 | 17 |  | Podstawy rachunkowości (E) | 0 | 0 | 21 |
| Zachowania konsumentów | 0 | 0 | 6 |  | | | | |
| Zarządzanie własnym rozwojem | 0 | 0 | 5 |  | | | | |
| **Razem** | **0** | **53** | **63** |  | **Razem** | **58** | **9** | **29** |

Szacunek D+E z tej mapy (`koszt-tresci.py`): Zarządzanie ~6,28 $ (egzaminy ~3,68 $), FiR ~2,47 $ (egzaminy ~1,92 $), **łącznie ~8,75 $ (egzaminy ~5,60 $)**.
Więcej K3 w Zarządzaniu niż w mapie tymczasowej: Prawo BM nie ma polskiego prawa cywilnego, Narzędzia IT BM to bazy danych/SQL, a nie TI z sylabusa.
FiR: 58 tematów K1 czeka na zatwierdzone lekcje Zarządzania.

## Etap D: pilot K2 Zarządzania (8.11.2026)

- Eksport 115 lekcji BM (przeglądarka w aplikacji, konto Bartka, tylko odczyt) → `scratch/lessons/`. Źródła `bm-syl:…` z mapy są tłumaczone na lekcje
  po podobieństwie tytułów EN (`lekcje-z-bm.py`): 53 tematy K2 → 37 lekcji; 6 tematów bez pewnej lekcji (Podstawy prawa 2, Podstawy ekonomii 4).
- K1: 37 lekcji skopiowanych do `scratch/zarz26/paczki/` (0 zł).
- K2 pilot (`pz-01-organization`, `pz-03-managers`, Sonnet 5.5):
  - próba 1 `msgbatch_01XAEMryC1Zd8f9or3eJeqhB`: 0,042 $, pusta (model odmówił 350 tekstów naraz) → lekcja idzie teraz w częściach (≤ 60 tekstów / 12 tys. znaków);
  - próba 2 `msgbatch_01RZ8SJbAUcaASvFrzEaP1sD`: **0,3085 $** (≈ 0,15 $/lekcję; szacunek był 0,18 $ → mnożnik wyjścia skalibrowany na ×2,1);
  - porównanie ze źródłem: ✓ obie (porównanie rozumie już „1,200” = „1 200” i „5 p.m.” = „17:00”);
  - walidator v4: 0 błędów (ostrzeżenia o długości jak w BM); `tresci-kontrola.mjs`: 1 blokada = „2 + 2 = 5” (synergia, to samo w BM; do oznaczenia „celowo”), 5 procentów do przejrzenia (te same co w BM).
  - Tytuły zostały po angielsku (tytuł był poza `content`); od teraz jedzie w pierwszej części.
- Szacunek D+E po kalibracji: **~30,4 $** (egzaminy ~19,6 $); cały K2 Zarządzania na prawdziwych lekcjach 5,52 $ (37 lekcji).

**Spec ↔ kod:** Panel AI (`aiImport`) wczytuje z pliku tylko `materialSimple` i `quizWhy`. Nie ma importu całych lekcji (`materials` + `materialContent`) w trybie „Edytuję rocznik”.
