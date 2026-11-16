// Pętla UX-1: wejście, okres próbny i zakup (docs/audyt-ux/petla-1/). Własny plik pętli: aplikacja (index.html) jest zamkniętą
// funkcją, więc korzystamy z niej przez most window.ZD_APP (blok „most ux-1” na końcu aplikacji) i tylko w chwili wywołania.
// Wystawiamy window.ZD_WEJSCIE (umowa z pętlą 2): pasekProby() → węzeł albo null, przyciskZakupu(kontekst) → przycisk.
(() => {
  "use strict";
  const A = () => window.ZD_APP || {};
  const SK = () => window.skrot || {};
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch {} },
  };
  const svg = (paths, size = 20) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  // Ikony wspólne (A4d, rysunki dosłownie) i własne z prefiksem ux1-.
  const IK = {
    play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5l5.5 3.5-5.5 3.5z"/>',
    ticket: '<path d="M3 8a2 2 0 0 0 0 4v4h18v-4a2 2 0 0 0 0-4V4H3z"/><path d="M13 4v16" stroke-dasharray="2 2"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    "ux1-clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  };
  const ico = (k, size) => { const s = document.createElement("span"); s.className = "uxw-ico"; s.innerHTML = svg(IK[k], size); return s; };
  // Element DOM bez zależności od h() aplikacji (działa też przed jej startem).
  const el = (tag, props = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === "text") n.textContent = v; else if (k.startsWith("on")) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v === true ? "" : v);
    }
    n.append(...kids.flat().filter((x) => x != null && x !== false));
    return n;
  };
  const icoReg = () => { const I = A().H2_ICO; if (!I) return; for (const k of Object.keys(IK)) if (!I[k]) I[k] = svg(IK[k]); };

  // Stan konta z punktu widzenia wejścia i zakupu.
  //   brak (gość) · darmowe (próba możliwa albo nie) · proba (trwa) · proba-koniec (minęła, bez zakupu) · platne
  const stan = () => {
    const sk = SK();
    if (sk.state !== "in") return sk.state === "out" ? "brak" : "loading";
    if (sk.paid && sk.trialUntil) return "proba";
    if (sk.paid) return "platne";
    if (sk.trialCan) return "darmowe-proba";
    return "darmowe";
  };

  // ---------- pigułka okresu próbnego nad panelem Stasia (Dziś) ----------
  function pasekProby() {
    icoReg();
    const sk = SK(), st = stan();
    if (st === "darmowe-proba") {
      const d = sk.trialDays || 3;
      return el("section", { class: "uxw-pasek uxw-mozna", "aria-label": "Okres próbny" },
        ico("ticket", 20),
        el("span", { class: "uxw-pasek-t", text: `Masz jeszcze ${d} dni za darmo` }),
        // EN jak w C1 („Start”); „Włącz” ma w słowniku ogólne „Turn on”, więc tłumaczymy tu (data-noi18n).
        el("button", { type: "button", class: "uxw-pasek-b", "data-noi18n": "", onclick: () => sk.startTrial?.() }, window.SKROT_LANG === "en" ? "Start" : "Włącz"));
    }
    return null;
  }

  // ---------- przycisk zakupu zależny od stanu konta (umowa z pętlą 2) ----------
  function przyciskZakupu() { return null; }

  window.ZD_WEJSCIE = Object.assign(window.ZD_WEJSCIE || {}, { pasekProby, przyciskZakupu, stan });
})();
