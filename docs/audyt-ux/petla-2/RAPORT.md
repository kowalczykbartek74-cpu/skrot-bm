# Pętla UX-2 „Nawyk, seria i powroty” – raport końcowy

Gałąź `ux/2-nawyk`, scalona z `origin/main` (z pętlami UX-1 i UX-3) w commicie `991ac3a`. Wszystkie 5 etapów zaliczone.
Nic nie trafiło na produkcję: żaden SQL ani żadna funkcja Edge nie zostały uruchomione ani wdrożone.

## 1. Etapy

| Etap | Temat | Oceny kolejnych rund | Rundy | Zaliczony |
|---|---|---|---|---|
| 1 | Seria i cel dnia na Dziś (pigułka, okno serii, zamrożenia, cel 30 XP) | 7,5 → 6,5 → 7,5 → 7,5 → **8** | 5 | tak |
| 2 | Uczciwe zasady serii (zamrożenia na weekend, przerwy, prezent, tydzień) | 7 → **8** | 2 | tak |
| 3 | Powroty (karta „Dobrze, że jesteś”, lżejsza karta, naprawa serii wysiłkiem) | 5,5 → 7,5 → **8** | 3 | tak |
| 4 | Kanał poza stroną (przypomnienie z godziną z planu, mail „ratuj serię”, kalendarz, sw.js, instalacja) | 6 → **8** | 2 | tak |
| 5 | Dziś: układ, zadania dnia z auto-odbiorem, duet, tempo do kolokwium | **8** | 1 | tak |

Po zaliczeniu etapu 5 poprawiłem tanie błędy uczciwości z ostatniej recenzji (commit `6ebc690`, bez nowej oceny): „Odebrane” tylko po zapisie w bazie, pula zamiast „+0”, „Duet: Ty i {nick}”, data kolokwium do tej samej części co w „Przygotuj się”, auto-odbiór najpierw sprawdza klucz i blokuje saldo.

## 2. Ostatni JSON recenzenta każdego etapu

Pełne pliki leżą w `etap-N/runda-R/ocena.json`.

