// Pętla UX-1, etap 1: pierwszy ekran i jedna ścieżka do próby (kryteria K1–K6 z ~/zdawalni/ux/petla-1.md).
// BASE=http://127.0.0.1:8811/ node docs/gry/test/ux1-etap1.mjs
import { chromium, page, BASE } from "./lib.mjs";
import { tester } from "./h2-lib.mjs";
const { ok, end } = tester();
const b = await chromium.launch();
const CLS = () => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true }); };
const login = async (o = {}) => {
  const p = await page(b, { konto: "brak", w: o.w || 390, h: o.h || 844, lang: o.lang || "pl", ls: o.ls || {}, ctx: o.dark ? { colorScheme: "dark" } : {} });
  await p.addInitScript(CLS);
  if (o.clock) await p.clock.install({ time: new Date("2026-11-17T10:00:00+01:00") });
  await p.goto(BASE + "index.html" + (o.q || "")); await p.waitForTimeout(o.wait ?? 3000);
  return p;
};
// Dziś gotowe (powitanie narysowane) + chwila na arkusz z afterReady; odporne na wolniejszą maszynę.
const ready = async (p) => { await p.waitForSelector("#main .greet", { timeout: 20000 }).catch(() => {}); await p.waitForTimeout(1200); };
const vis = (p, sel) => p.evaluate((s) => [...document.querySelectorAll(s)].filter((e) => e.offsetParent && getComputedStyle(e).visibility !== "hidden").map((e) => { const r = e.getBoundingClientRect(); return { t: e.innerText.trim(), cls: e.className, top: r.top, bottom: r.bottom, bg: getComputedStyle(e).backgroundColor, w: r.width, h: r.height }; }), sel);

// ---------- K1: od góry, bez skoków, nagłówek i „Zacznij 3 dni za darmo” w pierwszym ekranie ----------
for (const [w, h] of [[360, 640], [390, 844], [1280, 900]]) for (const g of ["C111", ""]) {
  const p = await login({ w, h, ls: { "bm-group": g } });
  const r = await p.evaluate(() => ({ y: scrollY, cls: window.__cls, act: document.activeElement?.tagName, ih: innerHeight }));
  ok(`K1 ${w}×${h}${g ? "" : " (bez grupy)"}: scrollY = 0 po 3 s`, r.y === 0, r);
  ok(`K1 ${w}×${h}${g ? "" : " (bez grupy)"}: CLS < 0,1 (${r.cls.toFixed(3)})`, r.cls < 0.1, r);
  ok(`K1 ${w}×${h}${g ? "" : " (bez grupy)"}: bez fokusu w polu (klawiatura się nie otwiera)`, r.act !== "INPUT", r);
  const head = (await vis(p, w >= 900 ? "#login .lg-side h1" : "#login .lg-intro h1"))[0];
  ok(`K1 ${w}×${h}${g ? "" : " (bez grupy)"}: nagłówek „Mniej szukania…” w pierwszym ekranie`, head && head.top >= 0 && head.bottom <= r.ih, head);
  if (g) {
    const cta = (await vis(p, "#loginBox .lg-trial .btn"))[0];
    ok(`K1 ${w}×${h}: „Zacznij 3 dni za darmo” w pierwszym ekranie`, cta && /Zacznij 3 dni za darmo/.test(cta.t) && cta.bottom <= r.ih, cta);
  }
  ok(`K1 ${w}×${h}${g ? "" : " (bez grupy)"}: konsola bez błędów`, !p.errors.length, p.errors);
  await p.close();
}

