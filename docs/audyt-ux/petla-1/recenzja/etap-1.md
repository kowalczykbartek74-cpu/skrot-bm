# Materiał dla recenzenta – pętla UX-1, etap 1

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

## Kryteria etapu 1
**Etap 1 – Pierwszy ekran i jedna ścieżka do próby** (znaleziska C1)
- K1: konto `brak` na 360×640, 390×844 i 1280×900: `scrollY === 0` po 3 s, CLS < 0,1 (pomiar `PerformanceObserver('layout-shift')`), nagłówek i „Zacznij 3 dni za darmo” w pierwszym ekranie.
- K2: na ekranie logowania jest dokładnie jeden przycisk w stylu głównym (próba); „Wyślij kod” jest drugorzędny.
- K3: konto `darmowe` z możliwością próby, wejście z pełnego ekranu logowania → arkusz „Włączyć teraz 3 dni pełnego dostępu?”; „Tak” → próba i powitanie; bez znacznika → pasek „Masz jeszcze 3 dni za darmo · Włącz” w pierwszym ekranie Dziś.
- K4: Staś (SVG) na ekranie logowania, promienie i przyciski jak H2, ciemny wariant przy `prefers-color-scheme: dark`, ikona SVG `play` zamiast 👀. Nowy CSS logowania w `ux-wejscie.css`; w linii 1 `index.html` zmieniasz tylko to, co musi być w HTML (A4c).
- K5: przy błędzie limitu z `signInWithOtp` komunikat „Teraz loguje się dużo osób naraz…”, po 60 s bez kodu notka o spamie i aktywne „Wyślij ponownie” (atrapa).
- K6: po kodzie w trybie próby przycisk „Zacznij 3 dni za darmo”; poprawione teksty EN z C1.

