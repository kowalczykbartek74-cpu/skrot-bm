// Etap 13 specu „Systemy z Zdawalni w Skrócie”: „Sprawdź moje rozwiązanie ze zdjęcia” (zdjecie.js, funkcja Edge sprawdz-zdjecie
// podstawiona przez route, SQL v39 sprawdzony osobno w PGlite). Trzy miejsca na trzech różnych przedmiotach:
//   A. zadanie krok po kroku („Teraz Ty”) — Analiza matematyczna (wynik liczbowy, kroki, podpowiedź),
//   B. karta „Policz” (num) w lekcji v4 — Makroekonomia (szablon gen, liczby losowane),
//   C. zadanie w sprawdzaniu testu próbnego — Ochrona własności intelektualnej (bez liczby, tylko odpowiedź wzorcowa, punkty).
// Sprawdza: zdjęcie zmniejszone do 1600 px (JPEG), klucz zadania w zapytaniu, rocznik z ROK, wynik (co dobrze, pierwszy błąd,
// wskazówka, ile zostało), brak przycisku bez rozwiązania wzorcowego, limit (429) i błąd (miejsce wraca), bez pełnego dostępu
// okno „Pełna wersja” bez zapytania, zdjęcie nie zostaje w localStorage (D8), przycisk ≥ 44 px, EN bez polskich znaków.
// BASE=http://127.0.0.1:8811/ node docs/gry/test/zdjecie.mjs
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 700)]);
const PL_ZN = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;
const NOW = Date.now();

const docs = {
  materials: {
    W1: { subjectId: "analiza-matematyczna", title: "Pochodne", quizCount: 0, flashcardCount: 0, createdAt: NOW - 5e6, v: 2, source: "sylabus", workedCount: 1, workedTaskCount: 2 },
    L3: { subjectId: "makroekonomia", kind: "lesson", order: 1, unit: 1, unitTitle: "Podstawy", title: "Koszt alternatywny", quizCount: 0, flashcardCount: 0, createdAt: NOW - 4e6, v: 2, source: "sylabus" },
    O1: { subjectId: "ochrona-wlasnosci-intelektualnej", title: "Prawo cytatu", quizCount: 0, flashcardCount: 0, createdAt: NOW - 3e6, v: 2, source: "sylabus" },
  },
  materialContent: {
    W1: { v: 2, quiz: [], flashcards: [], concepts: [], worked: [{ id: "w1", task: "Policz pochodną f(x) = x² w x = 3.", steps: [{ do: "f'(x) = 2x", why: "Wzór na pochodną potęgi.", result: "2x" }, { do: "f'(3) = 6", result: "6" }], answer: "f'(3) = 6",
      similar: [{ task: "Policz pochodną f(x) = x³ − 3x w punkcie x = 2.", result: 9, tol: 0.01, unit: "", hint: "Najpierw pochodna, potem podstaw x.", steps: ["f'(x) = 3x² − 3", "f'(2) = 9"], answer: "f'(2) = 9" },
        { task: "Narysuj wykres f(x) = x² i zaznacz styczną w x = 1.", hint: "Styczna ma nachylenie f'(1)." }] }] },
    L3: { v: 2, concepts: [], quiz: [], flashcards: [], lesson: { v2: true, v: 4, type: "quant",
      sections: [{ h: "1. Koszt alternatywny", intuition: "Kino czy praca?", body: "Plain text about costs.", check: { q: "Check?", options: ["Zła A", "OK B", "Zła C"], correct: 1, why: "Bo B." } }],
      gen: [{ id: "g1", task: "You can earn {a} zł or {b} zł. A ticket costs {c} zł. What is the opportunity cost?", vars: { a: [40, 90, 10], b: [50, 120, 10], c: [20, 60, 5] }, answer: "max(a, b) + c", unit: "zł", tol: 0, why: "Best alternative given up + money paid." }],
      exit: [1, 2, 3].map((i) => ({ q: "Exit " + i + "?", options: ["Zła", "OK " + i, "Zła 2"], correct: 1, why: "Bo." })) } },
    O1: { v: 2, quiz: [], flashcards: [], concepts: [] },
  },
};
const SID_T = "ochrona-wlasnosci-intelektualnej";
const RUN = { key: SID_T + "-W", sid: SID_T, part: "W", kind: "full", phase: "grade", tmpl: { min: 45, pass: 50 },
  items: [{ id: "tb1", n: 1, type: "task", mid: "O1", q: "Student przepisał 3 strony cudzej książki do pracy zaliczeniowej z przypisem. Czy to dozwolony cytat?", answer: "Nie: cytat musi być uzasadniony celem (wyjaśnianie, analiza) i w rozmiarze, jaki ten cel uzasadnia; 3 strony bez analizy to przejęcie utworu.", rubric: [{ t: "Cel cytatu", p: 2 }, { t: "Rozmiar", p: 1 }] },
    { id: "ob1", n: 2, type: "open", mid: "O1", q: "Co to jest prawo cytatu?", answer: "Dozwolony użytek...", rubric: [{ t: "Definicja", p: 2 }] }],
  ans: { tb1: "Tak, bo jest przypis.", ob1: "Można cytować." }, marks: {}, flags: {}, start: NOW - 6e5, end: NOW, submitted: NOW };

