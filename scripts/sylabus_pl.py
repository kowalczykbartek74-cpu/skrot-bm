# Sylabus w polskim układzie US („S Y L A B U S (KARTA PRZEDMIOTU)”, np. Zarządzanie WEFiZ 2026/27).
# Wynik w tym samym kształcie co część angielska scripts/sylabus-parse.py (syl.json), więc sylabus-build.py działa bez zmian.
# Wywołuje go sylabus-parse.py, gdy pierwsza strona PDF-u ma nagłówek polskiej karty; PDF-y BM (angielskie) idą starą drogą.
import re

ZNACZNIK = "KARTA PRZEDMIOTU"
STATUS = {"obowiązkowy": "obligatory", "fakultatywny": "elective"}
ZALICZENIE = {"E": "e", "ZO": "pg", "Z": "p"}   # te same kody co w sylabusie BM: egzamin / z oceną / bez oceny
ROZDZIELNIK_OCENY = "Zasady wyliczania oceny z przedmiotu"


def clean(s):
    return re.sub(r"[ \t]+", " ", (s or "").strip())


def jedna(s):
    return clean(re.sub(r"\s*\n\s*", " ", s or ""))


def akapity(s):
    """Wiersze komórki → akapity (zawinięte wiersze sklejone, nowy punkt tam, gdzie zaczyna się wyliczenie albo zdanie po kropce)."""
    out = []
    for l in [x.strip() for x in (s or "").split("\n") if x.strip()]:
        if out and not re.match(r"^(\d+[.)]|[-•–]|Ocena \d)", l) and not out[-1].endswith((".", ":", ";")):
            out[-1] += " " + l
        else:
            out.append(l)
    return out


def wiersze(pdf):
    """Karty przedmiotów: lista wierszy tabel (bez pustych komórek) dla każdej karty."""
    karty, cur = [], None
    for p in pdf.pages:
        if ZNACZNIK in (p.extract_text() or "")[:200]:
            cur = []
            karty.append(cur)
        if cur is None:
            continue
        for tb in p.find_tables():
            for r in tb.extract():
                r = [c for c in r if c not in (None, "")]
                if r:
                    cur.append(r)
    return karty


