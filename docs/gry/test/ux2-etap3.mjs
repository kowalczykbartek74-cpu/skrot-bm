// UX-2 etap 3: powroty po przerwie (kryteria K1–K5 z ~/zdawalni/ux/petla-2.md).
// BASE=http://127.0.0.1:8812/ [RUNDA=1] node docs/gry/test/ux2-etap3.mjs
import { execSync } from "child_process";
import { chromium, open, pomiar, tester, zapiszRaport, katalog, pozaEkranem, fullShot, dayN } from "./ux2-lib.mjs";

const ROOT = new URL("../../../", import.meta.url).pathname;
const DIR = katalog(3), R = { etap: 3, runda: +(process.env.RUNDA || 0), pomiary: [], zrzuty: [], ruch: [], dodatkowe: [] };
const { ok, wynik } = tester(R);
const shot = async (p, name, full) => { if (!DIR) return; const f = DIR + name + ".png"; if (full) await fullShot(p, f); else await p.screenshot({ path: f }); R.zrzuty.push(name + ".png"); };
const b = await chromium.launch();
const T = dayN("2026-11-06");
const PR = { "skrot-zam-prezent": "1" };
const karta = (p) => p.evaluate(() => { const e = document.querySelector("#main .nw-powrot:not(.nw-powrot-mini)"); if (!e) return null; const ld = document.querySelector("#main .ld-block, #main .sk-hero");
  return { h: e.querySelector(".nw-powrot-h")?.textContent, pkt: [...e.querySelectorAll(".nw-pkt")].map((x) => x.firstChild.textContent), pktH: [...e.querySelectorAll(".nw-pkt")].map((x) => Math.round(x.getBoundingClientRect().height)), nap: e.querySelector(".nw-powrot-nap > span:not(.nw-ico)")?.textContent || null,
    btn: [...e.querySelectorAll(".nw-powrot-go")].map((x) => x.textContent.trim()), lekko: e.querySelector(".nw-powrot-lekko")?.textContent, hero: !!document.querySelector("#main .zh-hero"), goBottom: Math.round(e.querySelector(".nw-powrot-go")?.getBoundingClientRect().bottom || 0), vh: innerHeight, stas: !!e.querySelector(".nw-powrot-stas svg, .nw-powrot-stas img, .nw-powrot-stas > *"),
    nadLekcja: !!ld && !!(e.compareDocumentPosition(ld) & Node.DOCUMENT_POSITION_FOLLOWING), top: Math.round(e.getBoundingClientRect().top) }; });
const pill = (p) => p.evaluate(() => document.querySelector("#main .greet .nw-streak")?.innerText.replace(/\s+/g, " ").trim());

