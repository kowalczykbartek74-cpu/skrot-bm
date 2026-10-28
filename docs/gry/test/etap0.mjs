// Etap 0 (SPEC 11.2): wpięcia punktów rankingu w quiz, zadania, Powtórki; brak bazy v13 nic nie psuje.
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = [];
const ok = (nazwa, warunek, info) => { wyniki.push([warunek ? "✓" : "✗", nazwa, warunek ? "" : JSON.stringify(info)]); };
const calls = (p, fn) => p.evaluate((fn) => window.__rpc.filter((x) => x.fn === fn).map((x) => x.args), fn);
// Odpowiada w odtwarzaczu na bieżące pytanie: zwraca oryginalny indeks wybranej opcji (z tekstu „Odpowiedź X<i>”).
async function odpowiedz(p, ktora) {
  const opts = p.locator(".lp-opts .opt");
  await opts.first().waitFor({ timeout: 5000 });
  const t = await opts.nth(ktora).textContent();
  await opts.nth(ktora).click();
  return "ABCD".indexOf(t.match(/Odpowiedź ([ABCD])/)[1]);
}
async function nav(p, hash) { await p.goto(BASE + "index.html#/" + hash); await p.reload(); await p.waitForTimeout(1300); }
async function dalej(p) { const n = p.locator(".lp-foot button.primary, .lp button:has-text('Dalej')").last(); await n.click({ timeout: 4000 }).catch(() => {}); await p.waitForTimeout(350); }

