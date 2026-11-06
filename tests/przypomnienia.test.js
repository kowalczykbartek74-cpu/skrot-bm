// Testy przypomnienia.js (port matura-app tests/unit/notifications.test.ts, reminder-voice.test.ts, reminder-email.test.ts)
// i rdzenia funkcji Edge supabase/functions/przypomnienia/obsluga.ts z atrapą bazy i Resend (bez prawdziwych maili).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const P = require("../przypomnienia.js");

const TODAY = "2026-11-04"; // środa
const ctx = (over = {}) => ({
  today: TODAY, lang: "pl", co: { terminy: true, powtorki: true, zadanie: true },
  studiedToday: false, lastStudyDay: "2026-11-03", history: [],
  terminy: [], powtorki: 0, rewanze: 0, zadanie: true, ...over,
});
const sent = (day, helped = false) => ({ day, helped });
const ter = (d, extra = {}) => ({ d, n: "Mikroekonomia", ne: "Microeconomics", r: "K", sid: "mikro", ...extra });

test("nic, gdy dziś już była nauka albo nie ma nic do przypomnienia", () => {
  assert.equal(P.wybierz(ctx({ studiedToday: true, rewanze: 3 })), null);
  assert.equal(P.wybierz(ctx({ zadanie: false })), null);
  assert.equal(P.wybierz(ctx({ co: { terminy: true, powtorki: true, zadanie: false } })), null);
  assert.equal(P.wybierz(ctx({ terminy: [ter("2026-11-09")], zadanie: false })), null, "za 5 dni: nie 7 / 3 / 1");
});

test("kolejność: zaliczenie za 7 / 3 / 1 dzień → powrót → powtórki i rewanże → Zadanie dnia", () => {
  const t3 = P.wybierz(ctx({ terminy: [ter("2026-11-07")], rewanze: 2, lastStudyDay: "2026-10-20" }));
  assert.equal(t3.kind, "termin");
  assert.equal(t3.title, "Kolokwium: Mikroekonomia, za 3 dni");
  assert.equal(t3.body, "Kolokwium z przedmiotu Mikroekonomia: sobota 7 listopada, za 3 dni. 15 minut powtórki dziś to dobry krok.");
  assert.equal(t3.path, "#/exam/mikro");
  assert.equal(P.wybierz(ctx({ terminy: [ter("2026-11-05", { r: "E" })] })).title, "Egzamin: Mikroekonomia, jutro");
  assert.equal(P.wybierz(ctx({ terminy: [ter("2026-11-11")] })).title, "Kolokwium: Mikroekonomia, za tydzień");
  assert.match(P.wybierz(ctx({ terminy: [ter("2026-11-07", { ok: true })] })).body, /termin szacunkowy/);
  // najbliższy z pasujących
  assert.equal(P.wybierz(ctx({ terminy: [ter("2026-11-05", { n: "Prawo" }), ter("2026-11-07")] })).title, "Kolokwium: Prawo, jutro");
  const back = P.wybierz(ctx({ lastStudyDay: "2026-10-30", rewanze: 3 }));
  assert.equal(back.kind, "powrot");
  assert.equal(back.body, "Ostatnia nauka w Zdawalni: 5 dni temu. Zacznij od jednego krótkiego zadania, reszta spokojnie poczeka.");
  const r = P.wybierz(ctx({ rewanze: 8, powtorki: 0 }));
  assert.equal(r.kind, "powtorki");
  assert.equal(r.body, "Na dziś: 5 rewanży. 10 minut i masz to z głowy.", "port: 5 rewanży, 2 min na każdy");
  assert.equal(P.wybierz(ctx({ rewanze: 2 })).body, "Na dziś: 2 rewanże. 4 minuty i masz to z głowy.");
  assert.equal(P.wybierz(ctx({ rewanze: 1, powtorki: 12 })).title, "Na dziś: 1 rewanż i 12 powtórek");
  assert.equal(P.wybierz(ctx({ rewanze: 1, powtorki: 12 })).body, "Na dziś: 1 rewanż i 12 powtórek. 8 minut i masz to z głowy.");
  assert.equal(P.wybierz(ctx({ powtorki: 50 })).title, "Na dziś: 20 powtórek");
  assert.equal(P.wybierz(ctx({ powtorki: 1 })).body, "Na dziś: 1 powtórka. 1 minuta i masz to z głowy.");
  assert.equal(P.wybierz(ctx({ powtorki: 3 })).path, "#/review");
  assert.equal(P.wybierz(ctx({})).kind, "zadanie");
});

