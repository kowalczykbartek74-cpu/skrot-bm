// Plik kierunku bez ręcznego wypełniania (optymalizacja nr 4): kierunki/<rocznik>.json z tego, co już jest.
// Źródła (wszystko lokalnie, bez sieci):
//   - konfiguracja planu z repo plan-bm (kierunki/<id>.json: nazwa w systemie uczelni, rok, grupy, sekcja DOS) – robi ją
//     plan-bm/scripts/wefiz-wszystkie.mjs dla całego wydziału;
//   - plan zajęć z plan-bm (plan/<id>.json) → lista przedmiotów (slugi jak w aplikacji);
//   - kierunki/wspolne/kierunki-nazwy.json (nazwa EN, język zajęć), kierunki/wspolne/przedmioty-ogolne.json (przedmiot ogólny
//     = bank PL, odpowiednik w BM) i inne pliki kierunków (czy przedmiot ogólny już ma treści w innym roczniku → K1).
// Przypisanie przedmiotów do BM i banku to tylko punkt startowy: koszyki temat po temacie robi mapa (Etap C).
//
//   node scripts/kierunek-nowy.mjs wefiz-log-1-st-2026 --plan-bm ../plan-bm             zapisuje kierunki/wefiz-log-1-st-2026.json
//   node scripts/kierunek-nowy.mjs "Logistyka" --plan-bm ../plan-bm [--rok 1] [--stopien 1]
//   … --na-sucho (tylko wypisuje)   … --nadpisz (zastępuje istniejący plik; bez tego skrypt nie rusza gotowego pliku)
// Potem: node scripts/kierunek-start.mjs kierunki/<id>.json (Etapy A–C jednym poleceniem).
// Test: node --test tests/kierunek-nowy.test.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { slug, sprawdzPlik } from "./kierunek.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const czytajJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const blad = (m) => { throw new Error(m); };
export const SYLABUS_BAZA = "https://efz.usz.edu.pl/wp-content/uploads/";
const STOPIEN_PDF = { 1: "I", 2: "II", 0: "jednolite" };
// Zajęcia, których nie uczymy (szkolenia, wpisy ręczne): nie są przedmiotami kierunku
const POMIJANE = /^(szkolenie|odrabianie|bhp|wf|wychowanie-fizyczne|lektorat|jezyk-obcy|seminarium-dyplomowe)/;

// „Finanse i Rachunkowość” → „finanse_i_rachunkowosc” (tak wydział nazywa pliki sylabusów i planów studiów)
export const slugPdf = (nazwa) => slug(nazwa.replace(/\s*inż\.?$/i, " inzynierskie")).replace(/-/g, "_");
// Kierunek po angielsku: wersja angielska sylabusa ma dopisek „_ang” (jak BM: sylabus_business_management_…_2026_2027_ang.pdf).
export function adresySylabusa(nazwa, stopien, nabor, tryb = "st", jezyk = "pl") {
  const lata = `${nabor}_${nabor + 1}`, kat = `${String(nabor).slice(2)}-${String(nabor + 1).slice(2)}`;
  const studia = (tryb === "st" ? "studia_stacjonarne_" : "studia_niestacjonarne_") + STOPIEN_PDF[stopien] + "_stopnia_" + lata;
  return {
    pdf: `${SYLABUS_BAZA}sylabusy/${kat}/sylabus_${slugPdf(nazwa)}_${studia}${jezyk === "en" ? "_ang" : ""}.pdf`,
    planStudiow: `${SYLABUS_BAZA}plany_studiow/${nabor}-${String(nabor + 1).slice(2)}/plany_studiow_${slugPdf(nazwa)}_${studia}.pdf`,
  };
}

// slug przedmiotu → przedmiot ogólny (bank PL) i przedmioty BM; najpierw dokładny alias, potem alias jako początek nazwy
export function ogolny(id, O) {
  for (const [og, v] of Object.entries(O.ogolne)) if (v.aliasy.includes(id)) return { og, bm: v.bm.slice(), pewne: true };
  // po początku nazwy tylko aliasy z co najmniej dwóch słów albo „rodzina” (matematyka-finansowa → matematyka); „zarzadzanie-…” nie
  for (const [og, v] of Object.entries(O.ogolne)) if (v.aliasy.some((a) => (a.includes("-") || v.rodzina) && id.startsWith(a + "-"))) return { og, bm: v.bm.slice(), pewne: false };
  return null;
}
// role przedmiotów w aplikacji (rocznik.js → przedmioty): kazusy, zadania z liczeniem, „Jeszcze prościej”
const ROLE_WZOR = {
  prawne: /prawo|prawa|prawne|wlasnosci-intelektualnej/,
  rachunkowe: /matemat|statyst|finans|rachunk|ekonometr|ekonomi|arkusz|inwestyc|analiza|rynk|kalkulac/,
  jeszczeProsciej: /matemat|statyst|rachunk|ekonometr/,
};
export const role = (ids) => Object.fromEntries(Object.entries(ROLE_WZOR).map(([r, re]) => [r, ids.filter((id) => re.test(id))]));

