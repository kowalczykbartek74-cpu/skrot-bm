// Skrót BM: gry Fruń, Pary, Przejdź (docs/gry/SPEC.md). Ładowane przy pierwszym wejściu w grę; wszystko z index.html
// przychodzi w GRY_API (open(gra, { api })), w demo z gry-demo.js. Punkty rankingu liczy tylko baza (window.skrot.rp).
(() => {
"use strict";
const GRY_CFG = {
  step: 1 / 60,            // stały krok fizyki (s)
  maxSteps: 5,             // max kroków fizyki na klatkę (po zawieszeniu karty nie nadrabiamy wieczności)
  dprMax: 2,               // ostrość canvasu: min(devicePixelRatio, 2)
  W: 360,                  // szerokość świata w jednostkach logicznych; wysokość z proporcji ekranu
  revive: { max: 2, abcdSec: 20, taskSec: 60, invulnSec: 2 },
  minQuestions: 20,        // przedmiot z mniejszą liczbą pytań ABCD jest wyszarzony
  runQuestionsMax: 12,     // tyle pytań najwyżej na rundę (wskrzeszenia + bramki)
  xpPerCorrect: 5,         // XP (⚡) za dobrą odpowiedź w grze, pula "games"
  frun: {
    gravity: 1500, flapV: -440, maxFall: 700, x: 100, r: 12, // promień kolizji mniejszy niż rysunek (14) – gra wybacza
    pipeW: 64, gap0: 170, gapMin: 130, gapStep: 4,          // przerwa maleje o 4 co 10 kolumn
    spacing: 210, speed0: 140, speedStep: 8, speedMax: 220,  // prędkość rośnie o 8 co 10 kolumn
    ground: 80, gapMaxShift: 180, margin: 110,
  },
  przejdz: {
    cols: 9, cell: 40, hopMs: 120, startRows: 4,
    carSpeed0: 60, carSpeedStep: 15, carSpeedMax: 160,
    logSpeed0: 40, logSpeedStep: 10, logLen: [2, 4],
    tramEvery: [4, 7], tramWarn: 1.2, tramSpeed: 900,
    autoScrollFrom: 10, autoScroll: 0.25,   // od 10. rzędu ekran sam jedzie 0,25 rzędu/s
    gateEvery: 25,                          // co 25 rzędów bramka z pytaniem
  },
  pary: { sizes: { latwy: [4, 3], sredni: [4, 4], trudny: [5, 4] }, flipBackMs: 900, explainMs: 1500 },
};

// Losowość tylko z seeda rundy (z bazy), nigdy Math.random(): rundę da się odtworzyć.
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const shuffled = (arr, rnd) => { const b = arr.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const ls = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} } };

