// Profil nauki (v22) i FSRS w Powtórkach na atrapie. Zegar: wtorek 3.11.2026, 18:00.
// Uruchom: python3 -m http.server 8765 --bind 127.0.0.1 (w katalogu repo), potem node docs/gry/test/profil-nauki.mjs
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 600)]);
const UID = "00000000-0000-4000-8000-000000000001";
const hashStr = (s) => { let x = 2166136261; for (const ch of String(s)) { x ^= ch.codePointAt(0); x = Math.imul(x, 16777619) >>> 0; } return x.toString(36); };
const fl = Array.from({ length: 4 }, (_, i) => ({ q: `Pojęcie ${i + 1}: co to jest?`, a: `Definicja numer ${i + 1}.` }));
const docs = {
  materials: { L1: { subjectId: "makroekonomia", kind: "lesson", order: 1, title: "Lekcja 1: PKB", flashcardCount: 4, quizCount: 4, createdAt: Date.now(), v: 2 } },
  materialContent: { L1: { v: 2, lesson: { sections: [{ h: "1. PKB", intuition: "PKB to wartość produkcji.", body: "Treść." }] }, flashcards: fl, quiz: [0, 1, 2, 3].map((i) => ({ q: `Pytanie ${i + 1}?`, options: ["A", "B", "C", "D"], correct: i })) } },
};
const day = Math.round((new Date(2026, 10, 3) - new Date(2026, 0, 1)) / 864e5);
const keys = fl.map((f) => "L1:" + hashStr(f.q));
// Karta 1: stara, sprzed FSRS (pudełko 3); karty 2–4: nowe.
const srs = Object.fromEntries(keys.map((k, i) => [k, i === 0 ? [3, day] : [0, day]]));
const p = await page(b, { konto: "platne", ls: { "mock-docs": JSON.stringify(docs), "mock-progress": JSON.stringify({ [UID]: { srs } }) } });
await p.clock.install({ time: new Date("2026-11-03T18:00:00+01:00") });

// ---- Powtórki: oceny liczy FSRS
await p.goto(BASE + "index.html#/review"); await p.waitForTimeout(2500);
ok("learner.js wczytany", await p.evaluate(() => !!window.SkrotLearner?.memory?.reviewStoredCard), "");
ok("mapa fiszek: zakresy dni, nie pudełka 1/3/7", /do jutra/.test(await p.locator(".rv-boxes").innerText()) && !/60 dni/.test(await p.locator(".rv-boxes").innerText()), await p.locator(".rv-boxes").innerText());
await shot(p, "pn-powtorki");
await p.getByRole("button", { name: /Zaczynamy/ }).first().click(); await p.waitForTimeout(800);
await shot(p, "pn-player");
// Spacja odwraca kartę, klawisz 3 = „Pamiętam”.
for (let i = 0; i < 2; i++) {
  await p.getByRole("button", { name: "Odwróć kartę" }).click(); await p.waitForTimeout(250);
  if (i === 0) await shot(p, "pn-oceny");
  await p.keyboard.press("3"); await p.waitForTimeout(400);
}
await p.clock.runFor(3500);
const prog = await p.evaluate((u) => JSON.parse(localStorage.getItem("mock-progress") || "{}")[u]?.srs || {}, UID);
const graded = Object.values(prog).filter((v) => v.length === 8);
ok("ocenione karty mają stan FSRS (8 pól)", graded.length === 2, prog);
ok("nowa karta znana od razu: wraca za 3 dni (FSRS)", graded.some((v) => v[1] === day + 3), graded);
const q = await p.evaluate(() => JSON.parse(localStorage.getItem("bm-learn-q") || "[]"));
ok("zdarzenia review_graded w kolejce", q.filter((e) => e.typ === "review_graded").length === 2 && q.every((e) => e.dane.rating === 3), q);

