// Fundament pod inne kierunki: tekst ekranów BM przed i po zmianie musi być ten sam.
// Zrzut tekstu: BASE=http://127.0.0.1:<port>/ OUT_JSON=/tmp/x.json node docs/gry/test/fundament-bm-tekst.mjs
// Porównanie: node docs/gry/test/fundament-bm-tekst.mjs --porownaj przed.json po.json
// Ta sama atrapa (z tej gałęzi) dla obu stron; stara strona nie wysyła filtra rocznika, nowa wysyła (atrapa: treści = BM).
import fs from "fs";
const EKRANY = ["home", "materials", "review", "terms", "more"];
// rzeczy zależne od chwili uruchomienia (zegar, „x min temu”) nie są różnicą
const norm = (t) => t.replace(/\b\d{1,2}:\d{2}\b/g, "HH:MM").replace(/\d+ (s|sek\.|min|minut[ay]?) temu/g, "N temu").replace(/\s+\n/g, "\n").trim();

if (process.argv[2] === "--porownaj") {
  const [a, b] = [process.argv[3], process.argv[4]].map((f) => JSON.parse(fs.readFileSync(f, "utf8")));
  let zle = 0;
  for (const k of Object.keys(a)) {
    if (norm(a[k]) === norm(b[k] ?? "")) { console.log("✓", k); continue; }
    zle++;
    const la = norm(a[k]).split("\n"), lb = norm(b[k] ?? "").split("\n");
    const i = la.findIndex((l, j) => l !== lb[j]);
    console.log("✗", k, "pierwsza różnica w wierszu", i, "\n   przed:", la[i], "\n   po:   ", lb[i]);
  }
  console.log(zle ? `✗ ${zle} ekranów różni się` : "✓ wszystkie ekrany BM bez zmian");
  process.exit(zle ? 1 : 0);
}

const { chromium, page, BASE } = await import("./lib.mjs");
const b = await chromium.launch();
const out = {};
for (const konto of ["platne", "starosta"]) for (const lang of ["pl", "en"]) {
  const p = await page(b, { konto, lang, w: 375, h: 812 });
  await p.goto(BASE + "index.html#/home"); await p.waitForTimeout(2500);
  for (const v of EKRANY) {
    await p.goto(BASE + "index.html#/" + v); await p.waitForTimeout(1500);
    out[`${konto}/${lang}/${v}`] = await p.evaluate(() => (document.querySelector("main") || document.body).innerText);
  }
  out[`${konto}/${lang}/bledy`] = p.errors.join("\n");
  await p.context().close();
}
fs.writeFileSync(process.env.OUT_JSON || "/tmp/fundament-bm.json", JSON.stringify(out, null, 1));
console.log("zapisano", Object.keys(out).length, "ekranów →", process.env.OUT_JSON);
await b.close();