def karta(rows):
    d = {"forms": [], "outcomes": [], "content": {}, "assessment": [], "basic": [], "supplementary": [], "workload": {}, "final": [],
         "objectives": [], "prerequisites": [], "delivery": [], "grading": []}
    mode, form, kod_nast = None, None, False
    for r in rows:
        a = r[0]
        if kod_nast and re.match(r"^[A-Z]{2,}\w+_\w+$", a):
            d["code"] = a; kod_nast = False; continue
        if a.startswith("Nazwa przedmiotu:"):
            parts = [x.strip() for x in a.split("\n")[1:] if x.strip()]
            grp = parts[-1].strip("()") if parts and parts[-1].startswith("(") else ""
            d["title"] = clean(" ".join(parts[:-1] if grp else parts))
            d["group"] = grp
            if len(r) > 1 and r[1].startswith("Kod przedmiotu:"):
                k = r[1].split("\n", 1)
                if len(k) > 1 and k[1].strip():
                    d["code"] = clean(k[1])
                else:
                    kod_nast = True
            continue
        if a.startswith("Nazwa programu studiów:"):
            d["program"] = jedna(a.split(":", 1)[1]); continue
        if a.startswith(("Moduł:", "Nazwa kierunku:", "Forma studiów:")):
            if a.startswith("Moduł:"):
                d["unit"] = jedna(a.split(":", 1)[1]) or None
            continue
        if a.startswith("Status przedmiotu:"):
            st = jedna(a.split(":", 1)[1]).lower()
            d["status"] = STATUS.get(st, st)
            if len(r) > 1 and ":" in r[1]:
                d["language"] = jedna(r[1].split(":", 1)[1])
            continue
        if a == "Rok" and "Forma zajęć" in r:
            mode = "hours"; continue
        if mode == "hours":
            if a == "w tym e-learning":
                continue
            if a == "Razem":
                d["totalHours"] = int(r[1]) if len(r) > 1 and r[1].isdigit() else None
                d["ects"] = r[-1]
                mode = None; continue
            # [rok, semestr, forma, godziny, e-learning, zaliczenie, ECTS?] albo dalsze formy bez roku i semestru
            if re.match(r"^\d$", a) and len(r) >= 5 and r[1].isdigit():
                year, sem, rest = r[0], r[1], r[2:]
            elif re.match(r"^\d$", a) and d["forms"]:   # rok scalony w PDF-ie z wierszem wyżej: [semestr, forma, …]
                year, sem, rest = d["forms"][-1]["year"], r[0], r[1:]
            elif d["forms"] and not a[:1].isdigit():
                year, sem, rest = d["forms"][-1]["year"], d["forms"][-1]["sem"], r
            else:
                continue
            f = {"year": int(year), "sem": int(sem), "form": jedna(rest[0]), "hours": int(rest[1]) if len(rest) > 1 and rest[1].isdigit() else None}
            tail = rest[2:]
            if tail and tail[0].isdigit():
                f["elearning"] = int(tail[0]); tail = tail[1:]
            if tail:
                f["credit"] = ZALICZENIE.get(tail[0].strip(), tail[0].strip().lower()); tail = tail[1:]
            if tail:
                f["ects"] = tail[0]
            d["forms"].append(f)
            continue
        if a.startswith("Koordynator"):
            d["coordinator"] = jedna(r[1]).replace(" ,", ",") if len(r) > 1 else ""; continue
        if a.startswith("Prowadzący zajęcia:"):
            txt = r[1] if len(r) > 1 else a.split(":", 1)[1]
            d["instructors"] = [clean(x) for x in re.split(r",|\n", txt) if clean(x)]; continue
        if a.startswith("Cele przedmiotu"):
            mode = "objectives"
            d["objectives"] += [x for x in akapity(r[1] if len(r) > 1 else "") if not x.startswith("Celem przedmiotu jest")]
            continue
        if a.startswith("Wymagania wstępne"):
            mode = None
            d["prerequisites"] += akapity(r[1] if len(r) > 1 else a.split(":", 1)[1]); continue
        if a == "EFEKTY UCZENIA SIĘ":
            mode = "outcomes"; continue
        if mode == "outcomes":
            if a == "Kategoria":
                continue
            if a.startswith("TREŚCI PROGRAMOWE"):
                mode = "content"; continue
            i = next((i for i, c in enumerate(r) if re.match(r"^EP\d+$", c)), None)
            if i is None:
                continue
            cat = r[0] if i >= 2 and not r[0].isdigit() else (d["outcomes"][-1]["cat"] if d["outcomes"] else "")
            d["outcomes"].append({"cat": jedna(cat), "code": r[i], "text": jedna(r[i + 1]) if i + 1 < len(r) else "", "refs": r[i + 2].split("\n") if i + 2 < len(r) else []})
            continue
        if a.startswith("TREŚCI PROGRAMOWE"):
            mode = "content"; continue
        if mode == "content":
            if a.startswith("Przedmiot:") or a.startswith("w tym e-"):
                continue
            if a.startswith("Forma zajęć:"):
                form = jedna(a.split(":", 1)[1]); d["content"].setdefault(form, []); continue
            if form and re.match(r"^\d+\.", a):
                nums = [c for c in r[1:] if re.match(r"^\d+$", c)]
                d["content"][form].append({"t": jedna(re.sub(r"^\d+\.\s*\.?\s*", "", a)), "sem": int(nums[0]) if nums else None, "h": int(nums[1]) if len(nums) > 1 else None})
                continue
            if a.startswith("Metody kształcenia"):
                mode = "delivery"
                d["delivery"] += akapity(r[1] if len(r) > 1 else ""); continue
            if form and d["content"][form] and len(r) == 1 and not re.match(r"^\d+$", a):
                d["content"][form][-1]["t"] += " " + jedna(a)
            continue
        if a.startswith("Metody kształcenia"):
            mode = "delivery"
            d["delivery"] += akapity(r[1] if len(r) > 1 else ""); continue
        if mode == "delivery" and len(r) == 1 and not a.startswith("Metody weryfikacji"):
            d["delivery"] += akapity(a); continue
        if a.startswith("Metody weryfikacji"):
            mode = "assessment"; continue
        if mode == "assessment" and len(r) >= 2 and re.match(r"^EP", r[-1]):
            d["assessment"].append({"method": jedna(r[0]), "outcomes": r[-1]}); continue
        if a.startswith("Metody i formy weryfikacji"):
            continue
        if a.startswith("Forma i warunki zaliczenia"):
            mode = "grading"
            d["grading"] += akapity(r[1] if len(r) > 1 else ""); continue
        if a.startswith(ROZDZIELNIK_OCENY):
            d["grading"].append(ROZDZIELNIK_OCENY); mode = "grading"; continue
        if a.startswith("Metoda obliczania oceny"):
            mode = "final"; continue
        if mode == "final" and re.match(r"^\d$", a) and len(r) >= 2:
            d["final"].append([jedna(x) for x in r[1:]]); continue
        if a.startswith("Literatura podstawowa"):
            mode = "basic"
            if len(r) > 1: d["basic"].append(jedna(r[1]))
            continue
        if a.startswith("Literatura uzupełniająca"):
            mode = "supplementary"
            if len(r) > 1: d["supplementary"].append(jedna(r[1]))
            continue
        if a == "NAKŁAD PRACY STUDENTA":
            mode = "workload"; continue
        if mode == "workload":
            if len(r) >= 2 and r[1].isdigit() and not a.startswith(("ŁĄCZNY", "Liczba punktów")):
                d["workload"][clean(a)] = int(r[1])
            continue
        if mode in ("basic", "supplementary") and len(r) == 1:
            d[mode].append(jedna(a)); continue
        if mode == "grading" and len(r) == 1:
            d["grading"] += akapity(a); continue
        if mode == "objectives" and len(r) == 1:
            d["objectives"] += akapity(a); continue
        d.setdefault("_unparsed", []).append(r)
    return d


def parse(pdf):
    return [karta(rows) for rows in wiersze(pdf)]
