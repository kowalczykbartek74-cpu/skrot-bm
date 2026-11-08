"""Szacunek kosztu Etapów D+E (treści) z mapy tematów, na sucho: nic nie wysyła i nic nie zapisuje poza scratch/.

  python3 scripts/koszt-tresci.py kierunki/<rocznik>.json [kierunki/<inny>.json …] [--tylko-egzaminy] [--json]

Dla każdego przedmiotu z scratch/<prefiks>/mapa.json (Etap C):
- K1 (kopia z banku PL albo części niezależne od języka): 0 zł.
- K2 (tłumaczenie lekcji BM, scripts/lekcje-z-bm.py): z eksportu lekcji BM (scratch/lessons/) liczy dokładnie te lekcje, które
  mapa wskazuje; bez eksportu: liczba lekcji ≈ tematy × (lekcje BM / tematy BM) i rozmiar tekstów lekcji wzorcowej.
- K3 (nowa lekcja z sylabusa): wejście = zasady + wzorzec (cache) + temat, wyjście = cała lekcja z fiszkami, quizem,
  „Prościej” i „Dlaczego?” (rozmiar wzorca) + kontrola tańszym modelem.
Ceny i modele w parametrach (--model-k2, --model-k3, --model-kontroli); wzór tokenów: znaki / 3 jak w pozostałych skryptach.
Zero nazw kierunków w kodzie.
"""
import argparse, glob, json, math, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser()
ap.add_argument("kierunki", nargs="+")
ap.add_argument("--tylko-egzaminy", action="store_true", help="tylko przedmioty z egzaminem w semestrze 1")
ap.add_argument("--model-k2", default="claude-sonnet-5-5")
ap.add_argument("--model-k3", default="claude-opus-5-5")
ap.add_argument("--model-kontroli", default="claude-haiku-5-5")
ap.add_argument("--lekcje", default=os.path.join(ROOT, "scratch", "lessons"))
ap.add_argument("--wzorzec", default=os.path.join(ROOT, "tests", "fixtures", "tresci", "prototyp-koszt-alternatywny.json"))
ap.add_argument("--lekcji-bm", type=int, default=115, help="liczba lekcji BM (do proporcji bez eksportu)")
ap.add_argument("--json", action="store_true")
a = ap.parse_args()

CENY = {"claude-haiku-5-5": (0.10, 0.50), "claude-sonnet-5-5": (2.00, 10.00), "claude-opus-5-5": (4.00, 20.00)}
BATCH, CACHE_ODCZYT = 0.5, 0.1
NIE_TEKST = {"id", "correct", "calc", "vars", "answer", "unit", "tol", "type", "sec", "conf", "simple", "pl", "img", "viz", "visual", "chart", "order", "level"}
ZASADY_K2 = 1500   # znaki promptu K2 (scripts/lekcje-z-bm.py, ZASADY)
ZASADY_K3 = len(open(os.path.join(ROOT, "docs", "lekcje-v4", "zasady.md")).read()) + 3000   # zasady v4 + polecenia generatora


def tok(znaki):
    return znaki / 3


def usd(model, wej, wyj, cache=0):
    cin, cout = CENY[model]
    return ((wej - cache) * cin + cache * cin * CACHE_ODCZYT + wyj * cout) / 1e6 * BATCH


def teksty(x):
    if isinstance(x, dict):
        return [s for k, v in x.items() if k not in NIE_TEKST for s in teksty(v)]
    if isinstance(x, list):
        return [s for v in x for s in teksty(v)]
    return [x] if isinstance(x, str) and re.search(r"[A-Za-z]{2}", x) else []


def znaki_tekstow(content):
    return len(json.dumps(teksty(content), ensure_ascii=False))


WZ = json.load(open(a.wzorzec))
WZ_TEKST, WZ_CALOSC = znaki_tekstow(WZ["content"]), len(json.dumps(WZ["content"], ensure_ascii=False))
BM_SYL = json.load(open(os.path.join(ROOT, "sylabus.json")))["courses"]
BM_TEM = sum(len(l) for c in BM_SYL if any(f["s"] == 1 for f in c["forms"]) and not c["id"].startswith("szkolenie")
             for l in c["topics"].values())
NA_TEMAT = a.lekcji_bm / BM_TEM   # lekcji BM na temat sylabusa BM

EKSPORT = {}
for f in glob.glob(os.path.join(a.lekcje, "*.json")):
    try:
        d = json.load(open(f))
        if (d.get("content") or {}).get("lesson"):
            EKSPORT[d["id"]] = d
    except Exception:
        pass


if EKSPORT:   # prawdziwy rozmiar lekcji BM zamiast wzorca z testów
    WZ_TEKST = sum(znaki_tekstow(d["content"]) for d in EKSPORT.values()) // len(EKSPORT)
    WZ_CALOSC = sum(len(json.dumps(d["content"], ensure_ascii=False)) for d in EKSPORT.values()) // len(EKSPORT)


