-- Skrót v46: plan i kalendarz per rocznik, ranking po roczniku (spec „Fundament pod inne kierunki”, Etapy 5–6).
-- Wklej w Supabase → SQL Editor → Run, po v45. Kopiuj z github.com (przycisk „Copy raw file”), nie przez Terminal.
-- Można uruchomić ponownie. Dla BM nic się nie zmienia.

-- Strażnik kodowania: polskie litery wpisane wprost muszą być równe tym samym literom zapisanym kodami (same znaki ASCII).
-- Gdy plik przeszedł przez Terminal albo zły schowek, litery z pierwszej strony się psują („Ňā”, „√≥”), a kody nie,
-- więc warunek nie przechodzi i plik zatrzymuje się na pierwszej instrukcji, zanim cokolwiek zmieni.
-- Ten blok wklejamy na sam początek każdej nowej migracji (od v44); pilnuje tego tests/migracje.test.js.
do $$ begin
  if 'ąćęłńóśźż' <> U&'\0105\0107\0119\0142\0144\00F3\015B\017A\017C' then
    raise exception 'Polskie znaki doszły zepsute. Skopiuj plik z github.com (Raw), nie przez Terminal.';
  end if;
end $$;

-- ================= Etap 5: plan i kalendarz per rocznik =================
-- Plany wszystkich roczników na hoście plan.skrotbm.pl (CSP strony bez zmian): BM dalej plan.json, inne plan/<rocznik>.json.
alter table public.nauka_roczniki add column if not exists plan_url text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'nauka_roczniki_plan_url_chk') then
    alter table public.nauka_roczniki add constraint nauka_roczniki_plan_url_chk
      check (plan_url is null or plan_url ~ '^https://plan\.skrotbm\.pl/[a-z0-9/._-]+\.json$');
  end if;
end $$;
update public.nauka_roczniki set plan_url = 'https://plan.skrotbm.pl/plan.json' where id = public.nauka_bm() and plan_url is null;
update public.nauka_roczniki set plan_url = 'https://plan.skrotbm.pl/plan/' || id || '.json' where id <> public.nauka_bm() and plan_url is null;
-- nowy rocznik dostaje adres sam (wpis bez plan_url)
create or replace function public.nauka_roczniki_plan_url() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.plan_url is null then
    new.plan_url := case when new.id = public.nauka_bm() then 'https://plan.skrotbm.pl/plan.json' else 'https://plan.skrotbm.pl/plan/' || new.id || '.json' end;
  end if;
  return new;
end $$;
drop trigger if exists nauka_roczniki_plan_url on public.nauka_roczniki;
create trigger nauka_roczniki_plan_url before insert on public.nauka_roczniki for each row execute function public.nauka_roczniki_plan_url();

-- Lista roczników (v31) + adres planu i sekcja Działu Obsługi Studenta wydziału (odwołane zajęcia bez Teams, importer planu).
create or replace function public.nauka_roczniki_lista() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', r.id, 'nabor', r.nabor, 'status', r.status, 'plan_url', r.plan_url,
    'kierunek', jsonb_build_object('id', k.id, 'kod', k.kod, 'pl', k.nazwa_pl, 'en', k.nazwa_en,
                                   'stopien', k.stopien, 'tryb', k.tryb, 'jezyk', k.jezyk),
    'wydzial', jsonb_build_object('kod', w.kod, 'pl', w.nazwa_pl, 'en', w.nazwa_en, 'dos_url', w.dos_url)
  ) order by w.kod, k.nazwa_pl, r.nabor desc), '[]'::jsonb)
  from public.nauka_roczniki r
  join public.nauka_kierunki k on k.id = r.kierunek_id
  join public.nauka_wydzialy w on w.kod = k.wydzial
$$;