export function przedmiotyZPlanu(plan) {
  const m = new Map();
  for (const g of Object.values(plan?.groups || {})) for (const w of ["odd", "even"]) for (const e of g[w] || []) {
    if (!e || e.k === "X" || !e.pl) continue;
    const id = slug(e.pl);
    if (!POMIJANE.test(id)) m.set(id, e.pl);
  }
  return [...m.keys()].sort();
}

// czy przedmiot ogólny ma już (albo będzie miał) treści PL w innym roczniku → K1 z banku
export function wBanku(og, inne) {
  return inne.some((k) => k.jezykZajec === "pl" && Object.entries(k.przedmioty || {}).some(([id, v]) => id === og || (v.bank || []).includes(og)));
}

// bmIds: id przedmiotów BM (sylabus.json). Ten sam slug co w BM (plan: „MACROECONOMICS (MAKROEKONOMIA)” → makroekonomia) = ten sam
// przedmiot BM wprost, przed aliasami. Kierunek po angielsku: przedmiot z BM to K1 (kopia lekcji BM, bez tłumaczenia), bank PL nie liczy się.
// bankPL: foldery banku zdawalni-tresci (przedmiot ogólny z lekcjami PL) → K1 od razu, bez czekania na inny kierunek
export function zbuduj({ cfg, plan, nazwy, O, inne = [], bmIds = new Set(), bankPL = new Set() }) {
  if (!cfg?.id || !cfg.kierunek?.kod) blad("Brak konfiguracji planu (plan-bm/kierunki/<id>.json): najpierw plan-bm/scripts/wefiz-wszystkie.mjs");
  const n = nazwy.kierunki[cfg.kierunek.pl] || {};
  const ids = przedmiotyZPlanu(plan);
  const uwagi = [];
  if (!n.en) uwagi.push(`brak nazwy EN dla „${cfg.kierunek.pl}” w kierunki/wspolne/kierunki-nazwy.json (wpisana polska)`);
  if (!ids.length) uwagi.push("plan zajęć jeszcze pusty: lista przedmiotów pusta (uruchom update-plan.mjs w plan-bm i ten skrypt z --nadpisz)");
  const przedmioty = {};
  const en = (n.jezykZajec || "pl") === "en";
  for (const id of ids) {
    const o = ogolny(id, O);
    // bank: folder w zdawalni-tresci/bank — pole „bank” wpisu, gdy inne niż klucz (np. podstawy-ekonomii → ekonomia-mikroekonomia)
    const bank = o && !en ? [O.ogolne[o.og].bank || o.og] : [], bm = bmIds.has(id) ? [id] : o ? o.bm : [];
    if (o && !o.pewne) uwagi.push(`„${id}” przypisany do „${o.og}” po początku nazwy – sprawdź`);
    if (!o && !bm.length) uwagi.push(`„${id}” bez przedmiotu ogólnego (nowy w banku: K3; dopisz alias w przedmioty-ogolne.json, jeśli to ten sam przedmiot co gdzie indziej)`);
    const k1 = bank.length && (bankPL.has(bank[0]) || wBanku(bank[0], inne) || wBanku(o.og, inne));
    przedmioty[id] = { bank, bm, koszyk: en ? (bm.length ? "K1" : "K3") : k1 ? "K1" : bm.length ? "K2" : "K3" };
  }
  const nab = cfg.nabor, jezyk = n.jezykZajec || "pl";
  const k = {
    id: cfg.id,
    kierunek_id: cfg.id.replace(/-\d{4}$/, ""),
    prefiks: cfg.kod,
    wydzial: cfg.wydzial?.kod || "WEFiZ",
    kierunek: { kod: cfg.kierunek.kod, pl: cfg.kierunek.pl, en: n.en || cfg.kierunek.en || cfg.kierunek.pl },
    stopien: cfg.stopien, tryb: cfg.tryb || "st", nabor: nab, jezykZajec: jezyk,
    plan: { systemNazwa: cfg.system?.nazwa, rok: cfg.system?.rok, plik: cfg.plik },
    grupy: (cfg.grupy || []).slice(),
    sylabus: { ...adresySylabusa(cfg.kierunek.pl, cfg.stopien, nab, cfg.tryb || "st", jezyk), plik: `sylabus-${cfg.kod}.json`, zgadniety: true },
    teams: false,
    ...(cfg.dos ? { dos: cfg.dos } : {}),
    status: "oczekujacy",
    przedmioty,
    role: role(ids),
  };
  sprawdzPlik(k);
  return { k, uwagi };
}

