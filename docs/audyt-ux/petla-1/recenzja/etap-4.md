# Materiał dla recenzenta – pętla UX-1, etap 4

Wyciąg z polecenia pętli (bez zmian). Oceniasz tylko to, co widać na zrzutach, w raporcie, w kontroli automatycznej i w logu testów (także SQL).

## Cel pętli
Każda nowa osoba, która wejdzie z linku od starosty, ma w pierwszej minucie zobaczyć, czym jest Zdawalni, i wejść w 3 dni próby jedną oczywistą ścieżką. W trakcie próby ma czuć jej upływ. Koniec próby ma być wydarzeniem z jedną jasną decyzją: postęp, najbliższe kolokwium, plan 199 zł na górze. Kto nie kupi, nie może zniknąć bez śladu.

Jak wygląda sukces (sprawdza recenzent):
- logowanie otwiera się od góry, bez skoków, z jednym zielonym przyciskiem „Zacznij 3 dni za darmo”;
- nikt nie trafia do darmowej wersji „przez przypadek”: po pierwszym logowaniu nowej osoby jest propozycja próby;
- w próbie na pierwszym ekranie Dziś widać „Próba · dzień 2 z 3 · do pt 17:00”, w ostatnich 24 h wyraźniej;
- po próbie jest ekran „Twoje 3 dni minęły” z postępem i planami, a przycisk zakupu jest zielony i jeden;
- paywall kotwiczy na 199 zł, a nie na 35 zł miesięcznie, i pokazuje, co jest w lekcji;
- są drogi odzyskania osoby: mail przed końcem próby (za zgodą), +2 dni przed kolokwium, arkusz przed anulowaniem;
- nie ma kłamstw: kierunki bez treści mają napis „Wkrótce”, w próbie konto nie mówi „do końca 2. semestru”.

## Kryteria etapu 4
**Etap 4 – Paywall, odzyskiwanie i zaufanie** (C4)
- K1: paywall zablokowanej lekcji (`/material/A2`, konto `darmowe` i `proba-koniec`, 390×844): przycisk z „199 zł do lipca · ok. X zł / mies.” w pierwszym ekranie, opis ≤ 2 linie, lista tytułów sekcji lekcji, „N pytań · K pojęć · ok. M min”; 35 zł jako drugi przycisk.
- K2: `choosePlan`: pod 199 zł „to ok. X zł miesięcznie”, karta 199 zł zaznaczona i pierwsza.
- K3: klik w nieaktywny przycisk płatności → komunikat `role=alert` „Zaznacz obie zgody powyżej…” i fokus na pierwszym polu.
- K4: `skrot-v54-….sql` + karta na Dziś „Kolokwium z {przedmiot} za {n} dni. Masz jeszcze jedne 2 dni…”: tylko po zakończonej próbie, raz na konto, tylko w oknie ≤ 7 dni (PGlite).
- K5: plan miesięczny: przed portalem Stripe arkusz z porównaniem „Zostało ok. N mies. … 199 zł” i przyciskami „Przejdź na 199 zł” / „Anuluj subskrypcję”.
- K6: RPC licznika rocznika (w v54) i linia „N osób z {kierunek} uczyło się tu w tym tygodniu” tylko od 15; FAQ „Kto to robi?”; w oknie konta link „Usuń konto i dane” do Ustawień.

