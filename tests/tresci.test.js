// Testy jakości treści (etap 12): port zdawalni-web/tests (no-invented-values, copy-forbidden, copy-gender,
// lesson-content, contrast) na Skrót. Stałe pliki strony + komenda scripts/tresci-kontrola.mjs na lekcjach testowych.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const T = require("../scripts/tresci.js");

const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const FORBIDDEN = T.loadForbidden();

test("wartości: łapie kwoty, procenty, daty, lata, artykuły i duże liczby", () => {
  for (const [s, typ] of [["199 zł", "kwota"], ["$5 bn", "kwota"], ["35%", "procent"], ["2 p.p.", "procent"], ["do 23.10", "data"], ["od 1.03.2027", "data"],
    ["1 marca 2027", "data"], ["w 2008 r.", "rok"], ["art. 415 k.c.", "artykuł"], ["§ 2", "artykuł"], ["art. 30a ust. 1 pkt 3", "artykuł"], ["PKB 12 500 000", "liczba"]]) {
    const h = T.valueHits(s);
    assert.ok(h.some((x) => x.typ === typ), `${s} → ${typ}: ${JSON.stringify(h)}`);
  }
  for (const s of ["Masz 3 z 8 kawałków", "klasa 4", "rozdział 2", "\\(x^2 = 1000\\)", "po 3 latach", "część 1"]) assert.deepEqual(T.valueHits(s), [], s);
  assert.equal(T.valueHits("art. 30a ust. 1 pkt 3")[0].tekst, "art. 30a ust. 1 pkt 3");
});

test("zakazane frazy: obietnice wyniku i zawstydzanie, z wyjątkami jak w Zdawalni", () => {
  const hit = (s, z = "lekcje") => T.forbiddenHits(s, FORBIDDEN, z).length > 0;
  for (const s of ["Na pewno zdasz kolokwium.", "Zdasz na 100%!", "Gwarantujemy zaliczenie.", "100% skuteczności", "Nie umiesz tego.", "Słabo ci idzie.",
    "You will definitely pass the exam.", "guaranteed pass", "Zaliczysz bez nauki", "Wstyd!", "Pewna piątka", "Majturek podpowiada"]) assert.ok(hit(s), s);
  for (const s of ["To temat, którego jeszcze nie umiesz.", "Gwarancja jakości (art. 577 k.c.) to pojęcie prawa.", "Bank guarantee is a promise of the bank.",
    "Na dziś wystarczy.", "Skrót nie gwarantuje zaliczenia.", "We do not guarantee a pass."]) assert.ok(!hit(s), s);
  assert.ok(hit("Gwarantujemy, że będzie dobrze.", "strona"));
  assert.ok(!hit("Nie gwarantują zaliczenia ani wyniku.", "strona"));
});

test("lista zakazanych: każda pozycja ma powód, zakres i działający wzorzec", () => {
  const j = JSON.parse(read("scripts/tresci-zakazane.json"));
  assert.ok(j.frazy.length >= 10);
  for (const f of j.frazy) {
    assert.ok((f.dlaczego || "").length > 10, f.fraza);
    assert.ok(Array.isArray(f.zakres) && f.zakres.length && f.zakres.every((z) => z === "lekcje" || z === "strona"), f.fraza);
    assert.doesNotThrow(() => new RegExp(f.wzorzec || "x", "giu"), f.fraza);
  }
});

test("płeć: łapie formy zależne od płci, przepuszcza neutralne", () => {
  for (const s of ["Zrobiłeś to", "zrobiłaś", "Byłbyś", "byłabyś", "Jesteś gotowy?", "gotowa", "Zrozumiałem", "Jesteś pewna?"]) assert.ok(T.genderHits(s).length, s);
  for (const s of ["Gotowe!", "Udało się", "masz 3 z 4", "gotowość", "pod stołem", "celem lekcji", "kapitałem"]) assert.deepEqual(T.genderHits(s), [], s);
});

