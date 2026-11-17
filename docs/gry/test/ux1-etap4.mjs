// Pętla UX-1, etap 4: paywall, odzyskiwanie i zaufanie (kryteria K1–K6 z ~/zdawalni/ux/petla-1.md).
// BASE=http://127.0.0.1:8811/ node docs/gry/test/ux1-etap4.mjs
import fs from "fs";
import { execSync } from "child_process";
import { chromium, page, BASE } from "./lib.mjs";
import { tester, docs as H2DOCS } from "./h2-lib.mjs";
const { ok, end } = tester();
const b = await chromium.launch();
const ROOT = new URL("../../../", import.meta.url).pathname;
const ready = async (p, sel = "#main .greet") => { await p.waitForSelector(sel, { timeout: 20000 }).catch(() => {}); await p.waitForTimeout(1500); };
const PK = { "skrot-proba-do": "2026-11-14T17:00:00+01:00", "bm-proba-koniec-pokazane": "1" };
async function open(o = {}) {
  const ls = { "mock-docs": JSON.stringify(H2DOCS), "skrot-green": o.dark ? "dark" : "light", "bm-ld-flag": "1", ...(o.ls || {}) };
  const p = await page(b, { konto: o.konto || "proba-koniec", w: o.w || 390, h: o.h || 844, lang: o.lang || "pl", ls, ctx: o.dark ? { colorScheme: "dark" } : {} });
  await p.clock.setFixedTime(new Date(o.time || "2026-11-17T10:00:00+01:00"));
  await p.goto(BASE + "index.html" + (o.hash ? "#" + o.hash : "")); await ready(p, o.sel);
  return p;
}

// ---------- K1: paywall zablokowanej lekcji ----------
for (const [konto, ls] of [["darmowe", {}], ["proba-koniec", PK]]) for (const dark of [false, true]) for (const lang of ["pl", "en"]) for (const w of [390, 1280]) {
  if ((dark || w === 1280) && lang === "en") continue;
  const p = await open({ konto, ls, dark, lang, w, h: w === 1280 ? 900 : 844, hash: "/material/A2", sel: ".paywall" });
  await p.waitForSelector(".uxw-spis li", { timeout: 5000 }).catch(() => {});
  const r = await p.evaluate(() => {
    const pw = document.querySelector(".paywall"); if (!pw) return null;
    const btns = [...pw.querySelectorAll(".uxw-paywall-act button")].map((x) => { const rr = x.getBoundingClientRect(); return { t: x.textContent.trim(), prim: x.classList.contains("primary"), bottom: rr.bottom, h: rr.height }; });
    const d = pw.querySelector("p.muted"), lh = parseFloat(getComputedStyle(d).lineHeight) || 24;
    return { btns, ih: innerHeight, opisLinie: Math.round(d.getBoundingClientRect().height / lh), info: pw.querySelector(".uxw-lekcja-info")?.textContent, spis: [...pw.querySelectorAll(".uxw-spis li")].map((x) => x.textContent), poziomo: document.documentElement.scrollWidth > innerWidth };
  });
  const tag = `${konto} ${w} ${dark ? "ciemny" : "jasny"} ${lang}`;
  const re199 = lang === "pl" ? /^199 zł do lipca · ok\. \d+ zł \/ mies\.$/ : /^199 zł until July · about \d+ zł \/ month$/;
  const b199 = r?.btns.find((x) => re199.test(x.t)), i199 = r?.btns.indexOf(b199), b35 = r?.btns.findIndex((x) => /^35 zł \/ (mies\.|month)$/.test(x.t));
  ok(`K1 ${tag}: przycisk „199 zł do lipca · ok. X zł / mies.” w pierwszym ekranie 390×844`, b199 && b199.bottom <= r.ih && b199.h >= 44, r?.btns);
  ok(`K1 ${tag}: 35 zł jako kolejny (drugorzędny) przycisk, ${konto === "proba-koniec" ? "199 zł główny" : "główny „Wypróbuj”"}`, b35 > i199 && !r.btns[b35].prim && (konto === "proba-koniec" ? b199.prim : r.btns[0].prim && /Wypróbuj|Try/.test(r.btns[0].t)), r?.btns);
  ok(`K1 ${tag}: opis ≤ 2 linie`, r && r.opisLinie <= 2, r?.opisLinie);
  ok(`K1 ${tag}: „N pytań · K pojęć · ok. M min” i lista tytułów sekcji`, r && (lang === "pl" ? r.info === "10 pytań · 8 pojęć · ok. 35 min" : /^10 questions · 8 (concepts|terms) · (about|approx\.) 35 min$/.test(r.info || "")) && r.spis.length >= 2 && /^1\. całki 1/.test(r.spis[0]), { info: r?.info, spis: r?.spis });
  ok(`K1 ${tag}: bez poziomego przewijania, konsola bez błędów`, r && !r.poziomo && !p.errors.length, p.errors);
  ok(`K1 ${tag}: każdy przycisk paywalla ≥ 44 px`, r && r.btns.every((x) => x.h >= 44), r?.btns.map((x) => x.h));
  await p.close();
}

