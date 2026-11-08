// Testy panel-kierunkow.js (Panel kierunków administratora): node --test tests/*.test.js
const test = require("node:test");
const assert = require("node:assert");
const P = require("../panel-kierunkow.js");

const BM = "wefiz-bm-1-st-2026", ZARZ = "wefiz-zarz-1-st-2026";
const D = {
  materials: [
    { id: "m1", rocznik_id: BM, data: { subjectId: "makroekonomia", title: "PKB", kind: "lesson", order: 2, quizCount: 10, flashcardCount: 5, createdAt: 10 } },
    { id: "m0", rocznik_id: BM, data: { subjectId: "makroekonomia", title: "Wstęp", kind: "lesson", order: 1, quizCount: 4, flashcardCount: 2, createdAt: 5 } },
    { id: "m2", rocznik_id: BM, data: { subjectId: "makroekonomia", title: "Slajdy 1", quizCount: 0, flashcardCount: 3, createdAt: 30 } },
    { id: "m3", rocznik_id: BM, data: { subjectId: "przedmiot-spoza-planu", title: "Coś", source: "sylabus", quizCount: 2, createdAt: 20 } },
    { id: "z1", rocznik_id: ZARZ, data: { subjectId: "podstawy-zarzadzania", title: "Funkcje zarządzania", kind: "lesson", quizCount: 6, flashcardCount: 4, createdAt: 40 } },
  ],
  materialSimple: [{ id: "m1", rocznik_id: BM }, { id: "z1", rocznik_id: ZARZ }],
  quizWhy: [{ id: "m1", rocznik_id: BM }],
  deadlines: [
    { id: "d1", rocznik_id: BM, data: { title: "Kolokwium", subjectId: "makroekonomia", date: "2026-12-10" } },
    { id: "d2", rocznik_id: BM, data: { title: "Stare", subjectId: "makroekonomia", date: "2026-10-01" } },
    { id: "d3", rocznik_id: ZARZ, data: { title: "Test Zarz", subjectId: "podstawy-zarzadzania", date: "2026-11-20" } },
  ],
  announcements: [{ id: "a1", rocznik_id: BM, data: { text: "Stare", createdAt: 1 } }, { id: "a2", rocznik_id: BM, data: { text: "Nowe", createdAt: 9 } }],
  exams: [{ id: "makroekonomia-1", rocznik_id: BM }], examBank: [], glossary: [{ id: "x@" + ZARZ, rocznik_id: ZARZ }], tasks: [],
};
const PLAN = { groups: { C111: { odd: [{ pl: "Makroekonomia", en: "Macroeconomics", k: "W" }, { pl: "Ochrona własności intelektualnej", en: "Intelectual Property", k: "W" }], even: [{ pl: "Okno", k: "X" }] } } };

test("slug jak w index.html", () => {
  assert.strictEqual(P.slug("Ochrona własności intelektualnej"), "ochrona-wlasnosci-intelektualnej");
  assert.strictEqual(P.slug("Podstawy zarządzania"), "podstawy-zarzadzania");
});

test("przedmioty z planu: bez okienek, alfabetycznie, poprawiona literówka EN", () => {
  const s = P.przedmiotyZPlanu(PLAN);
  assert.deepStrictEqual(s.map((x) => x.id), ["makroekonomia", "ochrona-wlasnosci-intelektualnej"]);
  assert.strictEqual(s[1].en, "Intellectual Property");
  assert.deepStrictEqual(P.przedmiotyZPlanu(null), []);
});

test("podsumowanie liczy tylko swój rocznik", () => {
  const b = P.podsumowanie(D, BM, "2026-11-08");
  assert.strictEqual(b.materialy, 4);
  assert.strictEqual(b.lekcje, 2);
  assert.strictEqual(b.pliki, 2);
  assert.strictEqual(b.pytania, 16);
  assert.strictEqual(b.fiszki, 10);
  assert.strictEqual(b.prosciej, 1);
  assert.strictEqual(b.zQuizem, 3);
  assert.strictEqual(b.dlaczego, 1);
  assert.strictEqual(b.terminy, 2);
  assert.strictEqual(b.terminyNadchodzace, 1);
  assert.strictEqual(b.ogloszenia, 2);
  assert.strictEqual(b.kolokwia, 1);
  assert.strictEqual(b.slowniczki, 0);
  const z = P.podsumowanie(D, ZARZ, "2026-11-08");
  assert.strictEqual(z.materialy, 1);
  assert.strictEqual(z.terminyNadchodzace, 1);
  assert.strictEqual(z.ogloszenia, 0);
  assert.strictEqual(z.slowniczki, 1);
  const pusty = P.podsumowanie({}, "wefiz-fir-1-st-2026", "2026-11-08");
  assert.strictEqual(pusty.materialy, 0);
  assert.strictEqual(pusty.ostatniMaterial, null);
});

