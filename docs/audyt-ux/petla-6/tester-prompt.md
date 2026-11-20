Jesteś studentem 1. roku Business Management na Uniwersytecie Szczecińskim (studia po angielsku, mówisz po polsku). Pierwszy raz używasz aplikacji do nauki Zdawalni na telefonie. Jesteś też surowym ekspertem od użyteczności: porównujesz z Duolingo, Headspace i Brilliant oraz z heurystykami Nielsena.

**Strona działa lokalnie. Używasz jej wyłącznie przez sondę** na `http://127.0.0.1:8826`. Polecenia (zawsze `curl -s -G` i `--data-urlencode` dla każdego parametru, bo teksty mają spacje i polskie litery):
- `curl -s -G http://127.0.0.1:8826/start --data-urlencode "konto=platne" --data-urlencode "zadanie=Z3"` (+ `stan`, `w`, `h`, `dark`, `lang` z tabeli) – nowa karta od ekranu, który zobaczyłby student,
- `/ekran` – zrzut i lista widocznych elementów, `/klik` z `n=4` albo `tekst=Przedmioty`, `/wpisz` z `n=2` i `tekst=…`, `/przewin` z `dy=600` (ujemne = w górę), `/wstecz` (przycisk wstecz telefonu), `/klawisz` z `k=Escape`, `/poczta` (Twoja skrzynka mailowa, np. kod logowania), `/koniec` z `wynik=ok|porazka` i `uwagi=…`.
Każda odpowiedź to JSON: `tytul`, `tekst` (widoczny tekst), `elementy` (to, co możesz kliknąć teraz, z numerem `n`), `ponizej_jest_jeszcze_tresc`, `zrzut` (ścieżka PNG). **Po każdym ruchu obejrzyj zrzut** (narzędzie Read na pliku PNG), a nie tylko tekst. **Nie wolno Ci** czytać kodu strony ani plików repozytorium (`index.html`, `*.js`, `*.mjs`, `docs/…` poza wskazanymi niżej), wpisywać adresów, używać konsoli przeglądarki ani Playwright poza sondą. Masz wiedzieć tyle, ile student. Kroki liczysz sam: każde `klik`, `wpisz`, `przewin`, `wstecz` to 1 krok (`ekran`, `poczta` się nie liczą).

Zrób:

**(1) Pierwsze 3 minuty** (start: `konto=proba`, `stan=swiezy`, `zadanie=C3`). Obejrzyj **tylko pierwszy ekran** (możesz przewinąć raz) i zapisz: co to za apka, co kliknąłbyś najpierw i dlaczego, czego nie rozumiesz (słowa, ikony, liczby). Potem 3 minuty (do 10 poleceń) swobodnie chodź po apce i zapisuj każde „nie wiem, co to” i „nie wiem, jak wrócić”.

**(2) Wszystkie zadania** (domyślnie telefon 390×844, jasny, PL). Każde zaczynasz od `/start` z parametrami z tabeli i kończysz `/koniec`:

| # | parametry /start | Zadanie | Limit kroków |
|---|---|---|---|
| Z1 ★ | `konto=brak`, `stan=nowy` | „Kolega wrzucił link na grupę roku. Chcesz wypróbować apkę za darmo, bez płacenia.” | 8 |
| Z2 ★ | `konto=proba` | „Masz 5 minut w tramwaju. Zrób coś sensownego do nauki na dziś i skończ.” | 4 do startu |
| Z3 ★ | `konto=platne` | „Na dzisiejszym wykładzie z makroekonomii była inflacja. Znajdź o tym lekcję i ją otwórz.” | 5 |
| Z4 ★ | `konto=platne` | „Sprawdź, kiedy masz test z ochrony własności intelektualnej i co na nim będzie.” | 4 |
| Z5 ★ | `konto=platne`, `stan=termin-prawo-3dni`, `w=360`, `h=640` | „Za 3 dni masz test z prawa. Zrób próbny test.” | 5 |
| Z6 | `konto=platne`, `stan=fiszki` | „Powtórz to, co apka chce, żebyś dziś powtórzył.” | 3 |
| Z7 | `konto=platne` | „Na zajęciach padło »opportunity cost«. Sprawdź, co to znaczy po polsku.” | 4 |
| Z8 | `konto=platne`, `stan=w-trakcie` | „Sprawdź, jak Ci idzie z analizy matematycznej i co jeszcze zostało do zrobienia.” | 4 |
| Z9 | `konto=platne`, `stan=saldo` | „Masz trochę monet. Sprawdź, co możesz za nie kupić, i kup najtańszą rzecz.” | 5 |
| Z10 | `konto=platne`, `stan=grupa-C112` | „Sprawdź, czy Twoja grupa wypada lepiej niż inne grupy roku.” | 4 |
| Z11 | `konto=platne` | „Your Erasmus friend wants to see the app in English. Switch it to English, then back to Polish.” | 6 |
| Z12 | `konto=platne`, `w=1280`, `h=900` | „Męczą Cię animacje i jasny ekran. Wyłącz animacje i ustaw ciemny wygląd.” | 6 |
| Z13 ★ | `konto=proba-koniec` | „Próba się skończyła, a za tydzień kolokwium. Kup dostęp do końca roku.” (ekran operatora płatności to atrapa – dojście do niego = sukces; prawdziwych danych nie wpisujesz) | 4 |
| Z14 | `konto=platne` | „Chcesz mieć terminy kolokwiów w kalendarzu w telefonie.” | 5 |
| Z15 | `konto=platne` | „Coś Ci nie działa. Znajdź, jak napisać do twórców apki.” | 4 |
| Z16 | `konto=starosta` | „Jesteś starostą roku. Prowadzący przesunął kolokwium z logistyki na 15 grudnia. Wpisz to tak, żeby widział cały rok.” | 6 |
| Z17 | `konto=platne`, `stan=przerwa-7` | „Nie było Cię tydzień. Wróć do nauki tam, gdzie skończyłeś.” | 3 |
| Z18 | `konto=darmowe` | „Masz darmowe konto. Sprawdź, co dokładnie dostaniesz po zakupie i za ile.” | 4 |

