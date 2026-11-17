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
  // „N [moneta]” jako tekst z ikoną SVG (zamiast emoji 🪙). Zwraca span: liczba czytana przez czytnik + „monet”.
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
.ux5-banner { display: inline-flex; align-items: center; gap: 8px; }
`;
  function css() {
    if (document.getElementById("ux5-css")) return;
    const st = document.createElement("style"); st.id = "ux5-css"; st.textContent = CSS; document.head.append(st);
  }

  // ---------- baner z ikoną (jak lpBanner, ale z monetą SVG) ----------
  function baner(tekst, monety) {
    const b = document.createElement("div"); b.className = "lp-banner ux5-banner"; b.setAttribute("role", "status");
    const t = document.createElement("span"); t.textContent = tekst; b.append(t);
    if (monety) b.append(coinTxt(monety, { plus: true }));
    document.body.append(b); setTimeout(() => b.remove(), 2600);
    return b;
  }

  const ZD = (window.ZD_NAGRODY ||= {});
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
  // Teksty w kodzie zostają (słownik EN ich szuka), a na ekranie znak 🪙 / ⚡ / 🔥 zamieniamy na ikonę SVG z H2
  // (ta sama moneta co w nagłówku). Zamiana idzie po tłumaczeniu (i18n działa wcześniej, w tej samej kolejce zdarzeń).
  const ZNAKI = { "🪙": "coin", "⚡": "bolt", "🔥": "flame", "🏆": "ux5-trophy", "🏅": "ux5-medal", "🔒": "lock" }, ZNAK_RE = /(🪙|⚡️?|🔥|🏆|🏅|🔒)/u;
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
  ZD.znakiNaSvg = znakiNaSvg;

  css();
  // Pierwsze rysowanie aplikacji mogło być przed wczytaniem tego pliku: rysujemy jeszcze raz.
  try { A().render?.(); } catch {}
})();
