// „Dla Ciebie na dziś” (lekcja-dnia.js): wybór tematów, tryby, karta 5 min i składanie lekcji (spec etap 1).
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const LD = require("../lekcja-dnia.js");

// Pełna treść jak mediana lekcji z etapu 0 (6 sekcji, 27 ABCD, Staś, „5 minut”).
const PELNA = { sekcje: 6, check: 6, wizualizacje: 4, po: true, stas: true, haslo: 2, pojecia: 12, fiszki: 12, abcd: 27, quiz: 20, bilet: 3, recap: true, cwiczenia: 7, worked: 0, kazus: 0, atomy: 0, gen: 0, rewanze: 0 };
let nr = 0;
const T = (o = {}) => ({ id: o.id || "t" + ++nr, sid: o.sid || "a", title: o.id || "temat", p: 40, zapominanie: 0, rewanz: false, zajecia: null, nieprzeczytany: false, egzaminDni: null, poziom: "nowy", ...o, tresc: { ...PELNA, ...(o.tresc || {}) } });
const K = (o = {}) => ({ dayN: 100, teraz: 17 * 60, profil: null, hist: {}, ...o });
const typy = (l) => l.segmenty.map((s) => s.typ);
const mechy = (l) => l.segmenty.map((s) => s.mech);
const zbior = () => [T({ id: "a1", sid: "a", p: 70 }), T({ id: "a2", sid: "a", p: 60 }), T({ id: "a3", sid: "a", p: 50 }), T({ id: "b1", sid: "b", p: 55 }), T({ id: "b2", sid: "b", p: 30 }), T({ id: "c1", sid: "c", p: 20 })];
const SPOKOJNE = new Set(LD.KATALOG.filter((m) => m.energia === "spokojna" && !m.naCzas).map((m) => m.id));
const NOWE = new Set(LD.KATALOG.filter((m) => m.nowe).map((m) => m.id));

function regulyLekcji(l, { spokojnie = false } = {}) {
  const ty = typy(l);
  for (let i = 1; i < ty.length; i++) assert.notEqual(ty[i], ty[i - 1], `dwa „${ty[i]}” z rzędu: ${mechy(l).join(", ")}`);
  if (!spokojnie) assert.ok(ty.filter((x) => x === "gram").length >= 2, "≥ 2 „gram”: " + mechy(l).join(", "));
  assert.ok(ty.includes("tworze"), "≥ 1 „tworzę”: " + mechy(l).join(", "));
}

describe("punktacja tematu (4.4)", () => {
  test("wzór: p + 25 × zapominanie + 20 rewanż + 10 zajęcia − 30 dziś − 40 pominięty 2×", () => {
    const t = T({ id: "x", p: 50, zapominanie: 0.4, rewanz: true, zajecia: "jutro" });
    assert.equal(LD.wynikTematu(t, K()), 50 + 10 + 20 + 10);
    assert.equal(LD.wynikTematu(t, K({ hist: { dzis: ["x"] } })), 90 - 30);
    assert.equal(LD.wynikTematu(t, K({ hist: { pominiete: { x: 2 } } })), 90 - 40);
    assert.equal(LD.wynikTematu(t, K({ hist: { pominiete: { x: 1 } } })), 90);
    assert.equal(LD.wynikTematu({ ...t, zajecia: "wczoraj" }, K()), 80);
  });
  test("wagi są w jednym obiekcie WAGI", () => {
    const stare = LD.WAGI.rewanz;
    LD.WAGI.rewanz = 0;
    try { assert.equal(LD.wynikTematu(T({ p: 10, rewanz: true }), K()), 10); } finally { LD.WAGI.rewanz = stare; }
  });
  test("temat pominięty 2× wypada do jutra, o ile jest coś innego", () => {
    const r = LD.ulozDzien(zbior(), K({ hist: { pominiete: { a1: 2 } } }));
    assert.notEqual(r.karta.temat, "a1");
    assert.ok(!r.lekcje.some((l) => l.temat === "a1"));
  });
});

