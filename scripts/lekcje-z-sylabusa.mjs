// Lekcje v3 z sylabusa przez Message Batches API (połowa ceny), bez pisania treści w czacie.
// Spec: docs/kierunki/nowy-kierunek-spec.md, Etap 4. Skrypt NIC nie zapisuje do bazy: na końcu daje plik SQL do wklejenia.
//
// Jednorazowo:  cd scripts && npm install          (zależność: @anthropic-ai/sdk, scripts/package.json)
// Klucz:        export ANTHROPIC_API_KEY=…          (w Twoim terminalu; skrypt go nie zapisuje i nie wypisuje)
//
// Kroki (katalog roboczy: .tresci/<rocznik>/<przedmiot>/, poza gitem, bo repo jest publiczne):
//   node scripts/lekcje-z-sylabusa.mjs plan    --rocznik wpia-prawo-0-st-2026 --przedmiot "Wstęp do prawoznawstwa"
//        → plan.json: jedna lekcja na temat wykładu, tematy ćwiczeń dopięte do najbliższej lekcji (bez API, za darmo)
//   node scripts/lekcje-z-sylabusa.mjs wyslij  --rocznik … --przedmiot … [--tylko 1,2] [--model claude-opus-5-5] [--effort medium]
//        → batch piszący (model główny); id batcha w stan.json
//   node scripts/lekcje-z-sylabusa.mjs odbierz --rocznik … --przedmiot …
//        → gdy batch piszący skończony: zapis lekcji + kontrola bez AI (JSON, komplet pól, `not`, LaTeX) + batch kontroli (Haiku);
//          gdy batch kontroli skończony: werdykty w kontrola.json. Uruchamiaj co kilka minut, aż napisze „gotowe”.
//   node scripts/lekcje-z-sylabusa.mjs popraw  --rocznik … --przedmiot …   (ponownie pisze lekcje odrzucone przez kontrolę, z jej uwagami)
//   node scripts/lekcje-z-sylabusa.mjs sql     --rocznik … --przedmiot …   → tresci.sql (materials, materialContent, materialSimple, quizWhy)
//   node scripts/lekcje-z-sylabusa.mjs koszt   --rocznik … --przedmiot …   → koszt z zużycia tokenów (ceny batcha)
//   node scripts/lekcje-z-sylabusa.mjs probka  --rocznik … --przedmiot … --plik lekcja.json --nr 1   (gotowa lekcja z pliku, np. pilotaż)
//   node scripts/lekcje-z-sylabusa.mjs paczki  --rocznik … --przedmiot …   → scratch/<prefiks>/paczki/<id>.json (K3 do paczka-lekcji.py,
//        zamiast SQL; prefiks z kierunki/<rocznik>.json). Kierunek po angielsku (jezykZajec "en"): lekcje po angielsku, „simple” po polsku.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const args = process.argv.slice(2);
const cmd = args[0];
const opt = (n, d = null) => { const i = args.indexOf("--" + n); return i > 0 ? args[i + 1] : d; };
const ROCZNIK = opt("rocznik", "wpia-prawo-0-st-2026");
const PRZEDMIOT = opt("przedmiot");
const MODEL = opt("model", "claude-opus-5-5");          // pisze lekcje
const MODEL_QA = opt("model-kontroli", "claude-haiku-5-5"); // tańsza kontrola
const EFFORT = opt("effort", "medium");
// Ceny za 1 mln tokenów (cennik API, 2026-10); batch = połowa. Zapis do cache 1,25× wejścia, odczyt jak w tabeli.
const CENY = {
  "claude-opus-5-5": { in: 4, out: 20, cacheRead: 0.2 },
  "claude-sonnet-5-5": { in: 2, out: 10, cacheRead: 0.2 },
  "claude-haiku-5-5": { in: 0.1, out: 0.5, cacheRead: 0.01 },
};

const R = createRequire(import.meta.url)(path.join(ROOT, "rocznik.js"));
const rok = R.zbuduj(ROCZNIK);
if (!rok) throw new Error("Nieznany rocznik: " + ROCZNIK);
const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const SID = (rok.prefiks || "") + slug(PRZEDMIOT || "");
// Prawo ma własne zasady o przepisach; inne kierunki (Zarządzanie, FiR…) zasady o liczbach i firmach w przykładach.
const PRAWO = /prawo/i.test(rok.kierunek.pl);
const EN = rok.jezykZajec === "en";   // kierunek po angielsku (np. Economics and IT Applications): lekcja po angielsku jak w BM
const DIR = path.join(ROOT, ".tresci", ROCZNIK, slug(PRZEDMIOT || "brak"));
const STAN = path.join(DIR, "stan.json");
const czytaj = (f, d = null) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : d);
const zapisz = (f, x) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(x, null, 1) + "\n"); };
const stan = () => czytaj(STAN, { batches: [], usage: [] });

function kurs() {
  const syl = JSON.parse(fs.readFileSync(path.join(ROOT, rok.sylabus.plik), "utf8"));
  const c = syl.courses.find((x) => x.id === SID);
  if (!c) throw new Error(`Brak „${PRZEDMIOT}” (${SID}) w ${rok.sylabus.plik}`);
  return c;
}