test("„co przypominać” wyłącza rodzaje", () => {
  const c = (o) => ({ terminy: true, powtorki: true, zadanie: true, ...o });
  assert.equal(P.wybierz(ctx({ co: c({ terminy: false }), terminy: [ter("2026-11-07")] })).kind, "zadanie");
  assert.equal(P.wybierz(ctx({ co: c({ powtorki: false }), rewanze: 4 })).kind, "zadanie");
  assert.equal(P.wybierz(ctx({ co: c({ powtorki: false, zadanie: false }), rewanze: 4, lastStudyDay: "2026-10-01" })), null, "powrót tylko, gdy jest coś włączonego do zrobienia");
});

test("bez poczucia winy i odliczania; EN bez polskich znaków poza nazwami", () => {
  const cs = [ctx({ lastStudyDay: "2026-10-01" }), ctx({ rewanze: 1 }), ctx({}), ctx({ terminy: [ter("2026-11-05")] }), ctx({ powtorki: 7 })];
  const pl = cs.map((c) => P.wybierz(c)).map((x) => x.title + " " + x.body).join(" ");
  assert.doesNotMatch(pl, /stracisz|przepadnie|zostały|godzin[ay]? do|smutny|zawiod|musisz|wstyd|ostatnia szansa/i);
  const en = cs.map((c) => P.wybierz({ ...c, lang: "en" })).map((x) => x.title + " " + x.body + " " + x.cta).join(" ");
  assert.doesNotMatch(en.replace(/Zdawalni/g, ""), /[ąćęłńóśźż]/i); // nazwa własna zostaje
  assert.doesNotMatch(en, /lose|last chance|shame|must/i);
  assert.equal(P.wybierz(ctx({ lang: "en", terminy: [ter("2026-11-07")] })).title, "Test: Microeconomics, in 3 days");
  assert.equal(P.wybierz(ctx({ lang: "en", terminy: [ter("2026-11-07")] })).body, "Your Microeconomics test: Saturday 7 November, in 3 days. 15 minutes of review today is a good step.");
  assert.equal(P.wybierz(ctx({ lang: "en", rewanze: 2, powtorki: 4 })).body, "For today: 2 rematches and 4 reviews. 6 minutes and they are done.");
});

test("dławienie zignorowanych (port 1:1 throttleAllows)", () => {
  assert.equal(P.ignoredInRow([sent("2026-11-03"), sent("2026-11-02"), sent("2026-11-01", true), sent("2026-10-31")]), 2);
  const three = [sent("2026-11-03"), sent("2026-11-02"), sent("2026-11-01")];
  assert.equal(P.throttleAllows(three, TODAY), false); // wczoraj było
  assert.equal(P.throttleAllows(three.slice(1).concat(sent("2026-10-31")), TODAY), true); // wczoraj nie było
  const seven = Array.from({ length: 7 }, (_, i) => sent(`2026-10-${String(30 - 2 * i).padStart(2, "0")}`));
  assert.equal(P.throttleAllows(seven, TODAY), false); // środa
  assert.equal(P.throttleAllows(seven, "2026-11-08"), true); // niedziela, 9 dni po ostatnim
  assert.equal(P.throttleAllows([sent("2026-11-05"), ...seven], "2026-11-08"), false); // ostatni 3 dni temu
  assert.equal(P.throttleAllows([sent("2026-11-03", true), sent("2026-11-02"), sent("2026-11-01"), sent("2026-10-31")], TODAY), true);
  assert.equal(P.wybierz(ctx({ history: three, rewanze: 3 })), null);
});

