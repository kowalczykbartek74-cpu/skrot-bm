// „Dla Ciebie na dziś”, etap 5: Profil nauki i aktywność (learner.js) w lekcjach dla Ciebie.
// Zegar: 6.11.2026, 17:00 (po południu). Uruchom: python3 -m http.server <port> w repo, BASE=http://127.0.0.1:<port>/ node docs/gry/test/lekcja-dnia-5.mjs
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 700)]);
const UID = "00000000-0000-4000-8000-000000000001";
const A = "logistyka", Z = "podstawy-zarzadzania";
const sec = (t, i) => ({ h: `${i + 1}. ${t} ${i + 1}`, body: `Akapit ${i + 1} o temacie ${t}.`, check: { q: `Check ${t} ${i + 1}?`, options: ["Dobrze", "Źle"], correct: 0 } });
const lesson = (t) => ({ sections: [0, 1, 2, 3, 4, 5].map((i) => sec(t, i)), exit: [0, 1, 2].map((i) => ({ q: `Bilet ${t} ${i + 1}?`, options: ["Tak", "Nie"], correct: 0 })), recap: { prompt: `Wyjaśnij ${t}.`, keys: ["a"], model: "Wzór." }, exercises: [], faded: {}, formulas: [] });
const quiz = (t) => Array.from({ length: 10 }, (_, i) => ({ q: `Quiz ${t} ${i + 1}?`, options: ["Dobra", "Zła"], correct: 0 }));
const mat = (sid, order, title) => ({ subjectId: sid, kind: "lesson", order, unit: 1, unitTitle: "Dział", title, minutes: 35, quizCount: 10, flashcardCount: 0, conceptCount: 8, createdAt: Date.now(), v: 2 });
const content = (t) => ({ v: 2, lesson: lesson(t), quiz: quiz(t), flashcards: [], concepts: Array.from({ length: 8 }, (_, i) => ({ term: `Term ${t} ${i}`, definition: `Def ${i}.` })), notes: [], tldr: "" });
const docs = {
  materials: { A1: mat(A, 1, "Lekcja 1: Łańcuch dostaw"), A2: mat(A, 2, "Lekcja 2: Zapasy"), Z1: mat(Z, 1, "Lekcja 1: Funkcje zarządzania"), Z2: mat(Z, 2, "Lekcja 2: Planowanie") },
  materialContent: { A1: content("łańcuch"), A2: content("zapasy"), Z1: content("funkcje"), Z2: content("planowanie") },
  meta: { po: { items: {} }, stas: { items: {} } },
};
const T0 = 309;
const PROFIL = (o = {}) => JSON.stringify({ wlaczone: true, test_at: "2026-11-01T10:00:00Z", z_danych: {}, deklaracje: { bedtime: 23.5, clearest: "morning", focus: "short", stressHigh: false, motivations: ["buddy"], ...(o.d || {}) }, startowe: { blockMinutes: { value: o.blok ?? 12 }, stabilityMultiplier: { value: 1 } } });
const open = async (o = {}) => {
  const q = await page(b, { konto: "starosta", w: 390, h: 900, ls: { "mock-docs": JSON.stringify(docs), "mock-progress": JSON.stringify({ [UID]: {} }), "bm-ld-flag": "1", ...(o.profil !== false ? { "mock-profil": o.profil || PROFIL() } : {}), ...(o.ls || {}) } });
  await q.clock.setFixedTime(new Date(o.czas || "2026-11-06T17:00:00+01:00"));
  await q.goto(BASE + "index.html#/"); await q.waitForTimeout(3500);
  return q;
};
const plan = (q) => q.evaluate((T0) => JSON.parse(localStorage.getItem("bm-ld:" + T0) || "null")?.dzien, T0);

