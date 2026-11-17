// Nagrody, ranking i udostępnianie (pętla UX-5). Korzysta z aplikacji przez window.ZD_APP (most w index.html),
// zawsze w chwili wywołania, nie przy wczytaniu pliku. Wystawia window.ZD_NAGRODY (umowa między pętlami:
// odznaka(id) i karta(opcje); reszta to pomocnicze dla funkcji pętli 5 w index.html).
// Monety liczy wyłącznie baza: tu tylko wołamy funkcje SQL (v58–v62) i pokazujemy wynik.
(() => {
  "use strict";
  const A = () => window.ZD_APP || {};
  const sb = () => window.skrot?.sb || null;
  const EN = () => window.SKROT_LANG === "en";

  // ---------- ikony (A4d: kreska, currentColor, 24×24; własne z prefiksem ux5-) ----------
  const SVG = (d, cls) => `<svg class="ux5-svg${cls ? " " + cls : ""}" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const IKONY_WSPOLNE = {
    bolt:   '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    book:   '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 21.5V4.5"/>',
    check:  '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.6 2.6L16 9.5"/>',
    retry:  '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
    lock:   '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    play:   '<circle cx="12" cy="12" r="9"/><path d="M10 8.5l5.5 3.5-5.5 3.5z"/>',
    snow:   '<path d="M12 2v20M4.9 6.5l14.2 11M19.1 6.5L4.9 17.5"/><path d="M9.5 3.5L12 6l2.5-2.5M9.5 20.5L12 18l2.5 2.5"/>',
    share:  '<path d="M12 3v12M7.5 7.5L12 3l4.5 4.5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
  };
  const IKONY_UX5 = {
    "ux5-chest-open": '<path d="M4 12h16v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M4 12L6 5h12l2 7"/><path d="M9 12v2h6v-2"/><path d="M12 2v1M8 3l.6.9M16 3l-.6.9"/>',
    "ux5-sprout":  '<path d="M12 21v-9"/><path d="M12 12C12 7 8.5 4.5 4 5c0 4.5 3.5 7 8 7z"/><path d="M12 14c0-4 3-6.5 8-6 0 4-3 6.5-8 6z"/>',
    "ux5-target":  '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    "ux5-cap":     '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c2 2 10 2 12 0v-5"/><path d="M22 9v6"/>',
    "ux5-duo":     '<circle cx="8.5" cy="8" r="3.2"/><circle cx="16" cy="9" r="2.6"/><path d="M2.5 20c.8-3.6 3-5.5 6-5.5s5.2 1.9 6 5.5"/><path d="M15 14.6c2.8-.3 5 1.4 6.2 4.6"/>',
    "ux5-heart":   '<path d="M12 20s-7.5-4.6-9-9.3C2 7.5 4 4.5 7.2 4.5c2 0 3.6 1.2 4.8 3 1.2-1.8 2.8-3 4.8-3 3.2 0 5.2 3 4.2 6.2C19.5 15.4 12 20 12 20z"/>',
    "ux5-search":  '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/>',
    "ux5-cal":     '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    "ux5-chart":   '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
    "ux5-chess":   '<path d="M8 21h8M9 18h6l-1-6h-4z"/><path d="M10 12l-2-4 4-3 4 3-2 4"/>',
    "ux5-compass": '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    "ux5-rocket":  '<path d="M12 15c-2-2-3-6 0-11 3 5 2 9 0 11z"/><path d="M9.5 13L6 16l1.5 3L10 16.5M14.5 13l3.5 3-1.5 3L14 16.5"/><circle cx="12" cy="9" r="1.2"/>',
    "ux5-scope":   '<path d="M3 13l12-6 2 4-12 6z"/><path d="M15 7l3-1.5 2 4-3 1.5"/><path d="M9 15l-2 6M10 14.5L13 21"/>',
    "ux5-owl":     '<path d="M5 20V9a7 7 0 0 1 14 0v11z"/><circle cx="9" cy="10" r="2"/><circle cx="15" cy="10" r="2"/><path d="M11 14l1 1.5 1-1.5"/>',
    "ux5-case":    '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V4h6v3M3 12h18"/>',
    "ux5-office":  '<path d="M4 21V5l8-2v18M12 8l8 2v11M3 21h18"/><path d="M7 8h2M7 12h2M7 16h2M15 13h2M15 17h2"/>',
    "ux5-tie":     '<path d="M9 3h6l-1.5 3L16 17l-4 4-4-4 2.5-11z"/>',
    "ux5-crown":   '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
    "ux5-gem":     '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M9 3l3 18M15 3l-3 18"/>',
    "ux5-flame":   '<path d="M12 3c1 3.5 5 5.5 5 10.5a5 5 0 0 1-10 0c0-2.4 1.2-3.9 2.3-4.8.1 1.8 1 2.8 2 3.1-.4-2.8 0-6 .7-8.8z"/>',
    "ux5-bulb":    '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>',
    "ux5-word":    '<path d="M5 20L10.5 4h3L19 20"/><path d="M7.5 13h9"/>',
    "ux5-palette": '<path d="M12 3a9 9 0 1 0 0 18c1.2 0 2-.8 2-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7.5" r="1"/><circle cx="14.5" cy="7.5" r="1"/>',
    "ux5-user":    '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    "ux5-gift":    '<rect x="3" y="8" width="18" height="5" rx="1"/><path d="M5 13v8h14v-8M12 8v13"/><path d="M12 8C10 4 6 4 7 7c.5 1 3 1 5 1zM12 8c2-4 6-4 5-1-.5 1-3 1-5 1z"/>',
    "ux5-trophy":  '<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/><path d="M12 14v4M8 21h8M9 18h6"/>',
    "ux5-medal":   '<circle cx="12" cy="15" r="5"/><path d="M8.5 10.5L6 3h4l2 4 2-4h4l-2.5 7.5"/>',
    "ux5-star":   '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    "ux5-chest":  '<path d="M4 10h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M4 10V8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2"/><path d="M4 13h16"/><rect x="10" y="11.5" width="4" height="4" rx="1"/>',
  };
  IKONY_WSPOLNE.eye = '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>';
  const ikony = { ...IKONY_WSPOLNE, ...IKONY_UX5 };
  // Węzeł ikony (span z SVG). Moneta to zawsze ten sam rysunek co w nagłówku (H2_ICO.coin, wyjątek marki).
  function ikona(k, cls) {
    const el = document.createElement("span"); el.className = "ux5-ico" + (cls ? " " + cls : ""); el.setAttribute("aria-hidden", "true");
    el.innerHTML = k === "coin" || k === "flame" ? (A().H2_ICO?.[k] || "") : ikony[k] ? SVG(ikony[k]) : "";
    return el;
  }
  // „N [moneta]” jako tekst z ikoną SVG (zamiast emoji monety). Zwraca span: liczba czytana przez czytnik + „monet”.
  function coinTxt(n, o = {}) {
    const el = document.createElement("span"); el.className = "ux5-coin num" + (o.cls ? " " + o.cls : "");
    const t = document.createElement("span"); t.textContent = (o.plus && n > 0 ? "+" : "") + String(n);
    el.append(t, ikona("coin", "ux5-coin-i"));
    el.setAttribute("aria-label", `${(o.plus && n > 0 ? "+" : "") + n} ${monetTxt(n)}`);
    return el;
  }
  const monetTxt = (n) => (A().plural ? A().plural(Math.abs(n), "moneta", "monety", "monet") : "monet");

  // ---------- CSS (paleta H2: tylko zmienne) ----------
  const CSS = `
.ux5-ico { display: inline-flex; vertical-align: -.2em; }
.ux5-ico svg { width: 1.15em; height: 1.15em; }
.ux5-coin { display: inline-flex; align-items: center; gap: 3px; font-weight: 800; white-space: nowrap; }
.ux5-coin .ux5-coin-i svg { width: 1.05em; height: 1.05em; }
.sk-dot .ux5-ico svg { width: 22px; height: 22px; }
.sk-node .t .sk-state { font-family: var(--f-body, inherit); font-size: .86rem; font-weight: 700; color: var(--h-acc, var(--accent)); }
#main .ux5-help > summary, #main .src-switch .once-q > summary, #main .book .once-q > summary { min-width: 44px; min-height: 44px; display: inline-grid; place-items: center; }
#main .cover .po-cover-btn, #main .cover-more > summary, #main .src-switch .seg button, #main .pmap-fold > .fold-sum { min-height: 44px; }
#main .cover-more > summary { display: flex; align-items: center; }
.sk-node .t .sk-doing { display: inline-flex; align-items: center; gap: 8px; font-size: .84rem; font-weight: 700; color: var(--muted); }
.unit h3 .u-n { margin-left: auto; flex: none; font-size: .8rem; font-weight: 700; color: var(--muted); }
.unit h3 .u-n.ok { color: var(--h-acc, var(--accent)); }
.ux5-mastery .ux5-sub { margin: 4px 0 0; font-size: .88rem; }
.sk-node.ux5-chest { align-items: center; }
.sk-node.ux5-chest .sk-dot { cursor: default; background: var(--h-orange-soft, var(--sunk)) !important; border: 3px dashed var(--h-orange, var(--edge)) !important; border-bottom-width: 7px !important; color: var(--h-orange, var(--muted)) !important; }
.sk-node.ux5-chest.ux5-ready .sk-dot { border-style: solid !important; }
.sk-node.ux5-chest.ux5-got .sk-dot { background: var(--h-lime, var(--accent-soft)) !important; border: 3px solid var(--h-lime-edge, var(--accent)) !important; border-bottom-width: 7px !important; color: var(--h-ink, var(--ink)) !important; }
.sk-node.ux5-chest.ux5-fresh .sk-dot { animation: ux5-pop .5s ease-out 1; }
@keyframes ux5-pop { 0% { transform: scale(.7); } 60% { transform: scale(1.12); } 100% { transform: scale(1); } }
html.calm .sk-node.ux5-chest .sk-dot { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .sk-node.ux5-chest .sk-dot { animation: none !important; } }
.sk-node.ux5-chest .t { cursor: default; gap: 4px; justify-items: start; }
.sk-node.ux5-chest .t b { display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.sk-node.ux5-chest .ux5-chest-pod { font-size: .86rem; color: var(--muted); }
#main .sk-node.ux5-chest .ux5-odbierz, #main .sk-node.ux5-chest .ux5-odbierz span { color: var(--accent-ink, #fff); font-size: .95rem; }
.sk-node.ux5-chest .ux5-odbierz, .sk-node.ux5-chest .ux5-kup, .sk-node.ux5-chest .t > .btn { min-height: 44px; margin-top: 4px; display: inline-flex; align-items: center; gap: 6px; }
/* Awatar Stasia przy kropce „Teraz” po prawej stronie kropki (z lewej wychodził poza ekran w lewej kolumnie zygzaku). */
#main .sk-course .sk-node.now .sk-dot::after { left: auto !important; right: -24px; top: -20px; }
.ux5-znak svg { width: 1.05em; height: 1.05em; vertical-align: -.16em; }
.ux5-znak-bolt { color: var(--h-orange, var(--warn)); }
.shop-hero .sk-bignum { display: inline-flex; align-items: center; gap: 8px; }
.shop-hero .shop-bigcoin svg { width: 36px; height: 36px; }
.ux5-wybor { min-height: 44px; justify-self: start; }
.lvup-choice { display: grid; gap: 10px; width: 100%; }
.lvup-pick { display: grid !important; grid-template-columns: 64px minmax(0, 1fr); gap: 4px 12px; align-items: center; text-align: left; }
.lvup-pick .lvup-sw { grid-row: span 2; }
.lvup-pick .lvup-wybieram { grid-column: 2; min-height: 44px; justify-self: start; }
.lvup-pick .lvup-or { grid-column: 2; }
.lvup-ask { margin: 4px 0 0; font-weight: 700; }
.hd-seria { display: flex; align-items: center; gap: 6px; }
.hd-streak { display: inline-flex; align-items: center; gap: 4px; }
.kshop-tab .ux5-ico svg, .shop-lockbtn .ux5-ico svg, .shop-pv .ux5-ico svg { width: 18px; height: 18px; }
.shop-sw-zoom .ux5-ico svg { width: 16px; height: 16px; }
/* Sklep: cele dotyku ≥ 44 px (przyciski kart, zadań, rozwijane sekcje). */
#main .shop-hero .shop-how > summary, #main .shop-hist > summary, #main .shop-card .btn, #main .sk-misje .btn, #main .misja .btn, #main .shop-misje .btn, #main .shop-mission .btn, #main .kshop .btn, #main .kshop-tab, #layer .lvup .btn { min-height: 44px; }
#main .shop-hero .shop-how > summary, #main .shop-hist > summary { display: flex; align-items: center; }
#layer .lv-prize.ux5-prize { color: var(--h-acc, var(--accent-text)); display: block; max-width: 100%; overflow-wrap: anywhere; }
.ux5-odznaki { display: grid; gap: 8px; }
.ux5-odznaki h2 { margin: 0; } .ux5-odznaki h3 { margin: 8px 0 0; font-size: 1rem; }
.ux5-odz-head { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.ux5-odz-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 8px; }
.ux5-odz { display: grid; justify-items: center; gap: 4px; min-height: 44px; min-width: 44px; padding: 10px 6px; border-radius: 18px; border: 2px solid var(--h-line, var(--line)); background: var(--h-card, var(--surface)); color: var(--h-ink, var(--ink)); font: inherit; cursor: pointer; text-align: center; }
.ux5-odz.off { border-style: dashed; border-color: var(--h-edge, var(--line)); background: transparent; }
.ux5-odz .ux5-odz-n { font-weight: 700; font-size: .86rem; line-height: 1.2; }
.ux5-odz small { font-size: .78rem; color: var(--h-muted, var(--muted)); }
.ux5-odz-ic { display: grid; place-items: center; width: 48px; height: 48px; border-radius: 50%; border: 3px solid var(--h-edge, var(--line)); background: var(--h-acc-soft, var(--accent-soft)); color: var(--h-acc, var(--accent)); }
.ux5-odz-ic svg { width: 26px; height: 26px; }
.ux5-odz-ic.t0 { background: transparent; border-style: dashed; color: var(--h-muted, var(--muted)); }
.ux5-odz-ic.t0 svg { opacity: .55; }
.ux5-odz-ic.t1 { border-color: var(--h-orange, var(--warn)); }
.ux5-odz-ic.t2 { border-color: var(--h-blue, var(--accent)); }
.ux5-odz-ic.t3 { border-color: #E0A20F; background: var(--h-lime, var(--accent-soft)); color: var(--h-ink, var(--ink)); }
.ux5-odz-gry > summary { display: flex; justify-content: space-between; align-items: center; min-height: 44px; font-weight: 700; cursor: pointer; }
.ux5-ark { display: grid; gap: 10px; }
.ux5-ark-top { display: flex; gap: 14px; align-items: center; }
.ux5-ark-top .ux5-odz-ic { width: 64px; height: 64px; flex: none; } .ux5-ark-top .ux5-odz-ic svg { width: 34px; height: 34px; }
.ux5-ark h2 { margin: 0; } .ux5-ark p { margin: 0; }
.ux5-ark-btns { justify-content: flex-end; gap: 8px; } .ux5-ark-btns .btn { min-height: 44px; }
.ux5-banner-ic svg { width: 20px; height: 20px; }
.ux5-lv-ic svg { width: 1.2em; height: 1.2em; }
.lv-badge .ux5-lv-ic svg, .rk-badge .ux5-lv-ic svg { width: 22px; height: 22px; }
.lv-badge.big .ux5-lv-ic svg, .rk-badge.big .ux5-lv-ic svg { width: 40px; height: 40px; }
#layer .lv-row.lv-next .lv-badge { border: 2px dashed var(--h-edge, var(--line)); background: transparent; color: var(--h-muted, var(--muted)); }
#layer .lv-row.lv-next .lv-badge .ico { filter: none; opacity: 1; }
#layer .lv-row .lv-badge { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; }
.rk-who { min-height: 44px; }
.rk-nick .rk-lv { margin-left: 6px; vertical-align: middle; }
.rk-badge.rk-lv { display: inline-flex; align-items: center; gap: 2px; padding: 0 6px; min-height: 22px; border-radius: 999px; font-size: .78rem; font-weight: 800; background: var(--h-acc-soft, var(--accent-soft)); color: var(--h-acc-edge, var(--accent-text)); }
.rk-badge.rk-lv .ux5-lv-ic svg { width: 14px; height: 14px; }
.ux5-prezent { display: grid; gap: 10px; }
.ux5-prezent h2 { margin: 0; } .ux5-prezent p { margin: 2px 0 0; }
.ux5-prezent-top { display: flex; gap: 12px; align-items: center; }
.ux5-prezent-ic { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; background: var(--h-lime, var(--accent-soft)); color: var(--h-ink, var(--ink)); flex: none; }
.ux5-prezent-opcje { display: flex; flex-wrap: wrap; gap: 8px; }
.ux5-prezent-opcje .btn { min-height: 44px; display: inline-flex; align-items: center; gap: 8px; }
.lv-badge .n, .rk-badge .n { font-size: 12px !important; color: #10231A !important; background: #CDF25E !important; }
#main .kgab-slot, #main .kprof-btn, #layer .lv-foot .link, #layer .lv-modal .btn, #layer .lv-head ~ .btn { min-height: 44px; }
#main .kgab-slot { min-width: 44px; }
#layer .lv-foot .link { display: inline-flex; align-items: center; }
#main .sk-profile .lv-howlink { min-height: 44px; display: inline-flex; align-items: center; }
.ux5-lv-kosm { display: grid; gap: 8px; width: 100%; }
.ux5-lv-kosm-k { display: grid; grid-template-columns: 56px minmax(0, 1fr); gap: 12px; align-items: center; text-align: left; padding: 10px 12px; border-radius: 18px; background: var(--h-acc-soft, var(--accent-soft)); }
.ux5-lv-kosm-pv { display: grid; place-items: center; width: 56px; height: 56px; }
.ux5-lv-kosm-pv svg { width: 56px; height: 56px; }
.ux5-lv-kosm-t { display: grid; gap: 2px; min-width: 0; }
#main .rk-row .rk-badge.rk-lv { position: static; width: auto; height: 22px; min-width: 0; padding: 0 7px 0 5px; border-radius: 999px; border: 0; box-shadow: none; display: inline-flex; gap: 3px; vertical-align: middle; background: var(--h-acc-soft, var(--accent-soft)); color: var(--h-ink, var(--ink)); }
#main .rk-row .rk-badge.rk-lv .n { position: static; min-width: 0; height: auto; padding: 0; background: none !important; color: inherit !important; font-size: 12px !important; }
#main .rk-row .rk-badge.rk-lv .ux5-lv-ic svg { width: 14px; height: 14px; }
#main .rk-row .ktl { font-size: 12px; }
.ux5-start { display: grid; justify-items: center; gap: 8px; text-align: center; }
.ux5-start h2 { margin: 0; font-size: 2rem; } .ux5-start p { margin: 0; }
.ux5-start-ic { display: grid; place-items: center; width: 64px; height: 64px; border-radius: 50%; background: var(--h-lime, var(--accent-soft)); color: var(--h-ink, var(--ink)); }
.ux5-start-ic svg { width: 34px; height: 34px; }
.ux5-start .btn { min-height: 44px; }
.ux5-banner { display: inline-flex; align-items: center; gap: 8px; }
`;
  function css() {
    if (document.getElementById("ux5-css")) return;
    const st = document.createElement("style"); st.id = "ux5-css"; st.textContent = CSS; document.head.append(st);
  }

  // ---------- baner z ikoną (jak lpBanner, ale z monetą SVG) ----------
  // Banery po kolei: nowy czeka, aż zniknie poprzedni (także baner aplikacji .lp-banner), żeby się nie nakładały.
  let banerDo = 0;
  function baner(tekst, monety, nazwa) {
    const b = document.createElement("div"); b.className = "lp-banner ux5-banner"; b.setAttribute("role", "status");
    const teraz = Date.now(), inny = document.querySelector(".lp-banner:not(.ux5-banner)") ? teraz + 1800 : 0, start = Math.max(teraz, banerDo, inny);
    banerDo = start + 2700;
    if (start > teraz) { b.hidden = true; setTimeout(() => { b.hidden = false; document.body.append(b); setTimeout(() => b.remove(), 2600); }, start - teraz); }
    const t = document.createElement("span"); t.textContent = tekst; b.append(t);
    if (nazwa) { const n = document.createElement("b"); n.textContent = nazwa; b.append(n); }
    if (monety) b.append(coinTxt(monety, { plus: true }));
    if (start <= teraz) { document.body.append(b); setTimeout(() => b.remove(), 2600); }
    return b;
  }

  const ZD = (window.ZD_NAGRODY ||= {});

  // ---------- G3: odznaki za naukę (z poziomami), odznaki startowe, gry osobno ----------
  // Przyznaje przeglądarka (bez nagrody w monetach: A4 pkt 4) i zapisuje w S.progress.odznaki[id] = dzień (ta sama mapa co
  // odznaki gier, więc gablota w bazie przyjmuje je bez zmian). Stan liczony z postępu przy każdym rysowaniu (sprawdz()).
  // pr = postęp (S.progress). Każda odznaka: id, ikona, nazwa, jak, ile(pr) → bieżąca wartość, progi [brąz, srebro, złoto] albo [1].
  const D = () => A().dayN?.() ?? 0;
  const lekcjeN = (pr) => new Set([...Object.keys(pr.done || {}), ...Object.entries(pr.mastery || {}).filter(([, v]) => v?.ok).map(([k]) => k)]).size;
  const seriaN = (pr) => Math.max(pr.rekordy?.seria || 0, (pr.streak && (pr.streak.d >= D() - 1) ? pr.streak.n || 0 : 0));
  const xpDzisN = (pr) => (pr.xp?.d === D() ? pr.xp.n || 0 : 0);
  const celDnia = () => +(window.ZD_NAWYK?.celDnia?.()?.cel || A().celDnia?.() || 50);
  const powN = (pr) => Object.values(pr.srs || {}).filter((v) => Array.isArray(v) && v[0] > 0).length;
  const testMax = (pr) => Math.max(0, ...Object.values(pr.exams || {}).flatMap((e) => (e?.att || []).map((a) => +a.pct || 0)));
  const przedmiotyN = (pr) => { const Z = A(); return (Z.subjects?.() || []).filter((s) => { const ls = Z.lessonsOf(s.id); return ls.length && ls.every(Z.lessonDone); }).length; };
  const ODZ = [
    // id, ikona, nazwa, jak zdobyć (z {n} = próg), wartość, progi, sekcja
    { id: "start1", ic: "ux5-sprout", pl: "Pierwszy krok", jak: "Skończ pierwszą kartę dnia albo lekcję.", ile: (pr) => ((pr.xp?.t || 0) > 0 || lekcjeN(pr) > 0 ? 1 : 0), progi: [1], sek: "start" },
    { id: "seria", ic: "flame", pl: "Seria", jak: "Ucz się {n} dni z rzędu.", ile: seriaN, progi: [3, 7, 30], ids: ["seria3", "seria7", "seria30"], sek: "nauka", start: "seria3", startPl: "Trzy dni" },
    { id: "pow1", ic: "retry", pl: "Pierwsza powtórka", jak: "Oceń pierwszą fiszkę w Powtórkach.", ile: (pr) => Math.min(1, powN(pr)), progi: [1], sek: "start" },
    { id: "boss1", ic: "miecze", pl: "Pierwszy cios", jak: "Zadaj bossowi pierwszy cios dobrą odpowiedzią przed kolokwium.", ile: (pr) => (pr.odznaki?.boss1 != null ? 1 : 0), progi: [1], sek: "start" },
    { id: "cel3", ic: "ux5-target", pl: "Cel 3 razy", jak: "Osiągnij cel dnia w 3 różne dni.", ile: (pr) => (pr.celDni || []).length, progi: [3], sek: "start" },
    { id: "lekcje", ic: "book", pl: "Lekcje", jak: "Zrób {n} lekcji.", ile: lekcjeN, progi: [1, 10, 30], ids: ["lekcje1", "lekcje10", "lekcje30"], sek: "nauka" },
    { id: "przedmiot", ic: "check", pl: "Przedmiot przerobiony", jak: "Zrób wszystkie lekcje jednego przedmiotu.", ile: przedmiotyN, progi: [1], sek: "nauka" },
    { id: "dzial1", ic: "ux5-chest-open", pl: "Dział za Tobą", jak: "Zalicz cały dział kursu i odbierz nagrodę.", ile: (pr) => Object.keys(pr.dzialy || {}).length, progi: [1], sek: "nauka" },
    { id: "boss", ic: "miecze", pl: "Boss pokonany", jak: "Zadaj co najmniej 10 ciosów bossowi, którego rok pokona.", ile: (pr) => (pr.odznaki?.boss != null ? 1 : 0), progi: [1], sek: "nauka" },
    { id: "przygotowany", ic: "ux5-cap", pl: "Przygotowany", jak: "Zdobądź co najmniej 70% w próbnym teście (Przygotuj się).", ile: (pr) => (testMax(pr) >= 70 ? 1 : 0), progi: [1], sek: "nauka", pokaz: (pr) => `Najlepszy próbny test: ${testMax(pr)}%` },
    { id: "rekord", ic: "bolt", pl: "Rekord dnia", jak: "Zdobądź {n} XP jednego dnia.", ile: (pr) => Math.max(pr.rekordy?.xpDzien || 0, xpDzisN(pr)), progi: [60, 120, 250], ids: ["rekord60", "rekord120", "rekord250"], sek: "nauka",
      pokaz: (pr) => `Twój najlepszy dzień: ${Math.max(pr.rekordy?.xpDzien || 0, xpDzisN(pr))} XP` },
    { id: "duet", ic: "ux5-duo", pl: "Duet tygodnia", jak: "Osiągnij z kimś z paczki cel duetu tygodnia.", ile: (pr) => (pr.odznaki?.duet != null ? 1 : 0), progi: [1], sek: "nauka" },
  ];
  const STOPIEN = ["brąz", "srebro", "złoto"];
  // Gry: lista z aplikacji (GRY_BADGES) + Mistrz Zdawalni; ikony gier z H2 (wyjątek marki).
  const IKONA_GRY = { frun10: "frun", frun30: "frun", szansa: "ux5-heart", pary0: "pary", przejdz50: "przejdz", top10: "ux5-trophy", mistrz: "ux5-cap" };
  const gryOdz = () => [...(A().GRY_BADGES || []), ["mistrz", "", "Mistrz Zdawalni", "7 z 10 w teście przewodnika"]].map(([id, , pl, jak]) => ({ id, ic: IKONA_GRY[id] || "ux5-medal", pl, jak: jak.charAt(0).toUpperCase() + jak.slice(1) + ".", gra: true }));
  // Stan jednej odznaki: zdobyte progi, następny próg, data.
  function stan(b, pr) {
    pr = pr || A().S?.progress || {}; const o = pr.odznaki || {};
    if (b.gra) return { got: o[b.id] != null ? 1 : 0, max: 1, d: o[b.id], v: o[b.id] != null ? 1 : 0, nast: o[b.id] != null ? null : 1 };
    const ids = b.ids || [b.id], v = b.ile(pr) || 0;
    const got = ids.filter((id, i) => o[id] != null || v >= b.progi[i]).length;
    const ost = got ? ids[got - 1] : null;
    return { got, max: ids.length, v, d: ost ? o[ost] : null, nast: got < b.progi.length ? b.progi[got] : null };
  }
  // Ikona odznaki (kółko 48 px: SVG z H2 albo z listy; poziom = obwódka brąz/srebro/złoto).
  function odzIkona(b, st) {
    const Z = A(), el = document.createElement("span"); el.className = `ux5-odz-ic t${st.got ? Math.min(3, b.progi?.length > 1 ? st.got : 2) : 0}`; el.setAttribute("aria-hidden", "true");
    const k = b.ic; el.innerHTML = ["flame", "miecze", "frun", "pary", "przejdz", "coin"].includes(k) ? (Z.H2_ICO?.[k] || "") : SVG(ikony[k] || ikony["ux5-medal"]);
    return el;
  }
  // Przyznanie (umowa: ZD_NAGRODY.odznaka(id) – też dla innych pętli). o.cicho = bez banera.
  const nazwaId = (id) => { for (const b of [...ODZ, ...gryOdz()]) { if (b.id === id) return b.pl; const i = (b.ids || []).indexOf(id); if (i >= 0) return id === b.start ? b.startPl : `${b.pl}: ${b.progi[i]}`; } return null; };
  let kolejka = [], kolT = 0;
  function odznaka(id, o = {}) {
    const Z = A(), pr = Z.S?.progress; if (!pr || !Z.S?.progReady || pr.odznaki?.[id] != null) return false;
    Z.progSoon?.({ odznaki: { ...(Z.S.progress.odznaki || {}), [id]: D() } });
    if (!o.cicho) { kolejka.push(id); clearTimeout(kolT); kolT = setTimeout(pokazKolejke, 700); }
    if (["profil", "shop"].includes(Z.S.route?.view)) setTimeout(() => Z.render?.(), 0); // siatka odznak bez starego stanu
    return true;
  }
  function pokazKolejke() {
    const ids = kolejka.splice(0); if (!ids.length) return;
    const b = ids.length === 1 ? baner("Odznaka:", 0, nazwaId(ids[0]) || ids[0]) : baner(`Nowe odznaki: ${ids.length}`);
    b.prepend(ikona(ids.length === 1 && ODZ.find((x) => x.id === ids[0] || (x.ids || []).includes(ids[0]))?.ic === "flame" ? "flame" : "ux5-medal", "ux5-banner-ic"));
  }
  // Sprawdzenie warunków (po każdej zmianie ekranu): rekordy dnia i serii, dni z celem, nowe progi odznak.
  let sprT = 0, pierwszy = true;
  function sprawdz() {
    sprT = 0; const Z = A(), pr = Z.S?.progress; if (!pr || !Z.S?.progReady || !Z.S?.uid && !window.skrot?.uid) return;
    const patch = {}, rek = { ...(pr.rekordy || {}) }, sn = pr.streak && pr.streak.d >= D() - 1 ? pr.streak.n || 0 : 0, xd = xpDzisN(pr);
    if (sn > (rek.seria || 0)) { rek.seria = sn; patch.rekordy = rek; }
    if (xd > (rek.xpDzien || 0)) {
      // Nowy rekord osobisty (pobity wynik z innego dnia): baner raz dziennie.
      if ((rek.xpDzien || 0) >= 30 && rek.xpDzienD !== D() && rek.banerD !== D()) { rek.banerD = D(); baner("Nowy rekord dnia:", 0, `${xd} XP`); }
      rek.xpDzien = xd; rek.xpDzienD = D(); patch.rekordy = rek;
    }
    if (xd >= celDnia() && !(pr.celDni || []).includes(D())) patch.celDni = [...(pr.celDni || []), D()].slice(-60);
    if (Object.keys(patch).length) { Z.progSoon?.(patch); clearTimeout(sprT); sprT = setTimeout(sprawdz, 300); return; } // kolejne sprawdzenie po zapisie
    const nowe = [];
    for (const b of ODZ) { const st = stan(b, pr), ids = b.ids || [b.id]; for (let i = 0; i < st.got; i++) if (pr.odznaki?.[ids[i]] == null) nowe.push(ids[i]); }
    // Pierwsze sprawdzenie w sesji: zaległe odznaki (zdobyte przed tą wersją) dopisujemy bez banera, gdy jest ich więcej niż 2.
    const cicho = pierwszy && nowe.length > 2; pierwszy = false;
    for (const id of nowe) odznaka(id, { cicho });
  }
  // Po każdym przerysowaniu ekranu (#main dostaje nowe dzieci) i po zapisie postępu; nie przy każdej zmianie DOM.
  const sprPozniej = () => { if (!sprT) sprT = setTimeout(sprawdz, 400); };
  const mainEl = document.getElementById("main");
  if (mainEl) new MutationObserver(sprPozniej).observe(mainEl, { childList: true }); else setInterval(sprPozniej, 3000);
  addEventListener("skrot:sklep", sprPozniej);
  // Boss (bsLoad): pierwszy cios. Duet (paczkaWynik): cel duetu osiągnięty.
  ZD.bossStan = (bossy) => { if ((bossy || []).some((b) => (b.moje || 0) > 0)) odznaka("boss1"); };
  ZD.duetStan = (d) => { if (d?.duet?.odebrane) odznaka("duet"); };

  // Arkusz odznaki: nazwa, jak zdobyć, data, postęp („Seria 5/7”).
  // Dzień (dayN) → data: dziś minus różnica dni.
  const dataTxt = (d) => { if (d == null) return ""; try { const t = new Date(); t.setDate(t.getDate() - (D() - d)); return t.toLocaleDateString(EN() ? "en-GB" : "pl-PL", { day: "numeric", month: "short", year: "numeric" }); } catch { return ""; } };
  function arkusz(b) {
    const Z = A(), h = Z.h, st = stan(b);
    const wiele = (b.progi?.length || 1) > 1, jak = (n) => b.jak.replace("{n}", String(n));
    Z.modal((close) => [h("div", { class: "ux5-ark" },
      h("div", { class: "ux5-ark-top" }, odzIkona(b, st), h("div", {}, h("h2", { text: b.pl }), st.got ? h("p", { class: "muted" }, h("span", { text: `Zdobyta ${dataTxt(st.d ?? D())}` }), wiele ? [" · ", h("span", { text: STOPIEN[st.got - 1] })] : null) : h("p", { class: "muted", text: "Jeszcze nie zdobyta" }))),
      h("p", { class: "ux5-ark-jak", text: st.nast != null ? jak(st.nast) : wiele ? `Masz wszystkie stopnie: ${b.progi.join(" / ")}.` : b.jak.replace("{n}", "") }),
      !b.gra && st.nast != null && st.nast > 1 ? h("div", { class: "ux5-ark-post" }, h("div", { class: "pts-head" }, h("b", {}, h("span", { text: b.pl }), " ", h("span", { class: "num", text: `${Math.min(st.v, st.nast)}/${st.nast}` }))),
        h("div", { class: "pts-bar pts-md", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(st.nast), "aria-valuenow": String(Math.min(st.v, st.nast)), "aria-label": b.pl }, h("span", { class: "pts-seg", style: "flex:1 1 0" }, h("i", { style: `--w:${Math.round(100 * Math.min(1, st.v / st.nast))}%` })))) : null,
      wiele ? h("p", { class: "muted ux5-ark-st", text: `Stopnie: brąz ${b.progi[0]} · srebro ${b.progi[1]} · złoto ${b.progi[2]}` }) : null,
      b.pokaz ? h("p", { class: "muted", text: b.pokaz(Z.S.progress || {}) }) : null,
      h("div", { class: "row ux5-ark-btns" }, st.got ? ZD.pokazZnajomym?.({ rodzaj: "odznaka", tytul: b.pl, stopien: wiele ? STOPIEN[st.got - 1] : null }) ?? null : null,
        h("button", { type: "button", class: "btn primary", onclick: close }, "Jasne")))], "ux5-ark-modal");
  }
  function kafel(b) {
    const Z = A(), h = Z.h, st = stan(b), wiele = (b.progi?.length || 1) > 1;
    const pod = st.got ? (b.podpis || (wiele ? STOPIEN[st.got - 1] : "zdobyta")) : (b.progi && b.progi[0] > 1 ? `${Math.min(st.v, b.progi[0])}/${b.progi[0]}` : "jeszcze nie");
    const post = st.got && wiele && st.nast != null ? `${st.v}/${st.nast}` : null;
    return h("button", { type: "button", class: "ux5-odz" + (st.got ? " on" : " off"), "aria-label": `${b.pl}: ${pod}${post ? " " + post : ""}`, onclick: () => arkusz(b.arkusz || b) }, odzIkona(b, st), h("span", { class: "ux5-odz-n", text: b.pl }),
      h("small", {}, h("span", { text: pod }), post ? [" · ", h("span", { class: "num", text: post })] : null));
  }
  // Sekcje w Profilu: „Na start” (5 startowych), „Nauka” (z poziomami), „Gry” (osobno, niżej).
  function odznakiSekcja() {
    const Z = A(), h = Z.h; if (!h) return null;
    // „Trzy dni” to pierwszy stopień (brąz) Serii: ten sam kafel otwiera arkusz Serii, nie jest osobną odznaką.
    const seria = ODZ.find((b) => b.id === "seria");
    const start = [ODZ.find((b) => b.id === "start1"), { ...seria, pl: "Trzy dni", progi: [3], ids: ["seria3"], jak: "Ucz się 3 dni z rzędu.", arkusz: seria, podpis: "brąz Serii" }, ...ODZ.filter((b) => ["pow1", "boss1", "cel3"].includes(b.id))];
    const nauka = ODZ.filter((b) => b.sek === "nauka"), gry = gryOdz();
    const ileStart = start.filter((b) => stan(b).got).length;
    return h("section", { class: "panel sk-panel ux5-odznaki", "aria-label": "Odznaki" },
      h("div", { class: "ux5-odz-head" }, h("h2", { text: "Odznaki" }), h("span", { class: "muted num", text: `Na start: ${ileStart}/5` })),
      h("h3", { text: "Na start" }), h("div", { class: "ux5-odz-grid" }, start.map(kafel)),
      h("h3", { text: "Nauka" }), h("div", { class: "ux5-odz-grid" }, nauka.map(kafel)),
      h("details", { class: "ux5-odz-gry" }, h("summary", {}, h("span", { text: "Gry" }), h("span", { class: "muted num", text: `${gry.filter((b) => stan(b).got).length}/${gry.length}` })), h("div", { class: "ux5-odz-grid" }, gry.map(kafel))));
  }
  // Odznaka po id (gablota, profil kolegi): { pl, ic } albo null.
  function odzInfo(id) {
    for (const b of [...ODZ, ...gryOdz()]) { if (b.id === id) return { pl: b.pl, b }; const i = (b.ids || []).indexOf(id); if (i >= 0) return { pl: id === b.start ? b.startPl : `${b.pl} · ${STOPIEN[i]}`, b, t: i + 1 }; }
    return null;
  }
  function odzIkonaId(id) { const x = odzInfo(id); return x ? odzIkona(x.b, { got: x.t || 1 }) : null; }
  // Lista do gabloty (ODZNAKI w index.html): [id, "", nazwa, jak] dla każdego stopnia odznak za naukę.
  const odzLista = () => ODZ.flatMap((b) => (b.ids || [b.id]).map((id, i) => [id, "", odzInfo(id).pl, b.jak.replace("{n}", String(b.progi[i]))]));
  // ---------- G3: ikony poziomów (SVG zamiast emoji) i nagrody za poziomy 10/15/17/20 ----------
  const IKONY_POZ = ["ux5-sprout", "ux5-flame", "ux5-search", "ux5-cal", "check", "ux5-bulb", "ux5-chart", "ux5-chess", "ux5-cap", "ux5-trophy",
    "ux5-compass", "ux5-rocket", "ux5-scope", "ux5-owl", "ux5-case", "ux5-office", "ux5-tie", "ux5-crown", "ux5-star", "ux5-gem"];
  const ikonaPoziomu = (n) => ikona(IKONY_POZ[Math.min(Math.max(1, n), IKONY_POZ.length) - 1], "ico ux5-lv-ic");
  // Nagrody kosmetyczne „tylko za poziom” z katalogu (Złota ramka 10, Platynowa 15, „Prezes roku” 17, Ramka Geniusza 20).
  const zaPoziom = () => (window.skrot?.sklep?.katalog || []).filter((x) => x.tylko_za_poziom);
  const kosmNazwa = (it) => (EN() ? it.en || it.pl : it.pl);
  function nagrodaPoziomu(n) {
    const Z = A(), h = Z.h, it = zaPoziom().filter((x) => x.tylko_za_poziom === n); if (!it.length || !h) return null;
    return h("span", { class: "lv-prize ux5-prize" }, h("span", { text: `Nagroda: ${it.map(kosmNazwa).join(", ")}` }));
  }
  function nagrodaPoziomuOkno(from, to) {
    const Z = A(), h = Z.h, it = zaPoziom().filter((x) => x.tylko_za_poziom > from && x.tylko_za_poziom <= to); if (!it.length || !h) return null;
    const podglad = (x) => { const el = document.createElement("span"); el.className = "ux5-lv-kosm-pv"; el.setAttribute("aria-hidden", "true");
      const K = window.SKROT_KOSM; if (x.slot === "ramka" && K?.avatarSvg) el.innerHTML = K.avatarSvg(Z.S?.progress?.nick || "Z", x.wyglad?.g); else el.append(ikona(x.slot === "tytul" ? "ux5-tie" : "ux5-medal")); return el; };
    return h("div", { class: "ux5-lv-kosm" }, it.map((x) => h("div", { class: "ux5-lv-kosm-k" }, podglad(x), h("span", { class: "ux5-lv-kosm-t" },
      h("b", { text: `Nagroda: ${kosmNazwa(x)}` }), h("small", { class: "muted", text: x.slot === "tytul" ? "Tylko za poziom. Załóż go w Sklepie → Profil." : "Tylko za poziom. Załóż ją w Sklepie → Profil." })))));
  }
  // ---------- G3: karta „Kup coś za monety z prezentu” (saldo ≥ 40, jeszcze nic nie kupione) ----------
  function kartaPrezentu() {
    const Z = A(), h = Z.h, sk = window.skrot?.sklep; if (!h || !sk?.ok || (sk.saldo || 0) < 40 || (sk.posiadane?.size || 0) > 0) return null;
    const zam = (sk.katalog || []).find((x) => x.id === "zamrozenie"), kol = (sk.katalog || []).filter((x) => x.slot === "kolor" && typeof x.cena === "number").sort((a, b) => a.cena - b.cena)[0];
    const kup = (tab, id) => { window.ZD_APP_SKLEP?.(tab, id) ?? Z.go?.({ view: "shop" }); };
    return h("section", { class: "panel sk-panel ux5-prezent" },
      h("div", { class: "ux5-prezent-top" }, ikona("ux5-gift", "ux5-prezent-ic"), h("div", {}, h("h2", { text: "Kup coś za monety z prezentu" }),
        h("p", { class: "muted", text: `Masz ${sk.saldo} monet. Na początek najbardziej się przydaje:` }))),
      h("div", { class: "ux5-prezent-opcje" },
        zam ? h("button", { type: "button", class: "btn", onclick: () => kup("nauka", "zamrozenie") }, ikona("snow"), h("span", { text: "Zamrożenie serii" }), coinTxt(zam.cena)) : null,
        kol ? h("button", { type: "button", class: "btn", onclick: () => kup("profil", kol.id) }, ikona("ux5-palette"), h("span", { text: "Kolor pseudonimu" }), coinTxt(kol.cena)) : null));
  }
  // „Prezent na start: 100 monet” raz na konto: gdy w historii monet jest wpis „start” (v60), pokazujemy okno z przyciskiem do Sklepu.
  let startSpr = false;
  async function startPrezent() {
    const Z = A(), sk = window.skrot, lk = "ux5-start:" + (sk?.uid || "");
    let lsz = null; try { lsz = localStorage.getItem(lk); } catch {}
    if (startSpr || lsz || !Z.S?.progReady || Z.S.progress?.startPokazany || !sk?.sklep?.ok || !sk.monetyHistoria) return;
    startSpr = true;
    let r; try { r = await sk.monetyHistoria(30); } catch { return; }
    const w = (r?.wpisy || []).find((x) => x.klucz === "start"); if (!w) return;
    Z.progSoon?.({ startPokazany: Z.dayN?.() ?? 1 }); try { localStorage.setItem(lk, "1"); } catch {} // od razu, zanim postęp dojdzie do bazy
    const h = Z.h, pokaz = () => Z.modal((close) => [h("div", { class: "ux5-start" }, ikona("ux5-gift", "ux5-start-ic"), h("span", { class: "eyebrow", text: "Prezent na start" }),
      h("h2", {}, coinTxt(w.delta || 100, { plus: true })), h("p", { class: "muted", text: "Na dobry początek. Wydaj je w Sklepie: zamrożenie serii chroni ją, gdy wypadnie Ci dzień." }),
      h("div", { class: "row" }, h("button", { type: "button", class: "btn primary", onclick: () => { close(); Z.go?.({ view: "shop" }); } }, "Do Sklepu"), h("button", { type: "button", class: "btn ghost", onclick: close }, "Później")))], "ux5-start-modal");
    if (document.querySelector("#layer .modal")) setTimeout(() => { if (!document.querySelector("#layer .modal")) pokaz(); }, 4000); else pokaz();
  }
  addEventListener("skrot:sklep", () => setTimeout(startPrezent, 600));
  setTimeout(startPrezent, 3000);
  Object.assign(ZD, { ikonaPoziomu, nagrodaPoziomu, nagrodaPoziomuOkno, kartaPrezentu, startPrezent });
  Object.assign(ZD, { odznaka, odznakiSekcja, odzInfo, odzIkonaId, odzLista, ODZ, sprawdz });

  // ---------- RPC (v58–v62) ----------
  async function rpc(fn, args) {
    const c = sb(); if (!c) return { ok: false, code: "no_client" };
    try {
      const { data, error } = await c.rpc(fn, args || {});
      if (error) return { ok: false, code: error.code === "PGRST202" ? "no_sql" : error.code || "error" };
      return data || { ok: false, code: "empty" };
    } catch { return { ok: false, code: "error" }; }
  }

  // ---------- G1: nagroda za dział (SQL v58: nauka_dzial_nagroda) ----------
  // Stan odebranych w postępie (S.progress.dzialy["sid:unit"] = dzień), żeby ścieżka pokazała „Odebrane” bez pytania bazy.
  const dzKey = (sid, unit) => sid + ":" + unit;
  const dzOdebrane = (sid, unit) => !!A().S?.progress?.dzialy?.[dzKey(sid, unit)];
  // Kwota nagrody z bazy (nauka_dzial_cfg, v58); do czasu odpowiedzi ta sama liczba co w SQL (test ux5-etap1 porównuje).
  const DZ_MONETY = 20;
  let dzCfgV = null, dzCfgT = 0;
  const dzMonety = () => dzCfgV ?? DZ_MONETY;
  function dzCfg() {
    if (dzCfgV != null || Date.now() - dzCfgT < 60e3 || !sb()) return; dzCfgT = Date.now();
    rpc("nauka_dzial_cfg").then((r) => { const m = +r?.monety; if (m > 0) { const zm = m !== dzMonety(); dzCfgV = m; if (zm) A().render?.(); } });
  }
  // Odbiór to czynność (przycisk „Odbierz” na ścieżce, jak skrzynia w Duolingo), a nie skutek uboczny rysowania.
  // dzBlad: ostatni błąd odbioru w tej sesji (np. baza nie widzi jeszcze punktu za ostatni bilet).
  const dzTrwa = new Set(), dzBlad = new Map(), dzSwiezo = new Set();
  async function dzialOdbierz(sid, unit, btn) {
    const k = dzKey(sid, unit), Z = A();
    if (dzOdebrane(sid, unit) || dzTrwa.has(k) || !Z.PAID?.()) return null;
    dzTrwa.add(k); dzBlad.delete(k); if (btn) btn.disabled = true;
    const from = btn?.getBoundingClientRect?.();
    let r = await rpc("nauka_dzial_nagroda", { p_sid: sid, p_unit: String(unit) });
    // Punkt „lekcja” za ostatni bilet mógł jeszcze nie dojść do bazy: jedna ponowna próba po 2 s.
    if (r?.code === "nie_wszystkie") { await new Promise((ok) => setTimeout(ok, 2000)); r = await rpc("nauka_dzial_nagroda", { p_sid: sid, p_unit: String(unit) }); }
    dzTrwa.delete(k);
    if (r?.ok) {
      Z.progSoon?.({ dzialy: { ...(Z.S.progress?.dzialy || {}), [k]: Z.dayN?.() ?? 1 } });
      if (!r.juz) {
        dzSwiezo.add(k);
        if (from) Z.coinFly?.(from);
        if (!Z.lpReduced?.()) Z.lpConfetti?.(18);
        // Saldo odświeżamy po cichu: nagrodę pokazuje lecąca moneta i skrzynka, bez drugiego dymka „+20”.
        const M = Z.MONV; if (M) M.quiet++;
        try { await window.skrot?.sklepStan?.(); } finally { if (M) M.quiet--; }
        ZD.odznaka?.("dzial1", { cicho: true });
      }
    } else dzBlad.set(k, r?.code || "error");
    Z.render?.();
    return r;
  }
  // Po skończonej lekcji (ptsMilestone): dział z wszystkimi lekcjami zrobionymi → baner „Dział N zrobiony! Odbierz +20 na ścieżce”.
  const dzOgloszone = new Set();
  function dzialSprawdz(sid) {
    const Z = A(); if (!sid || !Z.lessonsOf) return;
    dzCfg();
    const by = new Map();
    for (const l of Z.lessonsOf(sid)) { if (l.unit == null || l.unit === "") continue; const u = String(l.unit); if (!by.has(u)) by.set(u, []); by.get(u).push(l); }
    for (const [u, ls] of by) if (ls.length && ls.every(Z.lessonDone) && !dzOdebrane(sid, u) && !dzOgloszone.has(dzKey(sid, u))) {
      dzOgloszone.add(dzKey(sid, u));
      // Najpierw odświeżamy ekran (liczniki przedmiotu), dopiero potem baner, żeby baner nie przeczył karcie pod spodem.
      Z.render?.();
      requestAnimationFrame(() => baner(Z.PAID?.() ? `Dział ${u} zaliczony! Nagroda czeka na ścieżce:` : `Dział ${u} zaliczony!`, Z.PAID?.() ? dzMonety() : 0));
    }
  }
  // Ostatni węzeł działu na ścieżce: skrzynka „+20 monet”: zablokowana (ile lekcji zostało) → „Odbierz” → otwarta.
  function dzialWezel(sid, u, done) {
    const Z = A(), h = Z.h; if (!h) return null;
    const n = u.rows.length, k = dzKey(sid, u.unit), got = dzOdebrane(sid, u.unit), all = done >= n, paid = !!Z.PAID?.();
    const dot = h("span", { class: "sk-dot", "aria-hidden": "true" }); dot.append(ikona(got ? "ux5-chest-open" : "ux5-chest"));
    dzCfg();
    const err = dzBlad.get(k), M = dzMonety();
    // Baza liczy dział, gdy każda lekcja ma zdany bilet wyjścia. Lekcja odhaczona bez biletu: mówimy o tym od razu, zamiast błędu po kliknięciu.
    const bezBiletu = u.rows.filter((r) => Z.lessonDone(r.l) && !(r.ticket > 0)).map((r) => Z.lessonNo(r.l));
    const wolne = u.rows.filter((r) => !r.locked), wolneZ = wolne.filter((r) => Z.lessonDone(r.l)).length;
    const pod = got ? (dzSwiezo.has(k) ? "Odebrane! Monety są już w Sklepie." : "Odebrane. Monety są w Sklepie.")
      : !paid ? (wolne.length ? `Darmowe lekcje działu: ${wolneZ}/${wolne.length}. Nagrodę za cały dział odbierasz w pełnym dostępie.` : "Nagroda za dział jest w pełnym dostępie.")
      : all && bezBiletu.length ? `Zalicz bilet wyjścia w lekcji ${bezBiletu.join(", ")}, a dział będzie zaliczony.`
      : all ? (err === "nie_wszystkie" ? "Zalicz bilet wyjścia w każdej lekcji działu, potem odbierz." : err ? "Nie udało się. Spróbuj za chwilę." : "Cały dział zaliczony. Odbierz nagrodę.")
      : `Lekcje do końca działu: ${n - done}`;
    const tytul = got ? `Dział ${u.unit} zaliczony:` : `Nagroda za dział ${u.unit}:`;
    let akcja = null;
    if (!got && all && paid && !bezBiletu.length) akcja = h("button", { type: "button", class: "btn primary ux5-odbierz", onclick: (e) => dzialOdbierz(sid, u.unit, e.currentTarget) }, h("span", { text: "Odbierz" }), coinTxt(M, { plus: true }));
    else if (!got && !paid) akcja = window.ZD_WEJSCIE?.przyciskZakupu?.("dzial") ?? h("button", { type: "button", class: "btn ux5-kup", onclick: () => window.skrot?.buy?.() }, "Kup dostęp");
    return h("li", { class: "sk-node ux5-chest" + (got ? " ux5-got" : all && paid ? " ux5-ready" : "") + (dzSwiezo.has(k) ? " ux5-fresh" : "") },
      dot,
      h("div", { class: "t" }, h("b", {}, h("span", { text: tytul }), coinTxt(M, { plus: true })), h("span", { class: "ux5-chest-pod", text: pod }), akcja));
  }

  Object.assign(ZD, { ikona, coinTxt, baner, rpc, dzialSprawdz, dzialWezel, dzialOdbierz });

  // ---------- G2: jedna moneta (SVG) zamiast emoji na ekranach pętli 5 ----------
  // Teksty w kodzie zostają (słownik EN ich szuka), a na ekranie znaki monety, błyskawicy i płomienia zamieniamy na ikonę SVG z H2
  // (ta sama moneta co w nagłówku). Zamiana idzie po tłumaczeniu (i18n działa wcześniej, w tej samej kolejce zdarzeń).
  const ZNAKI = { "\u{1FA99}": "coin", "\u26A1": "bolt", "\u{1F525}": "flame", "\u{1F3C6}": "ux5-trophy", "\u{1F3C5}": "ux5-medal", "\u{1F512}": "lock" }, ZNAK_RE = /(\u{1FA99}|\u26A1\uFE0F?|\u{1F525}|\u{1F3C6}|\u{1F3C5}|\u{1F512})/u;
  const MOJE = ["shop", "profil", "ranking", "haslo", "boss", "subject", "games", "paczka"];
  function znakiNaSvg(root) {
    if (!root) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), lista = [];
    for (let t; (t = w.nextNode());) if (ZNAK_RE.test(t.data) && !t.parentElement?.closest("script, style, textarea, input, [contenteditable], [translate=no]")) lista.push(t);
    for (const t of lista) {
      const frag = document.createDocumentFragment();
      for (const cz of t.data.split(ZNAK_RE)) { if (!cz) continue; const k = ZNAKI[cz.replace("\uFE0F", "")]; frag.append(k ? ikona(k, "ux5-znak ux5-znak-" + k) : document.createTextNode(cz)); }
      t.replaceWith(frag);
    }
  }
  let znakT = 0;
  function znakiTeraz() {
    znakT = 0; const v = A().S?.route?.view;
    if (MOJE.includes(v)) znakiNaSvg(document.getElementById("main"));
    const L = document.getElementById("layer"); if (L?.querySelector(".lvup-modal, .lv-modal, .lv-how-modal, .kshop-modal, .k-modal, .rk-modal, .lvup") || (L && MOJE.includes(v))) znakiNaSvg(L);
    znakiNaSvg(document.getElementById("gain-tray"));
  }
  new MutationObserver(() => { if (!znakT) znakT = setTimeout(znakiTeraz, 0); }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  // Baner aplikacji (.lp-banner bez ux5-banner) ma pierwszeństwo: nasz widoczny baner chowamy i pokazujemy ponownie po nim.
  new MutationObserver((ms) => {
    if (!ms.some((m) => [...m.addedNodes].some((n) => n.nodeType === 1 && n.classList?.contains("lp-banner") && !n.classList.contains("ux5-banner")))) return;
    for (const b of document.querySelectorAll(".ux5-banner:not([hidden])")) { b.remove(); banerDo = Math.max(banerDo, Date.now() + 1800); setTimeout(() => { document.body.append(b); setTimeout(() => b.remove(), 2600); }, 1800); }
  }).observe(document.body, { childList: true });
  ZD.znakiNaSvg = znakiNaSvg;

  css();
  // Pierwsze rysowanie aplikacji mogło być przed wczytaniem tego pliku: rysujemy jeszcze raz.
  try { A().render?.(); } catch {}
})();
