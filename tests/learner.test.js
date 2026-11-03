// learner.js (Profil nauki, budowany z matura-app: npm run learner:build -- ../skrot-bm/learner.js).
// Sprawdza to, na czym opiera się srsGrade w index.html: FSRS dla zapisanej karty i stały wynik.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const ctx = {};
vm.runInNewContext(fs.readFileSync(__dirname + "/../learner.js", "utf8") + ";this.L = SkrotLearner;", ctx);
const L = ctx.L;

test("nowa fiszka: Pamiętam = 3 dni, Nie pamiętam = jutro", () => {
  assert.equal(L.memory.reviewStoredCard(null, 3, "2026-11-03").due, "2026-11-06");
  assert.equal(L.memory.reviewStoredCard(null, 1, "2026-11-03").due, "2026-11-04");
});

test("kolejne „Pamiętam” odsuwają fiszkę coraz dalej", () => {
  let r = L.memory.reviewStoredCard(null, 3, "2026-11-03");
  const gaps = [3];
  for (let i = 0; i < 3; i++) {
    const day = r.due;
    r = L.memory.reviewStoredCard(r.card, 3, day);
    gaps.push(Math.round((new Date(r.due) - new Date(day)) / 864e5));
  }
  for (let i = 1; i < gaps.length; i++) assert.ok(gaps[i] > gaps[i - 1], gaps.join(","));
});

test("pomyłka po dobrej passie: wraca szybko i liczy się jako pomyłka", () => {
  let r = L.memory.reviewStoredCard(null, 3, "2026-11-03");
  r = L.memory.reviewStoredCard(r.card, 3, r.due);
  const day = r.due;
  r = L.memory.reviewStoredCard(r.card, 1, day);
  assert.ok((new Date(r.due) - new Date(day)) / 864e5 <= 2);
  assert.equal(r.card.lapses, 1);
});

test("test „Jak się uczysz?” 19+: blok w granicach wieku, stres tylko jako wysoki albo nie", () => {
  const s = L.scoring.scoreTest("19+", { bedtime: 1440, clearest: "evening", focus: 30, sessions: "one", motivations: ["plan"], stress: 5, interests: [], memory: null });
  assert.equal(s.priors.blockMinutes.value, 30);
  assert.equal(s.declared.stressHigh, true);
  assert.equal("stress" in s.declared, false);
  assert.equal(s.declared.quietHoursStart, 1410);
});
