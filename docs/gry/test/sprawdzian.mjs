// Etap 9 specu „Systemy z Zdawalni w Skrócie”: mini-sprawdziany i „Pewny / Zgaduję”. Zegar: czwartek 5.11.2026, 18:00.
//   A. quiz: chipy „Pewny / Zgaduję” tylko przy 1. i 4. pytaniu; zgadnięte dobre → rewanż, licznik pewności, zdarzenie nauki,
//   B. test próbny: chipy przy co 3. pytaniu zamkniętym, zgadnięte dobre → rewanż po oddaniu,
//   C. Profil nauki: „Gdy mówisz „Pewny”, masz rację w X%” od 20 odpowiedzi (mniej → ile jeszcze),
//   D. Dziś: umiesz ≥ 70% zakresu → „Sprawdź się”, „Później” chowa na 3 dni,
//   E. 6 niewidzianych pytań, zdany → odznaka przy przedmiocie, bez punktów rankingu (nauka_rp_odpowiedz),
//   F. niezdany → tematy do powtórki; G. za mało niewidzianych → brak propozycji; H. inny przedmiot rocznika + EN.
// BASE=http://127.0.0.1:8811/ node docs/gry/test/sprawdzian.mjs
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 700)]);
const UID = "00000000-0000-4000-8000-000000000001";
const now = new Date("2026-11-05T18:00:00+01:00").getTime();
const day = Math.round((new Date(2026, 10, 5) - new Date(2026, 0, 1)) / 864e5);
const OPT = ["Pierwsza", "Druga", "Trzecia", "Czwarta"];
const quiz = (tag, n = 4) => Array.from({ length: n }, (_, i) => ({ q: `${tag}: pytanie ${i}?`, options: OPT, correct: i % 4, why: "Bo tak." }));
const mat = (sid, title, n = 4, t = 1) => ({ subjectId: sid, title, quizCount: n, flashcardCount: 0, createdAt: now - t * 1e6, v: 2 });
function docsOf(sid, n = 4, tags = ["Alfa", "Beta", "Gamma"]) {
  const materials = {}, materialContent = {};
  tags.forEach((t, i) => { materials["m" + i] = mat(sid, `Temat ${t}`, n, i + 1); materialContent["m" + i] = { v: 2, summary: "x", quiz: quiz(t, n), flashcards: [] }; });
  materials.q1 = mat("mikroekonomia", "Popyt", 6, 9); materialContent.q1 = { v: 2, summary: "x", quiz: quiz("Mikro", 6), flashcards: [] };
  return { materials, materialContent };
}
const mastered = (ids) => Object.fromEntries(ids.map((id) => [id, { ok: true, score: 3, total: 3, at: now - 864e5, weak: [] }]));
const zdarzenia = (p, kind) => p.evaluate((k) => [...(window.__rpc || []).filter((x) => x.fn === "nauka_zdarzenia_zapisz").flatMap((x) => x.args?.p_zdarzenia || []), ...JSON.parse(localStorage.getItem("bm-learn-q") || "[]")].filter((e) => e?.dane?.kind === k).map((e) => ({ typ: e.typ, ...e.dane })), kind);
const progOf = (p) => p.evaluate((u) => JSON.parse(localStorage.getItem("mock-progress") || "{}")[u] || {}, UID);
async function strona(docs, prog, o = {}) {
  const p = await page(b, { konto: "platne", lang: o.lang || "pl", w: o.w, h: o.h, ls: { "mock-docs": JSON.stringify(docs), "mock-progress": JSON.stringify({ [UID]: { group: "C111", sub: "A", ...prog } }), ...(o.ls || {}) } });
  await p.clock.install({ time: new Date(now + (o.dzien || 0) * 864e5) });
  await p.goto(BASE + "index.html#/" + (o.hash || "")); await p.waitForTimeout(2500);
  return p;
}
async function wybierz(p, want, zle = false) {
  const opts = p.locator(".lp-opts .opt"); await opts.first().waitFor({ timeout: 5000 });
  const n = await opts.count();
  for (let i = 0; i < n; i++) { const t = await opts.nth(i).textContent(), orig = OPT.findIndex((w) => t.includes(w)); if (zle ? orig !== want : orig === want) { await opts.nth(i).click(); return orig; } }
  throw new Error("brak opcji");
}
const idxOf = async (p) => +(await p.locator(".lp-big.q").first().textContent()).match(/pytanie (\d)/)[1];
async function dalej(p) { await p.locator(".lp-cta").click({ timeout: 4000 }).catch(() => {}); await p.waitForTimeout(400); }
// Przejdź talię: zle(i) = czy odpowiedzieć źle na i-tą kartę, conf(i) = 1/0/null (klik chipa przed odpowiedzią). Zwraca, przy których kartach były chipy.
async function przejdz(p, { zle = () => false, conf = () => null, max = 8 } = {}) {
  const chips = [];
  for (let i = 0, g = 0; i < max && g < 20; g++) {
    // Przerwa między częściami („Start →”): dalej; koniec talii: stop.
    if (!(await p.locator(".lp-opts .opt").count())) { if (await p.locator(".lp-done-screen").count() || !(await p.locator(".lp-cta:visible").count())) break; await dalej(p); continue; }
    i++;
    const has = (await p.locator(".lp-confrow").count()) > 0; chips.push(has);
    const c = conf(i - 1); if (has && c != null) { await p.locator(`.lp-conf[data-conf="${c}"]`).click(); await p.waitForTimeout(150); }
    await wybierz(p, (await idxOf(p)) % 4, zle(i - 1)); await p.waitForTimeout(250); await dalej(p);
  }
  return chips;
}

