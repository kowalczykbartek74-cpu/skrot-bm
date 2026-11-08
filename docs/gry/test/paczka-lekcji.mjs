// Panel AI → „Paczka lekcji” (schemat kierunków, Etap D/E) na atrapie: zapis tylko do wczytanego rocznika („Edytuję rocznik”),
// odrzucenie paczki z innego rocznika i z obcym przedmiotem, PL/EN, 375 px. Lekcja w teście jest sztuczna (bez prawdziwych treści).
//   BASE=http://127.0.0.1:<port>/ ROCZNIK=<id rocznika z rocznik.js, inny niż BM> PLAN_PLIK=<plan-bm>/plan/<id>.json [PRZEDMIOT=<id>] node docs/gry/test/paczka-lekcji.mjs
// Przedmioty rocznika pochodzą z jego planu zajęć, więc test podaje plan z pliku (atrapa blokuje plan.skrotbm.pl).
import fs from "fs";
import { chromium, page, BASE, shot } from "./lib.mjs";
const BM_ID = "wefiz-bm-1-st-2026";
const ROK = process.env.ROCZNIK || "wefiz-zarz-1-st-2026";
const PLAN = fs.readFileSync(process.env.PLAN_PLIK || `${process.env.HOME}/plan-bm-fir/plan/${ROK}.json`, "utf8");
const slug = (t) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const SID = process.env.PRZEDMIOT || slug(Object.values(JSON.parse(PLAN).groups).flatMap((g) => [...g.odd, ...g.even]).find((e) => e.k !== "X").pl);
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 500)]);
const LISTA = JSON.stringify([{ id: BM_ID, status: "platny" }, { id: ROK, status: "oczekujacy" }]);
const LS = { "mock-v31": "1", "mock-rocznik": JSON.stringify({ id: BM_ID, wybrany: true }), "mock-roczniki-lista": LISTA, "bm-starosta": "1" };

const lekcja = (id, sid) => ({
  kind: "lesson", v: 2, source: "kierunek", zrodlo: "bm:test", subjectId: sid, title: "Lekcja testowa " + id, order: 1, lang: "pl",
  fileName: "Sylabus testowy", fileType: "sylabus", createdAt: 1, topicCount: 1, conceptCount: 0, flashcardCount: 0, quizCount: 0 });
const tresc = { v: 2, concepts: [], flashcards: [], quiz: [], lesson: { v2: true, intro: "Wstęp testowy", sections: [{ h: "1. Część", body: "Treść testowa części pierwszej." }], exit: [] } };
const paczka = (rocznik, sid, ids = ["t1-a", "t1-b"]) => ({ format: "zdawalni-paczka-lekcji", v: 1, rocznik,
  materials: Object.fromEntries(ids.map((i) => [i, lekcja(i, sid)])), materialContent: Object.fromEntries(ids.map((i) => [i, tresc])), materialSimple: {}, quizWhy: {} });

