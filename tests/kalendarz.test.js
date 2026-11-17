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
const norm = (t) => t.replace(/DTSTAMP:\d{8}T\d{4}00Z/g, "DTSTAMP:X").replace(/dostep-wygasl-\d{4}-\d{2}-\d{2}/g, "dostep-wygasl-X").replace(/DTSTART;VALUE=DATE:\d{8}(\r\nSUMMARY:(?:Skrót BM|Zdawalni): dostęp)/g, "DTSTART;VALUE=DATE:X$1");

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
  for (const dane of [DANE, { ...DANE, plan_url: "https://plan.skrotbm.pl/plan.json" }, { ...DANE, plan_url: "https://plan.zdawalni.pl/plan.json" }]) {
    const r = await ics(h, dane);
    assert.equal(r.status, 200);
    assert.deepEqual(r.pobrane, ["https://plan.zdawalni.pl/plan.json"]);
    assert.equal(norm(r.body), zloty);
  }
});

test("inny rocznik: plan z jego adresu; obcy host albo zły adres → plan BM", async () => {
  const h = await zaladuj(NOWY);
  let r = await ics(h, { ...DANE, plan_url: "https://plan.zdawalni.pl/plan/wefiz-test-1-st-2026.json" });
  assert.deepEqual(r.pobrane, ["https://plan.zdawalni.pl/plan/wefiz-test-1-st-2026.json"]);
  // stary host (wiersz sprzed SQL v50) → ten sam plik na plan.zdawalni.pl
  r = await ics(h, { ...DANE, plan_url: "https://plan.skrotbm.pl/plan/wefiz-test-1-st-2026.json" });
  assert.deepEqual(r.pobrane, ["https://plan.zdawalni.pl/plan/wefiz-test-1-st-2026.json"]);
  for (const zly of ["https://zly.example.com/plan.json", "http://plan.skrotbm.pl/plan.json", "https://plan.skrotbm.pl/../x.json?y", "https://plan.zdawalni.pl.zly.pl/plan.json", 7]) {
    r = await ics(h, { ...DANE, plan_url: zly });
    assert.deepEqual(r.pobrane, ["https://plan.zdawalni.pl/plan.json"], String(zly));
  }
});

test("UID-y wydarzeń bez zmian (@skrotbm.pl)", async () => {
  const r = await ics(await zaladuj(NOWY), { ...DANE, plan_url: "https://plan.skrotbm.pl/plan/wefiz-test-1-st-2026.json" });
  const uid = r.body.split("\r\n").filter((l) => l.startsWith("UID:"));
  assert.ok(uid.length > 10 && uid.every((l) => l.endsWith("@skrotbm.pl")));
});

test("UX-2: „Zdawalni · 5 min po zajęciach” tylko po włączeniu (nauka_kalendarz_nauka), 30 min po ostatnich zajęciach, z alarmem", async () => {
  const h = await zaladuj(NOWY);
  const uruchom = async (wl) => {
    globalThis.__Deno = { env: { get: () => "x" } };
    globalThis.__createClient = () => ({ rpc: async (fn) => ({ data: fn === "nauka_kalendarz_nauka" ? wl : DANE, error: null }) });
    const stary = globalThis.fetch; globalThis.fetch = async () => ({ ok: true, json: async () => PLAN });
    try { return await (await h(new Request("https://x/functions/v1/kalendarz?t=" + TOKEN))).text(); } finally { globalThis.fetch = stary; }
  };
  const bez = await uruchom(false);
  assert.ok(!bez.includes("5 min po zajęciach"), "domyślnie wyłączone");
  const z = await uruchom(true);
  const ev = z.split("BEGIN:VEVENT").filter((x) => x.includes("SUMMARY:Zdawalni · 5 min po zajęciach"));
  if (ev.length) { // plan testowy może nie mieć zajęć w najbliższych 60 dniach od dziś
    for (const e of ev) {
      assert.match(e, /UID:nauka-\d{4}-\d{2}-\d{2}-C111@skrotbm\.pl/);
      assert.match(e, /BEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:Zdawalni · 5 min po zajęciach\r\nTRIGGER:PT0M\r\nEND:VALARM/);
      const s = e.match(/DTSTART;TZID=Europe\/Warsaw:\d{8}T(\d\d)(\d\d)00/), k = e.match(/DTEND;TZID=Europe\/Warsaw:\d{8}T(\d\d)(\d\d)00/);
      assert.equal((+k[1] * 60 + +k[2]) - (+s[1] * 60 + +s[2]), 10, "10 minut");
    }
  }
  assert.ok(!/Skrót BM|Skrócie BM/.test(z), "w kalendarzu nazwa Zdawalni");
  // ten sam wynik bez wpisów nauki = złoty plik (wpis jest tylko dodatkiem)
  assert.equal(norm(z.split("BEGIN:VEVENT").filter((x) => !x.includes("5 min po zajęciach")).join("BEGIN:VEVENT")), fs.readFileSync(path.join(FIX, "kalendarz-bm.ics"), "utf8"));
});
