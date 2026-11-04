// Połączenia, etap 1: odwołanie z ogłoszenia w Teams działa jak komunikat dziekanatu.
// Zegar: środa 4.11.2026, 12:00. C112 lab A: 3.11 ćwiczenia z Logistyki 10:00, 4.11 wykład z Logistyki 8:15.
// Uruchom: python3 -m http.server 8790 (w katalogu repo), potem BASE=http://127.0.0.1:8790/ node docs/gry/test/polaczenia-1.mjs
import fs from "fs";
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 700)]);
const CZAS = new Date("2026-11-04T12:00:00+01:00");
const SYL = JSON.parse(fs.readFileSync(new URL("../../../sylabus.json", import.meta.url)));
const log = SYL.courses.find((c) => c.pl === "Logistyka");
const short = (t) => t.replace(/\.$/, "");
// podsumowania „5 min” do każdego tematu z sylabusa Logistyki (tak jak robi je starosta)
const po = {};
for (const k of ["W", "CW"]) log.topics[k].forEach((t, i) => { po[`logistyka~${k}~${i}`] = { sid: "logistyka", k, t: short(t.t), syl: true, at: 1 }; });
const ogl = { title: "Odwołane wykłady z Logistyki 3 i 4.11", kind: "info", subjectId: "logistyka", groups: [], summary: "Zajęcia z Logistyki 3 i 4.11 są odwołane. Temat przejdzie na kolejne zajęcia.",
  source: { team: "Logistics 2026/27", author: "dr Jakub Dowejko", postedAt: Date.parse("2026-11-02T18:00:00+01:00") }, createdAt: Date.parse("2026-11-02T18:05:00+01:00") };
const LS = { "bm-group": "C112", "bm-sub": "A", "bm-calmode": "month" };

async function cal(p, day) {
  await p.goto(BASE + "index.html#/calendar"); await p.waitForTimeout(900);
  await p.locator(".cal .day:not(.out)").filter({ has: p.locator(".num", { hasText: new RegExp(`^${day}$`) }) }).first().click(); await p.waitForTimeout(300);
  return p.locator("section.hub .panel", { has: p.locator("h2", { hasText: /^(Zajęcia|Classes)$/ }) });
}
async function topicOn(p, day) {
  const box = await cal(p, day);
  const row = box.locator(".cls", { hasText: "Logistyka" }).first();
  return (await row.count()) ? row.innerText() : "";
}

// ---- przed zatwierdzeniem (student)
const before = await page(b, { konto: "platne", ls: { ...LS, "mock-docs": JSON.stringify({ tasks: { t1: ogl }, meta: { po: { items: po } } }) } });
await before.clock.setFixedTime(CZAS);
await before.goto(BASE + "index.html#/"); await before.waitForTimeout(2500);
const t411 = await topicOn(before, 4), t1811 = await topicOn(before, 18);
ok("przed: 4.11 Logistyka jak zwykle, zajęcia 3 z 8", /Zajęcia 3 z 8/.test(t411) && !/Odwołane/i.test(t411), t411);
ok("przed: 18.11 zajęcia 4 z 8", /Zajęcia 4 z 8/.test(t1811), t1811);
const temat411 = (t411.match(/prawdopodobny temat:\s*(.+)/) || [])[1]?.trim();
await before.goto(BASE + "index.html#/po/logistyka"); await before.waitForTimeout(700);
const ost0 = await before.locator("section.panel", { has: before.locator("h2", { hasText: "Twoje ostatnie zajęcia" }) }).innerText().catch(() => "");
ok("przed: Po zajęciach ma 4.11 i 3.11", /dziś/.test(ost0) && /3 lis|wczoraj/.test(ost0), ost0);

// ---- starosta: propozycja w „Ostatnio dodane”
const s = await page(b, { konto: "starosta", ls: { ...LS, "bm-starosta": "1", "mock-docs": JSON.stringify({ tasks: { t1: ogl }, meta: { po: { items: po } } }) } });
await s.clock.setFixedTime(CZAS);
await s.goto(BASE + "index.html#/"); await s.waitForTimeout(2500);
const strip = s.locator(".odw-strip").first();
const stripTxt = await strip.innerText().catch(() => "");
ok("Dziś: pasek „To odwołanie?” przy ogłoszeniu", /To odwołanie\?/.test(stripTxt) && /Logistyka/.test(stripTxt) && /3\.11, 4\.11/.test(stripTxt), stripTxt);
await s.goto(BASE + "index.html#/starosta"); await s.waitForTimeout(600);
const row = await s.locator(".more-row", { hasText: "Odwołania z Teams" }).innerText();
ok("Narzędzia starosty: Odwołania z Teams z licznikiem 1", /\b1\b/.test(row), row);
await s.locator(".more-row", { hasText: "Odwołania z Teams" }).click(); await s.waitForTimeout(500);
const pend = await s.locator("section.panel", { has: s.locator("h2", { hasText: "Do sprawdzenia" }) }).innerText();
ok("propozycja: C111–C113, 3.11 ćw. i 4.11 wykład", /C112 · odwołane 03\.11 10:00 · Logistyka/.test(pend.replace(/03\.11/g, "03.11")) || (/C112 · odwołane 3\.11 10:00/.test(pend) && /C112 · odwołane 4\.11 8:15/.test(pend)), pend);
ok("propozycja: sprawdź rodzaj zajęć (3.11 to ćwiczenia)", /sprawdź rodzaj zajęć/.test(pend), pend);
// Popraw → okno z podglądem → Zatwierdź
await s.locator("section.panel", { has: s.locator("h2", { hasText: "Do sprawdzenia" }) }).getByRole("button", { name: "Popraw" }).click(); await s.waitForTimeout(300);
const prev = await s.locator(".modal .odw-prev").innerText();
ok("okno Popraw: podgląd zmian", /Zmiany w planie/.test(prev) && /4\.11 8:15/.test(prev), prev);
await s.locator(".modal").getByRole("button", { name: "Zatwierdź" }).click(); await s.waitForTimeout(600);
const doc = await s.evaluate(async () => (await (await window.claude.use("db")).doc("meta/odwolania").get()).data());
const it = Object.values(doc?.items || {})[0];
ok("zapis meta/odwolania", it?.tid === "t1" && it.z?.C112?.some((x) => x.date === "2026-11-04" && x.start === "8:15" && x.pl === "Logistyka") && it.z?.C112?.some((x) => x.date === "2026-11-03"), doc);
const done = await s.locator("section.panel", { has: s.locator("h2", { hasText: "Zatwierdzone" }) }).innerText();
ok("ekran: na liście Zatwierdzone", /Odwołane wykłady z Logistyki/.test(done), done);
await s.goto(BASE + "index.html#/"); await s.waitForTimeout(600);
ok("Dziś: pasek znika po zatwierdzeniu", (await s.locator(".odw-strip").count()) === 0, await s.locator(".feed").innerText().catch(() => ""));
await shot(s, "polaczenia1-starosta");

