/* Skrót: rewanże (zeszyt błędów) bez DOM. Port 1:1 z matura-app lib/domain/mistakes.ts + rematch.ts (wersja z FSRS).
   Zła odpowiedź (albo zgadnięta dobra) zapisuje pytanie do rewanżu: wraca, gdy powie jego karta FSRS odtworzona z dni
   odpowiedzi (zwykle jutro, potem po kilku dniach, potem po około tygodniu; szybciej, gdy dalej nie wychodzi).
   Rewanż wygrany = pełna poprawna odpowiedź INNEGO dnia niż błąd; trzecia wygrana z rzędu „pokonuje” pytanie
   (dalej wraca w zwykłych powtórkach). Kilka odpowiedzi jednego dnia liczy się raz, decyduje najgorsza.
   Dni to liczby całkowite (dayN w index.html). Historia klucza: [[dzień, wynik 0–1], …] rosnąco, jeden wpis na dzień.
   index.html bierze to z window.SKROT_REW, testy z require("./rewanze.js"). */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SKROT_REW = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var WINS = 3; // wygrane dni z rzędu, które pokonują pytanie
  var STEPS = [1, 3, 7]; // gdy nie ma learner.js (FSRS): stałe odstępy jak w pierwszej wersji zeszytu
  var PER_DAY = 10; // rewanże na początku dzisiejszej sesji (reszta czeka, nic nie jest „zaległe”)
  var MAX_KEYS = 400, MAX_DAYS = 12;
  var EXPLAIN_AFTER = 3; // tyle przegranych z rzędu → podpowiedź, żeby wrócić do lekcji

  // Jeden wynik na dzień: najgorsza odpowiedź dnia; rosnąco po dniu.
  function dni(hist) {
    var m = new Map();
    (Array.isArray(hist) ? hist : []).forEach(function (a) {
      if (!Array.isArray(a) || !Number.isInteger(a[0])) return;
      var s = Math.max(0, Math.min(1, Number(a[1]) || 0));
      m.set(a[0], Math.min(s, m.has(a[0]) ? m.get(a[0]) : 1));
    });
    return Array.from(m.entries()).sort(function (x, y) { return x[0] - y[0]; });
  }
  function zapisz(hist, day, score) { return dni((hist || []).concat([[day, score]])).slice(-MAX_DAYS); }

  // Termin z karty FSRS odtworzonej z dni (replay z learner.js) albo ze stałych kroków.
  function termin(list, step, replay) {
    var last = list[list.length - 1][0], d = null;
    if (typeof replay === "function") { try { d = replay(list.map(function (x) { return [x[0], x[1] < 1 ? 0 : 1]; })); } catch (e) { d = null; } }
    if (!Number.isInteger(d)) d = last + STEPS[Math.min(step, STEPS.length - 1)];
    return Math.max(d, last + 1);
  }

  // Stan pytania: none | mastered { since } | due/waiting { due, step, lastWrong }.
  function stan(hist, today, replay) {
    var list = dni(hist), lastWrong = -1;
    list.forEach(function (x, i) { if (x[1] < 1) lastWrong = i; });
    if (lastWrong < 0) return { status: "none" };
    var step = list.length - 1 - lastWrong, lastDay = list[list.length - 1][0];
    if (step >= WINS) return { status: "mastered", since: lastDay };
    var due = termin(list, step, replay);
    return { status: due <= today ? "due" : "waiting", due: due, step: step, lastWrong: list[lastWrong][0] };
  }
  var wZeszycie = function (s) { return s.status === "due" || s.status === "waiting"; };

  function przegraneZRzedu(hist) {
    var list = dni(hist), n = 0;
    for (var i = list.length - 1; i >= 0 && list[i][1] < 1; i--) n++;
    return n;
  }

  // Co zrobiła z rewanżem odpowiedź last = { day, score } (before: historia bez niej). null = nic do powiedzenia.
  function nota(before, last, today, replay) {
    var was = stan(before, today, replay), all = (before || []).concat([[last.day, last.score]]), now = stan(all, today, replay);
    if (last.score < 1) {
      if (!wZeszycie(was)) return { kind: "saved" };
      if (was.lastWrong === last.day) return null; // dziś już był błąd: wynik dnia się nie zmienia
      return { kind: "lost", lossesInRow: przegraneZRzedu(all) };
    }
    if (!wZeszycie(was)) return null;
    if (now.status === "mastered") return { kind: "defeated" };
    if (now.step > was.step) return { kind: "won", nextInDays: now.due - today };
    return null;
  }
  var trzebaWyjasnic = function (n) { return !!n && n.kind === "lost" && n.lossesInRow >= EXPLAIN_AFTER; };

  // Teksty dla studenta (słaby wynik nigdy nie zawstydza).
  function plDni(n) { return n === 1 ? "dzień" : "dni"; }
  function tekst(n) {
    if (!n) return "";
    if (n.kind === "saved") return "Zapisane do rewanżu. Wróci jutro.";
    if (n.kind === "won") return "Rewanż wygrany! Wróci jeszcze za " + n.nextInDays + " " + plDni(n.nextInDays) + ".";
    if (n.kind === "defeated") return "Pytanie pokonane! Dalej będzie czasem wracać w zwykłych powtórkach.";
    if (n.kind === "lost") return trzebaWyjasnic(n) ? "Rewanż jeszcze nie wyszedł, wróci jutro. To już kolejny raz z rzędu: zajrzyj do lekcji z tego tematu." : "Rewanż jeszcze nie wyszedł. Wróci jutro, spokojnie.";
    return "";
  }

  // Czy zapisać odpowiedź: błąd zawsze, dobra tylko dla pytania, które jest w zeszycie.
  function zapisac(before, score, today, replay) { return score < 1 || wZeszycie(stan(before, today, replay)); }

  // Dzisiejsze rewanże (klucze): najpierw najdawniej czekające. filter(k) = np. tylko przedmiot.
  // st (opcjonalnie): Map klucz → stan policzony wcześniej (stany()), żeby nie liczyć FSRS przy każdym rysowaniu.
  function stany(rew, today, replay) {
    var m = new Map();
    Object.keys(rew || {}).forEach(function (k) { m.set(k, stan(rew[k], today, replay)); });
    return m;
  }
  var stOf = function (st, rew, k, today, replay) { return st ? st.get(k) || { status: "none" } : stan(rew[k], today, replay); };
  function naDzis(rew, today, replay, filter, st) {
    var out = [];
    Object.keys(rew || {}).forEach(function (k) {
      if (filter && !filter(k)) return;
      var s = stOf(st, rew, k, today, replay);
      if (s.status === "due") out.push([k, s.due, s.lastWrong]);
    });
    out.sort(function (a, b) { return a[1] - b[1] || a[2] - b[2] || (a[0] < b[0] ? -1 : 1); });
    return out.map(function (x) { return x[0]; });
  }
  // Klucze w zeszycie (czekające albo na dziś): te nie idą do zwykłych powtórek, dopóki nie zostaną pokonane.
  function wZeszycieKlucze(rew, today, replay, st) {
    var out = new Set();
    Object.keys(rew || {}).forEach(function (k) { if (wZeszycie(stOf(st, rew, k, today, replay))) out.add(k); });
    return out;
  }
  function podsumuj(rew, today, replay, filter, st) {
    var r = { due: 0, waiting: 0, mastered: 0, nextDue: null };
    Object.keys(rew || {}).forEach(function (k) {
      if (filter && !filter(k)) return;
      var s = stOf(st, rew, k, today, replay);
      if (s.status === "due") r.due++;
      else if (s.status === "mastered") r.mastered++;
      else if (s.status === "waiting") { r.waiting++; if (r.nextDue == null || s.due < r.nextDue) r.nextDue = s.due; }
    });
    return r;
  }
  // Najwyżej MAX_KEYS kluczy: najpierw odpadają najdawniej pokonane, potem najstarsze.
  function przytnij(rew, today, replay) {
    var ks = Object.keys(rew || {});
    if (ks.length <= MAX_KEYS) return rew;
    var rank = ks.map(function (k) { var s = stan(rew[k], today, replay), l = dni(rew[k]); return [k, s.status === "mastered" ? 0 : 1, l.length ? l[l.length - 1][0] : 0]; });
    rank.sort(function (a, b) { return b[1] - a[1] || b[2] - a[2]; });
    var out = {};
    rank.slice(0, MAX_KEYS).forEach(function (x) { out[x[0]] = rew[x[0]]; });
    return out;
  }

  // Klucz pytania z quizu przedmiotu (content.quiz[idx]; indeksy są stałe, pytania tylko dopisujemy).
  var quizKey = function (mid, idx) { return "z:" + mid + ":" + idx; };
  // Jednorazowo: stara lista pomylonych w grach (bm-gry-zle: { "mid:idx": dzień }) → historia rewanży.
  // Pytania z „Po zajęciach” (po~…) nie mają treści w materiałach, więc zostają poza rewanżami.
  function zGier(gry, rew) {
    var out = Object.assign({}, rew || {}), n = 0;
    Object.keys(gry || {}).forEach(function (k) {
      var m = /^([^:~]+):(\d+)$/.exec(k), d = gry[k];
      if (!m || !Number.isInteger(d)) return;
      var key = quizKey(m[1], +m[2]);
      out[key] = zapisz(out[key], d, 0); n++;
    });
    return { rew: out, n: n };
  }

  // replay dla stan(): karta FSRS z learner.js (SkrotLearner.memory.replayCard), dni jako daty ISO.
  function replayZ(L) {
    var rc = L && L.memory && L.memory.replayCard;
    if (typeof rc !== "function") return null;
    var iso = function (d) { return new Date(d * 864e5).toISOString().slice(0, 10); };
    return function (list) {
      var card = rc(list.map(function (x) { return { day: iso(x[0]), taskId: "task", score: x[1], confidence: null, timeMs: null, mode: "session", taskType: "closed" }; }));
      return card ? Math.round(Date.parse(card.due) / 864e5) : null;
    };
  }

  return { replayZ: replayZ, WINS: WINS, STEPS: STEPS, PER_DAY: PER_DAY, MAX_KEYS: MAX_KEYS, MAX_DAYS: MAX_DAYS, EXPLAIN_AFTER: EXPLAIN_AFTER,
    dni: dni, zapisz: zapisz, stan: stan, wZeszycie: wZeszycie, przegraneZRzedu: przegraneZRzedu, nota: nota, trzebaWyjasnic: trzebaWyjasnic,
    tekst: tekst, zapisac: zapisac, stany: stany, naDzis: naDzis, wZeszycieKlucze: wZeszycieKlucze, podsumuj: podsumuj, przytnij: przytnij, quizKey: quizKey, zGier: zGier };
});
