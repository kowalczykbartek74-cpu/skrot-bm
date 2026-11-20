# Pętla UX-6 – Łatwość i instynktowność całej strony · RAPORT

Gałąź `ux/6-latwosc` (wypchnięta, scalona z `origin/main` bez rebase i bez force push). Szczegóły: `PROGRESS.md`, plany `plan-1.md` … `plan-4.md`, audyty `runda-N/audyt.md` i `audyt.json`, pomiary `runda-N/kontrola.md`.
Nic nie trafiło na produkcję: żadnego SQL ani funkcji Edge nie uruchomiłem, testowa przeglądarka blokuje każde połączenie poza 127.0.0.1.

## 1. Rundy

| runda | wynik | twarde błędy | zadania ★ (2 / 1 / 0) | poprawek (commity UX-6 + test) |
|---|---|---|---|---|
| 0 | 4,9 | 3 (czerwone testy już na main, tekst < AA, PL w EN) | 3 / 3 / 0 | – (stan wyjściowy) |
| 1 | 7,1 | 0 | 4 / 2 / 0 | 13 + 4 |
| 2 | 8,0 | 0 | 6 / 0 / 0 | 11 + 2 |
| 3 | 8,0 (7,96) | 0 | 6 / 0 / 0 | 5 |
| 4 | **8,3** | **0** | **6 / 0 / 0** | 4 |

Warunek końca (wynik > 8, zero twardych błędów, wszystkie ★ = 2) spełniony w rundzie 4. Każdy wynik sprawdziłem wzorem z D: część „zadania” i „technika” zgadza się z audytem w każdej rundzie.
Runda 2: pierwszy Tester-Sędzia przerwany limitem API – audyt powtórzony od początku z nowym (E5).

## 2. Ostatni audyt (runda 4)

Pełny plik: `runda-4/audyt.json` (i opis dla właściciela: `runda-4/audyt.md`). Najważniejsze:
`{"runda": 4, "wynik": 8.3, "punkty": {"zadania": 3.71, "zrozumialosc": 1.2, "pierwsze_minuty": 1.1, "bledy_i_wyjscia": 0.8, "technika": 1.5}, "twarde_bledy": []}` – 17 zadań na 2 punkty, 4 na 1 (Z9 Sklep, Z17 powrót po przerwie, N8 prostsza wersja „w przygotowaniu”), zero porażek. Kontrola: 166 ekranów, zero naruszeń w 13 rodzajach.
Pięć najważniejszych uwag testera (wszystkie P1, żadnego P0): jedno zaliczenie ma kilka nazw („kolokwium” / „zaliczenie wykładu”), siedem nazw krótkiej nauki, trzy miary postępu przedmiotu, na Dziś karta poleca Lekcję 1 a „Najważniejsze teraz” Lekcję 2, próbny test z Dziś startuje bez pytania (zegar 45 min).

## 3. Przed i po

Zrzuty wszystkich ekranów (390 / 360 / 1280, jasny i ciemny, PL i EN) z kontroli: „przed” = `runda-0/zrzuty/kontrola/`, „po” = `runda-koniec/zrzuty/kontrola/` (na dysku, poza gitem – A2 pkt 5). Nazwy: `<konto>-<szerokość>[-ciemny|-en]-<ekran>.png`, np. `platne-390-dzis.png`, `platne-1280-ciemny-terminy.png`, `platne-390-przygotuj.png`, `darmowe-390-material.png` (paywall).

Kroki zadań (tester rundy 0 → rundy 4; limit w nawiasie):

| zadanie | r0 | r4 | | zadanie | r0 | r4 |
|---|---|---|---|---|---|---|
| Z1 próba (8) | 7 ✓ | 7 ✓ | | Z10 grupy (4) | 8 ✗ | 2 ✓ |
| Z2 5 min (4) | 1 ✓ | 1 ✓ | | Z11 język (6) | 4 ✓ | 5 ✓ |
| Z3 lekcja (5) | 3 ✓ | 3 ✓ | | Z12 animacje/ciemny (6) | 5 ~ | 4 ✓ |
| Z4 termin OWI (4) | 3 ~ | 2 ✓ | | Z13 zakup po próbie (4) | 5 ~ | 4 ✓ |
| Z5 próbny test (5) | 5 ~ | 2 ✓ | | Z14 kalendarz (5) | 5 ~ | 3 ✓ |
| Z6 powtórki (3) | 2 ✓ | 2 ✓ | | Z15 kontakt (4) | 5 ~ | 4 ✓ |
| Z7 słówko (4) | 2 ✓ | 2 ✓ | | Z16 starosta (6) | 7 ✗ | 6 ✓ |
| Z8 postęp (4) | 3 ✓ | 3 ✓ | | Z17 powrót (3) | 1 ✓ | 1 ~ |
| Z9 sklep (5) | 7 ~ | 7 ~ | | Z18 co w dostępie (4) | 7 ✗ | 2 ✓ |

