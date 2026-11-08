// Treści w rytmie kolokwiów (optymalizacja nr 7): który przedmiot generować teraz, a który może poczekać.
// Termin przedmiotu = najbliższy termin z bazy (eksport terminów, jeśli podany), a bez niego: przedmiot z egzaminem → początek sesji,
// zaliczenie → koniec zajęć w semestrze (kalendarz roku z planu zajęć). „Generuj do” = termin − zapas (domyślnie 21 dni:
// lekcje mają być na stronie trzy tygodnie przed kolokwium). Status = lekcje gotowe w scratch/<prefiks>/paczki.
// Koszt API rozkłada się na tygodnie, a uwagi z pierwszych przedmiotów poprawiają kolejne.
//
//   node scripts/harmonogram-tresci.mjs                                     wszystkie roczniki PL z kierunki/ (bez BM)
//   node scripts/harmonogram-tresci.mjs kierunki/<id>.json [--plan-bm ../plan-bm] [--terminy terminy.json] [--zapas 21] [--sem 1]
//   … --teraz 2026-11-08 (testy)   … --json
// terminy.json: lista { rocznik_id, subjectId, date, title } (np. eksport kolekcji deadlines z Panelu kierunków); bez pliku – z sylabusa.
// Wynik: scratch/harmonogram.md i na ekranie „Do zrobienia w tym tygodniu”. Bez sieci, bez modelu, nic nie wysyła.
// Test: node --test tests/harmonogram.test.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const J = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const dzien = (d) => d.toISOString().slice(0, 10);
const dodaj = (s, n) => dzien(new Date(Date.parse(s + "T12:00:00Z") + n * 864e5));

// kalendarz roku (plan.json → kalendarz): początek sesji i ostatni dzień zajęć
export function datySemestru(kal) {
  const sesja = (kal?.okresy || []).find((o) => /^Sesja egzaminacyjna/i.test(o.opis || ""))?.od || null;
  const tyg = kal?.tygodnie || [];
  const koniecZajec = tyg.length ? tyg[tyg.length - 1][1] : null;
  return { sesja, koniecZajec };
}

export function zSylabusa(syl, sem) {
  const out = {};
  for (const c of syl?.courses || []) {
    const f = (c.forms || []).filter((x) => x.s === sem);
    if (f.length) out[c.id] = { egzamin: f.some((x) => x.c === "e"), pl: c.pl || c.id };
  }
  return out;
}

export function statusPaczek(dir) {
  const out = {};
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    let d;
    try { d = J(path.join(dir, f)); } catch { continue; }
    const s = (out[d.subjectId] = out[d.subjectId] || { gotowe: 0, doZrobienia: 0 });
    if (d.k2 === "do zrobienia") s.doZrobienia++; else s.gotowe++;
  }
  return out;
}

// nazwy przedmiotów z planu zajęć (gdy sylabusa jeszcze nie ma): slug → nazwa z planu
export function nazwyZPlanu(plan) {
  const out = {};
  const slug = (t) => String(t).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  for (const g of Object.values(plan?.groups || {})) for (const w of ["odd", "even"]) for (const e of g[w] || []) if (e?.pl && e.k !== "X") out[slug(e.pl)] = out[slug(e.pl)] || e.pl;
  return out;
}

export function harmonogram({ k, syl, kal, terminy = [], paczki = {}, teraz, zapas = 21, sem = 1, nazwy = {} }) {
  const dzis = dzien(teraz);
  const { sesja, koniecZajec } = datySemestru(kal);
  const zSyl = zSylabusa(syl, sem);
  const wiersze = [];
  for (const pid of Object.keys(k.przedmioty || {})) {
    const s = zSyl[pid] || { egzamin: (k.egzaminyBezKarty || []).includes(pid), pl: nazwy[pid] || pid.charAt(0).toUpperCase() + pid.slice(1).replace(/-/g, " ") };
    const t = terminy.filter((x) => x.rocznik_id === k.id && x.subjectId === pid && x.date >= dzis).sort((a, b) => a.date.localeCompare(b.date))[0];
    const termin = t?.date || (s.egzamin ? sesja : koniecZajec);
    const skad = t ? `termin w bazie: ${t.title || "kolokwium"}` : s.egzamin ? "początek sesji" : "koniec zajęć";
    const generujDo = termin ? dodaj(termin, -zapas) : null;
    const p = paczki[pid] || { gotowe: 0, doZrobienia: 0 };
    const stan = p.gotowe && !p.doZrobienia ? "gotowe" : p.gotowe ? "w trakcie" : "brak";
    const pilne = stan !== "gotowe" && !!generujDo && generujDo <= dodaj(dzis, 7);
    wiersze.push({ rocznik: k.id, prefiks: k.prefiks, przedmiot: pid, pl: s.pl, egzamin: s.egzamin, termin, skad, generujDo, stan, pilne,
      spoznione: stan !== "gotowe" && !!generujDo && generujDo < dzis, gotowe: p.gotowe, doZrobienia: p.doZrobienia });
  }
  return wiersze.sort((a, b) => (a.generujDo || "9").localeCompare(b.generujDo || "9") || (b.egzamin - a.egzamin) || a.przedmiot.localeCompare(b.przedmiot));
}

