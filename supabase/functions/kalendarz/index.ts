// Funkcja „kalendarz” dla Skrót BM: osobisty plik kalendarza (.ics) pod tajnym linkiem.
//   GET /functions/v1/kalendarz?t=TOKEN
// Zawiera zajęcia grupy wybranej w aplikacji (plan z plan.skrotbm.pl, z odwołaniami), zaliczenia i zadania z bazy,
// a od SQL v27 także własne wpisy („✏️ Mój wpis”), własne daty zaliczeń („📅 Twoja data”) i dni planu nauki („📘 Plan”).
// Google, Apple i Outlook subskrybują ten link i same pobierają nowszą wersję.
// Wdrażanie: npx supabase functions deploy kalendarz --no-verify-jwt
// (kalendarze w telefonach nie wysyłają tokenu Supabase; chroni tajny token w linku).
import { createClient } from "jsr:@supabase/supabase-js@2";

const PLAN_URL = "https://plan.skrotbm.pl/plan.json";
const APP = "https://zdawalni.pl"; // UID-y wydarzeń zostają @skrotbm.pl, żeby kalendarze w telefonach nie zdublowały wpisów
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
// Komunikaty dziekanatu i zatwierdzone odwołania z Teams (plan-bm/scripts/dziekanat.mjs → plan.json „dziekanat”).
type Dz = { type: string; kind?: string; date: string; start?: string; end?: string; pl?: string; en?: string; k?: string; p?: string; r?: string; g?: string; post?: number; dup?: boolean; moved?: boolean };
type Post = { url?: string; title?: string; text?: string; src?: string; team?: string };
// deno-lint-ignore no-explicit-any
type Plan = { groups: Record<string, Record<string, Entry[]>>; kalendarz?: any; dziekanat?: { zmiany?: Record<string, Dz[]>; posts?: Post[] } };
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
  // Odwołane zajęcia zostają w kalendarzu z „ODWOŁANE:” w tytule (jak na plan.skrotbm.pl), odrabianie i zmiany dochodzą.
  const dz = (plan.dziekanat?.zmiany?.[group] || []).filter((x) => !sub || !x.g || x.g === sub);
  const posts = plan.dziekanat?.posts || [];
  const postLine = (p: Post | undefined) => !p ? null : p.src === "teams" ? `Ogłoszenie prowadzącego w Teams: ${p.title || ""}` : `Komunikat dziekanatu: ${p.text || p.title || ""}${p.url ? "\n" + p.url : ""}`;
  for (const x of dz) { if (x.date < first) first = x.date; if (x.date > last) last = x.date; }
  for (let d = parse(first); key(d) <= last; d = addDays(d, 1)) {
    const k = key(d), sw = SWAP[k], p = sw?.p || PAR[k];
    const today = dz.filter((x) => x.date === k);
    if (!p && !today.length) continue;
    const day = sw?.asDay ?? (d.getUTCDay() + 6) % 7;
    const items: (Entry & { extra?: Dz })[] = (p ? grp[p] || [] : []).filter((e) => e.d === day && (!sub || !e.g || e.g === sub) && (!e.dates || e.dates.includes(k)));
    for (const x of today) if (x.type === "extra" && !x.dup && x.start) items.push({ d: day, s: 9, pl: x.pl, en: x.en, k: x.k || "X", p: x.p, r: x.r, g: x.g, time: [x.start, x.end || x.start], extra: x });
    for (const e of items) {
      const [t0, t1] = e.time || SLOTS[e.s];
      const kind = KIND[e.k];
      const off = !e.extra ? today.find((x) => x.type === "cancel" && x.start === t0 && x.pl === e.pl && (!x.g || !e.g || x.g === e.g)) : undefined;
      const post = off ? posts[off.post as number] : e.extra ? posts[e.extra.post as number] : undefined;
      const label = off ? (off.moved ? "PRZENIESIONE: " : "ODWOŁANE: ") : e.extra ? (e.extra.kind === "change" ? "Zmiana: " : "Odrabianie: ") : "";
      const desc = [
        postLine(post),
        kind ? kind[0].toUpperCase() + kind.slice(1) + (e.g ? `, podgrupa ${e.g}` : "") : null,
        e.en && e.en !== e.pl ? e.en : null,
        e.p ? `Prowadzi: ${e.p}` : null, sw?.n || null, e.n || null,
        `Materiały: ${APP}`,
      ].filter(Boolean).join("\n");
      L.push("BEGIN:VEVENT",
        `UID:${k}-${group}-${e.extra ? "dz" + t0.replace(":", "") : e.s}-${e.g || "x"}-${hash((e.pl || "") + e.k)}@skrotbm.pl`,
        `DTSTAMP:${stamp}`,
        `DTSTART;TZID=Europe/Warsaw:${ymd(k)}T${hm(t0)}`,
        `DTEND;TZID=Europe/Warsaw:${ymd(k)}T${hm(t1)}`,
        `SUMMARY:${esc(`${label}${e.pl || e.en}${SHORT[e.k] ? " · " + SHORT[e.k] : ""}${e.g && !sub ? " (laby " + e.g + ")" : ""}`)}`,
        ...(e.r ? [`LOCATION:${esc(/ul\.|Szczecin/.test(e.r) ? e.r : e.r + ", ul. Cukrowa 8, Szczecin")}`] : []),
        `DESCRIPTION:${esc(desc)}`, `CATEGORIES:${esc(kind || "zajęcia")}`, off ? "TRANSP:TRANSPARENT" : "TRANSP:OPAQUE", "END:VEVENT");
    }
  }
  const allDay = (od: string, doo: string, txt: string, id: string) => L.push("BEGIN:VEVENT", `UID:${id}@skrotbm.pl`, `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${ymd(od)}`, `DTEND;VALUE=DATE:${ymd(key(addDays(parse(doo), 1)))}`, `SUMMARY:${esc(txt)}`, "TRANSP:TRANSPARENT", "END:VEVENT");
  for (const [k, txt] of Object.entries(OFF)) allDay(k, k, `Bez zajęć: ${txt}`, `wolne-${k}`);
  for (const o of kal.okresy || []) if (!o.od.startsWith("0000") && !o.do.startsWith("9999")) allDay(o.od, o.do, o.opis, `okres-${o.od}`);
  return L;
}