// ---------- K1: przerwa 5 dni, dziś bez XP → „Dobrze, że jesteś. Ostatnio 5 dni temu.” nad kartą dnia, Staś, ≤ 3 prawdziwe punkty
const P5 = { xp: { t: 400, d: T - 5, n: 15 }, streak: { d: T - 5, n: 2 }, nd: [T - 6, T - 5], done: { A1: Date.now() - 6 * 864e5 }, seen: ["A1"] };
for (const [w, hh, dark, lang] of [[390, 844, false, "pl"], [360, 640, false, "pl"], [390, 844, true, "pl"], [1280, 900, false, "pl"], [390, 844, false, "en"]]) {
  const tag = `${w}-${dark ? "ciemny" : "jasny"}${lang === "en" ? "-en" : ""}`;
  const p = await open(b, { w, h: hh, dark, lang, prog: P5, ls: PR });
  const k = await karta(p);
  if (tag === "390-jasny") {
    ok("K1 przerwa 5 dni: „Dobrze, że jesteś. Ostatnio 5 dni temu.” nad kartą dnia, ze Stasiem", k && k.h === "Dobrze, że jesteś. Ostatnio 5 dni temu." && k.nadLekcja && k.stas, k);
    ok("K1 najwyżej 3 punkty, tylko te, które są (liczby > 0), jako przyciski ≥ 44 px prowadzące dalej", k && k.pkt.length <= 3 && k.pkt.every((x) => /: [1-9]\d*$/.test(x)) && k.pkt.some((x) => /^Nowe terminy: 1$/.test(x)) && k.pktH.every((x) => x >= 44), k);
    ok("K1 jeden główny przycisk „Wracam: 3 minuty” (bez konkurencyjnego „Zaczynamy · 5 min” w karcie dnia)", k && k.btn.length === 1 && k.btn[0] === "Wracam: 3 minuty" && !k.hero && /bez nowego tematu/i.test(k.lekko), k);
    await p.click("#main .nw-powrot .nw-pkt:nth-child(2)"); await p.waitForTimeout(500);
    ok("K1 punkt „Nowe terminy” otwiera Terminy", await p.evaluate(() => window.ZD_APP.S.route.view === "terms"));
    await p.evaluate(() => window.ZD_APP.go({ view: "home" })); await p.waitForTimeout(500);
    R.dodatkowe.push(`Punkty karty powrotu (390 jasny): ${JSON.stringify(k?.pkt)}`);
  }
  if (w === 360) ok("K1 360×640: „Wracam” mieści się w pierwszym ekranie nad dolnym paskiem", k && k.goBottom <= k.vh - 72, k);
  if (lang === "en") ok("K1 EN: „Good to see you. Last time: 5 days ago.”, „I'm back: 3 minutes”", k && k.h === "Good to see you. Last time: 5 days ago." && k.btn[0] === "I'm back: 3 minutes", k);
  ok(`K1 ${tag}: nic poza ekranem`, (await pozaEkranem(p, "#main .nw-powrot *")).length === 0 && !(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)));
  await shot(p, `k1-powrot-${tag}`);
  R.pomiary.push(await pomiar(p, `Karta powrotu ${tag}`, "#main .nw-powrot", "#main .nw-powrot"));
  await p.close();
}
{
  const p = await open(b, { prog: { xp: { t: 400, d: T - 1, n: 15 }, streak: { d: T - 1, n: 2 } }, ls: PR });
  ok("K1 wczoraj była nauka (1 dzień): bez karty powrotu", (await karta(p)) === null);
  await p.close();
  const q = await open(b, { prog: { ...P5, xp: { t: 420, d: T, n: 5 }, streak: { d: T, n: 1 } }, ls: PR });
  ok("K1 dziś już XP: karta znika", (await karta(q)) === null);
  await q.close();
  const PON = "2026-11-09T10:00:00+01:00", tp = dayN(PON);
  const r = await open(b, { prog: { xp: { t: 400, d: tp - 3, n: 15 }, streak: { d: tp - 3, n: 6 } }, czas: PON, ls: PR });
  ok("K1 zwykły rytm: piątek → poniedziałek (weekend) bez karty powrotu", (await karta(r)) === null);
  await r.close();
  const z = await open(b, { prog: { xp: { t: 400, d: tp - 4, n: 15 }, streak: { d: tp - 4, n: 6 } }, czas: PON, ls: { ...PR, "mock-v24": "1", "mock-mon": JSON.stringify({ start: 0, ksiega: [], pos: [], zam: { reqs: ["a"], dni: ["2026-11-06"] }, zal: {}, gab: [] }) } });
  ok("K1 czwartek → poniedziałek, piątek chroniony zamrożeniem: bez karty powrotu", (await karta(z)) === null);
  await z.close();
  const m = await open(b, { prog: { xp: { t: 400, d: tp - 4, n: 15 }, streak: { d: tp - 4, n: 6 } }, czas: PON, ls: PR });
  const mm = await m.evaluate(() => ({ mini: document.querySelector("#main .nw-powrot-mini")?.innerText.replace(/\s+/g, " "), hero: !!document.querySelector("#main .zh-hero") }));
  ok("K3 czwartek → poniedziałek bez zamrożeń (1 dzień zajęć opuszczony): bez karty powrotu, ale z wierszem naprawy „Seria 6 dni do odzyskania … 0/2”; karta dnia zostaje", /Seria 6 dni do odzyskania/.test(mm.mini || "") && /0\/2/.test(mm.mini) && mm.hero, mm);
  await shot(m, "k3-naprawa-bez-karty-390-jasny");
  await m.close();
}

