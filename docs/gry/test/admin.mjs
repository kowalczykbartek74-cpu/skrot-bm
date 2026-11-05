// Etap 11 specu „Systemy z Zdawalni w Skrócie”: panel administratora (admin.js, SQL v38, atrapa bazy).
//   A. źródło wejścia ?z=: pierwsze źródło wizyty zostaje (sessionStorage), trafia do listy oczekujących,
//   B. … do konta i okresu próbnego (nauka_zrodlo_ustaw przed nauka_proba_start) i do zakupu (client_reference_id), obok kodu polecającego,
//   C. karnety: wiersz w Narzędziach starosty tylko dla administratora, walidacja, wydanie, odmowa przy opłaconym dostępie, cofnięcie,
//   D. podgląd jako (płatny + inny rocznik, gość): pasek, wybór rocznika z localStorage nietknięty, ŻADNYCH zapisów (quiz, postęp,
//      zdarzenia, RPC, tabela, licznik wejść), „Zakończ podgląd”; nie-admin z ręcznie wpisanym podglądem go traci,
//   E. lejek według źródła (dwa testowe źródła) i generator linków,
//   F. EN + zrzuty 375/1280.
// BASE=http://127.0.0.1:8811/ node docs/gry/test/admin.mjs
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 700)]);
const UID = "00000000-0000-4000-8000-000000000001";
const ZARZ = "wefiz-zarz-1-st-2026";
const rpcs = (p, fn) => p.evaluate((fn) => window.__rpc.filter((r) => !fn || r.fn === fn), fn);
const toasts = (p) => p.evaluate(() => [...document.querySelectorAll(".toast")].map((t) => t.textContent).join(" | "));
// Drugi rocznik tylko w teście (dziś strona ma jeden): kopia BM jako „Zarządzanie”.
async function zDrugimRocznikiem(p) {
  await p.context().route(/\/rocznik\.js/, async (r) => {
    const res = await r.fetch(); let body = await res.text();
    body = body.replace('var DOMYSLNY = "wefiz-bm-1-st-2026";', `var DOMYSLNY = "wefiz-bm-1-st-2026";
  ROCZNIKI["${ZARZ}"] = Object.assign({}, ROCZNIKI[DOMYSLNY], { kierunek: { kod: "ZARZ", pl: "Zarządzanie", en: "Management" }, teams: false, zasadyZaliczen: false });`);
    r.fulfill({ response: res, body });
  });
}

// ---------- A: źródło wizyty i lista oczekujących ----------
{
  const p = await page(b, { konto: "brak", w: 375, h: 812 });
  const zapisy = [];
  await p.route(/functions\/v1\/zapisz-sie/, (r) => { zapisy.push(JSON.parse(r.request().postData() || "{}")); r.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true, message: "Sprawdź skrzynkę." }) }); });
  await p.goto(BASE + "index.html?z=ig-test"); await p.waitForTimeout(1500);
  ok("A: pierwsze źródło w sessionStorage", (await p.evaluate(() => sessionStorage.getItem("skrot-zrodlo"))) === "ig-test");
  await p.goto(BASE + "index.html?z=plakat-test&zapisz=plan"); await p.waitForTimeout(1200);
  ok("A: drugi link w tej samej wizycie nie zmienia pierwszego źródła", (await p.evaluate(() => [sessionStorage.getItem("skrot-zrodlo"), window.SKROT_ADMIN.zrodloWizyty()])).join() === "ig-test,ig-test");
  // lista oczekujących (link ?zapisz= otwiera formularz od razu)
  await p.selectOption("#lk-kier", "~"); await p.fill("#lk-kt", "Psychologia, WNS");
  await p.fill("#lk-mail", "ola@stud.usz.edu.pl"); await p.check("#lk-zg");
  await p.click('[data-a="zapisz"]'); await p.waitForTimeout(800);
  ok("A: zapis na listę oczekujących ze źródłem pierwszej wizyty", zapisy.length === 1 && zapisy[0].zrodlo === "ig-test", zapisy);
  ok("A: bez błędów", !p.errors.length, p.errors);
  await p.context().close();
}

