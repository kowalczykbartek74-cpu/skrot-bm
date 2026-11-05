// Mini-sprawdziany i „Pewny / Zgaduję” (sprawdzian.js): port testów z matura-app tests/unit/checkpoint.test.ts
// i tests/unit/learner-model.test.ts („calibration (6.7)”, origin/feat/l7-learner-bundle) + przypadki Skrótu.
// Daty w Skrócie to liczby dni: today = 100 odpowiada „2026-10-05” z testów Zdawalni.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const P = require("../sprawdzian.js");

// Konfiguracja z Zdawalni (lib/config.ts CHECKPOINT_CONFIG), do testów przeniesionych 1:1.
const ZD = { thresholds: [20, 40, 60, 80], size: 5, passPoints: 4, snoozeDays: 3, minDaysBetween: 7, targetDifficulty: { 20: 2, 40: 2.5, 60: 3.5, 80: 4 }, maxRecords: 8 };
const today = 100;
const rec = (extra) => ({ threshold: 40, status: "failed", snoozed_until: null, completed_on: null, ...extra });

describe("thresholdToOffer (checkpoint.test.ts)", () => {
  test("offers the highest threshold reached above those already passed", () => {
    assert.equal(P.thresholdToOffer(62, [], today, ZD), 60);
    assert.equal(P.thresholdToOffer(19, [], today, ZD), null);
    assert.equal(P.thresholdToOffer(62, [rec({ status: "passed", threshold: 60, completed_on: 66 })], today, ZD), null);
    assert.equal(P.thresholdToOffer(81, [rec({ status: "passed", threshold: 60, completed_on: 66 })], today, ZD), 80);
  });
  test("waits while a test is active and for 7 days after the last one", () => {
    assert.equal(P.thresholdToOffer(62, [rec({ status: "offered", snoozed_until: 102 })], today, ZD), null);
    assert.equal(P.thresholdToOffer(62, [rec({ status: "in_progress" })], today, ZD), null);
    assert.equal(P.thresholdToOffer(62, [rec({ threshold: 60, completed_on: 95 })], today, ZD), null);
    // Niezdany próg wraca po przerwie.
    assert.equal(P.thresholdToOffer(62, [rec({ threshold: 60, completed_on: 93 })], today, ZD), 60);
    assert.equal(P.isSnoozed({ snoozed_until: 101 }, today), true);
    assert.equal(P.isSnoozed({ snoozed_until: today }, today), false);
  });
});

describe("task choice (checkpoint.test.ts)", () => {
  test("mixes two levels for a fractional target", () => {
    assert.deepEqual(P.targetDifficulties(2.5, 5), [2, 2, 3, 3, 3]);
    assert.deepEqual(P.targetDifficulties(3.5, 5), [3, 3, 4, 4, 4]);
    assert.deepEqual(P.targetDifficulties(4, 5), [4, 4, 4, 4, 4]);
  });
  test("takes the nearest difficulty, one task per topic when possible, heavier topics first", () => {
    const t = (code, difficulty, topic) => ({ id: code, code, difficulty, topicIds: [topic] });
    const pool = [t("a", 2, "x"), t("b", 2, "x"), t("c", 2, "y"), t("d", 3, "z"), t("e", 5, "w")];
    assert.deepEqual(P.pickCheckpointTasks(pool, [2, 2, 3], { x: 0.5, y: 0.2, z: 0.3 }).map((p) => p.code), ["a", "c", "d"]);
    // Gdy tematy się skończą, temat może się powtórzyć.
    assert.deepEqual(P.pickCheckpointTasks(pool.slice(0, 2), [2, 2], {}).map((p) => p.code), ["a", "b"]);
  });
  test("passes with at least 4 points out of 5", () => {
    assert.equal(P.checkpointPassed([1, 1, 1, 1, 0], ZD), true);
    assert.equal(P.checkpointPassed([1, 1, 1, 0.5, 0], ZD), false);
  });
});

