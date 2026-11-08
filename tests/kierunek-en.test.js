// Kierunek prowadzony po angielsku (np. Economics and IT Applications): lekcje BM są w tym samym języku, więc temat z BM
// to K1 (kopia, 0 zł), a nie K2 (tłumaczenie). Dane testowe: tests/fixtures/eaia/ (sztuczny sylabus z tematami BM i nowymi).
// node --test tests/kierunek-en.test.js
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync, execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const KIER = "tests/fixtures/eaia/kierunek-eaia.json";
const OUT = path.join(ROOT, "scratch", "eaia26test");
const J = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const py = (skrypt, ...a) => spawnSync("python3", [path.join(ROOT, "scripts", skrypt), ...a], { cwd: ROOT, encoding: "utf8" });

test("mapa bez API: temat z sylabusa BM → K1 (źródło: temat BM), nowy temat → K3, żadnego K2", () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  const r = py("mapa-tematow.py", KIER, "--bez-api", "--lekcje", path.join(os.tmpdir(), "brak-eksportu"));
  assert.strictEqual(r.status, 0, r.stderr);
  const mapa = J(path.join(OUT, "mapa.json"));
  const t = mapa.flatMap((m) => m.tematy.map((x) => ({ ...x, p: m.przedmiot })));
  assert.ok(!t.some((x) => x.koszyk === "K2"), "po angielsku nie ma tłumaczeń");
  const mak = t.filter((x) => x.p === "makroekonomia");
  assert.ok(mak.filter((x) => x.koszyk === "K1").length >= 2, "tematy wzięte z BM → K1");
  assert.ok(mak.find((x) => x.koszyk === "K1").zrodlo.every((z) => z.startsWith("bm-syl:makroekonomia:")));
  assert.strictEqual(mak.find((x) => /Cryptocurrency/.test(x.temat)).koszyk, "K3", "temat, którego BM nie ma → K3");
  assert.ok(t.filter((x) => x.p === "analiza-matematyczna").every((x) => x.koszyk === "K1"), "cała Analiza jak w BM");
  assert.ok(t.filter((x) => x.p === "programowanie-w-python").every((x) => x.koszyk === "K3" && !x.zrodlo.length));
});

test("mapa z modelu (na sucho): zasady dla kierunku po angielsku, kandydaci tylko z BM (bez banku PL)", () => {
  const r = py("mapa-tematow.py", KIER, "--na-sucho", "--lekcje", path.join(os.tmpdir(), "brak-eksportu"));
  assert.strictEqual(r.status, 0, r.stderr);
  const z = fs.readFileSync(path.join(OUT, "mapa-zapytania.jsonl"), "utf8").trim().split("\n").map(JSON.parse);
  assert.deepStrictEqual(z.map((x) => x.custom_id).sort(), ["analiza-matematyczna", "makroekonomia"], "przedmiot bez BM: K3 od razu, bez zapytania");
  assert.match(z[0].params.system[0].text, /PO ANGIELSKU/);
  assert.match(z[0].params.system[0].text, /Nie używaj koszyka "K2"/);
  for (const x of z) assert.ok(JSON.parse(x.params.messages[0].content).kandydaci.every((k) => k.zrodloTyp === "BM"));
});

test("K1 po angielsku: kopia lekcji BM jest od razu gotowa (bez „k2: do zrobienia”), paczka ją przyjmie", () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "en-k1-"));
  fs.mkdirSync(path.join(d, "lessons")); fs.mkdirSync(path.join(d, "out"));
  const lek = { id: "mak-01", subjectId: "makroekonomia", title: "What macroeconomics studies", order: 1, content: { lesson: { type: "theory", sections: [{ body: "GDP." }] } } };
  fs.writeFileSync(path.join(d, "lessons", "mak-01.json"), JSON.stringify(lek));
  fs.writeFileSync(path.join(d, "out", "mapa.json"), JSON.stringify([{ przedmiot: "makroekonomia", tymczasowa: true, tematy: [{ temat: "GDP", forma: "W", koszyk: "K1", zrodlo: ["bm:makroekonomia"] }] }]));
  const r = spawnSync("python3", ["-I", path.join(ROOT, "scripts/lekcje-z-bm.py"), KIER, "k1", "--lekcje", path.join(d, "lessons"), "--wyjscie", path.join(d, "out")], { cwd: ROOT, encoding: "utf8" });
  assert.strictEqual(r.status, 0, r.stderr);
  assert.match(r.stdout, /Gotowe do paczki \(kierunek po angielsku\)/);
  const k = J(path.join(d, "out/paczki/eaia26test-mak-01.json"));
  assert.ok(!("k2" in k));
  assert.deepStrictEqual([k.rocznik_id, k.zrodlo, k.title, k.content], ["wefiz-eaia-1-st-2026", "bm:mak-01", lek.title, lek.content]);
  assert.ok(k.zrodloHash && k.kopiaHash);
});

