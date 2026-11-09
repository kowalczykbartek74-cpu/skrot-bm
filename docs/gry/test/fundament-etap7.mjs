// Fundament, Etap 7: przejście całości na roczniku testowym (bez Teams, bez skrzynki, bez grup w kroku 2, własny plan).
// BASE=http://127.0.0.1:<port>/ node docs/gry/test/fundament-etap7.mjs
// Prawdziwy rocznik z rocznik.js zamiast testowego (spec „Schemat robienia kierunków”, Etap A):
//   ROCZNIK_PLIK=kierunki/<id>.json PLAN_PLIK=<repo plan-bm>/plan/<id>.json BASE=… node docs/gry/test/fundament-etap7.mjs
import fs from "fs";
import { chromium, page, BASE, shot } from "./lib.mjs";
import { dodajRocznikTestowy, TEST_ID as ID_TESTOWY, BM_ID } from "./rocznik-testowy.mjs";
const K = process.env.ROCZNIK_PLIK ? JSON.parse(fs.readFileSync(process.env.ROCZNIK_PLIK, "utf8")) : null;
const TEST_ID = K ? K.id : ID_TESTOWY;
const PLAN = fs.readFileSync(K ? process.env.PLAN_PLIK : new URL("./plan-testowy.json", import.meta.url), "utf8");
const slug = (t) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const NAZWY = [...new Set(Object.values(JSON.parse(PLAN).groups).flatMap((g) => [...g.odd, ...g.even]).filter((e) => e.k !== "X").map((e) => e.pl))].sort((a, b) => a.localeCompare(b, "pl"));
const GRUPA = K ? K.grupy[0] : "T1";
const PRZEDMIOT = K ? slug(NAZWY[0]) : "statystyka-opisowa";
const PREF = K ? `kierunek-${K.prefiks}` : "fundament-etap7";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 600)]);
// Treści BM w bazie (atrapa: materiały m1–m3 = BM) + termin i ogłoszenie BM
const BM_DOCS = JSON.stringify({
  deadlines: { dlbm: { title: "Kolokwium BM z bazy", type: "kolokwium", subjectId: "makroekonomia", date: "2026-12-10", createdAt: 1 } },
  announcements: { anbm: { text: "Ogłoszenie dla BM", createdAt: Date.now() } },
});
// nazwy przedmiotów BM (z odmianą), bossów BM i treści BM z bazy
// (przedmiot, który ma też ten rocznik, np. OWI na Zarządzaniu, nie jest śladem BM)
// (pary PL/EN odpadają razem)
const BM_SLADY = new RegExp([["PKB i inflacja"], ["Polityka pieniężna"], ["Źródła prawa"], ["Kolokwium BM z bazy"], ["Ogłoszenie dla BM"], ["Business Management"], ["C11[1-6]"],
  ["Makroekonom", "Macroeconom"], ["Mikroekonom", "Microeconom"], ["Inflator"], ["Praw[ao]\\b", "Law\\b"], ["Logisty", "Logistic"], ["Revenue"], ["własności intelektualnej", "Intellectual"]]
  .filter(([pl]) => !NAZWY.some((n) => new RegExp(pl, "i").test(n))).flat().join("|"));
async function otworz({ konto = "proba", rocznik = TEST_ID, lang = "pl", w = 375, ls = {}, hash = "#/home", fresh = false } = {}) {
  const p = await page(b, { konto, lang, w, h: w > 800 ? 900 : 812, ls: { "mock-docs": BM_DOCS, ...(rocznik ? { "skrot-rocznik": rocznik } : {}), ...(rocznik === TEST_ID ? { "bm-group": GRUPA, "bm-sub": "" } : {}), ...ls } });
  // lib.mjs wpisuje każdemu grupę C111 (BM); student rocznika testowego ma grupę z jego planu (T1, a prawdziwy rocznik pierwszą z pliku).
  if (!K) await dodajRocznikTestowy(p.context(), BASE);
  await p.context().route(new RegExp(`^https://plan\\.(skrotbm|zdawalni)\\.pl/plan/${TEST_ID}\\.json`), (r) => r.fulfill({ contentType: "application/json", body: PLAN }));
  if (fresh) await p.addInitScript(() => { if (!sessionStorage.getItem("f-init")) { sessionStorage.setItem("f-init", "1"); ["bm-group", "bm-sub", "skrot-rocznik"].forEach((k) => localStorage.removeItem(k)); } });
  await p.goto(BASE + "index.html" + hash); await p.waitForTimeout(2800);
  return p;
}
const tekst = (p) => p.evaluate(() => (document.querySelector("main") || document.body).innerText);
const poziomo = (p) => p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);

