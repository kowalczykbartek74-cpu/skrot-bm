# Lekcje v4 – etap D (audyt i poprawki 115 lekcji)

Kod etapów A–C jest w `index.html` i `lekcje-v4.js`. Etap D to skrypty (Python, bez zależności poza `anthropic` w D4):

| Krok | Polecenie | Wynik |
|---|---|---|
| D1 eksport | `docs/lekcje-v4/eksport.js` w konsoli na zalogowanej skrotbm.pl, potem rozpakowanie do `scratch/lessons/` | `scratch/lessons/<id>.json` |
| D2 audyt | `python3 scripts/lekcje-audyt.py` | `scratch/audyt-lekcji.md` i `.json` |
| D3 atomy | `python3 scripts/lekcje-atomy.py` | `scratch/lessons-v4/<id>.json` z `lesson.atoms` |
| D4 poprawki | `python3 scripts/lekcje-poprawki.py <id>` (`--na-sucho` bez wysyłania) | `scratch/latki/<id>.json`, tokeny w `<id>.usage.json` |
| D5.1 łatka + walidacja | `python3 scripts/lekcje-latka.py scratch/latki/<id>.json` | `scratch/lessons-v4-poprawione/<id>.json` |
| D5.2 zgodność `gen` | `python3 scripts/lekcje-walidator.py --zgodnosc scratch/lessons-v4-poprawione/*.json` | Python = parser JS (20 losowań) |
| D5.3 wgranie | upsert `materialContent/<id>` jak przy lekcjach z sylabusa – **tylko po zatwierdzeniu pilota (D6)** | |

`scratch/` jest w `.gitignore`. Zasady pisania dla modelu: `docs/lekcje-v4/zasady.md` (sekcja 6 specu).
Kolejność (D6): pilot 1 lekcja z Makroekonomii → OWI → Prawo → Makroekonomia → Podstawy finansów → reszta.