// ---------- plan: jedna lekcja na temat wykładu, ćwiczenia do najbliższego tematu ----------
// Rdzeń słowa: 5 pierwszych liter (krótkie słowa 3, żeby „akt” i „akty” się spotkały); słowa 1–2-literowe pomijamy.
const rdzenie = (t) => new Set(t.toLowerCase().normalize("NFC").split(/[^\p{L}]+/u).filter((w) => w.length >= 3).map((w) => w.slice(0, w.length <= 4 ? 3 : 5)));
function planuj() {
  const c = kurs();
  const glowne = c.topics.W || c.topics.KON || c.topics.WAR || Object.values(c.topics)[0] || [];
  const reszta = Object.entries(c.topics).filter(([k]) => (c.topics.W ? k !== "W" : c.topics[k] !== glowne)).flatMap(([k, ts]) => ts.map((t) => ({ ...t, f: k })));
  const lekcje = glowne.map((t, i) => {
    const tytul = t.t.split(" - ")[0].replace(/^\d+\.\s*/, "").trim();
    // id materiału: krótki kod rocznika + przedmiot + numer, np. „prawo26-wstep-do-prawoznawstwa-01” (bez „:” i „~”)
    const kod = slug(rok.kierunek.kod) + String(rok.nabor % 100);
    return { nr: i + 1, id: `${kod}-${slug(PRZEDMIOT).slice(0, 28).replace(/-+$/, "")}-${String(i + 1).padStart(2, "0")}`, tytul, temat: t.t, h: t.h, cwiczenia: [] };
  });
  // Dopasowanie po wspólnych rdzeniach słów ważonych rzadkością (IDF w tematach lekcji, więc „prawa” prawie się nie liczy):
  // tytuł tematu ćwiczeń (przed nawiasem) z tytułem lekcji waży 3×, reszta tekstu 1×.
  const df = new Map();
  for (const l of lekcje) for (const r of rdzenie(l.temat)) df.set(r, (df.get(r) || 0) + 1);
  const waga = (r) => Math.log((lekcje.length + 1) / ((df.get(r) || 0) + 0.5));
  const wsp = (a, b) => [...a].filter((x) => b.has(x)).reduce((s, x) => s + waga(x), 0);
  const tytulTematu = (t) => t.replace(/^\d+\.\s*/, "").split(/[(-]/)[0];
  for (const t of reszta) {
    const a = rdzenie(t.t), at = rdzenie(tytulTematu(t.t));
    let best = 0, score = -1;
    lekcje.forEach((l, i) => { const s = 3 * wsp(at, rdzenie(l.tytul)) + wsp(a, rdzenie(l.temat)); if (s > score) { score = s; best = i; } });
    lekcje[best].cwiczenia.push(`${t.f === "CW" ? "Ćwiczenia" : t.f}: ${t.t}`);
  }
  // --mapa scratch/<prefiks>/mapa.json (Etap C): tylko tematy z koszykiem K3; tematy K1/K2 mają już lekcje z banku albo z BM.
  // Lekcja = temat główny K3 z dopiętymi ćwiczeniami K3; temat ćwiczeń K3 bez lekcji K3 staje się osobną lekcją (id z „c”).
  let lista = lekcje;
  if (opt("mapa")) {
    const mapa = JSON.parse(fs.readFileSync(path.resolve(opt("mapa")), "utf8"));
    const m = mapa.find((x) => x.przedmiot === c.id);
    if (!m) throw new Error(`Brak przedmiotu ${c.id} w mapie`);
    const k3 = new Set(m.tematy.filter((t) => t.koszyk === "K3").map((t) => t.temat));
    const kod = slug(rok.kierunek.kod) + String(rok.nabor % 100);
    lista = lekcje.filter((l) => k3.has(l.temat)).map((l) => ({ ...l, cwiczenia: l.cwiczenia.filter((t) => k3.has(t.replace(/^[^:]+: /, ""))) }));
    const dopiete = new Set(lista.flatMap((l) => l.cwiczenia.map((t) => t.replace(/^[^:]+: /, ""))));
    const glowneT = new Set(lekcje.map((l) => l.temat));
    reszta.filter((t) => k3.has(t.t) && !dopiete.has(t.t) && !glowneT.has(t.t)).forEach((t, i) => lista.push({
      nr: 0, id: `${kod}-${slug(PRZEDMIOT).slice(0, 26).replace(/-+$/, "")}-c${String(i + 1).padStart(2, "0")}`,
      tytul: t.t.split(" - ")[0].replace(/^\d+\.\s*/, "").trim().slice(0, 120), temat: `${t.f === "CW" ? "Ćwiczenia" : t.f}: ${t.t}`, h: t.h, cwiczenia: [] }));
    lista.forEach((l, i) => { l.nr = i + 1; });
  }
  for (const l of lista) if (!/^[a-z0-9-]+$/.test(l.id)) throw new Error("Zły id lekcji: " + l.id);
  return { rocznik: ROCZNIK, przedmiot: c.pl, sid: SID, kod: c.code, lekcje: lista, ...(opt("mapa") ? { tylkoK3: true } : {}) };
}

// ---------- prompt: stała część (przewodnik + wzorcowa lekcja) i kontekst przedmiotu w cache ----------
// --wzorzec <plik lekcji> (schemat kierunków 4.2: wzorcem K3 jest zatwierdzona lekcja PL z K2): lekcja przycięta do SCHEMAT,
// bez pól, których generator nie pisze (wykresy „chart”, notatki, ściągawka).
function przytnij(x, sch) {
  if (!sch) return undefined;
  if (sch.type === "array") return Array.isArray(x) ? x.map((v) => przytnij(v, sch.items)).filter((v) => v !== undefined) : undefined;
  if (sch.type === "object") {
    if (!x || typeof x !== "object") return undefined;
    if (sch.properties.type?.enum && !sch.properties.type.enum.includes(x.type)) return undefined;
    const o = {};
    for (const [k, v] of Object.entries(sch.properties)) { const w = przytnij(x[k], v); if (w !== undefined) o[k] = w; }
    return o;
  }
  return x === undefined ? undefined : x;
}
function wzorcowaLekcja() {
  if (opt("wzorzec")) {
    const d = JSON.parse(fs.readFileSync(path.resolve(opt("wzorzec")), "utf8"));
    return JSON.stringify(przytnij(d.content.lesson, SCHEMAT.properties.lesson), null, 1);
  }
  // Wzorzec formatu z prototypu lekcji v3 (BM, „Opportunity cost”): ten sam kształt danych, który czyta odtwarzacz.
  const s = fs.readFileSync(path.join(ROOT, "docs/lekcje-v3/prototyp.html"), "utf8");
  const a = s.indexOf("const DEMO_C"), b = s.indexOf("\n};", a) + 3;
  return JSON.stringify(new Function(s.slice(a, b) + "\nreturn DEMO_C;")().lesson, null, 1);
}
const PRZEWODNIK = () => `Piszesz lekcję do aplikacji do nauki „Skrót” dla studentów ${rok.ai.pl} (${rok.ai.kontekst}). Lekcja ma prowadzić do ZROZUMIENIA, nie do wkuwania definicji.

${EN ? "Język: ANGIELSKI (zajęcia są po angielsku), prosty i konkretny, jak lekcje Business Management; tylko pole simple po polsku." : "Język: polski, prosty i konkretny."} Zdania krótkie. Bez lania wody i bez zwrotów typu „warto zauważyć”. Terminy ${PRAWO ? "prawnicze" : "fachowe"} wyjaśniaj przy pierwszym użyciu.
Zakres: tylko temat z sylabusa podany w wiadomości (i dopięte do niego ćwiczenia). Nie przepisuj tekstu sylabusa: piszesz własne wyjaśnienia.
${PRAWO ? `Prawo: stan na rok akademicki ${rok.rokAkademicki}. Przepisy (Konstytucja RP, ustawy) cytuj tylko wtedy, gdy masz pewność numeru artykułu i treści; w razie wątpliwości opisz zasadę bez numeru. Nie wymyślaj orzeczeń, sygnatur ani nazwisk autorów.` : `Przykłady: polskie realia (zł, polskie firmy i sytuacje studenta). Firmy w kazusach fikcyjne albo bez konkretnych danych finansowych; nie podawaj prawdziwych statystyk, dat ani przepisów, jeśli nie masz pewności. Liczby w przykładach licz dokładnie i sprawdzaj rachunek. Nie wymyślaj nazwisk autorów ani tytułów książek.`}

Budowa (dokładnie jak we WZORCU niżej, te same pola):
- intro: 1–2 zdania: po co ta lekcja i co student będzie umiał.
- hook: pytanie z życia (kazus w 2–3 zdaniach), 3 odpowiedzi, „reveal” z rozwiązaniem, które lekcja wyjaśni.
- prereq: 1–2 pytania rozgrzewkowe z wiedzy ogólnej albo poprzednich lekcji.
- sections: 3 lub 4 części. Każda: h (tytuł), intuition (1–2 zdania obrazowo), body (markdown: akapity do ~60 słów, listy „- ”; najważniejsze pojęcie **pogrubione** w zdaniu, które je wyjaśnia, bo aplikacja robi z tego pytanie „uzupełnij”), visual (flow: 3–6 kroków; compare: cols + rows; layers: items {t, d}), example (kazus z krokami i odpowiedzią), mistake (typowy błąd: wrong, why, right), tip (krótka rada egzaminacyjna), check (pytanie), simple (ta część po polsku jak dla 12–13-latka, 2–4 zdania).
- faded: zadanie z krokami, w których część kroków ma "blank": true (student uzupełnia), plus answer.
- exercises: 3 zadania (level 1, 2, 3): krótki kazus albo polecenie, hint, answer z uzasadnieniem.
- transfer: zadanie w nowej sytuacji (inna dziedzina życia), hint, answer.
- recap: prompt (wyjaśnij koledze…), keys (4–5 punktów), model (wzorcowa odpowiedź, 3–5 zdań).
- formulas: zostaw pustą listę, chyba że temat ma schemat do zapamiętania (np. budowa normy) – wtedy 2–4 krótkie linijki.
- exit: 3 pytania „bilet wyjścia”, każde z "sec" = numer części (od 0), której dotyczy.

Pytania (check, prereq, exit, quiz): sprawdzają ZASTOSOWANIE w nowej sytuacji (kazus, przykład, rozróżnienie), nie definicję z pamięci. 3 albo 4 odpowiedzi. Złe odpowiedzi to typowe błędy studentów, nie absurdy. „correct” = indeks dobrej odpowiedzi (od 0). „why” = dlaczego dobra jest dobra. „not” = lista o długości równej liczbie odpowiedzi: dla dobrej pusty tekst, dla każdej złej jedno zdanie, na czym polega błąd.
Wzory LaTeX tylko w \\( … \\) i tylko gdy naprawdę potrzebne ${PRAWO ? "(w prawie zwykle wcale)" : "(w zarządzaniu rzadko)"}.

Poza lekcją w tym samym JSON:
- tldr: 2 zdania streszczenia.
- concepts: 5–8 pojęć: term (po polsku), en (odpowiednik angielski), definition (1–2 zdania własnymi słowami).
- flashcards: 8–10 fiszek {q, a}; q to pytanie o zrozumienie albo rozróżnienie, a to krótka odpowiedź.
- quiz: 8 pytań jak wyżej, każde z "explanation" (dlaczego), "not" oraz "dlaczego": {why: wyjaśnienie dla 12–13-latka, example: przykład z życia}.
- prosciej: wersja całej lekcji „Prościej” (jak dla 12–13-latka): intro, parts [{h, emoji, text, example, remember}] (3–4 części), words [{term, simple}] (3–5), check [{q, a}] (2–3).

${opt("wzorzec") ? "WZORZEC (zatwierdzona lekcja tego kierunku po polsku, z innego tematu; ten sam format, styl i poziom; piszesz o swoim temacie):" : "WZORZEC (format lekcji z innego przedmiotu, po angielsku; Ty piszesz po polsku o swoim temacie):"}
${wzorcowaLekcja()}`;

function kontekstPrzedmiotu(c) {
  const t = Object.entries(c.topics).map(([k, ts]) => `${k}:\n${ts.map((x) => `- ${x.t} (${x.h} h)`).join("\n")}`).join("\n");
  return `PRZEDMIOT: ${c.pl} (${rok.kierunek.pl}, ${rok.rok}. rok, semestr ${c.sem.join(", ")}; ${c.forms.map((f) => `${f.f} ${f.h} h, ${f.c}`).join("; ")}).
Cele: ${(c.goals || []).join(" ")}
Efekty uczenia się: ${(c.out || []).map((o) => `${o.k}: ${o.t}`).join(" | ")}
Tematy z sylabusa:
${t}
Sprawdzanie: ${(c.assess || []).map((a) => a.m).join(", ")}. ${(c.grading || []).join(" ")}
Literatura (tylko do orientacji w zakresie, nie cytuj): ${(c.lit || []).join("; ")}`;
}

// ---------- schemat odpowiedzi (structured outputs) ----------
const S = (props, extra = {}) => ({ type: "object", properties: props, required: Object.keys(props), additionalProperties: false, ...extra });
const str = { type: "string" }, strs = { type: "array", items: str }, int = { type: "integer" };
const MC = S({ q: str, options: strs, correct: int, why: str, not: strs });
const SCHEMAT = S({
  tytul: str, tldr: str,
  lesson: S({
    intro: str,
    hook: S({ q: str, options: strs, reveal: str }),
    prereq: { type: "array", items: MC },
    sections: { type: "array", items: S({
      h: str, intuition: str, body: str,
      visual: S({ type: { type: "string", enum: ["flow", "compare", "layers"] }, title: str, note: str, steps: strs, cols: strs, rows: { type: "array", items: strs }, items: { type: "array", items: S({ t: str, d: str }) } }),
      example: S({ task: str, steps: strs, answer: str }),
      mistake: S({ wrong: str, why: str, right: str }),
      tip: str, check: MC, simple: str,
    }) },
    faded: S({ task: str, steps: { type: "array", items: S({ text: str, blank: { type: "boolean" } }) }, answer: str }),
    exercises: { type: "array", items: S({ level: int, task: str, hint: str, answer: str }) },
    transfer: S({ task: str, hint: str, answer: str }),
    recap: S({ prompt: str, keys: strs, model: str }),
    formulas: strs,
    exit: { type: "array", items: S({ q: str, options: strs, correct: int, why: str, not: strs, sec: int }) },
  }),
  concepts: { type: "array", items: S({ term: str, en: str, definition: str }) },
  flashcards: { type: "array", items: S({ q: str, a: str }) },
  quiz: { type: "array", items: S({ q: str, options: strs, correct: int, explanation: str, not: strs, dlaczego: S({ why: str, example: str }) }) },
  prosciej: S({ intro: str, parts: { type: "array", items: S({ h: str, emoji: str, text: str, example: str, remember: str }) }, words: { type: "array", items: S({ term: str, simple: str }) }, check: { type: "array", items: S({ q: str, a: str }) } }),
});
const SCHEMAT_QA = S({ ok: { type: "boolean" }, ocena: int, problemy: { type: "array", items: S({ gdzie: str, co: str, waga: { type: "string", enum: ["blad", "uwaga"] } }) } });

// ---------- kontrola bez AI ----------
function sprawdz(x) {
  const bl = [];
  const L = x?.lesson;
  if (!L) return ["brak lesson"];
  const mc = (q, gdzie) => {
    if (!q?.q || !Array.isArray(q.options) || q.options.length < 3 || q.options.length > 4) bl.push(`${gdzie}: 3–4 odpowiedzi`);
    else {
      if (!(q.correct >= 0 && q.correct < q.options.length)) bl.push(`${gdzie}: zły indeks correct`);
      if (!Array.isArray(q.not) || q.not.length !== q.options.length) bl.push(`${gdzie}: „not” musi mieć ${q.options.length} pozycji`);
      else q.not.forEach((t, i) => { if (i !== q.correct && !String(t).trim()) bl.push(`${gdzie}: zła odpowiedź ${i} bez wyjaśnienia`); });
    }
  };
  if (!(L.sections?.length >= 3 && L.sections.length <= 4)) bl.push("3–4 części");
  (L.sections || []).forEach((s, k) => {
    if (!s.body || !/\*\*[^*]+\*\*/.test(s.body)) bl.push(`część ${k}: brak pogrubionego pojęcia`);
    if (!s.simple) bl.push(`część ${k}: brak „simple”`);
    mc(s.check, `część ${k} check`);
  });
  (L.prereq || []).forEach((q, i) => mc(q, `prereq ${i}`));
  if ((L.exit || []).length !== 3) bl.push("bilet wyjścia: 3 pytania");
  (L.exit || []).forEach((q, i) => { mc(q, `exit ${i}`); if (!(q.sec >= 0 && q.sec < (L.sections || []).length)) bl.push(`exit ${i}: zły sec`); });
  if ((L.exercises || []).length < 3) bl.push("3 zadania");
  if (!(L.faded?.steps || []).some((s) => s.blank)) bl.push("faded bez luki");
  if (!((x.quiz || []).length >= 8)) bl.push("quiz: 8 pytań");
  (x.quiz || []).forEach((q, i) => mc({ ...q, why: q.explanation }, `quiz ${i}`));
  if ((x.flashcards || []).length < 8) bl.push("fiszki: co najmniej 8");
  if ((x.concepts || []).length < 5) bl.push("pojęcia: co najmniej 5");
  if (!(x.prosciej?.parts || []).length) bl.push("brak „Prościej”");
  const tekst = JSON.stringify(x);
  if ((tekst.match(/\\\\\(/g) || []).length !== (tekst.match(/\\\\\)/g) || []).length) bl.push("niezamknięty LaTeX \\( \\)");
  return bl;
}

// ---------- API ----------
async function klient() {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    console.error("Brak klucza: ustaw ANTHROPIC_API_KEY w tym terminalu (export ANTHROPIC_API_KEY=…).");
    process.exit(1);
  }
  const { default: Anthropic } = await import(path.join(ROOT, "scripts/node_modules/@anthropic-ai/sdk/index.mjs"));
  return new Anthropic();
}
function prosbaPisz(c, plan, l, uwagi) {
  const sasiedzi = [plan.lekcje[l.nr - 2]?.tytul, plan.lekcje[l.nr]?.tytul];
  return {
    custom_id: `l${String(l.nr).padStart(2, "0")}`,
    params: {
      model: MODEL, max_tokens: 32000,
      // Pełny schemat lekcji jest za duży na structured outputs („compiled grammar is too large”, 8.11.2026), więc domyślnie
      // schemat idzie jako tekst w instrukcji, a strukturę sprawdza sprawdz(); --schemat wraca do ścisłego trybu.
      output_config: args.includes("--schemat") ? { effort: EFFORT, format: { type: "json_schema", schema: SCHEMAT } } : { effort: EFFORT },
      system: [
        { type: "text", text: PRZEWODNIK() + (args.includes("--schemat") ? "" : `\n\nODPOWIEDŹ: wyłącznie jeden obiekt JSON (bez komentarzy i bez \`\`\`), dokładnie według tego JSON Schema – wszystkie pola są wymagane:\n${JSON.stringify(SCHEMAT)}`), cache_control: { type: "ephemeral", ttl: "1h" } },
        { type: "text", text: kontekstPrzedmiotu(c), cache_control: { type: "ephemeral", ttl: "1h" } },
      ],
      messages: [{ role: "user", content:
        `Lekcja ${l.nr} z ${plan.lekcje.length}: „${l.tytul}”.\nTemat wykładu z sylabusa: ${l.temat}\n` +
        (l.cwiczenia.length ? `Dopięte ćwiczenia (wykorzystaj w zadaniach i przykładach):\n${l.cwiczenia.map((t) => "- " + t).join("\n")}\n` : "") +
        `Poprzednia lekcja: ${sasiedzi[0] || "brak (to pierwsza)"}. Następna: ${sasiedzi[1] || "brak (to ostatnia)"}.` +
        (uwagi ? `\n\nPoprzednia wersja tej lekcji nie przeszła kontroli. Popraw te problemy:\n${uwagi}` : "") }],
    },
  };
}
function prosbaKontrola(nr, x) {
  return {
    custom_id: "k" + nr,
    params: {
      model: MODEL_QA, max_tokens: 8000,
      output_config: { format: { type: "json_schema", schema: SCHEMAT_QA } },
      system: [{ type: "text", text: `Jesteś recenzentem lekcji dla studentów ${rok.ai.pl}. Sprawdź lekcję (JSON) i zgłoś tylko konkretne problemy:
- błąd merytoryczny ${PRAWO ? "w prawie albo przepis/artykuł, który wygląda na zmyślony" : "albo rachunek w przykładzie, który się nie zgadza, albo zmyślone dane/statystyka"} (waga „blad”);
- pytanie check/exit/quiz sprawdza tylko definicję z pamięci zamiast zastosowania (waga „uwaga”);
- zła odpowiedź jest absurdalna albo „not” nie wyjaśnia błędu (waga „uwaga”);
- dobra odpowiedź jest dyskusyjna albo są dwie dobre (waga „blad”);
- tekst nie po polsku albo „simple”/„prosciej” za trudne dla 12–13-latka (waga „uwaga”).
ok = false tylko przy co najmniej jednym „blad”. ocena 1–5 (5 = gotowe dla studentów).` }],
      messages: [{ role: "user", content: JSON.stringify(x) }],
    },
  };
}
async function wyslijBatch(requests, rodzaj) {
  const client = await klient();
  const b = await client.messages.batches.create({ requests });
  const st = stan(); st.batches.push({ id: b.id, rodzaj, at: new Date().toISOString(), ids: requests.map((r) => r.custom_id), model: requests[0].params.model, odebrany: false });
  zapisz(STAN, st);
  console.log(`Wysłano batch ${rodzaj} (${requests.length} próśb): ${b.id}. Sprawdzaj: node scripts/lekcje-z-sylabusa.mjs odbierz --rocznik ${ROCZNIK} --przedmiot "${PRZEDMIOT}"`);
}

