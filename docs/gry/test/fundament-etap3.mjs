// Fundament, Etap 3: „Edytuję rocznik” (tylko admin), od 8.11.2026 przez Panel kierunków. BASE=http://127.0.0.1:<port>/ node docs/gry/test/fundament-etap3.mjs
import { chromium, page, BASE, shot } from "./lib.mjs";
import { dodajRocznikTestowy, TEST_ID, BM_ID } from "./rocznik-testowy.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 500)]);
const LISTA = JSON.stringify([{ id: BM_ID, status: "platny" }, { id: TEST_ID, status: "oczekujacy" }]);
const LS = { "mock-v31": "1", "mock-rocznik": JSON.stringify({ id: BM_ID, wybrany: true }), "mock-roczniki-lista": LISTA, "mock-docs-trwale": "1", "bm-starosta": "1" };
async function otworz({ konto = "starosta", lang = "pl", w = 375, h = 812, ls = {}, hash = "#/starosta" } = {}) {
  const p = await page(b, { konto, lang, w, h, ls: { ...LS, ...ls } });
  await dodajRocznikTestowy(p.context(), BASE);
  await p.goto(BASE + "index.html" + hash); await p.waitForTimeout(2500);
  return p;
}
const ev = (p, fn, a) => p.evaluate(fn, a);
const main = (p) => p.locator("main").innerText();