// ---------- K2: jeden przycisk w stylu głównym; „Wyślij kod” drugorzędny ----------
for (const dark of [false, true]) {
  const p = await login({ dark });
  // Wygląd pro: logowanie zwinięte pod „Masz już konto? Zaloguj się” – rozwijamy, żeby zobaczyć „Wyślij kod”
  await p.evaluate(() => document.querySelectorAll("details.lg-konto, details.lk-inne").forEach((d) => { d.open = true; })); 
  const btns = await vis(p, "#login button");
  const prim = btns.filter((x) => /\bprimary\b/.test(x.cls));
  ok(`K2 ${dark ? "ciemny" : "jasny"}: dokładnie jeden przycisk .primary („Zacznij 3 dni za darmo”)`, prim.length === 1 && /Zacznij 3 dni/.test(prim[0].t), prim);
  const send = btns.find((x) => x.t === "Wyślij kod");
  ok(`K2 ${dark ? "ciemny" : "jasny"}: „Wyślij kod” bez klasy primary i bez zielonego tła`, send && !/primary/.test(send.cls) && !/26, 127, 69|74, 222, 139/.test(send.bg), send);
  const h3 = await p.evaluate(() => { const e = document.querySelector("#loginBox .lg-h3"); return e && { tag: e.tagName, fs: parseFloat(getComputedStyle(e).fontSize), t: e.textContent }; });
  ok(`K2 ${dark ? "ciemny" : "jasny"}: „Zaloguj się” jako h3 18 px`, h3?.tag === "H3" && h3.fs === 18 && h3.t === "Zaloguj się", h3);
  await p.close();
}

// ---------- K3: propozycja próby po pierwszym logowaniu; pasek na Dziś bez znacznika ----------
{
  // Znacznik ustawia krok kodu, gdy logowanie przyszło z pełnego ekranu.
  const p = await login();
  await p.evaluate(() => document.querySelectorAll("details.lg-konto, details.lk-inne").forEach((d) => { d.open = true; })); await p.fill("#skrot-login-email", "nowy@stud.usz.edu.pl"); await p.click("#loginBox form button[type=submit]");
  await p.waitForSelector("#skrot-login-code"); await p.fill("#skrot-login-code", "123456");
  await p.waitForTimeout(400);
  ok("K3: kod z pełnego ekranu logowania zostawia znacznik skrot-z-logowania", (await p.evaluate(() => localStorage.getItem("skrot-z-logowania"))) === "1");
  await p.close();
}
{
  const p = await page(b, { konto: "darmowe", ls: { "skrot-z-logowania": "1" } });
  await p.goto(BASE + "index.html"); await ready(p);
  const sh = await p.evaluate(() => { const d = document.querySelector(".uxw-sheet"); return d && { h2: d.querySelector("h2")?.textContent, txt: d.innerText, btns: [...d.querySelectorAll("button")].map((x) => ({ t: x.textContent, h: x.getBoundingClientRect().height, prim: x.classList.contains("primary") })) }; });
  ok("K3: konto darmowe + znacznik → arkusz „Włączyć teraz 3 dni pełnego dostępu?”", sh?.h2 === "Włączyć teraz 3 dni pełnego dostępu?", sh);
  ok("K3: arkusz: „Bez karty i bez płatności…”, główny „Tak, zaczynam 3 dni”, drugi „Później…”, przyciski ≥ 44 px", /Bez karty i bez płatności/.test(sh?.txt) && sh?.btns[0]?.t === "Tak, zaczynam 3 dni" && sh.btns[0].prim && /Później, zostawię na kolokwium/.test(sh.btns[1]?.t) && sh.btns.every((x) => x.h >= 44), sh);
  await p.click(".uxw-sheet .btn.primary"); await p.waitForTimeout(3500);
  const st = await p.evaluate(() => ({ konto: localStorage.getItem("mock-konto"), h2: [...document.querySelectorAll("#layer .modal h2")].map((x) => x.textContent) }));
  ok("K3: „Tak” → próba (mock-konto = proba) i powitanie „Masz 3 dni pełnego dostępu”", st.konto === "proba" && st.h2.includes("Masz 3 dni pełnego dostępu"), st);
  ok("K3: konsola bez błędów (arkusz i start próby)", !p.errors.length, p.errors);
  await p.close();
}
{
  // Drugie wejście: arkusza już nie ma (raz na konto w przeglądarce).
  const p = await page(b, { konto: "darmowe", ls: { "skrot-z-logowania": "1", "skrot-proba-zapytano": "1" } });
  await p.goto(BASE + "index.html"); await ready(p);
  ok("K3: arkusz tylko raz (skrot-proba-zapytano)", !(await p.locator(".uxw-sheet").count()));
  await p.close();
}
for (const [w, h, dark] of [[390, 844, false], [360, 640, false], [390, 844, true]]) {
  const p = await page(b, { konto: "darmowe", w, h, ls: { "skrot-green": dark ? "dark" : "light" } });
  await p.goto(BASE + "index.html"); await ready(p);
  const bar = (await vis(p, ".uxw-pasek"))[0];
  const ih = await p.evaluate(() => innerHeight);
  ok(`K3 ${w}×${h}${dark ? " ciemny" : ""}: bez znacznika pasek „Masz jeszcze 3 dni za darmo · Włącz” w pierwszym ekranie Dziś (≤ 56 px)`, bar && /Masz jeszcze 3 dni za darmo/.test(bar.t) && /Włącz/.test(bar.t) && bar.bottom <= ih && bar.h <= 56, bar);
  const btn = await p.evaluate(() => { const e = document.querySelector(".uxw-pasek-b"); const r = e?.getBoundingClientRect(); return r && { w: r.width, h: r.height }; });
  ok(`K3 ${w}×${h}${dark ? " ciemny" : ""}: „Włącz” ≥ 44×44 px`, btn && btn.w >= 44 && btn.h >= 44, btn);
  ok(`K3 ${w}×${h}${dark ? " ciemny" : ""}: bez arkusza (brak znacznika)`, !(await p.locator(".uxw-sheet").count()));
  if (w === 390 && !dark) {
    await p.click(".uxw-pasek-b"); await p.waitForTimeout(3500);
    ok("K3: „Włącz” na pasku → próba", (await p.evaluate(() => localStorage.getItem("mock-konto"))) === "proba");
  }
  await p.close();
}
for (const konto of ["platne", "proba-koniec", "starosta"]) {
  const p = await page(b, { konto });
  await p.goto(BASE + "index.html"); await ready(p);
  ok(`K3: konto ${konto}: bez paska „Masz jeszcze 3 dni”`, !(await p.evaluate(() => /Masz jeszcze 3 dni za darmo/.test(document.body.innerText))));
  await p.close();
}

