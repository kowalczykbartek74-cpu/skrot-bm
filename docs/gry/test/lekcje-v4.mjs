// Lekcje v4 (spec claude/lekcje-v4): etap A na atrapie – migracja zdanych lekcji, pytania z opcjami w Powtórkach,
// powroty złych odpowiedzi, dni powtórek (lv) i punkty 60 → 80. BASE=http://127.0.0.1:8790/ node docs/gry/test/lekcje-v4.mjs
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 600)]);
const UID = "00000000-0000-4000-8000-000000000001";
const hashStr = (s) => { let x = 2166136261; for (const ch of String(s)) { x ^= ch.codePointAt(0); x = Math.imul(x, 16777619) >>> 0; } return x.toString(36); };
const NOW = new Date("2026-11-10T10:00:00+01:00").getTime(), DAY = 864e5;
const mc = (q, sec) => ({ q, options: ["Zła A " + q, "OK " + q, "Zła C " + q], correct: 1, why: "Bo B.", not: ["A myli koszty.", null, "C to inny koszt."], ...(sec != null ? { sec } : {}) });
const lesson = { v2: true,
  sections: [
    { h: "1. Koszt alternatywny", intuition: "Wybierasz kino albo pracę.", body: "**Opportunity cost** is the value of the best alternative given up.", check: mc("Check 1") },
    { h: "2. PPF", body: "The **PPF** shows the maximum output combinations.", check: mc("Check 2") },
  ],
  exit: [mc("Exit 1", 0), mc("Exit 2", 1), mc("Exit 3", 0)],
};
// Lekcja bez pogrubień i bez fiszek ≥ 3: same karty czytania i pytania (łatwo przejść w teście).
const plain = (t) => ({ v2: true, sections: [{ h: "1. " + t, intuition: "Intuicja " + t, body: "Plain text about " + t + " without bold terms.", check: mc(t + " check") }],
  exit: [mc(t + " exit 1", 0), mc(t + " exit 2", 0), mc(t + " exit 3", 0)] });
// Lekcja v4: atomy z conf, szablony gen, długie „Prościej”, „Wyjaśnij” z kluczem.
const longSimple = Array.from({ length: 12 }, (_, i) => `Zdanie numer ${i + 1} tłumaczy koszt prosto i spokojnie.`).join(" ");
const v4L = { v2: true, v: 4, type: "quant",
  atoms: [{ id: "a1", t: "Explicit cost", pl: "koszt jawny", d: "Money actually paid out", q: "What is an explicit cost?", a: "Money actually paid", conf: ["a2"] },
    { id: "a2", t: "Implicit cost", pl: "koszt ukryty", d: "Value of your own resources used, no payment", q: "What is an implicit cost?", a: "Value of own resources", conf: ["a1"] }],
  sections: [{ h: "1. Koszty", intuition: "Kino czy praca?", body: "Plain text about costs without bold terms.", simple: longSimple, check: mc("V4 check") }],
  gen: [{ id: "g1", task: "You can earn {a} zł or {b} zł. A ticket costs {c} zł. What is the opportunity cost?", vars: { a: [40, 90, 10], b: [50, 120, 10], c: [20, 60, 5] }, answer: "max(a, b) + c", unit: "zł", tol: 0, why: "Best alternative given up + money paid." },
    { id: "g2", task: "Bad {a}", vars: { a: [1, 2, 1] }, answer: "alert(a)" }],
  recap: { prompt: "Explain opportunity cost.", keys: ["best alternative", "given up", "money paid"], model: "..." },
  exit: [mc("V4 exit 1", 0), mc("V4 exit 2", 0), mc("V4 exit 3", 0)] };
