// Testy importy.js (etap 14 „Systemy z Zdawalni w Skrócie”): profil wydziału, schemat, części PDF-u, zapytanie do modelu,
// kolejka (szkic → do sprawdzenia → zatwierdzony), eksport do sylabus.json i planu, oraz rdzeń funkcji Edge
// supabase/functions/importy/obsluga.ts z atrapą bazy, Storage, PDF-u i API Anthropic (bez prawdziwych wywołań).
//
// PILOT NA ATRAPIE: „model” zwraca dla każdej części PDF-u sylabusa BM dokładnie to, co dziś daje scripts/sylabus-parse.py
// (przedmioty z sylabus.json, z numerami stron z prawdziwego PDF-u: tests/fixtures/importy-wefiz-strony.json). Całość przechodzi
// kolejkę i po zatwierdzeniu daje plik identyczny z sylabus.json. Prawdziwy model czyta PDF dopiero po wdrożeniu (docs/zdawalni/etap-14.md).
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const I = require("../importy.js");

const ROOT = path.join(__dirname, "..");
const WEFIZ = JSON.parse(fs.readFileSync(path.join(ROOT, "importy/WEFiZ.json"), "utf8"));
const WTEST = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures/importy-profil-WTEST.json"), "utf8"));
const SYL_TXT = fs.readFileSync(path.join(ROOT, "sylabus.json"), "utf8");
const SYL = JSON.parse(SYL_TXT);
const STRONY = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures/importy-wefiz-strony.json"), "utf8"));

test("kopia logiki w funkcji Edge jest identyczna z importy.js", () => {
  assert.equal(fs.readFileSync(path.join(ROOT, "supabase/functions/importy/logika.js"), "utf8"), fs.readFileSync(path.join(ROOT, "importy.js"), "utf8"));
});

test("profile: WEFiZ i sztuczny WTEST są poprawne; zepsuty profil ma czytelne błędy", () => {
  assert.deepEqual(I.profilSprawdz(WEFIZ), []);
  assert.deepEqual(I.profilSprawdz(WTEST), []);
  assert.deepEqual(Object.keys(WEFIZ.typy), ["sylabus", "plan"]);
  const zly = JSON.parse(JSON.stringify(WEFIZ));
  zly.wydzial = "W 1"; zly.typy.quiz = { polecenie: "x" }; zly.typy.sylabus.przyklady[0].ects = "5";
  const e = I.profilSprawdz(zly);
  assert.ok(e.some((x) => /wydzial/.test(x)) && e.some((x) => /typy\.quiz/.test(x)) && e.some((x) => /przyklady\[0\]: ects/.test(x)), e.join("\n"));
  assert.ok(I.profilSprawdz(null).length);
});

test("schemat: waliduj (typy, enum, wymagane, pola spoza schematu, długości), schemat dla API bez ograniczeń", () => {
  const s = WEFIZ.typy.plan.schemat;
  const ok = WEFIZ.typy.plan.przyklady[0];
  assert.deepEqual(I.waliduj(s, ok), []);
  assert.match(I.waliduj(s, { ...ok, k: "Z" })[0], /^k: jedna z wartości/);
  assert.match(I.waliduj(s, { ...ok, od: "8.15" })[0], /^od: zły format/);
  assert.match(I.waliduj(s, { ...ok, ekstra: 1 })[0], /ekstra: pole spoza schematu/);
  const { grupa, ...bez } = ok;
  assert.match(I.waliduj(s, bez)[0], /grupa: brak pola/);
  assert.match(I.waliduj(s, { ...ok, d: 1.5 })[0], /d: oczekiwano integer/);
  assert.match(I.waliduj(s, { ...ok, p: "x".repeat(201) })[0], /najwyżej 200 znaków/);
  const api = JSON.stringify(I.schematDlaApi(I.schematWyniku(WEFIZ.typy.sylabus)));
  for (const k of ["maxLength", "minimum", "maximum", "maxItems", "pattern"]) assert.ok(!api.includes('"' + k + '"'), k);
  assert.ok(api.includes('"additionalProperties":false') && api.includes('"enum"'));
});

test("części PDF-u: 227 stron po 8 z zakładką 2 → 29 części; plan po 4 bez zakładki", () => {
  const c = I.czesci(227, WEFIZ.typy.sylabus);
  assert.equal(c.length, 29);
  assert.deepEqual(c[0], { czesc: 1, od: 1, do: 8, doZ: 10 });
  assert.deepEqual(c[28], { czesc: 29, od: 225, do: 227, doZ: 227 });
  assert.ok(c.every((x, i) => i === 0 || x.od === c[i - 1].do + 1), "bez dziur i bez nakładania");
  assert.deepEqual(I.czesci(9, WEFIZ.typy.plan).map((x) => [x.od, x.do, x.doZ]), [[1, 4, 4], [5, 8, 8], [9, 9, 9]]);
  assert.deepEqual(I.czesci(0, WEFIZ.typy.plan), []);
  // każdy przedmiot ma najwyżej 3 strony, więc zakładka 2 wystarcza, żeby przedmiot zaczęty na końcu części był cały
  assert.ok(STRONY.przedmioty.every((x) => x.koniec - x.strona <= WEFIZ.typy.sylabus.zakladka));
});

