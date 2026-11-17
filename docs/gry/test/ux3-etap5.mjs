// UX-3 etap 5: ekran końca mówi prawdę i prowadzi dalej: „z pierwszej próby” liczy tylko pierwsze próby, tytuł i mina według
// wyniku, „Powtórz błędne (N)”, jeden pełny ekran końca lekcji (między częściami krótka karta), „Następna lekcja”, karta 5 min
// domyka dzień (ZD_NAWYK albo pasek celu), XP raz, bez „+0” i „—”, linia „3. gwiazdka”.
// BASE=http://127.0.0.1:8813/ node docs/gry/test/ux3-etap5.mjs
import { chromium, open, startLesson, tester, goToCard, answer, shotsDir, noHScroll, docs as docs0, docsWith, lesson } from "./ux3-lib.mjs";
const HS = (s) => { let x = 2166136261; for (const ch of String(s)) { x ^= ch.codePointAt(0); x = Math.imul(x, 16777619) >>> 0; } return x.toString(36); };
import { open as openDzis } from "./h2-lib.mjs";
const { ok, end } = tester();
const SH = shotsDir();
const b = await chromium.launch();
const shot = async (p, n) => { if (SH) await p.screenshot({ path: `${SH}/${n}.png` }); };
const cur = (p) => p.evaluate(() => { const A = window.ZD_APP, c = A.LP.open ? A.lpCur() : null; return c ? { id: c.id, type: c.type, again: !!c.again, check: !!c.check, exit: !!c.exit, done: A.LP.st.ans[c.id] != null, bite: A.LP.st.bite } : null; });
// Przejście całej lekcji. bad(c) = odpowiedz źle na tę kartę. Liczy pełne ekrany końca i karty przejścia.
const bez = async (p) => { for (let i = 0; i < 3 && await p.locator("#layer .scrim").count(); i++) { await p.keyboard.press("Escape"); await p.waitForTimeout(400); } };
async function lessonRun(p, bad = () => false, onStep) {
  let full = 0, steps = 0, lastFull = null, confAt = [], lvAt = [];
  for (let i = 0; i < 120; i++) {
    if (await p.locator("#layer .lvup").count()) { lvAt.push(full ? "final" : "mid"); await p.keyboard.press("Escape"); await p.waitForTimeout(300); }
    if (await p.locator(".lp-confetti").count()) confAt.push(await p.locator(".lp-done-screen").count() ? "full" : "step");
    if (await p.locator(".lp-step").count()) { steps++; if (onStep) await onStep(steps); await p.locator(".lp-bottom .lp-cta").click(); await p.waitForTimeout(450); continue; }
    if (await p.locator(".lp-done-screen").count()) { full++; lastFull = await p.locator(".lp-done-screen").innerText(); break; }
    const c = await cur(p); if (!c) { await p.waitForTimeout(200); continue; }
    if ((c.type === "mc" || c.type === "hook") && !c.done) { if (c.type === "hook") { await p.locator(".lp-opts .opt").first().click(); await p.waitForTimeout(200); } else await answer(p, !bad(c), 1); }
    const cta = p.locator(".lp-bottom .lp-cta:not([disabled]):not([hidden])");
    if (await cta.count()) { await cta.click(); await p.waitForTimeout(420); } else await p.waitForTimeout(250);
  }
  return { full, steps, lastFull, confAt, lvAt };
}

