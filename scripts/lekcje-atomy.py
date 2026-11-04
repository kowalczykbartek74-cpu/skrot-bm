"""Atomy ze starej treści bez modelu (spec, D3): to samo co lessonAtoms w stronie (concepts + pasująca fiszka).
Czyta scratch/lessons/*.json, zapisuje kopie z lesson.atoms do scratch/lessons-v4/ (oryginały bez zmian).
Lekcje, które już mają lesson.atoms, zostają jak są. Raport: lekcje z < 6 atomami (do uzupełnienia modelem w D4).

  python3 scripts/lekcje-atomy.py [pliki.json …]
"""
import copy, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lekcje_v4 as V

out_dir = os.path.join(V.SCRATCH, "lessons-v4")
os.makedirs(out_dir, exist_ok=True)
few = []
docs = V.load_lessons(sys.argv[1:] or None)
for p, d in docs:
    d2 = copy.deepcopy(d)
    c = d2.setdefault("content", {})
    L = c.setdefault("lesson", {})
    if not L.get("atoms"):
        atoms = []
        for i, a in enumerate(V.atoms_of(c)):
            x = {"id": f"a{i + 1}", "t": a["t"], "d": a["d"]}
            if a.get("pl"): x["pl"] = a["pl"]
            if a.get("q") and a.get("a"): x["q"], x["a"] = a["q"], a["a"]
            atoms.append(x)
        L["atoms"] = atoms
    if len(L["atoms"]) < 6:
        few.append((d.get("id"), d.get("title", ""), len(L["atoms"])))
    with open(os.path.join(out_dir, os.path.basename(p)), "w", encoding="utf-8") as fo:
        json.dump(d2, fo, ensure_ascii=False, indent=1)
print(f"{len(docs)} lekcji → scratch/lessons-v4/. Mniej niż 6 atomów: {len(few)}")
for i, t, n in few:
    print(f"  {i} · {t}: {n}")
