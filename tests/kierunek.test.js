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

test("każdy plik kierunku: rocznik.js, SQL, test SQL i kolejka PGlite są aktualne (drugi przebieg = brak zmian)", async () => {
  const { wczytaj, wstawDoRocznika, numerSql, sql, testSql, dopiszDoKolejki, wpis } = await K();
  for (const f of kierunki()) {
    const k = wczytaj(path.join(ROOT, f));
    if (k.id === BM) continue;
    const src = czytaj("rocznik.js");
    assert.strictEqual(wstawDoRocznika(src, k, R), src, `${f}: rocznik.js nieaktualny (node scripts/kierunek.mjs ${f})`);
    assert.deepStrictEqual(R.ROCZNIKI[k.id], wpis(k, R), `${f}: wpis w rocznik.js`);
    const nr = numerSql(k);
    assert.strictEqual(czytaj(`supabase/skrot-v${nr}-${k.prefiks}.sql`), sql(k, nr, R), `${f}: SQL nieaktualny`);
    assert.strictEqual(czytaj(`supabase/test/v${nr}.sql`), testSql(k, nr), `${f}: test SQL nieaktualny`);
    const kol = czytaj("supabase/test/pglite.mjs");
    assert.strictEqual(dopiszDoKolejki(kol, k, nr), kol, `${f}: brak w kolejce PGlite`);
    const mig = `skrot-v${nr}-${k.prefiks}.sql`;
    assert.strictEqual(kol.split(`"${mig}"`).length - 1, 2, `${f}: migracja 2× w kolejce PGlite`);
  }
});

test("wstawienie do rocznik.js: dokładnie jedno miejsce, drugi raz nic nie zmienia, wynik da się wczytać", async () => {
  const { wczytaj, wstawDoRocznika } = await K();
  // ostatni wpis ze skryptu (nowy kierunek trafia na koniec), np. FiR po Zarządzaniu
  const src = czytaj("rocznik.js");
  const ostatni = [...src.matchAll(/\/\/ KIERUNEK-START (\S+)/g)].pop()[1];
  const k = { ...wczytaj(path.join(ROOT, `kierunki/${ostatni}.json`)) };
  // rocznik.js bez tego wpisu (jak przed pierwszym uruchomieniem)
  const a = src.indexOf("    // KIERUNEK-START " + k.id), b = src.indexOf("// KIERUNEK-KONIEC " + k.id);
  const przed = a >= 0 ? src.slice(0, a - 1) + src.slice(b + ("// KIERUNEK-KONIEC " + k.id).length) : src;
  const Rprzed = { ...R, ROCZNIKI: { [BM]: R.ROCZNIKI[BM] } };
  const raz = wstawDoRocznika(przed, k, Rprzed);
  assert.strictEqual(raz, src, "pierwsze uruchomienie daje dzisiejszy rocznik.js");
  assert.strictEqual(wstawDoRocznika(raz, k, R), raz, "drugie uruchomienie bez zmian");
  const m = { exports: {} };
  new Function("module", "globalThis", raz)(m, {});
  assert.ok(m.exports.ROCZNIKI[k.id] && m.exports.ROCZNIKI[BM]);
  assert.throws(() => wstawDoRocznika(przed.replace("\n  };\n  var DOMYSLNY", "\n  };\n  var DOMYSLNY0;\n  };\n  var DOMYSLNY"), k, Rprzed), /1/);
});

test("rocznik Zarządzania: plan per rocznik, bez Teams i zasad BM, teksty i opis dla AI z pliku", () => {
  const z = R.zbuduj("wefiz-zarz-1-st-2026", new Date(2026, 10, 8));
  assert.strictEqual(z.plan.json, "https://plan.skrotbm.pl/plan/wefiz-zarz-1-st-2026.json");
  assert.strictEqual(z.plan.skrzynka, null);
  assert.strictEqual(z.teams, false);
  assert.strictEqual(z.zasadyZaliczen, false);
  assert.strictEqual(z.sylabus.plik, null, "sylabus dopiero w Etapie B");
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

test("SQL: wydział sprawdzony, status rocznika tylko w górę (plan → oczekujacy → platny)", async () => {
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
