// UX-5 etap G3 – odznaki, start, ranga. Kryteria K1–K4 + zrzuty i pomiary do docs/audyt-ux/petla-5/etap-3/runda-R/.
// RUNDA=1 BASE=http://127.0.0.1:8815/ node docs/gry/test/ux5-etap3.mjs
import { execSync } from "child_process";
import { chromium, open, prog, tester, zmierz, zapiszRaport, tekst, polskie, ruch } from "./ux5-lib.mjs";
const R0 = process.env.RUNDA || "0";
const ROOT = new URL("../../../", import.meta.url).pathname;
const DIR = new URL(`../../audyt-ux/petla-5/etap-3/runda-${R0}/`, import.meta.url).pathname;
const T = tester();
const b = await chromium.launch();
const LS = { "mock-v24": "1", "mock-saldo": "100", "mock-vis": "1", "mock-nick": "Bartek" };
const P = (o) => prog({ motywyMig: 1, ...o });
const DZIS = 2500; // dzień z atrapy nie ma znaczenia: postęp „dziś” ustawiamy po wczytaniu (dayN z aplikacji)
const dzis = async (p, f) => { await p.evaluate(f); await p.waitForTimeout(1200); };
const emo = (t) => (t.replace(/©/g, "").match(/\p{Extended_Pictographic}/gu) || []);

// ---------- K1: 5 odznak startowych + odznaki za naukę z poziomami; gry osobno ----------
{
  const p = await open(b, { hash: "/profil", ls: LS, progress: P({}) });
  const t = await tekst(p, ".ux5-odznaki");
  T.ok("K1 sekcja „Na start”: Pierwszy krok, Trzy dni, Pierwsza powtórka, Pierwszy cios, Cel 3 razy", ["Pierwszy krok", "Trzy dni", "Pierwsza powtórka", "Pierwszy cios", "Cel 3 razy"].every((x) => t.includes(x)) && /Na start: 0\/5/.test(t), t.slice(0, 300));
  T.ok("K1 sekcja „Nauka”: Seria, Lekcje, Przedmiot przerobiony, Boss pokonany, Przygotowany, Rekord dnia, Duet tygodnia", ["Seria", "Lekcje", "Przedmiot przerobiony", "Boss pokonany", "Przygotowany", "Rekord dnia", "Duet tygodnia"].every((x) => t.includes(x)), t);
  T.ok("K1 odznaki z gier w osobnej sekcji „Gry” (zwiniętej)", await p.evaluate(() => !!document.querySelector(".ux5-odz-gry summary") && document.querySelectorAll(".ux5-odz-gry .ux5-odz").length >= 6));
  await p.close();
}
{ // zdobywanie z postępu: pierwszy krok, 3 dni, powtórka, lekcja, cel 3 razy, rekord dnia, przygotowany; boss1 z bossa
  const p = await open(b, { hash: "/profil", ls: { ...LS, "mock-boss": "trwa" }, progress: P({}) });
  await dzis(p, () => { const Z = window.ZD_APP, d = Z.dayN(); Z.progSoon({ xp: { t: 400, d, n: 70 }, streak: { d, n: 3 }, done: { A1: 1 }, srs: { k1: [2, d + 3] }, celDni: [d - 2, d - 1, d], exams: { "x:W": { att: [{ pct: 74 }] } } }); });
  await p.waitForTimeout(1500);
  const o = await p.evaluate(() => Object.keys(window.ZD_APP.S.progress.odznaki || {}));
  const want = ["start1", "seria3", "pow1", "lekcje1", "cel3", "rekord60", "przygotowany"];
  T.ok("K1 z postępu przyznane: " + want.join(", "), want.every((x) => o.includes(x)), o);
  T.ok("K1 baner przy zdobyciu (kilka naraz: „Nowe odznaki: N”)", /Odznaka|Nowe odznaki/.test(await p.evaluate(() => [...document.querySelectorAll(".ux5-banner")].map((e) => e.innerText).join(" "))));
  await p.goto(p.url().replace("#/profil", "#/")); await p.waitForTimeout(3000);
  T.ok("K1 „Pierwszy cios” po ciosie w bossa (bsLoad)", await p.evaluate(() => window.ZD_APP.S.progress.odznaki?.boss1 != null));
  await p.close();
}

