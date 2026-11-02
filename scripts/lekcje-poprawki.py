"""Poprawki lekcji modelem (spec, D4): jedno zapytanie na lekcję, tylko flagowane pola, odpowiedź = łatka.

  python3 scripts/lekcje-poprawki.py <id lekcji> [--na-sucho] [--model claude-opus-5-5]

Wejście: scratch/lessons-v4/<id>.json (po lekcje-atomy.py) i flagi z check_lesson. Stała instrukcja
(docs/lekcje-v4/zasady.md) i mapa przedmiotu (lekcje + atomy) są w cache (prompt caching), zmienia się tylko lista pól.
Wynik: scratch/latki/<id>.json (łatka) i scratch/latki/<id>.usage.json (tokeny wejścia/wyjścia, cache).
--na-sucho (albo brak pakietu anthropic / klucza): zapisuje zapytanie do scratch/latki/<id>.zapytanie.json bez wysyłania.
Łatkę nakłada i sprawdza scripts/lekcje-latka.py. Wymaga: pip install anthropic, ANTHROPIC_API_KEY (albo ant auth login).
"""
import argparse, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lekcje_v4 as V

ap = argparse.ArgumentParser()
ap.add_argument("id")
ap.add_argument("--na-sucho", action="store_true")
ap.add_argument("--model", default="claude-opus-5-5")
a = ap.parse_args()

src = os.path.join(V.SCRATCH, "lessons-v4")
docs = {d.get("id"): d for _, d in V.load_lessons(__import__("glob").glob(os.path.join(src, "*.json")))}
doc = docs.get(a.id) or sys.exit(f"Brak {a.id} w scratch/lessons-v4/ (najpierw lekcje-atomy.py)")
c, sid = doc.get("content") or {}, doc.get("subjectId")
L = c.get("lesson") or {}
rules = open(os.path.join(V.ROOT, "docs", "lekcje-v4", "zasady.md"), encoding="utf-8").read()

# Mapa przedmiotu: lekcje po kolei z atomami (id, t, d) – stała dla wszystkich lekcji przedmiotu, więc w cache.
subj = sorted((d for d in docs.values() if d.get("subjectId") == sid), key=lambda d: d.get("id"))
mapa = {"przedmiot": sid, "lekcje": [{"id": d["id"], "title": d.get("title", ""), "atoms": [{"id": x.get("id"), "t": x.get("t"), "d": x.get("d")} for x in ((d.get("content") or {}).get("lesson") or {}).get("atoms") or []]} for d in subj]}

# Pola do poprawy (tylko to, co zgłasza audyt), w kolejności z zasad.
r = V.check_lesson(doc, docs)
f, todo = r["flags"], []
atoms = L.get("atoms") or []
if atoms and not any(x.get("conf") for x in atoms):
    todo.append({"path": "lesson.atoms[*].conf", "why": "dopisz conf tam, gdzie studenci realnie mylą pojęcia", "current": atoms})
if len(atoms) < 6:
    todo.append({"path": "lesson.atoms", "why": f"jest {len(atoms)} atomów, potrzeba 6–12 (zostaw istniejące id)", "current": atoms})
qs = dict(V.questions(L))
for p in f["no_not"]:
    if p not in f["definition_q"]:
        todo.append({"path": p + ".not", "why": "brak not", "current": qs.get(p)})
for p in f["definition_q"]:
    todo.append({"path": p, "why": "pytanie „na definicję”: przepisz na zastosowanie (z not)", "current": qs.get(p)})
for i in f["long_simple"]:
    todo.append({"path": f"lesson.sections[{i}].simple", "why": "simple > 60 słów", "current": L["sections"][i].get("simple")})
if f["quant_no_gen"]:
    todo.append({"path": "lesson.gen", "why": "przedmiot liczbowy bez gen: 1–2 szablony", "current": None,
                 "kontekst": [{"h": s.get("h"), "example": s.get("example")} for s in L.get("sections") or []] + [{"formulas": L.get("formulas")}]})
for m in f["missing"]:
    todo.append({"path": m, "why": "brakujące pole", "current": None})
for e in r["errors"]:
    todo.append({"path": "(błąd walidatora)", "why": e, "current": None})
if not todo:
    sys.exit(f"{a.id}: nic do poprawy")

user = json.dumps({"id": a.id, "title": doc.get("title", ""), "type": L.get("type"), "sekcje": [s.get("h") for s in L.get("sections") or []], "do_poprawy": todo}, ensure_ascii=False, indent=1)
SCHEMA = {"type": "object", "additionalProperties": False, "required": ["id", "patch"], "properties": {
    "id": {"type": "string"},
    "patch": {"type": "array", "items": {"type": "object", "additionalProperties": False, "required": ["path", "value_json"],
              "properties": {"path": {"type": "string"}, "value_json": {"type": "string"}}}}}}
req = dict(
    model=a.model, max_tokens=32000,
    system=[{"type": "text", "text": rules, "cache_control": {"type": "ephemeral"}},
            {"type": "text", "text": "Mapa przedmiotu (lekcje i atomy):\n" + json.dumps(mapa, ensure_ascii=False), "cache_control": {"type": "ephemeral"}}],
    messages=[{"role": "user", "content": "Popraw tylko te pola tej lekcji i zwróć łatkę:\n" + user}],
    output_config={"effort": "high", "format": {"type": "json_schema", "schema": SCHEMA}},
)
out = os.path.join(V.SCRATCH, "latki"); os.makedirs(out, exist_ok=True)
try:
    import anthropic
except ImportError:
    anthropic = None
if a.na_sucho or anthropic is None:
    with open(os.path.join(out, a.id + ".zapytanie.json"), "w", encoding="utf-8") as fo:
        json.dump(req, fo, ensure_ascii=False, indent=1)
    n = sum(len(b["text"]) for b in req["system"]) + len(req["messages"][0]["content"])
    print(f"{a.id}: {len(todo)} pól do poprawy, zapytanie ~{n} znaków (~{n // 4} tokenów) → scratch/latki/{a.id}.zapytanie.json"
          + ("" if anthropic else " (brak pakietu anthropic: pip install anthropic)"))
    sys.exit(0)

client = anthropic.Anthropic()
# Odmowa klasyfikatora: serwer sam przełącza na model zapasowy (fallbacks "default").
with client.beta.messages.stream(betas=["server-side-fallback-2026-07-01"], fallbacks="default", **req) as stream:
    msg = stream.get_final_message()
if msg.stop_reason == "refusal":
    sys.exit(f"{a.id}: model odmówił ({getattr(msg.stop_details, 'category', None)})")
if msg.stop_reason == "max_tokens":
    sys.exit(f"{a.id}: odpowiedź ucięta (max_tokens)")
text = "".join(b.text for b in msg.content if b.type == "text")
data = json.loads(text)
patch = {"id": a.id, "patch": [{"path": p["path"], "value": json.loads(p["value_json"])} for p in data["patch"]]}
u = msg.usage
usage = {"model": msg.model, "input": u.input_tokens, "cache_write": u.cache_creation_input_tokens, "cache_read": u.cache_read_input_tokens, "output": u.output_tokens, "pola": len(todo)}
json.dump(patch, open(os.path.join(out, a.id + ".json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
json.dump(usage, open(os.path.join(out, a.id + ".usage.json"), "w"), indent=1)
print(f"{a.id}: łatka {len(patch['patch'])} zmian · tokeny {usage}")
