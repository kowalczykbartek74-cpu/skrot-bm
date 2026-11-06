// Etap 10: paczka i duet (paczka.js). Pierwsze bloki = testy z matura-app tests/unit/squad.test.ts i duo.test.ts
// (bez rankingu i szturchnięć, których w Skrócie nie ma), dalej to, co dokłada Skrót.
const test = require("node:test");
const assert = require("node:assert/strict");
const P = require("../paczka.js");

test("squad week: cel = 70% zaplanowanych sesji wszystkich, jedna wspólna liczba", () => {
  assert.deepEqual(P.squadWeek([{ planned: 5, done: 2 }, { planned: 4, done: 4 }, { planned: 0, done: 1 }]), { goal: 7, done: 7, reached: true });
  assert.deepEqual(P.squadWeek([{ planned: 0, done: 0 }]), { goal: 0, done: 0, reached: false });
});

test("squad history: tydzień bez planu nie przerywa serii", () => {
  const weeks = {
    "2026-11-02": [{ planned: 4, done: 3 }],
    "2026-11-09": [{ planned: 0, done: 0 }],
    "2026-11-16": [{ planned: 4, done: 4 }],
    "2026-11-23": [{ planned: 4, done: 1 }],
  };
  const h = P.squadHistory("2026-11-04", "2026-11-25", (w) => weeks[w] || []);
  assert.deepEqual(h, { reachedWeeks: ["2026-11-02", "2026-11-16"], streak: 2 });
});

test("kody wpisane ze spacjami, myślnikami albo małymi literami", () => {
  assert.equal(P.normalizeSquadCode(" ab3-k9z "), "AB3K9Z");
  assert.equal(P.normalizeSquadCode("abc"), null);
  assert.equal(P.normalizeSquadCode(null), null);
});

test("duoQuest: sumuje sesje obu osób w tym tygodniu", () => {
  const r = P.duoQuest({ today: "2026-10-14", since: "2026-10-01", target: 10,
    mine: [{ day: "2026-10-12", count: 2 }, { day: "2026-10-14", count: 1 }], theirs: [{ day: "2026-10-13", count: 3 }] });
  assert.deepEqual({ ...r.week }, { mine: 3, theirs: 3, target: 10, complete: false, daysLeft: 5 });
  assert.deepEqual(r.awards, []);
});

test("duoQuest: nagroda dla obu w dniu osiągnięcia celu, raz w tygodniu", () => {
  const r = P.duoQuest({ today: "2026-10-18", since: "2026-10-01", target: 10, points: 40,
    mine: [{ day: "2026-10-12", count: 4 }, { day: "2026-10-16", count: 3 }], theirs: [{ day: "2026-10-14", count: 3 }, { day: "2026-10-17", count: 5 }] });
  assert.deepEqual(r.awards, [{ day: "2026-10-16", points: 40, label: P.DUO_LABEL }]);
  assert.equal(r.week.complete, true);
});

test("duoQuest: sesje sprzed powstania pary się nie liczą", () => {
  const r = P.duoQuest({ today: "2026-10-14", since: "2026-10-14", mine: [{ day: "2026-10-12", count: 9 }], theirs: [{ day: "2026-10-14", count: 1 }] });
  assert.equal(r.week.mine, 0);
  assert.equal(r.week.theirs, 1);
});

test("Skrót: domyślny cel duetu 8 sesji i 20 monet, jak nauka_paczka_cfg() w SQL v37", () => {
  const fs = require("node:fs");
  const sql = fs.readFileSync(__dirname + "/../supabase/skrot-v37-paczka.sql", "utf8");
  for (const k of Object.keys(P.CFG)) {
    const m = new RegExp("'" + k + "',\\s*([0-9.]+)").exec(sql);
    assert.ok(m, k);
    assert.equal(Number(m[1]), P.CFG[k], k);
  }
  const r = P.duoQuest({ today: "2026-11-08", since: "2026-11-02", mine: [1, 2, 3, 4].map((d) => ({ day: "2026-11-0" + (d + 1), count: 1 })),
    theirs: [5, 6, 7, 8].map((d) => ({ day: "2026-11-0" + d, count: 1 })) });
  assert.deepEqual(r.awards, [{ day: "2026-11-08", points: 20, label: "Duet tygodnia" }]);
});

