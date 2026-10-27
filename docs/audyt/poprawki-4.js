// Audyt, paczka 4: poprawki z „uwag do decyzji” (27.10.2026).
// Jak użyć: zaloguj się na skrotbm.pl jako starosta, otwórz konsolę (F12 → Console), wklej cały plik i Enter.
// Najpierw działa na sucho (SUCHO = true): pokazuje, co by zmienił, i niczego nie zapisuje.
// Gdy wszystko jest „OK”, zmień SUCHO na false i wklej jeszcze raz.
// Kopia zmienianych dokumentów trafia do localStorage pod kluczem bm-backup-audyt-4.
// Cofnięcie: wklej w konsoli funkcję cofnij() z dołu pliku i wywołaj cofnij().
(async () => {
  const SUCHO = true;
  // Kilka wpisów z tym samym id i p to warianty odmiany: zadziała ten, który pasuje, reszta pokaże „NIE ZNALEZIONO”.
  const FIXES = [
    {
      "c": "S",
      "id": "an-16-definite-integral",
      "p": "parts.5.text",
      "find": "zyskiem sprzedawców",
      "rep": "korzyścią sprzedawców"
    },
    {
      "c": "S",
      "id": "an-16-definite-integral",
      "p": "parts.5.text",
      "find": "zysk sprzedawców",
      "rep": "korzyść sprzedawców"
    },
    {
      "c": "S",
      "id": "an-16-definite-integral",
      "p": "words.8.simple",
      "find": "zysk sprzedawców",
      "rep": "korzyść sprzedawców"
    },
    {
      "c": "S",
      "id": "an-16-definite-integral",
      "p": "words.8.simple",
      "find": "Zysk sprzedawców",
      "rep": "Korzyść sprzedawców"
    },
    {
      "c": "C",
      "id": "syl-it",
      "p": "notes.7",
      "find": "means a real association",
      "rep": "means a positive association"
    },
    {
      "c": "C",
      "id": "fn-06-debt",
      "p": "lesson.sections.3.body",
      "find": "WIBOR/WIRON",
      "rep": "WIBOR/POLSTR"
    },
    {
      "c": "C",
      "id": "fn-06-debt",
      "p": "lesson.sections.3.mistake.why",
      "find": "WIBOR/WIRON",
      "rep": "WIBOR/POLSTR"
    },
    {
      "c": "C",
      "id": "fn-06-debt",
      "p": "flashcards.5.a",
      "find": "WIBOR/WIRON",
      "rep": "WIBOR/POLSTR"
    },
    {
      "c": "C",
      "id": "fn-03-financial-system",
      "p": "lesson.sections.2.example.task",
      "find": "PKN Orlen",
      "rep": "Orlen"
    },
    {
      "c": "C",
      "id": "zzl-04-job-analysis",
      "p": "lesson.exercises.3.answer",
      "find": "sanitary-epidemiological certificate (health booklet)",
      "rep": "sanitary-epidemiological certificate"
    },
    {
      "c": "C",
      "id": "fn-10-public",
      "p": "lesson.sections.5.body",
      "find": "general subsidies (e.g. the education subsidy)",
      "rep": "general subsidies (since 2025 a single general subsidy that includes an education component)"
    },
    {
      "c": "C",
      "id": "mk-03-gdp",
      "p": "tldr",
      "find": "plus indirect taxes",
      "rep": "plus indirect taxes less subsidies"
    },
    {
      "c": "C",
      "id": "pz-09-motivation",
      "p": "concepts.8.definition",
      "find": "negative or no consequences",
      "rep": "unpleasant consequences (punishment) or no consequences"
    },
    {
      "c": "C",
      "id": "pz-12-processes",
      "p": "lesson.sections.4.body",
      "find": "product owner, scrum master, development team",
      "rep": "product owner, scrum master, developers"
    },
    {
      "c": "C",
      "id": "an-09-sketching-graphs",
      "p": "concepts.7.pl",
      "find": "zbiór wartości (przeciwdziedzina)",
      "rep": "zbiór wartości"
    },
    {
      "c": "C",
      "id": "an-08-lhospital",
      "p": "lesson.sections.5.tip",
      "find": "The answer can be any positive number",
      "rep": "The answer can be any number ≥ 0, or even +∞"
    },
    {
      "c": "S",
      "id": "pr-02-norms",
      "p": "parts.5.text",
      "find": "wygrywa wyższy, nowszy albo bardziej szczegółowy",
      "rep": "wygrywa wyższy, nowszy (gdy oba akty są tej samej rangi) albo bardziej szczegółowy"
    },
    {
      "c": "S",
      "id": "pr-02-norms",
      "p": "parts.5.remember",
      "find": "Wyższy, nowszy, szczególny – wygrywa",
      "rep": "Wyższy, nowszy (przy tej samej randze), szczególny – wygrywa"
    },
    {
      "c": "C",
      "id": "eb-07-profit",
      "p": "concepts.2.definition",
      "find": "it is lower than accounting profit",
      "rep": "it is usually lower than accounting profit"
    },
    {
      "c": "C",
      "id": "mk-06-inflation",
      "p": "lesson.sections.1.body",
      "find": "household budget surveys",
      "rep": "national accounts data on household consumption"
    },
    {
      "c": "C",
      "id": "mk-05-unemployment",
      "p": "lesson.sections.0.body",
      "find": "people aged 15 and over",
      "rep": "people aged 15–89"
    },
    {
      "c": "W",
      "id": "teams-makro-l1",
      "p": "items.5.not.2",
      "find": "też nie są ujemne",
      "rep": "też zwykle nie są ujemne"
    },
    {
      "c": "C",
      "id": "teams-fin-l1",
      "p": "concepts.14.pl",
      "find": "Edukacja finansowa",
      "rep": "Wiedza finansowa"
    },
    {
      "c": "C",
      "id": "teams-pz-c3",
      "p": "concepts.15.pl",
      "find": "prognoza kroczaca",
      "rep": "prognoza krocząca"
    },
    {
      "c": "C",
      "id": "an-03-limits-continuity",
      "p": "concepts.6.pl",
      "find": "nieciągłość nieskończona (drugiego rodzaju)",
      "rep": "nieciągłość nieskończona (szczególny przypadek nieciągłości drugiego rodzaju)"
    }
  ];

  const db = await window.claude.use("db");
  const COL = { C: "materialContent", S: "materialSimple", W: "quizWhy" };
  const docs = new Map(), backup = {}, wynik = [];
  const at = (o, p) => p.split(".").reduce((x, k) => (x == null ? x : x[/^\d+$/.test(k) ? +k : k]), o);
  const put = (o, p, v) => { const ks = p.split("."), last = ks.pop(); at(o, ks.join("."))[/^\d+$/.test(last) ? +last : last] = v; };

  for (const f of FIXES) {
    const key = COL[f.c] + "/" + f.id;
    if (!docs.has(key)) {
      const snap = await db.doc(key).get();
      docs.set(key, snap.exists ? snap.data() : null);
      if (snap.exists) backup[key] = JSON.parse(JSON.stringify(snap.data()));
    }
    const d = docs.get(key);
    const s = d && at(d, f.p);
    if (typeof s !== "string") { wynik.push({ status: "BRAK POLA", id: f.id, p: f.p }); continue; }
    const n = s.split(f.find).length - 1;
    if (n !== 1) { wynik.push({ status: n ? `${n}× (niejednoznaczne)` : "NIE ZNALEZIONO", id: f.id, p: f.p, find: f.find }); continue; }
    put(d, f.p, s.replace(f.find, () => f.rep));
    wynik.push({ status: "OK", id: f.id, p: f.p, find: f.find, rep: f.rep });
  }
  console.table(wynik.map(({ status, id, p }) => ({ status, id, p })));
  const zmienione = [...new Set(wynik.filter((w) => w.status === "OK").map((w) => COL[FIXES.find((f) => f.id === w.id && f.p === w.p).c] + "/" + w.id))];
  if (SUCHO) { console.log(`Na sucho: ${wynik.filter((w) => w.status === "OK").length}/${FIXES.length} poprawek pasuje, ${zmienione.length} dokumentów. Nic nie zapisano.`); return; }
  localStorage.setItem("bm-backup-audyt-4", JSON.stringify(Object.fromEntries(zmienione.map((k) => [k, backup[k]]))));
  for (const k of zmienione) await db.doc(k).set(docs.get(k));
  console.log(`Zapisano ${zmienione.length} dokumentów. Kopia: localStorage „bm-backup-audyt-4”. Odśwież stronę.`);
})();

// async function cofnij() { const db = await window.claude.use("db"); const b = JSON.parse(localStorage.getItem("bm-backup-audyt-4") || "{}"); for (const [k, v] of Object.entries(b)) await db.doc(k).set(v); console.log("Przywrócono", Object.keys(b).length, "dokumentów."); }
