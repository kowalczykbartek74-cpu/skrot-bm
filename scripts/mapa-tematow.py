"""Mapa tematów nowego kierunku (spec „Schemat robienia kierunków”, Etap C, sekcja 4.1).

Dla każdego przedmiotu z pliku kierunku: tematy z sylabusa kierunku i kandydaci (1) z banku PL (pole „bank”: przedmioty
ogólne; zatwierdzone lekcje z zdawalni-tresci/bank, a zanim bank powstanie: tematy tego przedmiotu z wcześniejszego kierunku PL
z kierunki/*.json, oznaczone „czeka na zatwierdzenie”), (2) z BM (lekcje z eksportu docs/lekcje-v4/eksport.js, a bez eksportu
tematy z sylabus.json BM). Jedno małe zapytanie na przedmiot (Batch API, połowa ceny, zasady w cache) przypisuje każdemu
tematowi koszyk K1 (jest w banku PL: kopia), K2 (jest w BM: tłumaczenie) albo K3 (nowa lekcja) i źródła.
Przedmiot bez banku i bez BM dostaje K3 od razu, bez zapytania (0 zł). Przedmiot bez karty w sylabusie kierunku
bierze tematy z sylabusa pierwszego przedmiotu BM (uwaga w mapie). Skrypt nie pisze treści lekcji.

  python3 scripts/mapa-tematow.py kierunki/<id>.json --na-sucho      zapytania + tokeny + koszt, nic nie wysyła
  python3 scripts/mapa-tematow.py kierunki/<id>.json --wyslij        wysyła Batch (ANTHROPIC_API_KEY albo ant auth login)
  python3 scripts/mapa-tematow.py kierunki/<id>.json --odbierz       wyniki → scratch/<prefiks>/mapa.json + mapa.html
  python3 scripts/mapa-tematow.py kierunki/<id>.json --html          tylko odśwież mapa.html z mapa.json
  python3 scripts/mapa-tematow.py kierunki/<id>.json --bez-api       mapa tymczasowa, 0 zł (bank: dopasowanie słów PL↔PL;
                                                                      BM: koszyk całego przedmiotu z pliku kierunku)
Opcje: --bank <katalog banku PL> (domyślnie ../zdawalni-tresci/bank obok repo), --model claude-haiku-5-5 (domyślnie, zadanie klasyfikacji), --lekcje <katalog eksportu lekcji BM> (domyślnie scratch/lessons).
Wymaga do wysyłki: pip install anthropic. Wszystko w scratch/ (poza gitem).
"""
import argparse, glob, html, json, os, re, sys, unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser()
ap.add_argument("kierunek")
ap.add_argument("--na-sucho", action="store_true")
ap.add_argument("--wyslij", action="store_true")
ap.add_argument("--odbierz", action="store_true")
ap.add_argument("--html", action="store_true")
ap.add_argument("--bez-api", action="store_true", help="mapa tymczasowa bez modelu: koszyk całego przedmiotu z pliku kierunku")
ap.add_argument("--model", default="claude-haiku-5-5")
ap.add_argument("--lekcje", default=os.path.join(ROOT, "scratch", "lessons"))
ap.add_argument("--bank", default=os.path.join(os.path.dirname(ROOT), "zdawalni-tresci", "bank"))
a = ap.parse_args()

# $/MTok (wejście, wyjście) bez rabatu; Batch API = połowa. Sprawdź przed dużą wysyłką: https://platform.claude.com/docs/en/about-claude/pricing
CENY = {"claude-haiku-5-5": (0.10, 0.50), "claude-sonnet-5-5": (2.00, 10.00), "claude-opus-5-5": (4.00, 20.00)}
BATCH = 0.5