// ---------- A. quiz materiału ----------
{
  const docs = docsOf("makroekonomia", 5, ["Alfa"]); // 5 pytań = jedna część (bez przerwy)
  const p = await strona(docs, {}, { hash: "material/m0" });
  await p.getByRole("button", { name: /Quiz/ }).first().click();
  await p.getByRole("button", { name: /Zaczynamy/ }).click(); await p.waitForTimeout(700);
  await shot(p, "e9-quiz-chipy");
  const chips = await przejdz(p, { conf: (i) => (i === 0 ? 0 : i === 3 ? 1 : null), max: 5 });
  ok("A: chipy przy 1. i 4. pytaniu, nie przy pozostałych", JSON.stringify(chips) === JSON.stringify([true, false, false, true, false]), chips);
  await p.waitForTimeout(500); await p.clock.runFor(3500);
  const pr = await progOf(p);
  ok("A: licznik pewności: 1× Zgaduję (dobrze), 1× Pewny (dobrze)", JSON.stringify(pr.kal) === JSON.stringify({ s: [1, 1], g: [1, 1] }), pr.kal);
  const rewKeys = Object.keys(pr.rew || {});
  ok("A: zgadnięte dobre pytanie czeka na rewanż (wynik 0), pewne dobre nie", rewKeys.length === 1 && pr.rew[rewKeys[0]][0][1] === 0, pr.rew);
  const ev = await zdarzenia(p, "pewnosc");
  ok("A: dwa zdarzenia nauki „pewnosc” (activity, quiz, 0 i 1)", ev.length === 2 && ev.every((e) => e.typ === "activity" && e.zrodlo === "quiz") && ev.map((e) => e.pewny).join() === "0,1", ev);
  const odp = await p.evaluate(() => (window.__rpc || []).filter((x) => x.fn === "nauka_rp_odpowiedz").length);
  ok("A: punkty rankingu bez zmian: 5 odpowiedzi w nauka_rp_odpowiedz", odp === 5, odp);
  ok("A: bez błędów JS", !p.errors.length, p.errors);
  await p.context().close();
}

