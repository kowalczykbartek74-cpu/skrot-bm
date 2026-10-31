-- Testy I1–I5 dla skrot-v18-imie-polecajacego.sql. Uruchamiaj po test/v17.sql (te same konta).
reset role;
insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000000081', 'nowy18@x.pl');
insert into public.nauka_dostep (email, do_kiedy, zrodlo, plan) values ('nowy18@x.pl', current_date + 100, 'stripe', 'rok');
select test.jako('nowy18@x.pl'); set role authenticated;
do $$ begin
  perform test.chk('I1 bez imienia: zle_imie', public.nauka_polec_ustaw('NOWY18')->>'code' = 'zle_imie', null);
  perform test.chk('I2 samo imię (bez nazwiska): zle_imie', public.nauka_polec_ustaw('NOWY18', 'Ania')->>'code' = 'zle_imie', null);
  perform test.chk('I3 imię i nazwisko: ok', public.nauka_polec_ustaw('NOWY18', '  Anna   Nowak ')->>'ok' = 'true', null);
end $$;
do $$ begin
  perform test.chk('I4 imię w stanie, zmiana kodu bez imienia zostawia imię',
    public.nauka_polec_moj()->>'imie' = 'Anna Nowak' and public.nauka_polec_ustaw('NOWA18')->>'ok' = 'true', public.nauka_polec_moj());
end $$;
reset role; select test.jako('star@x.pl'); set role authenticated;
do $$ declare o jsonb;
begin
  select x into o from jsonb_array_elements(public.nauka_admin_polecenia()->'osoby') x where x->>'kod' = 'NOWA18';
  perform test.chk('I5 starosta widzi imię', o->>'imie' = 'Anna Nowak', o);
end $$;
reset role;
do $$ begin raise notice 'WSZYSTKIE TESTY v18 OK'; end $$;
