// Testy logiki nawyk.js (pętla UX-2): stan pigułki serii, cel dnia, dni nauki, kalendarz, ekran „Seria +1”,
// oraz to, że każdy polski tekst z nawyk.js ma parę EN w i18n-en.js.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const N = require("../nawyk.js");
const { L, PL } = N;

const T = 309; // piątek 6.11.2026 (dayN)

test("dzień tygodnia od poniedziałku: 1.01.2026 czwartek, 6.11.2026 piątek, 2.11.2026 poniedziałek", () => {
  assert.equal(L.dow(0), 3);
  assert.equal(L.dow(T), 4);
  assert.equal(L.poniedzialek(T), 305);
  assert.equal(L.dow(305), 0);
});

test("stan pigułki: szary bez nauki dziś, ryzyko od 18:00, pełny po nauce, brak bez serii", () => {
  assert.equal(L.stanDnia(6, false, 17), "todo");
  assert.equal(L.stanDnia(6, false, 18), "risk");
  assert.equal(L.stanDnia(6, false, 23), "risk");
  assert.equal(L.stanDnia(6, true, 19), "done");
  assert.equal(L.stanDnia(0, false, 19), "none");
  assert.equal(L.stanDnia(1, true, 9), "done");
});

test("cel dnia: XP tylko z dzisiejszego dnia, cel 30", () => {
  assert.deepEqual(L.celDnia({ xp: { t: 500, d: T, n: 18 } }, T), { xp: 18, cel: 30 });
  assert.deepEqual(L.celDnia({ xp: { t: 500, d: T - 1, n: 40 } }, T), { xp: 0, cel: 30 });
  assert.deepEqual(L.celDnia({}, T), { xp: 0, cel: 30 });
  assert.equal(L.GOAL, 30);
});

test("dni nauki: progress.nd + ostatni dzień XP; bez nd przybliżenie z serii z pominięciem zamrożeń i przerw", () => {
  const a = L.dniNauki({ nd: [300, 301, 305], xp: { d: T, n: 5 } });
  assert.deepEqual([...a].sort((x, y) => x - y), [300, 301, 305, T]);
  const b = L.dniNauki({ streak: { d: 308, n: 4 } }, [306], (d) => d === 305);
  assert.deepEqual([...b].sort((x, y) => x - y), [303, 304, 307, 308]);
});

test("seriaPatch: dopisuje dzisiejszy dzień raz, trzyma 120 dni, podbija najlepszą serię", () => {
  const p1 = L.seriaPatch({ nd: [10, 200, 300], streakBest: 4 }, T, { d: T, n: 7 });
  assert.deepEqual(p1.nd, [200, 300, T]);
  assert.equal(p1.streakBest, 7);
  assert.equal(L.seriaPatch({ nd: [T], streakBest: 9, streak: { d: T, n: 3 } }, T, null), null);
  const p2 = L.seriaPatch({}, T, { d: T, n: 1 });
  assert.deepEqual(p2, { nd: [T], streakBest: 1 });
});

test("kalendarz 4 tygodni: od poniedziałku 3 tygodnie wstecz, stany dni i dziś", () => {
  const cal = L.kalendarz(T, 4, new Set([308, 307]), [306], (d) => d === 305);
  assert.equal(cal.length, 4);
  assert.equal(cal[0][0].d, 305 - 21);
  const last = cal[3];
  assert.deepEqual(last.map((c) => c.s), ["przerwa", "zamroz", "nauka", "nauka", "brak", "przyszly", "przyszly"]);
  assert.equal(last[4].dzis, true);
});

test("kamienie milowe 3/7/14/30/50/100 i następny", () => {
  assert.deepEqual(L.KAMIENIE, [3, 7, 14, 30, 50, 100]);
  assert.ok(L.kamien(7) && L.kamien(100) && !L.kamien(8));
  assert.equal(L.nastepnyKamien(0), 3);
  assert.equal(L.nastepnyKamien(7), 14);
  assert.equal(L.nastepnyKamien(100), null);
});

test("ekran „Seria +1”: tylko gdy seria przedłużona dziś i jeszcze nie pokazany dziś", () => {
  assert.equal(L.pokazacEkran({ streak: { d: T, n: 7 } }, T, null, "2026-11-06"), true);
  assert.equal(L.pokazacEkran({ streak: { d: T, n: 7 } }, T, "2026-11-06", "2026-11-06"), false);
  assert.equal(L.pokazacEkran({ streak: { d: T - 1, n: 7 } }, T, null, "2026-11-06"), false);
  assert.equal(L.pokazacEkran({}, T, null, "2026-11-06"), false);
});

test("każdy polski tekst z nawyk.js ma parę EN w i18n-en.js (exact)", () => {
  const src = fs.readFileSync(path.join(__dirname, "..", "i18n-en.js"), "utf8");
  let dict = null;
  const win = { SKROT_I18N: { load: (d) => { dict = d; } } };
  new Function("window", src)(win);
  const exact = dict.exact;
  const brak = Object.values(PL).filter((v) => !(v in exact));
  assert.deepEqual(brak, []);
  // Słowa z plural(): „dzień” i „dzień z rzędu” mają formy EN.
  assert.ok(dict.plural["dzień"]);
  assert.ok(exact["dzień z rzędu"] && exact["dni z rzędu"]);
});
