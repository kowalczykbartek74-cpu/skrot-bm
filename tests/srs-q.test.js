// Lekcje v4: klucze pytań w Powtórkach. node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");
const V = require("../lekcje-v4.js");

const L = {
  sections: [
    { h: "1", check: { q: "Ile wynosi koszt alternatywny?", options: ["A", "B", "C"], correct: 1, why: "bo tak" } },
    { h: "2", check: { q: "Bez opcji", options: [] } },
    { h: "3" },
  ],
  exit: [{ q: "Bilet 1", options: ["x", "y"], correct: 0 }, { q: "Zły klucz", options: ["x", "y"], correct: 5 }],
};

test("qKey: q:<mid>:<hash pytania>, ten sam hash co fiszki", () => {
  const k = V.qKey("syl-makro-l3", L.sections[0].check);
  assert.equal(k, "q:syl-makro-l3:" + V.hashStr("Ile wynosi koszt alternatywny?"));
  assert.match(k, /^q:syl-makro-l3:[0-9a-z]+$/);
});

test("keyMid rozumie wszystkie prefiksy", () => {
  assert.equal(V.keyMid("q:syl-makro-l3:abc"), "syl-makro-l3");
  assert.equal(V.keyMid("d:m1:a3"), "m1");
  assert.equal(V.keyMid("n:m1:g1"), "m1");
  assert.equal(V.keyMid("m1:abc"), "m1");
  assert.equal(V.keyMid("g:makro:abc"), null);
});

test("lessonQuestions: check z sekcji i bilet, tylko pełne pytania", () => {
  const qs = V.lessonQuestions(L).map((q) => q.q);
  assert.deepEqual(qs, ["Ile wynosi koszt alternatywny?", "Bilet 1"]);
  assert.deepEqual(V.lessonQuestions(null), []);
});

test("pytanie usunięte z treści nie ma już klucza (resolveCards → stale)", () => {
  const before = new Set(V.lessonQuestions(L).map((q) => V.qKey("m", q)));
  const L2 = { ...L, exit: [] };
  const after = new Set(V.lessonQuestions(L2).map((q) => V.qKey("m", q)));
  const gone = [...before].filter((k) => !after.has(k));
  assert.deepEqual(gone, [V.qKey("m", L.exit[0])]);
});