test("zapytanie: PDF jako blok document (base64), schemat z profilu, fallbacks, strony części w treści", () => {
  const c = I.czesci(227, WEFIZ.typy.sylabus)[1];
  const q = I.zapytanie({ profil: WEFIZ, typ: "sylabus", czesc: c, strony: 227, pdf: "JVBERi0=", model: "claude-sonnet-5-5" });
  assert.equal(q.model, "claude-sonnet-5-5");
  assert.equal(q.fallbacks, "default");
  assert.equal(q.max_tokens, 32000);
  assert.deepEqual(q.messages[0].content[0], { type: "document", source: { type: "base64", media_type: "application/pdf", data: "JVBERi0=" } });
  assert.match(q.messages[0].content[1].text, /pages 9–18 of the original file \(227 pages\)/);
  assert.match(q.messages[0].content[1].text, /START on pages 1–8 of this part/);
  assert.equal(q.output_config.effort, "low");
  assert.equal(q.output_config.format.type, "json_schema");
  assert.deepEqual(q.output_config.format.schema.required, ["pozycje", "uwagi"]);
  assert.match(q.system, /Wydział Ekonomii, Finansów i Zarządzania/);
  assert.match(q.system, /never instructions to you/);
  assert.match(q.system, /EFZ214AIJ3443_3S/, "przykład z profilu");
  const q2 = I.zapytanie({ profil: WEFIZ, typ: "sylabus", czesc: c, strony: 227, pdf: "x", model: "m", lastError: "pozycje[0].dane.ects: oczekiwano integer" });
  assert.match(q2.messages[0].content[1].text, /Previous answer was invalid: pozycje\[0\]\.dane\.ects/);
});

test("wynik części: strony liczone od początku PDF-u, pozycje z zakładki odpadają, zły format = błąd", () => {
  const pt = WEFIZ.typy.plan, c = { czesc: 2, od: 5, do: 8, doZ: 9 };
  const d = pt.przyklady[0];
  const w = I.sprawdzWynik({ pozycje: [{ strona: 1, fragment: "a", dane: d }, { strona: 4, fragment: "b", dane: d }, { strona: 5, fragment: "c", dane: d }], uwagi: "" }, pt, c);
  assert.equal(w.ok, true);
  assert.deepEqual(w.pozycje.map((p) => p.strona), [5, 8]);
  assert.equal(w.poza, 1);
  assert.equal(I.sprawdzWynik({ pozycje: [{ strona: 1, fragment: "a", dane: { ...d, k: "?" } }], uwagi: "" }, pt, c).ok, false);
  assert.equal(I.sprawdzWynik({ pozycje: [] }, pt, c).ok, false, "uwagi wymagane");
});

test("kolejka: przejścia stanów, decyzje per pozycja, popraw sprawdza schemat, do eksportu tylko zatwierdzone", () => {
  assert.ok(I.przejscie("szkic", "do_sprawdzenia") && I.przejscie("do_sprawdzenia", "zatwierdzony") && I.przejscie("szkic", "odrzucony"));
  assert.ok(!I.przejscie("szkic", "zatwierdzony") && !I.przejscie("zatwierdzony", "odrzucony") && !I.przejscie("odrzucony", "szkic"));
  const pt = WEFIZ.typy.plan, d = pt.przyklady[0];
  let poz = I.dodajCzesc([], 2, [{ strona: 6, fragment: "x", dane: { ...d, pl: "B" } }]);
  poz = I.dodajCzesc(poz, 1, [{ strona: 2, fragment: "x", dane: { ...d, pl: "A" } }, { strona: 3, fragment: "x", dane: { ...d, pl: "Z" } }]);
  poz = I.dodajCzesc(poz, 1, [{ strona: 2, fragment: "x", dane: { ...d, pl: "A" } }]);   // ponowne czytanie części 1
  assert.deepEqual(poz.map((p) => [p.n, p.dane.pl, p.decyzja]), [[1, "A", null], [2, "B", null]]);
  assert.deepEqual(I.podsumuj(poz), { razem: 2, tak: 0, popraw: 0, nie: 0, czeka: 2, gotowe: false });
  let r = I.decyduj(poz, 1, "popraw", { ...d, k: "??" }, pt);
  assert.equal(r.ok, false); assert.match(r.error, /^k:/);
  r = I.decyduj(poz, 1, "popraw", { ...d, pl: "A poprawione" }, pt); poz = r.pozycje;
  poz = I.decyduj(poz, 2, "nie", null, pt).pozycje;
  assert.deepEqual(I.podsumuj(poz), { razem: 2, tak: 0, popraw: 1, nie: 1, czeka: 0, gotowe: true });
  assert.deepEqual(I.zatwierdzone(poz).map((x) => x.pl), ["A poprawione"]);
  poz = I.decyduj(poz, 1, null, null, pt).pozycje;
  assert.equal(poz[0].poprawione, undefined); assert.equal(I.podsumuj(poz).gotowe, false);
  assert.equal(I.decyduj(poz, 9, "tak", null, pt).ok, false);
  assert.equal(I.decyduj(poz, 1, "moze", null, pt).ok, false);
  assert.equal(I.opis({ stan: "szkic", przeczytane: [1], czesci: 3, pozycje: [] }).dalej, "czytaj");
  assert.equal(I.opis({ stan: "do_sprawdzenia", przeczytane: [1], czesci: 1, pozycje: poz }).txt, "Do decyzji: 1 z 2");
  assert.equal(I.tytul(WEFIZ.typy.sylabus, { code: "EFZ1", pl: "Prawo" }), "EFZ1 · Prawo");
});