## Zasady wyglądu i dostępności (A4 pkt 6–7)
6. **Wygląd:** paleta z `PALETA.md` i H2 (`--h-*`, #F4F5F0, #10231A, #3E5046, #1A7F45, #CDF25E, #DDE7D8, #EDF1EA, `--bad`, `--warn`), bez nowych kolorów. Kontrast WCAG AA każdego tekstu (mierz jak `dzis-review.mjs`), cele dotyku ≥ 44×44 px (mierz faktyczne pole, nie próg axe 24 px), nowy tekst ≥ 12 px, zero poziomego przewijania przy 360 i 375 px, sprawdzaj też 1280 px, jasny i ciemny zielony (`html[data-green=dark]`). Ikony według A4c, **bez emoji jako ikon** w nowym kodzie. Każdy ruch wyłączany przez `prefers-reduced-motion` **i** `html.calm`.
7. **Telefon pierwszy.** Główne akcje w zasięgu kciuka (dół ekranu), jeden główny przycisk na ekran.

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

## Pełne znaleziska audytu dla etapu 1 (C1)
Poniżej znaleziska skopiowane bez zmian z raportów audytorów (`claude/audyt-ux-raport-1…5.md` w projekcie claude.ai „szkoła app”). Są pogrupowane według etapów. Mają gotowe teksty PL/EN, miejsca w kodzie (numery linii z `main` z 16.11.2026; jeśli się przesunęły, szukaj po nazwie funkcji) i testy. Ścieżki zrzutów audytorów (`/home/claude/audyt-ux/...`) nie istnieją na Twoim komputerze: odtwórz stan sam na atrapie. Treści z atrapy („Quiz pochodne 10?”, „Dobra/Zła”) to dane testowe. Gdy znalezisko przeczy decyzji z B1 albo podziałowi z B3, wygrywa B1/B3.


### C1 · Etap 1: pierwszy ekran i jedna ścieżka

#### [P0] Nowa osoba, która użyje widocznego formularza logowania, dostaje konto bez próby, a przycisk próby ląduje ok. 1400 px niżej  ·  *(raport 1)*
- Gdzie: ekran logowania `zrzuty/01-logowanie-gosc-cala.png`. Pod kartą próby jest „Zaloguj się · Nie masz jeszcze konta? Założy się samo. · Wyślij kod” (`skrot-supabase.js` 1120–1131). Próba włącza się tylko wtedy, gdy ustawiony jest znacznik `skrot-trial` (`afterReady` 1515). Zalogowany bez próby: `zrzuty/02-darmowe-konto-ekran1.png` (pierwszy ekran bez słowa o próbie). Karta „3 dni za darmo” jest na samym dole (`02-darmowe-konto-cala.png`), a „Kup dostęp” w nagłówku jest ukryte na Dziś (`index.html` 6074: `view !== "home"`).
- Co jest źle: na ekranie wejścia są dwa duże zielone przyciski i pole e-mail. Wielu studentów wpisze adres w pierwsze widoczne pole, zwłaszcza że tekst mówi „Nie masz jeszcze konta? Założy się samo”. Takie osoby przechodzą do stanu „darmowe”: próba niewłączona, na pierwszym ekranie zwykła lekcja, a o próbie dowiedzą się dopiero przy kłódce. Część z nich uzna, że „to jest ta darmowa wersja”, i odejdzie.
- Jak robią to najlepsi: Duolingo nie dzieli wejścia na „zaloguj” i „zacznij”. Nowa osoba idzie jedną ścieżką (cel → poziom → lekcja), a rejestracja pojawia się w logicznym momencie ([Appcues GoodUX: Duolingo onboarding](https://goodux.appcues.com/blog/duolingo-user-onboarding)). RevenueCat (State of Subscription Apps 2025) cytuje, że 80–90% startów prób to dzień instalacji, więc okazja jest jedna ([RevenueCat SOSA 2025](https://www.revenuecat.com/state-of-subscription-apps-2025)). To dane o próbach w sklepach z aplikacjami, ale wniosek „pierwsza sesja decyduje” pasuje i tutaj.
- Jak poprawić:
  1. W `afterReady` (`skrot-supabase.js` ok. 1515) dodaj przed `skrot-buy`: `if (skrot.state === "in" && !skrot.paid && skrot.trialCan && ls.get("skrot-z-logowania") && !ls.get("skrot-proba-zapytano")) { ls.set("skrot-proba-zapytano", "1"); return trialOffer(); }`. Znacznik `skrot-z-logowania` ustawiaj w kroku kodu, gdy logowanie przyszło z pełnego ekranu `#login` (`page === true`).
  2. `trialOffer()` to arkusz (ten sam `modal` co `info`):
     - h2 PL „Włączyć teraz 3 dni pełnego dostępu?” / EN „Start your 3 days of full access now?”
     - tekst PL „Bez karty i bez płatności. Po 3 dniach nic się samo nie pobiera.” / EN „No card, no payment. Nothing is charged after 3 days.”
     - przycisk główny PL „Tak, zaczynam 3 dni” / EN „Yes, start 3 days”, który wywołuje `skrot.startTrial()`
     - drugi przycisk PL „Później, zostawię na kolokwium” / EN „Later, I’ll save it for a test”, który zamyka arkusz
  3. Dla stanu `darmowe` z `trialCan` dodaj na górze Dziś, nad hero, pasek `buybar` (ten sam komponent co w `buyBanner`, wysokość ≤ 56 px): PL „Masz jeszcze 3 dni za darmo · Włącz” / EN „You still have 3 free days · Start”. W `index.html` 6074 pokaż w nagłówku przycisk także na Dziś, ale dla `canTrial()` z tekstem „Wypróbuj” zamiast „Kup dostęp”.
  4. Na ekranie logowania zmień `orLogin` na mniej konkurujący: nagłówek „Zaloguj się” jako `h3` 18 px, przycisk „Wyślij kod” jako `.btn` (biały z obramowaniem), a nie `.primary`. Jedynym zielonym przyciskiem na ekranie zostaje „Zacznij 3 dni za darmo”.
  5. Test Playwright: konto `darmowe` + `skrot-z-logowania=1` → arkusz z „Włączyć teraz 3 dni”. Klik „Tak” → `mock-konto` = `proba` i powitanie próby. Konto `darmowe` bez znacznika → na `ekran1` widać „Masz jeszcze 3 dni za darmo”.
- Koszt: S–M
- Wpływ: konwersja gość → próba (bezpośrednio), konwersja próba → płatność (więcej prób).

#### [P0] Pierwszy ekran logowania zaczyna się od połowy strony i skacze (CLS 0,245)  ·  *(raport 4)*
- **Gdzie:** gość, `01-logowanie-gosc-ekran1.png` (widać ucięte „Potem, jeśli zechcesz…”, bez logo i nagłówka). Dla porównania `zrzuty-4/390-login-gora.png` i `360-login.png` (wymuszone `scrollTo(0,0)`). Kod: `skrot-supabase.js:1134` `setTimeout(() => input.focus(), 30)` (także 1089). Skok układu: `#loginBox` startuje z „Ładowanie…” (`index.html:1`, `<div id="loginBox">`), po czym `.lg-demo` i `.lg-foot` przesuwają się o 377 i 740 px (`zrzuty-4/tmp/cls.mjs`: wpisy 0,012 + 0,233).
- **Co jest źle:** Zmierzone `scrollY = 443`, aktywny element `#skrot-login-email`. Nowy student z linku od starosty nie widzi hasła „Mniej szukania. Więcej zdanych zaliczeń.”, listy korzyści ani zielonego „Zacznij 3 dni za darmo”. Widzi formularz logowania, czyli komunikat „masz już konto”. Na Androidzie fokus może też otworzyć klawiaturę. CLS 0,245 to próg „poor” (dobry: ≤ 0,1).
- **Jak robią to najlepsi:** web.dev: „pages should maintain a CLS of 0.1 or less” ([web.dev/articles/vitals](https://web.dev/articles/vitals)). Apple HIG zaleca proste, przewidywalne interakcje („Keep actions simple and intuitive”, [HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)).
- **Jak poprawić:**
  1. W `skrot-supabase.js:1134` i `1089` ustaw fokus tylko wtedy, gdy formularz otworzył użytkownik kliknięciem (np. „Mam już konto”) albo gdy jest okno, a nie pełna strona: `if (!page || userOpened) input.focus({ preventScroll: true })`. Na pełnej stronie logowania bez kliknięcia nie ustawiaj fokusu wcale.
  2. W statycznym HTML w `index.html:1` zamień `<p>Ładowanie…</p>` w `#loginBox` na szkielet o wysokości gotowego formularza: `#login #loginBox{min-height:420px}` na telefonie (zmierz wysokość gotowego `#loginBox` i wpisz ją). Albo wyrenderuj kartę próby i formularz od razu w HTML.
  3. Test: `open(b,{konto:"brak"})` → `scrollY === 0` po 3 s, suma `layout-shift` < 0,1 (skrypt `zrzuty-4/tmp/cls.mjs`).
- **Koszt:** S
- **Wpływ:** pierwsze wrażenie, konwersja wejście → próba

#### [P2] Logowanie: inny system niż aplikacja i brak Stasia na pierwszym ekranie  ·  *(raport 4)*
> **Uwaga organizatora:** „Wyślij kod” drugorzędny i Staś na logowaniu robisz Ty; ciemny wariant przez prefers-color-scheme.
- **Gdzie:** `01-logowanie-gosc-cala.png`, `zrzuty-4/390-login-gora.png`, `1280-login.png`, `en-login.png`. Własny CSS logowania w `index.html:1` (`#login .btn{border-radius:10px}`, `.lg-demo-btn` 10 px, „👀”).
- **Co jest źle:** Pierwszy ekran nie pokazuje postaci, która potem prowadzi przez całą aplikację. Promienie 10 px i płaskie pola kontrastują z kartami 22 px i 3D zaraz po wejściu. Na górze stoją dwa równie mocne zielone przyciski („Zacznij 3 dni za darmo” i „Wyślij kod”). Ekran jest zawsze jasny, więc student z ciemnym motywem systemu dostaje w nocy biały ekran.
- **Jak robią to najlepsi:** postać od pierwszego kontaktu i w całym doświadczeniu: „Wouldn't it be cool if you encountered the same people through the entire experience?” ([Apple, Behind the Design: Duolingo](https://developer.apple.com/news/?id=jhkvppla)).
- **Jak poprawić:** Staś (SVG, 72 px, macha) obok nagłówka „Mniej szukania…”. „Wyślij kod” jako przycisk drugorzędny (biały z obrysem 2 px), gdy widoczna jest karta próby. Promienie 14 px. „👀” zamień na SVG `eye`. Ciemny wariant logowania przez `@media (prefers-color-scheme: dark)` z tymi samymi zmiennymi co `data-green="dark"`.
- **Koszt:** M
- **Wpływ:** pierwsze wrażenie

#### [P2] Emoji 👀 w przycisku przykładowej lekcji i dwie zielone akcje na jednym ekranie  ·  *(raport 1)*
- Gdzie: `#login .lg-demo-btn` (HTML logowania, `index.html` w. 1), zrzut `01-logowanie-gosc-cala.png`.
- Jak poprawić: ikona SVG (play, 20 px, `currentColor`) zamiast emoji (zasada H2). Przycisk przenieś nad formularz (P1-5). Formularz logowania w wersji drugorzędnej (P0-4, punkt 4).
- Koszt: S
- Wpływ: przejrzystość pierwszego ekranu.

#### [P2] Kod z maila w trybie próby: przycisk „Zaloguj się” zamiast „Zacznij 3 dni”  ·  *(raport 1)*
- Gdzie: `zrzuty-1/05-kod-z-maila.png`, `skrot-supabase.js` ok. 1032–1040 (krok kodu).
- Jak poprawić: gdy `trialOn()`, tekst przycisku PL „Zacznij 3 dni za darmo” / EN „Start 3 free days”. Notkę „Po wpisaniu kodu od razu włączy się…” zostaw.
- Koszt: S
- Wpływ: konwersja (spójna obietnica do końca).

#### [P2] Teksty EN na ekranie wejścia  ·  *(raport 1)*
- Gdzie: `zrzuty-1/09-login-en-cala.png`: „Mock tests before each test”, „Your group’s exam dates”, „Code from the email”.
- Jak poprawić (w `i18n-en.js`): „Practice tests before every midterm”, „Your group’s test and exam dates”, zakładka „Email code”. Na kartach kierunków EN „practice tests” jest dobrze, więc ujednolić do „practice tests”.
- Koszt: S
- Wpływ: spójność PL/EN, zaufanie studentów EN.

#### [P0] Limity maili i weryfikacji kodu mogą zablokować wejście na starcie sprzedaży  ·  *(raport 1)*
> **Uwaga organizatora:** punkty 1–2 (płatny Resend, limity w panelu Supabase) robi Bartek; Ty robisz punkty 3–5.
- Gdzie: `README.md` w. 74 („Maile logowania: Resend (SMTP)”), `supabase/skrot-v36-przypomnienia.sql` w. 18–19 i 62–64 („Resend Free: 100 maili na dobę UTC razem z mailami logowania”, `limit_dzien: 60`). Logowanie wyłącznie kodem z maila: `skrot-supabase.js` ok. 1000–1130. Zrzut `zrzuty-1/05-kod-z-maila.png` („Mail może przyjść z opóźnieniem, zajrzyj też do spamu”).
- Co jest źle: sprzedaż idzie przez starostę i grupę roku, więc 100–300 osób wchodzi w ciągu jednego dnia, często z jednej sali. Plan Free Resend to 100 maili na dobę, a przypomnienia mogą zająć z tej puli do 60. Po wyczerpaniu kody po prostu nie przychodzą, a student widzi tylko „zajrzyj do spamu”. Do tego Supabase ogranicza weryfikację kodu (`/auth/v1/verify`) do 30 żądań na 5 minut z jednego IP. Na uczelnianym Wi-Fi (wspólny NAT) większa grupa wpisująca kody w przerwie może dostawać błędy. To psuje pierwsze wrażenie w najgorszym możliwym momencie.
- Jak robią to najlepsi: nie dotyczy konkretnej apki, to fakty z dokumentacji. Resend Free: „100 emails a day”, „3,000 emails / mo” ([Resend pricing](https://resend.com/pricing)). Supabase: limit maili przy własnym SMTP jest konfigurowalny, a weryfikacja „Defaults to 30 requests per 5 minutes” na IP ([Supabase Auth rate limits](https://supabase.com/docs/guides/auth/rate-limits)).
- Jak poprawić:
  1. **Przed każdym ogłoszeniem na grupie** przejdź na płatny plan Resend (sprawdź aktualną cenę na stronie) i podnieś `limit_dzien` w `nauka_przypomnienia_cfg` zgodnie z komentarzem w v36 (w. 63).
  2. W Supabase → Authentication → Rate Limits sprawdź i podnieś: „Rate limit for sending emails” (przy własnym SMTP) i „Rate limit for verifications” (np. do 150 na 5 minut), żeby jedna sala na jednym IP przeszła.
  3. Na ekranie kodu (`skrot-supabase.js`, krok kodu ok. 1032–1045) dodaj po 60 s, gdy kod nie został wpisany, notkę: PL „Kod nie dochodzi? Sprawdź folder Oferty/Spam albo wpisz inny adres (np. prywatny Gmail).” / EN „No code? Check Promotions/Spam or use another address (e.g. a personal Gmail).”. Dodaj też przycisk „Wyślij ponownie” aktywny po 60 s (limit Supabase na osobę).
  4. Gdy `signInWithOtp` zwróci błąd z „rate limit”, pokaż PL „Teraz loguje się dużo osób naraz. Spróbuj za 2–3 minuty.” / EN „Lots of people are logging in right now. Try again in 2–3 minutes.” zamiast ogólnego błędu.
  5. Test: w atrapie `signInWithOtp` zwraca `{ error: { message: "email rate limit exceeded" } }` → widać nowy komunikat.
- Koszt: S (konfiguracja) + S (teksty)
- Wpływ: pierwsze wrażenie, konwersja (bez kodu nie ma próby), zaufanie.