// =====================================================================
// FRUŃ: listek leci między półkami z książkami (SPEC 6.2)
// =====================================================================
const FRUN = (() => {
  const C = GRY_CFG.frun, POOL = 8, BOOKS = 12;
  let W, H, rnd, col, subj;
  let st, y, py, vy, ang, score, tDie, tShake, invuln, blink, scroll, pscroll, nextX, lastGap, death;
  // kolumny z puli (bez alokacji w pętli); bc/bw = kolory i szerokości grzbietów książek
  const pipes = Array.from({ length: POOL }, () => ({ on: false, x: 0, px: 0, gy: 0, gap: 0, passed: false, bc: new Array(BOOKS).fill(0), bw: new Array(BOOKS).fill(0) }));
  const speed = () => Math.min(C.speedMax, C.speed0 + C.speedStep * Math.floor(score / 10));
  const gapNow = () => Math.max(C.gapMin, C.gap0 - C.gapStep * Math.floor(score / 10));
  function spawn(x) {
    const p = pipes.find((q) => !q.on); if (!p) return;
    const lo = C.margin, hi = H - C.ground - C.margin;
    let gy = lo + rnd() * Math.max(0, hi - lo);
    if (lastGap != null) gy = clamp(gy, lastGap - C.gapMaxShift, lastGap + C.gapMaxShift);
    lastGap = gy;
    p.on = true; p.x = p.px = x; p.gy = gy; p.gap = gapNow(); p.passed = false;
    for (let i = 0; i < BOOKS; i++) { p.bc[i] = Math.floor(rnd() * Math.max(1, subj.length)); p.bw[i] = 6 + Math.floor(rnd() * 6); }
    nextX = x + C.pipeW + C.spacing;
  }
  // Koło (listek) kontra prostokąt.
  const hitRect = (cx, cy, r, x, y0, w, h) => { const dx = cx - clamp(cx, x, x + w), dy = cy - clamp(cy, y0, y0 + h); return dx * dx + dy * dy < r * r; };
  const game = {
    id: "frun", title: "Fruń", revive: true,
    init(ctx) {
      W = ctx.W; H = ctx.H; rnd = ctx.rnd; col = ctx.colors; subj = ctx.subjectColors.length ? ctx.subjectColors : [col.shelf];
      pipes.forEach((p) => { p.on = false; });
      st = "gotowy"; y = py = (H - C.ground) / 2; vy = 0; ang = 0; score = 0; tDie = 0; tShake = 0; invuln = 0; blink = 0; scroll = pscroll = 0; lastGap = null; death = "";
      nextX = W + 60;
    },
    hint() { return st === "gotowy" ? (score || invuln ? "Dotknij, żeby grać dalej" : "Dotknij, żeby lecieć") : ""; },
    update(dt, input) {
      py = y; pscroll = scroll;
      for (const p of pipes) p.px = p.x;
      if (st === "gotowy") {
        blink += dt; y = py = (H - C.ground) / 2 + Math.sin(blink * 3) * 6;
        if (input.tap) { st = "gra"; vy = C.flapV; if (score || invuln) invuln = GRY_CFG.revive.invulnSec; GAME_SFX("hop"); }
        return;
      }
      if (st === "smierc") {
        tDie += dt; tShake = Math.max(0, tShake - dt);
        vy = Math.min(C.maxFall, vy + C.gravity * dt); y = Math.min(H - C.ground - 10, y + vy * dt); ang = Math.min(ang + dt * 6, 1.4);
        return;
      }
      if (input.tap) { vy = C.flapV; GAME_SFX("hop"); }
      vy = Math.min(C.maxFall, vy + C.gravity * dt);
      y += vy * dt;
      if (y - C.r < 0) { y = C.r; vy = 0; } // sufit nie zabija
      ang = clamp((vy / 700) * (Math.PI / 3), -0.44, 1.22);
      const v = speed() * dt;
      scroll += v;
      for (const p of pipes) if (p.on) { p.x -= v; if (p.x + C.pipeW < -10) p.on = false; }
      nextX -= v;
      if (nextX < W + 20) spawn(nextX);
      if (invuln > 0) invuln = Math.max(0, invuln - dt);
      for (const p of pipes) {
        if (!p.on) continue;
        if (!p.passed && p.x + C.pipeW < C.x) { p.passed = true; score++; GAME_SFX("point"); }
        if (invuln > 0) continue;
        const top = p.gy - p.gap / 2, bot = p.gy + p.gap / 2;
        if (hitRect(C.x, y, C.r, p.x, -1000, C.pipeW, top + 1000) || hitRect(C.x, y, C.r, p.x, bot, C.pipeW, H - C.ground - bot)) { die("Zderzenie z półką"); return; }
      }
      if (y + C.r >= H - C.ground) { y = H - C.ground - C.r; if (invuln > 0) { vy = C.flapV * 0.6; } else die("Spadek na chodnik"); }
    },
    draw(g, a) {
      const sc = pscroll + (scroll - pscroll) * a;
      // tło: kolor + delikatna kratka 24 j (jak tło strony)
      g.fillStyle = col.bg; g.fillRect(0, 0, W, H);
      g.strokeStyle = col.grid; g.lineWidth = 1; g.beginPath();
      const off = REDUCED() ? 0 : (sc * 0.5) % 24;
      for (let x = -off; x < W; x += 24) { g.moveTo(x, 0); g.lineTo(x, H - C.ground); }
      for (let yy = 0; yy < H - C.ground; yy += 24) { g.moveTo(0, yy); g.lineTo(W, yy); }
      g.stroke();
      // budynek przy Cukrowej (paralaksa 0,2×)
      const bx = REDUCED() ? 0 : -((sc * 0.2) % 420);
      for (let k = 0; k < 3; k++) drawBuilding(g, bx + k * 420, H - C.ground);
      // półki z książkami
      for (const p of pipes) if (p.on) {
        const x = p.px + (p.x - p.px) * a, top = p.gy - p.gap / 2, bot = p.gy + p.gap / 2;
        drawShelf(g, p, x, 0, top, true); drawShelf(g, p, x, bot, H - C.ground - bot, false);
      }
      // chodnik
      g.fillStyle = col.ground; g.fillRect(0, H - C.ground, W, C.ground);
      g.fillStyle = col.shelf; g.fillRect(0, H - C.ground, W, 3);
      g.fillStyle = col.dash;
      const d = REDUCED() && st !== "gra" ? 0 : sc % 48;
      for (let x = -d; x < W; x += 48) g.fillRect(x, H - C.ground + 30, 24, 4);
      // listek
      const ly = py + (y - py) * a;
      let alpha = 1;
      if (invuln > 0 && st === "gra" && !REDUCED()) alpha = Math.floor(invuln / 0.12) % 2 ? 0.4 : 1;
      drawLeaf(g, C.x, ly, ang, alpha, invuln > 0 && st === "gra" && REDUCED());
    },
    shake() { return st === "smierc" && tShake > 0 && !REDUCED() ? 4 : 0; },
    score: () => score,
    dead: () => st === "smierc" && tDie >= 0.6,
    deathText: () => death,
    revive() {
      // usuń kolumny bliżej niż 220 j przed listkiem
      for (const p of pipes) if (p.on && p.x < C.x + 220) p.on = false;
      let far = 0; for (const p of pipes) if (p.on) far = Math.max(far, p.x);
      nextX = Math.max(C.x + 220, far ? far + C.pipeW + C.spacing : W + 60);
      y = py = (H - C.ground) / 2; vy = 0; ang = 0; tDie = 0; st = "gotowy"; invuln = GRY_CFG.revive.invulnSec;
    },
    wantsQuestion: () => false,
    debug: () => ({ st, y, vy, score, invuln, H, ground: C.ground, pipes: pipes.filter((p) => p.on).map((p) => ({ x: p.x, gy: p.gy, gap: p.gap })) }),
  };
  function die(txt) { st = "smierc"; death = txt; tDie = 0; tShake = 0.2; vy = Math.min(vy, -120); GAME_SFX("hit"); BUZZ(false); }
  function drawShelf(g, p, x, y0, h, top) {
    if (h <= 0) return;
    g.fillStyle = col.shelf; g.fillRect(x, y0, C.pipeW, h);
    g.fillStyle = col.shelfIn; g.fillRect(x + 5, y0 + (top ? 0 : 5), C.pipeW - 10, h - 5);
    // półki co 38 j, na każdej rząd grzbietów w kolorach przedmiotów
    const step = 38;
    let k = 0;
    for (let s = top ? y0 + h - 5 : y0 + 5 + step; top ? s > y0 + 6 : s < y0 + h; s += top ? -step : step) {
      g.fillStyle = col.shelf; g.fillRect(x + 3, s - 3, C.pipeW - 6, 4);
      let bx = x + 7;
      for (let i = 0; i < BOOKS && bx < x + C.pipeW - 9; i++) {
        const w = p.bw[(i + k) % BOOKS], hh = 26 - ((i + k) % 3) * 3;
        g.fillStyle = subj[p.bc[(i + k) % BOOKS] % subj.length]; g.fillRect(bx, s - 3 - hh, w, hh);
        bx += w + 1;
      }
      k += 3;
    }
    // krawędź od strony przerwy
    g.fillStyle = col.dark; g.fillRect(x - 3, top ? y0 + h - 8 : y0, C.pipeW + 6, 8);
  }
  function drawBuilding(g, x, base) {
    g.fillStyle = col.far;
    g.fillRect(x + 20, base - 150, 240, 150); // główny budynek
    g.fillRect(x + 260, base - 110, 90, 110); // niższe skrzydło
    g.fillRect(x + 120, base - 180, 40, 30); // nadbudówka
    g.fillStyle = col.bg;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) g.fillRect(x + 34 + c * 28, base - 138 + r * 32, 14, 18);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) g.fillRect(x + 272 + c * 26, base - 98 + r * 30, 12, 16);
  }
  function drawLeaf(g, x, y, a, alpha, ring) {
    g.save(); g.translate(x, y); g.rotate(a); g.globalAlpha = alpha;
    if (ring) { g.strokeStyle = col.accent; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 19, 0, Math.PI * 2); g.stroke(); }
    g.fillStyle = "#1A7F45"; g.strokeStyle = "#0E5A30"; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(-15, 2); g.bezierCurveTo(-10, -13, 8, -15, 16, -2); g.bezierCurveTo(8, 11, -8, 12, -15, 2); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = "#4CAF72"; g.beginPath(); g.moveTo(-15, 2); g.bezierCurveTo(-8, -6, 6, -9, 16, -2); g.bezierCurveTo(6, -2, -6, 0, -15, 2); g.closePath(); g.fill();
    g.strokeStyle = "#0E5A30"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-15, 2); g.lineTo(-21, 6); g.stroke(); // ogonek
    g.fillStyle = "#fff"; g.beginPath(); g.arc(7, -3, 3.4, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#0E2A1A"; g.beginPath(); g.arc(8, -3, 1.7, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  return game;
})();

