// Pętla UX-1, etap 3: koniec próby jako wydarzenie (kryteria K1–K5 z ~/zdawalni/ux/petla-1.md).
// BASE=http://127.0.0.1:8811/ node docs/gry/test/ux1-etap3.mjs
import fs from "fs";
import { execSync } from "child_process";
import { chromium, page, BASE } from "./lib.mjs";
import { tester, docs as H2DOCS, UID } from "./h2-lib.mjs";
const { ok, end } = tester();
const b = await chromium.launch();
const ROOT = new URL("../../../", import.meta.url).pathname;
const ready = async (p, sel = "#main .greet") => { await p.waitForSelector(sel, { timeout: 20000 }).catch(() => {}); await p.waitForTimeout(1500); };
const KONIEC = { "skrot-proba-do": "2026-11-14T17:00:00+01:00" };
async function open(o = {}) {
  const ls = { "mock-docs": JSON.stringify(o.docs || H2DOCS), "skrot-green": o.dark ? "dark" : "light", "bm-ld-flag": "1", ...(o.ls || {}) };
  const p = await page(b, { konto: o.konto || "proba-koniec", w: o.w || 390, h: o.h || 844, lang: o.lang || "pl", ls, ctx: o.dark ? { colorScheme: "dark" } : {} });
  await p.clock.setFixedTime(new Date(o.time || "2026-11-17T10:00:00+01:00"));
  await p.goto(BASE + "index.html" + (o.q || "")); await ready(p, o.sel);
  return p;
}
const vis = (p, sel) => p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { t: e.innerText.replace(/\s+/g, " ").trim(), top: r.top, bottom: r.bottom, h: Math.round(r.height), w: Math.round(r.width), ih: innerHeight }; }, sel);