test("tydzień pon–nd w czasie polskim, niezależnie od strefy urządzenia", () => {
  assert.equal(P.startOfWeek("2026-11-05"), "2026-11-02");
  assert.equal(P.startOfWeek("2026-11-08"), "2026-11-02"); // niedziela
  assert.equal(P.startOfWeek("2026-11-09"), "2026-11-09");
  // niedziela 23:30 w Polsce = 22:30 UTC: dalej ten sam tydzień; poniedziałek 0:30 w Polsce = niedziela 23:30 UTC: nowy tydzień
  assert.equal(P.tydzienWarszawa(new Date("2026-11-08T22:30:00Z")), "2026-11-02");
  assert.equal(P.tydzienWarszawa(new Date("2026-11-08T23:30:00Z")), "2026-11-09");
  // zmiana czasu (koniec marca, CEST): 0:30 w Polsce = 22:30 UTC dzień wcześniej
  assert.equal(P.dzisWarszawa(new Date("2026-03-29T22:30:00Z")), "2026-03-30");
  assert.equal(P.dniDoKonca("2026-11-02"), 7);
  assert.equal(P.dniDoKonca("2026-11-08"), 1);
});

test("wspólny cel paczki: 3 dni na osobę × 70%", () => {
  assert.deepEqual(P.celPaczki([{ dni: 2 }, { dni: 1 }]), { cel: 5, zrobione: 3, gotowe: false, proc: 60, brakuje: 2 });
  assert.deepEqual(P.celPaczki([{ dni: 3 }, { dni: 2 }, { dni: 4 }]), { cel: 7, zrobione: 9, gotowe: true, proc: 100, brakuje: 0 });
  // 0.7 × 30 = 21 (bez błędu zaokrąglenia liczb zmiennoprzecinkowych)
  assert.equal(P.celPaczki(Array.from({ length: 10 }, () => ({ dni: 0 }))).cel, 21);
  assert.equal(P.celPaczki(Array.from({ length: 8 }, () => ({ dni: 0 }))).cel, 17);
  // liczby z bazy wygrywają
  assert.equal(P.celPaczki([{ dni: 1 }, { dni: 1 }], { plan_dni: 5, udzial: 0.5 }).cel, 5);
});

test("postęp duetu i zdanie", () => {
  const p = P.postepDuetu({ moje: 3, jego: 2, cel: 8 }, "2026-11-05");
  assert.deepEqual(p, { moje: 3, jego: 2, suma: 5, cel: 8, gotowe: false, brakuje: 3, proc: 63, dniDoKonca: 4 });
  assert.equal(P.opisDuetu(p), "Razem 5/8 sesji. Brakuje 3, do niedzieli dni: 4.");
  const g = P.postepDuetu({ moje: 5, jego: 4, cel: 8 });
  assert.equal(g.proc, 100);
  assert.equal(P.opisDuetu(g), "Cel osiągnięty: 9/8 sesji.");
});

test("nazwa, link i kod z adresu", () => {
  assert.equal(P.nazwa({ nick: " Ola " }, 0), "Ola");
  assert.equal(P.nazwa({ nick: null }, 2), "Osoba 3");
  assert.equal(P.link("ab3-k9z"), "https://zdawalni.pl/?paczka=AB3K9Z");
  assert.equal(P.link("x"), null);
  assert.equal(P.kodZAdresu("?paczka=ab3k9z"), "AB3K9Z");
  assert.equal(P.kodZAdresu("?z=ig&paczka=AB3-K9Z&x=1"), "AB3K9Z");
  assert.equal(P.kodZAdresu("?paczka=%20ab3k9z"), "AB3K9Z");
  assert.equal(P.kodZAdresu("?paczka=<script>"), null);
  assert.equal(P.kodZAdresu(""), null);
});
