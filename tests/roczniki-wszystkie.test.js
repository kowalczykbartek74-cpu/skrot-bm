// Jeden test dla wszystkich roczników (optymalizacja nr 10): każdy rocznik ze strony (rocznik.js + roczniki-dane.js)
// sprawdzany tak samo, więc nowy kierunek ma testy od razu, bez pisania nowych. Przeglądarka: docs/gry/test/wszystkie-roczniki.mjs,
// baza: supabase/test/pglite.mjs (każdy rocznik przez „Dodaj do bazy”, v49). node --test tests/roczniki-wszystkie.test.js
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const R = require("../rocznik.js");
const PLAN_BM = path.join(ROOT, "..", "plan-bm");
const J = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const IDS = Object.keys(R.ROCZNIKI);
const TERAZ = new Date(2026, 10, 8);

test("lista roczników: BM pierwszy, każdy wpis z danych ma plik kierunku i odwrotnie", () => {
  assert.strictEqual(IDS[0], R.DOMYSLNY);
  const pliki = fs.readdirSync(path.join(ROOT, "kierunki")).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5));
  for (const id of IDS) assert.ok(pliki.includes(id), `${id}: brak kierunki/${id}.json`);
  for (const id of pliki) assert.ok(R.ROCZNIKI[id], `kierunki/${id}.json bez wpisu na stronie (node scripts/kierunek.mjs kierunki/${id}.json)`);
});

for (const id of IDS) {
  test(`${id}: wpis, teksty, plan, sylabus, role, dane do bazy`, () => {
    const r = R.zbuduj(id, TERAZ), k = J(path.join(ROOT, "kierunki", id + ".json"));
    // pola, z których korzysta strona
    for (const p of ["wydzial", "kierunek", "plan", "sylabus", "grupy", "przedmioty", "teksty", "ai"]) assert.ok(r[p], `${id}: brak ${p}`);
    assert.ok(r.kierunek.pl && r.kierunek.en && /^[A-Z]{2,6}$/.test(r.kierunek.kod));
    assert.strictEqual(r.rok, 1);
    assert.match(r.rokAkademicki, /^20\d\d\/\d\d$/);
    for (const t of Object.values(r.teksty)) assert.ok(t.pl && t.en, `${id}: tekst bez pary PL/EN`);
    assert.ok(r.ai.en && r.ai.pl && r.ai.kontekst);
    // plan na tym samym hoście (CSP strony), BM pod plan.json, reszta plan/<id>.json; strona planu z ?k=<prefiks>
    assert.strictEqual(r.plan.json, id === R.DOMYSLNY ? "https://plan.zdawalni.pl/plan.json" : `https://plan.zdawalni.pl/plan/${id}.json`);
    if (id !== R.DOMYSLNY) assert.strictEqual(r.plan.strona, `https://plan.zdawalni.pl/?k=${k.prefiks}`);
    assert.strictEqual(r.teams, id === R.DOMYSLNY, "Teams tylko BM");
    // sylabus: plik w repo, karty z formami i semestrami
    if (r.sylabus.plik) {
      const s = J(path.join(ROOT, r.sylabus.plik));
      assert.ok(s.courses.length > 5 && s.courses.every((c) => c.id && Array.isArray(c.forms)), `${id}: sylabus`);
      if (id !== R.DOMYSLNY) assert.strictEqual(s.rocznik, id, `${id}: sylabus z innego rocznika`);
    }
    // role przedmiotów: tylko przedmioty z pliku kierunku
    for (const [rola, lista] of Object.entries(r.przedmioty)) for (const p of lista) assert.ok(!k.przedmioty || k.przedmioty[p], `${id}: ${rola} „${p}” spoza przedmiotów`);
    // dane do bazy: reguły v49 (id ↔ kierunek_id ↔ wydział/kod/stopień/tryb, status)
    const d = R.doBazy(id);
    assert.match(d.id, /^[a-z]+-[a-z0-9]+-[012]-(st|nst)-20[0-9]{2}$/);
    assert.strictEqual(d.id, d.kierunek_id + "-" + d.nabor);
    assert.strictEqual(d.kierunek_id, `${d.wydzial.kod.toLowerCase()}-${d.kierunek.kod.toLowerCase()}-${d.kierunek.stopien}-${d.kierunek.tryb}`);
    assert.ok(["plan", "oczekujacy", "platny"].includes(d.status));
    // nazwa kierunku po angielsku na ekranie wejścia (index.html dopisuje parę z rocznika do słownika)
    assert.ok(r.kierunek.en !== "" && typeof r.kierunek.en === "string");
  });
}

test("plan-bm: każdy rocznik ma konfigurację planu i jest na liście strony planu", { skip: !fs.existsSync(path.join(PLAN_BM, "kierunki")) && "brak plan-bm obok" }, async () => {
  const { lista } = await import(path.join(PLAN_BM, "scripts", "kierunki.mjs"));
  const L = lista(path.join(PLAN_BM, "kierunki"));
  for (const id of IDS) {
    if (id === R.DOMYSLNY) continue;
    const c = J(path.join(PLAN_BM, "kierunki", id + ".json"));
    const k = J(path.join(ROOT, "kierunki", id + ".json"));
    assert.deepStrictEqual([c.id, c.kod, c.plik, c.grupy], [id, k.prefiks, k.plan.plik, k.grupy], `${id}: konfiguracja planu = plik kierunku`);
    assert.ok(L.some((x) => x.id === id && x.stopien === k.stopien), `${id}: brak na liście strony planu`);
  }
});

test("skrypt przeglądarkowy przechodzi po wszystkich rocznikach z danych (bez listy wpisanej na sztywno)", () => {
  const s = fs.readFileSync(path.join(ROOT, "docs/gry/test/wszystkie-roczniki.mjs"), "utf8");
  assert.match(s, /require\("\.\.\/\.\.\/\.\.\/rocznik\.js"\)|rocznik\.js/);
  assert.ok(!/wefiz-(zarz|fir)-1-st-2026/.test(s), "bez wpisanych roczników");
});
