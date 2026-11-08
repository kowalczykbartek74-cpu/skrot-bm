// scripts/lekcje-z-bm.py (Etap D schematu kierunków): K1 kopia, K2 na sucho, porównanie ze źródłem. Lekcja testowa jest sztuczna.
// node --test tests/lekcje-z-bm.test.js   (python3; pakiet anthropic niepotrzebny)
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");
const ROOT = path.join(__dirname, "..");
const SKRYPT = path.join(ROOT, "scripts/lekcje-z-bm.py");

const lekcja = {
  id: "pz-01-test", subjectId: "podstawy-zarzadzania", title: "Test lesson", order: 1,
  content: { lesson: { type: "theory",
    atoms: [{ id: "a1", t: "planning", d: "Planning sets goals for 12 months.", a: "Goals" }],
    sections: [{ intuition: "You plan a trip.", body: "**Planning** comes first.", simple: "Planowanie to pierwszy krok.",
      check: { q: "A firm sets a 3-year goal. Which function?", options: ["Planning", "Control"], correct: 0, not: [null, "Control comes later."] } }],
    exit: [{ q: "Which comes first?", options: ["Planning", "Control", "Leading"], correct: 0, not: [null, "No.", "No."], calc: "2+1" }],
    gen: [{ id: "g1", task: "Budget {a} zł", vars: { a: [10, 20, 1] }, answer: "a*2", unit: "zł", tol: 0, why: "Twice." }] },
    flashcards: [{ q: "Planning?", a: "Setting goals." }] } };

function srodowisko(mapa) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "k2-"));
  fs.mkdirSync(path.join(d, "lessons"));
  fs.writeFileSync(path.join(d, "lessons", lekcja.id + ".json"), JSON.stringify(lekcja));
  fs.mkdirSync(path.join(d, "out"));
  fs.writeFileSync(path.join(d, "out", "mapa.json"), JSON.stringify(mapa));
  return d;
}
const uruchom = (d, ...a) => spawnSync("python3", ["-I", SKRYPT, "kierunki/wefiz-zarz-1-st-2026.json", ...a, "--lekcje", path.join(d, "lessons"), "--wyjscie", path.join(d, "out")], { cwd: ROOT, env: { PATH: process.env.PATH } });
const MAPA_TYMCZ = [{ przedmiot: "podstawy-zarzadzania", tymczasowa: true, tematy: [{ temat: "Planowanie", koszyk: "K2", zrodlo: ["bm:podstawy-zarzadzania"] }] }];

test("K1: kopia z nowym id, rocznikiem i źródłem; treść 1:1", () => {
  const d = srodowisko(MAPA_TYMCZ);
  const r = uruchom(d, "k1");
  assert.strictEqual(r.status, 0, r.stderr.toString());
  assert.match(r.stdout.toString(), /K1: 1 lekcji .*TYMCZASOWA/);
  const k = JSON.parse(fs.readFileSync(path.join(d, "out/paczki/zarz26-pz-01-test.json"), "utf8"));
  assert.strictEqual(k.rocznik_id, "wefiz-zarz-1-st-2026");
  assert.strictEqual(k.zrodlo, "bm:pz-01-test");
  assert.strictEqual(k.subjectId, "podstawy-zarzadzania");
  assert.deepStrictEqual(k.content, lekcja.content);
});

