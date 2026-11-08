"""Etap D/E schematu kierunków: lekcje nowego kierunku z lekcji BM (koszyki K1 i K2), bez pisania treści w czacie.

  python3 scripts/lekcje-z-bm.py kierunki/<rocznik>.json k1                       # K1: kopia części niezależnych od języka, 0 zł
  python3 scripts/lekcje-z-bm.py kierunki/<rocznik>.json k2 --na-sucho [--tylko id,id] [--przedmiot p] [--ile 2]   # pilot (pierwszy kierunek)
  python3 scripts/lekcje-z-bm.py kierunki/<rocznik>.json k2 --na-sucho --wszystkie [--przedmioty a,b]          # bez pilota: cała mapa
                                                                                    # (albo wybrane przedmioty, np. z harmonogramu)
  python3 scripts/lekcje-z-bm.py kierunki/<rocznik>.json k2 --wyslij   …           # dopiero po „wysyłaj” Bartka
  python3 scripts/lekcje-z-bm.py kierunki/<rocznik>.json k2 --odbierz              # wyniki → paczki + porównanie ze źródłem
  python3 scripts/lekcje-z-bm.py kierunki/<rocznik>.json tytuly --na-sucho|--wyslij|--odbierz [--katalog …]
                                                                                    # tytuły PL dla gotowych lekcji, które mają jeszcze tytuł BM

Wejście: eksport lekcji BM w scratch/lessons/ (docs/lekcje-v4/eksport.js) i mapa tematów scratch/<prefiks>/mapa.json (Etap C).
K1 (spec 4.2): nowy dokument z id `<prefiks>-<id BM>`, `rocznik_id`, `zrodlo: "bm:<id>"`; kopiuje 1:1 `gen` (zmienne, wzór, wynik), `type`, wizualizacje,
  „Prościej · PL” (`simple`) i całą strukturę lekcji. Teksty po angielsku zostają do K2 (pole `k2: "do zrobienia"`).
K2: model dostaje WYŁĄCZNIE listę tekstów lekcji (ścieżka → tekst EN) i tematy z sylabusa kierunku; oddaje tekst PL dla tych samych
  ścieżek. Struktura, liczba atomów i pytań, `correct`, `calc`, `gen` nie przechodzą przez model, więc zostają takie jak w BM.
  Porównanie ze źródłem (spec 4.4 pkt 2) sprawdza to jeszcze raz i dodatkowo liczby w tekstach.
Nic nie zapisuje do bazy. Wynik: scratch/<prefiks>/paczki/<id>.json (format eksportu + rocznik_id + zrodlo), koszt w k2-usage.json.
"""
import argparse, copy, json, math, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser()
ap.add_argument("kierunek")
ap.add_argument("krok", choices=["k1", "k2", "porownaj", "tytuly", "sylref"])
ap.add_argument("--na-sucho", action="store_true")
ap.add_argument("--wyslij", action="store_true")
ap.add_argument("--odbierz", action="store_true")
ap.add_argument("--tylko", default="")
ap.add_argument("--przedmiot", default="podstawy-zarzadzania")
ap.add_argument("--ile", type=int, default=2)
ap.add_argument("--wszystkie", action="store_true", help="wszystkie lekcje K2 z mapy (kolejny kierunek: wzorzec zatwierdzony, bez pilota)")
ap.add_argument("--przedmioty", default="", help="z --wszystkie: tylko te przedmioty (lista po przecinku)")
ap.add_argument("--model", default="claude-sonnet-5-5")
ap.add_argument("--lekcje", default=os.path.join(ROOT, "scratch", "lessons"))
ap.add_argument("--wyjscie", default=None)
ap.add_argument("--katalog", default=None, help="tytuly: katalog lekcji (domyślnie paczki)")
a = ap.parse_args()

CENY = {"claude-haiku-5-5": (0.10, 0.50), "claude-sonnet-5-5": (2.00, 10.00), "claude-opus-5-5": (4.00, 20.00)}
BATCH = 0.5
K = json.load(open(a.kierunek if os.path.isabs(a.kierunek) else os.path.join(ROOT, a.kierunek)))
OUT = a.wyjscie or os.path.join(ROOT, "scratch", K["prefiks"])
PACZKI = os.path.join(OUT, "paczki")
os.makedirs(PACZKI, exist_ok=True)