K = json.load(open(os.path.join(ROOT, a.kierunek) if not os.path.isabs(a.kierunek) else a.kierunek))
OUT = os.path.join(ROOT, "scratch", K["prefiks"])
os.makedirs(OUT, exist_ok=True)
SYL = {c["id"]: c for c in json.load(open(os.path.join(ROOT, K["sylabus"]["plik"])))["courses"]}
# Kierunek prowadzony po angielsku (jezykZajec "en", np. Economics and IT Applications): lekcje BM są w tym samym języku,
# więc temat, który BM ma, to K1 (kopia 1:1, 0 zł), a nie K2 (tłumaczenie). Bank PL (lekcje polskie) wtedy nie jest źródłem:
# tłumaczenia PL→EN skrypty nie robią, taki temat to K3 (nowa lekcja EN, wzorcem lekcje BM).
EN = K.get("jezykZajec", "pl") == "en"
BM_SYL = {c["id"]: c for c in json.load(open(os.path.join(ROOT, "sylabus.json")))["courses"]}


def slug(s):
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").replace("ł", "l")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def tematy_kierunku(pid):
    """Tematy z karty przedmiotu. Bez karty (wydział jej nie opublikował): tematy z sylabusa pierwszego przedmiotu BM, z uwagą."""
    c = SYL.get(pid)
    uwaga = ""
    if not c:
        bm = (K["przedmioty"][pid].get("bm") or [None])[0]
        if bm not in BM_SYL:
            sys.exit(f"Brak karty „{pid}” w {K['sylabus']['plik']} (Etap B) i brak przedmiotu BM, z którego można wziąć tematy.")
        c, uwaga = BM_SYL[bm], f"brak karty w sylabusie kierunku – temat z sylabusa BM ({bm})"
    out = []
    for forma, lista in c["topics"].items():
        for t in lista:
            out.append({"temat": t["t"], "forma": forma, "godz": t.get("h"), **({"bezKarty": uwaga} if uwaga else {})})
    return out


def nazwa(pid):
    return SYL[pid]["pl"] if pid in SYL else pid.replace("-", " ").capitalize()


# ---------- bank PL ----------
def bank_kandydaci(ogolne):
    if EN:
        return []   # bank to lekcje PL; kierunek po angielsku bierze kopie wprost z BM
    """Kandydaci z banku: zatwierdzone pliki z bank/indeks.json (status „zatwierdzone”), a dla przedmiotów, których bank
    jeszcze nie ma: tematy z sylabusa wcześniejszego kierunku PL, który ma ten przedmiot (status „czeka”)."""
    out = []
    ind = os.path.join(a.bank, "indeks.json")
    wpisy = json.load(open(ind)) if os.path.exists(ind) else {}
    wpisy = wpisy.get("tematy", wpisy) if isinstance(wpisy, dict) else {}
    for og in ogolne:
        zatw = [(k, v) for k, v in wpisy.items() if k.split("/")[0] == og]
        if zatw:
            out += [{"id": "bank:" + k, "zrodloTyp": "bank", "status": "zatwierdzone", "tytul": v.get("temat") or k} for k, v in zatw]
            continue
        for f in sorted(glob.glob(os.path.join(ROOT, "kierunki", "*.json"))):
            inny = json.load(open(f))
            if inny.get("id") == K["id"] or inny.get("jezykZajec") != "pl":
                continue
            # przedmiot tamtego kierunku o tej samej nazwie ogólnej albo przypisany do niej polem „bank” (np. Arkusz kalkulacyjny → TI)
            pid_inny = next((p for p, v in (inny.get("przedmioty") or {}).items() if p == og or og in (v.get("bank") or [])), None)
            if not pid_inny:
                continue
            plik = os.path.join(ROOT, (inny.get("sylabus") or {}).get("plik") or "")
            if not os.path.isfile(plik):
                continue
            karta = next((c for c in json.load(open(plik))["courses"] if c["id"] == pid_inny), None)
            if not karta:
                continue
            n = 0
            for forma, lista in karta["topics"].items():
                for t in lista:
                    n += 1
                    out.append({"id": f"{inny['prefiks']}-syl:{og}:{forma}:{n}", "zrodloTyp": "bank", "status": "czeka na zatwierdzenie " + inny["prefiks"], "tytul": t["t"]})
    return out


