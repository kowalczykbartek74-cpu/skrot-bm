// Rocznik bez własnej migracji (SQL v49): roczniki-dane.js → Panel kierunków → „Dodaj do bazy” i status w bazie.
// BASE=http://127.0.0.1:<port>/ node docs/gry/test/roczniki-baza.mjs
import { chromium, page, BASE, shot } from "./lib.mjs";
const BM = "wefiz-bm-1-st-2026", ZARZ = "wefiz-zarz-1-st-2026", FIR = "wefiz-fir-1-st-2026";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 600)]);
const LS = (lista) => ({ "mock-v31": "1", "mock-rocznik": JSON.stringify({ id: BM, wybrany: true }), "mock-roczniki-lista": JSON.stringify(lista), "bm-starosta": "1" });
async function otworz({ konto = "starosta", lang = "pl", w = 375, lista, hash = "#/kierunkiPanel" } = {}) {
  const p = await page(b, { konto, lang, w, h: w > 800 ? 900 : 812, ls: LS(lista) });
  await p.context().route(/^https:\/\/plan\.skrotbm\.pl\/plan\//, (r) => r.fulfill({ status: 404, body: "" }));
  await p.goto(BASE + "index.html" + hash); await p.waitForTimeout(2800);
  return p;
}
const ev = (p, fn, a) => p.evaluate(fn, a);
const main = (p) => p.locator("main").innerText();
const sekcja = (p) => p.locator("section.panel", { has: p.locator("h2", { hasText: /^(Baza|Database)$/ }) });
const poziomo = (p) => ev(p, () => document.documentElement.scrollWidth <= innerWidth + 1);

// 1. FiR jest w danych strony, a nie ma go w bazie → jeden przycisk
let p = await otworz({ lista: [{ id: BM, status: "platny" }, { id: ZARZ, status: "oczekujacy" }] });
let t = await sekcja(p).innerText().catch(() => "");
ok("1 sekcja Baza: FiR do dodania (status z danych: lista oczekujących), bez Zarządzania i BM",
  /Finanse i Rachunkowość/.test(t) && /lista oczekujących/.test(t) && !/Zarządzanie/.test(t) && !/Business Management/.test(t)
  && (await sekcja(p).locator("button", { hasText: "Dodaj do bazy" }).count()) === 1 && !/Dodaj wszystkie/.test(t), t);
await shot(p, "roczniki-baza-pl-375");
await sekcja(p).locator("button", { hasText: "Dodaj do bazy" }).click(); await p.waitForTimeout(1500);
const v49 = await ev(p, () => window.__v49 || []);
ok("1 wysłane dane = rocznik z roczniki-dane.js", v49.length === 1 && v49[0].fn === "zapisz" && JSON.stringify(v49[0].a.p) === JSON.stringify({
  id: FIR, kierunek_id: "wefiz-fir-1-st", nabor: 2026, status: "oczekujacy",
  kierunek: { kod: "FIR", pl: "Finanse i Rachunkowość", en: "Finance and Accounting", stopien: 1, tryb: "st", jezyk: "pl" }, wydzial: { kod: "WEFiZ" } }), v49);
t = await sekcja(p).innerText().catch(() => "");
ok("1 po dodaniu: wszystko w bazie, lista z bazy odświeżona", /Wszystkie roczniki ze strony są w bazie/.test(t)
  && JSON.parse(await ev(p, () => localStorage.getItem("mock-roczniki-lista"))).some((r) => r.id === FIR && r.status === "oczekujacy"), t);
ok("1 bez błędów konsoli i poziomego przewijania", !p.errors.length && (await poziomo(p)), p.errors);
await p.context().close();

// 2. Dwa roczniki do dodania → „Dodaj wszystkie (2)”
p = await otworz({ lista: [{ id: BM, status: "platny" }] });
t = await sekcja(p).innerText().catch(() => "");
ok("2 dwa do dodania i przycisk „Dodaj wszystkie (2)”", (await sekcja(p).locator("button", { hasText: "Dodaj do bazy" }).count()) === 2 && /Dodaj wszystkie \(2\)/.test(t), t);
await sekcja(p).locator("button", { hasText: "Dodaj wszystkie" }).click(); await p.waitForTimeout(2000);
ok("2 oba wysłane po kolei, oba w bazie", (await ev(p, () => (window.__v49 || []).map((x) => x.a.p.id).join())) === [ZARZ, FIR].join()
  && /Wszystkie roczniki ze strony są w bazie/.test(await sekcja(p).innerText()), await ev(p, () => window.__v49));
await p.context().close();

// 3. Status w bazie: start sprzedaży tylko po potwierdzeniu; BM bez przycisków statusu
p = await otworz({ lista: [{ id: BM, status: "platny" }, { id: ZARZ, status: "oczekujacy" }, { id: FIR, status: "oczekujacy" }] });
t = await sekcja(p).innerText();
ok("3 BM: brak przycisków statusu", !/Status w bazie/.test(t) && !/Zacznij sprzedaż/.test(t), t);
await p.locator(".pk-rok", { hasText: "Zarządzanie" }).click(); await p.waitForTimeout(800);
t = await sekcja(p).innerText();
ok("3 Zarządzanie: status lista oczekujących, przyciski „Zacznij sprzedaż” i „w planach”", /Status w bazie:\s*lista oczekujących/.test(t) && /Zacznij sprzedaż/.test(t) && /Ustaw: w planach/.test(t), t);
await sekcja(p).locator("button", { hasText: "Zacznij sprzedaż" }).click(); await p.waitForTimeout(300);
ok("3 pierwsze kliknięcie tylko pyta (nic nie wysłane)", !(await ev(p, () => (window.__v49 || []).length)) && /Na pewno\?/.test(await sekcja(p).innerText()));
await shot(p, "roczniki-baza-potwierdzenie-pl-375");
await sekcja(p).locator("button", { hasText: "Tak, zacznij sprzedaż" }).click(); await p.waitForTimeout(1500);
t = await sekcja(p).innerText();
ok("3 po potwierdzeniu: platny w bazie, na ekranie „płatny”", JSON.parse(await ev(p, () => localStorage.getItem("mock-roczniki-lista"))).find((r) => r.id === ZARZ).status === "platny"
  && /Status w bazie:\s*płatny/.test(t), t);
await sekcja(p).locator("button", { hasText: "Ustaw: lista oczekujących" }).click(); await p.waitForTimeout(1500);
ok("3 cofnięcie bez pytania", JSON.parse(await ev(p, () => localStorage.getItem("mock-roczniki-lista"))).find((r) => r.id === ZARZ).status === "oczekujacy");
ok("3 bez błędów konsoli", !p.errors.length, p.errors);
await p.context().close();

// 4. EN i szerokie ekrany, cele dotyku
for (const [lang, w] of [["en", 375], ["pl", 1280], ["en", 1280]]) {
  p = await otworz({ lang, w, lista: [{ id: BM, status: "platny" }, { id: ZARZ, status: "oczekujacy" }] });
  t = await sekcja(p).innerText().catch(() => "");
  const male = await sekcja(p).locator("button").evaluateAll((l) => l.filter((x) => x.getBoundingClientRect().height < 44).length);
  ok(`4 ${lang} ${w}px: sekcja widoczna${lang === "en" ? " po angielsku" : ""}, przyciski ≥ 44 px, bez przewijania i błędów`,
    (lang === "en" ? /Database/.test(t) && /Add to database/.test(t) && !/Dodaj do bazy/.test(t) : /Dodaj do bazy/.test(t)) && !male && (await poziomo(p)) && !p.errors.length, [t, male, p.errors]);
  if (lang === "en" && w === 375) await shot(p, "roczniki-baza-en-375");
  await p.context().close();
}

// 5. Bez v49 w bazie (mock-v31 = "0" → brak funkcji): czytelny komunikat zamiast cichego błędu
p = await page(b, { konto: "starosta", w: 375, ls: { ...LS([{ id: BM, status: "platny" }]), "mock-v31": "0" } });
await p.context().route(/^https:\/\/plan\.skrotbm\.pl\/plan\//, (r) => r.fulfill({ status: 404, body: "" }));
await p.goto(BASE + "index.html#/kierunkiPanel"); await p.waitForTimeout(2800);
const s5 = await main(p);
ok("5 bez listy z bazy (stara baza): sekcja Baza się nie pokazuje, panel działa", !/Dodaj do bazy/.test(s5) && /Kierunki/.test(s5) && !p.errors.length, [s5.slice(0, 300), p.errors]);
await p.context().close();

await b.close();
for (const w of wyniki) console.log(w.join(" "));
const zle = wyniki.filter((w) => w[0] === "✗").length;
console.log(zle ? `✗ ${zle} z ${wyniki.length}` : `✓ ${wyniki.length}/${wyniki.length}`);
process.exit(zle ? 1 : 0);
