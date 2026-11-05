// Etap 5 specu „Systemy z Zdawalni w Skrócie”: lista oczekujących i panel kierunków (funkcja zapisz-sie i REST podstawione).
//   A. ekran wejścia → „Inny kierunek”: lista kierunków z bazy (bez działających), rok z planów, zgoda, zapis, limit z sieci,
//   B. wejście z plan.skrotbm.pl (?zapisz=plan): formularz od razu, „Nie ma mojego kierunku” → wpisana nazwa, źródło „plan”,
//   C. linki z maila: potwierdzenie i usunięcie dopiero po kliknięciu (skaner poczty niczego nie zrobi),
//   D. panel administratora: potwierdzone na kierunek i rok, wpisane nazwy, źródła, CSV; nie-admin go nie widzi,
//   E. EN.
// BASE=http://127.0.0.1:8811/ node docs/gry/test/zapisy.mjs
import fs from "fs";
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 700)]);
const KIER = [
  { id: "wefiz-bm-1-st", wydzial: "WEFiZ", nazwa: "Business Management", stopien: 1, tryb: "st", lata: [1, 2, 3], jest: true },
  { id: "wefiz-bm-2-st", wydzial: "WEFiZ", nazwa: "Business Management", stopien: 2, tryb: "st", lata: [1, 2], jest: false },
  { id: "wefiz-ek-1-st", wydzial: "WEFiZ", nazwa: "Ekonomia", stopien: 1, tryb: "st", lata: [1, 2, 3], jest: false },
  { id: "wefiz-ek-2-st", wydzial: "WEFiZ", nazwa: "Ekonomia", stopien: 2, tryb: "st", lata: [1, 2], jest: false },
  { id: "wefiz-mkt-2-st", wydzial: "WEFiZ", nazwa: "Marketing", stopien: 2, tryb: "st", lata: [1, 2], jest: false },
];
const wyslane = [];
let odp = { status: 200, body: { ok: true, message: "Sprawdź skrzynkę: wysłaliśmy link do potwierdzenia zapisu. Jeśli maila nie ma, zajrzyj do spamu." } };
async function trasy(p) {
  await p.context().route(/\/rest\/v1\/rpc\/nauka_kierunki_zapisy/, (r) => r.fulfill({ contentType: "application/json", body: JSON.stringify(KIER) }));
  await p.context().route(/\/functions\/v1\/zapisz-sie/, (r) => {
    if (r.request().method() === "OPTIONS") return r.fulfill({ status: 200, body: "ok" });
    wyslane.push(JSON.parse(r.request().postData() || "{}"));
    r.fulfill({ status: odp.status, contentType: "application/json", body: JSON.stringify(odp.body) });
  });
}
const nowy = (extra = {}) => page(b, { konto: "brak", w: 375, h: 812, ls: { "bm-group": "", ...extra } });