// ---------- B. test próbny (zapis runu jak w przygotuj-sie.mjs) ----------
{
  const docs = docsOf("makroekonomia", 6, ["Alfa"]);
  const items = Array.from({ length: 5 }, (_, i) => ({ id: `q:m0:${i}`, type: "abcd", mid: "m0", q: `Alfa: pytanie ${i}?`, options: OPT, correct: i % 4, n: i + 1, p: 1 }));
  const run = { key: "makroekonomia-W", sid: "makroekonomia", part: "W", phase: "test", kind: "full", tmpl: { min: 45, pass: 50 }, start: now - 6e4, end: now + 3e6, items, ans: {}, marks: {}, flags: {} };
  const p = await strona(docs, {}, { hash: "exam/makroekonomia", ls: { "bm-exam-run": JSON.stringify(run) } });
  if (!(await p.locator(".lp-opts .opt").count())) await p.locator("button:has-text('Pokaż jako listę'), button:has-text('Wróć do testu')").first().click().catch(() => {});
  await p.waitForTimeout(600);
  const chips = [];
  for (let i = 0; i < 5; i++) {
    chips.push((await p.locator(".lp-confrow").count()) > 0);
    if (i === 0) { await p.locator('.lp-conf[data-conf="0"]').click(); await shot(p, "e9-test-chipy"); }
    if (i === 3) await p.locator('.lp-conf[data-conf="1"]').click();
    await wybierz(p, i % 4, i === 3); await p.waitForTimeout(200);
    if (i < 4) await dalej(p);
  }
  ok("B: chipy przy 1. i 4. pytaniu zamkniętym", JSON.stringify(chips) === JSON.stringify([true, false, false, true, false]), chips);
  const r = await p.evaluate(() => JSON.parse(localStorage.getItem("bm-exam-run") || "null"));
  ok("B: pewność w runie (run.conf)", JSON.stringify(r?.conf) === JSON.stringify({ "q:m0:0": 0, "q:m0:3": 1 }), r?.conf);
  await p.locator(".lp-cta").click(); await p.waitForTimeout(300);
  await p.locator(".modal button:has-text('Oddaj'), dialog button:has-text('Oddaj')").first().click(); await p.waitForTimeout(1500);
  await p.locator("button:has-text('Pokaż wynik')").first().click().catch(() => {}); await p.waitForTimeout(1200);
  await p.clock.runFor(3500);
  const pr = await progOf(p);
  ok("B: zgadnięte dobre (q:m0:0) i błędne (q:m0:3) → rewanże", pr.rew?.["z:m0:0"]?.[0]?.[1] === 0 && pr.rew?.["z:m0:3"]?.[0]?.[1] === 0 && !pr.rew?.["z:m0:1"], pr.rew);
  ok("B: licznik: Zgaduję dobrze, Pewny źle", JSON.stringify(pr.kal) === JSON.stringify({ s: [1, 0], g: [1, 1] }), pr.kal);
  ok("B: bez błędów JS", !p.errors.length, p.errors);
  await p.context().close();
}

// ---------- C. Profil nauki ----------
for (const [kal, re, name] of [[{ s: [16, 12], g: [10, 3] }, /Gdy mówisz „Pewny”, masz rację w 75% odpowiedzi\.[\s\S]*trafiasz w 30%/, "od 20"], [{ s: [8, 6], g: [4, 1] }, /Jeszcze 8 odpowiedzi z wybranym „Pewny” albo „Zgaduję”/, "poniżej 20"]]) {
  for (const lang of name === "od 20" ? ["pl", "en"] : ["pl"]) for (const w of name === "od 20" ? [375, 1280] : [375]) {
    const p = await strona({ materials: {}, materialContent: {} }, { kal }, { hash: "learn", lang, w, h: 900 });
    const txt = await p.locator(".kal-card").innerText().catch(() => "");
    if (lang === "pl") ok(`C: karta „Pewny” ${name} (${w})`, re.test(txt), txt);
    else ok(`C: karta po angielsku (${w})`, /When you say “Sure”, you are right in 75% of answers/.test(txt) && !/[ąćęłńóśźż]/i.test(txt), txt);
    if (name === "od 20") { await p.locator(".kal-card").scrollIntoViewIfNeeded(); await shot(p, `e9-profil-${lang}-${w}`); }
    ok(`C: bez błędów JS (${lang} ${w})`, !p.errors.length, p.errors);
    await p.context().close();
  }
}