test("stan ze strony i kontekst z wiersza bazy (terminy starosty z aktualną datą)", () => {
  const st = P.stanZ({ od: "2026-11-04", pow: [-3, -1, 0, 2, 9], rew: [0, 1], zadanie: true,
    terminy: [ter("2026-11-30"), ter("2026-11-08", { dl: "d1" }), ter("2026-11-01"), ter("2026-11-07", { own: true, n: "Prawo", sid: "prawo" })] });
  assert.deepEqual(st.pow, [3, 3, 4, 4, 4, 4, 4, 4]);
  assert.deepEqual(st.rew, [1, 2, 2, 2, 2, 2, 2, 2]);
  assert.deepEqual(st.ter.map((t) => t.d), ["2026-11-07", "2026-11-08"], "tylko 14 dni do przodu, bez minionych");
  assert.ok(JSON.stringify(st).length < 2000);
  const row = { jezyk: "pl", co: { zadanie: false }, stan: st, dni_nauki: ["2026-11-03"], ostatni: "2026-11-03",
    historia: [{ day: "2026-11-03", opened: false }, { day: "2026-11-02", opened: true }],
    dl: { d1: { date: "2026-11-09", type: "kolokwium", approx: false } } };
  // dwa dni po stanie: liczby z indeksu 2, termin starosty przesunięty na 9.11
  const c = P.kontekst(row, "2026-11-06");
  assert.equal(c.powtorki, 4); assert.equal(c.rewanze, 2);
  assert.deepEqual(c.terminy.map((t) => t.d), ["2026-11-07", "2026-11-09"]);
  assert.deepEqual(c.history, [{ day: "2026-11-03", helped: true }, { day: "2026-11-02", helped: true }]);
  assert.equal(c.co.zadanie, false); assert.equal(c.co.terminy, true);
  assert.equal(c.studiedToday, false);
  assert.equal(P.wybierz(c).title, "Kolokwium: Prawo, jutro");
  // usunięty termin starosty znika; stary stan (> 7 dni) bierze ostatnią liczbę
  const c2 = P.kontekst({ ...row, dl: {} }, "2026-11-20");
  assert.deepEqual(c2.terminy, []); assert.equal(c2.powtorki, 4);
  assert.equal(P.kontekst({ ...row, dni_nauki: ["2026-11-06"] }, "2026-11-06").studiedToday, true);
  assert.equal(P.kontekst({ stan: {} }, "2026-11-06").powtorki, 0);
});

test("godziny i dzień w Warszawie", () => {
  assert.equal(P.GODZ_DOMYSLNA, 1080);
  assert.equal(P.godzTekst(1080), "18:00");
  assert.equal(P.godziny()[0], 360); assert.equal(P.godziny().at(-1), 1320);
  assert.ok(P.godzOk(1110) && !P.godzOk(1095) && !P.godzOk(200));
  assert.deepEqual(P.warszawa(Date.parse("2026-11-05T17:05:00Z")), { dzien: "2026-11-05", minuta: 18 * 60 + 5 });
  assert.deepEqual(P.warszawa(Date.parse("2026-07-01T22:30:00Z")), { dzien: "2026-07-02", minuta: 30 }); // czas letni
});

test("mail: treść, jeden przycisk, link z id i wyłączenie jednym kliknięciem", () => {
  const pick = P.wybierz(ctx({ terminy: [ter("2026-11-07", { n: "Funkcje <teoria>" })] }));
  const m = P.mail({ lang: "pl", pick, site: "https://zdawalni.pl", id: "abc-1", unsubscribeUrl: "https://x.supabase.co/functions/v1/przypomnienia?t=tok" });
  assert.equal(m.subject, "Kolokwium: Funkcje <teoria>, za 3 dni");
  assert.match(m.html, /Funkcje &lt;teoria&gt;/);
  assert.match(m.html, /href="https:\/\/zdawalni\.pl\/\?pz=abc-1#\/exam\/mikro"/);
  assert.equal((m.html.match(/<a /g) || []).length, 2, "przycisk + wyłącz");
  assert.match(m.text, /Wyłącz przypomnienia mailem: https:\/\/x\.supabase\.co\/functions\/v1\/przypomnienia\?t=tok/);
  const en = P.mail({ lang: "en", pick: P.wybierz(ctx({ lang: "en" })), site: "https://zdawalni.pl/", id: "z", unsubscribeUrl: "u" });
  assert.match(en.html, /<html lang="en">/); assert.match(en.text, /Turn off email reminders: u/);
});