// ---------- K2: „Wracam: 3 minuty” → lżejsza karta (lekko: rozgrzewka ≤ 6 + 1 pytanie, bez nowego tematu); trybDnia z przerwaDni
{
  const p = await open(b, { prog: P5, ls: PR });
  const tr = await p.evaluate(() => { const A = window.ZD_APP, k = A.ldKontekst(); return { przerwaDni: k.przerwaDni, tryb: A.LDE.trybDnia(A.ldTematy(), k).tryb }; });
  ok("K2 trybDnia uwzględnia przerwaDni (3 opuszczone dni zajęć: wt.–czw.; pon. 2.11 wolny) → „lekko”", tr.przerwaDni === 3 && tr.tryb === "lekko", tr);
  await p.click("#main .nw-powrot-go"); await p.waitForTimeout(2500);
  const c = await p.evaluate(() => { const k = window.ZD_APP.ldDay.get().plany?.karta; return k && { temat: k.temat, powrot: k.powrot, tryb: k.tryb, nowe: k.nowe, min: k.min, kroki: k.kroki.map((s) => [s.k, s.n]) }; });
  const ekran = await p.evaluate(() => document.body.innerText.replace(/\s+/g, " "));
  ok("K2 karta powrotu: znany temat (A1, nie nowy), tryb lekko, 3 min; bez zaległych fiszek rozgrzewka = 4 pytania ze znanego tematu + 1 pytanie", c && c.temat === "A1" && c.powrot && c.tryb === "lekko" && c.nowe === false && c.min === 3 && JSON.stringify(c.kroki) === JSON.stringify([["rozgrzewka", 4], ["sprawdzenie", 1]]), c);
  ok("K2 odtwarzacz pokazuje powtórkę/pytanie, a nie „Najważniejsze z tematu” ani czytanie", /Sprawdzenie|Pytanie|Fiszk|Rewanż/i.test(ekran) && !/Najważniejsze z tematu|Czytaj dalej/.test(ekran), ekran.slice(0, 200));
  await shot(p, "k2-wracam-odtwarzacz-390-jasny");
  // Całe przejście: liczba pytań w odtwarzaczu (≈ 3 minuty, nie 1 pytanie), bez ekranów czytania.
  const pyt = new Set(); let czyt = false;
  for (let i = 0; i < 20; i++) {
    const st = await p.evaluate(() => ({ q: document.querySelector(".lp-card h2, .lp-q, .lp-body h2, .lp-card .q")?.innerText || document.querySelector(".lp-opts")?.closest("section,div")?.innerText?.split("\n")[1] || "", opts: document.querySelectorAll(".lp-opts .opt").length, txt: document.body.innerText, done: !!document.querySelector(".lp-done-screen") }));
    if (st.done) break;
    if (/Czytaj dalej|Najważniejsze z tematu/.test(st.txt)) czyt = true;
    if (st.opts) { pyt.add(st.q || String(i)); await p.locator(".lp-opts .opt").first().click().catch(() => {}); await p.waitForTimeout(250); }
    await p.locator(".lp-cta").click({ timeout: 3000 }).catch(() => {}); await p.waitForTimeout(350);
  }
  ok("K2 całe przejście karty powrotu: 5 pytań (4 + 1) ze znanego tematu, bez czytania nowego materiału", pyt.size === 5 && !czyt, { n: pyt.size, czyt });
  await p.close();
  const q = await open(b, { prog: { ...P5, done: {}, seen: [] }, ls: PR });
  const k = await karta(q);
  ok("K2 bez żadnego znanego tematu: uczciwie „Wracam: 5 minut” i „Zaczniemy spokojnie od jednego krótkiego tematu.”", k && k.btn[0] === "Wracam: 5 minut" && /Zaczniemy spokojnie/.test(k.lekko), k);
  await q.close();
}
try { const out = execSync("node --test tests/lekcja-dnia.test.js tests/nawyk.test.js", { cwd: ROOT, encoding: "utf8" }); const m = out.match(/ℹ pass (\d+)[\s\S]*ℹ fail (\d+)/); ok("K2/K3 testy jednostkowe (lekcja-dnia: przerwaDni, kartaPowrotu; nawyk: naprawa)", m && +m[2] === 0, m?.[0]); R.dodatkowe.push("## node --test tests/lekcja-dnia.test.js tests/nawyk.test.js", "```", out.split("\n").filter((l) => /powrót|naprawa|ℹ (tests|pass|fail)/.test(l)).join("\n"), "```"); }
catch (e) { ok("K2/K3 testy jednostkowe", false, String(e.stdout || e).slice(-300)); }

