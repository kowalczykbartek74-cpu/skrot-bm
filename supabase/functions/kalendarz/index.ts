// Funkcja „kalendarz” dla Skrót BM: osobisty plik kalendarza (.ics) pod tajnym linkiem.
//   GET /functions/v1/kalendarz?t=TOKEN
// Zawiera zajęcia grupy wybranej w aplikacji (plan z plan.skrotbm.pl) oraz zaliczenia i zadania z bazy.
// Google, Apple i Outlook subskrybują ten link i same pobierają nowszą wersję.
// Wdrażanie: npx supabase functions deploy kalendarz --no-verify-jwt
// (kalendarze w telefonach nie wysyłają tokenu Supabase; chroni tajny token w linku).
import { createClient } from "jsr:@supabase/supabase-js@2";

const PLAN_URL = "https://plan.skrotbm.pl/plan.json";
const APP = "https://skrotbm.pl";
const SLOTS = [["8:15","9:45"],["10:00","11:30"],["12:00","13:30"],["13:45","15:15"],["15:30","17:00"],["17:15","18:45"],["19:00","20:30"]];
const KIND: Record<string, string> = { W: "wykład", CW: "ćwiczenia", LAB: "laboratorium", K: "konwersatorium", S: "seminarium" };
const SHORT: Record<string, string> = { W: "W", CW: "ĆW", LAB: "LAB", K: "K", S: "S" };
const DL_TYPE: Record<string, string> = { kolokwium: "Kolokwium", egzamin: "Egzamin", projekt: "Projekt", prezentacja: "Prezentacja", zadanie: "Zadanie", formalnosci: "Formalności", wydarzenie: "Wydarzenie", inne: "Termin" };

function serverKey(): string {
  try { const k = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}"); if (k.default) return k.default; } catch { /* stary format */ }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
}

// ---------- daty ----------
const pad = (n: number) => String(n).padStart(2, "0");
const key = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const parse = (k: string) => { const [y, m, d] = k.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)); };
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 864e5);
const ymd = (k: string) => k.replace(/-/g, "");
const hm = (t: string) => t.split(":").map((x) => pad(Number(x))).join("") + "00";
const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// ---------- format iCalendar ----------
const esc = (s: unknown) => String(s ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const enc = new TextEncoder();
function fold(line: string) {
  const out: string[] = []; let cur = "", len = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    if (len + b > (out.length ? 74 : 75)) { out.push(cur); cur = ""; len = 0; }
    cur += ch; len += b;
  }
  out.push(cur);
  return out.join("\r\n ");
}
function hash(s: string) { let h = 5381; for (const c of s) h = ((h * 33) ^ c.codePointAt(0)!) >>> 0; return h.toString(36); }
const VTIMEZONE = [
  "BEGIN:VTIMEZONE", "TZID:Europe/Warsaw",
  "BEGIN:DAYLIGHT", "TZOFFSETFROM:+0100", "TZOFFSETTO:+0200", "TZNAME:CEST", "DTSTART:19700329T020000", "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU", "END:DAYLIGHT",
  "BEGIN:STANDARD", "TZOFFSETFROM:+0200", "TZOFFSETTO:+0100", "TZNAME:CET", "DTSTART:19701025T030000", "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU", "END:STANDARD",
  "END:VTIMEZONE",
];

type Entry = { d: number; s: number; pl?: string; en?: string; k: string; p?: string; r?: string; g?: string; dates?: string[]; n?: string; time?: [string, string] };
// deno-lint-ignore no-explicit-any
type Plan = { groups: Record<string, Record<string, Entry[]>>; kalendarz?: any };
// deno-lint-ignore no-explicit-any
type Deadline = Record<string, any>;

