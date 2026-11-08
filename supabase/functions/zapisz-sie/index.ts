// Funkcja serwerowa „zapisz-sie” dla Skrótu (etap 5 „Systemy z Zdawalni w Skrócie”): lista oczekujących bez logowania.
// POST { akcja: "zapisz", email, kierunek_id | kierunek_tekst, wydzial?, stopien?, rok?, tryb?, zrodlo?, zgoda: true }
//   → SQL v34 nauka_oczekujacy_zapisz (limit 5 z jednej sieci na godzinę, po skrócie IP) → mail z linkami „Potwierdź”
//     i „Usuń mój zapis” (Resend). Odpowiedź jest ta sama dla nowego, czekającego i potwierdzonego adresu.
// POST { akcja: "potwierdz" | "usun", token } → nauka_oczekujacy_potwierdz / _wypisz.
// Linki w mailu prowadzą na stronę (zdawalni.pl/#/zapis/potwierdz.<token>), która dopiero po kliknięciu przycisku woła
// tę funkcję, więc skaner poczty, który otwiera linki, niczego nie potwierdzi.
// Sekrety (Supabase → Edge Functions → Secrets): RESEND_API_KEY, RESEND_FROM (np. „Zdawalni <zapisy@skrotbm.pl>”,
// domena zweryfikowana w Resend), opcjonalnie ZAPISY_SALT (sól skrótu IP). Wdrożenie: supabase functions deploy zapisz-sie --no-verify-jwt
import { createClient } from "jsr:@supabase/supabase-js@2";

const SITE = "https://zdawalni.pl";
const ORIGINS = ["https://zdawalni.pl", "https://www.zdawalni.pl", "https://skrotbm.pl", "https://www.skrotbm.pl", "https://plan.zdawalni.pl", "https://plan.skrotbm.pl", "https://kowalczykbartek74-cpu.github.io"];
const ZGODA_WERSJA = "2026-11-05";
const OK_MSG = "Sprawdź skrzynkę: wysłaliśmy link do potwierdzenia zapisu. Jeśli maila nie ma, zajrzyj do spamu.";

function cors(req: Request) {
  const o = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ORIGINS.includes(o) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o) ? o : ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
function serverKey(): string {
  try { const k = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}"); if (k.default) return k.default; } catch { /* stary format */ }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
}
async function sha256(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
function newToken() {
  const b = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const int = (v: unknown, lo: number, hi: number) => { const n = Number(v); return Number.isInteger(n) && n >= lo && n <= hi ? n : null; };

// Czysta walidacja (te same zasady co zapisy.js na stronie).
function sprawdz(b: Record<string, unknown>) {
  const email = str(b.email, 300).toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email) || email.length > 254) return { error: "Wpisz poprawny adres e-mail." };
  const kid = str(b.kierunek_id, 40), ktxt = str(b.kierunek_tekst, 120);
  if (kid && !/^[a-z]+-[a-z0-9]+-[012]-(st|nst)$/.test(kid)) return { error: "Wybierz kierunek z listy albo wpisz jego nazwę." };
  if (!kid && ktxt.length < 2) return { error: "Wybierz kierunek z listy albo wpisz jego nazwę." };
  if (b.zgoda !== true) return { error: "Zaznacz zgodę na jeden mail w dniu startu kierunku." };
  const zrodlo = /^[a-z0-9._-]{1,40}$/.test(str(b.zrodlo, 40)) ? str(b.zrodlo, 40) : null;
  const tryb = b.tryb === "st" || b.tryb === "nst" ? b.tryb : null;
  return { dane: { email, kierunek_id: kid || null, kierunek_tekst: kid ? null : ktxt, wydzial: str(b.wydzial, 20) || null,
    stopien: int(b.stopien, 0, 2), rok: int(b.rok, 1, 6), tryb, zrodlo, zgoda_wersja: ZGODA_WERSJA } };
}

