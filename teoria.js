/* Mapa teorii (docs/teoria/petla.md, prototyp docs/teoria/prototyp.html).
   Cała teoria jednego tematu jako tekstowa mapa myśli: środek → numerowane gałęzie → węzły → najwyżej jeden poziom głębiej.
   Celowo bez ruchu: żadnych przejść, animacji ani płynnego przewijania (bez względu na html.calm). Skoki do gałęzi to przyciski,
   nie linki z „#”, bo adres w hashu należy do routera strony.
   Dane: dokument materialSimple/<id>~teoria (format „zdawalni-teoria” v1). Korzysta z window.ZD_APP (h, inline, rich) dopiero
   w chwili wywołania. Wystawia window.ZD_TEORIA = { TYPY, waliduj, slowa, minuty, render }. */
(() => {
  "use strict";
  const A = () => window.ZD_APP || {};
  const TYPY = { def: "Definicja", idea: "Idea", formula: "Wzór", ex: "Przykład", vs: "Nie myl", err: "Typowy błąd", exam: "Na egzaminie", link: "Połączenie" };

  // ---------- liczenie słów i walidacja (te same reguły co narz/teoria-sprawdz.py; test: tests/teoria.test.js) ----------
  const liczSlowa = (s) => String(s || "").replace(/\\\([\s\S]*?\\\)/g, " x ").split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  const wezlyTekst = (n) => [n.h, n.md, n.f, n.legend, ...(n.steps || []), ...(n.table ? [...(n.table.head || []), ...(n.table.rows || []).flat()] : []), ...(n.kids || []).flatMap(wezlyTekst)];
  function teksty(d) {
    return [d.core?.one, d.core?.why, ...(d.prereq || []).map((p) => p.text),
      ...(d.branches || []).flatMap((b) => [b.title, b.lead, ...(b.nodes || []).flatMap(wezlyTekst)]),
      ...(d.links || []).map((l) => l.why), ...(d.exam || [])];
  }
  const slowa = (d) => teksty(d).reduce((a, s) => a + liczSlowa(s), 0);
  const minuty = (n) => Math.max(1, Math.round(n / 200));

  function waliduj(d) {
    const e = [];
    if (!d || typeof d !== "object") return ["to nie jest obiekt"];
    if (d.format !== "zdawalni-teoria" || d.v !== 1) e.push("format musi być „zdawalni-teoria”, v 1");
    if (!d.mid) e.push("brak mid");
    if (!d.core?.one) e.push("brak core.one");
    else if (liczSlowa(d.core.one) > 25) e.push("core.one ma ponad 25 słów");
    const br = Array.isArray(d.branches) ? d.branches : [];
    if (br.length < 3 || br.length > 6) e.push(`gałęzi musi być 3–6 (jest ${br.length})`);
    const ids = new Set();
    const id = (x, rx, gdzie) => { if (!x?.id || !rx.test(x.id)) e.push(`${gdzie}: złe id „${x?.id ?? ""}”`); else if (ids.has(x.id)) e.push(`powtórzone id ${x.id}`); else ids.add(x.id); };
    const wezel = (n, gdzie, glebokosc) => {
      if (!TYPY[n?.t]) e.push(`${gdzie}: nieznany typ „${n?.t ?? ""}”`);
      if (!n?.h && !n?.md && !n?.f && !n?.steps?.length && !n?.table) e.push(`${gdzie}: pusty węzeł`);
      if (liczSlowa(n?.md) > 120) e.push(`${gdzie}: md ma ponad 120 słów`);
      if (n?.t === "link" && !n.ref) e.push(`${gdzie}: połączenie bez ref`);
      if (n?.table && (!Array.isArray(n.table.head) || !Array.isArray(n.table.rows))) e.push(`${gdzie}: tabela bez head/rows`);
      if (n?.kids?.length) { if (glebokosc >= 1) e.push(`${gdzie}: za głęboko (najwyżej jeden poziom pod węzłem)`); n.kids.forEach((k, i) => { id(k, /^b\d+-\d+[a-z]$/, `${gdzie}.kids[${i}]`); wezel(k, `${gdzie}.kids[${i}]`, glebokosc + 1); }); }
    };
    br.forEach((b, i) => {
      const g = `gałąź ${i + 1}`;
      id(b, /^b\d+$/, g);
      if (!b.title) e.push(`${g}: brak title`);
      if (!b.q) e.push(`${g}: brak q (pytanie do spisu)`); else if (b.q.length > 60) e.push(`${g}: q ma ponad 60 znaków`);
      if (liczSlowa(b.lead) > 40) e.push(`${g}: lead ma ponad 40 słów`);
      const ns = Array.isArray(b.nodes) ? b.nodes : [];
      if (ns.length < 2 || ns.length > 6) e.push(`${g}: węzłów musi być 2–6 (jest ${ns.length})`);
      ns.forEach((n, j) => { id(n, /^b\d+-\d+$/, `${g}.węzeł ${j + 1}`); wezel(n, `${g}.węzeł ${j + 1}`, 0); });
    });
    for (const l of d.links || []) {
      if (!ids.has(l.from)) e.push(`połączenie: nie ma gałęzi „${l.from}”`);
      if (!l.toLesson && !ids.has(l.to)) e.push(`połączenie: nie ma gałęzi „${l.to}”`);
      if (!l.why) e.push("połączenie bez why");
    }
    const n = slowa(d);
    if (n < 900 || n > 2400) e.push(`mapa ma ${n} słów (dozwolone 900–2400)`);
    return e;
  }

  // ---------- widok ----------
  function css() {
    if (document.getElementById("tm-css")) return;
    const s = document.createElement("style"); s.id = "tm-css";
    s.textContent = `
.tm, .tm * { transition: none !important; animation: none !important; scroll-behavior: auto !important; }
.tm { display: block; }
.tm-grid { display: block; }
@media (min-width: 1000px) {
  .tm-grid { display: grid; grid-template-columns: 260px minmax(0, 1fr); gap: 24px; align-items: start; }
  .tm .tm-side { position: sticky; top: 16px; max-height: calc(100vh - 32px); overflow: auto; }
  .tm .tm-toc-m { display: none; }
}
@media (max-width: 999px) { .tm .tm-side { display: none; } }
.tm-main { max-width: 72ch; display: grid; gap: 16px; min-width: 0; }
.tm-main > * { margin: 0; }
.tm-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }
.tm-meta { font-size: var(--fs-s); color: var(--h-muted, var(--muted)); margin: 0; }
.tm-core h1 { font-size: var(--fs-3xl); line-height: 1.2; margin: 4px 0 8px; }
.tm-one { font-size: var(--fs-l); font-weight: 600; margin: 0 0 8px; }
.tm-core p { margin: 0 0 8px; }
.tm-route { list-style: none; margin: 12px 0 0; padding: 0; display: grid; gap: 8px; }
.tm-jump { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 44px; padding: 6px 12px; text-align: left; cursor: pointer;
  font: 600 var(--fs-m)/1.35 inherit; font-family: inherit; color: var(--h-ink, var(--ink)); background: var(--h-card, var(--surface));
  border: 2px solid var(--h-line, var(--line)); border-radius: var(--r-m); }
.tm-jump:hover { border-color: var(--h-acc, var(--good)); }
.tm-n { flex: none; width: 28px; height: 28px; border-radius: 50%; display: inline-grid; place-items: center; background: var(--h-acc-soft, var(--accent-soft));
  color: var(--h-ink, var(--ink)); font-weight: 800; font-size: var(--fs-s); font-variant-numeric: tabular-nums; }
.tm-w { margin-left: auto; font-size: var(--fs-xs); color: var(--h-muted, var(--muted)); font-weight: 600; white-space: nowrap; }
.tm-h2 { font-size: var(--fs-l); margin: 0 0 8px; line-height: 1.3; }
.tm-sec ul.tm-plain, .tm-sec ol.tm-plain { margin: 0; padding-left: 1.2em; }
.tm-sec .tm-plain li + li { margin-top: 6px; }
.tm-b-head { display: flex; gap: 12px; align-items: flex-start; }
.tm-b-num { flex: none; width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; background: var(--h-acc, var(--good));
  color: var(--h-acc-ink, #fff); font-weight: 800; font-size: var(--fs-m); font-variant-numeric: tabular-nums; }
.tm-b-head h2 { font-size: var(--fs-2xl); line-height: 1.25; margin: 2px 0 4px; }
.tm-b-head h2:focus { outline: none; }
.tm-b-head h2:focus-visible { outline: 3px solid var(--h-acc, var(--good)); outline-offset: 2px; }
.tm-lead { margin: 6px 0 0; color: var(--h-muted, var(--muted)); }
.tm-tree { list-style: none; margin: 14px 0 0; padding: 0 0 0 18px; position: relative; }
.tm-tree::before { content: ""; position: absolute; left: 6px; top: 4px; bottom: 18px; border-left: 2px solid var(--h-edge, var(--line)); }
.tm-tree > li { position: relative; padding: 0 0 16px 14px; }
.tm-tree > li::before { content: ""; position: absolute; left: -12px; top: 13px; width: 20px; border-top: 2px solid var(--h-edge, var(--line)); }
.tm-tree > li:last-child { padding-bottom: 0; }
.tm-tree .tm-tree { margin-top: 10px; }
.tm-node h3 { font-size: var(--fs-m); line-height: 1.35; margin: 0 0 4px; display: flex; flex-wrap: wrap; gap: 6px 8px; align-items: center; }
.tm-node .rich p { margin: 0 0 8px; }
.tm-node .rich p:last-child { margin-bottom: 0; }
.tm-node ul, .tm-node ol { margin: 4px 0 8px; padding-left: 1.2em; }
.tm-node li + li { margin-top: 4px; }
.tm-tag { display: inline-block; font-size: var(--fs-xs); font-weight: 700; line-height: 1; padding: 5px 8px; border-radius: 999px;
  background: var(--h-line, var(--sunk)); color: var(--h-ink, var(--ink)); }
.tm-tag.def, .tm-tag.vs { background: var(--h-blue-soft, var(--sunk)); }
.tm-tag.formula, .tm-tag.ex { background: var(--h-acc-soft, var(--accent-soft)); }
.tm-tag.err { background: var(--h-orange-soft, var(--warn-soft)); }
.tm-tag.exam { background: var(--h-red-soft, var(--bad-soft)); }
.tm-f { margin: 6px 0 8px; padding: 10px 12px; border-radius: var(--r-s); background: var(--h-paper, var(--paper)); border: 2px solid var(--h-line, var(--line));
  font-weight: 700; overflow-x: auto; font-variant-numeric: tabular-nums; }
.tm-f small { display: block; font-weight: 400; color: var(--h-muted, var(--muted)); font-size: var(--fs-s); margin-top: 4px; }
.tm-tw { overflow-x: auto; }
.tm table { border-collapse: collapse; width: 100%; font-size: var(--fs-s); margin: 6px 0 8px; }
.tm th, .tm td { text-align: left; padding: 8px; border-bottom: 2px solid var(--h-line, var(--line)); vertical-align: top; }
.tm th { font-weight: 700; }
.tm-ref { display: inline-flex; align-items: center; min-height: 44px; padding: 0; border: 0; background: none; cursor: pointer;
  font: 600 var(--fs-s)/1.3 inherit; font-family: inherit; color: var(--h-acc, var(--good)); text-decoration: underline; text-underline-offset: 3px; }
.tm-end .row { margin-top: 12px; }
.tm-toc { list-style: none; margin: 0; padding: 0; }
.tm-toc button { display: flex; gap: 8px; width: 100%; min-height: 44px; align-items: center; padding: 4px 8px; border: 0; background: none; text-align: left; cursor: pointer;
  border-radius: var(--r-s); color: var(--h-ink, var(--ink)); font: 600 var(--fs-s)/1.3 inherit; font-family: inherit; }
.tm-toc button:hover { background: var(--h-acc-soft, var(--accent-soft)); }
.tm-toc .tm-tn { flex: none; width: 22px; text-align: right; font-variant-numeric: tabular-nums; color: var(--h-muted, var(--muted)); }
.tm-toc ul { list-style: none; margin: 0 0 4px 30px; padding: 0; }
.tm-toc ul button { font-weight: 400; color: var(--h-muted, var(--muted)); }
.tm-toc-m summary { min-height: 44px; display: flex; align-items: center; font-weight: 700; cursor: pointer; }
.tm-read { display: inline-flex; align-items: center; gap: 6px; font-size: var(--fs-xs); font-weight: 700; color: var(--h-acc-edge, var(--good)); }
.tm-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
@media (max-width: 400px) { .tm-tree .tm-tree { padding-left: 12px; } .tm-tree .tm-tree > li { padding-left: 10px; } .tm-b-head h2 { font-size: var(--fs-xl); } .tm-core h1 { font-size: var(--fs-2xl); } }
@media print {
  body * { visibility: hidden !important; }
  .tm-print, .tm-print * { visibility: visible !important; }
  .tm-print { position: absolute; left: 0; top: 0; width: 100%; font-size: 10.5pt; }
  .tm-print .tm-grid { display: block; }
  .tm-print .tm-side, .tm-print .tm-toc-m, .tm-print .tm-noprint { display: none !important; }
  .tm-print .tm-main { max-width: none; }
  .tm-print .tm-node { break-inside: avoid; }
  .tm-print .tm-foot { display: block !important; font-size: 8pt; margin-top: 8mm; }
  .tm-print[data-wm]::before { content: attr(data-wm); position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%) rotate(-30deg); font: 800 28pt/1 system-ui, sans-serif; color: #000; opacity: .06; white-space: nowrap; pointer-events: none; }
}
.tm-foot { display: none; }`;
    document.head.append(s);
  }

  // skok do gałęzi albo węzła: bez animacji, fokus na nagłówku (czytnik ekranu zaczyna od niego)
  function skocz(id) {
    const el = document.getElementById("tm-" + id);
    if (!el) return;
    el.scrollIntoView({ behavior: "auto", block: "start" });
    const hd = el.querySelector("h2, h3") || el;
    if (!hd.hasAttribute("tabindex")) hd.setAttribute("tabindex", "-1");
    try { hd.focus({ preventScroll: true }); } catch { hd.focus(); }
  }

  function render(d, o = {}) {
    const { h, inline, rich } = A();
    if (!h) return [];
    css();
    const txt = (s) => (inline ? inline(String(s || "")) : String(s || ""));
    const md = (s) => (rich ? rich(s) : h("p", {}, txt(s)));
    const branches = (d.branches || []).filter(Boolean);
    const widoczne = o.podglad ? branches.slice(0, 1) : branches;
    const min = (b) => minuty(teksty({ branches: [b] }).reduce((a, s) => a + liczSlowa(s), 0));
    const ref = (id, label) => (o.nazwa && o.otworz && id ? h("button", { type: "button", class: "tm-ref", onclick: () => o.otworz(id) }, label ? `${label}: ${o.nazwa(id)}` : o.nazwa(id)) : null);
    const tag = (t) => h("span", { class: "tm-tag " + t, text: TYPY[t] || "" });

    const wezel = (n) => h("li", { class: "tm-node", id: "tm-" + n.id },
      h("h3", {}, tag(n.t), n.h ? h("span", {}, txt(n.h)) : null),
      n.md ? md(n.md) : null,
      n.f ? h("div", { class: "tm-f" }, txt(n.f), n.legend ? h("small", {}, txt(n.legend)) : null) : null,
      n.steps?.length ? h("ol", {}, n.steps.map((s) => h("li", {}, txt(s)))) : null,
      n.table ? h("div", { class: "tm-tw" }, h("table", {},
        n.table.head?.length ? h("thead", {}, h("tr", {}, n.table.head.map((c) => h("th", { scope: "col" }, txt(c))))) : null,
        h("tbody", {}, (n.table.rows || []).map((r) => h("tr", {}, r.map((c) => h("td", {}, txt(c)))))))) : null,
      n.t === "link" && n.ref ? ref(n.ref) : null,
      n.kids?.length ? h("ul", { class: "tm-tree" }, n.kids.map(wezel)) : null);

    const galaz = (b, i) => h("section", { class: "panel tm-sec tm-branch", id: "tm-" + b.id, "aria-labelledby": "tm-h-" + b.id },
      h("div", { class: "tm-b-head" }, h("span", { class: "tm-b-num", "aria-hidden": "true", text: String(i + 1) }),
        h("div", {}, h("h2", { id: "tm-h-" + b.id }, txt(b.title)), b.lead ? h("p", { class: "tm-lead" }, txt(b.lead)) : null)),
      h("ul", { class: "tm-tree" }, (b.nodes || []).map(wezel)));

    const extra = [d.links?.length ? ["polaczenia", "Jak to się łączy"] : null, d.exam?.length ? ["egzamin", "Na egzaminie"] : null, d.terms?.length ? ["slowa", "Słowa EN–PL"] : null].filter(Boolean);
    const toc = (pelny) => h("ul", { class: "tm-toc" },
      widoczne.map((b, i) => h("li", {}, h("button", { type: "button", onclick: () => skocz(b.id) }, h("span", { class: "tm-tn", text: String(i + 1) }), h("span", {}, txt(b.q || b.title))),
        pelny && b.nodes?.length ? h("ul", {}, b.nodes.filter((n) => n.h).map((n) => h("li", {}, h("button", { type: "button", onclick: () => skocz(n.id) }, txt(n.h))))) : null)),
      o.podglad ? null : extra.map(([k, l]) => h("li", {}, h("button", { type: "button", onclick: () => skocz(k) }, h("span", { class: "tm-tn", text: "·" }), h("span", { text: l })))));

    const wszystkie = slowa(d);
    const core = h("section", { class: "panel tm-sec tm-core", id: "tm-rdzen", "aria-labelledby": "tm-h-rdzen" },
      h("p", { class: "tm-meta" }, [...(o.meta || []), `ok. ${minuty(wszystkie)} min czytania`].flatMap((x, i) => (i ? [h("span", { "aria-hidden": "true", text: " · " }), h("span", { text: x })] : [h("span", { text: x })]))),
      h("h1", { id: "tm-h-rdzen" }, txt(o.tytul || d.title || "")),
      d.core?.one ? h("p", { class: "tm-one" }, txt(d.core.one)) : null,
      d.core?.why ? h("p", {}, txt(d.core.why)) : null,
      h("p", { class: "tm-meta", text: "Czytaj po kolei: każda gałąź korzysta z poprzedniej." }),
      h("ol", { class: "tm-route", "aria-label": "Kolejność czytania" }, branches.map((b, i) => h("li", {},
        h("button", { type: "button", class: "tm-jump", disabled: o.podglad && i > 0 ? true : null, onclick: () => (o.podglad && i > 0 ? null : skocz(b.id)) },
          h("span", { class: "tm-n", "aria-hidden": "true", text: String(i + 1) }), h("span", {}, txt(b.q || b.title)), h("span", { class: "tm-w", text: `${min(b)} min` }))))));

    const pre = d.prereq?.length ? h("section", { class: "panel tm-sec", "aria-labelledby": "tm-h-pre" }, h("h2", { class: "tm-h2", id: "tm-h-pre", text: "Zanim zaczniesz" }),
      h("ul", { class: "tm-plain" }, d.prereq.map((p) => h("li", {}, h("span", {}, txt(p.text)), p.ref ? h("div", {}, ref(p.ref)) : null)))) : null;

    const nazwaGalezi = (id) => { const i = branches.findIndex((b) => b.id === id); return i >= 0 ? String(i + 1) : id; };
    const polaczenia = d.links?.length ? h("section", { class: "panel tm-sec", id: "tm-polaczenia", "aria-labelledby": "tm-h-pol" }, h("h2", { class: "tm-h2", id: "tm-h-pol", text: "Jak to się łączy" }),
      h("ol", { class: "tm-plain" }, d.links.map((l) => h("li", {}, h("b", { text: `${nazwaGalezi(l.from)} → ${l.toLesson ? (o.nazwa?.(l.toLesson) || "inna lekcja") : nazwaGalezi(l.to)}` }), ": ", txt(l.why))))) : null;
    const egzamin = d.exam?.length ? h("section", { class: "panel tm-sec", id: "tm-egzamin", "aria-labelledby": "tm-h-egz" }, h("h2", { class: "tm-h2", id: "tm-h-egz", text: "Na egzaminie" }),
      h("ul", { class: "tm-plain" }, d.exam.map((x) => h("li", {}, txt(x))))) : null;
    const slownik = d.terms?.length ? h("section", { class: "panel tm-sec", id: "tm-slowa", "aria-labelledby": "tm-h-sl" }, h("h2", { class: "tm-h2", id: "tm-h-sl", text: "Słowa EN–PL" }),
      h("div", { class: "tm-tw" }, h("table", {}, h("thead", {}, h("tr", {}, h("th", { scope: "col", text: "English" }), h("th", { scope: "col", text: "Polski" }))),
        h("tbody", {}, d.terms.map((t) => h("tr", {}, h("td", { translate: "no" }, txt(t.en)), h("td", { translate: "no" }, txt(t.pl)))))))) : null;
    const koniec = o.podglad ? o.zamek || null : h("section", { class: "panel tm-sec tm-end tm-noprint", "aria-labelledby": "tm-h-end" },
      h("h2", { class: "tm-h2", id: "tm-h-end", text: "Teoria przeczytana" }),
      h("p", { class: "muted", style: "margin:0", text: o.start ? "Teraz lekcja: te same gałęzie, ale z pytaniami i zadaniami." : "Wróć do przedmiotu albo przeczytaj następną mapę." }),
      h("div", { class: "row" },
        o.start ? h("button", { type: "button", class: "btn primary", onclick: o.start }, o.startTekst || "Zacznij lekcję") : null,
        h("button", { type: "button", class: "btn", onclick: () => skocz("rdzen") }, "Do góry mapy")));

    const main = h("div", { class: "tm-main" },
      h("div", { class: "tm-bar tm-noprint" }, o.wstecz || h("span"), o.podglad ? null : h("button", { type: "button", class: "btn", onclick: () => { o.druk?.(); window.print(); } }, "Drukuj albo zapisz PDF")),
      core,
      h("details", { class: "panel tm-toc-m" }, h("summary", { text: "Cała mapa tematu (spis)" }), toc(false)),
      pre, ...widoczne.map(galaz), o.podglad ? null : polaczenia, o.podglad ? null : egzamin, o.podglad ? null : slownik, koniec,
      h("p", { class: "tm-foot", text: [o.email, "zdawalni.pl", "Mapa teorii"].filter(Boolean).join(" · ") }));
    return [h("article", { class: "tm tm-print", "data-wm": o.email || null, lang: d.lang || null },
      h("div", { class: "tm-grid" }, h("aside", { class: "panel tm-side", "aria-label": "Mapa tematu" }, h("p", { class: "tm-meta", style: "margin-bottom:6px", text: "Mapa tematu" }), toc(true)), main))];
  }

  window.ZD_TEORIA = { TYPY, waliduj, slowa, minuty, render, liczSlowa };
  // Plik ładuje się po aplikacji: gdy ktoś wszedł prosto w #/teoria/…, dorysuj ekran.
  try { const Z = window.ZD_APP; if (Z?.render && Z.S?.route?.view === "teoria") Z.render(); } catch {}
})();
