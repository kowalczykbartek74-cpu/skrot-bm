/* Panel kierunków (tylko administrator): wszystkie roczniki w jednym miejscu, bez przełączania strony.
   Bez DOM i bez bazy: dostaje wiersze nauka_docs wszystkich roczników (skrot-supabase.js → skrot.panelKierunkow.wczytaj,
   reguła „nauka czytaj” z v44 daje administratorowi wszystkie roczniki) i liczy z nich to, co rysuje index.html (viewKierunkiPanel).
   Wiersz: { id, rocznik_id, data? }. Wiersz bez rocznika (rocznik_id null) widzą wszystkie roczniki, tak jak w makeDb.
   index.html bierze to z window.SKROT_PANEL_KIERUNKOW, testy z require("./kierunki-panel.js"). Testy: node --test tests/*.test.js */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SKROT_PANEL_KIERUNKOW = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // Kolekcje, z których panel pobiera tylko id (czy dokument jest), i te, z których potrzebuje danych.
  var Z_DANYMI = ["materials", "deadlines", "announcements"];
  var TYLKO_ID = ["materialSimple", "quizWhy", "exams", "examBank", "glossary", "tasks"];

  // Ten sam slug co w index.html (buildSubjects): przedmiot = nazwa z planu.
  function slug(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  // Przedmioty z planu rocznika (plan.json: groups → odd/even → { pl, en, k }), alfabetycznie. Zły plan → [].
  function przedmiotyZPlanu(plan) {
    var map = {};
    var groups = (plan && plan.groups) || {};
    Object.keys(groups).forEach(function (g) {
      ["odd", "even"].forEach(function (w) {
        (groups[g][w] || []).forEach(function (e) {
          if (!e || e.k === "X" || !e.pl) return;
          var id = slug(e.pl);
          if (!map[id]) map[id] = { id: id, pl: e.pl, en: String(e.en || "").replace(/\bIntelectual\b/g, "Intellectual") };
        });
      });
    });
    return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return a.pl.localeCompare(b.pl, "pl"); });
  }
  // Nazwa przedmiotu, którego nie ma w planie: ze sluga („podstawy-finansow” → „Podstawy finansow”).
  function nazwaZeSluga(id) {
    var t = String(id || "").replace(/-+/g, " ").trim();
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : "Bez przedmiotu";
  }

  // Wiersze jednego rocznika: jego własne i wspólne (bez rocznika).
  function wRoczniku(rows, rid) {
    return (Array.isArray(rows) ? rows : []).filter(function (r) { return r && (r.rocznik_id == null || r.rocznik_id === rid); });
  }
  function dane(r) { return (r && r.data) || {}; }
  function zbiorId(rows, rid) {
    var s = {};
    wRoczniku(rows, rid).forEach(function (r) { s[String(r.id)] = true; });
    return s;
  }
  var liczba = function (v) { v = Number(v); return isFinite(v) && v > 0 ? Math.round(v) : 0; };
  var dzienZ = function (d) { var m = /^(\d{4}-\d{2}-\d{2})/.exec(String(d || "")); return m ? m[1] : ""; };

  // Materiały rocznika z tym, co o nich wiadomo bez pobierania treści.
  function materialy(D, rid) {
    var simple = zbiorId(D.materialSimple, rid), why = zbiorId(D.quizWhy, rid);
    return wRoczniku(D.materials, rid).map(function (r) {
      var m = dane(r), id = String(r.id);
      return {
        id: id,
        rocznik: r.rocznik_id || null,
        subjectId: m.subjectId || "",
        title: String(m.title || m.fileName || "Bez tytułu"),
        lekcja: m.kind === "lesson",
        order: Number(m.order) || 0,
        zrodlo: m.source === "sylabus" ? "sylabus" : m.kind === "lesson" ? "lekcja" : "plik",
        fiszki: liczba(m.flashcardCount),
        pytania: liczba(m.quizCount),
        zadania: liczba(m.workedCount),
        prosciej: !!simple[id],
        dlaczego: !!why[id],
        createdAt: Number(m.createdAt) || 0,
        updatedAt: r.updated_at || null,
      };
    });
  }

  // Liczby do kafelków i do porównania roczników. dzis = "RRRR-MM-DD".
  function podsumowanie(D, rid, dzis) {
    D = D || {};
    var ms = materialy(D, rid), ter = wRoczniku(D.deadlines, rid).map(dane);
    var z = function (f) { return ms.filter(f).length; };
    var suma = function (k) { return ms.reduce(function (a, m) { return a + m[k]; }, 0); };
    var przed = {};
    ms.forEach(function (m) { if (m.subjectId) przed[m.subjectId] = true; });
    var ost = 0;
    ms.forEach(function (m) { if (m.createdAt > ost) ost = m.createdAt; });
    return {
      materialy: ms.length,
      lekcje: z(function (m) { return m.lekcja; }),
      pliki: z(function (m) { return !m.lekcja; }),
      fiszki: suma("fiszki"),
      pytania: suma("pytania"),
      prosciej: z(function (m) { return m.prosciej; }),
      // „Dlaczego?” ma sens tylko przy materiale z quizem
      zQuizem: z(function (m) { return m.pytania > 0; }),
      dlaczego: z(function (m) { return m.pytania > 0 && m.dlaczego; }),
      przedmiotyZTresciami: Object.keys(przed).length,
      terminy: ter.length,
      terminyNadchodzace: ter.filter(function (t) { var d = dzienZ(t.date); return d && (!dzis || d >= dzis); }).length,
      ogloszenia: wRoczniku(D.announcements, rid).length,
      kolokwia: wRoczniku(D.exams, rid).length,
      bankiPytan: wRoczniku(D.examBank, rid).length,
      slowniczki: wRoczniku(D.glossary, rid).length,
      zadaniaTeams: wRoczniku(D.tasks, rid).length,
      ostatniMaterial: ost || null,
    };
  }

  // Przedmioty rocznika: wszystkie z planu (także puste) + te, które mają materiały, a nie ma ich w planie.
  // nazwy = przedmiotyZPlanu(plan) albo SUBJECTS strony. Kolejność jak w planie (alfabetycznie), żeby lista się nie przestawiała
  // po dodaniu materiału; przedmioty spoza planu na końcu, puste mają pusty = true.
  function przedmioty(D, rid, nazwy, dzis) {
    D = D || {};
    var ms = materialy(D, rid), ter = wRoczniku(D.deadlines, rid).map(dane);
    var out = [], byId = {};
    (Array.isArray(nazwy) ? nazwy : []).forEach(function (s) {
      if (!s || !s.id || byId[s.id]) return;
      byId[s.id] = { id: s.id, pl: s.pl || nazwaZeSluga(s.id), en: s.en || "", wPlanie: true, materialy: [] };
      out.push(byId[s.id]);
    });
    var poza = [];
    ms.forEach(function (m) {
      var k = m.subjectId || "";
      if (!byId[k]) { byId[k] = { id: k, pl: k ? nazwaZeSluga(k) : "Bez przedmiotu", en: "", wPlanie: false, materialy: [] }; poza.push(byId[k]); }
      byId[k].materialy.push(m);
    });
    poza.sort(function (a, b) { return a.pl.localeCompare(b.pl, "pl"); });
    out = out.concat(poza);
    out.forEach(function (s) {
      // lekcje po kolejności, potem pliki od najnowszego
      s.materialy.sort(function (a, b) { return (b.lekcja - a.lekcja) || (a.lekcja ? a.order - b.order : b.createdAt - a.createdAt) || a.title.localeCompare(b.title, "pl"); });
      var ml = s.materialy;
      s.lekcje = ml.filter(function (m) { return m.lekcja; }).length;
      s.pliki = ml.length - s.lekcje;
      s.fiszki = ml.reduce(function (a, m) { return a + m.fiszki; }, 0);
      s.pytania = ml.reduce(function (a, m) { return a + m.pytania; }, 0);
      s.bezProsciej = ml.filter(function (m) { return !m.prosciej; }).length;
      s.bezDlaczego = ml.filter(function (m) { return m.pytania > 0 && !m.dlaczego; }).length;
      s.terminy = ter.filter(function (t) { var d = dzienZ(t.date); return t.subjectId === s.id && d && (!dzis || d >= dzis); }).length;
      s.pusty = !ml.length;
    });
    return out;
  }

  // Najbliższe terminy rocznika (od dziś), najwyżej n.
  function nadchodzace(D, rid, dzis, n) {
    return wRoczniku((D || {}).deadlines, rid).map(function (r) { var t = dane(r); return { id: String(r.id), title: String(t.title || ""), type: t.type || "", subjectId: t.subjectId || "", date: dzienZ(t.date), time: t.time || "" }; })
      .filter(function (t) { return t.date && (!dzis || t.date >= dzis); })
      .sort(function (a, b) { return a.date.localeCompare(b.date) || String(a.time).localeCompare(String(b.time)); })
      .slice(0, n || 5);
  }
  // Ostatnie ogłoszenia rocznika, od najnowszego, najwyżej n.
  function ogloszenia(D, rid, n) {
    return wRoczniku((D || {}).announcements, rid).map(function (r) { var a = dane(r); return { id: String(r.id), text: String(a.text || ""), createdAt: Number(a.createdAt) || 0 }; })
      .sort(function (a, b) { return b.createdAt - a.createdAt; })
      .slice(0, n || 3);
  }

  // Wiersze, które przyszły bez rocznika z roczników, których strona nie zna (np. rocznik tylko w bazie): lista id roczników z danych.
  function rocznikiZDanych(D) {
    var s = {};
    Z_DANYMI.concat(TYLKO_ID).forEach(function (k) { ((D || {})[k] || []).forEach(function (r) { if (r && r.rocznik_id) s[r.rocznik_id] = true; }); });
    return Object.keys(s).sort();
  }

  // Adres po przełączeniu strony na rocznik: materiał, przedmiot, jeden z ekranów z listy albo Dziś.
  var WIDOKI = ["home", "materials", "terms", "review", "more", "starosta", "ai", "upload"];
  function adresPo(cel) {
    if (cel && cel.material) return "#/material/" + encodeURIComponent(cel.material);
    if (cel && cel.przedmiot) return "#/subject/" + encodeURIComponent(cel.przedmiot);
    if (cel && WIDOKI.indexOf(cel.widok) >= 0) return "#/" + cel.widok;
    return "#/home";
  }

  return { Z_DANYMI: Z_DANYMI, TYLKO_ID: TYLKO_ID, slug: slug, przedmiotyZPlanu: przedmiotyZPlanu, nazwaZeSluga: nazwaZeSluga, wRoczniku: wRoczniku,
    materialy: materialy, podsumowanie: podsumowanie, przedmioty: przedmioty, nadchodzace: nadchodzace, ogloszenia: ogloszenia,
    rocznikiZDanych: rocznikiZDanych, adresPo: adresPo, WIDOKI: WIDOKI };
});
