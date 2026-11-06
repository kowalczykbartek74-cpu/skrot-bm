// „Dla Ciebie na dziś”, etap 2: karta 5 min i lekcje w odtwarzaczu (źródło „ld”), „Pomiń ten krok”, przerwij i wróć.
// Ekran próbny #/ld. Zegar: piątek 6.11.2026, 17:00. Uruchom: python3 -m http.server <port> w repo, BASE=http://127.0.0.1:<port>/
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 700)]);
const UID = "00000000-0000-4000-8000-000000000001";
const hashStr = (s) => { let x = 2166136261; for (const ch of String(s)) { x ^= ch.codePointAt(0); x = Math.imul(x, 16777619) >>> 0; } return x.toString(36); };
const A = "analiza-matematyczna", M = "logistyka";
const sec = (t, i) => ({ h: `${i + 1}. ${t} ${i + 1}`, intuition: `Intuicja ${t} ${i + 1}.`, body: `Pierwszy akapit części ${i + 1} o **pojęciu ${i + 1}**, czyli rzeczy, którą warto znać na zaliczeniu z tego tematu.\n\nDrugi akapit: przykład z życia i krótki wniosek, żeby było jasne, po co to jest.`,
  simple: `Prościej: część ${i + 1}.`, check: { q: `Check ${t} ${i + 1}?`, options: ["Dobrze", "Źle", "Też źle"], correct: 0, why: "Bo tak." } });
const lesson = (t) => ({ sections: [0, 1, 2, 3, 4, 5].map((i) => sec(t, i)), exit: [0, 1, 2].map((i) => ({ q: `Bilet ${t} ${i + 1}?`, options: ["Tak", "Nie"], correct: 0 })),
  recap: { prompt: `Wyjaśnij ${t} własnymi słowami.`, keys: ["pierwsza rzecz", "druga rzecz"], model: `Wzór: ${t} to …` }, exercises: [{ task: `Ćwiczenie ${t}`, hint: "Podpowiedź", answer: "42", level: 2 }], faded: {}, formulas: [] });
const quiz = (t) => Array.from({ length: 10 }, (_, i) => ({ q: `Quiz ${t} ${i + 1}?`, options: ["Dobra", "Zła", "Zła 2", "Zła 3"], correct: 0, explanation: "Wyjaśnienie." }));
const fl = (t) => Array.from({ length: 8 }, (_, i) => ({ q: `Fiszka ${t} ${i + 1}?`, a: `Odpowiedź ${i + 1}.` }));
const concepts = (t) => Array.from({ length: 8 }, (_, i) => ({ term: `Pojecie${t.slice(0, 3)}${i}`, definition: `Definicja pojęcia ${i} w temacie ${t}.` }));
const mat = (id, sid, order, title, extra = {}) => ({ subjectId: sid, kind: "lesson", order, unit: 1, unitTitle: "Dział", title, minutes: 35, quizCount: 10, flashcardCount: 8, conceptCount: 8, createdAt: Date.now(), v: 2, lang: "pl", ...extra });
const content = (t) => ({ v: 2, lesson: lesson(t), quiz: quiz(t), flashcards: fl(t), concepts: concepts(t), notes: [], tldr: "" });
const docs = {
  materials: { A1: mat("A1", A, 1, "Lekcja 1: Pochodne funkcji jednej zmiennej"), A2: mat("A2", A, 2, "Lekcja 2: Całki oznaczone"), A3: mat("A3", A, 3, "Lekcja 3: Ekstrema lokalne"),
    M1: mat("M1", M, 1, "Lekcja 1: Inflacja i stopy procentowe"), M2: mat("M2", M, 2, "Lekcja 2: PKB i wzrost") },
  materialContent: { A1: content("pochodne"), A2: content("całki"), A3: content("ekstrema"), M1: content("inflacja"), M2: content("PKB") },
  meta: {
    po: { items: { "x~W~1": { sid: A, k: "W", t: "Pochodne funkcji jednej zmiennej", syl: true, d: null, at: 1 } } },
    "po~x~W~1": { title: "Pochodne", lead: "O czym były zajęcia.", key: ["a", "b", "c"], terms: [], at: 1,
      parts: [{ h: "O co chodziło", t: "Pochodna mówi, jak szybko zmienia się **funkcja**. To podstawa całego działu." }, { h: "Jak to policzyć", t: "Liczysz granicę ilorazu różnicowego. W praktyce korzystasz z gotowych wzorów." }],
      quiz: [{ q: "Pochodna stałej to?", options: ["0", "1", "x"], correct: 0, why: "Stała się nie zmienia." }] },
    stas: { items: {} },
  },
};
const T0 = 309; // dayN dla 6.11.2026 (od 1.01.2026)
const srs = { ["A2:" + hashStr("Fiszka całki 1?")]: [2, T0 - 2], ["M2:" + hashStr("Fiszka PKB 2?")]: [3, T0 - 1] };
const ls0 = { "mock-docs": JSON.stringify(docs), "mock-progress": JSON.stringify({ [UID]: { srs } }) };
const p = await page(b, { konto: "platne", ls: ls0 });
await p.clock.setFixedTime(new Date("2026-11-06T17:00:00+01:00"));
await p.goto(BASE + "index.html#/ld"); await p.waitForTimeout(3000);
let main = await p.locator("main").innerText();
const panels = p.locator("main section.panel.sk-panel");
ok("#/ld: karta 5 min i dwie lekcje", (await panels.count()) === 3 && /Dziś · 5 min/i.test(main) && /najważniejsze teraz/i.test(main) && /na zmianę/i.test(main), [await panels.count(), main.slice(0, 200)]);
const titles = await panels.locator("h2").allInnerTexts();
ok("trzy różne tematy", new Set(titles).size === 3, titles);
const subj = (t) => (/Pochodne|Całki|Ekstrema/.test(t) ? A : M);
ok("lekcja 2 z innego przedmiotu niż lekcja 1", subj(titles[1]) !== subj(titles[2]), titles);
ok("chipy mechanik przy lekcjach", (await panels.nth(1).locator(".sk-chip").count()) >= 5, await panels.nth(1).innerText());
await shot(p, "ld-lista");

