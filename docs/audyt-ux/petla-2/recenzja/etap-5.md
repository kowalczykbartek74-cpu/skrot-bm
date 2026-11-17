# Materiał dla recenzenta · UX-2 etap 5

## Kryteria etapu
**Etap 5 – Dziś: układ, zadania, duet, tempo** (C5)
- K1: kolejność pod panelem: `ZD_WEJSCIE?.pasekProby?.()` (jeśli jest) → linia zadań/tygodnia/duetu → Lekcje dla Ciebie → Twój postęp → Boss (tylko gdy trwa) → Na luzie; Przewodnik i Profil nauki tylko w pierwszych 3 dniach konta; wysokość Dziś ≤ 1800 px dla konta płatnego przy 390 px; każdy przycisk zakupu na Dziś przez `ZD_WEJSCIE?.przyciskZakupu?.(…) ?? <stary przycisk>` (nie usuwaj wyrażeń z komentarzem `// ux-1`).
- K2: chipy pod głównym przyciskiem bez ucięcia (PL i EN, 360 px); Lekcje dla Ciebie na telefonie jedna pod drugą.
- K3: linia „Zadania dnia: d/4 · +N · nowe za H h” (moneta jako ikona SVG `coin`, nie emoji) rozwija własną, prostą listę zadań (karty `misjaCard` w Sklepie należą do pętli 5); `skrot-v57-….sql`: automatyczny odbiór zrobionych zadań w `nauka_mon_z_rp` (PGlite: 10 dobrych odpowiedzi → saldo +8 bez wchodzenia do Sklepu, bez podwójnych nagród, odbiór ręczny dalej działa); `#/?zadania=1` rozwija linię; `ZD_NAWYK.zadaniaLinia()` dla ekranu końca i `ZD_NAWYK.zadaniaStan()` dla Sklepu.
- K4: z duetem: wiersz „Duet z {nick}: s/8 w tym tygodniu · {nick} dziś ✓ / jeszcze nie”; bez duetu po 3. dniu nauki raz zaproszenie z `navigator.share` (fallback: kopiuj link).
- K5: kafelek przedmiotu z najbliższym terminem: „W tym tygodniu: k z cel tematów”; przy braku daty „Znasz datę kolokwium? Wpisz” (to samo pole co w „Przygotuj się”); starosta przy > 3 terminach bez daty widzi linię z linkiem do Terminów.
- K6: pusty stan Powtórek z tekstem z C5 i przyciskiem „Karta 5 minut”; w wersji darmowej kafelki terminów widoczne, zablokowany tylko plan nauki.

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
### C5 · Etap 5: Dziś, zadania, duet, tempo

#### [P2] Dziś ma 9 bloków pod hero, a powrotne bodźce giną na dole  ·  *(raport 2)*
- **Gdzie:** Dziś (zrzut 10-cała), od góry:
  1. hero
  2. Lekcje dla Ciebie (karuzela)
  3. „Ułożymy lepiej po Profilu nauki”
  4. Twój postęp + kafelki terminów
  5. Boss
  6. Przewodnik
  7. Na luzie
  8. Nowe od ostatniej wizyty (zwinięte)
  9. stopka
- **Co jest źle:** elementy pętli nawyku (seria, cel, zadania, duet, powrót) albo nie istnieją na Dziś, albo są pod 3 ekranami przewijania. Rzeczy jednorazowe (Przewodnik, Profil nauki) zajmują miejsce codziennie.
- **Jak poprawić:**
  - Kolejność: hero (z serią i celem w powitaniu) → Zadania dnia + tydzień 5/7 + duet (jedna zwijana linia, P1) → Lekcje dla Ciebie → Twój postęp → Boss (tylko gdy trwa) → Na luzie.
  - „Przewodnik” i „Profil nauki” pokazuj tylko w pierwszych 3 dniach od założenia konta, potem tylko w Więcej.
  - Test: na 390×844 pod hero, po jednym przewinięciu, widać linię zadań.
- **Koszt:** S
- **Wpływ:** retencja D7

