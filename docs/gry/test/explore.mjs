import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const p = await page(b);
await p.goto(BASE + "index.html#/" + (process.argv[2] || "material/m1"));
await p.waitForTimeout(2000);
await shot(p, process.argv[3] || "explore");
console.log(p.errors);
console.log((await p.evaluate(() => [...document.querySelectorAll("main button, main a")].map((x) => x.textContent.trim().slice(0, 40)).filter(Boolean))).join(" | "));
await b.close();
