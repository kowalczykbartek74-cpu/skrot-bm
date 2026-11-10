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
  materials: Object.fromEntries(ids.map((i) => [i, lekcja(i, sid)])), materialContent: Object.fromEntries(ids.map((i) => [i, tresc])),
  materialSimple: { [ids[0]]: { parts: [{ h: "Prościej", text: "Tekst testowy." }] }, [ids[0] + "~ez"]: { items: {} }, "obca-lekcja": { parts: [] } },
  quizWhy: { [ids[0]]: { items: {} } } });

async function otworz({ lang = "pl", w = 375, edycja = ROK, ls = {} } = {}) {
  const p = await page(b, { konto: "starosta", lang, w, h: 812, ls: { ...LS, ...(edycja ? { "skrot-admin-rocznik": edycja } : {}), ...ls } });
  await p.context().route(new RegExp(`^https://plan\\.(skrotbm|zdawalni)\\.pl/plan/${ROK}\\.json`), (r) => r.fulfill({ contentType: "application/json", body: PLAN }));
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
ok("1 zapis: materials + materialContent obu lekcji + Prościej (z ~ez) + Dlaczego?, rocznik_id = edytowany",
  zap.length === 7 && zap.every((z) => z.rocznik_id === ROK) && zap.some((z) => z.kolekcja === "materialSimple" && z.id === "t1-a~ez") && zap.some((z) => z.kolekcja === "quizWhy"), zap);
ok("1 wpis spoza paczki (obca lekcja) nie zapisany", !(await p.evaluate(() => window.__zapisy.some((z) => z.id === "obca-lekcja"))));
ok("1 komunikat po zapisie", /Wgrano 2 lekcje do rocznika/.test(await s.innerText()), await s.innerText());
ok("1 375 px: bez poziomego przewijania", await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
ok("1 bez błędów konsoli", p.errors.length === 0, p.errors);
await p.context().close();

// 1b. kilka plików naraz (optymalizacja nr 8): jedna paczka na przedmiot → jeden zapis; dubel lekcji = wygrywa późniejszy plik
p = await otworz();
const s2 = sekcja(p, /^Paczka lekcji$/);
const plik = (name, obj) => ({ name, mimeType: "application/json", buffer: Buffer.from(JSON.stringify(obj)) });
const pB = paczka(ROK, SID, ["t2-c", "t1-b"]);
pB.materials["t1-b"].title = "Lekcja z drugiego pliku";
await s2.locator('input[type="file"]').setInputFiles([plik("a.json", paczka(ROK, SID)), plik("b.json", pB)]); await p.waitForTimeout(600);
ok("1b dwa pliki: 3 różne lekcje, informacja o dublu", /Plików: 2/.test(await s2.innerText()) && /ta sama lekcja w kilku plikach: 1/.test(await s2.innerText())
  && (await s2.getByRole("button", { name: "Wgraj 3 lekcje" }).count()) === 1, await s2.innerText());
await s2.getByRole("button", { name: "Wgraj 3 lekcje" }).click(); await p.waitForTimeout(1200);
const zap2 = await p.evaluate(() => window.__zapisy.filter((z) => z.kolekcja === "materials" && /^t[12]-/.test(z.id)));
ok("1b zapis: 3 lekcje, dubel z drugiego pliku, wszystko w edytowanym roczniku",
  zap2.length === 3 && zap2.every((z) => z.rocznik_id === ROK) && zap2.find((z) => z.id === "t1-b")?.tytul === "Lekcja z drugiego pliku", zap2.map((z) => [z.id, z.tytul]));
await s2.locator('input[type="file"]').setInputFiles([plik("dobry.json", paczka(ROK, SID)), plik("obcy.json", paczka(BM_ID, SID))]); await p.waitForTimeout(600);
ok("1b jeden zły plik zatrzymuje całość, z nazwą pliku", /obcy\.json: Paczka jest dla rocznika/.test(await s2.innerText()) && !(await s2.getByRole("button", { name: /^Wgraj/ }).count()), await s2.innerText());
ok("1b bez błędów konsoli", p.errors.length === 0, p.errors);
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

// 2b. rocznika nie ma jeszcze w tabeli nauka_roczniki (przed „Dodaj do bazy”): baza odrzuca zapis kluczem obcym.
// Strona nie może wtedy zapisać tego samego bez rocznik_id (trafiłoby do rocznika administratora = BM, jak 9.11.2026 z EaIA).
for (const lang of ["pl", "en"]) {
  p = await otworz({ lang, ls: { "mock-brak-rocznika": ROK } });
  const sb = sekcja(p, /^(Paczka lekcji|Lesson pack)$/);
  await wgraj(p, paczka(ROK, SID));
  await sb.getByRole("button", { name: /^(Wgraj 2 lekcje|Upload 2 lessons)$/ }).click(); await p.waitForTimeout(1200);
  const txt = await sb.innerText();
  ok(`2b ${lang}: komunikat „rocznika nie ma w bazie”`, lang === "pl" ? /Nie udało się zapisać w bazie: Tego rocznika nie ma jeszcze w bazie\..*Dodaj do bazy/.test(txt)
    : /Couldn't save to the database: This cohort isn't in the database yet\..*Add to database/.test(txt), txt);
  ok(`2b ${lang}: nic nie zapisane (ani z rocznikiem, ani bez)`, (await p.evaluate(() => window.__zapisy.filter((z) => /^t1-/.test(z.id)).length)) === 0, await p.evaluate(() => window.__zapisy));
  // kolejny zapis na tej samej stronie dalej idzie z rocznik_id (jeden błąd nie wyłącza kolumny rocznika do końca sesji)
  const drugi = await p.evaluate(async (sid) => { try { await window.skrot.putMany([{ collection: "materials", id: "t9-x", data: { subjectId: sid, title: "x" } }]); return "zapisano"; } catch (e) { return e.code || String(e.message); } }, SID);
  ok(`2b ${lang}: drugi zapis też zatrzymany, bez obejścia`, drugi === "brak_rocznika" && !(await p.evaluate(() => window.__zapisy.some((z) => z.id === "t9-x"))), drugi);
  ok(`2b ${lang}: paczka zostaje do ponownego wgrania`, (await sb.getByRole("button", { name: /^(Wgraj 2 lekcje|Upload 2 lessons)$/ }).count()) === 1, txt);
  await p.context().close();
}

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
