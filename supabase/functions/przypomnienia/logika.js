/* Skrót: przypomnienia mailem bez DOM i bazy (etap 7a „Systemy z Zdawalni w Skrócie”).
   Port 1:1 logiki wyboru z matura-app lib/domain/notifications.ts (najwyżej jedno dziennie, o godzinie osoby, żadnego, gdy
   byłoby tylko nękaniem; zignorowane z rzędu zwalniają: po 3 co drugi dzień, po 7 tylko w niedzielę tydzień po ostatnim),
   tonu z reminder-voice.ts (fakty dokładne, jedno jasne wezwanie, bez poczucia winy) i maila z lib/reminder-email.ts.
   Bez postaci (Majturka nie ma), teksty dla studentów: kolokwium / egzamin, PL i EN.
   Treść według ważności (pierwsza, która pasuje): zaliczenie za 7 / 3 / 1 dzień → powrót po ≥ 4 dniach przerwy → zaległe
   powtórki i rewanże → Zadanie dnia. Nic do przypomnienia albo nauka już dziś → brak maila.
   Dane osoby („stan”) liczy strona (stanZ) i zapisuje w bazie (SQL v36 nauka_przypomnienia_stan); funkcja Edge przypomnienia
   bierze je z nauka_przypomnienia_kandydaci i woła kontekst() → wybierz() → mail().
   Ten plik ładują: index.html (window.SKROT_PRZYP), testy (require) i funkcja Edge jako kopia
   supabase/functions/przypomnienia/logika.js. Po zmianie: cp przypomnienia.js supabase/functions/przypomnienia/logika.js
   (test pilnuje, że kopia jest identyczna). */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SKROT_PRZYP = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  // Jak NOTIFY w matura-app lib/gamification-config.ts, plus powtórki i terminy Skrótu.
  var NOTIFY = {
    everyOtherDayAfterIgnored: 3, // zignorowane z rzędu, po których przypomnienie idzie co drugi dzień…
    weeklyAfterIgnored: 7,        // …a po których tylko w niedzielę
    comebackAfterDays: 4,         // dni bez nauki, po których przypomnienie to „powrót”
    rematchesShown: 5,            // rewanże w przypomnieniu (dzisiejsza porcja) i minuty na każdy
    minutesPerRematch: 2,
    reviewsShown: 20,             // powtórki w przypomnieniu (dzisiejsza porcja), pół minuty na każdą
    secondsPerReview: 30,
  };
  var DNI_TERMINU = [7, 3, 1];   // przypomnienie o zaliczeniu za tyle dni
  var STAN_DNI = 8;              // stan ma liczby zaległych na dziś i 7 kolejnych dni
  var CO = { terminy: true, powtorki: true, zadanie: true };
  var GODZ_DOMYSLNA = 18 * 60;   // decyzja D6: 18:00
  var GODZ_OD = 6 * 60, GODZ_DO = 22 * 60, GODZ_KROK = 30;

  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  var isKey = function (k) { return typeof k === "string" && /^\d{4}-\d{2}-\d{2}$/.test(k); };
  function keyUTC(k) { var a = String(k).split("-"); return Date.UTC(+a[0], +a[1] - 1, +a[2]); }
  function diffDays(to, from) { return Math.round((keyUTC(to) - keyUTC(from)) / 864e5); } // jak dates.ts: diffDays(today, last)
  function addDays(k, n) { var d = new Date(keyUTC(k) + n * 864e5); return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()); }
  // Dzień i minuta doby w Warszawie dla chwili t (ms).
  function warszawa(t) {
    var f = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Warsaw", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
    var o = {};
    f.formatToParts(new Date(t)).forEach(function (p) { o[p.type] = p.value; });
    return { dzien: o.year + "-" + o.month + "-" + o.day, minuta: (+o.hour % 24) * 60 + +o.minute };
  }

  function plural(n, one, few, many) {
    if (n === 1) return one;
    var d = n % 10, t = n % 100;
    return d >= 2 && d <= 4 && (t < 12 || t > 14) ? few : many;
  }
  var minuty = function (n) { return n + " " + plural(n, "minuta", "minuty", "minut"); };

  // ---------- dławienie (port 1:1 ignoredInRow / throttleAllows) ----------
  // history: wysłane przed dzisiaj, najnowsze pierwsze: [{ day, helped }] (helped = otwarte albo nauka tego dnia).
  function ignoredInRow(history) {
    var n = 0;
    for (var i = 0; i < (history || []).length; i++) { if (history[i].helped) break; n++; }
    return n;
  }
  function throttleAllows(history, today) {
    var ignored = ignoredInRow(history), last = history && history[0] ? history[0].day : null;
    if (ignored >= NOTIFY.weeklyAfterIgnored) {
      var sunday = new Date(today + "T12:00:00Z").getUTCDay() === 0;
      return sunday && (!last || diffDays(today, last) >= 7);
    }
    if (ignored >= NOTIFY.everyOtherDayAfterIgnored) return !last || last < addDays(today, -1);
    return true;
  }

  // ---------- ustawienia ----------
  function godzOk(g) { return Number.isInteger(g) && g >= GODZ_OD && g <= GODZ_DO && g % GODZ_KROK === 0; }
  function godzTekst(g) { return pad(Math.floor(g / 60)) + ":" + pad(g % 60); }
  function godziny() { var out = []; for (var g = GODZ_OD; g <= GODZ_DO; g += GODZ_KROK) out.push(g); return out; }
  function coZ(v) {
    var o = v && typeof v === "object" ? v : {};
    return { terminy: o.terminy !== false, powtorki: o.powtorki !== false, zadanie: o.zadanie !== false };
  }

  // ---------- stan liczony na stronie ----------
  // od: dzisiejszy klucz; terminy: [{ d, n, ne, r, dl, own, ok, sid }] (zaliczenia w ciągu 14 dni; r: K | E | W | LAB);
  // pow / rew: przesunięcia terminów (dzień terminu − dziś, ujemne = zaległe) zaległych powtórek i rewanży;
  // zadanie: czy Zadanie dnia jest dostępne (pełny dostęp). Wynik jest mały (< 2 kB) i bez treści pytań.
  function licz(przes) {
    var out = [];
    for (var i = 0; i < STAN_DNI; i++) out.push(0);
    (przes || []).forEach(function (x) {
      if (!Number.isFinite(x)) return;
      for (var i = Math.max(0, Math.ceil(x)); i < STAN_DNI; i++) out[i]++;
    });
    return out;
  }
  function stanZ(o) {
    var ter = (o.terminy || []).filter(function (t) { return t && isKey(t.d) && t.d >= o.od && diffDays(t.d, o.od) <= 14; })
      .sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; }).slice(0, 8)
      .map(function (t) {
        return { d: t.d, n: String(t.n || "").slice(0, 80), ne: String(t.ne || t.n || "").slice(0, 80), r: ["K", "E", "W", "LAB"].indexOf(t.r) >= 0 ? t.r : "K",
          dl: t.dl ? String(t.dl).slice(0, 120) : null, own: !!t.own, ok: !!t.ok, sid: t.sid ? String(t.sid).slice(0, 60) : null };
      });
    return { v: 1, od: o.od, ter: ter, pow: licz(o.pow), rew: licz(o.rew), zad: !!o.zadanie };
  }

  // Terminy z dzisiejszymi datami: termin starosty (dl) bierze datę z bazy (przesunięty → nowa data, usunięty → znika),
  // własna data zostaje. dl: { id: { date, type, approx } } z nauka_docs kolekcji deadlines.
  function terminyAktualne(ter, dl, today) {
    var out = [];
    (ter || []).forEach(function (t) {
      if (!t || !isKey(t.d)) return;
      var x = Object.assign({}, t);
      if (t.dl && !t.own) {
        var cur = dl && dl[t.dl];
        if (!cur || !isKey(cur.date) || ["kolokwium", "egzamin"].indexOf(cur.type) < 0) return;
        x.d = cur.date; x.ok = !!cur.approx;
      }
      if (x.d >= today) out.push(x);
    });
    return out.sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; });
  }

  // ---------- kontekst z wiersza bazy (nauka_przypomnienia_kandydaci) ----------
  function kontekst(row, today) {
    var st = row && row.stan && typeof row.stan === "object" ? row.stan : {};
    var dni = new Set((row && row.dni_nauki) || []);
    var i = isKey(st.od) ? Math.min(STAN_DNI - 1, Math.max(0, diffDays(today, st.od))) : -1;
    var at = function (a) { return i >= 0 && Array.isArray(a) && Number.isFinite(a[i]) ? Math.max(0, a[i]) : 0; };
    var hist = ((row && row.historia) || []).filter(function (h) { return h && isKey(h.day) && h.day < today; })
      .sort(function (a, b) { return a.day < b.day ? 1 : -1; })
      .map(function (h) { return { day: h.day, helped: !!h.opened || dni.has(h.day) }; });
    var last = isKey(row && row.ostatni) && row.ostatni < today ? row.ostatni : null;
    return {
      today: today,
      lang: row && row.jezyk === "en" ? "en" : "pl",
      co: coZ(row && row.co),
      studiedToday: dni.has(today),
      lastStudyDay: last,
      history: hist,
      terminy: terminyAktualne(st.ter, row && row.dl, today),
      powtorki: at(st.pow),
      rewanze: at(st.rew),
      zadanie: !!st.zad,
    };
  }

  // ---------- teksty ----------
  var RODZAJ = { K: ["Kolokwium", "Test"], E: ["Egzamin", "Exam"], W: ["Zaliczenie wykładu", "Lecture assessment"], LAB: ["Zaliczenie laboratorium", "Lab assessment"] };
  var DNI_TYG = [["niedziela", "Sunday"], ["poniedziałek", "Monday"], ["wtorek", "Tuesday"], ["środa", "Wednesday"], ["czwartek", "Thursday"], ["piątek", "Friday"], ["sobota", "Saturday"]];
  var MIES = [["stycznia", "January"], ["lutego", "February"], ["marca", "March"], ["kwietnia", "April"], ["maja", "May"], ["czerwca", "June"], ["lipca", "July"], ["sierpnia", "August"], ["września", "September"], ["października", "October"], ["listopada", "November"], ["grudnia", "December"]];
  function dataTekst(k, en) {
    var d = new Date(keyUTC(k)), j = en ? 1 : 0;
    return en ? DNI_TYG[d.getUTCDay()][1] + " " + d.getUTCDate() + " " + MIES[d.getUTCMonth()][1] : DNI_TYG[d.getUTCDay()][0] + " " + d.getUTCDate() + " " + MIES[d.getUTCMonth()][j];
  }
  function zaIle(n, en) {
    if (en) return n === 1 ? "tomorrow" : n === 7 ? "in a week" : "in " + n + " days";
    return n === 1 ? "jutro" : n === 7 ? "za tydzień" : "za " + n + " " + plural(n, "dzień", "dni", "dni");
  }

  function wybierz(ctx) {
    if (!ctx || ctx.studiedToday) return null;
    if (!throttleAllows(ctx.history || [], ctx.today)) return null;
    var en = ctx.lang === "en", co = coZ(ctx.co);
    if (co.terminy) {
      var t = (ctx.terminy || []).find(function (x) { return DNI_TERMINU.indexOf(diffDays(x.d, ctx.today)) >= 0; });
      if (t) {
        var n = diffDays(t.d, ctx.today), rz = RODZAJ[t.r] || RODZAJ.K, name = en ? t.ne || t.n : t.n;
        var kiedy = zaIle(n, en), data = dataTekst(t.d, en), approx = t.ok ? (en ? " (estimated date)" : " (termin szacunkowy)") : "";
        return en ? {
          kind: "termin", days: n,
          title: rz[1] + ": " + name + ", " + kiedy,
          body: "Your " + name + " " + rz[1].toLowerCase() + ": " + data + approx + ", " + kiedy + ". 15 minutes of review today is a good step.",
          cta: "Review this subject", path: t.sid ? "#/exam/" + t.sid : "#/",
        } : {
          kind: "termin", days: n,
          title: rz[0] + ": " + name + ", " + kiedy,
          body: rz[0] + " z przedmiotu " + name + ": " + data + approx + ", " + kiedy + ". 15 minut powtórki dziś to dobry krok.",
          cta: "Powtórz ten przedmiot", path: t.sid ? "#/exam/" + t.sid : "#/",
        };
      }
    }
    var cokolwiek = (co.powtorki && ctx.powtorki + ctx.rewanze > 0) || (co.zadanie && ctx.zadanie);
    if (cokolwiek && ctx.lastStudyDay && diffDays(ctx.today, ctx.lastStudyDay) >= NOTIFY.comebackAfterDays) {
      var dd = diffDays(ctx.today, ctx.lastStudyDay);
      return en ? {
        kind: "powrot", title: "One short task to start",
        body: "Your last study session in Zdawalni was " + dd + " days ago. Start with one short task, the rest can wait.",
        cta: "One task", path: "#/",
      } : {
        kind: "powrot", title: "Jedno krótkie zadanie na start",
        body: "Ostatnia nauka w Zdawalni: " + dd + " dni temu. Zacznij od jednego krótkiego zadania, reszta spokojnie poczeka.",
        cta: "Jedno zadanie", path: "#/",
      };
    }
    if (co.powtorki && ctx.powtorki + ctx.rewanze > 0) {
      var r = Math.min(ctx.rewanze, NOTIFY.rematchesShown), p = Math.min(ctx.powtorki, NOTIFY.reviewsShown);
      var min = Math.max(1, r * NOTIFY.minutesPerRematch + Math.ceil((p * NOTIFY.secondsPerReview) / 60));
      var czesci = en
        ? [r ? r + " " + (r === 1 ? "rematch" : "rematches") : null, p ? p + " " + (p === 1 ? "review" : "reviews") : null]
        : [r ? r + " " + plural(r, "rewanż", "rewanże", "rewanży") : null, p ? p + " " + plural(p, "powtórka", "powtórki", "powtórek") : null];
      var co2 = czesci.filter(Boolean).join(en ? " and " : " i ");
      return en ? {
        kind: "powtorki", title: "For today: " + co2,
        body: "For today: " + co2 + ". " + min + " " + (min === 1 ? "minute" : "minutes") + " and they are done.",
        cta: "Start reviews", path: "#/review",
      } : {
        kind: "powtorki", title: "Na dziś: " + co2,
        body: "Na dziś: " + co2 + ". " + minuty(min) + " i masz to z głowy.",
        cta: "Zacznij powtórki", path: "#/review",
      };
    }
    if (co.zadanie && ctx.zadanie) {
      return en ? {
        kind: "zadanie", title: "Your daily task is waiting",
        body: "Today's daily task takes a few minutes and earns coins.",
        cta: "Open the daily task", path: "#/",
      } : {
        kind: "zadanie", title: "Zadanie dnia czeka",
        body: "Dzisiejsze Zadanie dnia zajmie kilka minut, a za ukończenie są monety.",
        cta: "Otwórz Zadanie dnia", path: "#/",
      };
    }
    return null;
  }

  // ---------- mail (port lib/reminder-email.ts) ----------
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  // Link z przypomnienia: ?pz=<id wpisu w logu> (strona oznacza przypomnienie jako otwarte), potem trasa.
  function link(site, path, id) { return String(site).replace(/\/$/, "") + "/" + (id ? "?pz=" + encodeURIComponent(id) : "") + (path || "#/"); }
  function mail(o) {
    var en = o.lang === "en", p = o.pick, go = link(o.site, p.path, o.id), off = o.unsubscribeUrl;
    var hello = en ? "Hi!" : "Cześć!";
    var foot = en ? "You get this email because reminders are on in Zdawalni (Settings → Reminders). At most one a day."
      : "Ten mail przychodzi, bo w Zdawalni są włączone przypomnienia (Ustawienia → Przypomnienia). Najwyżej jeden dziennie.";
    var offTxt = en ? "Turn off email reminders" : "Wyłącz przypomnienia mailem";
    var text = [hello, "", p.body, "", p.cta + ": " + go, "", "Zdawalni · zdawalni.pl", "", foot, offTxt + ": " + off].join("\n");
    var html = '<!doctype html>\n<html lang="' + (en ? "en" : "pl") + '"><body style="margin:0;background:#F5F8F6;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1d2b24">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #dde5df;border-radius:14px;padding:24px"><tr><td>' +
      '<p style="margin:0 0 14px;font-size:18px;font-weight:800;color:#1b7f4a">Zdawalni</p>' +
      '<p style="margin:0 0 10px;font-size:16px;line-height:1.5">' + esc(hello) + '</p>' +
      '<p style="margin:0 0 20px;font-size:16px;line-height:1.5">' + esc(p.body) + '</p>' +
      '<a href="' + esc(go) + '" style="display:inline-block;background:#1b7f4a;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 22px;border-radius:10px">' + esc(p.cta) + '</a>' +
      '<p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#4a5a51">' + esc(foot) + ' <a href="' + esc(off) + '" style="color:#4a5a51">' + esc(offTxt) + '</a>.</p>' +
      '</td></tr></table></td></tr></table></body></html>';
    return { subject: p.title, text: text, html: html };
  }

  return { NOTIFY: NOTIFY, DNI_TERMINU: DNI_TERMINU, STAN_DNI: STAN_DNI, CO: CO, GODZ_DOMYSLNA: GODZ_DOMYSLNA, GODZ_OD: GODZ_OD, GODZ_DO: GODZ_DO, GODZ_KROK: GODZ_KROK,
    diffDays: diffDays, addDays: addDays, warszawa: warszawa, ignoredInRow: ignoredInRow, throttleAllows: throttleAllows,
    godzOk: godzOk, godzTekst: godzTekst, godziny: godziny, coZ: coZ, stanZ: stanZ, terminyAktualne: terminyAktualne,
    kontekst: kontekst, wybierz: wybierz, mail: mail, link: link, dataTekst: dataTekst };
});
