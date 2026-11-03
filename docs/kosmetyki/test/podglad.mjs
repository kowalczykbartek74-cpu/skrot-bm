// Duży podgląd przedmiotu (klik w kartę w sklepie): okno dla każdego przedmiotu, ruchome sceny gier, fiszka do odwracania,
// efekt odtwarzany w okienku, zakup i „Załóż” z okna, „Mniej animacji”, wąski telefon, EN i ciemny motyw.
// node docs/kosmetyki/test/podglad.mjs   (BASE=http://127.0.0.1:PORT/ OUT=katalog zrzutów)
import { chromium, page, shot, BASE, KATALOG24 } from "../../gry/test/lib.mjs";
let ok = 0, bad = 0, nav = 0;
const t = (name, cond, info = "") => { if (cond) { ok++; console.log("✓", name); } else { bad++; console.log("✗", name, info); } };
const UID = "00000000-0000-4000-8000-000000000001";
const PROG = JSON.stringify({ [UID]: { xp: { t: 2900 }, odznaki: { frun10: 1 } } });
const b = await chromium.launch();
const open = async (p, tab) => { await p.goto(BASE + `index.html?r=${++nav}#/shop`); await p.waitForSelector("#ktab-motywy"); await p.click("#ktab-" + tab); await p.waitForTimeout(250); };
const look = async (p, id) => { await p.click(`#shop-${id.replace(/:/g, "-")} .kcard-pv`); await p.waitForSelector(".klook", { timeout: 3000 }); await p.waitForTimeout(150); };
const close = (p) => p.keyboard.press("Escape");