STOP = {"oraz", "jako", "przez", "wybrane", "wybranych", "podstawy", "podstawowe", "zasady", "istota", "pojecie", "pojecia", "rodzaje", "znaczenie", "dla", "jego", "ich",
        # te same słowa po angielsku (kierunek po angielsku: tematy EN ↔ tematy sylabusa BM)
        "with", "from", "into", "their", "basic", "basics", "selected", "concept", "concepts", "types", "role", "introduction", "principles", "overview"}


def rdzenie(s):
    return {w[:5] for w in slug(s).split("-") if len(w) >= 4 and w not in STOP}


def podobne(t1, t2, waga=None):
    """Dopasowanie PL↔PL bez modelu (tylko --bez-api): wspólne rdzenie słów (5 liter), ważone rzadkością rdzenia wśród
    kandydatów (częste słowa przedmiotu, np. jego nazwa, prawie się nie liczą); wynik 0–1 względem krótszego tematu."""
    r1, r2 = rdzenie(t1), rdzenie(t2)
    if not r1 or not r2:
        return 0
    w = waga or {}
    suma = lambda r: sum(w.get(x, 1.0) for x in r)
    wsp = r1 & r2
    if len(wsp) < 2 and r1 != r2:
        return 0
    return suma(wsp) / min(suma(r1), suma(r2))


# Kandydaci z BM: lekcje z eksportu (id, tytuł, atomy) albo tematy z sylabusa BM.
LEKCJE = []
for f in sorted(glob.glob(os.path.join(a.lekcje, "*.json"))):
    try:
        d = json.load(open(f))
    except Exception:
        continue
    les = (d.get("content") or {}).get("lesson") or {}
    LEKCJE.append({"id": d["id"], "subjectId": d.get("subjectId"), "title": d.get("title", ""),
                   "atomy": [x.get("t", "") for x in les.get("atoms", []) if isinstance(x, dict)]})


def kandydaci(bm_ids):
    out = []
    for sid in bm_ids:
        if sid not in BM_SYL:
            sys.exit(f"Przedmiotu BM „{sid}” nie ma w sylabus.json (slugi BM bierz z sylabus.json).")
        les = [l for l in LEKCJE if l["subjectId"] == sid]
        if les:
            out += [{"id": l["id"], "zrodloTyp": "BM", "przedmiotBM": sid, "tytul": l["title"], "atomy": l["atomy"][:12]} for l in les]
        else:
            n = 0
            for forma, lista in BM_SYL[sid]["topics"].items():
                for t in lista:
                    n += 1
                    out.append({"id": f"bm-syl:{sid}:{forma}:{n}", "zrodloTyp": "BM", "przedmiotBM": sid, "tytul": t["t"]})
    return out


ZASADY_EN = """Mapujesz tematy przedmiotu z nowego kierunku studiów prowadzonego PO ANGIELSKU na istniejące lekcje kierunku
Business Management (też po angielsku; kandydaci mają zrodloTyp "BM"). Dla każdego tematu z listy „tematy” zwróć:
- koszyk "K1", gdy kandydat "BM" ma tę samą treść (pokrywa większość tematu) – lekcję BM skopiujemy bez zmian;
- koszyk "K3", gdy żaden kandydat jej nie ma albo pokrywa ją tylko w małej części – powstanie nowa lekcja;
- zrodlo: id kandydatów (dokładnie tak, jak w liście) dla K1; dla K3 pusta lista;
- uwaga: jedno krótkie zdanie po polsku tylko wtedy, gdy przypisanie jest niepewne albo kandydat pokrywa temat częściowo; inaczej pusty napis.
Nie używaj koszyka "K2". Nie wymyślaj id. Zwróć każdy temat dokładnie raz, z jego numerem i."""

