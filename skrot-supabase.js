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
  const KNOWN = new Set(["materials", "materialContent", "materialSources", "materialSimple", "quizWhy", "tasks", "meta", "deadlines", "announcements", "reports", "progress", "exams", "examBank", "glossary"]);
  const UNI = /@(stud\.)?usz\.edu\.pl$/i;

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
      if (location.hash.includes("access_token") || location.hash.includes("error_description")) history.replaceState(null, "", location.pathname + location.search);
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
  skrot.list = async (col) => { await ready; const { data, error } = await sb.from(TABLE).select("id,data").eq("kolekcja", col); if (error) throw error; return data; };

  // ---------- AI przez funkcję serwerową (supabase/functions/claude) ----------
  function makeSample() {
    const fail = (code, message) => Object.assign(new Error(message), { code });
    return {
      async limits() { return { maxPromptBytes: 150000 }; },
      async json(prompt) {
        const { data } = await sb.auth.getSession();
        const token = data?.session?.access_token;
        let res;
        try {
          res = await fetch(CONFIG.url + "/functions/v1/claude", {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: CONFIG.key, Authorization: "Bearer " + token },
            body: JSON.stringify({ prompt }),
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
    const w = local.split(/[._-]/)[0];
    return w ? w[0].toUpperCase() + w.slice(1) : "";
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
    if (name === "sample") { if (!skrot.admin) throw Object.assign(new Error("AI tylko dla starosty"), { code: "not_granted" }); return makeSample(); }
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
      body.replaceChildren(
        el("h2", { style: "margin:0;font-family:var(--f-display)", text: "Sprawdź skrzynkę" }),
        el("p", {}, "Wysłaliśmy link na ", el("b", { text: email }), ". Otwórz go na tym urządzeniu. Mail może przyjść z opóźnieniem, zajrzyj też do spamu."),
        el("div", {}, el("button", { type: "button", class: "btn", onclick: close }, "Zamknij")));
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
    if (skrot.paid) return info("Masz już dostęp", skrot.until ? `Twój dostęp jest ważny do ${skrot.until}.` : "Twój dostęp jest aktywny.");
    if (skrot.state !== "in") {
      ls.set("skrot-buy", "1");
      return skrot.openLogin("Najpierw zaloguj się e-mailem: dostęp przypiszemy do tego adresu. Po kliknięciu linku z maila od razu przejdziesz do płatności.");
    }
    if (!CONFIG.paymentLink) return info("Płatności startują wkrótce", "Zakup dostępu będzie możliwy za chwilę. Spróbuj ponownie później albo napisz do starosty.");
    const u = new URL(CONFIG.paymentLink);
    u.searchParams.set("client_reference_id", skrot.uid);
    u.searchParams.set("prefilled_email", skrot.email);
    location.href = u.toString();
  };

  // Po powrocie z płatności: czekamy, aż Stripe potwierdzi (webhook), i przeładowujemy stronę.
  async function afterReady() {
    const params = new URLSearchParams(location.search);
    if (params.get("platnosc") === "ok") {
      history.replaceState(null, "", location.pathname);
      if (skrot.state !== "in") return;
      const box = info("Dziękujemy za zakup!", "Odblokowuję dostęp… to zwykle trwa kilka sekund.");
      for (let i = 0; i < 30 && !skrot.paid; i++) { await new Promise((r) => setTimeout(r, 2000)); try { await refreshMe(); } catch {} }
      box.remove();
      if (skrot.paid) location.reload();
      else info("Płatność w trakcie", "Stripe jeszcze nie potwierdził płatności. Odśwież stronę za minutę. Jeśli dostęp się nie pojawi, napisz do starosty.");
      return;
    }
    if (skrot.state === "in" && ls.get("skrot-buy")) { ls.set("skrot-buy", null); if (!skrot.paid) skrot.buy(); }
  }
  skrot.isUni = (e) => UNI.test(e || "");
})();