test("sylabus: pozycja ↔ przedmiot w obie strony daje dokładnie obecny sylabus.json", () => {
  const meta = { source: SYL.source, updated: SYL.updated };
  // kolejność z PDF-u (od niej zależą identyfikatory powtórzonych nazw, np. gry-zespolowe-12s)
  const pdf = STRONY.przedmioty.map((x) => SYL.courses.find((c) => c.code === x.code && x.fragment.includes(c.en)));
  const out = I.doSylabusa(pdf.map(I.pozycjaZPrzedmiotu), WEFIZ.typy.sylabus, meta);
  assert.equal(JSON.stringify(out), SYL_TXT);
  const por = I.porownajSylabusy(out, SYL);
  assert.deepEqual([por.identyczne, por.zgodne, por.rozne.length, por.kolejnosc], [true, 84, 0, true]);
  assert.equal(I.slug("Gry zespołowe"), "gry-zespolowe");
  // poprawki z profilu (literówki z PDF-u uczelni, „??” z zepsutych znaków)
  const z = I.pozycjaZPrzedmiotu(SYL.courses[0]); z.goals = ["Strucured Query Language ??basics"];
  assert.deepEqual(I.doSylabusa([z], WEFIZ.typy.sylabus, meta).courses[0].goals, ["Structured Query Language basics"]);
  // różnica w jednym polu: porównanie pokazuje który przedmiot i które pole
  const inne = JSON.parse(SYL_TXT); inne.courses[5].ects = 99;
  assert.deepEqual(I.porownajSylabusy(inne, SYL).rozne, [{ id: SYL.courses[5].id, pola: ["ects"] }]);
  // wynik z bazy (jsonb) ma klucze w innej kolejności: porównanie tego nie liczy, a pobrany plik wraca do układu strony
  const przestaw = (x) => Array.isArray(x) ? x.map(przestaw) : x && typeof x === "object" ? Object.fromEntries(Object.keys(x).reverse().map((k) => [k, przestaw(x[k])])) : x;
  const zBazy = przestaw(SYL);
  assert.notEqual(JSON.stringify(zBazy), SYL_TXT);
  assert.deepEqual([I.porownajSylabusy(zBazy, SYL).zgodne, I.porownajSylabusy(zBazy, SYL).identyczne], [84, true]);
  assert.equal(JSON.stringify(I.uporzadkujSylabus(zBazy, WEFIZ.typy.sylabus)), SYL_TXT);
});

test("plan: pozycje → format plan.json z plan-bm (bloki godzin z profilu, oba tygodnie, godziny spoza bloków)", () => {
  const pt = WEFIZ.typy.plan;
  const lista = [
    { grupa: "C111", tydzien: "oba", d: 1, od: "10:00", do: "11:30", pl: "Logistyka", en: "Logistics", k: "W", p: "dr Jakub Dowejko", r: "s. SIL 325", g: "", n: "" },
    { grupa: "C111", tydzien: "odd", d: 0, od: "8:15", do: "9:45", pl: "Prawo", en: "Law", k: "W", p: "dr Małgorzata Szymszon", r: "s. 002", g: "", n: "" },
    { grupa: "C112", tydzien: "even", d: 3, od: "9:00", do: "10:30", pl: "Odrabianie zajęć", en: "", k: "X", p: "", r: "sala 002a", g: "B", n: "Jednorazowo: 19.11.2026" },
  ];
  const p = I.doPlanu(lista, pt);
  assert.deepEqual(Object.keys(p.groups), ["C111", "C112"]);
  assert.deepEqual(p.groups.C111.odd, [
    { d: 0, s: 0, pl: "Prawo", en: "Law", k: "W", p: "dr Małgorzata Szymszon", r: "s. 002" },
    { d: 1, s: 1, pl: "Logistyka", en: "Logistics", k: "W", p: "dr Jakub Dowejko", r: "s. SIL 325" },
  ]);
  assert.deepEqual(p.groups.C111.even, [{ d: 1, s: 1, pl: "Logistyka", en: "Logistics", k: "W", p: "dr Jakub Dowejko", r: "s. SIL 325" }]);
  assert.deepEqual(p.groups.C112.even, [{ d: 3, s: -1, time: ["9:00", "10:30"], pl: "Odrabianie zajęć", k: "X", g: "B", r: "sala 002a", n: "Jednorazowo: 19.11.2026" }]);
  assert.equal(Object.keys(p.groups.C112.even[0]).join(","), "d,s,time,pl,k,g,r,n", "kolejność kluczy jak w plan-bm");
  assert.deepEqual(I.eksport("plan", lista, pt, { source: "Plan zimowy" }).source, "Plan zimowy");
  assert.equal(I.plik("sylabus", "WEFiZ"), "sylabus.json");
});

