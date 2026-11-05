// Funkcja serwerowa „przypomnienia” dla Skrótu (etap 7a „Systemy z Zdawalni w Skrócie”): najwyżej jeden mail dziennie,
// o godzinie wybranej w Ustawieniach → Przypomnienia, i wypisanie jednym kliknięciem. Cała obsługa jest w obsluga.ts,
// a wybór treści w logika.js (kopia przypomnienia.js ze strony; test pilnuje, że są identyczne).
// Wymaga: SQL supabase/skrot-v36-przypomnienia.sql (pg_cron co 15 min woła tę funkcję przez pg_net, sekret z Vault).
// Sekrety (Supabase → Edge Functions → Secrets): RESEND_API_KEY, RESEND_FROM (z etapu 5), PRZYPOMNIENIA_CRON (ten sam
// losowy ciąg co w Vault „przypomnienia_cron”). Opcjonalnie SITE_URL (domyślnie https://skrotbm.pl).
// Wdrożenie: supabase functions deploy przypomnienia --no-verify-jwt   (pg_cron i program pocztowy wołają bez logowania)
import { createClient } from "jsr:@supabase/supabase-js@2";
import "./logika.js";
import { obsluz, type Logika } from "./obsluga.ts";

function serverKey(): string {
  try { const k = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}"); if (k.default) return k.default; } catch { /* stary format */ }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
}
const P = (globalThis as unknown as { SKROT_PRZYP: Logika }).SKROT_PRZYP;

Deno.serve((req) => {
  const db = createClient(Deno.env.get("SUPABASE_URL")!, serverKey(), { auth: { persistSession: false } });
  return obsluz(req, { rpc: (fn, args) => db.rpc(fn, args || {}) as unknown as Promise<{ data: any; error: unknown }>, fetch, env: (k) => Deno.env.get(k), P });
});