ZASADY = """Mapujesz tematy przedmiotu z nowego kierunku studiów (po polsku) na istniejące treści. Kandydaci mają zrodloTyp:
"bank" = polskie lekcje (albo tematy) z innego kierunku tej uczelni, "BM" = lekcje kierunku Business Management po angielsku.
Dla każdego tematu z listy „tematy” zwróć:
- koszyk "K1", gdy kandydat "bank" ma tę samą treść (pokrywa większość tematu) – polską lekcję skopiujemy; K1 ma pierwszeństwo, nawet jeśli BM też ma ten temat;
- koszyk "K2", gdy nie ma go w banku, ale kandydat "BM" ma tę samą treść (różnica języka nie ma znaczenia) – lekcję BM przetłumaczymy i dostosujemy;
- koszyk "K3", gdy nigdzie nie ma takiej treści – powstanie nowa lekcja;
- zrodlo: id kandydatów (dokładnie tak, jak w liście), z których powstanie lekcja: dla K1 tylko "bank", dla K2 tylko "BM", dla K3 pusta lista;
- uwaga: jedno krótkie zdanie po polsku tylko wtedy, gdy przypisanie jest niepewne albo kandydat pokrywa temat częściowo; inaczej pusty napis.
Nie wymyślaj id. Zwróć każdy temat dokładnie raz, z jego numerem i."""

SCHEMA = {
    "type": "object", "additionalProperties": False, "required": ["tematy"],
    "properties": {"tematy": {"type": "array", "items": {
        "type": "object", "additionalProperties": False, "required": ["i", "koszyk", "zrodlo", "uwaga"],
        "properties": {"i": {"type": "integer"}, "koszyk": {"type": "string", "enum": ["K1", "K2", "K3"]},
                       "zrodlo": {"type": "array", "items": {"type": "string"}}, "uwaga": {"type": "string"}}}}},
}


def zapytanie(pid, tem, kand):
    tresc = {"kierunek": K["kierunek"]["pl"], "przedmiot": nazwa(pid),
             "tematy": [{"i": i, "temat": t["temat"], "forma": t["forma"]} for i, t in enumerate(tem)],
             "kandydaci": [{k: v for k, v in x.items() if k != "status"} for x in kand]}
    return {"custom_id": pid, "params": {
        "model": a.model, "max_tokens": 8000,
        "output_config": {"effort": "low", "format": {"type": "json_schema", "schema": SCHEMA}},
        "system": [{"type": "text", "text": ZASADY_EN if EN else ZASADY, "cache_control": {"type": "ephemeral"}}],
        "messages": [{"role": "user", "content": json.dumps(tresc, ensure_ascii=False)}],
    }}


# ---------- przygotowanie ----------
plan, bez_api = [], {}
for pid, p in K["przedmioty"].items():
    tem = tematy_kierunku(pid)
    kand = bank_kandydaci(p.get("bank") or []) + kandydaci(p.get("bm") or [])
    if not kand:
        bez_api[pid] = [{**t, "koszyk": "K3", "zrodlo": [], "uwaga": "brak w banku i w BM"} for t in tem]
        continue
    plan.append((pid, tem, kand))
STATUS = {k["id"]: k.get("status") for _, _, kk in plan for k in kk}


def z_uwagami(t, uw):
    """Uwaga tematu + brak karty + status banku (K1 z niezatwierdzonego kierunku czeka na jego zatwierdzenie)."""
    st = sorted({STATUS.get(z) for z in t["zrodlo"] if STATUS.get(z) and STATUS.get(z) != "zatwierdzone"})
    t = {**t, "uwaga": "; ".join(x for x in [uw, t.get("bezKarty", "")] if x)}
    if t["koszyk"] == "K1":
        t["bank"] = st[0] if st else "zatwierdzone"
    return t
zapytania = [zapytanie(pid, tem, kand) for pid, tem, kand in plan]


def koszt():
    cin, cout = CENY.get(a.model, (None, None))
    tok_in = sum(len(json.dumps(z["params"]["system"], ensure_ascii=False)) + len(z["params"]["messages"][0]["content"]) for z in zapytania) / 3
    tok_out = sum(len(tem) * 45 + 200 for _, tem, _ in plan)   # ok. 45 tokenów na temat (JSON) + zapas na myślenie przy effort low
    usd = None if cin is None else (tok_in * cin + tok_out * cout) / 1e6 * BATCH
    return int(tok_in), int(tok_out), usd


