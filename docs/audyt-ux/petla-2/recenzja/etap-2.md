# Materiał dla recenzenta · UX-2 etap 2

## Kryteria etapu
**Etap 2 – Zasady serii przyjazne studentom** (C2)
- K1: `streak: { d: T-3, n: 10 }` + 2 zamrożenia → seria trwa (szary płomień „10 dni”), po nauce 11; z 1 zamrożeniem → 1.
- K2: `skrot-v55-….sql`: nowa funkcja zużycia zamrożeń na listę dni (tylko ostatnie 3 dni, bez nauki w tych dniach; stara `nauka_zamrozenie_uzyj` zostaje) + `nauka_zamrozenie_prezent()` (jedno zamrożenie w prezencie raz na konto, wpis do tabeli zamrożeń, bez zmiany `nauka_kosm_cfg` i katalogu sklepu, które należą do pętli 5) (PGlite, 2× uruchomienie).
- K3: zegar 28.12.2026, ostatnia nauka 23.12 → seria widoczna z dopiskiem „przerwa, seria czeka”; to samo liczy baza.
- K4: na Dziś „Ten tydzień: k/5 dni” (7 kropek) w rzędzie z rangą, bez nowego bloku.
- K5: `ZD_NAWYK.kartaZamrozenia()` (karta z opisem z C2: „Chroni do 2 opuszczonych dni z rzędu…”, stan „Masz N/2”, przycisk kupna przez istniejące `kBuy`; wstawia ją pętla 5 w sekcji Sklepu „Ochrona serii”) i `ZD_NAWYK.ofertaZamrozenia()` (po serii ≥ 3, saldo ≥ 40, brak zamrożenia; wstawia ją pętla 3 na ekranie końca); test obu funkcji na atrapie. Opis i cenę zamrożenia w katalogu zmienia pętla 5: jeśli potrzebujesz innego tekstu, zapisz go w `uwagi-dla-innych.md`.
- K6: `skrot-v56-….sql`: tabela `nauka_dni` jako jedno źródło dnia nauki; dzień z samym czytaniem (XP, 0 pkt) nie zużywa zamrożenia następnego dnia (PGlite + atrapa).

### Tabela ocen recenzenta (razem 10, ta sama dla każdego etapu tej pętli)
| Kryterium | Punkty |
|---|---|
| Jasność „co dziś” i „czy coś jest do uratowania” (w 1 sekundę, na telefonie) | 3 |
| Uczciwość zasad serii wobec studenta (weekend, przerwy, utrata serii nie po cichu) | 2 |
| Siła powodów do powrotu (przypomnienia, powroty, zadania, duet, tempo do kolokwium) bez nękania | 2 |
| Poprawność logiki: daty i strefa Europe/Warsaw, SQL, testy, zgodność strony z bazą | 2 |
| Spójność z H2, telefon 360 px, EN, reduced-motion/calm | 1 |

Do tego twarde błędy z A5 i lista kryteriów etapu (każde kryterium musi być spełnione, żeby zaliczyć).

## Twarde błędy
**Twarde błędy (każdy obniża ocenę do maks. 5). Liczą się tylko dla elementów nowych albo zmienionych w tej pętli** (sprawdza je recenzent na podstawie zrzutów, testów i części automatycznej raportu). Błąd, który istniał już na `main` w nie Twoim obszarze, nie blokuje etapu: zapisz go w `uwagi-dla-innych.md`. **Lista:** tekst poniżej AA; poziome przewijanie przy 360/375 px; błędy konsoli; nowy tekst bez EN; kolor spoza palety; emoji jako ikona w nowym kodzie; ruch niewyłączany przez reduced-motion lub `html.calm`; czerwony test (nowy lub istniejący); zmieniona kolejność albo treść pytań quizu; zapis do produkcji; zmiana w miejscu kodu należącym do innej pętli (lista w B3); cel dotyku < 44 px w nowym elemencie; `undefined`/`null` widoczne na ekranie.

## Decyzje przyjęte (B1)
Bartek może je zmienić przed startem (edytując ten plik). Jeśli nic nie zmienił, przyjmij je jak niżej i zapisz w `PROGRESS.md`.