// Własne rzeczy osoby (SQL v27, nauka_kalendarz_dane): wpisy z Kalendarza, własne daty zaliczeń i dni planu nauki.
// Każdy rodzaj ma swój znak w tytule, żeby w telefonie od razu było widać, skąd jest wpis.
type Mine = { id?: string; title?: string; date?: string; time?: string; kind?: string; sid?: string; note?: string };
type Own = { k: string; date: string };
type PlanDay = { date?: string; sid?: string; part?: string; title?: string; min?: number };
const PART: Record<string, string> = { W: "wykład", CW: "ćwiczenia", LAB: "laboratorium" };
function personalEvents(mine: Mine[], own: Own[], planDays: PlanDay[], names: Record<string, string>, stamp: string): string[] {
  const L: string[] = [];
  const day = (id: string, date: string, title: string, desc: string, alarm?: string) => L.push("BEGIN:VEVENT", `UID:${id}@skrotbm.pl`, `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${ymd(date)}`, `DTEND;VALUE=DATE:${ymd(key(addDays(parse(date), 1)))}`, `SUMMARY:${esc(title)}`, `DESCRIPTION:${esc(desc)}`, "TRANSP:TRANSPARENT",
    ...(alarm ? ["BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(title)}`, `TRIGGER:${alarm}`, "END:VALARM"] : []), "END:VEVENT");
  for (const e of mine) {
    if (!e?.title || !/^\d{4}-\d{2}-\d{2}$/.test(e.date || "")) continue;
    const title = `✏️ Mój wpis: ${e.title}${e.sid && names[e.sid] ? ` (${names[e.sid]})` : ""}`, desc = [e.note || null, `Twój wpis w Skrócie BM: ${APP}`].filter(Boolean).join("\n");
    if (/^\d{1,2}:\d{2}$/.test(e.time || "")) {
      const [h, m] = e.time!.split(":").map(Number), t = h * 60 + m + 60;
      L.push("BEGIN:VEVENT", `UID:moje-${esc(e.id || hash(e.title + e.date))}@skrotbm.pl`, `DTSTAMP:${stamp}`,
        `DTSTART;TZID=Europe/Warsaw:${ymd(e.date!)}T${pad(h)}${pad(m)}00`, `DTEND;TZID=Europe/Warsaw:${ymd(e.date!)}T${pad(Math.min(23, Math.floor(t / 60)))}${pad(t >= 24 * 60 ? 59 : t % 60)}00`,
        `SUMMARY:${esc(title)}`, `DESCRIPTION:${esc(desc)}`, "TRANSP:OPAQUE", "END:VEVENT");
    } else day(`moje-${esc(e.id || hash(e.title + e.date))}`, e.date!, title, desc);
  }
  for (const o of own) {
    const i = o.k.lastIndexOf("-"), sid = o.k.slice(0, i), part = o.k.slice(i + 1);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(o.date)) continue;
    const title = `📅 Twoja data: zaliczenie ${names[sid] || sid}${PART[part] ? ` (${PART[part]})` : ""}`;
    day(`twoja-data-${o.k}`, o.date, title, `Data wpisana przez Ciebie w Skrócie BM (Przygotuj się). Plan nauki liczy się do niej.\n${APP}`, "-PT6H");
  }
  for (const p of planDays) {
    if (!p?.title || !/^\d{4}-\d{2}-\d{2}$/.test(p.date || "")) continue;
    day(`plan-${p.date}-${hash((p.sid || "") + (p.part || ""))}`, p.date!, `📘 Plan: ${p.title}`, `Dzisiejszy krok planu „Przygotuj się”${p.min ? `, ok. ${p.min} min` : ""}.\n${APP}`);
  }
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
  if (data.platny) {
    // Część przedmiotu z własną datą: szacowane terminy starosty tej części znikają (jak w aplikacji).
    const own: Own[] = Array.isArray(data.zaliczenia) ? data.zaliczenia : [];
    const ownParts = new Set(own.map((o) => o.k));
    const terminy = (data.terminy || []).filter((d: Deadline) => !(d.approx && (ownParts.has(`${d.subjectId}-${d.part || ""}`) || (!d.part && own.some((o) => o.k.startsWith(d.subjectId + "-"))))));
    L.push(...deadlineEvents(terminy, plan, group, sub, stamp));
    const names: Record<string, string> = {};
    for (const g of Object.values(plan?.groups || {})) for (const w of ["odd", "even"]) for (const e of g[w] || []) if (e.pl && e.k !== "X") names[slug(e.pl)] = e.pl;
    L.push(...personalEvents(Array.isArray(data.moje) ? data.moje : [], own, Array.isArray(data.plan) ? data.plan : [], names, stamp));
  }
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