// K3 + K4 + K6: pełna lekcja U1 (rozgrzewka z 1 karty dołączona do części 1), U2 niezrobiona → „Następna lekcja: Lekcja 2…”
{
  const p = await open(b, { w: 390, h: 844, progress: { xp: { t: 95, d: 0, n: 0 } } });
  await startLesson(p);
  const deck = await p.evaluate(() => window.ZD_APP.LP.deck.bites.map((x) => x.kind + ":" + x.cards.length));
  ok("K3 rozgrzewka (≤ 2 karty) bez osobnej części", !deck.some((x) => x.startsWith("warm")), deck);
  let stepShot = false;
  const r = await lessonRun(p, () => false, async (k) => { if (!stepShot) { stepShot = true; await shot(p, "390-karta-przejscia"); const t = await p.locator(".lp-step").innerText(); ok("K3 karta przejścia: „Część k z n ✓” + „+XP · wynik z pierwszej próby”, bez Stasia", /Część \d z \d ✓/.test(t) && /\+\d+ XP · \d\/\d z pierwszej próby/.test(t) && !(await p.locator(".lp-step .stas-face").count()), t); } });
  ok("K3 dokładnie 1 pełny ekran końca, między częściami karty przejścia", r.full === 1 && r.steps >= 3, r);
  ok("K3 konfetti tylko na finale", !r.confAt.includes("step"), r.confAt);
  ok("K3 okno awansu dopiero na finale", !r.lvAt.includes("mid"), r.lvAt);
  await p.waitForTimeout(1500);
  await shot(p, "390-koniec-lekcji");
  await p.waitForTimeout(2200);
  const m = await p.evaluate(() => { const s = document.querySelector(".lp-done-screen"); return { cta: document.querySelector(".lp-cta").textContent.trim(), sec: [...s.querySelectorAll(".lp-actions .btn")].map((x) => x.textContent.trim()), xpN: (s.innerText.match(/XP/g) || []).length, tiles: [...s.querySelectorAll(".lp-stat b")].map((x) => x.textContent.trim()), rk: !!s.querySelector(".lp-rank") }; });
  ok("K4 główny przycisk „Następna lekcja: Lekcja 2: Podaż →”", m.cta === "Następna lekcja: Lekcja 2: Podaż →", m.cta);
  ok("K4 „Wróć do mapy lekcji” jako drugorzędny", m.sec.includes("Wróć do mapy lekcji"), m.sec);
  ok("K6 bez kafli „+0” i „—”", !m.tiles.some((t) => t === "+0" || t === "—"), m.tiles);
  ok("K6 pasek poziomu jest, XP bez powtórek (najwyżej 2 wystąpienia „XP”: licznik i pasek)", m.rk && m.xpN <= 2, m);
  const lvFinal = await p.locator("#layer .lvup").count();
  ok("K3 okno awansu pokazane na finale (przekroczony próg w tej lekcji)", lvFinal === 1, lvFinal);
  await shot(p, "390-awans-na-finale");
  for (let i = 0; i < 3 && await p.locator("#layer .scrim").count(); i++) { await p.keyboard.press("Escape"); await p.waitForTimeout(400); }
  await p.locator(".lp-bottom .lp-cta").click(); await p.waitForTimeout(1500);
  const nx = await p.evaluate(() => window.ZD_APP.LP.open ? window.ZD_APP.LP.m?.id : null);
  ok("K4 „Następna lekcja” otwiera odtwarzacz lekcji U2", nx === "U2", nx);
  ok("bez błędów (lekcja)", p.errors.length === 0, p.errors);
  await p.close();
}
// K6: 2 gwiazdki → linia „3. gwiazdka …” z „Popraw część k”; K4 bez następnej lekcji → „Powtórki: N kart”
{
  const p = await open(b, { w: 390, h: 844, hash: "/material/U2", progress: { done: { U1: 1 }, srs: { "U1:abc": [1, 0] } } });
  await startLesson(p);
  const r = await lessonRun(p, (c) => c.check && c.bite === 2 && !c.again);
  await p.waitForTimeout(1900); await bez(p); await shot(p, "390-koniec-2-gwiazdki");
  const t = await p.locator(".lp-done-screen").innerText();
  ok("K6 przy < 3 gwiazdkach linia „3. gwiazdka: … (masz 75%)”", /3\. gwiazdka: bilet 3\/3 i co najmniej 80% pytań w częściach za pierwszym razem \(masz 75%\)\./.test(t), t.slice(0, 400));
  ok("K6 przycisk „Popraw część 2”", (await p.locator(".lp-done-screen .lp-actions .btn").filter({ hasText: /^Popraw część \d/ }).count()) === 1, "");
  ok("K6 przy 2 gwiazdkach Staś bez pełnej radości", (await p.locator(".lp-done-screen .stas-face").getAttribute("data-mood")) !== "ok", "");
  const cta = (await p.locator(".lp-cta").textContent()).trim();
  ok("K4 bez następnej lekcji, z kartami na dziś: „Powtórki: N kart”", /^Powtórki: \d+ (karta|karty|kart)$/.test(cta), cta);
  await bez(p); await p.locator(".lp-bottom .lp-cta").click(); await p.waitForTimeout(1200);
  ok("K4 „Powtórki: N kart” przenosi do Powtórek", await p.evaluate(() => !window.ZD_APP.LP.open && /review/.test(location.hash)), await p.evaluate(() => location.hash));
  ok("bez błędów (2 gwiazdki)", p.errors.length === 0, p.errors);
  await p.close();
}
// K4: niezdany bilet → „Spróbuj biletu jeszcze raz”
{
  const p = await open(b, { w: 360, h: 640 });
  await startLesson(p);
  await lessonRun(p, (c) => c.exit);
  await p.waitForTimeout(1900); await bez(p); await shot(p, "360-koniec-niezdany");
  const cta = (await p.locator(".lp-cta").textContent()).trim(), t = await p.locator(".lp-done-screen").innerText();
  ok("K4 niezdany bilet: główny „Spróbuj biletu jeszcze raz”", cta === "Spróbuj biletu jeszcze raz", cta);
  ok("K2 słaby wynik: tytuł bez „✓”, Staś „oops” albo „think”", !/✓/.test(t.split("\n")[0]) && /oops|think/.test(await p.locator(".lp-done-screen .stas-face").getAttribute("data-mood")), t.slice(0, 120));
  const hs = await noHScroll(p); ok("bez przewijania w bok (koniec)", hs.sw <= hs.w, hs);
  await p.close();
}
// K1: lekcja: błąd w części 2 + dobra druga szansa → karta przejścia części 2 „1/2”? (część ma 1 pytanie: „0/1” + „+1 poprawione w drugiej szansie” w następnej)
{
  const p = await open(b, { w: 390, h: 844 });
  await startLesson(p);
  const seen = [];
  await lessonRun(p, (c) => c.check && c.bite === 1 && !c.again, async () => seen.push(await p.locator(".lp-step").innerText()));
  ok("K1 karta przejścia części z błędem: „0/1 z pierwszej próby”", seen.some((t) => /0\/1 z pierwszej próby/.test(t)), seen);
  ok("K1 „+1 poprawione w drugiej szansie” przy części z drugą szansą", seen.some((t) => /\+1 poprawione w drugiej szansie/.test(t)), seen);
  await p.close();
}
// K1: część z 2 pytaniami (pułapka prawda/fałsz + kontrola): dobra pułapka, zła kontrola → „1/2”, druga szansa w części 3 → „+1 poprawione (z części 2)”
{
  const L = lesson(4); L.sections[1].mistake = { wrong: "Wyższa cena zawsze zwiększa popyt.", right: "Wyższa cena zwykle zmniejsza popyt.", why: "Prawo popytu." };
  const d = docsWith([["U1", "Lekcja 1: Popyt i cena", L], ["U2", "Lekcja 2: Podaż", lesson(4)]]);
  const p = await open(b, { w: 390, h: 844, docs: d, ls: { "bm-dzwieki": "0" } });
  await startLesson(p);
  const seen = [];
  for (let i = 0; i < 80 && seen.length < 3; i++) {
    await bez(p);
    if (await p.locator(".lp-step").count()) { seen.push(await p.locator(".lp-step").innerText()); if (seen.length === 2) await shot(p, "390-karta-czesc2-1z2"); await p.locator(".lp-bottom .lp-cta").click(); await p.waitForTimeout(450); continue; }
    const c = await cur(p); if (!c) { await p.waitForTimeout(200); continue; }
    if (c.type === "tf" && !c.done) { const truth = await p.evaluate(() => window.ZD_APP.lpCur().truth); await p.locator(".lp-two .opt").nth(truth ? 0 : 1).click(); await p.waitForTimeout(350); }
    else if (c.type === "hook" && !c.done) { await p.locator(".lp-opts .opt").first().click(); await p.waitForTimeout(200); }
    else if (c.type === "mc" && !c.done) await answer(p, !(c.check && c.bite === 1 && !c.again), 1);
    const cta = p.locator(".lp-bottom .lp-cta:not([disabled]):not([hidden])"); if (await cta.count()) { await cta.click(); await p.waitForTimeout(420); }
  }
  ok("K1 karta przejścia części 2: „1/2 z pierwszej próby”", /1\/2 z pierwszej próby/.test(seen[1] || ""), seen);
  ok("K1 karta części 3: „+1 poprawione w drugiej szansie (z części 2)”", /\+1 poprawione w drugiej szansie \(z części 2\)/.test(seen[2] || ""), seen);
  ok("bez błędów (1/2)", p.errors.length === 0, p.errors);
  await p.close();
}
// K1: Powtórki: 1 karta, najpierw „Nie pamiętam”, potem dobrze w drugiej szansie → „0/1 z pierwszej próby” + „+1 poprawione”
{
  const fl = [{ q: "Fiszka jedna: co to jest popyt?", a: "Ilość, którą kupujący chcą kupić." }];
  const d = docsWith([["U1", "Lekcja 1: Fiszki", lesson(1)]]); d.materialContent.U1.flashcards = fl; d.materials.U1.flashcardCount = 1;
  const p = await open(b, { w: 390, h: 844, docs: d, hash: "/review", progress: { srs: { ["U1:" + HS(fl[0].q)]: [1, 0] } } });
  await p.locator(".rv-hero .sk-start").click(); await p.waitForTimeout(900);
  for (let k = 0; k < 2; k++) { await p.locator(".lp-bottom .lp-cta").filter({ hasText: /Odwróć/ }).click(); await p.waitForTimeout(350); await p.locator(".lp-bottom .sk-grade4 .opt").nth(k === 0 ? 0 : 2).click(); await p.waitForTimeout(700); }
  for (let i = 0; i < 5 && !(await p.locator(".lp-done-screen").count()); i++) { const c = p.locator(".lp-bottom .lp-cta:not([disabled]):not([hidden])"); if (await c.count()) await c.click(); await p.waitForTimeout(500); }
  await p.waitForTimeout(1200); await bez(p);
  const t = await p.locator(".lp-done-screen").innerText().catch(() => "");
  await shot(p, "390-powtorki-koniec");
  ok("ekran końca Powtórek: w dolnym pasku tylko główny przycisk (bez ocen ostatniej fiszki)", (await p.locator(".lp-bottom .sk-grade4").count()) === 0, "");
  ok("K1 Powtórki: 1 karta źle, potem dobrze → „0/1 z pierwszej próby” i „+1 poprawione w drugiej szansie”", /0\/1 z pierwszej próby/.test(t) && /\+1 poprawione w drugiej szansie/.test(t), t.slice(0, 300));
  ok("bez błędów (Powtórki)", p.errors.length === 0, p.errors);
  await p.close();
}
// K5 + K1 + K2 + K6: karta „Dziś · 5 min” — bez ZD_NAWYK (pasek celu z LP_DAILY_GOAL) i z atrapą ZD_NAWYK; zły i dobry wynik
const NAWYK = () => {
  const mk = (cls, t) => { const d = document.createElement("div"); d.className = "nawyk-test " + cls; d.textContent = t; return d; };
  window.ZD_NAWYK = { ekranSerii: () => mk("n-seria", "Seria +1: 4 dni"), ofertaZamrozenia: () => mk("n-zam", "Chroń serię: zamrożenie za 40"), celDnia: () => ({ xp: 18, cel: 30 }), jutro: () => mk("n-jutro", "Jutro: Całki, 5 min"), ofertaPrzypomnienia: () => mk("n-przyp", "Przypomnieć Ci jutro?"), zadaniaLinia: () => mk("n-zad", "Zadania dnia: 1 z 3") };
};
for (const v of [{ n: "bez-nawyku-zle", bad: true }, { n: "nawyk-zle", bad: true, nawyk: true }, { n: "nawyk-dobrze", bad: false, nawyk: true }, { n: "ciemny-dobrze", bad: false, dark: true }]) {
  const p = await openDzis(b, { w: 390, h: 844, dark: v.dark });
  if (v.nawyk) await p.evaluate(NAWYK);
  else await p.evaluate(() => { delete window.ZD_NAWYK; }); // po scaleniu z pętlą 2 nawyk.js jest: wariant „bez ZD_NAWYK” go usuwa
  await p.locator(".zh-hero .zh-go").click(); await p.locator(".lp").waitFor({ timeout: 15000 }); await p.waitForTimeout(800);
  for (let i = 0; i < 40 && !(await p.locator(".lp-done-screen").count()); i++) {
    const opt = p.locator(".lp-opts .opt:not([disabled]):not(.sel)").filter({ hasText: v.bad ? /Zła/ : /Dobra|Dobrze/ }).first();
    if (await opt.count()) { await opt.click({ timeout: 3000 }).catch(() => {}); await p.waitForTimeout(100); const ck = p.locator('.lp-bottom [data-conf="1"]:not([disabled]), .lp-bottom .lp-cta:not([disabled]):not([hidden])').filter({ hasText: /^(Sprawdź|Pewny)/ }).first(); if (await ck.count()) await ck.click({ timeout: 3000 }).catch(() => {}); await p.waitForTimeout(300); }
    const any = p.locator(".lp-opts .opt:not([disabled])").first();
    if (!(await opt.count()) && await any.count() && !(await p.locator(".lp[data-fb]").count())) { await any.click({ timeout: 3000 }).catch(() => {}); await p.waitForTimeout(100); const ck = p.locator('.lp-bottom [data-conf="1"]:not([disabled]), .lp-bottom .lp-cta:not([disabled]):not([hidden])').filter({ hasText: /^(Sprawdź|Pewny)/ }).first(); if (await ck.count()) await ck.click({ timeout: 3000 }).catch(() => {}); await p.waitForTimeout(300); }
    const w = p.locator(".lp-bottom .lp-barx .btn.primary"); if (await w.count()) { await w.click({ timeout: 3000 }).catch(() => {}); await p.waitForTimeout(400); continue; }
    const cta = p.locator(".lp-bottom .lp-cta:not([disabled]):not([hidden])"); if (await cta.count()) { await cta.click({ timeout: 3000 }).catch(() => {}); await p.waitForTimeout(400); }
    else { const sk = p.locator(".lp-bottom .ld-skip:not([hidden])"); if (await sk.count()) { await sk.click(); await p.waitForTimeout(400); } }
  }
  await p.waitForTimeout(1300);
  await shot(p, `390-dzis-koniec-${v.n}`);
  const m = await p.evaluate(() => { const s = document.querySelector(".lp-done-screen"); if (!s) return null; const kids = [...s.children].map((e) => e.className || e.tagName); const btns = [...document.querySelectorAll(".lp-done-screen button:not(.rk):not([aria-hidden]), .lp-bottom .lp-cta:not([hidden])")].filter((e) => e.offsetParent && !e.closest("details:not([open])") && !e.closest(".nawyk-test")); return { kids, mood: s.querySelector(".stas-face")?.dataset.mood, title: s.querySelector("h2")?.textContent, cta: document.querySelector(".lp-cta").textContent.trim(), first: s.querySelector(".lp-actions .btn")?.textContent.trim(), btns: btns.map((x) => x.textContent.trim()), det: !!s.querySelector("details.lp-det"), detTxt: s.querySelector("details.lp-det")?.textContent || "", goal: s.querySelector(".lp-goalbar")?.innerText || "", order: [...s.querySelectorAll(".lp-stas, h2, .n-seria, .n-zam, .lp-goalbar, .n-jutro, .n-przyp, .n-zad")].map((e) => e.className.split(" ").find((c) => /^(lp-stas|n-|lp-goalbar)/.test(c)) || e.tagName), xp: window.ZD_APP.LP.st.xp, tiles: [...s.querySelectorAll(".lp-stat b")].map((x) => x.textContent.trim()) }; });
  ok(`${v.n}: ekran końca karty 5 min`, !!m, m);
  if (!m) { await p.close(); continue; }
  if (v.nawyk) ok(`${v.n}: K5 kolejność: Staś + tytuł → seria → zamrożenie → cel dnia → jutro → przypomnienie → zadania`, JSON.stringify(m.order) === JSON.stringify(["lp-stas", "H2", "n-seria", "n-zam", "lp-goalbar", "n-jutro", "n-przyp", "n-zad"]), m.order);
  else ok(`${v.n}: K5 bez ZD_NAWYK: Staś + tytuł → pasek celu z LP_DAILY_GOAL`, JSON.stringify(m.order) === JSON.stringify(["lp-stas", "H2", "lp-goalbar"]) && /Cel dnia: \d+\/\d+ XP|Cel dnia ✓/.test(m.goal), m);
  ok(`${v.n}: K5 jeden główny przycisk „Jeszcze 5 min do celu” / „Gotowe na dziś”`, /^(Jeszcze 5 min do celu|Gotowe na dziś)$/.test(m.cta), m.cta);
  ok(`${v.n}: K5 wynik i passa w zwijanych „Szczegółach”`, m.det && /z pierwszej próby/.test(m.detTxt), m.detTxt.slice(0, 200));
  ok(`${v.n}: K5 premia +10 XP za kartę dnia (XP ≥ 10 nawet przy złych odpowiedziach)`, m.xp >= 10, m.xp);
  if (v.bad) {
    ok(`${v.n}: K2 słaby wynik: tytuł „Dobrze, że to wyszło teraz, a nie na kolokwium”, Staś „oops”`, m.title === "Dobrze, że to wyszło teraz, a nie na kolokwium" && m.mood === "oops", m);
    ok(`${v.n}: K2 pierwszy przycisk „Powtórz błędne (N)”`, /^Powtórz błędne \(\d+\)$/.test(m.first || ""), m.first);
    ok(`${v.n}: najwyżej 2 przyciski na widoku (główny + „Powtórz błędne”)`, m.btns.length <= 2, m.btns);
  } else {
    ok(`${v.n}: K2 dobry wynik: „Świetnie! ✓”, Staś „ok”, bez „Powtórz błędne”`, m.title === "Świetnie! ✓" && m.mood === "ok" && !/Powtórz błędne/.test(m.first || ""), m);
  }
  ok(`${v.n}: K6 bez kafli „+0” i „—”`, !m.tiles.some((t) => t === "+0" || t === "—"), m.tiles);
  if (!v.bad && !v.dark && v.nawyk && m.cta === "Jeszcze 5 min do celu") {
    const ctaBg = await p.locator(".lp-bottom .lp-cta").evaluate((e) => getComputedStyle(e).backgroundColor);
    ok(`${v.n}: K5 główny przycisk zielony (primary)`, ctaBg === "rgb(26, 127, 69)", ctaBg);
    await p.locator(".lp-bottom .lp-cta").click(); await p.waitForTimeout(1500);
    ok(`${v.n}: K5 „Jeszcze 5 min do celu” prowadzi do nauki (lekcja dnia albo Powtórki)`, await p.evaluate(() => window.ZD_APP.LP.open || /review/.test(location.hash)), await p.evaluate(() => location.hash));
  }
  if (v.bad && !v.nawyk) {
    await p.locator(".lp-done-screen .lp-actions .btn").first().click(); await p.waitForTimeout(1200);
    const rv = await p.evaluate(() => ({ open: window.ZD_APP.LP.open, kind: window.ZD_APP.LP.src?.kind, n: window.ZD_APP.lpCards().filter((c) => c.type !== "title").length }));
    ok(`${v.n}: K2 „Powtórz błędne” uruchamia błędne pytania tej sesji`, rv.open && rv.kind === "review" && rv.n >= 1, rv);
  }
  ok(`${v.n}: bez błędów`, p.errors.length === 0, p.errors);
  await p.close();
}
await b.close();
end();
