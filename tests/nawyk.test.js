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

test("zasady serii: weekend na 2 zamrożeniach, 1 zamrożenie nie starczy, przerwa nie zrywa i nie dodaje dni", () => {
  const PON = 312; // poniedziałek 9.11.2026; seria do piątku 6.11
  const sk = { d: PON - 3, n: 10 };
  assert.deepEqual(L.seriaDalej(sk, PON, { ma: 2 }), { next: { d: PON, n: 11 }, uzyj: [PON - 2, PON - 1], przerwana: 0 });
  assert.deepEqual(L.seriaDalej(sk, PON, { ma: 1 }), { next: { d: PON, n: 1 }, uzyj: [], przerwana: 10 });
  assert.equal(L.seriaZywa(sk, PON, { ma: 2 }), true);
  assert.equal(L.seriaZywa(sk, PON, { ma: 1 }), false);
  assert.deepEqual(L.seriaDalej(sk, PON, { zamrozone: new Set([PON - 2, PON - 1]) }).uzyj, []);
  const s23 = { d: 356, n: 8 }, prz = (d) => d >= 357 && d <= 370; // 23.12 → przerwa 24.12–6.01
  assert.equal(L.seriaZywa(s23, 361, { przerwa: prz }), true, "28.12: seria czeka");
  assert.deepEqual(L.seriaDalej(s23, 371, { przerwa: prz }), { next: { d: 371, n: 9 }, uzyj: [], przerwana: 0 }, "7.01: +1, bez zamrożeń");
  assert.equal(L.seriaDalej({ d: 300, n: 5 }, 304, { ma: 2 }).next.n, 1, "3 opuszczone dni: za dużo");
  assert.equal(L.seriaDalej(sk, PON - 3), null);
  assert.equal(L.stanDnia(6, false, 19, { chroni: true }), "chroni");
  assert.equal(L.stanDnia(6, false, 19, { pauza: true }), "pauza");
  assert.equal(L.godzina(new Date(2026, 10, 6, 19, 5)), 19, "godzina w tej samej strefie co dayN (czas telefonu)");
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

test("dni przerw w SQL v55 (nauka_przerwa) = CAL_DEFAULT w index.html (okresy z „Przerwa” i dni wolne)", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const cal = JSON.parse(html.match(/const CAL_DEFAULT = (\{.*\});/)[1]);
  const sql = fs.readFileSync(path.join(__dirname, "..", "supabase", "skrot-v55-seria-zamrozenia.sql"), "utf8");
  const fn = sql.slice(sql.indexOf("function public.nauka_przerwa"), sql.indexOf("$$;", sql.indexOf("function public.nauka_przerwa")));
  const wolne = [...fn.match(/array\[([^\]]*)\]/)[1].matchAll(/'(\d{4}-\d\d-\d\d)'/g)].map((m) => m[1]).sort();
  const okresy = [...fn.matchAll(/between date '([\d-]+)' and date '([\d-]+)'/g)].map((m) => [m[1], m[2]]);
  assert.deepEqual(wolne, Object.keys(cal.wolne).sort());
  assert.deepEqual(okresy, cal.okresy.filter((o) => /przerwa/i.test(o.opis)).map((o) => [o.od, o.do]));
});

test("naprawa serii wysiłkiem: seria ≥ 3, 2–4 opuszczone dni, 2 dni nauki z rzędu → n + 2, raz na 30 dni", () => {
  const t = 320, c = { przerwa: () => false };
  const p = { streak: { d: t - 4, n: 12 } }; // 3 opuszczone dni
  assert.deepEqual(L.naprawaMozna(p, t, c), { n: 12 });
  assert.equal(L.naprawaMozna({ streak: { d: t - 2, n: 12 } }, t, c), null, "1 opuszczony dzień: to zwykła seria");
  assert.equal(L.naprawaMozna({ streak: { d: t - 6, n: 12 } }, t, c), null, "5 dni: za długo");
  assert.equal(L.naprawaMozna({ streak: { d: t - 4, n: 2 } }, t, c), null, "seria < 3");
  assert.equal(L.naprawaMozna({ ...p, streakRepairAt: t - 10 }, t, c), null, "raz na 30 dni");
  const k1 = L.naprawaKrok(p, t, c);
  assert.deepEqual(k1, { streakRepair: { n: 12, od: t, dni: [t] } });
  const k2 = L.naprawaKrok({ streak: { d: t, n: 1 }, streakRepair: k1.streakRepair }, t + 1, c);
  assert.deepEqual(k2, { streak: { d: t + 1, n: 14 }, streakRepair: null, streakRepairAt: t + 1, odzyskana: 14 });
  assert.deepEqual(L.naprawaKrok({ streak: { d: t, n: 1 }, streakRepair: k1.streakRepair }, t + 2, c), { streakRepair: null, nieudana: 12 }, "przerwa w naprawie: przepada, ale z komunikatem");
});

test("godzina przypomnienia z planu: koniec + 60 min, w górę do 30 min, najpóźniej 21:00; bez planu 18:00", () => {
  assert.equal(L.godzinaZPlanu(15 * 60 + 15), 16 * 60 + 30, "15:15 → 16:15 → 16:30");
  assert.equal(L.godzinaZPlanu(17 * 60), 18 * 60, "17:00 → 18:00");
  assert.equal(L.godzinaZPlanu(20 * 60 + 30), 21 * 60, "20:30 → 21:30 → 21:00");
  assert.equal(L.godzinaZPlanu(null), 18 * 60);
});
