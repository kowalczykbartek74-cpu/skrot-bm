// UX-3 etap 3: zaznacz → Sprawdź, „Zgaduję / Pewny ✓” w dolnym pasku, klawiatura, pewność do rewanży, druga szansa później
// (w następnej części, jako luka), przyciski recall/swipe/grade4 w dolnym pasku, bank pojęć bez darmowego XP.
// BASE=http://127.0.0.1:8813/ node docs/gry/test/ux3-etap3.mjs
import { chromium, open, startLesson, tester, goToCard, answer, shotsDir, noHScroll, docsWith, lesson, lessonBold, docsBold } from "./ux3-lib.mjs";
const { ok, end } = tester();
const SH = shotsDir();
const b = await chromium.launch();
const shot = async (p, n) => { if (SH) await p.screenshot({ path: `${SH}/${n}.png` }); };
const cur = (p) => p.evaluate(() => { const A = window.ZD_APP, c = A.LP.open ? A.lpCur() : null; return c ? { id: c.id, type: c.type, again: !!c.again, bite: A.LP.st.bite, ans: A.LP.st.ans[c.id], conf: A.LP.st.conf?.[c.id], xp: A.LP.st.xp } : null; });
const isCheck = (c) => c.type === "mc" && c.check && !c.again && !c.done;
const isExit = (c) => c.type === "mc" && c.exit && !c.done;
const lowBar = (p) => p.evaluate(() => [...document.querySelectorAll(".lp-bottom button:not([hidden])")].filter((e) => e.offsetParent).map((e) => ({ t: e.innerText.replace(/\s+/g, "").trim() === "" ? e.textContent.trim() : e.innerText.replace(/\n+/g, "").trim(), top: Math.round(e.getBoundingClientRect().top), h: Math.round(e.getBoundingClientRect().height), w: Math.round(e.getBoundingClientRect().width), dis: e.disabled, vh: innerHeight })));
const SPY = () => { const w = () => { const R = window.SKROT_REW; if (!R) return setTimeout(w, 20); if (R.__spy) return; R.__spy = true; window.__rew = []; const z = R.zapisac; R.zapisac = function (b, score, ...r) { window.__rew.push(score); return z.call(this, b, score, ...r); }; }; w(); };