// ---------- każdy przedmiot ma podgląd ----------
{
  const p = await page(b, { w: 1280, h: 900, ls: { "mock-v24": "1", "mock-saldo": "1000", "mock-progress": PROG, "mock-nick": "Bartek", "mock-vis": "1" } });
  const tabs = { profil: ["ramka", "kolor", "tytul", "gablota"], gry: ["skorka", "tlo"], nauka: ["fiszki", "efekt", "dzwieki", "plomien", "zamrozenie"], zestawy: ["zestaw"], sezon: [] };
  let n = 0, fails = [];
  for (const tab of Object.keys(tabs)) {
    await open(p, tab);
    const ids = await p.$$eval("#kpanel .kcard", (els) => els.map((e) => e.id.replace(/^shop-/, "")));
    for (const raw of ids) {
      await p.click(`#shop-${raw} .kcard-pv`);
      const ok1 = await p.waitForSelector(".klook", { timeout: 2000 }).then(() => true, () => false);
      const sc = ok1 ? await p.$$eval(".klook-sc", (els) => els.length) : 0;
      if (!ok1 || !sc) fails.push(raw); else n++;
      await close(p); await p.waitForTimeout(60);
    }
  }
  t(`każdy przedmiot otwiera podgląd ze sceną (${n})`, !fails.length && n >= 40, fails);
  t("bez błędów (przegląd wszystkich)", !p.errors.length, p.errors);
  await p.context().close();
}
// ---------- sceny, fiszka, efekt, dźwięk ----------
{
  const p = await page(b, { w: 1280, h: 900, ls: { "mock-v24": "1", "mock-saldo": "1000", "mock-progress": PROG, "mock-nick": "Bartek", "mock-vis": "1" } });
  await p.addInitScript(() => { window.__snd = 0; const O = window.AudioContext; window.AudioContext = function () { const c = new O(); const mk = c.createOscillator.bind(c); c.createOscillator = () => { window.__snd++; return mk(); }; return c; }; });
  await open(p, "gry"); await look(p, "skorka:owca");
  const cv = await p.$$(".klook canvas");
  t("skórka: dwie sceny (Fruń i Przejdź)", cv.length === 2 && /Fruń/.test(await p.$eval(".klook", (e) => e.textContent)) && /Przejdź/.test(await p.$eval(".klook", (e) => e.textContent)));
  const px = () => p.$$eval(".klook canvas", (els) => els.map((c) => c.toDataURL().length + ":" + c.toDataURL().slice(-200)));
  const a = await px(); await p.waitForTimeout(400); const a2 = await px();
  t("skórka: sceny się ruszają", a[0] !== a2[0] && a[1] !== a2[1]);
  await shot(p, "pv-skorka-owca");
  await close(p); await look(p, "tlo:noc-morze"); await p.waitForTimeout(300);
  t("tło: dwie sceny", (await p.$$(".klook canvas")).length === 2);
  await shot(p, "pv-tlo-noc");
  await close(p); await p.waitForTimeout(100);
  t("po zamknięciu okna nie ma canvasów (animacja stoi)", (await p.$$("#layer canvas")).length === 0);

  await open(p, "nauka"); await look(p, "fiszki:kreda");
  const f1 = await p.$eval(".klook-card", (e) => e.textContent);
  await p.click(".klook-card"); const f2 = await p.$eval(".klook-card", (e) => e.textContent);
  t("fiszka: klik odwraca (pojęcie → definicja)", /Inflacja/.test(f1) && /wzrost cen/.test(f2) && (await p.$(".klook-card .face.back")) != null, [f1, f2]);
  await shot(p, "pv-fiszki-kreda");
  await close(p); await look(p, "efekt:iskry"); await p.waitForTimeout(500);
  t("efekt: odtwarza się w okienku (nie na całej stronie)", (await p.$$(".klook-fx .kfx-iskry i")).length > 5 && (await p.$$("body > .kfx")).length === 0);
  await shot(p, "pv-efekt-iskry");
  await close(p); await look(p, "dzwieki:krople");
  await p.click(".klook-opt"); await p.waitForTimeout(150);
  t("dźwięki: klik w odpowiedź gra dźwięk", (await p.evaluate(() => window.__snd)) > 0);
  await close(p); await look(p, "plomien:niebieski");
  t("płomień: duży płomień i seria", (await p.$$(".klook .kflame svg")).length >= 2);
  await close(p); await look(p, "zamrozenie");
  t("zamrożenie: tydzień z zamrożonym dniem", (await p.$$(".klook-day.ice")).length === 1);
  await close(p);

  await open(p, "profil"); await look(p, "kolor:morze");
  t("kolor nicku: w rankingu mój wiersz w tym kolorze", (await p.$$(".klook-rank .rk-row.me .nk-morze")).length === 1 && (await p.$$(".klook-prof .nk-morze")).length === 1);
  await shot(p, "pv-kolor-morze");
  await close(p); await look(p, "ramka:fale");
  t("ramka: duży awatar na profilu i w rankingu", (await p.$$(".klook .kav")).length >= 4);
  await close(p); await look(p, "tytul:nocny-marek");
  t("tytuł: widać pod nickiem na profilu i w rankingu", (await p.$$(".klook .ktl")).length === 2);
  await close(p); await look(p, "gablota:2");
  t("gablota: 2 miejsca, trzecie zamknięte", (await p.$$(".klook-gab .kgab-slot.is-lock")).length === 1);
  await close(p);
  await open(p, "zestawy"); await look(p, "zestaw:morze");
  t("zestaw: osobna scena dla każdej części", (await p.$$(".klook-sc")).length === KATALOG24.find((x) => x.id === "zestaw:morze").czesci.length);
  await shot(p, "pv-zestaw-morze");
  await close(p);
  // zakup z okna podglądu: okno zamyka się, otwiera potwierdzenie
  await open(p, "profil"); await look(p, "ramka:liscie");
  await p.click(".klook-act .btn.primary"); await p.waitForTimeout(200);
  t("Kup w podglądzie → potwierdzenie zakupu", !(await p.$(".klook")) && /200/.test(await p.$eval(".kbuy-sum", (e) => e.textContent)));
  await p.click(".kbuy .btn.primary"); await p.waitForTimeout(600);
  const later = p.getByRole("button", { name: "Później" }); if (await later.count()) await later.click();
  await look(p, "ramka:liscie");
  t("po zakupie podgląd pokazuje „Posiadasz” i „Załóż”", /Posiadasz/.test(await p.$eval(".klook", (e) => e.textContent)));
  await p.click(".klook-act .btn.primary"); await p.waitForTimeout(500);
  t("Załóż w podglądzie: założone, okno zamknięte", !(await p.$(".klook")) && (await p.evaluate(() => window.skrot.sklep.zalozone.ramka)) === "ramka:liscie");
  t("bez błędów", !p.errors.length, p.errors);
  await p.context().close();
}
// ---------- Mniej animacji: sceny stoją, efekt się nie odtwarza ----------
{
  const p = await page(b, { w: 1280, h: 900, ctx: { reducedMotion: "reduce" }, ls: { "mock-v24": "1", "mock-saldo": "1000", "mock-progress": PROG } });
  await open(p, "gry"); await look(p, "skorka:mewa");
  const px = () => p.$eval(".klook canvas", (c) => c.toDataURL());
  const a = await px(); await p.waitForTimeout(400);
  t("Mniej animacji: scena nieruchoma", a === (await px()));
  await close(p); await open(p, "nauka"); await look(p, "efekt:liscie"); await p.waitForTimeout(400);
  t("Mniej animacji: efekt nie leci, jest obrazek i informacja", !(await p.$(".klook .kfx")) && /Mniej animacji/.test(await p.$eval(".klook", (e) => e.textContent)));
  t("bez błędów", !p.errors.length, p.errors);
  await p.context().close();
}
// ---------- telefon 360, EN, ciemny ----------
for (const [name, o] of [["360", { w: 360, h: 780 }], ["en", { lang: "en" }], ["ciemny", { w: 1280, h: 860, ls: { "skrot-green": "dark" } }], ["noc", { ls: { "skrot-theme": "noc" } }]]) {
  const p = await page(b, { ...o, ls: { "mock-v24": "1", "mock-saldo": "1000", "mock-progress": PROG, "mock-nick": "Bartek", "mock-vis": "1", ...(o.ls || {}) } });
  for (const [tab, id] of [["gry", "skorka:latarnia"], ["profil", "kolor:wrzos"], ["nauka", "fiszki:nocny"], ["zestawy", "zestaw:laka"]]) {
    await open(p, tab); await look(p, id);
    const over = await p.evaluate(() => { const m = document.querySelector(".modal"); return Math.max(document.documentElement.scrollWidth - innerWidth, m.scrollWidth - m.clientWidth); });
    if (over > 1) t(`${name} ${id}: bez poziomego przewijania`, false, over);
    if (id === "skorka:latarnia" || id === "kolor:wrzos") await shot(p, `pv-${name}-${id.replace(":", "-")}`);
    await close(p);
  }
  if (name === "en") { await open(p, "nauka"); await look(p, "zamrozenie"); t("EN: podgląd po angielsku", /A missed day doesn’t break your streak/.test(await p.$eval(".klook", (e) => e.textContent)) && /Preview/.test(await p.$eval("#kpanel", (e) => e.textContent)), await p.$eval(".klook", (e) => e.textContent)); await close(p); }
  t(`${name}: okna podglądu mieszczą się na ekranie`, true);
  t(`${name}: bez błędów`, !p.errors.length, p.errors);
  await p.context().close();
}
await b.close();
console.log(`${ok}/${ok + bad}`);
process.exit(bad ? 1 : 0);
