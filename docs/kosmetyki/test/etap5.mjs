// Etap 5 (sezonowe i sklep): kolekcja „Sesja zimowa” z licznikiem, zakup zestawu sezonowego, koniec sezonu (kupione zostają),
// sklep na wąskim telefonie bez poziomego przewijania, EN i ciemny motyw, Zadania i motywy jak dotąd.
// node docs/kosmetyki/test/etap5.mjs   (BASE=http://127.0.0.1:PORT/ OUT=katalog zrzutów)
import { chromium, page, shot, BASE } from "../../gry/test/lib.mjs";
let ok = 0, bad = 0;
const t = (name, cond, info = "") => { if (cond) { ok++; console.log("✓", name); } else { bad++; console.log("✗", name, info); } };
const UID = "00000000-0000-4000-8000-000000000001";
const b = await chromium.launch();
const PROG = JSON.stringify({ [UID]: { xp: { t: 2900 }, odznaki: { frun10: 1 } } });
const ZAMKNIETY = JSON.stringify({ zima: { od: "2025-12-01", do: "2026-02-28", pl: "Sesja zimowa", en: "Winter exam session" } });
const open = async (p, tab) => { await p.goto(BASE + "index.html#/shop"); await p.waitForSelector("#ktab-motywy"); if (tab) { await p.click("#ktab-" + tab); await p.waitForTimeout(250); } };

// ---------- sezon trwa: kolekcja, licznik, zakup zestawu ----------
{
  const p = await page(b, { ls: { "mock-v24": "1", "mock-saldo": "1000", "mock-progress": PROG } });
  await open(p);
  t("zakładka Sezonowe z kropką „trwa sezon”", !!(await p.$("#ktab-sezon .ktab-dot")));
  await p.click("#ktab-sezon"); await p.waitForTimeout(250);
  const hero = await p.$eval(".ksez-hero", (e) => e.textContent);
  t("nagłówek: Sesja zimowa, do 28.02.2027, ile dni zostało", /Sesja zimowa/.test(hero) && /28\.02\.2027/.test(hero) && /zostało \d+ (dni|dzień)|ostatni dzień/.test(hero), hero);
  t("4 przedmioty sezonowe (ramka, tło, efekt, zestaw)", (await p.$$("#kpanel .kcard")).length === 4);
  await shot(p, "e5-sezon-tel");
  await p.click("#shop-zestaw-zima .btn.primary");
  t("potwierdzenie zestawu: 560 🪙, zostanie 440", /560/.test(await p.$eval(".kbuy-sum", (e) => e.textContent)) && /440/.test(await p.$eval(".kbuy-sum", (e) => e.textContent)));
  await p.click(".kbuy .btn.primary"); await p.waitForTimeout(600);
  t("po zakupie zestawu: wszystkie części posiadane", await p.evaluate(() => ["ramka:szron", "tlo:zima", "efekt:snieg", "zestaw:zima"].every((x) => window.skrot.sklep.posiadane.has(x))));
  t("saldo 440", /440/.test(await p.$eval("#shop-saldo", (e) => e.textContent)));
  t("bez błędów", !p.errors.length, p.errors);
  await p.context().close();
}
// ---------- po sezonie: kupione zostają, nowych nie da się kupić ----------
{
  const mon = JSON.stringify({ start: 0, ksiega: [], pos: ["ramka:szron"], zal: {} });
  const p = await page(b, { ls: { "mock-v24": "1", "mock-progress": PROG, "mock-sezony": ZAMKNIETY, "mock-mon": mon } });
  await open(p, "sezon");
  t("po sezonie: widać tylko kupiony Szron, z „Załóż”", (await p.$$("#kpanel .kcard")).length === 1 && /Załóż/.test(await p.$eval("#shop-ramka-szron", (e) => e.textContent)));
  t("po sezonie: nagłówek „Sezon zakończony”, bez kropki", /Sezon zakończony/.test(await p.$eval(".ksez-hero", (e) => e.textContent)) && !(await p.$("#ktab-sezon .ktab-dot")));
  await p.click("#shop-ramka-szron .btn.primary"); await p.waitForTimeout(400);
  t("po sezonie: kupiony Szron da się założyć", await p.evaluate(() => window.skrot.sklep.zalozone.ramka === "ramka:szron"));
  await shot(p, "e5-sezon-po");
  // baza odrzuca zakup po sezonie (gdyby ktoś wysłał zapytanie ręcznie)
  const r = await p.evaluate(() => window.skrot.sklepKup("efekt:snieg"));
  t("baza po sezonie: zakup → season", r?.code === "season", r);
  await p.context().close();
}
{
  const p = await page(b, { ls: { "mock-v24": "1", "mock-progress": PROG, "mock-sezony": ZAMKNIETY } });
  await open(p);
  t("po sezonie bez zakupów: zakładki Sezonowe nie ma", !(await p.$("#ktab-sezon")));
  await p.context().close();
}
// ---------- wąski telefon, EN, ciemny ----------
for (const [name, o] of [["360", { w: 360, h: 780 }], ["en", { lang: "en" }], ["ciemny", { w: 1280, h: 860, ls: { "skrot-green": "dark" } }]]) {
  const p = await page(b, { ...o, ls: { "mock-v24": "1", "mock-saldo": "1000", "mock-progress": PROG, ...(o.ls || {}) } });
  for (const tab of ["motywy", "profil", "gry", "nauka", "zestawy", "sezon"]) {
    await open(p, tab);
    const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (over > 1) t(`${name} ${tab}: bez poziomego przewijania`, false, over);
    if (tab === "nauka" || tab === "sezon") await shot(p, `e5-${name}-${tab}`);
  }
  t(`${name}: żadna zakładka nie wystaje poza ekran`, true);
  if (name === "en") t("EN: nagłówek sezonu po angielsku", /Winter exam session/.test(await p.$eval(".ksez-hero", (e) => e.textContent)) && /On sale until/.test(await p.$eval(".ksez-hero", (e) => e.textContent)));
  t(`${name}: bez błędów`, !p.errors.length, p.errors);
  await p.context().close();
}
await b.close();
console.log(`${ok}/${ok + bad}`);
process.exit(bad ? 1 : 0);
