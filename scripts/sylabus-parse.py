import pdfplumber, json, re, sys

PDF = sys.argv[1]
pdf = pdfplumber.open(PDF)

class Row(list):
    pass

def entries(row, i):
    """Pozycje literatury: nowa pozycja tam, gdzie w PDF-ie jest większy odstęp między wierszami."""
    try:
        lines = row.page.crop(row.boxes[i]).extract_text_lines()
    except Exception:
        lines = []
    if not lines:
        return [clean(x) for x in row[i].split("\n") if clean(x)]
    texts = [x for x in row[i].split("\n") if x.strip()]
    if len(texts) == len(lines):
        # Tekst bierzemy z komórki tabeli (crop łapie czasem obce znaki), a z cropa tylko odstępy między wierszami.
        lines = [{**l, "text": t} for l, t in zip(lines, texts)]
    else:
        lines = [l for l in lines]
    gaps = [b["top"] - a["top"] for a, b in zip(lines, lines[1:])]
    base = min(gaps) if gaps else 0
    out = []
    for j, l in enumerate(lines):
        if j == 0 or gaps[j - 1] > base * 1.35:
            out.append(l["text"].strip())
        else:
            out[-1] += " " + l["text"].strip()
    return [clean(x) for x in out if clean(x)]

# group pages into documents
docs, cur = [], None
for p in pdf.pages:
    txt = p.extract_text() or ""
    if "Curriculum title:" in txt:
        cur = []
        docs.append(cur)
    rows = []
    for tb in p.find_tables():
        data = tb.extract()
        for r, rr in zip(data, tb.rows):
            pairs = [(c, b) for c, b in zip(r, rr.cells) if c not in (None, "")]
            if pairs:
                row = Row(c for c, _ in pairs)
                row.page, row.boxes = p, [b for _, b in pairs]
                rows.append(row)
    cur.extend(rows)

def clean(s):
    return re.sub(r"[ \t]+", " ", (s or "").strip())

def para(s):
    # join wrapped lines into paragraphs; keep line breaks where a line starts like a new item
    lines = [l.strip() for l in (s or "").split("\n") if l.strip()]
    out = []
    for l in lines:
        if out and not re.match(r"^(\d+[.)]|[-•–]|in terms of|in the field of|[A-ZŁŚŻ][a-z]+ \w+ ?\(\d{4}\)|[A-Z][\w.'-]+,? [A-Z]\.)", l) and not out[-1].endswith((".", ":")):
            out[-1] += " " + l
        else:
            out.append(l)
    return out

LABELS = {
    "Course / module\nobjectives": "objectives",
    "Prerequisites": "prerequisites",
    "Modes of delivery": "delivery",
    "Assessment methods": "assessment",
    "Grading criteria": "grading",
    "Basic reading": "basic",
    "Supplementary reading": "supplementary",
}