- **Etap 1 (runda 5):** `{"wynik": 8, "punkty": {"jasnosc_co_dzis": 2.5, "uczciwosc_zasad": 1.5, "powody_powrotu": 1.5, "poprawnosc_logiki": 1.5, "spojnosc_h2_360_en_ruch": 1}, "twarde_bledy": [], "kryteria": {"K1": true, "K2": true, "K3": true, "K4": true, "K5": true, "K6": true}, "poprawki": ["Koniec serii trwały (progress.seriaKoniec) w oknie i na Dziś do zamknięcia", "„chroni zamrożenie (ostatnie)” w jednej linii przy 390 px; szyk „zamrożenie chroni”", "Stan risk mocniejszy bez hover", "Strefa: dzień w xpFlush/nd vs nauka_dzis w wyzwalaczu v56 (+ test NY po nauce)", "v56 ufa progress.nd: nie liczyć nd albo zapis, że nauka_seria nie zasila rankingu", "Prezent: seria ≥ 2 zamiast 2 dowolnych dni", "Hero po nauce przeczy pigułce; wiersz „Jutro” na Dziś", "Banery nie zasłaniają powitania; koniec serii do dotknięcia", "ux2-etap1.mjs stabilny w zestawie", "Okno: jedno zdanie reguły pod liczbą i liczba zamrożeń wyżej"]}`
- **Etap 2 (runda 2):** `{"wynik": 8, "punkty": {"jasnosc_co_dzis": 2.5, "uczciwosc_zasad": 1.5, "powody_powrotu": 1.5, "poprawnosc_logiki": 1.5, "spojnosc_h2_360_en_ruch": 1}, "twarde_bledy": [], "kryteria": {"K1": true, "K2": true, "K3": true, "K4": true, "K5": true, "K6": true}, "poprawki": ["Piątek przed nauką: nie „weekend chroniony” (pt+sob+nd = 3 dni), tylko „ucz się dziś, weekend chroniony”; „weekend chroniony” po nauce", "„Uzupełnij w sklepie” tylko przy saldzie ≥ cena", "Dziś w przerwie: kropka/kratka w stylu przerwy, nie „do zrobienia”", "v55 ponownie po v56 nie może przywrócić starej nauka_dzien_nauki", "prezent(): bez pytania bazy co minutę przy „pelne”/„za_wczesnie”", "Przerwy w SQL tylko kalendarz US – flaga nieznanego kalendarza", "v56: komentarz „7 dni” vs kod; utrata dnia przy spóźnionym zapisie", "360 px: krótszy tekst stanu, „Ten tydzień” w wierszu monet", "Piątkowy impuls „weekend z głowy”, podpowiedź jak zarobić 40 monet"]}`
- **Etap 3 (runda 3):** `{"wynik": 8, "punkty": {"jasnosc_co_dzis": 2.5, "uczciwosc_zasad": 1.5, "powody_powrotu": 1.5, "poprawnosc_logiki": 1.5, "spojnosc_h2_360_en_ruch": 1}, "twarde_bledy": [], "kryteria": {"K1": true, "K2": true, "K3": true, "K4": true, "K5": true}, "poprawki": ["Nieudana naprawa (1. dzień, przerwa, powrót) przepada po cichu – komunikat + test", "Naprawa tylko na stronie – zapis w bazie albo test zgodności", "Przy karcie powrotu pigułka spokojna, strata tylko w karcie", "nieNowy dla tematów w toku; realne dane na zrzutach", "„od ostatniej nauki” zamiast „od ostatniej wizyty”", "Zrzut i asercja z zaległymi fiszkami", "Lżejsza karta po długiej przerwie z kalendarza", "360: opis pod „Wracam” w pierwszym ekranie"]}`
- **Etap 4 (runda 2):** `{"wynik": 8, "punkty": {"jasnosc_co_dzis": 2.5, "uczciwosc_zasad": 1.5, "powody_powrotu": 2, "poprawnosc_logiki": 1.5, "spojnosc_h2_360_en_ruch": 0.5}, "twarde_bledy": [], "kryteria": {"K1": true, "K2": true, "K3": true, "K4": true, "K5": true}, "poprawki": ["Offline: „Zaczynamy · 5 min” nie działa i daje mylący komunikat – powiedzieć, że lekcja potrzebuje internetu", "sw.js: limit czasu ~3 s dla nawigacji, potem kopia", "EN: przełącznik obiecuje „5 min after class”, a funkcja kalendarz zapisuje PL", "postepOffline: tylko uid ostatnio zalogowanego, nie dowolne konto", "Baner offline z ikoną zamrożenia (snow) – neutralna ikona", "K2 PL 360/390: „Nie teraz” obok „Włącz”", "Mail „seria” wariant B w dni chronione zamrożeniem sugeruje utratę", "„Nie teraz” w K2 powinno wygaszać też propozycję K1"]}`
- **Etap 5 (runda 1):** `{"wynik": 8, "punkty": {"jasnosc_co_dzis": 2.5, "uczciwosc_zasad": 2, "powody_powrotu": 1.5, "poprawnosc_logiki": 1.5, "spojnosc_h2_360_en_ruch": 1}, "twarde_bledy": [], "kryteria": {"K1": true, "K2": true, "K3": true, "K4": true, "K5": true, "K6": true}, "poprawki": ["„+0” przy 0 zrobionych – pokaż pulę albo ukryj", "„8 dni w tygodniu” czyta się jak błąd – suma dni obojga", "„Duet z Kasia” – fleksja, „Duet: Ty i {nick}”", "bezDaty zapisuje do partsOf()[0] zamiast części kolokwium (prepPart)", "„Odebrane” przy postep>=ile zamiast m.odebrana", "nauka_misje_auto: najpierw klucz, potem postęp; saldo raz; advisory lock", "atrapa: klucz tygodnia jak w bazie, max_saldo", "tempo: stan tygodnia w progress, nie localStorage", "raport: „undefined: undefined” w sekcji Ruch", "„Zadania dnia z monetami są w pełnej wersji” codziennie – rzadziej"]}`

