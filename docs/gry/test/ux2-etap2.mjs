// UX-2 etap 2: zasady serii przyjazne studentom (kryteria K1–K6 z ~/zdawalni/ux/petla-2.md).
// BASE=http://127.0.0.1:8812/ [RUNDA=1] node docs/gry/test/ux2-etap2.mjs
import { execSync } from "child_process";
import { chromium, open, pomiar, tester, zapiszRaport, katalog, pozaEkranem, animacje, fullShot, dayN, kontrast } from "./ux2-lib.mjs";

const ROOT = new URL("../../../", import.meta.url).pathname;
const DIR = katalog(2), R = { etap: 2, runda: +(process.env.RUNDA || 0), pomiary: [], zrzuty: [], ruch: [], dodatkowe: [] };
const { ok, wynik } = tester(R);
const shot = async (p, name, full) => { if (!DIR) return; const f = DIR + name + ".png"; if (full) await fullShot(p, f); else await p.screenshot({ path: f }); R.zrzuty.push(name + ".png"); };
const b = await chromium.launch();
const mon = (reqs, dni = [], saldo = 0, prezent = true) => ({ ...(prezent ? { "skrot-zam-prezent": "1" } : {}), "mock-v24": "1", "mock-mon": JSON.stringify({ start: saldo, ksiega: [], pos: [], zam: { reqs, dni }, zal: {}, gab: [] }) });
const pill = (p) => p.evaluate(() => { const e = document.querySelector("#main .greet .nw-streak"); return e ? { cls: e.className, txt: e.innerText.replace(/\s+/g, " ").trim(), title: e.title } : null; });
const st = (p) => p.evaluate(() => ({ streak: window.ZD_APP.S.progress.streak, zam: window.skrot?.sklep?.zamrozenia, ux2: window.__ux2 || [] }));

