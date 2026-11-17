# Pętla UX-5 – Nagrody, ranking i udostępnianie: PROGRESS

Gałąź `ux/5-nagrody`, katalog `~/zdawalni/ux-5`, port 8815. Wznowienie: „Kontynuuj pętlę UX-5 według ~/zdawalni/ux/petla-5.md i docs/audyt-ux/petla-5/PROGRESS.md”.

## Start (17.11.2026)
- Katalog roboczy i gałąź były gotowe (krok 0 Bartka), PGlite działa, serwer `python3 -m http.server 8815`.
- `docs/dzis-review/runda-ux-*/` dopisane do `.git/info/exclude`.

## Decyzje (B1 przyjęte domyślnie, bez zmian Bartka)
- D7+D8: tabela motywów/poziomów/cen z B1 (wybór 1 z 2 na poziomach 4 i 6, niewybrany na 10 / 12).
- D6: ranking domyślnie „Grupy” (średnia pkt tygodnia na aktywną osobę, podpis XP), „Stały bywalec”, „Ten tydzień”.
- Odznaki z nagrodą w monetach przyznaje baza; 100 monet na start raz na konto (wyzwalacze AFTER INSERT); gablota 3 miejsca + zwrot.
- Polecenia (D1) poza pętlą; stopka karty z kodem tylko gdy kod już jest.
- G1: nagroda za dział sprawdza w bazie punkt „lekcja” (zdany bilet) każdej lekcji działu w roczniku osoby; klucz `misja:dzial:<sid>:<unit>`, 20 monet. Gdy punkt za ostatni bilet jeszcze nie doszedł, strona ponawia raz po 3 s.
- G1: „Umiesz z zakresu” zniknęło z karty przedmiotu (jedna miara: Opanowanie = punkty kursu w %); zostaje na Dziś i w Przygotuj się.
- G1: wspólne pomiary w `docs/gry/test/ux5-lib.mjs`, część automatyczna w `docs/audyt-ux/petla-5/kontrola.mjs`.

## Etapy
| etap | runda | wynik | twarde błędy | stan | commit |
|---|---|---|---|---|---|
| G1 ścieżka | 1 | 5/10 | „w quizie” bez EN | poprawki | (bez commita rundy) |
| G1 ścieżka | 2 | 6/10 | – | poprawki | (bez commita rundy) |
| G1 ścieżka | 3 | **8/10** | – | **ZALICZONY** (K1–K4 ✓) | e1eab44 |
| G2 jedna miara | 1 | 6/10 | – (K5 ✗: okno „Jak zdobywać” z Dziś z emoji) | poprawki | |
| G2 jedna miara | 2 | 7,5/10 | – | poprawki | |
| G2 jedna miara | 3 | **8/10** | – | **ZALICZONY** (K1–K5 ✓) | commit „UX-5 etap G2 runda 3” |

## Uwagi do etapów
- G1: rundy 1–2 bez osobnych commitów (wszystko w commicie rundy 3; oceny w `etap-1/runda-N/ocena.json`).
- G1 do zrobienia przy okazji G3 (poprawki recenzenta rundy 3, nieblokujące): odznaka „Dział za Tobą” przy odbiorze (haczyk `ZD.odznaka?.("dzial1")` już jest), widoczny przyrost salda po „Odbierz”, krótszy baner z przewinięciem do skrzynki, jeden przycisk zakupu na darmowym koncie, „utrwal w Powtórkach” jako link.
- Testy jednostkowe uruchamiam sekwencyjnie (`--test-concurrency=1`): `tests/mapa-tematow.test.js` bywa czerwony równolegle (wyścig poza pętlą 5, zapis w uwagach).
- G2: emoji 🪙 ⚡ 🔥 (i 🏆 🏅 🔒) na ekranach pętli 5 (Sklep, Profil, Ranking, Hasło, Boss, Przedmiot, Gry, Paczka i okna poziomów/sklepu) zamieniane na SVG po renderze w `nagrody.js` (`znakiNaSvg`): teksty w kodzie zostają, bo słownik EN szuka pełnych tekstów. Hasło daje XP równe punktom (raz dziennie, max 20, poza limitem gier); Boss daje XP = pkt bossa.
- G2: motywy z poziomu po starych progach zostają (`S.progress.motywyZPoz`, migracja raz: `motywyMig`); motyw z pary zachowany ze starych progów liczy się jak wybór.
- G2: testy `etap9.mjs` i `poziomy.mjs` dostosowane osobnymi commitami „test: …”; `poziomy.mjs` ma 3 ✗ identyczne jak na origin/main, `etap7.mjs` TimeoutError także na main.
- G2 do zrobienia przy okazji (poprawki rundy 3, nieblokujące): linia „XP od poniedziałku, nie łączne” w Rankingu (G4), obie karty wyboru widoczne przy 360 px, „Masz 120 z 200” zamiast „Brakuje 80”, etykieta pary w Sklepie, `ico` motywów bez emoji, potwierdzenie serii po Haśle, cena przy wyborze w Profilu.
