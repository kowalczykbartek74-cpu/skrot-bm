# Dla recenzenta pętli UX-4 – część wspólna

Oceniasz tylko to, co widzisz na zrzutach i w raportach/testach. Bądź surowy, porównuj z Duolingo, Headspace, Brilliant.

### B1. Decyzje przyjęte domyślnie
Bartek może je zmienić przed startem (edytując ten plik). Jeśli nic nie zmienił, przyjmij je jak niżej i zapisz w `PROGRESS.md`.

- **D12 Krój nagłówków:** Bricolage Grotesque **700** na wszystkich `h1`, `h2` i nagłówkach sekcji w całej aplikacji (zgodnie ze specyfikacją H), Plus Jakarta Sans na tekst. Ładujesz z repo grubości, które kod faktycznie używa (sprawdź `grep -o 'font-weight: *[0-9]*'` i skróty `font:`): Plus Jakarta Sans 400/500/600/700/800 i Bricolage 600/700 (latin + latin-ext). Ograniczenie liczby grubości to dopiero etap B (W5). Jeśli recenzent uzna, że Bricolage wszędzie psuje czytelność, wariant awaryjny: usuń Bricolage i zostaw Plus Jakarta 800 na nagłówkach (zapisz w PROGRESS).
- **Skala tekstu:** 12 / 14 / 16 / 18 / 22 / 28 / 36 px; minimum 12 px (poza `#skrot-wm`).
- **Cele dotyku:** poszerzanie pola przez `::after` bez zmiany wyglądu tam, gdzie powiększenie psuje układ.
- **Znak wodny:** zostaje (ochrona przed udostępnianiem konta), tylko przeniesiony w margines; krycie 0,14 na telefonie.
- **Etap B, tokeny:** promienie 10 / 14 / 22 / 999, cienie `--sh-card`, `--sh-3d`, `--sh-pop`, 3 warianty przycisku × 2 rozmiary + `primary-hero` (limonka na Dziś).