// ---------- K1: poniedziałek 9.11.2026, ostatnia nauka piątek 6.11 (seria 10), weekend bez nauki
const PON = "2026-11-09T17:00:00+01:00", T = dayN(PON);
const P10 = { xp: { t: 900, d: T - 3, n: 20 }, streak: { d: T - 3, n: 10 }, nd: [T - 12, T - 11, T - 10, T - 9, T - 8, T - 7, T - 6, T - 5, T - 4, T - 3], streakBest: 10 };
const SW = "2026-12-28T19:30:00+01:00", TS = dayN(SW), T23 = dayN("2026-12-23");
const P8 = { xp: { t: 900, d: T23, n: 20 }, streak: { d: T23, n: 8 }, nd: [T23 - 7, T23 - 6, T23 - 5, T23 - 4, T23 - 3, T23 - 2, T23 - 1, T23] };
{
  const p = await open(b, { prog: P10, czas: PON, ls: mon(["a1", "a2"]) });
  const a = await pill(p);
  ok("K1 weekend + 2 zamrożenia: seria trwa, szary płomień „10 dni”", /streak-todo/.test(a?.cls) && /^10 dni/.test(a.txt), a);
  await shot(p, "k1-pon-2zam-przed");
  await p.evaluate(() => window.ZD_APP.xpFlush(12)); await p.waitForTimeout(1500);
  const s = await st(p), b2 = await pill(p);
  const ban = await p.evaluate(() => document.querySelector(".nw-baner")?.innerText || null);
  ok("K1 po nauce: seria 11, zamrożone sob. i niedz. (jedno wywołanie bazy z 2 dniami), zapas 0", s.streak.n === 11 && s.streak.d === T && /streak-done/.test(b2.cls) && /^11 dni/.test(b2.txt)
    && s.ux2.some((x) => x.fn === "uzyj_dni" && x.dni.join() === "2026-11-07,2026-11-08") && s.zam?.ma === 0 && s.zam.dni.includes("2026-11-07") && s.zam.dni.includes("2026-11-08"), { s, b2 });
  ok("K1 baner „Zamrożenia uratowały serię … zostało 0/2” nad dolnym paskiem (ikona SVG, bez emoji)", /uratowały serię: 11 dni · zostało 0\/2/.test(ban || "") && await p.evaluate(() => { const b = document.querySelector(".nw-baner").getBoundingClientRect(), g = document.querySelector("#main .greet").getBoundingClientRect(); return b.top > g.bottom; }) && !/\p{Extended_Pictographic}/u.test(ban || "") && await p.evaluate(() => !!document.querySelector(".nw-baner svg")), ban);
  await shot(p, "k1-pon-2zam-po-nauce");
  R.pomiary.push(await pomiar(p, "K1 baner zamrożeń 390", ".nw-baner", ".nw-baner"));
  await p.close();
}
{
  const p = await open(b, { prog: P10, czas: PON, ls: mon(["a1"]) });
  const a = await pill(p);
  ok("K1 weekend + 1 zamrożenie: seria spadła (0, bez szarego „10 dni”)", a && /^0 dni/.test(a.txt), a);
  await p.evaluate(() => window.ZD_APP.xpFlush(12)); await p.waitForTimeout(1200);
  const s = await st(p);
  ok("K1 z 1 zamrożeniem po nauce: seria 1, zamrożenie niezużyte", s.streak.n === 1 && s.zam?.ma === 1 && !s.ux2.some((x) => x.fn === "uzyj_dni"), s);
  await p.close();
}
{ // jeden opuszczony dzień (wtorek po niedzieli z nauką) + 1 zamrożenie → seria trwa
  const W = "2026-11-10T12:00:00+01:00", t = dayN(W);
  const p = await open(b, { prog: { xp: { t: 300, d: t - 2, n: 9 }, streak: { d: t - 2, n: 4 }, nd: [t - 5, t - 4, t - 3, t - 2] }, czas: W, ls: mon(["a1"]) });
  await p.evaluate(() => window.ZD_APP.xpFlush(5)); await p.waitForTimeout(1200);
  const s = await st(p);
  ok("K1 1 opuszczony dzień + 1 zamrożenie: seria 5", s.streak.n === 5 && s.zam?.ma === 0, s);
  await p.close();
}
{ // bez v55 w bazie: stara funkcja (wczoraj) dalej działa
  const W = "2026-11-10T12:00:00+01:00", t = dayN(W);
  const p = await open(b, { prog: { xp: { t: 300, d: t - 2, n: 9 }, streak: { d: t - 2, n: 4 } }, czas: W, ls: { ...mon(["a1"]), "mock-v55": "0" } });
  await p.evaluate(() => window.ZD_APP.xpFlush(5)); await p.waitForTimeout(1500);
  const s = await st(p);
  ok("K1 bez v55: stara nauka_zamrozenie_uzyj chroni wczoraj, seria 5", s.streak.n === 5 && s.zam?.ma === 0, s);
  ok("K1 bez v55: brak błędów konsoli", p.errors.length === 0, p.errors);
  await p.close();
}

