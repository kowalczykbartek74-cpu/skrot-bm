// Funkcja „stripe-webhook” dla Skrót BM: Stripe wywołuje ją po opłaceniu dostępu.
// Sprawdza podpis Stripe i wpisuje dostęp do tabeli nauka_dostep:
//   • plan „do końca 2. semestru” (jednorazowo 199 zł): checkout.session.completed w trybie „payment” → dostęp od dnia zakupu
//     do 11 lipca (koniec letniej sesji egzaminacyjnej, ok. 8 miesięcy przy zakupie w październiku–listopadzie);
//     kupiony po 11 lipca liczy się do 11 lipca następnego roku,
//   • plan miesięczny (35 zł/mies., subskrypcja): checkout.session.completed w trybie „subscription” → dostęp na start,
//     a każda opłacona faktura (invoice.paid) przedłuża go do końca opłaconego okresu (+1 dzień zapasu).
//     Po anulowaniu w portalu klienta nowe faktury nie przychodzą, więc dostęp sam wygasa po opłaconym miesiącu.
// Wymaga sekretu STRIPE_WEBHOOK_SECRET (Supabase → Edge Functions → Secrets).
// Przy wdrażaniu wyłącz „Verify JWT” — Stripe nie wysyła tokenu Supabase.
// Zdarzenia w Stripe: checkout.session.completed, checkout.session.async_payment_succeeded, invoice.paid,
// a od kodów polecających (supabase/skrot-v17-polecenia.sql) także charge.refunded i charge.dispute.created.
// Kod polecający: strona dokleja go do client_reference_id jako „<id konta>__KOD”. Po opłaceniu planu 199 zł
// zapisujemy polecenie (nauka_polec_zapisz); zwrot całej kwoty albo spór anuluje niewypłaconą nagrodę (nauka_polec_cofnij).
// Błąd przy kodzie nigdy nie blokuje wpisania dostępu.
// Źródło wejścia (etap 11, supabase/skrot-v38-admin.sql): trzecia część client_reference_id „<id konta>__<KOD>__<źródło>”
// (KOD może być pusty). Dopisujemy je do nauka_dostep.zrodlo_wejscia tylko raz (gdy puste) i nigdy nie blokujemy dostępu:
// bez v38 w bazie (brak kolumny) zapis po prostu się nie udaje.
// Rocznik (SQL v45): czwarta część „<konto>__<KOD>__<źródło>__<rocznik>”; brak albo nieznany → BM. Logika zdarzeń jest w obsluga.ts
// (testy: tests/stripe-webhook.test.js), tu tylko podpis Stripe i klient bazy.
import Stripe from "npm:stripe@16.12.0";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { obsluz, day } from "./obsluga.ts";

// Koniec 2. semestru = koniec letniej sesji egzaminacyjnej na US (2026/27: 28.06–11.07.2027, zarządzenie Rektora nr 59/2026).
// Gdy uczelnia poda daty na kolejny rok, można je ustawić sekretem ACCESS_UNTIL, np. "2028-07-09", bez zmiany kodu.
const ACCESS_UNTIL = Deno.env.get("ACCESS_UNTIL") || "";
const SEMESTER_END_MMDD = "07-11";
function semesterEnd(today: Date): string {
  const t = day(today);
  if (/^\d{4}-\d{2}-\d{2}$/.test(ACCESS_UNTIL) && ACCESS_UNTIL >= t) return ACCESS_UNTIL;
  const y = today.getUTCFullYear();
  const end = `${y}-${SEMESTER_END_MMDD}`;
  return t <= end ? end : `${y + 1}-${SEMESTER_END_MMDD}`;
}
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
  const db = createClient(Deno.env.get("SUPABASE_URL")!, serverKey());
  // deno-lint-ignore no-explicit-any
  const r = await obsluz(event, db as any, { today: new Date(), semesterEnd });
  return json(r.status, r.body);
});