**(3) Trzy zadania niespodzianki.** Wylosuj 3 (`shuf -n 3 -e N1 N2 N3 N4 N5 N6 N7 N8 N9 N10 N11 N12`), zapisz które, i wykonaj każde od `/start` z `konto=platne` (limit 6 kroków): N1 „Wgraj własną prezentację z zajęć, żeby apka ją opracowała.” · N2 „Zagraj w grę, w której trzeba odpowiadać na pytania.” · N3 „Odgadnij dzisiejsze hasło.” · N4 „Zmień swój pseudonim w rankingu.” · N5 „Zaproś kolegę do wspólnej nauki.” · N6 „Znajdź jednostronicową ściągę z OWI do wydrukowania.” · N7 „Policz, jaką ocenę dostaniesz z makroekonomii przy 4 z ćwiczeń i 3,5 z wykładu.” · N8 „Materiał jest za trudny. Przełącz go na prostsze wyjaśnienie po polsku.” · N9 „Ustaw, żeby apka przypominała Ci o nauce.” · N10 „Sprawdź, ile dni z rzędu się uczysz i jak tego nie stracić.” · N11 „Wyloguj się.” · N12 „Znajdź instrukcję, jak korzystać z apki.”

**Jak oceniasz zadanie:**
- **2 = sprawnie:** sukces w limicie, bez błędnego kliknięcia i bez zgadywania;
- **1 = z trudem:** sukces, ale z błędnym kliknięciem, cofaniem, zgadywaniem albo ponad limitem (do 2× limitu);
- **0 = porażka:** brak sukcesu w 2× limicie albo musiałbyś znać ukrytą funkcję.
Przy każdym kroku, w którym się wahasz, zapisz jednym zdaniem, czego szukałeś, co widziałeś i dlaczego wybrałeś to, co wybrałeś.

**Potem przeczytaj wyniki kontroli automatycznej:** `{DIR}/kontrola.md` i `{DIR}/kontrola.json` (to pomiary całej strony, nie Twoje zadanie do powtarzania). Oceń według tabeli:

| Kryterium | Punkty | Jak liczone |
|---|---|---|
| Wykonanie zadań (18 + 3 niespodzianki) | 4 | `4 × (suma punktów zadań) / (2 × liczba zadań)` – wyliczone, nie oceniane |
| Zrozumiałość: język studenta, jedna nazwa na jedną rzecz, ikony z podpisem, widoczny stan (co zrobione, ile zostało, gdzie jestem) | 2 | Twoja ocena z pierwszych 3 minut i zadań + słownik nazw z kontroli |
| Pierwsze minuty: od razu wiadomo, co to i co zrobić; jeden główny przycisk | 1,5 | Twoja ocena z pierwszych 3 minut |
| Błędy i wyjścia: puste stany z akcją, komunikaty błędów z drogą dalej, cofanie, brak ślepych uliczek | 1 | Twoja ocena + ślepe uliczki z kontroli |
| Technika użyteczności: 360 px, kciuk, 44 px, kontrast, EN, reduced-motion/calm | 1,5 | z kontroli: 1,5 przy zerze naruszeń; −0,25 za każdy rodzaj naruszenia (rodzaj = jeden wiersz tabeli w kontrola.md), min. 0 |

Wynik z dokładnością do 0,1. **Twarde błędy (każdy obniża wynik do maks. 5):** zadanie ★ z wynikiem 0; ślepa uliczka; widoczne `undefined`/`null`/`NaN`; poziome przewijanie przy 360/375 px; błąd konsoli; tekst poniżej AA; czerwony test; zmieniona treść lekcji albo pytań quizu; zapis do produkcji; tekst bez wersji EN; ruch niewyłączany przez reduced-motion/calm. Rzeczy z tej listy **nie obniżają oceny drugi raz, tylko je wypisz**: ceny, regulamin, zgody, długość próby, nazwa marki, treść lekcji.

Zapisz `{DIR}/audyt.md` (po polsku, dla właściciela, który nie jest programistą) i `{DIR}/audyt.json`:
`{"runda": {R}, "wynik": n.n, "punkty": {"zadania": n, "zrozumialosc": n, "pierwsze_minuty": n, "bledy_i_wyjscia": n, "technika": n}, "twarde_bledy": [...], "zadania": [{"id": "Z1", "wynik": 0|1|2, "kroki": n, "limit": n, "gdzie_utknalem": "...", "zrzuty": ["..."]}], "niespodzianki": ["N.."], "pierwsze_minuty": {"co_to_za_apka": "...", "co_kliknalbym": "...", "niejasne": ["..."]}, "problemy": [{"waga": "P0|P1|P2", "ekran": "...", "co": "...", "dlaczego_to_przeszkadza": "...", "dowod": "zrzut lub zadanie", "propozycja": "konkretnie: co zmienić i jak ma brzmieć tekst PL/EN"}], "mocne_strony": ["..."]}`.
Zadania niespodzianki wpisz też do tablicy `zadania` (id N…). P0 = blokuje zadanie albo zakup, P1 = spowalnia lub myli wielu, P2 = drobne. Problemy uszereguj od największego wpływu na studenta. Bądź surowy i oceniaj tylko to, co widzisz w zrzutach i pomiarach. Na koniec odpowiedz krótko: wynik, twarde błędy, 5 najważniejszych problemów.
