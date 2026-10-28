// Etap 2 (SPEC 11.2): Ranking kierunku, pseudonim i zgoda, ustawienia w Więcej, linia na Dziś, panel starosty, rekordy na Graj.
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = [];
const ok = (nazwa, warunek, info) => { wyniki.push([warunek ? "✓" : "✗", nazwa, warunek ? "" : JSON.stringify(info)?.slice(0, 400)]); };
const calls = (p, fn) => p.evaluate((fn) => window.__rpc.filter((x) => x.fn === fn).map((x) => x.args), fn);
const go = async (p, hash, ms = 1600) => { await p.goto(BASE + "index.html#/" + hash); await p.waitForTimeout(ms); };

for (const [w, hgt] of [[390, 844], [1280, 800]]) {
  // 1. pierwsze wejście: karta pseudonimu, błędy pod polem, zapis
  {
    const p = await page(b, { w, h: hgt });
    await go(p, "ranking");
    ok(`${w}: pierwsze wejście → karta pseudonimu`, (await p.getByText("Wybierz pseudonim do rankingu").count()) === 1 && (await p.locator("#rk-vis").isChecked()));
    await shot(p, `e2-nick-${w}`);
    await p.locator("#rk-nick").fill("ab"); await p.getByRole("button", { name: "Zapisz" }).click(); await p.waitForTimeout(300);
    ok(`${w}: błąd pseudonimu pod polem`, (await p.locator("#rk-nick-err").textContent()) === "Pseudonim: od 3 do 20 znaków." && (await p.locator("#rk-nick").getAttribute("aria-describedby")).includes("rk-nick-err"));
    await p.locator("#rk-nick").fill("Zajety"); await p.getByRole("button", { name: "Zapisz" }).click(); await p.waitForTimeout(300);
    ok(`${w}: zajęty pseudonim`, (await p.locator("#rk-nick-err").textContent()) === "Ten pseudonim jest zajęty.");
    await p.locator("#rk-nick").fill("Bartek B"); await p.getByRole("button", { name: "Zapisz" }).click(); await p.waitForTimeout(700);
    const me = p.locator(".rk-row.me");
    ok(`${w}: po zapisie widoczny i podświetlony („Ty”)`, (await me.count()) === 1 && /Ty \(Bartek B\)/.test(await me.textContent()), await p.locator(".rk-list").textContent().catch(() => ""));
    await shot(p, `e2-ranking-${w}`);
    ok(`${w}: zero błędów (pseudonim)`, !p.errors.length, p.errors);
    await p.context().close();
  }
  // 2. „Nie teraz” → ukryty; „Pokaż mnie w rankingu” przywraca kartę
  {
    const p = await page(b, { w, h: hgt });
    await go(p, "ranking");
    await p.getByRole("button", { name: "Nie teraz" }).click(); await p.waitForTimeout(300);
    ok(`${w}: „Nie teraz” → ranking, ja ukryty z dopiskiem`, (await p.getByText("Jesteś ukryty – tak wyglądałoby Twoje miejsce").count()) === 1 && !(await p.locator(".rk-row.me").count()));
    await shot(p, `e2-ukryty-${w}`);
    await p.reload(); await p.waitForTimeout(1500);
    ok(`${w}: karta pseudonimu nie wraca sama`, !(await p.getByText("Wybierz pseudonim do rankingu").count()));
    await p.getByRole("button", { name: "Pokaż mnie w rankingu" }).click(); await p.waitForTimeout(300);
    ok(`${w}: „Pokaż mnie” bez pseudonimu → karta pseudonimu`, (await p.getByText("Wybierz pseudonim do rankingu").count()) === 1);
    await p.context().close();
  }
  // 3. daleko w rankingu: top 10, ⋯, sąsiedzi, remisy, „brakuje Ci”, filtry = jedno zapytanie
  {
    const p = await page(b, { w, h: hgt, ls: { "mock-rank": "daleko", "mock-nick": "Bartek B", "mock-vis": "1", "mock-stat": "1", "bm-rank-tydz:2026-10-19": "300" } });
    await go(p, "ranking");
    const rows = await p.locator(".rk-row").allTextContents();
    ok(`${w}: top 10 + ⋯ + sąsiedzi`, rows.length === 15 && (await p.locator(".rk-gap").count()) === 1, rows);
    const pos = await p.locator(".rk-pos").allTextContents();
    ok(`${w}: remis = ten sam numer`, pos[3] === "4" && pos[4] === "4", pos.slice(0, 6));
    ok(`${w}: ja podświetlony w sąsiadach`, /Ty \(Bartek B\)/.test(await p.locator(".rk-row.me").textContent()));
    const card = await p.locator(".rk-me").innerText();
    ok(`${w}: karta Ty: miejsce, lepiej niż, +N, brakuje`, /#14/.test(card) && /z 41/.test(card) && /Lepiej niż 68% osób z rankingu/.test(card) && /\+50 pkt od zeszłego tygodnia/.test(card) && /Do #13 brakuje Ci 20 pkt – to 2 dobre odpowiedzi\./.test(card), card);
    ok(`${w}: statystyki: paski i „Ty X%”`, (await p.locator(".rk-stat").count()) === 2 && /Ty 80% · lepiej niż 61%/.test(await p.locator(".rk-stats").innerText()));
    ok(`${w}: najtrudniejsze: tylko materiały obecne lokalnie`, (await p.locator(".rk-hard li").count()) === 1 && /PKB i inflacja/.test(await p.locator(".rk-hard").innerText()));
    await shot(p, `e2-daleko-${w}`);
    await p.locator(".rk-stats").scrollIntoViewIfNeeded(); await shot(p, `e2-stat-${w}`);
    const n0 = (await calls(p, "nauka_ranking")).length, prof0 = (await calls(p, "nauka_profil_moj")).length;
    await p.locator(".sk-seg button", { hasText: "Semestr" }).click(); await p.waitForTimeout(400);
    await p.locator(".rk-groups .fchip", { hasText: "C112" }).click(); await p.waitForTimeout(400);
    await p.locator(".rk-sel").selectOption("prawo"); await p.waitForTimeout(400);
    const rc = await calls(p, "nauka_ranking");
    ok(`${w}: każda zmiana filtra = jedno zapytanie`, rc.length - n0 === 3 && (await calls(p, "nauka_profil_moj")).length === prof0 && rc.at(-1).p_zakres === "semestr" && rc.at(-1).p_grupa === "C112" && rc.at(-1).p_sid === "prawo", rc.slice(n0));
    ok(`${w}: inna grupa → „Nie jesteś w tej grupie”`, /Nie jesteś w tej grupie/.test(await p.locator(".rk-me").innerText()));
    ok(`${w}: Semestr: okres od początku semestru`, /Semestr od 01\.10/.test(await p.locator(".rk-period").innerText()));
    // powrót do tego samego filtra w ciągu 30 s: bez zapytania
    await p.locator(".rk-sel").selectOption(""); await p.waitForTimeout(300); const n1 = (await calls(p, "nauka_ranking")).length;
    await p.locator(".rk-sel").selectOption("prawo"); await p.waitForTimeout(300);
    ok(`${w}: ten sam filtr w 30 s bez nowego zapytania`, (await calls(p, "nauka_ranking")).length === n1);
    ok(`${w}: zero błędów (daleko)`, !p.errors.length, p.errors);
    await p.context().close();
  }
}
// 4. brak danych, ukryty nie na liście, Więcej → ustawienia, Dziś → linia, Graj → rekordy
{
  const p = await page(b, { ls: { "mock-nick": "Bartek B", "mock-vis": "1" } });
  await go(p, "ranking");
  ok("brak statystyk → komunikat", (await p.getByText("Za mało danych w tym tygodniu.", { exact: false }).count()) === 1);
  ok("mało osób: bez „lepiej niż”", !/Lepiej niż/.test(await p.locator(".rk-me").innerText()));
  await go(p, "more");
  ok("Więcej → wiersz ustawień z opisem", /Bartek B · widoczny/.test(await p.locator(".more-row", { hasText: "Ranking: pseudonim i widoczność" }).innerText()));
  ok("Więcej → „Ranking kierunku” z miejscem", /#3 w tym tygodniu/.test(await p.locator(".more-row", { hasText: "Ranking kierunku" }).innerText()));
  await p.locator(".more-row", { hasText: "Ranking: pseudonim i widoczność" }).click(); await p.waitForTimeout(500);
  ok("okno ustawień: pseudonim, „zmiana raz na 7 dni”, przełącznik", (await p.locator("#rk-set-nick").inputValue()) === "Bartek B" && (await p.getByText("zmiana raz na 7 dni").count()) === 1 && (await p.locator('.modal [role="switch"]').getAttribute("aria-checked")) === "true");
  await shot(p, "e2-ustawienia");
  await p.locator('.modal [role="switch"]').click(); await p.locator(".modal").getByRole("button", { name: "Zapisz" }).click(); await p.waitForTimeout(500);
  const u = await calls(p, "nauka_profil_ustaw");
  ok("ustawienia: ukrycie zapisane (bez zmiany pseudonimu)", u.length === 1 && u[0].p_w_rankingu === false && u[0].p_nick === null, u);
  ok("Więcej: opis „ukryty”", /Bartek B · ukryty/.test(await p.locator(".more-row", { hasText: "Ranking: pseudonim i widoczność" }).innerText()));
  await p.context().close();
  const q = await page(b, { ls: { "mock-nick": "Bartek B", "mock-vis": "1" } });
  await go(q, "home", 1200);
  ok("Dziś: brak zapytania przed 3 s", (await calls(q, "nauka_ranking")).length === 0);
  await q.waitForTimeout(3300);
  ok("Dziś: linia z miejscem", (await q.getByText("🏆 #3 na kierunku w tym tygodniu · 90 pkt →").count()) === 1);
  await shot(q, "e2-dzis");
  for (let i = 0; i < 3; i++) { await q.evaluate(() => window.dispatchEvent(new Event("resize"))); await q.locator(".navbtn[data-key=home]").click(); await q.waitForTimeout(200); }
  ok("Dziś: ranking pobrany raz na sesję", (await calls(q, "nauka_ranking")).length === 1);
  await go(q, "gry");
  await q.waitForTimeout(400);
  ok("Graj: rekordy tygodnia", /Rekordy tygodnia \(Fruń\)/.test(await q.locator(".gry-rek").innerText().catch(() => "")) && /Ty: 27/.test(await q.locator(".gry-rek").innerText().catch(() => "")));
  ok("zero błędów (Więcej/Dziś/Graj)", !q.errors.length, q.errors);
  await q.context().close();
}
// 5. starosta: panel „Gry i ranking”, usunięcie pseudonimu; darmowe: paywall
{
  const p = await page(b, { konto: "starosta", ls: { "bm-starosta": "1" } });
  await go(p, "more");
  await p.locator(".more-row", { hasText: "Gry i ranking" }).click(); await p.waitForTimeout(500);
  ok("starosta: panel z liczbami i podejrzanymi", (await p.locator(".modal.rk-admin").count()) === 1 && /Cwaniak/.test(await p.locator(".modal").innerText()) && /12/.test(await p.locator(".modal .lp-stats").innerText()));
  await shot(p, "e2-starosta");
  p.once("dialog", (d) => d.accept());
  await p.locator(".rk-admin-nicks li", { hasText: "Brzydki" }).getByRole("button", { name: "Usuń pseudonim" }).click(); await p.waitForTimeout(700);
  ok("starosta: usunięcie pseudonimu odświeża listę", (await calls(p, "nauka_admin_nick_usun")).length === 1 && !(await p.locator(".rk-admin-nicks li", { hasText: "Brzydki" }).count()));
  ok("starosta: zero błędów", !p.errors.length, p.errors);
  await p.context().close();
  const f = await page(b, { konto: "darmowe" });
  await go(f, "ranking");
  ok("darmowe: paywall, bez zapytań", (await f.locator(".paywall").count()) === 1 && !(await calls(f, "nauka_ranking")).length);
  await f.context().close();
  const n = await page(b, { v13: "0" });
  await go(n, "ranking");
  ok("bez SQL v13: komunikat", (await n.getByText("Gry i ranking nie są jeszcze włączone na serwerze.").count()) === 1 && !n.errors.length, n.errors);
  await n.context().close();
}
// 6. EN
{
  const p = await page(b, { lang: "en", ls: { "mock-rank": "daleko", "mock-nick": "Bartek B", "mock-vis": "1", "mock-stat": "1" } });
  await go(p, "ranking", 2000);
  const t = (await p.locator("#main").innerText()).replace(/Bartek B|Osoba \d+|PKB i inflacja|Skrót BM/g, "");
  ok("EN: ranking bez polskich tekstów", !/[ąćęłńóśźż]|Ranking kierunku|Tydzień|Cały rok|Wszystkie|pkt rankingu|Lepiej|brakuje|Jak radzi|Najtrudniejsze|dobrych|tydz\. temu/i.test(t), t.slice(0, 900));
  await shot(p, "e2-en");
  await p.context().close();
  const q = await page(b, { lang: "en" });
  await go(q, "ranking");
  const t2 = await q.locator(".rk-nickcard").innerText();
  ok("EN: karta pseudonimu po angielsku", /Choose a ranking nickname/.test(t2) && !/[ąćęłńóśźż]|pseudonim/i.test(t2), t2);
  ok("EN: zero błędów", !p.errors.length && !q.errors.length, [p.errors, q.errors]);
  await q.context().close();
}
await b.close();
for (const w of wyniki) console.log(w.join(" "));
console.log(wyniki.filter((w) => w[0] === "✓").length + "/" + wyniki.length);
process.exit(wyniki.some((w) => w[0] === "✗") ? 1 : 0);