async function odbierz() {
  const client = await klient();
  const st = stan();
  const plan = czytaj(path.join(DIR, "plan.json"));
  let nowe = [];
  for (const b of st.batches.filter((x) => !x.odebrany)) {
    const info = await client.messages.batches.retrieve(b.id);
    if (info.processing_status !== "ended") { console.log(`${b.rodzaj} ${b.id}: ${info.processing_status} (w toku: ${info.request_counts.processing})`); continue; }
    for await (const r of await client.messages.batches.results(b.id)) {
      const nr = Number(r.custom_id.slice(1));
      if (r.result.type !== "succeeded") { console.log(`  ${r.custom_id}: ${r.result.type}`); continue; }
      const m = r.result.message;
      st.usage.push({ model: m.model, ...m.usage });
      if (m.stop_reason === "refusal" || m.stop_reason === "max_tokens") { console.log(`  ${r.custom_id}: ${m.stop_reason}`); continue; }
      const text = m.content.filter((x) => x.type === "text").map((x) => x.text).join("");
      let x; try { x = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)); } catch { console.log(`  ${r.custom_id}: zły JSON`); continue; }
      if (b.rodzaj === "pisz") {
        zapisz(path.join(DIR, `lekcja-${String(nr).padStart(2, "0")}.json`), x);
        const bl = sprawdz(x);
        console.log(`  lekcja ${nr}: ${bl.length ? "kontrola bez AI: " + bl.join("; ") : "kontrola bez AI OK"}`);
        nowe.push([nr, x]);
      } else {
        const k = czytaj(path.join(DIR, "kontrola.json"), {});
        k[nr] = x; zapisz(path.join(DIR, "kontrola.json"), k);
        console.log(`  lekcja ${nr}: ${x.ok ? "OK" : "DO POPRAWY"}, ocena ${x.ocena}, problemów ${x.problemy.length}`);
      }
    }
    b.odebrany = true;
  }
  zapisz(STAN, st);
  if (nowe.length) await wyslijBatch(nowe.map(([nr, x]) => prosbaKontrola(nr, x)), "kontrola");
  else if (st.batches.every((b) => b.odebrany)) console.log("Gotowe. Dalej: sql (albo popraw, jeśli kontrola coś odrzuciła).");
  void plan;
}