const fl = [1, 2, 3, 4].map((i) => ({ q: `Fiszka ${i}?`, a: `Odp ${i}` }));
const docs = {
  materials: { L3: { subjectId: "makroekonomia", kind: "lesson", order: 5, unit: 1, unitTitle: "Podstawy", title: "Koszty v4", quizCount: 0, flashcardCount: 0, createdAt: NOW - 5e6, v: 2, source: "sylabus" }, L4: { subjectId: "makroekonomia", kind: "lesson", order: 3, unit: 1, unitTitle: "Podstawy", title: "Popyt", quizCount: 0, flashcardCount: 2, createdAt: NOW - 7e6, v: 2, source: "sylabus" },
    L5: { subjectId: "makroekonomia", kind: "lesson", order: 4, unit: 1, unitTitle: "Podstawy", title: "Podaż", quizCount: 0, flashcardCount: 2, createdAt: NOW - 6e6, v: 2, source: "sylabus" }, L2: { subjectId: "makroekonomia", kind: "lesson", order: 2, unit: 1, unitTitle: "Podstawy", title: "PPF", quizCount: 0, flashcardCount: 4, createdAt: NOW - 8e6, v: 2, source: "sylabus" }, L1: { subjectId: "makroekonomia", kind: "lesson", order: 1, unit: 1, unitTitle: "Podstawy", title: "Koszt alternatywny", quizCount: 0, flashcardCount: 4, createdAt: NOW - 9e6, v: 2, source: "sylabus" } },
  materialContent: { L3: { v: 2, lesson: v4L, flashcards: [], concepts: [], quiz: [] }, L4: { v: 2, lesson: plain("L4"), flashcards: fl.slice(0, 2).map((f) => ({ q: "L4 " + f.q, a: f.a })), concepts: [], quiz: [] },
    L5: { v: 2, lesson: plain("L5"), flashcards: [], concepts: [], quiz: [] }, L2: { v: 2, lesson: { ...lesson, exit: [mc("L2 exit 1", 0), mc("L2 exit 2", 1), mc("L2 exit 3", 0)] }, flashcards: fl.map((f) => ({ q: "L2 " + f.q, a: f.a })), concepts: [], quiz: [] }, L1: { v: 2, lesson, flashcards: fl, concepts: [{ term: "Opportunity cost", pl: "koszt alternatywny", definition: "Value of the best alternative given up." }], quiz: [] } },
};
const prog = { mastery: { L1: { ok: true, score: 3, total: 3, at: NOW - DAY, weak: [] } }, done: { L1: NOW - DAY }, lp: { L1: { stars: 3, last: 3, xpL: true, b: [4, 4] } } };
// Okno awansu (poziom XP, main od 2.11) potrafi wyskoczyć po zdobyciu XP; zamykamy je jak uczeń (Escape).
const bezOkien = async (p) => { for (let i = 0; i < 3 && await p.locator("#layer .scrim").count(); i++) { await p.keyboard.press("Escape"); await p.waitForTimeout(400); } };
const P = await page(b, { w: +process.env.W || 390, h: +process.env.H || 844, konto: "platne", ls: { "mock-docs": JSON.stringify(docs), "mock-progress": JSON.stringify({ [UID]: prog }) } });
await P.clock.setFixedTime(new Date(NOW));
// Lista kontrolna (10.1): bez poziomego przewijania na każdym zrzucie.
const over = [];
const shot0 = shot; const shotX = async (p, n) => { const o = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]); if (o[0] > o[1] + 1) over.push(n + ":" + o.join(">")); return shot0(p, n); };
const progOf = async () => (await P.waitForTimeout(2800), P.evaluate((uid) => JSON.parse(localStorage.getItem("mock-progress") || "{}")[uid] || {}, UID));

// 1. migracja v4seed: zdana lekcja wrzuca fiszki i pytania do srs, komunikat na Dziś
await P.goto(BASE + "index.html#/"); await P.waitForTimeout(3000);
let pr = await progOf();
const qk = [...lesson.sections.map((s) => s.check), ...lesson.exit].map((q) => "q:L1:" + hashStr(q.q));
const fk = fl.map((f) => "L1:" + hashStr(f.q));
ok("v4seed: 4 fiszki + 5 pytań w srs", pr.v4seed === 1 && [...qk, ...fk].every((k) => Array.isArray(pr.srs?.[k])), pr);
ok("komunikat o zmianie punktów na Dziś", /Zmieniliśmy punkty/.test(await P.locator("main").innerText()), (await P.locator("main").innerText()).slice(0, 400));
await shotX(P, "v4-dzis");
await P.getByRole("button", { name: "Jasne", exact: true }).click(); await P.waitForTimeout(400);
ok("komunikat znika po „Jasne”", !/Zmieniliśmy punkty/.test(await P.locator("main").innerText()) && (await progOf()).v4msg === 1, "");

// 2. mapa kursu: zdana wcześniej lekcja ma teraz 60%
await P.evaluate(() => { location.hash = "#/subject/makroekonomia"; }); await P.waitForTimeout(1500);
ok("mapa kursu: 60% i ✓", /60%/.test(await P.locator(".sk-course").innerText()) && (await P.locator(".sk-node .sk-dot").first().innerText()) === "✓", await P.locator(".sk-course").innerText().catch(() => ""));

