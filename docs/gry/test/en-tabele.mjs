// SPEC 10.3: każda linijka z tabel tekstów (SPEC.md 5.6, 6.3, 7.6, 8.4, 9.5; SPEC-2.md 4.7 Drabina, 5.6 Hasło dnia) ma parę w i18n-en.js.
import fs from "fs";
const want = [];
for (const [plik, sekcje] of [["SPEC.md", ["5.6", "6.3", "7.6", "8.4", "9.5"]], ["SPEC-2.md", ["4.7", "5.6"]]]) {
  let sec = null;
  for (const l of fs.readFileSync(new URL("../" + plik, import.meta.url), "utf8").split("\n")) {
    const m = l.match(/^#+ (\d+\.\d+) /); if (m) sec = m[1];
    if (sekcje.includes(sec) && l.startsWith("| ") && !l.startsWith("| PL ") && !/^\| -/.test(l)) want.push([plik + " " + sec, ...l.split(" | ").map((x) => x.replace(/^\| ?| ?\|$/g, ""))]);
  }
}
const dict = {}; const ctx = { window: { SKROT_I18N: { load: (o) => Object.assign(dict, o.exact) } } };
new Function("window", fs.readFileSync(new URL("../../../i18n-en.js", import.meta.url), "utf8"))(ctx.window);
const brak = want.filter(([, pl]) => !(pl in dict));
console.log(brak.length ? "✗ brak w słowniku:\n" + brak.map((x) => `  ${x[0]}: ${x[1]}`).join("\n") : `✓ wszystkie ${want.length} linijek z tabel tekstów są w i18n-en.js`);
process.exit(brak.length ? 1 : 0);
