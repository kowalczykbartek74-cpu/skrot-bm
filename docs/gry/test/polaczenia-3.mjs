// Połączenia, etap 3: plan „Przygotuj się” i własne daty zaliczeń widoczne wszędzie.
// Zegar: środa 4.11.2026, 12:00. OWI: szacowane kolokwium starosty 23.11, osoba wpisuje własną datę 30.11.
// Uruchom: python3 -m http.server 8790, potem BASE=http://127.0.0.1:8790/ node docs/gry/test/polaczenia-3.mjs
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 700)]);
const CZAS = new Date("2026-11-04T12:00:00+01:00");
const UID = "00000000-0000-4000-8000-000000000001";
const OWI = "ochrona-wlasnosci-intelektualnej";
const now = Date.parse("2026-10-20T10:00:00+02:00");
const quiz = (tag) => Array.from({ length: 10 }, (_, i) => ({ q: `${tag} ${i}?`, options: ["A", "B", "C", "D"], correct: i % 4 }));
const cards = (tag) => [1, 2, 3].map((i) => ({ q: `${tag}: pojęcie ${i}`, a: `Definicja ${i}` }));
const MAT = {}, CONTENT = {};
[["owi1", "Basic principles of IP law", "W1"], ["owi2", "Author's rights", "W2"], ["owi5", "Industrial property: patents and trademarks", "W5"]].forEach(([id, t, ref], i) => {
  MAT[id] = { subjectId: OWI, kind: "lesson", order: i + 1, unit: 1, unitTitle: "IP", sylRef: ref, title: t, quizCount: 10, flashcardCount: 3, createdAt: now - i * 1e5, v: 2 };
  CONTENT[id] = { v: 2, summary: "x", quiz: quiz(id), flashcards: cards(id) };
});
MAT.mak1 = { subjectId: "makroekonomia", title: "Inflacja i PKB", quizCount: 10, flashcardCount: 3, createdAt: now, v: 2 }; CONTENT.mak1 = { v: 2, summary: "x", quiz: quiz("mak"), flashcards: cards("mak") };
const DL = { "d-owi": { subjectId: OWI, type: "kolokwium", title: "Kolokwium z OWI", date: "2026-11-23", approx: true, createdAt: now } };
const prog = { [UID]: { group: "C112", sub: "A", srs: { "mak1:x1": [2, 300], "mak1:x2": [2, 300] }, quiz: { owi5: { best: 2, last: 2, total: 10, at: now } } } };
const LS = { "bm-group": "C112", "bm-sub": "A", "bm-calmode": "month", "mock-progress": JSON.stringify(prog),
  "mock-docs": JSON.stringify({ materials: MAT, materialContent: CONTENT, deadlines: DL }) };
const getProg = (p) => p.evaluate((u) => JSON.parse(localStorage.getItem("mock-progress") || "{}")[u] || {}, UID);

const p = await page(b, { konto: "platne", ls: LS });
await p.clock.setFixedTime(CZAS);
p.on("dialog", (d) => d.accept());
await p.goto(BASE + "index.html#/terms"); await p.waitForTimeout(2500);
const t0 = await p.locator("article.tl", { hasText: "OWI" }).first().innerText().catch(() => "");
ok("przed: Terminy OWI 23 lis, data szacowana", /23 lis/.test(t0) && /Data szacowana/i.test(t0), t0);

