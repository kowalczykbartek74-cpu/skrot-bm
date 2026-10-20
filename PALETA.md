# Paleta Skrót BM — biało-zielona

Jeden jasny motyw w całej apce (bez trybu ciemnego). Kolory są zdefiniowane raz, w `:root` na górze `index.html`; reszta strony używa tylko zmiennych.

## Zieleń marki

| Zmienna | Kolor | Do czego |
|---|---|---|
| `--green-50` | `#F5F8F6` | tło strony, najechanie na wiersz |
| `--green-100` | `#EAF5EE` | miękkie tło: aktywna zakładka, karta „dziś”, pasek „Kup dostęp”, chipy |
| `--green-200` | `#CFE8D8` | obramowania zielonych elementów, najechanie |
| `--green-400` | `#4CAF72` | kropki, paski postępu, akcenty bez tekstu |
| `--green-600` | `#1A7F45` | **główny kolor**: przyciski, logo, aktywne elementy |
| `--green-700` | `#15703C` | linki, najechanie na przycisk |
| `--green-900` | `#0E5A30` | tekst na jasnozielonym tle |

## Neutralne

| Zmienna | Kolor | Do czego |
|---|---|---|
| `--surface` | `#FFFFFF` | karty, pasek u góry i na dole |
| `--sunk` | `#EEF3F0` | wciśnięte tła, dni wolne w kalendarzu |
| `--line` | `#E1E9E4` | linie i obramowania |
| `--muted` | `#5A6B61` | tekst pomocniczy |
| `--ink` | `#16231B` | tekst główny |

## Kolory, które coś znaczą (używane oszczędnie)

| Zmienna | Kolor | Tło | Kiedy |
|---|---|---|---|
| `--bad` | `#B42318` | `#FDECEA` | egzamin, termin za ≤ 3 dni, błąd |
| `--warn` | `#9A5B00` | `#FFF4DE` | kolokwium/test, termin w tym tygodniu, „z sylabusa” |

Wszystkie pary tekst/tło spełniają WCAG AA (kontrast ≥ 4,5:1).

## Przedmioty

Każdy przedmiot ma własny odcień z rodziny zieleni i morskiego (`PALETTE` w kodzie), żeby dało się je odróżnić bez tęczy kolorów:
`#1A7F45 #2E9E8F #6B9E2E #0F6E6E #4CAF72 #3D7A5C #8AAE3A #1F8FA3 #5C8C46 #2C6B4F #7FB59A #3B9C6E`

## Czcionka

Jedna: **Plus Jakarta Sans** (Google Fonts), wagi 400–800.
