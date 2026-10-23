import json, re, unicodedata, sys

D = json.load(open("syl.json"))

def slug(s):
    s = s.lower()
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = s.replace("ł", "l")
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s

def person(n):
    def fix(w):
        if len(w) > 1 and w.upper() == w and re.search(r"[A-ZĄĆĘŁŃÓŚŹŻ]", w):
            return "-".join(p[:1] + p[1:].lower() for p in w.split("-"))
        return w
    return " ".join(fix(w) for w in n.split())

def merge_lines(lines, width=95):
    out = []
    for l in lines:
        if out and out[-1][1] >= width:
            out[-1] = (out[-1][0] + " " + l, len(l))
        else:
            out.append((l, len(l)))
    return [re.sub(r"\s+", " ", x[0]).strip(" :") for x in out]

def cap(s):
    return s[:1].upper() + s[1:] if s else s

FORM = {"lecture": "W", "discussion classes": "CW", "laboratory": "LAB", "conversation": "KON", "seminar": "SEM", "pe classes": "WF"}
AI_BOILER = "The course teacher shall specify how artificial intelligence"

courses = []
seen = set()
for d in D:
    m = re.match(r"^(.*?)\s*\(([^()]*(?:\([^()]*\))?[^()]*)\)\s*$", d["title"])
    en, pl = (m.group(1), m.group(2)) if m else (d["title"], "")
    if pl.lower() == en.lower():
        pl = en
    pl = cap(pl) if pl else ""
    cid = slug(pl or en)
    if cid in seen:
        cid += "-" + d["code"].split("_")[-1].lower()
    seen.add(cid)
    ORDER = ["W", "CW", "LAB", "KON", "SEM", "WF"]
    forms = [{"f": FORM.get(f["form"].lower(), f["form"]), "h": f["hours"], "c": f.get("credit", ""), "s": f["sem"]} for f in d["forms"]]
    forms.sort(key=lambda f: (f["s"], ORDER.index(f["f"]) if f["f"] in ORDER else 9))
    grading, calc, cur = [], [], None
    cur = grading
    for l in d.get("grading", []):
        if l.strip() == "Grade calculation principles":
            cur = calc; continue
        cur.append(l)
    final = {"m": "", "parts": []}
    for i, r in enumerate(d["final"]):
        if i == 0 and len(r) >= 2:
            final["m"] = r[1]; continue
        if len(r) >= 2:
            mm = re.search(r"\[([^\]]+)\]\s*$", r[0])
            final["parts"].append({"n": mm.group(1) if mm else r[0], "c": r[1], "w": r[2] if len(r) > 2 else None})
    topics = {}
    for fname, items in d["content"].items():
        key = FORM.get(fname.lower(), fname)
        topics[key] = [{"t": it["t"].strip(), "h": it["h"]} for it in items]
    c = {
        "id": cid,
        "code": d["code"],
        "en": en.strip(),
        "pl": pl,
        "group": d["group"],
        "elective": d.get("status") == "elective",
        "unit": d.get("unit") or None,
        "sem": sorted({f["sem"] for f in d["forms"]}),
        "ects": int(d["ects"]) if str(d.get("ects", "")).isdigit() else 0,
        "hours": d.get("totalHours"),
        "forms": forms,
        "coord": person(d.get("coordinator", "")),
        "inst": [person(x) for x in d.get("instructors", [])],
        "goals": d.get("objectives", []),
        "pre": [x for x in d.get("prerequisites", []) if x.lower() not in ("none", "brak", "-")],
        "out": [{"c": o["cat"], "k": o["code"], "t": o["text"]} for o in d["outcomes"]],
        "topics": topics,
        "how": [x for x in d.get("delivery", []) if not x.startswith(AI_BOILER)],
        "assess": [{"m": cap(a["method"].lower()), "ep": re.findall(r"EP\d+", a["outcomes"].replace("\n", ""))} for a in d["assessment"]],
        "grading": grading,
        "calc": calc,
        "final": final,
        "lit": [re.sub(r"\s+", " ", x).strip() for x in d["basic"]],
        "sup": [re.sub(r"\s+", " ", x).strip() for x in d["supplementary"]],
        "load": d["workload"],
    }
    courses.append(c)

courses.sort(key=lambda c: (c["sem"][0], c["elective"], c["pl"] or c["en"]))
out = {
    "source": "Sylabus Business Management, studia stacjonarne I stopnia, program USEFZ-BM-O-I-S-26/27Z (Uniwersytet Szczeciński, WEFiZ)",
    "updated": "2026-10-23",
    "courses": courses,
}
# Użycie: python3 scripts/sylabus-parse.py SYLABUS.pdf  (tworzy syl.json)  →  python3 scripts/sylabus-build.py sylabus.json
# „??” to w PDF-ie zepsute znaki (np. niełamliwa spacja), usuwamy je.
open(sys.argv[1], "w").write(json.dumps(out, ensure_ascii=False, separators=(",", ":")).replace("??", ""))
print(len(courses))