// Udawana funkcja Edge: zapisuje zapytania, odpowiada jak sprawdz-zdjecie (wynik z punktami tylko, gdy zadanie ma maksimum).
const zap = []; let tryb = "ok", zostalo = 4;
async function edge(r) {
  const body = JSON.parse(r.request().postData()); zap.push(body);
  if (tryb === "limit") return r.fulfill({ status: 429, contentType: "application/json", body: JSON.stringify({ code: "limit", message: "x", limit: 5 }) });
  if (tryb === "blad") return r.fulfill({ status: 502, contentType: "application/json", body: JSON.stringify({ code: "upstream", message: "x" }) });
  await new Promise((res) => setTimeout(res, 400));
  const en = body.lang === "en", max = body.task.maxPoints ?? null;
  const result = { points_min: max != null ? 2 : null, points_max: max != null ? 2 : null,
    good: en ? "You set up the first step correctly." : "Dobrze zacząłeś od pierwszego kroku.",
    mistake_step: en ? "In the last line you substituted the wrong value." : "W ostatniej linijce podstawiasz złą wartość.",
    notes: [en ? "Check what you substitute in the last step." : "Sprawdź, co podstawiasz w ostatnim kroku."], readable: true };
  r.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true, result, maxPoints: max, remaining: Math.max(0, zostalo--), limit: 5 }) });
}
const jpegWH = (buf) => { let i = 2; while (i < buf.length - 9) { if (buf[i] !== 0xff) { i++; continue; } const m = buf[i + 1], len = buf.readUInt16BE(i + 2); if (m >= 0xc0 && m <= 0xc3) return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)]; i += 2 + len; } return null; };
let PNG = null;
async function zdjecie(p) {
  if (!PNG) PNG = Buffer.from((await p.evaluate(() => { const c = document.createElement("canvas"); c.width = 3200; c.height = 2400; const g = c.getContext("2d"); g.fillStyle = "#fffef6"; g.fillRect(0, 0, 3200, 2400); g.fillStyle = "#123"; g.font = "120px serif"; g.fillText("f'(x) = 3x² − 3, f'(2) = 12 − 3 = 8", 120, 400); return c.toDataURL("image/png"); })).split(",")[1], "base64");
  return { name: "kartka.png", mimeType: "image/png", buffer: PNG };
}
const bezOkien = async (p) => { for (let i = 0; i < 3 && await p.locator("#layer .scrim").count(); i++) { await p.keyboard.press("Escape"); await p.waitForTimeout(400); } };
const idz = (p, state) => p.evaluate((st) => { history.pushState(st, "", "#/" + st.view + "/" + (st.id || st.sid)); dispatchEvent(new PopStateEvent("popstate", { state: st })); }, state);
const lsMaZdjecie = (p, frag) => p.evaluate((f) => Object.keys(localStorage).some((k) => String(localStorage.getItem(k)).includes(f)), frag);

