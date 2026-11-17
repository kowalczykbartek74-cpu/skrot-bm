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
const karta = (p) => p.evaluate(() => { const e = document.querySelector("#main .nw-powrot"); if (!e) return null; const ld = document.querySelector("#main .ld-block, #main .sk-hero");
  return { h: e.querySelector(".nw-powrot-h")?.textContent, pkt: [...e.querySelectorAll(".nw-powrot-pkt li")].map((x) => x.textContent), nap: e.querySelector(".nw-powrot-nap")?.textContent || null,
    btn: [...e.querySelectorAll("button")].map((x) => x.textContent.trim()), stas: !!e.querySelector(".nw-powrot-stas svg, .nw-powrot-stas img, .nw-powrot-stas > *"),
    nadLekcja: !!ld && !!(e.compareDocumentPosition(ld) & Node.DOCUMENT_POSITION_FOLLOWING), top: Math.round(e.getBoundingClientRect().top) }; });
const pill = (p) => p.evaluate(() => document.querySelector("#main .greet .nw-streak")?.innerText.replace(/\s+/g, " ").trim());

// ---------- K1: przerwa 5 dni, dziś bez XP → „Dobrze, że jesteś. Ostatnio 5 dni temu.” nad kartą dnia, Staś, ≤ 3 prawdziwe punkty
const P5 = { xp: { t: 400, d: T - 5, n: 15 }, streak: { d: T - 5, n: 2 }, nd: [T - 6, T - 5] };
for (const [w, hh, dark, lang] of [[390, 844, false, "pl"], [360, 640, false, "pl"], [390, 844, true, "pl"], [1280, 900, false, "pl"], [390, 844, false, "en"]]) {
  const tag = `${w}-${dark ? "ciemny" : "jasny"}${lang === "en" ? "-en" : ""}`;
  const p = await open(b, { w, h: hh, dark, lang, prog: P5, ls: PR });
  const k = await karta(p);
  if (tag === "390-jasny") {
    ok("K1 przerwa 5 dni: „Dobrze, że jesteś. Ostatnio 5 dni temu.” nad kartą dnia, ze Stasiem", k && k.h === "Dobrze, że jesteś. Ostatnio 5 dni temu." && k.nadLekcja && k.stas, k);
    ok("K1 najwyżej 3 punkty i tylko te, które są (liczby > 0)", k && k.pkt.length <= 3 && k.pkt.every((x) => /: [1-9]\d*$/.test(x)) && k.pkt.some((x) => /^Nowe terminy: 1$/.test(x)), k?.pkt);
    ok("K1 jeden przycisk „Wracam: 3 minuty”", k && k.btn.length === 1 && k.btn[0] === "Wracam: 3 minuty", k?.btn);
    R.dodatkowe.push(`Punkty karty powrotu (390 jasny): ${JSON.stringify(k?.pkt)}`);
  }
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
}

// ---------- K2: „Wracam: 3 minuty” → lżejsza karta (lekko: rozgrzewka ≤ 6 + 1 pytanie, bez nowego tematu); trybDnia z przerwaDni
{
  const p = await open(b, { prog: P5, ls: PR });
  const tr = await p.evaluate(() => { const A = window.ZD_APP, k = A.ldKontekst(); return { przerwaDni: k.przerwaDni, tryb: A.LDE.trybDnia(A.ldTematy(), k).tryb }; });
  ok("K2 trybDnia uwzględnia przerwaDni (5) → „lekko”", tr.przerwaDni === 5 && tr.tryb === "lekko", tr);
  await p.click("#main .nw-powrot-go"); await p.waitForTimeout(1500);
  const c = await p.evaluate(() => { const k = window.ZD_APP.ldDay.get().dzien?.karta; return k && { powrot: k.powrot, tryb: k.tryb, nowe: k.nowe, min: k.min, kroki: k.kroki.map((s) => [s.k, s.n]) }; });
  const lp = await p.evaluate(() => !!document.querySelector(".lp-root, .lp, [class*='lp-']") && document.documentElement.classList.contains("lp-lock") || !!document.querySelector(".lp-top, .lp-card"));
  ok("K2 karta powrotu: tryb lekko, bez nowego, 3 min, rozgrzewka 6 + 1 pytanie, odtwarzacz otwarty", c && c.powrot && c.tryb === "lekko" && c.nowe === false && c.min === 3 && JSON.stringify(c.kroki) === JSON.stringify([["rozgrzewka", 6], ["sprawdzenie", 1]]) && lp, { c, lp });
  await shot(p, "k2-wracam-odtwarzacz-390-jasny");
  await p.close();
}
try { const out = execSync("node --test tests/lekcja-dnia.test.js tests/nawyk.test.js", { cwd: ROOT, encoding: "utf8" }); const m = out.match(/ℹ pass (\d+)[\s\S]*ℹ fail (\d+)/); ok("K2/K3 testy jednostkowe (lekcja-dnia: przerwaDni, kartaPowrotu; nawyk: naprawa)", m && +m[2] === 0, m?.[0]); R.dodatkowe.push("## node --test tests/lekcja-dnia.test.js tests/nawyk.test.js", "```", out.split("\n").filter((l) => /powrót|naprawa|ℹ (tests|pass|fail)/.test(l)).join("\n"), "```"); }
catch (e) { ok("K2/K3 testy jednostkowe", false, String(e.stdout || e).slice(-300)); }

