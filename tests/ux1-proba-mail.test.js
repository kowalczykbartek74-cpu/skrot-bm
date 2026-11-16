// Pętla UX-1, etap 3 (K3): funkcja Edge „przypomnienia” wysyła rodzaj „proba” przed innymi i wlicza go do limitu dnia (ten sam log).
const test = require("node:test");
const assert = require("node:assert");
const P = require("../przypomnienia.js");

function atrapa(o = {}) {
  const db = {
    dzien: "2026-11-18",
    proby: o.proby ?? [{ user_id: "u1", email: "student@x.pl", do_kiedy: "2026-11-19T16:00:00Z", jezyk: "pl" }],
    osoby: o.osoby ?? [{ user_id: "u1", email: "student@x.pl", token: "t".repeat(36), jezyk: "pl", co: { terminy: true, powtorki: true, zadanie: true },
      stan: P.stanZ({ od: "2026-11-18", terminy: [], pow: [3], rew: [], zadanie: true }), dni_nauki: ["2026-11-16"], ostatni: "2026-11-16", historia: [], dl: {} }],
    log: [], maile: [], przypomniano: [], limit: o.limit ?? 60, bezV53: !!o.bezV53,
  };
  const rpc = async (fn, a = {}) => {
    const dzis = db.log.filter((l) => l.dzien === db.dzien).length, zostalo = Math.max(0, db.limit - dzis);
    if (fn === "nauka_proba_kandydaci") {
      if (db.bezV53) return { data: null, error: { message: "Could not find the function public.nauka_proba_kandydaci" } };
      return { data: { ok: true, dzien: db.dzien, zostalo, osoby: db.proby.filter((p) => !db.przypomniano.includes(p.user_id) && !db.log.some((l) => l.user_id === p.user_id && l.dzien === db.dzien)).slice(0, zostalo) }, error: null };
    }
    if (fn === "nauka_proba_przypomniano") { db.przypomniano.push(a.p_user); return { data: true, error: null }; }
    if (fn === "nauka_przypomnienia_kandydaci") return { data: { ok: true, dzien: db.dzien, osoby: db.osoby.filter((p) => !db.log.some((l) => l.user_id === p.user_id && l.dzien === db.dzien)).slice(0, zostalo) }, error: null };
    if (fn === "nauka_przypomnienia_log_dodaj") {
      if (db.log.some((l) => l.user_id === a.p_user && l.dzien === a.p_dzien)) return { data: null, error: null };
      const id = "log-" + (db.log.length + 1); db.log.push({ id, user_id: a.p_user, dzien: a.p_dzien, rodzaj: a.p_rodzaj }); return { data: id, error: null };
    }
    if (fn === "nauka_przypomnienia_log_usun") { db.log = db.log.filter((l) => l.id !== a.p_id); return { data: null, error: null }; }
    return { data: null, error: { message: "nie ma " + fn } };
  };
  const fetchMock = async (url, init) => { db.maile.push(JSON.parse(init.body)); return { ok: true, status: 200 }; };
  const env = { RESEND_API_KEY: "re_test", RESEND_FROM: "Zdawalni <przypomnienia@zdawalni.pl>", PRZYPOMNIENIA_CRON: "s".repeat(40), SUPABASE_URL: "https://abc.supabase.co" };
  return { db, deps: { rpc, fetch: fetchMock, env: (k) => env[k], P } };
}
const cron = () => new Request("https://abc.supabase.co/functions/v1/przypomnienia", { method: "POST", headers: { "x-cron-secret": "s".repeat(40) }, body: "{}" });

test("mail „proba”: temat z godziną końca (Warszawa), 199 zł, link do wyboru planu, bez wypisywania; EN", () => {
  const m = P.mailProba({ lang: "pl", doKiedy: "2026-11-19T16:00:00Z", teraz: "2026-11-18T16:00:00Z", site: "https://zdawalni.pl", id: "log-1" });
  assert.equal(m.subject, "Jutro o 17:00 kończy się Twoja próba w Zdawalni");
  assert.match(m.text, /Masz jeszcze ok\. 24 godz\. pełnego dostępu\. Do końca 2\. semestru: 199 zł jednorazowo \(BLIK\), bez odnawiania\./);
  assert.match(m.text, /Wybieram plan: https:\/\/zdawalni\.pl\/\?plan=1&pz=log-1/);
  assert.match(m.text, /Postępy zostaną na koncie, nawet jeśli nie kupisz\./);
  assert.doesNotMatch(m.html, /List-Unsubscribe|Wyłącz przypomnienia/);
  const e = P.mailProba({ lang: "en", doKiedy: "2026-11-19T16:00:00Z", teraz: "2026-11-18T16:00:00Z", site: "https://zdawalni.pl" });
  assert.equal(e.subject, "Your Zdawalni trial ends tomorrow at 17:00");
  assert.match(e.text, /You still have about 24 hours of full access\. Until the end of semester 2: 199 zł one-off \(BLIK\), no renewal\./);
  assert.match(e.text, /Your progress stays on your account even if you don’t buy\./);
});

test("funkcja Edge: „proba” przed innymi; ta sama osoba nie dostaje tego dnia drugiego maila; znacznik wysłania", async () => {
  const { obsluz } = await import("../supabase/functions/przypomnienia/obsluga.ts");
  const { db, deps } = atrapa();
  const r = await (await obsluz(cron(), deps)).json();
  assert.equal(r.ok, true); assert.equal(r.proba, 1);
  assert.equal(db.maile.length, 1, "jeden mail na osobę dziennie");
  assert.equal(db.maile[0].subject, "Jutro o 17:00 kończy się Twoja próba w Zdawalni");
  assert.deepEqual(db.log.map((l) => l.rodzaj), ["proba"]);
  assert.deepEqual(db.przypomniano, ["u1"]);
  const r2 = await (await obsluz(cron(), deps)).json();
  assert.equal(r2.sent, 0, "drugie uruchomienie: nic"); assert.equal(db.maile.length, 1);
});

test("funkcja Edge: „proba” wlicza się do limit_dzien (zwykłe przypomnienia dostają mniej miejsca)", async () => {
  const { obsluz } = await import("../supabase/functions/przypomnienia/obsluga.ts");
  const { db, deps } = atrapa({ limit: 1, osoby: [{ user_id: "u2", email: "inny@x.pl", token: "u".repeat(36), jezyk: "pl", co: { terminy: true, powtorki: true, zadanie: true },
    stan: P.stanZ({ od: "2026-11-18", terminy: [], pow: [3], rew: [], zadanie: true }), dni_nauki: ["2026-11-16"], ostatni: "2026-11-16", historia: [], dl: {} }] });
  const r = await (await obsluz(cron(), deps)).json();
  assert.equal(r.proba, 1); assert.equal(db.maile.length, 1, "limit 1: wyszedł tylko mail o próbie");
  assert.deepEqual(db.log.map((l) => l.rodzaj), ["proba"]);
});

test("funkcja Edge bez v53 w bazie: zwykłe przypomnienia działają jak dotąd", async () => {
  const { obsluz } = await import("../supabase/functions/przypomnienia/obsluga.ts");
  const { db, deps } = atrapa({ bezV53: true });
  const r = await (await obsluz(cron(), deps)).json();
  assert.equal(r.ok, true); assert.equal(r.proba, 0);
  assert.ok(db.log.every((l) => l.rodzaj !== "proba"));
});
