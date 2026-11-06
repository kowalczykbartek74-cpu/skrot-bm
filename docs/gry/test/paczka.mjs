// Etap 10 specu „Systemy z Zdawalni w Skrócie”: paczka i duet tygodnia (SQL v37 podstawione atrapą, paczka.js).
//   A. Więcej → „Paczka i duet”; bez paczki: „Załóż paczkę” i pole na kod; założenie → kod, link zdawalni.pl/?paczka=KOD,
//   B. paczka 3 osób z duetem: tylko wysiłek (pseudonim / „Osoba N”, dziś, dni w tygodniu), wspólny cel, postęp duetu,
//      bez punktów, XP i monet innych; właściciel ma „Usuń” (≥ 44 px), usunięcie przez potwierdzenie,
//   C. zaproszenie do duetu: „Przyjmij” → duet aktywny; propozycja duetu z wiersza osoby,
//   D. link ?paczka=kod: bez logowania prośba o logowanie i zapamiętany kod; po zalogowaniu „Dołączyć…?” → w paczce,
//   E. wyjście z paczki (potwierdzenie), F. bez v37 w bazie i bez logowania: jasny komunikat,
//   G. EN bez polskich znaków. Zrzuty 375 i 1280, PL i EN.
// BASE=http://127.0.0.1:8811/ node docs/gry/test/paczka.mjs
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 700)]);
const UID = "00000000-0000-4000-8000-000000000001", KASIA = "00000000-0000-4000-8000-00000000000a", B2 = "00000000-0000-4000-8000-00000000000b";
const PL_ZN = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;
const calls = (p) => p.evaluate(() => window.__pk || []);
const PACZKA = (o = {}) => JSON.stringify({
  paczka: { kod: "AB3K9Z", wlasciciel: true, czlonkowie: [
    { id: UID, nick: "Student", ja: true, wlasciciel: true, dzis: true, dni: 3, w_duecie: true },
    { id: KASIA, nick: "Kasia", ja: false, wlasciciel: false, dzis: false, dni: 2, w_duecie: true },
    { id: B2, nick: null, ja: false, wlasciciel: false, dzis: true, dni: 1, w_duecie: false }] },
  duet: { id: "d-1", stan: "aktywny", z: KASIA, od: "2026-11-02", moje: 3, jego: 2, cel: 8, nagroda: 20, odebrane: false, moze_zarobic: true },
  zaproszenia: [], ...o });

// A: Więcej → wiersz → bez paczki → założenie
for (const [w, hh] of [[375, 812], [1280, 900]]) {
  const p = await page(b, { konto: "platne", w, h: hh });
  await p.goto(BASE + "index.html#/more"); await p.waitForTimeout(2500);
  const row = p.locator(".more-row", { hasText: "Paczka i duet" });
  ok(`${w} A: wiersz „Paczka i duet” w Więcej`, (await row.count()) === 1 && /ucz się ze znajomymi/.test(await row.innerText()), await p.locator("main").innerText().then((t) => t.slice(0, 300)));
  await row.click(); await p.waitForTimeout(800);
  ok(`${w} A: adres #/paczka`, (await p.evaluate(() => location.hash)) === "#/paczka");
  const t = await p.locator("main").innerText();
  ok(`${w} A: bez paczki: załóż + kod`, /Załóż paczkę/.test(t) && /Masz kod od znajomych\?/.test(t) && (await p.locator("#pk-kod").count()) === 1, t.slice(0, 500));
  const nb = await p.locator(".pk-new").boundingBox(), db = await p.locator(".pk-dolacz").boundingBox(), ib = await p.locator("#pk-kod").boundingBox();
  ok(`${w} A: przyciski i pole ≥ 44 px`, nb?.height >= 44 && db?.height >= 44 && ib?.height >= 44, { nb, db, ib });
  await shot(p, `paczka-${w}-pusta`);
  if (w === 375) {
    await p.fill("#pk-kod", "ab"); await p.click(".pk-dolacz"); await p.waitForTimeout(300);
    ok("A: zły kod → komunikat, bez zapytania", /Kod ma 6 znaków/.test(await p.locator(".toast").innerText().catch(() => "")) && !(await calls(p)).some((x) => x.fn === "dolacz"));
    await p.fill("#pk-kod", "niema-1"); await p.click(".pk-dolacz"); await p.waitForTimeout(500);
    ok("A: nieznany kod → „Nie ma paczki z tym kodem.”", /Nie ma paczki z tym kodem/.test(await p.locator(".toast").innerText().catch(() => "")), await calls(p));
  }
  await p.click(".pk-new"); await p.waitForTimeout(800);
  const t2 = await p.locator("main").innerText();
  ok(`${w} A: po założeniu: kod, link, cel, duet czeka na osoby`, /AB3K9Z/.test(t2) && /https:\/\/zdawalni\.pl\/\?paczka=AB3K9Z/.test(t2) && /Wspólny cel tygodnia/.test(t2)
    && /Duet zaczniesz, gdy ktoś dołączy/.test(t2) && /Student \(Ty\) · prowadzi/.test(t2), t2.slice(0, 900));
  ok(`${w} A: bez błędów w konsoli`, !p.errors.length, p.errors);
  await p.context().close();
}

