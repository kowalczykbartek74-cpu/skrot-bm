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
  const txt = (v) => (v == null ? "" : String(v));
  window.txt = window.txt || txt;
  window.ZD_UX4 = Object.assign(window.ZD_UX4 || {}, { pomoc, wiersz, oknoPomocy, pusty, txt });
})();
// Plik ładuje się po skrypcie aplikacji: jeśli ekran już się narysował (bez „?” z tego pliku), rysujemy go raz jeszcze.
(() => { const A = window.ZD_APP; if (A?.render && document.querySelector("#main > *")) try { A.render(); } catch {} })();