// ---------- B: konto, okres próbny, zakup ----------
{
  const p = await page(b, { konto: "darmowe", w: 375, h: 812 });
  await p.goto(BASE + "index.html?z=plakat-cukrowa"); await p.waitForTimeout(2500);
  let r = await rpcs(p, "nauka_zrodlo_ustaw");
  ok("B: po zalogowaniu źródło wizyty idzie raz do nauka_zrodlo_ustaw", r.length === 1 && r[0].args.p_zrodlo === "plakat-cukrowa", r);
  await p.evaluate(() => { window.skrot.startTrial(); }).catch(() => {}); await p.waitForTimeout(3000);
  const st = await p.evaluate(() => ({ trial: window.skrot.trialUntil, wyslane: sessionStorage.getItem("skrot-zrodlo-konto"), znowu: window.__rpc.filter((r) => r.fn === "nauka_zrodlo_ustaw").length }));
  ok("B: okres próbny włączony po zapisaniu źródła wizyty (próba bierze je w bazie), bez drugiego zapisu źródła", !!st.trial && st.wyslane === "plakat-cukrowa" && st.znowu === 0, st);
  await p.context().close();
  // zakup: client_reference_id z kodem polecającym i źródłem
  const q = await page(b, { konto: "darmowe", w: 375, h: 812 });
  const stripe = [];
  await q.context().route(/buy\.stripe\.com/, (rt) => { stripe.push(rt.request().url()); rt.fulfill({ contentType: "text/html", body: "<p>stripe</p>" }); });
  await q.goto(BASE + "index.html?z=ig-zarzadzanie"); await q.waitForTimeout(2200);
  await q.evaluate(() => window.skrot.buy("rok")); await q.waitForTimeout(500);
  await q.locator(".modal input[type=checkbox]").nth(0).check(); await q.locator(".modal input[type=checkbox]").nth(1).check();
  await q.click(".modal .btn.primary"); await q.waitForTimeout(1500);
  const ref = stripe.length ? new URL(stripe[0]).searchParams.get("client_reference_id") : null;
  ok("B: zakup: client_reference_id = konto____źródło (bez kodu)", ref === `${UID}____ig-zarzadzanie`, stripe);
  await q.context().close();
}

