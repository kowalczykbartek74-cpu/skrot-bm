// Macierz przedmiotów (scripts/macierz-przedmiotow.py) i sylabusy hurtem (scripts/sylabusy-hurt.py), bez sieci.
// node --test tests/macierz.test.js
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const py = (kod) => execFileSync("python3", ["-c", kod], { cwd: path.join(ROOT, "scripts"), encoding: "utf8" });

test("sylabusy-hurt: ten sam wzór adresu co kierunek-nowy.mjs (I/II stopień, „inż.”, niestacjonarne)", async () => {
  const { adresySylabusa } = await import("../scripts/kierunek-nowy.mjs");
  const przypadki = [["Zarządzanie", 1, 2026, "st"], ["Finanse i Rachunkowość", 1, 2026, "st"], ["Ekonomia", 2, 2026, "st"],
    ["Logistyka inż.", 1, 2025, "st"], ["Komunikacja i psychologia w biznesie", 1, 2026, "nst"]];
  const out = JSON.parse(py(`import json,importlib.util as u
s=u.spec_from_file_location("h","sylabusy-hurt.py");m=u.module_from_spec(s);s.loader.exec_module(m)
print(json.dumps([m.adresy(*p) for p in ${JSON.stringify(przypadki)}]))`));
  przypadki.forEach((p, i) => assert.deepStrictEqual(out[i], adresySylabusa(...p), p.join(" ")));
});

test("sylabusy-hurt: odnośnik z listy wydziału wygrywa ze wzorem (inna nazwa pliku), zły stopień i lata pominięte", () => {
  const html = `<a href="https://efz.usz.edu.pl/wp-content/uploads/2026/09/sylabus_logistyka_studia_stacjonarne_II_stopnia_2026_2027.pdf">II</a>
    <a href="https://efz.usz.edu.pl/wp-content/uploads/2026/09/Sylabus_Logistyka_studia_stacjonarne_I_stopnia_2025_2026.pdf">stary</a>
    <a href="https://efz.usz.edu.pl/wp-content/uploads/2026/09/sylabus_logistyka_studia_stacjonarne_I_stopnia_2026_2027_v2.pdf">I</a>`;
  const r = JSON.parse(py(`import json,importlib.util as u
s=u.spec_from_file_location("h","sylabusy-hurt.py");m=u.module_from_spec(s);s.loader.exec_module(m)
h=${JSON.stringify(html)}
print(json.dumps([m.z_listy(h,"Logistyka",1,2026), m.z_listy(h,"Logistyka",2,2026), m.z_listy(h,"Ekonomia",1,2026)]))`));
  assert.deepStrictEqual(r, ["https://efz.usz.edu.pl/wp-content/uploads/2026/09/sylabus_logistyka_studia_stacjonarne_I_stopnia_2026_2027_v2.pdf",
    "https://efz.usz.edu.pl/wp-content/uploads/2026/09/sylabus_logistyka_studia_stacjonarne_II_stopnia_2026_2027.pdf", null]);
});

test("macierz: przedmioty wspólne Zarządzania i FiR, egzaminy, BM po angielsku osobno, kolejność banku", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "macierz-"));
  const ocz = path.join(tmp, "lista.json");
  fs.writeFileSync(ocz, JSON.stringify({ ok: true, wiersze: [
    ...Array(20).fill({ kierunek_id: "wefiz-fir-1-st", rok: 1 }), { kierunek_id: "wefiz-zarz-1-st", rok: 1 }, { kierunek_id: "wefiz-zarz-1-st", rok: 2 }] }));
  execFileSync("python3", ["scripts/macierz-przedmiotow.py", "--teraz", "2026-11-08", "--plan-bm", path.join(tmp, "brak"), "--oczekujacy", ocz], { cwd: ROOT, encoding: "utf8" });
  const M = JSON.parse(fs.readFileSync(path.join(ROOT, "scratch/macierz/macierz.json"), "utf8"));
  const po = Object.fromEntries(M.map((g) => [g.ogolny, g]));
  const pz = po["podstawy-zarzadzania"];
  // kolejne kierunki PL (np. KiPB) też mają Podstawy zarządzania — test nie zależy od ich liczby
  const plPz = pz.kierunki.filter((k) => k.jezyk === "pl");
  for (const r of ["wefiz-fir-1-st-2026", "wefiz-zarz-1-st-2026"]) assert.ok(plPz.some((k) => k.rocznik === r), r);
  assert.strictEqual(pz.egzaminow, plPz.filter((k) => k.egzamin).length);
  assert.ok(pz.egzaminow >= 2);
  assert.ok(pz.tematyWspolne.length >= 1, "wspólne tematy Zarządzania i FiR");
  assert.strictEqual(pz.oczekujacych, 21, "20 z FiR + 1 z 1. roku Zarządzania (2. rok to inny rocznik)");
  assert.ok(pz.kierunki.some((k) => k.rocznik === "wefiz-bm-1-st-2026"), "BM w tym samym wierszu (źródło K2)");
  assert.strictEqual(pz.kierunkowPl, new Set(plPz.map((k) => k.rocznik)).size, "BM (EN) nie liczy się do banku PL");
  assert.ok(!plPz.some((k) => k.rocznik === "wefiz-bm-1-st-2026"));
  assert.strictEqual(po["technologie-informacyjne"].kierunki.find((k) => k.rocznik === "wefiz-fir-1-st-2026")?.przedmiot, "arkusz-kalkulacyjny-w-finansach-i-rachunkowosci", "alias z pliku wspólnego");
  assert.ok(po["zarzadzanie-wlasnym-rozwojem"] && !po["zarzadzanie-wlasnym-rozwojem"].przypisany, "bez przypisania, nie do Podstaw zarządzania");
  const pl = M.filter((g) => !g.tylkoEn);
  assert.ok(pl.every((g, i) => !i || pl[i - 1].wynik >= g.wynik), "posortowane po wyniku");
  const pf = po["podstawy-finansow"], bez = pf.kierunki.filter((k) => k.jezyk === "pl").reduce((s, k) => s + (k.egzamin ? 2 : 1), 0);
  assert.ok(pf.oczekujacych >= 20 && pf.wynik > bez, "lista oczekujących FiR podnosi wspólny przedmiot z egzaminem");
  assert.ok(pl.indexOf(pf) <= 1, "Podstawy finansów w czołówce banku");
  assert.ok(M.filter((g) => g.tylkoEn).every((g) => g.kierunki.every((k) => k.jezyk === "en")));
  const md = fs.readFileSync(path.join(ROOT, "scratch/macierz/bank-plan.md"), "utf8");
  assert.match(md, /\| [12] \| podstawy-finansow \|/);
  assert.match(md, /Bez przypisania.*\n.*zarzadzanie-wlasnym-rozwojem/);
  assert.match(fs.readFileSync(path.join(ROOT, "scratch/macierz/macierz.html"), "utf8"), /<td><b>podstawy-zarzadzania<\/b><\/td>/);
});
