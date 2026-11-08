"""Sylabusy wszystkich kierunków naraz (optymalizacja nr 3, wejście do scripts/macierz-przedmiotow.py).

Dla każdej konfiguracji planu z repo plan-bm (kierunki/<id>.json, robi je plan-bm/scripts/wefiz-wszystkie.mjs) szuka PDF-u sylabusa
na liście wydziału (https://efz.usz.edu.pl/ksztalcenie/sylabusy/), a bez trafienia bierze adres ze wzoru wydziału (ten sam co
scripts/kierunek-nowy.mjs). PDF → ten sam parser co Zarządzanie i FiR (sylabus-parse.py + sylabus-build.py) → scratch/sylabusy/<prefiks>.json.
Do repo nic nie trafia: sylabus kierunku idzie do repo dopiero razem z jego Skrótem (scripts/kierunek-start.mjs, Etap B).

  python3 scripts/sylabusy-hurt.py --na-sucho                lista adresów, nic nie pobiera
  python3 scripts/sylabusy-hurt.py [--rok 1] [--tylko log26,ek26] [--plan-bm ../plan-bm] [--odswiez]
Grzecznie: ≤ 1 zapytanie na sekundę, PDF pobrany raz (drugi przebieg bierze plik z dysku, chyba że --odswiez). Wymaga: pip install pdfplumber.
Test: node --test tests/macierz.test.js
"""
import argparse, glob, json, os, re, shutil, subprocess, sys, tempfile, time, unicodedata, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LISTA = "https://efz.usz.edu.pl/ksztalcenie/sylabusy/"
BAZA = "https://efz.usz.edu.pl/wp-content/uploads/"
UA = "skrot-bm (projekt studencki, sylabusy WEFiZ, 1 zapytanie/s; skrotbm@outlook.com)"
STOPIEN_PDF = {1: "I", 2: "II", 0: "jednolite"}


