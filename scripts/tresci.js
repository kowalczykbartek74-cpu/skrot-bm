// Kontrole jakości treści (etap 12 „Systemy z Zdawalni w Skrócie”). Czysta logika, bez DOM i bazy.
// Port zasad z zdawalni-web/tests: no-invented-values, copy-forbidden, copy-gender, lesson-content (liczby liczone
// ponownie), contrast (WCAG). Używają: scripts/tresci-kontrola.mjs (paczki lekcji) i tests/tresci.test.js (stałe pliki).
"use strict";
const path = require("node:path");
const fs = require("node:fs");
const V4 = require("../lekcje-v4.js");

// ---------------- teksty lekcji: wszystkie napisy ze ścieżkami ----------------
// Pola techniczne (nie są tekstem dla studenta).
const SKIP_KEYS = new Set(["id", "subjectId", "kind", "type", "sig", "icon", "img", "src", "url", "href", "color", "unit", "calc", "conf", "key"]);
function strings(node, at, out) {
  out = out || [];
  if (typeof node === "string") out.push({ path: at, text: node });
  else if (Array.isArray(node)) node.forEach((x, i) => strings(x, `${at}[${i}]`, out));
  else if (node && typeof node === "object") for (const [k, v] of Object.entries(node)) if (!SKIP_KEYS.has(k)) strings(v, at ? `${at}.${k}` : k, out);
  return out;
}
// Napisy lekcji: tytuł + treść. doc = { id, subjectId, title, content }.
const lessonStrings = (doc) => strings(doc.title || "", "title").concat(strings(doc.content || {}, ""));

