"""Macierz przedmiotów wydziału (optymalizacja nr 3): które przedmioty powtarzają się na kierunkach i od czego budować bank PL.

Czyta sylabusy wszystkich roczników, które są pod ręką:
  - pliki kierunków w kierunki/*.json (sylabus w repo, np. sylabus-zarz.json, sylabus-fir.json; BM: sylabus.json),
  - sylabusy pobrane hurtem przez scripts/sylabusy-hurt.py (scratch/sylabusy/<prefiks>.json, z konfiguracji plan-bm).
Każdy przedmiot semestru trafia do przedmiotu ogólnego z kierunki/wspolne/przedmioty-ogolne.json (aliasy), a bez aliasu zostaje
sam (kolumna „bez przypisania” = kandydat na nowy alias). Dla każdego przedmiotu ogólnego: na ilu kierunkach jest, na ilu z egzaminem,
ile osób czeka na liście oczekujących tych kierunków, czy jest odpowiednik w BM (K2) i wspólne tematy (ten sam temat na wielu kierunkach
= jedna lekcja w banku). Wynik ustawia kolejność banku: najpierw to, co obsłuży najwięcej osób na egzaminach.

  python3 scripts/macierz-przedmiotow.py                                  semestr zimowy, roczniki 1. roku
  python3 scripts/macierz-przedmiotow.py --semestr letni --rok 1
  python3 scripts/macierz-przedmiotow.py --oczekujacy lista.json          eksport z Narzędzia → Lista oczekujących (JSON albo CSV)
  python3 scripts/macierz-przedmiotow.py --plan-bm ../plan-bm             nazwy kierunków z konfiguracji planu (domyślnie ../plan-bm)
Wynik (poza gitem): scratch/macierz/macierz.json, macierz.html, bank-plan.md. 0 zł, bez sieci, bez modelu.
Test: node --test tests/macierz.test.js
"""
import argparse, csv, glob, html, json, math, os, re, sys, unicodedata
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def slug(s):
    s = unicodedata.normalize("NFD", (s or "").lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").replace("ł", "l")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


STOP = set("i w z na do o od dla oraz a the of and in to jego jej ich ze we po przy jako lub".split())


def rdzenie(t):
    """Słowa tematu jako rdzenie (5 pierwszych liter po slugu): „Funkcje zarządzania” ≈ „Funkcja zarządzania”."""
    return {w[:5] for w in slug(t).split("-") if len(w) > 2 and w not in STOP}


def podobne(a, b):
    ra, rb = rdzenie(a), rdzenie(b)
    if not ra or not rb:
        return 0.0
    return len(ra & rb) / min(len(ra), len(rb))


def ogolny(pid, O):
    for og, v in O["ogolne"].items():
        if pid in v["aliasy"]:
            return og, True
    for og, v in O["ogolne"].items():
        if any(("-" in a or v.get("rodzina")) and pid.startswith(a + "-") for a in v["aliasy"]):
            return og, False
    return None, False


def semestr_dzis(d=None):
    d = d or date.today()
    return "zimowy" if d.month >= 10 or d.month <= 2 else "letni"


def nr_semestru(rok, semestr):
    return rok * 2 - (1 if semestr == "zimowy" else 0)


def roczniki(plan_bm):
    """Roczniki z sylabusem: pliki kierunków skrot-bm (sylabus w repo) + konfiguracje plan-bm z sylabusem z sylabusy-hurt.py."""
    out = {}
    for f in sorted(glob.glob(os.path.join(ROOT, "kierunki", "*.json"))):
        k = json.load(open(f))
        plik = (k.get("sylabus") or {}).get("plik") or ("sylabus.json" if k["id"] == "wefiz-bm-1-st-2026" else None)
        if plik and os.path.isfile(os.path.join(ROOT, plik)):
            out[k["id"]] = {"id": k["id"], "kierunek_id": k["kierunek_id"], "nazwa": k["kierunek"]["pl"], "prefiks": k["prefiks"],
                            "stopien": k["stopien"], "nabor": k["nabor"], "jezyk": k.get("jezykZajec", "pl"), "sylabus": os.path.join(ROOT, plik)}
    for f in sorted(glob.glob(os.path.join(plan_bm, "kierunki", "*.json"))) if plan_bm else []:
        c = json.load(open(f))
        s = os.path.join(ROOT, "scratch", "sylabusy", c["kod"] + ".json")
        if c["id"] not in out and os.path.isfile(s):
            out[c["id"]] = {"id": c["id"], "kierunek_id": c["id"].rsplit("-", 1)[0], "nazwa": c["kierunek"]["pl"], "prefiks": c["kod"],
                            "stopien": c["stopien"], "nabor": c["nabor"], "jezyk": "pl", "sylabus": s}
    return out


def oczekujacy(plik, rok_ak):
    """Eksport listy oczekujących (JSON z „wiersze” albo CSV) → liczba osób na rocznik (kierunek_id + nabór z roku studiów)."""
    if not plik:
        return {}
    if plik.endswith(".json"):
        d = json.load(open(plik))
        wiersze = d.get("wiersze", d) if isinstance(d, dict) else d
    else:
        wiersze = list(csv.DictReader(open(plik, encoding="utf-8")))
    out = {}
    for w in wiersze:
        kid, rok = w.get("kierunek_id"), w.get("rok")
        if not kid or not rok:
            continue
        rid = f"{kid}-{rok_ak - int(rok) + 1}"
        out[rid] = out.get(rid, 0) + 1
    return out


def zbuduj(R, O, semestr, rok_studiow, rok_ak, ocz):
    grupy = {}
    for r in R.values():
        rok = rok_ak - r["nabor"] + 1
        if rok_studiow and rok != rok_studiow:
            continue
        sem = nr_semestru(rok, semestr)
        for c in json.load(open(r["sylabus"]))["courses"]:
            if sem not in (c.get("sem") or []):
                continue
            pid = c["id"]
            if re.match(r"^(szkolenie|wychowanie-fizyczne|lektorat|jezyk-obcy|praktyk)", pid):
                continue
            og, pewne = ogolny(pid, O)
            klucz = og or pid
            g = grupy.setdefault(klucz, {"ogolny": klucz, "przypisany": bool(og), "bm": (O["ogolne"].get(og) or {}).get("bm", []), "kierunki": []})
            egz = any(f.get("c") == "e" and f.get("s", sem) == sem for f in c.get("forms") or [])
            tem = [t["t"] for lista in (c.get("topics") or {}).values() for t in lista]
            g["kierunki"].append({"rocznik": r["id"], "nazwa": r["nazwa"], "stopien": r["stopien"], "jezyk": r["jezyk"], "przedmiot": pid,
                                  "pl": c.get("pl") or pid, "egzamin": egz, "ects": c.get("ects"), "godz": c.get("hours"), "alias_pewny": pewne or not og,
                                  "oczekujacy": ocz.get(r["id"], 0), "tematy": tem})
    out = []
    for g in grupy.values():
        ks = g["kierunki"]
        pl = [k for k in ks if k["jezyk"] == "pl"]
        # wspólne tematy: grupowanie po podobieństwie słów; temat wspólny = z co najmniej dwóch kierunków
        klastry = []
        for k in pl:
            for t in k["tematy"]:
                kl = next((x for x in klastry if podobne(t, x["temat"]) >= 0.6), None)
                if kl is None:
                    klastry.append({"temat": t, "warianty": [t], "kierunki": [k["rocznik"]]})
                else:
                    if k["rocznik"] not in kl["kierunki"]:
                        kl["kierunki"].append(k["rocznik"])
                    if t not in kl["warianty"]:
                        kl["warianty"].append(t)
        klastry.sort(key=lambda x: (-len(x["kierunki"]), x["temat"]))
        n_pl, n_egz = len({k["rocznik"] for k in pl}), sum(1 for k in pl if k["egzamin"])
        ludzie = sum(k["oczekujacy"] for k in pl)
        # wynik: każdy kierunek PL liczy się raz, z egzaminem dwa razy; każde 10 osób z listy oczekujących = jeszcze jeden kierunek
        wynik = sum((2 if k["egzamin"] else 1) * (1 + k["oczekujacy"] / 10) for k in pl)
        out.append({**g, "kierunkowPl": n_pl, "egzaminow": n_egz, "oczekujacych": ludzie, "wynik": round(wynik, 2),
                    "tematyWspolne": [x for x in klastry if len(x["kierunki"]) > 1], "tematowRazem": len(klastry),
                    "koszyk": "K2 (z BM)" if g["bm"] else "K3 (nowe)", "tylkoEn": not pl})
    out.sort(key=lambda g: (g["tylkoEn"], -g["wynik"], g["ogolny"]))
    return out


def html_macierzy(M, R, semestr, rok_studiow):
    ids = sorted({k["rocznik"] for g in M for k in g["kierunki"]})
    pref = {r["id"]: r["prefiks"] for r in R.values()}
    th = "".join(f"<th title='{html.escape(i)}'>{html.escape(pref.get(i, i))}</th>" for i in ids)
    wiersze = []
    for g in M:
        if g["tylkoEn"]:
            continue
        po = {k["rocznik"]: k for k in g["kierunki"]}
        kom = "".join(("<td class='e' title='egzamin'>E</td>" if po[i]["egzamin"] else "<td class='z'>●</td>") if i in po else "<td></td>" for i in ids)
        wiersze.append(f"<tr><td><b>{html.escape(g['ogolny'])}</b>{'' if g['przypisany'] else ' <small>(bez przypisania)</small>'}</td>"
                       f"<td>{g['kierunkowPl']}</td><td>{g['egzaminow']}</td><td>{g['oczekujacych']}</td><td>{html.escape(g['koszyk'])}</td>"
                       f"<td>{len(g['tematyWspolne'])}/{g['tematowRazem']}</td><td><b>{g['wynik']}</b></td>{kom}</tr>")
    return f"""<!doctype html><meta charset="utf-8"><title>Macierz przedmiotów WEFiZ</title>
<style>body{{font:14px system-ui;margin:16px}}table{{border-collapse:collapse}}td,th{{border:1px solid #ccc;padding:4px 6px;text-align:center}}
td:first-child{{text-align:left}}.e{{background:#1A7F45;color:#fff}}.z{{background:#e6f4ea}}small{{color:#a33}}</style>
<h1>Macierz przedmiotów: semestr {semestr}{f", {rok_studiow}. rok" if rok_studiow else ""}</h1>
<p>Wiersz = przedmiot ogólny (jedna lekcja w banku PL dla wszystkich kierunków). E = egzamin w tym semestrze, ● = zaliczenie.
Wynik = kierunki (z egzaminem ×2) powiększone o listę oczekujących (+1 na 10 osób). Tematy = wspólne / wszystkie.</p>
<table><thead><tr><th>Przedmiot ogólny</th><th>Kierunki PL</th><th>Egzaminy</th><th>Czeka</th><th>Źródło</th><th>Tematy</th><th>Wynik</th>{th}</tr></thead>
<tbody>{"".join(wiersze)}</tbody></table>"""


def plan_banku(M, semestr):
    pl = [g for g in M if not g["tylkoEn"]]
    lin = [f"# Kolejność banku PL ({semestr})", "",
           "Najpierw przedmioty, które obsłużą najwięcej osób na egzaminach. Każdy wiersz = jedna lekcja na temat w banku,",
           "którą potem dostają wszystkie kierunki z tej kolumny jako K1 (kopia, 0 zł).", "",
           "| # | Przedmiot ogólny | Kierunki PL | Egzaminy | Czeka | Źródło | Wspólne tematy | Wynik |", "|---|---|---|---|---|---|---|---|"]
    for i, g in enumerate(pl, 1):
        lin.append(f"| {i} | {g['ogolny']}{'' if g['przypisany'] else ' (bez przypisania)'} | {g['kierunkowPl']} | {g['egzaminow']} | {g['oczekujacych']} | {g['koszyk']} | {len(g['tematyWspolne'])}/{g['tematowRazem']} | {g['wynik']} |")
    bez = [g["ogolny"] for g in pl if not g["przypisany"] and g["kierunkowPl"] > 0]
    if bez:
        lin += ["", "**Bez przypisania** (sprawdź, czy to nie ten sam przedmiot co inny wiersz; wtedy dopisz alias w kierunki/wspolne/przedmioty-ogolne.json):",
                ", ".join(sorted(bez))]
    return "\n".join(lin) + "\n"


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--semestr", choices=["zimowy", "letni"], default=None)
    ap.add_argument("--rok", type=int, default=1, help="rok studiów (0 = wszystkie)")
    ap.add_argument("--oczekujacy", default=None)
    ap.add_argument("--plan-bm", default=os.path.join(os.path.dirname(ROOT), "plan-bm"))
    ap.add_argument("--teraz", default=None, help="RRRR-MM-DD (testy)")
    a = ap.parse_args()
    teraz = date.fromisoformat(a.teraz) if a.teraz else date.today()
    semestr = a.semestr or semestr_dzis(teraz)
    rok_ak = teraz.year if teraz.month >= 10 else teraz.year - 1
    O = json.load(open(os.path.join(ROOT, "kierunki", "wspolne", "przedmioty-ogolne.json")))
    R = roczniki(a.plan_bm if os.path.isdir(a.plan_bm) else None)
    M = zbuduj(R, O, semestr, a.rok or None, rok_ak, oczekujacy(a.oczekujacy, rok_ak))
    OUT = os.path.join(ROOT, "scratch", "macierz")
    os.makedirs(OUT, exist_ok=True)
    json.dump(M, open(os.path.join(OUT, "macierz.json"), "w"), ensure_ascii=False, indent=1)
    open(os.path.join(OUT, "macierz.html"), "w").write(html_macierzy(M, R, semestr, a.rok or None))
    open(os.path.join(OUT, "bank-plan.md"), "w").write(plan_banku(M, semestr))
    pl = [g for g in M if not g["tylkoEn"]]
    print(f"Roczniki z sylabusem: {len(R)} ({', '.join(r['prefiks'] for r in R.values())}); przedmiotów ogólnych PL: {len(pl)}.")
    for g in pl[:8]:
        print(f"  {g['wynik']:>5}  {g['ogolny']}: {g['kierunkowPl']} kier., {g['egzaminow']} egz., {g['koszyk']}, wspólne tematy {len(g['tematyWspolne'])}/{g['tematowRazem']}")
    print("Zapisano scratch/macierz/macierz.html, macierz.json, bank-plan.md")
