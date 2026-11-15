# Wygląd H2 – cała strona w stylu H (jasny i ciemny zielony) – postęp

Zlecenie (Bartek, 16.11.2026): cała strona w stylu H, najpierw tylko jasny i ciemny zielony motyw (reszta bez zmian),
płynnie, czytelnie, estetyka Duolingo, dużo animacji. Zasady jak wcześniej: jedna zmiana (etap) na iterację, ocena osobnego
bota po każdej, zielono = ≥ 8/10, poniżej powtarzam; commit po zielonym; stop po 5 nieudanych próbach albo gdy ten sam błąd wraca 2×.
Decyzje domyślne (pkt 9 planu): czcionka Plus Jakarta (bez nowego pliku), ścieżka tematów – tak, dźwięki – nie, emoji→SVG w nawigacji i kartach.
Gałąź wyglad/h2, worktree ~/skrot-bm-h2. Bez wdrożenia na zdawalni.pl do decyzji Bartka.
Cały nowy CSS pod html:not([data-theme]); testy: docs/gry/test/h2-*.mjs (wspólne: h2-lib.mjs, w tym pomiar fps przy CPU 4×).

## Etapy
