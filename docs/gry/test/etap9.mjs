// Etap 9 (docs/gry/SPEC-2.md 7 „Etap 9”): Boss przed kolokwium – karta na Dziś w każdym stanie (trwa / pokonany / uciekł / dwa / mało),
// „Zadaj cios” → quiz 10 pytań i animacja trafienia (bez niej przy „Mniej animacji”), odbiór (ok / already / too_few),
// widok #/boss/<id>, starosta (ogłoszenie, panel), licznik wywołań rp.bossy, rysunki 11 bossów × 4 stany, EN, brak v15.
// Zrzuty: $OUT/etap9/ (arkusz rysunków: arkusz-*.png).
import { chromium, page, BASE, OUT } from "./lib.mjs";
import fs from "fs";
const D = OUT + "/etap9"; fs.mkdirSync(D, { recursive: true });
const shot = (p, n, full) => p.screenshot({ path: `${D}/${n}.png`, fullPage: !!full });
const b = await chromium.launch();
const wyniki = [];
const ok = (nazwa, warunek, info) => { wyniki.push([warunek ? "✓" : "✗", nazwa, warunek ? "" : JSON.stringify(info)?.slice(0, 400)]); };
const calls = (p, fn) => p.evaluate((fn) => window.__rpc.filter((x) => x.fn === fn).map((x) => ({ ...x.args, res: x.res })), fn);
const nBossy = (p) => p.evaluate(() => window.__bossyN || 0);
const hashGo = async (p, h, ms = 400) => { await p.evaluate((h) => { location.hash = h; }, h); await p.waitForTimeout(ms); };
const txt = async (p, sel) => ((await p.locator(sel).count()) ? (await p.locator(sel).first().innerText()).replace(/\s+/g, " ") : "");
const errs = [];
const done = (p, nazwa) => { if (p.errors.length) errs.push([nazwa, p.errors]); return p.context().close(); };
const T = { pl: { inf: "Inflator", par: "Paragrafusa", strike: "Zadaj cios →" }, en: { inf: "The Inflator", par: "Paragraphus", strike: "Strike →" } };

