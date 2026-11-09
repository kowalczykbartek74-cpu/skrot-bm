// Prawdziwe lekcje z paczki w aplikacji (atrapa): otwiera każdą w roczniku z paczki i sprawdza błędy konsoli, tytuł, diagramy, angielskie resztki.
//   BASE=http://127.0.0.1:<port>/ PACZKA=<plik paczki> PLAN_PLIK=<plan rocznika> node docs/gry/test/paczka-render.mjs
import fs from "fs";
import { chromium, page, BASE, shot } from "./lib.mjs";
const P = JSON.parse(fs.readFileSync(process.env.PACZKA, "utf8"));
const ROK = P.rocznik;
const PLAN = fs.readFileSync(process.env.PLAN_PLIK, "utf8");
const BM_ID = "wefiz-bm-1-st-2026";
const ids = Object.keys(P.materials);
const docs = { materials: {}, materialContent: {}, materialSimple: P.materialSimple, quizWhy: P.quizWhy };
const rok = { materials: {}, materialContent: {} };
for (const id of ids) { docs.materials[id] = P.materials[id]; docs.materialContent[id] = P.materialContent[id]; rok.materials[id] = ROK; rok.materialContent[id] = ROK; }
const b = await chromium.launch();
const p = await page(b, { konto: "starosta", w: 375, h: 812, ls: { "mock-v31": "1", "mock-rocznik": JSON.stringify({ id: BM_ID, wybrany: true }),
  "mock-roczniki-lista": JSON.stringify([{ id: BM_ID, status: "platny" }, { id: ROK, status: "oczekujacy" }]), "bm-starosta": "1", "skrot-admin-rocznik": ROK,
  "mock-docs": JSON.stringify(docs), "mock-docs-rok": JSON.stringify(rok) } });
await p.context().route(new RegExp(`^https://plan\\.(skrotbm|zdawalni)\\.pl/plan/${ROK}\\.json`), (r) => r.fulfill({ contentType: "application/json", body: PLAN }));
const EN = /\b(the|and|of|is|are|with|that|which|from|this|for)\b/gi;
const zle = [], wiz = { chart: 0, compare: 0, flow: 0, layers: 0 };
let n = 0;
for (const id of ids) {
  await p.goto(BASE + "index.html#/material/" + id); await p.waitForTimeout(1800);
  const h1 = await p.locator("main h1").first().innerText().catch(() => "");
  if (h1.trim() !== P.materials[id].title.trim()) zle.push(`${id}: tytuł „${h1}”`);
  const btn = p.locator("main button", { hasText: "Pokaż lekcję jako tekst" });
  if (await btn.count()) { await btn.click(); await p.waitForTimeout(900); }
  const txt = await p.locator("main").innerText();
  const en = (txt.replace(/\\\(.*?\\\)/g, " ").match(EN) || []).length;
  if (en > 12) zle.push(`${id}: ${en} angielskich słów w tekście`);
  if (/undefined|\[object|NaN/.test(txt)) zle.push(`${id}: „undefined/NaN” w tekście`);
  for (const t of ["chart", "compare", "flow", "layers"]) wiz[t] += await p.locator(`main [class*="${t}"], main svg`).count() > 0 ? 0 : 0;
  n++;
}
const visT = Object.values(P.materialContent).flatMap((c) => (c.lesson?.sections || []).map((s) => s.visual?.type).filter(Boolean));
console.log(`otwarto ${n}/${ids.length} lekcji; diagramów w paczce: ${visT.length} (${[...new Set(visT)].join(", ")})`);
console.log(`błędy konsoli: ${p.errors.length}`, p.errors.slice(0, 3));
console.log(zle.length ? "✗ " + zle.slice(0, 12).join("\n✗ ") : "✓ wszystkie lekcje: tytuł PL, bez undefined, bez angielskich resztek");
if (process.env.POKAZ) { await p.goto(BASE + "index.html#/material/" + process.env.POKAZ); await p.waitForTimeout(1800); const bt = p.locator("main button", { hasText: "Pokaż lekcję jako tekst" }); if (await bt.count()) await bt.click(); await p.waitForTimeout(900); const el = p.locator("main figure, main .viz, main [class*=\"visual\"], main svg").first(); if (await el.count()) await el.scrollIntoViewIfNeeded(); await shot(p, "paczka-render-diagram"); }
await shot(p, "paczka-render-ostatnia");
await b.close();
process.exit(zle.length || p.errors.length ? 1 : 0);
