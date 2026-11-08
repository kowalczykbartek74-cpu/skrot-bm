// Nowy kierunek jednym poleceniem (optymalizacje nr 5, 6 i 7): Etapy A–C po kolei i jeden raport do jednego przeglądu.
//
//   node scripts/kierunek-start.mjs --nowy wefiz-log-1-st-2026 [--plan-bm ../plan-bm]   plik kierunku z kierunek-nowy.mjs, potem A–C
//   node scripts/kierunek-start.mjs kierunki/<id>.json [--plan-bm ../plan-bm]            A–C dla gotowego pliku
//   node scripts/kierunek-start.mjs kierunki/<id>.json --probka [--ile 1]                próbka gotowych lekcji do obejrzenia (zamiast pilota)
//   node scripts/kierunek-start.mjs --wzorzec k2|k3 <id rocznika> <id lekcji,…>          zapis zatwierdzonego wzorca (po pilocie)
//
// Kroki (każdy to istniejący skrypt; nic nie idzie do API ani do bazy, wszystko „na sucho”):
//   A  kierunek.mjs (roczniki-dane.js, konfiguracja planu w plan-bm) + --sprawdz (plan ↔ plik kierunku)
//   B  sylabus: z repo, z scratch/sylabusy/<prefiks>.json (sylabusy-hurt.py) albo z scratch/<prefiks>/sylabus.pdf → sylabus-<prefiks>.json;
//      raport semestru (sylabus-raport.mjs)
//   C  mapa tematów: z modelu, jeśli już jest; inaczej koszt mapy z --na-sucho i mapa tymczasowa --bez-api; liczba wierszy „do przejrzenia”
//   +  koszt treści (koszt-tresci.py), pilot albo próbka (kierunki/wspolne/wzorce.json), harmonogram przedmiotów (harmonogram-tresci.mjs)
// Wynik: scratch/<prefiks>/raport.md i raport.html: co jest gotowe, co sprawdzić (tylko wątpliwe rzeczy) i 3 kroki dla Bartka.
// Test: node --test tests/kierunek-start.test.js
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const J = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const WZORCE = path.join(ROOT, "kierunki", "wspolne", "wzorce.json");
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function uruchom(cmd, args, { env } = {}) {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: "utf8", env: { ...process.env, ...(env || {}) }, maxBuffer: 64 * 1024 * 1024 });
  return { kod: r.status, out: (r.stdout || "").trim(), err: (r.stderr || "").trim() };
}
const node = (skrypt, ...a) => uruchom(process.execPath, [path.join("scripts", skrypt), ...a]);
const py = (skrypt, ...a) => uruchom("python3", [path.join("scripts", skrypt), ...a]);

export function wzorce(p = WZORCE) {
  try { return J(p); } catch { return { k2: null, k3: null }; }
}
// pilot tylko przy pierwszym kierunku: gdy wzorzec K2/K3 jest zatwierdzony, kolejne kierunki idą od razu z próbką do obejrzenia
export function trybTresci(W, mapa) {
  const potrzeba = { k2: (mapa || []).some((m) => m.tematy.some((t) => t.koszyk === "K2")), k3: (mapa || []).some((m) => m.tematy.some((t) => t.koszyk === "K3")) };
  const pilot = Object.entries(potrzeba).filter(([k, v]) => v && !W[k]).map(([k]) => k);
  return { pilot, probka: !pilot.length };
}
export function liczMape(mapa) {
  const t = (mapa || []).flatMap((m) => m.tematy.map((x) => ({ ...x, przedmiot: m.przedmiot, tymczasowa: !!m.tymczasowa })));
  return {
    tymczasowa: (mapa || []).some((m) => m.tymczasowa),
    K1: t.filter((x) => x.koszyk === "K1").length, K2: t.filter((x) => x.koszyk === "K2").length, K3: t.filter((x) => x.koszyk === "K3").length,
    razem: t.length,
    doPrzejrzenia: t.filter((x) => !x.pewny),
  };
}