describe("dzień: karta 5 min i dwie lekcje (6.1)", () => {
  test("karta i obie lekcje mają różne tematy", () => {
    const r = LD.ulozDzien(zbior(), K());
    const ids = [r.karta.temat, ...r.lekcje.map((l) => l.temat)];
    assert.equal(r.lekcje.length, 2);
    assert.equal(new Set(ids).size, 3);
  });
  test("lekcja 2 jest z innego przedmiotu niż lekcja 1", () => {
    const r = LD.ulozDzien(zbior(), K());
    assert.notEqual(r.lekcje[0].sid, r.lekcje[1].sid);
    assert.equal(r.lekcje[1].rola, "na-zmiane");
    assert.ok(r.lekcje[1].powody.some((p) => p.k === "na-zmiane"));
  });
  test("lekcja 2 woli temat do utrwalenia (Zrobione)", () => {
    const ts = zbior(); Object.assign(ts.find((t) => t.id === "b2"), { poziom: "zrobione", p: 45 });
    const r = LD.ulozDzien(ts, K());
    assert.equal(r.lekcje[1].temat, "b2");
  });
  test("temat ćwiczony dziś spada niżej", () => {
    const a = LD.ulozDzien(zbior(), K());
    const b = LD.ulozDzien(zbior(), K({ hist: { dzis: [a.karta.temat] } }));
    assert.notEqual(b.karta.temat, a.karta.temat);
  });
  test("jeden przedmiot: lekcja 2 z tego samego, ale z innym tematem", () => {
    const r = LD.ulozDzien([T({ id: "x1" }), T({ id: "x2" }), T({ id: "x3" })], K());
    assert.equal(new Set([r.karta.temat, ...r.lekcje.map((l) => l.temat)]).size, 3);
  });
  test("brak tematów → pusto, bez błędu", () => {
    const r = LD.ulozDzien([], K());
    assert.equal(r.karta, null);
    assert.deepEqual(r.lekcje, []);
  });
  test("„Jeszcze jedna lekcja” bierze temat spoza dzisiejszych", () => {
    const r = LD.ulozDzien(zbior(), K());
    const dzis = [r.karta.temat, ...r.lekcje.map((l) => l.temat)];
    const x = LD.jeszczeJedna(zbior(), K({ hist: { dzis } }));
    assert.ok(x && !dzis.includes(x.temat));
    assert.equal(x.rola, "dodatkowa");
  });
});

