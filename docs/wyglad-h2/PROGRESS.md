# Wygląd H2 – cała strona w stylu H (jasny i ciemny zielony) – postęp

Zlecenie (Bartek, 16.11.2026): cała strona w stylu H, najpierw tylko jasny i ciemny zielony motyw (reszta bez zmian),
płynnie, czytelnie, estetyka Duolingo, dużo animacji. Zasady jak wcześniej: jedna zmiana (etap) na iterację, ocena osobnego
bota po każdej, zielono = ≥ 8/10, poniżej powtarzam; commit po zielonym; stop po 5 nieudanych próbach albo gdy ten sam błąd wraca 2×.
Decyzje domyślne (pkt 9 planu): czcionka Plus Jakarta (bez nowego pliku), ścieżka tematów – tak, dźwięki – nie, emoji→SVG w nawigacji i kartach.
Gałąź wyglad/h2, worktree ~/skrot-bm-h2. Bez wdrożenia na zdawalni.pl do decyzji Bartka.
Cały nowy CSS pod html:not([data-theme]); testy: docs/gry/test/h2-*.mjs (wspólne: h2-lib.mjs, w tym pomiar fps przy CPU 4×).

## Etapy

### Etap 1 – fundament – ZALICZONY 8/10 (próba 2; próba 1: 6,5/10)
Paleta jasnego i ciemnego zielonego (--h-*), biblioteka ruchu (h-rise/pop/hop/shake/fill/shine/flame/sheet/confetti),
wejście ekranu raz: h2Enter() w render() (klasa .h-ent na <main> przez 1,4 s od zmiany adresu, ujemne --h-el przy
ponownym renderze = bez migania, backwards + czasomierz zdejmuje klasę). Ciemny: jasny akcent z ciemnym tuszem (22 reguły),
obrysy pól ≥ 3:1 (--h-field). Test h2-etap1.mjs 25/25, ~53 fps przy CPU 4×.
Zasady na kolejne etapy (z oceny): nowe reguły z tekstem na akcencie → var(--accent-ink), nie #fff; elementy fixed/sticky
w sekcjach <main> sprawdzać w oknie 1,4 s (translate tworzy blok zawierający); dopisać test reduced-motion/html.calm.

