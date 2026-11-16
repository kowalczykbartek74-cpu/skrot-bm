// Pętla UX-1, etap 2: widoczna próba i uczciwe przyciski zakupu (kryteria K1–K6 z ~/zdawalni/ux/petla-1.md).
// BASE=http://127.0.0.1:8811/ node docs/gry/test/ux1-etap2.mjs
import { chromium, page, BASE } from "./lib.mjs";
import { tester, docs as H2DOCS } from "./h2-lib.mjs";
const { ok, end } = tester();
const b = await chromium.launch();
const T0 = "2026-11-17T10:00:00+01:00";
const ready = async (p, sel = "#main .greet") => { await p.waitForSelector(sel, { timeout: 20000 }).catch(() => {}); await p.waitForTimeout(1200); };
async function open(o = {}) {
  const ls = { "mock-docs": JSON.stringify(H2DOCS), "skrot-green": o.dark ? "dark" : "light", "bm-ld-flag": o.ld === false ? "0" : "1", ...(o.ls || {}) };
  const p = await page(b, { konto: o.konto || "darmowe", w: o.w || 390, h: o.h || 844, lang: o.lang || "pl", ls, ctx: o.dark ? { colorScheme: "dark" } : {} });
  await p.clock.setFixedTime(new Date(o.time || T0));
  await p.goto(BASE + "index.html" + (o.hash ? "#" + o.hash : "")); await ready(p, o.sel);
  return p;
}
const kupy = (p) => p.evaluate(() => [...document.querySelectorAll("#main button, #main a")].filter((e) => e.offsetParent && /^Kup dostęp$|^Buy access$/.test(e.textContent.trim())).map((e) => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return { cls: e.className, bg: cs.backgroundColor, col: cs.color, top: Math.round(r.top + scrollY), h: Math.round(r.height), w: Math.round(r.width) }; }));
const rgb = (s) => (s.match(/[\d.]+/g) || []).map(Number);
const L = (c) => c.slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
const cr = (a, b) => { const x = L(rgb(a)), y = L(rgb(b)); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

// ---------- K1: „Kup dostęp” na Dziś ma tło akcentu; najwyżej jeden ----------
for (const konto of ["proba-koniec", "darmowe-bez"]) for (const ld of [true, false]) for (const dark of [false, true]) {
  const p = await open({ konto: konto === "darmowe-bez" ? "proba-koniec" : konto, ld, dark, ls: konto === "darmowe-bez" ? { "skrot-proba-do": "" } : { "skrot-proba-do": "2026-11-14T10:00:00+01:00", "bm-proba-koniec-pokazane": "1" } });
  const k = await kupy(p);
  const tag = `${konto} ${ld ? "z blokiem lekcji" : "bez bloku lekcji"} ${dark ? "ciemny" : "jasny"}`;
  ok(`K1 ${tag}: na Dziś dokładnie jeden „Kup dostęp”`, k.length === 1, k);
  ok(`K1 ${tag}: „Kup dostęp” ma tło akcentu (${dark ? "ciemny akcent" : "#1A7F45"}), nie szarą pigułkę, czytelny tekst, ≥ 44 px`, k.length && k.every((x) => x.bg === (dark ? "rgb(74, 222, 139)" : "rgb(26, 127, 69)") && cr(x.col, x.bg) >= 4.5 && x.h >= 44), k);
  ok(`K1 ${tag}: konsola bez błędów`, !p.errors.length, p.errors);
  await p.close();
}
{
  // Inne zielone przyciski na Dziś (np. panel Stasia) bez zmian: reguła szarego .btn dotyczy dalej przycisków drugorzędnych.
  const p = await open({ konto: "platne" });
  const g = await p.evaluate(() => { const e = [...document.querySelectorAll("#main > :not(.ld-block) .btn:not(.primary)")].find((x) => x.offsetParent); return e ? getComputedStyle(e).backgroundColor : null; });
  ok("K1: drugorzędne przyciski na Dziś dalej szare pigułki (#EDF1EA)", g === null || g === "rgb(237, 241, 234)", g);
  await p.close();
}

// ---------- K2: pigułka „Próba · dzień X z 3 · do …” ----------
const DO = "2026-11-19T17:00:00+01:00"; // czwartek 17:00 → start 16.11 17:00
for (const [time, d, warn] of [["2026-11-17T10:00:00+01:00", 1, false], ["2026-11-18T10:00:00+01:00", 2, false], ["2026-11-19T13:00:00+01:00", 3, true]]) for (const dark of [false, true]) {
  const p = await open({ konto: "proba", time, dark, ls: { "mock-proba-do": DO, ...(warn ? { [`bm-proba-ost-${time.slice(0, 10)}`]: "1" } : {}) } });
  const r = await p.evaluate(() => { const e = document.querySelector(".uxw-proba"); if (!e) return null; const r = e.getBoundingClientRect(), t = e.querySelector(".uxw-pasek-t"), cs = getComputedStyle(e);
    return { txt: e.innerText.replace(/\s+/g, " ").trim(), top: r.top, bottom: r.bottom, h: Math.round(r.height), ih: innerHeight, warn: e.classList.contains("warn"), bg: cs.backgroundColor, col: getComputedStyle(t).color, link: [...e.querySelectorAll("button")].map((x) => ({ t: x.textContent, h: Math.round(x.getBoundingClientRect().height), w: Math.round(x.getBoundingClientRect().width) })) }; });
  const tag = `dzień ${d}${dark ? " ciemny" : ""}`;
  ok(`K2 ${tag}: pigułka „Próba · dzień ${d} z 3 · do czw 17:00” w pierwszym ekranie 390×844`, r && r.txt.startsWith(`Próba · dzień ${d} z 3 · do czw 17:00`) && r.top >= 0 && r.bottom <= r.ih, r);
  ok(`K2 ${tag}: pigułka ≤ 56 px, link „Plany” ≥ 44×44 px`, r && r.h <= 56 && r.link.some((x) => x.t === "Plany" && x.h >= 44 && x.w >= 44), r);
  ok(`K2 ${tag}: ${warn ? "< 24 h: kolor ostrzeżenia" : "bez koloru ostrzeżenia"}, kontrast AA`, r && r.warn === warn && cr(r.col, r.bg) >= 4.5, r);
  await p.close();
}
{
  // < 24 h: raz dziennie arkusz z podsumowaniem i planami (199 zł na górze)
  const time = "2026-11-19T13:00:00+01:00";
  const p = await open({ konto: "proba", time, ls: { "mock-proba-do": DO } });
  const sh = await p.evaluate(() => { const d = document.querySelector(".uxw-ost"); return d && { h2: d.querySelector("h2")?.textContent, txt: d.innerText, plany: [...d.querySelectorAll(".uxw-plan")].map((x) => x.innerText.replace(/\s+/g, " ")), prim: d.querySelectorAll(".btn.primary, .uxw-plan.on").length }; });
  ok("K2 < 24 h: arkusz „Zostało 4 godz. próby” z dwoma planami, 199 zł pierwszy i zaznaczony", sh && sh.h2 === "Zostało 4 godz. próby" && sh.plany.length === 2 && /199 zł/.test(sh.plany[0]) && /35 zł/.test(sh.plany[1]), sh);
  await p.reload(); await ready(p);
  ok("K2 < 24 h: po przeładowaniu tego samego dnia arkusza nie ma", !(await p.locator(".uxw-ost").count()));
  await p.close();
  const p2 = await open({ konto: "proba", time: "2026-11-18T10:00:00+01:00", ls: { "mock-proba-do": DO } });
  ok("K2 > 24 h: bez arkusza", !(await p2.locator(".uxw-ost").count()));
  await p2.close();
}
for (const [konto, ls] of [["platne", {}], ["darmowe", {}], ["proba-koniec", { "bm-proba-koniec-pokazane": "1" }]]) {
  const p = await open({ konto, ls });
  ok(`K2 konto ${konto}: bez pigułki próby`, !(await p.locator(".uxw-proba").count()));
  await p.close();
}
{
  const p = await open({ konto: "proba", lang: "en", time: "2026-11-18T10:00:00+01:00", ls: { "mock-proba-do": DO } });
  const t = await p.locator(".uxw-proba").innerText().catch(() => "");
  ok("K2 EN: „Trial · day 2 of 3 · until Thu 17:00” + „Plans”", /Trial · day 2 of 3 · until Thu 17:00/.test(t.replace(/\s+/g, " ")) && /Plans/.test(t), t);
  await p.close();
}

// ---------- K3: przyciskZakupu(kontekst) ----------
for (const ld of [true, false]) {
  const p = await open({ konto: "darmowe", ld });
  const r = await p.evaluate(() => {
    const vis = [...document.querySelectorAll("#main button")].filter((e) => e.offsetParent);
    const kup = vis.filter((e) => e.textContent.trim() === "Kup dostęp");
    return { kup: kup.map((e) => ({ cls: e.className, obok: !!e.closest(".uxw-zakup")?.querySelector(".uxw-wyprobuj") })), wyprobuj: vis.filter((e) => /^Wypróbuj 3 dni$/.test(e.textContent.trim())).length };
  });
  ok(`K3 darmowe (próba możliwa) ${ld ? "z blokiem" : "bez bloku"}: każdy „Kup dostęp” stoi obok „Wypróbuj 3 dni” (bez samotnego)`, r.kup.every((x) => x.obok), r);
  ok(`K3 darmowe ${ld ? "z blokiem" : "bez bloku"}: jest „Wypróbuj 3 dni” z przyciskZakupu`, r.wyprobuj >= 1, r);
  await p.close();
}
{
  const p = await open({ konto: "darmowe" });
  const r = await p.evaluate(() => ({ s: window.ZD_WEJSCIE?.stan?.(), a: window.ZD_WEJSCIE.przyciskZakupu("test").innerText }));
  ok("K3 API: przyciskZakupu() przy możliwej próbie → „Wypróbuj 3 dni” + „Kup dostęp”", /Wypróbuj 3 dni/.test(r.a) && /Kup dostęp/.test(r.a), r);
  await p.click(".uxw-wyprobuj"); await p.waitForTimeout(3500);
  ok("K3: „Wypróbuj 3 dni” z Dziś włącza próbę", (await p.evaluate(() => localStorage.getItem("mock-konto"))) === "proba");
  await p.close();
  const p2 = await open({ konto: "proba-koniec", ls: { "bm-proba-koniec-pokazane": "1" } });
  const a = await p2.evaluate(() => { const e = window.ZD_WEJSCIE.przyciskZakupu("test"); return { t: e.innerText, prim: !!e.matches?.(".btn.primary") || !!e.querySelector?.(".btn.primary") }; });
  ok("K3 API: po próbie → zielony „Kup dostęp” (pierwszy na ekranie) albo link „Zobacz plany” (kolejne)", /Kup dostęp|Zobacz plany/.test(a.t), a);
  await p2.close();
}
{
  // Kod: trzy miejsca podmienione wyrażeniem z komentarzem // ux-1
  const fs = await import("fs");
  const src = fs.readFileSync(new URL("../../../index.html", import.meta.url), "utf8");
  const n = (src.match(/window\.ZD_WEJSCIE\?\.przyciskZakupu\?\.\("(ld|pts)"\) \?\? h\("button"[^\n]*\/\/ ux-1/g) || []).length;
  ok("K3 kod: 3 wyrażenia przycisku podmienione (ld, pts×2) z komentarzem // ux-1", n === 3, n);
}

// ---------- K4: Ustawienia → Konto i dostęp w próbie ----------
for (const lang of ["pl", "en"]) {
  const p = await open({ konto: "proba", lang, hash: "/ustawienia/konto", sel: "#main", ls: { "mock-proba-do": DO } });
  const t = await p.evaluate(() => document.querySelector("#main")?.innerText || "");
  ok(`K4 ${lang}: konto w próbie: „okres próbny, zostały 2 dni”, bez „do końca 2. semestru”`, lang === "pl" ? /student@x\.pl · okres próbny, zostały 2 dni/.test(t) && !/do końca 2\. semestru/.test(t) : /student@x\.pl · free trial, 2 days left/.test(t) && !/until the end of semester 2/i.test(t), t.match(/student@x\.pl[^\n]*/)?.[0]);
  await p.close();
}
{
  const p = await open({ konto: "platne", hash: "/ustawienia/konto", sel: "#main" });
  ok("K4: konto płatne dalej „do końca 2. semestru”", /student@x\.pl · do końca 2\. semestru/.test(await p.locator("#main").innerText()));
  await p.close();
}

// ---------- K5: błąd startu próby → okno z „Wybierz plan”, „Napisz do nas”, „Zamknij” ----------
for (const [err, re] of [["wykorzystany", /Na tym koncie okres próbny już był\. Twoje postępy z próby czekają\. Dostęp: 199 zł do 11 lipca 2027 albo 35 zł \/ mies\./], ["urzadzenie", /Z tego telefonu ktoś już korzystał z próby\. Jeśli to Twój pierwszy raz, napisz do nas, włączymy ją ręcznie\./]]) {
  const p = await open({ konto: "darmowe", ls: { "mock-proba-blad": err } });
  await p.click(".uxw-pasek-b"); await p.waitForTimeout(600);
  const m = await p.evaluate(() => { const d = document.querySelector(".uxw-blad"); return d && { txt: d.innerText, btn: [...d.querySelectorAll("button, a")].map((x) => ({ t: x.textContent.trim(), prim: x.classList.contains("primary"), href: x.getAttribute("href"), h: Math.round(x.getBoundingClientRect().height) })) }; });
  ok(`K5 ${err}: tekst z C2`, m && re.test(m.txt), m?.txt);
  ok(`K5 ${err}: przyciski „Wybierz plan” (główny), „Napisz do nas” (mailto z tematem), „Zamknij”, każdy ≥ 44 px`, m && m.btn[0]?.t === "Wybierz plan" && m.btn[0].prim && m.btn.some((x) => x.t === "Napisz do nas" && /^mailto:.+\?subject=Okres%20pr%C3%B3bny%20%E2%80%93%20student%40x\.pl/.test(x.href || "")) && m.btn.some((x) => x.t === "Zamknij") && m.btn.every((x) => x.h >= 44), m?.btn);
  await p.click(".uxw-blad .btn.primary"); await p.waitForTimeout(500);
  ok(`K5 ${err}: „Wybierz plan” otwiera wybór planu`, (await p.evaluate(() => !!document.querySelector('[aria-label="Wybierz plan"]'))));
  await p.close();
}
{
  const p = await open({ konto: "darmowe", lang: "en", ls: { "mock-proba-blad": "urzadzenie" } });
  await p.click(".uxw-pasek-b"); await p.waitForTimeout(600);
  const t = await p.locator(".uxw-blad").innerText().catch(() => "");
  ok("K5 EN: okno błędu po angielsku", /A trial was already used on this device\. If it’s your first time, write to us and we’ll turn it on manually\./.test(t) && /Choose a plan/.test(t) && /Write to us/.test(t) && /Close/.test(t), t);
  await p.close();
}

// ---------- K6: kierunki „oczekujace”: „Wkrótce” i lista oczekujących; próba niemożliwa ----------
for (const lang of ["pl", "en"]) {
  const p = await page(b, { konto: "brak", lang, ls: { "bm-group": "", "skrot-roczniki-status": JSON.stringify({ "wefiz-zarz-1-st-2026": "oczekujacy", "wefiz-fir-1-st-2026": "platny" }) } });
  await p.goto(BASE + "index.html"); await p.waitForTimeout(2500);
  const r = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll(".lk-card[data-k]")].map((c) => [c.dataset.k, { tag: c.querySelector(".lk-tag")?.textContent, small: c.querySelector(".lk-txt small")?.textContent, tagVis: !!c.querySelector(".lk-tag")?.offsetParent }])));
  const z = r["wefiz-zarz-1-st-2026"], bm = r["wefiz-bm-1-st-2026"];
  ok(`K6 ${lang}: kierunek oczekujący ma widoczny tag „${lang === "pl" ? "Wkrótce" : "Coming soon"}” i opis`, z && z.tagVis && (lang === "pl" ? z.tag === "Wkrótce" && /Lekcje w przygotowaniu · zapisz się na start/.test(z.small) : /Coming soon/.test(z.tag) && /Lessons in progress · join the launch list/.test(z.small)), z);
  ok(`K6 ${lang}: BM (platny) bez tagu „Wkrótce”`, bm && !/Wkrótce|Coming soon/.test(bm.tag || ""), bm);
  if (lang === "pl") {
    await p.click('.lk-card[data-k="wefiz-zarz-1-st-2026"]'); await p.waitForTimeout(600);
    const w = await p.evaluate(() => ({ h2: document.querySelector("#lgKierunek h2")?.textContent, txt: document.querySelector("#lgKierunek")?.innerText }));
    ok("K6: klik w kierunek oczekujący → lista oczekujących z tym kierunkiem", /jeszcze nie ruszył|jeszcze nie ma/.test(w.h2 || "") && /Zarządzanie/.test(w.txt || ""), w);
  }
  ok(`K6 ${lang}: konsola bez błędów`, !p.errors.length, p.errors);
  await p.close();
}
{
  // Zalogowany z rocznikiem oczekującym: próba niemożliwa (bez „Wypróbuj”), błąd „rocznik” z bazy ma swój tekst.
  const p = await open({ konto: "darmowe", ls: { "skrot-rocznik": "wefiz-zarz-1-st-2026", "skrot-kierunek": "wefiz-zarz-1-st-2026", "skrot-roczniki-baza": JSON.stringify(["wefiz-bm-1-st-2026", "wefiz-zarz-1-st-2026"]), "skrot-roczniki-status": JSON.stringify({ "wefiz-zarz-1-st-2026": "oczekujacy" }) } });
  const r = await p.evaluate(() => ({ can: window.skrot?.trialCan, rok: window.SKROT_ROCZNIK?.id, txt: document.querySelector("#main")?.innerText || "" }));
  ok("K6: rocznik oczekujący → trialCan = false, bez „Wypróbuj” i „Masz jeszcze 3 dni” na Dziś", r.rok === "wefiz-zarz-1-st-2026" && r.can === false && !/Wypróbuj|Masz jeszcze 3 dni/.test(r.txt), { can: r.can, rok: r.rok });
  const e = await p.evaluate(() => window.ZD_WEJSCIE?.bladProby?.("rocznik")?.innerText);
  ok("K6: błąd „rocznik” → „Ten kierunek jeszcze nie ruszył. Zapisz się na listę, a próba poczeka na Ciebie.”", /Ten kierunek jeszcze nie ruszył\. Zapisz się na listę, a próba poczeka na Ciebie\./.test(e || ""), e);
  await p.close();
}
{
  const fs = await import("fs");
  const sql = fs.readFileSync(new URL("../../../supabase/skrot-v52-proba-rocznik.sql", import.meta.url), "utf8");
  ok("K6 SQL: v52 odrzuca start próby dla rocznika nie-platny (raise 'rocznik'), test PGlite supabase/test/v52.sql", /raise exception 'rocznik'/.test(sql) && fs.existsSync(new URL("../../../supabase/test/v52.sql", import.meta.url)));
}
await b.close();
end();