{ // przeniesione z etapu 1: „zamrożenie chroni (ostatnie)” w jednej linii przy 390 px; „do północy” z zapalonym płomieniem
  const P6 = { xp: { t: 650, d: dayN("2026-11-06") - 1, n: 20 }, streak: { d: dayN("2026-11-06") - 1, n: 6 } };
  let p = await open(b, { prog: P6, czas: "2026-11-06T19:00:00+01:00", ls: mon(["a1"]) });
  const a = await p.evaluate(() => { const e = document.querySelector("#main .greet .nw-streak"); return { txt: e.innerText.replace(/\s+/g, " "), h: Math.round(e.getBoundingClientRect().height), linie: e.querySelector(".nw-risk").getClientRects().length, gora: [...e.querySelectorAll(".nw-s-l > *, .nw-s-r > *")].filter((x) => x.getBoundingClientRect().height).map((x) => Math.round(x.getBoundingClientRect().top + x.getBoundingClientRect().height / 2)) }; });
  ok("Stan „ostatnie zamrożenie chroni” przy 390 px w jednej linii", /ostatnie zamrożenie chroni/.test(a.txt) && a.linie === 1 && Math.max(...a.gora) - Math.min(...a.gora) <= 4, a);
  await shot(p, "chroni-390-jasny"); R.pomiary.push(await pomiar(p, "Chroni 390 jasny", "#main .greet"));
  await p.close();
  p = await open(b, { prog: P6, czas: "2026-11-06T19:00:00+01:00" });
  const f = await p.evaluate(() => getComputedStyle(document.querySelector("#main .greet .nw-streak.streak-risk .h2-flame")).filter);
  ok("Stan „do północy”: płomień zapalony (bez szarości), alarm widać bez najechania", f === "none", f);
  await p.close();
}
{ // runda 2: luka w środku tygodnia (nie „weekend”), piątek „weekend chroniony”, utrata serii widoczna od wejścia, baza = strona przed nauką
  const CZW = "2026-11-19T10:00:00+01:00", t = dayN(CZW); // czwartek, opuszczona środa
  let p = await open(b, { prog: { xp: { t: 300, d: t - 2, n: 9 }, streak: { d: t - 2, n: 5 }, nd: [t - 6, t - 5, t - 4, t - 3, t - 2] }, czas: CZW, ls: mon(["a1"]) });
  let a = await pill(p);
  ok("Luka w środku tygodnia: „· zamrożenia: zużyje 1 z 1” (bez słowa „weekend”)", /· zamrożenia: zużyje 1 z 1/.test(a.txt) && !/weekend/.test(a.txt), a);
  await p.close();
  const PT = "2026-11-13T19:00:00+01:00", tp = dayN(PT);
  p = await open(b, { prog: { xp: { t: 300, d: tp - 1, n: 9 }, streak: { d: tp - 1, n: 5 }, nd: [tp - 4, tp - 3, tp - 2, tp - 1] }, czas: PT, ls: mon(["a1", "a2"]) });
  a = await pill(p);
  ok("Piątek z 2 zamrożeniami: „· weekend chroniony”", /streak-chroni/.test(a.cls) && /· weekend chroniony/.test(a.txt), a);
  await shot(p, "piatek-weekend-chroniony-390-jasny");
  await p.close();
  p = await open(b, { prog: P10, czas: PON, ls: mon(["a1"]) });
  a = await pill(p);
  ok("Weekend z 1 zamrożeniem: od wejścia „0 dni · koniec serii 10 dni” (nie po cichu)", /^0 dni · koniec serii 10 dni/.test(a.txt) && /streak-koniec/.test(a.cls), a);
  await shot(p, "koniec-serii-od-wejscia-390-jasny"); R.pomiary.push(await pomiar(p, "Koniec serii od wejścia 390", "#main .greet"));
  await p.close();
  p = await open(b, { prog: P10, czas: PON, ls: mon(["a1", "a2"]) });
  const db = await p.evaluate(async () => (await window.skrot.sb.rpc("nauka_seria", {})).data);
  ok("K3 baza przed nauką = strona: nauka_seria 10, czeka 2", db?.seria === 10 && db.czeka === 2 && /^10 dni/.test((await pill(p)).txt), db);
  await p.evaluate(() => window.ZD_APP.xpFlush(5)); await p.waitForTimeout(1500);
  const bb = await p.evaluate(() => { const b = document.querySelector(".nw-baner"); return b && { txt: b.innerText.replace(/\s+/g, " "), wTresci: b.classList.contains("w-tresci"), sklep: !!b.querySelector(".nw-baner-sklep") }; });
  ok("Baner po zużyciu ostatnich zamrożeń: w treści pod paskiem (nic nie zasłania) z „Uzupełnij w sklepie”", bb && bb.wTresci && bb.sklep && /zostało 0\/2/.test(bb.txt), bb);
  await shot(p, "baner-uzupelnij-390-jasny"); R.pomiary.push(await pomiar(p, "Baner uzupełnij 390", ".nw-baner", ".nw-baner"));
  await p.close();
  // tydzień w przerwie i okno bez alarmu o północy
  p = await open(b, { prog: P8, czas: SW, ls: mon([]) });
  const wk = await p.evaluate(() => { const e = document.querySelector("#main .greet .nw-tyg"); return { txt: e.innerText.trim(), prz: e.querySelectorAll(".s-przerwa").length, aria: e.getAttribute("aria-label") }; });
  ok("Tydzień w przerwie świątecznej: „Ten tydzień: przerwa”, kropki przerwy, dni w aria-label", wk.txt === "Ten tydzień: przerwa" && wk.prz >= 5 && /przerwa/.test(wk.aria), wk);
  await p.click("#main .greet .nw-streak"); await p.waitForTimeout(600);
  ok("Okno w przerwie: bez zdania o spadku serii o północy", !(await p.evaluate(() => /o północy/.test(document.querySelector("#layer .nw-okno").innerText))));
  await p.close();
  p = await open(b, { prog: { xp: { t: 300, d: dayN("2026-11-11") - 1, n: 9 }, streak: { d: dayN("2026-11-11") - 1, n: 1 }, nd: [dayN("2026-11-11") - 1] }, czas: "2026-11-11T12:00:00+01:00", ls: mon([]) });
  ok("Tydzień z 1 dniem wolnym (11.11): „Ten tydzień: 1/4 dni”", (await p.evaluate(() => document.querySelector("#main .greet .nw-tyg").innerText.trim())) === "Ten tydzień: 1/4 dni");
  await p.close();
}
// ---------- K2 i K6: PGlite (v55 2×, v56 2×, testy Z1–Z9 i D1–D6)
try {
  const out = execSync("node supabase/test/pglite.mjs", { cwd: ROOT, encoding: "utf8", maxBuffer: 32 << 20 });
  const v = (f) => new RegExp("^✓ " + f.replace(/[.]/g, "\\.") + "$", "m").test(out);
  const lines = out.split("\n").filter((l) => /skrot-v5[56]|test\/v5[56]|OK (Z|D)\d|OK v5[56]/.test(l));
  ok("K2 PGlite: skrot-v55 2× + test/v55.sql (Z1–Z9)", (out.match(/^✓ skrot-v55-seria-zamrozenia\.sql$/gm) || []).length === 2 && v("test/v55.sql") && /OK v55: Z1–Z9/.test(out), lines);
  ok("K6 PGlite: skrot-v56 2× + test/v56.sql (D1–D6: samo czytanie nie zużywa zamrożenia)", (out.match(/^✓ skrot-v56-dni-nauki\.sql$/gm) || []).length === 2 && v("test/v56.sql") && /OK v56: D1–D6/.test(out), lines);
  R.dodatkowe.push("## PGlite (v55, v56)", "```", lines.join("\n"), "```");
} catch (e) { ok("K2/K6 PGlite", false, String(e.stdout || e).slice(-400)); }