// =====================================================================
// PARY: memory w DOM (SPEC 8), bez Drugiej szansy
// =====================================================================
const PARY = (() => {
  const C = GRY_CFG.pary;
  // Na telefonie (< 400 px) siatki są węższe i wyższe.
  const GRID = { latwy: [[4, 3], [3, 4]], sredni: [[4, 4], [4, 4]], trudny: [[5, 4], [4, 5]] };
  const ORDER = ["latwy", "sredni", "trudny"];
  let X = null; // stan planszy
  const mmss = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
  const elapsed = () => (!X?.t0 ? 0 : (X.t1 || performance.now()) - X.t0);
  function label(i) {
    const c = X.cards[i];
    return c.ok ? T(`Karta ${i + 1}: ${c.text}, dopasowana`) : c.up ? T(`Karta ${i + 1}: ${c.text}`) : T(`Karta ${i + 1}, zakryta`);
  }
  function paintCard(i) {
    const c = X.cards[i], b = X.els[i];
    b.classList.toggle("up", !!(c.up || c.ok)); b.classList.toggle("ok", !!c.ok); b.classList.toggle("bad", !!c.bad);
    b.setAttribute("aria-label", label(i));
  }
  function focusCard(i) { X.els.forEach((b, k) => b.setAttribute("tabindex", k === i ? "0" : "-1")); X.focus = i; X.els[i]?.focus(); }
  function onKey(e, i) {
    const { cols } = X, n = X.els.length;
    const to = { ArrowRight: i + 1, ArrowLeft: i - 1, ArrowDown: i + cols, ArrowUp: i - cols }[e.key];
    if (to != null) { e.preventDefault(); if (to >= 0 && to < n) focusCard(to); return; }
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(i); }
  }
  function explain(p) {
    clearTimeout(X.infoT);
    X.info.textContent = X.tryb === "def" ? `${p.a}: ${p.b}` : `${p.a} = ${p.b}`;
    X.info.classList.add("on");
    X.infoT = setTimeout(() => { X.info.classList.remove("on"); }, C.explainMs);
  }
  function flip(i) {
    const c = X.cards[i];
    if (!c || X.lock || X.done || c.up || c.ok) return;
    if (!X.t0) { X.t0 = performance.now(); X.cb.onStart(); X.timer = setInterval(() => { X.cb.onTime(mmss(elapsed())); }, 250); }
    c.up = true; X.open.push(i); paintCard(i); GAME_SFX("hop");
    if (X.open.length < 2) return;
    const [i1, i2] = X.open, a = X.cards[i1], b = X.cards[i2];
    if (a.pid === b.pid) {
      a.ok = b.ok = true; X.open = []; X.matched++;
      paintCard(i1); paintCard(i2); BUZZ(true); GAME_SFX("point");
      explain(X.pairs[a.pid]); X.cb.onMatch(X.matched);
      if (X.matched === X.n) { X.done = true; X.t1 = performance.now(); clearInterval(X.timer); X.cb.onTime(mmss(elapsed())); setTimeout(() => X.cb.onEnd(), REDUCED() ? 300 : 900); }
      return;
    }
    // pomyłka: 900 ms czerwone, potem zakryte; trzecia karta zablokowana
    X.lock = true; X.bledy++; a.bad = b.bad = true; paintCard(i1); paintCard(i2); BUZZ(false); GAME_SFX("hit");
    for (const pid of [a.pid, b.pid]) if (!X.wrong.includes(X.pairs[pid])) X.wrong.push(X.pairs[pid]);
    X.cb.onMiss(X.bledy);
    setTimeout(() => { if (!X) return; a.up = b.up = a.bad = b.bad = false; X.open = []; X.lock = false; paintCard(i1); paintCard(i2); }, C.flipBackMs);
  }
  const game = {
    id: "pary", title: "Pary", dom: true,
    // ctx = { pairs, tryb, trudnosc, rnd, box, cb }
    mount(ctx) {
      const narrow = (window.innerWidth || 400) < 400;
      let k = Math.max(0, ORDER.indexOf(ctx.trudnosc));
      while (k > 0 && ctx.pairs.length < GRID[ORDER[k]][0][0] * GRID[ORDER[k]][0][1] / 2) k--; // za mało par → plansza o rozmiar mniejsza
      const trud = ORDER[k], [cols, rows] = GRID[trud][narrow ? 1 : 0], n = (cols * rows) / 2;
      const pairs = ctx.pairs.slice(0, n);
      const cards = shuffled(pairs.flatMap((p, pid) => [{ pid, side: "a", text: p.a }, { pid, side: "b", text: p.b }]), ctx.rnd);
      X = { pairs, cards, n, cols, rows, trud, tryb: ctx.tryb, open: [], matched: 0, bledy: 0, wrong: [], lock: false, done: false, t0: 0, t1: 0, cb: ctx.cb, focus: 0 };
      X.els = cards.map((c, i) => h("button", { type: "button", class: "pk pk-" + c.side, tabindex: i ? "-1" : "0", onclick: () => { focusCard(i); flip(i); }, onkeydown: (e) => onKey(e, i) },
        h("span", { class: "pk-in", "aria-hidden": "true" },
          h("span", { class: "pk-back" }, h("i", { class: "pk-leaf" })),
          h("span", { class: "pk-front", translate: "no", lang: c.side === "a" ? "en" : null }, h("span", { text: c.text })))));
      X.info = h("p", { class: "pk-info", translate: "no", "aria-live": "polite" });
      const board = h("div", { class: "pk-board", role: "grid", "aria-label": T("Pary"), style: `--cols:${cols};--rows:${rows}` }, X.els);
      ctx.box.replaceChildren(h("div", { class: "pk-wrap" + (ctx.tryb === "def" ? " def" : "") }, board, X.info));
      X.els.forEach((_, i) => paintCard(i));
      return { n, trudnosc: trud };
    },
    score: () => X?.matched || 0,
    errors: () => X?.bledy || 0,
    timeMs: () => Math.round(elapsed()),
    wrongPairs: () => X?.wrong || [],
    size: () => X?.n || 0,
    mmss,
    stop() { if (X) { clearInterval(X.timer); clearTimeout(X.infoT); } },
    debug: () => (X ? { st: X.done ? "koniec" : "gra", n: X.n, cols: X.cols, rows: X.rows, trud: X.trud, matched: X.matched, bledy: X.bledy, lock: X.lock, cards: X.cards.map((c) => ({ pid: c.pid, side: c.side, up: c.up, ok: c.ok })) } : null),
  };
  return game;
})();

const GAMES = { frun: FRUN, pary: PARY };
// Przejdź w osobnym pliku (gry-przejdz.js), ładowanym przy pierwszym wejściu; ta sama wersja ?v= co gry.js.
const LAZY = { przejdz: "gry-przejdz.js" }, VER = (typeof document !== "undefined" && document.currentScript?.src.split("v=")[1]) || "1";
const loadGame = (gra) => new Promise((ok, err) => { const s = document.createElement("script"); s.src = `${LAZY[gra]}?v=${VER}`; s.onload = ok; s.onerror = err; document.head.append(s); });
const UNITS = { frun: "kolumn", pary: "par", przejdz: "rzędów" };
const TITLES = { frun: "Fruń", pary: "Pary", przejdz: "Przejdź" };

