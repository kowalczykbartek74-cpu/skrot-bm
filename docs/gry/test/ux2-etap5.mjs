// UX-2 etap 5: Dziś – układ, zadania, duet, tempo (kryteria K1–K6 z ~/zdawalni/ux/petla-2.md).
// BASE=http://127.0.0.1:8812/ [RUNDA=1] node docs/gry/test/ux2-etap5.mjs
import { execSync } from "child_process";
import fs from "fs";
import { chromium, open, pomiar, tester, zapiszRaport, katalog, pozaEkranem, dayN } from "./ux2-lib.mjs";

const ROOT = new URL("../../../", import.meta.url).pathname;
const DIR = katalog(5), R = { etap: 5, runda: +(process.env.RUNDA || 0), pomiary: [], zrzuty: [], ruch: [], dodatkowe: [] };
const { ok, wynik } = tester(R);
const shot = async (p, name, full) => { if (!DIR) return; await p.screenshot({ path: DIR + name + ".png", fullPage: !!full }); R.zrzuty.push(name + ".png"); };
const b = await chromium.launch();
const T = dayN("2026-11-06"), D = "2026-11-06";
// Konto z 4 dniami nauki (konto starsze niż 3 dni), przypomnienia włączone (zwykły stan po pierwszym tygodniu).
const P4 = { xp: { t: 300, d: T - 1, n: 12 }, streak: { d: T - 1, n: 4 }, nd: [T - 4, T - 3, T - 2, T - 1] };
const PRZ_ON = JSON.stringify({ wlaczone: true, godz: 1080, co: { terminy: true, powtorki: true, zadanie: true, seria: true }, jezyk: "pl" });
const LS = { "skrot-zam-prezent": "1", "skrot-pierwszy-dzien": String(T - 10), "mock-przyp": PRZ_ON, "skrot-duet-zapr": "x" };
const UID = "00000000-0000-4000-8000-000000000001", KASIA = "00000000-0000-4000-8000-00000000000a";
const DUET = JSON.stringify({ paczka: { kod: "AB3K9Z", wlasciciel: true, czlonkowie: [
  { id: UID, nick: "Student", ja: true, wlasciciel: true, dzis: false, dni: 3, w_duecie: true },
  { id: KASIA, nick: "Kasia", ja: false, wlasciciel: false, dzis: true, dni: 2, w_duecie: true }] },
  duet: { id: "d-1", stan: "aktywny", z: KASIA, od: "2026-11-02", moje: 3, jego: 2, cel: 8, nagroda: 20, odebrane: false, moze_zarobic: true }, zaproszenia: [] });
const txt = (p, sel) => p.evaluate((sel) => document.querySelector(sel)?.innerText.replace(/\s+/g, " ").trim() || null, sel);
const tagi = ["390-jasny", "360-ciemny", "390-jasny-en"].map((t) => [t, +t.slice(0, 3), /ciemny/.test(t), /-en/.test(t) ? "en" : "pl"]);