## Zasady wyglądu
6. **Wygląd:** paleta z `PALETA.md` i H2 (`--h-*`, #F4F5F0, #10231A, #3E5046, #1A7F45, #CDF25E, #DDE7D8, #EDF1EA, `--bad`, `--warn`), bez nowych kolorów. Kontrast WCAG AA każdego tekstu (mierz jak `dzis-review.mjs`), cele dotyku ≥ 44×44 px (mierz faktyczne pole, nie próg axe 24 px), nowy tekst ≥ 12 px, zero poziomego przewijania przy 360 i 375 px, sprawdzaj też 1280 px, jasny i ciemny zielony (`html[data-green=dark]`). Ikony według A4c, **bez emoji jako ikon** w nowym kodzie. Każdy ruch wyłączany przez `prefers-reduced-motion` **i** `html.calm`.
7. **Telefon pierwszy.** Główne akcje w zasięgu kciuka (dół ekranu), jeden główny przycisk na ekran.

### A4d. Ikony i paleta (wspólne dla wszystkich pętli)
**Paleta** = zmienne z bloku H2 w `index.html` (ok. 4430–4442): jasny `--h-paper #F7F8F4`, `--h-card #FFFFFF`, `--h-line #E1E8DD`, `--h-edge #BFCBBA`, `--h-ink #10231A`, `--h-muted #3E5046`, `--h-acc #1A7F45`, `--h-acc-edge #0F5A2F`, `--h-acc-soft #DDF3D0`, `--h-lime #CDF25E`, `--h-lime-edge #8FB52A`, `--h-orange #B35400`, `--h-orange-soft #FFE8CC`, `--h-blue #1C6FB8`, `--h-blue-soft #E3F0FD`, `--h-red #A3261E`, `--h-red-soft #FDE4E1`; ciemny zielony (`html[data-green=dark]`) ma własne wartości tych samych zmiennych. Do tego panel Stasia `#133B2A` / `#1D4A36` i kolory monety z istniejącej ikony `coin` (`#FFC83D`, `#E0A20F`). Używaj **zmiennych**, nie wpisuj kolorów na sztywno. `PALETA.md` jest nieaktualna (opis sprzed H2) – źródłem prawdy jest ten blok.
**Ikony interfejsu:** SVG, `viewBox="0 0 24 24"`, `fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"`, rozmiar przez CSS (16–24 px). Istniejące `coin`, `flame`, `miecze` i płaskie dwukolorowe ikony gier (`frun`, `pary`, `przejdz`, `drabina`, `haslo`, `gry`) **zostają bez zmian**: to wyjątek marki, a nie kolor spoza palety. Wspólne nazwy (każda pętla, która ich potrzebuje, kopiuje **dokładnie** te rysunki):
```js
const IKONY_WSPOLNE = {
  bolt:   '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  book:   '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 21.5V4.5"/>',
  bulb:   '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>',
  check:  '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.6 2.6L16 9.5"/>',
  cross:  '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
  retry:  '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  skip:   '<path d="M5 5l9 7-9 7z"/><path d="M18 5v14"/>',
  warn:   '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
  eye:    '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  ticket: '<path d="M3 8a2 2 0 0 0 0 4v4h18v-4a2 2 0 0 0 0-4V4H3z"/><path d="M13 4v16" stroke-dasharray="2 2"/>',
  help:   '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01"/>',
  lock:   '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  play:   '<circle cx="12" cy="12" r="9"/><path d="M10 8.5l5.5 3.5-5.5 3.5z"/>',
  snow:   '<path d="M12 2v20M4.9 6.5l14.2 11M19.1 6.5L4.9 17.5"/><path d="M9.5 3.5L12 6l2.5-2.5M9.5 20.5L12 18l2.5 2.5"/>',
  share:  '<path d="M12 3v12M7.5 7.5L12 3l4.5 4.5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>'
};
// użycie: H2_ICO.bolt = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IKONY_WSPOLNE.bolt}</svg>`;
```
Nowe ikony spoza listy rysujesz w tym samym stylu, z nazwą z prefiksem pętli (`ux3-…`), żeby nie zderzyć się z inną pętlą. **Gdzie znalezisko w sekcji C proponuje emoji w tekście albo ikonie (🧊, 🅰️, 🔥, ⚡, 👏, 🎯, 🌱 i inne) albo „płaskie dwukolorowe” ikony interfejsu, użyj SVG z tej listy albo w tym stylu.** Emoji zostają tylko w treściach pisanych przez ludzi.

**Twarde błędy (każdy obniża ocenę do maks. 5). Liczą się tylko dla elementów nowych albo zmienionych w tej pętli** (sprawdza je recenzent na podstawie zrzutów, testów i części automatycznej raportu). Błąd, który istniał już na `main` w nie Twoim obszarze, nie blokuje etapu: zapisz go w `uwagi-dla-innych.md`. **Lista:** tekst poniżej AA; poziome przewijanie przy 360/375 px; błędy konsoli; nowy tekst bez EN; kolor spoza palety; emoji jako ikona w nowym kodzie; ruch niewyłączany przez reduced-motion lub `html.calm`; czerwony test (nowy lub istniejący); zmieniona kolejność albo treść pytań quizu; zapis do produkcji; zmiana w miejscu kodu należącym do innej pętli (lista w B3); cel dotyku < 44 px w nowym elemencie; `undefined`/`null` widoczne na ekranie.

### Tabela ocen recenzenta (razem 10, ta sama dla każdego etapu tej pętli)
| Kryterium | Punkty |
|---|---|
| Spójność wizualna między ekranami (krój, rozmiary, kształty, ikony) | 3 |
| Czytelność i hierarchia (co najważniejsze widać w 1 s) | 2 |
| Dostępność: kontrast AA, pole dotyku ≥ 44 px, tekst ≥ 12 px | 2 |
| Jakość wykonania: brak ucięć, skoków, artefaktów, nachodzenia; szybkość | 2 |
| Ruch i dopracowanie (hover, wejścia, calm/reduced-motion) | 1 |

Do tego twarde błędy z A5 i lista kryteriów etapu (każde kryterium musi być spełnione, żeby zaliczyć).

### B3. Kto co robi (podział na 5 pętli – ten sam we wszystkich plikach)
Zmieniasz tylko miejsca swojej pętli. Gdy coś z cudzego obszaru jest konieczne, dopisz małe wywołanie z zabezpieczeniem (`window.ZD_X?.fn?.()`) albo zapisz to w `uwagi-dla-innych.md`.

| Pętla | Gałąź / katalog / port | Własny plik | Miejsca w kodzie (właściciel) | SQL |
|---|---|---|---|---|
| **1 Wejście i zakup** | `ux/1-wejscie` · `~/zdawalni/ux-1` · 8811 | `ux-wejscie.js` | `#login`, `.lg-*`, `#loginBox`, ekran wyboru kierunku, logowanie i okres próbny w `skrot-supabase.js` (`emailStep`, krok kodu, `startTrial`, `TRIAL_ERR`, `choosePlan`, `goPay`, `manage`, `refreshMe`, `afterReady`), `showWelcome`, `tryStart`, `buyBanner`, `paywallCard`, `trialBtn`, `openAccount`, tekst konta w Ustawieniach, reguła CSS szarego `.btn` na Dziś (index.html ok. 5113–5117), `skrotPokaz`, rodzaj maila „próba” w funkcji `przypomnienia`, `supabase/functions/stripe-webhook`, CSS i HTML logowania w linii 1 (tylko blok `#login`; nowy CSS logowania w `ux-wejscie.css`). Wyjątek: w 3 miejscach z „Kup dostęp” na Dziś (`index.html` ok. 20032 w `ldBlock`, 11322 i 11374 w `ptsHome`/`ptsDzis`) podmieniasz **tylko wyrażenie tworzące przycisk** na `window.ZD_WEJSCIE?.przyciskZakupu?.('…') ?? <stary przycisk>` z komentarzem `// ux-1` | v52–v54 |
| **2 Nawyk i powroty** | `ux/2-nawyk` · `~/zdawalni/ux-2` · 8812 | `nawyk.js` | `viewHome` (kolejność bloków Dziś i nowe karty), `lpLevelBar` (pigułka serii), `streakNext`, `kStreakAlive`, `kFreezeUse`, `xpFlush` (tylko część serii), `LP_DAILY_GOAL`, `przypHomeCard`, `przypomnienia.js` i funkcja `przypomnienia` (poza rodzajem „próba”), `supabase/functions/kalendarz`, `lekcja-dnia.js` (`trybDnia`), `ptsDzis`/`ptsHome` (tempo, terminy bez daty; bez wyrażeń przycisku zakupu z pętli 1), `ldBlock` (układ; bez wyrażenia przycisku zakupu), pusty stan Powtórek, linia zadań dnia na Dziś + auto-odbiór w bazie, `misjaClaim`, `manifest.webmanifest`, nowy `sw.js`, jednorazowe `.ics` (`index.html` ok. 7037) | v55–v57 |
| **3 Lekcja** | `ux/3-lekcja` · `~/zdawalni/ux-3` · 8813 | `lekcja-ux.js` | odtwarzacz: `playerOpen`, `lpOpen`, `lpBuild`, `lpBuildDeck`, `lpCards`, `lpSectionCards`, `LPR.*`, `lpAward`, `lpBuzz`, `lpFloat`, `lpTop`, `lpKeys`, `kick`, `lpConfChips`, `lpBiteDone`, `lpSrcDone`, `lpFinishLesson`, `done()` źródła „ld” (ok. 19731), `kSound`/`kSoundOn` i darmowe dźwięki w `kosmetyki.js`, moment pokazania awansu (`whenFree(levelUpShow…)` w `xpFlush`), CSS `.lp-*`, karta „Dziś do powtórki” (`.rv-hero`) | brak |
| **4 (TY) Wygląd** | `ux/4-wyglad` · `~/zdawalni/ux-4` · 8814 | `wyglad-ux.css` + `ikony-ux.js` | etap A: czcionki (link Google Fonts, `@font-face`, `--dz-head`), skala tekstu ≥ 12 px, cele dotyku i `.help-btn` na Terminach, Kalendarzu, Powtórkach (nagłówek), Słowniczku, materiale, `toast`, `#skrot-wm`, kafle Przedmiotów (`.nb-*`, `viewMaterials`), puste stany ogólne (`.empty`, `viewPo`), marka „Skrót BM” w przewodniku i `icons/emblem.png`, `PALETA.md`, emoji→SVG w Więcej, Ustawieniach, Przewodniku, Terminach, Kalendarzu, Słowniczku, Przedmiotach. Etap B (po scaleniu 1–3 i 5): tokeny, motywy na H2, szybkość | brak |
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