// =====================================================================
// RDZEŃ: nakładka, pętla, pauza, dźwięk, Druga szansa, ekran wyniku
// =====================================================================
let A = null; // GRY_API z open()
let G = null; // bieżąca gra (obiekt z GAMES)
let ui = null; // elementy nakładki
let run = null; // stan bieżącej rundy
let state = "off"; // off | load | gra | pauza | pytanie | wynik | blokada
let raf = 0, last = 0, acc = 0, live = 0, shown = 0;
const input = { tap: false, left: false, right: false, up: false, down: false };
const T = (s) => A?.T?.(s) ?? s;
const REDUCED = () => !!A?.reduced?.();
const BUZZ = (ok) => { try { A?.buzz?.(ok); } catch {} };
const h = (...a) => A.h(...a);

// dźwięk: domyślnie wyłączony, trzy tony z WebAudio
let audio = null;
const soundOn = () => ls.get("bm-gry-dzwiek") === "1";
function GAME_SFX(kind) {
  if (!soundOn()) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator(), v = audio.createGain(), t = audio.currentTime;
    const [f1, f2, d, type] = { hop: [520, 760, 0.08, "triangle"], point: [880, 1320, 0.1, "sine"], hit: [220, 90, 0.25, "square"] }[kind] || [440, 440, 0.1, "sine"];
    o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + d);
    v.gain.setValueAtTime(0.08, t); v.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(v).connect(audio.destination); o.start(t); o.stop(t + d + 0.02);
  } catch {}
}

// ---------- canvas i skala ----------
let cv = null, g2 = null, view = { W: GRY_CFG.W, H: 640, s: 1, ox: 0, oy: 0, dpr: 1, cw: 0, ch: 0 };
function fit() {
  if (!cv) return;
  const r = cv.getBoundingClientRect(), cw = Math.max(1, r.width), ch = Math.max(1, r.height);
  const dpr = Math.min(window.devicePixelRatio || 1, GRY_CFG.dprMax);
  cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
  // świat: szerokość 360, wysokość z proporcji ekranu (560–760), ustalana raz na rundę
  if (!run?.H) view.H = clamp(Math.round((GRY_CFG.W * ch) / cw), 560, 760);
  const s = Math.min(cw / view.W, ch / view.H);
  Object.assign(view, { s, dpr, cw, ch, ox: (cw - view.W * s) / 2, oy: (ch - view.H * s) / 2 });
}

// ---------- pętla ze stałym krokiem fizyki ----------
function loop(t) {
  raf = 0;
  if (state !== "gra") return;
  const dt = Math.min((t - last) / 1000, GRY_CFG.step * GRY_CFG.maxSteps);
  last = t; acc += dt;
  let n = 0;
  while (acc >= GRY_CFG.step && n < GRY_CFG.maxSteps) {
    G.update(GRY_CFG.step, input);
    input.tap = input.left = input.right = input.up = input.down = false;
    acc -= GRY_CFG.step; n++;
    if (G.dead() || gateNow()) break;
  }
  if (n >= GRY_CFG.maxSteps) acc = 0;
  paint(acc / GRY_CFG.step);
  const sc = G.score();
  if (sc !== shown) { shown = sc; ui.num.textContent = sc; }
  if (t - live > 1000) { live = t; ui.live.textContent = `${sc} ${T(UNITS[run.gra])}`; }
  hintSync();
  if (G.dead()) return died();
  if (run.gate) return askGate();
  raf = requestAnimationFrame(loop);
}
function paint(alpha) {
  if (!g2) return;
  const shake = G.shake?.() || 0;
  g2.setTransform(1, 0, 0, 1, 0, 0);
  g2.fillStyle = run.colors.bg; g2.fillRect(0, 0, cv.width, cv.height);
  const k = view.s * view.dpr;
  g2.setTransform(k, 0, 0, k, (view.ox + (shake ? (Math.random() - 0.5) * shake * 2 : 0) * view.s) * view.dpr, view.oy * view.dpr);
  g2.save(); g2.beginPath(); g2.rect(0, 0, view.W, view.H); g2.clip();
  G.draw(g2, alpha);
  g2.restore();
}
// Przejdź: wejście na bramkę = pytanie bez śmierci (SPEC 9.3).
const gateNow = () => (G.wantsQuestion?.() ? (run.gate = true) : false);
function startLoop() { if (raf) return; last = performance.now(); acc = 0; shown = -1; raf = requestAnimationFrame(loop); }
function stopLoop() { if (raf) cancelAnimationFrame(raf); raf = 0; }
function hintSync() { const t = state === "pauza" ? "Pauza – dotknij, żeby grać dalej" : state === "gra" ? G.hint() : ""; if (ui.hint.dataset.t !== t) { ui.hint.dataset.t = t; ui.hint.textContent = t; ui.hint.hidden = !t; } }

