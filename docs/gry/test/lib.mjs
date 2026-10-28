// Wspólne dla testów Playwright: lokalny serwer (python3 -m http.server 8765 w katalogu repo) + atrapa Supabase.
import { createRequire } from "module";
import fs from "fs";
const require = createRequire(process.env.PW_FROM || process.env.HOME + "/matura-app/package.json");
export const { chromium } = require("playwright");
const DIR = new URL("./", import.meta.url).pathname;
export const BASE = "http://127.0.0.1:8765/";
export const OUT = process.env.OUT || "/tmp/gry-shots";
fs.mkdirSync(OUT, { recursive: true });
const ATRAPA = fs.readFileSync(DIR + "atrapa-supabase.js", "utf8");
export async function page(browser, { konto = "platne", v13 = "1", lang = "pl", w = 390, h = 844, ls = {}, ctx: more = {} } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, ...more });
  await ctx.route(/supabase-js@[\d.]+\/dist\/umd\/supabase\.min\.js/, (r) => r.fulfill({ contentType: "text/javascript", body: ATRAPA }));
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => (/supabase-js/.test(r.request().url()) ? r.fallback() : r.abort()));
  await ctx.route(BASE + "index.html*", async (r) => { const res = await r.fetch(); let b = await res.text(); b = b.replace(/(<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase[^"]*")\s+integrity="[^"]*"/, "$1"); r.fulfill({ response: res, body: b }); });
  await ctx.addInitScript(([konto, v13, lang, extra]) => {
    if (sessionStorage.getItem("init-done")) return; sessionStorage.setItem("init-done", "1");
    localStorage.setItem("mock-konto", konto); localStorage.setItem("mock-v13", v13);
    if (konto !== "brak") localStorage.setItem("sb-zkyxujkdrovfzpasocmv-auth-token", "{}");
    localStorage.setItem("bm-group", "C111"); localStorage.setItem("bm-tour", "1"); localStorage.setItem("bm-sub", "A");
    localStorage.setItem("skrot-lang", lang);
    for (const [k, v] of Object.entries(extra)) localStorage.setItem(k, v);
  }, [konto, v13, lang, ls]);
  const p = await ctx.newPage();
  p.errors = [];
  p.on("pageerror", (e) => p.errors.push(String(e)));
  p.on("console", (m) => { if (m.type() === "error" && !/net::ERR_FAILED|Failed to load resource/.test(m.text())) p.errors.push(m.text()); });
  return p;
}
export const shot = (p, name) => p.screenshot({ path: `${OUT}/${name}.png` });
