-- Skrót BM v28: punkty i monety za „Po zajęciach w 5 minut” i Stasia, osobiste Zadanie dnia.
-- Wklej w Supabase → SQL Editor → Run, po v27 (wymaga v13, v15 i v14). Można uruchamiać wielokrotnie (nie kasuje danych).
-- Plan zaakceptowany 4.11.2026: docs/polaczenia/etap-4-plan-migracji.md.
--
-- Zasady (jak w quizie lekcji, v13/v15):
--   • odpowiedź sprawdza baza (treść z nauka_docs, kolekcja meta: po~<id>, stas~<id>);
--   • liczy się tylko PIERWSZA odpowiedź dnia na dane pytanie / zdanie (nauka_odp), dobra daje pkt_abcd (10 pkt = 1 🪙)
--     z puli quizu, kluczem q:po~<id>:<i> / q:stas~<id>:<i>, czyli raz dziennie i w tym samym limicie co quiz.
--     Limity pul się nie zmieniają, więc limit 64 🪙 dziennie z nauki też nie;
--   • klucz zaczyna się od q:, więc liczy się do Zadań dnia „Odpowiedz dobrze na 10 / 25 pytań”;
--   • osobiste Zadanie dnia: strona wybiera je raz dziennie z priorytetu tematu, pierwszy zapis jest ostateczny,
--     postęp liczy baza z nauka_rp, nagroda 8 🪙 (jak odp10 i pkt60). Wspólne 3 zadania dnia i zadanie tygodnia bez zmian.

-- =====================================================================
-- 1) Po zajęciach w 5 minut: „Sprawdź się”
-- =====================================================================
create or replace function public.nauka_rp_po(p_id text, p_idx int, p_wybor int) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  c jsonb := public.nauka_rp_cfg();
  q jsonb; v_sid text; v_mid text := 'po~' || coalesce(p_id, ''); v_ok boolean; v_correct int; v_pkt int := 0; v_pierwsza boolean;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_rp_mozna() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  if p_id is null or char_length(p_id) > 150 or p_idx is null or p_idx < 0 then return jsonb_build_object('ok', false, 'code', 'no_question'); end if;
  if public.nauka_rp_za_szybko(auth.uid()) then return jsonb_build_object('ok', false, 'code', 'too_fast'); end if;
  select d.data->'quiz'->p_idx into q from public.nauka_docs d where d.kolekcja = 'meta' and d.id = v_mid;
  if q is null or coalesce(jsonb_typeof(q->'correct'), '') <> 'number' then return jsonb_build_object('ok', false, 'code', 'no_question'); end if;
  select d.data->'items'->p_id->>'sid' into v_sid from public.nauka_docs d where d.kolekcja = 'meta' and d.id = 'po';
  if v_sid is null then return jsonb_build_object('ok', false, 'code', 'no_question'); end if;
  v_correct := (q->>'correct')::int;
  v_ok := p_wybor is not null and p_wybor = v_correct;
  v_pierwsza := not exists (select 1 from public.nauka_odp o where o.user_id = auth.uid() and o.rodzaj = 'abcd'
                 and o.mid = v_mid and o.idx = p_idx::text
                 and o.created_at >= (public.nauka_dzis()::timestamp at time zone 'Europe/Warsaw'));
  insert into public.nauka_odp (user_id, mid, idx, sid, rodzaj, ok, zrodlo, wybor)
  values (auth.uid(), v_mid, p_idx::text, v_sid, 'abcd', v_ok, 'quiz', case when p_wybor between 0 and 9 then p_wybor end);
  if v_ok and v_pierwsza then
    v_pkt := public.nauka_rp_dodaj(auth.uid(), 'quiz', 'q:' || v_mid || ':' || p_idx, v_sid, (c->>'pkt_abcd')::int);
  end if;
  return jsonb_build_object('ok', true, 'poprawna', v_ok, 'correct', v_correct, 'pkt', v_pkt);
end $$;