- **D2 Seria:** zamrożenia chronią kolejne opuszczone dni (maks. 2 z rzędu = weekend), 1 zamrożenie w prezencie (raz na konto, gdy seria osiąga 2), dni przerw z `CAL.PERIODS` (opis zawiera „Przerwa”) i święta z `OFF` nie zrywają serii i nie dodają dni.
- **D5 Cel dnia:** `LP_DAILY_GOAL = 30` (premię +10 XP za kartę dnia dodaje pętla 3 w `done()`). Wybór 30/50/80 w Ustawieniach: tylko jeśli zmieści się w etapie 1 bez ruszania cudzych miejsc; inaczej zapisz w RAPORT.
- **Naprawa serii:** wysiłkiem (2 dni po 5 min), nigdy za monety ani pieniądze; raz na 30 dni; dla serii ≥ 3, gdy przerwa to 2–4 dni.
- **Przypomnienia:** nadal maks. 1 mail dziennie i cisza po nauce (nie zwiększasz liczby maili). Domyślna godzina z planu zajęć: koniec ostatnich zajęć + 60 min, zaokrąglone w górę do 30 min, nie później niż 21:00; bez planu 18:00.
- **Web push:** tylko jeśli etapy 1–5 są zaliczone; inaczej sam `sw.js` (offline + instalacja) i zapis w RAPORT.
- **Ranking „Ten tydzień”:** NIE tutaj (pętla 5).

## Podział pracy między pętlami (B3) i umowy
Zmieniasz tylko miejsca swojej pętli. Gdy coś z cudzego obszaru jest konieczne, dopisz małe wywołanie z zabezpieczeniem (`window.ZD_X?.fn?.()`) albo zapisz to w `uwagi-dla-innych.md`.

| Pętla | Gałąź / katalog / port | Własny plik | Miejsca w kodzie (właściciel) | SQL |
|---|---|---|---|---|
| **1 Wejście i zakup** | `ux/1-wejscie` · `~/zdawalni/ux-1` · 8811 | `ux-wejscie.js` | `#login`, `.lg-*`, `#loginBox`, ekran wyboru kierunku, logowanie i okres próbny w `skrot-supabase.js` (`emailStep`, krok kodu, `startTrial`, `TRIAL_ERR`, `choosePlan`, `goPay`, `manage`, `refreshMe`, `afterReady`), `showWelcome`, `tryStart`, `buyBanner`, `paywallCard`, `trialBtn`, `openAccount`, tekst konta w Ustawieniach, reguła CSS szarego `.btn` na Dziś (index.html ok. 5113–5117), `skrotPokaz`, rodzaj maila „próba” w funkcji `przypomnienia`, `supabase/functions/stripe-webhook`, CSS i HTML logowania w linii 1 (tylko blok `#login`; nowy CSS logowania w `ux-wejscie.css`). Wyjątek: w 3 miejscach z „Kup dostęp” na Dziś (`index.html` ok. 20032 w `ldBlock`, 11322 i 11374 w `ptsHome`/`ptsDzis`) podmieniasz **tylko wyrażenie tworzące przycisk** na `window.ZD_WEJSCIE?.przyciskZakupu?.('…') ?? <stary przycisk>` z komentarzem `// ux-1` | v52–v54 |
| **2 (TY) Nawyk i powroty** | `ux/2-nawyk` · `~/zdawalni/ux-2` · 8812 | `nawyk.js` | `viewHome` (kolejność bloków Dziś i nowe karty), `lpLevelBar` (pigułka serii), `streakNext`, `kStreakAlive`, `kFreezeUse`, `xpFlush` (tylko część serii), `LP_DAILY_GOAL`, `przypHomeCard`, `przypomnienia.js` i funkcja `przypomnienia` (poza rodzajem „próba”), `supabase/functions/kalendarz`, `lekcja-dnia.js` (`trybDnia`), `ptsDzis`/`ptsHome` (tempo, terminy bez daty; bez wyrażeń przycisku zakupu z pętli 1), `ldBlock` (układ; bez wyrażenia przycisku zakupu), pusty stan Powtórek, linia zadań dnia na Dziś + auto-odbiór w bazie, `misjaClaim`, `manifest.webmanifest`, nowy `sw.js`, jednorazowe `.ics` (`index.html` ok. 7037) | v55–v57 |
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

## Pełne znaleziska audytu dla etapu
### C2 · Etap 2: zasady serii

