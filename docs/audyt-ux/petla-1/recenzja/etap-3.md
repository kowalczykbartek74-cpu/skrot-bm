# Materiał dla recenzenta – pętla UX-1, etap 3

Wyciąg z polecenia pętli (bez zmian). Oceniasz tylko to, co widać na zrzutach, w raporcie, w kontroli automatycznej i w logu testów (także SQL i funkcja Edge).

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

## Kryteria etapu 3
**Etap 3 – Koniec próby jako wydarzenie** (C3)
- K1: powitanie próby ma przełącznik „Przypomnij mi mailem dzień przed końcem próby”, domyślnie odznaczony, cel ≥ 44 px, EN.
- K2: `skrot-v53-….sql`: kolumny `przypomnij`, `przypomniano_at`, RPC `nauka_proba_przypomnij`, `nauka_proba_kandydaci` (tylko service_role); PGlite: kandydat przy `do_kiedy = now()+24h` i zgodzie, nie po wysłaniu, nie po zakupie, nigdy bez zgody.
- K3: funkcja `przypomnienia` wysyła rodzaj „próba” przed innymi i wlicza go do `limit_dzien` (test jak istniejące testy przypomnień).
- K4: adres `?plan=1` po zalogowaniu otwiera wybór planu.
- K5: konto `proba-koniec` z `skrot-proba-do` w przeszłości: jednorazowy ekran „Twoje 3 dni minęły” (postęp z 3 dni, najbliższe kolokwium „za n dni”, dwa plany z 199 zł na górze, „Twoje postępy zostały na koncie”); przy zerowym postępie tekst „Nie zdążyłeś?…”; drugie wejście: bez ekranu, pasek zakupu ≤ 56 px nad panelem.

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

## Pełne znaleziska audytu dla etapu 3 (C3)
### C3 · Etap 3: koniec próby

