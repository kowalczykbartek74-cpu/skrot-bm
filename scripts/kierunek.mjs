// Nowy kierunek z jednego pliku: kierunki/<rocznik>.json → wpis w rocznik.js, SQL z wierszem w nauka_roczniki,
// konfiguracja importera planu dla repo plan-bm i lista kontrolna dla Bartka (spec „Schemat robienia kierunków”, 3.2).
// Skrypt nie zna żadnego kierunku: wszystko bierze z pliku. Kolejny kierunek = nowy plik + te same komendy.
//
//   node scripts/kierunek.mjs kierunki/wefiz-zarz-1-st-2026.json [--plan-bm ../plan-bm]   zapisuje pliki
//   node scripts/kierunek.mjs kierunki/wefiz-zarz-1-st-2026.json --sprawdz [--plan-bm …]   tylko porównuje (nic nie zapisuje)
//
// Drugie uruchomienie bez zmian w pliku kierunku nic nie zmienia. Nic nie trafia do bazy: SQL uruchamia Bartek.
// Test: node --test tests/kierunek.test.js
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const PLAN_HOST = "https://plan.skrotbm.pl/";
const STATUSY = ["plan", "oczekujacy", "platny"];
const ROLE = ["prawne", "rachunkowe", "jeszczeProsciej"];

const blad = (m) => { throw new Error(m); };
const rokAk = (n) => n + "/" + String((n + 1) % 100).padStart(2, "0");
// ten sam slug co buildSubjects w index.html (id przedmiotu = nazwa z planu)
export const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function roczniki() {
  const p = path.join(ROOT, "rocznik.js");
  delete require.cache[p];
  return require(p);
}

// ---------- plik kierunku ----------
export function wczytaj(plik) {
  const k = JSON.parse(fs.readFileSync(plik, "utf8"));
  sprawdzPlik(k);
  return k;
}

export function sprawdzPlik(k) {
  const wk = typeof k.wydzial === "string" ? k.wydzial : k.wydzial?.kod;
  if (!/^[a-z]+-[a-z0-9]+-[012]-(st|nst)-20\d\d$/.test(k.id || "")) blad(`id „${k.id}” nie ma postaci <wydział>-<kierunek>-<stopień>-<tryb>-<nabór>`);
  if (k.kierunek_id + "-" + k.nabor !== k.id) blad(`id musi być równe kierunek_id + "-" + nabor (${k.kierunek_id}-${k.nabor})`);
  const oczek = `${String(wk).toLowerCase()}-${String(k.kierunek?.kod).toLowerCase()}-${k.stopien}-${k.tryb}`;
  if (k.kierunek_id !== oczek) blad(`kierunek_id „${k.kierunek_id}” nie pasuje do wydziału, kodu, stopnia i trybu (${oczek})`);
  if (!/^[A-Z]{2,6}$/.test(k.kierunek?.kod || "")) blad("kierunek.kod: 2–6 wielkich liter (jak nauka_kierunki.kod)");
  if (!k.kierunek.pl || !k.kierunek.en) blad("kierunek.pl i kierunek.en są wymagane");
  if (![0, 1, 2].includes(k.stopien) || !["st", "nst"].includes(k.tryb) || !["pl", "en"].includes(k.jezykZajec)) blad("stopien / tryb / jezykZajec poza zakresem");
  if (!/^[a-z0-9]{2,16}$/.test(k.prefiks || "")) blad("prefiks: 2–16 małych liter i cyfr (np. zarz26)");
  if (!STATUSY.includes(k.status)) blad(`status: jeden z ${STATUSY.join(", ")}`);
  if (!Array.isArray(k.grupy) || k.grupy.some((g) => !/^[A-Za-z0-9]{1,12}$/.test(g))) blad("grupy: lista nazw grup z planu uczelni");
  const plikPlanu = k.id === roczniki().DOMYSLNY ? "plan.json" : `plan/${k.id}.json`;
  if (k.plan?.plik !== plikPlanu) blad(`plan.plik ma być „${plikPlanu}” (ten sam adres liczą rocznik.js i v46)`);
  for (const r of Object.keys(k.role || {})) if (!ROLE.includes(r)) blad(`role.${r}: nieznana rola (są: ${ROLE.join(", ")})`);
  if (k.przedmioty) for (const r of ROLE) for (const id of k.role?.[r] || []) if (!k.przedmioty[id]) blad(`role.${r}: „${id}” nie ma w przedmioty`);
}

