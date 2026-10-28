// Etap 4 (SPEC 11.2): Przejdź – samochody, tramwaj ze światłem 1,2 s, rzeka z kłodami, wyniesienie, autoprzesuw od rzędu 10,
// bramka co 25 rzędów, swipe i strzałki/WASD, skoki nie częściej niż co 200 ms, wskrzeszenie na trawie z postojem pojazdów.
// Generator (200 seedów, BFS) sprawdza osobny test bez grafiki: przejdz-generator.mjs.
import { chromium, page, BASE, shot } from "./lib.mjs";
const b = await chromium.launch();
const wyniki = [];
const ok = (nazwa, warunek, info) => { wyniki.push([warunek ? "✓" : "✗", nazwa, warunek ? "" : JSON.stringify(info)?.slice(0, 500)]); };
const dbg = (p) => p.evaluate(() => window.SKROT_GRY?._dbg?.());
const state = (p) => p.evaluate(() => window.SKROT_GRY?._state?.()?.state);
const set = (p, o) => p.evaluate((o) => window.SKROT_GRY._set(o), o);
const row = (p, r) => p.evaluate((r) => window.SKROT_GRY._row(r), r);
const key = (p, k) => p.evaluate((k) => document.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true })), k);
const calls = (p, fn) => p.evaluate((fn) => window.__rpc.filter((x) => x.fn === fn).map((x) => x.args), fn);
const until = async (p, fn, ms = 8000) => { const t = Date.now(); while (Date.now() - t < ms) { const s = { state: await state(p), d: await dbg(p) }; if (fn(s)) return s; await p.waitForTimeout(40); } return { state: await state(p), d: await dbg(p) }; };
async function open(p) {
  await p.goto(BASE + "index.html#/gry"); await p.waitForTimeout(2000);
  await p.locator("#gra-przejdz button.primary").click();
  for (let i = 0; i < 60 && (await state(p)) !== "gra"; i++) await p.waitForTimeout(80);
}
// pierwszy rząd danego rodzaju od r0 w górę
async function find(p, kind, r0 = 4, pred = () => true) { for (let r = r0; r < r0 + 120; r++) { const x = await row(p, r); if (x?.kind === kind && pred(x)) return [r, x]; } return [null, null]; }
async function answerCorrect(p) {
  const q = await p.locator(".gry-q").textContent(); const i = +q.match(/pytanie (\d+)/)[1] - 1, corr = "ABCD"[i % 4];
  await p.locator(".gry-opt").filter({ hasText: `Odpowiedź ${corr}${i}` }).first().click();
}

