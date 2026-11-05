// Etap 6: lejek i retencja bez cookies (lejek.js). node --test tests/*.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const L = require("../lejek.js");

test("wejście: raz dziennie, rocznik tylko poprawny, źródło z ?z= / ?zrodlo= / ?zapisz=", () => {
  assert.equal(L.wejscie("2026-11-05", "2026-11-05", "", null), null);
  assert.deepEqual(L.wejscie("2026-11-04", "2026-11-05", "?z=ig", "wefiz-bm-1-st-2026"), { p_rocznik: "wefiz-bm-1-st-2026", p_zrodlo: "ig" });
  assert.deepEqual(L.wejscie(null, "2026-11-05", "", "bm"), { p_rocznik: null, p_zrodlo: null });
  assert.equal(L.zrodloZ("?zapisz=plan"), "plan");
  assert.equal(L.zrodloZ("?a=1&zrodlo=tiktok.reel-2"), "tiktok.reel-2");
  assert.equal(L.zrodloZ("?z=Zle!"), null);
  assert.equal(L.zrodloZ("?kod=ABC"), null);
  assert.equal(L.zrodloZ("?xz=ig"), null);
  assert.equal(L.wejscie("x", "", "", null), null);
});

test("lejek: kroki z procentem z poprzedniego i z kont, < 5 ukryte", () => {
  const k = L.kroki({ wejscia: 200, konta: 40, wybor: 30, proba: 10, zakup: 3 });
  assert.deepEqual(k.map((x) => x.klucz), ["wejscia", "konta", "wybor", "proba", "zakup"]);
  assert.equal(k[1].zPoprz, 20);
  assert.equal(k[2].zPoprz, 75);
  assert.equal(k[2].zKont, 75);
  assert.equal(k[3].zKont, 25);
  assert.equal(k[4].ukryte, true);
  assert.equal(k[4].n, null);
  assert.equal(k[4].zKont, null);
  assert.equal(k[0].zKont, null);
  const pusto = L.kroki(undefined);
  assert.ok(pusto.every((x) => x.ukryte));
});

test("powroty D1/D7/D30: grupa = konta dość stare, poniżej 5 ukryta", () => {
  const p = L.powroty({ d1: { mozliwe: 10, aktywne: 4 }, d7: { mozliwe: 4, aktywne: 4 }, d30: {} });
  assert.deepEqual(p[0], { klucz: "d1", nazwa: "Dzień 1", mozliwe: 10, aktywne: 4, pct: 40, ukryte: false });
  assert.equal(p[1].ukryte, true);
  assert.equal(p[1].pct, null);
  assert.equal(p[2].ukryte, true);
});

test("tygodnie: od najnowszego, małe ukryte", () => {
  const t = L.tygodnie([{ tydzien: "2026-10-19", osoby: 3, mediana: 2, srednio: 2 }, { tydzien: "2026-10-26", osoby: 8, mediana: 2.5, srednio: 2.4 }]);
  assert.equal(t[0].tydzien, "2026-10-26");
  assert.equal(t[0].mediana, 2.5);
  assert.equal(t[1].ukryte, true);
  assert.equal(t[1].mediana, null);
  assert.deepEqual(L.tygodnie(null), []);
});

test("czy uczy: tabela przedmiot × tydzień, „razem” pierwsze, puste komórki i ukryte grupy", () => {
  const u = L.uczy([
    { tydzien: "2026-11-02", sid: "*", osoby: 9, odp: 40, ok: 30 },
    { tydzien: "2026-11-02", sid: "zzl", osoby: 6, odp: 30, ok: 21 },
    { tydzien: "2026-11-02", sid: "owi", osoby: 3, odp: 10, ok: 9 },
    { tydzien: "2026-10-26", sid: "*", osoby: 5, odp: 10, ok: 5 },
    { tydzien: "2026-10-26", sid: "zzl", osoby: 5, odp: 10, ok: 5 },
  ]);
  assert.deepEqual(u.tygodnie, ["2026-11-02", "2026-10-26"]);
  assert.deepEqual(u.wiersze.map((w) => w.sid), ["*", "zzl", "owi"]);
  assert.equal(u.wiersze[0].komorki[0].pct, 75);
  assert.equal(u.wiersze[1].komorki[0].pct, 70);
  assert.equal(u.wiersze[2].komorki[0].ukryte, true);
  assert.equal(u.wiersze[2].komorki[0].pct, null);
  assert.equal(u.wiersze[2].komorki[1].brak, true);
  assert.equal(L.uczy([{ tydzien: "a", sid: "*", osoby: 5, odp: 1, ok: 1 }, { tydzien: "b", sid: "*", osoby: 5, odp: 1, ok: 1 }], 1).tygodnie.length, 1);
});

test("rewanże i test A/B haczyka", () => {
  assert.deepEqual(L.rewanze({ wygrane: 6, pokonane: 1, wszystkie: 8, osoby: 5 }), { ukryte: false, osoby: 5, wygrane: 6, wszystkie: 8, pokonane: 1, pct: 75 });
  assert.equal(L.rewanze({ wygrane: 1, wszystkie: 1, osoby: 1 }).pct, null);
  const a = L.ab({ haczyk: { haczyk: { bilety: 10, zdane: 8, osoby: 6, odp: 20, ok: 15, osoby_odp: 4 }, bez: { bilety: 10, zdane: 5, osoby: 5, odp: 10, ok: 5, osoby_odp: 5 } } });
  assert.equal(a[0].test, "haczyk");
  assert.deepEqual(a[0].warianty.map((v) => v.wariant), ["bez", "haczyk"]);
  const h = a[0].warianty[1];
  assert.equal(h.zdanePct, 80);
  assert.equal(h.ukryteUczy, true);
  assert.equal(h.uczyPct, null);
  assert.equal(a[0].warianty[0].uczyPct, 50);
});

test("lista oczekujących, źródła i roczniki z danych (nowy rocznik bez zmian w kodzie)", () => {
  const o = L.oczekujacy({ potwierdzone: 12, kierunki: [{ nazwa: "Ekonomia · I st.", n: 3 }, { nazwa: "Logistyka · I st.", n: 9 }], zrodla: { plan: 7, "": 5, ig: 2 } });
  assert.equal(o.potwierdzone, 12);
  assert.equal(o.kierunki[0].nazwa, "Logistyka · I st.");
  assert.equal(o.kierunki[1].ukryte, true);
  assert.deepEqual(o.zrodla.map((z) => [z.zrodlo, z.n]), [["plan", 7], ["", 5], ["ig", null]]);
  assert.equal(L.oczekujacy({ potwierdzone: 2 }).ukryte, true);
  const lista = [{ id: "wefiz-bm-1-st-2026" }, { id: "wefiz-ek-1-st-2027" }, { id: "wefiz-zarz-1-st-2027" }];
  const r = L.roczniki(lista, { "*": {}, "wefiz-bm-1-st-2026": {}, "wefiz-ek-1-st-2027": {}, "": {} });
  assert.deepEqual(r.map((x) => x.id), ["*", "wefiz-bm-1-st-2026", "wefiz-ek-1-st-2027", ""]);
  assert.deepEqual(L.roczniki(lista, {}), []);
});