// ---------- dokumenty jednej lekcji ----------
// Dokumenty jednej lekcji (materials, materialContent, quizWhy, materialSimple) z odpowiedzi modelu: wspólne dla „sql” i „pliki”.
const FORMY = { W: "wykład", CW: "ćwiczenia", LAB: "laboratorium", KON: "konwersatorium", SEM: "seminarium" };
function sylRefLekcji(l) {
  // Numer tematu w sylabusie (forma + numer), a nie numer lekcji w planie (plan z --mapa zawiera tylko część tematów).
  const c = kurs(), out = [];
  const tem = [l.temat.replace(/^[^:]+: /, ""), ...l.cwiczenia.map((t) => t.replace(/^[^:]+: /, ""))];
  for (const [f, ts] of Object.entries(c.topics)) ts.forEach((t, i) => { if (tem.includes(t.t)) out.push([f, i + 1]); });
  const po = {};
  for (const [f, n] of out) (po[f] ||= []).push(n);
  return Object.entries(po).map(([f, ns]) => `${FORMY[f] || f.toLowerCase()}, ${ns.length > 1 ? "tematy" : "temat"} ${ns.join(", ")}`).join(" · ") || `wykład, temat ${l.nr}`;
}
function dokumenty(l, x, k, plan = czytaj(path.join(DIR, "plan.json"))) {
    const L = { v2: true, ...x.lesson };
    // Format v4 (lekcje-walidator.py): przy poprawnej odpowiedzi not[correct] = null, a nie pusty tekst (konwencja v3 z promptu).
    for (const q of [...(L.sections || []).map((s) => s.check), ...(L.exit || []), ...(L.prereq || [])]) if (q && Array.isArray(q.not) && q.correct in q.not) q.not[q.correct] = null;
    const content = { v: 2, tldr: x.tldr, concepts: x.concepts.map((c) => ({ term: c.term, en: c.en, definition: c.definition })), flashcards: x.flashcards,
      quiz: x.quiz.map((q) => ({ q: q.q, options: q.options, correct: q.correct, explanation: q.explanation })), lesson: L };
    const material = { kind: "lesson", v: 2, source: "sylabus", subjectId: plan.sid, title: x.tytul || l.tytul, order: l.nr, sylRef: sylRefLekcji(l), lang: rok.jezykZajec,
      fileName: `Sylabus ${rok.kierunek.pl} ${rok.rokAkademicki}`, fileType: "sylabus", createdAt: Date.now(), topicCount: L.sections.length,
      conceptCount: content.concepts.length, flashcardCount: content.flashcards.length, quizCount: content.quiz.length, generator: { model: MODEL, kontrola: k[l.nr]?.ocena ?? null } };
    const why = { items: Object.fromEntries(x.quiz.map((q, i) => [i, { why: q.dlaczego.why, example: q.dlaczego.example, not: q.not }])), at: Date.now() };
    const simple = { ...x.prosciej, by: "auto", at: Date.now() };
    return { material, content, why, simple };
}

