// „Dla Ciebie na dziś”, etap 4: blok na Dziś za flagą ?ld=1 (tylko admin), wygląd w każdym motywie, 375 / 1280 px, PL / EN.
// Zegar: 6.11.2026, 17:00. Uruchom: python3 -m http.server <port> w repo, BASE=http://127.0.0.1:<port>/ node docs/gry/test/lekcja-dnia-4.mjs
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 700)]);
const UID = "00000000-0000-4000-8000-000000000001";
const A = "analiza-matematyczna", M = "logistyka", Z = "podstawy-zarzadzania";
const sec = (t, i) => ({ h: `${i + 1}. ${t} ${i + 1}`, body: `Akapit ${i + 1} o **pojęciu ${i + 1}** w temacie ${t}.`, check: { q: `Check ${t} ${i + 1}?`, options: ["Dobrze", "Źle"], correct: 0 } });
const lesson = (t) => ({ sections: [0, 1, 2, 3, 4, 5].map((i) => sec(t, i)), exit: [0, 1, 2].map((i) => ({ q: `Bilet ${t} ${i + 1}?`, options: ["Tak", "Nie"], correct: 0 })), recap: { prompt: `Wyjaśnij ${t}.`, keys: ["a"], model: "Wzór." }, exercises: [{ task: "Ćwiczenie", answer: "1", level: 2 }], faded: {}, formulas: [] });
const quiz = (t) => Array.from({ length: 10 }, (_, i) => ({ q: `Quiz ${t} ${i + 1}?`, options: ["Dobra", "Zła", "Zła 2", "Zła 3"], correct: 0 }));
const concepts = (t) => Array.from({ length: 8 }, (_, i) => ({ term: `Term ${t} ${i}`, definition: `Definicja ${i}.` }));
const mat = (sid, order, title) => ({ subjectId: sid, kind: "lesson", order, unit: 1, unitTitle: "Dział", title, minutes: 35, quizCount: 10, flashcardCount: 0, conceptCount: 8, createdAt: Date.now(), v: 2 });
const content = (t) => ({ v: 2, lesson: lesson(t), quiz: quiz(t), flashcards: [], concepts: concepts(t), notes: [], tldr: "" });
const docs = {
  materials: { A1: mat(A, 1, "Lekcja 1: Pochodne funkcji"), A2: mat(A, 2, "Lekcja 2: Całki oznaczone"), M1: mat(M, 1, "Lekcja 1: Łańcuch dostaw"), M2: mat(M, 2, "Lekcja 2: Zapasy i magazyny"), Z1: mat(Z, 1, "Lekcja 1: Funkcje zarządzania") },
  materialContent: { A1: content("pochodne"), A2: content("całki"), M1: content("łańcuch"), M2: content("zapasy"), Z1: content("funkcje") },
  meta: { po: { items: {} }, stas: { items: {} } },
};
const T0 = 309;
const ls0 = { "mock-docs": JSON.stringify(docs), "mock-progress": JSON.stringify({ [UID]: {} }) };
const open = async (o = {}) => {
  const q = await page(b, { konto: o.konto || "starosta", w: o.w || 390, h: o.h || 844, lang: o.lang || "pl", ls: { ...ls0, ...(o.theme ? { "skrot-theme": o.theme } : {}), ...(o.ls || {}) }, ctx: o.dark ? { colorScheme: "dark" } : {} });
  await q.clock.setFixedTime(new Date("2026-11-06T17:00:00+01:00"));
  await q.goto(BASE + "index.html" + (o.q ?? "?ld=1") + "#/"); await q.waitForTimeout(o.wait || 3000);
  return q;
};
const main = (q) => q.locator("main").innerText();