✓ = 2 pkt, ~ = 1 pkt, ✗ = 0 pkt.

## 4. Zmiany według ekranów

- **Dziś:** karta dnia mówi, co się dzieje (nowy temat / „Utrwalanie” tylko po lekcji / „Na rozgrzewkę: N fiszek”); przed zaliczeniem ≤ 7 dni przycisk „Próbny test: {przedmiot}” od razu startuje test; poprawna odmiana „Prawo: do zaliczenia zostały 3 dni”; jeden główny przycisk (przypomnienie, Boss, lekcje, „Kup dostęp” w próbie drugorzędne); „cel 0/30 XP”; na niskim telefonie „Zaczynamy” nad dolnym paskiem; ekran powrotu: „Ostatnia lekcja: {tytuł}”.
- **Okna (wszystkie):** ✕ w rogu (44 px); przycisk „wstecz” telefonu zamyka okno, zamiast zmieniać stronę pod spodem (także nad lekcją); przejście pod nowy adres przy otwartym oknie działa.
- **Terminy / Kalendarz:** w arkuszu „Przygotuj się” jako główny, „Odhacz” drugorzędny; starosta widzi „Edytuj termin” zawsze (sam włącza tryb starosty); „Przygotuj się” tylko przy przedmiotach z materiałami; „Do telefonu” także w Kalendarzu; spójne opisy; kontrast kafelków kolokwium (1280).
- **Przygotuj się:** przedmiot z jedną częścią bierze najbliższe kolokwium starosty (było „81 dni” przy kolokwium za 3 dni); nazwa „kolokwium” jak w Terminach; SVG zamiast emoji; kontrast w ciemnym.
- **Przedmiot:** „Następna lekcja” przed statystyką; konto bez dostępu: „Lekcje są w pełnym dostępie: wypróbuj 3 dni / zobacz plany” zamiast „Wszystkie lekcje przerobione 🎉”.
- **Materiał:** „Dalej” przyklejone nad dolnym paskiem na telefonie.
- **Zakup:** okno „Wybierz plan” z listą „W pełnym dostępie masz”, „Twój okres próbny się skończył”, zdanie o 315 zł bez „co miesiąc”; Sklep bez dostępu zaczyna od „Kup dostęp”; „Kup dostęp” w pasku i poza Dziś drugorzędny.
- **Ranking:** karta „Grupy roku” (średnio XP na aktywną osobę, moja grupa „Twoja”, < 3 osób = „za mało osób”) – **wymaga SQL v63**.
- **Sklep:** cena także przy braku monet („120 🪙 · brakuje 50”); zamrożenie serii „Chroni serię w dzień bez nauki” zamiast „Tylko wygląd”.
- **Więcej / Pomoc / stopka:** „Kontakt” w stopce otwiera Pomoc (adres); wyszukiwarka zna „napisz do nas”, „nie działa”, „zaproś”, „kolega”; pusty Staś z akcją.
- **Cała strona:** cele dotyku 44 px (menu, logo, zakładki, przyciski, pola, linki w notkach), tekst ≥ 12 px, ściągawka idzie za motywem (druk zawsze jasny), EN: ~35 nowych par w bloku `// ux-6`, podpowiedzi „?” tłumaczone przed ucięciem.
- **Narzędzia (docs, nie strona):** sonda, kontrola 166 ekranów, test zadań `docs/gry/test/ux6-zadania.mjs` (20/20), stany startowe, atrapa: logowanie kodem, wylogowanie, znacznik zmian (`updated_at`, `order`, `limit`), v63, lekcje prawa i makroekonomii; poprawione stare asercje (osobne commity „test: …”).

## 5. Do decyzji (odpowiedz numerami)

