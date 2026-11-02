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
const fl = [1, 2, 3, 4].map((i) => ({ q: `Fiszka ${i}?`, a: `Odp ${i}` }));
const docs = {
  materials: { L2: { subjectId: "makroekonomia", kind: "lesson", order: 2, unit: 1, unitTitle: "Podstawy", title: "PPF", quizCount: 0, flashcardCount: 4, createdAt: NOW - 8e6, v: 2, source: "sylabus" }, L1: { subjectId: "makroekonomia", kind: "lesson", order: 1, unit: 1, unitTitle: "Podstawy", title: "Koszt alternatywny", quizCount: 0, flashcardCount: 4, createdAt: NOW - 9e6, v: 2, source: "sylabus" } },
  materialContent: { L2: { v: 2, lesson: { ...lesson, exit: [mc("L2 exit 1", 0), mc("L2 exit 2", 1), mc("L2 exit 3", 0)] }, flashcards: fl.map((f) => ({ q: "L2 " + f.q, a: f.a })), concepts: [], quiz: [] }, L1: { v: 2, lesson, flashcards: fl, concepts: [{ term: "Opportunity cost", pl: "koszt alternatywny", definition: "Value of the best alternative given up." }], quiz: [] } },
};
const prog = { mastery: { L1: { ok: true, score: 3, total: 3, at: NOW - DAY, weak: [] } }, done: { L1: NOW - DAY }, lp: { L1: { stars: 3, last: 3, xpL: true, b: [4, 4] } } };
const P = await page(b, { konto: "platne", ls: { "mock-docs": JSON.stringify(docs), "mock-progress": JSON.stringify({ [UID]: prog }) } });
await P.clock.setFixedTime(new Date(NOW));
const progOf = async () => (await P.waitForTimeout(2800), P.evaluate((uid) => JSON.parse(localStorage.getItem("mock-progress") || "{}")[uid] || {}, UID));

// 1. migracja v4seed: zdana lekcja wrzuca fiszki i pytania do srs, komunikat na Dziś
await P.goto(BASE + "index.html#/"); await P.waitForTimeout(3000);
let pr = await progOf();
const qk = [...lesson.sections.map((s) => s.check), ...lesson.exit].map((q) => "q:L1:" + hashStr(q.q));
const fk = fl.map((f) => "L1:" + hashStr(f.q));
ok("v4seed: 4 fiszki + 5 pytań w srs", pr.v4seed === 1 && [...qk, ...fk].every((k) => Array.isArray(pr.srs?.[k])), pr);
ok("komunikat o zmianie punktów na Dziś", /Zmieniliśmy punkty/.test(await P.locator("main").innerText()), (await P.locator("main").innerText()).slice(0, 400));
await shot(P, "v4-dzis");
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
    if (!wrongDone) { wrongDone = true; const fb = await card.innerText(); ok("zła odpowiedź: why + „Czemu nie” + wróci", /Bo B\./.test(fb) && /Czemu nie/.test(fb) && /wróci jeszcze w tej sesji/.test(fb), fb); await shot(P, "v4-rvmc-zle"); }
    else if (!shotMc) { shotMc = true; await shot(P, "v4-rvmc-dobrze"); }
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
await shot(P, "v4-rv-koniec");
pr = await progOf();
const t = Math.round((NOW - new Date("2026-01-01T00:00:00+01:00").getTime()) / DAY);
ok("lv: jeden dzień", Array.isArray(pr.lv?.L1) && pr.lv.L1.length === 1, pr.lv);
// nowa karta: „dobrze” = pudełko 1 (1 dzień); zła poprawiona w powrocie też tylko pudełko 1 (powrót nie liczy się do terminu)
ok("wszystkie karty: pudełko 1, termin jutro", Object.values(pr.srs).every((v) => v[0] === 1 && v[1] === Object.values(pr.srs)[0][1]), pr.srs);
await P.locator(".lp-cta").click(); await P.waitForTimeout(600);

// 4. mapa kursu: 80% i ✓✓
await P.evaluate(() => { location.hash = "#/subject/makroekonomia"; }); await P.waitForTimeout(1500);
ok("mapa kursu: 80% i ✓✓", /80%/.test(await P.locator(".sk-course").innerText()) && (await P.locator(".sk-node .sk-dot").first().innerText()) === "✓✓", await P.locator(".sk-course").innerText().catch(() => ""));
await shot(P, "v4-mapa");
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
await shot(P, "v4-bilet-koniec");
const finTxt = await P.locator(".lp-done-screen").innerText().catch(() => "");
await P.locator(".lp-x").click(); await P.waitForTimeout(500);
pr = await progOf();
const l2q = [...lesson.sections.map((s) => s.check), mc("L2 exit 1", 0), mc("L2 exit 2", 1), mc("L2 exit 3", 0)].map((q) => "q:L2:" + hashStr(q.q));
const today = pr.srs[l2q[0]]?.[1] - 1;
ok("bilet zdany: pytania i fiszki od jutra, zła z biletu w pudełku 1", pr.mastery?.L2?.ok && pr.srs[l2q[3]]?.[0] === 1 && pr.srs[l2q[3]][1] === today + 1 && [0, 1, 2, 4].every((i) => pr.srs[l2q[i]]?.[0] === 0 && pr.srs[l2q[i]][1] === today + 1) && fl.every((f) => pr.srs["L2:" + hashStr("L2 " + f.q)]?.[0] === 0), { m: pr.mastery?.L2, s: l2q.map((k) => pr.srs[k]) });
await P.evaluate(() => { location.hash = "#/review"; }); await P.waitForTimeout(800);
ok("nowe karty z lekcji nie czekają dziś", /Na dziś koniec/.test(await P.locator(".rv-hero").innerText()), await P.locator(".rv-hero").innerText());

ok("bez błędów w konsoli", P.errors.length === 0, P.errors);
for (const [w, n, i] of wyniki) console.log(w, n, i);
console.log(`${wyniki.filter((x) => x[0] === "✓").length}/${wyniki.length}`);
await b.close();
