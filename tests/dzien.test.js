// „Ile masz dziś czasu?” i „Jedno zadanie” (dzien.js): port testów z matura-app tests/unit/fit-day.test.ts
// i one-task.test.ts (origin/feat/l7-learner-bundle) + przypadki Skrótu (5 / 15 / 30 / 60 min, kolejność specu).
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const D = require("../dzien.js");

const s = (id, kind, duration_min, task_count = 4) => ({ id, kind, duration_min, task_count });

describe("fitDay (fit-day.test.ts)", () => {
  test("keeps everything when it fits", () => {
    const r = D.fitDay([s("a", "learn", 25), s("b", "review", 20)], 60);
    assert.deepEqual(r.move, []);
    assert.deepEqual(r.keep.map((k) => [k.id, k.minutes, k.shortened]), [["a", 25, false], ["b", 20, false]]);
  });
  test("shortens the first session that does not fit and moves the rest", () => {
    const r = D.fitDay([s("a", "learn", 50, 5), s("b", "review", 25)], 30);
    assert.deepEqual(r.keep, [{ id: "a", minutes: 30, taskCount: 3, shortened: true }]);
    assert.deepEqual(r.move, ["b"]);
  });
  test("never cuts below 15 minutes", () => {
    const r = D.fitDay([s("a", "learn", 20), s("b", "learn", 40)], 30);
    assert.deepEqual(r.keep.map((k) => k.id), ["a"]);
    assert.deepEqual(r.move, ["b"]);
  });
  test("moves a mock exam or oral practice instead of cutting it, and keeps a later session", () => {
    const r = D.fitDay([s("mock", "mock_exam", 170, 0), s("oral", "oral", 40, 0), s("b", "learn", 45)], 30);
    assert.deepEqual(r.move, ["mock", "oral"]);
    assert.deepEqual(r.keep, [{ id: "b", minutes: 30, taskCount: 3, shortened: true }]);
  });
  test("rounds the shortened session down to 5 minutes", () => {
    const r = D.fitDay([s("a", "learn", 25), s("b", "learn", 50)], 45);
    assert.equal(r.keep[1].id, "b"); assert.equal(r.keep[1].minutes, 20); assert.equal(r.keep[1].shortened, true);
  });
});

describe("helpers (fit-day.test.ts)", () => {
  test("scales the task count, keeping at least one", () => {
    assert.equal(D.scaledTaskCount(4, 50, 15), 1);
    assert.equal(D.scaledTaskCount(6, 60, 30), 3);
    assert.equal(D.scaledTaskCount(0, 60, 30), 0);
  });
  test("offers only options shorter than today's plan", () => {
    assert.deepEqual(D.fitOptions(50), [15, 30, 45]);
    assert.deepEqual(D.fitOptions(15), []);
    assert.deepEqual(D.fitOptions(20, D.SKROT_OPCJE), [5, 15]);
  });
});

const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const closed = (n) => ({ taskId: id(n), type: "closed" });
const open = (n) => ({ taskId: id(n), type: "open_short" });

describe("pickOneTask (one-task.test.ts)", () => {
  test("prefers a due rematch, then today's session, then the weakest topic", () => {
    assert.deepEqual(D.pickOneTask({ rematches: [open(1)], session: [closed(2)], weakest: [closed(3)] }), { taskId: id(1), source: "rematch" });
    assert.deepEqual(D.pickOneTask({ rematches: [], session: [open(2)], weakest: [closed(3)] }), { taskId: id(2), source: "session" });
    assert.deepEqual(D.pickOneTask({ rematches: [], session: [], weakest: [closed(3)] }), { taskId: id(3), source: "weakest" });
  });
  test("takes only closed tasks from the weakest topic", () => {
    assert.deepEqual(D.pickOneTask({ rematches: [], session: [], weakest: [open(3), closed(4)] }), { taskId: id(4), source: "weakest" });
    assert.equal(D.pickOneTask({ rematches: [], session: [], weakest: [open(3)] }), null);
  });
  test("skips tasks already shown in this visit", () => {
    const pick = D.pickOneTask({ rematches: [closed(1)], session: [closed(2)], weakest: [] }, new Set([id(1)]));
    assert.deepEqual(pick, { taskId: id(2), source: "session" });
  });
});

