// Tryb „Przygotuj się” (7 etapów): ocena AI, plan z testami wcześniej, plan naprawczy, kazusy, gotowość, sprint, poprawki.
// Na atrapie bazy, z udawaną funkcją grade-open. Uruchom: python3 -m http.server <port> --bind 127.0.0.1 w katalogu repo,
// potem BASE=http://127.0.0.1:<port>/ node docs/gry/test/przygotuj-sie.mjs
import fs from "fs";
import { chromium, page, BASE, OUT } from "./lib.mjs";
const shot = (p, name) => p.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
const b = await chromium.launch();
const wyniki = [];
const ok = (nazwa, warunek, info) => { wyniki.push([warunek ? "✓" : "✗", nazwa, warunek ? "" : JSON.stringify(info)?.slice(0, 500)]); };

const SID = "ochrona-wlasnosci-intelektualnej";
const now = Date.now();
const dkey = (d) => { const x = new Date(now + d * 864e5); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
const quiz = (n, tag) => Array.from({ length: n }, (_, i) => ({ q: `${tag}: question ${i + 1}?`, options: ["A" + i, "B" + i, "C" + i, "D" + i], correct: i % 4, explanation: `Because ${"ABCD"[i % 4]}.` }));
const cards = (n, tag) => Array.from({ length: n }, (_, i) => ({ q: `${tag}: term ${i + 1}`, a: `Definition ${i + 1} of ${tag}` }));
const T = ["Basic principles of intellectual property law", "Introduction to Intellectual Property Protection", "Author's personal and property rights", "Permitted use of works and plagiarism", "Industrial property law basics", "Protection of copyright and related rights"];
const DOCS = {
  materials: Object.fromEntries(T.map((t, i) => ["o" + i, { subjectId: SID, title: t, quizCount: 8, flashcardCount: 4, createdAt: now - (9 - i) * 1e6, v: 2, source: "sylabus" }])),
  materialContent: Object.fromEntries(T.map((t, i) => ["o" + i, { v: 2, tldr: t + ".", quiz: quiz(8, "T" + i), flashcards: cards(4, "T" + i) }])),
  deadlines: { d1: { title: "Kolokwium OWI", subjectId: SID, type: "kolokwium", part: "W", date: dkey(10), approx: true } },
  examBank: { [SID]: { items: [
    { id: "ob1", type: "open", mid: "o3", q: "What is the right of quotation?", ep: ["EP1"], answer: "Using fragments of works with author and source.", rubric: [{ t: "Explains quotation", p: 2 }] },
    { id: "ob2", type: "open", mid: "o2", q: "Name two moral rights of an author.", ep: ["EP1"], answer: "Authorship, integrity.", rubric: [{ t: "Authorship", p: 1 }, { t: "Integrity of the work", p: 1 }] },
  ], done: [] } },
};
const KAZUSY = fs.readFileSync(new URL("../../kazusy/kazusy.json", import.meta.url));

// Udawane grade-open: element 0 = pełne punkty, reszta 0; zapisuje, co przyszło.
const zapytania = [];
let tryb = "ok";
async function grade(r) {
  const body = JSON.parse(r.request().postData()); zapytania.push(body);
  if (tryb === "limit") return r.fulfill({ status: 429, contentType: "application/json", body: JSON.stringify({ code: "limit", message: "Dzienny limit oceny AI (5 testów) jest już wykorzystany. Limit wraca jutro." }) });
  await new Promise((res) => setTimeout(res, 900));
  const results = Object.fromEntries(body.items.map((x) => [x.id, { items: x.rubric.map((rb, i) => ({ i, got: i === 0 ? rb.p : 0, why: i === 0 ? "Masz to." : "Tego brakuje." })), missing: "Brakuje przykładu.", tip: "Dopisz przykład z życia." }]));
  r.fulfill({ contentType: "application/json", body: JSON.stringify({ results, usage: { input_tokens: 1200, output_tokens: 600 } }) });
}
const prog = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("bm-progress-00000000-0000-4000-8000-000000000001") || "{}").data || {});
const run = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("bm-exam-run") || "null"));
async function answerList(p, { open = "Quotation lets you use a fragment with the author and source, e.g. in an essay." } = {}) {
  // Siatka pytań → „Pokaż jako listę” (Etap 7), potem odpowiedzi na liście.
  await p.click(".sk-gridbtn"); await p.waitForTimeout(300);
  ok("siatka pytań ma „Pokaż jako listę”", await p.locator(".lp-sheet button:has-text('Pokaż jako listę'), button:has-text('Pokaż jako listę')").count() > 0);
  await p.click("button:has-text('Pokaż jako listę')"); await p.waitForTimeout(600);
  const items = await p.locator(".ex-item").count();
  for (let i = 0; i < items; i++) {
    const it = p.locator(".ex-item").nth(i);
    if (await it.locator(".opt").count()) await it.locator(".opt").first().click(); // zawsze A: część dobrze, część źle
    else if (await it.locator("textarea").count()) for (const ta of await it.locator("textarea").all()) await ta.fill(open);
  }
  await p.locator(".exam-bar button:has-text('Oddaj test')").click(); await p.waitForTimeout(200);
  await p.locator(".modal button:has-text('Oddaj'), dialog button:has-text('Oddaj')").first().click();
  return items;
}

