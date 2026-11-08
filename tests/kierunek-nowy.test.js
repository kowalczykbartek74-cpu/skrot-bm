// scripts/kierunek-nowy.mjs: plik kierunku z konfiguracji planu, planu zajęć i danych wspólnych (bez ręcznego wypełniania).
// Sprawdza na Zarządzaniu i FiR (pliki zrobione ręcznie), że skrypt daje to samo tam, gdzie to się da wyliczyć.
// node --test tests/kierunek-nowy.test.js
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PLAN_BM = path.join(ROOT, "..", "plan-bm");
const N = () => import("../scripts/kierunek-nowy.mjs");
const J = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const wspolne = () => ({ nazwy: J(path.join(ROOT, "kierunki/wspolne/kierunki-nazwy.json")), O: J(path.join(ROOT, "kierunki/wspolne/przedmioty-ogolne.json")) });
const jestPlanBm = fs.existsSync(path.join(PLAN_BM, "kierunki", "wefiz-zarz-1-st-2026.json"));

test("adresy sylabusa i planu studiów: wzór wydziału (te same co w plikach Zarządzania i FiR)", async () => {
  const { adresySylabusa } = await N();
  for (const id of ["wefiz-zarz-1-st-2026", "wefiz-fir-1-st-2026"]) {
    const k = J(path.join(ROOT, "kierunki", id + ".json"));
    assert.deepStrictEqual(adresySylabusa(k.kierunek.pl, k.stopien, k.nabor), { pdf: k.sylabus.pdf, planStudiow: k.sylabus.planStudiow }, id);
  }
  assert.match(adresySylabusa("Ekonomia", 2, 2026).pdf, /sylabus_ekonomia_studia_stacjonarne_II_stopnia_2026_2027\.pdf$/);
});

test("przedmiot ogólny: dokładny alias albo początek nazwy (z uwagą)", async () => {
  const { ogolny } = await N();
  const { O } = wspolne();
  assert.deepStrictEqual(ogolny("podstawy-prawa", O), { og: "podstawy-prawa", bm: ["prawo"], pewne: true });
  assert.deepStrictEqual(ogolny("arkusz-kalkulacyjny-w-finansach-i-rachunkowosci", O).og, "technologie-informacyjne");
  assert.strictEqual(ogolny("matematyka-finansowa", O).pewne, false);
  assert.strictEqual(ogolny("geografia-turystyczna", O), null);
});

test("aliasy nie dublują się między przedmiotami ogólnymi", () => {
  const { O } = wspolne();
  const widziane = new Map();
  for (const [og, v] of Object.entries(O.ogolne)) for (const a of v.aliasy) {
    assert.ok(!widziane.has(a), `alias „${a}” w ${og} i ${widziane.get(a)}`);
    widziane.set(a, og);
  }
});

test("każdy kierunek WEFiZ z listy ma nazwę EN i język zajęć", () => {
  const { nazwy } = wspolne();
  const lista = J(path.join(ROOT, "supabase/kierunki-wefiz.json")).kierunki;
  for (const k of lista) assert.ok(nazwy.kierunki[k.nazwa]?.en, `brak EN: ${k.nazwa}`);
  for (const v of Object.values(nazwy.kierunki)) assert.ok(["pl", "en"].includes(v.jezykZajec));
});

test("Zarządzanie i FiR odtworzone z plan-bm: id, prefiks, grupy, plan, DOS, lista przedmiotów i role prawne", { skip: !jestPlanBm && "brak repo plan-bm obok" }, async () => {
  const { zbuduj } = await N();
  const { nazwy, O } = wspolne();
  for (const id of ["wefiz-zarz-1-st-2026", "wefiz-fir-1-st-2026"]) {
    const reczny = J(path.join(ROOT, "kierunki", id + ".json"));
    const cfg = J(path.join(PLAN_BM, "kierunki", id + ".json"));
    const plan = J(path.join(PLAN_BM, cfg.plik));
    const { k } = zbuduj({ cfg, plan, nazwy, O, inne: [] });
    for (const pole of ["id", "kierunek_id", "prefiks", "kierunek", "stopien", "tryb", "nabor", "jezykZajec", "plan", "grupy", "teams", "status"]) {
      assert.deepStrictEqual(k[pole], reczny[pole], `${id}: ${pole}`);
    }
    assert.strictEqual(k.dos, reczny.dos, `${id}: dos`);
    assert.deepStrictEqual(Object.keys(k.przedmioty).sort(), Object.keys(reczny.przedmioty).sort(), `${id}: przedmioty`);
    assert.deepStrictEqual(k.role.prawne.sort(), reczny.role.prawne.slice().sort(), `${id}: role.prawne`);
    for (const r of ["rachunkowe", "jeszczeProsciej"]) for (const p of k.role[r]) assert.ok(k.przedmioty[p], `${id}: ${r} ${p}`);
  }
});

test("koszyk startowy: K1, gdy przedmiot ogólny jest już w innym roczniku PL; bez ogólnego K3; zły plik zatrzymany", async () => {
  const { zbuduj } = await N();
  const { nazwy, O } = wspolne();
  const cfg = { id: "wefiz-log-1-st-2026", kod: "log26", wydzial: { kod: "WEFiZ" }, kierunek: { kod: "LOG", pl: "Logistyka", en: "Logistyka" }, stopien: 1, tryb: "st", nabor: 2026, rok: 1,
    system: { nazwa: "Logistyka (L)", rok: "1 rokI" }, grupy: ["C161", "C162"], plik: "plan/wefiz-log-1-st-2026.json" };
  const e = (pl, k = "W") => ({ pl, k });
  const plan = { groups: { C161: { odd: [e("Podstawy zarządzania"), e("Matematyka", "CW"), e("Geografia transportu"), e("Szkolenie BHP"), e("Odrabianie", "X")], even: [] } } };
  const zarz = J(path.join(ROOT, "kierunki/wefiz-zarz-1-st-2026.json"));
  const { k, uwagi } = zbuduj({ cfg, plan, nazwy, O, inne: [zarz] });
  assert.deepStrictEqual(Object.keys(k.przedmioty), ["geografia-transportu", "matematyka", "podstawy-zarzadzania"], "bez szkoleń i wpisów ręcznych");
  assert.strictEqual(k.przedmioty["podstawy-zarzadzania"].koszyk, "K1");
  assert.strictEqual(k.przedmioty["matematyka"].koszyk, "K1");
  assert.deepStrictEqual(k.przedmioty["geografia-transportu"], { bank: [], bm: [], koszyk: "K3" });
  assert.strictEqual(k.kierunek.en, "Logistics");
  assert.deepStrictEqual(k.role.rachunkowe, ["matematyka"]);
  assert.strictEqual(k.sylabus.plik, "sylabus-log26.json");
  assert.match(uwagi.join("\n"), /geografia-transportu.*bez przedmiotu ogólnego/);
  assert.strictEqual(zbuduj({ cfg, plan, nazwy, O, inne: [] }).k.przedmioty["podstawy-zarzadzania"].koszyk, "K2", "bez innego rocznika: K2 z BM");
  assert.throws(() => zbuduj({ cfg: { ...cfg, plik: "plan.json" }, plan, nazwy, O }), /plan\.plik/);
  assert.throws(() => zbuduj({ cfg: null, plan, nazwy, O }), /wefiz-wszystkie/);
});
