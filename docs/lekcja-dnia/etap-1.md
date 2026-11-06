# „Dla Ciebie na dziś”, etap 1: silnik

Gałąź `lekcja-dnia/silnik` (od `lekcja-dnia/etap-0`). Bez SQL i bez zmian w `index.html`. Strona jeszcze nie ładuje pliku, podepnie go etap 2/4.

## Co jest
`lekcja-dnia.js` (`window.SKROT_LD`, w testach `require`), czysta logika bez DOM:
- **`WAGI`**: wszystkie wagi i progi w jednym obiekcie (4.4 + tryby + 6.4).
- **`KATALOG`**: mechaniki z 6.2 jako dane: typ, energia, minuty, czy na czas, czy wymaga pisania, wymagana treść, rola w szablonie.
- **`ulozDzien(tematy, kontekst)`** zwraca:
  - tryb dnia;
  - kartę 5 min: rozgrzewka 1 min, główny kawałek 3 min, sprawdzenie 1 min, ton `warn`/`calm`, powody;
  - dwie lekcje: „Najważniejsze teraz” i „Na zmianę”, z innego przedmiotu albo, gdy zaliczenie jest za ≤ 2 dni, jako mieszanka tematów zakresu.
- **`ulozLekcje([temat, …pokrewne], opcje, kontekst)`** zwraca segmenty:
  - kolejność: haczyk → uczę się / sprawdzam / tworzę na zmianę → finał;
  - gra-przerwa wpada co `graCo` minut, a także między dwoma segmentami tego samego typu;
  - rewanże idą po grze, nigdy przed segmentem „sprawdzam”;
  - gdy treści brakuje, silnik dokłada pokrewny temat.
- **`jeszczeJedna`**: lekcja po obu zrobionych. **`powody` / `powodTekst`**: „Dlaczego to?” jako kody i tekst PL.
- **Profil:**
  - długość 15 / 20 / 25 min z `blockMinutes`; 3× przed czasem → o stopień krócej;
  - gra co 4 / 5 / 7 min;
  - przed snem (≤ 60 min do snu albo do 3 h po godzinie snu);
  - stres oznacza tylko spokojne mechaniki, bilet i brak rankingu;
  - finał i podsumowanie dobierane według motywacji.
- **Aktywność:**
  - mechanika porzucona 3× od ostatniego ukończenia wypada na 7 dni; „sprawdzam” i „tworzę” zostają w innej formie;
  - mechanika ukończona dobrze ≥ 2× w 14 dni dostaje bonus;
  - mechanika z obu ostatnich lekcji dostaje karę;
  - gry idą na zmianę: Fruń, potem Przejdź.

## Zastępstwa z etapu 0 (wpisane w katalog)
- **sprawdzam**: Staś → Rozróżnij (działa dopiero, gdy będą atomy) → **Pytania z quizu tematu z „Pewny / Zgaduję”**.
- **tworzę**: Wyjaśnij → ćwiczenie z lekcji → zadanie krok po kroku → kazus. W przedmiotach ilościowych (`ilosciowy`, np. Analiza) zadanie krok po kroku idzie pierwsze, z opcją zdjęcia.
- **uczę się bez nowego materiału**: „Przypomnienie” (część podsumowania „5 minut” albo recap) zamiast nowej sekcji.
- **haczyk**: Hasło tylko przy temacie, który ma pojęcie-słowo, inaczej Pary.
- Karta liczbowa (`gen`) i Rozróżnij włączą się same, gdy pojawi się treść (`tresc.gen`, `tresc.atomy`).

## Decyzje (moje, do zmiany na Twoje słowo)
- **Stres:**
  - bez zaliczenia w ciągu 7 dni: tryb „Lekko”;
  - z zaliczeniem: tryb „Przed kolokwium”, ale ze spokojnymi mechanikami.
- **Godzinę przed snem nie ma nowego materiału także w lekcji 1** (D6). Lekcja 2 ma tryb „Przed snem”.
- **Wymogi trybów spokojnych i „w drodze”:**
  - w trybie spokojnym (stres, przed snem, lekko) nie obowiązuje „≥ 2 gram”, bo jedyną spokojną grą jest Hasło;
  - w trybie „w drodze” nie obowiązuje też „≥ 1 tworzę”, bo każda forma „tworzę” wymaga pisania.
- **Gry w lekcji**: segment niesie `limitSec: 90`, Drabina `szczeble: 6`. Gry na to dopiero czekają (etap 3).
- **Wynik tematu przy złej porze**: nowy temat dostaje −10, gdy `dobraPora === false` (rytm, etap 5).

## Testy
- `node --test tests/*.test.js`: 232/232, w tym `tests/lekcja-dnia.test.js` 44/44. Są tam wszystkie przypadki z listy specu i dodatkowe: mieszanka, po/przed zajęciach, pominięty 2×, „w drodze”, ilościowy, rewanże po grze, nowość, lubiana, „Dlaczego to?”.
- Próba na prawdziwym spisie 115 lekcji z etapu 0, w 4 profilach (domyślny, krótkie skupienie, długie skupienie, stres): 460 lekcji, 0 naruszeń zasad, długość 14–23 min.