export function raportMd(R) {
  const L = [];
  const ok = (b) => (b ? "✓" : "✗");
  L.push(`# ${R.nazwa} (${R.id}): start kierunku`, "", `Wygenerowane: \`node scripts/kierunek-start.mjs kierunki/${R.id}.json\` (${R.data}). Nic nie poszło do API ani do bazy.`, "");
  L.push("## Gotowe", "");
  L.push(`- ${ok(R.A.ok)} **A. Rocznik i plan:** ${R.A.opis}`);
  L.push(`- ${ok(R.B.ok)} **B. Sylabus:** ${R.B.opis}`);
  L.push(`- ${ok(R.C.ok)} **C. Mapa tematów:** ${R.C.opis}`);
  if (R.koszt) L.push(`- **Koszt treści (szacunek, Batch):** ~${R.koszt.razem.toFixed(2)} $ za wszystko, ~${R.koszt.egzaminy.toFixed(2)} $ za przedmioty z egzaminem${R.koszt.tymczasowa ? " (z mapy tymczasowej: dokładny po mapie z modelu)" : ""}.`);
  L.push(`- **Treści:** ${!R.mapa ? "pilot albo od razu całość: decyzja po mapie tematów." : R.tresci.pilot.length ? `pierwszy raz bez zatwierdzonego wzorca (${R.tresci.pilot.join(", ").toUpperCase()}): **pilot** 2–3 lekcji, potem \`--wzorzec\`.` : "wzorzec zatwierdzony: **bez pilota**, cała mapa naraz, potem próbka 1 lekcji (`--probka`)."}`);
  L.push("", "## Do sprawdzenia (tylko to)", "");
  const spr = [...R.A.uwagi.map((u) => `plan ↔ plik: ${u}`), ...R.uwagiPliku.map((u) => `plik kierunku: ${u}`), ...R.B.uwagi.map((u) => `sylabus: ${u}`)];
  if (R.C.doPrzejrzenia?.length) spr.push(`mapa: ${R.C.doPrzejrzenia.length} z ${R.C.razem} tematów do przejrzenia (filtr „Pokaż tylko do przejrzenia” w scratch/${R.prefiks}/mapa.html)`);
  L.push(...(spr.length ? spr.map((s) => `- ${s}`) : ["- nic: wszystkie kroki bez uwag."]));
  if (R.harmonogram?.length) {
    L.push("", "## Kolejność przedmiotów (harmonogram)", "", "| Generuj do | Przedmiot | Zaliczenie | Termin |", "|---|---|---|---|");
    for (const h of R.harmonogram) L.push(`| ${h.generujDo || "—"} | ${h.pl} | ${h.egzamin ? "egzamin" : "zaliczenie"} | ${h.termin || "—"} (${h.skad}) |`);
  }
  L.push("", "## Twoje 3 kroki", "", ...R.kroki.map((k, i) => `${i + 1}. ${k}`), "");
  return L.join("\n");
}
export function raportHtml(md) {
  // prosta zamiana markdown → HTML (nagłówki, listy, tabele, kod, pogrubienie); plik do otwarcia w przeglądarce, poza gitem
  const inl = (s) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
  const out = [];
  let tab = null, lista = null;
  const zamknij = () => { if (tab) { out.push("<table>" + tab.join("") + "</table>"); tab = null; } if (lista) { out.push(`<${lista.t}>` + lista.w.join("") + `</${lista.t}>`); lista = null; } };
  for (const l of md.split("\n")) {
    if (/^\|/.test(l)) { if (/^\|[-| ]+\|$/.test(l)) continue; tab = tab || []; const c = l.slice(1, -1).split("|").map((x) => x.trim()); tab.push("<tr>" + c.map((x) => `<td>${inl(x)}</td>`).join("") + "</tr>"); continue; }
    const m = /^(- |\d+\. )(.*)$/.exec(l);
    if (m) { const t = m[1] === "- " ? "ul" : "ol"; if (!lista || lista.t !== t) { zamknij(); lista = { t, w: [] }; } lista.w.push(`<li>${inl(m[2])}</li>`); continue; }
    zamknij();
    if (/^# /.test(l)) out.push(`<h1>${inl(l.slice(2))}</h1>`);
    else if (/^## /.test(l)) out.push(`<h2>${inl(l.slice(3))}</h2>`);
    else if (l.trim()) out.push(`<p>${inl(l)}</p>`);
  }
  zamknij();
  return `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Start kierunku</title>
<style>body{font:15px/1.5 system-ui,sans-serif;margin:16px auto;max-width:900px;padding:0 12px;color:#16231b}h1{font-size:22px}h2{font-size:18px;margin-top:24px}
table{border-collapse:collapse;width:100%}td{border-bottom:1px solid #dfe8e2;padding:6px 8px}tr:first-child td{background:#eef6f0;font-weight:600}code{background:#f2f5f3;padding:1px 4px;border-radius:4px}</style>
</head><body>${out.join("\n")}</body></html>`;
}

function start(plik, planBm) {
  const k0 = J(path.resolve(ROOT, plik));
  const P = k0.prefiks, OUT = path.join(ROOT, "scratch", P);
  fs.mkdirSync(OUT, { recursive: true });
  const R = { id: k0.id, prefiks: P, nazwa: k0.kierunek.pl, data: new Date().toISOString().slice(0, 10), uwagiPliku: [] };
  const rel = path.relative(ROOT, path.resolve(ROOT, plik));
  // A
  const a1 = node("kierunek.mjs", rel, "--plan-bm", planBm);
  if (a1.kod) throw new Error("kierunek.mjs: " + (a1.err || a1.out));
  const a2 = node("kierunek.mjs", rel, "--sprawdz", "--plan-bm", planBm);
  const uwagiA = a2.kod ? (a2.out.split("Rozbieżności:")[1] || "").split("\n").map((x) => x.replace(/^- /, "").trim()).filter(Boolean) : [];
  const planJest = fs.existsSync(path.join(planBm, k0.plan.plik));
  R.A = { ok: !a2.kod, uwagi: uwagiA, opis: `wpis w roczniki-dane.js, konfiguracja planu w plan-bm/kierunki/${k0.id}.json, plan ${planJest ? "pobrany" : "jeszcze niepobrany (update-plan.mjs --kierunek)"}; grupy ${k0.grupy.join(", ")}.` };
  // B
  const sylRepo = path.join(ROOT, k0.sylabus?.plik || `sylabus-${P}.json`);
  const sylHurt = path.join(ROOT, "scratch", "sylabusy", P + ".json"), sylPdf = path.join(OUT, "sylabus.pdf");
  let skad = null;
  if (fs.existsSync(sylRepo)) skad = "z repo";
  else if (fs.existsSync(sylHurt)) { fs.copyFileSync(sylHurt, sylRepo); skad = "z sylabusy-hurt.py"; }
  else if (fs.existsSync(sylPdf)) {
    const tmp = fs.mkdtempSync(path.join(OUT, "syl-"));
    const p1 = spawnSync("python3", [path.join(ROOT, "scripts/sylabus-parse.py"), sylPdf], { cwd: tmp, encoding: "utf8" });
    const p2 = p1.status ? p1 : spawnSync("python3", [path.join(ROOT, "scripts/sylabus-build.py"), sylRepo, "--kierunek", path.resolve(ROOT, plik)], { cwd: tmp, encoding: "utf8" });
    fs.rmSync(tmp, { recursive: true, force: true });
    if (!p2.status && fs.existsSync(sylRepo)) skad = "z PDF-u (scratch)";
  }
  if (skad && skad !== "z repo") node("kierunek.mjs", rel, "--plan-bm", planBm);   // wpis dostaje plik sylabusa
  const k = J(path.resolve(ROOT, plik));
  const uwagiB = [];
  let egz = [];
  if (skad) {
    const syl = J(sylRepo);
    const wSyl = new Set(syl.courses.map((c) => c.id));
    for (const pid of Object.keys(k.przedmioty || {})) if (!wSyl.has(pid) && !(k.egzaminyBezKarty || []).includes(pid)) uwagiB.push(`„${pid}” z planu nie ma karty w sylabusie`);
    egz = syl.courses.filter((c) => k.przedmioty?.[c.id] && (c.forms || []).some((f) => f.s === 1 && f.c === "e")).map((c) => c.pl);
    if (planJest) {
      const r = node("sylabus-raport.mjs", rel, "--plan", path.join(planBm, k.plan.plik));
      if (!r.kod) { fs.mkdirSync(path.join(ROOT, "docs", "kierunki"), { recursive: true }); fs.writeFileSync(path.join(ROOT, "docs", "kierunki", `${P}-sylabus.md`), r.out + "\n"); }
    }
    if (k.sylabus?.zgadniety) R.uwagiPliku.push("adres sylabusa ze wzoru wydziału: otwórz go raz i usuń pole „zgadniety” z pliku kierunku");
  }
  R.B = skad ? { ok: !uwagiB.length, uwagi: uwagiB, opis: `${path.basename(sylRepo)} (${skad}), ${J(sylRepo).courses.length} kart; egzaminy w semestrze 1: ${egz.join(", ") || "brak"}.` }
    : { ok: false, uwagi: ["brak sylabusa: `python3 scripts/sylabusy-hurt.py --tylko " + P + "` (potrzebna sieć) albo PDF do scratch/" + P + "/sylabus.pdf"], opis: "czeka na PDF." };
  // C
  const mp = path.join(OUT, "mapa.json");
  let mapa = fs.existsSync(mp) ? J(mp) : null, kosztMapy = null;
  if (skad && (!mapa || mapa.some((m) => m.tymczasowa))) {
    const s = py("mapa-tematow.py", rel, "--na-sucho");
    kosztMapy = (s.out.match(/~([\d.]+) \$/) || [])[1] || null;
    py("mapa-tematow.py", rel, "--bez-api");
    mapa = fs.existsSync(mp) ? J(mp) : null;
  }
  const M = liczMape(mapa);
  R.C = !mapa ? { ok: false, opis: "czeka na sylabus.", doPrzejrzenia: [], razem: 0 }
    : { ok: !M.tymczasowa, razem: M.razem, doPrzejrzenia: M.doPrzejrzenia,
        opis: `K1 ${M.K1} · K2 ${M.K2} · K3 ${M.K3} (${M.razem} tematów)` + (M.tymczasowa ? `; **tymczasowa** (bez API). Mapa z modelu: \`python3 scripts/mapa-tematow.py ${rel} --wyslij\`, potem \`--odbierz\`${kosztMapy ? ` (~${kosztMapy} $)` : ""}.` : `; ${M.razem - M.doPrzejrzenia.length} pewnych, ${M.doPrzejrzenia.length} do przejrzenia.`) };
  // koszt, tryb treści, harmonogram
  if (mapa) {
    const kw = py("koszt-tresci.py", rel, "--json"), ke = py("koszt-tresci.py", rel, "--json", "--tylko-egzaminy");
    try { const a = JSON.parse(kw.out)[0], b = JSON.parse(ke.out)[0]; R.koszt = { razem: a.usd, egzaminy: b.usd, tymczasowa: a.tymczasowa }; } catch { R.koszt = null; }
  }
  R.tresci = trybTresci(wzorce(), mapa);
  R.mapa = !!mapa;
  const h = node("harmonogram-tresci.mjs", rel, "--plan-bm", planBm, "--json");
  try { R.harmonogram = JSON.parse(h.out); } catch { R.harmonogram = []; }
  // 3 kroki dla Bartka
  const kwota = R.koszt ? `~${R.koszt.razem.toFixed(2)} $` : "kwota w raporcie po mapie";
  R.kroki = [
    !mapa ? `Sylabus: \`python3 scripts/sylabusy-hurt.py --tylko ${P}\` (albo PDF do scratch/${P}/sylabus.pdf), potem to samo polecenie jeszcze raz.`
      : `Przejrzyj ten raport i mapę (scratch/${P}/mapa.html, „Pokaż tylko do przejrzenia”). Odpowiedz Claude Code: „ok” albo poprawki.`,
    M.tymczasowa || !mapa ? `Zgoda na mapę z modelu${kosztMapy ? ` (~${kosztMapy} $)` : ""} i na treści (${kwota}): „wysyłaj”.`
      : `Zgoda na treści (${kwota}): „wysyłaj”. ${R.tresci.pilot.length ? "Najpierw pilot 2–3 lekcji." : "Bez pilota; potem próbka 1 lekcji."}`,
    `Po wdrożeniu strony: Panel kierunków → Baza → „Dodaj do bazy” (${R.nazwa}), potem wczytanie paczek (Panel AI → Paczka lekcji, wiele plików naraz), na końcu „Zacznij sprzedaż”.`,
  ];
  const md = raportMd(R);
  fs.writeFileSync(path.join(OUT, "raport.md"), md);
  fs.writeFileSync(path.join(OUT, "raport.html"), raportHtml(md));
  return { R, md };
}