Z etapu 4 nadal otwarte: limit czasu nawigacji w `sw.js`, komunikat „lekcja potrzebuje internetu” przy offline, `postepOffline` tylko dla ostatniego uid, neutralna ikona banera offline, „Nie teraz” obok „Włącz” w karcie K2, wariant B maila przy dniu chronionym zamrożeniem, odmowa w K2 wygaszająca K1. Z etapu 5 otwarte: stan tempa w `progress` zamiast localStorage i rzadziej pokazywana linia „Zadania dnia z monetami są w pełnej wersji”. Etap 4 poprawił z tej listy już tekst EN przełącznika kalendarza.

## 3. Przed i po

Ekran Dziś, konto płatne z 4 dniami nauki, 6.11.2026 17:00:

| | przed (`przed/`) | po (`po/`) |
|---|---|---|
| 360 jasny | [ekran](przed/dzis-360-jasny.png) · [cała](przed/dzis-360-jasny-cala.png) | [ekran](po/dzis-360-jasny.png) · [cała](po/dzis-360-jasny-cala.png) |
| 360 ciemny | [ekran](przed/dzis-360-ciemny.png) · [cała](przed/dzis-360-ciemny-cala.png) | [ekran](po/dzis-360-ciemny.png) · [cała](po/dzis-360-ciemny-cala.png) |
| 390 jasny | [ekran](przed/dzis-390-jasny.png) · [cała](przed/dzis-390-jasny-cala.png) | [ekran](po/dzis-390-jasny.png) · [cała](po/dzis-390-jasny-cala.png) |
| 390 ciemny | [ekran](przed/dzis-390-ciemny.png) · [cała](przed/dzis-390-ciemny-cala.png) | [ekran](po/dzis-390-ciemny.png) · [cała](po/dzis-390-ciemny-cala.png) |
| 1280 jasny | [ekran](przed/dzis-1280-jasny.png) · [cała](przed/dzis-1280-jasny-cala.png) | [ekran](po/dzis-1280-jasny.png) · [cała](po/dzis-1280-jasny-cala.png) |
| 1280 ciemny | [ekran](przed/dzis-1280-ciemny.png) · [cała](przed/dzis-1280-ciemny-cala.png) | [ekran](po/dzis-1280-ciemny.png) · [cała](po/dzis-1280-ciemny-cala.png) |

Pozostałe ekrany (okno serii, karta powrotu, przypomnienia, kalendarz, instalacja, linia zadań, duet, pusty stan Powtórek) są w zrzutach ostatnich rund: `etap-N/runda-R/*.png`.
Treść Dziś przy 390 px zajmuje 1744 px (wcześniej ok. 2690 px). Mierzone od góry `#main` do dołu bloku „Więcej na dziś”, bez stopki.

## 4. Do wdrożenia przez Bartka (klik po kliku)

### SQL (Supabase → SQL Editor), w tej kolejności, po v52–v54 z pętli UX-1
Każdy plik otwierasz na github.com w gałęzi `main` i kopiujesz przyciskiem „Copy raw file”. Nie kopiuj przez Terminal, bo zepsuje polskie znaki. Wszystkie trzy pliki można uruchomić ponownie.
1. `supabase/skrot-v55-seria-zamrozenia.sql`: zamrożenia na konkretne dni (`nauka_zamrozenie_uzyj_dni`), zamrożenie w prezencie (raz na konto, od serii 2), seria w bazie (`nauka_seria`) i przerwy z kalendarza uczelni (`nauka_przerwa`).
2. `supabase/skrot-v56-dni-nauki.sql`: tabela `nauka_dni` z wyzwalaczami na postęp i punkty, uzupełnienie historii. Nadpisuje `nauka_dzien_nauki` z v55.
3. `supabase/skrot-v57-kanal-zadania.sql`: historia maili z rodzajem (rotacja wariantów „seria”), rodzaj „seria” w ustawieniach przypomnień, `nauka_kalendarz_nauka` oraz **auto-odbiór Zadań dnia** (`nauka_misje_auto` i nowa wersja wyzwalacza `nauka_mon_z_rp`).

Po każdym pliku: kliknij **Run**, sprawdź, że na dole jest „Success”, i przejdź do następnego.