// ---------- K3: przerwa świąteczna 28.12.2026, ostatnia nauka 23.12 (seria 8)
for (const [w, hh] of [[360, 640], [390, 844], [1280, 900]]) for (const dark of [false, true]) for (const lang of ["pl", "en"]) {
  if (lang === "en" && (dark || w === 1280)) continue;
  const tag = `${w}-${dark ? "ciemny" : "jasny"}${lang === "en" ? "-en" : ""}`;
  const p = await open(b, { w, h: hh, dark, lang, prog: P8, czas: SW, ls: mon([]) });
  const a = await pill(p);
  if (w === 390 && !dark && lang === "pl") {
    const db = await p.evaluate(async () => (await window.skrot.sb.rpc("nauka_seria", {})).data);
    ok("K3 28.12 (przerwa), nauka 23.12: pigułka „8 dni · przerwa, seria czeka”, bez „do północy” mimo 19:30", /streak-pauza/.test(a?.cls) && /^8 dni · przerwa, seria czeka/.test(a.txt) && !/północy/.test(a.txt), a);
    ok("K3 to samo liczy baza (nauka_seria: 8, przerwa)", db?.seria === 8 && db.przerwa === true, db);
    await p.click("#main .greet .nw-streak"); await p.waitForTimeout(600);
    const m = await p.evaluate(() => { const o = document.querySelector("#layer .nw-okno"); return o ? { txt: o.innerText.replace(/\s+/g, " "), prz: o.querySelectorAll(".nw-cal .s-przerwa:not(.mini)").length } : null; });
    ok("K3 okno serii w przerwie: opis „seria czeka” i dni przerwy w kalendarzu", m && /Przerwa w zajęciach: seria czeka/.test(m.txt) && m.prz >= 5, m);
    await shot(p, "k3-okno-przerwa-390-jasny");
    R.pomiary.push(await pomiar(p, "K3 okno serii w przerwie 390 jasny", "#layer", "#layer"));
    await p.keyboard.press("Escape"); await p.waitForTimeout(400);
  }
  if (lang === "en") ok(`K3 EN ${w}: „break, streak paused”`, /break, streak paused/.test(a?.txt || ""), a);
  ok(`K3/K4 ${tag}: nic poza ekranem`, (await pozaEkranem(p, "#main .greet *")).length === 0 && !(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)), await pozaEkranem(p, "#main .greet *"));
  await shot(p, `k3-dzis-przerwa-${tag}`);
  R.pomiary.push(await pomiar(p, `K3 Dziś w przerwie ${tag}`, "#main .greet"));
  await p.close();
}
{ // po przerwie: 7.01.2027 bez nauki od 23.12 → seria nadal żyje; nauka 7.01 → 9 bez zużycia zamrożeń
  const S7 = "2027-01-07T10:00:00+01:00";
  const p = await open(b, { prog: P8, czas: S7, ls: mon(["a1"]) });
  const a = await pill(p);
  await p.evaluate(() => window.ZD_APP.xpFlush(8)); await p.waitForTimeout(1200);
  const s = await st(p);
  ok("K3 7.01 po przerwie: seria 8 widoczna, po nauce 9, zamrożenie niezużyte", /^8\b/.test(a?.txt) && s.streak.n === 9 && s.zam?.ma === 1 && !s.ux2.some((x) => x.fn === "uzyj_dni"), { a, s });
  await p.close();
}

