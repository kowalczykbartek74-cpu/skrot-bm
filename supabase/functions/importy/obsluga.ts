// Rdzeń funkcji Edge „importy” (etap 14 „Systemy z Zdawalni w Skrócie”): kolejka „PDF → szkic AI → zatwierdzenie → import”.
// Bez Deno, bez klienta bazy i bez biblioteki PDF, żeby dało się go sprawdzić testem w Node (tests/importy.test.js) z atrapą
// bazy, Storage, PDF-u i API Anthropic. index.ts tylko go podpina.
//
// Akcje (POST JSON, tylko administrator: baza sprawdza nauka_admin() w każdej funkcji SQL v40, a tu dodatkowo nauka_ja):
//   wgraj   { typ, wydzial, rocznik?, opis?, nazwa, pdf (base64) } → { ok, id, istnieje, strony, czesci }
//           PDF trafia do prywatnego bucketu „importy” jako <id importu>.pdf; ten sam plik (sha256) dla tego samego typu i wydziału
//           (jeszcze nie zatwierdzony ani odrzucony) nie tworzy drugiego importu.
//   czytaj  { id, czesc } → { ok, stan, przeczytane, czesci, nowe, poza }
//           Wycinek PDF-u (strony części + zakładka z profilu) idzie do Messages API jako blok document; odpowiedź według
//           schematu z profilu (output_config.format); pozycje trafiają do bazy jako szkic (decyzja = null).
//   pdf     { id } → { ok, url }   podpisany link do PDF-u na 10 minut (panel pokazuje stronę obok pozycji)
//   sprzataj {} → { ok, usuniete } kasuje z bucketu PDF-y zatwierdzonych/odrzuconych i starszych niż 30 dni
//           (to samo robi co dzień pg_cron, jeśli Storage pozwala kasować z SQL; tu zawsze przez API Storage).
// Profil wydziału (importy/<WYDZIAŁ>.json) funkcja pobiera ze strony (PROFILE_BASE, domyślnie https://zdawalni.pl/importy/),
// więc nowy wydział = nowy plik profilu w repozytorium strony, bez zmian tutaj.

export interface Logika {
  RE_WYDZIAL: RegExp;
  PDF_MAX_BYTES: number;
  profilSprawdz(p: unknown): string[];
  profilTypu(p: any, typ: string): any;
  czesci(strony: number, pt: any): { czesc: number; od: number; do: number; doZ: number }[];
  zapytanie(o: Record<string, unknown>): Record<string, unknown>;
  sprawdzWynik(raw: unknown, pt: any, c: any): { ok: true; pozycje: any[]; uwagi: string; poza: number } | { ok: false; error: string };
  toHex(buf: ArrayBuffer): string;
  jestPdf(b: Uint8Array): boolean;
}
export interface Zaleznosci {
  rpc(fn: string, args?: Record<string, unknown>): Promise<{ data: any; error: unknown }>;   // jako zalogowana osoba (admin)
  storage: {
    upload(path: string, bytes: Uint8Array): Promise<{ error: unknown }>;
    download(path: string): Promise<{ data: Uint8Array | null; error: unknown }>;
    remove(paths: string[]): Promise<{ error: unknown }>;
    signedUrl(path: string, sekundy: number): Promise<{ url: string | null; error: unknown }>;
  };
  pdf: { strony(b: Uint8Array): Promise<number>; wytnij(b: Uint8Array, od: number, doStr: number): Promise<Uint8Array> };
  profil(wydzial: string): Promise<any>;
  fetch: typeof fetch;
  env: (k: string) => string | undefined;
  I: Logika;
}

const ORIGINS = ["https://zdawalni.pl", "https://www.zdawalni.pl", "https://skrotbm.pl", "https://www.skrotbm.pl", "https://kowalczykbartek74-cpu.github.io"];
const MAX_BODY = 21_000_000;     // PDF ≤ 15 MB w base64 (×4/3) + pola
const TIMEOUT_MS = 140000;       // jedna część; limit czasu funkcji Edge to 150 s (plan Free) / 400 s (płatny)

export function cors(req: Request) {
  const o = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ORIGINS.includes(o) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o) ? o : ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-skrot-device",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function b64ToBytes(s: string): Uint8Array | null {
  try {
    if (!s || s.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(s)) return null;
    const bin = atob(s); const b = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
    return b;
  } catch { return null; }
}
function bytesToB64(b: Uint8Array): string {
  let s = ""; const CH = 0x8000;
  for (let i = 0; i < b.length; i += CH) s += String.fromCharCode.apply(null, Array.from(b.subarray(i, i + CH)));
  return btoa(s);
}