// ---------- 1. student z pełnym dostępem, telefon 375 px ----------
const p = await page(b, { konto: "platne", w: 375, h: 812, ls: { "mock-docs": JSON.stringify(DOCS) } });
await p.context().route(/functions\/v1\/grade-open/, grade);
await p.goto(BASE + "index.html#/exam/" + SID); await p.waitForTimeout(2500);
await shot(p, "pp-1-plan-375");
const txt = await p.locator("main").innerText();
ok("gotowość bez danych: zachęta do testu diagnostycznego", /Zrób test diagnostyczny, żeby zobaczyć gotowość/.test(txt), txt.slice(0, 400));
ok("przycisk Sprint · 10 min", /Sprint · 10 min/.test(txt));
ok("data szacowana ze źródłem", /źródło: /.test(txt));
ok("student nie widzi „Potwierdź datę”", !/Potwierdź datę/.test(txt));
ok("plan: dziś test diagnostyczny", /Test diagnostyczny · ok\. 10 min/.test(txt));
const planAll = await p.evaluate(() => { document.querySelectorAll("details.plan-more").forEach((d) => (d.open = true)); return document.querySelector(".sk-panel")?.innerText || ""; });
ok("plan: pełny próbny test i test z błędów", /Pełny próbny test/.test(planAll) && /Test z moich błędów/.test(planAll), planAll.slice(0, 900));
ok("najważniejsze tematy: bez „jeszcze nieruszony”", !/jeszcze nieruszony/.test(txt));
ok("szablon OWI z kazusem", /studium przypadku × 1, pytanie otwarte × 3, test wyboru × 10/.test(txt), txt.match(/Próbny test: [^\n]*/)?.[0]);