// ---- student po zatwierdzeniu
const p = await page(b, { konto: "platne", ls: { ...LS, "mock-docs": JSON.stringify({ tasks: { t1: ogl }, meta: { po: { items: po }, odwolania: doc } }) } });
await p.clock.setFixedTime(CZAS);
await p.goto(BASE + "index.html#/"); await p.waitForTimeout(2500);
const main = await p.locator("main").innerText();
const poCard = await p.locator(".po-card").innerText().catch(() => "");
ok("Dziś: brak propozycji Logistyki z 3.11 i 4.11", !/Zajęcia (dziś|wczoraj)|Przed zajęciami dziś/.test(poCard) || !/Logistyka/.test(poCard), poCard);
ok("Dziś: brak paska starosty u studenta", (await p.locator(".odw-strip").count()) === 0, "");
await p.goto(BASE + "index.html#/po/logistyka"); await p.waitForTimeout(700);
const ost1 = await p.locator("section.panel", { has: p.locator("h2", { hasText: "Twoje ostatnie zajęcia" }) }).innerText().catch(() => "");
ok("Po zajęciach: bez 3.11 i 4.11", !/dziś/.test(ost1) && !/3 lis|wczoraj/.test(ost1), ost1);
const box = await cal(p, 4);
const off = box.locator(".cls.is-off", { hasText: "Logistyka" });
const offTxt = await off.innerText().catch(() => "");
ok("Kalendarz 4.11: Logistyka 8:15 przekreślona, Odwołane", (await off.count()) === 1 && /8:15/.test(offTxt) && /Odwołane/i.test(offTxt), await box.innerText());
ok("Kalendarz 4.11: link do ogłoszenia, bez „Co było?”", /Ogłoszenie z Teams/.test(offTxt) && !/Co było/.test(offTxt) && !/prawdopodobny temat/.test(offTxt), offTxt);
await off.getByRole("button", { name: /Ogłoszenie z Teams/ }).click(); await p.waitForTimeout(300);
ok("link otwiera ogłoszenie", /Odwołane wykłady z Logistyki/.test(await p.locator(".modal").innerText()), "");
await p.keyboard.press("Escape");
await shot(p, "polaczenia1-kalendarz");
const t1811b = await topicOn(p, 18);
const temat1811 = (t1811b.match(/prawdopodobny temat:\s*(.+)/) || [])[1]?.trim();
ok("18.11: zajęcia 3 z 7 i temat, który miał być 4.11", /Zajęcia 3 z 7/.test(t1811b) && temat1811 && temat1811 === temat411, { t1811b, temat411 });
ok("bez błędów w konsoli", !before.errors.length && !s.errors.length && !p.errors.length, [...before.errors, ...s.errors, ...p.errors]);

// ---- EN
const en = await page(b, { konto: "platne", lang: "en", ls: { ...LS, "mock-docs": JSON.stringify({ tasks: { t1: ogl }, meta: { odwolania: doc } }) } });
await en.clock.setFixedTime(CZAS);
const boxEn = await cal(en, 4);
const offEn = await boxEn.locator(".cls.is-off").first().innerText().catch(() => "");
ok("EN: Cancelled + Teams link", /Cancelled/i.test(offEn) && /Teams/.test(offEn) && !/Ogłoszenie/.test(offEn), offEn);

// ---- telefon 375 px: starosta, okno poprawiania
const m = await page(b, { konto: "starosta", w: 375, h: 760, ls: { ...LS, "bm-starosta": "1", "mock-docs": JSON.stringify({ tasks: { t1: ogl } }) } });
await m.clock.setFixedTime(CZAS);
await m.goto(BASE + "index.html#/odwolania"); await m.waitForTimeout(2500);
await m.getByRole("button", { name: "Popraw" }).first().click(); await m.waitForTimeout(300);
const sw = await m.evaluate(() => document.documentElement.scrollWidth);
ok("375 px: bez poziomego przewijania", sw <= 375, sw);
await m.locator(".modal").getByRole("button", { name: "Przeniesienie" }).click();
ok("Przeniesienie: pola nowej daty i godziny", await m.locator(".modal input[type=date]").isVisible() && await m.locator(".modal input[type=time]").isVisible(), "");
await shot(m, "polaczenia1-telefon");

await b.close();
for (const w of wyniki) console.log(w.join(" "));
const bad = wyniki.filter((w) => w[0] === "✗").length;
console.log(`\n${wyniki.length - bad}/${wyniki.length}`);
process.exit(bad ? 1 : 0);