async function otworz({ lang = "pl", w = 375, edycja = ROK } = {}) {
  const p = await page(b, { konto: "starosta", lang, w, h: 812, ls: { ...LS, ...(edycja ? { "skrot-admin-rocznik": edycja } : {}) } });
  await p.context().route(new RegExp(`^https://plan\\.skrotbm\\.pl/plan/${ROK}\\.json`), (r) => r.fulfill({ contentType: "application/json", body: PLAN }));
  await p.goto(BASE + "index.html#/ai"); await p.waitForTimeout(3000);
  return p;
}
const sekcja = (p, h2) => p.locator("section.panel", { has: p.locator("h2", { hasText: h2 }) });
async function wgraj(p, obj) {
  await sekcja(p, /^(Paczka lekcji|Lesson pack)$/).locator('input[type="file"]').setInputFiles({ name: "paczka.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(obj)) });
  await p.waitForTimeout(500);
}

// 1. rocznik edytowany: sekcja, nazwa rocznika, odrzucenia, zapis z rocznik_id
let p = await otworz();
ok("1 ROK = edytowany rocznik", (await p.evaluate(() => window.SKROT_ROCZNIK.id)) === ROK, await p.evaluate(() => window.SKROT_ROCZNIK.id));
const s = sekcja(p, /^Paczka lekcji$/);
ok("1 sekcja „Paczka lekcji” w Panelu AI", (await s.count()) === 1, await p.locator("main").innerText());
ok("1 pokazuje wczytany rocznik", /Wczytany rocznik:/.test(await s.innerText()) && !/Business/.test(await s.innerText()), await s.innerText());
await wgraj(p, paczka(BM_ID, SID));
ok("1 paczka z innego rocznika: odrzucona", /Paczka jest dla rocznika/.test(await s.innerText()) && !(await s.getByRole("button", { name: /^Wgraj/ }).count()), await s.innerText());
await wgraj(p, paczka(ROK, "nie-ma-takiego"));
ok("1 obcy przedmiot: odrzucona", /nie ma w tym roczniku/.test(await s.innerText()), await s.innerText());
await wgraj(p, { foo: 1 });
ok("1 zły plik: komunikat", /To nie jest paczka lekcji/.test(await s.innerText()), await s.innerText());
await wgraj(p, paczka(ROK, SID));
ok("1 dobra paczka: podsumowanie i przycisk „Wgraj 2 lekcje”", /· 2 lekcje/.test(await s.innerText()) && (await s.getByRole("button", { name: "Wgraj 2 lekcje" }).count()) === 1, await s.innerText());
ok("1 przed kliknięciem nic nie zapisane", (await p.evaluate(() => window.__zapisy.filter((z) => z.kolekcja === "materials").length)) === 0);
await shot(p, "paczka-lekcji-375");
await s.getByRole("button", { name: "Wgraj 2 lekcje" }).click(); await p.waitForTimeout(1200);
const zap = await p.evaluate(() => window.__zapisy.filter((z) => /^t1-/.test(z.id)));
ok("1 zapis: materials + materialContent obu lekcji, rocznik_id = edytowany", zap.length === 4 && zap.every((z) => z.rocznik_id === ROK), zap);
ok("1 komunikat po zapisie", /Wgrano 2 lekcje do rocznika/.test(await s.innerText()), await s.innerText());
ok("1 375 px: bez poziomego przewijania", await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
ok("1 bez błędów konsoli", p.errors.length === 0, p.errors);
await p.context().close();

// 2. EN
p = await otworz({ lang: "en", w: 1280 });
const se = sekcja(p, /^Lesson pack$/);
ok("2 EN: sekcja po angielsku", (await se.count()) === 1 && /Loaded cohort:/.test(await se.innerText()), await p.locator("main").innerText().catch(() => ""));
await wgraj(p, paczka(BM_ID, SID));
ok("2 EN: odrzucenie po angielsku", /The pack is for the cohort/.test(await se.innerText()), await se.innerText());
await wgraj(p, paczka(ROK, SID));
ok("2 EN: przycisk po angielsku", (await se.getByRole("button", { name: "Upload 2 lessons" }).count()) === 1, await se.innerText());
ok("2 EN: bez błędów konsoli", p.errors.length === 0, p.errors);
await p.context().close();

// 3. starosta bez roli admina: sekcji nie ma
p = await page(b, { konto: "platne", w: 375, ls: { "bm-starosta": "1" } });
await p.goto(BASE + "index.html#/ai"); await p.waitForTimeout(2500);
ok("3 bez admina: brak sekcji", (await sekcja(p, /^Paczka lekcji$/).count()) === 0);
await p.context().close();

await b.close();
for (const w of wyniki) console.log(w.join(" "));
const zle = wyniki.filter((w) => w[0] === "✗").length;
console.log(zle ? `✗ ${zle}/${wyniki.length}` : `✓ ${wyniki.length}/${wyniki.length}`);
process.exit(zle ? 1 : 0);
