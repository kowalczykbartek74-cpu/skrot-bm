# Wyciąg dla recenzenta etapu N z ~/zdawalni/ux/petla-2.md: kryteria etapu, tabela ocen, twarde błędy, B3 i umowy, znaleziska C.
import sys, re, os
n = int(sys.argv[1])
src = open(os.path.expanduser("~/zdawalni/ux/petla-2.md"), encoding="utf8").read()
def between(a, b):
    i = src.index(a); j = src.index(b, i + len(a)); return src[i:j].rstrip()
etapy = between("### B2. Etapy", "### Tabela ocen recenzenta")
parts = re.split(r"(?=\*\*Etap \d)", etapy)
etap = [p for p in parts if p.startswith(f"**Etap {n} ")][0].rstrip()
ocen = between("### Tabela ocen recenzenta", "### B3.")
twarde = re.search(r"\*\*Twarde błędy.*?(?=\n\n###|\n### )", src, re.S).group(0)
b3 = between("### B3. Kto co robi", "### B4.")
b1 = between("### B1. Decyzje przyjęte domyślnie", "### B2.")
c = between(f"### C{n} ·", f"### C{n+1} ·") if f"### C{n+1} ·" in src else src[src.index(f"### C{n} ·"):]
out = f"""# Materiał dla recenzenta · UX-2 etap {n}

## Kryteria etapu
{etap}

{ocen}

## Twarde błędy
{twarde}

## Decyzje przyjęte (B1)
{b1.split(chr(10),1)[1]}

## Podział pracy między pętlami (B3) i umowy
{b3.split(chr(10),1)[1]}

## Pełne znaleziska audytu dla etapu
{c}
"""
open(f"docs/audyt-ux/petla-2/recenzja/etap-{n}.md", "w", encoding="utf8").write(out)
print(len(out))
