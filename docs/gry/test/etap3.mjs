// Etap 3 (SPEC 11.2): Pary – rozmiary i tryby, dopasowanie/pomyłka/blokada, czytnik ekranu i strzałki, Powtórki i „Ćwicz pomylone słówka”.
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = [];
const ok = (nazwa, warunek, info) => { wyniki.push([warunek ? "✓" : "✗", nazwa, warunek ? "" : JSON.stringify(info)?.slice(0, 400)]); };
const dbg = (p) => p.evaluate(() => window.SKROT_GRY._dbg());
const st = (p) => p.evaluate(() => window.SKROT_GRY._state().state);
const calls = (p, fn) => p.evaluate((fn) => window.__rpc.filter((x) => x.fn === fn).map((x) => x.args), fn);
async function start(p, tryb, trud) {
  await p.goto(BASE + "index.html#/gry"); await p.waitForTimeout(2200);
  await p.locator("#gra-pary button.primary").click(); await p.waitForTimeout(400);
  await p.locator(".modal .sk-seg button", { hasText: tryb === "def" ? "Definicje" : "EN – PL" }).click();
  await p.locator(".modal .sk-seg button", { hasText: { latwy: "Łatwa", sredni: "Średnia", trudny: "Trudna" }[trud] }).click();
  await p.getByRole("button", { name: "Zaczynamy" }).click();
  for (let i = 0; i < 40 && !(await p.locator(".pk").count()); i++) await p.waitForTimeout(100);
}
// indeksy kart pary pid
const pairOf = (d, pid) => d.cards.map((c, i) => (c.pid === pid ? i : -1)).filter((i) => i >= 0);
const clickCard = async (p, i) => { await p.locator(".pk").nth(i).click(); };