// ---------- C: karnety ----------
async function adminPage(w, h, lang = "pl", extra = {}) {
  const p = await page(b, { konto: "starosta", w, h, lang, ls: { "bm-starosta": "1", ...extra } });
  await p.clock.install({ time: new Date("2026-11-05T10:00:00") });
  return p;
}
for (const [w, h] of [[375, 812], [1280, 900]]) {
  const p = await adminPage(w, h, "pl", { "mock-platni": "zaplacil@x.pl", "mock-karnety": JSON.stringify([{ email: "stary@x.pl", do_kiedy: "2026-10-01", powod: "Test w październiku", wydano_at: "2026-09-01T10:00:00Z", konto: true }]) });
  await p.goto(BASE + "index.html#/starosta"); await p.waitForTimeout(2500);
  const rows = await p.locator("button.more-row").allTextContents();
  ok(`${w} C: wiersze Karnety, Podgląd jako, Linki ze źródłem`, ["Karnety", "Podgląd jako", "Linki ze źródłem"].every((t) => rows.some((r) => r.includes(t))), rows);
  await p.locator("button.more-row", { hasText: "Karnety" }).click(); await p.waitForTimeout(800);
  ok(`${w} C: lista z bazy (wygasły karnet)`, /stary@x\.pl[\s\S]*wygasł/.test(await p.locator("main").innerText()));
  await p.click("button:has-text('Wydaj karnet')"); await p.waitForTimeout(300);
  ok(`${w} C: pusty formularz → błąd e-maila, fokus w polu`, /poprawny adres e-mail/.test(await p.locator(".notice.err").innerText()) && (await p.evaluate(() => document.activeElement?.id)) === "kar-email");
  await p.fill("#kar-email", "zaplacil@x.pl"); await p.fill("#kar-powod", "Pomoc przy testach");
  await p.click("button:has-text('Wydaj karnet')"); await p.waitForTimeout(500);
  ok(`${w} C: opłacony dostęp → odmowa z datą (karnet niczego nie nadpisuje)`, /opłacony dostęp do 11\.07\.2027/.test(await p.locator(".notice.err").innerText()));
  await p.fill("#kar-email", "Ala@stud.usz.edu.pl"); await p.click("button:has-text('90 dni')"); await p.fill("#kar-powod", "Pomoc przy testach lekcji");
  await p.click("button:has-text('Wydaj karnet')"); await p.waitForTimeout(800);
  const wyd = (await rpcs(p, "nauka_admin_karnet_wydaj")).pop();
  ok(`${w} C: wydanie: e-mail małymi literami, data +90 dni, powód`, wyd?.args.p_email === "ala@stud.usz.edu.pl" && wyd.args.p_do === "2027-02-03" && wyd.args.p_powod === "Pomoc przy testach lekcji", wyd);
  ok(`${w} C: komunikat i karnet na liście jako aktywny`, /Karnet wydany: ala@stud\.usz\.edu\.pl, do 03\.02\.2027/.test(await p.locator(".notice.ok").innerText())
    && /ala@stud\.usz\.edu\.pl[\s\S]*aktywny/.test(await p.locator(".adm-list").innerText()));
  await shot(p, `adm-karnety-${w}`);
  await p.locator('.adm-row[data-email="ala@stud.usz.edu.pl"] button', { hasText: "Cofnij karnet" }).click(); await p.waitForTimeout(300);
  await shot(p, `adm-karnet-cofnij-${w}`);
  await p.click(".modal button:has-text('Cofnij karnet')"); await p.waitForTimeout(800);
  ok(`${w} C: cofnięcie → stan „cofnięty”, bez przycisku`, /ala@stud\.usz\.edu\.pl[\s\S]*cofnięty/.test(await p.locator(".adm-list").innerText())
    && (await p.locator('.adm-row[data-email="ala@stud.usz.edu.pl"] button').count()) === 0);
  const sizes = await p.evaluate(() => [...document.querySelectorAll("main .adm-form button, main .adm-form input, main .adm-form select, main .adm-row button")].filter((e) => e.offsetParent).map((e) => Math.round(e.getBoundingClientRect().height)));
  ok(`${w} C: cele dotyku ≥ 44 px`, sizes.every((x) => x >= 44), sizes);
  ok(`${w} C: bez przewijania w bok`, await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  ok(`${w} C: bez błędów`, !p.errors.length, p.errors);
  await p.context().close();
}
// student nie widzi wierszy ani ekranu
{
  const p = await page(b, { konto: "platne", w: 375, h: 812 });
  await p.goto(BASE + "index.html#/karnetyAdmin"); await p.waitForTimeout(2000);
  ok("C: student: ekran karnetów tylko dla administratora", /tylko dla administratora/.test(await p.locator("main").innerText()));
  await p.goto(BASE + "index.html#/podgladAdmin"); await p.waitForTimeout(1200);
  ok("C: student: podgląd tylko dla administratora", /tylko dla administratora/.test(await p.locator("main").innerText()));
  await p.context().close();
}

// ---------- D: podgląd jako ----------
const SID = "ochrona-wlasnosci-intelektualnej", now = Date.now();
const quiz = (n, tag) => Array.from({ length: n }, (_, i) => ({ q: `${tag}: question ${i + 1}?`, options: ["A" + i, "B" + i, "C" + i, "D" + i], correct: i % 4 }));
const DOCS = { materials: { o1: { subjectId: SID, title: "Topic 1", quizCount: 8, flashcardCount: 0, createdAt: now - 1e6, v: 2, source: "sylabus" } },
  materialContent: { o1: { v: 2, tldr: "T1", quiz: quiz(8, "T1"), flashcards: [] } } };
for (const [w, h] of [[375, 812], [1280, 900]]) {
  const p = await page(b, { konto: "starosta", w, h, ls: { "bm-starosta": "1", "skrot-rocznik": "wefiz-bm-1-st-2026", "mock-docs": JSON.stringify(DOCS) } });
  await zDrugimRocznikiem(p);
  await p.goto(BASE + "index.html#/podgladAdmin"); await p.waitForTimeout(2500);
  ok(`${w} D: drugi rocznik do wyboru`, (await p.locator("#pg-rocznik option").allTextContents()).some((t) => /Zarządzanie, 1\. rok/.test(t)));
  await p.click("button.adm-tryb:has-text('Płatny dostęp')"); await p.selectOption("#pg-rocznik", ZARZ);
  await shot(p, `adm-podglad-wybor-${w}`);
  await p.click("button:has-text('Zacznij podgląd')"); await p.waitForTimeout(3000);
  const st = await p.evaluate(() => ({ rok: window.SKROT_ROCZNIK.id, ls: localStorage.getItem("skrot-rocznik"), admin: window.skrot.admin, real: window.skrot.realAdmin, paid: window.skrot.paid,
    bar: document.getElementById("pg-bar")?.innerText || "", wiersz: [...document.querySelectorAll("button.more-row")].some((b) => /Karnety/.test(b.textContent)) }));
  ok(`${w} D: pasek „Podgląd: Płatny dostęp · Zarządzanie, 1. rok” z „Zakończ podgląd”`, /Podgląd: Płatny dostęp · Zarządzanie, 1\. rok/.test(st.bar) && /Zakończ podgląd/.test(st.bar), st);
  ok(`${w} D: inny rocznik tylko w tej karcie, wybór w localStorage bez zmian`, st.rok === ZARZ && st.ls === "wefiz-bm-1-st-2026", st);
  ok(`${w} D: w podglądzie konto płatne, nie administrator`, st.paid && !st.admin && st.real, st);
  ok(`${w} D: samo wejście w podglądzie nie pokazuje komunikatu o blokadzie (tła nie wysyłamy)`, !/Podgląd: nic nie zapisujemy/.test(await toasts(p)), await toasts(p));
  ok(`${w} D: ramka podglądu na ekranie`, await p.evaluate(() => !!document.querySelector(".pg-frame")));
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(200);
  await shot(p, `adm-podglad-pasek-${w}`);
  // zapisy: quiz, zdarzenia nauki, RPC, tabela, licznik wejść
  const przed = await p.evaluate((u) => ({ prog: localStorage.getItem("mock-progress"), local: localStorage.getItem("bm-progress-" + u), lq: localStorage.getItem("bm-learn-q"), kop: localStorage.getItem("skrot:kopia:zapisy"), n: window.__rpc.length }), UID);
  await p.goto(BASE + "index.html#/material/o1"); await p.waitForTimeout(2500);
  await p.getByRole("button", { name: /Quiz/ }).first().click();
  await p.getByRole("button", { name: /Zaczynamy/ }).click(); await p.waitForTimeout(700);
  await p.locator(".lp-opts .opt").first().click(); await p.waitForTimeout(700);
  const tst = await toasts(p);
  await p.waitForTimeout(3000); // progSoon czeka 2,5 s
  const proby = await p.evaluate(async () => {
    const a = await window.skrot.sb.rpc("nauka_rp_odpowiedz", { p_klucz: "x" });
    const t = await window.skrot.sb.from("nauka_docs").upsert({ kolekcja: "progress", id: "x", data: {} });
    const u = await window.skrot.sb.from("nauka_docs").update({ data: {} }).eq("kolekcja", "progress").eq("id", "x");
    window.skrot.learn.track("activity", { kind: "test" });
    return [a.error?.code, t.error?.code, u.error?.code];
  });
  const po = await p.evaluate((u) => ({ prog: localStorage.getItem("mock-progress"), local: localStorage.getItem("bm-progress-" + u), lq: localStorage.getItem("bm-learn-q"), kop: localStorage.getItem("skrot:kopia:zapisy"),
    zapisy: window.__rpc.map((r) => r.fn).filter((f) => !window.SKROT_ADMIN.zapisDozwolony(f)) }), UID);
  ok(`${w} D: odpowiedź w quizie: żadnego RPC zapisu (nauka_rp_*, zdarzenia, wejście, logowanie, rocznik)`, po.zapisy.length === 0, po.zapisy);
  ok(`${w} D: postęp bez zmian w bazie i w przeglądarce, bez kolejek`, po.prog === przed.prog && po.local === przed.local && po.lq === przed.lq && po.kop === przed.kop, { przed, po });
  ok(`${w} D: bezpośrednie zapisy (RPC, upsert, update) zablokowane`, proby.every((c) => c === "podglad"), proby);
  ok(`${w} D: komunikat „Podgląd: nic nie zapisujemy.” po odpowiedzi`, /Podgląd: nic nie zapisujemy/.test(tst), tst);
  await p.goto(BASE + "index.html#/home"); await p.waitForTimeout(1500);
  await p.click("#pg-bar button:has-text('Zakończ podgląd')"); await p.waitForTimeout(3000);
  const end = await p.evaluate(() => ({ rok: window.SKROT_ROCZNIK.id, pg: sessionStorage.getItem("skrot-podglad"), admin: window.skrot.admin, bar: !!document.getElementById("pg-bar"), view: location.hash }));
  ok(`${w} D: „Zakończ podgląd” → prawdziwe konto i rocznik, bez paska, z powrotem w Narzędziach`, end.rok === "wefiz-bm-1-st-2026" && !end.pg && end.admin && !end.bar && end.view === "#/starosta", end);
  ok(`${w} D: bez błędów`, !p.errors.length, p.errors);
  await p.context().close();
}
// gość: konto bez dostępu (kłódki, „Wypróbuj” nic nie zapisuje)
{
  const p = await page(b, { konto: "starosta", w: 375, h: 812, ls: { "bm-starosta": "1" } });
  await p.goto(BASE + "index.html#/podgladAdmin"); await p.waitForTimeout(2200);
  await p.click("button:has-text('Zacznij podgląd')"); await p.waitForTimeout(3000);
  const st = await p.evaluate(() => ({ paid: window.skrot.paid, can: window.skrot.trialCan, bar: document.getElementById("pg-bar")?.innerText || "" }));
  ok("D gość: konto bez dostępu, pasek „Podgląd: Gość”", !st.paid && st.can && /Podgląd: Gość/.test(st.bar), st);
  await p.evaluate(() => window.skrot.startTrial()); await p.waitForTimeout(500);
  ok("D gość: „Wypróbuj” w podglądzie nie woła bazy", (await rpcs(p, "nauka_proba_start")).length === 0 && /W podglądzie okres próbny się nie włącza/.test(await p.locator(".modal").innerText()));
  await shot(p, "adm-podglad-gosc-375");
  await p.context().close();
}
// nie-admin z ręcznie wpisanym podglądem
{
  const p = await page(b, { konto: "platne", w: 375, h: 812 });
  await p.addInitScript(() => { if (!sessionStorage.getItem("pg-wpisany")) { sessionStorage.setItem("pg-wpisany", "1"); sessionStorage.setItem("skrot-podglad", JSON.stringify({ tryb: "gosc", rocznik: null, od: Date.now() })); } });
  await p.goto(BASE + "index.html"); await p.waitForTimeout(3500);
  const st = await p.evaluate(() => ({ pg: sessionStorage.getItem("skrot-podglad"), podglad: window.skrot.podglad, paid: window.skrot.paid }));
  ok("D: student z ręcznie wpisanym podglądem traci go (strona przeładowana, płatne konto jak było)", !st.pg && !st.podglad && st.paid, st);
  await p.context().close();
}

// ---------- E: lejek według źródła i generator ----------
const ROCZ = [{ id: "wefiz-bm-1-st-2026", nabor: 2026, status: "platny", kod: "BM", pl: "Business Management", en: "Business Management", stopien: 1, tryb: "st" }];
const L0 = { d28: { wejscia: 330, konta: 51, wybor: 44, proba: 20, zakup: 4 }, wszystko: { wejscia: 2420, konta: 263, wybor: 233, proba: 120, zakup: 61 } };
const ALL = { lejek: L0, retencja: {}, tygodnie: [], uczy: [], rewanze: {}, ab: {}, oczekujacy: { d28: { potwierdzone: 0, kierunki: [] } }, wejscia_zrodla: { "": 280, "ig-zarzadzanie": 25, "plakat-cukrowa": 12 },
  zrodla: {
    "ig-zarzadzanie": { d28: { wejscia: 25, konta: 9, wybor: 8, proba: 5, zakup: 2, lista: 0 }, wszystko: { wejscia: 40, konta: 12, wybor: 10, proba: 6, zakup: 2, lista: 0 } },
    "plakat-cukrowa": { d28: { wejscia: 12, konta: 6, wybor: 6, proba: 3, zakup: 0, lista: 5 }, wszystko: { wejscia: 12, konta: 6, wybor: 6, proba: 3, zakup: 0, lista: 5 } },
    "": { d28: { wejscia: 280, konta: 36, wybor: 30, proba: 12, zakup: 2, lista: 0 }, wszystko: { wejscia: 2368, konta: 245, wybor: 217, proba: 111, zakup: 59, lista: 25 } } } };
const LEJEK = { dzien: "2026-11-05", policzono_at: "2026-11-05T03:15:00Z", roczniki: ROCZ, dane: { "*": ALL, "wefiz-bm-1-st-2026": { ...ALL, zrodla: null, oczekujacy: null, wejscia_zrodla: null } } };
const zrWiersze = (p) => p.evaluate(() => { const sec = [...document.querySelectorAll(".lj-sec")].find((x) => /Lejek według źródła|Funnel by source/.test(x.querySelector("h2")?.textContent || ""));
  return sec ? [...sec.querySelectorAll("tbody tr")].map((tr) => [...tr.children].map((c) => c.textContent.trim()).join("|")) : null; });
for (const [w, h] of [[375, 812], [1280, 900]]) {
  const p = await page(b, { konto: "starosta", w, h, ls: { "bm-starosta": "1", "mock-lejek": JSON.stringify(LEJEK) } });
  await p.goto(BASE + "index.html#/lejekAdmin"); await p.waitForTimeout(2500);
  const r = await zrWiersze(p);
  ok(`${w} E: lejek według źródła: dwa testowe źródła od największej liczby wejść, < 5 ukryte, bez źródła na końcu`,
    JSON.stringify(r) === JSON.stringify(["ig-zarzadzanie|25|9|5|< 5|< 5", "plakat-cukrowa|12|6|< 5|< 5|5", "bez źródła|280|36|12|< 5|< 5"]), r);
  await p.click("button:has-text('Od początku')"); await p.waitForTimeout(300);
  const r2 = await zrWiersze(p);
  ok(`${w} E: od początku`, r2?.[0] === "ig-zarzadzanie|40|12|6|< 5|< 5", r2);
  await p.click("button:has-text('Ostatnie 28 dni')"); await p.waitForTimeout(200);
  await p.evaluate(() => [...document.querySelectorAll(".lj-sec")].find((x) => /według źródła/.test(x.textContent))?.scrollIntoView());
  await shot(p, `adm-lejek-zrodla-${w}`);
  await p.click("button:has-text('Nowy link ze źródłem')"); await p.waitForTimeout(800);
  await p.fill("#zr-t", "a"); await p.waitForTimeout(150);
  ok(`${w} E: generator: za krótkie → błąd`, /co najmniej 2 znaki/.test(await p.locator("#zr-out").innerText()));
  await p.fill("#zr-t", "Plakat Cukrowa"); await p.waitForTimeout(150);
  const link = await p.inputValue("#zr-link");
  ok(`${w} E: generator: „Plakat Cukrowa” → plakat-cukrowa i link ?z=`, link === BASE + "index.html?z=plakat-cukrowa" && (await p.locator(".adm-code").innerText()) === "plakat-cukrowa", link);
  ok(`${w} E: pole nie traci fokusu przy pisaniu`, (await p.evaluate(() => document.activeElement?.id)) === "zr-t");
  await shot(p, `adm-zrodla-link-${w}`);
  ok(`${w} E: bez błędów`, !p.errors.length, p.errors);
  await p.context().close();
}

// ---------- F: EN ----------
for (const [w, h] of [[375, 812], [1280, 900]]) {
  const p = await page(b, { konto: "starosta", w, h, lang: "en", ls: { "bm-starosta": "1", "mock-lejek": JSON.stringify(LEJEK), "mock-karnety": JSON.stringify([{ email: "stary@x.pl", do_kiedy: "2026-10-01", powod: "Test", wydano_at: "2026-09-01T10:00:00Z", konto: true }, { email: "ala@x.pl", do_kiedy: "2027-01-01", powod: "Helps with lesson tests", wydano_at: "2026-11-01T10:00:00Z", konto: false }]) } });
  await zDrugimRocznikiem(p);
  const PLW = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;
  const check = async (nazwa) => {
    const t = (await p.locator("main").innerText()).replace(/Zarządzanie|Skrót BM|stary@x\.pl|ala@x\.pl/g, "");
    const pl = t.split("\n").filter((l) => PLW.test(l));
    ok(`${w} F EN ${nazwa}: bez polskich znaków`, pl.length === 0, pl);
  };
  await p.goto(BASE + "index.html#/starosta"); await p.waitForTimeout(2500);
  await p.goto(BASE + "index.html#/karnetyAdmin"); await p.waitForTimeout(1500);
  await check("karnety"); await shot(p, `adm-en-karnety-${w}`);
  await p.goto(BASE + "index.html#/podgladAdmin"); await p.waitForTimeout(1200);
  await check("podgląd"); await shot(p, `adm-en-podglad-${w}`);
  await p.goto(BASE + "index.html#/zrodlaAdmin"); await p.waitForTimeout(1200);
  await p.fill("#zr-t", "ig zarzadzanie"); await p.waitForTimeout(200);
  await check("linki"); await shot(p, `adm-en-zrodla-${w}`);
  await p.goto(BASE + "index.html#/lejekAdmin"); await p.waitForTimeout(1500);
  const sec = await p.evaluate(() => [...document.querySelectorAll(".lj-sec")].find((x) => /by source/i.test(x.querySelector("h2")?.textContent || ""))?.innerText || "");
  ok(`${w} F EN: lejek według źródła po angielsku`, /Funnel by source/.test(sec) && /no source/.test(sec) && !PLW.test(sec), sec.slice(0, 300));
  await p.goto(BASE + "index.html#/podgladAdmin"); await p.waitForTimeout(1200);
  await p.click("button.adm-tryb >> nth=1"); await p.selectOption("#pg-rocznik", ZARZ);
  await p.click("button:has-text('Start preview')"); await p.waitForTimeout(3000);
  const bar = await p.evaluate(() => document.getElementById("pg-bar")?.innerText || "");
  ok(`${w} F EN: pasek podglądu po angielsku`, /Preview: Free trial/.test(bar) && /End preview/.test(bar) && !PLW.test(bar.replace("Zarządzanie", "")), bar);
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(200);
  await shot(p, `adm-en-pasek-${w}`);
  ok(`${w} F EN: bez błędów`, !p.errors.length, p.errors);
  await p.context().close();
}

await b.close();
for (const [s, n, i] of wyniki) console.log(s, n, i || "");
const bad = wyniki.filter((x) => x[0] === "✗").length;
console.log(bad ? `BŁĘDY: ${bad} z ${wyniki.length}` : `OK: ${wyniki.length} z ${wyniki.length}`);
process.exit(bad ? 1 : 0);
