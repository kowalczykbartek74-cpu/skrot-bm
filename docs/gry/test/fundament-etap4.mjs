// Fundament, Etap 4: zakup per rocznik. BASE=http://127.0.0.1:<port>/ node docs/gry/test/fundament-etap4.mjs
// BM: ten sam link Stripe i client_reference_id co dotąd. Rocznik testowy płatny: 4. część z rocznikiem. Rocznik oczekujący: lista oczekujących.
import { chromium, page, BASE, shot } from "./lib.mjs";
import { dodajRocznikTestowy, TEST_ID, BM_ID } from "./rocznik-testowy.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 500)]);
const UID = "00000000-0000-4000-8000-000000000001";
async function otworz({ rocznik = null, status = "platny", lang = "pl", w = 375, ls = {} } = {}) {
  const lista = JSON.stringify([{ id: BM_ID, status: "platny" }, { id: TEST_ID, status }]);
  const p = await page(b, { konto: "darmowe", lang, w, h: w > 800 ? 900 : 812, ls: { "mock-roczniki-lista": lista, ...(rocznik ? { "skrot-rocznik": rocznik } : {}), ...ls } });
  await dodajRocznikTestowy(p.context(), BASE);
  p.stripe = null;
  await p.context().route(/^https:\/\/buy\.stripe\.com\//, (r) => { p.stripe = r.request().url(); r.fulfill({ contentType: "text/html", body: "<p>stripe</p>" }); });
  await p.goto(BASE + "index.html#/terms"); await p.waitForTimeout(2500);
  return p;
}
async function zaplac(p) {
  await p.evaluate(() => window.skrot.buy("rok")); await p.waitForTimeout(800);
  const modal = p.locator(".modal").last();
  const txt = await modal.innerText().catch(() => "");
  if (!/Zanim zapłacisz|Before you pay/.test(txt)) return { txt, url: null };
  for (const c of await modal.locator("input[type=checkbox]").all()) await c.check();
  await modal.locator("button", { hasText: /Przejdź do płatności|Go to payment/ }).click();
  await p.waitForTimeout(1500);
  return { txt, url: p.stripe };
}
const rpc = (p, fn) => p.evaluate((f) => (window.__rpc || []).filter((x) => x.fn === f || x[0] === f || x.name === f).length, fn);

// A. BM: bez sprawdzania rocznika, link i client_reference_id bez zmian
let p = await otworz();
let z = await zaplac(p);
ok("A BM: okno „Zanim zapłacisz”", /Zanim zapłacisz/.test(z.txt), z.txt);
ok("A BM: link Stripe rok", z.url && z.url.startsWith("https://buy.stripe.com/5kQ00keXo1Nv3QfgXlao800"), z.url);
ok("A BM: client_reference_id = samo konto (jak przed zmianą)", z.url && new URL(z.url).searchParams.get("client_reference_id") === UID, z.url);
ok("A BM: strona nie pyta bazy o rocznik", (await rpc(p, "nauka_rocznik_do_kupienia")) === 0);
ok("A bez błędów konsoli", !p.errors.length, p.errors);
await p.context().close();

// B. rocznik testowy ze statusem platny: ten sam link, rocznik jako 4. część
p = await otworz({ rocznik: TEST_ID });
z = await zaplac(p);
ok("B testowy płatny: okno „Zanim zapłacisz”", /Zanim zapłacisz/.test(z.txt), z.txt);
ok("B testowy płatny: ten sam Payment Link", z.url && z.url.startsWith("https://buy.stripe.com/5kQ00keXo1Nv3QfgXlao800"), z.url);
ok("B testowy płatny: client_reference_id z rocznikiem", z.url && new URL(z.url).searchParams.get("client_reference_id") === `${UID}______${TEST_ID}`, z.url);
await p.context().close();

// C. rocznik oczekujący: zamiast płatności zapis na listę oczekujących
for (const [lang, w] of [["pl", 375], ["en", 375], ["pl", 1280], ["en", 1280]]) {
  p = await otworz({ rocznik: TEST_ID, status: "oczekujacy", lang, w });
  z = await zaplac(p);
  const m = p.locator(".modal").last();
  const t = await m.innerText().catch(() => "");
  if (lang === "pl" && w === 375) {
    ok("C oczekujący: okno listy zamiast płatności, bez Stripe", /Ten kierunek jeszcze nie ruszył/.test(t) && /Kierunek Testowy/.test(t) && !p.stripe, t);
    ok("C przycisk zapisu nieaktywny bez zgody", await m.locator("button", { hasText: "Zapisz mnie na listę" }).isDisabled());
    await m.locator("input[type=checkbox]").check();
    ok("C po zgodzie przycisk aktywny", !(await m.locator("button", { hasText: "Zapisz mnie na listę" }).isDisabled()));
  }
  if (lang === "en") ok(`C ${lang} ${w}: okno po angielsku`, /This programme hasn't started yet/.test(t) && /Add me to the list/.test(t), t);
  ok(`C ${lang} ${w}px bez błędów i poziomego przewijania`, !p.errors.length && (await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)), p.errors);
  await shot(p, `fundament-etap4-lista-${lang}-${w}`);
  await p.context().close();
}

// D. baza bez v45 (brak funkcji): kupno rocznika testowego jak dotąd (nie blokujemy)
p = await otworz({ rocznik: TEST_ID, status: "oczekujacy", ls: { "mock-v45": "0" } });
z = await zaplac(p);
ok("D bez v45: płatność jak dotąd", /Zanim zapłacisz/.test(z.txt) && !!z.url, z);
await p.context().close();

await b.close();
for (const w of wyniki) console.log(w.join(" "));
const zle = wyniki.filter((w) => w[0] === "✗").length;
console.log(zle ? `✗ ${zle} z ${wyniki.length}` : `✓ ${wyniki.length}/${wyniki.length}`);
process.exit(zle ? 1 : 0);
