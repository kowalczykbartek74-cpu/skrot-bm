# Materiał dla recenzenta · UX-2 etap 3

## Kryteria etapu
**Etap 3 – Powroty po przerwie** (C3)
- K1: przerwa ≥ 2 dni, dziś brak XP → nad blokiem lekcji karta „Dobrze, że jesteś. Ostatnio N dni temu.” ze Stasiem i maks. 3 punktami, które naprawdę są (zajęcia, nowe terminy, fiszki).
- K2: „Wracam: 3 minuty” otwiera lżejszą kartę (`lekko`: rozgrzewka maks. 6 + 1 pytanie, bez nowego tematu); `trybDnia` uwzględnia `przerwaDni`.
- K3: seria spadła (stara ≥ 3, przerwa 2–4 dni) → wiersz naprawy; po 2 kolejnych dniach z XP seria = n + 2 i baner; raz na 30 dni.
- K4: mail „powrót” prowadzi do `#/?wracam=1`, który od razu otwiera kartę z K1.
- K5: utrata serii nigdy nie jest cicha (komunikat przy pierwszym wejściu).

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
### C3 · Etap 3: powroty

#### [P1] Nie ma ścieżki powrotu: po 5 dniach przerwy albo po utracie serii ekran jest identyczny jak zawsze  ·  *(raport 2)*
- **Gdzie:**
  - Dziś (`zrzuty-2/c-przerwa5-ekran1.png`, `d-utrata-serii-ekran1.png`).
  - `viewHome()` l. 7795.
  - `lekcja-dnia.js` `nieudaneDni` l. 148–151: „dzień bez wejścia przerywa serię”, czyli nieobecność nie włącza trybu „lekko”.
  - `homeFold("new", newPanel())` (l. 7754): „Nowe od ostatniej wizyty” zwinięte na samym dole.
- **Co jest źle:**
  - Ktoś, kogo nie było 5 dni (choroba, wyjazd, kolokwium z innego przedmiotu), dostaje tę samą kartę „Zacznijmy od pierwszego tematu. Dziś wystarczy 5 minut.”.
  - Nie ma powitania, nie ma podsumowania, co go ominęło (zajęcia, nowe terminy od starosty). Seria 12 zmienia się w „0 dni” bez wyjaśnienia.
  - Tryb „lekko” włącza się dopiero po 3 dniach z planem i bez nauki. Dni bez wejścia w ogóle się nie liczą, więc powracający dostaje normalną porcję.
  - Mail „powrót” (`przypomnienia.js`, po ≥4 dniach) obiecuje „jedno krótkie zadanie”, ale strona po kliknięciu niczego takiego nie pokazuje.
- **Jak robią to najlepsi:**
  - Duolingo mierzy osobno „resurrected users” (powrót po ≥30 dniach). Po powrocie są one o ok. 20% rzadziej zatrzymywane po 7 i 14 dniach niż nowi. Firma budowała dla nich osobne ponowne wprowadzenie ([Duolingo Blog](https://blog.duolingo.com/back-from-the-brink-what-duolingo-learned-about-its-resurrected-users)). Metryki takich użytkowników (SURR) to osobna dźwignia wzrostu ([Lenny’s Newsletter](https://lennysnewsletter.com/p/how-duolingo-reignited-user-growth)).
  - W czerwcu 2026 Duolingo pozwoliło odzyskać utraconą serię 30+ dni wysiłkiem: 3 lekcje za jednym razem ([PocketGamer.biz](https://www.pocketgamer.biz/duolingo-is-restoring-lost-streaks-for-a-limited-time-aiming-to-recover-lapsed-users/)).
  - Naprawę serii za opłatą krytykuje się jako „deceptive pattern” ([Deceptive Design](https://www.deceptive.design/articles/when-a-user-uses-duolingo-on-a-series-of-consecutive-days-this-is-called-a-streak-if-users-miss-a-day-they-can-pay-to-repair-it)). Dla studentów płacących 199 zł lepsza jest naprawa wysiłkiem.
- **Jak poprawić:**
  1. **Wykrycie powrotu.** `const gap = dayN() - (S.progress?.xp?.d ?? dayN())`. Gdy `gap >= 2` i dziś jeszcze nie było XP, nad `ldBlock()` w `viewHome()` pokaż kartę `.panel.sk-panel.comeback` z Stasiem (`stasFace("hi")`):
     - Tytuł PL: „Dobrze, że jesteś. Ostatnio {gap} dni temu.” / EN: „Good to see you. Last time: {gap} days ago.”
     - Lista max 3 punktów (tylko te, które są): PL „Zajęcia, które minęły: {n}” (z planu grupy), „Nowe terminy: {n}” (deadlines z `createdAt` > ostatnia wizyta), „Fiszki do odświeżenia: {n}” / EN „Classes you missed: {n}”, „New deadlines: {n}”, „Cards to refresh: {n}”.
     - Jeden przycisk PL „Wracam: 3 minuty” / EN „I'm back: 3 minutes”. Otwiera kartę 5 min z flagą `lekko: true`: rozgrzewka (rewanże / zaległe fiszki, max 6) + 1 pytanie, bez nowego tematu.
  2. **Tryb „lekko” w `lekcja-dnia.js`.** W `trybDnia()` dodaj wejście `k.przerwaDni` i warunek `lekko ||= k.przerwaDni >= 2`.
  3. **Naprawa serii wysiłkiem.** Gdy seria spadła (stara `streak.n >= 3`, `gap` między 2 a 4 dni), przez 3 dni pokazuj w karcie powrotu dodatkowy wiersz:
     - PL „Twoja seria {n} dni się przerwała. Zrób dziś i jutro po 5 minut, a wróci.” / EN „Your {n}-day streak broke. Do 5 minutes today and tomorrow and it comes back.”
     - Stan zapisuj w `progress.streakRepair = { n, od: dayN(), dni: [] }`.
     - Po dwóch kolejnych dniach z XP: `streak.n = n + 2` i baner PL „🔥 Seria odzyskana: {n+2} dni” / EN „🔥 Streak restored: {n+2} days”.
     - Raz na 30 dni.
  4. **Mail „powrót”** (`przypomnienia.js`): `path` zmień na `"#/?wracam=1"`, a strona przy `wracam=1` otwiera od razu kartę z punktu 1.
  5. **Test:** stan c daje kartę „Ostatnio 5 dni temu” nad hero. Stan d daje dodatkowo wiersz naprawy. Po nauce dziś i „jutro” (zegar +1 dzień) seria wynosi 23.
- **Koszt:** M
- **Wpływ:** retencja D7/D30, zaufanie
