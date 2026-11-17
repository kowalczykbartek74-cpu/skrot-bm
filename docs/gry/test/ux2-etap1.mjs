// UX-2 etap 1: seria i cel dnia widoczne na Dziś (kryteria K1–K6 z ~/zdawalni/ux/petla-2.md).
// BASE=http://127.0.0.1:8812/ [RUNDA=1] node docs/gry/test/ux2-etap1.mjs   (RUNDA = zapis zrzutów i raportu rundy)
import { execSync } from "child_process";
import { chromium, open, pomiar, tester, zapiszRaport, katalog, pozaEkranem, animacje, fullShot, dayN, kontrast } from "./ux2-lib.mjs";

const DIR = katalog(1), R = { etap: 1, runda: +(process.env.RUNDA || 0), pomiary: [], zrzuty: [], ruch: [], dodatkowe: [] };
const { ok, wynik } = tester(R);
const shot = async (p, name, full) => { if (!DIR) return; const f = DIR + name + ".png"; if (full) await fullShot(p, f); else await p.screenshot({ path: f }); R.zrzuty.push(name + ".png"); };
const T = dayN("2026-11-06");
// Ranga „Systematyczny poz. 4” = 600–999 XP. Seria 6 dni, ostatnia nauka wczoraj.
const P6 = { xp: { t: 650, d: T - 1, n: 20 }, streak: { d: T - 1, n: 6 }, nd: [T - 7, T - 6, T - 5, T - 3, T - 2, T - 1], streakBest: 9 };
const P6done = { ...P6, xp: { t: 680, d: T, n: 12 }, streak: { d: T, n: 7 }, nd: [...P6.nd, T] };
const b = await chromium.launch();
const pill = (p) => p.evaluate(() => { const e = document.querySelector("#main .greet .nw-streak"); if (!e) return null; const r = e.getBoundingClientRect(), ring = e.querySelector(".nw-ring");
  return { tag: e.tagName, cls: e.className, title: e.title, txt: e.innerText.replace(/\s+/g, " ").trim(), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right),
    ring: ring ? { label: ring.getAttribute("aria-label"), role: ring.getAttribute("role"), w: Math.round(ring.getBoundingClientRect().width), h: Math.round(ring.getBoundingClientRect().height) } : null,
    flameFilter: getComputedStyle(e.querySelector(".h2-flame, .kflame") || e).filter, bg: getComputedStyle(e).backgroundColor, color: getComputedStyle(e).color }; });

