// Etap 3 (gry): skórki postaci i tła plansz we Fruń i Przejdź. Zrzuty każdej skórki i każdego tła (telefon),
// kolizja bez zmian (promień postaci z konfiguracji), „Mniej animacji” bez błędów, sklep: podgląd na canvasie.
// node docs/kosmetyki/test/etap3.mjs   (BASE=http://127.0.0.1:PORT/ OUT=katalog zrzutów)
import { chromium, page, shot, BASE } from "../../gry/test/lib.mjs";
let ok = 0, bad = 0;
const t = (name, cond, info = "") => { if (cond) { ok++; console.log("✓", name); } else { bad++; console.log("✗", name, info); } };
const b = await chromium.launch();
const UID = "00000000-0000-4000-8000-000000000001";
const POS = ["skorka:owca", "skorka:mewa", "skorka:zaglowka", "skorka:latarnia", "tlo:dzien", "tlo:zachod", "tlo:noc-morze", "tlo:zima"];
let nav = 0;
const until = (p, f, ms = 8000) => p.waitForFunction(f, null, { timeout: ms }).catch(() => null);
async function graj(p, gra, zal, name, extra = {}) {
  await p.evaluate(([zal, extra, pos]) => { localStorage.setItem("mock-mon", JSON.stringify({ start: 0, ksiega: [], pos, zal })); Object.entries(extra).forEach(([k, v]) => localStorage.setItem(k, v)); }, [zal, extra, POS]);
  await p.goto(BASE + `index.html?r=${++nav}#/gry`); await p.waitForTimeout(1400);
  await p.locator(`#gra-${gra} button.primary`).click();
  await until(p, () => window.SKROT_GRY?._state?.()?.state === "gra");
  const st = await p.evaluate(() => { const s = window.SKROT_GRY._state(); return { kosm: s.run?.kosm ? { skin: s.run.kosm.skin, tlo: s.run.kosm.tlo } : null, bg: s.run?.colors?.bg }; });
  await p.locator(".gry-stage").click({ position: { x: 60, y: 300 } }); await p.waitForTimeout(gra === "frun" ? 350 : 500);
  await shot(p, `e3-${gra}-${name}`);
  await p.keyboard.press("Escape"); await p.waitForTimeout(200);
  const end = p.getByRole("button", { name: "Zakończ rundę" }); if (await end.count()) await end.click();
  return st;
}
{
  const p = await page(b, { ls: { "mock-v24": "1", "mock-progress": JSON.stringify({ [UID]: { xp: { t: 4600 } } }) } });
  await p.goto(BASE + "index.html#/gry"); await p.waitForTimeout(800);
  for (const gra of ["frun", "przejdz"]) {
    for (const [skin, tlo] of [["owca", "dzien"], ["mewa", "zachod"], ["zaglowka", "noc-morze"], ["latarnia", "zima"]]) {
      const st = await graj(p, gra, { skorka: "skorka:" + skin, tlo: "tlo:" + tlo }, `${skin}-${tlo}`);
      t(`${gra}: skórka ${skin} i tło ${tlo} w rundzie`, st.kosm?.skin === skin && st.kosm?.tlo === tlo, st);
    }
    const st = await graj(p, gra, {}, "domyslna");
    t(`${gra}: bez założonych rzeczy wygląda jak dotąd`, st.kosm && !st.kosm.skin && !st.kosm.tlo, st);
  }
  // „Mniej animacji”: ten sam obraz, bez ruchu (t = 0) i bez błędów
  await graj(p, "frun", { skorka: "skorka:latarnia", tlo: "tlo:zima" }, "calm", { "skrot-calm": "1" });
  t("bez błędów w konsoli (także przy „Mniej animacji”)", !p.errors.length, p.errors);
  // sklep: podgląd skórki i tła na canvasie
  await p.evaluate(() => localStorage.setItem("skrot-calm", ""));
  await p.goto(BASE + `index.html?r=${++nav}#/shop`); await p.waitForSelector("#ktab-gry"); await p.click("#ktab-gry"); await p.waitForTimeout(300);
  t("sklep Gry: 4 skórki i 3 tła z podglądem na canvasie", (await p.$$("#kpanel .kcard canvas.kpv-cv")).length === 7, (await p.$$("#kpanel .kcard canvas")).length);
  t("Latarnia: kłódka od poziomu 8 znika przy poziomie 10", await p.$eval("#shop-skorka-latarnia", (e) => !e.querySelector(".kcard-lock")));
  await shot(p, "e3-sklep-gry");
  await p.context().close();
}
await b.close();
console.log(`${ok}/${ok + bad}`);
process.exit(bad ? 1 : 0);