function znajdzKonfiguracje(planBm, cel, { rok = 1, stopien = 1 } = {}) {
  const dir = path.join(planBm, "kierunki");
  const pliki = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".json")) : [];
  if (/^[a-z]+-[a-z0-9]+-[012]-(st|nst)-20\d\d$/.test(cel)) {
    const f = path.join(dir, cel + ".json");
    if (!fs.existsSync(f)) blad(`Brak ${path.relative(ROOT, f)}: najpierw w plan-bm: node scripts/wefiz-wszystkie.mjs`);
    return czytajJson(f);
  }
  const trafy = pliki.map((f) => czytajJson(path.join(dir, f))).filter((c) => c.kierunek?.pl?.toLowerCase() === cel.toLowerCase() && c.rok === rok && c.stopien === stopien);
  if (trafy.length !== 1) blad(`„${cel}” (${stopien}. stopień, ${rok}. rok): ${trafy.length} konfiguracji w plan-bm/kierunki zamiast 1`);
  return trafy[0];
}

async function main(argv) {
  const cel = argv.find((a) => !a.startsWith("--") && !/^\d+$/.test(a) && argv[argv.indexOf(a) - 1] !== "--plan-bm");
  if (!cel) blad("Użycie: node scripts/kierunek-nowy.mjs <id rocznika | nazwa kierunku> --plan-bm ../plan-bm [--rok 1] [--stopien 1] [--na-sucho] [--nadpisz]");
  const opt = (n, d) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
  const planBm = path.resolve(ROOT, opt("--plan-bm", "../plan-bm"));
  const cfg = znajdzKonfiguracje(planBm, cel, { rok: +opt("--rok", 1), stopien: +opt("--stopien", 1) });
  const pp = path.join(planBm, cfg.plik);
  const plan = fs.existsSync(pp) ? czytajJson(pp) : null;
  const inne = fs.readdirSync(path.join(ROOT, "kierunki")).filter((f) => f.endsWith(".json")).map((f) => czytajJson(path.join(ROOT, "kierunki", f))).filter((x) => x.id !== cfg.id);
  const bmIds = new Set(czytajJson(path.join(ROOT, "sylabus.json")).courses.map((c) => c.id));
  const bankDir = path.resolve(ROOT, opt("--bank", "../zdawalni-tresci/bank"));
  const bankPL = new Set(fs.existsSync(bankDir) ? fs.readdirSync(bankDir).filter((f) => fs.statSync(path.join(bankDir, f)).isDirectory()) : []);
  const { k, uwagi } = zbuduj({ cfg, plan, nazwy: czytajJson(path.join(ROOT, "kierunki/wspolne/kierunki-nazwy.json")), O: czytajJson(path.join(ROOT, "kierunki/wspolne/przedmioty-ogolne.json")), inne, bmIds, bankPL });
  const out = path.join(ROOT, "kierunki", k.id + ".json");
  const tekst = JSON.stringify(k, null, 2) + "\n";
  console.log(uwagi.length ? "Do sprawdzenia:\n- " + uwagi.join("\n- ") : "Bez uwag.");
  if (argv.includes("--na-sucho")) return console.log("\n" + tekst);
  if (fs.existsSync(out) && !argv.includes("--nadpisz")) blad(`${path.relative(ROOT, out)} już jest (popraw go ręcznie albo uruchom z --nadpisz)`);
  fs.writeFileSync(out, tekst);
  console.log(`Zapisano ${path.relative(ROOT, out)} (${Object.keys(k.przedmioty).length} przedmiotów). Dalej: node scripts/kierunek-start.mjs ${path.relative(ROOT, out)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((e) => { console.error("BŁĄD:", e.message); process.exit(1); });
}