test("matematyka: rachunki w tekście liczone ponownie", () => {
  const ok = (s) => T.arithmetic(s).map((r) => r.ok);
  assert.deepEqual(ok("3 × 25 zł = 75 zł"), [true]);
  assert.deepEqual(ok("2 + 3 · 4 = 14"), [true]);
  assert.deepEqual(ok("2 + 3 · 4 = 20"), [false]);
  assert.deepEqual(ok("Po roku: 1000 · 1,05 = 1050 zł, po dwóch: 1050 · 1,05 = 1105 zł"), [true, false]);
  assert.deepEqual(ok("10 · 1,05 = 10,5 · 1,05 = 11,025"), [true]);
  assert.deepEqual(ok("1000 · 1,05 ≈ 1050"), [true]);
  assert.deepEqual(ok("Koszt 30 zł + 80 zł = 110 zł."), [true]);
  // nie zgaduje: nawiasy, procenty, godziny, „1,234”
  for (const s of ["(110 − 100) / 100 = 0,1", "5% × 200 = 10", "12:30 = pora", "1,234 + 1 = 1,235", "2^3 + 1 = 9"]) assert.deepEqual(T.arithmetic(s), [], s);
});

test("matematyka: pytanie z calc, poprawna opcja ma tę wartość, a zła nie", () => {
  const q = { q: "200 zł, podatek 19%. Ile zostaje?", options: ["162 zł", "38 zł", "181 zł"], correct: 0, calc: "200*(1-0.19)" };
  assert.deepEqual(T.calcProblems(q, "x"), []);
  assert.equal(T.calcProblems({ ...q, correct: 1 }, "x").length, 2);
  assert.match(T.calcProblems({ ...q, calc: "alert(1)" }, "x")[0], /nie parsuje/);
  assert.deepEqual(T.calcProblems({ ...q, options: ["−5", "5"], correct: 0, calc: "0-5" }, "x"), []);
});

test("paczki: eksport z przeglądarki, tablica, katalogowy dokument", () => {
  const doc = { id: "a", content: { lesson: { sections: [] } } };
  assert.equal(T.docsFrom({ at: "x", pliki: { "a.json": JSON.stringify(doc), "b.json": JSON.stringify({ ...doc, id: "b" }) } }, "e.json").length, 2);
  assert.equal(T.docsFrom([doc, doc], "t.json").length, 2);
  assert.equal(T.docsFrom(doc, "a.json")[0].doc.id, "a");
  assert.equal(T.docsFrom({ lesson: {} }, "c.json")[0].doc.id, "c");
  assert.deepEqual(T.docsFrom({ foo: 1 }, "x.json"), []);
});

// ---------- kontrast ----------
test("contrastRatio: znane wartości (WCAG)", () => {
  assert.ok(Math.abs(T.contrastRatio("#000000", "#ffffff") - 21) < 1e-6);
  assert.ok(Math.abs(T.contrastRatio("#777777", "#ffffff") - 4.48) < 0.01);
});

const PAL = T.paletteFromMd(read("PALETA.md"));
const sec = (re) => Object.assign({}, ...Object.entries(PAL).filter(([k]) => re.test(k)).map(([, v]) => v));
test("PALETA.md: pary tekst/tło z opisu spełniają WCAG AA", () => {
  const main = sec(/^(Zieleń marki|Odcienie|Neutralne|Kolory, które)/);
  const pairs = [
    ["ink", "surface"], ["ink", "green-50"], ["ink", "sunk"], ["ink", "green-100"], ["muted", "surface"], ["muted", "green-50"], ["muted", "sunk"], ["muted", "green-100"],
    ["#FFFFFF", "green-600"], ["#FFFFFF", "green-700"], ["#FFFFFF", "teal-600"], ["green-900", "green-100"], ["green-900", "green-200"], ["green-700", "surface"], ["green-700", "green-50"],
    ["bad", "bad-tlo"], ["warn", "warn-tlo"],
  ];
  const col = (t, k) => (k.startsWith("#") ? k : t[k]);
  for (const [fg, bg] of pairs) {
    assert.ok(col(main, fg) && col(main, bg), `${fg}/${bg} w PALETA.md`);
    assert.ok(T.contrastRatio(col(main, fg), col(main, bg)) >= 4.5, `${fg} na ${bg}: ${T.contrastRatio(col(main, fg), col(main, bg)).toFixed(2)}`);
  }
  for (const [re, list] of [[/Kokardka/, [["#FFFFFF", "green-600"], ["green-900", "green-100"], ["muted", "paper"], ["ink", "paper"]]],
    [/Nenufary/, [["#FFFFFF", "green-600"], ["green-900", "green-100"], ["muted", "paper"], ["ink", "paper"]]],
    [/Łąka/, [["#FFFFFF", "accent"], ["ink", "paper"], ["muted", "paper"], ["ink", "surface"]]]]) {
    const t = sec(re);
    for (const [fg, bg] of list) assert.ok(T.contrastRatio(col(t, fg), col(t, bg)) >= 4.5, `${re} ${fg} na ${bg}`);
  }
});

