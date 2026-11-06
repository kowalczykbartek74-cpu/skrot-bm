# Etap 12: testy jakości treści

Spec: „Systemy z Zdawalni w Skrócie”, etap 12. Gałąź `zdawalni/tresci` (od `zdawalni/admin`). Bez SQL, bez zmian na stronie.
Źródło: `zdawalni-web` gałąź `feat/w7-wyglad-lekcje` (`tests/no-invented-values.test.ts`, `copy-forbidden.test.ts`, `copy-gender.test.ts`, `lesson-content.test.ts` + `tests/support/lesson-checks.ts`, `contrast.test.ts` + `lib/domain/contrast.ts`).

## Co jest
- **Jedna komenda na paczce lekcji**: `node scripts/tresci-kontrola.mjs <paczka> [--przed-wgraniem]`. Paczka = `lekcje-eksport.json` z przeglądarki, katalog z `<id>.json` (np. `scratch/lessons-v4-poprawione/`) albo tablica dokumentów. Kod wyjścia: 0 = można wgrać, 1 = zatrzymane, 2 = zły argument / brak lekcji / brak `python3`.
  - walidator v4 (`scripts/lekcje-walidator.py`) i zgodność szablonów `gen` (Python = parser z `lekcje-v4.js`, 20 losowań) — wołane z komendy;
  - **zakazane sformułowania** z `scripts/tresci-zakazane.json` → błąd (lista do Twojego zatwierdzenia, niżej);
  - **matematyka**: proste rachunki w tekstach („3 × 25 zł = 75 zł”, „1000 · 1,05 ≈ 1050”) liczone ponownie, zły wynik → błąd; pytanie z polem `calc` (np. `"calc": "200*(1-0.19)"`) → poprawna opcja musi mieć tę wartość, a zła nie; `gen` przez walidator;
  - **liczby, daty, kwoty, procenty, lata, numery artykułów** → `scratch/tresci-przeglad.json`, każda pozycja z polami `zrodlo` i `przejrzane` (nie blokuje; z `--przed-wgraniem` nieprzejrzane blokują);
  - **formy zależne od płci** → ostrzeżenie;
  - raport Markdown `scratch/tresci-raport.md`.
- **Stałe pliki** w `node --test` (`tests/tresci.test.js`, 17 testów): zakazane frazy w plikach strony (0 trafień), kontrast z `PALETA.md` i z każdego motywu `index.html` (WCAG AA), kolory `PALETA.md` = `:root`/motywy w `index.html`, komenda na lekcjach testowych.
- `node scripts/tresci-kontrola.mjs --strona`: raport płci, zakazanych i kontrastu dla plików strony (`scratch/tresci-strona.md`). Dziś: zakazane 0, kontrast poniżej AA 1, formy zależne od płci 99 (tylko lista, teksty strony bez zmian).
- Lekcje testowe: `tests/fixtures/tresci/prototyp-koszt-alternatywny.json` (lekcja wzorcowa z `docs/lekcje-v3/prototyp.html`, jedyna prawdziwa lekcja w repo), `test-procent-skladany.json` (v4 z `gen`, `calc`, artykułem ustawy), `tests/fixtures/tresci-zepsuta/test-zepsuta.json` (celowo zepsuta: zakazana fraza, zły rachunek, `calc` ≠ poprawna opcja, `correct` poza zakresem, `gen` z `alert()`, forma „zrozumiałeś”).
- Walidator v4: `not[correct] = ""` (tak jest w lekcjach v3) liczy się jak `null`, a nie jak błąd (`scripts/lekcje_v4.py`). Strona i tak nie pokazuje `not` przy poprawnej opcji.

## Kroki dla Bartka (klik po kliku)

**A. Uruchom na obecnych 115 lekcjach** (eksport tylko czyta bazę, niczego nie zapisuje):
1. Chrome → https://zdawalni.pl → zaloguj się kontem starosty (pełny dostęp).
2. Cmd+Opt+J (konsola). Jeśli Chrome nie pozwala wkleić, wpisz `allow pasting` i Enter.
3. Otwórz w repo `docs/lekcje-v4/eksport.js`, skopiuj całość, wklej w konsolę, Enter. Konsola pokaże `{ lekcje: 115 }`, a do Pobranych trafi `lekcje-eksport.json`.
4. Terminal: `cd ~/skrot-bm && node scripts/tresci-kontrola.mjs ~/Downloads/lekcje-eksport.json` (na tej gałęzi albo po scaleniu).
5. Wynik na ekranie + `scratch/tresci-raport.md`. Kod 1 = są błędy (lista przy lekcjach). Lekcje v3 mogą mieć błędy walidatora v4 (np. bilet z 2 pytaniami): to te same, które pokazuje audyt D2 (`python3 scripts/lekcje-audyt.py`), i poprawia je etap D lekcji v4.
6. Plik `lekcje-eksport.json` to płatne treści: nie wrzucaj go do repo ani nigdzie publicznie; po wszystkim usuń z Pobranych.

