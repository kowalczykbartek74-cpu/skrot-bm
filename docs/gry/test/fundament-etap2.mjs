// Fundament, Etap 2: rocznik przy treściach (skrot-supabase.js → makeDb, SQL v44). Atrapa: treści w bazie = BM.
// BASE=http://127.0.0.1:<port>/ node docs/gry/test/fundament-etap2.mjs
import { chromium, page, BASE, shot } from "./lib.mjs";
import { dodajRocznikTestowy, TEST_ID, BM_ID } from "./rocznik-testowy.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 500)]);
const DL = JSON.stringify({ deadlines: { dlbm: { title: "Kolokwium BM z bazy", type: "kolokwium", subjectId: "makroekonomia", date: "2026-12-10", createdAt: 1 } } });
async function otworz({ konto = "platne", rocznik = null, lang = "pl", w = 375, h = 812, ls = {} } = {}) {
  const p = await page(b, { konto, lang, w, h, ls: { "mock-docs": DL, ...(rocznik ? { "skrot-rocznik": rocznik } : {}), ...ls } });
  await dodajRocznikTestowy(p.context(), BASE);
  await p.goto(BASE + "index.html#/terms"); await p.waitForTimeout(2500);
  return p;
}
const db = (p, fn) => p.evaluate(fn);

// --- A. student BM: widzi materiały i termin z bazy (filtr rocznika BM)
let p = await otworz();
ok("A ROK = BM", (await db(p, () => window.SKROT_ROCZNIK.id)) === BM_ID);
ok("A Terminy BM: termin z bazy widoczny", /Kolokwium BM z bazy/.test(await p.locator("main").innerText()));
ok("A baza: 3 materiały BM", (await db(p, async () => (await (await window.claude.use("db")).collection("materials").get()).size)) === 3);
ok("A bez błędów konsoli", !p.errors.length, p.errors);
await p.context().close();

// --- B. student rocznika testowego: pusto (ani materiałów, ani terminów BM)
for (const [lang, w] of [["pl", 375], ["en", 375], ["pl", 1280], ["en", 1280]]) {
  p = await otworz({ rocznik: TEST_ID, lang, w, h: w > 800 ? 900 : 812 });
  if (lang === "pl" && w === 375) {
    ok("B ROK = rocznik testowy", (await db(p, () => window.SKROT_ROCZNIK.id)) === TEST_ID);
    ok("B Terminy: brak terminu BM z bazy", !/Kolokwium BM z bazy/.test(await p.locator("main").innerText()));
    ok("B baza: 0 materiałów, 0 terminów, 0 ogłoszeń", await db(p, async () => {
      const d = await window.claude.use("db");
      return (await d.collection("materials").get()).size === 0 && (await d.collection("deadlines").get()).size === 0 && (await d.collection("announcements").get()).size === 0;
    }));
    await p.goto(BASE + "index.html#/materials"); await p.waitForTimeout(1500);
    ok("B Przedmioty: żadnego materiału BM", !/PKB i inflacja|Polityka pieniężna|Źródła prawa/.test(await p.locator("main").innerText()));
    ok("B bez poziomego przewijania", await db(p, () => document.documentElement.scrollWidth <= innerWidth + 1));
    await p.goto(BASE + "index.html#/terms"); await p.waitForTimeout(1200);
  }
  ok(`B ${lang} ${w}px bez błędów konsoli`, !p.errors.length, p.errors);
  await shot(p, `fundament-etap2-terminy-${lang}-${w}`);
  await p.context().close();
}

// --- C. admin w roczniku testowym: zapisy z rocznikiem i sufiksem stałych id, odczyt bez sufiksu
p = await otworz({ konto: "starosta", rocznik: TEST_ID });
const r = await db(p, async () => {
  const d = await window.claude.use("db");
  await d.doc("meta/po").set({ items: { a: { sid: "makro" } } });
  await d.doc("examBank/makro").set({ items: [] });
  await d.doc("meta/en").set({ t: {} });
  const ref = await d.collection("deadlines").add({ title: "Termin testowy", date: "2026-12-01" });
  const po = await d.doc("meta/po").get();
  return { zapisy: window.__zapisy.slice(-4), po: [po.id, po.exists, !!po.data().items.a], dl: ref.id };
});
const z = Object.fromEntries(r.zapisy.map((x) => [x.kolekcja + "/" + x.id, x.rocznik_id]));
ok("C meta/po → po@rocznik, rocznik testowy", z["meta/po@" + TEST_ID] === TEST_ID, r.zapisy);
ok("C examBank/makro → makro@rocznik", z["examBank/makro@" + TEST_ID] === TEST_ID, r.zapisy);
ok("C meta/en wspólne: bez sufiksu i bez rocznika", "meta/en" in z && z["meta/en"] === null, r.zapisy);
ok("C termin: losowe id bez sufiksu, rocznik testowy", z["deadlines/" + r.dl] === TEST_ID, r.zapisy);
ok("C odczyt meta/po: id strony bez sufiksu", r.po[0] === "po" && r.po[1] && r.po[2], r.po);
await p.context().close();

// --- D. admin BM: zapisy z rocznikiem BM i bez sufiksu
p = await otworz({ konto: "starosta" });
const zb = await db(p, async () => { const d = await window.claude.use("db"); await d.doc("meta/po").set({ items: {} }); return window.__zapisy.slice(-1)[0]; });
ok("D BM: meta/po bez sufiksu, rocznik BM", zb.id === "po" && zb.rocznik_id === BM_ID, zb);
await p.context().close();

// --- E. baza bez v44: strona działa jak dotąd (bez filtra i bez kolumny przy zapisie)
p = await otworz({ konto: "starosta", ls: { "mock-v44": "0" } });
const e = await db(p, async () => {
  const d = await window.claude.use("db");
  const n = (await d.collection("materials").get()).size;
  await d.doc("meta/po").set({ items: {} });
  return { n, z: window.__zapisy.slice(-1)[0], k: window.skrot.rocznikTresci() };
});
ok("E bez v44: materiały widoczne", e.n === 3, e);
ok("E bez v44: zapis bez rocznik_id, filtr wyłączony", e.z && e.z.rocznik_id === undefined && e.k.kolumna === false, e);
ok("E bez v44: Terminy z terminem z bazy, bez błędów", /Kolokwium BM z bazy/.test(await p.locator("main").innerText()) && !p.errors.length, p.errors);
await p.context().close();

await b.close();
for (const w of wyniki) console.log(w.join(" "));
const zle = wyniki.filter((w) => w[0] === "✗").length;
console.log(zle ? `✗ ${zle} z ${wyniki.length}` : `✓ ${wyniki.length}/${wyniki.length}`);
process.exit(zle ? 1 : 0);
