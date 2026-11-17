// Pętla UX-4, W2 K1: faktyczne pole trafienia ≥ 44×44 px (sonda elementFromPoint wokół środka elementu) dla małych przycisków
// na Terminach, Kalendarzu, Powtórkach, Słowniczku, ścieżce przedmiotu i materiale. BASE=http://127.0.0.1:8814/ node docs/gry/test/ux4-cele.mjs
import { chromium, open, goto, hit, tester } from "./ux4-lib.mjs";
const { ok, end } = tester();
const b = await chromium.launch();
const PROBY = [
  ["terms", [".help-btn", ".th-help", ".th-more", ".tl-prep", ".tchip", "summary.tl-head", ".tl-tick", ".mc-nav"]],
  ["calendar", [".help-btn", ".ag-head", ".cal-mode button", ".stack .btn.small.primary"]],
  ["review", [".help-btn", ".pm-grid .pm-sq", ".pm-name", ".panel-head > button.link"]],
  ["glossary", [".help-btn", ".back", ".fchip"]],
  ["subject/analiza-matematyczna", [".qhelp > summary", ".back"]],
  ["material/A1", [".back", ".step", ".seg button", "details > summary"]],
];
const zle = [], znalezione = new Set();
for (const [w, lang, dark] of [[390, "pl", false], [360, "en", true], [1280, "pl", false]]) {
  const p = await open(b, { konto: "starosta", w, h: 844, lang, ls: { "skrot-green": dark ? "dark" : "light" } });
  for (const [hash, sels] of PROBY) {
    await goto(p, hash, 1500);
    for (const sel of sels) {
      const r = await hit(p, "#main " + sel);
      if (r.length) znalezione.add(`${hash} ${sel}`);
      for (const x of r.slice(0, 12)) if (x.w < 44 || x.h < 44) zle.push(`${hash}@${w}${lang}: ${sel} „${x.t}” ${x.vw}×${x.vh} → pole ${x.w}×${x.h}`);
    }
  }
  ok(`bez błędów konsoli (${w} ${lang})`, p.errors.length === 0, p.errors);
  await p.close();
}
for (const [hash, sels] of PROBY) for (const sel of sels) if (!["terms .th-help", "terms .th-more", "terms .tl-prep", "terms .tl-tick", "terms .mc-nav", "review .pm-grid .pm-sq", "review section > .row > button.link, .rv-games button.link"].includes(`${hash} ${sel}`)) ok(`znaleziono ${hash} ${sel}`, znalezione.has(`${hash} ${sel}`));
ok("K1 pole trafienia ≥ 44×44 px dla wszystkich małych przycisków z listy", zle.length === 0, zle.slice(0, 30));
console.log("sprawdzone:", [...znalezione].join(" | "));
await b.close();
end();
