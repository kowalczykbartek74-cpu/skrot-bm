// Etap 14 specu „Systemy z Zdawalni w Skrócie”: kolejka „PDF → szkic AI → zatwierdzenie → import” (importy.js, SQL v40,
// funkcja Edge importy, profil importy/WEFiZ.json). Atrapa bazy (atrapa-supabase.js, „mock-importy”) i udawana funkcja Edge:
// „model” zwraca dla każdej części PDF-u to, co daje dziś scripts/sylabus-parse.py (sylabus.json + strony z prawdziwego PDF-u).
//   A. tylko administrator: wiersz „Importy” w Narzędziach starosty; zwykłe konto widzi „tylko dla administratora”,
//   B. wgranie PDF-u → czytanie 29 części po kolei (pasek postępu) → do sprawdzenia,
//   C. pozycja po pozycji: zatwierdź, popraw (JSON sprawdzany schematem z profilu), odrzuć, cofnij, podgląd strony PDF-u,
//   D. „Zatwierdź pozostałe”, „Zatwierdź import” → plik sylabus.json do pobrania i porównanie z obecnym sylabusem,
//   E. EN i zrzuty 375/1280.
// BASE=http://127.0.0.1:8811/ node docs/gry/test/importy.mjs
import { chromium, page, BASE, shot } from "./lib.mjs";
import { createRequire } from "module";
import fs from "fs";
const require = createRequire(import.meta.url);
const I = require("../../../importy.js");
const ROOT = new URL("../../../", import.meta.url).pathname;
const SYL_TXT = fs.readFileSync(ROOT + "sylabus.json", "utf8"), SYL = JSON.parse(SYL_TXT);
const PROF = JSON.parse(fs.readFileSync(ROOT + "importy/WEFiZ.json", "utf8"));
const STRONY = JSON.parse(fs.readFileSync(ROOT + "tests/fixtures/importy-wefiz-strony.json", "utf8"));
const KURSY = STRONY.przedmioty.map((x) => ({ ...x, kurs: SYL.courses.find((c) => c.code === x.code && x.fragment.includes(c.en)) }));
const PT = PROF.typy.sylabus, CZ = I.czesci(227, PT);
const pozycjeCzesci = (c) => KURSY.filter((x) => x.strona >= c.od && x.strona <= c.do).map((x) => ({ strona: x.strona, fragment: x.fragment, dane: I.pozycjaZPrzedmiotu(x.kurs) }));
const ID = "11111111-2222-4333-8444-555555555555";
const wiersz = (extra = {}) => ({ id: ID, typ: "sylabus", wydzial: "WEFiZ", rocznik_id: "wefiz-bm-1-st-2026", opis: SYL.source, plik_nazwa: STRONY.plik, plik_sha256: "a".repeat(64),
  plik_bajty: 879798, strony: 227, czesci: 29, przeczytane: [], stan: "szkic", pozycje: [], uwagi_ai: {}, gotowe: null, tokeny: { input_tokens: 0, output_tokens: 0 },
  pdf_sciezka: ID + ".pdf", pdf_usuniety_at: null, utworzony_at: "2026-11-06T09:00:00Z", ...extra });
// Gotowy import „do sprawdzenia” (dla zrzutów EN i 1280, bez czytania 29 części).
const przeczytany = () => { let poz = []; for (const c of CZ) poz = I.dodajCzesc(poz, c.czesc, pozycjeCzesci(c)); return wiersz({ stan: "do_sprawdzenia", przeczytane: CZ.map((c) => c.czesc), pozycje: poz, uwagi_ai: { 7: "Strona 80: tabela efektów częściowo nieczytelna, sprawdź EP4." }, tokeny: { input_tokens: 412000, output_tokens: 118000 } }); };

