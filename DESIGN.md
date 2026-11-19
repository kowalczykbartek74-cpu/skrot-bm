# Zdawalni: zasady wyglądu

Cel: apka wygląda jak zrobiona przez jeden zespół, a nie złożona z wielu pomysłów. Prosto i czytelnie, jak w Duolingo: jedna czcionka, jeden przycisk, jedna skala, dużo pustego miejsca.
Kolory i kontrast: [PALETA.md](PALETA.md) (pilnuje go `tests/tresci.test.js`). Plan zmian i makiety „przed i po”: raport z 19.11.2026.

## Co zostaje, bo to nasze

- **Staś** jest jedyną ilustracją: wita, cieszy się z serii, ale nie jest ozdobnikiem na każdym ekranie.
- **Przyciski z krawędzią** (`box-shadow: 0 4px 0 <ciemniejszy kolor>`) jak w Duolingo. To jedyny cień bez rozmycia w apce.
- **Ciemna zieleń + limonka.** Limonka tylko tam, gdzie jest nagroda albo start dnia („Zaczynam”), nigdzie indziej.
- Nasz sposób pisania: krótko, po ludzku, bez wielkich liter i etykiet nad nagłówkami.

## Siedem zasad

1. **Jedna czcionka: Onest** (400–800, `fonts/onest-*.woff2`). Zmienne: `--f-display` i `--f-head` (to ta sama czcionka). Wyjątek: motywy ze sklepu (Playfair, Cormorant) w swoich tytułach.
2. **Jedna skala pisma**, zawsze przez zmienne (w `rem`, więc szanuje ustawienia telefonu):

   | Zmienna | px | Do czego |
   |---|---|---|
   | `--fs-xs` | 12 | podpisy, etykiety chipów (najmniejszy tekst w apce) |
   | `--fs-s` | 14 | tekst pomocniczy, przyciski małe |
   | `--fs-m` | 16 | tekst główny, przyciski |
   | `--fs-l` | 18 | nagłówki sekcji, tytuły kart większych |
   | `--fs-xl` | 20 | powitanie, ważne liczby |
   | `--fs-2xl` | 24 | tytuł karty głównej |
   | `--fs-3xl` | 28 | tytuł ekranu |
   | `--fs-4xl` | 32 | duże liczby (wynik, seria) |
   | `--fs-5xl` | 40 | tylko ekran wejścia |

   Nie wpisujemy `font-size: .86rem` ani `13px`. Rozmiary emoji i ikon (> 40 px) to nie tekst i mogą zostać.
3. **Trzy zaokrąglenia:** `--r-s` 10 px (chipy kwadratowe, pola, małe przyciski), `--r-m` 16 px (przyciski, kafle), `--r-l` 22 px (karty, okna). Pigułki `999px` tylko dla chipów i pasków postępu, koła `50%` dla awatarów.
4. **Trzy przyciski:** główny (zielony z krawędzią), drugi (biały, ramka 2 px + krawędź), link (sam tekst). Limonkowy główny tylko na start dnia i nagrody.
   W kodzie: `.btn.primary`, `.btn`, `.btn.ghost` (+ `.small`, `.danger`). Jedna definicja: blok „Wygląd pro, etap 2” w `index.html` z prefiksem `:where(html:not([data-theme]))`, więc ma szczegółowość samego `.btn`. Nie dopisuj przyciskom własnych kolorów, cieni ani zaokrągleń w kontekście; kontekst ustawia tylko układ (szerokość, odstępy). Krawędź 3D (`0 4px 0` albo gruby dolny brzeg) mają tylko rzeczy do wciśnięcia: przyciski, odpowiedzi, chipy, kafle.
5. **Płaskie karty:** białe tło, ramka 2 px `--h-line`, bez cienia z rozmyciem, nigdy karta w karcie. Kolorowy pasek z lewej (`border-left` > 1 px) jest zakazany.
6. **Ikony, nie emoji.** Jedna rodzina ikon liniowych o tej samej grubości (zestaw z `ikony-ux.js`). Emoji tylko w treści napisanej przez ludzi i w nagrodach.
   W kodzie: `ikony-ux.js` (blok „Wygląd pro, etap 3”) zamienia emoji na początku etykiet, przycisków, chipów i ikonek list na ikony (mapa `MAP`), a ozdobne emoji na końcu przycisku lub nagłówka usuwa. Nagrody (🪙 ⭐ 🎉 🏆 🏅 🔥) i treść zostają. Nowe ekrany: od razu `ZD_UX4.ikona(...)`, nie emoji; brakującą ikonę dopisz do `MAP`.
7. **Bez ozdobników:** bez kratki w tle, falek pod tytułami, naklejek, tekstu z gradientem i etykiet NAD nagłówkami. Nagłówek mówi sam za siebie.

## Jak sprawdzać

- Nowy CSS: tylko `var(--fs-*)`, `var(--r-*)` i kolory z PALETA.md. Szybki test: `grep -o "font-size: *[0-9.]*\(px\|rem\)" index.html` powinien znaleźć tylko rozmiary emoji i ikon.
- Zrzuty na telefonie (390 × 844) i komputerze (1280 × 800), jasny i ciemny zielony.
- Kontrast tekstu ≥ 4,5:1 (duży ≥ 3:1).
- Ruch: wyjście bez odbicia (`--h-out`, `--h-spring` też jest wyhamowaniem), nic nie mruga bez końca (najwyżej 3 razy).
- Zaznaczenie, fokus (3 px w kolorze akcentu), kursor i pasek przewijania w kolorach marki; godziny i liczniki `tabular-nums`.
- Na koniec detektor: `~/.claude/skills/impeccable/scripts/impeccable detect index.html wyglad-ux.css ux-wejscie.css`. Uwagi o motywach ze sklepu i regułach bazowych nadpisanych dla zielonych motywów są znane.

## Etapy porządkowania (raport 19.11.2026)

0. Porządek w źródłach (ten plik). 1. Tokeny: czcionka, skala, zaokrąglenia. 2. Trzy przyciski i płaskie karty. 3. Zdjęcie ozdobników. 4. Ekrany apki. 5. plan.zdawalni.pl. 6. Motywy i szlif.
