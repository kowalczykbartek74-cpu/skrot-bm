// Etap 3 specu „Systemy z Zdawalni w Skrócie”: ochrona wpisanych odpowiedzi (kopie.js + kolejka zapisów).
//   A. test próbny: odświeżenie w połowie nie kasuje odpowiedzi (także gdy zapis całego testu zginął – kopia),
//   B. oddanie bez internetu: test czeka „Nie zapisało się, spróbuję jeszcze raz”, po powrocie sieci AI dostaje te same odpowiedzi,
//   C. odpowiedź w quizie bez sieci: komunikat i ponowienie zapisu w bazie po powrocie sieci (bez białego ekranu),
//   D. „Zgłoś błąd” i własny wpis w kalendarzu: tekst wraca po zamknięciu okna / odświeżeniu, znika po wysłaniu.
// BASE=http://127.0.0.1:8811/ node docs/gry/test/kopie.mjs
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 700)]);
const SID = "ochrona-wlasnosci-intelektualnej", now = Date.now();
const quiz = (n, tag) => Array.from({ length: n }, (_, i) => ({ q: `${tag}: question ${i + 1}?`, options: ["A" + i, "B" + i, "C" + i, "D" + i], correct: i % 4 }));
const DOCS = {
  materials: Object.fromEntries([0, 1, 2, 3, 4, 5].map((i) => ["o" + i, { subjectId: SID, title: "Topic " + i, quizCount: 8, flashcardCount: 0, createdAt: now - (9 - i) * 1e6, v: 2, source: "sylabus" }])),
  materialContent: Object.fromEntries([0, 1, 2, 3, 4, 5].map((i) => ["o" + i, { v: 2, tldr: "T" + i, quiz: quiz(8, "T" + i), flashcards: [] }])),
  deadlines: { d1: { title: "Kolokwium OWI", subjectId: SID, type: "kolokwium", part: "W", date: new Date(now + 10 * 864e5).toISOString().slice(0, 10), approx: true } },
  examBank: { [SID]: { items: [{ id: "ob1", type: "open", mid: "o3", q: "What is the right of quotation?", answer: "Using fragments with author and source.", rubric: [{ t: "Explains quotation", p: 2 }] }], done: [] } },
};
const ODP = "Cytat to fragment cudzego utworu z podaniem autora i źródła, np. w wypracowaniu.";
const zapytania = [];
let siecOff = false; // route() Playwrighta działa też przy setOffline, więc „brak sieci” dla grade-open udajemy sami
const grade = async (r) => {
  if (siecOff) return r.abort("internetdisconnected");
  const body = JSON.parse(r.request().postData()); zapytania.push(body);
  const results = Object.fromEntries(body.items.map((x) => [x.id, { items: x.rubric.map((rb, i) => ({ i, got: rb.p, why: "Masz to." })), missing: "", tip: "" }]));
  r.fulfill({ contentType: "application/json", body: JSON.stringify({ results }) });
};
const run = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("bm-exam-run") || "null"));
const main = (p) => p.locator("main").innerText();
const toasts = (p) => p.evaluate(() => [...document.querySelectorAll(".toast")].map((t) => t.textContent).join(" | "));

