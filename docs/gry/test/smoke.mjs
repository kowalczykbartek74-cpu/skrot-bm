import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const p = await page(b);
await p.goto(BASE + "index.html#/materials");
await p.waitForTimeout(2500);
await shot(p, "smoke");
console.log(p.errors, await p.evaluate(() => window.__rpc.map((x) => x.fn)));
await b.close();