// ---------- 1) wpis do rocznik.js ----------
function wydzialObiekt(k, R) {
  if (typeof k.wydzial === "object") return { kod: k.wydzial.kod, pl: k.wydzial.pl, en: k.wydzial.en };
  const zn = Object.values(R.ROCZNIKI).find((r) => r.wydzial?.kod === k.wydzial);
  if (!zn) blad(`Wydziału ${k.wydzial} nie ma jeszcze w rocznik.js: podaj w pliku "wydzial": { "kod", "pl", "en" }`);
  return { kod: zn.wydzial.kod, pl: zn.wydzial.pl, en: zn.wydzial.en };
}
const jestPlik = (p) => !!p && fs.existsSync(path.join(ROOT, p));

export function wpis(k, R = roczniki()) {
  const w = wydzialObiekt(k, R), bm = k.id === R.DOMYSLNY, s = k.sylabus || {};
  const role = k.role || {};
  return {
    wydzial: w,
    kierunek: { kod: k.kierunek.kod, pl: k.kierunek.pl, en: k.kierunek.en },
    stopien: k.stopien,
    tryb: k.tryb,
    nabor: k.nabor,
    jezykZajec: k.jezykZajec,
    plan: {
      json: PLAN_HOST + k.plan.plik,
      strona: bm ? PLAN_HOST : `${PLAN_HOST}?k=${k.prefiks}`,
      skrzynka: k.plan.skrzynka || null,
    },
    // plik sylabusa dopiero, gdy jest w repo (Etap B); do tego czasu null = strona nie pobiera sylabusa
    sylabus: {
      plik: jestPlik(s.plik) ? s.plik : null,
      pojecia: jestPlik(s.pojecia) ? s.pojecia : null,
      pdf: s.pdf ? { pl: s.pdfNazwa || `Sylabusy ${w.kod} ${rokAk(k.nabor)} (PDF)`, url: s.pdf } : null,
    },
    grupy: k.grupy.slice(),
    teams: k.teams === true,
    zasadyZaliczen: k.zasadyZaliczen === true,
    przedmioty: Object.fromEntries(ROLE.map((r) => [r, (role[r] || []).slice()])),
  };
}

// zapis obiektu w stylu rocznik.js (klucze bez cudzysłowów)
function js(v) {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(js).join(", ") + "]";
  return "{ " + Object.entries(v).map(([a, b]) => (/^[A-Za-z_$][\w$]*$/.test(a) ? a : JSON.stringify(a)) + ": " + js(b)).join(", ") + " }";
}
const ZN_START = (id) => `    // KIERUNEK-START ${id}`;
const ZN_KONIEC = (id) => `    // KIERUNEK-KONIEC ${id}`;

export function blokWpisu(k, R = roczniki()) {
  const e = wpis(k, R);
  return [
    ZN_START(k.id) + ` (scripts/kierunek.mjs z kierunki/${k.id}.json; nie edytuj ręcznie: popraw plik kierunku i uruchom skrypt)`,
    `    ${JSON.stringify(k.id)}: {`,
    ...Object.entries(e).map(([a, b]) => `      ${a}: ${js(b)},`),
    "    },",
    ZN_KONIEC(k.id),
  ].join("\n");
}

export function wstawDoRocznika(src, k, R = roczniki()) {
  if (k.id === R.DOMYSLNY) blad("Wpis BM jest w rocznik.js ręcznie; skrypt go nie zmienia (test porównuje go z kierunki/wefiz-bm-1-st-2026.json).");
  const blok = blokWpisu(k, R);
  const a = src.indexOf(ZN_START(k.id)), b = src.indexOf(ZN_KONIEC(k.id));
  if (a >= 0 && b > a) return src.slice(0, a) + blok + src.slice(b + ZN_KONIEC(k.id).length);
  if (R.ROCZNIKI[k.id]) blad(`${k.id} jest już w rocznik.js bez znaczników KIERUNEK-START/KONIEC; usuń go ręcznie albo dopisz znaczniki`);
  const KON = "\n  };\n  var DOMYSLNY";
  const n = src.split(KON).length - 1;
  if (n !== 1) blad(`rocznik.js: koniec ROCZNIKI („  };” przed DOMYSLNY) znaleziony ${n} razy zamiast 1`);
  const i = src.indexOf(KON);
  return src.slice(0, i) + "\n" + blok + src.slice(i);
}

