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

## Motyw „Nocny rejs” (nagroda za poziom 5)

Odblokowuje się po zdobyciu **poziomu 5 (Ogarnięty, 1000 XP)** — stała `SEA_LEVEL` w `index.html`. Raz odblokowany zostaje na zawsze (XP nie spada; zapamiętane też w `localStorage` jako `skrot-sea-ok`). Starosta widzi go zawsze. Włącza się w **Więcej → Ty**; przed odblokowaniem w tym miejscu jest kłódka z brakującym XP, a w oknie „Poziomy i rangi” przy poziomie 5 widać nagrodę. W chwili zdobycia poziomu wyskakuje okno „Odblokowano motyw Nocny rejs” z przyciskiem „Włącz motyw”.

Inspiracja: nocne morze, kremowo-złote żagle w świetle, księżyc nad horyzontem, mgła.

| Rola | Kolor |
|---|---|
| tło strony (niebo nocy) | `#070D18` → `#04080F` |
| karty | `#0E1828` |
| wciśnięte tła | `#0A1322` |
| linie | `#2A3B56` |
| tekst główny (kremowy żagiel) | `#F3EADB` |
| tekst pomocniczy | `#BAC4D3` |
| akcent: złoto żagla | `#E2B66E` (najechanie `#F0C886`) |
| tekst na złotym przycisku | `#0A1220` |
| światło księżyca (błękit) | `#6F9CC9` |
| dobrze / uwaga / źle | `#8BD5B0` / `#FFBE7A` / `#FF9A90` |

Wszystkie pary tekst/tło mają kontrast ≥ 7,9:1.

Wzory: delikatne linie fal zamiast kratki, złota poświata w prawym górnym rogu zamiast słojów, mgła w lewym dolnym rogu, na dole ekranu horyzont z falami, księżycem z odbiciem i małą złotą żaglówką, która powoli przepływa (zatrzymuje się przy „Mniej animacji”).

Jak działa: zmienne w `html[data-theme="sea"]` + skrypt `themeFx`, który w kolorach wpisanych na sztywno odwraca jasność (białe tła → granat, czarny tekst → krem), a zielenie zamienia na złoto. Reguły z `data-theme=` w selektorze skrypt pomija, więc kolory samego motywu się nie psują.
