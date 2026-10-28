// Atrapa supabase-js do testów gier i rankingu (Playwright). Podmienia window.supabase.createClient:
// sesja, tabela nauka_docs w pamięci i funkcje RPC (także v13) bez sieci. Nigdy nie trafia na stronę.
// Ustawienia przez localStorage przed załadowaniem strony:
//   mock-konto = "platne" | "darmowe" | "starosta" | "brak" (niezalogowany)
//   mock-v13   = "1" (SQL v13 uruchomiony) | "0" (funkcji nie ma → PGRST202)
// Wywołania RPC lądują w window.__rpc (nazwa + argumenty + odpowiedź).
(() => {
  const ls = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
  const KONTO = ls("mock-konto", "platne"), V13 = ls("mock-v13", "1") === "1";
  const UID = "00000000-0000-4000-8000-000000000001", EMAIL = KONTO === "starosta" ? "starosta@x.pl" : "student@x.pl";
  const now = Date.now();
  const quiz = (n, tag) => Array.from({ length: n }, (_, i) => ({
    q: `${tag}: pytanie ${i + 1} – co jest prawdą?`, options: ["Odpowiedź A" + i, "Odpowiedź B" + i, "Odpowiedź C" + i, "Odpowiedź D" + i], correct: i % 4,
    explanation: `Bo odpowiedź ${"ABCD"[i % 4]} jest poprawna. Drugie zdanie.` }));
  const cards = (n, tag) => Array.from({ length: n }, (_, i) => ({ q: `${tag}: pojęcie ${i + 1}`, a: `Definicja ${i + 1}` }));
  const DOCS = {
    materials: {
      m1: { subjectId: "makroekonomia", title: "PKB i inflacja", createdAt: now - 5e6, v: 2, source: "sylabus" },
      m2: { subjectId: "makroekonomia", title: "Polityka pieniężna", createdAt: now - 4e6, v: 2, source: "sylabus" },
      m3: { subjectId: "prawo", title: "Źródła prawa", createdAt: now - 3e6, v: 2, source: "sylabus" },
    },
    materialContent: {
      m1: { v: 2, summary: "PKB to wartość dóbr finalnych.", quiz: quiz(14, "PKB"), flashcards: cards(8, "PKB"),
        worked: [{ id: "w1", title: "Inflacja", similar: [{ task: "Ceny wzrosły ze 100 do 105. Ile % wynosi inflacja?", result: 5, unit: "%" }, { task: "PKB realny: 200 przy deflatorze 1,25. Ile wynosi PKB nominalny?", result: 250 }] }] },
      m2: { v: 2, summary: "Bank centralny ustala stopy.", quiz: quiz(12, "NBP"), flashcards: cards(6, "NBP") },
      m3: { v: 2, summary: "Konstytucja jest najwyższym prawem.", quiz: quiz(6, "Prawo"), flashcards: cards(4, "Prawo") },
    },
    deadlines: {}, tasks: {}, announcements: {}, meta: {}, reports: {}, progress: {}, quizWhy: {}, materialSimple: {}, materialSources: {}, exams: {}, examBank: {}, glossary: {},
    myMaterials: { my1: { subjectId: "makroekonomia", title: "Moje notatki", createdAt: now - 1e6, created_by: UID } },
    myContent: { my1: { v: 2, summary: "Moje.", quiz: quiz(5, "Moje"), flashcards: cards(3, "Moje") } },
  };
  // postęp przeżywa przeładowanie strony (jak w prawdziwej bazie)
  try { DOCS.progress = JSON.parse(localStorage.getItem("mock-progress") || "{}"); } catch {}
  const saveProg = () => { try { localStorage.setItem("mock-progress", JSON.stringify(DOCS.progress)); } catch {} };
  // ---------- stan v13 (uproszczona baza punktów) ----------
  const RP = { pkt: {}, rows: [], runs: {}, profil: { nick: null, w_rankingu: false } };
  const dzis = () => new Date().toISOString().slice(0, 10);
  const daj = (klucz, n, pula) => { const k = dzis() + "|" + klucz; if (RP.pkt[k] != null) return 0; const lim = { gry: 150, quiz: 300, powtorki: 20, lekcje: 150 }[pula] ?? 1e9;
    const used = RP.rows.filter((r) => r.d === dzis() && r.pula === pula).reduce((a, r) => a + r.n, 0); const dam = Math.max(0, Math.min(n, lim - used)); if (!dam) return 0;
    RP.pkt[k] = dam; RP.rows.push({ d: dzis(), pula, n: dam, klucz }); return dam; };
  const paid = KONTO === "platne" || KONTO === "starosta";
  const V13FN = {
    nauka_profil_moj: () => ({ ok: true, ...RP.profil, kierunek: "BM", rocznik: 2026, grupa: "C111", nick_zmiana_od: null }),
    nauka_profil_ustaw: (a) => { if (a.p_nick != null) RP.profil.nick = a.p_nick; if (a.p_w_rankingu != null) RP.profil.w_rankingu = a.p_w_rankingu; return V13FN.nauka_profil_moj(); },
    nauka_gra_start: (a) => { if (!paid) return { ok: false, code: "no_access" }; const run = crypto.randomUUID(); RP.runs[run] = { gra: a.p_gra, t: Date.now(), q: 0, done: false }; return { ok: true, run, seed: 12345 }; },
    nauka_rp_odpowiedz: (a) => {
      if (!paid) return { ok: false, code: "no_access" };
      const q = DOCS.materialContent[a.p_mid]?.quiz?.[a.p_idx]; if (!q) return { ok: false, code: "no_question" };
      if (a.p_zrodlo === "gra") { const r = RP.runs[a.p_run]; if (!r || r.done || r.q >= 12) return { ok: false, code: "bad_run" }; r.q++; }
      const ok = a.p_wybor === q.correct;
      return { ok: true, poprawna: ok, correct: q.correct, pkt: ok ? daj("q:" + a.p_mid + ":" + a.p_idx, 10, a.p_zrodlo === "gra" ? "gry" : "quiz") : 0 };
    },
    nauka_rp_zadanie: (a) => {
      if (!paid) return { ok: false, code: "no_access" };
      const s = DOCS.materialContent[a.p_mid]?.worked?.find((w) => String(w.id) === a.p_wid)?.similar?.[a.p_j]; if (!s) return { ok: false, code: "no_task" };
      if (a.p_zrodlo === "gra") { const r = RP.runs[a.p_run]; if (!r || r.done || r.q >= 12) return { ok: false, code: "bad_run" }; r.q++; }
      const ok = a.p_wynik != null && Math.abs(a.p_wynik - s.result) <= (s.tol ?? Math.max(0.01, Math.abs(s.result) * 0.005));
      return { ok: true, poprawna: ok, wynik: s.result, pkt: ok ? daj("z:" + a.p_mid + ":" + a.p_wid + ":" + a.p_j, 20, a.p_zrodlo === "gra" ? "gry" : "quiz") : 0 };
    },
    nauka_rp_powtorka: (a) => (paid ? { ok: true, pkt: daj("p:" + a.p_klucz, 1, "powtorki") } : { ok: false, code: "no_access" }),
    nauka_rp_lekcja: (a) => (paid ? { ok: true, pkt: daj("l:" + a.p_lid, 30, "lekcje") } : { ok: false, code: "no_access" }),
    nauka_gra_koniec: (a) => {
      const r = RP.runs[a.p_run]; if (!r) return { ok: false, code: "bad_run" }; if (r.done) return { ok: false, code: "already_finished" };
      r.done = true; const s = (Date.now() - r.t) / 1000; const max = r.gra === "frun" ? Math.ceil(s * 1.1) + 3 : r.gra === "przejdz" ? Math.ceil(s * 5) + 5 : 10;
      const status = a.p_wynik > max ? "podejrzana" : "ok"; const raw = r.gra === "frun" ? Math.floor(a.p_wynik / 2) : r.gra === "przejdz" ? Math.floor(a.p_wynik / 5) : 2 * a.p_wynik;
      const pkt = status === "ok" ? daj("r:" + a.p_run, Math.min(20, raw), "gry") : 0;
      const rek = Math.max(0, ...Object.values(RP.runs).filter((x) => x !== r && x.gra === r.gra && x.ok).map((x) => x.wynik));
      r.ok = status === "ok"; r.wynik = a.p_wynik;
      return { ok: true, status, pkt, rekord: Math.max(rek, r.ok ? a.p_wynik : 0), nowy_rekord: r.ok && a.p_wynik > rek, pkt_runda: pkt };
    },
    nauka_ranking: (a) => ({ ok: true, zakres: a.p_zakres || "tydzien", od: dzis(), do: dzis(), n: 3,
      top: [{ miejsce: 1, nick: "Łoś Ania", pkt: 240, ja: false }, { miejsce: 2, nick: "Cela", pkt: 180, ja: false }, { miejsce: 3, nick: RP.profil.nick || "Ty", pkt: 90, ja: true }],
      sasiedzi: [], ja: { pkt: 90, widoczny: RP.profil.w_rankingu, w_grupie: true, miejsce: 3, z: 3 } }),
    nauka_rekordy: (a) => ({ ok: true, gra: a.p_gra, top: [{ nick: "Łoś Ania", wynik: 40, ja: false }, { nick: "Cela", wynik: 31, ja: false }], moj_tydzien: null, moj_rekord: null }),
    nauka_kierunek_stat: () => ({ ok: true, tydzien: dzis(), aktywni: 12, przedmioty: [], trudne: [] }),
    nauka_admin_gry: () => ({ ok: true, aktywni_tydzien: 12, widoczni: 5, rundy_tydzien: { frun: 30 }, podejrzane: [], pseudonimy: [] }),
    nauka_admin_nick_usun: () => ({ ok: true }),
  };
  const BASE = {
    nauka_ja: () => ({ email: EMAIL, admin: KONTO === "starosta", platny: paid, czytelnik: paid, platny_konto: paid, dostep_do: paid ? "2027-07-11" : null, plan: paid ? "rok" : null }),
    nauka_ping: () => ({ stan: "ok" }),
  };
  window.__rpc = [];
  const rpc = async (fn, args = {}) => {
    await new Promise((r) => setTimeout(r, 30));
    let out;
    if (V13FN[fn]) out = V13 ? { data: V13FN[fn](args), error: null } : { data: null, error: { code: "PGRST202", message: `Could not find the function public.${fn} in the schema cache` } };
    else out = { data: BASE[fn] ? BASE[fn](args) : null, error: null };
    window.__rpc.push({ fn, args, res: out.data ?? out.error });
    return out;
  };
  // ---------- nauka_docs: select / upsert / update / delete z łańcuchem .eq() ----------
  function table() {
    const st = { op: "select", filters: {}, row: null, single: false };
    const run = async () => {
      const col = st.filters.kolekcja, id = st.filters.id, store = (DOCS[col] ||= {});
      if (st.op === "select") {
        const rows = Object.entries(store).filter(([k]) => id == null || k === id).map(([k, v]) => ({ id: k, data: v }));
        return { data: st.single ? rows[0] || null : rows, error: null };
      }
      if (st.op === "upsert") { for (const r of [].concat(st.row)) (DOCS[r.kolekcja] ||= {})[r.id] = r.data; saveProg(); return { data: null, error: null }; }
      if (st.op === "update") { if (store[id]) store[id] = st.row.data; return { data: null, error: null }; }
      if (st.op === "delete") { delete store[id]; return { data: null, error: null }; }
    };
    const q = {
      select() { return q; }, eq(k, v) { st.filters[k] = v; return q; }, order() { return q; }, range() { return q; }, limit() { return q; }, in() { return q; },
      maybeSingle() { st.single = true; return q; }, single() { st.single = true; return q; },
      upsert(row) { st.op = "upsert"; st.row = row; return q; }, update(data) { st.op = "update"; st.row = { data: data.data }; return q; }, delete() { st.op = "delete"; return q; }, insert(row) { st.op = "upsert"; st.row = row; return q; },
      then(ok, err) { return run().then(ok, err); },
    };
    return q;
  }
  const session = KONTO === "brak" ? null : { access_token: "t", user: { id: UID, email: EMAIL, user_metadata: {} } };
  window.supabase = { createClient: () => ({
    auth: { getSession: async () => ({ data: { session } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }), signOut: async () => ({}),
      signInWithOtp: async () => ({}), signInWithPassword: async () => ({}), verifyOtp: async () => ({}), updateUser: async () => ({}), reauthenticate: async () => ({}) },
    rpc, from: () => table(),
    functions: { invoke: async () => ({ data: null, error: { message: "atrapa" } }) },
  }) };
})();
