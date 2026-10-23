# Skrót BM

Płatna platforma do nauki dla 1. roku Business Management (Uniwersytet Szczeciński): skróty, fiszki, quizy, wersje prostym językiem, zadania i terminy. Strona: **https://skrotbm.pl**

Darmowy plan zajęć i skrzynka do opiekunki roku są w osobnym repozytorium [plan-bm](https://github.com/kowalczykbartek74-cpu/plan-bm) pod adresem https://plan.skrotbm.pl.

## Jak to działa
- `index.html` – cała aplikacja (jedna strona). Plan zajęć pobiera z `https://plan.skrotbm.pl/plan.json`.
- `skrot-supabase.js` – baza, logowanie mailem i zakup dostępu (Supabase + Stripe Payment Link).
- `supabase/` – reguły bazy (uruchamiane w SQL Editor w kolejności: `nauka.sql`, `skrot.sql`, `skrot-platnosci.sql`, `skrot-darmowe.sql`, `skrot-v2.sql`, `skrot-v3.sql`, `skrot-v4-moje.sql`) i funkcje serwerowe:
  - `functions/stripe-webhook` – po płatności w Stripe wpisuje roczny dostęp (sekret `STRIPE_WEBHOOK_SECRET`, bez weryfikacji JWT),
  - `functions/kalendarz` – osobisty kalendarz do telefonu (zajęcia + zaliczenia + zadania) pod tajnym linkiem; reguły w `skrot-kalendarz.sql`, wdrażanie z `--no-verify-jwt`,
  - `functions/claude` – AI (sekret `ANTHROPIC_API_KEY`): starosta bez limitu, osoby z pełnym dostępem tylko do „Moich materiałów”, z biletem i limitem plików. Prosty język i „Dlaczego?” materiałów roku powstają z góry.
- Maile logowania: Resend (SMTP) z domeny skrotbm.pl.
- Kalendarz roku (tygodnie parzyste/nieparzyste, dni wolne, przerwy) strona bierze z `https://plan.skrotbm.pl/plan.json` (pole `kalendarz`, edytowane w `kalendarz.json` w repozytorium plan-bm). W `index.html` jest tylko kopia zapasowa.

## Sylabus kierunku (`sylabus.json`)
Wszystkie 84 przedmioty z sylabusa „Business Management, studia stacjonarne I stopnia 2026/27” (program USEFZ-BM-O-I-S-26/27Z): ECTS, godziny, forma zaliczenia, koordynator, tematy zajęć z godzinami, efekty uczenia się, literatura, nakład pracy i oryginalne zasady oceniania. Strona pokazuje to w:
- **przedmiocie** – panel „Sylabus: tematy i wymagania” i „Pełna karta przedmiotu”,
- **Program studiów** (Materiały albo Menu) – semestry 1–6, obowiązkowe i do wyboru,
- **Zaliczeniach** – szkolenia obowiązkowe (BHP, e-learning, biblioteka, AI),
- **trybie przed kolokwium** – lista tematów danej części z sylabusa.

Przedmioty z planu łączą się po polskiej nazwie (slug). Nowy sylabus (np. na kolejny rok):
```
python3 scripts/sylabus-parse.py SYLABUS.pdf      # tworzy syl.json
python3 scripts/sylabus-build.py sylabus.json
```
Wymaga `pip install pdfplumber`.

## Jak powstają materiały z prezentacji (system v2)
Slajdy prowadzących służą tylko jako mapa tematów. Po wgraniu pliku:
1. **Mapa tematów** – AI czyta slajdy i zwraca wyłącznie listę tematów z numerami slajdów (bez streszczania).
2. **Opracowanie** – osobne zapytanie do AI, które nie dostaje tekstu slajdów, tylko nazwy tematów i pojęć: o co chodzi, po co to jest, co zapamiętać, własny przykład.
3. **Fiszki i quiz** – z naszego opracowania, nie ze slajdów.
4. **Kontrola** – porównanie gotowego tekstu z tekstem slajdów (wspólne ciągi 7 słów). Powyżej 5% AI pisze jeszcze raz, a jeśli dalej za dużo, starosta widzi wspólne fragmenty i decyduje.

Tekst slajdów nie jest zapisywany. Przy każdym temacie, fiszce i pytaniu zostaje tylko odsyłacz „📍 slajdy 12–15”.
Stare materiały (zrobione bezpośrednio ze slajdów) przerabia **Panel AI → Przerób materiały ze slajdów**; po przerobieniu ich tekst slajdów jest kasowany z bazy. `skrot-v2.sql` zamyka studentom odczyt tekstu slajdów (zostają tylko sekcje sylabusa).

## Prosty język i „Dlaczego?”
Każdy materiał ma dwie dodatkowe wersje zapisane w bazie: `materialSimple` (prosty język) i `quizWhy` (wyjaśnienia do quizu).
Powstają przy wgrywaniu materiału, a brakujące uzupełnia starosta w **Panelu AI** (menu po zalogowaniu jako starosta):
- **Uzupełnij brakujące** – przez funkcję `claude` na serwerze,
- **Pobierz paczkę / Wgraj gotowe wyjaśnienia** – bez serwera: paczkę JSON wrzucasz do czatu z Claude, a plik wynikowy wgrywasz z powrotem.

## Kalendarz w telefonie (jednorazowo)
1. Supabase → SQL Editor: wklej `supabase/skrot-kalendarz.sql` → Run.
2. W terminalu, w folderze tego repozytorium:
```
npx supabase login
npx supabase link --project-ref zkyxujkdrovfzpasocmv
npx supabase functions deploy kalendarz --no-verify-jwt
```
Potem w aplikacji: Kalendarz → „📅 Do kalendarza w telefonie”. Każda osoba z dostępem dostaje swój link; grupę bierze z „Twoja grupa”. Po wygaśnięciu dostępu w kalendarzu zostają same zajęcia.

## Funkcja AI (jednorazowo)
W terminalu, w folderze tego repozytorium:
```
npx supabase login
npx supabase link --project-ref zkyxujkdrovfzpasocmv
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
npx supabase functions deploy claude
```
Sprawdzenie: Panel AI → „Uzupełnij brakujące”. Jeśli funkcja nie odpowiada, panel to napisze.

## Nauka+ (v3): powtórki, słowniczek, mapa postępów, zadania, tryb przed kolokwium, ściągawki
Jednorazowo: Supabase → SQL Editor → wklej `supabase/skrot-v3.sql` → Run (nowe kolekcje `exams`, `examBank`, `glossary`). Bez tego wszystko działa, tylko słowniczek składa się w przeglądarce, a testy używają szablonów domyślnych i pytań z quizów i fiszek.

- **Powtórki** – każda przejrzana fiszka wraca po 1, 3, 7, 14, 30 i 60 dniach (pudełka Leitnera), maks. 20 nowych kart dziennie; przed zaliczeniem z przedmiotu karta wraca przynajmniej raz. Kafel „Powtórki” na Starcie, sesja pod Menu → Powtórki (spacja odwraca, klawisze 1–4 oceniają).
- **Słowniczek EN–PL** – z pól `concepts` wszystkich materiałów; skrót `/`. Panel AI → „Odśwież słowniczek” zapisuje go w kolekcji `glossary`; odświeża się też sam po wgraniu i przerobieniu materiału.
- **Mapa postępów** – wynik tematu: quiz 40%, fiszki 30%, zadania 15%, próbny test 15%; na Starcie podpowiedź „powtórz to przed piątkiem” przed najbliższym zaliczeniem (14 dni).
- **Zadania krok po kroku** – pole `worked` w `materialContent`, zakładka „Zadania”. Panel AI → „Zadania krok po kroku” (funkcją AI albo paczką JSON); wyniki liczbowe sprawdza wbudowany kalkulator, zadania ze złym kluczem odpadają.
- **Tryb przed kolokwium** – przycisk w przedmiocie, przy formie zaliczenia i przy terminie. Plan na dni do zaliczenia, zakres, kluczowe tematy (starosta oznacza ★ w materiale) i próbny test z timerem: pytania z `examBank` (Panel AI → „Pytania do testów”), a gdy ich brak, z quizów, fiszek i zadań. Szablon testu (czas, próg, sekcje) w Panelu AI; domyślny wynika z formy zaliczenia w sylabusie. Pytania otwarte student ocenia sam według rubryki.
- **Ściągawki** – jedna strona A4 na materiał albo przedmiot, drukowanie przez przeglądarkę („Zapisz jako PDF”), w stopce e-mail kupującego.

## Moje materiały (v4): własne pliki studentów
Każda osoba z pełnym dostępem wgrywa własny plik (PPTX, PDF, DOCX, TXT): Materiały → „Moje materiały” → „Wgraj swój materiał”. Plik przechodzi **ten sam proces co materiały roku** (mapa tematów → opracowanie bez tekstu pliku → fiszki i quiz → kontrola podobieństwa → prosty język i „Dlaczego?”), a wynik trafia do sekcji wybranej przez tę osobę. Domyślna sekcja to „Materiały”; można tworzyć nowe, zmieniać nazwy, przenosić materiały i usuwać sekcje.

- Materiały są prywatne: kolekcje `myMaterials` i `myContent`, widzi je i zmienia tylko właściciel. Tekst pliku nie jest zapisywany. Sekcje są w postępie nauki tej osoby (`myFolders`).
- Koszt AI pilnuje baza: przed każdym plikiem strona pobiera bilet (`nauka_moje_start`), jeden bilet = jeden plik = do 8 zapytań do AI w ciągu 2 godzin. Limit: **5 plików dziennie i 40 w miesiącu na osobę** (liczby w `nauka_moje_stan` i `nauka_moje_start` w `skrot-v4-moje.sql`). Starosta nie ma limitu.

Włączenie (jednorazowo):
1. Supabase → SQL Editor: wklej `supabase/skrot-v4-moje.sql` → Run.
2. W terminalu, w folderze tego repozytorium: `npx supabase functions deploy claude`

Dopóki tego nie zrobisz, strona pokazuje studentom „nie jest jeszcze włączone na serwerze” zamiast błędu.
