// Panel kierunków (administrator): wszystkie roczniki w jednym miejscu, przełączanie bez logowania.
// BASE=http://127.0.0.1:<port>/ node docs/gry/test/panel-kierunkow.mjs
import { chromium, page, BASE, shot } from "./lib.mjs";
const BM = "wefiz-bm-1-st-2026", ZARZ = "wefiz-zarz-1-st-2026", FIR = "wefiz-fir-1-st-2026";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 600)]);
const now = Date.now();
// Treści Zarządzania obok BM z atrapy (m1–m3); termin i ogłoszenie dla obu roczników
const DOCS = JSON.stringify({
  materials: {
    z1: { subjectId: "podstawy-zarzadzania", title: "Funkcje zarządzania (lekcja Z)", kind: "lesson", order: 1, quizCount: 6, flashcardCount: 4, createdAt: now - 1e6, v: 2 },
    z2: { subjectId: "podstawy-zarzadzania", title: "Kultura organizacyjna (lekcja Z)", kind: "lesson", order: 2, quizCount: 5, flashcardCount: 3, createdAt: now - 9e5, v: 2 },
  },
  materialContent: { z1: { v: 2, tldr: "Zarządzanie to planowanie, organizowanie, przewodzenie i kontrola.", topics: [{ t: "Planowanie", summary: "Wyznaczanie celów." }], flashcards: [{ q: "Co to planowanie?", a: "Wyznaczanie celów." }], quiz: [{ q: "?", options: ["a", "b"], correct: 0 }] } },
  materialSimple: { z1: { v: 1 }, m1: { v: 1 } },
  deadlines: { dbm: { title: "Kolokwium BM panel", subjectId: "makroekonomia", date: "2027-01-10", createdAt: 1 }, dz: { title: "Test Zarz panel", subjectId: "podstawy-zarzadzania", date: "2027-01-12", createdAt: 1 } },
  announcements: { abm: { text: "Ogłoszenie BM panel", createdAt: now }, az: { text: "Ogłoszenie Zarz panel", createdAt: now } },
});
const ROKI = JSON.stringify({ materials: { z1: ZARZ, z2: ZARZ }, materialContent: { z1: ZARZ }, materialSimple: { z1: ZARZ }, deadlines: { dz: ZARZ }, announcements: { az: ZARZ } });
const LISTA = JSON.stringify([{ id: BM, status: "platny" }, { id: ZARZ, status: "oczekujacy" }, { id: FIR, status: "oczekujacy" }]);
const PLAN_Z = JSON.stringify({ groups: { C151: { odd: [{ pl: "Podstawy zarządzania", en: "Fundamentals of Management", k: "W" }, { pl: "Nauka o przedsiębiorstwie", en: "Enterprise", k: "C" }], even: [] } } });
const LS = { "mock-v31": "1", "mock-rocznik": JSON.stringify({ id: BM, wybrany: true }), "mock-roczniki-lista": LISTA, "mock-docs": DOCS, "mock-docs-rok": ROKI, "bm-starosta": "1" };
async function otworz({ konto = "starosta", lang = "pl", w = 375, ls = {}, hash = "#/kierunkiPanel" } = {}) {
  const p = await page(b, { konto, lang, w, h: w > 800 ? 900 : 812, ls: { ...LS, ...ls } });
  await p.context().route(/^https:\/\/plan\.(skrotbm|zdawalni)\.pl\/plan\/wefiz-zarz-1-st-2026\.json/, (r) => r.fulfill({ contentType: "application/json", body: PLAN_Z }));
  await p.context().route(/^https:\/\/plan\.(skrotbm|zdawalni)\.pl\/plan\/wefiz-fir-1-st-2026\.json/, (r) => r.fulfill({ status: 404, body: "" }));
  await p.goto(BASE + "index.html" + hash); await p.waitForTimeout(2800);
  return p;
}
const ev = (p, fn, a) => p.evaluate(fn, a);
const main = (p) => p.locator("main").innerText();
const poziomo = (p) => ev(p, () => document.documentElement.scrollWidth <= innerWidth + 1);

