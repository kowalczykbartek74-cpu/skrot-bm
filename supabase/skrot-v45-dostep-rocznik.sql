-- Skrót v45: dostęp i płatność per rocznik (spec „Fundament pod inne kierunki”, Etap 4).
-- Wklej w Supabase → SQL Editor → Run, po v44. Kopiuj z github.com (przycisk „Copy raw file”), nie przez Terminal.
-- Można uruchomić ponownie. Dla BM nic się nie zmienia: wszystkie dotychczasowe dostępy (także karnety bez rocznika) = BM.
--
-- 1. nauka_dostep: rocznik_id (kolumna z v38) not null, domyślnie BM; klucz główny (email, rocznik_id) zamiast email.
--    Jeden zakup = dostęp do jednego rocznika (decyzja D2), te same ceny i Payment Links.
-- 2. nauka_platny_konto(), nauka_ja() (dostep_do, plan) i kalendarz (nauka_kalendarz_dane) patrzą na rocznik osoby
--    (nauka_moj_rocznik / nauka_rocznik_uid z v44). Okres próbny jak dotąd (osoba jest w jednym roczniku).
-- 3. Karnety (v38) na rocznik: wydanie bez rocznika = rocznik z profilu konta (bez konta BM), cofnięcie po e-mailu
--    (wszystkie aktywne karnety osoby) albo po e-mailu i roczniku.
-- 4. nauka_rocznik_do_kupienia(rocznik): tylko rocznik ze statusem 'platny' (strona przed płatnością, webhook Stripe).
-- Bez zmian, bo działają na „jakikolwiek wiersz osoby” i dla BM dają to samo: polecenia (v17), lejek (v35, v38),
-- paczka (v37), aktywność (v11), okres próbny (v16: kto płacił, nie dostaje próby), wybór rocznika (v31),
-- usuwanie konta (v32: kasuje wszystkie wiersze osoby po e-mailu i koncie).

-- Strażnik kodowania: polskie litery wpisane wprost muszą być równe tym samym literom zapisanym kodami (same znaki ASCII).
-- Gdy plik przeszedł przez Terminal albo zły schowek, litery z pierwszej strony się psują („Ňā”, „√≥”), a kody nie,
-- więc warunek nie przechodzi i plik zatrzymuje się na pierwszej instrukcji, zanim cokolwiek zmieni.
-- Ten blok wklejamy na sam początek każdej nowej migracji (od v44); pilnuje tego tests/migracje.test.js.
do $$ begin
  if 'ąćęłńóśźż' <> U&'\0105\0107\0119\0142\0144\00F3\015B\017A\017C' then
    raise exception 'Polskie znaki doszły zepsute. Skopiuj plik z github.com (Raw), nie przez Terminal.';
  end if;
end $$;

-- ---------- 1) rocznik w nauka_dostep, klucz (email, rocznik_id) ----------
alter table public.nauka_dostep add column if not exists rocznik_id text;
update public.nauka_dostep set rocznik_id = public.nauka_bm() where rocznik_id is null;
alter table public.nauka_dostep alter column rocznik_id set default 'wefiz-bm-1-st-2026';
alter table public.nauka_dostep alter column rocznik_id set not null;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'nauka_dostep_rocznik_fk') then
    alter table public.nauka_dostep add constraint nauka_dostep_rocznik_fk foreign key (rocznik_id) references public.nauka_roczniki (id);
  end if;
  -- klucz główny: (email) → (email, rocznik_id); drugie uruchomienie nic nie zmienia
  if (select array_agg(a.attname::text order by a.attname) from pg_constraint c
        join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
       where c.conrelid = 'public.nauka_dostep'::regclass and c.contype = 'p') is distinct from array['email', 'rocznik_id'] then
    execute (select 'alter table public.nauka_dostep drop constraint ' || quote_ident(c.conname)
               from pg_constraint c where c.conrelid = 'public.nauka_dostep'::regclass and c.contype = 'p');
    alter table public.nauka_dostep add constraint nauka_dostep_pkey primary key (email, rocznik_id);
  end if;
end $$;
create index if not exists nauka_dostep_user_idx on public.nauka_dostep (user_id);

-- ---------- 2) czy rocznik da się kupić ----------
create or replace function public.nauka_rocznik_do_kupienia(p_rocznik text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.nauka_roczniki r where r.id = p_rocznik and r.status = 'platny')
$$;
revoke all on function public.nauka_rocznik_do_kupienia(text) from public;
grant execute on function public.nauka_rocznik_do_kupienia(text) to anon, authenticated, service_role;

-- ---------- 3) dostęp do rocznika osoby ----------
create or replace function public.nauka_platny_konto() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.nauka_dostep d
                 where d.do_kiedy >= current_date and d.rocznik_id = public.nauka_moj_rocznik()
                   and (d.email = public.nauka_email() or d.user_id = auth.uid()))
      or public.nauka_proba_do() is not null
$$;

