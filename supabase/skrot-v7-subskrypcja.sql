-- Skrót BM: plan miesięczny (subskrypcja Stripe 35 zł/mies.) obok rocznego (199 zł).
-- Wymaga wcześniej skrot-platnosci.sql. Można uruchamiać wielokrotnie.
alter table public.nauka_dostep add column if not exists stripe_subscription text;
alter table public.nauka_dostep add column if not exists plan text;
create index if not exists nauka_dostep_sub on public.nauka_dostep (stripe_subscription);

-- nauka_ja zwraca też plan ('rok' | 'miesiac'), żeby strona pokazała „Zarządzaj subskrypcją”.
create or replace function public.nauka_ja() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'email', public.nauka_email(),
    'admin', public.nauka_admin(),
    'platny', public.nauka_platny(),
    'czytelnik', public.nauka_platny(),
    'dostep_do', (select max(d.do_kiedy) from public.nauka_dostep d
                  where d.email = public.nauka_email() or d.user_id = auth.uid()),
    'plan', (select d.plan from public.nauka_dostep d
             where d.email = public.nauka_email() or d.user_id = auth.uid()
             order by d.do_kiedy desc limit 1)
  )
$$;
grant execute on function public.nauka_ja() to authenticated;