// ---------- A + B: test próbny ----------
{
  const p = await page(b, { konto: "platne", w: 375, h: 812, ls: { "mock-docs": JSON.stringify(DOCS) } });
  await p.context().route(/functions\/v1\/grade-open/, grade);
  await p.goto(BASE + "index.html#/exam/" + SID); await p.waitForTimeout(2500);
  await p.locator(".plan-test-row button").first().click(); await p.waitForTimeout(1500);
  await p.click(".sk-gridbtn"); await p.waitForTimeout(300);
  await p.click("button:has-text('Pokaż jako listę')"); await p.waitForTimeout(600);
  const n = await p.locator(".ex-item").count();
  for (let i = 0; i < n; i++) {
    const it = p.locator(".ex-item").nth(i);
    if (await it.locator(".opt").count()) await it.locator(".opt").first().click();
    else if (await it.locator("textarea").count()) await it.locator("textarea").first().pressSequentially(ODP.slice(0, 30), { delay: 5 }).then(() => it.locator("textarea").first().fill(ODP));
  }
  let r = await run(p);
  const openId = r.items.find((x) => x.type !== "abcd")?.id;
  ok("A: odpowiedź otwarta jest w teście i w kopii", r.ans[openId] === ODP && (await p.evaluate(([s, id]) => localStorage.getItem(`skrot:kopia:test:${s}:${id}`), [r.start, openId]))?.includes("Cytat"), { ans: r.ans, openId });
  // odświeżenie w połowie testu
  await p.reload(); await p.waitForTimeout(2500);
  r = await run(p);
  ok("A: po odświeżeniu test trwa i odpowiedzi są", r?.phase === "test" && r.ans[openId] === ODP && Object.values(r.ans).length >= n, r && { phase: r.phase, ans: r.ans });
  // zapis całego testu zgubił tekst (np. pełna pamięć przy ostatnim zapisie) → wraca z kopii
  await p.evaluate((id) => { const x = JSON.parse(localStorage.getItem("bm-exam-run")); x.ans[id] = ""; localStorage.setItem("bm-exam-run", JSON.stringify(x)); }, openId);
  await p.reload(); await p.waitForTimeout(2500);
  await p.goto(BASE + "index.html#/exam/" + SID); await p.waitForTimeout(1500);
  await p.click(".sk-gridbtn").catch(() => {}); await p.waitForTimeout(300);
  await p.click("button:has-text('Pokaż jako listę')").catch(() => {}); await p.waitForTimeout(600);
  const fromRun = (await run(p)).ans[openId], ta = p.locator(".ex-item textarea, .lp textarea");
  const t = (await ta.count()) ? await ta.first().inputValue() : fromRun;
  ok("A: pusty zapis testu → odpowiedź wraca z kopii (do testu i do pola)", fromRun === ODP && t === ODP, { fromRun, t });
  // oddanie bez internetu
  await p.context().setOffline(true); siecOff = true;
  const bar = p.locator(".exam-bar button:has-text('Oddaj test'), button:has-text('Oddaj test')").first();
  if (!(await bar.count())) { await p.click(".sk-gridbtn").catch(() => {}); await p.click("button:has-text('Pokaż jako listę')").catch(() => {}); await p.waitForTimeout(500); }
  await p.locator(".exam-bar button:has-text('Oddaj test'), button:has-text('Oddaj test')").first().click(); await p.waitForTimeout(200);
  await p.locator(".modal button:has-text('Oddaj'), dialog button:has-text('Oddaj')").first().click(); await p.waitForTimeout(1500);
  const off = await main(p);
  r = await run(p);
  ok("B: bez sieci test czeka: „Nie zapisało się, spróbuję jeszcze raz”", /Sprawdzamy odpowiedzi/.test(off) && /Nie zapisało się, spróbuję jeszcze raz/.test(off) && r.aiState === "busy" && r.aiWait === true, { off: off.slice(0, 500), st: r.aiState });
  ok("B: odpowiedzi dalej na urządzeniu", r.ans[openId] === ODP);
  ok("B: AI nic nie dostało (brak sieci)", zapytania.length === 0, zapytania.length);
  zapytania.length = 0;
  await shot(p, "kop-offline-375");
  await p.waitForTimeout(3000);
  ok("B: bez pętli ponowień (nadal czeka, zero zapytań)", zapytania.length === 0 && (await run(p)).aiState === "busy");
  siecOff = false; await p.context().setOffline(false); await p.waitForTimeout(2500);
  r = await run(p);
  const sent = zapytania[0]?.items?.[0]?.studentAnswer || "";
  ok("B: po powrocie sieci AI ocenia te same odpowiedzi", zapytania.length === 1 && sent.includes("Cytat to fragment") && r.aiState === "done" && !r.aiWait, { n: zapytania.length, sent, st: r.aiState });
  ok("B: ekran „Pokaż wynik”", /Pokaż wynik/.test(await main(p)));
  await p.locator("button:has-text('Pokaż wynik')").first().click(); await p.waitForTimeout(800);
  const left = await p.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("skrot:kopia:test:")));
  ok("B: po ocenie kopie testu znikają", left.length === 0, left);
  ok("A/B: bez błędów w konsoli", !p.errors.length, p.errors);
  await p.context().close();
}

