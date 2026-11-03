// Szybki podgląd: sklep v24 na atrapie, zrzuty do OUT. node docs/kosmetyki/test/szybki.mjs
import { chromium, page, shot, BASE } from "../../gry/test/lib.mjs";
const UID = "00000000-0000-4000-8000-000000000001";
const prog = JSON.stringify({ [UID]: { xp: { t: 2900 }, odznaki: { frun10: 1, pary0: 2, mistrz: 3 } } });
const b = await chromium.launch();
const p = await page(b, { ls: { "mock-v24": "1", "mock-saldo": "3000", "mock-progress": prog } });
await p.goto(BASE + "index.html#/shop"); await p.waitForTimeout(1500);
await shot(p, "k-shop-motywy");
await p.click("#ktab-profil"); await p.waitForTimeout(300); await shot(p, "k-shop-profil");
console.log(p.errors);
await b.close();
