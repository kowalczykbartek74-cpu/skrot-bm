// Funkcja Edge „kalendarz” w Node (atrapa Deno, bazy i fetch): plan rocznika z bazy (SQL v46 plan_url), a .ics BM bajt w bajt
// taki sam jak przed zmianą. Złoty plik tests/fixtures/kalendarz-bm.ics powstał ze starej wersji (main 9bfe1ad):
//   ZLOTY=<ścieżka do starego index.ts> node --test tests/kalendarz.test.js   (nadpisuje plik)
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const FIX = path.join(__dirname, "fixtures");
const PLAN = JSON.parse(fs.readFileSync(path.join(FIX, "plan-bm.json"), "utf8"));
const TOKEN = "a".repeat(48);
const DANE = {
  platny: true, grupa: "C111", podgrupa: "A",
  terminy: [
    { id: "dl1", title: "Kolokwium z mikroekonomii", type: "kolokwium", subjectId: "mikroekonomia", date: "2026-12-10", time: "10:00" },
    { id: "dl2", title: "Projekt", type: "projekt", subjectId: "", date: "2027-01-15", approx: true },
  ],
  moje: [{ id: "m1", title: "Konsultacje", date: "2026-11-20", time: "12:00" }],
  zaliczenia: [{ k: "makroekonomia-W", date: "2027-02-03" }],
  plan: [{ date: "2026-11-21", sid: "makroekonomia", t: "Powtórka" }],
};
// stały znacznik czasu w wyniku (DTSTAMP i data „dostęp wygasł” zależą od chwili uruchomienia)
const norm = (t) => t.replace(/DTSTAMP:\d{8}T\d{4}00Z/g, "DTSTAMP:X").replace(/dostep-wygasl-\d{4}-\d{2}-\d{2}/g, "dostep-wygasl-X").replace(/DTSTART;VALUE=DATE:\d{8}(\r\nSUMMARY:Skrót BM: dostęp)/g, "DTSTART;VALUE=DATE:X$1");

// Wczytuje index.ts jako moduł: bez importów, Deno.serve → export, createClient i Deno z atrapy.
async function zaladuj(plik) {
  let src = fs.readFileSync(plik, "utf8").replace(/^import .*$/gm, "");
  src = "const Deno = { env: { get: (k) => globalThis.__Deno.env.get(k) } }; const createClient = (...a) => globalThis.__createClient(...a);\n" + src.replace("Deno.serve(", "export const handler = (");
  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "kal-")), "index.ts");
  fs.writeFileSync(tmp, src);
  return (await import(tmp)).handler;
}
async function ics(handler, dane) {
  const pobrane = [];
  globalThis.__Deno = { env: { get: () => "x" } };
  globalThis.__createClient = () => ({ rpc: async () => ({ data: dane, error: null }) });
  const stary = globalThis.fetch;
  globalThis.fetch = async (u) => { pobrane.push(String(u)); return { ok: true, json: async () => PLAN }; };
  try { const r = await handler(new Request("https://x/functions/v1/kalendarz?t=" + TOKEN)); return { status: r.status, body: await r.text(), pobrane }; }
  finally { globalThis.fetch = stary; }
}
const NOWY = path.join(__dirname, "..", "supabase", "functions", "kalendarz", "index.ts");

test("złoty plik (tylko z ZLOTY=…)", { skip: !process.env.ZLOTY }, async () => {
  const r = await ics(await zaladuj(process.env.ZLOTY), DANE);
  fs.writeFileSync(path.join(FIX, "kalendarz-bm.ics"), norm(r.body));
});

test("BM: .ics bajt w bajt jak przed zmianą (bez plan_url i z plan_url BM)", async () => {
  const zloty = fs.readFileSync(path.join(FIX, "kalendarz-bm.ics"), "utf8");
  assert.ok(zloty.includes("BEGIN:VEVENT") && zloty.includes("@skrotbm.pl"), "złoty plik ma zajęcia");
  const h = await zaladuj(NOWY);
  for (const dane of [DANE, { ...DANE, plan_url: "https://plan.skrotbm.pl/plan.json" }]) {
    const r = await ics(h, dane);
    assert.equal(r.status, 200);
    assert.deepEqual(r.pobrane, ["https://plan.skrotbm.pl/plan.json"]);
    assert.equal(norm(r.body), zloty);
  }
});

test("inny rocznik: plan z jego adresu; obcy host albo zły adres → plan BM", async () => {
  const h = await zaladuj(NOWY);
  let r = await ics(h, { ...DANE, plan_url: "https://plan.skrotbm.pl/plan/wefiz-test-1-st-2026.json" });
  assert.deepEqual(r.pobrane, ["https://plan.skrotbm.pl/plan/wefiz-test-1-st-2026.json"]);
  for (const zly of ["https://zly.example.com/plan.json", "http://plan.skrotbm.pl/plan.json", "https://plan.skrotbm.pl/../x.json?y", 7]) {
    r = await ics(h, { ...DANE, plan_url: zly });
    assert.deepEqual(r.pobrane, ["https://plan.skrotbm.pl/plan.json"], String(zly));
  }
});

test("UID-y wydarzeń bez zmian (@skrotbm.pl)", async () => {
  const r = await ics(await zaladuj(NOWY), { ...DANE, plan_url: "https://plan.skrotbm.pl/plan/wefiz-test-1-st-2026.json" });
  const uid = r.body.split("\r\n").filter((l) => l.startsWith("UID:"));
  assert.ok(uid.length > 10 && uid.every((l) => l.endsWith("@skrotbm.pl")));
});
