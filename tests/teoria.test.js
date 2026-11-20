// Mapa teorii (teoria.js): walidator formatu „zdawalni-teoria” v1 (te same reguły co narz/teoria-sprawdz.py). node --test tests/*.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const vm = require("vm");
const ctx = { window: {}, document: undefined };
vm.runInNewContext(fs.readFileSync(__dirname + "/../teoria.js", "utf8"), ctx);
const T = ctx.window.ZD_TEORIA;
const wzor = () => JSON.parse(fs.readFileSync(__dirname + "/../docs/teoria/przyklad-inflation.json", "utf8"));

test("przykład z prototypu (Inflation) przechodzi walidację i ma 900–2400 słów", () => {
  const d = wzor();
  assert.deepEqual([...T.waliduj(d)], []);
  const n = T.slowa(d);
  assert.ok(n >= 900 && n <= 2400, `słów: ${n}`);
  assert.equal(T.minuty(n), Math.max(1, Math.round(n / 200)));
});

test("LaTeX liczy się jako jedno słowo, interpunkcja nie", () => {
  assert.equal(T.liczSlowa("Real rate \\(r = i - \\pi\\) is small — really."), 6);
  assert.equal(T.liczSlowa(""), 0);
});

test("zły format, za mało gałęzi, złe id i za głęboko → błędy", () => {
  const d = wzor();
  d.format = "inny";
  d.branches = d.branches.slice(0, 2);
  d.branches[0].nodes[0].id = "x1";
  d.branches[0].nodes[0].kids[0].kids = [{ id: "b1-1b", t: "def", md: "za głęboko" }];
  const e = T.waliduj(d).join(" | ");
  assert.match(e, /format/);
  assert.match(e, /gałęzi musi być 3–6/);
  assert.match(e, /złe id „x1”/);
  assert.match(e, /za głęboko/);
});

test("nieznany typ węzła, link bez ref, połączenie do nieistniejącej gałęzi, za długi węzeł", () => {
  const d = wzor();
  d.branches[1].nodes[2].t = "ciekawostka";
  d.branches[1].nodes[3].t = "link";
  d.links.push({ from: "b9", to: "b1", why: "x" });
  d.branches[2].nodes[0].md = Array(130).fill("word").join(" ");
  const e = T.waliduj(d).join(" | ");
  assert.match(e, /nieznany typ „ciekawostka”/);
  assert.match(e, /połączenie bez ref/);
  assert.match(e, /nie ma gałęzi „b9”/);
  assert.match(e, /ponad 120 słów/);
});

test("za krótka mapa jest odrzucana", () => {
  const d = wzor();
  for (const b of d.branches) b.nodes = b.nodes.slice(0, 2).map((n) => ({ id: n.id, t: n.t, h: n.h, md: "Short." }));
  assert.match(T.waliduj(d).join(" | "), /słów \(dozwolone 900–2400\)/);
});