test("plik: PDF do 15 MB, nagłówek %PDF-", () => {
  assert.equal(I.plikBlad({ size: 1000, type: "application/pdf", name: "a.pdf" }), null);
  assert.match(I.plikBlad({ size: 16 * 1024 * 1024, type: "application/pdf" }), /15 MB/);
  assert.match(I.plikBlad({ size: 10, type: "image/png", name: "a.png" }), /nie jest plik PDF/);
  assert.match(I.plikBlad(null), /Wybierz/);
  assert.equal(I.jestPdf(new TextEncoder().encode("%PDF-1.7")), true);
  assert.equal(I.jestPdf(new TextEncoder().encode("<html>")), false);
});

// =====================================================================
// Funkcja Edge z atrapami: baza (w pamięci, te same reguły co SQL v40), Storage, PDF, profil i model.
// =====================================================================
const FN = "https://x.supabase.co/functions/v1/importy";
const PDF = Buffer.from("%PDF-1.7\n% atrapa\n").toString("base64");

function atrapa({ profile = { WEFiZ: WEFIZ, WTEST: WTEST }, strony = 227, model, admin = true } = {}) {
  const db = { importy: {}, api: [], storage: {}, usuniete: [], seq: 0 };
  const rpc = async (fn, a = {}) => {
    const me = { admin, platny: true };
    if (fn === "nauka_ja") return { data: me, error: null };
    if (!admin) return { data: { ok: false, code: "not_admin" }, error: null };
    if (fn === "nauka_import_nowy") {
      const ex = Object.values(db.importy).find((r) => r.plik_sha256 === a.p_sha && r.typ === a.p_typ && r.wydzial === a.p_wydzial && ["szkic", "do_sprawdzenia"].includes(r.stan));
      if (ex) return { data: { ok: true, id: ex.id, sciezka: ex.pdf_sciezka, istnieje: true, pdf: !ex.pdf_usuniety_at }, error: null };
      const id = "00000000-0000-4000-8000-" + String(++db.seq).padStart(12, "0");
      db.importy[id] = { id, typ: a.p_typ, wydzial: a.p_wydzial, rocznik_id: a.p_rocznik, opis: a.p_opis, plik_sha256: a.p_sha, plik_nazwa: a.p_nazwa,
        plik_bajty: a.p_bajty, strony: a.p_strony, czesci: a.p_czesci, przeczytane: [], stan: "szkic", pozycje: [], pdf_sciezka: id + ".pdf", pdf_usuniety_at: null, utworzony_at: Date.now() };
      return { data: { ok: true, id, sciezka: id + ".pdf", istnieje: false, pdf: false }, error: null };
    }
    const r = db.importy[a.p_id];
    if (fn === "nauka_import_pobierz") return { data: r ? { ok: true, import: r } : { ok: false, code: "not_found" }, error: null };
    if (fn === "nauka_import_czesc") {
      if (r.stan !== "szkic") return { data: { ok: false, code: "bad_state" }, error: null };
      r.pozycje = I.dodajCzesc(r.pozycje, a.p_czesc, a.p_pozycje);
      r.przeczytane = [...new Set([...r.przeczytane, a.p_czesc])].sort((x, y) => x - y);
      if (r.przeczytane.length >= r.czesci) r.stan = "do_sprawdzenia";
      return { data: { ok: true, stan: r.stan, przeczytane: r.przeczytane, czesci: r.czesci, pozycji: r.pozycje.length }, error: null };
    }
    if (fn === "nauka_importy_do_sprzatniecia") return { data: Object.values(db.importy).filter((x) => !x.pdf_usuniety_at && ["zatwierdzony", "odrzucony"].includes(x.stan)).map((x) => ({ id: x.id, sciezka: x.pdf_sciezka })), error: null };
    if (fn === "nauka_import_pdf_usuniety") { r.pdf_usuniety_at = Date.now(); return { data: true, error: null }; }
    return { data: null, error: { message: "nie ma " + fn } };
  };
  // „Panel”: decyzje i zakończenie (w prawdziwej bazie: nauka_import_decyzja / nauka_import_reszta_tak / nauka_import_zakoncz).
  db.zatwierdzWszystko = (id, pt, meta) => {
    const r = db.importy[id];
    assert.equal(r.stan, "do_sprawdzenia");
    for (const p of r.pozycje) r.pozycje = I.decyduj(r.pozycje, p.n, "tak", null, pt).pozycje;
    assert.equal(I.podsumuj(r.pozycje).gotowe, true);
    r.gotowe = I.eksport(r.typ, I.zatwierdzone(r.pozycje), pt, meta);
    r.stan = "zatwierdzony";
    return r.gotowe;
  };
  const storage = {
    upload: async (p, b) => { db.storage[p] = b; return { error: null }; },
    download: async (p) => ({ data: db.storage[p] || null, error: db.storage[p] ? null : { message: "brak" } }),
    remove: async (ps) => { ps.forEach((p) => { delete db.storage[p]; db.usuniete.push(p); }); return { error: null }; },
    signedUrl: async (p) => ({ url: db.storage[p] ? "https://x.supabase.co/storage/v1/object/sign/importy/" + p + "?token=t" : null, error: null }),
  };
  // Wycinek PDF-u w atrapie: tekst „strony od–do”, żeby model-atrapa wiedział, którą część czyta.
  const pdf = { strony: async () => strony, wytnij: async (b, od, d) => new TextEncoder().encode(`%PDF-1.7 strony ${od}-${d}`) };
  const fetchMock = async (url, init) => {
    const body = JSON.parse(init.body);
    db.api.push({ url, headers: init.headers, body });
    const wy = Buffer.from(body.messages[0].content[0].source.data, "base64").toString();
    const [, od, d] = wy.match(/strony (\d+)-(\d+)/).map(Number);
    const o = await model({ od, do: d, body, n: db.api.length });
    if (o.throw) throw new Error("abort");
    return { ok: (o.status || 200) < 300, status: o.status || 200, json: async () => o.json, text: async () => JSON.stringify(o.json || {}) };
  };
  const env = { ANTHROPIC_API_KEY: "sk-test" };
  return { db, deps: { rpc, storage, pdf, profil: async (w) => profile[w] || null, fetch: fetchMock, env: (k) => env[k], I } };
}
const odp = (wynik, extra = {}) => ({ json: { model: "claude-sonnet-5-5", stop_reason: "end_turn", usage: { input_tokens: 20000, output_tokens: 6000 }, content: [{ type: "text", text: JSON.stringify(wynik) }], ...extra } });
const zapytanie = (body, headers = {}) => new Request(FN, { method: "POST", headers: { "content-type": "application/json", origin: "https://zdawalni.pl", ...headers }, body: JSON.stringify(body) });
const call = async (obsluz, deps, body) => { const r = await obsluz(zapytanie(body), deps); return { status: r.status, ...(await r.json()) }; };

