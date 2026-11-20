// Mapa teorii (teoria.js, docs/teoria/petla.md): wejścia, układ, brak ruchu, gość, druk, EN, Paczka teorii.
// Uruchom: python3 -m http.server 8836 --bind 127.0.0.1 & BASE=http://127.0.0.1:8836/ node docs/gry/test/teoria.mjs
import fs from "fs";
import { chromium, BASE, OUT, page } from "./lib.mjs";
const UID = "00000000-0000-4000-8000-000000000001", MK = "makroekonomia";
const DIR = new URL("./", import.meta.url).pathname;
const wzor = JSON.parse(fs.readFileSync(DIR + "../../teoria/przyklad-inflation.json", "utf8"));
const sec = (t, i) => ({ h: `${i + 1}. ${t} ${i + 1}`, body: `Akapit ${i + 1} o **pojęciu ${i + 1}**.`, check: { q: `Check ${i + 1}?`, options: ["Dobrze", "Źle"], correct: 0 } });
const content = (t) => ({ v: 2, lesson: { sections: [0, 1, 2].map((i) => sec(t, i)), exit: [{ q: "Bilet?", options: ["Tak", "Nie"], correct: 0 }] },
  quiz: Array.from({ length: 6 }, (_, i) => ({ q: `Quiz ${t} ${i + 1}?`, options: ["Dobra", "Zła", "Zła 2"], correct: 0 })), flashcards: [], concepts: [], notes: [], tldr: "" });
const mat = (order, title, extra = {}) => ({ subjectId: MK, kind: "lesson", order, unit: 1, unitTitle: "Dział", title, minutes: 30, quizCount: 6, flashcardCount: 0, createdAt: Date.now(), v: 2, sylRef: "W2", ...extra });
const docs = {
  materials: { T1: mat(1, "Inflation", { teoria: 1 }), T2: mat(2, "Unemployment") },
  materialContent: { T1: content("inflation"), T2: content("unemployment") },
  materialSimple: { "T1~teoria": { ...wzor, mid: "T1" } },
  meta: { po: { items: {} }, stas: { items: {} } },
};
const ls0 = { "mock-docs": JSON.stringify(docs), "mock-progress": JSON.stringify({ [UID]: {} }) };
let pass = 0, fail = 0;
const ok = (name, cond, info) => { if (cond) { pass++; console.log("✓", name); } else { fail++; console.log("✗", name, JSON.stringify(info ?? "").slice(0, 400)); } };
async function open(b, o = {}) {
  const p = await page(b, { konto: o.konto || "platne", w: o.w || 390, h: o.h || 844, lang: o.lang || "pl", ls: { ...ls0, ...(o.ls || {}) }, ctx: o.dark ? { colorScheme: "dark" } : {} });
  await p.goto(BASE + "index.html#" + (o.hash || "/")); await p.waitForTimeout(o.wait ?? 2500);
  return p;
}
const b = await chromium.launch(process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {});
const noScroll = (p) => p.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

