# UX-2 · etap 2 · runda 1

Testy etapu: **52 ✓ / 0 ✗** (docs/gry/test/ux2-etap2.mjs)

## Kryteria (asercje)
- ✓ K1 weekend + 2 zamrożenia: seria trwa, szary płomień „10 dni”
- ✓ K1 po nauce: seria 11, zamrożone sob. i niedz. (jedno wywołanie bazy z 2 dniami), zapas 0
- ✓ K1 baner „Zamrożenia uratowały serię … zostało 0/2” nad dolnym paskiem (ikona SVG, bez emoji)
- ✓ K1 weekend + 1 zamrożenie: seria spadła (0, bez szarego „10 dni”)
- ✓ K1 z 1 zamrożeniem po nauce: seria 1, zamrożenie niezużyte
- ✓ K1 1 opuszczony dzień + 1 zamrożenie: seria 5
- ✓ K1 bez v55: stara nauka_zamrozenie_uzyj chroni wczoraj, seria 5
- ✓ K1 bez v55: brak błędów konsoli
- ✓ Stan „zamrożenie chroni (ostatnie)” przy 390 px w jednej linii
- ✓ Stan „do północy”: płomień zapalony (bez szarości), alarm widać bez najechania
- ✓ K2 PGlite: skrot-v55 2× + test/v55.sql (Z1–Z9)
- ✓ K6 PGlite: skrot-v56 2× + test/v56.sql (D1–D6: samo czytanie nie zużywa zamrożenia)
- ✓ K3/K4 360-jasny: nic poza ekranem
- ✓ K3 EN 360: „break, streak paused”
- ✓ K3/K4 360-jasny-en: nic poza ekranem
- ✓ K3/K4 360-ciemny: nic poza ekranem
- ✓ K3 28.12 (przerwa), nauka 23.12: pigułka „8 dni · przerwa, seria czeka”, bez „do północy” mimo 19:30
- ✓ K3 to samo liczy baza (nauka_seria: 8, przerwa)
- ✓ K3 okno serii w przerwie: opis „seria czeka” i dni przerwy w kalendarzu
- ✓ K3/K4 390-jasny: nic poza ekranem
- ✓ K3 EN 390: „break, streak paused”
- ✓ K3/K4 390-jasny-en: nic poza ekranem
- ✓ K3/K4 390-ciemny: nic poza ekranem
- ✓ K3/K4 1280-jasny: nic poza ekranem
- ✓ K3/K4 1280-ciemny: nic poza ekranem
- ✓ K3 7.01 po przerwie: seria 8 widoczna, po nauce 9, zamrożenie niezużyte
- ✓ K4 360-jasny: „Ten tydzień: 3/5 dni”, 7 kropek (3 z nauką) w rzędzie z rangą, przycisk ≥ 44 px
- ✓ K4 360-jasny: nic poza ekranem
- ✓ K4 390-jasny: „Ten tydzień: 3/5 dni”, 7 kropek (3 z nauką) w rzędzie z rangą, przycisk ≥ 44 px
- ✓ K4 390-jasny: nic poza ekranem
- ✓ K4 390-ciemny: „Ten tydzień: 3/5 dni”, 7 kropek (3 z nauką) w rzędzie z rangą, przycisk ≥ 44 px
- ✓ K4 390-ciemny: nic poza ekranem
- ✓ K4 1280-jasny: „Ten tydzień: 3/5 dni”, 7 kropek (3 z nauką) w rzędzie z rangą, przycisk ≥ 44 px
- ✓ K4 1280-jasny: nic poza ekranem
- ✓ K4 EN: „This week: 3/5 days”
- ✓ K4 360-jasny-en: nic poza ekranem
- ✓ K5 kartaZamrozenia: opis z C2, „Masz 1/2”, przycisk „Kup za 40” z monetą SVG
- ✓ K5 przycisk otwiera istniejące potwierdzenie zakupu (kBuy) z ceną 40
- ✓ K5 po zakupie: „Masz 2/2” i „Masz komplet” bez przycisku
- ✓ K5 EN karta zamrożenia
- ✓ K5 ofertaZamrozenia: seria 5, saldo 120, 0 zamrożeń → karta
- ✓ K5 „Nie teraz” chowa ofertę (na 7 dni)
- ✓ K5 ofertaZamrozenia: saldo 30 → brak
- ✓ K5 ofertaZamrozenia: ma 1 zamrożenie → brak
- ✓ K5 ofertaZamrozenia: seria 2 → brak
- ✓ K6 atrapa: wczoraj samo czytanie (XP, 0 pkt) → „nauka”, zamrożenie zostaje
- ✓ K6 nauka dziś po dniu czytania: seria 5, bez wywołania zamrożeń
- ✓ Prezent: seria 2 → jedno zamrożenie w prezencie i baner
- ✓ Prezent: raz (kolejne XP nie pyta bazy drugi raz)
- ✓ ruch: baner bez animacji (reduced-motion)
- ✓ ruch: baner bez animacji (calm)
- ✓ konsola bez błędów (wszystkie stany)