// Model-atrapa pilota: przedmioty, które zaczynają się na stronach od–doZ wycinka (także w zakładce, jak zrobiłby to model,
// który nie dopilnował polecenia — funkcja i tak je odrzuci), w formacie profilu, ze stroną liczoną od początku wycinka.
const PDF_KURSY = STRONY.przedmioty.map((x) => ({ ...x, kurs: SYL.courses.find((c) => c.code === x.code && x.fragment.includes(c.en)) }));
const modelPilot = ({ od, do: d }) => odp({
  pozycje: PDF_KURSY.filter((x) => x.strona >= od && x.strona <= d).map((x) => ({ strona: x.strona - od + 1, fragment: x.fragment, dane: I.pozycjaZPrzedmiotu(x.kurs) })),
  uwagi: "",
});

test("PILOT (atrapa modelu = wynik parsera): sylabus BM przechodzi całą kolejkę i daje plik identyczny z sylabus.json", async () => {
  const { obsluz } = await import("../supabase/functions/importy/obsluga.ts");
  const { db, deps } = atrapa({ model: modelPilot });
  const w = await call(obsluz, deps, { akcja: "wgraj", typ: "sylabus", wydzial: "WEFiZ", rocznik: "wefiz-bm-1-st-2026", opis: SYL.source, nazwa: STRONY.plik, pdf: PDF });
  assert.deepEqual([w.status, w.ok, w.istnieje, w.strony, w.czesci], [200, true, false, 227, 29]);
  assert.ok(db.storage[w.id + ".pdf"], "PDF w prywatnym buckecie");
  assert.equal(db.importy[w.id].plik_sha256, require("node:crypto").createHash("sha256").update(Buffer.from(PDF, "base64")).digest("hex"));
  const again = await call(obsluz, deps, { akcja: "wgraj", typ: "sylabus", wydzial: "WEFiZ", nazwa: "x.pdf", pdf: PDF });
  assert.deepEqual([again.id, again.istnieje], [w.id, true], "ten sam plik → ten sam import");
  let poza = 0, stan;
  for (let c = 1; c <= w.czesci; c++) {
    const r = await call(obsluz, deps, { akcja: "czytaj", id: w.id, czesc: c });
    assert.equal(r.status, 200, JSON.stringify(r));
    poza += r.poza; stan = r.stan;
    assert.equal(stan, c < w.czesci ? "szkic" : "do_sprawdzenia");
  }
  assert.ok(poza > 0, "przedmioty z zakładki odrzucone (i przeczytane w następnej części)");
  assert.equal(db.api.length, 29);
  assert.ok(db.api.every((a) => a.headers["anthropic-beta"] === "server-side-fallback-2026-07-01" && a.body.model === "claude-sonnet-5-5"));
  const imp = db.importy[w.id];
  assert.equal(imp.pozycje.length, 84);
  assert.ok(imp.pozycje.every((p) => p.decyzja === null && p.fragment.startsWith("Course title:") && p.strona >= 1), "szkic: bez decyzji, z fragmentem i stroną");
  assert.equal(I.opis(imp).dalej, "sprawdz");
  assert.equal((await call(obsluz, deps, { akcja: "czytaj", id: w.id, czesc: 1 })).status, 409, "przeczytanego nie czyta drugi raz");
  const pdfUrl = await call(obsluz, deps, { akcja: "pdf", id: w.id });
  assert.match(pdfUrl.url, /\/storage\/v1\/object\/sign\/importy\//);
  // zatwierdzenie (tu: każda pozycja „tak”) → eksport → identyczny plik
  const gotowe = db.zatwierdzWszystko(w.id, WEFIZ.typy.sylabus, { source: SYL.source, updated: SYL.updated });
  assert.equal(JSON.stringify(gotowe), SYL_TXT, "JSON identyczny z obecnym sylabus.json");
  // po zatwierdzeniu PDF znika z bucketu
  const s = await call(obsluz, deps, { akcja: "sprzataj" });
  assert.deepEqual([s.usuniete, db.storage[w.id + ".pdf"]], [1, undefined]);
  assert.equal((await call(obsluz, deps, { akcja: "pdf", id: w.id })).status, 410);
});

test("PILOT: rozbieżność modelu z parserem widać w porównaniu, a poprawka przy pozycji trafia do pliku", async () => {
  const { obsluz } = await import("../supabase/functions/importy/obsluga.ts");
  const zly = (o) => { const r = modelPilot(o); const w = JSON.parse(r.json.content[0].text); w.pozycje.forEach((p) => { if (p.dane.code === "EFZ214AIJ3432_3S") p.dane.ects = 4; }); r.json.content[0].text = JSON.stringify(w); return r; };
  const { db, deps } = atrapa({ model: zly });
  const w = await call(obsluz, deps, { akcja: "wgraj", typ: "sylabus", wydzial: "WEFiZ", nazwa: "s.pdf", pdf: PDF });
  for (let c = 1; c <= w.czesci; c++) await call(obsluz, deps, { akcja: "czytaj", id: w.id, czesc: c });
  const imp = db.importy[w.id], pt = WEFIZ.typy.sylabus, meta = { source: SYL.source, updated: SYL.updated };
  const pierwszy = I.doSylabusa(I.zatwierdzone(imp.pozycje.map((p) => ({ ...p, decyzja: "tak" }))), pt, meta);
  const por = I.porownajSylabusy(pierwszy, SYL);
  assert.deepEqual(por.rozne, [{ id: "ekonomia-biznesu", pola: ["ects"] }]);
  const p = imp.pozycje.find((x) => x.dane.code === "EFZ214AIJ3432_3S");
  let poz = I.decyduj(imp.pozycje, p.n, "popraw", { ...p.dane, ects: 3 }, pt).pozycje;
  for (const x of poz) if (!x.decyzja) poz = I.decyduj(poz, x.n, "tak", null, pt).pozycje;
  assert.equal(JSON.stringify(I.doSylabusa(I.zatwierdzone(poz), pt, meta)), SYL_TXT);
  // odrzucona pozycja nie trafia do pliku
  poz = I.decyduj(poz, p.n, "nie", null, pt).pozycje;
  assert.equal(I.doSylabusa(I.zatwierdzone(poz), pt, meta).courses.length, 83);
});

test("NOWY WYDZIAŁ = tylko nowy profil: sztuczny WTEST (sylabus, plan, treść) działa bez zmian w kodzie", async () => {
  const { obsluz } = await import("../supabase/functions/importy/obsluga.ts");
  const S = WTEST.typy.sylabus, P = WTEST.typy.plan, T = WTEST.typy.tresc;
  const kurs2 = { ...S.przyklady[0], code: "WT02", en: "Accounting", pl: "Rachunkowość", forms: [{ f: "LAB", h: 15, c: "zo", s: 2 }, { f: "CW", h: 15, c: "zo", s: 2 }], topics: [{ f: "LAB", t: "Excel", h: 15 }] };
  const dane = {
    sylabus: { 1: [S.przyklady[0]], 6: [kurs2] },
    plan: { 1: [P.przyklady[0]], 2: [{ ...P.przyklady[0], grupa: "T2", d: 0, od: "8:00", do: "9:30", k: "W" }] },
    tresc: { 1: [T.przyklady[0], { pojecie: "Podaż", definicja: "Ilość dobra oferowana przy danej cenie." }] },
  };
  for (const [typ, strony, czesci] of [["sylabus", 8, 2], ["plan", 2, 2], ["tresc", 3, 1]]) {
    const model = ({ od, do: d, body }) => {
      assert.match(body.system, /Wydział Testowy/);
      assert.match(body.system, new RegExp(WTEST.typy[typ].polecenie.slice(0, 30).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      const poz = [];
      for (let s = od; s <= d; s++) (dane[typ][s] || []).forEach((x) => poz.push({ strona: s - od + 1, fragment: "str. " + s, dane: x }));
      return odp({ pozycje: poz, uwagi: "" });
    };
    const { db, deps } = atrapa({ strony, model });
    const w = await call(obsluz, deps, { akcja: "wgraj", typ, wydzial: "WTEST", nazwa: typ + ".pdf", pdf: PDF });
    assert.deepEqual([w.ok, w.czesci], [true, czesci], typ);
    for (let c = 1; c <= w.czesci; c++) assert.equal((await call(obsluz, deps, { akcja: "czytaj", id: w.id, czesc: c })).status, 200);
    const g = db.zatwierdzWszystko(w.id, WTEST.typy[typ], { source: "Testowy " + typ, updated: "2027-10-01" });
    if (typ === "sylabus") {
      // poprawki z profilu działają na gotowym tekście (jak TYPOS w sylabus-build.py), identyfikator zostaje z nazwy z PDF-u
      assert.deepEqual(g.courses.map((c) => [c.id, c.pl, c.sem]), [["mikroekonomia-i", "Mikroekonomia 1", [1]], ["rachunkowosc", "Rachunkowość", [2]]]);
      assert.deepEqual(g.courses[0].forms.map((f) => f.f), ["CW", "W"], "kolejność form z profilu WTEST");
      assert.deepEqual(Object.keys(g.courses[0].topics), ["W", "CW"]);
      assert.deepEqual(g.courses[1].unit, null);
    } else if (typ === "plan") {
      assert.deepEqual(g.groups.T1.odd, [{ d: 2, s: 1, pl: "Mikroekonomia I", k: "CW", p: "dr Jan Testowy", r: "A-12" }], "bloki godzin z profilu WTEST");
      assert.deepEqual(g.groups.T2.even[0].s, 0);
    } else {
      assert.deepEqual(g.pozycje.map((x) => x.pojecie), ["Popyt", "Podaż"]);
    }
  }
  // WEFiZ nie ma typu „tresc”: funkcja mówi to wprost
  const { deps } = atrapa({ model: modelPilot });
  const r = await call(obsluz, deps, { akcja: "wgraj", typ: "tresc", wydzial: "WEFiZ", nazwa: "t.pdf", pdf: PDF });
  assert.deepEqual([r.status, r.code], [400, "no_type"]);
});

test("funkcja Edge: tylko administrator; brak profilu, zły PDF, zła akcja; CORS", async () => {
  const { obsluz } = await import("../supabase/functions/importy/obsluga.ts");
  const a = atrapa({ admin: false, model: modelPilot });
  const r = await call(obsluz, a.deps, { akcja: "wgraj", typ: "sylabus", wydzial: "WEFiZ", nazwa: "s.pdf", pdf: PDF });
  assert.deepEqual([r.status, r.code], [403, "not_admin"]);
  const { db, deps } = atrapa({ model: modelPilot });
  assert.equal((await call(obsluz, deps, { akcja: "wgraj", typ: "sylabus", wydzial: "WXYZ", nazwa: "s.pdf", pdf: PDF })).code, "no_profile");
  assert.equal((await call(obsluz, deps, { akcja: "wgraj", typ: "sylabus", wydzial: "../x", nazwa: "s.pdf", pdf: PDF })).code, "bad_faculty");
  assert.equal((await call(obsluz, deps, { akcja: "wgraj", typ: "sylabus", wydzial: "WEFiZ", nazwa: "s.pdf", pdf: Buffer.from("<html>").toString("base64") })).code, "bad_pdf");
  assert.equal((await call(obsluz, deps, { akcja: "wgraj", typ: "sylabus", wydzial: "WEFiZ", nazwa: "s.pdf", pdf: "nie base64!" })).code, "bad_pdf");
  assert.equal((await call(obsluz, deps, { akcja: "costam", id: "00000000-0000-4000-8000-000000000099" })).code, "not_found");
  assert.equal((await call(obsluz, deps, { akcja: "czytaj", id: "x" })).code, "bad_id");
  assert.equal(Object.keys(db.importy).length, 0);
  assert.equal(db.api.length, 0);
  assert.equal((await obsluz(new Request(FN, { method: "GET" }), deps)).status, 405);
  const o = await obsluz(new Request(FN, { method: "OPTIONS", headers: { origin: "http://127.0.0.1:8811" } }), deps);
  assert.equal(o.headers.get("access-control-allow-origin"), "http://127.0.0.1:8811");
  const o2 = await obsluz(new Request(FN, { method: "OPTIONS", headers: { origin: "https://zly.example" } }), deps);
  assert.equal(o2.headers.get("access-control-allow-origin"), "https://zdawalni.pl");
});

test("funkcja Edge: zły format → druga próba z powodem; max_tokens, odmowa, błąd API i czas → część zostaje do ponowienia", async () => {
  const { obsluz } = await import("../supabase/functions/importy/obsluga.ts");
  const zlyWynik = odp({ pozycje: [{ strona: 1, fragment: "x", dane: { code: "EFZ" } }], uwagi: "" });
  let n = 0;
  const { db, deps } = atrapa({ strony: 12, model: (o) => (++n === 1 ? zlyWynik : modelPilot(o)) });
  const w = await call(obsluz, deps, { akcja: "wgraj", typ: "sylabus", wydzial: "WEFiZ", nazwa: "s.pdf", pdf: PDF });
  const r = await call(obsluz, deps, { akcja: "czytaj", id: w.id, czesc: 1 });
  assert.equal(r.ok, true);
  assert.equal(db.api.length, 2);
  assert.match(db.api[1].body.messages[0].content[1].text, /Previous answer was invalid: pozycje\[0\]\.dane\.en: brak pola/);
  for (const [model, code] of [
    [() => ({ json: { stop_reason: "max_tokens", content: [] } }), "invalid_json"],
    [() => ({ json: { stop_reason: "refusal", content: [] } }), "refusal"],
    [() => ({ status: 500, json: { error: "x" } }), "upstream"],
    [() => ({ status: 529, json: {} }), "rate_limited"],
    [() => ({ throw: true }), "timeout"],
    [() => ({ json: { stop_reason: "end_turn", content: [{ type: "text", text: "nie json" }] } }), "invalid_json"],
  ]) {
    const a = atrapa({ strony: 30, model });
    const orig = console.error; console.error = () => {};
    const x = await call(obsluz, a.deps, { akcja: "wgraj", typ: "sylabus", wydzial: "WEFiZ", nazwa: "s.pdf", pdf: PDF });
    const y = await call(obsluz, a.deps, { akcja: "czytaj", id: x.id, czesc: 2 });
    console.error = orig;
    assert.equal(y.code, code);
    const imp = a.db.importy[x.id];
    assert.deepEqual([imp.stan, imp.przeczytane, imp.pozycje.length], ["szkic", [], 0], code + ": nic nie zapisane, część do ponowienia");
  }
  const bez = atrapa({ model: modelPilot }); const d2 = { ...bez.deps, env: () => undefined };
  const x = await call(obsluz, d2, { akcja: "wgraj", typ: "sylabus", wydzial: "WEFiZ", nazwa: "s.pdf", pdf: PDF });
  assert.equal((await call(obsluz, d2, { akcja: "czytaj", id: x.id, czesc: 1 })).code, "no_key");
});

test("plan z parsera plan-bm (v50): daty → dates, pg → pg, profil WPiA poprawny", () => {
  const WPIA = require("../importy/WPiA.json");
  assert.deepEqual(I.profilSprawdz(WPIA), []);
  for (const w of ["WNSiP", "WNS", "WT"]) {   // wydziały z parsera plan-bm: kod = p_wydzial szkicu
    const p = require(`../importy/${w}.json`);
    assert.deepEqual(I.profilSprawdz(p), [], w); assert.equal(p.wydzial, w); assert.ok(I.profilTypu(p, "plan"));
  }
  const pt = WPIA.typy.plan;
  const lista = [
    { grupa: "PRAWO1", tydzien: "oba", d: 1, od: "08:15", do: "10:45", pl: "Legal Tech start", en: "", k: "CW", p: "mgr J. Cieślicki", r: "s. 118", g: "", n: "", daty: ["2026-11-10", "2026-11-03"], pg: "Legal Tech start:1" },
    { grupa: "PRAWO1", tydzien: "oba", d: 0, od: "11:00", do: "13:30", pl: "Historia prawa", en: "", k: "W", p: "dr hab. M. Tkaczuk", r: "s. 7-9", g: "", n: "" },
  ];
  const p = I.doPlanu(lista, pt);
  assert.deepEqual(p.groups.PRAWO1.odd.map((e) => [e.d, e.time, e.pg || null, e.dates || null]), [[0, ["11:00", "13:30"], null, null], [1, ["08:15", "10:45"], "Legal Tech start:1", ["2026-11-03", "2026-11-10"]]]);
  assert.equal(p.groups.PRAWO1.even.length, 2, "zajęcia z datami w obu tygodniach (daty same wybierają dzień)");
  assert.deepEqual(I.waliduj(pt.schemat, lista[0]), []);
  assert.ok(I.waliduj(pt.schemat, { ...lista[0], daty: ["4.XI"] }).length, "daty tylko RRRR-MM-DD");
});
