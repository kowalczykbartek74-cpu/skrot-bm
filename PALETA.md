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

## Odcienie pomocnicze (delikatna wariacja)

| Zmienna | Kolor | Do czego |
|---|---|---|
| `--lime-100` | `#F3F9DD` | ciepła końcówka gradientu karty „dziś” |
| `--lime-400` | `#B7DB4A` | falka pod tytułem, paski na „Kup dostęp”, koniec paska postępu |
| `--teal-100` | `#E3F3F1` | miękkie tło (zapas) |
| `--teal-600` | `#0F6E6E` | pasek marki u góry |
| `--mint-100` | `#E6F7EE` | początek gradientu karty „dziś” |

## Motyw „zeszyt w kratkę” i „słoje”

- jeden powtarzalny wzór: **słoje** (koncentryczne linie z rogu) – w prawym górnym rogu strony (zielone), w lewym dolnym przy stopce (limonkowe), w karcie „Teraz zrób to”, w karcie zajęć, w Powtórkach i w pustych stanach
- **falka** limonkowa pod tytułem każdego głównego ekranu (Dziś, Przedmioty, Powtórki, Terminy, Więcej), miętowa nad stopką
- nagłówki paneli z krótką zielono-limonkową kreską z lewej

- tło strony: drobna zielona kratka (24 px) z mocniejszą linią co 5 kratek
- pasek marki u góry: zielony → morski → jasnozielony → limonka
- każdy przedmiot ma okładkę z własnym wzorem (10 wzorów: kropki, skośne pasy, kratka, fale, szachownica, słoje, zygzak, linie z marginesem, groszki, prążki) w swoim odcieniu i skrót literowy (np. AM)
- karta „dziś”: miętowo-limonkowy gradient i słoje w rogu; fiszki na papierze w kratkę; „Kup dostęp” w delikatne paski

## Neutralne

| Zmienna | Kolor | Do czego |
|---|---|---|
| `--surface` | `#FFFFFF` | karty, pasek u góry i na dole |
| `--sunk` | `#EEF3F0` | wciśnięte tła, dni wolne w kalendarzu |
| `--line` | `#BFCEC5` | linie i obramowania |
| `--muted` | `#1F2D25` | tekst pomocniczy |
| `--ink` | `#050A07` | tekst główny |

## Kolory, które coś znaczą (używane oszczędnie)

| Zmienna | Kolor | Tło | Kiedy |
|---|---|---|---|
| `--bad` | `#8C140C` | `#FDECEA` | egzamin, termin za ≤ 3 dni, błąd |
| `--warn` | `#6A3B00` | `#FFF4DE` | kolokwium/test, termin w tym tygodniu, „z sylabusa” |

Wszystkie pary tekst/tło spełniają WCAG AA (kontrast ≥ 4,5:1).

## Przedmioty

Każdy przedmiot ma własny odcień z rodziny zieleni i morskiego (`PALETTE` w kodzie), żeby dało się je odróżnić bez tęczy kolorów:
`#1A7F45 #2E9E8F #6B9E2E #0F6E6E #4CAF72 #3D7A5C #8AAE3A #1F8FA3 #5C8C46 #2C6B4F #7FB59A #3B9C6E`

## Czcionka

Jedna: **Plus Jakarta Sans** (Google Fonts), wagi 400–800.

## Kształt

- **Przyciski** (`.btn`): prostokąt z rogami **12 px**. Główny przycisk ekranu (`.sk-cta`, `.sk-start`): rogi **14 px**, wysokość min. 54 px na telefonie i 48 px na komputerze. Bez „pigułek” na przyciskach.
- **Chipy** (`.chip`, `.sk-chip`) i znaczniki zostają okrągłe.
- Karty: 22 px (`.sk-card`, panele), wiersze list i kafelki 14–16 px, kalendarz 12 px.

## Logo (pliki w `icons/`)

| Plik | Co to | Gdzie |
|---|---|---|
| `logo-mark.png` | książka ze strzałką (sam znak) | pasek u góry strony, nagłówek regulaminu i polityki prywatności |
| `logo.png` | książka + napis „Skrót BM” | materiały do pobrania, posty, prezentacje |
| `emblem.png` | heksagon z monogramem SB | ekran z kodem dostępu (przed startem) |
| `icon-*.png`, `apple-touch-icon.png`, `favicon*`, `icon.svg` | ikona aplikacji: kartka ze strzałką na ciemnej zieleni `#14522E` | karta przeglądarki, ekran główny telefonu |
| `og.png` | logo na kratce (1200×630) | podgląd linku na Messengerze, WhatsAppie, FB |

Źródło: grafiki z Higgsfield (24.10.2026), wycięte na przezroczyste tło.

## Motyw „Kokardka” (nagroda za poziom 5)

Włączany w Więcej (`html[data-theme="bow"]`, `localStorage skrot-theme = "bow"`). Do poziomu `BOW_LEVEL` (5, czyli 1000 XP) wiersz jest zablokowany i pokazuje, ile XP brakuje; starosta ma go zawsze. Po wczytaniu postępów `pinkTheme.enforce()` wyłącza Kokardkę, jeśli poziom jest za niski. Przy awansie na poziom 5 pokazuje się okno „Odblokowano motyw Kokardka”.

| Zmienna | Kolor | Do czego |
|---|---|---|
| `--paper` | `#FFF9F8` | kremowe tło strony |
| `--green-100` | `#FBE7EC` | pudrowy róż: miękkie tła, chipy |
| `--green-200` / `--line` | `#F3C9D5` / `#EBC7D2` | obramowania |
| `--green-400` | `#E58BA6` | akcenty bez tekstu |
| `--green-600` | `#A8325D` | główny kolor, przyciski (satynowy gradient) |
| `--green-900` | `#7A2445` | tekst na różowym tle |
| `--ink` / `--muted` | `#2A1219` / `#5A2E3C` | tekst główny i pomocniczy |

Kontrast: biały na `#A8325D` 6,4:1, `#7A2445` na `#FBE7EC` 8,2:1, `#5A2E3C` na tle 10,7:1.

Wzory (własne SVG w zmiennych `--bow-*` na `:root`): kokardki z tiulu i serduszka w tle, koronkowy brzeg pod górnym paskiem, bukiet (storczyk, lilia, kwiat wiśni) w konturze w prawym górnym rogu, koronkowa serwetka w lewym dolnym i w karcie „Teraz zrób to”. Tytuły ekranów kursywą Playfair Display (wczytywana tylko przy tym motywie) z wstążką i kokardką. W rogu kokardka 🎀 z dobrym słowem, bez śladu za kursorem.