// 3. Powtórki: 9 kart (4 fiszki + 5 pytań), jedna zła odpowiedź wraca i zostaje poprawiona
await P.evaluate(() => { location.hash = "#/review"; }); await P.waitForTimeout(1200);
ok("Powtórki: 9 na dziś", /9\s*fisz/.test(await P.locator(".rv-hero").innerText()), await P.locator(".rv-hero").innerText());
await P.getByRole("button", { name: /Zaczynamy/ }).click(); await P.waitForTimeout(1500);
let seen = { mc: 0, fl: 0, again: 0 }, wrongDone = false, guard = 0, shotMc = false;
while (guard++ < 30) {
  const card = P.locator(".lp-card");
  if (!(await card.count())) break;
  const type = await card.getAttribute("data-type");
  if (type === "rvmc") {
    const txt = await card.innerText();
    if (/jeszcze raz/i.test(txt)) seen.again++; else seen.mc++;
    const opts = card.locator(".lp-opts .opt");
    let pick = -1;
    for (let i = 0; i < await opts.count(); i++) { const t = await opts.nth(i).innerText(); if (!wrongDone ? /Zła/.test(t) : /OK /.test(t)) { pick = i; break; } }
    await opts.nth(pick).click(); await P.waitForTimeout(350);
    if (!wrongDone) { wrongDone = true; const fb = await card.innerText(); ok("zła odpowiedź: why + „Czemu nie” + wróci", /Bo B\./.test(fb) && /Czemu nie/.test(fb) && /wróci jeszcze w tej sesji/.test(fb), fb); await shotX(P, "v4-rvmc-zle"); }
    else if (!shotMc) { shotMc = true; await shotX(P, "v4-rvmc-dobrze"); }
    await P.locator(".lp-cta").click(); await P.waitForTimeout(350);
  } else if (type === "grade4") {
    seen.fl++;
    await P.locator(".lp-cta").click(); await P.waitForTimeout(250);
    await P.getByRole("button", { name: /Pamiętam/ }).first().click(); await P.waitForTimeout(600);
  } else break;
}
const doneTxt = await P.locator(".lp-done-screen").innerText().catch(() => "");
ok("w sesji: 5 pytań, 4 fiszki, 1 powrót", seen.mc === 5 && seen.fl === 4 && seen.again === 1, seen);
ok("ekran końca: poprawione + awans Utrwalone", /wszystkie poprawione/.test(doneTxt) && /Utrwalone ✓✓ \+10/.test(doneTxt), doneTxt);
await shotX(P, "v4-rv-koniec");
pr = await progOf();
const t = Math.round((NOW - new Date("2026-01-01T00:00:00+01:00").getTime()) / DAY);
ok("lv: jeden dzień", Array.isArray(pr.lv?.L1) && pr.lv.L1.length === 1, pr.lv);
// nowa karta: „dobrze” = pudełko 1 (1 dzień); zła poprawiona w powrocie też tylko pudełko 1 (powrót nie liczy się do terminu)
ok("wszystkie karty: pudełko 1, termin jutro", Object.values(pr.srs).every((v) => v[0] === 1 && v[1] === Object.values(pr.srs)[0][1]), pr.srs);
await P.locator(".lp-cta").click(); await P.waitForTimeout(600);

// 4. mapa kursu: 80% i ✓✓
await P.evaluate(() => { location.hash = "#/subject/makroekonomia"; }); await P.waitForTimeout(1500);
ok("mapa kursu: 80% i ✓✓", /80%/.test(await P.locator(".sk-course").innerText()) && (await P.locator(".sk-node .sk-dot").first().innerText()) === "✓✓", await P.locator(".sk-course").innerText().catch(() => ""));
await shotX(P, "v4-mapa");
// ten sam dzień drugi raz: nic się nie zmienia
await P.evaluate(() => { location.hash = "#/review"; }); await P.waitForTimeout(800);
ok("na dziś koniec", /Na dziś koniec/.test(await P.locator(".rv-hero").innerText()), await P.locator(".rv-hero").innerText());

