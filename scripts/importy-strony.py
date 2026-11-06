# Mapa „przedmiot → strony w PDF-ie sylabusa” dla pilota kolejki importów (etap 14 „Systemy z Zdawalni w Skrócie”).
# Atrapa modelu w tests/importy.test.js zwraca dla każdej części PDF-u te przedmioty, które w niej się zaczynają
# (tak jak zrobi to prawdziwy model według profilu importy/WEFiZ.json), z numerem strony i krótkim fragmentem.
# Użycie: python3 scripts/importy-strony.py SYLABUS.pdf > tests/fixtures/importy-wefiz-strony.json   (wymaga PyMuPDF: import pymupdf)
import json, re, sys
import pymupdf as fitz

doc = fitz.open(sys.argv[1])
out = []
for i, page in enumerate(doc):
    t = page.get_text()
    if "Curriculum title:" not in t:
        continue
    code = re.search(r"EFZ\w+", t)
    lines = [l.strip() for l in t.split("\n") if l.strip()]
    j = lines.index("Curriculum title:") + 2 if "Curriculum title:" in lines else -1
    if 0 <= j < len(lines) and lines[j] == "Unit:":
        j += 2   # „Unit:” i nazwa modułu przed tytułem przedmiotu
    title = lines[j] if 0 <= j < len(lines) else ""
    if out:
        out[-1]["koniec"] = i
    out.append({"code": code.group(0) if code else None, "strona": i + 1, "koniec": doc.page_count, "fragment": ("Course title: " + title + " · Course code: " + (code.group(0) if code else ""))[:300]})
print(json.dumps({"plik": sys.argv[1].split("/")[-1], "strony": doc.page_count, "przedmioty": out}, ensure_ascii=False, indent=1))
