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
