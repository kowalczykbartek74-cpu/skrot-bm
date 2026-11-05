// Prostsze „Więcej” na atrapie: profil w jednym wierszu, kafelki nauki, 5 pozycji „Ty”, Ustawienia z zakładkami,
// Polecaj w sklepie, narzędzia starosty na osobnym ekranie i angielski bez polskich resztek.
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 600)]);
const open = async (p, hash) => { await p.goto(BASE + "index.html" + hash); await p.waitForTimeout(2200); };

// ---- student z pełnym dostępem, telefon
const p = await page(b, { konto: "platne", ls: { "mock-saldo": "156" } });
await open(p, "#/more");
const H = await p.evaluate(() => document.documentElement.scrollHeight);
ok("Więcej na telefonie: najwyżej ~2 ekrany (było ~6)", H < 2000, H);
ok("profil w jednym wierszu", (await p.locator(".more-prof").count()) === 1 && (await p.locator(".sk-profile").count()) === 0);
const tiles = await p.locator(".more-tile").allInnerTexts();
ok("kafelki nauki", tiles.length >= 7 && tiles.some((t) => /Stażysta Staś/.test(t)) && tiles.some((t) => /Ranking kierunku/.test(t)), tiles);
const ty = await p.locator('[data-tour="ty"] .more-row').allInnerTexts();
// + „Profil nauki” (scalenie L7, etap 1 Zdawalni w Skrócie)
// (+ „Język strony” na telefonie, main e65ab54)
{ const want = [/Sklep i monety/, /Profil nauki/, /Moja grupa/, /Wygląd/, ...(ty.some((x) => /Język strony/.test(x)) ? [/Język strony/] : []), /Konto i dostęp/, /Pomoc/];
  ok("„Ty”: Sklep, Profil nauki, Grupa, Wygląd, (Język), Konto, Pomoc", ty.length === want.length && want.every((r, i) => r.test(ty[i])), ty); }