**B. Przegląd liczb** (raz na lekcję, potem zostaje): otwórz `scratch/tresci-przeglad.json`, przy każdej pozycji wpisz `"zrodlo"` (np. „ustawa o PIT, art. 30a, stan 2026”, „sylabus”, „wykład 3”) i zmień `"przejrzane": false` na `true`. Następne uruchomienie pamięta to po kluczu (lekcja + typ + tekst). Zły rachunek, który jest celowo zły (przykład błędu), oznacz w sekcji `rachunki` `"celowo": true`.

**C. Przed każdym wgraniem treści** (łatki v4, nowy kierunek, paczka z generatora): `node scripts/tresci-kontrola.mjs <paczka> --przed-wgraniem` → musi być kod 0.

**D. Zatwierdź listę zakazanych** w `scripts/tresci-zakazane.json` (dopisz/usuń, zmień `status` na „zatwierdzona <data>”). Propozycja:
- obietnice wyniku: „gwarancja/gwarantujemy” i „guarantee” na stronie (z przeczeniem „nie gwarantujemy” w porządku), w lekcjach tylko „gwarancja zdania/zaliczenia/wyniku” (bo „gwarancja jakości”, „gwarancja bankowa” to pojęcia prawa i finansów), „na pewno zdasz”, „zdasz na 100%”, „you will pass the exam”, „100% skuteczności”, „pewna piątka”, „bez nauki/bez wysiłku”;
- zawstydzanie: „nie umiesz” (poza „jeszcze nie umiesz”), „słabo ci idzie”, „jesteś słaby/beznadziejny”, „wstyd”, „nawet dziecko”;
- marka: „najlepsza aplikacja”, „nielimitowane/unlimited” (strona), „Majturek” (w Skrócie jest Staś).
- Z listy Zdawalni **nie** wziąłem: „wystarczy” („Na dziś wystarczy” to dobry tekst), „kara” i „obowiązek” (pojęcia prawa: kara umowna, przedmiot obowiązkowy), „dostaniesz się” (matura).

## Do decyzji
- **Motyw „Jednorożec”** (`html[data-theme="pink"]`): biały tekst na przycisku `#E0438F` ma 3,9:1 (AA wymaga 4,5:1 dla zwykłego tekstu). Propozycja: `--accent: #C92F7B` (5,0:1; dziś to kolor najechania). Nie zmieniłem, bo to zmiana wyglądu; test zna to odstępstwo i pilnuje, żeby nie doszły nowe. Motyw nie jest też opisany w `PALETA.md`.
- **Formy zależne od płci na stronie**: 99 miejsc (index.html 38, i18n-en.js 40 — to polskie klucze tych samych tekstów, gry 12, skrot-supabase.js 6, regulamin/prywatność 3). Lista: `node scripts/tresci-kontrola.mjs --strona`. Proponuję poprawiać przy okazji zmian ekranów, nie masowo.
- `--przed-wgraniem` wymaga przeglądu każdej wartości. Jeśli przy 115 lekcjach będzie tego za dużo, można zawęzić typy (np. tylko daty, artykuły i procenty) — decyzja po pierwszym raporcie.

## Testy
- `node --test tests/*.test.js`: 162/162 (nowe `tresci` 17).
- Komenda: lekcje testowe z `tests/fixtures/tresci/` → kod 0 (2 lekcje, 13 rachunków, 9 wartości do przejrzenia, 3 ostrzeżenia); `tests/fixtures/tresci-zepsuta/` → kod 1 (7 błędów); syntetyczne lekcje z audytu v4 (`skrot-bm-v4/scratch/lessons`, 2) → kod 1 (9 błędów walidatora).
- **Nie sprawdzone**: 115 prawdziwych lekcji (są tylko w bazie produkcyjnej, za płatnym dostępem; krok A). Liczba uwag i ewentualne fałszywe trafienia rachunków wyjdą przy pierwszym uruchomieniu.

## Dla kolejnego rocznika
Nic do zmiany: komenda działa na paczce dowolnego kierunku (lekcje PL i EN), lista zakazanych jest wspólna, a kontrola paczki jest punktem 5 etapu 4 w `docs/kierunki/nowy-kierunek-spec.md`.
