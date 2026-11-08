// scripts/kierunek.mjs: nowy kierunek z jednego pliku kierunki/<rocznik>.json (spec „Schemat robienia kierunków”, 3.2).
// node --test tests/kierunek.test.js
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const K = () => import("../scripts/kierunek.mjs");
const R = require("../rocznik.js");
const BM = R.DOMYSLNY;
const czytaj = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const kierunki = () => fs.readdirSync(path.join(ROOT, "kierunki")).filter((f) => f.endsWith(".json")).map((f) => "kierunki/" + f);

test("plik BM odtworzony skryptem daje dzisiejszy wpis BM w rocznik.js bez różnic", async () => {
  const { wczytaj, wpis } = await K();
  const k = wczytaj(path.join(ROOT, "kierunki", BM + ".json"));
  assert.deepStrictEqual(wpis(k, R), R.ROCZNIKI[BM]);
});

test("skrypt nie zmienia wpisu BM", async () => {
  const { wczytaj, wstawDoRocznika } = await K();
  const k = wczytaj(path.join(ROOT, "kierunki", BM + ".json"));
  assert.throws(() => wstawDoRocznika(czytaj("rocznik.js"), k, R), /BM/);
});

test("każdy plik kierunku: wpis w roczniki-dane.js aktualny, w rocznik.js go nie ma, migracja (jeśli jest) aktualna", async () => {
  const { wczytaj, wstawDoDanych, usunZRocznika, maMigracje, numerSql, sql, testSql, dopiszDoKolejki, wpis, DANE } = await K();
  const dane = czytaj(DANE), roc = czytaj("rocznik.js");
  for (const f of kierunki()) {
    const k = wczytaj(path.join(ROOT, f));
    if (k.id === BM) continue;
    assert.strictEqual(wstawDoDanych(dane, k, R), dane, `${f}: roczniki-dane.js nieaktualny (node scripts/kierunek.mjs ${f})`);
    assert.strictEqual(usunZRocznika(roc, k.id), roc, `${f}: wpis został w rocznik.js`);
    assert.deepStrictEqual(R.ROCZNIKI[k.id], wpis(k, R), `${f}: wpis w ROCZNIKI`);
    assert.strictEqual(R.STATUS_DANYCH[k.id], k.status, `${f}: status do bazy`);
    if (!maMigracje(k)) continue;   // nowe kierunki: bez migracji (v49 + „Dodaj do bazy”)
    const nr = numerSql(k);
    assert.strictEqual(czytaj(`supabase/skrot-v${nr}-${k.prefiks}.sql`), sql(k, nr, R), `${f}: SQL nieaktualny`);
    assert.strictEqual(czytaj(`supabase/test/v${nr}.sql`), testSql(k, nr), `${f}: test SQL nieaktualny`);
    const kol = czytaj("supabase/test/pglite.mjs");
    assert.strictEqual(dopiszDoKolejki(kol, k, nr), kol, `${f}: brak w kolejce PGlite`);
    const mig = `skrot-v${nr}-${k.prefiks}.sql`;
    assert.strictEqual(kol.split(`"${mig}"`).length - 1, 2, `${f}: migracja 2× w kolejce PGlite`);
  }
});

test("roczniki-dane.js: z pustego pliku skrypt odtwarza dzisiejszy, drugi raz nic nie zmienia, wynik da się wczytać", async () => {
  const { wczytaj, wstawDoDanych, PUSTE_DANE, DANE } = await K();
  const dane = czytaj(DANE);
  const ids = [...dane.matchAll(/\/\/ ROCZNIK-START (\S+)/g)].map((m) => m[1]);
  assert.ok(ids.length >= 2, "co najmniej Zarządzanie i FiR");
  const Rbm = { ...R, ROCZNIKI: { [BM]: R.ROCZNIKI[BM] } };
  let src = PUSTE_DANE;
  for (const id of ids) src = wstawDoDanych(src, wczytaj(path.join(ROOT, `kierunki/${id}.json`)), Rbm);
  assert.strictEqual(src, dane, "kolejne uruchomienia od pustego pliku = dzisiejszy roczniki-dane.js");
  for (const id of ids) assert.strictEqual(wstawDoDanych(src, wczytaj(path.join(ROOT, `kierunki/${id}.json`)), R), src, `${id}: drugi raz bez zmian`);
  const m = { exports: {} };
  new Function("module", "globalThis", src)(m, {});
  assert.deepStrictEqual(m.exports.map((d) => d.id), ids);
  // przeglądarka: bez module dane trafiają do window.SKROT_ROCZNIKI_DANE, a rocznik.js składa z nich ROCZNIKI
  const okno = {};
  new Function("window", "module", src)(okno, undefined);
  new Function("window", "module", czytaj("rocznik.js"))(okno, undefined);
  assert.deepStrictEqual(Object.keys(okno.SKROT_ROCZNIKI.ROCZNIKI), [BM, ...ids], "BM pierwszy, potem dane w kolejności pliku");
  assert.ok(okno.SKROT_ROCZNIK && okno.SKROT_ROCZNIK.id === BM);
  assert.throws(() => wstawDoDanych(PUSTE_DANE.replace("\n  ];\n  if (typeof module", "\n  ];\n  if (typeof module0;\n  ];\n  if (typeof module"), wczytaj(path.join(ROOT, "kierunki/wefiz-zarz-1-st-2026.json")), R), /1/);
  assert.throws(() => wstawDoDanych(src, wczytaj(path.join(ROOT, `kierunki/${BM}.json`)), R), /BM/);
});

