// Lista oczekujących (zapisy.js): sprawdzanie formularza, linki z maila, źródło, grupowanie kierunków, wywołania funkcji.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const Z = require("../zapisy.js");

test("sprawdz: e-mail, kierunek z listy albo wpisany, zgoda", () => {
  assert.equal(Z.sprawdz({ email: "zly", kierunek_id: "wefiz-ek-1-st", zgoda: true }).pole, "email");
  assert.equal(Z.sprawdz({ email: "a@b.pl", zgoda: true }).pole, "kierunek");
  assert.equal(Z.sprawdz({ email: "a@b.pl", kierunek_tekst: "Prawo", zgoda: false }).pole, "zgoda");
  const ok = Z.sprawdz({ email: " Ala@X.PL ", kierunek_id: "wefiz-ek-1-st", kierunek_tekst: "też", rok: "2", stopien: 1, tryb: "st", zrodlo: "plan", zgoda: true });
  assert.deepEqual(ok.dane, { akcja: "zapisz", email: "ala@x.pl", kierunek_id: "wefiz-ek-1-st", kierunek_tekst: null, wydzial: null, stopien: 1, rok: 2, tryb: "st", zrodlo: "plan", zgoda: true, www: "" });
  const t = Z.sprawdz({ email: "a@b.pl", kierunek_id: "<script>", kierunek_tekst: "Psychologia", rok: 9, zrodlo: "Zły Napis!", zgoda: true }).dane;
  assert.equal(t.kierunek_id, null); assert.equal(t.kierunek_tekst, "Psychologia"); assert.equal(t.rok, null); assert.equal(t.zrodlo, null);
});

test("zLinku i zrodloZ", () => {
  const tok = "A".repeat(32);
  assert.deepEqual(Z.zLinku("#/zapis/potwierdz." + tok), { akcja: "potwierdz", token: tok });
  assert.deepEqual(Z.zLinku("#/zapis/usun." + tok), { akcja: "usun", token: tok });
  assert.equal(Z.zLinku("#/zapis/potwierdz.krotki"), null);
  assert.equal(Z.zLinku("#/review"), null);
  assert.equal(Z.zrodloZ("?zapisz=plan"), "plan");
  assert.equal(Z.zrodloZ("?x=1&zrodlo=ig.story"), "ig.story");
  assert.equal(Z.zrodloZ("?zapisz=<b>"), null);
});

test("grupuj: po nazwie, I i II stopień razem, A–Z po polsku, bez działających kierunków", () => {
  const g = Z.grupuj([
    { id: "wefiz-zarz-2-st", nazwa: "Zarządzanie", stopien: 2, lata: [1, 2] },
    { id: "wefiz-zarz-1-st", nazwa: "Zarządzanie", stopien: 1, lata: [1, 2, 3] },
    { id: "wefiz-bm-1-st", nazwa: "Business Management", stopien: 1, jest: true },
    { id: "wefiz-ek-1-st", nazwa: "Ekonomia", stopien: 1, lata: [1] },
    { id: "wefiz-af-2-st", nazwa: "Audyt finansowy", stopien: 2, lata: [1, 2] },
  ]);
  assert.deepEqual(g.map((x) => x.nazwa), ["Audyt finansowy", "Ekonomia", "Zarządzanie"]);
  assert.deepEqual(g[2].stopnie.map((s) => s.stopien), [1, 2]);
});

test("zapisz: wysyła sprawdzone dane do funkcji, komunikaty błędów z funkcji", async () => {
  const calls = [];
  const fake = (res) => async (url, o) => { calls.push({ url, body: JSON.parse(o.body), h: o.headers }); return { status: res.status, json: async () => res.body }; };
  const r = await Z.zapisz({ email: "a@b.pl", kierunek_tekst: "Prawo", zgoda: true }, fake({ status: 200, body: { ok: true, message: "Sprawdź skrzynkę" } }));
  assert.equal(r.message, "Sprawdź skrzynkę");
  assert.match(calls[0].url, /\/functions\/v1\/zapisz-sie$/);
  assert.equal(calls[0].body.akcja, "zapisz"); assert.ok(calls[0].h.apikey);
  await assert.rejects(Z.zapisz({ email: "a@b.pl", kierunek_tekst: "Prawo", zgoda: true }, fake({ status: 429, body: { ok: false, code: "limit", message: "Za dużo zapisów z tej sieci. Spróbuj za godzinę." } })), /Za dużo zapisów/);
  await assert.rejects(Z.zapisz({ email: "zly" }, fake({ status: 200, body: { ok: true } })), (e) => e.code === "invalid" && e.pole === "email");
  await assert.rejects(Z.zapisz({ email: "a@b.pl", kierunek_tekst: "Prawo", zgoda: true }, fake({ status: 404, body: { code: "NOT_FOUND" } })), (e) => e.code === "not_deployed");
  await assert.rejects(Z.zapisz({ email: "a@b.pl", kierunek_tekst: "Prawo", zgoda: true }, async () => { throw new TypeError("Failed to fetch"); }), (e) => e.code === "offline");
  const p = await Z.potwierdz("A".repeat(32), fake({ status: 200, body: { ok: true, first: true } }));
  assert.equal(p.first, true); assert.equal(calls.at(-1).body.akcja, "potwierdz");
  assert.deepEqual(await Z.kierunki(async () => { throw new Error("x"); }), []);
});

test("csv: średnik, BOM, cudzysłowy, ochrona przed formułami w Excelu", () => {
  const c = Z.csv([{ email: "a@x.pl", kierunek: 'Prawo; "nowy"', rok: 1, zrodlo: "=HYPERLINK(1)" }]);
  assert.ok(c.startsWith("﻿email;wydzial;kierunek;"));
  const w = c.split("\r\n")[1].split(";");
  assert.equal(w[0], "a@x.pl");
  assert.match(c, /"Prawo; ""nowy"""/);
  assert.match(c, /;'=HYPERLINK\(1\);/);
});
