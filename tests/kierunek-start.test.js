// scripts/kierunek-start.mjs: Etapy A–C jednym poleceniem, pilot tylko raz, raport z samymi wątpliwościami.
// node --test tests/kierunek-start.test.js
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const S = () => import("../scripts/kierunek-start.mjs");
const PLAN_BM = path.join(ROOT, "..", "plan-bm");
const mapa = (koszyki, tymczasowa = false) => [{ przedmiot: "p", ...(tymczasowa ? { tymczasowa } : {}), tematy: koszyki.map(([k, pewny], i) => ({ temat: "t" + i, koszyk: k, zrodlo: [], pewny })) }];

test("pilot tylko bez zatwierdzonego wzorca; z wzorcem K2 i K3 od razu całość z próbką", async () => {
  const { trybTresci } = await S();
  const m = mapa([["K2", true], ["K3", true]]);
  assert.deepStrictEqual(trybTresci({ k2: null, k3: null }, m), { pilot: ["k2", "k3"], probka: false });
  assert.deepStrictEqual(trybTresci({ k2: { rocznik: "z" }, k3: null }, m), { pilot: ["k3"], probka: false });
  assert.deepStrictEqual(trybTresci({ k2: { rocznik: "z" }, k3: { rocznik: "z" } }, m), { pilot: [], probka: true });
  assert.deepStrictEqual(trybTresci({ k2: null, k3: null }, mapa([["K1", true]])), { pilot: [], probka: true }, "same kopie z banku: bez pilota");
  const W = JSON.parse(fs.readFileSync(path.join(ROOT, "kierunki/wspolne/wzorce.json"), "utf8"));
  assert.ok("k2" in W && "k3" in W);
});

test("mapa: liczby koszyków i tylko wiersze niepewne do przejrzenia", async () => {
  const { liczMape } = await S();
  const M = liczMape(mapa([["K1", true], ["K2", false], ["K2", true], ["K3", false]]));
  assert.deepStrictEqual([M.K1, M.K2, M.K3, M.razem, M.doPrzejrzenia.length, M.tymczasowa], [1, 2, 1, 4, 2, false]);
  assert.strictEqual(liczMape(mapa([["K2", false]], true)).tymczasowa, true);
  assert.strictEqual(liczMape(null).razem, 0);
});

test("raport: sekcje Gotowe / Do sprawdzenia / 3 kroki, HTML bez wstrzykniętego kodu", async () => {
  const { raportMd, raportHtml } = await S();
  const R = { id: "wefiz-x-1-st-2026", prefiks: "x26", nazwa: "Iks <b>", data: "2026-11-08", uwagiPliku: [],
    A: { ok: true, uwagi: [], opis: "ok" }, B: { ok: false, uwagi: ["brak sylabusa"], opis: "czeka" }, C: { ok: false, opis: "czeka", doPrzejrzenia: [], razem: 0 },
    koszt: null, tresci: { pilot: [], probka: true }, mapa: true, harmonogram: [], kroki: ["a", "b", "c"] };
  const md = raportMd(R);
  assert.match(md, /## Gotowe[\s\S]*## Do sprawdzenia \(tylko to\)\n\n- sylabus: brak sylabusa[\s\S]*## Twoje 3 kroki\n\n1\. a\n2\. b\n3\. c/);
  assert.match(md, /bez pilota/);
  assert.match(raportMd({ ...R, mapa: false }), /decyzja po mapie tematów/);
  const h = raportHtml(md);
  assert.ok(!h.includes("<b>\n") && h.includes("Iks &lt;b&gt;"), "nazwy są escapowane");
  assert.match(h, /<ol><li>a<\/li><li>b<\/li><li>c<\/li><\/ol>/);
});

test("Zarządzanie jednym poleceniem: A–C bez zmian w repo, raport w scratch, nic do API", { skip: !fs.existsSync(path.join(PLAN_BM, "kierunki")) && "brak plan-bm obok" }, () => {
  const przed = fs.readFileSync(path.join(ROOT, "roczniki-dane.js"), "utf8");
  const r = spawnSync(process.execPath, ["scripts/kierunek-start.mjs", "kierunki/wefiz-zarz-1-st-2026.json", "--plan-bm", PLAN_BM], { cwd: ROOT, encoding: "utf8", env: { PATH: process.env.PATH } });
  assert.strictEqual(r.status, 0, r.stderr);
  assert.strictEqual(fs.readFileSync(path.join(ROOT, "roczniki-dane.js"), "utf8"), przed, "drugi przebieg nic nie zmienia w danych");
  const md = fs.readFileSync(path.join(ROOT, "scratch/zarz26/raport.md"), "utf8");
  assert.match(md, /✓ \*\*A\. Rocznik i plan:\*\*.*C151, C152, C153/);
  assert.match(md, /✓ \*\*B\. Sylabus:\*\* sylabus-zarz\.json \(z repo\), 106 kart; egzaminy w semestrze 1: Matematyka, Nauka o przedsiębiorstwie/);
  assert.match(md, /C\. Mapa tematów:\*\* K1 \d+ · K2 \d+ · K3 \d+/);
  assert.match(md, /Nic nie poszło do API ani do bazy/);
  assert.ok(fs.existsSync(path.join(ROOT, "scratch/zarz26/raport.html")));
});

test("próbka: losuje gotowe lekcje (to samo ziarno = ta sama próbka), pomija K1 bez tłumaczenia", async () => {
  // na kopii repo w katalogu tymczasowym, żeby nie dotykać scratch prawdziwego kierunku
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "probka-"));
  for (const d of ["scripts", "kierunki"]) fs.cpSync(path.join(ROOT, d), path.join(tmp, d), { recursive: true });
  for (const f of ["sylabus-zarz.json", "sylabus.json"]) fs.copyFileSync(path.join(ROOT, f), path.join(tmp, f));
  const PA = path.join(tmp, "scratch/zarz26/paczki");
  fs.mkdirSync(PA, { recursive: true });
  const lekcja = (id, k2) => JSON.stringify({ id, subjectId: "podstawy-zarzadzania", rocznik_id: "wefiz-zarz-1-st-2026", zrodlo: "bm:x", title: "Tytuł " + id, sylRef: "wykład, temat 1", k2, content: { lesson: { type: "theory" } } });
  fs.writeFileSync(path.join(PA, "zarz26-a.json"), lekcja("zarz26-a", "gotowe"));
  fs.writeFileSync(path.join(PA, "zarz26-b.json"), lekcja("zarz26-b", "gotowe"));
  fs.writeFileSync(path.join(PA, "zarz26-c.json"), lekcja("zarz26-c", "do zrobienia"));
  const uruchom = (z) => spawnSync(process.execPath, ["scripts/kierunek-start.mjs", "kierunki/wefiz-zarz-1-st-2026.json", "--probka", "--ile", "1", "--ziarno", z], { cwd: tmp, encoding: "utf8" });
  const a = uruchom("x"), b = uruchom("x");
  // minimalna lekcja nie przechodzi kontroli treści, więc paczka się nie składa; wybór i kopia w probka/ są już zrobione
  const wyb = (r) => ((r.stdout + r.stderr).match(/Próbka: (zarz26-[ab]\.json)/) || [])[1];
  assert.ok(/zarz26-[ab]\.json/.test(wyb(a) || ""), a.stdout + a.stderr);
  assert.strictEqual(wyb(a), wyb(b), "to samo ziarno → ta sama lekcja");
  assert.ok(!fs.readdirSync(path.join(tmp, "scratch/zarz26/probka")).includes("zarz26-c.json"));
});