// Kasuje PDF-y, których już nie potrzeba (zatwierdzone, odrzucone, starsze niż 30 dni). Błędy nie przerywają akcji.
async function sprzataj(d: Zaleznosci): Promise<number> {
  const { data, error } = await d.rpc("nauka_importy_do_sprzatniecia");
  if (error || !Array.isArray(data)) return 0;
  let n = 0;
  for (const x of data) {
    if (!x?.sciezka) continue;
    const r = await d.storage.remove([x.sciezka]);
    if (!r.error) { await d.rpc("nauka_import_pdf_usuniety", { p_id: x.id }); n++; }
  }
  return n;
}

export async function obsluz(req: Request, d: Zaleznosci): Promise<Response> {
  const h = { ...cors(req), "Content-Type": "application/json" };
  const out = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: h });
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return out(405, { code: "method", message: "Tylko POST." });
  const I = d.I;

  const { data: me, error } = await d.rpc("nauka_ja");
  if (error || !me) return out(403, { code: "not_signed_in", message: "Zaloguj się." });
  if (!me.admin) return out(403, { code: "not_admin", message: "Importy są tylko dla administratora." });

  const raw = await req.text();
  if (raw.length > MAX_BODY) return out(413, { code: "too_large", message: "PDF może mieć najwyżej 15 MB." });
  let body: Record<string, any> = {};
  try { body = JSON.parse(raw); } catch { /* pusty */ }
  const akcja = String(body?.akcja || "");

  if (akcja === "sprzataj") return out(200, { ok: true, usuniete: await sprzataj(d) });

  if (akcja === "wgraj") {
    const wydzial = String(body.wydzial || "");
    if (!I.RE_WYDZIAL.test(wydzial)) return out(400, { code: "bad_faculty", message: "Zły kod wydziału." });
    let profil: any = null;
    try { profil = await d.profil(wydzial); } catch { profil = null; }
    if (!profil || I.profilSprawdz(profil).length) return out(400, { code: "no_profile", message: `Brak profilu importy/${wydzial}.json albo profil ma błędy.` });
    const typ = String(body.typ || "");
    const pt = I.profilTypu(profil, typ);
    if (!pt) return out(400, { code: "no_type", message: `Profil ${wydzial} nie ma typu „${typ}”.` });
    const bytes = b64ToBytes(String(body.pdf || ""));
    if (!bytes || !I.jestPdf(bytes)) return out(400, { code: "bad_pdf", message: "To nie jest plik PDF." });
    if (bytes.length > I.PDF_MAX_BYTES) return out(413, { code: "too_large", message: "PDF może mieć najwyżej 15 MB." });
    let strony = 0;
    try { strony = await d.pdf.strony(bytes); } catch { strony = 0; }
    if (!strony) return out(400, { code: "bad_pdf", message: "Nie da się odczytać stron tego PDF-u (zaszyfrowany albo uszkodzony?)." });
    await sprzataj(d).catch(() => 0);
    const sha = I.toHex(await crypto.subtle.digest("SHA-256", bytes));
    const czesci = I.czesci(strony, pt).length;
    const { data: nowy, error: e1 } = await d.rpc("nauka_import_nowy", {
      p_typ: typ, p_wydzial: wydzial, p_rocznik: body.rocznik || null, p_opis: String(body.opis || "").slice(0, 300) || null,
      p_sha: sha, p_nazwa: String(body.nazwa || "plik.pdf").slice(0, 200), p_bajty: bytes.length, p_strony: strony, p_czesci: czesci,
    });
    if (e1) return out(503, { code: "not_enabled", message: "Importy nie są jeszcze włączone (SQL v40)." });
    if (!nowy?.ok) return out(400, { code: nowy?.code || "error", message: "Nie udało się dodać importu." });
    if (!nowy.istnieje || !nowy.pdf) {
      const up = await d.storage.upload(String(nowy.sciezka), bytes);
      if (up.error) return out(502, { code: "storage", message: "Nie udało się zapisać PDF-u (bucket „importy”, SQL v40)." });
    }
    return out(200, { ok: true, id: nowy.id, istnieje: !!nowy.istnieje, strony, czesci });
  }

  const id = String(body.id || "");
  if (!/^[0-9a-f-]{36}$/.test(id)) return out(400, { code: "bad_id", message: "Brak importu." });
  const { data: row, error: e2 } = await d.rpc("nauka_import_pobierz", { p_id: id });
  if (e2) return out(503, { code: "not_enabled", message: "Importy nie są jeszcze włączone (SQL v40)." });
  if (!row?.ok) return out(404, { code: "not_found", message: "Nie ma takiego importu." });
  const imp = row.import;

  if (akcja === "pdf") {
    if (!imp.pdf_sciezka || imp.pdf_usuniety_at) return out(410, { code: "pdf_gone", message: "PDF jest już skasowany (po zatwierdzeniu albo po 30 dniach)." });
    const s = await d.storage.signedUrl(imp.pdf_sciezka, 600);
    if (s.error || !s.url) return out(502, { code: "storage", message: "Nie udało się otworzyć PDF-u." });
    return out(200, { ok: true, url: s.url });
  }

  if (akcja === "czytaj") {
    if (imp.stan !== "szkic") return out(409, { code: "bad_state", message: "Ten import jest już przeczytany." });
    const key = d.env("ANTHROPIC_API_KEY");
    if (!key) return out(500, { code: "no_key", message: "Brak ANTHROPIC_API_KEY w sekretach Supabase." });
    let profil: any = null;
    try { profil = await d.profil(imp.wydzial); } catch { profil = null; }
    const pt = profil ? I.profilTypu(profil, imp.typ) : null;
    if (!pt) return out(400, { code: "no_profile", message: `Brak profilu importy/${imp.wydzial}.json dla typu ${imp.typ}.` });
    const parts = I.czesci(imp.strony, pt);
    const c = parts.find((x) => x.czesc === Number(body.czesc));
    if (!c) return out(400, { code: "bad_part", message: "Nie ma takiej części." });
    if (!imp.pdf_sciezka || imp.pdf_usuniety_at) return out(410, { code: "pdf_gone", message: "PDF jest już skasowany. Wgraj go jeszcze raz." });
    const dl = await d.storage.download(imp.pdf_sciezka);
    if (dl.error || !dl.data) return out(502, { code: "storage", message: "Nie udało się pobrać PDF-u z bucketu." });
    let wycinek: Uint8Array;
    try { wycinek = await d.pdf.wytnij(dl.data, c.od, c.doZ); } catch { return out(400, { code: "bad_pdf", message: "Nie da się wyciąć stron z PDF-u." }); }
    const pdf64 = bytesToB64(wycinek);

    const model = d.env("IMPORT_MODEL") || "claude-sonnet-5-5";
    const effort = d.env("IMPORT_EFFORT") || undefined;
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    let lastError = "";
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        let res: Response;
        try {
          res = await d.fetch("https://api.anthropic.com/v1/messages", {
            method: "POST", signal: ctl.signal,
            headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json", "anthropic-beta": "server-side-fallback-2026-07-01" },
            body: JSON.stringify(I.zapytanie({ profil, typ: imp.typ, czesc: c, strony: imp.strony, pdf: pdf64, model, effort, lastError: attempt ? lastError : "" })),
          });
        } catch { return out(504, { code: "timeout", message: "AI nie zdążyło przeczytać tej części. Spróbuj jeszcze raz." }); }
        if (res.status === 429 || res.status === 529) return out(503, { code: "rate_limited", message: "AI jest teraz zajęte. Spróbuj za chwilę." });
        if (!res.ok) {
          const detail = (await res.text().catch(() => "")).slice(0, 400);
          console.error("anthropic", res.status, detail);
          return out(502, { code: "upstream", message: "API Anthropic zwróciło błąd " + res.status + "." });
        }
        const msg = await res.json();
        if (msg.stop_reason === "refusal") return out(502, { code: "refusal", message: "AI odmówiło przeczytania tej części." });
        if (msg.stop_reason === "max_tokens") { lastError = "output too long: return fewer, complete items"; continue; }
        const text: string = (msg.content || []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
        let parsed: unknown = null;
        try { parsed = JSON.parse(text); } catch { lastError = "not JSON"; continue; }
        const w = I.sprawdzWynik(parsed, pt, c);
        if (!w.ok) { lastError = w.error; continue; }
        const { data: zap, error: e3 } = await d.rpc("nauka_import_czesc", {
          p_id: id, p_czesc: c.czesc, p_pozycje: w.pozycje, p_uwagi: w.uwagi || null, p_model: msg.model || model, p_usage: msg.usage || null,
        });
        if (e3 || !zap?.ok) return out(409, { code: zap?.code || "save", message: "Nie udało się zapisać pozycji tej części." });
        return out(200, { ok: true, stan: zap.stan, przeczytane: zap.przeczytane, czesci: zap.czesci, nowe: w.pozycje.length, poza: w.poza, usage: msg.usage || null });
      }
    } catch {
      return out(504, { code: "timeout", message: "AI nie zdążyło przeczytać tej części. Spróbuj jeszcze raz." });
    } finally { clearTimeout(timer); }
    return out(502, { code: "invalid_json", message: "Wynik AI ma zły format (" + lastError + "). Spróbuj jeszcze raz." });
  }

  return out(400, { code: "bad_action", message: "Nieznana akcja." });
}
