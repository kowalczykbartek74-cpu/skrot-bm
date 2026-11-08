// Jedno polecenie na przeglądarkowe testy wszystkich roczników (optymalizacja nr 10): dla każdego rocznika z rocznik.js
// i roczniki-dane.js (poza BM) uruchamia przejście ekranów (fundament-etap7.mjs) i wgranie paczki (paczka-lekcji.mjs),
// a dla BM porównanie tekstu ekranów z wersją sprzed zmiany (gdy podasz BASE_PRZED). Nowy kierunek = testy bez dopisywania.
//   BASE=http://127.0.0.1:8765/ PLAN_BM=../plan-bm [BASE_PRZED=http://127.0.0.1:8766/] node docs/gry/test/wszystkie-roczniki.mjs
// Plan rocznika bierze z <PLAN_BM>/plan/<id>.json (atrapa blokuje plan.skrotbm.pl); rocznik bez planu jest pominięty z uwagą.
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { createRequire } from "module";

const DIR = new URL("./", import.meta.url).pathname;
const ROOT = path.join(DIR, "../../..");
const R = createRequire(import.meta.url)("../../../rocznik.js");
const PLAN_BM = path.resolve(ROOT, process.env.PLAN_BM || "../plan-bm");
const BASE = process.env.BASE || "http://127.0.0.1:8765/";
const wyniki = [];
const uruchom = (skrypt, env) => {
  const r = spawnSync(process.execPath, [path.join(DIR, skrypt)], { cwd: ROOT, encoding: "utf8", env: { ...process.env, BASE, ...env }, maxBuffer: 64 * 1024 * 1024 });
  const ost = (r.stdout || "").trim().split("\n").pop() || (r.stderr || "").trim().split("\n").pop();
  return { ok: r.status === 0, ost, out: r.stdout + r.stderr };
};
for (const id of Object.keys(R.ROCZNIKI)) {
  if (id === R.DOMYSLNY) continue;
  const plik = path.join(ROOT, "kierunki", id + ".json"), plan = path.join(PLAN_BM, "plan", id + ".json");
  if (!fs.existsSync(plan)) { wyniki.push(["–", id, "brak planu w " + path.relative(ROOT, plan) + " (update-plan.mjs --kierunek)"]); continue; }
  const a = uruchom("fundament-etap7.mjs", { ROCZNIK_PLIK: plik, PLAN_PLIK: plan });
  wyniki.push([a.ok ? "✓" : "✗", id + " ekrany", a.ost]);
  const b = uruchom("paczka-lekcji.mjs", { ROCZNIK: id, PLAN_PLIK: plan });
  wyniki.push([b.ok ? "✓" : "✗", id + " paczka lekcji", b.ost]);
  if (!a.ok || !b.ok) console.log(a.ok ? b.out : a.out);
}
const t = uruchom("roczniki-baza.mjs", {});
wyniki.push([t.ok ? "✓" : "✗", "Panel kierunków → Baza", t.ost]);
if (process.env.BASE_PRZED) {
  const p1 = uruchom("fundament-bm-tekst.mjs", { BASE: process.env.BASE_PRZED, OUT_JSON: "/tmp/wr-przed.json" });
  const p2 = uruchom("fundament-bm-tekst.mjs", { OUT_JSON: "/tmp/wr-po.json" });
  const c = spawnSync(process.execPath, [path.join(DIR, "fundament-bm-tekst.mjs"), "--porownaj", "/tmp/wr-przed.json", "/tmp/wr-po.json"], { cwd: ROOT, encoding: "utf8" });
  wyniki.push([p1.ok && p2.ok && c.status === 0 ? "✓" : "✗", "BM: tekst ekranów przed = po", (c.stdout || "").trim().split("\n").pop()]);
} else wyniki.push(["–", "BM przed/po", "pominięte (podaj BASE_PRZED z wersją sprzed zmiany)"]);
for (const w of wyniki) console.log(w.join(" "));
const zle = wyniki.filter((w) => w[0] === "✗").length;
console.log(zle ? `✗ ${zle} z ${wyniki.length}` : `✓ wszystkie roczniki (${wyniki.filter((w) => w[0] === "✓").length} sprawdzeń)`);
process.exit(zle ? 1 : 0);
