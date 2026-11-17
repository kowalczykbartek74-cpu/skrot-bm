-- Ciąg dalszy testów v60 po trzecim uruchomieniu migracji (S7: zwrot raz, S8: katalog bez dubli).
reset role;
do $$ begin
  perform test.chk('V60 S7 zwrot 600 za gablota:2 (klucz zwrot:gablota:2)', (select sum(delta) from public.nauka_monety where user_id = '00000000-0000-0000-0000-000000006002' and klucz = 'zwrot:gablota:2') = 600, null);
  perform test.chk('V60 S8 trzecie uruchomienie: nagrody 15/17/20 bez dubli', (select count(*) from jsonb_array_elements(public.nauka_sklep_katalog()) where value->>'id' in ('ramka:platynowa','tytul:prezes-roku','ramka:geniusz')) = 3, null);
end $$;
