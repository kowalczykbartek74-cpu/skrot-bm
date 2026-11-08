"""Mapa tematów nowego kierunku (spec „Schemat robienia kierunków”, Etap C, sekcja 4.1).

Dla każdego przedmiotu z pliku kierunku: tematy z sylabusa kierunku i kandydaci z BM (lekcje z eksportu
docs/lekcje-v4/eksport.js, a bez eksportu tematy z sylabus.json BM). Jedno małe zapytanie na przedmiot (Batch API,
połowa ceny, zasady w cache) przypisuje każdemu tematowi koszyk K2 (jest w BM) albo K3 (nowa lekcja) i źródła.
Przedmiot bez przedmiotów BM (bm: []) dostaje K3 od razu, bez zapytania (0 zł). Skrypt nie pisze treści lekcji.

  python3 scripts/mapa-tematow.py kierunki/<id>.json --na-sucho      zapytania + tokeny + koszt, nic nie wysyła
  python3 scripts/mapa-tematow.py kierunki/<id>.json --wyslij        wysyła Batch (ANTHROPIC_API_KEY albo ant auth login)
  python3 scripts/mapa-tematow.py kierunki/<id>.json --odbierz       wyniki → scratch/<prefiks>/mapa.json + mapa.html
  python3 scripts/mapa-tematow.py kierunki/<id>.json --html          tylko odśwież mapa.html z mapa.json
Opcje: --model claude-haiku-5-5 (domyślnie, zadanie klasyfikacji), --lekcje <katalog eksportu lekcji BM> (domyślnie scratch/lessons).
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
ap.add_argument("--model", default="claude-haiku-5-5")
ap.add_argument("--lekcje", default=os.path.join(ROOT, "scratch", "lessons"))
a = ap.parse_args()

# $/MTok (wejście, wyjście) bez rabatu; Batch API = połowa. Sprawdź przed dużą wysyłką: https://platform.claude.com/docs/en/about-claude/pricing
CENY = {"claude-haiku-5-5": (0.10, 0.50), "claude-sonnet-5-5": (2.00, 10.00), "claude-opus-5-5": (4.00, 20.00)}
BATCH = 0.5

K = json.load(open(os.path.join(ROOT, a.kierunek) if not os.path.isabs(a.kierunek) else a.kierunek))
OUT = os.path.join(ROOT, "scratch", K["prefiks"])
os.makedirs(OUT, exist_ok=True)
SYL = {c["id"]: c for c in json.load(open(os.path.join(ROOT, K["sylabus"]["plik"])))["courses"]}
BM_SYL = {c["id"]: c for c in json.load(open(os.path.join(ROOT, "sylabus.json")))["courses"]}


def slug(s):
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").replace("ł", "l")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def tematy_kierunku(pid):
    c = SYL.get(pid)
    if not c:
        sys.exit(f"Brak karty „{pid}” w {K['sylabus']['plik']} (Etap B).")
    out = []
    for forma, lista in c["topics"].items():
        for t in lista:
            out.append({"temat": t["t"], "forma": forma, "godz": t.get("h")})
    return out


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
            out += [{"id": l["id"], "przedmiotBM": sid, "tytul": l["title"], "atomy": l["atomy"][:12]} for l in les]
        else:
            n = 0
            for forma, lista in BM_SYL[sid]["topics"].items():
                for t in lista:
                    n += 1
                    out.append({"id": f"bm-syl:{sid}:{forma}:{n}", "przedmiotBM": sid, "tytul": t["t"]})
    return out


ZASADY = """Mapujesz tematy przedmiotu z nowego kierunku studiów (po polsku) na istniejące lekcje kierunku Business Management (BM, po angielsku).
Dla każdego tematu z listy „tematy” zwróć:
- koszyk "K2", gdy w kandydatach BM jest lekcja albo temat o tej samej treści (wystarczy, że pokrywa większość tematu; różnica języka nie ma znaczenia) – lekcję BM przetłumaczymy i dostosujemy;
- koszyk "K3", gdy w BM nie ma takiej treści – powstanie nowa lekcja;
- zrodlo: id kandydatów BM (dokładnie tak, jak w liście), z których powstanie lekcja; dla K3 pusta lista;
- uwaga: jedno krótkie zdanie po polsku tylko wtedy, gdy przypisanie jest niepewne albo kandydat pokrywa temat częściowo; inaczej pusty napis.
Nie wymyślaj id. Zwróć każdy temat dokładnie raz, z jego numerem i."""

SCHEMA = {
    "type": "object", "additionalProperties": False, "required": ["tematy"],
    "properties": {"tematy": {"type": "array", "items": {
        "type": "object", "additionalProperties": False, "required": ["i", "koszyk", "zrodlo", "uwaga"],
        "properties": {"i": {"type": "integer"}, "koszyk": {"type": "string", "enum": ["K2", "K3"]},
                       "zrodlo": {"type": "array", "items": {"type": "string"}}, "uwaga": {"type": "string"}}}}},
}


def zapytanie(pid, tem, kand):
    tresc = {"kierunek": K["kierunek"]["pl"], "przedmiot": SYL[pid]["pl"],
             "tematy": [{"i": i, "temat": t["temat"], "forma": t["forma"]} for i, t in enumerate(tem)],
             "kandydaciBM": kand}
    return {"custom_id": pid, "params": {
        "model": a.model, "max_tokens": 8000,
        "output_config": {"effort": "low", "format": {"type": "json_schema", "schema": SCHEMA}},
        "system": [{"type": "text", "text": ZASADY, "cache_control": {"type": "ephemeral"}}],
        "messages": [{"role": "user", "content": json.dumps(tresc, ensure_ascii=False)}],
    }}


# ---------- przygotowanie ----------
plan, bez_api = [], {}
for pid, p in K["przedmioty"].items():
    tem = tematy_kierunku(pid)
    if not p.get("bm"):
        bez_api[pid] = [{**t, "koszyk": "K3", "zrodlo": [], "uwaga": "brak w BM"} for t in tem]
        continue
    plan.append((pid, tem, kandydaci(p["bm"])))
zapytania = [zapytanie(pid, tem, kand) for pid, tem, kand in plan]


def koszt():
    cin, cout = CENY.get(a.model, (None, None))
    tok_in = sum(len(json.dumps(z["params"]["system"], ensure_ascii=False)) + len(z["params"]["messages"][0]["content"]) for z in zapytania) / 3
    tok_out = sum(len(tem) * 45 + 200 for _, tem, _ in plan)   # ok. 45 tokenów na temat (JSON) + zapas na myślenie przy effort low
    usd = None if cin is None else (tok_in * cin + tok_out * cout) / 1e6 * BATCH
    return int(tok_in), int(tok_out), usd


def html_mapy(mapa):
    wiersze = []
    for m in mapa:
        for j, t in enumerate(m["tematy"]):
            opt = "".join(f'<option{" selected" if t["koszyk"] == k else ""}>{k}</option>' for k in ("K1", "K2", "K3"))
            wiersze.append(f'<tr><td>{html.escape(SYL[m["przedmiot"]]["pl"])}</td><td>{html.escape(t["temat"])}</td><td>{html.escape(t.get("forma") or "")}</td>'
                           f'<td>{t.get("godz") or ""}</td><td><select data-p="{m["przedmiot"]}" data-j="{j}">{opt}</select></td>'
                           f'<td>{html.escape(", ".join(t["zrodlo"]))}</td><td>{html.escape(t.get("uwaga") or "")}</td></tr>')
    licz = {k: sum(t["koszyk"] == k for m in mapa for t in m["tematy"]) for k in ("K1", "K2", "K3")}
    return f"""<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mapa tematów {html.escape(K["kierunek"]["pl"])}</title><style>