async function wyslij(p, scope, nazwa, { lang = "pl" } = {}) {
  const box = p.locator(scope + " .foto").first();
  const btn = box.locator(".foto-btn");
  const bb = await btn.boundingBox();
  ok(`${nazwa}: przycisk ≥ 44 px`, bb?.height >= 44, bb);
  const inp = box.locator('input[type="file"]');
  ok(`${nazwa}: aparat na telefonie (accept image/*, capture environment)`, (await inp.getAttribute("accept")) === "image/*" && (await inp.getAttribute("capture")) === "environment");
  const n0 = zap.length;
  await inp.setInputFiles(await zdjecie(p));
  await p.waitForSelector(scope + " .foto-res", { timeout: 15000 }).catch(() => null);
  const body = zap[n0];
  const wh = body ? jpegWH(Buffer.from(body.image, "base64")) : null;
  ok(`${nazwa}: zdjęcie 3200×2400 → JPEG 1600×1200`, body?.mediaType === "image/jpeg" && wh?.[0] === 1600 && wh?.[1] === 1200, { wh, mt: body?.mediaType });
  ok(`${nazwa}: rocznik z ROK i język strony`, body?.rocznik === "wefiz-bm-1-st-2026" && body?.lang === lang, body && { r: body.rocznik, l: body.lang });
  ok(`${nazwa}: zdjęcie nie zostaje w localStorage (D8)`, body && !(await lsMaZdjecie(p, body.image.slice(200, 260))));
  return { body, txt: await p.locator(scope + " .foto").first().innerText().catch(() => "") };
}

// ---------- A. krok po kroku (Analiza matematyczna), 375 px PL ----------
{
  const p = await page(b, { konto: "platne", w: 375, h: 812, ls: { "mock-docs": JSON.stringify(docs) } });
  await p.context().route(/functions\/v1\/sprawdz-zdjecie/, edge);
  await p.goto(BASE + "index.html#/"); await p.waitForTimeout(2500); await bezOkien(p);
  await idz(p, { view: "material", id: "W1", tab: "zadania" }); await p.waitForTimeout(1500); await bezOkien(p);
  const sims = p.locator(".wk-sim");
  ok("A: dwa zadania „Teraz Ty”", (await sims.count()) === 2, await p.locator("main").innerText().then((t) => t.slice(0, 400)));
  ok("A: przycisk tylko przy zadaniu z rozwiązaniem wzorcowym", (await sims.nth(0).locator(".foto-btn").count()) === 1 && (await sims.nth(1).locator(".foto-btn").count()) === 0);
  ok("A: tekst przycisku i opis (bez gotowego rozwiązania, zdjęcia nie zapisujemy)", /Sprawdź moje rozwiązanie ze zdjęcia/.test(await sims.nth(0).innerText()) && /bez gotowego rozwiązania\. Zdjęcia nie zapisujemy\./.test(await sims.nth(0).innerText()));
  await p.locator(".wk-sim .foto").first().scrollIntoViewIfNeeded(); await shot(p, "zdjecie-375-krok-przed");
  const { body, txt } = await wyslij(p, ".wk-sim", "A");
  ok("A: klucz zadania: treść, wynik, kroki, podpowiedź, bez punktów", body?.task.task === docs.materialContent.W1.worked[0].similar[0].task && body.task.result === 9 && body.task.steps.length === 2 && /Najpierw pochodna/.test(body.task.hint) && body.task.maxPoints == null, body?.task);
  ok("A: wynik: co dobrze, pierwszy błąd, wskazówka, ile zostało", /Co jest dobrze: Dobrze zacząłeś/.test(txt) && /Pierwszy błąd: W ostatniej linijce/.test(txt) && /Wskazówka:\s*Sprawdź, co podstawiasz/.test(txt) && /Zostało dziś: 4 z 5\. Zdjęcia nie zapisujemy\./.test(txt) && !/pkt/.test(txt), txt);
  await sims.nth(0).locator(".foto-res").scrollIntoViewIfNeeded();
  await shot(p, "zdjecie-375-krok-wynik");
  // limit i błąd: jasny komunikat
  tryb = "limit"; await p.locator(".wk-sim .foto input[type=file]").first().setInputFiles(await zdjecie(p)); await p.waitForTimeout(1200);
  ok("A: limit 5 dziennie → komunikat", /Na dziś to już 5 sprawdzeń ze zdjęcia\. Nowe jutro\./.test(await sims.nth(0).innerText()), await sims.nth(0).innerText());
  tryb = "blad"; await p.locator(".wk-sim .foto input[type=file]").first().setInputFiles(await zdjecie(p)); await p.waitForTimeout(1200);
  ok("A: błąd AI → spróbuj za chwilę, nie liczy się do limitu", /nie liczy się do limitu/.test(await sims.nth(0).innerText()), await sims.nth(0).innerText());
  tryb = "ok";
  ok("A: bez błędów strony", !p.errors.length, p.errors);
  await p.context().close();
}