def koszt_k2(n_lekcji, ids):
    if ids:
        zn = [znaki_tekstow(EKSPORT[i]["content"]) for i in ids]
    else:
        zn = [WZ_TEKST] * n_lekcji
    wej = sum(tok(ZASADY_K2 + z * 1.1) for z in zn)
    wyj = sum(tok(z * 1.15) for z in zn)
    return usd(a.model_k2, wej, wyj, cache=tok(ZASADY_K2) * max(len(zn) - 1, 0))


def koszt_k3(n_lekcji):
    stale = tok(ZASADY_K3 + WZ_CALOSC)                 # zasady + wzorzec w cache
    wej = n_lekcji * (stale + 400)                     # + temat, mapa przedmiotu
    wyj = n_lekcji * (tok(WZ_CALOSC) * 1.2 + 1500)    # cała lekcja (PL dłuższy) + myślenie
    k = usd(a.model_k3, wej, wyj, cache=stale * max(n_lekcji - 1, 0))
    kontrola = usd(a.model_kontroli, n_lekcji * tok(WZ_CALOSC) * 1.2, n_lekcji * 600)
    return k + kontrola


wyniki = []
for kp in a.kierunki:
    K = json.load(open(kp if os.path.isabs(kp) else os.path.join(ROOT, kp)))
    mp = os.path.join(ROOT, "scratch", K["prefiks"], "mapa.json")
    if not os.path.exists(mp):
        sys.exit(f"Brak {os.path.relpath(mp, ROOT)} – najpierw scripts/mapa-tematow.py {kp} --bez-api albo --odbierz.")
    mapa = json.load(open(mp))
    syl = {c["id"]: c for c in json.load(open(os.path.join(ROOT, K["sylabus"]["plik"])))["courses"]}
    egz = {c["id"] for c in syl.values() if any(f["s"] == 1 and f["c"] == "e" for f in c["forms"])}
    egz |= set(K.get("egzaminyBezKarty") or [])
    przedm = []
    for m in mapa:
        pid = m["przedmiot"]
        if a.tylko_egzaminy and pid not in egz:
            continue
        t = m["tematy"]
        n = {k: sum(x["koszyk"] == k for x in t) for k in ("K1", "K2", "K3")}
        ids = sorted({z for x in t if x["koszyk"] == "K2" for z in x["zrodlo"] if z in EKSPORT})
        l2 = len(ids) if ids else math.ceil(n["K2"] * NA_TEMAT)
        l3 = math.ceil(n["K3"] * NA_TEMAT)
        bank_czeka = sum(1 for x in t if x["koszyk"] == "K1" and x.get("bank", "").startswith("czeka"))
        przedm.append({"przedmiot": pid, "egzamin": pid in egz, **n, "bankCzeka": bank_czeka,
                       "lekcjeK2": l2, "lekcjeK3": l3, "usdK2": round(koszt_k2(l2, ids), 3), "usdK3": round(koszt_k3(l3), 3)})
    wyniki.append({"rocznik": K["id"], "kierunek": K["kierunek"]["pl"], "tymczasowa": any(m.get("tymczasowa") for m in mapa),
                   "przedmioty": przedm, "usd": round(sum(p["usdK2"] + p["usdK3"] for p in przedm), 2)})

if a.json:
    sys.exit(print(json.dumps(wyniki, ensure_ascii=False, indent=1)))

zrodlo = f"rozmiar ze średniej {len(EKSPORT)} lekcji BM z eksportu, ~{NA_TEMAT:.2f} lekcji na temat" if EKSPORT else f"bez eksportu: ~{NA_TEMAT:.2f} lekcji na temat, teksty jak w lekcji wzorcowej"
print(f"Na sucho, Batch −50%, cache. K2: {a.model_k2}, K3: {a.model_k3} + kontrola {a.model_kontroli}. Lekcje K2: {zrodlo}.")
for w in wyniki:
    print(f"\n{w['kierunek']} ({w['rocznik']}){' – MAPA TYMCZASOWA' if w['tymczasowa'] else ''}")
    print(f"  {'przedmiot':44} {'K1':>3} {'K2':>3} {'K3':>3}  lekcje K2/K3   $K2    $K3")
    for p in w["przedmioty"]:
        nm = p["przedmiot"] + (" (E)" if p["egzamin"] else "")
        print(f"  {nm[:44]:44} {p['K1']:>3} {p['K2']:>3} {p['K3']:>3}  {p['lekcjeK2']:>5}/{p['lekcjeK3']:<5} {p['usdK2']:>6.2f} {p['usdK3']:>6.2f}")
    print(f"  razem: ~{w['usd']:.2f} $")
if len(wyniki) > 1:
    print(f"\nŁącznie: ~{sum(w['usd'] for w in wyniki):.2f} $")