Wynik `node scripts/funkcje-sql.mjs --nadpisane`:
- v55: `public.nauka_dzien_nauki(uuid, date)` ma nowszą wersję w v56 (zamierzone);
- v56: nic;
- v57: nic.

v57 nadpisuje 3 funkcje sprzed pętli: `nauka_przypomnienia_kandydaci` (v44), `nauka_przypomnienia_ustaw` (v36) i `nauka_mon_z_rp` (v14). Każda z nich to kopia poprzedniej wersji plus nowe pole albo wywołanie.

### Funkcje Edge (Supabase → Edge Functions)
1. **przypomnienia:** wdróż z repo pliki `supabase/functions/przypomnienia/index.ts`, `obsluga.ts` i `logika.js`. Plik `logika.js` jest kopią `przypomnienia.js`. Nowości: rodzaj maila „seria” w 3 wariantach, link „?zadania=1#/” w mailu o zadaniu i „?wracam=1#/” w mailu o powrocie. Komenda: `supabase functions deploy przypomnienia`.
2. **kalendarz:** zmiany w `supabase/functions/kalendarz/index.ts`: nazwa Zdawalni i opcjonalny wpis „Zdawalni · 5 min po zajęciach” z alarmem. Komenda: `supabase functions deploy kalendarz`.

Funkcje wdrażaj **po** SQL v57, bo obie z niego korzystają. Bez v57 funkcje działają jak dotąd: nie wyślą „serii” i nie dodadzą wpisu nauki.

### Strona
`sw.js` i `manifest.webmanifest` wchodzą razem ze stroną. Na https worker rejestruje się sam. Wyłączysz go, otwierając stronę z `?sw=off`: worker się wyrejestruje i skasuje swoje pamięci.

## 5. Do decyzji Bartka
- **D5 cel dnia:** stałe 30 XP. Wyboru 30/50/80 w Ustawieniach nie zrobiłem, bo wymagałby zmian w cudzych miejscach.
- **Web push:** wszystkie etapy są zaliczone, więc według B1 push jest dozwolony, ale go nie zrobiłem. Kanałem są nadal mail i kalendarz. Push wymaga kluczy VAPID i nowej funkcji Edge, czyli decyzji o kosztach i zgodach.
- **Naprawa serii** („odzyskaj 2 dni nauki”) działa tylko po stronie przeglądarki, przez `progress.streakRepair`. Baza (`nauka_seria`) jej nie zna, więc ranking i maile widzą serię bez naprawy.
- **Przerwy w SQL** (`nauka_przerwa`) obejmują tylko kalendarz US 2026/27. Dla innego rocznika trzeba uzupełnić daty.
- **Service worker na localhost** działa tylko z `?sw=on`, żeby zwykłe testy Playwright nie dostawały pamięci podręcznej.
- **Format linków w mailach:** zapytanie przed hashem (`?zadania=1#/`, `?wracam=1#/`), bo router odrzuca `#/?…`.
- **Wysokość Dziś ≤ 1800 px:** spełniona przez zwinięty blok „Więcej na dziś” (Boss, Na luzie, Przewodnik, nowości) i zwarte wiersze lekcji na telefonie. Jeśli Boss ma być zawsze widoczny, Dziś urośnie o ok. 280 px.
- **Tempo „W tym tygodniu: k z cel”:** stan tygodnia liczony jest w localStorage, więc na innym urządzeniu k zaczyna się od 0. Do przeniesienia do `progress`, jeśli to przeszkadza.

## 6. Uwagi dla innych pętli
Pełna lista jest w [`uwagi-dla-innych.md`](uwagi-dla-innych.md). Najważniejsze:
- **Pętla 5:** Zadania dnia odbiera teraz baza (v57). `misjaCard` powinna pokazywać „✓ Odebrane” z `m.odebrana`. Stan zadań daje `ZD_NAWYK.zadaniaStan()`. Tekst `kBuy` dla zamrożenia mówi „tylko wygląd”, a to nieprawda.
- **Pętla 3:** prawdziwa `ofertaPrzypomnienia()` ma 2 własne przyciski, a reguła „≤ 2 przyciski na ekranie końca” je liczy. W `ux3-etap5.mjs` wariant „bez ZD_NAWYK” po scaleniu usuwa `window.ZD_NAWYK`.
- **Pętla 4:** „najdłuższa seria” w statystykach dalej znaczy passę odpowiedzi. Do tego `weekLine` w przerwie pokazuje polski opis także w EN.