describe("calibration (learner-model.test.ts 6.7)", () => {
  test("asks at every 3rd task", () => {
    assert.deepEqual([0, 1, 2, 3].map(P.askConfidenceNow), [true, false, false, true]);
  });
  test("ta sama trafność co calibration() z learner.js (bundel Zdawalni)", () => {
    const ctx = {};
    vm.runInNewContext(fs.readFileSync(__dirname + "/../learner.js", "utf8") + ";this.L = SkrotLearner;", ctx);
    const L = ctx.L;
    assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(L.calibration.askConfidenceNow), [0, 1, 2, 3, 4, 5, 6].map(P.askConfidenceNow));
    // 14 „Pewny” (11 dobrze), 12 „Zgaduję” (5 dobrze).
    const answers = [], add = (confidence, n, good) => { for (let i = 0; i < n; i++) answers.push({ confidence, score: i < good ? 1 : 0 }); };
    add("sure", 14, 11); add("guess", 12, 5);
    let kal = null; for (const a of answers) kal = P.kalDodaj(kal, a.confidence === "sure" ? 1 : 0, a.score >= 1);
    const ref = L.calibration.calibration(answers, null), mine = P.kalibracja(kal);
    assert.equal(mine.n, ref.n);
    assert.equal(mine.sure, ref.value.sure);
    assert.equal(mine.guess, ref.value.guess);
  });
});

describe("Pewny / Zgaduję w Skrócie", () => {
  test("licznik i karta od 20 odpowiedzi", () => {
    let kal = null;
    for (let i = 0; i < 12; i++) kal = P.kalDodaj(kal, 1, i < 9);
    for (let i = 0; i < 7; i++) kal = P.kalDodaj(kal, 0, i < 2);
    let k = P.kalibracja(kal);
    assert.deepEqual(kal, { s: [12, 9], g: [7, 2] });
    assert.equal(k.n, 19); assert.equal(k.pokaz, false); assert.equal(k.brakuje, 1);
    assert.equal(k.sure, 0.75); assert.equal(k.guess, null); // „Zgaduję” poniżej 10 odpowiedzi: bez wyniku
    kal = P.kalDodaj(kal, 0, false);
    k = P.kalibracja(kal);
    assert.equal(k.pokaz, true); assert.equal(k.rada, "ok");
  });
  test("bez „Pewny” nie ma karty, nawet przy 20 odpowiedziach", () => {
    let kal = null; for (let i = 0; i < 20; i++) kal = P.kalDodaj(kal, 0, i % 2 === 0);
    assert.equal(P.kalibracja(kal).pokaz, false);
  });
  test("zepsuty zapis nie psuje licznika", () => {
    assert.deepEqual(P.kalDodaj({ s: "x", g: [3, 5] }, 1, true), { s: [1, 1], g: [0, 0] });
  });
  test("zgadnięta dobra odpowiedź idzie do rewanżu, pewna albo bez wyboru nie", () => {
    assert.equal(P.wynikDoRewanzu(true, 0), false);
    assert.equal(P.wynikDoRewanzu(true, 1), true);
    assert.equal(P.wynikDoRewanzu(true, undefined), true);
    assert.equal(P.wynikDoRewanzu(false, 1), false);
  });
});

