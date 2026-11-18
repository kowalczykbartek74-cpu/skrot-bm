// Pętla UX-6 (B3): test regresji zadań C1. Dla każdego zadania ścieżka wzorcowa (najkrótsza dziś znana) klik po kliku,
// tylko po elementach widocznych w oknie (jak student), i sprawdzenie wyniku. Tester-Sędzia tych ścieżek NIE dostaje.
// BASE=http://127.0.0.1:8816/ node docs/gry/test/ux6-zadania.mjs [Z3 Z5 …]
import { chromium, open } from "./h2-lib.mjs";
import { STANY } from "../../audyt-ux/petla-6/stany.mjs";

// Kliknięcie widocznego elementu, którego podpis (aria-label albo tekst) pasuje do wzorca. n = który z pasujących (od 0).
async function klik(p, wz, n = 0) {
  const ok = await p.evaluate(([src, fl, n]) => {
    const re = new RegExp(src, fl);
    const vis = (e) => { const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2 || r.bottom <= 0 || r.top >= innerHeight) return false; const cs = getComputedStyle(e); if (cs.visibility === "hidden" || e.closest("[hidden],[inert],[aria-hidden=true]")) return false; const t = document.elementFromPoint(Math.min(innerWidth - 1, r.left + r.width / 2), Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2))); return !!t && (t === e || e.contains(t)); };
    const nm = (e) => (e.getAttribute("aria-label") || e.innerText || e.labels?.[0]?.innerText || e.placeholder || "").replace(/\s+/g, " ").trim();
    const all = [...document.querySelectorAll("button, a[href], summary, [role=button], [role=tab], [role=switch], [role=checkbox], [role=radio], [role=option], [role=menuitem], input, select, label")].filter((e) => vis(e) && re.test(nm(e)));
    document.querySelectorAll("[data-ux6]").forEach((e) => e.removeAttribute("data-ux6"));
    const e = all[n]; if (!e) return all.length;
    e.setAttribute("data-ux6", "1"); return -1;
  }, [wz.source, wz.flags, n]);
  if (ok !== -1) throw new Error(`brak widocznego elementu ${wz} (pasujących: ${ok})`);
  await p.locator("[data-ux6]").first().click({ timeout: 5000 });
  await p.waitForTimeout(900);
}
async function wpisz(p, wz, tekst) {
  const loc = p.locator("input:visible, textarea:visible").filter({ has: p.locator("xpath=self::*") });
  const i = await p.evaluate((src) => { const re = new RegExp(src, "i"); const el = [...document.querySelectorAll("input, textarea")].find((e) => e.getBoundingClientRect().height > 2 && re.test((e.getAttribute("aria-label") || e.placeholder || e.labels?.[0]?.innerText || e.name || e.type || ""))); if (!el) return false; document.querySelectorAll("[data-ux6w]").forEach((e) => e.removeAttribute("data-ux6w")); el.setAttribute("data-ux6w", "1"); return true; }, wz.source);
  if (!i) throw new Error(`brak pola ${wz}`);
  await p.locator("[data-ux6w]").fill(tekst); await p.waitForTimeout(900);
}
const przewin = async (p, dy = 600) => { const v = p.viewportSize(); await p.mouse.move(v.width / 2, v.height / 2); await p.mouse.wheel(0, dy); await p.waitForTimeout(600); };
const txt = (p) => p.evaluate(() => document.body.innerText);
const widac = (p, re) => p.evaluate((src) => { const re = new RegExp(src, "i"); const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); for (let t; (t = w.nextNode());) { if (!re.test(t.textContent)) continue; const r = t.parentElement.getBoundingClientRect(); if (r.height && r.bottom > 0 && r.top < innerHeight && !t.parentElement.closest("[hidden]")) return true; } return false; }, re.source);

