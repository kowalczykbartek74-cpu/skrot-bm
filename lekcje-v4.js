/* Skrót BM: lekcje v4 bez DOM (klucze powtórek, poziomy Zrobione → Utrwalone → Opanowane, punkty lekcji).
   index.html bierze to z window.SKROT_V4, testy z require("./lekcje-v4.js") (node --test tests/). */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SKROT_V4 = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  // Ten sam skrót co hashStr w index.html (FNV-1a, base36).
  function hashStr(s) { var x = 2166136261; for (var ch of String(s)) { x ^= ch.codePointAt(0); x = Math.imul(x, 16777619) >>> 0; } return x.toString(36); }

  // ---------- klucze powtórek ----------
  // „mid:hash” fiszka, „q:mid:hash” pytanie z lekcji, „d:mid:atom” rozróżnianie pojęć, „n:mid:gid” zadanie liczbowe, „g:sid:hash” słowniczek.
  var qKey = function (mid, q) { return "q:" + mid + ":" + hashStr(q.q); };
  var keyMid = function (k) { var p = String(k).split(":"); return p[0] === "g" ? null : /^[qdn]$/.test(p[0]) ? p[1] : p[0]; };
  // Pytania lekcji, które wracają w Powtórkach: check każdej części i bilet wyjścia (tylko pełne pytania z opcjami).
  function okQuestion(q) { return !!(q && q.q && Array.isArray(q.options) && q.options.length >= 2 && Number.isInteger(q.correct) && q.correct >= 0 && q.correct < q.options.length); }
  function lessonQuestions(L) {
    var out = [];
    ((L && L.sections) || []).forEach(function (s) { if (okQuestion(s && s.check)) out.push(s.check); });
    ((L && L.exit) || []).forEach(function (q) { if (okQuestion(q)) out.push(q); });
    return out;
  }

  // ---------- poziomy lekcji ----------
  // Dzień powtórki lekcji: dzień t po dniu zdania biletu d0, z co najmniej 2 kartami tej lekcji i ≥ 80% dobrze za pierwszym razem.
  // cur = dotychczasowe dni (unikalne, maks. 3). Zwraca nową tablicę albo null, gdy nic się nie zmienia.
  function lvNext(cur, t, d0, n, ok) {
    cur = Array.isArray(cur) ? cur : [];
    if (d0 == null || !(t > d0) || !(n >= 2) || ok / n < 0.8 || cur.indexOf(t) >= 0 || cur.length >= 3) return null;
    return cur.concat([t]);
  }
  // Punkty lekcji (0–100): części 50, bilet 10, utrwalone (1 dzień) 20, opanowane (3 dni) 20. Gwiazdki się nie liczą.
  var PTS = { parts: 50, ticket: 10, kept: 20, mastered: 20 };
  // o: { frac (ułamek części), ok (bilet zdany), manual („bez biletu”), lv (liczba dni), begun (coś już zaczęte) }
  function lessonPtsCalc(o) {
    var done = !!(o.ok || o.manual), frac = done ? 1 : Math.max(0, Math.min(1, o.frac || 0));
    var parts = Math.floor(PTS.parts * frac + 1e-9), ticket = o.ok ? PTS.ticket : 0;
    var lv = done ? Math.min(3, o.lv || 0) : 0;
    var bonus = (lv >= 1 ? PTS.kept : 0) + (lv >= 3 ? PTS.mastered : 0);
    var pts = Math.min(100, parts + ticket + bonus);
    var begun = pts > 0 || !!o.begun;
    // Przy zdanym bilecie progi to 60 / 80 / 100 pkt. „Bez biletu” (50 pkt) jest zrobione tak samo i tak samo się utrwala.
    var state = !begun ? "none" : lv >= 3 ? "mastered" : lv >= 1 ? "kept" : done ? "done" : "doing";
    return { pts: pts, parts: parts, ticket: ticket, bonus: bonus, lv: lv, state: state };
  }

  // ---------- atomy (C2) i pytania rozróżniające (C3) ----------
  // Atomy lekcji: lesson.atoms albo wyliczone ze starej treści (concepts + fiszka, której pytanie zawiera pojęcie).
  function atomsFrom(c) {
    var L = c && c.lesson;
    if (L && Array.isArray(L.atoms) && L.atoms.length) return L.atoms.filter(function (a) { return a && a.id && a.t; });
    var fl = (c && c.flashcards) || [];
    return ((c && c.concepts) || []).filter(function (x) { return x && x.term && x.definition; }).map(function (x, i) {
      var low = String(x.term).toLowerCase(), f = fl.find(function (f) { return f && f.q && String(f.q).toLowerCase().indexOf(low) >= 0; });
      return { id: "c" + i, t: x.term, pl: x.pl || "", d: x.definition, q: f ? f.q : "", a: f ? f.a : "", derived: true };
    });
  }
  // Fiszki lekcji = flashcards + atomy z q/a, bez duplikatów po hashStr(q).
  function lessonCards(c) {
    var seen = {}, out = [];
    ((c && c.flashcards) || []).concat(atomsFrom(c).filter(function (a) { return a.q && a.a; }).map(function (a) { return { q: a.q, a: a.a, atom: a.id }; }))
      .forEach(function (f) { if (!f || !f.q) return; var k = hashStr(f.q); if (seen[k]) return; seen[k] = 1; out.push(f); });
    return out;
  }
  // „Które pojęcie pasuje?”: definicja atomu, opcje = atom + atomy, z którymi się myli (conf: "a3" albo "mid#a3").
  // byMid(mid) → treść innej lekcji (albo null, gdy niewczytana). Zwraca pytanie z opcjami (correct = 0, kolejność tasuje odtwarzacz).
  function distinctOf(c, atomId, byMid) {
    var atoms = atomsFrom(c), a = atoms.find(function (x) { return x.id === atomId; });
    if (!a || !a.d || !Array.isArray(a.conf) || !a.conf.length) return null;
    var opts = [a.t];
    a.conf.forEach(function (ref) {
      var parts = String(ref).split("#"), other = parts.length > 1 ? atomsFrom(byMid ? byMid(parts[0]) : null) : atoms, id = parts.length > 1 ? parts[1] : parts[0];
      var b = other.find(function (x) { return x.id === id; });
      if (b && b.t && opts.indexOf(b.t) < 0 && opts.length < 4) opts.push(b.t);
    });
    if (opts.length < 2) return null;
    return { q: "Which concept fits: *" + a.d + "*?", options: opts, correct: 0, why: a.t + ": " + a.d, not: null };
  }

  // ---------- zadania liczbowe z szablonów gen (C4) ----------
  // Własny parser: liczby, zmienne z vars, + - * / ^ ( ), funkcje max min abs round sqrt ln. Nic poza tym (bez eval).
  var FN = { max: [1, 9, Math.max], min: [1, 9, Math.min], abs: [1, 1, Math.abs], sqrt: [1, 1, Math.sqrt], ln: [1, 1, Math.log],
    round: [1, 2, function (x, n) { var k = Math.pow(10, Math.max(0, Math.min(10, Math.round(n || 0)))); return Math.round(x * k) / k; }] };
  function numTokens(src) {
    var out = [], i = 0, s = String(src);
    while (i < s.length) {
      var ch = s[i];
      if (/\s/.test(ch)) { i++; continue; }
      var m = /^(\d+(\.\d+)?|\.\d+)/.exec(s.slice(i));
      if (m) { out.push({ t: "n", v: parseFloat(m[1]) }); i += m[1].length; continue; }
      m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(s.slice(i));
      if (m) { out.push({ t: "id", v: m[0] }); i += m[0].length; continue; }
      if ("+-*/^(),".indexOf(ch) >= 0) { out.push({ t: ch }); i++; continue; }
      throw new Error("Niedozwolony znak: " + ch);
    }
    return out;
  }
  // Zwraca drzewo wyrażenia; names = dozwolone zmienne. Błąd → wyjątek z opisem.
  function numParse(src, names) {
    var tk = numTokens(src), p = 0, allowed = {};
    (names || []).forEach(function (n) { allowed["$" + n] = 1; });
    var peek = function () { return tk[p] && tk[p].t; }, eat = function (t) { if (peek() !== t) throw new Error("Oczekiwano " + t); return tk[p++]; };
    function expr() { var a = term(); while (peek() === "+" || peek() === "-") { var op = tk[p++].t; a = { op: op, a: a, b: term() }; } return a; }
    function term() { var a = unary(); while (peek() === "*" || peek() === "/") { var op = tk[p++].t; a = { op: op, a: a, b: unary() }; } return a; }
    function unary() { if (peek() === "-") { p++; return { op: "neg", a: unary() }; } if (peek() === "+") { p++; return unary(); } return power(); }
    function power() { var a = primary(); if (peek() === "^") { p++; return { op: "^", a: a, b: unary() }; } return a; }
    function primary() {
      var x = tk[p];
      if (!x) throw new Error("Niepełne wyrażenie");
      if (x.t === "n") { p++; return { n: x.v }; }
      if (x.t === "(") { p++; var e = expr(); eat(")"); return e; }
      if (x.t === "id") {
        p++;
        if (peek() === "(") {
          if (!Object.prototype.hasOwnProperty.call(FN, x.v)) throw new Error("Nieznana funkcja: " + x.v);
          p++; var args = [];
          if (peek() !== ")") { args.push(expr()); while (peek() === ",") { p++; args.push(expr()); } }
          eat(")");
          var f = FN[x.v]; if (args.length < f[0] || args.length > f[1]) throw new Error("Zła liczba argumentów: " + x.v);
          return { fn: x.v, args: args };
        }
        if (!allowed["$" + x.v]) throw new Error("Nieznana zmienna: " + x.v);
        return { v: x.v };
      }
      throw new Error("Nieoczekiwany znak: " + x.t);
    }
    var tree = expr();
    if (p < tk.length) throw new Error("Nadmiarowe znaki w wyrażeniu");
    return tree;
  }
  function numEval(tree, vals) {
    if ("n" in tree) return tree.n;
    if ("v" in tree) { var v = Object.prototype.hasOwnProperty.call(vals, tree.v) ? vals[tree.v] : NaN; return typeof v === "number" ? v : NaN; }
    if (tree.fn) return FN[tree.fn][2].apply(null, tree.args.map(function (a) { return numEval(a, vals); }));
    var a = numEval(tree.a, vals);
    if (tree.op === "neg") return -a;
    var b = numEval(tree.b, vals);
    return tree.op === "+" ? a + b : tree.op === "-" ? a - b : tree.op === "*" ? a * b : tree.op === "/" ? a / b : Math.pow(a, b);
  }
  // Wygodnie: policz wyrażenie od razu (testy, walidator).
  function numCalc(src, vals) { return numEval(numParse(src, Object.keys(vals || {})), vals || {}); }
  // Losowanie zmiennych: vars.x = [min, max, step], ziarno = id karty + numer próby (te same liczby po odświeżeniu).
  function numRand(seed) { var x = (parseInt(hashStr(seed), 36) >>> 0) || 1; return function () { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
  function numVars(vars, seed) {
    var r = numRand(seed), out = {};
    Object.keys(vars || {}).forEach(function (k) {
      var v = vars[k], lo = +v[0], hi = +v[1], st = +v[2] || 1, n = Math.max(1, Math.floor((hi - lo) / st + 1e-9) + 1);
      out[k] = +(lo + Math.floor(r() * n) * st).toFixed(10);
    });
    return out;
  }
  var numFmt = function (x) { var r = Math.round(x * 1e4) / 1e4; return String(r); };
  function numFill(task, vals) { return String(task || "").replace(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g, function (m, k) { return Object.prototype.hasOwnProperty.call(vals, k) ? numFmt(vals[k]) : m; }); }
  // Odpowiedź ucznia: przecinek albo kropka, spacje i jednostka obok liczby są w porządku.
  function numInput(s) { var m = /-?\d+(?:[.,]\d+)?|-?[.,]\d+/.exec(String(s || "").replace(/\s+/g, "")); return m ? parseFloat(m[0].replace(",", ".")) : NaN; }
  function numOk(x, want, tol) { return isFinite(x) && isFinite(want) && Math.abs(x - want) <= Math.max(+tol || 0, 0.005 * Math.abs(want)); }
  // Szablon gotowy do pokazania: { task, result, unit, why } albo null (błąd parsowania albo wynik nieskończony).
  function genCard(g, seed) {
    if (!g || !g.task || !g.answer) return null;
    var tree; try { tree = numParse(g.answer, Object.keys(g.vars || {})); } catch (e) { return { error: String(e.message || e) }; }
    var vals = numVars(g.vars, seed), res = numEval(tree, vals);
    if (!isFinite(res)) return { error: "Wynik nie jest liczbą" };
    return { task: numFill(g.task, vals), result: res, unit: g.unit || "", tol: +g.tol || 0, why: g.why || "", vals: vals };
  }

  return { hashStr: hashStr, qKey: qKey, keyMid: keyMid, okQuestion: okQuestion, lessonQuestions: lessonQuestions, lvNext: lvNext, PTS: PTS, lessonPtsCalc: lessonPtsCalc,
    atomsFrom: atomsFrom, lessonCards: lessonCards, distinctOf: distinctOf,
    numParse: numParse, numEval: numEval, numCalc: numCalc, numVars: numVars, numFill: numFill, numInput: numInput, numOk: numOk, numFmt: numFmt, genCard: genCard };
});