// ---------- K1, K2, K4: stany pigułki o 17:00, 19:00, po nauce; 360 i 390 px; jasny/ciemny; EN
for (const [w, hh] of [[360, 640], [390, 844], [1280, 900]]) for (const dark of [false, true]) {
  const tag = `${w}-${dark ? "ciemny" : "jasny"}`;
  let p = await open(b, { w, h: hh, dark, prog: P6 });
  const a = await pill(p);
  if (w !== 1280 && !dark) {
    ok(`K1 ${w}px 17:00: pigułka szara (streak-todo) z title i słowami „· dziś jeszcze nie”`, a && /streak-todo/.test(a.cls) && /· dziś jeszcze nie/.test(a.txt) && a.title === "Ucz się dziś, żeby seria nie spadła" && /grayscale/.test(a.flameFilter), a);
    ok(`K2 ${w}px: pierścień celu 20 px z aria-label „Cel dnia: 0/30 XP”`, a?.ring && a.ring.label === "Cel dnia: 0/30 XP" && a.ring.role === "img" && a.ring.w === 20 && a.ring.h === 20, a?.ring);
    ok(`K3 ${w}px: pigułka to button ≥ 44×44`, a?.tag === "BUTTON" && a.w >= 44 && a.h >= 44, a);
    ok(`K4 ${w}px 17:00: wiersz 1 ranga (z nazwą) + monety, wiersz 2 pasek serii na całą szerokość z celem „0/30”`, await p.evaluate(() => { const rk = document.querySelector("#main .greet .rk"), c = document.querySelector("#main .greet .hud-coin"), s = document.querySelector("#main .greet .nw-streak"), line = document.querySelector("#main .greet .rk-line");
      const a = rk.getBoundingClientRect(), b = c.getBoundingClientRect(), d = s.getBoundingClientRect(), l = line.getBoundingClientRect();
      return Math.round(a.top) === Math.round(b.top) && d.top >= a.bottom && Math.abs(d.width - l.width) < 2 && /Systematy/.test(rk.innerText) && rk.querySelector(".rk-name").getBoundingClientRect().width > 40 && s.querySelector(".nw-goal-t")?.textContent === "0/30 XP"; }));
    ok(`K4 ${w}px 17:00 ranga „Systematyczny poz. 4”: nic poza ekranem`, (await pozaEkranem(p, "#main .greet, #main .greet *")).length === 0 && !(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)), await pozaEkranem(p, "#main .greet *"));
  }
  await shot(p, `dzis-17-${tag}`);
  R.pomiary.push(await pomiar(p, `Dziś 17:00 seria 6 ${tag}`, "#main .greet"));
  await p.close();
  p = await open(b, { w, h: hh, dark, prog: P6, czas: "2026-11-06T19:00:00+01:00" });
  const r = await pill(p);
  const kr = await kontrast(p, "#main .greet .nw-streak");
  if (w !== 1280) {
    ok(`K1 ${tag} 19:00: streak-risk z „· do północy”, kolory --warn/--warn-soft, kontrast AA`, r && /streak-risk/.test(r.cls) && /· do północy/.test(r.txt) && kr.out.length === 0 && kr.n >= 3, { r, kr });
    ok(`K1 ${tag} 19:00: klepsydra przy „do północy” (stan czytelny bez koloru)`, await p.evaluate(() => !!document.querySelector("#main .greet .nw-streak.streak-risk .nw-klep svg")));
    ok(`K4 ${tag} 19:00: nic poza ekranem`, (await pozaEkranem(p, "#main .greet *")).length === 0 && !(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)), await pozaEkranem(p, "#main .greet *"));
  }
  await shot(p, `dzis-19-${tag}`);
  R.pomiary.push(await pomiar(p, `Dziś 19:00 seria 6 ${tag}`, "#main .greet"));
  await p.close();
  p = await open(b, { w, h: hh, dark, prog: P6done, czas: "2026-11-06T19:00:00+01:00" });
  const d = await pill(p);
  if (w !== 1280 && !dark) ok(`K1 ${w}px po nauce: streak-done, pełny płomień, „· dziś ✓”, pierścień „12/30 XP”`, d && /streak-done/.test(d.cls) && !/grayscale/.test(d.flameFilter) && d.ring?.label === "Cel dnia: 12/30 XP" && /· dziś ✓/.test(d.txt) && /12\/30 XP/.test(d.txt), d);
  await shot(p, `dzis-po-nauce-${tag}`);
  R.pomiary.push(await pomiar(p, `Dziś po nauce seria 7 ${tag}`, "#main .greet"));
  // K6: Dziś nie mówi „najdłuższa seria”
  if (w === 390 && !dark) ok("K6 Dziś bez „najdłuższa seria” (seria = tylko dni)", !(await p.evaluate(() => /najdłuższa seria/i.test(document.querySelector("#main").innerText))));
  if (w === 390) await shot(p, `dzis-cala-${tag}`, true);
  await p.close();
}