body{{font:15px/1.45 system-ui,sans-serif;margin:16px;color:#16231b;background:#fff}} table{{border-collapse:collapse;width:100%}}
td,th{{border-bottom:1px solid #dfe8e2;padding:6px 8px;text-align:left;vertical-align:top}} th{{background:#eef6f0;position:sticky;top:0}}
select{{font:inherit;min-height:36px}} button{{font:inherit;padding:10px 16px;border:0;border-radius:10px;background:#1a7f45;color:#fff;min-height:44px}}
.wrap{{overflow-x:auto}}</style></head><body>
<h1>Mapa tematów: {html.escape(K["kierunek"]["pl"])}</h1>
<p>K2: {licz["K2"]} · K3: {licz["K3"]} · K1: {licz["K1"]}. Popraw koszyki i kliknij „Pobierz mapa.json”, potem podmień plik w scratch/{K["prefiks"]}/.</p>
<p><button id="dl">Pobierz mapa.json</button></p>
<div class="wrap"><table><thead><tr><th>Przedmiot</th><th>Temat (sylabus)</th><th>Forma</th><th>h</th><th>Koszyk</th><th>Źródło BM</th><th>Uwaga</th></tr></thead><tbody>
{"".join(wiersze)}</tbody></table></div>
<script>const MAPA={json.dumps(mapa, ensure_ascii=False)};
document.getElementById("dl").onclick=()=>{{document.querySelectorAll("select").forEach(s=>{{MAPA.find(m=>m.przedmiot===s.dataset.p).tematy[+s.dataset.j].koszyk=s.value}});
const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(MAPA,null,1)],{{type:"application/json"}}));a.download="mapa.json";a.click()}};</script>
</body></html>"""


def zapisz_mape(wyniki):
    mapa = []
    for pid in K["przedmioty"]:
        if pid in bez_api:
            mapa.append({"przedmiot": pid, "tematy": bez_api[pid]}); continue
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
            out.append({**t, "koszyk": x["koszyk"] if (x["koszyk"] == "K3" or zr) else "K3", "zrodlo": zr, "uwaga": uw.strip()})
        mapa.append({"przedmiot": pid, "tematy": out})
    json.dump(mapa, open(os.path.join(OUT, "mapa.json"), "w"), ensure_ascii=False, indent=1)
    open(os.path.join(OUT, "mapa.html"), "w").write(html_mapy(mapa))
    return mapa


if a.html:
    mapa = json.load(open(os.path.join(OUT, "mapa.json")))
    open(os.path.join(OUT, "mapa.html"), "w").write(html_mapy(mapa))
    sys.exit(print("Zapisano", os.path.join(OUT, "mapa.html")))

if a.na_sucho or not (a.wyslij or a.odbierz):
    with open(os.path.join(OUT, "mapa-zapytania.jsonl"), "w") as f:
        for z in zapytania:
            f.write(json.dumps(z, ensure_ascii=False) + "\n")
    tin, tout, usd = koszt()
    zrodla = "lekcje z eksportu" if LEKCJE else "tematy z sylabus.json BM (brak eksportu lekcji w " + os.path.relpath(a.lekcje, ROOT) + ")"
    print(f"Na sucho ({a.model}, Batch −50%): {len(zapytania)} zapytań, {sum(len(t) for _, t, _ in plan)} tematów do przypisania; "
          f"bez API (K3 od razu): {', '.join(bez_api) or '—'}.")
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
licz = {k: sum(t["koszyk"] == k for m in mapa for t in m["tematy"]) for k in ("K2", "K3", "?")}
print("Mapa:", os.path.join(OUT, "mapa.html"), licz, "koszt:", usage["usd"], "$", ("\nBłędy: " + "; ".join(bledy)) if bledy else "")