for (const [w, hgt] of [[390, 844], [1280, 800]]) {
  // rozmiary i tryby
  for (const [tryb, trud, cols, rows] of [["enpl", "latwy", w < 400 ? 3 : 4, w < 400 ? 4 : 3], ["def", "sredni", 4, 4], ["enpl", "trudny", w < 400 ? 4 : 5, w < 400 ? 5 : 4]]) {
    const p = await page(b, { w, h: hgt });
    await start(p, tryb, trud);
    const d = await dbg(p);
    ok(`${w}: ${tryb}/${trud} → ${cols}×${rows}, ${cols * rows / 2} par`, d.cols === cols && d.rows === rows && d.n === cols * rows / 2, d && { cols: d.cols, rows: d.rows, n: d.n });
    if (tryb === "def") ok(`${w}: tryb Definicje: karty B z definicją`, (await p.locator(".pk-wrap.def").count()) === 1);
    await shot(p, `e3-${tryb}-${trud}-${w}`);
    await p.context().close();
  }
  // przebieg: pomyłka, blokada trzeciej karty, dopasowanie z wyjaśnieniem, etykiety, strzałki, koniec
  const p = await page(b, { w, h: hgt });
  await start(p, "enpl", "latwy");
  let d = await dbg(p);
  ok(`${w}: etykiety kart zakrytych`, (await p.locator(".pk").first().getAttribute("aria-label")) === "Karta 1, zakryta");
  // strzałki: fokus po siatce
  await p.locator(".pk").first().focus(); await p.keyboard.press("ArrowRight"); await p.keyboard.press("ArrowDown");
  const fi = await p.evaluate(() => [...document.querySelectorAll(".pk")].indexOf(document.activeElement));
  ok(`${w}: strzałki przesuwają fokus (roving tabindex)`, fi === 1 + d.cols && (await p.locator('.pk[tabindex="0"]').count()) === 1, fi);
  // pomyłka (karty dwóch różnych par)
  const [a0] = pairOf(d, 0), [b1] = pairOf(d, 1);
  await clickCard(p, a0); await clickCard(p, b1); await p.waitForTimeout(80);
  d = await dbg(p);
  ok(`${w}: pomyłka: czerwone, bledy=1, blokada`, d.bledy === 1 && d.lock && (await p.locator(".pk.bad").count()) === 2);
  const third = pairOf(d, 2)[0];
  await clickCard(p, third); await p.waitForTimeout(50);
  ok(`${w}: trzecia karta zablokowana w trakcie`, !(await dbg(p)).cards[third].up);
  await shot(p, `e3-zle-${w}`);
  await p.waitForTimeout(1000);
  d = await dbg(p);
  ok(`${w}: po 900 ms karty się zakrywają`, !d.cards[a0].up && !d.cards[b1].up && !d.lock);
  // dopasowanie klawiaturą (Enter)
  const [x1, x2] = pairOf(d, 0);
  await p.locator(".pk").nth(x1).focus(); await p.keyboard.press("Enter"); await p.locator(".pk").nth(x2).focus(); await p.keyboard.press(" ");
  await p.waitForTimeout(150);
  d = await dbg(p);
  const lab = await p.locator(".pk").nth(x1).getAttribute("aria-label");
  ok(`${w}: dopasowanie (Enter/Spacja), etykieta „dopasowana”`, d.matched === 1 && /^Karta \d+: .+, dopasowana$/.test(lab), lab);
  ok(`${w}: wyjaśnienie pod planszą „EN = PL”`, (await p.locator(".pk-info.on").count()) === 1 && / = /.test(await p.locator(".pk-info").textContent()));
  await shot(p, `e3-para-${w}`);
  await p.waitForTimeout(1600);
  ok(`${w}: wyjaśnienie znika po 1,5 s`, !(await p.locator(".pk-info.on").count()));
  ok(`${w}: licznik czasu mm:ss`, /^\d+:\d\d$/.test(await p.locator(".gry-time-txt").textContent()));
  // reszta par: najpierw 3 kolejne pomyłki (≥ 4 pomylone pary), potem wszystko dobrze
  for (const [u, v] of [[1, 2], [3, 4], [1, 3]]) {
    d = await dbg(p); await clickCard(p, pairOf(d, u)[0]); await clickCard(p, pairOf(d, v)[1]); await p.waitForTimeout(1000);
  }
  d = await dbg(p);
  for (let pid = 1; pid < d.n; pid++) { const [i1, i2] = pairOf(d, pid); await clickCard(p, i1); await clickCard(p, i2); await p.waitForTimeout(60); }
  for (let i = 0; i < 30 && (await st(p)) !== "wynik"; i++) await p.waitForTimeout(100);
  ok(`${w}: cała plansza → ekran wyniku`, (await st(p)) === "wynik");
  await p.waitForTimeout(300);
  await shot(p, `e3-wynik-${w}`);
  const kon = await calls(p, "nauka_gra_koniec");
  ok(`${w}: rp.koniec z wynikiem, błędami i czasem`, kon.length === 1 && kon[0].p_wynik === d.n && kon[0].p_bledy === 4 && kon[0].p_czas_ms > 0, kon);
  ok(`${w}: wynik: „N par · 4 pomyłki · m:ss”`, new RegExp(`^${d.n} par · 4 pomyłki · \\d+:\\d\\d$`).test(await p.locator(".gry-unit").first().textContent()), await p.locator(".gry-unit").first().textContent());
  const srs = await p.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("bm-progress-00000000-0000-4000-8000-000000000001") || "{}").data?.srs || {}).filter((k) => k.startsWith("g:")));
  ok(`${w}: pomylone pojęcia w Powtórkach`, srs.length === 5, srs);
  ok(`${w}: rekord lokalny Par`, !!(await p.evaluate(() => localStorage.getItem("bm-gry-rekord:pary:makroekonomia:latwy"))));
  await p.getByRole("button", { name: "Ćwicz pomylone słówka" }).click(); await p.waitForTimeout(1000);
  ok(`${w}: „Ćwicz pomylone słówka” otwiera odtwarzacz`, (await p.locator(".lp").count()) === 1 && !(await p.locator(".gry").count()));
  await shot(p, `e3-cwicz-${w}`);
  ok(`${w}: zero błędów`, !p.errors.length, p.errors);
  await p.context().close();
}
// < 6 par → wyszarzone; Słowniczek → „Pary ze słowniczka”; plansza bez pomyłki → XP +5; EN
{
  const p = await page(b, { ls: { "bm-gry-sid": "odrabianie-zajec" } });
  await p.goto(BASE + "index.html#/gry"); await p.waitForTimeout(2200);
  ok("< 6 par → kafelek wyszarzony „za mało pojęć”", (await p.locator("#gra-pary button.primary").isDisabled()) && /za mało pojęć/.test(await p.locator("#gra-pary").innerText()));
  await p.goto(BASE + "index.html#/glossary"); await p.waitForTimeout(2000);
  const btn = p.getByRole("button", { name: /Pary ze słowniczka/ });
  ok("Słowniczek → „Pary ze słowniczka”", (await btn.count()) === 1);
  await btn.click(); await p.waitForTimeout(400);
  await p.locator(".modal .sk-seg button", { hasText: "Łatwa" }).click();
  await p.getByRole("button", { name: "Zaczynamy" }).click();
  for (let i = 0; i < 40 && !(await p.locator(".pk").count()); i++) await p.waitForTimeout(100);
  const d = await dbg(p);
  for (let pid = 0; pid < d.n; pid++) { const [i1, i2] = pairOf(d, pid); await clickCard(p, i1); await clickCard(p, i2); await p.waitForTimeout(40); }
  for (let i = 0; i < 30 && (await st(p)) !== "wynik"; i++) await p.waitForTimeout(100);
  ok("plansza bez pomyłki: XP +6 par +5 = +11", (await p.locator(".gry-stat b").nth(2).textContent()) === "+11 ⚡", await p.locator(".gry-stat b").nth(2).textContent());
  ok("bez pomyłek: brak „Ćwicz pomylone słówka”", !(await p.getByRole("button", { name: "Ćwicz pomylone słówka" }).count()));
  ok("zero błędów (słowniczek)", !p.errors.length, p.errors);
  await p.context().close();
}
{
  const p = await page(b, { lang: "en" });
  await p.goto(BASE + "index.html#/gry"); await p.waitForTimeout(2200);
  await p.locator("#gra-pary button.primary").click(); await p.waitForTimeout(400);
  const m = await p.locator(".modal").innerText();
  await p.locator(".modal .sk-seg button").nth(2).click(); // Easy
  await p.locator(".modal .btn.primary").click();
  for (let i = 0; i < 40 && !(await p.locator(".pk").count()); i++) await p.waitForTimeout(100);
  const lab = await p.locator(".pk").first().getAttribute("aria-label");
  const d = await dbg(p);
  const [a0] = pairOf(d, 0), [b1] = pairOf(d, 1); await clickCard(p, a0); await clickCard(p, b1); await p.waitForTimeout(1000);
  for (let pid = 0; pid < d.n; pid++) { const [i1, i2] = pairOf(d, pid); await clickCard(p, i1); await clickCard(p, i2); await p.waitForTimeout(40); }
  for (let i = 0; i < 30 && (await st(p)) !== "wynik"; i++) await p.waitForTimeout(100);
  const res = await p.locator(".gry-res").innerText();
  await shot(p, "e3-en");
  const PL = /[ąćęłńóśźż]|Tryb|Plansza|Definicje|Zaczynamy|Karta|zakryta|pomył|Jeszcze|Wróć|rankingu/;
  ok("EN: okno startu, etykiety kart i wynik po angielsku", !PL.test(m) && lab === "Card 1, face down" && !PL.test(res), { m, lab, res });
  ok("EN: zero błędów", !p.errors.length, p.errors);
  await p.context().close();
}
await b.close();
for (const w of wyniki) console.log(w.join(" "));
console.log(wyniki.filter((w) => w[0] === "✓").length + "/" + wyniki.length);
process.exit(wyniki.some((w) => w[0] === "✗") ? 1 : 0);
