// „Dla Ciebie na dziś”, poprawki 7.11: wybór tematu karty 5 min, 5 podpowiedzi w Haśle, pytanie co 20 kolumn we Fruń.
// Zegar: 6.11.2026, 17:00. Uruchom: python3 -m http.server <port> w repo, BASE=http://127.0.0.1:<port>/ node docs/gry/test/lekcja-dnia-6.mjs
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 700)]);
const UID = "00000000-0000-4000-8000-000000000001";
const T0 = 309;
const A = "analiza-matematyczna", M = "logistyka", Z = "podstawy-zarzadzania", P = "prawo";
const sec = (t, i) => ({ h: `${i + 1}. ${t} ${i + 1}`, body: `Akapit ${i + 1} o **Contract** i **pojęciu ${i + 1}** w temacie ${t}.`, check: { q: `Check ${t} ${i + 1}?`, options: ["Dobra", "Zła"], correct: 0 } });
const lesson = (t) => ({ sections: [0, 1, 2, 3].map((i) => sec(t, i)), exit: [{ q: `Bilet ${t}?`, options: ["Dobra", "Zła"], correct: 0 }], recap: { prompt: `Wyjaśnij ${t}.`, keys: ["a"], model: "Wzór." }, exercises: [], faded: {}, formulas: [] });
const quiz = (t) => Array.from({ length: 12 }, (_, i) => ({ q: `Quiz ${t} ${i + 1}?`, options: ["Dobra", "Zła", "Zła 2", "Zła 3"], correct: 0, explanation: "Bo tak." }));
const concepts = (t) => [{ term: "Contract", definition: "Umowa: zgodne oświadczenia woli stron, contractual." }, ...Array.from({ length: 7 }, (_, i) => ({ term: `Term ${t} ${i}`, definition: `Definicja ${i}.` }))];
const mat = (sid, order, title) => ({ subjectId: sid, kind: "lesson", order, unit: 1, unitTitle: "Dział", title, minutes: 35, quizCount: 12, flashcardCount: 0, conceptCount: 8, createdAt: Date.now(), v: 2 });
const content = (t) => ({ v: 2, lesson: lesson(t), quiz: quiz(t), flashcards: [], concepts: concepts(t), notes: [], tldr: "" });
const docs = {
  materials: { A1: mat(A, 1, "Lekcja 1: Pochodne funkcji"), M1: mat(M, 1, "Lekcja 1: Łańcuch dostaw"), M2: mat(M, 2, "Lekcja 2: Zapasy i magazyny"), Z1: mat(Z, 1, "Lekcja 1: Funkcje zarządzania"), P1: mat(P, 1, "Lekcja 1: Umowy i zobowiązania") },
  materialContent: { A1: content("pochodne"), M1: content("łańcuch"), M2: content("zapasy"), Z1: content("funkcje"), P1: content("umowy") },
  meta: { po: { items: {} }, stas: { items: {} } },
};
const ls0 = { "mock-docs": JSON.stringify(docs), "mock-progress": JSON.stringify({ [UID]: {} }) };
const open = async (hash = "#/") => {
  const q = await page(b, { konto: "platne", h: 900, ls: ls0 });
  await q.clock.setFixedTime(new Date("2026-11-06T17:00:00+01:00"));
  await q.goto(BASE + "index.html?ld=1" + hash); await q.waitForTimeout(3000);
  return q;
};
const p = await open();
try {
  // ---- Wybierz temat karty 5 min ----
  const hero = p.locator(".ld-hero");
  const t1 = await hero.locator("h2").innerText();
  await hero.getByRole("button", { name: /Wybierz temat/ }).click(); await p.waitForTimeout(200);
  const sel = hero.locator("select");
  const opts = await sel.locator("option").allInnerTexts();
  ok("„Wybierz temat”: lista tematów z przedmiotami", (await sel.count()) === 1 && opts.length === 6 && (await sel.locator("optgroup").count()) === 4, opts);
  await shot(p, "ld6-wybor");
  const want = t1.includes("Zapasy") ? "M1" : "M2", wantT = want === "M1" ? "Łańcuch" : "Zapasy";
  await sel.selectOption(want); await p.waitForTimeout(400);
  ok("wybrany temat w karcie 5 min", (await hero.locator("h2").innerText()).includes(wantT) && (await hero.locator("select").count()) === 0, await hero.innerText());
  ok("powód: „Temat wybrany przez Ciebie”", /Temat wybrany przez Ciebie/.test(await hero.innerText()), await hero.innerText());
  ok("plan dnia zapamiętuje wybór", await p.evaluate(([T0, w]) => { const d = JSON.parse(localStorage.getItem("bm-ld:" + T0)); return d.dzien.karta.temat === w && d.dzien.karta.wybrany === true; }, [T0, want]), "");
  await hero.getByRole("button", { name: /Zaczynam/ }).click(); await p.locator(".lp").waitFor({ timeout: 15000 }); await p.waitForTimeout(500);
  ok("po otwarciu karta zostaje z wybranego tematu", await p.evaluate(([T0, w]) => { const d = JSON.parse(localStorage.getItem("bm-ld:" + T0)); return d.plany.karta?.temat === w && d.plany.karta.wybrany === true; }, [T0, want]), "");
  await p.keyboard.press("Escape"); await p.waitForTimeout(300);
  await p.close();

  // ---- Plan zamrożony, zanim strona znała dostęp (telefon): bez lekcji → sam się układa jeszcze raz ----
  const ph = await page(b, { konto: "platne", w: 390, h: 844, ls: ls0 });
  await ph.clock.setFixedTime(new Date("2026-11-06T17:00:00+01:00"));
  await ph.addInitScript((T0) => { if (!sessionStorage.getItem("ld6-once")) { sessionStorage.setItem("ld6-once", "1");
    localStorage.setItem("bm-ld:" + T0, JSON.stringify({ d: T0, plany: {}, done: {}, tem: [], pom: {}, dzien: { dzien: { tryb: "utrwalanie", nowe: true }, karta: { temat: "Z1", sid: "podstawy-zarzadzania", tryb: "utrwalanie", nowe: true, kroki: [], min: 5, powody: [] }, lekcje: [], dlugosc: 20, graCo: 5, bezProfilu: true, profil: {} } })); } }, T0);
  await ph.goto(BASE + "index.html?ld=1#/"); await ph.waitForTimeout(3500);
  ok("telefon: plan bez lekcji z wczytywania naprawia się sam (2 lekcje)", (await ph.locator(".ld-tile").count()) === 2 && await ph.evaluate((T0) => JSON.parse(localStorage.getItem("bm-ld:" + T0)).dzien.lekcje.length === 2, T0), (await ph.locator("main").innerText()).slice(0, 400));
  // zrobiona karta 5 min: karta zostaje, dochodzą tylko lekcje (bez jej tematu)
  await ph.evaluate((T0) => { const d = JSON.parse(localStorage.getItem("bm-ld:" + T0)); d.dzien.lekcje = []; d.plany = { karta: d.dzien.karta }; d.done = { karta: 1 }; localStorage.setItem("bm-ld:" + T0, JSON.stringify(d)); }, T0);
  await ph.reload(); await ph.waitForTimeout(3000);
  const d2 = await ph.evaluate((T0) => JSON.parse(localStorage.getItem("bm-ld:" + T0)), T0);
  ok("zrobiona karta zostaje, lekcje dochodzą (bez tematu karty)", (await ph.locator(".ld-tile").count()) === 2 && d2.done.karta && d2.plany.karta && d2.dzien.lekcje.length === 2 && d2.dzien.lekcje.every((l) => l.temat !== d2.dzien.karta.temat), d2.dzien.lekcje?.map((l) => l.temat));
  // zaczęta lekcja: planu nie ruszamy
  await ph.evaluate((T0) => { const d = JSON.parse(localStorage.getItem("bm-ld:" + T0)); d.dzien.lekcje = d.dzien.lekcje.slice(0, 1); d.plany.l0 = d.dzien.lekcje[0]; localStorage.setItem("bm-ld:" + T0, JSON.stringify(d)); }, T0);
  await ph.reload(); await ph.waitForTimeout(3000);
  ok("zaczęta lekcja: plan zostaje bez zmian", (await ph.locator(".ld-tile").count()) === 1, "");
  await shot(ph, "ld6-telefon");
  await ph.close();

  // ---- Hasło z podpowiedziami + Fruń z pytaniem co 20 kolumn ----
  const q = await open("#/ld");
  await q.evaluate((T0) => {
    const k = "bm-ld:" + T0, d = JSON.parse(localStorage.getItem(k) || "null") || { d: T0, plany: {}, done: {}, tem: [], pom: {} };
    d.plany.l0 = { temat: "P1", sid: "prawo", tematy: ["P1"], rola: "najwazniejsze", tryb: "utrwalanie", nowe: true, min: 20, segmenty: [
      { i: 0, nazwa: "haslo", mech: "haslo", typ: "gram", temat: "P1", min: 1 }, { i: 1, nazwa: "frun", mech: "frun", typ: "gram", temat: "P1", min: 1.5, limitSec: 300 }], powody: [] };
    localStorage.setItem(k, JSON.stringify(d));
  }, T0);
  await q.reload(); await q.waitForTimeout(2500);
  await q.locator("main section.panel.sk-panel").nth(1).getByRole("button", { name: /Zaczynam/ }).click(); await q.locator(".ld-seg").waitFor({ timeout: 15000 }); await q.waitForTimeout(400);
  const stage = q.locator(".lp-stage"), cta = q.locator(".lp-cta");
  ok("Hasło: przed pierwszą próbą bez podpowiedzi", (await stage.locator(".lp-tip li").count()) === 0 && /Po każdej złej próbie/.test(await stage.innerText()), await stage.innerText());
  const counts = [], texts = [];
  for (const w of ["CONTRAST", "AAAAAAAA", "BBBBBBBB", "CCCCCCCC", "DDDDDDDD"]) {
    await stage.locator("input").fill(w); await cta.click(); await q.waitForTimeout(250);
    counts.push(await stage.locator(".lp-tip li").count());
  }
  texts.push(...(await stage.locator(".lp-tip li").allInnerTexts()));
  ok("Hasło: po każdej złej próbie jedna podpowiedź więcej (1…5)", counts.join() === "1,2,3,4,5", counts);
  ok("Hasło: podpowiedzi od pierwszej litery do liter alfabetycznie", /Zaczyna się na „C”/.test(texts[0]) && /^Znaczenie: Umowa/.test(texts[1]) && /Kończy się na „T”/.test(texts[2]) && /C _ N _ R _ C T/.test(texts[3]) && /A C C N O R T T/.test(texts[4]), texts);
  ok("Hasło: słowo ukryte w definicji", !/contract/i.test(texts[1]), texts[1]);
  ok("Hasło: licznik „Podpowiedzi 5/5”", /Podpowiedzi 5\/5/.test(await stage.innerText()), "");
  await shot(q, "ld6-haslo-podpowiedzi");
  await stage.locator("input").fill("contract"); await cta.click(); await q.waitForTimeout(300);
  ok("Hasło: zgadnięte w 6. próbie, podpowiedzi znikają", /Zgadnięte/.test(await stage.innerText()) && (await stage.locator(".lp-tip").count()) === 0, await stage.innerText());
  await cta.click(); await q.waitForTimeout(500);
  if (await q.locator("#layer .lvup").count()) { await q.locator("#layer").getByRole("button", { name: "Super!" }).click(); await q.waitForTimeout(250); }

  // Fruń
  await cta.click(); await q.locator(".gry").waitFor({ timeout: 15000 }); await q.waitForTimeout(800);
  await q.locator(".gry-stage").click({ position: { x: 50, y: 50 } }); await q.waitForTimeout(200);
  await q.evaluate(() => window.SKROT_GRY._set({ score: 19, invuln: 120 }));
  let sheet = q.locator(".gry-sheet");
  for (let i = 0; i < 60 && !(await sheet.count()); i++) { await q.locator(".gry-stage").click({ position: { x: 50, y: 50 } }).catch(() => {}); await q.waitForTimeout(250); }
  const head = (await sheet.count()) ? await sheet.innerText() : "";
  ok("Fruń: po 20 kolumnach pytanie", /20 kolumn · pytanie/i.test(head) && (await q.evaluate(() => window.SKROT_GRY._dbg().score)) === 20, head);
  ok("Fruń: pytania nie da się pominąć", (await sheet.getByRole("button", { name: /Pomiń/ }).count()) === 0, head);
  await shot(q, "ld6-frun-pytanie");
  await sheet.locator(".gry-opt", { hasText: "Dobra" }).first().click(); await q.waitForTimeout(250);
  await sheet.getByRole("button", { name: "Graj dalej" }).click(); await q.waitForTimeout(500);
  const dbg = await q.evaluate(() => window.SKROT_GRY._dbg());
  ok("Fruń: po odpowiedzi listek czeka na dotknięcie, wynik zostaje", (await q.locator(".gry-sheet").count()) === 0 && dbg.st === "gotowy" && dbg.score === 20 && dbg.invuln > 0, dbg);
  ok("Fruń: odpowiedź poszła do bazy jak pytanie z gry", await q.evaluate(() => JSON.stringify(window.__rpc || []).includes('"gra"')), "");
  await q.close();

  // ---- Podkreślone pojęcia w nowej lekcji: dotknięcie pokazuje wyjaśnienie (jak w zwykłej lekcji) ----
  const r = await open("#/ld");
  await r.evaluate((T0) => {
    const k = "bm-ld:" + T0, d = JSON.parse(localStorage.getItem(k) || "null") || { d: T0, plany: {}, done: {}, tem: [], pom: {} };
    d.plany.l0 = { temat: "M1", sid: "logistyka", tematy: ["M1"], rola: "najwazniejsze", tryb: "utrwalanie", nowe: true, min: 20, segmenty: [
      { i: 0, nazwa: "wyjasnienie", mech: "wyjasnienie", typ: "ucze", temat: "M1", sekcja: 0, min: 3 }], powody: [] };
    localStorage.setItem(k, JSON.stringify(d));
  }, T0);
  await r.reload(); await r.waitForTimeout(2500);
  await r.locator("main section.panel.sk-panel").nth(1).getByRole("button", { name: /Zaczynam/ }).click(); await r.locator(".ld-seg").waitFor({ timeout: 15000 }); await r.waitForTimeout(600);
  const term = r.locator(".lp-stage b.lp-term", { hasText: "Contract" });
  for (let i = 0; i < 6 && !(await term.count()); i++) { await r.locator(".lp-cta").click(); await r.waitForTimeout(400); }
  ok("pojęcie w nowej lekcji jest podkreślone (lp-term)", (await term.count()) >= 1, await r.locator(".lp-stage").innerText());
  await term.first().click(); await r.waitForTimeout(400);
  const sh = (await r.locator(".lp-sheet.on").count()) ? await r.locator(".lp-sheet.on").innerText() : "";
  ok("dotknięcie pokazuje wyjaśnienie z definicją", /Contract/.test(sh) && /zgodne oświadczenia woli/.test(sh), sh);
  await shot(r, "ld6-pojecie");
  await r.getByRole("button", { name: "Jasne, wracam" }).click(); await r.waitForTimeout(300);
  ok("„Jasne, wracam” zamyka wyjaśnienie", (await r.locator(".lp-sheet.on").count()) === 0, "");
  await r.close();
} catch (e) { ok("bez wyjątku", false, String(e?.stack || e)); }
await b.close();
for (const [s, n, i] of wyniki) console.log(s, n, i);
console.log(`${wyniki.filter((x) => x[0] === "✓").length}/${wyniki.length}`);