// ---------- K3: seria 12 spadła (3 opuszczone dni) → wiersz naprawy; 2 dni z XP → 14 i baner; raz na 30 dni
{
  const P12 = { xp: { t: 900, d: T - 4, n: 20 }, streak: { d: T - 4, n: 12 }, nd: [T - 15, T - 14, T - 13, T - 12, T - 11, T - 10, T - 9, T - 8, T - 7, T - 6, T - 5, T - 4], streakBest: 12 };
  let p = await open(b, { prog: P12, ls: PR, czas: "2026-11-06T10:00:00+01:00" });
  let k = await karta(p);
  const pl0 = await pill(p);
  ok("K3 seria 12 spadła po 3 dniach: wiersz „Seria 12 dni do odzyskania: ucz się dziś i jutro…” z postępem 0/2, pigułka spokojna (strata i naprawa tylko w karcie), nic poza ekranem", k && k.nap === "Seria 12 dni do odzyskania: ucz się dziś i jutro (wystarczy krótka karta), a wróci." && !/koniec serii|odzyskaj/.test(pl0) && (await pozaEkranem(p, "#main .greet *")).length === 0 && !/koniec serii/.test(pl0), { k, pl0 });
  await shot(p, "k3-naprawa-wiersz-390-jasny");
  R.pomiary.push(await pomiar(p, "Karta powrotu z naprawą 390", "#main .nw-powrot", "#main .nw-powrot"));
  await p.evaluate(() => window.ZD_APP.xpFlush(10)); await p.waitForTimeout(3200);
  const d1 = await p.evaluate(() => ({ s: window.ZD_APP.S.progress.streak, rep: window.ZD_APP.S.progress.streakRepair, ban: document.querySelector(".nw-baner")?.innerText }));
  const pl1 = await pill(p);
  const lin = await p.evaluate(() => window.ZD_NAWYK.naprawaLinia()?.innerText);
  ok("K3 dzień 1 naprawy: seria 1, streakRepair zapisany, baner naprawy, pigułka „· jutro seria wróci do 14 dni”, wiersz dla ekranu końca „Naprawa serii: 1/2…”", d1.s.n === 1 && d1.rep?.n === 12 && d1.rep.dni.length === 1 && /ucz się dziś i jutro/.test(d1.ban || "") && /jutro seria wróci do 14 dni/.test(pl1) && /Naprawa serii: 1\/2\. Jutro wróci seria 14 dni\./.test(lin || ""), { d1, pl1, lin });
  await p.clock.setFixedTime(new Date("2026-11-07T11:00:00+01:00"));
  await p.reload(); await p.waitForTimeout(2600);
  const pl2 = await pill(p);
  ok("K3 dzień 2 przed nauką: „· odzyskaj 12 dni (1/2)”", /odzyskaj 12 dni \(1\/2\)/.test(pl2 || ""), pl2);
  await p.evaluate(() => window.ZD_APP.xpFlush(10)); await p.waitForTimeout(1600);
  const d2 = await p.evaluate(() => ({ s: window.ZD_APP.S.progress.streak, rep: window.ZD_APP.S.progress.streakRepair, at: window.ZD_APP.S.progress.streakRepairAt, okno: document.querySelector("#layer .nw-odzyskana")?.innerText.replace(/\s+/g, " ") }));
  ok("K3 dzień 2 z XP: seria 14 (n + 2), okno nagrody „Seria odzyskana! 14 dni z rzędu!”, zapisany dzień naprawy", d2.s.n === 14 && !d2.rep && d2.at === T + 1 && /Seria odzyskana!/i.test(d2.okno || "") && /14/.test(d2.okno || ""), d2);
  await shot(p, "k3-seria-odzyskana-390-jasny");
  await p.close();
  p = await open(b, { prog: { ...P12, streakRepairAt: T - 10 }, ls: PR });
  k = await karta(p);
  {
    const q = await open(b, { prog: { ...P12, xp: { t: 920, d: T - 2, n: 5 }, streak: { d: T - 2, n: 1 }, streakRepair: { n: 12, od: T - 2, dni: [T - 2] } }, ls: PR });
    await q.evaluate(() => window.ZD_APP.xpFlush(5)); await q.waitForTimeout(1600);
    const nb = await q.evaluate(() => ({ ban: document.querySelector(".nw-baner")?.innerText, rep: window.ZD_APP.S.progress.streakRepair }));
    ok("K5 nieudana naprawa (dzień 1, przerwa, powrót w 3.) nie przepada po cichu: baner „Naprawa serii 12 dni nie wyszła…”", /Naprawa serii 12 dni nie wyszła/.test(nb.ban || "") && !nb.rep, nb);
    await shot(q, "k5-naprawa-nieudana-390-jasny");
    await q.close();
  }
  ok("K3 naprawa raz na 30 dni: 10 dni po poprzedniej bez wiersza naprawy (zamiast tego jasny komunikat o końcu serii)", k && !/wróci/.test(k.nap || "") && /Seria 12 dni się skończyła/.test(k.nap || ""), k);
  await p.close();
}

