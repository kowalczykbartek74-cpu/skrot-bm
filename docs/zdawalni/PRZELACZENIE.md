# Przeniesienie Skrótu BM ze skrotbm.pl na zdawalni.pl

Przygotowane 5.11.2026. Gałęzie: `skrot-bm` → `zdawalni/domena`, `plan-bm` → `zdawalni`. Nic z tego nie jest jeszcze na produkcji.

## Jak to wygląda po przełączeniu

| Adres | Co pokazuje | Gdzie stoi |
|---|---|---|
| `zdawalni.pl` | Skrót BM (dzisiejsze skrotbm.pl) | GitHub Pages, repo `skrot-bm` |
| `matura.zdawalni.pl` | planer maturalny (dzisiejsze www.zdawalni.pl) | Vercel, projekt `zdawalni` |
| `www.zdawalni.pl` | przekierowanie na `matura.zdawalni.pl` (stare linki matury dalej działają) | Vercel, projekt `zdawalni` |
| `skrotbm.pl` | wejście dla Business Management: przekierowanie na `zdawalni.pl` z przeniesieniem danych przeglądarki i od razu kierunkiem BM (bez ekranu wyboru kierunku) | GitHub Pages, nowe repo `skrotbm-przekierowanie` |
| `plan.skrotbm.pl` | bez zmian (na razie) | GitHub Pages, repo `plan-bm` |

**Dlaczego plan zostaje na plan.skrotbm.pl:** studenci mają w kalendarzach w telefonie subskrypcje `plan.skrotbm.pl/kalendarz/C112.ics`. Aplikacje kalendarza nie przechodzą przez przekierowanie strony, więc po przeniesieniu planu te kalendarze przestałyby się odświeżać. Plan przeniesiemy osobno, razem z planem całego WEFiZ.

**Dlaczego www.zdawalni.pl zostaje przy maturze:** stare linki do matury (zakładki, maile, linki w Google) mają `www`. Skrót działa na `zdawalni.pl` bez `www`.

## Co zrobiłem w kodzie (gałąź `zdawalni/domena`)

- **Nazwa: Zdawalni** (decyzja 5.11.2026). Tytuł karty, nagłówek, nazwa aplikacji na telefonie (`manifest`), obrazek do udostępniania linku (`icons/og.png`), odznaka „Mistrz Zdawalni”, Hasło dnia, wiadomość polecająca, mail o współdzieleniu konta, regulamin i polityka (z dopiskiem „wcześniej Skrót BM”), wersja EN. Ikona aplikacji bez napisu, więc bez zmian. Komentarze w kodzie i identyfikatory kalendarza (`PRODID`, `UID`) celowo zostają.
- **skrotbm.pl = adres dla BM.** Wejście ze skrotbm.pl ustawia kierunek Business Management, jeśli ktoś nie wybrał jeszcze żadnego (nowa osoba nie widzi ekranu wyboru kierunku). Wybranego innego kierunku nie nadpisuje.

- `CNAME` = zdawalni.pl.
- Teksty w aplikacji, które mówią „skrotbm.pl” (instalacja na telefonie, stopka ściągawek, Boss, udostępnianie Hasła dnia) → „zdawalni.pl”, z parami EN. Podbite `?v=20261105-zdawalni`.
- Link polecający: `zdawalni.pl/?kod=…`. Stare linki `skrotbm.pl/?kod=…` i `?proba=1` dalej działają (przekierowanie zachowuje adres).
- `og:url`, `og:image`, `sitemap.xml`, `robots.txt` na nowy adres.
- Regulamin i polityka prywatności (PL i EN): adres serwisu `zdawalni.pl (wcześniej skrotbm.pl)`.
- Funkcje Supabase: `claude` i `grade-open` przyjmują zapytania także z zdawalni.pl (stare adresy zostają). `kalendarz`: linki w wydarzeniach prowadzą na zdawalni.pl, **identyfikatory wydarzeń (UID) zostają `@skrotbm.pl`**, żeby kalendarze w telefonach nie pokazały wszystkiego podwójnie.
- **Przeniesienie danych przeglądarki.** Przy zmianie domeny przeglądarka „zapomina” wszystko, co strona trzyma lokalnie. Najgroźniejsze: `skrot-device` (ID urządzenia). Bez przeniesienia każdy student dostałby „nowe urządzenie” i wpadłby na limit 3 urządzeń (zmiana raz na 30 dni). Do tego postępy lekcji, powtórki, motywy, logowanie. Rozwiązanie:
  - `docs/zdawalni/przekierowanie/` = zawartość repo dla starej domeny. Przy wejściu na `skrotbm.pl` strona zbiera klucze Skrótu (`bm-*`, `skrot-*`, logowanie Supabase) i przenosi je w części adresu po `#` (ta część nie trafia na żaden serwer) na `zdawalni.pl/przenies.html`.
  - `przenies.html` zapisuje je w nowej domenie, czyści adres i otwiera aplikację tam, gdzie student chciał wejść. Import tylko raz; nie nadpisuje nowszych danych, jeśli ktoś już zalogował się na zdawalni.pl.
  - Test: `docs/zdawalni/test/przeniesienie.mjs` (Playwright). Wynik 5.11: 12/12 OK, w tym 300 kB danych, `?kod=` i `#/exam/prawo` zachowane, kierunek BM dla nowej osoby.