// ---------- D–E. Dziś: propozycja, „Później”, zdany sprawdzian ----------
const docs3 = docsOf("makroekonomia", 4);
const prog3 = { mastery: mastered(["m0", "m1", "m2"]) };
let keyD = null;
{
  const p = await strona(docs3, prog3);
  const hero = await p.locator(".sk-now").innerText();
  ok("D: Dziś proponuje mini-sprawdzian (umiesz 100% ≥ 70%)", /Mini-sprawdzian/i.test(hero) && /Sprawdź się/.test(hero) && /6 nowych pytań/.test(hero), hero);
  await p.locator(".spr-later").click(); await p.waitForTimeout(400); await p.clock.runFor(3500);
  const pr = await progOf(p);
  keyD = Object.keys(pr.spr || {})[0];
  ok("D: „Później” zapisuje propozycję odłożoną o 3 dni", keyD?.startsWith("makroekonomia|") && pr.spr[keyD][0].status === "offered" && pr.spr[keyD][0].snoozed_until === day + 3, pr.spr);
  ok("D: po „Później” karta znika", !/Mini-sprawdzian/i.test(await p.locator(".sk-now").innerText()));
  ok("D: bez błędów JS", !p.errors.length, p.errors);
  await p.context().close();
  const p2 = await strona(docs3, { ...prog3, spr: pr.spr }, { dzien: 3 });
  ok("D: po 3 dniach propozycja wraca", /Sprawdź się/.test(await p2.locator(".sk-now").innerText()));
  await p2.context().close();
}
for (const [lang, w] of [["pl", 375], ["pl", 1280], ["en", 375], ["en", 1280]]) {
  const p = await strona(docs3, prog3, { lang, w, h: 900 });
  await shot(p, `e9-dzis-${lang}-${w}`);
  if (lang === "en") { const t = await p.locator(".sk-now").innerText(); ok(`D: Dziś po angielsku (${w})`, /Mini-check/i.test(t) && /Check yourself/.test(t) && !/[ąćęłńóśźż]/i.test(t.replace(/Makroekonomia/g, "")), t); }
  await p.context().close();
}
{
  const p = await strona(docs3, prog3);
  const odp0 = await p.evaluate(() => (window.__rpc || []).filter((x) => x.fn === "nauka_rp_odpowiedz").length);
  await p.locator(".sk-now .sk-start").click(); await p.waitForTimeout(1500);
  await shot(p, "e9-spr-start");
  const chips = await przejdz(p, { conf: (i) => (i === 0 ? 1 : null), zle: (i) => i === 5 });
  ok("E: 6 pytań, chipy przy 1. i 4.", JSON.stringify(chips) === JSON.stringify([true, false, false, true, false, false]), chips);
  await p.waitForTimeout(600);
  const done = await p.locator(".lp-done-screen").innerText().catch(() => "");
  ok("E: 5/6 → „Poziom potwierdzony”", /Poziom potwierdzony/.test(done) && /5\/6/.test(done), done);
  await shot(p, "e9-spr-zdany");
  await p.clock.runFor(3500);
  const pr = await progOf(p), rec = pr.spr?.[Object.keys(pr.spr)[0]]?.slice(-1)[0];
  ok("E: rekord zdany, 6 różnych pytań, bez widzianych", rec?.status === "passed" && rec.ok === 5 && rec.tot === 6 && rec.completed_on === day, rec);
  const seen = await p.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("bm-q-seen") || "{}")).length);
  ok("E: 6 pytań oznaczonych jako widziane", seen === 6, seen);
  ok("E: błędne pytanie w rewanżach", Object.values(pr.rew || {}).filter((h) => h[0][1] === 0).length === 1, pr.rew);
  const odp1 = await p.evaluate(() => (window.__rpc || []).filter((x) => x.fn === "nauka_rp_odpowiedz").length);
  ok("E: bez punktów rankingu (żadnego nauka_rp_odpowiedz)", odp1 === odp0, [odp0, odp1]);
  const evs = await zdarzenia(p, "sprawdzian");
  ok("E: zdarzenie nauki „sprawdzian” z wynikiem", evs.length === 1 && evs[0].ok === 5 && evs[0].total === 6 && evs[0].zdany === true, evs);
  await p.locator(".lp-cta").click().catch(() => {}); await p.waitForTimeout(500);
  ok("E: po zdanym nie ma kolejnej propozycji", !/Mini-sprawdzian/i.test(await p.locator(".sk-now").innerText()));
  ok("E: bez błędów JS", !p.errors.length, p.errors);
  await p.context().close();
  for (const [lang, w] of [["pl", 375], ["pl", 1280], ["en", 375], ["en", 1280]]) {
    const q = await strona(docs3, { ...prog3, spr: pr.spr, rew: pr.rew }, { hash: "subject/makroekonomia", lang, w, h: 900 });
    const t = await q.locator("main").innerText();
    ok(`E: odznaka przy przedmiocie (${lang} ${w})`, lang === "pl" ? /Poziom potwierdzony sprawdzianem/.test(t) : /Level confirmed by a check/.test(t), t.slice(0, 300));
    await shot(q, `e9-przedmiot-${lang}-${w}`);
    if (lang === "pl" && w === 375) {
      await q.goto(BASE + "index.html#/materials"); await q.waitForTimeout(1200);
      ok("E: znaczek na liście przedmiotów", (await q.locator(".nb .spr-badge").count()) === 1);
    }
    await q.context().close();
  }
}

