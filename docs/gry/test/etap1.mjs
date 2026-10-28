// Etap 1 (SPEC 11.2): ekran Graj, Fruń, Druga szansa, ekran wyniku. 390 i 1280 px, PL i EN, konta płatne / darmowe / starosta.
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = [];
const ok = (nazwa, warunek, info) => { wyniki.push([warunek ? "✓" : "✗", nazwa, warunek ? "" : JSON.stringify(info)?.slice(0, 400)]); };
const st = (p) => p.evaluate(() => { const s = window.SKROT_GRY?._state?.(); return s ? { state: s.state, score: s.score, revives: s.run?.revives, wrong: s.run?.wrong?.length, ended: s.run?.ended, shelf: s.run?.colors?.shelf, dbg: window.SKROT_GRY._dbg() } : null; });
const calls = (p, fn) => p.evaluate((fn) => window.__rpc.filter((x) => x.fn === fn), fn);
const until = async (p, fn, ms = 15000) => { const t = Date.now(); while (Date.now() - t < ms) { const s = await st(p); if (fn(s)) return s; await p.waitForTimeout(80); } return st(p); };
const key = (p, k) => p.evaluate((k) => document.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true })), k);
// Autopilot w stronie: listek trzyma się środka najbliższej przerwy (wynik musi rosnąć).
const auto = (p, on = true) => p.evaluate((on) => {
  clearInterval(window.__auto); if (!on) return;
  window.__auto = setInterval(() => {
    const d = window.SKROT_GRY._dbg(); if (!d || d.st === "smierc") return;
    const next = d.pipes.filter((q) => q.x + 64 > 100 - 14).sort((a, c) => a.x - c.x)[0];
    const target = next ? next.gy + 22 : (d.H - d.ground) / 2;
    if (d.st === "gotowy" || (d.y > target && d.vy > -60)) document.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
  }, 16);
}, on);
// Poprawna opcja w atrapie: pytanie „…pytanie N” ma correct = (N-1) % 4, a opcja ma tekst „Odpowiedź <litera oryginału><N-1>”.
async function odpowiedzABCD(p, dobrze) {
  const q = await p.locator(".gry-q").textContent(); const i = +q.match(/pytanie (\d+)/)[1] - 1, corr = "ABCD"[i % 4];
  const btn = p.locator(".gry-opt").filter({ hasText: dobrze ? `Odpowiedź ${corr}${i}` : new RegExp(`Odpowiedź [^${corr}]${i}$`) }).first();
  await btn.click();
}
async function otworzFrun(p, w) {
  await p.goto(BASE + "index.html#/gry"); await p.waitForTimeout(1600);
  await p.locator("#gra-frun button.primary").click();
  return until(p, (s) => s?.state === "gra");
}

