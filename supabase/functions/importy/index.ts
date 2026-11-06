// Funkcja serwerowa „importy” dla Skrótu (etap 14 „Systemy z Zdawalni w Skrócie”): kolejka „PDF → szkic AI → zatwierdzenie →
// import” w Narzędziach starosty → Importy (tylko administrator). Cała obsługa jest w obsluga.ts, logika (części PDF-u,
// polecenie dla modelu, schemat, sprawdzenie wyniku) w logika.js = kopia importy.js ze strony (test pilnuje, że są identyczne).
// Wymaga: SQL supabase/skrot-v40-importy.sql (tabela, funkcje i prywatny bucket „importy”) i sekretu ANTHROPIC_API_KEY (już jest).
// Opcjonalnie (Supabase → Edge Functions → Secrets): IMPORT_MODEL (domyślnie claude-sonnet-5-5), IMPORT_EFFORT (domyślnie z profilu,
// „low”), PROFILE_BASE (skąd brać profile wydziałów, domyślnie https://zdawalni.pl/importy/).
// Wdrożenie: supabase functions deploy importy
import { createClient } from "jsr:@supabase/supabase-js@2";
import { PDFDocument } from "npm:pdf-lib@1.17.1";
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
const I = (globalThis as unknown as { SKROT_IMPORTY: Logika }).SKROT_IMPORTY;
const BUCKET = "importy";

Deno.serve((req) => {
  const url = Deno.env.get("SUPABASE_URL")!;
  const sb = createClient(url, publicKey(), {
    auth: { persistSession: false },
    global: { headers: { Authorization: req.headers.get("Authorization") || "", "x-skrot-device": req.headers.get("x-skrot-device") || "" } },
  });
  // Klucz serwisowy tylko do Storage (bucket jest prywatny, bez polityk dla anon/authenticated); baza zawsze jako zalogowana osoba.
  const st = createClient(url, serverKey(), { auth: { persistSession: false } }).storage.from(BUCKET);
  const base = (Deno.env.get("PROFILE_BASE") || "https://zdawalni.pl/importy/").replace(/\/?$/, "/");
  return obsluz(req, {
    rpc: (fn, args) => sb.rpc(fn, args || {}) as unknown as Promise<{ data: any; error: unknown }>,
    storage: {
      upload: async (path, bytes) => ({ error: (await st.upload(path, bytes, { contentType: "application/pdf", upsert: true })).error }),
      download: async (path) => {
        const r = await st.download(path);
        return { data: r.data ? new Uint8Array(await r.data.arrayBuffer()) : null, error: r.error };
      },
      remove: async (paths) => ({ error: (await st.remove(paths)).error }),
      signedUrl: async (path, s) => { const r = await st.createSignedUrl(path, s); return { url: r.data?.signedUrl || null, error: r.error }; },
    },
    pdf: {
      strony: async (b) => (await PDFDocument.load(b, { updateMetadata: false })).getPageCount(),
      wytnij: async (b, od, doStr) => {
        const src = await PDFDocument.load(b, { updateMetadata: false });
        const outDoc = await PDFDocument.create();
        const idx = Array.from({ length: doStr - od + 1 }, (_, i) => od - 1 + i);
        (await outDoc.copyPages(src, idx)).forEach((p) => outDoc.addPage(p));
        return await outDoc.save();
      },
    },
    profil: async (w) => { const r = await fetch(base + encodeURIComponent(w) + ".json", { cache: "no-store" }); return r.ok ? await r.json() : null; },
    fetch,
    env: (k) => Deno.env.get(k),
    I,
  });
});