1. **„Grupy roku”: kto liczy się do średniej.** Teraz wszyscy aktywni z rocznika, także ukryci w rankingu osób (tylko suma, bez nicków; grupa < 3 osób bez średniej). **Domyślnie: tak zostaje.**
2. **Cena miesięczna 35 zł** (w notatkach bywało 39 zł). Nie zmieniałem. **Domyślnie: 35 zł zostaje.**
3. **Konto bez dostępu na Dziś: dwa wyraźne przyciski** (akcent „Kup dostęp” z pętli 1 + „Zaczynamy”). **Domyślnie: zostaje jak w pętli 1.**
4. (z audytów, wymaga decyzji projektowej, nie ruszałem) **Jedna nazwa krótkiej nauki** zamiast siedmiu i **jedna miara postępu przedmiotu** zamiast trzech. **Propozycja domyślna:** „5 minut” wszędzie (Dziś, Powtórki, przejazd, przed snem jako warianty tej samej karty) i „Opanowanie %” jako jedyna liczba na liście i w przedmiocie.

**Odpowiedź (20.11.2026): „Biorę domyślne”.** 1–3 zostają bez zmian. Punkt 4 jest wprowadzony: „5 minut · z zajęć / w drodze / przed snem”, przyciski karty dnia wszędzie „Zaczynamy · 5 min”, na liście przedmiotów tylko „Opanowanie N%”, opis Opanowania zgodny z wyliczeniem (50%, 60% z biletem, +20% za utrwalenie).

## 6. SQL do wdrożenia (klik po kliku)

1. Otwórz na github.com plik `supabase/skrot-v63-ranking-grupy.sql` (gałąź `ux/6-latwosc` albo main po scaleniu) → „Copy raw file”.
2. Supabase → SQL Editor → New query → wklej → Run. (Po v60. Można uruchomić ponownie. Strażnik kodowania zatrzyma plik, jeśli polskie litery dojdą zepsute.)
3. Sprawdzenie: Ranking kierunku → pod tytułem karta „Grupy roku”. Bez v63 karty po prostu nie ma (reszta działa).
Funkcji Edge: brak.

## 7. Ryzyka przy scalaniu

- Pliki strony: `index.html` (≈ 200 linii: CSS na końcu głównego stylu, `modal()`, obsługa `popstate`, karta dnia `ldHero`, arkusz terminu, `examDate`, `viewShop`, ranking), `nawyk.js` (pigułka celu, ekran powrotu, karta przypomnienia), `ux-wejscie.js` (przyciski zakupu poza Dziś), `skrot-supabase.js` (okno planów, `rp.grupy`), `i18n-en.js` (blok `// ux-6`). Wersje `?v=` podbite (`ux6m`).
- Scalenie z „Wygląd pro” (main c7e3e89) zrobione w tej gałęzi (14 konfliktów w `index.html`, 2 w `nawyk.js`): wziąłem tokeny pisma i zaokrągleń z main i dołożyłem zmiany UX-6; bez paska z lewej przy kolokwium w kalendarzu (main usunął paski).
- Testy po scaleniu: patrz niżej (sekcja 8).
- `history.pushState` przy otwieraniu okna (wpis w historii) – jeśli inna część strony liczy wpisy historii, sprawdzić.

## 8. Testy na końcu (po scaleniu z main)

- `node --test tests/*.test.js`: 394/394. PGlite: v63 ✓ (G1–G5), poza tym jak na main (✗ v12 `limit_wpisow` – znane).
- `ux6-zadania.mjs`: 20/20. Kontrola całej strony (`runda-koniec/kontrola.md`): 166 ekranów, **zero naruszeń** (po scaleniu dwie rzeczy z „Wygląd pro” wymagały poprawki: inicjały przedmiotów i cena w Sklepie poniżej AA, przycisk języka 40 px – poprawione).
- Pełny przebieg starych testów Playwright: **czerwone są te same co na czystym `origin/main` (c7e3e89)** – testy pisane pod wygląd H2 („karta 3D”, gruby dół, paski koloru), które „Wygląd pro” celowo zmienił: h2-etap2, 4, 5, 6, 7, 8, 9, 10, ux1-etap1, ux1-etap4, ux4-etapW1–W4 (porównanie kolejno: ta gałąź vs main – te same ✗; ux4-etapW2: 44 px liczone jako 43,9993 – zaokrąglenie). **Do zrobienia przy „Wygląd pro”**: nowe asercje pod płaskie karty (nie ruszałem, bo to cudzy projekt wyglądu).
- Po scaleniu i poprawkach zielone (sprawdzone osobno): ux2-etap1–5, ux3, ux5, etap2, dzien, przygotuj-sie, dzis-prosciej, lekcja-dnia-4.