// 1. ekran wejścia → wybór rocznika testowego → krok 2 bez grup → logowanie
{
  const p = await otworz({ konto: "brak", rocznik: null, fresh: true, hash: "" });
  await p.waitForSelector("#lgKierunek .lk-card", { timeout: 8000 }).catch(() => null);
  const karta = p.locator(`#lgKierunek [data-k="${TEST_ID}"]`);
  ok("1 karta rocznika testowego na ekranie wejścia", (await karta.count()) === 1, await p.locator("#lgKierunek").innerText().catch(() => ""));
  await karta.click(); await p.waitForTimeout(600);
  const krok2 = await p.locator("#lgKierunek").innerText().catch(() => "");
  if (!K) ok("1 krok 2 bez wyboru grupy (rocznik bez grup)", (await p.locator('#lgKierunek [data-g]').count()) === 0, krok2);
  else {
    ok("1 krok 2: grupy z pliku kierunku", (await p.locator('#lgKierunek [data-g]').evaluateAll((x) => x.map((b) => b.dataset.g).filter(Boolean)).then((g) => g.join())) === K.grupy.join(), krok2);
    await p.locator(`#lgKierunek [data-g="${GRUPA}"]`).click();
  }
  await shot(p, `${PREF}-wejscie-krok2`);
  const dalej = p.locator('#lgKierunek [data-a="dalej"]');
  if (await dalej.count()) { await Promise.all([p.waitForEvent("load", { timeout: 5000 }).catch(() => null), dalej.click()]); await p.waitForTimeout(2500); }
  ok("1 po wyborze: rocznik zapisany, logowanie widoczne, ROK = testowy",
    (await p.evaluate(() => [localStorage.getItem("skrot-rocznik"), window.SKROT_ROCZNIK.id]).then((x) => x.join())) === [TEST_ID, TEST_ID].join() && (await p.locator("#loginBox").isVisible()),
    await p.evaluate(() => [localStorage.getItem("skrot-rocznik"), window.SKROT_ROCZNIK.id]));
  ok("1 ekran logowania bez słowa Teams", !/Teams/.test(await p.locator("#login").innerText()), await p.locator("#login").innerText());
  ok("1 bez błędów konsoli", !p.errors.length, p.errors);
  await p.context().close();
}

// 2. okres próbny: konto bez dostępu włącza próbę
{
  const p = await otworz({ konto: "darmowe", hash: "#/terms" });
  await p.evaluate(() => window.skrot.startTrial?.()); await p.waitForTimeout(800);
  await p.reload(); await p.waitForTimeout(2800);
  ok("2 okres próbny włączony (pełny dostęp)", await p.evaluate(() => !!window.skrot.trialUntil && window.skrot.paid), await p.evaluate(() => [window.skrot.trialUntil, window.skrot.paid]));
  await p.context().close();
}

// 3. ekrany studenta rocznika testowego: PL/EN, 375/1280, bez BM, bez Teams, bez błędów i poziomego przewijania
for (const lang of ["pl", "en"]) for (const w of [375, 1280]) {
  const p = await otworz({ lang, w });
  const slady = [];
  for (const v of ["home", "materials", "review", "terms", "more"]) {
    await p.goto(BASE + "index.html#/" + v); await p.waitForTimeout(1500);
    const t = await tekst(p);
    if (BM_SLADY.test(t)) slady.push(v + ": " + t.match(BM_SLADY)[0]);
    if (/\bTeams\b/.test(t)) slady.push(v + ": Teams");
    if (!(await poziomo(p))) slady.push(v + ": przewijanie w poziomie");
    if (v === "materials" && lang === "pl" && w === 375) ok("3 przedmioty z planu rocznika", K ? NAZWY.every((n) => t.includes(n)) : /Statystyka opisowa/.test(t) && /Ekonomia sektora publicznego/.test(t), K ? NAZWY.filter((n) => !t.includes(n)) : t.slice(0, 300));
    await shot(p, `${PREF}-${v}-${lang}-${w}`);
  }
  ok(`3 ${lang} ${w}px: brak treści BM i słowa Teams, bez przewijania w poziomie`, !slady.length, slady);
  ok(`3 ${lang} ${w}px: konsola bez błędów`, !p.errors.length, p.errors);
  await p.context().close();
}

