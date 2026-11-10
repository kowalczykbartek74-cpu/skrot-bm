// Odrabianie, zastępstwa i zmiany godziny z ogłoszeń w Teams (Narzędzia starosty → Odwołania z Teams).
// Zegar: czwartek 5.11.2026, 12:00. Ogłoszenie dr Gąsior: C112 odrabia ćwiczenia 9.11 8:15–9:45 (s. 003), wykład dla
// wszystkich 12.11 12:00–13:30 (s. 044). Do tego zastępstwo na Prawie 17.11 (dr Anna Nowak).
// Uruchom: python3 -m http.server 8790 (w katalogu repo), potem BASE=http://127.0.0.1:8790/ node docs/gry/test/polaczenia-odrabianie.mjs
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 900)]);
const CZAS = new Date("2026-11-05T12:00:00+01:00");
const be = { title: "Ekonomia biznesu: odrabianie zajęć", kind: "info", subjectId: "ekonomia-biznesu", groups: [],
  summary: "Dr Gąsior podała terminy odrabiania zajęć odwołanych 26–27.10.",
  details: ["C112: 9.11, 8:15–9:45, sala 003", "Wykład dla wszystkich grup: 12.11, 12:00–13:30, sala 044", "Zwykłe zajęcia 9–10.11 odbywają się normalnie"],
  source: { team: "BE C 112 2026/2027", author: "dr Aleksandra Gąsior", postedAt: Date.parse("2026-10-26T13:46:00+01:00") }, createdAt: Date.parse("2026-11-05T07:45:00+01:00") };
const law = { title: "Prawo: zastępstwo 17.11", kind: "info", subjectId: "prawo", groups: [], summary: "Wykład z Prawa 17.11 poprowadzi dr Anna Nowak.",
  source: { team: "Law (prawo) BM", author: "dr Małgorzata Szymszon", postedAt: Date.parse("2026-11-05T09:00:00+01:00") }, createdAt: Date.parse("2026-11-05T09:05:00+01:00") };
const LS = { "bm-group": "C112", "bm-sub": "A", "bm-calmode": "month" };
const tasks = { tbe: be, tlaw: law };

async function dayBox(p, day) {
  await p.goto(BASE + "index.html#/calendar"); await p.waitForTimeout(900);
  await p.locator(".cal .day:not(.out)").filter({ has: p.locator(".num", { hasText: new RegExp(`^${day}$`) }) }).first().click(); await p.waitForTimeout(300);
  return p.locator("section.hub .panel", { has: p.locator("h2", { hasText: /^(Zajęcia|Classes)$/ }) });
}

// ---- starosta
const s = await page(b, { konto: "starosta", ls: { ...LS, "bm-starosta": "1", "mock-docs": JSON.stringify({ tasks }) } });
await s.clock.setFixedTime(CZAS);
await s.goto(BASE + "index.html#/odwolania"); await s.waitForTimeout(2500);
const pendBox = s.locator("section.panel", { has: s.locator("h2", { hasText: "Do sprawdzenia" }) });
const pend = await pendBox.innerText();
ok("Do sprawdzenia: odrabianie z Ekonomii biznesu", /Ekonomia biznesu: odrabianie/.test(pend) && /C112 · nowy termin 9\.11 8:15, s\. 003 · Ekonomia biznesu/.test(pend) && /C113 · nowy termin 12\.11 12:00, s\. 044/.test(pend), pend);
ok("Do sprawdzenia: zastępstwo na Prawie", /Prawo: zastępstwo/.test(pend) && /C112 · przeniesione 17\.11 8:15 · Prawo/.test(pend) && /C112 · nowy termin 17\.11 8:15/.test(pend), pend);
// Popraw → okno z polem nowych terminów
await pendBox.locator(".odw-card", { hasText: "Ekonomia biznesu" }).getByRole("button", { name: "Popraw" }).click(); await s.waitForTimeout(300);
const ta = s.locator(".modal textarea");
const taTxt = await ta.inputValue().catch(() => "");
ok("okno: terminy w polu tekstowym", (await ta.isVisible()) && /C112 9\.11 8:15–9:45 s\. 003/.test(taTxt) && /wszystkie grupy wykład 12\.11 12:00–13:30 s\. 044/.test(taTxt), taTxt);
ok("okno: zaznaczone Odrabianie / zastępstwo", (await s.locator(".modal [aria-pressed=true]", { hasText: "Odrabianie / zastępstwo" }).count()) === 1, "");
await ta.fill("C112 ćwiczenia 9.11 8:15–9:45 s. 003\nwszystkie grupy wykład 12.11 12:00–13:30 s. 044"); await s.waitForTimeout(200);
const prev = await s.locator(".modal .odw-prev").innerText();
ok("okno: podgląd po poprawce", /C112 · nowy termin 9\.11 8:15, s\. 003/.test(prev) && !/Ogłoszenie nie mówi jasno/.test(prev), prev);
await s.locator(".modal").getByRole("button", { name: "Zatwierdź" }).click(); await s.waitForTimeout(600);
// zastępstwo zatwierdzam od razu z paska
await s.locator("section.panel", { has: s.locator("h2", { hasText: "Do sprawdzenia" }) }).locator(".odw-card", { hasText: "Prawo" }).getByRole("button", { name: "Zatwierdź" }).click(); await s.waitForTimeout(600);
const doc = await s.evaluate(async () => (await (await window.claude.use("db")).doc("meta/odwolania").get()).data());
const items = Object.values(doc?.items || {}), iBe = items.find((x) => x.tid === "tbe"), iLaw = items.find((x) => x.tid === "tlaw");
ok("zapis: odrabianie (kind makeup, terminy, z dla grup)", iBe?.kind === "makeup" && iBe.slots?.length === 2 && iBe.z?.C112?.some((x) => x.type === "extra" && x.date === "2026-11-09" && x.start === "8:15" && x.k === "CW" && x.r === "s. 003")
  && iBe.z?.C111?.some((x) => x.type === "extra" && x.date === "2026-11-12" && x.k === "W"), iBe);