// ---------- gotowe lekcje (wspólne dla sql, paczki i pliki) ----------
function gotowe() {
  const plan = czytaj(path.join(DIR, "plan.json"));
  if (!plan) throw new Error(`Brak ${path.relative(ROOT, path.join(DIR, "plan.json"))}: najpierw krok „plan”, potem „wyslij” i „odbierz”.`);
  const k = czytaj(path.join(DIR, "kontrola.json"), {});
  const wyb = opt("tylko") ? opt("tylko").split(",").map(Number) : plan.lekcje.map((l) => l.nr);
  const out = [], pominiete = [];
  for (const l of plan.lekcje.filter((x) => wyb.includes(x.nr))) {
    const f = path.join(DIR, `lekcja-${String(l.nr).padStart(2, "0")}.json`);
    const x = czytaj(f);
    if (!x) { pominiete.push(`${l.nr} (brak pliku)`); continue; }
    const bl = sprawdz(x);
    if (bl.length) { pominiete.push(`${l.nr} (kontrola bez AI: ${bl[0]})`); continue; }
    if (k[l.nr] && !k[l.nr].ok && !args.includes("--z-uwagami")) { pominiete.push(`${l.nr} (kontrola AI: do poprawy)`); continue; }
    const { material, content, why, simple } = dokumenty(l, x, k, plan);
    out.push({ l, material, content, simple, why });
  }
  return { plan, lekcje: out, pominiete };
}

