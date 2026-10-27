/* Skrót BM: przełącznik języka PL / EN.
   Strona jest pisana po polsku. W trybie EN ten plik dociąga słownik (i18n-en.js) i tłumaczy wszystko,
   co trafia na ekran: teksty, title, placeholder, aria-label, alt, okna alert/confirm/prompt.
   Słownik: dokładne teksty, wzorce z {0} {1} (teksty z liczbami i nazwami) i początki zdań („Od starosty · ”).
   Liczebniki (plural) i daty przełącza index.html, gdy SKROT_LANG === "en".
   Wybór: localStorage "skrot-lang" ("pl" | "en"); bez wyboru: EN, gdy przeglądarka nie ma polskiego. */
(function () {
  "use strict";
  var KEY = "skrot-lang";
  var lang = null;
  try { lang = localStorage.getItem(KEY); } catch (e) {}
  try { if (/[?&]lang=(en|pl)\b/.test(location.search)) { lang = RegExp.$1; localStorage.setItem(KEY, lang); } } catch (e) {}
  if (lang !== "en" && lang !== "pl") {
    var langs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "pl"]);
    lang = langs.some(function (l) { return /^pl\b/i.test(l || ""); }) ? "pl" : "en";
  }
  window.SKROT_LANG = lang;
  document.documentElement.lang = lang;

  var I = window.SKROT_I18N = {
    lang: lang,
    en: lang === "en",
    set: function (l) { try { localStorage.setItem(KEY, l); } catch (e) {} location.reload(); },
    toggle: function () { I.set(lang === "en" ? "pl" : "en"); },
    t: function (s) { return s; },
    add: function () {},
    plural: function (n, one, few, many) { return n === 1 ? one : many; },
  };
  if (lang !== "en") return;

  // Słownik ładujemy synchronicznie, żeby pierwszy ekran był już po angielsku.
  document.write('<script src="i18n-en.js?v=' + (document.currentScript && document.currentScript.src.split("v=")[1] || "1") + '"><\/script>');

  var exact = new Map(), pats = [], prefixes = [], suffixes = [], PL = {};
  var TOUCH = false;
  try { TOUCH = matchMedia("(hover: none) and (pointer: coarse)").matches; } catch (e) {}
  var esc = function (s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); };
  var SEP_END = /(\s|·|:|\(|—|–|-|,|„)$/, SEP_START = /^(\s|·|,|\)|—|–|\.|:)/;

  function addEntry(k, v) {
    if (v == null || k === v) return;
    if (/\{\d+\}/.test(k)) {
      var order = [], src = "^", lits = k.split(/\{(\d+)\}/), longest = "";
      for (var i = 0; i < lits.length; i++) {
        if (i % 2) { order.push(+lits[i]); src += "([\\s\\S]*?)"; }
        else { src += esc(lits[i]); if (lits[i].trim().length > longest.length) longest = lits[i].trim(); }
      }
      if (!/[A-Za-zÀ-ž]/.test(longest)) return; // sam wzór typu „{0} · {1}” nic nie daje
      pats.push({ re: new RegExp(src + "$"), order: order, v: v, lit: longest, n: k.length });
      return;
    }
    var key = k.trim();
    if (!key) return;
    exact.set(norm(key), v.trim());
    if (k !== key || SEP_END.test(k)) { if (SEP_END.test(k)) prefixes.push([k.replace(/^\s+/, ""), v.replace(/^\s+/, "")]); }
    if (SEP_START.test(k)) suffixes.push([k, v]);
  }
  function norm(s) { return s.replace(/ /g, " ").replace(/\s+/g, " "); }

  I.add = function (k, v) { if (k && v && k !== v) addEntry(String(k), String(v)); };
  I.load = function (dict) {
    var e = dict.exact || {};
    for (var k in e) addEntry(k, e[k]);
    PL = dict.plural || {};
    pats.sort(function (a, b) { return b.n - a.n; });
    prefixes.sort(function (a, b) { return b[0].length - a[0].length; });
    suffixes.sort(function (a, b) { return b[0].length - a[0].length; });
    if (document.body) walk(document.body);
  };
  I.plural = function (n, one, few, many) {
    var p = PL[one] || PL[many];
    if (!p) return n === 1 ? one : many;
    return n === 1 ? p[0] : p[1];
  };

  var HAS_LETTER = /[A-Za-zÀ-ž]/;
  function tr(s, depth) {
    if (typeof s !== "string" || !HAS_LETTER.test(s)) return s;
    var m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s), core = norm(m[2]);
    var r = core ? find(core, depth || 0) : null;
    if (r == null) return s;
    if (TOUCH) r = r.replace(/\bClick\b/g, "Tap").replace(/\bclick\b/g, "tap").replace(/\bDouble-click\b/g, "Double-tap").replace(/\bdouble-click\b/g, "double-tap").replace(/ \(shortcut \/\)/g, "");
    return m[1] + r + m[3];
  }
  function find(core, depth) {
    var r = exact.get(core);
    if (r != null) return r;
    if (depth > 3) return null;
    for (var i = 0; i < pats.length; i++) {
      var p = pats[i];
      if (p.lit && core.indexOf(p.lit) < 0) continue;
      var mm = p.re.exec(core);
      if (!mm) continue;
      var out = p.v;
      for (var j = 0; j < p.order.length; j++) {
        var g = mm[j + 1], gt = tr(g, depth + 1);
        out = out.split("{" + p.order[j] + "}").join(gt);
      }
      return out;
    }
    for (i = 0; i < prefixes.length; i++) {
      var pk = prefixes[i][0];
      if (core.length > pk.length && core.slice(0, pk.length) === pk) return prefixes[i][1] + tr(core.slice(pk.length), depth + 1);
    }
    for (i = 0; i < suffixes.length; i++) {
      var sk = suffixes[i][0];
      if (core.length > sk.length && core.slice(-sk.length) === sk) return tr(core.slice(0, -sk.length), depth + 1) + suffixes[i][1];
    }
    // „· wykład” → „· lecture”
    var lm = /^([·•\-–—,]\s*)([\s\S]+)$/.exec(core);
    if (lm) { var lt = find(lm[2], depth + 1); if (lt != null) return lm[1] + lt; }
    // „Wykład:” → „Lecture:”
    var pm = /^([\s\S]*?[^\s.:!?…])([.:!?…]+)$/.exec(core);
    if (pm) { var pt = find(pm[1], depth + 1); if (pt != null) return pt + pm[2]; }
    // Złożone podpisy: „Nowy materiał · Makroekonomia · 10 pytań”, „Prawo: Wykład”, listy po przecinku
    var seps = [" · ", " — ", " – ", " | ", " / ", ": ", ", ", " (", ") ", "; "];
    for (i = 0; i < seps.length; i++) {
      if (core.indexOf(seps[i]) < 0) continue;
      var parts = core.split(seps[i]), changed = false;
      for (j = 0; j < parts.length; j++) { var t = tr(parts[j], depth + 1); if (t !== parts[j]) { parts[j] = t; changed = true; } }
      if (changed) return parts.join(seps[i]);
    }
    return null;
  }
  I.t = function (s) { return tr(s, 0); };

  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, CODE: 1, PRE: 1, NOSCRIPT: 1 };
  var ATTRS = ["title", "placeholder", "aria-label", "alt", "data-label"];
  function skipEl(el) {
    for (var e = el; e && e.nodeType === 1; e = e.parentNode) {
      if (SKIP[e.tagName] || e.isContentEditable || e.getAttribute("translate") === "no" || e.hasAttribute("data-noi18n")) return true;
    }
    return false;
  }
  // Pole tekstowe: treść (to, co ktoś wpisał) zostaje, ale podpowiedź i etykieta (placeholder, aria-label, title) się tłumaczą.
  function skipAttr(el) { return el.tagName === "TEXTAREA" ? !el.parentNode || (el.parentNode.nodeType === 1 && skipEl(el.parentNode)) : skipEl(el); }
  function doText(n) {
    var p = n.parentNode;
    if (!p || p.nodeType !== 1 || skipEl(p)) return;
    var v = n.data, t = tr(v, 0);
    if (t !== v) n.data = t;
  }
  function doAttrs(el) {
    for (var i = 0; i < ATTRS.length; i++) {
      var a = el.getAttribute(ATTRS[i]);
      if (a) { var t = tr(a, 0); if (t !== a) el.setAttribute(ATTRS[i], t); }
    }
    if (el.tagName === "INPUT" && /^(button|submit|reset)$/i.test(el.type) && el.value) { var tv = tr(el.value, 0); if (tv !== el.value) el.value = tv; }
  }
  function walk(root) {
    if (root.nodeType === 3) return doText(root);
    if (root.nodeType !== 1 && root.nodeType !== 11) return;
    if (root.nodeType === 1) { if (skipEl(root)) { if (!skipAttr(root)) doAttrs(root); return; } doAttrs(root); }
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null), n;
    while ((n = w.nextNode())) {
      if (n.nodeType === 3) doText(n);
      else if (SKIP[n.tagName]) { if (n.tagName === "TEXTAREA" && !skipAttr(n)) doAttrs(n); continue; }
      else doAttrs(n);
    }
  }
  new MutationObserver(function (list) {
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      if (r.type === "childList") { for (var j = 0; j < r.addedNodes.length; j++) walk(r.addedNodes[j]); }
      else if (r.type === "characterData") doText(r.target);
      else if (r.type === "attributes" && r.target.nodeType === 1) {
        var a = r.target.getAttribute(r.attributeName);
        if (a && !skipAttr(r.target)) { var t = tr(a, 0); if (t !== a) r.target.setAttribute(r.attributeName, t); }
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });

  ["alert", "confirm", "prompt"].forEach(function (f) {
    var orig = window[f];
    if (!orig) return;
    window[f] = function (msg) { var a = [].slice.call(arguments); a[0] = tr(String(msg == null ? "" : msg), 0); return orig.apply(window, a); };
  });
})();