// ---------- 2. test diagnostyczny z planu ----------
await p.locator(".plan-test-row button").first().click(); await p.waitForTimeout(1500);
let r = await run(p);
ok("diagnostyczny: rodzaj i 10 min", r?.kind === "diag" && r.end - r.start === 10 * 60000, r && { kind: r.kind, min: (r.end - r.start) / 60000 });
ok("diagnostyczny: 5 ABCD + 1 otwarte, ABCD z różnych tematów", r?.items.filter((x) => x.type === "abcd").length === 5 && r.items.filter((x) => x.type !== "abcd").length === 1 && new Set(r.items.filter((x) => x.type === "abcd").map((x) => x.mid)).size === 5, r?.items.map((x) => x.type + ":" + x.mid));
await answerList(p);
await p.waitForTimeout(250);
await shot(p, "pp-2-sprawdzamy-375");
ok("ekran „Sprawdzamy odpowiedzi…”", /Sprawdzamy odpowiedzi/.test(await p.locator("main").innerText()));
await p.waitForTimeout(1500);
await shot(p, "pp-3-ocena-ai-375");
const z = zapytania[0];
ok("grade-open: jedno wywołanie z run i pozycjami (id, question, modelAnswer, rubric, studentAnswer, lang)", zapytania.length === 1 && z.run && z.items.every((x) => x.id && x.question && "modelAnswer" in x && x.rubric.length && x.studentAnswer && x.lang), z);
ok("fiszka/otwarte z kluczem: elementy klucza", z.items.every((x) => x.rubric.length >= 1));
r = await run(p);
ok("wynik AI zapisany w runie (run.ai)", r.ai && Object.keys(r.ai).length === 1 && r.aiState === "done", r && { ai: r.ai, st: r.aiState });
const g = await p.locator("main").innerText();
ok("rubricBox: punkty AI, why, czego brakuje, wskazówka", /Ocena AI według klucza/i.test(g) && /Masz to\./.test(g) && /Czego brakuje:\s*Brakuje przykładu\./.test(g) && /Wskazówka:\s*Dopisz przykład/.test(g), g.slice(g.search(/ocena ai/i), g.search(/ocena ai/i) + 600));
// odświeżenie nie wywołuje oceny drugi raz
await p.reload(); await p.waitForTimeout(2500);
ok("odświeżenie nie ocenia drugi raz", zapytania.length === 1, zapytania.length);
// Nie zgadzam się
await p.locator("button:has-text('Nie zgadzam się')").first().click(); await p.waitForTimeout(400);
r = await run(p);
const rpc = await p.evaluate(() => (window.__rpc || []).map((x) => x.fn || x[0] || x.name || x));
ok("„Nie zgadzam się”: appeal w runie i ręczne pola", Object.values(r.appeal || {}).some(Boolean) && await p.locator(".rub-row input[type=checkbox]").count() > 0, r.appeal);
ok("odwołanie wysłane (nauka_ocena_odwolanie)", JSON.stringify(rpc).includes("nauka_ocena_odwolanie"), rpc.slice(-5));
await shot(p, "pp-4-odwolanie-375");
await p.locator("button:has-text('Pokaż wynik')").first().click(); await p.waitForTimeout(900);
await shot(p, "pp-5-wynik-375");
const res = await p.locator("main").innerText();
ok("wynik: „Co poprawić” z lekcją i testem z błędów", /Co poprawić/.test(res) && /Test tylko z moich błędów/.test(res), res.slice(0, 800));
ok("wynik: diagnostyczny bez efektów uczenia się", !/według efektów uczenia się/.test(res));
const pr = await prog(p);
const att = pr.exams?.[SID + "-W"]?.att?.slice(-1)[0];
ok("podejście: kind diag, wrong[], appeal, ai, ep pusty", att?.kind === "diag" && Array.isArray(att.wrong) && att.wrong.length > 0 && att.appeal?.length === 1 && att.ai === 1 && !Object.keys(att.ep || {}).length, att);
const srsKeys = Object.keys(pr.srs || {});
ok("błędy w Powtórkach (SRS) + treść kart z testu", srsKeys.length > 0 && Object.keys(pr.exCards || {}).every((k) => srsKeys.includes(k)) && Object.keys(pr.exCards || {}).length > 0, { srs: srsKeys, ex: Object.keys(pr.exCards || {}) });
ok("wynik mówi, ile trafiło do Powtórek", /trafiły do Powtórek jako fiszki: \d+/.test(res));