for (const v13 of ["1", "0"]) {
  const p = await page(b, { v13 });
  await p.goto(BASE + "index.html#/material/m1");
  await p.waitForTimeout(1500);
  await p.getByRole("button", { name: /Quiz/ }).first().click();
  await p.getByRole("button", { name: /Zaczynamy/ }).click();
  await p.waitForTimeout(700);
  // 1. pytanie: wybieramy drugą opcję na ekranie (po tasowaniu)
  const tekst = await p.locator(".lp-card .lp-q, .lp-q").first().textContent().catch(() => "");
  const wybor = await odpowiedz(p, 1);
  await p.waitForTimeout(300);
  await shot(p, "e0-quiz-" + v13);
  let c = await calls(p, "nauka_rp_odpowiedz");
  if (v13 === "1") {
    ok("quiz: rp.odp z oryginalnym indeksem", c.length === 1 && c[0].p_mid === "m1" && c[0].p_idx === 0 && c[0].p_wybor === wybor && c[0].p_zrodlo === "quiz", { c, wybor, tekst });
    // dalsze pytania, aż wróci pytanie 1 (druga szansa w quizie) – nie może wysłać drugiego wywołania dla idx 0
    for (let i = 0; i < 9; i++) { await dalej(p); if (await p.locator(".lp-opts .opt").count()) await odpowiedz(p, 0).catch(() => {}); }
    c = await calls(p, "nauka_rp_odpowiedz");
    ok("quiz: jedno wywołanie na pytanie", c.filter((x) => x.p_idx === 0).length === 1 && new Set(c.map((x) => x.p_idx)).size === c.length, c.map((x) => x.p_idx));
  } else {
    ok("bez v13: brak toastu i błędów", !(await p.locator(".toast").count()) && !p.errors.length, { errors: p.errors });
  }
  if (v13 === "1") {
    // Moje materiały: brak wywołań
    await nav(p, "material/my1");
    const before = 0;
    await p.getByRole("button", { name: /Quiz/ }).first().click();
    await p.getByRole("button", { name: /Zaczynamy/ }).click(); await p.waitForTimeout(600);
    await odpowiedz(p, 0); await p.waitForTimeout(300);
    ok("Moje materiały: brak rp.odp", (await calls(p, "nauka_rp_odpowiedz")).length === before);
    // zadanie krok po kroku
    await nav(p, "material/m1");
    await p.getByRole("button", { name: /Quiz/ }).first().click(); await p.waitForTimeout(500);
    const z = p.getByRole("button", { name: /Rozwiązane zadania/ });
    if (await z.count()) await z.click(); await p.waitForTimeout(600);
    const inp = p.locator('[id="sim-m1:w1:0"]');
    if (await inp.count()) {
      await inp.fill("4"); await p.getByRole("button", { name: "Sprawdź" }).first().click(); await p.waitForTimeout(200);
      await p.locator('[id="sim-m1:w1:0"]').fill("5"); await p.getByRole("button", { name: "Sprawdź" }).first().click(); await p.waitForTimeout(300);
      const zc = await calls(p, "nauka_rp_zadanie");
      ok("zadanie: jedno wywołanie (pierwsza próba)", zc.length === 1 && zc[0].p_wid === "w1" && zc[0].p_j === 0 && zc[0].p_wynik === 4, zc);
    } else { await shot(p, "e0-zadanie-brak"); ok("zadanie: pole wyniku znalezione", false, "brak #sim-m1:w1:0"); }
    // Powtórki: najpierw przejrzane fiszki (trafiają do Powtórek), potem ocena w Powtórkach
    await nav(p, "material/m1");
    await p.getByRole("button", { name: /Fiszki/ }).first().click(); await p.waitForTimeout(400);
    await p.getByRole("button", { name: /Zaczynamy/ }).click(); await p.waitForTimeout(600);
    await shot(p, "e0-fiszki");
    for (let i = 0; i < 3; i++) {
      await p.getByRole("button", { name: /Odwróć fiszkę/ }).click(); await p.waitForTimeout(350);
      if (!i) console.log("fiszki:", (await p.evaluate(() => [...document.querySelectorAll(".lp button")].map((x) => x.textContent.trim().slice(0, 30)).filter(Boolean))).join(" | "));
      await p.locator(".lp button").filter({ hasText: /Nie wiem|Jeszcze nie|Nie pamiętam|Trudne/ }).first().click().catch(() => {}); await p.waitForTimeout(450);
    }
    await shot(p, "e0-fiszki2");
    // termin fiszek przestawiamy na dziś (w atrapie bazy), żeby od razu były „do powtórki”
    await p.locator(".lp-x").click().catch(() => {}); await p.waitForTimeout(3500);
    await p.evaluate(() => { const d = JSON.parse(localStorage.getItem("mock-progress") || "{}"); for (const doc of Object.values(d)) for (const k of Object.keys(doc.srs || {})) doc.srs[k] = [doc.srs[k][0], 0]; localStorage.setItem("mock-progress", JSON.stringify(d));
      for (const k of Object.keys(localStorage)) if (k.startsWith("bm-progress-")) localStorage.removeItem(k); });
    await nav(p, "review");
    await shot(p, "e0-review");
    const start = p.getByRole("button", { name: /Zacznij|Powtórz|Start/ }).first();
    if (await start.count()) {
      await start.click(); await p.waitForTimeout(500);
      await p.getByRole("button", { name: /Odwróć kartę/ }).click(); await p.waitForTimeout(400);
      await shot(p, "e0-review-flip");
      await p.locator(".lp button").filter({ hasText: /Pamiętam/ }).first().click(); await p.waitForTimeout(500);
      const pc = await calls(p, "nauka_rp_powtorka");
      await shot(p, "e0-review2");
      ok("Powtórki: rp.powtorka po ocenie", pc.length === 1 && typeof pc[0].p_klucz === "string", pc);
    } else ok("Powtórki: jest przycisk startu", false, "brak");
    ok("zero błędów w konsoli", !p.errors.length, p.errors);
  }
  await p.context().close();
}
// Darmowe konto: nic nie jest wysyłane
{
  const p = await page(b, { konto: "darmowe" });
  await p.goto(BASE + "index.html#/material/m1"); await p.waitForTimeout(1500);
  await shot(p, "e0-darmowe");
  ok("darmowe: brak wywołań v13", !(await p.evaluate(() => window.__rpc.some((x) => /^nauka_rp_/.test(x.fn)))));
  await p.context().close();
}
await b.close();
for (const w of wyniki) console.log(w.join(" "));
process.exit(wyniki.some((w) => w[0] === "✗") ? 1 : 0);
