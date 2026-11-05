// Etap 11: panel administratora (admin.js): źródła wejść, karnety, podgląd jako. node --test tests/*.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const A = require("../admin.js");

test("źródło z adresu: ?z= ma pierwszeństwo, potem ?zrodlo= i ?zapisz=; złe napisy → null", () => {
  assert.equal(A.zrodloZ("?z=ig-zarzadzanie"), "ig-zarzadzanie");
  assert.equal(A.zrodloZ("?zapisz=plan&z=plakat-cukrowa"), "plakat-cukrowa");
  assert.equal(A.zrodloZ("?zapisz=plan"), "plan");
  assert.equal(A.zrodloZ("?a=1&zrodlo=tiktok.reel-2#/dzis"), "tiktok.reel-2");
  assert.equal(A.zrodloZ("?z=IG-Test"), "ig-test");
  assert.equal(A.zrodloZ("?z=zle!napis"), null);
  assert.equal(A.zrodloZ("?z=" + "a".repeat(41)), null);
  assert.equal(A.zrodloZ("?kod=ABC"), null);
  assert.equal(A.zrodloZ(""), null);
});

test("pierwsze źródło wizyty: zapamiętane wygrywa z nowym linkiem", () => {
  assert.equal(A.pierwszeZrodlo("ig-zarzadzanie", "?z=plakat-cukrowa"), "ig-zarzadzanie");
  assert.equal(A.pierwszeZrodlo(null, "?z=plakat-cukrowa"), "plakat-cukrowa");
  assert.equal(A.pierwszeZrodlo("zle!", "?z=plakat-cukrowa"), "plakat-cukrowa");
  assert.equal(A.pierwszeZrodlo(null, ""), null);
});

test("generator: napis → źródło ^[a-z0-9-]{2,40}$, polskie znaki i spacje", () => {
  assert.deepEqual(A.zrodloSprawdz("IG Zarządzanie"), { ok: true, zrodlo: "ig-zarzadzanie" });
  assert.deepEqual(A.zrodloSprawdz("  plakat_cukrowa  "), { ok: true, zrodlo: "plakat-cukrowa" });
  assert.equal(A.zrodloSprawdz("Plakat — Żółta ściana").zrodlo, "plakat-zolta-sciana");
  assert.equal(A.zrodloSprawdz("").ok, false);
  assert.equal(A.zrodloSprawdz("a").ok, false);
  assert.equal(A.zrodloSprawdz("x".repeat(41)).ok, false);
  assert.equal(A.zrodloSprawdz("ig.reel #2").zrodlo, "ig-reel-2"); // kropka i inne znaki → myślnik (proste linki)
  for (const t of ["ig-zarzadzanie", "plakat-cukrowa", "ab"]) assert.ok(A.RE_ZRODLO.test(A.zrodloSprawdz(t).zrodlo));
  assert.equal(A.link("https://skrotbm.pl", "ig-zarzadzanie"), "https://skrotbm.pl/?z=ig-zarzadzanie");
  assert.equal(A.link("https://skrotbm.pl/?x=1#/more", "plakat"), "https://skrotbm.pl/?z=plakat");
  assert.equal(A.link("http://127.0.0.1:8811/index.html", "ab"), "http://127.0.0.1:8811/index.html?z=ab");
});

test("Stripe client_reference_id: konto, kod i źródło; bez źródła jak dotąd", () => {
  const U = "00000000-0000-4000-8000-000000000001";
  assert.equal(A.refStripe(U, "", null), U);
  assert.equal(A.refStripe(U, "BARTEK", null), U + "__BARTEK");
  assert.equal(A.refStripe(U, "BARTEK", "ig-zarzadzanie"), U + "__BARTEK__ig-zarzadzanie");
  assert.equal(A.refStripe(U, "", "plakat"), U + "____plakat");
  assert.deepEqual((U + "____plakat").split("__"), [U, "", "plakat"]); // tak czyta webhook
  assert.equal(A.refStripe(U, "", "zle_zrodlo"), U); // „_” rozbiłoby podział
});

test("karnet: walidacja formularza i argumenty bazy", () => {
  const d = "2026-11-05";
  assert.deepEqual(A.karnetSprawdz({ email: " Ala@X.pl ", doKiedy: "2026-12-05", rocznik: "", powod: " pomoc przy testach " }, d),
    { ok: true, args: { p_email: "ala@x.pl", p_do: "2026-12-05", p_rocznik: null, p_powod: "pomoc przy testach" } });
  assert.equal(A.karnetSprawdz({ email: "ala", doKiedy: "2026-12-05", powod: "abc" }, d).pole, "email");
  assert.equal(A.karnetSprawdz({ email: "a@x.pl", doKiedy: "", powod: "abc" }, d).pole, "doKiedy");
  assert.equal(A.karnetSprawdz({ email: "a@x.pl", doKiedy: "2026-11-04", powod: "abc" }, d).pole, "doKiedy");
  assert.equal(A.karnetSprawdz({ email: "a@x.pl", doKiedy: "2027-12-11", powod: "abc" }, d).pole, "doKiedy");
  assert.equal(A.karnetSprawdz({ email: "a@x.pl", doKiedy: "2026-11-05", powod: "ab" }, d).pole, "powod");
  assert.equal(A.karnetSprawdz({ email: "a@x.pl", doKiedy: "2026-11-05", powod: "abc", rocznik: "wefiz-zarz-1-st-2026" }, d).args.p_rocznik, "wefiz-zarz-1-st-2026");
  assert.equal(A.karnetDo(d, 30), "2026-12-05");
  assert.equal(A.karnetDo("2026-12-31", 1), "2027-01-01");
});