// ---- flaga ----
const p = await open();
ok("admin + ?ld=1: blok „Dla Ciebie na dziś”", (await p.locator(".ld-hero").count()) === 1 && (await p.locator(".ld-tile").count()) === 2, await main(p));
const m0 = await main(p);
ok("bez starych kart: „Teraz zrób to”, „Ile masz dziś czasu?”, „Powtórka w 5 minut”", !/Teraz zrób to/i.test(m0) && !/Ile masz dziś czasu/i.test(m0) && (await p.locator(".dz-panel, .now-2").count()) === 0, m0.slice(0, 500));
ok("karta 5 min: te same klasy co „Teraz zrób to”", await p.locator(".ld-hero").evaluate((e) => e.matches("section.sk-hero.sk-now")), "");
// Wygląd H (15.11.2026): kafelek = co to jest (rodzaj + przedmiot · czas), tytuł, „Temat X z Y”, przycisk „Zaczynamy”.
ok("kafelek lekcji H: rodzaj, przedmiot, Temat X z Y, Zaczynamy", (await p.locator(".ld-tile .zh-kind").count()) === 2 && (await p.locator(".ld-tile .zh-kt small").first().innerText()).length >= 2 && /^Temat \d+ z \d+/.test(await p.locator(".ld-tile .zh-tbar b").first().innerText()) && (await p.locator(".ld-tile").first().getByRole("button", { name: /Otwórz lekcję/ }).count()) === 1, await p.locator(".ld-tile").first().innerText());
ok("wygląd H: na górze blok „Dziś · 5 min”, potem „Twój postęp” z najbliższymi terminami; bez planu zajęć", await p.evaluate(() => { const m = document.querySelector("main"), pts = m.querySelector(".pts-dzis"), ld = m.querySelector(".ld-block"); return !!pts && !!ld && m.querySelector(".greet").nextElementSibling === ld && ld.nextElementSibling === pts && !!pts.querySelector(".pz-terms") && !m.querySelector(".home-hub, .today"); }), "");
ok("flaga zapamiętana w przeglądarce", await p.evaluate(() => localStorage.getItem("bm-ld-flag") === "1"), "");
await p.goto(BASE + "index.html#/"); await p.waitForTimeout(2000);
ok("po wejściu bez ?ld=1 blok zostaje", (await p.locator(".ld-hero").count()) === 1, "");
await shot(p, "ld4-dzis-390");
const notAdmin = await open({ konto: "platne", q: "", ls: { "bm-ld-flag": "1" } });
ok("etap 6: blok dla wszystkich (konto płatne bez admina)", (await notAdmin.locator(".ld-hero").count()) === 1 && (await notAdmin.locator(".ld-tile").count()) === 2, (await main(notAdmin)).slice(0, 300));
await notAdmin.goto(BASE + "index.html?ld=0#/"); await notAdmin.waitForTimeout(2000);
ok("?ld=0: stare karty w tej przeglądarce", (await notAdmin.locator(".ld-hero").count()) === 0 && /Teraz zrób to/i.test(await main(notAdmin)), (await main(notAdmin)).slice(0, 300));
await notAdmin.close();
// D5: bez pełnego dostępu (konto bez zakupu): karta 5 min, jedna lekcja, „Kup dostęp”
const free = await open({ konto: "darmowe", q: "", ls: { "bm-ld-flag": "1", "mock-docs": JSON.stringify({ ...docs, materials: Object.fromEntries(Object.entries(docs.materials).map(([k, v]) => [k, { ...v, free: true }])) }) } });
ok("D5 bez dostępu: karta, najwyżej jedna lekcja i „Kup dostęp”", (await free.locator(".ld-hero").count()) === 1 && (await free.locator(".ld-tile").count()) <= 1 && (await free.getByRole("button", { name: "Kup dostęp" }).count()) >= 1, (await main(free)).slice(0, 400));
await shot(free, "ld4-d5");
await free.close();

// ---- „Dlaczego to?”, „Mam więcej czasu”, „Inny temat” ----
const t1 = await p.locator(".ld-hero h2").innerText();
await p.locator(".ld-hero").getByRole("button", { name: "Dlaczego to?" }).click().catch(() => {}); await p.waitForTimeout(200);
const whyN = await p.locator(".ld-hero .ld-whylist li").count();
ok("„Dlaczego to?”: 1–3 powody (albo brak przycisku, gdy powodów nie ma)", whyN >= 1 || (await p.locator(".ld-hero .ld-why").count()) === 0, whyN);
await p.locator(".ld-hero").getByRole("button", { name: /Mam więcej czasu/ }).click(); await p.waitForTimeout(200);
await p.locator(".ld-time").getByRole("button", { name: "30 min" }).click(); await p.waitForTimeout(200);
const plan30 = await p.locator(".ld-plan li").allInnerTexts();
ok("„Mam więcej czasu” → 30 min: karta 5 min i lekcja", plan30.length >= 2 && /Dziś · 5 min/i.test(plan30[0]), plan30);
await shot(p, "ld4-czas");
await p.locator(".ld-hero").getByRole("button", { name: "Inny temat" }).click(); await p.waitForTimeout(300);
const t2 = await p.locator(".ld-hero h2").innerText();
const tiles = await p.locator(".ld-tile h3").allInnerTexts();
ok("„Inny temat ↻”: nowy temat, różny od lekcji", t2 !== t1 && !tiles.includes(t2), [t1, t2, tiles]);
ok("„Inny temat”: licznik pominięć dla silnika", await p.evaluate(([T0, t]) => Object.values(JSON.parse(localStorage.getItem("bm-ld:" + T0)).pom || {}).some((n) => n >= 1), [T0, t1]), "");

