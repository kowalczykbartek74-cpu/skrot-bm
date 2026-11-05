// Funkcja serwerowa „usun-konto” dla Skrótu (etap 4 „Systemy z Zdawalni w Skrócie”): student usuwa swoje konto sam.
// Kolejność: 1) anulujemy subskrypcje w Stripe (gdy się nie uda, nic nie usuwamy – Stripe nie może pobierać opłat za konto,
// którego już nie ma), 2) SQL v32 nauka_konto_usun_dane kasuje dane ze wszystkich tabel, 3) konto w Auth, 4) zapytanie
// kontrolne nauka_konto_slady musi wyjść puste.
// Wymaga: SQL supabase/skrot-v32-usun-konto.sql i sekretu STRIPE_SECRET_KEY (Supabase → Edge Functions → Secrets;
// najlepiej klucz ograniczony: Customers – Read, Subscriptions – Write). Klucz serwisowy Supabase jest w funkcji sam.
// Wdrożenie: supabase functions deploy usun-konto
import { createClient } from "jsr:@supabase/supabase-js@2";

const ORIGINS = ["https://skrotbm.pl", "https://www.skrotbm.pl", "https://kowalczykbartek74-cpu.github.io"];
const STRIPE = "https://api.stripe.com/v1";
// Subskrypcje, które mogą jeszcze pobrać pieniądze.
const LIVE = new Set(["active", "trialing", "past_due", "unpaid", "incomplete"]);

function cors(req: Request) {
  const o = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ORIGINS.includes(o) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o) ? o : ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-skrot-device",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
// Klucz serwerowy: nowy format (SUPABASE_SECRET_KEYS) albo stary (SUPABASE_SERVICE_ROLE_KEY)
function serverKey(): string {
  try { const k = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}"); if (k.default) return k.default; } catch { /* stary format */ }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
}
async function stripe(key: string, path: string, method = "GET") {
  const r = await fetch(STRIPE + path, { method, headers: { Authorization: "Bearer " + key } });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, j };
}

// Wszystkie żywe subskrypcje osoby: z naszej bazy (nauka_dostep.stripe_subscription) i z klientów Stripe o tym e-mailu.
async function liveSubs(key: string, ids: string[], email: string) {
  const out = new Set<string>();
  for (const id of ids) {
    const r = await stripe(key, "/subscriptions/" + encodeURIComponent(id));
    if (r.ok && LIVE.has(r.j.status)) out.add(id);
    else if (!r.ok && r.status !== 404) throw new Error("stripe_read");
  }
  const c = await stripe(key, "/customers?limit=10&email=" + encodeURIComponent(email));
  if (!c.ok) throw new Error("stripe_read");
  for (const cu of c.j.data || []) {
    const s = await stripe(key, `/subscriptions?status=all&limit=20&customer=${encodeURIComponent(cu.id)}`);
    if (!s.ok) throw new Error("stripe_read");
    for (const x of s.j.data || []) if (LIVE.has(x.status)) out.add(x.id);
  }
  return [...out];
}

Deno.serve(async (req) => {
  const h = { ...cors(req), "Content-Type": "application/json" };
  const out = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: h });
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return out(405, { code: "method", message: "Tylko POST." });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, serverKey(), { auth: { persistSession: false } });
  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: u, error: ue } = await admin.auth.getUser(jwt);
  if (ue || !u?.user) return out(401, { code: "not_signed_in", message: "Zaloguj się, żeby usunąć konto." });
  const uid = u.user.id, email = (u.user.email || "").toLowerCase();

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* pusty */ }
  // Potwierdzenie: wpisany własny adres e-mail (jak na ekranie).
  if (!email || String(body?.email || "").trim().toLowerCase() !== email) {
    return out(400, { code: "confirm", message: "Wpisz swój adres e-mail, żeby potwierdzić." });
  }
  const { data: adm } = await admin.from("nauka_admini").select("email").eq("email", email).maybeSingle();
  if (adm) return out(403, { code: "admin", message: "Konto administratora usuwa się ręcznie. Napisz do nas." });

  // 1. Stripe
  const [{ data: d1 }, { data: d2 }] = await Promise.all([
    admin.from("nauka_dostep").select("stripe_subscription").eq("email", email),
    admin.from("nauka_dostep").select("stripe_subscription").eq("user_id", uid),
  ]);
  const ids = [...new Set([...(d1 || []), ...(d2 || [])].map((d: { stripe_subscription: string | null }) => d.stripe_subscription).filter((x): x is string => !!x))];
  const skey = Deno.env.get("STRIPE_SECRET_KEY") || "";
  let anulowane = 0;
  if (skey) {
    try {
      for (const id of await liveSubs(skey, ids, email)) {
        const r = await stripe(skey, "/subscriptions/" + encodeURIComponent(id), "DELETE"); // anulowanie od razu, bez kolejnych opłat
        if (!r.ok && r.status !== 404) throw new Error("stripe_cancel");
        anulowane++;
      }
    } catch {
      return out(502, { code: "stripe", message: "Nie udało się anulować subskrypcji. Nic nie zostało usunięte. Spróbuj za chwilę albo napisz do nas." });
    }
  } else if (ids.length) {
    // Bez klucza Stripe nie usuwamy konta z subskrypcją: opłaty szłyby dalej.
    return out(503, { code: "no_stripe_key", message: "Masz subskrypcję, której nie możemy teraz anulować. Nic nie zostało usunięte. Napisz do nas." });
  }

  // 2. Dane w bazie (SQL v32)
  const { data: usuniete, error: de } = await admin.rpc("nauka_konto_usun_dane", { p_uid: uid, p_email: email });
  if (de) return out(503, { code: "not_enabled", message: "Usuwanie konta nie jest jeszcze włączone. Nic nie zostało usunięte." });

  // 3. Konto w Auth
  const { error: ae } = await admin.auth.admin.deleteUser(uid);
  if (ae) return out(500, { code: "auth", message: "Dane są usunięte, ale konta nie udało się zamknąć. Napisz do nas, dokończymy." });

  // 4. Kontrola: nic nie zostało
  const { data: slady } = await admin.rpc("nauka_konto_slady", { p_uid: uid, p_email: email });
  const zostalo = slady && typeof slady === "object" ? Object.keys(slady).length : 0;
  // Bez treści i e-maila w logach: tylko liczby.
  console.log(JSON.stringify({ usun_konto: true, anulowane, tabele: usuniete ? Object.keys(usuniete).length : 0, zostalo }));
  return out(200, { ok: true, anulowane, zostalo });
});