create or replace function public.nauka_kalendarz_dane(p_token text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare k public.nauka_kalendarz; prog jsonb; ok boolean;
begin
  select * into k from public.nauka_kalendarz where token = p_token;
  if not found then return null; end if;
  update public.nauka_kalendarz set uzyty_at = now() where user_id = k.user_id;
  ok := exists (select 1 from public.nauka_admini a where a.email = k.email)
     or ((exists (select 1 from public.nauka_dostep d
                 where d.do_kiedy >= current_date and d.rocznik_id = public.nauka_rocznik_uid(k.user_id)
                   and (d.user_id = k.user_id or (k.email <> '' and d.email = k.email)))
             or exists (select 1 from public.nauka_proby p where p.user_id = k.user_id and p.do_kiedy > now()))
         and not exists (select 1 from public.nauka_konta b where b.user_id = k.user_id and b.zablokowane));
  select d.data into prog from public.nauka_docs d where d.kolekcja = 'progress' and d.id = k.user_id::text;
  return jsonb_build_object(
    'platny', ok,
    -- v46: plan rocznika właściciela linku (funkcja kalendarz bierze go zamiast plan.json BM)
    'plan_url', (select r.plan_url from public.nauka_roczniki r where r.id = public.nauka_rocznik_uid(k.user_id)),
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

-- ================= Etap 6: ranking i statystyki po roczniku, Hasło dnia per rocznik =================
-- Ranking, wygląd osób z rankingu, statystyki „Twój kierunek”, rekordy gier i Hasło dnia liczą się w obrębie
-- nauka_profil.rocznik_id (dawniej kod kierunku + rok naboru). Dwa roczniki z tym samym kodem (np. BM stacjonarne
-- i niestacjonarne albo ten sam kod na dwóch wydziałach) się nie mieszają. Zasada „od 5 osób” liczy się w roczniku.
-- Pseudonim unikalny w roczniku. Konto administratora zostaje w BM (profil), więc ranking i statystyki BM bez zmian.
create unique index if not exists nauka_profil_nick_rocznik_uq
  on public.nauka_profil (coalesce(rocznik_id, 'wefiz-bm-1-st-2026'), lower(nick)) where nick is not null;
drop index if exists public.nauka_profil_nick_uq;

create or replace function public.nauka_ranking(p_zakres text default 'tydzien', p_grupa text default null, p_sid text default null)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  c jsonb := public.nauka_rp_cfg();
  v_d date := public.nauka_dzis();
  v_od date; v_do date; me public.nauka_profil; v_moje int; v_out jsonb;
  v_w_grupie boolean := p_grupa is null or coalesce(public.nauka_rp_grupa(auth.uid()) = p_grupa, false);
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_platny() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  if p_zakres = 'semestr' then v_od := (c->>'semestr_od')::date; v_do := v_d;
  else v_od := public.nauka_tydzien(v_d); v_do := v_od + 6; end if;
  select * into me from public.nauka_profil where user_id = auth.uid();
  select coalesce(sum(r.pkt), 0) into v_moje from public.nauka_rp r
   where r.user_id = auth.uid() and r.dzien between v_od and v_do and (p_sid is null or r.sid = p_sid);

  with suma as (
    select r.user_id, sum(r.pkt)::int pkt from public.nauka_rp r
     where r.dzien between v_od and v_do and (p_sid is null or r.sid = p_sid)
     group by r.user_id),
  widoczni as (
    select s.user_id, p.nick, s.pkt from suma s join public.nauka_profil p on p.user_id = s.user_id
     where p.w_rankingu and p.nick is not null and s.pkt > 0
       and coalesce(p.rocznik_id, public.nauka_bm()) = coalesce(me.rocznik_id, public.nauka_bm())   -- v46: rocznik, nie kod kierunku + rok naboru
       and (p_grupa is null or public.nauka_rp_grupa(s.user_id) = p_grupa)
       and not exists (select 1 from public.nauka_konta k where k.user_id = s.user_id and k.zablokowane)
       and not ((c->>'ukryj_adminow')::boolean and public.nauka_rp_admin_uid(s.user_id))),
  miejsca as (
    select w.*, rank() over (order by w.pkt desc) miejsce, row_number() over (order by w.pkt desc, lower(w.nick)) lp
      from widoczni w),
  ja as (select * from miejsca where user_id = auth.uid())
  select jsonb_build_object(
    'ok', true, 'zakres', coalesce(p_zakres, 'tydzien'), 'od', v_od, 'do', v_do, 'grupa', p_grupa, 'sid', p_sid,
    'n', (select count(*) from miejsca),
    'top', coalesce((select jsonb_agg(jsonb_build_object('miejsce', m.miejsce, 'nick', m.nick, 'pkt', m.pkt, 'ja', m.user_id = auth.uid()) order by m.lp)
                     from miejsca m where m.lp <= 10), '[]'::jsonb),
    'sasiedzi', coalesce((select jsonb_agg(jsonb_build_object('miejsce', m.miejsce, 'nick', m.nick, 'pkt', m.pkt, 'ja', m.user_id = auth.uid()) order by m.lp)
                          from miejsca m, ja where m.lp between ja.lp - 2 and ja.lp + 2 and ja.lp > 10), '[]'::jsonb),
    -- „ja”: moje miejsce. Gdy jestem ukryty, liczymy, które miejsce bym miał (inni widzą listę bez mnie).
    -- Gdy filtr grupy to nie moja grupa: tylko moje punkty, bez miejsca.
    'ja', jsonb_build_object(
       'pkt', v_moje,
       'widoczny', exists (select 1 from ja),
       'w_grupie', v_w_grupie,
       'miejsce', case when not v_w_grupie then null
                       else coalesce((select miejsce from ja), case when v_moje > 0 then 1 + (select count(*) from miejsca where pkt > v_moje) end) end,
       'z', case when not v_w_grupie then null
                 else (select count(*) from miejsca) + case when exists (select 1 from ja) or v_moje = 0 then 0 else 1 end end)
  ) into v_out;
  return v_out;
end $$;

create or replace function public.nauka_wyglad(p_nicki text[]) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare c jsonb := public.nauka_rp_cfg(); me public.nauka_profil; v jsonb;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  select * into me from public.nauka_profil where user_id = auth.uid();
  select coalesce(jsonb_object_agg(p.nick, public.nauka_wyglad_osoby(p.user_id)), '{}'::jsonb) into v
    from public.nauka_profil p
   where p.nick = any(coalesce(p_nicki[1:60], '{}'))
     and (p.w_rankingu or p.user_id = auth.uid())
     and coalesce(p.rocznik_id, public.nauka_bm()) = coalesce(me.rocznik_id, public.nauka_bm());
  return jsonb_build_object('ok', true, 'osoby', v, 'ja', public.nauka_wyglad_osoby(auth.uid()));
end $$;

create or replace function public.nauka_profil_ustaw(p_nick text default null, p_w_rankingu boolean default null)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare p public.nauka_profil; blad text; n text;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  perform public.nauka_profil_moj();
  select * into p from public.nauka_profil where user_id = auth.uid() for update;
  if p_nick is not null then
    n := regexp_replace(btrim(p_nick), '\s+', ' ', 'g');
    if p.nick is distinct from n then
      blad := public.nauka_nick_ok(n);
      if blad is not null then return jsonb_build_object('ok', false, 'code', blad); end if;
      if p.nick is not null and p.nick_zmiana is not null and p.nick_zmiana > now() - interval '7 days' then
        return jsonb_build_object('ok', false, 'code', 'nick_za_wczesnie', 'od', p.nick_zmiana + interval '7 days');
      end if;
      if exists (select 1 from public.nauka_profil x where coalesce(x.rocznik_id, public.nauka_bm()) = coalesce(p.rocznik_id, public.nauka_bm())
                 and lower(x.nick) = lower(n) and x.user_id <> p.user_id) then
        return jsonb_build_object('ok', false, 'code', 'nick_zajety');
      end if;
      update public.nauka_profil set nick = n, nick_zmiana = case when p.nick is null then null else now() end,
        updated_at = now() where user_id = p.user_id;
    end if;
  end if;
  if p_w_rankingu is not null then
    if p_w_rankingu and coalesce(n, p.nick) is null then
      return jsonb_build_object('ok', false, 'code', 'nick_brak');
    end if;
    update public.nauka_profil set w_rankingu = p_w_rankingu, updated_at = now() where user_id = p.user_id;
  end if;
  return public.nauka_profil_moj();
end $$;

create or replace function public.nauka_kierunek_stat() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  c jsonb := public.nauka_rp_cfg();
  rk text := public.nauka_moj_rocznik();   -- v46: statystyki tylko z osób tego rocznika
  v_t date := public.nauka_tydzien(public.nauka_dzis());
  v_od timestamptz := (v_t::timestamp at time zone 'Europe/Warsaw');
  v_min_o int := (c->>'min_osob_stat')::int; v_min_a int := (c->>'min_odp_stat')::int;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_platny() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  return jsonb_build_object('ok', true, 'tydzien', v_t,
    'aktywni', (select count(distinct r.user_id) from public.nauka_rp r where r.tydzien = v_t and public.nauka_rocznik_uid(r.user_id) = rk),
    'przedmioty', coalesce((
      select jsonb_agg(jsonb_build_object('sid', x.sid, 'proc', x.proc, 'proc_poprz', x.proc_poprz, 'osob', x.osob, 'odp', x.odp, 'moj_proc', x.moj_proc,
                                          'lepiej_niz', x.lepiej_niz) order by x.proc)
      from (
        select o.sid,
               round(100.0 * avg((o.ok)::int) filter (where o.created_at >= v_od))::int proc,
               round(100.0 * avg((o.ok)::int) filter (where o.created_at < v_od))::int proc_poprz,
               count(distinct o.user_id) filter (where o.created_at >= v_od) osob,
               count(*) filter (where o.created_at >= v_od) odp,
               round(100.0 * avg((o.ok)::int) filter (where o.created_at >= v_od and o.user_id = auth.uid()))::int moj_proc,
               -- odsetek osób z niższą skutecznością niż moja w tym tygodniu (tylko gdy mam ≥ 10 odpowiedzi)
               (select round(100.0 * count(*) filter (where u.p < m.p) / nullif(count(*), 0))::int
                  from (select o2.user_id, avg((o2.ok)::int) p from public.nauka_odp o2
                         where o2.sid = o.sid and o2.created_at >= v_od and public.nauka_rocznik_uid(o2.user_id) = rk group by o2.user_id having count(*) >= 10) u,
                       (select avg((o3.ok)::int) p from public.nauka_odp o3
                         where o3.sid = o.sid and o3.created_at >= v_od and o3.user_id = auth.uid() having count(*) >= 10) m) lepiej_niz
          from public.nauka_odp o
         where o.created_at >= v_od - interval '7 days' and o.sid is not null and public.nauka_rocznik_uid(o.user_id) = rk
         group by o.sid
        having count(distinct o.user_id) filter (where o.created_at >= v_od) >= v_min_o
           and count(*) filter (where o.created_at >= v_od) >= v_min_a) x), '[]'::jsonb),
    'trudne', coalesce((
      select jsonb_agg(jsonb_build_object('mid', y.mid, 'sid', y.sid, 'proc', y.proc, 'odp', y.odp) order by y.proc)
      from (select o.mid, max(o.sid) sid, round(100.0 * avg((o.ok)::int))::int proc, count(*) odp
              from public.nauka_odp o where o.created_at >= v_od - interval '7 days' and public.nauka_rocznik_uid(o.user_id) = rk
             group by o.mid having count(*) >= v_min_a and count(distinct o.user_id) >= v_min_o
             order by avg((o.ok)::int) limit 5) y), '[]'::jsonb));
end $$;

create or replace function public.nauka_rekordy(p_gra text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare c jsonb := public.nauka_rp_cfg(); v_od timestamptz := (public.nauka_tydzien(public.nauka_dzis())::timestamp at time zone 'Europe/Warsaw');
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_platny() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  return jsonb_build_object('ok', true, 'gra', p_gra,
    'top', coalesce((select jsonb_agg(jsonb_build_object('nick', x.nick, 'wynik', x.wynik, 'ja', x.user_id = auth.uid()) order by x.wynik desc, lower(x.nick))
      from (select g.user_id, p.nick, max(g.wynik) wynik from public.nauka_gry g join public.nauka_profil p on p.user_id = g.user_id
             where g.gra = p_gra and g.status = 'ok' and g.start >= v_od and p.w_rankingu and p.nick is not null
               and coalesce(p.rocznik_id, public.nauka_bm()) = public.nauka_moj_rocznik()
               and not exists (select 1 from public.nauka_konta k where k.user_id = g.user_id and k.zablokowane)
               and not ((c->>'ukryj_adminow')::boolean and public.nauka_rp_admin_uid(g.user_id))
             group by g.user_id, p.nick order by max(g.wynik) desc, lower(p.nick) limit 10) x), '[]'::jsonb),
    'moj_tydzien', (select max(g.wynik) from public.nauka_gry g where g.user_id = auth.uid() and g.gra = p_gra and g.status = 'ok' and g.start >= v_od),
    'moj_rekord',  (select max(g.wynik) from public.nauka_gry g where g.user_id = auth.uid() and g.gra = p_gra and g.status = 'ok'));
end $$;

-- Hasło dnia: jedno słowo dziennie na rocznik, z materiałów tego rocznika (dotąd jedno dla wszystkich).
alter table public.nauka_haslo_dni add column if not exists rocznik_id text not null default 'wefiz-bm-1-st-2026' references public.nauka_roczniki (id);
do $$ begin
  if (select array_agg(a.attname::text order by a.attname) from pg_constraint c
        join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
       where c.conrelid = 'public.nauka_haslo_dni'::regclass and c.contype = 'p') is distinct from array['dzien', 'rocznik_id'] then
    execute (select 'alter table public.nauka_haslo_dni drop constraint ' || quote_ident(c.conname)
               from pg_constraint c where c.conrelid = 'public.nauka_haslo_dni'::regclass and c.contype = 'p');
    alter table public.nauka_haslo_dni add constraint nauka_haslo_dni_pkey primary key (dzien, rocznik_id);
  end if;
end $$;

create or replace function public.nauka_haslo_slowo(p_dzien date) returns public.nauka_haslo_dni
language plpgsql security definer set search_path = '' as $$
declare c jsonb := public.nauka_gry2_cfg(); r public.nauka_haslo_dni; rk text := public.nauka_moj_rocznik();  -- v46: słowo dnia per rocznik
begin
  select * into r from public.nauka_haslo_dni where dzien = p_dzien and rocznik_id = rk;
  if found then return r; end if;
  insert into public.nauka_haslo_dni (dzien, rocznik_id, slowo, term, pl, def, sid, mid)
  select p_dzien, rk, upper(t.term), t.term, t.pl, t.def, t.sid, t.mid
    from (select distinct on (upper(btrim(x->>'term')))
                 btrim(x->>'term') term, nullif(btrim(x->>'pl'), '') pl, nullif(btrim(x->>'definition'), '') def,
                 m.data->>'subjectId' sid, m.id mid
            from public.nauka_docs d
            join public.nauka_docs m on m.kolekcja = 'materials' and m.id = d.id and coalesce(m.rocznik_id, public.nauka_bm()) = rk
            cross join lateral jsonb_array_elements(case when jsonb_typeof(d.data->'concepts') = 'array' then d.data->'concepts' else '[]'::jsonb end) x
           where d.kolekcja = 'materialContent'
             and btrim(x->>'term') ~ '^[A-Za-z]+$'
             and char_length(btrim(x->>'term')) between (c->>'haslo_min')::int and (c->>'haslo_max')::int
           order by upper(btrim(x->>'term')), (x->>'definition') is null, m.id) t
   where not exists (select 1 from public.nauka_haslo_dni u where u.slowo = upper(t.term) and u.dzien > p_dzien - 365 and u.rocznik_id = rk)
   order by md5(upper(t.term) || p_dzien::text)
   limit 1
  on conflict (dzien, rocznik_id) do nothing;
  select * into r from public.nauka_haslo_dni where dzien = p_dzien and rocznik_id = rk;
  return r;  -- null, gdy pula jest pusta
end $$;

create or replace function public.nauka_haslo_dzis() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  c jsonb := public.nauka_gry2_cfg(); d date := public.nauka_dzis(); s public.nauka_haslo_dni; g public.nauka_haslo;
  v_koniec boolean; v_stat jsonb; v_seria int; v_d date; rk text := public.nauka_moj_rocznik();  -- v46: statystyki dnia z osób tego rocznika
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  s := public.nauka_haslo_slowo(d);
  if s.dzien is null then return jsonb_build_object('ok', false, 'code', 'no_words'); end if;
  select * into g from public.nauka_haslo where user_id = auth.uid() and dzien = d;
  v_koniec := g.wynik is not null;
  -- seria: kolejne dni z rozwiązanym Hasłem, kończąca się dziś (albo wczoraj, gdy dziś jeszcze nie rozwiązane)
  v_seria := 0; v_d := case when g.wynik > 0 then d else d - 1 end;
  while exists (select 1 from public.nauka_haslo h where h.user_id = auth.uid() and h.dzien = v_d and h.wynik > 0) loop
    v_seria := v_seria + 1; v_d := v_d - 1;
  end loop;
  -- statystyki dnia: tylko po końcu własnej gry i przy ≥ min_osob zakończonych
  if v_koniec then
    select case when count(*) >= (c->>'min_osob')::int then jsonb_build_object(
             'grali', count(*), 'zgadli', count(*) filter (where wynik > 0),
             'rozklad', (select jsonb_agg((select count(*) from public.nauka_haslo x where x.dzien = d and x.wynik = k and public.nauka_rocznik_uid(x.user_id) = rk) order by k)
                           from generate_series(0, (c->>'haslo_proby')::int) k)) end
      into v_stat from public.nauka_haslo where dzien = d and wynik is not null and public.nauka_rocznik_uid(user_id) = rk;
  end if;
  return jsonb_build_object('ok', true, 'dzien', d, 'nr', (select count(*) from public.nauka_haslo_dni x where x.dzien <= d and x.rocznik_id = rk),  -- numer Hasła (od pierwszego dnia gry)
    'dlugosc', char_length(s.slowo), 'sid', s.sid, 'max', (c->>'haslo_proby')::int,
    'proby', coalesce(to_jsonb(g.proby), '[]'::jsonb), 'wzory', coalesce(to_jsonb(g.wzory), '[]'::jsonb),
    -- po 3 nieudanych próbach podpowiedź: definicja z ukrytym słowem
    'podpowiedz', case when coalesce(array_length(g.proby, 1), 0) >= 3 and s.def is not null
                       then regexp_replace(s.def, s.term, repeat('_', char_length(s.term)), 'gi') end,
    'koniec', v_koniec, 'wynik', g.wynik, 'pkt', coalesce(g.pkt, 0), 'seria', coalesce(v_seria, 0),
    'slowo', case when v_koniec then s.term end, 'pl', case when v_koniec then s.pl end,
    'def', case when v_koniec then s.def end, 'mid', case when v_koniec then s.mid end,
    'stat', v_stat);
end $$;

notify pgrst, 'reload schema';
