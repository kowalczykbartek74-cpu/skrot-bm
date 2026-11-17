// UX-5 etap G2 – jedna miara (XP) i sensowne monety. Kryteria K1–K5 + zrzuty i pomiary do docs/audyt-ux/petla-5/etap-2/runda-R/.
// RUNDA=1 BASE=http://127.0.0.1:8815/ node docs/gry/test/ux5-etap2.mjs
import fs from "fs";
import { chromium, open, prog, A, tester, zmierz, zapiszRaport, tekst, polskie, ruch } from "./ux5-lib.mjs";
const R0 = process.env.RUNDA || "0";
const ROOT = new URL("../../../", import.meta.url).pathname;
const DIR = new URL(`../../audyt-ux/petla-5/etap-2/runda-${R0}/`, import.meta.url).pathname;
const T = tester();
const b = await chromium.launch();
const LS = { "mock-v24": "1", "mock-saldo": "120", "mock-vis": "1", "mock-nick": "Bartek" };
const xpLv = (n) => 50 * n * (n - 1); // próg poziomu n
const P = (o) => prog({ motywyMig: 1, ...o });
const emo = (t) => (t.replace(/©/g, "").match(/🪙|⚡|🔥/gu) || []);
const czekaj = (p, sel, ms = 8000) => p.locator(sel).first().waitFor({ timeout: ms }).catch(() => {});

// ---------- K1: bez „pkt” na ekranach studenta; ranking „XP w tym tygodniu” ----------
{
  const zle = [];
  for (const hash of ["/subject/" + A, "/shop", "/ranking", "/boss", "/games"]) {
    const p = await open(b, { hash, ls: LS, progress: P({ xp: { t: 650 } }) });
    const t = await tekst(p); const m = t.match(/.{0,25}\bpkt\b.{0,15}/g); if (m) zle.push([hash, m]);
    if (hash === "/ranking") T.ok("K1 ranking podpisany „XP w tym tygodniu”", /XP w tym tygodniu/.test(t), t.slice(0, 400));
    await p.close();
  }
  // Hasło po grze (wygrana w pierwszej próbie: słowo z atrapy „Revenue”)
  const p = await open(b, { hash: "/haslo", ls: LS, progress: P({ streak: { n: 2, d: 0 } }) });
  await czekaj(p, ".hd-board");
  await p.evaluate(() => { const Z = window.ZD_APP; Z.progSoon({ streak: { d: Z.dayN() - 1, n: 2 }, xp: { t: 100, d: Z.dayN() - 1, n: 30 } }); }); await p.waitForTimeout(200);
  const przed = await p.evaluate(() => ({ xp: window.ZD_APP.S.progress?.xp?.t || 0, seria: window.ZD_APP.S.progress?.streak }));
  for (const c of "REVENUE") await p.keyboard.press(c); await p.keyboard.press("Enter");
  await czekaj(p, ".hd-end"); await p.waitForTimeout(2500);
  const t = await tekst(p), po = await p.evaluate(() => ({ xp: window.ZD_APP.S.progress?.xp?.t || 0, seria: window.ZD_APP.S.progress?.streak, d: window.ZD_APP.dayN() }));
  const m = t.match(/.{0,25}\bpkt\b.{0,15}/g); if (m) zle.push(["/haslo po grze", m]);
  T.ok("K1 bez „pkt” na Przedmiocie, Sklepie, Rankingu, Bossie, Grach i w Haśle po grze", !zle.length, zle);
  T.ok("K1 Hasło po grze: „+N XP” i seria „Hasło: N dni z rzędu”", /\+\d+ XP/.test(t) && /Hasło: \d+ (dzień|dni) z rzędu/.test(t), t.slice(0, 500));
  // K2: Hasło daje XP i przedłuża główną serię
  T.ok("K2 wygrana w Haśle dodaje XP", po.xp > przed.xp, { przed, po });
  T.ok("K2 samo Hasło przedłuża główną serię: wczoraj 2 → dziś 3", po.seria?.d === po.d && po.seria?.n === 3, { przed: przed.seria, po: po.seria });
  T.ok("K2 Hasło dodaje tyle XP, ile pokazuje („+N XP” = przyrost XP)", (() => { const m = t.match(/\+(\d+) XP/); return m && po.xp - przed.xp === +m[1]; })(), { t: t.match(/\+\d+ XP/)?.[0], d: po.xp - przed.xp });
  const { zrzut } = await import("./ux5-lib.mjs"); await zrzut(p, DIR + "haslo-po-grze-390.png").catch(() => {});
  await p.close();
}
// K2: odbiór bossa dodaje XP
{
  const p = await open(b, { hash: "/", ls: { ...LS, "mock-boss": "pokonany" }, progress: P({}) });
  await czekaj(p, ".bs-claim");
  const x0 = await p.evaluate(() => window.ZD_APP.S.progress?.xp?.t || 0);
  const lab = (await p.locator(".bs-claim").first().textContent().catch(() => "")) || "";
  await p.locator(".bs-claim").first().click().catch(() => {}); await p.waitForTimeout(1200);
  const x1 = await p.evaluate(() => window.ZD_APP.S.progress?.xp?.t || 0);
  T.ok("K2 odbiór bossa: przycisk „Odbierz +N XP” i XP rośnie", /Odbierz \+\d+ XP/.test(lab) && x1 > x0, { lab, x0, x1 });
  await p.close();
}

