// scripts/tresci-bank.py: bank PL, kopie K1 z odciskami i synchronizacja po poprawce źródła (optymalizacja nr 9).
// Lekcje w teście są sztuczne. node --test tests/tresci-bank.test.js
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
// wywołanie funkcji modułu Pythona z argumentami JSON; wynik JSON
function py(fn, ...args) {
  const kod = `import json,sys,importlib.util as u
s=u.spec_from_file_location("b","scripts/tresci-bank.py");m=u.module_from_spec(s);s.loader.exec_module(m)
a=json.loads(sys.argv[1]);r=getattr(m,${JSON.stringify(fn)})(*a)
print(json.dumps(r,ensure_ascii=False))`;
  return JSON.parse(execFileSync("python3", ["-c", kod, JSON.stringify(args)], { cwd: ROOT, encoding: "utf8" }));
}
const K = JSON.parse(fs.readFileSync(path.join(ROOT, "kierunki/wefiz-zarz-1-st-2026.json"), "utf8"));
const FIR = JSON.parse(fs.readFileSync(path.join(ROOT, "kierunki/wefiz-fir-1-st-2026.json"), "utf8"));
const lekcja = (id, tekst, extra = {}) => ({ id, subjectId: "podstawy-zarzadzania", rocznik_id: K.id, title: "Funkcje zarządzania", sylRef: "wykład, temat 1",
  content: { lesson: { type: "theory", sections: [{ body: tekst }] }, flashcards: [{ q: "Co?", a: tekst }] }, ...extra });
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "bank-"));
const zapisz = (dir, d) => { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, d.id + ".json"), JSON.stringify(d)); };

test("odcisk: nie zależy od kolejności kluczy ani od id/rocznika; ten sam w lekcje-z-bm.py", () => {
  const a = { id: "x", title: "T", content: { b: 1, a: [1, 2] } }, b = { content: { a: [1, 2], b: 1 }, title: "T", id: "y", rocznik_id: "r" };
  assert.strictEqual(py("odcisk", a), py("odcisk", b));
  assert.notStrictEqual(py("odcisk", a), py("odcisk", { ...a, title: "T2" }));
  const z = execFileSync("python3", ["-c", `import re,json
src=open("scripts/lekcje-z-bm.py").read()
f=src[src.index("def odcisk(d):"):src.index("def k1_dokument")]
ns={"json":json};exec(f,ns);print(ns["odcisk"](${JSON.stringify(a)}))`], { cwd: ROOT, encoding: "utf8" }).trim();
  assert.strictEqual(z, py("odcisk", a));
});

test("dodaj → bank → kopiuj do FiR → synchronizuj po poprawce w banku", () => {
  const d = tmp(), bank = path.join(d, "bank"), zarz = path.join(d, "zarz"), fir = path.join(d, "fir");
  zapisz(zarz, lekcja("zarz26-pz-03-managers", "Planowanie, organizowanie, przewodzenie, kontrola."));
  zapisz(zarz, lekcja("zarz26-pz-04-k1", "jeszcze po angielsku", { k2: "do zrobienia" }));
  const [dodane, pominiete] = py("dodaj", K, zarz, bank, null, "2026-11-08");
  assert.deepStrictEqual([dodane, pominiete], [["podstawy-zarzadzania/pz-03-managers"], ["zarz26-pz-04-k1"]]);
  const ind = JSON.parse(fs.readFileSync(path.join(bank, "indeks.json"), "utf8")).tematy["podstawy-zarzadzania/pz-03-managers"];
  assert.deepStrictEqual([ind.status, ind.zrodlo, ind.plik, ind.temat], ["zatwierdzone", "zarz26:zarz26-pz-03-managers", "podstawy-zarzadzania/pz-03-managers.json", "Funkcje zarządzania"]);
  // mapa FiR: K1 z banku (zatwierdzone) i z tematu, którego bank nie ma
  const mapa = [{ przedmiot: "podstawy-zarzadzania", tematy: [
    { temat: "Funkcje", koszyk: "K1", zrodlo: ["bank:podstawy-zarzadzania/pz-03-managers"] },
    { temat: "Kultura", koszyk: "K1", zrodlo: ["bank:podstawy-zarzadzania/nie-ma"] },
    { temat: "Inne", koszyk: "K2", zrodlo: ["bm:pz-05"] }] }];
  const [ok, brak] = py("kopiuj", FIR, mapa, bank, fir);
  assert.deepStrictEqual([ok, brak], [["fir26-pz-03-managers"], ["podstawy-zarzadzania/nie-ma"]]);
  const kopia = JSON.parse(fs.readFileSync(path.join(fir, "fir26-pz-03-managers.json"), "utf8"));
  assert.deepStrictEqual([kopia.rocznik_id, kopia.subjectId, kopia.zrodlo], [FIR.id, "podstawy-zarzadzania", "bank:podstawy-zarzadzania/pz-03-managers"]);
  assert.ok(kopia.zrodloHash && kopia.kopiaHash && !("k2" in kopia));
  // bez zmian
  let w = py("synchronizuj", FIR, { [kopia.id]: kopia }, bank, {}, path.join(d, "akt"));
  assert.deepStrictEqual(w.bez_zmian, [kopia.id]);
  // poprawka w Zarządzaniu → bank (dodaj drugi raz) → FiR dostaje nową kopię sam
  zapisz(zarz, lekcja("zarz26-pz-03-managers", "Planowanie, organizowanie, przewodzenie i kontrolowanie (poprawione)."));
  py("dodaj", K, zarz, bank, null, "2026-11-09");
  w = py("synchronizuj", FIR, { [kopia.id]: kopia }, bank, {}, path.join(d, "akt"));
  assert.deepStrictEqual(w.odswiezone, [kopia.id]);
  const nowa = JSON.parse(fs.readFileSync(path.join(d, "akt", kopia.id + ".json"), "utf8"));
  assert.match(nowa.content.lesson.sections[0].body, /poprawione/);
  assert.deepStrictEqual([nowa.id, nowa.rocznik_id, nowa.subjectId], [kopia.id, FIR.id, "podstawy-zarzadzania"]);
  // kopia poprawiona w FiR i źródło też zmienione → do ręcznego scalenia, nic nie nadpisane
  const recznie = { ...kopia, title: "Funkcje zarządzania (FiR)" };
  w = py("synchronizuj", FIR, { [kopia.id]: recznie }, bank, {}, path.join(d, "akt2"));
  assert.deepStrictEqual([w.konflikty, w.odswiezone], [[kopia.id], []]);
  assert.ok(!fs.existsSync(path.join(d, "akt2")));
});