describe("tryby (3)", () => {
  test("kolokwium za 2 dni → brak nowego materiału, karta i lekcje z tego przedmiotu", () => {
    const ts = [...zbior(), T({ id: "a4", sid: "a", p: 45 }), T({ id: "a5", sid: "a", p: 40 })].map((t) => (t.sid === "a" ? { ...t, egzaminDni: 2 } : t));
    ts[1].poziom = "zrobione";
    const r = LD.ulozDzien(ts, K());
    assert.equal(r.dzien.tryb, "przed-kolokwium");
    assert.equal(r.dzien.nowe, false);
    assert.equal(r.karta.sid, "a");
    assert.notEqual(r.karta.kroki[1].mech, "wyjasnienie");
    assert.equal(r.karta.ton, "warn");
    for (const l of r.lekcje) {
      assert.equal(l.sid, "a");
      assert.equal(l.nowe, false);
      assert.ok(!mechy(l).some((m) => NOWE.has(m)), mechy(l).join(", "));
    }
    assert.equal(r.lekcje[1].mieszanka, true);
    assert.ok(new Set(r.lekcje[1].segmenty.map((s) => s.temat)).size >= 2, "mieszanka: tematy przemieszane");
  });
  test("kolokwium za 6 dni → przed kolokwium z nowym materiałem, lekcja 2 z innego przedmiotu", () => {
    const ts = zbior().map((t) => (t.sid === "b" ? { ...t, egzaminDni: 6 } : t));
    const r = LD.ulozDzien(ts, K());
    assert.equal(r.dzien.tryb, "przed-kolokwium");
    assert.equal(r.dzien.nowe, true);
    assert.equal(r.karta.sid, "b");
    assert.equal(r.lekcje[0].sid, "b");
    assert.notEqual(r.lekcje[1].sid, "b");
    assert.equal(r.karta.ton, null);
  });
  test("po zajęciach: karta z tematu nieprzeczytanych zajęć", () => {
    const ts = zbior(); ts.find((t) => t.id === "c1").zajecia = "dzis"; ts.find((t) => t.id === "c1").nieprzeczytany = true;
    const r = LD.ulozDzien(ts, K());
    assert.equal(r.dzien.tryb, "po-zajeciach");
    assert.equal(r.karta.temat, "c1");
    assert.equal(r.karta.kroki[1].zrodlo, "po");
  });
  test("przed zajęciami: zapowiedź tematu jutrzejszych zajęć", () => {
    const ts = zbior(); ts.find((t) => t.id === "b2").zajecia = "jutro";
    const r = LD.ulozDzien(ts, K());
    assert.equal(r.dzien.tryb, "przed-zajeciami");
    assert.equal(r.karta.temat, "b2");
  });
  test("brak terminów → utrwalanie", () => {
    assert.equal(LD.ulozDzien(zbior(), K()).dzien.tryb, "utrwalanie");
  });
  test("seria nieudanych dni → lekko, bez nowego", () => {
    const r = LD.ulozDzien(zbior(), K({ nieudaneDni: 3 }));
    assert.equal(r.dzien.tryb, "lekko");
    assert.equal(r.karta.ton, "calm");
    assert.equal(r.dzien.nowe, false);
  });
  test("karta: rozgrzewka z rewanżu, a bez niego z fiszek; sprawdzenie z „Pewny / Zgaduję”", () => {
    const a = LD.ulozDzien(zbior(), K({ rewanzeDzis: 3 }));
    assert.equal(a.karta.kroki[0].mech, "rewanze");
    const b = LD.ulozDzien(zbior(), K());
    assert.equal(b.karta.kroki[0].mech, "fiszki");
    assert.deepEqual(b.karta.kroki.map((x) => x.min), [1, 3, 1]);
    assert.equal(b.karta.kroki[2].pewnosc, true);
    assert.equal(b.karta.min, 5);
  });
});

