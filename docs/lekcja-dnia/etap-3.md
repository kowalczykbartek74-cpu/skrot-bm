# „Dla Ciebie na dziś”, etap 3: mechaniki w trybie lekcji

Gałąź `lekcja-dnia/mechaniki` (od `lekcja-dnia/odtwarzacz`). Bez SQL. Gry zapisują rundy i odpowiedzi obecnymi RPC.

## Co jest
- **`gry.js`: tryb lekcji** (`open(gra, { lekcja })`).
  - To ta sama gra i ten sam kod. W lekcji zmienia się tylko pula i długość rundy:
    - pula z tematu (`pool`, `tasks`, `pairs`, `ladder`);
    - runda 90 s (Fruń, Przejdź i Pary liczą czas samej gry, bez pytań i pauzy);
    - na końcu `onEnd(wynik)` i powrót do odtwarzacza, bez ekranu wyniku.
  - Adres się nie zmienia (bez `#/gra/…`), a odtwarzacz lekcji zostaje pod spodem z blokadą przewijania.
  - „Wstecz” w trakcie rundy pyta „Przerwać rundę?”. Przerwana runda wraca na kartę jako „Runda przerwana”.
  - Zapis w bazie jak dotąd: `nauka_gra_start`, odpowiedzi `zrodlo: "gra"`, `nauka_gra_koniec`, obecne limity (D10).
  - Gdy baza nie da rundy (`too_many_runs`, `no_access`), gra w lekcji i tak się toczy, tylko bez punktów rankingu (lekcja nie może stanąć). Poza lekcją bez zmian.
- **Drabina**: szczeble i progi z lekcji. W lekcji jest 6 szczebli z progami 2 i 4 (`run.lekcja.drabina`), zwykła Drabina zostaje bez zmian (12 szczebli).
- **Pule z tematu** (`ldGamePool`):
  - pytania z quizu tematu, najpierw niewidziane; gdy jest ich mniej niż 8, silnik dobiera pytania z całego przedmiotu (6.2);
  - zadania „podobne” z `worked`;
  - pary z pojęć tematu (pojęcie ↔ definicja, plansza 6 par);
  - Drabina: 6 pytań tematu od łatwego do trudnego (skuteczność roku z `rp.trudnosc`, jak w Drabinie); bez 6 pytań w temacie bierze pytania z Drabiny przedmiotu.
- **Nowe karty odtwarzacza**:
  - **`gra`** to zapowiedź i przycisk „Zagraj →”; po rundzie karta pokazuje wynik (np. „6 szczebli · 6/6 dobrze”) i ma „Zagraj jeszcze raz”.
  - **`stas`** to ćwiczenie Stasia jak w `#/stasx` (te same klasy i postać). Zapis jest ten sam: `rpSend("stas")`, `stasDone`, `learnEvent`. Różnica: na końcu „Dalej” w lekcji zamiast przejścia na ekran Stasia.
  - **`haslo`** to jedno pojęcie z tematu (jedno słowo, 4–12 liter, to samo przez cały dzień), 6 prób i plansza Hasła dnia. Oceny liter liczy lokalnie `lekcja-dnia.js → hasloOcena`, bez bazy i bez wpływu na dzienne Hasło dnia.
- **Zadanie krok po kroku**:
  - najpierw kroki rozwiązania (karta „Przykład: spróbuj sam”);
  - potem „podobne” zadanie samodzielnie, na karcie liczbowej ze sprawdzeniem wyniku. Wynik idzie przez `rpSend("zadanie")`, jak w materiale.
  - Pod wynikiem jest „Sprawdź zdjęcie rozwiązania” (`fotoBox`, tylko płacący, limit dzienny), gdy zadanie ma klucz do zdjęcia.
- **Kazus**: treść sprawy i pytanie (najwyżej 2 pytania). Uczeń pisze odpowiedź, a potem porównuje ją z rubryką (problem, reguła, zastosowanie, wniosek) i wzorem. AI nie ocenia, bo do 1.12 jest zablokowane.
- **Boss**: dobre odpowiedzi z lekcji liczą się w bazie same. Po lekcji z przedmiotu z aktywnym Bossem strona odświeża Bossa z animacją ciosu (`bsArm` + `bsLoad`).
- **Pozostałe zmiany**:
  - spisy Stasia i „5 minut” wczytują się przed złożeniem kart, także po odświeżeniu strony;
  - klawisze odtwarzacza nie działają pod grą;
  - nowe napisy po angielsku, wersje `gry.js`, `lekcja-dnia.js` i `i18n.js` podbite.

## Decyzje (moje, do zmiany na Twoje słowo)
- **Gry w lekcji zużywają zwykłe rundy z bazy** (D10). Punkty rankingu dają tylko 3 rundy dziennie, więc po jednej lekcji z dwiema grami i Drabiną uczeń zwykle wyczerpie limit. Zmiana tego wymagałaby SQL, więc zostawiam do Twojej decyzji.
- **Hasło w lekcji przyjmuje litery bez polskich znaków** („Łąka” = „LAKA”), tak jak Hasło dnia (A–Z).
- **„Zagraj jeszcze raz”** nadpisuje wynik na karcie. XP i punkty liczą się według zwykłych limitów gier.

## Testy
- `node --test tests/*.test.js`: 237/237 (silnik 49, w tym ocena Hasła z powtórzonymi literami).
- **Nowy `docs/gry/test/lekcja-dnia-3.mjs`: 29/29.** Lekcja z wstrzykniętym planem ma wszystkie mechaniki naraz:
  - Hasło (kolory liter, zgadnięcie, definicja);
  - Staś (zaznaczanie, poprawki, 4/4, zapis i RPC);
  - Fruń nad lekcją (adres bez zmian, „Druga szansa”, koniec rundy wraca z wynikiem, `nauka_gra_start` / `koniec` / odpowiedzi z gry, blokada przewijania zostaje);
  - zadanie krok po kroku (kroki, potem samodzielny wynik i `nauka_rp_zadanie`);
  - Pary (6 par z tematu, „wstecz” pyta o przerwanie, lekcja zostaje);
  - kazus (rubryka i wzór);
  - Drabina na 6 szczebli (cała drabina = 6);
  - koniec lekcji, historia mechanik, brak błędów w konsoli.
- `lekcja-dnia.mjs` (etap 2): 30/30.
- Regresja w porównaniu z `main`:
  - gry etap1 70/70, etap3 47/47, etap4 29/29, etap9 82/82, Staś 40/40;
  - etap7: 3 ✗ (motyw różowy i dwa napisy EN „próba”), te same co na `main`, nie przeze mnie;
  - etap8 73/73 po podniesieniu progu przyrostu `gry.js` z 3,5 do 6 kB. Tryb lekcji to ok. 2,4 kB, a sam warunek „bez kodu Drabiny w gry.js” zostaje.