test("kopie z BM: zmiana lekcji BM = lista do ponownego K2; stare kopie bez odcisków i brak źródła wypisane", () => {
  const bm = { "pz-01": { id: "pz-01", title: "Org", content: { lesson: { a: 1 } } } };
  const k1 = { id: "zarz26-pz-01", rocznik_id: K.id, subjectId: "podstawy-zarzadzania", zrodlo: "bm:pz-01", title: "Organizacja", content: { lesson: { a: "PL" } },
    zrodloHash: py("odcisk", bm["pz-01"]), kopiaHash: "x" };
  let w = py("synchronizuj", K, { [k1.id]: k1 }, tmp(), bm, tmp());
  assert.deepStrictEqual(w.bez_zmian, [k1.id], "K2 przetłumaczone, źródło bez zmian: nic do roboty");
  w = py("synchronizuj", K, { [k1.id]: k1 }, tmp(), { "pz-01": { ...bm["pz-01"], title: "Org 2" } }, tmp());
  assert.deepStrictEqual(w.bm_zmienione, [k1.id]);
  w = py("synchronizuj", K, { a: { ...k1, id: "a", zrodloHash: undefined }, b: { ...k1, id: "b", zrodlo: "bm:nie-ma" } }, tmp(), bm, tmp());
  assert.deepStrictEqual([w.bez_odcisku, w.brak_zrodla], [["a"], ["b"]]);
});

test("pochodne: lista kopii danego źródła we wszystkich rocznikach (scratch/*/paczki)", () => {
  const d = tmp();
  zapisz(path.join(d, "scratch/fir26/paczki"), { id: "fir26-x", rocznik_id: FIR.id, zrodlo: "bank:a/x", content: {} });
  zapisz(path.join(d, "scratch/log26/paczki"), { id: "log26-x", rocznik_id: "wefiz-log-1-st-2026", zrodlo: "bank:a/x", content: {} });
  zapisz(path.join(d, "scratch/log26/paczki"), { id: "log26-y", rocznik_id: "wefiz-log-1-st-2026", zrodlo: "bank:a/y", content: {} });
  assert.deepStrictEqual(py("pochodne", "bank:a/x", d).map((r) => r[1]), ["fir26-x", "log26-x"]);
});

test("K1 z BM (lekcje-z-bm.py k1) zapisuje odciski źródła i kopii", () => {
  const src = fs.readFileSync(path.join(ROOT, "scripts/lekcje-z-bm.py"), "utf8");
  assert.match(src, /"zrodloHash": odcisk\(bm\)/);
  assert.match(src, /d\["kopiaHash"\] = odcisk\(d\)/);
  assert.match(fs.readFileSync(path.join(ROOT, "scripts/paczka-lekcji.py"), "utf8"), /for k in \("zrodloHash", "kopiaHash"\) if d\.get\(k\)/);
  assert.match(fs.readFileSync(path.join(ROOT, "docs/lekcje-v4/eksport.js"), "utf8"), /zrodloHash: m\.zrodloHash, kopiaHash: m\.kopiaHash/);
});