def pewny(t, tymczasowa=False):
    """Wiersz, którego nie trzeba oglądać (optymalizacja nr 5): mapa z modelu, model nie dodał uwagi, koszyk ma źródło (K3 nie musi),
    a K1 bierze tylko zatwierdzone lekcje banku. Reszta = „do przejrzenia” (filtr w mapa.html, licznik w raporcie kierunek-start)."""
    k = t.get("koszyk")
    return (not tymczasowa and k in ("K1", "K2", "K3") and not (t.get("uwaga") or "").strip()
            and (k == "K3" or bool(t.get("zrodlo"))) and (k != "K1" or t.get("bank") == "zatwierdzone"))


def oznacz_pewne(mapa):
    for m in mapa:
        for t in m["tematy"]:
            t["pewny"] = pewny(t, m.get("tymczasowa"))
    return mapa


def html_mapy(mapa):
    oznacz_pewne(mapa)
    wiersze = []
    for m in mapa:
        for j, t in enumerate(m["tematy"]):
            opt = "".join(f'<option{" selected" if t["koszyk"] == k else ""}>{k}</option>' for k in ("K1", "K2", "K3"))
            wiersze.append(f'<tr class="{t["koszyk"]}{" pewny" if t["pewny"] else ""}"><td>{html.escape(nazwa(m["przedmiot"]))}</td><td>{html.escape(t["temat"])}</td><td>{html.escape(t.get("forma") or "")}</td>'
                           f'<td>{t.get("godz") or ""}</td><td><select data-p="{m["przedmiot"]}" data-j="{j}">{opt}</select></td>'
                           f'<td>{html.escape(", ".join(t["zrodlo"]))}</td><td>{html.escape(t.get("bank") or "")}</td><td>{html.escape(t.get("uwaga") or "")}</td></tr>')
    licz = {k: sum(t["koszyk"] == k for m in mapa for t in m["tematy"]) for k in ("K1", "K2", "K3")}
    egz = {c["id"] for c in SYL.values() if any(f["s"] == 1 and f["c"] == "e" for f in c["forms"])} | set(K.get("egzaminyBezKarty") or [])
    podsum = "".join(f'<tr><td>{html.escape(nazwa(m["przedmiot"]))}{" <b>(egzamin)</b>" if m["przedmiot"] in egz else ""}</td>'
                     + "".join(f'<td>{sum(t["koszyk"] == k for t in m["tematy"])}</td>' for k in ("K1", "K2", "K3")) + "</tr>" for m in mapa)
    return f"""<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mapa tematów {html.escape(K["kierunek"]["pl"])}</title><style>
body{{font:15px/1.45 system-ui,sans-serif;margin:16px;color:#16231b;background:#fff}} table{{border-collapse:collapse;width:100%}}
td,th{{border-bottom:1px solid #dfe8e2;padding:6px 8px;text-align:left;vertical-align:top}} th{{background:#eef6f0;position:sticky;top:0}}
select{{font:inherit;min-height:36px}} button{{font:inherit;padding:10px 16px;border:0;border-radius:10px;background:#1a7f45;color:#fff;min-height:44px}}
.wrap{{overflow-x:auto}} tr.K1 td:nth-child(5){{background:#eaf5ee}} tr.K3 td:nth-child(5){{background:#fff4de}}
table.p{{width:auto;margin:0 0 16px}} table.p td:not(:first-child),table.p th:not(:first-child){{text-align:right}}</style></head><body>
<h1>Mapa tematów: {html.escape(K["kierunek"]["pl"])}</h1>
{'<p style="background:#fff4d6;padding:10px;border-radius:8px"><b>Mapa tymczasowa (bez API).</b> K1 z banku = dopasowanie słów PL↔PL; K2/K3 z BM = koszyk całego przedmiotu, nie tematu. Zastąp ją wynikiem --wyslij/--odbierz.</p>' if any(m.get("tymczasowa") for m in mapa) else ''}
<p>K2: {licz["K2"]} · K3: {licz["K3"]} · K1: {licz["K1"]}. Popraw koszyki i kliknij „Pobierz mapa.json”, potem podmień plik w scratch/{K["prefiks"]}/.</p>
<p>K1 = kopia z banku PL (0 zł), K2 = tłumaczenie lekcji BM, K3 = nowa lekcja. „Bank: czeka…” = temat wspólny z kierunkiem, którego lekcje nie są jeszcze zatwierdzone.</p>
<p><label style="display:inline-flex;gap:8px;align-items:center;min-height:44px"><input type="checkbox" id="tylko" style="width:22px;height:22px">
Pokaż tylko do przejrzenia ({sum(not t["pewny"] for m in mapa for t in m["tematy"])} z {sum(len(m["tematy"]) for m in mapa)}; pewne wiersze: model bez uwag, źródło jest)</label></p>
<style>body.tylko tr.pewny{{display:none}}</style>
<div class="wrap"><table class="p"><thead><tr><th>Przedmiot</th><th>K1</th><th>K2</th><th>K3</th></tr></thead><tbody>{podsum}</tbody></table></div>
<p><button id="dl">Pobierz mapa.json</button></p>
<div class="wrap"><table><thead><tr><th>Przedmiot</th><th>Temat (sylabus)</th><th>Forma</th><th>h</th><th>Koszyk</th><th>Źródło</th><th>Bank</th><th>Uwaga</th></tr></thead><tbody>
{"".join(wiersze)}</tbody></table></div>
<script>const MAPA={json.dumps(mapa, ensure_ascii=False)};
document.getElementById("tylko").onchange=(e)=>document.body.classList.toggle("tylko",e.target.checked);
document.getElementById("dl").onclick=()=>{{document.querySelectorAll("select").forEach(s=>{{MAPA.find(m=>m.przedmiot===s.dataset.p).tematy[+s.dataset.j].koszyk=s.value}});
const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(MAPA,null,1)],{{type:"application/json"}}));a.download="mapa.json";a.click()}};</script>
</body></html>"""