// ---- własna data w Przygotuj się
await p.goto(BASE + `index.html#/exam/${OWI}`); await p.waitForTimeout(1200);
await p.locator('input[type=date][aria-label="Data zaliczenia"]').fill("2026-11-30"); await p.locator('input[type=date][aria-label="Data zaliczenia"]').dispatchEvent("change"); await p.waitForTimeout(800);
const hero = await p.locator(".sk-exam").innerText();
ok("plan: 26 dni do 30.11", /26/.test(hero) && /30 lis/.test(hero), hero.slice(0, 300));
await p.goto(BASE + "index.html#/terms"); await p.waitForTimeout(900);
const t1 = await p.locator("article.tl", { hasText: "OWI" }).allInnerTexts();
ok("Terminy: OWI 30 lis z „Twoja data”, bez daty szacowanej", t1.length === 1 && /30 lis/.test(t1[0]) && /Twoja data/i.test(t1[0]) && !/Data szacowana/i.test(t1[0]), t1);
await p.goto(BASE + "index.html#/calendar"); await p.waitForTimeout(900);
const cell = (d) => p.locator(".cal .day:not(.out)").filter({ has: p.locator(".num", { hasText: new RegExp(`^${d}$`) }) }).first();
const c30 = await cell(30).innerText(), c23 = await cell(23).innerText();
ok("Kalendarz: zaliczenie OWI 30.11, nie 23.11", /Ochrona własności|OWI/.test(c30) && !/Ochrona własności/.test(c23), { c30, c23 });
const c4 = await cell(4).innerText();
ok("Kalendarz: dziś dzień planu (📘 OWI)", /📘 OWI/.test(c4), c4);
await cell(4).click(); await p.waitForTimeout(300);
const selDay = await p.locator("section.hub .panel").first().innerText();
ok("Kalendarz: wpis „Plan nauki” w wybranym dniu", /Plan nauki/i.test(selDay) && /OWI/.test(selDay), selDay);
await p.locator("section.hub .panel").first().locator("button.myev.plan").first().click(); await p.waitForTimeout(500);
ok("dotknięcie otwiera plan OWI", /#\/exam\/ochrona/.test(p.url()), p.url());
// ---- Dziś: krok planu, fiszki jako druga karta
await p.goto(BASE + "index.html#/"); await p.waitForTimeout(1200);
const now1 = await p.locator(".sk-now").innerText();
ok("Dziś: „Dziś według planu: OWI · … · ok. N min”", /Dziś według planu: OWI · .+ · ok\. \d+ min/.test(now1) && /Twoja data/i.test(now1), now1);
ok("Dziś: druga karta z fiszkami", /Powtórz 2 fiszki/.test(await p.locator(".now-2").innerText().catch(() => "")), await p.locator("main").innerText().then((x) => x.slice(0, 600)));
await shot(p, "polaczenia3-dzis");
await p.waitForTimeout(3200);
const pr1 = await getProg(p);
ok("postęp: własna data i dni planu do kalendarza w telefonie", pr1.exams?.[`${OWI}-W`]?.date === "2026-11-30" && pr1.exams?.[`${OWI}-W`]?.planAt && (pr1.planDays || []).some((x) => x.date === "2026-11-04" && x.sid === OWI), { exams: pr1.exams, planDays: (pr1.planDays || []).slice(0, 2) });

// ---- Mój wpis: kolokwium z Makroekonomii
await p.goto(BASE + "index.html#/calendar"); await p.waitForTimeout(700);
await p.getByRole("button", { name: "+ Mój wpis" }).click(); await p.waitForTimeout(300);
await p.locator(".modal").getByRole("button", { name: "Zaliczenie / kolokwium" }).click();
await p.locator("#me-subject").selectOption("makroekonomia"); await p.waitForTimeout(150);
const partSeg = await p.locator(".modal .field", { hasText: "Część przedmiotu" }).innerText().catch(() => "");
await p.locator("#me-date").fill("2026-12-02");
await p.locator(".modal").getByRole("button", { name: "Dodaj" }).click(); await p.waitForTimeout(3200);
const pr2 = await getProg(p);
const mk = Object.entries(pr2.exams || {}).find(([k]) => k.startsWith("makroekonomia-"));
ok("Mój wpis typu kolokwium ustawia datę zaliczenia (jedno miejsce)", mk?.[1]?.date === "2026-12-02" && !(pr2.myEvents || []).some((e) => e.date === "2026-12-02"), { mk, my: pr2.myEvents, partSeg });
await p.goto(BASE + "index.html#/terms"); await p.waitForTimeout(800);
const tm = await p.locator("article.tl", { hasText: "Makroekonomia" }).allInnerTexts();
ok("Terminy: Makroekonomia 2 gru, Twoja data", tm.some((x) => /2 gru/.test(x) && /Twoja data/i.test(x)), tm);
ok("bez błędów w konsoli", !p.errors.length, p.errors);

// ---- EN + 375 px
const en = await page(b, { konto: "platne", lang: "en", w: 375, h: 800, ls: { ...LS, "mock-progress": JSON.stringify({ [UID]: { ...pr2 } }) } });
await en.clock.setFixedTime(CZAS);
await en.goto(BASE + "index.html#/"); await en.waitForTimeout(2500);
const nowEn = await en.locator(".sk-now").innerText().catch(() => "");
ok("EN: Today's plan + Your date", /Today's plan: /.test(nowEn) && /Your date/i.test(nowEn) && !/według planu/.test(nowEn), nowEn);
ok("375 px: bez poziomego przewijania", (await en.evaluate(() => document.documentElement.scrollWidth)) <= 375, "");
await en.goto(BASE + "index.html#/calendar"); await en.waitForTimeout(900);
ok("EN: kalendarz bez błędów, legenda Study plan", /Study plan/.test(await en.locator("main").innerText()) && !en.errors.length, en.errors);
await shot(en, "polaczenia3-en");

await b.close();
for (const w of wyniki) console.log(w.join(" "));
const bad = wyniki.filter((w) => w[0] === "✗").length;
console.log(`\n${wyniki.length - bad}/${wyniki.length}`);
process.exit(bad ? 1 : 0);
