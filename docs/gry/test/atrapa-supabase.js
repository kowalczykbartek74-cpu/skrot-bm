// Atrapa supabase-js do testów gier i rankingu (Playwright). Podmienia window.supabase.createClient:
// sesja, tabela nauka_docs w pamięci i funkcje RPC (v13 i v15) bez sieci. Nigdy nie trafia na stronę.
// Ustawienia przez localStorage przed załadowaniem strony:
//   mock-konto = "platne" | "darmowe" | "starosta" | "brak" (niezalogowany)
//   mock-v13   = "1" (SQL v13 uruchomiony) | "0" (funkcji nie ma → PGRST202)
//   mock-v15   = "1" (SQL v15 uruchomiony, domyślnie) | "0" (funkcji v15 nie ma → not_enabled); bez v13 nie ma też v15
//   v15 (docs/gry/SPEC-2.md, sekcja 3): mock-rok = "malo" (za_malo) · mock-haslo-slowo (domyślnie "Revenue"; "" = no_words)
//     · mock-haslo-seria · mock-haslo-stat = "1" · mock-boss = "trwa" (domyślnie) | "pokonany" | "malo" (pokonany, 4 moje ciosy)
//     | "uciekl" | "dwa" (trwa + pokonany) | "brak" | "slaby" (trwa, < 25% życia); dobra odpowiedź z przedmiotu bossa = cios (moje/zadane rosną); stan Hasła dnia przeżywa przeładowanie (localStorage mock-haslo-stan)
//     · Drabina (etap 8): mock-trud = "liniowo" (proc 95 → 20 w kolejności kluczy, bez braków) · mock-pf = "1" (pytania m2 mają 2 opcje)
// Wywołania RPC lądują w window.__rpc (nazwa + argumenty + odpowiedź).
(() => {
  const ls = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
  const KONTO = ls("mock-konto", "platne"), V13 = ls("mock-v13", "1") === "1", V15 = V13 && ls("mock-v15", "1") === "1";
  const UID = "00000000-0000-4000-8000-000000000001", EMAIL = KONTO === "starosta" ? "starosta@x.pl" : "student@x.pl";
  const now = Date.now();
  const quiz = (n, tag) => Array.from({ length: n }, (_, i) => ({
    q: `${tag}: pytanie ${i + 1} – co jest prawdą?`, options: ["Odpowiedź A" + i, "Odpowiedź B" + i, "Odpowiedź C" + i, "Odpowiedź D" + i], correct: i % 4,
    explanation: `Bo odpowiedź ${"ABCD"[i % 4]} jest poprawna. Drugie zdanie.` }));
  const cards = (n, tag) => Array.from({ length: n }, (_, i) => ({ q: `${tag}: pojęcie ${i + 1}`, a: `Definicja ${i + 1}` }));
  const DOCS = {
    materials: {
      m1: { subjectId: "makroekonomia", title: "PKB i inflacja", quizCount: 14, flashcardCount: 8, workedCount: 1, createdAt: now - 5e6, v: 2, source: "sylabus" },
      m2: { subjectId: "makroekonomia", title: "Polityka pieniężna", quizCount: 12, flashcardCount: 6, createdAt: now - 4e6, v: 2, source: "sylabus" },
      m3: { subjectId: "prawo", title: "Źródła prawa", quizCount: 6, flashcardCount: 4, createdAt: now - 3e6, v: 2, source: "sylabus" },
    },
    materialContent: {
      m1: { v: 2, summary: "PKB to wartość dóbr finalnych.", tldr: "PKB mierzy wartość dóbr i usług finalnych wytworzonych w kraju. Drugie zdanie streszczenia.", quiz: quiz(14, "PKB"), flashcards: cards(8, "PKB"),
        worked: [{ id: "w1", title: "Inflacja", similar: [{ task: "Ceny wzrosły ze 100 do 105. Ile % wynosi inflacja?", result: 5, unit: "%" }, { task: "PKB realny: 200 przy deflatorze 1,25. Ile wynosi PKB nominalny?", result: 250 }] }] },
      m2: { v: 2, summary: "Bank centralny ustala stopy.", quiz: quiz(12, "NBP"), flashcards: cards(6, "NBP") },
      m3: { v: 2, summary: "Konstytucja jest najwyższym prawem.", quiz: quiz(6, "Prawo"), flashcards: cards(4, "Prawo") },
    },
    deadlines: {}, tasks: {}, announcements: {}, meta: {}, reports: {}, progress: {}, quizWhy: {}, materialSimple: {}, materialSources: {}, exams: {}, examBank: {}, glossary: {},
    myMaterials: { my1: { subjectId: "makroekonomia", title: "Moje notatki", createdAt: now - 1e6, created_by: UID } },
    myContent: { my1: { v: 2, summary: "Moje.", quiz: quiz(5, "Moje"), flashcards: cards(3, "Moje") } },
  };
  if (ls("mock-pf", "") === "1") DOCS.materialContent.m2.quiz.forEach((q, i) => { q.options = ["Prawda", "Fałsz"]; q.correct = i % 2; });
  // postęp przeżywa przeładowanie strony (jak w prawdziwej bazie)
  try { DOCS.progress = JSON.parse(localStorage.getItem("mock-progress") || "{}"); } catch {}
  const saveProg = () => { try { localStorage.setItem("mock-progress", JSON.stringify(DOCS.progress)); } catch {} };
  // ---------- stan v13 (uproszczona baza punktów) ----------
  const RP = { pkt: {}, rows: [], runs: {}, profil: { nick: ls("mock-nick", null), w_rankingu: ls("mock-vis", "0") === "1" }, adminNicks: [{ user_id: "u1", nick: "Łoś Ania", w_rankingu: true, email: "a@x.pl" }, { user_id: "u2", nick: "Brzydki", w_rankingu: true, email: "b@x.pl" }] };
  const dzis = () => new Date().toISOString().slice(0, 10);
  const daj = (klucz, n, pula) => { const k = dzis() + "|" + klucz; if (RP.pkt[k] != null) return 0; const lim = { gry: 150, quiz: 300, powtorki: 20, lekcje: 150 }[pula] ?? 1e9;
    const used = RP.rows.filter((r) => r.d === dzis() && r.pula === pula).reduce((a, r) => a + r.n, 0); const dam = Math.max(0, Math.min(n, lim - used)); if (!dam) return 0;
    RP.pkt[k] = dam; RP.rows.push({ d: dzis(), pula, n: dam, klucz }); return dam; };
  const paid = KONTO === "platne" || KONTO === "starosta";
  const V13FN = {
    nauka_profil_moj: () => ({ ok: true, ...RP.profil, kierunek: "BM", rocznik: 2026, grupa: "C111", nick_zmiana_od: RP.profil.zm || null }),
    nauka_profil_ustaw: (a) => {
      if (a.p_nick != null) { const n = a.p_nick.trim(); if (n.length < 3 || n.length > 20) return { ok: false, code: "nick_dlugosc" }; if (/zaj/i.test(n)) return { ok: false, code: "nick_zajety" }; if (/admin|kurw/i.test(n)) return { ok: false, code: "nick_zastrzezony" }; RP.profil.nick = n; }
      if (a.p_w_rankingu != null) { if (a.p_w_rankingu && !RP.profil.nick) return { ok: false, code: "nick_brak" }; RP.profil.w_rankingu = a.p_w_rankingu; }
      return V13FN.nauka_profil_moj(); },
    nauka_gra_start: (a) => { if (!paid) return { ok: false, code: "no_access" }; const run = crypto.randomUUID(); RP.runs[run] = { gra: a.p_gra, t: Date.now(), q: 0, done: false }; return { ok: true, run, seed: +ls("mock-seed", "12345") }; },
    nauka_rp_odpowiedz: (a) => {
      if (!paid) return { ok: false, code: "no_access" };
      const q = DOCS.materialContent[a.p_mid]?.quiz?.[a.p_idx]; if (!q) return { ok: false, code: "no_question" };
      if (a.p_zrodlo === "gra") { const r = RP.runs[a.p_run]; if (!r || r.done || r.q >= 12) return { ok: false, code: "bad_run" }; r.q++; }
      const ok = a.p_wybor === q.correct;
      if (ok) bossCios(DOCS.materials[a.p_mid]?.subjectId, 1);
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
      r.done = true; const s = (Date.now() - r.t) / 1000; const max = r.gra === "frun" ? Math.ceil(s * 1.1) + 3 : r.gra === "przejdz" ? Math.ceil(s * 5) + 5 : r.gra === "drabina" ? 12 : 10;
      const status = a.p_wynik > max ? "podejrzana" : "ok"; const raw = r.gra === "frun" ? Math.floor(a.p_wynik / 2) : r.gra === "przejdz" ? Math.floor(a.p_wynik / 5) : r.gra === "drabina" ? [0, 5, 10, 20][[0, 4, 8, 12].filter((x) => a.p_wynik >= x).length - 1] : 2 * a.p_wynik;
      const pkt = status === "ok" ? daj("r:" + a.p_run, Math.min(20, raw), "gry") : 0;
      const rek = Math.max(0, ...Object.values(RP.runs).filter((x) => x !== r && x.gra === r.gra && x.ok).map((x) => x.wynik));
      r.ok = status === "ok"; r.wynik = a.p_wynik;
      return { ok: true, status, pkt, rekord: Math.max(rek, r.ok ? a.p_wynik : 0), nowy_rekord: r.ok && a.p_wynik > rek, pkt_runda: pkt };
    },
    // Scenariusze rankingu: localStorage mock-rank = "top" (domyślnie, 3 osoby) | "daleko" (41 osób, ja #14, remis na #4) | "pusto".
    nauka_ranking: (a) => {
      if (!paid) return { ok: false, code: "no_access" };
      const sc = ls("mock-rank", "top"), vis = RP.profil.w_rankingu, nick = RP.profil.nick || "?";
      const od = "2026-10-26", base = { ok: true, zakres: a.p_zakres || "tydzien", od: a.p_zakres === "semestr" ? "2026-10-01" : od, do: a.p_zakres === "semestr" ? dzis() : "2026-11-01", grupa: a.p_grupa, sid: a.p_sid };
      if (a.p_grupa && a.p_grupa !== "C111") return { ...base, n: 2, top: [{ miejsce: 1, nick: "Kuba_Z", pkt: 300, ja: false }, { miejsce: 2, nick: "Ola.B", pkt: 120, ja: false }], sasiedzi: [], ja: { pkt: 90, widoczny: vis, w_grupie: false, miejsce: null, z: null } };
      if (sc === "pusto") return { ...base, n: 0, top: [], sasiedzi: [], ja: { pkt: 0, widoczny: vis, w_grupie: true, miejsce: null, z: 0 } };
      if (sc === "daleko") {
        const ludzie = Array.from({ length: 41 }, (_, i) => ({ nick: "Osoba " + (i + 1), pkt: 610 - i * 20 }));
        ludzie[4].pkt = ludzie[3].pkt; // remis
        const J = +ls("mock-ja", "13"); ludzie[J] = { nick, pkt: ludzie[J].pkt, ja: true };
        const lista = ludzie.filter((x) => vis || !x.ja);
        let m = 0; const z = lista.map((x, i) => ({ miejsce: i && x.pkt === lista[i - 1].pkt ? m : (m = i + 1), nick: x.nick, pkt: x.pkt, ja: !!x.ja }));
        const me = vis ? z.find((x) => x.ja) : null, lp = me ? z.indexOf(me) : -1;
        return { ...base, n: z.length, top: z.slice(0, 10), sasiedzi: lp > 9 ? z.slice(lp - 2, lp + 3) : [], ja: { pkt: ludzie[J].pkt, widoczny: vis, w_grupie: true, miejsce: vis ? me.miejsce : J + 1, z: vis ? z.length : z.length + 1 } };
      }
      const top = [{ miejsce: 1, nick: "Łoś Ania", pkt: 240, ja: false }, { miejsce: 2, nick: "Cela", pkt: 180, ja: false }];
      if (vis) top.push({ miejsce: 3, nick, pkt: 90, ja: true });
      return { ...base, n: top.length, top, sasiedzi: [], ja: { pkt: 90, widoczny: vis, w_grupie: true, miejsce: 3, z: vis ? 3 : 3 } };
    },
    nauka_rekordy: (a) => ({ ok: true, gra: a.p_gra, top: [{ nick: "Łoś Ania", wynik: 40, ja: false }, { nick: "Cela", wynik: 31, ja: false }], moj_tydzien: 27, moj_rekord: 31 }),
    nauka_kierunek_stat: () => (ls("mock-stat", "0") === "1"
      ? { ok: true, tydzien: "2026-10-26", aktywni: 37, przedmioty: [{ sid: "prawo", proc: 72, proc_poprz: 65, osob: 12, odp: 300, moj_proc: 80, lepiej_niz: 61 }, { sid: "makroekonomia", proc: 54, proc_poprz: null, osob: 9, odp: 200, moj_proc: 48, lepiej_niz: null }], trudne: [{ mid: "m1", sid: "makroekonomia", proc: 41, odp: 40 }, { mid: "nie-ma", sid: "prawo", proc: 30, odp: 25 }] }
      : { ok: true, tydzien: "2026-10-26", aktywni: 3, przedmioty: [], trudne: [] }),
    nauka_admin_gry: () => (KONTO === "starosta" ? { ok: true, aktywni_tydzien: 12, widoczni: 5, rundy_tydzien: { frun: 30 },
      podejrzane: [{ run: "r1", email: "x@x.pl", nick: "Cwaniak", gra: "frun", wynik: 500, czas_s: 1, powod: "wynik 500 > możliwe 5 w 1s", start: new Date().toISOString() }],
      pseudonimy: RP.adminNicks } : { ok: false, code: "not_admin" }),
    nauka_admin_nick_usun: (a) => { RP.adminNicks = RP.adminNicks.filter((x) => x.user_id !== a.p_user); return { ok: true }; },
  };
  // ---------- v15: Drabina, Hasło dnia, Boss (kształty odpowiedzi z docs/gry/SPEC-2.md, sekcja 3) ----------
  const hash = (t) => Math.imul([...String(t)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7), 2654435761) >>> 0;
  const plusDni = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
  const wzor = (slowo, proba) => { // 2 = dobre miejsce, 1 = gdzie indziej, 0 = brak (jak nauka_haslo_wzor)
    const w = Array(slowo.length).fill(0), zost = [];
    for (let i = 0; i < slowo.length; i++) { if (proba[i] === slowo[i]) w[i] = 2; else zost.push(slowo[i]); }
    for (let i = 0; i < slowo.length; i++) if (!w[i]) { const j = zost.indexOf(proba[i]); if (j >= 0) { w[i] = 1; zost.splice(j, 1); } }
    return w.join(""); };
  const HASLO = { term: ls("mock-haslo-slowo", "Revenue"), pl: "przychód", def: "Revenue is the total income a firm earns from sales.", mid: "m1", sid: "makroekonomia" };
  const hasloStan = () => { let g = null; try { g = JSON.parse(localStorage.getItem("mock-haslo-stan") || "null"); } catch {} return g && g.dzien === dzis() ? g : { dzien: dzis(), proby: [], wzory: [], wynik: null, pkt: 0 }; };
  const hasloZapisz = (g) => { try { localStorage.setItem("mock-haslo-stan", JSON.stringify(g)); } catch {} };
  const bossBaza = () => {
    const sc = ls("mock-boss", "trwa"), top = (moje) => [{ nick: "Łoś Ania", ciosy: 38, ja: false }, { nick: "Cela", ciosy: 25, ja: false }, ...(RP.profil.nick && moje ? [{ nick: RP.profil.nick, ciosy: moje, ja: true }] : [])];
    const trwa = { id: "d-kol-makro", sid: "makroekonomia", typ: "kolokwium", tytul: "Kolokwium 1", termin: plusDni(5), start: plusDni(-2), grupy: [], hp: 300, zadane: 112, osob: 9, moje: 14, stan: "trwa", pokonany_at: null };
    const pok = { id: "d-kol-prawo", sid: "prawo", typ: "kolokwium", tytul: "Kolokwium z prawa", termin: plusDni(2), start: plusDni(-5), grupy: ["C111"], hp: 150, zadane: 163, osob: 11, moje: sc === "malo" ? 4 : 22, stan: "pokonany", pokonany_at: new Date(Date.now() - 36e5).toISOString() };
    const ucie = { id: "d-egz-makro", sid: "makroekonomia", typ: "egzamin", tytul: "Egzamin", termin: plusDni(-1), start: plusDni(-8), grupy: [], hp: 400, zadane: 280, osob: 14, moje: 31, stan: "uciekl", pokonany_at: null };
    const slaby = { ...trwa, zadane: 250 };
    const lista = { trwa: [trwa], slaby: [slaby], pokonany: [pok], malo: [pok], uciekl: [ucie], dwa: [trwa, pok], brak: [] }[sc] || [trwa];
    return lista.map((b) => ({ ...b, top: top(b.moje) }));
  };
  const BOSS = { odebrane: {}, zmiany: {}, ciosy: {} };
  // cios = dobra odpowiedź z przedmiotu bossa w trakcie walki (jak nauka_boss_ciosy w bazie, bez limitów dziennych)
  function bossCios(sid, n) { for (const b of bossBaza()) if (b.sid === sid && b.stan === "trwa") BOSS.ciosy[b.id] = (BOSS.ciosy[b.id] || 0) + n; }
  const bossyTeraz = () => bossBaza().map((b) => ({ ...b, moje: b.moje + (BOSS.ciosy[b.id] || 0), zadane: b.zadane + (BOSS.ciosy[b.id] || 0), ...BOSS.zmiany[b.id] })).filter((b) => !b.ukryty).map(({ ukryty, ...b }) => {
    const odebrane = !!BOSS.odebrane[b.id];
    return { ...b, odebrane, mozna_odebrac: b.stan === "pokonany" && b.moje >= 10 && !odebrane }; });
  const V15FN = {
    nauka_pyt_trudnosc: (a) => {
      const k = a.p_klucze || []; if (k.length > 80) return { ok: false, code: "too_many" };
      const lin = ls("mock-trud", "") === "liniowo";
      const pyt = {}; k.forEach((x, i) => { const h = hash(x); if (lin) { pyt[x] = { n: 10, proc: Math.round(95 - (75 * i) / Math.max(1, k.length - 1)) }; return; } if (h % 7 === 0) return; pyt[x] = { n: 5 + (h % 36), proc: 20 + (h % 76) }; }); // co 7. pytanie: za mało danych
      return { ok: true, pyt }; },
    nauka_pyt_rok: (a) => {
      if (!paid) return { ok: false, code: "no_access" };
      const q = DOCS.materialContent[a.p_mid]?.quiz?.[a.p_idx]; if (!q || (q.options || []).length < 2) return { ok: false, code: "no_question" };
      if (ls("mock-rok", "") === "malo") return { ok: true, n: 3, za_malo: true };
      const rozklad = q.options.map((_, i) => (i === q.correct ? 14 : 2 + ((hash(a.p_mid + a.p_idx) + i) % 5)));
      return { ok: true, n: rozklad.reduce((s, x) => s + x, 0), za_malo: false, rozklad }; },
    nauka_haslo_dzis: () => {
      if (!HASLO.term) return { ok: false, code: "no_words" };
      const g = hasloStan(), kon = g.wynik != null, slowo = HASLO.term.toUpperCase();
      const seria = +ls("mock-haslo-seria", "0") + (g.wynik > 0 ? 1 : 0);
      return { ok: true, dzien: dzis(), nr: +ls("mock-haslo-nr", "1"), dlugosc: slowo.length, sid: HASLO.sid, max: 6, proby: g.proby, wzory: g.wzory,
        podpowiedz: g.proby.length >= 3 ? HASLO.def.replace(new RegExp(HASLO.term, "gi"), "_".repeat(slowo.length)) : null,
        koniec: kon, wynik: g.wynik, pkt: g.pkt, seria, slowo: kon ? HASLO.term : null, pl: kon ? HASLO.pl : null, def: kon ? HASLO.def : null, mid: kon ? HASLO.mid : null,
        stat: kon && ls("mock-haslo-stat", "0") === "1" ? { grali: 12, zgadli: 9, rozklad: [3, 0, 1, 2, 3, 2, 1] } : null }; },
    nauka_haslo_proba: (a) => {
      if (!HASLO.term) return { ok: false, code: "no_words" };
      const slowo = HASLO.term.toUpperCase(), p = String(a.p_proba ?? "").trim().toUpperCase();
      if (!/^[A-Z]+$/.test(p)) return { ok: false, code: "bad_letters" };
      if (p.length !== slowo.length) return { ok: false, code: "bad_length" };
      const g = hasloStan(); if (g.wynik != null) return { ok: false, code: "finished" }; if (g.proby.includes(p)) return { ok: false, code: "repeated" };
      const w = wzor(slowo, p), n = g.proby.length + 1; g.proby.push(p); g.wzory.push(w);
      if (p === slowo) { g.wynik = n; g.pkt = paid ? daj("h:" + dzis(), [0, 20, 20, 15, 12, 10, 8][n], "haslo") : 0; } else if (n >= 6) g.wynik = 0;
      hasloZapisz(g);
      return { ok: true, wzor: w, proba: n, koniec: g.wynik != null, wynik: g.wynik, pkt: g.pkt }; },
    nauka_bossy: () => (window.__bossyN = (window.__bossyN || 0) + 1, { ok: true, min_ciosow: 10, pkt: 50, bossy: bossyTeraz() }),
    // ↑ window.__bossyN = licznik wywołań nauka_bossy (etap 9: na Dziś najwyżej raz na 60 s)
    nauka_boss_odbierz: (a) => {
      if (!paid) return { ok: false, code: "no_access" };
      const b = bossyTeraz().find((x) => x.id === a.p_id); if (!b) return { ok: false, code: "no_boss" };
      if (b.stan !== "pokonany") return { ok: false, code: "not_defeated" };
      if (b.odebrane) return { ok: false, code: "already" };
      if (b.moje < 10) return { ok: false, code: "too_few", moje: b.moje, trzeba: 10 };
      BOSS.odebrane[b.id] = true; return { ok: true, pkt: daj("b:" + b.id, 50, "boss") }; },
    nauka_admin_boss: (a) => {
      if (KONTO !== "starosta") return { ok: false, code: "not_admin" };
      if (a.p_hp != null && (a.p_hp < 10 || a.p_hp > 100000)) return { ok: false, code: "bad_hp" };
      if (!bossBaza().some((b) => b.id === a.p_id)) return { ok: false };
      const z = (BOSS.zmiany[a.p_id] ||= {}); if (a.p_hp != null) z.hp = a.p_hp; if (a.p_ukryty != null) z.ukryty = a.p_ukryty;
      return { ok: true }; },
  };
  const BASE = {
    nauka_ja: () => ({ email: EMAIL, admin: KONTO === "starosta", platny: paid, czytelnik: paid, platny_konto: paid, dostep_do: paid ? "2027-07-11" : null, plan: paid ? "rok" : null }),
    nauka_ping: () => ({ stan: "ok" }),
  };
  window.__rpc = [];
  const rpc = async (fn, args = {}) => {
    await new Promise((r) => setTimeout(r, 30));
    let out;
    const brak = { data: null, error: { code: "PGRST202", message: `Could not find the function public.${fn} in the schema cache` } };
    if (V13FN[fn]) out = V13 ? { data: V13FN[fn](args), error: null } : brak;
    else if (V15FN[fn]) out = V15 ? { data: V15FN[fn](args), error: null } : brak;
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
