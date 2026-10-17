// Funkcja „stripe-webhook” dla Skrót BM: Stripe wywołuje ją po opłaceniu dostępu.
// Sprawdza podpis Stripe i wpisuje roczny dostęp do tabeli nauka_dostep.
// Wymaga sekretu STRIPE_WEBHOOK_SECRET (Supabase → Edge Functions → Secrets).
// Przy wdrażaniu wyłącz „Verify JWT” — Stripe nie wysyła tokenu Supabase.
import Stripe from "npm:stripe@16.12.0";
import { createClient } from "jsr:@supabase/supabase-js@2";

const DAYS = Number(Deno.env.get("ACCESS_DAYS") || 365);
const stripe = new Stripe("sk_unused_only_for_signature_check", { httpClient: Stripe.createFetchHttpClient() });
const crypto = Stripe.createSubtleCryptoProvider();

// Klucz serwerowy: nowy format (SUPABASE_SECRET_KEYS) albo stary (SUPABASE_SERVICE_ROLE_KEY)
function serverKey(): string {
  try { const k = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}"); if (k.default) return k.default; } catch { /* stary format */ }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "Tylko POST." });
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!secret) return json(500, { error: "Brak STRIPE_WEBHOOK_SECRET." });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, req.headers.get("stripe-signature") || "", secret, undefined, crypto);
  } catch {
    return json(400, { error: "Zły podpis." });
  }

  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") {
    return json(200, { ignored: event.type });
  }
  const s = event.data.object as Stripe.Checkout.Session;
  if (s.payment_status !== "paid") return json(200, { pending: s.id });

  const db = createClient(Deno.env.get("SUPABASE_URL")!, serverKey());

  // Ten sam e-mail co przy logowaniu na stronie (client_reference_id = id konta), a gdy go brak — e-mail z płatności.
  let userId: string | null = null;
  let email = (s.customer_details?.email || s.customer_email || "").toLowerCase();
  const ref = s.client_reference_id || "";
  if (/^[0-9a-f-]{36}$/i.test(ref)) {
    const { data } = await db.auth.admin.getUserById(ref);
    if (data?.user) { userId = data.user.id; email = (data.user.email || email).toLowerCase(); }
  }
  if (!email) return json(200, { error: "Brak e-maila w płatności.", session: s.id });

  // Ta sama płatność drugi raz (Stripe ponawia webhooki) nie przedłuża dostępu.
  const { data: dup } = await db.from("nauka_dostep").select("email").eq("stripe_session", s.id).maybeSingle();
  if (dup) return json(200, { duplicate: s.id });

  const { data: cur } = await db.from("nauka_dostep").select("do_kiedy").eq("email", email).maybeSingle();
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const from = cur?.do_kiedy && new Date(cur.do_kiedy) > today ? new Date(cur.do_kiedy) : today;
  from.setUTCDate(from.getUTCDate() + DAYS);
  const doKiedy = from.toISOString().slice(0, 10);

  const { error } = await db.from("nauka_dostep").upsert({
    email, do_kiedy: doKiedy, zrodlo: "stripe", user_id: userId, stripe_session: s.id, kwota_gr: s.amount_total ?? null,
  }, { onConflict: "email" });
  if (error) return json(500, { error: error.message });
  return json(200, { ok: true, email, do_kiedy: doKiedy });
});