// ---------- sterowanie ----------
function tap() { if (state === "pauza") return resume(); if (state === "gra") { input.tap = true; run.started = true; } }
function move(dir) { if (state === "pauza") return resume(); if (state === "gra") { input[dir] = true; run.started = true; } }
// Swipe (Przejdź): ruch palca ≥ 24 px = kierunek, krótki tap = do przodu.
let sw0 = null;
function swipeEnd(e) {
  if (!sw0) return; const dx = e.clientX - sw0.x, dy = e.clientY - sw0.y; sw0 = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return move("up");
  move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
}
function onKey(e) {
  if (state === "off") return;
  const k = e.key;
  if (state === "pytanie") return qKey(e);
  if (G?.dom) { if (k === "Escape" && !document.querySelector("#layer .scrim")) { e.preventDefault(); askClose(); } return; }
  if (k === "Escape" || k === "p" || k === "P") { e.preventDefault(); if (state === "gra") pause(); else if (state === "pauza" && k !== "Escape") resume(); else if (state === "pauza") askClose(); return; }
  if (state === "wynik" || state === "blokada" || state === "load") return;
  if (G?.swipe) {
    const dir = { ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right", ArrowDown: "down", s: "down", S: "down", ArrowUp: "up", w: "up", W: "up", " ": "up" }[k];
    if (dir) { if (e.target?.closest?.("button") && k !== " ") return; e.preventDefault(); move(dir); }
    return;
  }
  if (k === " " || k === "ArrowUp" || k === "w" || k === "W" || k === "Enter") { if (e.target?.closest?.("button") && k !== " ") return; e.preventDefault(); tap(); }
}
function pause() { if (state !== "gra") return; state = "pauza"; stopLoop(); hintSync(); ui.pauseBtn.setAttribute("aria-pressed", "true"); }
function resume() { if (state !== "pauza") return; state = "gra"; ui.pauseBtn.setAttribute("aria-pressed", "false"); hintSync(); startLoop(); }
const onVis = () => { if (document.visibilityState === "hidden" && !G?.dom) pause(); };
const onResize = () => { if (G?.dom) return; fit(); if (state !== "gra" && G && run) paint(1); };
// Wstecz w telefonie = ✕
const onPop = (e) => {
  if (state === "off") return;
  e.stopImmediatePropagation();
  if (inRound()) { try { history.pushState({ gry: 1 }, ""); } catch {} askClose(); } else close(true);
};
// runda trwa od pierwszego dotknięcia (wcześniej ✕ zamyka bez pytania)
const inRound = () => run && run.started && !run.ended && (state === "gra" || state === "pauza" || state === "pytanie");

// ---------- otwarcie i zamknięcie ----------
async function open(gra, opts = {}) {
  A = opts.api || A;
  if (!GAMES[gra] && LAZY[gra]) { try { await loadGame(gra); } catch { A?.toast?.(T("Nie udało się wczytać gry. Sprawdź połączenie.")); return; } }
  if (!GAMES[gra]) { A?.toast?.(T("Ta gra będzie wkrótce.")); return; }
  if (state !== "off") close(true);
  G = GAMES[gra];
  build(gra);
  state = "load";
  document.documentElement.classList.add("lp-lock");
  document.addEventListener("keydown", onKey);
  document.addEventListener("visibilitychange", onVis);
  addEventListener("resize", onResize);
  addEventListener("popstate", onPop, true);
  try { history.pushState({ gry: 1 }, ""); } catch {}
  runOpts = { tryb: opts.tryb, trudnosc: opts.trudnosc };
  await newRun(gra, opts.sid ?? null);
}
let runOpts = {};
function build(gra) {
  document.querySelector(".gry")?.remove();
  const num = h("b", { class: "gry-num num", text: "0" });
  const liveEl = h("span", { class: "vh", "aria-live": "polite" });
  const pauseBtn = h("button", { type: "button", class: "gry-ic", "aria-label": "Pauza", "aria-pressed": "false", onclick: () => (state === "pauza" ? resume() : pause()) }, "⏸");
  const snd = h("button", { type: "button", class: "gry-ic", "aria-label": soundOn() ? "Wycisz" : "Włącz dźwięk", onclick: (e) => { ls.set("bm-gry-dzwiek", soundOn() ? null : "1"); e.currentTarget.textContent = soundOn() ? "🔊" : "🔇"; e.currentTarget.setAttribute("aria-label", soundOn() ? "Wycisz" : "Włącz dźwięk"); } }, soundOn() ? "🔊" : "🔇");
  const x = h("button", { type: "button", class: "gry-ic gry-x", "aria-label": "Zamknij grę", onclick: () => askClose() }, "✕");
  cv = h("canvas", { class: "gry-cv", "aria-hidden": "true" });
  const hint = h("div", { class: "gry-hint", hidden: true, "aria-live": "polite" });
  const sheet = h("div", { class: "gry-layer" });
  const dom = !!GAMES[gra].dom;
  const swipe = !!GAMES[gra].swipe;
  const stage = h("div", { class: "gry-stage", onpointerdown: (e) => { if (dom || e.target.closest("button, a, input, .gry-sheet, .gry-res, .gry-load")) return; e.preventDefault(); if (swipe) { if (state === "pauza") return resume(); sw0 = { x: e.clientX, y: e.clientY }; } else tap(); },
    onpointerup: (e) => { if (swipe) swipeEnd(e); }, onpointercancel: () => { sw0 = null; } }, cv, hint, sheet);
  const time = h("span", { class: "gry-time-txt num", hidden: !dom, text: "0:00" });
  if (dom) pauseBtn.hidden = true;
  const root = h("div", { class: "gry" + (dom ? " dom" : "") + (A.demo ? " demo" : ""), role: "dialog", "aria-modal": "true", "aria-label": TITLES[gra] },
    h("header", { class: "gry-top" }, x, h("div", { class: "gry-score" }, num, h("small", { text: UNITS[gra] }), time), liveEl, pauseBtn, snd), stage);
  document.body.append(root);
  g2 = cv.getContext("2d");
  ui = { root, num, live: liveEl, pauseBtn, hint, stage, layer: sheet, time };
}
function close(silent) {
  if (state === "off") return;
  if (inRound()) endRound(true);
  stopLoop(); clearInterval(qTimer); G?.stop?.();
  state = "off";
  document.removeEventListener("keydown", onKey);
  document.removeEventListener("visibilitychange", onVis);
  removeEventListener("resize", onResize);
  removeEventListener("popstate", onPop, true);
  ui?.root.remove(); ui = null; cv = g2 = null;
  document.documentElement.classList.remove("lp-lock");
  // przejście dalej (quiz, materiał) zostawia nasz wpis w historii: back() zamknąłby nowo otwarty odtwarzacz
  if (!silent) { try { if (history.state?.gry) history.back(); } catch {} }
  A?.close?.();
}
function askClose() {
  if (!inRound()) return close();
  const was = state; if (state === "gra" && !G.dom) pause();
  A.modal((done) => [
    h("h3", { text: "Przerwać rundę?" }),
    h("div", { class: "row", style: "justify-content:flex-end" },
      h("button", { type: "button", class: "btn", onclick: () => { done(); if (was === "gra" && !G.dom) resume(); } }, "Graj dalej"),
      h("button", { type: "button", class: "btn primary", onclick: () => { done(); close(); } }, "Zakończ rundę")),
  ]);
}

// ---------- runda ----------
function colors() {
  const c = (n, d) => A.css?.(n) || d;
  const sub = (A.subjects?.() || []).map((s) => s.color).filter(Boolean);
  return { bg: c("--green-50", "#F5F8F6"), grid: "rgba(26,127,69,.07)", shelf: c("--green-600", "#1A7F45"), shelfIn: c("--green-900", "#0E3B22"), dark: c("--green-700", "#15703C"),
    ground: c("--green-200", "#CFE8D8"), dash: "rgba(255,255,255,.7)", far: c("--green-100", "#E3F1E8"), accent: c("--accent", "#1A7F45"), subjects: sub,
    grass: c("--green-100", "#E3F1E8"), grass2: "rgba(255,255,255,.35)", tree: c("--green-400", "#4CAF72"), lime: c("--lime-400", "#B7DB4A"), river: alpha(c("--teal-600", "#0F6E6E"), 0.5) };
}
// hex + alfa → rgba (rzeka w 50%)
function alpha(hex, a) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim()); if (!m) return hex;
  const n = parseInt(m[1], 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}
