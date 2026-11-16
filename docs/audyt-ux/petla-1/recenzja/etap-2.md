# Materiał dla recenzenta – pętla UX-1, etap 2

Wyciąg z polecenia pętli (bez zmian). Oceniasz tylko to, co widać na zrzutach, w raporcie, w kontroli automatycznej i w logu testów.

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

## Kryteria etapu 2
**Etap 2 – Widoczna próba i uczciwe przyciski zakupu** (C2)
- K1: każdy „Kup dostęp” na Dziś ma tło akcentu (#1A7F45 w jasnym; ciemny: akcent ciemnego motywu), a nie szarą pigułkę; na Dziś jest najwyżej jeden „Kup dostęp”.
- K2: konto `proba`: pigułka „Próba · dzień X z 3 · do …” w pierwszym ekranie 390×844, z `ZD_WEJSCIE.pasekProby()` wstawionej w `viewHome` jedną linią `// ux-1 tymczasowo` (B3); przy < 24 h kolor ostrzeżenia (AA) i raz dziennie arkusz.
- K3: `ZD_WEJSCIE.przyciskZakupu(kontekst)` zwraca „Wypróbuj 3 dni” (z „Kup dostęp” jako link obok), gdy próba jest możliwa, a zielony „Kup dostęp” po próbie. Użyty w 3 miejscach z C2 przez podmianę samego wyrażenia przycisku (komentarz `// ux-1`, B3). Konto `darmowe` z możliwością próby nie ma na Dziś samotnego „Kup dostęp”.
- K4: Ustawienia → Konto i dostęp w próbie: „okres próbny, zostały N dni”, nie „do końca 2. semestru”.
- K5: błąd startu próby (`mock-proba-blad=wykorzystany|urzadzenie`) → okno z „Wybierz plan”, „Napisz do nas”, „Zamknij” i tekstami z C2.
- K6: kierunki `oczekujacy` mają tag „Wkrótce” i prowadzą do listy oczekujących; `skrot-v52-….sql` odrzuca start próby dla rocznika nie-`platny` (test PGlite).

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

## Pełne znaleziska audytu dla etapu 2 (C2)
### C2 · Etap 2: widoczna próba i przyciski zakupu

#### [P0] „Kup dostęp” na Dziś wygląda jak przycisk drugorzędny, a stan próby jest niewidoczny  ·  *(raport 4)*
- **Gdzie:** Dziś (konto po próbie), `04-proba-koniec-cala.png`, `zrzuty-4/pay-proba-koniec-390.png`, `pay-proba-390.png`, `pay-darmowe-390.png`, wycinek `zrzuty-4/tmp/c04.png`. Kod: przycisk `h("button",{class:"btn primary"},"Kup dostęp")` w `index.html:20032`. Nadpisuje go reguła `index.html:5113–5115`: `html:not([data-theme]) main[data-view="home"] > :not(.ld-block) .btn { border:0!important; background:var(--dz-soft); color:var(--dz-ink) }`. Zmierzone tło przycisku: `rgb(237,241,234)` zamiast `#1A7F45`. To samo dotyczy `.btn.primary.small` w `.bb-act` (karta „Pełny dostęp”).
- **Co jest źle:** Po końcu próby student widzi Dziś identyczny z tym w trakcie próby i z kontem płatnym: ta sama karta „Zaczynamy · 5 min” i żadnej informacji, że dostęp się skończył. W nagłówku Dziś nie ma „Kup dostęp”, choć na Przedmiotach jest (`stan-darmowe-przedmioty.png`). Niżej (y ≈ 1080, 1630 i 1810 px) są trzy „Kup dostęp”: szara pigułka, zielony link i szara pigułka. Karta „Codziennie dwie lekcje…” ma tekst przyklejony do lewej krawędzi bez tła karty (`c04.png`, góra), więc wygląda na zepsutą. Najważniejsza akcja biznesowa ma najsłabszy wygląd na stronie.
- **Jak robią to najlepsi:** Duolingo projektuje ekran główny jako jedną ścieżkę z jasnym następnym krokiem („a clear path to follow”, [blog Duolingo, nowy ekran główny](https://blog.duolingo.com/new-duolingo-home-screen-design)). Gdy dostęp się kończy, następnym krokiem jest zakup, więc to on ma być najmocniejszym przyciskiem na ekranie.
- **Jak poprawić:**
  1. W `index.html:5113` dopisz wyjątek `:not(.primary)` w obu selektorach: `… > :not(.zh-hero) .btn:not(.primary), … > :not(.ld-block) .btn:not(.primary)`. To samo w regułach `:hover` (5116) i `:active` (5117).
  2. Dodaj regułę `html:not([data-theme]) main[data-view="home"] .btn.primary:not(.zh-hero .btn) { background: var(--accent); color: var(--accent-ink); box-shadow: 0 4px 0 var(--h-edge, #0E5A30); border-radius: 14px; min-height: 48px; }`.
  3. Na koncie bez dostępu (`!paid`) dodaj w `.greet-badges` czwartą plakietkę: w próbie „Próba: zostały 2 dni” (EN „Trial: 2 days left”), po próbie „Próba skończona” (EN „Trial ended”). Tło `--warn-soft`, tekst `--warn`. Kliknięcie otwiera `window.skrot.buy()`.
  4. Po próbie zamień w hero „Zaczynamy · 5 min” na „Odblokuj lekcję · 199 zł” (EN „Unlock lesson · 199 zł”) albo pokaż pod hero jedną kartę zakupu. Zostaw jedno „Kup dostęp” w treści, a nie trzy.
  5. Dla `.row.ld-done` ustaw tło i padding karty (`background:var(--surface); padding:16px; border-radius:22px`), żeby tekst nie wypadał z karty.
  6. Test: `open(b,{konto:"proba-koniec"})` → `getComputedStyle(btn).backgroundColor === "rgb(26, 127, 69)"` dla każdego „Kup dostęp”, plakietka widoczna w `innerHeight`.
- **Koszt:** S
- **Wpływ:** konwersja z próby (bezpośrednio)

#### [P1] Licznik próby jest na dole ekranu i zaczyna się od kropki; ostatnie godziny wyglądają tak samo jak dzień 1  ·  *(raport 1)*
- Gdzie: `buyBanner()` `index.html` 7532–7534. Tekst: `zrzuty/03-proba-trwa.txt` („Okres próbny / · zostały 2 dni pełnego dostępu · potem 199 zł…”) i `zrzuty-1/18-proba-ostatnie-godziny-cala.txt` w. 77–78 („· zostały 4 godziny…”), po kafelkach, ok. 1700 px w dół. Pierwszy ekran `18-proba-ostatnie-godziny-ekran1.png` nie mówi o próbie nic.
- Co jest źle: student nie czuje upływu próby. Linia zaczyna się od „·”, bo `<b>` i `<span>` są w siatce `bb-txt` w osobnych wierszach. 4 godziny przed końcem nie widać żadnej różnicy w stosunku do dnia 1.
- Jak robią to najlepsi: oś czasu próby (dzień 1, dzień przypomnienia, dzień końca) jest w centrum paywalla Blinkista ([RevenueCat](https://www.revenuecat.com/blog/engineering/how-to-build-a-blinkist-style-paywall-using-revenuecat-webhooks-and-zapier)).
- Jak poprawić:
  1. Usuń „· ” z początku: `text: \`${sk.trialLeftText?.() || "ostatnie godziny"} pełnego dostępu · potem …\``.
  2. Przenieś pasek próby nad hero (`.zh`) jako pigułkę 1 linii (≤ 44 px): PL „Próba · dzień {d} z 3 · do {pt 17:00}” + link „Plany” / EN „Trial · day {d} of 3 · until {Fri 17:00}” + „Plans”. Dzień licz z `nauka_proby.od` (dodaj `proba_od` do `nauka_ja`) albo z `trialUntil − 3 dni`.
  3. Gdy zostało < 24 h: pigułka w kolorze `--warn-soft`/`--warn` (kontrast AA już jest w palecie) i raz dziennie arkusz (klucz `bm-proba-ost-{dzień}`) z podsumowaniem postępu i dwoma planami (jak w P0-2, nagłówek PL „Zostało {ile} próby” / EN „{left} of your trial left”).
  4. Test: `mock-proba-do` = now + 4 h → pigułka ma klasę `.warn` i jest w `ekran1`. Arkusz pojawia się tylko raz dziennie.
- Koszt: S–M
- Wpływ: konwersja z próby.

#### [P1] Osoba, która może jeszcze włączyć próbę, widzi w kilku miejscach tylko „Kup dostęp”  ·  *(raport 1)*
- Gdzie: `index.html` 20032 („Codziennie dwie lekcje ułożone dla Ciebie są w pełnej wersji. [Kup dostęp]”), 11322 i 11374 („2 lekcje czekają w pełnym dostępie. Kup dostęp”). Oba miejsca wywołują `window.skrot.buy()` mimo `canTrial()`. Tekst `zrzuty/02-darmowe-konto.txt`: „Kup dostęp” trzy razy, „Wypróbuj za darmo” raz, na dole.
- Co jest źle: komunikat „musisz zapłacić” zamiast „masz 3 dni za darmo” obniża chęć kliknięcia. Wygląda też niespójnie (karta na dole mówi co innego).
- Jak poprawić: we wszystkich trzech miejscach użyj istniejącego `trialBtn()` (`index.html` 7490), a „Kup dostęp” tylko jako `.link` obok, gdy `canTrial()`. Tekst przy 20032 dla `canTrial()`: PL „Dwie lekcje dla Ciebie codziennie, w 3 dniach za darmo.” / EN „Two lessons picked for you every day, free for 3 days.”. Test: konto `darmowe` → na Dziś nie ma przycisku „Kup dostęp” bez sąsiedniego „Wypróbuj”.
- Koszt: S
- Wpływ: konwersja gość/darmowe → próba.

#### [P1] W okresie próbnym „Więcej → Konto i dostęp” pokazuje „do końca 2. semestru”, jakby student już kupił  ·  *(raport 1)*
- Gdzie: `index.html` 14497: `PAID() ? \`${sk.email} · ${sk.plan === "miesiac" ? "co miesiąc" : "do końca 2. semestru"}\``. W próbie `PAID()` = true i `plan` = null, więc wpada „do końca 2. semestru”. Zrzut i tekst: `zrzuty-1/20-ustawienia-konto-proba.txt` w. 16–17 („Konto i dostęp / student@x.pl · do końca 2. semestru”).
- Co jest źle: wprowadza w błąd. Student w próbie może pomyśleć, że ma dostęp do lipca (i nie kupić), albo że coś zostało kupione (i się wystraszyć).
- Jak poprawić: zamień na `PAID() ? (sk.trialUntil ? \`${sk.email} · okres próbny, ${sk.trialLeftText?.() || "ostatnie godziny"}\` : …) : …`. EN: dopisz w `i18n-en.js` wzorzec „okres próbny, zostały N dni” → „free trial, N days left” (tak samo jak dla `trialLeftText`). Test: konto `proba` → tekst zawiera „okres próbny”.
- Koszt: S
- Wpływ: zaufanie, konwersja.

#### [P1] Błąd startu próby to ślepa uliczka z jednym przyciskiem „Zamknij”  ·  *(raport 1)*
- Gdzie: `skrot-supabase.js` 1443–1460 (`TRIAL_ERR`, `info("Okres próbny", …)`), zrzut `zrzuty-1/28-proba-blad-urzadzenie.png`.
- Co jest źle: ktoś klika „Zacznij 3 dni za darmo”, wpisuje e-mail, czeka na kod, loguje się i dostaje „Na tym urządzeniu okres próbny został już wykorzystany (także z innego konta)” albo „…już wykorzystany. Pełny dostęp możesz kupić od 35 zł miesięcznie.”. Jedyny przycisk to „Zamknij”. Szczyt intencji kończy się bez drogi dalej. Komunikat o urządzeniu może też dotknąć kogoś, kto po prostu użył telefonu znajomego.
- Jak robią to najlepsi: Blinkist i Duolingo w każdym miejscu decyzji dają jedno jasne następne działanie (oś czasu i plan, źródła w P0-1).
- Jak poprawić:
  1. Zamiast `info` zrób modal z przyciskami: główny „Wybierz plan” → `skrot.buy()`, drugi „Napisz do nas” → `mailto:` z tematem „Okres próbny – {email}”, trzeci „Zamknij”.
  2. Teksty: `wykorzystany` PL „Na tym koncie okres próbny już był. Twoje postępy z próby czekają. Dostęp: 199 zł do 11 lipca 2027 albo 35 zł / mies.” / EN „This account has already had a trial. Your progress from it is waiting. Access: 199 zł until 11 July 2027 or 35 zł / month.”. `urzadzenie` PL „Z tego telefonu ktoś już korzystał z próby. Jeśli to Twój pierwszy raz, napisz do nas, włączymy ją ręcznie.” / EN „A trial was already used on this device. If it’s your first time, write to us and we’ll turn it on manually.”
  3. Test: atrapa `mock-proba-blad=urzadzenie` → modal ma przycisk „Wybierz plan”.
- Koszt: S
- Wpływ: konwersja, zaufanie.

#### [P1] Kierunki „oczekujące” są oznaczone „Dostępne”: próba się spala, a zakup kończy się listą oczekujących  ·  *(raport 1)*
- Gdzie: ekran wyboru kierunku `zrzuty-1/01-pierwsze-wejscie-cala.png` (11 kart „Dostępne · lekcje, fiszki, próbne testy”). Kod: skrypt logowania w `index.html` w. 15–16 (`krok1`, tag „Dostępne” dla każdego `IDS`) i `rocznik.js` 82 (`widoczny`: widoczny jest każdy rocznik znany bazie, także `oczekujacy`). W `roczniki-dane.js` 10 roczników ma `status: "oczekujacy"`. Zakup: `skrot-supabase.js` `rocznikDoKupienia()` → `listaOczekujacych()` („Ten kierunek jeszcze nie ruszył”). Próba nie sprawdza statusu (`skrot-v45` komentarz: „Okres próbny jak dotąd”).
- Co jest źle: student Zarządzania widzi „Dostępne”, włącza próbę (jedną na konto i urządzenie), a gdy chce zapłacić, słyszy, że kierunek „jeszcze nie ruszył”. Wygląda to jak przynęta i niszczy zaufanie na małym rynku, gdzie wszyscy się znają. Tekst przy „Inny kierunek” mówi wprost: „Nie sprzedajemy niczego, czego jeszcze nie ma”, a karty temu przeczą.
- Jak robią to najlepsi: to zasada uczciwego paywalla z przypadku Blinkista: komunikuj dokładnie, co dostaniesz i kiedy ([RevenueCat](https://www.revenuecat.com/blog/growth/how-top-apps-approach-paywalls/)).
- Jak poprawić:
  1. W `rocznik.js` zapisuj w `ustawWBazie` także status (lista `{id, status}` zamiast samych id) i dodaj `status(id)`.
  2. W `krok1` tag: `platny` → „Dostępne” (zielony `.lk-tag`). `oczekujacy` → „Wkrótce” (`.lk-tag.wkr`), a pod nazwą PL „Lekcje w przygotowaniu · zapisz się na start” / EN „Lessons in progress · join the launch list”. Klik w taką kartę prowadzi do `wkrotce()` z tym kierunkiem już wybranym w `<select>`.
  3. Opcjonalnie, jeśli treści już są: przy `oczekujacy` pozwól na podgląd, ale kartę próby na ekranie logowania zastąp tekstem PL „Próba i zakup ruszą, gdy kierunek będzie gotowy” / EN „Trial and purchase open once this programme is ready”.
  4. SQL: w `nauka_proba_start` odrzucaj start, gdy `nauka_moj_rocznik()` nie ma statusu `platny` (kod błędu `rocznik`). Dodaj komunikat do `TRIAL_ERR`: PL „Ten kierunek jeszcze nie ruszył. Zapisz się na listę, a próba poczeka na Ciebie.” / EN „This programme hasn’t launched yet. Join the list and your trial will wait for you.”
  5. Test: `localStorage["skrot-roczniki-baza"]` z ZARZ `oczekujacy` → karta ma tag „Wkrótce”.
- Koszt: M
- Wpływ: zaufanie, konwersja (bez spalonych prób), reputacja.
