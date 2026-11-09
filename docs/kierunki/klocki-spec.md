# Klocki – bank przedmiotów ogólnych dla całego US (spec dla Claude Code)

Stan 9.11.2026. Ten plik **uzupełnia** `claude/kierunki-system.md` i `claude/kierunek-schemat-spec.md` (koszyki K1/K2/K3, bank, mapa tematów zostają). Zasady z `claude/CLAUDE.md` sekcja 4 obowiązują bez zmian.

## 0. O co chodzi

Dziś bank rośnie **przy okazji**: robisz kierunek, zatwierdzasz jego lekcje, `tresci-bank.py dodaj` wrzuca je do banku, następny kierunek bierze kopie (K1). Klocki odwracają kolejność:

1. **Najpierw przedmiot ogólny** (np. Ochrona własności intelektualnej), raz, dla wszystkich kierunków, które go mają. Każdy temat to jedna lekcja, czyli **klocek**.
2. **Potem kierunek** = przepis: lista klocków z banku w kolejności sylabusa tego kierunku + brakujące tematy, które dopisujesz i które od razu też trafiają do banku.

Sprzedaje się dalej **kierunek**. Kierunek otwierasz, gdy każdy przedmiot z egzaminem ma komplet.

Dane wejściowe są już w repo:
- `docs/kierunki/us-rok1-przedmioty.json`: przedmioty 1. roku (zima 2026/27) 104 roczników na 7 wydziałach, zebrane 9.11 z publicznych planów,
- `scripts/klocki-ranking.py`: ranking przedmiotów ogólnych (grupy na 1 $).

## 1. Co to jest klocek

Klocek = jedna lekcja v4 (format z `lekcje-z-sylabusa.mjs`: lekcja, fiszki, quiz, „Prościej”, „Dlaczego?”) o **jednym temacie kanonicznym** przedmiotu ogólnego, ok. 20 minut.

Zasady treści klocka (dopisz do zasad K2/K3 w skryptach jako tryb `--klocek`):
1. **Bez kierunku w treści.** Żadnych nazw kierunków, prowadzących, dat kolokwiów, odwołań „na ćwiczeniach z…”.
2. **Przykłady z co najmniej dwóch światów** w każdej lekcji: jeden biznesowy i jeden spoza biznesu (urząd, szkoła, szpital, sport, kultura). Dzięki temu ten sam klocek pasuje Ekonomii, Prawu i Pedagogice.
3. **Samodzielny.** Wymagania tylko jako odsyłacze do innych klocków (`wymaga: ["owi/02-utwor"]`), nie „jak w lekcji 3”.
4. **Większa pula pytań**: quiz 12 pytań (kierunek może pokazać podzbiór), każde z tagiem `poziom: podstawowy | rozszerzony`.
5. **Fakty zależne od czasu** z polem `sprawdzone: "RRRR-MM-DD"` i źródłem (kontrola treści już to zbiera w `tresci-przeglad.json`).
6. Język: **PL**. Wersja EN klocka = istniejąca lekcja BM (jeśli jest); tłumaczenia PL→EN na razie nie ma (decyzja D4).

Poziom: przedmiot ogólny łączy tylko przedmioty **tego samego poziomu**. „Podstawy prawa” dla Geografii i „Wstęp do prawoznawstwa” na Prawie to **dwa** przedmioty ogólne z jednej rodziny (`rodzina: "prawo"`), bo prawnik potrzebuje głębszej wersji. To samo: matematyka (kierunki niematematyczne) vs matematyka na Matematyce/Kosmologii, psychologia ogólna na Psychologii vs „podstawy psychologii” gdzie indziej.

## 2. Dane (co dochodzi)

**Prywatne repo `zdawalni-tresci`** (już przewidziane w `tresci-bank.py`, jeszcze go nie ma). Bartek zakłada je na github.com (New repository → nazwa `zdawalni-tresci` → **Private** → Create) i klonuje obok `skrot-bm`. Treści są płatne, więc nie trafiają do publicznego `skrot-bm`.

```
zdawalni-tresci/
  bank/indeks.json                    (już jest w tresci-bank.py; dochodzą pola niżej)
  bank/<ogolny>/<temat>.json          lekcja-klocek (ten sam format co paczka)
  katalog/<ogolny>.json               katalog tematów przedmiotu ogólnego (Etap 2)
```

Wpis w `indeks.json` (nowe pola oznaczone *):
`{ temat, plik, zrodlo, status, *ogolny, *poziom, *wymaga[], *pokrycie: [roczniki], *wersja, *sprawdzone }`

`kierunki/wspolne/przedmioty-ogolne.json` (w `skrot-bm`, bez treści): dochodzą przedmioty spoza WEFiZ (psychologia, socjologia, przedsiębiorczość, projektowanie-uniwersalne, filozofia, statystyka, chemia, biologia-komorki, anatomia, pedagogika-ogolna, prawoznawstwo…), aliasy z `us-rok1-przedmioty.json`, pole `rodzina` i `poziom`.