// ---------- K2: choosePlan ----------
for (const lang of ["pl", "en"]) {
  const p = await open({ konto: "proba-koniec", ls: PK, lang });
  await p.evaluate(() => window.skrot.buy()); await p.waitForTimeout(500);
  const r = await p.evaluate(() => { const c = [...document.querySelectorAll('[aria-label="Wybierz plan"] .plan-card, [aria-label="Choose a plan"] .plan-card')]; return { plany: c.map((x) => ({ p: x.dataset.plan, t: x.innerText.replace(/\s+/g, " "), bw: getComputedStyle(x).borderTopWidth })), fokus: document.activeElement?.dataset?.plan, zamknij: Math.round([...document.querySelectorAll(".modal .btn")].find((x) => /Zamknij|Close/.test(x.textContent))?.getBoundingClientRect().height || 0) }; });
  ok(`K2 ${lang}: karta 199 zł pierwsza, zaznaczona (obwódka) i z fokusem`, r.plany[0]?.p === "rok" && r.plany[0].bw === "2px" && r.fokus === "rok", r);
  ok(`K2 ${lang}: pod 199 zł „${lang === "pl" ? "to ok. X zł miesięcznie" : "about X zł a month"}”`, (lang === "pl" ? /199 zł to ok\. \d+ zł miesięcznie/ : /199 zł about \d+ zł a month/).test(r.plany[0]?.t || ""), r.plany[0]);
  ok(`K2 ${lang}: „Zamknij” ≥ 44 px`, r.zamknij >= 44, r.zamknij);
  await p.close();
}

// ---------- K3: przycisk płatności bez zgód ----------
for (const lang of ["pl", "en"]) {
  const p = await open({ konto: "proba-koniec", ls: PK, lang });
  await p.evaluate(() => window.skrot.buy("rok")); await p.waitForTimeout(500);
  const sel = ':is([aria-label="Zanim zapłacisz"], [aria-label="Before you pay"])';
  const pay = p.locator(`${sel} .btn.primary`);
  ok(`K3 ${lang}: przycisk płatności aktywny, przyciski okna ≥ 44 px`, !(await pay.isDisabled()) && (await p.evaluate((sel) => [...document.querySelectorAll(`${sel} .btn`)].every((x) => x.getBoundingClientRect().height >= 44), sel)));
  await pay.click(); await p.waitForTimeout(200);
  const r = await p.evaluate((sel) => { const m = document.querySelector(`${sel} .uxw-zgody[role=alert]`); return { msg: m && !m.hidden ? m.textContent : null, fokus: document.activeElement?.type, pierwszy: document.activeElement === document.querySelector(`${sel} input[type=checkbox]`) }; }, sel);
  ok(`K3 ${lang}: komunikat role=alert „${lang === "pl" ? "Zaznacz obie zgody powyżej…" : "Tick both boxes above…"}” i fokus na pierwszym polu`, (lang === "pl" ? r.msg === "Zaznacz obie zgody powyżej, żeby przejść do płatności." : r.msg === "Tick both boxes above to continue to payment.") && r.pierwszy, r);
  await p.locator(`${sel} input[type=checkbox]`).first().check(); await pay.click(); await p.waitForTimeout(200);
  ok(`K3 ${lang}: po jednej zgodzie fokus przechodzi na drugą`, await p.evaluate((sel) => document.activeElement === document.querySelectorAll(`${sel} input[type=checkbox]`)[1], sel));
  await p.close();
}

// ---------- K4: SQL v54 i karta „+2 dni” ----------
{
  let out = ""; try { out = execSync("node supabase/test/pglite.mjs 2>&1", { cwd: ROOT, encoding: "utf8" }); } catch (e) { out = String(e.stdout || ""); }
  const bl = out.split("\n").filter((l) => /OK B[1-7] (brak kolokwium|kolokwium za 10|stan: mozna|bonus|drugi bonus|próba trwa|po zakupie|anon)/.test(l));
  ok("K4 PGlite v54: bonus raz na konto, tylko po zakończonej próbie, tylko w oknie ≤ 7 dni, nie po zakupie (B1–B7)", bl.length >= 9 && /✓ test\/v54\.sql/.test(out), bl.length);
}
for (const [dark, lang] of [[false, "pl"], [true, "pl"], [false, "en"]]) {
  const p = await open({ konto: "proba-koniec", ls: { ...PK, "mock-bonus": "1" }, dark, lang, sel: ".uxw-bonus" });
  const r = await p.evaluate(() => { const e = document.querySelector(".uxw-bonus"); if (!e) return null; const rr = e.getBoundingClientRect(); return { t: e.innerText.replace(/\s+/g, " "), top: rr.top, bottom: rr.bottom, ih: innerHeight }; });
  ok(`K4 ${lang}${dark ? " ciemny" : ""}: karta „Kolokwium · Prawo · za 5 dni. Masz jeszcze jedne 2 dni…” w pierwszym ekranie`, r && (lang === "pl" ? /Kolokwium · .+ · za 5 dni/.test(r.t) && /Masz jeszcze jedne 2 dni pełnego dostępu, żeby się przygotować\./.test(r.t) : /Test · .+ · in 5 days/.test(r.t) && /You have one more 2-day pass to prepare\./.test(r.t)) && r.bottom <= r.ih, r);
  if (!dark && lang === "pl") {
    await p.click(".uxw-bonus .btn"); await p.waitForTimeout(3500);
    ok("K4: „Włącz 2 dni” → próba znów trwa, powitanie mówi „Masz 2 dni pełnego dostępu”", (await p.evaluate(() => localStorage.getItem("mock-konto"))) === "proba" && (await p.evaluate(() => [...document.querySelectorAll("#layer .modal h2")].map((x) => x.textContent))).includes("Masz 2 dni pełnego dostępu"));
  }
  await p.close();
}
for (const [konto, ls, opis] of [["proba-koniec", PK, "bez okna 7 dni (baza mówi „nie”)"], ["darmowe", {}, "darmowe przed próbą"], ["platne", {}, "płatne"]]) {
  const p = await open({ konto, ls });
  ok(`K4 ${opis}: bez karty „+2 dni”`, !(await p.locator(".uxw-bonus").count()));
  await p.close();
}