export function markdown(w, teraz) {
  const pil = w.filter((x) => x.pilne);
  const lin = [`# Harmonogram treści (${dzien(teraz)})`, "",
    pil.length ? `**Do zrobienia w tym tygodniu (${pil.length}):** ` + pil.map((x) => `${x.prefiks}/${x.przedmiot}${x.spoznione ? " (spóźnione)" : ""}`).join(", ") : "W tym tygodniu nic pilnego.", "",
    "| Generuj do | Rocznik | Przedmiot | Zaliczenie | Termin | Skąd termin | Lekcje |", "|---|---|---|---|---|---|---|"];
  for (const x of w) lin.push(`| ${x.generujDo || "—"}${x.pilne ? " ⚠" : ""} | ${x.prefiks} | ${x.pl} | ${x.egzamin ? "egzamin" : "zaliczenie"} | ${x.termin || "—"} | ${x.skad} | ${x.stan}${x.gotowe || x.doZrobienia ? ` (${x.gotowe} gotowe, ${x.doZrobienia} do zrobienia)` : ""} |`);
  lin.push("", "Polecenie dla przedmiotów z tego tygodnia (bez pilota, gdy wzorzec jest zatwierdzony):",
    ...[...new Set(pil.map((x) => x.prefiks))].map((pf) => `- \`python3 scripts/lekcje-z-bm.py kierunki/${pil.find((x) => x.prefiks === pf).rocznik}.json k2 --na-sucho --wszystkie --przedmioty ${pil.filter((x) => x.prefiks === pf).map((x) => x.przedmiot).join(",")}\``));
  return lin.join("\n") + "\n";
}

function main(argv) {
  const opt = (n, d) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
  const planBm = path.resolve(ROOT, opt("--plan-bm", "../plan-bm"));
  const teraz = opt("--teraz") ? new Date(opt("--teraz") + "T12:00:00Z") : new Date();
  const pliki = argv.filter((a) => a.endsWith(".json") && a !== opt("--terminy"));
  const lista = (pliki.length ? pliki : fs.readdirSync(path.join(ROOT, "kierunki")).filter((f) => f.endsWith(".json")).map((f) => "kierunki/" + f))
    .map((f) => J(path.resolve(ROOT, f))).filter((k) => k.jezykZajec === "pl");
  const terminy = opt("--terminy") ? J(path.resolve(opt("--terminy"))) : [];
  const wszystko = [];
  for (const k of lista) {
    const sp = path.join(ROOT, k.sylabus?.plik || "-");
    const pp = path.join(planBm, k.plan?.plik || "-");
    const plan = fs.existsSync(pp) ? J(pp) : null;
    wszystko.push(...harmonogram({ k, syl: fs.existsSync(sp) ? J(sp) : null, kal: plan?.kalendarz || null, nazwy: nazwyZPlanu(plan), terminy,
      paczki: statusPaczek(path.join(ROOT, "scratch", k.prefiks, "paczki")), teraz, zapas: +opt("--zapas", 21), sem: +opt("--sem", 1) }));
  }
  wszystko.sort((a, b) => (a.generujDo || "9").localeCompare(b.generujDo || "9"));
  if (argv.includes("--json")) return console.log(JSON.stringify(wszystko, null, 1));
  const md = markdown(wszystko, teraz);
  fs.mkdirSync(path.join(ROOT, "scratch"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "scratch", "harmonogram.md"), md);
  console.log(md);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