test("dane do bazy (Panel kierunków → „Dodaj do bazy”): to samo, co liczy strona, i przechodzi reguły v49", async () => {
  const { wczytaj, doBazy } = await K();
  for (const f of kierunki()) {
    const k = wczytaj(path.join(ROOT, f));
    if (k.id === BM) continue;
    const d = doBazy(k, R), r = R.zbuduj(k.id);
    // ta sama postać buduje strona (rocznik.js → doBazy, index.html → rbDoBazy) z ROCZNIKI
    assert.deepStrictEqual(d, R.doBazy(k.id));
    assert.strictEqual(d.status, R.STATUS_DANYCH[k.id]);
    assert.strictEqual(r.nabor, d.nabor);
    assert.match(d.id, /^[a-z]+-[a-z0-9]+-[012]-(st|nst)-20[0-9]{2}$/);
    assert.strictEqual(d.kierunek_id, `${d.wydzial.kod.toLowerCase()}-${d.kierunek.kod.toLowerCase()}-${d.kierunek.stopien}-${d.kierunek.tryb}`);
  }
  assert.match(czytaj("index.html"), /const rbDoBazy = \(id\) => window\.SKROT_ROCZNIKI\.doBazy\(id\)/, "strona bierze dane z rocznik.js");
});

test("stara droga (wpis w rocznik.js): usunięcie bloku zostawia poprawny plik", async () => {
  const { usunZRocznika, blokWpisu, wczytaj } = await K();
  const k = wczytaj(path.join(ROOT, "kierunki/wefiz-zarz-1-st-2026.json"));
  const roc = czytaj("rocznik.js"), kon = "\n  };\n  // Pozostałe roczniki";
  assert.strictEqual(roc.split(kon).length, 2);
  const zBlokiem = roc.replace(kon, "\n" + blokWpisu(k, R) + kon);
  assert.notStrictEqual(zBlokiem, roc);
  assert.strictEqual(usunZRocznika(zBlokiem, k.id), roc);
});

test("rocznik Zarządzania: plan per rocznik, bez Teams i zasad BM, teksty i opis dla AI z pliku", () => {
  const z = R.zbuduj("wefiz-zarz-1-st-2026", new Date(2026, 10, 8));
  assert.strictEqual(z.plan.json, "https://plan.skrotbm.pl/plan/wefiz-zarz-1-st-2026.json");
  assert.strictEqual(z.plan.skrzynka, null);
  assert.strictEqual(z.teams, false);
  assert.strictEqual(z.zasadyZaliczen, false);
  assert.strictEqual(z.sylabus.plik, "sylabus-zarz.json", "sylabus z Etapu B (plik w repo)");
  assert.strictEqual(z.sylabus.pojecia, null);
  assert.deepStrictEqual(z.grupy, ["C151", "C152", "C153"]);
  assert.strictEqual(z.ai.en, "first-year Management students");
  assert.strictEqual(z.ai.kontekst, "Uniwersytet Szczeciński, zajęcia po polsku");
  assert.strictEqual(z.teksty.opis.pl, "Zarządzanie · 1. rok");
});

test("rocznik FiR: ten sam skrypt bez zmian w kodzie, 4 grupy M120–M123, v48, własna sekcja DOS (Mickiewicza 64)", async () => {
  const { wczytaj, numerSql, konfiguracjaPlanu } = await K();
  const z = R.zbuduj("wefiz-fir-1-st-2026", new Date(2026, 10, 8));
  assert.strictEqual(z.plan.json, "https://plan.skrotbm.pl/plan/wefiz-fir-1-st-2026.json");
  assert.strictEqual(z.plan.strona, "https://plan.skrotbm.pl/?k=fir26");
  assert.deepStrictEqual(z.grupy, ["M120", "M121", "M122", "M123"]);
  assert.strictEqual(z.teams, false);
  assert.strictEqual(z.zasadyZaliczen, false);
  assert.strictEqual(z.teksty.opis.pl, "Finanse i Rachunkowość · 1. rok");
  const k = wczytaj(path.join(ROOT, "kierunki/wefiz-fir-1-st-2026.json"));
  assert.strictEqual(numerSql(k), 48, "kolejny numer po Zarządzaniu (v47)");
  assert.strictEqual(konfiguracjaPlanu(k, R).dos, "https://dos.usz.edu.pl/mickiewicza/zajecia-mickiewicza/");
  const zarz = wczytaj(path.join(ROOT, "kierunki/wefiz-zarz-1-st-2026.json"));
  assert.ok(!("dos" in konfiguracjaPlanu(zarz, R)), "bez pola dos: adres sekcji wydziału z bazy");
});