try {
// ---- 1. profil z testu: krótkie skupienie → lekcje 15 min, gra co 4 min; rywalizacja → Drabina i ranking ----
const p = await open();
let d = await plan(p);
ok("profil z testu: lekcje 15 min, gra co 4 min", d?.lekcje?.every((l) => l.min === 15 && l.graCo === 4), d?.lekcje?.map((l) => [l.min, l.graCo]));
ok("profil: rywalizacja → finał Drabina i ranking w podsumowaniu", d?.lekcje?.every((l) => l.final === "drabina" && l.podsumowanie.ranking), d?.lekcje?.map((l) => [l.final, l.podsumowanie]));
ok("profil: bez linku do testu (test zrobiony)", (await p.getByText("Ułożymy lepiej po 6-minutowym Profilu nauki").count()) === 0, "");
await p.locator(".ld-tile").first().getByRole("button", { name: "Dlaczego to?" }).click(); await p.waitForTimeout(200);
ok("„Dlaczego to?” przy lekcji: z Twojego Profilu nauki", /Lekcja ok\. 15 min, gra co 4 min: z Twojego Profilu nauki/.test(await p.locator(".ld-tile").first().innerText()), await p.locator(".ld-tile").first().innerText());
await shot(p, "ld5-profil");

// ---- 2. porzucenie w połowie segmentu, zdarzenia „ld” do bazy, licznik „przed czasem” ----
await p.locator(".ld-tile").first().getByRole("button", { name: "Zacznij" }).click(); await p.locator(".ld-seg").waitFor({ timeout: 15000 }); await p.waitForTimeout(500);
await p.locator(".ld-skip").click(); await p.waitForTimeout(500); // haczyk (gra) pomijamy
for (let i = 0; i < 2; i++) { const c = p.locator(".lp-cta"); if (await c.isEnabled()) await c.click(); await p.waitForTimeout(350); }
await p.locator(".lp-x").click(); await p.waitForTimeout(600);
const mech = await p.evaluate(() => JSON.parse(localStorage.getItem("bm-ld-mech") || "{}"));
ok("zamknięcie w połowie: mechanika porzucona, pominięcie zapisane", Object.values(mech).flat().some((e) => e.stan === "porzucona") && Object.values(mech).flat().some((e) => e.stan === "pominieta"), mech);
ok("licznik „przed czasem” rośnie", await p.evaluate(() => localStorage.getItem("bm-ld-krotko") === "1"), await p.evaluate(() => localStorage.getItem("bm-ld-krotko")));
const q0 = await p.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem("bm-learn-q") || "[]").filter((e) => e.dane?.kind === "ld")));
ok("zdarzenia mechanik w kolejce zdarzeń nauki (activity)", /"stan":"porzucona"/.test(q0) && /"typ":"activity"/.test(q0), q0.slice(0, 400));
await p.evaluate(() => window.skrot?.learn?.flush?.()); await p.waitForTimeout(800);
const ev = await p.evaluate(() => JSON.stringify((window.__rpc || []).filter((x) => x.fn === "nauka_zdarzenia_zapisz")));
ok("zdarzenia mechanik do bazy (activity, kind „ld”, stan)", /"kind":"ld"/.test(ev) && /"stan":"porzucona"/.test(ev) && /"stan":"pominieta"/.test(ev), ev.slice(0, 600));
const ses = await p.evaluate(() => JSON.parse(localStorage.getItem("bm-ld-sesje") || "[]"));
ok("sesja zapisana z porą startu i stanem „przerwana”", ses.length === 1 && ses[0].status === "skipped" && ses[0].startMinutes === 17 * 60, ses);
ok("bez błędów (1–2)", p.errors.length === 0, p.errors);
await p.close();

// ---- 3. trzy razy przed czasem → lekcje o stopień krótsze ----
const q3 = await open({ profil: PROFIL({ blok: 22 }), ls: { "bm-ld-krotko": "3" } });
d = await plan(q3);
ok("3× przed czasem: z 20 min na 15", d?.lekcje?.every((l) => l.min === 15), d?.lekcje?.map((l) => l.min));
await q3.close();