## Pomiary (kontrast każdego tekstu WCAG AA, axe, cele < 44 px, poziome przewijanie, konsola)
| stan | teksty | < AA | tekst < 12 px | axe | cele < 44 px | poziome przewijanie | błędy konsoli |
|---|---|---|---|---|---|---|---|
| K1 baner zamrożeń 390 | 1 | 0 | 0 | 0 | 0 | nie | 0 |
| Chroni 390 jasny | 10 | 0 | 0 | 0 | 0 | nie | 0 |
| K3 Dziś w przerwie 360-jasny | 12 | 0 | 0 | 0 | 0 | nie | 0 |
| K3 Dziś w przerwie 360-jasny-en | 12 | 0 | 0 | 0 | 0 | nie | 0 |
| K3 Dziś w przerwie 360-ciemny | 12 | 0 | 0 | 0 | 0 | nie | 0 |
| K3 okno serii w przerwie 390 jasny | 36 | 0 | 0 | 0 | 0 | nie | 0 |
| K3 Dziś w przerwie 390-jasny | 12 | 0 | 0 | 0 | 0 | nie | 0 |
| K3 Dziś w przerwie 390-jasny-en | 12 | 0 | 0 | 0 | 0 | nie | 0 |
| K3 Dziś w przerwie 390-ciemny | 12 | 0 | 0 | 0 | 0 | nie | 0 |
| K3 Dziś w przerwie 1280-jasny | 13 | 0 | 0 | 0 | 0 | nie | 0 |
| K3 Dziś w przerwie 1280-ciemny | 13 | 0 | 0 | 0 | 0 | nie | 0 |
| K4 Dziś z „Ten tydzień” 360-jasny | 12 | 0 | 0 | 0 | 0 | nie | 0 |
| K4 Dziś z „Ten tydzień” 390-jasny | 12 | 0 | 0 | 0 | 0 | nie | 0 |
| K4 Dziś z „Ten tydzień” 390-ciemny | 12 | 0 | 0 | 0 | 0 | nie | 0 |
| K4 Dziś z „Ten tydzień” 1280-jasny | 13 | 0 | 0 | 0 | 0 | nie | 0 |
| K4 Dziś z „Ten tydzień” 360-jasny-en | 12 | 0 | 0 | 0 | 0 | nie | 0 |
| K5 karta zamrożenia 390-jasny | 5 | 0 | 0 | 0 | 0 | nie | 0 |
| K5 karta zamrożenia 360-jasny | 5 | 0 | 0 | 0 | 0 | nie | 0 |
| K5 karta zamrożenia 390-ciemny | 5 | 0 | 0 | 0 | 0 | nie | 0 |
| K5 karta zamrożenia 390-jasny-en | 5 | 0 | 0 | 0 | 0 | nie | 0 |
| K5 oferta zamrożenia 390 jasny | 5 | 0 | 0 | 0 | 0 | nie | 0 |
| Baner prezentu 390 jasny | 1 | 0 | 0 | 0 | 0 | nie | 0 |

## Szczegóły naruszeń

## Ruch (animationName; przy reduced-motion i html.calm ma być „none”)
- baner zwykle: {".nw-baner":"nw-up"}
- baner reduced-motion: {".nw-baner":"none"}
- baner calm: {".nw-baner":"none"}

