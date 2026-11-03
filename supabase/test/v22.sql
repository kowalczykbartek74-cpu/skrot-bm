-- Testy W1–W3 dla skrot-v22-monety-widoczne.sql (po v14 i jego testach; konta m1/m2 z test/v14.sql).
-- Tylko lokalnie, na atrapie z test/stub.sql. Każdy test kończy się „OK …”; pierwszy błąd przerywa plik.

reset role;
-- ---------- W1 dzis_pkt = suma dzisiejszych pkt z nauka_rp; reszta odpowiedzi bez zmian ----------
select test.jako('m1@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_sklep_stan(); want int;
begin
  reset role;
  select coalesce(sum(pkt), 0) into want from public.nauka_rp where user_id = (select id from auth.users where email = 'm1@x.pl') and dzien = public.nauka_dzis();
  perform test.chk('W1 nauka_sklep_stan: dzis_pkt = suma dzisiejszych pkt, dzis_nauka = dzis_pkt / 10, stare pola są',
    (r->>'ok')::boolean and (r->>'dzis_pkt')::int = want and want > 0 and (r->>'dzis_nauka')::int = want / 10
    and r ? 'saldo' and r ? 'dzis_max' and r ? 'kurs_pkt' and r ? 'mozna' and r ? 'posiadane' and r ? 'katalog'
    and r ? 'zarobione_lacznie' and r ? 'wydane_lacznie', jsonb_build_object('r', r, 'want', want));
end $$;

-- ---------- W2 kolejne 7 pkt: dzis_pkt rośnie o 7, moneta dopiero przy pełnej dziesiątce ----------
reset role;
do $$ declare u uuid := (select id from auth.users where email = 'm1@x.pl'); p0 int; s0 int; p1 int; s1 int;
begin
  select coalesce(sum(pkt), 0) into p0 from public.nauka_rp where user_id = u and dzien = public.nauka_dzis();
  s0 := public.nauka_saldo(u);
  perform public.nauka_rp_dodaj(u, 'quiz', 'q:w2:' || g, 'makro', 1) from generate_series(1, 7) g;
  select coalesce(sum(pkt), 0) into p1 from public.nauka_rp where user_id = u and dzien = public.nauka_dzis();
  s1 := public.nauka_saldo(u);
  perform test.chk('W2 7 pkt z quizu: pkt +7, saldo rośnie o (pkt/10 po) − (pkt/10 przed)',
    p1 = p0 + 7 and s1 - s0 = p1 / 10 - p0 / 10, jsonb_build_array(p0, p1, s0, s1));
end $$;

-- ---------- W3 konto bez punktów dziś: dzis_pkt = 0 ----------
select test.jako('m2@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_sklep_stan();
begin
  perform test.chk('W3 konto bez punktów dziś: dzis_pkt = 0', (r->>'ok')::boolean and (r->>'dzis_pkt')::int = 0, r);
end $$;
reset role;
do $$ begin raise notice 'OK v22: W1–W3'; end $$;
