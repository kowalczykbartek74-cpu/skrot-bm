// „Stażysta Staś” na atrapie: starosta robi wyjaśnienia z błędami (AI na niby), student zaznacza złe zdania i wybiera poprawki.
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 600)]);
const prompty = [];
// 10 zdań, błędy w zdaniach 3, 6 i 9 (indeksy 2, 5, 8).
const fakeAi = (prompt) => {
  prompty.push(prompt);
  const t = (prompt.match(/TEMAT: (.*)/) || [])[1] || "?";
  return { title: "Staś o: " + t, sentences: Array.from({ length: 10 }, (_, i) => [2, 5, 8].includes(i)
    ? { text: `Złe zdanie ${i + 1} o **${t}**.`, isWrong: true, fix: `Poprawione zdanie ${i + 1}.`, alts: [`Zła poprawka A${i + 1}.`, `Zła poprawka B${i + 1}.`], why: `Bo tak ${i + 1}.` }
    : { text: `Dobre zdanie ${i + 1}.`, isWrong: false }) };
};
const ai = async (p) => p.context().route(/functions\/v1\/claude/, async (r) => { const { prompt } = JSON.parse(r.request().postData()); r.fulfill({ contentType: "application/json", body: JSON.stringify({ json: fakeAi(prompt) }) }); });

