// Skrót BM: gra Przejdź (docs/gry/SPEC.md 9). Ładowana przez gry.js dopiero przy pierwszym wejściu w tę grę,
// żeby Fruń i Pary startowały szybciej. Korzysta z narzędzi rdzenia przekazanych w K (window.SKROT_GRY.add).
(() => {
"use strict";
window.SKROT_GRY.add("przejdz", (K) => {
  const { GRY_CFG, clamp, mulberry32, GAME_SFX, BUZZ, REDUCED } = K;
  const PRZEJDZ = (() => {
    const C = GRY_CFG.przejdz, CELL = C.cell, COLS = C.cols, HOP_GAP = 0.2; // min. 200 ms między skokami = max 5 rzędów/s (granica w SQL)
    const AHEAD = 20, BEHIND = 12, SPAN = 13 * CELL; // pas ruchu zawija się co 13 kratek (szerzej niż ekran)
    // generator rzędów (SPEC 9.2): czysta funkcja seeda
    function makeGen(rnd) {
      const rows = [];
      let group = null, left = 0, lastKind = null, lastRoadDir = 0, reach = new Array(COLS).fill(true);
      const pick = (d) => {
        const p = d >= 2 ? { trawa: 0.25, ulica: 0.45, tory: 0.1, rzeka: 0.2 } : { trawa: 0.3, ulica: 0.4, tory: 0.1, rzeka: 0.2 };
        if (lastKind === "rzeka") p.rzeka = 0; if (lastKind === "tory") p.tory = 0;
        const sum = p.trawa + p.ulica + p.tory + p.rzeka; let x = rnd() * sum;
        for (const k of ["trawa", "ulica", "tory", "rzeka"]) { x -= p[k]; if (x < 0) return k; }
        return "trawa";
      };
      const count = (k) => ({ trawa: 1 + Math.floor(rnd() * 2), ulica: 1 + Math.floor(rnd() * 4), tory: 1, rzeka: 1 + Math.floor(rnd() * 3) })[k];
      // pojazdy / kłody na pasie długości SPAN
      function lane(n, lenMin, lenMax, gapMin, gapMax) {
        const items = []; let x = Math.floor(rnd() * 3) * CELL;
        for (let i = 0; i < n; i++) {
          const len = (lenMin + Math.floor(rnd() * (lenMax - lenMin + 1))) * CELL;
          if (x + len > SPAN - gapMin * CELL) break;
          items.push({ x: x - 2 * CELL, len }); x += len + (gapMin + Math.floor(rnd() * (gapMax - gapMin + 1))) * CELL;
        }
        if (!items.length) items.push({ x: 0, len: lenMin * CELL });
        return items;
      }
      function gen(r) {
        const d = Math.floor(r / 20);
        let kind;
        if (r < 4) kind = "trawa";
        else if (r % C.gateEvery === 0) kind = "bramka";
        else { if (!left) { group = pick(d); left = count(group); lastKind = group; } kind = group; left--; }
        const row = { r, kind, trees: new Array(COLS).fill(false), items: null, dir: 1, speed: 0, tram: null, gate: false };
        if (kind === "trawa" && r >= 4) {
          const n = Math.floor(rnd() * 5); // 0–4 drzew/ławek → zawsze ≥ 5 wolnych pól
          for (let i = 0; i < n; i++) row.trees[Math.floor(rnd() * COLS)] = true;
        }
        if (kind === "ulica") {
          row.dir = lastRoadDir && rows[r - 1]?.kind === "ulica" ? -lastRoadDir : rnd() < 0.5 ? -1 : 1; lastRoadDir = row.dir;
          row.speed = Math.min(C.carSpeed0 + C.carSpeedStep * d, C.carSpeedMax);
          row.items = lane(1 + Math.floor(rnd() * 3), 1, 2, 2, 5);
        } else lastRoadDir = 0;
        if (kind === "rzeka") {
          row.dir = rnd() < 0.5 ? -1 : 1; row.speed = Math.min(C.logSpeed0 + C.logSpeedStep * d, 100);
          row.items = lane(2 + Math.floor(rnd() * 2), C.logLen[0], C.logLen[1], 1, 3);
        }
        if (kind === "tory") row.tram = { next: C.tramEvery[0] + rnd() * (C.tramEvery[1] - C.tramEvery[0]), x: 0, on: false, dir: rnd() < 0.5 ? -1 : 1 };
        // przejezdność (BFS w przód): z osiągalnych pól rzędu niżej w górę, potem w bok po wolnych
        const solid = kind === "trawa" || kind === "bramka";
        if (!solid) reach = reach.some(Boolean) ? new Array(COLS).fill(true) : reach;
        else {
          const flood = () => { const m = row.trees.map((t, c) => !t && reach[c]); for (let k = 0; k < COLS; k++) for (let c = 0; c < COLS; c++) if (!row.trees[c] && !m[c] && (m[c - 1] || m[c + 1])) m[c] = true; return m; };
          let m = flood();
          while (!m.some(Boolean)) { // brak drogi: usuń drzewo najbliżej osiągalnego pola poniżej
            let best = -1; for (let c = 0; c < COLS; c++) if (row.trees[c] && reach[c] && (best < 0 || Math.abs(c - 4) < Math.abs(best - 4))) best = c;
            if (best < 0) { row.trees.fill(false); } else row.trees[best] = false;
            m = flood();
          }
          reach = m;
        }
        rows[r] = row;
        return row;
      }
      return { row: (r) => rows[r] || (() => { for (let k = rows.length; k <= r; k++) gen(k); return rows[r]; })(), rows, drop: (r) => { rows[r] = undefined; } };
    }
    // ---------- stan rundy ----------
    let W, H, rnd, col, subj, gen;
    let st, pr, px, hop, hopT, lastHop, queued, far, cam, auto, tDie, death, invuln, freeze, gateQ, nudge, onLog, started, hops = 0;
    const hopO = { r0: 0, r1: 0, x0: 0, x1: 0 };
    const rowAt = (r) => (r < 0 ? null : gen.row(r));
    const solid = (row) => row && (row.kind === "trawa" || row.kind === "bramka");
    const colOf = (x) => clamp(Math.round((x - CELL / 2) / CELL), 0, COLS - 1);
    const colX = (c) => c * CELL + CELL / 2;
    const wrap = (x) => { x = (x + 2 * CELL) % SPAN; if (x < 0) x += SPAN; return x - 2 * CELL; };
    const curRow = () => (hop ? (hopT > 0.5 ? hopO.r1 : hopO.r0) : pr);
    const yOf = (rowF) => H - (rowF + 1 - cam) * CELL; // górna krawędź rzędu na ekranie
    function logUnder(row, x) { for (const it of row.items) { const a = wrap(it.x); if ((x >= a && x <= a + it.len) || (x >= a - SPAN && x <= a - SPAN + it.len)) return true; } return false; }
    function tryMove(dir) {
      const now = performance.now() / 1000;
      if (hop || now - lastHop < HOP_GAP) { queued = dir; return; }
      let r1 = pr, x1 = px;
      if (dir === "up") r1 = pr + 1; else if (dir === "down") r1 = pr - 1; else x1 = px + (dir === "left" ? -CELL : CELL);
      if (r1 < 0) { nudge = 0.12; return; }
      const row = rowAt(r1), here = rowAt(pr);
      if (r1 !== pr && row.kind !== "rzeka") x1 = colX(colOf(px)); // z rzeki na ląd: do najbliższej kolumny
      if (r1 === pr && here.kind !== "rzeka" && (x1 < 0 || x1 > W)) { nudge = 0.12; return; } // poza boczną krawędź
      if (solid(row) && row.trees[colOf(x1)]) { nudge = 0.12; return; } // drzewo / ławka
      hop = true; hopT = 0; lastHop = now; hops++; Object.assign(hopO, { r0: pr, r1, x0: px, x1 });
      if (!started) started = true;
      GAME_SFX("hop");
    }
    function land() {
      hop = false; pr = hopO.r1; px = hopO.x1;
      const row = rowAt(pr);
      if (pr > far) { far = pr; if (far >= C.autoScrollFrom) auto = true; }
      if (row.kind === "rzeka") { onLog = logUnder(row, px); if (!onLog && invuln <= 0) return die("Wpadłeś do Odry"); }
      else onLog = false;
      if (row.kind === "bramka" && !row.gate) { row.gate = true; gateQ = true; }
      if (queued) { const q = queued; queued = null; tryMove(q); }
    }
    function die(t) { if (st === "smierc") return; st = "smierc"; death = t; tDie = 0; hop = false; GAME_SFX("hit"); BUZZ(false); }
    // pojazdy, tramwaje i kłody
    function moveLanes(dt) {
      const lo = Math.max(0, Math.floor(cam) - 2), hi = Math.floor(cam + H / CELL) + 2;
      for (let r = lo; r <= hi; r++) {
        const row = rowAt(r);
        if (row.items) for (const it of row.items) it.x = wrap(it.x + row.dir * row.speed * dt);
        if (row.tram) {
          const t = row.tram;
          if (!t.on) { t.next -= dt; if (t.next <= 0) { t.on = true; t.x = t.dir > 0 ? -(W + 200) : W; } }
          else { t.x += t.dir * C.tramSpeed * dt; if (t.x > W + 10 || t.x < -(W + 210)) { t.on = false; t.next = C.tramEvery[0] + rnd() * (C.tramEvery[1] - C.tramEvery[0]); } }
        }
      }
    }
    function hits() {
      if (invuln > 0) return;
      const row = rowAt(curRow()); if (!row) return;
      const x = hop ? hopO.x0 + (hopO.x1 - hopO.x0) * hopT : px, a = x - CELL / 2 + 6, b = x + CELL / 2 - 6;
      if (row.kind === "ulica") for (const it of row.items) { const s = wrap(it.x); if ((b > s && a < s + it.len) || (b > s - SPAN && a < s - SPAN + it.len)) return die("Potrącił Cię samochód"); }
      if (row.tram?.on && b > row.tram.x && a < row.tram.x + W + 200) return die("Tramwaj!");
    }
    const game = {
      id: "przejdz", title: "Przejdź", revive: true, swipe: true,
      init(ctx) {
        W = ctx.W; H = ctx.H; rnd = ctx.rnd; col = ctx.colors; subj = ctx.subjectColors.length ? ctx.subjectColors : [col.shelf];
        gen = makeGen(rnd);
        st = "gotowy"; pr = 0; px = colX(4); hop = false; hopT = 0; lastHop = -1; queued = null; far = 0; auto = false; tDie = 0; death = "";
        invuln = 0; freeze = 0; gateQ = false; nudge = 0; onLog = false; started = false;
        cam = pr + 0.5 - (0.3 * H) / CELL;
        for (let r = 0; r < AHEAD; r++) gen.row(r);
      },
      hint() { return st === "gotowy" ? (started ? "Dotknij, żeby grać dalej" : "Dotknij, żeby iść") : ""; },
      update(dt, input) {
        const dir = input.left ? "left" : input.right ? "right" : input.down ? "down" : input.up || input.tap ? "up" : null;
        if (st === "smierc") { tDie += dt; return; }
        if (st === "gotowy") { if (freeze > 0) freeze = Math.max(0, freeze - dt); else moveLanes(dt); if (!dir) return; st = "gra"; } // ruch na ulicy widać już przed startem
        if (nudge > 0) nudge = Math.max(0, nudge - dt);
        if (freeze > 0) freeze = Math.max(0, freeze - dt); else { if (invuln > 0) invuln = Math.max(0, invuln - dt); moveLanes(dt); }
        if (dir) tryMove(dir);
        else if (queued && !hop && performance.now() / 1000 - lastHop >= HOP_GAP) { const q = queued; queued = null; tryMove(q); }
        const row = rowAt(pr);
        // jazda na kłodzie (także w trakcie skoku w bok po tej samej rzece)
        if (row.kind === "rzeka" && (onLog || (hop && hopO.r0 === hopO.r1)) && freeze <= 0) {
          const v = row.dir * row.speed * dt; px += v; if (hop) { hopO.x0 += v; hopO.x1 += v; }
          if (px < 0 || px > W) return die("Kłoda odpłynęła za daleko");
        }
        if (hop) { hopT += dt / (C.hopMs / 1000); if (hopT >= 1) land(); }
        if (st === "smierc") return;
        if (!hop && row.kind === "rzeka" && rowAt(pr).kind === "rzeka" && !onLog && invuln <= 0) return die("Wpadłeś do Odry");
        hits();
        if (st === "smierc") return;
        // kamera: gracz na 70% od góry; od rzędu 10 ekran sam jedzie
        const target = pr + 0.5 - (0.3 * H) / CELL;
        if (target > cam) cam += (target - cam) * 0.15;
        if (auto && freeze <= 0) cam += C.autoScroll * dt;
        if (pr + 0.5 < cam) return die("Spóźniłeś się na zajęcia");
        // rzędy 20 do przodu, stare za kamerą usuwamy
        gen.row(far + AHEAD);
        const old = Math.floor(cam) - BEHIND; if (old > 0) gen.drop(old);
      },
      draw(g) {
        const top = Math.floor(cam + H / CELL) + 1, bot = Math.floor(cam) - 1;
        g.fillStyle = col.bg; g.fillRect(0, 0, W, H);
        for (let r = bot; r <= top; r++) drawRow(g, r < 0 ? START : rowAt(r), yOf(r), r); // pod startem: trawnik kampusu (tylko rysunek)
        // gracz
        const t = hop ? hopT : 0, x = hop ? hopO.x0 + (hopO.x1 - hopO.x0) * t : px, rf = hop ? hopO.r0 + (hopO.r1 - hopO.r0) * t : pr;
        const lift = hop && !REDUCED() ? Math.sin(Math.PI * t) * 6 : 0, shake = nudge > 0 && !REDUCED() ? Math.sin(nudge * 80) * 2 : 0;
        const y = yOf(rf) + CELL / 2 - lift;
        let a = 1; if ((invuln > 0 || freeze > 0) && st !== "smierc") a = 0.6;
        drawStudent(g, x + shake, y, st === "smierc" && !REDUCED() ? Math.min(1, tDie / 0.5) : 0, a, death === "Wpadłeś do Odry");
      },
      shake: () => 0,
      score: () => far,
      dead: () => st === "smierc" && tDie >= 0.5,
      deathText: () => death,
      revive() {
        // najbliższa trawa na/poniżej miejsca śmierci, wolna kolumna najbliżej środka
        let r = curRow(); while (r > 0 && (!rowAt(r) || !solid(rowAt(r)))) r--;
        const row = rowAt(r); let c = 4; for (const k of [4, 3, 5, 2, 6, 1, 7, 0, 8]) if (!row.trees[k]) { c = k; break; }
        pr = r; px = colX(c); hop = false; queued = null; onLog = false; tDie = 0; death = "";
        cam = pr + 0.5 - (0.3 * H) / CELL; auto = false; freeze = 2; invuln = GRY_CFG.revive.invulnSec; st = "gotowy";
      },
      wantsQuestion() { if (!gateQ) return false; gateQ = false; return true; },
      debugSet(o) { if (o.pr != null) { pr = o.pr; far = Math.max(far, o.far ?? o.pr); gen.row(pr + AHEAD); } if (o.px != null) px = o.px; cam = o.cam ?? (o.pr != null ? pr + 0.5 - (0.3 * H) / CELL : cam); if (o.auto != null) auto = o.auto; if (o.invuln != null) invuln = o.invuln; if (o.freeze != null) freeze = o.freeze;
        st = "gra"; hop = false; started = true; if (o.land) { Object.assign(hopO, { r0: pr, r1: pr, x0: px, x1: px }); land(); } },
      debugRow: (r) => { const x = rowAt(r); return x && { kind: x.kind, dir: x.dir, speed: x.speed, trees: x.trees.slice(), items: x.items && x.items.map((i) => ({ x: wrap(i.x), len: i.len })), tram: x.tram && { ...x.tram } }; },
      debug: () => ({ st, pr, px, far, cam, hop, freeze, invuln, auto, death, hops, onLog, rows: Array.from({ length: 6 }, (_, k) => { const x = rowAt(pr + k - 1); return x ? { r: x.r, kind: x.kind, trees: x.trees.map(Number).join("") } : null; }) }),
      _gen(seed, n) { const g = makeGen(mulberry32(seed)); for (let r = 0; r < n; r++) g.row(r); return g.rows.map((x) => ({ kind: x.kind, trees: x.trees.slice(), items: x.items ? x.items.map((i) => ({ x: i.x, len: i.len })) : null, dir: x.dir, speed: x.speed })); },
    };
    // rysowanie (SPEC 9.4)
    const START = { r: -1, kind: "trawa", trees: new Array(COLS).fill(false) };
    function drawRow(g, row, y, r) {
      if (!row) return;
      const k = row.kind;
      if (k === "trawa" || k === "bramka") {
        g.fillStyle = col.grass; g.fillRect(0, y, W, CELL);
        g.fillStyle = col.grass2; for (let c = (r & 1); c < COLS; c += 2) g.fillRect(c * CELL, y, CELL, CELL);
        for (let c = 0; c < COLS; c++) if (row.trees[c]) {
          g.fillStyle = "rgba(14,90,48,.18)"; g.beginPath(); g.ellipse(colX(c) + 3, y + CELL / 2 + 4, 15, 12, 0, 0, Math.PI * 2); g.fill();
          g.fillStyle = col.tree; g.strokeStyle = "#0E5A30"; g.lineWidth = 2; g.beginPath(); g.arc(colX(c), y + CELL / 2, 15, 0, Math.PI * 2); g.fill(); g.stroke();
        }
        if (k === "bramka") {
          g.fillStyle = col.lime; g.fillRect(0, y + 12, W, 16);
          g.fillStyle = "#0E3B22"; g.font = "800 14px system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
          row.lbl ||= "? " + row.r; for (let c = 1; c < COLS; c += 3) g.fillText(row.lbl, colX(c), y + CELL / 2 + 1);
        }
      } else if (k === "ulica") {
        g.fillStyle = "#5B6660"; g.fillRect(0, y, W, CELL);
        g.fillStyle = "rgba(255,255,255,.75)"; for (let x = 6; x < W; x += 30) g.fillRect(x, y - 1, 16, 2);
        for (const it of row.items) for (let off = 0; off > -2 * SPAN; off -= SPAN) {
          const x = wrap(it.x) + off; if (x > W || x + it.len < 0) continue;
          g.fillStyle = subj[(row.r + Math.round(it.len)) % subj.length]; roundRect(g, x + 3, y + 6, it.len - 6, CELL - 12, 7); g.fill();
          g.fillStyle = "rgba(255,255,255,.55)"; g.fillRect(row.dir > 0 ? x + it.len - 14 : x + 7, y + 10, 6, CELL - 20); // szyba z przodu
        }
      } else if (k === "tory") {
        g.fillStyle = "#C9CFCB"; g.fillRect(0, y, W, CELL);
        g.fillStyle = "#8C948F"; for (let x = 4; x < W; x += 16) g.fillRect(x, y + 6, 6, CELL - 12);
        g.fillStyle = "#5B6660"; g.fillRect(0, y + 11, W, 3); g.fillRect(0, y + CELL - 14, W, 3);
        const t = row.tram, warn = !t.on && t.next < C.tramWarn;
        g.fillStyle = "#333"; g.fillRect(2, y + 2, 10, 10);
        g.fillStyle = warn && (REDUCED() || Math.floor(t.next * 6) % 2) ? "#E5484D" : "#6B1F22"; g.beginPath(); g.arc(7, y + 7, 4, 0, Math.PI * 2); g.fill();
        if (t.on) {
          g.fillStyle = "#F2D24B"; roundRect(g, t.x, y + 3, W + 200, CELL - 6, 8); g.fill();
          g.fillStyle = "#FFF6D6"; for (let x = t.x + 14; x < t.x + W + 190; x += 34) g.fillRect(x, y + 9, 22, CELL - 18);
        }
      } else if (k === "rzeka") {
        g.fillStyle = col.bg; g.fillRect(0, y, W, CELL);
        g.fillStyle = col.river; g.fillRect(0, y, W, CELL);
        g.strokeStyle = "rgba(255,255,255,.45)"; g.lineWidth = 1.5; g.beginPath();
        const ph = REDUCED() ? 0 : (row.r * 13) % 30;
        for (let x = -ph; x < W; x += 30) { g.moveTo(x, y + 20); g.quadraticCurveTo(x + 7, y + 15, x + 14, y + 20); }
        g.stroke();
        for (const it of row.items) for (let off = 0; off > -2 * SPAN; off -= SPAN) {
          const x = wrap(it.x) + off; if (x > W || x + it.len < 0) continue;
          g.fillStyle = "#8B5A2B"; roundRect(g, x + 2, y + 7, it.len - 4, CELL - 14, 9); g.fill();
          g.fillStyle = "#A9743E"; g.fillRect(x + 8, y + 15, it.len - 16, 3);
        }
      }
    }
    function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
    function drawStudent(g, x, y, squash, alpha, splash) {
      g.save(); g.globalAlpha = alpha; g.translate(x, y);
      if (squash) { if (splash) { g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 6 + squash * 14, 0, Math.PI * 2); g.stroke(); g.globalAlpha = alpha * (1 - squash); } else g.scale(1 + squash * 0.4, 1 - squash * 0.6); }
      g.fillStyle = "rgba(5,10,7,.18)"; g.beginPath(); g.ellipse(2, 4, 13, 11, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = col.lime; g.strokeStyle = "#0E3B22"; g.lineWidth = 1.5; roundRect(g, -10, 2, 20, 13, 4); g.fill(); g.stroke(); // plecak
      g.fillStyle = "#1A7F45"; roundRect(g, -12, -6, 24, 12, 6); g.fill(); g.stroke(); // ramiona
      g.fillStyle = "#F1C9A5"; g.beginPath(); g.arc(0, -4, 7.5, 0, Math.PI * 2); g.fill(); g.stroke(); // głowa
      g.fillStyle = "#4A3222"; g.beginPath(); g.arc(0, -2, 7.5, 0, Math.PI); g.fill(); // włosy (z góry)
      g.restore();
    }
    return game;
  })();
  return PRZEJDZ;
});
})();
