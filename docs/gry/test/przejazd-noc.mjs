// „Lekcja na przejazd” (#/jazda) i „10 minut przed snem” (#/noc) na atrapie.
// Zegar: piątek 6.11.2026, 10:30 (C111 lab A ma o 12:00 wykład z Analizy matematycznej), potem 22:00 tego dnia.
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 600)]);
const UID = "00000000-0000-4000-8000-000000000001";
const hashStr = (s) => { let x = 2166136261; for (const ch of String(s)) { x ^= ch.codePointAt(0); x = Math.imul(x, 16777619) >>> 0; } return x.toString(36); };
const SID = "analiza-matematyczna";
const fl = Array.from({ length: 12 }, (_, i) => ({ q: `Granica ${i + 1}: ile to jest?`, a: `To jest odpowiedź numer ${i + 1}, krótko i jasno.` }));
const secs = Array.from({ length: 30 }, (_, i) => ({ h: `${i + 1}. Część ${i + 1}`, intuition: `Intuicja części ${i + 1}: pochodna mówi, jak szybko zmienia się funkcja. `.repeat(6), body: "Treść.", tip: `Wskazówka ${i + 1}.` }));
const docs = {
  materials: { L1: { subjectId: SID, kind: "lesson", order: 1, title: "Lekcja 1: Pochodne", flashcardCount: 12, quizCount: 4, createdAt: Date.now(), v: 2 } },
  materialContent: { L1: { v: 2, lesson: { sections: secs }, flashcards: fl, quiz: [0, 1, 2, 3].map((i) => ({ q: `Pytanie o pochodną ${i + 1}?`, options: ["A", "B", "C", "D"], correct: i })) } },
};
const srs = Object.fromEntries(fl.map((f) => ["L1:" + hashStr(f.q), [0, 0]]));
const p = await page(b, { konto: "platne", ls: { "mock-docs": JSON.stringify(docs), "mock-progress": JSON.stringify({ [UID]: { srs } }) } });
await p.clock.setFixedTime(new Date("2026-11-06T10:30:00+01:00"));
await p.goto(BASE + "index.html#/"); await p.waitForTimeout(2500);
const card = p.locator(".jz-card");
ok("Dziś: karta przejazdu przed zajęciami", (await card.count()) === 1 && /Analiza matematyczna/.test(await card.innerText()) && /za 90 min/.test(await card.innerText()), await p.locator("main").innerText());
ok("Dziś o 10:30: brak karty przed snem", (await p.locator(".noc-card").count()) === 0, "");
await shot(p, "jz-home");
await card.getByRole("button", { name: /Ułóż mi przejazd/ }).click(); await p.waitForTimeout(600);
ok("ekran wyboru: 18 min domyślnie, przedmiot najbliższych zajęć", /#\/jazda$/.test(p.url()) && (await p.locator(".jz-min.on").innerText()).includes("18") && /Analiza matematyczna \(najbliższe zajęcia dziś\)/.test(await p.locator("select").evaluate((s) => s.selectedOptions[0].textContent)), await p.locator("main").innerText());
ok("liczba fiszek do powtórki", /czeka 12 fiszek/.test(await p.locator(".jz-setup").innerText()), await p.locator(".jz-setup").innerText());
await shot(p, "jz-setup");
await p.locator(".jz-min", { hasText: "10" }).click();
await p.getByRole("button", { name: /Ruszamy \(10 min\)/ }).click(); await p.waitForTimeout(1200);
const head = await p.locator(".jz-bar").innerText();
const n = +(head.match(/1\/(\d+)/) || [])[1], mins = +(head.match(/ok\. (\d+) min/) || [])[1];
ok("playlista ~10 min", n > 3 && mins >= 9 && mins <= 11, head);
ok("pierwsza: mikrolekcja", /Mikrolekcja/i.test(await p.locator(".jz-item").innerText()), await p.locator(".jz-item").innerText());
await shot(p, "jz-lekcja");
let kinds = [], graded = 0;
for (let i = 0; i < n; i++) {
  const t = await p.locator(".jz-item").innerText(); kinds.push(/Fiszka/i.test(t) ? "c" : "l");
  if (/Fiszka/i.test(t)) {
    await p.getByRole("button", { name: "Pokaż odpowiedź" }).click();
    if (i === 1) await shot(p, "jz-fiszka");
    await p.getByRole("button", { name: graded === 0 ? "Nie pamiętam" : "Pamiętam", exact: true }).click(); graded++;
  } else await p.getByRole("button", { name: "Dalej" }).click();
  await p.waitForTimeout(80);
}
ok("są i mikrolekcje, i fiszki, na zmianę", kinds.includes("c") && kinds.includes("l") && kinds[0] === "l", kinds.join(""));
const end = await p.locator("main").innerText();
ok("koniec: Dojechane", /Dojechane/.test(end) && /Temat w głowie: Analiza matematyczna/.test(end) && /pamiętasz \d+ z \d+/.test(end), end);
await shot(p, "jz-koniec");
await p.waitForTimeout(3500);
const prog = await p.evaluate((u) => JSON.parse(localStorage.getItem("mock-progress") || "{}")[u]?.srs || {}, UID);
ok("oceny zapisane w powtórkach", Object.values(prog).filter((v) => v[0] > 0).length === graded, prog);
// błąd z quizu (gra/quiz zapisują to samo) – dopisujemy ręcznie w kluczu bm-bledy jak quiz
// ---- 22:00: przed snem
try {
await p.clock.setFixedTime(new Date("2026-11-06T22:00:00+01:00"));
await p.evaluate(() => { const o = JSON.parse(localStorage.getItem("bm-bledy") || "{}"); const d = Object.values(o)[0]; o["q:L1:2"] = d; localStorage.setItem("bm-bledy", JSON.stringify(o)); });
await p.goto(BASE + "index.html#/"); await p.waitForTimeout(2000);
const nc = p.locator(".noc-card");
ok("22:00: karta 10 minut przed snem (2 błędy)", (await nc.count()) === 1 && /2 błędy/.test(await nc.innerText()), await p.locator("main").innerText());
ok("22:00: karta przejazdu znika (brak zajęć dziś)", (await p.locator(".jz-card").count()) === 0, "");
await shot(p, "noc-home");
await nc.getByRole("button", { name: /Zaczynamy/ }).click(); await p.waitForTimeout(1200);
ok("body.night i duża czcionka", await p.evaluate(() => document.body.classList.contains("night") && parseFloat(getComputedStyle(document.body).fontSize) >= 18), "");
ok("intro: 2 rzeczy, nic nowego", /2 rzeczy do powtórki/.test(await p.locator("main").innerText()), await p.locator("main").innerText());
await shot(p, "noc-intro");
await p.getByRole("button", { name: /Zaczynamy/ }).click(); await p.waitForTimeout(200);
for (let i = 0; i < 2; i++) {
  const t = await p.locator(".noc-box").innerText();
  if (/Fiszka/i.test(t)) { await p.getByRole("button", { name: "Pokaż odpowiedź" }).click(); await shot(p, "noc-fiszka"); await p.getByRole("button", { name: "Pamiętam ✓" }).click(); }
  else { await p.locator(".po-opt").nth(2).click(); await shot(p, "noc-pytanie"); ok("pytanie: dobra odpowiedź", (await p.locator(".po-why.ok").count()) === 1, t); await p.getByRole("button", { name: "Dalej", exact: true }).click(); }
  await p.waitForTimeout(100);
}
const fin = await p.locator("main").innerText();
ok("koniec: Dobranoc, mózg pracuje dalej", /Dobranoc, mózg pracuje dalej/.test(fin) && /Od razu dobrze: 2/.test(fin), fin);
await shot(p, "noc-koniec");
await p.getByRole("button", { name: "Dobranoc", exact: true }).click(); await p.waitForTimeout(400);
ok("wyjście: bez body.night", await p.evaluate(() => !document.body.classList.contains("night")), "");
await p.goto(BASE + "index.html#/more"); await p.waitForTimeout(1000);
ok("Więcej: oba wpisy", (await p.getByText("Lekcja na przejazd").count()) >= 1 && (await p.getByText("10 minut przed snem").count()) >= 1, "");
// EN
const e = await page(b, { konto: "platne", lang: "en", ls: { "mock-docs": JSON.stringify(docs), "mock-progress": JSON.stringify({ [UID]: { srs } }) } });
await e.clock.setFixedTime(new Date("2026-11-06T10:30:00+01:00"));
await e.goto(BASE + "index.html#/jazda"); await e.waitForTimeout(2500);
const et = await e.locator("main").innerText();
ok("EN: ekran przejazdu po angielsku", /How long is your ride\?/.test(et) && /Let’s go \(18 min\)/.test(et) && /due for review/.test(et), et);
ok("bez błędów JS", !p.errors.length && !e.errors.length, [...p.errors, ...e.errors]);
} catch (err) { ok("wyjątek", false, String(err).slice(0, 300)); }
for (const w of wyniki) console.log(w.filter(Boolean).join(" "));
console.log(wyniki.filter((w) => w[0] === "✓").length + "/" + wyniki.length);
await b.close();
