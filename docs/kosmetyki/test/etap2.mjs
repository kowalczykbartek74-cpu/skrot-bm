// Etap 2 (profil i ranking): zakładki sklepu, zakup z potwierdzeniem, zakładanie, ranking z awatarem / kolorem / tytułem,
// profil osoby, karta „Twój profil” i gablota. Atrapa Supabase (mock-v24 = "1"), serwer: python3 -m http.server w katalogu repo.
// node docs/kosmetyki/test/etap2.mjs   (BASE=http://127.0.0.1:PORT/ OUT=katalog zrzutów)
import { chromium, page, shot, BASE } from "../../gry/test/lib.mjs";
const UID = "00000000-0000-4000-8000-000000000001";
const prog = (o = {}) => JSON.stringify({ [UID]: { xp: { t: 2900 }, odznaki: { frun10: 1, pary0: 2, mistrz: 3 }, ...o } });
let ok = 0, bad = 0;
const t = (name, cond, info = "") => { if (cond) { ok++; console.log("✓", name); } else { bad++; console.log("✗", name, info); } };
const b = await chromium.launch();
const LS = { "mock-v24": "1", "mock-saldo": "3000", "mock-progress": prog(), "mock-rank": "top", "mock-nick": "Bartek", "mock-vis": "1" };

// ---------- telefon, PL ----------
{
  const p = await page(b, { ls: LS });
  await p.goto(BASE + "index.html#/shop"); await p.waitForSelector("#ktab-profil");
  const tabs = await p.$$eval(".kshop-tab", (xs) => xs.map((x) => x.textContent.trim()));
  t("zakładki: Motywy, Profil, Gry, Nauka, Zestawy, Sezonowe", tabs.join("|").includes("Motywy") && ["Profil", "Gry", "Nauka", "Zestawy", "Sezonowe"].every((x) => tabs.some((y) => y.includes(x))), tabs);
  await p.click("#ktab-profil"); await p.waitForTimeout(200);
  t("Profil: 5 ramek, 6 kolorów, 5 tytułów (z „Pogromcą”), 2 miejsca gabloty", (await p.$$(".kcard")).length === 18, (await p.$$(".kcard")).length);
  t("złota ramka: kłódka „od poziomu 10”, bez przycisku kupna", await p.$eval("#shop-ramka-zlota", (e) => /od poziomu 10/.test(e.textContent) && !/Kup za/.test(e.textContent)));
  t("tytuł za osiągnięcie: nie do kupienia", await p.$eval("#shop-tytul-pogromca", (e) => /Nie da się go kupić/.test(e.textContent) && !e.querySelector(".btn.primary")));
  t("podgląd koloru: nick w kolorze w wierszu rankingu", await p.$eval("#shop-kolor-las .kpv-rank .nk", (e) => e.classList.contains("nk-las")));
  t("gablota 3. miejsce: najpierw 2.", await p.$eval("#shop-gablota-3", (e) => /Najpierw kup/.test(e.textContent)));
  await shot(p, "e2-profil-tel");
  // zakup ramki z potwierdzeniem
  await p.click("#shop-ramka-liscie .btn.primary");
  const sum = await p.$eval(".kbuy-sum", (e) => e.textContent);
  t("potwierdzenie: cena 200, masz 3000, zostanie 2800", /200/.test(sum) && /3[\s ]?000/.test(sum) && /2[\s ]?800/.test(sum), sum);
  await shot(p, "e2-potwierdzenie");
  await p.click(".kbuy .btn.primary"); await p.waitForSelector(".kbuy-modal .btn.primary:text('Załóż teraz')");
  t("dymek „−200 🪙”", await p.$eval(".gain-spend", (e) => /−200/.test(e.textContent)).catch(() => false));
  await p.click(".kbuy-modal .btn.primary"); await p.waitForTimeout(400);
  t("ramka założona (karta „Założone”)", await p.$eval("#shop-ramka-liscie", (e) => e.classList.contains("is-on") && /Założone/.test(e.textContent)));
  t("saldo 2800", /2[\s ]?800/.test(await p.$eval("#shop-saldo", (e) => e.textContent)));
  for (const [id, slot] of [["kolor:las", "kolor"], ["tytul:nocny-marek", "tytul"]]) {
    await p.click(`#shop-${id.replace(/:/g, "-")} .btn.primary`); await p.click(".kbuy .btn.primary");
    await p.waitForSelector(".kbuy-modal .btn.primary:text('Załóż teraz')"); await p.click(".kbuy-modal .btn.primary"); await p.waitForTimeout(300);
  }
  t("kolor i tytuł założone", await p.evaluate(() => { const z = window.skrot.sklep.zalozone; return z.kolor === "kolor:las" && z.tytul === "tytul:nocny-marek" && z.ramka === "ramka:liscie"; }));
  // drugie kliknięcie w kupno tej samej rzeczy nie istnieje: przycisk znika, w bazie „owned”
  t("kupione rzeczy mają „Załóż/Zdejmij”, nie „Kup”", await p.$eval("#shop-kolor-las", (e) => !/Kup za/.test(e.textContent)));
  // gablota: 2. miejsce
  await p.click("#shop-gablota-2 .btn.primary"); await p.click(".kbuy .btn.primary"); await p.waitForTimeout(500);
  t("gablota: 2 miejsca po zakupie", await p.evaluate(() => window.skrot.sklep.gablota.miejsca === 2));
  // ranking
  await p.goto(BASE + "index.html#/ranking"); await p.waitForSelector(".rk-who"); await p.waitForTimeout(600);
  t("ranking: awatar przy każdej osobie", (await p.$$(".rk-row .kav")).length === 3);
  t("ranking: mój nick w kolorze Las i mój tytuł", await p.$eval(".rk-row.me", (e) => !!e.querySelector(".nk-las") && /Nocny Marek/.test(e.textContent)));
  t("ranking: Cela ma tytuł za osiągnięcie (inny wygląd) i złotą ramkę", await p.$$eval(".rk-row", (rs) => rs.some((r) => /Cela/.test(r.textContent) && r.querySelector(".ktl-a") && /Pogromca Makro/.test(r.textContent))));
  await shot(p, "e2-ranking-tel");
  await p.click(".rk-row:has-text('Łoś Ania') .rk-who"); await p.waitForSelector(".kprof-modal");
  t("profil osoby: gablota z 2 odznakami i ranga", await p.$eval(".kprof-modal", (e) => e.querySelectorAll(".kgab-slot.on").length === 2 && /poziom 9/.test(e.textContent)));
  await shot(p, "e2-profil-osoby");
  await p.keyboard.press("Escape");
  // Więcej: Twój profil i gablota
  await p.goto(BASE + "index.html#/more"); await p.waitForSelector(".kprof");
  t("Więcej: karta profilu z ramką i 2 miejscami + 1 zamkniętym", await p.$eval(".kprof", (e) => e.querySelectorAll(".kgab-slot.is-empty").length === 2 && e.querySelectorAll(".kgab-slot.is-lock").length === 1));
  await p.click(".kprof .kgab-slot.is-empty"); await p.waitForSelector(".kgab-pick");
  t("gablota: 3 zdobyte odznaki do wyboru", (await p.$$(".kgab-opt")).length === 3);
  await p.click(".kgab-opt:has-text('Pierwszy lot')"); await p.click(".kgab-opt:has-text('Mistrz Skrótu BM')");
  await p.click(".kgab-opt:has-text('Bez pomyłki')");
  t("trzecia odznaka przy 2 miejscach → komunikat", /zajęte/.test(await p.$eval(".kgab-pick + .shop-err", (e) => e.textContent)));
  await p.click(".modal .btn.primary"); await p.waitForTimeout(500);
  t("gablota zapisana: 2 odznaki na profilu", (await p.$$(".kprof .kgab-slot.on")).length === 2);
  await shot(p, "e2-wiecej-tel");
  t("zero błędów w konsoli", !p.errors.length, p.errors);
  await p.context().close();
}

