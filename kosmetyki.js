// Skrót BM: grafiki przedmiotów kosmetycznych ze sklepu (supabase/skrot-v24-kosmetyki.sql).
// Wszystko rysowane tutaj (SVG i canvas), w palecie strony. Żadnych zewnętrznych grafik.
// Strona woła window.SKROT_KOSM; plik nie zna zmiennych strony i niczego nie zapisuje.
(() => {
  const PI2 = Math.PI * 2;
  const f1 = (n) => +n.toFixed(2);
  const pt = (r, a, c = 32) => [f1(c + r * Math.cos(a)), f1(c + r * Math.sin(a))];

  // ---------- Awatar: kółko z pierwszą literą nicku ----------
  // Tła awatara: ciemne zielenie i morskie z palety, z białą literą (kontrast ≥ 4,5:1, sprawdza docs/kosmetyki/kontrast.mjs).
  const AV_FILL = ["#1A7F45", "#0F6E6E", "#3D7A5C", "#2C6B4F", "#1D6A86", "#556B1F", "#14563A", "#3A5F7A"];
  const hash = (s) => { let x = 7; for (const ch of String(s || "")) x = (x * 31 + ch.codePointAt(0)) >>> 0; return x; };
  const avFill = (nick) => AV_FILL[hash(nick) % AV_FILL.length];
  const avLetter = (nick) => { const m = String(nick || "?").trim().match(/\p{L}|\p{N}/u); return (m ? m[0] : "?").toLocaleUpperCase("pl"); };

  // ---------- Ramki (viewBox 0 0 64 64, awatar r = 21 w środku) ----------
  const leaf = (x, y, rot, len, w, fill) => `<ellipse cx="${x}" cy="${y}" rx="${len}" ry="${w}" fill="${fill}" transform="rotate(${f1(rot)} ${x} ${y})"/>`;
  const star5 = (cx, cy, R, r, fill) => {
    let d = "";
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r : R; d += (i ? "L" : "M") + f1(cx + rr * Math.cos(a)) + " " + f1(cy + rr * Math.sin(a)); }
    return `<path d="${d}Z" fill="${fill}"/>`;
  };
  const FRAMES = {
    liscie: () => {
      let s = `<circle cx="32" cy="32" r="25" fill="none" stroke="#4CAF72" stroke-width="1.6"/>`;
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * PI2 - Math.PI / 2, [x, y] = pt(27.4, a);
        s += leaf(x, y, (a * 180) / Math.PI + 90 + (i % 2 ? 28 : -28), 4.4, 2.1, i % 2 ? "#1A7F45" : "#3FA866");
      }
      return s;
    },
    fale: () => {
      const wave = (r, amp, k, ph) => { let d = ""; for (let i = 0; i <= 96; i++) { const a = (i / 96) * PI2, rr = r + amp * Math.sin(k * a + ph), [x, y] = pt(rr, a); d += (i ? "L" : "M") + x + " " + y; } return d + "Z"; };
      return `<path d="${wave(27.2, 1.9, 9, 0)}" fill="none" stroke="#0F6E6E" stroke-width="2.6" stroke-linejoin="round"/>` +
        `<path d="${wave(24.4, 1.1, 9, Math.PI)}" fill="none" stroke="#6FC3B8" stroke-width="1.4" stroke-linejoin="round"/>`;
    },
    klosy: () => {
      let s = `<circle cx="32" cy="32" r="24.6" fill="none" stroke="#C9A43A" stroke-width="1.2"/>`;
      for (const side of [-1, 1]) {
        const a0 = Math.PI / 2 + side * 0.32, a1 = Math.PI / 2 + side * 2.55;
        let d = ""; for (let i = 0; i <= 20; i++) { const a = a0 + ((a1 - a0) * i) / 20, [x, y] = pt(27, a); d += (i ? "L" : "M") + x + " " + y; }
        s += `<path d="${d}" fill="none" stroke="#A47E1B" stroke-width="1.3" stroke-linecap="round"/>`;
        for (let i = 1; i <= 8; i++) {
          const a = a0 + ((a1 - a0) * i) / 8.6, deg = (a * 180) / Math.PI + 90;
          for (const o of [-1, 1]) { const [x, y] = pt(27 + o * 2.3, a); s += leaf(x, y, deg + o * side * 32, 2.9, 1.5, i % 2 ? "#D9A92E" : "#E9C25A"); }
        }
      }
      return s;
    },
    gwiazdy: () => {
      let s = `<circle cx="32" cy="32" r="26" fill="none" stroke="#1E3A6B" stroke-width="5.4"/><circle cx="32" cy="32" r="23.2" fill="none" stroke="#3E6FA8" stroke-width=".9"/>`;
      [[-90, 3.4], [-35, 2.2], [20, 2.6], [70, 1.8], [125, 2.6], [180, 2.2], [235, 1.8]].forEach(([deg, R]) => { const [x, y] = pt(26, (deg * Math.PI) / 180); s += star5(x, y, R, R * 0.45, "#F6D365"); });
      [[-62], [45], [100], [150], [205], [262]].forEach(([deg]) => { const [x, y] = pt(26, (deg * Math.PI) / 180); s += `<circle cx="${x}" cy="${y}" r=".75" fill="#fff"/>`; });
      return s;
    },
    zlota: () =>
      `<defs><linearGradient id="kz-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F7DC7A"/><stop offset=".5" stop-color="#C9961E"/><stop offset="1" stop-color="#F2CF62"/></linearGradient></defs>` +
      `<circle cx="32" cy="32" r="26.4" fill="none" stroke="url(#kz-g)" stroke-width="4.6"/><circle cx="32" cy="32" r="23.3" fill="none" stroke="#9A7212" stroke-width=".9"/>` +
      `<path d="M23.5 8.6 L26.6 3.6 L29.3 7 L32 2 L34.7 7 L37.4 3.6 L40.5 8.6 Z" fill="url(#kz-g)" stroke="#9A7212" stroke-width=".7" stroke-linejoin="round"/>` +
      [0.7, 2.44, 3.88, 5.45].map((a) => { const [x, y] = pt(26.4, a + Math.PI / 2); return `<circle cx="${x}" cy="${y}" r="1.6" fill="#fff8de" stroke="#9A7212" stroke-width=".5"/>`; }).join(""),
    szron: () => {
      let s = `<circle cx="32" cy="32" r="25.6" fill="none" stroke="#8EC1E3" stroke-width="2"/>`;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * PI2 - Math.PI / 2, [x0, y0] = pt(23.8, a), [x1, y1] = pt(30.6, a);
        s += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="#4F8FC0" stroke-width="1.3" stroke-linecap="round"/>`;
        for (const o of [-1, 1]) { const [bx, by] = pt(28, a), [tx, ty] = pt(29.8, a + o * 0.11); s += `<line x1="${bx}" y1="${by}" x2="${tx}" y2="${ty}" stroke="#4F8FC0" stroke-width="1" stroke-linecap="round"/>`; }
        const [dx, dy] = pt(27.4, a + Math.PI / 8); s += `<circle cx="${dx}" cy="${dy}" r=".9" fill="#CFE6F5"/>`;
      }
      return s;
    },
  };

  // Kolory grafik zapisujemy jako rgb(r g b) ze spacjami: silniki motywów strony (pinkTheme, meadowTheme, seaTheme)
  // przemalowują tylko #hex i rgb(r, g, b) z przecinkami, więc kupiony wygląd zostaje taki, jak go narysowano.
  const keep = (svg) => svg.replace(/#([0-9a-f]{6})\b/gi, (m, x) => `rgb(${parseInt(x.slice(0, 2), 16)} ${parseInt(x.slice(2, 4), 16)} ${parseInt(x.slice(4, 6), 16)})`);

  // Pełny awatar jako napis SVG (litera osobno w HTML, żeby była tekstem: czytnik ekranu i tłumaczenie jej nie ruszają).
  function avatarSvg(nick, ramka) {
    const fr = FRAMES[ramka] ? FRAMES[ramka]() : `<circle cx="32" cy="32" r="22.4" fill="none" stroke="currentColor" stroke-opacity=".18" stroke-width="1.2"/>`;
    return keep(`<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><circle cx="32" cy="32" r="21" fill="${avFill(nick)}"/>${fr}</svg>`);
  }


  // =====================================================================
  // GRY: skórki postaci (Fruń z boku, Przejdź z góry) i tła plansz. Rysowane na canvasie, środek postaci w (0, 0).
  // t = czas w sekundach (machanie skrzydłami, światło latarni); przy „Mniej animacji” strona podaje t = 0.
  // =====================================================================
  const TAU = Math.PI * 2;
  const blob = (g, pts, fill, stroke) => { g.fillStyle = fill; if (stroke) { g.strokeStyle = stroke; g.lineWidth = 1.4; } for (const [x, y, r] of pts) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); if (stroke) g.stroke(); } };
  const eye = (g, x, y, r = 2.6) => { g.fillStyle = "#fff"; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.fillStyle = "#0E2A1A"; g.beginPath(); g.arc(x + r * 0.3, y, r * 0.5, 0, TAU); g.fill(); };
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };

  // ---------- Fruń: widok z boku, przód w prawo ----------
  const SIDE = {
    lisc(g) {
      g.fillStyle = "#1A7F45"; g.strokeStyle = "#0E5A30"; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(-15, 2); g.bezierCurveTo(-10, -13, 8, -15, 16, -2); g.bezierCurveTo(8, 11, -8, 12, -15, 2); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = "#4CAF72"; g.beginPath(); g.moveTo(-15, 2); g.bezierCurveTo(-8, -6, 6, -9, 16, -2); g.bezierCurveTo(6, -2, -6, 0, -15, 2); g.closePath(); g.fill();
      g.strokeStyle = "#0E5A30"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-15, 2); g.lineTo(-21, 6); g.stroke();
      eye(g, 7, -3, 3.4);
    },
    owca(g, t) {
      const leg = Math.sin(t * 10) * 2;
      g.strokeStyle = "#2E3A33"; g.lineWidth = 2.4; g.lineCap = "round";
      g.beginPath(); g.moveTo(-6, 7); g.lineTo(-7 - leg, 14); g.moveTo(5, 7); g.lineTo(6 + leg, 14); g.stroke();
      blob(g, [[-10, 1, 6], [-4, -5, 6.5], [4, -5, 6.5], [-6, 5, 6], [3, 5, 6], [9, 0, 5.5], [0, 0, 7]], "#FFFFFF", "#C4CCC7");
      blob(g, [[-4, -5, 5.2], [4, -5, 5.2], [0, 0, 6]], "#FFFFFF");
      g.fillStyle = "#2E3A33"; g.beginPath(); g.ellipse(14, -1, 5.6, 4.6, 0.25, 0, TAU); g.fill();
      g.beginPath(); g.ellipse(11, -5.5, 2.6, 1.4, -0.6, 0, TAU); g.fill();
      eye(g, 15.5, -2.2, 1.9);
    },
    mewa(g, t) {
      const f = Math.sin(t * 9);
      g.fillStyle = "#FFFFFF"; g.strokeStyle = "#AEB8B3"; g.lineWidth = 1.3;
      g.beginPath(); g.ellipse(0, 1, 14, 7.5, -0.08, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = "#9AA6A0"; g.beginPath(); g.moveTo(-14, 0); g.lineTo(-21, -3); g.lineTo(-19, 4); g.closePath(); g.fill();
      g.beginPath(); g.arc(11, -4, 6, 0, TAU); g.fillStyle = "#FFFFFF"; g.fill(); g.stroke();
      g.fillStyle = "#F2B33D"; g.beginPath(); g.moveTo(16, -4); g.lineTo(23, -2.6); g.lineTo(16, -1.4); g.closePath(); g.fill();
      eye(g, 12.5, -5.2, 1.8);
      g.fillStyle = "#8F9C96"; g.strokeStyle = "#5E6B65"; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(-6, -1); g.quadraticCurveTo(-2, -12 - f * 6, 8, -16 - f * 8); g.quadraticCurveTo(2, -4, 4, -1); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = "#2E3A33"; g.beginPath(); g.moveTo(8, -16 - f * 8); g.lineTo(4.5, -12 - f * 6); g.lineTo(6.5, -11 - f * 5); g.closePath(); g.fill();
    },
    zaglowka(g, t) {
      const b = Math.sin(t * 4) * 0.8;
      g.fillStyle = "#1E3A6B"; g.strokeStyle = "#13284A"; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(-16, 5 + b); g.lineTo(16, 5 + b); g.lineTo(10, 13 + b); g.lineTo(-11, 13 + b); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = "#F6D365"; g.fillRect(-12, 7.5 + b, 23, 1.6);
      g.strokeStyle = "#5A3E1F"; g.lineWidth = 1.8; g.beginPath(); g.moveTo(0, 5 + b); g.lineTo(0, -17 + b); g.stroke();
      g.fillStyle = "#FFFFFF"; g.strokeStyle = "#AEB8B3"; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(1.5, -16 + b); g.quadraticCurveTo(13, -6 + b, 14, 3 + b); g.lineTo(1.5, 3 + b); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(-1.5, -12 + b); g.lineTo(-1.5, 3 + b); g.lineTo(-12, 3 + b); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = "#4CAF72"; g.beginPath(); g.moveTo(0, -17 + b); g.lineTo(-7, -15 + b); g.lineTo(0, -13 + b); g.closePath(); g.fill();
    },
    latarnia(g, t) {
      const sw = 0.35 * Math.sin(t * 1.6);
      g.save(); g.globalAlpha *= 0.45; g.fillStyle = "#FFD45A";
      g.beginPath(); g.moveTo(3, -13); g.lineTo(42, -26 + sw * 30); g.lineTo(42, -2 + sw * 30); g.closePath(); g.fill(); g.restore();
      g.fillStyle = "#FFFFFF"; g.strokeStyle = "#5A2A26"; g.lineWidth = 1.3;
      g.beginPath(); g.moveTo(-7, 15); g.lineTo(7, 15); g.lineTo(4.5, -8); g.lineTo(-4.5, -8); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = "#C8463C";
      g.beginPath(); g.moveTo(-6.4, 10); g.lineTo(6.4, 10); g.lineTo(5.9, 5.4); g.lineTo(-5.9, 5.4); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(-5.4, 0.8); g.lineTo(5.4, 0.8); g.lineTo(4.9, -3.6); g.lineTo(-4.9, -3.6); g.closePath(); g.fill();
      g.fillStyle = "#2E3A33"; g.fillRect(-6, -9.5, 12, 2);
      g.fillStyle = "#FFE08A"; g.strokeStyle = "#8A6A10"; rr(g, -4, -16, 8, 6.5, 1.5); g.fill(); g.stroke();
      g.fillStyle = "#C8463C"; g.beginPath(); g.moveTo(-5, -16); g.lineTo(0, -21); g.lineTo(5, -16); g.closePath(); g.fill();
      g.fillStyle = "#2E3A33"; g.fillRect(-1, -17, 2, 1.5);
    },
  };

  // ---------- Przejdź: widok z góry, przód w górę ----------
  const TOP = {
    owca(g, t) {
      const s = Math.sin(t * 10) * 1.2;
      g.fillStyle = "#2E3A33"; [[-7, 6 + s], [7, 6 - s], [-7, -3 - s], [7, -3 + s]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 2.3, 0, TAU); g.fill(); });
      blob(g, [[-5, 4, 6], [5, 4, 6], [-5, -2, 6], [5, -2, 6], [0, 7, 5.5], [0, 1, 7]], "#FFFFFF", "#C4CCC7");
      blob(g, [[-4, 3, 5], [4, 3, 5], [0, 0, 6]], "#FFFFFF");
      g.fillStyle = "#2E3A33"; g.beginPath(); g.ellipse(0, -10, 4.4, 5.4, 0, 0, TAU); g.fill();
      g.beginPath(); g.ellipse(-4.6, -9, 2.4, 1.2, 0.5, 0, TAU); g.fill(); g.beginPath(); g.ellipse(4.6, -9, 2.4, 1.2, -0.5, 0, TAU); g.fill();
    },
    mewa(g, t) {
      const f = 1 + 0.12 * Math.sin(t * 9);
      g.fillStyle = "#8F9C96"; g.strokeStyle = "#5E6B65"; g.lineWidth = 1.2;
      for (const d of [-1, 1]) { g.beginPath(); g.moveTo(d * 3, -2); g.quadraticCurveTo(d * 12 * f, -8, d * 17 * f, -1); g.quadraticCurveTo(d * 10 * f, 2, d * 3, 4); g.closePath(); g.fill(); g.stroke();
        g.fillStyle = "#2E3A33"; g.beginPath(); g.moveTo(d * 17 * f, -1); g.lineTo(d * 13 * f, -4); g.lineTo(d * 13.5 * f, 0.5); g.closePath(); g.fill(); g.fillStyle = "#8F9C96"; }
      g.fillStyle = "#FFFFFF"; g.strokeStyle = "#AEB8B3"; g.beginPath(); g.ellipse(0, 1, 4.6, 10, 0, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = "#9AA6A0"; g.beginPath(); g.moveTo(-3, 10); g.lineTo(0, 15); g.lineTo(3, 10); g.closePath(); g.fill();
      g.fillStyle = "#F2B33D"; g.beginPath(); g.moveTo(-1.4, -8.6); g.lineTo(0, -13.5); g.lineTo(1.4, -8.6); g.closePath(); g.fill();
    },
    zaglowka(g) {
      g.fillStyle = "#1E3A6B"; g.strokeStyle = "#13284A"; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(0, -15); g.quadraticCurveTo(9, -4, 7, 12); g.lineTo(-7, 12); g.quadraticCurveTo(-9, -4, 0, -15); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = "#F6D365"; g.beginPath(); g.moveTo(0, -12); g.quadraticCurveTo(6.6, -3, 5.4, 10); g.lineTo(4.2, 10); g.quadraticCurveTo(5.2, -2, 0, -10); g.closePath(); g.fill();
      g.fillStyle = "#FFFFFF"; g.strokeStyle = "#AEB8B3"; g.lineWidth = 1.1;
      g.beginPath(); g.moveTo(0, -6); g.quadraticCurveTo(-9, 1, -1, 9); g.lineTo(0, 9); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = "#5A3E1F"; g.beginPath(); g.arc(0, -6, 1.6, 0, TAU); g.fill();
    },
    latarnia(g, t) {
      const a = t * 1.6;
      g.save(); g.globalAlpha *= 0.28; g.fillStyle = "#FFE08A";
      g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 26, a - 0.35, a + 0.35); g.closePath(); g.fill(); g.restore();
      g.fillStyle = "#FFFFFF"; g.strokeStyle = "#5A2A26"; g.lineWidth = 1.4; g.beginPath(); g.arc(0, 0, 12, 0, TAU); g.fill(); g.stroke();
      g.strokeStyle = "#C8463C"; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 9, 0, TAU); g.stroke();
      g.fillStyle = "#C8463C"; g.beginPath(); g.arc(0, 0, 5.6, 0, TAU); g.fill();
      g.fillStyle = "#FFE08A"; g.strokeStyle = "#8A6A10"; g.lineWidth = 1; g.beginPath(); g.arc(0, 0, 3.4, 0, TAU); g.fill(); g.stroke();
    },
  };

  // ---------- tła plansz ----------
  // Pseudolosowe, ale stałe pozycje (gwiazdy, chmury, kwiatki): ten sam obraz w każdej klatce.
  const prand = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const grad = (g, H, stops) => { const gr = g.createLinearGradient(0, 0, 0, H); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
  const hills = (g, W, base, amp, len, off, fill) => { g.fillStyle = fill; g.beginPath(); g.moveTo(0, base + 40); for (let x = 0; x <= W + 20; x += 10) g.lineTo(x, base - amp * (0.5 + 0.5 * Math.sin((x + off) / len))); g.lineTo(W, base + 40); g.closePath(); g.fill(); };
  // Fruń: niebo + daleki plan nad chodnikiem; sc = przesunięcie świata (paralaksa), base = górna krawędź chodnika.
  const SKY = {
    dzien(g, W, base, sc, t) {
      g.fillStyle = grad(g, base, [[0, "#D6EEF8"], [1, "#F2FAF1"]]); g.fillRect(0, 0, W, base);
      g.fillStyle = "rgba(255,231,160,.35)"; g.beginPath(); g.arc(W - 70, 70, 46, 0, TAU); g.fill();
      g.fillStyle = "#FFE7A0"; g.beginPath(); g.arc(W - 70, 70, 26, 0, TAU); g.fill();
      for (let i = 0; i < 4; i++) { const x = ((prand(i) * (W + 240) - sc * 0.1 - t * 6) % (W + 240) + W + 240) % (W + 240) - 120, y = 50 + prand(i + 9) * base * 0.35;
        g.fillStyle = "rgba(255,255,255,.9)"; for (const [dx, dy, r] of [[0, 0, 18], [20, -6, 22], [42, 0, 16], [20, 6, 18]]) { g.beginPath(); g.arc(x + dx, y + dy, r, 0, TAU); g.fill(); } }
      hills(g, W, base - 40, 26, 90, sc * 0.15, "#C8E8C4"); hills(g, W, base - 8, 18, 60, sc * 0.3 + 200, "#A9D9A8");
    },
    zachod(g, W, base, sc) {
      g.fillStyle = grad(g, base, [[0, "#F3A07F"], [0.55, "#F8C99A"], [1, "#FBE3B9"]]); g.fillRect(0, 0, W, base);
      g.fillStyle = "rgba(255,214,130,.45)"; g.beginPath(); g.arc(W * 0.3, base - 30, 70, 0, TAU); g.fill();
      g.fillStyle = "#FFD27A"; g.beginPath(); g.arc(W * 0.3, base - 30, 40, 0, TAU); g.fill();
      g.strokeStyle = "rgba(255,255,255,.45)"; g.lineWidth = 3; g.lineCap = "round";
      for (let i = 0; i < 3; i++) { const y = 60 + i * 34, x = ((prand(i + 3) * W - sc * 0.08) % W + W) % W; g.beginPath(); g.moveTo(x - 50, y); g.lineTo(x + 50, y); g.stroke(); }
      hills(g, W, base - 26, 30, 110, sc * 0.15, "#C9878A"); hills(g, W, base - 4, 18, 70, sc * 0.3 + 90, "#A26B78");
    },
    "noc-morze"(g, W, base, sc, t) {
      g.fillStyle = grad(g, base, [[0, "#0D1830"], [1, "#1D3459"]]); g.fillRect(0, 0, W, base);
      for (let i = 0; i < 60; i++) { const x = ((prand(i) * W * 1.5 - sc * 0.05) % W + W) % W, y = prand(i + 100) * (base - 70), tw = 0.55 + 0.45 * Math.sin(t * 2 + i);
        g.fillStyle = `rgba(255,248,222,${(0.35 + 0.5 * prand(i + 7)) * tw})`; g.fillRect(x, y, 1.6, 1.6); }
      g.fillStyle = "#F3E7B5"; g.beginPath(); g.arc(W - 80, 70, 20, 0, TAU); g.fill();
      g.fillStyle = "#0F1C36"; g.beginPath(); g.arc(W - 71, 64, 18, 0, TAU); g.fill();
      g.fillStyle = "#14294A"; g.fillRect(0, base - 46, W, 46);
      g.strokeStyle = "rgba(170,204,245,.35)"; g.lineWidth = 1.4;
      for (let r = 0; r < 3; r++) { g.beginPath(); const y = base - 36 + r * 13, o = (sc * (0.2 + r * 0.1)) % 36; for (let x = -o; x < W; x += 36) { g.moveTo(x, y); g.quadraticCurveTo(x + 9, y - 4, x + 18, y); } g.stroke(); }
      g.fillStyle = "rgba(243,231,181,.4)"; for (let i = 0; i < 6; i++) { const w = 26 - i * 3; g.fillRect(W - 80 - w / 2, base - 42 + i * 7, w, 2); }   // księżyc odbity w wodzie
    },
    zima(g, W, base, sc, t) {
      g.fillStyle = grad(g, base, [[0, "#3B5378"], [1, "#9DB5D2"]]); g.fillRect(0, 0, W, base);
      hills(g, W, base - 34, 24, 100, sc * 0.15, "#DCE7F2");
      const hx = ((-sc * 0.25) % 260 + 260) % 260 - 260;
      for (let k = 0; k < Math.ceil(W / 260) + 2; k++) { const x = hx + k * 260 + 60, y = base - 34;
        g.fillStyle = "#2E3B52"; g.fillRect(x, y - 28, 44, 30); g.beginPath(); g.moveTo(x - 6, y - 28); g.lineTo(x + 22, y - 48); g.lineTo(x + 50, y - 28); g.closePath(); g.fill();
        g.fillStyle = "#F4F8FC"; g.beginPath(); g.moveTo(x - 6, y - 28); g.lineTo(x + 22, y - 48); g.lineTo(x + 50, y - 28); g.lineTo(x + 44, y - 26); g.lineTo(x + 22, y - 42); g.lineTo(x, y - 26); g.closePath(); g.fill();
        g.fillStyle = "#FFD58A"; g.fillRect(x + 7, y - 20, 9, 9); g.fillRect(x + 28, y - 20, 9, 9); }
      hills(g, W, base - 6, 14, 70, sc * 0.3 + 40, "#EEF4FA");
      g.fillStyle = "rgba(255,255,255,.85)";
      for (let i = 0; i < 46; i++) { const x = ((prand(i) * W + Math.sin(t + i) * 10 - sc * 0.1) % W + W) % W, y = ((prand(i + 50) * base + t * (14 + prand(i + 3) * 14)) % base); g.beginPath(); g.arc(x, y, 1.2 + prand(i + 2) * 1.6, 0, TAU); g.fill(); }
    },
  };
  // Kolory planszy dla obu gier (nadpisują kolory z motywu strony). Rzeka zawsze inna niż trawa, kłody i auta bez zmian.
  const BOARD_COL = {
    dzien: { ground: "#CFE8D8", dash: "rgba(255,255,255,.75)", bg: "#EAF6EF", grass: "#D3EDC4", grass2: "rgba(255,255,255,.38)", tree: "#4CAF72", river: "rgba(31,143,163,.55)" },
    zachod: { ground: "#EBC9A2", dash: "rgba(255,255,255,.7)", bg: "#F9E7CF", grass: "#EAD9A2", grass2: "rgba(255,244,222,.42)", tree: "#B9773D", river: "rgba(64,104,150,.62)" },
    "noc-morze": { ground: "#1E3354", dash: "rgba(170,204,245,.45)", bg: "#0F1E35", grass: "#203D52", grass2: "rgba(255,255,255,.05)", tree: "#2E7A62", river: "rgba(22,52,104,.88)" },
    zima: { ground: "#E9F1F7", dash: "rgba(140,165,190,.7)", bg: "#DCE8F2", grass: "#EEF4F9", grass2: "rgba(196,214,232,.4)", tree: "#2F6B4F", river: "rgba(96,150,196,.68)" },
  };
  // Przejdź: drobiazgi na trawie (kwiatki, gwiazdy w trawie, śnieg na drzewach) – rysowane po trawie, przed drzewami.
  function rowDecor(g, id, kind, y, W, CELL, r, trees) {
    if (kind !== "trawa" && kind !== "bramka") return;
    const n = Math.floor(W / CELL);
    if (id === "dzien" || id === "zachod") for (let c = 0; c < n; c++) { if (trees?.[c] || prand(r * 31 + c) > 0.35) continue;
      const x = c * CELL + 8 + prand(r + c * 7) * (CELL - 16), yy = y + 8 + prand(r * 3 + c) * (CELL - 16);
      g.fillStyle = id === "dzien" ? ["#FFFFFF", "#F6D365", "#E9A0B8"][(r + c) % 3] : ["#F6D365", "#E98A5A"][(r + c) % 2]; g.beginPath(); g.arc(x, yy, 2.2, 0, TAU); g.fill(); }
    if (id === "noc-morze") for (let c = 0; c < n * 2; c++) { if (prand(r * 17 + c) > 0.3) continue; g.fillStyle = "rgba(255,248,222,.5)"; g.fillRect(prand(r + c * 3) * W, y + prand(r * 5 + c) * CELL, 1.6, 1.6); }
  }
  // Śnieg na koronach drzew (zima) – po narysowaniu drzewa.
  function treeTop(g, id, x, y) { if (id !== "zima") return; g.fillStyle = "#F7FBFE"; g.beginPath(); g.arc(x - 3, y - 4, 7, Math.PI, 0); g.fill(); g.beginPath(); g.arc(x + 5, y - 2, 5, Math.PI, 0); g.fill(); }

  // Podgląd do sklepu: mała scena Fruń na canvasie (skórka na zwykłym tle, tło z listkiem).
  function previewCanvas(it, size = [220, 110]) {
    const [w, h] = size, dpr = Math.min(2, window.devicePixelRatio || 1);
    const cv = document.createElement("canvas"); cv.width = w * dpr; cv.height = h * dpr; cv.className = "kpv-cv"; cv.setAttribute("aria-hidden", "true");
    const g = cv.getContext("2d"); g.scale(dpr, dpr);
    const tlo = it.wyglad?.t, skin = it.wyglad?.s, base = h - 18;
    if (tlo && SKY[tlo]) { SKY[tlo](g, w, base, 0, 0); g.fillStyle = BOARD_COL[tlo].ground; g.fillRect(0, base, w, h - base); }
    else { g.fillStyle = "#F2F8F4"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(26,127,69,.08)"; g.beginPath(); for (let x = 0; x < w; x += 18) { g.moveTo(x, 0); g.lineTo(x, base); } for (let y = 0; y < base; y += 18) { g.moveTo(0, y); g.lineTo(w, y); } g.stroke(); g.fillStyle = "#CFE8D8"; g.fillRect(0, base, w, h - base); }
    g.fillStyle = "#1A7F45"; g.fillRect(w - 52, 0, 26, base * 0.32); g.fillRect(w - 52, base * 0.74, 26, base * 0.26);
    g.save(); g.translate(w * 0.36, base * 0.52); g.scale(1.5, 1.5); (SIDE[skin] || SIDE.lisc)(g, 0); g.restore();
    return cv;
  }

  // Duży podgląd w sklepie (okno „Podgląd”): ruchoma scena Fruń albo Przejdź z tą skórką / tym tłem.
  // Animacja kończy się sama, gdy canvas zniknie ze strony; still = jedna nieruchoma klatka („Mniej animacji”).
  const DEF_COL = { ground: "#CFE8D8", dash: "rgba(255,255,255,.75)", bg: "#EAF6EF", grass: "#D3EDC4", grass2: "rgba(255,255,255,.38)", tree: "#4CAF72", river: "rgba(31,143,163,.55)" };
  const rrect = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  function sceneFrun(g, w, h, tlo, skin, t) {
    const base = h - 24, sc = t * 70, c = BOARD_COL[tlo] || DEF_COL;
    if (tlo && SKY[tlo]) SKY[tlo](g, w, base, sc, t);
    else { g.fillStyle = "#F2F8F4"; g.fillRect(0, 0, w, base); g.strokeStyle = "rgba(26,127,69,.08)"; g.beginPath(); const o = sc % 18; for (let x = -o; x < w; x += 18) { g.moveTo(x, 0); g.lineTo(x, base); } for (let y = 0; y < base; y += 18) { g.moveTo(0, y); g.lineTo(w, y); } g.stroke(); }
    g.fillStyle = c.ground; g.fillRect(0, base, w, h - base);
    g.fillStyle = c.dash; const od = sc % 34; for (let x = -od; x < w; x += 34) g.fillRect(x, base + 9, 18, 3);
    const P = 170, n = Math.ceil(w / P) + 2, k0 = Math.floor(sc / P);
    for (let k = k0; k < k0 + n; k++) { const x = k * P - sc + w * 0.75, gy = base * (0.36 + 0.28 * prand(k + 40)), gap = 84;
      g.fillStyle = "#1A7F45"; rrect(g, x, -8, 34, gy - gap / 2 + 8, 6); g.fill(); rrect(g, x, gy + gap / 2, 34, base - gy - gap / 2, 6); g.fill();
      g.fillStyle = "rgba(255,255,255,.18)"; g.fillRect(x + 6, 0, 5, gy - gap / 2 - 4); g.fillRect(x + 6, gy + gap / 2 + 4, 5, base - gy - gap / 2 - 8); }
    const y = base * 0.5 + Math.sin(t * 2.4) * base * 0.12;
    g.save(); g.translate(w * 0.3, y); g.rotate(-Math.cos(t * 2.4) * 0.22); g.scale(1.7, 1.7); (SIDE[skin] || SIDE.lisc)(g, t); g.restore();
  }
  // Przejdź z góry: trawa, ulica z autami, trawa z drzewami, rzeka z kłodą; postać skacze rząd po rzędzie w górę.
  function scenePrzejdz(g, w, h, tlo, skin, t) {
    const C = 36, rows = Math.ceil(h / C), c = BOARD_COL[tlo] || DEF_COL, kinds = ["rzeka", "trawa", "ulica", "trawa", "ulica", "trawa"];
    g.fillStyle = c.bg; g.fillRect(0, 0, w, h);
    for (let r = 0; r < rows; r++) {
      const k = kinds[r] || "trawa", y = h - (rows - r) * C;
      if (k === "trawa") {
        g.fillStyle = c.grass; g.fillRect(0, y, w, C); g.fillStyle = c.grass2; for (let x = (r & 1) * C; x < w; x += 2 * C) g.fillRect(x, y, C, C);
        const trees = Array.from({ length: Math.ceil(w / C) }, (_, i) => r !== rows - 1 && prand(r * 13 + i) < 0.22 && Math.abs(i * C + C / 2 - w / 2) > C);
        if (tlo) rowDecor(g, tlo, "trawa", y, w, C, r, trees);
        trees.forEach((on, i) => { if (!on) return; const x = i * C + C / 2; g.fillStyle = c.tree; g.strokeStyle = "#0E5A30"; g.lineWidth = 2; g.beginPath(); g.arc(x, y + C / 2, 14, 0, TAU); g.fill(); g.stroke(); if (tlo) treeTop(g, tlo, x, y + C / 2); });
      } else if (k === "ulica") {
        g.fillStyle = "#5B6660"; g.fillRect(0, y, w, C);
        g.fillStyle = "rgba(255,255,255,.75)"; for (let x = 6; x < w; x += 30) g.fillRect(x, y - 1, 16, 2);
        const dir = r % 4 === 2 ? 1 : -1, sp = 46 + r * 6, span = w + 120;
        for (let i = 0; i < 2; i++) { const x = ((((dir * t * sp + i * span / 2 + r * 70) % span) + span) % span) - 60;
          g.fillStyle = ["#2F6FBF", "#E98A5A", "#8C6BC8"][(r + i) % 3]; rrect(g, x + 3, y + 6, 54, C - 12, 7); g.fill();
          g.fillStyle = "rgba(255,255,255,.55)"; g.fillRect(dir > 0 ? x + 43 : x + 7, y + 10, 6, C - 20); }
      } else {
        g.fillStyle = c.river; g.fillRect(0, y, w, C);
        g.strokeStyle = "rgba(255,255,255,.45)"; g.lineWidth = 1.5; g.beginPath(); const ph = (t * 12) % 30; for (let x = -ph; x < w; x += 30) { g.moveTo(x, y + 20); g.quadraticCurveTo(x + 7, y + 15, x + 14, y + 20); } g.stroke();
        const x = ((t * 30) % (w + 120)) - 100; g.fillStyle = "#8B5A2B"; rrect(g, x, y + 7, 96, C - 14, 9); g.fill(); g.fillStyle = "#A9743E"; g.fillRect(x + 6, y + 15, 84, 3);
      }
    }
    // skok co 0,8 s o rząd w górę (bez wchodzenia do rzeki), potem od nowa
    const hops = rows - 2, p = (t / 0.8) % (hops + 1), step = Math.min(hops, Math.floor(p)), f = Math.min(1, (p - Math.floor(p)) / 0.35);
    const lift = step < hops ? f : 0, row = rows - 1 - step - (step < hops ? f : 0), py = h - (rows - row) * C + C / 2;
    g.save(); g.translate(w / 2, py); g.scale(1 + Math.sin(lift * Math.PI) * 0.12, 1 + Math.sin(lift * Math.PI) * 0.12);
    g.fillStyle = "rgba(5,10,7,.18)"; g.beginPath(); g.ellipse(2, 4, 13, 11, 0, 0, TAU); g.fill();
    if (TOP[skin]) TOP[skin](g, t);
    else { g.strokeStyle = "#0E3B22"; g.lineWidth = 1.5; g.fillStyle = "#B7DB4A"; rrect(g, -10, 2, 20, 13, 4); g.fill(); g.stroke();
      g.fillStyle = "#1A7F45"; rrect(g, -12, -6, 24, 12, 6); g.fill(); g.stroke(); g.fillStyle = "#F1C9A5"; g.beginPath(); g.arc(0, -4, 7.5, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = "#4A3222"; g.beginPath(); g.arc(0, -2, 7.5, 0, Math.PI); g.fill(); }
    g.restore();
  }
  function scene(it, mode = "frun", size = [320, 180], still = false) {
    const [w, h] = size, dpr = Math.min(2, window.devicePixelRatio || 1);
    const cv = document.createElement("canvas"); cv.width = w * dpr; cv.height = h * dpr; cv.className = "kpv-cv"; cv.setAttribute("aria-hidden", "true");
    const g = cv.getContext("2d"), tlo = it.wyglad?.t, skin = it.wyglad?.s, draw = mode === "przejdz" ? scenePrzejdz : sceneFrun;
    const t0 = performance.now();
    const frame = (now, first) => {
      if (!first && !cv.isConnected) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h); draw(g, w, h, tlo, skin, still ? 0.6 : (now - t0) / 1000);
      if (!still) requestAnimationFrame((n) => frame(n));
    };
    frame(t0, true);
    return cv;
  }

  // =====================================================================
  // NAUKA: płomień serii, dźwięki dobrej odpowiedzi (syntezator przeglądarki, cicho) i podglądy efektów.
  // =====================================================================
  const FLAME = { zielony: ["#2E9E5B", "#C8E66A"], niebieski: ["#2F6FBF", "#9FD3F7"], zloty: ["#D9930F", "#FFE38A"] };
  const flameSvg = (id) => { const [o, i] = FLAME[id] || ["#E8590C", "#FFD43B"];
    return keep(`<svg viewBox="0 0 24 26" aria-hidden="true" focusable="false"><path d="M12 1.5c1.2 3.6 5.6 6.4 5.6 12.1A5.6 5.6 0 0 1 12 24.5a5.9 5.9 0 0 1-6.1-5.9c0-3 1.6-4.9 3.3-6.4-.2 1.9.5 3.2 1.6 3.9C10.2 11 11.3 6.3 12 1.5z" fill="${o}"/><path d="M12.4 12.5c.8 2.1 3 3.4 3 6.2a3.3 3.3 0 0 1-6.6.2c0-1.6.9-2.6 1.8-3.4 0 1 .4 1.6.9 2 .1-1.8.4-3.4.9-5z" fill="${i}"/></svg>`); };
  let AC = null;
  function sound(id) {
    try {
      AC ||= new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === "suspended") AC.resume();
      const t0 = AC.currentTime + 0.01;
      const tone = (type, f0, f1, at, dur, vol) => {
        const o = AC.createOscillator(), g = AC.createGain(); o.type = type;
        o.frequency.setValueAtTime(f0, t0 + at); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t0 + at + dur);
        g.gain.setValueAtTime(0.0001, t0 + at); g.gain.exponentialRampToValueAtTime(vol, t0 + at + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur);
        o.connect(g); g.connect(AC.destination); o.start(t0 + at); o.stop(t0 + at + dur + 0.02);
      };
      if (id === "krople") { tone("sine", 1400, 620, 0, 0.12, 0.09); tone("sine", 1900, 900, 0.09, 0.1, 0.06); }
      else if (id === "dzwonki") { tone("triangle", 1318.5, 0, 0, 0.5, 0.06); tone("sine", 1975.5, 0, 0.07, 0.45, 0.035); }
      else if (id === "drewno") { tone("triangle", 820, 560, 0, 0.07, 0.12); tone("sine", 410, 300, 0, 0.09, 0.07); }
    } catch {}
  }
  const PV_BOX = (inner) => keep(`<svg viewBox="0 0 120 64" aria-hidden="true" focusable="false">${inner}</svg>`);
  const EFFECT_PV = {
    liscie: () => PV_BOX([[18, 12, 30], [44, 30, -20], [70, 10, 60], [92, 34, 15], [30, 46, -40], [60, 50, 80], [100, 14, -10]].map(([x, y, r], i) => `<ellipse cx="${x}" cy="${y}" rx="8" ry="4.2" fill="${["#4CAF72", "#1A7F45", "#B7DB4A"][i % 3]}" transform="rotate(${r} ${x} ${y})"/>`).join("")),
    iskry: () => PV_BOX([[22, 18, 9], [58, 32, 13], [94, 16, 8], [40, 50, 6], [86, 48, 10]].map(([x, y, r], i) => `<path d="M${x} ${y - r}L${x + r * 0.24} ${y - r * 0.24}L${x + r} ${y}L${x + r * 0.24} ${y + r * 0.24}L${x} ${y + r}L${x - r * 0.24} ${y + r * 0.24}L${x - r} ${y}L${x - r * 0.24} ${y - r * 0.24}Z" fill="${["#F6D365", "#B7DB4A", "#E9C25A"][i % 3]}"/>`).join("")),
    fala: () => PV_BOX(`<path d="M0 34 Q15 22 30 34 T60 34 T90 34 T120 34 V64 H0Z" fill="#2E9E8F" fill-opacity=".45"/><path d="M0 44 Q15 34 30 44 T60 44 T90 44 T120 44 V64 H0Z" fill="#6FC3B8" fill-opacity=".55"/>`),
    snieg: () => PV_BOX([[14, 10], [34, 26], [52, 8], [70, 40], [88, 20], [106, 46], [24, 50], [62, 22], [96, 6]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${2.4 + (i % 3)}" fill="#FFFFFF" stroke="#8EC1E3" stroke-width="1.4"/>`).join("")),
  };
  const SOUND_PV = PV_BOX(`<path d="M42 24h8l12-10v36L50 40h-8z" fill="#1A7F45"/><path d="M68 22c4 4 4 16 0 20M74 16c8 7 8 25 0 32" fill="none" stroke="#4CAF72" stroke-width="3" stroke-linecap="round"/>`);
  const FREEZE_PV = PV_BOX(`<rect x="40" y="6" width="40" height="52" rx="10" fill="#DCEEFA" stroke="#8EC1E3" stroke-width="2"/><path d="M47 14l8 6M73 14l-6 5" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M60 18c.9 2.8 4.4 5 4.4 9.5a4.4 4.4 0 0 1-4.4 4.4 4.6 4.6 0 0 1-4.8-4.6c0-2.4 1.3-3.9 2.6-5-.2 1.5.4 2.5 1.2 3.1C59.1 22.5 59.5 21.6 60 18z" fill="#E8590C" transform="translate(-24 -16) scale(1.4)"/>`);
  window.SKROT_KOSM = {
    AV_FILL, avFill, avLetter, avatarSvg, FRAMES, keep,
    SIDE, TOP, SKY, BOARD_COL, rowDecor, treeTop,
    // podgląd w sklepie: Node (canvas) albo napis SVG; null = strona pokaże ikonę
    flameSvg, sound, scene, EFFECT_PV: (e) => EFFECT_PV[e]?.() || null,
    preview: (it) => { const w = it.wyglad || {};
      if (w.s || w.t) return previewCanvas(it);
      if (w.e && EFFECT_PV[w.e]) return EFFECT_PV[w.e]();
      if (w.p) return PV_BOX(`<g transform="translate(44 4) scale(2.2)">${flameSvg(w.p).replace(/^<svg[^>]*>|<\/svg>$/g, "")}</g>`);
      if (w.d) return SOUND_PV;
      if (it.id === "zamrozenie") return FREEZE_PV;
      return null; },
  };
})();
