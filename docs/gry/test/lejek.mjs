// Etap 6 specu „Systemy z Zdawalni w Skrócie”: lejek i retencja bez cookies (atrapa bazy: nauka_wejscie, nauka_admin_lejek).
//   A. wejście liczy się raz dziennie na przeglądarkę (flaga z datą w localStorage), z rocznikiem i źródłem ?z=, bez cookies,
//   B. panel w Narzędziach starosty: lejek, lista oczekujących, powroty, dni nauki, „czy strona uczy”, rewanże, test A/B,
//      grupy < 5 ukryte, drugi rocznik z danych pojawia się sam, okres 28 dni / od początku, „Przelicz teraz”,
//   C. student nie widzi panelu,
//   D. wygrany rewanż trafia do zdarzeń nauki (activity, kind „rewanz”),
//   E. EN.
// BASE=http://127.0.0.1:8811/ node docs/gry/test/lejek.mjs
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 700)]);
const UID = "00000000-0000-4000-8000-000000000001";
const dzis = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

// A
{
  const p = await page(b, { konto: "brak", w: 375, h: 812, ls: { "skrot-rocznik": "wefiz-bm-1-st-2026" } });
  await p.goto(BASE + "index.html?z=ig"); await p.waitForTimeout(1800);
  const w1 = await p.evaluate(() => window.__rpc.filter((r) => r.fn === "nauka_wejscie"));
  ok("A: jedno wejście z rocznikiem i źródłem ?z=ig", w1.length === 1 && w1[0].args.p_rocznik === "wefiz-bm-1-st-2026" && w1[0].args.p_zrodlo === "ig", w1);
  ok("A: flaga z dzisiejszą datą w localStorage", (await p.evaluate(() => localStorage.getItem("bm-wejscie"))) === dzis());
  await p.reload(); await p.waitForTimeout(1500);
  const w2 = await p.evaluate(() => window.__rpc.filter((r) => r.fn === "nauka_wejscie"));
  ok("A: drugie otwarcie tego samego dnia nic nie wysyła", w2.length === 0, w2);
  ok("A: bez cookies", (await p.context().cookies()).length === 0 && (await p.evaluate(() => document.cookie)) === "");
  ok("A: bez błędów", !p.errors.length, p.errors);
  await p.context().close();
  const q = await page(b, { konto: "brak", w: 375, h: 812, ls: { "bm-wejscie": "2001-01-01", "skrot-rocznik": "zly" } });
  await q.goto(BASE + "index.html?zapisz=plan"); await q.waitForTimeout(1800);
  const w3 = await q.evaluate(() => window.__rpc.filter((r) => r.fn === "nauka_wejscie"));
  ok("A: nowy dzień liczy się znowu; zły rocznik → bez rocznika; źródło z linku planu", w3.length === 1 && w3[0].args.p_rocznik === null && w3[0].args.p_zrodlo === "plan", w3);
  await q.context().close();
}

const ROCZ = [
  { id: "wefiz-bm-1-st-2026", nabor: 2026, status: "platny", kod: "BM", pl: "Business Management", en: "Business Management", stopien: 1, tryb: "st" },
  { id: "wefiz-ek-1-st-2027", nabor: 2027, status: "oczekujacy", kod: "EK", pl: "Ekonomia", en: "Economics", stopien: 1, tryb: "st" },
];
const BM = {
  lejek: { d28: { wejscia: 310, konta: 48, wybor: 41, proba: 20, zakup: 4 }, wszystko: { wejscia: 2400, konta: 260, wybor: 230, proba: 120, zakup: 61 } },
  retencja: { d1: { mozliwe: 240, aktywne: 150 }, d7: { mozliwe: 220, aktywne: 99 }, d30: { mozliwe: 3, aktywne: 1 } },
  tygodnie: [{ tydzien: "2026-10-26", osoby: 80, mediana: 3, srednio: 3.2 }, { tydzien: "2026-10-19", osoby: 4, mediana: 2, srednio: 2 }],
  uczy: [
    { tydzien: "2026-11-02", sid: "*", osoby: 30, odp: 200, ok: 150 },
    { tydzien: "2026-11-02", sid: "zarzadzanie-zasobami-ludzkimi", osoby: 12, odp: 80, ok: 60 },
    { tydzien: "2026-11-02", sid: "ochrona-wlasnosci-intelektualnej", osoby: 3, odp: 9, ok: 9 },
    { tydzien: "2026-10-26", sid: "*", osoby: 25, odp: 100, ok: 70 },
    { tydzien: "2026-10-26", sid: "zarzadzanie-zasobami-ludzkimi", osoby: 9, odp: 40, ok: 26 },
  ],
  rewanze: { wygrane: 45, pokonane: 9, wszystkie: 60, osoby: 22 },
  ab: { haczyk: { haczyk: { bilety: 120, zdane: 96, osoby: 40, odp: 300, ok: 231, osoby_odp: 30 }, bez: { bilety: 110, zdane: 80, osoby: 38, odp: 280, ok: 196, osoby_odp: 4 } } },
};
const EK = { lejek: { d28: { wejscia: 12, konta: 3, wybor: 3, proba: 0, zakup: 0 }, wszystko: { wejscia: 12, konta: 3, wybor: 3, proba: 0, zakup: 0 } },
  retencja: { d1: { mozliwe: 0, aktywne: 0 }, d7: { mozliwe: 0, aktywne: 0 }, d30: { mozliwe: 0, aktywne: 0 } }, tygodnie: [], uczy: [], rewanze: { wygrane: 0, wszystkie: 0, osoby: 0 }, ab: {} };