// ---------- 3. test z błędów od razu z wyniku ----------
const srsBefore = srsKeys.length;
await p.locator("button:has-text('Test tylko z moich błędów')").click(); await p.waitForTimeout(1500);
r = await run(p);
ok("test z błędów: błędne pytania + nowe z tych tematów", r?.kind === "fix" && (att?.wrong || [1]).every((id) => r.items.some((x) => x.id === id)) && r.items.length > (att?.wrong?.length ?? 99), r && { ids: r.items.map((x) => x.id), wrong: att?.wrong });
await answerList(p); await p.waitForTimeout(2000);
await p.locator("button:has-text('Pokaż wynik')").first().click(); await p.waitForTimeout(800);
const pr2 = await prog(p);
ok("kolejny test: bez duplikatów kart w Powtórkach", Object.keys(pr2.srs).length === new Set(Object.keys(pr2.srs)).size && Object.keys(pr2.srs).length >= srsBefore);
await p.locator("button:has-text('Wróć do planu')").click(); await p.waitForTimeout(900);

// ---------- 4. gotowość po teście + sprint ----------
await p.evaluate(() => document.querySelectorAll("details.plan-more").forEach((d) => (d.open = true)));
const plan2 = await p.locator("main").innerText();
const weakTp = Object.entries((await prog(p)).exams[SID + "-W"].att.slice(-1)[0].tp).filter(([, [g, m]]) => m && g / m < 0.5).length;
ok("gotowość: przewidywany wynik i próg", /Przewidywany wynik:\s*\d+%\s*· próg 50%/.test(plan2), plan2.slice(0, 600));
ok("gotowość: najwięcej zyskasz na", /Najwięcej zyskasz na: /.test(plan2));
ok("plan: po teście nie ma już diagnostycznego", !/Test diagnostyczny · ok\. 10 min/.test(plan2.split("Plan dzień po dniu")[1] || ""));
ok("plan: słabe tematy oznaczone „do poprawy” (gdy są)", weakTp ? /do poprawy/.test(plan2) : true, weakTp);
await shot(p, "pp-6-gotowosc-375");
const tone = await p.locator(".ready-n .chip").getAttribute("class");
ok("gotowość: kolor wg progu", /bad|sun|good/.test(tone), tone);
await p.locator("button:has-text('Sprint · 10 min')").click(); await p.waitForTimeout(1500);
r = await run(p);
ok("sprint: 4 ABCD + 1 otwarte, 10 min", r?.kind === "sprint" && r.items.filter((x) => x.type === "abcd").length === 4 && r.items.filter((x) => x.type !== "abcd").length === 1 && r.end - r.start === 600000, r && r.items.map((x) => x.type));
const recentIds = new Set((await prog(p)).exams[SID + "-W"].att.slice(-2).flatMap((a) => a.ids));
ok("sprint: bez pytań z ostatnich podejść", r.items.filter((x) => recentIds.has(x.id)).length === 0, r.items.map((x) => x.id));

// ---------- 5. limit / błąd AI → samoocena ----------
tryb = "limit";
await answerList(p, { open: "" + "Some answer." }); await p.waitForTimeout(1200);
const lim = await p.locator("main").innerText();
ok("limit AI: komunikat i ręczne zaznaczanie", /Limit wraca jutro/.test(lim) && await p.locator(".rub-row input[type=checkbox]").count() > 0, lim.slice(0, 500));
r = await run(p);
ok("limit AI: run.aiState = off", r.aiState === "off");
await p.locator("button:has-text('Pokaż wynik')").first().click(); await p.waitForTimeout(700);
const sprintAtt = (await prog(p)).exams[SID + "-W"].att.slice(-1)[0];
ok("sprint: liczy się do tematów, nie do efektów", sprintAtt.kind === "sprint" && Object.keys(sprintAtt.tp).length > 0 && !Object.keys(sprintAtt.ep).length, sprintAtt);
ok("brak błędów JS (student)", !p.errors.length, p.errors);
await p.context().close();

