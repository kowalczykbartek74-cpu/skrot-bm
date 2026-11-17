/* Pętla UX-3 · Lekcja: reakcja, tempo i ekran końca.
   Ten plik jest ładowany za głównym skryptem index.html. Z aplikacji korzysta przez most window.ZD_APP
   (blok „most ux-3” na końcu głównej funkcji), zawsze dopiero w chwili wywołania.
   window.ZD_LEKCJA:
   - fbar(fb, card): werdykt odpowiedzi w dolnym pasku odtwarzacza (zielony / czerwony, ikona ✓/✗, „Dlaczego”);
     zwraca true, gdy panel jest obsłużony (bez tego pliku lpBuild wkłada stary panel do karty).
   - ico(nazwa): ikona SVG w stylu kreski (tylko zielone motywy; inne motywy: null). */
(() => {
  "use strict";
  const A = () => window.ZD_APP || {};
  const green = () => !document.documentElement.getAttribute("data-theme");

  // Ikony: wspólne rysunki (A4d, kopiowane dosłownie) i własne z prefiksem ux3-.
  const IKONY_WSPOLNE = {
    bolt:   '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    book:   '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 21.5V4.5"/>',
    bulb:   '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>',
    check:  '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.6 2.6L16 9.5"/>',
    cross:  '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
    retry:  '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
    skip:   '<path d="M5 5l9 7-9 7z"/><path d="M18 5v14"/>',
    warn:   '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
    eye:    '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    ticket: '<path d="M3 8a2 2 0 0 0 0 4v4h18v-4a2 2 0 0 0 0-4V4H3z"/><path d="M13 4v16" stroke-dasharray="2 2"/>',
    help:   '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01"/>',
    lock:   '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    play:   '<circle cx="12" cy="12" r="9"/><path d="M10 8.5l5.5 3.5-5.5 3.5z"/>',
    snow:   '<path d="M12 2v20M4.9 6.5l14.2 11M19.1 6.5L4.9 17.5"/><path d="M9.5 3.5L12 6l2.5-2.5M9.5 20.5L12 18l2.5 2.5"/>',
    share:  '<path d="M12 3v12M7.5 7.5L12 3l4.5 4.5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>'
  };
  const IKONY_UX3 = {
    "ux3-glos": '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
    "ux3-wibr": '<rect x="8" y="3" width="8" height="18" rx="2"/><path d="M4 8v8M20 8v8M11 18h2"/>',
    "ux3-num": '<path d="M5 9h14M5 15h14M10 4L8 20M16 4l-2 16"/>',
    "ux3-pen": '<path d="M4 20l4-1L19 8l-3-3L5 16z"/><path d="M14 7l3 3"/>',
    "ux3-puzzle": '<path d="M5 8h4a2 2 0 1 1 4 0h4v4a2 2 0 1 1 0 4v4H5z"/>',
    "ux3-target": '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    "ux3-pin": '<path d="M9 3h6l-1 6 3 3H7l3-3z"/><path d="M12 12v9"/>',
    "ux3-talk": '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8"/>',
    "ux3-link": '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    "ux3-abc": '<path d="M4 18l4-12 4 12M5.5 14h5"/><path d="M15 6v12h3a3 3 0 0 0 0-6h-3M15 6h2.5a3 3 0 0 1 0 6"/>',
    "ux3-star": '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    "ux3-user": '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    "ux3-cam": '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'
  };
  const KICK = { "📖": "book", "🧠": "bulb", "✅": "check", "⚠": "warn", "👀": "eye", "🔢": "ux3-num", "✍": "ux3-pen", "🧩": "ux3-puzzle", "💡": "bulb", "🎯": "ux3-target", "🎟": "ticket", "🔁": "retry", "⚡": "bolt", "📌": "ux3-pin", "🗣": "ux3-talk", "🔗": "ux3-link", "🔤": "ux3-abc", "🤓": "ux3-user", "📘": "book", "⭐": "ux3-star", "💪": "bolt", "🏁": "ticket", "✨": "ux3-star", "📊": "ux3-num" };
  const RYS = { ...IKONY_WSPOLNE, ...IKONY_UX3 };
  const svg = (k) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${RYS[k]}</svg>`;
  const ANY_THEME = new Set(["bolt", "check", "cross", "retry"]); // proste znaki w currentColor: także w innych motywach
  function ico(k, cls) {
    if (!RYS[k] || (!green() && !ANY_THEME.has(k))) return null;
    const s = document.createElement("span");
    s.className = "lp-ux-ico" + (cls ? " " + cls : ""); s.setAttribute("aria-hidden", "true"); s.innerHTML = svg(k);
    return s;
  }
  let icoDone = false;
  function icons() {
    const I = A().H2_ICO; if (!I || icoDone) return; icoDone = true;
    for (const k of Object.keys(RYS)) if (!I[k]) I[k] = svg(k);
  }

  // ---------- etap 4: ikony w kickerach, emoji poza treścią, „Cofnij”, mały Staś przy czytaniu ----------
  function kickIco(e) {
    const k = String(e || "").replace(/\uFE0F/g, "");
    if (!green()) return null;
    if (k === "🔥" || k === "⚔") { const H = A().h2Ico; return H ? H(k === "🔥" ? "flame" : "miecze", e) : null; }
    return KICK[k] ? ico(KICK[k], "lp-kick-i") : null;
  }
  const EMO = /[\p{Extended_Pictographic}\uFE0F\u200D\u20E3]/gu;
  const CONTENT = ".lp-text, .lp-big, .lp-quote, .q, [translate=no], .lp-sw .face, .lp-formula, textarea, input, .lp-gap, .lp-flow, .lp-steps, .lp-marks, .lp-layers, .lv-table, .lv-chart, .lp-tip, .lp-fb-why, .lp-ans";
  const STAR = '<svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true"><path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.5 1.1 6.3L12 17.3l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" fill="currentColor"/></svg>';
  function scrub(root) {
    if (!green() || !root) return;
    root.querySelectorAll?.(".lp-star:not([data-ux3])").forEach((s) => { s.dataset.ux3 = "1"; s.innerHTML = STAR; });
    root.querySelectorAll?.("[data-ux3ico]:not([data-ux3done])").forEach((b) => { b.dataset.ux3done = "1"; const i = ico(b.dataset.ux3ico, "lp-tf-i"); if (i) b.prepend(i); });
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const fix = [];
    for (let n = w.nextNode(); n; n = w.nextNode()) { if (!EMO.test(n.textContent)) continue; EMO.lastIndex = 0; const e = n.parentElement; if (!e || e.closest(CONTENT)) continue; fix.push(n); }
    for (const n of fix) { const t = n.textContent.replace(EMO, "").replace(/\s{2,}/g, " "); n.textContent = /^\s*$/.test(t) ? "" : n.previousSibling || n.parentElement.firstChild !== n ? t : t.replace(/^\s+/, ""); }
  }
  let mo = null;
  function watch() {
    if (mo) return;
    mo = new MutationObserver((recs) => {
      for (const r of recs) {
        const t = r.target.nodeType === 3 ? r.target.parentElement : r.target;
        const lp = t?.closest?.(".lp"); if (lp) { scrub(lp); if ([...r.addedNodes].some((x) => x.classList?.contains("lp-card"))) lp.querySelectorAll(".lp-confetti").forEach((c) => c.classList.add("lpux-fade")); }
        for (const x of r.addedNodes) if (x.nodeType === 1 && (x.classList.contains("lp") || x.classList.contains("lp-banner"))) scrub(x);
      }
    });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  function undo(msg, fn) {
    const { h, LP } = A(); if (!h || !LP?.el?.root) return;
    LP.el.root.querySelectorAll(".lp-undo").forEach((x) => x.remove());
    let t = 0;
    const box = h("div", { class: "lp-undo", role: "status" }, h("span", { text: msg }), h("button", { type: "button", class: "btn", onclick: () => { clearTimeout(t); box.remove(); fn(); } }, "Cofnij"));
    LP.el.root.append(box); t = setTimeout(() => box.remove(), 4000);
    try { const f = LP.el.root.querySelector(".lp-bottom").getBoundingClientRect(); box.style.bottom = Math.round(innerHeight - f.top + 12) + "px"; } catch {}
  }
  function readStas() {
    const { stasFace } = A(); if (!green() || !stasFace) return null;
    const f = stasFace("hi"); f.classList.add("lp-read-stas"); return f;
  }

  // ---------- etap 1–2: werdykt w dolnym pasku, Staś, combo ----------
  const SAY = ["Spokojnie, ten błąd się przyda.", "Prawie. Spójrz na wyjaśnienie.", "To częsta pułapka."];
  const hashN = (s) => { let x = 0; for (const c of String(s || "")) x = (x * 31 + c.charCodeAt(0)) >>> 0; return x; };
  function fbar(fb, card) {
    const { h, LP, lpReduced, lpFloat, stasFace } = A();
    if (!h || !LP?.el?.fbar) return false;
    icons();
    const bar = LP.el.fbar, root = LP.el.root;
    if (!fb) { if (bar.childNodes.length) bar.replaceChildren(); delete root.dataset.fb; bar.classList.remove("lp-fbar-more"); LP.floatPending = null; return true; }
    const gain = LP.gain && LP.gain.id === card?.id ? LP.gain.n : 0;
    const cm = fb.ok && LP.comboMsg && LP.comboMsg.id === card?.id ? LP.comboMsg : null;
    const t = h("span", { class: "lp-fb-t", text: fb.title });
    const v = h("p", { class: "v" }, ico(fb.ok ? "check" : "cross", "lp-fb-ico") || h("span", { class: "lp-fb-ico", "aria-hidden": "true", text: fb.ok ? "✓" : "✗" }), t,
      cm ? h("span", { class: "lp-fb-combo" }, ico("bolt"), h("span", { text: cm.bonus ? `${cm.n} z rzędu! +${cm.bonus} XP` : `${cm.n} z rzędu!` })) : null,
      gain > 0 && lpReduced() ? h("span", { class: "lp-fb-xp", text: `+${gain} XP` }) : null);
    // Kolejność: werdykt, „Czemu nie X?” i informacja o drugiej szansie, na końcu pełne „Dlaczego”.
    const body = (fb.body || []).filter(Boolean), why = body.filter((x) => x.classList?.contains("lp-fb-why")), rest = body.filter((x) => !why.includes(x));
    // Po dobrej odpowiedzi „Dlaczego” zwinięte do 2 linii z „Więcej”; po złej całe.
    if (fb.ok) why.forEach((w) => { if ((w.textContent || "").length > 110) { w.classList.add("lp-fb-clamp"); const more = h("button", { type: "button", class: "btn ghost lp-fb-more", "aria-expanded": "false", onclick: () => { w.classList.remove("lp-fb-clamp"); more.remove(); } }, "Więcej"); w.after?.(more); w._more = more; } });
    const main = h("div", { class: "lp-fb-main" }, v, ...rest, ...why.flatMap((w) => [w, w._more].filter(Boolean)));
    const kids = [];
    if (green() && stasFace) {
      const f = stasFace(fb.ok ? "ok" : "oops"); f.classList.add("lp-fb-stas"); if (cm && cm.n >= 3) f.classList.add("lp-fb-hop"); kids.push(f);
      if (!fb.ok) { LP.sayN = ((LP.sayN ?? hashN(card?.id)) + (LP.sayFor === card?.id ? 0 : 1)) % SAY.length; LP.sayFor = card?.id; main.insertBefore(h("p", { class: "lp-fb-say", text: SAY[LP.sayN] }), v.nextSibling); }
    }
    bar.replaceChildren(...kids, main);
    root.dataset.fb = fb.ok ? "ok" : "no";
    bar.scrollTop = 0;
    if (LP.floatPending) { const txt = LP.floatPending; LP.floatPending = null; if (!lpReduced()) lpFloat(txt, t, ""); }
    requestAnimationFrame(() => {
      bar.classList.toggle("lp-fbar-more", bar.scrollHeight > bar.clientHeight + 4);
      // Wybrana zła i poprawna odpowiedź widoczne nad panelem (gdy obie się nie mieszczą, ważniejsza jest poprawna).
      try {
        const st = LP.el.stage, r = st.querySelector(".lp-card .opt.right"), w = st.querySelector(".lp-card .opt.wrong");
        if (r) { const sr = st.getBoundingClientRect(), a = [r, w].filter(Boolean).map((e) => e.getBoundingClientRect()), top = Math.min(...a.map((x) => x.top)), bot = Math.max(...a.map((x) => x.bottom));
          let d = 0; if (bot - top <= sr.height - 8) { if (top < sr.top) d = top - sr.top - 4; else if (bot > sr.bottom) d = bot - sr.bottom + 4; } else { const rr = r.getBoundingClientRect(); if (rr.top < sr.top || rr.bottom > sr.bottom) d = rr.top - sr.top - 4; }
          if (d) st.scrollBy({ top: d, behavior: lpReduced() ? "auto" : "smooth" }); }
      } catch {}
    });
    return true;
  }
  // Pytanie o dźwięki: raz, po pierwszej skończonej części (bm-dzwieki = "1" / "0").
  function pytanieDzwieki() {
    const { h, ls } = A(); if (!h || ls.get("bm-dzwieki") != null) return null;
    // Najwyżej dwa razy (zamknięte bez wyboru wraca jeszcze raz po kolejnej części), potem cisza = „Nie teraz”.
    const n = +(ls.get("bm-dzwieki-ask") || 0); if (n >= 2) { ls.set("bm-dzwieki", "0"); return null; } ls.set("bm-dzwieki-ask", String(n + 1));
    const box = h("div", { class: "lp-snd-ask", role: "group", "aria-label": "Dźwięki przy odpowiedziach" },
      ico("ux3-glos", "lp-snd-ico"), h("p", { text: "Włączyć krótkie dźwięki przy odpowiedziach?" }),
      h("div", { class: "lp-snd-btns" },
        h("button", { type: "button", class: "btn primary", onclick: () => { ls.set("bm-dzwieki", "1"); try { window.SKROT_KOSM?.sound?.("ok"); } catch {} box.replaceChildren(h("p", { text: "Dźwięki włączone. Zmienisz to w Ustawieniach." })); } }, "Włącz"),
        h("button", { type: "button", class: "btn ghost", onclick: () => { ls.set("bm-dzwieki", "0"); box.remove(); } }, "Nie teraz")));
    return box;
  }
  // Ustawienia → Animacje: dwa przełączniki (dźwięki odpowiedzi, wibracje).
  function ustawienia() {
    const { h, ls, render } = A(); if (!h) return [];
    const row = (key, k, label, on, sub, flip) => h("button", { type: "button", class: "mi more-row", role: "switch", "aria-checked": String(on), "data-ux3": key, onclick: () => { flip(); render(); } },
      (() => { const sp = h("span", { class: "ico", "aria-hidden": "true" }); sp.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${RYS[k]}</svg>`; return sp; })(), h("span", { class: "more-txt" }, h("span", { text: label }), h("small", { text: sub })),
      h("span", { class: "switch", "aria-hidden": "true", "aria-checked": String(on), style: "margin-left:auto" }, h("i")));
    const snd = ls.get("bm-dzwieki") === "1", vib = ls.get("bm-wibracje") !== "0";
    return [row("dzwieki", "ux3-glos", "Dźwięki przy odpowiedziach", snd, "krótki dźwięk przy dobrej i złej odpowiedzi", () => ls.set("bm-dzwieki", snd ? "0" : "1")),
      row("wibracje", "ux3-wibr", "Wibracje", vib, "krótka wibracja przy odpowiedzi (Android)", () => ls.set("bm-wibracje", vib ? "0" : "1"))];
  }

  // ---------- CSS (tylko .lp-* i .rv-hero; ruch wyłączany przez reduced-motion i html.calm) ----------
  const CSS = `
.lp-bottom { flex-wrap: wrap; }
.lp-bottom .lp-cta { justify-content: center; text-align: center; }
.lp-fbar { flex: 1 0 100%; display: flex; gap: 10px; align-items: flex-start; max-height: 38dvh; overflow-y: auto; overscroll-behavior: contain; padding: 2px 2px 4px; }
.lp-fbar:empty { display: none; }
.lp-fb-main { display: grid; gap: 5px; min-width: 0; flex: 1; }
.lp-fbar p { margin: 0; }
.lp-fbar .v { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 1.12rem; line-height: 1.25; }
.lp-fbar .lbl { font-weight: 700; }
.lp-fb-ico { display: inline-grid; place-items: center; flex: none; width: 24px; height: 24px; }
.lp-fb-ico svg { width: 24px; height: 24px; display: block; }
.lp-fb-later { display: flex; gap: 6px; align-items: center; }
.lp-ux-ico { display: inline-grid; place-items: center; flex: none; }
.lp-ux-ico svg { width: 18px; height: 18px; display: block; }
.lp[data-fb="ok"] .lp-fbar .v { color: var(--good); }
.lp[data-fb="no"] .lp-fbar .v { color: var(--bad); }
html:not([data-theme]) .lp-bottom { transition: background-color .18s ease, border-color .18s ease; }
html:not([data-theme]) .lp[data-fb="ok"] .lp-bottom { background: var(--h-acc-soft); border-top-color: color-mix(in srgb, var(--accent) 45%, transparent); }
html:not([data-theme]) .lp[data-fb="ok"] .lp-fbar .v { color: var(--accent-text); }
html:not([data-theme]) .lp[data-fb="no"] .lp-bottom { background: var(--bad-soft); border-top-color: color-mix(in srgb, var(--bad) 45%, transparent); }
html:not([data-theme]) .lp[data-fb="no"] .lp-fbar .v { color: var(--bad); }
html:not([data-theme]) .lp[data-fb] .lp-fbar { color: var(--ink); }
html:not([data-theme]) .lp[data-fb="no"] .lp-cta { background: var(--bad); border-color: var(--bad); color: #FFFFFF; box-shadow: 0 4px 0 color-mix(in srgb, var(--bad) 62%, #000); }
html[data-green="dark"]:not([data-theme]) .lp[data-fb="no"] .lp-cta { color: var(--accent-ink); }
html:not([data-theme]) .lp[data-fb] .lp-help { background: var(--surface); }
.lp-float.lp-float-fb { z-index: 91; }
@keyframes lpux-fbin { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: no-preference) { html:not(.calm) .lp-fbar:not(:empty) { animation: lpux-fbin .22s cubic-bezier(.2, .8, .2, 1) both; } }
@media (prefers-reduced-motion: reduce) { html:not([data-theme]) .lp-bottom { transition: none; } }
html.calm .lp-bottom { transition: none !important; }
/* Cel dotyku ✕ ≥ 44 px; litera złej odpowiedzi czytelna w ciemnym (jasna czerwień + ciemny tekst). */
.lp-top .lp-x { width: 44px; height: 44px; }
html[data-green="dark"]:not([data-theme]) .lp-opts .opt.wrong .k { color: var(--accent-ink); }
/* Ograniczony ruch: w odtwarzaczu i na mapie lekcji żadnych animacji ani przejść (także starych lp-in, lp-pop, lp-ok). */
@media (prefers-reduced-motion: reduce) { .lp, .lp *, .lp-map, .lp-map *, .lp-float, .lp-banner { animation: none !important; transition: none !important; } }
html.calm :is(.lp, .lp *, .lp-map, .lp-map *, .lp-float, .lp-banner) { animation: none !important; transition: none !important; }
/* Nagłówek: pasek postępu ma pierwszeństwo; stałe liczniki XP i monet poza widokiem (nagroda jest przy werdykcie, lpFloat dalej je widzi). */
.lp-top .lp-xpchip, .lp-top .lp-coinchip { position: absolute !important; width: 1px; height: 1px; padding: 0 !important; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; box-shadow: none !important; }
/* Etap 2: Staś w panelu, dymek, combo, pytanie o dźwięki. */
.lp-fbar .stas-face.lp-fb-stas { width: 48px; height: 48px; min-width: 48px; flex: none; display: block; }
.lp-fb-stas svg { width: 48px; height: 48px; display: block; }
@keyframes lpux-hop { 0%, 100% { transform: none; } 40% { transform: translateY(-6px); } }
@media (prefers-reduced-motion: no-preference) { html:not(.calm) .lp-fb-stas.lp-fb-hop { animation: lpux-hop .35s ease-out 1; } }
.lp-fb-say { font-size: .9rem; font-weight: 700; color: var(--ink); background: var(--surface); border: 1.5px solid var(--line); border-radius: 12px; padding: 4px 10px; justify-self: start; position: relative; margin-left: 6px !important; }
.lp-fb-say::before { content: ""; position: absolute; left: -7px; top: 50%; width: 10px; height: 10px; background: inherit; border-left: 1.5px solid var(--line); border-bottom: 1.5px solid var(--line); transform: translateY(-50%) rotate(45deg); }
/* Etap 3: zaznaczona opcja, przyciski w dolnym pasku, oceny, bank pojęć. */
.lp .lp-opts .opt.sel, .lp .lp-bank .opt.sel { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent) inset; background: var(--accent-soft); }
html:not([data-theme]) .lp .lp-opts .opt.sel, html:not([data-theme]) .lp .lp-bank .opt.sel { background: var(--h-acc-soft); }
.lp-barx { flex: 1 1 100%; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.lp-barx[hidden] { display: none; }
.lp-barx > .btn { flex: 1 1 0; min-height: 54px; justify-content: center; font-size: 1.04rem; border-radius: 16px; }
.lp-barx > .lp-confbtn { min-height: 54px; }
.lp-conf-ask { flex: 1 0 100%; margin: 0; font-size: .86rem; font-weight: 700; color: var(--muted); text-align: center; }
.lp-barx .sk-grade4 { flex: 1 1 100%; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.lp-barx .sk-grade4 .opt { min-height: 56px; flex-direction: column; justify-content: center; gap: 2px; padding: 6px 4px; text-align: center; font-size: .92rem; }
.lp-barx .sk-grade4 .opt .k { margin: 0; }
.lp-barx .g-short { display: none; }
@media (max-width: 400px) { .lp-barx .g-long { display: none; } .lp-barx .g-short { display: inline; } }
.lp-bank { display: grid; gap: 8px; }
.lp .lp-row.sk-links .btn, .lp .lp-row.sk-links .slide-ref { min-height: 44px; }
.lp .lp-bank .opt { display: flex; grid-template-columns: none; justify-content: center; text-align: center; min-height: 48px; font-weight: 700; }
.lp .lp-bank .opt > span { flex: 0 1 auto; }
.lp-fbar .v { flex-wrap: wrap; row-gap: 4px; }
.lp-fbar .v .lp-fb-t { flex: 1 1 0; min-width: 65%; }
.lp-fb-combo { display: inline-flex; align-items: center; gap: 4px; font-size: .92rem; padding: 2px 10px; border-radius: 999px; background: var(--lime-100); color: var(--ink); }
html:not([data-theme]) .lp-fb-combo { background: var(--h-lime); color: var(--h-lime-ink); }
.lp-fb-xp { font-size: .92rem; padding: 2px 10px; border-radius: 999px; background: var(--surface); color: var(--ink); }
.lp-fb-clamp { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.lp-fbar .lp-fb-more { justify-self: start; min-height: 44px; padding: 6px 14px; }
.lp-fbar.lp-fbar-more { -webkit-mask-image: linear-gradient(#000 82%, transparent); mask-image: linear-gradient(#000 82%, transparent); }
.lp-combo { background: var(--lime-100); color: var(--lime-700); display: inline-flex; align-items: center; gap: 3px; }
html:not([data-theme]) .lp-combo { background: var(--h-lime); color: var(--h-lime-ink); }
.lp-combo .lp-ux-ico svg { width: 16px; height: 16px; }
.lp-snd-ask { display: grid; grid-template-columns: auto 1fr; gap: 6px 10px; align-items: center; padding: 12px 14px; border-radius: 18px; background: var(--surface); border: 2px solid var(--line); text-align: left; }
.lp-snd-ask > p { margin: 0; font-weight: 700; }
.lp-snd-ask > p:only-child { grid-column: 1 / -1; }
.lp-snd-btns { grid-column: 1 / -1; display: flex; gap: 10px; }
.lp-snd-btns .btn { flex: 1; min-height: 44px; justify-content: center; }
/* Inne motywy: dolny pasek też barwi się werdyktem (kolory motywu). */
html[data-theme] .lp[data-fb="ok"] .lp-bottom { background: var(--good-soft); }
html[data-theme] .lp[data-fb="no"] .lp-bottom { background: var(--bad-soft); }
/* Etap 4: nagłówek, „Pomiń krok”, karta czytania, ikony. */
.lp-kick-ico { display: flex; align-items: center; gap: 6px; }
.lp-kick-ico > .lp-ux-ico svg, .lp-kick-ico > .h2-ico svg { width: 16px; height: 16px; }
.lp-kick-was { color: var(--muted); font-weight: 700; }
.lp-help .lp-ux-ico { margin-right: 2px; }
.lp-tf-i svg { width: 20px; height: 20px; }
.lp-star svg { width: 1em; height: 1em; display: inline-block; vertical-align: -0.1em; }
html:not([data-theme]) .lp-star { color: var(--h-lime-edge); }
html:not([data-theme]) .lp-star.off { color: var(--line); }
@media (max-width: 420px) { .lp-top .lp-combo { padding-left: 7px; padding-right: 8px; } .lp-top .lp-combo > span:last-child { display: inline-block; width: 1.55em; overflow: hidden; white-space: nowrap; vertical-align: bottom; } .lp-top .lp-combo[data-d="2"] > span:last-child { width: 2.15em; } }
html:not([data-theme]) .lp-top .lp-bar { flex: 1 1 auto; min-width: 0; }
.lp-top.ld-top { flex-wrap: wrap; row-gap: 2px; }
.lp-top.ld-top .ld-seg { order: 9; flex: 1 0 100% !important; background: none !important; box-shadow: none !important; padding: 0 0 0 52px !important; font-size: .78rem; font-weight: 700; color: var(--muted); min-height: 0; max-width: none; }
.lp-top.ld-top .ld-seg > span:first-child { display: none; }
.lp-top.ld-top .ld-seg > span:last-child { position: static !important; width: auto !important; height: auto !important; clip: auto !important; overflow: visible !important; }
.lp-bottom .ld-skip { flex: 0 0 auto; min-height: 54px; border-radius: 16px; display: inline-flex; align-items: center; gap: 6px; font-weight: 800; }
.lp-bottom .ld-skip[hidden], .lp[data-fb] .lp-bottom .ld-skip { display: none; }
.lp-undo { position: fixed; left: 50%; transform: translateX(-50%); bottom: calc(96px + env(safe-area-inset-bottom, 0px)); z-index: 96; display: flex; align-items: center; gap: 12px; padding: 6px 6px 6px 16px; border-radius: 16px; background: var(--ink); color: var(--paper); font-weight: 700; max-width: calc(100vw - 32px); box-shadow: 0 8px 24px -10px rgba(0,0,0,.5); }
.lp-undo .btn { min-height: 44px; background: var(--paper); color: var(--ink); border-color: var(--paper); }
/* Karta czytania: wyśrodkowana, tekst 20 px, mały Staś; ≥ 900 px karta ≤ 720 px i Staś obok. */
.lp-stage:has(> .lp-card[data-type="read"]) { display: grid; align-content: center; }
.lp-card[data-type="read"] { position: relative; min-height: min(46dvh, 420px); display: grid; align-content: center; gap: 10px; width: 100%; box-sizing: border-box; }
.lp-card[data-type="read"] .lp-text, .lp-card[data-type="read"] .lp-text p, .lp-card[data-type="read"] .lp-text li { font-size: 1.25rem; line-height: 1.5; }
.lp-read-stas { position: absolute; top: 10px; right: 12px; width: 40px; height: 40px; }
.lp-read-stas svg { width: 40px; height: 40px; display: block; }
.lp-card[data-type="read"] .lp-kick { padding-right: 48px; }
@media (min-width: 900px) {
  .lp-card[data-type="read"] { max-width: 720px; margin: 0 auto; }
  .lp-card[data-type="read"] .lp-read-stas { top: 50%; right: auto; left: -132px; width: 112px; height: 112px; transform: translateY(-50%); }
  .lp-card[data-type="read"] .lp-read-stas svg { width: 112px; height: 112px; }
  .lp-card[data-type="read"] .lp-kick { padding-right: 0; }
}
/* Dolny pasek nieprzezroczysty i nad konfetti we wszystkich motywach; konfetti gaśnie przy nowej karcie; krótsze wejście opcji. */
.lp .lp-bottom { background: var(--surface, var(--paper)); border-top: 1.5px solid var(--line); z-index: 3; }
html[data-theme] .lp:not([data-fb]) .lp-bottom { background: var(--surface, var(--paper)); }
.lp-confetti.lpux-fade { opacity: 0; transition: opacity .3s; }
.lp-fresh .lp-stag > * { animation-delay: calc(var(--i, 0) * 40ms) !important; }
@media (max-width: 380px) { .lp-barx .sk-grade4 .opt { font-size: .82rem; padding: 6px 2px; } }
/* Karta „Dziś do powtórki” w limonce H2 (zamiast pomarańczu), w ciemnym bez brązu. */
html:not([data-theme]) .rv-hero { --h-rv-bg: var(--lime-100); --h-rv-line: color-mix(in srgb, var(--h-lime) 70%, var(--h-line)); --h-rv-edge: var(--lime-400); --h-rv-num: var(--ink); --h-rv-ink: var(--h-muted); }
html[data-green="dark"]:not([data-theme]) .rv-hero { --h-rv-bg: var(--lime-100); --h-rv-line: color-mix(in srgb, var(--lime-400) 30%, var(--h-line)); --h-rv-edge: color-mix(in srgb, var(--lime-400) 45%, var(--h-paper)); --h-rv-num: var(--ink); --h-rv-ink: var(--h-muted); }
`;
  function css() {
    if (document.getElementById("lekcja-ux-css")) return;
    const s = document.createElement("style"); s.id = "lekcja-ux-css"; s.textContent = CSS;
    document.head.append(s);
  }
  css();
  window.ZD_LEKCJA = { fbar, ico, icons, pytanieDzwieki, ustawienia, kickIco, undo, readStas, scrub, IKONY: RYS };
  if (document.body) watch(); else document.addEventListener("DOMContentLoaded", watch);
})();
