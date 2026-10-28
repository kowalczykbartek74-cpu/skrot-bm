// Skrót BM: demo Fruń na ekranie logowania (SPEC 10.1). Ładowane tylko z #login, razem z gry.js.
// Bez bazy i bez zapisu: zamiast GRY_API z index.html (aplikacja jest wtedy ukryta) własny, minimalny zestaw.
(() => {
  "use strict";
  const EN = window.SKROT_LANG === "en";
  // Pytania napisane od nowa (nie z materiałów): makroekonomia, prawo, finanse. [pytanie, odpowiedzi (pierwsza dobra), wyjaśnienie]
  const QS = [
    [["Co mierzy PKB?", ["Wartość dóbr i usług finalnych wytworzonych w kraju w danym okresie", "Sumę transakcji na giełdzie", "Dług publiczny państwa", "Liczbę osób pracujących"], "PKB liczy wartość tego, co gospodarka wytworzyła na końcowe potrzeby w danym okresie."],
     ["What does GDP measure?", ["The value of final goods and services produced in a country in a period", "The total of stock market trades", "The government's public debt", "The number of people in work"], "GDP counts the value of what the economy produced for final use in a period."]],
    [["Inflacja to…", ["Ogólny wzrost poziomu cen", "Wzrost liczby firm", "Spadek bezrobocia", "Wzrost eksportu"], "Gdy rośnie ogólny poziom cen, za te same pieniądze kupisz mniej."],
     ["Inflation is…", ["A general rise in the price level", "A rise in the number of firms", "A fall in unemployment", "A rise in exports"], "When the general price level rises, the same money buys less."]],
    [["Najwyższym aktem prawnym w Polsce jest…", ["Konstytucja", "Ustawa", "Rozporządzenie", "Uchwała rady gminy"], "Konstytucja stoi na szczycie hierarchii źródeł prawa; inne akty muszą być z nią zgodne."],
     ["The highest legal act in Poland is…", ["The Constitution", "A statute", "A regulation", "A municipal council resolution"], "The Constitution is at the top of the hierarchy of legal sources; other acts must comply with it."]],
    [["Pełną zdolność do czynności prawnych osoba fizyczna uzyskuje zasadniczo…", ["Z chwilą ukończenia 18 lat", "Z chwilą urodzenia", "Z chwilą ukończenia 13 lat", "Po zdaniu matury"], "Pełnoletność, a z nią pełna zdolność do czynności prawnych, przychodzi zasadniczo w wieku 18 lat."],
     ["A natural person generally gains full legal capacity…", ["On turning 18", "At birth", "On turning 13", "After passing the final school exams"], "Adulthood, and with it full legal capacity, generally comes at 18."]],
    [["Wpłacasz 1000 zł na lokatę 10% w skali roku (bez podatku). Ile masz po roku?", ["1100 zł", "1010 zł", "1000 zł", "1200 zł"], "Odsetki to 10% z 1000 zł, czyli 100 zł."],
     ["You deposit 1000 zł at 10% a year (no tax). How much do you have after a year?", ["1100 zł", "1010 zł", "1000 zł", "1200 zł"], "Interest is 10% of 1000 zł, i.e. 100 zł."]],
    [["Płynność finansowa firmy to…", ["Zdolność do terminowego regulowania bieżących zobowiązań", "Wysokość zysku netto", "Wartość majątku trwałego", "Liczba klientów"], "Firma płynna ma czym zapłacić rachunki, gdy przychodzi termin."],
     ["A company's liquidity is…", ["Its ability to pay current obligations on time", "The size of its net profit", "The value of its fixed assets", "The number of its customers"], "A liquid company has the means to pay its bills when they fall due."]],
  ];
  const h = (tag, props, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v; else if (k === "text") el.textContent = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v); else if (k === "style") el.style.cssText = v;
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const c of kids.flat(Infinity)) if (c != null && c !== false) el.append(c instanceof Node ? c : String(c));
    return el;
  };
  const root = () => document.querySelector(".gry") || document.body;
  const toast = (msg) => { root().querySelectorAll(".gry-toast").forEach((x) => x.remove()); const t = h("div", { class: "toast gry-toast", role: "status", text: msg }); root().append(t); setTimeout(() => t.remove(), 3200); };
  const modal = (build) => {
    const close = () => scrim.remove();
    const box = h("div", { class: "modal", role: "dialog", "aria-modal": "true" }, build(close));
    const scrim = h("div", { class: "scrim gry-scrim", onclick: (e) => { if (e.target === scrim) close(); } }, box);
    root().append(scrim); box.querySelector("button")?.focus();
  };
  const plural = (n, one, few, many) => { if (window.SKROT_I18N?.en) return window.SKROT_I18N.plural(n, one, few, many); const a = n % 10, b = n % 100; return n === 1 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many; };
  window.SKROT_GRY_DEMO = () => ({
    demo: true, h, toast, modal, EN, plural,
    T: (s) => window.SKROT_I18N?.t?.(s) ?? s,
    reduced: () => document.documentElement.classList.contains("calm") || matchMedia("(prefers-reduced-motion: reduce)").matches,
    confetti() {}, banner() {}, buzz: (ok) => { try { navigator.vibrate?.(ok ? 12 : [30, 40, 30]); } catch {} },
    xp: () => 0, subjects: () => [], defaultSid: () => null,
    questions: async () => QS.map((x, i) => { const [q, options, explanation] = x[EN ? 1 : 0]; return { q, options, correct: 0, explanation, why: explanation, materialId: "demo" + i, index: 0 }; })
      .map((q) => ({ q, k: Math.random() })).sort((a, b) => a.k - b.k).map((x) => x.q),
    tasks: async () => [], pairs: async () => [], onWrong() {}, srsAdd() {},
    rp: null, css: (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), close() {},
    numMatch: () => null, parseNum: (v) => Number(v), fmtNum: (x) => String(x),
    firstSentence: (t) => (String(t || "").match(/^.+?[.!?](\s|$)/) || [String(t || "")])[0].trim(),
    subjectOf: () => null, materialTitle: () => "", material() {},
    // „Zaloguj się albo kup dostęp”: gra się zamyka, fokus na polu formularza logowania
    login: () => { const i = document.querySelector("#loginBox input, #loginBox button"); i?.focus(); },
  });
})();
