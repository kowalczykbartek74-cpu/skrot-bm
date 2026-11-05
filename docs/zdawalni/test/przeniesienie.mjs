import { chromium } from "playwright";
import fs from "node:fs";
const OLD = fs.readFileSync(new URL("../../../", import.meta.url).pathname + "docs/zdawalni/przekierowanie/index.html", "utf8");
const REC = fs.readFileSync(new URL("../../../", import.meta.url).pathname + "przenies.html", "utf8");
const APP = "<!doctype html><title>app</title><p>nowa aplikacja</p>";
const br = await chromium.launch();
let fails = 0; const ok = (c, m) => { console.log((c ? "OK  " : "BŁĄD") + " " + m); if (!c) fails++; };
async function ctx() {
  const c = await br.newContext();
  await c.route("https://skrotbm.pl/**", r => r.fulfill({ contentType: "text/html", body: new URL(r.request().url()).pathname === "/__setup" ? "<p>setup</p>" : OLD }));
  await c.route("https://zdawalni.pl/**", r => new URL(r.request().url()).pathname === "/przenies.html"
    ? r.fulfill({ contentType: "text/html", body: REC }) : r.fulfill({ contentType: "text/html", body: APP }));
  return c;
}
const big = "x".repeat(300000); // duży stan, np. bm-q-seen
// 1) pełne przeniesienie z zalogowaniem, trasą i kodem polecającym
{
  const c = await ctx(), p = await c.newPage();
  await p.goto("https://skrotbm.pl/__setup"); // ustaw dane na starej domenie
  await p.evaluate((big) => { localStorage.setItem("skrot-device", "11111111-2222-3333-4444-555555555555");
    localStorage.setItem("sb-zkyxujkdrovfzpasocmv-auth-token", '{"access_token":"t"}');
    localStorage.setItem("bm-progress-abc", '{"data":{"xp":120}}'); localStorage.setItem("skrot-theme", "sea");
    localStorage.setItem("bm-q-seen", big); localStorage.setItem("obce-klucz", "nie"); localStorage.setItem("bm-group", "C112"); }, big);
  await p.goto("https://skrotbm.pl/?kod=ANIA#/exam/prawo");
  await p.waitForURL(u => u.host === "zdawalni.pl" && !u.pathname.includes("przenies"), { timeout: 15000 });
  const u = new URL(p.url());
  ok(u.search === "?kod=ANIA" && u.hash === "#/exam/prawo", "trasa i kod zostały: " + u.search + u.hash);
  const s = await p.evaluate(() => Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)])));
  ok(s["skrot-device"] === "11111111-2222-3333-4444-555555555555", "urządzenie przeniesione");
  ok(s["sb-zkyxujkdrovfzpasocmv-auth-token"]?.includes('"t"'), "logowanie przeniesione");
  ok(s["bm-q-seen"]?.length === 300000 && s["bm-group"] === "C112" && s["skrot-theme"] === "sea", "postępy, grupa, motyw przeniesione (300 kB)");
  console.log("   klucze:", p.url(), Object.keys(s).join(", "));
  ok(!("obce-klucz" in s), "obce klucze pominięte");
  ok(!!s["skrot-przeniesione"], "znacznik importu ustawiony");
  // 2) drugi raz: stary link nie nadpisuje nowszych danych
  await p.evaluate(() => localStorage.setItem("bm-group", "C113"));
  await p.goto("https://skrotbm.pl/");
  await p.waitForURL(u => u.host === "zdawalni.pl" && !u.pathname.includes("przenies"), { timeout: 15000 });
  ok(await p.evaluate(() => localStorage.getItem("bm-group")) === "C113", "ponowne wejście ze starego adresu nie nadpisuje");
  await c.close();
}
// 3) inne podstrony: zwykłe przekierowanie bez danych
{
  const c = await ctx(), p = await c.newPage();
  await p.goto("https://skrotbm.pl/regulamin.html?lang=en");
  await p.waitForURL(u => u.host === "zdawalni.pl", { timeout: 15000 });
  ok(p.url() === "https://zdawalni.pl/regulamin.html?lang=en", "podstrona: " + p.url());
  await c.close();
}
// 4) już zalogowany na nowej domenie: dopisuje tylko brakujące
{
  const c = await ctx(), p = await c.newPage();
  await p.goto("https://zdawalni.pl/x");
  await p.evaluate(() => { localStorage.setItem("sb-zkyxujkdrovfzpasocmv-auth-token", "NOWY"); localStorage.setItem("skrot-device", "nowe"); });
  await p.goto("https://skrotbm.pl/__setup");
  await p.evaluate(() => { localStorage.setItem("skrot-device", "stare"); localStorage.setItem("skrot-theme", "noc"); });
  await p.goto("https://skrotbm.pl/");
  await p.waitForURL(u => u.host === "zdawalni.pl" && !u.pathname.includes("przenies"), { timeout: 15000 });
  const s = await p.evaluate(() => [localStorage.getItem("skrot-device"), localStorage.getItem("skrot-theme")]);
  ok(s[0] === "nowe" && s[1] === "noc", "zalogowany na nowej: urządzenie zostaje, brakujący motyw dopisany");
  await c.close();
}
// 5) pusta przeglądarka: od razu na nowy adres bez przenies.html
{
  const c = await ctx(), p = await c.newPage(); const seen = [];
  p.on("framenavigated", f => seen.push(f.url()));
  await p.goto("https://skrotbm.pl/?proba=1");
  await p.waitForURL(u => u.host === "zdawalni.pl", { timeout: 15000 });
  ok(p.url() === "https://zdawalni.pl/?proba=1" && !seen.some(u => u.includes("przenies")), "nowa osoba: prosto na zdawalni.pl/?proba=1");
  await c.close();
}
await br.close(); process.exit(fails ? 1 : 0);