const THEMES = T.cssThemes(read("index.html"));
test("index.html: kolory z PALETA.md są takie same w :root i w motywach", () => {
  const where = { root: /^(Zieleń marki|Odcienie|Neutralne|Kolory, które)/, bow: /Kokardka/, lilia: /Nenufary/, meadow: /Łąka/ };
  for (const [theme, re] of Object.entries(where)) for (const [k, v] of Object.entries(sec(re))) {
    const name = k.replace(/-tlo$/, "-soft");
    assert.equal((THEMES[theme][name] || "").toUpperCase(), v.toUpperCase(), `${theme} --${name}`);
  }
});

// Znane odstępstwa: do decyzji Bartka (docs/zdawalni/etap-12.md), test pilnuje, żeby nie doszły nowe.
const ZNANE = [{ motyw: "pink", para: "accent-ink na accent", dlaczego: "biały na #E0438F 3,9:1 (AA dla dużego tekstu, nie dla zwykłego)" }];
test("index.html: tekst na tle w każdym motywie ≥ 4,5:1 (poza znanymi odstępstwami)", () => {
  assert.ok(Object.keys(THEMES).length >= 6, Object.keys(THEMES).join());
  const bad = T.themeContrast(THEMES).filter((r) => !r.ok).map((r) => `${r.motyw}: ${r.para} ${r.kontrast}`);
  const nowe = bad.filter((b) => !ZNANE.some((z) => b.startsWith(`${z.motyw}: ${z.para} `)));
  assert.deepEqual(nowe, []);
});

// ---------- stałe pliki strony ----------
const SITE = T.siteFiles(ROOT).map((f) => ({ file: f, text: T.stripCodeComments(read(f)) }));
test("strona: sprawdza pliki", () => assert.ok(SITE.length > 10 && SITE.some((f) => f.file === "index.html") && SITE.some((f) => f.file === "i18n-en.js")));

test("strona: bez zakazanych sformułowań (index.html, *.html, i18n-en.js, moduły)", () => {
  const hits = SITE.flatMap(({ file, text }) => T.withLines(text, T.forbiddenHits(text, FORBIDDEN, "strona")).map((h) => `${file}:${h.linia} „${h.tekst}”`));
  assert.deepEqual(hits, []);
});

test("strona: formy zależne od płci (tylko raport, nie blokuje)", (t) => {
  const per = SITE.map(({ file, text }) => [file, T.genderHits(text).length]).filter(([, n]) => n);
  t.diagnostic(`formy zależne od płci: ${per.reduce((s, [, n]) => s + n, 0)} (${per.map(([f, n]) => `${f} ${n}`).join(", ")}); lista: node scripts/tresci-kontrola.mjs --strona`);
  assert.ok(true);
});

// ---------- komenda na lekcjach testowych ----------
const HAS_PY = !spawnSync("python3", ["--version"]).error;
const CLI = path.join(ROOT, "scripts", "tresci-kontrola.mjs");
const run = (args) => spawnSync(process.execPath, [CLI, ...args], { cwd: ROOT, encoding: "utf8" });
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "tresci-test-"));

