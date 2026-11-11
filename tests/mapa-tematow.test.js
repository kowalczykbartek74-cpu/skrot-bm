// scripts/mapa-tematow.py --na-sucho (Etap C): zapytania bez wysyłki, przedmioty bez BM bez API, poprawny schemat.
// node --test tests/mapa-tematow.test.js   (python3; pakiet anthropic niepotrzebny)
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const ROOT = path.join(__dirname, "..");

// testy bez banku PL: pusty katalog zamiast prawdziwego ../zdawalni-tresci/bank (ten jest czytany od Etapu 3 Cukrowej)
const PUSTY_BANK = fs.mkdtempSync(path.join(os.tmpdir(), "bank-pusty-"));

test("na sucho: jedno zapytanie na przedmiot z BM, K3 bez API, Batch + cache + structured outputs, nic nie wysyła", () => {
  const pusty = fs.mkdtempSync(path.join(os.tmpdir(), "lekcje-"));
  const out = execFileSync("python3", ["-I", path.join(ROOT, "scripts/mapa-tematow.py"), "kierunki/wefiz-zarz-1-st-2026.json", "--na-sucho", "--lekcje", pusty, "--bank", PUSTY_BANK], { cwd: ROOT, env: { PATH: process.env.PATH } }).toString();
  assert.match(out, /Na sucho/);
  assert.match(out, /bez API \(K3 od razu\): nauka-o-przedsiebiorstwie, zachowania-konsumentow, zarzadzanie-wlasnym-rozwojem/);
  const k = JSON.parse(fs.readFileSync(path.join(ROOT, "kierunki/wefiz-zarz-1-st-2026.json"), "utf8"));
  const z = fs.readFileSync(path.join(ROOT, "scratch", k.prefiks, "mapa-zapytania.jsonl"), "utf8").trim().split("\n").map(JSON.parse);
  const zBm = Object.entries(k.przedmioty).filter(([, p]) => p.bm.length).map(([id]) => id);
  assert.deepStrictEqual(z.map((x) => x.custom_id), zBm);
  for (const x of z) {
    assert.strictEqual(x.params.model, "claude-haiku-5-5");
    assert.strictEqual(x.params.system[0].cache_control.type, "ephemeral");
    assert.strictEqual(x.params.output_config.format.type, "json_schema");
    const c = JSON.parse(x.params.messages[0].content);
    assert.ok(c.tematy.length > 0 && c.kandydaci.length > 0, x.custom_id);
    assert.ok(c.kandydaci.every((k) => k.zrodloTyp === "BM"), "Zarządzanie nie ma banku");
  }
});

test("--bez-api: mapa tymczasowa (koszyk przedmiotu, źródło bm:<przedmiot>), nie nadpisuje mapy z modelu", () => {
  const k = JSON.parse(fs.readFileSync(path.join(ROOT, "kierunki/wefiz-zarz-1-st-2026.json"), "utf8"));
  const plik = path.join(ROOT, "scratch", k.prefiks, "mapa.json");
  const kopia = fs.existsSync(plik) ? fs.readFileSync(plik) : null;
  try {
    if (kopia && !JSON.parse(kopia).every((m) => m.tymczasowa)) return; // prawdziwa mapa: test nic nie rusza
    execFileSync("python3", ["-I", path.join(ROOT, "scripts/mapa-tematow.py"), "kierunki/wefiz-zarz-1-st-2026.json", "--bez-api", "--bank", PUSTY_BANK], { cwd: ROOT, env: { PATH: process.env.PATH } });
    const m = JSON.parse(fs.readFileSync(plik, "utf8"));
    assert.deepStrictEqual(m.map((x) => x.przedmiot), Object.keys(k.przedmioty));
    for (const x of m) {
      assert.ok(x.tymczasowa);
      const bm = k.przedmioty[x.przedmiot].bm;
      for (const t of x.tematy) assert.deepStrictEqual([t.koszyk, t.zrodlo], bm.length ? ["K2", bm.map((b) => "bm:" + b)] : ["K3", []], x.przedmiot);
    }
    const prawdziwa = m.map((x) => ({ ...x, tymczasowa: undefined }));
    fs.writeFileSync(plik, JSON.stringify(prawdziwa));
    const r = require("child_process").spawnSync("python3", ["-I", path.join(ROOT, "scripts/mapa-tematow.py"), "kierunki/wefiz-zarz-1-st-2026.json", "--bez-api", "--bank", PUSTY_BANK], { cwd: ROOT, env: { PATH: process.env.PATH } });
    assert.strictEqual(r.status, 1);
    assert.match(r.stderr.toString(), /nie nadpisuję/);
  } finally {
    if (kopia) fs.writeFileSync(plik, kopia); else fs.rmSync(plik, { force: true });
  }
});