describe("profil nauki (4.3)", () => {
  test("brak profilu → domyślne: lekcja 20 min, gra co 5 min", () => {
    const r = LD.ulozDzien(zbior(), K());
    assert.equal(r.bezProfilu, true);
    assert.equal(r.dlugosc, 20);
    assert.equal(r.graCo, 5);
    for (const l of r.lekcje) { assert.equal(l.min, 20); assert.ok(l.szac >= 15 && l.szac <= 21, "szac " + l.szac); regulyLekcji(l); }
  });
  test("długość z bloku skupienia: 15 / 20 / 25", () => {
    assert.equal(LD.dlugoscLekcji({ blockMinutes: 10 }), 15);
    assert.equal(LD.dlugoscLekcji({ blockMinutes: 20 }), 20);
    assert.equal(LD.dlugoscLekcji({ blockMinutes: 40 }), 25);
  });
  test("3× z rzędu przed czasem → krótsze lekcje", () => {
    assert.equal(LD.dlugoscLekcji(null, { przedCzasem: 3 }), 15);
    assert.equal(LD.dlugoscLekcji({ blockMinutes: 40 }, { przedCzasem: 3 }), 20);
    assert.equal(LD.dlugoscLekcji(null, { przedCzasem: 2 }), 20);
  });
  test("krótkie skupienie → gra co ~4 min, długie → co ~7", () => {
    assert.equal(LD.graCo({ blockMinutes: 12 }), 4);
    assert.equal(LD.graCo({ blockMinutes: 35 }), 7);
    const krotko = LD.ulozLekcje([T()], { min: 20, graCo: 4 }, K());
    const dlugo = LD.ulozLekcje([T()], { min: 20, graCo: 7 }, K());
    const gry = (l) => l.segmenty.filter((s) => s.typ === "gram");
    assert.ok(gry(krotko)[1].od < gry(dlugo)[1].od, "pierwsza gra-przerwa wcześniej: " + `${mechy(krotko)} / ${mechy(dlugo)}`);
    // Między grami najwyżej graCo + jeden segment.
    const g = gry(krotko).map((s) => s.od);
    for (let i = 1; i < g.length; i++) assert.ok(g[i] - g[i - 1] <= 4 + 3.5, "odstęp " + (g[i] - g[i - 1]));
    regulyLekcji(krotko); regulyLekcji(dlugo);
  });
  test("stres → tylko spokojne mechaniki, bez Drabiny na czas i bez rankingu", () => {
    const r = LD.ulozDzien(zbior(), K({ profil: { stressHigh: true, motivations: ["rywalizacja"] } }));
    for (const l of r.lekcje) {
      assert.ok(mechy(l).every((m) => SPOKOJNE.has(m)), mechy(l).join(", "));
      assert.equal(l.final, "bilet");
      assert.equal(l.podsumowanie.ranking, false);
      regulyLekcji(l, { spokojnie: true });
    }
  });
  test("godzinę przed snem → lekcja 2 „Przed snem”, spokojna i bez nowego", () => {
    const r = LD.ulozDzien(zbior(), K({ teraz: 22 * 60 + 15, profil: { bedtime: "23:00" } }));
    assert.equal(r.dzien.przedSnem, true);
    assert.equal(r.lekcje[1].tryb, "przed-snem");
    assert.equal(r.lekcje[1].nowe, false);
    assert.ok(mechy(r.lekcje[1]).every((m) => SPOKOJNE.has(m)), mechy(r.lekcje[1]).join(", "));
    assert.equal(r.lekcje[0].nowe, false, "D6: na godzinę przed snem tylko powtórki");
    assert.ok(r.karta.powody.some((p) => p.k === "przed-snem"));
  });
  test("po godzinie snu dalej „przed snem”, po południu nie", () => {
    assert.equal(LD.doSnu({ bedtime: "23:00" }, 23 * 60 + 40), 0);
    assert.equal(LD.doSnu({ bedtime: "00:30" }, 23 * 60 + 50), 40);
    assert.equal(LD.ulozDzien(zbior(), K({ teraz: 16 * 60, profil: { bedtime: "23:00" } })).dzien.przedSnem, false);
  });
  test("motywacja: rywalizacja → Drabina i ranking, spokój → bilet, bez liczb i czasu", () => {
    const a = LD.ulozLekcje([T()], {}, K({ profil: { motivations: ["rywalizacja"] } }));
    assert.equal(a.final, "drabina"); assert.equal(a.podsumowanie.ranking, true);
    const b = LD.ulozLekcje([T()], {}, K({ profil: { motivations: ["spokoj"] } }));
    assert.equal(b.final, "bilet"); assert.equal(b.podsumowanie.liczby, false); assert.equal(b.podsumowanie.czas, false);
  });
});

