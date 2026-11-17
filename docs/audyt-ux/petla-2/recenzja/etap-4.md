# Materiał dla recenzenta · UX-2 etap 4

## Kryteria etapu
**Etap 4 – Kanał poza stroną** (C4)
- K1: `ZD_NAWYK.ofertaPrzypomnienia()` zwraca kartę „Przypomnieć Ci jutro o {godz}?” tylko przy warunkach z C4 (zalogowany, pełny dostęp lub próba, przypomnienia wyłączone, brak „Nie teraz” dziś, pierwsza skończona karta dnia); „Tak” włącza przypomnienia z godziną z planu.
- K2: `przypHomeCard` pokazuje się też bez terminu ≤ 14 dni, po ≥ 1 dniu nauki, raz na 30 dni.
- K3: rodzaj maila „seria” (seria ≥ 3, wczoraj nauka, dziś nie) w 3 wariantach PL/EN, wybór wariantu nieużytego w ostatnich 3 mailach, `wariant` zapisany w historii; testy w `tests/`.
- K4: kalendarz `.ics`: opcjonalny wpis „Zdawalni · 5 min po zajęciach” z `VALARM` (przełącznik w oknie kalendarza w telefonie, domyślnie wyłączony). Teksty „Skrót BM” → „Zdawalni” w funkcji `kalendarz` i w jednorazowym `.ics` (`index.html` ok. 7037). Złoty plik `tests/fixtures/kalendarz-bm.ics` wygeneruj na nowo: różnica (`diff`) ze starym ma dotyczyć **tylko** linii z nazwą (`PRODID`, `X-WR-CALNAME`, opisy z nazwą); wszystkie `UID` bez zmian. Różnicę wklej do raportu rundy.
- K5: `sw.js` obsługuje **tylko** zapytania GET z tej samej domeny (nigdy Supabase, Stripe, `plan.zdawalni.pl`, inne domeny ani POST): sieć najpierw dla HTML i JS z `?v=`, pamięć podręczna dla ikon i fontów. Rejestracja na https albo na `localhost`/`127.0.0.1` (żeby dało się testować). Ma wyłącznik: stała wersji w `sw.js`, przy zmianie stare pamięci są kasowane, a `?sw=off` wyrejestrowuje. Testy: po pierwszym wejściu Dziś renderuje się offline (Playwright `context.setOffline(true)`); nowe `?v=` wymienia plik w pamięci; zapytania do Supabase (atrapa) nie trafiają do pamięci. Zachęta „Dodaj Zdawalni do ekranu głównego” raz, w 2. dniu nauki (Android: `beforeinstallprompt`, iPhone: 2 kroki), „Nie teraz” na 30 dni.

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
### C4 · Etap 4: kanał poza stroną

#### [P0] Poza stroną nic nie przywołuje studenta, zwłaszcza w 3-dniowym okresie próbnym  ·  *(raport 2)*
> **Uwaga organizatora:** punkt 4 (mail w okresie próbnym) robi pętla 1; punkt 1 budujesz jako `ZD_NAWYK.ofertaPrzypomnienia()`, wstawia go pętla 3 na ekranie końca.
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

#### [P1] Przypomnienia nie mają rodzaju „ratuj serię”, a ton „bez nękania” wyłącza najskuteczniejszy bodziec  ·  *(raport 2)*
- **Gdzie:** `przypomnienia.js` `wybierz()`: kolejność termin → powrót (≥4 dni) → powtórki → zadanie. Nie ma rodzaju opartego na serii. `stanZ()` nie przesyła serii.
- **Co jest źle:**
  - Najprostszy i najmocniejszy powód, żeby wejść dziś wieczorem („masz 9 dni z rzędu, 5 minut wystarczy”), nie istnieje w mailu.
  - Dni 2–3 po przerwie (zanim zadziała „powrót” po 4 dniach) nie mają osobnego tekstu. Dostają ogólne „Na dziś: 12 powtórek” albo nic.
  - Dobre zasady dławienia (po 3 zignorowanych co drugi dzień, po 7 raz w tygodniu) są, ale nie ma rotacji szablonów. Każdy mail danego rodzaju jest identyczny, a to ten sam problem „novelty decay”, który rozwiązuje bandyta Duolingo.
