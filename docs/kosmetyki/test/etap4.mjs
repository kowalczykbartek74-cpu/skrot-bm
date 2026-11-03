// Etap 4 (nauka): wygląd fiszek, efekt po quizie, dźwięki (domyślnie wyciszone), kolor płomienia, zamrożenie serii.
// node docs/kosmetyki/test/etap4.mjs   (BASE=http://127.0.0.1:PORT/ OUT=katalog zrzutów)
import { chromium, page, shot, BASE } from "../../gry/test/lib.mjs";
let ok = 0, bad = 0, nav = 0;
const t = (name, cond, info = "") => { if (cond) { ok++; console.log("✓", name); } else { bad++; console.log("✗", name, info); } };
const UID = "00000000-0000-4000-8000-000000000001";
const D = new Date(), today = Math.round((new Date(D.getFullYear(), D.getMonth(), D.getDate()) - new Date(2026, 0, 1)) / 864e5);
const dk = (n) => { const d = new Date(2026, 0, 1 + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const ALL = ["fiszki:papier", "fiszki:kreda", "fiszki:nocny", "efekt:liscie", "efekt:iskry", "efekt:fala", "dzwieki:krople", "plomien:zielony", "plomien:zloty"];
const b = await chromium.launch();
const ctx = (prog, mon, extra = {}) => page(b, { ls: { "mock-v24": "1", "mock-progress": JSON.stringify({ [UID]: prog }), "mock-mon": JSON.stringify({ start: 500, ksiega: [], pos: ALL, ...mon }), ...extra } });
// klucz powtórki = <materiał>:<hashStr(pytanie fiszki)>; fiszki atrapy m1 to „PKB: pojęcie N”
const hashStr = (s) => { let x = 2166136261; for (const ch of String(s)) { x ^= ch.codePointAt(0); x = Math.imul(x, 16777619) >>> 0; } return x.toString(36); };
const srs = Object.fromEntries([1, 2, 3].map((i) => ["m1:" + hashStr(`PKB: pojęcie ${i}`), [1, today]]));

// ---------- fiszki: trzy wyglądy w powtórce ----------
for (const f of ["papier", "kreda", "nocny"]) {
  const p = await ctx({ xp: { t: 900 }, srs }, { zal: { fiszki: "fiszki:" + f } });
  await p.goto(BASE + "index.html#/review"); await p.waitForTimeout(1300);
  await p.getByRole("button", { name: "Zaczynamy →" }).click(); await p.waitForSelector(".lp .lp-sw .face", { timeout: 8000 });
  await p.waitForTimeout(400);
  const r = await p.evaluate(() => { const root = document.querySelector(".lp"), face = root.querySelector(".lp-sw.top .face") || root.querySelector(".lp-sw .face"); return { cls: root.className, bg: getComputedStyle(face).backgroundColor, ink: getComputedStyle(face).color }; });
  t(`fiszki ${f}: klasa na odtwarzaczu i kolory karty`, r.cls.includes("kf-" + f), r);
  await shot(p, "e4-fiszki-" + f);
  t(`fiszki ${f}: bez błędów`, !p.errors.length, p.errors);
  await p.context().close();
}

// ---------- efekt po quizie zamiast konfetti, dźwięk, płomień ----------
{
  // 1010 XP: quiz nie da awansu (awans ma własne konfetti)
  // (ms: kamienie milowe kursu już zaliczone – mają własne konfetti)
  const p = await ctx({ xp: { t: 1010 }, streak: { d: today - 1, n: 6 }, ms: { prawo: 100, makroekonomia: 100 } }, { zal: { efekt: "efekt:liscie", dzwieki: "dzwieki:krople", plomien: "plomien:zloty" } });
  await p.addInitScript(() => { window.__snd = 0; const O = window.AudioContext; window.AudioContext = function () { const c = new O(); const mk = c.createOscillator.bind(c); c.createOscillator = () => { window.__snd++; return mk(); }; return c; }; });
  await p.goto(BASE + `index.html?r=${++nav}#/more`); await p.waitForSelector(".kprof");
  t("płomień serii w kolorze (złoty SVG zamiast 🔥) w Więcej", await p.$eval(".more-rank .xp-chip", (e) => !!e.querySelector(".kflame svg")).catch(() => false) || (await p.$$(".kflame svg")).length > 0);
  await shot(p, "e4-plomien");
  // quiz z m1: efekt Liście zamiast konfetti po ostatnim pytaniu
  const fx = await p.evaluate(async () => {
    const seen = new Set(); const mo = new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => n.classList && n.className && seen.add(String(n.className))))); mo.observe(document.body, { childList: true, subtree: true });
    window.__seen = seen; return true; });
  await p.goto(BASE + `index.html?r=${++nav}#/material/m3`); await p.waitForTimeout(1600);
  await p.getByRole("button", { name: /Quiz/ }).first().click();
  await p.getByRole("button", { name: /Zaczynamy/ }).click(); await p.waitForTimeout(600);
  // dobra odpowiedź w atrapie: „Odpowiedź <ABCD[i % 4]><i>”
  // do końca quizu (wszystkie części): ekran końca bez „Dalej: Pytania …”
  const koniec = async () => (await p.locator(".lp-done-screen").count()) && !/Dalej/.test(await p.locator(".lp-cta").innerText().catch(() => ""));
  for (let i = 0; i < 80 && !(await koniec()); i++) {
    if (await p.locator(".lp-opts .opt").count()) { const o = await p.locator(".lp-opts .opt").allInnerTexts(); const k = o.findIndex((x) => { const m = x.match(/Odpowiedź ([ABCD])(\d+)/); return m && "ABCD".indexOf(m[1]) === +m[2] % 4; }); await p.locator(".lp-opts .opt").nth(Math.max(0, k)).click().catch(() => {}); }
    await p.locator(".lp-cta").click({ timeout: 3000 }).catch(() => {}); await p.waitForTimeout(250);
  }
  await p.waitForTimeout(450);
  const r = await p.evaluate(() => ({ kfx: !!document.querySelector(".kfx-liscie"), conf: !!document.querySelector(".lp-confetti"), done: !!document.querySelector(".lp-done-screen") }));
  t("koniec quizu: efekt Liście zamiast konfetti", r.done && r.kfx && !r.conf, r);
  await shot(p, "e4-efekt-liscie");
  const snd = await p.evaluate(() => window.__snd);
  t("dźwięk domyślnie wyciszony (paczka założona, przełącznik wyłączony)", snd === 0, snd);
  t("bez błędów", !p.errors.length, p.errors);
  await p.context().close();
}
// ---------- sklep Nauka: podglądy, przełącznik dźwięku, „Posłuchaj” ----------
{
  const p = await ctx({ xp: { t: 900 } }, { zal: { dzwieki: "dzwieki:krople" } });
  await p.goto(BASE + "index.html#/shop"); await p.waitForSelector("#ktab-nauka"); await p.click("#ktab-nauka"); await p.waitForTimeout(300);
  t("Nauka: fiszki (3), efekty (3), dźwięki (3), płomienie (3), zamrożenie (1)", (await p.$$("#kpanel .kcard")).length === 13, (await p.$$("#kpanel .kcard")).length);
  t("przełącznik dźwięku domyślnie wyłączony", (await p.$eval(".ksnd-row", (e) => e.getAttribute("aria-checked"))) === "false");
  await p.click(".ksnd-row"); await p.waitForTimeout(200);
  t("przełącznik włącza dźwięki (bm-dzwieki)", await p.evaluate(() => localStorage.getItem("bm-dzwieki") === "1"));
  await shot(p, "e4-sklep-nauka");
  t("bez błędów", !p.errors.length, p.errors);
  await p.context().close();
}
// ---------- zamrożenie serii ----------
{
  // Przedwczoraj ostatnia nauka (seria 6), wczoraj przerwa, 1 zamrożenie w zapasie → seria widoczna i po dzisiejszej nauce 7.
  const p = await ctx({ xp: { t: 900, d: today - 2, n: 30 }, streak: { d: today - 2, n: 6 } }, { zam: { reqs: ["req-aaaaaaaa"], dni: [] } });
  await p.goto(BASE + "index.html#/more"); await p.waitForSelector(".kprof"); await p.waitForTimeout(500);
  t("z zamrożeniem w zapasie seria 6 dalej widoczna", /6\s*dni z rzędu|6 dni/.test(await p.$eval(".more-rank", (e) => e.closest(".sk-profile").textContent)));
  // nauka dziś: XP z dowolnego miejsca (xpFlush przez grę/odtwarzacz) – tu przez GRY_API nie da się, więc przez powtórkę
  await p.evaluate((srs) => { const u = "00000000-0000-4000-8000-000000000001"; const pr = JSON.parse(localStorage.getItem("mock-progress")); pr[u].srs = srs; localStorage.setItem("mock-progress", JSON.stringify(pr)); }, srs);
  await p.goto(BASE + `index.html?r=${++nav}#/review`); await p.waitForTimeout(1300);
  await p.getByRole("button", { name: "Zaczynamy →" }).click(); await p.waitForSelector(".lp .sk-grade4, .lp .lp-sw", { timeout: 8000 });
  for (let i = 0; i < 3; i++) { const top = p.locator(".lp .lp-sw.top"); if (await top.count()) await top.click().catch(() => {}); await p.waitForTimeout(250); const g = p.locator(".lp .sk-grade4 .opt.g-good"); if (await g.count()) await g.click().catch(() => {}); await p.waitForTimeout(350); }
  await p.waitForTimeout(1200);
  const r = await p.evaluate(() => ({ streak: JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => k.startsWith("bm-progress-"))) || "{}")?.data?.streak, rpc: window.__rpc.filter((x) => x.fn === "nauka_zamrozenie_uzyj").map((x) => x.res) }));
  t("po nauce: seria 7, zamrożenie użyte na wczoraj", r.streak?.n === 7 && r.streak?.d === today && r.rpc.some((x) => x?.ok), r);
  const mon = await p.evaluate(() => JSON.parse(localStorage.getItem("mock-mon")).zam);
  t("w bazie: wczoraj zaznaczony jako chroniony, zapas 0", mon.dni.length === 1 && mon.reqs.length === 1, mon);
  t("bez błędów", !p.errors.length, p.errors);
  await p.context().close();
}
{
  // Bez zamrożenia: przerwa = seria od nowa (jak dotąd)
  const p = await ctx({ xp: { t: 900 }, streak: { d: today - 2, n: 6 } }, {});
  await p.goto(BASE + "index.html#/more"); await p.waitForSelector(".kprof"); await p.waitForTimeout(400);
  t("bez zamrożenia seria po przerwie = 0 (jak dotąd)", /0\s*dni z rzędu|Ucz się dziś/.test(await p.$eval(".sk-profile", (e) => e.textContent)));
  await p.context().close();
}
await b.close();
console.log(`${ok}/${ok + bad}`);
process.exit(bad ? 1 : 0);