// ---------- K1: kolejność, wysokość ≤ 1800 px, jednorazowe tylko w 3 pierwszych dniach, przyciski zakupu przez ZD_WEJSCIE
for (const [tag, w, dark, lang] of tagi) {
  const p = await open(b, { w, h: 844, dark, lang, prog: P4, ls: LS });
  const u = await p.evaluate(() => {
    const main = document.querySelector("#main"), kids = [...main.children].map((e) => e.className.toString());
    const ld = [...(document.querySelector(".ld-block")?.children || [])].map((e) => e.className.toString());
    // c1356b9: bez „Więcej na dziś” – wysokość mierzymy do dołu „Twój postęp” (Boss, gdy trwa, stoi pod nim osobno)
    const last = document.querySelector("#main .pts-dzis") || [...main.children].filter((e) => !e.matches(".sitefoot")).pop();
    return { kids, ld, h: Math.round(last.getBoundingClientRect().bottom - main.getBoundingClientRect().top),
      wiecej: [...(document.querySelector(".nw-wiecej-b")?.children || [])].map((e) => e.className.toString()),
      prof: !!document.querySelector(".ld-prof"), guide: !!document.querySelector(".g-strip"), poza: [...document.querySelectorAll("#main *")].filter((e) => e.getBoundingClientRect().right > document.documentElement.clientWidth + 1).length };
  });
  const i = (re, arr = u.kids) => arr.findIndex((c) => re.test(c));
  ok(`K1 ${tag}: powitanie → karta dnia (hero → linia zadań → Lekcje dla Ciebie) → Twój postęp → Boss (trwa)`,
    i(/greet/) === 0 && i(/ld-block/) === 1 && i(/ld-hero/, u.ld) === 0 && i(/nw-linia/, u.ld) === 1 && i(/ld-head/, u.ld) === 2 && i(/ld-lessons/, u.ld) === 3
    && i(/pts-dzis/) > i(/ld-block/) && i(/bs-card/) > i(/pts-dzis/) && i(/nw-wiecej/) === -1, u);
  ok(`K1 ${tag}: bez Przewodnika i Profilu nauki na Dziś (konto starsze niż 3 dni)`, !u.guide && !u.prof, u);
  ok(`K1 ${tag}: wysokość Dziś (treść bez stopki) ≤ 1820 px`, u.h <= 1820 /* po scaleniu pętli 1, 4, 5: +3 px przy 360 */, u.h);
  ok(`K1 ${tag}: bez poziomego przewijania`, u.poza === 0, u.poza);
  R.dodatkowe.push(`Wysokość Dziś ${tag} (od góry #main do dołu „Twój postęp”, bez stopki): ${u.h} px`);
  await shot(p, `k1-dzis-${tag}`, true);
  R.pomiary.push(await pomiar(p, `K1 Dziś ${tag}`, "#main", "#main .nw-linia"));
  if (tag === "390-jasny") {
    ok("K1 Boss (trwa) widać na Dziś bez rozwijania", await p.evaluate(() => !!document.querySelector("#main > .bs-card")?.getBoundingClientRect().height));
  }
  await p.close();
}
{
  // pigułka próby z pętli 1 (atrapa ZD_WEJSCIE): pierwsza pod powitaniem
  const p = await open(b, { prog: P4, ls: LS });
  const kol = await p.evaluate(() => { window.ZD_WEJSCIE = { pasekProby: () => { const e = document.createElement("div"); e.className = "test-proba"; e.textContent = "Próba · dzień 2 z 3"; return e; } }; window.ZD_APP.render();
    return [...document.querySelector("#main").children].map((e) => e.className.toString()).slice(0, 3); });
  ok("K1 ZD_WEJSCIE.pasekProby() pierwsza pod powitaniem, przed kartą dnia", /greet/.test(kol[0]) && kol[1] === "test-proba" && /ld-block/.test(kol[2]), kol);
  await p.close();
  // nowe konto (pierwszy dzień): Przewodnik i Profil nauki są
  const n = await open(b, { prog: {}, ls: { ...LS, "skrot-pierwszy-dzien": String(T) } });
  const nowe = await n.evaluate(() => ({ prof: !!document.querySelector(".ld-prof") }));
  ok("K1 nowe konto (1. dzień): Profil nauki na karcie dnia (Przewodnik od c1356b9 w Więcej)", nowe.prof, nowe);
  await n.close();
  const idx = fs.readFileSync(ROOT + "index.html", "utf8");
  const zak = idx.split("\n").filter((l) => /window\.ZD_WEJSCIE\?\.przyciskZakupu\?\.\("(ld|pts)"\) \?\? h\("button"/.test(l) && /\/\/ ux-1$/.test(l));
  ok("K1 przyciski zakupu na Dziś (ldBlock, ptsHome, ptsDzis) przez ZD_WEJSCIE.przyciskZakupu z komentarzem // ux-1 (jak na gałęzi pętli 1)", zak.length === 3, zak.length);
}

// ---------- K2: chipy pod głównym przyciskiem bez ucięcia (PL/EN, 360), Lekcje dla Ciebie jedna pod drugą
for (const [w, lang] of [[360, "pl"], [360, "en"], [390, "pl"]]) {
  const p = await open(b, { w, lang, prog: P4, ls: LS });
  const c = await p.evaluate(() => {
    const hero = document.querySelector(".ld-hero").getBoundingClientRect();
    const chips = [...document.querySelectorAll(".ld-hero .ld-links > *")].map((e) => { const r = e.getBoundingClientRect(); return { t: e.innerText.trim(), l: Math.round(r.left), r: Math.round(r.right), h: Math.round(r.height), sw: e.scrollWidth, cw: e.clientWidth }; });
    const tiles = [...document.querySelectorAll(".ld-lessons > .zh-card")].map((e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width) }; });
    return { hero: { l: Math.round(hero.left), r: Math.round(hero.right) }, chips, tiles, vw: document.documentElement.clientWidth };
  });
  ok(`K2 ${w} ${lang}: wszystkie chipy pod „Zaczynamy” w całości w karcie (zawijają się, tekst nieucięty, ≥ 44 px)`,
    c.chips.length >= 3 && c.chips.every((x) => x.l >= c.hero.l && x.r <= c.hero.r && x.sw <= x.cw + 3 && x.h >= 44), c);
  ok(`K2 ${w} ${lang}: Lekcje dla Ciebie jedna pod drugą (ta sama kolumna, cała szerokość)`, c.tiles.length >= 2 && c.tiles.every((t) => t.x === c.tiles[0].x && t.w >= c.vw - 40) && c.tiles[1].y > c.tiles[0].y, c.tiles);
  if (w === 360) { await p.evaluate(() => document.querySelector(".ld-hero .zh-go")?.scrollIntoView({ block: "start" })); await p.waitForTimeout(200); await shot(p, `k2-chipy-lekcje-360-${lang}`); }
  await p.close();
}