function mail(token: string) {
  const ok = `${SITE}/#/zapis/potwierdz.${token}`, out = `${SITE}/#/zapis/usun.${token}`;
  const subject = "Potwierdź zapis: Zdawalni dla Twojego kierunku";
  const text = `Cześć!\n\nPotwierdź, że chcesz dostać jeden mail, gdy Zdawalni ruszy dla Twojego kierunku:\n${ok}\n\nTo nie Ty? Usuń zapis:\n${out}\n\n---\nConfirm that you want one email when Zdawalni starts for your programme:\n${ok}\nNot you? Remove the sign-up:\n${out}\n\nZdawalni · zdawalni.pl`;
  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:16px;line-height:1.5;color:#1d2b24;max-width:520px">
<p>Cześć!</p><p>Potwierdź, że chcesz dostać <b>jeden mail</b>, gdy Zdawalni ruszy dla Twojego kierunku.</p>
<p><a href="${ok}" style="display:inline-block;background:#1b7f4a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">Potwierdź zapis</a></p>
<p style="font-size:14px;color:#4a5a51">To nie Ty? <a href="${out}" style="color:#1b7f4a">Usuń mój zapis</a>.</p>
<hr style="border:0;border-top:1px solid #dde5df;margin:20px 0">
<p style="font-size:14px;color:#4a5a51">Confirm that you want one email when Zdawalni starts for your programme: <a href="${ok}" style="color:#1b7f4a">confirm</a> · <a href="${out}" style="color:#1b7f4a">remove the sign-up</a>.</p>
<p style="font-size:13px;color:#6b7a72">Zdawalni · zdawalni.pl</p></div>`;
  return { subject, text, html };
}

Deno.serve(async (req) => {
  const h = { ...cors(req), "Content-Type": "application/json" };
  const out = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: h });
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return out(405, { code: "method", message: "Tylko POST." });
  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch { /* pusty */ }
  const db = createClient(Deno.env.get("SUPABASE_URL")!, serverKey(), { auth: { persistSession: false } });

  if (b.akcja === "potwierdz" || b.akcja === "usun") {
    const t = str(b.token, 80);
    if (!/^[A-Za-z0-9_-]{20,80}$/.test(t)) return out(400, { ok: false, code: "token", message: "Ten link jest niepełny. Skopiuj go z maila w całości." });
    const { data, error } = await db.rpc(b.akcja === "potwierdz" ? "nauka_oczekujacy_potwierdz" : "nauka_oczekujacy_wypisz", { p_token_hash: await sha256(t) });
    if (error) return out(503, { ok: false, code: "not_enabled", message: "Zapisy chwilowo nie działają. Spróbuj później." });
    if (!data?.ok) return out(404, { ok: false, code: "unknown", message: b.akcja === "potwierdz" ? "Ten link już nie działa. Zapisz się jeszcze raz." : "Tego zapisu już nie ma." });
    return out(200, { ok: true, first: !!data.first });
  }

  // Pułapka na boty: ukryte pole „www” wypełnia tylko skrypt. Odpowiadamy jak zwykle, niczego nie zapisując.
  if (str(b.www, 200)) return out(200, { ok: true, message: OK_MSG });
  const v = sprawdz(b);
  if ("error" in v) return out(400, { ok: false, code: "invalid", message: v.error });
  const key = Deno.env.get("RESEND_API_KEY"), from = Deno.env.get("RESEND_FROM");
  if (!key || !from) return out(503, { ok: false, code: "no_mail", message: "Zapisy chwilowo nie działają. Spróbuj później albo napisz na zdawalni.support@gmail.com." });

  const ip = (req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
  const ipHash = ip ? await sha256((Deno.env.get("ZAPISY_SALT") || serverKey().slice(-24)) + ":" + ip) : null;
  const token = newToken();
  const { data, error } = await db.rpc("nauka_oczekujacy_zapisz", { p: v.dane, p_token_hash: await sha256(token), p_ip_hash: ipHash });
  if (error) return out(503, { ok: false, code: "not_enabled", message: "Zapisy chwilowo nie działają. Spróbuj później." });
  if (data?.kind === "rate_limited") return out(429, { ok: false, code: "limit", message: "Za dużo zapisów z tej sieci. Spróbuj za godzinę." });
  if (data?.kind === "invalid") return out(400, { ok: false, code: "invalid", message: "Sprawdź adres e-mail i kierunek." });
  if (data?.kind === "send") {
    const m = mail(token);
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [v.dane.email], subject: m.subject, text: m.text, html: m.html }),
    }).catch(() => null);
    if (!r || !r.ok) return out(502, { ok: false, code: "mail", message: "Nie udało się wysłać maila. Spróbuj za chwilę." });
    await db.rpc("nauka_oczekujacy_wyslano", { p_email: v.dane.email });
  }
  return out(200, { ok: true, message: OK_MSG });
});
