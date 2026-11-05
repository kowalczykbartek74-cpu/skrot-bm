// Lista kierunków WEFiZ z publicznej strony planów (planyzajec-efz.usz.edu.pl), etap 5 „Systemy z Zdawalni w Skrócie”.
// Czyta formularz „Plan zajęć dla kierunku” (nazwy i skróty), potem dla każdego kierunku i roku (I st. 1–4, II st. 1–2)
// sprawdza, czy uczelnia ma plan. Grzecznie: najwyżej 1 zapytanie na sekundę, jeden przebieg (ok. 150 zapytań).
// Wynik: supabase/kierunki-wefiz.json (wejście do SQL v34). Uruchom raz w roku, gdy uczelnia opublikuje plany:
//   node scripts/kierunki-wefiz.mjs
import fs from "node:fs";

const BASE = process.env.PLAN_BASE_URL || "https://planyzajec-efz.usz.edu.pl/";
const UA = "skrot-bm (projekt studencki, lista kierunkow, 1 zapytanie/s)";
const LATA = [["1 rokI", 1, 1], ["2 rokI", 1, 2], ["3 rokI", 1, 3], ["4 rokI", 1, 4], ["1 rokII", 2, 1], ["2 rokII", 2, 2]];
const pauza = () => new Promise((r) => setTimeout(r, 1100));

async function get(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
      if (r.ok) return await r.text();
      if (r.status >= 300 && r.status < 500) return "";
    } catch { /* ponów */ }
    await new Promise((r) => setTimeout(r, 15000));
  }
  throw new Error("brak odpowiedzi: " + url);
}
// Kod do bazy: litery skrótu uczelni wielkimi (BIwG → BIWG, E-P → EP); jednoliterowe skróty (L, M, Z) rozszerzamy,
// bo kod w bazie ma 2–6 liter (nauka_kierunki.kod).
const ROZSZERZ = { L: "LOG", M: "MKT", Z: "ZARZ" };
const kodZ = (s) => { const k = s.replace(/[^A-Za-z]/g, "").toUpperCase(); return ROZSZERZ[k] || k; };

const start = await get(BASE + "plan");
const sel = start.slice(start.indexOf('name="Kieruek"'), start.indexOf("</select>", start.indexOf('name="Kieruek"')));
const nazwy = [...sel.matchAll(/<option[^>]*>([^<]+)<\/option>/g)].map((m) => m[1].trim());
if (nazwy.length < 5) throw new Error("Nie znalazłem listy kierunków na stronie planów (" + nazwy.length + ").");
// Rodzaj zajęć w nawiasie: BM pisze „(W)”, „(ĆW)”, „(LB)”, inne kierunki „(w)”, „(ćw)”, „(lab gr. B)”.
const zajec = (html) => (html.match(/\((w|ćw|lb|lab[^)]{0,20}|k|s|lek|proj|sem|wyk)\)/gi) || []).length;

const out = [];
for (const pelna of nazwy) {
  const m = /^(.*?)\s*\(([^)]+)\)$/.exec(pelna), nazwa = m ? m[1].trim() : pelna, skrot = m ? m[2].trim() : "";
  const lata = { 1: [], 2: [] };
  for (const [rok, stopien, n] of LATA) {
    await pauza();
    const html = await get(BASE + "planKierunek?" + new URLSearchParams({ Kieruek: pelna, rok }));
    if (zajec(html) >= 3) lata[stopien].push(n);
  }
  for (const stopien of [1, 2]) if (lata[stopien].length) out.push({ nazwa, skrot, kod: kodZ(skrot), stopien, lata: lata[stopien] });
  console.log(pelna, "→", JSON.stringify(lata));
}
const kody = new Set();
for (const k of out) { const key = k.kod + ":" + k.stopien; if (kody.has(key)) throw new Error("Powtórzony kod " + key); kody.add(key); }
const plik = new URL("../supabase/kierunki-wefiz.json", import.meta.url);
fs.writeFileSync(plik, JSON.stringify({ zrodlo: BASE + "plan", pobrano: new Date().toISOString().slice(0, 10), tryb: "st", kierunki: out }, null, 1) + "\n");
console.log(`Zapisano ${out.length} kierunków (kierunek + stopień) do supabase/kierunki-wefiz.json`);
