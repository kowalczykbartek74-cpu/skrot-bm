"""Lekcje v4: wspólne narzędzia dla skryptów audytu, atomów i walidatora (spec „lekcje v4”, sekcje 5 i 7).

Bez zależności. Parser wyrażeń jest wierną kopią tego z lekcje-v4.js (ta sama gramatyka i funkcje),
żeby walidator odrzucał dokładnie to, czego nie pokaże strona. Zgodność sprawdza lekcje-walidator.py --zgodnosc.
"""
import json, math, os, re, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRATCH = os.path.join(ROOT, "scratch")
LESSONS = os.path.join(SCRATCH, "lessons")

# Przedmioty liczbowe (D2): bez gen = flaga.
QUANT = {"analiza-matematyczna", "ekonomia-biznesu", "makroekonomia", "podstawy-finansow", "logistyka"}


def hash_str(s):
    """FNV-1a jak hashStr w index.html (po punktach kodowych), wynik w base36."""
    x = 2166136261
    for ch in str(s):
        x ^= ord(ch)
        x = (x * 16777619) & 0xFFFFFFFF
    digits = "0123456789abcdefghijklmnopqrstuvwxyz"
    if x == 0:
        return "0"
    out = ""
    while x:
        x, r = divmod(x, 36)
        out = digits[r] + out
    return out


def words(s):
    return len(str(s or "").split())


def load_lessons(paths=None):
    """[(plik, dokument)] z scratch/lessons/*.json. Dokument = { id, subjectId, title, content: { lesson, concepts, flashcards, ... } }."""
    out = []
    for p in sorted(paths or glob.glob(os.path.join(LESSONS, "*.json"))):
        with open(p, encoding="utf-8") as f:
            out.append((p, json.load(f)))
    return out


# ---------- parser wyrażeń (kopia lekcje-v4.js) ----------
def _round(x, n=0):
    k = 10 ** max(0, min(10, round(n or 0)))
    # Math.round w JS: połówki w górę
    return math.floor(x * k + 0.5) / k


FN = {"max": (1, 9, max), "min": (1, 9, min), "abs": (1, 1, abs), "sqrt": (1, 1, math.sqrt),
      "ln": (1, 1, lambda x: math.log(x) if x > 0 else (float("-inf") if x == 0 else float("nan"))), "round": (1, 2, _round)}


class ExprError(Exception):
    pass


def tokens(src):
    out, i, s = [], 0, str(src)
    while i < len(s):
        ch = s[i]
        if ch.isspace():
            i += 1
            continue
        m = re.match(r"(\d+(\.\d+)?|\.\d+)", s[i:])
        if m:
            out.append(("n", float(m.group(1))))
            i += len(m.group(1))
            continue
        m = re.match(r"[A-Za-z_][A-Za-z0-9_]*", s[i:])
        if m:
            out.append(("id", m.group(0)))
            i += len(m.group(0))
            continue
        if ch in "+-*/^(),":
            out.append((ch, None))
            i += 1
            continue
        raise ExprError("Niedozwolony znak: " + ch)
    return out


def parse(src, names):
    tk, p, allowed = tokens(src), [0], set(names or [])

    def peek():
        return tk[p[0]][0] if p[0] < len(tk) else None

    def eat(t):
        if peek() != t:
            raise ExprError("Oczekiwano " + t)
        p[0] += 1

    def expr():
        a = term()
        while peek() in ("+", "-"):
            op = tk[p[0]][0]; p[0] += 1
            a = ("op", op, a, term())
        return a

    def term():
        a = unary()
        while peek() in ("*", "/"):
            op = tk[p[0]][0]; p[0] += 1
            a = ("op", op, a, unary())
        return a

    def unary():
        if peek() == "-":
            p[0] += 1
            return ("neg", unary())
        if peek() == "+":
            p[0] += 1
            return unary()
        return power()

    def power():
        a = primary()
        if peek() == "^":
            p[0] += 1
            return ("op", "^", a, unary())
        return a

    def primary():
        if p[0] >= len(tk):
            raise ExprError("Niepełne wyrażenie")
        t, v = tk[p[0]]
        if t == "n":
            p[0] += 1
            return ("n", v)
        if t == "(":
            p[0] += 1
            e = expr(); eat(")")
            return e
        if t == "id":
            p[0] += 1
            if peek() == "(":
                if v not in FN:
                    raise ExprError("Nieznana funkcja: " + v)
                p[0] += 1
                args = []
                if peek() != ")":
                    args.append(expr())
                    while peek() == ",":
                        p[0] += 1
                        args.append(expr())
                eat(")")
                lo, hi, _ = FN[v]
                if not lo <= len(args) <= hi:
                    raise ExprError("Zła liczba argumentów: " + v)
                return ("fn", v, args)
            if v not in allowed:
                raise ExprError("Nieznana zmienna: " + v)
            return ("v", v)
        raise ExprError("Nieoczekiwany znak: " + t)

    tree = expr()
    if p[0] < len(tk):
        raise ExprError("Nadmiarowe znaki w wyrażeniu")
    return tree