// ---------------- 1. liczby, daty, kwoty, numery artykułów ----------------
// Nie blokują, ale każda trafia na listę do przejrzenia ze źródłem (jak no-invented-values: liczby, których nie wymyślamy).
const MONTHS = "stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia|january|february|march|april|may|june|july|august|september|october|november|december";
const NUM = String.raw`\d+(?:[  ]\d{3})*(?:[.,]\d+)?`;
const VALUE_RULES = [
  ["kwota", new RegExp(String.raw`(?:[$€£]\s?${NUM}(?:\s?(?:mln|mld|tys\.|bn|m|k)\b)?|${NUM}\s?(?:mln\s|mld\s|tys\.\s|bln\s)?(?:zł|złotych|PLN|EUR|USD|GBP|CHF|euro|€|\$|gr\b|dolar\p{L}*))`, "giu")],
  ["procent", new RegExp(String.raw`${NUM}\s?(?:%|proc\.|procent\p{L}*|percent\b|p\.\s?p\.|pp\b|bps\b)`, "giu")],
  ["data", new RegExp(String.raw`(?<![\d.,])(?:0?[1-9]|[12]\d|3[01])\.(?:0?[1-9]|1[0-2])(?:\.(?:19|20)\d\d)?(?![\d,]|\.\d)|(?<!\d)(?:0?[1-9]|[12]\d|3[01])\s(?:${MONTHS})(?:\s(?:19|20)\d\d)?(?!\p{L})`, "giu")],
  ["rok", /(?<![\d.,\/{])(?:1[5-9]\d\d|20\d\d)(?![\d.,%]|\s?(?:zł|PLN|EUR|USD|€|\$))(?:\s?r\.)?/gu],
  ["artykuł", /(?:(?<!\p{L})(?:art\.|artykuł\p{L}*|article|ust\.|pkt|par\.|section|sec\.)\s?\d+[a-z]?(?:\s?(?:§|ust\.|pkt|lit\.|zd\.)\s?\d*[a-z]?)*|§\s?\d+[a-z]?(?:\s?(?:ust\.|pkt|lit\.)\s?\d+[a-z]?)*|Dz\.\s?U\.[^.;,)]{0,30}|(?<!\p{L})(?:k\.c\.|k\.p\.c\.|k\.k\.|k\.p\.k\.|k\.p\.a\.|k\.s\.h\.|k\.p\.|k\.r\.o\.)(?!\p{L}))/giu],
  ["liczba", new RegExp(String.raw`(?<![\d.,])\d{1,3}(?:[  ]\d{3})+(?:[.,]\d+)?(?![\d])|(?<![\d.,])\d{5,}(?:[.,]\d+)?(?![\d])`, "gu")],
];
const stripLatex = (s) => String(s).replace(/\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g, (m) => " ".repeat(m.length));
// Pola, w których liczby są losowane albo są tylko danymi zadania (sprawdza je rachunek, nie przegląd źródła):
// szablony gen, opcje odpowiedzi, haczyk, rozgrzewka, przykład, ćwiczenia, „faded”, transfer, zadania rozwiązane.
const VALUE_SKIP = /^lesson\.gen\[/;
const VALUE_EXAMPLE = /(^|\.)(options\[\d+\]|not\[\d+\]|wrong|hook|prereq\[\d+\]|example|exercises\[\d+\]|faded|transfer|worked\[\d+\]|visual)(\.|\[|$)/;

function valueHits(text) {
  const s = stripLatex(text), hits = [], taken = [];
  for (const [kind, re] of VALUE_RULES) {
    for (const m of s.matchAll(re)) {
      const a = m.index, b = a + m[0].length;
      if (taken.some(([x, y]) => a < y && b > x)) continue; // jedna wartość = jeden typ (kwota przed liczbą itd.)
      taken.push([a, b]);
      hits.push({ typ: kind, tekst: m[0].trim(), kontekst: s.slice(Math.max(0, a - 50), Math.min(s.length, b + 50)).replace(/\s+/g, " ").trim() });
    }
  }
  return hits;
}

// ---------------- 2. zakazane sformułowania (lista do zatwierdzenia: scripts/tresci-zakazane.json) ----------------
const NEG_BEFORE = /(?:\bnie|\bnigdy|\bbrak|\bbez|\bnot|\bno|\bnever|n't|\bwithout)\s+(?:\p{L}+\s+){0,2}$/iu;
function loadForbidden(file) {
  const j = JSON.parse(fs.readFileSync(file || path.join(__dirname, "tresci-zakazane.json"), "utf8"));
  return j.frazy.map((f) => ({ ...f, re: new RegExp(`(?<![\\p{L}\\d])(?:${f.wzorzec || f.fraza.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})(?![\\p{L}])`, "giu") }));
}
// zakres: "lekcje" albo "strona".
function forbiddenHits(text, list, zakres) {
  const out = [], s = String(text);
  for (const f of list) {
    if (zakres && f.zakres && !f.zakres.includes(zakres)) continue;
    for (const m of s.matchAll(f.re)) {
      const before = s.slice(Math.max(0, m.index - 40), m.index);
      if (f.negacjaOk && NEG_BEFORE.test(before)) continue;
      if (f.pomijajPo && new RegExp(`(?:${f.pomijajPo})\\s*$`, "iu").test(before)) continue;
      out.push({ fraza: f.fraza, tekst: m[0], index: m.index, kontekst: s.slice(Math.max(0, m.index - 50), m.index + m[0].length + 50).replace(/\s+/g, " ").trim(), dlaczego: f.dlaczego || "" });
    }
  }
  return out;
}

// ---------------- 3. formy zależne od płci (copy-gender; tylko ostrzeżenie) ----------------
// „masz 3 z 4”, „gotowe”, „udało się” zamiast „zrobiłeś/zrobiłaś”, „jesteś gotowy”.
const GENDERED = /(?<![\p{L}])\p{L}+(?:łeś|łaś|łbyś|łabyś|łem|łam)(?![\p{L}])|(?<![\p{L}])gotow[ya](?![\p{L}])|(?<![\p{L}])jesteś\s+(?:pewien|pewna|sam|sama|zalogowan[ya]|zapisan[ya])(?![\p{L}])/giu;
// Rzeczowniki i przysłówki na -łem/-łam, które nie są formą osoby.
const NOT_GENDERED = new Set(["dołem", "kołem", "stołem", "popiołem", "kościołem", "aniołem", "orłem", "wołem", "mułem", "posłem", "węzłem", "kotłem", "szkłem", "dyszlem", "celem", "skałam", "działem", "udziałem", "przedziałem", "materiałem", "kapitałem", "artykułem", "tytułem", "rozdziałem", "podziałem", "wydziałem", "zespołem", "pułem", "żłobkiem", "dałam", "sałam", "zasłonam", "palcem", "kreślem", "przełam", "złam", "słam"]);
function genderHits(text) {
  const out = [];
  for (const m of String(text).matchAll(GENDERED)) {
    const w = m[0].toLowerCase();
    if (NOT_GENDERED.has(w)) continue;
    out.push({ tekst: m[0], index: m.index });
  }
  return out;
}

// ---------------- 4. matematyka: przykłady liczbowe liczone ponownie ----------------
// „3 × 25 zł = 75 zł”, „(110 − 100) / 100 = 0,1” (bez nawiasów: tylko proste działania), „1000 · 1,05 ≈ 1050”.
const UNIT = String.raw`(?:\s?(?:zł|PLN|EUR|USD|€|\$|h|godz\.|min|kg|g|szt\.?|pkt|units?|tonnes?|t|osób|os\.)(?![\p{L}]))?`;
const NUMR = String.raw`\d+(?:[  ]\d{3})*(?:[.,]\d+)?`;
const OP = String.raw`(?:\s*[+×*·/÷−–]\s*|\s+[-x:]\s+)`;
const EQ = new RegExp(String.raw`(?<![\p{L}\d.,)\]}^_])(?<!\d[  ])(?<![+\-−–×*·/÷%^(<>]\s?)(?<![\d)]\s?[:x]\s?)(${NUMR}${UNIT}(?:${OP}${NUMR}${UNIT})+)\s*(=|≈)\s*(${NUMR})${UNIT}(?![\d\p{L}%]|\s?[×*·/÷^]|\s?\(|[.,]\d)`, "gu");
// comma: "dec" (przecinek dziesiętny), "thou" (przecinek tysięcy, jak 1,234.5), domyślnie: „1,234” = nie wiadomo.
function parseNum(s, comma) {
  let t = String(s).replace(/[  ]/g, "");
  if (comma === "thou") t = t.replace(/,/g, "");
  else if (comma !== "dec" && /^\d{1,3}(,\d{3})+$/.test(t)) return null; // „1,234” – nie wiadomo, tysiące czy ułamek
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
const decimalsOf = (s) => { const m = /[.,](\d+)$/.exec(String(s).replace(/[  ]/g, "")); return m ? m[1].length : 0; };
// Liczy lewą stronę: + − oraz × · * / ÷ : (zwykła kolejność działań, bez nawiasów).
function evalSimple(lhs, comma) {
  const parts = lhs.split(new RegExp(`(${OP})`, "u"));
  const nums = [], ops = [];
  for (let i = 0; i < parts.length; i++) {
    if (i % 2) { ops.push(parts[i].trim()); continue; }
    const m = new RegExp(NUMR, "u").exec(parts[i]);
    const n = m && parseNum(m[0], comma);
    if (n === null || n === undefined) return null;
    nums.push(n);
  }
  const MUL = { "×": (a, b) => a * b, "*": (a, b) => a * b, "·": (a, b) => a * b, x: (a, b) => a * b, "/": (a, b) => a / b, "÷": (a, b) => a / b, ":": (a, b) => a / b };
  const terms = [nums[0]], signs = [1];
  for (let i = 0; i < ops.length; i++) {
    const op = ops[i], n = nums[i + 1];
    if (MUL[op]) terms[terms.length - 1] = MUL[op](terms[terms.length - 1], n);
    else { terms.push(n); signs.push(op === "+" ? 1 : -1); }
  }
  return terms.reduce((s, t, i) => s + signs[i] * t, 0);
}
// Zwraca [{ tekst, wynik, policzone, ok }] dla każdego prostego rachunku w napisie.
function arithmetic(text) {
  const s = stripLatex(String(text).replace(/\\cdot|\\times/g, "·")).replace(/\\\$/g, "$");
  const out = [];
  EQ.lastIndex = 0;
  let m;
  while ((m = EQ.exec(s))) {
    const [all, lhs, rel, rhs] = m;
    // Przecinek w całym rachunku: dziesiętny, jeśli gdzieś stoi przy nim inna liczba cyfr niż 3 (1,05), tysięcy, gdy są kropki dziesiętne.
    const comma = /\d,(?:\d{1,2}|\d{4,})(?!\d)/u.test(all) ? "dec" : /\d\.\d/.test(all) && /\d,\d{3}(?!\d)/.test(all) ? "thou" : undefined;
    // „3×4 + 2×3 = 12 + 6 = 18”: prawa strona to dalszy ciąg rachunku (12 + 6), nie wynik; porównujemy wartości obu stron.
    const dalej = new RegExp(String.raw`^(?:${OP}${NUMR})+`, "u").exec(s.slice(m.index + all.length));
    const want = dalej ? evalSimple(rhs + dalej[0], comma) : parseNum(rhs, comma), got = evalSimple(lhs, comma);
    if (want !== null && got !== null && Number.isFinite(got)) {
      const tol = 0.5 * 10 ** -decimalsOf(rhs) + 1e-9 * Math.abs(want) + (rel === "≈" ? 0.01 * Math.abs(want) : 0);
      out.push({ tekst: all.trim(), wynik: want, policzone: Math.round(got * 1e6) / 1e6, ok: Math.abs(got - want) <= tol });
    }
    EQ.lastIndex = m.index + all.lastIndexOf(rhs); // „a · b = c · d = e”: od c liczymy dalej
  }
  return out;
}
// Pola, w których błędny rachunek jest celowy (typowy błąd, wyjaśnienie złej opcji, opcje do wyboru).
const ARITH_SKIP = /(\.wrong$|\.not\[\d+\]$|\.options\[\d+\]$|\.mistake$|\.mistakes?\[)/;

// Pytanie z polem calc: wyrażenie (parser z lekcje-v4.js), poprawna opcja ma tę wartość, złe nie.
function optionNumber(o) {
  const m = /(-?)(\d+(?:[  ]\d{3})*(?:[.,]\d+)?)/.exec(String(o).replace(/−/g, "-"));
  const n = m && parseNum(m[2]);
  return n === null || n === undefined ? null : m[1] ? -n : n;
}
function calcProblems(q, at) {
  if (!q || q.calc === undefined) return [];
  let want;
  try { want = V4.numCalc(String(q.calc), {}); } catch (e) { return [`${at}: calc się nie parsuje (${e.message})`]; }
  if (!Number.isFinite(want)) return [`${at}: calc nie daje liczby`];
  const out = [], same = (v) => v !== null && Math.abs(v - want) <= Math.max(1e-9, 0.005 * Math.abs(want));
  (q.options || []).forEach((o, i) => {
    const v = optionNumber(o);
    if (i === q.correct && !same(v)) out.push(`${at}: poprawna opcja „${o}” ≠ ${Math.round(want * 1e6) / 1e6} (calc: ${q.calc})`);
    if (i !== q.correct && same(v)) out.push(`${at}: zła opcja „${o}” też daje ${Math.round(want * 1e6) / 1e6}`);
  });
  return out;
}
function questionsOf(content) {
  const L = (content && content.lesson) || {}, out = [];
  const add = (q, at) => q && typeof q === "object" && Array.isArray(q.options) && out.push([q, at]);
  add(L.hook, "lesson.hook");
  (L.prereq || []).forEach((q, i) => add(q, `lesson.prereq[${i}]`));
  (L.sections || []).forEach((s, i) => s && add(s.check, `lesson.sections[${i}].check`));
  (L.exit || []).forEach((q, i) => add(q, `lesson.exit[${i}]`));
  (L.transfer && Array.isArray(L.transfer.options) ? [L.transfer] : []).forEach((q) => add(q, "lesson.transfer"));
  ((content && content.quiz) || []).forEach((q, i) => add(q, `quiz[${i}]`));
  return out;
}

// ---------------- jedna lekcja: wszystkie kontrole JS ----------------
// Zwraca { bledy: [...], ostrzezenia: [...], wartosci: [...], rachunki: [...] }.
function checkLesson(doc, forbidden) {
  const id = doc.id || "?", bledy = [], ostrzezenia = [], wartosci = [], rachunki = [];
  // Pytania z calc: ich liczby to dane zadania sprawdzone rachunkiem, nie fakty do źródła.
  const calcQs = questionsOf(doc.content).filter(([q]) => q.calc !== undefined).map(([, at]) => at);
  for (const { path: at, text } of lessonStrings(doc)) {
    for (const f of forbiddenHits(text, forbidden, "lekcje")) bledy.push(`${at}: zakazane „${f.tekst}” (${f.fraza}) · …${f.kontekst}…`);
    for (const g of genderHits(text)) ostrzezenia.push(`${at}: forma zależna od płci „${g.tekst}”`);
    const rs = !ARITH_SKIP.test(at) && !VALUE_SKIP.test(at) ? arithmetic(text) : [];
    for (const r of rs) rachunki.push({ ...r, pole: at });
    // Liczby z rachunku, który się zgadza, to dane przykładu: nie trafiają do przeglądu źródeł.
    const inCalc = new Set(rs.filter((r) => r.ok).flatMap((r) => r.tekst.match(/\d+(?:[  ]\d{3})*(?:[.,]\d+)?/g) || []).map((x) => x.replace(/[  ]/g, "")));
    if (!VALUE_SKIP.test(at) && !VALUE_EXAMPLE.test(at) && !calcQs.some((q) => at.startsWith(q + "."))) for (const v of valueHits(text)) {
      const num = (/\d+(?:[  ]\d{3})*(?:[.,]\d+)?/.exec(v.tekst) || [""])[0].replace(/[  ]/g, "");
      if (["kwota", "procent", "liczba"].includes(v.typ) && inCalc.has(num)) continue;
      wartosci.push({ ...v, pole: at });
    }
  }
  for (const [q, at] of questionsOf(doc.content)) bledy.push(...calcProblems(q, at));
  // Wartości: jedna pozycja na lekcję i napis (z listą pól), żeby przegląd był krótki.
  const by = new Map();
  for (const w of wartosci) {
    const k = `${id}|${w.typ}|${w.tekst.replace(/\s+/g, " ").toLowerCase()}`;
    if (!by.has(k)) by.set(k, { klucz: k, lekcja: id, typ: w.typ, tekst: w.tekst, kontekst: w.kontekst, pola: [] });
    if (!by.get(k).pola.includes(w.pole)) by.get(k).pola.push(w.pole);
  }
  return { bledy, ostrzezenia, wartosci: [...by.values()], rachunki: rachunki.map((r) => ({ ...r, lekcja: id, klucz: `${id}|rachunek|${r.tekst}` })) };
}

// ---------------- paczki: rozpoznanie formatu ----------------
// Obsługiwane: katalog z <id>.json, eksport z docs/lekcje-v4/eksport.js ({ pliki: { "<id>.json": "..." } }),
// tablica dokumentów, { lekcje: [...] }, pojedynczy dokument { id, content: { lesson } }.
function docsFrom(json, name) {
  if (Array.isArray(json)) return json.flatMap((x, i) => docsFrom(x, `${name}[${i}]`));
  if (json && typeof json === "object") {
    if (json.pliki && typeof json.pliki === "object") return Object.entries(json.pliki).map(([k, v]) => ({ zrodlo: `${name}:${k}`, doc: typeof v === "string" ? JSON.parse(v) : v }));
    if (Array.isArray(json.lekcje)) return docsFrom(json.lekcje, name);
    if (json.content && typeof json.content === "object") return [{ zrodlo: name, doc: json }];
    if (json.lesson && typeof json.lesson === "object") return [{ zrodlo: name, doc: { id: json.id || path.basename(name, ".json"), content: json } }];
  }
  return [];
}

// ---------------- 5. kontrast (WCAG 2.x) ----------------
function parseHex(hex) {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) throw new Error(`To nie jest kolor #rrggbb: ${hex}`);
  const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1], n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const channel = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
function luminance(hex) { const [r, g, b] = parseHex(hex); return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b); }
function contrastRatio(a, b) { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); }

// PALETA.md: tabele „| `--nazwa` | `#HEX` | …” w sekcjach „## …”. Zwraca { sekcja: { nazwa: hex } }; w tabeli kolorów
// znaczących trzecia kolumna (tło) trafia jako „<nazwa>-tlo”.
function paletteFromMd(md) {
  const out = {};
  let sec = "";
  for (const line of String(md).split("\n")) {
    const h = /^##\s+(.+)$/.exec(line);
    if (h) { sec = h[1].trim(); continue; }
    const m = /^\|\s*`--([a-z0-9-]+)`(?:\s*\/\s*`--([a-z0-9-]+)`)?\s*\|\s*`(#[0-9A-Fa-f]{6})`(?:\s*\/\s*`(#[0-9A-Fa-f]{6})`)?\s*\|(?:\s*`(#[0-9A-Fa-f]{6})`\s*\|)?/.exec(line);
    if (!m) continue;
    const t = (out[sec] = out[sec] || {});
    t[m[1]] = m[3];
    if (m[2]) t[m[2]] = m[4] || m[3];
    if (m[5]) t[m[1] + "-tlo"] = m[5];
  }
  return out;
}
// index.html: blok :root i bloki html[data-theme="x"] { … } → { root: {…}, x: {…} } z rozwiązanym var(--y).
function cssThemes(html) {
  const raw = {};
  const re = /(?:^|\n)\s*(:root|html\[data-theme="([a-z]+)"\])\s*\{([^}]*)\}/g;
  for (const m of String(html).matchAll(re)) {
    const name = m[2] || "root", t = (raw[name] = raw[name] || {});
    for (const d of m[3].matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)) t[d[1]] = d[2].trim();
  }
  const resolve = (theme, v, depth) => {
    if (depth > 8 || v === undefined) return undefined;
    const r = /^var\(--([a-z0-9-]+)\)$/.exec(v);
    if (!r) return /^#[0-9a-f]{3,6}$/i.test(v) ? v : undefined;
    return resolve(theme, (raw[theme] && raw[theme][r[1]]) ?? raw.root?.[r[1]], depth + 1);
  };
  const out = {};
  for (const [name, t] of Object.entries(raw)) {
    out[name] = {};
    for (const k of new Set([...Object.keys(raw.root || {}), ...Object.keys(t)])) {
      const v = resolve(name, t[k] ?? raw.root[k], 0);
      if (v) out[name][k] = v;
    }
  }
  return out;
}
// Pary tekst/tło na każdym motywie strony: [tekst, tło, minimum].
const THEME_PAIRS = [
  ["ink", "paper", 4.5], ["ink", "surface", 4.5], ["ink", "sunk", 4.5], ["ink", "accent-soft", 4.5],
  ["muted", "paper", 4.5], ["muted", "surface", 4.5], ["muted", "sunk", 4.5],
  ["accent-ink", "accent", 4.5], ["accent-text", "accent-soft", 4.5], ["accent-text", "surface", 4.5],
  ["warn", "warn-soft", 4.5], ["bad", "bad-soft", 4.5], ["line", "surface", 1.2],
];
function themeContrast(themes) {
  const out = [];
  for (const [name, t] of Object.entries(themes)) for (const [fg, bg, min] of THEME_PAIRS) {
    if (!t[fg] || !t[bg]) continue;
    const r = contrastRatio(t[fg], t[bg]);
    out.push({ motyw: name, para: `${fg} na ${bg}`, fg: t[fg], bg: t[bg], kontrast: Math.round(r * 100) / 100, min, ok: r >= min });
  }
  return out;
}