// ---------- K4: Staś, kształty H2, ciemny wariant, ikona play zamiast 👀 ----------
for (const [w, h] of [[390, 844], [1280, 900]]) for (const dark of [false, true]) {
  const p = await login({ w, h, dark });
  const r = await p.evaluate((desk) => {
    const st = document.querySelector(desk ? "#login .lg-stas .stas-face" : "#login .lg-intro .stas-face");
    const cta = document.querySelector("#loginBox .lg-trial .btn.primary"), card = document.querySelector("#loginBox .lg-trial");
    const demo = document.querySelector("#login .lg-demo-btn");
    return { stas: !!st?.querySelector("svg") && st.getBoundingClientRect().width >= 48, ctaR: parseFloat(getComputedStyle(cta).borderTopLeftRadius), cardR: parseFloat(getComputedStyle(card).borderTopLeftRadius),
      bg: getComputedStyle(document.getElementById("login")).backgroundColor, play: !!demo?.querySelector("svg circle + path"), emoji: /👀|\p{Extended_Pictographic}/u.test(document.getElementById("login").innerText) };
  }, w >= 900);
  const tag = `${w} ${dark ? "ciemny" : "jasny"}`;
  ok(`K4 ${tag}: Staś (SVG) na ekranie logowania`, r.stas, r);
  ok(`K4 ${tag}: przycisk próby pastylka, karta ≥ 22 px (H2)`, r.ctaR >= 14 && r.cardR >= 22, r);
  ok(`K4 ${tag}: tło logowania ${dark ? "ciemne #0F1A14" : "jasne #F4F5F0"}`, dark ? r.bg === "rgb(15, 26, 20)" : r.bg === "rgb(244, 245, 240)", r);
  ok(`K4 ${tag}: ikona SVG play w „Zobacz przykładową lekcję”, bez emoji`, r.play && !r.emoji, r);
  await p.close();
}