async function newRun(gra, sid) {
  ui.layer.replaceChildren(h("div", { class: "gry-load" }, h("p", { text: "Ładowanie…" })));
  run = { gra, sid, id: null, seed: 0, t0: 0, revives: 0, asked: [], wrong: [], okN: 0, pkt: 0, pktOk: 0, pktZero: 0, xp: 0, offline: false, ended: false, qs: [], tasks: [], H: 0, colors: colors() };
  G.stop?.();
  const dom = !!G.dom;
  run.tryb = runOpts.tryb || "enpl"; run.trudnosc = runOpts.trudnosc || "sredni";
  const [st, qs, tasks] = await Promise.all([
    A.rp?.start ? A.rp.start(gra, sid).catch(() => ({ ok: false, code: "offline" })) : { ok: false, code: "offline" },
    dom ? A.pairs(sid, 10, run.tryb).catch(() => []) : A.questions(sid, gra === "przejdz" ? 10 : 6).catch(() => []), dom ? [] : A.tasks(sid, 3).catch(() => []),
  ]);
  if (state === "off") return;
  if (!st.ok && st.code === "no_access") return lock();
  if (!st.ok && st.code === "too_many_runs") { A.toast("Na dziś wystarczy grania. Wróć jutro albo zrób Powtórki."); return close(); }
  run.demo = !!A.demo;
  if (st.ok) { run.id = st.run; run.seed = st.seed; } else { run.offline = true; run.seed = Date.now() | 0; if (st.code === "offline" && !run.demo) A.toast("Brak połączenia. Grasz dalej, ale punkty rankingu się nie zapiszą."); }
  run.qs = qs; run.tasks = tasks; run.rnd = mulberry32(run.seed);
  if (dom) return mountDom(qs);
  ui.layer.replaceChildren();
  fit(); run.H = view.H;
  G.init({ W: view.W, H: view.H, rnd: run.rnd, cfg: GRY_CFG[gra], colors: run.colors, subjectColors: run.colors.subjects });
  run.t0 = performance.now();
  state = "gra"; hintSync(); paint(1); startLoop();
  ui.stage.focus?.();
}
// gra w DOM (Pary): plansza w warstwie, bez pętli
function mountDom(pairs) {
  if (pairs.length < 6) { A.toast("Za mało pojęć do tej gry. Wybierz inny przedmiot albo Mix."); return close(); }
  ui.num.textContent = "0"; ui.time.textContent = "0:00";
  const box = h("div", { class: "pk-host" });
  ui.layer.replaceChildren(box);
  const m = G.mount({ pairs, tryb: run.tryb, trudnosc: run.trudnosc, rnd: run.rnd, box, cb: {
    onStart: () => { run.started = true; },
    onMatch: (k) => { ui.num.textContent = k; ui.live.textContent = `${k}/${run.n}`; run.xp += A.xp?.(1) || 0; },
    onMiss: () => {},
    onTime: (t) => { ui.time.textContent = t; },
    onEnd: () => endRound(false),
  } });
  run.n = m.n; run.trudnosc = m.trudnosc;
  run.t0 = performance.now();
  state = "gra";
  box.querySelector(".pk")?.focus();
}
function lock() {
  state = "blokada";
  ui.layer.replaceChildren(h("div", { class: "gry-res gry-lock", role: "document" },
    h("h2", { text: "Gry są w pełnym dostępie." }),
    h("p", { class: "muted", text: "Każda porażka to pytanie z przedmiotu. Dobra odpowiedź = grasz dalej." }),
    h("div", { class: "row" }, h("button", { type: "button", class: "btn primary", onclick: () => { close(); window.skrot?.buy?.(); } }, "Kup dostęp"),
      h("button", { type: "button", class: "btn ghost", onclick: () => close() }, "Wróć"))));
}
function died() {
  stopLoop();
  run.death = G.deathText?.() || "";
  if (run.revives < GRY_CFG.revive.max && G.revive) {
    const q = pickQuestion(run.revives);
    if (q) { run.revives++; return ask(q); }
  }
  endRound(false);
}
// Druga szansa: 1. ABCD, 2. zadanie liczbowe (brak → ABCD z innego materiału, „Trudniejsze pytanie”)
function askGate() {
  run.gate = false; stopLoop();
  const used = new Set(run.asked.map((x) => x.key));
  const q = run.qs.find((x) => !used.has("q:" + x.materialId + ":" + x.index));
  if (!q || run.asked.length >= GRY_CFG.runQuestionsMax) { state = "gra"; return startLoop(); } // brak pytań: idziemy dalej
  ask({ kind: "abcd", q, key: "q:" + q.materialId + ":" + q.index, gate: true });
}
function pickQuestion(i) {
  const used = new Set(run.asked.map((x) => x.key));
  const abcd = run.qs.filter((q) => !used.has("q:" + q.materialId + ":" + q.index));
  if (i === 0) { const q = abcd[0]; return q && { kind: "abcd", q, key: "q:" + q.materialId + ":" + q.index, n: 1 }; }
  const t = run.tasks.find((x) => !used.has("z:" + x.mid + ":" + x.wid + ":" + x.j));
  if (t) return { kind: "zadanie", q: t, key: "z:" + t.mid + ":" + t.wid + ":" + t.j, n: 2 };
  const prevMid = run.asked[0]?.q?.materialId;
  const q = abcd.find((x) => x.materialId !== prevMid) || abcd[0];
  return q && { kind: "abcd", q, key: "q:" + q.materialId + ":" + q.index, n: 2, harder: true };
}