// ---------- paczki: K3 do schematu kierunków (scripts/paczka-lekcji.py → Panel AI → Paczka lekcji) ----------
function paczki() {
  const pk = path.join(ROOT, "kierunki", ROCZNIK + ".json");
  if (!fs.existsSync(pk)) throw new Error(`Brak ${path.relative(ROOT, pk)} (plik kierunku)`);
  const P = JSON.parse(fs.readFileSync(pk, "utf8")).prefiks;
  const { lekcje, pominiete } = gotowe();
  if (!lekcje.length) throw new Error("Brak lekcji do zapisania: " + pominiete.join(", "));
  const dir = path.join(ROOT, "scratch", P, "paczki");
  fs.mkdirSync(dir, { recursive: true });
  for (const { l, material, content, simple, why } of lekcje) {
    const id = l.id.startsWith(P + "-") ? l.id : `${P}-${l.id}`;
    fs.writeFileSync(path.join(dir, id + ".json"), JSON.stringify({ id, subjectId: material.subjectId, rocznik_id: ROCZNIK, zrodlo: "k3:sylabus",
      title: material.title, order: material.order, sylRef: material.sylRef, content, simple, why }, null, 1));
  }
  console.log(`K3: ${lekcje.length} lekcji → scratch/${P}/paczki${pominiete.length ? "\nPominięte: " + pominiete.join(", ") : ""}\nDalej: python3 scripts/paczka-lekcji.py kierunki/${ROCZNIK}.json scratch/${P}/paczki --nazwa k3`);
}

