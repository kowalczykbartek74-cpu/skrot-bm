// Etap 8 (docs/gry/SPEC-2.md 7 „Etap 8”): Drabina – kolejność trudności, szczeble i progi, koniec czasu, koła ratunkowe,
// klawisze, rp.odp / rp.koniec, układ 390 / 1280, EN, rekordy tygodnia, rozmiar gry.js. Pary: osobno etap3.mjs.
import { chromium, page, BASE, shot } from "./lib.mjs";
import fs from "fs";
import { execSync } from "child_process";
const b = await chromium.launch();
const wyniki = [];
const ok = (nazwa, warunek, info) => { wyniki.push([warunek ? "✓" : "✗", nazwa, warunek ? "" : JSON.stringify(info)?.slice(0, 400)]); };
const dbg = (p) => p.evaluate(() => window.SKROT_GRY._dbg());
const st = (p) => p.evaluate(() => window.SKROT_GRY._state().state);
const calls = (p, fn) => p.evaluate((fn) => window.__rpc.filter((x) => x.fn === fn).map((x) => ({ ...x.args, res: x.res })), fn);
const LS = { "bm-gry-sid": "makroekonomia", "mock-trud": "liniowo" };
async function start(p) {
  await p.goto(BASE + "index.html#/gry"); await p.waitForTimeout(2200);
  await p.locator("#gra-drabina button.primary").click();
  for (let i = 0; i < 50 && !(await p.locator(".dr-opt").count()); i++) await p.waitForTimeout(100);
  await p.waitForTimeout(100);
}
const keyOk = (d) => String(d.order.indexOf(d.q.correct) + 1);
const keyBad = (d) => String(d.order.findIndex((o) => o !== d.q.correct && !d.hidden.includes(o)) + 1);
// dobra odpowiedź klawiszem i „Wyżej →” (Enter na przycisku z fokusem)
async function up(p) {
  const d = await dbg(p); await p.keyboard.press(keyOk(d)); await p.waitForTimeout(60);
  if (await p.locator(".dr-up").count()) { await p.keyboard.press("Enter"); await p.waitForTimeout(60); }
}
async function toResult(p) {
  const cta = p.locator(".dr-after .btn.primary:not(.dr-up)"); if (await cta.count()) await cta.click();
  for (let i = 0; i < 30 && (await st(p)) !== "wynik"; i++) await p.waitForTimeout(100);
  await p.waitForTimeout(250);
}
const koniec = async (p) => (await calls(p, "nauka_gra_koniec")).map((x) => x.p_wynik);

