// Funkcja serwerowa „sprawdz-zdjecie” dla Skrótu (etap 13 „Systemy z Zdawalni w Skrócie”): „Sprawdź moje rozwiązanie ze zdjęcia”
// przy zadaniach krok po kroku, kartach „Policz” w lekcjach i zadaniach w teście próbnym. Ocena TYLKO według klucza zadania,
// bez pisania pełnego rozwiązania. Zdjęcia nie zapisujemy (decyzja D8); limit 5 dziennie liczy baza (decyzja D9, SQL v39).
// Cała obsługa jest w obsluga.ts, walidacja i polecenie dla modelu w logika.js (kopia zdjecie.js ze strony; test pilnuje,
// że są identyczne).
// Wymaga: SQL supabase/skrot-v39-zdjecie.sql i sekretu ANTHROPIC_API_KEY (już jest, z oceny AI testu).
// Opcjonalnie (Supabase → Edge Functions → Secrets): PHOTO_MODEL (domyślnie GRADE_MODEL albo claude-sonnet-5-5),
// PHOTO_EFFORT (domyślnie medium), PHOTO_DAILY_LIMIT (domyślnie 5).
// Wdrożenie: supabase functions deploy sprawdz-zdjecie
import { createClient } from "jsr:@supabase/supabase-js@2";
import "./logika.js";
import { obsluz, type Logika } from "./obsluga.ts";

function serverKey(): string {
  try { const k = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}"); if (k.default) return k.default; } catch { /* stary format */ }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
}
function publicKey(): string {
  let pub = Deno.env.get("SUPABASE_ANON_KEY") || "";
  try { const k = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}"); if (k.default) pub = k.default; } catch { /* stary format */ }
  return pub;
}
const Z = (globalThis as unknown as { SKROT_ZDJECIE: Logika }).SKROT_ZDJECIE;

Deno.serve((req) => {
  const url = Deno.env.get("SUPABASE_URL")!;
  const sb = createClient(url, publicKey(), {
    auth: { persistSession: false },
    global: { headers: { Authorization: req.headers.get("Authorization") || "", "x-skrot-device": req.headers.get("x-skrot-device") || "" } },
  });
  const srv = createClient(url, serverKey(), { auth: { persistSession: false } });
  return obsluz(req, {
    rpc: (fn, args) => sb.rpc(fn, args || {}) as unknown as Promise<{ data: any; error: unknown }>,
    rpcSerwer: (fn, args) => srv.rpc(fn, args || {}) as unknown as Promise<{ data: any; error: unknown }>,
    fetch,
    env: (k) => Deno.env.get(k),
    Z,
  });
});