// ---------- Druga szansa (SPEC 5.4) ----------
let qTimer = 0, Q = null;
function ask(item) {
  state = "pytanie";
  run.asked.push(item);
  if (!REDUCED()) cv.classList.add("blur");
  const secs = item.kind === "zadanie" ? GRY_CFG.revive.taskSec : GRY_CFG.revive.abcdSec;
  Q = { item, secs, left: secs, t0: performance.now(), done: false, opts: null };
  const bar = h("i"), timeTxt = h("span", { class: "vh", "aria-live": "polite" });
  const head = item.gate ? "Bramka · pytanie za punkty" : item.n === 1 ? "Druga szansa · 1/2" : "Ostatnia szansa · 2/2";
  const subj = A.subjects().find((s) => s.id === (item.q.sid || A.subjectOf?.(item.q.materialId ?? item.q.mid)));
  const verdict = h("div", { class: "gry-verdict", "aria-live": "assertive" });
  let body;
  if (item.kind === "abcd") {
    const order = shuffled(item.q.options.map((_, i) => i), run.rnd);
    Q.order = order;
    Q.opts = order.map((oi, k) => h("button", { type: "button", class: "opt gry-opt", onclick: () => answer(oi) }, h("b", { class: "gry-let", text: "ABCD"[k] }), h("span", { translate: "no", text: item.q.options[oi] })));
    body = [h("p", { class: "gry-q", translate: "no", text: item.q.q }), h("div", { class: "gry-opts" }, Q.opts)];
  } else {
    const inp = h("input", { class: "input gry-in num", inputmode: "decimal", autocomplete: "off", placeholder: "wynik" + (item.q.unit ? ` (${item.q.unit})` : ""), "aria-label": "Wynik zadania", onkeydown: (e) => { if (e.key === "Enter") { e.preventDefault(); checkTask(); } } });
    Q.inp = inp;
    body = [h("p", { class: "gry-q", translate: "no", text: item.q.task }), h("div", { class: "row" }, inp, h("button", { type: "button", class: "btn primary", onclick: () => checkTask() }, "Sprawdź"))];
  }
  Q.foot = h("div", { class: "gry-foot" }, h("button", { type: "button", class: "link", onclick: () => { if (!Q.done) { Q.done = true; clearInterval(qTimer); if (item.gate) back(); else endRound(false); } } }, item.gate ? "Pomiń pytanie" : "Zakończ rundę"));
  Q.bar = bar; Q.verdict = verdict; Q.timeTxt = timeTxt;
  const sheet = h("div", { class: "gry-sheet", role: "dialog", "aria-modal": "true", "aria-label": head },
    h("div", { class: "gry-time", "aria-hidden": "true" }, bar), timeTxt,
    !item.gate && G.deathText?.() ? h("p", { class: "gry-death", text: G.deathText() }) : null,
    h("div", { class: "gry-qhead" }, h("span", { class: "eyebrow", text: head }), item.harder ? h("span", { class: "chip sun", text: "Trudniejsze pytanie" }) : null, subj ? h("span", { class: "sk-chip chip", text: subj.name }) : null),
    ...body, verdict, Q.foot);
  ui.layer.replaceChildren(sheet);
  requestAnimationFrame(() => sheet.classList.add("on"));
  (Q.opts?.[0] || Q.inp)?.focus();
  let lastSpoken = secs;
  clearInterval(qTimer);
  qTimer = setInterval(() => {
    if (Q.done) return clearInterval(qTimer);
    Q.left = Math.max(0, Q.secs - (performance.now() - Q.t0) / 1000);
    const f = Q.left / Q.secs;
    bar.style.width = (f * 100).toFixed(1) + "%";
    bar.className = f <= 0.1 ? "red" : f <= 0.25 ? "amber" : "";
    if (Math.ceil(Q.left) % 5 === 0 && Math.ceil(Q.left) !== lastSpoken) { lastSpoken = Math.ceil(Q.left); timeTxt.textContent = `${lastSpoken} s`; }
    if (Q.left <= 0) { clearInterval(qTimer); result(false, true); }
  }, 100);
}
function qKey(e) {
  if (!Q || Q.done) { if (e.key === "Enter" && Q?.cta && document.activeElement !== Q.cta) { e.preventDefault(); Q.cta.click(); } return; }
  if (Q.item.kind !== "abcd") return;
  const k = e.key.toUpperCase(), i = "1234".indexOf(k) >= 0 ? "1234".indexOf(k) : "ABCD".indexOf(k);
  if (i >= 0 && i < Q.order.length && !(e.target instanceof HTMLInputElement)) { e.preventDefault(); answer(Q.order[i]); }
}
function checkTask() {
  if (Q.done) return;
  const r = A.numMatch(Q.inp.value, Q.item.q);
  if (r == null) { Q.verdict.textContent = T("Wpisz liczbę"); Q.verdict.className = "gry-verdict warn"; Q.inp.focus(); return; }
  Q.picked = Q.inp.value;
  result(r, false);
}
function answer(oi) { if (Q.done) return; Q.picked = oi; result(oi === Q.item.q.correct, false); }
function result(ok, timeout) {
  if (Q.done) return; Q.done = true; clearInterval(qTimer);
  const it = Q.item, q = it.q;
  // w tle: punkty rankingu (gra nigdy nie czeka na bazę)
  if (!timeout && run.id && A.rp) {
    const p = it.kind === "abcd" ? A.rp.odp({ mid: q.materialId, idx: q.index, wybor: Q.picked, zrodlo: "gra", run: run.id })
      : A.rp.zadanie({ mid: q.mid, wid: q.wid, j: q.j, wynik: A.parseNum(Q.picked), zrodlo: "gra", run: run.id });
    run.pending = (run.pending || 0) + 1;
    p.then((r) => { if (r?.ok) { run.pkt += r.pkt || 0; if (r.poprawna) { if (r.pkt) run.pktOk++; else run.pktZero++; } } }).catch(() => {}).finally(() => { run.pending--; resSync(); });
  }
  if (Q.opts) Q.opts.forEach((b, k) => { b.disabled = true; const oi = Q.order[k]; if (oi === q.correct) b.classList.add("right"); else if (oi === Q.picked) b.classList.add("wrong"); });
  if (Q.inp) Q.inp.disabled = true;
  const why = A.firstSentence?.(q.why || q.explanation || "") || "";
  let cta;
  BUZZ(ok);
  if (ok) {
    run.okN++;
    const xp = A.xp?.(GRY_CFG.xpPerCorrect) || 0; run.xp += xp;
    Q.verdict.className = "gry-verdict ok"; Q.verdict.textContent = T("Dobrze! Grasz dalej.");
    cta = h("button", { type: "button", class: "btn primary", onclick: () => back() }, "Graj dalej");
  } else {
    run.wrong.push(q);
    try { A.onWrong?.(it.kind === "abcd" ? q : { materialId: q.mid }); } catch {}
    const corr = it.kind === "abcd" ? "ABCD"[Q.order.indexOf(q.correct)] : A.fmtNum(q.result) + (q.unit ? " " + q.unit : "");
    Q.verdict.className = "gry-verdict bad";
    Q.verdict.textContent = (timeout ? T("Czas minął.") + " " : "") + T(`To nie to. Poprawna: ${corr}.`);
    cta = it.gate ? h("button", { type: "button", class: "btn primary", onclick: () => back() }, "Graj dalej")
      : h("button", { type: "button", class: "btn primary", onclick: () => endRound(false) }, "Zobacz wynik");
  }
  Q.cta = cta;
  Q.foot.replaceChildren(why ? h("p", { class: "gry-why", translate: "no", text: why }) : null, cta);
  cta.focus();
}
function back() {
  cv.classList.remove("blur");
  const s = ui.layer.firstChild; if (s) { s.classList.remove("on"); setTimeout(() => s.remove(), REDUCED() ? 0 : 240); }
  if (!Q?.item?.gate) { G.revive(); run.ozyw = (run.ozyw || 0) + 1; } Q = null;
  state = "gra"; hintSync(); paint(1); startLoop();
}

