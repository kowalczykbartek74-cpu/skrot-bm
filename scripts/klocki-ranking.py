"""Ranking przedmiotów ogólnych na całym US (grupy 1. roku / koszt zrobienia raz). Dane: docs/kierunki/us-rok1-przedmioty.json.
  python3 scripts/klocki-ranking.py   (spec: claude/klocki-spec.md, Etap 1)"""
import json,re,collections,os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D=[(k["wydzial"],k) for k in json.load(open(os.path.join(ROOT,"docs/kierunki/us-rok1-przedmioty.json")))["roczniki"]]
D=[(w,k) for w,k in D if k["przedmioty_rok1_zima"] and not k.get("gotowy")]
# reguły: (wzorzec, nazwa ogólna, źródło)  źródło: BM = jest w BM / banku PL, NEW = trzeba pisać
R=[
(r"własności intelektualnej|intellectual property|prawa autorskiego|prawo autorskie","Ochrona własności intelektualnej","BM"),
(r"^(technologi[ae] informac|technologi[ae] informat|techniki informat|information technolog|podstawy informatyki|informatyka w administracji|informatyka ekonomiczna|systemy i techniki informat|narzędzia informatyczne)","Technologie informacyjne","BM"),
(r"^(ekonomia|podstawy ekonomii|mikroekonomia|podstawy mikroekonomii|introduction to economy)$","Ekonomia / mikroekonomia","BM"),
(r"^(makroekonomia|podstawy makroekonomii)$","Makroekonomia","BM"),
(r"^(podstawy prawa|wstęp do prawoznawstwa|podstawy prawoznawstwa|nauka o państwie i prawie|wprowadzenie do prawa|elementy prawa|prawo|podstawy prawa dla ekonomistów|basic legal knowledge)$","Podstawy prawa / prawoznawstwo","BM"),
(r"^(matematyka|matematyka wyższa|matematyka dla|matematyka w zarządzaniu|analiza matematyczna|elementy matematyki)","Matematyka (kierunki niematematyczne)","BM"),
(r"^(podstawy zarządzania|wstęp do zarządzania|elementy zarządzania|podstawy organizacji i zarządzania|zarządzanie organizacją)","Podstawy zarządzania","BM"),
(r"^(podstawy finansów|finanse|wprowadzenie do finansów)$","Podstawy finansów","BM"),
(r"^(statystyka|statystyka opisowa|statystyka i analiza danych|elementy statystyki|biostatystyka)","Statystyka","NEW"),
(r"przedsiębiorczoś|entrepreneurship","Przedsiębiorczość","NEW"),
(r"projektowania uniwersalnego","Projektowanie uniwersalne","NEW"),
(r"^(socjologia|podstawy socjologii|socjologia ogólna|wprowadzenie do socjologii|selected aspects of sociology|socjologia dla geografów)","Socjologia (podstawy)","NEW"),
(r"^(psychologia$|podstawy psychologii|psychologia ogólna|wprowadzenie do psychologii)","Psychologia (podstawy)","NEW"),  # „psychologia$”: społeczna/rozwojowa liczą się osobno
(r"^psychologia społeczna$","Psychologia społeczna","NEW"),
(r"^(psychologia rozwojowa|psychologia rozwoju człowieka)","Psychologia rozwojowa","NEW"),
(r"^(historia filozofii$|wstęp do filozofii|propedeutyka filozofii|philosophy$|filozofia z|filozofia$)","Filozofia / historia filozofii","NEW"),
(r"^(logika|kultura logicznego myślenia)","Logika","NEW"),
(r"^(chemia|elementy chemii|chemia ogólna|chemia dla|analiza chemiczna|water chemistry)","Chemia (podstawy)","NEW"),
(r"^(biologia komórki|cell biology)","Biologia komórki","NEW"),
(r"^biofizyka","Biofizyka","NEW"),
(r"^(fizyka|podstawy fizyki)$","Fizyka (podstawy)","NEW"),
(r"anatomi|budowy i funkcjonowania organizmu","Anatomia człowieka","NEW"),
(r"^(wprowadzenie do pedagogiki|pedagogika$|pedagogika ogólna)","Pedagogika ogólna","NEW"),
(r"^teoretyczne podstawy wychowania","Teoretyczne podstawy wychowania","NEW"),
(r"^historia wychowania","Historia wychowania","NEW"),
(r"^pedagogika społeczna","Pedagogika społeczna","NEW"),
(r"^biomedyczne podstawy rozwoju","Biomedyczne podstawy rozwoju","NEW"),
(r"antropologiczne i kulturowe podstawy edukacji","Antropologiczne podstawy edukacji","NEW"),
(r"^administracja publiczna","Administracja publiczna","NEW"),
(r"^komunikacja interpersonalna","Komunikacja interpersonalna","NEW"),
(r"marketing","Marketing (podstawy)","NEW"),
(r"pierwsz[aej] pomoc","Pierwsza pomoc","NEW"),
(r"^(wstęp do językoznawstwa|wprowadzenie do językoznawstwa|introduction to general and applied linguistics)","Wstęp do językoznawstwa","NEW"),
(r"^akwizycja języka","Akwizycja języka obcego","NEW"),
(r"^(antropologia kulturowa|cultural antropology)","Antropologia kulturowa","NEW"),
(r"^(geologia|wstęp do geologii)$","Geologia (wstęp)","NEW"),
(r"^(podstawy rachunkowości)","Podstawy rachunkowości","NEW"),
(r"^(podstawy logistyki|logistyka i zarządzanie łańcuchem)","Logistyka","BM"),
(r"^genetyka$","Genetyka","NEW"),
(r"^(nauka o państwie|wiedza o państwie)$","Nauka o państwie","NEW"),
(r"^integracja europejska","Integracja europejska","NEW"),
(r"^metodologia badań społecznych","Metodologia badań społecznych","NEW"),
(r"^(historia najnowsza|najnowsza historia polityczna|historia współczesnego świata)","Historia najnowsza","NEW"),
]
S=collections.defaultdict(lambda:{"k":set(),"g":0,"src":"NEW","wydz":set(),"en":0})
for w,k in D:
  g=k["grupy"].get("1") or k["grupy"].get(1) or 1
  seen=set()
  for p in k["przedmioty_rok1_zima"]:
    pl=p.strip().lower()
    for pat,name,src in R:
      if re.search(pat,pl):
        if name in seen: break
        seen.add(name); s=S[name]; s["k"].add(f'{k["nazwa"]} {k["stopien"]}'); s["g"]+=g; s["src"]=src; s["wydz"].add(w)
        if k["jezyk"]=="en": s["en"]+=1
        break
rows=[]
for n,s in S.items():
  cost=0.44 if s["src"]=="BM" else 1.43
  rows.append((n,len(s["k"]),s["g"],len(s["wydz"]),s["src"],cost,round(s["g"]/cost,1),s["en"],sorted(s["wydz"])))
rows.sort(key=lambda r:-r[6])
for r in rows: print(f"{r[0]:42} kier {r[1]:3} grup {r[2]:3} wydz {r[3]} {r[4]:3} {r[5]:.2f}$ g/$ {r[6]:6} en {r[7]} {','.join(r[8])}")
print("roczników 1. roku:",len(D),"; wydziały:",sorted({w for w,_ in D}))
tot=collections.Counter(w for w,_ in D); print(tot)