// Ścieżki wzorcowe. kroki = liczba klik/wpisz/przewin/wstecz; limit z C1.
const Z = [
  { id: "Z1", konto: "brak", stan: "nowy", limit: 8, sciezka: async (p) => { await klik(p, /^BM Business/); await klik(p, /^Dalej$/); await klik(p, /^Zacznij 3 dni za darmo$/); await wpisz(p, /e-mail/i, "jan@x.pl"); await klik(p, /^Wyślij kod/); await wpisz(p, /kod/i, "482913"); await p.waitForTimeout(3500); return 6; },
    sukces: async (p) => /Cześć/.test(await txt(p)) && /Okres próbny|3 dni pełnego dostępu/.test(await txt(p)) },
  { id: "Z2", konto: "proba", limit: 4, sciezka: async (p) => { await klik(p, /^Zaczynamy/); return 1; },
    sukces: async (p) => p.evaluate(() => !!document.querySelector(".lp, .ld-run, #layer .lp, [class*=lp-]")) },
  { id: "Z3", konto: "platne", limit: 5, sciezka: async (p) => { await klik(p, /^Przedmioty/); await klik(p, /^Makroekonomia/); await klik(p, /PKB i inflacja/); return 3; },
    sukces: async (p) => (await widac(p, /PKB i inflacja/)) && !/#\/subject/.test(p.url()) },
  { id: "Z4", konto: "platne", limit: 4, sciezka: async (p) => { await klik(p, /^Terminy/); await klik(p, /Ochrona własności/); return 2; },
    sukces: async (p) => (await widac(p, /20 lis/)) && (await widac(p, /Zakres|prawo autorskie/)) },
  { id: "Z5", konto: "platne", stan: "termin-prawo-3dni", w: 360, h: 640, limit: 5, sciezka: async (p) => { await klik(p, /^Terminy/); await przewin(p, -400); await klik(p, /^Przygotuj się$/); await klik(p, /próbny test|Zacznij test/i); return 4; },
    sukces: async (p) => p.evaluate(() => /Pytanie 1|1 \/ \d+|1 z \d+/.test(document.body.innerText)) },
  { id: "Z6", konto: "platne", stan: "fiszki", limit: 3, sciezka: async (p) => { await klik(p, /^Powtórki/); await klik(p, /Zacznij|Powtórz/); return 2; },
    sukces: async (p) => widac(p, /PKB: pojęcie/) },
  { id: "Z7", konto: "platne", limit: 4, sciezka: async (p) => { await klik(p, /^Przedmioty/); await wpisz(p, /Szukaj/i, "opportunity cost"); return 2; },
    sukces: async (p) => widac(p, /koszt alternatywny|koszt utraconych/i) },
  { id: "Z8", konto: "platne", stan: "w-trakcie", limit: 4, sciezka: async (p) => { await klik(p, /^Przedmioty/); await klik(p, /^Analiza matematyczna/); return 2; },
    sukces: async (p) => (await widac(p, /Całki oznaczone/)) && (await widac(p, /1 z 2|50 ?%|Opanowanie/i)) },
  { id: "Z9", konto: "platne", stan: "saldo", limit: 5, sciezka: async (p) => { await klik(p, /^Monety/); return 1; },
    sukces: async (p) => widac(p, /Sklep/) },
  { id: "Z10", konto: "platne", stan: "grupa-C112", limit: 4, sciezka: async (p) => { await klik(p, /^Więcej$/); await klik(p, /Ranking/); return 2; },
    sukces: async (p) => widac(p, /C11[123]/) },
  { id: "Z11", konto: "platne", limit: 6, sciezka: async (p) => { await klik(p, /^Więcej$/); await klik(p, /English/); await p.waitForTimeout(1500); const en = /Today|Subjects/.test(await txt(p)); await klik(p, /^More$|Menu/); await klik(p, /Polski/); await p.waitForTimeout(1500); p.__en = en; return 4; },
    sukces: async (p) => p.__en && /Dziś/.test(await txt(p)) },
  { id: "Z12", konto: "platne", w: 1280, h: 900, limit: 6, sciezka: async (p) => { await klik(p, /^Więcej$/); await klik(p, /Ustawienia/); await klik(p, /Mniej animacji/); await klik(p, /Ciemn/); return 4; },
    sukces: async (p) => p.evaluate(() => document.documentElement.classList.contains("calm") && document.documentElement.dataset.green === "dark") },
  { id: "Z13", konto: "proba-koniec", limit: 4, sciezka: async (p) => { await klik(p, /199 zł|Kup dostęp/); await klik(p, /199 zł|Przejdź do płatności|Kup/); return 2; },
    sukces: async (p) => /stripe\.com/.test(p.url()) || p.__stripe },
  { id: "Z14", konto: "platne", limit: 5, sciezka: async (p) => { await klik(p, /^Terminy/); await klik(p, /^Więcej opcji$/); await klik(p, /kalendarz w telefonie/i); return 3; },
    sukces: async (p) => widac(p, /webcal|\.ics|Skopiuj link|Google/i) },
  { id: "Z15", konto: "platne", limit: 4, sciezka: async (p) => { await klik(p, /^Więcej$/); await klik(p, /Pomoc|Kontakt|Napisz/); return 2; },
    sukces: async (p) => widac(p, /zdawalni\.support@gmail\.com|Napisz do nas/) },
  { id: "Z16", konto: "starosta", limit: 6, sciezka: async (p) => { await klik(p, /^Terminy/); await klik(p, /Logistyka/); await klik(p, /Edytuj/); return 3; },
    sukces: async (p) => widac(p, /Zapisz/) },
  { id: "Z17", konto: "platne", stan: "przerwa-7", limit: 3, sciezka: async (p) => { await klik(p, /Wracam|Zaczynamy/); return 1; },
    sukces: async (p) => p.evaluate(() => !!document.querySelector(".lp, .ld-run, #layer .lp, [class*=lp-]")) },
  { id: "Z18", konto: "darmowe", limit: 4, sciezka: async (p) => { await klik(p, /Kup dostęp|Zobacz plany|plan/i); return 1; },
    sukces: async (p) => (await widac(p, /199 zł/)) && (await widac(p, /35 zł/)) },
];

const tylko = process.argv.slice(2);
const b = await chromium.launch();
let pass = 0, fail = 0;
for (const z of Z.filter((z) => !tylko.length || tylko.includes(z.id))) {
  const p = await open(b, { konto: z.konto, w: z.w || 390, h: z.h || 844, wait: 3200, ls: { "skrot-green": "light", ...STANY(z.stan).ls } });
  await p.context().route(/^https?:\/\/[^/]*stripe\.com\//, (r) => { p.__stripe = true; r.fulfill({ contentType: "text/html", body: "<h1>atrapa płatności</h1>" }); });
  p.context().on("page", (np) => { if (/stripe/.test(np.url())) p.__stripe = true; });
  let kroki = null, ok = false, err = "";
  try { kroki = await z.sciezka(p); ok = await z.sukces(p); } catch (e) { err = String(e.message || e).slice(0, 200); }
  const wLimicie = kroki != null && kroki <= z.limit;
  const errs = p.errors.filter((e) => !/favicon|ERR_FAILED/.test(e));
  if (ok && wLimicie && !errs.length) { pass++; console.log(`✓ ${z.id} (${kroki}/${z.limit} kroków)`); }
  else { fail++; console.log(`✗ ${z.id} ${err || (!ok ? "brak sukcesu" : !wLimicie ? `ponad limit ${kroki}/${z.limit}` : "błędy konsoli")} ${errs.length ? JSON.stringify(errs).slice(0, 200) : ""}`); await p.screenshot({ path: `/tmp/ux-6/${z.id}-blad.png` }).catch(() => {}); }
  await p.context().close();
}
await b.close();
console.log(`${pass}/${pass + fail}`);
process.exit(fail ? 1 : 0);