out = []
for rows in docs:
    d = {"forms": [], "outcomes": [], "content": {}, "assessment": [], "basic": [], "supplementary": [], "workload": {}, "final": []}
    mode = None
    form = None
    for r in rows:
        a = r[0]
        if a.startswith("Course title:"):
            parts = a.split("\n")[1:]
            grp = parts[-1].strip("()") if parts and parts[-1].startswith("(") else ""
            d["title"] = clean(" ".join(parts[:-1] if grp else parts))
            d["group"] = grp
            continue
        if a == "Course code:":
            continue
        if re.match(r"^EFZ\w+$", a) and "code" not in d:
            d["code"] = a; continue
        if a.startswith("Course / module status"):
            d["status"] = clean(a.split("\n", 1)[1]) if "\n" in a else ""
            if len(r) > 1:
                d["language"] = clean(r[1].split("\n", 1)[1]) if "\n" in r[1] else ""
            continue
        if a == "Year":
            mode = "hours"; continue
        if mode == "hours":
            if a == "Total":
                d["totalHours"] = int(r[1]) if r[1].isdigit() else None
                d["ects"] = r[-1]
                mode = None; continue
            # rows: [year, sem, form, hours, el, credit, ects] or [form, hours, el, credit] continuation
            if re.match(r"^\d$", a) and len(r) >= 5:
                year, sem = r[0], r[1]
                rest = r[2:]
            else:
                rest = r
                if not d["forms"]:
                    continue
                year, sem = d["forms"][-1]["year"], d["forms"][-1]["sem"]
            if not rest or rest[0].isdigit():
                continue
            f = {"year": int(year), "sem": int(sem), "form": clean(rest[0].replace("\n", " ")), "hours": int(rest[1]) if len(rest) > 1 and rest[1].isdigit() else None}
            tail = rest[2:]
            # tail: [el, credit, ects?]
            if tail and tail[0].isdigit():
                f["elearning"] = int(tail[0]); tail = tail[1:]
            if tail:
                f["credit"] = tail[0]; tail = tail[1:]
            if tail:
                f["ects"] = tail[0]
            d["forms"].append(f)
            continue
        if a.startswith("Course / module\ncoordinator"):
            d["coordinator"] = clean(r[1].replace("\n", ", ")) if len(r) > 1 else ""; continue
        if a == "Course instructor":
            d["instructors"] = [clean(x) for x in re.split(r",|\n", r[1]) if clean(x)] if len(r) > 1 else []; continue
        if a in LABELS and len(r) == 1:
            mode = LABELS[a]; continue
        if a.startswith("Unit:"):
            d["unit"] = clean(a.split("\n",1)[1]); continue
        if a in LABELS and len(r) > 1:
            key = LABELS[a]
            mode = key
            if key in ("objectives", "prerequisites", "delivery", "grading"):
                d[key] = d.get(key, []) + para(r[1])
            elif key in ("basic", "supplementary"):
                d[key] += entries(r, 1)
            elif key == "assessment" and not r[1].startswith("No. of"):
                d["assessment"].append({"method": clean(r[1]), "outcomes": r[2] if len(r) > 2 else ""})
            continue
        if a == "LEARNING OUTCOMES":
            mode = "outcomes"; continue
        if mode == "outcomes":
            if a == "Category": continue
            if a == "CONTENT":
                mode = "content"; continue
            cells = r
            if re.match(r"^EP\d+", cells[0]) or (len(cells) >= 2 and re.match(r"^EP\d+", cells[1])) or (len(cells) >= 3 and re.match(r"^EP\d+", cells[2])):
                # find EP index
                i = next(i for i, c in enumerate(cells) if re.match(r"^EP\d+$", c))
                cat = cells[0] if i >= 2 and not cells[0].isdigit() else (d["outcomes"][-1]["cat"] if d["outcomes"] else "")
                d["outcomes"].append({"cat": cat, "code": cells[i], "text": clean(cells[i + 1].replace("\n", " ")) if i + 1 < len(cells) else "", "refs": cells[i + 2].split("\n") if i + 2 < len(cells) else []})
            continue
        if a == "CONTENT":
            mode = "content"; continue
        if mode == "content":
            if a.startswith("Subject title:"): continue
            if a.startswith("Format of instruction:"):
                form = clean(a.split(":", 1)[1]); d["content"].setdefault(form, []); continue
            if form and re.match(r"^\d+\.", a):
                nums = [c for c in r[1:] if re.match(r"^\d+$", c)]
                d["content"][form].append({"t": clean(re.sub(r"^\d+\.\s*\.?\s*", "", a).replace("\n", " ")), "sem": int(nums[0]) if nums else None, "h": int(nums[1]) if len(nums) > 1 else None})
                continue
            if form and d["content"][form] and not re.match(r"^\d+$", a) and len(r) == 1 and a not in LABELS:
                d["content"][form][-1]["t"] += " " + clean(a.replace("\n", " "))
            continue
        if mode == "assessment":
            if a.startswith("Metody i formy") or a.startswith("Methods and forms"):
                continue
            if len(r) >= 2 and re.match(r"^EP", r[-1]):
                d["assessment"].append({"method": clean(r[0]), "outcomes": r[-1]}); continue
        if a.startswith("Final grade calculation") or a == "Sem.":
            mode = "final"; continue
        if mode == "final":
            if re.match(r"^\d$", a) and len(r) >= 2:
                d["final"].append([clean(x.replace("\n", " ")) for x in r[1:]]); continue
        if a == "STUDENT WORKLOAD":
            mode = "workload"; continue
        if mode == "workload":
            if len(r) >= 2 and r[1].isdigit():
                d["workload"][clean(a)] = int(r[1])
            continue
        if mode in ("basic", "supplementary") and len(r) == 1:
            d[mode] += entries(r, 0)
            continue
        if mode in ("grading", "delivery", "objectives") and len(r) == 1:
            d[mode] = d.get(mode, []) + para(a)
            continue
        d.setdefault("_unparsed", []).append(r)
    out.append(d)

json.dump(out, open("syl.json", "w"), ensure_ascii=False, indent=1)
print(len(out))