// 1. temat z mapą: przycisk „Najpierw teoria”, mapa otwiera się, kolejność czytania, drzewo, brak ruchu
{
  const p = await open(b, { hash: "/material/T1" });
  const btn = p.getByRole("button", { name: "Najpierw teoria" });
  ok("temat z mapą ma przycisk „Najpierw teoria”", await btn.count() === 1);
  await btn.click(); await p.waitForTimeout(800);
  ok("adres #/teoria/T1", p.url().endsWith("#/teoria/T1"), p.url());
  ok("tytuł i jedno zdanie środka", (await p.locator(".tm-core h1").textContent()) === "Inflation" && (await p.locator(".tm-one").textContent()).startsWith("Inflation is a sustained"));
  ok("5 gałęzi i kolejność czytania", await p.locator(".tm-branch").count() === 5 && await p.locator(".tm-route .tm-jump").count() === 5);
  ok("drzewo węzłów z etykietami", await p.locator(".tm-node").count() > 20 && await p.locator(".tm-tag.err").count() >= 3);
  ok("Jak to się łączy, Na egzaminie, Słowa EN–PL", await p.locator("#tm-polaczenia li").count() === 3 && await p.locator("#tm-egzamin li").count() === 4 && await p.locator("#tm-slowa tbody tr").count() === 10);
  const anims = await p.evaluate(() => document.querySelector(".tm").getAnimations({ subtree: true }).length);
  const trans = await p.evaluate(() => [...document.querySelectorAll(".tm, .tm *")].filter((e) => { const s = getComputedStyle(e); return s.transitionDuration.split(",").some((x) => parseFloat(x) > 0) || s.animationName !== "none"; }).length);
  ok("zero animacji i przejść w widoku", anims === 0 && trans === 0, { anims, trans });
  const y0 = await p.evaluate(() => scrollY);
  await p.locator(".tm-route .tm-jump").nth(3).click(); await p.waitForTimeout(50);
  const y1 = await p.evaluate(() => scrollY), focus = await p.evaluate(() => document.activeElement?.id);
  ok("skok do gałęzi 4 bez zmiany adresu, fokus na nagłówku", y1 > y0 && focus === "tm-h-b4" && p.url().endsWith("#/teoria/T1"), { y0, y1, focus });
  ok("bez poziomego przewijania (390)", await noScroll(p));
  const small = await p.evaluate(() => [...document.querySelectorAll(".tm button:not(.back), .tm summary")].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.height < 44; }).map((e) => e.textContent.slice(0, 30)));
  ok("cele dotyku ≥ 44 px", !small.length, small);
  await p.screenshot({ path: `${OUT}/teoria-390.png` });
  // koniec mapy → „przeczytane” bez XP i monet
  const xp0 = await p.evaluate(() => localStorage.getItem("bm-xp"));
  await p.locator(".tm-end").scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  ok("koniec mapy oznacza „przeczytane”", await p.evaluate(() => !!JSON.parse(localStorage.getItem("skrot-teoria-czytane") || "{}").T1));
  ok("czytanie nie daje XP", (await p.evaluate(() => localStorage.getItem("bm-xp"))) === xp0);
  await p.getByRole("button", { name: "Zacznij lekcję" }).click(); await p.waitForTimeout(800);
  ok("„Zacznij lekcję” otwiera temat", /#\/material\/T1/.test(p.url()), p.url());
  ok("przeczytana mapa: przycisk „Mapa teorii”", await p.getByRole("button", { name: "Mapa teorii" }).count() === 1);
  ok("konsola bez błędów", !p.errors.length, p.errors);
  await p.context().close();
}
// 2. temat bez mapy: bez przycisku; wejście w adres → pusty stan z „Zacznij lekcję”
{
  const p = await open(b, { hash: "/material/T2" });
  ok("temat bez mapy nie ma przycisku", await p.getByRole("button", { name: "Najpierw teoria" }).count() === 0);
  await p.goto(BASE + "index.html#/teoria/T2"); await p.waitForTimeout(2000);
  ok("pusty stan „jeszcze powstaje”", (await p.textContent("main")).includes("Mapa teorii do tego tematu jeszcze powstaje"));
  ok("konsola bez błędów (pusty stan)", !p.errors.length, p.errors);
  await p.context().close();
}
// 3. przełącznik „Najpierw teoria”: temat otwiera mapę, „wstecz” nie wpada w pętlę
{
  const p = await open(b, { hash: "/ustawienia/wyglad" });
  const sw = p.getByRole("switch", { name: /Najpierw teoria/ });
  ok("przełącznik w Ustawieniach", await sw.count() === 1);
  await sw.click(); await p.waitForTimeout(200);
  ok("przełącznik włączony", (await sw.getAttribute("aria-checked")) === "true");
  await p.goto(BASE + "index.html#/subject/" + MK); await p.waitForTimeout(1500);
  await p.evaluate(() => window.ZD_APP.go({ view: "material", id: "T1" })); await p.waitForTimeout(800);
  ok("temat z nieprzeczytaną mapą otwiera mapę", p.url().endsWith("#/teoria/T1") && await p.locator(".tm-core").count() === 1, p.url());
  await p.goBack(); await p.waitForTimeout(800);
  ok("„wstecz” wraca do przedmiotu, nie w pętlę", /#\/subject\//.test(p.url()), p.url());
  const wiersz = p.locator("button.tm-subj");
  ok("przedmiot ma „Mapy teorii”", await wiersz.count() === 1);
  await wiersz.click(); await p.waitForTimeout(600);
  ok("lista map przedmiotu: 1 z N", /Mapę ma 1 z \d/.test(await p.locator("body").innerText()), [p.url(), (await p.locator("body").innerText()).slice(0, 300)]);
  await p.context().close();
}
// 4. gość: środek + gałąź 1 + zakup
{
  const p = await open(b, { konto: "darmowe", hash: "/teoria/T1" });
  ok("bez dostępu: tylko gałąź 1", await p.locator(".tm-branch").count() === 1, await p.locator(".tm-branch").count());
  ok("bez dostępu: karta zakupu, bez „Jak to się łączy”", await p.locator(".tm .paywall, .tm [class*=paywall]").count() >= 1 && await p.locator("#tm-polaczenia").count() === 0);
  await p.context().close();
}
// 5. druk, 360, 1280, ciemny, EN
{
  const p = await open(b, { hash: "/teoria/T1", w: 360, h: 640 });
  ok("bez poziomego przewijania (360)", await noScroll(p));
  ok("360: spis zwijany widoczny, boczna mini-mapa schowana", await p.locator(".tm-toc-m").isVisible() && !(await p.locator(".tm-side").isVisible()));
  await p.emulateMedia({ media: "print" });
  const pr = await p.evaluate(() => ({ btn: [...document.querySelectorAll(".tm-noprint")].filter((e) => getComputedStyle(e).display !== "none").length, br: [...document.querySelectorAll(".tm-branch")].filter((e) => getComputedStyle(e).visibility === "visible").length }));
  ok("druk: bez przycisków, wszystkie gałęzie", pr.btn === 0 && pr.br === 5, pr);
  await p.context().close();
  const d = await open(b, { hash: "/teoria/T1", w: 1280, h: 900, dark: true, ls: { "skrot-green": "dark" } });
  ok("1280: boczna mini-mapa widoczna, spis z telefonu schowany", await d.locator(".tm-side").isVisible() && !(await d.locator(".tm-toc-m").isVisible()));
  ok("bez poziomego przewijania (1280)", await noScroll(d));
  await d.screenshot({ path: `${OUT}/teoria-1280-ciemny.png` });
  await d.context().close();
  const e = await open(b, { hash: "/teoria/T1", lang: "en" });
  const t = await e.textContent("main");
  ok("EN: napisy interfejsu po angielsku", t.includes("How it connects") && t.includes("Common mistake") && !t.includes("Typowy błąd") && !t.includes("Jak to się łączy"));
  await e.screenshot({ path: `${OUT}/teoria-390-en.png` });
  ok("EN: konsola bez błędów", !e.errors.length, e.errors);
  await e.context().close();
}
// 6. Panel AI → Paczka teorii (starosta): dobra i zła mapa
{
  const BM = "wefiz-bm-1-st-2026";
  const p = await open(b, { konto: "starosta", hash: "/ai", wait: 3000, ls: { "mock-v31": "1", "mock-rocznik": JSON.stringify({ id: BM, wybrany: true }), "mock-roczniki-lista": JSON.stringify([{ id: BM, status: "platny" }]), "bm-starosta": "1", "skrot-admin-rocznik": BM } });
  const sec = p.locator("section.panel", { has: p.locator("h2", { hasText: "Paczka teorii" }) });
  ok("Panel AI ma „Paczka teorii”", await sec.count() === 1);
  const zla = { ...wzor, mid: "T2", branches: wzor.branches.slice(0, 1) };
  const plik = { format: "zdawalni-paczka-teorii", v: 1, teoria: { T2: { ...wzor, mid: "T2" }, T1: zla, X9: wzor } };
  await sec.locator('input[type=file]').setInputFiles({ name: "teoria.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(plik)) });
  await p.waitForTimeout(500);
  ok("zła mapa i nieznany temat pominięte", (await sec.textContent()).includes("Pominięte mapy: 2"));
  await sec.getByRole("button", { name: /^Wgraj 1/ }).click(); await p.waitForTimeout(1200);
  ok("wgrano 1 mapę", (await sec.textContent()).includes("Wgrano 1"));
  const z = await p.evaluate(() => (window.__zapisy || []).map((x) => x.kolekcja + "/" + x.id));
  ok("zapis materialSimple/T2~teoria", z.some((x) => x === "materialSimple/T2~teoria"), z);
  ok("konsola bez błędów (Panel AI)", !p.errors.length, p.errors);
  await p.context().close();
}
await b.close();
console.log(`${pass}/${pass + fail}`);
process.exit(fail ? 1 : 0);
