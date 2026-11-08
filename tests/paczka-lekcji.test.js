// scripts/paczka-lekcji.py: paczka dla Panelu AI z gotowych lekcji (sztuczna lekcja, bez prawdziwych treści).
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs"), os = require("os"), path = require("path");
const { spawnSync } = require("child_process");
const ROOT = path.join(__dirname, "..");
const K = JSON.parse(fs.readFileSync(path.join(ROOT, "kierunki/wefiz-zarz-1-st-2026.json"), "utf8"));

function katalog(lekcje) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "paczka-"));
  for (const l of lekcje) fs.writeFileSync(path.join(d, l.id + ".json"), JSON.stringify(l));
  return d;
}
const lek = (id, extra = {}) => ({ id, subjectId: "podstawy-zarzadzania", rocznik_id: K.id, zrodlo: "bm:x", title: "Tytuł " + id, order: 2, k2: "gotowe",
  content: { concepts: [{ term: "a" }], flashcards: [{}, {}], quiz: [{}, {}, {}], lesson: { sections: [{}, {}] } }, ...extra });
const uruchom = (kat, ...args) => spawnSync("python3", ["-I", path.join(ROOT, "scripts/paczka-lekcji.py"), "kierunki/wefiz-zarz-1-st-2026.json", kat, "--bez-kontroli", ...args], { cwd: ROOT });

test("paczka: tylko gotowe lekcje tego rocznika, format Panelu AI, liczniki z treści", () => {
  const kat = katalog([lek("zarz26-a"), lek("zarz26-b", { k2: "niepełne" }), lek("fir26-c", { rocznik_id: "wefiz-fir-1-st-2026" }), lek("zarz26-d", { k2: undefined })]);
  const out = path.join(kat, "wynik.json");
  const r = uruchom(kat, "--wyjscie", out);
  assert.strictEqual(r.status, 0, r.stderr.toString());
  assert.match(r.stdout.toString(), /2 lekcji[\s\S]*Pominięte: fir26-c \(inny rocznik[^)]*\), zarz26-b \(k2: niepełne\)/);
  const P = JSON.parse(fs.readFileSync(out, "utf8"));
  assert.strictEqual(P.format, "zdawalni-paczka-lekcji");
  assert.strictEqual(P.rocznik, K.id);
  assert.deepStrictEqual(Object.keys(P.materials).sort(), ["zarz26-a", "zarz26-d"]);
  const m = P.materials["zarz26-a"];
  assert.deepStrictEqual([m.kind, m.subjectId, m.title, m.order, m.lang, m.zrodlo], ["lesson", "podstawy-zarzadzania", "Tytuł zarz26-a", 2, "pl", "bm:x"]);
  assert.deepStrictEqual([m.topicCount, m.conceptCount, m.flashcardCount, m.quizCount], [2, 1, 2, 3]);
  assert.ok(P.materialContent["zarz26-a"].lesson);
});

test("paczka: bez gotowych lekcji = błąd, bez pliku", () => {
  const kat = katalog([lek("zarz26-b", { k2: "niepełne" })]);
  const r = uruchom(kat, "--wyjscie", path.join(kat, "w.json"));
  assert.strictEqual(r.status, 1);
  assert.match(r.stderr.toString(), /Brak gotowych lekcji/);
  assert.ok(!fs.existsSync(path.join(kat, "w.json")));
});