describe("weakestTopics / parseExcluded / enoughForTodayText (one-task.test.ts)", () => {
  test("orders by mastery, counts an unmeasured topic as the middle and drops topics without tasks", () => {
    const topics = [{ id: "a", mastery: 0.8, taskCount: 4 }, { id: "b", mastery: null, taskCount: 4 }, { id: "c", mastery: 0.2, taskCount: 0 }, { id: "d", mastery: 0.3, taskCount: 2 }];
    assert.deepEqual(D.weakestTopics(topics), ["d", "b", "a"]);
    assert.deepEqual(D.weakestTopics(topics, 1), ["d"]);
  });
  test("keeps valid ids only, at most the last `max`", () => {
    assert.deepEqual(D.parseExcluded(`${id(1)},nope,${id(2)},${id(3)}`, 2), new Set([id(2), id(3)]));
    assert.equal(D.parseExcluded(undefined, 5).size, 0);
    assert.equal(D.parseExcluded(["x"], 5).size, 0);
  });
  test("mentions the streak only after the first task of the day", () => {
    assert.equal(D.enoughForTodayText(true), "Seria dnia zaliczona. Do jutra.");
    assert.doesNotMatch(D.enoughForTodayText(false), /Seria/);
  });
});

// ---------------- Skrót ----------------
const it = (id, kind, min, n = 0, extra = {}) => ({ id, kind, min, n, ...extra });
const dzien = () => [it("rew", "review", D.minutyRewanzy(1), 1), it("srs", "review", D.minutyPowtorek(30), 30), it("plan", "learn", 31, 1, { mid: "m1" }), it("misja", "mission", D.MISJA_MIN, 1), it("lekcja", "learn", 20, 1)];

describe("ulozDzien (Skrót)", () => {
  test("szacunki minut: ~3 fiszki na minutę, rewanż 2 min", () => {
    assert.equal(D.minutyPowtorek(30), 10); assert.equal(D.minutyPowtorek(1), 1); assert.equal(D.minutyPowtorek(0), 0);
    assert.equal(D.minutyRewanzy(3), 6);
  });
  test("5 min: jedna krótka rzecz (rewanż), reszta przeniesiona", () => {
    const r = D.ulozDzien(dzien(), 5);
    assert.deepEqual(r.keep.map((x) => x.id), ["rew"]);
    assert.deepEqual(r.move.map((x) => x.id), ["srs", "plan", "misja", "lekcja"]);
    assert.equal(r.used, 2); assert.equal(r.total, 68); assert.equal(r.all, false);
  });
  test("5 min: jedna rzecz, nawet gdy zmieściłyby się dwie (rewanż 2 min + 3 fiszki 1 min)", () => {
    const r = D.ulozDzien([it("rew", "review", 2, 1), it("srs", "review", 1, 3), it("mat", "learn", 15, 1)], 5);
    assert.deepEqual(r.keep.map((x) => x.id), ["rew"]);
    assert.deepEqual(r.move.map((x) => x.id), ["srs", "mat"]);
    // 15 min: obie krótkie i skrócony temat
    assert.deepEqual(D.ulozDzien([it("rew", "review", 2, 1), it("srs", "review", 1, 3), it("mat", "learn", 15, 1)], 15).keep.map((x) => [x.id, x.minutes]), [["rew", 2], ["srs", 1], ["mat", 10]]);
  });
  test("5 min bez rewanży: powtórki skrócone do 5 min (15 z 30 fiszek)", () => {
    const r = D.ulozDzien(dzien().slice(1), 5);
    assert.deepEqual(r.keep.map((x) => [x.id, x.minutes, x.n, x.nAll, x.shortened]), [["srs", 5, 15, 30, true]]);
  });
  test("5 min, tylko lekcja: lekcja skrócona do 5 min", () => {
    const r = D.ulozDzien([it("lekcja", "learn", 20, 1, { mid: "m9" })], 5);
    assert.deepEqual(r.keep.map((x) => [x.id, x.minutes, x.shortened, x.mid]), [["lekcja", 5, true, "m9"]]);
  });
  test("30 min: kolejność ważności, ostatni element skrócony do tego, co zostało", () => {
    const r = D.ulozDzien(dzien(), 30);
    assert.deepEqual(r.keep.map((x) => [x.id, x.minutes, x.shortened]), [["rew", 2, false], ["srs", 10, false], ["plan", 15, true]]);
    assert.equal(r.used, 27);
    // Zadanie dnia (5 min) mieści się w 3 pozostałych minutach? Nie — przeniesione, lekcja też (3 min < 5 min najkrótszej).
    assert.deepEqual(r.move.map((x) => x.id), ["misja", "lekcja"]);
  });
  test("próbny test nie jest cięty, tylko przeniesiony; dalsze elementy dalej mogą wejść", () => {
    const r = D.ulozDzien([it("test", "mock_exam", 45), it("misja", "mission", 5, 1), it("lekcja", "learn", 20, 1)], 15);
    assert.deepEqual(r.move.map((x) => x.id), ["test"]);
    assert.deepEqual(r.keep.map((x) => [x.id, x.minutes]), [["misja", 5], ["lekcja", 10]]);
  });
  test("60 min: wszystko się mieści (all = true), puste i zerowe elementy pominięte", () => {
    const r = D.ulozDzien([...dzien(), it("pusty", "review", 0), null], 60);
    assert.equal(r.total, 68); assert.equal(r.all, false);
    const r2 = D.ulozDzien(dzien().slice(0, 2), 60);
    assert.equal(r2.all, true); assert.deepEqual(r2.move, []);
  });
});