// ---- starosta
const s = await page(b, { konto: "starosta", ls: { "bm-starosta": "1" } });
await ai(s);
await s.goto(BASE + "index.html#/stas"); await s.waitForTimeout(2500);
const subs = await s.locator(".po-subj").allInnerTexts();
ok("starosta: lista przedmiotów z tematami", subs.length >= 5 && subs.some((x) => /Analiza matematyczna/.test(x)), subs);
await s.locator(".po-subj", { hasText: "Analiza matematyczna" }).click(); await s.waitForTimeout(800);
ok("adres #/stas/analiza-matematyczna", /#\/stas\/analiza-matematyczna$/.test(s.url()), s.url());
const btn = s.getByRole("button", { name: /Przygotuj brakujące z sylabusa \((\d+)\)/ });
const ile = +((await btn.innerText()).match(/\((\d+)\)/) || [])[1];
ok("brakujące tematy > 0", ile > 0, ile);
await btn.click();
await s.waitForFunction(() => !/Robię…/.test(document.body.innerText), null, { timeout: 30000 }); await s.waitForTimeout(400);
ok("wygenerowano wszystkie", (await s.locator(".stas-admin .sdot.ok").count()) === ile && prompty.length === ile, [await s.locator(".stas-admin").innerText(), prompty.length]);
ok("prompt: temat + zasady Stasia + cele", prompty.every((x) => /TEMAT:/.test(x) && /Dokładnie 3 zdania/.test(x) && /CELE PRZEDMIOTU/.test(x)), prompty[0]?.slice(-400));
ok("po generowaniu: wszystkie gotowe", await s.getByText("wszystkie tematy z sylabusa gotowe").count() === 1, "");
await shot(s, "stas-starosta");
const docs = await s.evaluate(async () => { const db = await window.claude.use("db"); const i = await db.doc("meta/stas").get(); const items = i.data().items; const out = { "meta/stas": i.data() }; for (const id of Object.keys(items)) out["meta/stas~" + id] = (await db.doc("meta/stas~" + id).get()).data(); return out; });
ok("zapis: meta/stas + treści, n = 3", Object.keys(docs).length === ile + 1 && Object.values(docs["meta/stas"].items).every((x) => x.n === 3), Object.keys(docs));

// ---- student
const meta = {}; for (const [k, v] of Object.entries(docs)) meta[k.slice(5)] = v;
const p = await page(b, { konto: "platne", ls: { "mock-docs": JSON.stringify({ meta }) } });
await p.goto(BASE + "index.html#/more"); await p.waitForTimeout(2000);
ok("Więcej: wpis Stażysta Staś", (await p.getByText("Stażysta Staś").count()) >= 1, "");
await p.getByText("Stażysta Staś").first().click(); await p.waitForTimeout(800);
ok("#/stas: tylko przedmiot z gotowymi", /#\/stas$/.test(p.url()) && (await p.locator(".po-subj").count()) === 1 && /do poprawienia: \d+/.test(await p.locator(".po-subj").innerText()), await p.locator("main").innerText());
await shot(p, "stas-lista");
await p.locator(".po-subj").click(); await p.waitForTimeout(600);
ok("student: bez narzędzi starosty", (await p.locator(".stas-admin, .po-tools").count()) === 0 && (await p.locator(".po-row").count()) === ile, "");
await p.locator(".po-open").first().click(); await p.waitForTimeout(1000);
ok("ćwiczenie: 10 klikalnych zdań", (await p.locator(".stas-s[role=button]").count()) === 10, await p.locator("main").innerText());
ok("dymek: 3 błędy", /zrobiłem 3 błędy/.test(await p.locator(".stas-bubble").innerText()), await p.locator(".stas-bubble").innerText());
ok("Sprawdź wyłączone bez zaznaczeń", await p.getByRole("button", { name: "Sprawdź ✓" }).isDisabled(), "");
const S_ = (i) => p.locator(".stas-s").nth(i);
// zaznacz 2 trafne (3, 6) i 1 dobre (1); czwarte zaznaczenie się nie da
await S_(2).click(); await S_(5).click(); await S_(0).click(); await S_(3).click(); await p.waitForTimeout(200);
ok("limit długopisów: 3", (await p.locator(".stas-s.flag").count()) === 3 && !(await S_(3).getAttribute("class")).includes("flag"), "");
await S_(0).click(); await S_(0).click(); // odznacz i zaznacz ponownie
ok("odznaczanie działa", (await p.locator(".stas-s.flag").count()) === 3, "");
await shot(p, "stas-zaznaczone");
await p.getByRole("button", { name: "Sprawdź ✓" }).click(); await p.waitForTimeout(300);
ok("po sprawdzeniu: 2 trafione, 1 przegapione, 1 fałszywe", (await p.locator(".stas-s.hit").count()) === 2 && (await p.locator(".stas-s.miss").count()) === 1 && (await p.locator(".stas-s.false").count()) === 1, "");
ok("karty poprawek: 3 (2 do wyboru, 1 z odpowiedzią)", (await p.locator(".stas-fix").count()) === 3 && (await p.locator(".stas-fix.is-hit .po-opt").count()) === 6 && /Poprawione zdanie 9/.test(await p.locator(".stas-fix.is-miss").innerText()), "");
ok("brak wyniku przed wyborem poprawek", (await p.locator(".stas-sum").count()) === 0, "");
// dobra poprawka w 1. karcie, zła w 2.
await p.locator(".stas-fix.is-hit").nth(0).getByRole("button", { name: "Poprawione zdanie 3." }).click();
await p.locator(".stas-fix.is-hit").nth(1).getByRole("button", { name: /Zła poprawka A6/ }).click(); await p.waitForTimeout(200);
ok("wyjaśnienia why widoczne", (await p.locator(".stas-fix .po-why").count()) === 3, "");
const sum = await p.locator(".stas-sum").innerText();
ok("wynik: (2-1) + 1 = 2/6", /Wynik: 2\/6 pkt/.test(sum) && /Znalezione błędy: 1\/3 · dobre poprawki: 1\/3/.test(sum), sum);
await shot(p, "stas-wynik");
await p.getByRole("button", { name: "Jeszcze raz" }).click(); await p.waitForTimeout(200);
ok("Jeszcze raz: czyści", (await p.locator(".stas-s.flag, .stas-fix").count()) === 0 && (await p.locator(".stas-s[role=button]").count()) === 10, "");
// perfekcyjnie
for (const i of [2, 5, 8]) await S_(i).click();
await p.getByRole("button", { name: "Sprawdź ✓" }).click(); await p.waitForTimeout(200);
for (const n of [3, 6, 9]) await p.getByRole("button", { name: `Poprawione zdanie ${n}.` }).click();
ok("perfekcyjnie: 6/6, Staś 😎", /Wynik: 6\/6/.test(await p.locator(".stas-sum").innerText()) && (await p.locator(".stas-face").first().innerText()) === "😎", "");
await p.getByRole("button", { name: "Gotowe ✓" }).click(); await p.waitForTimeout(600);
ok("po Gotowe: lista tematów z 6/6 pkt", /#\/stas\/analiza-matematyczna/.test(p.url()) && (await p.locator(".po-row .chip", { hasText: "6/6 pkt" }).count()) === 1, p.url());
ok("zapis bm-stas-done", await p.evaluate(() => Object.values(JSON.parse(localStorage.getItem("bm-stas-done"))).some((r) => r.f === 3 && r.x === 3 && r.n === 3)), "");
await p.goto(BASE + "index.html#/subject/analiza-matematyczna"); await p.waitForTimeout(1500);
ok("przedmiot: przycisk 🤓 Popraw Stasia", (await p.getByRole("button", { name: "🤓 Popraw Stasia" }).count()) === 1, "");
await p.goto(BASE + "index.html#/subject/mikroekonomia"); await p.waitForTimeout(1200);
ok("przedmiot bez wyjaśnień: bez przycisku", (await p.getByRole("button", { name: "🤓 Popraw Stasia" }).count()) === 0, "");
// klawiatura
await p.goto(BASE + "index.html#/stasx/" + Object.keys(docs["meta/stas"].items)[0]); await p.waitForTimeout(1200);
await S_(1).focus(); await p.keyboard.press("Enter");
ok("klawiatura: Enter zaznacza", (await S_(1).getAttribute("aria-pressed")) === "true", "");
// telefon: brak poziomego przewijania
ok("bez poziomego przewijania", await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "");
// EN
const e = await page(b, { konto: "platne", lang: "en", ls: { "mock-docs": JSON.stringify({ meta }) } });
await e.goto(BASE + "index.html#/stasx/" + Object.keys(docs["meta/stas"].items)[0]); await e.waitForTimeout(2500);
const enTxt = await e.locator("main").innerText();
ok("EN: przetłumaczone", /Intern Stan/.test(enTxt) && /The boss says I made 3 mistakes/.test(enTxt) && !/Szef mówi/.test(enTxt), enTxt.slice(0, 600));
await shot(e, "stas-en");
// bez dostępu
const d = await page(b, { konto: "darmowe" });
await d.goto(BASE + "index.html#/stas"); await d.waitForTimeout(2000);
ok("bez dostępu: paywall", (await d.locator(".paywall").count()) === 1, await d.locator("main").innerText());
for (const x of [s, p, e, d]) ok("bez błędów JS", !x.errors.length, x.errors);
console.table(wyniki); console.log(`${wyniki.filter((w) => w[0] === "✓").length}/${wyniki.length}`);
await b.close();