// ---------- K1: xpFlush (pierwsze XP dnia) zmienia szary płomień na pełny, zapisuje dzień i najlepszą serię
{
  const p = await open(b, { prog: P6 });
  await p.evaluate(() => window.ZD_APP.xpFlush(12));
  await p.waitForTimeout(400);
  const a = await pill(p), pr = await p.evaluate(() => { const x = window.ZD_APP.S.progress; return { streak: x.streak, nd: x.nd, best: x.streakBest, xp: x.xp }; });
  ok("K1 po pierwszym XP dnia: streak-done, seria 7, dzień w progress.nd", /streak-done/.test(a?.cls) && pr.streak.n === 7 && pr.nd.includes(T) && a.ring.label === "Cel dnia: 12/30 XP", { a, pr });
  await p.evaluate(() => window.ZD_APP.xpFlush(25));
  await p.waitForTimeout(300);
  const b2 = await pill(p);
  ok("K2 cel dnia po 37 XP: pierścień pełny (37/30) i „cel ✓”", b2.ring.label === "Cel dnia: 37/30 XP" && /full/.test(await p.evaluate(() => document.querySelector("#main .nw-ring").className)) && /cel ✓/.test(b2.txt), b2);
  await p.close();
  const q = await open(b, { prog: { xp: { t: 100, d: T - 1, n: 5 }, streak: { d: T - 1, n: 9 }, streakBest: 4 } });
  await q.evaluate(() => window.ZD_APP.xpFlush(5)); await q.waitForTimeout(300);
  ok("K3 najlepsza seria (progress.streakBest) rośnie z serią", (await q.evaluate(() => window.ZD_APP.S.progress.streakBest)) === 10);
  await q.close();
}

// ---------- K3: okno „Twoja seria” (seria, kalendarz 4 tygodni, zamrożenia N/2 z przyciskiem do sklepu, najlepsza seria)
for (const [w, hh, dark, lang] of [[390, 844, false, "pl"], [360, 640, false, "pl"], [390, 844, true, "pl"], [1280, 900, false, "pl"], [390, 844, false, "en"]]) {
  const tag = `${w}-${dark ? "ciemny" : "jasny"}${lang === "en" ? "-en" : ""}`;
  const zam = { "mock-v24": "1", "mock-mon": JSON.stringify({ start: 120, ksiega: [], pos: [], zam: { reqs: ["r1", "r2"], dni: ["2026-11-03"] }, zal: {}, gab: [] }) };
  const p = await open(b, { w, h: hh, dark, lang, prog: { ...P6, nd: [T - 7, T - 6, T - 5, T - 2, T - 1] }, czas: "2026-11-06T19:00:00+01:00", ls: zam });
  await p.click("#main .greet .nw-streak"); await p.waitForTimeout(700);
  const m = await p.evaluate(() => { const o = document.querySelector("#layer .nw-okno"); if (!o) return null;
    return { txt: o.innerText.replace(/\s+/g, " "), dni: o.querySelectorAll(".nw-cal .nw-day:not(.mini)").length, nauka: o.querySelectorAll(".nw-cal .s-nauka:not(.mini)").length, zamroz: o.querySelectorAll(".nw-cal .s-zamroz:not(.mini)").length,
      shop: [...o.querySelectorAll("button")].map((x) => x.innerText.trim()), zgodnosc: (() => { const N = window.ZD_NAWYK, p = window.ZD_APP.S.progress, z = window.skrot.sklep.zamrozenia.dni.map((k) => window.ZD_APP.dayN(k)); return [N.L.dniSerii(p, N.L.dniNauki(p, z, N.przerwa), z, N.przerwa), window.ZD_APP.streakN()]; })(), legenda: o.querySelector(".nw-legend").innerText.replace(/\s+/g, " "), labels: [...o.querySelectorAll(".nw-cal .nw-day[aria-label]")].slice(-3).map((x) => x.getAttribute("aria-label")) }; });
  const vis = await p.evaluate(() => { const hd = document.querySelector("#layer .nw-okno-n"), md = document.querySelector("#layer .nw-okno-modal"), r = hd?.getBoundingClientRect(), m = md?.getBoundingClientRect();
    return { top: md?.scrollTop, inView: !!r && !!m && r.top >= m.top && r.bottom <= m.bottom, focus: document.activeElement === hd }; });
  ok(`K3 okno ${tag}: otwiera się od góry, nagłówek serii widoczny i z fokusem (nie „Kup w sklepie”)`, vis.top === 0 && vis.inView && vis.focus, vis);
  if (lang === "pl" && w === 390 && !dark) {
    ok("K3 okno „Twoja seria”: seria 6, kalendarz 28 dni (nauka + zamrożony), „Masz 1/2” z przyciskiem do sklepu, najlepsza seria 9", m && /Twoja seria/i.test(m.txt) && /6 dni z rzędu/.test(m.txt) && m.dni === 28 && m.nauka === 6 && m.zamroz === 1 && /Masz 1\/2/.test(m.txt) && m.shop.includes("Kup w sklepie") && /Najlepsza seria: 9 dni/.test(m.txt), m);
    ok("K3 kalendarz zgadza się z liczbą serii (dni nauki w bieżącej serii = 6), choć progress.nd nie zna jednego dnia", m.zgodnosc[0] === 6 && m.zgodnosc[1] === 6, m.zgodnosc);
    ok("K3 legenda: nauka, zamrożony, przerwa, bez nauki, dziś do zrobienia; jedna linia zasad", /bez nauki/.test(m.legenda) && /dziś (do zrobienia|chroni zamrożenie)/.test(m.legenda) && /spada do 0 o północy/.test(m.txt) && /przerwy w zajęciach nie zrywają serii/.test(m.txt), m.legenda);
    ok("K3 każdy dzień kalendarza ma aria-label", m.labels.length === 3 && m.labels.every((x) => /: /.test(x)), m.labels);
  }
  if (lang === "en") ok("EN okno serii: bez polskich tekstów", m && /Your streak/i.test(m.txt) && /days in a row/.test(m.txt) && /You have 1\/2/.test(m.txt) && /Last 4 weeks/.test(m.txt) && !/[ąćęłńóśźż]/i.test(m.txt), m?.txt);
  await shot(p, `okno-serii-${tag}`);
  R.pomiary.push(await pomiar(p, `Okno „Twoja seria” ${tag}`, "#layer", "#layer"));
  if (lang === "pl" && w === 390 && !dark) {
    await p.click("#layer .nw-zam .btn"); await p.waitForTimeout(800);
    ok("K3 „Kup w sklepie” otwiera Sklep", await p.evaluate(() => window.ZD_APP.S.route.view === "shop"));
  }
  await p.close();
}