ok("zapis: zastępstwo (przeniesione + nowe z prowadzącym)", iLaw?.z?.C112?.some((x) => x.type === "cancel" && x.moved && x.date === "2026-11-17") && iLaw.z.C112.some((x) => x.type === "extra" && x.kind === "change" && x.p === "dr Anna Nowak"), iLaw);
await shot(s, "odrabianie-starosta");
// pasek w „Ostatnio dodane” na Dziś (przed zatwierdzeniem)
const s2 = await page(b, { konto: "starosta", ls: { ...LS, "bm-starosta": "1", "mock-docs": JSON.stringify({ tasks }) } });
await s2.clock.setFixedTime(CZAS);
await s2.goto(BASE + "index.html#/"); await s2.waitForTimeout(2500);
const strips = await s2.locator(".odw-strip").allInnerTexts();
ok("Dziś: pasek „Odrabianie albo zmiana terminu?”", strips.some((x) => /Odrabianie albo zmiana terminu\?/.test(x) && /Ekonomia biznesu/.test(x)), strips);

// ---- student C112
const p = await page(b, { konto: "platne", ls: { ...LS, "mock-docs": JSON.stringify({ tasks, meta: { odwolania: doc } }) } });
await p.clock.setFixedTime(CZAS);
await p.goto(BASE + "index.html#/"); await p.waitForTimeout(2500);
let box = await dayBox(p, 9);
let t = await box.innerText();
ok("Kalendarz 9.11: dodatkowe ćwiczenia z Ekonomii biznesu 8:15, s. 003, Odrabianie", /8:15/.test(t) && /Ekonomia biznesu/.test(t) && /s\. 003/.test(t) && /Odrabianie/i.test(t), t);
ok("Kalendarz 9.11: zwykłe zajęcia zostają (bez przekreśleń)", (await box.locator(".cls.is-off").count()) === 0, t);
box = await dayBox(p, 12); t = await box.innerText();
ok("Kalendarz 12.11: wykład 12:00, s. 044", /12:00/.test(t) && /Ekonomia biznesu/.test(t) && /s\. 044/.test(t), t);
box = await dayBox(p, 17); t = await box.innerText();
ok("Kalendarz 17.11: Prawo — Zastępstwo: dr Anna Nowak", /Zastępstwo/.test(t) && /dr Anna Nowak/.test(t), t);
await shot(p, "odrabianie-kalendarz");
ok("bez błędów w konsoli", !s.errors.length && !p.errors.length, [...s.errors, ...p.errors]);

// ---- EN
const en = await page(b, { konto: "platne", lang: "en", ls: { ...LS, "mock-docs": JSON.stringify({ tasks, meta: { odwolania: doc } }) } });
await en.clock.setFixedTime(CZAS);
box = await dayBox(en, 17); t = await box.innerText();
ok("EN 17.11: Substitution", /Substitution/.test(t) && !/Zastępstwo/.test(t), t);
const se = await page(b, { konto: "starosta", lang: "en", ls: { ...LS, "bm-starosta": "1", "mock-docs": JSON.stringify({ tasks }) } });
await se.clock.setFixedTime(CZAS);
await se.goto(BASE + "index.html#/odwolania"); await se.waitForTimeout(2500);
const enTxt = await se.locator("main").innerText();
ok("EN starosta: make-up / substitution texts", /substitutions/.test(enTxt) && /new times: 17\.11/.test(enTxt) && !/nowe terminy/.test(enTxt), enTxt.slice(0, 900));

// ---- telefon 375 px
const m = await page(b, { konto: "starosta", w: 375, h: 760, ls: { ...LS, "bm-starosta": "1", "mock-docs": JSON.stringify({ tasks }) } });
await m.clock.setFixedTime(CZAS);
await m.goto(BASE + "index.html#/odwolania"); await m.waitForTimeout(2500);
await m.getByRole("button", { name: "Popraw" }).first().click(); await m.waitForTimeout(300);
const sw = await m.evaluate(() => document.documentElement.scrollWidth);
ok("375 px: okno bez poziomego przewijania", sw <= 375, sw);
await m.locator(".modal").getByRole("button", { name: "Odwołanie", exact: true }).click(); await m.waitForTimeout(100);
ok("Odwołanie: pole terminów schowane", !(await m.locator(".modal textarea").isVisible()), "");
await shot(m, "odrabianie-telefon");
ok("bez błędów (EN, telefon)", !en.errors.length && !se.errors.length && !m.errors.length, [...en.errors, ...se.errors, ...m.errors]);

await b.close();
for (const w of wyniki) console.log(w.join(" "));
const bad = wyniki.filter((w) => w[0] === "✗").length;
console.log(`\n${wyniki.length - bad}/${wyniki.length}`);
process.exit(bad ? 1 : 0);