// ---------- SQL do wklejenia (po v23) ----------
function sql() {
  const lit = (o) => { const s = JSON.stringify(o); if (s.includes("$skrot$")) throw new Error("tekst zawiera $skrot$"); return `$skrot$${s}$skrot$::jsonb`; };
  const wiersze = [], atrapa = {};
  const { plan, lekcje, pominiete } = gotowe();
  for (const { l, material, content, simple, why } of lekcje) {
    for (const [kol, d] of [["materials", material], ["materialContent", content], ["materialSimple", simple], ["quizWhy", why]]) {
      wiersze.push(`  ('${kol}', '${l.id}', ${lit(d)}, '${ROCZNIK}')`);
      (atrapa[kol] ||= {})[l.id] = d;
    }
  }
  const out = `-- Treści: ${plan.przedmiot} (${ROCZNIK}), lekcje z sylabusa. Wygenerowane ${new Date().toISOString().slice(0, 10)} skryptem scripts/lekcje-z-sylabusa.mjs.
-- Wklej w Supabase → SQL Editor → Run, PO skrot-v23-rocznik-dostep.sql. Można uruchamiać wielokrotnie (nadpisuje te same lekcje).
-- Widzą je tylko osoby z rocznika ${ROCZNIK} (reguły v23).
insert into public.nauka_docs (kolekcja, id, data, rocznik_id) values
${wiersze.join(",\n")}
on conflict (kolekcja, id) do update set data = excluded.data, updated_at = now();
`;
  if (!wiersze.length) throw new Error("Brak lekcji do zapisania: " + pominiete.join(", "));
  fs.writeFileSync(path.join(DIR, "tresci.sql"), out);
  // te same dokumenty dla atrapy Supabase (docs/gry/test: localStorage „mock-docs”), do podglądu w aplikacji bez bazy
  fs.writeFileSync(path.join(DIR, "tresci-atrapa.json"), JSON.stringify(atrapa));
  console.log(`tresci.sql: ${wiersze.length / 4} lekcji → ${path.join(DIR, "tresci.sql")}${pominiete.length ? "\nPominięte: " + pominiete.join(", ") : ""}`);
}

function koszt() {
  const st = stan();
  let suma = 0;
  for (const u of st.usage) {
    const c = CENY[u.model] || CENY[Object.keys(CENY).find((k) => String(u.model).startsWith(k))] || CENY["claude-opus-5-5"];
    const zl = ((u.input_tokens || 0) * c.in + (u.cache_creation_input_tokens || 0) * c.in * 1.25 + (u.cache_read_input_tokens || 0) * c.cacheRead + (u.output_tokens || 0) * c.out) / 1e6 / 2;
    suma += zl;
  }
  const plan = czytaj(path.join(DIR, "plan.json"));
  const pisz = st.usage.filter((u) => !String(u.model).includes("haiku")).length;
  console.log(`Koszt (ceny batcha, USD): ${suma.toFixed(3)} za ${pisz} lekcji z kontrolą. Szacunek całego przedmiotu (${plan?.lekcje.length} lekcji): ${(pisz ? (suma / pisz) * plan.lekcje.length : 0).toFixed(2)} USD.`);
  console.log("Dokładne kwoty: konsola Anthropic → Usage.");
}

