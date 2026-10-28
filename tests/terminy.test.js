// Testy logiki zakładki Terminy: node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");
const T = require("../terminy.js");

const ids = (groups) => groups.map((g) => g.id);
const it = (date, extra = {}) => ({ key: "k" + Math.random(), src: "dl", title: "T", kind: "kolokwium", date, ...extra });

test("strefa Europe/Warsaw: dzień zmienia się o północy w Polsce, nie w UTC", () => {
  // 28.10.2026 (po zmianie czasu, UTC+1): 23:30 UTC to już 29.10 w Warszawie
  assert.equal(T.zoneKey(Date.UTC(2026, 9, 28, 23, 30)), "2026-10-29");
  assert.equal(T.zoneKey(Date.UTC(2026, 9, 28, 22, 59)), "2026-10-28");
  // lato (UTC+2): 22:30 UTC 15.07 to 16.07 w Warszawie
  assert.equal(T.zoneKey(Date.UTC(2026, 6, 15, 22, 30)), "2026-07-16");
  assert.equal(T.zoneMinutes(Date.UTC(2026, 9, 28, 9, 15)), 10 * 60 + 15);
});

test("diffDays nie gubi dnia przy zmianie czasu", () => {
  assert.equal(T.diffDays("2026-10-24", "2026-10-26"), 2); // zmiana czasu 25.10
  assert.equal(T.diffDays("2027-03-27", "2027-03-29"), 2); // zmiana czasu 28.03
  assert.equal(T.addDays("2026-10-31", 1), "2026-11-01");
});

test("tydzień od poniedziałku: środa", () => {
  const today = "2026-10-28"; // środa
  assert.equal(T.weekday(today), 2);
  assert.equal(T.bucketOf("2026-10-28", today).kind, "week"); // dziś
  assert.equal(T.bucketOf("2026-11-01", today).kind, "week"); // niedziela tego tygodnia
  assert.equal(T.bucketOf("2026-11-02", today).kind, "next"); // poniedziałek
  assert.equal(T.bucketOf("2026-11-08", today).kind, "next"); // niedziela następnego
  assert.equal(T.bucketOf("2026-11-09", today).kind, "mon");
  assert.equal(T.bucketOf("2026-10-27", today).kind, "late");
  assert.equal(T.bucketOf(null, today).kind, "nodate");
  assert.equal(T.bucketOf("", today).kind, "nodate");
});

test("granice tygodnia: niedziela i poniedziałek jako dziś", () => {
  // niedziela: ten tydzień to tylko dzisiaj, jutro (poniedziałek) już następny
  assert.equal(T.bucketOf("2026-11-01", "2026-11-01").kind, "week");
  assert.equal(T.bucketOf("2026-11-02", "2026-11-01").kind, "next");
  assert.equal(T.bucketOf("2026-11-08", "2026-11-01").kind, "next");
  assert.equal(T.bucketOf("2026-11-09", "2026-11-01").kind, "month");
  // poniedziałek: cały tydzień do niedzieli
  assert.equal(T.bucketOf("2026-11-08", "2026-11-02").kind, "week");
  assert.equal(T.bucketOf("2026-11-09", "2026-11-02").kind, "next");
});

test("reszta bieżącego miesiąca i kolejne miesiące; dalsze niż 2 miesiące zwinięte", () => {
  const today = "2026-10-05"; // poniedziałek
  const g = T.groupByTime([it("2026-10-30"), it("2026-11-20"), it("2026-12-01"), it("2027-01-15"), it("2026-10-05"), it(null), it("2026-10-01")], today);
  assert.deepEqual(ids(g), ["late", "week", "month", "m:2026-11", "m:2026-12", "m:2027-01", "nodate"]);
  assert.deepEqual(g.map((x) => x.far), [false, false, false, false, false, true, false]);
});