// ---------- K5: limit maili / weryfikacji i „Wyślij ponownie” ----------
{
  const p = await login({ ls: { "mock-otp-blad": "rate" } });
  await p.evaluate(() => document.querySelectorAll("details.lg-konto, details.lk-inne").forEach((d) => { d.open = true; })); await p.fill("#skrot-login-email", "a@stud.usz.edu.pl"); await p.click("#loginBox form button[type=submit]"); await p.waitForTimeout(300);
  const err = await p.locator("#loginBox .notice.err").innerText().catch(() => "");
  ok("K5: błąd limitu z signInWithOtp → „Teraz loguje się dużo osób naraz. Spróbuj za 2–3 minuty.”", err === "Teraz loguje się dużo osób naraz. Spróbuj za 2–3 minuty.", err);
  await p.close();
}
{
  const p = await login({ clock: true, wait: 0 });
  await p.clock.runFor(3000);
  await p.evaluate(() => document.querySelectorAll("details.lg-konto, details.lk-inne").forEach((d) => { d.open = true; })); await p.fill("#skrot-login-email", "a@stud.usz.edu.pl"); await p.click("#loginBox form button[type=submit]");
  await p.clock.runFor(500);
  const before = await p.evaluate(() => { const r = document.querySelector(".lg-resend"); return { dis: r?.disabled, t: r?.textContent, note: document.querySelector(".lg-resend-note")?.classList.contains("on") }; });
  ok("K5: przed 60 s „Wyślij ponownie” nieaktywne z odliczaniem, bez notki", before.dis === true && /Wyślij ponownie za \d+ s/.test(before.t) && !before.note, before);
  const cls0 = await p.evaluate(() => window.__cls);
  await p.clock.runFor(61000);
  const cls1 = await p.evaluate(() => window.__cls);
  ok("K5: pojawienie się notki po 60 s nie przesuwa ekranu (przyrost CLS < 0,01)", cls1 - cls0 < 0.01, { cls0, cls1 });
  const after = await p.evaluate(() => { const r = document.querySelector(".lg-resend"), n = document.querySelector(".lg-resend-note"); return { dis: r?.disabled, t: r?.textContent, note: n && n.classList.contains("on") && getComputedStyle(n).visibility === "visible" ? n.textContent : null, h: r?.getBoundingClientRect().height, otp: window.__otp }; });
  ok("K5: po 60 s notka o spamie i aktywne „Wyślij ponownie”", after.dis === false && after.t === "Wyślij ponownie" && /Kod nie dochodzi\? Sprawdź folder Oferty\/Spam/.test(after.note) && after.h >= 44, after);
  await p.click(".lg-resend"); await p.clock.runFor(500);
  const re = await p.evaluate(() => ({ otp: window.__otp, msg: document.querySelector(".lg-resend-msg")?.textContent, dis: document.querySelector(".lg-resend")?.disabled }));
  ok("K5: „Wyślij ponownie” wysyła kod jeszcze raz i znów odlicza", re.otp === after.otp + 1 && /Wysłaliśmy nowy kod/.test(re.msg) && re.dis === true, re);
  await p.close();
}