ok("w „Więcej” nie ma już przełączników motywów", (await p.locator(".more-themes, [role=switch]").count()) === 0);
await shot(p, "ust-more");
await p.locator(".more-prof").click(); await p.waitForTimeout(500);
ok("profil: #/profil z poziomem i nagrodą", /#\/profil$/.test(p.url()) && (await p.locator(".sk-profile .rk-line").count()) === 1 && (await p.locator(".lv-reward").count()) === 1, p.url());
await shot(p, "ust-profil");
await p.goBack(); await p.waitForTimeout(400);
await p.locator(".more-row", { hasText: "Wygląd" }).click(); await p.waitForTimeout(500);
ok("Wygląd → #/ustawienia/wyglad", /#\/ustawienia\/wyglad$/.test(p.url()), p.url());
const th = await p.locator(".set-theme").allInnerTexts();
ok("8 kafelków motywów, jasny włączony", th.length === 8 && /✓ Włączony/.test(th[0]), th);
await shot(p, "ust-wyglad");
await p.locator(".set-theme", { hasText: "Zielony ciemny" }).click(); await p.waitForTimeout(500);
ok("klik: zielony ciemny", (await p.evaluate(() => document.documentElement.getAttribute("data-green"))) === "dark" && /✓ Włączony/.test(await p.locator(".set-theme", { hasText: "Zielony ciemny" }).innerText()));
await shot(p, "ust-wyglad-ciemny");
await p.locator(".set-theme", { hasText: "Zielony jasny" }).click(); await p.waitForTimeout(300);
const locked = p.locator(".set-theme.is-locked").first();
if (await locked.count()) { await locked.click(); await p.waitForTimeout(500); ok("zablokowany motyw → sklep", /#\/shop$/.test(p.url()), p.url()); await p.goBack(); await p.waitForTimeout(400); }
await p.locator(".set-tabs .tab", { hasText: "Konto" }).click(); await p.waitForTimeout(300);
const konto = await p.locator(".more-row").allInnerTexts();
ok("zakładka Konto: dostęp, hasło, urządzenia, wyloguj", /#\/ustawienia\/konto$/.test(p.url()) && konto.some((x) => /Konto i dostęp/.test(x)) && konto.some((x) => /Wyloguj/.test(x)), [p.url(), konto]);
await shot(p, "ust-konto");
await p.locator(".set-tabs .tab", { hasText: "Pomoc" }).click(); await p.waitForTimeout(300);
const pomoc = await p.locator(".more-row").allInnerTexts();
ok("zakładka Pomoc: pytania, przewodnik, szybki przegląd", pomoc.length === 3 && /Przewodnik po stronie/.test(pomoc[1]), pomoc);
await p.locator(".more-row", { hasText: "Przewodnik po stronie" }).click(); await p.waitForTimeout(500);
ok("przewodnik wraca do Pomocy", /Ustawienia/.test(await p.locator(".back").first().innerText()));
await p.locator(".back").first().click(); await p.waitForTimeout(400);
ok("…i jest na zakładce Pomoc", /#\/ustawienia\/pomoc$/.test(p.url()) && (await p.locator('.set-tabs [aria-selected="true"]').innerText()) === "Pomoc", p.url());
await open(p, "#/shop");
ok("Polecaj i zarabiaj w sklepie", (await p.locator(".more-row", { hasText: "Polecaj i zarabiaj" }).count()) === 1);
await p.locator(".more-row", { hasText: "Polecaj i zarabiaj" }).click(); await p.waitForTimeout(500);
ok("Polecaj → wraca do Sklepu", /Sklep/.test(await p.locator(".back").first().innerText()));
ok("student: bez błędów w konsoli", p.errors.length === 0, p.errors);

// ---- komputer
const d = await page(b, { konto: "platne", w: 1280, h: 900 });
await open(d, "#/more"); await shot(d, "ust-more-desktop");
await open(d, "#/ustawienia/wyglad"); await shot(d, "ust-wyglad-desktop");
ok("komputer: bez błędów", d.errors.length === 0, d.errors);

// ---- starosta
const s = await page(b, { konto: "starosta", ls: { "bm-starosta": "1" } });
await open(s, "#/more");
ok("starosta: jeden wiersz narzędzi", (await s.locator(".staro .more-row").count()) === 1);
await s.locator(".staro .more-row").click(); await s.waitForTimeout(500);
const narz = await s.locator(".more-row").allInnerTexts();
ok("#/starosta z narzędziami", /#\/starosta$/.test(s.url()) && narz.some((x) => /Panel AI/.test(x)) && narz.some((x) => /Zgłoszenia błędów/.test(x)), narz);
await shot(s, "ust-starosta");
await s.locator(".more-row", { hasText: "Zgłoszenia błędów" }).click(); await s.waitForTimeout(500);
ok("zgłoszenia wracają do narzędzi", /Narzędzia starosty/.test(await s.locator(".back").first().innerText()));
await open(s, "#/more");
await s.locator(".staro [role=switch]").click(); await s.waitForTimeout(400);
ok("tryb starosty wyłączony: brak wiersza narzędzi", (await s.locator(".staro .more-row").count()) === 0);
ok("starosta: bez błędów", s.errors.length === 0, s.errors);

// ---- niezalogowany
const g = await page(b, { konto: "brak" });
await g.addInitScript(() => document.documentElement.classList.remove("needlogin"));
await open(g, "#/more");
ok("gość: widzi „Zaloguj się”", (await g.locator('[data-tour="ty"] .more-row', { hasText: "Zaloguj się" }).count()) === 1);

// ---- angielski
const e = await page(b, { konto: "platne", lang: "en" });
for (const hsh of ["#/more", "#/ustawienia/wyglad", "#/ustawienia/konto", "#/ustawienia/pomoc", "#/profil"]) {
  await open(e, hsh);
  const txt = await e.locator("main").innerText();
  const pl = txt.split("\n").map((l) => l.replace(/Skrót BM/g, "").replace(/przełącz na polski/, "")).filter((l) => /[ąęółśżźćń]|\b(motywy|Wygląd|Ustawienia|Konto|Pomoc|poziom|Włączony)\b/.test(l));
  ok(`EN ${hsh}: bez polskich napisów`, pl.length === 0, pl);
}
await open(e, "#/more"); await shot(e, "ust-more-en");

await b.close();
for (const w of wyniki) console.log(w.join(" "));
const bad = wyniki.filter((w) => w[0] === "✗").length;
console.log(`${wyniki.length - bad}/${wyniki.length}`);
process.exit(bad ? 1 : 0);