for (const [w, hgt] of [[390, 844], [1280, 800]]) {
  // 1) kolejność, progi, Zapytaj rok, 50:50, Notatka, zła na 6 → 4
  {
    const p = await page(b, { w, h: hgt, ls: LS });
    await start(p);
    let d = await dbg(p);
    ok(`${w}: 12 pytań od łatwych (proc 95 → 20)`, d.rok.length === 12 && d.rok[0] === 95 && d.rok[11] === 20 && d.rok.every((x, i) => i === 0 || x <= d.rok[i - 1]), d.rok);
    const tr = await calls(p, "nauka_pyt_trudnosc");
    ok(`${w}: rp.trudnosc raz, klucze mid:idx (≤ 80)`, tr.length === 1 && tr[0].p_klucze.length <= 80 && tr[0].p_klucze.every((k) => /^m\d:\d+$/.test(k)), tr.map((x) => x.p_klucze?.length));
    ok(`${w}: czas 30 s na szczeblach 1–8`, d.left > 28 && d.left <= 30, d.left);
    ok(`${w}: „Zatrzymaj się” ukryte na szczeblu 0`, await p.locator(".dr-stop").isHidden());
    // układ
    const lad = await p.locator(".dr-ladder").isVisible(), dots = await p.locator(".dr-dots").isVisible();
    ok(`${w}: układ: ${w >= 900 ? "drabina z boku" : "pasek 12 kropek"}`, w >= 900 ? lad && !dots : dots && !lad && (await p.locator(".dr-dot").count()) === 12, { lad, dots });
    ok(`${w}: „Szczebel 1 z 12”`, (await p.locator(".dr-step").textContent()) === "Szczebel 1 z 12");
    // pytania 1–4: Zapytaj rok (R) na pierwszym pytaniu z przetasowanymi opcjami, Notatka (N) na pierwszym z m1, brak notatki na m2
    const sawNote = { on: false, off: false };
    let rokDone = false;
    const askYear = async () => {
      await p.keyboard.press("r"); await p.waitForTimeout(250);
      const d = await dbg(p), rok = (await calls(p, "nauka_pyt_rok")).pop();
      const pct = await p.locator(".dr-opt .dr-rok small").allTextContents();
      const sum = rok?.res?.rozklad?.reduce((a, x) => a + x, 0) || 1;
      const want = d.order.map((o) => Math.round((100 * rok.res.rozklad[o]) / sum) + "%");
      const shuffledOrder = d.order.some((o, k) => o !== k);
      ok(`${w}: Zapytaj rok (R): paski w kolejności z ekranu, opcje przetasowane`, shuffledOrder && rok && rok.p_mid === d.q.mid && rok.p_idx === d.q.idx && JSON.stringify(pct) === JSON.stringify(want) && d.used.r, { pct, want, order: d.order });
      ok(`${w}: Zapytaj rok: „{n} osób z roku”, koło przekreślone`, new RegExp(`^${rok.res.n} os(ób|oby|oba) z roku$`).test(await p.locator(".dr-rokmsg").textContent()) && (await p.locator(".dr-r.used").count()) === 1, await p.locator(".dr-rokmsg").textContent());
      rokDone = true;
    };
    for (let i = 0; i < 4; i++) {
      d = await dbg(p);
      let hideWait = false;
      if (d.q.mid === "m1" && d.note && !sawNote.on) {
        await p.keyboard.press("n"); await p.waitForTimeout(80);
        sawNote.on = (await p.locator(".dr-note").isVisible()) && /PKB mierzy wartość/.test(await p.locator(".dr-note").textContent()) && (await p.locator(".dr-n.used").count()) === 1;
        hideWait = w === 390;
      }
      if (!rokDone && d.order.some((o, k) => o !== k)) { await askYear(); await shot(p, `etap8/e8-gra-rok-${w}-pl`); }
      if (hideWait) { await p.waitForTimeout(15300); ok(`${w}: Notatka znika po 15 s`, await p.locator(".dr-note").isHidden()); }
      if (d.q.mid === "m2" && !sawNote.off) sawNote.off = await p.locator(".dr-n").isDisabled();
      await up(p);
    }
    ok(`${w}: Notatka (N) pokazuje pierwsze zdanie streszczenia`, sawNote.on);
    const ban = await p.locator(".lp-banner").allTextContents();
    ok(`${w}: szczebel 4 → banner „Szczebel 4 zabezpieczony”`, ban.some((t) => t === "Szczebel 4 zabezpieczony"), ban);
    d = await dbg(p);
    ok(`${w}: dobra odpowiedź – szczebel wyżej (4 → pytanie 5)`, d.step === 4 && d.i === 4, d);
    ok(`${w}: wynik na pasku = szczebel`, (await p.locator(".gry-num").textContent()) === "4");
    // 50:50 klawiszem F: ukrywa 2 złe
    if (d.q.n > 2) {
      await p.keyboard.press("f"); await p.waitForTimeout(50);
      d = await dbg(p);
      const vis = await p.locator(".dr-opt:not(.dr-gone)").count();
      ok(`${w}: 50:50 (F) ukrywa 2 złe`, d.hidden.length === 2 && !d.hidden.includes(d.q.correct) && vis === 2 && d.used.f, d);
      ok(`${w}: 50:50 przekreślone po użyciu`, (await p.locator(".dr-f.used").count()) === 1 && (await p.locator(".dr-f").isDisabled()));
    } else ok(`${w}: 50:50 (pytanie 5 ma 4 opcje)`, false, d.q);
    if (!rokDone) { await askYear(); await shot(p, `etap8/e8-gra-rok-${w}-pl`); }
    // dojdź do pytania 6 (szczebel 5) i odpowiedz źle → wynik 4
    for (let i = 0; i < 8 && (await dbg(p)).step < 5; i++) await up(p);
    d = await dbg(p);
    ok(`${w}: przed pytaniem 6: „Zatrzymaj się (zabierasz 5)” i „spadasz na 4”`, d.step === 5 && (await p.locator(".dr-stop").textContent()) === "Zatrzymaj się (zabierasz 5)" && (await p.locator(".dr-drop").textContent()) === "Zła odpowiedź = spadasz na 4");
    if (!sawNote.off && d.q.mid === "m2") sawNote.off = await p.locator(".dr-n").isDisabled();
    ok(`${w}: brak notatki (m2) – koło wyszarzone`, sawNote.off);
    const bad = keyBad(d), badOrig = d.order[+bad - 1];
    await p.keyboard.press(bad); await p.waitForTimeout(150);
    ok(`${w}: zła: wybrana czerwona, dobra zielona, „Zobacz wynik”`, (await p.locator(".dr-opt.wrong").count()) === 1 && (await p.locator(".dr-opt.right").count()) === 1 && (await p.getByRole("button", { name: "Zobacz wynik" }).count()) === 1);
    await toResult(p);
    ok(`${w}: zła na 6 → wynik 4 (rp.koniec)`, JSON.stringify(await koniec(p)) === "[4]", await koniec(p));
    const odp = await calls(p, "nauka_rp_odpowiedz");
    ok(`${w}: rp.odp: zrodlo „gra”, run, indeks oryginalny (6 odpowiedzi)`, odp.length === 6 && odp.every((x) => x.p_zrodlo === "gra" && x.p_run && typeof x.p_wybor === "number") && odp[5].p_wybor === badOrig && odp.slice(0, 5).every((x) => x.res?.poprawna === true), odp.map((x) => [x.p_wybor, x.res?.poprawna]));
    const res = await p.locator(".gry-res").innerText();
    ok(`${w}: ekran wyniku: „szczebli · rekord 4”, 5/6 dobrze, XP +25`, /szczebli · rekord 4/.test(res) && /5\/6/.test(res) && /\+25 ⚡/.test(res), res);
    ok(`${w}: rekord lokalny Drabiny`, (await p.evaluate(() => localStorage.getItem("bm-gry-rekord:drabina"))) === "4");
    await shot(p, `etap8/e8-wynik-${w}-pl`);
    ok(`${w}: zero błędów`, !p.errors.length, p.errors);
    await p.context().close();
  }
}
// 2) zła na 3 → 0; „Jeszcze raz” → nowa runda; Zatrzymaj się (S) na 9 → 9 (czas 45 s od szczebla 9)
{
  const p = await page(b, { ls: LS });
  await start(p);
  await up(p); await up(p);
  let d = await dbg(p);
  await p.keyboard.press(keyBad(d)); await p.waitForTimeout(100); await toResult(p);
  ok("zła na 3 → wynik 0", JSON.stringify(await koniec(p)) === "[0]", await koniec(p));
  await p.getByRole("button", { name: "Jeszcze raz" }).click();
  for (let i = 0; i < 40 && !(await p.locator(".dr-opt").count()); i++) await p.waitForTimeout(100);
  for (let i = 0; i < 9; i++) await up(p);
  d = await dbg(p);
  ok("szczebel 8 – banner, potem pytanie 10 ma 45 s", d.step === 9 && d.left > 43 && d.left <= 45, d);
  ok("„Zatrzymaj się (zabierasz 9)” · „spadasz na 8”", (await p.locator(".dr-stop").textContent()) === "Zatrzymaj się (zabierasz 9)" && (await p.locator(".dr-drop").textContent()) === "Zła odpowiedź = spadasz na 8");
  await p.keyboard.press("s"); await p.waitForTimeout(100); await toResult(p);
  ok("Zatrzymaj się (S) na 9 → wynik 9", JSON.stringify(await koniec(p)) === "[0,9]", await koniec(p));
  ok("zero błędów (2)", !p.errors.length, p.errors);
  await p.context().close();
}
// 3) koniec czasu = zła odpowiedź; klawisze A–D; cała Drabina → 12
{
  const p = await page(b, { ls: LS });
  await start(p);
  for (let i = 0; i < 5; i++) await up(p);
  await p.evaluate(() => window.SKROT_GRY._set({ left: 0.3 })); await p.waitForTimeout(600);
  const v = await p.locator(".gry-verdict").textContent();
  ok("koniec czasu = zła odpowiedź („Czas minął.”), wynik 4", /^Czas minął\. To nie to\. Poprawna: [ABCD]\.$/.test(v) && (await dbg(p)).final === 4, v);
  await toResult(p);
  ok("koniec czasu: rp.koniec 4, bez rp.odp za to pytanie", JSON.stringify(await koniec(p)) === "[4]" && (await calls(p, "nauka_rp_odpowiedz")).length === 5);
  await p.getByRole("button", { name: "Jeszcze raz" }).click();
  for (let i = 0; i < 40; i++) { const x = await dbg(p); if (x && x.step === 0 && x.st === "pytanie") break; await p.waitForTimeout(100); }
  await p.waitForTimeout(200);
  // pierwsza odpowiedź literą (A–D)
  let d = await dbg(p); await p.keyboard.press("ABCD"[d.order.indexOf(d.q.correct)].toLowerCase()); await p.waitForTimeout(60);
  ok("klawisze A–D odpowiadają", (await dbg(p)).step === 1);
  await p.keyboard.press("Enter"); await p.waitForTimeout(60);
  for (let i = 0; i < 11; i++) await up(p);
  d = await dbg(p);
  const ban = await p.locator(".lp-banner").allTextContents();
  ok("szczebel 12: „Cała Drabina! 🏆”", d.step === 12 && d.final === 12 && ban.includes("Cała Drabina! 🏆"), { d, ban });
  await toResult(p);
  ok("cała Drabina → wynik 12, nowy rekord", JSON.stringify(await koniec(p)) === "[4,12]" && /Nowy rekord/.test(await p.locator(".gry-res").innerText()));
  ok("zero błędów (3)", !p.errors.length, p.errors);
  await p.context().close();
}
// 4) Zapytaj rok przy za_malo – koło się nie zużywa; pytanie prawda/fałsz – 50:50 wyłączone; offline (bez v13) – Zapytaj rok wyłączone
{
  const p = await page(b, { ls: { ...LS, "mock-rok": "malo", "mock-pf": "1" } });
  await start(p);
  await p.keyboard.press("r"); await p.waitForTimeout(250);
  const d = await dbg(p);
  ok("za_malo: komunikat, koło się nie zużywa", (await p.locator(".dr-rokmsg").textContent()) === "Rok jeszcze za mało odpowiadał na to pytanie" && !d.used.r && !(await p.locator(".dr-r").isDisabled()), d.used);
  let tf = null;
  for (let i = 0; i < 12 && !tf; i++) { const x = await dbg(p); if (x.q.n === 2) { tf = x; break; } await up(p); }
  ok("pytanie z 2 opcjami: 50:50 wyłączone", tf && (await p.locator(".dr-f").isDisabled()) && !(await p.locator(".dr-f.used").count()), tf?.q);
  await p.context().close();
  const q = await page(b, { ls: LS, v13: "0" });
  await start(q);
  ok("offline (bez bazy): gra działa, Zapytaj rok wyłączone", (await q.locator(".dr-opt").count()) >= 2 && (await q.locator(".dr-r").isDisabled()));
  ok("zero błędów (offline)", !q.errors.length, q.errors);
  await q.context().close();
}
// 5) ekran Graj: kafelek, rekordy tygodnia; motyw różowy + Mniej animacji
{
  const p = await page(b, { w: 1280, h: 800, ls: { ...LS, "skrot-theme": "pink" } });
  await p.goto(BASE + "index.html#/gry"); await p.waitForTimeout(2500);
  const tile = await p.locator("#gra-drabina").innerText();
  ok("kafelek Drabina (🪜, opis, ok. 4–6 min)", /Drabina/.test(tile) && /12 pytań coraz trudniejszych/.test(tile) && /ok\. 4–6 min/.test(tile), tile);
  const rek = await calls(p, "nauka_rekordy");
  ok("rekordy tygodnia: rp.rekordy(„drabina”)", rek.some((x) => x.p_gra === "drabina") && /Rekordy tygodnia \(Drabina\)/.test(await p.locator(".gry-rek").innerText()), rek.map((x) => x.p_gra));
  await shot(p, "etap8/e8-graj-1280");
  await p.evaluate(() => document.documentElement.classList.add("calm"));
  await p.locator("#gra-drabina button.primary").click();
  for (let i = 0; i < 40 && !(await p.locator(".dr-opt").count()); i++) await p.waitForTimeout(100);
  const anim = await p.evaluate(() => getComputedStyle(document.querySelector(".dr-rung.cur") || document.body).backgroundColor);
  ok("motyw różowy: bieżący szczebel w kolorze --accent", anim === (await p.evaluate(() => { const e = document.createElement("i"); e.style.color = "var(--accent)"; document.body.append(e); const c = getComputedStyle(e).color; e.remove(); return c; })), anim);
  await shot(p, "etap8/e8-pink-1280");
  ok("zero błędów (Graj)", !p.errors.length, p.errors);
  await p.context().close();
}
// 6) EN: 390 i 1280 – w trakcie (z Zapytaj rok) i wynik
for (const [w, hgt] of [[390, 844], [1280, 800]]) {
  const p = await page(b, { w, h: hgt, lang: "en", ls: LS });
  await start(p);
  await up(p); await up(p);
  await p.keyboard.press("r"); await p.waitForTimeout(300);
  await p.waitForTimeout(200);
  const txt = await p.locator(".dr-main").innerText() + "\n" + (w >= 900 ? await p.locator(".dr-ladder").innerText() : "");
  await shot(p, `etap8/e8-gra-rok-${w}-en`);
  const PL = /Szczebel|Zatrzymaj|Zapytaj|Notatka|spadasz|osób|osoby|Koła|Drabina|Wyżej/;
  ok(`EN ${w}: w trakcie po angielsku`, !PL.test(txt) && /Step 3 of 12/.test(txt) && /Ask your year/.test(txt) && /people from your year/.test(txt) && /Stop here \(keep 2\)/.test(txt) && /Wrong answer = you drop to 0/.test(txt), txt);
  await up(p);
  const up2 = await p.locator(".dr-up").count();
  const d = await dbg(p); await p.keyboard.press(keyBad(d)); await p.waitForTimeout(150);
  const after = await p.locator(".dr-main").innerText();
  ok(`EN ${w}: po odpowiedzi „% of your year gets this right”`, /% of your year gets this right/.test(after) && up2 === 0, after);
  await toResult(p);
  const res = await p.locator(".gry-res").innerText();
  ok(`EN ${w}: ekran wyniku po angielsku („steps”)`, /steps · record/.test(res) && !/szczebli|rekord|Jeszcze|dobrze|Wróć|Do powtórki|Powtórz/.test(res), res);
  await shot(p, `etap8/e8-wynik-${w}-en`);
  ok(`EN ${w}: zero błędów`, !p.errors.length, p.errors);
  await p.context().close();
}
// 7) gry.js nie urósł poza uogólnienie gier DOM (Drabina w gry-drabina.js)
{
  const root = new URL("../../../", import.meta.url).pathname;
  const now = fs.statSync(root + "gry.js").size;
  let before = null; try { before = execSync("git show gry-etap-7:gry.js", { cwd: root }).length; } catch {}
  const src = fs.readFileSync(root + "gry.js", "utf8");
  ok("gry.js: bez kodu Drabiny (tylko LAZY/UNITS/TITLES/cfg), przyrost < 2,5 kB", !/Zapytaj rok|askYear|fifty/.test(src) && /drabina: "gry-drabina\.js"/.test(src) && (before == null || now - before < 2500), { now, before });
}
await b.close();
for (const w of wyniki) console.log(w.join(" "));
console.log(wyniki.filter((w) => w[0] === "✓").length + "/" + wyniki.length);
process.exit(wyniki.some((w) => w[0] === "✗") ? 1 : 0);
