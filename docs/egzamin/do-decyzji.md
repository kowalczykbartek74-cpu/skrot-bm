# „Przygotuj się” 2.0: co wymaga decyzji Bartka

Gałąź `exam/przygotuj-sie`. Nic nie jest jeszcze na skrotbm.pl.

## 1. Polityka prywatności (przed wdrożeniem oceny AI)

Proponowane zdanie na końcu punktu o Anthropic w `prywatnosc.html` (lista „Korzystamy z podmiotów niezbędnych do działania Serwisu”):

> Odpowiedzi wpisane w próbnych testach (bez imienia i adresu e-mail) są przesyłane do Anthropic PBC, dostawcy modelu AI, wyłącznie w celu ich oceny.

Wersja EN (`prywatnosc-en.html`):

> Answers you type in practice tests (without your name or e-mail address) are sent to Anthropic PBC, the AI model provider, solely to grade them.

Do rozważenia (nie dopisane): przy „Nie zgadzam się” pytanie, odpowiedź i ocena AI zapisują się u nas w tabeli `nauka_ocena_odwolania`, powiązane z kontem. Jeśli chcesz to ująć, pasuje to do wiersza tabeli o postępie nauki.

## 2. Kazusy

Dwa do akceptacji w `docs/kazusy/kazusy.json`:
- OWI: `owi-1-essay-and-photocopies` (cytat a plagiat, użytek osobisty, skutki; EP3 + EP1, 3 podpunkty po 6 pkt),
- Prawo: `prawo-1-coffee-roastery` (spółka jawna a sp. z o.o., odpowiedzialność wspólników i zarządu; EP2 + EP1, 2 podpunkty po 6 pkt).

Po akceptacji dopiszę resztę (razem po 6 na przedmiot) w tym samym schemacie.

## 3. Lista dubli i tematów bez sylabusa

Narzędzie jest w Panelu AI („Zakres a sylabus”) i w konsoli (`skrotZakresSylabus()`). Działa na prawdziwych materiałach, więc listę zobaczysz po zalogowaniu jako starosta. Na danych testowych poprawnie wskazuje parę OWI „Introduction to Intellectual Property Protection” ↔ „Basic principles of intellectual property law”.

## 4. Koszt oceny AI (szacunek, Claude Sonnet 5.5: 2 $ / 1 mln tokenów wejścia, 10 $ / 1 mln wyjścia)

| test | pozycje do oceny | wejście | wyjście | koszt |
|---|---|---|---|---|
| diagnostyczny / sprint | 1 | ~0,9 tys. | ~0,5 tys. | ~0,007 $ |
| pełny OWI (1 kazus × 3 podpunkty + 3 otwarte) | 6 | ~3 tys. | ~2,5 tys. | ~0,03 $ (ok. 0,12 zł) |
| pełny z 4 otwartymi | 4 | ~2 tys. | ~1,8 tys. | ~0,022 $ |
| górna granica (30 pozycji) | 30 | ~12 tys. | ~10 tys. | ~0,12 $ |

Puste odpowiedzi nie idą do AI. Limit 5 ocenionych testów dziennie na osobę daje najwyżej ok. 0,15 $ dziennie na osobę przy pełnych testach.

## 5. Wdrożenie (po punkcie 1)

1. Supabase → SQL Editor → `supabase/skrot-v24-ocena-ai.sql` → Run.
2. `npx supabase functions deploy grade-open` (sekret `ANTHROPIC_API_KEY` już jest).
3. Scalenie gałęzi i publikacja (wersje `?v=20261103-egzamin` są już podbite).
4. Panel AI → OWI i Prawo → „Kazusy do próbnych testów” → wgraj `docs/kazusy/kazusy.json` → Zapisz.
5. Panel AI → „Lepsze klucze oceniania” → „Pokaż próbkę (5 pytań)”, obejrzyj i dopiero wtedy „Zapisz próbkę i popraw resztę”.