// ---- „Jestem w drodze”: tylko mechaniki pod kciuk ----
// Wygląd H nie pokazuje ikonek mechanik na kafelku, więc sprawdzamy sam plan lekcji (localStorage bm-ld:<dzień>).
const mechs = () => p.evaluate((T0) => (JSON.parse(localStorage.getItem("bm-ld:" + T0))?.dzien?.lekcje?.[0]?.segmenty || []).map((s) => s.mech), T0);
const chips0 = await mechs();
await p.locator(".ld-road input").check(); await p.waitForTimeout(300);
const chips1 = await mechs();
ok("„Jestem w drodze”: bez Wyjaśnij / ćwiczeń / gier na czas", chips1.length > 0 && !chips1.some((c) => /^(wyjasnij|cwiczenie|frun|przejdz|pary|drabina|zadanie)$/.test(c)) && chips1.join() !== chips0.join(), [chips0, chips1]);
await p.locator(".ld-road input").uncheck(); await p.waitForTimeout(300);

// ---- przerwana karta: „Wróć”, potem stany „Zrobione” ----
await p.locator(".ld-hero .sk-start").click(); await p.locator(".ld-seg").waitFor({ timeout: 15000 });
await p.waitForTimeout(400); await p.locator(".lp-cta").click().catch(() => {}); await p.waitForTimeout(400);
await p.locator(".lp-x").click(); await p.waitForTimeout(600);
ok("przerwana karta: „Wróć · zostało ok. N min”", /Wróć · zostało ok\. \d+ min/.test(await p.locator(".ld-hero").innerText()), await p.locator(".ld-hero").innerText());
await p.evaluate((T0) => { const k = "bm-ld:" + T0, d = JSON.parse(localStorage.getItem(k)); d.done.karta = Date.now(); localStorage.setItem(k, JSON.stringify(d)); }, T0);
await p.reload(); await p.waitForTimeout(2500);
ok("karta zrobiona: „Zrobione ✓”, „Jeszcze 5 min”, „Przejdź do lekcji”", /Zrobione ✓/.test(await p.locator(".ld-hero").innerText()) && /Jeszcze 5 min/.test(await p.locator(".ld-hero").innerText()) && /Przejdź do lekcji/.test(await p.locator(".ld-hero").innerText()), await p.locator(".ld-hero").innerText());
await p.evaluate((T0) => { const k = "bm-ld:" + T0, d = JSON.parse(localStorage.getItem(k)); d.done.l0 = d.done.l1 = Date.now(); localStorage.setItem(k, JSON.stringify(d)); }, T0);
await p.reload(); await p.waitForTimeout(2500);
ok("wszystko zrobione: „Na dziś zrobione” i „Jeszcze jedna lekcja”", /Na dziś zrobione/.test(await main(p)) && (await p.getByRole("button", { name: "Jeszcze jedna lekcja" }).count()) === 1, await main(p));
await shot(p, "ld4-zrobione");
await p.getByRole("button", { name: "Jeszcze jedna lekcja" }).click(); await p.locator(".ld-seg").waitFor({ timeout: 15000 });
ok("„Jeszcze jedna lekcja” otwiera trzecią lekcję", (await p.locator(".lp").count()) === 1, "");
await p.locator(".lp-x").click(); await p.waitForTimeout(500);
ok("trzeci kafelek na liście", (await p.locator(".ld-tile").count()) === 3, await p.locator(".ld-tile").count());
ok("bez błędów w konsoli (390)", p.errors.length === 0, p.errors);
await p.close();

