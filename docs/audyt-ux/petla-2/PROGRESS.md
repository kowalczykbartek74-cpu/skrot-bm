# Pętla UX-2 · Nawyk, seria i powroty — PROGRESS

Gałąź `ux/2-nawyk`, katalog `~/zdawalni/ux-2`, port 8812, własny plik `nawyk.js`, SQL v55–v57.
Wznowienie: „Kontynuuj pętlę UX-2 według ~/zdawalni/ux/petla-2.md i docs/audyt-ux/petla-2/PROGRESS.md”.

## Etapy
| etap | runda | wynik | twarde błędy | stan | commit |
|---|---|---|---|---|---|
| 1 Seria i cel dnia na Dziś | 5 | **8/10** (r1 7,5 · r2 6,5 · r3 7,5 · r4 7,5 · r5 8) | brak | **ZALICZONY** | e3084da |
| 2 Zasady serii | 2 | **8/10** (r1 7 · r2 8) | brak | **ZALICZONY** | 4d32d19 |
| 3 Powroty | 3 | **8/10** (r1 5,5 · r2 7,5 · r3 8) | brak | **ZALICZONY** | 968a05d |
| 4 Kanał poza stroną | — | — | — | — | — |
| 5 Dziś: układ, zadania, duet, tempo | — | — | — | — | — |

## Decyzje
- Start 17.11.2026: katalog `~/zdawalni/ux-2` był gotowy (skrypt Bartka), gałąź `ux/2-nawyk` = `origin/main` (`da5c455`). PGlite działa.
- B1 przyjęte bez zmian (Bartek nic nie zmienił): D2 seria (2 zamrożenia z rzędu, 1 w prezencie, przerwy `CAL.PERIODS` z „Przerwa” i `OFF` nie zrywają), D5 `LP_DAILY_GOAL = 30`, naprawa wysiłkiem (2 dni × 5 min, raz na 30 dni, seria ≥ 3, przerwa 2–4 dni), przypomnienia maks. 1 mail dziennie, godzina z planu, web push tylko po zaliczeniu 1–5, ranking „Ten tydzień” nie tutaj.
- D5: wyboru celu 30/50/80 w Ustawieniach nie robię w etapie 1 (Ustawienia i tekst konta to miejsca innych pętli) — zapis w RAPORT do decyzji Bartka.
- Dni nauki do kalendarza serii: nowe pole `progress.nd` (lista dayN, 120 ostatnich), dopisywane w `xpFlush` przez `ZD_NAWYK.poXp`. Konta sprzed zmiany: kalendarz liczy dni wstecz z `streak` (bez dni zamrożonych i przerw) — przybliżenie, tylko do wyświetlania.
- `OFF` (dni wolne z kalendarza uczelni, np. „Dzień rektorski”, 11 listopada) liczę jako przerwę (jak święta w D2).
- Most wystawia też `xpFlush` (test etapu 1 symuluje pierwszą naukę dnia) i `celXp()` (stała `LP_DAILY_GOAL`).
- Pigułka serii przy 360 px w stanie „do północy”: rząd powitania łamie się (seria w drugim wierszu), zamiast ucinać; ranga < 420 px bez „poz. N”, nazwa do 9 znaków z wielokropkiem (poziom jest w odznace).
- `xpFlush` nie rysuje ekranu, więc `ZD_NAWYK.poXp` odświeża pigułki w miejscu (np. gra na Dziś).
- Runda 2 etapu 1 (recenzent): teksty zasad obiecywały weekend na 2 zamrożeniach i przerwy, a kod chronił 1 dzień. Decyzja: logika zasad serii (`L.seriaDalej`/`seriaZywa`, `streakNext`/`kStreakAlive` przez `ZD_NAWYK`) i migracja v55 (`nauka_zamrozenie_uzyj_dni`, `nauka_przerwa`, `nauka_seria_na`, prezent) weszły już w etap 1, żeby obietnica była prawdziwa. Etap 2 dokłada v56 (`nauka_dni`), prezent po stronie strony, karty zamrożeń i „Ten tydzień”. Bez v55 w bazie strona używa starej `nauka_zamrozenie_uzyj` (tylko wczoraj).
- Granica dnia i godzina stanu „do północy” w tej samej strefie: czas telefonu (tak liczy `dayN` całej aplikacji). Dla studentów w Polsce = Europe/Warsaw.
- < 400 px: pierwszy wiersz ranga (z nazwą) + monety, drugi wiersz pasek dnia: seria ze stanem po lewej, cel „x/30” po prawej.
- Stan „chroni zamrożenie” (spokojny, niebieski) zamiast alarmu „do północy”, gdy zamrożenie ochroni dzisiejszy dzień; „przerwa, seria czeka” w dni przerw z kalendarza uczelni.
- Runda 4 etapu 1: zamrożenia „wszystkie albo żaden” (SQL i atrapa), błąd sieci nie zeruje serii (prośba czeka w `skrot-zam-czeka`, ponowienie po 4 s i co minutę), utrata serii z banerem, daty do bazy po kalendarzu warszawskim, prezent podłączony (po zapisie postępu), test zgodności przerw SQL z `CAL_DEFAULT`.
- Optymistyczne n+1 w `streakNext` zostaje (funkcja musi zwrócić wynik od razu); mignięcie tylko przy rozbieżnym zapasie zamrożeń między urządzeniami — wtedy baner wyjaśnia koniec serii.
- Runda 5 etapu 1: v56 (`nauka_dni`, dzień nauki z XP w bazie) wciągnięta do etapu 1 (recenzent: dzień nauki w bazie = tylko punkty rankingu). Fokus okna na nagłówku, kratka „dziś chroni zamrożenie”, teksty „chroni zamrożenie (ostatnie)”, „weekend: zużyje 2 z 2”, „dziś ✓”, cel „x/30 XP” / „cel ✓”, `ZD_NAWYK.jutro()` („Jutro: {temat}, 5 min”) w ekranie „Seria +1”. Regresja: ciężkie testy (fps, długie przejścia) pojedynczo.
- Strefa czasu (decyzja): pigułka, „do północy” i granica dnia liczą się w czasie telefonu (jak `dayN` całej aplikacji; zmiana `dayN` to nie obszar tej pętli); do bazy daty idą po kalendarzu warszawskim. Dla studentów w Polsce wszystko = Europe/Warsaw. Zapis w RAPORT.
- Na nowy rok akademicki (przed 1.10.2027): dopisać przerwy i dni wolne w `nauka_przerwa` (v55) i w `CAL_DEFAULT`; test `tests/nawyk.test.js` pilnuje, że są takie same.