// ---------- 6. stary zapis runu (bez kind, marks jako true) dalej działa ----------
const old = { key: SID + "-W", sid: SID, part: "W", phase: "grade", tmpl: { min: 45, pass: 50 }, start: now - 3e6, end: now - 1e6, submitted: now - 2e6,
  items: [{ id: "ob1", type: "open", mid: "o3", q: "What is the right of quotation?", answer: "x", rubric: [{ t: "Explains quotation", p: 2 }], n: 1, p: null },
    { id: "q:o1:0", type: "abcd", mid: "o1", q: "Q?", options: ["a", "b", "c", "d"], correct: 0, n: 2, p: 1 }], ans: { ob1: "answer", "q:o1:0": 0 }, marks: { ob1: [true] }, flags: {} };
const p2 = await page(b, { konto: "platne", w: 1280, h: 900, ls: { "mock-docs": JSON.stringify(DOCS), "bm-exam-run": JSON.stringify(old) } });
await p2.goto(BASE + "index.html#/exam/" + SID); await p2.waitForTimeout(2500);
const t2 = await p2.locator("main").innerText();
ok("stary run: samoocena z checkboxem i wynikiem 3/3", /3\/3 pkt/.test(t2) && await p2.locator(".rub-row input:checked").count() === 1, t2.slice(0, 300));
await p2.locator("button:has-text('Pokaż wynik')").first().click(); await p2.waitForTimeout(800);
ok("stary run: wynik 100% i zapis bez kind", /100%/.test(await p2.locator("main").innerText()) && !(await prog(p2)).exams[SID + "-W"].att.slice(-1)[0].kind);
await p2.locator("button:has-text('Wróć do planu')").click(); await p2.waitForTimeout(800);
await shot(p2, "pp-7-plan-1280");
ok("brak błędów JS (stary run, 1280)", !p2.errors.length, p2.errors);
await p2.context().close();

// ---------- 7. starosta: potwierdzenie daty, Panel AI (klucze, kazusy, zakres a sylabus) ----------
const prompty = [];
const p3 = await page(b, { konto: "starosta", w: 1280, h: 900, ls: { "mock-docs": JSON.stringify(DOCS), "bm-starosta": "1" } });
await p3.context().route(/functions\/v1\/claude/, async (rq) => { const { prompt } = JSON.parse(rq.request().postData()); prompty.push(prompt);
  if (!prompt.includes("ITEMS: ")) return rq.fulfill({ contentType: "application/json", body: JSON.stringify({ json: {} }) });
  const items = JSON.parse(prompt.split("ITEMS: ")[1].split("\nReply")[0]);
  rq.fulfill({ contentType: "application/json", body: JSON.stringify({ json: { items: items.map((x) => ({ n: x.n, rubric: [{ t: "Central idea of " + x.n, p: 2 }, { t: "Example", p: 1 }] })) } }) }); });
