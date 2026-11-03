-- Skrót BM v22: dzisiejsze punkty rankingu w stanie sklepu, żeby strona pokazywała „+1 🪙” od razu po odpowiedzi
-- i pasek „Do następnej monety: 7/10 pkt”. Wklej w Supabase → SQL Editor → Run, po v21. Można uruchomić ponownie.
--
-- Zmienia tylko jedną funkcję: nauka_sklep_stan() zwraca dodatkowo 'dzis_pkt' (suma pkt z nauka_rp za dziś).
-- Reszta odpowiedzi bez zmian. Monety nadal liczy wyłącznie baza (trigger z v14); strona tylko wcześniej je pokazuje,
-- a przy każdym odświeżeniu salda bierze wynik z bazy. Bez tego pliku strona też działa: monety widać po odświeżeniu salda.

create or replace function public.nauka_sklep_stan() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare u uuid := auth.uid();
begin
  if u is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  return jsonb_build_object('ok', true,
    'saldo', public.nauka_saldo(u),
    'dzis_nauka', coalesce((select delta from public.nauka_monety where user_id = u and klucz = 'nauka:' || public.nauka_dzis()::text), 0),
    'dzis_pkt', coalesce((select sum(pkt) from public.nauka_rp where user_id = u and dzien = public.nauka_dzis()), 0)::int,
    'dzis_max', public.nauka_mon_dzis_max(),
    'kurs_pkt', (public.nauka_mon_cfg()->>'kurs_pkt')::int,
    'mozna', public.nauka_rp_mozna(),
    'posiadane', coalesce((select jsonb_agg(item order by created_at) from public.nauka_posiadane where user_id = u), '[]'::jsonb),
    'katalog', public.nauka_sklep_katalog(),
    'zarobione_lacznie', coalesce((select sum(delta) from public.nauka_monety where user_id = u and delta > 0), 0),
    'wydane_lacznie', coalesce((select -sum(delta) from public.nauka_monety where user_id = u and zrodlo = 'zakup'), 0));
end $$;

notify pgrst, 'reload schema';