// ---------- K4: „Ten tydzień: k/5 dni” (7 kropek) w rzędzie z rangą, bez nowego bloku
for (const [w, hh, dark, lang] of [[360, 640, false, "pl"], [390, 844, false, "pl"], [390, 844, true, "pl"], [1280, 900, false, "pl"], [360, 640, false, "en"]]) {
  const tag = `${w}-${dark ? "ciemny" : "jasny"}${lang === "en" ? "-en" : ""}`;
  const SR = "2026-11-19T17:00:00+01:00", t = dayN(SR); // czwartek: nauka pon (16), wt (17), śr (18)
  const p = await open(b, { w, h: hh, dark, lang, prog: { xp: { t: 650, d: t - 1, n: 20 }, streak: { d: t - 1, n: 3 }, nd: [t - 3, t - 2, t - 1] }, czas: SR });
  const k = await p.evaluate(() => { const e = document.querySelector("#main .greet .rk-line .nw-tyg"); if (!e) return null; const r = e.getBoundingClientRect();
    return { txt: e.innerText.trim(), dots: e.querySelectorAll(".nw-tyg-dots i").length, nauka: e.querySelectorAll(".nw-tyg-dots i.s-nauka").length, tag: e.tagName, w: Math.round(r.width), h: Math.round(r.height),
      sekcje: document.querySelectorAll("#main > section, #main > div").length, wRzedzie: !!e.closest(".greet") }; });
  if (lang === "pl") ok(`K4 ${tag}: „Ten tydzień: 3/5 dni”, 7 kropek (3 z nauką) w rzędzie z rangą, przycisk ≥ 44 px`, k && k.txt === "Ten tydzień: 3/5 dni" && k.dots === 7 && k.nauka === 3 && k.wRzedzie && k.tag === "BUTTON" && k.h >= 44 && k.w >= 44, k);
  else ok("K4 EN: „This week: 3/5 days”", k && k.txt === "This week: 3/5 days", k);
  ok(`K4 ${tag}: nic poza ekranem`, (await pozaEkranem(p, "#main .greet *")).length === 0 && !(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)), await pozaEkranem(p, "#main .greet *"));
  await shot(p, `k4-tydzien-${tag}`);
  R.pomiary.push(await pomiar(p, `K4 Dziś z „Ten tydzień” ${tag}`, "#main .greet"));
  await p.close();
}