// ---------- K5: ekran „Seria +1” (raz dziennie, płomień 64 px, liczba, 7 kropek, kamienie milowe, konfetti tylko przy kamieniu i bez calm/reduced)
for (const [nazwa, o] of [["zwykle", {}], ["reduced-motion", { motion: "reduce" }], ["calm", { calm: true }]]) {
  const p = await open(b, { prog: P6done, ...o });
  const r = await p.evaluate(async () => {
    const N = window.ZD_NAWYK, el = N.ekranSerii(); if (!el) return null;
    const wrap = document.createElement("div"); wrap.id = "nw-test"; wrap.style.cssText = "padding:16px"; wrap.append(el); document.body.prepend(wrap);
    await new Promise((r) => setTimeout(r, 1300));
    const fl = el.querySelector(".nw-seria-flame svg").getBoundingClientRect();
    const out = { n: el.querySelector(".nw-seria-n").textContent, t: el.querySelector(".nw-seria-t").textContent, dots: el.querySelectorAll(".nw-dot").length, nauka: el.querySelectorAll(".nw-dot.s-nauka").length,
      km: el.querySelector(".nw-km")?.textContent || null, jutro: el.querySelector(".nw-jutro")?.textContent, h: el.querySelector(".nw-seria-h")?.textContent, dzisBg: getComputedStyle(el.querySelector(".nw-dot.dzis")).backgroundColor, steps: [...el.querySelectorAll(".nw-step")].map((s) => s.textContent + (s.classList.contains("on") ? "✓" : "")), flame: [Math.round(fl.width), Math.round(fl.height)],
      conf: !!el.querySelector(".nw-conf"), anim: getComputedStyle(el.querySelector(".nw-seria-flame")).animationName, labels: [...el.querySelectorAll(".nw-dot")].every((d) => d.getAttribute("aria-label")),
      drugi: !!N.ekranSerii(), cel: N.celDnia(), jt: el.querySelector(".nw-jutro-t")?.textContent || null };
    return out;
  });
  if (nazwa === "zwykle") {
    ok("K5 ekranSerii(): 7 dni z rzędu, płomień 64 px, 7 kropek z aria-label, kamień milowy 7 z konfetti", r && r.n === "7" && r.t === "dni z rzędu!" && r.h === "Seria przedłużona!" && r.jutro === "Wróć jutro, a seria urośnie do 8 dni." && !/rgba\(0, 0, 0, 0\)/.test(r.dzisBg) && r.dots === 7 && r.nauka === 4 && r.labels && r.flame[0] === 64 && r.km === "Kamień milowy: 7 dni" && r.conf && r.steps.join(",") === "3✓,7✓,14,30,50,100", r);
    ok("K5 zapowiedź jutra: „Jutro: {temat}, 5 min”, gdy jest następny temat", r && (r.jt === null || /^Jutro: .+, 5 min$/.test(r.jt)), r?.jt);
    R.dodatkowe.push(`Ekran „Seria +1”, wiersz jutra: ${r?.jt}`);
    ok("K5 celDnia() → { xp: 12, cel: 30 }", r && r.cel.xp === 12 && r.cel.cel === 30, r?.cel);
    await shot(p, "ekran-seria-plus1-390-jasny");
    R.pomiary.push(await pomiar(p, "Ekran „Seria +1” 390 jasny", "#nw-test", "#nw-test"));
  } else ok(`K5 ${nazwa}: bez konfetti i bez animacji`, r && !r.conf && r.anim === "none", r);
  R.ruch.push({ nazwa, anim: { "nw-seria-flame": r?.anim, konfetti: r?.conf } });
  await p.reload(); await p.waitForTimeout(2200);
  ok(`K5 ${nazwa}: po przeładowaniu ekran nie wraca tego samego dnia`, (await p.evaluate(() => window.ZD_NAWYK.ekranSerii())) === null);
  await p.close();
}
{
  const p = await open(b, { prog: { ...P6done, streak: { d: T, n: 5 } }, dark: true });
  const r = await p.evaluate(async () => { const el = window.ZD_NAWYK.ekranSerii(); const w = document.createElement("div"); w.id = "nw-test"; w.style.cssText = "padding:16px"; w.append(el); document.body.prepend(w); await new Promise((r) => setTimeout(r, 1300)); const dot = el.querySelector(".nw-dot.dzis"); return { km: !!el.querySelector(".nw-km"), conf: !!el.querySelector(".nw-conf"), bg: getComputedStyle(dot).backgroundColor, op: getComputedStyle(dot).opacity }; });
  ok("K5 seria 5 (nie kamień milowy): bez konfetti i bez napisu kamienia", !r.km && !r.conf, r);
  ok("K5 ciemny: dzisiejsza kropka widoczna (kolor nauki, pełna)", r.bg !== "rgba(0, 0, 0, 0)" && r.op === "1", r);
  await shot(p, "ekran-seria-plus1-390-ciemny");
  R.pomiary.push(await pomiar(p, "Ekran „Seria +1” 390 ciemny", "#nw-test", "#nw-test"));
  await p.close();
}
// Uczciwe zasady: zamrożenie w zapasie = spokojny stan „chroni zamrożenie” zamiast alarmu; weekend na 2 zamrożeniach; przerwa
{
  const zam = (reqs) => ({ "mock-v24": "1", "mock-mon": JSON.stringify({ start: 0, ksiega: [], pos: [], zam: { reqs, dni: [] }, zal: {}, gab: [] }) });
  let p = await open(b, { prog: P6, czas: "2026-11-06T19:00:00+01:00", ls: zam(["a1"]) });
  const a = await pill(p);
  ok("K1 19:00 z 1 zamrożeniem: „· ostatnie zamrożenie chroni”, szary płomień, bez alarmu „do północy”, nic poza ekranem", (await pozaEkranem(p, "#main .greet *")).length === 0 && /streak-chroni/.test(a.cls) && /ostatnie zamrożenie chroni/.test(a.txt) && !/północy/.test(a.txt) && /grayscale/.test(a.flameFilter), a);
  await shot(p, "dzis-19-chroni-390-jasny");
  await p.click("#main .greet .nw-streak"); await p.waitForTimeout(700);
  const ok2 = await p.evaluate(() => ({ dzis: document.querySelector("#layer .nw-cal .nw-day.dzis")?.className, leg: document.querySelector("#layer .nw-legend")?.innerText }));
  ok("K3 okno przy zamrożeniu: dzisiejsza kratka „chroni” (niebieska), legenda „dziś chroni zamrożenie”", /chroni/.test(ok2.dzis) && /dziś chroni zamrożenie/.test(ok2.leg), ok2);
  await shot(p, "okno-serii-chroni-390-jasny");
  const db = await p.evaluate(async () => (await window.skrot.sb.rpc("nauka_seria", {})).data?.seria);
  ok("K3 seria w bazie (nauka_seria) = seria w pigułce (6)", db === 6 && (await p.evaluate(() => window.ZD_APP.streakN())) === 6, db);
  R.pomiary.push(await pomiar(p, "Dziś 19:00 chroni zamrożenie 390", "#main .greet"));
  await p.close();
  const PON = "2026-11-09T19:00:00+01:00", t = dayN(PON);
  const PW = { xp: { t: 900, d: t - 3, n: 20 }, streak: { d: t - 3, n: 10 }, nd: [t - 7, t - 6, t - 5, t - 4, t - 3] };
  p = await open(b, { prog: PW, czas: "2026-11-09T10:00:00+01:00", ls: zam(["a1", "a2"]) });
  const rano = await pill(p);
  ok("K3 poniedziałek rano przed nauką: widać, że weekend czeka na zamrożenie („· weekend: zużyje 2 z 2”)", /streak-todo/.test(rano.cls) && /· weekend: zużyje 2 z 2/.test(rano.txt) && rano.h === 44 && (await pozaEkranem(p, "#main .greet *")).length === 0, rano);
  await shot(p, "dzis-pon-rano-zamrozenia-390-jasny");
  R.pomiary.push(await pomiar(p, "Dziś poniedziałek rano, weekend pod zamrożeniem 390", "#main .greet"));
  await p.close();
  p = await open(b, { prog: PW, czas: PON, ls: { ...zam(["a1", "a2"]), "skrot-zam-prezent": "1" } });
  const w0 = await pill(p);
  await p.evaluate(() => window.ZD_APP.xpFlush(12)); await p.waitForTimeout(1500);
  const w1 = await pill(p), stw = await p.evaluate(() => ({ s: window.ZD_APP.S.progress.streak, z: window.skrot.sklep.zamrozenia, ban: document.querySelector(".nw-baner")?.innerText }));
  ok("K3 zasady działają jak w oknie: poniedziałek po weekendzie z 2 zamrożeniami seria 10 żyje, po nauce 11, oba dni zamrożone, baner bez emoji", /^10 dni/.test(w0.txt) && /streak-done/.test(w1.cls) && stw.s.n === 11 && stw.z.ma === 0 && stw.z.dni.length === 2 && /Zamrożenia uratowały serię: 11 dni · zostało 0\/2/.test(stw.ban || "") && !/\p{Extended_Pictographic}/u.test(stw.ban), { w0, stw });
  const pos = await p.evaluate(() => { const r = (q) => document.querySelector(q)?.getBoundingClientRect(); const a = r(".nw-baner"), c = r("#main .zh-go"), g = r("#main .greet"); return a && { a: [a.top, a.bottom], c: c && [c.top, c.bottom], g: [g.top, g.bottom] }; });
  ok("K3 baner nad dolnym paskiem: nie zasłania powitania z serią ani głównego przycisku", pos && pos.a[0] >= pos.g[1] && (!pos.c || pos.a[1] <= pos.c[0] || pos.a[0] >= pos.c[1]), pos);
  await shot(p, "baner-zamrozenia-390-jasny");
  R.pomiary.push(await pomiar(p, "Baner zamrożeń 390", ".nw-baner", ".nw-baner"));
  await p.close();
  p = await open(b, { prog: { xp: { t: 900, d: t - 3, n: 20 }, streak: { d: t - 3, n: 10 } }, czas: PON, ls: zam(["a1"]) });
  ok("K3 ten sam weekend z 1 zamrożeniem: seria spada do 0 (zgodnie z zasadą „do 2 dni”)", /^0\b/.test((await pill(p)).txt));
  await p.evaluate(() => window.ZD_APP.xpFlush(5)); await p.waitForTimeout(1300);
  const kon = await p.evaluate(() => ({ ban: document.querySelector(".nw-baner")?.innerText, z: window.skrot.sklep.zamrozenia.ma, s: window.ZD_APP.S.progress.streak.n }));
  ok("K3 utrata serii nie jest cicha: baner „Seria 10 dni się skończyła…”, zamrożenie niezużyte, seria 1", /Seria 10 dni się skończyła|Seria 10 dni do odzyskania/.test(kon.ban || "") && kon.z === 1 && kon.s === 1, kon);
  await shot(p, "baner-koniec-serii-390-jasny");
  await p.close();
  // błąd sieci przy zamrożeniu: seria zostaje, prośba czeka i przechodzi przy ponowieniu
  p = await open(b, { prog: PW, czas: PON, ls: { ...zam(["a1", "a2"]), "mock-v55-blad": "1", "skrot-zam-prezent": "1" } });
  await p.evaluate(() => window.ZD_APP.xpFlush(12)); await p.waitForTimeout(1200);
  const e1 = await p.evaluate(() => ({ s: window.ZD_APP.S.progress.streak.n, czeka: localStorage.getItem("skrot-zam-czeka"), z: window.skrot.sklep.zamrozenia.ma }));
  await p.evaluate(async () => { localStorage.setItem("mock-v55-blad", ""); await window.ZD_NAWYK.ponow(); }); await p.waitForTimeout(800);
  const e2 = await p.evaluate(() => ({ s: window.ZD_APP.S.progress.streak.n, czeka: localStorage.getItem("skrot-zam-czeka"), z: window.skrot.sklep.zamrozenia.ma }));
  ok("K3 błąd sieci: seria 11 zostaje, prośba czeka; po ponowieniu oba dni zamrożone", e1.s === 11 && /\[310,311\]/.test(e1.czeka || "") && e1.z === 2 && e2.s === 11 && !e2.czeka && e2.z === 0, { e1, e2 });
  await p.close();
  // telefon w innej strefie: do bazy idą dni po kalendarzu warszawskim
  p = await open(b, { prog: PW, czas: "2026-11-10T01:30:00+01:00", ctx: { timezoneId: "America/New_York" }, ls: zam(["a1", "a2"]) });
  await p.evaluate(() => window.ZD_APP.xpFlush(5)); await p.waitForTimeout(1200);
  const iso = await p.evaluate(() => (window.__ux2 || []).find((x) => x.fn === "uzyj_dni")?.dni);
  ok("K3 telefon w Nowym Jorku (9.11 19:30 u niego, w Polsce 10.11): do bazy idą „wczoraj i przedwczoraj” po warszawsku (8.11, 9.11)", iso && iso.join() === "2026-11-08,2026-11-09", iso);
  await p.close();
  // prezent: gdy seria osiąga 2, jedno zamrożenie za darmo z banerem
  p = await open(b, { prog: { xp: { t: 40, d: dayN("2026-11-06") - 1, n: 9 }, streak: { d: dayN("2026-11-06") - 1, n: 1 }, nd: [dayN("2026-11-06") - 1] }, ls: zam([]) });
  await p.evaluate(() => window.ZD_APP.xpFlush(5)); await p.waitForTimeout(5200);
  const pr = await p.evaluate(() => ({ ban: document.querySelector(".nw-baner")?.innerText, z: window.skrot.sklep.zamrozenia.ma }));
  ok("D2 prezent: seria 2 → 1 zamrożenie w prezencie i baner", pr.z === 1 && /zamrożenie serii w prezencie/.test(pr.ban || ""), pr);
  await shot(p, "baner-prezent-390-jasny");
  await p.close();
  const T23 = dayN("2026-12-23");
  p = await open(b, { prog: { xp: { t: 900, d: T23, n: 20 }, streak: { d: T23, n: 8 } }, czas: "2026-12-28T19:00:00+01:00" });
  const pz = await pill(p);
  ok("K3 przerwa świąteczna 28.12: „8 dni · przerwa, seria czeka”, bez alarmu", /streak-pauza/.test(pz.cls) && /^8 dni · przerwa, seria czeka/.test(pz.txt), pz);
  await shot(p, "dzis-przerwa-28-12-390-jasny");
  R.pomiary.push(await pomiar(p, "Dziś w przerwie 28.12 390", "#main .greet"));
  await p.close();
}
// Zmiana stanu w czasie: 17:59 → 18:01 bez przeładowania; godzina liczona w Europe/Warsaw (telefon w innej strefie)
{
  const p = await open(b, { prog: P6, czas: "2026-11-06T17:59:00+01:00" });
  const a = await pill(p);
  await p.clock.setFixedTime(new Date("2026-11-06T18:01:00+01:00"));
  await p.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await p.waitForTimeout(300);
  const b2 = await pill(p);
  ok("K1 17:59 → 18:01 bez przeładowania: todo → risk (odświeżenie co minutę i po powrocie do karty)", /streak-todo/.test(a.cls) && /streak-risk/.test(b2.cls), { a: a.cls, b: b2.cls });
  await p.close();
  const q = await open(b, { prog: P6, czas: "2026-11-06T19:00:00+01:00", ctx: { timezoneId: "America/New_York" } });
  ok("K1 telefon w Nowym Jorku (13:00 u niego): todo — godzina i granica dnia w tej samej strefie", /streak-todo/.test((await pill(q))?.cls), await pill(q));
  await q.close();
}
// EN: pigułka i ekran
{
  const p = await open(b, { prog: P6, lang: "en", czas: "2026-11-06T19:00:00+01:00", w: 360, h: 640 });
  const a = await pill(p);
  ok("EN pigułka 19:00: „· until midnight”, title i pierścień po angielsku, nic poza ekranem", /until midnight/.test(a?.txt) && a.title === "Your streak ends at midnight. 5 minutes is enough." && /Daily goal: 0\/30 XP/.test(a.ring.label) && (await pozaEkranem(p, "#main .greet *")).length === 0, a);
  await shot(p, "dzis-19-360-jasny-en");
  R.pomiary.push(await pomiar(p, "Dziś 19:00 EN 360", "#main .greet"));
  await p.close();
}
// Ruch pigułki: płomień w szarej pigułce stoi; reduced-motion i calm wyłączają animację płomienia.
for (const [nazwa, o] of [["zwykle (po nauce)", {}], ["reduced-motion", { motion: "reduce" }], ["calm", { calm: true }]]) {
  const p = await open(b, { prog: P6done, ...o });
  R.ruch.push({ nazwa: "pigułka " + nazwa, anim: await animacje(p, ["#main .nw-streak .h2-flame svg"]) });
  await p.close();
}
{
  const p = await open(b, { prog: P6 });
  const an = await animacje(p, ["#main .nw-streak .h2-flame svg"]);
  ok("K1 szara pigułka: płomień bez animacji", an["#main .nw-streak .h2-flame svg"] === "none", an);
  await p.close();
}
// Unit testy logiki (node --test)
try { const out = execSync("node --test tests/nawyk.test.js", { cwd: new URL("../../../", import.meta.url).pathname, encoding: "utf8" }); const m = out.match(/# pass (\d+)[\s\S]*# fail (\d+)/) || out.match(/ℹ pass (\d+)[\s\S]*ℹ fail (\d+)/); ok("K5 test jednostkowy tests/nawyk.test.js", m && +m[2] === 0, m?.[0]); R.dodatkowe.push("## node --test tests/nawyk.test.js", "```", out.split("\n").filter((l) => /^(✔|✖|ℹ (tests|pass|fail))/.test(l)).join("\n"), "```"); }
catch (e) { ok("K5 test jednostkowy tests/nawyk.test.js", false, String(e.stdout || e).slice(0, 300)); }

await b.close();
const errs = R.pomiary.flatMap((x) => x.bledy);
ok("konsola bez błędów (wszystkie stany)", errs.length === 0, errs.slice(0, 3));
R.wynik = wynik();
if (DIR) zapiszRaport(DIR, R);
console.log(`${R.wynik.pass}/${R.wynik.pass + R.wynik.fail}`);
process.exit(R.wynik.fail ? 1 : 0);