- `plan-bm` (gałąź `zdawalni`): link „Skrót BM ↗” na zdawalni.pl.

**Bez zmian (celowo):** maile z kodem logowania dalej z domeny skrotbm.pl przez Resend (działa, domena zostaje Twoja). Webhook Stripe idzie do Supabase, więc nie zależy od domeny.

## Już zrobione w panelach

- Vercel, projekt `zdawalni`: dodana domena `matura.zdawalni.pl` — działa (5.11).
- ŚwiatDomen24, zdawalni.pl: CNAME `matura` → Vercel, TTL rekordu A zdawalni.pl = 300 (5.11).
- Supabase Skrótu: Redirect URL `https://zdawalni.pl/**` (5.11).

## Krok A — DZIŚ, nic nie psuje (ok. 15 min)

**A1. (zrobione 5.11) ŚwiatDomen24 → zdawalni.pl → DNS** — dodaj rekord:
- Typ `CNAME`, nazwa `matura`, wartość `90023d2e388c344b.vercel-dns-017.com.` (z kropką na końcu, jeśli panel jej wymaga).
- Przy okazji: rekord `A` dla zdawalni.pl (pole nazwy puste, wartość `216.198.79.1`) — zmień TTL na `300`. Nic więcej nie ruszaj.
- Po ok. 15 min sprawdź, że `https://matura.zdawalni.pl` pokazuje maturę.

**A2. (zrobione 5.11) Supabase Skrótu** (`zkyxujkdrovfzpasocmv`) → Authentication → URL Configuration → Redirect URLs → **Add URL**: `https://zdawalni.pl/**`. Site URL na razie zostaw.

**A3. Supabase → Edge Functions** — wdroż `claude` i `grade-open` z gałęzi `zdawalni/domena` (zmieniona jest jedna linia `const ORIGINS = [...]` w każdej). Strona dalej działa jak dotąd.

**A5. Nazwa w mailach.** Supabase Skrótu → Authentication → Emails (szablony) i Resend/SMTP (nazwa nadawcy): jeśli jest tam „Skrót BM”, zmień na „Zdawalni”. Adres nadawcy z domeny skrotbm.pl może zostać.

**A4. Matura — sprawdź, zanim zwolnimy zdawalni.pl** (projekt Vercel `zdawalni` ma Stripe, Resend, Supabase i powiadomienia push):
- Stripe matury → Developers → Webhooks: jeśli adres to `https://www.zdawalni.pl/api/...`, zmienisz go w dniu przełączenia na `https://matura.zdawalni.pl/api/...` (Stripe nie przechodzi przez przekierowania).
- Supabase matury → Authentication → URL Configuration: dodaj `https://matura.zdawalni.pl/**` do Redirect URLs.
- Powiadomienia push i dane w przeglądarce są przypisane do adresu: po przejściu na matura.zdawalni.pl użytkownicy matury muszą ponownie włączyć powiadomienia (i ewentualnie zalogować się ponownie).

## Krok B — PRZEŁĄCZENIE (wieczorem, ok. 45 min, najlepiej dzień po kroku A)

