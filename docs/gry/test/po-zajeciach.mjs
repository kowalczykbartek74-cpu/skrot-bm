// „Po zajęciach w 5 minut” na atrapie: starosta robi podsumowania (AI na niby), student czyta je w 5 krokach.
// Zegar: piątek 6.11.2026, 18:00 (C111 lab A ma wtedy wykład z Analizy matematycznej, zakończony).
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 600)]);
const CZAS = new Date("2026-11-06T18:00:00+01:00");
const prompty = [];
const fakeAi = (prompt) => {
  prompty.push(prompt);
  const t = (prompt.match(/TEMAT ZAJĘĆ: (.*)/) || [])[1] || "?";
  return { title: "Po polsku: " + t, lead: "Zajęcia były o " + t + ".",
    parts: [1, 2, 3, 4, 5].map((i) => ({ h: `Część ${i}`, t: `Tekst części ${i} o **${t}**.\n\n- punkt A\n- punkt B`, ex: i === 2 ? "Wzór \\(2+3=5\\)" : "" })),
    key: ["Raz", "Dwa", "Trzy"], terms: [{ en: "derivative", pl: "pochodna" }, { en: "limit", pl: "granica" }],
    quiz: [0, 1, 2].map((i) => ({ q: `Pytanie ${i + 1}?`, options: ["A", "B", "C", "D"], correct: i, why: `Bo ${i}.` })) };
};
const ai = async (p) => p.context().route(/functions\/v1\/claude/, async (r) => { const { prompt } = JSON.parse(r.request().postData()); r.fulfill({ contentType: "application/json", body: JSON.stringify({ json: fakeAi(prompt) }) }); });