for (const [w, hgt] of [[390, 844], [1280, 800]]) {
  const p = await page(b, { w, h: hgt });
  await p.goto(BASE + "index.html#/gry"); await p.waitForTimeout(1600);
  // ekran Graj
  const sel = await p.locator("#gry-sid").inputValue();
  ok(`${w}: domyślny przedmiot = najbliższe zaliczenie`, sel === "makroekonomia", sel);
  ok(`${w}: przedmiot < 20 pytań wyszarzony`, await p.locator('#gry-sid option[value="prawo"]').evaluate((o) => o.disabled && /za mało pytań/.test(o.textContent)));
  await shot(p, `e1-graj-${w}`);
  // Fruń: start, sufit nie zabija
  await p.locator("#gra-frun button.primary").click();
  let s = await until(p, (s) => s?.state === "gra");
  await shot(p, `e1-gotowy-${w}`);
  ok(`${w}: stan „gotowy” z napisem`, s?.dbg?.st === "gotowy" && (await p.locator(".gry-hint").textContent()) === "Dotknij, żeby lecieć", s);
  for (let i = 0; i < 14; i++) { await key(p, " "); await p.waitForTimeout(90); }
  s = await st(p);
  ok(`${w}: sufit nie zabija (spacja = skok)`, s.dbg.st === "gra" && s.dbg.y < 60, s.dbg);
  // dalej przy suficie: zderzenie z półką
  for (let i = 0; i < 40 && (await st(p)).state === "gra"; i++) { await key(p, " "); await p.waitForTimeout(100); }
  s = await until(p, (s) => s.state === "pytanie", 6000);
  ok(`${w}: kolizja z półką → Druga szansa ABCD`, s.state === "pytanie" && (await p.locator(".gry-sheet .eyebrow").textContent()) === "Druga szansa · 1/2" && (await p.locator(".gry-opt").count()) >= 2, s);
  ok(`${w}: rozmyty canvas`, await p.locator(".gry-cv.blur").count() === 1);
  await shot(p, `e1-pytanie-${w}`);
  // klawisz 1–4 działa: dobra odpowiedź klawiszem
  const q = await p.locator(".gry-q").textContent(); const qi = +q.match(/pytanie (\d+)/)[1] - 1;
  const opts = await p.locator(".gry-opt span").allTextContents(); const pos = opts.findIndex((t) => t === `Odpowiedź ${"ABCD"[qi % 4]}${qi}`);
  await key(p, String(pos + 1)); await p.waitForTimeout(300);
  ok(`${w}: klawisz ${pos + 1} → „Dobrze! Grasz dalej.”`, (await p.locator(".gry-verdict").textContent()) === "Dobrze! Grasz dalej.");
  await shot(p, `e1-dobrze-${w}`);
  await p.getByRole("button", { name: "Graj dalej" }).click(); await p.waitForTimeout(400);
  s = await st(p);
  ok(`${w}: wskrzeszenie: listek na środku, brak kolumn przed nim`, s.dbg.st === "gotowy" && Math.abs(s.dbg.y - (s.dbg.H - s.dbg.ground) / 2) < 8 && !s.dbg.pipes.some((q) => q.x < 100 + 220) && (await p.locator(".gry-hint").textContent()) === "Dotknij, żeby grać dalej", s.dbg);
  await key(p, " "); await p.waitForTimeout(100);
  s = await st(p);
  ok(`${w}: 2 s nietykalności po pierwszym dotknięciu`, s.dbg.invuln > 1.7, s.dbg);
  // autopilot: wynik rośnie po minięciu kolumn
  await auto(p); await p.waitForTimeout(9000);
  s = await st(p);
  ok(`${w}: wynik rośnie (autopilot)`, s.score >= 3, s);
  await shot(p, `e1-gra-${w}`);
  await auto(p, false);
  // pauza po ukryciu karty; powrót nie przeskakuje czasu
  await p.evaluate(() => { Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true }); document.dispatchEvent(new Event("visibilitychange")); });
  const s1 = await st(p); await p.waitForTimeout(1500); const s2 = await st(p);
  ok(`${w}: ukrycie karty → pauza, gra stoi`, s1.state === "pauza" && s2.dbg.y === s1.dbg.y && (await p.locator(".gry-hint").textContent()) === "Pauza – dotknij, żeby grać dalej", [s1.state, s1.dbg.y, s2.dbg.y]);
  await p.evaluate(() => { Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true }); });
  await p.locator(".gry-stage").click({ position: { x: 30, y: 200 } }); await p.waitForTimeout(40);
  const s3 = await st(p);
  ok(`${w}: po pauzie gra rusza od miejsca zatrzymania`, s3.state === "gra" && Math.abs(s3.dbg.y - s1.dbg.y) < 40, [s1.dbg.y, s3.dbg.y]);
  // 2. śmierć (spadek) → zadanie 60 s; zła odpowiedź → wynik
  s = await until(p, (s) => s.state === "pytanie", 8000);
  ok(`${w}: 2. śmierć → „Ostatnia szansa” z zadaniem`, (await p.locator(".gry-sheet .eyebrow").textContent()) === "Ostatnia szansa · 2/2" && (await p.locator(".gry-in").count()) === 1);
  await p.locator(".gry-in").fill("abc"); await p.keyboard.press("Enter"); await p.waitForTimeout(150);
  ok(`${w}: „Wpisz liczbę” bez zużycia próby`, (await p.locator(".gry-verdict").textContent()) === "Wpisz liczbę" && !(await p.locator(".gry-in").isDisabled()));
  const srsPrzed = await p.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("bm-progress-00000000-0000-4000-8000-000000000001") || "{}").data?.srs || {}).length);
  await p.locator(".gry-in").fill("99999"); await p.keyboard.press("Enter"); await p.waitForTimeout(300);
  ok(`${w}: zła odpowiedź → „To nie to. Poprawna: …”`, /^To nie to\. Poprawna: /.test(await p.locator(".gry-verdict").textContent()));
  await shot(p, `e1-zle-${w}`);
  const srsPo = await p.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("bm-progress-00000000-0000-4000-8000-000000000001") || "{}").data?.srs || {}).length);
  ok(`${w}: fiszki materiału w Powtórkach (max 5)`, srsPo - srsPrzed > 0 && srsPo - srsPrzed <= 5, [srsPrzed, srsPo]);
  await p.getByRole("button", { name: "Zobacz wynik" }).click(); await p.waitForTimeout(600);
  await shot(p, `e1-wynik-${w}`);
  const kon = await calls(p, "nauka_gra_koniec");
  ok(`${w}: rp.koniec wysłane, pkt z bazy na ekranie`, kon.length === 1 && /^\+\d+$/.test(await p.locator(".gry-stat b").nth(1).textContent()), kon);
  ok(`${w}: rekord lokalny zapisany`, +(await p.evaluate(() => localStorage.getItem("bm-gry-rekord:frun"))) === s.score || +(await p.evaluate(() => localStorage.getItem("bm-gry-rekord:frun"))) > 0);
  const odp = await calls(p, "nauka_rp_odpowiedz"), zad = await calls(p, "nauka_rp_zadanie");
  ok(`${w}: odpowiedzi w tle z run i zrodlo=gra`, odp.length === 1 && odp[0].args.p_zrodlo === "gra" && odp[0].args.p_run && zad.length === 1 && zad[0].args.p_run, { odp, zad });
  // „Jeszcze raz”: nowa runda, 3. śmierć bez pytań gdy obie szanse zużyte
  await p.getByRole("button", { name: "Jeszcze raz" }).click();
  s = await until(p, (s) => s?.state === "gra" && s.dbg?.st === "gotowy");
  ok(`${w}: „Jeszcze raz” startuje nową rundę`, s.revives === 0 && s.score === 0, s);
  // spadek → ABCD dobrze → spadek → zadanie dobrze (5) → spadek → od razu wynik
  await key(p, " "); s = await until(p, (s) => s.state === "pytanie"); await odpowiedzABCD(p, true); await p.getByRole("button", { name: "Graj dalej" }).click();
  await key(p, " "); s = await until(p, (s) => s.state === "pytanie");
  await p.locator(".gry-in").fill(await p.locator(".gry-q").textContent().then((t) => (/Ceny/.test(t) ? "5" : "250"))); await p.keyboard.press("Enter"); await p.waitForTimeout(200);
  ok(`${w}: zadanie dobrze → grasz dalej`, (await p.locator(".gry-verdict").textContent()) === "Dobrze! Grasz dalej.");
  await p.keyboard.press("Enter"); await p.waitForTimeout(300); // Enter = „Graj dalej”
  await key(p, " "); s = await until(p, (s) => s.state === "wynik");
  ok(`${w}: 3. śmierć → od razu wynik`, s.state === "wynik" && s.revives === 2, s);
  ok(`${w}: XP za dobre odpowiedzi`, (await p.locator(".gry-stat b").nth(2).textContent()) === "+10 ⚡", await p.locator(".gry-stat b").nth(2).textContent());
  // ✕ w trakcie rundy → pytanie → koniec wysłany
  await p.getByRole("button", { name: "Jeszcze raz" }).click(); await until(p, (s) => s?.state === "gra");
  await key(p, " "); await p.waitForTimeout(150);
  const przed = (await calls(p, "nauka_gra_koniec")).length;
  await p.locator(".gry-x").click(); await p.waitForTimeout(250);
  ok(`${w}: ✕ → „Przerwać rundę?”`, await p.getByText("Przerwać rundę?").count() === 1);
  await p.locator(".modal").getByRole("button", { name: "Zakończ rundę" }).click(); await p.waitForTimeout(400);
  ok(`${w}: po ✕ rp.koniec wysłane i gra zamknięta`, (await calls(p, "nauka_gra_koniec")).length === przed + 1 && !(await p.locator(".gry").count()));
  // Wstecz telefonu zamyka grę, nie stronę
  await otworzFrun(p, w);
  await p.goBack(); await p.waitForTimeout(400);
  ok(`${w}: Wstecz poza rundą zamyka grę, strona zostaje`, !(await p.locator(".gry").count()) && p.url().endsWith("#/gry"), p.url());
  ok(`${w}: zero błędów w konsoli`, !p.errors.length, p.errors);
  await p.context().close();
}