module.exports = { strings, lessonStrings, valueHits, VALUE_RULES, loadForbidden, forbiddenHits, GENDERED, genderHits, arithmetic, evalSimple, parseNum,
  calcProblems, questionsOf, checkLesson, docsFrom, parseHex, luminance, contrastRatio, paletteFromMd, cssThemes, THEME_PAIRS, themeContrast };

// Stałe pliki strony: komentarze w kodzie nie są tekstem dla studenta (jak stripComments w zdawalni-web).
// Wycina /* … */, <!-- … --> i // do końca linii (poza „https://”), zachowując numery linii.
function stripCodeComments(src) {
  const blank = (m) => m.replace(/[^\n]/g, " ");
  return String(src).replace(/\/\*[\s\S]*?\*\//g, blank).replace(/<!--[\s\S]*?-->/g, blank).replace(/(^|[^:\\"'`])\/\/[^\n]*/g, (m, a) => a + " ".repeat(m.length - a.length));
}
// Trafienia z numerem linii: [{ linia, ... }].
function withLines(src, hits) {
  const starts = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === "\n") starts.push(i + 1);
  return hits.map((h) => { let lo = 0, hi = starts.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= h.index) lo = mid; else hi = mid - 1; } return { ...h, linia: lo + 1 }; });
}
// Pliki strony do kontroli statycznej (względem katalogu repo).
function siteFiles(root) {
  return fs.readdirSync(root).filter((f) => /\.(html|js)$/.test(f) && !/^learner\.js$/.test(f)).sort();
}
module.exports.stripCodeComments = stripCodeComments;
module.exports.withLines = withLines;
module.exports.siteFiles = siteFiles;
