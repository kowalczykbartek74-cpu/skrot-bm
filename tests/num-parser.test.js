// Lekcje v4: parser wyrażeń do szablonów gen (bez eval). node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");
const V = require("../lekcje-v4.js");

test("max(a,b)+c, potęgi, nawiasy, kolejność działań", () => {
  assert.equal(V.numCalc("max(a, b) + c", { a: 40, b: 90, c: 20 }), 110);
  assert.equal(V.numCalc("min(a,b)*2", { a: 3, b: 5 }), 6);
  assert.equal(V.numCalc("2 + 3 * 4", {}), 14);
  assert.equal(V.numCalc("(2 + 3) * 4", {}), 20);
  assert.equal(V.numCalc("2^3^2", {}), 512); // potęga od prawej
  assert.equal(V.numCalc("-2^2", {}), -4);
  assert.equal(V.numCalc("a / b - 1", { a: 105, b: 100 }), 0.050000000000000044);
  assert.equal(V.numCalc("sqrt(x) + abs(-3) + ln(1)", { x: 16 }), 7);
});

test("round(x, 2) i round(x)", () => {
  assert.equal(V.numCalc("round(x, 2)", { x: 3.14159 }), 3.14);
  assert.equal(V.numCalc("round(x)", { x: 2.5 }), 3);
});

test("przecinek dziesiętny w odpowiedzi ucznia i tolerancja", () => {
  assert.equal(V.numInput("12,5"), 12.5);
  assert.equal(V.numInput(" 1 250,75 zł"), 1250.75);
  assert.equal(V.numInput("-0,5%"), -0.5);
  assert.ok(Number.isNaN(V.numInput("nie wiem")));
  assert.ok(V.numOk(12.5, 12.5, 0));
  assert.ok(V.numOk(100.4, 100, 0)); // 0,5% wyniku
  assert.ok(!V.numOk(101, 100, 0));
  assert.ok(V.numOk(101, 100, 1));
});

test("odrzuca kod i nieznane nazwy", () => {
  for (const bad of ["alert(1)", "a.constructor", "__proto__", "constructor", "a[0]", "x = 1", "`1`", "1;2", "a b", "max(", "a +", "toString(a)", "Math.max(a)"])
    assert.throws(() => V.numParse(bad, ["a"]), undefined, bad);
  assert.throws(() => V.numParse("a + y", ["a"]), /Nieznana zmienna: y/);
  // zmienna o nazwie z prototypu Object nie jest dostępna, jeśli nie ma jej w vars
  assert.throws(() => V.numParse("hasOwnProperty", ["a"]));
});

test("losowanie zmiennych: powtarzalne dla ziarna, w zakresie i z krokiem", () => {
  const vars = { a: [40, 90, 10], b: [0.5, 2, 0.5] };
  const x = V.numVars(vars, "g1:0"), y = V.numVars(vars, "g1:0");
  assert.deepEqual(x, y);
  for (let i = 0; i < 50; i++) {
    const v = V.numVars(vars, "g1:" + i);
    assert.ok(v.a >= 40 && v.a <= 90 && v.a % 10 === 0, JSON.stringify(v));
    assert.ok([0.5, 1, 1.5, 2].includes(v.b), JSON.stringify(v));
  }
  const g = { task: "You can earn {a} zł or {b} zł.", vars: { a: [40, 40, 10], b: [50, 50, 10] }, answer: "max(a, b)" };
  const c = V.genCard(g, "s");
  assert.equal(c.task, "You can earn 40 zł or 50 zł.");
  assert.equal(c.result, 50);
  assert.ok(V.genCard({ ...g, answer: "alert(1)" }, "s").error);
  assert.ok(V.genCard({ ...g, answer: "a / 0" }, "s").error);
});