#### [P0] Brak jakiegokolwiek przypomnienia przed końcem próby i po nim  ·  *(raport 1)*
- Gdzie: logika próby `skrot-supabase.js` 1442–1467 (`startTrial`), `supabase/skrot-v16-proba.sql` (tabela `nauka_proby`, bez pól o przypomnieniu), funkcja Edge `supabase/functions/przypomnienia/` i `przypomnienia.js` (rodzaje: termin 7/3/1 dzień, powrót, powtórki, Zadanie dnia, **bez próby**). Przypomnienia są domyślnie wyłączone (`skrot-v36-przypomnienia.sql`, decyzja D6, `wlaczone default false`). Zrzuty: `zrzuty-1/11-po-starcie-proby-powitanie.png` (powitanie próby bez pytania o przypomnienie), `zrzuty-1/18-proba-ostatnie-godziny-cala.png`.
- Co jest źle: próba nie wymaga karty i nic się nie pobiera samo. To uczciwe, ale ma skutek uboczny: **jedynym mechanizmem konwersji jest to, że student sam wróci w dniu 3**. Nie dostanie maila ani pusha, a aplikacja nie pokaże okna. Jeśli w dniu 3 nie otworzy strony, próba gaśnie po cichu, a on dowie się o tym przy następnej wizycie, może po tygodniu, z zablokowanymi materiałami. Powitanie próby obiecuje „nic się samo nie przedłuża”, ale nie mówi „przypomnimy Ci”.
- Jak robią to najlepsi: Blinkist przebudował paywall wokół trzech rzeczy: jasnej osi czasu, listy funkcji i **obietnicy przypomnienia przed końcem próby**. RevenueCat (za Growth Dives) podaje, że to podniosło konwersję o 23% i zmniejszyło liczbę skarg o 55% ([RevenueCat: How top apps approach paywalls](https://www.revenuecat.com/blog/growth/how-top-apps-approach-paywalls/), [Sub Club: Jaycee Day, Blinkist](https://metacast.app/podcast/sub-club-by-revenuecat/DlWjuiPD/how-ethical-design-at-blinkist-led-to-23-growth---jaycee-day/IiL4Mf8f)). Duolingo przed startem próby Super pokazuje zapewnienie „przypomnimy Ci przed końcem próby” i faktycznie wysyła push ([UX Collective: How Duolingo drives subscription conversion](https://uxdesign.cc/how-duolingo-drives-subscription-conversion-89c7415e8fef)). RevenueCat opisuje wzorzec Blinkista: oś czasu z dniem końca próby i powiadomienie mailem lub pushem kilka dni przed konwersją ([RevenueCat: Blinkist-style paywall](https://www.revenuecat.com/blog/engineering/how-to-build-a-blinkist-style-paywall-using-revenuecat-webhooks-and-zapier)).
- Jak poprawić:
  1. **Zgoda w powitaniu próby** (`index.html` `showWelcome`, ok. 18749–18766). Nad krokami dodaj przełącznik (`.switch`, cel ≥ 44 px), **domyślnie wyłączony**: PL „Przypomnij mi mailem dzień przed końcem próby”, EN „Email me a day before my trial ends”. Pod nim drobny tekst: PL „Jeden mail. Nic nie pobieramy samo.”, EN „One email. Nothing is charged automatically.”. Po włączeniu wywołaj nowe RPC `nauka_proba_przypomnij(true)`.
  2. **SQL v52** (nowy plik `supabase/skrot-v52-proba-przypomnienie.sql`, ze strażnikiem kodowania jak w v44+): `alter table nauka_proby add column przypomnij boolean not null default false, add column przypomniano_at timestamptz;`. Dodaj funkcję `nauka_proba_przypomnij(p boolean)` (security definer, ustawia dla `auth.uid()`) i funkcję `nauka_proba_kandydaci()` (tylko service_role). Zwraca ona `user_id, email, do_kiedy, jezyk` dla `przypomnij and przypomniano_at is null and do_kiedy between now() + interval '18 hours' and now() + interval '30 hours'` oraz bez aktywnego wiersza w `nauka_dostep`.
  3. **Funkcja Edge `przypomnienia`** (`obsluga.ts`): przed zwykłymi przypomnieniami weź `nauka_proba_kandydaci`, wyślij mail i ustaw `przypomniano_at = now()`. Te maile wliczają się do `limit_dzien`. Treść PL: temat „Jutro o {godz} kończy się Twoja próba w Zdawalni”, treść „Masz jeszcze {ile} pełnego dostępu. Do końca 2. semestru: 199 zł jednorazowo (BLIK), bez odnawiania. [Wybieram plan] · Postępy zostaną na koncie, nawet jeśli nie kupisz.” EN: „Your Zdawalni trial ends tomorrow at {time}”, „You still have {left} of full access. Until the end of semester 2: 199 zł one-off (BLIK), no renewal. [Choose a plan] · Your progress stays on your account even if you don’t buy.”. Link: `https://zdawalni.pl/?plan=1`. W `afterReady` dodaj obsługę: `q.has("plan")` → `skrot.buy()`.
  4. Test: `supabase/test/v52.sql`. Osoba z `do_kiedy = now() + 24h` i `przypomnij = true` jest kandydatem. Po ustawieniu `przypomniano_at` lub po zakupie już nie jest. Osoba z `przypomnij = false` nigdy nim nie jest.
- Koszt: M
- Wpływ: konwersja z próby (najsilniej), zaufanie (mniej „zapomniałem i straciłem”).

#### [P0] Po próbie nie ma ekranu „Twoje 3 dni minęły”: student trafia do zwykłej darmowej wersji bez słowa  ·  *(raport 1)*
- Gdzie: `zrzuty/04-proba-koniec-ekran1.png` i `-cala.png` (wygląda identycznie jak `02-darmowe-konto`) oraz `zrzuty-1/19-proba-koniec-wejscie-przed-esc.png`. W kodzie nie ma stanu „próba minęła”. `grep` po „próbny minął / skończył” w `index.html` i `skrot-supabase.js` nic nie zwraca. `buyBanner()` (`index.html` 7528–7552) po próbie pokazuje tylko „Pełny dostęp · 199 zł… · Kup dostęp”, na dole Dziś.
- Co jest źle: najważniejszy moment decyzji przechodzi bez komentarza. Pierwszy ekran wygląda jak wcześniej, a kłódki widać dopiero po kliknięciu. Student nie dostaje informacji, ile zdążył zrobić w 3 dni, co traci i ile zostało do kolokwium. Aplikacja zna terminy, ale w tym miejscu ich nie używa.
- Jak robią to najlepsi: model Blinkista (oś czasu, dokładny dzień końca, komunikacja w kluczowym momencie; źródła wyżej). Duolingo po zakupie Super pokazuje ekran przemiany i przypomina 5 korzyści ([UX Collective](https://uxdesign.cc/how-duolingo-drives-subscription-conversion-89c7415e8fef)). Ten sam moment przy wygaśnięciu jest naturalnym miejscem na pokazanie straty.
- Jak poprawić:
  1. W `skrot-supabase.js` przy `refreshMe` (ok. 250–253): gdy `skrot.trialUntil` jest ustawione, zapisz `ls.set("skrot-proba-do", skrot.trialUntil)`. Gdy `skrot.trialUntil` jest puste, `!skrot.paid`, `!skrot.trialCan`, a `ls.get("skrot-proba-do")` jest w przeszłości, ustaw `skrot.trialEnded = true`.
  2. W `index.html` obok `showWelcome` dodaj `showTrialEnded()`. W `tryStart` (ok. 18768–18774): `if (window.skrot?.trialEnded && !ls.get("bm-proba-koniec-pokazane")) return showTrialEnded();` i potem ustaw ten klucz. Zawartość modalu (pełny arkusz):
     - eyebrow PL „Okres próbny minął” / EN „Your trial has ended”
     - h2 PL „Przez 3 dni zrobiłeś: {lekcje} lekcji, {fiszki} fiszek, {xp} XP” / EN „In 3 days you did: {lessons} lessons, {cards} flashcards, {xp} XP”. Dane weź z `S.progress` (te same liczniki co profil). Przy zerze pokaż PL „Nie zdążyłeś? Zostało {dni} dni do: {najbliższe zaliczenie}.” / EN „Didn’t get to it? {days} days left until: {next test}.”
     - wiersz z najbliższym terminem (ta sama funkcja co kafelki „Terminy” w `Twój postęp`): PL „Kolokwium z {przedmiot} za {n} dni” / EN „{subject} test in {n} days”
     - dwie karty planu jak w `choosePlan` (199 zł na górze, zaznaczony; P1-12)
     - link PL „Zostaję przy darmowych próbkach” / EN „I’ll stay with the free samples”, który zamyka arkusz
     - tekst pod spodem: PL „Twoje postępy, fiszki i wpisy zostały na koncie.” / EN „Your progress, flashcards and notes are still on your account.”
  3. Po zamknięciu: na górze Dziś (nad `.zh` hero) zostaw wąski pasek `buybar` z tekstem PL „Próba minęła · 199 zł do 11 lipca 2027 albo 35 zł / mies.” i przyciskiem „Kup dostęp”, aż do zakupu. Wysokość ≤ 56 px, żeby hero nadal mieścił się na 390×844.
  4. Atrapa: w `docs/gry/test/atrapa-supabase.js` dla `proba-koniec` zwracaj `proba_mozna: false`. Test Playwright: `localStorage["skrot-proba-do"] = "2026-11-05T17:00:00+01:00"`, konto `proba-koniec` → widać `h2` z „Przez 3 dni”. Drugie wejście → brak arkusza i jest pasek.
- Koszt: M
- Wpływ: konwersja z próby, retencja D7 (powrót po próbie).

#### [P0] P0-1. Trzy dni próby bez żadnej nagrody, którą da się poczuć  ·  *(raport 5)*
> **Uwaga organizatora:** z tego znaleziska robisz tylko punkt 5 (podsumowanie próby na paywallu / ekranie końca próby). Cel dnia robi pętla 2, ekran końca karty pętla 3, odznaki i monety na start pętla 5.
- **Gdzie:** Dziś (`zrzuty/10-dzis-ekran1.png`), koniec karty 5 min (`zrzuty/42-koniec-8.png`, `zrzuty-5/h-koniec-dobrze.png`), profil (`zrzuty/21-profil-cala.png`), sklep (`zrzuty-5/a-sklep-v24-nowy-cala.png`). Kod: `LP_DAILY_GOAL = 50` (index.html:9648), ekran końca karty `done(st)` (19731–19738), odznaki `GRY_BADGES` (11615), cena najtańszych rzeczy w `nauka_sklep_katalog()` (v24).
- **Co jest źle:** Dziś obiecuje „Dziś wystarczy 5 minut”, ale 5 minut daje 18–43 XP, a cel dnia to 50 XP. Pierścień celu po pierwszej sesji nie jest więc pełny. Ekran końca w ogóle nie pokazuje celu dnia, tylko „Dziś: +43 XP”. Pierwszy poziom wpada dopiero 2.–3. dnia. Na profilu jest 6 szarych odznak, wszystkie za gry. Monet jest 2, a najtańsza rzecz kosztuje 40. Przez 3 dni próby student widzi zera i szarość, nie zdobywa nic, co straci, jeśli nie kupi.
- **Jak robią to najlepsi:** Duolingo przy pierwszych dniach serii pokazuje animowane kamienie milowe. Według ich bloga nowe animacje po przedłużeniu serii zwiększyły szansę, że nowa osoba wciąż używa aplikacji po 7 dniach, o 1,7%. Te same badania mówią, że osoby z serią 7 dni 3,6 raza częściej kończą kurs ([blog Duolingo: streak](https://blog.duolingo.com/how-duolingo-streak-builds-habit)). Odznaki Duolingo mają „milestone awards” na kilku poziomach trudności, a najłatwiejsze są do zdobycia od razu ([achievement badges](https://blog.duolingo.com/achievement-badges)). W Octalysis to napęd „Development & Accomplishment” (postęp widoczny od początku) i „Loss & Avoidance” (coś, co się traci) ([Yu-kai Chou](https://yukaichou.com/gamification-framework/)). Używać ostrożnie: tylko „nie trać”, bez straszenia.
- **Jak poprawić:**
  1. W index.html:9648 zmienić `LP_DAILY_GOAL = 50` na `30`. W `done(st)` karty dnia (19731) dla `karta` przed zwróceniem dopisać `lpBonus(10)` (premia „Karta dnia skończona”), żeby nawet 0/3 dało ≥ 28 XP, a 1/3 ≥ 30. Zaktualizować tekst w `lvHowShow` (9780): „Cel dnia to 30 XP – tyle daje jedna karta »Dziś 5 min«.” / EN „Your daily goal is 30 XP – one ‘Today 5 min’ card gets you there.”
  2. Na ekranie końca karty (`done(st)` → `stats`) dodać czwarty kafel: pierścień celu dnia (użyć `skGoal()`, 12795) z napisem „Cel dnia ✓” / „Daily goal ✓” albo „Do celu: 8 XP” / „8 XP to goal”. Gdy seria rośnie, dopisać kafel „🔥 N dni z rzędu” / „🔥 N-day streak” z animacją `lpBump` (wyłączaną przez `prefers-reduced-motion` i `html.calm`, jak reszta).
  3. Dodać 5 odznak startowych do `ODZNAKI()` (16417), przyznawanych w przeglądarce jak `gryBadge` (11617) przez `progSoon({ odznaki })`:
     - `start1` 🌱 „Pierwszy krok” / „First step”: pierwsza skończona karta albo lekcja, wołać w `done(st)`;
     - `seria3` 🔥 „Trzy dni” / „Three days”: `streak.n >= 3` w `xpFlush` (10424);
     - `pow1` 🔁 „Pierwsza powtórka” / „First review”: pierwsza ocena w Powtórkach;
     - `boss1` ⚔️ „Pierwszy cios” / „First strike”: w `bsLoad`, gdy `BS.hit`;
     - `cel3` 🎯 „Cel 3 razy” / „Goal ×3”: trzy dni z `xp.n >= LP_DAILY_GOAL`.
     Przy zdobyciu: `lpBanner("🌱 Odznaka: Pierwszy krok")`.
  4. Monety na start (baza, nowy plik `supabase/skrot-v52-start.sql`): w `nauka_proba_start` (v16) po udanym starcie `insert into nauka_monety (user_id, delta, zrodlo, klucz, opis) values (auth.uid(), 100, 'admin', 'start', 'Na start') on conflict do nothing;`. Uwaga: `zrodlo` ma check z listą ('nauka','misja','zakup','admin'), więc użyć 'admin' albo rozszerzyć check o 'start'. Ten sam wpis dla kupujących bez próby: w funkcji Stripe po zapisie dostępu. W sklepie przy saldzie ≥ 40 i braku zakupów pokazać kartę „Kup coś za monety z prezentu: zamrożenie serii 40 🪙 albo kolor pseudonimu 60 🪙” / „Spend your welcome coins: streak freeze 40 🪙 or nickname colour 60 🪙”.
  5. Ekran końca próby (`04-proba-koniec`, paywall): nad przyciskiem „Kup dostęp” karta „W 3 dni: X lekcji · Y XP · poziom N · seria Z dni · M 🪙. Po zakupie wszystko zostaje.” / EN „In 3 days: X lessons · Y XP · level N · Z-day streak · M 🪙. It all stays when you buy.” Dane z `S.progress.xp`, `streak`, `sklep.saldo`, `S.progress.done`.
  - **Test:** Playwright (wzór `docs/gry/test/poziomy.mjs`): konto „proba”, czysty postęp, karta 5 min z 0/3 → pierścień celu ≥ 28/30 i odznaka „Pierwszy krok” w `#layer`. Saldo w sklepie 100 🪙 i przycisk „Kup” przy zamrożeniu aktywny.
- **Koszt:** M
- **Wpływ:** konwersja z próby (najsilniej), retencja D1/D3.

#### [P0] Poza stroną nic nie przywołuje studenta, zwłaszcza w 3-dniowym okresie próbnym  ·  *(raport 2)*
> **Uwaga organizatora:** z tego znaleziska robisz tylko punkt 4 (mail w okresie próbnym) i łączysz go z mailem z R1 P0-1 w jeden rodzaj „próba”. Reszta to pętla 2.
- **Gdzie:**
  - Dziś (zrzut 10, 03-proba-trwa): `przypHomeCard()` w index.html ok. l. 14599–14617. Warunek `if (!ex) return null;`: karta jest tylko wtedy, gdy jakieś zaliczenie wypada w ciągu 14 dni.
  - Domyślnie wyłączone (komentarz l. 14543 „Domyślnie wyłączone (D6)”).
  - Logika wyboru maila: `przypomnienia.js` `wybierz()`.
  - PWA: `manifest.webmanifest` jest, ale w repo nie ma service workera (`grep serviceWorker` nic nie zwraca), nie ma `PushManager` ani `beforeinstallprompt`. Jest tylko `<link rel="manifest">` w l. 1.
- **Co jest źle:**
  - W listopadzie najbliższe zaliczenie jest za 77 dni (zrzut 14, „W ciągu 30 dni: 0 zaliczeń”). Karta „Przypomnieć Ci mailem?” nie pojawi się więc nikomu aż do ok. 8 stycznia.
  - Przypomnienia da się włączyć tylko w Więcej → Ustawienia → Przypomnienia, czyli 3 kliknięcia od Dziś. Nikt tam nie zajrzy w pierwszych dniach.
  - Okres próbny trwa 3 dni, a o powrocie w 2. i 3. dniu decyduje wyłącznie pamięć studenta. Nie ma maila „jutro kończy się próba”, nie ma przypomnienia o nauce, nie ma powiadomienia w telefonie.
  - Kalendarz w telefonie ma alarmy tylko dla zaliczeń i zadań starosty. Dni planu („📘 Plan: …”) to ciche wydarzenia całodniowe bez `VALARM` (`supabase/functions/kalendarz/index.ts`, `personalEvents`, pętla `planDays`).
- **Jak robią to najlepsi:**
  - W Duolingo pierwszym dużym sukcesem w rozwoju serii było powiadomienie ratujące serię („streak-saver notification”). Zespół traktował kanał powiadomień jako coś do chronienia: mógł optymalizować porę, szablony i treść, ale nie liczbę powiadomień bez mocnego uzasadnienia ([Lenny’s Newsletter, Jorge Mazal](https://lennysnewsletter.com/p/how-duolingo-reignited-user-growth)).
  - Algorytm wyboru treści przypomnień w Duolingo (recovering-difference softmax bandit) karze szablony pokazane niedawno („novelty decay”). W teście A/B dał +0,5% DAU i ok. +2% retencji nowych użytkowników (D1 +2,2%, D7 +2,0%) ([Yancey i Settles, KDD 2020](https://research.duolingo.com/papers/yancey.kdd20.pdf)).
  - Na iPhonie web push działa od iOS 16.4, ale tylko dla aplikacji dodanej do ekranu głównego (manifest z `display: standalone`) i tylko po geście użytkownika ([WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)).
  - Headspace ustawia przypomnienie o wybranej porze wprost w aplikacji ([Headspace Help](https://help.headspace.com/hc/en-us/articles/115008276788-How-can-I-set-up-Reminders)).
- **Jak poprawić:**
  1. **Propozycja w momencie sukcesu.** W `lpSrcDone` (l. 11436) albo w `done()` źródła „ld” (l. ok. 19733) dodaj pod statystykami kartę „Przypomnieć Ci jutro?”. Warunki: `sk.state === "in" && PAID() && PRZ.d && !PRZ.d.wlaczone && !ls.get("skrot-przyp-nie")` i to pierwsza skończona karta tego dnia. Zawartość:
     - Tytuł PL: „Przypomnieć Ci jutro o 18:00?” / EN: „Remind you tomorrow at 6 pm?”
     - Tekst PL: „Jeden mail, tylko gdy jeszcze nie było nauki. Godzinę zmienisz w Ustawieniach.” / EN: „One email, only if you haven't studied yet. Change the time in Settings.”
     - Przyciski: „Tak, przypominaj” / „Yes, remind me” wywołuje `przypSave({ wlaczone: true, godz: PZ.GODZ_DOMYSLNA })`. „Nie teraz” / „Not now” wywołuje `ls.set("skrot-przyp-nie", todayKey())`.
     - Wygląd: `.btn.primary` min-height 48 px, karta `.panel.sk-panel`.
  2. **Wieczorna godzina z planu zajęć.** Z planu grupy wylicz godzinę końca ostatnich zajęć dnia i zaproponuj tę porę + 60 min, zaokrągloną w górę do 30 min, nie później niż 21:00, zamiast stałej 18:00. Zasada Tiny Habits: nawyk zaczepiony o stały moment, „po zajęciach”.
  3. **`przypHomeCard()`.** Usuń warunek `if (!ex) return null;`. Gdy nie ma terminu ≤14 dni, pokazuj wersję bez terminu, ale tylko po co najmniej 1 dniu nauki (`streakN() >= 1`), raz na 30 dni (obecny mechanizm „Nie teraz”).
  4. **Mail w okresie próbnym.** W `przypomnienia.js` dodaj rodzaj `proba`. Wybierany, gdy `ctx.trialDaysLeft === 1` (pole trzeba dodać do `stanZ`). Jest przed rodzajem „powrót”, ale po terminach.
     - Tytuł PL: „Jutro kończy się Twój dostęp próbny” / EN: „Your trial ends tomorrow”
     - Treść PL: „Zrobiłeś(-aś) już {N} {dzień/dni} nauki. Dziś 5 minut, a jutro zdecydujesz, czy zostajesz.” / EN: „You've studied on {N} day(s). 5 minutes today, and decide tomorrow whether to stay.”
     - CTA PL: „5 minut teraz” / EN: „5 minutes now”, ścieżka `#/`.
     - Uwaga: do wysłania wymaga włączonych przypomnień. Inaczej to mail marketingowy, który wymaga osobnej zgody (zgody są w SQL v10, sprawdź).
  5. **Kalendarz (.ics) jako „push bez push”.** W `kalendarz/index.ts` dodaj opcjonalne wydarzenie na każdy dzień zajęć grupy: `SUMMARY:📘 Zdawalni · 5 min po zajęciach`, `DTSTART` = koniec ostatnich zajęć + 30 min, czas trwania 10 min, `VALARM TRIGGER:PT0M`, `DESCRIPTION` z linkiem `https://zdawalni.pl/#/`. Włączane przełącznikiem w oknie `openPhoneCal()` (l. 7914): „Przypominaj o 5 minutach po zajęciach” / „Remind me about 5 minutes after class”. Zapis w progress jako `calStudy: true`, a funkcja czyta to w `nauka_kalendarz_dane`.
  6. **Krok 2 (L): service worker i web push.** Plik `sw.js` w katalogu głównym, z obsługą `push` i `notificationclick`, który otwiera `/#/`. Rejestracja `navigator.serviceWorker.register("/sw.js")` po zalogowaniu. Przycisk „Powiadomienia w telefonie” w Ustawieniach → Przypomnienia. Na iOS pokaż go dopiero, gdy `matchMedia("(display-mode: standalone)").matches`, a wcześniej instrukcję „Udostępnij → Do ekranu początkowego”. Serwer: ta sama funkcja `przypomnienia`, nowy kanał (VAPID).
  7. **Test:** konto „proba” z atrapą, skończ kartę 5 min i sprawdź, że karta „Przypomnieć Ci jutro?” jest na ekranie końca. Po „Tak” `PRZ.d.wlaczone === true`. Po przeładowaniu karty nie ma.
- **Koszt:** M (kroki 1–5), L (krok 6)
- **Wpływ:** retencja D1/D7, konwersja z próby (powrót w 2. i 3. dniu próby)