// ---------- 2) SQL ----------
const q = (s) => (s == null ? "null" : "'" + String(s).replace(/'/g, "''") + "'");

export function numerSql(k, pliki = fs.readdirSync(path.join(ROOT, "supabase"))) {
  const nr = (f) => +f.match(/^skrot-v(\d+)-/)[1];
  const mig = pliki.filter((f) => /^skrot-v\d+-.*\.sql$/.test(f));
  const moj = mig.find((f) => f.endsWith(`-${k.prefiks}.sql`));
  return moj ? nr(moj) : Math.max(...mig.map(nr)) + 1;
}

export function sql(k, numer, R = roczniki()) {
  const straznik = fs.readFileSync(path.join(ROOT, "supabase", "straznik-kodowania.sql"), "utf8").trim();
  const w = wydzialObiekt(k, R);
  return `-- Skrót v${numer}: rocznik ${k.kierunek.pl}, ${k.stopien === 0 ? "jednolite" : k.stopien + ". stopnia"}, ${k.tryb === "st" ? "stacjonarne" : "niestacjonarne"}, nabór ${k.nabor} (${k.id}).
-- Wygenerowane: node scripts/kierunek.mjs kierunki/${k.id}.json (nie edytuj ręcznie).
-- Wklej w Supabase → SQL Editor → Run, po v46. Kopiuj z github.com (przycisk „Copy raw file”), nie przez Terminal.
-- Można uruchomić ponownie. Dla BM nic się nie zmienia. Status („${k.status}”) zmieniasz potem ręcznie; ponowne uruchomienie nie cofnie go niżej.

${straznik}

-- Wydział musi już być w bazie (v31): bez niego nie wiadomo, jak go nazwać ani gdzie są komunikaty DOS.
do $$ begin
  if not exists (select 1 from public.nauka_wydzialy where kod = ${q(w.kod)}) then
    raise exception 'Brak wydziału ${w.kod} w nauka_wydzialy (uruchom najpierw v31).';
  end if;
end $$;

-- Kierunek (często już jest z listy kierunków v34; wtedy uzupełniamy tylko nazwę EN i język zajęć).
insert into public.nauka_kierunki (id, wydzial, kod, nazwa_pl, nazwa_en, stopien, tryb, jezyk)
values (${q(k.kierunek_id)}, ${q(w.kod)}, ${q(k.kierunek.kod)}, ${q(k.kierunek.pl)}, ${q(k.kierunek.en)}, ${k.stopien}, ${q(k.tryb)}, ${q(k.jezykZajec)})
on conflict (id) do update set nazwa_en = coalesce(public.nauka_kierunki.nazwa_en, excluded.nazwa_en), jezyk = excluded.jezyk;

-- Rocznik: adres planu (plan.skrotbm.pl/plan/<id>.json) wpisuje sam wyzwalacz z v46.
-- Istniejący rocznik dostaje status z pliku tylko wtedy, gdy to krok naprzód (plan → oczekujacy → platny), nigdy wstecz.
insert into public.nauka_roczniki (id, kierunek_id, nabor, status)
values (${q(k.id)}, ${q(k.kierunek_id)}, ${k.nabor}, ${q(k.status)})
on conflict (id) do update set status = excluded.status
  where array_position(array['plan', 'oczekujacy', 'platny'], public.nauka_roczniki.status)
      < array_position(array['plan', 'oczekujacy', 'platny'], excluded.status);

-- Podgląd po Run: jeden wiersz z rocznikiem, statusem i adresem planu.
select r.id, r.status, r.plan_url, k.nazwa_pl, k.nazwa_en from public.nauka_roczniki r
join public.nauka_kierunki k on k.id = r.kierunek_id where r.id = ${q(k.id)};
`;
}

export function testSql(k, numer) {
  const plan = PLAN_HOST + k.plan.plik;
  return `-- Testy dla skrot-v${numer}-${k.prefiks}.sql (wygenerowane przez scripts/kierunek.mjs, po dwóch uruchomieniach migracji).
reset role;
do $$ begin
  perform test.chk('K1 jeden rocznik ${k.id} ze statusem ${k.status}',
    (select count(*) = 1 from public.nauka_roczniki where id = ${q(k.id)} and status = ${q(k.status)}), null);
  perform test.chk('K2 adres planu wpisany sam (v46)',
    (select plan_url from public.nauka_roczniki where id = ${q(k.id)}) = ${q(plan)}, null);
  perform test.chk('K3 kierunek z nazwą PL i EN, język zajęć ${k.jezykZajec}',
    (select count(*) = 1 from public.nauka_kierunki where id = ${q(k.kierunek_id)} and nazwa_pl = ${q(k.kierunek.pl)}
       and nazwa_en is not null and jezyk = ${q(k.jezykZajec)}), (select to_jsonb(x) from public.nauka_kierunki x where id = ${q(k.kierunek_id)}));
  perform test.chk('K4 BM bez zmian (platny, plan.json)',
    (select status = 'platny' and plan_url = 'https://plan.skrotbm.pl/plan.json' from public.nauka_roczniki where id = 'wefiz-bm-1-st-2026'), null);
end $$;
-- K5: lista roczników (też bez logowania) pokazuje nowy rocznik z sekcją DOS wydziału
set role anon;
do $$ declare x jsonb; begin
  select e into x from jsonb_array_elements(public.nauka_roczniki_lista()) e where e->>'id' = ${q(k.id)};
  perform test.chk('K5 lista roczników: nowy rocznik, status, plan, DOS',
    x->>'status' = ${q(k.status)} and x->>'plan_url' = ${q(plan)} and coalesce(x->'wydzial'->>'dos_url', '') <> '', x);
end $$;
reset role;
-- K6: rocznik bez statusu „platny” nie jest do kupienia (v45), więc strona pokazuje listę oczekujących
do $$ begin
  perform test.chk('K6 do kupienia tylko przy statusie platny',
    public.nauka_rocznik_do_kupienia(${q(k.id)}) = (${q(k.status)} = 'platny'), null);
end $$;
`;
}

// supabase/test/pglite.mjs: migracja 2× i test na końcu kolejki
export function dopiszDoKolejki(src, k, numer) {
  const mig = `skrot-v${numer}-${k.prefiks}.sql`, t = `test/v${numer}.sql`;
  const wpisy = `"${mig}","${mig}","${t}"`;
  if (src.includes(wpisy)) return src;
  const m = src.match(/^const order = \[(.*)\];$/m);
  if (!m || src.split(/^const order = \[/m).length !== 2) blad("supabase/test/pglite.mjs: nie znalazłem dokładnie jednej linii „const order = […];”");
  if (m[1].includes(`"${mig}"`)) blad(`${mig} jest w kolejce PGlite w innym układzie; popraw ręcznie`);
  return src.replace(m[0], `const order = [${m[1]},${wpisy}];`);
}

// ---------- 3) konfiguracja importera planu (repo plan-bm) ----------
export function konfiguracjaPlanu(k, R = roczniki()) {
  const w = wydzialObiekt(k, R);
  const rok = +(String(k.plan.rok || "").match(/^(\d)/) || [])[1] || null;
  return {
    opis: `Wygenerowane w skrot-bm: node scripts/kierunek.mjs kierunki/${k.id}.json. Nie edytuj ręcznie.`,
    id: k.id,
    kod: k.prefiks,
    wydzial: { kod: w.kod, pl: w.pl, en: w.en },
    kierunek: { kod: k.kierunek.kod, pl: k.kierunek.pl, en: k.kierunek.en },
    stopien: k.stopien,
    tryb: k.tryb,
    nabor: k.nabor,
    rok,
    system: { nazwa: k.plan.systemNazwa, rok: k.plan.rok },
    grupy: k.grupy.slice(),
    plik: k.plan.plik,
    // odwołane zajęcia: bez Teams tylko komunikaty DOS wydziału (adres z bazy: nauka_roczniki_lista → wydzial.dos_url)
    odwolania: k.teams ? ["dos", "teams"] : ["dos"],
  };
}

// ---------- 4) lista kontrolna ----------
export function listaKontrolna(k, numer) {
  const mig = `supabase/skrot-v${numer}-${k.prefiks}.sql`;
  return `# ${k.kierunek.pl} (${k.id}): co uruchomić i sprawdzić

Wygenerowane przez \`node scripts/kierunek.mjs kierunki/${k.id}.json\`. Kolejność ma znaczenie.

1. **Plan zajęć (repo plan-bm).** Scal gałąź z konfiguracją \`kierunki/${k.id}.json\` i planem \`${k.plan.plik}\`.
   Po publikacji otwórz https://plan.skrotbm.pl/?k=${k.prefiks}: wybrany kierunek ${k.kierunek.pl}, grupy ${k.grupy.join(", ")}.
   Link dla studentów: **https://plan.skrotbm.pl/?k=${k.prefiks}**
2. **SQL v${numer}.** Otwórz \`${mig}\` na github.com → „Copy raw file” → Supabase → SQL Editor → wklej → Run.
   Na dole ma być jeden wiersz: \`${k.id}\`, status \`${k.status}\`, \`plan_url\` = ${PLAN_HOST}${k.plan.plik}.
3. **Strona (skrot-bm).** Scal gałąź z wpisem w \`rocznik.js\`. Na ekranie wejścia (okno prywatne, zdawalni.pl) jest karta
   „${k.kierunek.pl}”, w kroku 2 rok ${rokAk(k.nabor)} i grupy ${k.grupy.join(", ")}.
4. **Lista oczekujących.** Wybierz ${k.kierunek.pl} → zamiast płatności ma być zapis na listę oczekujących (status \`${k.status}\`).
   Zapis testowym mailem → Narzędzia → Lista oczekujących: wpis z kierunkiem ${k.kierunek.pl}.
5. **BM bez zmian.** Konto BM: ekran Dziś, Przedmioty i plan wyglądają jak wcześniej.

Status \`platny\` (start sprzedaży) ustawia Bartek ręcznie w Etapie F.
`;
}

// ---------- 5) --sprawdz: plik ↔ plan uczelni (i sylabus, gdy będzie) ----------
export function sprawdz(k, plan, sylabus = null) {
  const uwagi = [];
  const gr = Object.keys(plan?.groups || {}).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  if (!gr.length) uwagi.push("plan: brak grup (plik planu pusty albo nie istnieje)");
  for (const g of k.grupy) if (gr.length && !gr.includes(g)) uwagi.push(`grupa ${g} jest w pliku kierunku, a nie ma jej w planie`);
  for (const g of gr) if (!k.grupy.includes(g)) uwagi.push(`grupa ${g} jest w planie, a nie ma jej w pliku kierunku`);
  const przedm = new Map();
  for (const g of Object.values(plan?.groups || {})) for (const w of ["odd", "even"]) for (const e of g[w] || []) if (e.k !== "X") przedm.set(slug(e.pl), e.pl);
  const zPliku = Object.keys(k.przedmioty || {});
  if (gr.length) {
    for (const id of zPliku) if (!przedm.has(id)) uwagi.push(`przedmiot „${id}” jest w pliku kierunku, a nie ma go w planie`);
    for (const [id, pl] of przedm) if (!zPliku.includes(id)) uwagi.push(`przedmiot „${id}” (${pl}) jest w planie, a nie ma go w pliku kierunku`);
    for (const r of ROLE) for (const id of k.role?.[r] || []) if (!przedm.has(id)) uwagi.push(`role.${r}: „${id}” nie ma w planie`);
  }
  if (sylabus?.courses) {
    const s = new Set(sylabus.courses.map((c) => slug(c.pl || c.name || "")));
    for (const id of przedm.keys()) if (!s.has(id)) uwagi.push(`przedmiot „${id}” z planu nie ma karty w sylabusie`);
  }
  return { grupy: gr, przedmioty: [...przedm.keys()].sort(), uwagi };
}

// ---------- uruchomienie ----------
function zapisz(p, tresc) {
  const stara = fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null;
  if (stara === tresc) return false;
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, tresc);
  return true;
}

async function main(argv) {
  const plik = argv.find((a) => a.endsWith(".json"));
  if (!plik) blad("Użycie: node scripts/kierunek.mjs kierunki/<rocznik>.json [--sprawdz] [--plan-bm <katalog repo plan-bm>]");
  const k = wczytaj(plik);
  const R = roczniki();
  const pi = argv.indexOf("--plan-bm");
  const planBm = pi >= 0 ? path.resolve(argv[pi + 1]) : null;

  if (argv.includes("--sprawdz")) {
    let plan = null, skad;
    if (planBm && fs.existsSync(path.join(planBm, k.plan.plik))) { skad = path.join(planBm, k.plan.plik); plan = JSON.parse(fs.readFileSync(skad, "utf8")); }
    else { skad = PLAN_HOST + k.plan.plik; const r = await fetch(skad).catch(() => null); plan = r?.ok ? await r.json() : null; }
    const syl = jestPlik(k.sylabus?.plik) ? JSON.parse(fs.readFileSync(path.join(ROOT, k.sylabus.plik), "utf8")) : null;
    const w = sprawdz(k, plan, syl);
    console.log(`Plan: ${skad}${plan ? "" : " (brak)"}\nGrupy w planie: ${w.grupy.join(", ") || "—"}\nPrzedmioty w planie: ${w.przedmioty.join(", ") || "—"}`);
    console.log(syl ? `Sylabus: ${k.sylabus.plik}` : "Sylabus: jeszcze nie ma (Etap B), porównanie z sylabusem pominięte.");
    console.log(w.uwagi.length ? "\nRozbieżności:\n- " + w.uwagi.join("\n- ") : "\nBez rozbieżności.");
    process.exitCode = w.uwagi.length ? 1 : 0;
    return;
  }

  const zmiany = [];
  const pr = path.join(ROOT, "rocznik.js");
  if (zapisz(pr, wstawDoRocznika(fs.readFileSync(pr, "utf8"), k, R))) zmiany.push("rocznik.js");
  const nr = numerSql(k);
  const ps = path.join(ROOT, "supabase", `skrot-v${nr}-${k.prefiks}.sql`);
  if (zapisz(ps, sql(k, nr, R))) zmiany.push(path.relative(ROOT, ps));
  const pt = path.join(ROOT, "supabase", "test", `v${nr}.sql`);
  if (zapisz(pt, testSql(k, nr))) zmiany.push(path.relative(ROOT, pt));
  const pk = path.join(ROOT, "supabase", "test", "pglite.mjs");
  if (zapisz(pk, dopiszDoKolejki(fs.readFileSync(pk, "utf8"), k, nr))) zmiany.push("supabase/test/pglite.mjs");
  const cel = planBm ? path.join(planBm, "kierunki", `${k.id}.json`) : path.join(ROOT, "scratch", k.prefiks, "plan-bm", "kierunki", `${k.id}.json`);
  if (zapisz(cel, JSON.stringify(konfiguracjaPlanu(k, R), null, 2) + "\n")) zmiany.push(planBm ? cel : path.relative(ROOT, cel));
  const pl = path.join(ROOT, "scratch", k.prefiks, "lista.md");
  if (zapisz(pl, listaKontrolna(k, nr))) zmiany.push(path.relative(ROOT, pl));
  console.log(zmiany.length ? "Zmienione pliki:\n- " + zmiany.join("\n- ") : "Bez zmian (wszystko jest już aktualne).");
  if (!planBm) console.log(`Konfiguracja planu jest w scratch/${k.prefiks}/plan-bm/ – podaj --plan-bm <katalog plan-bm>, żeby zapisać ją od razu w repo planu.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((e) => { console.error("BŁĄD:", e.message); process.exit(1); });
}