test("plik kierunku po angielsku: przedmiot o tym samym slugu co w BM → K1 z BM, nowy → K3, bez banku PL, sylabus „_ang”", async () => {
  const { zbuduj } = await import("../scripts/kierunek-nowy.mjs");
  const nazwy = J(path.join(ROOT, "kierunki/wspolne/kierunki-nazwy.json")), O = J(path.join(ROOT, "kierunki/wspolne/przedmioty-ogolne.json"));
  const bmIds = new Set(J(path.join(ROOT, "sylabus.json")).courses.map((c) => c.id));
  const cfg = { id: "wefiz-eaia-1-st-2026", kod: "eaia26", wydzial: { kod: "WEFiZ" }, kierunek: { kod: "EAIA", pl: "Economics and IT Applications", en: "Economics and IT Applications" },
    stopien: 1, tryb: "st", nabor: 2026, rok: 1, system: { nazwa: "Economics and IT Applications (EaIA)", rok: "1 rokI" }, grupy: ["C121"], plik: "plan/wefiz-eaia-1-st-2026.json" };
  const e = (pl, en) => ({ pl, en, k: "W" });
  const plan = { groups: { C121: { odd: [e("Makroekonomia", "Macroeconomics"), e("Analiza matematyczna", "Mathematical analysis"), e("Podstawy zarządzania", "Fundamentals of management"),
    e("Mikroekonomia", "Microeconomics"), e("Programowanie w Python", "Python programming")], even: [] } } };
  const zarz = J(path.join(ROOT, "kierunki/wefiz-zarz-1-st-2026.json"));
  const { k } = zbuduj({ cfg, plan, nazwy, O, inne: [zarz], bmIds });
  assert.strictEqual(k.jezykZajec, "en");
  assert.deepStrictEqual(k.przedmioty["makroekonomia"], { bank: [], bm: ["makroekonomia"], koszyk: "K1" });
  assert.deepStrictEqual(k.przedmioty["analiza-matematyczna"], { bank: [], bm: ["analiza-matematyczna"], koszyk: "K1" });
  assert.deepStrictEqual(k.przedmioty["podstawy-zarzadzania"], { bank: [], bm: ["podstawy-zarzadzania"], koszyk: "K1" }, "bank PL nie liczy się, nawet gdy Zarządzanie go ma");
  assert.deepStrictEqual(k.przedmioty["mikroekonomia"].koszyk, "K1", "alias → przedmiot BM (Ekonomia biznesu)");
  assert.deepStrictEqual(k.przedmioty["programowanie-w-python"], { bank: [], bm: [], koszyk: "K3" });
  assert.match(k.sylabus.pdf, /sylabus_economics_and_it_applications_studia_stacjonarne_I_stopnia_2026_2027_ang\.pdf$/);
  // kierunek polski: ten sam slug co w BM też daje przedmiot BM wprost (FiR: Makroekonomia)
  const fir = zbuduj({ cfg: { ...cfg, id: "wefiz-fir-1-st-2026", kod: "fir26", kierunek: { kod: "FIR", pl: "Finanse i Rachunkowość", en: "x" }, system: { nazwa: "Finanse i Rachunkowość (FiR)", rok: "1 rokI" }, plik: "plan/wefiz-fir-1-st-2026.json" },
    plan, nazwy, O, inne: [], bmIds }).k;
  assert.deepStrictEqual(fir.przedmioty["makroekonomia"].bm, ["makroekonomia"]);
  assert.strictEqual(fir.przedmioty["makroekonomia"].koszyk, "K2");
});

test("sylabus-build z plikiem kierunku po angielsku: karta jak w BM (EN + PL nazwy), źródło i rocznik z pliku kierunku", () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "syl-en-"));
  fs.copyFileSync(path.join(__dirname, "fixtures/syl-bm-probka.json"), path.join(d, "syl.json"));
  execFileSync("python3", ["-I", path.join(ROOT, "scripts/sylabus-build.py"), path.join(d, "bm.json")], { cwd: d });
  execFileSync("python3", ["-I", path.join(ROOT, "scripts/sylabus-build.py"), path.join(d, "en.json"), "--kierunek", path.join(ROOT, KIER), "--data", "2026-11-08"], { cwd: d });
  const bm = J(path.join(d, "bm.json")), en = J(path.join(d, "en.json"));
  assert.deepStrictEqual(en.courses, bm.courses, "karty przedmiotów jak w trybie BM");
  assert.strictEqual(en.rocznik, "wefiz-eaia-1-st-2026");
  assert.match(en.source, /^Sylabus Economics and IT Applications, studia stacjonarne I stopnia 2026\/27/);
});

test("sylabusy-hurt: wzór „_ang” = kierunek-nowy.mjs, z listy wydziału wersja angielska przed polską, język z danych wspólnych", async () => {
  const { adresySylabusa } = await import("../scripts/kierunek-nowy.mjs");
  const html = `<a href="https://x/sylabus_economics_and_it_applications_studia_stacjonarne_I_stopnia_2026_2027.pdf">PL</a>
    <a href="https://x/sylabus_economics_and_it_applications_studia_stacjonarne_I_stopnia_2026_2027_ang.pdf">EN</a>`;
  const out = JSON.parse(execFileSync("python3", ["-c", `import json,importlib.util as u
s=u.spec_from_file_location("h","sylabusy-hurt.py");m=u.module_from_spec(s);s.loader.exec_module(m)
h=${JSON.stringify(html)}
print(json.dumps([m.adresy("Economics and IT Applications",1,2026,"st","en"), m.z_listy(h,"Economics and IT Applications",1,2026,"st","en"),
  m.z_listy(h,"Economics and IT Applications",1,2026,"st","pl"), m.jezyk_kierunku("Economics and IT Applications"), m.jezyk_kierunku("Logistyka")]))`], { cwd: path.join(ROOT, "scripts"), encoding: "utf8" }));
  assert.deepStrictEqual(out[0], adresySylabusa("Economics and IT Applications", 1, 2026, "st", "en"));
  assert.match(out[1], /_ang\.pdf$/);
  assert.ok(!/_ang/.test(out[2]));
  assert.deepStrictEqual(out.slice(3), ["en", "pl"]);
});