// 1. Narzędzia i Więcej → „Panel kierunków”; lista wszystkich roczników
let p = await otworz({ hash: "#/starosta" });
ok("1 Narzędzia: pozycja „Panel kierunków”", (await p.locator(".more-row", { hasText: "Panel kierunków" }).count()) === 1);
await p.locator(".more-row", { hasText: "Panel kierunków" }).click(); await p.waitForTimeout(1500);
let t = await main(p);
ok("1 panel: trzy kierunki ze statusem, BM teraz na stronie", /#\/kierunkiPanel/.test(p.url()) && (await p.locator(".pk-rok").count()) === 3 && /Zarządzanie, 1\. rok/.test(t) && /Finanse i Rachunkowość/.test(t) && /teraz na stronie/.test(t) && /lista oczekujących/.test(t), t.slice(0, 800));
ok("1 BM: liczby z bazy (3 materiały BM, termin i ogłoszenie BM, bez Zarządzania)", /Kolokwium BM panel/.test(t) && /Ogłoszenie BM panel/.test(t) && !/Test Zarz panel|Ogłoszenie Zarz panel|lekcja Z/.test(t), t);
await shot(p, "panel-kierunkow-bm-pl-375");
// 2. Zarządzanie w panelu bez przeładowania
const przed = await ev(p, () => performance.timeOrigin);
await p.locator(".pk-rok", { hasText: "Zarządzanie" }).click(); await p.waitForTimeout(1200);
t = await main(p);
ok("2 Zarządzanie: bez przeładowania, ROK dalej BM", (await ev(p, () => performance.timeOrigin)) === przed && (await ev(p, () => window.SKROT_ROCZNIK.id)) === BM, null);
ok("2 Zarządzanie: przedmioty z planu (też pusty), materiały, termin i ogłoszenie Zarządzania", /Podstawy zarządzania/.test(t) && /Nauka o przedsiębiorstwie/.test(t) && /Brak materiałów/.test(t) && /Test Zarz panel/.test(t) && /Ogłoszenie Zarz panel/.test(t) && !/Kolokwium BM panel|Ogłoszenie BM panel/.test(t), t);
await p.locator(".pk-subj summary", { hasText: "Podstawy zarządzania" }).click(); await p.waitForTimeout(400);
t = await main(p);
ok("2 przedmiot rozwinięty: dwie lekcje, „bez Prościej” przy drugiej", /Funkcje zarządzania \(lekcja Z\)/.test(t) && /Kultura organizacyjna \(lekcja Z\)/.test(t) && (await p.locator(".pk-mat", { hasText: "Kultura" }).locator(".chip", { hasText: "bez „Prościej”" }).count()) === 1, t);
await p.locator(".pk-mat", { hasText: "Funkcje" }).locator("button", { hasText: "Podgląd" }).click(); await p.waitForTimeout(800);
const mod = await p.locator(".modal").innerText().catch(() => "");
ok("2 podgląd materiału innego kierunku: streszczenie, temat, fiszka", /planowanie, organizowanie/.test(mod) && /Planowanie/.test(mod) && /Co to planowanie\?/.test(mod) && /Otwórz na stronie/.test(mod), mod);
await shot(p, "panel-kierunkow-podglad-pl-375");
ok("2 bez błędów konsoli i poziomego przewijania", !p.errors.length && (await poziomo(p)), p.errors);
// 3. „Otwórz na stronie” → przełączenie na Zarządzanie, od razu w materiale, bez logowania
await Promise.all([p.waitForEvent("load"), p.locator(".modal button", { hasText: "Otwórz na stronie" }).click()]);
await p.waitForTimeout(3000);
ok("3 po przełączeniu: ROK = Zarządzanie, adres materiału, zalogowany, pasek edycji", (await ev(p, () => [window.SKROT_ROCZNIK.id, location.hash, window.skrot.state, !!document.getElementById("ed-bar")])).join() === [ZARZ, "#/material/z1", "in", true].join(),
  await ev(p, () => [window.SKROT_ROCZNIK.id, location.hash, window.skrot.state]));
ok("3 brak ekranu logowania", !(await ev(p, () => document.documentElement.classList.contains("needlogin"))));
ok("3 profil w bazie dalej BM", JSON.parse(await ev(p, () => localStorage.getItem("mock-rocznik"))).id === BM);
// 4. pasek → Panel kierunków → BM → „Wróć do BM”
await p.locator("#ed-bar button", { hasText: "Panel kierunków" }).click(); await p.waitForTimeout(1200);
ok("4 z paska do panelu, zaznaczone Zarządzanie (teraz na stronie)", /#\/kierunkiPanel\/wefiz-zarz/.test(p.url()) && /Strona pokazuje teraz ten kierunek/.test(await main(p)), p.url());
await p.locator(".pk-rok", { hasText: "Business Management" }).click(); await p.waitForTimeout(800);
await Promise.all([p.waitForEvent("load"), p.locator("button", { hasText: "Wróć do BM" }).first().click()]);
await p.waitForTimeout(2500);
ok("4 po „Wróć do BM”: ROK = BM, bez paska i klucza", (await ev(p, () => [window.SKROT_ROCZNIK.id, !!document.getElementById("ed-bar"), localStorage.getItem("skrot-admin-rocznik"), window.skrot.state])).join() === [BM, false, null, "in"].join());
ok("4 bez błędów konsoli", !p.errors.length, p.errors);
// 5. „Zobacz jak student” → podgląd Zarządzania, „Zakończ podgląd” wraca do panelu
await p.goto(BASE + "index.html#/kierunkiPanel/" + ZARZ); await p.waitForTimeout(1500);
await Promise.all([p.waitForEvent("load"), p.locator("button", { hasText: "Zobacz jak student" }).click()]);
await p.waitForTimeout(2800);
ok("5 podgląd: ROK = Zarządzanie, pasek podglądu, Dziś", (await ev(p, () => [window.SKROT_ROCZNIK.id, !!document.getElementById("pg-bar"), location.hash])).join() === [ZARZ, true, "#/home"].join(), await ev(p, () => [window.SKROT_ROCZNIK.id, location.hash]));
await Promise.all([p.waitForEvent("load"), p.locator("#pg-bar button", { hasText: "Zakończ podgląd" }).click()]);
await p.waitForTimeout(2500);
ok("5 po podglądzie: z powrotem w panelu na Zarządzaniu, ROK = BM", (await ev(p, () => [window.SKROT_ROCZNIK.id, location.hash])).join() === [BM, "#/kierunkiPanel/" + ZARZ].join(), await ev(p, () => [window.SKROT_ROCZNIK.id, location.hash]));
await p.context().close();

// 6. zrzuty: PL/EN, 375/1280
for (const [lang, w] of [["en", 375], ["pl", 1280], ["en", 1280]]) {
  p = await otworz({ lang, w, hash: "#/kierunkiPanel/" + ZARZ });
  t = await main(p);
  ok(`6 ${lang} ${w}px: panel widoczny`, lang === "en" ? /Programmes panel/.test(t) && /Management/.test(t) : /Panel kierunków/.test(t), t.slice(0, 300));
  ok(`6 ${lang} ${w}px bez poziomego przewijania i błędów`, (await poziomo(p)) && !p.errors.length, p.errors);
  ok(`6 ${lang} ${w}px przyciski ≥ 44 px`, await ev(p, () => [...document.querySelectorAll("main .pk-rok, main .pk-head .btn, main .pk-subj > summary")].every((x) => x.getBoundingClientRect().height >= 44)));
  await shot(p, `panel-kierunkow-zarz-${lang}-${w}`);
  await p.context().close();
}
// 7. nie-admin: ekran tylko dla administratora, brak pozycji
p = await otworz({ konto: "platne", hash: "#/kierunkiPanel" });
ok("7 nie-admin: ekran tylko dla administratora", /tylko dla administratora/.test(await main(p)));
await p.context().close();

await b.close();
for (const w of wyniki) console.log(w.join(" "));
const zle = wyniki.filter((w) => w[0] === "✗").length;
console.log(zle ? `✗ ${zle} z ${wyniki.length}` : `✓ ${wyniki.length}/${wyniki.length}`);
process.exit(zle ? 1 : 0);
