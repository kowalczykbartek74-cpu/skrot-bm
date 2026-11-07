// JEDEN PLIK DO WKLEJENIA w Supabase → Edge Functions → stripe-webhook → index.ts (zamiast index.ts + obsluga.ts).
// Wygenerowane: node scripts/webhook-jeden-plik.mjs. Nie poprawiaj ręcznie – zmieniaj index.ts i obsluga.ts.
import Stripe from "npm:stripe@16.12.0";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ===== obsluga.ts =====
// Rdzeń funkcji „stripe-webhook” bez Deno i bez Stripe SDK, żeby dało się go sprawdzić w Node (tests/stripe-webhook.test.js)
// z atrapą bazy i zdarzeń Stripe. index.ts sprawdza podpis i woła obsluz(event, db, ...).
//
// Rocznik (fundament „inne kierunki”, Etap 4, SQL v45): czwarta część client_reference_id „<konto>__<KOD>__<źródło>__<rocznik>”.
// Brak albo nieznany rocznik → BM (stare linki, subskrypcje sprzed zmiany). Dostęp to wiersz nauka_dostep (email, rocznik_id):
// jeden zakup = dostęp do jednego rocznika. Odnowienie subskrypcji (invoice.paid) trafia w wiersz z tą subskrypcją (czyli
// z jej rocznikiem); faktura przed zakupem (brak wiersza z subskrypcją) – wiersz osoby, gdy jest jeden, inaczej BM.
// Bez v45 w bazie (brak klucza (email, rocznik_id)) zapis wraca do starego klucza „email”, więc nic się nie blokuje.

export const BM = "wefiz-bm-1-st-2026";
const RE_ROCZNIK = /^[a-z]+-[a-z0-9]+-[012]-(st|nst)-20[0-9]{2}$/;
export const MONTH_START_DAYS = 32; // zapas na start subskrypcji, zanim dojdzie pierwsza faktura

export type Wynik = { status: number; body: Record<string, unknown> };
// deno-lint-ignore no-explicit-any
type Any = any;
export interface Baza { from(t: string): Any; rpc(fn: string, args?: Record<string, unknown>): Promise<{ data: Any; error: Any }>; auth: { admin: { getUserById(id: string): Promise<{ data: Any }> } } }
export interface Opcje { today: Date; semesterEnd: (d: Date) => string }

export const day = (d: Date) => d.toISOString().slice(0, 10);
const later = (a: string | null | undefined, b: string) => (a && a > b ? a : b);

// „<konto>__<KOD>__<źródło>__<rocznik>” → części (puste = brak). Źródło i rocznik tylko w bezpiecznym formacie.
export function czytajRef(ref: string | null | undefined) {
  const [konto = "", kod = "", zr = "", rk = ""] = String(ref || "").split("__");
  return { konto, kod, zrodlo: /^[a-z0-9.-]{1,40}$/.test(zr) ? zr : null, rocznik: RE_ROCZNIK.test(rk) ? rk : null };
}

// Id subskrypcji z faktury: starsze wersje API mają invoice.subscription, nowsze invoice.parent.subscription_details.subscription.
export function invoiceSubscription(inv: Any): string | null {
  const s = inv?.parent?.subscription_details?.subscription ?? inv?.subscription ?? null;
  return typeof s === "string" ? s : s?.id ?? null;
}
// Koniec opłaconego okresu z pozycji faktury (sekundy → data).
export function invoicePeriodEnd(inv: Any): Date | null {
  const ends: number[] = (inv?.lines?.data || []).map((l: Any) => l?.period?.end).filter((x: unknown) => typeof x === "number");
  if (!ends.length && typeof inv?.period_end === "number") ends.push(inv.period_end);
  return ends.length ? new Date(Math.max(...ends) * 1000) : null;
}