## Zasady wyglądu i dostępności (A4 pkt 6–7)
6. **Wygląd:** paleta z `PALETA.md` i H2 (`--h-*`, #F4F5F0, #10231A, #3E5046, #1A7F45, #CDF25E, #DDE7D8, #EDF1EA, `--bad`, `--warn`), bez nowych kolorów. Kontrast WCAG AA każdego tekstu (mierz jak `dzis-review.mjs`), cele dotyku ≥ 44×44 px (mierz faktyczne pole, nie próg axe 24 px), nowy tekst ≥ 12 px, zero poziomego przewijania przy 360 i 375 px, sprawdzaj też 1280 px, jasny i ciemny zielony (`html[data-green=dark]`). Ikony według A4c, **bez emoji jako ikon** w nowym kodzie. Każdy ruch wyłączany przez `prefers-reduced-motion` **i** `html.calm`.
7. **Telefon pierwszy.** Główne akcje w zasięgu kciuka (dół ekranu), jeden główny przycisk na ekran.

## Zasady SQL (A4 pkt 1)
1. **Nic na produkcję.** Nie łączysz się z bazą Supabase, nie uruchamiasz SQL na produkcji, nie wdrażasz funkcji Edge, nie zmieniasz ustawień Stripe, Resend ani DNS. SQL tylko jako nowy plik `supabase/skrot-vNN-….sql` (numery z nagłówka pętli; nagłówek „Wklej w Supabase → SQL Editor → Run, po vNN”, plik idempotentny, ze strażnikiem kodowania jak w v44+) + test PGlite `supabase/test/vNN.sql`. Kolejność migracji jest w jednej tablicy `const order = [...]` w `supabase/test/pglite.mjs` (czyta ją też `scripts/funkcje-sql.mjs`): dopisz swój plik **2×** i jego test **za `"test/v51.sql"`**, nie przeformatowuj tablicy. Pierwsza linia kodu każdej nowej migracji to blok strażnika kodowania z `supabase/straznik-kodowania.sql` (wymaga tego `tests/migracje.test.js`). Jeśli `tests/migracje.test.js` każe odświeżyć `supabase/naprawa-znakow.sql`, zrób to `node scripts/funkcje-sql.mjs --naprawa > supabase/naprawa-znakow.sql` w osobnym commicie. **Nie nadpisujesz funkcji SQL innej pętli** (lista właścicieli w B3): gdy potrzebujesz ich zachowania, piszesz nową funkcję albo wyzwalacz. Do RAPORT wklej wynik `node scripts/funkcje-sql.mjs --nadpisane skrot-vNN-….sql` dla każdej swojej migracji. Funkcje Edge tylko w kodzie (`supabase/functions/…`) z testem; wdraża Bartek.

## Tabela ocen
### Tabela ocen recenzenta (razem 10, ta sama dla każdego etapu tej pętli)
| Kryterium | Punkty |
|---|---|
| Jasność pierwszego ekranu i jednej ścieżki do próby / zakupu (co to jest, co mam kliknąć) | 3 |
| Uczciwość i czytelność ceny, próby i stanu dostępu | 2 |
| Spójność z H2 i Stasiem (fonty, kształty, paleta, bez emoji) | 2 |
| Poprawność logiki: stany kont `brak/darmowe/proba/proba-koniec/platne`, SQL, testy | 2 |
| Telefon i dostępność (360 px, kciuk, kontrast, EN, reduced-motion) | 1 |

Do tego twarde błędy z A5 i lista kryteriów etapu (każde kryterium musi być spełnione, żeby zaliczyć).

## Twarde błędy
**Twarde błędy (każdy obniża ocenę do maks. 5). Liczą się tylko dla elementów nowych albo zmienionych w tej pętli** (sprawdza je recenzent na podstawie zrzutów, testów i części automatycznej raportu). Błąd, który istniał już na `main` w nie Twoim obszarze, nie blokuje etapu: zapisz go w `uwagi-dla-innych.md`. **Lista:** tekst poniżej AA; poziome przewijanie przy 360/375 px; błędy konsoli; nowy tekst bez EN; kolor spoza palety; emoji jako ikona w nowym kodzie; ruch niewyłączany przez reduced-motion lub `html.calm`; czerwony test (nowy lub istniejący); zmieniona kolejność albo treść pytań quizu; zapis do produkcji; zmiana w miejscu kodu należącym do innej pętli (lista w B3); cel dotyku < 44 px w nowym elemencie; `undefined`/`null` widoczne na ekranie.

## Decyzje przyjęte domyślnie (B1)
### B1. Decyzje przyjęte domyślnie
Bartek może je zmienić przed startem (edytując ten plik). Jeśli nic nie zmienił, przyjmij je jak niżej i zapisz w `PROGRESS.md`.

- **D4 Mail przed końcem próby:** widoczny przełącznik przy starcie próby, **domyślnie odznaczony** (zgoda zaznaczana przez studenta). Jeden mail dzień przed końcem.
- **Kierunki oczekujące:** tag „Wkrótce” + zapis na listę; próby dla rocznika innego niż `platny` nie da się uruchomić.
- **+2 dni przed kolokwium** dla osób po próbie bez zakupu: raz na konto, tylko gdy do najbliższego terminu ≤ 7 dni.
- **Kupon retencyjny w Stripe:** NIE (decyzja cenowa Bartka). Arkusz przed anulowaniem tylko porównuje plany.
- **Adres pomocy:** zostaje obecny (zmiana na adres w domenie wymaga skrzynki; zapisz w RAPORT jako decyzję Bartka). FAQ „Kto to robi?” bez imienia i nazwiska, chyba że jest w regulaminie § 1 – wtedy tak, jak w regulaminie.
- **Licznik „N osób z kierunku uczyło się w tym tygodniu”:** pokazywany dopiero od 15 osób.
- **Lekcja dla gościa (etap 5):** robisz, jeśli etapy 1–4 są zaliczone albo zamknięte; to największy koszt (L).
- Regulaminu i treści zgód NIE zmieniasz (`CONSENT_V` bez zmian).

## Podział na pętle (B3) i umowy
### B3. Kto co robi (podział na 5 pętli – ten sam we wszystkich plikach)
Zmieniasz tylko miejsca swojej pętli. Gdy coś z cudzego obszaru jest konieczne, dopisz małe wywołanie z zabezpieczeniem (`window.ZD_X?.fn?.()`) albo zapisz to w `uwagi-dla-innych.md`.

| Pętla | Gałąź / katalog / port | Własny plik | Miejsca w kodzie (właściciel) | SQL |
|---|---|---|---|---|
| **1 (TY) Wejście i zakup** | `ux/1-wejscie` · `~/zdawalni/ux-1` · 8811 | `ux-wejscie.js` | `#login`, `.lg-*`, `#loginBox`, ekran wyboru kierunku, logowanie i okres próbny w `skrot-supabase.js` (`emailStep`, krok kodu, `startTrial`, `TRIAL_ERR`, `choosePlan`, `goPay`, `manage`, `refreshMe`, `afterReady`), `showWelcome`, `tryStart`, `buyBanner`, `paywallCard`, `trialBtn`, `openAccount`, tekst konta w Ustawieniach, reguła CSS szarego `.btn` na Dziś (index.html ok. 5113–5117), `skrotPokaz`, rodzaj maila „próba” w funkcji `przypomnienia`, `supabase/functions/stripe-webhook`, CSS i HTML logowania w linii 1 (tylko blok `#login`; nowy CSS logowania w `ux-wejscie.css`). Wyjątek: w 3 miejscach z „Kup dostęp” na Dziś (`index.html` ok. 20032 w `ldBlock`, 11322 i 11374 w `ptsHome`/`ptsDzis`) podmieniasz **tylko wyrażenie tworzące przycisk** na `window.ZD_WEJSCIE?.przyciskZakupu?.('…') ?? <stary przycisk>` z komentarzem `// ux-1` | v52–v54 |
| **2 Nawyk i powroty** | `ux/2-nawyk` · `~/zdawalni/ux-2` · 8812 | `nawyk.js` | `viewHome` (kolejność bloków Dziś i nowe karty), `lpLevelBar` (pigułka serii), `streakNext`, `kStreakAlive`, `kFreezeUse`, `xpFlush` (tylko część serii), `LP_DAILY_GOAL`, `przypHomeCard`, `przypomnienia.js` i funkcja `przypomnienia` (poza rodzajem „próba”), `supabase/functions/kalendarz`, `lekcja-dnia.js` (`trybDnia`), `ptsDzis`/`ptsHome` (tempo, terminy bez daty; bez wyrażeń przycisku zakupu z pętli 1), `ldBlock` (układ; bez wyrażenia przycisku zakupu), pusty stan Powtórek, linia zadań dnia na Dziś + auto-odbiór w bazie, `misjaClaim`, `manifest.webmanifest`, nowy `sw.js`, jednorazowe `.ics` (`index.html` ok. 7037) | v55–v57 |
| **3 Lekcja** | `ux/3-lekcja` · `~/zdawalni/ux-3` · 8813 | `lekcja-ux.js` | odtwarzacz: `playerOpen`, `lpOpen`, `lpBuild`, `lpBuildDeck`, `lpCards`, `lpSectionCards`, `LPR.*`, `lpAward`, `lpBuzz`, `lpFloat`, `lpTop`, `lpKeys`, `kick`, `lpConfChips`, `lpBiteDone`, `lpSrcDone`, `lpFinishLesson`, `done()` źródła „ld” (ok. 19731), `kSound`/`kSoundOn` i darmowe dźwięki w `kosmetyki.js`, moment pokazania awansu (`whenFree(levelUpShow…)` w `xpFlush`), CSS `.lp-*`, karta „Dziś do powtórki” (`.rv-hero`) | brak |
| **4 Wygląd** | `ux/4-wyglad` · `~/zdawalni/ux-4` · 8814 | `wyglad-ux.css` + `ikony-ux.js` | etap A: czcionki (link Google Fonts, `@font-face`, `--dz-head`), skala tekstu ≥ 12 px, cele dotyku i `.help-btn` na Terminach, Kalendarzu, Powtórkach (nagłówek), Słowniczku, materiale, `toast`, `#skrot-wm`, kafle Przedmiotów (`.nb-*`, `viewMaterials`), puste stany ogólne (`.empty`, `viewPo`), marka „Skrót BM” w przewodniku i `icons/emblem.png`, `PALETA.md`, emoji→SVG w Więcej, Ustawieniach, Przewodniku, Terminach, Kalendarzu, Słowniczku, Przedmiotach. Etap B (po scaleniu 1–3 i 5): tokeny, motywy na H2, szybkość | brak |
| **5 Nagrody** | `ux/5-nagrody` · `~/zdawalni/ux-5` · 8815 | `nagrody.js` | `viewSubject`/`courseSection` (ścieżka przedmiotu, w tym `.sk-node` CSS i „rozdz.”), `subjectPts`, `ptsMilestone`, `viewShop`/`shopHero`/`shopMisje`/`misjaCard` (wygląd, ceny, emoji, moneta, sekcja „Ochrona serii”, w której wstawiasz `ZD_NAWYK.kartaZamrozenia()`; stan „✓ Odebrane” czytasz z danych zadania, logikę odbioru robi pętla 2), `THEME_SHOP` i stałe poziomów motywów, `nauka_sklep_katalog`, `levelUpShow` (treść okna), `lvHowShow`, `lpLevelsShow`, `ODZNAKI`, `GRY_BADGES`, `gryBadgeRow`, `viewProfil`, `viewRanking`, `rankMeCard`, `rankList`, `kProfilShow`, `viewGames`, `gryRecords`, Hasło (`hdRes`, `hdShare`, seria Hasła), Boss (`bsClaim`, `bsLoad`, `viewBoss`), paczka i duet (`viewPaczka`, `paczka.js`: „Brawo”), `viewPolec` (tylko pusty stan błędu), karty do udostępnienia, checkbox i filtry w Rankingu | v58–v62 |

**Właściciele funkcji SQL** (nadpisać `create or replace` wolno tylko właścicielowi; inni piszą nowe funkcje albo wyzwalacze):

| Funkcja / obiekt | Właściciel | Jak korzystają inni |
|---|---|---|
| `nauka_proba_start`, tabela prób (v16), `stripe-webhook`, zapis dostępu po zakupie | pętla 1 | pętla 5: 100 🪙 na start przez **wyzwalacz `AFTER INSERT`** na tabeli prób i na tabeli dostępu (sprawdź nazwy w v16, v7, v45), unikalny klucz `start` |
| `nauka_zamrozenie_uzyj`, nowe funkcje zamrożeń, `nauka_dni`, `nauka_mon_z_rp` (auto-odbiór zadań), `nauka_misje_*`, `nauka_misja_odbierz`, przypomnienia (v36), `nauka_kalendarz_dane` | pętla 2 | pętla 5: nagroda za dział i za grupę przez **własne funkcje** (np. `nauka_dzial_nagroda`), nie przez `nauka_mon_z_rp` |
| `nauka_sklep_katalog` (w tym opis i cena zamrożenia), `nauka_kosm_cfg`, `nauka_sklep_stan`, gablota, `nauka_gry2_cfg` (boss), ranking (`nauka_ranking*`), paczka i duet (v37), „Brawo” | pętla 5 | pętla 2: zamrożenie w prezencie przez **własną funkcję** `nauka_zamrozenie_prezent()` (wpis do tabeli zamrożeń), bez zmiany konfiguracji sklepu |
| pętle 3 i 4 | bez SQL | gdy coś wymaga SQL, zapis w RAPORT |

**Umowy między pętlami (działają także, gdy druga pętla jeszcze niescalona):**
- Pętla 2 wystawia w `nawyk.js` obiekt `window.ZD_NAWYK` z funkcjami zwracającymi węzeł DOM albo `null`: `ekranSerii()` (ekran „Seria +1”, raz dziennie), `ofertaZamrozenia()` (karta „Chroń serię: zamrożenie za 40 🪙” po serii ≥ 3 przy saldzie ≥ 40), `jutro()` (wiersz „Jutro: …”), `ofertaPrzypomnienia()` (karta „Przypomnieć Ci jutro?”), `zadaniaLinia()` (postęp zadań dnia), `kartaZamrozenia()` (karta zamrożenia z przyciskiem kupna, dla Sklepu); oraz dane: `celDnia()` → `{xp, cel}`, `zadaniaStan()` → lista zadań z polem `odebrana`. Pętla 3 rysuje ekran końca w stałej kolejności i woła je przez `window.ZD_NAWYK?.fn?.()`. Pętla 5 wstawia `kartaZamrozenia()` w sekcji Sklepu „Ochrona serii”. Gdy ich nie ma, rysuje własny pasek celu z `LP_DAILY_GOAL` i pomija resztę. Obie pętle testują swoją stronę umowy (pętla 3 z atrapą `ZD_NAWYK` w teście).
- Pętla 1 wystawia `window.ZD_WEJSCIE.pasekProby()` (pigułka próby nad panelem Stasia) i `window.ZD_WEJSCIE.przyciskZakupu(kontekst)` (zielony „Kup dostęp” albo „Wypróbuj 3 dni”, zależnie od stanu konta). Pętla 2 przy przebudowie `viewHome` wstawia `pasekProby()` jako **pierwszy** element pod powitaniem i używa `przyciskZakupu()` wszędzie, gdzie na Dziś jest zakup. Pętla 1 do czasu scalenia dopisuje w `viewHome` jedną linię z komentarzem `// ux-1 tymczasowo` (przy scalaniu się ją usuwa).
- Pętla 5 wystawia `window.ZD_NAGRODY.odznaka(id)` (przyznanie i baner) i `window.ZD_NAGRODY.karta(opcje)` (karta do udostępnienia). Inne pętle mogą je wołać z zabezpieczeniem `?.`.
- Ikony: wspólne nazwy i rysunki są w A4d (kopiujesz dosłownie), własne z prefiksem `uxN-`. `coin`, `flame`, `miecze` i ikony gier zostają bez zmian.
- Wszystkie obiekty `ZD_*` mają działać, gdy druga pętla nie jest jeszcze scalona: wywołanie zawsze przez `?.`, a zachowanie zastępcze (stary przycisk, brak karty) musi być poprawne.
- Decyzje poza zasięgiem pętli (robi Bartek): płatny Resend i limity Supabase (panel), BLIK cykliczny w Stripe, polecenia (D1), adres pomocy w domenie. Pętle mogą przygotować tekst albo kod za flagą, ale nie zmieniają tych ustawień.

## Poza tą pętlą (B5)
### B5. Poza tą pętlą (nie robisz)
- Płatny plan Resend i limity Supabase w panelu (znalezisko z C1 pkt 1–2): robi Bartek. Ty robisz tylko komunikaty i „Wyślij ponownie”.
- BLIK cykliczny dla planu miesięcznego: decyzja i panel Stripe (Bartek), bez zmian w kodzie.
- Polecenia i kody (D1): czekają na decyzję Bartka.
- Strona przedmiotu (przewijanie w bok 440 px, „rozdz. undefined”): pętla 5. Sprzeczność terminów w darmowej wersji: pętla 2. Stara marka „Skrót BM”: pętla 4.

## Pełne znaleziska audytu dla etapu 4 (C4)
### C4 · Etap 4: paywall, odzyskiwanie, zaufanie

#### [P1] Okno z kłódką i paywall to ściana tekstu bez podglądu treści i z kotwicą na najdroższym planie  ·  *(raport 1)*
- Gdzie: `paywallCard()` `index.html` 7491–7504, zrzut `zrzuty-1/14-darmowe-material-zablokowany-cala.png` i `27-darmowe-klik-zablokowana.png`. Jest 7 zdań tekstu, przycisk „Kup dostęp · od 35 zł / mies.”, a 199 zł dopiero w drobnym tekście na dole. W `choosePlan` (`skrot-supabase.js` 1404–1424, zrzut `15-wybierz-plan.png`) 199 zł nie ma przeliczenia na miesiąc.
- Co jest źle: student po kliknięciu lekcji nie widzi nic z lekcji, tylko opis sklepu. Cena na przycisku kotwiczy na „35 zł miesięcznie”, czyli na plan, który na ten rok kosztuje ok. 315 zł. Najlepsza oferta (199 zł, BLIK) jest najmniej widoczna.
- Jak robią to najlepsi: Rosie Hoggmascall: „Lead with annual plan and ensure there is only one choice to make”, a jako domyślny plan „Annual” ([RevenueCat](https://www.revenuecat.com/blog/growth/how-top-apps-approach-paywalls/)). Z tego samego źródła: w sklepach aplikacji paywall bez ceny całkowitej bywa odrzucany, ale w sieci można pokazać przeliczenie, o ile cena całkowita też jest. RevenueCat SOSA 2025: plany roczne lepiej zatrzymują użytkowników (44,1% vs 17,0% po roku) ([RevenueCat SOSA 2025](https://www.revenuecat.com/state-of-subscription-apps-2025)).
- Jak poprawić:
  1. `paywallCard`: nad tekstem pokaż zamazany podgląd pierwszych 2 sekcji lekcji (`lesson.sections[0..1].h` jako lista tytułów, bez treści). W `materials` są już `quizCount`/`conceptCount`, więc dodaj wiersz PL „{n} pytań · {k} pojęć · ok. {min} min” / EN „{n} questions · {k} concepts · about {min} min”.
  2. Skróć opis do jednego zdania: PL „Cały materiał, fiszki i quiz z wyjaśnieniami do każdego przedmiotu, do 11 lipca 2027.” / EN „Full material, flashcards and quizzes with explanations for every subject, until 11 July 2027.”
  3. Przycisk główny (gdy nie ma `canTrial`): PL „199 zł do lipca · ok. {199/cmp.months} zł / mies.” / EN „199 zł until July · about {x} zł / month” (`skrot.planCompare()` już liczy `months`). „35 zł / mies.” daj jako drugi `.btn`.
  4. `choosePlan`, karta „rok”: pod ceną mniejszą czcionką PL „to ok. {x} zł miesięcznie” / EN „about {x} zł a month”. Karta „rok” jest zaznaczona i fokusowana jako pierwsza (już jest).
  5. Test: zrzut `/material/A2` na 390 px. Przycisk z „199 zł” mieści się w pierwszym ekranie, a tekst opisu ma ≤ 2 linie.
- Koszt: M
- Wpływ: konwersja, średni przychód na osobę.

#### [P2] Przycisk płatności jest nieaktywny bez wyjaśnienia  ·  *(raport 1)*
- Gdzie: `goPay` (`skrot-supabase.js` 1330–1395), zrzut `zrzuty-1/16-zanim-zaplacisz-rok.png` (jasnozielony przycisk „Przejdź do płatności (199 zł)” bez podpowiedzi).
- Co jest źle: obie zgody są potrzebne (regulamin § 5, art. 38 ust. 1 pkt 13), ale student nie wie, dlaczego przycisk nie działa.
- Jak poprawić: przycisk zostaw aktywny wizualnie. Po kliknięciu bez zgód pokaż `p.notice.err` (rola `alert`): PL „Zaznacz obie zgody powyżej, żeby przejść do płatności.” / EN „Tick both boxes above to continue to payment.” i ustaw fokus na pierwszym niezaznaczonym polu. Treści zgód **nie zmieniaj** (to dowód, wersja `CONSENT_V`).
- Koszt: S
- Wpływ: konwersja na ostatnim kroku.

#### [P1] Brak odzyskiwania (win-back) po próbie i przy anulowaniu subskrypcji  ·  *(raport 1)*
> **Uwaga organizatora:** kupon retencyjny w Stripe – NIE (B1).
- Gdzie: po próbie nic (P0-2). Anulowanie: `skrot.manage()` (`skrot-supabase.js` 1262–1266) prowadzi wprost do portalu Stripe. Przypomnienia mają rodzaj „powrót po ≥ 4 dniach” (`przypomnienia.js`), ale tylko dla osób z włączonymi przypomnieniami i bez odwołania do próby czy zakupu.
- Co jest źle: rynek to 100–300 osób, więc każda osoba po próbie jest cenna, a aplikacja ma unikatową dźwignię, której nie używa: **zna datę kolokwium**. Student, który nie kupił w listopadzie, może kupić tydzień przed kolokwium, ale nikt mu o tym nie powie. Przy anulowaniu planu miesięcznego nie ma pytania o powód ani propozycji przejścia na plan 199 zł, który na resztę roku bywa tańszy.
- Jak robią to najlepsi: Stripe pozwala w portalu klienta zebrać powód anulowania (lista: za drogie, brak funkcji…) i „deflect the cancellation by offering a retention coupon” ([Stripe: cancellation page](https://docs.stripe.com/customer-management/cancellation-page)). Duolingo traktuje „resurrected users” (powracających) jako osobny segment wzrostu w swoim modelu ([Lenny’s Newsletter: How Duolingo reignited user growth](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth)).
- Jak poprawić:
  1. **Stripe Dashboard → Settings → Customer portal → Cancellations**: włącz „Collect cancellation reason” (wszystkie powody). Kupon retencyjny tylko jeśli autor się zgodzi (np. 1 miesiąc −30%). To decyzja cenowa, nie techniczna.
  2. W aplikacji, zanim otworzysz portal (`skrot.manage` dla `plan === "miesiac"`), pokaż arkusz z `planCompare()`: PL „Zostało ok. {m} mies. do lipca. Co miesiąc to ok. {m*35} zł, a plan do końca 2. semestru kosztuje 199 zł.” Przyciski: „Przejdź na 199 zł” → `goPay("rok")` (w webhooku po zakupie `rok` anuluj subskrypcję; dodaj to w `stripe-webhook`) oraz „Anuluj subskrypcję” → portal. EN analogicznie.
  3. Odzyskiwanie przed kolokwium: jednorazowe „+2 dni przed kolokwium” dla osób po próbie bez zakupu. Kolumna `nauka_proby.bonus_at`, RPC `nauka_proba_bonus()`, aktywne tylko gdy do najbliższego terminu z `nauka_kalendarz_dane` jest ≤ 7 dni. Na Dziś karta PL „Kolokwium z {przedmiot} za {n} dni. Masz jeszcze jedne 2 dni pełnego dostępu, żeby się przygotować.” / EN „{subject} test in {n} days. You have one more 2-day pass to prepare.”. Mail tylko za zgodą (pole z P0-1).
  4. Test: `supabase/test/v52.sql`: bonus raz na konto, tylko po zakończonej próbie, tylko w oknie 7 dni.
- Koszt: M–L
- Wpływ: konwersja po próbie, retencja D30, przychód.

#### [P1] Brak dowodu społecznego i informacji, kto stoi za aplikacją  ·  *(raport 1)*
> **Uwaga organizatora:** adres pomocy zostaje obecny (B1).
- Gdzie: ekran logowania (`zrzuty/01-logowanie-gosc-cala.png`, `zrzuty-1/09-login-en-cala.png`). Są trzy punkty, karta próby i FAQ, ale nie ma ani jednej liczby, opinii ani twarzy. Kontakt to `zdawalni.support@gmail.com` (stopka logowania, `openAccount`).
- Co jest źle: aplikacja kosztuje 199 zł, a kupuje się ją od nieznanego „serwisu”. Na rynku jednego rocznika najmocniejszy dowód to „Twój rok już tego używa” i „robi to student z Twojego roku”. Adres na gmailu przy płatnej usłudze obniża wiarygodność.
- Jak robią to najlepsi: Duolingo przed próbą Super pokazuje spersonalizowaną statystykę („super learners are 4.2X more likely to finish…”) ([UX Collective](https://uxdesign.cc/how-duolingo-drives-subscription-conversion-89c7415e8fef)). Rosie Hoggmascall (w RevenueCat) radzi użytkownikom ostrożnym „a longer flow with more social proof and reassurance” ([RevenueCat](https://www.revenuecat.com/blog/growth/how-top-apps-approach-paywalls/)).
- Jak poprawić:
  1. RPC `nauka_rocznik_licznik(p_rocznik)` dla `anon`: liczba kont z nauką w ostatnich 7 dniach w roczniku. Pokazuj **tylko gdy ≥ 15** (przy mniejszej liczbie efekt jest odwrotny). Pod nagłówkiem logowania: PL „{n} osób z {kierunek} uczyło się tu w tym tygodniu” / EN „{n} people from {programme} studied here this week”. Bez fałszywych liczb: przy braku danych nic nie pokazuj.
  2. Nowy `<details>` w FAQ: PL „Kto to robi?” → „Zdawalni robi student 1. roku BM na US. Lekcje układamy z sylabusa Twojego kierunku. Błąd w materiale? Przycisk „Zgłoś błąd” przy każdej fiszce.” / EN „Who makes this?” → „Zdawalni is made by a 1st-year BM student at the University of Szczecin…”. Imię i nazwisko podaj tylko, jeśli autor tego chce (jest w § 1 regulaminu).
  3. Adres pomocy w domenie (`pomoc@zdawalni.pl`), bo domena i tak wysyła maile przez Resend. Zmień w stopce, `openAccount`, `TRIAL_ERR` i regulaminie.
  4. Test: licznik 9 → brak linii, licznik 40 → linia widoczna.
- Koszt: M
- Wpływ: zaufanie, konwersja.

#### [P2] Okno konta każe pisać maila, żeby usunąć konto, choć w Ustawieniach jest przycisk „Usuń konto”  ·  *(raport 1)*
- Gdzie: `openAccount` `index.html` 13413 („Usunięcie konta i danych: napisz z tego adresu…”) vs Ustawienia → Konto („Usuń konto · na zawsze…”, `zrzuty-1/20-ustawienia-konto-proba.txt`).
- Jak poprawić: zamień na link PL „Usuń konto i dane” / EN „Delete account and data”, który prowadzi do `go({ view: "ustawienia", id: "konto" })`.
- Koszt: S
- Wpływ: zaufanie (RODO, spójność).