# Pola, które nie są tekstem do tłumaczenia (zostają 1:1). simple/pl są już po polsku.
NIE_TEKST = {"id", "correct", "calc", "vars", "answer", "unit", "tol", "type", "sec", "conf", "simple", "pl", "img", "viz", "visual", "chart", "order", "level"}


def wczytaj_bm():
    out = {}
    if not os.path.isdir(a.lekcje):
        return out
    for f in sorted(os.listdir(a.lekcje)):
        if f.endswith(".json"):
            try:
                d = json.load(open(os.path.join(a.lekcje, f)))
            except Exception:
                continue
            if (d.get("content") or {}).get("lesson"):
                out[d["id"]] = d
    return out


BM = wczytaj_bm()
MAPA_P = os.path.join(OUT, "mapa.json")
MAPA = json.load(open(MAPA_P)) if os.path.exists(MAPA_P) else []


BM_SYL = {c["id"]: c for c in json.load(open(os.path.join(ROOT, "sylabus.json")))["courses"]}
STOP_EN = {"and", "the", "of", "in", "its", "their", "for", "with", "basic", "chosen", "different", "definition", "properties", "process", "essence", "role", "incl"}


def rdzenie_en(t):
    return {w[:6] for w in re.findall(r"[a-z]+", t.lower()) if len(w) >= 4 and w not in STOP_EN}


def lekcje_tematu(zr):
    """„bm-syl:<przedmiot>:<forma>:<n>” (mapa zrobiona na tematach sylabusa BM, bez eksportu) → lekcje tego przedmiotu BM
    o najbardziej podobnym tytule (wspólne rdzenie słów EN ważone rzadkością; co najmniej 1/3 tematu). Pusto = brak pewnej lekcji."""
    try:
        _, sid, forma, n = zr.split(":")
        n = int(n)
    except ValueError:
        return []
    tem = [t["t"] for f, l in BM_SYL.get(sid, {}).get("topics", {}).items() for t in l]
    if not 0 < n <= len(tem):
        return []
    les = [(i, d.get("title", "")) for i, d in BM.items() if d.get("subjectId") == sid]
    df = {}
    for _, t in les:
        for r in rdzenie_en(t):
            df[r] = df.get(r, 0) + 1
    w = lambda r: math.log(1 + len(les) / df.get(r, 1))
    rt = rdzenie_en(tem[n - 1])
    if not rt:
        return []
    wyn = sorted(((sum(w(r) for r in rt & rdzenie_en(t)) / sum(w(r) for r in rt), i) for i, t in les), reverse=True)
    if not wyn or wyn[0][0] < 1 / 3:
        return []
    return [i for sc, i in wyn if sc >= max(1 / 3, wyn[0][0] * 0.75)][:3]


def przypisania():
    """id lekcji BM → (przedmiot kierunku, [tematy sylabusa]) z mapy; źródło „bm:<przedmiot>” (mapa tymczasowa) = wszystkie jego lekcje,
    „bm-syl:…” = lekcje dopasowane do tematu sylabusa BM (lekcje_tematu)."""
    out = {}
    SYL_REF.clear()
    for m in MAPA:
        nr = {}
        for t in m["tematy"]:
            nr[t.get("forma")] = nr.get(t.get("forma"), 0) + 1
            t["_nr"] = nr[t.get("forma")]
            if t.get("koszyk") not in ("K1", "K2"):
                continue
            for z in t.get("zrodlo") or []:
                ids = ([i for i, d in BM.items() if d.get("subjectId") == z[3:]] if z.startswith("bm:")
                       else lekcje_tematu(z) if z.startswith("bm-syl:") else ([z] if z in BM else []))
                for i in ids:
                    p, tem = out.setdefault(i, (m["przedmiot"], []))
                    if t["temat"] not in tem:
                        tem.append(t["temat"])
                        SYL_REF.setdefault(i, []).append((t.get("forma") or "", t["_nr"]))
    return out


SYL_REF = {}   # id lekcji BM → [(forma, numer tematu w sylabusie kierunku)] z ostatniego przypisania
FORMY = {"W": "wykład", "CW": "ćwiczenia", "LAB": "laboratorium", "KON": "konwersatorium", "SEM": "seminarium"}


