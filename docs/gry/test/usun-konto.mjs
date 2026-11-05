// Etap 4 specu „Systemy z Zdawalni w Skrócie”: ekran „Usuń konto” (funkcja Edge usun-konto podstawiona w teście).
//   A. Ustawienia → Konto → Usuń konto: lista tego, co zniknie, ostrzeżenie o opłaconym dostępie, przycisk dopiero po własnym e-mailu,
//   B. błąd funkcji (np. Stripe): komunikat, nic nie wyczyszczone, można spróbować jeszcze raz,
//   C. sukces: zapytanie z e-mailem i tokenem, ekran „Konto usunięte”, dane przeglądarki wyczyszczone (język zostaje),
//   D. starosta (administrator) nie usuwa konta sam; EN.
// BASE=http://127.0.0.1:8811/ node docs/gry/test/usun-konto.mjs
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = []; const ok = (n, w, i) => wyniki.push([w ? "✓" : "✗", n, w ? "" : JSON.stringify(i)?.slice(0, 700)]);
const zapytania = [];
let odp = { status: 502, body: { code: "stripe", message: "Nie udało się anulować subskrypcji. Nic nie zostało usunięte. Spróbuj za chwilę albo napisz do nas." } };
const fn = async (r) => {
  if (r.request().method() === "OPTIONS") return r.fulfill({ status: 200, body: "ok" });
  zapytania.push({ body: JSON.parse(r.request().postData() || "{}"), auth: r.request().headers()["authorization"] });
  r.fulfill({ status: odp.status, contentType: "application/json", body: JSON.stringify(odp.body) });
};

for (const [w, h] of [[375, 812], [1280, 900]]) {
  zapytania.length = 0;
  odp = { status: 502, body: { code: "stripe", message: "Nie udało się anulować subskrypcji. Nic nie zostało usunięte. Spróbuj za chwilę albo napisz do nas." } };
  const p = await page(b, { konto: "platne", w, h, ls: { "bm-progress-x": "{}", "skrot-lang": "pl" } });
  await p.context().route(/functions\/v1\/usun-konto/, fn);
  await p.goto(BASE + "index.html#/ustawienia/konto"); await p.waitForTimeout(2500);
  const row = p.locator("button.more-row", { hasText: "Usuń konto" });
  ok(`${w} A: wiersz „Usuń konto” w Ustawieniach → Konto`, (await row.count()) === 1);
  await row.click(); await p.waitForTimeout(800);
  const txt = await p.locator("main").innerText();
  ok(`${w} A: ekran mówi, co zniknie, i że opłacony dostęp przepada`, /Co zostanie usunięte/.test(txt) && /cały postęp/.test(txt) && /Moje materiały/.test(txt) && /przepada razem z kontem/.test(txt) && /Tego nie da się cofnąć/.test(txt), txt.slice(0, 600));
  const go = p.locator(".uk-go");
  ok(`${w} A: przycisk wyłączony bez e-maila`, await go.isDisabled());
  await p.locator("#uk-email").fill("ktos@x.pl");
  ok(`${w} A: cudzy e-mail nie odblokowuje`, await go.isDisabled());
  await p.locator("#uk-email").fill(" Student@X.pl ");
  ok(`${w} A: własny e-mail (wielkość liter i spacje bez znaczenia) odblokowuje`, !(await go.isDisabled()));
  const tap = await go.boundingBox();
  ok(`${w} A: przycisk ≥ 44 px wysokości`, tap && tap.height >= 44, tap);
  await shot(p, `uk-${w}-ekran`);
  // B: błąd
  await go.click(); await p.waitForTimeout(1200);
  const err = await p.locator(".notice.err[role=alert]").innerText().catch(() => "");
  ok(`${w} B: błąd Stripe: komunikat, nic nie usunięte`, /Nic nie zostało usunięte/.test(err) && !(await go.isDisabled()) && (await p.evaluate(() => localStorage.getItem("bm-progress-x"))) === "{}", err);
  ok(`${w} B: zapytanie z wpisanym e-mailem i tokenem`, zapytania[0]?.body?.email === "Student@X.pl" && /^Bearer /.test(zapytania[0]?.auth || ""), zapytania);
  // C: sukces
  odp = { status: 200, body: { ok: true, anulowane: 1, zostalo: 0 } };
  await go.click(); await p.waitForTimeout(1500);
  const done = await p.locator("main").innerText();
  const left = await p.evaluate(() => Object.keys(localStorage).filter((k) => /^(bm-|skrot|sb-)/.test(k)));
  ok(`${w} C: „Konto usunięte”`, /Konto usunięte/.test(done), done.slice(0, 300));
  // bm-visit to sam czas ostatniej wizyty (napis „nowe od ostatniej wizyty”), strona zapisuje go od razu na nowo
  ok(`${w} C: dane przeglądarki wyczyszczone, język zostaje`, left.filter((k) => k !== "bm-visit").join() === "skrot-lang", left);
  await shot(p, `uk-${w}-usuniete`);
  ok(`${w} bez błędów w konsoli`, !p.errors.length, p.errors);
  await p.context().close();
}
// D: starosta i EN
{
  const p = await page(b, { konto: "starosta" });
  await p.goto(BASE + "index.html#/usunKonto"); await p.waitForTimeout(2500);
  const t = await p.locator("main").innerText();
  ok("D: administrator: „usuwa się ręcznie”, bez formularza", /Konto administratora usuwa się ręcznie/.test(t) && !(await p.locator("#uk-email").count()), t.slice(0, 300));
  await p.context().close();
}
{
  const p = await page(b, { konto: "platne", lang: "en" });
  await p.goto(BASE + "index.html#/usunKonto"); await p.waitForTimeout(2500);
  const t = await p.locator("main").innerText();
  ok("D: EN: ekran po angielsku", /What will be deleted/.test(t) && /Delete my account for good/.test(t) && /Type your email address \(student@x\.pl\) to confirm/.test(t) && !/[ąęłśżźćń]/.test(t.replace(/Skrót/g, "")), t.slice(0, 700));
  await shot(p, "uk-375-en");
  ok("D: EN bez błędów", !p.errors.length, p.errors);
  await p.context().close();
}
await b.close();
for (const w of wyniki) console.log(w.join(" "));
console.log(`${wyniki.filter((w) => w[0] === "✓").length}/${wyniki.length}`);