// ---------- K3: SQL v59 ↔ stałe w index.html; motyw z poziomu zostaje ----------
{
  const sql = fs.readFileSync(ROOT + "supabase/skrot-v59-motywy-ceny.sql", "utf8");
  const cfg = JSON.parse(sql.match(/nauka_motywy_cfg\(\) returns jsonb[\s\S]*?select '(\{[\s\S]*?\})'::jsonb/)[1]);
  const B1 = { pink: [4, 80], sea: [4, 450], bow: [6, 200], noc: [6, 600], meadow: [8, 200], lilia: [9, 350], riwiera: [14, 750], klub: [16, 900] };
  T.ok("K3 SQL v59 = tabela B1 (poziomy i ceny 8 motywów; niewybrane 10/12)", Object.entries(B1).every(([k, [lv, c]]) => cfg[k]?.poziom === lv && cfg[k]?.cena === c) && cfg.pink.poziom_wybor === 10 && cfg.bow.poziom_wybor === 12, cfg);
  const p = await open(b, { hash: "/shop", ls: LS, progress: P({}) });
  const st = await p.evaluate(() => { const Z = window.ZD_APP; return { base: Z.THEME_BASE, choice: Z.THEME_CHOICE, late: Z.THEME_LATE, kat: (window.skrot?.sklep?.katalog || []).filter((x) => x.typ === "motyw").map((x) => [x.theme, x.cena, x.poziom]) }; });
  const zgodne = Object.entries(cfg).every(([k, c]) => st.base[k] === c.poziom && (!c.para || (st.choice[c.poziom]?.includes(k) && st.choice[c.poziom]?.includes(c.para) && st.late[c.poziom] === c.poziom_wybor)));
  T.ok("K3 stałe index.html (THEME_BASE, THEME_CHOICE, THEME_LATE) zgodne z SQL v59", zgodne, st);
  T.ok("K3 katalog w sklepie (atrapa = SQL po v59) ma ceny z tabeli", st.kat.length === 8 && st.kat.every(([t, c, lv]) => cfg[t]?.cena === c && cfg[t]?.poziom === lv), st.kat);
  const t = await tekst(p, "#shop-kat");
  T.ok("K3 karta Kokardki: „Albo wybór na poziomie 6”, Jednorożca: kup za 80 (przy 120 monetach aktywne)", /Albo wybór na poziomie 6/.test(t) && await p.evaluate(() => [...document.querySelectorAll("#shop-pink .btn.primary")].some((x) => /Kup za 80/.test(x.textContent) && !x.disabled)), t.slice(0, 300));
  await p.close();
  // stare progi: poziom 5 (1000 XP) miał Jednorożca (3), Kokardkę i Łąkę (5) → zostają po zmianie progów
  const q = await open(b, { hash: "/shop", ls: LS, progress: prog({ xp: { t: xpLv(5) + 10 } }) });
  const r = await q.evaluate(() => { const Z = window.ZD_APP; return { pink: Z.themeOwned("pink"), bow: Z.themeOwned("bow"), meadow: Z.themeOwned("meadow"), sea: Z.themeOwned("sea"), lilia: Z.themeOwned("lilia"), zp: Z.S.progress.motywyZPoz }; });
  T.ok("K3 motywy zdobyte z poziomu po starych progach zostają (Jednorożec, Kokardka, Łąka), reszta nie", r.pink && r.bow && r.meadow && !r.sea && !r.lilia && r.zp?.bow === 1, r);
  await q.close();
}