// ---------- K5: kartaZamrozenia() (Sklep, pętla 5) i ofertaZamrozenia() (ekran końca, pętla 3)
const wstaw = (p, fn) => p.evaluate(async (fn) => { const el = window.ZD_NAWYK[fn](); if (!el) return null; const w = document.createElement("div"); w.id = "nw-test"; w.style.cssText = "padding:16px;display:grid;gap:12px"; w.append(el); document.body.prepend(w); await new Promise((r) => setTimeout(r, 300)); return el.innerText.replace(/\s+/g, " ").trim(); }, fn);
for (const [w, hh, dark, lang] of [[390, 844, false, "pl"], [360, 640, false, "pl"], [390, 844, true, "pl"], [390, 844, false, "en"]]) {
  const tag = `${w}-${dark ? "ciemny" : "jasny"}${lang === "en" ? "-en" : ""}`;
  const p = await open(b, { w, h: hh, dark, lang, prog: { xp: { t: 650, d: dayN("2026-11-06") - 1, n: 20 }, streak: { d: dayN("2026-11-06") - 1, n: 5 } }, ls: mon(["a1"], [], 120) });
  const kz = await wstaw(p, "kartaZamrozenia");
  if (tag === "390-jasny") ok("K5 kartaZamrozenia: opis z C2, „Masz 1/2”, przycisk „Kup za 40” z monetą SVG", kz && /Chroni do 2 opuszczonych dni z rzędu\. Nie daje XP ani punktów\./.test(kz) && /Masz 1\/2/.test(kz) && /Kup za 40/.test(kz.replace(/\s+/g, " ")) && await p.evaluate(() => !!document.querySelector("#nw-test .nw-zbuy .h2-coin, #nw-test .nw-zbuy svg")), kz);
  if (lang === "en") ok("K5 EN karta zamrożenia", kz && /Protects up to 2 missed days in a row/.test(kz) && /You have 1\/2/.test(kz) && /Buy for 40/.test(kz), kz);
  await shot(p, `k5-karta-zamrozenia-${tag}`);
  R.pomiary.push(await pomiar(p, `K5 karta zamrożenia ${tag}`, "#nw-test", "#nw-test"));
  if (tag === "390-jasny") {
    await p.click("#nw-test .nw-zbuy"); await p.waitForTimeout(500);
    const m = await p.evaluate(() => document.querySelector("#layer .kbuy")?.innerText.replace(/\s+/g, " ") || null);
    ok("K5 przycisk otwiera istniejące potwierdzenie zakupu (kBuy) z ceną 40", m && /Zamrożenie serii/.test(m) && /40/.test(m), m);
    await shot(p, "k5-kbuy-390-jasny");
    await p.click("#layer .kbuy .btn.primary"); await p.waitForTimeout(1500);
    const kz2 = await p.evaluate(() => { document.querySelector("#nw-test")?.remove(); return null; }) ?? await wstaw(p, "kartaZamrozenia");
    ok("K5 po zakupie: „Masz 2/2” i „Masz komplet” bez przycisku", /Masz 2\/2/.test(kz2 || "") && /Masz komplet/.test(kz2 || "") && !(await p.evaluate(() => !!document.querySelector("#nw-test .nw-zbuy"))), kz2);
  }
  await p.close();
}
{
  const P5 = { xp: { t: 650, d: dayN("2026-11-06"), n: 20 }, streak: { d: dayN("2026-11-06"), n: 5 } };
  const cases = [["seria 5, saldo 120, 0 zamrożeń → karta", P5, mon([], [], 120), true], ["saldo 30 → brak", P5, mon([], [], 30), false], ["ma 1 zamrożenie → brak", P5, mon(["a1"], [], 120), false],
    ["seria 2 → brak", { ...P5, streak: { d: dayN("2026-11-06"), n: 2 } }, mon([], [], 120), false]];
  for (const [n, prog, ls, want] of cases) {
    const p = await open(b, { prog, ls });
    const t = await wstaw(p, "ofertaZamrozenia");
    ok(`K5 ofertaZamrozenia: ${n}`, want ? /Chroń serię: zamrożenie za 40/.test(t || "") && /Kup za 40/.test(t) : t === null, t);
    if (want) {
      await shot(p, "k5-oferta-390-jasny");
      R.pomiary.push(await pomiar(p, "K5 oferta zamrożenia 390 jasny", "#nw-test", "#nw-test"));
      await p.click("#nw-test .nw-oferta .btn.ghost"); await p.waitForTimeout(300);
      const p2 = await open(b, { prog, ls }); await wstaw(p2, "ofertaZamrozenia");
      await p2.click("#nw-test .nw-oferta .btn.primary"); await p2.waitForTimeout(400); await p2.click("#layer .kbuy .btn.primary"); await p2.waitForTimeout(1500);
      ok("K5 po zakupie z oferty: oferta znika (ma 1 zamrożenie)", (await p2.evaluate(() => window.ZD_NAWYK.ofertaZamrozenia())) === null);
      await p2.close();
      ok("K5 „Nie teraz” chowa ofertę (na 7 dni)", (await p.evaluate(() => [!document.querySelector("#nw-test .nw-oferta"), window.ZD_NAWYK.ofertaZamrozenia()])).join() === "true,");
    }
    await p.close();
  }
}

