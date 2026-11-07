// Fundament, Etap 6: stałe BM w stronie. BASE=http://127.0.0.1:<port>/ node docs/gry/test/fundament-etap6.mjs
import { chromium, page, BASE, shot } from "./lib.mjs";
import { dodajRocznikTestowy, TEST_ID } from "./rocznik-testowy.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 500)]);
async function otworz({ konto = "platne", rocznik = null, hash = "#/home", lang = "pl" } = {}) {
  const p = await page(b, { konto, lang, ls: rocznik ? { "skrot-rocznik": rocznik } : {} });
  await dodajRocznikTestowy(p.context(), BASE);
  p.grade = null;
  await p.context().route(/\/functions\/v1\/grade-open/, (r) => { p.grade = JSON.parse(r.request().postData() || "{}"); r.fulfill({ contentType: "application/json", body: '{"results":{}}' }); });
  await p.goto(BASE + "index.html" + hash); await p.waitForTimeout(2500);
  return p;
}
const summary = (p) => p.evaluate(() => document.querySelector("#lg-teams summary")?.textContent || "");
const meta = (p) => p.evaluate(() => [...document.querySelectorAll('meta[name="description"], meta[property^="og:"]')].map((m) => m.content).join(" | "));

let p = await otworz({ konto: "brak" });
ok("logowanie BM: pytanie o slajdy z Teams", (await summary(p)) === "Czym to się różni od slajdów z Teams?", await summary(p));
ok("opisy w <head> bez „Business Management”", !/Business Management/.test(await meta(p)), await meta(p));
await p.context().close();
p = await otworz({ konto: "brak", rocznik: TEST_ID });
ok("logowanie rocznik bez Teams: bez słowa Teams", (await summary(p)) === "Czym to się różni od slajdów prowadzących?", await summary(p));
await shot(p, "fundament-etap6-logowanie-test");
await p.context().close();

p = await otworz({ rocznik: TEST_ID, hash: "#/terms" });
ok("Terminy rocznika bez Teams: bez starosty i Teams", /gdy je dodamy/.test(await p.locator("main").innerText()) && !/starosta|Teams/.test(await p.locator("main").innerText()));
await p.evaluate(() => window.skrot.gradeOpen({ run: "r1", items: [{ id: "q1" }] }).catch(() => null)); await p.waitForTimeout(500);
ok("ocena AI: odbiorcy z rocznika testowego", p.grade?.odbiorcy === "first-year Test Programme students" && p.grade?.jezyk === "pl", p.grade);
ok("bez błędów konsoli", !p.errors.length, p.errors);
await p.context().close();
p = await otworz({ hash: "#/terms" });
await p.evaluate(() => window.skrot.gradeOpen({ run: "r1", items: [{ id: "q1" }] }).catch(() => null)); await p.waitForTimeout(500);
ok("ocena AI: odbiorcy BM", p.grade?.odbiorcy === "first-year Business Management students" && p.grade?.jezyk === "en", p.grade);
await p.context().close();

await b.close();
for (const w of wyniki) console.log(w.join(" "));
const zle = wyniki.filter((w) => w[0] === "✗").length;
console.log(zle ? `✗ ${zle} z ${wyniki.length}` : `✓ ${wyniki.length}/${wyniki.length}`);
process.exit(zle ? 1 : 0);
