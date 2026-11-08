// Lekcje v4, D1: eksport treści lekcji (bez kluczy i danych użytkowników).
// Uruchom w konsoli na zalogowanej stronie skrotbm.pl (konto z pełnym dostępem). Zwraca { pliki: { "<id>.json": "..." } }
// i pobiera jeden plik lekcje-eksport.json; rozpakuj go do scratch/lessons/ poleceniem:
//   python3 -c "import json,os;d=json.load(open('lekcje-eksport.json'));[open('scratch/lessons/'+k,'w').write(v) for k,v in d['pliki'].items()]"
(async () => {
  const sb = window.skrot?.sb; if (!sb) throw new Error("Brak window.skrot.sb – zaloguj się na skrotbm.pl");
  const all = async (col, cols) => { let out = [], from = 0; for (;;) { const { data, error } = await sb.from("nauka_docs").select(cols).eq("kolekcja", col).range(from, from + 999); if (error) throw error; out = out.concat(data); if (data.length < 1000) return out; from += 1000; } };
  const mats = new Map((await all("materials", "id,data")).filter((r) => r.data?.kind === "lesson").map((r) => [r.id, r.data]));
  const pliki = {};
  for (const r of await all("materialContent", "id,data,rocznik_id")) {
    const m = mats.get(r.id); if (!m || !r.data?.lesson) continue;
    // zrodlo i odciski (paczki kierunków) do scripts/tresci-bank.py synchronizuj; rocznik_id: eksport administratora ma wszystkie roczniki
    pliki[r.id + ".json"] = JSON.stringify({ id: r.id, subjectId: m.subjectId, title: m.title || "", order: m.order ?? null, content: r.data,
      ...(m.zrodlo ? { zrodlo: m.zrodlo } : {}), ...(m.zrodloHash ? { zrodloHash: m.zrodloHash, kopiaHash: m.kopiaHash } : {}), ...(r.rocznik_id ? { rocznik_id: r.rocznik_id } : {}) });
  }
  const blob = new Blob([JSON.stringify({ at: new Date().toISOString(), pliki })], { type: "application/json" });
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "lekcje-eksport.json" }); a.click();
  return { lekcje: Object.keys(pliki).length };
})();
