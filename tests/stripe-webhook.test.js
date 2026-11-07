// Testy rdzenia funkcji Edge supabase/functions/stripe-webhook/obsluga.ts (rocznik w zakupie, SQL v45) z atrapą bazy
// i zdarzeń Stripe – bez Stripe i bez sieci. node --test tests/*.test.js
const test = require("node:test");
const assert = require("node:assert/strict");

const BM = "wefiz-bm-1-st-2026", T = "wefiz-test-1-st-2026";
const UID = "11111111-2222-4333-8444-555555555555";
const DZIS = new Date("2026-11-07T10:00:00Z");
const semesterEnd = () => "2027-07-11";

// Atrapa supabase-js: nauka_dostep z kluczem (email, rocznik_id) (v45) albo (email) (bez v45), nauka_roczniki, RPC, auth.
function baza({ v45 = true, dostep = [], roczniki = [{ id: BM, status: "platny" }, { id: T, status: "platny" }] } = {}) {
  const db = { dostep: dostep.map((r) => ({ ...r })), roczniki, rpc: [], users: { [UID]: { id: UID, email: "Ola@X.pl" } } };
  const tab = (name) => (name === "nauka_dostep" ? db.dostep : name === "nauka_roczniki" ? db.roczniki : []);
  db.from = (name) => {
    const st = { f: [], op: "select", row: null, opts: null, one: false };
    const rows = () => tab(name).filter((r) => st.f.every(([k, v, is]) => (is ? (r[k] ?? null) === v : r[k] === v)));
    const run = async () => {
      if (st.op === "select") { const x = rows(); return { data: st.one ? x[0] || null : x, error: null }; }
      if (st.op === "update") { rows().forEach((r) => Object.assign(r, st.row)); return { data: null, error: null }; }
      if (st.op === "upsert") {
        const keys = st.opts.onConflict.split(",");
        if (!v45 && keys.includes("rocznik_id")) return { data: null, error: { code: "42P10", message: "there is no unique or exclusion constraint matching the ON CONFLICT specification" } };
        const r = { ...st.row }; if (v45 && !r.rocznik_id) r.rocznik_id = BM;
        const cur = tab(name).find((x) => keys.every((k) => x[k] === r[k]));
        if (cur) Object.assign(cur, r); else tab(name).push(r);
        return { data: null, error: null };
      }
    };
    const q = {
      select() { return q; }, eq(k, v) { st.f.push([k, v]); return q; }, is(k, v) { st.f.push([k, v, true]); return q; },
      maybeSingle() { st.one = true; return q; },
      upsert(row, opts) { st.op = "upsert"; st.row = row; st.opts = opts; return q; },
      update(row) { st.op = "update"; st.row = row; return q; },
      then(a, b) { return run().then(a, b); },
    };
    return q;
  };
  db.rpcFn = db.rpc;
  const api = { from: db.from, rpc: async (fn, args) => { db.rpc.push([fn, args]); return { data: { ok: true }, error: null }; },
    auth: { admin: { getUserById: async (id) => ({ data: db.users[id] ? { user: db.users[id] } : null }) } } };
  return { db, api };
}
const sesja = (ref, extra = {}) => ({ type: "checkout.session.completed", data: { object: {
  id: "cs_" + Math.random().toString(36).slice(2), payment_status: "paid", mode: "payment", client_reference_id: ref,
  customer_details: { email: "ola@x.pl" }, amount_total: 19900, currency: "pln", payment_intent: "pi_1", ...extra } } });
const faktura = (sub, extra = {}) => ({ type: "invoice.paid", data: { object: { id: "in_1", subscription: sub, customer_email: "ola@x.pl", amount_paid: 3900,
  lines: { data: [{ period: { end: Date.parse("2026-12-07T00:00:00Z") / 1000 } }] }, ...extra } } });
const run = async (ev, b) => { const { obsluz } = await import("../supabase/functions/stripe-webhook/obsluga.ts"); return obsluz(ev, b.api, { today: DZIS, semesterEnd }); };
const wiersz = (b, rocznik) => b.db.dostep.find((r) => r.email === "ola@x.pl" && (r.rocznik_id || BM) === rocznik);

test("client_reference_id: 4 części, rocznik tylko w bezpiecznym formacie", async () => {
  const { czytajRef } = await import("../supabase/functions/stripe-webhook/obsluga.ts");
  assert.deepEqual(czytajRef(UID), { konto: UID, kod: "", zrodlo: null, rocznik: null });
  assert.deepEqual(czytajRef(`${UID}__KOD__plakat`), { konto: UID, kod: "KOD", zrodlo: "plakat", rocznik: null });
  assert.equal(czytajRef(`${UID}______${T}`).rocznik, T);
  assert.equal(czytajRef(`${UID}______Zły rocznik`).rocznik, null);
});

test("BM jak dotąd: plan 199 zł → wiersz BM do 11.07, polecenie i źródło wejścia", async () => {
  const b = baza();
  const r = await run(sesja(`${UID}__BARTEK__plakat`), b);
  assert.equal(r.status, 200);
  assert.equal(r.body.do_kiedy, "2027-07-11"); assert.equal(r.body.rocznik, BM); assert.equal(r.body.uwaga, undefined);
  const w = wiersz(b, BM);
  assert.equal(w.email, "ola@x.pl"); assert.equal(w.plan, "rok"); assert.equal(w.user_id, UID); assert.equal(w.zrodlo_wejscia, "plakat");
  assert.deepEqual(b.db.rpc[0][0], "nauka_polec_zapisz"); assert.equal(b.db.rpc[0][1].p_kod, "BARTEK");
});

