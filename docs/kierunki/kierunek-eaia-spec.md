# Economics and IT Applications (EaIA), 1. rok – spec dla Claude Code

Kierunek WEFiZ, I stopień, stacjonarny, **zajęcia po angielsku** (jak BM). Rocznik `wefiz-eaia-1-st-2026`, prefiks `eaia26`, kod `EAIA` (kierunek `wefiz-eaia-1-st` jest już w `nauka_kierunki`, v34). Przebieg ogólny: `claude/kierunki-system.md`; zasady: `claude/CLAUDE.md` sekcja 4. Ten plik podaje tylko to, czym EaIA się różni.

## Dlaczego EaIA jest tani

Lekcje BM są po angielsku, czyli w języku zajęć EaIA. Od commita `c9c2eec` (8.11.2026) skrypty mają **tryb kierunku po angielsku** (`jezykZajec: "en"`):

| Koszyk | Kierunek PL (Zarządzanie, FiR) | **Kierunek EN (EaIA)** |
|---|---|---|
| K1 | kopia z banku PL | **kopia lekcji BM 1:1, 0 zł** (gotowa od razu, bez K2) |
| K2 | tłumaczenie BM → PL | **nie ma** |
| K3 | nowa lekcja PL | nowa lekcja **EN** (`lekcje-z-sylabusa.mjs`, wzorzec: lekcja BM) |

Dodatkowo: przedmiot o tym samym slugu co w BM (plan: „MACROECONOMICS (MAKROEKONOMIA)” → `makroekonomia`) dostaje przedmiot BM wprost; sylabus bierze się w wersji `_ang` (jak PDF BM); „Prościej · PL” i „Dlaczego?” z BM przechodzą z kopią. **Pilot K2 nie istnieje**; pilot tylko dla K3 (1 lekcja), bo generator EN nie był jeszcze sprawdzony na lekcjach v4.

Bank PL nie jest źródłem dla EaIA (tłumaczenia PL → EN skrypty nie robią). Lekcje K3 EaIA zostają w roczniku EaIA.

## Etapy (każdy: osobna sesja, raport i stop)

**A + B + C, jedna sesja.** Prompt:

> „Projekt szkoła app. Przeczytaj `claude/CLAUDE.md` sekcja 4, `claude/kierunki-system.md` i `claude/kierunek-eaia-spec.md`. W plan-bm: `node scripts/wefiz-wszystkie.mjs --tylko "Economics and IT Applications" --lata 1 --na-sucho`; jeśli grupy są, zapis bez `--na-sucho`, `node scripts/update-plan.mjs --kierunek kierunki/wefiz-eaia-1-st-2026.json`, `node scripts/kierunki.mjs`, commit i push. W skrot-bm: `python3 scripts/sylabusy-hurt.py --tylko eaia26`, potem `node scripts/kierunek-start.mjs --nowy wefiz-eaia-1-st-2026 --plan-bm ../plan-bm`. Pokaż raport (`scratch/eaia26/raport.md`) i stop.”

Sprawdź w raporcie:
- plik kierunku ma `"jezykZajec": "en"` i `"teams": false`; przedmioty z BM mają koszyk K1;
- sylabus: angielska karta (nazwy „English (Polish)”, slugi PL jak w BM), egzaminy w semestrze 1;
- mapa: **zero K2**; liczba K1 vs K3 i koszt (K1 = 0 zł).
- Jeśli `wefiz-wszystkie.mjs` nie znajdzie grup w planie kierunku, sam przejdzie do przeglądu numerów (C/M 100–499, ok. 15 min, wynik w `docs/wefiz-grupy.json`).

**D. Treści K1 (0 zł) + pilot K3 (1 lekcja).** Prompt:

> „… `claude/kierunek-eaia-spec.md`, Etap D. Mapa z modelu (`mapa-tematow.py … --na-sucho`, koszt, stop przed wysyłką). Po „wysyłaj”: `--wyslij/--odbierz`, `lekcje-z-bm.py kierunki/wefiz-eaia-1-st-2026.json k1`, `tresci-bank.py` nie dotyczy. K3: `lekcje-z-sylabusa.mjs plan` dla przedmiotu z egzaminem bez BM, `wyslij --tylko 1` (najpierw koszt), `odbierz`, `paczki`. Paczka: `paczka-lekcji.py kierunki/wefiz-eaia-1-st-2026.json scratch/eaia26/paczki --nazwa pilot`. Raport z kosztem i stop.”

Przed K1 potrzebny jest eksport lekcji BM (`docs/lekcje-v4/eksport.js` → `scratch/lessons/`) i eksport dodatków (Prościej, Dlaczego?) dla `paczka-lekcji.py`. Po akcepcie pilota: `node scripts/kierunek-start.mjs --wzorzec k3 wefiz-eaia-1-st-2026 <id lekcji>`.

**E. Reszta K3** w rytmie kolokwiów: `harmonogram-tresci.mjs` z terminami z Panelu kierunków, `lekcje-z-sylabusa.mjs` przedmiot po przedmiocie (najpierw egzaminy), `paczki`, paczka, wgranie kilku plików naraz.

**F. Start** (Ty): wdrożenie strony → Panel kierunków → Baza → „Dodaj do bazy” (EaIA, lista oczekujących; do tej chwili karty EaIA nie ma na ekranie wejścia) → wgranie paczek w trybie „Edytuję rocznik” → próbka na telefonie → „Zacznij sprzedaż”.

## Na co uważać

- **Zakres K1:** kopia BM jest 1:1. Jeśli sylabus EaIA ma węższy albo inny zakres tematu niż BM, mapa daje K1 z uwagą albo K3; uwagi przejrzyj w `mapa.html` („tylko do przejrzenia”).
- **Wspólne zajęcia z BM:** jeśli EaIA ma część wykładów razem z BM (te same sale i prowadzący w planie), lekcje są te same; nic nie trzeba robić poza K1.
- **Zasady zaliczeń:** `zasadyZaliczen: false` (ręczne zasady BM w `index.html` nie dotyczą EaIA).
- **Testy:** `tests/kierunek-en.test.js` (tryb EN), `tests/roczniki-wszystkie.test.js` i `docs/gry/test/wszystkie-roczniki.mjs` obejmą EaIA same, gdy wpis będzie w `roczniki-dane.js`.
