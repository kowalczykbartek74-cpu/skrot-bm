// „Dla Ciebie na dziś”, etap 3: prawdziwe mechaniki w lekcji (Hasło, Staś, Fruń, Pary, zadanie krok po kroku, kazus, Drabina).
// Plan lekcji wstrzykujemy (wszystkie mechaniki w jednej lekcji), resztę robi strona. Zegar: 6.11.2026, 17:00.
// Uruchom: python3 -m http.server <port> w repo, BASE=http://127.0.0.1:<port>/ node docs/gry/test/lekcja-dnia-3.mjs
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 700)]);
const UID = "00000000-0000-4000-8000-000000000001";
const P = "prawo", A = "analiza-matematyczna";
const sec = (i) => ({ h: `${i + 1}. Część ${i + 1}`, body: `Akapit części ${i + 1} o umowach.`, check: { q: `Check ${i + 1}?`, options: ["Dobra", "Zła"], correct: 0 } });
const quiz = (t) => Array.from({ length: 12 }, (_, i) => ({ q: `Quiz ${t} ${i + 1}?`, options: ["Dobra", "Zła", "Zła 2", "Zła 3"], correct: 0, explanation: "Bo tak." }));
const concepts = [{ term: "Contract", definition: "Umowa: zgodne oświadczenia woli stron." }, ...Array.from({ length: 7 }, (_, i) => ({ term: `Legal term ${i + 1}`, definition: `Definicja pojęcia prawnego numer ${i + 1}.` }))];
const lesson = { sections: [0, 1, 2].map(sec), exit: [{ q: "Bilet?", options: ["Dobra", "Zła"], correct: 0 }], recap: { prompt: "Wyjaśnij umowę.", keys: ["strony"], model: "Wzór." }, exercises: [], faded: {}, formulas: [] };
const docs = {
  materials: {
    P1: { subjectId: P, kind: "lesson", order: 1, unit: 1, unitTitle: "Dział", title: "Lekcja 1: Umowy i zobowiązania", minutes: 35, quizCount: 12, flashcardCount: 0, conceptCount: 8, createdAt: Date.now(), v: 2 },
    A1: { subjectId: A, kind: "lesson", order: 1, unit: 1, unitTitle: "Dział", title: "Lekcja 1: Pochodne funkcji", minutes: 35, quizCount: 12, flashcardCount: 0, conceptCount: 0, workedCount: 1, createdAt: Date.now(), v: 2 },
  },
  materialContent: {
    P1: { v: 2, lesson, quiz: quiz("umowy"), flashcards: [], concepts, notes: [], tldr: "Umowy." },
    A1: { v: 2, lesson: { ...lesson, sections: [sec(0)] }, quiz: quiz("pochodne"), flashcards: [], concepts: [], notes: [], tldr: "",
      worked: [{ id: "w1", task: "Policz pochodną x² w punkcie 3.", steps: [{ do: "Pochodna x² to 2x", why: "wzór na potęgę", result: "2x" }, { do: "Wstaw 3", result: "6" }], answer: "6",
        similar: [{ task: "Policz pochodną x² w punkcie 5.", result: 10, tol: 0, unit: "", answer: "2·5 = 10" }] }] },
  },
  meta: {
    po: { items: {} },
    stas: { items: { "prawo~W~umowy": { sid: P, k: "W", t: "Umowy i zobowiązania", n: 2, at: 1 } } },
    "stas~prawo~W~umowy": { title: "Umowy według Stasia", at: 1, sentences: [
      { text: "Umowa to zgodne oświadczenia woli.", isWrong: false },
      { text: "Umowa zawsze musi być na piśmie.", isWrong: true, fix: "Umowa zwykle może być zawarta w dowolnej formie.", alts: ["Umowa zawsze musi być u notariusza.", "Umowy ustne są nieważne."], why: "Forma pisemna jest wyjątkiem." },
      { text: "Strony mogą swobodnie kształtować treść umowy.", isWrong: false },
      { text: "Niepełnoletni nie może zawrzeć żadnej umowy.", isWrong: true, fix: "Niepełnoletni może zawierać drobne umowy życia codziennego.", alts: ["Niepełnoletni może wszystko.", "Tylko rodzic może zawrzeć umowę."], why: "Są umowy drobne." },
      { text: "Zobowiązanie wygasa po wykonaniu.", isWrong: false },
    ] },
  },
  examBank: { [P]: { at: 1, done: [], items: [{ id: "k1", type: "case", mid: "P1", text: "Ola kupiła rower przez telefon.", sub: [{ q: "Czy umowa jest ważna?", answer: "Tak, forma dowolna.", rubric: [{ p: 1, t: "Problem: forma umowy" }, { p: 2, t: "Reguła: swoboda formy" }] }] }] } },
};
const T0 = 309; // dayN 6.11.2026
const SEG = [
  { mech: "haslo", typ: "gram", temat: "P1", min: 1 },
  { mech: "stas", typ: "sprawdzam", temat: "P1", min: 2.5 },
  { mech: "frun", typ: "gram", temat: "P1", min: 1.5, limitSec: 90 },
  { mech: "zadanie", typ: "tworze", temat: "A1", min: 3 },
  { mech: "pary", typ: "gram", temat: "P1", min: 1.5, limitSec: 90 },
  { mech: "kazus", typ: "tworze", temat: "P1", min: 3.5 },
  { mech: "drabina", typ: "sprawdzam", temat: "P1", min: 2.5, szczeble: 6 },
];
const p = await page(b, { konto: "platne", h: 900, ls: { "mock-docs": JSON.stringify(docs), "mock-progress": JSON.stringify({ [UID]: {} }) } });
await p.clock.setFixedTime(new Date("2026-11-06T17:00:00+01:00"));
await p.goto(BASE + "index.html#/ld"); await p.waitForTimeout(3000);
await p.evaluate(([T0, SEG]) => {
  const k = "bm-ld:" + T0, d = JSON.parse(localStorage.getItem(k) || "null") || { d: T0, plany: {}, done: {}, tem: [], pom: {} };
  d.plany.l0 = { temat: "P1", sid: "prawo", tematy: ["P1", "A1"], rola: "najwazniejsze", tryb: "utrwalanie", nowe: true, min: 20, segmenty: SEG.map((s, i) => ({ i, nazwa: s.mech, ...s })), powody: [] };
  localStorage.setItem(k, JSON.stringify(d));
}, [T0, SEG]);
await p.reload(); await p.waitForTimeout(2500);
try {
const panels = p.locator("main section.panel.sk-panel");
ok("lista: lekcja 1 z wstrzykniętym planem", /Umowy/.test(await panels.nth(1).innerText()) && (await panels.nth(1).locator(".sk-chip").count()) === 7, await panels.nth(1).innerText());
await panels.nth(1).getByRole("button", { name: /Zaczynam/ }).click(); await p.locator(".ld-seg").waitFor({ timeout: 15000 }); await p.waitForTimeout(400);
const typ = () => p.locator(".lp-stage > section.lp-card").first().getAttribute("data-type");
const cta = p.locator(".lp-cta");
const awans = async () => { if (await p.locator("#layer .lvup").count()) { await p.locator("#layer").getByRole("button", { name: "Super!" }).click(); await p.waitForTimeout(250); } };
const dalej = async () => { await awans(); await cta.click(); await p.waitForTimeout(450); await awans(); };

// ---- Hasło ----
ok("Hasło: karta z planszą 8 liter", (await typ()) === "haslo" && (await p.locator(".lp-stage .hd-row").first().locator(".hd-t").count()) === 8, await typ());
await p.locator(".lp-stage input").fill("CONTRAST"); await cta.click(); await p.waitForTimeout(250);
const kol = await p.locator(".lp-stage .hd-row").first().locator(".hd-t").evaluateAll((ts) => ts.map((t) => t.className.match(/s(\d)/)?.[1]).join(""));
ok("Hasło: kolory liter (CONTRAST vs CONTRACT)", kol === "22222202", kol);
await p.locator(".lp-stage input").fill("contract"); await cta.click(); await p.waitForTimeout(300);
ok("Hasło: zgadnięte, definicja", /Zgadnięte/.test(await p.locator(".lp-stage").innerText()) && /zgodne oświadczenia/.test(await p.locator(".lp-stage").innerText()), await p.locator(".lp-stage").innerText());
await shot(p, "ld3-haslo");
await dalej();

// ---- Staś ----
ok("Staś: karta z tekstem Stasia", (await typ()) === "stas" && (await p.locator(".lp-stage .stas-s").count()) === 5, await typ());
await p.locator(".lp-stage .stas-s").nth(1).click(); await p.waitForTimeout(100);
await p.locator(".lp-stage .stas-s").nth(3).click(); await p.waitForTimeout(100);
await cta.click(); await p.waitForTimeout(300); // Sprawdź
await p.locator(".lp-stage .po-opt", { hasText: "dowolnej formie" }).click(); await p.waitForTimeout(150);
await p.locator(".lp-stage .po-opt", { hasText: "drobne umowy" }).click(); await p.waitForTimeout(150);
await shot(p, "ld3-stas");
await cta.click(); await p.waitForTimeout(300); // Gotowe
ok("Staś: 4/4 pkt i zapis wyniku", /4\/4 pkt/.test(await p.locator(".lp-stage").innerText()) && await p.evaluate(() => !!JSON.parse(localStorage.getItem("bm-stas-done") || "{}")["prawo~W~umowy"]), await p.locator(".lp-stage").innerText());
ok("Staś: odpowiedź do bazy (nauka_rp_stas)", await p.evaluate(() => (window.__rpStas || []).length === 1), "");
await dalej();

// ---- Fruń w trybie lekcji ----
ok("Fruń: karta gry", (await typ()) === "gra" && /Fruń/.test(await p.locator(".lp-stage h2").innerText()), await typ());
const hash0 = await p.evaluate(() => location.hash);
await cta.click(); await p.locator(".gry").waitFor({ timeout: 15000 }); await p.waitForTimeout(800);
ok("Fruń: gra nad lekcją, adres bez zmian, odtwarzacz zostaje", (await p.locator(".lp").count()) === 1 && (await p.evaluate(() => location.hash)) === hash0, await p.evaluate(() => location.hash));
await shot(p, "ld3-frun");
// listek spada: odpowiadamy dobrze na „Drugą szansę”, aż runda się skończy
for (let i = 0; i < 80 && (await p.locator(".gry").count()); i++) {
  const sheet = p.locator(".gry-sheet");
  if (await sheet.count()) {
    const o = sheet.locator(".gry-opt", { hasText: "Dobra" });
    if (await o.count() && (await o.first().isEnabled())) { await o.first().click(); await p.waitForTimeout(200); }
    const btn = sheet.getByRole("button", { name: /Graj dalej|Zobacz wynik/ });
    if (await btn.count()) { await btn.first().click(); await p.waitForTimeout(300); }
  } else { await p.locator(".gry-stage").click({ position: { x: 50, y: 50 } }).catch(() => {}); await p.waitForTimeout(700); }
}
ok("Fruń: koniec rundy wraca do lekcji z wynikiem", (await p.locator(".gry").count()) === 0 && /Wynik: \d+ kolumn[ay]? · \d\/\d dobrze/.test(await p.locator(".lp-stage").innerText()), await p.locator(".lp-stage").innerText());
const rpc = await p.evaluate(() => JSON.stringify(window.__rpc || []));
ok("Fruń: runda w bazie (start, odpowiedzi z gry, koniec)", rpc.includes("nauka_gra_start") && rpc.includes("nauka_gra_koniec") && rpc.includes('"gra"'), rpc.slice(-1500));
ok("Fruń: klasa lp-lock zostaje (lekcja dalej zablokowana)", await p.evaluate(() => document.documentElement.classList.contains("lp-lock") && !document.documentElement.classList.contains("gry-lek")), "");
await shot(p, "ld3-frun-wynik");
await dalej();

// ---- zadanie krok po kroku (Analiza) ----
ok("zadanie: kroki rozwiązania", (await typ()) === "example", await typ());
for (let i = 0; i < 4 && (await cta.isVisible()) && (await cta.isEnabled()); i++) { await cta.click(); await p.waitForTimeout(150); if ((await typ()) !== "example") break; }
if ((await typ()) === "example") await dalej();
ok("zadanie: teraz sam (karta liczbowa)", (await typ()) === "num" && /punkcie 5/.test(await p.locator(".lp-stage").innerText()), await p.locator(".lp-stage").innerText());
await p.locator(".lp-stage input").fill("10"); await cta.click(); await p.waitForTimeout(300);
ok("zadanie: dobry wynik i zapis rp.zadanie", /Dobrze/.test(await p.locator(".lp-stage").innerText()) && (await p.evaluate(() => JSON.stringify(window.__rpc || []))).includes("nauka_rp_zadanie"), await p.locator(".lp-stage").innerText());
await dalej();

// ---- Pary: „wstecz” w trakcie gry nie zamyka lekcji ----
ok("Pary: karta gry", (await typ()) === "gra" && /Pary/.test(await p.locator(".lp-stage h2").innerText()), await typ());
await cta.click(); await p.locator(".gry").waitFor({ timeout: 15000 }); await p.waitForTimeout(800);
ok("Pary: 6 par z pojęć tematu", (await p.locator(".gry .pk").count()) === 12, await p.locator(".gry").innerText());
await shot(p, "ld3-pary");
await p.locator(".gry .pk").first().click(); await p.waitForTimeout(300);
await p.goBack(); await p.waitForTimeout(600);
ok("Pary: „wstecz” pyta o przerwanie, lekcja zostaje", (await p.getByText("Przerwać rundę?").count()) === 1 && (await p.locator(".lp").count()) === 1, await p.locator("body").innerText());
await p.getByRole("button", { name: "Zakończ rundę" }).click(); await p.waitForTimeout(500);
ok("Pary: przerwana runda wraca na kartę", (await p.locator(".gry").count()) === 0 && /Runda przerwana/.test(await p.locator(".lp-stage").innerText()), await p.locator(".lp-stage").innerText());
await dalej();

// ---- kazus ----
ok("kazus: treść sprawy i pytanie", (await typ()) === "recap" && /Ola kupiła rower/.test(await p.locator(".lp-stage").innerText()) && /kazus/i.test(await p.locator(".lp-stage").innerText()), await p.locator(".lp-stage").innerText());
await p.locator(".lp-stage textarea").fill("Umowa jest ważna, bo obowiązuje swoboda formy."); await cta.click(); await p.waitForTimeout(250);
ok("kazus: rubryka i wzór do samooceny", /Reguła: swoboda formy/.test(await p.locator(".lp-stage").innerText()) && (await p.locator(".lp-stage details").count()) === 1, await p.locator(".lp-stage").innerText());
await shot(p, "ld3-kazus");
await dalej();

// ---- Drabina (6 szczebli) ----
ok("Drabina: karta finału", (await typ()) === "gra" && /Drabina/.test(await p.locator(".lp-stage h2").innerText()), await typ());
await cta.click(); await p.locator(".gry .dr").waitFor({ timeout: 15000 }); await p.waitForTimeout(500);
ok("Drabina: 6 szczebli", (await p.locator(".gry .dr-rung").count()) === 6 && /z 6/.test(await p.locator(".gry .dr-step").innerText()), await p.locator(".gry .dr-step").innerText());
await shot(p, "ld3-drabina");
for (let i = 0; i < 6; i++) {
  await p.locator(".gry .dr-opt", { hasText: "Dobra" }).first().click(); await p.waitForTimeout(250);
  const up = p.locator(".gry").getByRole("button", { name: /Wyżej|Zobacz wynik/ }); await up.first().click(); await p.waitForTimeout(400);
}
ok("Drabina: cała drabina = wynik 6 w lekcji", (await p.locator(".gry").count()) === 0 && /Wynik: 6 szczebli · 6\/6 dobrze/.test(await p.locator(".lp-stage").innerText()), await p.locator(".lp-stage").innerText());
await dalej();
await p.waitForTimeout(500);
ok("koniec lekcji: Zrobione ✓", /Zrobione ✓/.test(await p.locator(".lp-done-screen").innerText().catch(() => "")), await p.locator(".lp").innerText().catch(() => ""));
const mech = await p.evaluate(() => JSON.parse(localStorage.getItem("bm-ld-mech") || "{}"));
ok("historia: ukończone haslo, stas, frun, zadanie, kazus, drabina", ["haslo", "stas", "frun", "zadanie", "kazus", "drabina"].every((m) => (mech[m] || []).some((e) => e.stan === "ukonczona")), mech);
ok("historia: Pary (przerwana runda) = porzucona (etap 5)", (mech.pary || []).some((e) => e.stan === "porzucona"), mech.pary);
ok("bez błędów w konsoli", p.errors.length === 0, p.errors);

// ---- zwykła gra poza lekcją dalej jak dotąd (adres #/gra/, ekran wyniku) ----
await p.getByRole("button", { name: "Gotowe" }).click(); await p.waitForTimeout(500); await awans();
await p.goto(BASE + "index.html#/gry"); await p.waitForTimeout(1500);
await p.evaluate(() => window.SKROT_GRY?.open ? null : null);
const zwykla = await p.evaluate(async () => { await new Promise((r) => setTimeout(r, 300)); return typeof window.SKROT_GRY?.open === "function"; });
ok("gry.js wczytany (zwykłe gry)", zwykla, "");

} catch (e) { ok("bez wyjątku w teście", false, String(e).slice(0, 300) + " | typ: " + (await p.locator(".lp-stage > section.lp-card").first().getAttribute("data-type").catch(() => "?")) + " | " + (await p.locator(".lp-stage").innerText().catch(() => "")).slice(0, 300)); }
await b.close();
for (const w of wyniki) console.log(w.join(" "));
const bad = wyniki.filter((w) => w[0] === "✗").length;
console.log(`\n${wyniki.length - bad}/${wyniki.length}`);
process.exit(bad ? 1 : 0);