// 4. admin: „Edytuję rocznik” → termin, ogłoszenie i materiał → student testowy widzi, student BM nie
let zapis = null;
{
  const p = await otworz({ konto: "starosta", rocznik: null, ls: { "skrot-admin-rocznik": TEST_ID, "mock-docs-trwale": "1", "bm-starosta": "1" }, hash: "#/starosta" });
  ok("4 admin edytuje rocznik testowy (pasek u góry)", /Edytujesz:/.test(await p.locator("#ed-bar").innerText().catch(() => "")));
  await p.locator(".more-row", { hasText: "Ogłoszenie" }).first().click(); await p.waitForTimeout(400);
  await p.fill("#ann-text", "Ogłoszenie dla rocznika testowego E7"); await p.locator("button[type=submit]", { hasText: "Opublikuj" }).click(); await p.waitForTimeout(700);
  await p.goto(BASE + "index.html#/terms"); await p.waitForTimeout(1200);
  await p.locator("button", { hasText: "+ Dodaj termin" }).first().click(); await p.waitForTimeout(400);
  await p.fill("#dl-title", "Kolokwium rocznika testowego E7"); await p.fill("#dl-date", "2026-12-16");
  await p.locator("button", { hasText: "Dodaj termin" }).last().click(); await p.waitForTimeout(900);
  // materiał tak, jak zapisuje go „Wgraj materiał” (bez AI): materials + materialContent
  await p.evaluate(async (s) => {
    const d = await window.claude.use("db");
    const ref = d.collection("materials").doc();
    await d.doc("materialContent/" + ref.id).set({ v: 2, summary: "Średnia i mediana.", quiz: [], flashcards: [] });
    await ref.set({ subjectId: s, title: "Materiał rocznika testowego E7", createdAt: Date.now(), v: 2, source: "prezentacja" });
  }, PRZEDMIOT);
  await p.waitForTimeout(600);
  const z = await p.evaluate(() => window.__zapisy.filter((x) => ["announcements", "deadlines", "materials", "materialContent"].includes(x.kolekcja)));
  ok("4 cztery zapisy z rocznikiem testowym", z.length === 4 && z.every((x) => x.rocznik_id === TEST_ID), z);
  ok("4 bez błędów konsoli", !p.errors.length, p.errors);
  zapis = await p.evaluate(() => localStorage.getItem("mock-docs-zapis"));
  await p.context().close();
}
for (const [kto, rocznik] of [["testowy", TEST_ID], ["BM", null]]) {
  const p = await otworz({ rocznik, ls: { "mock-docs-trwale": "1", "mock-docs-zapis": zapis }, hash: "#/home" });
  const dzis = await tekst(p);
  await p.goto(BASE + "index.html#/terms"); await p.waitForTimeout(1500);
  const terminy = await tekst(p);
  await p.goto(BASE + "index.html#/subject/" + PRZEDMIOT); await p.waitForTimeout(1500);
  const przedm = await tekst(p);
  const widzi = [/Ogłoszenie dla rocznika testowego E7/.test(dzis), /Kolokwium rocznika testowego E7/.test(terminy), /Materiał rocznika testowego E7/.test(przedm)];
  if (kto === "testowy") ok("4 student testowy widzi ogłoszenie, termin i materiał", widzi.every(Boolean), widzi);
  else ok("4 student BM nie widzi niczego z rocznika testowego", !widzi.some(Boolean), widzi);
  await p.context().close();
}

// 5. prawdziwy rocznik ze statusem z pliku: bez „platny” zamiast płatności lista oczekujących (v45), bez Stripe
if (K && K.status !== "platny") for (const [lang, w] of [["pl", 375], ["en", 1280]]) {
  const p = await page(b, { konto: "darmowe", lang, w, h: w > 800 ? 900 : 812,
    ls: { "mock-roczniki-lista": JSON.stringify([{ id: BM_ID, status: "platny" }, { id: TEST_ID, status: K.status }]), "skrot-rocznik": TEST_ID, "bm-group": GRUPA } });
  await p.context().route(new RegExp(`^https://plan\\.(skrotbm|zdawalni)\\.pl/plan/${TEST_ID}\\.json`), (r) => r.fulfill({ contentType: "application/json", body: PLAN }));
  let stripe = null;
  await p.context().route(/^https:\/\/buy\.stripe\.com\//, (r) => { stripe = r.request().url(); r.fulfill({ contentType: "text/html", body: "<p>stripe</p>" }); });
  await p.goto(BASE + "index.html#/terms"); await p.waitForTimeout(2500);
  await p.evaluate(() => window.skrot.buy("rok")); await p.waitForTimeout(800);
  const t = await p.locator(".modal").last().innerText().catch(() => "");
  ok(`5 ${lang} ${w}px: lista oczekujących zamiast płatności (${K.kierunek.pl})`,
    (lang === "pl" ? /Ten kierunek jeszcze nie ruszył/ : /This programme hasn't started yet/).test(t) && (t.includes(K.kierunek.pl) || t.includes(K.kierunek.en)) && !stripe, t);
  ok(`5 ${lang} ${w}px: bez błędów i poziomego przewijania`, !p.errors.length && (await poziomo(p)), p.errors);
  await shot(p, `${PREF}-lista-${lang}-${w}`);
  await p.context().close();
}

await b.close();
for (const w of wyniki) console.log(w.join(" "));
const zle = wyniki.filter((w) => w[0] === "✗").length;
console.log(zle ? `✗ ${zle} z ${wyniki.length}` : `✓ ${wyniki.length}/${wyniki.length}`);
process.exit(zle ? 1 : 0);
