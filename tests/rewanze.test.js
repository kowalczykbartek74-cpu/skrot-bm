// Rewanże (rewanze.js): port testów z matura-app tests/unit/mistakes.test.ts i rematch.test.ts.
// Dni jako liczby (jak dayN w index.html); FSRS z learner.js, tak jak w przeglądarce.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const R = require("../rewanze.js");

const ctx = {};
vm.runInNewContext(fs.readFileSync(__dirname + "/../learner.js", "utf8") + ";this.L = SkrotLearner;", ctx);
const RP = R.replayZ(ctx.L);
const D = (iso) => Math.round(Date.parse(iso) / 864e5);
const a = (iso, score) => [D(iso), score];

test("pytanie bez błędu nie jest w zeszycie", () => {
  assert.deepEqual(R.stan([a("2026-10-01", 1)], D("2026-10-06"), RP), { status: "none" });
});

test("błąd wraca jutro (czeka dziś, jutro na dziś); część punktów to też błąd", () => {
  assert.equal(R.stan([a("2026-10-05", 0)], D("2026-10-05"), RP).status, "waiting");
  assert.equal(R.stan([a("2026-10-05", 0)], D("2026-10-05"), RP).due, D("2026-10-06"));
  assert.equal(R.stan([a("2026-10-05", 0)], D("2026-10-06"), RP).status, "due");
  assert.equal(R.stan([a("2026-10-05", 0.5)], D("2026-10-06"), RP).status, "due");
});

test("wygrana tego samego dnia się nie liczy, błąd decyduje o dniu", () => {
  const s = R.stan([a("2026-10-05", 0), a("2026-10-05", 1)], D("2026-10-05"), RP);
  assert.equal(s.status, "waiting"); assert.equal(s.step, 0); assert.equal(s.due, D("2026-10-06"));
  assert.equal(R.nota([a("2026-10-10", 0)], { day: D("2026-10-10"), score: 1 }, D("2026-10-10"), RP), null);
});

test("nowy błąd zaczyna od nowa", () => {
  const s = R.stan([a("2026-10-01", 0), a("2026-10-02", 1), a("2026-10-05", 1), a("2026-10-05", 0)], D("2026-10-05"), RP);
  assert.equal(s.step, 0); assert.equal(s.lastWrong, D("2026-10-05")); assert.equal(s.due, D("2026-10-06"));
});

test("nota: zapisane, wygrany (za 3, potem za 8 dni z FSRS), pokonane przy trzeciej wygranej", () => {
  assert.deepEqual(R.nota([], { day: D("2026-10-10"), score: 0 }, D("2026-10-10"), RP), { kind: "saved" });
  assert.deepEqual(R.nota([a("2026-10-01", 1)], { day: D("2026-10-10"), score: 0.5 }, D("2026-10-10"), RP), { kind: "saved" });
  assert.deepEqual(R.nota([a("2026-10-10", 0)], { day: D("2026-10-11"), score: 1 }, D("2026-10-11"), RP), { kind: "won", nextInDays: 3 });
  assert.deepEqual(R.nota([a("2026-10-10", 0), a("2026-10-11", 1)], { day: D("2026-10-14"), score: 1 }, D("2026-10-14"), RP), { kind: "won", nextInDays: 8 });
  const before = [a("2026-10-10", 0), a("2026-10-11", 1), a("2026-10-14", 1)];
  assert.deepEqual(R.nota(before, { day: D("2026-10-21"), score: 1 }, D("2026-10-21"), RP), { kind: "defeated" });
  assert.equal(R.stan([...before, a("2026-10-21", 1)], D("2026-10-22"), RP).status, "mastered");
});

