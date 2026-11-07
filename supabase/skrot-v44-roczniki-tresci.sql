-- Skrót v44: rocznik przy treściach, terminach i ogłoszeniach (spec „Fundament pod inne kierunki”, Etap 2).
-- Wklej w Supabase → SQL Editor → Run, po v43. Kopiuj z github.com (przycisk „Copy raw file”), nie przez Terminal.
-- Można uruchomić ponownie. Dla BM nic się nie zmienia: wszystkie dotychczasowe treści dostają rocznik BM.
--
-- 1. nauka_docs.rocznik_id (null = wspólne albo osobiste). Kolekcje rocznika: materials, materialContent, materialSimple,
--    quizWhy, materialSources, tasks, deadlines, announcements, exams, examBank, glossary, meta (bez meta/en = słownik EN).
--    Osobiste bez rocznika: progress, myMaterials, myContent, reports.
-- 2. Rocznik osoby: nauka_moj_rocznik() (z nauka_profil, gość i osoba bez profilu = BM).
-- 3. Reguła odczytu: kolekcje rocznika tylko z mojego rocznika (admin wszystko; stronę zawęża filtr w skrot-supabase.js).
-- 4. Wyzwalacz: brak rocznika przy zapisie → rocznik z profilu; nie-admin zawsze do swojego; zmiana rocznika wiersza → błąd.
-- 5. Id dokumentów: klucz to (kolekcja, id), więc stałe id (meta/po, examBank/<przedmiot>…) w innych rocznikach mają sufiks
--    „@<rocznik>” (BM bez sufiksu). Strona dokleja go w skrot-supabase.js, funkcje SQL przez nauka_docs_id().
-- 6. Funkcje czytające terminy i dokumenty po stałym id biorą rocznik osoby: kalendarz (v27), przypomnienia (v36),
--    Po zajęciach i Staś (v28), Boss (v15: nauka_boss.rocznik_id, ciosy tylko od osób z tego rocznika).

-- Strażnik kodowania: polskie litery wpisane wprost muszą być równe tym samym literom zapisanym kodami (same znaki ASCII).
-- Gdy plik przeszedł przez Terminal albo zły schowek, litery z pierwszej strony się psują („Ňā”, „√≥”), a kody nie,
-- więc warunek nie przechodzi i plik zatrzymuje się na pierwszej instrukcji, zanim cokolwiek zmieni.
-- Ten blok wklejamy na sam początek każdej nowej migracji (od v44); pilnuje tego tests/migracje.test.js.
do $$ begin
  if 'ąćęłńóśźż' <> U&'\0105\0107\0119\0142\0144\00F3\015B\017A\017C' then
    raise exception 'Polskie znaki doszły zepsute. Skopiuj plik z github.com (Raw), nie przez Terminal.';
  end if;
end $$;

-- ---------- 1) kolumna, indeks, stałe ----------
alter table public.nauka_docs add column if not exists rocznik_id text references public.nauka_roczniki (id);
create index if not exists nauka_docs_rocznik_idx on public.nauka_docs (kolekcja, rocznik_id);

create or replace function public.nauka_bm() returns text language sql immutable set search_path = '' as $$
  select 'wefiz-bm-1-st-2026'::text
$$;

-- Czy dokument należy do rocznika (a nie jest osobisty albo wspólny). Ta sama lista jest w skrot-supabase.js (ROK_KOLEKCJE).
create or replace function public.nauka_kolekcja_rocznika(p_kolekcja text, p_id text) returns boolean
language sql immutable set search_path = '' as $$
  select p_kolekcja in ('materials','materialContent','materialSimple','quizWhy','materialSources','tasks','deadlines',
                        'announcements','exams','examBank','glossary','meta')
     and not (p_kolekcja = 'meta' and p_id = 'en')
$$;

-- ---------- 2) rocznik osoby ----------
create or replace function public.nauka_rocznik_uid(p_user uuid) returns text
language sql stable security definer set search_path = '' as $$
  select coalesce((select p.rocznik_id from public.nauka_profil p where p.user_id = p_user), public.nauka_bm())
$$;
create or replace function public.nauka_moj_rocznik() returns text
language sql stable security definer set search_path = '' as $$
  select case when auth.uid() is null then public.nauka_bm() else public.nauka_rocznik_uid(auth.uid()) end
