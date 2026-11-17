# Materiał dla recenzenta · UX-2 etap 1

## Kryteria etapu
**Etap 1 – Seria i cel dnia widoczne na Dziś** (C1)
- K1: seria > 0 i brak nauki dziś → płomień szary (`streak-todo`) z `title`; po 18:00 `streak-risk` (tło `--warn-soft`, tekst `--warn`, AA) z „· do północy”; po nauce `streak-done`.
- K2: przy pigułce pierścień celu dnia 20 px z `aria-label` „Cel dnia: x/30 XP”.
- K3: pigułka serii to `button` ≥ 44 px, otwiera okno „Twoja seria”: seria, kalendarz 4 tygodni (nauka, zamrożone, przerwy), „Masz N/2” zamrożeń z przyciskiem do sklepu, najlepsza seria (`progress.streakBest`).
- K4: 360 i 390 px z rangą „Systematyczny poz. 4”: nic nie wychodzi poza ekran.
- K5: `nawyk.js` wystawia `ZD_NAWYK.ekranSerii()` (raz dziennie, płomień 64 px, liczba, 7 kropek tygodnia, kamienie milowe 3/7/14/30/50/100 z konfetti wyłączanym przez calm i reduced-motion) i `ZD_NAWYK.celDnia()`; test jednostkowy obu.
- K6: „najdłuższa seria” w sensie odpowiedzi nie używa słowa „seria” ani płomienia w miejscach Twojej pętli (resztę zgłoś pętli 3).

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
### C1 · Etap 1: seria i cel dnia na Dziś

#### [P0] Dziś nie mówi „dziś jeszcze nie” ani „seria w niebezpieczeństwie”, a cel dnia 50 XP jest na Dziś niewidoczny  ·  *(raport 2)*
> **Uwaga organizatora:** punkt 3 (ekran „Seria +1”) budujesz jako `ZD_NAWYK.ekranSerii()`, a na ekranie końca wstawia go pętla 3; punkty 5–6 (wiersz jutra i cel na ekranie końca) dostarczasz jako `ZD_NAWYK.jutro()` / `celDnia()`. Cel dnia = 30 XP (B1), więc teksty „/50” zamień na stałą.
- **Gdzie:**
  - Dziś (zrzut 10; `zrzuty-2/a-seria6-dzis-nic-ekran1.png` i `b-seria7-dzis30-ekran1.png`).
  - `lpLevelBar()` l. 9830–9849: pigułka serii to `span.xp-chip`, klasa `off` tylko przy `sk === 0`.
  - `goalRing()` l. 11281 i `skGoal()` l. 12795 są używane w Powtórkach (l. 20462) i Profilu (l. 14447), ale nie w `viewHome()` (l. 7795).
  - Ekran końca karty 5 min (`zrzuty-2/e-koniec-8.png`, `done()` l. ok. 19733).
- **Co jest źle:**
  - O 17:00 student z serią 6 dni bez dzisiejszej nauki widzi świecący płomień „6 dni”, tak samo jak student, który już się uczył. Nic nie mówi, że seria spadnie o północy.
  - Cel dnia 50 XP (`LP_DAILY_GOAL`, l. 9648) nie występuje na Dziś w ogóle (brak „Cel dnia” w `10-dzis.txt`).
  - Po karcie 5 min student ma +18 XP. Ekran końca pisze „Dziś: +18 XP” bez „z 50”, więc nie wie, że do celu brakuje 32.
  - Moment przedłużenia serii nie ma własnego ekranu: płomień „1 dzień z rzędu” to mała pigułka w środku listy statystyk.
  - Obok jest statystyka „najdłuższa seria: 1”, czyli seria dobrych odpowiedzi, a nie dni. To samo słowo w dwóch znaczeniach na jednym ekranie.
  - Po skończeniu karty hero mówi „Zrobione ✓ · Jeszcze 5 min” (zrzut f). Brak zapowiedzi jutra („Jutro: Całki oznaczone, 5 min”), czyli brak powodu do powrotu jutro.