## PGlite (v55, v56)
```
    OK D6 nauka_odp.wybor = 3
    OK D1 trudność: md:0 50%, md:1 100%, md:2 brak
    OK D1b > 80 kluczy → too_many
    OK D2 rozkład [1,3,1,1] / za_malo
    OK D2b bez mojej odpowiedzi (5 osób)
    OK D2c bez dostępu → no_access
    OK D3 5 szczebli przy 2 dobrych → podejrzana, 0 pkt
    OK D4 1 szczebel w 1 s → podejrzana
    OK D5 4 szczeble w 40 s → ok, +5, nowy rekord
    OK D4b powód: za szybko
    OK Z1 pierwsza zła, potem dobra: 0 pkt
    OK Z2 dobra: 10 pkt raz dziennie
    OK Z3 brak pytania
    OK Z4 Staś: 2 dobre, 1 zła, 20 pkt; powtórka 0
    OK Z5 3 wiersze punktów, 3 monety
    OK Z6 osobista: stas, nie da się podmienić
    OK Z7 odbiór 8 🪙 raz
    OK Z8 wspólne zadanie dalej przez tę samą funkcję
    OK Z9 bez dostępu: no_access
    OK Z1 anon nie woła nauka_zdjecie_bierz
    OK Z2 bez dostępu: not_granted, stan ok=false
    OK Z2 bez dostępu: brak wpisu
    OK Z3 płacący: 5 razy ok, szósty limit
    OK Z3 stan: uzyte 5 z 5
    OK Z4 student nie czyta nauka_zdjecia
    OK Z4 student nie woła nauka_zdjecie_zwroc
    OK Z5 zwrot: własny tak, cudzy nie
    OK Z5 po zwrocie jedno miejsce wolne
    OK Z6 cyr: własny licznik od 1
    OK Z6 tabela ma tylko id, user_id, dzien, rocznik_id, at
    OK Z6 rocznik zapisany
    OK Z7 starosta: 7 z 7 mimo limitu 5
    OK Z8 nowy dzień: licznik od 1
    OK Z8 stare (> 90 dni) skasowane, wczorajsze zostają
    OK D1 lejek ma nadal swoje pola (v35) i „ld”
    OK D2 dziś: kartę skończyło 5 osób, lekcję 3 osoby (3 lekcje)
    OK D3 przerwania: segment 3, 5 porzuceń, 5 osób
    OK D4 mechaniki: Fruń porzucony 5×, Drabina 4× ukończona dobrze, Staś 2× pominięty; zły wpis pominięty
    OK D5 czy uczy: tematy z bloku 5/5 dobrze, spoza bloku z nowych wpisów źle
    OK D6 osoby w bloku (28 dni)
    OK D7 „*” = wszystkie roczniki też ma „ld”
    OK D7b „*” zachowuje lejek według źródła z v38
    OK D8 przeglądarka nie woła nauka_lejek_ld
    OK D1 wszystkie dotychczasowe dostępy w BM (t44 też: kupił przed v45, czyli BM)
    OK D1 klucz główny (email, rocznik_id)
    OK D1 rocznik obowiązkowy
    OK D2 a@x.pl: nauka_ja i dostęp jak przed v45
    OK D2 b@x.pl: nauka_ja i dostęp jak przed v45
    OK D2 c@x.pl: nauka_ja i dostęp jak przed v45
    OK D2 s@x.pl: nauka_ja i dostęp jak przed v45
    OK D2 st1@x.pl: nauka_ja i dostęp jak przed v45
    OK D2 przyp1@x.pl: nauka_ja i dostęp jak przed v45
    OK D3 zakup BM nie daje dostępu w roczniku testowym
    OK D4 dostęp w roczniku testowym, data i plan z jego wiersza
    OK D5 zakup rocznika testowego nie daje dostępu w BM
    OK D5 ktoś, kto już płacił (inny rocznik), nie dostaje okresu próbnego
    OK D6 karnet bez rocznika → rocznik z profilu konta
    OK D6 karnet bez konta i bez rocznika → BM
    OK D7 karnet BM dla osoby z płatnym BM → ma_dostep
    OK D7 karnet na inny rocznik tej osoby → ok (płatny BM zostaje)
    OK D7 a@x.pl: dwa wiersze, BM płatny bez zmian
    OK D8 karnet działa w roczniku testowym
    OK D8 karnet testowy nie zmienia dostępu a@x.pl w BM
    OK D9 cofnięcie po e-mailu: tylko karnet, płatny BM zostaje
    OK D9 drugi raz → juz_cofniety
    OK D9 płatnego BM nie da się cofnąć → nie_karnet
    OK D9 cofnięcie po e-mailu i roczniku
    OK D9 a@x.pl dalej ma płatny BM
    OK D10 kalendarz rocznika testowego: płatny (wiersz rocznika testowego), terminy tylko jego
    OK D10 kalendarz BM bez zmian
    OK D11 BM da się kupić, rocznik oczekujący nie, nieznany nie
    OK D12 nieznany rocznik zatrzymany
    OK D13 przed usunięciem: t44 ma wiersze w dwóch rocznikach
    OK D13 usunięcie konta: oba wiersze nauka_dostep znikają
    OK D14 jedna funkcja cofania (bez starej jednoargumentowej)
    OK Z1 BM: plan.json na plan.zdawalni.pl
    OK Z2 żaden rocznik nie został na plan.skrotbm.pl
    OK Z3 nowy rocznik: adres na plan.zdawalni.pl
    OK Z4 stary host dozwolony, obcy zatrzymany
✓ skrot-v55-seria-zamrozenia.sql
✓ skrot-v55-seria-zamrozenia.sql
    OK Z1 2 dni bez nauki + 2 zamrożenia: oba użyte, zostało 0
    OK Z1 drugie wywołanie: juz, juz (bez zużycia)
    OK Z1 seria w bazie po weekendzie: 1 dzień nauki + 2 zamrożone = 1
    OK Z1 seria po dzisiejszej nauce = 2
    OK Z2 2 dni, 1 zamrożenie: wszystkie albo żaden – brak + brak, ok = false, zamrożenie zostaje (1)
    OK Z2 jeden dzień, 1 zamrożenie: uzyte, zostało 0
    OK Z3 dziś i dzień sprzed 4 dni: za_stary
    OK Z3 pusta lista / 4 dni: bad_days
    OK Z4 dzień z nauką: „nauka”, nic nie zużyte
    OK Z5 nauka_przerwa: 24.12, 1.01, 6.01, 11.11, 18.02 tak; 23.12, 7.01, 12.11 nie
    OK Z5 28.12 (przerwa), ostatnia nauka 23.12: seria czeka = 3
    OK Z5 7.01 (pierwszy dzień zajęć) bez nauki: seria nadal 3
    OK Z5 8.01 bez nauki 7.01: seria 0 (7.01 to zwykły opuszczony dzień)
    OK Z5 nauka 7.01: seria 4 (przerwa nie dodała dni)
    OK Z5 zwykły dzień bez nauki zrywa: 20.12 bez nauki, seria na 19.12 = 0
    OK Z6 1 dzień nauki: za_wczesnie
    OK Z6 2 dni nauki: prezent (nowe), zostało 1
    OK Z6 drugi raz: juz, nadal 1
    OK Z6 jeden wpis prezentu z ceną 0, bez wpisu w księdze monet
    OK Z6 pełny zapas (2/2): pelne, bez wpisu
    OK Z6 2 dni nauki, ale nie z rzędu (seria 1): bez prezentu
    OK Z7 nauka_seria(): ok, seria 2, dzień = dziś
    OK Z8 nauka_zamrozenie_uzyj() nadal istnieje
    OK Z9 anon bez prawa do uzyj_dni i prezentu
    OK Z9 nauka_seria_na i nauka_dzien_nauki niedostępne dla zalogowanych (tylko wewnątrz bazy)
    OK v55: Z1–Z9
✓ test/v55.sql
✓ skrot-v56-dni-nauki.sql
✓ skrot-v56-dni-nauki.sql
    OK D1 XP wczoraj bez punktów → nauka_dni (wczoraj, xp)
    OK D1 bez punktów rankingu
    OK D2 wczoraj tylko czytanie: „nauka”, zamrożenie zostaje (1)
    OK D2 nauka_seria(): wczoraj = dzień nauki, seria 1
    OK D3 nd z dokumentu i XP 0 dziś: żadnego dnia nauki
    OK D4 punkty dziś → jeden wpis (dziś, pkt)
    OK D5 student nie czyta nauka_dni
    OK D5 student nie pisze nauka_dni
    OK D6 jeden wiersz na osobę i dzień
    OK D6 wpisy z nauka_rp sprzed v56 są w nauka_dni
    OK v56: D1–D6
✓ test/v56.sql
```

## Zrzuty
- k1-pon-2zam-przed.png
- k1-pon-2zam-po-nauce.png
- chroni-390-jasny.png
- k3-dzis-przerwa-360-jasny.png
- k3-dzis-przerwa-360-jasny-en.png
- k3-dzis-przerwa-360-ciemny.png
- k3-okno-przerwa-390-jasny.png
- k3-dzis-przerwa-390-jasny.png
- k3-dzis-przerwa-390-jasny-en.png
- k3-dzis-przerwa-390-ciemny.png
- k3-dzis-przerwa-1280-jasny.png
- k3-dzis-przerwa-1280-ciemny.png
- k4-tydzien-360-jasny.png
- k4-tydzien-390-jasny.png
- k4-tydzien-390-ciemny.png
- k4-tydzien-1280-jasny.png
- k4-tydzien-360-jasny-en.png
- k5-karta-zamrozenia-390-jasny.png
- k5-kbuy-390-jasny.png
- k5-karta-zamrozenia-360-jasny.png
- k5-karta-zamrozenia-390-ciemny.png
- k5-karta-zamrozenia-390-jasny-en.png
- k5-oferta-390-jasny.png
- prezent-baner-390-jasny.png
