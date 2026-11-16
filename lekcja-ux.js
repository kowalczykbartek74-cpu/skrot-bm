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
  const IKONY_UX3 = {};
  const RYS = { ...IKONY_WSPOLNE, ...IKONY_UX3 };
  const svg = (k) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${RYS[k]}</svg>`;
  function ico(k, cls) {
    if (!green() || !RYS[k]) return null;
    const s = document.createElement("span");
    s.className = "lp-ux-ico" + (cls ? " " + cls : ""); s.setAttribute("aria-hidden", "true"); s.innerHTML = svg(k);
    return s;
  }
  let icoDone = false;
  function icons() {
    const I = A().H2_ICO; if (!I || icoDone) return; icoDone = true;
    for (const k of Object.keys(RYS)) if (!I[k]) I[k] = svg(k);
  }

  // ---------- etap 1: werdykt w dolnym pasku ----------
  function fbar(fb, card) {
    const { h, LP, lpReduced, lpFloat } = A();
    if (!h || !LP?.el?.fbar) return false;
    icons();
    const bar = LP.el.fbar, root = LP.el.root;
    if (!fb) { if (bar.childNodes.length) bar.replaceChildren(); delete root.dataset.fb; LP.floatPending = null; return true; }
    const gain = LP.gain && LP.gain.id === card?.id ? LP.gain.n : 0;
    const t = h("span", { class: "lp-fb-t", text: fb.title });
    const v = h("p", { class: "v" }, ico(fb.ok ? "check" : "cross", "lp-fb-ico") || h("span", { class: "lp-fb-ico", "aria-hidden": "true", text: fb.ok ? "✓" : "✗" }), t,
      gain > 0 && lpReduced() ? h("span", { class: "lp-fb-xp", text: ` · +${gain} XP` }) : null);
    const main = h("div", { class: "lp-fb-main" }, v, ...(fb.body || []).filter(Boolean));
    bar.replaceChildren(main);
    bar.dataset.ok = fb.ok ? "1" : "0";
    root.dataset.fb = fb.ok ? "ok" : "no";
    bar.scrollTop = 0;
    // Poprawna odpowiedź zostaje widoczna nad panelem (karta przewija się do niej, bez animacji przy ograniczonym ruchu).
    requestAnimationFrame(() => { try { LP.el.stage.querySelector(".lp-card .opt.right")?.scrollIntoView({ block: "nearest", behavior: lpReduced() ? "auto" : "smooth" }); } catch {} });
    if (LP.floatPending) { const txt = LP.floatPending; LP.floatPending = null; if (!lpReduced()) lpFloat(txt, t, ""); }
    return true;
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
  window.ZD_LEKCJA = { fbar, ico, icons, IKONY: RYS };
})();