// 5. nowa lekcja: bilet zdany 2/3 → wszystko do powtórek od jutra, zła odpowiedź z biletu od razu w pudełku 1
await P.evaluate(() => { location.hash = "#/material/L2"; }); await P.waitForTimeout(1500);
await P.locator(".lp-path .lp-dot").last().click(); await P.waitForTimeout(900);
let bad = false; guard = 0;
while (guard++ < 15) {
  const card = P.locator(".lp-card"); if (!(await card.count())) break;
  const type = await card.getAttribute("data-type");
  if (type === "mc" || type === "hook") {
    const opts = card.locator(".lp-opts .opt"); let pick = 0;
    for (let i = 0; i < await opts.count(); i++) { const t = await opts.nth(i).innerText(); if (type === "hook" ? true : !bad && /exit 2/.test(t) ? /Zła/.test(t) : /OK /.test(t)) { pick = i; break; } }
    if (type === "mc" && !bad && /exit 2/.test(await card.innerText())) bad = true;
    await opts.nth(pick).click(); await P.waitForTimeout(350);
  }
  await P.locator(".lp-cta").click(); await P.waitForTimeout(450);
}
await shotX(P, "v4-bilet-koniec");
const finTxt = await P.locator(".lp-done-screen").innerText().catch(() => "");
await P.locator(".lp-x").click(); await P.waitForTimeout(500);
pr = await progOf();
const l2q = [...lesson.sections.map((s) => s.check), mc("L2 exit 1", 0), mc("L2 exit 2", 1), mc("L2 exit 3", 0)].map((q) => "q:L2:" + hashStr(q.q));
const today = pr.srs[l2q[0]]?.[1] - 1;
ok("bilet zdany: pytania i fiszki od jutra, zła z biletu w pudełku 1", pr.mastery?.L2?.ok && pr.srs[l2q[3]]?.[0] === 1 && pr.srs[l2q[3]][1] === today + 1 && [0, 1, 2, 4].every((i) => pr.srs[l2q[i]]?.[0] === 0 && pr.srs[l2q[i]][1] === today + 1) && fl.every((f) => pr.srs["L2:" + hashStr("L2 " + f.q)]?.[0] === 0), { m: pr.mastery?.L2, s: l2q.map((k) => pr.srs[k]) });
await P.evaluate(() => { location.hash = "#/review"; }); await P.waitForTimeout(800);
ok("nowe karty z lekcji nie czekają dziś", /Na dziś koniec/.test(await P.locator(".rv-hero").innerText()), await P.locator(".rv-hero").innerText());

// 6. etap B: L4 (nieparzysta) ma haczyk z biletu, rozgrzewkę z poprzedniej lekcji (L2), „Zgaduję” wysyła pytanie do pudełka 1,
// a ekran końca porównuje haczyk z wynikiem biletu. L5 (parzysta, A/B) jest bez haczyka.
await P.evaluate(() => { location.hash = "#/material/L4"; }); await P.waitForTimeout(1500);
await bezOkien(P); await P.locator(".lp-start").click(); await P.waitForTimeout(900);
const types = []; let warmTxt = "", confShot = false; guard = 0;
while (guard++ < 40) {
  await bezOkien(P);
  const card = P.locator(".lp-card"); if (!(await card.count())) { if (await P.locator(".lp-done-screen").count() && !/Lekcja (zrobiona|przerobiona)/.test(await P.locator(".lp-done-screen").innerText())) { await P.locator(".lp-cta").click(); await P.waitForTimeout(600); continue; } break; }
  const type = await card.getAttribute("data-type"), txt = await card.innerText(); types.push(type);
  if (/rozgrzewka/i.test(txt)) warmTxt += txt + "\n";
  if (type === "hook" || type === "mc") {
    if (/L4 exit 3/.test(txt)) { await card.getByRole("button", { name: "Zgaduję" }).click(); await P.waitForTimeout(250); if (!confShot) { confShot = true; await shotX(P, "v4-zgaduje"); } }
    const opts = card.locator(".lp-opts .opt"); let pick = 0;
    for (let i = 0; i < await opts.count(); i++) { const t = await opts.nth(i).innerText(); if (type === "hook" ? /Zła/.test(t) : /OK /.test(t)) { pick = i; break; } }
    await opts.nth(pick).click(); await P.waitForTimeout(350);
  } else if (type === "grade4") { await P.locator(".lp-cta").click(); await P.waitForTimeout(250); await P.getByRole("button", { name: /Pamiętam/ }).first().click(); await P.waitForTimeout(600); continue; }
  await P.locator(".lp-cta").click(); await P.waitForTimeout(450);
}
const fin4 = await P.locator(".lp-done-screen").innerText().catch(() => "");
await shotX(P, "v4-przed-po");
ok("L4: pierwsza karta to haczyk z biletu", types[0] === "hook", types);
ok("L4: rozgrzewka z pytaniem z poprzedniej lekcji (L2)", /Check 1|Check 2|L2 exit/.test(warmTxt), warmTxt);
ok("L4: brak „Wracamy do zagadki” (haczyk z biletu)", !types.includes("reveal"), types);
ok("L4: przed i po", /Na początku: haczyk ✗\. Teraz: 3 z 3 ✓/.test(fin4), fin4);
await P.locator(".lp-x").click(); await P.waitForTimeout(500);
pr = await progOf();
const k3 = "q:L4:" + hashStr("L4 exit 3"), k1 = "q:L4:" + hashStr("L4 exit 1");
ok("zgadnięte i poprawne → pudełko 1 jak błędne; pewne → nowe od jutra", pr.srs[k3]?.[0] === 1 && pr.srs[k1]?.[0] === 0, { k3: pr.srs[k3], k1: pr.srs[k1] });
await P.evaluate(() => { location.hash = "#/material/L5"; }); await P.waitForTimeout(1500);
await bezOkien(P); await P.locator(".lp-start").click(); await P.waitForTimeout(900);
const t5 = await P.locator(".lp-card").getAttribute("data-type");
ok("L5 (parzysta, bez własnego hook): bez haczyka", t5 !== "hook", t5);
await P.locator(".lp-x").click(); await P.waitForTimeout(400);

