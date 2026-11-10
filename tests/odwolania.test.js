// Ogłoszenia z Teams → zmiany w planie (Narzędzia starosty → Odwołania z Teams): odwołania, odrabianie, zastępstwa,
// zmiana godziny albo sali. Kod brany prosto z index.html (od ODW_RX do odwApproved), plan = PLAN_WBUDOWANY.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const code = html.slice(html.indexOf("  const ODW_RX"), html.indexOf("  const odwApproved"));
const planSrc = html.match(/const PLAN_WBUDOWANY = (\{.*?\});\n/)[1];
const PLAN = JSON.parse(planSrc);
const SLOTS = [["8:15","9:45"],["10:00","11:30"],["12:00","13:30"],["13:45","15:15"],["15:30","17:00"],["17:15","18:45"],["19:00","20:30"]];
const pad = (n) => String(n).padStart(2, "0");
const dkey = (dt) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
const dparse = (k) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (dt, n) => { const x = new Date(dt); x.setDate(x.getDate() + n); return x; };
const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const clsStart = (e) => (e.time ? e.time[0] : SLOTS[e.s][0]);
const clsEnd = (e) => (e.time ? e.time[1] || e.time[0] : SLOTS[e.s][1]);
const hm = (t) => { const [a, b] = String(t).split(":").map(Number); return a * 60 + (b || 0); };
const parity = (k) => (PLAN.kalendarz.tygodnie.find(([a, b]) => k >= a && k <= b) || [])[2];
function classesOn(k, g) {
  const p = parity(k); if (!p) return [];
  const wd = (dparse(k).getDay() + 6) % 7;
  return (PLAN.groups[g]?.[p] || []).filter((e) => e.d === wd && (!e.dates || e.dates.includes(k))).sort((a, b) => a.s - b.s);
}
const subj = new Map();
for (const G of Object.values(PLAN.groups)) for (const e of [...G.odd, ...G.even]) if (e.k !== "X") subj.set(slug(e.pl), { id: slug(e.pl), pl: e.pl, en: e.en });
const SUBJECTS = [...subj.values()], subjectById = (id) => SUBJECTS.find((s) => s.id === id);
const O = new Function("PLAN", "SLOTS", "pad", "dkey", "dparse", "addDays", "slug", "clsStart", "clsEnd", "hm", "SUBJECTS", "subjectById", "classesOn",
  code + "\nreturn { odwGuess, odwSlots, odwDates };")(PLAN, SLOTS, pad, dkey, dparse, addDays, slug, clsStart, clsEnd, hm, SUBJECTS, subjectById, classesOn);
const at = (y, m, d) => new Date(y, m - 1, d, 12).getTime();
const lines = (p) => Object.entries(p.z).flatMap(([g, l]) => l.map((x) => `${g} ${x.type}${x.kind ? "/" + x.kind : ""}${x.moved ? "/moved" : ""} ${x.date} ${x.start}${x.end ? "-" + x.end : ""} ${x.k || ""}${x.r ? " " + x.r : ""}${x.p ? " " + x.p : ""}`));

test("odrabianie z Ekonomii biznesu (post dr Gąsior, po angielsku)", () => {
  const p = O.odwGuess({ id: "t1", subjectId: "ekonomia-biznesu", title: "Making up missed classes", source: { team: "BE C 112 2026/2027", postedAt: at(2026, 10, 26) },
    summary: "Dear Students,\n\nDue to the cancellation of classes this week (26–27 October 2026) for health reasons, I would like to inform you of the dates, times, and rooms in which the make-up classes will take place.\n\nGroup C 112:\n9 November 2026, 8:15–9:45, Room 003.\n\nLecture for all groups:\n12 November 2026, 12:00–13:30, Room 044.\n\nAdditionally, our regularly scheduled classes on 9–10 November 2026 will take place as planned.\n\nKind regards,\n\ndr Aleksandra Gąsior" });
  assert.equal(p.kind, "makeup");
  const L = lines(p).filter((l) => l.includes("extra"));
  assert.deepEqual(L, [
    "C111 extra/makeup 2026-11-12 12:00-13:30 W s. 044 dr Aleksandra Gąsior",
    "C112 extra/makeup 2026-11-09 8:15-9:45 CW s. 003 dr Aleksandra Gąsior",
    "C112 extra/makeup 2026-11-12 12:00-13:30 W s. 044 dr Aleksandra Gąsior",
    "C113 extra/makeup 2026-11-12 12:00-13:30 W s. 044 dr Aleksandra Gąsior"]);
  assert.deepEqual(p.dates, ["2026-10-26", "2026-10-27"]);
  assert.ok(!lines(p).some((l) => l.includes("moved")), "zwykłe zajęcia 9–10.11 zostają");
});