- **Jak robią to najlepsi:**
  - Duolingo pokazuje animację po przedłużeniu serii, a w wybrane dni kamieni milowych specjalną animację. To zwiększyło szansę, że nowy uczeń jest aktywny po 7 dniach, o 1,7% ([Duolingo Blog](https://blog.duolingo.com/how-duolingo-streak-builds-habit)).
  - Duolingo oddzieliło serię od celu dnia: serię przedłuża jedna lekcja, a postęp celu dnia widać osobno. Efekty: retencja D14 +3,3%, uczniowie z serią 7+ dni +40%. Koszt: mniej osób kończyło cel dnia ([Duolingo Blog: improving the streak](https://blog.duolingo.com/improving-the-streak)).
  - Snapchat pokazuje klepsydrę przy serii, gdy zostaje kilka godzin na jej podtrzymanie ([BGR](https://bgr.com/guides/how-to-recover-your-snapstreak/)).
  - Zdawalni już ma serię za dowolne XP (jak Duolingo po zmianie), ale nie pokazuje osobno celu dnia ani stanu dnia.
- **Jak poprawić:**
  1. **Stan dnia w pigułce serii** (`lpLevelBar`, l. 9847). Policz `doneToday = S.progress?.streak?.d === dayN()`. Gdy `sk > 0 && !doneToday`:
     - klasa `xp-chip streak-todo`: płomień w `filter: grayscale(1); opacity:.55`, obramowanie `2px dashed var(--line)`;
     - `title` PL: „Ucz się dziś, żeby seria nie spadła” / EN: „Study today to keep your streak”.
     - Po godzinie 18:00 (`new Date().getHours() >= 18`) dodaj klasę `streak-risk`: tło `var(--warn-soft)`, tekst `var(--warn)` (#6A3B00 na #FFF4DE, kontrast ≥ 4,5:1) i dopisek PL „· do północy” / EN „· until midnight”.
     - Gdy `doneToday`: płomień pełny, klasa `streak-done`.
     - Pigułkę zamień ze `span` na `button` (min 44 px), który otwiera okno serii (patrz P2 „Pigułka serii jest martwa”).
  2. **Pierścień celu dnia na Dziś.** W pigułce serii albo obok niej mały pierścień `skRing(xpDay / LP_DAILY_GOAL)` 20 px z `aria-label` PL „Cel dnia: {x}/50 XP” / EN „Daily goal: {x}/50 XP”. Bez nowego bloku i bez dokładania rzeczy na Dziś.
  3. **Ekran „Seria +1”.** W `xpFlush()` (l. 10424) zapamiętaj, że `sn` przedłużyło serię (`sn.n > (S.progress?.streak?.n||0)` i `sn.d === dayN()`): `LP.streakUp = sn.n`. W `lpSrcDone` i ekranie końca lekcji, gdy `LP.streakUp`, przed statystykami pokaż:
     - duży płomień (`kFlame()`, 64 px), liczbę `sn.n` (Bricolage, 48 px), tekst PL „{n} {dzień/dni} z rzędu!” / EN „{n}-day streak!”;
     - pod spodem 7 kropek pon–nd bieżącego tygodnia (dni nauki z `S.progress` / `ldDay`), zielone `#1A7F45` = nauka, szare = brak, z `aria-label` dla każdej;
     - przy n ∈ {3, 7, 14, 30, 50, 100}: konfetti (`lpConfetti`, z poszanowaniem `lpReduced()`) i tekst PL „Kamień milowy: {n} dni” / EN „Milestone: {n} days”;
     - pokazuj raz dziennie (`ls.set("skrot-streak-shown", todayKey())`).
  4. **Statystyka „najdłuższa seria”** (l. 11035, 12590, 18550, 19736, 19735) zmień na PL „najlepsza passa” / EN „best run”, a `🔥 x{n}` w odtwarzaczu (l. 10404) na `⚡ x{n}`. Płomień zostaje tylko dla dni.
  5. **Zapowiedź jutra.** W `done()` źródła „ld” (l. 19735), gdy `allDone` albo karta, dodaj wiersz PL „Jutro: {tytuł następnego tematu z ldPlan dla dayN()+1 albo pierwszego nieprzerobionego}, 5 min” / EN „Tomorrow: {title}, 5 min”. To samo pod „Zrobione ✓” w `ldHero` (l. 19938).
  6. **Postęp celu na ekranie końca.** „Dziś: +18 XP” zamień na PL „Cel dnia: 18/50 XP” / EN „Daily goal: 18/50 XP” z paskiem.
  7. **Test:** `zrzuty-2/a` (seria 6, dziś nic) daje szary płomień. Ten sam stan z zegarem 19:00 daje klasę `streak-risk`. Stan b daje pierścień 30/50. Skończenie karty daje ekran „Seria +1” raz.
- **Koszt:** M
- **Wpływ:** retencja D1/D7, przyjemność

#### [P2] Pigułka serii jest martwa (nie da się jej dotknąć) i na 390 px ucina się przy dłuższej randze  ·  *(raport 2)*
- **Gdzie:** Dziś, `zrzuty-2/a-seria6-dzis-nic-ekran1.png`: przy randze „Systematyczny poz. 4” pigułka „6 dni” wychodzi poza prawą krawędź. `lpLevelBar()` l. 9847 (`span`, nie `button`).
- **Jak poprawić:**
  1. `.rk-line.rk-compact { flex-wrap: nowrap; }`, `.rk-compact .rk-name { max-width: 9ch; overflow: hidden; text-overflow: ellipsis; }`. Przy szerokości < 400 px chowaj `.rk-lv` („poz. 4”), bo poziom jest w odznace.
  2. Pigułkę zamień na `button` (min 44×44 px), który otwiera modal „Twoja seria” / „Your streak” z:
     - obecną serią;
     - kalendarzem 4 tygodni (kropki dni nauki, 🧊 dla zamrożonych, szare tło dla przerw z `CAL.PERIODS`);
     - liczbą zamrożeń „Masz {ma}/2” i przyciskiem do sklepu;
     - najlepszą serią (`progress.streakBest`, nowe pole, aktualizowane w `xpFlush`).
  3. **Test:** 360 px i 390 px z rangą „Systematyczny” nic nie wychodzi poza ekran.
- **Koszt:** S
- **Wpływ:** przyjemność, zaufanie
