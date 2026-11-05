// Etap 2 specu „Systemy z Zdawalni w Skrócie”: rewanże (zeszyt błędów). Zegar: wtorek 3.11.2026, 18:00.
//   A. błąd w quizie przedmiotu → rewanż jutro; dobra odpowiedź tego samego dnia (druga szansa) się nie liczy,
//   B. jutro: blok „Rewanże” na początku Powtórek, licznik na Dziś, wygrany rewanż,
//   C. trzecia wygrana = pokonane (🏆), pytanie wraca do zwykłych powtórek,
//   D. stara lista pomylonych w grach (bm-gry-zle) przechodzi jednorazowo do rewanży, gry i quizy mają jedną listę,
//   E. drugi przedmiot (dowolny z rocznika) i EN.
// BASE=http://127.0.0.1:8811/ node docs/gry/test/rewanze.mjs
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 700)]);
const UID = "00000000-0000-4000-8000-000000000001";
const now = new Date("2026-11-03T18:00:00+01:00").getTime();
const quiz = (tag) => Array.from({ length: 4 }, (_, i) => ({ q: `${tag}: pytanie ${i}?`, options: ["Pierwsza", "Druga", "Trzecia", "Czwarta"], correct: i % 4, why: "Bo tak." }));
const docs = {
  materials: {
    m1: { subjectId: "makroekonomia", title: "PKB i inflacja", quizCount: 4, flashcardCount: 0, createdAt: now - 1e6, v: 2 },
    m2: { subjectId: "mikroekonomia", title: "Popyt i podaż", quizCount: 4, flashcardCount: 0, createdAt: now - 2e6, v: 2 },
  },
  materialContent: { m1: { v: 2, summary: "x", quiz: quiz("Makro"), flashcards: [] }, m2: { v: 2, summary: "x", quiz: quiz("Mikro"), flashcards: [] } },
};
const day = Math.round((new Date(2026, 10, 3) - new Date(2026, 0, 1)) / 864e5);
const progOf = (p) => p.evaluate((u) => JSON.parse(localStorage.getItem("mock-progress") || "{}")[u] || {}, UID);
const toasts = (p) => p.evaluate(() => [...document.querySelectorAll(".toast")].map((t) => t.textContent).join(" | "));
async function otworz(p, prog, dzien, hash = "review") {
  await p.clock.install({ time: new Date(now + dzien * 864e5) });
  await p.goto(BASE + "index.html#/" + hash); await p.waitForTimeout(2500);
}
async function strona(prog, ls = {}, lang = "pl") {
  return page(b, { konto: "platne", lang, ls: { "mock-docs": JSON.stringify(docs), "mock-progress": JSON.stringify({ [UID]: prog }), ...ls } });
}
// Kliknij opcję o oryginalnym indeksie want (po treści opcji), albo pierwszą inną niż want, gdy zle = true.
async function wybierz(p, want, zle = false) {
  const opts = p.locator(".lp-opts .opt");
  await opts.first().waitFor({ timeout: 5000 });
  const n = await opts.count();
  for (let i = 0; i < n; i++) {
    const t = await opts.nth(i).textContent(), orig = ["Pierwsza", "Druga", "Trzecia", "Czwarta"].findIndex((w) => t.includes(w));
    if (zle ? orig !== want : orig === want) { await opts.nth(i).click(); return orig; }
  }
  throw new Error("brak opcji");
}
const pytanie = (p) => p.locator(".lp-big.q").first().textContent();
async function dalej(p) { if (await p.locator(".modal-bg, .modal").count()) await p.keyboard.press("Escape"); await p.locator(".lp-cta").click({ timeout: 4000 }).catch(() => {}); await p.waitForTimeout(450); }

