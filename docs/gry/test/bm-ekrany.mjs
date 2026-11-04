// BM wygląda tak samo przed i po zmianach dla innych kierunków: tekst głównych ekranów (PL i EN, płatne konto, gość, starosta).
//   node docs/kierunki/test/bm-ekrany.mjs zapisz    → /tmp/bm-ekrany.json (przed zmianą, np. na gałęzi kierunki)
//   node docs/kierunki/test/bm-ekrany.mjs porownaj  → różnice względem zapisu (po zmianie)
// Wymaga serwera: python3 -m http.server 8765 --bind 127.0.0.1 w katalogu repo (jak docs/gry/test).
import fs from "fs";
import { chromium, page, BASE } from "./lib.mjs";
const PLIK = process.env.EKRANY || "/tmp/bm-ekrany.json";
// „Przed” z innego katalogu (np. git worktree gałęzi kierunki na porcie 8792): BASE=http://127.0.0.1:8792/ … zapisz
const tryb = process.argv[2] || "porownaj";
const EKRANY = ["", "materials", "subject/makroekonomia", "review", "terms", "calendar", "more", "gry", "ranking", "guide", "exam/makroekonomia", "glossary", "shop", "grading", "program", "syllabus/makroekonomia"];
const KONTA = [["platne", "pl"], ["platne", "en"], ["brak", "pl"], ["starosta", "pl"]];
const b = await chromium.launch();
const wynik = {}, bledy = [];
for (const [konto, lang] of KONTA) {
  const p = await page(b, { konto, lang });
  for (const e of EKRANY) {
    await p.goto(BASE + "index.html#/" + e); await p.reload(); await p.waitForTimeout(1400);
    // daty i godziny zmieniają się między przebiegami: zastępujemy je znakiem
    wynik[`${konto}/${lang}/#/${e}`] = (await p.evaluate(() => { document.querySelectorAll(".toast").forEach((t) => t.remove()); return document.body.innerText; }))
      .replace(/\d{1,2}:\d{2}/g, "HH:MM").replace(/\d+/g, "N");
  }
  if (p.errors.length) bledy.push([konto, lang, p.errors]);
  await p.context().close();
}
await b.close();
if (tryb === "zapisz") { fs.writeFileSync(PLIK, JSON.stringify(wynik, null, 1)); console.log(`Zapisano ${Object.keys(wynik).length} ekranów → ${PLIK}`); }
else {
  const stare = JSON.parse(fs.readFileSync(PLIK, "utf8"));
  let roznic = 0;
  for (const [k, v] of Object.entries(wynik)) {
    const a = (stare[k] || "").split("\n"), n = v.split("\n");
    const tylkoPrzed = a.filter((x) => !n.includes(x)), tylkoPo = n.filter((x) => !a.includes(x));
    if (tylkoPrzed.length || tylkoPo.length) { roznic++; console.log(`✗ ${k}\n   było: ${JSON.stringify(tylkoPrzed.slice(0, 6))}\n   jest: ${JSON.stringify(tylkoPo.slice(0, 6))}`); }
  }
  console.log(roznic ? `${roznic} ekranów różni się` : `✓ ${Object.keys(wynik).length} ekranów BM bez zmian`);
}
if (bledy.length) { console.log("Błędy konsoli:", JSON.stringify(bledy).slice(0, 800)); process.exitCode = 1; }