test("zakup rocznika testowego nie rusza dostępu BM; ponowiony webhook nic nie zmienia", async () => {
  const b = baza({ dostep: [{ email: "ola@x.pl", rocznik_id: BM, do_kiedy: "2027-07-11", zrodlo: "stripe", plan: "rok", stripe_session: "cs_stare" }] });
  const ev = sesja(`${UID}______${T}`);
  const r = await run(ev, b);
  assert.equal(r.body.rocznik, T);
  assert.equal(b.db.dostep.length, 2);
  assert.equal(wiersz(b, T).do_kiedy, "2027-07-11");
  assert.equal(wiersz(b, BM).stripe_session, "cs_stare", "wiersz BM bez zmian");
  const r2 = await run(ev, b);
  assert.equal(r2.body.duplicate, ev.data.object.id); assert.equal(b.db.dostep.length, 2);
});

test("nieznany rocznik → BM z uwagą; rocznik bez statusu „platny” zostaje, z uwagą", async () => {
  let b = baza();
  let r = await run(sesja(`${UID}______nie-ma-1-st-2026`), b);
  assert.equal(r.body.rocznik, BM); assert.equal(r.body.uwaga, "nieznany_rocznik"); assert.ok(wiersz(b, BM));
  b = baza({ roczniki: [{ id: BM, status: "platny" }, { id: T, status: "oczekujacy" }] });
  r = await run(sesja(`${UID}______${T}`), b);
  assert.equal(r.body.rocznik, T); assert.equal(r.body.uwaga, "rocznik_nie_platny");
});

test("nigdy nie skraca opłaconego dostępu w tym samym roczniku", async () => {
  const b = baza({ dostep: [{ email: "ola@x.pl", rocznik_id: T, do_kiedy: "2027-09-30" }] });
  const r = await run(sesja(`${UID}______${T}`), b);
  assert.equal(r.body.do_kiedy, "2027-09-30");
});

test("subskrypcja rocznika testowego: start + faktura przedłużają wiersz tego rocznika, nie BM", async () => {
  const b = baza({ dostep: [{ email: "ola@x.pl", rocznik_id: BM, do_kiedy: "2026-11-20", zrodlo: "stripe-miesiac", stripe_subscription: "sub_bm" }] });
  let r = await run(sesja(`${UID}______${T}`, { mode: "subscription", subscription: "sub_t", amount_total: 3900 }), b);
  assert.equal(r.body.plan, "miesiac"); assert.equal(wiersz(b, T).stripe_subscription, "sub_t"); assert.equal(wiersz(b, T).do_kiedy, "2026-12-09");
  r = await run(faktura("sub_t", { lines: { data: [{ period: { end: Date.parse("2027-01-07T00:00:00Z") / 1000 } }] } }), b);
  assert.equal(r.body.rocznik, T); assert.equal(wiersz(b, T).do_kiedy, "2027-01-08");
  assert.equal(wiersz(b, BM).do_kiedy, "2026-11-20", "subskrypcja BM bez zmian");
  r = await run(faktura("sub_bm"), b);
  assert.equal(r.body.rocznik, BM); assert.equal(wiersz(b, BM).do_kiedy, "2026-12-08");
});

test("faktura przed zakupem: jeden wiersz osoby → ten rocznik; kilka → BM; żaden → BM", async () => {
  let b = baza({ dostep: [{ email: "ola@x.pl", rocznik_id: T, do_kiedy: "2026-11-10" }] });
  let r = await run(faktura("sub_nowa"), b);
  assert.equal(r.body.rocznik, T);
  b = baza({ dostep: [{ email: "ola@x.pl", rocznik_id: T, do_kiedy: "2026-11-10" }, { email: "ola@x.pl", rocznik_id: BM, do_kiedy: "2026-11-10" }] });
  r = await run(faktura("sub_nowa"), b);
  assert.equal(r.body.rocznik, BM);
  b = baza();
  r = await run(faktura("sub_nowa"), b);
  assert.equal(r.body.rocznik, BM); assert.equal(wiersz(b, BM).do_kiedy, "2026-12-08");
});

test("zwrot: tylko cofnięcie polecenia, dostęp bez zmian", async () => {
  const b = baza({ dostep: [{ email: "ola@x.pl", rocznik_id: T, do_kiedy: "2027-07-11" }] });
  const r = await run({ type: "charge.refunded", data: { object: { refunded: true, payment_intent: "pi_9" } } }, b);
  assert.equal(r.status, 200); assert.equal(b.db.rpc[0][0], "nauka_polec_cofnij"); assert.equal(wiersz(b, T).do_kiedy, "2027-07-11");
});

test("baza bez v45: zapis po starym kluczu e-mail (nic się nie blokuje)", async () => {
  const b = baza({ v45: false });
  const r = await run(sesja(`${UID}______${T}`), b);
  assert.equal(r.status, 200);
  assert.equal(b.db.dostep.length, 1); assert.equal(b.db.dostep[0].rocznik_id, undefined, "bez kolumny rocznika w zapisie");
});