// 7. etap C: lekcja v4 (L3, parzysta: bez haczyka)
const warns = []; P.on("console", (m) => { if (m.type() === "warning") warns.push(m.text()); });
await P.evaluate(() => { location.hash = "#/material/L3"; }); await P.waitForTimeout(1500);
await bezOkien(P); await P.locator(".lp-start").click(); await P.waitForTimeout(900);
const t3 = []; let numSeen = [], sheet = "", distTxt = ""; guard = 0;
const solve = (task) => { const [a, b, c] = (task.match(/\d+/g) || []).map(Number); return Math.max(a, b) + c; };
while (guard++ < 40) {
  await bezOkien(P);
  const card = P.locator(".lp-card");
  if (!(await card.count())) { const d = P.locator(".lp-done-screen"); if (await d.count() && !/Lekcja (zrobiona|przerobiona)/.test(await d.innerText())) { await P.locator(".lp-cta").click(); await P.waitForTimeout(600); continue; } break; }
  const type = await card.getAttribute("data-type"), txt = await card.innerText(); t3.push(type);
  if (type === "read" && !sheet) { await P.locator(".lp-help").click(); await P.waitForTimeout(400); sheet = await P.locator(".lp-sheet").innerText(); await shotX(P, "v4-prosciej"); await P.locator(".lp-sheet .btn.primary").click(); await P.waitForTimeout(300); }
  if (type === "mc") {
    if (/Which concept fits/.test(txt) && !distTxt) distTxt = txt;
    const opts = card.locator(".lp-opts .opt"); let pick = 0;
    for (let i = 0; i < await opts.count(); i++) { const t = await opts.nth(i).innerText(); if (/Which concept/.test(txt) ? (/Money actually/.test(txt) ? /Explicit cost/ : /Implicit cost/).test(t) : /OK /.test(t)) { pick = i; break; } }
    await opts.nth(pick).click(); await P.waitForTimeout(350);
  } else if (type === "num") {
    const task = await card.locator(".q").innerText(); numSeen.push(task);
    await card.locator("input.lp-num").fill(numSeen.length === 1 ? "1" : String(solve(task)).replace(".", ","));
    await P.locator(".lp-cta").click(); await P.waitForTimeout(400);
    if (numSeen.length === 1) { ok("num: zła odpowiedź pokazuje wynik i drugą szansę", /Wynik: \d+ zł/.test(await card.innerText()) && /nowymi liczbami/.test(await card.innerText()), await card.innerText()); await shotX(P, "v4-num-zle"); }
  } else if (type === "recap") {
    await card.locator("textarea").fill("Coś tam."); await P.locator(".lp-cta").click(); await P.waitForTimeout(400);
  }
  await P.locator(".lp-cta").click(); await P.waitForTimeout(450);
}
ok("C6: długie „Prościej” skrócone + „Pokaż więcej”", /Pokaż więcej/.test(sheet) && !/Zdanie numer 12/.test(sheet), sheet);
ok("C3: pytanie rozróżniające w treningu (opcje: Explicit/Implicit), bez drugiej szansy", /Which concept fits: (Money actually paid out|Value of your own)/.test(distTxt) && /Explicit cost/.test(distTxt) && /Implicit cost/.test(distTxt) && !/DRUGA SZANSA/i.test(distTxt), distTxt);
ok("C4: num dwa razy (druga szansa z nowymi liczbami)", numSeen.length === 2 && numSeen[0] !== numSeen[1], numSeen);
ok("C4: zły szablon pominięty z console.warn", warns.some((w) => /L3: szablon gen g2 pominięty/.test(w)) && t3.filter((x) => x === "num").length === 2, { warns, t3 });
await P.locator(".lp-x").click(); await P.waitForTimeout(500);
pr = await progOf();
const aq = "L3:" + hashStr("What is an explicit cost?");
ok("srs: d:, n: i fiszki z atomów; recap < 1/2 → fiszki jutro w pudełku 1", pr.srs["d:L3:a1"]?.[0] === 0 && pr.srs["d:L3:a2"] && pr.srs["n:L3:g1"] && !pr.srs["n:L3:g2"] && pr.srs[aq]?.[0] === 1, { d: pr.srs["d:L3:a1"], n: pr.srs["n:L3:g1"], a: pr.srs[aq] });
await P.evaluate(() => { location.hash = "#/material/L3"; }); await P.waitForTimeout(800);
await P.getByRole("button", { name: /Fiszki/ }).first().click().catch(() => {}); await P.waitForTimeout(600);