describe("mini-sprawdzian w Skrócie (próg 70%, 6 pytań, 5 dobrze)", () => {
  test("karta: próg D7, za mało niewidzianych pytań → brak", () => {
    assert.deepEqual(P.karta({ pct: 0.7, records: [], today, unseen: 6 }), { state: "new", threshold: 70 });
    assert.equal(P.karta({ pct: 0.69, records: [], today, unseen: 40 }), null);
    assert.equal(P.karta({ pct: 0.9, records: [], today, unseen: 5 }), null);
  });
  test("Później ukrywa na 3 dni, potem wraca jako zaproponowany", () => {
    const r = P.odloz([], 70, today);
    assert.equal(P.karta({ pct: 0.8, records: r, today, unseen: 10 }), null);
    assert.equal(P.karta({ pct: 0.8, records: r, today: today + 2, unseen: 10 }), null);
    assert.deepEqual(P.karta({ pct: 0.8, records: r, today: today + 3, unseen: 10 }), { state: "offered", threshold: 70 });
    assert.equal(P.karta({ pct: 0.6, records: r, today: today + 3, unseen: 10 }), null);
  });
  test("w trakcie: zawsze „dokończ”, także gdy pula się skończyła", () => {
    const r = P.start(P.odloz([], 70, today), 70, ["z:a:1"], today);
    assert.equal(r.length, 1);
    assert.deepEqual(P.karta({ pct: 0.1, records: r, today, unseen: 0 }), { state: "in_progress", threshold: 70 });
    assert.deepEqual(P.porzuc(r), []);
  });
  test("zdany: odznaka, bez kolejnej propozycji; niezdany: tematy do powtórki i nowa szansa po 7 dniach", () => {
    let r = P.start([], 70, ["a", "b"], today);
    const ok = P.wynik([1, 1, 1, 1, 1, 0].map((x, i) => ({ id: "i" + i, topic: "t" + i, ok: !!x })));
    assert.deepEqual(ok, { ok: 5, tot: 6, passed: true, weak: ["t5"] });
    r = P.zakoncz(r, ok, today);
    assert.deepEqual(P.odznaka(r), { threshold: 70, completed_on: today });
    assert.equal(P.karta({ pct: 0.95, records: r, today: today + 30, unseen: 20 }), null);
    assert.deepEqual(P.doPowtorki(r, today), []);

    let f = P.start([], 70, ["a"], today);
    const bad = P.wynik([1, 0, 1, 0, 1, 1].map((x, i) => ({ id: "i" + i, topic: i < 2 ? "A" : "t" + i, ok: !!x })));
    assert.deepEqual(bad, { ok: 4, tot: 6, passed: false, weak: ["A", "t3"] });
    f = P.zakoncz(f, bad, today);
    assert.equal(P.odznaka(f), null);
    assert.deepEqual(P.doPowtorki(f, today + 3), ["A", "t3"]);
    assert.deepEqual(P.doPowtorki(f, today + 15), []);
    assert.equal(P.karta({ pct: 0.8, records: f, today: today + 6, unseen: 20 }), null);
    assert.deepEqual(P.karta({ pct: 0.8, records: f, today: today + 7, unseen: 20 }), { state: "new", threshold: 70 });
  });
  test("mniej niż 6 odpowiedzi nigdy nie zalicza", () => {
    assert.equal(P.wynik([1, 1, 1, 1, 1].map((x, i) => ({ id: "i" + i, topic: "t", ok: true }))).passed, false);
  });
  test("wybór: 6 pytań, każdy temat raz, gdy się da; ważniejsze tematy najpierw; deterministyczny dla ziarna", () => {
    const pool = [];
    for (const t of ["A", "B", "C", "D", "E", "F", "G"]) for (let i = 0; i < 3; i++) pool.push({ id: `z:${t}:${i}`, topic: t });
    const w = { G: 9, F: 8 };
    const a = P.wybierz(pool, { seed: 5, weights: w }), b = P.wybierz(pool, { seed: 5, weights: w });
    assert.equal(a.length, 6);
    assert.deepEqual(a, b);
    assert.equal(new Set(a.map((x) => x.topic)).size, 6);
    assert.deepEqual(a.slice(0, 2).map((x) => x.topic), ["G", "F"]);
    // Dwa tematy po 3 pytania: tematy się powtarzają, ale nadal 6 różnych pytań.
    const small = pool.filter((x) => x.topic === "A" || x.topic === "B");
    const s = P.wybierz(small, { seed: 1 });
    assert.equal(s.length, 6); assert.equal(new Set(s.map((x) => x.id)).size, 6);
    assert.deepEqual(P.wybierz(small.slice(0, 5), { seed: 1 }), []);
    // Duplikaty id liczą się raz.
    assert.deepEqual(P.wybierz([...small.slice(0, 5), small[0]], { seed: 1 }), []);
  });
  test("historia rekordów przycięta", () => {
    let r = [];
    for (let i = 0; i < 12; i++) { r = P.start(r, 70, ["x"], i * 10); r = P.zakoncz(r, { ok: 1, tot: 6, passed: false, weak: [] }, i * 10); }
    assert.equal(r.length, P.CONFIG.maxRecords);
  });
});