describe("składanie lekcji (6.3)", () => {
  test("rytm: haczyk na start, finał na koniec, nigdy dwa takie same typy z rzędu", () => {
    for (const min of [15, 20, 25]) for (const co of [4, 5, 7]) {
      const l = LD.ulozLekcje([T(), T(), T()], { min, graCo: co }, K());
      assert.equal(l.segmenty[0].typ, "gram");
      assert.ok(["drabina", "bilet"].includes(l.segmenty.at(-1).mech));
      regulyLekcji(l);
      assert.ok(l.szac <= min + 1, `${min}/${co}: szac ${l.szac}`);
      assert.ok(l.szac >= min - 5, `${min}/${co}: za krótka ${l.szac}`);
    }
  });
  test("brak Stasia → zastępstwo tego samego typu (sprawdzam)", () => {
    const z = LD.ulozLekcje([T()], {}, K());
    assert.ok(mechy(z).includes("stas"));
    const bez = LD.ulozLekcje([T({ tresc: { stas: false } })], {}, K());
    assert.ok(!mechy(bez).includes("stas"));
    assert.ok(mechy(bez).includes("pytania"), mechy(bez).join(", "));
    regulyLekcji(bez);
  });
  test("bez atomów i gen nie ma Rozróżnij ani karty liczbowej (etap 0)", () => {
    const l = LD.ulozLekcje([T()], {}, K());
    assert.ok(!mechy(l).includes("rozroznij") && !mechy(l).includes("liczbowa"));
    const z = LD.ulozLekcje([T({ tresc: { stas: false, atomy: 4 } })], {}, K());
    assert.ok(mechy(z).includes("rozroznij"));
  });
  test("przedmiot ilościowy: „tworzę” = zadanie krok po kroku z opcją zdjęcia", () => {
    const l = LD.ulozLekcje([T({ ilosciowy: true, tresc: { worked: 3, stas: false } })], { ilosciowy: true }, K());
    const z = l.segmenty.find((s) => s.typ === "tworze");
    assert.equal(z.mech, "zadanie");
    assert.deepEqual(z.opcje, ["zdjecie"]);
  });
  test("bez słowa na Hasło haczykiem są Pary", () => {
    assert.equal(LD.ulozLekcje([T()], {}, K()).segmenty[0].mech, "haslo");
    assert.equal(LD.ulozLekcje([T({ tresc: { haslo: 0 } })], {}, K()).segmenty[0].mech, "pary");
  });
  test("gra w lekcji: limit 90 s; Drabina 6 szczebli", () => {
    const l = LD.ulozLekcje([T({ tresc: { haslo: 0 } })], {}, K());
    for (const s of l.segmenty.filter((x) => x.mech === "frun" || x.mech === "przejdz" || x.mech === "pary")) assert.equal(s.limitSec, 90);
    assert.equal(l.segmenty.at(-1).szczeble, 6);
  });
  test("gry na zmianę: Fruń, potem Przejdź", () => {
    const l = LD.ulozLekcje([T()], { min: 25, graCo: 4 }, K());
    const g = l.segmenty.filter((s) => s.mech === "frun" || s.mech === "przejdz").map((s) => s.mech);
    assert.ok(g.length >= 2, g.join(","));
    assert.deepEqual(g.slice(0, 2), ["frun", "przejdz"]);
  });
  test("rewanże z tematu po grze-przerwie, nigdy przed „sprawdzam”", () => {
    const l = LD.ulozLekcje([T({ tresc: { rewanze: 2 } })], {}, K());
    const i = mechy(l).indexOf("rewanze");
    assert.ok(i > 0, mechy(l).join(", "));
    assert.equal(l.segmenty[i - 1].typ, "gram");
    regulyLekcji(l);
  });
  test("za mało treści → dokłada pokrewny temat tego samego przedmiotu", () => {
    const maly = T({ id: "maly", tresc: { sekcje: 1, po: false, recap: false, stas: false, quiz: 0, cwiczenia: 0 } });
    const brat = T({ id: "brat" });
    const sam = LD.ulozLekcje([maly], { min: 20 }, K());
    const z = LD.ulozLekcje([maly, brat], { min: 20 }, K());
    assert.ok(z.segmenty.some((s) => s.temat === "brat"), mechy(z).join(", "));
    assert.ok(z.szac > sam.szac);
    const dzien = LD.ulozDzien([maly, brat, T({ id: "inny", sid: "b" }), T({ id: "k", sid: "c", p: 99 })], K());
    const l1 = dzien.lekcje.find((l) => l.temat === "maly");
    if (l1) assert.ok(l1.tematy.includes("brat"));
  });
  test("tryb „w drodze”: bez pisania i bez gier na czas", () => {
    const l = LD.ulozLekcje([T()], { wDrodze: true }, K());
    for (const s of l.segmenty) { const m = LD.MECH[s.mech]; assert.ok(!m.pisanie && !m.naCzas, s.mech); }
  });
  test("„uczę się” bierze kolejne sekcje od pierwszej nieprzerobionej", () => {
    const l = LD.ulozLekcje([T({ sekcjaOd: 2 })], {}, K());
    assert.deepEqual(l.segmenty.filter((s) => s.mech === "wyjasnienie").map((s) => s.sekcja), [2, 3]);
  });
  test("Boss aktywny → dopisek w finale", () => {
    assert.equal(LD.ulozLekcje([T({ boss: true })], {}, K()).boss, true);
  });
});