// ---------- K2: odznaka = przycisk ≥ 44 px, arkusz z nazwą, jak zdobyć, datą, postępem; ZD_NAGRODY.odznaka(id) ----------
{
  const p = await open(b, { hash: "/profil", ls: LS, progress: P({}) });
  await dzis(p, () => { const Z = window.ZD_APP, d = Z.dayN(); Z.progSoon({ xp: { t: 400, d, n: 10 }, streak: { d, n: 5 } }); });
  const male = await p.evaluate(() => [...document.querySelectorAll(".ux5-odz")].filter((e) => { const r = e.getBoundingClientRect(); return r.width && (r.width < 44 || r.height < 44); }).length);
  const btn = await p.evaluate(() => [...document.querySelectorAll(".ux5-odz")].every((e) => e.tagName === "BUTTON"));
  T.ok("K2 każda odznaka to przycisk ≥ 44×44 px", btn && male === 0, { btn, male });
  await p.locator(".ux5-odznaki .ux5-odz", { hasText: "Seria" }).first().click(); await p.waitForTimeout(500);
  const a = await tekst(p, "#layer");
  T.ok("K2 arkusz „Seria”: nazwa, data zdobycia, jak zdobyć, postęp „Seria 5/7”, stopnie", /Seria/.test(a) && /Zdobyta \d/.test(a) && /Ucz się 7 dni z rzędu/.test(a) && /Seria\s*5\/7/.test(a) && /brąz 3 · srebro 7 · złoto 30/.test(a), a);
  await p.screenshot({ path: DIR + "arkusz-seria-390.png" });
  await p.keyboard.press("Escape"); await p.waitForTimeout(2500); // poprzednie banery odznak już zniknęły
  const r = await p.evaluate(() => { const ok1 = window.ZD_NAGRODY.odznaka("duet"), ok2 = window.ZD_NAGRODY.odznaka("duet"); return { ok1, ok2, d: window.ZD_APP.S.progress.odznaki?.duet }; });
  await p.waitForFunction(() => /Duet tygodnia/.test([...document.querySelectorAll(".ux5-banner:not([hidden])")].map((e) => e.innerText).join(" ")), null, { timeout: 9000 }).catch(() => {});
  const ban = await p.evaluate(() => [...document.querySelectorAll(".ux5-banner")].map((e) => e.innerText).join(" "));
  T.ok("K2 ZD_NAGRODY.odznaka(id) przyznaje raz i pokazuje baner „Odznaka: Duet tygodnia”", r.ok1 === true && r.ok2 === false && r.d != null && /Odznaka:\s*Duet tygodnia/.test(ban), { r, ban });
  await p.screenshot({ path: DIR + "baner-odznaki-390.png" });
  T.ok("K2 po przyznaniu siatka odświeżona: kafel „Duet tygodnia” zdobyty (.on)", await p.evaluate(() => [...document.querySelectorAll(".ux5-odz.on")].some((e) => /Duet tygodnia/.test(e.innerText))));
  await p.close();
}

// ---------- K3: 100 monet na start (baza), gablota 3 miejsca, karta „Kup coś za monety z prezentu” ----------
{
  let sql = ""; try { sql = execSync("node supabase/test/pglite.mjs", { cwd: ROOT, encoding: "utf8" }); } catch (e) { sql = String(e.stdout || e); }
  const v60 = sql.split("\n").filter((l) => /V60|v60/.test(l));
  T.ok("K3 PGlite: v60 (start +100 raz przez wyzwalacze na próbie i dostępie, gablota 3, zwrot, nagrody 15/17/20)", v60.filter((l) => /OK V60/.test(l)).length >= 10 && !v60.some((l) => /✗/.test(l)), v60);
  const p = await open(b, { hash: "/shop", ls: LS, progress: P({}) });
  await p.locator(".ux5-prezent").waitFor({ timeout: 8000 }).catch(() => {});
  const k = await tekst(p, ".ux5-prezent");
  T.ok("K3 Sklep przy 100 monetach bez zakupów: „Kup coś za monety z prezentu” (zamrożenie i kolor pseudonimu)", /Kup coś za monety z prezentu/.test(k) && /Zamrożenie serii/.test(k) && /Kolor pseudonimu/.test(k), k);
  T.ok("K3 sklep bez miejsc gabloty do kupienia", !/Gablota: 2\. miejsce|Gablota: 3\. miejsce/.test(await tekst(p)));
  await p.screenshot({ path: DIR + "sklep-prezent-390.png" });
  await p.close();
  const q = await open(b, { hash: "/shop", ls: { ...LS, "mock-saldo": "30" }, progress: P({}) });
  T.ok("K3 przy 30 monetach karty prezentu nie ma", !(await q.locator(".ux5-prezent").count()));
  await q.close();
  // Prezent na start: wpis „start” w historii monet (v60) → raz okno „Prezent na start +100” z przyciskiem do Sklepu
  const MON = JSON.stringify({ start: 0, ksiega: [{ delta: 100, zrodlo: "admin", klucz: "start", opis: "Na start: prezent od Zdawalni", dzien: "2026-11-06" }], pos: [] });
  const st = await open(b, { hash: "/", ls: { ...LS, "mock-saldo": "0", "mock-mon": MON }, progress: P({}), wait: 2000 });
  await st.locator("#layer .ux5-start").waitFor({ timeout: 15000 }).catch(() => {});
  const ok1 = /Prezent na start/i.test(await tekst(st, "#layer")) && /\+100/.test(await tekst(st, "#layer")) && (await st.locator("#layer .btn", { hasText: "Do Sklepu" }).count()) === 1;
  await st.screenshot({ path: DIR + "prezent-na-start-390.png" });
  await st.locator("#layer .btn", { hasText: "Później" }).click().catch(() => {}); await st.reload(); await st.waitForTimeout(5000);
  T.ok("K3 „Prezent na start: +100” widać raz (okno z „Do Sklepu”), po przeładowaniu już nie", ok1 && !/Prezent na start/i.test(await tekst(st, "#layer")), ok1);
  await st.close();
  const g = await open(b, { hash: "/profil", ls: LS, progress: P({}) });
  T.ok("K3 gablota: 3 miejsca bez dopłaty (bez kłódek)", await g.evaluate(() => document.querySelectorAll(".kgab .kgab-slot.is-empty").length === 3 && !document.querySelector(".kgab .kgab-slot.is-lock")));
  await g.close();
}

