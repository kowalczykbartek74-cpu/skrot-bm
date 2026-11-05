/* Skrót: mini-sprawdziany i „Pewny / Zgaduję” bez DOM (etap 9).
   Port logiki 1:1 z matura-app (origin/feat/l7-learner-bundle):
     • lib/domain/learner/calibration.ts: askConfidenceNow (pewność najwyżej przy co 3. pytaniu) i trafność per poziom
       (próg 10 odpowiedzi na poziom); w Skrócie dwa poziomy: „Pewny” (sure) i „Zgaduję” (guess), bez „raczej tak”;
     • lib/domain/checkpoint.ts: thresholdToOffer, isSnoozed, snoozeUntil, pickCheckpointTasks, checkpointPassed
       (+ wybór karty jak loadCheckpointCard w lib/data/checkpoint.ts).
   Różnice Skrótu (opisane w docs/zdawalni/etap-9.md):
     • daty to liczby dni (dayN w index.html), nie ISO; addDays = dodawanie;
     • miara to „umiesz z zakresu” przedmiotu (0–1), próg 70% (decyzja D7), a nie przewidywany wynik matury;
     • 6 pytań (z quizu, check/exit lekcji i zadań gen), zdany = co najmniej 5 dobrych (jak 4 z 5 w Zdawalni);
     • pytania nie mają poziomów trudności: wszystkie mają trudność 0, a kolejność przy remisie losuje ziarno dnia
       (code = skrót z ziarna i id), więc sprawdzian nie jest co tydzień taki sam;
     • trafność „Pewny” liczona z licznika w progress (kal), bo zdarzenia nauki idą do bazy i nie wracają;
       karta w Profilu nauki od 20 odpowiedzi z wybraną pewnością.
   index.html bierze to z window.SKROT_SPR, testy z require("./sprawdzian.js"). */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SKROT_SPR = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // ---------- pewność (calibration.ts) ----------
  var CALIBRATION = { askEvery: 3, priorStrength: 10, minPerLevel: 10, minCard: 20 };

  /** n-te pytanie sesji (od 0) pyta o pewność tylko co 3. raz: 0, 3, 6, … */
  function askConfidenceNow(indexInSitting) {
    return indexInSitting % CALIBRATION.askEvery === 0;
  }

  function kalCzysty(kal) {
    var ok = function (a) { return Array.isArray(a) && a.length === 2 && a[0] >= 0 && a[1] >= 0 && a[1] <= a[0] ? [a[0] | 0, a[1] | 0] : [0, 0]; };
    return { s: ok(kal && kal.s), g: ok(kal && kal.g) };
  }
  /** Dopisuje jedną odpowiedź z wybraną pewnością: pewny 1 = „Pewny”, 0 = „Zgaduję”. kal = { s: [n, dobre], g: [n, dobre] }. */
  function kalDodaj(kal, pewny, ok) {
    var k = kalCzysty(kal), key = pewny ? "s" : "g";
    k[key] = [k[key][0] + 1, k[key][1] + (ok ? 1 : 0)];
    return k;
  }
  /** Trafność per poziom (null poniżej 10 odpowiedzi na poziomie, jak calibration()), n = wszystkie z pewnością.
      pokaz: karta w Profilu nauki (od 20 odpowiedzi i gdy „Pewny” ma już wynik). */
  function kalibracja(kal) {
    var k = kalCzysty(kal), n = k.s[0] + k.g[0];
    var val = function (a) { return a[0] >= CALIBRATION.minPerLevel ? a[1] / a[0] : null; };
    var sure = val(k.s), guess = val(k.g);
    var rada = sure == null ? null : sure < 0.7 ? "sprawdzaj" : sure >= 0.9 ? "trafnie" : "ok";
    return { n: n, sure: sure, guess: guess, nSure: k.s[0], nGuess: k.g[0], pokaz: n >= CALIBRATION.minCard && sure != null, brakuje: Math.max(0, CALIBRATION.minCard - n), rada: rada };
  }
  /** Zgadnięta dobra odpowiedź idzie do rewanżu jak błędna (jak bilet lekcji v4): wynik dla rewanżu. */
  var wynikDoRewanzu = function (ok, pewny) { return !!ok && pewny !== 0; };

  // ---------- mini-sprawdzian (checkpoint.ts) ----------
  var CONFIG = { thresholds: [70], size: 6, passPoints: 5, snoozeDays: 3, minDaysBetween: 7, targetDifficulty: { 70: 0 }, maxRecords: 8 };

  /**
   * Próg do zaproponowania albo null: najwyższy osiągnięty, powyżej już zdanych; nie gdy sprawdzian jest
   * zaproponowany lub w trakcie, i nie wcześniej niż minDaysBetween dni po ostatnim skończonym.
   * mid = „umiesz z zakresu” w procentach (0–100), records = [{ threshold, status, snoozed_until, completed_on }].
   */
  function thresholdToOffer(mid, records, today, config) {
    config = config || CONFIG; records = records || [];
    if (records.some(function (r) { return r.status === "offered" || r.status === "in_progress"; })) return null;
    var passed = Math.max.apply(null, [0].concat(records.filter(function (r) { return r.status === "passed"; }).map(function (r) { return r.threshold; })));
    var reached = config.thresholds.filter(function (t) { return mid >= t && t > passed; });
    if (!reached.length) return null;
    var done = records.map(function (r) { return r.completed_on; }).filter(function (d) { return Number.isInteger(d); }).sort(function (a, b) { return a - b; });
    var last = done.length ? done[done.length - 1] : null;
    if (last != null && last + config.minDaysBetween > today) return null;
    return Math.max.apply(null, reached);
  }
  /** Zaproponowany sprawdzian jest ukryty, dopóki nie minie dzień z „Później”. */
  function isSnoozed(record, today) { return record != null && record.snoozed_until != null && record.snoozed_until > today; }
  function snoozeUntil(today, config) { return today + (config || CONFIG).snoozeDays; }

  /** Trudności dla `size` pytań wokół ułamkowego celu: 2.5 przy 5 → [2, 2, 3, 3, 3]. */
  function targetDifficulties(target, size) {
    var low = Math.floor(target), high = Math.ceil(target);
    var highCount = low === high ? 0 : Math.round((target - low) * size);
    var out = [], i;
    for (i = 0; i < size - highCount; i++) out.push(low);
    for (i = 0; i < highCount; i++) out.push(high);
    return out;
  }

  /**
   * Wybiera pytania z puli niewidzianych (filtruje wołający): dla każdej trudności najbliższe, z tematu jeszcze
   * nieużytego, gdy się da, cięższe tematy najpierw, potem po code. Deterministyczne. Mniej pytań, gdy pula za mała.
   * pool: [{ id, code, difficulty, topicIds }].
   */
  function pickCheckpointTasks(pool, targets, topicWeights) {
    var chosen = [], usedTopics = new Set(), w = topicWeights || {};
    var weight = function (t) { return Math.max.apply(null, [0].concat(t.topicIds.map(function (id) { return w[id] || 0; }))); };
    targets.forEach(function (target) {
      var left = pool.filter(function (t) { return chosen.indexOf(t) < 0; });
      if (!left.length) return;
      var fresh = left.filter(function (t) { return !t.topicIds.some(function (id) { return usedTopics.has(id); }); });
      var pick = (fresh.length ? fresh : left).slice().sort(function (a, b) {
        return Math.abs(a.difficulty - target) - Math.abs(b.difficulty - target) || weight(b) - weight(a) || (a.code < b.code ? -1 : a.code > b.code ? 1 : 0);
      })[0];
      chosen.push(pick);
      pick.topicIds.forEach(function (id) { usedTopics.add(id); });
    });
    return chosen;
  }
  function checkpointPassed(scores, config) {
    return scores.reduce(function (s, x) { return s + x; }, 0) >= (config || CONFIG).passPoints - 1e-9;
  }

  // ---------- Skrót: karta na Dziś, dobór 6 pytań, wynik ----------
  function hashStr(s) { var x = 2166136261; for (var ch of String(s)) { x ^= ch.codePointAt(0); x = Math.imul(x, 16777619) >>> 0; } return x.toString(36); }
  var aktywny = function (records) {
    return (records || []).filter(function (r) { return r.status === "offered" || r.status === "in_progress"; }).slice(-1)[0] || null;
  };

  /**
   * Karta mini-sprawdzianu dla jednego zakresu (przedmiot + zaliczenie), jak loadCheckpointCard:
   * { state: "new" | "offered" | "in_progress", threshold } albo null.
   * pct = „umiesz z zakresu” 0–1, unseen = ile pytań, których osoba jeszcze nie widziała (za mało → brak propozycji).
   */
  function karta(o) {
    var config = o.config || CONFIG, records = o.records || [], today = o.today;
    var act = aktywny(records);
    if (act && act.status === "in_progress") return { state: "in_progress", threshold: act.threshold };
    if ((o.unseen || 0) < config.size) return null;
    if (act) {
      if (isSnoozed(act, today)) return null;
      // Zaproponowany, a „umiesz” spadło poniżej progu: nie przypominamy.
      return Math.round(100 * (o.pct || 0)) >= act.threshold ? { state: "offered", threshold: act.threshold } : null;
    }
    var t = thresholdToOffer(Math.round(100 * (o.pct || 0)), records, today, config);
    return t == null ? null : { state: "new", threshold: t };
  }

  /** „Później”: zaproponowany sprawdzian wraca za snoozeDays dni. */
  function odloz(records, threshold, today, config) {
    var rest = (records || []).filter(function (r) { return r.status !== "offered"; });
    return przytnij(rest.concat([{ threshold: threshold, status: "offered", snoozed_until: snoozeUntil(today, config), completed_on: null }]), config);
  }
  /** Start: rekord w trakcie z wybranymi pytaniami (ids), żeby po zamknięciu wrócić do tych samych. */
  function start(records, threshold, ids, today, config) {
    var rest = (records || []).filter(function (r) { return r.status !== "offered" && r.status !== "in_progress"; });
    return przytnij(rest.concat([{ threshold: threshold, status: "in_progress", snoozed_until: null, completed_on: null, ids: ids.slice(), started_on: today }]), config);
  }
  /** Koniec: wynik zamyka rekord w trakcie (passed / failed), z tematami do powtórki. */
  function zakoncz(records, w, today, config) {
    var act = aktywny(records), rest = (records || []).filter(function (r) { return r !== act; });
    var rec = { threshold: act ? act.threshold : (config || CONFIG).thresholds[0], status: w.passed ? "passed" : "failed", snoozed_until: null, completed_on: today, ok: w.ok, tot: w.tot, weak: w.weak.slice(0, 6) };
    return przytnij(rest.concat([rec]), config);
  }
  /** Rekord w trakcie można porzucić (np. pytania zniknęły z materiałów). */
  function porzuc(records) { return (records || []).filter(function (r) { return r.status !== "in_progress"; }); }
  function przytnij(records, config) { var n = (config || CONFIG).maxRecords; return records.length > n ? records.slice(-n) : records; }

  /** Ostatni zdany próg (odznaka przy przedmiocie) albo null: { threshold, completed_on }. */
  function odznaka(records) {
    var p = (records || []).filter(function (r) { return r.status === "passed"; });
    if (!p.length) return null;
    var best = p.reduce(function (a, r) { return r.threshold > a.threshold || (r.threshold === a.threshold && r.completed_on > a.completed_on) ? r : a; });
    return { threshold: best.threshold, completed_on: best.completed_on };
  }
  /** Ostatni skończony sprawdzian, gdy niezdany i nie starszy niż 14 dni: tematy do powtórki. */
  function doPowtorki(records, today) {
    var done = (records || []).filter(function (r) { return r.status === "passed" || r.status === "failed"; });
    var last = done[done.length - 1];
    return last && last.status === "failed" && today - last.completed_on <= 14 ? last.weak || [] : [];
  }

  /**
   * 6 pytań z puli niewidzianych. pool: [{ id, topic }] (id: z:<mid>:<idx> quiz, q:<mid>:<hash> lekcja, n:<mid>:<gid> zadanie).
   * Jeden temat na pytanie, gdy się da; tematy ważniejsze (weights) najpierw; przy remisie ziarno (np. dzień).
   * Za mało (mniej niż size) → [] (wtedy nie proponujemy).
   */
  function wybierz(pool, o) {
    o = o || {};
    var config = o.config || CONFIG, seed = o.seed == null ? "" : String(o.seed);
    var seen = new Set(), cand = [];
    (pool || []).forEach(function (p) { if (p && p.id && !seen.has(p.id)) { seen.add(p.id); cand.push({ id: p.id, code: hashStr(seed + "|" + p.id), difficulty: 0, topicIds: [p.topic], item: p }); } });
    if (cand.length < config.size) return [];
    var targets = targetDifficulties(config.targetDifficulty[config.thresholds[0]] || 0, config.size);
    return pickCheckpointTasks(cand, targets, o.weights || {}).map(function (c) { return c.item; });
  }

  /** Wynik: answers = [{ id, topic, ok }]. Tematy do powtórki = tematy z błędną odpowiedzią (kolejność pytań). */
  function wynik(answers, config) {
    config = config || CONFIG;
    var scores = answers.map(function (a) { return a.ok ? 1 : 0; }), weak = [];
    answers.forEach(function (a) { if (!a.ok && weak.indexOf(a.topic) < 0) weak.push(a.topic); });
    return { ok: scores.reduce(function (s, x) { return s + x; }, 0), tot: answers.length, passed: answers.length >= config.size && checkpointPassed(scores, config), weak: weak };
  }

  return {
    CALIBRATION: CALIBRATION, CONFIG: CONFIG,
    askConfidenceNow: askConfidenceNow, kalDodaj: kalDodaj, kalibracja: kalibracja, wynikDoRewanzu: wynikDoRewanzu,
    thresholdToOffer: thresholdToOffer, isSnoozed: isSnoozed, snoozeUntil: snoozeUntil, targetDifficulties: targetDifficulties,
    pickCheckpointTasks: pickCheckpointTasks, checkpointPassed: checkpointPassed,
    karta: karta, odloz: odloz, start: start, zakoncz: zakoncz, porzuc: porzuc, odznaka: odznaka, doPowtorki: doPowtorki, wybierz: wybierz, wynik: wynik,
  };
});