1. **Vercel, projekt `zdawalni`** → Settings → Environment Variables: `NEXT_PUBLIC_SITE_URL` = `https://matura.zdawalni.pl` → Redeploy. Webhook Stripe matury na nowy adres (A4).
2. **Vercel → Domains:** `www.zdawalni.pl` → ustaw przekierowanie na `matura.zdawalni.pl` (308). Usuń `zdawalni.pl` z projektu.
3. **GitHub:** nowe publiczne repo `skrotbm-przekierowanie`, wrzuć do niego zawartość `docs/zdawalni/przekierowanie/` (też `.nojekyll`). Settings → Pages → źródło `main`. Domeny jeszcze nie ustawiaj.
4. **GitHub `skrot-bm`:** scal `zdawalni/domena` do `main`. Settings → Pages → Custom domain = `zdawalni.pl`.
5. **GitHub `skrotbm-przekierowanie`** → Settings → Pages → Custom domain = `skrotbm.pl`. (DNS skrotbm.pl już wskazuje na GitHub Pages, nic tam nie zmieniasz.)
6. **ŚwiatDomen24 → zdawalni.pl → DNS:** usuń rekord `A` `216.198.79.1`, dodaj 4 rekordy `A` (pole nazwy puste): `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`. Rekordy `www` i `matura` zostają.
7. **Supabase Skrótu:** Authentication → URL Configuration → Site URL = `https://zdawalni.pl`. Edge Functions → wdroż `kalendarz` z `main`.
8. **Stripe (konto skrotbm):** oba Payment Links → After payment → jeśli jest adres skrotbm.pl, zmień na `https://zdawalni.pl/`. Settings → Customer portal → link powrotu na zdawalni.pl. Settings → Business details → strona www.
9. **plan-bm:** scal gałąź `zdawalni`.
10. Po 15–60 min: w obu repo Settings → Pages → **Enforce HTTPS** (da się zaznaczyć dopiero po wydaniu certyfikatu).

## Test po przełączeniu

- [ ] `zdawalni.pl` otwiera Skrót, kłódka HTTPS.
- [ ] `skrotbm.pl` i `skrotbm.pl/?kod=TEST` przechodzą na zdawalni.pl; jesteś dalej zalogowany, motyw i postępy są.
- [ ] Logowanie kodem z maila w trybie incognito.
- [ ] „Kup dostęp” otwiera Stripe; po płatności wraca na zdawalni.pl.
- [ ] Funkcje AI (panel starosty) i ocena odpowiedzi otwartych działają (brak błędu CORS w konsoli).
- [ ] Osobisty link kalendarza w telefonie dalej się odświeża.
- [ ] `matura.zdawalni.pl` działa; `www.zdawalni.pl/coś` przechodzi na `matura.zdawalni.pl/coś`.
- [ ] plan.skrotbm.pl bez zmian, link „Skrót BM ↗” prowadzi na zdawalni.pl.

## Cofnięcie (gdyby coś nie działało)

1. `skrot-bm`: Revert commita scalenia na `main` (wraca `CNAME` = skrotbm.pl). W `skrotbm-przekierowanie` usuń domenę.
2. DNS zdawalni.pl: przywróć rekord `A` `216.198.79.1`, usuń 4 adresy GitHub.
3. Vercel: dodaj z powrotem `zdawalni.pl` (przekierowanie na www) i zdejmij przekierowanie z `www.zdawalni.pl`.

## Do decyzji / uwagi

- Decyzja 5.11.2026: aplikacja na samym `zdawalni.pl` pod nazwą Zdawalni (nie `studia.zdawalni.pl`); skrotbm.pl zostaje jako wejście dla BM.
- Regulamin: zmieniła się nazwa i adres serwisu (treść bez zmian). Według § o zmianach regulaminu kupujący dostają mail z 14-dniowym wyprzedzeniem — warto wysłać krótką informację o nowym adresie (nie jestem prawnikiem, to ostrożna wersja).
- Domenę skrotbm.pl opłacaj co najmniej rok dłużej (stare linki, ekrany początkowe telefonów, maile z kodem logowania).
- Później: nadawca maili `@zdawalni.pl` w Resend (nowe rekordy DNS), przeniesienie planu razem z WEFiZ.
