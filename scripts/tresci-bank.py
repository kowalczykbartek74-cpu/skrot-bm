"""Bank lekcji PL i kopie K1, które same się odświeżają (optymalizacja nr 9; spec „Schemat robienia kierunków”, sekcja 5).

Bank to prywatne repo zdawalni-tresci obok skrot-bm (bank/<przedmiot ogólny>/<temat>.json + bank/indeks.json). Treści nie trafiają
do publicznego skrot-bm. Kopia K1 w innym roczniku pamięta, z czego powstała:
  zrodlo      "bank:<ogólny>/<temat>" (albo "bm:<id>" z lekcje-z-bm.py k1)
  zrodloHash  odcisk źródła w chwili kopiowania
  kopiaHash   odcisk kopii w chwili kopiowania (zmiana = ktoś poprawił kopię w tym roczniku)
Odcisk = sha256 tytułu i treści lekcji (klucze posortowane), 16 znaków. Ten sam liczy lekcje-z-bm.py k1.

  python3 scripts/tresci-bank.py dodaj kierunki/<id>.json [--katalog scratch/<prefiks>/paczki] [--tylko id,id]
        zatwierdzone lekcje kierunku → bank (przedmiot ogólny z pola „bank” w pliku kierunku); drugi raz = aktualizacja
  python3 scripts/tresci-bank.py kopiuj kierunki/<id>.json
        wiersze K1 z mapy (zrodlo bank:…) → scratch/<prefiks>/paczki/<prefiks>-<temat>.json (nowe id, rocznik, odciski), 0 zł
  python3 scripts/tresci-bank.py kopiuj-k1 kierunki/<id>.json
        przedmioty K1 z polem „bank”: wszystkie lekcje przedmiotu ogólnego (cały klocek) → scratch/<prefiks>/paczki, sylRef z mapy, 0 zł
  Bank w formacie zdawalni-tresci (narz/bank.py: indeks jako lista, lekcja v4 na wierzchu) jest czytany wprost (tylko odczyt).
  python3 scripts/tresci-bank.py synchronizuj kierunki/<id>.json [--katalog <eksport lekcji rocznika>]
        źródło zmienione, kopia nietknięta → nowa kopia w scratch/<prefiks>/aktualizacja/ (paczka-lekcji.py … aktualizacja);
        zmienione oba → lista „do ręcznego scalenia”; reszta bez zmian. Źródła BM (K2): tylko lista „źródło BM zmienione”.
  python3 scripts/tresci-bank.py pochodne <zrodlo>     np. bank:podstawy-zarzadzania/funkcje-zarzadzania albo bm:pz-03-managers
Opcje: --bank <katalog banku> (domyślnie ../zdawalni-tresci/bank), --lekcje <eksport BM> (domyślnie scratch/lessons).
Nic nie idzie do bazy ani do API. Test: node --test tests/tresci-bank.test.js
"""
import argparse, copy, glob, hashlib, json, os, re, sys, unicodedata
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def odcisk(d):
    """Odcisk lekcji: tytuł + treść, niezależny od kolejności kluczy i od id/rocznika."""
    s = json.dumps({"title": d.get("title", ""), "content": d.get("content")}, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(s.encode("utf-8")).hexdigest()[:16]


def slug(s):
    s = unicodedata.normalize("NFD", (s or "").lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").replace("ł", "l")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def wczytaj_katalog(kat):
    out = {}
    for f in sorted(glob.glob(os.path.join(kat, "*.json"))):
        try:
            d = json.load(open(f))
        except Exception:
            continue
        if isinstance(d, dict) and d.get("id") and isinstance(d.get("content"), dict):
            out[d["id"]] = d
    return out


def indeks(bank):
    p = os.path.join(bank, "indeks.json")
    d = json.load(open(p)) if os.path.exists(p) else {}
    if isinstance(d, list):   # format zdawalni-tresci (narz/bank.py): lista wpisów, każdy zatwierdzony; tylko do odczytu
        return {"format": "zdawalni-tresci", "tematy": {w["id"]: {"temat": w.get("tytul") or w["id"], "plik": w["plik"], "status": "zatwierdzone",
                "zrodlo": w.get("zrodlo")} for w in d if w.get("id") and w.get("plik")}}
    d.setdefault("tematy", {})
    return d


def lekcja_banku(sciezka):
    """Lekcja z banku w formacie aplikacji {title, content, simple, why, order}. Plik w formacie zdawalni-tresci (lekcja v4 na wierzchu:
    tytul, tldr, lesson, concepts, flashcards, quiz, prosciej, pole klocek) jest zamieniany bez zmiany treści: prosciej → simple,
    quizWhy albo quiz[].dlaczego + quiz[].not → why ({items: {i: {why, example, not}}}, jak kolekcja quizWhy)."""
    d = json.load(open(sciezka))
    if isinstance(d.get("content"), dict):
        return d
    content = {"v": 2, **{k: d[k] for k in ("tldr", "lesson", "concepts", "flashcards", "quiz", "formulas") if k in d}}
    why = d.get("quizWhy")
    if not why:
        items = {}
        for i, q in enumerate(d.get("quiz") or []):
            dl = q.get("dlaczego") or {}
            if dl.get("why"):
                items[str(i)] = {"why": dl["why"], "example": dl.get("example", ""), "not": q.get("not") or []}
        why = {"items": items} if items else None
    nn = os.path.basename(sciezka)[:-5]
    out = {"title": d.get("tytul", ""), "content": content, "order": int(nn) if nn.isdigit() else None, "klocek": (d.get("klocek") or {}).get("id")}
    if d.get("prosciej"):
        out["simple"] = d["prosciej"]
    if why:
        out["why"] = why
    return out


def zapisz_indeks(bank, d):
    if d.get("format") == "zdawalni-tresci":
        sys.exit("Bank zdawalni-tresci (indeks jako lista) składa narz/bank.py w zdawalni-tresci — tu tylko odczyt.")
    os.makedirs(bank, exist_ok=True)
    json.dump(d, open(os.path.join(bank, "indeks.json"), "w"), ensure_ascii=False, indent=1, sort_keys=True)


def temat_lekcji(d, prefiks):
    """Nazwa tematu w banku: id lekcji bez prefiksu rocznika („zarz26-pz-03-managers” → „pz-03-managers”)."""
    i = d["id"]
    return slug(i[len(prefiks) + 1:] if i.startswith(prefiks + "-") else i)


def dodaj(K, kat, bank, tylko=None, dzis=None):
    lekcje = wczytaj_katalog(kat)
    ind = indeks(bank)
    dodane, pominiete = [], []
    for i, d in lekcje.items():
        if tylko and i not in tylko:
            continue
        if d.get("k2") == "do zrobienia" or d.get("rocznik_id") not in (None, K["id"]):
            pominiete.append(i); continue
        cfg = (K.get("przedmioty") or {}).get(d.get("subjectId")) or {}
        og = (cfg.get("bank") or [d.get("subjectId")])[0]
        if not og:
            pominiete.append(i); continue
        klucz = f"{og}/{temat_lekcji(d, K['prefiks'])}"
        rel = klucz + ".json"
        wpis = {k: v for k, v in d.items() if k not in ("rocznik_id", "zrodloHash", "kopiaHash")}
        wpis["id"] = klucz
        os.makedirs(os.path.join(bank, og), exist_ok=True)
        json.dump(wpis, open(os.path.join(bank, rel), "w"), ensure_ascii=False, indent=1)
        ind["tematy"][klucz] = {"temat": d.get("title") or klucz, "plik": rel, "zrodlo": f"{K['prefiks']}:{i}", "status": "zatwierdzone",
                                "zatwierdzono": dzis or date.today().isoformat(), "hash": odcisk(wpis)}
        dodane.append(klucz)
    zapisz_indeks(bank, ind)
    return dodane, pominiete


def kopiuj(K, mapa, bank, paczki):
    ind = indeks(bank)["tematy"]
    os.makedirs(paczki, exist_ok=True)
    out, brak = [], []
    for m in mapa:
        for t in m["tematy"]:
            if t.get("koszyk") != "K1":
                continue
            for z in t.get("zrodlo") or []:
                if not z.startswith("bank:"):
                    continue
                klucz = z[5:]
                w = ind.get(klucz)
                if not w or w.get("status") != "zatwierdzone":
                    brak.append(klucz); continue
                src = lekcja_banku(os.path.join(bank, w["plik"]))
                nowy = {**copy.deepcopy(src), "id": f"{K['prefiks']}-{slug(klucz.replace('/', '-') if src.get('klocek') else klucz.split('/', 1)[1])}", "subjectId": m["przedmiot"],
                        "rocznik_id": K["id"], "zrodlo": z, "zrodloHash": odcisk(src)}
                nowy.pop("k2", None)
                nowy["kopiaHash"] = odcisk(nowy)
                json.dump(nowy, open(os.path.join(paczki, nowy["id"] + ".json"), "w"), ensure_ascii=False, indent=1)
                out.append(nowy["id"])
    return sorted(set(out)), sorted(set(brak))


FORMY = {"W": "wykład", "CW": "ćwiczenia", "LAB": "laboratorium", "KON": "konwersatorium", "SEM": "seminarium"}


def kopiuj_k1(K, mapa, bank, paczki):
    """Przedmioty K1 z polem „bank”: kopia WSZYSTKICH lekcji przedmiotu ogólnego z banku (klocek = cały przedmiot), nie tylko tematów
    trafionych w mapie. sylRef: tematy sylabusa, które mapa przypisała tej lekcji („konwersatorium, tematy 1, 3”), inaczej „całość przedmiotu”."""
    ind = indeks(bank)["tematy"]
    os.makedirs(paczki, exist_ok=True)
    ref = {}
    for m in mapa or []:
        po = {}
        for t in m["tematy"]:
            po[t.get("forma") or ""] = po.get(t.get("forma") or "", 0) + 1
            for z in t.get("zrodlo") or []:
                if z.startswith("bank:"):
                    ref.setdefault((m["przedmiot"], z[5:]), []).append((t.get("forma") or "", po[t.get("forma") or ""]))
    out = []
    for pid, cfg in (K.get("przedmioty") or {}).items():
        if cfg.get("koszyk") != "K1" or not cfg.get("bank"):
            continue
        # „bank”: pierwszy wpis = cały przedmiot ogólny; dalsze = kolejne przedmioty albo pojedyncze lekcje „przedmiot/NN”
        # (np. Podstawy ekonomii = mikro + makroekonomia/01–04); numeracja lekcji ciągła w całym przedmiocie
        klucze = []
        for og in cfg["bank"]:
            wyb = sorted(k for k in ind if (k == og if "/" in og else k.split("/", 1)[0] == og) and ind[k].get("status") == "zatwierdzone")
            klucze += [k for k in wyb if k not in klucze]
        for nr, klucz in enumerate(klucze, 1):
            src = lekcja_banku(os.path.join(bank, ind[klucz]["plik"]))
            if len(cfg["bank"]) > 1:
                src["order"] = nr
            po = {}
            for f, n in ref.get((pid, klucz), []):
                po.setdefault(f, []).append(n)
            syl = " · ".join(f"{FORMY.get(f, f.lower() or 'sylabus')}, {'tematy' if len(ns) > 1 else 'temat'} {', '.join(map(str, sorted(set(ns))))}" for f, ns in po.items())
            nowy = {**copy.deepcopy(src), "id": f"{K['prefiks']}-{slug(klucz.replace('/', '-'))}", "subjectId": pid, "rocznik_id": K["id"],
                    "zrodlo": "bank:" + klucz, "zrodloHash": odcisk(src), "sylRef": syl or "całość przedmiotu"}
            nowy.pop("k2", None)
            nowy["kopiaHash"] = odcisk(nowy)
            json.dump(nowy, open(os.path.join(paczki, nowy["id"] + ".json"), "w"), ensure_ascii=False, indent=1)
            out.append((nowy["id"], pid))
    return out


def zrodlo_teraz(z, bank, bm):
    if z.startswith("bank:"):
        w = indeks(bank)["tematy"].get(z[5:])
        p = os.path.join(bank, w["plik"]) if w else None
        return lekcja_banku(p) if p and os.path.exists(p) else None
    if z.startswith("bm:"):
        return bm.get(z[3:])
    return None


def synchronizuj(K, kopie, bank, bm, cel):
    wynik = {"odswiezone": [], "konflikty": [], "bm_zmienione": [], "bez_zmian": [], "bez_odcisku": [], "brak_zrodla": []}
    for i, d in sorted(kopie.items()):
        z = d.get("zrodlo") or ""
        if not z or d.get("rocznik_id") not in (None, K["id"]):
            continue
        if not d.get("zrodloHash"):
            wynik["bez_odcisku"].append(i); continue
        src = zrodlo_teraz(z, bank, bm)
        if src is None:
            wynik["brak_zrodla"].append(i); continue
        zmiana_zrodla = odcisk(src) != d["zrodloHash"]
        zmiana_kopii = bool(d.get("kopiaHash")) and odcisk(d) != d["kopiaHash"]
        if not zmiana_zrodla:
            wynik["bez_zmian"].append(i)
        elif z.startswith("bm:"):
            wynik["bm_zmienione"].append(i)      # K2 = tłumaczenie: odświeża się ponownym k2 dla tej lekcji, nie kopią
        elif zmiana_kopii:
            wynik["konflikty"].append(i)
        else:
            nowy = {**copy.deepcopy(src), "id": i, "subjectId": d["subjectId"], "rocznik_id": K["id"], "zrodlo": z, "zrodloHash": odcisk(src)}
            nowy.pop("k2", None)
            nowy["kopiaHash"] = odcisk(nowy)
            os.makedirs(cel, exist_ok=True)
            json.dump(nowy, open(os.path.join(cel, i + ".json"), "w"), ensure_ascii=False, indent=1)
            wynik["odswiezone"].append(i)
    return wynik


def pochodne(zrodlo, korzen):
    out = []
    for f in sorted(glob.glob(os.path.join(korzen, "scratch", "*", "paczki", "*.json"))):
        try:
            d = json.load(open(f))
        except Exception:
            continue
        if d.get("zrodlo") == zrodlo:
            out.append((d.get("rocznik_id"), d.get("id"), os.path.relpath(f, korzen)))
    return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("krok", choices=["dodaj", "kopiuj", "kopiuj-k1", "synchronizuj", "pochodne"])
    ap.add_argument("cel")
    ap.add_argument("--bank", default=os.path.join(os.path.dirname(ROOT), "zdawalni-tresci", "bank"))
    ap.add_argument("--katalog", default=None)
    ap.add_argument("--lekcje", default=os.path.join(ROOT, "scratch", "lessons"))
    ap.add_argument("--tylko", default="")
    a = ap.parse_args()
    if a.krok == "pochodne":
        for r in pochodne(a.cel, ROOT):
            print(" · ".join(map(str, r)))
        sys.exit(0)
    K = json.load(open(a.cel if os.path.isabs(a.cel) else os.path.join(ROOT, a.cel)))
    OUT = os.path.join(ROOT, "scratch", K["prefiks"])
    kat = a.katalog or os.path.join(OUT, "paczki")
    if a.krok == "dodaj":
        d, p = dodaj(K, kat, a.bank, {x for x in a.tylko.split(",") if x} or None)
        print(f"Bank: {len(d)} lekcji dodanych albo zaktualizowanych w {a.bank}" + (f"; pominięte (K1 bez K2, inny rocznik): {', '.join(p)}" if p else ""))
    elif a.krok == "kopiuj":
        mp = os.path.join(OUT, "mapa.json")
        if not os.path.exists(mp):
            sys.exit("Brak mapy " + os.path.relpath(mp, ROOT) + " (Etap C).")
        mapa = json.load(open(mp))
        if any(m.get("tymczasowa") for m in mapa):
            print("Uwaga: mapa tymczasowa; K1 z banku to dopasowanie słów, sprawdź je przed wgraniem.")
        ok, brak = kopiuj(K, mapa, a.bank, os.path.join(OUT, "paczki"))
        print(f"K1 z banku: {len(ok)} lekcji → scratch/{K['prefiks']}/paczki" + (f"; bez zatwierdzonej lekcji w banku: {', '.join(brak)}" if brak else ""))
    elif a.krok == "kopiuj-k1":
        mp = os.path.join(OUT, "mapa.json")
        mapa = json.load(open(mp)) if os.path.exists(mp) else []
        ok = kopiuj_k1(K, mapa, a.bank, os.path.join(OUT, "paczki"))
        po = {}
        for _, pid in ok:
            po[pid] = po.get(pid, 0) + 1
        print(f"K1 (całe klocki z banku): {len(ok)} lekcji → scratch/{K['prefiks']}/paczki ({', '.join(f'{k}: {v}' for k, v in po.items())})")
    else:
        bm = {d["id"]: d for d in wczytaj_katalog(a.lekcje).values()}
        w = synchronizuj(K, wczytaj_katalog(kat), a.bank, bm, os.path.join(OUT, "aktualizacja"))
        print(f"Odświeżone (źródło zmienione, kopia nietknięta): {len(w['odswiezone'])} → scratch/{K['prefiks']}/aktualizacja/")
        for k, opis in [("konflikty", "Do ręcznego scalenia (zmienione źródło i kopia)"), ("bm_zmienione", "Źródło BM zmienione (powtórz k2 --tylko …)"),
                        ("bez_odcisku", "Bez odcisków (kopie sprzed tej wersji)"), ("brak_zrodla", "Brak źródła (usunięte z banku albo brak eksportu BM)")]:
            if w[k]:
                print(f"{opis}: {', '.join(w[k])}")
        print(f"Bez zmian: {len(w['bez_zmian'])}.")
        if w["odswiezone"]:
            print(f"Wgranie: python3 scripts/paczka-lekcji.py {a.cel} scratch/{K['prefiks']}/aktualizacja --nazwa aktualizacja → Panel AI → Paczka lekcji")