// ---- 4. seria nieudanych dni → tryb Lekko, „Dlaczego to?” to mówi ----
const dni = JSON.stringify({ [T0 - 1]: { plan: 3, done: 0 }, [T0 - 2]: { plan: 3, done: 0 }, [T0 - 3]: { plan: 3, done: 0 } });
const q4 = await open({ ls: { "bm-ld-dni": dni } });
d = await plan(q4);
ok("3 nieudane dni: tryb Lekko, bez nowego materiału, spokojne mechaniki", d?.dzien?.tryb === "lekko" && !d.dzien.nowe && d.lekcje.every((l) => l.spokojnie && !l.segmenty.some((s) => ["frun", "przejdz", "pary", "drabina"].includes(s.mech))), [d?.dzien, d?.lekcje?.map((l) => l.segmenty.map((s) => s.mech))]);
ok("karta 5 min w tonie „calm”", await q4.locator(".ld-hero").evaluate((e) => e.classList.contains("calm")), "");
await q4.locator(".ld-tile").first().getByRole("button", { name: "Dlaczego to?" }).click(); await q4.waitForTimeout(200);
ok("„Dlaczego to?”: ostatnio było ciężko", /Ostatnio było ciężko/.test(await q4.locator(".ld-tile").first().innerText()), await q4.locator(".ld-tile").first().innerText());
await shot(q4, "ld5-lekko");
await q4.close();

// ---- 5. propozycja przerwy po bloku skupienia z profilu (12 min) ----
const q5 = await open({ profil: PROFIL({ blok: 12 }) });
await q5.locator(".ld-tile").first().getByRole("button", { name: "Zacznij" }).click(); await q5.locator(".ld-seg").waitFor({ timeout: 15000 }); await q5.waitForTimeout(400);
await q5.locator(".ld-skip").click(); await q5.waitForTimeout(400);
await q5.clock.setFixedTime(new Date("2026-11-06T17:14:00+01:00"));
// do pierwszej oceniane odpowiedzi
for (let i = 0; i < 12 && !(await q5.locator("#layer").getByText("Krótka przerwa?").count()); i++) {
  if (await q5.locator("#layer .lvup").count()) { await q5.locator("#layer").getByRole("button", { name: "Super!" }).click(); await q5.waitForTimeout(300); }
  const o = q5.locator(".lp-stage .opt:not([disabled])");
  if (await o.count()) { await o.first().click({ timeout: 3000 }).catch(() => {}); await q5.waitForTimeout(1000); }
  if (await q5.locator("#layer").getByText("Krótka przerwa?").count()) break;
  const c = q5.locator(".lp-cta"); if (await c.isVisible() && await c.isEnabled()) { await c.click({ timeout: 3000 }).catch(() => {}); await q5.waitForTimeout(350); }
}
ok("po 12 min: „Krótka przerwa?” z przerwą 4 min", (await q5.locator("#layer").getByText("Krótka przerwa?").count()) === 1 && (await q5.locator("#layer").getByRole("button", { name: "Przerwa 4 min" }).count()) === 1, await q5.locator("body").innerText().catch(() => ""));
await shot(q5, "ld5-przerwa");
await q5.locator("#layer").getByRole("button", { name: "Przerwa 4 min" }).click(); await q5.waitForTimeout(600);
ok("„Przerwa”: odtwarzacz zamknięty, postęp zapisany", (await q5.locator(".lp").count()) === 0 && /Wróć \(zostało ok\. \d+ min\)/.test(await q5.locator(".ld-tile").first().innerText()), await q5.locator(".ld-tile").first().innerText());
const odp = await q5.evaluate(() => JSON.parse(localStorage.getItem("bm-ld-odp") || "[]"));
ok("dziennik odpowiedzi: pora dnia, minuta sesji, czas odpowiedzi", odp.length >= 1 && odp.every((x) => x.m >= 17 * 60 && x.mi >= 0 && "t" in x && x.sid), odp.slice(0, 3));
ok("bez błędów (5)", q5.errors.length === 0, q5.errors);
await q5.close();

