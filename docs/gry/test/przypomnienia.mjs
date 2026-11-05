// Etap 7a specu „Systemy z Zdawalni w Skrócie”: przypomnienia mailem (SQL v36 i funkcja Edge przypomnienia podstawione atrapą).
//   A. Dziś: kolokwium za 3 dni i wyłączone przypomnienia → karta „Przypomnieć Ci mailem?” z jednym przyciskiem „Włącz” (D6, 18:00),
//      po włączeniu karta znika, a strona zapisuje stan (termin starosty z id, liczby na 8 dni),
//   B. „Nie teraz” chowa kartę (także po przeładowaniu),
//   C. Ustawienia → Przypomnienia: włącz/wyłącz, godzina, co przypominać (zapis w bazie),
//   D. bez pełnego dostępu, bez v36 w bazie, bez logowania: jasny komunikat,
//   E. link z maila ?pz=<id> → „otwarte” w bazie, adres bez ?pz,
//   F. przypomnienia.html#t=<token>: wyłączenie dopiero przyciskiem, POST do funkcji, PL i EN,
//   G. EN bez polskich znaków.
// BASE=http://127.0.0.1:8811/ node docs/gry/test/przypomnienia.mjs
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 700)]);
const now = Date.now();
const dkey = (d) => { const x = new Date(now + d * 864e5); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
const DOCS = JSON.stringify({ deadlines: { dk: { title: "Kolokwium z makroekonomii", subjectId: "makroekonomia", type: "kolokwium", part: "CW", date: dkey(3) } } });
const calls = (p) => p.evaluate(() => window.__przyp || []);
const PL_ZN = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;

// A + B: karta na Dziś
for (const [w, hh] of [[375, 812], [1280, 900]]) {
  const p = await page(b, { konto: "platne", w, h: hh, ls: { "mock-docs": DOCS } });
  await p.goto(BASE + "index.html#/"); await p.waitForTimeout(3000);
  const card = p.locator(".przyp-card");
  ok(`${w} A: karta „Przypomnieć Ci mailem?” na Dziś`, (await card.count()) === 1, await p.locator("main").innerText().then((t) => t.slice(0, 400)));
  const t = await card.innerText().catch(() => "");
  ok(`${w} A: przedmiot, kolokwium, za 3 dni, 18:00`, /Makroekonomia/.test(t) && /kolokwium/.test(t) && /za 3 dni/.test(t) && /18:00/.test(t), t);
  const btn = card.locator(".przyp-on"), bb = await btn.boundingBox(), nb = await card.locator(".przyp-nie").boundingBox();
  ok(`${w} A: jeden przycisk „Włącz” ≥ 44 px, „Nie teraz” ≥ 44 px`, (await card.locator(".btn").count()) === 1 && bb?.height >= 44 && nb?.height >= 44, { bb, nb });
  await card.scrollIntoViewIfNeeded(); await shot(p, `przyp-${w}-dzis`);
  if (w === 375) {
    await btn.click(); await p.waitForTimeout(800);
    const c = await calls(p);
    ok("A: Włącz → zapis wlaczone + 18:00 + język", c.some((x) => x.fn === "ustaw" && x.p.wlaczone === true && x.p.godz === 1080 && x.p.jezyk === "pl"), c);
    ok("A: karta znika, komunikat", (await card.count()) === 0 && /Przypomnienia włączone/.test(await p.locator("body").innerText()));
    await p.waitForTimeout(5000);
    const st = (await calls(p)).filter((x) => x.fn === "stan").pop()?.p;
    ok("A: stan zapisany: termin starosty z id, za 3 dni, 8 dni liczb", st && st.od === dkey(0) && st.ter.some((x) => x.dl === "dk" && x.d === dkey(3) && x.sid === "makroekonomia" && x.r === "K")
      && st.pow.length === 8 && st.rew.length === 8 && st.zad === true && JSON.stringify(st).length < 2000, st);
    const n = (await calls(p)).filter((x) => x.fn === "stan").length;
    await p.goto(BASE + "index.html#/review"); await p.waitForTimeout(5500);
    ok("A: ten sam stan nie idzie drugi raz w tej samej karcie", (await calls(p)).filter((x) => x.fn === "stan").length <= n + 1);
  } else {
    await card.locator(".przyp-nie").click(); await p.waitForTimeout(400);
    ok("B: „Nie teraz” chowa kartę", (await card.count()) === 0 && !!(await p.evaluate(() => localStorage.getItem("skrot-przyp-nie"))));
    await p.reload(); await p.waitForTimeout(2500);
    ok("B: po przeładowaniu dalej schowana", (await p.locator(".przyp-card").count()) === 0);
  }
  ok(`${w} A/B: bez błędów w konsoli`, !p.errors.length, p.errors);
  await p.context().close();
}
// G: karta na Dziś po angielsku
for (const [w, hh] of [[375, 812], [1280, 900]]) {
  const p = await page(b, { konto: "platne", lang: "en", w, h: hh, ls: { "mock-docs": DOCS } });
  await p.goto(BASE + "index.html#/"); await p.waitForTimeout(3000);
  const t = await p.locator(".przyp-card").innerText().catch(() => "");
  ok(`${w} G: karta EN bez polskich znaków`, /Get an email reminder\?/.test(t) && /in 3 days/.test(t) && /Turn on/.test(t) && !PL_ZN.test(t), t);
  await p.locator(".przyp-card").scrollIntoViewIfNeeded().catch(() => {}); await shot(p, `przyp-${w}-en-dzis`);
  await p.context().close();
}
// A: bez terminu w ciągu 14 dni i przy włączonych przypomnieniach karty nie ma
{
  const p = await page(b, { konto: "platne", ls: { "mock-docs": JSON.stringify({ deadlines: { dk: { title: "Egzamin", subjectId: "makroekonomia", type: "egzamin", date: dkey(20) } } }) } });
  await p.goto(BASE + "index.html#/"); await p.waitForTimeout(2500);
  ok("A: termin za 20 dni → bez karty", (await p.locator(".przyp-card").count()) === 0);
  await p.evaluate(() => localStorage.setItem("mock-przyp", JSON.stringify({ wlaczone: true, godz: 1080, co: { terminy: true, powtorki: true, zadanie: true } })));
  await p.evaluate((d) => localStorage.setItem("mock-docs", d), DOCS); await p.reload(); await p.waitForTimeout(2500);
  ok("A: przypomnienia włączone → bez karty", (await p.locator(".przyp-card").count()) === 0);
  await p.context().close();
}

// C + G: Ustawienia → Przypomnienia, PL i EN
for (const lang of ["pl", "en"]) for (const [w, hh] of [[375, 812], [1280, 900]]) {
  const p = await page(b, { konto: "platne", lang, w, h: hh, ls: { "mock-przyp": JSON.stringify({ wlaczone: true, godz: 1080, co: { terminy: true, powtorki: true, zadanie: true }, jezyk: lang }) } });
  await p.goto(BASE + "index.html#/ustawienia/przypomnienia"); await p.waitForTimeout(2500);
  const set = p.locator(".przyp-set");
  const t = await set.innerText().catch(() => "");
  if (lang === "pl") ok(`${w} C: zakładka z włącznikiem, godziną i trzema rodzajami`, /Przypomnienia mailem/.test(t) && /Włączone · student@x\.pl/.test(t) && /Co przypominać/.test(t)
    && (await set.locator("input[type=checkbox]").count()) === 3 && (await p.locator("#pz-godz").inputValue()) === "1080", t);
  else ok(`${w} G: EN bez polskich znaków`, !PL_ZN.test(t) && /Email reminders/.test(t) && /What to remind about/.test(t), t);
  const tab = await p.locator('.set-tabs [role=tab][aria-selected="true"]').innerText();
  ok(`${w} ${lang} C: zakładka „Przypomnienia” wybrana`, lang === "pl" ? tab === "Przypomnienia" : tab === "Reminders", tab);
  const boxes = await set.locator(".pz-co").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
  ok(`${w} ${lang} C: wiersze wyboru ≥ 44 px`, boxes.every((x) => x >= 44), boxes);
  await shot(p, `przyp-${w}-${lang}-ustawienia`);
  if (lang === "pl" && w === 375) {
    await p.locator("#pz-godz").selectOption("1230"); await p.waitForTimeout(600);
    await set.locator('input[data-co="zadanie"]').uncheck(); await p.waitForTimeout(600);
    const c = await calls(p);
    ok("C: zmiana godziny i rodzaju zapisana", c.some((x) => x.fn === "ustaw" && x.p.godz === 1230) && c.some((x) => x.fn === "ustaw" && x.p.co?.zadanie === false && x.p.co?.terminy === true), c);
    await set.locator('button[role=switch]').click(); await p.waitForTimeout(600);
    ok("C: wyłączenie → zapis i pola nieaktywne", (await calls(p)).some((x) => x.fn === "ustaw" && x.p.wlaczone === false) && await p.locator("#pz-godz").isDisabled());
    await p.goto(BASE + "index.html#/more"); await p.waitForTimeout(1500);
    ok("C: wiersz „Przypomnienia” w Więcej", (await p.locator("button.more-row", { hasText: "Przypomnienia" }).count()) === 1);
  }
  ok(`${w} ${lang} C: bez błędów w konsoli`, !p.errors.length, p.errors);
  await p.context().close();
}

// D: bez pełnego dostępu, bez v36, bez logowania
for (const [konto, extra, re, nazwa] of [["darmowe", {}, /działają z pełnym dostępem/, "bez pełnego dostępu"], ["platne", { "mock-przyp": "off" }, /jeszcze nie działają/, "bez v36 w bazie"], ["brak", {}, /Zaloguj się, żeby włączyć/, "bez logowania"]]) {
  const p = await page(b, { konto, ls: extra });
  await p.goto(BASE + "index.html#/ustawienia/przypomnienia"); await p.waitForTimeout(2500);
  const t = await p.locator("main").innerText();
  ok(`D: ${nazwa}: komunikat`, re.test(t), t.slice(0, 500));
  if (konto === "darmowe") ok("D: bez pełnego dostępu: włącznik nieaktywny", await p.locator(".przyp-set button[role=switch]").isDisabled());
  await p.context().close();
}

// E: link z maila
{
  const p = await page(b, { konto: "platne" });
  await p.goto(BASE + "index.html?pz=11111111-2222-4333-8444-555555555555#/review"); await p.waitForTimeout(2500);
  const c = await calls(p);
  ok("E: ?pz → otwarte w bazie, adres bez ?pz", c.some((x) => x.fn === "otwarte" && x.p === "11111111-2222-4333-8444-555555555555") && !/pz=/.test(p.url()) && /#\/review$/.test(p.url()), { c, url: p.url() });
  await p.context().close();
}

// F: strona wypisania
for (const lang of ["pl", "en"]) for (const [w, hh] of [[375, 812], [1280, 900]]) {
  const p = await page(b, { konto: "brak", lang, w, h: hh });
  const req = [];
  await p.context().route(/functions\/v1\/przypomnienia/, (r) => {
    if (r.request().method() === "OPTIONS") return r.fulfill({ status: 200, body: "ok" });
    req.push(JSON.parse(r.request().postData() || "{}"));
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
  const tok = "a".repeat(36);
  await p.goto(BASE + "przypomnienia.html#t=" + tok); await p.waitForTimeout(800);
  ok(`${w} ${lang} F: samo wejście niczego nie wyłącza`, req.length === 0 && !/#t=/.test(p.url()));
  const go = p.locator("#go"), bb = await go.boundingBox();
  ok(`${w} ${lang} F: przycisk ≥ 44 px`, bb?.height >= 44, bb);
  await shot(p, `przyp-${w}-${lang}-wypisz`);
  await go.click(); await p.waitForTimeout(800);
  const t = await p.locator("main").innerText();
  ok(`${w} ${lang} F: jedno kliknięcie → POST z tokenem, „wyłączone”`, req.length === 1 && req[0].akcja === "wypisz" && req[0].token === tok && (lang === "pl" ? /Przypomnienia wyłączone/ : /Reminders turned off/).test(t), { req, t });
  if (lang === "en") ok(`${w} G: strona wypisania EN bez polskich znaków (poza nazwą Skrót)`, !PL_ZN.test(t.replace(/Skrót/g, "")), t);
  if (w === 375 && lang === "pl") await shot(p, "przyp-375-pl-wypisane");
  ok(`${w} ${lang} F: bez błędów w konsoli`, !p.errors.length, p.errors);
  await p.context().close();
}
{
  const p = await page(b, { konto: "brak" });
  await p.goto(BASE + "przypomnienia.html#t=krotki"); await p.waitForTimeout(500);
  ok("F: zły link → komunikat, bez przycisku", /niepełny/.test(await p.locator("main").innerText()) && (await p.locator("#go").count()) === 0);
  await p.context().close();
}

await b.close();
for (const r of wyniki) console.log(r.join(" "));
const bad = wyniki.filter((r) => r[0] === "✗").length;
console.log(bad ? `\n${bad} błędów` : `\nOK ${wyniki.length} sprawdzeń`);
process.exit(bad ? 1 : 0);