## 3. Kolejność klocków (z rankingu 9.11)

| Fala | Przedmioty ogólne | Skąd | Szacunek |
|---|---|---|---|
| **1** | OWI, Technologie informacyjne, Podstawy prawa, Ekonomia/mikroekonomia, Matematyka (niematematyczne), Podstawy zarządzania, Podstawy finansów, Makroekonomia | tłumaczenie BM (K2) | ~8 × 15 tematów × 0,04 $ ≈ **5 $** |
| **2** | Psychologia (podstawy), Socjologia (podstawy), Przedsiębiorczość, Projektowanie uniwersalne, Filozofia/historia filozofii, Statystyka | od zera (K3) | ~6 × 12 × 0,13 $ ≈ **9 $** (Sonnet ≈ 5 $) |
| **3** | Chemia, Anatomia, Pedagogika ogólna, Biofizyka, Podstawy rachunkowości, Marketing, Logika, Wstęp do językoznawstwa | od zera (K3) | ~8 × 12 × 0,13 $ ≈ **12 $** |

Szacunki ±30% (pilot Zarządzania 8.11: lekcja PL ≈ 27 700 znaków). Kolejność w fali: według `klocki-ranking.py`, ale przedmiot, który ma egzamin na kierunku z najdłuższą listą oczekujących, idzie wyżej.

## 4. Etapy (każdy: osobna sesja, gałąź `klocki/<etap>`, raport i stop)

### Etap 1 – przedmioty ogólne dla całego US (0 $)
1. Rozszerz `kierunki/wspolne/przedmioty-ogolne.json` o przedmioty z fal 1–3: aliasy z `docs/kierunki/us-rok1-przedmioty.json` (reguły dopasowania z `scripts/klocki-ranking.py` przenieś do pliku jako aliasy), `rodzina`, `poziom`.
2. `macierz-przedmiotow.py --us` czyta też `us-rok1-przedmioty.json` (obok kierunków WEFiZ z sylabusów) → `scratch/macierz/bank-plan.md` dla całego US.
3. Raport: lista „bez przypisania” i **pary do decyzji** (te same nazwy, inny poziom, np. psychologia na Psychologii). Stop.

### Etap 2 – katalog tematów przedmiotu ogólnego (≈ 0,01 $ na przedmiot)
Dla każdego przedmiotu fali 1:
1. Zbierz tematy ze **wszystkich** kart sylabusa kierunków, które mają ten przedmiot. WEFiZ: `sylabusy-hurt.py`. Inne wydziały: nowy `scripts/sylabusy-us.py` (strony „plany studiów i sylabusy” wydziałów, tylko publiczne, ≤ 1 zapytanie/s, cache; jeśli sesja nie sięga `usz.edu.pl`: przez workflow GitHub Actions jak w `claude/plan-caly-us-spec.md` pkt 6). Do tego tematy przedmiotu BM.
2. `scripts/klocki-katalog.py <ogolny> --na-sucho | --wyslij | --odbierz`: najpierw grupowanie słowami (jak `mapa-tematow.py --bez-api`), potem **jedno** zapytanie Batch na przedmiot, które scala podobne tematy w listę kanoniczną. Wynik: `zdawalni-tresci/katalog/<ogolny>.json`:
   `{ ogolny, tematy: [{ id: "owi/03-dozwolony-uzytek", tytul, zakres (2–3 zdania), poziom, wymaga[], pokrycie: [roczniki], zrodloBM: "bm:owi-03-permitted-use" | null, egzamin: n }] }`
   Kolejność tematów = kolejność dydaktyczna (wymagania przed tematem).
3. `katalog.html`: tabela temat × roczniki (✓ = temat jest w sylabusie rocznika), filtr „tylko do przejrzenia” (temat w 1 roczniku, scalenia z niską pewnością).
4. Raport: liczba tematów na przedmiot, koszt, pokrycie (ile roczników ma ≥ 80% tematów z katalogu). Stop, Bartek akceptuje katalog.

### Etap 3 – pilot klocków (1 przedmiot: OWI, ok. 0,30 $)
1. Tryb `--klocek` w `lekcje-z-bm.py k2` (tematy z `zrodloBM`) i `lekcje-z-sylabusa.mjs` (tematy bez `zrodloBM`): zasady z sekcji 1, wejście = temat z katalogu (tytuł + zakres), nie sylabus jednego kierunku.
2. Cały katalog OWI → lekcje → `tresci-kontrola.mjs` (z `--przed-wgraniem`) → `tresci-bank.py dodaj --katalog-klockow zdawalni-tresci/katalog/owi.json`.
3. Próba składania na dwóch kierunkach z różnych wydziałów (np. Zarządzanie i Bezpieczeństwo wewnętrzne): paczka, `paczka-render.mjs`, zrzuty 375 px.
4. Raport: koszt, kontrola, zrzuty, lista tematów, których brakuje którymś kierunkom. Stop. Po akcepcie: `kierunek-start.mjs --wzorzec klocek …`.

