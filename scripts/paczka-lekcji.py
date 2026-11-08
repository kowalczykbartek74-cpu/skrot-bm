"""Paczka lekcji do wgrania w Panelu AI („Paczka lekcji”, tryb „Edytuję rocznik”). Nic nie zapisuje do bazy.

  python3 scripts/paczka-lekcji.py kierunki/<rocznik>.json <katalog z lekcjami> [--nazwa pilot] [--bez-kontroli]

Bierze lekcje z katalogu (wynik lekcje-z-bm.py k2 albo generatora K3: format eksportu + rocznik_id + zrodlo), tylko gotowe
(k2 = "gotowe" albo brak pola k2), i składa jeden plik scratch/<prefiks>/paczka-<nazwa>.json:
  { format: "zdawalni-paczka-lekcji", v: 1, rocznik, utworzono, materials: {id: …}, materialContent: {id: …},
    materialSimple: {id: …}, quizWhy: {id: …} }
Przed złożeniem uruchamia node scripts/tresci-kontrola.mjs <katalog> --przed-wgraniem; kod ≠ 0 = brak paczki.
Zero nazw kierunków w kodzie: rocznik, prefiks i nazwa kierunku są z pliku kierunku.
"""
import argparse, glob, json, os, subprocess, sys, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser()
ap.add_argument("kierunek")
ap.add_argument("katalog")
ap.add_argument("--nazwa", default="paczka")
ap.add_argument("--bez-kontroli", action="store_true", help="tylko do testów")
ap.add_argument("--wyjscie", default=None)
ap.add_argument("--dodatki", default=None, help="eksport materialSimple/quizWhy BM (domyślnie najnowszy scratch/lekcje-dodatki-eksport-*.json)")
a = ap.parse_args()

K = json.load(open(a.kierunek if os.path.isabs(a.kierunek) else os.path.join(ROOT, a.kierunek)))
KAT = a.katalog if os.path.isabs(a.katalog) else os.path.join(ROOT, a.katalog)
lekcje, pominiete = [], []
for f in sorted(os.listdir(KAT)):
    if not f.endswith(".json"):
        continue
    d = json.load(open(os.path.join(KAT, f)))
    if not (d.get("content") or {}).get("lesson"):
        continue
    if d.get("k2") not in (None, "gotowe"):
        pominiete.append(f"{d['id']} (k2: {d.get('k2')})"); continue
    if not d.get("sylRef"):
        pominiete.append(f"{d['id']} (brak sylRef: lekcje-z-bm.py sylref)"); continue
    if d.get("rocznik_id") != K["id"]:
        pominiete.append(f"{d['id']} (inny rocznik: {d.get('rocznik_id')})"); continue
    lekcje.append(d)
if not lekcje:
    sys.exit("Brak gotowych lekcji w " + os.path.relpath(KAT, ROOT) + (". Pominięte: " + ", ".join(pominiete) if pominiete else ""))

if not a.bez_kontroli:
    r = subprocess.run(["node", os.path.join(ROOT, "scripts", "tresci-kontrola.mjs"), KAT, "--przed-wgraniem"], cwd=ROOT, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stdout[-1500:], r.stderr[-500:])
        sys.exit("Kontrola treści nie przeszła (scratch/tresci-raport.md) – paczki nie składam.")

# „Prościej · PL” i „Dlaczego?” z BM są już po polsku: kopia 1:1 (K1) pod nowe id, jeśli lekcja ich nie ma i źródło to lekcja BM.
# quizWhy jest po indeksach pytań; K2 nie zmienia kolejności pytań (porównanie ze źródłem), więc indeksy pasują.
DOD = {"materialSimple": {}, "quizWhy": {}}
pd = a.dodatki or (sorted(glob.glob(os.path.join(ROOT, "scratch", "lekcje-dodatki-eksport-*.json"))) or [None])[-1]
if pd:
    DOD = json.load(open(pd))

teraz = int(time.time() * 1000)
P = {"format": "zdawalni-paczka-lekcji", "v": 1, "rocznik": K["id"], "utworzono": teraz,
     "materials": {}, "materialContent": {}, "materialSimple": {}, "quizWhy": {}}
for d in lekcje:
    c, les = d["content"], d["content"]["lesson"]
    P["materials"][d["id"]] = {
        "kind": "lesson", "v": 2, "source": "kierunek", "zrodlo": d.get("zrodlo"), "subjectId": d["subjectId"],
        "title": d.get("title", ""), "order": d.get("order"), "lang": K.get("jezykZajec", "pl"),
        **({"sylRef": d["sylRef"]} if d.get("sylRef") else {}),
        # odciski źródła i kopii (scripts/tresci-bank.py synchronizuj): jadą do bazy, wracają w eksporcie lekcji
        **{k: d[k] for k in ("zrodloHash", "kopiaHash") if d.get(k)},
        "fileName": f"Sylabus {K['kierunek']['pl']}", "fileType": "sylabus", "createdAt": teraz,
        "topicCount": len(les.get("sections") or []), "conceptCount": len(c.get("concepts") or []),
        "flashcardCount": len(c.get("flashcards") or []), "quizCount": len(c.get("quiz") or [])}
    P["materialContent"][d["id"]] = c
    bid = (d.get("zrodlo") or "")[3:] if (d.get("zrodlo") or "").startswith("bm:") else None
    if d.get("simple"):
        P["materialSimple"][d["id"]] = d["simple"]
    elif bid:
        for k, v in DOD.get("materialSimple", {}).items():
            if k == bid or k.startswith(bid + "~"):
                P["materialSimple"][d["id"] + k[len(bid):]] = v
    if d.get("why"):
        P["quizWhy"][d["id"]] = d["why"]
    elif bid and bid in DOD.get("quizWhy", {}):
        P["quizWhy"][d["id"]] = DOD["quizWhy"][bid]
OUT = a.wyjscie or os.path.join(ROOT, "scratch", K["prefiks"], f"paczka-{a.nazwa}.json")
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(P, open(OUT, "w"), ensure_ascii=False)
po = {}
for m in P["materials"].values():
    po[m["subjectId"]] = po.get(m["subjectId"], 0) + 1
print(f"Paczka: {os.path.relpath(OUT, ROOT)} · {len(lekcje)} lekcji ({', '.join(f'{k}: {v}' for k, v in po.items())}) · "
      f"{os.path.getsize(OUT) // 1024} KB · Prościej: {len(P['materialSimple'])} · Dlaczego?: {len(P['quizWhy'])}" + (f"\nPominięte: {', '.join(pominiete)}" if pominiete else ""))
print("Wgranie: zdawalni.pl → Więcej → „Edytuję rocznik”: " + K["kierunek"]["pl"] + " → Więcej → Panel AI → „Paczka lekcji”.")
