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
    seriaChroni: "Dziś bez nauki? Zamrożenie ochroni serię. Ale 5 minut wystarczy, żeby zostało na później.",
    seriaPauza: "Przerwa w zajęciach: seria czeka i nie spada.",
    chroniZam: "· zamrożenie chroni (zostanie {0})",
    chroniOst: "· ostatnie zamrożenie chroni",
    czekaKoszt: "· weekend: zużyje {0} z {1}",
    czekaKoszt2: "· zamrożenia: zużyje {0} z {1}",
    weekendChroniony: "· dziś ✓, weekend chroniony",
    piatekUcz: "· ucz się dziś: weekend chroniony",
    zarobMonety: "Zamrożenie kosztuje {0} monet. Zbieraj je w zadaniach dnia.",
    koniecPill: "· koniec serii {0}",
    przerwaTydz: "Ten tydzień: przerwa",
    tydzienKz: "Ten tydzień: {0}/{1} dni",
    uzupelnij: "Uzupełnij w sklepie",
    tydzienAria: "Ten tydzień: {0}",
    dzisOk: "· dziś ✓",
    celOk: "cel ✓",
    lgDzisChroni: "dziś chroni zamrożenie",
    jutroTemat: "Jutro: {0}, 5 min",
    dzisJeszcze: "· dziś jeszcze nie",
    czekaZam: "· {0} pod zamrożeniem",
    zostalo: "zostało {0}/{1}",
    koniecSerii: "Seria {0} się skończyła: zabrakło zamrożeń. Dziś zaczynasz nową.",
    lgPrzyszly: "przed Tobą",
    przypTytul: "Przypomnieć Ci jutro o {0}?",
    przypOpis: "Jeden mail, tylko gdy jeszcze nie było nauki. Godzinę zmienisz w Ustawieniach.",
    przypTak: "Tak, przypominaj",
    przypWlaczone: "Przypomnienia włączone. Godzinę zmienisz w Ustawieniach.",
    przypDzisTytul: "Przypomnieć Ci mailem?",
    przypDzisOpis: "Najwyżej jeden mail dziennie o {0} i tylko wtedy, gdy jeszcze nie było nauki.",
    wlacz: "Włącz",
    przypPowod: "Żeby nie zgubić serii {0}.",
    przypOpisTermin: "Najwyżej jeden mail dziennie o {0} i tylko wtedy, gdy jest coś ważnego: zaliczenie za 7, 3 i 1 dzień, zaległe powtórki albo Zadanie dnia.",
    kalZapisanoOn: "Zapisano. Wpisy pojawią się przy najbliższym odświeżeniu kalendarza w telefonie.",
    kalZapisanoOff: "Zapisano. Wpisy znikną przy najbliższym odświeżeniu kalendarza w telefonie.",
    offline: "Bez sieci: pokazuję ostatni zapisany postęp.",
    // etap 5
    zadTytul: "Zadania dnia",
    blad: "Nie udało się. Spróbuj za chwilę.",
    wybierzPrzedmiot: "Wybierz przedmiot",
    zadLinia: "Zadania dnia: {0}/{1} · +{2}",
    zadLinia0: "Zadania dnia: 0/{0} · do zdobycia +{1}",
    zadZrobione: "zrobione",
    zadNowe: "· nowe za {0} h",
    zadWszystkie: "Wszystkie zadania dnia zrobione · +{0}",
    zadTydz: "Zadanie tygodnia",
    zadOdebrane: "Odebrane",
    zadAuto: "Nagrody za zrobione zadania trafiają do monet same.",
    zadPelna: "Zadania dnia z monetami są w pełnej wersji.",
    zadWczytuje: "Wczytuję zadania…",
    duetZ: "Duet: Ty i {0} · {1}/{2} w tym tygodniu",
    duetDzis: "{0} dziś ✓",
    duetNie: "{0}: dziś jeszcze nie",
    duetZapr: "Ucz się w duecie: razem {0} dni nauki w tym tygodniu (Ty + znajomy), +{1} dla obojga. Wyślij link znajomemu z roku.",
    duetWyslij: "Wyślij link",
    duetShare: "Uczmy się razem w Zdawalni: wspólny cel na ten tydzień.",
    linkSkop: "Link skopiowany.",
    tempo: "W tym tygodniu: {0} z {1} tematów",
    tempo1: "W tym tygodniu: {0} z 1 tematu",
    bezDaty: "Znasz datę kolokwium? Wpisz",
    bezDatyZ: "{0}: znasz datę kolokwium? Wpisz",
    bezDatyTytul: "Data zaliczenia: {0}",
    bezDatyOpis: "Plan nauki, Boss i przypomnienia ułożą się pod tę datę. Widzisz ją tylko Ty.",
    zapisz: "Zapisz",
    anuluj: "Anuluj",
    dataZapisana: "Plan i przypomnienia ułożą się do {0}.",
    starosta: "{0} zaliczeń bez daty. Uzupełnij, a rok dostanie plan i bossa.",
    terminy: "Terminy",
    planPelna: "Plan nauki do każdego terminu jest w pełnej wersji.",
    rvPusto: "Jeszcze nic do powtórki. Zrób dziś kartę 5 minut, a fiszki z niej wrócą tu jutro.",
    rvKarta: "Karta 5 minut",
    wiecej: "Więcej na dziś",
    wiecejBoss: "Boss trwa",
    kalNauka: "Dodawaj „5 minut nauki” po zajęciach", // ux-6: dawny podpis brzmiał jak „5 minut po zajęciach”
    kalNaukaOpis: "W kalendarzu pojawi się wpis „Zdawalni · 5 min po zajęciach” z przypomnieniem, pół godziny po Twoich ostatnich zajęciach.",
    instTytul: "Dodaj Zdawalni do ekranu głównego: jedno dotknięcie do 5 minut.",
    instDodaj: "Dodaj",
    instIos1: "Dotknij „Udostępnij” na dole Safari.",
    instIos2: "Wybierz „Do ekranu początkowego”.",
    powrotTytul: "Dobrze, że jesteś. Ostatnio {0} temu.",
    powrotTytulDzis: "Dobrze, że jesteś.",
    powrotZajecia: "Zajęcia od ostatniej nauki: {0}",
    powrotTerminy: "Nowe terminy: {0}",
    powrotFiszki: "Fiszki do odświeżenia: {0}",
    powrotWracam: "Wracam: 3 minuty",
    powrotLekko: "Powtórka z tego, co już znasz, i jedno pytanie. Bez nowego tematu.",
    naprawaKoniec: "Naprawa serii: 1/2. Jutro wróci seria {0}.",
    powrotWracam5: "Wracam: 5 minut",
    powrotSpokojnie: "Zaczniemy spokojnie od jednego krótkiego tematu.",
    naprawaPill: "· odzyskaj {0} (0/2)",
    naprawaPill1: "· odzyskaj {0} (1/2)",
    seriaOdzyskanaH: "Seria odzyskana!",
    super: "Super!",
    naprawaWiersz: "Seria {0} do odzyskania: ucz się dziś i jutro (wystarczy krótka karta), a wróci.",
    naprawaJutro: "· jutro seria wróci do {0}",
    naprawaOk: "Seria odzyskana: {0}",
    naprawaDzis: "· ucz się dziś: seria wróci do {0}",
    naprawaNieudana: "Naprawa serii {0} nie wyszła (zabrakło dnia nauki). Dziś zaczynasz nową.",
    seriaPrzepadla: "Seria {0} się skończyła. Dziś zaczynasz nową.",
    kupZa: "Kup za",
    ofertaTytul: "Chroń serię",
    ofertaTytulCena: "Chroń serię: zamrożenie za {0}",
    ofertaOpis: "Masz serię {0}. Zamrożenie ochroni ją, gdy opuścisz dzień (np. w weekend).",
    nieTeraz: "Nie teraz",
    tydzienK: "Ten tydzień: {0}/5 dni",
    tydzienTitle: "5 dni nauki w tygodniu wystarczy: pasuje do zajęć od poniedziałku do piątku.",
    reguleChroni: "Masz {0}: dziś możesz odpuścić, jutro już nie.",
    zamTeraz: "Zamrożenia: {0}/{1}",
    prezent: "Masz zamrożenie serii w prezencie. Jeden opuszczony dzień nie zerwie serii.",
    pauzaTxt: "· przerwa, seria czeka",
    oknoStanChroni: "Dziś bez nauki? Zamrożenie ochroni ten dzień. Jedna karta 5 minut i zamrożenie zostaje na później.",
    oknoStanPauza: "Przerwa w zajęciach: seria czeka. Możesz się uczyć, ale nie musisz.",
    seriaPrzedluzona: "Seria przedłużona!",
    uratowalo1: "Zamrożenie uratowało serię: {0}",
    uratowalo2: "Zamrożenia uratowały serię: {0}",
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
    zamMasz: "Masz {0}/{1}",
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
    // Stan pigułki: none (bez serii), done (dziś była nauka), pauza (dziś przerwa w zajęciach: seria czeka),
    // chroni (dziś bez nauki, ale zamrożenie ochroni ten dzień), todo (seria > 0, dziś bez nauki), risk (to samo od 18:00).
    stanDnia(sk, doneToday, godz, o = {}) {
      if (doneToday) return "done";
      if (!(sk > 0)) return "none";
      if (o.pauza) return "pauza";
      if (o.chroni) return "chroni";
      return godz >= 18 ? "risk" : "todo";
    },
    // ---- etap 2: zasady serii przyjazne studentom ----
    // c = { zamrozone: Set(dayN) dni już chronionych, ma: zamrożenia w zapasie, przerwa(d) → true w dni przerw z kalendarza uczelni }.
    // Wynik: null (dziś już liczone) albo { next: { d, n }, uzyj: [dni do zamrożenia], przerwana: n starej serii | 0 }.
    // Dni przerw i zamrożone nie zrywają serii i nie dodają dni; inne opuszczone dni chronią zamrożenia: najwyżej 2 (weekend),
    // tylko z ostatnich 3 dni (tyle przyjmuje baza, nauka_zamrozenie_uzyj_dni) i tylko gdy starczy zapasu.
    seriaDalej(sk, t, c = {}) {
      if (sk && sk.d === t) return null;
      if (!sk || !(sk.n > 0) || !Number.isFinite(sk.d) || sk.d > t) return { next: { d: t, n: 1 }, uzyj: [], przerwana: 0 };
      const zam = c.zamrozone || new Set(), prz = c.przerwa || (() => false), brak = [];
      for (let d = sk.d + 1; d < t; d++) if (!zam.has(d) && !prz(d)) brak.push(d);
      if (!brak.length) return { next: { d: t, n: sk.n + 1 }, uzyj: [], przerwana: 0 };
      if (brak.length <= 2 && brak.length <= (c.ma || 0) && brak.every((d) => d >= t - 3)) return { next: { d: t, n: sk.n + 1 }, uzyj: brak, przerwana: 0 };
      return { next: { d: t, n: 1 }, uzyj: [], przerwana: sk.n };
    },
    // Seria widoczna dziś: dziś już była nauka albo dzisiejsza nauka ją przedłuży (wczoraj, przerwa, zamrożenia).
    seriaZywa(sk, t, c = {}) {
      if (!sk || !(sk.n > 0)) return false;
      if (sk.d === t) return true;
      const r = L.seriaDalej(sk, t, c);
      return !!r && r.next.n > 1;
    },
    // Ten tydzień: dni nauki od poniedziałku (cel 5 z 7, jak zadanie tygodnia „Ucz się 5 dni”).
    tydzienNauki(t, nauka) { const p = L.poniedzialek(t); let k = 0; for (let d = p; d <= t; d++) if (nauka.has(d)) k++; return k; },

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
    // Godzina stanu „do północy”: ta sama strefa co granica dnia serii (dayN w aplikacji liczy dni w czasie telefonu),
    // więc „do północy” zawsze znaczy północ, o której seria naprawdę się kończy.
    godzina: (now = new Date()) => now.getHours(),
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
          const s = d > t ? (przerwa(d) ? "przerwa" : "przyszly") : nauka.has(d) ? "nauka" : zam.has(d) ? "zamroz" : przerwa(d) ? "przerwa" : "brak";
          row.push({ d, s, dzis: d === t });
        }
        out.push(row);
      }
      return out;
    },
    // Naprawa serii wysiłkiem: seria spadła (stara ≥ 3), opuszczonych 2–4 dni (bez przerw i zamrożeń), raz na 30 dni.
    naprawaMozna(progress, t, c = {}) {
      const st = progress && progress.streak; if (!st || !(st.n >= 3) || st.d >= t - 1) return null;
      if (Number.isFinite(progress.streakRepairAt) && t - progress.streakRepairAt < 30) return null;
      const r = L.seriaDalej(st, t, c); if (!r || !r.przerwana) return null;
      let brak = 0; const zam = c.zamrozone || new Set(), prz = c.przerwa || (() => false);
      for (let d = st.d + 1; d < t; d++) if (!zam.has(d) && !prz(d)) brak++;
      return brak >= 2 && brak <= 4 ? { n: st.n } : null;
    },
    // Krok naprawy przy pierwszym XP dnia t (prog = postęp sprzed tego XP). Zwraca patch albo null.
    naprawaKrok(prog, t, c = {}) {
      const rep = prog && prog.streakRepair;
      if (rep && Array.isArray(rep.dni) && rep.dni.length) {
        const last = rep.dni[rep.dni.length - 1];
        if (last === t) return null;
        if (last === t - 1) { const dni = [...rep.dni, t]; return dni.length >= 2 ? { streak: { d: t, n: rep.n + 2 }, streakRepair: null, streakRepairAt: t, odzyskana: rep.n + 2 } : { streakRepair: { ...rep, dni } }; }
        return { streakRepair: null, nieudana: rep.n };
      }
      const m = L.naprawaMozna(prog, t, c);
      return m ? { streakRepair: { n: m.n, od: t, dni: [t] } } : null;
    },
    // Opuszczone dni zajęć między ostatnią nauką (od) a dziś (t), bez weekendów, przerw i dni zamrożonych.
    opuszczone(od, t, c = {}) {
      const zam = c.zamrozone || new Set(), prz = c.przerwa || (() => false); let n = 0;
      for (let d = od + 1; d < t; d++) if (L.dow(d) < 5 && !prz(d) && !zam.has(d)) n++;
      return n;
    },
    // Godzina przypomnienia (minuty od północy): koniec ostatnich zajęć + 60 min, w górę do pełnych 30 min, najpóźniej 21:00;
    // bez planu 18:00 (B1).
    godzinaZPlanu(koniec) {
      if (!Number.isFinite(koniec)) return 18 * 60;
      return Math.min(21 * 60, Math.ceil((koniec + 60) / 30) * 30);
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
    retry: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
    cross: '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
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
  const zamMax = () => A().kSk?.().zamrozenia?.max || 2;
  // Przerwa w zajęciach (okres z „Przerwa” w opisie albo dzień wolny z kalendarza uczelni) – bez soboty i niedzieli.
  const dzienKey = (d) => (A().dayIso ? A().dayIso(d) : A().dkey?.(new Date(2026, 0, 1 + d)));
  function przerwa(d) {
    const ap = A(), CAL = ap.cal?.(); if (!CAL) return false;
    const k = dzienKey(d); if (!k) return false;
    if (CAL.OFF && CAL.OFF[k]) return true;
    const per = (CAL.PERIODS || []).find((o) => k >= o.od && k <= o.do);
    return !!(per && /przerwa/i.test(per.opis || ""));
  }
  // ---------------------------------------------------------------- etap 2: zamrożenia, prezent, przerwy, tydzień
  const kontekstSerii = () => ({ zamrozone: new Set(zamDni()), ma: zamMa(), przerwa });
  // Dni do bazy po kalendarzu warszawskim (nauka_dzis): to samo „wczoraj” względem dziś, także gdy telefon ma inną strefę.
  const dzisWaw = () => { try { return A().dayN(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Warsaw" }).format(new Date())); } catch (e) { return today(); } };
  const isoDnia = (d) => dzienKey(d + (dzisWaw() - today()));
  // Baner na dole ekranu (zamiast lpBanner z emoji): ikona SVG + tekst, role=status, znika po 3,5 s.
  // Baner w treści Dziś przeżywa przerysowanie ekranu (render() buduje #main od nowa): wraca pod pasek serii, dopóki trwa.
  let banerAkt = null;
  function banerPrzywroc() {
    if (!banerAkt || banerAkt.el.isConnected) return;
    if (Date.now() > banerAkt.do) { banerAkt = null; return; }
    const g = document.querySelector("#main .greet"); if (g) g.after(banerAkt.el);
  }
  if (W && typeof MutationObserver !== "undefined") setTimeout(() => { const m = document.getElementById("main"); if (m) new MutationObserver(banerPrzywroc).observe(m, { childList: true }); }, 0);
  // ms = 0: baner zostaje, dopóki student go nie zamknie (koniec serii).
  function baner(ikona, tekst, ms = 3600) {
    const ap = A(), { h } = ap; if (!h) return;
    document.querySelectorAll(".nw-baner").forEach((x) => x.remove());
    const b = h("div", { class: "nw-baner" + (reduced() ? "" : " anim"), role: "status" }, svg(IKONY[ikona] || IKONY.check, 22), h("span", { text: tekst }),
      ms ? null : h("button", { type: "button", class: "nw-baner-x", "aria-label": PL.zamknij, onclick: () => b.remove() }, svg(IKONY.cross, 20)));
    // Na Dziś baner wchodzi w treść pod paskiem serii (przesuwa kartę, niczego nie zasłania); poza Dziś nad dolnym paskiem.
    const g = document.querySelector("#main .greet");
    if (g && g.getBoundingClientRect().bottom > 0) { b.classList.add("w-tresci"); g.after(b); banerAkt = { el: b, do: ms ? Date.now() + ms : Infinity }; } else document.body.append(b);
    if (ms) setTimeout(() => { b.remove(); if (banerAkt?.el === b) banerAkt = null; }, ms);
    b.addEventListener("click", (e) => { if (e.target.closest(".nw-baner-x, .nw-baner-sklep") && banerAkt?.el === b) banerAkt = null; });
    return b;
  }
  // Zamrożenia na dni (kFreezeUse): nowa funkcja bazy (v55), bez niej stara (tylko wczoraj).
  async function zamrozDni(dni) {
    const sk = W.skrot, sb = sk?.sb;
    if (!sb || !dni.length) return { ok: false, code: "none" };
    const { data, error } = await sb.rpc("nauka_zamrozenie_uzyj_dni", { p_dni: dni.map(isoDnia) });
    if (error && /PGRST202|Could not find/.test((error.code || "") + (error.message || ""))) {
      if (dni.length === 1 && dni[0] === today() - 1 && sk.zamrozenieUzyj) { const r = await sk.zamrozenieUzyj(); return { ok: !!r?.ok, code: r?.code, stara: true }; }
      return { ok: false, code: "none", brakV55: true };
    }
    if (error || !data) return { ok: false, code: "blad", siec: true };
    try { await sk.sklepStan?.(); } catch (e) {}
    return data;
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
  // Zawsze po polsku („10 dni”): słownik EN tłumaczy wtedy cały wzór „Seria {0} dni …” jako „{0}-day streak …”.
  const dniPL = (n) => { const m10 = n % 10, m100 = n % 100; return `${n} ${n === 1 ? "dzień" : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? "dni" : "dni"}`; };
  function stanTeraz() {
    const ap = A(), t = today(), p = progress(), sk = ap.streakN ? ap.streakN() : 0;
    const doneToday = !!(p.streak && p.streak.d === t && (p.streak.n || 0) > 0), c = kontekstSerii();
    // „chroni”: gdyby dziś minął bez nauki, jutrzejsza nauka i tak przedłuży serię (zamrożenie albo przerwa).
    // Dni czekające na zamrożenie (np. weekend): zużyją się przy dzisiejszej nauce; czeka = ile ich jest.
    const r = sk > 0 && !doneToday ? L.seriaDalej(p.streak, t, c) : null, czeka = r ? r.uzyj.length : 0;
    const weekend = !!r && czeka === 2 && r.uzyj.every((d) => L.dow(d) >= 5);
    // Seria właśnie przepadła (wczoraj/weekend bez zamrożeń): widać to od razu po wejściu, nie dopiero po nauce.
    const r0 = !doneToday && p.streak && p.streak.n > 1 ? L.seriaDalej(p.streak, t, c) : null, przepadla = sk === 0 && r0 && r0.przerwana > 1 ? r0.przerwana : 0;
    // „chroni”: dziś też można opuścić, bo jutrzejsza nauka i tak przedłuży serię (zamrożenie albo przerwa).
    const chroni = sk > 0 && !doneToday && !przerwa(t) && L.seriaZywa(p.streak, t + 1, c);
    const zostanie = Math.max(0, c.ma - czeka - 1);
    return { t, sk, doneToday, ma: c.ma, czeka, zostanie, weekend, przepadla, stan: L.stanDnia(sk, doneToday, L.godzina(), { pauza: sk > 0 && przerwa(t), chroni }) };
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
    let { sk, stan, czeka, zostanie, ma, weekend, przepadla, t } = stanTeraz(); const g = celDnia();
    const rep = progress().streakRepair;
    const repJutro = rep && rep.dni && rep.dni[rep.dni.length - 1] === t && rep.dni.length === 1;
    const repDzis = rep && rep.dni && rep.dni.length === 1 && rep.dni[0] === t - 1 && stan !== "done";
    // Przy karcie powrotu (na Dziś) strata i naprawa są w karcie: pigułka zostaje spokojna (bez powtarzania).
    const zKarta = compact && kartaPowrotuWarunek();
    const napT = przepadla && !rep && !zKarta ? L.naprawaMozna(progress(), t, kontekstSerii()) : null;
    if (napT || zKarta) przepadla = 0;
    // Piątek z 2 zamrożeniami: przed nauką „ucz się dziś: weekend chroniony” (pt + sob. + ndz. bez nauki to 3 dni, za dużo),
    // po nauce „weekend chroniony”.
    const piatek = L.dow(t) === 4 && ma >= 2 && sk > 0, piatekPo = piatek && stan === "done", piatekPrzed = piatek && (stan === "chroni" || stan === "todo" || stan === "risk") && !czeka;
    if (piatekPrzed && stan === "chroni") stan = L.godzina() >= 18 ? "risk" : "todo";
    const piatekWeekend = piatekPo;
    const tytul = { done: PL.seriaDone, risk: PL.seriaRisk, todo: PL.seriaTodo, chroni: PL.seriaChroni, pauza: PL.seriaPauza }[stan] || PL.seriaStart;
    const word = compact ? ap.plural(sk, "dzień", "dni", "dni") : ap.plural(sk, "dzień z rzędu", "dni z rzędu", "dni z rzędu");
    const rg = ring(g.xp / g.cel); rg.setAttribute("role", "img"); rg.setAttribute("aria-label", fmt(PL.celDnia, g.xp, g.cel)); rg.removeAttribute("aria-hidden");
    rg.title = fmt(PL.celDnia, g.xp, g.cel);
    const cls = "xp-chip nw-streak streak-" + stan + (sk ? "" : " off") + (przepadla ? " streak-koniec" : "") + (napT || repDzis ? " streak-naprawa" : "");
    const dop = napT ? fmt(PL.naprawaPill, dniPL(napT.n)) : repJutro ? fmt(PL.naprawaJutro, dni(rep.n + 2)) : repDzis ? fmt(PL.naprawaPill1, dniPL(rep.n)) : przepadla ? fmt(PL.koniecPill, dniPL(przepadla)) : stan === "todo" && czeka ? fmt(weekend ? PL.czekaKoszt : PL.czekaKoszt2, czeka, ma) : piatekWeekend ? PL.weekendChroniony : piatekPrzed ? PL.piatekUcz
      : { todo: PL.dzisJeszcze, risk: PL.doPolnocy, chroni: zostanie ? fmt(PL.chroniZam, zostanie) : PL.chroniOst, pauza: PL.pauzaTxt, done: PL.dzisOk }[stan];
    return h("button", { type: "button", class: cls, title: napT ? fmt(PL.naprawaWiersz, dniPL(napT.n)) : tytul, "aria-haspopup": "dialog", onclick: (e) => { e.stopPropagation(); oknoSerii(); } },
      h("span", { class: "nw-s-l" }, ap.kFlame(), h("b", { class: "num", text: String(sk) }), h("span", { class: "nw-word", text: " " + word }),
        stan === "risk" ? svg(IKONY["ux2-klepsydra"], 16, "nw-klep") : stan === "chroni" || (stan === "todo" && czeka) ? svg(IKONY.snow, 16, "nw-klep") : null,
        dop ? h("span", { class: "nw-risk", text: " " + dop }) : null),
      h("span", { class: "nw-s-r" }, rg, compact ? h("span", { class: "nw-goal-t num", "aria-hidden": "true" }, g.xp >= g.cel ? PL.celOk : [h("span", { class: "nw-xp", text: "cel " }), `${g.xp}/${g.cel}`, h("span", { class: "nw-xp", text: " XP" })] /* ux-6: „cel”, żeby nie mylić z XP poziomu */) : null));
  }

  // Po XP (xpFlush): dopisanie dnia nauki i najlepszej serii; pigułki na ekranie odświeżamy w miejscu (xpFlush nie rysuje ekranu).
  // Zamrożenie w prezencie: raz na konto, gdy seria osiąga 2 (baza pilnuje „raz”; przeglądarka pamięta, że już było).
  async function prezent() {
    const ap = A(), sk = W.skrot, sb = sk?.sb;
    if (!sb || !ap.S?.uid || ap.ls?.get("skrot-zam-prezent") || ap.ls?.get("skrot-zam-prezent-dzien") === String(today())) return null;
    const { data, error } = await sb.rpc("nauka_zamrozenie_prezent", {});
    if (error || !data) return null;
    if (!data.ok) ap.ls.set("skrot-zam-prezent-dzien", String(today())); // „pelne” / „za_wczesnie”: następna próba jutro albo po nauce
    if (data.ok) {
      ap.ls.set("skrot-zam-prezent", "1");
      if (data.nowe) { try { await sk.sklepStan?.(); } catch (e) {} setTimeout(() => baner("snow", PL.prezent), 900); odswiezPigulki(); }
    }
    return data;
  }
  function poXp(prog, t, sn) {
    let patch = L.seriaPatch(prog, t, sn);
    if (!prog?.xp || prog.xp.d !== t) { // pierwsze XP dnia: krok naprawy serii
      const k = L.naprawaKrok(prog, t, kontekstSerii());
      if (k) { const { odzyskana, nieudana, ...rest } = k; patch = { ...(patch || {}), ...rest }; if (odzyskana) setTimeout(() => oknoOdzyskana(odzyskana), 900);
        if (nieudana) setTimeout(() => baner("ux2-klepsydra", fmt(PL.naprawaNieudana, dniPL(nieudana)), 0), 900); } // nieudana naprawa nigdy po cichu
    }
    // Prezent po zapisie postępu (progSoon zapisuje po 2,5 s), żeby baza widziała już 2 dni nauki; w razie „za wcześnie” ponawia tik.
    if (sn && sn.n >= 2) setTimeout(() => { try { A().ls?.set("skrot-zam-prezent-dzien", ""); } catch (e) {} prezent(); }, 3500);
    setTimeout(odswiezPigulki, 0);
    // Zadania dnia: punkty idą do bazy paczkami (co ok. 20 s), potem trigger odbiera zrobione zadania.
    clearTimeout(poXp.zt); poXp.zt = setTimeout(() => zadaniaLaduj(true), 25000);
    return patch;
  }
  function odswiezPigulki() {
    document.querySelectorAll(".nw-streak").forEach((el) => {
      const nw = pigulka(!!el.closest(".rk-compact"));
      if (nw) el.replaceWith(nw);
    });
  }

  // streakNext / kStreakAlive (index.html) przez te funkcje: zasady serii z L.seriaDalej (2 zamrożenia, przerwy).
  function seriaNastepna(t) {
    const st = progress().streak, r = L.seriaDalej(st, t, kontekstSerii());
    if (!r) return null;
    if (r.uzyj.length) zuzyj(t, st, r.uzyj);
    if (r.przerwana > 1) { if (L.naprawaMozna(progress(), t, kontekstSerii())) setTimeout(() => baner("ux2-klepsydra", fmt(PL.naprawaWiersz, dniPL(r.przerwana)), 0), 700); else koniecSerii(r.przerwana); }
    return r.next;
  }
  function seriaZywa(st, t) { return L.seriaZywa(st, t, kontekstSerii()); }
  // Zużycie zamrożeń po pierwszej nauce dnia. Błąd sieci: seria zostaje, prośba czeka w przeglądarce i wraca przy następnym
  // wejściu albo za minutę (nic nie przepada po cichu). Prawdziwy brak zamrożeń: seria od nowa z banerem.
  async function zuzyj(t, before, dniL) {
    const ap = A();
    ap.ls?.set("skrot-zam-czeka", JSON.stringify({ t, n: before.n, dni: dniL }));
    const r = await zamrozDni(dniL), n = before.n + 1;
    if (r && r.siec) return; // spróbujemy ponownie (ponow)
    ap.ls?.set("skrot-zam-czeka", "");
    if (r && r.ok) {
      const zost = r.zostalo ?? zamMa();
      setTimeout(() => { const b = baner("snow", fmt(dniL.length > 1 ? PL.uratowalo2 : PL.uratowalo1, dni(n)) + " · " + fmt(PL.zostalo, zost, zamMax()), zost ? 3600 : 8000);
        const it = zamItem(), cena = it ? (ap.kPrice ? ap.kPrice(it) : it.cena) : 40;
        if (b && !zost && ap.h && saldo() < cena) b.append(ap.h("small", { class: "nw-baner-sub", text: fmt(PL.zarobMonety, cena) }));
        if (b && !zost && ap.h && saldo() >= cena) b.append(ap.h("button", { type: "button", class: "nw-baner-sklep", onclick: () => { b.remove(); ap.kShopGo ? ap.kShopGo("nauka", "zamrozenie") : ap.go?.({ view: "shop" }); } }, PL.uzupelnij)); }, 600);
      odswiezPigulki(); return;
    }
    if (ap.S?.progress?.streak?.d === t) { ap.progSoon?.({ streak: { d: t, n: 1 } }); koniecSerii(before.n); odswiezPigulki(); }
  }
  async function ponow() {
    const ap = A(); let c = null; try { c = JSON.parse(ap.ls?.get("skrot-zam-czeka") || "null"); } catch (e) {}
    if (!c || !ap.S?.uid || !W.skrot?.sb) return;
    if (c.t !== today() || ap.S.progress?.streak?.d !== c.t) { ap.ls.set("skrot-zam-czeka", ""); return; }
    await zuzyj(c.t, { n: c.n }, c.dni);
  }
  function koniecSerii(n) {
    if (!(n > 1)) return;
    setTimeout(() => baner("ux2-klepsydra", fmt(PL.koniecSerii, dniPL(n)), 0), 700);
  }
  // Seria odzyskana wysiłkiem: okno nagrody jak „Seria +1” (płomień, liczba; ruch wyłączany przez calm i reduced-motion).
  function oknoOdzyskana(n) {
    const ap = A(), { h, modal } = ap; if (!h || !modal) { baner("check", fmt(PL.naprawaOk, dni(n))); return; }
    modal((close) => [h("div", { class: "nw-seria nw-odzyskana" + (reduced() ? "" : " anim") },
      h("span", { class: "eyebrow nw-seria-h", text: PL.seriaOdzyskanaH }),
      h("span", { class: "nw-seria-flame", "aria-hidden": "true" }, ap.kFlame()),
      h("b", { class: "nw-seria-n num", text: String(n) }),
      h("p", { class: "nw-seria-t", text: ap.plural(n, "dzień z rzędu!", "dni z rzędu!", "dni z rzędu!") }),
      h("p", { class: "nw-jutro", text: fmt(PL.jutroSeria, dni(n + 1)) }),
      h("button", { type: "button", class: "btn primary", style: "min-height:48px", onclick: close }, PL.super))], "nw-okno-modal");
  }
  // ---------------------------------------------------------------- okno „Twoja seria”
  function kalendarzEl(t, tygodni) {
    const ap = A(), { h } = ap, p = progress(), zam = zamDni(), st = stanTeraz().stan;
    const nauka = L.dniNauki(p, zam, przerwa), cal = L.kalendarz(t, tygodni, nauka, zam, przerwa), lt = dowLetters();
    const lab = { nauka: PL.dzienNauka, zamroz: PL.dzienZamroz, przerwa: PL.dzienPrzerwa, brak: PL.dzienBrak, przyszly: PL.dzienPrzyszly };
    return h("div", { class: "nw-cal", role: "group", "aria-label": PL.ostatnie4 },
      h("div", { class: "nw-cal-row nw-cal-head", "aria-hidden": "true" }, lt.map((x) => h("span", { text: x }))),
      cal.map((row) => h("div", { class: "nw-cal-row" }, row.map((c) => {
        const el = h("span", { class: `nw-day s-${c.s}${c.dzis ? " dzis" + (c.s === "brak" ? (st === "chroni" ? " chroni" : st === "pauza" ? "" : " todo") : "") : ""}`, role: "img", "aria-label": fmt(lab[c.s], dzienLabel(c.d)) + (c.dzis ? ` (${PL.lgDzis})` : "") });
        if (c.s === "nauka") el.append(svg('<path d="M7 12.5l3.2 3.2L17 9"/>', 14));
        else if (c.s === "zamroz") el.append(svg(IKONY.snow, 14));
        return el;
      }))),
      h("div", { class: "nw-legend" },
        h("span", {}, h("i", { class: "nw-day s-nauka mini", "aria-hidden": "true" }), h("span", { text: PL.lgNauka })),
        h("span", {}, h("i", { class: "nw-day s-zamroz mini", "aria-hidden": "true" }), h("span", { text: PL.lgZamroz })),
        h("span", {}, h("i", { class: "nw-day s-przerwa mini", "aria-hidden": "true" }), h("span", { text: PL.lgPrzerwa })),
        h("span", {}, h("i", { class: "nw-day s-brak mini", "aria-hidden": "true" }), h("span", { text: PL.lgBrak })),
        st === "chroni" ? h("span", {}, h("i", { class: "nw-day s-brak dzis chroni mini", "aria-hidden": "true" }), h("span", { text: PL.lgDzisChroni }))
          : h("span", {}, h("i", { class: "nw-day s-brak dzis todo mini", "aria-hidden": "true" }), h("span", { text: PL.lgDzisTodo })),
        h("span", {}, h("i", { class: "nw-day s-przyszly mini", "aria-hidden": "true" }), h("span", { text: PL.lgPrzyszly }))));
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
    const opis = { done: PL.oknoStanDone, risk: PL.oknoStanRisk, todo: PL.oknoStanTodo, chroni: PL.oknoStanChroni, pauza: PL.oknoStanPauza }[stan] || PL.oknoStanZero;
    modal((close) => [
      h("div", { class: "nw-okno nw-st-" + stan },
        h("div", { class: "nw-okno-top" },
          h("span", { class: "nw-big-flame" + (stan === "done" ? "" : " off"), "aria-hidden": "true" }, ap.kFlame()),
          h("div", { class: "nw-okno-h" }, h("span", { class: "eyebrow", text: PL.oknoTytul }), h("h2", { class: "nw-okno-n" }, h("span", { class: "num", text: String(sk) }), " ", h("span", { class: "nw-okno-w", text: ap.plural(sk, "dzień z rzędu", "dni z rzędu", "dni z rzędu") })))),
        h("p", { class: "nw-okno-opis" + (stan === "risk" ? " risk" : ""), text: opis }),
        h("p", { class: "nw-okno-zam" }, svg(IKONY.snow, 16), h("span", { class: "num", text: fmt(PL.zamTeraz, ma, zamMax()) }),
          stan === "chroni" ? h("span", { text: " · " + fmt(PL.reguleChroni, ap.plural(ma, "1 zamrożenie", `${ma} zamrożenia`, `${ma} zamrożeń`)) }) : null),
        h("div", { class: "nw-goal" }, ring(g.xp / g.cel, 28), h("span", { text: fmt(PL.celDnia, g.xp, g.cel) })),
        stan === "pauza" ? null : h("p", { class: "nw-zasady" }, svg(IKONY["ux2-klepsydra"], 18), h("span", { text: PL.zasady })),
        h("h3", { class: "nw-sub", text: PL.ostatnie4 }), kalendarzEl(t, 4),
        h("div", { class: "nw-zam" },
          svg(IKONY.snow, 22, "nw-zam-ico"),
          h("div", { class: "nw-zam-t" }, h("b", { text: PL.zamTytul }), h("span", { class: "num", text: fmt(PL.zamMasz, ma, zamMax()) }), h("small", { class: "muted", text: PL.zamOpis })),
          ma >= 2 ? h("span", { class: "chip plain nw-zam-full", text: PL.zamKomplet })
            : h("button", { type: "button", class: "btn small", onclick: () => { close(); ap.kShopGo ? ap.kShopGo("nauka", "zamrozenie") : ap.go?.({ view: "shop" }); } }, PL.zamSklep)),
        h("p", { class: "nw-best" }, svg(IKONY["ux2-medal"], 18), h("span", { text: fmt(PL.najlepsza, dni(best)) })),
        h("h3", { class: "nw-sub", text: PL.kamienie }), kamienieEl(sk),
        h("div", { class: "row nw-okno-btns" },
          stan !== "done" && ap.ldOpen ? h("button", { type: "button", class: "btn primary", onclick: () => { close(); if (ap.S?.route?.view !== "home") ap.go?.({ view: "home" }); setTimeout(() => ap.ldOpen("karta"), 60); } }, PL.uczSie) : null,
          h("button", { type: "button", class: "btn ghost", onclick: close }, PL.zamknij))),
    ], "nw-okno-modal");
    // Fokus na nagłówku (nie na „Kup w sklepie”), okno od góry: najpierw seria, cel i zasady.
    const hd = document.querySelector("#layer .nw-okno-n"), md = document.querySelector("#layer .nw-okno-modal");
    if (hd) { hd.setAttribute("tabindex", "-1"); try { hd.focus({ preventScroll: true }); } catch (e) {} }
    if (md) md.scrollTop = 0;
    requestAnimationFrame(() => { if (md) md.scrollTop = 0; });
  }

  const zamItem = () => (A().kSk?.().katalog || []).find((x) => x.id === "zamrozenie") || null;
  const saldo = () => { const ap = A(); return ap.coins ? ap.coins() : (ap.kSk?.().saldo || 0); };
  const coinIco = () => { const ap = A(); const el = ap.h2Ico ? ap.h2Ico("coin", "") : null; if (el) { el.classList.add("nw-coin"); el.setAttribute("aria-hidden", "true"); } return el; };
  // Karta zamrożenia dla Sklepu (sekcja „Ochrona serii”, wstawia pętla 5): opis, stan „Masz N/2”, kupno przez kBuy.
  function kartaZamrozenia() {
    const ap = A(), { h } = ap, it = zamItem(); if (!h || !it) return null;
    const ma = zamMa(), mx = it.max || 2, cena = ap.kPrice ? ap.kPrice(it) : it.cena;
    return h("section", { class: "nw-zcard", "aria-label": PL.zamTytul },
      svg(IKONY.snow, 26, "nw-zam-ico"),
      h("div", { class: "nw-zam-t" }, h("b", { text: PL.zamTytul }), h("span", { class: "num", text: fmt(PL.zamMasz, ma, zamMax()) }), h("small", { class: "muted", text: PL.zamOpis })),
      ma >= mx ? h("span", { class: "chip plain nw-zam-full", text: PL.zamKomplet })
        : h("button", { type: "button", class: "btn primary nw-zbuy", onclick: () => ap.kBuy?.(it) }, h("span", { text: PL.kupZa }), h("b", { class: "num", text: String(cena) }), coinIco()));
  }
  // Propozycja na ekranie końca (wstawia pętla 3): seria ≥ 3, saldo ≥ cena (40), brak zamrożenia, „Nie teraz” chowa na 7 dni.
  function ofertaZamrozenia() {
    const ap = A(), { h } = ap, it = zamItem(); if (!h || !it || !ap.S?.uid) return null;
    const sk = ap.streakN ? ap.streakN() : 0, cena = ap.kPrice ? ap.kPrice(it) : it.cena, t = today();
    const nie = +(ap.ls?.get("skrot-zam-oferta-nie") || -99);
    if (sk < 3 || saldo() < cena || zamMa() > 0 || t - nie < 7) return null;
    const box = h("section", { class: "nw-oferta", "aria-label": PL.ofertaTytul },
      svg(IKONY.snow, 26, "nw-zam-ico"),
      h("div", { class: "nw-zam-t" }, h("b", {}, h("span", { text: fmt(PL.ofertaTytulCena, cena) }), " ", coinIco()), h("small", { class: "muted", text: fmt(PL.ofertaOpis, dni(sk)) })),
      h("div", { class: "row nw-oferta-btns" },
        h("button", { type: "button", class: "btn primary", onclick: () => ap.kBuy?.(it) }, h("span", { text: PL.kupZa }), h("b", { class: "num", text: String(cena) }), coinIco()),
        h("button", { type: "button", class: "btn ghost", onclick: () => { ap.ls?.set("skrot-zam-oferta-nie", String(t)); box.remove(); } }, PL.nieTeraz)));
    return box;
  }
  // „Ten tydzień: k/5 dni” w rzędzie z rangą (7 kropek pon–nd); klik otwiera okno serii.
  function tydzienMini() {
    const ap = A(), { h } = ap; if (!h) return null;
    const t = today(), zam = zamDni(), nauka = L.dniNauki(progress(), zam, przerwa), week = L.tydzien(t, nauka, zam, przerwa), k = L.tydzienNauki(t, nauka);
    // Cel tygodnia = 5 dni zajęć pon–pt minus dni przerwy (przerwa świąteczna: „Ten tydzień: przerwa”).
    const pon = L.poniedzialek(t); let wolne = 0; for (let d = pon; d < pon + 5; d++) if (przerwa(d)) wolne++;
    const cel = 5 - wolne, txt = cel <= 0 ? PL.przerwaTydz : cel === 5 ? fmt(PL.tydzienK, k) : fmt(PL.tydzienKz, k, cel);
    const lab = { nauka: PL.dzienNauka, zamroz: PL.dzienZamroz, przerwa: PL.dzienPrzerwa, brak: PL.dzienBrak, przyszly: PL.dzienPrzyszly };
    const opis = week.map((c) => fmt(lab[c.s], dzienLabel(c.d))).join(", ");
    return h("button", { type: "button", class: "xp-chip nw-tyg" + (cel > 0 && k >= cel ? " pelny" : ""), "aria-haspopup": "dialog", title: PL.tydzienTitle, "aria-label": txt + ". " + fmt(PL.tydzienAria, opis), onclick: (e) => { e.stopPropagation(); oknoSerii(); } },
      h("span", { class: "nw-tyg-dots", "aria-hidden": "true" }, week.map((c) => h("i", { class: `s-${c.s}${c.dzis ? " dzis" + (c.s === "nauka" || c.s === "przerwa" ? "" : " todo") : ""}` }))),
      h("span", { class: "nw-tyg-t", "aria-hidden": "true", text: txt }));
  }
  // ---------------------------------------------------------------- etap 3: powroty po przerwie
  // Dni od ostatniego XP (0 = dziś już była nauka). „Ostatnio N dni temu”: N = dziś − dzień ostatniego XP.
  // Opuszczone dni zajęć od ostatniego XP: bez sobót i niedziel, dni przerw z kalendarza uczelni i dni zamrożonych.
  // Zwykły rytm pon–pt (piątek → poniedziałek) i dzień chroniony zamrożeniem to nie „powrót po przerwie”.
  function przerwaDni() { const x = progress().xp, t = today(); return x && Number.isFinite(x.d) && x.d < t ? L.opuszczone(x.d, t, kontekstSerii()) : 0; }
  const dniOdNauki = () => { const x = progress().xp, t = today(); return x && Number.isFinite(x.d) && x.d < t ? t - x.d : 0; };
  const wracamZLinku = () => { try { return new URLSearchParams(location.search).get("wracam") === "1"; } catch (e) { return false; } };
  // Karta „Wracam: 3 minuty” (null, gdy nie ma żadnego znanego tematu ani rewanżu: wtedy uczciwie zwykła karta 5 min).
  function kartaPowrotuPlan() { const ap = A(); try { const k = ap.ldKontekst(); k.przerwaDni = Math.max(2, przerwaDni()); return ap.LDE?.kartaPowrotu?.(ap.ldTematy(), k) || null; } catch (e) { return null; } }
  function startPowrotu() {
    const ap = A(), c = kartaPowrotuPlan();
    try {
      const st = ap.ldDay.get();
      // Plan zamrożony w st.plany: ldOpen nie składa wtedy karty od nowa (inaczej wróciłoby „Najważniejsze z tematu”).
      if (c && st.dzien) { st.dzien.karta = c; st.plany = { ...(st.plany || {}), karta: c }; delete st.done.karta; ap.ldDay.set(st); }
    } catch (e) {}
    ap.ldOpen?.("karta");
  }
  function powrotAktywny() { return !!document.querySelector("#main .nw-powrot:not(.nw-powrot-mini)") || !!kartaPowrotuWarunek(); }
  function kartaPowrotuWarunek() {
    const ap = A(); if (!ap.S?.ready) return false;
    if (progress().xp?.d === today()) return false; // po dzisiejszej nauce karta znika (także z maila)
    return przerwaDni() >= 2 || wracamZLinku() || ap.ls?.get("skrot-wracam") === String(today());
  }
  function maKartePowrotu() { return !!kartaPowrotuPlan(); }
  function kartaPowrotu() {
    const ap = A(), { h } = ap; if (!h || !ap.S?.ready) return null;
    if (!kartaPowrotuWarunek()) {
      // Seria do odzyskania, choć nie było „powrotu po przerwie” (np. czwartek → poniedziałek bez zamrożeń): sam wiersz naprawy.
      const nap0 = progress().xp?.d !== today() ? L.naprawaMozna(progress(), today(), kontekstSerii()) : null;
      return nap0 ? h("section", { class: "panel sk-panel nw-powrot nw-powrot-mini", "aria-label": PL.seriaOdzyskanaH },
        h("p", { class: "nw-powrot-nap naprawa" }, svg(IKONY.retry, 18), h("span", { text: fmt(PL.naprawaWiersz, dniPL(nap0.n)) }), h("b", { class: "num nw-nap-post", text: "0/2" }))) : null;
    }
    const gap = dniOdNauki(), t = today(), od = gap >= 1 ? t - gap + 1 : t, p = progress();
    let zaj = 0; try { for (let d = od; d < t; d++) zaj += (ap.classesOn(dzienKey(d), ap.S.group, ap.S.sub) || []).length; } catch (e) {}
    const odMs = ap.dparse ? ap.dparse(dzienKey(od)).getTime() : new Date(2026, 0, 1 + od).getTime();
    let ter = 0; try { ter = (ap.visDeadlines() || []).filter((x) => (x.createdAt || 0) >= odMs).length; } catch (e) {}
    let fis = 0; try { const dd = ap.srsDue(""); fis = (dd.due || []).length + (dd.rew || []).length; } catch (e) {}
    // Punkty jako działania (przyciski), tylko te, które są: zajęcia → Kalendarz, terminy → Terminy, fiszki → Powtórki.
    const pkt = [zaj ? [fmt(PL.powrotZajecia, zaj), "calendar"] : null, ter ? [fmt(PL.powrotTerminy, ter), "terms"] : null, fis ? [fmt(PL.powrotFiszki, fis), "review"] : null].filter(Boolean).slice(0, 3);
    const nap = L.naprawaMozna(p, t, kontekstSerii()), st = stanTeraz(), plan = kartaPowrotuPlan();
    const box = h("section", { class: "panel sk-panel nw-powrot", "aria-label": PL.powrotTytulDzis },
      h("div", { class: "nw-powrot-top" }, h("span", { class: "nw-powrot-stas", "aria-hidden": "true" }, ap.stasFace ? ap.stasFace("hi") : null),
        h("h2", { class: "nw-powrot-h", text: gap >= 2 ? fmt(PL.powrotTytul, dni(gap)) : PL.powrotTytulDzis })),
      pkt.length ? h("div", { class: "nw-powrot-pkt" }, pkt.map(([x, v]) => h("button", { type: "button", class: "nw-pkt", onclick: () => ap.go?.({ view: v }) }, h("span", { text: x }), h("span", { class: "nw-pkt-chev", "aria-hidden": "true", text: "›" })))) : null,
      nap ? h("p", { class: "nw-powrot-nap naprawa" }, svg(IKONY.retry, 18), h("span", { text: fmt(PL.naprawaWiersz, dniPL(nap.n)) }), h("b", { class: "num nw-nap-post", text: "0/2" }))
        : st.przepadla >= 3 ? h("p", { class: "nw-powrot-nap" }, svg(IKONY["ux2-klepsydra"], 18), h("span", { text: fmt(PL.seriaPrzepadla, dniPL(st.przepadla)) })) : null,
      h("button", { type: "button", class: "btn primary nw-powrot-go", onclick: () => startPowrotu() }, plan ? PL.powrotWracam : PL.powrotWracam5),
      h("p", { class: "nw-powrot-lekko muted", text: plan ? PL.powrotLekko : PL.powrotSpokojnie }));
    return box;
  }
  // ---------------------------------------------------------------- etap 4: kanał poza stroną
  const godzTxt = (m) => { const g = Math.floor(m / 60), mm = String(m % 60).padStart(2, "0");
    return W && W.SKROT_LANG === "en" ? `${g % 12 || 12}:${mm} ${g < 12 ? "am" : "pm"}` : `${g}:${mm}`; };
  // Godzina, którą zapisze „Włącz” (nowe ustawienia: z planu zajęć; wcześniej zapisane: ta zapisana).
  function godzinaDoZapisu() { const PRZ = A().prz?.(); return PRZ?.d && !PRZ.d.nowe && Number.isFinite(PRZ.d.godz) ? PRZ.d.godz : godzinaPrzypomnienia(); }
  function przypOpisTermin() { return fmt(PL.przypOpisTermin, godzTxt(godzinaDoZapisu())); }
  // Dni (ISO, dziś…+3), w które nauka jeszcze przedłuży serię (wczoraj, zamrożenia, przerwy): mail „seria” liczy z nich.
  function dniSeriiZywej() {
    const ap = A(), st = progress().streak, t = today(), out = [];
    if (!st || !(st.n > 0) || !ap.dayIso) return out;
    for (let i = 0; i <= 3; i++) if (st.d < t + i && seriaZywa(st, t + i)) out.push(ap.dayIso(t + i));
    return out;
  }
  // Koniec ostatnich zajęć w najbliższym dniu z zajęciami (od jutra, do 7 dni) → godzina przypomnienia.
  function godzinaPrzypomnienia() {
    const ap = A();
    try {
      for (let i = 1; i <= 7; i++) {
        const lst = ap.classesOn(dzienKey(today() + i), ap.S.group, ap.S.sub) || [];
        if (!lst.length) continue;
        const ends = lst.map((e) => (e.time || ap.SLOTS[e.s] || [])[1]).filter(Boolean).map((x) => { const [h, m] = x.split(":").map(Number); return h * 60 + m; });
        if (ends.length) return L.godzinaZPlanu(Math.max(...ends));
      }
    } catch (e) {}
    return L.godzinaZPlanu(null);
  }
  // „Przypomnieć Ci jutro o {godz}?” na ekranie końca pierwszej karty dnia (wstawia pętla 3).
  // Warunki (C4): zalogowany, pełny dostęp albo próba, przypomnienia wyłączone, bez „Nie teraz” dziś, pierwsza skończona karta dnia.
  function ofertaPrzypomnienia() {
    const ap = A(), { h } = ap; if (!h) return null;
    const PRZ = ap.prz?.(), sk = W.skrot || {};
    if (sk.state !== "in" || !ap.PAID?.() || !ap.pz?.()) return null;
    ap.przypLoad?.();
    if (!PRZ?.d || PRZ.d.wlaczone || PRZ.off) return null;
    if (ap.ls?.get("skrot-przyp-nie") === ap.todayKey?.()) return null;
    if (+(ap.ls?.get("skrot-przyp-pauza") || 0) > today()) return null; // 3 × „Nie teraz” → 30 dni spokoju
    const st = ap.ldDay?.get?.(); if (!st?.done?.karta) return null; // pierwsza skończona karta dnia
    // Raz dziennie: tylko na ekranie, na którym pokazała się pierwszy raz (kolejne render() tego ekranu ją zachowują).
    const dz = String(today()), ekran = st.done.karta;
    if (ap.ls?.get("skrot-przyp-oferta") === dz && ofertaEkran !== ekran) return null;
    ap.ls?.set("skrot-przyp-oferta", dz); ofertaEkran = ekran;
    const godz = godzinaDoZapisu();
    const box = h("section", { class: "panel sk-panel nw-przyp", "aria-label": fmt(PL.przypTytul, godzTxt(godz)) },
      h("h2", { class: "nw-przyp-h", text: fmt(PL.przypTytul, godzTxt(godz)) }),
      h("p", { class: "muted", text: PL.przypOpis }),
      h("div", { class: "row nw-przyp-btns" },
        h("button", { type: "button", class: "btn primary", onclick: async () => { await ap.przypSave({ wlaczone: true, godz }, PL.przypWlaczone); box.remove(); } }, PL.przypTak),
        h("button", { type: "button", class: "btn ghost", onclick: () => { ap.ls.set("skrot-przyp-nie", ap.todayKey());
          const n = +(ap.ls.get("skrot-przyp-odmowy") || 0) + 1;
          if (n >= 3) { ap.ls.set("skrot-przyp-pauza", String(today() + 30)); ap.ls.set("skrot-przyp-odmowy", "0"); } else ap.ls.set("skrot-przyp-odmowy", String(n));
          box.remove(); } }, PL.nieTeraz)));
    return box;
  }
  let ofertaEkran = null;
  // przypHomeCard bez zaliczenia w ciągu 14 dni: wersja ogólna po ≥ 1 dniu nauki; „Nie teraz” chowa na 30 dni (ten sam klucz).
  function kartaPrzypomnieniaDzis() {
    const ap = A(), { h } = ap; if (!h) return null;
    const PRZ = ap.prz?.(); if (!PRZ?.d || PRZ.d.wlaczone) return null;
    const p = progress(), dniNauki = L.dniNauki(p, zamDni(), przerwa).size;
    if (dniNauki < 1) return null;
    const godz = godzinaDoZapisu(), sn = p.streak?.n || 0;
    return h("section", { class: "panel sk-panel przyp-card nw-przyp", "aria-label": PL.przypDzisTytul },
      h("div", { class: "panel-head" }, h("h2", { text: PL.przypDzisTytul }),
        h("button", { type: "button", class: "link przyp-nie nw-link44", onclick: () => { ap.ls.set("skrot-przyp-nie", ap.todayKey()); ap.render(); } }, PL.nieTeraz)),
      sn >= 2 ? h("p", { class: "nw-przyp-powod", text: fmt(PL.przypPowod, dniPL(sn)) }) : null,
      h("p", { class: "muted", style: "margin:0;font-size:.92rem", text: fmt(PL.przypDzisOpis, godzTxt(godz)) }),
      h("div", { class: "row" }, h("button", { type: "button", class: "btn przyp-on", style: "min-height:48px", onclick: () => ap.przypSave(PRZ.d.nowe ? { wlaczone: true, godz } : { wlaczone: true }, PL.przypWlaczone) }, PL.wlacz)));
  }
  // Przełącznik w oknie „Kalendarz w telefonie”: progress.calStudy (funkcja kalendarz czyta go przez SQL v57).
  function przelacznikKalendarza() {
    const ap = A(), { h } = ap; if (!h) return null;
    const id = "nw-kal-nauka", on = progress().calStudy === true;
    const inp = h("input", { type: "checkbox", id, checked: on ? true : null, onchange: async (e) => { const v = !!e.target.checked; await ap.saveProgress?.({ calStudy: v }); ap.toast?.(v ? PL.kalZapisanoOn : PL.kalZapisanoOff); } });
    return h("label", { class: "nw-kal", for: id }, inp, h("span", {}, h("b", { text: PL.kalNauka }), h("small", { class: "muted", text: PL.kalNaukaOpis })));
  }
  // Zachęta do instalacji: raz, w 2. dniu nauki (Android: zapamiętany beforeinstallprompt, iPhone: 2 kroki), „Nie teraz” na 30 dni.
  let instEvt = null;
  // Zdarzenie przychodzi zwykle po pierwszym rysowaniu Dziś: przerysowanie, żeby zachęta mogła się pojawić.
  if (W) W.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); instEvt = e; try { if (!document.querySelector(".nw-inst")) A().render?.(); } catch (er) {} });
  const iOS = () => (/iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)) && !navigator.standalone; // + iPadOS
  // Przeglądarki wbudowane w aplikacje (Instagram, Facebook, TikTok…) nie umieją dodać strony do ekranu głównego.
  const wAplikacji = () => /FBAN|FBAV|FB_IAB|Instagram|Line\/|Messenger|TikTok|musical_ly|Snapchat|; wv\)/.test(navigator.userAgent);
  const zainstalowana = () => (W.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  function ofertaInstalacji() {
    const ap = A(), { h } = ap; if (!h || zainstalowana() || wAplikacji()) return null;
    if (!instEvt && !iOS()) return null;
    const nie = +(ap.ls?.get("skrot-inst-nie") || -99), t = today();
    if (t - nie < 30 || ap.ls?.get("skrot-inst-pokazana") && ap.ls.get("skrot-inst-pokazana") !== String(t)) return null;
    const p = progress(); if (L.dniNauki(p, zamDni(), przerwa).size < 2) return null; // od 2. dnia nauki, jeden raz
    ap.ls?.set("skrot-inst-pokazana", String(t));
    const box = h("section", { class: "panel sk-panel nw-inst", "aria-label": PL.instTytul },
      h("p", { class: "nw-inst-h", text: PL.instTytul }),
      iOS() ? h("ol", { class: "nw-inst-ios" }, h("li", {}, svg('<path d="M12 3v12M7.5 7.5L12 3l4.5 4.5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>', 18), h("span", { text: PL.instIos1 })), h("li", {}, svg('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/>', 18), h("span", { text: PL.instIos2 }))) : null,
      h("div", { class: "row" },
        instEvt ? h("button", { type: "button", class: "btn primary", onclick: async () => { try { await instEvt.prompt(); } catch (e) {} instEvt = null; box.remove(); } }, PL.instDodaj) : null,
        h("button", { type: "button", class: "btn ghost", onclick: () => { ap.ls.set("skrot-inst-nie", String(t)); box.remove(); } }, PL.nieTeraz)));
    return box;
  }
  // Wiersz „Jutro: {temat}, 5 min” (ekran końca, pętla 3): karta 5 min z tematu spoza dzisiejszych, jak „Jeszcze 5 min”.
  function jutroTytul() {
    try {
      const ap = A(), LDE = ap.LDE; if (!LDE || !ap.ldTematy) return null;
      const st = ap.ldDay.get(), d = st.dzien || {};
      const skip = new Set([...(st.tem || []), ...(d.lekcje || []).map((l) => l.temat), d.karta && d.karta.temat, ...(st.karty || [])].filter(Boolean));
      const r = LDE.ulozDzien(ap.ldTematy().filter((x) => !skip.has(x.id)), ap.ldKontekst());
      const m = r && r.karta && ap.materialById(r.karta.temat);
      return m ? m.title || null : null;
    } catch (e) { return null; }
  }
  // Wiersz naprawy dla ekranu końca (pętla 3): „Naprawa serii: 1/2. Jutro wróci seria 14 dni.” albo null.
  function naprawaLinia() {
    const { h } = A(), rep = progress().streakRepair; if (!h || !rep || !rep.dni || rep.dni.length !== 1 || rep.dni[0] !== today()) return null;
    return h("p", { class: "nw-jutro-t nw-nap-linia" }, svg(IKONY.retry, 18), h("span", { text: fmt(PL.naprawaKoniec, dniPL(rep.n + 2)) }));
  }
  function jutro() {
    const { h } = A(), t = jutroTytul(); if (!h || !t) return null;
    return h("p", { class: "nw-jutro-t" }, svg('<path d="M8 2v4M16 2v4M3 10h18"/><rect x="3" y="4" width="18" height="18" rx="2"/>', 18), h("span", { text: fmt(PL.jutroTemat, t) }));
  }

  // ---------------------------------------------------------------- etap 5: linia zadań, tygodnia i duetu na Dziś
  // Zadania dnia z bazy (nauka_misje, te same co w Sklepie). Nagrody odbiera baza sama (SQL v57: trigger monet), więc tu tylko
  // postęp. Własny stan (nie SHOP ze Sklepu), żeby Dziś nie zależało od widoku Sklepu (pętla 5).
  const ZAD = { d: null, at: 0, busy: false };
  function zadaniaLaduj(force) {
    const sk = W.skrot; if (!sk?.misje || sk.state !== "in" || ZAD.busy || (!force && ZAD.d && Date.now() - ZAD.at < 60e3)) return;
    ZAD.busy = true;
    sk.misje().then((d) => { ZAD.d = d || { ok: false }; }, () => { ZAD.d = ZAD.d || { ok: false }; })
      .finally(() => { ZAD.busy = false; ZAD.at = Date.now(); odswiezLinie(); });
  }
  const coin = () => { const ap = A(), s = document.createElement("span"); s.className = "nw-coin"; s.setAttribute("aria-hidden", "true"); s.innerHTML = ap.H2_ICO?.coin || ""; return s; };
  // Stan dla Sklepu (pętla 5) i ekranu końca: { ok, zrobione, wszystkie, suma, godz, dzienne, tydz, zablokowane }.
  function zadaniaStan() {
    zadaniaLaduj();
    const d = ZAD.d; if (!d || !d.ok) return d ? { ok: false } : null;
    const dzienne = [...(d.osobista ? [d.osobista] : []), ...d.misje.filter((m) => m.okres === "dzien")];
    const zrobione = dzienne.filter((m) => m.postep >= m.ile).length, suma = dzienne.filter((m) => m.odebrana).reduce((a, m) => a + (m.nagroda || 0), 0);
    const pula = dzienne.reduce((a, m) => a + (m.nagroda || 0), 0);
    const koniec = dzienne[0]?.do_kiedy ? new Date(dzienne[0].do_kiedy) - Date.now() : null;
    return { ok: true, zrobione, wszystkie: dzienne.length, suma, pula, godz: koniec != null ? Math.max(1, Math.ceil(koniec / 36e5)) : null, dzienne,
      tydz: d.misje.find((m) => m.okres === "tydzien") || null, zablokowane: !!d.zablokowane };
  }
  const opisZad = (m) => (W.SKROT_LANG === "en" ? m.opis_en : m.opis_pl) || m.opis_pl || "";
  function zadWiersz(m, tydz) {
    const { h } = A(), done = m.postep >= m.ile;
    return h("li", { class: "nw-zad" + (done ? " done" : "") + (tydz ? " tydz" : "") },
      done ? svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 18, "nw-zad-ok") : h("span", { class: "nw-zad-n num", text: `${m.postep}/${m.ile}` }),
      h("span", { class: "nw-zad-t" }, tydz ? h("small", { class: "muted", text: PL.zadTydz }) : null, h("span", { "data-noi18n": "", translate: "no", text: opisZad(m) }),
        tydz ? h("span", { class: "nw-zad-bar", role: "progressbar", "aria-label": PL.zadTydz, "aria-valuemin": "0", "aria-valuemax": String(m.ile), "aria-valuenow": String(m.postep) }, h("i", { style: `width:${Math.min(100, (m.postep / m.ile) * 100).toFixed(1)}%` })) : null),
      // „Odebrane” tylko, gdy baza naprawdę zapisała nagrodę (m.odebrana); zrobione, a jeszcze nie zapisane: „zrobione”.
      h("span", { class: "nw-zad-p num" }, done ? h("span", { class: "nw-zad-odeb", text: (m.odebrana ? PL.zadOdebrane : PL.zadZrobione) + " " }) : null, "+" + m.nagroda, coin()));
  }
  // Duet (paczka.js, SQL v37): wiersz z postępem tygodnia i tym, czy partner już się dziś uczył.
  function duetWiersz() {
    const ap = A(), { h } = ap, PK = ap.pk?.(), PQ = W.SKROT_PACZKA; if (!h || !PQ) return null;
    ap.paczkaLoad?.();
    const d = PK?.d, duet = d?.duet; if (!duet || duet.stan !== "aktywny") return null;
    const cz = d.paczka?.czlonkowie || [], i = cz.findIndex((m) => m.id === duet.z), m = cz[i], nick = PQ.nazwa(m, i < 0 ? 1 : i), pr = PQ.postepDuetu(duet, d.dzis);
    return h("button", { type: "button", class: "nw-duet", onclick: () => ap.go({ view: "paczka" }) },
      svg('<circle cx="8" cy="8" r="3.2"/><circle cx="16.5" cy="9" r="2.8"/><path d="M2.5 19c.6-3.3 3-5 5.5-5s4.9 1.7 5.5 5M13 14.6c.9-.6 2.1-.9 3.5-.9 2.3 0 4.3 1.5 5 4.3"/>', 20),
      h("span", { class: "nw-duet-t" }, h("span", { text: fmt(PL.duetZ, nick, pr.suma, pr.cel) }), h("span", { class: "nw-duet-k" + (m?.dzis ? " ok" : ""), text: fmt(m?.dzis ? PL.duetDzis : PL.duetNie, nick) })),
      h("span", { class: "nw-pkt-chev", "aria-hidden": "true", text: "›" }));
  }
  // Bez duetu, od 3. dnia nauki, raz (pokazane jednego dnia; „Nie teraz” albo wysłanie kończy): zaproszenie z navigator.share.
  async function duetLink() {
    const ap = A(), sk = W.skrot, PQ = W.SKROT_PACZKA; let kod = ap.pk?.()?.d?.paczka?.kod;
    if (!kod && sk?.paczka?.zaloz) { const r = await sk.paczka.zaloz(); kod = r?.paczka?.kod; if (r?.ok) ap.paczkaLoad?.(true); }
    return kod && PQ ? PQ.link(kod) : null;
  }
  function zaproszenieDuetu() {
    const ap = A(), { h } = ap, PK = ap.pk?.(), PQ = W.SKROT_PACZKA; if (!h || !PQ || W.skrot?.state !== "in" || !W.skrot?.paczka) return null;
    ap.paczkaLoad?.();
    if (!PK?.d || PK.d.duet) return null; // dane paczki jeszcze nie przyszły albo duet już jest (także zaproszenie)
    const dz = String(today()), byla = ap.ls?.get("skrot-duet-zapr");
    if (byla && byla !== dz) return null;
    if (L.dniNauki(progress(), zamDni(), przerwa).size < 3) return null;
    ap.ls?.set("skrot-duet-zapr", dz);
    const cfg = PQ.cfgZ ? PQ.cfgZ(PK.d.cfg) : PQ.CFG;
    const zamknij = (box) => { ap.ls.set("skrot-duet-zapr", "x"); box.remove(); };
    const box = h("div", { class: "nw-zapr" },
      h("p", { class: "nw-zapr-t" }, svg('<circle cx="8" cy="8" r="3.2"/><circle cx="16.5" cy="9" r="2.8"/><path d="M2.5 19c.6-3.3 3-5 5.5-5s4.9 1.7 5.5 5M13 14.6c.9-.6 2.1-.9 3.5-.9 2.3 0 4.3 1.5 5 4.3"/>', 20),
        h("span", { text: fmt(PL.duetZapr, cfg.duet_cel, cfg.duet_nagroda) })),
      h("div", { class: "row nw-zapr-b" },
        h("button", { type: "button", class: "btn primary", onclick: async (e) => {
          const b = e.currentTarget; b.disabled = true;
          try {
            const url = await duetLink(); if (!url) { ap.toast?.(PL.blad); return; }
            if (navigator.share) { try { await navigator.share({ title: "Zdawalni", text: PL.duetShare, url }); zamknij(box); } catch (er) {} }
            else { try { await navigator.clipboard.writeText(url); ap.toast?.(PL.linkSkop); } catch (er) { prompt(PL.duetWyslij, url); } zamknij(box); }
          } finally { b.disabled = false; }
        } }, PL.duetWyslij),
        h("button", { type: "button", class: "btn ghost", onclick: () => zamknij(box) }, PL.nieTeraz)));
    return box;
  }
  // Jedna linia pod kartą dnia: Zadania dnia (zwijana lista), zadanie tygodnia, duet albo zaproszenie do duetu.
  let liniaOtwarta = null;
  function linia() {
    const ap = A(), { h } = ap; if (!h || W.skrot?.state !== "in") return null;
    const st = zadaniaStan(), duet = duetWiersz(), zapr = duet ? null : zaproszenieDuetu();
    if (!st && !duet && !zapr) return null;
    let zad = null;
    if (st && st.ok && !st.zablokowane && st.wszystkie) {
      const wszystko = st.zrobione >= st.wszystkie;
      const sum = h("summary", { class: "nw-linia-s" }, coin(),
        h("span", { class: "nw-linia-t" }, h("span", { text: wszystko ? fmt(PL.zadWszystkie, st.suma) : st.zrobione ? fmt(PL.zadLinia, st.zrobione, st.wszystkie, st.suma) : fmt(PL.zadLinia0, st.wszystkie, st.pula) }),
          !wszystko && st.godz ? " " : null, !wszystko && st.godz ? h("span", { class: "muted", text: fmt(PL.zadNowe, st.godz) }) : null),
        h("span", { class: "nw-linia-dots", "aria-hidden": "true" }, st.dzienne.map((m) => h("i", { class: m.postep >= m.ile ? "on" : "" }))));
      zad = h("details", { class: "nw-linia-d", open: liniaOtwarta ? true : null, ontoggle: (e) => { liniaOtwarta = e.currentTarget.open; } }, sum,
        h("ul", { class: "nw-zad-l" }, st.dzienne.map((m) => zadWiersz(m)), st.tydz ? zadWiersz(st.tydz, true) : null),
        h("p", { class: "muted nw-zad-auto", text: PL.zadAuto }));
    } else if (st && st.ok && st.zablokowane) zad = h("p", { class: "muted nw-linia-lock", text: PL.zadPelna });
    else if (!st && !duet && !zapr) return null;
    return h("section", { class: "panel sk-panel nw-linia", id: "nw-linia", "aria-label": PL.zadTytul }, zad, duet, zapr);
  }
  function odswiezLinie() {
    const el = document.querySelector("#main .nw-linia"); if (!el) { if (A().S?.route?.view === "home" && ZAD.d?.ok) { try { A().render?.(); } catch (e) {} } return; }
    const nw = linia(); if (nw) el.replaceWith(nw); else el.remove();
  }
  // Dla ekranu końca karty (pętla 3): „Zadania dnia: 2/4 · +16” jako jeden wiersz albo null.
  function zadaniaLinia() {
    const { h } = A(), st = zadaniaStan(); if (!h || !st?.ok || st.zablokowane || !st.wszystkie) return null;
    return h("p", { class: "nw-jutro-t nw-zad-koniec" }, coin(), h("span", { text: st.zrobione >= st.wszystkie ? fmt(PL.zadWszystkie, st.suma) : fmt(PL.zadLinia, st.zrobione, st.wszystkie, st.suma) }));
  }
  // „Twój postęp” (ptsDzis): tempo do najbliższego zaliczenia. cel = tematy do „umiesz” / (tygodnie do terminu − 1, min. 1);
  // k = tematy, które w tym tygodniu przeszły do „umiesz”.
  // shortcut: k liczone od stanu z pierwszego wejścia w tym tygodniu (localStorage), bez historii w bazie; gdy potrzebna
  // dokładność między urządzeniami, zapisać tygodniowy stan w progress.
  function tempo(sid, k, t) {
    if (!sid || !k || !t || t.n == null) return null;
    const ap = A(), pon = L.poniedzialek(today()), key = "skrot-tempo-" + sid;
    let base = null; try { base = JSON.parse(ap.ls?.get(key) || "null"); } catch (e) {}
    if (!base || base.w !== pon) { base = { w: pon, b: k.known }; ap.ls?.set(key, JSON.stringify(base)); }
    const done = Math.max(0, k.known - base.b), left = Math.max(0, k.n - base.b);
    if (!left) return null;
    const tyg = Math.ceil(Math.max(0, t.n) / 7), cel = Math.max(1, Math.ceil(left / Math.max(1, tyg - 1)));
    return cel === 1 ? fmt(PL.tempo1, Math.min(done, 1)) : fmt(PL.tempo, Math.min(done, cel), cel);
  }
  // Przedmiot bez terminu: „Znasz datę kolokwium z X? Wpisz” → to samo pole co w „Przygotuj się” (examSet().date).
  function bezDaty(s, przyWierszu) {
    const ap = A(), { h } = ap; if (!h || !s || !ap.saveExamSet) return null;
    const part = ap.prepPart ? ap.prepPart(s.id, null, "kolokwium") : (ap.partsOf?.(s.id) || ["CW"])[0]; // ta sama część co „Przygotuj się”
    const nazwa = W.SKROT_LANG === "en" && s.en ? s.en : s.pl;
    return h("button", { type: "button", class: "link nw-bezdaty nw-link44", onclick: () => ap.modal((close) => {
      const inp = h("input", { class: "input", type: "date", id: "nw-data", min: ap.todayKey?.(), "aria-label": fmt(PL.bezDatyTytul, nazwa) });
      return [h("h2", { text: fmt(PL.bezDatyTytul, nazwa) }), h("p", { class: "muted", style: "margin:0", text: PL.bezDatyOpis }), inp,
        h("div", { class: "row" },
          h("button", { type: "button", class: "btn primary", style: "min-height:48px", onclick: () => { const v = inp.value; if (!v) { inp.focus(); return; }
            ap.saveExamSet(s.id, part, { date: v }); close(); ap.toast?.(fmt(PL.dataZapisana, ap.fmtKey ? ap.fmtKey(v) : v)); ap.render?.(); } }, PL.zapisz),
          h("button", { type: "button", class: "btn ghost", style: "min-height:48px", onclick: close }, PL.anuluj))];
    }), "aria-label": fmt(PL.bezDatyTytul, nazwa) }, przyWierszu ? PL.bezDaty : fmt(PL.bezDatyZ, nazwa));
  }
  // Starosta: > 3 zaliczenia bez daty → jedna linia z linkiem do Terminów.
  function starostaBezDat() {
    const ap = A(), { h } = ap; if (!h || !ap.S?.isStarosta || !ap.zalUndated) return null;
    let n = 0; try { n = ap.zalUndated().length; } catch (e) {}
    if (n <= 3) return null;
    return h("p", { class: "nw-starosta" }, svg('<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4M12 13v4"/>', 18),
      h("span", { text: fmt(PL.starosta, n) + " " }), h("button", { type: "button", class: "link nw-link44", onclick: () => ap.go({ view: "terms" }) }, PL.terminy));
  }
  // Przewodnik i Profil nauki: tylko w pierwszych 3 dniach konta (pierwszy dzień nauki albo pierwsze wejście na tej przeglądarce).
  // shortcut: bez daty założenia konta z bazy; gdy skrot poda created_at, liczyć od niej.
  function kontoNowe() {
    const ap = A(), t = today(); let od = +(ap.ls?.get("skrot-pierwszy-dzien") || NaN);
    if (!Number.isFinite(od)) { od = t; ap.ls?.set("skrot-pierwszy-dzien", String(t)); }
    const nd = progress().nd || []; const pierwsza = nd.length ? Math.min(...nd) : (progress().streak?.d ?? t) - Math.max(0, (progress().streak?.n || 1) - 1);
    return t - Math.min(od, pierwsza) < 3;
  }
  // „Więcej na dziś”: zwinięty blok z Bossem, Na luzie, Przewodnikiem i nowościami (kolejność bez zmian). Stan otwarcia pamięta
  // przeglądarka. Gdy trwa Boss albo starosta ma coś do zatwierdzenia w nowościach, w podsumowaniu jest krótka podpowiedź.
  function wiecej(items) {
    const ap = A(), { h } = ap, el = (items || []).filter(Boolean); if (!h) return el;
    if (!el.length) return null;
    const boss = el.some((x) => x.matches?.(".bs-card") || x.querySelector?.(".bs-card")), nowe = el.find((x) => x.matches?.(".home-fold"));
    // Nagroda do odebrania (pokonany Boss, pętla 5) nie może czekać w zwiniętym bloku.
    const nagroda = el.some((x) => x.querySelector?.(".bs-claim"));
    const otwarta = nagroda || ap.ls?.get("skrot-wiecej") === "1" || !!nowe?.open;
    return h("details", { class: "panel sk-panel nw-wiecej", open: otwarta ? true : null, ontoggle: (e) => ap.ls?.set("skrot-wiecej", e.currentTarget.open ? "1" : "0") },
      h("summary", { class: "nw-wiecej-s" }, h("span", { class: "nw-wiecej-t", text: PL.wiecej }),
        boss ? h("span", { class: "chip plain nw-wiecej-c", text: PL.wiecejBoss }) : null),
      h("div", { class: "nw-wiecej-b" }, el));
  }
  // Pusty stan Powtórek: obietnica jutra i karta 5 minut.
  function powtorkiPusto() {
    const ap = A(), { h } = ap; if (!h) return null;
    return [h("p", { class: "big", style: "margin:0", text: PL.rvPusto }),
      h("div", { class: "row" },
        h("button", { type: "button", class: "btn primary", style: "min-height:48px", onclick: () => { ap.go({ view: "home" }); setTimeout(() => ap.ldOpen?.("karta"), 50); } }, PL.rvKarta),
        h("button", { type: "button", class: "btn ghost", style: "min-height:48px", onclick: () => ap.go({ view: "materials" }) }, PL.wybierzPrzedmiot))];
  }
  // ---------------------------------------------------------------- ekran „Seria +1” (dla ekranu końca, pętla 3)
  let ekranSesja = null; // dzień, w którym ekran pokazano w tej karcie przeglądarki (kolejne render() rysują go bez konfetti)
  function konfetti(box) {
    if (reduced()) return;
    const c = document.createElement("div"); c.className = "nw-conf"; c.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 28; i++) { const e = document.createElement("i"); e.style.cssText = `left:${i % 2 ? 2 + ((i * 37) % 22) : 76 + ((i * 37) % 22)}%;--d:${(i % 7) * 0.07}s;--x:${((i * 53) % 120) - 60}px;--r:${(i * 97) % 540}deg`; e.className = "c" + (i % 4); c.append(e); }
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
      h("span", { class: "eyebrow nw-seria-h", text: PL.seriaPrzedluzona }),
      h("span", { class: "nw-seria-flame", "aria-hidden": "true" }, ap.kFlame()),
      h("b", { class: "nw-seria-n num", text: String(n) }),
      h("p", { class: "nw-seria-t", text: ap.plural(n, "dzień z rzędu!", "dni z rzędu!", "dni z rzędu!") }),
      h("div", { class: "nw-week", role: "group", "aria-label": PL.tydzienTen }, week.map((c, i) => h("span", { class: "nw-wd" },
        h("i", { class: `nw-dot s-${c.s}${c.dzis ? " dzis" : ""}`, role: "img", "aria-label": fmt(lab[c.s], dzienLabel(c.d)), style: `--i:${i}` }),
        h("small", { "aria-hidden": "true", text: lt[i] })))),
      km ? h("p", { class: "nw-km" }, svg(IKONY["ux2-medal"], 18), h("span", { text: fmt(PL.kamienMilowy, n) })) : null,
      h("p", { class: "nw-jutro", text: fmt(PL.jutroSeria, dni(n + 1)) }),
      naprawaLinia(),
      jutro(),
      kamienieEl(n));
    if (first && km) setTimeout(() => konfetti(box), 250);
    return box;
  }

  // ---------------------------------------------------------------- CSS (paleta H2 przez zmienne; ruch wyłączany przez calm i reduced-motion)
  const CSS = `
.xp-chip.nw-streak { min-height: 44px; min-width: 44px; gap: 6px; }
.xp-chip.nw-streak .nw-word, .xp-chip.nw-streak .nw-risk { white-space: nowrap; }
.xp-chip.nw-streak.streak-todo, .xp-chip.nw-streak.streak-risk { outline: 2px dashed var(--h-muted, var(--muted)); outline-offset: -2px; }
.xp-chip.nw-streak:is(.streak-todo, .streak-risk) :is(.h2-flame, .kflame) { filter: grayscale(1); opacity: .55; }
.xp-chip.nw-streak:is(.streak-todo, .streak-risk) .h2-flame svg { animation: none !important; }
html #main .xp-chip.nw-streak.streak-risk, .xp-chip.nw-streak.streak-risk { background: var(--warn-soft) !important; color: var(--warn) !important; outline-color: var(--warn); }
.xp-chip.nw-streak.streak-risk b { color: inherit; }
.xp-chip.nw-streak .nw-risk { font-weight: 700; }
.nw-ring { display: inline-grid; place-items: center; line-height: 0; flex: none; margin-left: 2px; }
.nw-ring-t { fill: none; stroke: var(--h-edge, var(--line)); stroke-width: 3.2; }
.streak-chroni .nw-ring-t { stroke: color-mix(in srgb, var(--h-blue, var(--accent-text)) 45%, transparent); }
.nw-ring-f { fill: none; stroke: var(--h-acc, var(--accent)); stroke-width: 3.2; stroke-linecap: round; }
.streak-risk .nw-ring-t { stroke: color-mix(in srgb, var(--warn) 25%, transparent); }
.streak-risk .nw-ring-f { stroke: var(--warn); }
.nw-ico { display: inline-grid; place-items: center; line-height: 0; flex: none; }
@media (max-width: 420px) {
  #main .greet .rk-compact .rk-lv { display: none; }
  #main .greet .rk-compact .rk-name { display: inline-block; max-width: 9ch; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; vertical-align: bottom; }
}
/* < 400 px: ranga jako sama odznaka z poziomem (nazwa zostaje dla czytników i w oknie rang), seria i monety w tym samym wierszu */
/* < 400 px: pierwszy wiersz ranga + monety, drugi wiersz to pasek dnia: seria ze stanem po lewej, cel dnia po prawej */
@media (max-width: 399px) {
  #main .greet .rk-compact .rk-chips { display: contents; }
  #main .greet .rk-compact .rk-name { max-width: 14ch; }
  #main .greet .rk-compact .xp-chip.nw-streak { order: 9; flex: 1 0 100%; justify-content: space-between; }
}
.xp-chip.nw-streak .nw-s-l, .xp-chip.nw-streak .nw-s-r { display: inline-flex; align-items: center; gap: 5px; min-width: 0; }
.xp-chip.nw-streak .nw-goal-t { font-size: .8rem; font-weight: 700; white-space: nowrap; }
.xp-chip.nw-streak .nw-s-l { flex: 1 1 auto; }
@media (max-width: 420px) { .xp-chip.nw-streak:is(.streak-chroni, .streak-naprawa, .streak-koniec) .nw-xp { display: none; } .xp-chip.nw-streak:is(.streak-naprawa, .streak-koniec) .nw-word { display: none; } }
.xp-chip.nw-streak .nw-s-r { flex: none; }
.xp-chip.nw-streak.streak-chroni .nw-risk { white-space: normal; text-align: left; line-height: 1.2; }
.xp-chip.nw-streak.streak-chroni { outline: 2px dashed var(--h-blue, var(--accent-text)); outline-offset: -2px; background: var(--h-blue-soft, var(--accent-soft)) !important; color: var(--h-ink, var(--ink)) !important; }
.xp-chip.nw-streak.streak-pauza { outline: 2px dashed var(--h-edge, var(--line)); outline-offset: -2px; }
.xp-chip.nw-streak:is(.streak-chroni, .streak-pauza) .h2-flame svg { animation: none !important; }
.xp-chip.nw-streak:is(.streak-chroni, .streak-pauza) :is(.h2-flame, .kflame) { filter: grayscale(1); opacity: .55; }
.nw-okno-top { margin-top: 10px; }
.nw-okno-n:focus { outline: none; }
.nw-okno-zam { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 6px; margin: -6px 0 0; font-weight: 700; color: var(--h-blue, var(--accent-text)); }
@media (max-width: 420px) { .xp-chip.nw-streak.streak-chroni .nw-word { display: none; } }
.xp-chip.nw-streak.streak-risk :is(.h2-flame, .kflame) { filter: none !important; opacity: 1 !important; }
.xp-chip.nw-streak.streak-risk b { font-size: 1.05em; }
.xp-chip.nw-tyg { min-height: 44px; min-width: 44px; gap: 6px; }
.nw-tyg-dots { display: inline-flex; gap: 3px; }
.nw-tyg-dots i { width: 9px; height: 9px; border-radius: 50%; box-sizing: border-box; background: transparent; box-shadow: inset 0 0 0 2px var(--h-muted, var(--muted)); }
.nw-tyg-dots i.s-nauka { background: var(--h-acc, var(--accent)); box-shadow: none; }
.nw-tyg-dots i.s-zamroz { background: var(--h-blue, var(--accent-text)); box-shadow: none; }
.nw-tyg-dots i.s-przerwa { background: repeating-linear-gradient(135deg, var(--h-muted, var(--muted)) 0 1.5px, transparent 1.5px 3px); box-shadow: inset 0 0 0 1px var(--h-muted, var(--muted)); }
.nw-tyg-dots i.s-przyszly { box-shadow: inset 0 0 0 1.5px var(--h-muted, var(--muted)); opacity: .55; }
.nw-tyg-dots i.dzis.todo { background: var(--warn-soft); box-shadow: inset 0 0 0 2.5px var(--warn); opacity: 1; }
.nw-tyg-t { font-size: .85rem; font-weight: 700; white-space: nowrap; }
/* < 400 px: ranga + monety, pod spodem pasek serii, a „Ten tydzień” w trzecim wierszu tego samego rzędu (nie mieści się obok rangi) */
@media (max-width: 399px) { #main .greet .rk-compact .xp-chip.nw-tyg { order: 10; } }
.nw-powrot { display: grid; gap: 10px; }
.nw-powrot-top { display: flex; align-items: center; gap: 12px; }
.nw-powrot-stas { flex: none; width: 44px; height: 44px; display: grid; place-items: center; }
.nw-powrot-stas > *, .nw-powrot-stas svg { width: 44px !important; height: 44px !important; max-width: 44px; overflow: hidden; }
.nw-powrot-stas { overflow: hidden; border-radius: 50%; }
.nw-pkt { min-height: 44px; padding: 0 10px; font-size: .85rem; }
.nw-powrot-h { font-size: 1.1rem; }
.nw-powrot-h { margin: 0; font-family: var(--dz-head, inherit); font-size: 1.2rem; line-height: 1.25; }
.nw-powrot-pkt { display: flex; flex-wrap: wrap; gap: 6px; }
.nw-pkt { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 0 12px; border: 0; border-radius: 999px; background: var(--sunk, var(--h-line)); color: var(--ink); font: inherit; font-size: .9rem; font-weight: 600; cursor: pointer; }
.nw-pkt-chev { font-weight: 800; }
.nw-powrot-nap.naprawa { background: var(--h-acc-soft, var(--accent-soft)); color: var(--h-ink, var(--ink)); }
.nw-powrot-nap.naprawa .nw-ico { color: var(--h-acc, var(--accent-text)); }
.nw-nap-post { margin-left: auto; padding: 2px 8px; border-radius: 999px; background: var(--h-card, var(--surface)); }
.xp-chip.nw-streak.streak-naprawa { outline: 2px dashed var(--h-acc, var(--accent)) !important; background: var(--h-acc-soft, var(--accent-soft)) !important; color: var(--h-ink, var(--ink)) !important; }
@media (min-width: 700px) { html #main .nw-powrot .btn.primary.nw-powrot-go { width: auto !important; min-width: 280px; justify-self: start; } .nw-powrot-lekko { text-align: left; } }
html #main .nw-powrot .btn.primary.nw-powrot-go { width: 100%; min-height: 52px; border: 0; border-radius: 999px; background: var(--h-lime, var(--accent)); color: var(--h-lime-ink, var(--accent-ink)); font-weight: 800; box-shadow: 0 4px 0 var(--h-lime-edge, var(--accent-strong)); }
.nw-odzyskana { padding-top: 6px; }
.nw-powrot-nap { display: flex; gap: 8px; align-items: flex-start; margin: 0; padding: 10px 12px; border-radius: 14px; background: var(--warn-soft); color: var(--warn); font-weight: 700; }
.nw-powrot-lekko { margin: -4px 0 0; font-size: .85rem; text-align: center; }
.nw-powrot { gap: 10px; }
.nw-powrot.nw-mig { outline: 3px solid var(--h-lime-edge, var(--accent)); outline-offset: 3px; }
.nw-przyp { display: grid; gap: 8px; }
.nw-przyp-h { margin: 0; font-size: 1.1rem; }
.nw-przyp .muted { margin: 0; }
.nw-przyp-btns .btn, .nw-inst .btn { min-height: 48px; }
.nw-link44 { min-height: 44px; min-width: 44px; display: inline-flex; align-items: center; }
.nw-kal { display: flex; gap: 10px; align-items: flex-start; padding: 10px 12px; border-radius: 14px; background: var(--sunk, var(--h-line)); cursor: pointer; }
.nw-kal input { width: 22px; height: 22px; margin: 2px 0 0; flex: none; accent-color: var(--h-acc, var(--accent)); }
.nw-kal span { display: grid; gap: 2px; }
.nw-kal small { font-size: .82rem; }
.nw-inst { display: grid; gap: 8px; }
.nw-inst-h { margin: 0; font-weight: 700; }
.nw-inst-ios { margin: 0; padding-left: 0; list-style: none; display: grid; gap: 6px; }
.nw-inst-ios li { display: flex; gap: 8px; align-items: center; }
.nw-zcard, .nw-oferta { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 10px 12px; align-items: center; padding: 14px 16px; border-radius: 22px; background: var(--h-blue-soft, var(--accent-soft)); color: var(--ink); }
.nw-zcard > .btn, .nw-zcard > .nw-zam-full, .nw-oferta-btns { grid-column: 1 / -1; }
.nw-zcard .btn, .nw-oferta .btn { min-height: 48px; display: inline-flex; align-items: center; gap: 6px; }
.nw-oferta-btns { gap: 8px; }
.nw-coin { display: inline-grid; line-height: 0; vertical-align: middle; }
.nw-coin svg { width: 18px; height: 18px; }
.nw-day.dzis.chroni { outline: 2.5px dashed var(--h-blue, var(--accent-text)); outline-offset: 2px; background: var(--h-blue-soft, var(--accent-soft)); }
.nw-day.mini.dzis.chroni { outline-width: 1.5px; outline-offset: 1px; }
.xp-chip.nw-streak.streak-done .nw-risk { color: var(--h-acc, var(--accent-text)); }
.nw-jutro-t { display: inline-flex; align-items: center; gap: 6px; margin: 0; font-weight: 600; color: var(--muted); }
.nw-day.s-przyszly { box-shadow: inset 0 0 0 1.5px var(--h-edge, var(--line)); }
.nw-okno-modal::before { position: static !important; margin: -6px auto 4px !important; }
.nw-seria-h { color: var(--h-acc, var(--accent-text)); }
.nw-seria > :not(.nw-conf) { position: relative; z-index: 1; }
.xp-chip.nw-streak .nw-klep { color: inherit; opacity: .85; }
.nw-zasady { display: flex; gap: 8px; align-items: flex-start; margin: 0; font-size: .85rem; color: var(--muted); }
.nw-zasady .nw-ico { margin-top: 1px; }
.nw-day.s-brak:not(.s-przyszly) { background: var(--sunk, var(--h-line)); }
.nw-day.dzis.todo { outline: 2.5px dashed var(--warn); outline-offset: 2px; background: var(--warn-soft); }
.nw-day.mini.dzis.todo { outline-width: 1.5px; outline-offset: 1px; }
.nw-baner { position: fixed; left: 0; right: 0; margin: 0 auto; width: fit-content; box-sizing: border-box; bottom: calc(84px + env(safe-area-inset-bottom, 0px)); z-index: 9000; display: flex; align-items: center; gap: 10px; max-width: min(92vw, 440px); padding: 12px 16px; border-radius: 18px; background: var(--h-ink, var(--ink)); color: var(--h-paper, var(--paper)); font-weight: 700; box-shadow: 0 12px 30px -12px rgba(0,0,0,.5); }
.nw-baner .nw-ico { color: var(--h-lime, var(--accent-soft)); }
.nw-baner.w-tresci { position: static; margin: 4px 0 0; width: auto; max-width: none; box-shadow: none; }
.nw-baner-sub { flex-basis: 100%; font-weight: 600; opacity: .9; }
.nw-baner.w-tresci { flex-wrap: wrap; }
.nw-baner-sklep { margin-left: auto; min-height: 44px; padding: 0 14px; border: 0; border-radius: 999px; background: var(--h-lime, var(--accent-soft)); color: var(--h-lime-ink, var(--accent-text)); font: inherit; font-weight: 800; cursor: pointer; white-space: nowrap; }
.xp-chip.nw-streak.streak-koniec { outline: 2px dashed var(--warn); outline-offset: -2px; background: var(--warn-soft) !important; color: var(--warn) !important; }
.nw-baner-x { display: grid; place-items: center; min-width: 44px; min-height: 44px; margin: -8px -10px -8px 0; border: 0; background: none; color: inherit; cursor: pointer; }
.nw-baner.anim { animation: nw-up .35s var(--h-out, ease-out) both; }
@media (prefers-reduced-motion: reduce) { .nw-baner { animation: none !important; } }
html.calm .nw-baner { animation: none !important; }
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
html #main .nw-przyp .btn.primary { min-height: 48px; border: 0; border-radius: 999px; background: var(--h-lime, var(--accent)); color: var(--h-lime-ink, var(--accent-ink)); font-weight: 800; box-shadow: 0 4px 0 var(--h-lime-edge, var(--accent-strong)); padding-inline: 22px; }
.nw-przyp-powod { margin: 0 0 4px; font-weight: 700; }
/* etap 5: linia zadań / duet / tempo / bez daty */
html #main .nw-linia { padding: 6px 14px; display: grid; gap: 0; }
.nw-linia-d > summary { list-style: none; cursor: pointer; }
.nw-linia-d > summary::-webkit-details-marker { display: none; }
.nw-linia-s { display: flex; align-items: center; gap: 8px; min-height: 48px; font-weight: 700; font-size: .95rem; }
.nw-linia-s::after { content: ""; width: 8px; height: 8px; border-right: 2px solid currentColor; border-bottom: 2px solid currentColor; transform: rotate(45deg); margin: -4px 4px 0 auto; flex: none; opacity: .7; }
.nw-linia-d[open] .nw-linia-s::after { transform: rotate(-135deg); margin-top: 4px; }
.nw-linia-t { min-width: 0; line-height: 1.3; }
.nw-linia-t .muted { font-weight: 500; white-space: nowrap; }
.nw-coin { display: inline-flex; flex: none; width: 20px; height: 20px; vertical-align: -4px; }
.nw-coin svg { width: 100%; height: 100%; }
.nw-linia-dots { display: inline-flex; gap: 3px; flex: none; }
@media (max-width: 420px) { .nw-linia-dots { display: none; } }
.nw-linia-dots i { width: 8px; height: 8px; border-radius: 50%; background: var(--line, var(--border)); }
.nw-linia-dots i.on { background: var(--h-lime-edge, var(--accent)); }
.nw-zad-l { list-style: none; margin: 0 0 4px; padding: 0; display: grid; gap: 2px; }
.nw-zad { display: grid; grid-template-columns: 44px 1fr auto; align-items: center; gap: 8px; min-height: 44px; padding: 4px 0; border-top: 1px solid var(--line, var(--border)); }
.nw-zad-n { font-weight: 700; font-size: .9rem; color: var(--muted); text-align: center; }
.nw-zad-ok { color: var(--ok, var(--accent)); justify-self: center; }
.nw-zad-t { display: grid; gap: 2px; min-width: 0; font-size: .95rem; }
.nw-zad.done .nw-zad-t { color: var(--muted); }
.nw-zad-p { display: inline-flex; align-items: center; gap: 2px; font-weight: 700; white-space: nowrap; }
.nw-zad-odeb { font-weight: 500; color: var(--muted); font-size: .85rem; }
.nw-zad-bar { display: block; height: 6px; border-radius: 3px; background: var(--line, var(--border)); overflow: hidden; }
.nw-zad-bar i { display: block; height: 100%; background: var(--h-lime-edge, var(--accent)); border-radius: 3px; }
.nw-zad-auto { margin: 0 0 8px; font-size: .85rem; }
.nw-linia-lock { margin: 10px 0; font-size: .92rem; }
.nw-duet { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 48px; border: 0; border-top: 1px solid var(--line, var(--border)); background: none; color: inherit; font: inherit; text-align: left; padding: 6px 0; cursor: pointer; }
.nw-linia > .nw-duet:first-child, .nw-linia > .nw-zapr:first-child { border-top: 0; }
.nw-duet-t { display: flex; flex-wrap: wrap; column-gap: 6px; flex: 1; min-width: 0; font-weight: 600; }
.nw-duet-k { color: var(--muted); font-weight: 500; }
.nw-duet-k.ok { color: var(--ok, var(--text)); font-weight: 700; }
.nw-zapr { border-top: 1px solid var(--line, var(--border)); padding: 10px 0 6px; display: grid; gap: 8px; }
.nw-zapr-t { display: flex; gap: 10px; align-items: flex-start; margin: 0; }
.nw-zapr-b .btn { min-height: 44px; }
.pz-tempo { display: block; font-size: .85rem; font-weight: 700; color: var(--text); }
html #main .nw-bezdaty { display: inline-flex; align-items: center; min-height: 44px; margin: 2px 0 0; text-align: left; }
.nw-starosta { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; margin: 6px 0 0; font-size: .92rem; }
html.calm .g-strip-ic { animation: none !important; }
html #main .nw-wiecej { padding: 0 14px; }
.nw-wiecej > summary { list-style: none; cursor: pointer; display: flex; align-items: center; gap: 10px; min-height: 52px; font-weight: 800; }
.nw-wiecej > summary::-webkit-details-marker { display: none; }
.nw-wiecej > summary::after { content: ""; width: 8px; height: 8px; border-right: 2px solid currentColor; border-bottom: 2px solid currentColor; transform: rotate(45deg); margin: -4px 4px 0 auto; opacity: .7; }
.nw-wiecej[open] > summary::after { transform: rotate(-135deg); margin-top: 4px; }
.nw-wiecej-b { display: grid; gap: 14px; padding: 0 0 14px; }
.nw-wiecej-b > .home-fold, .nw-wiecej-b > .sk-hero, .nw-wiecej-b > .panel { margin: 0; }
/* K2: chipy pod głównym przyciskiem karty dnia bez ucięcia (zawijanie), lekcje dla Ciebie jedna pod drugą na telefonie */
html #main .ld-hero .ld-links { flex-wrap: wrap !important; overflow: visible !important; mask-image: none !important; -webkit-mask-image: none !important; }
html #main .ld-hero .ld-links > .btn { flex: 0 1 auto; max-width: 100%; white-space: normal; min-height: 44px; }
@media (max-width: 599px) {
  /* Lekcje dla Ciebie jako zwarte wiersze: ikona, rodzaj i przedmiot, tytuł, strzałka (cały wiersz otwiera lekcję). */
  html #main .ld-lessons { display: grid; grid-template-columns: 1fr; overflow: visible; margin: 0; padding: 0; gap: 8px; scroll-snap-type: none; }
  html #main .ld-lessons > .zh-card { position: relative; flex: none; display: grid; grid-template-columns: 40px minmax(0, 1fr) 44px; grid-template-rows: auto auto; align-items: center; column-gap: 12px; row-gap: 2px; padding: 12px 14px; min-height: 0; }
  html #main .ld-lessons > .zh-card > .zh-kind { display: contents; }
  html #main .ld-lessons > .zh-card > .zh-kind > .zh-ico { grid-column: 1; grid-row: 1 / 3; align-self: center; margin: 0; }
  html #main .ld-lessons > .zh-card > .zh-kind > .zh-kt { grid-column: 2; grid-row: 1; min-width: 0; }
  html #main .ld-lessons > .zh-card > h3 { grid-column: 2; grid-row: 2; margin: 0; font-size: 1rem; line-height: 1.25; }
  html #main .ld-lessons > .zh-card > :not(.zh-kind):not(h3):not(.zh-go):not(.ld-links) { display: none; }
  html #main .ld-lessons > .zh-card { padding-bottom: 0; }
  html #main .ld-lessons > .zh-card > .ld-links { grid-column: 2 / -1; grid-row: 3; margin: 0; min-height: 0; position: relative; z-index: 1; }
  html #main .ld-lessons > .zh-card > .ld-links .link, html #main .ld-lessons > .zh-card > .ld-links button { min-height: 44px; padding: 0; font-size: .9rem; }
  html #main .ld-lessons > .zh-card > .zh-go { position: static; grid-column: 3; grid-row: 1 / 3; width: 44px; height: 44px; min-height: 44px; padding: 0; margin: 0; border-radius: 50%; font-size: 0; display: grid; place-items: center; }
  html #main .ld-lessons > .zh-card > .zh-go::before { content: ""; position: absolute; inset: 0; border-radius: inherit; }
  html #main .ld-lessons > .zh-card > .zh-go::after { content: ""; width: 9px; height: 9px; border-top: 2.5px solid currentColor; border-right: 2.5px solid currentColor; transform: translateX(-2px) rotate(45deg); }
  /* Karta dnia: kroki („1 min Fiszki · …”) w jednej zwartej linii, tytuł mniejszy. */
  html #main .ld-hero .zh-steps { gap: 4px 6px; }
  html #main .ld-hero .zh-step { padding: 6px 10px; font-size: .85rem; gap: 4px; }
  html #main .ld-hero h1, html #main .ld-hero h2 { font-size: clamp(1.5rem, 7vw, 1.9rem); line-height: 1.1; }
  /* Twój postęp: kafelki terminów niższe. */
  html #main .pz-tile { padding: 8px 4px; }
  html #main .pz-days { width: 42px; height: 42px; margin-bottom: 0; }
  html #main .nw-bezdaty { margin: -4px 0 0 18px; }
}

@media (prefers-reduced-motion: reduce) { .g-strip-ic { animation: none !important; } }
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

  W.ZD_NAWYK = Object.assign(W.ZD_NAWYK || {}, { L, PL, fmt, pigulka, oknoSerii, ekranSerii, celDnia, ring, stanTeraz, przerwa, kalendarzEl, poXp, odswiezPigulki, seriaNastepna, seriaZywa, zamrozDni, baner, kontekstSerii, ponow, prezent, jutro, ofertaPrzypomnienia, kartaPrzypomnieniaDzis, przelacznikKalendarza, ofertaInstalacji, godzinaPrzypomnienia, kartaZamrozenia, ofertaZamrozenia, tydzienMini, kartaPowrotu, przerwaDni, startPowrotu, powrotAktywny, oknoOdzyskana, maKartePowrotu, naprawaLinia, dniSeriiZywej, przypOpisTermin, postepOffline, linia, zadaniaStan, zadaniaLinia, zadaniaLaduj, duetWiersz, zaproszenieDuetu, tempo, bezDaty, starostaBezDat, kontoNowe, powtorkiPusto, wiecej });
  // Bez sieci logowanie się nie kończy (S.uid puste), więc S.progress jest puste i Dziś pokazałoby „0 dni”. Wtedy (tylko do
  // pokazania) bierzemy ostatni postęp zapisany w tej przeglądarce (bm-progress-<uid>, ten sam zapis co progLocal w index.html).
  let offlinePokazany = false;
  function postepOffline() {
    const ap = A(), S = ap.S; if (!S || S.uid || offlinePokazany) return false;
    if (W.skrot?.state !== "error" && navigator.onLine !== false) return false;
    if (S.progress?.streak || S.progress?.xp) return false;
    let best = null;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i); if (!k || !k.startsWith("bm-progress-") || k === "bm-progress-anon") continue;
        const v = JSON.parse(localStorage.getItem(k) || "null")?.data; if (!v) continue;
        const d = Math.max(v.streak?.d || 0, v.xp?.d || 0);
        if (!best || d > best.d) best = { d, v };
      }
    } catch (e) {}
    if (!best) return false;
    offlinePokazany = true; S.progress = { ...best.v, ...(S.progress || {}) };
    try { ap.render?.(); } catch (e) {}
    setTimeout(() => baner("snow", PL.offline, 5000), 300);
    return true;
  }
  // Stan dnia zmienia się z czasem (18:00 → „do północy”, północ → nowy dzień): co minutę i po powrocie do karty.
  let stanKey = null;
  function tik() {
    const ap = A(); if (!ap.S || !document.querySelector(".nw-streak")) return;
    const s = stanTeraz(), k = s.t + ":" + s.stan;
    if (stanKey && stanKey.split(":")[0] !== String(s.t)) { stanKey = k; try { ap.render?.(); } catch (e) {} return; }
    if (k !== stanKey) { stanKey = k; odswiezPigulki(); }
  }
  setInterval(() => { tik(); ponow(); if ((A().streakN?.() || 0) >= 2) prezent(); }, 60000);
  setTimeout(ponow, 4000);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") tik(); });
  W.ZD_NAWYK.tik = tik;
  { let i = 0; const sp = () => { if (!postepOffline() && ++i < 40) setTimeout(sp, 500); }; setTimeout(sp, 500); W.addEventListener("offline", () => setTimeout(postepOffline, 1500)); }
  // Service worker (sw.js): https albo localhost/127.0.0.1 (lokalnie tylko z ?sw=on albo skrot-sw=1, żeby zwykłe testy
  // Playwright nie dostawały pamięci podręcznej); ?sw=off wyrejestrowuje i kasuje pamięci.
  if ("serviceWorker" in navigator) {
    let q = null; try { q = new URLSearchParams(location.search).get("sw"); } catch (e) {}
    const lokalnie = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
    let flaga = null; try { if (q === "on") localStorage.setItem("skrot-sw", "1"); flaga = localStorage.getItem("skrot-sw"); } catch (e) {}
    if (q === "off") {
      try { localStorage.removeItem("skrot-sw"); } catch (e) {}
      try { navigator.serviceWorker.controller?.postMessage("zdawalni-sw-off"); } catch (e) {}
      navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => { try { r.active?.postMessage("zdawalni-sw-off"); } catch (e) {} r.unregister(); })).catch(() => {});
      if (W.caches) caches.keys().then((ks) => ks.filter((k) => k.startsWith("zdawalni-sw-")).forEach((k) => caches.delete(k))).catch(() => {});
    } else if (location.protocol === "https:" || (lokalnie && flaga === "1")) {
      const reg = () => navigator.serviceWorker.register("sw.js").catch(() => {});
      if (document.readyState === "complete") reg(); else W.addEventListener("load", reg);
    }
  }
  // Link z maila „powrót” (?wracam=1): karta powrotu na Dziś przez resztę dnia, przewinięcie do niej i adres bez parametru.
  if (wracamZLinku()) {
    try { A().ls?.set("skrot-wracam", String(today())); } catch (e) {}
    const pokaz = (i = 0) => { const el = document.querySelector("#main .nw-powrot"); if (el) { el.scrollIntoView({ block: "center" }); el.classList.add("nw-mig"); setTimeout(() => el.classList.remove("nw-mig"), 2500); el.querySelector(".nw-powrot-go")?.focus({ preventScroll: true }); try { const u = new URL(location.href); u.searchParams.delete("wracam"); history.replaceState(history.state, "", u.pathname + u.search + u.hash); } catch (e) {} } else if (i < 40) setTimeout(() => pokaz(i + 1), 250); };
    setTimeout(pokaz, 300);
  }
  // Link z maila „zadanie” (?zadania=1#/): rozwinięta linia zadań na Dziś, przewinięcie do niej i adres bez parametru.
  let zq = null; try { zq = new URLSearchParams(location.search).get("zadania"); } catch (e) {}
  if (zq === "1") {
    liniaOtwarta = true;
    const pokaz = (i = 0) => { const el = document.querySelector("#main .nw-linia"); const d = el?.querySelector("details");
      if (d) { d.open = true; el.scrollIntoView({ block: "center" }); el.classList.add("nw-mig"); setTimeout(() => el.classList.remove("nw-mig"), 2500);
        try { const u = new URL(location.href); u.searchParams.delete("zadania"); history.replaceState(history.state, "", u.pathname + u.search + u.hash); } catch (e) {} }
      else if (i < 60) setTimeout(() => pokaz(i + 1), 250); };
    setTimeout(pokaz, 300);
  }
  // Aplikacja mogła już narysować ekran ze starą pigułką (plik wczytuje się po niej).
  try { A().render?.(); } catch (e) {}
})();