// ---- przejście talii: prosty „uczeń”, który zawsze wybiera pierwszą odpowiedź i idzie dalej ----
const SEEN = [];
const awans = async (p) => { await p.waitForTimeout(300); if (await p.locator("#layer .lvup").count()) { await p.locator("#layer").getByRole("button", { name: "Super!" }).click(); await p.waitForTimeout(300); } };
async function krok(p) {
  await p.waitForFunction(() => !document.querySelector(".lp-leave"), null, { timeout: 3000 }).catch(() => {}); await p.waitForTimeout(60);
  // Okno „Awans!” (poziom XP) wyskakuje w trakcie lekcji: zamykamy jak uczeń.
  if (await p.locator("#layer .lvup").count()) { await p.locator("#layer").getByRole("button", { name: "Super!" }).click(); await p.waitForTimeout(200); }
  const card = p.locator(".lp-stage > section.lp-card, .lp-stage > .lp-done-screen").first();
  if (await p.locator(".lp-done-screen").count()) return "koniec";
  const typ = await card.getAttribute("data-type"); SEEN.push(typ);
  const cta = p.locator(".lp-cta");
  const click = async (loc) => { if (await loc.count()) { await loc.first().click(); await p.waitForTimeout(120); return true; } return false; };
  if (typ === "mc" || typ === "rvmc" || typ === "hook") { const o = card.locator(".opt:not([disabled])"); if (await o.count()) { await o.first().click(); await p.waitForTimeout(150); } }
  else if (typ === "grade4") { if (!(await card.locator(".g-good").count())) { await card.locator(".lp-sw.top").click(); await p.waitForTimeout(120); } await click(card.locator(".g-good")); await p.waitForTimeout(400); return typ; }
  else if (typ === "tf") { await click(card.locator(".opt, .btn").first()); }
  else if (typ === "recall") { if (await cta.isEnabled()) await cta.click(); await p.waitForTimeout(100); await click(card.getByRole("button", { name: /Wiedziałem/ })); await p.waitForTimeout(400); return typ; }
  else if (typ === "recap") { const ta = card.locator("textarea"); if (await ta.count()) { await ta.fill("Moje wyjaśnienie własnymi słowami."); await cta.click(); await p.waitForTimeout(150); } }
  else if (typ === "exercise") { if (await cta.isVisible() && /Pokaż/.test(await cta.innerText())) { await cta.click(); await p.waitForTimeout(120); } await click(card.getByRole("button", { name: /Miałem dobrze/ })); }
  else if (typ === "gra" || typ === "stas" || typ === "haslo") { await p.locator(".ld-skip").click(); await p.waitForTimeout(300); return typ + "→pomiń"; }
  else if (typ === "example") { for (let i = 0; i < 8 && (await cta.isVisible()) && (await cta.isEnabled()); i++) { await cta.click(); await p.waitForTimeout(80); } return typ; }
  else if (typ === "match") { await p.locator(".ld-skip").click(); await p.waitForTimeout(300); return "match→pomiń"; }
  else if (typ === "order") { await p.locator(".ld-skip").click(); await p.waitForTimeout(300); return "order→pomiń"; }
  else if (typ === "visual" || typ === "read") { for (let i = 0; i < 8 && (await cta.isVisible()) && /Pokaż kolejny|Odsłoń|kolejny/i.test(await cta.innerText()); i++) { await cta.click(); await p.waitForTimeout(80); } }
  if ((await cta.isVisible()) && (await cta.isEnabled())) { await cta.click(); await p.waitForTimeout(260); }
  return typ;
}
async function przejdz(p, max = 120) { const typy = []; for (let i = 0; i < max; i++) { const t = await krok(p); typy.push(t); if (t === "koniec") break; } return typy; }

