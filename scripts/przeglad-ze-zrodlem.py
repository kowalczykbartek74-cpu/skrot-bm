"""Przegląd wartości lekcji K2 ze źródłem (scratch/tresci-przeglad.json): oznacza „przejrzane”, gdy KAŻDA liczba wartości występuje
w liczbach lekcji BM, z której powstała lekcja (zrodlo „bm:<id>”). Reszta zostaje nieprzejrzana, do ręcznego przeglądu.
Nic poza plikiem przeglądu się nie zmienia; wartość z nową liczbą (nieobecną w BM) nigdy nie jest oznaczana.

  python3 scripts/przeglad-ze-zrodlem.py <katalog z lekcjami K2> [--lekcje scratch/lessons] [--przeglad scratch/tresci-przeglad.json]

Kolejność: najpierw node scripts/tresci-kontrola.mjs <katalog> (tworzy przegląd), potem ten skrypt, potem kontrola --przed-wgraniem.
"""
import argparse, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser()
ap.add_argument("katalog")
ap.add_argument("--lekcje", default=os.path.join(ROOT, "scratch", "lessons"))
ap.add_argument("--przeglad", default=os.path.join(ROOT, "scratch", "tresci-przeglad.json"))
a = ap.parse_args()

LICZBA = re.compile(r"\d+(?:[.,]\d+)?")


def znorm(s):
    """Bez separatorów tysięcy: spacja zwykła, nierozdzielająca, wąska i cienka (PL „1 000”, EN „20 000”), LaTeX „\\,” i „{,}”."""
    s = re.sub(r"\\[,;! ]", " ", s or "")
    s = re.sub(r"\{,\}", ",", s)
    return re.sub(r"(?<=\d)[\s\u00a0\u2009\u202f](?=\d{3}(?!\d))", "", s)


def liczby(s):
    """Liczby w jednej postaci (zbiór tekstów): przecinek dziesiętny → kropka; „1,288” może być tysiącem (EN) albo ułamkiem, więc obie postaci."""
    s = znorm(s)
    out = set()
    for x in LICZBA.findall(s):
        out.add(str(float(x.replace(",", "."))))
        out.add(str(float(x.replace(",", ""))))       # „1,288” może być tysiącem (EN) albo ułamkiem: przyjmujemy obie postaci
    return out


def teksty(x):
    if isinstance(x, dict):
        return [t for v in x.values() for t in teksty(v)]
    if isinstance(x, list):
        return [t for v in x for t in teksty(v)]
    return [x] if isinstance(x, str) else []


zrodlo = {}
for f in os.listdir(a.katalog):
    if f.endswith(".json"):
        d = json.load(open(os.path.join(a.katalog, f)))
        if (d.get("zrodlo") or "").startswith("bm:"):
            zrodlo[d["id"]] = d["zrodlo"][3:]

P = json.load(open(a.przeglad))
W = P["wartosci"] if isinstance(P["wartosci"], list) else list(P["wartosci"].values())
cache, ok, zostaje = {}, 0, 0
for w in W:
    if w.get("przejrzane"):
        continue
    bid = zrodlo.get(w.get("lekcja"))
    if not bid:
        zostaje += 1; continue
    if bid not in cache:
        pth = os.path.join(a.lekcje, bid + ".json")
        cache[bid] = liczby(" ".join(teksty(json.load(open(pth))["content"]))) if os.path.exists(pth) else None
    nums = LICZBA.findall(znorm(w.get("tekst", "")))
    if cache[bid] is not None and nums and all(str(float(x.replace(",", "."))) in cache[bid] for x in nums):
        w["przejrzane"] = True
        w["zrodlo"] = "bm:" + bid
        w["uwaga"] = "auto: wszystkie liczby występują w lekcji BM (porównanie ze źródłem), nie ocena merytoryczna"
        ok += 1
    else:
        zostaje += 1
json.dump(P, open(a.przeglad, "w"), ensure_ascii=False, indent=1)
print(f"Oznaczone ze źródłem: {ok}, do ręcznego przeglądu: {zostaje}")
