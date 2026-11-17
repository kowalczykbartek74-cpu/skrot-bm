// UX-2 etap 4: kanał poza stroną (kryteria K1–K5 z ~/zdawalni/ux/petla-2.md).
// BASE=http://127.0.0.1:8812/ [RUNDA=1] node docs/gry/test/ux2-etap4.mjs
import { execSync } from "child_process";
import fs from "fs";
import { chromium, open, pomiar, tester, zapiszRaport, katalog, pozaEkranem, dayN } from "./ux2-lib.mjs";

const ROOT = new URL("../../../", import.meta.url).pathname;
const DIR = katalog(4), R = { etap: 4, runda: +(process.env.RUNDA || 0), pomiary: [], zrzuty: [], ruch: [], dodatkowe: [] };
const { ok, wynik } = tester(R);
const shot = async (p, name) => { if (!DIR) return; await p.screenshot({ path: DIR + name + ".png" }); R.zrzuty.push(name + ".png"); };
const b = await chromium.launch();
const T = dayN("2026-11-06");
const PR = { "skrot-zam-prezent": "1" };
const P2 = { xp: { t: 120, d: T, n: 12 }, streak: { d: T, n: 2 }, nd: [T - 1, T] };
const wstaw = (p, fn) => p.evaluate(async (fn) => { const el = window.ZD_NAWYK[fn](); if (!el) return null; const w = document.createElement("div"); w.id = "nw-test"; w.style.cssText = "padding:16px;display:grid;gap:12px"; w.append(el); document.body.prepend(w); await new Promise((r) => setTimeout(r, 300)); return el.innerText.replace(/\s+/g, " ").trim(); }, fn);
const kartaZrobiona = (p) => p.evaluate(() => { const A = window.ZD_APP, st = A.ldDay.get(); st.done = { ...(st.done || {}), karta: true }; A.ldDay.set(st); });

// ---------- K1: „Przypomnieć Ci jutro o {godz}?” po pierwszej skończonej karcie dnia (okres próbny, przypomnienia wyłączone)
for (const [w, hh, dark, lang] of [[390, 844, false, "pl"], [360, 640, false, "pl"], [390, 844, true, "pl"], [390, 844, false, "en"]]) {
  const tag = `${w}-${dark ? "ciemny" : "jasny"}${lang === "en" ? "-en" : ""}`;
  const p = await open(b, { konto: "proba", w, h: hh, dark, lang, prog: P2, ls: PR });
  ok(`K1 ${tag}: przed skończoną kartą dnia – brak propozycji`, (await p.evaluate(() => window.ZD_NAWYK.ofertaPrzypomnienia())) === null);
  await kartaZrobiona(p);
  const godz = await p.evaluate(() => window.ZD_NAWYK.godzinaPrzypomnienia());
  const txt = await wstaw(p, "ofertaPrzypomnienia");
  const gt = `${Math.floor(godz / 60)}:${String(godz % 60).padStart(2, "0")}`;
  if (lang === "pl") ok(`K1 ${tag}: „Przypomnieć Ci jutro o ${gt}?” (godzina z planu, pełne 30 min, ≤ 21:00), opis i „Tak, przypominaj” / „Nie teraz”`, txt && txt.includes(`Przypomnieć Ci jutro o ${gt}?`) && /Jeden mail, tylko gdy jeszcze nie było nauki/.test(txt) && /Tak, przypominaj/.test(txt) && /Nie teraz/.test(txt) && godz % 30 === 0 && godz <= 21 * 60, { txt, godz });
  else ok("K1 EN: „Remind you tomorrow at …?” / „Yes, remind me”", txt && /Remind you tomorrow at/.test(txt) && /Yes, remind me/.test(txt) && /Not now/.test(txt), txt);
  await shot(p, `k1-oferta-przypomnienia-${tag}`);
  R.pomiary.push(await pomiar(p, `K1 oferta przypomnienia ${tag}`, "#nw-test", "#nw-test"));
  if (tag === "390-jasny") {
    R.dodatkowe.push(`Godzina przypomnienia z planu C111 (jutro): ${gt}`);
    await p.click("#nw-test .btn.primary"); await p.waitForTimeout(800);
    const u = await p.evaluate(() => (window.__przyp || []).filter((x) => x.fn === "ustaw").map((x) => x.p));
    ok("K1 „Tak” włącza przypomnienia z godziną z planu", u.length === 1 && u[0].wlaczone === true && u[0].godz === godz, u);
    ok("K1 po włączeniu propozycja znika", (await p.evaluate(() => window.ZD_NAWYK.ofertaPrzypomnienia())) === null);
  }
  await p.close();
}
{
  let p = await open(b, { konto: "proba", prog: P2, ls: PR });
  await kartaZrobiona(p);
  await wstaw(p, "ofertaPrzypomnienia"); await p.click("#nw-test .btn.ghost"); await p.waitForTimeout(300);
  ok("K1 „Nie teraz” chowa propozycję na dziś", (await p.evaluate(() => window.ZD_NAWYK.ofertaPrzypomnienia())) === null);
  await p.close();
  p = await open(b, { konto: "darmowe", prog: P2, ls: PR });
  await kartaZrobiona(p);
  ok("K1 konto bez dostępu: brak propozycji", (await p.evaluate(() => window.ZD_NAWYK.ofertaPrzypomnienia())) === null);
  await p.close();
  p = await open(b, { konto: "platne", prog: P2, ls: { ...PR, "mock-przyp": JSON.stringify({ wlaczone: true, godz: 1080, co: { terminy: true, powtorki: true, zadanie: true }, jezyk: "pl" }) } });
  await kartaZrobiona(p);
  ok("K1 przypomnienia już włączone: brak propozycji", (await p.evaluate(() => window.ZD_NAWYK.ofertaPrzypomnienia())) === null);
  await p.close();
}
try { const out = execSync("node --test tests/nawyk.test.js", { cwd: ROOT, encoding: "utf8" }); ok("K1 godzina z planu: test jednostkowy (koniec + 60, w górę do 30 min, ≤ 21:00, bez planu 18:00)", /ℹ fail 0/.test(out)); }
catch (e) { ok("K1 tests/nawyk.test.js", false, String(e.stdout || e).slice(-300)); }

