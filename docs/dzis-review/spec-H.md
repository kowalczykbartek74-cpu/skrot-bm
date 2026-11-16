# Specyfikacja H – wyciąg dla recenzenta (sekcja 4: wygląd)

Uwaga: plik `claude/wyglad-redesign.md` nie istnieje w żadnym repo na tym Macu. Ten wyciąg powstał z makiety H
(`~/zdawalni-wyglad-h/project/H-Stas-Dzis.dc.html`, płótno „Staś prowadzi”), z `PALETA.md` i z wymagań zlecenia Bartka.

## 4.1 Typografia
- Nagłówki: **Bricolage Grotesque 600** (zapas: Plus Jakarta Sans / Trebuchet MS).
- Tekst: **Plus Jakarta Sans** 400–800.

## 4.2 Kształty
- Karty bez obrysów, promień **32 px** (na telefonie dopuszczalnie 26–28 px), miękkie cienie (rozmyte, nie twarde krawędzie).
- Przyciski i pigułki: **999 px** (pastylki). Główny przycisk panelu Stasia limonkowy z ciemnym kółkiem ze strzałką.
- Małe kafelki: promień 16–22 px.

## 4.3 Paleta (bez kolorów spoza listy)
- Tło strony `#F4F5F0` / `#F7F8F4`, karta `#FFFFFF`, miękkie tło `#EDF1EA`, linia `#DDE7D8`.
- Tusz `#10231A`, tekst pomocniczy `#3E5046`, zieleń marki `#1A7F45`, limonka `#CDF25E` (tylko na ciemnym tle albo jako tło przycisku z ciemnym tekstem).
- Panel Stasia: ciemna zieleń (makieta: `#15703C` / `#0F5A2F`; zlecenie: `#133B2A` / `#1D4A36`) w jasnym I ciemnym motywie; biały / jasnozielony tekst, limonkowe liczby.
- Akcenty pomocnicze z H: niebieski `#1C6FB8`, pomarańczowy `#B35400` (ikony i podpisy kafli).
- Ciemny motyw (zielony ciemny): tło `#0F1A14`, karta `#17271E`, tekst `#E8F2EC`, pomocniczy `#A9BDB1`, akcent `#4ADE8B`.
- PALETA.md: zielenie `#1A7F45 #15703C #0E5A30 #4CAF72 #CFE8D8 #EAF5EE`, limonka `#B7DB4A`, ostrzeżenie `#6A3B00` na `#FFF4DE`.

## 4.4 Ikony i ruch
- Ikony SVG (płaskie, 2 kolory), **bez emoji**.
- Wejście kart delikatne, po kolei; uniesienie na najechanie. Wszystko wyłączone przy „Mniej animacji” (html.calm) i prefers-reduced-motion.

## 4.5 Ekran „Dziś”
- Na górze panel Stasia (jedno główne CTA „Zaczynamy · 5 min”).
- „Terminy” w H: poziomy rząd małych kafelków (kółko z liczbą dni + nazwa + typ).
- Telefon pierwszy: 375 px bez poziomego przewijania, cele dotyku ≥ 44 px; krótko (mało przewijania).
- Kontrast WCAG AA: tekst ≥ 4,5:1, duży ≥ 3:1, w jasnym i ciemnym motywie oraz w motywach ze sklepu.