// ---- 6. rytm z danych: rano dobrze, po południu słabo → najlepsza pora „rano”, teraz (17:00) nie ----
const log = [];
for (let i = 0; i < 60; i++) log.push({ s: 1, k: "mc", m: 8 * 60 + (i % 50), mi: i % 10, t: 4000, sid: "r" + Math.floor(i / 15), d: T0 - 5 - Math.floor(i / 15), iso: "2026-10-30" });
for (let i = 0; i < 60; i++) log.push({ s: i % 3 === 0 ? 1 : 0, k: "mc", m: 15 * 60 + (i % 50), mi: i % 10, t: 6000, sid: "p" + Math.floor(i / 15), d: T0 - 5 - Math.floor(i / 15), iso: "2026-10-30" });
const q6 = await open({ profil: PROFIL({ d: { clearest: "evening" } }), ls: { "bm-ld-odp": JSON.stringify(log) } });
d = await plan(q6);
ok("rytm z odpowiedzi: najlepsza pora rano (zamiast „wieczorem” z testu)", d?.profil?.pora === "morning" && d.profil.poraZ === "data" && d.profil.dobraPora === false, d?.profil);
await q6.close();

// ---- 7. bez profilu: wartości domyślne i link do testu ----
const q7 = await open({ profil: false });
d = await plan(q7);
ok("bez profilu: 20 min, gra co 5, link do testu", d?.lekcje?.every((l) => l.min === 20 && l.graCo === 5) && (await q7.getByText("Ułożymy lepiej po 6-minutowym Profilu nauki").count()) === 1, d?.lekcje?.map((l) => [l.min, l.graCo]));
await q7.close();

// ---- 8. panel lejka: sekcja „Dla Ciebie na dziś” (SQL v43), grupy < 5 osób ukryte ----
const LJ = { dzien: "2026-11-06", policzono_at: "2026-11-06T03:15:00Z", roczniki: [], dane: { "*": { lejek: { d28: {}, wszystko: {} }, retencja: {}, tygodnie: [], uczy: [], rewanze: {}, ab: { haczyk: {} },
  ld: { osoby: 12, dni: [{ dzien: "2026-11-06", karta_osoby: 9, karty: 11, lekcja_osoby: 6, lekcje: 8 }, { dzien: "2026-11-05", karta_osoby: 3, karty: 3, lekcja_osoby: 1, lekcje: 1 }],
    segmenty: [{ seg: 2, porzucone: 7, osoby: 6 }, { seg: 5, porzucone: 2, osoby: 2 }],
    mechaniki: [{ mech: "frun", ukonczone: 12, porzucone: 4, pominiete: 0, dobrze: 9, osoby: 9 }, { mech: "stas", ukonczone: 1, porzucone: 0, pominiete: 2, dobrze: 1, osoby: 3 }],
    uczy: { ld: { odp: 50, ok: 40, osoby: 8 }, inne: { odp: 120, ok: 72, osoby: 11 } } } } } };
const q8 = await open({ ls: { "mock-lejek": JSON.stringify(LJ) } });
await q8.goto(BASE + "index.html#/lejekAdmin"); await q8.waitForTimeout(2500);
const lj = await q8.locator("main").innerText();
ok("panel lejka: sekcja „Dla Ciebie na dziś” z kończeniami dziennie", /Dla Ciebie na dziś/i.test(lj) && /12\s*osób w bloku/.test(lj) && /Karta 5 min: osoby/i.test(lj), lj.slice(0, 800));
const tabs = await q8.locator(".lj-ld, table").allInnerTexts();
const all = tabs.join("\n");
ok("panel: dzień z < 5 osób ukryty, segment 3 z 7 przerwaniami, Fruń kończy 75%, Staś ukryty", /< 5/.test(all) && /3\s+7\s+6/.test(all) && /Fruń\s+12\s+4\s+0\s+75%\s+75%/.test(all) && !/Staś się myli\s+1/.test(all), all.slice(0, 900));
ok("panel: czy uczy blok 80% kontra reszta 60%", /z lekcji dla Ciebie\s+50\s+8\s+80%/.test(all) && /pozostałe\s+120\s+11\s+60%/.test(all), all.slice(-400));
await shot(q8, "ld5-lejek");
ok("bez błędów (panel)", q8.errors.length === 0, q8.errors);
await q8.close();
} catch (e) { ok("bez wyjątku w teście", false, String(e).slice(0, 400)); }
await b.close();
for (const w of wyniki) console.log(w.join(" "));
const bad = wyniki.filter((w) => w[0] === "✗").length;
console.log(`\n${wyniki.length - bad}/${wyniki.length}`);
process.exit(bad ? 1 : 0);