// ---------- K2: przypHomeCard także bez terminu ≤ 14 dni, po ≥ 1 dniu nauki, raz na 30 dni
for (const [w, dark, lang] of [[390, false, "pl"], [360, true, "pl"], [390, false, "en"]]) {
  const tag = `${w}-${dark ? "ciemny" : "jasny"}${lang === "en" ? "-en" : ""}`;
  const p = await open(b, { konto: "platne", w, h: 844, dark, lang, prog: { xp: { t: 120, d: T - 1, n: 12 }, streak: { d: T - 1, n: 1 }, nd: [T - 1] }, ls: PR });
  const c = await p.evaluate(() => { const e = document.querySelector("#main .przyp-card"); return e ? e.innerText.replace(/\s+/g, " ") : null; });
  if (lang === "pl") ok(`K2 ${tag}: bez zaliczenia w 14 dni, po 1 dniu nauki – „Przypomnieć Ci mailem?” z godziną z planu`, c && /Przypomnieć Ci mailem\?/.test(c) && /Najwyżej jeden mail dziennie o \d{1,2}:\d\d/.test(c) && /Włącz/.test(c), c);
  else ok("K2 EN: „Get an email reminder?” (istniejące tłumaczenie) z godziną", c && /Get an email reminder\?/.test(c) && /at \d{1,2}:\d\d/.test(c), c);
  ok(`K2 ${tag}: nic poza ekranem`, (await pozaEkranem(p, "#main .przyp-card *")).length === 0);
  if (c) { await p.evaluate(() => document.querySelector("#main .przyp-card")?.scrollIntoView({ block: "center" })); await p.waitForTimeout(300); await shot(p, `k2-przyp-dzis-${tag}`); R.pomiary.push(await pomiar(p, `K2 karta przypomnień na Dziś ${tag}`, "#main .przyp-card", "#main .przyp-card")); }
  if (tag === "390-jasny") {
    await p.click("#main .przyp-card .przyp-nie"); await p.waitForTimeout(500);
    ok("K2 „Nie teraz” chowa kartę (30 dni)", !(await p.evaluate(() => !!document.querySelector("#main .przyp-card"))));
  }
  await p.close();
}
{
  const p = await open(b, { konto: "platne", prog: {}, ls: PR });
  ok("K2 przed pierwszym dniem nauki: bez karty przypomnień", !(await p.evaluate(() => !!document.querySelector("#main .przyp-card"))));
  await p.close();
}