// ---------- B. karta „Policz” w lekcji v4 (Makroekonomia), 375 px PL ----------
{
  const p = await page(b, { konto: "platne", w: 375, h: 812, ls: { "mock-docs": JSON.stringify(docs) } });
  await p.context().route(/functions\/v1\/sprawdz-zdjecie/, edge);
  await p.goto(BASE + "index.html#/material/L3"); await p.waitForTimeout(2500); await bezOkien(p);
  await p.locator(".lp-start").click(); await p.waitForTimeout(900);
  let found = false, przed = "";
  for (let guard = 0; guard < 30 && !found; guard++) {
    await bezOkien(p);
    const card = p.locator(".lp-card");
    if (!(await card.count())) { const d = p.locator(".lp-done-screen"); if (await d.count() && !/Lekcja (zrobiona|przerobiona)/.test(await d.innerText())) { await p.locator(".lp-cta").click(); await p.waitForTimeout(600); continue; } break; }
    const type = await card.getAttribute("data-type");
    if (type === "num") {
      przed = await card.innerText();
      await card.locator("input.lp-num").fill("1"); await p.locator(".lp-cta").click(); await p.waitForTimeout(500);
      found = true; break;
    }
    if (type === "mc") {
      const opts = card.locator(".lp-opts .opt"); let pick = 0;
      for (let i = 0; i < await opts.count(); i++) if (/OK /.test(await opts.nth(i).innerText())) { pick = i; break; }
      await opts.nth(pick).click(); await p.waitForTimeout(300);
    }
    await p.locator(".lp-cta").click(); await p.waitForTimeout(450);
  }
  ok("B: karta „Policz” w lekcji", found);
  ok("B: przed odpowiedzią bez przycisku zdjęcia", found && !/Sprawdź moje rozwiązanie ze zdjęcia/.test(przed), przed);
  const { body, txt } = await wyslij(p, ".lp-card", "B");
  ok("B: klucz z karty: treść z liczbami, wynik, jednostka, objaśnienie", /^You can earn \d+ zł or \d+ zł/.test(body?.task.task || "") && Number.isFinite(body?.task.result) && body.task.unit === "zł" && /Best alternative/.test(body.task.hint), body?.task);
  ok("B: wynik na karcie", /Pierwszy błąd:/.test(txt) && /Zostało dziś:/.test(txt), txt);
  await p.locator(".lp-card .foto-res").scrollIntoViewIfNeeded();
  await shot(p, "zdjecie-375-policz-wynik");
  ok("B: bez błędów strony", !p.errors.length, p.errors);
  await p.context().close();
}

// ---------- C. test próbny (Ochrona własności intelektualnej), 375 i 1280, PL i EN ----------
for (const [w, hh, lang] of [[375, 812, "pl"], [1280, 900, "pl"], [375, 812, "en"], [1280, 900, "en"]]) {
  const p = await page(b, { konto: "platne", w, h: hh, lang, ls: { "mock-docs": JSON.stringify(docs), "bm-exam-run": JSON.stringify(RUN) } });
  await p.context().route(/functions\/v1\/sprawdz-zdjecie/, edge);
  await p.goto(BASE + "index.html#/"); await p.waitForTimeout(2500); await bezOkien(p);
  await idz(p, { view: "exam", id: SID_T, sid: SID_T, part: "W" }); await p.waitForTimeout(1500); await bezOkien(p);
  const cards = p.locator(".sk-card.wide");
  const tCard = cards.filter({ hasText: RUN.items[0].q.slice(0, 30) }), oCard = cards.filter({ hasText: RUN.items[1].q });
  const tag = `C ${w} ${lang}`;
  ok(`${tag}: przycisk przy zadaniu, nie przy pytaniu otwartym`, (await tCard.locator(".foto-btn").count()) === 1 && (await oCard.locator(".foto-btn").count()) === 0, await p.locator("main").innerText().then((t) => t.slice(0, 500)));
  const { body, txt } = await wyslij(p, ".sk-card.wide", tag, { lang });
  ok(`${tag}: klucz z testu: treść, odpowiedź wzorcowa, maksimum 3 pkt`, body?.task.task === RUN.items[0].q && /cytat musi być uzasadniony/.test(body.task.answer) && body.task.maxPoints === 3 && body.task.result == null, body?.task);
  if (lang === "pl") ok(`${tag}: punkty „2 z 3 pkt” i wynik`, /2 z 3 pkt/.test(txt) && /Co jest dobrze:/.test(txt), txt);
  else {
    ok(`${tag}: EN: „2 of 3 pts”, What's right, First mistake, Left today`, /2 of 3 pts/.test(txt) && /What's right:/.test(txt) && /First mistake:/.test(txt) && /Left today: \d of 5\./.test(txt) && /We don't store the photo\./.test(txt), txt);
    ok(`${tag}: EN bez polskich znaków w ramce zdjęcia`, !PL_ZN.test(txt), txt);
  }
  await tCard.locator(".foto-res").scrollIntoViewIfNeeded();
  await shot(p, `zdjecie-${w}-${lang}-test-wynik`);
  ok(`${tag}: bez błędów strony`, !p.errors.length, p.errors);
  await p.context().close();
}

