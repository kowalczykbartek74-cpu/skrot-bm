// Skrót BM poza claude.ai: baza, logowanie i AI przez Supabase.
// Strona (index.html) woła window.claude.use("db" | "user" | "sample"),
// a ten plik odpowiada na te wywołania własną bazą (tabela nauka_docs, reguły w supabase/skrot.sql).
// Klucz publishable jest publiczny z założenia; dostępu do danych pilnują reguły w bazie.
(() => {
  "use strict";
  const CONFIG = {
    url: "https://zkyxujkdrovfzpasocmv.supabase.co",
    key: "sb_publishable_lVORMiTz9DlQaekBlfKf3Q_qPbKDHxb",
    // TRYB TESTOWY Stripe — po aktywacji konta podmienić wszystkie trzy linki na produkcyjne.
    plans: {
      rok: { link: "https://buy.stripe.com/test_14A6oGfNjg5g83Pg6NbEA00", price: "199 zł" },        // jednorazowo, oba semestry
      miesiac: { link: "https://buy.stripe.com/test_eVq6oG0Sp6uG83P8ElbEA01", price: "35 zł / mies." }, // subskrypcja, anulowanie w portalu
    },
    portalLink: "https://billing.stripe.com/p/login/test_14A6oGfNjg5g83Pg6NbEA00", // portal klienta Stripe: anulowanie i karta
    price: "199 zł/rok albo 35 zł/mies.",
  };
  const TABLE = "nauka_docs";
  const KNOWN = new Set(["materials", "materialContent", "materialSources", "materialSimple", "quizWhy", "tasks", "meta", "deadlines", "announcements", "reports", "progress", "exams", "examBank", "glossary", "myMaterials", "myContent"]);
  const UNI = /@(stud\.)?usz\.edu\.pl$/i;

  // Link z maila, który wygasł albo został już użyty (np. przez skaner poczty Microsoft 365), wraca z błędem w adresie.
  // Odczytujemy go, zanim cokolwiek wyczyści adres, i pokazujemy studentowi w afterReady().
  let linkError = null;
  try { linkError = new URLSearchParams(location.hash.slice(1)).get("error_code") || (location.hash.includes("error_description") ? "error" : null); } catch {}

  // ---------- urządzenie ----------
  // Losowe ID tej przeglądarki. Idzie w nagłówku x-skrot-device przy każdym zapytaniu do bazy,
  // a baza (supabase/skrot-v8-urzadzenia.sql) daje pełny dostęp tylko z urządzeń z listy konta (do 3).
  const DEVICE = (() => {
    const K = "skrot-device", ok = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v || "");
    let v = null;
    try { v = localStorage.getItem(K); } catch {}
    if (!ok(v)) {
      try { v = crypto.randomUUID(); } catch { v = "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (c ^ (Math.random() * 16) >> (c / 4)).toString(16)); }
      try { localStorage.setItem(K, v); } catch {}
    }
    return v;
  })();
  const DEVICE_NAME = (() => {
    const ua = navigator.userAgent || "";
    const os = /iPhone/.test(ua) ? "iPhone"
      : /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? "iPad"
      : /Android/.test(ua) ? (/Mobile/.test(ua) ? "Telefon z Androidem" : "Tablet z Androidem")
      : /CrOS/.test(ua) ? "Chromebook" : /Windows/.test(ua) ? "Windows" : /Mac OS X|Macintosh/.test(ua) ? "Mac" : /Linux/.test(ua) ? "Linux" : "Urządzenie";
    const br = /Edg[A-Z]*\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /SamsungBrowser/.test(ua) ? "Samsung Internet"
      : /Firefox|FxiOS/.test(ua) ? "Firefox" : /CriOS|Chrome\//.test(ua) ? "Chrome" : /Safari/.test(ua) ? "Safari" : "przeglądarka";
    return os + " · " + br;
  })();

  let sb = null;
  try { sb = window.supabase.createClient(CONFIG.url, CONFIG.key, { auth: { flowType: "implicit", persistSession: true, detectSessionInUrl: true, autoRefreshToken: true }, global: { headers: { "x-skrot-device": DEVICE } } }); } catch {}

  const skrot = (window.skrot = { sb, state: sb ? "loading" : "error", email: "", uid: null, admin: false, paid: false, paidAccount: false, device: null, hasPassword: false, deviceId: DEVICE, deviceName: DEVICE_NAME, until: null, plan: null, price: CONFIG.price, prices: { rok: CONFIG.plans.rok.price, miesiac: CONFIG.plans.miesiac.price }, listeners: new Set() });
  const ls = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} } };
  const changed = () => skrot.listeners.forEach((fn) => { try { fn(skrot.state); } catch {} });

  // ---------- sesja ----------
  const ready = (async () => {
    if (!sb) return;
    try {
      const { data } = await sb.auth.getSession();
      const session = data?.session;
      if (location.hash.includes("access_token") || location.hash.includes("error_description") || linkError) history.replaceState(null, "", location.pathname + location.search);
      if (!session) { skrot.state = "out"; return; }
      skrot.uid = session.user.id;
      skrot.email = (session.user.email || "").toLowerCase();
      skrot.hasPassword = !!session.user.user_metadata?.haslo;
      token = session.access_token;
      await refreshMe();
      skrot.state = "in";
    } catch { skrot.state = "error"; }
  })().finally(() => { changed(); afterReady(); });

  async function refreshMe() {
    // Najpierw sygnał urządzenia: rejestruje je na liście konta (jeśli jest miejsce) i zajmuje sesję.
    const dev = await ping();
    if (dev) skrot.device = dev;
    const { data: me, error } = await sb.rpc("nauka_ja");
    if (error) throw error;
    skrot.admin = !!me?.admin;
    skrot.paid = !!(me?.platny ?? me?.czytelnik);
    skrot.paidAccount = !!(me?.platny_konto ?? skrot.paid);
    skrot.until = me?.dostep_do || null;
    skrot.plan = me?.plan || null;
    // Okres próbny (supabase/skrot-v9-proba.sql): trialUntil tylko wtedy, gdy to on daje dostęp.
    skrot.trialUntil = me?.proba_do || null;
    skrot.trialCan = !!me?.proba_mozna && !skrot.paid;
    skrot.trialDays = me?.proba_dni || 3;
    return me;
  }

  let token = null;
  if (sb) sb.auth.onAuthStateChange((event, session) => {
    if (session?.access_token) token = session.access_token;
    // Po zalogowaniu w innej karcie albo po wylogowaniu: najprościej przeładować stronę.
    if (event === "SIGNED_IN" && session && skrot.state === "out") location.reload();
    if (event === "SIGNED_OUT" && skrot.state === "in") location.reload();
  });

  skrot.logout = async () => { try { await sb?.auth.signOut(); } catch {} location.reload(); };
  skrot.loginPassword = async (email, password) => {
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };
  skrot.sendLink = async (email) => {
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + "/", shouldCreateUser: true } });
    if (error) throw error;
  };

  // ---------- baza w stylu „kolekcje i dokumenty” ----------
  function makeDb() {
    const subs = new Set();
    const toDoc = (r) => ({ id: r.id, exists: true, data: () => ({ ...(r.data || {}) }) });
    const missing = (id) => ({ id, exists: false, data: () => undefined });
    const snap = (docs) => ({ docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: {} });
    const split = (path) => {
      const m = String(path).match(/^data\/users\/([^/]+)$/);
      return m ? { col: "progress", fixedId: m[1] } : { col: String(path) };
    };
    async function fetchCol(col) {
      if (!KNOWN.has(col)) return [];
      let all = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await sb.from(TABLE).select("id,data").eq("kolekcja", col).range(from, from + 999);
        if (error) throw error;
        all = all.concat(data || []);
        if (!data || data.length < 1000) break;
      }
      return all;
    }
    // Obserwator: co jakiś czas pobiera dane ponownie, ale stronę powiadamia tylko wtedy, gdy coś się zmieniło.
    // Dzięki temu strona nie przebudowuje się bez potrzeby (np. nie zamyka otwartej „Odpowiedzi”).
    const sig = (x) => JSON.stringify(x?.docs ? x.docs.map((d) => [d.id, d.data()]) : [x?.exists, x?.data?.()]);
    const watch = (load, fn, err) => {
      const sub = { last: null };
      sub.run = () => load().then((snap) => { const s = sig(snap); if (s === sub.last) return; sub.last = s; fn(snap); }, (e) => err?.(e));
      subs.add(sub); sub.run();
      return () => subs.delete(sub);
    };
    function ref(col, id) {
      return {
        id, path: col + "/" + id,
        async get() {
          if (!KNOWN.has(col)) return missing(id);
          const { data, error } = await sb.from(TABLE).select("id,data").eq("kolekcja", col).eq("id", id).maybeSingle();
          if (error) throw error;
          return data ? toDoc(data) : missing(id);
        },
        async set(data) {
          const { error } = await sb.from(TABLE).upsert({ kolekcja: col, id, data: JSON.parse(JSON.stringify(data)) }, { onConflict: "kolekcja,id" });
          if (error) throw error; refresh();
        },
        async update(patch) {
          const cur = await this.get();
          if (!cur.exists) throw Object.assign(new Error("Nie ma takiego dokumentu."), { code: "not_found" });
          const { error } = await sb.from(TABLE).update({ data: { ...cur.data(), ...JSON.parse(JSON.stringify(patch)) } }).eq("kolekcja", col).eq("id", id);
          if (error) throw error; refresh();
        },
        async delete() {
          if (!KNOWN.has(col)) return;
          const { error } = await sb.from(TABLE).delete().eq("kolekcja", col).eq("id", id);
          if (error) throw error; refresh();
        },
        onSnapshot(fn, err) { return watch(() => this.get(), fn, err); },
      };
    }
    function query(col, opts = {}) {
      return {
        where: () => query(col, opts),
        orderBy: (field, dir = "asc") => query(col, { ...opts, field, dir }),
        limit: (n) => query(col, { ...opts, lim: n }),
        async get() {
          let docs = (await fetchCol(col)).map(toDoc);
          if (opts.field) docs.sort((a, b) => {
            const x = a.data()[opts.field], y = b.data()[opts.field];
            const c = x == null ? -1 : y == null ? 1 : x < y ? -1 : x > y ? 1 : 0;
            return opts.dir === "desc" ? -c : c;
          });
          if (opts.lim) docs = docs.slice(0, opts.lim);
          return snap(docs);
        },
        onSnapshot(fn, err) { return watch(() => this.get(), fn, err); },
      };
    }
    function collection(path) {
      const { col, fixedId } = split(path);
      if (fixedId) return { doc: () => ref("progress", fixedId) }; // postęp: jeden dokument na osobę
      return { ...query(col), doc: (id) => ref(col, id || crypto.randomUUID()), add: async (data) => { const r = ref(col, crypto.randomUUID()); await r.set(data); return r; } };
    }
    let timer = null;
    function refresh() { clearTimeout(timer); timer = setTimeout(() => subs.forEach((s) => s.run()), 150); }
    setInterval(() => { if (document.visibilityState === "visible") refresh(); }, 60000);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") refresh(); });
    return {
      collection,
      doc: (path) => { const i = path.lastIndexOf("/"); const { col, fixedId } = split(path.slice(0, i)); return ref(col, fixedId || path.slice(i + 1)); },
    };
  }

  // Zapis wielu dokumentów naraz (import, automatyczna synchronizacja z Teams). Tylko dla administratora.
  skrot.putMany = async (rows) => {
    await ready;
    if (!skrot.admin) throw new Error("Tylko administrator może zapisywać hurtowo.");
    const clean = rows.map((r) => ({ kolekcja: r.collection, id: r.id, data: JSON.parse(JSON.stringify(r.data)) }));
    for (const r of clean) if (!KNOWN.has(r.kolekcja)) throw new Error("Nieznana kolekcja: " + r.kolekcja);
    const { error } = await sb.from(TABLE).upsert(clean, { onConflict: "kolekcja,id" });
    if (error) throw error;
    return clean.length;
  };
  skrot.ids = async (col) => {
    await ready;
    let all = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await sb.from(TABLE).select("id").eq("kolekcja", col).range(from, from + 999);
      if (error) throw error;
      all = all.concat((data || []).map((r) => r.id));
      if (!data || data.length < 1000) break;
    }
    return all;
  };
  // „Moje materiały”: limit plików i bilet na przetworzenie jednego pliku (supabase/skrot-v4-moje.sql).
  const rpcErr = (error) => {
    const m = String(error?.message || "");
    const code = ["limit_dzien", "limit_miesiac", "brak_dostepu", "nie_zalogowany"].find((c) => m.includes(c)) || (/function|does not exist|schema cache/i.test(m) ? "no_sql" : "error");
    return Object.assign(new Error(m), { code });
  };
  skrot.mojeStan = async () => { await ready; const { data, error } = await sb.rpc("nauka_moje_stan"); if (error) throw rpcErr(error); return data; };
  skrot.mojeStart = async () => { await ready; const { data, error } = await sb.rpc("nauka_moje_start"); if (error) throw rpcErr(error); return data; };
  skrot.list = async (col) => { await ready; const { data, error } = await sb.from(TABLE).select("id,data").eq("kolekcja", col); if (error) throw error; return data; };

  // ---------- AI przez funkcję serwerową (supabase/functions/claude) ----------
  function makeSample() {
    const fail = (code, message) => Object.assign(new Error(message), { code });
    return {
      async limits() { return { maxPromptBytes: 150000 }; },
      // opts.ticket: bilet na „Moje materiały” (studenci); starosta go nie potrzebuje.
      async json(prompt, opts = {}) {
        const { data } = await sb.auth.getSession();
        const token = data?.session?.access_token;
        let res;
        try {
          res = await fetch(CONFIG.url + "/functions/v1/claude", {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: CONFIG.key, Authorization: "Bearer " + token, "x-skrot-device": DEVICE },
            body: JSON.stringify(opts.ticket ? { prompt, ticket: opts.ticket } : { prompt }),
          });
        } catch { throw fail("no_function", "Funkcja AI na serwerze nie odpowiada."); }
        const body = await res.json().catch(() => ({}));
        if (res.status === 404 && !["not_granted", "no_key"].includes(body.code)) throw fail("not_deployed", "Funkcja AI nie jest wdrożona.");
        if (!res.ok) throw fail(body.code || (res.status === 429 ? "rate_limited" : "error"), body.message || "AI nie odpowiedziało.");
        if (body.json === undefined) throw fail("invalid_json", "AI nie zwróciło danych.");
        return body.json;
      },
    };
  }

  // ---------- to, czego oczekuje strona ----------
  const firstName = () => {
    const local = skrot.email.split("@")[0] || "";
    if (/^\d+$/.test(local)) return "";
    // „kasia2005” → „Kasia”; długie zlepki typu „kowalczykbartek” zamiast imienia → samo „Dzień dobry”.
    const w = (local.split(/[._-]/)[0] || "").replace(/\d+$/, "");
    if (!w || w.length > 12 || /\d/.test(w)) return "";
    return w[0].toUpperCase() + w.slice(1).toLowerCase();
  };
  let db = null;
  window.claude = window.claude || {};
  window.claude.use = async (name) => {
    await ready;
    if (skrot.state === "error" || !sb) throw Object.assign(new Error("Brak połączenia"), { code: "offline" });
    if (name === "db") return (db ||= makeDb());
    if (skrot.state !== "in") {
      if (name === "user") return { id: async () => null, canEdit: async () => false, me: async () => ({ name: "" }), profiles: async () => ({}) };
      throw Object.assign(new Error("Nie zalogowano"), { code: "not_signed_in" });
    }
    if (name === "user") return {
      id: async () => skrot.uid,
      canEdit: async () => skrot.admin,
      me: async () => ({ name: firstName(), email: skrot.email }),
      profiles: async () => ({}),
    };
    // Starosta: pełne AI. Osoby z pełnym dostępem: AI tylko do „Moich materiałów”, z biletem (limit w bazie).
    if (name === "sample") { if (!skrot.admin && !skrot.paid) throw Object.assign(new Error("AI masz w pełnym dostępie"), { code: "not_granted" }); return makeSample(); }
    throw new Error("Nieznana usługa: " + name);
  };

  // ---------- okno logowania ----------
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) { if (v == null) continue; if (k.startsWith("on")) n.addEventListener(k.slice(2), v); else if (k === "text") n.textContent = v; else n.setAttribute(k, v); }
    n.append(...kids.filter((k) => k != null));
    return n;
  };
  // Logowanie kodem z maila. Adres, na który poszedł kod, zapamiętujemy na godzinę (tyle kod jest ważny):
  // na telefonie przejście do aplikacji pocztowej często przeładowuje stronę i okno z polem na kod znikało.
  const PENDING = "skrot-login-pending";
  const MODE = "skrot-login-mode"; // ostatnio użyty sposób: "kod" albo "haslo"
  const LAST_EMAIL = "skrot-login-email";
  const pending = {
    get: () => { try { const p = JSON.parse(ls.get(PENDING) || "null"); return p && p.email && Date.now() - p.t < 60 * 60 * 1000 ? p : null; } catch { return null; } },
    set: (email, reason) => ls.set(PENDING, JSON.stringify({ email, reason: reason || null, t: Date.now() })),
    clear: () => ls.set(PENDING, null),
  };
  skrot.openLogin = (reason, opts = {}) => {
    const layer = document.getElementById("layer") || document.body;
    // Zamknięcie okna na etapie kodu = rezygnacja, więc po przeładowaniu nie otwieramy go ponownie.
    let inCode = false;
    const close = () => { if (inCode) pending.clear(); scrim.remove(); document.removeEventListener("keydown", onKey); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    const body = el("div", { style: "display:grid;gap:12px" });

    const codeStep = (email, justSent) => {
      inCode = true;
      const codeErr = el("p", { class: "notice err", hidden: "" });
      const code = el("input", { class: "input", id: "skrot-login-code", type: "text", inputmode: "numeric", autocomplete: "one-time-code", maxlength: "6", pattern: "[0-9]*", placeholder: "123456", style: "letter-spacing:.35em;font-size:1.5em;font-weight:800;text-align:center" });
      const codeBtn = el("button", { type: "submit", class: "btn primary" }, "Zaloguj się");
      const codeForm = el("form", { style: "display:grid;gap:12px", onsubmit: async (e) => {
        e.preventDefault();
        const token = code.value.replace(/\D+/g, "");
        const bad = (t) => { codeErr.textContent = t; codeErr.hidden = false; };
        if (!/^\d{6}$/.test(token)) return bad("Wpisz 6-cyfrowy kod z maila.");
        codeBtn.disabled = true;
        try {
          const { error } = await sb.auth.verifyOtp({ email, token, type: "email" });
          if (error) throw error;
          pending.clear();
          ls.set("skrot-offer-pass", "1");
          // Zwykle przeładowuje już onAuthStateChange (SIGNED_IN); to tylko zapas.
          setTimeout(() => location.reload(), 1500);
        } catch (x) {
          codeBtn.disabled = false;
          bad(/expired|invalid/i.test(x?.message || "") ? "Kod jest nieprawidłowy albo wygasł. Sprawdź najnowszy mail albo wyślij nowy kod." : "Nie udało się zalogować. Spróbuj ponownie za chwilę.");
        }
      } },
        el("label", { for: "skrot-login-code", style: "display:grid;gap:6px;font-weight:700" }, "Kod z maila", code),
        codeErr, codeBtn);
      // Po wpisaniu albo wklejeniu 6 cyfr logujemy od razu.
      code.addEventListener("input", () => { const d = code.value.replace(/\D+/g, "").slice(0, 6); if (d !== code.value) code.value = d; if (d.length === 6 && !codeBtn.disabled) codeForm.requestSubmit(); });
      body.replaceChildren(
        el("h2", { style: "margin:0;font-family:var(--f-display)", text: "Wpisz kod z maila" }),
        el("p", { style: "margin:0" }, justSent ? "Wysłaliśmy 6-cyfrowy kod na " : "Kod wysłaliśmy na ", el("b", { text: email }), ". Mail może przyjść z opóźnieniem, zajrzyj też do spamu. Kod jest ważny przez godzinę."),
        codeForm,
        el("div", { style: "display:flex;gap:8px;flex-wrap:wrap" },
          el("button", { type: "button", class: "btn", onclick: () => { close(); skrot.openLogin(reason); } }, "Wyślij nowy kod"),
          el("button", { type: "button", class: "btn ghost", onclick: close }, "Zamknij")));
      setTimeout(() => code.focus(), 30);
    };

    // Logowanie hasłem (hasło ustawia się po pierwszym zalogowaniu kodem: Więcej → Hasło do logowania).
    const passStep = () => {
      inCode = false;
      ls.set(MODE, "haslo");
      const err = el("p", { class: "notice err", hidden: "" });
      const input = el("input", { class: "input", id: "skrot-login-email", type: "email", autocomplete: "username", inputmode: "email", required: "", placeholder: "np. 123456@stud.usz.edu.pl", value: ls.get(LAST_EMAIL) || pending.get()?.email || null });
      const pass = el("input", { class: "input", id: "skrot-login-pass", type: "password", autocomplete: "current-password", required: "", placeholder: "Twoje hasło" });
      const btn = el("button", { type: "submit", class: "btn primary" }, "Zaloguj się");
      const form = el("form", { style: "display:grid;gap:12px", onsubmit: async (e) => {
        e.preventDefault();
        const email = input.value.trim().toLowerCase();
        const show = (t) => { err.textContent = t; err.hidden = false; };
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return show("Wpisz poprawny adres e-mail.");
        if (!pass.value) return show("Wpisz hasło.");
        btn.disabled = true;
        try {
          await skrot.loginPassword(email, pass.value);
          ls.set(LAST_EMAIL, email); pending.clear();
          setTimeout(() => location.reload(), 1500);
        } catch (x) {
          btn.disabled = false;
          const m = x?.message || "";
          show(/invalid login|credentials/i.test(m) ? "Zły e-mail albo hasło. Nie ustawiłeś jeszcze hasła? Zaloguj się kodem z maila, a potem ustaw je w Więcej → Hasło do logowania."
            : /rate|limit|seconds|too many/i.test(m) ? "Za dużo prób logowania. Odczekaj chwilę i spróbuj ponownie."
            : /not confirmed/i.test(m) ? "Ten adres nie jest jeszcze potwierdzony. Zaloguj się raz kodem z maila."
            : "Nie udało się zalogować. Spróbuj ponownie za chwilę.");
        }
      } },
        el("label", { for: "skrot-login-email", style: "display:grid;gap:6px;font-weight:700" }, "E-mail", input),
        el("label", { for: "skrot-login-pass", style: "display:grid;gap:6px;font-weight:700" }, "Hasło", pass),
        err, btn);
      body.replaceChildren(...[
        el("h2", { style: "margin:0;font-family:var(--f-display)", text: "Zaloguj się" }),
        reason ? el("p", { class: "muted", style: "margin:0", text: reason }) : null,
        modeSwitch("haslo"),
        form,
        el("button", { type: "button", class: "btn ghost", onclick: () => emailStep() }, "Nie pamiętam hasła: wyślij kod na maila"),
        el("button", { type: "button", class: "btn ghost", onclick: close }, "Zamknij"),
      ].filter(Boolean));
      setTimeout(() => (input.value ? pass : input).focus(), 30);
    };
    // Dwie zakładki nad formularzem.
    const modeSwitch = (now) => {
      const tab = (mode, label, go) => el("button", { type: "button", role: "tab", "aria-selected": String(now === mode), class: "btn small" + (now === mode ? " primary" : " ghost"), style: "flex:1", onclick: () => { if (now !== mode) go(); } }, label);
      return el("div", { role: "tablist", "aria-label": "Sposób logowania", style: "display:flex;gap:6px" },
        tab("kod", "Kod z maila", () => emailStep()), tab("haslo", "Hasło", () => passStep()));
    };

    const emailStep = () => {
      inCode = false;
      ls.set(MODE, "kod");
      const err = el("p", { class: "notice err", hidden: "" });
      const input = el("input", { class: "input", id: "skrot-login-email", type: "email", autocomplete: "email", inputmode: "email", required: "", placeholder: "np. 123456@stud.usz.edu.pl", value: ls.get(LAST_EMAIL) || null });
      const btn = el("button", { type: "submit", class: "btn primary" }, "Wyślij kod");
      const form = el("form", { style: "display:grid;gap:12px", onsubmit: async (e) => {
        e.preventDefault();
        const email = input.value.trim().toLowerCase();
        const show = (t) => { err.textContent = t; err.hidden = false; };
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return show("Wpisz poprawny adres e-mail.");
        btn.disabled = true;
        try { await skrot.sendLink(email); }
        catch (x) { btn.disabled = false; return show(/rate|limit|seconds/i.test(x?.message || "") ? "Za dużo prób logowania. Odczekaj chwilę i spróbuj ponownie." : "Nie udało się wysłać kodu. Spróbuj ponownie za chwilę."); }
        pending.set(email, reason);
        ls.set(LAST_EMAIL, email);
        codeStep(email, true);
      } },
        el("label", { for: "skrot-login-email", style: "display:grid;gap:6px;font-weight:700" }, "E-mail", input),
        err, btn);
      const p = pending.get();
      body.replaceChildren(
        el("h2", { style: "margin:0;font-family:var(--f-display)", text: "Zaloguj się" }),
        el("p", { class: "muted", style: "margin:0", text: reason || "Wpisz e-mail, a wyślemy Ci 6-cyfrowy kod. Jeśli masz już dostęp, użyj adresu, na który go kupiono." }),
        modeSwitch("kod"),
        form,
        ...[
          p ? el("button", { type: "button", class: "btn ghost", onclick: () => codeStep(p.email, false) }, `Mam już kod (wysłany na ${p.email})`) : null,
          el("button", { type: "button", class: "btn ghost", onclick: close }, "Zamknij"),
        ].filter(Boolean));
      setTimeout(() => input.focus(), 30);
    };

    const scrim = el("div", { class: "scrim", onclick: (e) => { if (e.target === scrim) close(); } },
      el("div", { class: "modal", role: "dialog", "aria-modal": "true", "aria-label": "Logowanie" }, body));
    layer.append(scrim);
    document.addEventListener("keydown", onKey);
    if (opts.codeFor) codeStep(opts.codeFor, false); else if (ls.get(MODE) === "haslo") passStep(); else emailStep();
  };

  // ---------- hasło do logowania (opcjonalne) ----------
  // Ustawia się będąc zalogowanym (kodem z maila). Potem można logować się e-mailem i hasłem bez czekania na maila.
  // Dzielenie się hasłem nic nie daje: dalej pilnuje limit 3 urządzeń i jedna aktywna sesja.
  skrot.openPassword = (opts = {}) => {
    if (skrot.state !== "in") return skrot.openLogin();
    const layer = document.getElementById("layer") || document.body;
    const close = () => { scrim.remove(); document.removeEventListener("keydown", onKey); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    const body = el("div", { style: "display:grid;gap:12px" });
    const scrim = el("div", { class: "scrim", onclick: (e) => { if (e.target === scrim) close(); } },
      el("div", { class: "modal", role: "dialog", "aria-modal": "true", "aria-label": "Hasło do logowania" }, body));
    const err = el("p", { class: "notice err", hidden: "" });
    const show = (t) => { err.textContent = t; err.hidden = false; };
    const p1 = el("input", { class: "input", id: "skrot-pass-1", type: "password", autocomplete: "new-password", placeholder: "co najmniej 8 znaków" });
    const p2 = el("input", { class: "input", id: "skrot-pass-2", type: "password", autocomplete: "new-password", placeholder: "to samo jeszcze raz" });
    const reveal = el("label", { style: "display:flex;gap:8px;align-items:center;font-size:.92rem" },
      el("input", { type: "checkbox", onchange: (e) => { p1.type = p2.type = e.target.checked ? "text" : "password"; } }), "Pokaż hasło");
    const btn = el("button", { type: "submit", class: "btn primary" }, skrot.hasPassword ? "Zmień hasło" : "Ustaw hasło");
    // Supabase może wymagać potwierdzenia kodem z maila przy zmianie hasła („Secure password change”).
    const nonceStep = (password) => {
      const nErr = el("p", { class: "notice err", hidden: "" });
      const code = el("input", { class: "input", id: "skrot-pass-nonce", type: "text", inputmode: "numeric", autocomplete: "one-time-code", maxlength: "6", placeholder: "123456", style: "letter-spacing:.35em;font-size:1.5em;font-weight:800;text-align:center" });
      const ok = el("button", { type: "submit", class: "btn primary" }, "Potwierdź");
      body.replaceChildren(
        el("h2", { style: "margin:0;font-family:var(--f-display)", text: "Potwierdź kodem z maila" }),
        el("p", { style: "margin:0" }, "Dla bezpieczeństwa wysłaliśmy kod na ", el("b", { text: skrot.email }), ". Wpisz go, a hasło się zapisze."),
        el("form", { style: "display:grid;gap:12px", onsubmit: async (e) => {
          e.preventDefault(); ok.disabled = true;
          const { error } = await sb.auth.updateUser({ password, nonce: code.value.replace(/\D+/g, ""), data: { haslo: true } });
          if (error) { ok.disabled = false; nErr.textContent = /expired|invalid|nonce/i.test(error.message || "") ? "Kod jest nieprawidłowy albo wygasł." : "Nie udało się zapisać hasła. Spróbuj ponownie."; nErr.hidden = false; return; }
          done();
        } }, el("label", { for: "skrot-pass-nonce", style: "display:grid;gap:6px;font-weight:700" }, "Kod z maila", code), nErr, ok),
        el("button", { type: "button", class: "btn ghost", onclick: close }, "Anuluj"));
      setTimeout(() => code.focus(), 30);
    };
    const done = () => {
      skrot.hasPassword = true; ls.set(MODE, "haslo"); ls.set(LAST_EMAIL, skrot.email);
      body.replaceChildren(
        el("h2", { style: "margin:0;font-family:var(--f-display)", text: "Hasło zapisane" }),
        el("p", { style: "margin:0" }, "Następnym razem zaloguj się adresem ", el("b", { text: skrot.email }), " i hasłem. Kod z maila dalej działa, gdyby hasło wyleciało Ci z głowy."),
        el("p", { class: "muted", style: "margin:0;font-size:.9rem", text: "Konto jest osobiste: działa na 3 urządzeniach i na jednym naraz, więc podanie hasła komuś i tak nic nie da." }),
        el("div", {}, el("button", { type: "button", class: "btn primary", onclick: close }, "Gotowe")));
      changed();
    };
    body.append(
      el("h2", { style: "margin:0;font-family:var(--f-display)", text: opts.offer ? "Ustawić hasło?" : skrot.hasPassword ? "Zmień hasło" : "Hasło do logowania" }),
      el("p", { class: "muted", style: "margin:0", text: opts.offer
        ? "Z hasłem zalogujesz się od razu, bez czekania na maila z kodem. Możesz to zrobić też później w Więcej → Hasło do logowania."
        : skrot.hasPassword ? "Wpisz nowe hasło. Stare przestanie działać." : "Ustaw hasło, a zalogujesz się e-mailem i hasłem, bez czekania na kod. Kod z maila dalej będzie działał." }),
      el("form", { style: "display:grid;gap:12px", onsubmit: async (e) => {
        e.preventDefault();
        if (p1.value.length < 8) return show("Hasło musi mieć co najmniej 8 znaków.");
        if (p1.value !== p2.value) return show("Hasła się różnią. Wpisz to samo w obu polach.");
        btn.disabled = true;
        const { error } = await sb.auth.updateUser({ password: p1.value, data: { haslo: true } });
        if (!error) return done();
        btn.disabled = false;
        const m = String(error.message || ""), c = String(error.code || "");
        if (/reauth/i.test(m + c)) {
          const r = await sb.auth.reauthenticate();
          if (r.error) return show("Nie udało się wysłać kodu potwierdzającego. Spróbuj za chwilę.");
          return nonceStep(p1.value);
        }
        if (/same_password|should be different/i.test(m + c)) return show("To jest Twoje obecne hasło. Wpisz inne.");
        if (/weak|pwned|leaked|characters/i.test(m + c)) return show("To hasło jest za słabe albo wyciekło kiedyś z innej strony. Wymyśl inne.");
        show("Nie udało się zapisać hasła. Spróbuj ponownie za chwilę.");
      } },
        el("input", { type: "email", autocomplete: "username", value: skrot.email, hidden: "", readonly: "" }),
        el("label", { for: "skrot-pass-1", style: "display:grid;gap:6px;font-weight:700" }, "Nowe hasło", p1),
        el("label", { for: "skrot-pass-2", style: "display:grid;gap:6px;font-weight:700" }, "Powtórz hasło", p2),
        reveal, err, btn),
      el("button", { type: "button", class: "btn ghost", onclick: close }, opts.offer ? "Nie teraz" : "Zamknij"));
    layer.append(scrim);
    document.addEventListener("keydown", onKey);
    setTimeout(() => p1.focus(), 30);
  };

  // Komunikat, gdy baza nie odpowiada.
  skrot.noticeText = () => ({
    loading: "Łączę z bazą…",
    error: "Brak połączenia z serwerem. Spróbuj za chwilę. Sprawdź internet i odśwież stronę.",
  })[skrot.state] || "";

  // „2027-10-24” → „24 października 2027”
  const plDate = (k) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(k || "");
    if (!m) return k || "";
    try { return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString(window.SKROT_LANG === "en" ? "en-GB" : "pl-PL", { day: "numeric", month: "long", year: "numeric" }); } catch { return k; }
  };
  skrot.untilText = () => plDate(skrot.until);
  skrot.trialUntilText = () => {
    const d = new Date(skrot.trialUntil);
    if (isNaN(d)) return "";
    try { return d.toLocaleString(window.SKROT_LANG === "en" ? "en-GB" : "pl-PL", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }); } catch { return ""; }
  };
  // „zostały 2 dni” / „został 1 dzień” / „zostało kilka godzin” do końca okresu próbnego.
  skrot.trialLeftText = () => {
    const ms = new Date(skrot.trialUntil).getTime() - Date.now();
    if (!(ms > 0)) return "";
    const days = Math.floor(ms / 864e5);
    if (days >= 2) return `zostały ${days} dni`;
    if (days === 1) return "został 1 dzień";
    const hrs = Math.max(1, Math.round(ms / 36e5));
    return hrs === 1 ? "została godzina" : hrs < 5 ? `zostały ${hrs} godziny` : `zostało ${hrs} godzin`;
  };

  // ---------- zakup dostępu ----------
  const info = (title, text) => {
    const layer = document.getElementById("layer") || document.body;
    const scrim = el("div", { class: "scrim", onclick: (e) => { if (e.target === scrim) scrim.remove(); } },
      el("div", { class: "modal", role: "dialog", "aria-modal": "true", "aria-label": title },
        el("h2", { style: "margin:0;font-family:var(--f-display)", text: title }),
        el("p", { style: "margin:0", text: text }),
        el("div", {}, el("button", { type: "button", class: "btn", onclick: () => scrim.remove() }, "Zamknij"))));
    layer.append(scrim);
    return scrim;
  };
  // Portal klienta Stripe: anulowanie subskrypcji, zmiana karty, faktury.
  skrot.manage = () => {
    const u = new URL(CONFIG.portalLink);
    if (skrot.email) u.searchParams.set("prefilled_email", skrot.email);
    location.href = u.toString();
  };
  const goPay = (plan) => {
    const link = CONFIG.plans[plan]?.link;
    if (!link) return info("Płatności startują wkrótce", "Kupno dostępu ruszy wkrótce. Spróbuj później albo napisz na skrotbm@outlook.com.");
    const u = new URL(link);
    u.searchParams.set("client_reference_id", skrot.uid);
    u.searchParams.set("prefilled_email", skrot.email);
    location.href = u.toString();
  };
  // Wybór planu: rok jednorazowo albo co miesiąc.
  const choosePlan = () => {
    const layer = document.getElementById("layer") || document.body;
    const close = () => { scrim.remove(); document.removeEventListener("keydown", onKey); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    const card = (plan, title, price, lines, badge) => el("button", {
      type: "button", class: "plan-card", "data-plan": plan,
      style: "display:grid;gap:4px;text-align:left;width:100%;padding:14px 16px;border-radius:var(--r,14px);cursor:pointer;font:inherit;color:var(--ink);"
        + (badge ? "background:var(--accent-soft,#EAF5EE);border:2px solid var(--accent,#1A7F45);" : "background:var(--surface,#fff);border:1px solid var(--line,#BFCEC5);"),
      onclick: () => { close(); goPay(plan); },
    },
      el("span", { style: "display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap" },
        el("b", { style: "font-size:1.05rem", text: title }),
        badge ? el("span", { style: "font-size:.75rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--accent-ink,#fff);background:var(--accent,#1A7F45);border-radius:999px;padding:2px 8px", text: badge }) : null),
      el("span", { style: "font-size:1.5rem;font-weight:800;color:var(--accent-text,#0E5A30)", text: price }),
      ...lines.map((t) => el("span", { style: "font-size:.9rem;color:var(--muted,#1F2D25)", text: t })));
    const scrim = el("div", { class: "scrim", onclick: (e) => { if (e.target === scrim) close(); } },
      el("div", { class: "modal", role: "dialog", "aria-modal": "true", "aria-label": "Wybierz plan" },
        el("h2", { style: "margin:0;font-family:var(--f-display)", text: "Wybierz plan" }),
        el("p", { class: "muted", style: "margin:0", text: `Dostęp przypiszemy do ${skrot.email}.` }),
        card("rok", "Do końca 2. semestru", CONFIG.plans.rok.price, ["Jednorazowo, od dnia zakupu do 11 lipca 2027 (koniec sesji letniej, ok. 8 miesięcy).", "BLIK, karta albo Przelewy24. Nic się samo nie odnawia."], "Najtaniej"),
        card("miesiac", "Co miesiąc", CONFIG.plans.miesiac.price, ["Odnawia się co miesiąc. Anulujesz w każdej chwili, dostęp działa do końca opłaconego miesiąca.", "Płatność kartą (także Apple Pay i Google Pay)."]),
        el("p", { class: "foot-note", style: "margin:0" }, "Płatność przez Stripe. ", el("a", { class: "link", href: "regulamin.html" }, "Regulamin"), " · ", el("a", { class: "link", href: "prywatnosc.html" }, "Prywatność")),
        el("div", {}, el("button", { type: "button", class: "btn ghost", onclick: close }, "Zamknij"))));
    layer.append(scrim);
    document.addEventListener("keydown", onKey);
    setTimeout(() => scrim.querySelector(".plan-card")?.focus(), 30);
  };
  skrot.buy = (plan) => {
    if (skrot.state === "in" && !skrot.paid && skrot.paidAccount && skrot.device && skrot.device.stan !== "ok") return showGate();
    // W okresie próbnym zakup działa normalnie (płatny dostęp liczy się od dnia zakupu).
    if (skrot.paid && !skrot.trialUntil) {
      if (skrot.plan === "miesiac") {
        const box = info("Masz już dostęp", skrot.until ? `Subskrypcja miesięczna, opłacona do ${plDate(skrot.until)}. Anulować albo zmienić kartę możesz w portalu Stripe.` : "Subskrypcja miesięczna jest aktywna.");
        box.querySelector(".modal > div")?.prepend(el("button", { type: "button", class: "btn", onclick: skrot.manage }, "Zarządzaj subskrypcją"));
        return box;
      }
      return info("Masz już dostęp", skrot.until ? `Twój dostęp jest ważny do ${plDate(skrot.until)}.` : "Twój dostęp jest aktywny.");
    }
    if (skrot.state !== "in") {
      ls.set("skrot-buy", plan && CONFIG.plans[plan] ? plan : "1");
      return skrot.openLogin("Najpierw zaloguj się e-mailem: dostęp przypiszemy do tego adresu. Po wpisaniu kodu z maila wybierzesz plan i przejdziesz do płatności.");
    }
    if (plan && CONFIG.plans[plan]) return goPay(plan);
    choosePlan();
  };

  // ---------- okres próbny: 3 dni pełnego dostępu, raz na konto (supabase/skrot-v9-proba.sql) ----------
  const TRIAL_ERR = {
    ma_dostep: "Masz już pełny dostęp, okres próbny nie jest potrzebny.",
    wykorzystany: "Okres próbny na tym koncie został już wykorzystany. Pełny dostęp możesz kupić od 35 zł miesięcznie.",
    urzadzenie: "Na tym urządzeniu okres próbny został już wykorzystany (także z innego konta).",
  };
  skrot.startTrial = async () => {
    if (skrot.state !== "in") {
      ls.set("skrot-trial", "1");
      return skrot.openLogin(`Zaloguj się e-mailem, a ${skrot.trialDays || 3} dni pełnego dostępu włączy się od razu. Bez karty i bez płatności.`);
    }
    if (skrot.paid && !skrot.trialUntil) return info("Masz już dostęp", "Okres próbny nie jest potrzebny.");
    const { data, error } = await sb.rpc("nauka_proba_start");
    if (error) {
      const code = Object.keys(TRIAL_ERR).find((k) => (error.message || "").includes(k));
      const noSql = /function|does not exist|schema cache|Could not find/i.test(error.message || "");
      return info("Okres próbny", code ? TRIAL_ERR[code] : noSql ? "Okres próbny ruszy wkrótce." : "Nie udało się włączyć okresu próbnego. Spróbuj za chwilę.");
    }
    skrot.trialUntil = data?.do_kiedy || null;
    // Po przeładowaniu index.html pokaże powitanie okresu próbnego.
    ls.set("skrot-welcome", "proba");
    location.reload();
  };

  // Po powrocie z płatności: czekamy, aż Stripe potwierdzi (webhook), i przeładowujemy stronę.
  // BLIK i Przelewy24 potrafią wrócić w innej przeglądarce (np. po przejściu przez aplikację banku), gdzie nikt nie jest zalogowany.
  // Wtedy prosimy o zalogowanie kodem i po zalogowaniu kończymy odblokowanie dostępu.
  async function waitForPaid() {
    const box = info("Dziękujemy za zakup!", "Odblokowuję dostęp… to zwykle trwa kilka sekund.");
    for (let i = 0; i < 30 && !skrot.paid; i++) { await new Promise((r) => setTimeout(r, 2000)); try { await refreshMe(); } catch {} }
    box.remove();
    // Po przeładowaniu index.html pokaże ekran powitalny („Dostęp aktywny”) z trzema pierwszymi krokami.
    if (skrot.paid) { ls.set("skrot-welcome", "1"); location.reload(); }
    else info("Płatność w trakcie", "Stripe jeszcze nie potwierdził płatności. Odśwież stronę za minutę. Jeśli dostęp się nie pojawi, napisz na skrotbm@outlook.com.");
  }
  async function afterReady() {
    if (linkError && skrot.state === "out") {
      skrot.openLogin("Ten link już nie działa. Teraz logujesz się kodem: wpisz e-mail, a wyślemy Ci 6-cyfrowy kod.");
      return;
    }
    if (skrot.state === "in" && !skrot.admin && skrot.paidAccount) {
      if (skrot.device && ["zajete", "limit", "zablokowane"].includes(skrot.device.stan)) { showGate(); return; }
      if (skrot.paid) { startHeartbeat(); watermark(); }
    }
    const params = new URLSearchParams(location.search);
    if (params.get("platnosc") === "ok") {
      history.replaceState(null, "", location.pathname);
      if (skrot.state === "in") { if (!skrot.paid) await waitForPaid(); return; }
      if (skrot.state === "out") {
        ls.set("skrot-after-pay", "1");
        const p = pending.get();
        const why = "Płatność przyjęta. Zaloguj się adresem e-mail użytym przy zakupie, a dostęp odblokuje się sam.";
        skrot.openLogin(why, p ? { codeFor: p.email } : {});
      }
      return;
    }
    if (skrot.state === "in" && ls.get("skrot-after-pay")) { ls.set("skrot-after-pay", null); ls.set("skrot-buy", null); if (!skrot.paid) await waitForPaid(); return; }
    if (skrot.state === "in" && ls.get("skrot-trial")) { ls.set("skrot-trial", null); if (!skrot.paid) skrot.startTrial(); return; }
    if (skrot.state === "in" && ls.get("skrot-buy")) { const want = ls.get("skrot-buy"); ls.set("skrot-buy", null); if (!skrot.paid) skrot.buy(CONFIG.plans[want] ? want : undefined); return; }
    // Strona przeładowała się w trakcie logowania (np. po przejściu do poczty na telefonie): od razu pole na kod.
    if (skrot.state === "out") { const p = pending.get(); if (p) skrot.openLogin(p.reason, { codeFor: p.email }); }
    // Pierwsze logowanie kodem: raz proponujemy ustawienie hasła.
    if (skrot.state === "in" && ls.get("skrot-offer-pass")) {
      ls.set("skrot-offer-pass", null);
      if (!skrot.hasPassword && !ls.get("skrot-welcome")) setTimeout(() => { if (!document.querySelector(".scrim, .tour")) skrot.openPassword({ offer: true }); }, 900);
    }
  }
  // ---------- jedno konto = jedna osoba: urządzenia i jedna aktywna sesja (supabase/skrot-v8-urzadzenia.sql) ----------
  // Stan z bazy: ok | zajete (konto jest teraz otwarte na innym urządzeniu) | limit (3 urządzenia już są) | zablokowane.
  async function ping(opts = {}) {
    if (!sb) return null;
    try {
      const { data, error } = await sb.rpc("nauka_ping", { p_nazwa: DEVICE_NAME, p_przejmij: !!opts.take, p_zwolnij: false });
      // Baza jeszcze bez skrot-v8: zachowujemy się jak dotąd.
      if (error) return /function|does not exist|schema cache|Could not find/i.test(error.message || "") ? { stan: "ok", stary: true } : null;
      return data;
    } catch { return null; }
  }
  const whenText = (iso) => {
    const d = new Date(iso);
    if (isNaN(d)) return "";
    const days = Math.floor((Date.now() - d.getTime()) / 864e5);
    return days <= 0 ? "dziś" : days === 1 ? "wczoraj" : plDate(iso);
  };
  const devErr = (e) => {
    const m = String(e?.message || "");
    const od = /za_wczesnie (\d{4}-\d{2}-\d{2})/.exec(m);
    if (od) return `Urządzenie możesz zmienić raz na 30 dni. Następna zmiana: ${plDate(od[1])}.`;
    return "Nie udało się usunąć urządzenia. Spróbuj ponownie za chwilę.";
  };
  // Lista urządzeń z przyciskiem „Usuń” (raz na 30 dni).
  function deviceList(info, onRemoved) {
    const list = info?.urzadzenia || [];
    const err = el("p", { class: "notice err", hidden: "" });
    const lock = info?.zmiana_od ? el("p", { class: "muted", style: "margin:0;font-size:.9rem" }, `Następną zmianę urządzenia zrobisz ${plDate(info.zmiana_od)}. Zgubiony telefon? Napisz na `, el("a", { class: "link", href: "mailto:skrotbm@outlook.com" }, "skrotbm@outlook.com"), ".") : null;
    const rows = list.map((d) => el("div", { class: "device-row", style: "display:flex;gap:10px;align-items:center;justify-content:space-between;padding:10px 12px;border:1px solid var(--line,#BFCEC5);border-radius:12px;background:var(--surface,#fff)" },
      el("span", { style: "display:grid;gap:2px;min-width:0" },
        el("b", { style: "overflow-wrap:anywhere", text: d.nazwa || "Urządzenie" }),
        el("small", { class: "muted", text: d.to ? "to urządzenie" : d.aktywne ? "używane teraz" : `ostatnio: ${whenText(d.ostatnio)}` })),
      d.to ? null : el("button", { type: "button", class: "btn small ghost", disabled: info?.zmiana_od ? "" : null, onclick: async (e) => {
        if (!confirm(`Usunąć „${d.nazwa || "Urządzenie"}” z listy? Kolejną zmianę zrobisz dopiero za 30 dni.`)) return;
        e.currentTarget.disabled = true;
        const { data, error } = await sb.rpc("nauka_urzadzenie_usun", { p_device: d.id });
        if (error) { err.textContent = devErr(error); err.hidden = false; e.currentTarget.disabled = false; return; }
        onRemoved?.(data);
      } }, "Usuń")));
    return el("div", { style: "display:grid;gap:8px" }, ...rows, lock, err);
  }
  let gateEl = null;
  function gate(title, ...kids) {
    gateEl?.remove();
    const layer = document.getElementById("layer") || document.body;
    // Bez zamykania kliknięciem obok i klawiszem Esc: to jest wybór, nie komunikat.
    gateEl = el("div", { class: "scrim skrot-gate", style: "z-index:9999" },
      el("div", { class: "modal", role: "dialog", "aria-modal": "true", "aria-label": title },
        el("h2", { style: "margin:0;font-family:var(--f-display)", text: title }), ...kids));
    layer.append(gateEl);
    setTimeout(() => gateEl?.querySelector(".btn.primary")?.focus(), 30);
    return gateEl;
  }
  const logoutBtn = () => el("button", { type: "button", class: "btn ghost", onclick: () => skrot.logout() }, "Wyloguj");
  function showGate() {
    const d = skrot.device || {};
    if (d.stan === "zajete") {
      const btn = el("button", { type: "button", class: "btn primary", onclick: async () => {
        btn.disabled = true;
        const r = await ping({ take: true });
        if (r?.stan === "ok") location.reload(); else { btn.disabled = false; skrot.device = r || d; showGate(); }
      } }, "Używaj tutaj");
      return gate("Konto jest otwarte na innym urządzeniu",
        el("p", { style: "margin:0;font-weight:600", text: `Właśnie uczysz się na: ${d.inne || "innym urządzeniu"}. W jednej chwili konto działa na jednym urządzeniu.` }),
        el("p", { class: "muted", style: "margin:0;font-size:.92rem", text: "Jeśli to Ty, kliknij „Używaj tutaj”, a tamto urządzenie się wstrzyma. Jeśli nie, ktoś zna Twoje konto: napisz do nas." }),
        el("div", { class: "row", style: "display:flex;gap:8px;flex-wrap:wrap" }, btn, logoutBtn()));
    }
    if (d.stan === "limit") {
      return gate("Masz już 3 urządzenia",
        el("p", { style: "margin:0", text: `Z konta korzystasz na maksymalnie ${d.limit || 3} urządzeniach. Żeby dodać to urządzenie (${DEVICE_NAME}), usuń jedno z listy. Usuwać można raz na 30 dni.` }),
        deviceList(d, () => location.reload()),
        el("p", { class: "muted", style: "margin:0;font-size:.88rem", text: "W trybie prywatnym albo po wyczyszczeniu danych przeglądarki strona widzi nowe urządzenie. Ucz się w zwykłym oknie." }),
        el("div", { class: "row", style: "display:flex;gap:8px;flex-wrap:wrap" }, logoutBtn()));
    }
    if (d.stan === "zablokowane") {
      return gate("Dostęp zablokowany",
        el("p", { style: "margin:0", text: "Konto było używane przez kilka osób, co narusza regulamin (§ 3)." }),
        d.powod ? el("p", { class: "muted", style: "margin:0" }, "Powód: ", el("b", { text: d.powod })) : null,
        el("p", { style: "margin:0" }, "Jeśli to pomyłka, napisz na ", el("a", { class: "link", href: "mailto:skrotbm@outlook.com" }, "skrotbm@outlook.com"), ". Odpowiemy w ciągu 14 dni."),
        el("div", { class: "row", style: "display:flex;gap:8px;flex-wrap:wrap" }, logoutBtn()));
    }
  }
  skrot.showGate = showGate;

  // Sygnał co 45 s, gdy karta jest na wierzchu. Gdy ktoś przejmie konto na innym urządzeniu, ta karta się przeładuje i pokaże pytanie.
  let beatTimer = null;
  async function beat() {
    if (document.visibilityState !== "visible") return;
    const r = await ping();
    if (r && r.stan && r.stan !== "ok") location.reload();
  }
  // Karta schowana albo zamknięta: zwalniamy sesję, żeby drugie urządzenie mogło od razu zacząć.
  function release() {
    if (!beatTimer || !token) return;
    try {
      fetch(CONFIG.url + "/rest/v1/rpc/nauka_ping", {
        method: "POST", keepalive: true,
        headers: { "Content-Type": "application/json", apikey: CONFIG.key, Authorization: "Bearer " + token, "x-skrot-device": DEVICE },
        body: JSON.stringify({ p_nazwa: DEVICE_NAME, p_zwolnij: true }),
      }).catch(() => {});
    } catch {}
  }
  function startHeartbeat() {
    if (beatTimer || skrot.device?.stary) return;
    beatTimer = setInterval(beat, 45000);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") beat(); else release(); });
    window.addEventListener("pagehide", release);
  }

  // Znak wodny: adres konta przy prawej krawędzi ekranu. Zrzuty ekranu i wydruki pokazują, czyje to konto.
  function watermark() {
    if (!skrot.email || document.getElementById("skrot-wm")) return;
    document.documentElement.setAttribute("data-wm", skrot.email);
    document.body.append(el("div", { id: "skrot-wm", "aria-hidden": "true", translate: "no", text: skrot.email,
      style: "position:fixed;right:2px;top:50%;transform:translateY(-50%) rotate(180deg);writing-mode:vertical-rl;font:600 10px/1 system-ui,sans-serif;letter-spacing:.06em;color:var(--ink,#16231B);opacity:.22;pointer-events:none;user-select:none;z-index:50;white-space:nowrap" }));
  }

  // Więcej → Twoje urządzenia
  skrot.openDevices = async () => {
    const layer = document.getElementById("layer") || document.body;
    const body = el("div", { style: "display:grid;gap:12px" }, el("p", { class: "muted", text: "Wczytuję…" }));
    const close = () => { scrim.remove(); document.removeEventListener("keydown", onKey); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    const scrim = el("div", { class: "scrim", onclick: (e) => { if (e.target === scrim) close(); } },
      el("div", { class: "modal", role: "dialog", "aria-modal": "true", "aria-label": "Twoje urządzenia" }, body));
    layer.append(scrim);
    document.addEventListener("keydown", onKey);
    const fill = (info) => body.replaceChildren(
      el("h2", { style: "margin:0;font-family:var(--f-display)", text: "Twoje urządzenia" }),
      el("p", { class: "muted", style: "margin:0", text: `Jedno konto = jedna osoba. Możesz mieć do ${info?.limit || 3} urządzeń (np. telefon i laptop), a w jednej chwili konto działa na jednym z nich.` }),
      deviceList(info, (next) => fill(next)),
      el("div", {}, el("button", { type: "button", class: "btn ghost", onclick: close }, "Zamknij")));
    const { data, error } = await sb.rpc("nauka_urzadzenia_moje");
    const noSql = error && /function|does not exist|schema cache|Could not find/i.test(error.message || "");
    if (error) body.replaceChildren(
      el("h2", { style: "margin:0;font-family:var(--f-display)", text: "Twoje urządzenia" }),
      el("p", { text: noSql ? (skrot.admin ? "Baza nie ma jeszcze listy urządzeń. Uruchom supabase/skrot-v8-urzadzenia.sql w Supabase → SQL Editor." : "Lista urządzeń jeszcze się nie wczytuje, pracujemy nad tym. Konto działa normalnie.") : "Nie udało się wczytać urządzeń. Spróbuj za chwilę." }),
      el("div", {}, el("button", { type: "button", class: "btn ghost", onclick: close }, "Zamknij")));
    else fill(data);
  };

  // Panel starosty: konta i urządzenia, podejrzane na górze.
  skrot.openAdminAccounts = async () => {
    if (!skrot.admin) return;
    const layer = document.getElementById("layer") || document.body;
    const body = el("div", { style: "display:grid;gap:12px" }, el("p", { class: "muted", text: "Wczytuję…" }));
    const close = () => { scrim.remove(); document.removeEventListener("keydown", onKey); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    const scrim = el("div", { class: "scrim", onclick: (e) => { if (e.target === scrim) close(); } },
      el("div", { class: "modal", role: "dialog", "aria-modal": "true", "aria-label": "Konta i urządzenia", style: "max-width:720px;max-height:88vh;overflow:auto" }, body));
    layer.append(scrim);
    document.addEventListener("keydown", onKey);
    let all = [], onlySus = true;
    const act = async (k, akcja, powod) => {
      const { data, error } = await sb.rpc("nauka_admin_konto", { p_user: k.user_id, akcja, p_powod: powod || null });
      if (error) return alert("Nie udało się: " + error.message);
      all = data || []; draw();
    };
    const warnMail = (k) => {
      const subject = "Skrót BM: Twoje konto jest używane przez kilka osób";
      const text = `Cześć,\n\nTwoje konto Skrót BM (${k.email}) jest ostatnio używane na wielu urządzeniach na zmianę, co wygląda na korzystanie z niego przez kilka osób. Konto jest osobiste i nie wolno go udostępniać (regulamin, § 3).\n\nJeśli to pomyłka, np. zmieniłeś telefon, po prostu odpisz na tego maila. Jeśli sytuacja się powtórzy, będziemy musieli zablokować dostęp.\n\nPozdrawiam\nBartłomiej Kowalczyk, Skrót BM`;
      location.href = `mailto:${k.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
      act(k, "ostrzezenie");
    };
    const chip = (t, bad) => el("span", { style: `font-size:.75rem;font-weight:800;border-radius:999px;padding:2px 8px;${bad ? "background:#B42318;color:#fff" : "background:var(--accent-soft,#EAF5EE);color:var(--accent-text,#0E5A30)"}`, text: t });
    const card = (k) => el("div", { style: `display:grid;gap:6px;padding:12px 14px;border-radius:12px;border:${k.podejrzane || k.zablokowane ? "2px solid #B42318" : "1px solid var(--line,#BFCEC5)"};background:var(--surface,#fff)` },
      el("div", { style: "display:flex;gap:8px;align-items:center;flex-wrap:wrap" }, el("b", { style: "overflow-wrap:anywhere", text: k.email || k.user_id }),
        k.zablokowane ? chip("Zablokowane", true) : k.podejrzane ? chip("Podejrzane", true) : null,
        k.ostrzezenie_at ? chip(`ostrzeżony ${plDate(k.ostrzezenie_at)}`) : null),
      el("small", { class: "muted", text: `Urządzenia: ${k.urzadzenia}/3 · nowe w 30 dni: ${k.nowe_30d} · przejęcia sesji w 7 dni: ${k.przejecia_7d} · próby ponad limit w 7 dni: ${k.limit_7d} · różne adresy IP w 7 dni: ${k.ip_7d}` }),
      (k.lista || []).length ? el("small", { text: k.lista.map((d) => `${d.nazwa || "Urządzenie"} (${d.aktywne ? "teraz" : whenText(d.ostatnio)})`).join(" · ") }) : null,
      k.powod ? el("small", {}, "Powód blokady: ", el("b", { text: k.powod })) : null,
      el("div", { style: "display:flex;gap:6px;flex-wrap:wrap" },
        k.email ? el("button", { type: "button", class: "btn small", onclick: () => warnMail(k) }, "Ostrzeż mailem") : null,
        k.zablokowane
          ? el("button", { type: "button", class: "btn small", onclick: () => act(k, "odblokuj") }, "Odblokuj")
          : el("button", { type: "button", class: "btn small ghost", onclick: () => { const p = prompt(`Zablokować ${k.email}? Wpisz powód (zobaczy go ta osoba):`, "Konto używane przez kilka osób"); if (p != null) act(k, "blokuj", p); } }, "Zablokuj"),
        el("button", { type: "button", class: "btn small ghost", onclick: () => { if (confirm(`Wyczyścić listę urządzeń ${k.email}? Ta osoba będzie mogła od razu dodać nowe (np. po zgubieniu telefonu).`)) act(k, "reset"); } }, "Wyczyść urządzenia")));
    function draw() {
      const sus = all.filter((k) => k.podejrzane || k.zablokowane);
      const shown = onlySus && sus.length ? sus : all;
      body.replaceChildren(
        el("h2", { style: "margin:0;font-family:var(--f-display)", text: "Konta i urządzenia" }),
        el("p", { class: "muted", style: "margin:0;font-size:.92rem", text: "Podejrzane: co najmniej 6 przejęć sesji w 7 dni albo co najmniej 5 nowych urządzeń w 30 dni. Najpierw ostrzeż mailem, blokuj przy powtórce. Sama zmiana telefonu albo nauka w trybie prywatnym też dodaje urządzenia, więc sprawdź, zanim zablokujesz." }),
        sus.length ? el("label", { style: "display:flex;gap:8px;align-items:center" }, el("input", { type: "checkbox", checked: onlySus ? "" : null, onchange: (e) => { onlySus = e.target.checked; draw(); } }), `Tylko podejrzane i zablokowane (${sus.length} z ${all.length})`)
          : el("p", { style: "margin:0", text: all.length ? `Nic podejrzanego. Kont z urządzeniami: ${all.length}.` : "Nikt jeszcze nie dodał urządzenia." }),
        ...shown.map(card),
        el("div", {}, el("button", { type: "button", class: "btn ghost", onclick: close }, "Zamknij")));
    }
    const { data, error } = await sb.rpc("nauka_admin_konta");
    if (error) body.replaceChildren(el("p", { text: /function|does not exist|schema cache|Could not find/i.test(error.message || "") ? "Najpierw uruchom supabase/skrot-v8-urzadzenia.sql w Supabase." : "Nie udało się wczytać kont." }), el("div", {}, el("button", { type: "button", class: "btn ghost", onclick: close }, "Zamknij")));
    else { all = data || []; draw(); }
  };

  skrot.isUni = (e) => UNI.test(e || "");
})();