// ---------- C: odpowiedź w quizie bez sieci ----------
{
  const p = await page(b, { konto: "platne", ls: { "mock-docs": JSON.stringify(DOCS) } });
  await p.goto(BASE + "index.html#/material/o1"); await p.waitForTimeout(2000);
  await p.getByRole("button", { name: /Quiz/ }).first().click();
  await p.getByRole("button", { name: /Zaczynamy/ }).click(); await p.waitForTimeout(700);
  await p.context().setOffline(true);
  await p.locator(".lp-opts .opt").first().click(); await p.waitForTimeout(800);
  const t = await toasts(p), q = await p.evaluate(() => JSON.parse(localStorage.getItem("skrot:kopia:zapisy") || "[]"));
  ok("C: bez sieci: „Nie zapisało się, spróbuję jeszcze raz”, odpowiedź w kolejce", /Nie zapisało się, spróbuję jeszcze raz/.test(t) && q.length === 1 && q[0].fn === "nauka_rp_odpowiedz", { t, q });
  ok("C: quiz działa dalej (bez białego ekranu)", (await p.locator(".lp-opts .opt").count()) > 0 && !p.errors.length, p.errors);
  await shot(p, "kop-quiz-offline");
  await p.context().setOffline(false); await p.waitForTimeout(1500);
  const after = await p.evaluate(() => [window.__rpc.filter((x) => x.fn === "nauka_rp_odpowiedz").length, JSON.parse(localStorage.getItem("skrot:kopia:zapisy") || "[]").length]);
  const t2 = await toasts(p);
  ok("C: po powrocie sieci zapis poszedł do bazy, kolejka pusta, „Zapisane ✓”", after[0] === 1 && after[1] === 0 && /Zapisane ✓/.test(t2), { after, t2 });
  ok("C: bez błędów w konsoli", !p.errors.length, p.errors);
  await p.context().close();
}

// ---------- D: Zgłoś błąd + kalendarz ----------
{
  const p = await page(b, { konto: "platne", ls: { "mock-docs": JSON.stringify(DOCS) } });
  await p.goto(BASE + "index.html#/material/o1"); await p.waitForTimeout(2000);
  await p.getByRole("button", { name: /Quiz/ }).first().click();
  await p.getByRole("button", { name: /Zaczynamy/ }).click(); await p.waitForTimeout(700);
  await p.locator(".lp-opts .opt").first().click(); await p.waitForTimeout(500);
  const zg = p.locator("button:has-text('Zgłoś błąd')").first();
  if (await zg.count()) {
    await zg.click(); await p.waitForTimeout(300);
    await p.locator("#report-note").fill("Odpowiedź C też jest dobra");
    await p.keyboard.press("Escape"); await p.waitForTimeout(300);
    await zg.click(); await p.waitForTimeout(300);
    const v = await p.locator("#report-note").inputValue();
    ok("D: „Zgłoś błąd”: tekst wraca po zamknięciu okna, z informacją", v === "Odpowiedź C też jest dobra" && /Przywróciliśmy tekst/.test(await p.locator(".modal").innerText()), v);
    await p.locator("button:has-text('Wyślij zgłoszenie')").click(); await p.waitForTimeout(600);
    const left = await p.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("skrot:kopia:zgloszenie:")));
    ok("D: po wysłaniu kopia zgłoszenia znika", left.length === 0, left);
  } else ok("D: przycisk „Zgłoś błąd” w quizie", false, "brak");
  await p.goto(BASE + "index.html#/calendar"); await p.reload(); await p.waitForTimeout(2000);
  const add = p.locator("button:has-text('Mój wpis')").first();
  if (await add.count()) {
    await add.click(); await p.waitForTimeout(300);
    await p.locator("#me-title").fill("Powtórka rozdziału 3");
    await p.locator("#me-note").fill("Strony 40–55");
    await p.reload(); await p.waitForTimeout(2000);
    await p.locator("button:has-text('Mój wpis')").first().click(); await p.waitForTimeout(300);
    const v = [await p.locator("#me-title").inputValue(), await p.locator("#me-note").inputValue()];
    ok("D: kalendarz: po odświeżeniu niezapisany wpis wraca", v[0] === "Powtórka rozdziału 3" && v[1] === "Strony 40–55", v);
    await shot(p, "kop-kalendarz");
    await p.locator(".modal button.btn.primary").first().click(); await p.waitForTimeout(500);
    const left = await p.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("skrot:kopia:kalendarz:")));
    ok("D: po dodaniu kopia znika", left.length === 0, left);
  } else ok("D: przycisk nowego wpisu w kalendarzu", false, (await main(p)).slice(0, 300));
  ok("D: bez błędów w konsoli", !p.errors.length, p.errors);
  await p.context().close();
}
await b.close();
for (const w of wyniki) console.log(w.join(" "));
console.log(`${wyniki.filter((w) => w[0] === "✓").length}/${wyniki.length}`);
