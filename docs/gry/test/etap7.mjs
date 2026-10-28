// Etap 7 (docs/gry/SPEC-2.md 5 i checklista 7 „Etap 7”): Hasło dnia – plansza, klawiatury, kolory z bazy, podpowiedź,
// koniec (trafienie / 6 nieudanych), odświeżenie w trakcie, udostępnianie, konto bez dostępu, wejścia, daltonizm,
// czytnik ekranu, brak sieci, zmiana dnia, no_words / brak v15, „Mniej animacji”, motyw różowy. Zrzuty: 390 i 1280, PL i EN.
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = [];
const ok = (nazwa, warunek, info) => { wyniki.push([warunek ? "✓" : "✗", nazwa, warunek ? "" : JSON.stringify(info)?.slice(0, 400)]); };
const dzis = () => new Date().toISOString().slice(0, 10); // jak atrapa
const wzor = (slowo, proba) => { // jak nauka_haslo_wzor
  const w = Array(slowo.length).fill(0), zost = [];
  for (let i = 0; i < slowo.length; i++) { if (proba[i] === slowo[i]) w[i] = 2; else zost.push(slowo[i]); }
  for (let i = 0; i < slowo.length; i++) if (!w[i]) { const j = zost.indexOf(proba[i]); if (j >= 0) { w[i] = 1; zost.splice(j, 1); } }
  return w.join(""); };
const PKT = [0, 20, 20, 15, 12, 10, 8];
const stan = (proby, slowo = "REVENUE") => { const won = proby.indexOf(slowo); const wynik = won >= 0 ? won + 1 : proby.length >= 6 ? 0 : null;
  return JSON.stringify({ dzien: dzis(), proby, wzory: proby.map((x) => wzor(slowo, x)), wynik, pkt: wynik ? PKT[wynik] : 0 }); };
const HD = (p) => p.evaluate(() => { const s = window.SKROT_HASLO._state(); return { d: s.d, wpis: s.wpis, err: s.err, reveal: s.reveal }; });
const calls = (p, fn) => p.evaluate((fn) => window.__rpc.filter((x) => x.fn === fn), fn);
const idle = async (p) => { await p.waitForTimeout(80); for (let i = 0; i < 80; i++) { if (!(await p.evaluate(() => { const s = window.SKROT_HASLO._state(); return s.busy || s.reveal >= 0 || s.loading; }))) break; await p.waitForTimeout(80); } await p.waitForTimeout(120); };
const typ = async (p, w) => { for (const c of w) await p.keyboard.press(c); };
const guess = async (p, w) => { await typ(p, w); await p.keyboard.press("Enter"); await idle(p); };
const open = async (p, hash = "haslo") => { await p.goto(BASE + "index.html#/" + hash); for (let i = 0; i < 50 && !(await p.locator(".hd-board, .hd-view .notice").count()); i++) await p.waitForTimeout(100); await p.waitForTimeout(150); };
const curRow = (p) => p.locator(".hd-row.cur .hd-t").allTextContents().then((a) => a.join(""));
const rowCls = (p, r) => p.locator(".hd-row").nth(r).locator(".hd-t").evaluateAll((ts) => ts.map((t) => (t.className.match(/\bs([012])\b/) || [])[1] ?? "-").join(""));
const keyCls = (p, k) => p.locator(`.hd-k[data-k="${k}"]`).evaluate((e) => (e.className.match(/\bs([012])\b/) || [])[1] ?? "-");
const BASE_LS = { "mock-haslo-nr": "12", "mock-haslo-seria": "2", "mock-haslo-stat": "1" };

