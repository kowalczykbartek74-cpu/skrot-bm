// Sylabus innego kierunku (Etap B schematu kierunków): polska karta przedmiotu → ten sam format co sylabus.json BM.
// node --test tests/sylabus.test.js   (potrzebny python3; pdfplumber nie jest potrzebny)
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const czytaj = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));

test("tryb BM (bez --kierunek): build daje to samo co przed zmianą (złoty plik z wersji z main)", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "syl-"));
  fs.copyFileSync(path.join(__dirname, "fixtures/syl-bm-probka.json"), path.join(dir, "syl.json"));
  execFileSync("python3", ["-I", path.join(ROOT, "scripts/sylabus-build.py"), path.join(dir, "out.json")], { cwd: dir });
  assert.strictEqual(fs.readFileSync(path.join(dir, "out.json"), "utf8"), fs.readFileSync(path.join(__dirname, "fixtures/sylabus-bm-probka-oczekiwany.json"), "utf8"));
});

test("polska karta: wiersze tabel → kształt syl.json (formy, kody zaliczeń, efekty, treści, literatura)", () => {
  const rows = [
    ["Nazwa przedmiotu:\nmatematyka\n(PODSTAWOWE)", "Kod przedmiotu:"], ["US182AIJ0001_1S"],
    ["Status przedmiotu:\nobowiązkowy", "Język przedmiotu:\nsemestr: 1 - język polski"],
    ["Rok", "Semestr", "Forma zajęć", "Liczba godzin", "Forma zaliczenia", "ECTS"], ["w tym e-learning"],
    ["1", "1", "wykład", "15", "0", "E", "4"], ["ćwiczenia", "30", "0", "ZO"], ["2", "zajęcia z\nwychowania\nfizycznego", "30", "0", "Z", "0"], ["Razem", "75", "4"],
    ["Koordynator\nprzedmiotu:", "dr ANNA NOWAK"], ["Prowadzący zajęcia:", "dr ANNA NOWAK, mgr JAN KOWAL"],
    ["Cele przedmiotu:", "Celem przedmiotu jest:\npoznanie pochodnej;"], ["Wymagania wstępne:", "brak"],
    ["EFEKTY UCZENIA SIĘ"], ["Kategoria", "Lp", "KOD", "Opis efektu", "Odniesienie"], ["wiedza", "1", "EP1", "zna pochodną", "K_W01"],
    ["TREŚCI PROGRAMOWE ZAJĘĆ I KONSULTACJI", "Semestr", "Liczba godzin zajęć"], ["Przedmiot: matematyka"], ["Forma zajęć: wykład"],
    ["1. Funkcje elementarne", "1", "2", "0"], ["2. Pochodna", "1", "4", "0"],
    ["Metody kształcenia", "wykład problemowy"], ["W ramach realizacji przedmiotu, sposób wykorzystania sztucznej inteligencji jest określony"],
    ["Metody weryfikacji\nefektów uczenia się", "Nr efektu"], ["EGZAMIN PISEMNY", "EP1"],
    ["Forma i warunki zaliczenia", "Egzamin pisemny."], ["Zasady wyliczania oceny z przedmiotu"], ["Średnia ocen."],
    ["Metoda obliczania oceny\nkońcowej", "Sem.", "Przedmiot"], ["1", "matematyka", "Arytmetyczna"], ["1", "matematyka [wykład]", "egzamin"],
    ["Literatura podstawowa", "Nowak A. (2020): Analiza, PWN"], ["Kowal J. (2019): Zadania, PWN"],
    ["NAKŁAD PRACY STUDENTA"], ["Zajęcia dydaktyczne", "45", "0"], ["ŁĄCZNY nakład pracy studenta w godz. 100", "100"],
  ];
  const py = `import json,sys; sys.path.insert(0, ${JSON.stringify(path.join(ROOT, "scripts"))}); import sylabus_pl; print(json.dumps(sylabus_pl.karta(json.loads(sys.stdin.read())), ensure_ascii=False))`;
  const d = JSON.parse(execFileSync("python3", ["-I", "-c", py], { input: JSON.stringify(rows) }).toString());
  assert.strictEqual(d.title, "matematyka");
  assert.strictEqual(d.group, "PODSTAWOWE");
  assert.strictEqual(d.code, "US182AIJ0001_1S");
  assert.strictEqual(d.status, "obligatory");
  assert.deepStrictEqual(d.forms.map((f) => [f.year, f.sem, f.form, f.hours, f.credit]), [[1, 1, "wykład", 15, "e"], [1, 1, "ćwiczenia", 30, "pg"], [1, 2, "zajęcia z wychowania fizycznego", 30, "p"]]);
  assert.strictEqual(d.totalHours, 75);
  assert.deepStrictEqual(d.instructors, ["dr ANNA NOWAK", "mgr JAN KOWAL"]);
  assert.deepStrictEqual(d.objectives, ["poznanie pochodnej;"]);
  assert.deepStrictEqual(d.outcomes, [{ cat: "wiedza", code: "EP1", text: "zna pochodną", refs: ["K_W01"] }]);
  assert.deepStrictEqual(d.content, { "wykład": [{ t: "Funkcje elementarne", sem: 1, h: 2 }, { t: "Pochodna", sem: 1, h: 4 }] });
  assert.deepStrictEqual(d.assessment, [{ method: "EGZAMIN PISEMNY", outcomes: "EP1" }]);
  assert.deepStrictEqual(d.grading, ["Egzamin pisemny.", "Zasady wyliczania oceny z przedmiotu", "Średnia ocen."]);
  assert.deepStrictEqual(d.final, [["matematyka", "Arytmetyczna"], ["matematyka [wykład]", "egzamin"]]);
  assert.deepStrictEqual(d.basic, ["Nowak A. (2020): Analiza, PWN", "Kowal J. (2019): Zadania, PWN"]);
  assert.deepStrictEqual(d.workload, { "Zajęcia dydaktyczne": 45 });
  assert.ok(!d._unparsed, JSON.stringify(d._unparsed));
});

test("sylabus Zarządzania: rocznik, wszystkie przedmioty z pliku kierunku, egzaminy w zimie", () => {
  const k = czytaj("kierunki/wefiz-zarz-1-st-2026.json");
  const s = czytaj(k.sylabus.plik);
  assert.strictEqual(s.rocznik, k.id);
  const ids = new Set(s.courses.map((c) => c.id));
  for (const id of Object.keys(k.przedmioty)) assert.ok(ids.has(id), `brak karty: ${id}`);
  for (const c of s.courses) {
    assert.ok(c.pl && c.forms.length && c.code, c.id);
    assert.ok(c.forms.every((f) => ["W", "CW", "LAB", "KON", "SEM", "WF"].includes(f.f) && ["e", "pg", "p"].includes(f.c)), c.id);
    assert.ok(!c.how.some((x) => /sztucznej inteligencji/.test(x)), `${c.id}: formułka o SI`);
  }
  const egz = s.courses.filter((c) => c.forms.some((f) => f.s === 1 && f.c === "e")).map((c) => c.id).sort();
  assert.deepStrictEqual(egz, ["matematyka", "nauka-o-przedsiebiorstwie", "podstawy-ekonomii", "podstawy-finansow", "podstawy-zarzadzania"]);
  assert.strictEqual(require("../rocznik.js").ROCZNIKI[k.id].sylabus.plik, k.sylabus.plik, "rocznik.js wskazuje sylabus");
});
