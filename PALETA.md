# Paleta Zdawalni — wygląd H2 (jasny i ciemny zielony)

Źródło prawdy to blok zmiennych `--h-*` w `index.html` (sekcja „Wygląd H2”, ok. linia 4430) i `wyglad-ux.css` (pętla UX-4).
Nowe reguły używają **zmiennych**, nie kolorów wpisanych na sztywno. Motywy ze sklepu (niżej) mają własne wartości.

## Dwa warianty zieleni

Przełącznik w Ustawieniach → Wygląd: `html[data-green="light"|"dark"]` (domyślnie zgodnie z systemem, `localStorage skrot-green`).

| Zmienna | Jasny | Ciemny | Do czego |
|---|---|---|---|
| `--h-paper` | `#F7F8F4` | własna ciemna | tło strony (z drobną kratką) |
| `--h-card` | `#FFFFFF` | własna ciemna | karty, okna, toast |
| `--h-line` | `#E1E8DD` | — | obrysy kart |
| `--h-edge` | `#BFCBBA` | — | dolna krawędź 3D przycisków i kart |
| `--h-ink` | `#10231A` | jasny tusz | tekst główny |
| `--h-muted` | `#3E5046` | jasny pomocniczy | tekst pomocniczy (≥ 4,5:1 na tle) |
| `--h-acc` / `--h-acc-edge` | `#1A7F45` / `#0F5A2F` | jasny akcent | główny przycisk, aktywne elementy |
| `--h-acc-soft` | `#DDF3D0` | — | miękkie tło akcentu |
| `--h-lime` / `--h-lime-edge` | `#CDF25E` / `#8FB52A` | — | limonkowy główny przycisk na Dziś (`primary-hero`), liczby na ciemnym panelu |
| `--h-orange` / `-soft` | `#B35400` / `#FFE8CC` | — | powtórki, ostrzeżenia |
| `--h-blue` / `-soft` | `#1C6FB8` / `#E3F0FD` | — | informacje, kafle |
| `--h-red` / `-soft` | `#A3261E` / `#FDE4E1` | — | błędy, termin ≤ 3 dni, toast błędu |

Panel Stasia na Dziś: `#133B2A` / `#1D4A36` w obu wariantach (biały i jasnozielony tekst, limonkowe liczby).
Moneta: `#FFC83D` / `#E0A20F` (ikona `coin`). Kontrast: każdy tekst ≥ 4,5:1 (duży ≥ 3:1), mierzony testami `docs/gry/test/*`.

Zmienne bazowe sprzed H2 nadal są w `:root` (używają ich motywy ze sklepu i starsze reguły); testy `tests/tresci.test.js` pilnują, żeby te wartości zgadzały się z kodem i miały kontrast AA.

## Zieleń marki (zmienne bazowe `:root`, pod spodem H2)

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

## Czcionki (z repo, bez Google Fonts)

Pliki w `fonts/` (zmienne woff2, łaciński + łaciński rozszerzony), `@font-face` w `wyglad-ux.css`, preload tylko `pjs-latin.woff2`.

- **Bricolage Grotesque 700** – wszystkie `h1`, `h2`, `h3` i nagłówki sekcji (`--f-head`).
- **Plus Jakarta Sans 400–800** – reszta tekstu (`--f-display`).
- Czcionki zastępcze o dopasowanych wymiarach (`PJS-fallback`, `BG-fallback`), żeby tekst nie przeskakiwał przy wczytaniu.
- Motywy: Cormorant Garamond i Playfair Display, pobierane dopiero przy aktywnym motywie.

Skala: **12 / 14 / 16 / 18 / 22 / 28 / 36 px** (`--fs-xs` … `--fs-3xl`), nic poniżej 12 px (poza znakiem wodnym).
Tytuł ekranu 28, nagłówek sekcji 18, tytuł karty 16; na Dziś powitanie 22, tytuł lekcji 28.

## Kształty

- Karty bez obrysów lub z cienkim obrysem i dolną krawędzią 3D (4–5 px), duże promienie (22–32 px).
- Przyciski: 3D z dolną krawędzią, wciśnięcie „w krawędź”; główny zielony, na Dziś limonkowy.
- **Pigułki (999 px) dla chipów, filtrów i plakietek**; pole dotyku każdego przycisku ≥ 44×44 px (małe przyciski poszerzone przez `::after`).
- Pomoc „?”: jeden komponent `.help-btn` (32 px, pole 44 px) w wierszu tytułu po prawej, otwiera okno „Jak działa …”.
- Toast: do 420 px szerokości, nad dolną nawigacją, czas zależny od długości, błąd jako `role=alert` z „Ponów”.

## Ikony

SVG w jednym stylu: `viewBox 0 0 24 24`, `stroke="currentColor"`, kreska 2–2,2, zaokrąglone końce (`H2_ICO`, `ikony-ux.js`).
Bez emoji jako ikon interfejsu (emoji tylko w treściach pisanych przez ludzi). Wyjątek marki: `coin`, `flame`, `miecze` i płaskie ikony gier.