// 8. następny dzień: rozróżnianie i zadanie liczbowe wracają w Powtórkach
await P.clock.setFixedTime(new Date(NOW + DAY));
await P.goto(BASE + "index.html#/review"); await P.waitForTimeout(2500);
const modalTxt = await P.locator("#layer .modal").innerText().catch(() => "");
if (modalTxt) { console.log("okno po starcie:", modalTxt.slice(0, 120)); await P.keyboard.press("Escape"); await P.waitForTimeout(300); }
await P.getByRole("button", { name: /Zaczynamy/ }).click(); await P.waitForTimeout(1500);
let rvTypes = [], rvNum = "", rvDist = ""; guard = 0;
while (guard++ < 60) {
  const card = P.locator(".lp-card"); if (!(await card.count())) { const d = P.locator(".lp-done-screen"); if (await d.count() && !/Zrobione/.test(await d.innerText())) { await P.locator(".lp-cta").click(); await P.waitForTimeout(600); continue; } break; }
  const type = await card.getAttribute("data-type"), txt = await card.innerText(); rvTypes.push(type);
  if (type === "rvmc") {
    if (/Which concept fits/.test(txt)) rvDist = txt;
    const opts = card.locator(".lp-opts .opt"), m = /Which concept fits: (.*)\?/.exec(txt); let pick = 0;
    for (let i = 0; i < await opts.count(); i++) { const t = await opts.nth(i).innerText(); if (m ? (/Money actually/.test(m[1]) ? /Explicit/.test(t) : /Implicit/.test(t)) : /OK /.test(t)) { pick = i; break; } }
    await opts.nth(pick).click(); await P.waitForTimeout(300); await P.locator(".lp-cta").click(); await P.waitForTimeout(350);
  } else if (type === "num") {
    rvNum = await card.locator(".q").innerText();
    await card.locator("input.lp-num").fill(String(solve(rvNum))); await P.locator(".lp-cta").click(); await P.waitForTimeout(300);
    if (!/Dobrze/.test(await card.innerText())) rvTypes.push("NUM-ZLE:" + await card.innerText());
    await shotX(P, "v4-rv-num"); await P.locator(".lp-cta").click(); await P.waitForTimeout(350);
  } else if (type === "grade4") { await P.locator(".lp-cta").click(); await P.waitForTimeout(250); await P.getByRole("button", { name: /Pamiętam/ }).first().click(); await P.waitForTimeout(600); }
  else break;
}
ok("Powtórki: rozróżnianie (d:) i zadanie liczbowe (n:) wracają", /Which concept fits/.test(rvDist) && /You can earn/.test(rvNum) && !rvTypes.some((t) => /NUM-ZLE/.test(t)), { rvTypes, rvNum, rvDist });

ok("bez poziomego przewijania", over.length === 0, over);
ok("bez błędów w konsoli", P.errors.length === 0, P.errors);
for (const [w, n, i] of wyniki) console.log(w, n, i);
console.log(`${wyniki.filter((x) => x[0] === "✓").length}/${wyniki.length}`);
await b.close();