$$;
-- Id dokumentu w bazie: BM bez zmian, inne roczniki z sufiksem „@<rocznik>” (jak skrot-supabase.js → docId).
create or replace function public.nauka_docs_id_dla(p_id text, p_rocznik text) returns text
language sql immutable set search_path = '' as $$
  select case when p_rocznik is null or p_rocznik = public.nauka_bm() then p_id else p_id || '@' || p_rocznik end
$$;
create or replace function public.nauka_docs_id(p_id text) returns text
language sql stable security definer set search_path = '' as $$
  select public.nauka_docs_id_dla(p_id, public.nauka_moj_rocznik())
$$;
revoke all on function public.nauka_rocznik_uid(uuid) from public, anon, authenticated;
grant execute on function public.nauka_moj_rocznik(), public.nauka_docs_id(text), public.nauka_docs_id_dla(text, text),
  public.nauka_kolekcja_rocznika(text, text), public.nauka_bm() to anon, authenticated;

-- ---------- 3) dotychczasowe treści = BM (bez wyzwalacza: updated_at i autor zostają) ----------
alter table public.nauka_docs disable trigger nauka_przed_zapisem;
update public.nauka_docs set rocznik_id = public.nauka_bm()
 where rocznik_id is null and public.nauka_kolekcja_rocznika(kolekcja, id);
alter table public.nauka_docs enable trigger nauka_przed_zapisem;

-- ---------- 4) reguła odczytu (v4 + rocznik) ----------
drop policy if exists "nauka czytaj" on public.nauka_docs;
create policy "nauka czytaj" on public.nauka_docs for select to anon, authenticated using (
  (not public.nauka_kolekcja_rocznika(kolekcja, id) or rocznik_id is null
     or rocznik_id = (select public.nauka_moj_rocznik()) or (select public.nauka_admin()))
  and (
     kolekcja = 'materials'
  or (kolekcja in ('materialContent','materialSimple','quizWhy')
        and (public.nauka_platny() or (auth.uid() is not null and public.nauka_darmowy(id))))
  or (kolekcja = 'materialSources'
        and (public.nauka_admin()
             or ((public.nauka_platny() or (auth.uid() is not null and public.nauka_darmowy(id)))
                 and public.nauka_z_sylabusa(id))))
  or (kolekcja in ('tasks','meta','deadlines','announcements','exams','examBank','glossary') and public.nauka_platny())
  or (kolekcja = 'reports'  and public.nauka_admin())
  or (kolekcja = 'progress' and id = auth.uid()::text)
  or (kolekcja in ('myMaterials','myContent') and auth.uid() is not null and created_by = auth.uid())
  )
);

-- ---------- 5) wyzwalacz zapisu (v4 + rocznik) ----------
create or replace function public.nauka_przed_zapisem() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.created_at := now();
    if new.kolekcja in ('deadlines','reports') and not public.nauka_admin() then
      if (select count(*) from public.nauka_docs d
          where d.created_by = auth.uid() and d.kolekcja = new.kolekcja
            and d.created_at > now() - interval '1 hour') >= 20 then
        raise exception 'Za dużo wpisów w ciągu godziny. Spróbuj później.';
      end if;
    end if;
    if new.kolekcja = 'myMaterials' and not public.nauka_admin() then
      if (select count(*) from public.nauka_docs d
          where d.created_by = auth.uid() and d.kolekcja = 'myMaterials'
            and d.created_at > now() - interval '1 hour') >= 30 then
        raise exception 'Za dużo nowych materiałów w ciągu godziny. Spróbuj później.';
      end if;
    end if;
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  -- v44: rocznik przy treściach. Kolekcje rocznika: brak rocznika → rocznik z profilu; osoba bez roli admina zawsze
  -- pisze do swojego rocznika; przy zmianie wiersz zostaje w swoim roczniku (inny → błąd inny_rocznik).
  if public.nauka_kolekcja_rocznika(new.kolekcja, new.id) then
    if tg_op = 'INSERT' then
      if new.rocznik_id is null or not public.nauka_admin() then new.rocznik_id := public.nauka_moj_rocznik(); end if;
    else
      if old.rocznik_id is not null and new.rocznik_id is not null and new.rocznik_id <> old.rocznik_id then
        raise exception 'inny_rocznik: dokument %/% należy do rocznika %', new.kolekcja, new.id, old.rocznik_id;
      end if;
      new.rocznik_id := coalesce(old.rocznik_id, new.rocznik_id, public.nauka_moj_rocznik());
    end if;
  else
    new.rocznik_id := null;   -- osobiste (postęp, Moje materiały, zgłoszenia) i wspólne (meta/en)
  end if;
  new.updated_at := now();
  return new;
