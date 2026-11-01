// „Jeszcze prościej” (Analiza) na atrapie: Panel AI generuje, bloki są klikalne.
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 500)]);
const now = Date.now();
const topics = [0, 1, 2].map((i) => ({ t: `Granica ${i}`, summary: `The limit of f(x) as x approaches a is the value f gets close to (${i}).`, why: "Needed for derivatives", remember: ["lim"], example: "lim x->2 of 3x = 6" }));
const DOCS = {
  materials: {
    am1: { subjectId: "analiza-matematyczna", title: "Granice funkcji", quizCount: 0, flashcardCount: 0, createdAt: now - 9e6, v: 2 },
    am2: { subjectId: "analiza-matematyczna", kind: "lesson", order: 1, title: "Pochodna", quizCount: 0, flashcardCount: 0, createdAt: now - 8e6, v: 2 },
    pz1: { subjectId: "podstawy-zarzadzania", title: "Planowanie", quizCount: 0, flashcardCount: 0, createdAt: now - 7e6, v: 2 },
  },
  materialContent: {
    am1: { v: 2, tldr: "Limits describe where a function is heading.", purpose: "Base of calculus.", topics, concepts: [], quiz: [],
      worked: [{ id: "w1", task: "Compute lim x->3 of (2x+1).", steps: [{ do: "Substitute x = 3", result: "7", why: "Function is continuous" }], answer: "7" }] },
    am2: { v: 2, concepts: [], quiz: [], lesson: { v2: true, intro: "Pochodna", sections: [
      { h: "1. Rate of change", intuition: "Speed of a car", body: "The derivative f'(x) measures how fast f changes when x changes a little. It is the slope of the tangent line.", example: { task: "f(x)=x^2, f'(3)?", steps: ["f'(x)=2x", "f'(3)=6"], answer: "6" } },
      { h: "2. Rules", body: "Power rule: (x^n)' = n x^(n-1). Constant rule: (c)' = 0." }] } },
    pz1: { v: 2, tldr: "Planowanie.", topics: [{ t: "Plan", summary: "Planning is deciding in advance." }], concepts: [], quiz: [] },
  },
};
const prompty = [];
function fakeAi(prompt) {
  prompty.push(prompt);
  if (prompt.startsWith("Jesteś cierpliwym korepetytorem z matematyki")) {
    const bl = JSON.parse(prompt.split("BLOKI:\n")[1]);
    return { items: bl.map((x) => ({ k: x.k, t: `PROSTO: ${x.tytul}. To jak dzielenie pizzy (limit).`, ex: "Masz 2 pizze i 3 kolegów.\nKażdy dostaje \\(2/3\\).\nWynik: 2/3 pizzy" })) };
  }
  return {};
}
const p = await page(b, { konto: "starosta", ls: { "mock-docs": JSON.stringify(DOCS), "bm-starosta": "1" } });
await p.context().route(/functions\/v1\/claude/, async (r) => { const { prompt } = JSON.parse(r.request().postData()); r.fulfill({ contentType: "application/json", body: JSON.stringify({ json: fakeAi(prompt) }) }); });

// przed generowaniem: brak przycisków
await p.goto(BASE + "index.html#/material/am1"); await p.waitForTimeout(2500);
ok("przed generowaniem: brak 💡", (await p.locator(".ez-chip").count()) === 0, await p.locator(".ez-chip").count());