// ---------- A. pełna gra na telefonie (PL, płatne): plansza, klawiatury, kolory, podpowiedź, brak sieci, odświeżenie, zmiana dnia, koniec ----------
{
  const p = await page(b, { ls: BASE_LS });
  await open(p);
  const rows = await p.locator(".hd-row").count(), cols = await p.locator(".hd-row").first().locator(".hd-t").count();
  ok("pusta plansza 6 × długość słowa (7)", rows === 6 && cols === 7 && (await p.locator(".hd-t").allTextContents()).join("") === "", { rows, cols });
  ok("nagłówek: #12, przedmiot, „7 liter · próba 1 z 6”", (await p.locator(".hd-title h1").textContent()) === "Hasło dnia #12" && (await p.locator(".hd-subj").textContent()) === "Makroekonomia" && (await p.locator(".hd-meta .muted").textContent()) === "7 liter · próba 1 z 6");
  ok("plansza: role=grid, translate=no", (await p.locator(".hd-board").getAttribute("role")) === "grid" && (await p.locator(".hd-board").getAttribute("translate")) === "no" && (await p.locator('.hd-t[role="gridcell"]').count()) === 42);
  // klawiatura ekranowa
  for (const k of "QQQ") await p.locator(`.hd-k[data-k="${k}"]`).click();
  ok("klawiatura ekranowa wpisuje litery", (await curRow(p)) === "QQQ", await curRow(p));
  await p.locator('.hd-k[data-k="BACK"]').click();
  ok("ekranowy ⌫ kasuje literę", (await curRow(p)) === "QQ");
  // Enter przy niepełnym wierszu (fizyczny)
  await p.keyboard.press("Enter"); await p.waitForTimeout(40);
  ok("Enter przy niepełnym wierszu: drgnięcie + „Wpisz 7 liter”", (await p.locator(".hd-row.cur.shake").count()) === 1 && (await p.locator("#hd-msg").textContent()) === "Wpisz 7 liter");
  ok("niepełny wiersz nie idzie do bazy", !(await calls(p, "nauka_haslo_proba")).length);
  await p.waitForTimeout(350);
  ok("drgnięcie trwa 300 ms", !(await p.locator(".hd-row.shake").count()));
  // klawiatura fizyczna (z limitem długości), Backspace
  await typ(p, "QQQQQQ"); await p.keyboard.press("Backspace"); await typ(p, "Q");
  ok("klawiatura fizyczna: litery, Backspace, max 7", (await curRow(p)) === "QQQQQQQ", await curRow(p));
  await p.keyboard.press("Enter"); await p.waitForTimeout(60);
  ok("w trakcie sprawdzania klawiatura zablokowana", (await p.locator(".hd-kb.busy").count()) === 1 || (await HD(p)).reveal >= 0);
  await idle(p);
  const zapis = async (r) => (await calls(p, "nauka_haslo_proba"))[r]?.res?.wzor;
  ok("próba 1: kolory zgodne z wzor z bazy (0000000), klawisz Q szary", (await rowCls(p, 0)) === (await zapis(0)) && (await zapis(0)) === "0000000" && (await keyCls(p, "Q")) === "0");
  ok("animacja obrotu po kolei co 250 ms", await p.locator(".hd-t").nth(6).evaluate((t) => getComputedStyle(t).getPropertyValue("--d").trim()) === "1500ms");
  // powtórzone litery: REVENUE ma trzy E
  await guess(p, "EEEEEEE");
  ok("powtórzone litery (EEEEEEE → 0202002)", (await rowCls(p, 1)) === "0202002" && (await zapis(1)) === "0202002", [await rowCls(p, 1), await zapis(1)]);
  const live = await p.locator("#hd-live").textContent();
  ok("czytnik ekranu: aria-live czyta cały wiersz po próbie", (await p.locator("#hd-live").getAttribute("aria-live")) === "polite" && live.split("Litera ").length === 8 && live.startsWith("Litera E, nie ma w słowie. Litera E, dobre miejsce."), live);
  await guess(p, "EEXXXXX");
  ok("powtórzone litery (EEXXXXX → 1200000): E gdzie indziej i na miejscu", (await rowCls(p, 2)) === "1200000" && (await zapis(2)) === "1200000", await rowCls(p, 2));
  ok("klawisze: najlepszy stan (E = 2, X = 0, Q = 0)", (await keyCls(p, "E")) === "2" && (await keyCls(p, "X")) === "0" && (await keyCls(p, "R")) === "-");
  ok("etykiety kafelków (Litera E, jest gdzie indziej / dobre miejsce / nie ma w słowie)", (await p.locator(".hd-row").nth(2).locator(".hd-t").evaluateAll((ts) => ts.slice(0, 3).map((t) => t.getAttribute("aria-label")).join(" | "))) === "Litera E, jest gdzie indziej | Litera E, dobre miejsce | Litera X, nie ma w słowie");
  ok("po 3 próbach podpowiedź nad planszą (słowo zakryte)", (await p.locator(".hd-hint").count()) === 1 && /Podpowiedź: „_______ is the total income/.test(await p.locator(".hd-hint").textContent()) && (await p.locator(".hd-hint").evaluate((e) => e.compareDocumentPosition(document.querySelector(".hd-board")) & Node.DOCUMENT_POSITION_FOLLOWING)) > 0);
  ok("meta: „próba 4 z 6”", (await p.locator(".hd-meta .muted").textContent()) === "7 liter · próba 4 z 6");
  // powtórzona próba
  await guess(p, "EEEEEEE");
  ok("powtórzona próba → „To słowo już było”, nie zużywa próby", (await p.locator("#hd-msg").textContent()) === "To słowo już było" && (await HD(p)).d.proby.length === 3);
  // brak sieci przy wysyłaniu
  for (let i = 0; i < 7; i++) await p.keyboard.press("Backspace");
  await p.evaluate(() => { const rp = window.skrot.rp; window.__proba = rp.hasloProba; rp.hasloProba = async () => ({ ok: false, code: "offline" }); });
  await guess(p, "ABCDEFG");
  ok("brak sieci: komunikat, wiersz zostaje, próba się nie zużywa", (await p.locator("#hd-msg").textContent()) === "Nie udało się sprawdzić. Spróbuj jeszcze raz." && (await curRow(p)) === "ABCDEFG" && (await HD(p)).d.proby.length === 3);
  await p.evaluate(() => { window.skrot.rp.hasloProba = window.__proba; });
  // odświeżenie w trakcie wpisywania
  for (let i = 0; i < 7; i++) await p.keyboard.press("Backspace");
  await typ(p, "REV");
  ok("wpisywany wiersz w sessionStorage", JSON.parse(await p.evaluate(() => sessionStorage.getItem("bm-haslo-wpis"))).wpis === "REV");
  await p.reload(); await open(p, "haslo");
  ok("po odświeżeniu: próby z bazy, wpisywany wiersz z sessionStorage", (await rowCls(p, 0)) === "0000000" && (await rowCls(p, 2)) === "1200000" && (await curRow(p)) === "REV", [await rowCls(p, 2), await curRow(p)]);
  await shot(p, "e7-gra-390-pl");
  // zmiana dnia przy otwartym widoku
  await p.evaluate(() => { window.SKROT_HASLO._state().d.dzien = "2000-01-01"; });
  const n0 = (await calls(p, "nauka_haslo_proba")).length;
  await guess(p, "ENUE");
  ok("zmiana dnia: przed próbą rp.haslo(), nowa plansza i „Jest już nowe hasło”", (await p.locator("#hd-msg").textContent()) === "Jest już nowe hasło" && (await HD(p)).d.dzien === dzis() && (await curRow(p)) === "" && (await calls(p, "nauka_haslo_proba")).length === n0);
  // trafienie w 4. próbie
  await guess(p, "REVENUE"); await p.waitForTimeout(400);
  const end = p.locator(".hd-end");
  const txt = (await end.count()) ? await end.innerText() : "";
  ok("trafienie: ekran końca „✓ Hasło dnia #12 · 4/6” i +12 pkt", /✓ Hasło dnia #12 · 4\/6/.test(txt) && /\+12 pkt rankingu/.test(txt), txt);
  ok("koniec: słowo, tłumaczenie, definicja", /REVENUE — przychód/.test(txt) && /Revenue is the total income a firm earns from sales\./.test(txt));
  ok("koniec: „Z materiału: PKB i inflacja →”", /Z materiału: PKB i inflacja →/.test(txt));
  ok("koniec: seria 3 dni, statystyki roku (7 pasków, mój pogrubiony), licznik do północy", /Seria: 3 dni/.test(txt) && (await p.locator(".hd-dist li").count()) === 7 && (await p.locator('.hd-dist li.me[aria-current="true"]').count()) === 1 && /12 osób, 75% zgadło/.test(txt) && /Następne hasło za \d+ h \d+ min/.test(txt), txt);
  ok("koniec: klawiatura znika, puste wiersze schowane", !(await p.locator(".hd-kb").count()) && (await p.locator(".hd-row").count()) === 4);
  // udostępnianie (komputer → schowek)
  await p.evaluate(() => { navigator.clipboard.writeText = async (t) => { window.__clip = t; }; });
  await p.getByRole("button", { name: "Udostępnij wynik" }).click(); await p.waitForTimeout(200);
  const clip = await p.evaluate(() => window.__clip || "");
  const wz = (await HD(p)).d.wzory, emo = wz.map((w) => [...w].map((c) => ["⬜", "🟨", "🟩"][c]).join(""));
  ok("udostępnij (komputer): schowek + toast, tekst bez słowa, emoji jak plansza", clip === ["Hasło dnia Skrót BM #12 · 4/6 🔥3", ...emo, "skrotbm.pl"].join("\n") && !/REVENUE/i.test(clip) && (await p.locator(".toast").textContent()) === "Skopiowano – wklej na grupę roku", clip);
  // Powtórki
  await p.getByRole("button", { name: "Dodaj do Powtórek" }).click(); await p.waitForTimeout(200);
  ok("„Dodaj do Powtórek”: toast, przycisk znika", (await p.locator(".toast").textContent()) === "Dodano do Powtórek." && !(await p.getByRole("button", { name: "Dodaj do Powtórek" }).count()));
  await p.evaluate(() => scrollTo(0, 0)); await shot(p, "e7-koniec-390-pl");
  await p.locator(".hd-end").scrollIntoViewIfNeeded(); await shot(p, "e7-koniec-karta-390-pl");
  // wejścia po rozwiązaniu
  await open(p, "home"); await p.waitForTimeout(400);
  ok("Dziś po rozwiązaniu: mała linia „✓ Hasło dnia 4/6 · 🔥 3”", (await p.locator(".hd-home").count()) === 0 && /✓ Hasło dnia 4\/6 · 🔥 3/.test(await p.locator(".hd-home-done").textContent()));
  await open(p, "gry"); await p.waitForTimeout(400);
  ok("Graj po rozwiązaniu: kafelek z chipem „4/6”", (await p.locator("#gra-haslo .chip").textContent()) === "4/6");
  await open(p, "more"); await p.waitForTimeout(300);
  ok("Więcej → Nauka: wiersz „Hasło dnia” z wynikiem", /Hasło dnia\s*4\/6 · 🔥 3/.test(await p.locator(".more-row", { hasText: "Hasło dnia" }).innerText()));
  await p.locator(".more-row", { hasText: "Hasło dnia" }).click(); await p.waitForTimeout(400);
  await p.getByRole("button", { name: /PKB i inflacja/ }).click(); await p.waitForTimeout(400);
  ok("„Z materiału” otwiera materiał", (await p.evaluate(() => location.hash)) === "#/material/m1");
  ok("zero błędów (pełna gra)", !p.errors.length, p.errors);
  await p.context().close();
}

// ---------- B. wejścia przed rozwiązaniem: karta na Dziś (leniwie po 2 s, raz na sesję), kafelek na Graj, wiersz w Więcej ----------
{
  const p = await page(b, { ls: BASE_LS });
  await p.goto(BASE + "index.html"); await p.waitForTimeout(1200);
  ok("Dziś: rp.haslo() nie od razu (leniwie)", !(await calls(p, "nauka_haslo_dzis")).length);
  await p.waitForTimeout(1600);
  const card = p.locator(".hd-home");
  ok("Dziś: karta sk-row-big „Hasło dnia #12 – 7 liter, Makroekonomia” z chipem „nowe”", (await card.count()) === 1 && /Hasło dnia #12/.test(await card.textContent()) && /7 liter · Makroekonomia/.test(await card.textContent()) && (await card.locator(".chip").textContent()) === "nowe" && (await card.getAttribute("class")).includes("sk-row-big"));
  ok("Dziś: karta nad przewodnikiem/grami (góra listy)", await card.evaluate((e) => { const n = document.querySelector(".g-strip, .gry-home"); return !n || !!(e.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING); }));
  await shot(p, "e7-dzis-390-pl");
  await card.click(); await p.waitForTimeout(400);
  ok("karta → #/haslo", (await p.evaluate(() => location.hash)) === "#/haslo");
  await p.locator(".back").click(); await p.waitForTimeout(1200);
  ok("„← Graj” wraca do Graj; kafelek „Hasło dnia” z chipem „nowe”", (await p.evaluate(() => location.hash)) === "#/gry" && (await p.locator("#gra-haslo .chip").textContent()) === "nowe");
  await p.locator("#gra-haslo .gry-tile-art").scrollIntoViewIfNeeded(); await shot(p, "e7-graj-390-pl");
  await open(p, "more"); await p.waitForTimeout(300);
  ok("Więcej → Nauka: wiersz „Hasło dnia #12 · 7 liter”", /#12 · 7 liter/.test(await p.locator(".more-row", { hasText: "Hasło dnia" }).innerText()));
  ok("rp.haslo() raz na sesję (Dziś → Graj → Więcej)", (await calls(p, "nauka_haslo_dzis")).length === 1, (await calls(p, "nauka_haslo_dzis")).length);
  ok("zero błędów (wejścia)", !p.errors.length, p.errors);
  await p.context().close();
}

// ---------- C. 6 nieudanych prób ----------
{
  const p = await page(b, { ls: { ...BASE_LS, "mock-haslo-stat": "0", "mock-haslo-seria": "0", "mock-haslo-stan": stan(["AAAAAAA", "BBBBBBB", "CCCCCCC", "DDDDDDD", "FFFFFFF"]) } });
  await open(p);
  await guess(p, "GGGGGGG"); await p.waitForTimeout(400);
  const txt = await p.locator(".hd-end").innerText();
  ok("6 nieudanych: „✗ … X/6”, „Tym razem się nie udało. Hasło: REVENUE”", /✗ Hasło dnia #12 · X\/6/.test(txt) && /Tym razem się nie udało\. Hasło: REVENUE/.test(txt), txt);
  ok("6 nieudanych: definicja, materiał, „Dodaj do Powtórek”, bez serii i punktów", /Revenue is the total income/.test(txt) && /Z materiału: PKB i inflacja/.test(txt) && (await p.getByRole("button", { name: "Dodaj do Powtórek" }).count()) === 1 && !/Seria/.test(txt) && !/pkt rankingu/.test(txt));
  ok("stat: null → „Statystyki roku pojawią się, gdy zagra co najmniej 5 osób”", /Statystyki roku pojawią się, gdy zagra co najmniej 5 osób/.test(txt));
  ok("udostępnianie nieodgadniętego: „X/6”, bez serii", (await p.evaluate(() => window.SKROT_HASLO._share())).split("\n")[0] === "Hasło dnia Skrót BM #12 · X/6");
  ok("zero błędów (przegrana)", !p.errors.length, p.errors);
  await p.context().close();
}

// ---------- D. konto bez dostępu: gra działa, 0 pkt, linia z zachętą ----------
{
  const p = await page(b, { konto: "darmowe", ls: BASE_LS });
  await open(p, "gry"); await p.waitForTimeout(600);
  ok("bez dostępu: kafelek Hasło dnia na Graj (nad paywallem)", (await p.locator("#gra-haslo").count()) === 1);
  await p.locator("#gra-haslo button.primary").click(); await p.waitForTimeout(500);
  await guess(p, "QQQQQQQ"); await guess(p, "REVENUE"); await p.waitForTimeout(400);
  const txt = await p.locator(".hd-end").innerText();
  ok("bez dostępu: wynik 2/6, 0 pkt, „Z pełnym dostępem to byłoby +20 pkt rankingu” + „Kup dostęp”", /2\/6/.test(txt) && (await calls(p, "nauka_haslo_proba")).at(-1).res.pkt === 0 && /Z pełnym dostępem to byłoby \+20 pkt rankingu/.test(txt) && (await p.locator(".hd-paywall .btn", { hasText: "Kup dostęp" }).count()) === 1 && !(await p.locator(".hd-end-top .chip").count()));
  await p.evaluate(() => scrollTo(0, 0)); await p.locator(".hd-end").scrollIntoViewIfNeeded(); await shot(p, "e7-darmowe-390-pl");
  ok("zero błędów (bez dostępu)", !p.errors.length, p.errors);
  await p.context().close();
}

// ---------- E. udostępnianie na telefonie: navigator.share ----------
{
  const p = await page(b, { ls: { ...BASE_LS, "mock-haslo-stan": stan(["QQQQQQQ", "REVENUE"]) }, ctx: { hasTouch: true, isMobile: true } });
  await p.context().addInitScript(() => { navigator.share = async (o) => { window.__shared = o; }; navigator.clipboard.writeText = async (t) => { window.__clip = t; }; });
  await open(p); await p.waitForTimeout(200);
  await p.getByRole("button", { name: "Udostępnij wynik" }).click(); await p.waitForTimeout(200);
  const sh = await p.evaluate(() => [window.__shared?.text, window.__clip]);
  ok("udostępnij (telefon): navigator.share z tekstem, bez schowka", sh[0] === "Hasło dnia Skrót BM #12 · 2/6 🔥3\n⬜⬜⬜⬜⬜⬜⬜\n🟩🟩🟩🟩🟩🟩🟩\nskrotbm.pl" && !sh[1], sh);
  await p.context().close();
}

// ---------- F. pusta pula (no_words) i brak v15 (not_enabled) ----------
for (const [nazwa, ls, konto] of [["no_words", { "mock-haslo-slowo": "" }, "platne"], ["no_words starosta", { "mock-haslo-slowo": "", "bm-starosta": "1" }, "starosta"], ["brak v15", { "mock-v15": "0" }, "platne"]]) {
  const p = await page(b, { konto, ls });
  await p.goto(BASE + "index.html"); await p.waitForTimeout(3000);
  const note = "Hasło dnia czeka na pojęcia w materiałach";
  const star = konto === "starosta";
  ok(`${nazwa}: Dziś bez karty${star ? ", notka dla starosty" : ""}`, !(await p.locator(".hd-home, .hd-home-done").count()) && (await p.getByText(note).count()) === (star ? 1 : 0));
  await open(p, "gry"); await p.waitForTimeout(500);
  ok(`${nazwa}: Graj bez kafelka${star ? " (notka)" : ""}`, !(await p.locator("#gra-haslo").count()) && (await p.getByText(note).count()) === (star ? 1 : 0) && (await p.locator("#gra-frun").count()) === 1);
  await open(p, "more"); await p.waitForTimeout(300);
  ok(`${nazwa}: Więcej bez wiersza`, !(await p.locator(".more-row", { hasText: "Hasło dnia" }).count()));
  await open(p, "haslo");
  ok(`${nazwa}: #/haslo pokazuje notkę zamiast planszy`, !(await p.locator(".hd-board").count()) && (await p.locator(".hd-view .notice").textContent()) === (nazwa === "brak v15" ? "Gry i ranking nie są jeszcze włączone na serwerze." : note));
  ok(`${nazwa}: zero błędów`, !p.errors.length, p.errors);
  await p.context().close();
}

// ---------- G. daltonizm (obwódki), „Mniej animacji”, motyw różowy ----------
{
  const p = await page(b, { ls: { ...BASE_LS, "mock-haslo-stan": stan(["QQQQQQQ", "EEEEEEE", "EEXXXXX"]) } });
  await open(p);
  const st = await p.evaluate(() => Object.fromEntries(["s0", "s1", "s2"].map((c) => { const t = getComputedStyle(document.querySelector(".hd-t." + c)); return [c, [t.borderTopStyle, parseFloat(t.borderTopWidth)]]; })));
  ok("daltonizm: stan 1 przerywana obwódka, stan 2 ciągła gruba (≥ 3 px), stan 0 bez", st.s1[0] === "dashed" && st.s2[0] === "solid" && st.s2[1] >= 3 && st.s0[0] === "solid" && st.s1[1] < st.s2[1], st);
  await p.addStyleTag({ content: "html { filter: grayscale(1); }" }); await p.waitForTimeout(100);
  await p.locator(".hd-board").screenshot({ path: `${process.env.OUT || "/tmp/gry-shots"}/e7-szarosc.png` });
  await p.context().close();
}
{
  const p = await page(b, { ls: { ...BASE_LS, "skrot-calm": "1" } });
  await open(p);
  await p.keyboard.press("Q"); await p.keyboard.press("Enter"); await p.waitForTimeout(40);
  ok("Mniej animacji: bez drgnięcia, komunikat jest", !(await p.locator(".hd-row.shake").count()) && (await p.locator("#hd-msg").textContent()) === "Wpisz 7 liter");
  await typ(p, "WWWWWW"); await p.keyboard.press("Enter"); await p.waitForTimeout(150);
  ok("Mniej animacji: kafelki od razu, bez obrotu", !(await p.locator(".hd-t.flip").count()) && (await rowCls(p, 0)) === "0000000");
  await guess(p, "REVENUE"); await p.waitForTimeout(300);
  ok("Mniej animacji: bez konfetti", !(await p.locator(".lp-confetti, .confetti, canvas.confetti").count()));
  ok("zero błędów (Mniej animacji)", !p.errors.length, p.errors);
  await p.context().close();
}
{
  const p = await page(b, { ls: { ...BASE_LS, "skrot-theme": "pink", "mock-haslo-stan": stan(["QQQQQQQ", "EEEEEEE", "EEXXXXX"]) } });
  await open(p);
  const c = await p.evaluate(() => [getComputedStyle(document.querySelector(".hd-t.s2")).backgroundColor, getComputedStyle(document.documentElement).getPropertyValue("--accent").trim()]);
  ok("motyw różowy: kolory z CSS (stan 2 = --accent)", c[0] === "rgb(224, 67, 143)" && c[1] === "#E0438F", c);
  await shot(p, "e7-gra-390-roz");
  await p.context().close();
}

// ---------- H. 9 liter na 360 px, klawisze ≥ 32 × 48 ----------
for (const [w, hgt, slowo] of [[360, 740, "Inflation"], [390, 844, "Revenue"]]) {
  const p = await page(b, { w, h: hgt, ls: { "mock-haslo-slowo": slowo } });
  await open(p);
  const m = await p.evaluate(() => {
    const ts = [...document.querySelectorAll(".hd-t")].map((t) => t.getBoundingClientRect()), ks = [...document.querySelectorAll(".hd-k")].map((k) => k.getBoundingClientRect());
    return { n: document.querySelectorAll(".hd-row")[0].children.length, left: Math.min(...ts.map((r) => r.left)), right: Math.max(...ts.map((r) => r.right)), sw: document.documentElement.scrollWidth,
      kw: Math.min(...ks.map((r) => r.width)), kh: Math.min(...ks.map((r) => r.height)), kr: Math.max(...ks.map((r) => r.right)), kl: Math.min(...ks.map((r) => r.left)) };
  });
  ok(`${w} px: ${slowo.length} liter mieści się bez przewijania`, m.n === slowo.length && m.left >= 16 && m.right <= w - 16 && m.sw <= w, m);
  ok(`${w} px: klawisze ≥ 32 × 48 px, w ekranie`, m.kw >= 32 && m.kh >= 48 && m.kl >= 0 && m.kr <= w, m);
  if (w === 360) await shot(p, "e7-9liter-360");
  await p.context().close();
}

// ---------- I. zrzuty: w trakcie i po końcu, 390 i 1280, PL i EN ----------
for (const lang of ["pl", "en"]) for (const [w, hgt] of [[390, 844], [1280, 800]]) {
  {
    const p = await page(b, { w, h: hgt, lang, ls: { ...BASE_LS, "mock-haslo-stan": stan(["QQQQQQQ", "EEEEEEE", "EEXXXXX"]) } });
    await open(p); await typ(p, "REV"); await p.waitForTimeout(200);
    if (lang === "en") {
      ok(`EN ${w}: tytuł, meta, podpowiedź, etykiety`, (await p.locator(".hd-title h1").textContent()) === "Word of the day #12" && (await p.locator(".hd-meta .muted").textContent()) === "7 letters · try 4 of 6" && /^Hint:/.test(await p.locator(".hd-hint").textContent())
        && (await p.locator(".hd-row").nth(2).locator(".hd-t").first().getAttribute("aria-label")) === "Letter E, wrong spot" && (await p.locator('.hd-k[data-k="ENTER"]').getAttribute("aria-label")) === "Check the word", [await p.locator(".hd-title h1").textContent(), await p.locator(".hd-meta .muted").textContent()]);
      await p.keyboard.press("Backspace"); await p.keyboard.press("Enter"); await p.waitForTimeout(40);
      ok(`EN ${w}: „Type 7 letters”`, (await p.locator("#hd-msg").textContent()) === "Type 7 letters");
      await typ(p, "V");
    }
    await shot(p, `e7-gra-${w}-${lang}`);
    ok(`${lang} ${w}: zero błędów (w trakcie)`, !p.errors.length, p.errors);
    await p.context().close();
  }
  {
    const p = await page(b, { w, h: hgt, lang, ls: { ...BASE_LS, "mock-haslo-stan": stan(["QQQQQQQ", "EEEEEEE", "EEXXXXX", "REVENUE"]) } });
    await open(p); await p.waitForTimeout(200);
    if (lang === "en") {
      const t = await p.locator(".hd-end").innerText();
      ok(`EN ${w}: ekran końca po angielsku`, /Word of the day #12 · 4\/6/.test(t) && /\+12 ranking pts/.test(t) && /From: PKB/.test(t) && /Share result/.test(t) && /Add to Reviews/.test(t) && /Streak: 3 days/.test(t) && /How your year did/.test(t) && /Next word in/.test(t) && /12 people, 75% got it/.test(t), t);
      ok(`EN ${w}: udostępnianie „Skrót BM Word of the day #12”`, (await p.evaluate(() => window.SKROT_HASLO._share())).startsWith("Skrót BM Word of the day #12 · 4/6 🔥3"));
    }
    await shot(p, `e7-koniec-${w}-${lang}`);
    await p.locator(".hd-end").scrollIntoViewIfNeeded(); await shot(p, `e7-koniec-karta-${w}-${lang}`);
    ok(`${lang} ${w}: zero błędów (koniec)`, !p.errors.length, p.errors);
    await p.context().close();
  }
}
await b.close();
for (const w of wyniki) console.log(w.join(" "));
console.log(wyniki.filter((w) => w[0] === "✓").length + "/" + wyniki.length);
process.exit(wyniki.some((w) => w[0] === "✗") ? 1 : 0);