// A + B + C na jednym koncie, dzień po dniu
let prog = { group: "C111", sub: "A" };
{
  const p = await strona(prog);
  await otworz(p, prog, 0, "material/m1");
  await p.getByRole("button", { name: /Quiz/ }).first().click();
  await p.getByRole("button", { name: /Zaczynamy/ }).click(); await p.waitForTimeout(700);
  // Pytanie 0 źle, reszta dobrze; druga szansa na pytaniu 0 dobrze (ten sam dzień: nie zdejmuje błędu).
  for (let i = 0; i < 12 && (await p.locator(".lp-opts .opt").count()); i++) {
    if (await p.locator(".lp-opts .opt:disabled").count()) { await dalej(p); continue; }
    const q = await pytanie(p), idx = +q.match(/pytanie (\d)/)[1];
    const first0 = idx === 0 && !(await p.evaluate(() => window.__zle0));
    if (first0) await p.evaluate(() => { window.__zle0 = 1; });
    await wybierz(p, idx % 4, first0); await p.waitForTimeout(300); await dalej(p);
  }
  await p.waitForTimeout(500);
  const done = await p.locator("body").innerText().catch(() => "");
  ok("A: koniec quizu mówi, że pytanie wróci jutro na rewanż", /1 pytanie wróci jutro na rewanż/.test(done), done.slice(0, 400));
  await p.clock.runFor(3500);
  prog = await progOf(p);
  await p.reload(); await p.waitForTimeout(800);
  ok("A: błąd zapisany jako rewanż z:m1:0 (wynik dnia 0 mimo poprawki), dobre pytania nie", JSON.stringify(prog.rew) === JSON.stringify({ "z:m1:0": [[day, 0]] }), prog.rew);
  ok("A: karta pytania jest w powtórkach (FSRS, termin jutro)", prog.srs?.["z:m1:0"]?.[1] === day + 1, prog.srs);
  await p.goto(BASE + "index.html#/review"); await p.waitForTimeout(1500);
  const panel = await p.locator(".rv-rew").innerText().catch(() => "");
  ok("A: dziś rewanż czeka na jutro (nie ma go w dzisiejszej powtórce)", /Następny jutro/.test(panel) && !(await p.locator(".rv-hero .sk-bignum").count()), panel);
  ok("A: bez błędów w konsoli", !p.errors.length, p.errors);
  await p.context().close();
}
{
  const p = await strona(prog);
  await otworz(p, prog, 1, "");
  const dz = await p.locator(".sk-now").innerText();
  ok("B: Dziś liczy rewanż („W tym 1 rewanż”)", /W tym 1 rewanż\./.test(dz), dz);
  const badge = await p.locator('.navbtn[data-key="review"] .badge').textContent().catch(() => "");
  ok("B: plakietka Powtórek = 1", badge === "1", badge);
  await p.goto(BASE + "index.html#/review"); await p.waitForTimeout(1500);
  const panel = await p.locator(".rv-rew").innerText();
  ok("B: blok „Rewanże” w Powtórkach: 1 pytanie czeka dziś", /1 pytanie czeka dziś na rewanż/.test(panel), panel);
  await shot(p, "rew-powtorki");
  await p.getByRole("button", { name: /Zaczynamy/ }).first().click(); await p.waitForTimeout(900);
  const head = await p.locator(".lp").innerText();
  ok("B: sesja zaczyna się od bloku „Rewanże” z pytaniem z quizu", /Rewanż/i.test(head) && /Makro: pytanie 0\?/.test(head), head.slice(0, 300));
  await wybierz(p, 0); await p.waitForTimeout(400);
  const t = await toasts(p);
  ok("B: wygrany rewanż („Wróci jeszcze za 3 dni”)", /Rewanż wygrany! Wróci jeszcze za 3 dni\./.test(t), t);
  await shot(p, "rew-wygrany");
  await p.clock.runFor(3500);
  prog = await progOf(p);
  ok("B: historia: błąd, potem wygrana innego dnia", JSON.stringify(prog.rew["z:m1:0"]) === JSON.stringify([[day, 0], [day + 1, 1]]), prog.rew);
  ok("B: bez błędów w konsoli", !p.errors.length, p.errors);
  await p.context().close();
}
{
  // dwie wygrane już są (dzień+1, dzień+4); trzecia, gdy termin przyjdzie → pokonane
  prog = { ...prog, rew: { "z:m1:0": [[day, 0], [day + 1, 1], [day + 4, 1]] } };
  const p = await strona(prog);
  await otworz(p, prog, 14);
  await p.getByRole("button", { name: /Zaczynamy/ }).first().click(); await p.waitForTimeout(900);
  await wybierz(p, 0); await p.waitForTimeout(400);
  const t = await toasts(p);
  ok("C: trzecia wygrana = „Pytanie pokonane!”", /Pytanie pokonane!/.test(t), t);
  await p.clock.runFor(3500);
  prog = await progOf(p);
  ok("C: licznik pokonanych = 1", prog.rewPok === 1, prog.rewPok);
  await p.goto(BASE + "index.html#/review"); await p.waitForTimeout(1500);
  const panel = await p.locator(".rv-rew").innerText().catch(() => "");
  ok("C: odznaka 🏆 1 pokonane w bloku", /🏆 1 pokonane/.test(panel) && /Wszystkie rewanże pokonane/.test(panel), panel);
  const v = prog.srs?.["z:m1:0"];
  ok("C: pytanie zostaje w zwykłych powtórkach (karta FSRS z terminem w przyszłości)", Array.isArray(v) && v.length === 8 && v[1] > day + 14, v);
  ok("C: bez błędów w konsoli", !p.errors.length, p.errors);
  await p.context().close();
}
// D. migracja bm-gry-zle i jedna lista z grami
{
  const p = await strona({ group: "C111", sub: "A" }, { "bm-gry-zle": JSON.stringify({ "m2:1": day - 2, "po~abc:0": day - 1 }) });
  await otworz(p, null, 0);
  await p.clock.runFor(3500);
  const pr = await progOf(p), left = await p.evaluate(() => localStorage.getItem("bm-gry-zle"));
  ok("D: pomylone z gier przeniesione do rewanży (po~ zostaje poza), stara lista usunięta", JSON.stringify(pr.rew) === JSON.stringify({ "z:m2:1": [[day - 2, 0]] }) && pr.rewMig === day && left === null, { rew: pr.rew, mig: pr.rewMig, left });
  const panel = await p.locator(".rv-rew").innerText().catch(() => "");
  ok("D/E: pytanie z drugiego przedmiotu czeka dziś na rewanż", /1 pytanie czeka dziś na rewanż/.test(panel), panel);
  ok("D: bez błędów w konsoli", !p.errors.length, p.errors);
  await p.context().close();
}
// E. EN
{
  const p = await strona({ group: "C111", sub: "A", rew: { "z:m2:1": [[day - 2, 0]], "z:m1:0": [[day, 0]] } }, {}, "en");
  await otworz(p, null, 0);
  const panel = await p.locator(".rv-rew").innerText().catch(() => "");
  ok("E: EN: blok Rematches", /Rematches/.test(panel) && /1 question is waiting for a rematch today\./.test(panel) && !/[ąęłśżź]/.test(panel), panel);
  await shot(p, "rew-powtorki-en");
  await p.goto(BASE + "index.html#/"); await p.waitForTimeout(1500);
  const dz = await p.locator(".sk-now").innerText();
  ok("E: EN: Dziś „Including 1 rematch”", /Including 1 rematch\./.test(dz), dz);
  ok("E: bez błędów w konsoli", !p.errors.length, p.errors);
  await p.context().close();
}
await b.close();
for (const w of wyniki) console.log(w.join(" "));
console.log(`${wyniki.filter((w) => w[0] === "✓").length}/${wyniki.length}`);