// ---------- K4: wybór 1 z 2 na poziomie 4 i 6; niewybrany na 10 / 12 ----------
for (const [lv, a, bb, late] of [[4, "pink", "sea", 10], [6, "bow", "noc", 12]]) {
  const p = await open(b, { hash: "/", ls: LS, progress: P({ xp: { t: xpLv(lv) - 5, d: 1, n: 0 }, ...(lv === 6 ? { motywWybor: { 4: "sea" } } : {}) }) });
  await p.evaluate(() => window.ZD_APP.xpFlush(10)); await p.waitForTimeout(1400);
  const okno = await tekst(p, "#layer");
  const karty = await p.locator("#layer .lvup-wybieram").count();
  T.ok(`K4 awans na ${lv}: dwie karty „Wybieram” (${a} / ${bb})`, karty === 2 && /Drugi: za darmo na poziomie/.test(okno), okno.slice(0, 300));
  if (lv === 4) { await p.screenshot({ path: DIR + "awans-4-wybor-390.png" }); }
  await p.locator("#layer .lvup-wybieram").first().click(); await p.waitForTimeout(500);
  const r = await p.evaluate(([a, bb, lv]) => { const Z = window.ZD_APP; return { w: Z.S.progress.motywWybor?.[lv], a: Z.themeOwned(a), b: Z.themeOwned(bb), lvlB: Z.THEME_SHOP.find((t) => t.id === bb).lvl }; }, [a, bb, lv]);
  T.ok(`K4 wybór ${a}: zapisany, ${a} odblokowany, ${bb} dopiero na poziomie ${late}`, r.w === a && r.a && !r.b && r.lvlB === late, r);
  await p.close();
  const q = await open(b, { hash: "/shop", ls: LS, progress: P({ xp: { t: xpLv(late) + 1 }, motywWybor: lv === 4 ? { 4: a } : { 4: "sea", 6: a } }) });
  T.ok(`K4 poziom ${late}: niewybrany ${bb} odblokowany`, await q.evaluate((bb) => window.ZD_APP.themeOwned(bb), bb));
  await q.close();
}
{ // wybór odłożony: Sklep pokazuje „Wybierz motyw za poziom 4”, karta pary „Wybierz za darmo”
  const p = await open(b, { hash: "/shop", ls: LS, progress: P({ xp: { t: xpLv(4) + 50 } }) });
  T.ok("K4 odłożony wybór: w Sklepie „Wybierz motyw za poziom 4” i „Wybierz za darmo” na kartach pary", /Wybierz motyw za poziom 4/.test(await tekst(p)) && (await p.locator("#shop-pink .btn, #shop-sea .btn").allTextContents()).filter((x) => /Wybierz za darmo/.test(x)).length === 2);
  await p.locator(".ux5-wybor").click(); await p.waitForTimeout(500);
  await p.screenshot({ path: DIR + "sklep-wybor-odlozony-390.png" });
  T.ok("K4 odłożony wybór otwiera okno z dwiema kartami", (await p.locator("#layer .lvup-wybieram").count()) === 2);
  await p.close();
  const q = await open(b, { hash: "/", ls: LS, progress: P({ xp: { t: 0 } }) });
  await q.evaluate(() => window.ZD_APP.lpLevelsShow()); await q.waitForTimeout(500);
  const t = await tekst(q, "#layer");
  T.ok("K4 „Poziomy i rangi”: wybór na 4 i 6, niewybrany na 10 i 12, nagroda najwyżej w 2 liniach", /Wybór: Jednorożec \/ Nocny rejs/.test(t) && /Wybór: Kokardka \/ Nokturn/.test(t)
    && await q.evaluate(() => [...document.querySelectorAll("#layer .lv-prize")].every((e) => e.getBoundingClientRect().height <= 2.6 * (parseFloat(getComputedStyle(e).lineHeight) || 20))) && /Drugi motyw z poziomu 4/.test(t) && /Drugi motyw z poziomu 6/.test(t) && /Motyw Łąka · albo w sklepie/.test(t), t.slice(0, 600));
  await q.close();
}

