// Rocznik testowy wefiz-test-1-st-2026 (spec „Fundament pod inne kierunki”): wpis w ROCZNIKI tylko w przeglądarce testowej.
// Ten sam kod kierunku co BM (BM), inny wydział, bez Teams, bez skrzynki, bez grup i bez zasad zaliczeń wpisanych w kod.
export const TEST_ID = "wefiz-test-1-st-2026";
export const BM_ID = "wefiz-bm-1-st-2026";
const WPIS = `
    "${TEST_ID}": {
      wydzial: { kod: "TST", pl: "Wydział Testowy", en: "Test Faculty" },
      kierunek: { kod: "BM", pl: "Kierunek Testowy", en: "Test Programme" },
      stopien: 1, tryb: "st", nabor: 2026, jezykZajec: "pl",
      plan: { json: "https://plan.skrotbm.pl/plan/${TEST_ID}.json", strona: "https://plan.skrotbm.pl/", skrzynka: null },
      sylabus: { plik: null, pojecia: null, pdf: null },
      grupy: [], teams: false, zasadyZaliczen: false,
    },`;
// ctx: kontekst Playwright; dopisuje rocznik testowy do rocznik.js (przed domyślnym wpisem BM)
export async function dodajRocznikTestowy(ctx, base) {
  await ctx.route(new RegExp("^" + base.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&") + "rocznik\\.js"), async (r) => {
    const res = await r.fetch(); const t = await res.text();
    const a = '  var ROCZNIKI = {\n';
    if (t.split(a).length !== 2) throw new Error("rocznik.js: brak ROCZNIKI");
    await r.fulfill({ response: res, body: t.replace(a, a + WPIS + "\n"), contentType: "text/javascript" });
  });
}