def zapisz_mape(wyniki):
    mapa = []
    for pid in K["przedmioty"]:
        if pid in bez_api:
            mapa.append({"przedmiot": pid, "tematy": [z_uwagami({**t, "uwaga": ""}, t["uwaga"]) for t in bez_api[pid]]}); continue
        tem = next(t for p, t, _ in plan if p == pid)
        ids = {k["id"] for p, _, kk in plan if p == pid for k in kk}
        w = {x["i"]: x for x in (wyniki.get(pid) or {}).get("tematy", [])}
        out = []
        for i, t in enumerate(tem):
            x = w.get(i)
            if not x:
                out.append({**t, "koszyk": "?", "zrodlo": [], "uwaga": "brak odpowiedzi modelu"}); continue
            zr = [z for z in x["zrodlo"] if z in ids]
            uw = x["uwaga"] + (" (odrzucone nieznane id: " + ", ".join(z for z in x["zrodlo"] if z not in ids) + ")" if len(zr) < len(x["zrodlo"]) else "")
            typ = {k["id"]: k["zrodloTyp"] for p, _, kk in plan if p == pid for k in kk}
            bank_z, bm_z = [z for z in zr if typ[z] == "bank"], [z for z in zr if typ[z] == "BM"]
            kosz = x["koszyk"]
            if EN:
                # po angielsku: K1 = kopia lekcji BM, reszta K3 (K2 nie ma, bo nie ma czego tłumaczyć)
                kosz = "K1" if kosz in ("K1", "K2") and bm_z else "K3"
                zr = bm_z if kosz == "K1" else []
            else:
                # K1 tylko ze źródłem z banku, K2 tylko z BM; inaczej koszyk o stopień niżej
                if kosz == "K1" and not bank_z:
                    kosz = "K2" if bm_z else "K3"
                if kosz == "K2" and not bm_z:
                    kosz = "K3"
                zr = bank_z if kosz == "K1" else bm_z if kosz == "K2" else []
            out.append(z_uwagami({**t, "koszyk": kosz, "zrodlo": zr}, uw.strip()))
        mapa.append({"przedmiot": pid, "tematy": out})
    json.dump(oznacz_pewne(mapa), open(os.path.join(OUT, "mapa.json"), "w"), ensure_ascii=False, indent=1)
    open(os.path.join(OUT, "mapa.html"), "w").write(html_mapy(mapa))
    return mapa