const uruchom = (args) => execFileSync("python3", ["-I", path.join(ROOT, "scripts/mapa-tematow.py"), ...args], { cwd: ROOT, env: { PATH: process.env.PATH } }).toString();

test("bank PL: drugi kierunek dostaje kandydatów z wcześniejszego kierunku (czeka na zatwierdzenie), K1 w schemacie", () => {
  const pusty = fs.mkdtempSync(path.join(os.tmpdir(), "lekcje-"));
  const brakBanku = fs.mkdtempSync(path.join(os.tmpdir(), "bank-"));
  const out = uruchom(["kierunki/wefiz-fir-1-st-2026.json", "--na-sucho", "--lekcje", pusty, "--bank", brakBanku]);
  // kandydaci z wcześniejszych kierunków PL (zarz26, potem kolejne, np. kipb26)
  assert.match(out, /Kandydaci z banku PL: \d+ \([^)]*czeka na zatwierdzenie zarz26/);
  const k = JSON.parse(fs.readFileSync(path.join(ROOT, "kierunki/wefiz-fir-1-st-2026.json"), "utf8"));
  const z = fs.readFileSync(path.join(ROOT, "scratch", k.prefiks, "mapa-zapytania.jsonl"), "utf8").trim().split("\n").map(JSON.parse);
  const pz = z.find((x) => x.custom_id === "podstawy-zarzadzania");
  const c = JSON.parse(pz.params.messages[0].content);
  assert.ok(c.kandydaci.some((x) => x.zrodloTyp === "bank" && x.id.startsWith("zarz26-syl:podstawy-zarzadzania:")));
  assert.ok(c.kandydaci.some((x) => x.zrodloTyp === "BM"));
  assert.ok(!c.kandydaci.some((x) => "status" in x), "status nie idzie do modelu");
  assert.deepStrictEqual(pz.params.output_config.format.schema.properties.tematy.items.properties.koszyk.enum, ["K1", "K2", "K3"]);
  // przedmiot bez karty w sylabusie kierunku: tematy z sylabusa BM
  const mak = JSON.parse(z.find((x) => x.custom_id === "makroekonomia").params.messages[0].content);
  assert.ok(mak.tematy.length > 0);
  // przedmiot bez banku i bez BM: bez zapytania
  assert.ok(!z.some((x) => x.custom_id === "podstawy-rachunkowosci"));
});

test("--bez-api z bankiem: K1 tylko ze źródłem z banku i statusem „czeka…”, uwaga przy braku karty", () => {
  const k = JSON.parse(fs.readFileSync(path.join(ROOT, "kierunki/wefiz-fir-1-st-2026.json"), "utf8"));
  const plik = path.join(ROOT, "scratch", k.prefiks, "mapa.json");
  const kopia = fs.existsSync(plik) ? fs.readFileSync(plik) : null;
  try {
    if (kopia && !JSON.parse(kopia).every((m) => m.tymczasowa)) return;
    uruchom(["kierunki/wefiz-fir-1-st-2026.json", "--bez-api", "--bank", fs.mkdtempSync(path.join(os.tmpdir(), "bank-"))]);
    const m = JSON.parse(fs.readFileSync(plik, "utf8"));
    const k1 = m.flatMap((x) => x.tematy).filter((t) => t.koszyk === "K1");
    assert.ok(k1.length > 0);
    for (const t of k1) {
      assert.ok(t.zrodlo.length && t.zrodlo.every((z) => /^[a-z]+\d\d-syl:/.test(z)), t.temat);
      assert.match(t.bank, /^czeka na zatwierdzenie [a-z]+\d\d$/);
    }
    const mak = m.find((x) => x.przedmiot === "makroekonomia");
    assert.ok(mak.tematy.every((t) => /brak karty w sylabusie kierunku/.test(t.uwaga)));
    assert.ok(m.find((x) => x.przedmiot === "podstawy-rachunkowosci").tematy.every((t) => t.koszyk === "K3"));
    // szacunek kosztu D+E liczy się z tej mapy
    const w = JSON.parse(execFileSync("python3", ["-I", path.join(ROOT, "scripts/koszt-tresci.py"), "kierunki/wefiz-fir-1-st-2026.json", "--json", "--lekcje", fs.mkdtempSync(path.join(os.tmpdir(), "l-"))], { cwd: ROOT }).toString());
    const pr = w[0].przedmioty.find((p) => p.przedmiot === "podstawy-rachunkowosci");
    assert.ok(pr.egzamin && pr.lekcjeK3 > 0 && pr.usdK3 > 0 && pr.usdK2 === 0);
    assert.ok(w[0].przedmioty.find((p) => p.przedmiot === "makroekonomia").egzamin, "egzamin z planu studiów (egzaminyBezKarty)");
    assert.ok(w[0].usd > 0 && w[0].usd < 20);
  } finally {
    if (kopia) fs.writeFileSync(plik, kopia); else fs.rmSync(plik, { force: true });
  }
});
