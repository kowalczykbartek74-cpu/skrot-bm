do $$ begin
  if 'ąćęłńóśźż' <> U&'\0105\0107\0119\0142\0144\00F3\015B\017A\017C' then
    raise exception 'Polskie znaki doszły zepsute. Skopiuj plik z github.com (Raw), nie przez Terminal.';
  end if;
end $$;
-- Skrót v57 (pętla UX-2, etapy 4–5): kanał poza stroną i zadania dnia.
-- Wklej w Supabase → SQL Editor → Run, po v56. Kopiuj z github.com („Copy raw file”), nie przez Terminal. Można uruchomić ponownie.
--
-- Etap 4:
--  1. nauka_przypomnienia_kandydaci: historia maili ma też rodzaj (np. „seria_b”), żeby przypomnienie „ratuj serię” wybierało wariant
--     tekstu nieużyty w ostatnich 3 mailach (rotacja A/B/C). Reszta bez zmian (kopia wersji z v44 + pole rodzaj).
--  3. nauka_przypomnienia_ustaw: nowy rodzaj maila „seria” (ratuj serię) w ustawieniach co (domyślnie włączony); kopia v36 + pole.
--  2. nauka_kalendarz_nauka(token): czy osoba włączyła w kalendarzu w telefonie wpis „Zdawalni · 5 min po zajęciach”
--     (progress.calStudy). Osobna funkcja: nauka_kalendarz_dane (v46) zostaje bez zmian.

create or replace function public.nauka_przypomnienia_kandydaci(p_teraz timestamptz default now()) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  cfg jsonb := public.nauka_przypomnienia_cfg();
  lokal timestamp := p_teraz at time zone 'Europe/Warsaw';
  d date := lokal::date;
  m int := extract(hour from lokal)::int * 60 + extract(minute from lokal)::int;
  okno int := (cfg->>'okno_min')::int;
  wyslane int; zostalo int; osoby jsonb;
begin
  -- doba UTC, jak licznik Resend
  select count(*) into wyslane from public.nauka_przypomnienia_log l
   where l.kanal = 'email' and l.wyslano_at >= date_trunc('day', p_teraz at time zone 'UTC') at time zone 'UTC';
  zostalo := greatest(0, (cfg->>'limit_dzien')::int - wyslane);
  select coalesce(jsonb_agg(o order by (o->>'godz')::int, o->>'user_id'), '[]'::jsonb) into osoby from (
    select jsonb_build_object(
      'user_id', p.user_id, 'email', u.email, 'token', p.token, 'jezyk', p.jezyk, 'co', p.co, 'stan', p.stan, 'godz', p.godz,
      'rocznik_id', p.rocznik_id,
      'dni_nauki', (select coalesce(jsonb_agg(distinct x.dz), '[]'::jsonb) from (
          select to_char((z.kiedy at time zone 'Europe/Warsaw')::date, 'YYYY-MM-DD') dz from public.nauka_zdarzenia z
           where z.user_id = p.user_id and z.typ <> 'profile_test' and z.kiedy >= (d - 21)::timestamp at time zone 'Europe/Warsaw'
          union
          select to_char((w.at at time zone 'Europe/Warsaw')::date, 'YYYY-MM-DD') from public.nauka_powtorki_log w
           where w.user_id = p.user_id and w.at >= (d - 21)::timestamp at time zone 'Europe/Warsaw') x),
      'ostatni', (select to_char(max(dd), 'YYYY-MM-DD') from (
          select max((z.kiedy at time zone 'Europe/Warsaw')::date) dd from public.nauka_zdarzenia z
           where z.user_id = p.user_id and z.typ <> 'profile_test' and z.kiedy < d::timestamp at time zone 'Europe/Warsaw'
          union all
          select max((w.at at time zone 'Europe/Warsaw')::date) from public.nauka_powtorki_log w
           where w.user_id = p.user_id and w.at < d::timestamp at time zone 'Europe/Warsaw') y),
      'historia', (select coalesce(jsonb_agg(jsonb_build_object('day', to_char(h.dzien, 'YYYY-MM-DD'), 'opened', h.otwarte_at is not null, 'rodzaj', h.rodzaj) order by h.dzien desc), '[]'::jsonb)
          from (select l.dzien, l.otwarte_at, l.rodzaj from public.nauka_przypomnienia_log l where l.user_id = p.user_id and l.dzien < d order by l.dzien desc limit 14) h),
      'dl', (select coalesce(jsonb_object_agg(x.id, jsonb_build_object('date', x.data->>'date', 'type', x.data->>'type', 'approx', coalesce(x.data->'approx', 'false'::jsonb))), '{}'::jsonb)
          from public.nauka_docs x where x.kolekcja = 'deadlines'
           and (x.rocznik_id is null or x.rocznik_id = public.nauka_rocznik_uid(p.user_id))
           and x.id in (select t->>'dl' from jsonb_array_elements(case when jsonb_typeof(p.stan->'ter') = 'array' then p.stan->'ter' else '[]'::jsonb end) t))
    ) o
    from public.nauka_przypomnienia p join auth.users u on u.id = p.user_id
    where p.wlaczone and coalesce(u.email, '') <> '' and p.godz <= m and m < p.godz + okno
      and not exists (select 1 from public.nauka_przypomnienia_log l where l.user_id = p.user_id and l.dzien = d)
      and not exists (select 1 from public.nauka_konta k where k.user_id = p.user_id and k.zablokowane)
    order by p.godz, p.user_id
    limit zostalo
  ) q;
  return jsonb_build_object('ok', true, 'dzien', to_char(d, 'YYYY-MM-DD'), 'minuta', m, 'zostalo', zostalo, 'osoby', osoby);