test("przegrany rewanż liczy dni z rzędu; po trzech podpowiedź", () => {
  assert.deepEqual(R.nota([a("2026-10-10", 0)], { day: D("2026-10-11"), score: 0 }, D("2026-10-11"), RP), { kind: "lost", lossesInRow: 2 });
  const three = R.nota([a("2026-10-10", 0), a("2026-10-11", 0)], { day: D("2026-10-12"), score: 0 }, D("2026-10-12"), RP);
  assert.deepEqual(three, { kind: "lost", lossesInRow: 3 });
  assert.equal(R.trzebaWyjasnic(three), true);
  assert.match(R.tekst(three), /lekcji/);
  assert.equal(R.nota([a("2026-10-10", 0)], { day: D("2026-10-10"), score: 0 }, D("2026-10-10"), RP), null);
  assert.equal(R.nota([], { day: D("2026-10-10"), score: 1 }, D("2026-10-10"), RP), null);
});

test("bez learner.js: stałe kroki 1 → 3 → 7", () => {
  const h = [a("2026-10-01", 0), a("2026-10-02", 1)];
  assert.equal(R.stan(h, D("2026-10-04")).due, D("2026-10-05"));
  assert.equal(R.stan([...h, a("2026-10-05", 1)], D("2026-10-12")).due, D("2026-10-12"));
});

test("zapisz: jeden wpis na dzień (najgorszy), najwyżej MAX_DAYS", () => {
  let h = R.zapisz([], 100, 1);
  h = R.zapisz(h, 100, 0); h = R.zapisz(h, 100, 1);
  assert.deepEqual(h, [[100, 0]]);
  for (let d = 101; d < 130; d++) h = R.zapisz(h, d, 1);
  assert.equal(h.length, R.MAX_DAYS);
  assert.equal(R.zapisac([], 1, 100, RP), false);
  assert.equal(R.zapisac([[100, 0]], 1, 101, RP), true);
});

test("lista na dziś: tylko terminy na dziś, najdawniej czekające pierwsze; filtr przedmiotu", () => {
  const t = D("2026-10-20");
  const rew = { "z:m1:0": [a("2026-10-18", 0)], "z:m2:3": [a("2026-10-10", 0)], "q:m1:abc": [a("2026-10-20", 0)], "z:m3:1": [a("2026-10-01", 0), a("2026-10-02", 1), a("2026-10-05", 1), a("2026-10-12", 1)] };
  assert.deepEqual(R.naDzis(rew, t, RP), ["z:m2:3", "z:m1:0"]);
  assert.deepEqual(R.naDzis(rew, t, RP, (k) => k.includes(":m1:")), ["z:m1:0"]);
  assert.deepEqual([...R.wZeszycieKlucze(rew, t, RP)].sort(), ["q:m1:abc", "z:m1:0", "z:m2:3"]);
  assert.deepEqual(R.podsumuj(rew, t, RP), { due: 2, waiting: 1, mastered: 1, nextDue: D("2026-10-21") });
});

test("migracja z gier: mid:idx → z:mid:idx z błędem tego dnia; po~ zostaje", () => {
  const { rew, n } = R.zGier({ "abc:4": 200, "po~x1:2": 201, zle: "x" }, { "z:abc:4": [[150, 1]] });
  assert.equal(n, 1);
  assert.deepEqual(rew["z:abc:4"], [[150, 1], [200, 0]]);
  assert.equal(Object.keys(rew).length, 1);
});

test("przytnij: przy nadmiarze najpierw odpadają pokonane", () => {
  const rew = {};
  for (let i = 0; i < R.MAX_KEYS; i++) rew["z:m:" + i] = [[1000 + i, 0]];
  rew["z:old:1"] = [[10, 0], [11, 1], [14, 1], [21, 1]];
  const out = R.przytnij(rew, 2000, RP);
  assert.equal(Object.keys(out).length, R.MAX_KEYS);
  assert.equal(out["z:old:1"], undefined);
});

test("stany() daje to samo co liczenie na bieżąco", () => {
  const t = D("2026-10-20"), rew = { "z:m1:0": [a("2026-10-18", 0)], "z:m2:3": [a("2026-10-10", 0)], "q:m1:abc": [a("2026-10-20", 0)] };
  const st = R.stany(rew, t, RP);
  assert.deepEqual(R.naDzis(rew, t, RP, null, st), R.naDzis(rew, t, RP));
  assert.deepEqual(R.podsumuj(rew, t, RP, null, st), R.podsumuj(rew, t, RP));
});