// ---------- komputer, ciemny, EN ----------
for (const [name, extra] of [["ciemny", { "skrot-green": "dark" }], ["morze", { "skrot-theme": "sea" }], ["en", { "skrot-green": "light" }]]) {
  const p = await page(b, { w: 1280, h: 860, lang: name === "en" ? "en" : "pl", ls: { ...LS, ...extra, "mock-mon": JSON.stringify({ start: 3000, ksiega: [], pos: ["ramka:gwiazdy", "kolor:glebia", "tytul:kawa-kolokwium"], zal: { ramka: "ramka:gwiazdy", kolor: "kolor:glebia", tytul: "tytul:kawa-kolokwium" } }) } });
  await p.goto(BASE + "index.html#/shop"); await p.waitForSelector("#ktab-profil");
  await p.click("#ktab-profil"); await p.waitForTimeout(300); await shot(p, "e2-profil-" + name);
  await p.goto(BASE + "index.html#/ranking"); await p.waitForSelector(".rk-who"); await p.waitForTimeout(500); await shot(p, "e2-ranking-" + name);
  if (name === "en") {
    t("EN: zakładki i nazwy po angielsku", await p.evaluate(async () => { location.hash = "#/shop"; await new Promise((r) => setTimeout(r, 600)); const s = document.querySelector(".kshop")?.textContent || ""; return /Profile/.test(s) && /Games/.test(s); }));
    t("EN: tytuł po angielsku w rankingu", /Coffee and Quizzes/.test(await p.evaluate(() => (location.hash = "#/ranking", new Promise((r) => setTimeout(() => r(document.querySelector(".rk-list")?.textContent || ""), 700))))));
  }
  t(`${name}: zero błędów w konsoli`, !p.errors.length, p.errors);
  await p.context().close();
}
await b.close();
console.log(`${ok}/${ok + bad}`);
process.exit(bad ? 1 : 0);
