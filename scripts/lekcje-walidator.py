"""Walidator lekcji v4 (spec, sekcja 7). Błąd blokuje wgranie, ostrzeżenie trafia do raportu.

  python3 scripts/lekcje-walidator.py [pliki.json …]   # domyślnie scratch/lessons-v4/*.json, a bez nich scratch/lessons/*.json
  python3 scripts/lekcje-walidator.py --zgodnosc        # wyniki gen: Python vs parser z lekcje-v4.js (node), 20 losowań każdego szablonu
Kod wyjścia 1, gdy jest choć jeden błąd (albo niezgodność).
"""
import glob, json, math, os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lekcje_v4 as V

args = [a for a in sys.argv[1:] if not a.startswith("--")]
paths = args or sorted(glob.glob(os.path.join(V.SCRATCH, "lessons-v4", "*.json"))) or sorted(glob.glob(os.path.join(V.LESSONS, "*.json")))
docs = V.load_lessons(paths)
by_id = {d.get("id"): d for _, d in docs}

if "--zgodnosc" in sys.argv:
    cases = []
    for _, d in docs:
        for g in ((d.get("content") or {}).get("lesson") or {}).get("gen") or []:
            if not isinstance(g, dict):
                continue
            for k in range(20):
                vals = V.rand_vals(g.get("vars") or {}, k)
                try:
                    py = V.calc(g.get("answer", ""), vals)
                    py = py if math.isfinite(py) else None
                except V.ExprError:
                    py = None
                cases.append({"id": f"{d.get('id')}:{g.get('id')}:{k}", "expr": g.get("answer", ""), "vals": vals, "py": py})
    js = "const V=require(process.argv[1]);let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const c=JSON.parse(s);console.log(JSON.stringify(c.map(x=>{try{const r=V.numCalc(x.expr,x.vals);return Number.isFinite(r)?r:null}catch(e){return null}})))})"
    r = subprocess.run(["node", "-e", js, os.path.join(V.ROOT, "lekcje-v4.js")], input=json.dumps(cases), capture_output=True, text=True)
    if r.returncode:
        sys.exit("node: " + r.stderr[-500:])
    out = json.loads(r.stdout)
    bad = [(c, j) for c, j in zip(cases, out) if not ((c["py"] is None and j is None) or (c["py"] is not None and j is not None and math.isclose(c["py"], j, rel_tol=1e-9, abs_tol=1e-9)))]
    for c, j in bad[:30]:
        print(f"NIEZGODNOŚĆ {c['id']}: {c['expr']} {c['vals']} → Python {c['py']} · JS {j}")
    print(f"Zgodność parserów: {len(cases) - len(bad)}/{len(cases)} losowań")
    sys.exit(1 if bad else 0)

n_err = n_warn = 0
for p, d in docs:
    r = V.check_lesson(d, by_id)
    n_err += len(r["errors"]); n_warn += len(r["warnings"])
    if r["errors"] or r["warnings"]:
        print(f"\n{d.get('id')} · {d.get('title', '')} ({os.path.basename(p)})")
        for e in r["errors"]:
            print("  BŁĄD  " + e)
        for w in r["warnings"]:
            print("  uwaga " + w)
print(f"\n{len(docs)} lekcji · błędy: {n_err} · ostrzeżenia: {n_warn}")
sys.exit(1 if n_err else 0)