await p.evaluate(() => { location.hash = "#/ai"; }); await p.waitForTimeout(1500);
const sec = p.locator("section.panel", { has: p.locator("h2", { hasText: "Jeszcze prościej (Analiza)" }) });
ok("sekcja w Panelu AI", await sec.count() === 1, await p.locator("main").innerText().catch(() => ""));
ok("2 materiały Analizy", /materiały: 2/.test(await sec.innerText()), await sec.innerText());
await sec.getByRole("button", { name: /^Start/ }).click();
await p.waitForFunction(() => !/Generuję…/.test(document.body.innerText), null, { timeout: 30000 }); await p.waitForTimeout(300);
const log = await sec.locator("ul.pipeline li").allInnerTexts();
ok("log: oba gotowe", log.length === 2 && (await sec.locator(".sdot.ok").count()) === 2, log);
await shot(p, "ez-panel");
const stan = await p.evaluate(async () => { const db = await window.claude?.use?.("db"); const g = async (id) => { const s = await db.doc("materialSimple/" + id).get(); return s.exists ? s.data() : null; }; return { a: await g("am1~ez"), b: await g("am2~ez"), c: await g("pz1~ez"), s: await g("am1") }; }).catch((e) => ({ err: String(e) }));
ok("am1~ez: 1 + 3 tematy + 1 zadanie = 5", Object.keys(stan.a?.items || {}).length === 5, stan);
ok("am2~ez: 2 części lekcji", Object.keys(stan.b?.items || {}).length === 2, stan.b);
ok("pz1 nietknięty, materialSimple/am1 nie powstał", !stan.c && !stan.s, stan);
const ezP = prompty.filter((x) => x.startsWith("Jesteś cierpliwym korepetytorem z matematyki"));
ok("prompt: same bloki z kluczem", ezP.length === 2 && ezP.every((x) => /"k":"[otsw]:/.test(x)), ezP.map((x) => x.slice(-300)));
// ponowne uruchomienie: nic nowego, bez zapytań
await sec.getByRole("button", { name: /^Start/ }).click();
await p.waitForFunction(() => !/Generuję…/.test(document.body.innerText), null, { timeout: 30000 }); await p.waitForTimeout(300);
ok("drugie uruchomienie: nic nowego, 0 zapytań", prompty.length === 2 && (await sec.locator("ul.pipeline li").allInnerTexts()).every((l) => /nic nowego/.test(l)), await sec.locator("ul.pipeline li").allInnerTexts());

// widok materiału: opracowanie
await p.evaluate(() => { location.hash = "#/material/am1"; }); await p.waitForTimeout(1500);
const nChip = await p.locator(".ez-chip").count();
ok("am1 opracowanie: 4 klikalne bloki (o co chodzi + 3 tematy)", nChip === 4, nChip);
await shot(p, "ez-study");
await p.locator("section.topic").nth(1).locator("p").first().click();
await p.waitForTimeout(400);
const modal = await p.locator(".modal").innerText().catch(() => "");
ok("klik w tekst tematu otwiera okno", /Jeszcze prościej/i.test(modal) && /PROSTO: Granica 1/.test(modal) && /Łatwy przykład/.test(modal) && /Wynik: 2\/3/.test(modal), modal);
await shot(p, "ez-modal");
await p.getByRole("button", { name: "Jasne, łapię" }).click();
await p.locator(".ez-chip").first().click(); await p.waitForTimeout(300);
ok("przycisk 💡 przy „O co chodzi” otwiera okno", /PROSTO: O co chodzi/.test(await p.locator(".modal").innerText().catch(() => "")), "");
await p.keyboard.press("Escape");

// zadania krok po kroku
await p.getByRole("button", { name: /Quiz/ }).first().click(); await p.waitForTimeout(800);
const zad = p.getByRole("button", { name: /Rozwiązane zadania/ }).first();
if (await zad.count()) { await zad.click(); await p.waitForTimeout(800);
  ok("zadanie krok po kroku: 💡", (await p.locator(".wk-ex .ez-chip").count()) === 1, await p.locator("main").innerText());
  await p.locator(".wk-ex .ez-chip").click(); await p.waitForTimeout(300);
  ok("zadanie: okno z Przykład 1", /PROSTO: Przykład 1/.test(await p.locator(".modal").innerText().catch(() => "")), ""); await p.keyboard.press("Escape");
} else ok("zakładka Zadania", false, await p.locator("main").innerText());

// inny przedmiot: nic
await p.evaluate(() => { location.hash = "#/material/pz1"; }); await p.waitForTimeout(1200);
ok("Podstawy zarządzania: brak 💡", (await p.locator(".ez-chip").count()) === 0, "");

// lekcja: odtwarzacz kart, „Nie łapię”
await p.evaluate(() => { location.hash = "#/material/am2"; }); await p.waitForTimeout(1500);
await shot(p, "ez-lesson-start");
await p.getByRole("button", { name: /Zaczynamy/ }).first().click(); await p.waitForTimeout(800);
let seen = false;
for (let i = 0; i < 8 && !seen; i++) {
  const help = p.locator(".lp-help");
  if (await help.isVisible().catch(() => false)) {
    await help.click(); await p.waitForTimeout(500);
    const t = await p.locator(".lp-sheet").innerText().catch(() => "");
    ok("karty lekcji: „Nie łapię” pokazuje Jeszcze prościej", /PROSTO: Rate of change/.test(t) && /Łatwy przykład/.test(t), t);
    await shot(p, "ez-lp-sheet"); seen = true; break;
  }
  const cta = p.locator(".lp-cta, .lp-foot .btn.primary").first(); await cta.click().catch(() => {}); await p.waitForTimeout(500);
}
if (!seen) ok("karty lekcji: przycisk Nie łapię widoczny", false, await p.locator("body").innerText());
await p.keyboard.press("Escape"); await p.keyboard.press("Escape"); await p.waitForTimeout(300);
await p.evaluate(() => { location.hash = "#/home"; }); await p.waitForTimeout(500);
await p.evaluate(() => { location.hash = "#/material/am2"; }); await p.waitForTimeout(1200);
const txtBtn = p.getByRole("button", { name: /Pokaż lekcję jako tekst/ });
if (await txtBtn.count()) { await txtBtn.click(); await p.waitForTimeout(800);
  const all = p.getByRole("button", { name: "Pokaż całą lekcję" }); if (await all.count()) { await all.click(); await p.waitForTimeout(600); }
  ok("lekcja jako tekst: 💡 przy obu częściach", (await p.locator(".lsec .ez-chip").count()) === 2, await p.locator(".lsec .ez-chip").count());
  await shot(p, "ez-lesson-text");
} else ok("przycisk tekstu lekcji", false, "");
console.log(wyniki.map((x) => x.join(" ")).join("\n"));
console.log("błędy:", p.errors);
await b.close();