// B + G: paczka z duetem, PL i EN, 375 i 1280
for (const lang of ["pl", "en"]) for (const [w, hh] of [[375, 812], [1280, 900]]) {
  const p = await page(b, { konto: "platne", lang, w, h: hh, ls: { "mock-paczka": PACZKA() } });
  await p.goto(BASE + "index.html#/paczka"); await p.waitForTimeout(2500);
  const t = await p.locator("main").innerText();
  if (lang === "pl") {
    // cel: 3 osoby × 3 dni × 70% = 6,3 → 7; zrobione 3 + 2 + 1 = 6
    ok(`${w} B: wspólny cel 6/7`, /Wspólny cel tygodnia/.test(t) && (await p.locator(".pk-cel .pk-licz").innerText()) === "6/7" && /Brakuje 1 dnia nauki/.test(t), t.slice(0, 600));
    const os = await p.locator(".pk-os").allInnerTexts();
    ok(`${w} B: trzy osoby, tylko wysiłek`, os.length === 3 && /Kasia/.test(os[1]) && /dziś: jeszcze nie · 2 dni nauki w tym tygodniu · w duecie/.test(os[1])
      && /Osoba 3/.test(os[2]) && /dziś: nauka ✓ · 1 dzień nauki/.test(os[2]), os);
    ok(`${w} B: bez punktów, XP, monet i kierunku innych`, !/(pkt|XP|wynik:|rocznik|Business Management|🪙 \d+ ·)/.test(os.join("\n")), os);
    ok(`${w} B: duet 5/8 z opisem i nagrodą`, (await p.locator(".pk-duet .pk-licz").innerText()) === "5/8" && /Ty \+ Kasia/.test(t) && /Razem 5\/8 sesji\. Brakuje 3/.test(t)
      && /Ty: 3 · Kasia: 2/.test(t) && /oboje dostajecie po 20 🪙/.test(t), t.slice(0, 1200));
    const ub = await p.locator(".pk-usun").first().boundingBox();
    ok(`${w} B: właściciel ma „Usuń” przy 2 osobach (≥ 44 px), bez „Duet?” (ma duet)`, (await p.locator(".pk-usun").count()) === 2 && ub?.height >= 44 && ub?.width >= 44
      && (await p.locator(".pk-zapros").count()) === 0, ub);
    ok(`${w} B: pasek postępu z aria`, (await p.locator(".pk-cel [role=progressbar]").getAttribute("aria-valuenow")) === "86");
  } else {
    ok(`${w} G: EN bez polskich znaków (poza nazwą Zdawalni w stopce)`, !PL_ZN.test(t.replace(/Skrót BM/g, "")) && /Shared goal this week/.test(t) && /Duo of the week/.test(t) && /Leave the squad/.test(t), t.slice(0, 1500));
  }
  await shot(p, `paczka-${w}-${lang}`);
  await p.locator(".pk-share").scrollIntoViewIfNeeded(); await shot(p, `paczka-${w}-${lang}-dol`);
  ok(`${w} ${lang} B: bez błędów w konsoli`, !p.errors.length, p.errors);
  await p.context().close();
}

