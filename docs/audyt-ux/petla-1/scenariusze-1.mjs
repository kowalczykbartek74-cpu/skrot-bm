// Etap 1 – pierwszy ekran i jedna ścieżka do próby: ekrany, przejścia, przewijanie i ruch dla pomiary.mjs.
const email = async (p, clock) => {
  await p.fill("#skrot-login-email", "nowy@stud.usz.edu.pl");
  await p.click("#loginBox form button[type=submit]");
  if (clock) await p.clock.runFor(600); else await p.waitForSelector("#skrot-login-code");
};
const W = [["cta „Zacznij 3 dni”", "#loginBox .lg-trial .btn.primary"], ["nagłówek (telefon)", "#login .lg-intro h1"], ["nagłówek (komputer)", "#login .lg-side h1"]];
export default {
  opis: "Etap 1: logowanie od góry bez skoków, jeden główny przycisk „Zacznij 3 dni za darmo”, Staś, ciemny wariant (prefers-color-scheme: dark), ikona play, propozycja próby po pierwszym logowaniu, pasek „Masz jeszcze 3 dni za darmo” na Dziś, komunikat limitu i „Wyślij ponownie”, teksty EN.",
  ekrany: [
    { nazwa: "logowanie", konto: "brak", jezyki: ["pl", "en"], root: "#login", widoczne: W },
    { nazwa: "logowanie-bez-grupy", konto: "brak", ls: { "bm-group": "" }, rozmiary: [[390, 844], [1280, 900]], root: "#login", widoczne: W.slice(1) },
    { nazwa: "logowanie-tryb-proby", konto: "brak", ls: { "skrot-trial": "1" }, rozmiary: [[390, 844]], jezyki: ["pl", "en"], root: "#login", cala: false },
    { nazwa: "kod-tryb-proby", konto: "brak", ls: { "skrot-trial": "1" }, rozmiary: [[390, 844], [1280, 900]], jezyki: ["pl", "en"], root: "#login", akcja: (p) => email(p), cala: false },
    { nazwa: "kod-po-60s", konto: "brak", clock: true, rozmiary: [[360, 640], [390, 844]], jezyki: ["pl", "en"], root: "#login", akcja: async (p) => { await email(p, true); await p.clock.runFor(61000); }, po: 0 },
    { nazwa: "blad-limitu", konto: "brak", ls: { "mock-otp-blad": "rate" }, rozmiary: [[390, 844]], jezyki: ["pl", "en"], root: "#login", akcja: async (p) => { await p.fill("#skrot-login-email", "a@stud.usz.edu.pl"); await p.click("#loginBox form button[type=submit]"); }, cala: false },
    { nazwa: "arkusz-proby", konto: "darmowe", ls: { "skrot-z-logowania": "1" }, jezyki: ["pl", "en"], root: "#layer", widoczne: [["arkusz", ".uxw-sheet"], ["„Tak, zaczynam 3 dni”", ".uxw-sheet .btn.primary"]], cala: false },
    { nazwa: "dzis-darmowe", konto: "darmowe", jezyki: ["pl", "en"], root: "#main", widoczne: [["pasek „Masz jeszcze 3 dni”", ".uxw-pasek"], ["„Włącz”", ".uxw-pasek-b"]] },
    { nazwa: "dzis-platne-bez-paska", konto: "platne", rozmiary: [[390, 844]], root: "#main", widoczne: [["pasek (ma go nie być)", ".uxw-pasek"]], cala: false },
  ],
  przejscia: [
    { nazwa: "nowa-osoba-proba", opis: "konto brak, grupa wybrana: „Zacznij 3 dni za darmo” → e-mail → kod (przycisk „Zacznij 3 dni za darmo”)", konto: "brak", kroki: [
      { opis: "ekran wejścia (od góry, bez fokusu)", stan: () => ({ y: scrollY, fokus: document.activeElement?.id || document.activeElement?.tagName }) },
      { opis: "klik „Zacznij 3 dni za darmo” → formularz e-mail w trybie próby", zrob: (p) => p.click("#loginBox .lg-trial .btn.primary"), stan: () => ({ h2: document.querySelector("#loginBox h2")?.textContent, przycisk: document.querySelector("#loginBox form button")?.textContent, fokus: document.activeElement?.id }) },
      { opis: "wpisany e-mail i „Wyślij kod i zacznij” → krok kodu", zrob: (p) => email(p), stan: () => ({ przycisk: document.querySelector("#loginBox form button")?.textContent, notka: document.querySelector(".lg-trial-note")?.textContent, ponownie: document.querySelector(".lg-resend")?.textContent }) },
      { opis: "wpisany kod → logowanie (znacznik skrot-z-logowania)", zrob: (p) => p.fill("#skrot-login-code", "123456"), czekaj: 500, stan: () => ({ z_logowania: localStorage.getItem("skrot-z-logowania"), proba: localStorage.getItem("skrot-trial") }) },
    ] },
    { nazwa: "darmowe-arkusz-tak", opis: "konto darmowe po pierwszym logowaniu z pełnego ekranu: arkusz → „Tak, zaczynam 3 dni” → powitanie próby", konto: "darmowe", ls: { "skrot-z-logowania": "1" }, wait: 2500, kroki: [
      { opis: "arkusz „Włączyć teraz 3 dni pełnego dostępu?”", stan: () => ({ h2: document.querySelector(".uxw-sheet h2")?.textContent, fokus: document.activeElement?.textContent }) },
      { opis: "klik „Tak, zaczynam 3 dni” → próba i powitanie", zrob: (p) => p.click(".uxw-sheet .btn.primary"), czekaj: 3500, stan: () => ({ konto: localStorage.getItem("mock-konto"), h2: document.querySelector("#layer .modal h2")?.textContent }) },
    ] },
    { nazwa: "darmowe-arkusz-pozniej", opis: "konto darmowe: arkusz → „Później…” → Dziś z paskiem; po przeładowaniu bez arkusza", konto: "darmowe", ls: { "skrot-z-logowania": "1" }, wait: 2500, kroki: [
      { opis: "arkusz", stan: () => !!document.querySelector(".uxw-sheet") },
      { opis: "klik „Później, zostawię na kolokwium” → Dziś z paskiem", zrob: (p) => p.click(".uxw-sheet .btn.ghost"), stan: () => ({ arkusz: !!document.querySelector(".uxw-sheet"), pasek: document.querySelector(".uxw-pasek")?.innerText }) },
      { opis: "przeładowanie → bez arkusza, pasek zostaje", zrob: (p) => p.reload(), czekaj: 2500, stan: () => ({ arkusz: !!document.querySelector(".uxw-sheet"), pasek: document.querySelector(".uxw-pasek")?.innerText }) },
    ] },
    { nazwa: "darmowe-pasek-wlacz", opis: "konto darmowe bez znacznika: pasek na Dziś → „Włącz” → próba", konto: "darmowe", wait: 2500, kroki: [
      { opis: "Dziś z paskiem", stan: () => document.querySelector(".uxw-pasek")?.innerText },
      { opis: "klik „Włącz” → próba i powitanie", zrob: (p) => p.click(".uxw-pasek-b"), czekaj: 3500, stan: () => ({ konto: localStorage.getItem("mock-konto"), h2: document.querySelector("#layer .modal h2")?.textContent }) },
    ] },
    { nazwa: "kod-wyslij-ponownie", opis: "krok kodu: odliczanie 60 s → notka o spamie i „Wyślij ponownie” → nowy kod", konto: "brak", clock: true, kroki: [
      { opis: "e-mail wysłany, krok kodu (odliczanie)", zrob: (p) => email(p, true), czekaj: 0, stan: () => ({ ponownie: document.querySelector(".lg-resend")?.textContent, aktywny: !document.querySelector(".lg-resend")?.disabled }) },
      { opis: "po 61 s: notka i aktywne „Wyślij ponownie”", zrob: (p) => p.clock.runFor(61000), czekaj: 0, stan: () => ({ notka: document.querySelector(".lg-resend-note.on")?.textContent, ponownie: document.querySelector(".lg-resend")?.textContent, aktywny: !document.querySelector(".lg-resend")?.disabled }) },
      { opis: "klik „Wyślij ponownie” → komunikat i nowe odliczanie", zrob: async (p) => { await p.click(".lg-resend"); await p.clock.runFor(600); }, czekaj: 0, stan: () => ({ komunikat: document.querySelector(".lg-resend-msg")?.textContent, ponownie: document.querySelector(".lg-resend")?.textContent, wyslano: window.__otp }) },
    ] },
  ],
  przewijanie: [{ nazwa: "logowanie", konto: "brak" }, { nazwa: "logowanie-bez-grupy", konto: "brak", ls: { "bm-group": "" } }, { nazwa: "dzis-darmowe", konto: "darmowe" }, { nazwa: "arkusz-proby", konto: "darmowe", ls: { "skrot-z-logowania": "1" } }],
  ruch: [
    { nazwa: "logowanie", konto: "brak", elementy: ["#login .lg-trial", "#login .lg-trial .btn.primary", "#login .lg-intro > .stas-face", "#loginBox form", "#login .lg-demo"] },
    { nazwa: "arkusz-proby", konto: "darmowe", ls: { "skrot-z-logowania": "1" }, wait: 2500, elementy: [".uxw-sheet", ".uxw-sheet .btn.primary"] },
  ],
};