test("to samo jako polskie zadanie z automatu Teams", () => {
  const p = O.odwGuess({ id: "t2", subjectId: "ekonomia-biznesu", title: "Ekonomia biznesu: odrabianie zajęć", source: { team: "BE C 112 2026/2027", postedAt: at(2026, 10, 26) },
    summary: "Dr Gąsior podała terminy odrabiania zajęć odwołanych 26–27.10.", details: ["C112: 9.11, 8:15–9:45, sala 003", "Wykład dla wszystkich grup: 12.11, 12:00–13:30, sala 044", "Zwykłe zajęcia 9–10.11 odbywają się normalnie"] });
  assert.equal(lines(p).filter((l) => l.includes("extra")).length, 4);
});

test("zmiana godziny ćwiczeń z Finansów (C112, 21.10 na 10:00, sala 002)", () => {
  const p = O.odwGuess({ id: "t3", subjectId: "podstawy-finansow", title: "Tutorials – Group C112 – 21 October 2026", source: { team: "FUNDAMENTALS OF FINANCE 2026_2027", postedAt: at(2026, 10, 20) },
    summary: "Dear Students of Group C112,\nAt your request, the Tutorials session on 21 October will take place at 10:00 a.m.\nI look forward to seeing you in Room 002." });
  assert.deepEqual(lines(p), ["C112 cancel/moved 2026-10-21 13:45 ", "C112 extra/change 2026-10-21 10:00-11:30 CW s. 002 dr hab. prof. US Beata Świecka"]);
});

test("zastępstwo bez godziny: ten sam termin, inny prowadzący", () => {
  const p = O.odwGuess({ id: "t4", subjectId: "prawo", title: "Substitute lecturer", source: { team: "Law (prawo) BM", postedAt: at(2026, 11, 10) },
    summary: "On 17 November the Law lecture will be conducted by dr Anna Nowak instead of dr Szymszon." });
  assert.deepEqual(lines(p).filter((l) => l.startsWith("C112")), ["C112 cancel/moved 2026-11-17 8:15 ", "C112 extra/change 2026-11-17 8:15-9:45 W s. 002 dr Anna Nowak"]);
});

test("zastępstwo po polsku z godziną i salą: tylko grupy z tymi zajęciami o tej godzinie", () => {
  const p = O.odwGuess({ id: "t5", subjectId: "makroekonomia", title: "Zastępstwo – Makroekonomia", source: { team: "Macroeconomics -BM- 2026_2027", postedAt: at(2026, 11, 10) },
    summary: "Ćwiczenia z Makroekonomii 20.11 o 10:00 w zastępstwie poprowadzi dr Jan Kowalski, sala 105." });
  const L = lines(p);
  assert.ok(L.length >= 2 && L.every((l) => /2026-11-20 10:00/.test(l)), L.join("\n"));
  assert.ok(L.some((l) => l.includes("extra/change") && l.includes("s. 105 dr Jan Kowalski")));
});

test("zwykłe odwołanie działa jak wcześniej (też „November 3” po angielsku)", () => {
  const p = O.odwGuess({ id: "t6", subjectId: "logistyka", title: "Schedule update - class off.", source: { team: "Logistics Lectures BM", postedAt: at(2026, 11, 2) },
    summary: "our classes scheduled for tomorrow (November 3) and Wednesday (November 4) will unfortunately be cancelled. A new date for the missed classes will be arranged" });
  assert.equal(p.kind, "cancel");
  assert.deepEqual(p.dates, ["2026-11-03", "2026-11-04"]);
  assert.ok(lines(p).every((l) => l.includes(" cancel ")));
});

test("godziny dziekańskie i „zajęcia odbędą się normalnie” niczego nie zmieniają", () => {
  assert.equal(O.odwGuess({ id: "t7", subjectId: "narzedzia-it-w-zarzadzaniu", title: "Dean's hours", source: { team: "202627 IT Tools BM", postedAt: at(2026, 11, 5) },
    summary: "On November 19, 2026, from 10:00 a.m. to 2:00 p.m., dean's hours will be announced. Due to these hours, all IT Tools laboratories will take place normally on this day." }), null);
});

test("odrabianie bez terminu trafia do sprawdzenia (bez zmian w planie)", () => {
  const p = O.odwGuess({ id: "t8", subjectId: "logistyka", title: "Odrabianie Logistyki", summary: "Termin odrabiania zostanie podany później.", source: { team: "Logistics Lectures BM", postedAt: at(2026, 11, 5) } });
  assert.equal(p.kind, "makeup"); assert.equal(p.n, 0); assert.deepEqual(p.slots, []);
});

test("linie z okna „Popraw”", () => {
  const s = (l) => O.odwSlots(l, at(2026, 11, 1)).slots;
  assert.deepEqual(s("C112 ćwiczenia 9.11 8:15–9:45 s. 003"), [{ date: "2026-11-09", start: "8:15", end: "9:45", r: "s. 003", groups: ["C112"], kind: "CW" }]);
  assert.deepEqual(s("wszystkie grupy wykład 12.11 12:00–13:30 s. 044")[0].groups, "ALL");
  assert.equal(s("C112 9.11 8:15–9:45 s. 003 prowadzi: dr hab. Jan Kowalski")[0].p, "dr hab. Jan Kowalski");
});
