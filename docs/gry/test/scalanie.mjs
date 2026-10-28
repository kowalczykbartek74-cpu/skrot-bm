// Scalenie gier (main) z okresem próbnym (v16-proba) i monetami / Zadaniami dnia / Sklepem (v14), na atrapie.
// 1) okres próbny: start z konta darmowego, pasek z licznikiem, powitanie, gry i punkty działają, koniec = blokada;
// 2) monety po grze: Hasło dnia w prawdziwym widoku + odpowiedzi quizu → saldo odświeża się samo (bez przebudowy gry);
// 3) Zadania dnia z nowych gier (gra1, haslo1, odp10) i odbiór nagrody; 4) zakup motywu w sklepie;
// 5) starosta: Aktywność → zakładka Monety; 6) EN. Zrzuty 390 i 1280: $OUT/scalanie/.
import { chromium, page, BASE, OUT } from "./lib.mjs";
import fs from "fs";
const D = OUT + "/scalanie"; fs.mkdirSync(D, { recursive: true });
const shot = (p, n, full) => p.screenshot({ path: `${D}/${n}.png`, fullPage: !!full });
const b = await chromium.launch();
const wyniki = [];
const ok = (nazwa, warunek, info) => { wyniki.push([warunek ? "✓" : "✗", nazwa, warunek ? "" : JSON.stringify(info)?.slice(0, 500)]); };
const calls = (p, fn) => p.evaluate((fn) => window.__rpc.filter((x) => x.fn === fn).map((x) => ({ ...x.args, res: x.res })), fn);
const txt = async (p, sel) => ((await p.locator(sel).count()) ? (await p.locator(sel).first().innerText()).replace(/\s+/g, " ") : "");
const hashGo = async (p, h, ms = 500) => { await p.evaluate((h) => { location.hash = h; }, h); await p.waitForTimeout(ms); };
const errs = [];
const done = (p, nazwa) => { if (p.errors.length) errs.push([nazwa, p.errors]); return p.context().close(); };
const saldo = (p) => p.evaluate(() => window.skrot?.sklep?.saldo);
const zamknijModale = (p) => p.evaluate(() => document.getElementById("layer")?.replaceChildren());

// 1) okres próbny
for (const [w, hgt] of [[390, 844], [1280, 800]]) {
  const tag = String(w);
  const p = await page(b, { konto: "darmowe", w, h: hgt });
  await p.goto(BASE + "index.html#/"); await p.waitForTimeout(2500);
  const btn = p.locator(".buybar button", { hasText: "Wypróbuj za darmo przez 3 dni" });
  ok(`${tag} darmowe: na Dziś „Wypróbuj za darmo przez 3 dni” w pasku`, (await btn.count()) === 1, await txt(p, ".buybar"));
  ok(`${tag} darmowe: gry zablokowane (rp.start → no_access)`, (await p.evaluate(() => window.skrot.rp.start("frun")))?.code === "no_access");
  if (w === 390) { await p.evaluate(() => scrollTo(0, 0)); await shot(p, `proba-przed-${tag}`); }
  await btn.click(); await p.waitForLoadState("load"); await p.waitForTimeout(3500);
  const st = await p.evaluate(() => ({ paid: window.skrot.paid, trial: window.skrot.trialUntil, konto: localStorage.getItem("mock-konto") }));
  ok(`${tag} start: przeładowanie, konto w okresie próbnym`, st.paid && !!st.trial && st.konto === "proba", st);
  const welcome = await txt(p, "#layer");
  ok(`${tag} start: powitanie „Masz 3 dni pełnego dostępu”`, welcome.includes("Masz 3 dni pełnego dostępu") && /okres próbny/i.test(welcome), welcome.slice(0, 200));
  if (w === 390) await shot(p, `proba-powitanie-${tag}`);
  await zamknijModale(p); await p.waitForTimeout(300);
  const bar = await txt(p, ".buybar");
  ok(`${tag} pasek: „Okres próbny · zostały 2 dni pełnego dostępu” + Kup dostęp`, /Okres próbny · zostały 2 dni pełnego dostępu/.test(bar) && bar.includes("Kup dostęp"), bar);
  const g = await p.evaluate(() => window.skrot.rp.start("drabina"));
  ok(`${tag} w okresie próbnym gry działają (rp.start ok)`, g?.ok === true, g);
  await p.evaluate(() => scrollTo(0, 0)); await shot(p, `proba-pasek-${tag}`);
  await done(p, `proba ${tag}`);
}
// licznik godzin i koniec
{
  const p = await page(b, { konto: "proba", ls: { "mock-proba-do": new Date(Date.now() + 5 * 36e5 + 6e4).toISOString() } });
  await p.goto(BASE + "index.html#/"); await p.waitForTimeout(2500);
  ok("licznik: 5 godzin przed końcem → „zostało 5 godzin”", (await txt(p, ".buybar")).includes("zostało 5 godzin"), await txt(p, ".buybar"));
  await done(p, "proba licznik");
}
{
  const p = await page(b, { konto: "proba-koniec" });
  await p.goto(BASE + "index.html#/"); await p.waitForTimeout(2500);
  const bar = await txt(p, ".buybar");
  const r = await p.evaluate(() => window.skrot.rp.start("frun"));
  ok("koniec: pasek „Pełny dostęp”, bez „Wypróbuj”, gry zablokowane", bar.startsWith("Pełny dostęp") && !bar.includes("Wypróbuj") && r?.code === "no_access", { bar, r });
  await p.evaluate(() => scrollTo(0, 0)); await shot(p, "proba-koniec-390");
  await done(p, "proba koniec");
}