end $$;

create or replace function public.nauka_kalendarz_nauka(p_token text) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select (d.data ->> 'calStudy')::boolean from public.nauka_kalendarz k
                    join public.nauka_docs d on d.kolekcja = 'progress' and d.id = k.user_id::text
                   where k.token = p_token and jsonb_typeof(d.data -> 'calStudy') = 'boolean'), false)
$$;
revoke all on function public.nauka_kalendarz_nauka(text) from public, anon, authenticated;
grant execute on function public.nauka_kalendarz_nauka(text) to service_role;

create or replace function public.nauka_przypomnienia_ustaw(p jsonb) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare u uuid := auth.uid(); w boolean; g int; c jsonb; j text; rid text; stare public.nauka_przypomnienia;
begin
  if u is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if jsonb_typeof(p) is distinct from 'object' then return jsonb_build_object('ok', false, 'code', 'bad_input'); end if;
  select * into stare from public.nauka_przypomnienia where user_id = u;
  w := case when jsonb_typeof(p->'wlaczone') = 'boolean' then (p->>'wlaczone')::boolean else coalesce(stare.wlaczone, false) end;
  if p ? 'godz' then
    if jsonb_typeof(p->'godz') <> 'number' or (p->>'godz') !~ '^[0-9]{3,4}$' then return jsonb_build_object('ok', false, 'code', 'bad_input'); end if;
    g := (p->>'godz')::int;
    if g < 360 or g > 1320 or g % 30 <> 0 then return jsonb_build_object('ok', false, 'code', 'bad_input'); end if;
  else g := coalesce(stare.godz, 1080); end if;
  if p ? 'co' then
    if jsonb_typeof(p->'co') <> 'object' then return jsonb_build_object('ok', false, 'code', 'bad_input'); end if;
    c := jsonb_build_object('terminy', case when jsonb_typeof(p->'co'->'terminy') = 'boolean' then (p->'co'->>'terminy')::boolean else true end,
                            'powtorki', case when jsonb_typeof(p->'co'->'powtorki') = 'boolean' then (p->'co'->>'powtorki')::boolean else true end,
                            'zadanie', case when jsonb_typeof(p->'co'->'zadanie') = 'boolean' then (p->'co'->>'zadanie')::boolean else true end,
                            'seria', case when jsonb_typeof(p->'co'->'seria') = 'boolean' then (p->'co'->>'seria')::boolean else true end);
  else c := coalesce(stare.co, '{"terminy": true, "powtorki": true, "zadanie": true}'::jsonb); end if;
  j := case when p->>'jezyk' in ('pl', 'en') then p->>'jezyk' else coalesce(stare.jezyk, 'pl') end;
  select x.rocznik_id into rid from public.nauka_profil x where x.user_id = u;
  insert into public.nauka_przypomnienia as t (user_id, rocznik_id, wlaczone, godz, co, jezyk, wlaczone_at)
  values (u, rid, w, g, c, j, case when w then now() end)
  on conflict (user_id) do update set rocznik_id = excluded.rocznik_id, wlaczone = excluded.wlaczone, godz = excluded.godz, co = excluded.co,
    jezyk = excluded.jezyk, updated_at = now(),
    wlaczone_at = case when excluded.wlaczone and not t.wlaczone then now() else t.wlaczone_at end,
    wypisane_at = case when excluded.wlaczone then null else t.wypisane_at end,
    stan = case when excluded.wlaczone then t.stan else '{}'::jsonb end,
    stan_at = case when excluded.wlaczone then t.stan_at end;
  return public.nauka_przypomnienia_moje();
end $$;

notify pgrst, 'reload schema';
