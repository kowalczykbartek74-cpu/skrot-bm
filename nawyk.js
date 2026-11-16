// Pętla UX-2: nawyk, seria i powroty (window.ZD_NAWYK).
// Logika bez DOM jest w ZD_NAWYK.L (testy: node --test tests/nawyk.test.js). Kod aplikacji (h, S, modal…) bierzemy z mostu
// window.ZD_APP dopiero w chwili wywołania (blok „most ux-2” na końcu aplikacji w index.html).
// Wszystkie polskie teksty są w PL (para EN w i18n-en.js, blok „// ux-2”); {0}, {1} = wstawiane wartości.
(function () {
  "use strict";
  const W = typeof window !== "undefined" ? window : null;
  const A = () => (W && W.ZD_APP) || {};
  const PL = {
    seriaTodo: "Ucz się dziś, żeby seria nie spadła",
    seriaRisk: "Seria spadnie o północy. Wystarczy 5 minut.",
    seriaDone: "Dziś już się uczysz. Seria bezpieczna.",
    seriaStart: "Ucz się dziś, żeby zacząć serię",
    doPolnocy: "· do północy",
    celDnia: "Cel dnia: {0}/{1} XP",
    oknoTytul: "Twoja seria",
    oknoStanTodo: "Dziś jeszcze bez nauki. Jedna karta 5 minut i seria rośnie.",
    oknoStanRisk: "Zostało kilka godzin do północy. Jedna karta 5 minut i seria rośnie.",
    oknoStanDone: "Dziś zrobione. Wróć jutro, a seria urośnie.",
    oknoStanZero: "Pierwszy dzień nauki zaczyna serię.",
    ostatnie4: "Ostatnie 4 tygodnie",
    lgNauka: "nauka",
    lgZamroz: "zamrożony",
    lgPrzerwa: "przerwa w zajęciach",
    lgDzis: "dziś",
    lgBrak: "bez nauki",
    lgDzisTodo: "dziś do zrobienia",
    zasady: "Bez nauki dziś i bez zamrożenia seria spada do 0 o północy. Zamrożenia chronią do 2 dni z rzędu (np. weekend), a przerwy w zajęciach nie zrywają serii.",
    jutroSeria: "Wróć jutro, a seria urośnie do {0}.",
    dzienNauka: "{0}: nauka",
    dzienZamroz: "{0}: chroniony zamrożeniem",
    dzienPrzerwa: "{0}: przerwa",
    dzienBrak: "{0}: bez nauki",
    dzienPrzyszly: "{0}: jeszcze przed Tobą",
    zamTytul: "Zamrożenia serii",
    zamMasz: "Masz {0}/2",
    zamOpis: "Chroni do 2 opuszczonych dni z rzędu. Nie daje XP ani punktów.",
    zamSklep: "Kup w sklepie",
    zamKomplet: "Masz komplet",
    najlepsza: "Najlepsza seria: {0}",
    kamienie: "Kamienie milowe",
    doKamienia: "Do {0} dni: jeszcze {1}",
    wszystkieKamienie: "Wszystkie kamienie milowe zdobyte.",
    zamknij: "Zamknij",
    uczSie: "Karta 5 minut",
    seriaPlus: "Seria +1",
    kamienMilowy: "Kamień milowy: {0} dni",
    tydzienTen: "Ten tydzień",
    seriaN: "Seria: {0}",
  };
  const fmt = (s, ...a) => String(s).replace(/\{(\d)\}/g, (_, i) => (a[+i] ?? ""));
  const KAMIENIE = [3, 7, 14, 30, 50, 100];
  const GOAL = 30;

  // ---------------------------------------------------------------- logika bez DOM
  // Dni to numery dayN (0 = 1.01.2026, czas lokalny). Dzień tygodnia od poniedziałku: (t + 3) % 7 (1.01.2026 był czwartkiem).
  const L = {
    KAMIENIE, GOAL,
    dow: (t) => (((t + 3) % 7) + 7) % 7,
    poniedzialek: (t) => t - L.dow(t),
    // Stan pigułki: none (bez serii), todo (seria > 0, dziś bez nauki), risk (to samo od 18:00), done (dziś była nauka).
    stanDnia(sk, doneToday, godz) {
      if (doneToday) return "done";
      if (!(sk > 0)) return "none";
      return godz >= 18 ? "risk" : "todo";
    },
    celDnia(progress, t, cel = GOAL) {
      const x = (progress && progress.xp) || {};
      return { xp: x.d === t ? Math.max(0, x.n || 0) : 0, cel };
    },
    // Dni nauki: zapisane w progress.nd (od tej pętli) + ostatni dzień XP + uzupełnienie bieżącej serii (niżej).
    dniNauki(progress, zamrozone = [], przerwa = () => false) {
      const set = new Set((progress && Array.isArray(progress.nd) ? progress.nd : []).filter(Number.isFinite));
      const x = progress && progress.xp, st = progress && progress.streak;
      if (x && Number.isFinite(x.d) && (x.n || 0) > 0) set.add(x.d);
      // Bieżąca seria ma zawsze dokładnie streak.n dni nauki: wstecz od streak.d bierzemy dni z nd, a gdy nd ich nie zna
      // (konto sprzed progress.nd), dni, które nie są zamrożone ani przerwą. Dzięki temu kalendarz zgadza się z liczbą serii.
      if (st && Number.isFinite(st.d) && st.n > 0) {
        const zam = new Set(zamrozone), znane = new Set(set);
        let left = st.n;
        for (let d = st.d; left > 0 && d > st.d - 400; d--) {
          if (znane.has(d)) { left--; continue; }
          if (zam.has(d) || przerwa(d)) continue;
          set.add(d); left--;
        }
      }
      return set;
    },
    // Ile dni nauki ma bieżąca seria w kalendarzu (do sprawdzenia zgodności z liczbą serii).
    dniSerii(progress, nauka, zamrozone = [], przerwa = () => false) {
      const st = progress && progress.streak; if (!st || !(st.n > 0)) return 0;
      const zam = new Set(zamrozone); let k = 0;
      for (let d = st.d; d > st.d - 400; d--) { if (nauka.has(d)) k++; else if (!(zam.has(d) || przerwa(d))) break; }
      return k;
    },
    // Godzina w Warszawie (stan „do północy” od 18:00 czasu polskiego, niezależnie od strefy telefonu).
    godzinaPL(now = new Date()) {
      try { return +new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Europe/Warsaw" }).format(now); } catch (e) { return now.getHours(); }
    },
    // Dopisanie dnia do progress.nd (najwyżej 120 ostatnich) i najlepszej serii; null = nic do zmiany.
    seriaPatch(progress, t, sn) {
      const nd = Array.isArray(progress && progress.nd) ? progress.nd.filter(Number.isFinite) : [];
      const out = {};
      if (!nd.includes(t)) out.nd = [...nd.filter((d) => d > t - 120), t].sort((a, b) => a - b);
      const best = Math.max((progress && progress.streakBest) || 0, (sn && sn.n) || 0, (progress && progress.streak && progress.streak.n) || 0);
      if (best > ((progress && progress.streakBest) || 0)) out.streakBest = best;
      return Object.keys(out).length ? out : null;
    },
    // Kalendarz: tygodnie (pon–nd) kończące się bieżącym; każdy dzień: nauka | zamroz | przerwa | brak | przyszly.
    kalendarz(t, tygodni, nauka, zamrozone, przerwa) {
      const zam = new Set(zamrozone || []), start = L.poniedzialek(t) - 7 * (tygodni - 1), out = [];
      for (let w = 0; w < tygodni; w++) {
        const row = [];
        for (let i = 0; i < 7; i++) {
          const d = start + w * 7 + i;
          const s = d > t ? "przyszly" : nauka.has(d) ? "nauka" : zam.has(d) ? "zamroz" : przerwa(d) ? "przerwa" : "brak";
          row.push({ d, s, dzis: d === t });
        }
        out.push(row);
      }
      return out;
    },
    tydzien(t, nauka, zamrozone, przerwa) { return L.kalendarz(t, 1, nauka, zamrozone, przerwa)[0]; },
    kamien: (n) => KAMIENIE.includes(n),
    nastepnyKamien: (n) => KAMIENIE.find((k) => k > n) || null,
    // Ekran „Seria +1”: dziś przedłużona seria (streak.d === dziś) i jeszcze nie pokazany dziś.
    pokazacEkran(progress, t, shownKey, todayKey) {
      const st = progress && progress.streak;
      return !!(st && st.d === t && st.n > 0 && shownKey !== todayKey);
    },
  };

  // ---------------------------------------------------------------- pomocnicze (DOM)
  const lang = () => (W.SKROT_LANG === "en" ? "en" : "pl");
  const reduced = () => document.documentElement.classList.contains("calm") || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const svg = (inner, size = 20, cls = "") => {
    const s = document.createElement("span");
    s.className = "nw-ico" + (cls ? " " + cls : ""); s.setAttribute("aria-hidden", "true");
    s.innerHTML = `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
    return s;
  };
  const IKONY = {
    snow: '<path d="M12 2v20M4.9 6.5l14.2 11M19.1 6.5L4.9 17.5"/><path d="M9.5 3.5L12 6l2.5-2.5M9.5 20.5L12 18l2.5 2.5"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.6 2.6L16 9.5"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    "ux2-klepsydra": '<path d="M6 3h12M6 21h12"/><path d="M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9"/>',
    "ux2-medal": '<circle cx="12" cy="14" r="6"/><path d="M8.5 9L6 2h4l2 5M15.5 9L18 2h-4l-2 5"/><path d="M12 11.5v5"/>',
  };
  const progress = () => A().S?.progress || {};
  const today = () => A().dayN?.() ?? 0;
  const zamDni = () => {
    const ap = A(), dk = ap.kSk?.().zamrozenia?.dni || [];
    return dk.map((k) => ap.dayN?.(k)).filter(Number.isFinite);
  };
  const zamMa = () => A().kSk?.().zamrozenia?.ma || 0;
  // Przerwa w zajęciach (okres z „Przerwa” w opisie albo dzień wolny z kalendarza uczelni) – bez soboty i niedzieli.
  const dzienKey = (d) => A().dkey?.(new Date(2026, 0, 1 + d));
  function przerwa(d) {
    const ap = A(), CAL = ap.cal?.(); if (!CAL) return false;
    const k = dzienKey(d); if (!k) return false;
    if (CAL.OFF && CAL.OFF[k]) return true;
    const per = (CAL.PERIODS || []).find((o) => k >= o.od && k <= o.do);
    return !!(per && /przerwa/i.test(per.opis || ""));
  }
  const dzienLabel = (d) => {
    const dt = new Date(2026, 0, 1 + d);
    return dt.toLocaleDateString(lang() === "en" ? "en-GB" : "pl-PL", { weekday: "short", day: "numeric", month: "short" });
  };
  const dowLetters = () => {
    const out = [];
    for (let i = 0; i < 7; i++) out.push(new Date(2026, 10, 2 + i).toLocaleDateString(lang() === "en" ? "en-GB" : "pl-PL", { weekday: "narrow" }).toUpperCase());
    return out;
  };
  const dni = (n) => `${n} ${A().plural ? A().plural(n, "dzień", "dni", "dni") : "dni"}`;
  function stanTeraz() {
    const ap = A(), t = today(), p = progress(), sk = ap.streakN ? ap.streakN() : 0;
    const doneToday = !!(p.streak && p.streak.d === t && (p.streak.n || 0) > 0);
    return { t, sk, doneToday, stan: L.stanDnia(sk, doneToday, L.godzinaPL()) };
  }

  // ---------------------------------------------------------------- pierścień celu dnia (20 px)
  function ring(frac, size = 20) {
    const r = (size - 4) / 2, c = 2 * Math.PI * r, f = Math.max(0, Math.min(1, frac));
    const s = document.createElement("span");
    s.className = "nw-ring" + (f >= 1 ? " full" : "");
    s.innerHTML = `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="nw-ring-t"/>${f > 0 ? `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="nw-ring-f" stroke-dasharray="${(c * f).toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>` : ""}</svg>`;
    return s;
  }
  function celDnia() { return L.celDnia(progress(), today(), A().celXp ? A().celXp() : GOAL); }

  // ---------------------------------------------------------------- pigułka serii (lpLevelBar)
  // compact = wersja pod powitaniem na Dziś; zwraca <button>, który otwiera okno „Twoja seria”.
  function pigulka(compact) {
    const ap = A(), { h } = ap; if (!h) return null;
    const { sk, stan } = stanTeraz(), g = celDnia();
    const tytul = stan === "done" ? PL.seriaDone : stan === "risk" ? PL.seriaRisk : stan === "todo" ? PL.seriaTodo : PL.seriaStart;
    const word = compact ? ap.plural(sk, "dzień", "dni", "dni") : ap.plural(sk, "dzień z rzędu", "dni z rzędu", "dni z rzędu");
    const rg = ring(g.xp / g.cel); rg.setAttribute("role", "img"); rg.setAttribute("aria-label", fmt(PL.celDnia, g.xp, g.cel)); rg.removeAttribute("aria-hidden");
    rg.title = fmt(PL.celDnia, g.xp, g.cel);
    const cls = "xp-chip nw-streak streak-" + stan + (sk ? "" : " off");
    return h("button", { type: "button", class: cls, title: tytul, "aria-haspopup": "dialog", onclick: (e) => { e.stopPropagation(); oknoSerii(); } },
      ap.kFlame(), h("b", { class: "num", text: String(sk) }), h("span", { class: "nw-word", text: " " + word }),
      stan === "risk" ? h("span", { class: "nw-risk", text: " " + PL.doPolnocy }) : null,
      stan === "todo" ? svg(IKONY["ux2-klepsydra"], 16, "nw-klep") : null,
      rg);
  }

  // Po XP (xpFlush): dopisanie dnia nauki i najlepszej serii; pigułki na ekranie odświeżamy w miejscu (xpFlush nie rysuje ekranu).
  function poXp(prog, t, sn) {
    const patch = L.seriaPatch(prog, t, sn);
    setTimeout(odswiezPigulki, 0);
    return patch;
  }
  function odswiezPigulki() {
    document.querySelectorAll(".nw-streak").forEach((el) => {
      const nw = pigulka(!!el.closest(".rk-compact"));
      if (nw) el.replaceWith(nw);
    });
  }

  // ---------------------------------------------------------------- okno „Twoja seria”
  function kalendarzEl(t, tygodni) {
    const ap = A(), { h } = ap, p = progress(), zam = zamDni();
    const nauka = L.dniNauki(p, zam, przerwa), cal = L.kalendarz(t, tygodni, nauka, zam, przerwa), lt = dowLetters();
    const lab = { nauka: PL.dzienNauka, zamroz: PL.dzienZamroz, przerwa: PL.dzienPrzerwa, brak: PL.dzienBrak, przyszly: PL.dzienPrzyszly };
    return h("div", { class: "nw-cal", role: "group", "aria-label": PL.ostatnie4 },
      h("div", { class: "nw-cal-row nw-cal-head", "aria-hidden": "true" }, lt.map((x) => h("span", { text: x }))),
      cal.map((row) => h("div", { class: "nw-cal-row" }, row.map((c) => {
        const el = h("span", { class: `nw-day s-${c.s}${c.dzis ? " dzis" + (c.s === "brak" ? " todo" : "") : ""}`, role: "img", "aria-label": fmt(lab[c.s], dzienLabel(c.d)) + (c.dzis ? ` (${PL.lgDzis})` : "") });
        if (c.s === "nauka") el.append(svg('<path d="M7 12.5l3.2 3.2L17 9"/>', 14));
        else if (c.s === "zamroz") el.append(svg(IKONY.snow, 14));
        return el;
      }))),
      h("div", { class: "nw-legend" },
        h("span", {}, h("i", { class: "nw-day s-nauka mini", "aria-hidden": "true" }), h("span", { text: PL.lgNauka })),
        h("span", {}, h("i", { class: "nw-day s-zamroz mini", "aria-hidden": "true" }), h("span", { text: PL.lgZamroz })),
        h("span", {}, h("i", { class: "nw-day s-przerwa mini", "aria-hidden": "true" }), h("span", { text: PL.lgPrzerwa })),
        h("span", {}, h("i", { class: "nw-day s-brak mini", "aria-hidden": "true" }), h("span", { text: PL.lgBrak })),
        h("span", {}, h("i", { class: "nw-day s-brak dzis todo mini", "aria-hidden": "true" }), h("span", { text: PL.lgDzisTodo }))));
  }
  function kamienieEl(n) {
    const { h } = A(), nx = L.nastepnyKamien(n);
    return h("div", { class: "nw-steps-box" },
      h("div", { class: "nw-steps", role: "list", "aria-label": PL.kamienie }, KAMIENIE.map((k) => h("span", { role: "listitem", class: "nw-step" + (n >= k ? " on" : k === nx ? " nx" : ""), "aria-label": `${dni(k)}${n >= k ? " ✓" : ""}` },
        n >= k ? svg(IKONY["ux2-medal"], 14) : null, h("b", { class: "num", text: String(k) })))),
      h("p", { class: "nw-next muted", text: nx ? fmt(PL.doKamienia, nx, dni(nx - n)) : PL.wszystkieKamienie }));
  }
  function oknoSerii() {
    const ap = A(), { h, modal } = ap; if (!h || !modal) return;
    const { t, sk, stan } = stanTeraz(), p = progress(), g = celDnia(), ma = zamMa();
    const best = Math.max(p.streakBest || 0, sk);
    const opis = stan === "done" ? PL.oknoStanDone : stan === "risk" ? PL.oknoStanRisk : stan === "todo" ? PL.oknoStanTodo : PL.oknoStanZero;
    modal((close) => [
      h("div", { class: "nw-okno nw-st-" + stan },
        h("div", { class: "nw-okno-top" },
          h("span", { class: "nw-big-flame" + (stan === "done" ? "" : " off"), "aria-hidden": "true" }, ap.kFlame()),
          h("div", { class: "nw-okno-h" }, h("span", { class: "eyebrow", text: PL.oknoTytul }), h("h2", { class: "nw-okno-n" }, h("span", { class: "num", text: String(sk) }), " ", h("span", { class: "nw-okno-w", text: ap.plural(sk, "dzień z rzędu", "dni z rzędu", "dni z rzędu") })))),
        h("p", { class: "nw-okno-opis" + (stan === "risk" ? " risk" : ""), text: opis }),
        h("div", { class: "nw-goal" }, ring(g.xp / g.cel, 28), h("span", { text: fmt(PL.celDnia, g.xp, g.cel) })),
        h("p", { class: "nw-zasady" }, svg(IKONY["ux2-klepsydra"], 18), h("span", { text: PL.zasady })),
        h("h3", { class: "nw-sub", text: PL.ostatnie4 }), kalendarzEl(t, 4),
        h("div", { class: "nw-zam" },
          svg(IKONY.snow, 22, "nw-zam-ico"),
          h("div", { class: "nw-zam-t" }, h("b", { text: PL.zamTytul }), h("span", { class: "num", text: fmt(PL.zamMasz, ma) }), h("small", { class: "muted", text: PL.zamOpis })),
          ma >= 2 ? h("span", { class: "chip plain nw-zam-full", text: PL.zamKomplet })
            : h("button", { type: "button", class: "btn small", onclick: () => { close(); ap.kShopGo ? ap.kShopGo("nauka", "zamrozenie") : ap.go?.({ view: "shop" }); } }, PL.zamSklep)),
        h("p", { class: "nw-best" }, svg(IKONY["ux2-medal"], 18), h("span", { text: fmt(PL.najlepsza, dni(best)) })),
        h("h3", { class: "nw-sub", text: PL.kamienie }), kamienieEl(sk),
        h("div", { class: "row nw-okno-btns" },
          stan !== "done" && ap.ldOpen ? h("button", { type: "button", class: "btn primary", onclick: () => { close(); if (ap.S?.route?.view !== "home") ap.go?.({ view: "home" }); setTimeout(() => ap.ldOpen("karta"), 60); } }, PL.uczSie) : null,
          h("button", { type: "button", class: "btn ghost", onclick: close }, PL.zamknij))),
    ], "nw-okno-modal");
  }

  // ---------------------------------------------------------------- ekran „Seria +1” (dla ekranu końca, pętla 3)
  let ekranSesja = null; // dzień, w którym ekran pokazano w tej karcie przeglądarki (kolejne render() rysują go bez konfetti)
  function konfetti(box) {
    if (reduced()) return;
    const c = document.createElement("div"); c.className = "nw-conf"; c.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 28; i++) { const e = document.createElement("i"); e.style.cssText = `left:${(i * 37) % 100}%;--d:${(i % 7) * 0.07}s;--x:${((i * 53) % 120) - 60}px;--r:${(i * 97) % 540}deg`; e.className = "c" + (i % 4); c.append(e); }
    box.append(c); setTimeout(() => c.remove(), 2600);
  }
  function ekranSerii() {
    const ap = A(), { h } = ap; if (!h) return null;
    const t = today(), p = progress(), key = ap.todayKey ? ap.todayKey() : String(t);
    const shown = ap.ls?.get("skrot-streak-shown");
    const again = ekranSesja === t;
    if (!again && !L.pokazacEkran(p, t, shown, key)) return null;
    const n = p.streak.n, first = !again;
    ekranSesja = t; ap.ls?.set("skrot-streak-shown", key);
    const zam = zamDni(), nauka = L.dniNauki(p, zam, przerwa), week = L.tydzien(t, nauka, zam, przerwa), lt = dowLetters();
    const lab = { nauka: PL.dzienNauka, zamroz: PL.dzienZamroz, przerwa: PL.dzienPrzerwa, brak: PL.dzienBrak, przyszly: PL.dzienPrzyszly };
    const km = L.kamien(n);
    const box = h("section", { class: "nw-seria" + (first && !reduced() ? " anim" : "") + (km ? " km" : ""), role: "status", "aria-label": PL.seriaPlus },
      h("span", { class: "nw-seria-flame", "aria-hidden": "true" }, ap.kFlame()),
      h("b", { class: "nw-seria-n num", text: String(n) }),
      h("p", { class: "nw-seria-t", text: ap.plural(n, "dzień z rzędu!", "dni z rzędu!", "dni z rzędu!") }),
      h("div", { class: "nw-week", role: "group", "aria-label": PL.tydzienTen }, week.map((c, i) => h("span", { class: "nw-wd" },
        h("i", { class: `nw-dot s-${c.s}${c.dzis ? " dzis" : ""}`, role: "img", "aria-label": fmt(lab[c.s], dzienLabel(c.d)), style: `--i:${i}` }),
        h("small", { "aria-hidden": "true", text: lt[i] })))),
      km ? h("p", { class: "nw-km" }, svg(IKONY["ux2-medal"], 18), h("span", { text: fmt(PL.kamienMilowy, n) })) : null,
      h("p", { class: "nw-jutro", text: fmt(PL.jutroSeria, dni(n + 1)) }),
      kamienieEl(n));
    if (first && km) setTimeout(() => konfetti(box), 250);
    return box;
  }

  // ---------------------------------------------------------------- CSS (paleta H2 przez zmienne; ruch wyłączany przez calm i reduced-motion)
  const CSS = `
.xp-chip.nw-streak { min-height: 44px; min-width: 44px; gap: 6px; }
.xp-chip.nw-streak .nw-word, .xp-chip.nw-streak .nw-risk { white-space: nowrap; }
.xp-chip.nw-streak.streak-todo, .xp-chip.nw-streak.streak-risk { outline: 2px dashed var(--h-edge, var(--line)); outline-offset: -2px; }
.xp-chip.nw-streak:is(.streak-todo, .streak-risk) :is(.h2-flame, .kflame) { filter: grayscale(1); opacity: .55; }
.xp-chip.nw-streak:is(.streak-todo, .streak-risk) .h2-flame svg { animation: none !important; }
html #main .xp-chip.nw-streak.streak-risk, .xp-chip.nw-streak.streak-risk { background: var(--warn-soft) !important; color: var(--warn) !important; outline-color: var(--warn); }
.xp-chip.nw-streak.streak-risk b { color: inherit; }
.xp-chip.nw-streak .nw-risk { font-weight: 700; }
.nw-ring { display: inline-grid; place-items: center; line-height: 0; flex: none; margin-left: 2px; }
.nw-ring-t { fill: none; stroke: var(--h-line, var(--line)); stroke-width: 3.2; }
.nw-ring-f { fill: none; stroke: var(--h-acc, var(--accent)); stroke-width: 3.2; stroke-linecap: round; }
.streak-risk .nw-ring-t { stroke: color-mix(in srgb, var(--warn) 25%, transparent); }
.streak-risk .nw-ring-f { stroke: var(--warn); }
.nw-ico { display: inline-grid; place-items: center; line-height: 0; flex: none; }
@media (max-width: 420px) {
  #main .greet .rk-compact .rk-lv { display: none; }
  #main .greet .rk-compact .rk-name { display: inline-block; max-width: 9ch; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; vertical-align: bottom; }
}
/* < 400 px: ranga jako sama odznaka z poziomem (nazwa zostaje dla czytników i w oknie rang), seria i monety w tym samym wierszu */
@media (max-width: 399px) {
  #main .greet .rk-compact .rk-main { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  #main .greet .rk-compact .rk { padding: 0 !important; min-width: 44px; justify-content: center; }
  #main .greet .rk-compact .rk-badge .n { display: grid !important; font-size: 12px; min-width: 20px; height: 20px; right: -7px; bottom: -6px; }
  #main .greet .xp-chip.nw-streak { gap: 4px; padding-left: 8px !important; padding-right: 8px !important; }
  main[data-view="home"] .greet .rk-line, main[data-view="home"] .greet .rk-chips { gap: 5px; }
}
.xp-chip.nw-streak .nw-klep { color: inherit; opacity: .85; }
.nw-zasady { display: flex; gap: 8px; align-items: flex-start; margin: 0; font-size: .85rem; color: var(--muted); }
.nw-zasady .nw-ico { margin-top: 1px; }
.nw-day.s-brak:not(.s-przyszly) { background: var(--sunk, var(--h-line)); }
.nw-day.dzis.todo { outline: 2.5px dashed var(--warn); outline-offset: 2px; background: var(--warn-soft); }
.nw-day.mini.dzis.todo { outline-width: 1.5px; outline-offset: 1px; }
.nw-jutro { margin: 2px 0 0; font-weight: 700; color: var(--h-acc, var(--accent-text)); }
main[data-view="home"] .greet .rk-line.rk-compact { flex-wrap: wrap; row-gap: 8px; }
#main .greet .rk-compact .rk-lv { font-size: 12px; }
main[data-view="home"] .greet .rk-compact .rk-chips { flex-wrap: nowrap; }
/* okno „Twoja seria” */
.nw-okno { display: grid; gap: 14px; }
.nw-okno-top { display: flex; align-items: center; gap: 14px; }
.nw-big-flame { display: grid; place-items: center; width: 64px; height: 64px; border-radius: 50%; background: var(--h-orange-soft, var(--warn-soft)); flex: none; }
.nw-big-flame svg, .nw-big-flame .kflame svg { width: 40px; height: 40px; }
.nw-big-flame.off :is(.h2-flame, .kflame) { filter: grayscale(1); opacity: .55; }
.nw-okno-h { display: grid; gap: 2px; }
.nw-okno-n { margin: 0; font-family: var(--dz-head, inherit); font-size: 2rem; line-height: 1.05; }
.nw-okno-opis { margin: 0; color: var(--muted); }
.nw-okno-opis.risk { color: var(--warn); background: var(--warn-soft); padding: 10px 12px; border-radius: 14px; font-weight: 600; }
.nw-goal { display: flex; align-items: center; gap: 10px; font-weight: 700; }
.nw-sub { margin: 4px 0 -4px; font-size: .95rem; }
.nw-cal { display: grid; gap: 6px; }
.nw-cal-row { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; justify-items: center; }
.nw-cal-head span { font-size: .75rem; font-weight: 700; color: var(--muted); }
.nw-day { display: grid; place-items: center; width: 100%; max-width: 40px; aspect-ratio: 1; border-radius: 12px; background: var(--sunk, var(--h-line)); color: var(--muted); box-sizing: border-box; }
.nw-day.s-nauka { background: var(--h-acc, var(--accent)); color: var(--h-acc-ink, var(--accent-ink)); }
.nw-day.s-zamroz { background: var(--h-blue-soft, var(--accent-soft)); color: var(--h-blue, var(--accent-text)); box-shadow: inset 0 0 0 2px var(--h-blue, var(--accent-text)); }
.nw-day.s-przerwa { background: repeating-linear-gradient(135deg, var(--sunk, var(--h-line)) 0 4px, var(--h-line, var(--line)) 4px 8px); }
.nw-day.s-przyszly { background: transparent; box-shadow: inset 0 0 0 1.5px var(--h-line, var(--line)); }
.nw-day.dzis { outline: 2.5px solid var(--h-ink, var(--ink)); outline-offset: 2px; }
.nw-day.mini { width: 14px; height: 14px; border-radius: 4px; display: inline-block; }
.nw-legend { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: .8rem; color: var(--muted); }
.nw-legend > span { display: inline-flex; align-items: center; gap: 6px; }
.nw-zam { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 12px 14px; border-radius: 18px; background: var(--h-blue-soft, var(--accent-soft)); }
.nw-zam-ico { color: var(--h-blue, var(--accent-text)); }
.nw-zam-t { display: grid; gap: 2px; }
.nw-zam-t small { font-size: .8rem; }
.nw-zam .btn { min-height: 44px; }
.nw-zam-full { min-height: 32px; display: inline-flex; align-items: center; }
@media (max-width: 420px) { .nw-zam { grid-template-columns: auto minmax(0, 1fr); } .nw-zam > .btn, .nw-zam > .nw-zam-full { grid-column: 1 / -1; justify-self: start; } }
.nw-best { display: flex; align-items: center; gap: 8px; margin: 0; font-weight: 700; }
.nw-steps { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 6px; }
.nw-step { display: inline-flex; align-items: center; justify-content: center; gap: 3px; min-height: 36px; border-radius: 999px; background: var(--sunk, var(--h-line)); color: var(--muted); font-size: .85rem; }
.nw-step.on { background: var(--h-lime, var(--accent-soft)); color: var(--h-lime-ink, var(--accent-text)); }
.nw-step.nx { box-shadow: inset 0 0 0 2px var(--h-acc, var(--accent)); color: var(--ink); }
.nw-next { margin: 6px 0 0; font-size: .85rem; }
.nw-okno-btns { gap: 8px; }
.nw-okno-btns .btn { min-height: 48px; }
/* ekran „Seria +1” */
.nw-seria { position: relative; overflow: hidden; display: grid; justify-items: center; gap: 6px; padding: 18px 16px 16px; border-radius: 28px; background: var(--h-card, var(--surface)); color: var(--ink); text-align: center; }
.nw-seria-flame { display: grid; place-items: center; width: 64px; height: 64px; line-height: 0; }
.nw-seria-flame svg { width: 64px; height: 64px; }
.nw-seria-n { font-family: var(--dz-head, inherit); font-size: 48px; line-height: 1; }
.nw-seria-t { margin: 0; font-weight: 700; font-size: 1.05rem; }
.nw-week { display: flex; gap: 8px; margin-top: 4px; }
.nw-wd { display: grid; justify-items: center; gap: 3px; }
.nw-wd small { font-size: .75rem; font-weight: 700; color: var(--muted); }
.nw-dot { display: block; width: 22px; height: 22px; border-radius: 50%; background: var(--sunk, var(--h-line)); box-sizing: border-box; }
.nw-dot.s-nauka { background: var(--h-acc, var(--accent)); }
.nw-dot.s-zamroz { background: var(--h-blue-soft, var(--accent-soft)); box-shadow: inset 0 0 0 2px var(--h-blue, var(--accent-text)); }
.nw-dot.s-przerwa { background: repeating-linear-gradient(135deg, var(--sunk, var(--h-line)) 0 3px, var(--h-line, var(--line)) 3px 6px); }
.nw-dot.s-przyszly { background: transparent; box-shadow: inset 0 0 0 1.5px var(--h-line, var(--line)); }
.nw-dot.dzis { outline: 2px solid var(--h-ink, var(--ink)); outline-offset: 2px; }
.nw-km { display: inline-flex; align-items: center; gap: 6px; margin: 4px 0 0; padding: 6px 12px; border-radius: 999px; background: var(--h-lime, var(--accent-soft)); color: var(--h-lime-ink, var(--accent-text)); font-weight: 700; }
.nw-seria .nw-steps-box { width: 100%; max-width: 360px; margin-top: 6px; }
.nw-seria.anim .nw-seria-flame { animation: nw-pop .6s var(--h-spring, ease-out) both; }
.nw-seria.anim .nw-seria-n { animation: nw-up .5s .15s var(--h-out, ease-out) both; }
.nw-seria.anim .nw-dot.s-nauka.dzis { animation: nw-dot .5s calc(.35s + var(--i) * .05s) var(--h-spring, ease-out) both; }
.nw-conf { position: absolute; inset: 0; pointer-events: none; }
.nw-conf i { position: absolute; top: -10px; width: 8px; height: 12px; border-radius: 2px; animation: nw-fall 2.2s var(--d) ease-in forwards; }
.nw-conf i.c0 { background: var(--h-acc, var(--accent)); } .nw-conf i.c1 { background: var(--h-lime, var(--accent-soft)); } .nw-conf i.c2 { background: var(--h-orange, var(--warn)); } .nw-conf i.c3 { background: var(--h-blue, var(--accent-text)); }
@keyframes nw-dot { from { transform: scale(.4); } to { transform: none; } }
@keyframes nw-pop { from { transform: scale(.4); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes nw-up { from { transform: translateY(10px); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes nw-fall { to { transform: translate(var(--x), 320px) rotate(var(--r)); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .nw-seria *, .nw-conf, .nw-conf i { animation: none !important; } .nw-conf { display: none; } }
html.calm .nw-seria *, html.calm .nw-conf i { animation: none !important; }
html.calm .nw-conf { display: none; }
`;
  function css() {
    if (document.getElementById("nw-css")) return;
    const s = document.createElement("style"); s.id = "nw-css"; s.textContent = CSS; document.head.append(s);
  }
  if (typeof module === "object" && module.exports) module.exports = { L, PL, fmt };
  if (!W) return;
  if (document.head) css(); else document.addEventListener("DOMContentLoaded", css);

  W.ZD_NAWYK = Object.assign(W.ZD_NAWYK || {}, { L, PL, fmt, pigulka, oknoSerii, ekranSerii, celDnia, ring, stanTeraz, przerwa, kalendarzEl, poXp, odswiezPigulki });
  // Stan dnia zmienia się z czasem (18:00 → „do północy”, północ → nowy dzień): co minutę i po powrocie do karty.
  let stanKey = null;
  function tik() {
    const ap = A(); if (!ap.S || !document.querySelector(".nw-streak")) return;
    const s = stanTeraz(), k = s.t + ":" + s.stan;
    if (stanKey && stanKey.split(":")[0] !== String(s.t)) { stanKey = k; try { ap.render?.(); } catch (e) {} return; }
    if (k !== stanKey) { stanKey = k; odswiezPigulki(); }
  }
  setInterval(tik, 60000);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") tik(); });
  W.ZD_NAWYK.tik = tik;
  // Aplikacja mogła już narysować ekran ze starą pigułką (plik wczytuje się po niej).
  try { A().render?.(); } catch (e) {}
})();