// ---- karta 5 min ----
await panels.nth(0).getByRole("button", { name: /Zaczynam/ }).click(); await p.waitForTimeout(1500);
ok("odtwarzacz otwarty (źródło ld)", (await p.locator(".lp").count()) === 1 && (await p.locator(".ld-seg").innerText()).length > 1, await p.locator("body").innerText());
ok("pierwszy segment: rozgrzewka", /Rozgrzewka/.test(await p.locator(".ld-seg").innerText()), await p.locator(".ld-seg").innerText());
await shot(p, "ld-karta-start");
const typyK = await przejdz(p);
ok("karta: są fiszki z Powtórek, kawałek i pytania", typyK.includes("grade4") && typyK.includes("read") && typyK.filter((t) => t === "mc").length >= 2, typyK);
const koniecK = await p.locator(".lp-done-screen").innerText();
ok("karta: Zrobione ✓ i „Przejdź do lekcji”", /Zrobione ✓/.test(koniecK) && /Przejdź do lekcji/.test(koniecK), koniecK);
await shot(p, "ld-karta-koniec");
const srsK = await p.evaluate(() => JSON.parse(localStorage.getItem("bm-progress-anon") || localStorage.getItem("mock-progress") || "{}"));
await p.waitForTimeout(3500);
const prog = await p.evaluate((u) => JSON.parse(localStorage.getItem("mock-progress") || "{}")[u] || {}, UID);
ok("ocena fiszek trafiła do FSRS (termin przesunięty)", Object.values(prog.srs || {}).some((v) => v[1] > T0), prog.srs);
ok("zdarzenie nauki „ld” w postępie tematu", Object.values(prog.learn || {}).some((x) => x.ld), prog.learn);