def evaluate(t, vals):
    k = t[0]
    try:
        if k == "n":
            return t[1]
        if k == "v":
            return float(vals.get(t[1], float("nan")))
        if k == "fn":
            return float(FN[t[1]][2](*[evaluate(a, vals) for a in t[2]]))
        if k == "neg":
            return -evaluate(t[1], vals)
        a, b = evaluate(t[2], vals), evaluate(t[3], vals)
        op = t[1]
        if op == "+": return a + b
        if op == "-": return a - b
        if op == "*": return a * b
        if op == "/": return a / b if b != 0 else (float("nan") if a == 0 else math.copysign(float("inf"), a) * (1 if b >= 0 else -1))
        r = float(a) ** b
        return float("nan") if isinstance(r, complex) else r
    except (ValueError, OverflowError, ZeroDivisionError, TypeError):
        return float("nan")


def calc(src, vals):
    return evaluate(parse(src, list(vals)), vals)


def rand_vals(vars_, k):
    """Deterministyczne losowanie do walidatora (nie musi być takie jak w przeglądarce): k-te z 20 rozłożonych punktów zakresu."""
    out = {}
    for j, (name, v) in enumerate((vars_ or {}).items()):
        lo, hi, st = float(v[0]), float(v[1]), float(v[2] if len(v) > 2 and v[2] else 1)
        n = max(1, int(math.floor((hi - lo) / st + 1e-9)) + 1)
        idx = (k * 7 + j * 3) % n if k else 0
        out[name] = round(lo + idx * st, 10)
    return out


def decimals(x):
    s = ("%.10f" % abs(x)).rstrip("0")
    return len(s.split(".")[1]) if "." in s else 0


def task_vars(task):
    return set(re.findall(r"\{([A-Za-z_][A-Za-z0-9_]*)\}", str(task or "")))


# ---------- kontrole lekcji (D2 audyt, sekcja 7 walidator) ----------
DEF_START = re.compile(r"^\s*(what is|what are|which definition|co to jest|czym jest)\b", re.I)


def _wset(s):
    return set(w for w in re.findall(r"[\w’']+", str(s or "").lower()) if len(w) > 2)


def is_definition_q(q, concepts, atoms=()):
    """Pytanie „na definicję”: zaczyna się od „What is…/Co to jest…” albo poprawna opcja w ≥ 60% to słowa z definicji pojęcia."""
    if DEF_START.search(str(q.get("q", ""))):
        return True
    opts, c = q.get("options") or [], q.get("correct")
    if not isinstance(c, int) or not 0 <= c < len(opts):
        return False
    ans = _wset(opts[c])
    if len(ans) < 3:
        return False
    for d in [x.get("definition") for x in concepts or []] + [a.get("d") for a in atoms or []]:
        dw = _wset(d)
        if dw and len(ans & dw) / len(ans) >= 0.6:
            return True
    return False


def questions(L):
    """[(ścieżka, pytanie)] check z sekcji i bilet."""
    out = []
    for i, s in enumerate(L.get("sections") or []):
        if isinstance(s, dict) and s.get("check"):
            out.append((f"lesson.sections[{i}].check", s["check"]))
    for i, q in enumerate(L.get("exit") or []):
        out.append((f"lesson.exit[{i}]", q))
    return out