#### [P1] Dziś: 9 bloków pod hero, przycięta karuzela i chipy bez sygnału przewijania  ·  *(raport 4)*
- **Gdzie:** `10-dzis-cala.png` (2692 px wysokości), `10-dzis-ekran1.png` i `33-dzis-en-ekran1.png` (chip „Mam w…” / „I have r…” ucięty krawędzią karty), `03-proba-trwa-ekran1.png`, `zrzuty-4/360-dzis.png`.
- **Co jest źle:** W ciągu sekundy widać „Zaczynamy · 5 min”, i to działa. Dalej konkuruje ze sobą 9 bloków: Lekcje dla Ciebie (karuzela z kartą uciętą na krawędzi), Profil nauki, Twój postęp z trzema kafelkami terminów, Inflator/boss, przewodnik, Na luzie, Nowe od ostatniej wizyty. Trzeci chip pod CTA jest ucięty bez cienia ani strzałki, więc wygląda na błąd, a nie na przewijany rząd. W EN „I have more time” jest dłuższe i cięcie wypada w środku słowa.
- **Jak robią to najlepsi:** ekran główny Duolingo prowadzi jedną ścieżką krok po kroku, z „a clear path to follow” ([Duolingo, nowy ekran główny](https://blog.duolingo.com/new-duolingo-home-screen-design)).
- **Jak poprawić:**
  1. Chipy pod hero: `flex-wrap: wrap` zamiast przewijania (3 chipy mieszczą się w 2 rzędach przy 360 px) albo skróć teksty do „Inny temat”, „Wybierz”, „+10 min” (EN „Other”, „Pick”, „+10 min”).
  2. Karuzela „Lekcje dla Ciebie” na telefonie: kafle jeden pod drugim (`grid-template-columns:1fr`), bo są tylko 2.
  3. Kolejność pod hero: Lekcje dla Ciebie → Twój postęp (z terminami) → jeden zwinięty blok „Więcej na dziś” (boss, Na luzie, przewodnik, nowości), domyślnie zamknięty.
  4. Test: wysokość strony Dziś przy 390 px ≤ 1800 px dla konta płatnego; brak elementów z `right > clientWidth` bez rodzica `overflow-x:auto` z maską gradientu.
- **Koszt:** M
- **Wpływ:** czytelność, retencja D1

#### [P1] Zadania dnia i tygodnia są tylko w Sklepie, a mail prowadzi do nich na Dziś  ·  *(raport 2)*
- **Gdzie:**
  - Sklep (zrzut 20, `shopMisje()` l. 15963): „Zadania dnia · 3 wspólne dla roku + 1 Twoje”, „Zadanie tygodnia: Ucz się 5 dni w tym tygodniu +50 🪙”.
  - Na Dziś nic (`10-dzis.txt` nie zawiera „Zadanie”). Stara karta z Zadaniem dnia (`nowCard`, l. 7635) jest wyłączona, bo `LD_WSZYSCY = true` (l. 19853).
  - Mail: `przypomnienia.js` rodzaj `zadanie`, „Otwórz Zadanie dnia”, `path: "#/"`.
- **Co jest źle:**
  - Codzienne cele z nagrodą to w Duolingo główny „powód na dziś”, a tu siedzą w Sklepie, który student odwiedza, żeby wydać monety, a nie żeby się uczyć.
  - Mail obiecuje Zadanie dnia, a link otwiera Dziś, gdzie go nie ma. To złamana obietnica przy pierwszym kliknięciu z maila.
  - Tekst „Nowe zadania za 7 h 0 min” (dobry, pilny bodziec) widzi tylko ktoś, kto przewinie Sklep.
- **Jak robią to najlepsi:** misje dnia w Duolingo to osobna zakładka i zadania liczą się do celu miesiąca. Friends Quests (wspólne zadanie tygodniowe z losowym znajomym, 5 dni na wykonanie) są warte więcej punktów niż zadania dzienne ([Duolingo Blog: Friends Quests](https://blog.duolingo.com/friends-quests/)).
- **Jak poprawić:**
  1. Na Dziś, bezpośrednio pod `ldBlock()`, dodaj jedną zwijaną linię `homeQuests()`: `details.panel.quests` z `summary`:
     - PL „Zadania dnia: {zrobione}/{4} · +{suma} 🪙 · nowe za {h} h” / EN „Daily tasks: {done}/{4} · +{sum} 🪙 · new in {h} h”;
     - po rozwinięciu te same karty co w `shopMisje()` (wydziel funkcję renderującą karty z `shopMisje` i użyj w obu miejscach);
     - pod spodem pasek zadania tygodnia (patrz P0 o tygodniu 5/7, jeden element zamiast dwóch).
  2. Zadanie dnia, które już jest zrobione i czeka na odbiór, rozwija `details` automatycznie i ma przycisk „Odbierz +8 🪙” / „Claim +8 🪙”.
  3. W mailu `zadanie` zmień `path` na `"#/?zadania=1"`, a strona przy `zadania=1` przewija do `homeQuests` i ją rozwija.
  4. **Test:** Dziś z kontem „platne” pokazuje linię „Zadania dnia: 0/4”. Klik rozwija 4 karty. Link `#/?zadania=1` je otwiera.
- **Koszt:** S
- **Wpływ:** retencja D1/D7, zaufanie (mail = to, co widzę)

#### [P1] P1-5. Zadania dnia są w Sklepie, trzeba je odebrać ręcznie, a nieodebrane przepadają o północy  ·  *(raport 5)*
- **Gdzie:** `zrzuty/20-sklep-*` (jedyne miejsce z zadaniami), Dziś bez zadań (`zrzuty/10-dzis.txt`, `zrzuty-5/k-dzis-poz5.txt`), koniec lekcji bez postępu zadań (`zrzuty-5/h-koniec-dobrze.png`). Kod: `shopMisje` (index.html:15963), `misjaCard` (15950), `misjaClaim` (15906, jedyne miejsce wołające `misjaOdbierz`). SQL: `nauka_misja_odbierz` przyjmuje tylko misje z `nauka_misje_na(nauka_dzis())` (v14, sekcja 6).
- **Co jest źle:** Student robi 10 dobrych odpowiedzi, ale nigdzie nie widzi „Zadanie zrobione”. Nagroda przepada, jeśli przed północą nie wejdzie w Więcej → Sklep i nie kliknie „Odbierz”. Zadanie tygodnia (+50 🪙) przepada w niedzielę. To kara za naukę bez zaglądania do sklepu i największe źródło monet dla profilu A.
- **Jak robią to najlepsi:** W Duolingo zadania (Quests) są w dolnym menu, obok ścieżki ([blog o ścieżce](https://blog.duolingo.com/new-duolingo-home-screen-design)). Friends Quests mają tygodniowy cel i skrzynię z nagrodą ([Friends Quests](https://blog.duolingo.com/friends-quests/)).
- **Jak poprawić:**
  1. Auto-odbiór w bazie: w funkcji triggera `nauka_mon_z_rp()` (v14) po przeliczeniu monet dnia przejść po `nauka_misje_na(new.dzien)` i dla każdej misji, której `nauka_misja_postep(new.user_id, m, new.dzien) >= ile`, wstawić wpis z kluczem `nauka_misja_klucz(m, new.dzien)` `on conflict do nothing` (ta sama logika co `nauka_misja_odbierz`, bez `auth.uid()`). Dzięki temu nic nie przepada. Przycisk „Odbierz” zamienić na chip „✓ Odebrane +8 🪙”.
  2. Dziś: pod paskiem rangi (`.greet`) dodać pasek „Zadania dnia 1/3” / „Daily quests 1/3” z trzema kropkami. Klik otwiera arkusz z listą (ten sam `misjaCard`). Jeśli wszystkie zrobione, „✓ Wszystkie zadania dnia” / „✓ All daily quests”.
  3. Ekran końca karty i lekcji (`done(st)` 19731, `lpSrcDone` 11436): jeśli sesja popchnęła zadanie, wiersz „🎯 Odpowiedz dobrze na 10 pytań: 7/10” / „🎯 Answer 10 correctly: 7/10”. Przy ukończeniu: „+8 🪙” z `coinFly`.
  4. Atrapa: dopisać auto-odbiór do `nauka_misje` w `atrapa-supabase.js`.
  - **Test:** 10 dobrych odpowiedzi w quizie → bez wchodzenia do sklepu saldo +8. Na Dziś „Zadania dnia 1/3”, w sklepie chip „✓ Odebrane”.
- **Koszt:** M
- **Wpływ:** retencja D7 (cele krótkoterminowe), poczucie sprawiedliwości.

#### [P1] Paczka i Duet tygodnia (społeczne zobowiązanie) są schowane w Więcej  ·  *(raport 2)*
> **Uwaga organizatora:** „Brawo” dla kolegi robi pętla 5; Ty robisz wiersz duetu na Dziś i zaproszenie.
- **Gdzie:** Więcej → „Paczka i duet” (zrzut 16, l. 14414). Widok `paczka` (l. 14759). `paczka.js`: duet z celem 8 sesji tygodniowo i nagrodą 20 🪙, paczka 2–8 osób, widać tylko wysiłek.
- **Co jest źle:**
  - Mechanizm, który przy 100–300 osobach działa lepiej niż ranking (wystarczy 1 znajomy), jest 2 kliknięcia od Dziś, bez żadnej zachęty.
  - Na Dziś nie widać, czy partner z duetu dziś się uczył, a to jest właśnie bodziec „nie zawiodę Kuby”.
- **Jak robią to najlepsi:**
  - Duolingo Friend Streak: wspólna seria z maksymalnie 5 znajomymi. Uczniowie z co najmniej jedną taką serią są o 22% bardziej skłonni zrobić dzienną lekcję. Największą barierą było wysłanie pierwszego zaproszenia ([Duolingo Blog: product lessons friend streak](https://blog.duolingo.com/product-lessons-friend-streak/)).
  - Friends Quests: wspólny cel tygodniowy z jednym znajomym ([Duolingo Blog](https://blog.duolingo.com/friends-quests/)).
- **Jak poprawić:**
  1. Gdy użytkownik ma duet: w `homeQuests()` (patrz P1 o zadaniach) dodaj wiersz PL „Duet z {nick}: {suma}/8 w tym tygodniu · {nick} dziś {✓ był(a) | jeszcze nie}” / EN „Duo with {nick}: {sum}/8 this week · {nick} today {✓ studied | not yet}”.
  2. Gdy nie ma duetu, po 3. dniu nauki, raz: na ekranie końca karta PL „Ucz się w duecie: wspólny cel 8 dni w tygodniu, +20 🪙 dla obojga. Wyślij link znajomemu z roku.” / EN „Study as a duo: a shared goal of 8 days a week, +20 🪙 each. Send the link to a classmate.” Przycisk „Wyślij link” wywołuje `navigator.share({ url })`, a gdy share nie istnieje, kopiuje link. To ten sam link, co w widoku paczki.
  3. **Test:** konto z duetem w atrapie pokazuje wiersz na Dziś.
- **Koszt:** S–M
- **Wpływ:** retencja D7/D30

#### [P1] Daleki termin (77 dni) nie napędza dzisiejszej nauki: brak tempa „na ten tydzień”, 11 terminów bez daty, Boss dopiero 7 dni przed  ·  *(raport 2)*
- **Gdzie:**
  - Terminy (zrzut 14: „W ciągu 30 dni: 0 zaliczeń”, „Bez daty: 11”).
  - Dziś „Twój postęp” (`ptsDzis()` po l. 11325): kafelki „77 dni”, „82 dni”.
  - Boss: SQL v15 `boss_dni: 7` (`supabase/skrot-v15-gry2.sql` l. 42).
  - „Przygotuj się” (zrzut 24): „Termin nieznany. Wpisz datę, a plan ułoży się sam.”
- **Co jest źle:**
  - „77 dni” nie mówi, co zrobić w tym tygodniu. To liczba, która uspokaja („jeszcze dużo czasu”), zamiast motywować.
  - Kolokwia śródsemestralne nie mają dat, więc przypomnienia o terminach, tryb „przed kolokwium” i Boss nie działają przez listopad i grudzień. To akurat okres próbny i decyzji o zakupie u pierwszych klientów.
  - Wpisanie własnej daty jest w głębi „Przygotuj się”, a nie tam, gdzie student widzi brak daty.
- **Jak robią to najlepsi:**
  - Anki ostrzega, żeby nie dokładać nowych kart przy zaległościach, i pozwala ustawić dzienne limity tak, żeby porcja była przewidywalna ([Anki Manual](https://docs.ankiweb.net/deck-options.html)).
  - Model Hooked Nira Eyala zakłada, że wyzwalacz zewnętrzny z czasem zastępuje wewnętrzny. U studenta naturalnym wyzwalaczem jest zbliżające się zaliczenie ([Nir Eyal](https://www.nirandfar.com/how-to-manufacture-desire/)).
  - Tu terminy są najmocniejszym motorem, jaki Zdawalni ma, a Duolingo go nie ma. Szkoda go marnować.
- **Jak poprawić:**
  1. **Tempo w kafelku.** W `ptsDzis()` dla przedmiotu z najbliższym terminem dodaj pod nazwą linię:
     - PL „W tym tygodniu: {k} z {cel} tematów” / EN „This week: {k} of {goal} topics”;
     - `cel = ceil((tematy do „umiesz”) / max(1, tygodnie do terminu − 1))` (ostatni tydzień zostaje na powtórkę), `k` = tematy, które w tym tygodniu przeszły do „umiesz”;
     - pasek `knowBar` w kolorze przedmiotu.
  2. **Wiersz „Bez daty”** w Terminach i kafelek w `ptsDzis` dla przedmiotu bez terminu: przycisk PL „Znasz datę kolokwium? Wpisz” / EN „Know the test date? Add it”, który otwiera to samo pole co w „Przygotuj się” (własna data, `own`). Po wpisaniu toast PL „Plan i przypomnienia ułożą się do {data}.” / EN „Plan and reminders will follow {date}.”
  3. **Starosta** (konto „starosta”): na Dziś, gdy jest więcej niż 3 terminy bez daty, jedna linia PL „{n} zaliczeń bez daty. Uzupełnij, a rok dostanie plan i bossa.” / EN „{n} assessments without a date. Fill them in so the year gets a plan and a boss.”, link do Terminów. Rynek to jeden rocznik, a starosta jest kanałem dystrybucji, więc to tani i mocny ruch.
  4. **Test:** konto „platne”, przedmiot z terminem za 77 dni i 2 tematami daje linię „W tym tygodniu: 0 z 1 tematów”.
- **Koszt:** M
- **Wpływ:** retencja D7/D30, konwersja z próby (widać sens zakupu „do sesji”)

#### [P2] Powtórki: pusty stan odsyła do „zakładki Ćwicz”, której nie ma w dolnym pasku  ·  *(raport 2)*
- **Gdzie:** Powtórki (zrzut 13): „Przejrzyj fiszki w dowolnym materiale albo dodaj cały przedmiot (zakładka Ćwicz).” Zakładka „Ćwicz” istnieje tylko w widoku przedmiotu (zrzut 12).
- **Jak poprawić:**
  - Tekst PL: „Jeszcze nic do powtórki. Zrób dziś kartę 5 minut, a fiszki z niej wrócą tu jutro.” / EN: „Nothing to review yet. Do today's 5-minute card and its flashcards will come back here tomorrow.”
  - Przycisk PL „Karta 5 minut” / EN „5-minute card” prowadzi do `go({ view: "home" })` i `ldOpen("karta")`. „Wybierz przedmiot” zostaje jako `.btn.ghost`.
  - Pusty stan to obietnica jutra („wrócą tu jutro”), czyli powód do powrotu.
- **Koszt:** S
- **Wpływ:** retencja D1

#### [P2] Promesa „Terminy zaliczeń Twojej grupy” na wejściu, a w wersji darmowej „Terminy zaliczeń zobaczysz z pełnym dostępem”, choć liczba dni do kolokwium jest pokazana wyżej  ·  *(raport 1)*
- Gdzie: `#login .lg-intro` (3. punkt), `index.html` 11359. Tekst `zrzuty/02-darmowe-konto.txt`: „Makroekonomia / kolokwium za 77 dni” i dwie linie niżej „Terminy zaliczeń zobaczysz z pełnym dostępem.”
- Co jest źle: sprzeczność na jednym ekranie. Do tego terminy to najlepszy powód, żeby wrócić (P1 win-back), a ich ukrywanie osłabia powroty osób bez dostępu.
- Jak poprawić: w darmowej wersji pokaż kafelki terminów (nazwa i „za n dni”), a zablokuj tylko szczegóły (zakres, plan „Przygotuj się”). Notka: PL „Plan nauki do każdego terminu jest w pełnej wersji.” / EN „A study plan for every deadline is in the full version.”
- Koszt: S
- Wpływ: retencja osób bez dostępu, spójność.

#### [P1] Ekran końca sesji nie odpowiada na „co dalej” i nie zamyka pętli  ·  *(raport 2)*
> **Uwaga organizatora:** to znalezisko pokazuje, czego ekran końca potrzebuje od Ciebie (seria +1, cel dnia, jutro, przypomnienie). Sam ekran końca przebudowuje pętla 3; Ty dostarczasz funkcje `ZD_NAWYK`.
- **Gdzie:**
  - `zrzuty-2/e-koniec-8.png`: „Zrobione ✓ · Pięć minut na plus. Możesz iść dalej albo wrócić później.” Statystyki +18 XP, 0/3, „1 najdłuższa seria”, pasek rangi, „Dziś: +18 XP”, przycisk „Przejdź do lekcji” i dolny „Gotowe”.
  - Kod: `done()` l. 19733–19739, `lpSrcDone()` l. 11436.
- **Co jest źle:**
  - Ekran pokazuje 6 liczb naraz, ale nie mówi:
    - że seria właśnie urosła (patrz P0);
    - ile brakuje do celu dnia;
    - co będzie jutro;
    - że można dostać przypomnienie.
  - „Możesz iść dalej albo wrócić później” to zaproszenie do wyjścia bez kotwicy na jutro.
  - Dwa przyciski („Przejdź do lekcji” na zielono i „Gotowe” jako dolny CTA) konkurują.
- **Jak robią to najlepsi:** Tiny Habits BJ Fogga: mała czynność po stałym „zaczepie” i natychmiastowa celebracja utrwalają nawyk ([Stanford Medicine, Tiny Habits – wprowadzenie](https://med.stanford.edu/content/dam/sm/ascend/documents/Introduction_%20Tiny%20Habits%20for%20Self%20Compassion,%20Getting%20Started.pdf)). W Duolingo po lekcji jest osobny ekran serii i ekran postępu celu dnia (źródło jak w P0).
- **Jak poprawić:** stała kolejność ekranu końca (pierwsza karta dnia):
  1. Staś + „Zrobione ✓”
  2. ekran „Seria +1” (P0), tylko przy pierwszej nauce dnia
  3. „Cel dnia: 18/50 XP” z paskiem
  4. „Jutro: {temat}, 5 min” (P0)
  5. karta przypomnienia (P0), gdy przypomnienia są wyłączone
  6. jeden główny przycisk: przy niespełnionym celu PL „Jeszcze 5 min do celu” / EN „5 more minutes to your goal”, przy spełnionym „Gotowe na dziś” / „Done for today”.

  „Przejdź do lekcji” zostaje jako `.btn.ghost`. Statystyki „dobrze” i „passa” przenieś do zwijanego „Szczegóły” / „Details”.
  **Test:** zrzut końca karty ma najwyżej 2 przyciski, a pierwszy ekran 390×844 mieści punkty 1–4 bez przewijania.
- **Koszt:** S–M
- **Wpływ:** retencja D1, przyjemność