describe("uczenie się z aktywności (6.4)", () => {
  const por = (d) => ({ d, stan: "porzucona" });
  test("mechanika porzucona 3× znika na tydzień", () => {
    const hist = { mech: { stas: [por(95), por(97), por(99)] } };
    const l = LD.ulozLekcje([T()], {}, K({ dayN: 100, hist }));
    assert.ok(!mechy(l).includes("stas"), mechy(l).join(", "));
    assert.ok(mechy(l).includes("pytania"), "zastępstwo tego samego typu");
    const poTygodniu = LD.ulozLekcje([T()], {}, K({ dayN: 106, hist }));
    assert.ok(mechy(poTygodniu).includes("stas"));
  });
  test("ukończenie zeruje licznik porzuceń", () => {
    assert.equal(LD.zablokowana("stas", { mech: { stas: [por(95), por(96), { d: 97, stan: "ukonczona" }, por(98)] } }, 100), false);
  });
  test("„sprawdzam” i „tworzę” nie znikają całkiem: gdy wszystkie formy porzucone, zostaje jedna", () => {
    const p3 = [por(97), por(98), por(99)];
    const hist = { mech: { wyjasnij: p3, cwiczenie: p3, zadanie: p3, kazus: p3 } };
    const l = LD.ulozLekcje([T()], {}, K({ hist }));
    assert.ok(typy(l).includes("tworze"));
  });
  test("porzucana gra wypada, zastępuje ją inna gra", () => {
    const l = LD.ulozLekcje([T()], {}, K({ hist: { mech: { frun: [por(97), por(98), por(99)] } } }));
    assert.ok(!mechy(l).includes("frun"));
    assert.ok(mechy(l).includes("przejdz"));
  });
  test("nowość: mechanika z obu ostatnich lekcji ma niższy priorytet", () => {
    const l = LD.ulozLekcje([T()], {}, K({ hist: { ostatnieLekcje: [["frun"], ["frun"]] } }));
    assert.equal(l.segmenty.find((s) => s.mech === "frun" || s.mech === "przejdz").mech, "przejdz");
  });
  test("lubiana (ukończona z dobrym wynikiem) pojawia się częściej", () => {
    const ok = (d) => ({ d, stan: "ukonczona", dobrze: true });
    const l = LD.ulozLekcje([T()], {}, K({ hist: { mech: { pary: [ok(98), ok(99)] } } }));
    assert.equal(l.segmenty[0].mech, "pary");
  });
});

describe("„Dlaczego to?”", () => {
  test("2–3 powody po ludzku", () => {
    const t = T({ egzaminDni: 6, why: ["słabo w quizach"], zapominanie: 0.5 });
    const p = LD.powody(t);
    assert.ok(p.length >= 2 && p.length <= 3);
    assert.equal(LD.powodTekst(p[0]), "Zaliczenie za 6 dni");
    assert.ok(p.map(LD.powodTekst).every((s) => s && s.length > 3));
  });
});
