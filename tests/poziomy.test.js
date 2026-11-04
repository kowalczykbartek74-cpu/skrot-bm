// Lekcje v4: dni powtórek (lv) i punkty lekcji. node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");
const V = require("../lekcje-v4.js");

test("lv: ten sam dzień dwa razy = jeden wpis", () => {
  const a = V.lvNext([], 11, 10, 3, 3);
  assert.deepEqual(a, [11]);
  assert.equal(V.lvNext(a, 11, 10, 5, 5), null);
});

test("lv: dzień zdania biletu (i wcześniejszy) się nie liczy", () => {
  assert.equal(V.lvNext([], 10, 10, 4, 4), null);
  assert.equal(V.lvNext([], 9, 10, 4, 4), null);
  assert.equal(V.lvNext([], 12, null, 4, 4), null); // lekcja niezrobiona
});

test("lv: potrzeba ≥ 2 kart i ≥ 80% dobrze za pierwszym razem", () => {
  assert.equal(V.lvNext([], 11, 10, 1, 1), null);
  assert.equal(V.lvNext([], 11, 10, 5, 3), null); // 60%
  assert.deepEqual(V.lvNext([], 11, 10, 5, 4), [11]); // 80%
});

test("lv: 3 dni → opanowana, dalej nie rośnie", () => {
  let lv = [];
  for (const t of [11, 13, 20]) lv = V.lvNext(lv, t, 10, 2, 2) || lv;
  assert.deepEqual(lv, [11, 13, 20]);
  assert.equal(V.lvNext(lv, 21, 10, 2, 2), null);
  assert.equal(V.lessonPtsCalc({ ok: true, lv: lv.length }).state, "mastered");
});

test("lessonPts: nic / części / bilet / 1 dzień / 3 dni / bez biletu", () => {
  const P = V.lessonPtsCalc;
  assert.deepEqual([P({}).pts, P({}).state], [0, "none"]);
  assert.deepEqual([P({ begun: true }).pts, P({ begun: true }).state], [0, "doing"]);
  assert.deepEqual([P({ frac: 0.5 }).pts, P({ frac: 0.5 }).state], [25, "doing"]);
  assert.deepEqual([P({ frac: 1 }).pts, P({ frac: 1 }).state], [50, "doing"]); // części bez biletu: jeszcze nie zrobiona
  assert.deepEqual([P({ ok: true }).pts, P({ ok: true }).state], [60, "done"]);
  assert.deepEqual([P({ ok: true, lv: 1 }).pts, P({ ok: true, lv: 1 }).state], [80, "kept"]);
  assert.deepEqual([P({ ok: true, lv: 2 }).pts, P({ ok: true, lv: 2 }).state], [80, "kept"]);
  assert.deepEqual([P({ ok: true, lv: 3 }).pts, P({ ok: true, lv: 3 }).state], [100, "mastered"]);
  assert.deepEqual([P({ manual: true }).pts, P({ manual: true }).state], [50, "done"]);
  assert.deepEqual([P({ manual: true, lv: 3 }).pts, P({ manual: true, lv: 3 }).state], [90, "mastered"]);
  // lv bez zrobionej lekcji się nie liczy
  assert.equal(P({ frac: 0.5, lv: 3 }).pts, 25);
});
