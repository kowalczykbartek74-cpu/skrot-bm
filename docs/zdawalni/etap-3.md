# Etap 3: ochrona wpisanych odpowiedzi

Spec: „Systemy z Zdawalni w Skrócie”, etap 3. Gałąź `zdawalni/kopie` (od `main` 457e424). **Bez SQL.**

## Co jest
- `kopie.js` (+ `tests/kopie.test.js`): kopie w localStorage `skrot:kopia:<miejsce>:<id>`, 7 dni, kasowane po zapisie na serwerze, wszystko w `try/catch`.
- Pola: „Zgłoś błąd”, własny wpis w kalendarzu, otwarte odpowiedzi próbnego testu, podsumowanie „Po zajęciach” (starosta). „Wyjaśnij” w lekcji już miało kopię w stanie lekcji; Staś nie ma pola do pisania (tylko klikanie zdań).
- Test próbny: odświeżenie w połowie nie kasuje odpowiedzi (test w `bm-exam-run` + kopia każdej otwartej odpowiedzi). Oddanie bez internetu: test czeka na ocenę AI i ponawia po powrocie sieci, zamiast przechodzić na samoocenę; można świadomie wybrać „Oceń sam według klucza”.
- Zapisy odpowiedzi w bazie (punkty rankingu) bez sieci czekają w kolejce i idą po powrocie sieci, z komunikatem „Nie zapisało się, spróbuję jeszcze raz”.

## Decyzje (moje)
- Kopia w kalendarzu znika też po „Anuluj” (świadoma rezygnacja); zamknięcie okna obok albo odświeżenie ją zostawia.
- Kolejka obejmuje tylko zapisy odpowiedzi (`nauka_rp_*`), nie start/koniec gry ani sklep: tam ponowienie po czasie nie ma sensu.
- Podsumowanie „Po zajęciach” pisze starosta, nie student, ale tekst jest długi i idzie do AI, więc też ma kopię.

## Testy
- `node --test tests/*.test.js`: 57/57 (kopie 7).
- Playwright `docs/gry/test/kopie.mjs`: 20/20 (odświeżenie w połowie testu, `setOffline` przy oddaniu i w quizie, zgłoszenie, kalendarz).
- Cały zestaw `docs/gry/test`: 32 pliki zielone, `scalanie` 2 jak na `main`.
