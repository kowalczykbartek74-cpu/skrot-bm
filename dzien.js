/* Skrót: „Ile masz dziś czasu?” i „Jedno zadanie” bez DOM i bazy (etap 8 „Systemy z Zdawalni w Skrócie”).
   Port 1:1 logiki z matura-app (origin/feat/l7-learner-bundle, 9417ccf):
   - lib/domain/fit-day.ts: fitDay, scaledTaskCount, fitOptions (sesje w kolejności planu, póki się mieszczą; pierwsza,
     która się nie mieści, skrócona do tego, co zostało, w krokach po 5 min; próbny test i ustny nigdy nie są cięte),
   - lib/domain/one-task.ts: pickOneTask, weakestTopics, parseExcluded, enoughForTodayText.
   Różnice Skrótu (opisane w docs/zdawalni/etap-8.md): opcje 5 / 15 / 30 / 60 min i najkrótsza sesja 5 min (Zdawalni: 15 / 30 /
   45 / 60 i 15 min) jako parametr fitDay, bez zmiany samej logiki; przy 5 min jedna rzecz (ulozDzien); „Jedno zadanie” w kolejności specu: rewanż na dziś →
   najstarsza zaległa powtórka → temat z najwyższym wspólnym priorytetem (index.html: topicPriority, tu tylko kolejność) →
   kolejna lekcja. Plik ładują index.html (window.SKROT_DZIEN) i testy (tests/dzien.test.js). */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SKROT_DZIEN = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // ---------------- fit-day.ts (1:1) ----------------
  var MIN_SESSION = 15;
  var FIT_OPTIONS = [15, 30, 45, 60];

  function shrinkable(s) { return s.kind === "learn" || s.kind === "review"; }

  /** Mniej minut → proporcjonalnie mniej zadań (co najmniej jedno, gdy sesja jakieś miała). */
  function scaledTaskCount(taskCount, from, to) {
    if (taskCount <= 0) return 0;
    return Math.max(1, Math.min(taskCount, Math.round((taskCount * to) / from)));
  }

  /** opts.min: najkrótsza skrócona sesja (domyślnie MIN_SESSION jak w Zdawalni; Skrót podaje SKROT_MIN). */
  function fitDay(sessions, minutes, opts) {
    var min = opts && opts.min != null ? opts.min : MIN_SESSION;
    var keep = [], move = [], left = minutes;
    for (var i = 0; i < sessions.length; i++) {
      var s = sessions[i];
      if (s.duration_min <= left) {
        keep.push({ id: s.id, minutes: s.duration_min, taskCount: s.task_count, shortened: false });
        left -= s.duration_min;
        continue;
      }
      // Pierwsza sesja, która się nie mieści, skrócona w krokach po 5 min.
      var cut = Math.floor(left / 5) * 5;
      if (shrinkable(s) && cut >= min) {
        keep.push({ id: s.id, minutes: cut, taskCount: scaledTaskCount(s.task_count, s.duration_min, cut), shortened: true });
        left -= cut;
      } else {
        move.push(s.id);
      }
    }
    return { keep: keep, move: move };
  }

  /** Opcje warte pokazania: krótsze niż dzisiejszy plan (inaczej nic się nie zmienia). */
  function fitOptions(totalMinutes, options) {
    return (options || FIT_OPTIONS).filter(function (m) { return m < totalMinutes; });
  }

  // ---------------- one-task.ts (1:1) ----------------
  function pickOneTask(sources, exclude) {
    exclude = exclude || new Set();
    var order = [
      ["rematch", sources.rematches, function () { return true; }],
      ["session", sources.session, function () { return true; }],
      ["weakest", sources.weakest, function (c) { return c.type === "closed"; }],
    ];
    for (var i = 0; i < order.length; i++) {
      var list = order[i][1] || [], fits = order[i][2];
      var c = list.find(function (t) { return !exclude.has(t.taskId) && fits(t); });
      if (c) return { taskId: c.taskId, source: order[i][0] };
    }
    return null;
  }

  /** Tematy z zadaniami, najsłabsze najpierw; przy remisie kolejność programu. */
  function weakestTopics(topics, limit) {
    if (limit == null) limit = 3;
    return topics
      .map(function (t, i) { return { id: t.id, taskCount: t.taskCount, i: i, m: t.mastery == null ? 0.5 : t.mastery }; })
      .filter(function (t) { return t.taskCount > 0; })
      .sort(function (a, b) { return a.m - b.m || a.i - b.i; })
      .slice(0, limit)
      .map(function (t) { return t.id; });
  }

  /** `?bez=<id>,<id>` (zadania pokazane już w tej wizycie). */
  function parseExcluded(raw, max) {
    if (typeof raw !== "string") return new Set();
    return new Set(raw.split(",").filter(function (id) { return /^[0-9a-f-]{36}$/i.test(id); }).slice(-max));
  }

  /** „Wystarczy na dziś”: seria dnia liczy się jako nowa wygrana tylko przy pierwszym zadaniu dnia. */
  function enoughForTodayText(firstOfDay) {
    return firstOfDay ? "Seria dnia zaliczona. Do jutra." : "Dobra robota. Do jutra.";
  }

  // ---------------- Skrót ----------------
  var SKROT_OPCJE = [5, 15, 30, 60];
  var SKROT_MIN = 5;
  var SKROT_JEDNA = 5; // do tylu minut: jedna rzecz
  // Szacunki minut (te same co na ekranie Dziś): ~3 fiszki na minutę (srsTodayTxt), rewanż ~2 min, Zadanie dnia ~5 min,
  // lekcja bez znanej długości ~15 min.
  var REW_MIN = 2, MISJA_MIN = 5, LEKCJA_MIN = 15;
  function minutyPowtorek(n) { return n > 0 ? Math.max(1, Math.round(n / 3)) : 0; }
  function minutyRewanzy(n) { return n > 0 ? n * REW_MIN : 0; }

  /** Lista na dziś przycięta do czasu. items: [{ id, kind, min, n, … }] w kolejności ważności (dowolne dodatkowe pola
   *  wracają nietknięte). Zwraca { keep: [item + { minutes, n, shortened }], move: [item], total, used, all }. */
  function ulozDzien(items, minutes) {
    var list = (items || []).filter(function (x) { return x && x.min > 0; });
    var total = list.reduce(function (a, x) { return a + x.min; }, 0);
    var byId = {};
    list.forEach(function (x) { byId[x.id] = x; });
    var r = fitDay(list.map(function (x) { return { id: x.id, kind: x.kind, duration_min: x.min, task_count: x.n || 0 }; }), minutes, { min: SKROT_MIN });
    // Skrót: przy najkrótszej opcji (5 min) jedna krótka rzecz, nawet gdy zmieściłyby się dwie (np. rewanż i 3 fiszki);
    // reszta przechodzi na później w kolejności listy.
    if (minutes <= SKROT_JEDNA && r.keep.length > 1) {
      var stay = r.keep[0].id;
      r = { keep: [r.keep[0]], move: list.map(function (x) { return x.id; }).filter(function (id) { return id !== stay; }) };
    }
    var keep = r.keep.map(function (k) {
      var o = {}, x = byId[k.id];
      for (var p in x) o[p] = x[p];
      o.minutes = k.minutes; o.n = k.taskCount; o.nAll = x.n || 0; o.shortened = k.shortened;
      return o;
    });
    return { keep: keep, move: r.move.map(function (id) { return byId[id]; }), total: total, used: keep.reduce(function (a, x) { return a + x.minutes; }, 0), all: total <= minutes };
  }

  /** Najstarsza zaległa powtórka najpierw: [{ key, due }] → klucze po terminie (remis: kolejność wejścia). */
  function najstarszeZalegle(list) {
    return (list || []).map(function (x, i) { return { key: x.key, due: x.due, i: i }; })
      .sort(function (a, b) { return a.due - b.due || a.i - b.i; })
      .map(function (x) { return x.key; });
  }

  /** „Jedno zadanie”: pierwsza pasująca rzecz. sources: { rematches, due, priority, lessons } (listy id, już ułożone:
   *  rewanże jak w sesji, zaległe od najstarszej, tematy od najwyższego priorytetu, lekcje w kolejności kursu).
   *  exclude: id pominięte w tej wizycie („Inne”). Zwraca { id, source } albo null. */
  var JEDNO_ORDER = ["rematch", "due", "priority", "lesson"];
  var JEDNO_KEY = { rematch: "rematches", due: "due", priority: "priority", lesson: "lessons" };
  function jedno(sources, exclude) {
    exclude = exclude || new Set();
    for (var i = 0; i < JEDNO_ORDER.length; i++) {
      var src = JEDNO_ORDER[i], list = (sources && sources[JEDNO_KEY[src]]) || [];
      var id = list.find(function (x) { return x != null && !exclude.has(x); });
      if (id != null) return { id: id, source: src };
    }
    return null;
  }

  return {
    MIN_SESSION: MIN_SESSION, FIT_OPTIONS: FIT_OPTIONS, scaledTaskCount: scaledTaskCount, fitDay: fitDay, fitOptions: fitOptions,
    pickOneTask: pickOneTask, weakestTopics: weakestTopics, parseExcluded: parseExcluded, enoughForTodayText: enoughForTodayText,
    SKROT_OPCJE: SKROT_OPCJE, SKROT_MIN: SKROT_MIN, SKROT_JEDNA: SKROT_JEDNA, REW_MIN: REW_MIN, MISJA_MIN: MISJA_MIN, LEKCJA_MIN: LEKCJA_MIN,
    minutyPowtorek: minutyPowtorek, minutyRewanzy: minutyRewanzy, ulozDzien: ulozDzien, najstarszeZalegle: najstarszeZalegle, jedno: jedno,
  };
});