// ---- Profil nauki: test bez gry pamięciowej, wynik, panel
// Odtwarzacz powtórek zostaje otwarty po samej zmianie adresu: pełne przeładowanie.
await p.goto(BASE + "index.html#/more"); await p.reload(); await p.waitForTimeout(2000);
await p.getByRole("button", { name: /Profil nauki/ }).click(); await p.waitForTimeout(800);
ok("Więcej → Profil nauki: start testu", /#\/learn$/.test(p.url()) && /ok\. 6 minut/.test(await p.locator("main").innerText()), await p.locator("main").innerText());
await p.getByRole("button", { name: "Zaczynamy" }).click();
await p.getByRole("radio", { name: "23:00", exact: true }).click();
await p.getByRole("radio", { name: "Po południu" }).click();
await p.getByRole("button", { name: "Dalej" }).click();
await p.getByRole("button", { name: "Pomiń tę część" }).click();
await p.getByRole("radio", { name: "ok. 20 min" }).click();
await p.getByRole("radio", { name: "Jedną dłuższą" }).click();
await p.getByRole("button", { name: "Dalej" }).click();
await p.getByRole("checkbox", { name: "Widzę postęp" }).click();
await p.getByRole("radio", { name: "4", exact: true }).click();
await p.getByRole("button", { name: "Dalej" }).click();
await p.getByRole("checkbox", { name: "Muzyka" }).click();
await shot(p, "pn-test");
await p.getByRole("button", { name: "Zobacz swój profil" }).click(); await p.waitForTimeout(400);
const res = await p.locator("main").innerText();
ok("wynik: karty z odpowiedzi", /Twój profil na start/.test(res) && /Najjaśniej myśli Ci się po południu\./.test(res) && /Śpisz ok\. 23:00/.test(res) && /ok\. 20 minut/.test(res), res);
const saved = await p.evaluate(() => window.__rpc.find((r) => r.fn === "nauka_profil_nauki_test")?.args);
ok("zapis bez liczby ze stresu, ze stressHigh", saved && !("stress" in saved.p_deklaracje) && saved.p_deklaracje.stressHigh === true && !("stress" in saved.p_odpowiedzi), saved);
await shot(p, "pn-wynik");
await p.getByRole("button", { name: "Gotowe" }).click(); await p.waitForTimeout(400);
await p.goto(BASE + "index.html#/learn"); await p.waitForTimeout(1500);
const panel = await p.locator("main").innerText();
ok("po przeładowaniu: panel, nie test", /Twoje dane/.test(panel) && /Ucz się na moich danych/.test(panel) && /Najjaśniej myśli Ci się po południu/.test(panel), panel);
await p.getByRole("switch", { name: /Ucz się na moich danych/ }).click(); await p.waitForTimeout(400);
ok("przełącznik: wyłączone w bazie", await p.evaluate(() => window.__rpc.some((r) => r.fn === "nauka_profil_nauki_wlacz" && r.args.p_wlaczone === false)), "");
await shot(p, "pn-panel");

// ---- EN: panel bez polskich zdań
const en = await page(b, { konto: "platne", lang: "en", ls: { "mock-profil": JSON.stringify({ deklaracje: { bedtime: 1380, clearest: "evening", motivations: ["plan"], interests: [] }, startowe: { blockMinutes: { value: 20, source: "test" } }, wlaczone: true, test_at: "2026-11-01T10:00:00Z" }) } });
await en.goto(BASE + "index.html#/learn"); await en.waitForTimeout(2500);
const enTxt = await en.locator("main").innerText();
ok("EN: panel po angielsku", /Learning profile/.test(enTxt) && /Your mind is clearest in the evening\./.test(enTxt) && !/Najjaśniej|Twoje dane|Dlaczego/.test(enTxt), enTxt);
await shot(en, "pn-en");

ok("bez błędów w konsoli", p.errors.length === 0 && en.errors.length === 0, [...p.errors, ...en.errors]);
await b.close();
for (const [w, n, i] of wyniki) console.log(w, n, i);
process.exit(wyniki.some(([w]) => w === "✗") ? 1 : 0);