// ---- starosta
const s = await page(b, { konto: "starosta", ls: { "bm-starosta": "1" } });
await s.clock.setFixedTime(CZAS); await ai(s);
await s.goto(BASE + "index.html#/po"); await s.waitForTimeout(2500);
const subs = await s.locator(".po-subj").allInnerTexts();
ok("lista przedmiotów", subs.length >= 5 && subs.some((x) => /Analiza matematyczna/.test(x)), subs);
await s.locator(".po-subj", { hasText: "Analiza matematyczna" }).click(); await s.waitForTimeout(800);
ok("adres #/po/analiza-matematyczna", /#\/po\/analiza-matematyczna$/.test(s.url()), s.url());
const ostatnie = await s.locator("section.panel", { has: s.locator("h2", { hasText: "Twoje ostatnie zajęcia" }) }).innerText().catch(() => "");
ok("ostatnie zajęcia: dziś, wykład, temat wg sylabusa", /dziś · wykład/.test(ostatnie) && /jeszcze nie ma/.test(ostatnie), ostatnie);
const btn = s.getByRole("button", { name: /Przygotuj brakujące z sylabusa \((\d+)\)/ });
const ile = +((await btn.innerText()).match(/\((\d+)\)/) || [])[1];
ok("brakujące tematy > 0", ile > 0, ile);
await btn.click();
await s.waitForFunction(() => !/Robię…/.test(document.body.innerText), null, { timeout: 30000 }); await s.waitForTimeout(400);
ok("wygenerowano wszystkie", (await s.locator(".po-admin .sdot.ok").count()) === ile && prompty.length === ile, [await s.locator(".po-admin").innerText(), prompty.length]);
ok("prompt: temat + cele sylabusa, bez notatek", prompty.every((x) => /TEMAT ZAJĘĆ:/.test(x) && /CELE PRZEDMIOTU/.test(x) && !/NOTATKI Z ZAJĘĆ \(od starosty\)/.test(x)), prompty[0]?.slice(-500));
ok("po generowaniu: wszystkie gotowe", await s.getByText("wszystkie tematy z sylabusa gotowe").count() === 1, "");
const ostatnie2 = await s.locator("section.panel", { has: s.locator("h2", { hasText: "Twoje ostatnie zajęcia" }) }).innerText();
ok("ostatnie zajęcia mają już ⚡ 5 min", /5 min/.test(ostatnie2), ostatnie2);
await shot(s, "po-starosta");

// dodaj z dzisiejszych zajęć (z notatkami)
await s.getByRole("button", { name: "+ Dodaj z dzisiejszych zajęć" }).click(); await s.waitForTimeout(300);
await s.locator(".modal input[type=text]").fill("Pochodne funkcji złożonych – przykłady z tablicy");
await s.locator(".modal textarea").fill("Prowadząca: reguła łańcuchowa, 3 przykłady, na kolokwium będzie podobne.");
await s.getByRole("button", { name: "Zrób i opublikuj" }).click();
await s.waitForFunction(() => !document.querySelector(".modal"), null, { timeout: 15000 }); await s.waitForTimeout(400);
ok("prompt z notatkami", /NOTATKI Z ZAJĘĆ[\s\S]*reguła łańcuchowa/.test(prompty.at(-1)), prompty.at(-1)?.slice(-400));
const od = await s.locator("section.panel", { has: s.locator("h2", { hasText: "Od starosty, z zajęć" }) }).innerText().catch(() => "");
ok("sekcja Od starosty", /Pochodne funkcji złożonych/.test(od) && /dziś · wykład/.test(od), od);
const ost3 = await s.locator("section.panel", { has: s.locator("h2", { hasText: "Twoje ostatnie zajęcia" }) }).locator(".po-row").first().innerText();
ok("dzisiejsze zajęcia biorą podsumowanie starosty (pierwszeństwo)", /Pochodne funkcji złożonych/.test(ost3), ost3);
const docs = await s.evaluate(async () => { const db = await window.claude.use("db"); const i = await db.doc("meta/po").get(); const items = i.data().items; const out = { "meta/po": i.data() }; for (const id of Object.keys(items)) out["meta/po~" + id] = (await db.doc("meta/po~" + id).get()).data(); return out; });
ok("zapis: meta/po + treści", Object.keys(docs).length === ile + 2, Object.keys(docs));

// ---- student: te same dane w atrapie
const meta = {}; for (const [k, v] of Object.entries(docs)) meta[k.slice(5)] = v;
const p = await page(b, { konto: "platne", ls: { "mock-docs": JSON.stringify({ meta }) } });
await p.clock.setFixedTime(CZAS);
await p.goto(BASE + "index.html#/"); await p.waitForTimeout(2500);
const card = p.locator(".po-card");
ok("Dziś: karta Po zajęciach", (await card.count()) === 1 && /Analiza matematyczna/.test(await card.innerText()) && /Pochodne funkcji złożonych/.test(await card.innerText()), await p.locator("main").innerText());
await shot(p, "po-home");
await card.getByRole("button", { name: /Tłumacz mi to/ }).click(); await p.waitForTimeout(800);
ok("czytnik: krok 1/5", /1 \/ 5/.test(await p.locator(".po-part").innerText()) && /zostało ok. 5 min/.test(await p.locator(".po-head").innerText()), await p.locator("main").innerText());
await shot(p, "po-krok1");
for (let i = 0; i < 5; i++) { await p.getByRole("button", { name: /Dalej →|Podsumowanie →/ }).click(); await p.waitForTimeout(150); }
const fin = await p.locator(".po-part").innerText();
ok("ostatni krok: Zapamiętaj, pojęcia, 3 pytania", /Zapamiętaj/.test(fin) && /derivative/.test(fin) && (await p.locator(".po-q").count()) === 3, fin);
for (let i = 0; i < 3; i++) { await p.locator(".po-q").nth(i).locator(".po-opt").first().click(); await p.waitForTimeout(100); }
ok("odpowiedzi: 1 dobra, 2 złe", (await p.locator(".po-why.ok").count()) === 1 && (await p.locator(".po-why.bad").count()) === 2, "");
await shot(p, "po-koniec");
await p.getByRole("button", { name: "Gotowe ✓" }).click(); await p.waitForTimeout(600);
ok("po Gotowe: ekran przedmiotu, przeczytane", /#\/po\/analiza-matematyczna/.test(p.url()) && (await p.getByText("przeczytane", { exact: true }).count()) >= 1, p.url());
await p.goto(BASE + "index.html#/"); await p.waitForTimeout(1500);
ok("Dziś: karta oznaczona ✓ przeczytane", /✓ przeczytane/.test(await p.locator(".po-card").innerText().catch(() => "")), "");
// przedmiot → przycisk w okładce, Więcej → wpis
await p.goto(BASE + "index.html#/subject/analiza-matematyczna"); await p.waitForTimeout(1200);
ok("przedmiot: przycisk ⚡", (await p.locator(".po-cover-btn").count()) === 1, "");
await p.goto(BASE + "index.html#/more"); await p.waitForTimeout(1200);
ok("Więcej: wpis Po zajęciach", (await p.getByText("Po zajęciach w 5 minut").count()) >= 1, "");
// 14:00: Analiza (do 13:30) już po, ZZL jeszcze trwa, więc lista „Dziś masz…” pokazuje dzisiejsze zajęcia z linkiem ⚡
const q = await page(b, { konto: "platne", ls: { "mock-docs": JSON.stringify({ meta }) } });
await q.clock.setFixedTime(new Date("2026-11-06T14:00:00+01:00"));
await q.goto(BASE + "index.html#/"); await q.waitForTimeout(2500);
const links = await q.locator(".cls").evaluateAll((els) => els.map((e) => [e.querySelector(".nm")?.textContent, !!e.querySelector(".po-link")]));
ok("Dziś 14:00: link ⚡ tylko przy zakończonej Analizie", links.some(([n, l]) => /Analiza/.test(n) && l) && links.filter(([, l]) => l).length === 1, links);
await shot(q, "po-dzis-14");
// EN
const e = await page(b, { konto: "platne", lang: "en", ls: { "mock-docs": JSON.stringify({ meta }) } });
await e.clock.setFixedTime(CZAS);
await e.goto(BASE + "index.html#/po/analiza-matematyczna"); await e.waitForTimeout(2500);
const enTxt = await e.locator("main").innerText();
ok("EN: przetłumaczone", /After class in 5 minutes/i.test(enTxt) && !/examples of tablicy/.test(enTxt) && /Your recent classes/.test(enTxt) && !/Twoje ostatnie zajęcia|Wszystkie tematy z sylabusa/.test(enTxt), enTxt.slice(0, 800));
await shot(e, "po-en");
// bez dostępu
const d = await page(b, { konto: "darmowe" });
await d.clock.setFixedTime(CZAS);
await d.goto(BASE + "index.html#/po"); await d.waitForTimeout(2000);
ok("bez dostępu: paywall", (await d.locator(".paywall").count()) === 1, await d.locator("main").innerText());
for (const x of [s, p, q, e, d]) ok("bez błędów JS", !x.errors.length, x.errors);
console.table(wyniki); console.log(`${wyniki.filter((w) => w[0] === "✓").length}/${wyniki.length}`);
await b.close();