// ---------- koniec rundy i ekran wyniku (SPEC 5.5) ----------
let resEl = null;
function endRound(quiet) {
  if (run.ended) return; run.ended = true;
  stopLoop(); clearInterval(qTimer); G.stop?.();
  const wynik = G.score(), czasMs = G.dom ? G.timeMs() : Math.round(performance.now() - run.t0), bledy = G.errors?.() || 0;
  run.wynik = wynik;
  if (G.dom) {
    // rekord Par: cała plansza, najmniej pomyłek, potem czas (osobno na przedmiot i planszę)
    run.bledy = bledy; run.czasMs = czasMs;
    const full = wynik === run.n, recKey = `bm-gry-rekord:pary:${run.sid || "mix"}:${run.trudnosc}`;
    let prev = null; try { prev = JSON.parse(ls.get(recKey) || "null"); } catch {}
    run.nowy = full && (!prev || bledy < prev.b || (bledy === prev.b && czasMs < prev.t));
    if (run.nowy) ls.set(recKey, JSON.stringify({ b: bledy, t: czasMs }));
    run.rekordPary = run.nowy ? { b: bledy, t: czasMs } : prev;
    if (full && !bledy) run.xp += A.xp?.(5) || 0;
    const keys = [...new Set(G.wrongPairs().map((p) => p.key).filter(Boolean))];
    if (keys.length) { try { A.srsAdd?.(keys); } catch {} }
  } else {
    const recKey = "bm-gry-rekord:" + run.gra, prev = +ls.get(recKey) || 0;
    run.rekord = Math.max(prev, wynik); run.nowy = wynik > prev && wynik > 0;
    if (run.nowy) ls.set(recKey, String(wynik));
  }
  try { A.result?.({ gra: run.gra, wynik, bledy, trudnosc: run.trudnosc, full: G.dom ? wynik === run.n : true, ozyw: run.ozyw || 0 }); } catch {}
  run.koniec = null;
  if (run.id && A.rp) {
    run.pending = (run.pending || 0) + 1;
    A.rp.koniec({ run: run.id, wynik, czasMs, bledy }).then((r) => { run.koniec = r; if (r?.ok) run.pkt += r.pkt || 0; }).catch(() => {}).finally(() => { run.pending--; resSync(); });
  }
  if (quiet) return;
  state = "wynik";
  cv?.classList.remove("blur");
  showResult();
}
// Ekran wyniku (wspólny); Pary pokazują pary, pomyłki i czas zamiast „dobrze”.
function showResult() {
  const r = run, P = !!G.dom, wrong = P ? G.wrongPairs() : r.wrong, wq = P ? [] : wrong.filter((q) => q.options), w0 = wrong[0], mm = G.mmss;
  const stat = (v, l) => h("div", { class: "gry-stat" }, h("b", { class: "num", text: v }), h("span", { text: l }));
  const pktEl = h("b", { class: "num", text: r.offline ? "–" : "…" }), pl = (n, a, b, c) => `${n} ${A.plural(n, a, b, c)}`;
  resEl = { pkt: pktEl, note: h("p", { class: "gry-note muted", hidden: true }) };
  const btn = (t, f, c = "btn") => h("button", { type: "button", class: c, onclick: f }, t);
  const box = h("div", { class: "gry-res", role: "document" },
    r.nowy ? h("p", { class: "gry-rec", text: "🏆 " + T("Nowy rekord!") }) : null,
    h("p", { class: "sk-bignum gry-big" }, h("b", { class: "num", text: r.wynik })),
    P ? h("p", { class: "muted gry-unit" }, h("span", { text: pl(r.wynik, "para", "pary", "par") }), " · ", h("span", { text: pl(r.bledy, "pomyłka", "pomyłki", "pomyłek") }), " · ", h("span", { text: mm(r.czasMs) }))
      : h("p", { class: "muted gry-unit", text: `${T(UNITS[r.gra])} · ${T(`rekord ${r.rekord}`)}` }),
    P && r.rekordPary && !r.nowy ? h("p", { class: "muted gry-unit", text: T(`Najlepiej: ${pl(r.rekordPary.b, "pomyłka", "pomyłki", "pomyłek")} · ${mm(r.rekordPary.t)}`) }) : null,
    r.death ? h("p", { class: "gry-death", text: r.death }) : null,
    r.offline && !r.demo ? h("p", { class: "gry-note muted", text: "Punkty rankingu się nie zapisały" }) : null,
    r.demo ? [h("p", { class: "gry-demo-txt", text: "W pełnej wersji pytania są z Twoich przedmiotów, a punkty liczą się do rankingu roku." }),
      btn("Zaloguj się albo kup dostęp", () => { close(); A.login?.(); }, "btn primary gry-demo-cta")]
      : h("div", { class: "gry-stats" }, P ? stat(`${r.wynik}/${r.n}`, "par") : stat(`${r.okN}/${r.asked.length}`, "dobrze"), h("div", { class: "gry-stat" }, pktEl, h("span", { text: "pkt rankingu" })), stat(`+${r.xp} ⚡`, "XP")),
    resEl.note,
    w0 && !P && !r.demo ? h("p", { class: "gry-review" }, h("span", { text: "Do powtórki: " }), h("button", { type: "button", class: "link", onclick: () => { const mid = w0.materialId ?? w0.mid; close(true); A.material?.(mid); } }, A.materialTitle?.(w0.materialId ?? w0.mid) || "materiał", " →")) : null,
    h("div", { class: "row gry-acts" },
      btn("Jeszcze raz", () => newRun(run.gra, run.sid), r.demo ? "btn" : "btn primary"),
      !r.demo && wq.length ? btn(T(`Powtórz pomylone (${wq.length})`), () => { close(true); A.replayWrong?.(wq); }) : null,
      P && wrong.length >= 4 ? btn("Ćwicz pomylone słówka", () => { const sid = run.sid; close(true); A.practiceWords?.(wrong.map((p) => ({ t: p.a, d: p.b })), sid); }) : null,
      btn("Wróć", () => close(), "btn ghost")));
  ui.layer.replaceChildren(box);
  box.querySelector(".btn.primary")?.focus();
  if (r.nowy && !REDUCED()) A.confetti?.(40);
  resSync();
}
// punkty z bazy dopisujemy, gdy wrócą wszystkie odpowiedzi
function resSync() {
  if (!resEl || !run || state !== "wynik" || run.offline) return;
  if (run.pending > 0) return;
  resEl.pkt.textContent = "+" + run.pkt;
  const limit = !run.pkt && run.okN > 0 && run.pktZero > 0 && !run.pktOk;
  resEl.note.hidden = !limit;
  resEl.note.textContent = limit ? T("Dzisiejszy limit punktów z gier wyczerpany – nauka dalej się liczy w Powtórkach i quizach.") : "";
}

window.SKROT_GRY = { open, add: (id, make) => { GAMES[id] = make({ GRY_CFG, clamp, mulberry32, GAME_SFX, BUZZ, REDUCED }); }, cfg: GRY_CFG, close: () => close(true), _state: () => ({ state, run, score: G?.score?.() }), _dbg: () => (state === "off" ? null : G?.debug?.()), _gen: (seed, n) => GAMES.przejdz?._gen(seed, n), _set: (o) => G?.debugSet?.(o), _row: (r) => G?.debugRow?.(r) };
})();
