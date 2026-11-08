// Harmonogram treści (scripts/harmonogram-tresci.mjs) i eksport terminów z Panelu kierunków (panel-kierunkow.js).
// node --test tests/harmonogram.test.js
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const P = require("../panel-kierunkow.js");

const ROOT = path.join(__dirname, "..");
const H = () => import("../scripts/harmonogram-tresci.mjs");
const J = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
const KAL = { tygodnie: [["2026-10-05", "2026-10-09", "odd"], ["2027-01-25", "2027-01-29", "odd"]],
  okresy: [{ od: "2026-12-24", do: "2027-01-06", opis: "Przerwa świąteczna" }, { od: "2027-02-02", do: "2027-02-15", opis: "Sesja egzaminacyjna (2–15.02)" }] };

test("daty semestru z kalendarza roku: początek sesji i ostatni dzień zajęć", async () => {
  const { datySemestru } = await H();
  assert.deepStrictEqual(datySemestru(KAL), { sesja: "2027-02-02", koniecZajec: "2027-01-29" });
  assert.deepStrictEqual(datySemestru(null), { sesja: null, koniecZajec: null });
});

test("Zarządzanie: egzaminy do początku sesji, zaliczenia do końca zajęć, termin z bazy wygrywa, zapas 21 dni, status paczek", async () => {
  const { harmonogram, markdown } = await H();
  const k = J("kierunki/wefiz-zarz-1-st-2026.json"), syl = J("sylabus-zarz.json");
  const terminy = [{ rocznik_id: k.id, subjectId: "podstawy-prawa", date: "2026-12-02", title: "Kolokwium prawo" },
    { rocznik_id: k.id, subjectId: "podstawy-prawa", date: "2026-10-01", title: "stare" },
    { rocznik_id: "wefiz-fir-1-st-2026", subjectId: "matematyka", date: "2026-11-10", title: "inny rocznik" }];
  const paczki = { "podstawy-zarzadzania": { gotowe: 3, doZrobienia: 0 }, "matematyka": { gotowe: 1, doZrobienia: 2 } };
  const w = harmonogram({ k, syl, kal: KAL, terminy, paczki, teraz: new Date("2026-11-08T12:00:00Z") });
  const po = Object.fromEntries(w.map((x) => [x.przedmiot, x]));
  assert.deepStrictEqual(Object.keys(po).sort(), Object.keys(k.przedmioty).sort());
  assert.deepStrictEqual([po["podstawy-prawa"].termin, po["podstawy-prawa"].generujDo, po["podstawy-prawa"].skad], ["2026-12-02", "2026-11-11", "termin w bazie: Kolokwium prawo"]);
  assert.ok(po["podstawy-prawa"].pilne, "generuj do 11.11 = w tym tygodniu");
  assert.deepStrictEqual([po["matematyka"].egzamin, po["matematyka"].termin, po["matematyka"].generujDo, po["matematyka"].stan], [true, "2027-02-02", "2027-01-12", "w trakcie"]);
  assert.deepStrictEqual([po["zachowania-konsumentow"].egzamin, po["zachowania-konsumentow"].termin], [false, "2027-01-29"]);
  assert.strictEqual(po["podstawy-zarzadzania"].stan, "gotowe");
  assert.strictEqual(w[0].przedmiot, "podstawy-prawa", "najpierw najbliższy „generuj do”");
  const md = markdown(w, new Date("2026-11-08T12:00:00Z"));
  assert.match(md, /Do zrobienia w tym tygodniu \(1\):\*\* zarz26\/podstawy-prawa/);
  assert.match(md, /lekcje-z-bm\.py kierunki\/wefiz-zarz-1-st-2026\.json k2 --na-sucho --wszystkie --przedmioty podstawy-prawa/);
  const sp = harmonogram({ k, syl, kal: KAL, teraz: new Date("2026-11-20T12:00:00Z") }).find((x) => x.przedmiot === "podstawy-prawa");
  assert.ok(!sp.spoznione && sp.termin === "2027-01-29", "bez terminów z bazy: koniec zajęć");
  assert.ok(harmonogram({ k, syl, kal: KAL, terminy, teraz: new Date("2026-11-20T12:00:00Z") }).find((x) => x.przedmiot === "podstawy-prawa").spoznione);
});

test("FiR: przedmiot bez karty w sylabusie, ale z egzaminem z planu studiów (egzaminyBezKarty)", async () => {
  const { harmonogram } = await H();
  const k = J("kierunki/wefiz-fir-1-st-2026.json");
  const w = harmonogram({ k, syl: J("sylabus-fir.json"), kal: KAL, teraz: new Date("2026-11-08T12:00:00Z") });
  const m = w.find((x) => x.przedmiot === "makroekonomia");
  assert.deepStrictEqual([m.egzamin, m.termin], [true, "2027-02-02"]);
});

test("status paczek: K1 bez tłumaczenia = do zrobienia, reszta gotowa", async () => {
  const { statusPaczek } = await H();
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "paczki-"));
  fs.writeFileSync(path.join(d, "a.json"), JSON.stringify({ subjectId: "x", k2: "do zrobienia" }));
  fs.writeFileSync(path.join(d, "b.json"), JSON.stringify({ subjectId: "x", k2: "gotowe" }));
  fs.writeFileSync(path.join(d, "c.json"), JSON.stringify({ subjectId: "y" }));
  fs.writeFileSync(path.join(d, "zly.json"), "{");
  assert.deepStrictEqual(statusPaczek(d), { x: { gotowe: 1, doZrobienia: 1 }, y: { gotowe: 1, doZrobienia: 0 } });
  assert.deepStrictEqual(statusPaczek(path.join(d, "nie-ma")), {});
});

test("Panel kierunków → „Pobierz terminy do harmonogramu”: przyszłe terminy z przedmiotem, wszystkie roczniki, bez dubli", () => {
  const D = { deadlines: [
    { id: "a", rocznik_id: "z", data: { title: "Kol 1", subjectId: "matematyka", date: "2026-12-01" } },
    { id: "b", rocznik_id: "z", data: { title: "Bez przedmiotu", date: "2026-12-02" } },
    { id: "c", rocznik_id: "f", data: { title: "Egz", subjectId: "makroekonomia", date: "2027-02-03T10:00" } },
    { id: "d", rocznik_id: "z", data: { title: "Stare", subjectId: "matematyka", date: "2026-10-01" } },
    { id: "e", rocznik_id: "z", data: { title: "Kol 1", subjectId: "matematyka", date: "2026-12-01" } }] };
  assert.deepStrictEqual(P.terminyDoHarmonogramu(D, ["z", "f"], "2026-11-08"), [
    { rocznik_id: "z", subjectId: "matematyka", date: "2026-12-01", title: "Kol 1" },
    { rocznik_id: "f", subjectId: "makroekonomia", date: "2027-02-03", title: "Egz" }]);
  assert.match(fs.readFileSync(path.join(ROOT, "index.html"), "utf8"), /PKP\.terminyDoHarmonogramu\(D, ids, dzis\)/);
});
