// Zrzuty „przed i po” do RAPORT.md: ten sam stan na czystym origin/main (PRZED) i na gałęzi (PO), 390 i 1280, jasny i ciemny.
// NAME=przed BASE=http://127.0.0.1:8823/ node docs/audyt-ux/petla-3/przed-po.mjs   (czysty origin/main)
// NAME=po BASE=http://127.0.0.1:8813/ node docs/audyt-ux/petla-3/przed-po.mjs      (gałąź)
import fs from "fs";
import { createRequire } from "module";
const require = createRequire(process.env.HOME + "/matura-app/package.json");
const { chromium } = require("playwright");
const DIR = new URL("./przed-po/", import.meta.url).pathname; fs.mkdirSync(DIR, { recursive: true });
const b = await chromium.launch();
const lib = await import("../../gry/test/ux3-lib.mjs"), h2 = await import("../../gry/test/h2-lib.mjs");
const click = async (p, sel, txt) => { const l = txt ? p.locator(sel).filter({ hasText: txt }).first() : p.locator(sel).first(); if (await l.count()) { await l.click({ timeout: 3000 }).catch(() => {}); return true; } return false; };
const esc = async (p) => { for (let i = 0; i < 3 && await p.locator("#layer .scrim").count(); i++) { await p.keyboard.press("Escape"); await p.waitForTimeout(300); } };
{
  const which = process.env.NAME || "po";
  for (const [w, hh] of [[390, 844], [1280, 900]]) for (const dark of [false, true]) {
    const tag = `${w}-${dark ? "ciemny" : "jasny"}`;
    // 1) zła odpowiedź na pytaniu kontrolnym
    let p = await lib.open(b, { w, h: hh, dark, ls: { "bm-dzwieki": "0" } });
    await p.locator(".lp-start").click(); await p.waitForTimeout(800);
    for (let i = 0; i < 25; i++) {
      await esc(p);
      const bad = p.locator(".lp-opts .opt:not([disabled])").filter({ hasText: "Błędnie" }).first();
      if (await bad.count()) { await bad.click(); await p.waitForTimeout(150); await click(p, ".lp-bottom .lp-cta:not([disabled])", /^Sprawdź/); await p.waitForTimeout(700); break; }
      if (await p.locator(".lp-opts .opt:not([disabled])").count()) { await p.locator(".lp-opts .opt:not([disabled])").first().click(); await p.waitForTimeout(150); await click(p, ".lp-bottom .lp-cta:not([disabled])", /^Sprawdź/); await p.waitForTimeout(300); }
      await click(p, ".lp-bottom .lp-cta:not([disabled]):not([hidden])"); await p.waitForTimeout(450);
    }
    await p.screenshot({ path: `${DIR}${which}-${tag}-zla-odpowiedz.png` }); await p.close();
    // 2) koniec karty „Dziś · 5 min”
    p = await h2.open(b, { w, h: hh, dark });
    await p.locator(".zh-hero .zh-go").click(); await p.locator(".lp").waitFor({ timeout: 15000 }); await p.waitForTimeout(800);
    for (let i = 0; i < 40 && !(await p.locator(".lp-done-screen").count()); i++) {
      const o = p.locator(".lp-opts .opt:not([disabled]):not(.sel)").filter({ hasText: /Dobra|Dobrze/ }).first();
      if ((await o.count()) && !(await p.locator(".lp[data-fb]").count())) { await o.click({ timeout: 3000 }).catch(() => {}); await p.waitForTimeout(120); const ck = p.locator('.lp-bottom [data-conf="1"]:not([disabled]), .lp-bottom .lp-cta:not([disabled]):not([hidden])').filter({ hasText: /^(Sprawdź|Pewny)/ }).first(); if (await ck.count()) await ck.click({ timeout: 3000 }).catch(() => {}); await p.waitForTimeout(300); }
      for (const t of [/^Wiedziałem/, /^Pokaż/]) await click(p, ".lp-stage button:not([disabled]), .lp-bottom .lp-barx button", t);
      if (!(await click(p, ".lp-bottom .lp-cta:not([disabled]):not([hidden])"))) await click(p, ".ld-skip:not([hidden])");
      await p.waitForTimeout(420);
    }
    await p.waitForTimeout(1500); await esc(p);
    await p.screenshot({ path: `${DIR}${which}-${tag}-koniec-karty-5min.png` }); await p.close();
  }
}
await b.close();
console.log(fs.readdirSync(DIR).length + " zrzutów w " + DIR);