// --- telefon: swipe, ruch, samochód, wskrzeszenie z postojem ---
{
  const p = await page(b, { w: 390, h: 844 });
  await open(p);
  ok("390: start „Dotknij, żeby iść”", (await p.locator(".gry-hint").textContent()) === "Dotknij, żeby iść");
  await shot(p, "e4-start-390");
  const box = await p.locator(".gry-stage").boundingBox(), cx = box.x + box.width / 2, cy = box.y + box.height * 0.6;
  // krótki tap = do przodu
  await p.mouse.move(cx, cy); await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(300);
  let d = await dbg(p);
  ok("390: tap = krok do przodu", d.pr === 1 && d.far === 1, d);
  // swipe w lewo (≥ 24 px)
  const x0 = d.px;
  await p.mouse.move(cx, cy); await p.mouse.down(); await p.mouse.move(cx - 60, cy + 4, { steps: 4 }); await p.mouse.up(); await p.waitForTimeout(300);
  d = await dbg(p);
  ok("390: swipe w lewo = krok w bok", d.px === x0 - 40 && d.pr === 1, d);
  await p.mouse.move(cx, cy); await p.mouse.down(); await p.mouse.move(cx, cy + 60, { steps: 4 }); await p.mouse.up(); await p.waitForTimeout(300);
  ok("390: swipe w dół = krok do tyłu, wynik się nie zmniejsza", (await dbg(p)).pr === 0 && (await dbg(p)).far === 1, await dbg(p));
  // samochód: stajemy przed jadącym autem
  const [rr, road] = await find(p, "ulica");
  const car = road.items[0];
  await set(p, { pr: rr, px: Math.min(340, Math.max(20, car.x + car.len / 2)), invuln: 0 });
  let s = await until(p, (s) => s.state === "pytanie", 6000);
  ok("390: potrącenie → Druga szansa z tekstem śmierci", s.state === "pytanie" && (await p.locator(".gry-death").textContent()) === "Potrącił Cię samochód", s.d);
  await shot(p, "e4-auto-390");
  await answerCorrect(p); await p.getByRole("button", { name: "Graj dalej" }).click(); await p.waitForTimeout(150);
  d = await dbg(p);
  const r0 = await row(p, d.pr);
  ok("390: wskrzeszenie na trawie, w wolnej kolumnie", ["trawa", "bramka"].includes(r0.kind) && d.pr <= rr && !r0.trees[Math.round((d.px - 20) / 40)] && d.freeze > 1.5, { d, r0 });
  const before = (await row(p, rr)).items.map((i) => i.x); await p.waitForTimeout(1200); const after = (await row(p, rr)).items.map((i) => i.x);
  ok("390: pojazdy stoją 2 s po wskrzeszeniu", JSON.stringify(before) === JSON.stringify(after), { before, after });
  await p.waitForTimeout(1200);
  ok("390: potem znów jadą", JSON.stringify((await row(p, rr)).items.map((i) => i.x)) !== JSON.stringify(after));
  ok("390: zero błędów", !p.errors.length, p.errors);
  await p.context().close();
}
// --- komputer: strzałki/WASD, limit skoków, tramwaj, rzeka, autoprzesuw, bramka ---
{
  const p = await page(b, { w: 1280, h: 800 });
  await open(p);
  await key(p, "d"); await p.waitForTimeout(250);
  let d = await dbg(p);
  ok("1280: D = w prawo", d.px === 220, d);
  await key(p, "ArrowLeft"); await p.waitForTimeout(250); await key(p, "w"); await p.waitForTimeout(250);
  d = await dbg(p);
  ok("1280: strzałka w lewo i W", d.px === 180 && d.pr === 1, d);
  // limit: skoki co ≥ 200 ms (max 5/s) mimo spamowania klawiszy
  const h0 = d.hops;
  for (let i = 0; i < 50; i++) { await key(p, i % 2 ? "ArrowLeft" : "ArrowRight"); await p.waitForTimeout(20); }
  await p.waitForTimeout(200);
  d = await dbg(p);
  ok("1280: max 5 skoków na sekundę", d.hops - h0 <= 7 && d.hops - h0 >= 4, d.hops - h0);
  // tramwaj: światło 1,2 s przed przejazdem, potem potrącenie
  const [rt] = await find(p, "tory");
  if (rt == null) ok("1280: są tory w pierwszych rzędach", false);
  else {
    await set(p, { pr: rt - 1, px: 180, invuln: 0 });
    let t = await row(p, rt), n = 0;
    while (!(t.tram.next < 1.2 && !t.tram.on) && n++ < 200) { await p.waitForTimeout(40); t = await row(p, rt); }
    ok("1280: ostrzeżenie przed tramwajem (≤ 1,2 s)", !t.tram.on && t.tram.next < 1.2, t.tram);
    await shot(p, "e4-swiatlo-1280");
    await set(p, { pr: rt, px: 180, invuln: 0 });
    const s = await until(p, (s) => s.state === "pytanie", 4000);
    ok("1280: tramwaj potrąca („Tramwaj!”)", s.state === "pytanie" && (await p.locator(".gry-death").textContent()) === "Tramwaj!", s.d);
    await shot(p, "e4-tramwaj-1280");
    await answerCorrect(p); await p.getByRole("button", { name: "Graj dalej" }).click(); await p.waitForTimeout(200);
  }
  // rzeka: kłoda niesie gracza; woda zabija; wyniesienie poza ekran zabija
  const [rw, river] = await find(p, "rzeka", 4, (x) => x.items.some((i) => i.x > 30 && i.x + i.len < 330));
  const log = river.items.find((i) => i.x > 30 && i.x + i.len < 330);
  await set(p, { pr: rw, px: log.x + log.len / 2, invuln: 0, freeze: 0, land: true });
  d = await dbg(p);
  const px0 = d.px; await p.waitForTimeout(500); const d2 = await dbg(p);
  ok("1280: na kłodzie gracz płynie z nią", d.onLog && d2.st === "gra" && Math.abs(d2.px - px0) > 10 && Math.sign(d2.px - px0) === river.dir, { d, d2 });
  await shot(p, "e4-klod-1280");
  const s1 = await until(p, (s) => s.state === "pytanie", 15000);
  ok("1280: kłoda wynosi poza ekran → „Kłoda odpłynęła za daleko”", s1.state === "pytanie" && (await p.locator(".gry-death").textContent()) === "Kłoda odpłynęła za daleko", s1.d);
  await p.locator(".gry-foot .link").click(); await p.waitForTimeout(300); // Zakończ rundę
  await p.getByRole("button", { name: "Jeszcze raz" }).click();
  for (let i = 0; i < 60 && (await state(p)) !== "gra"; i++) await p.waitForTimeout(80);
  const [rw2, river2] = await find(p, "rzeka");
  const it = river2.items.map((i) => [i.x, i.x + i.len]).sort((a, c) => a[0] - c[0]);
  let water = 20; for (let x = 20; x < 340; x += 10) if (!it.some(([a, c]) => x >= a - 4 && x <= c + 4)) { water = x; break; }
  await set(p, { pr: rw2, px: water, invuln: 0, land: true });
  let s2 = await until(p, (s) => s.state === "pytanie", 3000);
  ok("1280: woda → „Wpadłeś do Odry”", s2.state === "pytanie" && (await p.locator(".gry-death").textContent()) === "Wpadłeś do Odry", s2.d);
  await answerCorrect(p); await p.getByRole("button", { name: "Graj dalej" }).click(); await p.waitForTimeout(150);
  // autoprzesuw od rzędu 10
  const [rg] = await find(p, "trawa", 11);
  await set(p, { pr: rg, px: 180, far: rg, auto: true, invuln: 0, freeze: 0 });
  await p.waitForTimeout(600); d = await dbg(p); await p.waitForTimeout(1000); const d3 = await dbg(p);
  ok("1280: od rzędu 10 ekran sam jedzie ~0,25 rzędu/s", d3.cam - d.cam > 0.15 && d3.cam - d.cam < 0.45, [d.cam, d3.cam]);
  // bramka co 25 rzędów: pytanie bez śmierci
  const g25 = await row(p, 25);
  ok("1280: rząd 25 to bramka", g25.kind === "bramka", g25.kind);
  const asked0 = (await calls(p, "nauka_rp_odpowiedz")).length;
  await set(p, { pr: 25, px: 180, far: 25, auto: false, land: true });
  const s3 = await until(p, (s) => s.state === "pytanie", 3000);
  ok("1280: wejście na bramkę → „Bramka · pytanie za punkty”", s3.state === "pytanie" && (await p.locator(".gry-sheet .eyebrow").textContent()) === "Bramka · pytanie za punkty" && !(await p.locator(".gry-death").count()));
  await shot(p, "e4-bramka-1280");
  await p.locator(".gry-opt").first().click(); await p.waitForTimeout(200);
  const rev0 = await p.evaluate(() => window.SKROT_GRY._state().run.revives);
  await p.getByRole("button", { name: "Graj dalej" }).click(); await p.waitForTimeout(300);
  const ac = await calls(p, "nauka_rp_odpowiedz");
  ok("1280: po bramce gra toczy się dalej, rp.odp w tle (gra, run)", (await state(p)) === "gra" && (await dbg(p)).st === "gra" && ac.length === asked0 + 1 && ac.at(-1).p_zrodlo === "gra" && ac.at(-1).p_run, { st: await state(p), ac: ac.slice(asked0) });
  ok("1280: bramka nie zużywa Drugiej szansy", (await p.evaluate(() => window.SKROT_GRY._state().run.revives)) === rev0);
  // spóźnienie: stoimy, ekran ucieka
  await set(p, { auto: true, invuln: 0, freeze: 0, cam: 24.9 });
  const s4 = await until(p, (s) => s.state === "pytanie" || s.state === "wynik", 16000);
  ok("1280: gracz pod dolną krawędzią → „Spóźniłeś się na zajęcia”", ["pytanie", "wynik"].includes(s4.state) && s4.d.death === "Spóźniłeś się na zajęcia", s4.d);
  ok("1280: zero błędów", !p.errors.length, p.errors);
  await p.context().close();
}
// --- wynik do bazy, Mniej animacji, EN ---
{
  const p = await page(b, { lang: "en", ls: { "skrot-calm": "1" } });
  await p.emulateMedia({ reducedMotion: "reduce" });
  await open(p);
  ok("EN: „Tap to walk”", (await p.locator(".gry-hint").textContent()) === "Tap to walk");
  for (let i = 0; i < 3; i++) { await key(p, "ArrowUp"); await p.waitForTimeout(230); }
  const [rr, road] = await find(p, "ulica");
  await set(p, { pr: rr, px: Math.min(340, Math.max(20, road.items[0].x + road.items[0].len / 2)), invuln: 0 });
  await until(p, (s) => s.state === "pytanie", 6000);
  ok("EN: tekst śmierci po angielsku", (await p.locator(".gry-death").textContent()) === "Hit by a car");
  await p.locator(".gry-foot .link").click(); await p.waitForTimeout(400);
  const res = await p.locator(".gry-res").innerText();
  ok("EN: wynik „rows”", /rows · record/.test(res) && !/[ąćęłńóśźż]|rzędów/.test(res), res);
  const k = await calls(p, "nauka_gra_koniec");
  ok("wynik do bazy = najdalszy rząd", k.length === 1 && k[0].p_wynik === rr, k);
  ok("EN + Mniej animacji: zero błędów", !p.errors.length, p.errors);
  await shot(p, "e4-en");
  await p.context().close();
}
await b.close();
for (const w of wyniki) console.log(w.join(" "));
console.log(wyniki.filter((w) => w[0] === "✓").length + "/" + wyniki.length);
process.exit(wyniki.some((w) => w[0] === "✗") ? 1 : 0);