def syl_ref(bm_id):
    """Opis pod tytułem lekcji (pole sylRef w aplikacji): „wykład, tematy 1, 3 · ćwiczenia, temat 2”."""
    po = {}
    for f, n in SYL_REF.get(bm_id, []):
        po.setdefault(f, []).append(n)
    cz = [f"{FORMY.get(f, f.lower())}, {'tematy' if len(ns) > 1 else 'temat'} {', '.join(map(str, sorted(ns)))}" for f, ns in po.items()]
    return " · ".join(cz) or None


def nowe_id(bm_id):
    return f'{K["prefiks"]}-{bm_id}'


def teksty(x, sciezka=""):
    """[(ścieżka, tekst)] wszystkie teksty do tłumaczenia, w stałej kolejności."""
    out = []
    if isinstance(x, dict):
        for k, v in x.items():
            if k in NIE_TEKST:
                continue
            out += teksty(v, f"{sciezka}.{k}" if sciezka else k)
    elif isinstance(x, list):
        for i, v in enumerate(x):
            out += teksty(v, f"{sciezka}[{i}]")
    elif isinstance(x, str) and re.search(r"[A-Za-z]{2}", x):
        out.append((sciezka, x))
    return out


def ustaw(root, sciezka, wartosc):
    cz = re.findall(r"[^.\[\]]+|\[\d+\]", sciezka)
    cur = root
    for i, c in enumerate(cz):
        klucz = int(c[1:-1]) if c.startswith("[") else c
        if i == len(cz) - 1:
            if isinstance(cur[klucz], str):
                cur[klucz] = wartosc
                return True
            return False
        cur = cur[klucz]