// ---------- K3: seria 12 spadła (3 opuszczone dni) → wiersz naprawy; 2 dni z XP → 14 i baner; raz na 30 dni
{
  const P12 = { xp: { t: 900, d: T - 4, n: 20 }, streak: { d: T - 4, n: 12 }, nd: [T - 15, T - 14, T - 13, T - 12, T - 11, T - 10, T - 9, T - 8, T - 7, T - 6, T - 5, T - 4], streakBest: 12 };
  let p = await open(b, { prog: P12, ls: PR, czas: "2026-11-06T10:00:00+01:00" });
  let k = await karta(p);
  ok("K3 seria 12 spadła po 3 dniach: wiersz „Twoja seria 12 dni się przerwała. Zrób dziś i jutro po 5 minut, a wróci.”", k && k.nap === "Twoja seria 12 dni się przerwała. Zrób dziś i jutro po 5 minut, a wróci.", k);
  await shot(p, "k3-naprawa-wiersz-390-jasny");
  R.pomiary.push(await pomiar(p, "Karta powrotu z naprawą 390", "#main .nw-powrot", "#main .nw-powrot"));
  await p.evaluate(() => window.ZD_APP.xpFlush(10)); await p.waitForTimeout(3200);
  const d1 = await p.evaluate(() => ({ s: window.ZD_APP.S.progress.streak, rep: window.ZD_APP.S.progress.streakRepair, ban: document.querySelector(".nw-baner")?.innerText }));
  const pl1 = await pill(p);
  ok("K3 dzień 1 naprawy: seria 1, streakRepair zapisany, baner naprawy, pigułka „· jutro seria wróci do 14 dni”", d1.s.n === 1 && d1.rep?.n === 12 && d1.rep.dni.length === 1 && /Zrób dziś i jutro/.test(d1.ban || "") && /jutro seria wróci do 14 dni/.test(pl1), { d1, pl1 });
  await p.clock.setFixedTime(new Date("2026-11-07T11:00:00+01:00"));
  await p.reload(); await p.waitForTimeout(2600);
  const pl2 = await pill(p);
  ok("K3 dzień 2 przed nauką: „· ucz się dziś: seria wróci do 14 dni”", /ucz się dziś: seria wróci do 14 dni/.test(pl2 || ""), pl2);
  await p.evaluate(() => window.ZD_APP.xpFlush(10)); await p.waitForTimeout(1600);
  const d2 = await p.evaluate(() => ({ s: window.ZD_APP.S.progress.streak, rep: window.ZD_APP.S.progress.streakRepair, at: window.ZD_APP.S.progress.streakRepairAt, ban: document.querySelector(".nw-baner")?.innerText }));
  ok("K3 dzień 2 z XP: seria 14 (n + 2), baner „Seria odzyskana: 14 dni”, zapisany dzień naprawy", d2.s.n === 14 && !d2.rep && d2.at === T + 1 && /Seria odzyskana: 14 dni/.test(d2.ban || ""), d2);
  await shot(p, "k3-seria-odzyskana-390-jasny");
  await p.close();
  p = await open(b, { prog: { ...P12, streakRepairAt: T - 10 }, ls: PR });
  k = await karta(p);
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
  await p.close();
}
try { const out = execSync("node --test tests/przypomnienia.test.js", { cwd: ROOT, encoding: "utf8" }); ok("K4 mail „powrót”: link /?pz=…&wracam=1#/ (tests/przypomnienia.test.js)", /ℹ fail 0/.test(out), out.slice(-200)); }
catch (e) { ok("K4 tests/przypomnienia.test.js", false, String(e.stdout || e).slice(-300)); }

// ---------- K5: utrata serii nigdy nie jest cicha (komunikat przy pierwszym wejściu)
for (const [w, dark, lang] of [[390, false, "pl"], [390, true, "pl"], [360, false, "en"]]) {
  const tag = `${w}-${dark ? "ciemny" : "jasny"}${lang === "en" ? "-en" : ""}`;
  const p = await open(b, { w, h: 800, dark, lang, prog: { xp: { t: 900, d: T - 7, n: 20 }, streak: { d: T - 7, n: 10 } }, ls: PR });
  const k = await karta(p), pl = await pill(p);
  if (lang === "pl") ok(`K5 ${tag}: od wejścia pigułka „koniec serii 10 dni” i w karcie „Seria 10 dni się skończyła. Dziś zaczynasz nową.”`, /koniec serii 10 dni/.test(pl || "") && k && k.nap === "Seria 10 dni się skończyła. Dziś zaczynasz nową.", { pl, k });
  else ok("K5 EN: „Your 10 days streak ended”", /streak ended/.test(k?.nap || ""), k);
  await shot(p, `k5-utrata-${tag}`);
  R.pomiary.push(await pomiar(p, `Utrata serii od wejścia ${tag}`, "#main", "#main .nw-powrot"));
  await p.close();
}
await b.close();
const errs = R.pomiary.flatMap((x) => x.bledy);
ok("konsola bez błędów (wszystkie stany)", errs.length === 0, errs.slice(0, 3));
R.wynik = wynik();
if (DIR) zapiszRaport(DIR, R);
console.log(`${R.wynik.pass}/${R.wynik.pass + R.wynik.fail}`);
process.exit(R.wynik.fail ? 1 : 0);
