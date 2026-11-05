# Etap 2: zeszyt błędów i rewanże

Spec: „Systemy z Zdawalni w Skrócie”, etap 2. Gałąź `zdawalni/rewanze` (od `main` 70b33e5). **Bez SQL**: wszystko w `progress` (synchronizacja jak dotąd).

## Co jest
- `rewanze.js`: port 1:1 `matura-app/lib/domain/mistakes.ts` + `rematch.ts` (wersja z FSRS, gałąź `feat/l7-learner-bundle`), testy w `tests/rewanze.test.js` (port testów Zdawalni, terminy FSRS 3 i 8 dni jak tam).
- Do rewanży trafia zła albo zgadnięta odpowiedź z: quizu przedmiotu, gier, `check`/biletu lekcji, zadania liczbowego lekcji, pytań zamkniętych próbnego testu. Pytania otwarte z oceną AI nie (zostają w „Co poprawić”).
- Powtórki: blok „⚔️ Rewanże” i seria „Rewanże” na początku sesji (najwyżej 10 dziennie); Dziś i plakietka Powtórek liczą rewanże („W tym N rewanży”).
- Gry i quizy: jedna lista. `bm-gry-zle` przechodzi jednorazowo do `progress.rew` (`progress.rewMig`), pomylone z „Po zajęciach” dalej wracają w grach z `bm-po-zle`.
- Bez punktów rankingu i monet.

## Decyzje (moje, do zmiany na Twoje słowo)
- Klucz pytania z quizu przedmiotu: `z:<mid>:<idx>` (nowy rodzaj karty w Powtórkach).
- Pytanie w zeszycie nie pojawia się równolegle w zwykłych powtórkach; po pokonaniu wraca do nich ze swoją kartą FSRS.
- Bez XP za rewanże (spec: opcjonalnie). Komunikaty: zapis „wróci jutro” po quizie zbiorczo, wygrana / pokonane / przegrana jako krótki dymek w powtórce.
- Pytania z „Po zajęciach” bez rewanży (nie ma ich w materiałach, karta nie dałaby się odtworzyć).

## Testy
- `node --test tests/*.test.js`: 50/50 (rewanże 12).
- Playwright `docs/gry/test/rewanze.mjs`: 23/23 (quiz → jutro, ten sam dzień się nie liczy, wygrana, 3 wygrane = pokonane, migracja gier, drugi przedmiot, EN).
- Cały zestaw `docs/gry/test`: jak na `main` (etap7 3 i scalanie 2 padały już wcześniej); `etap1` i `polaczenia-4` poprawione pod nową listę pomylonych.
