// Skrót BM poza claude.ai: baza, logowanie i AI przez Supabase.
// Strona (index.html) woła window.claude.use("db" | "user" | "sample"),
// a ten plik odpowiada na te wywołania własną bazą (tabela nauka_docs, reguły w supabase/skrot.sql).
// Klucz publishable jest publiczny z założenia; dostępu do danych pilnują reguły w bazie.
(() => {
  "use strict";
  const CONFIG = {
    url: "https://zkyxujkdrovfzpasocmv.supabase.co",
    key: "sb_publishable_lVORMiTz9DlQaekBlfKf3Q_qPbKDHxb",
    paymentLink: "https://buy.stripe.com/test_14A6oGfNjg5g83Pg6NbEA00", // TRYB TESTOWY Stripe — po aktywacji konta podmienić na link produkcyjny
    price: "199 zł",
  };
  const TABLE = "nauka_docs";
  const KNOWN = new Set(["materials", "materialContent", "materialSources", "materialSimple", "quizWhy", "tasks", "meta", "deadlines", "announcements", "reports", "progress", "exams", "examBank", "glossary", "myMaterials", "myContent"]);
  const UNI = /@(stud\.)?usz\.edu\.pl$/i;

  // Link z maila, który wygasł albo został już użyty (np. przez skaner poczty Microsoft 365), wraca z błędem w adresie.
  // Odczytujemy go, zanim cokolwiek wyczyści adres, i pokazujemy studentowi w afterReady().
  let linkError = null;
  try { linkError = new URLSearchParams(location.hash.slice(1)).get("error_code") || (location.hash.includes("error_description") ? "error" : null); } catch {}

  let sb = null;
  try { sb = window.supabase.createClient(CONFIG.url, CONFIG.key, { auth: { flowType: "implicit", persistSession: true, detectSessionInUrl: true, autoRefreshToken: true } }); } catch {}

  const skrot = (window.skrot = { sb, state: sb ? "loading" : "error", email: "", uid: null, admin: false, paid: false, until: null, price: CONFIG.price, listeners: new Set() });
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
      await refreshMe();
      skrot.state = "in";
    } catch { skrot.state = "error"; }
  })().finally(() => { changed(); afterReady(); });

  async function refreshMe() {
    const { data: me, error } = await sb.rpc("nauka_ja");
    if (error) throw error;
    skrot.admin = !!me?.admin;
    skrot.paid = !!(me?.platny ?? me?.czytelnik);
    skrot.until = me?.dostep_do || null;
    return me;
  }

  if (sb) sb.auth.onAuthStateChange((event, session) => {
    // Po kliknięciu linku z maila w innej karcie albo po wylogowaniu: najprościej przeładować stronę.
    if (event === "SIGNED_IN" && session && skrot.state === "out") location.reload();
    if (event === "SIGNED_OUT" && skrot.state === "in") location.reload();
  });

  skrot.logout = async () => { try { await sb?.auth.signOut(); } catch {} location.reload(); };
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
            headers: { "Content-Type": "application/json", apikey: CONFIG.key, Authorization: "Bearer " + token },
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
      throw Object.assign(new Error("Niezalogowany"), { code: "not_signed_in" });
    }
    if (name === "user") return {
      id: async () => skrot.uid,
      canEdit: async () => skrot.admin,
      me: async () => ({ name: firstName(), email: skrot.email }),
      profiles: async () => ({}),
    };
    // Starosta: pełne AI. Osoby z pełnym dostępem: AI tylko do „Moich materiałów”, z biletem (limit w bazie).
    if (name === "sample") { if (!skrot.admin && !skrot.paid) throw Object.assign(new Error("AI z pełnym dostępem"), { code: "not_granted" }); return makeSample(); }
    throw new Error("Nieznana usługa: " + name);
  };

  // ---------- okno logowania ----------
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) { if (v == null) continue; if (k.startsWith("on")) n.addEventListener(k.slice(2), v); else if (k === "text") n.textContent = v; else n.setAttribute(k, v); }
    n.append(...kids.filter((k) => k != null));
    return n;
  };
  skrot.openLogin = (reason) => {
    const layer = document.getElementById("layer") || document.body;
    const close = () => { scrim.remove(); document.removeEventListener("keydown", onKey); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    const err = el("p", { class: "notice err", hidden: "" });
    const input = el("input", { class: "input", id: "skrot-login-email", type: "email", autocomplete: "email", inputmode: "email", required: "", placeholder: "np. 123456@stud.usz.edu.pl" });
    const btn = el("button", { type: "submit", class: "btn primary" }, "Wyślij link do logowania");
    const body = el("div", { style: "display:grid;gap:12px" });
    const form = el("form", { style: "display:grid;gap:12px", onsubmit: async (e) => {
      e.preventDefault();
      const email = input.value.trim().toLowerCase();
      const show = (t) => { err.textContent = t; err.hidden = false; };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return show("Wpisz poprawny adres e-mail.");
      btn.disabled = true;
      try { await skrot.sendLink(email); }
      catch (x) { btn.disabled = false; return show(/rate|limit|seconds/i.test(x?.message || "") ? "Za dużo prób logowania. Odczekaj chwilę i spróbuj ponownie." : "Nie udało się wysłać linku. Spróbuj ponownie za chwilę."); }
      // Kod z maila działa też wtedy, gdy skaner poczty zużyje link, i na innym urządzeniu niż to, na którym przyszedł mail.
      const codeErr = el("p", { class: "notice err", hidden: "" });
      const code = el("input", { class: "input", id: "skrot-login-code", type: "text", inputmode: "numeric", autocomplete: "one-time-code", maxlength: "10", placeholder: "np. 123456", style: "letter-spacing:.2em;font-size:1.2em" });
      const codeBtn = el("button", { type: "submit", class: "btn primary" }, "Zaloguj kodem");
      const codeForm = el("form", { style: "display:grid;gap:12px", onsubmit: async (e) => {
        e.preventDefault();
        const token = code.value.replace(/\s+/g, "");
        const bad = (t) => { codeErr.textContent = t; codeErr.hidden = false; };
        if (!/^\d{6,10}$/.test(token)) return bad("Wpisz kod z maila (same cyfry).");
        codeBtn.disabled = true;
        try {
          const { error } = await sb.auth.verifyOtp({ email, token, type: "email" });
          if (error) throw error;
          // Zwykle przeładowuje już onAuthStateChange (SIGNED_IN); to tylko zapas.
          setTimeout(() => location.reload(), 1500);
        } catch (x) {
          codeBtn.disabled = false;
          bad(/expired|invalid/i.test(x?.message || "") ? "Kod jest nieprawidłowy albo wygasł. Sprawdź najnowszy mail albo wyślij nowy." : "Nie udało się zalogować. Spróbuj ponownie za chwilę.");
        }
      } },
        el("label", { for: "skrot-login-code", style: "display:grid;gap:6px;font-weight:700" }, "Kod z maila", code),
        codeErr, codeBtn);
      body.replaceChildren(
        el("h2", { style: "margin:0;font-family:var(--f-display)", text: "Sprawdź skrzynkę" }),
        el("p", { style: "margin:0" }, "Wysłaliśmy maila na ", el("b", { text: email }), ". Kliknij link albo wpisz niżej kod z maila. Mail może przyjść z opóźnieniem, zajrzyj też do spamu."),
        codeForm,
        el("div", { style: "display:flex;gap:8px;flex-wrap:wrap" },
          el("button", { type: "button", class: "btn", onclick: () => { close(); skrot.openLogin(reason); } }, "Wyślij nowy mail"),
          el("button", { type: "button", class: "btn ghost", onclick: close }, "Zamknij")));
      setTimeout(() => code.focus(), 30);
    } },
      el("label", { for: "skrot-login-email", style: "display:grid;gap:6px;font-weight:700" }, "E-mail", input),
      err, btn);
    body.append(
      el("h2", { style: "margin:0;font-family:var(--f-display)", text: "Zaloguj się" }),
      el("p", { class: "muted", style: "margin:0", text: reason || "Bez hasła: wpisz swój e-mail, kliknij link z maila i gotowe. Jeśli masz już dostęp, użyj adresu, na który został kupiony." }),
      form);
    const scrim = el("div", { class: "scrim", onclick: (e) => { if (e.target === scrim) close(); } },
      el("div", { class: "modal", role: "dialog", "aria-modal": "true", "aria-label": "Logowanie" }, body));
    layer.append(scrim);
    document.addEventListener("keydown", onKey);
    setTimeout(() => input.focus(), 30);
  };

  // Komunikat, gdy baza nie odpowiada.
  skrot.noticeText = () => ({
    loading: "Łączę z bazą…",
    error: "Nie mogę połączyć się z bazą. Sprawdź internet i odśwież stronę.",
  })[skrot.state] || "";

  // „2027-10-24” → „24 października 2027”
  const plDate = (k) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(k || "");
    if (!m) return k || "";
    try { return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" }); } catch { return k; }
  };
  skrot.untilText = () => plDate(skrot.until);

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
  skrot.buy = () => {
    if (skrot.paid) return info("Masz już dostęp", skrot.until ? `Twój dostęp jest ważny do ${plDate(skrot.until)}.` : "Twój dostęp jest aktywny.");
    if (skrot.state !== "in") {
      ls.set("skrot-buy", "1");
      return skrot.openLogin("Najpierw zaloguj się e-mailem: dostęp przypiszemy do tego adresu. Po kliknięciu linku z maila od razu przejdziesz do płatności.");
    }
    if (!CONFIG.paymentLink) return info("Płatności startują wkrótce", "Zakup dostępu będzie możliwy za chwilę. Spróbuj ponownie później albo napisz na skrotbm@outlook.com.");
    const u = new URL(CONFIG.paymentLink);
    u.searchParams.set("client_reference_id", skrot.uid);
    u.searchParams.set("prefilled_email", skrot.email);
    location.href = u.toString();
  };

  // Po powrocie z płatności: czekamy, aż Stripe potwierdzi (webhook), i przeładowujemy stronę.
  async function afterReady() {
    if (linkError && skrot.state === "out") {
      skrot.openLogin(linkError === "otp_expired"
        ? "Link nie zadziałał: wygasł albo został już użyty (czasem robi to skaner poczty). Wyślij nowy mail i zaloguj się kodem z maila."
        : "Logowanie nie powiodło się. Wyślij nowy mail i zaloguj się kodem z maila.");
      return;
    }
    const params = new URLSearchParams(location.search);
    if (params.get("platnosc") === "ok") {
      history.replaceState(null, "", location.pathname);
      if (skrot.state !== "in") return;
      const box = info("Dziękujemy za zakup!", "Odblokowuję dostęp… to zwykle trwa kilka sekund.");
      for (let i = 0; i < 30 && !skrot.paid; i++) { await new Promise((r) => setTimeout(r, 2000)); try { await refreshMe(); } catch {} }
      box.remove();
      if (skrot.paid) location.reload();
      else info("Płatność w trakcie", "Stripe jeszcze nie potwierdził płatności. Odśwież stronę za minutę. Jeśli dostęp się nie pojawi, napisz na skrotbm@outlook.com.");
      return;
    }
    if (skrot.state === "in" && ls.get("skrot-buy")) { ls.set("skrot-buy", null); if (!skrot.paid) skrot.buy(); }
  }
  skrot.isUni = (e) => UNI.test(e || "");
})();
