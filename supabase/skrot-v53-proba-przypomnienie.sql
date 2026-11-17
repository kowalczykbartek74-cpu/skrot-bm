-- Strażnik kodowania: polskie litery wpisane wprost muszą być równe tym samym literom zapisanym kodami (same znaki ASCII).
-- Gdy plik przeszedł przez Terminal albo zły schowek, litery z pierwszej strony się psują („Ňā”, „√≥”), a kody nie,
-- więc warunek nie przechodzi i plik zatrzymuje się na pierwszej instrukcji, zanim cokolwiek zmieni.
-- Ten blok wklejamy na sam początek każdej nowej migracji (od v44); pilnuje tego tests/migracje.test.js.
do $$ begin
  if 'ąćęłńóśźż' <> U&'\0105\0107\0119\0142\0144\00F3\015B\017A\017C' then
    raise exception 'Polskie znaki doszły zepsute. Skopiuj plik z github.com (Raw), nie przez Terminal.';
  end if;
end $$;
-- Skrót v53 (pętla UX-1, etap 3): mail dzień przed końcem okresu próbnego – tylko za zgodą studenta.
-- Wklej w Supabase → SQL Editor → Run, po v52. Kopiuj z github.com („Copy raw file”), nie przez Terminal.
-- Można uruchomić ponownie (drugi raz nic nie zmienia).
--
-- 1. nauka_proby: przypomnij (zgoda z przełącznika w powitaniu próby, domyślnie false), przypomniano_at (kiedy wysłano), jezyk.
-- 2. nauka_proba_przypomnij(p, p_jezyk) – student włącza / wyłącza zgodę dla swojej trwającej próby.
-- 3. nauka_proba_kandydaci(p_teraz) – tylko service_role (funkcja Edge „przypomnienia”): zgoda, jeszcze nie wysłano,
--    koniec próby za 18–30 h, bez opłaconego dostępu, bez innego maila tego dnia; w limicie dnia (limit_dzien z v36,
--    mail „próba” zapisuje się w nauka_przypomnienia_log jak inne). Bez zgody nikt nie jest kandydatem.
-- 4. nauka_proba_przypomniano(p_user) – tylko service_role: znacznik wysłania (drugi mail się nie wyśle).
-- Nic nie nadpisuje (nowe funkcje i kolumny).

alter table public.nauka_proby add column if not exists przypomnij boolean not null default false;
alter table public.nauka_proby add column if not exists przypomniano_at timestamptz;
alter table public.nauka_proby add column if not exists jezyk text not null default 'pl';
do $$ begin
  alter table public.nauka_proby add constraint nauka_proby_jezyk check (jezyk in ('pl', 'en'));
exception when duplicate_object then null; end $$;

create or replace function public.nauka_proba_przypomnij(p boolean, p_jezyk text default null) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare r public.nauka_proby;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'nie_zalogowany'); end if;
  update public.nauka_proby set przypomnij = coalesce(p, false),
         jezyk = case when p_jezyk in ('pl', 'en') then p_jezyk else jezyk end
   where user_id = auth.uid() and do_kiedy > now()
   returning * into r;
  if not found then return jsonb_build_object('ok', false, 'code', 'brak_proby'); end if;
  return jsonb_build_object('ok', true, 'przypomnij', r.przypomnij, 'do_kiedy', r.do_kiedy);
end $$;
revoke all on function public.nauka_proba_przypomnij(boolean, text) from public, anon;
grant execute on function public.nauka_proba_przypomnij(boolean, text) to authenticated;

create or replace function public.nauka_proba_kandydaci(p_teraz timestamptz default now()) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  cfg jsonb := public.nauka_przypomnienia_cfg();
  d date := (p_teraz at time zone 'Europe/Warsaw')::date;
  wyslane int; zostalo int; osoby jsonb;
begin
  -- Ten sam limit dnia co zwykłe przypomnienia (doba UTC, jak licznik Resend); mail „próba” też ląduje w nauka_przypomnienia_log.
  select count(*) into wyslane from public.nauka_przypomnienia_log l
   where l.kanal = 'email' and l.wyslano_at >= date_trunc('day', p_teraz at time zone 'UTC') at time zone 'UTC';
  zostalo := greatest(0, (cfg->>'limit_dzien')::int - wyslane);
  select coalesce(jsonb_agg(o order by o->>'do_kiedy'), '[]'::jsonb) into osoby from (
    select jsonb_build_object('user_id', p.user_id, 'email', p.email, 'do_kiedy', p.do_kiedy, 'jezyk', p.jezyk) o
    from public.nauka_proby p
    where p.przypomnij and p.przypomniano_at is null
      and p.do_kiedy between p_teraz + interval '18 hours' and p_teraz + interval '30 hours'
      and not exists (select 1 from public.nauka_dostep x where x.do_kiedy >= d and (x.user_id = p.user_id or x.email = p.email))
      and not exists (select 1 from public.nauka_przypomnienia_log l where l.user_id = p.user_id and l.dzien = d)
    order by p.do_kiedy
    limit zostalo) q;
  return jsonb_build_object('ok', true, 'dzien', d, 'zostalo', zostalo, 'osoby', osoby);
end $$;
create or replace function public.nauka_proba_przypomniano(p_user uuid) returns boolean
language sql volatile security definer set search_path = '' as $$
  update public.nauka_proby set przypomniano_at = now() where user_id = p_user and przypomniano_at is null returning true
$$;
revoke all on function public.nauka_proba_kandydaci(timestamptz), public.nauka_proba_przypomniano(uuid) from public, anon, authenticated;
grant execute on function public.nauka_proba_kandydaci(timestamptz), public.nauka_proba_przypomniano(uuid) to service_role;
