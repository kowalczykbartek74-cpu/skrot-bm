-- Skrót BM: osobisty kalendarz do telefonu (zajęcia + zaliczenia + zadania).
-- Każda osoba z dostępem dostaje swój tajny link. Link czyta funkcja serwerowa „kalendarz”.
-- Grupa i podgrupa są brane z postępu nauki (to samo, co wybór „Twoja grupa” w aplikacji),
-- więc po zmianie grupy kalendarz sam pokaże nowe zajęcia.
-- Wklej w Supabase → SQL Editor → Run. Można uruchamiać wielokrotnie. Wymaga wcześniej skrot-platnosci.sql.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.nauka_kalendarz (
  user_id     uuid primary key,
  email       text not null default '',
  token       text not null unique,
  created_at  timestamptz not null default now(),
  uzyty_at    timestamptz
);
alter table public.nauka_kalendarz enable row level security;
revoke all on public.nauka_kalendarz from anon, authenticated;
-- brak reguł: tabelę czytają tylko funkcje poniżej

-- Wywołuje strona: zwraca tajny token zalogowanej osoby z dostępem.
-- nowy = true unieważnia stary link (gdy ktoś go udostępnił) i daje nowy.
create or replace function public.nauka_kalendarz_token(nowy boolean default false) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare t text;
begin
  if auth.uid() is null then raise exception 'nie_zalogowany'; end if;
  if not public.nauka_platny() then raise exception 'brak_dostepu'; end if;
  select k.token into t from public.nauka_kalendarz k where k.user_id = auth.uid();
  if t is null or nowy then
    t := encode(extensions.gen_random_bytes(24), 'hex');
    insert into public.nauka_kalendarz (user_id, email, token) values (auth.uid(), public.nauka_email(), t)
      on conflict (user_id) do update set token = excluded.token, email = excluded.email, created_at = now();
  end if;
  return t;
end $$;
revoke all on function public.nauka_kalendarz_token(boolean) from public;
grant execute on function public.nauka_kalendarz_token(boolean) to authenticated;

-- Wywołuje tylko funkcja serwerowa „kalendarz” (kluczem serwerowym): dane do pliku kalendarza dla tokenu.
create or replace function public.nauka_kalendarz_dane(p_token text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare k public.nauka_kalendarz; prog jsonb; ok boolean;
begin
  select * into k from public.nauka_kalendarz where token = p_token;
  if not found then return null; end if;
  update public.nauka_kalendarz set uzyty_at = now() where user_id = k.user_id;
  ok := exists (select 1 from public.nauka_admini a where a.email = k.email)
     or exists (select 1 from public.nauka_dostep d
                where d.do_kiedy >= current_date and (d.user_id = k.user_id or (k.email <> '' and d.email = k.email)));
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