describe("Jedno zadanie (Skrót)", () => {
  test("rewanż → najstarsza zaległa → priorytet → lekcja", () => {
    const src = { rematches: ["z:m1:0"], due: ["q:m2:a"], priority: ["m3"], lessons: ["m4"] };
    assert.deepEqual(D.jedno(src), { id: "z:m1:0", source: "rematch" });
    assert.deepEqual(D.jedno({ ...src, rematches: [] }), { id: "q:m2:a", source: "due" });
    assert.deepEqual(D.jedno({ ...src, rematches: [], due: [] }), { id: "m3", source: "priority" });
    assert.deepEqual(D.jedno({ rematches: [], due: [], priority: [], lessons: ["m4"] }), { id: "m4", source: "lesson" });
    assert.equal(D.jedno({}), null);
  });
  test("„Inne”: pomija pokazane w tej wizycie", () => {
    const src = { rematches: ["r1"], due: ["d1", "d2"], priority: ["m3"], lessons: [] };
    assert.deepEqual(D.jedno(src, new Set(["r1", "d1"])), { id: "d2", source: "due" });
    assert.deepEqual(D.jedno(src, new Set(["r1", "d1", "d2", "m3"])), null);
  });
  test("najstarsza zaległa powtórka najpierw (remis: kolejność wejścia)", () => {
    assert.deepEqual(D.najstarszeZalegle([{ key: "a", due: 300 }, { key: "b", due: 290 }, { key: "c", due: 300 }, { key: "d", due: 295 }]), ["b", "d", "a", "c"]);
  });
  test("gdy nie ma rewanży ani zaległości: pierwszy temat priorytetu (ten sam, który pokazuje karta „Teraz zrób to”)", () => {
    // index.html podaje priority z tej samej listy co karta (krok planu → temat z planu), więc wynik = pierwszy element.
    const card = "m7";
    assert.deepEqual(D.jedno({ rematches: [], due: [], priority: [card, "m2"], lessons: ["m1"] }), { id: card, source: "priority" });
  });
});

test("index.html ładuje dzien.js z ?v= przed głównym skryptem, a i18n-en.js ma pary nowych tekstów", () => {
  const html = fs.readFileSync(__dirname + "/../index.html", "utf8");
  assert.match(html, /<script src="dzien\.js\?v=[^"]+"><\/script>/);
  const ctx = { window: { SKROT_I18N: { load(d) { ctx.d = d; } } } };
  vm.runInNewContext(fs.readFileSync(__dirname + "/../i18n-en.js", "utf8"), ctx);
  for (const k of ["Ile masz dziś czasu?", "Jedno zadanie", "Na dziś wystarczy. Reszta poczeka do następnego razu."]) assert.ok(ctx.d.exact[k], k);
});
