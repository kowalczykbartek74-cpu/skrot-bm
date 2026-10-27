-- Skrót BM: okres próbny. Jednorazowo 3 dni pełnego dostępu za darmo, bez karty.
-- Student włącza go sam przyciskiem „Wypróbuj za darmo przez 3 dni” (po zalogowaniu).
-- Wymaga wcześniej skrot-v8-urzadzenia.sql. Można uruchamiać wielokrotnie.
--
-- Jeden okres próbny na konto, na adres e-mail i na urządzenie (nagłówek x-skrot-device),
-- żeby nowy adres na tym samym telefonie nie dawał kolejnych 3 dni.
-- Kto kiedyś miał opłacony dostęp, nie dostaje okresu próbnego.
-- W trakcie okresu próbnego działają te same zasady co przy opłaconym koncie (urządzenia, jedna sesja).

create table if not exists public.nauka_proby (
  user_id    uuid primary key,
  email      text not null unique check (email = lower(email)),
  device_id  text,
  od         timestamptz not null default now(),
  do_kiedy   timestamptz not null
);
create index if not exists nauka_proby_device on public.nauka_proby (device_id);
alter table public.nauka_proby enable row level security;
revoke all on public.nauka_proby from anon, authenticated;

create or replace function public.nauka_proba_dni() returns int language sql immutable as $$ select 3 $$;

-- Trwający okres próbny tej osoby (koniec) albo null.
create or replace function public.nauka_proba_do() returns timestamptz
language sql stable security definer set search_path = '' as $$
  select p.do_kiedy from public.nauka_proby p where p.user_id = auth.uid() and p.do_kiedy > now()
$$;

-- Opłacone konto ALBO trwający okres próbny. Reszta reguł (nauka_platny, AI, Moje materiały) pyta o to.
create or replace function public.nauka_platny_konto() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.nauka_dostep d
                 where d.do_kiedy >= current_date
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
                  where d.email = public.nauka_email() or d.user_id = auth.uid()),
    'plan', (select d.plan from public.nauka_dostep d
             where d.email = public.nauka_email() or d.user_id = auth.uid()
             order by d.do_kiedy desc limit 1),
    -- Koniec okresu próbnego, tylko gdy to on daje dostęp (opłacony dostęp wygrywa).
    'proba_do', case when public.nauka_admin() or exists (
                  select 1 from public.nauka_dostep d
                  where d.do_kiedy >= current_date and (d.email = public.nauka_email() or d.user_id = auth.uid()))
                then null else public.nauka_proba_do() end,
    -- Czy przycisk „Wypróbuj” ma sens: nie było okresu próbnego ani opłaconego dostępu.
    'proba_mozna', not public.nauka_admin()
                   and not exists (select 1 from public.nauka_proby p where p.user_id = auth.uid() or p.email = public.nauka_email())
                   and not exists (select 1 from public.nauka_dostep d where d.email = public.nauka_email() or d.user_id = auth.uid()),
    'proba_dni', public.nauka_proba_dni()
  )
$$;
grant execute on function public.nauka_ja() to authenticated;

-- Włącza okres próbny. Błędy: nie_zalogowany | ma_dostep | wykorzystany | urzadzenie.
create or replace function public.nauka_proba_start() returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  em text := public.nauka_email();
  dev text := public.nauka_urzadzenie_id();
  koniec timestamptz;
begin
  if uid is null or coalesce(em, '') = '' then raise exception 'nie_zalogowany'; end if;
  if public.nauka_admin() or exists (select 1 from public.nauka_dostep d
                                     where d.do_kiedy >= current_date and (d.email = em or d.user_id = uid)) then
    raise exception 'ma_dostep';
  end if;
  if exists (select 1 from public.nauka_proby p where p.user_id = uid or p.email = em)
     or exists (select 1 from public.nauka_dostep d where d.email = em or d.user_id = uid) then
    raise exception 'wykorzystany';
  end if;
  if dev is not null and exists (select 1 from public.nauka_proby p where p.device_id = dev) then
    raise exception 'urzadzenie';
  end if;
  begin
    insert into public.nauka_proby (user_id, email, device_id, do_kiedy)
    values (uid, em, dev, now() + make_interval(days => public.nauka_proba_dni()))
    returning do_kiedy into koniec;
  exception when unique_violation then
    raise exception 'wykorzystany';
  end;
  return jsonb_build_object('do_kiedy', koniec);
end $$;
revoke all on function public.nauka_proba_start() from public, anon;
grant execute on function public.nauka_proba_start() to authenticated;

-- Kalendarz w telefonie: terminy także w okresie próbnym (jak opłacone konto).
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
                                            from public.nauka_docs d where d.kolekcja = 'deadlines'), '[]'::jsonb)
                    else '[]'::jsonb end
  );
end $$;
revoke all on function public.nauka_kalendarz_dane(text) from public, anon, authenticated;
grant execute on function public.nauka_kalendarz_dane(text) to service_role;