def odcisk(d):
    """Ten sam odcisk co scripts/tresci-bank.py: tytuł + treść, klucze posortowane (zmiana źródła BM → lista do ponownego K2)."""
    import hashlib
    s = json.dumps({"title": d.get("title", ""), "content": d.get("content")}, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(s.encode("utf-8")).hexdigest()[:16]


def k1_dokument(bm, przedmiot):
    d = {"id": nowe_id(bm["id"]), "subjectId": przedmiot, "rocznik_id": K["id"], "zrodlo": "bm:" + bm["id"],
         "title": bm.get("title", ""), "order": bm.get("order"), "sylRef": syl_ref(bm["id"]), "k2": "do zrobienia",
         "content": copy.deepcopy(bm["content"]), "zrodloHash": odcisk(bm)}
    d["kopiaHash"] = odcisk(d)
    return d


LICZBY = re.compile(r"g\d{4}|-?\d+(?:[.,]\d+)?")


def liczby(s, jezyk="pl"):
    """Liczby z tekstu w jednej postaci: bez separatorów tysięcy (EN „1,200”, PL „1 200”/„1 200”), przecinek dziesiętny PL → kropka."""
    s = s or ""
    # godziny w jednej postaci HH:MM (EN „5 p.m.” = PL „17:00”), żeby lokalizacja godziny nie była różnicą liczb
    def godz(h, m, pm):
        h = int(h) % 12 + (12 if pm else 0) if pm is not None else int(h)
        return f" g{h:02d}{m or '00'} "
    if jezyk == "en":
        s = re.sub(r"\b(\d{1,2})(?::(\d{2}))?\s?([ap])\.?m\.?(?![a-z])", lambda x: godz(x[1], x[2], x[3].lower() == "p"), s, flags=re.I)
    s = re.sub(r"\b(\d{1,2}):(\d{2})\b", lambda x: godz(x[1], x[2], None), s)
    if jezyk == "en":
        s = re.sub(r"(?<=\d),(?=\d{3}(?!\d))", "", s)
    else:
        s = re.sub(r"(?<=\d)[ \u00a0\u202f](?=\d{3}(?!\d))", "", s)
        s = re.sub(r"(?<=\d),(?=\d)", ".", s)
    return sorted(str(float(x)) if re.fullmatch(r"-?\d+(\.\d+)?", x) else x for x in LICZBY.findall(s))


def porownaj(zrodlo, nowa):
    """Spec 4.4 pkt 2: ta sama struktura, te same pola nie-tekstowe, te same liczby w tekstach. Zwraca listę różnic."""
    r = []

    def szkielet(x):
        if isinstance(x, dict):
            return {k: (v if k in NIE_TEKST - {"simple", "pl"} else szkielet(v)) for k, v in x.items()}
        if isinstance(x, list):
            return [szkielet(v) for v in x]
        return "·" if isinstance(x, str) else x

    if szkielet(zrodlo["content"]) != szkielet(nowa["content"]):
        r.append("inna struktura albo inne pola nie-tekstowe (correct/calc/gen/id) niż w BM")
    nowe = dict(teksty(nowa["content"]))
    for p, t in teksty(zrodlo["content"]):
        if p in nowe and liczby(t, "en") != liczby(nowe[p]):
            r.append(f"{p}: liczby {liczby(t, 'en')} → {liczby(nowe[p])}")
        if p in nowe and sorted(re.findall(r"\{\w+\}", t)) != sorted(re.findall(r"\{\w+\}", nowe[p])):
            r.append(f"{p}: inne zmienne {{…}} niż w BM")
    return r


ZASADY = """Tłumaczysz lekcję z kierunku Business Management (po angielsku) na lekcję dla studentów Zarządzania (po polsku, Uniwersytet Szczeciński).
Dostajesz listę tekstów lekcji jako pary {p: ścieżka, t: tekst EN} i tematy z sylabusa Zarządzania, do których lekcja jest przypisana.
Zwracasz dla KAŻDEJ ścieżki tekst po polsku: {p: ta sama ścieżka, v: tekst PL}. Nie dodajesz ani nie usuwasz ścieżek.
Dostajesz jedną część lekcji („czesc”); przetłumacz WSZYSTKIE jej teksty, bez skracania i bez pomijania – reszta lekcji przyjdzie w innych zapytaniach.
- Zachowaj sens, długość (±20%), formatowanie (**pogrubienia**, LaTeX \\( … \\), listy), zmienne w klamrach ({a}) i WSZYSTKIE liczby, kwoty i wzory bez zmian.
- Pytania i odpowiedzi: ta sama kolejność i ten sam sens; poprawna odpowiedź musi zostać poprawna, złe dalej złe, `not` dalej tłumaczy błąd.
- Dostosuj słownictwo do polskich podręczników zarządzania i do tematów z sylabusa; przykłady firm zostaw albo zamień na równoważne polskie
  tylko wtedy, gdy nie zmienia to liczb ani odpowiedzi.
- Terminy fachowe po polsku; przy pierwszym użyciu kluczowego pojęcia możesz dodać angielski odpowiednik w nawiasie.
- Pole `uwaga`: puste albo 1 zdanie, jeśli temat lekcji słabo pasuje do sylabusa Zarządzania."""

SCHEMA = {"type": "object", "additionalProperties": False, "required": ["teksty", "uwaga"], "properties": {
    "teksty": {"type": "array", "items": {"type": "object", "additionalProperties": False, "required": ["p", "v"],
                                          "properties": {"p": {"type": "string"}, "v": {"type": "string"}}}},
    "uwaga": {"type": "string"}}}


def wybrane(prz):
    if a.tylko:
        ids = [x.strip() for x in a.tylko.split(",") if x.strip()]
        brak = [i for i in ids if i not in BM]
        if brak:
            sys.exit("Nie ma w eksporcie BM: " + ", ".join(brak))
        return ids
    kol = lambda i: (BM[i].get("order") is None, BM[i].get("order") or 0, i)
    if a.wszystkie:
        chc = {x.strip() for x in a.przedmioty.split(",") if x.strip()}
        # lekcje już gotowe (k2: gotowe w paczkach) nie idą drugi raz
        gotowe = set()
        if os.path.isdir(PACZKI):
            for f in os.listdir(PACZKI):
                d = json.load(open(os.path.join(PACZKI, f)))
                if d.get("k2") == "gotowe" and str(d.get("zrodlo", "")).startswith("bm:"):
                    gotowe.add(d["zrodlo"][3:])
        return sorted((i for i, (p, _) in prz.items() if (not chc or p in chc) and i not in gotowe), key=lambda i: (prz[i][0], kol(i)))
    ids = sorted((i for i, (p, _) in prz.items() if p == a.przedmiot), key=kol)
    return ids[: a.ile]


CZESC_TEKSTOW, CZESC_ZNAKOW = 60, 12000   # jedna odpowiedź modelu = jedna część lekcji (cała lekcja BM to ~350 tekstów)


TYTUL = "@title"   # tytuł lekcji leży poza content; jedzie w pierwszej części jako zwykły tekst


def czesci(bm_id):
    """Teksty lekcji podzielone na części, które model odda w całości (tytuł na początku pierwszej)."""
    out, cur, zn = [], [], 0
    tyt = [(TYTUL, BM[bm_id]["title"])] if BM[bm_id].get("title") else []
    for p, t in tyt + teksty(BM[bm_id]["content"]):
        if cur and (len(cur) >= CZESC_TEKSTOW or zn + len(t) > CZESC_ZNAKOW):
            out.append(cur); cur, zn = [], 0
        cur.append((p, t)); zn += len(t)
    return out + ([cur] if cur else [])


def zapytania_lekcji(bm_id, przedmiot, tematy):
    cz = czesci(bm_id)
    out = []
    for n, t in enumerate(cz):
        tresc = json.dumps({"lekcjaBM": BM[bm_id].get("title", ""), "przedmiotKierunku": przedmiot, "tematySylabusa": tematy,
                            "czesc": f"{n + 1}/{len(cz)}", "teksty": [{"p": p, "t": s} for p, s in t]}, ensure_ascii=False)
        out.append({"custom_id": f"{bm_id}--{n}", "params": {
            "model": a.model, "max_tokens": 32000,
            "system": [{"type": "text", "text": ZASADY, "cache_control": {"type": "ephemeral"}}],
            "messages": [{"role": "user", "content": tresc}],
            "output_config": {"effort": "low", "format": {"type": "json_schema", "schema": SCHEMA}}}})
    return out


def brak_eksportu():
    sys.exit(f"Brak eksportu lekcji BM w {os.path.relpath(a.lekcje, ROOT)}/ (docs/lekcje-v4/eksport.js na zalogowanej stronie). "
             "Bez niego K1 i K2 nie mają źródła.")


if a.krok == "k1":
    if not BM:
        brak_eksportu()
    if not MAPA:
        sys.exit(f"Brak mapy {os.path.relpath(MAPA_P, ROOT)} (Etap C: mapa-tematow.py).")
    prz = przypisania()
    for i, (p, _) in prz.items():
        d = k1_dokument(BM[i], p)
        json.dump(d, open(os.path.join(PACZKI, d["id"] + ".json"), "w"), ensure_ascii=False, indent=1)
    tymcz = " (mapa TYMCZASOWA: całe przedmioty BM)" if any(m.get("tymczasowa") for m in MAPA) else ""
    sys.exit(print(f"K1: {len(prz)} lekcji skopiowanych do {os.path.relpath(PACZKI, ROOT)}{tymcz}, 0 zł. Teksty EN czekają na K2."))

if a.krok == "sylref":
    # Dopisuje sylRef (tematy sylabusa kierunku z mapy) do gotowych plików lekcji, które go nie mają. 0 zł, bez modelu.
    przypisania()
    KAT = a.katalog or PACZKI
    for f in sorted(os.listdir(KAT)):
        if f.endswith(".json"):
            pth = os.path.join(KAT, f); d = json.load(open(pth))
            bid = (d.get("zrodlo") or "")[3:]
            if bid in BM and not d.get("sylRef"):
                d["sylRef"] = syl_ref(bid); json.dump(d, open(pth, "w"), ensure_ascii=False, indent=1)
                print(f"  {d['id']}: {d['sylRef']}")
    sys.exit(0)

if a.krok == "tytuly":
    # Jedno małe zapytanie: tytuły gotowych lekcji K2, które mają jeszcze tytuł z BM (tytuł był kiedyś poza tłumaczeniem).
    KAT = a.katalog or PACZKI
    pliki = []
    for f in sorted(os.listdir(KAT)):
        if f.endswith(".json"):
            d = json.load(open(os.path.join(KAT, f)))
            src = BM.get((d.get("zrodlo") or "")[3:])
            if d.get("k2") == "gotowe" and src and d.get("title") == src.get("title"):
                pliki.append((f, d))
    PT = os.path.join(OUT, "tytuly-batch.json")
    SCH = {"type": "object", "additionalProperties": False, "required": ["tytuly"], "properties": {"tytuly": {"type": "array", "items": {
        "type": "object", "additionalProperties": False, "required": ["id", "v"], "properties": {"id": {"type": "string"}, "v": {"type": "string"}}}}}}
    Z_T = ("Tłumaczysz tytuły lekcji z kierunku Business Management (EN) na polski, dla studentów kierunku " + K["kierunek"]["pl"] +
           ". Krótko, jak tytuł rozdziału w polskim podręczniku; zachowaj dwukropek i strukturę. Dla każdego id zwróć {id, v}.")
    if not a.odbierz:
        if not pliki:
            sys.exit("Brak lekcji z tytułem BM do tłumaczenia w " + os.path.relpath(KAT, ROOT))
        tresc = json.dumps([{"id": d["id"], "t": d["title"]} for _, d in pliki], ensure_ascii=False)
        zq = {"custom_id": "tytuly", "params": {"model": a.model, "max_tokens": 2000, "system": Z_T, "messages": [{"role": "user", "content": tresc}],
                                                 "output_config": {"format": {"type": "json_schema", "schema": SCH}}}}
        cin, cout = CENY[a.model]
        usd = ((len(Z_T) + len(tresc)) / 3 * cin + len(tresc) / 3 * 1.5 * cout) / 1e6 * BATCH
        print(f"Tytuły ({a.model}, Batch): {len(pliki)} lekcji → ~{usd:.4f} $")
        if not a.wyslij:
            sys.exit(print("Wysyłka: tytuly --wyslij (po „wysyłaj” Bartka)"))
        import anthropic  # noqa: E402
        b = anthropic.Anthropic().messages.batches.create(requests=[zq])
        json.dump({"id": b.id, "model": a.model, "katalog": KAT}, open(PT, "w"))
        sys.exit(print("Wysłano batch", b.id, "– potem: tytuly --odbierz"))
    import anthropic  # noqa: E402
    st = json.load(open(PT)); client = anthropic.Anthropic()
    b = client.messages.batches.retrieve(st["id"])
    if b.processing_status != "ended":
        sys.exit(print("Jeszcze trwa:", b.processing_status))
    r = next(iter(client.messages.batches.results(b.id)))
    if r.result.type != "succeeded":
        sys.exit("Błąd: " + r.result.type)
    m = r.result.message
    w = {x["id"]: x["v"] for x in json.loads(next(c.text for c in m.content if c.type == "text"))["tytuly"]}
    n = 0
    for f in sorted(os.listdir(st["katalog"])):
        if f.endswith(".json"):
            pth = os.path.join(st["katalog"], f); d = json.load(open(pth))
            if d.get("id") in w and w[d["id"]].strip():
                d["title"] = w[d["id"]].strip(); d["kopiaHash"] = odcisk(d); json.dump(d, open(pth, "w"), ensure_ascii=False, indent=1); n += 1
                print(f"  {d['id']}: {d['title']}")
    cin, cout = CENY[st["model"]]
    usd = (m.usage.input_tokens * cin + m.usage.output_tokens * cout) / 1e6 * BATCH
    sys.exit(print(f"Tytuły: {n} zapisanych, koszt {usd:.4f} $"))

if a.krok == "porownaj":
    zle = 0
    for f in sorted(os.listdir(PACZKI)):
        d = json.load(open(os.path.join(PACZKI, f)))
        if d.get("k2") != "gotowe":
            continue
        r = porownaj(BM[d["zrodlo"][3:]], d)
        zle += bool(r)
        print(("✗ " if r else "✓ ") + d["id"] + ("".join("\n    " + x for x in r)))
    sys.exit(1 if zle else 0)

# K2
if not BM:
    brak_eksportu()
prz = przypisania()
ids = wybrane(prz)
if not ids:
    sys.exit("Brak lekcji K2 do zrobienia w mapie" + (f" ({a.przedmioty})" if a.przedmioty else "") + " – wszystkie gotowe albo mapa nie ma K2." if a.wszystkie
             else f"Brak lekcji BM przypisanych do „{a.przedmiot}” w mapie (koszyk K2).")
zap = [z for i in ids for z in zapytania_lekcji(i, *prz.get(i, (a.przedmiot, [])))]
PB = os.path.join(OUT, "k2-batch.json")

if a.na_sucho or not (a.wyslij or a.odbierz):
    with open(os.path.join(OUT, "k2-zapytania.jsonl"), "w") as f:
        for z in zap:
            f.write(json.dumps(z, ensure_ascii=False) + "\n")
    cin, cout = CENY[a.model]
    t_in = sum(len(z["params"]["messages"][0]["content"]) for z in zap) / 3 + len(ZASADY) / 3 * (1 + 0.1 * (len(zap) - 1))
    # ×2,1: pilot Zarządzania 8.11.2026 (PL dłuższy + ścieżki w JSON odpowiedzi): 52,9 tys. tokenów wyjścia przy szacunku 29 tys. z ×1,15
    t_out = sum(len(json.dumps([s for _, s in teksty(BM[i]["content"])], ensure_ascii=False)) * 2.1 for i in ids) / 3
    usd = (t_in * cin + t_out * cout) / 1e6 * BATCH
    print(f"K2 na sucho ({a.model}, Batch −50%): {len(ids)} lekcji ({len(zap)} zapytań): {', '.join(ids)}")
    print(f"Szacunek: ~{int(t_in)} tokenów wejścia, ~{int(t_out)} wyjścia → ~{usd:.3f} $ (≈ {usd / len(ids):.3f} $ na lekcję)")
    sys.exit(print("Wysyłka: --wyslij (po „wysyłaj” Bartka)"))

import anthropic  # noqa: E402  (tylko przy wysyłce)
client = anthropic.Anthropic()
if a.wyslij:
    b = client.messages.batches.create(requests=zap)
    json.dump({"id": b.id, "model": a.model, "ids": ids}, open(PB, "w"))
    sys.exit(print("Wysłano batch", b.id, "– potem: k2 --odbierz"))

stan = json.load(open(PB))
b = client.messages.batches.retrieve(stan["id"])
if b.processing_status != "ended":
    sys.exit(print("Jeszcze trwa:", b.processing_status, dict(b.request_counts)))
usage, bledy = {"input": 0, "output": 0, "cache_write": 0, "cache_read": 0}, []
dost, uwagi = {}, {}
for r in client.messages.batches.results(b.id):
    lid = r.custom_id.rsplit("--", 1)[0]
    if r.result.type != "succeeded" or r.result.message.stop_reason != "end_turn":
        bledy.append(f"{r.custom_id}: {r.result.type}"); continue
    m = r.result.message
    u = m.usage
    usage["input"] += u.input_tokens; usage["output"] += u.output_tokens
    usage["cache_write"] += u.cache_creation_input_tokens or 0; usage["cache_read"] += u.cache_read_input_tokens or 0
    w = json.loads(next(c.text for c in m.content if c.type == "text"))
    dost.setdefault(lid, {}).update({x["p"]: x["v"] for x in w["teksty"]})
    if w.get("uwaga"):
        uwagi.setdefault(lid, []).append(w["uwaga"])
for lid in stan["ids"]:
    src = BM[lid]
    d = k1_dokument(src, prz.get(lid, (a.przedmiot, []))[0])
    oczek = {p for p, _ in teksty(src["content"])}
    got = dost.get(lid, {})
    for p, v in got.items():
        if p in oczek:
            ustaw(d["content"], p, v)
    if got.get(TYTUL):
        d["title"] = got[TYTUL]
    elif src.get("title"):
        bledy.append(f"{lid}: tytuł bez tłumaczenia")
    d["k2"] = "gotowe" if oczek <= set(got) else "niepełne"
    d["uwaga"] = " ".join(uwagi.get(lid, []))
    if d["k2"] != "gotowe":
        bledy.append(f"{lid}: brak {len(oczek - set(got))} tekstów")
    roznice = porownaj(src, d)
    if roznice:
        bledy.append(f"{lid}: " + "; ".join(roznice[:5]))
    d["kopiaHash"] = odcisk(d)   # zapis automatu: odcisk kopii po K2 (ręczna poprawka później = zmiana kopii)
    json.dump(d, open(os.path.join(PACZKI, d["id"] + ".json"), "w"), ensure_ascii=False, indent=1)
cin, cout = CENY[stan["model"]]
usage["usd"] = round((usage["input"] * cin + usage["cache_write"] * cin * 1.25 + usage["cache_read"] * cin * 0.1 + usage["output"] * cout) / 1e6 * BATCH, 4)
json.dump(usage, open(os.path.join(OUT, "k2-usage.json"), "w"), indent=1)
print("K2:", len(stan["ids"]), "lekcji, koszt", usage["usd"], "$", ("\nDo poprawy: " + "\n  ".join(bledy)) if bledy else "– porównanie ze źródłem OK")