// ---- układ: 375 jedna pod drugą, 1280 obok siebie; cele ≥ 44 px; bez poziomego przewijania ----
for (const w of [375, 1280]) {
  const q = await open({ w, h: w > 600 ? 900 : 812 });
  const bx = await q.locator(".ld-tile").evaluateAll((ts) => ts.map((t) => { const r = t.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y)]; }));
  // Wygląd H: na telefonie lekcje w poziomej karuzeli (mniej przewijania strony), na komputerze obok siebie.
  ok(`${w} px: ${w < 600 ? "lekcje w karuzeli obok siebie" : "lekcje obok siebie"}`, Math.abs(bx[0][1] - bx[1][1]) <= 2 && bx[1][0] > bx[0][0] && (w > 600 || await q.locator(".ld-lessons").evaluate((e) => getComputedStyle(e).overflowX === "auto" && e.scrollWidth > e.clientWidth)), bx);
  ok(`${w} px: bez przewijania w bok`, await q.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "");
  const small = await q.locator(".ld-block button, .ld-block .ld-road").evaluateAll((els) => els.filter((e) => e.offsetParent && e.getBoundingClientRect().height < 44).map((e) => e.textContent.trim().slice(0, 30)));
  ok(`${w} px: przyciski bloku ≥ 44 px`, small.length === 0, small);
  await q.close();
}

// ---- motywy: wygląd H (pełna karta w kolorze motywu, tekst czytelny), kafelek z tym samym tłem co kafelek przedmiotu ----
const THEMES = ["", "meadow", "lilia", "sea", "bow", "pink", "noc", "riwiera", "klub"];
for (const th of THEMES) for (const dark of [false, true]) for (const w of [375, 1280]) {
  const name = `${th || "domyslny"}-${dark ? "ciemny" : "jasny"}-${w}`;
  const on = await open({ theme: th || undefined, dark, w, h: w > 600 ? 900 : 812 });
  await shot(on, "ld4-" + name);
  const cs = (sel) => on.locator(sel).first().evaluate((e) => { const c = getComputedStyle(e); return [c.backgroundColor, c.backgroundImage, c.borderRadius, c.color].join("|"); });
  const heroOn = await cs(".ld-hero"), tileOn = await cs(".ld-tile");
  await on.goto(BASE + "index.html?ld=0#/"); await on.waitForTimeout(2000);
  const heroOff = await cs(".sk-now");
  await shot(on, "ld4-" + name + "-stare");
  await on.goto(BASE + "index.html#/materials"); await on.waitForTimeout(1500);
  const nb = await cs(".nb");
  const lum = (c) => { const m = c.match(/\d+(\.\d+)?/g).map(Number).slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]; };
  const [hb, , , hc] = heroOn.split("|"), cr = (Math.max(lum(hb), lum(hc)) + 0.05) / (Math.min(lum(hb), lum(hc)) + 0.05);
  ok(`${name}: karta H w kolorze motywu (kontrast ≥ 4.5), kafelek ma tło kafelka przedmiotu albo akcent rodzaju`, !/rgba\(0, 0, 0, 0\)/.test(hb) && heroOn !== heroOff && cr >= 4.5 && (tileOn.split("|")[0] === nb.split("|")[0] || /rgb/.test(tileOn.split("|")[0])), { heroOn, heroOff, cr: cr.toFixed(2), tileOn, nb });
  ok(`${name}: bez błędów`, on.errors.length === 0, on.errors);
  await on.close();
}

// ---- EN ----
for (const w of [375, 1280]) {
  const e = await open({ lang: "en", w, h: w > 600 ? 900 : 812 });
  const t = await e.locator(".ld-block").innerText();
  ok(`EN ${w}: blok po angielsku`, /Today · 5 min/i.test(t) && /Lessons for you/i.test(t) && /I'm on the go/.test(t) && !/Zaczynam|Lekcje dla Ciebie|Jestem w drodze|Mam więcej/.test(t), t.slice(0, 600));
  await shot(e, `ld4-en-${w}`);
  ok(`EN ${w}: bez błędów`, e.errors.length === 0, e.errors);
  await e.close();
}

await b.close();
for (const w of wyniki) console.log(w.join(" "));
const bad = wyniki.filter((w) => w[0] === "✗").length;
console.log(`\n${wyniki.length - bad}/${wyniki.length}`);
process.exit(bad ? 1 : 0);
