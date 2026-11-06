// Wyszukiwarka funkcji w „Więcej”: wpisujesz, czego szukasz („średnia”, „ciemny motyw”, „hasło”), dostajesz ekran albo przycisk.
// Uruchom: python3 -m http.server 8799 (w katalogu repo), potem BASE=http://127.0.0.1:8799/ node docs/gry/test/wyszukiwarka-funkcji.mjs
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 600)]);
const open = async (p, hash) => { await p.goto(BASE + "index.html" + hash); await p.waitForTimeout(2200); };
const q = async (p, text) => { await p.locator("#more-q").fill(text); await p.waitForTimeout(150); return p.locator(".fn-hit .t").allInnerTexts(); };

const p = await page(b, { konto: "platne" });
await open(p, "#/more");
ok("pole wyszukiwania na górze Więcej", (await p.locator("#more-q").count()) === 1);
ok("bez zapytania: zwykłe Więcej", (await p.locator(".more-body").isVisible()) && (await p.locator(".fn-hit").count()) === 0);

let t = await q(p, "średnia");
ok("„średnia” → Kalkulator średniej pierwszy", t[0] === "Kalkulator średniej", t);
ok("wyniki chowają resztę Więcej", !(await p.locator(".more-body").isVisible()));
await shot(p, "fn-srednia");
t = await q(p, "srednia"); ok("bez polskich znaków też", t[0] === "Kalkulator średniej", t);
t = await q(p, "kalkulatro"); ok("literówka „kalkulatro”", t.includes("Kalkulator średniej"), t);
t = await q(p, "ciemny"); ok("„ciemny” → Tryb ciemny i jasny", t[0] === "Tryb ciemny i jasny", t);
t = await q(p, "hasło"); ok("„hasło” → Hasło do logowania i Hasło dnia", t.includes("Hasło do logowania") && t.includes("Hasło dnia"), t);
t = await q(p, "monety"); ok("„monety” (odmiana) → Sklep i monety", t.includes("Sklep i monety"), t);
t = await q(p, "nie byłem na wykładzie"); ok("zdanie potoczne → Powtórka w 5 minut", t[0] === "Powtórka w 5 minut", t);
t = await q(p, "jak zmienić hasło"); ok("pytanie „jak zmienić hasło” → Hasło do logowania", t[0] === "Hasło do logowania", t);
t = await q(p, "gdzie są motywy"); ok("„gdzie są motywy” → Motywy", t[0] === "Motywy", t);
t = await q(p, "kalendarz telefon xyz"); ok("2 z 3 słów pasują → wynik zamiast pustki", t[0] === "Kalendarz w telefonie", t);
t = await q(p, "tramwaj"); ok("„tramwaj” → Lekcja na przejazd", t[0] === "Lekcja na przejazd", t);
t = await q(p, "google"); ok("„google” → Kalendarz w telefonie", t[0] === "Kalendarz w telefonie", t);
t = await q(p, "dark mode"); ok("po angielsku „dark mode”", t[0] === "Tryb ciemny i jasny", t);
t = await q(p, "przewodnik"); ok("przewodnik: najpierw funkcja, potem rozdziały", t[0] === "Przewodnik po stronie" && t.some((x) => /^Przewodnik: /.test(x)), t);
t = await q(p, "starosta"); ok("student nie widzi narzędzi starosty", !t.some((x) => /starosty/i.test(x)), t);

t = await q(p, "xyzqw");
ok("brak wyników: komunikat + przejście do materiałów", (await p.locator(".fn-sr .empty").count()) === 1 && (await p.locator(".fn-mat").count()) === 1);
await p.locator(".fn-mat").click(); await p.waitForTimeout(500);
ok("przejście: Przedmioty z tym samym zapytaniem", /#\/materials$/.test(p.url()) && (await p.locator("#q").inputValue()) === "xyzqw", [p.url(), await p.locator("#q").inputValue()]);

await open(p, "#/more");
await q(p, "kalkulator");
await p.locator("#more-q").press("Enter"); await p.waitForTimeout(700);
ok("Enter otwiera pierwszy wynik (zasady zaliczeń, kalkulator)", /#\/grading$/.test(p.url()) && (await p.locator("#kalkulator").count()) === 1, p.url());
await p.goBack(); await p.waitForTimeout(500);
ok("po powrocie Więcej bez starego zapytania", (await p.locator("#more-q").inputValue()) === "" && (await p.locator(".more-body").isVisible()));

await q(p, "pary");
await p.locator(".fn-hit", { hasText: "Pary" }).first().click(); await p.waitForTimeout(900);
ok("gra Pary: ekran gier i kafelek Pary", /#\/gry$/.test(p.url()) && (await p.locator("#gra-pary").count()) === 1, p.url());

await open(p, "#/more");
await q(p, "grupa");
await p.locator("#more-q").press("ArrowDown");
ok("strzałka w dół przenosi do wyników", await p.evaluate(() => document.activeElement?.classList.contains("fn-hit")));
await p.keyboard.press("Enter"); await p.waitForTimeout(400);
ok("Moja grupa otwiera okno wyboru grupy", (await p.locator(".modal").count()) === 1);
await p.keyboard.press("Escape"); await p.waitForTimeout(200);

await open(p, "#/more");
await p.locator("main").click({ position: { x: 5, y: 5 } }).catch(() => {});
await p.keyboard.press("/"); await p.waitForTimeout(200);
ok("„/” na Więcej: kursor w wyszukiwarce funkcji", /#\/more$/.test(p.url()) && (await p.evaluate(() => document.activeElement?.id)) === "more-q", p.url());
await p.keyboard.type("motyw"); await p.waitForTimeout(150);
await p.keyboard.press("Escape"); await p.waitForTimeout(150);
ok("Esc czyści pole", (await p.locator("#more-q").inputValue()) === "" && (await p.locator(".more-body").isVisible()));
ok("student: bez błędów w konsoli", p.errors.length === 0, p.errors);

// ---- bez pełnego dostępu: kłódka przy płatnych
const g = await page(b, { konto: "darmowe" });
await open(g, "#/more");
t = await q(g, "ranking");
const sec = await g.locator(".fn-hit", { hasText: "Ranking kierunku" }).locator(".fn-sec").innerText().catch(() => "");
ok("bez dostępu: 🔒 przy Rankingu", /🔒/.test(sec), [t, sec]);
await shot(g, "fn-darmowe");
ok("darmowe: bez błędów w konsoli", g.errors.length === 0, g.errors);

// ---- angielski
const e = await page(b, { konto: "platne", lang: "en" });
await open(e, "#/more");
ok("EN: placeholder po angielsku", /Search features/.test(await e.locator("#more-q").getAttribute("placeholder")));
t = await q(e, "average");
ok("EN: „average” → Grade average calculator", t[0] === "Grade average calculator", t);
t = await q(e, "calendar");
const pl = (await e.locator(".fn-sr").innerText()).match(/[ąćęłńóśźż]/gi);
ok("EN: wyniki bez polskich liter", !pl, (await e.locator(".fn-sr").innerText()).slice(0, 500));
await shot(e, "fn-en");
ok("EN: bez błędów w konsoli", e.errors.length === 0, e.errors);

// ---- komputer
const d = await page(b, { konto: "platne", w: 1280, h: 900 });
await open(d, "#/more"); await q(d, "kalendarz"); await shot(d, "fn-desktop");

await b.close();
for (const w of wyniki) console.log(w.filter(Boolean).join(" "));
const bad = wyniki.filter((w) => w[0] === "✗").length;
console.log(`\n${wyniki.length - bad}/${wyniki.length}`);
process.exit(bad ? 1 : 0);