// B: usunięcie osoby przez właściciela
{
  const p = await page(b, { konto: "platne", ls: { "mock-paczka": PACZKA() } });
  await p.goto(BASE + "index.html#/paczka"); await p.waitForTimeout(2500);
  await p.locator(".pk-os", { hasText: "Osoba 3" }).locator(".pk-usun").click(); await p.waitForTimeout(300);
  ok("B: potwierdzenie „Usunąć z paczki: Osoba 3?”", /Usunąć z paczki: Osoba 3\?/.test(await p.locator(".modal").innerText()));
  await p.click(".pk-usun-tak"); await p.waitForTimeout(600);
  ok("B: usunięta, zapytanie z id", (await p.locator(".pk-os").count()) === 2 && (await calls(p)).some((x) => x.fn === "usun" && x.a.p_user === B2));
  await p.context().close();
}

// C: zaproszenie do duetu i propozycja z wiersza
{
  const st = PACZKA({ duet: null, zaproszenia: [{ id: "d-9", od: KASIA }] });
  const fix = JSON.parse(st); fix.paczka.czlonkowie.forEach((m) => (m.w_duecie = false)); fix.paczka.wlasciciel = false; fix.paczka.czlonkowie[0].wlasciciel = false; fix.paczka.czlonkowie[1].wlasciciel = true;
  const p = await page(b, { konto: "platne", ls: { "mock-paczka": JSON.stringify(fix) } });
  await p.goto(BASE + "index.html#/paczka"); await p.waitForTimeout(2500);
  ok("C: „Kasia proponuje Ci duet tygodnia.”", /Kasia proponuje Ci duet tygodnia\./.test(await p.locator(".pk-duet").innerText()));
  ok("C: nie-właściciel bez „Usuń”, „Duet?” przy dwóch osobach", (await p.locator(".pk-usun").count()) === 0 && (await p.locator(".pk-zapros").count()) === 2);
  await shot(p, "paczka-375-zaproszenie");
  await p.click(".pk-tak"); await p.waitForTimeout(600);
  const t = await p.locator(".pk-duet").innerText();
  ok("C: Przyjmij → duet aktywny 0/8", /Ty \+ Kasia/.test(t) && /0\/8/.test(t) && (await calls(p)).some((x) => x.fn === "odpowiedz" && x.a.p_duet === "d-9" && x.a.p_tak === true), t);
  await p.click(".pk-koniec"); await p.waitForTimeout(600);
  await p.locator(".pk-os", { hasText: "Osoba 3" }).locator(".pk-zapros").click(); await p.waitForTimeout(600);
  ok("C: propozycja z wiersza → „Czekasz na odpowiedź: Osoba 3.”", /Czekasz na odpowiedź: Osoba 3\./.test(await p.locator(".pk-duet").innerText())
    && (await calls(p)).some((x) => x.fn === "zapros" && x.a.p_user === B2));
  ok("C: bez błędów w konsoli", !p.errors.length, p.errors);
  await p.context().close();
}

