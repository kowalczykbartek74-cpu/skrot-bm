# Pętla UX-3: uwagi dla innych pętli

Rzeczy zauważone poza obszarem lekcji (nie poprawiane tutaj).

- **Pętla 4 (wygląd):** w Powtórkach przycisk „Wybierz przedmiot” w pustym stanie ma 173×43 px (o 1 px poniżej celu 44 px).
- **Pętla 4 (motywy, etap B):** w motywie noc litera poprawnej odpowiedzi (`.opt.right .k`) ma biały tekst na jasnozielonym tle (1,6:1), także w quizie.
- **Pętla 2 (Dziś):** animacja `g-wave` na ekranie Dziś działa przy `html.calm` (zrzut etap-4/runda-1/360-calm-dzis).
- **Pętla 5 (okno awansu `levelUpShow`):** animacje `lp-pop` odznaki w oknie „Awans!” (`.lvup-burst .rk-badge.big`, `.rk-new`) działają przy reduced-motion i `html.calm`. Pętla 3 zmieniła tylko moment pokazania okna (finał lekcji), nie jego treść.
- **Pętla 2/5 (`lpLevelBar`):** plakietka „Awans!” (`.rk-new`) ma 11,8 px i w ciemnym zielonym jasny tekst na limonce (1,4:1); na ekranie końca lekcji pętla 3 nadpisuje kolor tekstu na `--h-lime-ink`.
