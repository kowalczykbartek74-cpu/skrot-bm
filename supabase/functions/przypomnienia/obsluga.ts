// Rdzeń funkcji Edge „przypomnienia” (etap 7a „Systemy z Zdawalni w Skrócie”), bez Deno i bez klienta bazy, żeby dało się go
// sprawdzić testem w Node (tests/przypomnienia.test.js) z atrapą bazy i Resend. index.ts tylko go podpina.
//
// 1) Uruchomienie z pg_cron (co 15 min, SQL v36 nauka_przypomnienia_wyzwol): POST z nagłówkiem x-cron-secret.
//    nauka_przypomnienia_kandydaci → osoby, którym wypada godzina (Europe/Warsaw), bez wpisu w logu na dziś, w limicie dnia
//    → logika z przypomnienia.js (kontekst → wybierz → mail) → wpis w logu (unikalny user + dzień) → Resend.
//    Mail nie wyszedł → wpis znika (następne uruchomienie w oknie godziny spróbuje jeszcze raz).
// 2) Wypisanie jednym kliknięciem: POST ?t=<token> (List-Unsubscribe-Post z programu pocztowego, RFC 8058) albo
//    POST { akcja: "wypisz", token } ze strony przypomnienia.html. GET ?t= tylko przekierowuje na tę stronę (skanery poczty
//    otwierają linki, więc samo wejście niczego nie wyłącza).

export interface Logika {
  kontekst(row: unknown, today: string): unknown;
  wybierz(ctx: unknown): { kind: string; title: string; body: string; cta: string; path: string } | null;
  mail(o: { lang: string; pick: unknown; site: string; id: string; unsubscribeUrl: string }): { subject: string; text: string; html: string };
}
export interface Zaleznosci {
  rpc(fn: string, args?: Record<string, unknown>): Promise<{ data: any; error: unknown }>;
  fetch: typeof fetch;
  env: (k: string) => string | undefined;
  P: Logika;
}

const SITE = "https://zdawalni.pl";
const TOKEN = /^[A-Za-z0-9_-]{20,80}$/;

const json = (status: number, body: unknown, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...extra } });

// Porównanie sekretu bez wczesnego wyjścia (czas nie zdradza, ile znaków się zgadza).
function rowne(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}

export function cors(req: Request) {
  const o = req.headers.get("origin") || "";
  const ok = ["https://zdawalni.pl", "https://www.zdawalni.pl", "https://skrotbm.pl", "https://www.skrotbm.pl", "https://kowalczykbartek74-cpu.github.io"].includes(o) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o);
  return {
    "Access-Control-Allow-Origin": ok ? o : "https://zdawalni.pl",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  };
}

async function wypisz(d: Zaleznosci, token: string) {
  if (!TOKEN.test(token)) return { ok: false, code: "token" };
  const { data, error } = await d.rpc("nauka_przypomnienia_wypisz", { p_token: token });
  if (error) return { ok: false, code: "not_enabled" };
  return data?.ok ? { ok: true } : { ok: false, code: "unknown" };
}

export async function wyslij(d: Zaleznosci, fnUrl: string) {
  const key = d.env("RESEND_API_KEY"), from = d.env("RESEND_FROM");
  if (!key || !from) return { ok: false, code: "no_mail", sent: 0, skipped: 0 };
  const { data, error } = await d.rpc("nauka_przypomnienia_kandydaci", {});
  if (error || !data?.ok) return { ok: false, code: "not_enabled", sent: 0, skipped: 0 };
  const site = d.env("SITE_URL") || SITE;
  let sent = 0, skipped = 0, failed = 0;
  for (const row of data.osoby || []) {
    const pick = d.P.wybierz(d.P.kontekst(row, data.dzien));
    if (!pick) { skipped++; continue; }
    const log = await d.rpc("nauka_przypomnienia_log_dodaj", { p_user: row.user_id, p_dzien: data.dzien, p_rodzaj: pick.kind });
    const id = log.data as string | null;
    if (log.error || !id) continue; // już dziś wysłane (unikalny klucz user + dzień)
    const off = fnUrl + "?t=" + encodeURIComponent(row.token);
    const m = d.P.mail({ lang: row.jezyk, pick, site, id, unsubscribeUrl: off });
    const r = await d.fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({
        from, to: [row.email], subject: m.subject, text: m.text, html: m.html,
        headers: { "List-Unsubscribe": "<" + off + ">", "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      }),
    }).catch(() => null);
    if (r && r.ok) sent++;
    else { failed++; await d.rpc("nauka_przypomnienia_log_usun", { p_id: id }); }
  }
  return { ok: true, dzien: data.dzien, sent, skipped, failed };
}

export async function obsluz(req: Request, d: Zaleznosci): Promise<Response> {
  const url = new URL(req.url);
  // Adres funkcji widziany z zewnątrz (link wypisania w mailu); za proxy Supabase req.url bywa wewnętrzny.
  const fnUrl = d.env("PRZYPOMNIENIA_URL") || (d.env("SUPABASE_URL") || url.origin) + "/functions/v1/przypomnienia";
  const h = cors(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: h });
  const t = url.searchParams.get("t") || "";
  if (req.method === "GET") {
    // Bez zmian: przekierowanie na stronę z przyciskiem.
    return new Response(null, { status: 303, headers: { Location: (d.env("SITE_URL") || SITE) + "/przypomnienia.html" + (TOKEN.test(t) ? "#t=" + t : "") } });
  }
  if (req.method !== "POST") return json(405, { ok: false, code: "method" }, h);
  if (t) { // List-Unsubscribe-Post: ciało „List-Unsubscribe=One-Click”, odpowiedź 200 bez treści do pokazania
    const r = await wypisz(d, t);
    return json(r.ok ? 200 : r.code === "not_enabled" ? 503 : 400, r, h);
  }
  const cron = req.headers.get("x-cron-secret") || "";
  if (cron) {
    if (!rowne(cron, d.env("PRZYPOMNIENIA_CRON") || "")) return json(401, { ok: false, code: "secret" });
    const r = await wyslij(d, fnUrl);
    return json(r.ok ? 200 : 503, r);
  }
  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch { /* puste */ }
  if (b.akcja === "wypisz") {
    const r = await wypisz(d, typeof b.token === "string" ? b.token : "");
    const msg = r.ok ? "Przypomnienia wyłączone." : r.code === "not_enabled" ? "Wyłączanie chwilowo nie działa. Spróbuj później albo wyłącz w Ustawieniach." : "Ten link już nie działa. Przypomnienia wyłączysz w Ustawieniach → Przypomnienia.";
    return json(r.ok ? 200 : r.code === "not_enabled" ? 503 : 400, { ...r, message: msg }, h);
  }
  return json(400, { ok: false, code: "bad_request" }, h);
}
