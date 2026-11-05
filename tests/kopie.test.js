// Kopie wpisanego tekstu (kopie.js): port testów z matura-app tests/unit/draft-backup.test.ts + kolejka zapisów.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const K = require("../kopie.js");

function atrapa() {
  const m = new Map();
  return { m, get length() { return m.size; }, key: (i) => [...m.keys()][i] ?? null, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}
const T0 = Date.parse("2026-11-05T12:00:00Z");

test("parse: świeża kopia tak, starsza niż 7 dni, zły JSON i zły kształt nie", () => {
  assert.equal(K.parse(JSON.stringify({ v: "abc", at: T0 }), T0 + 1000), "abc");
  assert.equal(K.parse(JSON.stringify({ v: "abc", at: T0 }), T0 + K.TTL + 1), null);
  assert.equal(K.parse("{zle", T0), null);
  assert.equal(K.parse(JSON.stringify({ v: 3, at: T0 }), T0), null);
  assert.equal(K.parse(null, T0), null);
});

test("zapisz / wczytaj / usun pod skrot:kopia:<miejsce>:<id>; pusta wartość kasuje", () => {
  let t = T0; const st = atrapa(), k = K.utworz(st, () => t);
  k.zapisz("zgloszenie", "m1:pytanie:3", "Zła odpowiedź B");
  assert.ok(st.m.has("skrot:kopia:zgloszenie:m1:pytanie:3"));
  assert.equal(k.wczytaj("zgloszenie", "m1:pytanie:3"), "Zła odpowiedź B");
  k.zapisz("zgloszenie", "m1:pytanie:3", "   ");
  assert.equal(k.wczytaj("zgloszenie", "m1:pytanie:3"), null);
  k.zapisz("x", 1, "a"); k.usun("x", 1); assert.equal(st.m.size, 0);
});

test("stara kopia znika przy wczytaniu i przy sprzątaniu; kolejka zostaje", () => {
  let t = T0; const st = atrapa(), k = K.utworz(st, () => t);
  k.zapisz("a", 1, "stare"); k.kolejkaDodaj("nauka_rp_odpowiedz", { p_mid: "m1" });
  t = T0 + 3 * 864e5; k.zapisz("b", 2, "nowe");
  t = T0 + 8 * 864e5;
  assert.equal(k.wczytaj("a", 1), null);
  assert.equal(st.m.has("skrot:kopia:a:1"), false);
  k.zapisz("a", 9, "x"); t = T0 + 11 * 864e5; k.sprzataj();
  assert.equal(st.m.has("skrot:kopia:b:2"), false);
  assert.equal(st.m.has(K.Q_KEY), true, "sprzątanie nie rusza kolejki (ona ma własny termin)");
});

test("usunWszystkie: tylko kopie danego miejsca i prefiksu", () => {
  const st = atrapa(), k = K.utworz(st, () => T0);
  k.zapisz("test", "123:o1", "a"); k.zapisz("test", "123:o2", "b"); k.zapisz("test", "999:o1", "c"); k.zapisz("kalendarz", "nowy:co", "d");
  k.usunWszystkie("test", "123:");
  assert.deepEqual([...st.m.keys()].sort(), ["skrot:kopia:kalendarz:nowy:co", "skrot:kopia:test:999:o1"]);
});

test("brak pamięci (wyjątek przy każdym dostępie) = brak kopii, bez błędu", () => {
  const zla = { get length() { throw new Error("x"); }, key() { throw new Error("x"); }, getItem() { throw new Error("x"); }, setItem() { throw new Error("QuotaExceeded"); }, removeItem() { throw new Error("x"); } };
  const k = K.utworz(zla, () => T0);
  assert.doesNotThrow(() => { k.zapisz("a", 1, "x"); k.usun("a", 1); k.sprzataj(); k.usunWszystkie("a"); k.kolejkaDodaj("f", {}); k.kolejkaZapisz([]); });
  assert.equal(k.wczytaj("a", 1), null);
  assert.deepEqual(k.kolejka(), []);
});

test("podepnij: przywraca kopię do pola i zapisuje przy wpisywaniu", () => {
  const st = atrapa(), k = K.utworz(st, () => T0);
  const pole = () => { const h = {}; return { value: "", addEventListener: (ev, fn) => { h[ev] = fn; }, wpisz(v) { this.value = v; h.input(); } }; };
  const a = pole();
  assert.equal(k.podepnij(a, "po-notatki", "makro"), false);
  a.wpisz("Hasła z tablicy");
  const b = pole();
  assert.equal(k.podepnij(b, "po-notatki", "makro"), true);
  assert.equal(b.value, "Hasła z tablicy");
});

test("kolejka zapisów: najwyżej Q_MAX, starsze niż 7 dni odpadają", () => {
  let t = T0; const st = atrapa(), k = K.utworz(st, () => t);
  for (let i = 0; i < K.Q_MAX + 5; i++) k.kolejkaDodaj("nauka_rp_odpowiedz", { p_idx: i });
  assert.equal(k.kolejka().length, K.Q_MAX);
  assert.equal(k.kolejka()[0].args.p_idx, 5);
  t = T0 + K.TTL + 1;
  assert.equal(k.kolejka().length, 0);
});