// ---------- K3: mail „seria” (3 warianty PL/EN, rotacja, wariant w historii) – testy w tests/
try {
  const out = execSync("node --test tests/przypomnienia.test.js", { cwd: ROOT, encoding: "utf8" });
  ok("K3 tests/przypomnienia.test.js (rodzaj „seria”, warianty A/B/C, rotacja, studiedToday → null, termin pierwszy)", /ℹ fail 0/.test(out) && /seria/.test(out), out.split("\n").filter((l) => /seria|ℹ (pass|fail)/.test(l)).join(" | "));
  const pg = execSync("node supabase/test/pglite.mjs", { cwd: ROOT, encoding: "utf8", maxBuffer: 32 << 20 });
  ok("K3/K4 PGlite v57: historia z rodzajem (seria_x), flaga kalendarza", /OK v57: K1–K3/.test(pg) && /^✓ test\/v57\.sql$/m.test(pg), pg.split("\n").filter((l) => /v57/.test(l)));
  const obs = fs.readFileSync(ROOT + "supabase/functions/przypomnienia/obsluga.ts", "utf8");
  ok("K3 funkcja Edge zapisuje wariant w rodzaju logu („seria_b”)", /pick\.wariant \? pick\.kind \+ "_" \+ pick\.wariant : pick\.kind/.test(obs));
} catch (e) { ok("K3 testy", false, String(e.stdout || e).slice(-300)); }

// ---------- K4: kalendarz – wpis „Zdawalni · 5 min po zajęciach” z VALARM (przełącznik, domyślnie wyłączony), nazwa Zdawalni
try {
  const out = execSync("node --test tests/kalendarz.test.js", { cwd: ROOT, encoding: "utf8" });
  ok("K4 tests/kalendarz.test.js: złoty plik, UID-y @skrotbm.pl bez zmian, wpis nauki tylko po włączeniu, VALARM, Zdawalni", /ℹ fail 0/.test(out), out.slice(-200));
  const diff = fs.existsSync("/tmp/ux-2/kalendarz-roznica.diff") ? fs.readFileSync("/tmp/ux-2/kalendarz-roznica.diff", "utf8") : "";
  if (diff) {
    const linie = diff.split("\n").filter((l) => /^[<>]/.test(l));
    ok("K4 różnica złotego pliku .ics: tylko linie z nazwą (PRODID, X-WR-CALNAME, opisy), bez UID", linie.length > 0 && linie.every((l) => /Zdawalni|Skrót BM|Skrócie BM|Skrot BM|skrotbm\.pl\/\/|kładnego terminu|ki liczy się|nauki liczy się/.test(l)) && !linie.some((l) => /UID:/.test(l)), linie);
    R.dodatkowe.push("## Różnica złotego pliku tests/fixtures/kalendarz-bm.ics (stary → nowy)", "```diff", diff.trim(), "```");
  }
  const idx = fs.readFileSync(ROOT + "index.html", "utf8");
  ok("K4 jednorazowe .ics (termIcs): PRODID Zdawalni", /"PRODID:-\/\/Zdawalni\/\/Terminy\/\/PL"/.test(idx) && !/PRODID:-\/\/Skrot BM/.test(idx));
} catch (e) { ok("K4 testy kalendarza", false, String(e.stdout || e).slice(-300)); }
for (const [w, dark, lang] of [[390, false, "pl"], [360, false, "pl"], [390, true, "pl"], [390, false, "en"]]) {
  const tag = `${w}-${dark ? "ciemny" : "jasny"}${lang === "en" ? "-en" : ""}`;
  const p = await open(b, { konto: "platne", w, h: 844, dark, lang, prog: P2, ls: PR });
  await p.evaluate(() => window.ZD_APP.go({ view: "terms" })); await p.waitForTimeout(600);
  await p.evaluate(() => { const b = [...document.querySelectorAll("button, a")].find((x) => /Do kalendarza w telefonie|Dodaj do kalendarza w telefonie|Kalendarz w telefonie|Phone calendar|calendar on your phone/i.test(x.innerText)); if (b) b.click(); });
  await p.waitForTimeout(900);
  let k = await p.evaluate(() => { const l = document.querySelector("#layer .nw-kal"); return l ? { txt: l.innerText.replace(/\s+/g, " "), on: l.querySelector("input").checked } : null; });
  if (!k) { await p.evaluate(() => window.ZD_APP.ls && document.querySelector("#layer") && 0); }
  if (lang === "pl") ok(`K4 ${tag}: w oknie „Kalendarz w telefonie” przełącznik „Przypominaj o 5 minutach po zajęciach”, domyślnie wyłączony`, k && /Przypominaj o 5 minutach po zajęciach/.test(k.txt) && k.on === false, k);
  else ok("K4 EN: „Remind me about 5 minutes after class”", k && /Remind me about 5 minutes after class/.test(k.txt), k);
  if (k) { await shot(p, `k4-kalendarz-okno-${tag}`); R.pomiary.push(await pomiar(p, `K4 okno kalendarza ${tag}`, "#layer", "#layer .nw-kal")); }
  if (tag === "390-jasny" && k) {
    await p.click("#layer .nw-kal input"); await p.waitForTimeout(400);
    ok("K4 włączenie zapisuje progress.calStudy = true", (await p.evaluate(() => window.ZD_APP.S.progress.calStudy)) === true);
  }
  await p.close();
}