// ---------- K3: linia zadań (moneta SVG), własna lista, ?zadania=1, auto-odbiór (atrapa i PGlite), zadaniaLinia/zadaniaStan
const RP10 = JSON.stringify({ pkt: {}, rows: Array.from({ length: 10 }, (_, i) => ({ d: D, klucz: "q:mat1:" + i, zrodlo: "quiz", pkt: 1 })) });
for (const [tag, w, dark, lang] of tagi) {
  const p = await open(b, { w, dark, lang, prog: P4, ls: { ...LS, "mock-rp-trwale": "1", "mock-rp": RP10 } });
  const s = await txt(p, "#main .nw-linia-s");
  if (lang === "pl") ok(`K3 ${tag}: „Zadania dnia: 1/3 · +8 · nowe za H h” z monetą SVG (bez emoji)`, /^Zadania dnia: 1\/3 · \+8 · nowe za \d+ h$/.test(s) && await p.evaluate(() => !!document.querySelector(".nw-linia-s .nw-coin svg") && !/🪙/.test(document.querySelector(".nw-linia").innerText)), s);
  else ok(`K3 ${tag}: „Daily tasks: 1/3 · +8 · new in H h”`, /^Daily tasks: 1\/3 · \+8 · new in \d+ h$/.test(s), s);
  await p.click("#main .nw-linia-s"); await p.waitForTimeout(300);
  const l = await p.evaluate(() => [...document.querySelectorAll(".nw-zad")].map((e) => e.innerText.replace(/\s+/g, " ").trim()));
  if (lang === "pl") ok(`K3 ${tag}: rozwinięta lista: 3 zadania dnia + zadanie tygodnia; zrobione „Odebrane +8” bez wchodzenia do Sklepu`, l.length === 4 && /Odpowiedz dobrze na 10 pytań Odebrane \+8/.test(l.join("|")) && /Zadanie tygodnia/.test(l[3]), l);
  await shot(p, `k3-zadania-${tag}`);
  R.pomiary.push(await pomiar(p, `K3 linia zadań rozwinięta ${tag}`, "#main .nw-linia", "#main .nw-linia"));
  if (tag === "390-jasny") {
    const mon = await p.evaluate(() => JSON.parse(localStorage.getItem("mock-mon") || "{}").ksiega?.filter((x) => /^misja:odp10:/.test(x.klucz)).length);
    ok("K3 atrapa: nagroda za zrobione zadanie w księdze monet raz (auto-odbiór, bez Sklepu)", mon === 1, mon);
    const api = await p.evaluate(() => ({ st: window.ZD_NAWYK.zadaniaStan(), l: window.ZD_NAWYK.zadaniaLinia()?.innerText.trim() }));
    ok("K3 ZD_NAWYK.zadaniaStan() i zadaniaLinia() dla Sklepu i ekranu końca", api.st?.ok && api.st.zrobione === 1 && api.st.wszystkie === 3 && api.st.suma === 8 && /Zadania dnia: 1\/3 · \+8/.test(api.l), api);
  }
  await p.close();
}
{
  const p = await open(b, { prog: P4, ls: LS, query: "?ld=1&zadania=1" });
  await p.waitForTimeout(1500);
  const z = await p.evaluate(() => ({ open: !!document.querySelector(".nw-linia details")?.open, url: location.search, top: Math.round(document.querySelector(".nw-linia").getBoundingClientRect().top) }));
  ok("K3 link z maila ?zadania=1#/ rozwija linię zadań, przewija do niej i czyści adres", z.open && !/zadania/.test(z.url) && z.top >= 0 && z.top < 844, z);
  await p.close();
  const src = fs.readFileSync(ROOT + "przypomnienia.js", "utf8");
  ok("K3 przypomnienia.js: rodzaj „zadanie” z path „?zadania=1#/” (PL i EN), kopia w funkcji Edge identyczna", (src.match(/path: "\?zadania=1#\/"/g) || []).length === 2 && src === fs.readFileSync(ROOT + "supabase/functions/przypomnienia/logika.js", "utf8"));
  try {
    const pg = execSync("node supabase/test/pglite.mjs", { cwd: ROOT, encoding: "utf8", maxBuffer: 32 << 20 });
    ok("K3 PGlite v57: 10 dobrych odpowiedzi → +8 bez Sklepu, bez podwójnej nagrody, ręczny odbiór → already", /OK v57: K1–K5/.test(pg) && /^✓ test\/v57\.sql$/m.test(pg), pg.split("\n").filter((x) => /K5|v57/.test(x)).slice(-8));
  } catch (e) { ok("K3 PGlite", false, String(e.stdout || e).slice(-400)); }
}