## Przedmioty

Każdy przedmiot ma własny odcień z rodziny zieleni i morskiego (`PALETTE` w kodzie):
`#1A7F45 #2E9E8F #6B9E2E #0F6E6E #4CAF72 #3D7A5C #8AAE3A #1F8FA3 #5C8C46 #2C6B4F #7FB59A #3B9C6E`

## Logo (pliki w `icons/`)

| Plik | Co to | Gdzie |
|---|---|---|
| `logo-mark.png` | książka ze strzałką (sam znak) | pasek u góry, logowanie, regulamin i polityka prywatności |
| `odznaka-zdawalni.svg` | heksagon ze znakiem, napisem ZDAWALNI i trzema gwiazdkami (1,3 KB) | odznaka „Mistrz Zdawalni” po teście przewodnika |
| `icon-*.png`, `apple-touch-icon.png`, `favicon*`, `icon.svg` | ikona aplikacji | karta przeglądarki, ekran główny telefonu |
| `og.png` | logo na kratce (1200×630) | podgląd linku |
| `logo.png`, `emblem.png` | stare grafiki z nazwą „Skrót BM” | **nieużywane w aplikacji** (do usunięcia po decyzji Bartka) |

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

## Motyw „Nenufary” (nagroda za poziom 7)

Włączany w Więcej (`html[data-theme="lilia"]`, `localStorage skrot-theme = "lilia"`). Do poziomu `LILIA_LEVEL` (7, czyli 2100 XP) wiersz jest zablokowany i pokazuje, ile XP brakuje; starosta ma go zawsze. `pinkTheme.enforce()` wyłącza go po wczytaniu postępów, jeśli poziom jest za niski. Przy awansie na poziom 7 pokazuje się okno „Odblokowano motyw Nenufary”.

| Zmienna | Kolor | Do czego |
|---|---|---|
| `--paper` | `#FAF8FE` | tło strony |
| `--green-100` | `#EFE8FA` | miękki fiolet: tła, chipy |
| `--green-600` | `#6A3DAE` | główny fiolet, przyciski |
| `--green-900` | `#3A1D6B` | tekst na jasnym fiolecie |
| `--lime-400` | `#E58BC9` | lotosowy róż (akcenty, falka) |
| `--teal-600` | `#4A58B0` | barwinek |
| `--sun` | `#E9C97A` | ciepła poświata zachodu |
| `--ink` / `--muted` | `#170D29` / `#3B2E57` | tekst główny i pomocniczy |

Wzory (własne SVG): liście lilii i kwiat lotosu zamiast kratki, „malowane” plamy nieba w tle, zawirowanie nieba w prawym górnym rogu, kręgi na wodzie przy stopce, pasek u góry w kolorach zmierzchu. W rogu lotos 🪷 ze spokojnym słowem, bez śladu za kursorem.

## Motyw „Łąka” (nagroda za poziom 5)

Włączany w Więcej → Ty, odblokowuje się na poziomie 5 „Ogarnięty” (1000 XP); próg to stała `MEADOW_LV` w `index.html`.
Na podstawie zdjęć: złota godzina, mgła z promieniami słońca, owce na wzgórzach, dmuchawce.

| Zmienna | Kolor | Do czego |
|---|---|---|
| `--paper` | `#F8F4E7` | ciepłe tło (mgła o zachodzie) |
| `--surface` | `#FFFDF7` | karty |
| `--accent` | `#3F6B22` | mech: przyciski, aktywne elementy (biały tekst 6,3:1) |
| `--lime-400` | `#D2A93E` | złoto: paski postępu, kreski |
| `--ink` / `--muted` | `#16200F` / `#3A4530` | tekst (15:1 i 9:1 na tle) |

Wzór: dmuchawce i źdźbła w tle zamiast kratki, promienie słońca z prawego górnego rogu zamiast słojów, wzgórza z dwiema owcami przyklejone na dole ekranu, kępka trawy pod tytułami. Owca w rogu (klik = dobre słowo i dmuchawce), kilka dmuchawców powoli przelatuje przez ekran. „Mniej animacji” wyłącza cały ruch.

## Motyw „Nocny rejs” (nagroda za poziom 8)

Odblokowuje się po zdobyciu **poziomu 8 (Strateg, 2800 XP)** — stała `SEA_LEVEL` w `index.html`. Raz odblokowany zostaje na zawsze. Starosta widzi go zawsze. Włącza się w **Więcej**; przed odblokowaniem w tym miejscu jest kłódka z brakującym XP, a w oknie „Poziomy i rangi” przy poziomie 8 widać nagrodę. W chwili zdobycia poziomu wyskakuje okno „Odblokowano motyw Nocny rejs” z przyciskiem „Włącz teraz”.

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

Jak działa: zmienne w `html[data-theme="sea"]` + skrypt `seaTheme`, który w kolorach wpisanych na sztywno odwraca jasność (białe tła → granat, czarny tekst → krem), a zielenie zamienia na złoto. Reguły z `data-theme=` w selektorze skrypt pomija, więc kolory samego motywu się nie psują.