test("K2 na sucho: tylko teksty (bez correct/calc/gen/simple), Batch + cache + structured outputs, koszt, nic nie wysyła", () => {
  const d = srodowisko(MAPA_TYMCZ);
  const r = uruchom(d, "k2", "--na-sucho");
  assert.strictEqual(r.status, 0, r.stderr.toString());
  assert.match(r.stdout.toString(), /1 lekcji \(1 zapytań\): pz-01-test[\s\S]*Szacunek: .* \$/);
  const z = JSON.parse(fs.readFileSync(path.join(d, "out/k2-zapytania.jsonl"), "utf8").trim());
  assert.strictEqual(z.custom_id, "pz-01-test--0", "część 0 lekcji");
  assert.strictEqual(z.params.system[0].cache_control.type, "ephemeral");
  assert.strictEqual(z.params.output_config.format.type, "json_schema");
  const c = JSON.parse(z.params.messages[0].content);
  assert.deepStrictEqual(c.tematySylabusa, ["Planowanie"]);
  assert.strictEqual(c.czesc, "1/1");
  const p = c.teksty.map((x) => x.p);
  assert.ok(p.includes("lesson.sections[0].check.q") && p.includes("lesson.gen[0].task"), p.join(" "));
  assert.ok(!p.some((x) => /simple|correct|calc|\.id$|vars/.test(x)), p.join(" "));
});

test("porównanie ze źródłem: przetłumaczone teksty OK, zmieniona poprawna odpowiedź albo liczba = błąd", () => {
  const d = srodowisko(MAPA_TYMCZ);
  uruchom(d, "k1");
  const plik = path.join(d, "out/paczki/zarz26-pz-01-test.json");
  const k = JSON.parse(fs.readFileSync(plik, "utf8"));
  k.k2 = "gotowe";
  k.content.lesson.sections[0].check.q = "Firma wyznacza cel na 3 lata. Która funkcja?";
  k.content.lesson.atoms[0].d = "Planowanie wyznacza cele na 12 miesięcy.";
  k.content.lesson.gen[0].task = "Budżet {a} zł";
  fs.writeFileSync(plik, JSON.stringify(k));
  let r = uruchom(d, "porownaj");
  assert.strictEqual(r.status, 0, r.stdout.toString());
  k.content.lesson.exit[0].correct = 1;
  k.content.lesson.atoms[0].d = "Planowanie wyznacza cele na 6 miesięcy.";
  k.content.lesson.gen[0].task = "Budżet {b} zł";
  fs.writeFileSync(plik, JSON.stringify(k));
  r = uruchom(d, "porownaj");
  assert.strictEqual(r.status, 1);
  assert.match(r.stdout.toString(), /inna struktura[\s\S]*atoms\[0\]\.d: liczby[\s\S]*gen\[0\]\.task: inne zmienne/);
});

test("bez eksportu BM: czytelny komunikat zamiast pustych paczek", () => {
  const d = srodowisko(MAPA_TYMCZ);
  fs.rmSync(path.join(d, "lessons"), { recursive: true });
  const r = uruchom(d, "k2", "--na-sucho");
  assert.strictEqual(r.status, 1);
  assert.match(r.stderr.toString(), /Brak eksportu lekcji BM/);
});

test("K2 bez pilota (--wszystkie): cała mapa albo wybrane przedmioty, gotowe lekcje pominięte", () => {
  const d = srodowisko(MAPA_TYMCZ);
  let r = uruchom(d, "k2", "--na-sucho", "--wszystkie");
  assert.strictEqual(r.status, 0, r.stderr.toString());
  assert.match(r.stdout.toString(), /1 lekcji \(1 zapytań\): pz-01-test/);
  r = uruchom(d, "k2", "--na-sucho", "--wszystkie", "--przedmioty", "matematyka");
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stderr.toString(), /Brak lekcji K2 do zrobienia w mapie \(matematyka\)/);
  fs.mkdirSync(path.join(d, "out/paczki"), { recursive: true });
  fs.writeFileSync(path.join(d, "out/paczki/zarz26-pz-01-test.json"), JSON.stringify({ id: "zarz26-pz-01-test", zrodlo: "bm:pz-01-test", k2: "gotowe", subjectId: "podstawy-zarzadzania", content: {} }));
  r = uruchom(d, "k2", "--na-sucho", "--wszystkie");
  assert.notStrictEqual(r.status, 0, "gotowa lekcja nie idzie drugi raz");
});