// ---------- K6 (atrapa): dzień z samym czytaniem (XP, 0 pkt) nie zużywa zamrożenia następnego dnia
{
  const t = dayN("2026-11-06");
  const p = await open(b, { prog: { xp: { t: 300, d: t - 1, n: 9 }, streak: { d: t - 1, n: 4 }, nd: [t - 2, t - 1] }, ls: mon(["a1"]) });
  const r = await p.evaluate(async () => (await window.skrot.sb.rpc("nauka_zamrozenie_uzyj_dni", { p_dni: ["2026-11-05"] })).data);
  ok("K6 atrapa: wczoraj samo czytanie (XP, 0 pkt) → „nauka”, zamrożenie zostaje", r?.ok && r.dni[0].wynik === "nauka" && r.zostalo === 1, r);
  await p.evaluate(() => window.ZD_APP.xpFlush(5)); await p.waitForTimeout(1000);
  const s = await st(p);
  ok("K6 nauka dziś po dniu czytania: seria 5, bez wywołania zamrożeń", s.streak.n === 5 && s.zam?.ma === 1 && s.ux2.filter((x) => x.fn === "uzyj_dni").length === 1, s);
  await p.close();
}

// ---------- prezent: jedno zamrożenie za darmo, gdy seria osiąga 2
{
  const t = dayN("2026-11-06");
  const p = await open(b, { prog: { xp: { t: 40, d: t - 1, n: 9 }, streak: { d: t - 1, n: 1 }, nd: [t - 1] }, ls: mon([], [], 0, false) });
  await p.evaluate(() => window.ZD_APP.xpFlush(5)); await p.waitForTimeout(5500);
  const s = await st(p), ban = await p.evaluate(() => document.querySelector(".nw-baner")?.innerText || null);
  ok("Prezent: seria 2 → jedno zamrożenie w prezencie i baner", s.streak.n === 2 && s.zam?.ma === 1 && /zamrożenie serii w prezencie/.test(ban || ""), { s, ban });
  await shot(p, "prezent-baner-390-jasny");
  R.pomiary.push(await pomiar(p, "Baner prezentu 390 jasny", ".nw-baner", ".nw-baner"));
  await p.evaluate(() => window.ZD_APP.xpFlush(5)); await p.waitForTimeout(800);
  ok("Prezent: raz (kolejne XP nie pyta bazy drugi raz)", (await p.evaluate(() => (window.__ux2 || []).filter((x) => x.fn === "prezent").length)) === 1);
  await p.close();
}
// Ruch: baner przy reduced-motion i calm
for (const [nazwa, o] of [["zwykle", {}], ["reduced-motion", { motion: "reduce" }], ["calm", { calm: true }]]) {
  const p = await open(b, { prog: P10, czas: PON, ls: mon(["a1", "a2"]), ...o });
  await p.evaluate(() => window.ZD_APP.xpFlush(12)); await p.waitForTimeout(900);
  const an = await animacje(p, [".nw-baner"]);
  R.ruch.push({ nazwa: "baner " + nazwa, anim: an });
  if (nazwa !== "zwykle") ok(`ruch: baner bez animacji (${nazwa})`, an[".nw-baner"] === "none", an);
  await p.close();
}
await b.close();
const errs = R.pomiary.flatMap((x) => x.bledy);
ok("konsola bez błędów (wszystkie stany)", errs.length === 0, errs.slice(0, 3));
R.wynik = wynik();
if (DIR) zapiszRaport(DIR, R);
console.log(`${R.wynik.pass}/${R.wynik.pass + R.wynik.fail}`);
process.exit(R.wynik.fail ? 1 : 0);