test("karnet: komunikaty bazy, stan i kolejność listy", () => {
  assert.equal(A.karnetBlad({ code: "ma_dostep", do_kiedy: "2027-07-11" }), "Ta osoba ma już opłacony dostęp do 11.07.2027. Karnet go nie zmienia.");
  assert.match(A.karnetBlad({ code: "nie_karnet" }), /Cofnąć można tylko karnet/);
  assert.match(A.karnetBlad({ code: "???" }), /Spróbuj/);
  const d = "2026-11-05";
  assert.equal(A.karnetStan({ do_kiedy: "2026-11-05" }, d), "aktywny");
  assert.equal(A.karnetStan({ do_kiedy: "2026-11-04" }, d), "wygasl");
  assert.equal(A.karnetStan({ do_kiedy: "2026-12-01", cofniety_at: "2026-11-01T10:00:00Z" }, d), "cofniety");
  const l = A.karnetyLista([
    { email: "c@x.pl", do_kiedy: "2026-12-01", cofniety_at: "x", wydano_at: "2026-11-04" },
    { email: "w@x.pl", do_kiedy: "2026-11-01", wydano_at: "2026-10-01" },
    { email: "a1@x.pl", do_kiedy: "2026-12-01", wydano_at: "2026-11-01" },
    { email: "a2@x.pl", do_kiedy: "2026-12-01", wydano_at: "2026-11-03" },
  ], d);
  assert.deepEqual(l.map((x) => x.email), ["a2@x.pl", "a1@x.pl", "w@x.pl", "c@x.pl"]);
  assert.equal(l[2].stanTxt, "wygasł");
});

test("podgląd: zapis, odczyt, wygaśnięcie po 12 h, zły napis", () => {
  const t = Date.UTC(2026, 10, 5, 10);
  const p = A.podgladNowy("proba", "wefiz-zarz-1-st-2026", t);
  assert.deepEqual(A.podgladZ(JSON.stringify(p), t + 36e5), { tryb: "proba", rocznik: "wefiz-zarz-1-st-2026", od: t });
  assert.equal(A.podgladZ(JSON.stringify(p), t + 12 * 36e5 + 1), null);
  assert.equal(A.podgladZ("{zly", t), null);
  assert.equal(A.podgladZ(JSON.stringify({ tryb: "admin", od: t }), t), null);
  assert.equal(A.podgladNowy("x", null, t), null);
  assert.equal(A.podgladNowy("gosc", "bm", t).rocznik, null);
  assert.equal(A.podgladOpis(p, "Zarządzanie, 1. rok"), "Podgląd: Okres próbny · Zarządzanie, 1. rok");
  assert.equal(A.podgladOpis(A.podgladNowy("platny", null, t), "x"), "Podgląd: Płatny dostęp");
});

test("podgląd: konto jak gość / okres próbny / płatny; nigdy administrator", () => {
  const t = Date.UTC(2026, 10, 5, 10);
  const g = A.podgladKonto({ tryb: "gosc" }, t);
  assert.deepEqual([g.admin, g.paid, g.paidAccount, g.trialUntil, g.trialCan], [false, false, false, null, true]);
  const pr = A.podgladKonto({ tryb: "proba" }, t);
  assert.equal(pr.paid, true); assert.equal(pr.admin, false); assert.equal(pr.trialUntil, new Date(t + 3 * 864e5).toISOString());
  const pl = A.podgladKonto({ tryb: "platny" }, t, "2027-07-11");
  assert.deepEqual([pl.paid, pl.trialUntil, pl.until, pl.plan, pl.admin], [true, null, "2027-07-11", "rok", false]);
  assert.equal(A.podgladKonto(null, t), null);
});

test("podgląd: przepuszcza tylko odczyty; każdy zapis i nieznana funkcja zablokowane", () => {
  for (const fn of ["nauka_ja", "nauka_ranking", "nauka_sklep_stan", "nauka_rocznik_moj"]) assert.equal(A.zapisDozwolony(fn), true, fn);
  for (const fn of ["nauka_rp_odpowiedz", "nauka_zdarzenia_zapisz", "nauka_wejscie", "nauka_proba_start", "nauka_rocznik_ustaw", "nauka_zgoda",
    "nauka_admin_karnet_wydaj", "nauka_zrodlo_ustaw", "nauka_zalogowano", "nauka_obecny", "nauka_sklep_kup", "nowa_funkcja", "", null]) assert.equal(A.zapisDozwolony(fn), false, String(fn));
  assert.equal(A.metodaZapisu("upsert"), true); assert.equal(A.metodaZapisu("delete"), true); assert.equal(A.metodaZapisu("select"), false);
});