test("tydzień przechodzący na kolejny miesiąc zostaje tygodniem", () => {
  const g = T.groupByTime([it("2026-11-01"), it("2026-11-05")], "2026-10-28");
  assert.deepEqual(ids(g), ["week", "next"]);
});

test("w sekcji: kolejność po dacie i godzinie", () => {
  const g = T.groupByTime([it("2026-10-30", { time: "12:00", title: "b" }), it("2026-10-30", { time: "08:00", title: "a" }), it("2026-10-29", { title: "c" })], "2026-10-28");
  assert.deepEqual(g[0].items.map((x) => x.title), ["c", "a", "b"]);
});

test("forMe: grupa i lab", () => {
  const me = { group: "C112", sub: "B" };
  assert.equal(T.forMe([], [], me), true);
  assert.equal(T.forMe(undefined, undefined, me), true);
  assert.equal(T.forMe(["C111"], [], me), false);
  assert.equal(T.forMe(["C111", "C112"], ["B"], me), true);
  assert.equal(T.forMe(["C112"], ["A"], me), false);
  assert.equal(T.forMe(["C112"], ["A"], { group: "C112", sub: "" }), true); // oba laby
  assert.equal(T.forMe(["C112"], [], { group: "", sub: null }), false); // grupa niewybrana
  assert.equal(T.forMe([], ["A"], { group: "C112", sub: null }), false); // lab niewybrany
});

test("mergeDupes: ten sam termin dla kilku grup = jedna karta z tagami", () => {
  const a = it("2026-12-10", { key: "dl:1", title: "Projekt grupowy z analizy danych (lab B)", groups: ["C112"], subs: ["B"], obj: { id: 1 } });
  const b = it("2026-12-10", { key: "dl:2", title: "Projekt grupowy z analizy  danych (lab B)", groups: ["C111"], subs: ["B"], obj: { id: 2 }, done: true });
  const c = it("2026-12-10", { key: "dl:3", title: "Projekt grupowy z analizy danych (lab B)", groups: ["C113"], subs: ["A"], obj: { id: 3 } });
  const m = T.mergeDupes([a, b, c]);
  assert.equal(m.length, 2); // inny lab = osobna karta
  assert.deepEqual(m[0].groups, ["C111", "C112"]);
  assert.deepEqual(m[0].keys, ["dl:1", "dl:2"]);
  assert.equal(m[0].objs.length, 2);
  assert.equal(m[0].done, true);
  assert.deepEqual(a.groups, ["C112"]); // wejście bez zmian
});

test("mergeDupes: wpis dla całego roku wygrywa; inna data nie scala", () => {
  const m = T.mergeDupes([it("2026-12-10", { key: "a", groups: ["C111"] }), it("2026-12-10", { key: "b", groups: [] }), it("2026-12-11", { key: "c", groups: ["C111"] })]);
  assert.equal(m.length, 2);
  assert.deepEqual(m[0].groups, []);
});

test("urgency i minutesLeft", () => {
  assert.equal(T.urgency(-1), "late");
  assert.equal(T.urgency(0), "red");
  assert.equal(T.urgency(3), "red");
  assert.equal(T.urgency(4), "amber");
  assert.equal(T.urgency(7), "amber");
  assert.equal(T.urgency(8), "calm");
  assert.equal(T.urgency(null), "none");
  assert.equal(T.minutesLeft("14:30", 11 * 60), 210);
  assert.equal(T.minutesLeft("08:00", 9 * 60), null);
  assert.equal(T.minutesLeft("", 0), null);
});

test("monthCounts: tylko bieżący miesiąc od dziś, bez zrobionych", () => {
  const cat = (k) => (k === "zadanie" ? "zad" : "zal");
  const c = T.monthCounts([it("2026-10-30"), it("2026-10-29", { kind: "zadanie" }), it("2026-10-29", { kind: "zadanie", done: true }), it("2026-10-27"), it("2026-11-02"), it(null)], "2026-10-28", cat);
  assert.deepEqual(c, { zal: 1, zad: 1 });
});