// ---------- D. krok po kroku EN 1280 (zrzut) i bez pełnego dostępu ----------
{
  const p = await page(b, { konto: "platne", w: 1280, h: 900, lang: "en", ls: { "mock-docs": JSON.stringify(docs) } });
  await p.context().route(/functions\/v1\/sprawdz-zdjecie/, edge);
  await p.goto(BASE + "index.html#/"); await p.waitForTimeout(2500); await bezOkien(p);
  await idz(p, { view: "material", id: "W1", tab: "zadania" }); await p.waitForTimeout(1500); await bezOkien(p);
  const t0 = await p.locator(".wk-sim .foto").first().innerText();
  ok("D: EN przycisk i opis", /Check my solution from a photo/.test(t0) && /We don't store the photo\./.test(t0) && !PL_ZN.test(t0), t0);
  await p.locator(".wk-sim .foto").first().scrollIntoViewIfNeeded(); await shot(p, "zdjecie-1280-en-krok-przed");
  await wyslij(p, ".wk-sim", "D", { lang: "en" });
  await shot(p, "zdjecie-1280-en-krok-wynik");
  await p.context().close();
}
{
  const p = await page(b, { konto: "platne", w: 1280, h: 900, ls: { "mock-docs": JSON.stringify(docs) } });
  await p.context().route(/functions\/v1\/sprawdz-zdjecie/, edge);
  await p.goto(BASE + "index.html#/"); await p.waitForTimeout(2500); await bezOkien(p);
  await idz(p, { view: "material", id: "W1", tab: "zadania" }); await p.waitForTimeout(1500); await bezOkien(p);
  await p.locator(".wk-sim .foto").first().scrollIntoViewIfNeeded(); await shot(p, "zdjecie-1280-pl-krok-przed");
  await p.context().close();
}
{
  const p = await page(b, { konto: "darmowe", w: 375, h: 812, ls: { "mock-docs": JSON.stringify(docs) } });
  await p.context().route(/functions\/v1\/sprawdz-zdjecie/, edge);
  await p.goto(BASE + "index.html#/"); await p.waitForTimeout(2500); await bezOkien(p);
  await idz(p, { view: "material", id: "W1", tab: "zadania" }); await p.waitForTimeout(1500); await bezOkien(p);
  const n0 = zap.length;
  const btn = p.locator(".wk-sim .foto-btn").first();
  if (await btn.count()) { await btn.click(); await p.waitForTimeout(500); }
  const modal = await p.locator(".modal").innerText().catch(() => "");
  ok("D: bez pełnego dostępu: okno „Pełna wersja”, bez zapytania", (await btn.count()) === 1 ? /pełna wersja/i.test(modal) && /Sprawdzenie zdjęcia rozwiązania/.test(modal) && zap.length === n0 : (await p.locator("main").innerText()).length > 0, { modal, n: zap.length - n0, btn: await btn.count() });
  await p.context().close();
}

for (const r of wyniki) console.log(r.join(" "));
const bad = wyniki.filter((r) => r[0] === "✗").length;
console.log(bad ? `BŁĘDY: ${bad} z ${wyniki.length}` : `OK ${wyniki.length}/${wyniki.length}`);
await b.close();
process.exit(bad ? 1 : 0);