create or replace function public.nauka_ja() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'email', public.nauka_email(),
    'admin', public.nauka_admin(),
    'platny', public.nauka_platny(),
    'czytelnik', public.nauka_platny(),
    'platny_konto', public.nauka_admin() or public.nauka_platny_konto(),
    'dostep_do', (select max(d.do_kiedy) from public.nauka_dostep d
                  where (d.email = public.nauka_email() or d.user_id = auth.uid()) and d.rocznik_id = public.nauka_moj_rocznik()),
    'plan', (select d.plan from public.nauka_dostep d
             where (d.email = public.nauka_email() or d.user_id = auth.uid()) and d.rocznik_id = public.nauka_moj_rocznik()
             order by d.do_kiedy desc limit 1),
    -- Koniec okresu próbnego, tylko gdy to on daje dostęp (opłacony dostęp wygrywa).
    'proba_do', case when public.nauka_admin() or exists (
                  select 1 from public.nauka_dostep d
                  where d.do_kiedy >= current_date and d.rocznik_id = public.nauka_moj_rocznik()
                    and (d.email = public.nauka_email() or d.user_id = auth.uid()))
                then null else public.nauka_proba_do() end,
    -- Czy przycisk „Wypróbuj” ma sens: nie było okresu próbnego ani opłaconego dostępu.
    'proba_mozna', not public.nauka_admin()
                   and not exists (select 1 from public.nauka_proby p where p.user_id = auth.uid() or p.email = public.nauka_email())
                   and not exists (select 1 from public.nauka_dostep d where d.email = public.nauka_email() or d.user_id = auth.uid()),
    'proba_dni', public.nauka_proba_dni()
  )
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

-- ---------- 4) karnety (v38) na rocznik ----------
create or replace function public.nauka_admin_karnet_wydaj(p_email text, p_do date, p_rocznik text default null, p_powod text default null) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  em text := lower(trim(coalesce(p_email, '')));
  pw text := nullif(trim(coalesce(p_powod, '')), '');
  rk text := nullif(trim(coalesce(p_rocznik, '')), '');
  t date := (now() at time zone 'Europe/Warsaw')::date;
  cur public.nauka_dostep; uid uuid; nowy boolean;
begin
  if not public.nauka_admin() then return jsonb_build_object('ok', false, 'code', 'not_admin'); end if;
  if em !~ '^[^@\s]+@[^@\s]+\.[a-z]{2,}$' or length(em) > 254 then return jsonb_build_object('ok', false, 'code', 'email'); end if;
  if p_do is null or p_do < t or p_do > t + 400 then return jsonb_build_object('ok', false, 'code', 'data'); end if;
  if rk is not null and not exists (select 1 from public.nauka_roczniki r where r.id = rk) then return jsonb_build_object('ok', false, 'code', 'rocznik'); end if;
  if pw is null or length(pw) < 3 or length(pw) > 200 then return jsonb_build_object('ok', false, 'code', 'powod'); end if;
  -- v45: karnet jest na rocznik (bez rocznika: rocznik z profilu konta, a bez konta BM)
  select u.id into uid from auth.users u where lower(u.email) = em limit 1;
  rk := coalesce(rk, (select p.rocznik_id from public.nauka_profil p where p.user_id = uid), public.nauka_bm());
  select * into cur from public.nauka_dostep d where d.email = em and d.rocznik_id = rk for update;
  if found and coalesce(cur.zrodlo, '') <> 'karnet' and cur.do_kiedy >= current_date then
    return jsonb_build_object('ok', false, 'code', 'ma_dostep', 'do_kiedy', cur.do_kiedy, 'zrodlo', cur.zrodlo, 'rocznik_id', rk);
  end if;
  nowy := not found;
  insert into public.nauka_dostep as d (email, do_kiedy, zrodlo, user_id, rocznik_id, powod, wydal, wydano_at, cofniety_at)
  values (em, p_do, 'karnet', uid, rk, pw, public.nauka_email(), now(), null)
  on conflict (email, rocznik_id) do update set do_kiedy = excluded.do_kiedy, zrodlo = 'karnet', user_id = coalesce(excluded.user_id, d.user_id),
    rocznik_id = excluded.rocznik_id, powod = excluded.powod, wydal = excluded.wydal, wydano_at = excluded.wydano_at, cofniety_at = null;
  return jsonb_build_object('ok', true, 'email', em, 'do_kiedy', p_do, 'nowy', nowy, 'konto', uid is not null, 'rocznik_id', rk);
end $$;

drop function if exists public.nauka_admin_karnet_cofnij(text);
-- Cofa karnet (tylko źródło 'karnet'). Bez rocznika: wszystkie aktywne karnety osoby. Błędy: not_admin | brak | nie_karnet | juz_cofniety.
create or replace function public.nauka_admin_karnet_cofnij(p_email text, p_rocznik text default null) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare em text := lower(trim(coalesce(p_email, ''))); rk text := nullif(trim(coalesce(p_rocznik, '')), ''); n int;
begin
  if not public.nauka_admin() then return jsonb_build_object('ok', false, 'code', 'not_admin'); end if;
  perform 1 from public.nauka_dostep d where d.email = em and (rk is null or d.rocznik_id = rk) for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'brak'); end if;
  if not exists (select 1 from public.nauka_dostep d where d.email = em and (rk is null or d.rocznik_id = rk) and coalesce(d.zrodlo, '') = 'karnet') then
    return jsonb_build_object('ok', false, 'code', 'nie_karnet',
      'zrodlo', (select d.zrodlo from public.nauka_dostep d where d.email = em and (rk is null or d.rocznik_id = rk) order by d.do_kiedy desc limit 1));
  end if;
  update public.nauka_dostep set do_kiedy = least(do_kiedy, current_date - 1), cofniety_at = now()
   where email = em and (rk is null or rocznik_id = rk) and coalesce(zrodlo, '') = 'karnet' and cofniety_at is null;
  get diagnostics n = row_count;
  if n = 0 then return jsonb_build_object('ok', false, 'code', 'juz_cofniety'); end if;
  return jsonb_build_object('ok', true, 'email', em, 'cofniete', n);
end $$;
revoke execute on function public.nauka_admin_karnet_cofnij(text, text) from public, anon;
grant execute on function public.nauka_admin_karnet_cofnij(text, text) to authenticated;

notify pgrst, 'reload schema';