test("funkcja Edge ma identyczną kopię logiki", () => {
  const a = fs.readFileSync(path.join(__dirname, "../przypomnienia.js"), "utf8");
  const b = fs.readFileSync(path.join(__dirname, "../supabase/functions/przypomnienia/logika.js"), "utf8");
  assert.ok(a === b, "uruchom: cp przypomnienia.js supabase/functions/przypomnienia/logika.js");
});

// ---------- funkcja Edge z atrapą bazy i Resend ----------
function atrapa() {
  const db = {
    dzien: "2026-11-05",
    osoby: [{ user_id: "u1", email: "student@x.pl", token: "t".repeat(36), jezyk: "pl", co: { terminy: true, powtorki: true, zadanie: true },
      stan: P.stanZ({ od: "2026-11-05", terminy: [ter("2026-11-08", { dl: "dl1" })], pow: [0], rew: [], zadanie: true }),
      dni_nauki: ["2026-11-03"], ostatni: "2026-11-03", historia: [], dl: { dl1: { date: "2026-11-08", type: "kolokwium" } } }],
    log: [], wlaczone: { u1: true }, maile: [], resendOk: true,
  };
  const rpc = async (fn, a = {}) => {
    if (fn === "nauka_przypomnienia_kandydaci") return { data: { ok: true, dzien: db.dzien, osoby: db.osoby.filter((o) => db.wlaczone[o.user_id] && !db.log.some((l) => l.user_id === o.user_id && l.dzien === db.dzien)) }, error: null };
    if (fn === "nauka_przypomnienia_log_dodaj") {
      if (db.log.some((l) => l.user_id === a.p_user && l.dzien === a.p_dzien)) return { data: null, error: null };
      const id = "log-" + (db.log.length + 1); db.log.push({ id, user_id: a.p_user, dzien: a.p_dzien, rodzaj: a.p_rodzaj }); return { data: id, error: null };
    }
    if (fn === "nauka_przypomnienia_log_usun") { db.log = db.log.filter((l) => l.id !== a.p_id); return { data: null, error: null }; }
    if (fn === "nauka_przypomnienia_wypisz") { const o = db.osoby.find((x) => x.token === a.p_token); if (o) db.wlaczone[o.user_id] = false; return { data: { ok: !!o }, error: null }; }
    return { data: null, error: { message: "nie ma " + fn } };
  };
  const fetchMock = async (url, init) => { db.maile.push({ url, body: JSON.parse(init.body), headers: init.headers }); return { ok: db.resendOk, status: db.resendOk ? 200 : 500 }; };
  const env = { RESEND_API_KEY: "re_test", RESEND_FROM: "Zdawalni <przypomnienia@skrotbm.pl>", PRZYPOMNIENIA_CRON: "s".repeat(40), SUPABASE_URL: "https://abc.supabase.co" };
  return { db, deps: { rpc, fetch: fetchMock, env: (k) => env[k], P } };
}
const FN = "https://abc.supabase.co/functions/v1/przypomnienia";
const cron = (secret = "s".repeat(40)) => new Request(FN, { method: "POST", headers: { "x-cron-secret": secret, "content-type": "application/json" }, body: "{}" });

