# Fundament pod inne kierunki – Etap 1 (polskie znaki w bazie, strażnik kodowania)

## Skąd błąd

Na produkcji `nauka_roczniki_lista()` zwraca „WydziaŇā Ekonomii, Finans√≥w i ZarzńÖdzania”. To dokładnie tekst UTF-8 odczytany jako **Mac Central European** (ł → „Ňā”, ą → „ńÖ”, ó → „√≥”). Plik w repo jest dobry, litery zepsuły się przy kopiowaniu przez Terminal.

## Co jest w repo

| Plik | Po co |
|---|---|
| `supabase/straznik-kodowania.sql` | blok na początek każdej migracji od v44: przy zepsutych literach plik staje na pierwszej instrukcji |
| `supabase/sprawdz-znaki.sql` | tylko odczyt: zepsute litery w funkcjach **i we wszystkich kolumnach tekstowych** tabel `public` |
| `supabase/naprawa-znakow.sql` | jedna naprawa zamiast „v31 + każda funkcja z osobna” (niżej dlaczego) |
| `scripts/funkcje-sql.mjs` | gdzie jest najnowsza wersja każdej funkcji; generuje plik naprawczy |
| `tests/migracje.test.js`, `supabase/test/znaki*.sql`, koniec `pglite.mjs` | testy |

### Dlaczego zamiast tego, co mówił spec, jest plik naprawczy

1. **Ponowne v31 nie naprawi nazw kierunków.** Nazwy z polskimi literami („Finanse i Rachunkowość”, „Gospodarka Nieruchomościami”…) wpisuje v34, a tam `on conflict` zmienia tylko `lata` i `zapisy`, nie nazwę.
2. **Ponowne wklejenie starego pliku cofa nowsze funkcje.** Funkcja zepsuta w v13 ma nowszą wersję np. w v28. Wklejenie całego v13 przywróciłoby starą. (Samo v31 jest bezpieczne – żadna jego funkcja nie ma późniejszej wersji – ale innych plików to nie dotyczy.)

`naprawa-znakow.sql` robi więc tak: strażnik → nazwa wydziału i kierunku BM jak w v31 → nazwy 29 kierunków jak w v34 (tylko zepsute) → dla każdej z 41 funkcji z polskimi literami: **tylko jeśli w bazie jest zepsuta**, podmienia ją na najnowszą wersję z repo → na końcu lista: co naprawiono i co zostało. Można uruchamiać wiele razy.

Pominięte funkcje z migracji, które według moich notatek mogą jeszcze czekać na uruchomienie: `nauka_retencja` (v33) i `nauka_sklep_katalog` (v42). Jeśli wyjdą w wyniku jako „ZOSTAŁO”, wklej ponownie cały plik tej migracji (oba można uruchomić ponownie).

## Kroki dla Bartka

Gałąź: `fundament/etap-1` (wypchnięta, bez `main`; przedrostek `kierunki/` jest zajęty przez starą gałąź `kierunki` na GitHubie).

1. Otwórz https://github.com/kowalczykbartek74-cpu/skrot-bm/blob/fundament/etap-1/supabase/naprawa-znakow.sql
2. Nad treścią pliku, po prawej, kliknij ikonę **„Copy raw file”** (dwa nakładające się kwadraty).
3. Supabase → projekt **skrzynka-bm** → **SQL Editor** → **New query** → wklej (Cmd+V).
4. **Run**. Supabase może zapytać o „destructive operation” (plik ma `truncate` tabeli tymczasowej) → **Run this query**.
5. Wynik:
   - „Polskie znaki doszły zepsute…” = kopiowanie znów popsuło litery; nic się nie zmieniło. Powtórz krok 2 (tylko przycisk z github.com).
   - wiersze „naprawiono: …” = te funkcje były zepsute i są poprawione;
   - wiersze „ZOSTAŁO: …” = **wklej mi je**;
   - pusty wynik przy drugim uruchomieniu = gotowe.
6. Sprawdzenie (tylko odczyt, w każdej chwili): https://github.com/kowalczykbartek74-cpu/skrot-bm/blob/fundament/etap-1/supabase/sprawdz-znaki.sql – tak samo „Copy raw file” → New query → Run. Pusto = dobrze.

Zapytanie kontrolne ze specu (Etap 0) też powinno dać 0 wierszy, ale łapie każdy „√” (np. pierwiastek w treści), dlatego `sprawdz-znaki.sql` szuka dokładnych zepsutych par liter.

## Testy

- `node supabase/test/pglite.mjs`: cała kolejka 2× jak dotąd (jedyny ✗ to znany `limit_wpisow` z v12), potem na końcu: psuję wszystkie 39 funkcji z polskimi literami, nazwę wydziału i kierunków tak jak na produkcji, uruchamiam naprawę 2× → Z1 żadnej zepsutej funkcji, Z2 nazwy jak w plikach, Z3 drugie uruchomienie niczego nie podmienia i sprawdzenie jest puste, Z4 `nauka_roczniki_lista()` zwraca dobrą nazwę wydziału. Strażnik: dobry plik przechodzi, ten sam plik po zepsuciu staje i niczego nie tworzy.
- `node --test tests/*.test.js`: 248/248; nowe: strażnik ma te same litery wprost i jako kody, każda migracja od v44 zaczyna się strażnikiem, plik naprawczy jest aktualny względem migracji.

## Dla kolejnych roczników

Każda nowa migracja (v44, v45, v46 i migracje kierunków) zaczyna się strażnikiem, a test nie przepuści pliku bez niego.
