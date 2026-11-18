// Sonda pętli UX-6: przeglądarka, która widzi tylko to, co student. Serwer HTTP na 127.0.0.1:8826, sterowany curl-em.
// BASE=http://127.0.0.1:8816/ RUNDA=0 node docs/audyt-ux/petla-6/sonda.mjs
// Polecenia: /start?konto=&w=&h=&dark=&lang=&stan=&zadanie= · /poczta · /ekran · /klik?n= | ?tekst= · /wpisz?n=&tekst= · /przewin?dy= · /wstecz · /klawisz?k= · /koniec?wynik=&uwagi=
// Nie wystawia adresów #/…, kodu strony, localStorage ani window.*; dziennik (z adresem, dla właściciela) w runda-R/dziennik.jsonl.
import http from "http";
import fs from "fs";
import { chromium, open, UID } from "../../gry/test/h2-lib.mjs";
import { STANY } from "./stany.mjs";

const PORT = +(process.env.SONDA_PORT || 8826);
const R = process.env.RUNDA ?? "0";
const DIR = new URL(`./runda-${R}/`, import.meta.url).pathname;
fs.mkdirSync(DIR + "zrzuty", { recursive: true });
const LOG = DIR + "dziennik.jsonl";
const b = await chromium.launch();
let p = null, ctx = null, zadanie = "Z0", krok = 0, lista = [], ruchy = 0;

const log = async (polecenie, args, extra = {}) => {
  let adres = null; try { adres = p ? new URL(p.url()).hash || p.url() : null; } catch {}
  fs.appendFileSync(LOG, JSON.stringify({ t: new Date().toISOString(), zadanie, krok, ruchy, polecenie, args, adres, ...extra }) + "\n");
};