## Do przeniesienia z recenzji etapu 1 (runda 5)
- Etap 2: v56 nie liczy dni z `progress.nd` (tylko `xp.d` z bieżącego zapisu i punkty), bo klient mógłby dopisać dni; prezent dopiero przy `nauka_seria_na(u, dzis) >= 2`; dzień nauki w wyzwalaczu v56 po kalendarzu telefonu vs Warszawa (test NY po nauce o 19:30); „zamrożenie chroni (ostatnie)” w jednej linii przy 390 px; mocniejszy stan risk; banery pod paskiem serii, nie na powitaniu.
- Etap 3: koniec serii trwały (`progress.seriaKoniec`) w oknie i na Dziś do zamknięcia przez studenta (K5 etapu 3).
- Etap 5: hero „Dziś · 5 min” po nauce zgodny ze stanem dnia, wiersz „Jutro: …” na Dziś.
- Etap 2 K4: „Ten tydzień: k/5 dni” jest w tym samym rzędzie (`.rk-line`) co ranga; przy < 400 px nie mieści się obok rangi i monet (ok. 200 px), więc zawija się do trzeciego wiersza pod paskiem serii. Bez nowego bloku.
- Etap 2: v56 nie liczy `progress.nd` (tylko `xp.d` bieżącego zapisu i punkty), prezent dopiero przy serii ≥ 2 (`nauka_seria_na`). Seria z bazy nie zasila nagród ani rankingu z monetami (dzień telefonu vs Warszawa).
- Etap 2 runda 2: `nauka_seria()` zwraca też dni czekające na zamrożenie (`czeka`, `bez_zamrozen`) — baza = strona przed nauką; `nauka_seria_na(u, d, zapas)`; wyzwalacz v56 tylko dla dziś/wczoraj i rosnącego `xp.t`. Przerwy w SQL to kalendarz US (wspólny dla roczników z plan.zdawalni.pl) — rocznik z innym kalendarzem wymaga okresów w danych rocznika (RAPORT).
- „Ten tydzień”: cel = 5 dni zajęć minus dni przerwy w pon–pt („Ten tydzień: 1/4 dni”, w przerwie „Ten tydzień: przerwa”); w DOM po pigułce serii.
- Banery na Dziś w treści strony pod paskiem (przesuwają kartę, nie zasłaniają); po zużyciu ostatniego zamrożenia „Uzupełnij w sklepie”. Utrata serii widoczna od wejścia w pigułce („0 dni · koniec serii 10 dni”).