### Etap 2 – elementy bazowe – ZALICZONY 8/10 (próba 2; próba 1: 7/10)
Przyciski 3D (obrys 2px, brzeg --h-edge, wciśnięcie), karty .panel/.list/.empty/.modal (dół 5px; karta w karcie 2px),
.seg jako klawisze, pola .input z pierścieniem fokusu, .notice, toast (sprężyste wejście), okno na telefonie jako arkusz
(88dvh, uchwyt sticky, wejście i zamykanie z animacją; zamykane okno poza #layer, inert, fokus wraca do przycisku),
puste stany ze Stasiem (SVG w ::before, tylko zwykłe .empty), pole dotyku małych przycisków ≥ 44 px. Test h2-etap2.mjs 33/33, ~60 fps.
Na później: #main .gs2 .seg.pick bez stylu H2; tokeny --h-red-edge/--h-acc-edge zamiast color-mix.

### Etap 3 – nawigacja i nagłówek – ZALICZONY 8,5/10 (próba 2; próba 1: 7/10)
Zakładki: podskok ikony (telefon) / przycisku (komputer) tylko przy zmianie zakładki, plakietka wyskakuje przy zmianie liczby
(okno 0,6 s z ujemnym opóźnieniem, bez wyskoku w pierwszych 3 s wczytywania); aktywna zakładka w zielonej pastylce; pasek .bar 2px;
poziom, monety, seria jako pigułki 3D ≥ 44 px; moneta i płomień SVG (h2Ico) tylko w zielonych motywach; płomień migocze przy serii > 0;
połysk monety raz na sesję / przy zmianie liczby (okno 7,5 s). Test h2-etap3.mjs 48/48, ~50 fps przy przełączaniu zakładek.
Na później: plakietka na #moreBtn bez .h-pop; --h-edge w ciemnym słabo widoczny; h2Ico w otwartych oknach przy zmianie motywu.

### Etap 4 – lekcja i quiz (odtwarzacz) – ZALICZONY 8/10 (próba 4; wcześniej 7, 6, 7)
Odtwarzacz: zamknięcie i pigułki 3D, pasek postępu 16 px z połyskiem i limonkowym bieżącym segmentem, karty z grubszym dołem,
panel odpowiedzi ok/no z obrysem, „+XP” jako limonkowa pastylka, kafelki statystyk 3D (2×2 przy 4 na telefonie), moneta SVG,
Staś na wszystkich ekranach końcowych z nastrojem wg wyniku, liczenie liczb w górę (czytnik dostaje wynik od razu, html.calm bez),
przygaszone gwiazdki (role=img), jeden główny przycisk na końcu, bez konfetti przy słabym wyniku; górny pasek mieści się w 375 px.
Test h2-etap4.mjs 33/33, ~62 fps. Na później (logika, nie wygląd): 1 gwiazdka za 0/15; mianownik „z pierwszej próby” (kroki zamiast pytań);
„Zrobione ✓” z ptaszkiem w tekście; pasek egzaminu nie sprawdzony w 375 px.

### Etap 5 – Powtórki – NIEZALICZONY, STOP (próby: 7, 7,5, 7)
Zrobione (w gałęzi, bez zielonej oceny): karta „Dziś do powtórki” w pomarańczowym akcencie 3D, pudełka 3D (na telefonie 4+3,
bez dzielenia wyrazów), fiszka jako karta 3D z zielonym tyłem i stosem pod spodem, 4 oceny jako kolorowe klawisze 3D
(wciśnięcie „w brzeg”, wybrana z ✓, reszta przygaszona), kafle „Powtarzaj grając” 3D. Test h2-etap5.mjs 23/23, ~63 fps.
Stop wg zasady „ten sam błąd wraca 2×”: konflikt stylu H z wybieranym przez ucznia wyglądem fiszek (kf-*):
próba 2 – !important przebijał kf-*; próba 3 – po usunięciu nadal reguła H (0,5,1) wygrywa z kf-* (0,5,0) w ciemnym,
a w jasnym obrys H nadpisuje obrys kf (kf-nocny/kreda dostaje zielony obrys).
Co blokuje: nic trudnego – poprawka to wykluczenie `.lp:not([class*="kf-"])` w regułach tyłu/obrysu fiszki + test kf-* w obu
motywach. Pozostałe uwagi z próby 3: ocena gestem bez .right (znaleźć przycisk po g), słabo widoczny stos w ciemnym, słaby test
„wybrane Nie pamiętam zostaje czerwone”.
Uwaga o commitach: na gałęzi są też commity „przed oceną” (WIP) dla etapów 3–5; zielone etapy 1–4 mają osobne commity z oceną.
Etapy 6–10 (przedmioty i ścieżka, terminy, gry, więcej, szlif) nie zaczęte.

### Etap 5 – Powtórki – ZALICZONY 8/10 (wznowiony na prośbę Bartka; próby: 7, 7,5, 7 [stop], 7,5, 8)
Domknięte: reguły karty fiszki tylko dla `.lp:not([class*="kf-"])` (wygląd fiszek ucznia wygrywa), przy kf-* gruby dół 3D
i stos w kolorach kf, zaznaczenie oceny osobną klasą .h2-picked tylko w zielonych motywach (także przy ocenie gestem).
Test h2-etap5.mjs 36/36 (w tym kf-papier/nocny/kreda w obu motywach i motyw różowy), ~62 fps.
Na szlif (etap 10): karta „Na dziś” (hintPanel) płaska z gradientem; pudełka 4+3 – pusta kolumna; mapa postępów (kwadraty, legenda).

### Etap 6 – Przedmioty i ścieżka tematów – ZALICZONY 8/10 (próba 2; próba 1: 7/10)
Kafle przedmiotów i okładka jako karty 3D z dołem w kolorze przedmiotu, grubszy pasek postępu; kurs przedmiotu jako ścieżka:
okrągłe przystanki 3D (64 px) ułożone falą (przesuwa się tylko kółko, tytuły w jednej linii), zrobione zielone, następny
limonkowy z poświatą, Stasiem i pigułką „Teraz” (+ „, następna” dla czytnika), zablokowane szare; przystanki wyskakują po kolei raz.
Test h2-etap6.mjs 27/27, ~62 fps. Na później: „Teraz” zależy od motywu w chwili rysowania; „rozdz. undefined” gdy brak bookRef (dane).

### Etap 7 – Terminy i Kalendarz – ZALICZONY 8/10 (próba 2; próba 1: 7/10)
Karta „Najbliższe” 3D z licznikiem dni w kółku, wiersze terminów i kafle „Dziś” jako karty 3D z płaskim paskiem koloru (inset),
filtry 3D, bez pustej kolumny przy braku odhaczania (tylko z :has, bez :has zostaje stary układ), meta-linia bez kropek z datą
pogrubioną; kalendarz: dni jako małe klawisze (na telefonie cieńsze), dziś z limonkowym pierścieniem ::after pulsującym 3×
(tylko opacity), wybrany dzień zielony, zaliczenia z obrysem w kolorze typu, karty zaliczeń 3D. Po ocenie dopięte: pierścień
fokusu i błysk .tl razem z paskiem, .day.sel bez cienia bazowego, odstęp w „Dziś”. Test h2-etap7.mjs 47/47, ~61 fps.
Na szlif: limonkowy pierścień „dziś” słabo widoczny na jasnym tle (trzyma go obrys accent); siatka miesiąca na 375 px do obejrzenia.

### Etap 8 – Gry, Hasło dnia, ranking, sklep – ZALICZONY 8/10 (próby: 6, 7, 7, 8)
Gry: kafle 3D, ikony w kolorowych klockach 3D (zielony/pomarańczowy/niebieski), wskakują po kolei, na telefonie zwarte
(ikona | tytuł | „Graj”, opis pod spodem na całą szerokość). Hasło dnia: kafle i klawisze jako klawisze 3D (grubszy tylko dół,
górne obwódki dla daltonistów bez zmian), wpisana litera wskakuje (tylko nowo wpisana), dół pigułki i podpowiedzi cieniem
(plansza + klawiatura nadal mieszczą się na niskim telefonie). Ranking: wiersze-karty, podium jako medale 3D, „Ty” limonkowe,
miejsce w limonkowym kółku. Sklep: zakładki i karty 3D, pierścień wskazanej karty z podskokiem (zostaje przy „Mniej animacji”),
zadanie tygodnia limonkowe z lokalnymi kolorami (czytelne w ciemnym); na telefonie motywy w 2 kolumnach, podgląd z obrazka,
jeden przycisk w każdej karcie („🔒 Poziom N” tylko w zielonych na telefonie), krótkie notki z liczbą XP, zwarte zadania dnia.
Test h2-etap8.mjs 85/85 (starosta, płatne, darmowe, 360/375/1280), ~60 fps. Stary etap8.mjs: 1 znany błąd (rozmiar gry.js), sprzed etapu.
Na szlif: kafle kshop (.kcard) – atrapa bez katalogu, nieobejrzane; obrys fokusu na obrazku przy kolorowych podglądach.

### Etap 9 – Więcej, profil, ustawienia, logowanie – ZALICZONY 8/10 (próby: 7, 8)
Więcej: wiersze, kafle i profil jako karty 3D, ikony w kolorowych kafelkach (zielony/pomarańczowy/niebieski), kafle wskakują
po kolei; na telefonie zwarte (ok. 2050 px zamiast 2270), opisy do 2 linii (kafle do 3) bez ucinania w pół słowa.
Ustawienia: zakładki jako pigułki 3D w jednym rzędzie od 360 px (PL i EN), kafle motywów 3D (na telefonie 3 w rzędzie,
samotny ostatni na całą szerokość), wybrany motyw podskakuje, przełącznik większy z gałką 3D i sprężynką. Profil: gablotka
odznak 3D. Logowanie (zawsze jasne): przyciski, karta próby, „Zobacz przykładową lekcję”, karty kierunku, „Zmień” i zakładki
„Kod z maila / Hasło” 3D; fokus ciemnym obrysem; calm/reduced-motion także tu. Globalnie: brzeg 3D w ciemnym jaśniejszy
(--h-edge #36503F zamiast #0A130E), bo był niewidoczny; testy H2 1–8 po zmianie zielone.
Test h2-etap9.mjs 92/92, ~62 fps. Stary ustawienia.mjs pada na `.staro .more-row` (2 wiersze od Panelu kierunków) – błąd testu.
Na szlif: brzeg pustych kafli Hasła w ciemnym słabo widoczny.

### Etap 10 – Szlif – ZALICZONY 8/10 (próby: 7, 8)
Ikony gier jako płaskie SVG w stylu H (Fruń, Pary, Przejdź, Drabina, Hasło; „Graj i powtarzaj” – pad) w #/gry, w „Powtarzaj
grając” (kolorowe kafelki pod ikoną) i w Więcej; w innych motywach emoji bez zmian. Mapa postępów: kwadraty tematów 3D
(24 px) w kolorach H, „dodatkowe” i zablokowane bez zmian w znaczeniu, legenda w jednym rzędzie, kwadraty wskakują przy wejściu.
Karta „Na dziś” jako limonkowa karta 3D. Plakietka na przycisku Więcej wskakuje jak w dolnym pasku. „Teraz” sterowane CSS
(bez zależności od motywu w chwili rysowania). Pierścień „dziś” na jasnym ciemniejszy, puste kafle Hasła z widocznym dołem
w ciemnym, plakietki terminów w Przedmiotach na telefonie zwarte. Test h2-etap10.mjs 24/24, ~62 fps; testy H2 1–9 zielone.

## KONIEC H2 (16.11.2026) – etapy 1–10 zaliczone, gałąź wyglad/h2, NIE wdrożone (czeka na decyzję Bartka).
Zostawione na później: ikony SVG w h2Ico liczone przy rysowaniu (po zmianie motywu przerysowanie załatwia themePaint);
kafle kshop (.kcard) nieobejrzane (atrapa bez katalogu); karta „Dziś do powtórki” w ciemnym trochę mętna;
stare testy: ustawienia.mjs (`.staro .more-row` = 2 od Panelu kierunków), etap8.mjs (rozmiar gry.js), etap7.mjs (motyw różowy
w atrapie, „próba” w EN) – błędy sprzed H2.

## WDROŻONE 16.11.2026 na zdawalni.pl (main 5930b7a, fast-forward).
