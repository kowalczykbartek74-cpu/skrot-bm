// UX-5 etap G1 – ścieżka przedmiotu. Kryteria K1–K4 + zrzuty i pomiary do docs/audyt-ux/petla-5/etap-1/runda-R/.
// RUNDA=1 BASE=http://127.0.0.1:8815/ node docs/gry/test/ux5-etap1.mjs
import { execSync } from "child_process";
import { chromium, open, prog, A, M, tester, zmierz, zapiszRaport, tekst, poziomo, polskie, ruch } from "./ux5-lib.mjs";
const R0 = process.env.RUNDA || "0";
const DIR = new URL(`../../audyt-ux/petla-5/etap-1/runda-${R0}/`, import.meta.url).pathname;
const T = tester();
const b = await chromium.launch();
// A1 zrobiona (bilet), A2 w trakcie (3/6 części), A3 nieruszona. Drugi postęp: cały dział 1 zrobiony (A1 utrwalona, A2 opanowana).
const P1 = prog({ done: { A1: 1 }, mastery: { A1: { ok: true } }, lp: { A2: { b: [3, 6] } } });
const P2 = prog({ done: { A1: 1, A2: 1 }, mastery: { A1: { ok: true }, A2: { ok: true } }, lv: { A1: [1], A2: [1, 2, 3] } });

