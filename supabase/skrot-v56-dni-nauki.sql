do $$ begin
  if 'ąćęłńóśźż' <> U&'\0105\0107\0119\0142\0144\00F3\015B\017A\017C' then
    raise exception 'Polskie znaki doszły zepsute. Skopiuj plik z github.com (Raw), nie przez Terminal.';
  end if;
end $$;
-- Skrót v56 (pętla UX-2, etapy 1–2): jedno źródło „dnia nauki” dla serii, zamrożeń i rankingu.
-- Wklej w Supabase → SQL Editor → Run, po v55. Kopiuj z github.com („Copy raw file”), nie przez Terminal. Można uruchomić ponownie.
--
-- Problem: strona liczy serię z XP (każde XP > 0 to dzień nauki, także samo czytanie lekcji bez punktów), a zamrożenie w bazie
-- patrzyło na punkty rankingu (nauka_rp). Dzień z samym czytaniem był dla bazy „opuszczony”, więc zamrożenie mogło się zużyć
-- mimo nauki, a seria na stronie i w bazie mogły się rozjechać.
-- Rozwiązanie: tabela nauka_dni (osoba, dzień). Wpis robią dwa wyzwalacze: zapis postępu (progress.xp.d z XP > 0 i dni z progress.nd,
-- najwyżej 7 dni wstecz) i każdy punkt rankingu. nauka_dzien_nauki (v55) od teraz pyta tę tabelę, więc zamrożenia
-- (nauka_zamrozenie_uzyj_dni), prezent i seria w bazie (nauka_seria_na) liczą dzień nauki tak samo jak strona.
-- Monet, punktów, XP ani starej nauka_zamrozenie_uzyj() to nie zmienia.

create table if not exists public.nauka_dni (
  user_id uuid not null,
  dzien   date not null,
  zrodlo  text not null check (zrodlo in ('xp', 'pkt')),
  at      timestamptz not null default now(),
  primary key (user_id, dzien)
);
alter table public.nauka_dni enable row level security;
revoke all on public.nauka_dni from anon, authenticated;

-- Dzień nauki z dokumentu postępu: progress.xp = { d: dzień od 1.01.2026, n: XP tego dnia }, progress.nd = [dni nauki].
create or replace function public.nauka_dni_z_postepu() returns trigger
language plpgsql security definer set search_path = '' as $$
declare u uuid; dzis date := public.nauka_dzis(); d date; x jsonb;
begin
  if new.kolekcja <> 'progress' or new.id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return null; end if;
  u := new.id::uuid;
  x := new.data->'xp';
  if jsonb_typeof(x) = 'object' and jsonb_typeof(x->'d') = 'number' and coalesce((x->>'n')::numeric, 0) > 0 then
    d := date '2026-01-01' + floor((x->>'d')::numeric)::int;
    if d between dzis - 7 and dzis + 1 then insert into public.nauka_dni (user_id, dzien, zrodlo) values (u, d, 'xp') on conflict do nothing; end if;
  end if;
  if jsonb_typeof(new.data->'nd') = 'array' then
    insert into public.nauka_dni (user_id, dzien, zrodlo)
    select u, date '2026-01-01' + floor(e::text::numeric)::int, 'xp' from jsonb_array_elements(new.data->'nd') e
    where jsonb_typeof(e) = 'number' and date '2026-01-01' + floor(e::text::numeric)::int between dzis - 7 and dzis + 1
    on conflict do nothing;
  end if;
  return null;
end $$;
drop trigger if exists nauka_dni_z_postepu on public.nauka_docs;
create trigger nauka_dni_z_postepu after insert or update on public.nauka_docs
  for each row when (new.kolekcja = 'progress') execute function public.nauka_dni_z_postepu();

-- Każdy punkt rankingu to też dzień nauki.
create or replace function public.nauka_dni_z_rp() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.nauka_dni (user_id, dzien, zrodlo) values (new.user_id, new.dzien, 'pkt') on conflict do nothing;
  return null;
end $$;
drop trigger if exists nauka_dni_z_rp on public.nauka_rp;
create trigger nauka_dni_z_rp after insert on public.nauka_rp for each row execute function public.nauka_dni_z_rp();

-- Uzupełnienie wstecz: dni z punktami i ostatni dzień XP z zapisanych postępów.
insert into public.nauka_dni (user_id, dzien, zrodlo) select distinct user_id, dzien, 'pkt' from public.nauka_rp on conflict do nothing;
insert into public.nauka_dni (user_id, dzien, zrodlo)
select d.id::uuid, date '2026-01-01' + floor((d.data->'xp'->>'d')::numeric)::int, 'xp' from public.nauka_docs d
where d.kolekcja = 'progress' and d.id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and jsonb_typeof(d.data->'xp'->'d') = 'number' and coalesce((d.data->'xp'->>'n')::numeric, 0) > 0
on conflict do nothing;

-- Dzień nauki = wpis w nauka_dni (v55 pytało tylko o punkty rankingu).
create or replace function public.nauka_dzien_nauki(p_user uuid, p_dzien date) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.nauka_dni where user_id = p_user and dzien = p_dzien)
      or exists (select 1 from public.nauka_rp where user_id = p_user and dzien = p_dzien)
$$;

revoke all on function public.nauka_dni_z_postepu(), public.nauka_dni_z_rp(), public.nauka_dzien_nauki(uuid, date) from public, anon, authenticated;

notify pgrst, 'reload schema';