// ---------- uruchomienie ----------
if (!PRZEDMIOT && cmd !== "pomoc") { console.error('Podaj --przedmiot "Nazwa z sylabusa"'); process.exit(1); }
if (cmd === "plan") {
  const p = planuj(); zapisz(path.join(DIR, "plan.json"), p);
  for (const l of p.lekcje) console.log(`${l.nr}. ${l.tytul} [${l.id}]${l.cwiczenia.length ? "  + ćw.: " + l.cwiczenia.length : ""}`);
  console.log(`→ ${path.join(DIR, "plan.json")}`);
} else if (cmd === "wyslij" || cmd === "popraw") {
  const plan = czytaj(path.join(DIR, "plan.json")); if (!plan) throw new Error("Najpierw: plan");
  const c = kurs(), k = czytaj(path.join(DIR, "kontrola.json"), {});
  let lista = plan.lekcje;
  if (opt("tylko")) { const t = opt("tylko").split(",").map(Number); lista = lista.filter((l) => t.includes(l.nr)); }
  if (cmd === "popraw") lista = lista.filter((l) => k[l.nr] && !k[l.nr].ok);
  if (!lista.length) { console.log("Nic do wysłania."); process.exit(0); }
  if (args.includes("--na-sucho")) {
    // bez API: zapisuje prośby i liczy koszt (znaki/3 ≈ tokeny; wyjście ≈ 14 tys. tokenów na lekcję z „Prościej”, quizem i myśleniem)
    const req = lista.map((l) => prosbaPisz(c, plan, l, null));
    zapisz(path.join(DIR, "zapytania-na-sucho.json"), req);
    const cena = CENY[MODEL], stale = (req[0].params.system[0].text.length + req[0].params.system[1].text.length) / 3;
    const zmienne = req.reduce((a, q) => a + q.params.messages[0].content.length / 3, 0), wyj = 14000 * req.length;
    const usd = (stale * cena.in * 1.25 + stale * (req.length - 1) * cena.cacheRead + zmienne * cena.in + wyj * cena.out) / 1e6 / 2;
    const qa = (wyj * 1.1 * CENY[MODEL_QA].in + 800 * req.length * CENY[MODEL_QA].out) / 1e6 / 2;
    console.log(`Na sucho: ${req.length} lekcji, ${MODEL} (effort ${EFFORT}), Batch −50%: ~${usd.toFixed(2)} $ + kontrola ${MODEL_QA} ~${qa.toFixed(2)} $ = ~${(usd + qa).toFixed(2)} $`);
    process.exit(0);
  }
  await wyslijBatch(lista.map((l) => prosbaPisz(c, plan, l, cmd === "popraw" ? k[l.nr].problemy.map((p) => `- ${p.gdzie}: ${p.co}`).join("\n") : null)), "pisz");
} else if (cmd === "odbierz") await odbierz();
else if (cmd === "sql") sql();
else if (cmd === "paczki") paczki();
else if (cmd === "pliki") {
  // Pliki lekcji (format eksportu + rocznik_id + zrodlo) dla scripts/paczka-lekcji.py → Panel AI „Paczka lekcji”. Nic nie zapisuje do bazy.
  const plan = czytaj(path.join(DIR, "plan.json")), k = czytaj(path.join(DIR, "kontrola.json"), {});
  const out = path.resolve(opt("wyjscie", path.join(DIR, "pliki"))); fs.mkdirSync(out, { recursive: true });
  const pomin = [];
  for (const l of plan.lekcje) {
    const x = czytaj(path.join(DIR, `lekcja-${String(l.nr).padStart(2, "0")}.json`));
    if (!x) { pomin.push(`${l.nr} (brak pliku)`); continue; }
    const bl = sprawdz(x);
    if (bl.length) { pomin.push(`${l.nr} (kontrola bez AI: ${bl[0]})`); continue; }
    if (!k[l.nr]) { pomin.push(`${l.nr} (brak kontroli AI)`); continue; }
    if (!k[l.nr].ok && !args.includes("--z-uwagami")) { pomin.push(`${l.nr} (kontrola AI: do poprawy)`); continue; }
    const { material, content, why, simple } = dokumenty(l, x, k);
    zapisz(path.join(out, l.id + ".json"), { id: l.id, subjectId: material.subjectId, rocznik_id: ROCZNIK, zrodlo: "k3:sylabus", title: material.title,
      order: material.order, sylRef: material.sylRef, content, simple, why, generator: material.generator });
  }
  console.log(`Pliki: ${plan.lekcje.length - pomin.length}/${plan.lekcje.length} → ${out}${pomin.length ? "\nPominięte: " + pomin.join(", ") : ""}`);
}
else if (cmd === "koszt") koszt();
else if (cmd === "probka") {
  const x = JSON.parse(fs.readFileSync(opt("plik"), "utf8")), nr = Number(opt("nr", "1"));
  const bl = sprawdz(x);
  console.log(bl.length ? "Kontrola bez AI: " + bl.join("; ") : "Kontrola bez AI OK");
  zapisz(path.join(DIR, `lekcja-${String(nr).padStart(2, "0")}.json`), x);
} else if (cmd === "prompt") {
  // podgląd promptu i schematu (bez API)
  const plan = czytaj(path.join(DIR, "plan.json")), l = plan.lekcje[Number(opt("nr", "1")) - 1];
  console.log(JSON.stringify(prosbaPisz(kurs(), plan, l, null), null, 1).slice(0, Number(opt("ile", "4000"))));
} else console.log("Polecenia: plan, wyslij, odbierz, popraw, sql, koszt, probka, prompt (opis na górze pliku).");