// ---------- K5: moneta = jedna ikona SVG; bez emoji 🪙 ⚡ 🔥; bez „Do następnej monety” ----------
for (const hash of ["/shop", "/profil", "/ranking"]) {
  const p = await open(b, { hash, ls: LS, progress: P({ xp: { t: 650 }, streak: { n: 4, d: 0 } }) });
  const t = await p.evaluate(() => document.querySelector("#main").innerText);
  const svg = await p.evaluate(() => document.querySelectorAll("#main .ux5-coin svg, #main .ux5-znak-coin svg, #main .shop-bigcoin svg, #main .ux5-ico svg").length);
  T.ok(`K5 ${hash}: bez emoji 🪙 ⚡ 🔥 jako ikon`, !emo(t).length, emo(t));
  if (hash === "/profil") { const t2 = await tekst(p); T.ok("K4 Profil: następna nagroda to wybór na poziomie 6 (nie jeden motyw)", /Poziom 6: wybór Kokardka albo Nokturn/.test(t2), t2.match(/Następna nagroda[^\n]*|Poziom 6[^\n]*/g)); }
  if (hash === "/shop") {
    T.ok("K5 sklep: moneta SVG (saldo, zadania, ceny), bez „Do następnej monety”", svg >= 5 && !/Do następnej monety/.test(t), { svg });
    await p.evaluate(() => window.ZD_APP.lvHowShow()); await p.waitForTimeout(400);
    const l = await p.evaluate(() => document.querySelector("#layer").innerText);
    T.ok("K5 okno „Jak zdobywać XP i monety”: bez emoji monety i XP", !emo(l).length, emo(l));
  }
  await p.close();
}
// K5: okna „Jak zdobywać XP i monety” i „Poziomy i rangi” otwarte z Dziś: bez emoji
{
  const p = await open(b, { hash: "/", ls: LS, progress: P({ xp: { t: 650 } }) });
  await p.evaluate(() => window.ZD_APP.lpLevelsShow()); await p.waitForTimeout(500);
  const a = await p.evaluate(() => document.querySelector("#layer").innerText);
  await p.evaluate(() => window.ZD_APP.lvHowShow()); await p.waitForTimeout(500);
  const l = await p.evaluate(() => document.querySelector("#layer").innerText);
  T.ok("K5 z Dziś: „Poziomy i rangi” i „Jak zdobywać XP i monety” bez emoji 🪙 ⚡ 🔥", !emo(a).length && !emo(l).length, [emo(a), emo(l)]);
  await p.close();
}
// EN
{
  const p = await open(b, { hash: "/shop", ls: LS, progress: P({ xp: { t: xpLv(4) + 50 } }), lang: "en" });
  const pl = await polskie(p);
  T.ok("EN sklep: bez polskich tekstów", !pl.filter((x) => !/Zdawalni|©| zł /.test(x)).length, pl);
  await p.locator(".ux5-wybor").click(); await p.waitForTimeout(400);
  const pl2 = await polskie(p, "#layer");
  T.ok("EN okno wyboru motywu: bez polskich tekstów", !pl2.length, pl2);
  await p.screenshot({ path: DIR + "wybor-390-en.png" });
  await p.close();
  const q = await open(b, { hash: "/ranking", ls: LS, lang: "en" });
  T.ok("EN ranking: „XP this week”", /XP this week/.test(await tekst(q)), (await tekst(q)).slice(0, 300));
  T.ok("K1 wiersze rankingu z jednostką „XP”", await q.evaluate(() => [...document.querySelectorAll(".rk-pkt")].every((e) => /XP$/.test(e.textContent.trim())) && document.querySelectorAll(".rk-pkt").length > 0));
  await q.close();
}
// Ruch: okno awansu (konfetti, wejście) znika przy reduced-motion i html.calm
const RUCH = [];
for (const [n, o] of [["zwykle", {}], ["reduced-motion", { motion: "reduce" }], ["calm", { ls: { ...LS, "skrot-calm": "1" } }]]) {
  const p = await open(b, { hash: "/", ls: LS, progress: P({ xp: { t: xpLv(4) - 5 } }), wait: 1500, ...o });
  if (n === "calm") await p.evaluate(() => document.documentElement.classList.add("calm"));
  await p.evaluate(() => window.ZD_APP.xpFlush(10)); await p.waitForTimeout(450);
  RUCH.push({ n, ...(await ruch(p, ["#layer .modal", "#layer .lvup-burst", ".lp-confetti i"])) });
  await p.close();
}

