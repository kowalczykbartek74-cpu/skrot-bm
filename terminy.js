/* Skrót BM: logika zakładki Terminy bez DOM (grupowanie po czasie, filtr grupy, scalanie duplikatów).
   index.html bierze ją z window.SKROT_TERMS, testy z require("./terminy.js") (node --test tests/).
   Dni liczymy w strefie Europe/Warsaw, tydzień zaczyna się w poniedziałek. Daty terminów to klucze RRRR-MM-DD. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SKROT_TERMS = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var TZ = "Europe/Warsaw";
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };

  // Części daty i godziny w danej strefie dla chwili t (ms).
  function zoneParts(t, tz) {
    var f = new Intl.DateTimeFormat("en-GB", { timeZone: tz || TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
    var o = {};
    f.formatToParts(new Date(t)).forEach(function (p) { o[p.type] = p.value; });
    return { y: +o.year, m: +o.month, d: +o.day, hh: +o.hour % 24, mm: +o.minute };
  }
  // Dzisiejszy dzień w Warszawie (RRRR-MM-DD) i minuta doby.
  function zoneKey(t, tz) { var p = zoneParts(t, tz); return p.y + "-" + pad(p.m) + "-" + pad(p.d); }
  function zoneMinutes(t, tz) { var p = zoneParts(t, tz); return p.hh * 60 + p.mm; }

  // Arytmetyka na kluczach w UTC, więc zmiana czasu (marzec, październik) nie przesuwa dni.
  function keyUTC(k) { var a = String(k).split("-"); return Date.UTC(+a[0], +a[1] - 1, +a[2]); }
  function diffDays(from, to) { return Math.round((keyUTC(to) - keyUTC(from)) / 864e5); }
  function addDays(k, n) { var d = new Date(keyUTC(k) + n * 864e5); return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()); }
  // 0 = poniedziałek … 6 = niedziela
  function weekday(k) { return (new Date(keyUTC(k)).getUTCDay() + 6) % 7; }
  var ym = function (k) { return String(k).slice(0, 7); };
  function monthsBetween(a, b) { return (+b.slice(0, 4) - +a.slice(0, 4)) * 12 + (+b.slice(5, 7) - +a.slice(5, 7)); }

  // Sekcja osi czasu dla terminu: late | week | next | month (reszta bieżącego miesiąca) | mon (kolejne miesiące) | nodate.
  function bucketOf(date, today) {
    if (!date) return { id: "nodate", kind: "nodate" };
    var n = diffDays(today, date);
    if (n < 0) return { id: "late", kind: "late" };
    var endWeek = 6 - weekday(today);
    if (n <= endWeek) return { id: "week", kind: "week" };
    if (n <= endWeek + 7) return { id: "next", kind: "next" };
    if (ym(date) === ym(today)) return { id: "month", kind: "month" };
    return { id: "m:" + ym(date), kind: "mon", ym: ym(date) };
  }
  // Grupuje terminy (już przefiltrowane) w sekcje, w kolejności osi czasu. far = dalej niż 2 miesiące (domyślnie zwinięte).
  function groupByTime(items, today) {
    var order = { late: 0, week: 1, next: 2, month: 3, mon: 4, nodate: 9 };
    var map = new Map();
    sortItems(items).forEach(function (x) {
      var b = bucketOf(x.date, today);
      if (!map.has(b.id)) map.set(b.id, { id: b.id, kind: b.kind, ym: b.ym || null, far: b.kind === "mon" && monthsBetween(ym(today), b.ym) > 2, items: [] });
      map.get(b.id).items.push(x);
    });
    return Array.from(map.values()).sort(function (a, b) { return order[a.kind] - order[b.kind] || String(a.ym).localeCompare(String(b.ym)); });
  }
  function sortItems(items) {
    return items.slice().sort(function (a, b) { return (a.date || "9999").localeCompare(b.date || "9999") || (a.time || "").localeCompare(b.time || "") || String(a.title || "").localeCompare(String(b.title || "")); });
  }

  // Czy termin dotyczy osoby z grupą me.group i labem me.sub ("" = oba laby, null = niewybrany).
  function forMe(groups, subs, me) {
    me = me || {};
    var okG = !groups || !groups.length || (!!me.group && groups.indexOf(me.group) > -1);
    var okS = !subs || !subs.length || me.sub === "" || (!!me.sub && subs.indexOf(me.sub) > -1);
    return okG && okS;
  }

  // Ten sam termin wpisany osobno dla kilku grup (ten sam tytuł, data, godzina, przedmiot, rodzaj i lab) = jedna karta z tagami grup.
  var norm = function (s) { return String(s || "").toLowerCase().replace(/\s+/g, " ").trim(); };
  var sortedSet = function (xs) { return Array.from(new Set(xs)).sort(); };
  function mergeDupes(items) {
    var out = [], byKey = new Map();
    items.forEach(function (x) {
      var k = [x.src, norm(x.title), x.date || "", x.time || "", x.sid || "", x.kind, sortedSet(x.subs || []).join("/")].join("|");
      var y = byKey.get(k);
      if (!y) {
        y = Object.assign({}, x, { keys: x.keys || [x.key], objs: [x.obj], groups: x.groups ? x.groups.slice() : x.groups });
        byKey.set(k, y); out.push(y); return;
      }
      y.keys = y.keys.concat(x.keys || [x.key]);
      y.objs.push(x.obj);
      // Wpis bez grup = cały rok, więc scalona karta też jest dla całego roku.
      y.groups = !y.groups || !y.groups.length || !x.groups || !x.groups.length ? [] : sortedSet(y.groups.concat(x.groups));
      y.done = y.done || !!x.done;
      y.approx = y.approx && !!x.approx;
    });
    return out;
  }

  // Pilność licznika: late (po terminie), red (≤ 3 dni), amber (4–7 dni), calm (> 7 dni).
  function urgency(n) { return n == null ? "none" : n < 0 ? "late" : n <= 3 ? "red" : n <= 7 ? "amber" : "calm"; }
  // Ile zostało do terminu dziś z godziną: minuty (null, gdy bez godziny albo już minęła).
  function minutesLeft(time, nowMin) {
    if (!time || !/^\d{1,2}:\d{2}/.test(time)) return null;
    var a = time.split(":"), left = +a[0] * 60 + +a[1] - nowMin;
    return left > 0 ? left : null;
  }
  // Ile zaliczeń i zadań ma datę w bieżącym miesiącu (od dziś).
  function monthCounts(items, today, catOf) {
    var c = {};
    items.forEach(function (x) {
      if (!x.date || x.done || ym(x.date) !== ym(today) || x.date < today) return;
      var id = catOf(x.kind); c[id] = (c[id] || 0) + 1;
    });
    return c;
  }
  // Ile zaliczeń i zadań przypada od dziś przez kolejne `days` dni (domyślnie 30), bez zrobionych.
  // Zastępuje licznik „w tym miesiącu”, który pod koniec miesiąca pokazywał 0 mimo bliskiego kolokwium.
  function nextDaysCounts(items, today, catOf, days) {
    var c = {}, end = addDays(today, (days || 30) - 1);
    items.forEach(function (x) {
      if (!x.date || x.done || x.date < today || x.date > end) return;
      var id = catOf(x.kind); c[id] = (c[id] || 0) + 1;
    });
    return c;
  }

  return { TZ: TZ, zoneKey: zoneKey, zoneMinutes: zoneMinutes, diffDays: diffDays, addDays: addDays, weekday: weekday, bucketOf: bucketOf, groupByTime: groupByTime, sortItems: sortItems, forMe: forMe, mergeDupes: mergeDupes, urgency: urgency, minutesLeft: minutesLeft, monthCounts: monthCounts, nextDaysCounts: nextDaysCounts };
});
