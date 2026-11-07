-- Przed v45: nauka_ja() i nauka_platny_konto() kont BM i admina. test/v45.sql sprawdzi, że po migracji są takie same.
reset role;
create table if not exists test.v45_przed (email text primary key, ja jsonb, konto boolean);
truncate test.v45_przed;
grant insert on test.v45_przed to authenticated;
do $$ declare e text; begin
  foreach e in array array['a@x.pl', 'b@x.pl', 'c@x.pl', 's@x.pl', 'st1@x.pl', 'przyp1@x.pl'] loop
    perform test.jako(e);
    set local role authenticated;
    insert into test.v45_przed values (e, public.nauka_ja(), public.nauka_platny_konto());
    reset role;
  end loop;
  raise notice 'OK v45-przed: % kont', (select count(*) from test.v45_przed);
end $$;
