-- Przed v46 (część Etapu 6): ranking, wygląd, statystyki kierunku, rekordy i Hasło dnia konta BM i admina.
-- test/v46.sql porówna to samo po migracji (dla BM nic się nie zmienia).
reset role;
create table if not exists test.v46_przed (email text, co text, wynik jsonb, primary key (email, co));
truncate test.v46_przed;
grant insert, select on test.v46_przed to authenticated;
do $$ declare e text; begin
  foreach e in array array['a@x.pl', 'b@x.pl', 's@x.pl'] loop
    perform test.jako(e);
    set local role authenticated;
    insert into test.v46_przed values
      (e, 'ranking-tydzien', public.nauka_ranking('tydzien')), (e, 'ranking-semestr', public.nauka_ranking('semestr')),
      (e, 'ranking-grupa', public.nauka_ranking('semestr', 'C111')), (e, 'wyglad', public.nauka_wyglad(array['Ania', 'Bartek', 'Ola'])),
      (e, 'stat', public.nauka_kierunek_stat()), (e, 'rekordy', public.nauka_rekordy('frun')), (e, 'haslo', public.nauka_haslo_dzis());
    reset role;
  end loop;
  raise notice 'OK v46-przed: % wyników', (select count(*) from test.v46_przed);
end $$;
