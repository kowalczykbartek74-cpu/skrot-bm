// Rdzeń funkcji Edge „sprawdz-zdjecie” (etap 13 „Systemy z Zdawalni w Skrócie”), bez Deno i bez klienta bazy, żeby dało się
// go sprawdzić testem w Node (tests/zdjecie.test.js) z atrapą bazy i API Anthropic. index.ts tylko go podpina.
//
// Ta sama ścieżka co ocena AI testu (grade-open): logowanie i pełny dostęp przez nauka_ja, dzienny limit w bazie
// (SQL v39 nauka_zdjecie_bierz, decyzja D9: 5 dziennie, starosta bez limitu), Messages API z odpowiedzią według schematu,
// nagłówek server-side-fallback, limit czasu. Zdjęcie (decyzja D8) jest tylko w pamięci tego wywołania: nie trafia do bazy,
// do storage ani do logów (console.error dostaje tylko status i treść błędu API, nigdy body zapytania).
// Gdy AI nie odpowie (czas, błąd API, odmowa, zły format po 2 próbach), miejsce w limicie wraca (nauka_zdjecie_zwroc).

export interface Logika {
  PHOTO_TYPES: string[];
  DAILY_LIMIT: number;
  photoError(f: { size: number; type: string }): string | null;
  bajtyBase64(s: string): number;
  klucz(z: unknown): { task: string; maxPoints: number | null; result: number | null; answer: string; steps: string[] };
  maKlucz(z: unknown): boolean;
  checkPhotoResult(raw: unknown, maxPoints: number | null): { ok: true; result: Record<string, unknown> } | { ok: false; error: string };
  zapytanie(o: Record<string, unknown>): Record<string, unknown>;
}
export interface Zaleznosci {
  rpc(fn: string, args?: Record<string, unknown>): Promise<{ data: any; error: unknown }>;        // jako zalogowana osoba
  rpcSerwer(fn: string, args?: Record<string, unknown>): Promise<{ data: any; error: unknown }>;  // service_role (tylko zwrot)
  fetch: typeof fetch;
  env: (k: string) => string | undefined;
  Z: Logika;
}

const ORIGINS = ["https://skrotbm.pl", "https://www.skrotbm.pl", "https://kowalczykbartek74-cpu.github.io"];
const MAX_BYTES = 7_500_000;   // całe zapytanie: zdjęcie ≤ 5 MB w base64 (×4/3) + klucz zadania
const TIMEOUT_MS = 55000;      // na obie próby razem; potem strona mówi „spróbuj za chwilę”

export function cors(req: Request) {
  const o = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ORIGINS.includes(o) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o) ? o : ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-skrot-device",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

export async function obsluz(req: Request, d: Zaleznosci): Promise<Response> {
  const h = { ...cors(req), "Content-Type": "application/json" };
  const out = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: h });
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return out(405, { code: "method", message: "Tylko POST." });
  const Z = d.Z;

  const key = d.env("ANTHROPIC_API_KEY");
  if (!key) return out(500, { code: "no_key", message: "Brak ANTHROPIC_API_KEY w sekretach Supabase." });

  const { data: me, error } = await d.rpc("nauka_ja");
  if (error || !me) return out(403, { code: "not_signed_in", message: "Zaloguj się, żeby sprawdzić zdjęcie." });
  if (!me.admin && !me.platny) return out(403, { code: "not_granted", message: "Sprawdzanie zdjęcia jest w pełnym dostępie." });

  const raw = await req.text();
  if (raw.length > MAX_BYTES) return out(413, { code: "too_large", message: "Zdjęcie może mieć najwyżej 5 MB." });
  let body: Record<string, unknown> = {};
  try { body = JSON.parse(raw); } catch { /* pusty */ }
  const data = String(body?.image || "");
  const mediaType = String(body?.mediaType || "image/jpeg");
  const bad = Z.photoError({ size: Math.max(0, Z.bajtyBase64(data)), type: mediaType });
  if (bad) return out(400, { code: "bad_photo", message: bad });
  if (!Z.maKlucz(body?.task)) return out(400, { code: "no_key_answer", message: "To zadanie nie ma rozwiązania wzorcowego." });
  const k = Z.klucz(body?.task);
  const lang = body?.lang === "en" ? "en" : "pl";
  const rocznik = typeof body?.rocznik === "string" ? body.rocznik.slice(0, 80) : null;

  const limit = Number(d.env("PHOTO_DAILY_LIMIT")) || Z.DAILY_LIMIT;
  const { data: lim, error: e2 } = await d.rpc("nauka_zdjecie_bierz", { p_limit: limit, p_rocznik: rocznik });
  if (e2) return out(503, { code: "not_enabled", message: "Sprawdzanie zdjęć nie jest jeszcze włączone (SQL v39)." });
  if (!lim?.ok) {
    if (lim?.code === "limit") return out(429, { code: "limit", message: `Na dziś to już ${limit} sprawdzeń ze zdjęcia. Nowe jutro.`, limit, used: lim.uzyte });
    return out(403, { code: "not_granted", message: "Sprawdzanie zdjęcia jest w pełnym dostępie." });
  }
  const zwroc = () => d.rpcSerwer("nauka_zdjecie_zwroc", { p_user: lim.u, p_id: lim.id }).catch(() => null);
  const fail = async (status: number, code: string, message: string) => { await zwroc(); return out(status, { code, message }); };

  const model = d.env("PHOTO_MODEL") || d.env("GRADE_MODEL") || "claude-sonnet-5-5";
  const effort = d.env("PHOTO_EFFORT") || "medium";
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  let lastError = "";
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      let res: Response;
      try {
        res = await d.fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          signal: ctl.signal,
          headers: {
            "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json",
            // Odmowa klasyfikatora → serwer sam ponawia na zalecanym modelu.
            "anthropic-beta": "server-side-fallback-2026-07-01",
          },
          body: JSON.stringify(Z.zapytanie({ model, effort, klucz: k, lang, data, mediaType, lastError: attempt ? lastError : "" })),
        });
      } catch {
        return await fail(504, "timeout", "AI nie zdążyło sprawdzić zdjęcia.");
      }
      if (res.status === 429 || res.status === 529) return await fail(503, "rate_limited", "AI jest teraz zajęte.");
      if (!res.ok) {
        const detail = (await res.text().catch(() => "")).slice(0, 400);
        console.error("anthropic", res.status, detail);
        return await fail(502, "upstream", "API Anthropic zwróciło błąd " + res.status + ".");
      }
      const msg = await res.json();
      if (msg.stop_reason === "refusal" || msg.stop_reason === "max_tokens") return await fail(502, msg.stop_reason, "AI nie sprawdziło zdjęcia.");
      const text: string = (msg.content || []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
      let parsed: unknown = null;
      try { parsed = JSON.parse(text); } catch { lastError = "not JSON"; continue; }
      const check = Z.checkPhotoResult(parsed, k.maxPoints);
      if (check.ok) {
        const remaining = lim.admin ? -1 : Math.max(0, (lim.limit ?? limit) - (lim.uzyte ?? 0));
        return out(200, { ok: true, result: check.result, maxPoints: k.maxPoints, remaining, limit, model: msg.model, usage: msg.usage });
      }
      lastError = check.error;
    }
  } catch {
    // Przerwane w trakcie czytania odpowiedzi (limit czasu) albo inny nieoczekiwany błąd: miejsce w limicie wraca.
    return await fail(504, "timeout", "AI nie zdążyło sprawdzić zdjęcia.");
  } finally {
    clearTimeout(timer);
  }
  return await fail(502, "invalid_json", "Ocena ma zły format (" + lastError + ").");
}