test("funkcja Edge: kolokwium za 3 dni → jeden mail o godzinie, drugi tego dnia nie wychodzi, wypisanie jednym kliknięciem", async () => {
  const { obsluz } = await import("../supabase/functions/przypomnienia/obsluga.ts");
  const { db, deps } = atrapa();
  assert.equal((await obsluz(cron("zly".repeat(10)), deps)).status, 401, "zły sekret cron");
  assert.equal(db.maile.length, 0);
  let r = await (await obsluz(cron(), deps)).json();
  assert.deepEqual([r.ok, r.sent, r.skipped], [true, 1, 0]);
  assert.equal(db.maile.length, 1);
  const m = db.maile[0];
  assert.equal(m.url, "https://api.resend.com/emails");
  assert.equal(m.headers.Authorization, "Bearer re_test");
  assert.deepEqual(m.body.to, ["student@x.pl"]);
  assert.equal(m.body.subject, "Kolokwium: Mikroekonomia, za 3 dni");
  assert.equal(m.body.headers["List-Unsubscribe"], `<${FN}?t=${"t".repeat(36)}>`);
  assert.equal(m.body.headers["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
  assert.match(m.body.html, /\?pz=log-1#\/exam\/mikro/);
  assert.deepEqual(db.log.map((l) => l.rodzaj), ["termin"]);
  // drugie uruchomienie tego samego dnia (pg_cron co 15 min): nic
  r = await (await obsluz(cron(), deps)).json();
  assert.equal(r.sent, 0); assert.equal(db.maile.length, 1);
  // wyścig: dwa uruchomienia naraz → unikalny wpis w logu przepuszcza tylko jedno
  db.log = []; db.maile = [];
  await Promise.all([obsluz(cron(), deps), obsluz(cron(), deps)]);
  assert.equal(db.maile.length, 1);
  // GET z linku w mailu niczego nie wyłącza, tylko prowadzi na stronę z przyciskiem
  const g = await obsluz(new Request(FN + "?t=" + "t".repeat(36)), deps);
  assert.equal(g.status, 303); assert.equal(g.headers.get("location"), "https://zdawalni.pl/przypomnienia.html#t=" + "t".repeat(36));
  assert.equal(db.wlaczone.u1, true);
  // POST z programu pocztowego (RFC 8058): wyłącza
  const w = await obsluz(new Request(FN + "?t=" + "t".repeat(36), { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: "List-Unsubscribe=One-Click" }), deps);
  assert.equal(w.status, 200); assert.equal(db.wlaczone.u1, false);
  db.log = []; db.maile = [];
  r = await (await obsluz(cron(), deps)).json();
  assert.equal(r.sent, 0, "po wypisaniu nic nie wychodzi");
});

test("funkcja Edge: błąd Resend zostawia możliwość ponowienia; strona wypisuje tokenem; brak sekretów Resend", async () => {
  const { obsluz } = await import("../supabase/functions/przypomnienia/obsluga.ts");
  const { db, deps } = atrapa();
  db.resendOk = false;
  let r = await (await obsluz(cron(), deps)).json();
  assert.deepEqual([r.sent, r.failed, db.log.length], [0, 1, 0]);
  db.resendOk = true;
  r = await (await obsluz(cron(), deps)).json();
  assert.equal(r.sent, 1);
  const zly = await obsluz(new Request(FN, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ akcja: "wypisz", token: "x".repeat(30) }) }), deps);
  assert.equal(zly.status, 400);
  const ok = await obsluz(new Request(FN, { method: "POST", headers: { "content-type": "application/json", origin: "https://zdawalni.pl" }, body: JSON.stringify({ akcja: "wypisz", token: "t".repeat(36) }) }), deps);
  assert.equal(ok.status, 200); assert.equal(ok.headers.get("access-control-allow-origin"), "https://zdawalni.pl"); assert.equal(db.wlaczone.u1, false);
  const bez = atrapa(); const deps2 = { ...bez.deps, env: (k) => (k.startsWith("RESEND") ? undefined : bez.deps.env(k)) };
  r = await (await obsluz(cron(), deps2)).json();
  assert.equal(r.code, "no_mail"); assert.equal(bez.db.maile.length, 0);
});