def slug(s):
    s = unicodedata.normalize("NFD", (s or "").lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").replace("ł", "l")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def slug_pdf(nazwa):
    return slug(re.sub(r"\s*inż\.?$", " inzynierskie", nazwa, flags=re.I)).replace("-", "_")


def adresy(nazwa, stopien, nabor, tryb="st", jezyk="pl"):
    """Ten sam wzór co scripts/kierunek-nowy.mjs (adresySylabusa); test porównuje oba. Po angielsku: dopisek „_ang”."""
    lata, kat = f"{nabor}_{nabor + 1}", f"{str(nabor)[2:]}-{str(nabor + 1)[2:]}"
    studia = ("studia_stacjonarne_" if tryb == "st" else "studia_niestacjonarne_") + STOPIEN_PDF[stopien] + "_stopnia_" + lata
    return {"pdf": f"{BAZA}sylabusy/{kat}/sylabus_{slug_pdf(nazwa)}_{studia}{'_ang' if jezyk == 'en' else ''}.pdf",
            "planStudiow": f"{BAZA}plany_studiow/{nabor}-{str(nabor + 1)[2:]}/plany_studiow_{slug_pdf(nazwa)}_{studia}.pdf"}


def z_listy(html, nazwa, stopien, nabor, tryb="st", jezyk="pl"):
    """Odnośnik do PDF-u sylabusa tego kierunku na liście wydziału (nazwa pliku zawiera slug kierunku, stopień i lata).
    Kierunek po angielsku: najpierw wersja „_ang”, polska tylko gdy angielskiej nie ma."""
    lata = f"{nabor}_{nabor + 1}"
    want = slug_pdf(nazwa)
    st = ("stacjonarne" if tryb == "st" else "niestacjonarne") + "_" + STOPIEN_PDF[stopien] + "_stopnia"
    traf = []
    for m in re.finditer(r'href="([^"]+\.pdf)"', html or "", re.I):
        u = m.group(1)
        f = u.rsplit("/", 1)[-1].lower()
        if f.startswith("sylabus_" + want + "_") and st.lower() in f and lata in f:
            traf.append((("_ang" in f) != (jezyk == "en"), u))
    return sorted(traf)[0][1] if traf else None


def podstrona(html, nazwa):
    """Adres podstrony kierunku na liście wydziału (/ksztalcenie/sylabusy/<slug>/), gdy lista nie ma jego PDF-ów wprost."""
    m = re.search(r'href="((?:https://efz\.usz\.edu\.pl)?/ksztalcenie/sylabusy/' + re.escape(slug(nazwa)) + r'/?)"', html or "", re.I)
    return None if not m else (m.group(1) if m.group(1).startswith("http") else "https://efz.usz.edu.pl" + m.group(1))


def jezyk_kierunku(nazwa):
    """Język zajęć z kierunki/wspolne/kierunki-nazwy.json (konfiguracja planu z plan-bm go nie ma)."""
    try:
        d = json.load(open(os.path.join(ROOT, "kierunki", "wspolne", "kierunki-nazwy.json")))
        return d["kierunki"].get(nazwa, {}).get("jezykZajec", "pl")
    except Exception:
        return "pl"


def pobierz(url, cel=None):
    time.sleep(1.1)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            dane = r.read()
    except Exception as e:
        return None, str(e)
    if cel:
        open(cel, "wb").write(dane)
    return dane, None


def parsuj(pdf, cfg, wyjscie):
    """sylabus-parse.py zapisuje syl.json w bieżącym katalogu, sylabus-build.py go czyta: oba w katalogu tymczasowym."""
    with tempfile.TemporaryDirectory() as t:
        kier = os.path.join(t, "kierunek.json")
        json.dump(cfg, open(kier, "w"), ensure_ascii=False)
        for cmd in ([sys.executable, os.path.join(ROOT, "scripts", "sylabus-parse.py"), os.path.abspath(pdf)],
                    [sys.executable, os.path.join(ROOT, "scripts", "sylabus-build.py"), os.path.abspath(wyjscie), "--kierunek", kier]):
            r = subprocess.run(cmd, cwd=t, capture_output=True, text=True)
            if r.returncode:
                return (r.stderr or r.stdout).strip().splitlines()[-1:] or ["błąd parsera"]
    return None


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--plan-bm", default=os.path.join(os.path.dirname(ROOT), "plan-bm"))
    ap.add_argument("--rok", type=int, default=1, help="rok studiów (0 = wszystkie)")
    ap.add_argument("--tylko", default="")
    ap.add_argument("--na-sucho", action="store_true")
    ap.add_argument("--odswiez", action="store_true")
    a = ap.parse_args()
    cfgs = [json.load(open(f)) for f in sorted(glob.glob(os.path.join(a.plan_bm, "kierunki", "*.json")))]
    tylko = {x.strip() for x in a.tylko.split(",") if x.strip()}
    cfgs = [c for c in cfgs if (not a.rok or c.get("rok") == a.rok) and (not tylko or c["kod"] in tylko)]
    if not cfgs:
        sys.exit("Brak konfiguracji w " + os.path.join(a.plan_bm, "kierunki") + " (najpierw plan-bm/scripts/wefiz-wszystkie.mjs).")
    OUT = os.path.join(ROOT, "scratch", "sylabusy")
    os.makedirs(OUT, exist_ok=True)
    lista = None if a.na_sucho else (pobierz(LISTA)[0] or b"").decode("utf-8", "replace")
    raport = []
    for c in cfgs:
        c = {**c, "jezykZajec": jezyk_kierunku(c["kierunek"]["pl"])}   # sylabus-build: karta angielska jak BM albo polska
        pdf, js = os.path.join(OUT, c["kod"] + ".pdf"), os.path.join(OUT, c["kod"] + ".json")
        url = z_listy(lista, c["kierunek"]["pl"], c["stopien"], c["nabor"], c.get("tryb", "st"), c["jezykZajec"]) if lista else None
        skad = "lista wydziału" if url else "wzór adresu"
        pod = podstrona(lista, c["kierunek"]["pl"]) if lista and not url else None
        if pod:   # np. Economics and IT Applications: PDF-y tylko na podstronie kierunku (i „IT” wielkimi literami w nazwie pliku)
            url = z_listy((pobierz(pod)[0] or b"").decode("utf-8", "replace"), c["kierunek"]["pl"], c["stopien"], c["nabor"], c.get("tryb", "st"), c["jezykZajec"])
            skad = "podstrona kierunku" if url else skad
        if url and url.startswith("/"):
            url = "https://efz.usz.edu.pl" + url
        url = url or adresy(c["kierunek"]["pl"], c["stopien"], c["nabor"], c.get("tryb", "st"), c["jezykZajec"])["pdf"]
        if a.na_sucho:
            raport.append((c["kod"], c["kierunek"]["pl"], skad, url, "na sucho")); continue
        if a.odswiez or not os.path.isfile(pdf):
            _, err = pobierz(url, pdf)
            if err:
                raport.append((c["kod"], c["kierunek"]["pl"], skad, url, "nie pobrano: " + err)); continue
        err = parsuj(pdf, c, js)
        n = len(json.load(open(js))["courses"]) if not err and os.path.isfile(js) else 0
        raport.append((c["kod"], c["kierunek"]["pl"], skad, url, f"{n} kart" if not err else "parser: " + " ".join(err)))
    for r in raport:
        print(" · ".join(r))
    ok = sum(1 for r in raport if r[4].endswith("kart"))
    print(f"\nSylabusy: {ok}/{len(raport)} gotowe w scratch/sylabusy/. Dalej: python3 scripts/macierz-przedmiotow.py")
