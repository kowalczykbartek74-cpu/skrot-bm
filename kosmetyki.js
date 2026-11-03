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

  window.SKROT_KOSM = { AV_FILL, avFill, avLetter, avatarSvg, FRAMES, keep };
})();