// ---------- K6: po kodzie w trybie próby „Zacznij 3 dni za darmo”; EN ----------
{
  const p = await login({ ls: { "skrot-trial": "1" } });
  await p.evaluate(() => document.querySelectorAll("details.lg-konto, details.lk-inne").forEach((d) => { d.open = true; })); await p.fill("#skrot-login-email", "a@stud.usz.edu.pl"); await p.click("#loginBox form button[type=submit]"); await p.waitForSelector("#skrot-login-code");
  const t = await p.locator("#loginBox form button[type=submit]").innerText();
  ok("K6: przycisk po kodzie w trybie próby: „Zacznij 3 dni za darmo”", t === "Zacznij 3 dni za darmo", t);
  await p.close();
}
{
  const p = await login();
  await p.evaluate(() => document.querySelectorAll("details.lg-konto, details.lk-inne").forEach((d) => { d.open = true; })); await p.fill("#skrot-login-email", "a@stud.usz.edu.pl"); await p.click("#loginBox form button[type=submit]"); await p.waitForSelector("#skrot-login-code");
  ok("K6: bez trybu próby przycisk po kodzie: „Zaloguj się”", (await p.locator("#loginBox form button[type=submit]").innerText()) === "Zaloguj się");
  await p.close();
}
{
  const p0 = await login({ lang: "en", ls: { "bm-group": "" } });
  const intro = await p0.evaluate(() => document.querySelector("#login .lg-intro").innerText);
  await p0.close();
  const p = await login({ lang: "en" });
  await p.evaluate(() => document.querySelectorAll("details.lg-konto, details.lk-inne").forEach((d) => { d.open = true; })); 
  const txt = intro + "\n" + await p.evaluate(() => document.getElementById("login").innerText);
  ok("K6 EN: „Practice tests before every midterm”", /Practice tests before every midterm/.test(txt), txt.slice(0, 600));
  ok("K6 EN: „Your group's test and exam dates”", /Your group's test and exam dates/.test(txt));
  ok("K6 EN: zakładka „Email code”", /Email code/.test(txt));
  ok("K6 EN: bez starych tekstów (Mock tests before each test, Code from the email)", !/Mock tests before each test|Code from the email/.test(txt));
  await p.evaluate(() => document.querySelectorAll("details.lg-konto, details.lk-inne").forEach((d) => { d.open = true; })); await p.fill("#skrot-login-email", "a@stud.usz.edu.pl"); await p.click("#loginBox form button[type=submit]"); await p.waitForSelector("#skrot-login-code");
  ok("K6 EN: krok kodu po angielsku („Change email”, „Resend in … s”)", /Change email/.test(await p.locator("#loginBox").innerText()) && /Resend in \d+ s/.test(await p.locator(".lg-resend").innerText()));
  await p.close();
}
{
  const p = await page(b, { konto: "darmowe", lang: "en", ls: { "skrot-z-logowania": "1" } });
  await p.goto(BASE + "index.html"); await ready(p);
  const t = await p.locator(".uxw-sheet").innerText().catch(() => "");
  ok("K3/K6 EN: arkusz po angielsku", /Start your 3 days of full access now\?/.test(t) && /No card, no payment\. Nothing is charged after 3 days\./.test(t) && /Yes, start 3 days/.test(t) && /Later, I’ll save it for a test/.test(t), t);
  await p.keyboard.press("Escape"); await p.waitForTimeout(200);
  const bar = await p.locator(".uxw-pasek").innerText().catch(() => "");
  ok("K3/K6 EN: pasek „You still have 3 free days · Start”", /You still have 3 free days/.test(bar) && /Start/.test(bar), bar);
  await p.close();
}
{
  const p = await login({ lang: "en", ls: { "mock-otp-blad": "rate" } });
  await p.evaluate(() => document.querySelectorAll("details.lg-konto, details.lk-inne").forEach((d) => { d.open = true; })); await p.fill("#skrot-login-email", "a@stud.usz.edu.pl"); await p.click("#loginBox form button[type=submit]"); await p.waitForTimeout(300);
  ok("K5 EN: komunikat limitu po angielsku", (await p.locator("#loginBox .notice.err").innerText().catch(() => "")) === "Lots of people are logging in right now. Try again in 2–3 minutes.");
  await p.close();
}
await b.close();
end();