// K1: wszystkie /subject/* bez poziomego przewijania (darmowe, proba-koniec; 360 i 390)
for (const konto of ["darmowe", "proba-koniec"]) for (const w of [360, 390]) {
  const p = await open(b, { konto, w, h: 800, hash: "/materials", fonts: true });
  const ids = await p.evaluate(() => window.ZD_APP.subjects().map((s) => s.id));
  const zle = [];
  for (const id of ids) { await p.evaluate((id) => { location.hash = "#/subject/" + id; }, id); await p.waitForTimeout(250); const x = await poziomo(p); if (x.poziomo) zle.push([id, x.sw]); }
  T.ok(`K1 ${konto} ${w}px: ${ids.length} przedmiotów bez przewijania w bok`, ids.length > 3 && !zle.length, zle);
  await p.close();
}
// K2: brak „undefined”/„null” na ekranie przedmiotu i materiału (lekcje bez bookRef i sylRef)
{
  const p = await open(b, { hash: "/subject/" + A, progress: P1 });
  const t1 = await tekst(p);
  await p.evaluate(() => { location.hash = "#/material/A1"; }); await p.waitForTimeout(800);
  const t2 = await tekst(p);
  T.ok("K2 przedmiot: bez undefined/null", !/undefined|null/.test(t1), t1.match(/.{0,30}(undefined|null).{0,20}/)?.[0]);
  T.ok("K2 materiał: bez undefined/null", !/undefined|null/.test(t2), t2.match(/.{0,30}(undefined|null).{0,20}/)?.[0]);
  T.ok("K2 bez „rozdz.” przy lekcji bez numeru rozdziału", !/rozdz\./.test(t1 + t2));
  await p.close();
}
// K3: stan słowami, pasek tylko w trakcie, jedna miara przedmiotu
{
  const p = await open(b, { hash: "/subject/" + A, progress: P1 });
  const t = await tekst(p);
  const st = await p.evaluate(() => [...document.querySelectorAll(".sk-path .sk-node:not(.ux5-chest)")].map((li) => ({ t: li.querySelector(".t b")?.textContent, stan: li.querySelector(".sk-state")?.textContent || null, pasek: !!li.querySelector(".sk-doing .pts-mini"), meter: !!li.querySelector(".pts-meter") })));
  T.ok("K3 lekcja 1: „✓ Zrobiona · utrwal w Powtórkach”", st[0]?.stan === "✓ Zrobiona · utrwal w Powtórkach", st[0]);
  T.ok("K3 pasek tylko przy lekcji w trakcie (2), bez starych mierników %", !st[0].pasek && st[1].pasek && !st[2].pasek && st.every((x) => !x.meter), st);
  const hero = await tekst(p, ".sk-hero");
  T.ok("K3 karta przedmiotu: „Opanowanie N%” i „Zrobione lekcje: 1 z 3” i reguła 50/60 + 20", /Opanowanie\s*\d+%/.test(hero) && /Zrobione lekcje: 1 z 3/.test(hero) && /zrobiona liczy się w 50% \(60% ze zdanym biletem\)/.test(hero), hero);
  T.ok("K3 jeden wynik procentowy (Opanowanie) w karcie przedmiotu i na ścieżce", (t.replace(/Opanowanie to średnia[^\n]*/, "").match(/%/g) || []).length === 1, t.match(/.{0,20}%/g));
  T.ok("K3 bez „pkt”, „Lekcje: k z n” i „Umiesz z zakresu” na ekranie przedmiotu", !/\bpkt\b|Lekcje: \d+ z \d|Umiesz z zakresu/.test(t), t.match(/.{0,30}(pkt|Lekcje: \d+ z \d|Umiesz).{0,10}/)?.[0]);
  const p2 = await open(b, { hash: "/subject/" + A, progress: P2 });
  const st2 = await p2.evaluate(() => [...document.querySelectorAll(".sk-path .sk-node:not(.ux5-chest)")].slice(0, 2).map((li) => li.querySelector(".sk-state")?.textContent));
  T.ok("K3 ✓✓ Utrwalona i Opanowana (ikona SVG w kropce)", st2[0] === "✓✓ Utrwalona" && st2[1] === "Opanowana" && await p2.evaluate(() => !!document.querySelectorAll(".sk-path .sk-node")[1].querySelector(".sk-dot svg")), st2);
  const av = [];
  for (const [w, pr] of [[360, prog({})], [390, P2]]) { const q = await open(b, { konto: "darmowe", w, hash: "/subject/" + A, progress: pr }); av.push(await q.evaluate(() => { const d = document.querySelector(".sk-course .sk-node.now .sk-dot"); if (!d) return null; const r = d.getBoundingClientRect(), a = getComputedStyle(d, "::after"); const L = r.left + (a.left === "auto" ? r.width - parseFloat(a.right) - parseFloat(a.width) : parseFloat(a.left)); return { L, R: L + parseFloat(a.width), iw: innerWidth }; })); await q.close(); }
  T.ok("K3 awatar Stasia przy „Teraz” mieści się w ekranie (360, 390)", av.every((x) => !x || (x.L >= 0 && x.R <= x.iw)), av);
  await p.close(); await p2.close();
}
// K4: nagroda za dział z bazy (atrapa v58) raz, po kliknięciu „Odbierz”; SQL w PGlite
{
  const p = await open(b, { hash: "/subject/" + A, progress: P2, wait: 3000 });
  const przed = await p.evaluate(() => ({ rpc: (window.__ux5 || []).length, chest: [...document.querySelectorAll(".ux5-chest")].map((e) => e.innerText) }));
  T.ok("K4 rysowanie ścieżki nie woła odbioru (odbiór tylko przyciskiem)", przed.rpc === 0, przed);
  T.ok("K4 dział 1 zrobiony: przycisk „Odbierz +20” ≥ 44 px", /Odbierz/.test(przed.chest[0]) && await p.evaluate(() => { const r = document.querySelector(".ux5-odbierz").getBoundingClientRect(); return r.height >= 44 && r.width >= 44; }), przed.chest);
  await p.screenshot({ path: DIR + "odbior-1-przed.png" });
  await p.locator(".ux5-odbierz").click(); await p.waitForTimeout(900);
  await p.screenshot({ path: DIR + "odbior-2-po.png" });
  const r = await p.evaluate(() => ({ mon: JSON.parse(localStorage.getItem("mock-mon") || "{}").ksiega || [], chest: [...document.querySelectorAll(".ux5-chest")].map((e) => e.innerText), pop: document.querySelector("#gain-tray")?.innerText || "" }));
  T.ok("K4 po kliknięciu +20 z bazy (wpis misja:dzial:…:1)", r.mon.filter((w) => w.klucz === "misja:dzial:analiza-matematyczna:1" && w.delta === 20).length === 1, r.mon);
  T.ok("K4 skrzynka działu 1: „Dział 1 zaliczony” i „Odebrane”, ikona otwartej skrzynki", /Dział 1 zaliczony/.test(r.chest[0]) && /Odebrane/.test(r.chest[0]) && await p.evaluate(() => document.querySelector(".ux5-chest.ux5-got .sk-dot svg") !== null), r.chest);
  T.ok("K4 bez drugiego dymka „+20” z emoji", !/🪙/.test(r.pop), r.pop);
  T.ok("K4 dział 2 (niezrobiony): „Nagroda za dział 2” i ile zostało", /Nagroda za dział 2/.test(r.chest[1]) && /Lekcje do końca działu: 1/.test(r.chest[1]), r.chest);
  await p.reload(); await p.waitForTimeout(3000);
  const r2 = await p.evaluate(() => ({ n: JSON.parse(localStorage.getItem("mock-mon") || "{}").ksiega.filter((w) => /^misja:dzial:/.test(w.klucz)).length, odb: !!document.querySelector(".ux5-odbierz") }));
  const again = await p.evaluate(() => window.ZD_NAGRODY.rpc("nauka_dzial_nagroda", { p_sid: "analiza-matematyczna", p_unit: "1" }));
  T.ok("K4 po przeładowaniu bez drugiej nagrody i bez przycisku; drugie wywołanie → juz", r2.n === 1 && !r2.odb && again.juz === true, { r2, again });
  T.ok("K4 konsola bez błędów", !p.errors.length, p.errors);
  await p.close();
  const p3 = await open(b, { hash: "/subject/" + A, progress: P2, ls: { "mock-v58": "0" } });
  await p3.locator(".ux5-odbierz").click(); await p3.waitForTimeout(600);
  T.ok("K4 bez v58 w bazie: ścieżka działa, komunikat zamiast nagrody, bez błędów", !p3.errors.length && /Nie udało się/.test(await tekst(p3, ".ux5-chest")), p3.errors);
  await p3.close();
  // Lekcja odhaczona bez biletu: zamiast „Odbierz” od razu informacja, w której lekcji zaliczyć bilet
  const p5 = await open(b, { hash: "/subject/" + A, progress: prog({ done: { A1: 1, A2: 1 }, mastery: { A1: { ok: true } } }) });
  const t5 = await tekst(p5, ".ux5-chest");
  T.ok("K4 lekcja bez zdanego biletu: „Zalicz bilet wyjścia w lekcji 2”, bez przycisku Odbierz", /Zalicz bilet wyjścia w lekcji 2/.test(t5) && !(await p5.evaluate(() => !!document.querySelector(".ux5-odbierz"))), t5);
  await p5.close();
  // Kwota z bazy: atrapa z inną kwotą → skrzynka ją pokazuje; stała w nagrody.js = kwota w SQL v58
  const p6 = await open(b, { hash: "/subject/" + A, progress: P2, ls: { "mock-dzial-monety": "25" }, wait: 3500 });
  T.ok("K4 kwota nagrody z bazy (nauka_dzial_cfg): skrzynka pokazuje +25 przy kwocie 25", /\+25/.test(await tekst(p6, ".ux5-chest")), await tekst(p6, ".ux5-chest"));
  await p6.close();
  { const fs = await import("fs"); const R = new URL("../../../", import.meta.url).pathname;
    const sqlN = +fs.readFileSync(R + "supabase/skrot-v58-nagroda-dzial.sql", "utf8").match(/'monety', (\d+)/)[1], jsN = +fs.readFileSync(R + "nagrody.js", "utf8").match(/DZ_MONETY = (\d+)/)[1];
    T.ok(`K4 zgodność SQL ↔ strona: ${sqlN} = ${jsN}`, sqlN === jsN && sqlN === 20); }
  const p4 = await open(b, { konto: "darmowe", hash: "/subject/" + A });
  T.ok("K4 darmowe: cel w zasięgu „Darmowe lekcje działu: 0/1”", /Darmowe lekcje działu: 0\/1/.test(await tekst(p4, ".ux5-chest")), await tekst(p4, ".ux5-chest"));
  T.ok("K4 darmowe: skrzynka z przyciskiem zakupu ≥ 44 px", await p4.evaluate(() => { const e = document.querySelector(".ux5-chest .btn"); const r = e?.getBoundingClientRect(); return !!e && r.height >= 44; }));
  await p4.close();
  let sql = ""; try { sql = execSync("node supabase/test/pglite.mjs", { cwd: new URL("../../../", import.meta.url).pathname, encoding: "utf8" }); } catch (e) { sql = String(e.stdout || e); }
  const v58 = sql.split("\n").filter((l) => /V58|v58/.test(l));
  T.ok("K4 PGlite: v58 2× + testy D1–D7", v58.filter((l) => /✓ skrot-v58/.test(l)).length === 2 && /✓ test\/v58\.sql/.test(sql) && !v58.some((l) => /✗/.test(l)), v58);
}
// EN
{
  const p = await open(b, { hash: "/subject/" + A, progress: P1, lang: "en" });
  const pl = await polskie(p);
  const t = await tekst(p);
  T.ok("EN: stany i nagroda po angielsku", /Done · lock it in with Reviews/.test(t) && /Mastery/.test(t) && /Lessons done: 1 of 3/.test(t) && /Unit 1 reward/.test(t), t.slice(0, 600));
  const plk = await polskie(p, ".sk-course"), plh = await polskie(p, ".sk-hero");
  T.ok("EN: bez polskich słów w kursie i karcie przedmiotu (poza tytułami lekcji z treści)", ![...plk, ...plh].some((s) => /Zrobiona|Nagroda|lekcji|Opanowanie|Jeszcze|quizie|pytań|pytania|rozdz\.|\bok\.|zaliczony|Odbierz|drogi/.test(s.replace(/\d+\. Lekcja \d+:[^\n]*/g, ""))), [...plk, ...plh]);
  await p.close();
}
// Ruch: wejście węzłów ścieżki znika przy reduced-motion i html.calm
const RUCH = [];
for (const [n, o] of [["zwykle", {}], ["reduced-motion", { motion: "reduce" }], ["calm", { ls: { "skrot-calm": "1" } }]]) {
  const p = await open(b, { hash: "/subject/" + A, progress: P1, wait: 400, ...o });
  if (n === "calm") await p.evaluate(() => document.documentElement.classList.add("calm"));
  RUCH.push({ n, ...(await ruch(p, [".sk-node.now .sk-dot", ".g-path2 .sk-node"])) });
  const q = await open(b, { hash: "/subject/" + A, progress: P2, wait: 2500, ...o }); if (n === "calm") await q.evaluate(() => document.documentElement.classList.add("calm"));
  await q.locator(".ux5-odbierz").click(); await q.waitForTimeout(150);
  RUCH[RUCH.length - 1][".ux5-chest.ux5-fresh .sk-dot (odbiór)"] = await q.evaluate(() => { const e = document.querySelector(".ux5-chest.ux5-fresh .sk-dot"); return e ? getComputedStyle(e).animationName : "brak"; });
  RUCH[RUCH.length - 1]["konfetti przy odbiorze"] = await q.evaluate(() => document.querySelectorAll(".lp-confetti, .lp-conf, [class*=confetti]").length + " elementów");
  await q.close();
  await p.close();
}