test("zły plik kierunku zatrzymuje skrypt, zanim cokolwiek zapisze", async () => {
  const { wczytaj, sprawdzPlik } = await K();
  const k = wczytaj(path.join(ROOT, "kierunki/wefiz-zarz-1-st-2026.json"));
  const zly = (zm) => () => sprawdzPlik({ ...k, ...zm });
  assert.throws(zly({ nabor: 2027 }), /kierunek_id/);
  assert.throws(zly({ kierunek_id: "wefiz-z-1-st", id: "wefiz-z-1-st-2026" }), /kierunek_id/);
  assert.throws(zly({ status: "darmowy" }), /status/);
  assert.throws(zly({ plan: { ...k.plan, plik: "plan.json" } }), /plan\.plik/);
  assert.throws(zly({ role: { prawne: ["nie-ma"] } }), /nie-ma/);
  assert.throws(zly({ role: { inne: [] } }), /nieznana rola/);
  assert.throws(zly({ dos: "dos.usz.edu.pl/mickiewicza" }), /dos/);
});

test("SQL (stara droga, --sql): wydział sprawdzony, status rocznika tylko w górę (plan → oczekujacy → platny)", async () => {
  const { wczytaj, sql, numerSql } = await K();
  const k = wczytaj(path.join(ROOT, "kierunki/wefiz-zarz-1-st-2026.json"));
  const s = sql(k, numerSql(k), R);
  assert.match(s, /on conflict \(id\) do update set status = excluded\.status\n  where array_position/, "status tylko w górę");
  assert.match(s, /'wefiz-zarz-1-st-2026', 'wefiz-zarz-1-st', 2026, 'oczekujacy'/);
  assert.ok(!/delete |drop |truncate /i.test(s), "bez usuwania");
  assert.strictEqual(numerSql(k, ["skrot-v46-x.sql", "skrot-v45-y.sql"]), 47, "kolejny wolny numer");
  assert.strictEqual(numerSql(k, ["skrot-v46-x.sql", "skrot-v47-zarz26.sql", "skrot-v48-z.sql"]), 47, "ten sam plik przy ponownym uruchomieniu");
});

test("--sprawdz: rozbieżności planu z plikiem kierunku wypisuje, nie zgaduje", async () => {
  const { wczytaj, sprawdz } = await K();
  const k = wczytaj(path.join(ROOT, "kierunki/wefiz-zarz-1-st-2026.json"));
  const e = (pl, kk = "W") => ({ d: 0, s: 0, pl, k: kk });
  const ids = Object.keys(k.przedmioty);
  const nazwy = { "podstawy-zarzadzania": "Podstawy zarządzania", "nauka-o-przedsiebiorstwie": "Nauka o przedsiębiorstwie", "zachowania-konsumentow": "Zachowania konsumentów", "zarzadzanie-wlasnym-rozwojem": "Zarządzanie własnym rozwojem", "podstawy-finansow": "Podstawy finansów" };
  const odd = ids.map((id) => e(nazwy[id] || id.split("-").join(" ").replace(/^./, (c) => c.toUpperCase())));
  const dobry = { groups: Object.fromEntries(k.grupy.map((g) => [g, { odd, even: [e("Odrabianie zajęć", "X")] }])) };
  assert.deepStrictEqual(sprawdz(k, dobry).uwagi, []);
  const zly = { groups: { C151: { odd: [...odd.slice(1), e("Mikroekonomia")], even: [] }, C154: { odd: [e("Mikroekonomia")], even: [] } } };
  const u = sprawdz(k, zly).uwagi.join("\n");
  assert.match(u, /grupa C152 jest w pliku kierunku/);
  assert.match(u, /grupa C154 jest w planie/);
  assert.match(u, /„matematyka” jest w pliku kierunku/);
  assert.match(u, /„mikroekonomia” \(Mikroekonomia\) jest w planie/);
  assert.match(u, /role\.rachunkowe: „matematyka”/);
  assert.match(sprawdz(k, null).uwagi.join(), /brak grup/);
});