#### [P0] Seria kalendarzowa karze studencki rytm: weekend zrywa serię nawet z 2 zamrożeniami, a nowy student zamrożenia nie ma  ·  *(raport 2)*
- **Gdzie:**
  - `streakNext()` l. 16554–16563: ratunek tylko dla `sk.d === t - 2`, czyli jednego opuszczonego dnia.
  - `kStreakAlive()` l. 16571.
  - SQL `nauka_zamrozenie_uzyj()` w `supabase/skrot-v24-kosmetyki.sql` l. 440–461 chroni tylko „WCZORAJ”.
  - Cena 40 🪙, max 2 (`skrot-v24-kosmetyki.sql` l. 146).
  - Sklep → zakładka „Nauka” w sekcji „Wygląd” (`K_GROUPS`, l. 16578).
  - Kalendarz uczelni zna okresy (`CAL_DEFAULT.okresy`, l. 5202: „Przerwa świąteczna 2026-12-24 – 2027-01-06”, sesja, przerwa po sesji), ale seria ich nie używa.
- **Co jest źle:**
  - Student, który uczy się pon–pt i nie wejdzie w sobotę i niedzielę, w poniedziałek ma serię 1. Dzieje się tak, nawet jeśli kupił 2 zamrożenia, bo kod sprawdza tylko „przedwczoraj”.
  - Nowe konto ma 0 monet, więc w pierwszym tygodniu zamrożenia nie ma wcale.
  - Seria spada po cichu: zrzut d, seria 21 → „0 dni”, bez słowa.
  - W przerwie świątecznej (14 dni) seria musi zniknąć u prawie wszystkich. W styczniu, przed sesją, gdy motywacja jest najbardziej potrzebna, każdy startuje od zera.
  - Zamrożenie jest w Sklepie pod nagłówkiem „Wygląd · tylko wygląd: nie zmienia punktów ani wyników”, a to nieprawda dla zamrożenia.