// D: link ?paczka=… bez logowania i po zalogowaniu
for (const lang of ["pl", "en"]) {
  const p = await page(b, { konto: "brak", lang });
  await p.goto(BASE + "index.html?paczka=ab3-k9z#/"); await p.waitForTimeout(2500);
  const note = p.locator("#login .pk-login-note"), m = await note.innerText().catch(() => "");
  ok(`D ${lang}: zdanie o kodzie widać na ekranie logowania, bez okna`, (await note.isVisible().catch(() => false)) && (await p.locator(".modal").count()) === 0);
  if (lang === "pl") ok("D: bez logowania: prośba o logowanie, kod zapamiętany, adres bez ?paczka", /Zaloguj się, żeby dołączyć do paczki/.test(m)
    && (await p.evaluate(() => localStorage.getItem("skrot-paczka-kod"))) === "AB3K9Z" && !/paczka=/.test(await p.evaluate(() => location.search)), m);
  else ok("D/G: EN prośba o logowanie bez polskich znaków", /Log in to join your friends' squad/.test(m) && !PL_ZN.test(m), m);
  await note.scrollIntoViewIfNeeded().catch(() => {}); await shot(p, `paczka-375-${lang}-link-wylogowany`);
  await p.context().close();
}
for (const lang of ["pl", "en"]) for (const [w, hh] of [[375, 812], [1280, 900]]) {
  const p = await page(b, { konto: "platne", lang, w, h: hh, ls: { "skrot-paczka-kod": "AB3K9Z" } });
  await p.goto(BASE + "index.html#/"); await p.waitForTimeout(2800);
  const m = await p.locator(".modal").innerText().catch(() => "");
  if (lang === "pl") ok(`${w} D: zalogowany: „Dołączyć do paczki: Kasia?”`, /Dołączyć do paczki: Kasia\?/.test(m) && /W paczce: 2 z 8 osób/.test(m), m);
  else ok(`${w} D/G: EN propozycja bez polskich znaków`, /Join .*squad/i.test(m) && !PL_ZN.test(m), m);
  const jb = await p.locator(".pk-join").boundingBox();
  ok(`${w} ${lang} D: „Dołącz” ≥ 44 px`, jb?.height >= 44, jb);
  await shot(p, `paczka-${w}-${lang}-dolacz`);
  if (lang === "pl" && w === 375) {
    await p.click(".pk-join"); await p.waitForTimeout(900);
    ok("D: dołączenie → widok paczki, kod zapomniany", (await p.evaluate(() => location.hash)) === "#/paczka" && (await p.locator(".pk-os").count()) === 3
      && !(await p.evaluate(() => localStorage.getItem("skrot-paczka-kod"))) && (await calls(p)).some((x) => x.fn === "dolacz" && x.a.p_kod === "AB3K9Z"));
    await p.reload(); await p.waitForTimeout(2500);
    ok("D: po przeładowaniu bez ponownej propozycji", (await p.locator(".modal").count()) === 0);
  }
  await p.context().close();
}

// E: wyjście z paczki
{
  const p = await page(b, { konto: "platne", ls: { "mock-paczka": PACZKA() } });
  await p.goto(BASE + "index.html#/paczka"); await p.waitForTimeout(2500);
  await p.click(".pk-out"); await p.waitForTimeout(300);
  ok("E: potwierdzenie dla prowadzącego", /prowadzenie przejmie osoba najdłużej w paczce/.test(await p.locator(".modal").innerText()));
  await p.click(".pk-out-tak"); await p.waitForTimeout(900);
  ok("E: po wyjściu znów „Załóż paczkę”", /Załóż paczkę/.test(await p.locator("main").innerText()) && (await calls(p)).some((x) => x.fn === "wyjdz"));
  await p.context().close();
}

// F: bez v37 i bez logowania
{
  const p = await page(b, { konto: "platne", ls: { "mock-paczka": "off" } });
  await p.goto(BASE + "index.html#/paczka"); await p.waitForTimeout(2500);
  ok("F: bez v37 → „Paczki jeszcze nie działają”", /Paczki jeszcze nie działają/.test(await p.locator("main").innerText()));
  ok("F: bez błędów w konsoli", !p.errors.length, p.errors);
  await p.context().close();
  const q = await page(b, { konto: "brak" });
  await q.goto(BASE + "index.html#/paczka"); await q.waitForTimeout(2500);
  ok("F: bez logowania → prośba o logowanie", /Zaloguj się, żeby założyć paczkę/.test(await q.locator("main").innerText()));
  await q.context().close();
}

await b.close();
for (const w of wyniki) console.log(w.join(" "));
const bad = wyniki.filter((w) => w[0] === "✗").length;
console.log(bad ? `BŁĘDY: ${bad} z ${wyniki.length}` : `OK ${wyniki.length}/${wyniki.length}`);
process.exit(bad ? 1 : 0);