if a.html:
    mapa = json.load(open(os.path.join(OUT, "mapa.json")))
    open(os.path.join(OUT, "mapa.html"), "w").write(html_mapy(mapa))
    sys.exit(print("Zapisano", os.path.join(OUT, "mapa.html")))

if a.bez_api:
    # Tymczasowa mapa (0 zł): każdy temat dostaje koszyk przedmiotu z pliku kierunku, źródło = przedmiot BM, nie lekcja.
    # Zastępuje ją dopiero --wyslij/--odbierz. Skrypty Etapu D/E traktują „tymczasowa” jak niezatwierdzoną mapę.
    stara = os.path.join(OUT, "mapa.json")
    if os.path.exists(stara) and not all(m.get("tymczasowa") for m in json.load(open(stara))):
        sys.exit("scratch/" + K["prefiks"] + "/mapa.json to już mapa z modelu – nie nadpisuję jej mapą tymczasową.")
    mapa = []
    for pid, cfg in K["przedmioty"].items():
        bm = cfg.get("bm") or []
        if EN:
            # po angielsku: temat ↔ temat sylabusa BM po wspólnych słowach (EN↔EN, 0 zł); trafienie = K1 z lekcji tego tematu BM
            kand = [k for k in kandydaci(bm) if k["id"].startswith("bm-syl:")] if bm else []
            df = {}
            for k in kand:
                for r in rdzenie(k["tytul"]):
                    df[r] = df.get(r, 0) + 1
            import math
            waga = {r: math.log(1 + len(kand) / n) for r, n in df.items()}
            tem = []
            for t in tematy_kierunku(pid):
                traf = sorted(((podobne(t["temat"], k["tytul"], waga), k["id"]) for k in kand), reverse=True)
                if traf and traf[0][0] >= 0.5:
                    tem.append(z_uwagami({**t, "koszyk": "K1", "zrodlo": [i for w, i in traf if w >= 0.5][:3]}, "tymczasowo: dopasowanie słów z tematem sylabusa BM"))
                else:
                    tem.append(z_uwagami({**t, "koszyk": "K3", "zrodlo": []}, "brak w BM" if not bm else "tymczasowo: bez pewnego tematu BM"))
            mapa.append({"przedmiot": pid, "tymczasowa": True, "tematy": tem})
            continue
        bank = bank_kandydaci(cfg.get("bank") or [])
        kosz_bm = "K3" if not bm else ("K2" if cfg.get("koszyk") != "K3" else "K3")
        tem = []
        import math
        df = {}
        for b in bank:
            for r in rdzenie(b["tytul"]):
                df[r] = df.get(r, 0) + 1
        waga = {r: math.log(1 + len(bank) / n) for r, n in df.items()}
        for t in tematy_kierunku(pid):
            traf = sorted(((podobne(t["temat"], b["tytul"], waga), b["id"]) for b in bank), reverse=True)
            if traf and traf[0][0] >= 0.5:
                tem.append(z_uwagami({**t, "koszyk": "K1", "zrodlo": [i for w, i in traf if w >= 0.5][:3]}, "tymczasowo: dopasowanie słów z tematem z banku"))
            else:
                tem.append(z_uwagami({**t, "koszyk": kosz_bm, "zrodlo": ["bm:" + b for b in bm] if kosz_bm == "K2" else []},
                                     "tymczasowo bez API: przedmiot BM, nie konkretna lekcja" if kosz_bm == "K2" else ("brak w banku i w BM" if not bm else "")))
        mapa.append({"przedmiot": pid, "tymczasowa": True, "tematy": tem})
    json.dump(oznacz_pewne(mapa), open(os.path.join(OUT, "mapa.json"), "w"), ensure_ascii=False, indent=1)
    open(os.path.join(OUT, "mapa.html"), "w").write(html_mapy(mapa))
    licz = {k: sum(t["koszyk"] == k for m in mapa for t in m["tematy"]) for k in ("K1", "K2", "K3")}
    sys.exit(print("Mapa tymczasowa (bez API, 0 zł):", os.path.relpath(os.path.join(OUT, "mapa.html"), ROOT), licz,
                   "– prawdziwa mapa: --wyslij, potem --odbierz"))