def atoms_of(content):
    """Jak atomsFrom w lekcje-v4.js: lesson.atoms albo wyliczone z concepts + fiszek."""
    L = content.get("lesson") or {}
    if isinstance(L.get("atoms"), list) and L["atoms"]:
        return [a for a in L["atoms"] if isinstance(a, dict) and a.get("id") and a.get("t")]
    fl = content.get("flashcards") or []
    out = []
    for i, x in enumerate(content.get("concepts") or []):
        if not (isinstance(x, dict) and x.get("term") and x.get("definition")):
            continue
        low = str(x["term"]).lower()
        f = next((f for f in fl if isinstance(f, dict) and low in str(f.get("q", "")).lower()), None)
        out.append({"id": f"c{i}", "t": x["term"], "pl": x.get("pl", ""), "d": x["definition"], "q": f.get("q", "") if f else "", "a": f.get("a", "") if f else "", "derived": True})
    return out


def check_lesson(doc, by_id=None):
    """Zwraca { errors: [..], warnings: [..], flags: {..} } dla jednej lekcji (doc = { id, subjectId, title, content })."""
    E, W, F = [], [], {}
    c = doc.get("content") or {}
    L = c.get("lesson") or {}
    secs = [s for s in (L.get("sections") or []) if isinstance(s, dict)]
    concepts = c.get("concepts") or []
    atoms = L.get("atoms") if isinstance(L.get("atoms"), list) else []

    # brakujące pola
    miss = []
    for i, s in enumerate(secs):
        if not s.get("mistake"):
            miss.append(f"sections[{i}].mistake")
        if not s.get("check"):
            miss.append(f"sections[{i}].check")
            E.append(f"sections[{i}]: brak check")
    if len(L.get("exit") or []) < 3:
        miss.append("exit ≥ 3")
        E.append(f"exit: {len(L.get('exit') or [])} pytań (min. 3)")
    if len((L.get("recap") or {}).get("keys") or []) < 3:
        miss.append("recap.keys ≥ 3")
    if len(concepts) < 4 and len(atoms) < 4:
        miss.append("concepts ≥ 4")
    if len(c.get("flashcards") or []) < 4:
        miss.append("flashcards ≥ 4")
    F["missing"] = miss

    # pytania: klucz odpowiedzi, not, „na definicję”, długość opcji
    no_not, defq, nq_check, defq_check = [], [], 0, 0
    for path, q in questions(L):
        if not isinstance(q, dict) or not q.get("q"):
            E.append(f"{path}: puste pytanie")
            continue
        opts, cor, nt = q.get("options") or [], q.get("correct"), q.get("not")
        if len(opts) < 2:
            E.append(f"{path}: mniej niż 2 opcje")
        if not isinstance(cor, int) or not 0 <= cor < len(opts):
            E.append(f"{path}: correct={cor!r} poza zakresem opcji ({len(opts)})")
        if len(set(map(lambda o: str(o).strip().lower(), opts))) < len(opts):
            E.append(f"{path}: powtórzone opcje")
        if nt is None:
            no_not.append(path)
        elif not isinstance(nt, list) or len(nt) != len(opts):
            E.append(f"{path}: not ma {len(nt) if isinstance(nt, list) else '?'} pozycji, opcji {len(opts)}")
        elif isinstance(cor, int) and 0 <= cor < len(nt) and nt[cor] is not None:
            E.append(f"{path}: not[correct] powinno być null")
        elif any(x in (None, "") for j, x in enumerate(nt) if j != cor):
            W.append(f"{path}: not bez wyjaśnienia dla którejś złej opcji")
        if ".check" in path:
            nq_check += 1
        if is_definition_q(q, concepts, atoms):
            defq.append(path)
            if ".check" in path:
                defq_check += 1
        if isinstance(cor, int) and 0 <= cor < len(opts) and len(opts) >= 2:
            lens = sorted((len(str(o)), j) for j, o in enumerate(opts))
            if lens[-1][1] == cor and lens[-1][0] >= 1.5 * max(1, lens[-2][0]) and lens[-1][0] - lens[-2][0] >= 15:
                W.append(f"{path}: poprawna opcja dużo dłuższa od reszty (podpowiedź)")
        sec = q.get("sec")
        if path.startswith("lesson.exit") and sec is not None and not (isinstance(sec, int) and 0 <= sec < len(secs)):
            E.append(f"{path}: sec={sec!r} nie wskazuje istniejącej sekcji")
    F["no_not"] = no_not
    F["definition_q"] = defq
    F["check_n"], F["check_def_n"] = nq_check, defq_check

    # długości i kolejność
    long_simple, long_body, formula_first = [], [], []
    for i, s in enumerate(secs):
        if words(s.get("simple")) > 60:
            long_simple.append(i)
        if words(s.get("body")) > 160:
            long_body.append(i)
        if s.get("intuition") and words(s["intuition"]) > 40:
            W.append(f"sections[{i}].intuition: {words(s['intuition'])} słów (maks. 40)")
        if words(s.get("body")) > 120:
            W.append(f"sections[{i}].body: {words(s.get('body'))} słów (cel 120)")
        if not s.get("intuition"):
            W.append(f"sections[{i}]: bez intuition")
            first = re.split(r"(?<=[.!?])\s", str(s.get("body") or "").strip(), maxsplit=1)[0]
            if "\\(" in first or "=" in first:
                formula_first.append(i)
        if not s.get("mistake"):
            W.append(f"sections[{i}]: bez mistake")
    F["long_simple"], F["long_body"], F["formula_first"] = long_simple, long_body, formula_first

    # atomy
    ids = [a.get("id") for a in atoms if isinstance(a, dict)]
    if len(ids) != len(set(ids)):
        E.append("atoms: powtórzone id")
    text = " ".join([str(s.get("body") or "") for s in secs] + [json.dumps(q, ensure_ascii=False) for _, q in questions(L)]).lower()
    for a in atoms:
        if not isinstance(a, dict):
            E.append("atoms: wpis nie jest obiektem")
            continue
        for ref in a.get("conf") or []:
            ref = str(ref)
            if "#" in ref:
                mid, aid = ref.split("#", 1)
                other = (by_id or {}).get(mid)
                if other is not None and aid not in [x.get("id") for x in atoms_of(other.get("content") or {})]:
                    E.append(f"atoms[{a.get('id')}].conf: {ref} nie istnieje")
            elif ref not in ids:
                E.append(f"atoms[{a.get('id')}].conf: {ref} nie istnieje")
        if words(a.get("d")) > 25:
            W.append(f"atoms[{a.get('id')}].d: {words(a.get('d'))} słów (maks. 25)")
        if words(a.get("a")) > 15:
            W.append(f"atoms[{a.get('id')}].a: {words(a.get('a'))} słów (maks. 15)")
        if a.get("t") and str(a["t"]).lower() not in text:
            W.append(f"atoms[{a.get('id')}]: „{a['t']}” nie pojawia się w body, check ani exit")
    F["atoms_n"] = len(atoms) or len(atoms_of(c))

    # gen
    gens = L.get("gen") if isinstance(L.get("gen"), list) else []
    for j, g in enumerate(gens):
        tag = f"gen[{g.get('id', j) if isinstance(g, dict) else j}]"
        if not isinstance(g, dict):
            E.append(f"{tag}: nie jest obiektem")
            continue
        vs = g.get("vars") or {}
        if task_vars(g.get("task")) != set(vs):
            E.append(f"{tag}: zmienne w task {sorted(task_vars(g.get('task')))} ≠ vars {sorted(vs)}")
        try:
            tree = parse(g.get("answer", ""), list(vs))
        except ExprError as e:
            E.append(f"{tag}: answer się nie parsuje ({e})")
            continue
        bad = []
        for k in range(20):
            r = evaluate(tree, rand_vals(vs, k))
            if not math.isfinite(r):
                bad.append("nieskończony")
            elif decimals(r) > 4:
                W.append(f"{tag}: wynik {r} ma dużo miejsc po przecinku")
                break
        if bad:
            E.append(f"{tag}: {len(bad)} z 20 losowań daje wynik nieskończony")
    F["gen_n"] = len(gens)
    F["quant_no_gen"] = (doc.get("subjectId") in QUANT or L.get("type") == "quant") and not gens
    return {"errors": E, "warnings": W, "flags": F}
