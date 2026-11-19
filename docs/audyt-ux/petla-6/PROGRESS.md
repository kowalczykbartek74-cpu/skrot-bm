# Pętla UX-6 – Łatwość i instynktowność: PROGRESS

Gałąź `ux/6-latwosc`, katalog `~/zdawalni/ux-6`, port strony 8816, sonda 8826.
Wznowienie: „Kontynuuj pętlę UX-6 według ~/zdawalni/ux/petla-6.md i docs/audyt-ux/petla-6/PROGRESS.md”.

## Krok 0 (18.11.2026)
- Baza: wszystkie gałęzie ux/1–5 są w `origin/main` → baza = `origin/main` (c1356b9).
- `node --test tests/*.test.js`: 394/395 pass, 0 fail (1 pominięty). PGlite działa (koniec: v60b ✓, roczniki ✓, strażnik ✓).
- Wykluczenia w `.git/info/exclude`: zrzuty rund, `docs/dzis-review/runda-ux-6*/`, `docs/audyt-ux/petla-6/tmp/`.
- Narzędzia:
  - `stany.mjs` – stany startowe z C (termin z prawa za 3 dni, fiszki na dziś, w trakcie nauki, 7 dni przerwy, saldo 150, grupa C112, nowy gość). Wspólne terminy: kolokwium OWI 20.11 z zakresem w notatce, kolokwium z logistyki 4.12.
  - `sonda.mjs` – gotowa i sprawdzona (Z1 przechodzi do Dziś w próbie). Dodatkowe polecenie `/poczta` (mail z kodem logowania).
  - `docs/gry/test/ux6-zadania.mjs` – ścieżki wzorcowe Z1–Z18, wszystkie przechodzą. Kroki liczą się same (klik, wpisz, każde przewinięcie, gdy elementu nie widać). Ponad limit (do 2×) = ⚠, nie błąd: test pilnuje, że droga istnieje. Dziś ponad limit: Z5 (9/5), Z13 (5/4), Z16 (11/6).
  - `kontrola.mjs` – pełna: platne × (360, 390, 1280, 390 ciemny, 390 EN) × 26 ekranów + starosta, darmowe, proba, proba-koniec, brak; `szybko` = tylko 390 jasny.
  - `runda.sh <R>` – kontrola + testy dopisane do kontrola.md + sonda w tle. `tester-prompt.md` – polecenie dla Tester-Sędziego (E1) z wpisanymi parametrami startu.
- Atrapa (`// === ux-6 ===`): `verifyOtp` dla gościa „brak” zakłada konto „darmowe” (bez tego kod z maila nie logował w atrapie); `update` dokumentu podbija `updated_at` i atrapa honoruje `order(updated_at)` + `limit` (bez tego strona nie widziała zmian, np. przesuniętego terminu – w prawdziwej bazie działa). Po zmianie zielone: H2 1–10, ux1 1–4, ux2 1–3, ux3 1–5, ux4 W2–W4, ux5 1–3. Czerwone **już na origin/main** (to samo z atrapą z main): `ux2-etap4` (K5 – adresy w pamięci sw), `ux2-etap5` (3 ✗: oczekuje bloku „Więcej na dziś”, usuniętego w c1356b9), `ux4-etapW1` (K2 – nagłówki sekcji Dziś 18 px). Poprawione w czasie audytu rundy 0 (pliki testów, bez zmian strony): 96cdf2d, f19c1df, 974ee7d – wszystkie trzy zielone (65/65, 62/62, 50/50).

## Rundy
| runda | wynik | twarde błędy | ★ (2/1/0) | poprawek | stan |
|---|---|---|---|---|---|
| 0 | 4,9 | czerwone testy (już na main), tekst < AA (5 ekranów), PL w EN | 4/2/0 (Z1 Z2 Z3 = 2; Z4 Z5 Z13 = 1) | – | audyt stanu wyjściowego, wynik zgodny z formułą (zadania 28/42 → 2,7; technika 0) |
| 1 | 7,1 | brak | 4/2/0 (Z4 Z5 = 1) | 11 pozycji planu + poprawki po regresji | plan-1.md; wynik zgodny z formułą (zadania 37/42 → 3,52; technika 0,75) |
| 2 | (audyt w toku) | | | 13 pozycji | plan-2.md |