// ---------- K5: plan miesięczny – arkusz przed portalem ----------
for (const lang of ["pl", "en"]) {
  const p = await open({ konto: "platne", lang });
  await p.evaluate(() => { window.skrot.plan = "miesiac"; window.skrot.manage(); }); await p.waitForTimeout(400);
  const r = await p.evaluate(() => { const d = document.querySelector(".uxw-porownanie"); return d && { t: d.innerText.replace(/\s+/g, " "), btn: [...d.querySelectorAll("button")].map((x) => ({ t: x.textContent, h: Math.round(x.getBoundingClientRect().height) })) }; });
  ok(`K5 ${lang}: arkusz z porównaniem do lipca i 199 zł, „Przejdź na 199 zł” i portal (w tym anulowanie)`, r && (lang === "pl" ? /Płacąc co miesiąc, do lipca zapłacisz razem ok\. \d+ zł\. Plan do lipca kosztuje 199 zł\./.test(r.t) && r.btn.some((x) => x.t === "Przejdź na 199 zł") && r.btn.some((x) => /anulowanie/.test(x.t)) : /Paying monthly, you'll pay about \d+ zł in total until July/.test(r.t) && r.btn.some((x) => x.t === "Switch to 199 zł") && r.btn.some((x) => /cancelling/.test(x.t))) && r.btn.every((x) => x.h >= 44), r);
  if (lang === "pl") {
    await p.click('.uxw-porownanie button:has-text("Przejdź na 199 zł")'); await p.waitForTimeout(500);
    ok("K5: „Przejdź na 199 zł” → okno zgód planu 199 zł", await p.evaluate(() => /199/.test(document.querySelector('[aria-label="Zanim zapłacisz"] .btn.primary')?.textContent || "")));
  }
  await p.close();
}

// ---------- K6: licznik rocznika, FAQ, usuwanie konta ----------
for (const [n, widac] of [["9", false], ["40", true]]) for (const lang of ["pl", "en"]) {
  if (lang === "en" && !widac) continue;
  const p = await page(b, { konto: "brak", lang, ls: { "mock-licznik": n } });
  await p.goto(BASE + "index.html"); await p.waitForTimeout(3000);
  const t = await p.evaluate(() => { const e = document.querySelector("#login .lg-licznik"); return e && !e.hidden ? e.textContent : null; });
  ok(`K6 licznik ${n} ${lang}: ${widac ? "linia widoczna" : "brak linii (< 15)"}`, widac ? (lang === "pl" ? t === "40 osób z Business Management uczyło się tu w tym tygodniu" : t === "40 people from Business Management studied here this week") : t === null, t);
  if (widac && lang === "pl") {
    const faq = await p.evaluate(() => [...document.querySelectorAll("#login .lg-demo summary")].map((x) => x.textContent));
    ok("K6: FAQ „Kto to robi?”", faq.includes("Kto to robi?"), faq);
  }
  await p.close();
}
{
  const p = await open({ konto: "platne" });
  await p.evaluate(() => document.querySelector("#barRight button, .bar-right button")?.click());
  await p.waitForTimeout(300);
  let link = await p.locator('#layer button:has-text("Usuń konto i dane")').count();
  if (!link) { await p.evaluate(() => window.ZD_APP?.go?.({ view: "ustawienia", id: "konto" })); await p.waitForTimeout(500); await p.click('text="Konto i dostęp"').catch(() => {}); await p.waitForTimeout(400); link = await p.locator('#layer button:has-text("Usuń konto i dane")').count(); }
  ok("K6: w oknie konta link „Usuń konto i dane”", link === 1, link);
  if (link) { await p.click('#layer button:has-text("Usuń konto i dane")'); await p.waitForTimeout(400); ok("K6: link prowadzi do Ustawienia → Konto", /ustawienia\/konto/.test(await p.evaluate(() => location.hash))); }
  await p.close();
}
await b.close();
end();