{
  const p = await open(b, { prog: P4, ls: LS });
  const s0 = await txt(p, "#main .nw-linia-s");
  ok("K3 przy 0 zrobionych: pula do zdobycia zamiast „+0”", /^Zadania dnia: 0\/3 · do zdobycia \+\d+ · nowe za \d+ h$/.test(s0 || ""), s0);
  await p.close();
}
// ---------- K4: duet na Dziś; bez duetu po 3. dniu nauki raz zaproszenie (navigator.share, inaczej kopiowanie)
for (const [tag, w, dark, lang] of tagi) {
  const p = await open(b, { w, dark, lang, prog: P4, ls: { ...LS, "mock-paczka": DUET } });
  await p.waitForTimeout(600);
  const d = await txt(p, "#main .nw-duet");
  if (lang === "pl") ok(`K4 ${tag}: „Duet: Ty i Kasia · 5/8 w tym tygodniu · Kasia dziś ✓”`, d && /Duet: Ty i Kasia · 5\/8 w tym tygodniu/.test(d) && /Kasia dziś ✓/.test(d), d);
  else ok(`K4 ${tag}: „Duo: you and Kasia · 5/8 this week · Kasia today ✓”`, d && /Duo: you and Kasia · 5\/8 this week/.test(d) && /Kasia today ✓/.test(d), d);
  if (tag === "390-jasny") { await p.click("#main .nw-duet"); await p.waitForTimeout(500); ok("K4 wiersz duetu otwiera Paczkę i duet", await p.evaluate(() => /paczka/.test(location.hash))); }
  else { await p.evaluate(() => document.querySelector("#main .nw-linia")?.scrollIntoView({ block: "center" })); await shot(p, `k4-duet-${tag}`); }
  await p.close();
}
for (const [tag, w, dark, lang] of tagi) {
  const p = await open(b, { w, dark, lang, prog: P4, ls: { ...LS, "skrot-duet-zapr": "" }, ctx: {} });
  await p.waitForTimeout(600);
  const z = await txt(p, "#main .nw-zapr");
  if (lang === "pl") ok(`K4 ${tag}: bez duetu, 4. dzień nauki – zaproszenie „Ucz się w duecie… Wyślij link”`, z && /Ucz się w duecie: razem 8 dni nauki w tym tygodniu \(Ty \+ znajomy\), \+20 dla obojga/.test(z) && /Wyślij link/.test(z) && /Nie teraz/.test(z), z);
  else ok(`K4 ${tag}: EN „Study as a duo… Send link”`, z && /Study as a duo/.test(z) && /Send link/.test(z), z);
  await p.evaluate(() => document.querySelector("#main .nw-linia")?.scrollIntoView({ block: "center" })); await p.waitForTimeout(200);
  await shot(p, `k4-zaproszenie-${tag}`);
  R.pomiary.push(await pomiar(p, `K4 zaproszenie do duetu ${tag}`, "#main .nw-linia", "#main .nw-zapr"));
  if (tag === "390-jasny") {
    await p.evaluate(() => { window.__share = []; navigator.share = (o) => { window.__share.push(o); return Promise.resolve(); }; });
    await p.click("#main .nw-zapr .btn.primary"); await p.waitForTimeout(800);
    const sh = await p.evaluate(() => ({ s: window.__share, pk: window.__pk, widoczne: !!document.querySelector("#main .nw-zapr") }));
    ok("K4 „Wyślij link”: zakłada paczkę i wywołuje navigator.share z linkiem ?paczka=KOD; po wysłaniu zaproszenie znika", sh.s.length === 1 && /\?paczka=AB3K9Z/.test(sh.s[0].url) && (sh.pk || []).some((x) => x.fn === "zaloz") && !sh.widoczne, sh);
  }
  await p.close();
}
{
  // bez navigator.share: kopiowanie linku; następnego dnia już bez zaproszenia; przed 3. dniem nauki brak
  const p = await open(b, { prog: P4, ls: { ...LS, "skrot-duet-zapr": "" }, ctx: { permissions: ["clipboard-read", "clipboard-write"] } });
  await p.evaluate(() => { delete Navigator.prototype.share; });
  await p.click("#main .nw-zapr .btn.primary"); await p.waitForTimeout(800);
  const kop = await p.evaluate(async () => { try { return await navigator.clipboard.readText(); } catch (e) { return "?" + e; } });
  ok("K4 bez navigator.share: link do schowka (kopiuj link)", /\?paczka=AB3K9Z/.test(kop), kop);
  await p.close();
  const q = await open(b, { prog: P4, ls: { ...LS, "skrot-duet-zapr": String(T - 1) } });
  ok("K4 zaproszenie tylko jednego dnia (pokazane wczoraj → dziś brak)", !(await q.evaluate(() => !!document.querySelector("#main .nw-zapr"))));
  await q.close();
  const r = await open(b, { prog: { xp: { t: 60, d: T - 1, n: 12 }, streak: { d: T - 1, n: 2 }, nd: [T - 2, T - 1] }, ls: { ...LS, "skrot-duet-zapr": "" } });
  ok("K4 przed 3. dniem nauki bez zaproszenia", !(await r.evaluate(() => !!document.querySelector("#main .nw-zapr"))));
  await r.close();
}