test("komenda: dobre lekcje przechodzą z raportem uwag", { skip: !HAS_PY && "brak python3" }, () => {
  const d = tmp(), prz = path.join(d, "p.json"), rap = path.join(d, "r.md");
  const r = run(["tests/fixtures/tresci", "--przeglad", prz, "--raport", rap, "--cicho"]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /Lekcji: \*\*2\*\*/);
  assert.match(r.stdout, /można wgrać/);
  const p = JSON.parse(fs.readFileSync(prz, "utf8"));
  assert.ok(p.wartosci.some((w) => w.typ === "artykuł" && w.tekst === "art. 30a ust. 1 pkt 3" && w.przejrzane === false));
  assert.match(fs.readFileSync(rap, "utf8"), /do przejrzenia/);

  // przed wgraniem: nieprzejrzane wartości blokują, po przejrzeniu przechodzi (przegląd zostaje po kluczu)
  assert.equal(run(["tests/fixtures/tresci", "--przeglad", prz, "--raport", rap, "--cicho", "--przed-wgraniem"]).status, 1);
  p.wartosci.forEach((w) => { w.przejrzane = true; w.zrodlo = "test"; });
  fs.writeFileSync(prz, JSON.stringify(p));
  const r2 = run(["tests/fixtures/tresci", "--przeglad", prz, "--raport", rap, "--cicho", "--przed-wgraniem"]);
  assert.equal(r2.status, 0, r2.stdout);
  assert.ok(JSON.parse(fs.readFileSync(prz, "utf8")).wartosci.every((w) => w.przejrzane && w.zrodlo === "test"));
  fs.rmSync(d, { recursive: true, force: true });
});

test("komenda: celowo zepsuta lekcja jest zatrzymana", { skip: !HAS_PY && "brak python3" }, () => {
  const d = tmp();
  const r = run(["tests/fixtures/tresci-zepsuta", "--przeglad", path.join(d, "p.json"), "--raport", path.join(d, "r.md")]);
  assert.equal(r.status, 1, r.stdout);
  for (const re of [/walidator v4: lesson\.exit\[1\]: correct=5/, /gen\[g2\]: answer się nie parsuje/, /zakazane „na pewno zdasz”/,
    /rachunek się nie zgadza „1050 · 1,05 = 1105 zł”/, /poprawna opcja „38 zł” ≠ 162/, /ZATRZYMANE/]) assert.match(r.stdout, re);
  // świadomie błędny przykład można oznaczyć „celowo”, reszta błędów dalej blokuje
  const p = JSON.parse(fs.readFileSync(path.join(d, "p.json"), "utf8"));
  assert.equal(p.rachunki.length, 1);
  p.rachunki[0].celowo = true;
  fs.writeFileSync(path.join(d, "p.json"), JSON.stringify(p));
  const r2 = run(["tests/fixtures/tresci-zepsuta", "--przeglad", path.join(d, "p.json"), "--raport", path.join(d, "r.md")]);
  assert.equal(r2.status, 1);
  assert.doesNotMatch(r2.stdout, /rachunek się nie zgadza/);
  fs.rmSync(d, { recursive: true, force: true });
});

test("komenda: bez paczki i z pustą paczką kod 2; --strona przechodzi", () => {
  assert.equal(run([]).status, 2);
  const d = tmp();
  fs.writeFileSync(path.join(d, "x.json"), JSON.stringify({ foo: 1 }));
  assert.equal(run([d, "--bez-pythona", "--przeglad", path.join(d, "p.json"), "--raport", path.join(d, "r.md")]).status, 2);
  const s = run(["--strona", "--raport", path.join(d, "s.md")]);
  assert.equal(s.status, 0, s.stdout);
  assert.match(fs.readFileSync(path.join(d, "s.md"), "utf8"), /Formy zależne od płci/);
  fs.rmSync(d, { recursive: true, force: true });
});

test("rachunek: łańcuch „a = b + c = d” i spacja tysięcy nie dają fałszywych błędów, zły wynik dalej tak", () => {
  const ok = (s) => T.arithmetic(s).map((r) => r.ok);
  assert.deepStrictEqual(ok("A: 3×4 + 2×3 = 12 + 6 = 18."), [true, true]);
  assert.deepStrictEqual(ok("3×4 + 2×3 = 12 + 7 = 19"), [false, true]);
  assert.deepStrictEqual(ok("(3 000 : 5 = 600)"), []);
  assert.deepStrictEqual(ok("10 000 : 4 = 2 500"), [true]);
  assert.deepStrictEqual(ok("2 + 2 = 5"), [false]);
});