// ---------- K5: sw.js – Dziś offline po pierwszym wejściu, nowe ?v= wymienia plik, bez Supabase/Stripe/innych domen w pamięci
{
  const ctxOpt = { serviceWorkers: "allow" };
  const p = await open(b, { prog: P2, ls: PR, query: "?ld=1&sw=on", ctx: ctxOpt });
  await p.evaluate(async () => { await navigator.serviceWorker.ready; });
  await p.reload(); await p.waitForTimeout(2500);
  const ctrl = await p.evaluate(() => !!navigator.serviceWorker.controller);
  await p.evaluate(async () => { await fetch("nawyk.js?v=test-a"); await fetch("nawyk.js?v=test-b"); await fetch("manifest.webmanifest"); await window.skrot?.sb?.rpc?.("nauka_ping", {}).catch(() => {}); });
  const pam = await p.evaluate(async () => { const out = []; for (const k of await caches.keys()) for (const r of await (await caches.open(k)).keys()) out.push(r.url); return out; });
  const nawyk = pam.filter((u) => /nawyk\.js/.test(u));
  ok("K5 service worker zarejestrowany i steruje stroną (127.0.0.1 z ?sw=on)", ctrl, ctrl);
  ok("K5 w pamięci tylko adresy z tej samej domeny (bez Supabase, Stripe, plan.zdawalni.pl, CDN)", pam.length > 3 && pam.every((u) => u.startsWith("http://127.0.0.1:8812/")), pam.filter((u) => !u.startsWith("http://127.0.0.1:8812/")));
  ok("K5 nowe ?v= wymienia plik w pamięci (jeden nawyk.js, najnowszy)", nawyk.length === 1 && /v=test-b/.test(nawyk[0]), nawyk);
  R.dodatkowe.push(`Pamięć service workera po wejściu: ${pam.length} adresów, np. ${pam.slice(0, 6).join(", ")}`);
  await p.context().setOffline(true);
  await p.reload().catch(() => {}); await p.waitForTimeout(3500);
  const off = await p.evaluate(() => ({ greet: !!document.querySelector("#main .greet"), txt: (document.querySelector("#main")?.innerText || "").slice(0, 120), online: navigator.onLine }));
  ok("K5 offline po pierwszym wejściu: Dziś się renderuje (powitanie z serią)", off.greet && !off.online, off);
  await shot(p, "k5-dzis-offline-390-jasny");
  await p.context().setOffline(false);
  await p.goto(p.url().replace(/\?.*$/, "?ld=1&sw=off#/")); await p.waitForTimeout(2500);
  const poOff = await p.evaluate(async () => ({ reg: (await navigator.serviceWorker.getRegistrations()).length, cache: (await caches.keys()).filter((k) => k.startsWith("zdawalni-sw-")).length }));
  ok("K5 ?sw=off wyrejestrowuje workera i kasuje pamięci", poOff.reg === 0 && poOff.cache === 0, poOff);
  await p.close();
  const sw = fs.readFileSync(ROOT + "sw.js", "utf8");
  ok("K5 sw.js: tylko GET z tej samej domeny, stała wersji, kasowanie starych pamięci", /req\.method !== "GET"\) return/.test(sw) && /if \(!sameOrigin\(url\)\) return/.test(sw) && /const WERSJA = "zdawalni-sw-/.test(sw) && /caches\.delete\(k\)/.test(sw));
  const zwykly = await open(b, { prog: P2, ls: PR });
  ok("K5 bez ?sw=on na 127.0.0.1 worker się nie rejestruje (zwykłe testy bez pamięci podręcznej)", (await zwykly.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length)) === 0);
  await zwykly.close();
}
// zachęta do instalacji: iPhone (2 kroki), raz w 2. dniu nauki, „Nie teraz” na 30 dni
for (const [w, dark, lang] of [[390, false, "pl"], [360, true, "pl"], [390, false, "en"]]) {
  const tag = `${w}-${dark ? "ciemny" : "jasny"}${lang === "en" ? "-en" : ""}`;
  const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
  const p = await open(b, { w, h: 844, dark, lang, prog: P2, ls: PR, ctx: { userAgent: ua } });
  const c = await p.evaluate(() => { const e = document.querySelector("#main .nw-inst"); return e ? e.innerText.replace(/\s+/g, " ") : null; });
  if (lang === "pl") ok(`K5 ${tag}: 2. dzień nauki na iPhonie – „Dodaj Zdawalni do ekranu głównego…” z 2 krokami (Udostępnij → Do ekranu początkowego)`, c && /Dodaj Zdawalni do ekranu głównego/.test(c) && /Udostępnij/.test(c) && /Do ekranu początkowego/.test(c), c);
  else ok("K5 EN: „Add Zdawalni to your home screen” + „Add to Home Screen”", c && /Add Zdawalni to your home screen/.test(c) && /Add to Home Screen/.test(c), c);
  if (c) { await p.evaluate(() => document.querySelector("#main .nw-inst")?.scrollIntoView({ block: "center" })); await p.waitForTimeout(300); await shot(p, `k5-instalacja-${tag}`); R.pomiary.push(await pomiar(p, `K5 zachęta do instalacji ${tag}`, "#main .nw-inst", "#main .nw-inst")); }
  if (tag === "390-jasny" && c) {
    await p.click("#main .nw-inst .btn.ghost"); await p.waitForTimeout(300); await p.evaluate(() => window.ZD_APP.render()); await p.waitForTimeout(300);
    ok("K5 „Nie teraz” chowa zachętę (30 dni)", !(await p.evaluate(() => !!document.querySelector("#main .nw-inst"))));
  }
  await p.close();
}
{
  const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
  const p = await open(b, { prog: { xp: { t: 400, d: T, n: 12 }, streak: { d: T, n: 5 }, nd: [T - 4, T - 3, T - 2, T - 1, T] }, ls: PR, ctx: { userAgent: ua } });
  ok("K5 zachęta tylko w 2. dniu nauki (5. dzień: brak)", !(await p.evaluate(() => !!document.querySelector("#main .nw-inst"))));
  await p.close();
}
await b.close();
const errs = R.pomiary.flatMap((x) => x.bledy);
ok("konsola bez błędów (wszystkie stany)", errs.length === 0, errs.slice(0, 3));
R.wynik = wynik();
if (DIR) zapiszRaport(DIR, R);
console.log(`${R.wynik.pass}/${R.wynik.pass + R.wynik.fail}`);
process.exit(R.wynik.fail ? 1 : 0);