// Zrzuty i pomiary
const EK = [];
for (const [w, hh] of [[360, 640], [390, 844], [1280, 900]]) for (const dark of [false, true]) {
  for (const [konto, pr, nm] of [["platne", P1, "w-trakcie"], ["platne", P2, "dzial-zaliczony"], ["darmowe", prog({}), "darmowe"]]) {
    if (konto === "darmowe" && (w === 1280 && dark)) continue;
    const p = await open(b, { konto, w, h: hh, dark, hash: "/subject/" + A, progress: pr, wait: 3200 });
    EK.push(await zmierz(p, DIR, `przedmiot-${nm}-${w}-${dark ? "ciemny" : "jasny"}`));
    await p.close();
  }
}
{
  const p = await open(b, { w: 390, h: 844, hash: "/subject/" + A, progress: P1, lang: "en" });
  EK.push(await zmierz(p, DIR, "przedmiot-w-trakcie-390-en"));
  await p.close();
  const p2 = await open(b, { w: 390, h: 844, hash: "/material/A1", progress: P1 });
  EK.push(await zmierz(p2, DIR, "material-390-jasny"));
  await p2.close();
}
// Przejście: lekcja 2 kończy dział → baner „Dział 1 zaliczony: +20” (atrapa, zdarzenie jak po bilecie)
{
  const p = await open(b, { w: 390, h: 844, hash: "/subject/" + A, progress: prog({ done: { A1: 1 }, mastery: { A1: { ok: true } } }) });
  await p.screenshot({ path: DIR + "przejscie-1-przed.png" });
  await p.evaluate(() => { const Z = window.ZD_APP; Z.progSoon({ done: { ...(Z.S.progress.done || {}), A2: 1 }, mastery: { ...(Z.S.progress.mastery || {}), A2: { ok: true } } }); setTimeout(() => window.ZD_NAGRODY.dzialSprawdz("analiza-matematyczna"), 50); });
  await p.waitForFunction(() => /Dział 1 zaliczony/.test([...document.querySelectorAll(".ux5-banner")].map((e) => e.innerText).join(" ")), null, { timeout: 9000 }).catch(() => {});
  const ban = await p.evaluate(() => [...document.querySelectorAll(".ux5-banner")].map((e) => e.innerText).find((t) => /Dział 1/.test(t)) || "");
  await p.screenshot({ path: DIR + "przejscie-2-baner.png" });
  const karta = await tekst(p, ".sk-hero");
  T.ok("K4 przejście: karta pod banerem już „Zrobione lekcje: 2 z 3”", /Zrobione lekcje: 2 z 3/.test(karta), karta);
  T.ok("K4 przejście: po ostatniej lekcji działu baner „Dział 1 zaliczony! Nagroda czeka na ścieżce: +20”", /Dział 1 zaliczony! Nagroda czeka/.test(ban) && /\+20/.test(ban), ban);
  await p.waitForTimeout(2800); await p.screenshot({ path: DIR + "przejscie-3-po.png", fullPage: true });
  await p.close();
}
await b.close();
const twarde = EK.flatMap((x) => [...x.kontrast.map((k) => `${x.nazwa}: kontrast ${k.cel} ${k.kontrast}`), ...(x.poziomo ? [`${x.nazwa}: przewijanie`] : []), ...x.bledy.map((e) => `${x.nazwa}: konsola ${e.slice(0, 80)}`)]);
const fail = T.end();
zapiszRaport(DIR, `UX-5 etap G1 – ścieżka przedmiotu, runda ${R0}`, { ekrany: EK, testy: T.log, ruch: RUCH, twarde_z_pomiarow: twarde },
  ["## Ruch (nazwa animacji / czas)", ...RUCH.map((r) => `- ${r.n}: ${Object.entries(r).filter(([k]) => k !== "n").map(([k, v]) => `\`${k}\` ${v}`).join(" · ")}`),
   "", `## Wynik testów: ${T.wynik().pass} ✓ / ${T.wynik().fail} ✗`]);
process.exit(fail ? 1 : 0);