// 1) karta na Dziś: stany, 390 / 1280, PL / EN
for (const lang of ["pl", "en"]) for (const [w, hgt] of [[390, 844], [1280, 800]]) {
  const t = T[lang], tag = `${w}-${lang}`;
  for (const sc of ["trwa", "pokonany", "uciekl", "dwa", "malo", "slaby"]) {
    if ((sc === "malo" || sc === "slaby") && (w !== 390)) continue;
    const p = await page(b, { w, h: hgt, lang, ls: { "mock-boss": sc } });
    await p.goto(BASE + "index.html#/"); await p.waitForTimeout(2600);
    const card = p.locator("#boss-card"), c = await txt(p, "#boss-card");
    const first = await p.evaluate(() => { const a = document.getElementById("boss-card"), n = document.querySelector(".sk-now"); return !!(a && n && a.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING); });
    if (sc === "trwa") {
      const bar = await p.locator("#boss-card .bs-bar i").getAttribute("style");
      ok(`${tag} trwa: karta pierwsza na liście, imię, pasek zabranego życia`, first && (await card.count()) === 1 && c.includes(t.inf) && /width:\s*37%/.test(bar) && (await card.getAttribute("data-id")) === "d-kol-makro", { c, bar, first });
      ok(`${tag} trwa: liczby i „Zadaj cios”`, (lang === "pl" ? /112 \/ 300 życia zabrane · 9 osób walczy/.test(c) && /kolokwium z Makroekonomii za 5 dni/.test(c) && /Twoje ciosy: 14/.test(c)
        : /112 \/ 300 health taken · 9 people fighting/.test(c) && /Macroeconomics test in 5 days/.test(c) && /Your strikes: 14/.test(c)) && (await txt(p, ".bs-strike")) === t.strike, c);
      ok(`${tag} trwa: kolor obramowania = kolor przedmiotu`, await p.evaluate(() => { const el = document.getElementById("boss-card"); return getComputedStyle(el).borderTopColor !== "rgba(0, 0, 0, 0)" && /--c:\s*#/.test(el.getAttribute("style")); }));
    }
    if (sc === "pokonany") ok(`${tag} pokonany: „Rok pokonał …!” i „Odbierz +50 pkt”`, (lang === "pl" ? c.includes("Rok pokonał Paragrafusa!") && (await txt(p, ".bs-claim")) === "Odbierz +50 pkt" : c.includes("Your year beat Paragraphus!") && (await txt(p, ".bs-claim")) === "Claim +50 pts") && first, c);
    if (sc === "uciekl") ok(`${tag} uciekł: podsumowanie bez kary`, lang === "pl" ? c.includes("Inflator uciekł. Zabrakło 30% życia.") : c.includes("The Inflator got away. 30% health left."), c);
    if (sc === "dwa") {
      ok(`${tag} dwa bossy: jedna karta z najbliższym terminem + „+1 boss”`, (await card.count()) === 1 && (await card.getAttribute("data-id")) === "d-kol-prawo" && (await txt(p, ".bs-more")) === "+1 boss", c);
      await p.locator(".bs-more").click(); await p.waitForTimeout(500);
      ok(`${tag} „+1 boss” prowadzi do widoku drugiego bossa`, (await p.evaluate(() => location.hash)) === "#/boss/d-kol-makro" && (await txt(p, ".bs-title")) === t.inf, await p.evaluate(() => location.hash));
    }
    if (sc === "malo") ok(`${tag} mało ciosów: komunikat z liczbami, bez przycisku`, (lang === "pl" ? c.includes("Zadałeś 4 z 10 ciosów – tym razem bez nagrody") : c.includes("You struck 4 of 10 times – no reward this time")) && !(await p.locator(".bs-claim").count()), c);
    if (sc === "slaby") ok(`${tag} < 25% życia: rysunek z potem i plastrem`, (await p.locator("#boss-card .bs-art").getAttribute("aria-label")) === (lang === "pl" ? "Inflator: ledwo stoi" : "The Inflator: barely standing"), await p.locator("#boss-card .bs-art").getAttribute("aria-label"));
    if (["trwa", "pokonany", "uciekl"].includes(sc) || (sc === "dwa" && w === 390)) {
      if (sc === "dwa") { await hashGo(p, "#/", 500); }
      await p.evaluate(() => scrollTo(0, 0)); await shot(p, `karta-${sc}-${tag}`);
    }
    await done(p, `karta ${sc} ${tag}`);
  }
}

// 2) licznik wywołań rp.bossy na Dziś (najwyżej raz na 60 s)
{
  const p = await page(b);
  await p.goto(BASE + "index.html#/"); await p.waitForTimeout(2600);
  const n1 = await nBossy(p);
  for (const v of ["#/terms", "#/", "#/review", "#/", "#/materials", "#/"]) await hashGo(p, v, 300);
  const n2 = await nBossy(p);
  await p.evaluate(() => { window.SKROT_BOSS._state().at -= 61000; }); await hashGo(p, "#/terms", 200); await hashGo(p, "#/", 600);
  const n3 = await nBossy(p);
  ok("licznik: rp.bossy() raz przy wejściu, 0 przy kolejnych render() w 60 s, znowu po 60 s", n1 === 1 && n2 === 1 && n3 === 2, { n1, n2, n3 });
  // albo zagraj → Graj z wybranym przedmiotem
  await p.locator(".bs-play").click(); await p.waitForTimeout(800);
  ok("„albo zagraj” → Graj z przedmiotem bossa", (await p.evaluate(() => location.hash)) === "#/gry" && (await p.locator("#gry-sid").inputValue()) === "makroekonomia");
  await done(p, "licznik");
}

// 3) „Zadaj cios” → quiz 10 pytań z przedmiotu, po powrocie odświeżenie i animacja trafienia (bez niej przy „Mniej animacji”)
for (const calm of [false, true]) {
  const p = await page(b, { ctx: calm ? { reducedMotion: "reduce" } : {} });
  await p.goto(BASE + "index.html#/"); await p.waitForTimeout(2600);
  await p.locator(".bs-strike").click(); await p.waitForTimeout(1500);
  const lp = await p.evaluate(() => { const l = document.querySelector(".lp"); return l ? l.outerHTML : ""; });
  ok(`cios${calm ? " (mniej animacji)" : ""}: quiz 10 pytań „Cios w Inflatora”`, /Cios w Inflatora/.test(lp) && /PYTANIE 1 Z 10/i.test(await txt(p, ".lp")), (await txt(p, ".lp")).slice(0, 120));
  const qs = [];
  for (let i = 0; i < 3; i++) {
    const q = await txt(p, ".lp .lp-q, .lp h2, .lp .q");
    qs.push(await p.evaluate(() => document.querySelector(".lp")?.innerText.split("\n").find((l) => /pytanie \d+ – co jest prawdą/.test(l)) || ""));
    const opts = await p.locator(".lp button.opt").allInnerTexts();
    const k = opts.findIndex((o) => { const m = o.match(/Odpowiedź ([ABCD])(\d+)/); return m && "ABCD".indexOf(m[1]) === +m[2] % 4; });
    await p.locator(".lp button.opt").nth(k).click(); await p.waitForTimeout(250);
    await p.locator(".lp .lp-cta").click(); await p.waitForTimeout(350);
  }
  ok(`cios${calm ? " (mniej animacji)" : ""}: pytania tylko z przedmiotu bossa`, qs.every((q) => /^(PKB|NBP):/.test(q)) && qs.length === 3, qs);
  const odp = await calls(p, "nauka_rp_odpowiedz");
  const before = await nBossy(p);
  await p.locator(".lp-x").click(); await p.waitForTimeout(calm ? 500 : 250);
  const hit = await p.evaluate(() => ({ hit: document.querySelectorAll("#boss-card .bs-art.hit").length, dmg: document.querySelector("#boss-card .bs-dmg")?.textContent || null }));
  const c = await txt(p, "#boss-card");
  ok(`cios${calm ? " (mniej animacji)" : ""}: po powrocie rp.bossy() i więcej moich ciosów`, odp.filter((x) => x.res?.poprawna).length === 3 && (await nBossy(p)) === before + 1 && c.includes("Twoje ciosy: 17") && c.includes("115 / 300"), { odp: odp.length, c });
  ok(calm ? "mniej animacji: bez mrugania i „−n”" : "animacja trafienia: mruganie i „−3”", calm ? hit.hit === 0 && hit.dmg === null : hit.hit === 1 && hit.dmg === "−3", hit);
  if (!calm) { await p.waitForTimeout(700); ok("animacja trafienia znika po 600 ms", !(await p.locator("#boss-card .bs-dmg, #boss-card .bs-art.hit").count())); }
  await done(p, "cios " + calm);
}

// 4) odbiór nagrody: ok → konfetti, already → karta znika, too_few → komunikat
{
  const p = await page(b, { ls: { "mock-boss": "pokonany" } });
  await p.goto(BASE + "index.html#/"); await p.waitForTimeout(2600);
  await p.locator(".bs-claim").click(); await p.waitForTimeout(300);
  const conf = await p.locator(".lp-confetti").count(), od = await calls(p, "nauka_boss_odbierz");
  ok("odbiór ok: konfetti, banner, karta znika", conf === 1 && od[0]?.res?.ok && od[0].res.pkt === 50 && /\+50 pkt rankingu/.test(await txt(p, ".lp-banner")) && !(await p.locator("#boss-card").count()), { conf, od });
  await done(p, "odbior ok");
}
{
  const p = await page(b, { ls: { "mock-boss": "pokonany" } });
  await p.goto(BASE + "index.html#/"); await p.waitForTimeout(2600);
  await p.evaluate(() => window.skrot.rp.bossOdbierz("d-kol-prawo")); // odebrane gdzie indziej (np. na drugim urządzeniu)
  await p.locator(".bs-claim").click(); await p.waitForTimeout(400);
  const od = await calls(p, "nauka_boss_odbierz");
  ok("odbiór already: karta znika bez konfetti", od[1]?.res?.code === "already" && !(await p.locator("#boss-card").count()) && !(await p.locator(".lp-confetti").count()), od);
  await done(p, "odbior already");
}
{
  const p = await page(b, { ls: { "mock-boss": "malo" } });
  await p.goto(BASE + "index.html#/"); await p.waitForTimeout(2600);
  await p.evaluate(() => { window.SKROT_BOSS._state().d.bossy[0].mozna_odebrac = true; }); await hashGo(p, "#/terms", 200); await hashGo(p, "#/", 300); // stara odpowiedź bazy
  await p.locator(".bs-claim").click(); await p.waitForTimeout(400);
  const od = await calls(p, "nauka_boss_odbierz");
  ok("odbiór too_few: komunikat z liczbami z bazy", od[0]?.res?.code === "too_few" && (await txt(p, "#boss-card")).includes("Zadałeś 4 z 10 ciosów – tym razem bez nagrody") && !(await p.locator(".bs-claim").count()), od);
  await done(p, "odbior too_few");
}

// 5) widok #/boss/<id>: licznik do terminu, najlepsi wojownicy (tylko pseudonimy), zasady
for (const lang of ["pl", "en"]) for (const [w, hgt] of [[390, 844], [1280, 800]]) {
  const tag = `${w}-${lang}`;
  const p = await page(b, { w, h: hgt, lang, ls: { "mock-nick": "Bartek", "mock-vis": "1" } });
  await p.goto(BASE + "index.html#/boss/d-kol-makro"); await p.waitForTimeout(2600);
  const cnt = await txt(p, "#bs-count b"), top = await p.locator(".bs-top-l li").allInnerTexts();
  ok(`${tag} widok: duży rysunek, tytuł, licznik dni i godzin`, (await p.locator(".bs-full .bs-art.lg svg").count()) === 1 && (await txt(p, ".bs-title")) === T[lang].inf && (lang === "pl" ? /^4 dni \d+ godz\.$/ : /^4 d \d+ h$/).test(cnt), cnt);
  ok(`${tag} widok: najlepsi wojownicy – tylko pseudonimy i ciosy, ja z „Ty”`, top.length === 3 && top.every((x) => !/@/.test(x)) && /Łoś Ania/.test(top[0]) && /38/.test(top[0]) && (await p.locator(".bs-top-l li.me").count()) === 1 && /Bartek/.test(top[2]), top);
  ok(`${tag} widok: zasady zwijane`, (await p.locator("details.bs-rules").count()) === 1 && !(await p.locator("details.bs-rules").getAttribute("open")) && (lang === "pl" ? /Każda dobra odpowiedź z Makroekonomii to cios, zadanie liczbowe – 3 ciosy\. Nagroda dla osób z min\. 10 ciosami\./ : /Every correct answer in Macroeconomics is a strike/).test(await p.locator("details.bs-rules p").first().textContent()), await p.locator("details.bs-rules p").first().textContent());
  ok(`${tag} widok: wejście = jedno rp.bossy()`, (await nBossy(p)) === 1);
  await p.evaluate(() => scrollTo(0, 0)); await shot(p, `widok-${tag}`, true);
  await done(p, "widok " + tag);
}
{ // widok pokonanego i zbiegłego bossa, nieistniejący boss
  const p = await page(b, { ls: { "mock-boss": "dwa" } });
  await p.goto(BASE + "index.html#/boss/d-kol-prawo"); await p.waitForTimeout(2600);
  ok("widok pokonanego: X zamiast oczu, „Odbierz”, link do innego bossa", (await p.locator(".bs-full .bs-art").getAttribute("aria-label")) === "Paragrafus: pokonany" && (await p.locator(".bs-full .bs-claim").count()) === 1 && (await p.locator(".bs-others .sk-row-big").count()) === 1);
  await shot(p, "widok-pokonany-390", true);
  await hashGo(p, "#/boss/nie-ma", 600);
  ok("widok: nieistniejący boss – komunikat", (await txt(p, "main .notice")) === "Tego bossa już nie ma.");
  await done(p, "widok pokonany");
}

// 6) starosta: chip „ogłoś rokowi” z tekstem do skopiowania; panel – zmiana życia, ukrycie
for (const lang of ["pl", "en"]) {
  const p = await page(b, { konto: "starosta", lang, ls: { "bm-starosta": "1" }, ctx: { permissions: ["clipboard-read", "clipboard-write"] } });
  await p.goto(BASE + "index.html#/"); await p.waitForTimeout(2600);
  ok(`starosta ${lang}: chip „Nowy boss – ogłoś rokowi”`, (await txt(p, "#boss-card .bs-ann")).includes(lang === "pl" ? "Nowy boss – ogłoś rokowi" : "New boss – tell your year"));
  await p.locator("#boss-card .bs-ann").click(); await p.waitForTimeout(300);
  const ta = await p.locator(".bs-ann-ta").inputValue();
  ok(`starosta ${lang}: tekst ogłoszenia`, lang === "pl" ? /^⚔️ Inflator atakuje! Kolokwium z Makroekonomii \d+ \S+\. Każda dobra odpowiedź na skrotbm\.pl to cios\. Jeśli go pokonamy do \d+ \S+, każdy z 10\+ ciosami dostaje \+50 pkt\.$/.test(ta)
    : /^⚔️ The Inflator attacks! Macroeconomics test on \d+ \w+\. Every correct answer on skrotbm\.pl is a strike\. If we beat it by \d+ \w+, everyone with 10\+ strikes gets \+50 pts\.$/.test(ta), ta);
  if (lang === "pl") await shot(p, "starosta-ogloszenie-390");
  await p.locator(".modal .btn.primary").click(); await p.waitForTimeout(300);
  ok(`starosta ${lang}: „Kopiuj” → schowek`, (await p.evaluate(() => navigator.clipboard.readText())) === ta);
  await done(p, "starosta " + lang);
}
{
  const p = await page(b, { konto: "starosta", ls: { "bm-starosta": "1", "mock-boss": "pokonany" } });
  await p.goto(BASE + "index.html#/"); await p.waitForTimeout(2600);
  await p.locator("#boss-card .bs-ann").click(); await p.waitForTimeout(300);
  const ta = await p.locator(".bs-ann-ta").inputValue();
  ok("starosta: pokonany – „Rok pokonał Paragrafusa w N dni! Odbierzcie nagrodę na Dziś.”", /^Rok pokonał Paragrafusa w \d+ dni! Odbierzcie nagrodę na Dziś\.$/.test(ta), ta);
  await done(p, "starosta pokonany");
}
for (const [w, hgt] of [[390, 844], [1280, 800]]) {
  const p = await page(b, { konto: "starosta", w, h: hgt, ls: { "bm-starosta": "1", "mock-boss": "dwa" } });
  p.on("dialog", (d) => d.accept());
  await p.goto(BASE + "index.html#/more"); await p.waitForTimeout(2600);
  await p.locator(".more-row", { hasText: "Gry i ranking" }).click(); await p.waitForTimeout(600);
  ok(`${w} panel: sekcja „Bossy” z dwoma bossami`, (await p.locator(".rk-admin h4", { hasText: "Bossy" }).count()) === 1 && (await p.locator(".bs-admin li").count()) === 2);
  await p.locator(".bs-admin li").first().scrollIntoViewIfNeeded(); await shot(p, `panel-starosty-${w}`);
  if (w === 390) {
    await p.locator(".bs-admin li[data-id=d-kol-makro] .bs-hp").fill("450");
    await p.locator(".bs-admin li[data-id=d-kol-makro] button", { hasText: "Zmień życie" }).click(); await p.waitForTimeout(800);
    const a1 = await calls(p, "nauka_admin_boss");
    ok("panel: „Zmień życie” → bossAdmin(id, { hp })", a1[0]?.p_id === "d-kol-makro" && a1[0].p_hp === 450 && a1[0].p_ukryty === null && (await p.locator(".bs-admin li[data-id=d-kol-makro] .bs-hp").inputValue()) === "450", a1);
    await p.locator(".bs-admin li[data-id=d-kol-prawo] button", { hasText: "Ukryj" }).click(); await p.waitForTimeout(800);
    const a2 = await calls(p, "nauka_admin_boss");
    ok("panel: „Ukryj” (confirm) → bossAdmin(id, { ukryty: true }), boss znika", a2[1]?.p_id === "d-kol-prawo" && a2[1].p_ukryty === true && (await p.locator(".bs-admin li").count()) === 1, a2);
    await p.keyboard.press("Escape"); await hashGo(p, "#/", 300); await p.evaluate(() => { window.SKROT_BOSS._state().at = 0; }); await hashGo(p, "#/terms", 100); await hashGo(p, "#/", 700);
    ok("panel: po zmianach karta na Dziś ma nowe życie", (await txt(p, "#boss-card")).includes("112 / 450"), await txt(p, "#boss-card"));
  }
  await done(p, "panel " + w);
}

// 7) bez v15, konto darmowe, motyw różowy
{
  const p = await page(b, { ls: { "mock-v15": "0" } });
  await p.goto(BASE + "index.html#/"); await p.waitForTimeout(2600);
  for (const v of ["#/terms", "#/"]) await hashGo(p, v, 300);
  const c = await calls(p, "nauka_bossy");
  ok("bez v15: brak karty, jedno pytanie o bossy, zero błędów", !(await p.locator("#boss-card").count()) && c.length === 1 && !p.errors.length, { c: c.length, e: p.errors });
  await hashGo(p, "#/boss/d-kol-makro", 500);
  ok("bez v15: widok bossa – „nie są jeszcze włączone”", /nie są jeszcze włączone/.test(await txt(p, "main .notice")));
  await done(p, "bez v15");
}
{
  const p = await page(b, { konto: "darmowe" });
  await p.goto(BASE + "index.html#/"); await p.waitForTimeout(2600);
  ok("konto darmowe: brak karty i brak wywołań bossy", !(await p.locator("#boss-card").count()) && !(await calls(p, "nauka_bossy")).length);
  await done(p, "darmowe");
}
{
  const p = await page(b, { ls: { "skrot-theme": "pink" } });
  await p.goto(BASE + "index.html#/"); await p.waitForTimeout(2600);
  ok("motyw różowy: karta działa", (await p.locator("#boss-card").count()) === 1);
  await shot(p, "karta-trwa-390-pink");
  await done(p, "pink");
}

// 8) arkusz rysunków: 10 bossów + domyślny × trwa / < 25% / pokonany / uciekł
const SIDS = ["makroekonomia", "prawo", "podstawy-finansow", "analiza-matematyczna", "ekonomia-biznesu", "logistyka", "podstawy-zarzadzania", "zarzadzanie-zasobami-ludzkimi", "ochrona-wlasnosci-intelektualnej", "narzedzia-it-w-zarzadzaniu", "statystyka"];
for (const [lang, w] of [["pl", 1280], ["pl", 390], ["en", 1280]]) {
  const p = await page(b, { w, h: 900, lang });
  await p.goto(BASE + "index.html#/"); await p.waitForTimeout(2200);
  const info = await p.evaluate((sids) => {
    const B = window.SKROT_BOSS, T = (s) => window.SKROT_I18N?.t?.(s) ?? s, ST = { trwa: "trwa", slaby: "< 25% życia", pokonany: "pokonany", uciekl: "uciekł" };
    const box = document.createElement("div"); box.id = "arkusz";
    box.style.cssText = "position:absolute;left:0;top:0;width:100%;box-sizing:border-box;z-index:9999;background:#fff;padding:12px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;font:12px system-ui;color:#0F1A14";
    const svgs = new Set();
    for (const s of sids) for (const st of ["trwa", "slaby", "pokonany", "uciekl"]) {
      const d = document.createElement("div"); d.style.cssText = "border:1px solid #CFE8D8;border-radius:10px;padding:4px;text-align:center";
      const svg = B._svg(s, st); if (st === "trwa") svgs.add(svg.replace(/#[0-9A-Fa-f]{6}/g, ""));
      d.innerHTML = svg + `<div><b>${T(B._name(s))}</b><br>${ST[st]}</div>`; d.querySelector("svg").style.cssText = "width:100%;max-width:150px;display:block;margin:auto";
      box.append(d);
    }
    document.body.append(box); scrollTo(0, 0);
    return { distinct: svgs.size, n: box.children.length };
  }, SIDS);
  if (lang === "pl" && w === 1280) ok("rysunki: 11 różnych bossów × 4 stany", info.distinct === 11 && info.n === 44, info);
  await p.waitForTimeout(200);
  await p.locator("#arkusz").screenshot({ path: `${D}/arkusz-${w}-${lang}.png` });
  await done(p, "arkusz");
}

ok("zero błędów w konsoli na wszystkich stronach", !errs.length, errs);
await b.close();
for (const [s, n, i] of wyniki) console.log(s, n, i || "");
const bad = wyniki.filter((x) => x[0] === "✗").length;
console.log(`\n${wyniki.length - bad}/${wyniki.length} OK · zrzuty: ${D}`);
process.exit(bad ? 1 : 0);