// ---- lekcja 1: kilka kroków, „Pomiń”, przerwanie ----
await p.getByRole("button", { name: /Przejdź do lekcji/ }).click(); await p.locator(".ld-seg").waitFor({ timeout: 15000 }); await p.waitForTimeout(300);
ok("lekcja 1 otwiera się z karty", (await p.locator(".lp").count()) === 1 && /Lekcja dla Ciebie/.test(await p.locator(".lp").getAttribute("aria-label")), await p.locator(".lp").getAttribute("aria-label"));
const lekcjaOd = SEEN.length;
const seg0 = await p.locator(".ld-seg").innerText();
for (let i = 0; i < 3; i++) await krok(p);
const seg1 = await p.locator(".ld-seg").innerText();
await p.locator(".ld-skip").click(); await p.waitForTimeout(500);
const seg2 = await p.locator(".ld-seg").innerText();
ok("„Pomiń ten krok” przechodzi do następnego segmentu", seg2 !== seg1, [seg0, seg1, seg2]);
await shot(p, "ld-lekcja-pomin");
const key = await p.evaluate(() => Object.keys(localStorage).find((k) => /^bm-pl:ld:\d+:l0$/.test(k)));
const idx0 = await p.evaluate((k) => JSON.parse(localStorage.getItem(k)).idx, key);
await p.locator(".lp-x").click(); await p.waitForTimeout(600);
main = await p.locator("main").innerText();
ok("po przerwaniu: „Wróć (zostało ok. N min)”", /Wróć \(zostało ok\. \d+ min\)/.test(main), main);
const mech = await p.evaluate(() => JSON.parse(localStorage.getItem("bm-ld-mech") || "{}"));
ok("historia mechanik: pominięta i ukończone", Object.values(mech).flat().some((e) => e.stan === "pominieta") && Object.values(mech).flat().some((e) => e.stan === "ukonczona"), mech);
await shot(p, "ld-wroc");
await p.reload(); await p.waitForTimeout(2500);
await awans(p); await p.locator("main section.panel.sk-panel").nth(1).getByRole("button", { name: /Wróć/ }).click(); await p.locator(".ld-seg").waitFor({ timeout: 15000 }); await p.waitForTimeout(300);
const idx1 = await p.evaluate((k) => JSON.parse(localStorage.getItem(k)).idx, key);
ok("powrót po odświeżeniu w to samo miejsce", idx1 === idx0 && (await p.locator(".ld-seg").innerText()) === seg2, [idx0, idx1]);
await przejdz(p); const typyL = SEEN.slice(lekcjaOd);
const koniecL = await p.locator(".lp-done-screen").innerText();
ok("lekcja 1: koniec z „Następna lekcja”", /Zrobione ✓/.test(koniecL) && /Następna lekcja/.test(koniecL), koniecL);
ok("lekcja 1: kawałki wyjaśnienia z checkiem i biletem/finałem", typyL.filter((t) => t === "read").length >= 2 && typyL.includes("mc"), typyL);
ok("lekcja 1 (Analiza, ilościowy): „tworzę” to ćwiczenie", typyL.includes("exercise"), typyL);
await shot(p, "ld-lekcja-koniec");
await p.getByRole("button", { name: /Następna lekcja/ }).click(); await p.locator(".ld-seg").waitFor({ timeout: 15000 }); await p.waitForTimeout(300);
// do „Wyjaśnij” i wpisany tekst przeżywa zamknięcie
let doRecap = false;
for (let i = 0; i < 60; i++) { await p.waitForFunction(() => !document.querySelector(".lp-leave"), null, { timeout: 3000 }).catch(() => {}); if (await p.locator(".lp-done-screen").count()) break; const t = await p.locator(".lp-stage > section.lp-card").first().getAttribute("data-type").catch(() => null); if (t === "recap") { doRecap = true; break; } await krok(p); }
if (doRecap) {
  await p.locator(".lp-stage textarea").fill("Tekst, który nie może zginąć.");
  await p.waitForTimeout(200);
  await p.locator(".lp-x").click(); await p.waitForTimeout(500);
  await awans(p); await p.locator("main section.panel.sk-panel").nth(2).getByRole("button", { name: /Wróć/ }).click(); await p.locator(".ld-seg").waitFor({ timeout: 15000 }); await p.waitForTimeout(300);
  ok("„Wyjaśnij”: wpisany tekst wraca po przerwie", (await p.locator(".lp-stage textarea").inputValue()) === "Tekst, który nie może zginąć.", await p.locator(".lp-stage").innerText());
  ok("kopia tekstu w kopie.js", await p.evaluate(() => Object.keys(localStorage).some((k) => k.startsWith("skrot:kopia:ld:"))), "");
} else ok("lekcja ma segment „Wyjaśnij”", false, [SEEN.slice(-30), await p.evaluate(() => { const d = JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => /^bm-ld:\d+$/.test(k)))); return d.plany.l1.segmenty.map((s) => s.mech); })]);
await przejdz(p);
const koniec2 = await p.locator(".lp-done-screen").innerText();
ok("po obu lekcjach: „Na dziś zrobione”", /Na dziś zrobione/.test(koniec2), koniec2);
await p.getByRole("button", { name: "Gotowe" }).click(); await p.waitForTimeout(600);
main = await p.locator("main").innerText();
ok("lista: trzy razy „Zrobione ✓”", (main.match(/Zrobione ✓/g) || []).length === 3, main);
const ost = await p.evaluate(() => JSON.parse(localStorage.getItem("bm-ld-ost") || "[]"));
ok("mechaniki dwóch ostatnich lekcji zapisane", ost.length === 2 && ost[0].length >= 4, ost);
// XP tylko raz: „Zrób jeszcze raz” nie daje XP (postęp zapisuje się z opóźnieniem, więc czekamy)
await p.waitForTimeout(3500);
const xp0 = await p.evaluate((u) => JSON.parse(localStorage.getItem("mock-progress") || "{}")[u]?.xp?.t || 0, UID);
if (await p.locator("#layer .lvup").count()) { await p.locator("#layer").getByRole("button", { name: "Super!" }).click(); await p.waitForTimeout(300); }
await p.locator("main section.panel.sk-panel").nth(0).getByRole("button", { name: /Zrób jeszcze raz/ }).click(); await p.waitForTimeout(1500);
await przejdz(p); await p.getByRole("button", { name: "Gotowe" }).click(); await p.waitForTimeout(3500);
const xp1 = await p.evaluate((u) => JSON.parse(localStorage.getItem("mock-progress") || "{}")[u]?.xp?.t || 0, UID);
ok("powtórka tego samego dnia bez XP", xp1 === xp0, [xp0, xp1]);
ok("bez błędów w konsoli", p.errors.length === 0, p.errors);