-- =====================================================================
-- 2) Stażysta Staś: zdania oznaczone jako błędne
-- =====================================================================
-- p_zdania = numery zdań, które osoba oznaczyła jako błędne (najwyżej 12). Każde zdanie liczy się raz dziennie
-- (pierwsze podejście); dobrze znaleziony błąd = pkt_abcd, źle oznaczone poprawne zdanie = zapis bez punktów.
create or replace function public.nauka_rp_stas(p_id text, p_zdania int[]) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  c jsonb := public.nauka_rp_cfg();
  doc jsonb; v_sid text; v_mid text := 'stas~' || coalesce(p_id, ''); i int; s jsonb; v_ok boolean; v_pkt int := 0; dobre int := 0; zle int := 0;
  od timestamptz := (public.nauka_dzis()::timestamp at time zone 'Europe/Warsaw');
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_rp_mozna() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  if p_id is null or char_length(p_id) > 150 or p_zdania is null or cardinality(p_zdania) > 12 then return jsonb_build_object('ok', false, 'code', 'bad_input'); end if;
  if public.nauka_rp_za_szybko(auth.uid()) then return jsonb_build_object('ok', false, 'code', 'too_fast'); end if;
  select d.data into doc from public.nauka_docs d where d.kolekcja = 'meta' and d.id = v_mid;
  if doc is null or jsonb_typeof(doc->'sentences') <> 'array' then return jsonb_build_object('ok', false, 'code', 'no_question'); end if;
  select d.data->'items'->p_id->>'sid' into v_sid from public.nauka_docs d where d.kolekcja = 'meta' and d.id = 'stas';
  if v_sid is null then return jsonb_build_object('ok', false, 'code', 'no_question'); end if;
  foreach i in array (select array_agg(distinct x) from unnest(p_zdania) x where x is not null and x >= 0) loop
    s := doc->'sentences'->i;
    if s is null then continue; end if;
    v_ok := coalesce((s->>'isWrong')::boolean, false);
    if exists (select 1 from public.nauka_odp o where o.user_id = auth.uid() and o.rodzaj = 'abcd' and o.mid = v_mid and o.idx = i::text and o.created_at >= od) then continue; end if;
    insert into public.nauka_odp (user_id, mid, idx, sid, rodzaj, ok, zrodlo) values (auth.uid(), v_mid, i::text, v_sid, 'abcd', v_ok, 'quiz');
    if v_ok then
      dobre := dobre + 1;
      v_pkt := v_pkt + public.nauka_rp_dodaj(auth.uid(), 'quiz', 'q:' || v_mid || ':' || i, v_sid, (c->>'pkt_abcd')::int);
    else zle := zle + 1; end if;
  end loop;
  return jsonb_build_object('ok', true, 'dobre', dobre, 'zle', zle, 'pkt', v_pkt);
end $$;

-- =====================================================================
-- 3) Osobiste Zadanie dnia
-- =====================================================================
create table if not exists public.nauka_misja_osobista (
  user_id    uuid not null,
  dzien      date not null,
  typ        text not null check (typ in ('sprint','po','stas','plan')),
  cel        jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (user_id, dzien)
);
alter table public.nauka_misja_osobista enable row level security;
revoke all on public.nauka_misja_osobista from anon, authenticated;

create or replace function public.nauka_misja_osobista_cfg() returns jsonb
language sql immutable set search_path = '' as $$
  select '{"nagroda": 8, "sprint": 8, "po": 2, "stas": 2, "plan": 5, "plan_mids": 6}'::jsonb
$$;

-- Ile dobrych wierszy dziś dla osobistego zadania (liczy baza z nauka_rp).
create or replace function public.nauka_misja_osobista_postep(p_user uuid, m public.nauka_misja_osobista) returns int
language plpgsql stable security definer set search_path = '' as $$
declare v int; mids text[];
begin
  if m.typ = 'sprint' then
    select count(*) into v from public.nauka_rp r where r.user_id = p_user and r.dzien = m.dzien and r.zrodlo in ('quiz','gra')
       and r.klucz like 'q:%' and r.sid = m.cel->>'sid';
  elsif m.typ = 'po' then
    select count(*) into v from public.nauka_rp r where r.user_id = p_user and r.dzien = m.dzien and r.klucz like 'q:po~%';
  elsif m.typ = 'stas' then
    select count(*) into v from public.nauka_rp r where r.user_id = p_user and r.dzien = m.dzien and r.klucz like 'q:stas~%';
  else
    mids := array(select jsonb_array_elements_text(coalesce(m.cel->'mids', '[]'::jsonb)) limit 6);
    select coalesce(sum(case when r.klucz like 'l:%' then 5 else 1 end), 0) into v from public.nauka_rp r
     where r.user_id = p_user and r.dzien = m.dzien
       and exists (select 1 from unnest(mids) x where r.klucz like 'q:' || x || ':%' or r.klucz = 'l:' || x or r.klucz like 'z:' || x || ':%');
  end if;
  return coalesce(v, 0);
