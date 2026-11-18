# Dopisuje pary PL→EN do bloku „// ux-6” w i18n-en.js (exact). Użycie: python3 docs/audyt-ux/petla-6/en.py pary.json
import json, sys
p = 'i18n-en.js'; s = open(p, encoding='utf-8').read()
if '// ux-6\n' not in s:
    a = '"Odbierz": "Collect"\n},'
    assert s.count(a) == 1
    s = s.replace(a, '"Odbierz": "Collect",\n// ux-6\n"__ux6": "__ux6"\n// koniec ux-6\n},')
pary = json.load(open(sys.argv[1], encoding='utf-8'))
for pl, en in pary.items():
    k = json.dumps(pl, ensure_ascii=False) + ':'
    if k in s: print('już jest:', pl); continue
    s = s.replace('"__ux6": "__ux6"\n// koniec ux-6', f'{json.dumps(pl, ensure_ascii=False)}: {json.dumps(en, ensure_ascii=False)},\n"__ux6": "__ux6"\n// koniec ux-6', 1)
open(p, 'w', encoding='utf-8').write(s)
print('ok', len(pary))
