-- Skrót BM v10: dowód zgody na natychmiastowe dostarczenie Treści przed zakupem
-- (utrata prawa odstąpienia, art. 38 ust. 1 pkt 13 ustawy o prawach konsumenta; regulamin § 5).
-- Strona zapisuje zgodę funkcją nauka_zgoda() tuż przed przejściem do płatności Stripe.
-- Datę, konto i e-mail ustawia baza, nie przeglądarka. Wpisów nie da się zmienić ani usunąć z poziomu strony.
-- Uruchom raz w Supabase → SQL Editor. Można uruchamiać ponownie.

create table if not exists public.nauka_zgody (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  email text not null,
  plan text not null check (plan in ('rok', 'miesiac')),
  tresc text not null,
  wersja text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists nauka_zgody_user_idx on public.nauka_zgody (user_id, created_at desc);
create index if not exists nauka_zgody_email_idx on public.nauka_zgody (email, created_at desc);

alter table public.nauka_zgody enable row level security;

-- Czytać może tylko właściciel wpisu i starosta. Brak reguł insert/update/delete:
-- zapis idzie wyłącznie przez funkcję poniżej.
drop policy if exists "zgody czytaj" on public.nauka_zgody;
create policy "zgody czytaj" on public.nauka_zgody for select to authenticated
  using (user_id = auth.uid() or public.nauka_admin());

create or replace function public.nauka_zgoda(p_plan text, p_tresc text, p_wersja text, p_ua text default null)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_id bigint;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'code', 'not_logged_in');
  end if;
  if p_plan not in ('rok', 'miesiac') then
    return jsonb_build_object('ok', false, 'code', 'bad_plan');
  end if;
  insert into public.nauka_zgody (user_id, email, plan, tresc, wersja, user_agent)
  values (auth.uid(), v_email, p_plan, left(coalesce(p_tresc, ''), 2000), left(coalesce(p_wersja, ''), 40), left(p_ua, 400))
  returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

revoke all on function public.nauka_zgoda(text, text, text, text) from public, anon;
grant execute on function public.nauka_zgoda(text, text, text, text) to authenticated;