### Runda 1 – co zrobione (commity)
- test: 96cdf2d, f19c1df, 974ee7d (stare asercje po c1356b9), etap2 (XP zamiast pkt).
- 83fa85b kontrast (ciemne Przygotuj się, ściągawka idzie za motywem, Hasło, kalendarz 1280) + podpowiedzi „?” tłumaczone przed ucięciem.
- ac57446 brakujące EN; kontrola liczy PL w EN tylko dla tekstów interfejsu (z kodu strony).
- okno „Wybierz plan”: lista „W pełnym dostępie masz”, „Twój okres próbny się skończył”, zdanie o 315 zł bez „co miesiąc”.
- f52ca3f „Grupy roku” w Rankingu + SQL v63 (`nauka_ranking_grupy`, test PGlite G1–G5) + „Edytuj termin” dla starosty zawsze.
- „wstecz” zamyka okno (#layer), ✕ w rogu każdego okna; W1/W2 w ux6-zadania.
- „Przygotuj się”: przedmiot z jedną częścią bierze bliższe kolokwium starosty.
- „Do telefonu” w Kalendarzu, adres w stopce, wyszukiwarka: „napisz do nas”, „zaproś”.
- cele 44 px (menu, logo, zakładki, .btn, pola, przełącznik), tekst ≥ 12 px, SVG zamiast emoji w planie i kalendarzu; ?v= i18n.js i skrot-supabase.js.
- Przeniesione do rundy 2: Dziś zawsze „Lekcja 1”, wiele nazw sesji 5 min, Sklep bez listy cen, kolejność Przedmiotów, pigułki na pierwszym ekranie, P2.

## Gdzie jestem
- Runda 2: kontrola gotowa (166 ekranów, zero twardych błędów, technika 1,25), Tester-Sędzia rundy 2 w toku.
- Po regresji rundy 2 poprawione: „cel” w pigułce serii ukryty < 380 px (EN 360 wychodziło poza ekran), test ux2-etap1 (osobny commit), kolor definicji w ściągawce, EN „Dział”; ux5-etap3 chwiejny przy pełnym przebiegu, zielony osobno.

## Decyzje
- Zegar stron w sondzie i testach = 6.11.2026 17:00 (jak `h2-lib.mjs`), więc „termin za 3 dni” = 9.11.
- Sonda: element, którego jedyny tekst to symbol (np. „→”), liczy się jako „tylko ikona”. Widoczność przez `checkVisibility()` (sekcje `hidden=until-found` mają rozmiar, ale nie są widoczne).
- Kontrola: pomijane fałszywe alarmy pomiaru: cienka linia z gradientu (podkreślenie `.tl-t`), litery awatara na tle SVG (`.kav-l`), ozdobnik bez liter z kontrastem < 1,2 (✓ przed odhaczeniem, aria-hidden).
- Polecenie testera od rundy 1: zdanie „Linki do zewnętrznych stron (poczta, Google, Apple) sonda blokuje – to nie jest błąd apki” (w rundzie 0 tester liczył zablokowany mailto jako martwy klik).
- Z16 w poleceniu testera: dopisane „Jesteś starostą roku.” (konto starosty, inaczej zadanie jest bez sensu dla „studenta”).
- Gry w kontroli: lista gier i ekrany Hasła/Bossa, bez ekranu końca każdej gry (shortcut w kontrola.mjs).
- Atrapa: koniec próby konta „proba-koniec” = 5.11 (przed zegarem stron), inaczej strona nie wiedziała, że próba minęła; tydzień rankingu liczony od daty strony.
- Kontrola: klawiatura Hasła dnia (`.hd-k`) poza miarą 44 px (10 klawiszy w rzędzie); znak wodny `#skrot-wm` poza axe (jak dzis-review.mjs).
- „Grupy roku”: do średniej liczą się wszyscy aktywni z rocznika (także ukryci w rankingu osób), grupa < 3 osób bez średniej → do-decyzji.md pkt 1.
- Niepowtarzalne w obecnym kodzie (sprawdzone, bez zmian): martwy „Przygotuj się” przy 360 px, tytuł w karcie „Najbliższe”, pierwszy klik „Mniej animacji”.

## Spostrzeżenia z rozpoznania (do audytu, nie poprawiane przed rundą 0)
- Przycisk „→ Przygotuj się” przy kolokwium z przedmiotu bez materiałów (OWI) nic nie robi.
- Dziś przy kolokwium z prawa za 3 dni dalej proponuje „Lekcja 1: Pochodne funkcji”.
- Menu „Więcej” w nagłówku to sama ikona 40×40 px.
- „Przygotuj się” z prawa przy kolokwium za 3 dni pokazuje zaliczenie wykładu za 81 dni (zła część), a plan dnia ma emoji 🧭 🔁 📝 ⚡.
- Okno zakupu: „Zostało ok. 9 miesięcy, a co miesiąc wyszłoby ok. 315 zł” – 315 zł to suma, nie kwota miesięczna (tekst ceny → do-decyzji, jeśli audyt to wskaże).
- Starosta: edycja terminu dopiero po włączeniu „Trybu starosty” głęboko w Więcej.
