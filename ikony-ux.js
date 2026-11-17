/* Pętla UX-4 – wygląd: wspólne komponenty i ikony SVG (etap A).
   Korzysta z window.ZD_APP (most w index.html) dopiero w chwili wywołania. Wystawia window.ZD_UX4.
   - pomoc(ekran, tytul, tresc): przycisk „?” (.help-btn, 32 px wizualnie, pole 44 px) otwierający okno „Jak działa …”.
   - wiersz(h1, przycisk): wiersz tytułu ekranu z „?” zawsze po prawej (.th-row).
   - txt(v): pusty tekst dla undefined/null (do h(…, { text })). */
(() => {
  "use strict";
  const A = () => window.ZD_APP || {};
  // Okno pomocy: nagłówek „Jak działa …”, akapity albo lista punktów, jeden przycisk „Zamknij”.
  function oknoPomocy(tytul, tresc) {
    const { h, modal } = A();
    if (!h || !modal) return;
    const lista = Array.isArray(tresc) ? tresc : [tresc];
    modal((close) => [
      h("div", { class: "ts-grip", "aria-hidden": "true" }),
      h("h2", { text: tytul }),
      lista.length > 1 ? h("ul", { class: "zal-list" }, lista.map((t) => h("li", { text: t }))) : h("p", { text: lista[0] }),
      h("button", { type: "button", class: "btn ux4-okno-zamknij", onclick: close }, "Zamknij"),
    ], "tsheet");
  }
  // tytul = „Jak działa Kalendarz” (pełne zdanie, ma parę w i18n-en.js), tresc = tekst albo lista punktów, albo funkcja (własne okno).
  function pomoc(tytul, tresc) {
    const { h } = A();
    return h("button", { type: "button", class: "help-btn ux4-help", "aria-label": tytul, title: tytul, onclick: () => (typeof tresc === "function" ? tresc() : oknoPomocy(tytul, tresc)) }, "?");
  }
  function wiersz(...dzieci) {
    const { h } = A();
    return h("div", { class: "th-row" }, ...dzieci);
  }
  // Stan pusty / błąd: Staś (mina „oops”), tytuł, jedno zdanie i jeden główny przycisk. przycisk = { tekst, akcja }.
  function pusty({ tytul, tekst, przycisk, mina = "oops" }) {
    const { h, stasFace } = A();
    return h("section", { class: "empty ux4-empty", role: "status" },
      stasFace ? stasFace(mina) : null,
      h("div", { class: "ux4-empty-txt" },
        h("h2", { text: tytul }),
        tekst ? h("p", { class: "muted", text: tekst }) : null,
        przycisk ? h("button", { type: "button", class: "btn primary", onclick: przycisk.akcja }, przycisk.tekst) : null));
  }
  // ---------- W4. Ikony SVG (A4d): viewBox 24, currentColor, kreska 2,2, zaokrąglone końce ----------
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
  // Własne ikony pętli 4 (prefiks ux4-): Więcej, Ustawienia (po jednej na motyw), Słowniczek, poziom.
  const IKONY_UX4 = {
    "ux4-duet":      '<circle cx="9" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.5"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M14 14.2a4.5 4.5 0 0 1 6.5 4.3"/>',
    "ux4-paleta":    '<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 2-2 0-1.3-1-1.7-1-3 0-1.1.9-2 2-2h2.5A3.5 3.5 0 0 0 21 10.5C21 6.4 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="14.5" cy="7" r="1.2"/>',
    "ux4-dzwonek":   '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
    "ux4-jezyk":     '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z"/>',
    "ux4-slonce":    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>',
    "ux4-ksiezyc":   '<path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z"/>',
    "ux4-jednorozec":'<path d="M7 21v-5l-3-3 4-6h5l5 4-2 3h-3v7"/><path d="M12 7l3-5"/><circle cx="12.5" cy="10" r=".8"/>',
    "ux4-kokardka":  '<path d="M12 11C10 7.5 5 6 3.5 8.5S6.5 15 12 11z"/><path d="M12 11c2-3.5 7-5 8.5-2.5S17.5 15 12 11z"/><circle cx="12" cy="11" r="1.6"/><path d="M11 12.6l-2.5 7.4M13 12.6l2.5 7.4"/>',
    "ux4-laka":      '<path d="M3 20h18"/><path d="M8 20c0-5-1-8-3-10M16 20c0-5 1-8 3-10"/><path d="M12 20V9"/><circle cx="12" cy="6" r="2.5"/>',
    "ux4-lotos":     '<path d="M12 18c-2.5-2-2.5-7 0-11 2.5 4 2.5 9 0 11z"/><path d="M12 18c-4 0-7-3-7.5-6.5 3.5 0 6 2.5 7.5 6.5zM12 18c4 0 7-3 7.5-6.5-3.5 0-6 2.5-7.5 6.5z"/>',
    "ux4-zagiel":    '<path d="M12 3v14"/><path d="M12 4l7 11h-7z"/><path d="M11 7L5.5 15H11z"/><path d="M3 18.5h18l-2 2.5H5z"/>',
    "ux4-noc":       '<path d="M15 14.5A6.5 6.5 0 1 1 9.5 6 5 5 0 0 0 15 14.5z"/><path d="M18 3l.8 1.7L20.5 5.5l-1.7.8L18 8l-.8-1.7-1.7-.8 1.7-.8zM19.5 11v3M18 12.5h3"/>',
    "ux4-palma":     '<path d="M12 21c0-5 .5-9 1.5-12"/><path d="M13.5 9C11 6 7 6 4.5 8.5 8 8.2 10.5 8.5 13.5 9zM13.5 9c1-3.5 4-5.3 7.5-4.5-3 1.3-5 2.8-7.5 4.5zM13.5 9c3 .5 5.5 2.5 6 6-2.3-2.4-4.2-4-6-6z"/><path d="M8 21h9"/>',
    "ux4-kotwica":   '<circle cx="12" cy="5" r="2"/><path d="M12 7v14"/><path d="M8 11h8"/><path d="M4.5 14a7.5 7.5 0 0 0 15 0"/><path d="M4.5 14l-1 1.5M19.5 14l1 1.5"/>',
    "ux4-pary":      '<rect x="3" y="5" width="9" height="13" rx="2"/><rect x="12" y="6" width="9" height="13" rx="2" transform="rotate(8 16.5 12.5)"/>',
    "ux4-link":      '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    "ux4-lisc":      '<path d="M5 19c0-8 5.5-14 15-14 0 9.5-6 15-14 15"/><path d="M5 19l8-8"/>',
    "ux4-sklep":     '<path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
    "ux4-wykres":    '<path d="M4 20V4"/><path d="M4 20h16"/><path d="M8 16l4-5 3 3 5-7"/>',
    "ux4-poziom":    '<path d="M12 2.5l7.5 4.3v8.4L12 19.5l-7.5-4.3V6.8z"/><path d="M8.5 21.5l1-3M15.5 21.5l-1-3"/>'
  };
  const SVG = (body, px = 20) => `<svg viewBox="0 0 24 24" width="${px}" height="${px}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  const NAZWY = { ...IKONY_WSPOLNE, ...IKONY_UX4 };
  // Dopisanie do H2_ICO (przy pierwszym użyciu albo starcie): wspólne nazwy dokładnie z A4d, własne z prefiksem ux4-.
  let wpisane = false;
  function wpisz() { const I = A().H2_ICO; if (!I || wpisane) return; wpisane = true; const dod = {}; for (const [k, v] of Object.entries(NAZWY)) if (!I[k]) dod[k] = SVG(v); Object.assign(I, dod); }
  // ikona(nazwa): <span class="ico ux4-ico"> z SVG (rozmiar przez CSS, 20 px).
  function ikona(nazwa, cls) {
    wpisz(); const { h } = A(); if (!NAZWY[nazwa] || !h) return null;
    const e = h("span", { class: "ico ux4-ico" + (cls ? " " + cls : ""), "aria-hidden": "true" }); e.innerHTML = SVG(NAZWY[nazwa]); return e;
  }
  // Ikony motywów w Ustawieniach (różne dla każdego motywu; „Zielony ciemny” ≠ „Nocny rejs”).
  const MOTYW = { light: "ux4-slonce", dark: "ux4-ksiezyc", pink: "ux4-jednorozec", bow: "ux4-kokardka", meadow: "ux4-laka", lilia: "ux4-lotos", sea: "ux4-zagiel", noc: "ux4-noc", riwiera: "ux4-palma", klub: "ux4-kotwica" };
  const ikonaMotywu = (id) => (MOTYW[id] ? ikona(MOTYW[id], "ux4-motyw") : null);
  // Odznaka poziomu na Więcej: sześciokąt z numerem (zamiast emoji poziomu; nazwa poziomu jest obok w tekście).
  function odznakaPoziomu(n) {
    const { h } = A(); if (!h) return null;
    return h("span", { class: "rk-badge ux4-lv", "aria-hidden": "true" }, ikona("ux4-poziom"), h("span", { class: "ux4-lv-n num", text: String(n) }));
  }
  // Liczniki „XP · monety · seria” jako ikona + liczba (moneta i płomień to istniejące ikony marki z H2_ICO).
  function liczniki(xp, monety, seria, dniTxt) {
    const { h, h2Ico } = A(); if (!h) return null;
    const para = (ico, txt) => h("span", { class: "ux4-stat" }, ico, h("span", { text: txt }));
    return h("small", { class: "num ux4-stats" },
      para(ikona("bolt"), `${xp} XP`),
      monety != null ? para(h2Ico ? h2Ico("coin", "🪙") : null, monety) : null,
      para(h2Ico ? h2Ico("flame", "🔥") : null, dniTxt));
  }
  const txt = (v) => (v == null ? "" : String(v));
  window.txt = window.txt || txt;
  window.ZD_UX4 = Object.assign(window.ZD_UX4 || {}, { pomoc, wiersz, oknoPomocy, pusty, txt, ikona, ikonaMotywu, odznakaPoziomu, liczniki, wpisz });
})();
// Plik ładuje się po skrypcie aplikacji: jeśli ekran już się narysował (bez „?” z tego pliku), rysujemy go raz jeszcze.
(() => { const A = window.ZD_APP; if (A?.render && document.querySelector("#main > *")) try { A.render(); } catch {} })();