if a.na_sucho or not (a.wyslij or a.odbierz):
    with open(os.path.join(OUT, "mapa-zapytania.jsonl"), "w") as f:
        for z in zapytania:
            f.write(json.dumps(z, ensure_ascii=False) + "\n")
    tin, tout, usd = koszt()
    zrodla = "lekcje z eksportu" if LEKCJE else "tematy z sylabus.json BM (brak eksportu lekcji w " + os.path.relpath(a.lekcje, ROOT) + ")"
    print(f"Na sucho ({a.model}, Batch −50%): {len(zapytania)} zapytań, {sum(len(t) for _, t, _ in plan)} tematów do przypisania; "
          f"bez API (K3 od razu): {', '.join(bez_api) or '—'}.")
    bank_n = sum(1 for _, _, kk in plan for k in kk if k["zrodloTyp"] == "bank")
    if bank_n:
        print(f"Kandydaci z banku PL: {bank_n} (" + ", ".join(sorted({k['status'] for _, _, kk in plan for k in kk if k['zrodloTyp'] == 'bank'})) + ").")
    print(f"Kandydaci BM: {zrodla}.")
    print(f"Szacunek: ~{tin} tokenów wejścia, ~{tout} wyjścia → ~{usd:.4f} $" if usd is not None else f"Szacunek: ~{tin}/{tout} tokenów (brak ceny dla {a.model})")
    print("Zapytania:", os.path.relpath(os.path.join(OUT, "mapa-zapytania.jsonl"), ROOT), "– wysyłka: --wyslij (po zgodzie Bartka)")
    sys.exit(0)

import anthropic  # noqa: E402  (tylko przy wysyłce)
client = anthropic.Anthropic()
PB = os.path.join(OUT, "mapa-batch.json")
if a.wyslij:
    b = client.messages.batches.create(requests=zapytania)
    json.dump({"id": b.id, "model": a.model}, open(PB, "w"))
    sys.exit(print("Wysłano batch", b.id, "– sprawdź za kilka minut: --odbierz"))

b = client.messages.batches.retrieve(json.load(open(PB))["id"])
if b.processing_status != "ended":
    sys.exit(print("Jeszcze trwa:", b.processing_status, dict(b.request_counts)))
wyniki, usage, bledy = {}, {"input": 0, "output": 0, "cache_write": 0, "cache_read": 0}, []
for r in client.messages.batches.results(b.id):
    if r.result.type != "succeeded":
        bledy.append(f"{r.custom_id}: {r.result.type}"); continue
    m = r.result.message
    if m.stop_reason != "end_turn":
        bledy.append(f"{r.custom_id}: stop_reason={m.stop_reason}"); continue
    txt = next((c.text for c in m.content if c.type == "text"), "")
    wyniki[r.custom_id] = json.loads(txt)
    u = m.usage
    usage["input"] += u.input_tokens; usage["output"] += u.output_tokens
    usage["cache_write"] += u.cache_creation_input_tokens or 0; usage["cache_read"] += u.cache_read_input_tokens or 0
cin, cout = CENY.get(json.load(open(PB))["model"], (0, 0))
usage["usd"] = round((usage["input"] * cin + usage["cache_write"] * cin * 1.25 + usage["cache_read"] * cin * 0.1 + usage["output"] * cout) / 1e6 * BATCH, 4)
json.dump(usage, open(os.path.join(OUT, "mapa-usage.json"), "w"), indent=1)
mapa = zapisz_mape(wyniki)
licz = {k: sum(t["koszyk"] == k for m in mapa for t in m["tematy"]) for k in ("K1", "K2", "K3", "?")}
print("Mapa:", os.path.join(OUT, "mapa.html"), licz, "koszt:", usage["usd"], "$", ("\nBłędy: " + "; ".join(bledy)) if bledy else "")