- **Jak robią to najlepsi:**
  - Powiadomienie ratujące serię było pierwszym dużym zwycięstwem zespołu retencji Duolingo ([Lenny’s Newsletter](https://lennysnewsletter.com/p/how-duolingo-reignited-user-growth)).
  - Szablony przypomnień mają własne warunki, np. „seria co najmniej 3 dni”, a te niedawno użyte dostają karę za powtarzalność ([Yancey i Settles, KDD 2020](https://research.duolingo.com/papers/yancey.kdd20.pdf)).
- **Jak poprawić:**
  1. W `stanZ()` dodaj `ser: { n, d }` (z `S.progress.streak`). W `kontekst()` przenieś to pole do `ctx.seria`.
  2. W `wybierz()` po bloku `termin` dodaj rodzaj `seria`, gdy `ctx.seria.n >= 3 && ctx.seria.d === dayN(dzis) - 1` (seria żyje, dziś brak nauki). Teksty bez poczucia winy, 3 warianty:
     - PL A: tytuł „{n} dni z rzędu. Dziś 5 minut?”, treść „Masz serię {n} dni w Zdawalni. Pięć minut dziś i jutro będzie {n+1}.”
     - PL B: tytuł „Seria {n} dni czeka na dziś”, treść „Wystarczy jedna karta 5 minut, żeby seria została.”
     - PL C: tytuł „Na dziś: 5 minut i seria {n+1}”, treść „Jedna krótka karta i masz to z głowy.”
     - EN A: „{n}-day streak. 5 minutes today?” / „You're on a {n}-day streak in Zdawalni. Five minutes today and tomorrow it's {n+1}.”
     - EN B: „Your {n}-day streak is waiting” / „One 5-minute card keeps it going.”
     - EN C: „Today: 5 minutes and a {n+1}-day streak” / „One short card and you're done.”
     - CTA PL „5 minut teraz” / EN „5 minutes now”, `path: "#/"`.
  3. **Rotacja bez uczenia maszynowego.** Wariant = pierwszy z A/B/C, którego nie użyto w ostatnich 3 wysłanych mailach tego rodzaju (historia jest w `row.historia`, dodaj do niej `wariant`). Zapisuj `wariant` w logu, żeby po kilku tygodniach porównać „helped” między wariantami. Przy 100–300 osobach wystarczy prosty licznik, bandyta nie ma sensu.
  4. Z rodzaju „powrót” zostaw ≥4 dni. Rodzaj „seria” obejmuje dzień, w którym seria jeszcze żyje.
  5. **Test** w `tests/` (wzór istniejących testów `przypomnienia`): ctx z `seria {n:9, d: wczoraj}` i bez terminów daje `kind: "seria"`. Trzy kolejne dni dają warianty A, B, C. `studiedToday` daje `null`.
- **Koszt:** S
- **Wpływ:** retencja D7/D30

#### [P1] PWA bez service workera i bez zachęty do dodania na ekran główny  ·  *(raport 2)*
- **Gdzie:** `manifest.webmanifest` (`display: standalone`, ikony 192/512/maskable: dobrze). Brak `sw.js`. W `index.html` nie ma `beforeinstallprompt` ani instrukcji dla iOS. W Ustawieniach (zrzut 22) nic o aplikacji na telefonie.
- **Co jest źle:**
  - Student wraca przez przeglądarkę i zakładkę albo link z grupy roku. Ikona na ekranie głównym to codzienny wyzwalacz zewnętrzny, a tu nikt nie prosi o jej dodanie.
  - Bez service workera nie ma web push (iOS wymaga aplikacji z ekranu głównego). Nie działa też start bez sieci: ekran Dziś w tramwaju bez zasięgu jest pusty, choć jest tryb „Jestem w drodze”.
- **Jak robią to najlepsi:** WebKit: web push na iOS/iPadOS 16.4+ dla aplikacji z ekranu głównego, zgoda tylko po geście użytkownika, standardowe Push API, Notifications API i Service Workers ([WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)).
- **Jak poprawić:**
  1. **`sw.js` (S, bez push).** Cache „network-first” dla `index.html` i plików `*.js` (wersja z `?v=`), „cache-first” dla `icons/` i fontów. Rejestracja w `index.html` po `load`, tylko gdy `location.protocol === "https:"`. Sprawdź CSP: `worker-src 'self'` już jest.
  2. **Zachęta do instalacji.** Na ekranie końca drugiego dnia nauki (`streak.n === 2`), raz:
     - karta PL „Dodaj Zdawalni do ekranu głównego: jedno dotknięcie do 5 minut.” / EN „Add Zdawalni to your home screen: one tap to your 5 minutes.”;
     - Android/Chrome: przycisk „Dodaj” wywołuje zapamiętany `beforeinstallprompt.prompt()`;
     - iOS (`/iPhone|iPad/.test(navigator.userAgent) && !navigator.standalone`): 2 kroki z ikoną „Udostępnij” → „Do ekranu początkowego”;
     - „Nie teraz” ukrywa na 30 dni.
  3. **Push (L):** patrz P0 o kanale powrotu, krok 6.
  4. **Test:** Lighthouse „Installable” = tak. W trybie offline po pierwszym wejściu Dziś się renderuje z ostatniego stanu.
- **Koszt:** M (bez push)
- **Wpływ:** retencja D7/D30

#### [P2] W kalendarzu w telefonie wydarzenia mówią „Skrót BM”  ·  *(raport 2)*
- **Gdzie:** `supabase/functions/kalendarz/index.ts`: opisy „Szczegóły w Skrócie BM”, „Twój wpis w Skrócie BM”, „Data wpisana przez Ciebie w Skrócie BM”. Także jednorazowe .ics (`PRODID:-//Skrot BM//`, l. 7037 index.html).
- **Co jest źle:** kalendarz w telefonie to jedyny kanał, który student widzi codziennie poza stroną, a pokazuje starą nazwę. Słabnie skojarzenie z marką i zaufanie.
- **Jak poprawić:** zamień teksty na „Zdawalni”. UID-y `@skrotbm.pl` zostaw: zmiana UID zdubluje wydarzenia w subskrybowanych kalendarzach.
- **Koszt:** S
- **Wpływ:** zaufanie