## Do przeniesienia z recenzji etapu 2 (runda 2) — robię na początku etapu 3
- Piątek przed nauką: „· ucz się dziś: weekend chroniony” (z alarmem), „weekend chroniony” dopiero po nauce w piątek (pt+sob+nd bez nauki = 3 dni > 2).
- „Uzupełnij w sklepie” tylko przy saldzie ≥ cenie; inaczej podpowiedź, jak zarobić monety.
- Dziś w przerwie: kropka i kratka w stylu przerwy, nie „do zrobienia”.
- v55 uruchomione ponownie po v56 nie może przywrócić `nauka_dzien_nauki` do samego `nauka_rp` (`to_regclass('public.nauka_dni')`).
- `prezent()`: przy „pelne”/„za_wczesnie” pytać bazę najwyżej raz dziennie.
- v56: komentarz o zakresie dni zgodny z kodem.
- 360 px: krótszy tekst stanu „chroni”.
- Etap 3: link z maila „powrót” = `/?pz=<id>&wracam=1#/` zamiast `#/?wracam=1` — router strony (`routeFromHash`/`render`, nie obszar pętli 2) traktuje zapytanie w „#” jako nieznaną stronę („Nie ma takiej strony”); `link()` w `przypomnienia.js` łączy zapytanie z `?pz=`. Strona zapamiętuje `wracam` na cały dzień (`skrot-wracam`) i usuwa parametr z adresu.
- Etap 3: `ldKontekst` dostaje jedno wywołanie z umowy (`przerwaDni: window.ZD_NAWYK?.przerwaDni?.()`), żeby `trybDnia` włączał „lekko” po przerwie; karta „Wracam: 3 minuty” = `LDE.kartaPowrotu` (rozgrzewka do 6 + 1 pytanie, tryb lekko, bez nowego tematu).
- Etap 3: naprawa serii w `progress.streakRepair` / `streakRepairAt` (raz na 30 dni); gdy naprawa możliwa, zamiast banera końca serii baner naprawy.
- Etap 3: banery w treści Dziś wracają po przerysowaniu ekranu (MutationObserver na `#main`), dopóki trwają.
- Etap 3: poprawki z recenzji etapu 2 wykonane (piątek, „Uzupełnij” tylko przy saldzie, dziś w przerwie, v55 po v56 + test D8, prezent raz dziennie, komentarz v56).
- Etap 3 runda 2: „Wracam: 3 minuty” zamraża plan w `ldDay.plany.karta` (inaczej `ldOpen` składał kartę od nowa z „Najważniejsze z tematu”); `LDE.kartaPowrotu` tylko ze znanych tematów/rewanży, bez nich uczciwie „Wracam: 5 minut” + „Zaczniemy spokojnie…”. Przy karcie powrotu `ldBlock` nie pokazuje hero (jeden główny przycisk).
- „Powrót po przerwie” = ≥ 2 opuszczone dni zajęć (bez sobót, niedziel, przerw i dni zamrożonych); piątek → poniedziałek to zwykły rytm.
- Teksty EN „{0}-day streak”: liczba dni wstawiana zawsze po polsku („10 dni”), żeby słownik dobrał wzór „Seria {0} dni …”.
- Mail „powrót”: jedna obietnica „3 minuty” (PL/EN, przycisk „Wracam: 3 minuty”).
- Etap 3 runda 3: bez zaległych fiszek rozgrzewka karty powrotu = 4 pytania ze znanego tematu (+1) — „3 minuty powtórki” są prawdą (test przechodzi całą kartę: 5 pytań, bez czytania). Mail „powrót” obiecuje „3 minuty” tylko, gdy strona ma kartę powrotu (`stanZ.zn`, `ZD_NAWYK.maKartePowrotu`); inaczej „Wracasz? Zacznijmy spokojnie”. Wiersz naprawy także bez karty powrotu (mała karta, karta dnia zostaje). `ZD_NAWYK.naprawaLinia()` dla ekranu końca (pętla 3).
- Naprawa serii istnieje tylko na stronie (`progress.streak = n + 2`); `nauka_seria` w bazie jej nie zna — seria z bazy służy do zamrożeń i podglądu, nie do nagród ani rankingu (RAPORT).
- 17.11.2026, polecenie Bartka w czacie: „jak skończysz scal i dodaj na main” — po zakończeniu pętli (etapy 1–5 + RAPORT) scalić `ux/2-nawyk` z aktualnym `origin/main` i wypchnąć na `main` (zmiana zasady A4 pkt 2 / A7 dla tej pętli; kolejność A7 przy innych pętlach zostaje dla nich).

## Do przeniesienia z recenzji etapu 3 (runda 3) — na początku etapu 4
- Nieudana naprawa (1. dzień, przerwa, powrót w 3.) nie może przepaść po cichu: komunikat „Naprawa serii {n} nie wyszła. Dziś zaczynasz nową.” + test.
- „Zajęcia / Nowe terminy od ostatniej nauki” zamiast „od ostatniej wizyty”.
- Przy karcie powrotu pigułka bez powtarzania straty (strata w karcie).
- 360: opis pod „Wracam” w pierwszym ekranie.
- Do RAPORT: naprawa serii tylko na stronie (baza nie zna n + 2); lżejsza karta po długiej przerwie z kalendarza – propozycja.
