-- Testy N1–N6 dla skrot-v51-eaia-przenies.sql (po test/v51-przed.sql i dwóch uruchomieniach migracji).
reset role;
do $$ declare n int; begin
  select count(*) into n from public.nauka_docs where id like 'eaia26-%' and rocznik_id = 'wefiz-eaia-1-st-2026';
  perform test.chk('N1 wszystkie wiersze eaia26 w roczniku EaIA (6)', n = 6, to_jsonb(n));
  select count(*) into n from public.nauka_docs where id like 'eaia26-%' and rocznik_id is distinct from 'wefiz-eaia-1-st-2026';
  perform test.chk('N1 żaden wiersz eaia26 nie został w BM', n = 0, to_jsonb(n));
  perform test.chk('N2 lekcja BM zostaje w BM, treść bez zmian',
    (select rocznik_id = 'wefiz-bm-1-st-2026' and data->>'title' = 'Lekcja BM' from public.nauka_docs where kolekcja = 'materials' and id = 'bm51'), null);
  perform test.chk('N2 treść przeniesionej lekcji bez zmian',
    (select data->>'title' from public.nauka_docs where kolekcja = 'materials' and id = 'eaia26-an-01-functions') = 'Functions', null);
  perform test.chk('N3 wyzwalacz nauka_przed_zapisem znów włączony',
    (select tgenabled = 'O' from pg_trigger where tgrelid = 'public.nauka_docs'::regclass and tgname = 'nauka_przed_zapisem'), null);
end $$;

-- N4: student BM nie widzi już lekcji EaIA, dalej widzi lekcję BM
select test.jako('a@x.pl'); set role authenticated;
do $$ begin
  perform test.chk('N4 student BM: lekcji EaIA nie ma', not exists (select 1 from public.nauka_docs where id like 'eaia26-%'), null);
  perform test.chk('N4 student BM: lekcja BM jest', exists (select 1 from public.nauka_docs where kolekcja = 'materials' and id = 'bm51'), null);
end $$;

-- N5: administrator wgrywa paczkę EaIA (ten sam wiersz z rocznikiem EaIA) – teraz przechodzi i nadpisuje treść
reset role; select test.jako('s@x.pl'); set role authenticated;
insert into public.nauka_docs (kolekcja, id, data, rocznik_id) values
  ('materials', 'eaia26-an-01-functions', '{"subjectId":"analiza-matematyczna","title":"Functions (paczka)"}', 'wefiz-eaia-1-st-2026'),
  ('materials', 'eaia26-finanse-02', '{"subjectId":"finanse","title":"Finance 2"}', 'wefiz-eaia-1-st-2026')
on conflict (kolekcja, id) do update set data = excluded.data, rocznik_id = excluded.rocznik_id;
reset role;
do $$ begin
  perform test.chk('N5 paczka EaIA po v51: stara lekcja nadpisana, nowa dodana, obie w EaIA',
    (select count(*) = 2 from public.nauka_docs where kolekcja = 'materials' and rocznik_id = 'wefiz-eaia-1-st-2026'
      and ((id = 'eaia26-an-01-functions' and data->>'title' = 'Functions (paczka)') or id = 'eaia26-finanse-02')), null);
end $$;

-- N6: zmiana rocznika zwykłym zapisem dalej zatrzymana (v51 nie osłabia wyzwalacza)
select test.jako('s@x.pl'); set role authenticated;
do $$ begin
  begin
    update public.nauka_docs set rocznik_id = 'wefiz-eaia-1-st-2026' where kolekcja = 'materials' and id = 'bm51';
    perform test.chk('N6 zmiana rocznika dalej zatrzymana', false, null);
  exception when others then perform test.chk('N6 zmiana rocznika dalej zatrzymana (inny_rocznik)', sqlerrm like 'inny_rocznik%', jsonb_build_object('e', sqlerrm)); end;
end $$;
reset role;
delete from public.nauka_docs where id like 'eaia26-%' or id = 'bm51';
