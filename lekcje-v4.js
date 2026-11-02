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

  return { hashStr: hashStr, qKey: qKey, keyMid: keyMid, okQuestion: okQuestion, lessonQuestions: lessonQuestions, lvNext: lvNext, PTS: PTS, lessonPtsCalc: lessonPtsCalc };
});