// ---------- F. niezdany: tematy do powtórki ----------
{
  const p = await strona(docs3, prog3);
  await p.locator(".sk-now .sk-start").click(); await p.waitForTimeout(1500);
  await przejdz(p, { zle: (i) => i < 3 });
  await p.waitForTimeout(600);
  const done = await p.locator(".lp-done-screen").innerText().catch(() => "");
  ok("F: 3/6 → tematy do powtórki, bez wstydu", /Wynik: 3\/6/.test(done) && /Tematy do powtórki/.test(done) && /To nic złego/.test(done) && (await p.locator(".spr-weak .btn").count()) >= 1, done);
  await shot(p, "e9-spr-niezdany");
  await p.clock.runFor(3500);
  const pr = await progOf(p);
  await p.locator(".lp-cta").click().catch(() => {}); await p.waitForTimeout(400);
  await p.goto(BASE + "index.html#/subject/makroekonomia"); await p.waitForTimeout(1500);
  ok("F: przedmiot pokazuje „Po sprawdzianie warto powtórzyć”", /Po sprawdzianie warto powtórzyć/.test(await p.locator("main").innerText()));
  ok("F: bez błędów JS", !p.errors.length, p.errors);
  await p.context().close();
  const p7 = await strona(docs3, { ...prog3, spr: pr.spr }, { dzien: 7 }); // bez rewanży: te byłyby „Powtórkami na dziś” (wyższy priorytet)
  ok("F: po 7 dniach nowa propozycja", /Sprawdź się/.test(await p7.locator(".sk-now").innerText()));
  await p7.context().close();
}

// ---------- G. za mało niewidzianych ----------
{
  const docs = docsOf("makroekonomia", 2); // 3 tematy × 2 pytania = 6, jedno widziane → 5
  const p = await strona(docs, { ...prog3 }, { ls: { "bm-q-seen": JSON.stringify({ "m0:0": day - 1 }) } });
  ok("G: 5 niewidzianych → brak propozycji", !/Mini-sprawdzian/i.test(await p.locator(".sk-now").innerText()), await p.locator(".sk-now").innerText());
  await p.context().close();
  const p2 = await strona(docs, { ...prog3 });
  ok("G: dokładnie 6 → propozycja", /Sprawdź się/.test(await p2.locator(".sk-now").innerText()));
  await p2.context().close();
}

// ---------- H. inny przedmiot rocznika (bez listy w kodzie) ----------
{
  const docs = docsOf("zarzadzanie-zasobami-ludzkimi", 4);
  const p = await strona(docs, { mastery: mastered(["m0", "m1"]) });
  ok("H: ZZL, umiesz 2 z 3 (67%) → brak", !/Mini-sprawdzian/i.test(await p.locator(".sk-now").innerText()));
  await p.context().close();
  const p2 = await strona(docs, { mastery: mastered(["m0", "m1", "m2"]) });
  ok("H: ZZL, umiesz 3 z 3 → propozycja", /Sprawdź się: ZZL/.test(await p2.locator(".sk-now").innerText()), await p2.locator(".sk-now").innerText());
  await p2.context().close();
}

await b.close();
for (const w of wyniki) console.log(w.join(" "));
const bad = wyniki.filter((w) => w[0] === "✗").length;
console.log(bad ? `BŁĘDY: ${bad} z ${wyniki.length}` : `OK ${wyniki.length}/${wyniki.length}`);
process.exit(bad ? 1 : 0);