// Brak klucza (email, rocznik_id) = baza bez v45.
const bezV45 = (e: Any) => !!e && (e.code === "42P10" || /no unique or exclusion constraint/i.test(String(e.message || "")));
async function upsertDostep(db: Baza, row: Record<string, unknown>) {
  let { error } = await db.from("nauka_dostep").upsert(row, { onConflict: "email,rocznik_id" });
  if (bezV45(error)) {
    const { rocznik_id: _r, ...stary } = row;
    ({ error } = await db.from("nauka_dostep").upsert(stary, { onConflict: "email" }));
  }
  return error;
}
// Rocznik z linku: istniejący w nauka_roczniki, inaczej BM. Rocznik bez statusu „platny” zostaje (osoba zapłaciła), ale z uwagą.
async function rocznikZakupu(db: Baza, rk: string | null): Promise<{ id: string; uwaga: string | null }> {
  if (!rk || rk === BM) return { id: BM, uwaga: null };
  const { data, error } = await db.from("nauka_roczniki").select("id, status").eq("id", rk).maybeSingle();
  if (error || !data) return { id: BM, uwaga: "nieznany_rocznik" };
  return { id: rk, uwaga: data.status === "platny" ? null : "rocznik_nie_platny" };
}

export async function obsluz(event: Any, db: Baza, o: Opcje): Promise<Wynik> {
  const ok = (body: Record<string, unknown>) => ({ status: 200, body });
  const blad = (msg: string) => ({ status: 500, body: { error: msg } });

  // ---------- zwrot albo spór: nagroda za polecenie przepada (jeśli jeszcze niewypłacona) ----------
  if (event.type === "charge.refunded" || event.type === "charge.dispute.created") {
    const c = event.data.object;
    if (event.type === "charge.refunded" && !c.refunded) return ok({ ignored: "częściowy zwrot" });
    const pi = typeof c.payment_intent === "string" ? c.payment_intent : c.payment_intent?.id ?? null;
    if (!pi) return ok({ ignored: "brak payment_intent" });
    const { data, error } = await db.rpc("nauka_polec_cofnij", { p_payment: pi, p_powod: event.type === "charge.refunded" ? "Zwrot w Stripe" : "Spór (chargeback) w Stripe" });
    if (error) return blad(error.message);
    return ok({ ok: true, polecenie: data });
  }

  // ---------- kolejny opłacony miesiąc subskrypcji ----------
  if (event.type === "invoice.paid") {
    const inv = event.data.object;
    const sub = invoiceSubscription(inv);
    if (!sub) return ok({ ignored: "faktura bez subskrypcji" });
    const end = invoicePeriodEnd(inv);
    if (!end) return ok({ error: "Faktura bez okresu.", invoice: inv.id });
    end.setUTCDate(end.getUTCDate() + 1); // dzień zapasu na odnowienie
    end.setUTCHours(0, 0, 0, 0);
    // Najpierw po id subskrypcji (wpisanym przy zakupie, z rocznikiem), a gdy faktura doszła pierwsza — po e-mailu klienta.
    let { data: cur } = await db.from("nauka_dostep").select("email, do_kiedy, rocznik_id").eq("stripe_subscription", sub).maybeSingle();
    const email = cur?.email || String(inv.customer_email || "").toLowerCase();
    if (!email) return ok({ error: "Brak e-maila na fakturze.", invoice: inv.id });
    if (!cur) {
      const { data: rows } = await db.from("nauka_dostep").select("email, do_kiedy, rocznik_id").eq("email", email);
      const lista = Array.isArray(rows) ? rows : rows ? [rows] : [];
      cur = lista.length === 1 ? lista[0] : lista.find((r: Any) => (r.rocznik_id || BM) === BM) || null;
    }
    const rocznik = cur?.rocznik_id || BM;
    const doKiedy = later(cur?.do_kiedy, day(end));
    const error = await upsertDostep(db, { email, rocznik_id: rocznik, do_kiedy: doKiedy, zrodlo: "stripe-miesiac", stripe_subscription: sub, plan: "miesiac", kwota_gr: inv.amount_paid ?? null });
    if (error) return blad(error.message);
    return ok({ ok: true, email, do_kiedy: doKiedy, subscription: sub, rocznik });
  }

  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") return ok({ ignored: event.type });
  const s = event.data.object;
  if (s.payment_status !== "paid") return ok({ pending: s.id });

  // Ten sam e-mail co przy logowaniu na stronie (client_reference_id = id konta), a gdy go brak — e-mail z płatności.
  let userId: string | null = null;
  let email = String(s.customer_details?.email || s.customer_email || "").toLowerCase();
  const ref = czytajRef(s.client_reference_id);
  if (/^[0-9a-f-]{36}$/i.test(ref.konto)) {
    const { data } = await db.auth.admin.getUserById(ref.konto);
    if (data?.user) { userId = data.user.id; email = String(data.user.email || email).toLowerCase(); }
  }
  if (!email) return ok({ error: "Brak e-maila w płatności.", session: s.id });
  const rk = await rocznikZakupu(db, ref.rocznik);
  const dopiszZrodlo = async () => {
    if (!ref.zrodlo) return;
    try { await db.from("nauka_dostep").update({ zrodlo_wejscia: ref.zrodlo }).eq("email", email).eq("rocznik_id", rk.id).is("zrodlo_wejscia", null); } catch { /* bez v38 */ }
  };

  // Kod polecający (tylko plan jednorazowy): zapis nagrody dla właściciela kodu. Baza sprawdza kod, kwotę, samopolecenie
  // i jest idempotentna po id sesji. Kody działają między rocznikami. Kwota zawsze w PLN (Adaptive Pricing → waluta źródłowa).
  const polec = async () => {
    if (s.mode !== "payment" || !/^[A-Z0-9]{4,16}$/i.test(ref.kod)) return null;
    const cc = s.currency_conversion;
    const pln = cc?.source_currency === "pln" ? cc.amount_total : s.currency === "pln" ? s.amount_total : 0;
    const pi = typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id ?? null;
    const { data, error: pe } = await db.rpc("nauka_polec_zapisz", { p_kod: ref.kod, p_sesja: s.id, p_email: email, p_uid: userId, p_kwota_gr: pln ?? 0, p_payment: pi });
    // Brak funkcji (v17 jeszcze nie w bazie) nie blokuje; prawdziwy błąd bazy = 500, żeby Stripe ponowił.
    if (pe && !/function|does not exist|schema cache|Could not find/i.test(pe.message || "")) throw new Error(pe.message);
    return pe ? { error: pe.message } : data;
  };

  // Ta sama płatność drugi raz (Stripe ponawia webhooki) nie przedłuża dostępu.
  const { data: dup } = await db.from("nauka_dostep").select("email").eq("stripe_session", s.id).maybeSingle();
  if (dup) {
    try { return ok({ duplicate: s.id, polecenie: await polec() }); } catch (e) { return blad(String((e as Error).message)); }
  }

  const { data: cur } = await db.from("nauka_dostep").select("do_kiedy").eq("email", email).eq("rocznik_id", rk.id).maybeSingle();
  const today = new Date(o.today); today.setUTCHours(0, 0, 0, 0);
  const extra = rk.uwaga ? { uwaga: rk.uwaga } : {};

  if (s.mode === "subscription") {
    // Subskrypcja: nie dokładamy roku, tylko dostęp na pierwszy miesiąc; dalej przedłużają faktury (invoice.paid).
    const start = new Date(today); start.setUTCDate(start.getUTCDate() + MONTH_START_DAYS);
    const sub = typeof s.subscription === "string" ? s.subscription : s.subscription?.id ?? null;
    const doKiedy = later(cur?.do_kiedy, day(start));
    const error = await upsertDostep(db, { email, rocznik_id: rk.id, do_kiedy: doKiedy, zrodlo: "stripe-miesiac", user_id: userId, stripe_session: s.id, stripe_subscription: sub, plan: "miesiac", kwota_gr: s.amount_total ?? null });
    if (error) return blad(error.message);
    await dopiszZrodlo();
    return ok({ ok: true, email, do_kiedy: doKiedy, plan: "miesiac", rocznik: rk.id, ...extra });
  }

  // Nigdy nie skracamy już opłaconego dostępu.
  const doKiedy = later(cur?.do_kiedy, o.semesterEnd(today));
  const error = await upsertDostep(db, { email, rocznik_id: rk.id, do_kiedy: doKiedy, zrodlo: "stripe", user_id: userId, stripe_session: s.id, plan: "rok", kwota_gr: s.amount_total ?? null });
  if (error) return blad(error.message);
  await dopiszZrodlo();
  let polecenie: unknown = null;
  try { polecenie = await polec(); } catch (e) { return blad(String((e as Error).message)); }
  return ok({ ok: true, email, do_kiedy: doKiedy, plan: "rok", polecenie, rocznik: rk.id, ...extra });
}

// ===== index.ts =====
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