const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 700)]);
const PLW = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;
// Tekst ekranu bez danych z PDF-u (oznaczonych translate="no"): w EN nie może być polskich liter.
const tekstUI = (p) => p.evaluate(() => { const m = document.querySelector("main") || document.body; const c = m.cloneNode(true); c.querySelectorAll('[translate="no"], pre, textarea, code').forEach((e) => e.remove()); return c.innerText.replace(/Skrót BM/g, ""); });
// (przycisk „← Wstecz” .back ma 36 px na całej stronie, poza tym etapem)
const male = (p) => p.evaluate(() => [...document.querySelectorAll("main button:not(.back), main summary, main select, main input")].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.height && r.height < 44; }).map((e) => e.textContent.trim().slice(0, 30) + ":" + Math.round(e.getBoundingClientRect().height)));
// Udawana funkcja Edge „importy”: zapisuje do „bazy” atrapy (localStorage w przeglądarce), jak prawdziwa przez RPC.
async function edge(p, log, { wolno = 0 } = {}) {
  await p.context().route(/functions\/v1\/importy/, async (r) => {
    const body = JSON.parse(r.request().postData() || "{}"); log.push(body.akcja === "wgraj" ? { ...body, pdf: body.pdf.length } : body);
    const odp = (o) => r.fulfill({ contentType: "application/json", body: JSON.stringify(o) });
    if (body.akcja === "wgraj") {
      await p.evaluate(([id, w]) => { const db = JSON.parse(localStorage.getItem("mock-importy") || "{}"); db[id] = w; localStorage.setItem("mock-importy", JSON.stringify(db)); }, [ID, wiersz({ opis: body.opis || null, plik_nazwa: body.nazwa })]);
      return odp({ ok: true, id: ID, istnieje: false, strony: 227, czesci: 29 });
    }
    if (body.akcja === "czytaj") {
      if (wolno) await new Promise((x) => setTimeout(x, wolno));
      const c = CZ.find((x) => x.czesc === body.czesc);
      const res = await p.evaluate(([id, cz, nowe]) => {
        const db = JSON.parse(localStorage.getItem("mock-importy") || "{}"), w = db[id];
        w.pozycje = window.SKROT_IMPORTY.dodajCzesc(w.pozycje, cz, nowe);
        w.przeczytane = [...new Set([...w.przeczytane, cz])].sort((a, b) => a - b);
        w.tokeny = { input_tokens: w.tokeny.input_tokens + 21000, output_tokens: w.tokeny.output_tokens + 6200 };
        if (w.przeczytane.length >= w.czesci) w.stan = "do_sprawdzenia";
        localStorage.setItem("mock-importy", JSON.stringify(db));
        return { stan: w.stan, przeczytane: w.przeczytane, czesci: w.czesci };
      }, [ID, c.czesc, pozycjeCzesci(c)]);
      return odp({ ok: true, ...res, nowe: pozycjeCzesci(c).length, poza: 0 });
    }
    if (body.akcja === "pdf") return odp({ ok: true, url: BASE + "tests/fixtures/importy-mini.pdf" });
    if (body.akcja === "sprzataj") {
      await p.evaluate((id) => { const db = JSON.parse(localStorage.getItem("mock-importy") || "{}"); if (db[id] && db[id].stan !== "szkic") db[id].pdf_usuniety_at = new Date().toISOString(); localStorage.setItem("mock-importy", JSON.stringify(db)); }, ID);
      return odp({ ok: true, usuniete: 1 });
    }
    return odp({ ok: false, code: "bad_action" });
  });
}
const PDF_PLIK = { name: STRONY.plik, mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.7\n1 0 obj << /Type /Catalog >> endobj\n%%EOF\n") };

// ---------- A: tylko administrator ----------
{
  const p = await page(b, { konto: "platne", w: 375, h: 812 });
  await p.goto(BASE + "index.html#/importyAdmin"); await p.waitForTimeout(2200);
  const t = await p.evaluate(() => document.querySelector("main").innerText);
  ok("A: zwykłe konto: ekran tylko dla administratora, bez formularza", /tylko dla administratora/.test(t) && !(await p.$("#imp-plik")), t.slice(0, 200));
  ok("A: zwykłe konto nie woła funkcji importów", (await p.evaluate(() => (window.__rpc || []).filter((r) => /import/.test(r.fn)).length)) === 0);
  await p.context().close();
}

// ---------- B–D: pełna kolejka na 375 px (PL) ----------
{
  const p = await page(b, { konto: "starosta", w: 375, h: 812, ls: { "bm-starosta": "1" } });
  const log = []; await edge(p, log, { wolno: 60 });
  p.on("dialog", (d) => d.accept());
  await p.goto(BASE + "index.html#/starosta"); await p.waitForTimeout(2500);
  const row = p.locator(".more-list >> text=Importy").first();
  ok("A: administrator ma wiersz „Importy” w Narzędziach starosty", (await row.count()) === 1);
  await row.click(); await p.waitForTimeout(1500);
  ok("B: formularz: wydział WEFiZ z profilu, typy sylabus i plan, rocznik", (await p.evaluate(() => [document.getElementById("imp-wydzial")?.value, [...document.querySelectorAll("#imp-typ option")].map((o) => o.value).join(","), document.getElementById("imp-rocznik")?.value].join("|"))) === "WEFiZ|sylabus,plan|wefiz-bm-1-st-2026");
  ok("B: pusta kolejka", /Nie ma jeszcze importów/.test(await p.evaluate(() => document.querySelector("main").innerText)));
  await p.click("#imp-wgraj"); await p.waitForTimeout(300);
  ok("B: bez pliku → komunikat", /Wybierz plik PDF/.test(await p.evaluate(() => document.querySelector("main .notice.err")?.textContent || "")));
  await shot(p, "imp-formularz-375");
  ok("B 375: cele dotyku ≥ 44 px (formularz)", !(await male(p)).length, await male(p));
  await p.setInputFiles("#imp-plik", PDF_PLIK);
  await p.fill("#imp-opis", SYL.source);
  await p.click("#imp-wgraj");
  await p.waitForFunction(() => /Czytam część [3-9] z 29/.test(document.querySelector("main")?.innerText || ""), null, { timeout: 15000 }).catch(() => {});
  await shot(p, "imp-czyta-375");
  ok("B: pasek postępu „Czytam część … z 29”", /Czytam część \d+ z 29/.test(await p.evaluate(() => document.querySelector("main").innerText)) && (await p.$(".imp-bar[role=progressbar]")));
  await p.waitForFunction(() => /Do decyzji: 84 z 84/.test(document.querySelector("main")?.innerText || ""), null, { timeout: 30000 }).catch(() => {});
  const wg = log.find((x) => x.akcja === "wgraj");
  ok("B: wgranie: typ, wydział, rocznik, opis, nazwa i PDF w base64", wg && wg.typ === "sylabus" && wg.wydzial === "WEFiZ" && wg.rocznik === "wefiz-bm-1-st-2026" && wg.opis === SYL.source && wg.nazwa === STRONY.plik && wg.pdf > 40, wg);
  const cz = log.filter((x) => x.akcja === "czytaj").map((x) => x.czesc);
  ok("B: 29 części czytanych po kolei, każda raz", JSON.stringify(cz) === JSON.stringify(CZ.map((c) => c.czesc)), cz);
  ok("B: po przeczytaniu: do sprawdzenia, 84 pozycje do decyzji, nic nie zatwierdzone samo", /do sprawdzenia/.test(await p.evaluate(() => document.querySelector("main").innerText)) && (await p.locator(".imp-poz").count()) === 20);
  // C: pozycja po pozycji
  const k1 = p.locator('.imp-poz[data-n="1"]');
  ok("C: karta: tytuł z profilu, strona, fragment PDF-u", /#1 · EFZ214AIJ3432_3S · Ekonomia biznesu/.test(await k1.innerText()) && /str\. 1/.test(await k1.innerText()) && /Course title: Business economics/.test(await k1.locator(".imp-frag").innerText()));
  await p.evaluate(() => { document.querySelector('.imp-poz[data-n="1"]')?.scrollIntoView(); scrollBy(0, -90); }); await p.waitForTimeout(200);
  await shot(p, "imp-pozycje-375");
  ok("C 375: cele dotyku ≥ 44 px (pozycje)", !(await male(p)).length, await male(p));
  await k1.locator("button:has-text('Pokaż w PDF')").click(); await p.waitForTimeout(500);
  const ifr = await p.evaluate(() => document.querySelector(".imp-pdf")?.getAttribute("src") || "");
  ok("C: podgląd PDF-u obok pozycji: plik z tej przeglądarki, strona 1", /^blob:.*#page=1$/.test(ifr), ifr);
  await k1.locator("button:has-text('Ukryj PDF')").click(); await p.waitForTimeout(200);
  await k1.locator("button:has-text('Zatwierdź')").click(); await p.waitForTimeout(500);
  const d1 = await p.evaluate(() => (window.__rpc || []).filter((r) => r.fn === "nauka_import_decyzja").map((r) => r.args));
  ok("C: Zatwierdź → nauka_import_decyzja tak, karta znika z „Do decyzji”", d1.length === 1 && d1[0].p_n === 1 && d1[0].p_decyzja === "tak" && !(await p.$('.imp-poz[data-n="1"]')), d1);
  // popraw: zły JSON, niezgodny ze schematem, potem dobra poprawka (ECTS 3 → 4)
  const k2 = p.locator('.imp-poz[data-n="2"]');
  const t2 = await k2.locator(".imp-poz-t").innerText();
  await k2.locator("button:has-text('Popraw')").click(); await p.waitForTimeout(300);
  await shot(p, "imp-popraw-375");
  await p.fill("#imp-json", "{ zle"); await p.click(".modal button:has-text('Zapisz poprawkę')"); await p.waitForTimeout(200);
  const e1 = await p.evaluate(() => document.querySelector(".modal .notice.err")?.textContent || "");
  const dane2 = await p.evaluate((id) => JSON.parse(localStorage.getItem("mock-importy"))[id].pozycje[1].dane, ID);
  await p.fill("#imp-json", JSON.stringify({ ...dane2, ects: "cztery" })); await p.click(".modal button:has-text('Zapisz poprawkę')"); await p.waitForTimeout(200);
  const e2 = await p.evaluate(() => document.querySelector(".modal .notice.err")?.textContent || "");
  ok("C: Popraw: zły JSON i niezgodność ze schematem profilu zatrzymane w oknie", /poprawny JSON/.test(e1) && /ects: oczekiwano integer/.test(e2), [e1, e2]);
  const ects2 = dane2.ects;
  await p.fill("#imp-json", JSON.stringify({ ...dane2, ects: ects2 + 1 }));
  await p.locator(".modal input.input").fill("ECTS sprawdzone w karcie przedmiotu");
  await p.click(".modal button:has-text('Zapisz poprawkę')"); await p.waitForTimeout(600);
  const pop = await p.evaluate(() => (window.__rpc || []).filter((r) => r.fn === "nauka_import_decyzja" && r.args.p_decyzja === "popraw").map((r) => r.args));
  ok("C: Popraw → decyzja popraw z danymi i uwagą", pop.length === 1 && pop[0].p_n === 2 && pop[0].p_dane.ects === ects2 + 1 && /ECTS sprawdzone/.test(pop[0].p_uwaga) && !(await p.$(".modal")), pop.map((x) => [x.p_n, x.p_dane?.ects, x.p_uwaga]));
  // odrzuć i cofnij (w filtrze „Wszystkie”)
  await p.locator('.imp-poz[data-n="3"] button:has-text("Odrzuć")').click(); await p.waitForTimeout(400);
  await p.click(".imp-fil button:has-text('Wszystkie')"); await p.waitForTimeout(300);
  ok("C: filtr „Wszystkie”: decyzje widać na kartach", /zatwierdzona/.test(await p.locator('.imp-poz[data-n="1"]').innerText()) && /poprawiona/.test(await p.locator('.imp-poz[data-n="2"]').innerText()) && /odrzucona/.test(await p.locator('.imp-poz[data-n="3"]').innerText()));
  await p.locator('.imp-poz[data-n="3"] button:has-text("Cofnij decyzję")').click(); await p.waitForTimeout(400);
  ok("C: Cofnij decyzję → znów do decyzji", /do decyzji/.test(await p.locator('.imp-poz[data-n="3"]').innerText()));
  ok("C: „Zatwierdź import” zablokowany, dopóki są pozycje bez decyzji", await p.locator("#imp-zakoncz").isDisabled());
  // D: reszta i zakończenie
  await p.click("button:has-text('Zatwierdź pozostałe (82)')"); await p.waitForTimeout(800);
  ok("D: Zatwierdź pozostałe → wszystko sprawdzone", /Wszystko sprawdzone/.test(await p.evaluate(() => document.querySelector("main").innerText)) && !(await p.locator("#imp-zakoncz").isDisabled()));
  await p.click("#imp-zakoncz"); await p.waitForTimeout(1500);
  const zak = await p.evaluate(() => (window.__rpc || []).filter((r) => r.fn === "nauka_import_zakoncz").map((r) => r.args));
  const got = zak[0]?.p_gotowe;
  const por = got ? I.porownajSylabusy(got, SYL) : null;
  ok("D: zatwierdzenie: wynik w formacie sylabus.json z 84 przedmiotami, różni się tylko poprawionym polem", zak.length === 1 && zak[0].p_stan === "zatwierdzony" && got.courses.length === 84 && got.source === SYL.source
    && por.zgodne === 83 && por.rozne.length === 1 && por.rozne[0].pola.join() === "ects" && por.kolejnosc, por && { ...por, zgodne: por.zgodne });
  ok("D: po zatwierdzeniu PDF kasowany (sprzataj)", log.some((x) => x.akcja === "sprzataj"));
  const [dl] = await Promise.all([p.waitForEvent("download", { timeout: 5000 }).catch(() => null), p.click("#imp-pobierz")]);
  const plik = dl ? JSON.parse(fs.readFileSync(await dl.path(), "utf8")) : null;
  ok("D: „Pobierz sylabus.json”: nazwa i treść = zatwierdzony wynik", dl && dl.suggestedFilename() === "sylabus.json" && JSON.stringify(plik) === JSON.stringify(got), dl && dl.suggestedFilename());
  await p.click("button:has-text('Porównaj z obecnym sylabusem')"); await p.waitForTimeout(800);
  const pt = await p.evaluate(() => document.getElementById("imp-por")?.innerText || "");
  ok("D: porównanie z obecnym sylabusem: 83 zgodne, 1 różny (ects)", /Zgodne przedmioty: 83, różne: 1/.test(pt) && new RegExp(SYL.courses.find((c) => c.code === "EFZ214AIJ3434_30S").id + ": ects").test(pt), pt);
  await p.evaluate(() => { document.querySelector(".toast")?.remove(); scrollTo(0, 0); }); await p.waitForTimeout(200);
  await shot(p, "imp-zatwierdzony-375");
  await p.click("main button.back"); await p.waitForTimeout(1200);
  ok("D: lista: import zatwierdzony", /zatwierdzony/.test(await p.evaluate(() => document.querySelector(".imp-lista")?.innerText || "")));
  ok("B–D: bez błędów", !p.errors.length, p.errors);
  await p.context().close();
}

// ---------- E: PL 1280, EN 375 i 1280 (import już przeczytany) ----------
for (const [lang, w, h] of [["pl", 1280, 900], ["en", 375, 812], ["en", 1280, 900]]) {
  const p = await page(b, { konto: "starosta", w, h, lang, ls: { "bm-starosta": "1", "mock-importy": JSON.stringify({ [ID]: przeczytany() }) } });
  const log = []; await edge(p, log);
  await p.goto(BASE + "index.html#/importyAdmin"); await p.waitForTimeout(2500);
  await p.setInputFiles("#imp-plik", PDF_PLIK).catch(() => {});
  await shot(p, `imp-formularz-${lang}-${w}`);
  const t1 = await tekstUI(p);
  if (lang === "en") ok(`E ${w}: formularz po angielsku, bez polskich liter`, /Imports/.test(t1) && /New import/.test(t1) && /Upload and read/.test(t1) && !PLW.test(t1), t1.match(/.{0,40}[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ].{0,40}/g));
  await p.click(`.imp-lista [data-id="${ID}"] button`); await p.waitForTimeout(1500);
  await p.locator('.imp-poz[data-n="2"] button').nth(0).click(); await p.waitForTimeout(300);
  await p.locator('.imp-poz[data-n="5"] button').nth(2).click(); await p.waitForTimeout(300);
  await p.click(".imp-fil button >> nth=1"); await p.waitForTimeout(300);
  await p.locator('.imp-poz[data-n="1"] button').nth(3).click(); await p.waitForTimeout(900);   // Pokaż w PDF → podpisany link z funkcji Edge
  ok(`E ${lang} ${w}: podgląd PDF-u bez pliku w przeglądarce: link z funkcji Edge → blob`, log.some((x) => x.akcja === "pdf") && /^blob:.*#page=1$/.test(await p.evaluate(() => document.querySelector(".imp-pdf")?.getAttribute("src") || "")));
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(200);
  await shot(p, `imp-pozycje-${lang}-${w}`);
  await p.evaluate(() => { document.querySelector('.imp-poz[data-n="1"]')?.scrollIntoView(); scrollBy(0, -90); }); await p.waitForTimeout(300);
  await shot(p, `imp-karty-${lang}-${w}`);
  const t2 = await tekstUI(p);
  if (lang === "en") ok(`E ${w}: pozycje po angielsku, bez polskich liter`, /To decide: 82 of 84/.test(t2) && /Approve/.test(t2) && /Show in PDF/.test(t2) && /AI notes/.test(t2) && !PLW.test(t2), t2.match(/.{0,40}[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ].{0,40}/g));
  ok(`E ${lang} ${w}: cele dotyku ≥ 44 px`, !(await male(p)).length, await male(p));
  ok(`E ${lang} ${w}: bez poziomego przewijania`, await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  ok(`E ${lang} ${w}: bez błędów`, !p.errors.length, p.errors);
  await p.context().close();
}

await b.close();
for (const [s, n, i] of wyniki) console.log(s, n, i || "");
const bad = wyniki.filter((x) => x[0] === "✗").length;
console.log(bad ? `BŁĘDY: ${bad} z ${wyniki.length}` : `OK: ${wyniki.length} z ${wyniki.length}`);
process.exit(bad ? 1 : 0);
