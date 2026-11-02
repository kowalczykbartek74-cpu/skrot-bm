"""Audyt istniejących lekcji bez modelu (spec, D2). Czyta scratch/lessons/*.json (eksport D1),
pisze scratch/audyt-lekcji.md i scratch/audyt-lekcji.json: flagi na lekcję, podsumowanie na przedmiot, szacunek pracy.

  python3 scripts/lekcje-audyt.py [pliki.json …]
"""
import collections, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lekcje_v4 as V

docs = V.load_lessons(sys.argv[1:] or None)
if not docs:
    sys.exit("Brak lekcji w scratch/lessons/. Najpierw eksport (D1): docs/lekcje-v4/eksport.js w przeglądarce na skrotbm.pl.")
by_id = {d.get("id"): d for _, d in docs}
rows, per = [], collections.OrderedDict()
for _, d in docs:
    r = V.check_lesson(d, by_id)
    f = r["flags"]
    # pola do dopisania modelem (D4): not, przepisanie pytań „na definicję”, skrócone simple, gen, brakujące pola, conf (atomy)
    work = len(f["no_not"]) + len(f["definition_q"]) + len(f["long_simple"]) + (2 if f["quant_no_gen"] else 0) + len(f["missing"]) + (1 if f["atoms_n"] < 6 else 0)
    row = {"id": d.get("id"), "subject": d.get("subjectId"), "title": d.get("title", ""), "errors": r["errors"], "warnings": len(r["warnings"]), **f, "work": work}
    rows.append(row)
    s = per.setdefault(d.get("subjectId") or "?", collections.Counter())
    s["lekcje"] += 1; s["błędy"] += len(r["errors"]); s["bez not"] += len(f["no_not"]); s["na definicję"] += len(f["definition_q"])
    s["check"] += f["check_n"]; s["check na definicję"] += f["check_def_n"]; s["długie simple"] += len(f["long_simple"]); s["długie body"] += len(f["long_body"])
    s["wzór przed intuicją"] += len(f["formula_first"]); s["bez gen (liczbowy)"] += 1 if f["quant_no_gen"] else 0; s["brakujące pola"] += len(f["missing"])
    s["< 6 atomów"] += 1 if f["atoms_n"] < 6 else 0; s["pola do poprawy"] += work

os.makedirs(V.SCRATCH, exist_ok=True)
with open(os.path.join(V.SCRATCH, "audyt-lekcji.json"), "w", encoding="utf-8") as fo:
    json.dump({"lessons": rows, "subjects": per}, fo, ensure_ascii=False, indent=1)
L = ["# Audyt lekcji (v4, bez modelu)", "", f"Lekcji: {len(rows)} · błędy krytyczne: {sum(len(r['errors']) for r in rows)} · pola do poprawy: {sum(r['work'] for r in rows)}", "",
     "## Na przedmiot", "", "| Przedmiot | Lekcje | Błędy | Bez `not` | Na definicję (wszystkie) | `check` na definicję | Długie `simple` | Długie `body` | Wzór przed intuicją | Bez `gen` | Brakujące pola | < 6 atomów | Pola do poprawy |",
     "|---|---|---|---|---|---|---|---|---|---|---|---|---|"]
for sid, s in per.items():
    pc = f"{s['check na definicję']}/{s['check']} ({round(100 * s['check na definicję'] / s['check']) if s['check'] else 0}%)"
    L.append(f"| {sid} | {s['lekcje']} | {s['błędy']} | {s['bez not']} | {s['na definicję']} | {pc} | {s['długie simple']} | {s['długie body']} | {s['wzór przed intuicją']} | {s['bez gen (liczbowy)']} | {s['brakujące pola']} | {s['< 6 atomów']} | {s['pola do poprawy']} |")
L += ["", "## Lekcje", ""]
for r in sorted(rows, key=lambda r: (r["subject"] or "", r["id"])):
    bits = []
    if r["errors"]: bits.append("**błędy:** " + "; ".join(r["errors"]))
    if r["missing"]: bits.append("brak: " + ", ".join(r["missing"]))
    if r["no_not"]: bits.append(f"bez not: {len(r['no_not'])}")
    if r["definition_q"]: bits.append("na definicję: " + ", ".join(p.replace("lesson.", "") for p in r["definition_q"]))
    if r["long_simple"]: bits.append("długie simple: części " + ", ".join(str(i + 1) for i in r["long_simple"]))
    if r["long_body"]: bits.append("długie body: części " + ", ".join(str(i + 1) for i in r["long_body"]))
    if r["formula_first"]: bits.append("wzór przed intuicją: części " + ", ".join(str(i + 1) for i in r["formula_first"]))
    if r["quant_no_gen"]: bits.append("bez gen")
    bits.append(f"atomy: {r['atoms_n']}")
    L.append(f"- `{r['id']}` {r['title']} ({r['work']} pól) — " + " · ".join(bits))
with open(os.path.join(V.SCRATCH, "audyt-lekcji.md"), "w", encoding="utf-8") as fo:
    fo.write("\n".join(L) + "\n")
print("\n".join(L[:8 + len(per)]))
print(f"\nZapisano scratch/audyt-lekcji.md i .json")