- **Jak robią to najlepsi:**
  - W Duolingo można mieć naraz 2 zamrożenia (Streak Freeze). Zmiana dała +0,38% aktywnych dziennie i nie zwiększyła opuszczania lekcji ([Duolingo Blog](https://blog.duolingo.com/how-duolingo-streak-builds-habit); [badania o serii](https://blog.duolingo.com/duolingo-streak-research/)).
  - Duolingo testowało „Weekend Amulet”: w piątek zakładasz ochronę serii na weekend. Kontekst: w weekend aktywność dzienna spada nawet o 5–10%. Efekt amuletu: +4% powrotów po tygodniu i 5% mniej utraconych serii ([Duolingo Blog](https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/)).
  - Wpis Duolingo o badaniach serii przyznaje, że utrata serii po jednym dniu może obniżać motywację, a pewna elastyczność działa lepiej niż sztywne zasady ([Duolingo Blog](https://blog.duolingo.com/duolingo-streak-research/)).
  - Anki ma „Easy Days”: wybrane dni tygodnia z mniejszą liczbą powtórek ([Anki Manual](https://docs.ankiweb.net/deck-options.html)).
- **Jak poprawić:**
  1. **Zamrożenia na kolejne dni.** W `streakNext(t)` zamień warunek na pętlę:
     - `gap = t - sk.d - 1` (opuszczone dni), `have = kSk().zamrozenia?.ma || 0`, `frozen = liczba dni z [sk.d+1 … t-1], które kFrozen()`;
     - jeśli `gap - frozen <= have` i `gap <= 2`, wywołaj `kFreezeUse` dla każdego niechronionego dnia i zwróć `{ d: t, n: sk.n + 1 }`;
     - analogicznie popraw `kStreakAlive()`.
     - SQL: nowa funkcja `nauka_zamrozenie_uzyj_dni(p_dni date[])`, która dla każdego dnia z listy (tylko z ostatnich 3 dni, bez punktów w `nauka_rp`) zużywa jedno zamrożenie. Zostaw starą dla wstecznej zgodności.
  2. **Jedno zamrożenie za darmo.** Przy pierwszym dniu nauki (`streak.n` osiąga 2) baza dodaje wpis do `nauka_zamrozenia` ze źródłem `prezent`, raz na konto. Baner PL: „🧊 Masz zamrożenie serii w prezencie. Jeden opuszczony dzień nie zerwie serii.” / EN: „🧊 You got a free streak freeze. One missed day won't break your streak.”
  3. **Przerwy z kalendarza uczelni.** Dni z `CAL.PERIODS`, których `opis` zawiera „Przerwa” (świąteczna, po sesji), oraz dni z `OFF` (święta) nie zrywają serii i nie dodają dni. Licz je jak zamrożone, ale bez zużycia zamrożenia i bez XP.
     - W pigułce serii w tym okresie dopisek PL „· przerwa, seria czeka” / EN „· break, streak paused”.
     - To samo musi liczyć baza, jeśli seria idzie do rankingu.
  4. **Tydzień nauki jako druga miara.** Zadanie tygodnia „Ucz się 5 dni w tym tygodniu” już istnieje (Sklep, zrzut 20). Pokaż je na Dziś jako 7 kropek pon–nd pod powitaniem, w tym samym rzędzie co ranga, z tekstem PL „Ten tydzień: {k}/5 dni” / EN „This week: {k}/5 days”. 5 z 7 pasuje do planu zajęć pon–pt.
  5. **Zamrożenie w Sklepie** przenieś z sekcji „Wygląd” do osobnej sekcji nad motywami: PL „Ochrona serii” / EN „Streak protection”, z opisem PL „Chroni do 2 opuszczonych dni z rzędu. Nie daje XP ani punktów.” / EN „Protects up to 2 missed days in a row. Gives no XP or points.”
  6. **Test (atrapa):**
     - `streak: { d: T-3, n: 10 }` + 2 zamrożenia daje Dziś „10 dni” (szary), a po nauce 11;
     - ten sam stan z 1 zamrożeniem daje 1;
     - zegar 28.12.2026, `streak.d` = 23.12.2026 daje serię nadal widoczną z dopiskiem „przerwa”.
- **Koszt:** M
- **Wpływ:** retencja D7/D30, zaufanie (seria nie „kradnie” wysiłku)

#### [P2] Seria liczona w przeglądarce z XP, zamrożenie w bazie z punktów rankingu: możliwa rozbieżność  ·  *(raport 2)*
- **Gdzie:** `xpFlush()` (l. 10424) przedłuża serię przy każdym XP > 0. `nauka_zamrozenie_uzyj()` sprawdza `nauka_rp` (punkty rankingu) za wczoraj.
- **Co jest źle:** dzień z XP bez punktów rankingu (np. samo czytanie sekcji lekcji, jeśli nie daje pkt) jest dla strony dniem nauki, a dla bazy „opuszczonym”. Wtedy zamrożenie może się zużyć mimo nauki, albo seria w rankingu i na stronie się rozjadą.
- **Jak poprawić:** jedno źródło prawdy, „dzień nauki” = dzień z `xp.n > 0`, zapisywany w bazie, np. tabela `nauka_dni(user_id, dzien)` uzupełniana przy zapisie progress. Zamrożenie i ranking pytają tę tabelę. Test: dzień z samym czytaniem (XP, 0 pkt) nie zużywa zamrożenia następnego dnia.
- **Koszt:** M
- **Wpływ:** zaufanie

#### [P2] P2-16. Dwie różne serie i zamrożenie, o którym nikt nie wie  ·  *(raport 5)*
> **Uwaga organizatora:** robisz tylko część o zamrożeniu (propozycja przy serii, darmowe); ikona i podpis serii Hasła to pętla 5.
- **Gdzie:** Hasło `🔥 1` „Seria: dni z odgadniętym Hasłem” (`zrzuty-5/g-haslo-koniec-cala.png`, index.html ok. 12130) obok głównej 🔥 serii. Zamrożenie 40 🪙 w zakładce Sklep → Nauka (v24), `streakNext` (16554) ratuje tylko 1 dzień przerwy.
- **Co jest źle:** Dwa płomienie z różnymi liczbami mylą. Hasło nie daje XP, więc samo Hasło nie przedłuża głównej serii (P1-4). Zamrożenie, najbardziej użyteczny wydatek monet, jest schowane w piątej zakładce sklepu i nikt o nim nie przypomina, gdy seria rośnie.
- **Jak robią to najlepsi:** Duolingo pozwala mieć naraz dwa zamrożenia. Według bloga zwiększyło to względną liczbę codziennie aktywnych uczących się o 0,38% ([streak](https://blog.duolingo.com/how-duolingo-streak-builds-habit)). Sklep Duolingo wprost poleca kupić Streak Freeze ([Duolingo 101](https://blog.duolingo.com/duolingo-101-how-to-learn-a-language-on-duolingo)).
- **Jak poprawić:** Seria Hasła: zmienić ikonę na „🅰️ N” z podpisem „Hasło: N dni z rzędu” / „Word: N days in a row”, żeby nie była płomieniem. Po serii 3 dni, przy saldzie ≥ 40 i braku zamrożenia, na ekranie końca karta „Chroń serię: zamrożenie za 40 🪙” / „Protect your streak: freeze for 40 🪙” z przyciskiem kupna (`kBuy` z v24). Pierwsze zamrożenie dać za darmo przy serii 7 dni (jak skrzynka).
- **Koszt:** S
- **Wpływ:** retencja D7/D30.