function probka(plik, ile, ziarno) {
  const k = J(path.resolve(ROOT, plik)), OUT = path.join(ROOT, "scratch", k.prefiks), PA = path.join(OUT, "paczki");
  const gotowe = fs.existsSync(PA) ? fs.readdirSync(PA).filter((f) => f.endsWith(".json")).filter((f) => J(path.join(PA, f)).k2 !== "do zrobienia").sort() : [];
  if (!gotowe.length) throw new Error(`Brak gotowych lekcji w scratch/${k.prefiks}/paczki (najpierw k2 --odbierz albo K3).`);
  // to samo ziarno = ta sama próbka (powtarzalnie); domyślnie dzień
  let x = [...String(ziarno)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const los = () => ((x = (x * 1103515245 + 12345) >>> 0) / 2 ** 32);
  const wybor = [...gotowe].sort(() => los() - 0.5).slice(0, ile);
  const D = path.join(OUT, "probka");
  fs.rmSync(D, { recursive: true, force: true });
  fs.mkdirSync(D, { recursive: true });
  for (const f of wybor) fs.copyFileSync(path.join(PA, f), path.join(D, f));
  const r = py("paczka-lekcji.py", path.relative(ROOT, path.resolve(ROOT, plik)), path.relative(ROOT, D), "--nazwa", "probka");
  return { wybor, paczka: r.kod ? null : path.join("scratch", k.prefiks, "paczka-probka.json"), blad: r.kod ? r.err || r.out : null };
}

async function main(argv) {
  const opt = (n, d) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
  const planBm = path.resolve(ROOT, opt("--plan-bm", "../plan-bm"));
  if (argv[0] === "--wzorzec") {
    const [, typ, rocznik, lekcje] = argv;
    if (!["k2", "k3"].includes(typ) || !rocznik || !lekcje) throw new Error("Użycie: --wzorzec k2|k3 <id rocznika> <id lekcji,…>");
    const W = wzorce();
    W[typ] = { rocznik, lekcje: lekcje.split(",").map((s) => s.trim()).filter(Boolean), zatwierdzono: new Date().toISOString().slice(0, 10) };
    fs.writeFileSync(WZORCE, JSON.stringify(W, null, 1) + "\n");
    return console.log(`Zapisano wzorzec ${typ.toUpperCase()} (${rocznik}): kolejne kierunki bez pilota.`);
  }
  let plik = argv.find((a) => a.endsWith(".json") && a !== opt("--plan-bm"));
  if (argv.includes("--nowy")) {
    const cel = opt("--nowy");
    const r = node("kierunek-nowy.mjs", cel, "--plan-bm", planBm);
    if (r.kod && !/już jest/.test(r.err)) throw new Error(r.err || r.out);
    console.log(r.out || r.err);
    plik = /^[a-z]+-[a-z0-9]+-[012]-(st|nst)-20\d\d$/.test(cel) ? `kierunki/${cel}.json` : (r.out.match(/Zapisano (kierunki\/\S+\.json)/) || [])[1];
    if (!plik) throw new Error("Nie wiem, który plik kierunku powstał: podaj id rocznika (np. wefiz-log-1-st-2026).");
  }
  if (!plik) throw new Error("Użycie: node scripts/kierunek-start.mjs kierunki/<id>.json | --nowy <id> [--plan-bm ../plan-bm] [--probka [--ile 1]]");
  if (argv.includes("--probka")) {
    const r = probka(plik, +opt("--ile", 1), opt("--ziarno", new Date().toISOString().slice(0, 10)));
    if (r.blad) throw new Error(`Próbka: ${r.wybor.join(", ")} (scratch/…/probka/), ale paczka się nie złożyła: ${r.blad}`);
    return console.log(`Próbka: ${r.wybor.join(", ")} → ${r.paczka}. Wczytaj w Panel AI → Paczka lekcji (Edytuję rocznik) i obejrzyj na telefonie.`);
  }
  const { md } = start(plik, planBm);
  console.log(md);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((e) => { console.error("BŁĄD:", e.message); process.exit(1); });
}
