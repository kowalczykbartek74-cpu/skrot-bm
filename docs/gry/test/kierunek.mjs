// Ekran wejścia: wybór kierunku → rok i grupa → logowanie (niezalogowany, PL/EN, 390 i 1280 px).
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
let bad = 0;
const ok = (t, v) => { console.log((v ? "OK  " : "BŁĄD") + " " + t); if (!v) bad++; };
// lib.mjs ustawia bm-group (stary użytkownik); nowy gość nie ma grupy, więc ją kasujemy.
const fresh = async (opts) => { const p = await page(b, { konto: "brak", ...opts }); await p.addInitScript(() => { if (!sessionStorage.getItem("k-init")) { sessionStorage.setItem("k-init", "1"); localStorage.removeItem("bm-group"); localStorage.removeItem("bm-sub"); } }); return p; };

for (const lang of ["pl", "en"]) for (const w of [390, 1280]) {
  const p = await fresh({ lang, w, h: w > 900 ? 860 : 844 });
  await p.goto(BASE + "index.html");
  await p.waitForSelector("#lgKierunek .lk-card");
  ok(`${lang} ${w}: krok 1 widoczny, formularz logowania ukryty`, await p.locator("#loginBox").isHidden());
  ok(`${lang} ${w}: bez poziomego przewijania`, await p.evaluate(() => document.getElementById("login").scrollWidth <= innerWidth));
  if (lang === "en") ok("en: krok 1 po angielsku", (await p.locator("#lgKierunek h2").innerText()) === "What's your programme?");
  await shot(p, `kierunek-1-${lang}-${w}`);
  await p.click('#lgKierunek [data-k="bm"]');
  ok(`${lang} ${w}: krok 2 (rok i grupa)`, await p.locator('#lgKierunek [data-g="C112"]').isVisible());
  await p.click('#lgKierunek [data-g="C112"]');
  await shot(p, `kierunek-2-${lang}-${w}`);
  await p.click('#lgKierunek [data-a="dalej"]');
  ok(`${lang} ${w}: po „Dalej” widać logowanie i kartę kierunku`, (await p.locator("#loginBox").isVisible()) && (await p.locator("#lgWybrany").isVisible()));
  ok(`${lang} ${w}: zapisana grupa i kierunek`, await p.evaluate(() => localStorage.getItem("bm-group") === "C112" && localStorage.getItem("skrot-kierunek") === "bm"));
  await shot(p, `kierunek-3-${lang}-${w}`);
  // „Zmień” wraca do kroku 1, „Inny kierunek” pokazuje listę oczekujących.
  await p.click("#lgWybrany button");
  await p.click('#lgKierunek [data-k="inny"]');
  ok(`${lang} ${w}: inny kierunek → lista oczekujących`, await p.locator("#lk-kier").isVisible());
  await shot(p, `kierunek-wkrotce-${lang}-${w}`);
  // Po przeładowaniu kierunek jest zapamiętany.
  await p.click('#lgKierunek [data-a="wroc"]'); await p.click('#lgKierunek [data-k="bm"]'); await p.click('#lgKierunek [data-a="dalej"]');
  await p.reload(); await p.waitForSelector("#loginBox .btn, #loginBox input", { timeout: 8000 });
  ok(`${lang} ${w}: po przeładowaniu od razu logowanie`, (await p.locator("#lgKierunek .lk-card").count()) === 0 && await p.locator("#loginBox").isVisible());
  ok(`${lang} ${w}: konsola bez błędów`, p.errors.length === 0);
  if (p.errors.length) console.log(p.errors);
  await p.context().close();
}
// Stary użytkownik (ma grupę) i link promocyjny: bez kroku kierunku.
{ const p = await page(b, { konto: "brak" }); await p.goto(BASE + "index.html"); await p.waitForSelector("#loginBox .btn, #loginBox input");
  ok("stary użytkownik: od razu logowanie", (await p.locator("#lgKierunek .lk-card").count()) === 0); await p.context().close(); }
{ const p = await fresh({}); await p.goto(BASE + "index.html?proba=1"); await p.waitForSelector("#loginBox .btn, #loginBox input");
  ok("?proba=1: od razu logowanie", (await p.locator("#lgKierunek .lk-card").count()) === 0); await p.context().close(); }
// Zalogowany: ekran wejścia się nie pokazuje.
{ const p = await page(b, {}); await p.goto(BASE + "index.html"); await p.waitForTimeout(1500);
  ok("zalogowany: brak ekranu wejścia", await p.locator("#login").isHidden()); await p.context().close(); }
await b.close();
console.log(bad ? `${bad} błędów` : "wszystko OK");
process.exit(bad ? 1 : 0);