const ALL = { ...BM, lejek: { d28: { wejscia: 330, konta: 51, wybor: 44, proba: 20, zakup: 4 }, wszystko: { wejscia: 2420, konta: 263, wybor: 233, proba: 120, zakup: 61 } },
  oczekujacy: { d28: { potwierdzone: 14, kierunki: [{ nazwa: "Logistyka · I st.", n: 2 }, { nazwa: "Ekonomia · I st.", n: 9 }], zrodla: { plan: 9, "": 5 } },
    wszystko: { potwierdzone: 30, kierunki: [{ nazwa: "Ekonomia · I st.", n: 20 }, { nazwa: "Logistyka · I st.", n: 10 }], zrodla: { plan: 20, "": 10 } } },
  wejscia_zrodla: { "": 280, ig: 25, plan: 3 } };
const LEJEK = { dzien: "2026-11-05", policzono_at: "2026-11-05T03:15:00Z", roczniki: ROCZ, dane: { "*": ALL, "wefiz-bm-1-st-2026": BM, "wefiz-ek-1-st-2027": EK } };

const wiersze = (p, sekcja) => p.evaluate((s) => {
  const sec = [...document.querySelectorAll(".lj-sec")].find((x) => x.querySelector("h2")?.textContent === s);
  return sec ? [...sec.querySelectorAll("tbody tr")].map((tr) => [...tr.children].map((c) => c.textContent.trim()).join("|")) : null;
}, sekcja);
const sekcja = (p, s) => p.evaluate((s) => [...document.querySelectorAll(".lj-sec")].find((x) => x.querySelector("h2")?.textContent === s)?.innerText || "", s);
async function panel(w, h, lang = "pl") {
  const p = await page(b, { konto: "starosta", w, h, lang, ls: { "mock-lejek": JSON.stringify(LEJEK), "bm-starosta": "1" } });
  await p.goto(BASE + "index.html#/starosta"); await p.waitForTimeout(2500);
  return p;
}
// B
for (const [w, h] of [[375, 812], [1280, 900]]) {
  const p = await panel(w, h);
  const row = p.locator("button.more-row", { hasText: "Lejek i retencja" });
  ok(`${w} B: wiersz „Lejek i retencja” w Narzędziach starosty`, (await row.count()) === 1);
  await row.click(); await p.waitForTimeout(1200);
  const opts = await p.locator("#lj-r option").allTextContents();
  ok(`${w} B: roczniki z danych (drugi rocznik bez zmian w kodzie)`, opts.join("|") === "Wszystkie roczniki|Business Management · I st. · nabór 2026|Ekonomia · I st. · nabór 2027", opts);
  await p.selectOption("#lj-r", "wefiz-bm-1-st-2026"); await p.waitForTimeout(300);
  const lej = await wiersze(p, "Lejek");
  ok(`${w} B: lejek 28 dni: wejścia → konta 15% → kierunek 85% → próba 49% (42% kont) → zakup < 5`,
    lej?.join(" / ") === "Wejścia|310|–|– / Konta|48|15%|– / Wybrany kierunek|41|85%|85% / Okres próbny|20|49%|42% / Zakup|< 5|–|–", lej);
  if (w === 375) await shot(p, "lej-375-lejek");
  await p.getByRole("button", { name: "Od początku" }).click(); await p.waitForTimeout(300);
  const lej2 = await wiersze(p, "Lejek");
  ok(`${w} B: od początku: zakup 61 (23% kont)`, lej2?.[4] === "Zakup|61|51%|23%", lej2);
  ok(`${w} B: „Od początku” wciśnięte`, (await p.getByRole("button", { name: "Od początku" }).getAttribute("aria-pressed")) === "true");
  const pow = await wiersze(p, "Powroty po założeniu konta");
  ok(`${w} B: powroty D1 63%, D7 45%, D30 ukryte (< 5 kont)`, pow?.join(" / ") === "Dzień 1|150|240|63% / Dni 7–13|99|220|45% / Dni 30–36|< 5|< 5|–", pow);
  const tyg = await wiersze(p, "Dni nauki w tygodniu");
  ok(`${w} B: dni nauki: najnowszy tydzień pierwszy, mała grupa ukryta`, tyg?.join(" / ") === "26.10|80|3|3.2 / 19.10|< 5|–|–", tyg);
  const uczy = await wiersze(p, "Czy strona uczy");
  ok(`${w} B: czy uczy: Razem 75% / 70%, ZZL 75% / 65%, OWI < 5 (3 osoby), brak = –`, uczy?.join(" / ") === "Razem|75%|70% / ZZL|75%|65% / OWI|< 5|–", uczy);
  const cu = await sekcja(p, "Czy strona uczy");
  ok(`${w} B: rewanże 45 / 60 · 75% wygranych`, /Rewanże \(28 dni\)\s+45 \/ 60 · 75%\s+wygranych/.test(cu), cu);
  const ab = await wiersze(p, "Test A/B: haczyk na początku lekcji");
  ok(`${w} B: A/B: z haczykiem 80% zdanych, uczy 77%; bez haczyka: uczy < 5`, ab?.join(" / ") === "Bez haczyka|110|73%|< 5 / Z haczykiem|120|80%|77%", ab);
  const oc = await sekcja(p, "Lista oczekujących");
  ok(`${w} B: lista oczekujących (od początku): 30, Ekonomia 20, Logistyka 10`, /30\s+potwierdzonych zapisów/.test(oc) && /Ekonomia · I st\.\s+20/.test(oc) && /Logistyka · I st\.\s+10/.test(oc), oc);
  await p.getByRole("button", { name: "Ostatnie 28 dni" }).click(); await p.waitForTimeout(300);
  const oc2 = await sekcja(p, "Lista oczekujących");
  ok(`${w} B: 28 dni: Ekonomia 9 pierwsza, Logistyka < 5`, /14\s+potwierdzonych/.test(oc2) && oc2.indexOf("Ekonomia") < oc2.indexOf("Logistyka") && /Logistyka · I st\.\s+< 5/.test(oc2), oc2);
  const zr = await sekcja(p, "Wejścia według źródła (28 dni)");
  ok(`${w} B: źródła wejść: bez źródła 280, ig 25, plan < 5`, /bez źródła: 280/.test(zr) && /ig: 25/.test(zr) && /plan: < 5/.test(zr), zr);
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(200);
  await shot(p, `lej-${w}-panel`);
  if (w === 1280) await p.screenshot({ path: `${process.env.OUT || "/tmp/gry-shots"}/lej-1280-panel-cale.png`, fullPage: true });
  else { await p.locator(".lj-sec").nth(3).scrollIntoViewIfNeeded(); await shot(p, "lej-375-uczy"); }
  // dotyk ≥ 44 px
  const male = await p.evaluate(() => [...document.querySelectorAll("main button, main select")].filter((e) => e.offsetParent && !/^←/.test(e.textContent.trim()) && e.getBoundingClientRect().height < 44).map((e) => e.textContent.trim().slice(0, 30)));
  ok(`${w} B: przyciski i wybór panelu ≥ 44 px (bez wspólnego „←” powrotu)`, male.length === 0, male);
  if (w === 375) ok("375 B: bez przewijania strony w bok", await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await p.selectOption("#lj-r", "wefiz-ek-1-st-2027"); await p.waitForTimeout(300);
  const ek = await wiersze(p, "Lejek");
  ok(`${w} B: Ekonomia 2027: 3 konta → < 5, wejścia 12`, ek?.[0] === "Wejścia|12|–|–" && ek?.[1] === "Konta|< 5|–|–", ek);
  ok(`${w} B: Ekonomia: brak powtórek i biletów → komunikaty`, /Brak powtórek po co najmniej 7 dniach/.test(await sekcja(p, "Czy strona uczy")) && /Brak biletów/.test(await sekcja(p, "Test A/B: haczyk na początku lekcji")));
  await p.getByRole("button", { name: "Przelicz teraz" }).click(); await p.waitForTimeout(600);
  ok(`${w} B: „Przelicz teraz” woła przeliczenie, wybór rocznika zostaje`, (await p.evaluate(() => window.__przelicz)) === 1 && (await p.locator("#lj-r").inputValue()) === "wefiz-ek-1-st-2027");
  ok(`${w} B: bez błędów`, !p.errors.length, p.errors);
  await p.context().close();
}
// B: puste podsumowanie (zaraz po uruchomieniu SQL)
{
  const p = await page(b, { konto: "starosta", w: 375, h: 812, ls: { "bm-starosta": "1" } });
  await p.goto(BASE + "index.html#/lejekAdmin"); await p.waitForTimeout(2200);
  ok("B: bez podsumowania: komunikat i „Przelicz teraz”", /Podsumowania jeszcze nie ma/.test(await p.locator("main").innerText()) && (await p.getByRole("button", { name: "Przelicz teraz" }).count()) === 1);
  await p.context().close();
}
// C
{
  const p = await page(b, { konto: "platne", ls: { "mock-lejek": JSON.stringify(LEJEK) } });
  await p.goto(BASE + "index.html#/lejekAdmin"); await p.waitForTimeout(2000);
  ok("C: student nie widzi panelu", /tylko dla administratora/.test(await p.locator("main").innerText()) && !(await p.evaluate(() => window.__rpc.some((r) => /lejek/.test(r.fn)))));
  await p.context().close();
}
// D: wygrany rewanż → zdarzenie nauki (jak w rewanze.mjs B: błąd wczoraj, dziś dobra odpowiedź)
{
  const now = new Date("2026-11-04T18:00:00+01:00").getTime();
  const quiz = Array.from({ length: 4 }, (_, i) => ({ q: `Makro: pytanie ${i}?`, options: ["Pierwsza", "Druga", "Trzecia", "Czwarta"], correct: i % 4, why: "Bo tak." }));
  const docs = { materials: { m1: { subjectId: "makroekonomia", title: "PKB i inflacja", quizCount: 4, flashcardCount: 0, createdAt: now - 1e6, v: 2 } },
    materialContent: { m1: { v: 2, summary: "x", quiz, flashcards: [] } } };
  const day = Math.round((new Date(2026, 10, 3) - new Date(2026, 0, 1)) / 864e5);
  const p = await page(b, { konto: "platne", ls: { "mock-docs": JSON.stringify(docs), "mock-progress": JSON.stringify({ [UID]: { group: "C111", sub: "A", rew: { "z:m1:0": [[day, 0]] } } }) } });
  await p.clock.install({ time: new Date(now) });
  await p.goto(BASE + "index.html#/review"); await p.waitForTimeout(2500);
  await p.getByRole("button", { name: /Zaczynamy/ }).first().click(); await p.waitForTimeout(900);
  const opts = p.locator(".lp-opts .opt");
  for (let i = 0; i < await opts.count(); i++) if ((await opts.nth(i).textContent()).includes("Pierwsza")) { await opts.nth(i).click(); break; }
  await p.waitForTimeout(500);
  const ev = await p.evaluate(() => [...JSON.parse(localStorage.getItem("bm-learn-q") || "[]"), ...window.__rpc.filter((r) => r.fn === "nauka_zdarzenia_zapisz").flatMap((r) => r.args.p_zdarzenia)]
    .filter((e) => e.typ === "activity" && e.dane?.kind === "rewanz"));
  ok("D: wygrany rewanż → activity { kind: rewanz, wynik: won, sid: makroekonomia }", ev.length === 1 && ev[0].dane.wynik === "won" && ev[0].dane.sid === "makroekonomia" && ev[0].dane.ok === 1, ev);
  ok("D: bez błędów", !p.errors.length, p.errors);
  await p.context().close();
}
// E
for (const [w, h] of [[375, 812], [1280, 900]]) {
  const p = await panel(w, h, "en");
  await p.goto(BASE + "index.html#/lejekAdmin"); await p.waitForTimeout(1800);
  await p.selectOption("#lj-r", "wefiz-bm-1-st-2026"); await p.waitForTimeout(400);
  const t = await p.locator("main").innerText();
  ok(`${w} E: EN panel`, /Funnel and retention/.test(t) && /Programme chosen/.test(t) && /Returns after sign-up/.test(t) && /Does the site teach\?/.test(t) && /With hook/.test(t) && /intake 2026/.test(t), t.slice(0, 600));
  const pl = t.replace(/Skrót/g, "").match(/[^\n]*[ąęłśżźćńóĄĘŁŚŻŹĆŃÓ][^\n]*/g);
  ok(`${w} E: bez polskich znaków`, !pl, pl);
  await shot(p, `lej-${w}-en`);
  ok(`${w} E: bez błędów`, !p.errors.length, p.errors);
  await p.context().close();
}
await b.close();
for (const [s, n, i] of wyniki) console.log(s, n, i);
const bad = wyniki.filter((x) => x[0] === "✗").length;
console.log(bad ? `BŁĘDY: ${bad}` : `OK ${wyniki.length}`);
process.exit(bad ? 1 : 0);