// ---- telefon 360 px i ciemny motyw: odtwarzacz bez poziomego przewijania ----
const q = await page(b, { konto: "platne", w: 360, h: 760, ls: ls0, ctx: { colorScheme: "dark" } });
await q.clock.setFixedTime(new Date("2026-11-06T17:00:00+01:00"));
await q.goto(BASE + "index.html#/ld"); await q.waitForTimeout(3000);
await q.locator("main section.panel.sk-panel").nth(1).getByRole("button", { name: /Zaczynam/ }).click(); await q.waitForTimeout(1500);
ok("360 px: pasek z segmentem i „Pomiń” bez przewijania w bok", await q.evaluate(() => document.documentElement.scrollWidth <= 360 && document.querySelector(".lp-top").scrollWidth <= document.querySelector(".lp-top").clientWidth + 1), "");
await shot(q, "ld-360-ciemny");
ok("360 px: bez błędów", q.errors.length === 0, q.errors);

// ---- EN ----
const e = await page(b, { konto: "platne", lang: "en", ls: ls0 });
await e.clock.setFixedTime(new Date("2026-11-06T17:00:00+01:00"));
await e.goto(BASE + "index.html#/ld"); await e.waitForTimeout(3000);
const em = await e.locator("main").innerText();
ok("EN: lista po angielsku", /Today · 5 min/i.test(em) && /Start/.test(em) && !/Zaczynam|Dla Ciebie/.test(em), em.slice(0, 600));
await e.locator("main section.panel.sk-panel").nth(0).getByRole("button", { name: /Start/ }).click(); await e.locator(".ld-seg").waitFor({ timeout: 15000 }); await e.waitForTimeout(400);
ok("EN: pasek odtwarzacza", /Warm-up/.test(await e.locator(".ld-seg").innerText()) && /Skip/.test(await e.locator(".ld-skip .t").textContent()), [await e.locator(".ld-seg").innerText(), await e.locator(".ld-skip .t").textContent()]);
await shot(e, "ld-en");
ok("EN: bez błędów", e.errors.length === 0, e.errors);
await b.close();
for (const w of wyniki) console.log(w.join(" "));
const bad = wyniki.filter((w) => w[0] === "✗").length;
console.log(`\n${wyniki.length - bad}/${wyniki.length}`);
process.exit(bad ? 1 : 0);