end $$;

-- Strona wybiera zadanie raz dziennie (z priorytetu tematu). Pierwszy zapis dnia jest ostateczny.
-- p_cel: sprint {sid}, plan {mids: [...]}, oraz opis {pl, en} do pokazania (najwyżej 160 znaków).
create or replace function public.nauka_misja_osobista_ustaw(p_typ text, p_cel jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare d date := public.nauka_dzis(); cel jsonb;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_rp_mozna() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  if p_typ not in ('sprint','po','stas','plan') then return jsonb_build_object('ok', false, 'code', 'bad_input'); end if;
  if p_typ = 'sprint' and coalesce(p_cel->>'sid', '') !~ '^[a-z0-9-]{2,60}$' then return jsonb_build_object('ok', false, 'code', 'bad_input'); end if;
  if p_typ = 'plan' and (jsonb_typeof(p_cel->'mids') <> 'array' or jsonb_array_length(p_cel->'mids') = 0) then return jsonb_build_object('ok', false, 'code', 'bad_input'); end if;
  cel := jsonb_build_object('sid', p_cel->>'sid',
           'mids', case when p_typ = 'plan' then (select jsonb_agg(left(x, 80)) from (select jsonb_array_elements_text(p_cel->'mids') x limit 6) t) end,
           'pl', left(coalesce(p_cel->>'pl', ''), 160), 'en', left(coalesce(p_cel->>'en', ''), 160));
  insert into public.nauka_misja_osobista (user_id, dzien, typ, cel) values (auth.uid(), d, p_typ, jsonb_strip_nulls(cel))
  on conflict (user_id, dzien) do nothing;
  return public.nauka_misje();
end $$;

-- Dzisiejsze Zadania dnia (3) + Zadanie tygodnia (1) jak w v14, a do tego pole „osobista” (null = jeszcze niewybrane).
create or replace function public.nauka_misje() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  d date := public.nauka_dzis();
  mozna boolean := public.nauka_rp_mozna();
  out_ jsonb := '[]'::jsonb; m jsonb; pst int; o public.nauka_misja_osobista; oc jsonb := public.nauka_misja_osobista_cfg(); os jsonb;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  for m in select e from jsonb_array_elements(public.nauka_misje_na(d)) e loop
    pst := case when mozna then public.nauka_misja_postep(auth.uid(), m, d) else 0 end;
    out_ := out_ || jsonb_build_array(jsonb_build_object(
      'id', m->>'id', 'okres', m->>'okres', 'opis_pl', m->>'pl', 'opis_en', m->>'en',
      'ile', (m->>'ile')::int, 'postep', least(pst, (m->>'ile')::int), 'nagroda', (m->>'nagroda')::int,
      'odebrana', exists (select 1 from public.nauka_monety x where x.user_id = auth.uid() and x.klucz = public.nauka_misja_klucz(m, d)),
      'zablokowane', not mozna,
      'do_kiedy', case when m->>'okres' = 'tydzien' then (public.nauka_tydzien(d) + 7)::timestamp else (d + 1)::timestamp end
                  at time zone 'Europe/Warsaw'));
  end loop;
  select * into o from public.nauka_misja_osobista x where x.user_id = auth.uid() and x.dzien = d;
  if found then
    pst := case when mozna then public.nauka_misja_osobista_postep(auth.uid(), o) else 0 end;
    os := jsonb_build_object('id', 'osobista', 'okres', 'dzien', 'typ', o.typ, 'cel', o.cel, 'opis_pl', o.cel->>'pl', 'opis_en', o.cel->>'en',
      'ile', (oc->>o.typ)::int, 'postep', least(pst, (oc->>o.typ)::int), 'nagroda', (oc->>'nagroda')::int,
      'odebrana', exists (select 1 from public.nauka_monety x where x.user_id = auth.uid() and x.klucz = 'misja:osobista:' || d::text),
      'zablokowane', not mozna, 'do_kiedy', (d + 1)::timestamp at time zone 'Europe/Warsaw');
  end if;
  return jsonb_build_object('ok', true, 'dzien', d, 'zablokowane', not mozna, 'teraz', now(), 'misje', out_, 'osobista', os);
end $$;

-- Odbiór nagrody: wspólne zadania jak w v14, osobiste pod id „osobista”.
create or replace function public.nauka_misja_odbierz(p_id text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  d date := public.nauka_dzis();
  m jsonb; n int; s int; o public.nauka_misja_osobista; oc jsonb := public.nauka_misja_osobista_cfg();
  v_nagroda int; v_klucz text; v_opis text;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_rp_mozna() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  perform pg_advisory_xact_lock(hashtext('nauka_mon:' || auth.uid()::text));
  if p_id = 'osobista' then
    select * into o from public.nauka_misja_osobista x where x.user_id = auth.uid() and x.dzien = d;
    if not found then return jsonb_build_object('ok', false, 'code', 'not_today'); end if;
    if public.nauka_misja_osobista_postep(auth.uid(), o) < (oc->>o.typ)::int then return jsonb_build_object('ok', false, 'code', 'not_done'); end if;
    v_nagroda := (oc->>'nagroda')::int; v_klucz := 'misja:osobista:' || d::text; v_opis := 'Twoje zadanie dnia: ' || coalesce(nullif(o.cel->>'pl', ''), o.typ);
  else
    select e into m from jsonb_array_elements(public.nauka_misje_na(d)) e where e->>'id' = p_id;
    if m is null then return jsonb_build_object('ok', false, 'code', 'not_today'); end if;
    if public.nauka_misja_postep(auth.uid(), m, d) < (m->>'ile')::int then return jsonb_build_object('ok', false, 'code', 'not_done'); end if;
    v_nagroda := (m->>'nagroda')::int; v_klucz := public.nauka_misja_klucz(m, d);
    v_opis := case when m->>'okres' = 'tydzien' then 'Zadanie tygodnia: ' else 'Zadanie dnia: ' end || (m->>'pl');
  end if;
  s := public.nauka_saldo(auth.uid());
  if s + v_nagroda > (public.nauka_mon_cfg()->>'max_saldo')::int then return jsonb_build_object('ok', false, 'code', 'max_saldo'); end if;
  insert into public.nauka_monety (user_id, dzien, delta, zrodlo, klucz, opis) values (auth.uid(), d, v_nagroda, 'misja', v_klucz, left(v_opis, 200))
  on conflict (user_id, klucz) do nothing;
  get diagnostics n = row_count;
  if n = 0 then return jsonb_build_object('ok', false, 'code', 'already', 'saldo', s); end if;
  return jsonb_build_object('ok', true, 'id', p_id, 'nagroda', v_nagroda, 'saldo', s + v_nagroda);
end $$;

-- =====================================================================
-- 4) Uprawnienia
-- =====================================================================
revoke execute on function
  public.nauka_rp_po(text, int, int), public.nauka_rp_stas(text, int[]),
  public.nauka_misja_osobista_cfg(), public.nauka_misja_osobista_postep(uuid, public.nauka_misja_osobista),
  public.nauka_misja_osobista_ustaw(text, jsonb), public.nauka_misje(), public.nauka_misja_odbierz(text)
from public, anon, authenticated;
grant execute on function
  public.nauka_rp_po(text, int, int), public.nauka_rp_stas(text, int[]),
  public.nauka_misja_osobista_ustaw(text, jsonb), public.nauka_misje(), public.nauka_misja_odbierz(text)
to authenticated;

notify pgrst, 'reload schema';