// K1: zaznaczenie, zmiana wyboru, Sprawdź; klawiatura 1–4 + Enter
{
  const p = await open(b, {});
  await startLesson(p); await goToCard(p, isCheck);
  const c0 = await cur(p);
  let bar = await lowBar(p);
  ok("K1 przed wyborem „Sprawdź” nieaktywne, na dole", bar.some((x) => x.t === "Sprawdź" && x.dis && x.top > x.vh * 0.75), bar);
  await p.locator(".lp-opts .opt").filter({ hasText: "Błędnie" }).first().click(); await p.waitForTimeout(200);
  const c1 = await cur(p);
  ok("K1 klik w opcję tylko ją zaznacza (.opt.sel, bez odpowiedzi, bez werdyktu)", c1.ans == null && (await p.locator(".lp-opts .opt.sel").count()) === 1 && !(await p.locator(".lp[data-fb]").count()), c1);
  await shot(p, "360-zaznaczona");
  await p.locator(".lp-opts .opt").filter({ hasText: "Właściwie" }).first().click(); await p.waitForTimeout(200);
  ok("K1 wybór można zmienić", (await p.locator(".lp-opts .opt.sel").innerText()).includes("Właściwie"), "");
  await p.locator(".lp-bottom .lp-cta").filter({ hasText: "Sprawdź" }).click(); await p.waitForTimeout(400);
  ok("K1 „Sprawdź” zatwierdza", (await cur(p)).ans === 0 && (await p.locator(".lp[data-fb=ok]").count()) === 1, await cur(p));
  await p.locator(".lp-bottom .lp-cta").click(); await p.waitForTimeout(400);
  await goToCard(p, isCheck);
  await p.keyboard.press("2"); await p.waitForTimeout(200);
  const k1 = await cur(p);
  await p.keyboard.press("Enter"); await p.waitForTimeout(400);
  const k2 = await cur(p);
  ok("K1 klawiatura: 2 zaznacza, Enter sprawdza", k1.ans == null && (await p.locator(".lp-opts .opt.sel, .lp-opts .opt.right, .lp-opts .opt.wrong").count()) >= 1 && k2.ans != null, { k1, k2 });
  ok("bez błędów (K1)", p.errors.length === 0, p.errors);
  await p.close();
}
// K1 + K2: „Zgaduję / Pewny ✓” na bilecie, G, pewność zapisana, zgadnięta dobra → rewanż
{
  const p = await open(b, { init: SPY });
  await startLesson(p);
  const e = await goToCard(p, isExit, 60);
  ok("doszliśmy do biletu", !!e, e);
  let bar = await lowBar(p);
  const g = bar.find((x) => x.t === "Zgaduję"), s = bar.find((x) => x.t === "Pewny ✓");
  ok("K1 dwa przyciski „Zgaduję” / „Pewny ✓” w dolnym pasku, ≥ 48 px, nieaktywne do wyboru", g && s && g.dis && s.dis && g.h >= 48 && s.h >= 48 && g.top > g.vh * 0.75, bar);
  ok("K1 bez starych chipów pewności w karcie", (await p.locator(".lp-card .lp-confrow").count()) === 0, "");
  await p.locator(".lp-opts .opt").filter({ hasText: "Tak, przy" }).click(); await p.waitForTimeout(200);
  bar = await lowBar(p);
  await shot(p, "360-bilet-pewnosc");
  ok("K1 po wyborze oba aktywne", bar.filter((x) => /Zgaduję|Pewny/.test(x.t)).every((x) => !x.dis), bar);
  await p.keyboard.press("g"); await p.waitForTimeout(400);
  const c = await cur(p);
  ok("K1 + K2 klawisz G = „Zgaduję”, conf = 0 zapisane", c.ans === 0 && c.conf === 0, c);
  await p.locator(".lp-bottom .lp-cta").click(); await p.waitForTimeout(400);
  // reszta biletu: „Pewny ✓”
  for (let i = 0; i < 2; i++) { const x = await goToCard(p, isExit, 5); if (!x) break; await answer(p, true, 1); const y = await cur(p); if (i === 0) ok("K2 „Pewny ✓” zapisuje conf = 1", y.conf === 1, y); await p.locator(".lp-bottom .lp-cta").click(); await p.waitForTimeout(400); }
  await p.waitForTimeout(500);
  const rew = await p.evaluate(() => window.__rew || []);
  ok("K2 dobra odpowiedź zgadnięta (conf 0) trafia do rewanży (rewAnswer z wynikiem 0)", rew.filter((x) => x === 0).length >= 1, rew);
  ok("bez błędów (K2)", p.errors.length === 0, p.errors);
  await p.close();
}
// K3: błąd na kontroli części 2 (ostatnia karta części) → druga szansa nie od razu; „Poprawna:” od razu; w części 3 po ≥ 2 kartach
for (const v of [{ n: "abcd", docs: undefined }, { n: "luka", docs: docsBold }]) {
  const p = await open(b, { docs: v.docs });
  await startLesson(p);
  await goToCard(p, isCheck); await answer(p, true); await p.locator(".lp-bottom .lp-cta").click(); await p.waitForTimeout(400);
  await goToCard(p, isCheck); const c2 = await cur(p);
  await answer(p, false);
  const fbt = await p.locator(".lp-fbar").innerText();
  ok(`${v.n}: K3 przy błędzie od razu „Poprawna:” i zapowiedź drugiej szansy później`, /Poprawna:/.test(fbt) && /wróci/.test(fbt), fbt.slice(0, 200));
  await shot(p, `360-${v.n}-blad-czesc2`);
  // licz karty z treścią do drugiej szansy
  const seq = [];
  for (let i = 0; i < 25; i++) {
    const cta = p.locator(".lp-bottom .lp-cta:not([disabled]):not([hidden])");
    if (await cta.count()) { await cta.click(); await p.waitForTimeout(420); }
    const c = await cur(p);
    if (!c) { seq.push("ekran"); continue; }
    if (c.again) { seq.push("AGAIN:" + c.type + ":" + c.bite); break; }
    if (c.type !== "title") seq.push(c.type + ":" + c.bite);
    if ((c.type === "mc") && c.ans == null) await answer(p, true);
    if (c.type === "recall" && c.ans == null) { const bank = p.locator(".lp-bank .opt"); if (await bank.count()) { await bank.first().click(); await p.locator(".lp-bottom .lp-cta").filter({ hasText: "Sprawdź" }).click(); await p.waitForTimeout(300); } }
  }
  const ai = seq.findIndex((x) => x.startsWith("AGAIN")), between = seq.slice(0, ai).filter((x) => x !== "ekran").length;
  ok(`${v.n}: K3 druga szansa ≥ 2 karty po błędzie, w następnej części (nie jako kolejna karta)`, ai > 0 && between >= 2 && !seq[0].startsWith("AGAIN") && +seq[ai].split(":")[2] > c2.bite, { seq, bite: c2?.bite });
  if (v.n === "luka") ok("luka: K3 druga szansa jako luka z bankiem pojęć zamiast tego samego ABCD", seq[ai]?.startsWith("AGAIN:recall"), seq[ai]);
  await shot(p, `360-${v.n}-druga-szansa`);
  // dobra druga szansa → „Teraz siedzi.”
  if (v.n === "luka") { const right = await p.evaluate(() => window.ZD_APP.lpCur().answer); await p.locator(".lp-bank .opt").filter({ hasText: right }).click(); await p.locator(".lp-bottom .lp-cta").filter({ hasText: "Sprawdź" }).click(); }
  else await answer(p, true);
  await p.waitForTimeout(400);
  ok(`${v.n}: K3 sukces drugiej szansy „Teraz siedzi.”`, /Teraz siedzi\./.test(await p.locator(".lp-fbar .v").innerText()), await p.locator(".lp-fbar .v").innerText());
  ok(`${v.n}: bez błędów (K3)`, p.errors.length === 0, p.errors);
  await p.close();
}
// K5: bank pojęć (≥ 3 pojęcia) i samoocena bez XP (< 3 pojęć)
{
  const p = await open(b, { docs: docsBold });
  await startLesson(p);
  const r = await goToCard(p, (c) => c.type === "recall" && !c.done);
  ok("K5 karta „Szybkie przypomnienie” w lekcji z ≥ 3 pojęciami", !!r, r);
  const n = await p.locator(".lp-bank .opt").count();
  ok("K5 3 przyciski-pojęcia pod luką", n === 3, n);
  await shot(p, "360-bank");
  const x0 = (await cur(p)).xp;
  const right = await p.evaluate(() => window.ZD_APP.lpCur().answer);
  await p.locator(".lp-bank .opt").filter({ hasNotText: right }).first().click(); await p.waitForTimeout(150);
  ok("K5 wybór pojęcia tylko zaznacza", (await cur(p)).ans == null, "");
  await p.locator(".lp-bottom .lp-cta").filter({ hasText: "Sprawdź" }).click(); await p.waitForTimeout(400);
  ok("K5 złe pojęcie → data-fb=no, bez XP", (await p.locator(".lp[data-fb=no]").count()) === 1 && (await cur(p)).xp === x0, await cur(p));
  await shot(p, "360-bank-zle");
  const bb = await p.locator(".lp-bank .opt").evaluateAll((x) => x.map((e) => Math.round(e.getBoundingClientRect().height)));
  ok("K5 przyciski banku ≥ 44 px", bb.every((h) => h >= 44), bb);
  ok("bez błędów (K5 bank)", p.errors.length === 0, p.errors);
  await p.close();
}
{
  const few = docsWith([["U1", "Lekcja 1", { ...lessonBold(), sections: lessonBold().sections.slice(0, 2) }]]);
  const p = await open(b, { docs: few });
  await startLesson(p);
  const r = await goToCard(p, (c) => c.type === "recall" && !c.done);
  ok("K5/K4 < 3 pojęć: karta samooceny", !!r && (await p.locator(".lp-bank").count()) === 0, r);
  await p.locator(".lp-bottom .lp-cta").filter({ hasText: "Pokaż odpowiedź" }).click(); await p.waitForTimeout(300);
  const bar = await lowBar(p);
  await shot(p, "360-recall-samoocena");
  ok("K4 recall: „Nie wiedziałem / Wiedziałem” w dolnym pasku (top > 0,75 × wysokość), nie w karcie", bar.filter((x) => /wiedziałem/i.test(x.t)).length === 2 && bar.filter((x) => /wiedziałem/i.test(x.t)).every((x) => x.top > x.vh * 0.75 && x.h >= 44) && (await p.locator(".lp-card .lp-row button").count()) === 0, bar);
  const x0 = (await cur(p)).xp;
  await p.locator(".lp-bottom button").filter({ hasText: /^Wiedziałem$/ }).click(); await p.waitForTimeout(500);
  const x1 = await p.evaluate(() => window.ZD_APP.LP.st.xp);
  ok("K5 „Wiedziałem” bez XP za samą samoocenę", x1 === x0, { x0, x1 });
  ok("bez błędów (samoocena)", p.errors.length === 0, p.errors);
  await p.close();
}
// K4: seria fiszek (swipe) i oceny Powtórek (grade4) w dolnym pasku; krótkie etykiety przy 360 px
{
  const fl = Array.from({ length: 5 }, (_, i) => ({ q: `Fiszka ${i + 1}: co to jest pojęcie numer ${i + 1}?`, a: `Odpowiedź ${i + 1}.` }));
  const L = lesson(1);
  const d = docsWith([["U1", "Lekcja 1: Fiszki", L]]); d.materialContent.U1.flashcards = fl; d.materials.U1.flashcardCount = 5;
  const hs = (s) => { let x = 2166136261; for (const ch of String(s)) { x ^= ch.codePointAt(0); x = Math.imul(x, 16777619) >>> 0; } return x.toString(36); };
  const srs = Object.fromEntries(fl.map((f) => ["U1:" + hs(f.q), [1, 0]]));
  for (const w of [360, 390]) {
    const p = await open(b, { docs: d, w, h: w === 360 ? 640 : 844 });
    await startLesson(p);
    const s = await goToCard(p, (c) => c.type === "swipe", 30);
    ok(`${w}: doszliśmy do serii fiszek`, !!s, s);
    if (s) {
      await p.locator(".lp-bottom .lp-cta").filter({ hasText: "Odwróć" }).click(); await p.waitForTimeout(500);
      const bar = await lowBar(p);
      await shot(p, `${w}-swipe`);
      ok(`${w}: K4 swipe: „← Nie wiem / Wiem →” w dolnym pasku`, bar.filter((x) => /Nie wiem|Wiem →/.test(x.t)).length === 2 && bar.every((x) => x.top > x.vh * 0.75), bar);
    }
    await p.close();
    const q = await open(b, { docs: d, w, h: w === 360 ? 640 : 844, hash: "/review", progress: { srs } });
    await q.locator(".rv-hero .sk-start").click(); await q.waitForTimeout(800);
    const g = await goToCard(q, (c) => c.type === "grade4", 5);
    ok(`${w}: doszliśmy do oceny w Powtórkach`, !!g, g);
    if (g) {
      await q.locator(".lp-bottom .lp-cta").filter({ hasText: "Odwróć" }).click(); await q.waitForTimeout(400);
      const bar = await lowBar(q);
      await shot(q, `${w}-grade4`);
      ok(`${w}: K4 grade4: 4 oceny w dolnym pasku (top > 0,75 × wysokość, ≥ 52 px), nie w karcie`, bar.length === 4 && bar.every((x) => x.top > x.vh * 0.75 && x.h >= 52) && (await q.locator(".lp-card .sk-grade4").count()) === 0, bar);
      if (w === 360) ok("360: K4 krótkie etykiety ocen", bar.map((x) => x.t.replace(/^\d/, "")).join("|") === "Nie|Trudne|Pamiętam|Łatwe", bar.map((x) => x.t));
      const h2 = await noHScroll(q); ok(`${w}: bez przewijania w bok (oceny)`, h2.sw <= h2.w, h2);
      await q.keyboard.press("3"); await q.waitForTimeout(500);
      ok(`${w}: K4 klawisz 3 ocenia (Pamiętam)`, (await q.evaluate(() => Object.values(window.ZD_APP.LP.st.ans).includes(2))), "");
    }
    ok(`${w}: bez błędów (fiszki, Powtórki)`, q.errors.length === 0, q.errors);
    await q.close();
  }
}
// EN: Guessing / Sure
{
  const p = await open(b, { lang: "en" });
  await startLesson(p); await goToCard(p, isExit, 60);
  await p.locator(".lp-opts .opt").first().click(); await p.waitForTimeout(200);
  const t = (await lowBar(p)).map((x) => x.t);
  ok("EN: „Guessing” i „Sure ✓”", t.some((x) => /Guess/i.test(x)) && t.includes("Sure ✓"), t);
  await shot(p, "390-en-pewnosc");
  ok("EN: bez błędów", p.errors.length === 0, p.errors);
  await p.close();
}
await b.close();
end();