// 1. Narzędzia → „Panel kierunków” → lista z bazy
let p = await otworz();
ok("1 Narzędzia: pozycja „Panel kierunków”", (await p.locator(".more-row", { hasText: "Panel kierunków" }).count()) === 1);
await p.locator(".more-row", { hasText: "Panel kierunków" }).click(); await p.waitForTimeout(1500);
const lista = await main(p);
ok("1 lista: BM (teraz) i rocznik testowy ze statusem z bazy", /#\/kierunkiPanel/.test(p.url()) && /teraz na stronie/.test(lista) && /Kierunek Testowy, 1\. rok/.test(lista) && /lista oczekujących/.test(lista), lista);
await shot(p, "fundament-etap3-lista");
// 2. wybór → przeładowanie w roczniku testowym, pasek u góry, profil bez zmian
await p.locator(".pk-rok", { hasText: "Kierunek Testowy" }).click(); await p.waitForTimeout(800);
await Promise.all([p.waitForEvent("load"), p.locator(".pk-head button", { hasText: "Narzędzia" }).click()]);
await p.waitForTimeout(3000);
ok("2 ROK = rocznik testowy, klucz admina zapisany", (await ev(p, () => [window.SKROT_ROCZNIK.id, localStorage.getItem("skrot-admin-rocznik")])).every((x) => x === TEST_ID));
ok("2 pasek „Edytujesz: …” z statusem", /Edytujesz:\s*Kierunek Testowy, 1\. rok\s*lista oczekujących/.test(await p.locator("#ed-bar").innerText().catch(() => "")), await p.locator("#ed-bar").innerText().catch(() => "brak"));
ok("2 przyciski paska ≥ 44 px", (await ev(p, () => [...document.querySelectorAll("#ed-bar button")].every((x) => x.getBoundingClientRect().height >= 44))));
ok("2 profil w bazie nadal BM (syncRocznik nie nadpisał)", JSON.parse(await ev(p, () => localStorage.getItem("mock-rocznik"))).id === BM_ID);
await p.waitForTimeout(1500);
ok("2 brak pętli przeładowań (ROK dalej testowy)", (await ev(p, () => window.SKROT_ROCZNIK.id)) === TEST_ID);
await shot(p, "fundament-etap3-pasek-pl-375");
// 3. ogłoszenie i termin przez formularze
await p.locator(".more-row", { hasText: "Ogłoszenie" }).first().click(); await p.waitForTimeout(500);
await p.fill("#ann-text", "Ogłoszenie rocznika testowego E3"); await p.locator("button[type=submit]", { hasText: "Opublikuj" }).click(); await p.waitForTimeout(800);
await p.goto(BASE + "index.html#/terms"); await p.waitForTimeout(1500);
await p.locator("button", { hasText: "+ Dodaj termin" }).first().click(); await p.waitForTimeout(500);
await p.fill("#dl-title", "Termin rocznika testowego E3"); await p.fill("#dl-date", "2026-12-15");
await p.locator("button", { hasText: "Dodaj termin" }).last().click(); await p.waitForTimeout(1200);
const zap = await ev(p, () => window.__zapisy.filter((z) => z.kolekcja === "announcements" || z.kolekcja === "deadlines"));
ok("3 ogłoszenie i termin zapisane z rocznikiem testowym", zap.length === 2 && zap.every((z) => z.rocznik_id === TEST_ID), zap);
ok("3 termin widać w Terminach rocznika testowego", /Termin rocznika testowego E3/.test(await main(p)));
ok("3 bez błędów konsoli", !p.errors.length, p.errors);
// 4. „Wróć do BM” → nie widać ani terminu, ani ogłoszenia
await Promise.all([p.waitForEvent("load"), p.locator("#ed-bar button", { hasText: "Wróć do BM" }).click()]);
await p.waitForTimeout(2500);
ok("4 po powrocie: ROK = BM, bez paska i klucza", (await ev(p, () => [window.SKROT_ROCZNIK.id, !!document.getElementById("ed-bar"), localStorage.getItem("skrot-admin-rocznik")])).join() === [BM_ID, false, null].join());
await p.goto(BASE + "index.html#/terms"); await p.waitForTimeout(1500);
ok("4 BM: brak terminu rocznika testowego", !/Termin rocznika testowego E3/.test(await main(p)));
await p.goto(BASE + "index.html#/home"); await p.waitForTimeout(1500);
ok("4 BM: brak ogłoszenia rocznika testowego na Dziś", !/Ogłoszenie rocznika testowego E3/.test(await main(p)));
ok("4 bez błędów konsoli", !p.errors.length, p.errors);
await p.context().close();

// 5. zrzuty paska: PL/EN, 375/1280
for (const [lang, w] of [["en", 375], ["pl", 1280], ["en", 1280]]) {
  p = await otworz({ lang, w, h: w > 800 ? 900 : 812, ls: { "skrot-admin-rocznik": TEST_ID }, hash: "#/home" });
  const t = await p.locator("#ed-bar").innerText().catch(() => "");
  ok(`5 pasek ${lang} ${w}px`, lang === "en" ? /Editing:\s*Test Programme, year 1/.test(t) && /Back to BM/.test(t) : /Edytujesz:/.test(t), t);
  ok(`5 ${lang} ${w}px bez poziomego przewijania i błędów`, (await ev(p, () => document.documentElement.scrollWidth <= innerWidth + 1)) && !p.errors.length, p.errors);
  await shot(p, `fundament-etap3-pasek-${lang}-${w}`);
  await p.context().close();
}

// 6. konto bez roli admina z ręcznie wpisanym kluczem wraca do swojego rocznika
p = await otworz({ konto: "platne", ls: { "skrot-admin-rocznik": TEST_ID }, hash: "#/home" });
await p.waitForTimeout(1500);
ok("6 nie-admin: klucz skasowany, ROK = BM, bez paska", (await ev(p, () => [localStorage.getItem("skrot-admin-rocznik"), window.SKROT_ROCZNIK.id, !!document.getElementById("ed-bar")])).join() === [null, BM_ID, false].join());
ok("6 nie-admin: brak pozycji w wyszukiwarce i ekran tylko dla admina", await (async () => { await p.goto(BASE + "index.html#/rocznikAdmin"); await p.waitForTimeout(800); return /tylko dla administratora/.test(await main(p)); })());
await p.context().close();
// 7. wylogowany z kluczem → klucz skasowany
p = await otworz({ konto: "brak", ls: { "skrot-admin-rocznik": TEST_ID }, hash: "#/home" });
await p.waitForTimeout(1500);
ok("7 wylogowany: klucz skasowany, ROK = BM", (await ev(p, () => [localStorage.getItem("skrot-admin-rocznik"), window.SKROT_ROCZNIK.id])).join() === [null, BM_ID].join());
await p.context().close();

await b.close();
for (const w of wyniki) console.log(w.join(" "));
const zle = wyniki.filter((w) => w[0] === "✗").length;
console.log(zle ? `✗ ${zle} z ${wyniki.length}` : `✓ ${wyniki.length}/${wyniki.length}`);
process.exit(zle ? 1 : 0);