// Atrapa płatności: każda strona Stripe kończy się ekranem „atrapa: tu byłaby płatność” (sukces zadania zakupu).
const STRIPE = (url) => {
  const plan = /5kQ00keXo1Nv3QfgXlao800/.test(url) && /buy\./.test(url) ? "Plan roczny – 199 zł (do końca roku akademickiego)" : /bJecN66qS63L4Uj7mLao801/.test(url) ? "Plan miesięczny – 35 zł / mies." : /billing\./.test(url) ? "Portal klienta (subskrypcja)" : "Płatność";
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Płatność</title><body style="font:18px system-ui;padding:24px"><h1>Atrapa: tu byłaby płatność</h1><p>${plan}</p><p style="color:#555">To ekran testowy zamiast strony operatora płatności.</p></body>`;
};

async function czekaj() {
  await p.waitForTimeout(450);
  // koniec animacji (najwyżej 2 s)
  await p.evaluate(() => Promise.race([Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming?.().iterations !== Infinity).map((a) => a.finished.catch(() => {}))), new Promise((r) => setTimeout(r, 2000))])).catch(() => {});
  await p.waitForTimeout(250);
}

async function ekran() {
  krok++;
  const plik = `${zadanie}-${String(krok).padStart(2, "0")}.png`;
  await p.screenshot({ path: DIR + "zrzuty/" + plik }).catch(() => {});
  const info = await p.evaluate(() => {
    const vis = (e) => { const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return null; if (r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth) return null; const cs = getComputedStyle(e); if (cs.visibility === "hidden" || +cs.opacity === 0 || e.closest("[hidden],[inert],[aria-hidden=true]")) return null; return r; };
    const hit = (e, r) => { const pts = [[0.5, 0.5], [0.2, 0.5], [0.8, 0.5], [0.5, 0.25], [0.5, 0.75]]; for (const [fx, fy] of pts) { const x = Math.min(innerWidth - 1, Math.max(0, r.left + r.width * fx)), y = Math.min(innerHeight - 1, Math.max(0, r.top + r.height * fy)); const t = document.elementFromPoint(x, y); if (t && (t === e || e.contains(t) || t.contains(e) && t.tagName === "LABEL")) return true; } return false; };
    const name = (e) => {
      const al = e.getAttribute("aria-label"); if (al) return al.trim();
      const lb = e.getAttribute("aria-labelledby"); if (lb) { const t = lb.split(/\s+/).map((id) => document.getElementById(id)?.innerText || "").join(" ").trim(); if (t) return t; }
      if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.tagName)) { const l = e.labels?.[0]?.innerText || e.closest("label")?.innerText || e.placeholder || e.title || ""; const v = e.type === "checkbox" || e.type === "radio" ? (e.checked ? " [zaznaczone]" : " [puste]") : e.value ? ` [wpisane: ${e.value.slice(0, 30)}]` : ""; return (l.trim() + v).trim(); }
      const t = (e.innerText || "").replace(/\s+/g, " ").trim(); if (t) return t.slice(0, 90);
      return (e.title || e.querySelector("img[alt]")?.alt || e.querySelector("svg title")?.textContent || "").trim();
    };
    const rola = (e) => e.getAttribute("role") || ({ A: "link", BUTTON: "przycisk", INPUT: e.type === "checkbox" ? "pole wyboru" : e.type === "radio" ? "opcja" : "pole tekstowe", SELECT: "lista", TEXTAREA: "pole tekstowe", SUMMARY: "rozwiń", LABEL: "etykieta" }[e.tagName] || "klikalne");
    document.querySelectorAll("[data-sonda-n]").forEach((e) => e.removeAttribute("data-sonda-n"));
    const sel = "button, a[href], input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [role=link], [role=checkbox], [role=switch], [role=radio], [role=menuitem], [role=option], [onclick], [tabindex]:not([tabindex='-1'])";
    const els = [], seen = new Set();
    for (const e of document.querySelectorAll(sel)) {
      if (seen.has(e) || [...seen].some((s) => s.contains(e) && s.matches("button, a[href], summary"))) continue;
      const r = vis(e); if (!r || !hit(e, r)) continue;
      if (e.disabled && !name(e)) continue;
      seen.add(e);
      const n = els.length + 1; e.setAttribute("data-sonda-n", n);
      const tekstWidoczny = (/[\p{L}\p{N}]/u.test(e.innerText || "") ? e.innerText.trim() : "") || (/^(INPUT|SELECT|TEXTAREA)$/.test(e.tagName) ? "pole" : "");
      els.push({ n, rola: rola(e), podpis: name(e) || "(bez podpisu)", tylko_ikona: !tekstWidoczny, ...(e.disabled || e.getAttribute("aria-disabled") === "true" ? { wylaczony: true } : {}), ...(e.getAttribute("aria-pressed") === "true" || e.getAttribute("aria-selected") === "true" || e.getAttribute("aria-current") ? { wybrany: true } : {}), rozmiar: `${Math.round(r.width)}×${Math.round(r.height)}` });
    }
    // widoczny tekst: węzły tekstu w oknie, w kolejności dokumentu
    const parts = [], w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let t; (t = w.nextNode());) { const s = t.textContent.replace(/\s+/g, " ").trim(); if (!s || !t.parentElement || t.parentElement.closest("script, style, #skrot-wm")) continue; if (!vis(t.parentElement)) continue; parts.push(s); }
    let tekst = ""; for (const s of parts) { if (tekst.length > 1500) break; tekst += (tekst ? " " : "") + s; }
    const h = [...document.querySelectorAll("[role=dialog] h1, [role=dialog] h2, dialog h2, h1, h2")].find((e) => vis(e));
    const scrollables = [document.scrollingElement, ...[...document.querySelectorAll("*")].filter((e) => { const cs = getComputedStyle(e); return /(auto|scroll)/.test(cs.overflowY) && e.scrollHeight > e.clientHeight + 8 && vis(e); })];
    const nizej = scrollables.some((e) => e && e.scrollTop + e.clientHeight < e.scrollHeight - 8);
    return { tytul: (h?.innerText || document.title || "").replace(/\s+/g, " ").trim().slice(0, 120), tekst: tekst.slice(0, 1500), elementy: els, ponizej_jest_jeszcze_tresc: nizej ? "tak" : "nie" };
  }).catch((e) => ({ blad: "strona w trakcie zmiany, zrób /ekran jeszcze raz", tytul: "", tekst: "", elementy: [] }));
  lista = info.elementy || [];
  return { krok, ruchy, zrzut: DIR + "zrzuty/" + plik, ...info };
}

function pickEl(q) {
  if (q.n) return lista.find((e) => e.n === +q.n) ? `[data-sonda-n="${+q.n}"]` : null;
  if (q.tekst) { const t = q.tekst.toLowerCase(); const e = lista.find((x) => x.podpis.toLowerCase() === t) || lista.find((x) => x.podpis.toLowerCase().includes(t)); return e ? `[data-sonda-n="${e.n}"]` : null; }
  return null;
}

async function start(q) {
  if (ctx) await ctx.close().catch(() => {});
  zadanie = q.zadanie || "Z0"; krok = 0; ruchy = 0; lista = [];
  const st = STANY(q.stan || "");
  const w = +(q.w || 390), h = +(q.h || 844), dark = q.dark === "1";
  p = await open(b, { konto: q.konto || "platne", w, h, dark, lang: q.lang || "pl", fonts: true, wait: 0, ls: { "skrot-green": dark ? "dark" : "light", "bm-tour": "1", ...st.ls }, ctx: { locale: "pl-PL" } });
  ctx = p.context();
  await ctx.route(/^https?:\/\/[^/]*stripe\.com\//, (r) => r.fulfill({ contentType: "text/html", body: STRIPE(r.request().url()) }));
  ctx.on("page", async (np) => { p = np; await np.waitForLoadState().catch(() => {}); });
  // otwarcie było z wait: 0 → odczekaj na pierwszy ekran
  await p.waitForTimeout(3200);
  await czekaj();
}

const srv = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x"), q = Object.fromEntries(u.searchParams), cmd = u.pathname.slice(1);
  const send = (o, code = 200) => { res.writeHead(code, { "content-type": "application/json; charset=utf-8" }); res.end(JSON.stringify(o, null, 1)); };
  try {
    if (cmd === "start") { await start(q); await log("start", q); return send(await ekran()); }
    if (!p && cmd !== "koniec") return send({ blad: "najpierw /start" }, 400);
    if (cmd === "ekran") { const e = await ekran(); await log("ekran", q, { zrzut: e.zrzut }); return send(e); }
    if (cmd === "klik") {
      const s = pickEl(q); if (!s) return send({ blad: "nie ma takiego elementu na ostatniej liście – zrób /ekran", elementy: lista.map((e) => `${e.n}: ${e.podpis}`) }, 404);
      ruchy++; await p.locator(s).first().click({ timeout: 5000 }).catch(async () => { await p.locator(s).first().click({ timeout: 3000, force: true }).catch(() => {}); });
      await czekaj(); const e = await ekran(); await log("klik", q, { zrzut: e.zrzut }); return send(e);
    }
    if (cmd === "wpisz") {
      const s = pickEl(q); if (!s) return send({ blad: "nie ma takiego elementu – zrób /ekran" }, 404);
      ruchy++; await p.locator(s).first().fill(q.tekst || "", { timeout: 5000 }).catch(async () => { await p.locator(s).first().click(); await p.keyboard.type(q.tekst || ""); });
      await czekaj(); const e = await ekran(); await log("wpisz", q, { zrzut: e.zrzut }); return send(e);
    }
    if (cmd === "przewin") {
      ruchy++; const vp = p.viewportSize(); await p.mouse.move(vp.width / 2, vp.height / 2); await p.mouse.wheel(0, +(q.dy || 600));
      await czekaj(); const e = await ekran(); await log("przewin", q, { zrzut: e.zrzut }); return send(e);
    }
    if (cmd === "wstecz") { ruchy++; await p.goBack({ timeout: 5000 }).catch(() => {}); await czekaj(); const e = await ekran(); await log("wstecz", q, { zrzut: e.zrzut }); return send(e); }
    if (cmd === "klawisz") { await p.keyboard.press(q.k || "Escape"); await czekaj(); const e = await ekran(); await log("klawisz", q, { zrzut: e.zrzut }); return send(e); }
    // Skrzynka mailowa studenta: po „wyślij kod” leży tam mail z 6-cyfrowym kodem (atrapa przyjmuje każdy kod).
    if (cmd === "poczta") { const n = await p.evaluate(() => window.__otp || 0).catch(() => 0); await log("poczta", q); return send({ maile: n ? [{ od: "Zdawalni", temat: "Twój kod do logowania", tresc: "Twój kod: 482913. Ważny przez godzinę." }] : [] }); }
    if (cmd === "koniec") { await log("koniec", q); return send({ ok: true, zadanie, ruchy }); }
    if (cmd === "stop") { send({ ok: true }); await b.close(); srv.close(); process.exit(0); }
    send({ blad: "nieznane polecenie" }, 404);
  } catch (e) { send({ blad: String(e.message || e).slice(0, 300) }, 500); }
});
srv.listen(PORT, "127.0.0.1", () => console.log(`sonda na http://127.0.0.1:${PORT} (runda ${R})`));