// 2) + 3) monety po grze i Zadania dnia
for (const [w, hgt] of [[390, 844], [1280, 800]]) {
  const tag = String(w);
  const p = await page(b, { w, h: hgt, ls: { "mock-misje": "odp10,gra1,haslo1", "mock-misja-tydz": "tyd_d5" } });
  await p.goto(BASE + "index.html#/"); await p.waitForTimeout(2500);
  ok(`${tag} Dziś: saldo 0 pod powitaniem`, /🪙 0 monet/.test(await txt(p, ".greet-badges")), await txt(p, ".greet-badges"));
  // Hasło dnia w prawdziwym widoku
  await hashGo(p, "#/haslo", 1500);
  await p.keyboard.type("revenue", { delay: 30 }); await p.keyboard.press("Enter"); await p.waitForTimeout(2500);
  const nStan0 = (await calls(p, "nauka_sklep_stan")).length;
  const proba = (await calls(p, "nauka_haslo_proba")).pop();
  await p.evaluate(() => { const m = document.getElementById("main"); m.__znacznik = 1; if (m.firstElementChild) m.firstElementChild.__znacznik = 1; });
  await p.waitForTimeout(3500);
  const nStan1 = (await calls(p, "nauka_sklep_stan")).length;
  const nietkniety = await p.evaluate(() => document.getElementById("main").firstElementChild?.__znacznik === 1);
  ok(`${tag} Hasło dnia: +20 pkt → po 3 s saldo 2 🪙 (nowe nauka_sklep_stan)`, proba?.res?.pkt === 20 && nStan1 > nStan0 && (await saldo(p)) === 2, { proba, nStan0, nStan1, s: await saldo(p) });
  ok(`${tag} Hasło dnia: odświeżenie salda nie przebudowuje widoku gry`, nietkniety && (await p.locator(".hd-end, .hd-res, [class*='hd-'][class*='end']").count()) >= 0, nietkniety);
  // 10 dobrych odpowiedzi z quizu (pkt > 0) i jedna zła (pkt 0)
  await p.evaluate(async () => { for (let i = 0; i < 10; i++) await window.skrot.rp.odp({ mid: "m1", idx: i, wybor: i % 4, zrodlo: "quiz" }); await window.skrot.rp.odp({ mid: "m1", idx: 10, wybor: 3, zrodlo: "quiz" }); });
  await p.waitForTimeout(3600);
  ok(`${tag} quiz: 10 × 10 pkt → saldo 12 🪙`, (await saldo(p)) === 12, await saldo(p));
  // runda gry z punktami (Drabina 4 szczeble → 5 pkt)
  await p.evaluate(async () => { const r = await window.skrot.rp.start("drabina"); window.__run = r.run; });
  await p.waitForTimeout(100);
  const kon = await p.evaluate(() => window.skrot.rp.koniec({ run: window.__run, wynik: 4, czasMs: 50 }));
  ok(`${tag} Drabina: koniec rundy z pkt`, kon?.pkt > 0, kon);
  await hashGo(p, "#/", 3800);
  ok(`${tag} Dziś: odznaka monet pokazuje 12`, /🪙 12 monet/.test(await txt(p, ".greet-badges")), await txt(p, ".greet-badges"));
  // Sklep: Zadania dnia
  await hashGo(p, "#/shop", 1500);
  const mis = await p.locator(".shop-mission").allInnerTexts();
  const mt = mis.map((x) => x.replace(/\s+/g, " "));
  ok(`${tag} Zadania dnia: 3 dzienne + tygodniowe`, mt.length === 4, mt);
  ok(`${tag} odp10 10/10 z „Odbierz +8 🪙”`, mt.some((x) => x.includes("Odpowiedz dobrze na 10 pytań") && x.includes("10/10") && x.includes("Odbierz +8 🪙")), mt);
  ok(`${tag} gra1 (Drabina) 1/1 z „Odbierz +5 🪙”`, mt.some((x) => x.includes("Zagraj jedną rundę gry") && x.includes("1/1") && x.includes("Odbierz +5 🪙")), mt);
  ok(`${tag} haslo1 1/1 z „Odbierz +5 🪙”`, mt.some((x) => x.includes("Rozwiąż Hasło dnia") && x.includes("1/1") && x.includes("Odbierz +5 🪙")), mt);
  const hero = await txt(p, ".shop-hero");
  ok(`${tag} Sklep: „Dziś z nauki: 12/64”`, hero.includes("Dziś z nauki: 12/64"), hero);
  await p.evaluate(() => { const d = document.querySelector(".shop-how"); if (d) d.open = true; });
  ok(`${tag} Sklep: opis monet z Hasłem dnia i Bossem, limit 64`, (await txt(p, ".shop-how")).includes("Hasło dnia i pokonany Boss przed kolokwium.") && (await txt(p, ".shop-how")).includes("najwyżej 64 dziennie z nauki"), await txt(p, ".shop-how"));
  await p.evaluate(() => scrollTo(0, 0)); await shot(p, `sklep-zadania-${tag}`, w === 1280);
  await p.locator(".shop-mission", { hasText: "Rozwiąż Hasło dnia" }).locator("button", { hasText: "Odbierz" }).click(); await p.waitForTimeout(1500);
  ok(`${tag} odbiór haslo1: saldo 17, „✓ Odebrane”`, (await saldo(p)) === 17 && (await txt(p, ".shop-mission.is-done")).includes("Rozwiąż Hasło dnia"), { s: await saldo(p), t: await txt(p, ".shop-mission.is-done") });
  // „Zacznij” dla gra1 prowadzi do Graj (gdy nie zrobione)
  await done(p, `monety ${tag}`);
}
{
  const p = await page(b, { ls: { "mock-misje": "gra1,haslo1,pow10" } });
  await p.goto(BASE + "index.html#/shop"); await p.waitForTimeout(2500);
  await p.locator(".shop-mission", { hasText: "Zagraj jedną rundę gry" }).locator("button", { hasText: "Zacznij" }).click(); await p.waitForTimeout(700);
  const h1 = await p.evaluate(() => location.hash);
  await hashGo(p, "#/shop", 1200);
  await p.locator(".shop-mission", { hasText: "Rozwiąż Hasło dnia" }).locator("button", { hasText: "Zacznij" }).click(); await p.waitForTimeout(700);
  const h2 = await p.evaluate(() => location.hash);
  ok("„Zacznij”: gra1 → #/gry, haslo1 → #/haslo", h1 === "#/gry" && h2 === "#/haslo", { h1, h2 });
  await done(p, "zacznij");
}

