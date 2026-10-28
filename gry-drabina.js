// Skrót BM: gra Drabina (docs/gry/SPEC-2.md 4). Ładowana przez gry.js dopiero przy pierwszym wejściu w tę grę.
// Gra w DOM (jak Pary): 12 pytań od najłatwiejszego do najtrudniejszego (trudność = skuteczność roku, A.ladder),
// szczeble gwarantowane 4 i 8, koła ratunkowe 50:50, Zapytaj rok, Notatka. Wynik i punkty liczy baza (rp.koniec).
(() => {
"use strict";
window.SKROT_GRY.add("drabina", (K) => {
  const { GRY_CFG, shuffled, GAME_SFX, BUZZ, REDUCED } = K;
  const C = GRY_CFG.drabina;
  let X = null; // stan rundy
  let A = null, h = null;
  const T = (s) => A?.T?.(s) ?? s;
  const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const floorOf = (step) => C.progi.filter((p) => p <= step).pop() || 0; // ostatni osiągnięty szczebel gwarantowany
  const pl = (n, a, b, c) => A.plural?.(n, a, b, c) || c;

  // ---------- drabina: kolumna (≥ 900 px) i pasek kropek (telefon) ----------
  function paintLadder() {
    const cur = X.done ? -1 : X.i + 1;
    X.rungs.forEach((li, k) => {
      const n = k + 1, safe = C.progi.includes(n), on = n <= X.step;
      li.className = "dr-rung" + (safe ? " safe" : "") + (on ? " on" : "") + (n === cur ? " cur" : "");
      li.querySelector(".dr-mk").textContent = (n === cur ? "▶ " : "") + (safe ? "◆" : "") + (on ? "✓" : "");
      li.setAttribute("aria-current", n === cur ? "step" : "false");
    });
    X.dots.forEach((d, k) => {
      const n = k + 1;
      d.className = "dr-dot" + (C.progi.includes(n) ? " safe" : "") + (n <= X.step ? " on" : "") + (n === cur ? " cur" : "");
    });
    X.stepTxt.textContent = T(`Szczebel ${Math.min(X.i + 1, C.n)} z ${C.n}`);
  }
  function paintStop() {
    const s = X.step, f = floorOf(s);
    X.stopBtn.hidden = s < 1 || X.done;
    X.stopBtn.textContent = T(`Zatrzymaj się (zabierasz ${s})`);
    X.dropTxt.textContent = T(`Zła odpowiedź = spadasz na ${f}`);
    X.dropTxt.hidden = X.done;
  }
  function paintLife() {
    const q = X.q, life = X.life;
    const set = (b, used, off) => { b.disabled = !!(used || off || X.answered); b.classList.toggle("used", !!used); b.setAttribute("aria-disabled", b.disabled ? "true" : "false"); };
    set(life.f, X.used.f, q.options.length <= 2 || X.hidden.size);
    set(life.r, X.used.r, X.offline || X.rokBusy || X.rokShown);
    set(life.n, X.used.n, !X.note);
  }

  // ---------- jedno pytanie ----------
  function showQ() {
    const q = X.content[X.i];
    X.q = q; X.answered = false; X.hidden = new Set(); X.rokShown = false; X.rokBusy = false;
    X.note = A.noteOf?.(q.materialId) || "";
    X.order = shuffled(q.options.map((_, i) => i), X.rnd);
    X.opts = X.order.map((oi, k) => h("button", { type: "button", class: "opt gry-opt dr-opt", onclick: () => answer(oi) },
      h("b", { class: "gry-let", text: "ABCD"[k] }), h("span", { class: "dr-ot", translate: "no", text: q.options[oi] }),
      h("span", { class: "dr-rok", "aria-hidden": "true", hidden: true }, h("i"), h("small", { class: "num" }))));
    X.qEl.textContent = q.q;
    X.optsEl.replaceChildren(...X.opts);
    X.verdict.textContent = ""; X.verdict.className = "gry-verdict";
    X.after.replaceChildren(); X.rokMsg.textContent = ""; X.rokMsg.hidden = true;
    hideNote();
    paintLadder(); paintStop(); paintLife();
    // zegar: 30 s (szczeble 1–8), 45 s (9–12); nie stoi przy kołach
    X.secs = X.i < 8 ? C.sec[0] : C.sec[1]; X.t0 = performance.now(); X.left = X.secs; X.spoken = X.secs;
    clearInterval(X.timer); tick(); X.timer = setInterval(tick, 100);
    X.opts[0]?.focus();
  }
  function tick() {
    if (!X || X.answered) return;
    X.left = Math.max(0, X.secs - (performance.now() - X.t0) / 1000);
    const f = X.left / X.secs, s = Math.ceil(X.left);
    X.bar.style.width = (f * 100).toFixed(1) + "%";
    X.bar.className = f <= 0.1 ? "red" : f <= 0.25 ? "amber" : "";
    X.timeTxt.textContent = mmss(s);
    if (s % 5 === 0 && s !== X.spoken) { X.spoken = s; X.timeLive.textContent = `${s} s`; }
    if (X.left <= 0) answer(null, true);
  }
  function answer(oi, timeout) {
    if (!X || X.answered || X.done) return;
    if (oi != null && X.hidden.has(oi)) return;
    X.answered = true; clearInterval(X.timer); hideNote();
    const q = X.q, ok = !timeout && oi === q.correct, run = X.run;
    run.asked.push({ kind: "abcd", q, key: "q:" + q.materialId + ":" + q.index });
    // w tle do bazy: indeks oryginalny (przed tasowaniem); koniec czasu nie idzie do bazy (jak Druga szansa)
    if (!timeout && run.id && A.rp?.odp) X.cb.track(A.rp.odp({ mid: q.materialId, idx: q.index, wybor: oi, zrodlo: "gra", run: run.id }));
    X.opts.forEach((b, k) => { b.disabled = true; const o = X.order[k]; if (o === q.correct) b.classList.add("right"); else if (o === oi) b.classList.add("wrong"); });
    BUZZ(ok);
    const why = A.firstSentence?.(q.why || q.explanation || "") || "";
    const rok = q.rokProc != null ? h("p", { class: "dr-rokproc muted", text: T(`${q.rokProc}% roku odpowiada dobrze`) }) : null;
    let cta;
    if (ok) {
      run.okN++; run.xp += A.xp?.(GRY_CFG.xpPerCorrect) || 0;
      X.step = X.i + 1; X.cb.onScore(X.step); GAME_SFX("point");
      X.verdict.className = "gry-verdict ok"; X.verdict.textContent = T("Dobrze!");
      if (X.step === C.n) {
        X.final = C.n; X.done = true;
        if (!REDUCED()) A.confetti?.(46);
        A.banner?.(T("Cała Drabina! 🏆"));
        cta = h("button", { type: "button", class: "btn primary", onclick: () => finish() }, "Zobacz wynik");
      } else {
        if (C.progi.includes(X.step)) A.banner?.(T(`Szczebel ${X.step} zabezpieczony`));
        cta = h("button", { type: "button", class: "btn primary dr-up", onclick: () => { X.i++; showQ(); } }, "Wyżej →");
      }
    } else {
      run.wrong.push(q); try { A.onWrong?.(q); } catch {}
      X.final = floorOf(X.step); X.done = true; GAME_SFX("hit");
      const corr = "ABCD"[X.order.indexOf(q.correct)];
      X.verdict.className = "gry-verdict bad";
      X.verdict.textContent = (timeout ? T("Czas minął.") + " " : "") + T(`To nie to. Poprawna: ${corr}.`);
      cta = h("button", { type: "button", class: "btn primary", onclick: () => finish() }, "Zobacz wynik");
    }
    X.cta = cta;
    X.after.replaceChildren(...[why ? h("p", { class: "gry-why", translate: "no", text: why }) : null, rok, cta].filter(Boolean));
    paintLadder(); paintStop(); paintLife();
    cta.focus();
  }
  function finish() { if (!X || X.ended) return; X.ended = true; X.done = true; clearInterval(X.timer); hideNote(); X.t1 = performance.now(); X.cb.onEnd(); }
  // „Zatrzymaj się”: koniec z wynikiem = obecny szczebel
  function stopHere() {
    if (!X || X.done || X.step < 1 || (X.answered && !X.cta?.classList.contains("dr-up"))) return;
    X.final = X.step; finish();
  }

  // ---------- koła ratunkowe (każde raz na rundę) ----------
  function fifty() {
    const q = X.q;
    if (X.used.f || X.answered || q.options.length <= 2) return;
    X.used.f = true;
    const wrong = shuffled(q.options.map((_, i) => i).filter((i) => i !== q.correct), X.rnd).slice(0, 2);
    X.hidden = new Set(wrong);
    X.opts.forEach((b, k) => { if (X.hidden.has(X.order[k])) { b.disabled = true; b.classList.add("dr-gone"); b.setAttribute("aria-hidden", "true"); } });
    paintLife();
    X.opts.find((b, k) => !X.hidden.has(X.order[k]))?.focus();
  }
  async function askYear() {
    if (X.used.r || X.answered || X.offline || X.rokBusy || !A.rp?.rok) return;
    const q = X.q, my = X.i;
    X.rokBusy = true; paintLife();
    let r = null; try { r = await A.rp.rok(q.materialId, q.index); } catch {}
    if (!X || X.i !== my || X.q !== q) return;
    X.rokBusy = false;
    if (X.answered) return paintLife();
    X.rokMsg.hidden = false;
    if (!r?.ok) { X.rokMsg.textContent = T("Nie udało się sprawdzić. Spróbuj jeszcze raz."); return paintLife(); }
    if (r.za_malo || !(r.rozklad || []).length) { X.rokMsg.textContent = T("Rok jeszcze za mało odpowiadał na to pytanie"); return paintLife(); } // koło się nie zużywa
    X.used.r = true; X.rokShown = true;
    const sum = r.rozklad.reduce((a, b) => a + (b || 0), 0) || 1;
    // rozkład w kolejności oryginalnej → paski przy przyciskach w kolejności z ekranu
    X.opts.forEach((b, k) => {
      const pct = Math.round((100 * (r.rozklad[X.order[k]] || 0)) / sum), box = b.querySelector(".dr-rok");
      box.hidden = false; box.querySelector("i").style.width = pct + "%"; box.querySelector("small").textContent = pct + "%";
      b.setAttribute("aria-label", `${"ABCD"[k]}: ${q.options[X.order[k]]} (${pct}%)`);
    });
    const n = r.n || 0;
    X.rokMsg.textContent = T(`${n} ${pl(n, "osoba", "osoby", "osób")} z roku`);
    paintLife();
  }
  function showNote() {
    if (X.used.n || X.answered || !X.note) return;
    X.used.n = true;
    X.noteEl.replaceChildren(h("b", { text: "Notatka" }), " ", h("span", { translate: "no", text: X.note }));
    X.noteEl.hidden = false;
    clearTimeout(X.noteT); X.noteT = setTimeout(hideNote, C.noteSec * 1000);
    paintLife();
  }
  function hideNote() { if (!X) return; clearTimeout(X.noteT); X.noteEl.hidden = true; X.noteEl.replaceChildren(); }

  const game = {
    id: "drabina", title: "Drabina", dom: true,
    load: (api, sid, run) => api.ladder(sid, run.seedP),
    enough: (c) => (c?.length === C.n ? true : "Za mało pytań do Drabiny. Wybierz inny przedmiot albo Mix."),
    // ctx = { content (12 pytań), rnd, box, cb, run, A }
    mount(ctx) {
      A = ctx.A; h = A.h;
      const subj = A.subjects?.().find((s) => s.id === ctx.run.sid);
      X = { content: ctx.content, rnd: ctx.rnd, cb: ctx.cb, run: ctx.run, i: 0, step: 0, final: null, done: false, ended: false, answered: false,
        used: { f: false, r: false, n: false }, hidden: new Set(), offline: !!ctx.run.offline || !ctx.run.id, t0: 0, tStart: performance.now(), t1: 0 };
      X.rungs = Array.from({ length: C.n }, (_, k) => h("li", { class: "dr-rung" }, h("b", { class: "num", text: String(k + 1) }), h("span", { class: "dr-mk", "aria-hidden": "true" })));
      X.dots = Array.from({ length: C.n }, () => h("i", { class: "dr-dot" }));
      X.stepTxt = h("span", { class: "dr-step" });
      X.timeTxt = h("span", { class: "dr-time num", "aria-hidden": "true" });
      X.timeLive = h("span", { class: "vh", "aria-live": "polite" });
      X.bar = h("i");
      X.qEl = h("p", { class: "gry-q dr-q", translate: "no" });
      X.optsEl = h("div", { class: "gry-opts dr-opts" });
      X.verdict = h("div", { class: "gry-verdict", "aria-live": "assertive" });
      X.after = h("div", { class: "gry-foot dr-after" });
      X.rokMsg = h("p", { class: "dr-rokmsg muted", hidden: true, "aria-live": "polite" });
      X.noteEl = h("p", { class: "dr-note", hidden: true, "aria-live": "polite" });
      const lb = (cls, key, txt, fn) => h("button", { type: "button", class: "btn dr-life " + cls, "aria-keyshortcuts": key, onclick: fn }, txt);
      X.life = { f: lb("dr-f", "F", "50:50", fifty), r: lb("dr-r", "R", "Zapytaj rok", askYear), n: lb("dr-n", "N", "Notatka", showNote) };
      X.stopBtn = h("button", { type: "button", class: "link dr-stop", "aria-keyshortcuts": "S", onclick: stopHere });
      X.dropTxt = h("small", { class: "dr-drop muted" });
      const ladder = h("aside", { class: "dr-ladder", "aria-label": T("Drabina") }, h("p", { class: "eyebrow", text: "Drabina" }), h("ol", { class: "dr-rungs", reversed: true }, X.rungs.slice().reverse()));
      const dots = h("div", { class: "dr-dots", "aria-hidden": "true" }, X.dots);
      const main = h("section", { class: "dr-main" },
        dots,
        h("div", { class: "dr-head" }, X.stepTxt, h("span", { "aria-hidden": "true", text: " · " }), X.timeTxt, subj ? h("span", { class: "sk-chip chip dr-subj", text: subj.name }) : null), X.timeLive,
        h("div", { class: "gry-time", "aria-hidden": "true" }, X.bar),
        X.qEl, X.optsEl, X.rokMsg, X.noteEl, X.verdict, X.after,
        h("div", { class: "dr-lifes", role: "group", "aria-label": "Koła ratunkowe" }, X.life.f, X.life.r, X.life.n),
        h("div", { class: "dr-foot" }, X.stopBtn, X.dropTxt));
      ctx.box.classList.add("dr-host");
      ctx.box.replaceChildren(h("div", { class: "dr" }, ladder, main));
      X.cb.onStart();
      showQ();
      return { n: C.n, noTime: true };
    },
    // klawisze (SPEC-2 4.4): 1–4 / A–D odpowiedź, F 50:50, R Zapytaj rok, N Notatka, S Zatrzymaj się
    key(e) {
      if (!X || X.ended || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const k = e.key.toUpperCase();
      if (k === "S") { e.preventDefault(); return stopHere(); }
      if (X.answered) return;
      const i = "1234".includes(k) && k.length === 1 ? "1234".indexOf(k) : "ABCD".includes(k) && k.length === 1 ? "ABCD".indexOf(k) : -1;
      if (i >= 0 && i < X.order.length) { e.preventDefault(); return answer(X.order[i]); }
      if (k === "F") { e.preventDefault(); return fifty(); }
      if (k === "R") { e.preventDefault(); return askYear(); }
      if (k === "N") { e.preventDefault(); return showNote(); }
    },
    score: () => (X ? (X.final ?? X.step) : 0),
    errors: () => 0,
    timeMs: () => (X ? Math.round((X.t1 || performance.now()) - X.tStart) : 0),
    stop() { if (X) { clearInterval(X.timer); clearTimeout(X.noteT); X.ended = true; } },
    debug: () => (X ? { st: X.ended ? "koniec" : X.answered ? "odpowiedz" : "pytanie", i: X.i, step: X.step, final: X.final, left: X.left, order: X.order, hidden: [...X.hidden], used: { ...X.used },
      q: { mid: X.q?.materialId, idx: X.q?.index, correct: X.q?.correct, n: X.q?.options.length, rokProc: X.q?.rokProc }, rok: X.content.map((q) => q.rokProc), note: X.note } : null),
    debugSet(o) { if (X && o?.left != null) X.t0 = performance.now() - (X.secs - o.left) * 1000; },
  };
  return game;
});
})();