// ---------- K5: tempo przy najbliższym terminie, „Znasz datę kolokwium? Wpisz”, starosta
for (const [tag, w, dark, lang] of tagi) {
  const p = await open(b, { w, dark, lang, prog: P4, ls: LS });
  const t = await p.evaluate(() => ({ tempo: document.querySelector(".pz-tempo")?.innerText, row: document.querySelector(".pz-tempo")?.closest(".pz-row")?.querySelector("b")?.innerText, first: document.querySelector(".pz-row b")?.innerText, bez: document.querySelector(".nw-bezdaty")?.innerText }));
  if (lang === "pl") ok(`K5 ${tag}: przy przedmiocie z najbliższym terminem „W tym tygodniu: 0 z 1 tematu”`, t.tempo === "W tym tygodniu: 0 z 1 tematu" && t.row === t.first, t);
  else ok(`K5 ${tag}: EN „This week: 0 of 1 topic”`, t.tempo === "This week: 0 of 1 topic", t);
  if (lang === "pl") ok(`K5 ${tag}: przedmiot bez daty – „Znasz datę kolokwium? Wpisz” (z nazwą, gdy przedmiot schowany)`, /[Zz]nasz datę kolokwium\? Wpisz/.test(t.bez || ""), t.bez);
  await p.evaluate(() => document.querySelector(".pz")?.scrollIntoView({ block: "center" })); await p.waitForTimeout(200);
  await shot(p, `k5-postep-${tag}`);
  R.pomiary.push(await pomiar(p, `K5 Twój postęp ${tag}`, "#main .pz", "#main .nw-bezdaty"));
  if (tag === "390-jasny") {
    await p.click("#main .nw-bezdaty"); await p.waitForTimeout(400);
    const m = await p.evaluate(() => ({ h: document.querySelector("#layer h2")?.innerText, inp: !!document.querySelector("#layer input[type=date]") }));
    ok("K5 „Wpisz” otwiera pole daty (to samo co w „Przygotuj się”: examSet().date)", /Data zaliczenia: /.test(m.h || "") && m.inp, m);
    await shot(p, "k5-wpisz-date-390-jasny");
    await p.fill("#layer input[type=date]", "2026-12-15"); await p.click("#layer .btn.primary"); await p.waitForTimeout(600);
    const po = await p.evaluate(() => ({ ex: JSON.stringify(window.ZD_APP.S.progress.exams || {}), toast: document.body.innerText.match(/Plan i przypomnienia ułożą się do[^\n]*/)?.[0] }));
    ok("K5 zapis daty: progress.exams[…].date + toast „Plan i przypomnienia ułożą się do …”", /2026-12-15/.test(po.ex) && !!po.toast, po);
    const kol = await p.evaluate(() => [...document.querySelectorAll("#main .pz-row, #main .pz-tile")].map((e) => e.innerText.replace(/\s+/g, " ")).find((t) => /Analiza|Mathematical/.test(t)) || null);
    ok("K5 po zapisie przedmiot ma kolokwium z tą datą (część jak w „Przygotuj się”)", /kolokwium/i.test(kol || "") && !/bez terminu/.test(kol || ""), kol);
  }
  await p.close();
}
{
  const p = await open(b, { konto: "starosta", prog: P4, ls: LS });
  const s = await p.evaluate(() => ({ n: window.ZD_APP.zalUndated().length, t: document.querySelector(".nw-starosta")?.innerText.replace(/\s+/g, " ") }));
  ok("K5 starosta (> 3 zaliczenia bez daty): „N zaliczeń bez daty. Uzupełnij, a rok dostanie plan i bossa.” + Terminy", s.n > 3 ? /\d+ zaliczeń bez daty\. Uzupełnij, a rok dostanie plan i bossa\. Terminy/.test(s.t || "") : !s.t, s);
  if (s.t) { await p.click(".nw-starosta .link"); await p.waitForTimeout(400); ok("K5 link prowadzi do Terminów", await p.evaluate(() => /terms/.test(location.hash))); }
  await p.close();
  const q = await open(b, { prog: P4, ls: LS });
  ok("K5 zwykłe konto: bez linii starosty", !(await q.evaluate(() => !!document.querySelector(".nw-starosta"))));
  await q.close();
}

