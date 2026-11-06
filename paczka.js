/* Skrót: paczka i duet tygodnia bez DOM (etap 10).
   Port logiki 1:1 z matura-app (origin/feat/l7-learner-bundle, 9417ccf):
     • lib/domain/squad.ts: squadWeek (cel = 70% zaplanowanych sesji wszystkich, jedna wspólna liczba), squadHistory,
       normalizeSquadCode;
     • lib/domain/duo.ts: duoQuest (para, wspólny cel pon–nd, liczone od dnia, w którym para powstała, nagroda w dniu,
       w którym cel padł, raz w tygodniu) + startOfWeek / addDays z lib/domain/dates.ts.
   Różnice Skrótu (docs/zdawalni/etap-10.md):
     • bez rankingu „kratek”, bez lig i bez szturchnięć (zasada etapu: widać wysiłek, nigdy wyniki), więc rankingOn,
       canNudge i NUDGES nie są przeniesione;
     • Skrót nie ma planu sesji: „zaplanowane” = PLAN_DNI dni nauki na osobę w tygodniu (3);
     • sesja nauki = dzień nauki jednej osoby (jak „dzień nauki” w etapie 6), cel duetu 8 (DUO_TARGET Zdawalni = 10 sesji
       planu), nagroda w monetach (20), a nie w kratkach. Monety liczy i przyznaje baza (SQL v37), ta logika tylko pokazuje;
     • tydzień pon–nd w czasie polskim (Europe/Warsaw), jak nauka_tydzien() w bazie.
   index.html bierze to z window.SKROT_PACZKA, testy z require("./paczka.js"). */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SKROT_PACZKA = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // Te same liczby co nauka_paczka_cfg() w SQL v37 (baza odsyła je w odpowiedzi i to one wygrywają).
  var CFG = { min_osob: 2, max_osob: 8, plan_dni: 3, udzial: 0.7, duet_cel: 8, duet_nagroda: 20 };
  var DUO_TARGET = CFG.duet_cel;
  var DUO_POINTS = CFG.duet_nagroda;
  var DUO_LABEL = "Duet tygodnia";
  var SITE = "https://zdawalni.pl/";

  // ---------- daty (dates.ts) ----------
  function addDays(iso, n) {
    var d = new Date(iso + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }
  /** Poniedziałek tygodnia, w którym jest dzień (ISO). */
  function startOfWeek(iso) {
    var wd = new Date(iso + "T00:00:00Z").getUTCDay(); // 0 = niedziela
    return addDays(iso, -((wd + 6) % 7));
  }
  /** Dzisiejsza data w Polsce (YYYY-MM-DD), niezależnie od strefy urządzenia. */
  function dzisWarszawa(now) {
    var d = now instanceof Date ? now : new Date(now == null ? Date.now() : now);
    try {
      var p = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Warsaw", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d);
      var g = function (t) { for (var i = 0; i < p.length; i++) if (p[i].type === t) return p[i].value; return ""; };
      return g("year") + "-" + g("month") + "-" + g("day");
    } catch (e) {
      return new Date(d.getTime() + 3600e3).toISOString().slice(0, 10); // zapas: CET
    }
  }
  function tydzienWarszawa(now) { return startOfWeek(dzisWarszawa(now)); }
  /** Ile dni tygodnia zostało, licząc dziś (poniedziałek = 7, niedziela = 1). */
  function dniDoKonca(today) {
    var ws = startOfWeek(today), sunday = addDays(ws, 6);
    return Math.round((Date.parse(sunday) - Date.parse(today)) / 86400000) + 1;
  }

  // ---------- paczka (squad.ts) ----------
  /** G8/11.3: cel = 70% zaplanowanych sesji wszystkich, jedna liczba dla całej paczki. */
  function squadWeek(members, goalShare) {
    var share = goalShare == null ? CFG.udzial : goalShare;
    var planned = 0, done = 0;
    for (var i = 0; i < members.length; i++) { planned += members[i].planned; done += members[i].done; }
    var goal = Math.ceil(Math.round(share * planned * 1e6) / 1e6); // 0.7 × 10 = 7, nie 7.000000000000001 → 8
    return { goal: goal, done: done, reached: goal > 0 && done >= goal };
  }

  /** Zakończone tygodnie od założenia paczki z osiągniętym celem i seria takich tygodni. */
  function squadHistory(createdOn, today, weekOf, goalShare) {
    var reachedWeeks = [], streak = 0, thisWeek = startOfWeek(today);
    for (var w = startOfWeek(createdOn); w < thisWeek; w = addDays(w, 7)) {
      var r = squadWeek(weekOf(w), goalShare);
      if (r.reached) { reachedWeeks.push(w); streak++; }
      else if (r.goal > 0) streak = 0;
    }
    if (squadWeek(weekOf(thisWeek), goalShare).reached) streak++;
    return { reachedWeeks: reachedWeeks, streak: streak };
  }

  /** Kody paczek: 6 znaków; przyjmuje spacje, myślniki i małe litery. */
  function normalizeSquadCode(raw) {
    var c = String(raw == null ? "" : raw).trim().toUpperCase().replace(/[\s-]/g, "");
    return /^[A-Z0-9]{6}$/.test(c) ? c : null;
  }

  // ---------- duet (duo.ts) ----------
  function duoQuest(input) {
    var target = input.target == null ? DUO_TARGET : input.target;
    var points = input.points == null ? DUO_POINTS : input.points;
    var perDay = {};
    function add(list, who) {
      for (var i = 0; i < (list || []).length; i++) {
        var d = list[i];
        if (d.day < input.since || d.day > input.today || d.count <= 0) continue;
        var v = perDay[d.day] || (perDay[d.day] = { mine: 0, theirs: 0 });
        v[who] += d.count;
      }
    }
    add(input.mine, "mine");
    add(input.theirs, "theirs");

    var awards = [], weeks = {}, order = [];
    var days = Object.keys(perDay).sort();
    for (var i = 0; i < days.length; i++) {
      var ws = startOfWeek(days[i]);
      if (!weeks[ws]) { weeks[ws] = []; order.push(ws); }
      weeks[ws].push(days[i]);
    }
    for (var k = 0; k < order.length; k++) {
      var sum = 0, list = weeks[order[k]];
      for (var j = 0; j < list.length; j++) {
        var v = perDay[list[j]];
        sum += v.mine + v.theirs;
        if (sum >= target) { awards.push({ day: list[j], points: points, label: DUO_LABEL }); break; }
      }
    }

    var w0 = startOfWeek(input.today), mine = 0, theirs = 0;
    for (var day in perDay) {
      if (day >= w0 && day <= input.today) { mine += perDay[day].mine; theirs += perDay[day].theirs; }
    }
    return { awards: awards, week: { mine: mine, theirs: theirs, target: target, complete: mine + theirs >= target, daysLeft: dniDoKonca(input.today) } };
  }

  // ---------- Skrót: odpowiedź bazy → to, co pokazuje widok ----------
  function cfgZ(c) {
    var o = {};
    for (var k in CFG) o[k] = c && typeof c[k] === "number" ? c[k] : CFG[k];
    return o;
  }

  /** Wspólny cel tygodnia paczki z członków z bazy ({ dni }): squadWeek z PLAN_DNI na osobę. */
  function celPaczki(czlonkowie, cfg) {
    var c = cfgZ(cfg), m = [];
    for (var i = 0; i < (czlonkowie || []).length; i++) m.push({ planned: c.plan_dni, done: Math.max(0, czlonkowie[i].dni | 0) });
    var r = squadWeek(m, c.udzial);
    return { cel: r.goal, zrobione: r.done, gotowe: r.reached, proc: r.goal > 0 ? Math.min(100, Math.round((100 * r.done) / r.goal)) : 0, brakuje: Math.max(0, r.goal - r.done) };
  }

  /** Postęp duetu z odpowiedzi bazy ({ moje, jego, cel }). */
  function postepDuetu(duet, today) {
    var cel = duet && duet.cel > 0 ? duet.cel : DUO_TARGET;
    var moje = Math.max(0, (duet && duet.moje) | 0), jego = Math.max(0, (duet && duet.jego) | 0), suma = moje + jego;
    return { moje: moje, jego: jego, suma: suma, cel: cel, gotowe: suma >= cel, brakuje: Math.max(0, cel - suma),
      proc: Math.min(100, Math.round((100 * suma) / cel)), dniDoKonca: today ? dniDoKonca(today) : null };
  }

  /** Nazwa osoby: pseudonim albo „Osoba N” (kolejność dołączenia). */
  function nazwa(m, i) {
    var n = m && typeof m.nick === "string" ? m.nick.trim() : "";
    return n || "Osoba " + ((i | 0) + 1);
  }

  /** Link zaproszenia do paczki. */
  function link(kod, site) { var k = normalizeSquadCode(kod); return k ? (site || SITE) + "?paczka=" + k : null; }

  /** Kod z adresu strony (?paczka=KOD) albo null. */
  function kodZAdresu(search) {
    var m = /[?&]paczka=([^&#]*)/i.exec(String(search || ""));
    if (!m) return null;
    var raw; try { raw = decodeURIComponent(m[1].replace(/\+/g, " ")); } catch (e) { raw = m[1]; }
    return normalizeSquadCode(raw);
  }

  /** Jedno zdanie o duecie (po polsku; i18n-en.js ma wzorce). */
  function opisDuetu(p) {
    if (p.gotowe) return "Cel osiągnięty: " + p.suma + "/" + p.cel + " sesji.";
    var dni = p.dniDoKonca;
    return "Razem " + p.suma + "/" + p.cel + " sesji. Brakuje " + p.brakuje + (dni ? ", do niedzieli dni: " + dni + "." : ".");
  }

  return {
    CFG: CFG, DUO_TARGET: DUO_TARGET, DUO_POINTS: DUO_POINTS, DUO_LABEL: DUO_LABEL, SITE: SITE,
    addDays: addDays, startOfWeek: startOfWeek, dzisWarszawa: dzisWarszawa, tydzienWarszawa: tydzienWarszawa, dniDoKonca: dniDoKonca,
    squadWeek: squadWeek, squadHistory: squadHistory, normalizeSquadCode: normalizeSquadCode, duoQuest: duoQuest,
    cfgZ: cfgZ, celPaczki: celPaczki, postepDuetu: postepDuetu, nazwa: nazwa, link: link, kodZAdresu: kodZAdresu, opisDuetu: opisDuetu,
  };
});