end $$;

-- ---------- 6) funkcje: Po zajęciach i Staś (v28), kalendarz (v27), przypomnienia (v36) ----------
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
  select d.data->'quiz'->p_idx into q from public.nauka_docs d where d.kolekcja = 'meta' and d.id = public.nauka_docs_id(v_mid);
  if q is null or coalesce(jsonb_typeof(q->'correct'), '') <> 'number' then return jsonb_build_object('ok', false, 'code', 'no_question'); end if;
  select d.data->'items'->p_id->>'sid' into v_sid from public.nauka_docs d where d.kolekcja = 'meta' and d.id = public.nauka_docs_id('po');
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
  select d.data into doc from public.nauka_docs d where d.kolekcja = 'meta' and d.id = public.nauka_docs_id(v_mid);
  if doc is null or jsonb_typeof(doc->'sentences') <> 'array' then return jsonb_build_object('ok', false, 'code', 'no_question'); end if;
  select d.data->'items'->p_id->>'sid' into v_sid from public.nauka_docs d where d.kolekcja = 'meta' and d.id = public.nauka_docs_id('stas');
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

create or replace function public.nauka_kalendarz_dane(p_token text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare k public.nauka_kalendarz; prog jsonb; ok boolean;
begin
  select * into k from public.nauka_kalendarz where token = p_token;
  if not found then return null; end if;
  update public.nauka_kalendarz set uzyty_at = now() where user_id = k.user_id;
  ok := exists (select 1 from public.nauka_admini a where a.email = k.email)
     or ((exists (select 1 from public.nauka_dostep d
                 where d.do_kiedy >= current_date and (d.user_id = k.user_id or (k.email <> '' and d.email = k.email)))
             or exists (select 1 from public.nauka_proby p where p.user_id = k.user_id and p.do_kiedy > now()))
         and not exists (select 1 from public.nauka_konta b where b.user_id = k.user_id and b.zablokowane));
  select d.data into prog from public.nauka_docs d where d.kolekcja = 'progress' and d.id = k.user_id::text;
  return jsonb_build_object(
    'platny', ok,
    'grupa', prog ->> 'group',
    'podgrupa', prog ->> 'sub',
    'terminy', case when ok then coalesce((select jsonb_agg(d.data || jsonb_build_object('id', d.id))
                                            from public.nauka_docs d where d.kolekcja = 'deadlines'
                                             and (d.rocznik_id is null or d.rocznik_id = public.nauka_rocznik_uid(k.user_id))), '[]'::jsonb)
                    else '[]'::jsonb end,
    'moje', case when ok and jsonb_typeof(prog -> 'myEvents') = 'array'
                 then coalesce((select jsonb_agg(e) from (select e from jsonb_array_elements(prog -> 'myEvents') e
                                where jsonb_typeof(e) = 'object' limit 400) x), '[]'::jsonb)
                 else '[]'::jsonb end,
    'zaliczenia', case when ok and jsonb_typeof(prog -> 'exams') = 'object'
                       then coalesce((select jsonb_agg(jsonb_build_object('k', x.key, 'date', x.value ->> 'date'))
                                        from jsonb_each(prog -> 'exams') x
                                       where jsonb_typeof(x.value) = 'object' and (x.value ->> 'date') ~ '^\d{4}-\d{2}-\d{2}$'), '[]'::jsonb)
                       else '[]'::jsonb end,
    'plan', case when ok and jsonb_typeof(prog -> 'planDays') = 'array'
                 then coalesce((select jsonb_agg(e) from (select e from jsonb_array_elements(prog -> 'planDays') e
                                where jsonb_typeof(e) = 'object' limit 200) x), '[]'::jsonb)
                 else '[]'::jsonb end
  );
end $$;

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
      'historia', (select coalesce(jsonb_agg(jsonb_build_object('day', to_char(h.dzien, 'YYYY-MM-DD'), 'opened', h.otwarte_at is not null) order by h.dzien desc), '[]'::jsonb)
          from (select l.dzien, l.otwarte_at from public.nauka_przypomnienia_log l where l.user_id = p.user_id and l.dzien < d order by l.dzien desc limit 14) h),
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

-- ---------- 7) Boss (v15) per rocznik ----------
alter table public.nauka_boss add column if not exists rocznik_id text not null default 'wefiz-bm-1-st-2026' references public.nauka_roczniki (id);
create index if not exists nauka_boss_rocznik_idx on public.nauka_boss (rocznik_id);

