"""Nakłada łatkę z D4 na kopię lekcji i od razu ją waliduje (spec, D5.1).

  python3 scripts/lekcje-latka.py scratch/latki/<id>.json
Czyta scratch/lessons-v4/<id>.json, zapisuje scratch/lessons-v4-poprawione/<id>.json. Błąd walidatora → kod 1
i lista pól do ponownej poprawki (maks. 2 próby, potem ręcznie). Ścieżki: lesson.sections[1].check.not, lesson.gen …
"""
import copy, json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lekcje_v4 as V

def put(root, path, value):
    parts = [p for p in re.findall(r"[^.\[\]]+|\[\d+\]", path)]
    cur = root
    for i, p in enumerate(parts):
        last = i == len(parts) - 1
        key = int(p[1:-1]) if p.startswith("[") else p
        if last:
            if isinstance(key, int):
                while len(cur) <= key: cur.append(None)
            cur[key] = value
            return
        nxt = parts[i + 1]
        if isinstance(key, int):
            while len(cur) <= key: cur.append({})
            if cur[key] is None: cur[key] = [] if nxt.startswith("[") else {}
        elif key not in cur or cur[key] is None:
            cur[key] = [] if nxt.startswith("[") else {}
        cur = cur[key]

P = json.load(open(sys.argv[1], encoding="utf-8"))
src = os.path.join(V.SCRATCH, "lessons-v4", P["id"] + ".json")
doc = json.load(open(src, encoding="utf-8"))
new = copy.deepcopy(doc)
for ch in P["patch"]:
    if "*" in ch["path"] or not ch["path"].startswith("lesson."):
        sys.exit(f"Ścieżka spoza lesson albo z *: {ch['path']}")
    put(new["content"], ch["path"], ch["value"])
others = {d.get("id"): d for _, d in V.load_lessons()}
others[new["id"]] = new
r = V.check_lesson(new, others)
dst = os.path.join(V.SCRATCH, "lessons-v4-poprawione"); os.makedirs(dst, exist_ok=True)
json.dump(new, open(os.path.join(dst, P["id"] + ".json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"{P['id']}: {len(P['patch'])} zmian · błędy {len(r['errors'])} · ostrzeżenia {len(r['warnings'])}")
for e in r["errors"]: print("  BŁĄD  " + e)
for w in r["warnings"]: print("  uwaga " + w)
sys.exit(1 if r["errors"] else 0)