test("wiersze bez rocznika widzą wszystkie roczniki (jak makeDb)", () => {
  const x = { announcements: [{ id: "w", rocznik_id: null, data: { text: "Wspólne", createdAt: 1 } }] };
  assert.strictEqual(P.podsumowanie(x, BM).ogloszenia, 1);
  assert.strictEqual(P.podsumowanie(x, ZARZ).ogloszenia, 1);
});

test("przedmioty: plan + spoza planu, lekcje po kolejności, braki", () => {
  const s = P.przedmioty(D, BM, P.przedmiotyZPlanu(PLAN), "2026-11-08");
  assert.deepStrictEqual(s.map((x) => x.id), ["makroekonomia", "ochrona-wlasnosci-intelektualnej", "przedmiot-spoza-planu"]);
  const mak = s[0];
  assert.deepStrictEqual(mak.materialy.map((m) => m.id), ["m0", "m1", "m2"]);
  assert.strictEqual(mak.lekcje, 2);
  assert.strictEqual(mak.pliki, 1);
  assert.strictEqual(mak.bezProsciej, 2);
  assert.strictEqual(mak.bezDlaczego, 1);
  assert.strictEqual(mak.terminy, 1);
  assert.strictEqual(s[1].pusty, true);
  assert.strictEqual(s[2].wPlanie, false);
  assert.strictEqual(s[2].pl, "Przedmiot spoza planu");
  assert.strictEqual(s[2].materialy[0].zrodlo, "sylabus");
});

test("najbliższe terminy i ostatnie ogłoszenia", () => {
  assert.deepStrictEqual(P.nadchodzace(D, BM, "2026-11-08", 5).map((t) => t.id), ["d1"]);
  assert.deepStrictEqual(P.ogloszenia(D, BM, 3).map((a) => a.text), ["Nowe", "Stare"]);
  assert.deepStrictEqual(P.ogloszenia(D, ZARZ, 3), []);
});

test("adres po przełączeniu", () => {
  assert.strictEqual(P.adresPo({ material: "z1" }), "#/material/z1");
  assert.strictEqual(P.adresPo({ przedmiot: "podstawy-zarzadzania" }), "#/subject/podstawy-zarzadzania");
  assert.strictEqual(P.adresPo({ widok: "terms" }), "#/terms");
  assert.strictEqual(P.adresPo({ widok: "javascript:alert(1)" }), "#/home");
  assert.strictEqual(P.adresPo(null), "#/home");
});

test("roczniki z danych", () => {
  assert.deepStrictEqual(P.rocznikiZDanych(D), [BM, ZARZ]);
});

// GitHub Pages (Jekyll) pomija wpisy z _config.yml → exclude, a także każdy plik, którego ścieżka ZACZYNA SIĘ od wpisu
// (EntryFilter: start_with?). 8.11.2026 „kierunki-panel.js” nie trafił na stronę przez wpis „kierunki”.
test("każdy lokalny skrypt i plik z index.html jest publikowany (nie wpada w exclude z _config.yml)", () => {
  const fs = require("fs"), path = require("path");
  const root = path.join(__dirname, "..");
  const ex = fs.readFileSync(path.join(root, "_config.yml"), "utf8").split("\n").map((l) => (/^\s*-\s*(\S+)/.exec(l) || [])[1]).filter(Boolean);
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const pliki = [...html.matchAll(/<script src="([^"?:]+)(?:\?[^"]*)?"/g)].map((m) => m[1]);
  assert.ok(pliki.includes("panel-kierunkow.js"));
  const zle = pliki.filter((f) => ex.some((e) => f.startsWith(e)));
  assert.deepStrictEqual(zle, []);
});