### Etap 4 – fala 1 (≈ 5 $)
Przedmiot po przedmiocie (kolejność z sekcji 3): katalog (Etap 2) → `--na-sucho` z kosztem → po „wysyłaj” Batch → kontrola → bank. Jeden raport na przedmiot, z listą wartości do przejrzenia (daty, przepisy). Bartek akceptuje przedmiot, zanim pójdzie następny (albo kilka naraz, jeśli tak napisze).

### Etap 5 – fala 2 i 3 (≈ 9–21 $)
Jak Etap 4, ale K3: dla każdego przedmiotu najpierw **1 lekcja pilotażowa** (akcept stylu), potem reszta. Przy przedmiotach z rodziną (psychologia, socjologia) najpierw wersja „podstawy”, wersja kierunkowa dopiero przy otwieraniu tego kierunku.

### Etap 6 – składanie kierunku z klocków
1. `scripts/kierunek-sklej.mjs kierunki/<id>.json`: dla każdego przedmiotu kierunku → przedmiot ogólny (`przedmioty-ogolne.json`) → dopasowanie tematów sylabusa kierunku do katalogu (to robi już `mapa-tematow.py`; tu bank jest źródłem pierwszym) → **przepis** `scratch/<prefiks>/przepis.json`:
   `{ przedmiot, klocki: [{ bank: "owi/03-…", kolejnosc, quiz: "podstawowy" }], braki: [{ temat z sylabusa, powod }] }`
2. Klocki → `tresci-bank.py kopiuj` (K1, 0 $, odciski). Braki → K3 z `--klocek`, a po akcepcie od razu `tresci-bank.py dodaj` (każdy brak staje się klockiem dla następnych).
3. Test na Zarządzaniu i FiR: przepis vs dotychczasowa mapa (ile K1 więcej, ile taniej).
4. Raport: dla kierunku % pokrycia z banku, koszt braków, przedmioty z egzaminem bez kompletu. Stop.

### Etap 7 – utrzymanie
- Poprawka w klocku → `tresci-bank.py synchronizuj` dla wszystkich roczników (już działa: kopie nietknięte odświeżają się same).
- „Zgłoś błąd” w lekcji-kopii pokazuje, że błąd jest w klocku banku (pole `zrodlo`), i trafia do jednej kolejki.
- Co rok akademicki: `sprawdzone` starsze niż 12 miesięcy → lista do przeglądu.

## 5. Na co uważać

- **Ten sam przedmiot, inny zakres.** Katalog jest sumą tematów. Kierunek bierze tylko te, które ma w sylabusie (przepis), a braki dopisuje. Nie wciskamy kierunkowi tematów, których nie ma w jego sylabusie.
- **Prowadzący.** Różnice u konkretnych prowadzących to późniejsza „nakładka” per rocznik (plan wdrożenia na cały US: `przedmiot_w_roczniku`), nie zmiana klocka.
- **Koszt przewidywalny.** Każde wysłanie do API najpierw `--na-sucho` z kwotą w raporcie; nic nie idzie bez „wysyłaj”.
- **Treści tylko w `zdawalni-tresci`.** Do `skrot-bm` (publiczne) trafiają skrypty, katalogi bez treści lekcji i testy na atrapach.

## 6. Decyzje dla Bartka (domyślnie w nawiasie; odpowiedź numerami)

1. Repo na treści: prywatne `zdawalni-tresci` na GitHubie (tak; zakładasz je sam, klik po kliku w sekcji 2).
2. Pilot: OWI (tak, bo jest na 71 rocznikach i BM ma gotowy przedmiot).
3. Kto pisze klocki od zera (fale 2–3): Opus (najpierw 1 lekcja Sonnetem do porównania, potem decyzja).
4. Wersja EN klocków bez lekcji BM: na razie nie (kierunki po angielsku biorą tylko to, co ma BM; tłumaczenie PL→EN dopiero, gdy któryś kierunek EN wejdzie do sprzedaży).
5. Poziomy: osobny przedmiot ogólny dla wersji kierunkowej (prawoznawstwo na Prawie, psychologia na Psychologii) (tak).
6. Zakres fali 1: wszystkie tematy katalogu (tak; fala 1 jest tania, a braki później kosztują więcej przez osobne sesje).

## 7. Prompt startowy dla Claude Code

„Projekt szkoła app. Przeczytaj `claude/CLAUDE.md` sekcja 4, `claude/kierunki-system.md` i `claude/klocki-spec.md`. Zrób Etap 1. Raport i stop.”