// 4) zakup motywu
for (const [w, hgt] of [[390, 844], [1280, 800]]) {
  const tag = String(w);
  const p = await page(b, { w, h: hgt, ls: { "mock-saldo": "400" } });
  await p.goto(BASE + "index.html#/shop"); await p.waitForTimeout(2500);
  const kup = p.locator("#shop-bow button", { hasText: "Kup za 350 🪙" });
  ok(`${tag} Kokardka: „Kup za 350 🪙”, Nocny rejs: brakuje`, (await kup.count()) === 1 && (await txt(p, "#shop-sea")).includes("Brakuje 400 🪙"), [await txt(p, "#shop-bow"), await txt(p, "#shop-sea")]);
  await kup.click(); await p.waitForTimeout(500);
  if (w === 390) await shot(p, `sklep-kup-modal-${tag}`);
  const modalTxt = await txt(p, "#layer");
  ok(`${tag} okno zakupu: cena i reszta`, modalTxt.includes("Kupić motyw Kokardka za 350 🪙?") && modalTxt.includes("Zostanie Ci 50 🪙."), modalTxt);
  await p.locator("#layer button", { hasText: /^Kup$/ }).click(); await p.waitForTimeout(1500);
  ok(`${tag} po zakupie: „Odblokowano motyw”, saldo 50, motyw posiadany`, (await txt(p, "#layer")).includes("Odblokowano motyw Kokardka") && (await saldo(p)) === 50
    && (await p.evaluate(() => window.skrot.sklep.posiadane.has("motyw:bow"))), [await txt(p, "#layer"), await saldo(p)]);
  await p.locator("#layer button", { hasText: "Włącz teraz" }).click(); await p.waitForTimeout(800);
  ok(`${tag} motyw włączony`, (await p.evaluate(() => document.documentElement.getAttribute("data-theme"))) === "bow", await p.evaluate(() => document.documentElement.getAttribute("data-theme")));
  await p.evaluate(() => scrollTo(0, 0)); await shot(p, `sklep-po-zakupie-${tag}`);
  await done(p, `zakup ${tag}`);
}