await p3.goto(BASE + "index.html#/exam/" + SID); await p3.waitForTimeout(2500);
ok("starosta widzi „Potwierdź datę”", await p3.locator("button:has-text('Potwierdź datę')").count() === 1);
await p3.locator("button:has-text('Potwierdź datę')").click(); await p3.waitForTimeout(800);
ok("po potwierdzeniu chip znika", !/Data szacowana/i.test(await p3.locator(".sk-hero").innerText()));
await p3.goto(BASE + "index.html#/ai"); await p3.waitForTimeout(2000);
await p3.selectOption("select[aria-label='Przedmiot']", SID); await p3.waitForTimeout(1200);
for (const d of await p3.locator("details.tmpl").all()) await d.evaluate((e) => (e.open = true));
const ai = await p3.locator("main").innerText();
ok("Panel AI: lepsze klucze (1 pytanie z kluczem z jednej pozycji)", /Lepsze klucze oceniania · 1 pytanie/.test(ai), ai.match(/Lepsze klucze[^\n]*/)?.[0]);
await p3.locator("button:has-text('Pokaż próbkę (5 pytań)')").click(); await p3.waitForTimeout(1200);
ok("próbka kluczy pokazana, nic nie zapisane", /Central idea of 0/.test(await p3.locator("main").innerText()));
await p3.locator("button:has-text('Zapisz próbkę i popraw resztę')").click(); await p3.waitForTimeout(1200);
const bank = await p3.evaluate((sid) => { const x = JSON.parse(localStorage.getItem("mock-docs")); return x; }, SID);
await p3.locator("input[type=file][accept*=json]").last().setInputFiles({ name: "kazusy.json", mimeType: "application/json", buffer: KAZUSY });
await p3.waitForTimeout(600);
for (const d of await p3.locator("details.tmpl").all()) await d.evaluate((e) => (e.open = true));
ok("kazusy: plik wczytany, temat dopasowany do materiału", /owi-1-essay-and-photocopies/.test(await p3.locator("main").innerText()) && /Permitted use of works and plagiarism/.test(await p3.locator("main").innerText()));
const brak = await p3.locator("details.tmpl .chip.bad:has-text('brak materiału')").count();
ok("kazusy: każdy z 6 kazusów OWI dopasowany do materiału", brak === 0, brak);
await p3.locator("button:has-text('Zapisz 6 kazusów w banku')").click(); await p3.waitForTimeout(1000);
await p3.locator("button:has-text('Sprawdź')").first().click(); await p3.waitForTimeout(600);
const chk = await p3.locator("main").innerText();
ok("zakres a sylabus: dubel Introduction ↔ Basic principles", /Basic principles of intellectual property law ↔ Introduction to Intellectual Property Protection|Introduction to Intellectual Property Protection ↔ Basic principles of intellectual property law/.test(chk) && !/Industrial property law basics ↔/.test(chk), chk.match(/dubel\?[^\n]*/g));
await shot(p3, "pp-8-panel-ai-1280");
const zakres = await p3.evaluate(() => window.skrotZakresSylabus());
ok("skrotZakresSylabus() zwraca listę tekstową", /zakres \d+ tematów, sylabus \d+/.test(zakres), zakres.slice(0, 300));
fs.writeFileSync(OUT + "/zakres-atrapa.txt", zakres);
// kazus w teście: pełny test OWI ma sekcję case z kazusem z banku
await p3.goto(BASE + "index.html#/exam/" + SID); await p3.waitForTimeout(2000);
await p3.locator("button.sk-start").click(); await p3.waitForTimeout(1500);
r = await run(p3);
ok("pełny test OWI: kazus z banku (2–3 podpunkty, EP3)", r?.items.some((x) => x.type === "case" && x.sub.length >= 2 && x.ep.includes("EP3")), r?.items.map((x) => x.type));
ok("brak błędów JS (starosta)", !p3.errors.length, p3.errors);
// ---------- 8. wersja angielska ----------
const p4 = await page(b, { konto: "platne", lang: "en", w: 375, h: 812, ls: { "mock-docs": JSON.stringify(DOCS) } });
await p4.goto(BASE + "index.html#/exam/" + SID); await p4.waitForTimeout(3000);
const en = await p4.locator("main").innerText();
ok("EN: gotowość, Sprint, źródło daty, wiersz testu w planie", /Take the diagnostic test to see how ready you are/.test(en) && /Sprint · 10 min/.test(en) && /source: /.test(en) && /Diagnostic test · about 10 min/.test(en), en.slice(0, 900));
ok("EN: bez polskich nowych napisów", !/Przewidywany|Zrób test diagnostyczny|Test diagnostyczny|źródło:|Pełny próbny test|Test z moich błędów/.test(en), en.match(/.*(Przewidywany|diagnostyczny|źródło|Pełny próbny|moich błędów).*/g));
await shot(p4, "pp-9-en-375");
await b.close();

for (const w of wyniki) console.log(w[0], w[1], w[2] ? "→ " + w[2] : "");
const zle = wyniki.filter((w) => w[0] === "✗").length;
console.log(`\n${wyniki.length - zle}/${wyniki.length} OK · zrzuty: ${OUT}`);
process.exit(zle ? 1 : 0);
