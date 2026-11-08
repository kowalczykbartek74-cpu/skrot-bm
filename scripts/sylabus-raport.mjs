// Raport Etapu B (spec „Schemat robienia kierunków”): przedmioty semestru z formą zaliczenia z sylabusa rocznika
// i rozbieżności sylabus ↔ plan zajęć. Bez treści lekcji, same dane z sylabusa uczelni.
//   node scripts/sylabus-raport.mjs kierunki/<rocznik>.json --plan <plan-bm>/plan/<id>.json [--sem 1] > docs/kierunki/<prefiks>-sylabus.md
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { slug } from "./kierunek.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const ZAL = { e: "egzamin", pg: "zaliczenie z oceną", p: "zaliczenie bez oceny" };
const FORMA = { W: "wykład", CW: "ćwiczenia", LAB: "laboratorium", KON: "konwersatorium/lektorat", SEM: "seminarium", WF: "WF" };

export function raport(k, syl, plan, sem = 1) {
  const kursy = syl.courses.filter((c) => c.forms.some((f) => f.s === sem));
  const wPlanie = new Map();
  for (const g of Object.values(plan?.groups || {})) for (const w of ["odd", "even"]) for (const e of g[w] || []) if (e.k !== "X") {
    const id = slug(e.pl);
    if (!wPlanie.has(id)) wPlanie.set(id, { pl: e.pl, formy: new Set() });
    wPlanie.get(id).formy.add(e.k === "CW" ? "CW" : e.k);
  }
  const egzamin = (c) => c.forms.some((f) => f.s === sem && f.c === "e");
  const wiersze = kursy.map((c) => {
    const fs_ = c.forms.filter((f) => f.s === sem);
    return { c, egz: egzamin(c), formy: fs_.map((f) => `${FORMA[f.f] || f.f} ${f.h} h: ${ZAL[f.c] || f.c}`).join("; "), plan: wPlanie.has(c.id), wKierunku: !!k.przedmioty?.[c.id] };
  }).sort((a, b) => (b.egz - a.egz) || (b.plan - a.plan) || a.c.pl.localeCompare(b.c.pl, "pl"));
  const uwagi = [];
  for (const [id, p] of wPlanie) {
    const c = syl.courses.find((x) => x.id === id);
    if (!c) { uwagi.push(`„${p.pl}” jest w planie zajęć, a nie ma karty w sylabusie`); continue; }
    if (!c.forms.some((f) => f.s === sem)) uwagi.push(`„${p.pl}” jest w planie zajęć, a w sylabusie nie ma go w semestrze ${sem}`);
    const fsyl = new Set(c.forms.filter((f) => f.s === sem).map((f) => f.f));
    for (const f of p.formy) if (!fsyl.has(f)) uwagi.push(`„${p.pl}”: w planie są zajęcia ${FORMA[f] || f}, a w sylabusie (sem. ${sem}) ich nie ma`);
    for (const f of fsyl) if (!p.formy.has(f)) uwagi.push(`„${p.pl}”: w sylabusie jest ${FORMA[f] || f}, a w planie zajęć tej formy nie ma`);
  }
  for (const w of wiersze) if (!w.plan && w.c.hours > 5) uwagi.push(`„${w.c.pl}” (sylabus, sem. ${sem}, ${w.c.hours} h) nie ma w planie zajęć grup`);
  const egz = wiersze.filter((w) => w.egz);
  return [
    `# ${k.kierunek.pl} (${k.id}): sylabus, semestr ${sem}`,
    "",
    `Źródło: ${syl.source}. Plik: \`${k.sylabus.plik}\` (${syl.courses.length} kart przedmiotów, wszystkie semestry). Wygenerowane: \`node scripts/sylabus-raport.mjs kierunki/${k.id}.json --plan …\`.`,
    "",
    `**Egzamin w semestrze ${sem} (${egz.length}):** ${egz.map((w) => w.c.pl).join(", ") || "—"}.`,
    "",
    "| Przedmiot | Formy i zaliczenie | ECTS | W planie zajęć | W pliku kierunku |",
    "|---|---|---|---|---|",
    ...wiersze.map((w) => `| ${w.egz ? "**" + w.c.pl + "**" : w.c.pl} | ${w.formy} | ${w.c.ects} | ${w.plan ? "tak" : "nie"} | ${w.wKierunku ? "tak" : "—"} |`),
    "",
    "## Rozbieżności sylabus ↔ plan zajęć",
    "",
    ...(uwagi.length ? uwagi.map((u) => "- " + u) : ["Brak."]),
    "",
  ].join("\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2);
  const k = JSON.parse(fs.readFileSync(a.find((x) => x.endsWith(".json") && x.includes("kierunki")), "utf8"));
  const syl = JSON.parse(fs.readFileSync(path.join(ROOT, k.sylabus.plik), "utf8"));
  const plan = a.includes("--plan") ? JSON.parse(fs.readFileSync(a[a.indexOf("--plan") + 1], "utf8")) : null;
  const sem = a.includes("--sem") ? +a[a.indexOf("--sem") + 1] : 1;
  process.stdout.write(raport(k, syl, plan, sem));
}
