// Funkcja „stripe-webhook” dla Skrót BM: Stripe wywołuje ją po opłaceniu dostępu.
// Sprawdza podpis Stripe i wpisuje dostęp do tabeli nauka_dostep:
//   • plan roczny (jednorazowo 199 zł): checkout.session.completed w trybie „payment” → +365 dni,
//   • plan miesięczny (35 zł/mies., subskrypcja): checkout.session.completed w trybie „subscription” → dostęp na start,
//     a każda opłacona faktura (invoice.paid) przedłuża go do końca opłaconego okresu (+1 dzień zapasu).
//     Po anulowaniu w portalu klienta nowe faktury nie przychodzą, więc dostęp sam wygasa po opłaconym miesiącu.
// Wymaga sekretu STRIPE_WEBHOOK_SECRET (Supabase → Edge Functions → Secrets).
// Przy wdrażaniu wyłącz „Verify JWT” — Stripe nie wysyła tokenu Supabase.
// Zdarzenia w Stripe: checkout.session.completed, checkout.session.async_payment_succeeded, invoice.paid.
import Stripe from "npm:stripe@16.12.0";
import { createClient } from "jsr:@supabase/supabase-js@2";

const DAYS = Number(Deno.env.get("ACCESS_DAYS") || 365);
const MONTH_START_DAYS = 32; // zapas na start subskrypcji, zanim dojdzie pierwsza faktura
const stripe = new Stripe("sk_unused_only_for_signature_check", { httpClient: Stripe.createFetchHttpClient() });
const crypto = Stripe.createSubtleCryptoProvider();

// Klucz serwerowy: nowy format (SUPABASE_SECRET_KEYS) albo stary (SUPABASE_SERVICE_ROLE_KEY)
function serverKey(): string {
  try { const k = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}"); if (k.default) return k.default; } catch { /* stary format */ }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const day = (d: Date) => d.toISOString().slice(0, 10);
const todayUTC = () => { const t = new Date(); t.setUTCHours(0, 0, 0, 0); return t; };
const later = (a: string | null | undefined, b: string) => (a && a > b ? a : b);

// Id subskrypcji z faktury: starsze wersje API mają invoice.subscription, nowsze invoice.parent.subscription_details.subscription.
// deno-lint-ignore no-explicit-any
function invoiceSubscription(inv: any): string | null {
  const s = inv?.parent?.subscription_details?.subscription ?? inv?.subscription ?? null;
  return typeof s === "string" ? s : s?.id ?? null;
}
// Koniec opłaconego okresu z pozycji faktury (sekundy → data).
// deno-lint-ignore no-explicit-any
function invoicePeriodEnd(inv: any): Date | null {
  const ends: number[] = (inv?.lines?.data || []).map((l: any) => l?.period?.end).filter((x: unknown) => typeof x === "number");
  if (!ends.length && typeof inv?.period_end === "number") ends.push(inv.period_end);
  return ends.length ? new Date(Math.max(...ends) * 1000) : null;
}

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

  const db = createClient(Deno.env.get("SUPABASE_URL")!, serverKey());

  // ---------- kolejny opłacony miesiąc subskrypcji ----------
  if (event.type === "invoice.paid") {
    // deno-lint-ignore no-explicit-any
    const inv = event.data.object as any;
    const sub = invoiceSubscription(inv);
    if (!sub) return json(200, { ignored: "faktura bez subskrypcji" });
    const end = invoicePeriodEnd(inv);
    if (!end) return json(200, { error: "Faktura bez okresu.", invoice: inv.id });
    end.setUTCDate(end.getUTCDate() + 1); // dzień zapasu na odnowienie
    end.setUTCHours(0, 0, 0, 0);

    // Najpierw po id subskrypcji (wpisanym przy zakupie), a gdy faktura doszła pierwsza — po e-mailu klienta.
    let { data: cur } = await db.from("nauka_dostep").select("email, do_kiedy").eq("stripe_subscription", sub).maybeSingle();
    let email = cur?.email || (inv.customer_email || "").toLowerCase();
    if (!cur && email) ({ data: cur } = await db.from("nauka_dostep").select("email, do_kiedy").eq("email", email).maybeSingle());
    if (!email) return json(200, { error: "Brak e-maila na fakturze.", invoice: inv.id });

    const doKiedy = later(cur?.do_kiedy, day(end));
    const { error } = await db.from("nauka_dostep").upsert({
      email, do_kiedy: doKiedy, zrodlo: "stripe-miesiac", stripe_subscription: sub, plan: "miesiac", kwota_gr: inv.amount_paid ?? null,
    }, { onConflict: "email" });
    if (error) return json(500, { error: error.message });
    return json(200, { ok: true, email, do_kiedy: doKiedy, subscription: sub });
  }

  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") {
    return json(200, { ignored: event.type });
  }
  const s = event.data.object as Stripe.Checkout.Session;
  if (s.payment_status !== "paid") return json(200, { pending: s.id });

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
  const today = todayUTC();

  if (s.mode === "subscription") {
    // Subskrypcja: nie dokładamy roku, tylko dostęp na pierwszy miesiąc; dalej przedłużają faktury (invoice.paid).
    const start = new Date(today); start.setUTCDate(start.getUTCDate() + MONTH_START_DAYS);
    const sub = typeof s.subscription === "string" ? s.subscription : s.subscription?.id ?? null;
    const doKiedy = later(cur?.do_kiedy, day(start));
    const { error } = await db.from("nauka_dostep").upsert({
      email, do_kiedy: doKiedy, zrodlo: "stripe-miesiac", user_id: userId, stripe_session: s.id, stripe_subscription: sub, plan: "miesiac", kwota_gr: s.amount_total ?? null,
    }, { onConflict: "email" });
    if (error) return json(500, { error: error.message });
    return json(200, { ok: true, email, do_kiedy: doKiedy, plan: "miesiac" });
  }

  const from = cur?.do_kiedy && new Date(cur.do_kiedy) > today ? new Date(cur.do_kiedy) : today;
  from.setUTCDate(from.getUTCDate() + DAYS);
  const doKiedy = day(from);

  const { error } = await db.from("nauka_dostep").upsert({
    email, do_kiedy: doKiedy, zrodlo: "stripe", user_id: userId, stripe_session: s.id, plan: "rok", kwota_gr: s.amount_total ?? null,
  }, { onConflict: "email" });
  if (error) return json(500, { error: error.message });
  return json(200, { ok: true, email, do_kiedy: doKiedy, plan: "rok" });
});