// ---------- K4: plakietka poziomu w rankingu, nagrody 15–20, „Poziomy i rangi” z SVG ----------
{
  const p = await open(b, { hash: "/ranking", ls: LS, progress: P({}) });
  const n = await p.evaluate(() => [...document.querySelectorAll(".rk-row .rk-lv")].map((e) => e.textContent.trim()));
  T.ok("K4 ranking: plakietka w linii nicku (≤ 24 px wysokości), tytuły ≥ 12 px", await p.evaluate(() => [...document.querySelectorAll(".rk-row .rk-lv")].every((e) => e.getBoundingClientRect().height <= 24) && [...document.querySelectorAll(".rk-row .ktl")].every((e) => parseFloat(getComputedStyle(e).fontSize) >= 12)));
  T.ok("K4 ranking: plakietka poziomu przy nicku (ikona SVG + numer)", n.length >= 2 && await p.evaluate(() => [...document.querySelectorAll(".rk-row .rk-lv")].every((e) => e.querySelector("svg"))), n);
  await p.close();
  const q = await open(b, { hash: "/shop", ls: LS, progress: P({}) });
  await q.evaluate(() => window.ZD_APP.lpLevelsShow()); await q.waitForTimeout(700);
  const t = await tekst(q, "#layer"), lv = await q.evaluate(() => document.querySelector("#layer .lv-list")?.innerText || "");
  T.ok("K4 „Poziomy i rangi”: nagrody na 15 (Platynowa ramka), 17 (Prezes roku), 20 (Ramka Geniusza)", /Platynowa ramka/.test(t) && /Prezes roku/.test(t) && /Ramka Geniusza/.test(t), t.slice(-800));
  T.ok("K4 ikony poziomów: 20 SVG, bez emoji", await q.evaluate(() => document.querySelectorAll("#layer .lv-row .lv-badge svg").length) >= 20 && !emo(lv).length, emo(lv));
  T.ok("K4 zablokowane poziomy: przerywany obrys, bez przezroczystości", await q.evaluate(() => { const e = document.querySelector("#layer .lv-row.lv-next .lv-badge"); const c = getComputedStyle(e); return c.borderStyle === "dashed" && +c.opacity === 1 && +getComputedStyle(e.querySelector(".ico") || e).opacity === 1; }));
  T.ok("K4 nagroda w jednej (najwyżej dwóch) liniach", await q.evaluate(() => [...document.querySelectorAll("#layer .lv-prize")].every((e) => e.getBoundingClientRect().height <= 2.6 * (parseFloat(getComputedStyle(e).lineHeight) || 20))));
  await q.close();
  const r = await open(b, { hash: "/", ls: LS, progress: P({ xp: { t: 50 * 15 * 14 - 5 } }) });
  await r.evaluate(() => window.ZD_APP.xpFlush(10)); await r.waitForTimeout(1500);
  T.ok("K4 awans na 15: okno pokazuje „Nagroda: Platynowa ramka”", /Nagroda: Platynowa ramka/.test(await tekst(r, "#layer")), (await tekst(r, "#layer")).slice(0, 400));
  T.ok("K4 karta nagrody za poziom na pełną szerokość z podglądem ramki (bez łamania po słowie)", await r.evaluate(() => { const k = document.querySelector("#layer .ux5-lv-kosm-k"), t = k?.querySelector(".ux5-lv-kosm-t b"); return !!k?.querySelector("svg") && t && t.getBoundingClientRect().width > 150; }));
  await r.screenshot({ path: DIR + "awans-15-390.png" });
  await r.setViewportSize({ width: 360, height: 640 }); await r.waitForTimeout(300); await r.screenshot({ path: DIR + "awans-15-360.png" });
  await r.close();
}
// EN
{
  const p = await open(b, { hash: "/profil", ls: LS, progress: P({}), lang: "en" });
  const pl = await polskie(p, ".ux5-odznaki");
  T.ok("EN odznaki: bez polskich tekstów", !pl.length, pl);
  await p.locator(".ux5-odz").first().click(); await p.waitForTimeout(400);
  T.ok("EN arkusz odznaki: bez polskich tekstów", !(await polskie(p, "#layer")).length, await polskie(p, "#layer"));
  await p.close();
  const q = await open(b, { hash: "/shop", ls: LS, progress: P({}), lang: "en" });
  T.ok("EN karta prezentu", !(await polskie(q, ".ux5-prezent")).length, await polskie(q, ".ux5-prezent"));
  await q.close();
}
// Ruch
const RUCH = [];
for (const [n, o] of [["zwykle", {}], ["reduced-motion", { motion: "reduce" }], ["calm", { ls: { ...LS, "skrot-calm": "1" } }]]) {
  const p = await open(b, { hash: "/profil", ls: LS, progress: P({}), wait: 1500, ...o });
  if (n === "calm") await p.evaluate(() => document.documentElement.classList.add("calm"));
  await p.locator(".ux5-odz").first().click(); await p.waitForTimeout(80);
  RUCH.push({ n, ...(await ruch(p, ["#layer .modal", ".ux5-odz"])) });
  await p.close();
}
// Zrzuty i pomiary
const EK = [];
const zdob = () => { const Z = window.ZD_APP, d = Z.dayN(); Z.progSoon({ xp: { t: 400, d, n: 70 }, streak: { d, n: 5 }, done: { A1: 1 }, srs: { k1: [2, d + 3] }, celDni: [d - 2, d - 1, d] }); };
for (const [w, hh] of [[360, 640], [390, 844], [1280, 900]]) for (const dark of [false, true]) {
  const p = await open(b, { w, h: hh, dark, hash: "/profil", ls: LS, progress: P({}) }); await dzis(p, zdob); await p.waitForTimeout(1500);
  await p.waitForFunction(() => !document.querySelector(".lp-banner"), null, { timeout: 12000 }).catch(() => {}); // banery odznak są chwilowe: mierzymy ekran po nich
  EK.push(await zmierz(p, DIR, `profil-${w}-${dark ? "ciemny" : "jasny"}`));
  await p.locator(".ux5-odz", { hasText: "Seria" }).first().click(); await p.waitForTimeout(600);
  EK.push(await zmierz(p, DIR, `arkusz-${w}-${dark ? "ciemny" : "jasny"}`, { full: false, root: "#layer", cele: "#layer" }));
  await p.close();
  if (w !== 1280 || !dark) {
    const q = await open(b, { w, h: hh, dark, hash: "/shop", ls: LS, progress: P({}) });
    EK.push(await zmierz(q, DIR, `sklep-${w}-${dark ? "ciemny" : "jasny"}`));
    await q.evaluate(() => window.ZD_APP.lpLevelsShow()); await q.waitForTimeout(700);
    EK.push(await zmierz(q, DIR, `poziomy-${w}-${dark ? "ciemny" : "jasny"}`, { full: false, root: "#layer", cele: "#layer" }));
    await q.close();
    const r = await open(b, { w, h: hh, dark, hash: "/ranking", ls: LS, progress: P({}) });
    EK.push(await zmierz(r, DIR, `ranking-${w}-${dark ? "ciemny" : "jasny"}`));
    await r.close();
  }
}
{
  const p = await open(b, { w: 390, h: 844, hash: "/profil", ls: LS, progress: P({}), lang: "en" }); await dzis(p, zdob);
  EK.push(await zmierz(p, DIR, "profil-390-en"));
  await p.close();
}
await b.close();
const fail = T.end();
zapiszRaport(DIR, `UX-5 etap G3 – odznaki, start, ranga, runda ${R0}`, { ekrany: EK, testy: T.log, ruch: RUCH },
  ["## Ruch (nazwa animacji / czas)", ...RUCH.map((r) => `- ${r.n}: ${Object.entries(r).filter(([k]) => k !== "n").map(([k, v]) => `\`${k}\` ${v}`).join(" · ")}`),
   "", `## Wynik testów: ${T.wynik().pass} ✓ / ${T.wynik().fail} ✗`]);
process.exit(fail ? 1 : 0);