## 7. Ryzyka przy scalaniu i miejsca poza `nawyk.js`
- **`index.html`:** `viewHome` (cała kolejność Dziś, blok „Więcej na dziś”), `ldBlock` (linia zadań pod kartą dnia, Profil nauki tylko w 3 pierwszych dniach), `ptsDzis` (tempo, „Znasz datę kolokwium?”, terminy w wersji darmowej, starosta), `reviewHome` (pusty stan), `przypHomeCard`, `setPrzyp` (wiersz „Seria dni”), `przypStan`, `openPhoneCal`, `termIcs`, `lpLevelBar`, `xpFlush` (część serii), `streakNext`, `kStreakAlive`, `LP_DAILY_GOAL` i most `// === most ux-2 ===` na końcu. Trzy wyrażenia zakupu `// ux-1` są identyczne jak w pętli 1.
- **Inne pliki:** `lekcja-dnia.js` (`trybDnia`, `kartaPowrotu`), `przypomnienia.js` razem z kopią `supabase/functions/przypomnienia/logika.js` (muszą być identyczne), `obsluga.ts`, `kalendarz/index.ts` i złoty plik `tests/fixtures/kalendarz-bm.ics`, `i18n-en.js` (blok `// ux-2`), `docs/gry/test/atrapa-supabase.js` (bloki `// === ux-2 ===`; auto-odbiór zadań przy odczycie, `mock-auto-misje` = "0" wyłącza), `supabase/test/pglite.mjs` (v55–v57), nowe pliki `sw.js` i `manifest.webmanifest`.
- **Scalenie z UX-1 i UX-3 jest już zrobione** (`991ac3a`). Rozwiązane konflikty:
  - linia `// ux-1 tymczasowo` usunięta, `pasekProby` z pętli 2;
  - wszystkie mosty i skrypty zostały;
  - `i18n-en.js` i atrapa mają obie strony;
  - migracje ułożone rosnąco v52 → v57.
- **Testy poprawione po scaleniu** (osobne commity „test: …”):
  - `ux3-etap5.mjs`: wariant „bez ZD_NAWYK”;
  - `ux2-etap3.mjs`: odpowiedź przez „Sprawdź” z pętli 3;
  - `ux1-etap3.mjs`: co najmniej 17 testów przypomnień zamiast dokładnie 17;
  - wcześniej w tej pętli: `przypomnienia.mjs` (godzina z planu, 4 rodzaje maili), `poziomy.mjs`, `lekcja-dnia-4.mjs` (lekcje jedna pod drugą na telefonie).
- **Pętle 4 i 5 jeszcze nie scalone:**
  - pętla 5 zmienia `shopMisje`/`misjaCard` i Bossa (u mnie Boss jest w „Więcej na dziś”);
  - pętla 4 (etap B) zmienia tokeny kolorów, a mój CSS w `nawyk.js` używa zmiennych palety (`--h-lime`, `--line`, `--muted`, `--accent`).

### Testy po scaleniu
Pełny wynik: [`koniec/regresja.md`](koniec/regresja.md).
- **Razem:** 2364 ✓, 14 ✗.
- **Zielone:** wszystkie testy etapów pętli 1, 2 i 3 (`ux1-etap*`, `ux2-etap*`, `ux3-etap*`), `node --test tests/*.test.js` (394/0) i PGlite v52–v57.
- **Czerwone, ale tak samo na czystym `origin/main`** (sprawdzone w osobnym drzewie): PGlite v12 `limit_wpisow`, `poziomy.mjs` (ekran końca quizu), `scalenie-zdawalni.mjs` D, `lekcja-dnia.mjs`, `lekcja-dnia-3.mjs`, `kopie.mjs`, `dzien.mjs` i `kosmetyki/etap4.mjs`.