// A
{
  const p = await nowy(); await trasy(p);
  await p.goto(BASE + "index.html"); await p.waitForTimeout(1500);
  await p.locator('.lk-card[data-k="inny"]').click(); await p.waitForTimeout(800);
  const opcje = await p.locator("#lk-kier option").allTextContents();
  ok("A: lista z bazy, bez działającego BM 1. st., z „Nie ma mojego kierunku”", opcje.includes("Ekonomia · I stopień") && opcje.includes("Business Management · II stopień") && opcje.includes("Marketing · II stopień")
    && !opcje.some((o) => o === "Business Management" || o === "Business Management · I stopień") && opcje.at(-1) === "Nie ma mojego kierunku na liście", opcje);
  await p.selectOption("#lk-kier", "wefiz-ek-1-st");
  const lata = await p.locator("#lk-rok option").allTextContents();
  ok("A: rok z planów uczelni (1–3) albo „nie wiem”", lata.join("|") === "nie wiem / jeszcze nie studiuję|1. rok|2. rok|3. rok", lata);
  await p.selectOption("#lk-rok", "2");
  await p.fill("#lk-mail", "Ola@Stud.usz.edu.pl");
  await p.locator('[data-a="zapisz"]').click(); await p.waitForTimeout(300);
  ok("A: bez zgody: komunikat, nic nie wysłane", /Zaznacz zgodę/.test(await p.locator("#lk-err").innerText()) && wyslane.length === 0);
  await shot(p, "zap-375-formularz");
  const zg = await p.locator(".lk-zg").boundingBox();
  ok("A: zgoda ≥ 44 px wysokości (telefon)", zg && zg.height >= 44, zg);
  await p.check("#lk-zg");
  await p.locator('[data-a="zapisz"]').click(); await p.waitForTimeout(800);
  const w = wyslane[0] || {};
  ok("A: wysłane: e-mail małymi, kierunek z listy, stopień, rok, źródło „wejscie”, zgoda", w.akcja === "zapisz" && w.email === "ola@stud.usz.edu.pl" && w.kierunek_id === "wefiz-ek-1-st" && w.kierunek_tekst === null && w.stopien === 1 && w.rok === 2 && w.tryb === "st" && w.zrodlo === "wejscie" && w.zgoda === true && w.www === "", w);
  ok("A: komunikat „Sprawdź skrzynkę”", /Sprawdź skrzynkę/.test(await p.locator(".lk-ok").innerText().catch(() => "")));
  await shot(p, "zap-375-wyslane");
  ok("A: bez błędów w konsoli", !p.errors.length, p.errors);
  await p.context().close();
}
{
  odp = { status: 429, body: { ok: false, code: "limit", message: "Za dużo zapisów z tej sieci. Spróbuj za godzinę." } };
  const p = await nowy(); await trasy(p);
  await p.goto(BASE + "index.html"); await p.waitForTimeout(1500);
  await p.locator('.lk-card[data-k="inny"]').click(); await p.waitForTimeout(800);
  await p.selectOption("#lk-kier", "wefiz-mkt-2-st"); await p.fill("#lk-mail", "x@x.pl"); await p.check("#lk-zg");
  await p.locator('[data-a="zapisz"]').click(); await p.waitForTimeout(800);
  ok("A: limit z jednej sieci: komunikat, formularz zostaje", /Za dużo zapisów z tej sieci/.test(await p.locator("#lk-err").innerText()) && (await p.locator('[data-a="zapisz"]').isEnabled()));
  await p.context().close();
  odp = { status: 200, body: { ok: true, message: "Sprawdź skrzynkę: wysłaliśmy link do potwierdzenia zapisu. Jeśli maila nie ma, zajrzyj do spamu." } };
}
// B
{
  wyslane.length = 0;
  const p = await page(b, { konto: "brak", w: 375, h: 812 }); await trasy(p); // osoba z grupą (znany) też dostaje formularz z linku
  await p.goto(BASE + "index.html?zapisz=plan"); await p.waitForTimeout(1800);
  ok("B: z planu formularz od razu", (await p.locator("#lk-kier").count()) === 1);
  await p.selectOption("#lk-kier", "~");
  ok("B: „Nie ma mojego kierunku” → pole na nazwę", await p.locator("#lk-wl").isVisible());
  await p.fill("#lk-kt", "Psychologia, WNS"); await p.fill("#lk-mail", "a@b.pl"); await p.check("#lk-zg");
  await p.locator('[data-a="zapisz"]').click(); await p.waitForTimeout(800);
  const w = wyslane[0] || {};
  ok("B: wysłane: wpisana nazwa, bez kierunku z listy, źródło „plan”", w.kierunek_tekst === "Psychologia, WNS" && w.kierunek_id === null && w.zrodlo === "plan", w);
  ok("B: bez błędów", !p.errors.length, p.errors);
  await p.context().close();
}
// C
for (const [akcja, przycisk, koniec] of [["potwierdz", "Potwierdzam zapis", "Zapis potwierdzony"], ["usun", "Usuń mój zapis", "Zapis usunięty"]]) {
  wyslane.length = 0;
  odp = { status: 200, body: { ok: true, first: true } };
  const tok = "Tk_" + "a".repeat(30);
  const p = await nowy(); await trasy(p);
  await p.goto(BASE + `index.html#/zapis/${akcja}.${tok}`); await p.waitForTimeout(1500);
  ok(`C ${akcja}: samo wejście w link niczego nie wysyła`, wyslane.length === 0 && (await p.getByRole("button", { name: przycisk }).count()) === 1);
  await p.getByRole("button", { name: przycisk }).click(); await p.waitForTimeout(800);
  ok(`C ${akcja}: po kliknięciu: wysłane z tokenem, „${koniec}”, token znika z adresu`, wyslane[0]?.akcja === akcja && wyslane[0]?.token === tok && (await p.locator("#lkBox, body").first().innerText()).includes(koniec) && !(await p.evaluate(() => location.hash)).includes(tok), { wyslane, hash: await p.evaluate(() => location.hash) });
  if (akcja === "potwierdz") await shot(p, "zap-375-potwierdzony");
  ok(`C ${akcja}: bez błędów`, !p.errors.length, p.errors);
  await p.context().close();
}
// D
{
  const dane = { potwierdzone: 5, czeka: 3, kierunki: [{ id: "wefiz-ek-1-st", nazwa: "Ekonomia", stopien: 1, rok: 1, n: 2 }, { id: "wefiz-ek-1-st", nazwa: "Ekonomia", stopien: 1, rok: null, n: 1 }, { id: "wefiz-mkt-2-st", nazwa: "Marketing", stopien: 2, rok: 1, n: 1 }],
    wpisane: [{ klucz: "psychologia", przyklady: ["Psychologia", "psychologia!"], n: 1 }], zrodla: { wejscie: 3, plan: 2 } };
  const csv = [{ email: "ola@x.pl", wydzial: "WEFiZ", kierunek: "Ekonomia", kierunek_id: "wefiz-ek-1-st", stopien: 1, rok: 1, tryb: "st", zrodlo: "plan", zapis: "2026-11-05T10:00:00Z", potwierdzony: "2026-11-05T10:05:00Z" }];
  for (const [w, h] of [[375, 812], [1280, 900]]) {
    const p = await page(b, { konto: "starosta", w, h, ls: { "mock-oczekujacy": JSON.stringify(dane), "mock-oczekujacy-csv": JSON.stringify(csv), "bm-starosta": "1" } });
    await p.goto(BASE + "index.html#/starosta"); await p.waitForTimeout(2500);
    const row = p.locator("button.more-row", { hasText: "Kierunki" });
    ok(`${w} D: wiersz „Kierunki” w Narzędziach starosty`, (await row.count()) === 1);
    await row.click(); await p.waitForTimeout(1200);
    const t = await p.locator("main").innerText();
    ok(`${w} D: potwierdzone 5, czeka 3 (nie liczą się), Ekonomia I st. 3 (rok 1: 2, bez roku: 1), wpisane, źródła`, /5\s+potwierdzonych/.test(t) && /3\s+czeka/.test(t) && /Ekonomia · I st\.\s+3/.test(t) && /1\. rok: 2 · rok nie podany: 1/.test(t) && /Psychologia \/ psychologia!/.test(t) && /wejscie: 3/.test(t), t.slice(0, 900));
    await shot(p, `zap-${w}-panel`);
    const [dl] = await Promise.all([p.waitForEvent("download", { timeout: 5000 }).catch(() => null), p.getByRole("button", { name: "Pobierz CSV" }).click()]);
    const body = dl ? fs.readFileSync(await dl.path(), "utf8") : "";
    ok(`${w} D: CSV z e-mailem, średnik`, body.startsWith("﻿email;") && body.includes("ola@x.pl;WEFiZ;Ekonomia;wefiz-ek-1-st;1;1;st;plan"), body.slice(0, 200));
    ok(`${w} D: bez błędów`, !p.errors.length, p.errors);
    await p.context().close();
  }
  const p = await page(b, { konto: "platne" });
  await p.goto(BASE + "index.html#/kierunkiAdmin"); await p.waitForTimeout(2000);
  ok("D: student nie widzi panelu", /tylko dla administratora/.test(await p.locator("main").innerText()));
  await p.context().close();
}
// E
{
  const p = await page(b, { konto: "brak", w: 375, h: 812, lang: "en", ls: { "bm-group": "" } }); await trasy(p);
  await p.goto(BASE + "index.html?zapisz=plan"); await p.waitForTimeout(1800);
  const t = await p.locator(".lk-lista").innerText().catch(() => "");
  ok("E: EN formularz", /Tell me when it launches/.test(t) && /Programme/.test(t) && /I want one email/.test(t) && !/[ąęłśżźćń]/.test(t.replace(/Skrót/g, "")), t);
  await shot(p, "zap-375-en");
  ok("E: bez błędów", !p.errors.length, p.errors);
  await p.context().close();
}
await b.close();
for (const w of wyniki) console.log(w.join(" "));
console.log(`${wyniki.filter((w) => w[0] === "✓").length}/${wyniki.length}`);