create or replace function public.nauka_boss_odswiez() returns void
language plpgsql security definer set search_path = '' as $$
declare c jsonb := public.nauka_gry2_cfg(); d date := public.nauka_dzis(); b record;
begin
  insert into public.nauka_boss (id, sid, typ, tytul, termin, start, grupy, hp, rocznik_id)
  select x.id, x.data->>'subjectId', x.data->>'type', x.data->>'title', (x.data->>'date')::date,
         greatest(d, (x.data->>'date')::date - (c->>'boss_dni')::int), gr.g, public.nauka_boss_hp(gr.g), coalesce(x.rocznik_id, 'wefiz-bm-1-st-2026')
    from public.nauka_docs x
    cross join lateral (select coalesce(array(select jsonb_array_elements_text(
                          case when jsonb_typeof(x.data->'groups') = 'array' then x.data->'groups' else '[]'::jsonb end)), '{}') g) gr
   where x.kolekcja = 'deadlines'
     and x.data->>'type' in ('kolokwium', 'egzamin')
     and coalesce(x.data->>'subjectId', '') <> ''
     and coalesce((x.data->>'approx')::boolean, false) = false
     and x.data->>'date' ~ '^\d{4}-\d{2}-\d{2}$'
     and (x.data->>'date')::date > d
     and (x.data->>'date')::date <= d + (c->>'boss_dni')::int
  on conflict (id) do nothing;
  -- termin przeniesiony przez starostę: boss idzie za nim (życie bez zmian)
  update public.nauka_boss nb set termin = (x.data->>'date')::date
    from public.nauka_docs x
   where x.kolekcja = 'deadlines' and x.id = nb.id and nb.pokonany_at is null
     and x.data->>'date' ~ '^\d{4}-\d{2}-\d{2}$' and (x.data->>'date')::date <> nb.termin;
  for b in select * from public.nauka_boss where pokonany_at is null and termin > d - 1 and not ukryty loop
    if (select coalesce(sum(ciosy), 0) from public.nauka_boss_ciosy(b.id)) >= b.hp then
      update public.nauka_boss set pokonany_at = now() where id = b.id and pokonany_at is null;
    end if;
  end loop;
end $$;

create or replace function public.nauka_boss_ciosy(p_id text) returns table (user_id uuid, ciosy int)
language sql stable security definer set search_path = '' as $$
  with b as (select * from public.nauka_boss where id = p_id),
  c as (select public.nauka_gry2_cfg() v),
  t as (
    select distinct o.user_id, (o.created_at at time zone 'Europe/Warsaw')::date d, o.rodzaj, o.mid, o.idx
      from public.nauka_odp o, b
     where o.ok and o.sid = b.sid and public.nauka_rocznik_uid(o.user_id) = b.rocznik_id
       and o.created_at >= (b.start::timestamp at time zone 'Europe/Warsaw')
       and o.created_at <  (b.termin::timestamp at time zone 'Europe/Warsaw')
       and (cardinality(b.grupy) = 0 or public.nauka_rp_grupa(o.user_id) = any (b.grupy))),
  dz as (
    select t.user_id, t.d, least(sum(case when t.rodzaj = 'zadanie' then (c.v->>'boss_cios_zadanie')::int else 1 end),
                                (c.v->>'boss_cios_dzien')::int) n
      from t, c group by t.user_id, t.d, c.v)
  select dz.user_id, sum(dz.n)::int from dz group by dz.user_id
$$;

