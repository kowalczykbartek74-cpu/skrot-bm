// Pętla UX-4, etap W2 – dotyk, pomoc, toast. BASE=http://127.0.0.1:8814/ node docs/gry/test/ux4-etapW2.mjs
// K1 pola trafienia (osobny test ux4-cele.mjs, uruchamiany stąd), K2 jeden komponent .help-btn w wierszu tytułu, K3 toast.
import fs from "fs";
import { execSync } from "child_process";
import { chromium, BASE, OUT, open, goto, hit, poziomo, kontrast, tester } from "./ux4-lib.mjs";
const { ok, end } = tester();
const ROOT = new URL("../../../", import.meta.url).pathname;
// ---------- K1 ----------
let cele = ""; try { cele = execSync("node docs/gry/test/ux4-cele.mjs", { cwd: ROOT, encoding: "utf8", env: process.env }); } catch (e) { cele = (e.stdout || "") + (e.stderr || ""); }
const m = cele.match(/^(\d+)\/(\d+)$/m);
ok(`K1 ux4-cele.mjs zielony (${m ? m[0] : "?"})`, m && m[1] === m[2], cele.split("\n").filter((l) => l.startsWith("✗")));
const b = await chromium.launch();
// ---------- K2 ----------
const EKR = [["terms", "Jak działają Terminy", "How Deadlines work"], ["calendar", "Jak działa Kalendarz", "How the Calendar works"], ["review", "Jak działają Powtórki", "How Reviews work"], ["glossary", "Jak działa Słowniczek", "How the Glossary works"]];
for (const [w, dark, lang] of [[390, false, "pl"], [360, true, "pl"], [1280, false, "pl"], [390, false, "en"]]) {
  const p = await open(b, { konto: "starosta", w, h: 844, lang, ls: { "skrot-green": dark ? "dark" : "light" } });
  for (const [hash, pl, en] of EKR) {
    await goto(p, hash, 1500);
    const r = await p.evaluate(() => {
      const hb = [...document.querySelectorAll("#main .help-btn")].filter((e) => e.getBoundingClientRect().width);
      const e = hb[0]; const row = e?.parentElement, h1 = row?.querySelector(":scope > h1, :scope > .tart > h1"); if (!e || !h1) return { n: hb.length, h1: !!h1 };
      const r = e.getBoundingClientRect(), rr = row.getBoundingClientRect(), hr = h1.getBoundingClientRect();
      const kids = [...row.children].filter((x) => x.getBoundingClientRect().width);
      const rightmost = kids.reduce((a, x) => (x.getBoundingClientRect().right > a.getBoundingClientRect().right ? x : a));
      return { n: hb.length, w: Math.round(r.width), h: Math.round(r.height), label: e.getAttribute("aria-label"), sameRow: Math.abs((r.top + r.bottom) / 2 - (hr.top + hr.bottom) / 2) < hr.height / 2 + 4, prawo: rightmost === e,
        stareQ: [...document.querySelectorAll("#main .ptitle ~ .lead-help .qhelp, #main .rv-head > .qhelp, #main h1 + .qhelp")].filter((x) => x.getBoundingClientRect().width).length };
    });
    const tag = `${hash} ${w}${dark ? " ciemny" : ""} ${lang}`;
    ok(`K2 ${tag}: jeden .help-btn 32×32 w wierszu tytułu, po prawej`, r.n === 1 && r.w === 32 && r.h === 32 && r.sameRow && r.prawo, r);
    ok(`K2 ${tag}: aria-label „${lang === "en" ? en : pl}”`, r.label === (lang === "en" ? en : pl), r.label);
    ok(`K2 ${tag}: bez starego „?” pod tytułem`, r.stareQ === 0, r.stareQ);
    if (w === 390 && !dark) {
      await p.locator("#main .help-btn").first().click(); await p.waitForTimeout(500);
      const okno = await p.evaluate(() => ({ h2: document.querySelector("#layer h2")?.textContent, tekst: document.querySelector("#layer")?.innerText.length || 0 }));
      ok(`K2 ${tag}: „?” otwiera okno „${lang === "en" ? en : pl}” z treścią`, okno.h2 === (lang === "en" ? en : pl) && okno.tekst > 60, okno);
      await p.screenshot({ path: `${OUT}/w2-pomoc-${hash}-${lang}.png` });
      await p.keyboard.press("Escape"); await p.waitForTimeout(500);
      ok(`K2 ${tag}: Escape zamyka okno pomocy`, await p.evaluate(() => !document.querySelector("#layer h2")));
    }
  }
  ok(`K2 bez poziomego przewijania i błędów konsoli (${w}${dark ? " ciemny" : ""} ${lang})`, !(await poziomo(p)) && p.errors.length === 0, p.errors);
  await p.close();
}
// ---------- K3: toast ----------
const MSG = "Nie udało się zapisać postępu na serwerze, ale jest zapisany w tej przeglądarce. Spróbujemy ponownie.";
for (const [w, lang, dark] of [[390, "pl", false], [360, "en", true], [1280, "pl", false]]) {
  const p = await open(b, { konto: "starosta", w, h: 844, lang, ls: { "skrot-green": dark ? "dark" : "light" } });
  const show = (o) => p.evaluate(([m, o]) => { window.__retry = 0; window.ZD_APP.toast(m, o ? { alert: true, retry: () => window.__retry++ } : {}); }, [MSG, o]);
  await show(false); await p.waitForTimeout(500);
  const g = await p.evaluate(() => { const t = document.querySelector(".toast"), r = t.getBoundingClientRect(), nav = document.querySelector("nav#nav, .nav"); const nr = nav?.getBoundingClientRect(); const cs = getComputedStyle(t);
    return { w: r.width, max: Math.min(innerWidth * 0.92, 420), left: r.left, right: innerWidth - r.right, bottom: r.bottom, navTop: nr && nr.top > innerHeight / 2 ? nr.top : innerHeight, role: t.getAttribute("role"), fs: parseFloat(cs.fontSize) }; });
  const tag = `${w} ${lang}${dark ? " ciemny" : ""}`;
  ok(`K3 ${tag}: szerokość ≤ min(92vw, 420 px), wyśrodkowany`, g.w <= g.max + 0.5 && Math.abs(g.left - g.right) < 2, g);
  ok(`K3 ${tag}: nad dolną nawigacją`, g.bottom <= g.navTop - 8, g);
  ok(`K3 ${tag}: tekst ≥ 12 px, role=status`, g.fs >= 12 && g.role === "status", g);
  const k = await kontrast(p); ok(`K3 ${tag}: kontrast AA tekstu toastu`, !k.out.some((x) => /zapisać|save/i.test(x.tekst)), k.out);
  await p.screenshot({ path: `${OUT}/w2-toast-${w}-${lang}.png` });
  if (w === 390) {
    // czas: 110 znaków → 6,6 s
    await p.waitForTimeout(5300);
    ok("K3 długi komunikat widoczny po 5,8 s (czas = max(4000, 60 × długość))", await p.evaluate(() => !!document.querySelector(".toast")));
    await p.waitForTimeout(1500);
    ok("K3 znika po ok. 6,6 s", await p.evaluate(() => !document.querySelector(".toast")));
    // krótki komunikat: 4 s
    await p.evaluate(() => window.ZD_APP.toast("Zapisano.")); await p.waitForTimeout(3600);
    ok("K3 krótki komunikat widoczny 3,6 s (min. 4 s)", await p.evaluate(() => !!document.querySelector(".toast")));
    await p.waitForTimeout(800); ok("K3 krótki znika po 4 s", await p.evaluate(() => !document.querySelector(".toast")));
    // pauza przy najechaniu
    await show(false); await p.waitForTimeout(300);
    await p.locator(".toast").hover(); await p.waitForTimeout(7600);
    ok("K3 pauza przy najechaniu (po 7,9 s nadal widoczny)", await p.evaluate(() => !!document.querySelector(".toast")));
    await p.mouse.move(5, 5); await p.waitForTimeout(7200);
    ok("K3 po zjechaniu kursorem odlicza dalej i znika", await p.evaluate(() => !document.querySelector(".toast")));
    // pauza przy fokusie
    await show(false); await p.waitForTimeout(200); await p.evaluate(() => document.querySelector(".toast").focus()); await p.waitForTimeout(7400);
    ok("K3 pauza przy fokusie", await p.evaluate(() => !!document.querySelector(".toast")));
    // zamknięcie dotknięciem
    await p.locator(".toast").click(); await p.waitForTimeout(200);
    ok("K3 dotknięcie zamyka toast", await p.evaluate(() => !document.querySelector(".toast")));
  }
  // błąd zapisu: role=alert z „Ponów”
  await show(true); await p.waitForTimeout(400);
  const a = await p.evaluate(() => { const t = document.querySelector(".toast"); const btn = t.querySelector("button"); /* rozmiar z układu, nie z klatki animacji wejścia (h-toast) */ return { role: t.getAttribute("role"), btn: btn.textContent, w: btn.offsetWidth, h: btn.offsetHeight }; });
  ok(`K3 ${tag}: błąd zapisu jako role=alert z przyciskiem „${lang === "en" ? "Retry" : "Ponów"}” ≥ 44 px`, a.role === "alert" && a.btn === (lang === "en" ? "Retry" : "Ponów") && a.w >= 44 && a.h >= 44, a);
  const k2 = await kontrast(p); ok(`K3 ${tag}: kontrast AA toastu błędu`, !k2.out.some((x) => /zapisać|save|Ponów|Retry/i.test(x.tekst)), k2.out);
  await p.screenshot({ path: `${OUT}/w2-toast-blad-${w}-${lang}.png` });
  await p.locator(".toast button").click(); await p.waitForTimeout(200);
  ok(`K3 ${tag}: „Ponów” wywołuje ponowny zapis i zamyka toast`, await p.evaluate(() => window.__retry === 1 && !document.querySelector(".toast")));
  ok(`K3 bez błędów konsoli (${tag})`, p.errors.length === 0, p.errors);
  await p.close();
}
const src = fs.readFileSync(ROOT + "index.html", "utf8");
ok("K3 flushProgress: błąd zapisu woła toast z { alert: true, retry }", /toast\("Nie udało się zapisać postępu na serwerze[^"]*", \{ alert: true, retry: \(\) => flushProgress\(\) \}\)/.test(src));
// ruch toastu wyłączony przy reduced-motion i html.calm
for (const [n, o] of [["reduced-motion", { motion: "reduce" }], ["html.calm", { ls: { "skrot-calm": "1" } }]]) {
  const p = await open(b, { konto: "starosta", w: 390, h: 844, ...o });
  if (n === "html.calm") await p.evaluate(() => document.documentElement.classList.add("calm"));
  await p.evaluate(() => window.ZD_APP.toast("Test ruchu"));
  const an = await p.evaluate(() => { const c = getComputedStyle(document.querySelector(".toast")); return c.animationName + " " + c.transitionDuration; });
  ok(`ruch toastu wyłączony (${n}): ${an}`, /^none /.test(an), an);
  await p.close();
}
await b.close();
end();
