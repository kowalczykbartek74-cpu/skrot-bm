"""Etap D/E schematu kierunków: lekcje nowego kierunku z lekcji BM (koszyki K1 i K2), bez pisania treści w czacie.

  python3 scripts/lekcje-z-bm.py kierunki/<rocznik>.json k1                       # K1: kopia części niezależnych od języka, 0 zł
  python3 scripts/lekcje-z-bm.py kierunki/<rocznik>.json k2 --na-sucho [--tylko id,id] [--przedmiot p] [--ile 2]
  python3 scripts/lekcje-z-bm.py kierunki/<rocznik>.json k2 --wyslij   …           # dopiero po „wysyłaj” Bartka
  python3 scripts/lekcje-z-bm.py kierunki/<rocznik>.json k2 --odbierz              # wyniki → paczki + porównanie ze źródłem

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
ap.add_argument("krok", choices=["k1", "k2", "porownaj"])
ap.add_argument("--na-sucho", action="store_true")
ap.add_argument("--wyslij", action="store_true")
ap.add_argument("--odbierz", action="store_true")
ap.add_argument("--tylko", default="")
ap.add_argument("--przedmiot", default="podstawy-zarzadzania")
ap.add_argument("--ile", type=int, default=2)
ap.add_argument("--model", default="claude-sonnet-5-5")
ap.add_argument("--lekcje", default=os.path.join(ROOT, "scratch", "lessons"))
ap.add_argument("--wyjscie", default=None)
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
    for m in MAPA:
        for t in m["tematy"]:
            if t.get("koszyk") not in ("K1", "K2"):
                continue
            for z in t.get("zrodlo") or []:
                ids = ([i for i, d in BM.items() if d.get("subjectId") == z[3:]] if z.startswith("bm:")
                       else lekcje_tematu(z) if z.startswith("bm-syl:") else ([z] if z in BM else []))
                for i in ids:
                    p, tem = out.setdefault(i, (m["przedmiot"], []))
                    if t["temat"] not in tem:
                        tem.append(t["temat"])
    return out


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


def k1_dokument(bm, przedmiot):
    return {"id": nowe_id(bm["id"]), "subjectId": przedmiot, "rocznik_id": K["id"], "zrodlo": "bm:" + bm["id"],
            "title": bm.get("title", ""), "order": bm.get("order"), "k2": "do zrobienia", "content": copy.deepcopy(bm["content"])}


LICZBY = re.compile(r"-?\d+(?:[.,]\d+)?")


def liczby(s):
    return sorted(x.replace(",", ".") for x in LICZBY.findall(s or ""))


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
        if p in nowe and liczby(t) != liczby(nowe[p]):
            r.append(f"{p}: liczby {liczby(t)} → {liczby(nowe[p])}")
        if p in nowe and sorted(re.findall(r"\{\w+\}", t)) != sorted(re.findall(r"\{\w+\}", nowe[p])):
            r.append(f"{p}: inne zmienne {{…}} niż w BM")
    return r


ZASADY = """Tłumaczysz lekcję z kierunku Business Management (po angielsku) na lekcję dla studentów Zarządzania (po polsku, Uniwersytet Szczeciński).
Dostajesz listę tekstów lekcji jako pary {p: ścieżka, t: tekst EN} i tematy z sylabusa Zarządzania, do których lekcja jest przypisana.
Zwracasz dla KAŻDEJ ścieżki tekst po polsku: {p: ta sama ścieżka, v: tekst PL}. Nie dodajesz ani nie usuwasz ścieżek.
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
    ids = sorted((i for i, (p, _) in prz.items() if p == a.przedmiot), key=lambda i: (BM[i].get("order") is None, BM[i].get("order") or 0, i))
    return ids[: a.ile]


def zapytanie(bm_id, przedmiot, tematy):
    t = teksty(BM[bm_id]["content"])
    tresc = json.dumps({"lekcjaBM": BM[bm_id].get("title", ""), "przedmiotZarz": przedmiot, "tematySylabusa": tematy,
                        "teksty": [{"p": p, "t": s} for p, s in t]}, ensure_ascii=False)
    return {"custom_id": bm_id, "params": {
        "model": a.model, "max_tokens": 32000,
        "system": [{"type": "text", "text": ZASADY, "cache_control": {"type": "ephemeral"}}],
        "messages": [{"role": "user", "content": tresc}],
        "output_config": {"effort": "low", "format": {"type": "json_schema", "schema": SCHEMA}}}}


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
    sys.exit(f"Brak lekcji BM przypisanych do „{a.przedmiot}” w mapie (koszyk K2).")
zap = [zapytanie(i, *prz.get(i, (a.przedmiot, []))) for i in ids]
PB = os.path.join(OUT, "k2-batch.json")

if a.na_sucho or not (a.wyslij or a.odbierz):
    with open(os.path.join(OUT, "k2-zapytania.jsonl"), "w") as f:
        for z in zap:
            f.write(json.dumps(z, ensure_ascii=False) + "\n")
    cin, cout = CENY[a.model]
    t_in = sum(len(ZASADY) + len(z["params"]["messages"][0]["content"]) for z in zap) / 3
    t_out = sum(len(json.dumps([s for _, s in teksty(BM[i]["content"])], ensure_ascii=False)) * 1.15 for i in ids) / 3
    usd = (t_in * cin + t_out * cout) / 1e6 * BATCH
    print(f"K2 na sucho ({a.model}, Batch −50%): {len(ids)} lekcji: {', '.join(ids)}")
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
for r in client.messages.batches.results(b.id):
    if r.result.type != "succeeded" or r.result.message.stop_reason != "end_turn":
        bledy.append(f"{r.custom_id}: {r.result.type}"); continue
    m = r.result.message
    u = m.usage
    usage["input"] += u.input_tokens; usage["output"] += u.output_tokens
    usage["cache_write"] += u.cache_creation_input_tokens or 0; usage["cache_read"] += u.cache_read_input_tokens or 0
    w = json.loads(next(c.text for c in m.content if c.type == "text"))
    src = BM[r.custom_id]
    d = k1_dokument(src, prz.get(r.custom_id, (a.przedmiot, []))[0])
    oczek = {p for p, _ in teksty(src["content"])}
    dost = {x["p"]: x["v"] for x in w["teksty"]}
    for p, v in dost.items():
        if p in oczek:
            ustaw(d["content"], p, v)
    d["k2"] = "gotowe" if oczek <= set(dost) else "niepełne"
    d["uwaga"] = w.get("uwaga", "")
    if d["k2"] != "gotowe":
        bledy.append(f"{r.custom_id}: brak {len(oczek - set(dost))} tekstów")
    roznice = porownaj(src, d)
    if roznice:
        bledy.append(f"{r.custom_id}: " + "; ".join(roznice[:5]))
    json.dump(d, open(os.path.join(PACZKI, d["id"] + ".json"), "w"), ensure_ascii=False, indent=1)
cin, cout = CENY[stan["model"]]
usage["usd"] = round((usage["input"] * cin + usage["cache_write"] * cin * 1.25 + usage["cache_read"] * cin * 0.1 + usage["output"] * cout) / 1e6 * BATCH, 4)
json.dump(usage, open(os.path.join(OUT, "k2-usage.json"), "w"), indent=1)
print("K2:", len(stan["ids"]), "lekcji, koszt", usage["usd"], "$", ("\nDo poprawy: " + "\n  ".join(bledy)) if bledy else "– porównanie ze źródłem OK")