create or replace function public.nauka_bossy() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare c jsonb := public.nauka_gry2_cfg(); d date := public.nauka_dzis(); v_grupa text; v_out jsonb;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  perform public.nauka_boss_odswiez();
  v_grupa := public.nauka_rp_grupa(auth.uid());
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', b.id, 'sid', b.sid, 'typ', b.typ, 'tytul', b.tytul, 'termin', b.termin, 'start', b.start, 'grupy', b.grupy,
      'hp', b.hp, 'zadane', z.suma, 'osob', z.osob, 'moje', coalesce(z.moje, 0),
      'stan', case when b.pokonany_at is not null then 'pokonany' when b.termin <= d then 'uciekl' else 'trwa' end,
      'pokonany_at', b.pokonany_at,
      'odebrane', exists (select 1 from public.nauka_rp r where r.user_id = auth.uid() and r.klucz = 'b:' || b.id),
      'mozna_odebrac', b.pokonany_at is not null and coalesce(z.moje, 0) >= (c->>'boss_min_ciosow')::int
                       and d <= b.termin + (c->>'boss_odbior_dni')::int
                       and not exists (select 1 from public.nauka_rp r where r.user_id = auth.uid() and r.klucz = 'b:' || b.id),
      'top', z.top) order by b.termin), '[]'::jsonb)
    into v_out
    from public.nauka_boss b
    cross join lateral (
      select coalesce(sum(k.ciosy), 0)::int suma, count(*) filter (where k.ciosy > 0)::int osob,
             max(k.ciosy) filter (where k.user_id = auth.uid()) moje,
             coalesce((select jsonb_agg(jsonb_build_object('nick', p.nick, 'ciosy', k2.ciosy, 'ja', k2.user_id = auth.uid()) order by k2.ciosy desc, lower(p.nick))
                         from (select * from public.nauka_boss_ciosy(b.id) order by ciosy desc limit 50) k2
                         join public.nauka_profil p on p.user_id = k2.user_id and p.w_rankingu and p.nick is not null
                        where not public.nauka_rp_admin_uid(k2.user_id)
                        limit 5), '[]'::jsonb) top
        from public.nauka_boss_ciosy(b.id) k) z
   where not b.ukryty and b.rocznik_id = public.nauka_moj_rocznik()
     and b.start <= d and d <= b.termin + (c->>'boss_odbior_dni')::int
     and (cardinality(b.grupy) = 0 or v_grupa = any (b.grupy) or public.nauka_admin());
  return jsonb_build_object('ok', true, 'bossy', v_out, 'min_ciosow', (c->>'boss_min_ciosow')::int, 'pkt', (c->>'boss_pkt')::int);
end $$;

create or replace function public.nauka_boss_odbierz(p_id text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare c jsonb := public.nauka_gry2_cfg(); d date := public.nauka_dzis(); b public.nauka_boss; v_moje int; v_pkt int;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_rp_mozna() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  perform pg_advisory_xact_lock(hashtext('nauka_boss:' || auth.uid()::text));
  select * into b from public.nauka_boss where id = p_id and not ukryty and rocznik_id = public.nauka_moj_rocznik();
  if not found then return jsonb_build_object('ok', false, 'code', 'no_boss'); end if;
  if b.pokonany_at is null then return jsonb_build_object('ok', false, 'code', 'not_defeated'); end if;
  if d > b.termin + (c->>'boss_odbior_dni')::int then return jsonb_build_object('ok', false, 'code', 'too_late'); end if;
  if exists (select 1 from public.nauka_rp r where r.user_id = auth.uid() and r.klucz = 'b:' || b.id) then
    return jsonb_build_object('ok', false, 'code', 'already');
  end if;
  select coalesce(max(ciosy), 0) into v_moje from public.nauka_boss_ciosy(b.id) where user_id = auth.uid();
  if v_moje < (c->>'boss_min_ciosow')::int then
    return jsonb_build_object('ok', false, 'code', 'too_few', 'moje', v_moje, 'trzeba', (c->>'boss_min_ciosow')::int);
  end if;
  v_pkt := public.nauka_rp_dodaj(auth.uid(), 'boss', 'b:' || b.id, b.sid, (c->>'boss_pkt')::int);
  return jsonb_build_object('ok', true, 'pkt', v_pkt);
end $$;

notify pgrst, 'reload schema';
