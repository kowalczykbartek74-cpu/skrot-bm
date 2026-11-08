// scripts/mapa-tematow.py --na-sucho (Etap C): zapytania bez wysyłki, przedmioty bez BM bez API, poprawny schemat.
// node --test tests/mapa-tematow.test.js   (python3; pakiet anthropic niepotrzebny)
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const ROOT = path.join(__dirname, "..");

test("na sucho: jedno zapytanie na przedmiot z BM, K3 bez API, Batch + cache + structured outputs, nic nie wysyła", () => {
  const pusty = fs.mkdtempSync(path.join(os.tmpdir(), "lekcje-"));
  const out = execFileSync("python3", ["-I", path.join(ROOT, "scripts/mapa-tematow.py"), "kierunki/wefiz-zarz-1-st-2026.json", "--na-sucho", "--lekcje", pusty], { cwd: ROOT, env: { PATH: process.env.PATH } }).toString();
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
    assert.ok(c.tematy.length > 0 && c.kandydaciBM.length > 0, x.custom_id);
  }
});