// „Mniej animacji”, motyw różowy, koniec czasu, „Powtórz pomylone”
{
  const p = await page(b, { ls: { "skrot-calm": "1" } });
  await p.emulateMedia({ reducedMotion: "reduce" });
  await otworzFrun(p, 390);
  await p.evaluate(() => document.documentElement.setAttribute("data-theme", "pink"));
  await p.locator(".gry-x").click(); await p.waitForTimeout(200);
  await otworzFrun(p, 390);
  let s = await st(p);
  ok("motyw różowy: kolory gry z CSS", /e0438f/i.test(s.shelf) || /224, 67, 143/.test(s.shelf), s.shelf);
  await shot(p, "e1-rozowy");
  await key(p, " "); s = await until(p, (s) => s.state === "pytanie");
  ok("Mniej animacji: bez blura", !(await p.locator(".gry-cv.blur").count()));
  await p.waitForTimeout(20800);
  ok("koniec czasu = zła odpowiedź („Czas minął.”)", /^Czas minął\. To nie to\./.test(await p.locator(".gry-verdict").textContent()), await p.locator(".gry-verdict").textContent());
  const zle = await p.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("bm-gry-zle") || "{}")));
  ok("pomylone pytanie w bm-gry-zle", zle.length === 1 && /^m[12]:\d+$/.test(zle[0]), zle);
  await p.getByRole("button", { name: "Zobacz wynik" }).click(); await p.waitForTimeout(300);
  await p.getByRole("button", { name: /Powtórz pomylone/ }).click(); await p.waitForTimeout(1200);
  ok("„Powtórz pomylone” otwiera quiz", await p.locator(".lp").count() === 1 && !(await p.locator(".gry").count()));
  ok("zero błędów (różowy, mniej animacji)", !p.errors.length, p.errors);
  await p.context().close();
}
// EN: zero polskich napisów w interfejsie gry (treść pytań może być PL)
{
  const p = await page(b, { lang: "en" });
  await p.goto(BASE + "index.html#/gry"); await p.waitForTimeout(1800);
  await shot(p, "e1-graj-en");
  const viewTxt = await p.locator("#app, main").last().innerText();
  ok("EN: ekran Graj bez polskich tekstów", !/Graj i powtarzaj|Przedmiot:|Leć między|wkrótce|zaliczenie|pytań/.test(viewTxt), viewTxt.slice(0, 300));
  await p.locator("#gra-frun button.primary").click(); await until(p, (s) => s?.state === "gra");
  const PL = /[ąćęłńóśźż]|Dotknij|kolumn|Druga|szansa|Zakończ|Dobrze|Graj|rekord|Zobacz|Jeszcze|pomylone|dobrze|Wróć/i;
  const t1 = await p.locator(".gry-top, .gry-hint").allInnerTexts();
  await key(p, " "); await until(p, (s) => s.state === "pytanie");
  const t2 = await p.locator(".gry-sheet").evaluate((el) => [...el.querySelectorAll(":scope > :not(.gry-q):not(.gry-opts)")].map((x) => x.innerText).join(" | "));
  await odpowiedzABCD(p, false); await p.waitForTimeout(200);
  const t3 = await p.locator(".gry-verdict, .gry-foot button").allInnerTexts();
  await p.getByRole("button", { name: /See (your )?score/ }).click(); await p.waitForTimeout(500);
  await shot(p, "e1-wynik-en");
  const t4 = await p.locator(".gry-res").evaluate((el) => [...el.querySelectorAll(":scope > *:not(.gry-review)")].map((x) => x.innerText).join(" | "));
  const all = [t1.join(" | "), t2, t3.join(" | "), t4].join(" || ").replace(/Makroekonomia|Macroeconomics/g, "");
  ok("EN: interfejs gry bez polskich napisów", !PL.test(all), all);
  ok("EN: zero błędów", !p.errors.length, p.errors);
  await p.context().close();
}
// Darmowe konto: paywall; starosta: to samo co student
{
  const p = await page(b, { konto: "darmowe" });
  await p.goto(BASE + "index.html#/gry"); await p.waitForTimeout(1500);
  ok("darmowe: paywall zamiast kafelków", (await p.locator(".paywall").count()) === 1 && !(await p.locator("#gra-frun").count()));
  await shot(p, "e1-darmowe");
  await p.context().close();
  const q = await page(b, { konto: "starosta" });
  await q.goto(BASE + "index.html#/gry"); await q.waitForTimeout(1500);
  ok("starosta: ekran Graj jak u studenta", (await q.locator("#gra-frun button.primary").count()) === 1);
  // wejścia: Powtórki i Więcej
  await q.goto(BASE + "index.html#/review"); await q.waitForTimeout(1200);
  ok("wejście: Powtórki → „Powtarzaj grając”", (await q.getByText("Powtarzaj grając").count()) === 1);
  await shot(q, "e1-powtorki");
  await q.goto(BASE + "index.html#/more"); await q.waitForTimeout(1000);
  ok("wejście: Więcej → „Graj i powtarzaj”", (await q.getByText("Graj i powtarzaj").count()) >= 1);
  await q.goto(BASE + "index.html#/home"); await q.waitForTimeout(1200);
  ok("wejście: Dziś → „Masz 3 minuty?”", (await q.getByText(/Masz 3 minuty\?/).count()) === 1);
  await shot(q, "e1-dzis");
  await q.goto(BASE + "index.html#/subject/makroekonomia"); await q.waitForTimeout(1200);
  const cw = q.getByText("Ćwicz", { exact: true }).first(); if (await cw.count()) { await cw.click(); await q.waitForTimeout(600); }
  ok("wejście: Przedmiot → „Zagraj z tym przedmiotem”", (await q.getByText("Zagraj z tym przedmiotem").count()) === 1);
  ok("starosta: zero błędów", !q.errors.length, q.errors);
  await q.context().close();
}
await b.close();
for (const w of wyniki) console.log(w.join(" "));
console.log(wyniki.filter((w) => w[0] === "✓").length + "/" + wyniki.length);
process.exit(wyniki.some((w) => w[0] === "✗") ? 1 : 0);
