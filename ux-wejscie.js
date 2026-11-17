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
    // Próba minęła (koniec zapisany w tej przeglądarce, skrot-supabase.js → refreshMe → trialEnded).
    if (sk.trialEnded) return "po-probie";
    return "darmowe";
  };

  const EN = () => window.SKROT_LANG === "en";
  const naDzis = () => (A().S?.route?.view || "home") === "home";
  // „Kup dostęp” najwyżej raz na ekranie Dziś: pierwszy, kto go narysuje, zajmuje miejsce; reszta dostaje link „Zobacz plany”.
  // Licznik zeruje pasekProby() – pierwsza rzecz w viewHome (umowa z pętlą 2).
  let kupZajety = false;
  const kupWolny = () => !naDzis() || !kupZajety;
  const kupZajmij = () => { if (naDzis()) kupZajety = true; };
  const dzienKlucz = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const DNI_PL = ["nd", "pn", "wt", "śr", "czw", "pt", "sob"], DNI_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const hhmm = (d) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  // Okres próbny: dzień X z N (liczony od trialUntil − N dni), koniec „czw 17:00”, ile godzin zostało.
  function proba() {
    const sk = SK(), n = sk.trialDays || 3, koniec = new Date(sk.trialUntil);
    if (isNaN(koniec)) return null;
    const teraz = Date.now(), ms = koniec.getTime() - teraz, start = koniec.getTime() - n * 864e5;
    const dzien = Math.min(n, Math.max(1, Math.floor((teraz - start) / 864e5) + 1));
    return { n, dzien, koniec, ms, godz: Math.max(1, Math.ceil(ms / 36e5)), ost: ms > 0 && ms < 864e5, wd: (EN() ? DNI_EN : DNI_PL)[koniec.getDay()], czas: hhmm(koniec) };
  }
  // Postęp z okresu próbnego (te same dane co profil): lekcje zrobione od startu próby, fiszki, XP, seria.
  function postep(odMs = 0, doMs = Infinity) {
    const P = A().S?.progress || {};
    const lekcje = Object.values(P.done || {}).filter((t) => +t >= odMs && +t <= doMs).length;
    const fiszki = Object.keys(P.srs || {}).length, xp = P.xp?.t || 0, seria = P.streak?.n || 0;
    return { lekcje, fiszki, xp, seria, zero: !lekcje && !fiszki && !xp };
  }
  const zl = (x) => `${x} zł`;
  const miesiecznie = () => { const c = SK().planCompare?.() || { months: 8 }; return Math.round(199 / Math.max(1, c.months)); };
  // Dwie karty planu jako wybór (radio): 199 zł na górze i zaznaczony; pod nimi jeden przycisk „Wybierz …” kupuje zaznaczony plan.
  // Zwraca [karty, przycisk] – przycisk trafia na dół arkusza (przyklejony, w zasięgu kciuka).
  function planKarty(zamknij) {
    const sk = SK(), m = miesiecznie();
    let wybor = "rok";
    const kup = el("button", { type: "button", class: "btn primary uxw-big uxw-kup", onclick: () => { zamknij?.(); sk.buy?.(wybor); } }, "Wybierz 199 zł");
    const karty = [];
    const karta = (plan, tytul, cena, pod, tag) => {
      const b = el("button", { type: "button", role: "radio", "aria-checked": String(plan === wybor), class: "uxw-plan" + (plan === wybor ? " on" : ""), "data-plan": plan, onclick: () => {
        wybor = plan; karty.forEach((x) => { const on = x.dataset.plan === plan; x.classList.toggle("on", on); x.setAttribute("aria-checked", String(on)); });
        kup.textContent = plan === "rok" ? "Wybierz 199 zł" : "Wybierz 35 zł / mies."; } },
        el("span", { class: "uxw-plan-t" }, el("b", { text: tytul }), tag ? el("span", { class: "uxw-plan-tag", text: tag }) : null),
        el("span", { class: "uxw-plan-c", text: cena }), el("span", { class: "uxw-plan-p", text: pod }));
      karty.push(b); return b;
    };
    return [el("div", { class: "uxw-plany", role: "radiogroup", "aria-label": "Plan" },
      karta("rok", "Do końca 2. semestru", "199 zł", `to ok. ${m} zł miesięcznie · jednorazowo, BLIK, bez odnawiania`, "Najtaniej"),
      karta("miesiac", "Co miesiąc", "35 zł / mies.", "kartą, odnawia się co miesiąc, anulujesz w każdej chwili", null)), kup];
  }
  // Okno w stylu aplikacji (jak info w skrot-supabase.js): scrim + modal, Esc i klik obok zamykają.
  function okno(cls, label, build) {
    const layer = document.getElementById("layer") || document.body;
    const zamknij = () => { scrim.remove(); document.removeEventListener("keydown", onKey); };
    const onKey = (e) => { if (e.key === "Escape") zamknij(); };
    const box = el("div", { class: "modal " + cls, role: "dialog", "aria-modal": "true", "aria-label": label });
    const scrim = el("div", { class: "scrim", onclick: (e) => { if (e.target === scrim) zamknij(); } }, box);
    box.append(...build(zamknij).filter(Boolean));
    layer.append(scrim); document.addEventListener("keydown", onKey);
    setTimeout(() => { const h = box.querySelector("h2"); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); } }, 30);
    return box;
  }

  // ---------- ostatnie 24 h próby: raz dziennie arkusz z podsumowaniem i planami ----------
  function ostatnieGodziny(force) {
    const p = proba(); if (!p || !p.ost) return null;
    const klucz = `bm-proba-ost-${dzienKlucz()}`;
    if (!force && ls.get(klucz)) return null;
    ls.set(klucz, "1");
    const pp = postep(p.koniec.getTime() - p.n * 864e5, p.koniec.getTime());
    return okno("uxw-ost", "Okres próbny", (zamknij) => [
      el("span", { class: "eyebrow", text: "Okres próbny" }),
      el("h2", { style: "margin:0", text: `Zostało ${p.godz} godz. próby` }),
      el("p", { class: "uxw-ost-p", text: `Próba kończy się ${p.wd} o ${p.czas}. Po zakupie wszystko, co zrobisz, zostaje na koncie.` }),
      statyProby(pp),
      ...(([karty, kup]) => [karty, el("div", { class: "uxw-dol" }, kup, el("button", { type: "button", class: "btn ghost uxw-big", onclick: zamknij }, "Później"))])(planKarty(zamknij))]);
  }
  let ostZaplanowane = false;
  // Odmiana: 1 lekcja, 2–4 lekcje, 5+ lekcji (12–14 też „lekcji”).
  const odm = (n, a, b, c) => (n === 1 ? a : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? b : c);
  // Kafelki postępu tylko dla tego, co student naprawdę zrobił (zera nie pokazujemy).
  const statyProby = (pp) => {
    const k = [[pp.lekcje, odm(pp.lekcje, "lekcja", "lekcje", "lekcji")], [pp.fiszki, odm(pp.fiszki, "fiszka", "fiszki", "fiszek")], [pp.xp, "XP"], [pp.seria, odm(pp.seria, "dzień serii", "dni serii", "dni serii")]].filter(([n]) => n > 0);
    return k.length ? el("div", { class: "uxw-staty", style: `grid-template-columns:repeat(${k.length},1fr)` }, k.map(([n, t]) => el("span", { class: "uxw-stat" }, el("b", { text: String(n) }), el("small", { text: t })))) : null;
  };

  // ---------- pigułka okresu próbnego nad panelem Stasia (Dziś) ----------
  function pasekProby() {
    icoReg();
    kupZajety = false;
    const sk = SK(), st = stan();
    if (st === "darmowe-proba") {
      const d = sk.trialDays || 3;
      return el("section", { class: "uxw-pasek uxw-mozna", "aria-label": "Okres próbny" },
        ico("ticket", 20),
        el("span", { class: "uxw-pasek-t", text: `Masz jeszcze ${d} dni za darmo` }),
        // EN jak w C1 („Start”); „Włącz” ma w słowniku ogólne „Turn on”, więc tłumaczymy tu (data-noi18n).
        el("button", { type: "button", class: "uxw-pasek-b uxw-lime", "data-noi18n": "", onclick: () => sk.startTrial?.() }, EN() ? "Start" : "Włącz"));
    }
    if (st === "proba") {
      const p = proba(); if (!p) return null;
      if (p.ost && !ostZaplanowane) { ostZaplanowane = true; setTimeout(() => { if (!document.querySelector("#layer .scrim, .tour")) ostatnieGodziny(); else ostZaplanowane = false; }, 1200); }
      return el("section", { class: "uxw-pasek uxw-proba" + (p.ost ? " warn" : ""), "aria-label": "Okres próbny" },
        ico("ux1-clock", 20),
        // Tekst w częściach (data i godzina razem), więc EN składamy tu, a nie słownikiem (pary PL→EN i tak są w i18n-en.js).
        el("span", { class: "uxw-pasek-t", "data-noi18n": "" }, el("span", { text: EN() ? `Trial · day ${p.dzien} of ${p.n} · ` : `Próba · dzień ${p.dzien} z ${p.n} · ` }),
          el("span", { class: "uxw-nowrap", text: EN() ? `until ${p.wd} ${p.czas}` : `do ${p.wd} ${p.czas}` }),
          p.ost ? el("span", { class: "uxw-nowrap" }, el("span", { text: " · " }), el("b", { text: EN() ? `${p.godz} h left` : `zostało ${p.godz} godz.` })) : null),
        el("button", { type: "button", class: "uxw-pasek-link", onclick: () => (p.ost ? ostatnieGodziny(true) : sk.buy?.()) }, "Plany"));
    }
    if (st === "darmowe" && SK().rocznikStatus && SK().rocznikStatus(window.SKROT_ROCZNIK?.id) !== "platny") return null;
    if (st === "po-probie") { const k = bonusKarta(); if (k) return k; }
    if (st === "po-probie" || st === "darmowe") {
      kupZajmij();
      return el("section", { class: "uxw-pasek " + (st === "po-probie" ? "uxw-po" : "uxw-pelny"), "aria-label": st === "po-probie" ? "Okres próbny minął" : "Pełny dostęp" },
        ico("lock", 20),
        el("span", { class: "uxw-pasek-t", text: st === "po-probie" ? "Próba minęła · 199 zł do 11 lipca 2027 albo 35 zł / mies." : "Pełny dostęp · 199 zł do 11 lipca 2027 albo 35 zł / mies." }),
        el("button", { type: "button", class: "btn primary uxw-kup uxw-pasek-kup", onclick: () => sk.buy?.() }, "Kup dostęp"));
    }
    return null;
  }

  // ---------- powitanie próby: zgoda na jeden mail dzień przed końcem (SQL v53, domyślnie wyłączona) ----------
  function przelacznikPrzypomnienia() {
    const sk = SK();
    const inp = el("input", { type: "checkbox", role: "switch", class: "uxw-sw-in" });
    const msg = el("p", { class: "uxw-przyp-msg", role: "status", hidden: true });
    inp.addEventListener("change", async () => {
      const chce = inp.checked; inp.disabled = true;
      let ok = false;
      try { const { data, error } = await (sk.rpcProba?.("nauka_proba_przypomnij", { p: chce, p_jezyk: EN() ? "en" : "pl" }) || Promise.resolve({ error: 1 })); ok = !error && data?.ok !== false; } catch { ok = false; }
      inp.disabled = false;
      if (!ok) { inp.checked = !chce; msg.textContent = "Nie udało się zapisać. Spróbuj za chwilę."; }
      else msg.textContent = chce ? "Przypomnimy jednym mailem dzień przed końcem." : "Bez przypomnienia. Koniec próby zobaczysz na ekranie Dziś.";
      msg.hidden = false;
    });
    return el("div", { class: "uxw-przyp-box" },
      el("label", { class: "uxw-przyp" }, el("span", { class: "uxw-przyp-t", text: "Przypomnij mi mailem dzień przed końcem próby" }), inp, el("span", { class: "uxw-sw", "aria-hidden": "true" })),
      el("p", { class: "uxw-przyp-note", text: "Jeden mail. Nic nie pobieramy samo." }), msg);
  }

  // ---------- jednorazowy ekran „Twoje 3 dni minęły” (tryStart w index.html, raz: bm-proba-koniec-pokazane) ----------
  function najblizszyTermin() {
    const app = A();
    let t = null; try { t = (app.termItems?.() || []).filter((x) => !x.done && x.n != null && x.n >= 0 && ["kolokwium", "egzamin"].includes(x.kind)).sort((a, b) => a.n - b.n)[0] || null; } catch { t = null; }
    if (!t) return null;
    const subj = (app.subjects?.() || []).find((x) => x.id === t.sid);
    return { n: t.n, kind: t.kind, nazwa: subj ? (EN() ? subj.en || subj.pl : subj.pl) : (t.title || "") };
  }
  function koniecProby() {
    const sk = SK(), n = sk.trialDays || 3;
    const koniec = Date.parse(ls.get("skrot-proba-do") || ""), od = koniec - n * 864e5;
    const pp = postep(od > 0 ? od : 0, koniec > 0 ? koniec : Infinity), t = najblizszyTermin();
    const kiedy = t ? (t.n === 0 ? "dziś" : t.n === 1 ? "jutro" : `za ${t.n} dni`) : "";
    const termin = t ? `${t.kind === "egzamin" ? "Egzamin" : "Kolokwium"} · ${t.nazwa} · ${kiedy}` : null;
    const [karty, kup] = planKarty(null);
    const box = okno("uxw-koniec", `Twoje ${n} dni minęły`, (zamknij) => {
      kup.addEventListener("click", zamknij, { once: true });
      return [
        el("h2", { id: "uxw-koniec-h", style: "margin:0", text: `Twoje ${n} dni minęły` }),
        el("p", { class: "uxw-koniec-sub", text: pp.zero ? (t ? "Nie było kiedy? Najbliższe zaliczenie jeszcze przed Tobą:" : "Nie było kiedy? Materiały czekają, a postępy liczą się od pierwszej lekcji.") : `Przez ${n} dni:` }),
        pp.zero ? null : statyProby(pp),
        termin ? el("p", { class: "uxw-termin" }, ico("ux1-clock", 18), el("span", { text: termin })) : null,
        karty,
        el("p", { class: "uxw-koniec-note", text: "Twoje postępy zostały na koncie: fiszki, wpisy i XP. Po zakupie wszystko zostaje." }),
        el("div", { class: "uxw-dol" }, kup, el("button", { type: "button", class: "btn ghost uxw-big", onclick: zamknij }, "Zostaję przy darmowych próbkach"))];
    });
    box.setAttribute("aria-labelledby", "uxw-koniec-h"); box.removeAttribute("aria-label");
    return box;
  }

  // ---------- etap 4: „+2 dni przed kolokwium” (raz na konto, po próbie, kolokwium ≤ 7 dni; SQL v54) ----------
  let bonus = null, bonusPyt = false;
  function bonusKarta() {
    const sk = SK();
    if (!bonusPyt) { bonusPyt = true; sk.rpcUx?.("nauka_proba_bonus_stan", {}).then(({ data }) => { if (data?.mozna && data.termin) { bonus = data.termin; A().render?.(); } }, () => {}); }
    if (!bonus) return null;
    const subj = (A().subjects?.() || []).find((x) => x.id === bonus.subjectId);
    const nazwa = subj ? (EN() ? subj.en || subj.pl : subj.pl) : String(bonus.title || "").replace(/^[^:]*:\s*/, "");
    const kiedy = bonus.n === 0 ? "dziś" : bonus.n === 1 ? "jutro" : `za ${bonus.n} dni`;
    const btn = el("button", { type: "button", class: "btn primary uxw-kup", onclick: async () => {
      btn.disabled = true;
      const { data, error } = await sk.rpcUx("nauka_proba_bonus", {});
      if (error || !data?.ok) { btn.disabled = false; A().toast?.("Nie udało się włączyć 2 dni. Spróbuj za chwilę."); return; }
      ls.set("skrot-welcome", "proba"); location.reload(); } }, "Włącz 2 dni za darmo");
    return el("section", { class: "uxw-bonus", "aria-label": "Dodatkowe 2 dni" },
      el("p", { class: "uxw-bonus-t" }, ico("ux1-clock", 20), el("b", { text: `${bonus.type === "egzamin" ? "Egzamin" : "Kolokwium"} · ${nazwa} · ${kiedy}` })),
      el("p", { class: "uxw-bonus-p", text: "Masz jeszcze jedne 2 dni pełnego dostępu, żeby się przygotować." }), btn);
  }

  // ---------- etap 4: przed portalem Stripe (plan miesięczny) – porównanie z planem 199 zł ----------
  function porownaniePlanow({ portal, rok, cmp }) {
    const m = cmp.months, suma = m * 35;
    return okno("uxw-porownanie", "Subskrypcja", (zamknij) => [
      el("span", { class: "eyebrow", text: "Plan miesięczny" }),
      el("h2", { style: "margin:0", text: "Twoja subskrypcja" }),
      el("p", { style: "margin:0", text: `Płacąc co miesiąc, do lipca zapłacisz razem ok. ${suma} zł. Plan do lipca kosztuje 199 zł.` }),
      suma > 199 ? el("p", { class: "uxw-porownanie-p", text: "Po zakupie 199 zł anuluj subskrypcję w portalu, żeby nie płacić co miesiąc. Opłacony miesiąc i tak działa do końca." }) : null,
      el("div", { class: "uxw-actions" },
        el("button", { type: "button", class: "btn primary uxw-big", onclick: () => { zamknij(); rok(); } }, "Przejdź na 199 zł"),
        el("button", { type: "button", class: "btn uxw-big", onclick: () => { zamknij(); portal(); } }, "Otwórz portal płatności (karta, faktury, anulowanie)"),
        el("button", { type: "button", class: "btn ghost uxw-big", onclick: zamknij }, "Zamknij"))]);
  }

  // ---------- etap 4: ekran logowania – „N osób z {kierunek} uczyło się tu w tym tygodniu” (tylko od 15; SQL v54) ----------
  function licznik() {
    const p = document.querySelector("#login .lg-licznik"), R = window.SKROT_ROCZNIK, sk = SK();
    if (!p || !R || !sk.rpcUx || !document.documentElement.classList.contains("needlogin")) return;
    sk.rpcUx("nauka_rocznik_licznik", { p_rocznik: R.id }).then(({ data }) => {
      if (!(data >= 15)) return;
      const nazwa = EN() ? R.kierunek.en || R.kierunek.pl : R.kierunek.pl;
      p.textContent = `${data} osób z ${nazwa} uczyło się tu w tym tygodniu`; p.hidden = false;
    }, () => {});
  }

  // ---------- przycisk zakupu zależny od stanu konta (umowa z pętlą 2) ----------
  // Próba możliwa → „Wypróbuj 3 dni” (+ link „Kup dostęp” tylko przy pierwszym na ekranie); po próbie / bez próby → zielony
  // „Kup dostęp” (pierwszy na Dziś), kolejne jako link „Zobacz plany”. Konto z dostępem → null (miejsca wywołań tego nie rysują).
  function przyciskZakupu(kontekst) {
    const sk = SK(), app = A();
    if (app.PAID?.() || sk.paid) return null;
    const d = sk.trialDays || 3;
    if (app.canTrial ? app.canTrial() : sk.trialCan) {
      const lekki = naDzis() && stan() === "darmowe-proba"; // na Dziś główne wezwanie to pasek „Masz jeszcze 3 dni”
      if (lekki && !kupWolny()) return document.createTextNode(""); // kolejne miejsca: bez trzeciego wezwania
      const kup = kupWolny() ? (kupZajmij(), el("button", { type: "button", class: "link uxw-kup-link", onclick: () => sk.buy?.() }, "Kup dostęp")) : null;
      return el("span", { class: "uxw-zakup", "data-kontekst": kontekst || "" },
        el("button", { type: "button", class: (lekki ? "link" : "btn primary uxw-lime") + " uxw-wyprobuj", onclick: () => sk.startTrial?.() }, `Wypróbuj ${d} dni`), kup);
    }
    if (kupWolny()) { kupZajmij(); return el("span", { class: "uxw-zakup", "data-kontekst": kontekst || "" }, el("button", { type: "button", class: "btn primary uxw-kup", onclick: () => sk.buy?.() }, "Kup dostęp")); }
    return el("span", { class: "uxw-zakup", "data-kontekst": kontekst || "" }, el("button", { type: "button", class: "link uxw-plany-link", onclick: () => sk.buy?.() }, "Zobacz plany"));
  }
  // buyBanner (index.html) pyta, czy może narysować „Kup dostęp” na Dziś.
  const kupNaDzis = () => { if (!naDzis()) return true; if (kupZajety) return false; kupZajety = true; return true; };

  // ---------- błąd startu próby: okno z dalszą drogą zamiast ślepej uliczki ----------
  const BLAD = {
    wykorzystany: "Na tym koncie okres próbny już był. Twoje postępy z próby czekają. Dostęp: 199 zł do 11 lipca 2027 albo 35 zł / mies.",
    urzadzenie: "Z tego telefonu ktoś już korzystał z próby. Jeśli to Twój pierwszy raz, napisz do nas, włączymy ją ręcznie.",
    rocznik: "Ten kierunek jeszcze nie ruszył. Zapisz się na listę, a próba poczeka na Ciebie.",
  };
  function bladProby(kod) {
    const sk = SK(), txt = BLAD[kod]; if (!txt) return null;
    const temat = `${EN() ? "Free trial" : "Okres próbny"} – ${sk.email || ""}`.trim();
    // Próby nie da się włączyć → przestajemy ją obiecywać (pasek „Masz jeszcze 3 dni”, „Wypróbuj”), do następnego wejścia.
    if (kod !== "rocznik") { sk.trialCan = false; setTimeout(() => A().render?.(), 0); }
    return okno("uxw-blad", "Okres próbny", (zamknij) => [
      el("span", { class: "eyebrow", text: "Okres próbny" }),
      el("h2", { style: "margin:0", text: kod === "rocznik" ? "Kierunek jeszcze nie ruszył" : "Okresu próbnego nie da się włączyć" }),
      el("p", { style: "margin:0", text: txt }),
      el("div", { class: "uxw-actions" },
        kod === "rocznik"
          ? el("button", { type: "button", class: "btn primary uxw-big", onclick: () => { zamknij(); sk.listaOczekujacych?.(); } }, "Zapisz się na listę")
          : el("button", { type: "button", class: "btn primary uxw-big", onclick: () => { zamknij(); sk.buy?.(); } }, "Wybierz plan"),
        el("a", { class: "btn uxw-big uxw-mail", href: `mailto:zdawalni.support@gmail.com?subject=${encodeURIComponent(temat)}` }, "Napisz do nas"),
        el("button", { type: "button", class: "btn ghost uxw-big", onclick: zamknij }, "Zamknij"))]);
  }

  window.ZD_WEJSCIE = Object.assign(window.ZD_WEJSCIE || {}, { pasekProby, przyciskZakupu, stan, kupNaDzis, bladProby, ostatnieGodziny, planKarty, postep, proba, przelacznikPrzypomnienia, koniecProby, porownaniePlanow, licznik });
  // Aplikacja mogła narysować ekran, zanim ten plik się wczytał (ładuje się na końcu strony): wtedy rysujemy ją jeszcze raz,
  // żeby pigułka próby i przyciski zakupu z tej pętli zastąpiły zapasowe.
  try { if (window.ZD_APP?.render && window.ZD_APP.S?.ready) window.ZD_APP.render(); } catch {}
  setTimeout(licznik, 300);
})();