function classEvents(plan: Plan, group: string, sub: string, stamp: string): string[] {
  const grp = plan.groups?.[group], kal = plan.kalendarz;
  if (!grp || !kal?.tygodnie?.length) return [];
  const PAR: Record<string, string> = {}, OFF = kal.wolne || {}, SWAP = kal.zamiany || {};
  let first = "9999", last = "";
  for (const [a, b, p] of kal.tygodnie) {
    for (let d = parse(a); key(d) <= b; d = addDays(d, 1)) if (d.getUTCDay() % 6) PAR[key(d)] = p;
    if (a < first) first = a;
    if (b > last) last = b;
  }
  for (const d of Object.keys(OFF)) delete PAR[d];
  for (const [d, v] of Object.entries(SWAP)) PAR[d] = (v as { p: string }).p;
  const L: string[] = [];
  for (let d = parse(first); key(d) <= last; d = addDays(d, 1)) {
    const k = key(d), sw = SWAP[k], p = sw?.p || PAR[k];
    if (!p) continue;
    const day = sw?.asDay ?? (d.getUTCDay() + 6) % 7;
    for (const e of (grp[p] || []).filter((e) => e.d === day && (!sub || !e.g || e.g === sub) && (!e.dates || e.dates.includes(k)))) {
      const [t0, t1] = e.time || SLOTS[e.s];
      const kind = KIND[e.k];
      const desc = [
        kind ? kind[0].toUpperCase() + kind.slice(1) + (e.g ? `, podgrupa ${e.g}` : "") : null,
        e.en && e.en !== e.pl ? e.en : null,
        e.p ? `Prowadzi: ${e.p}` : null, sw?.n || null, e.n || null,
        `Materiały: ${APP}`,
      ].filter(Boolean).join("\n");
      L.push("BEGIN:VEVENT",
        `UID:${k}-${group}-${e.s}-${e.g || "x"}-${hash((e.pl || "") + e.k)}@skrotbm.pl`,
        `DTSTAMP:${stamp}`,
        `DTSTART;TZID=Europe/Warsaw:${ymd(k)}T${hm(t0)}`,
        `DTEND;TZID=Europe/Warsaw:${ymd(k)}T${hm(t1)}`,
        `SUMMARY:${esc(`${e.pl || e.en}${SHORT[e.k] ? " · " + SHORT[e.k] : ""}${e.g && !sub ? " (laby " + e.g + ")" : ""}`)}`,
        ...(e.r ? [`LOCATION:${esc(/ul\.|Szczecin/.test(e.r) ? e.r : e.r + ", ul. Cukrowa 8, Szczecin")}`] : []),
        `DESCRIPTION:${esc(desc)}`, `CATEGORIES:${esc(kind || "zajęcia")}`, "TRANSP:OPAQUE", "END:VEVENT");
    }
  }
  const allDay = (od: string, doo: string, txt: string, id: string) => L.push("BEGIN:VEVENT", `UID:${id}@skrotbm.pl`, `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${ymd(od)}`, `DTEND;VALUE=DATE:${ymd(key(addDays(parse(doo), 1)))}`, `SUMMARY:${esc(txt)}`, "TRANSP:TRANSPARENT", "END:VEVENT");
  for (const [k, txt] of Object.entries(OFF)) allDay(k, k, `Bez zajęć: ${txt}`, `wolne-${k}`);
  for (const o of kal.okresy || []) if (!o.od.startsWith("0000") && !o.do.startsWith("9999")) allDay(o.od, o.do, o.opis, `okres-${o.od}`);
  return L;
}