// 5) starosta: Aktywność → Monety
for (const [w, hgt] of [[390, 844], [1280, 800]]) {
  const tag = String(w);
  const p = await page(b, { konto: "starosta", w, h: hgt });
  await p.goto(BASE + "index.html#/"); await p.waitForTimeout(2500);
  await zamknijModale(p);
  await p.evaluate(() => window.skrot.openAdminActivity()); await p.waitForTimeout(1200);
  await p.locator("#layer button", { hasText: /^Monety$/ }).click(); await p.waitForTimeout(800);
  const t = await txt(p, "#layer");
  ok(`${tag} starosta: zakładka Monety z dziś/tydzień/saldo i limitem 64`, t.includes("a@x.pl") && t.includes("dziś 41") && t.includes("tydzień 180") && t.includes("saldo 520") && t.includes("najwyżej 64 dziennie") && t.includes("± monety"), t.slice(0, 600));
  await shot(p, `starosta-monety-${tag}`);
  await p.locator("#layer button", { hasText: /^Konta/ }).click(); await p.waitForTimeout(500);
  ok(`${tag} starosta: Konta z „🪙 monety dziś”`, (await txt(p, "#layer")).includes("🪙 monety dziś 41 · saldo 520"), (await txt(p, "#layer")).slice(0, 400));
  await done(p, `starosta ${tag}`);
}

// 6) EN: sklep i pasek okresu próbnego
{
  const p = await page(b, { lang: "en", ls: { "mock-misje": "odp10,gra1,haslo1" } });
  await p.goto(BASE + "index.html#/shop"); await p.waitForTimeout(2500);
  await p.evaluate(() => { const d = document.querySelector(".shop-how"); if (d) d.open = true; });
  const t = await txt(p, "#main");
  ok("EN sklep: misje i opis po angielsku", t.includes("Solve the Word of the Day") && t.includes("Play one game round") && t.includes("The Word of the Day and a defeated Boss before the test.")
    && t.includes("up to 64 a day from studying") && !/Rozwiąż|Zagraj jedną|Hasło dnia i pokonany/.test(t), t.slice(0, 900));
  await shot(p, "en-sklep-390");
  await done(p, "en sklep");
  const q = await page(b, { lang: "en", konto: "proba" });
  await q.goto(BASE + "index.html#/"); await q.waitForTimeout(2500);
  const bar = await txt(q, ".buybar");
  ok("EN pasek okresu próbnego", /^Free trial · 2 days left of full access/.test(bar), bar);
  await done(q, "en proba");
}

ok("zero błędów w konsoli", !errs.length, errs);
await b.close();
for (const [a, n, i] of wyniki) console.log(a, n, i ? "→ " + i : "");
const zle = wyniki.filter((x) => x[0] === "✗").length;
console.log(`${wyniki.length - zle}/${wyniki.length}`);
process.exit(zle ? 1 : 0);