// ---------- K4: link z maila (?wracam=1) od razu pokazuje kartę z K1 (także po 1 dniu), bez „Nie ma takiej strony”
{
  const p = await open(b, { prog: { xp: { t: 400, d: T - 1, n: 15 }, streak: { d: T - 1, n: 2 } }, ls: PR, query: "?ld=1&wracam=1", w: 390, h: 844 });
  await p.waitForTimeout(800);
  const r = await p.evaluate(() => { const e = document.querySelector("#main .nw-powrot"); const r = e?.getBoundingClientRect();
    return { jest: !!e, widoczna: !!r && r.top >= 0 && r.bottom <= innerHeight, url: location.search, toast: /Nie ma takiej strony/.test(document.body.innerText), focus: document.activeElement?.classList.contains("nw-powrot-go") }; });
  ok("K4 ?wracam=1: karta powrotu widoczna i w widoku, adres bez parametru, bez „Nie ma takiej strony”", r.jest && r.widoczna && !/wracam/.test(r.url) && !r.toast, r);
  await shot(p, "k4-z-maila-390-jasny");
  await p.reload(); await p.waitForTimeout(2600);
  ok("K4 po przeładowaniu tego samego dnia karta zostaje (skrot-wracam)", !!(await karta(p)));
  await p.evaluate(() => window.ZD_APP.xpFlush(5)); await p.waitForTimeout(400); await p.evaluate(() => window.ZD_APP.render()); await p.waitForTimeout(400);
  ok("K4 po dzisiejszej nauce karta z maila znika", (await karta(p)) === null);
  await p.close();
}
try { const out = execSync("node --test tests/przypomnienia.test.js", { cwd: ROOT, encoding: "utf8" }); ok("K4 mail „powrót”: link /?pz=…&wracam=1#/ (tests/przypomnienia.test.js)", /ℹ fail 0/.test(out), out.slice(-200)); }
catch (e) { ok("K4 tests/przypomnienia.test.js", false, String(e.stdout || e).slice(-300)); }

// ---------- K5: utrata serii nigdy nie jest cicha (komunikat przy pierwszym wejściu)
for (const [w, dark, lang] of [[390, false, "pl"], [390, true, "pl"], [360, false, "en"]]) {
  const tag = `${w}-${dark ? "ciemny" : "jasny"}${lang === "en" ? "-en" : ""}`;
  const p = await open(b, { w, h: 800, dark, lang, prog: { xp: { t: 900, d: T - 7, n: 20 }, streak: { d: T - 7, n: 10 } }, ls: PR });
  const k = await karta(p), pl = await pill(p);
  if (lang === "pl") ok(`K5 ${tag}: od wejścia w karcie powrotu „Seria 10 dni się skończyła. Dziś zaczynasz nową.” (pigułka bez powtarzania)`, !/koniec serii/.test(pl || "") && k && k.nap === "Seria 10 dni się skończyła. Dziś zaczynasz nową.", { pl, k });
  else ok("K5 EN: „Your 10-day streak ended. Today you start a new one.”", (k?.nap || "") === "Your 10-day streak ended. Today you start a new one.", k?.nap);
  await shot(p, `k5-utrata-${tag}`);
  R.pomiary.push(await pomiar(p, `Utrata serii od wejścia ${tag}`, "#main", "#main .nw-powrot"));
  await p.close();
}
// Ruch: wyróżnienie karty z maila, okno nagrody i baner przy reduced-motion i html.calm
for (const [nazwa, o] of [["zwykle", {}], ["reduced-motion", { motion: "reduce" }], ["calm", { calm: true }]]) {
  const p = await open(b, { prog: P5, ls: PR, ...o });
  await p.evaluate(() => window.ZD_NAWYK.oknoOdzyskana(14)); await p.waitForTimeout(150);
  const an = await p.evaluate(() => ({ plomien: getComputedStyle(document.querySelector("#layer .nw-seria-flame")).animationName, liczba: getComputedStyle(document.querySelector("#layer .nw-seria-n")).animationName }));
  await p.keyboard.press("Escape"); await p.waitForTimeout(300);
  await p.evaluate(() => window.ZD_NAWYK.baner("check", "test")); await p.waitForTimeout(50);
  an.baner = await p.evaluate(() => getComputedStyle(document.querySelector(".nw-baner")).animationName);
  R.ruch.push({ nazwa, anim: an });
  if (nazwa !== "zwykle") ok(`ruch wyłączony (${nazwa}): okno nagrody i baner`, an.plomien === "none" && an.liczba === "none" && an.baner === "none", an);
  await p.close();
}
await b.close();
const errs = R.pomiary.flatMap((x) => x.bledy);
ok("konsola bez błędów (wszystkie stany)", errs.length === 0, errs.slice(0, 3));
R.wynik = wynik();
if (DIR) zapiszRaport(DIR, R);
console.log(`${R.wynik.pass}/${R.wynik.pass + R.wynik.fail}`);
process.exit(R.wynik.fail ? 1 : 0);