function deadlineEvents(list: Deadline[], plan: Plan | null, group: string, sub: string, stamp: string): string[] {
  const names: Record<string, string> = {};
  for (const g of Object.values(plan?.groups || {})) for (const w of ["odd", "even"]) for (const e of g[w] || []) if (e.pl && e.k !== "X") names[slug(e.pl)] = e.pl;
  const mine = (d: Deadline) => (!d.groups?.length || !group || d.groups.includes(group)) && (!d.subs?.length || !sub || d.subs.includes(sub));
  const L: string[] = [];
  for (const d of list) {
    if (!d?.title || !/^\d{4}-\d{2}-\d{2}$/.test(d.date || "") || !mine(d)) continue;
    const subj = names[d.subjectId] || "";
    const type = DL_TYPE[d.type] || "Termin";
    const title = `${d.approx ? "~ " : ""}${String(d.title).toLowerCase().startsWith(type.toLowerCase()) ? "" : type + ": "}${d.title}${subj && !d.title.includes(subj) ? ` (${subj})` : ""}`;
    const desc = [
      subj ? `Przedmiot: ${subj}` : null,
      d.note || null,
      d.approx ? "Data orientacyjna z sylabusa: prowadzący jeszcze nie podał dokładnego terminu." : null,
      `Szczegóły w Skrócie BM: ${APP}`,
    ].filter(Boolean).join("\n");
    const timed = /^\d{1,2}:\d{2}$/.test(d.time || "");
    let start: string, end: string, alarm: string;
    if (timed) {
      const [h, m] = d.time.split(":").map(Number), e = h * 60 + m + 60;
      start = `DTSTART;TZID=Europe/Warsaw:${ymd(d.date)}T${pad(h)}${pad(m)}00`;
      end = `DTEND;TZID=Europe/Warsaw:${ymd(d.date)}T${pad(Math.min(23, Math.floor(e / 60)))}${pad(e >= 24 * 60 ? 59 : e % 60)}00`;
      alarm = "-P1D";
    } else {
      start = `DTSTART;VALUE=DATE:${ymd(d.date)}`;
      end = `DTEND;VALUE=DATE:${ymd(key(addDays(parse(d.date), 1)))}`;
      alarm = "-PT6H"; // dzień wcześniej o 18:00
    }
    L.push("BEGIN:VEVENT", `UID:termin-${esc(d.id)}@skrotbm.pl`, `DTSTAMP:${stamp}`, start, end,
      `SUMMARY:${esc(title)}`, `DESCRIPTION:${esc(desc)}`, `CATEGORIES:${esc(type)}`, "TRANSP:TRANSPARENT",
      "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(title)}`, `TRIGGER:${alarm}`, "END:VALARM",
      "END:VEVENT");
  }
  return L;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = (url.searchParams.get("t") || "").replace(/\.ics$/i, "");
  if (req.method !== "GET" && req.method !== "HEAD") return new Response("Tylko GET.", { status: 405 });
  if (!/^[0-9a-f]{48}$/.test(token)) return new Response("Zły link do kalendarza.", { status: 404 });

  const db = createClient(Deno.env.get("SUPABASE_URL")!, serverKey(), { auth: { persistSession: false } });
  const { data, error } = await db.rpc("nauka_kalendarz_dane", { p_token: token });
  if (error) return new Response("Błąd bazy. Spróbuj później.", { status: 503 });
  if (!data) return new Response("Ten link do kalendarza jest nieaktualny. Nowy znajdziesz w Skrócie BM: Terminy → Do kalendarza w telefonie.", { status: 404 });

  let plan: Plan | null = null;
  try { const r = await fetch(PLAN_URL); if (r.ok) plan = await r.json(); } catch { /* bez planu zostają same terminy */ }

  const group: string = data.grupa || "", sub: string = data.podgrupa || "";
  const now = new Date(), stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00Z`;
  const name = `Skrót BM${group ? " · " + group + (sub ? " lab " + sub : "") : ""}`;
  const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//skrotbm.pl//Skrot BM//PL", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(name)}`, "X-WR-TIMEZONE:Europe/Warsaw",
    `X-WR-CALDESC:${esc(group ? "Zajęcia, zaliczenia i zadania. Aktualizuje się sam." : "Zaliczenia i zadania. Wybierz grupę w Skrócie BM, żeby dodać też zajęcia.")}`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT3H", "X-PUBLISHED-TTL:PT3H", ...VTIMEZONE];

  if (plan && group) L.push(...classEvents(plan, group, sub, stamp));
  if (data.platny) L.push(...deadlineEvents(data.terminy || [], plan, group, sub, stamp));
  else {
    const t = key(new Date(Date.now() + 2 * 3600e3));
    L.push("BEGIN:VEVENT", `UID:dostep-wygasl-${t}@skrotbm.pl`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${ymd(t)}`,
      `SUMMARY:${esc("Skrót BM: dostęp wygasł, terminy zaliczeń są ukryte")}`,
      `DESCRIPTION:${esc(`Przedłuż dostęp na ${APP}, a zaliczenia i zadania wrócą do kalendarza.`)}`, "TRANSP:TRANSPARENT", "END:VEVENT");
  }
  L.push("END:VCALENDAR");

  return new Response(L.map(fold).join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="skrot-bm.ics"',
      "Cache-Control": "private, max-age=900",
    },
  });
});