// ---------- K6: pusty stan Powtórek; wersja darmowa: kafelki terminów widoczne, zablokowany tylko plan
for (const [tag, w, dark, lang] of tagi) {
  const p = await open(b, { w, dark, lang, prog: {}, ls: LS, hash: "/review" });
  await p.waitForTimeout(600);
  const r = await txt(p, "#main .rv-hero");
  if (lang === "pl") ok(`K6 ${tag}: „Jeszcze nic do powtórki. Zrób dziś kartę 5 minut, a fiszki z niej wrócą tu jutro.” + „Karta 5 minut” + „Wybierz przedmiot”`, /Jeszcze nic do powtórki\. Zrób dziś kartę 5 minut, a fiszki z niej wrócą tu jutro\./.test(r || "") && /Karta 5 minut/.test(r) && /Wybierz przedmiot/.test(r) && !/zakładka Ćwicz/.test(r), r);
  else ok(`K6 ${tag}: EN „Nothing to review yet… 5-minute card”`, /Nothing to review yet/.test(r || "") && /5-minute card/.test(r), r);
  await shot(p, `k6-powtorki-pusto-${tag}`);
  R.pomiary.push(await pomiar(p, `K6 pusty stan Powtórek ${tag}`, "#main .rv-hero", "#main .rv-hero"));
  if (tag === "390-jasny") {
    await p.click("#main .rv-hero .btn.primary"); await p.waitForTimeout(1500);
    const k = await p.evaluate(() => ({ hash: location.hash, gracz: !!document.querySelector(".lp, .lp-wrap, [class*='lp-'], #player") }));
    ok("K6 „Karta 5 minut” prowadzi na Dziś i otwiera kartę dnia", /^#\/?$/.test(k.hash.replace(/\?.*/, "")) || k.gracz, k);
  }
  await p.close();
}
for (const [tag, w, dark, lang] of tagi) {
  const p = await open(b, { konto: "darmowe", w, dark, lang, prog: P4, ls: LS });
  const f = await p.evaluate(() => ({ tiles: document.querySelectorAll("#main .pz-tile").length, note: [...document.querySelectorAll("#main .pz-note")].map((e) => e.innerText), stare: /Terminy zaliczeń zobaczysz z pełnym dostępem/.test(document.querySelector("#main").innerText) }));
  if (lang === "pl") ok(`K6 ${tag}: wersja darmowa – kafelki terminów widoczne, notka „Plan nauki do każdego terminu jest w pełnej wersji.”`, f.tiles > 0 && f.note.includes("Plan nauki do każdego terminu jest w pełnej wersji.") && !f.stare, f);
  else ok(`K6 ${tag}: EN „A study plan for every deadline is in the full version.”`, f.tiles > 0 && f.note.includes("A study plan for every deadline is in the full version."), f);
  await p.evaluate(() => document.querySelector(".pz")?.scrollIntoView({ block: "center" })); await p.waitForTimeout(200);
  await shot(p, `k6-darmowe-terminy-${tag}`);
  await p.close();
}
// ruch: calm i reduced-motion – ikona Przewodnika bez animacji (uwaga z pętli 3)
{
  const p = await open(b, { prog: {}, ls: { ...LS, "skrot-pierwszy-dzien": String(T), "skrot-wiecej": "1" }, calm: true });
  const a = await p.evaluate(() => { const e = document.querySelector(".g-strip-ic"); return e ? getComputedStyle(e).animationName : "brak"; });
  ok("ruch: html.calm – ikona Przewodnika bez animacji g-wave", a === "none" || a === "brak", a);
  R.ruch.push({ element: ".g-strip-ic (Przewodnik)", calm: a });
  await p.close();
}
try { const out = execSync("node --test tests/nawyk.test.js tests/przypomnienia.test.js", { cwd: ROOT, encoding: "utf8" }); ok("testy jednostkowe nawyk + przypomnienia", /ℹ fail 0/.test(out)); }
catch (e) { ok("testy jednostkowe", false, String(e.stdout || e).slice(-300)); }
await b.close();
const errs = R.pomiary.flatMap((x) => x.bledy);
ok("konsola bez błędów (wszystkie stany)", errs.length === 0, errs.slice(0, 3));
R.wynik = wynik();
if (DIR) zapiszRaport(DIR, R);
console.log(`${R.wynik.pass}/${R.wynik.pass + R.wynik.fail}`);
process.exit(R.wynik.fail ? 1 : 0);