// ---------- K1: przełącznik przypomnienia w powitaniu próby ----------
for (const lang of ["pl", "en"]) for (const dark of [false, true]) {
  if (lang === "en" && dark) continue;
  const p = await open({ konto: "darmowe", lang, dark });
  await p.click(".uxw-pasek-b"); await p.waitForSelector(".uxw-przyp", { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(600);
  const r = await p.evaluate(() => { const lab = document.querySelector(".uxw-przyp"), inp = lab?.querySelector("input"); if (!lab) return null; const rr = lab.getBoundingClientRect(), ri = inp.getBoundingClientRect();
    return { txt: lab.innerText.replace(/\s+/g, " "), checked: inp.checked, role: inp.getAttribute("role"), h: Math.round(rr.height), w: Math.round(rr.width), inpH: Math.round(ri.height), note: document.querySelector(".uxw-przyp-note")?.textContent }; });
  const tag = `${lang}${dark ? " ciemny" : ""}`;
  ok(`K1 ${tag}: w powitaniu próby przełącznik „${lang === "pl" ? "Przypomnij mi mailem dzień przed końcem próby" : "Email me a day before my trial ends"}”, domyślnie odznaczony`, r && (lang === "pl" ? /Przypomnij mi mailem dzień przed końcem próby/ : /Email me a day before my trial ends/).test(r.txt) && r.checked === false && r.role === "switch", r);
  ok(`K1 ${tag}: cel dotyku przełącznika ≥ 44 px`, r && r.h >= 44 && r.w >= 44, r);
  ok(`K1 ${tag}: notka „${lang === "pl" ? "Jeden mail. Nic nie pobieramy samo." : "One email. Nothing is charged automatically."}”`, r && (lang === "pl" ? r.note === "Jeden mail. Nic nie pobieramy samo." : r.note === "One email. Nothing is charged automatically."), r?.note);
  if (lang === "pl" && !dark) {
    await p.click(".uxw-przyp"); await p.waitForTimeout(400);
    const rpc = await p.evaluate(() => (window.__rpc || []).filter((x) => x.fn === "nauka_proba_przypomnij" || x[0] === "nauka_proba_przypomnij"));
    const st = await p.evaluate(() => ({ checked: document.querySelector(".uxw-przyp input").checked, msg: document.querySelector(".uxw-przyp-msg")?.textContent, ls: localStorage.getItem("mock-proba-przypomnij") }));
    ok("K1: włączenie → RPC nauka_proba_przypomnij(true, jezyk) i potwierdzenie", st.checked && st.ls === "true" && /Przypomnimy/.test(st.msg || ""), { st, rpc: rpc.slice(-1) });
  }
  ok(`K1 ${tag}: konsola bez błędów`, !p.errors.length, p.errors);
  await p.close();
}

// ---------- K2: SQL v53 (wynik PGlite) ----------
{
  const sql = fs.readFileSync(ROOT + "supabase/skrot-v53-proba-przypomnienie.sql", "utf8");
  ok("K2 SQL: kolumny przypomnij i przypomniano_at, RPC nauka_proba_przypomnij i nauka_proba_kandydaci (tylko service_role)",
    /add column if not exists przypomnij boolean not null default false/.test(sql) && /add column if not exists przypomniano_at timestamptz/.test(sql)
    && /function public\.nauka_proba_przypomnij\(/.test(sql) && /function public\.nauka_proba_kandydaci\(/.test(sql) && /grant execute on function public\.nauka_proba_kandydaci\(timestamptz\), public\.nauka_proba_przypomniano\(uuid\) to service_role/.test(sql));
  const out = execSync("node supabase/test/pglite.mjs 2>&1", { cwd: ROOT, encoding: "utf8" });
  const z = out.split("\n").filter((l) => /OK Z[1-8]/.test(l));
  ok("K2 PGlite: Z1–Z8 (kandydat przy 24 h i zgodzie, nie po wysłaniu, nie po zakupie, nigdy bez zgody, limit dnia)", z.length >= 14 && /✓ test\/v53\.sql/.test(out), z.length);
}

// ---------- K3: funkcja Edge (test Node) ----------
{
  const out = execSync("node --test tests/ux1-proba-mail.test.js tests/przypomnienia.test.js 2>&1", { cwd: ROOT, encoding: "utf8" });
  ok("K3: funkcja przypomnienia: rodzaj „proba” przed innymi i w limit_dzien (tests/ux1-proba-mail.test.js + stare testy)", /ℹ fail 0/.test(out) && /ℹ pass 15/.test(out), out.match(/ℹ (pass|fail) \d+/g));
}

// ---------- K4: ?plan=1 po zalogowaniu otwiera wybór planu ----------
{
  const p = await open({ konto: "darmowe", q: "?plan=1" });
  const r = await p.evaluate(() => ({ plan: !!document.querySelector('[aria-label="Wybierz plan"]'), q: location.search }));
  ok("K4: zalogowany + ?plan=1 → okno „Wybierz plan”, parametr usunięty z adresu", r.plan && !/plan=/.test(r.q), r);
  await p.close();
  const p2 = await page(b, { konto: "brak" });
  await p2.goto(BASE + "index.html?plan=1"); await p2.waitForTimeout(3000);
  ok("K4: gość + ?plan=1 → po zalogowaniu wybór planu (skrot-buy), parametr usunięty", (await p2.evaluate(() => localStorage.getItem("skrot-buy"))) === "1" && !/plan=/.test(await p2.evaluate(() => location.search)));
  await p2.close();
}

// ---------- K5: „Twoje 3 dni minęły” ----------
const prog = { [UID]: { done: { A1: Date.parse("2026-11-12T12:00:00+01:00"), M1: Date.parse("2026-11-13T12:00:00+01:00") }, xp: { t: 85, d: 0, n: 0 }, srs: { "A1:a": [1, 0], "A1:b": [1, 0], "A1:c": [1, 0] }, streak: { d: 0, n: 2 } } };
for (const [w, h, dark, lang] of [[390, 844, false, "pl"], [360, 640, false, "pl"], [390, 844, true, "pl"], [1280, 900, false, "pl"], [390, 844, false, "en"]]) {
  const p = await open({ w, h, dark, lang, ls: { ...KONIEC, "mock-progress": JSON.stringify(prog) }, sel: ".uxw-koniec" });
  const r = await p.evaluate(() => { const d = document.querySelector(".uxw-koniec"); if (!d) return null; const plany = [...d.querySelectorAll(".uxw-plan")].map((x) => ({ t: x.innerText.replace(/\s+/g, " "), on: x.classList.contains("on") }));
    const kup = [...d.querySelectorAll("button")].filter((x) => x.matches(".uxw-plan, .btn.primary"));
    return { eyebrow: d.querySelector(".eyebrow")?.textContent, h2: d.querySelector("h2")?.textContent, txt: d.innerText.replace(/\s+/g, " "), plany, staty: [...d.querySelectorAll(".uxw-stat b")].map((x) => x.textContent) }; });
  const tag = `${w}${dark ? " ciemny" : ""}${lang === "en" ? " EN" : ""}`;
  if (lang === "pl") {
    ok(`K5 ${tag}: jednorazowy ekran „Twoje 3 dni minęły” (nadtytuł „Okres próbny minął”)`, r && r.eyebrow === "Okres próbny minął" && /Twoje 3 dni minęły/.test(r.txt), r);
    ok(`K5 ${tag}: postęp z 3 dni (2 lekcje, 3 fiszki, 85 XP)`, r && /^Przez 3 dni zrobiłeś/.test(r.h2) && JSON.stringify(r.staty) === JSON.stringify(["2", "3", "85"]), r);
    ok(`K5 ${tag}: najbliższe kolokwium „za n dni”`, r && /(Kolokwium|Egzamin) · .+ · za \d+ dni/.test(r.txt), r?.txt);
    ok(`K5 ${tag}: dwa plany, 199 zł na górze i zaznaczony`, r && r.plany.length === 2 && /199 zł/.test(r.plany[0].t) && r.plany[0].on && /35 zł/.test(r.plany[1].t), r?.plany);
    ok(`K5 ${tag}: „Twoje postępy zostały na koncie” i link „Zostaję przy darmowych próbkach”`, r && /Twoje postępy zostały na koncie/.test(r.txt) && /Zostaję przy darmowych próbkach/.test(r.txt), r?.txt);
  } else ok("K5 EN: ekran po angielsku", r && r.eyebrow === "Your trial has ended" && /Your 3 days are over/.test(r.txt) && /^In 3 days you did/.test(r.h2) && /Your progress stays on your account/.test(r.txt) && /I’ll stay with the free samples/.test(r.txt), r);
  const sc = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  ok(`K5 ${tag}: bez poziomego przewijania, konsola bez błędów`, !sc && !p.errors.length, p.errors);
  await p.close();
}
{
  // Zerowy postęp → „Nie zdążyłeś?…”
  const p = await open({ ls: { ...KONIEC, "mock-progress": JSON.stringify({ [UID]: {} }) }, sel: ".uxw-koniec" });
  const h2 = await p.evaluate(() => document.querySelector(".uxw-koniec h2")?.textContent);
  ok("K5: zero postępu → „Nie zdążyłeś? Zostało N dni do: …”", /^Nie zdążyłeś\? Zostało \d+ dni do: .+\.$/.test(h2 || ""), h2);
  // „Zostaję…” zamyka; drugie wejście: bez ekranu, pasek zakupu ≤ 56 px nad panelem
  await p.click(".uxw-koniec .btn.ghost"); await p.waitForTimeout(300);
  ok("K5: „Zostaję przy darmowych próbkach” zamyka ekran", !(await p.locator(".uxw-koniec").count()));
  await p.reload(); await ready(p);
  const bar = await vis(p, ".uxw-pasek.uxw-po");
  const hero = await vis(p, ".zh-hero, .ld-block");
  ok("K5: drugie wejście: bez ekranu końca próby", !(await p.locator(".uxw-koniec").count()));
  ok("K5: drugie wejście: pasek „Próba minęła · 199 zł do 11 lipca 2027 albo 35 zł / mies.” + „Kup dostęp”, ≤ 56 px, nad panelem, w 1. ekranie", bar && /Próba minęła · 199 zł do 11 lipca 2027 albo 35 zł \/ mies\./.test(bar.t) && /Kup dostęp/.test(bar.t) && bar.h <= 56 && (!hero || bar.bottom <= hero.top + 1) && bar.bottom <= bar.ih, { bar, hero });
  const kup = await p.evaluate(() => [...document.querySelectorAll("#main button")].filter((e) => e.offsetParent && e.textContent.trim() === "Kup dostęp").map((e) => getComputedStyle(e).backgroundColor));
  ok("K5: na Dziś dalej dokładnie jeden „Kup dostęp” (na pasku, akcent)", kup.length === 1 && kup[0] === "rgb(26, 127, 69)", kup);
  await p.close();
}
for (const [konto, ls, opis] of [["proba-koniec", {}, "po próbie bez zapisanego końca (inne urządzenie)"], ["darmowe", KONIEC, "darmowe z możliwą próbą"], ["platne", KONIEC, "płatne"]]) {
  const p = await open({ konto, ls });
  ok(`K5 ${opis}: bez ekranu końca próby i bez paska „Próba minęła”`, !(await p.locator(".uxw-koniec, .uxw-po").count()));
  await p.close();
}
{
  // Próba trwa → zapisuje koniec (skrot-proba-do) na później
  const p = await open({ konto: "proba", ls: { "mock-proba-do": "2026-11-19T17:00:00+01:00" } });
  ok("K5: w trakcie próby koniec zapisany w skrot-proba-do", (await p.evaluate(() => localStorage.getItem("skrot-proba-do"))) === "2026-11-19T17:00:00+01:00");
  await p.close();
}
await b.close();
end();