// ---------- zrzuty i pomiary ----------
const EK = [];
for (const [w, hh] of [[360, 640], [390, 844], [1280, 900]]) for (const dark of [false, true]) {
  for (const [hash, nm, pr] of [["/shop", "sklep", P({ xp: { t: xpLv(4) + 50 } })], ["/ranking", "ranking", P({})], ["/profil", "profil", P({ xp: { t: 650 }, streak: { n: 4, d: 0 } })]]) {
    if (w === 1280 && nm === "profil" && dark) continue;
    const p = await open(b, { w, h: hh, dark, hash, ls: LS, progress: pr, wait: 3000 });
    EK.push(await zmierz(p, DIR, `${nm}-${w}-${dark ? "ciemny" : "jasny"}`));
    await p.close();
  }
  if (w !== 1280) {
    const p = await open(b, { w, h: hh, dark, hash: "/", ls: LS, progress: P({ xp: { t: xpLv(4) - 5 } }), wait: 2000 });
    await p.evaluate(() => window.ZD_APP.xpFlush(10)); await p.waitForTimeout(2600);
    EK.push(await zmierz(p, DIR, `awans-4-${w}-${dark ? "ciemny" : "jasny"}`, { full: false, root: "#layer", cele: "#layer" }));
    await p.close();
  }
}
for (const [hash, nm] of [["/shop", "sklep"], ["/ranking", "ranking"]]) {
  const p = await open(b, { w: 390, h: 844, hash, ls: LS, progress: P({ xp: { t: xpLv(4) + 50 } }), lang: "en" });
  EK.push(await zmierz(p, DIR, `${nm}-390-en`));
  await p.close();
}
{
  const p = await open(b, { w: 390, h: 844, hash: "/", ls: LS, progress: P({ xp: { t: 0 } }) });
  await p.evaluate(() => window.ZD_APP.lpLevelsShow()); await p.waitForTimeout(800);
  EK.push(await zmierz(p, DIR, "poziomy-i-rangi-390-jasny", { full: false, root: "#layer", cele: "#layer" }));
  await p.evaluate(() => { document.querySelector("#layer .scrim")?.click(); window.ZD_APP.lvHowShow(); }); await p.waitForTimeout(800);
  EK.push(await zmierz(p, DIR, "jak-zdobywac-390-jasny", { full: false, root: "#layer", cele: "#layer" }));
  await p.close();
}
await b.close();
const fail = T.end();
zapiszRaport(DIR, `UX-5 etap G2 – jedna miara i sensowne monety, runda ${R0}`, { ekrany: EK, testy: T.log, ruch: RUCH },
  ["## Ruch (nazwa animacji / czas)", ...RUCH.map((r) => `- ${r.n}: ${Object.entries(r).filter(([k]) => k !== "n").map(([k, v]) => `\`${k}\` ${v}`).join(" · ")}`),
   "", `## Wynik testów: ${T.wynik().pass} ✓ / ${T.wynik().fail} ✗`]);
process.exit(fail ? 1 : 0);
