-- Przed v51: odtworzenie tego, co stało się na produkcji 9.11.2026 (paczki EaIA wgrane, zanim rocznik był w bazie).
-- P1: zapis z rocznikiem, którego nie ma w nauka_roczniki, baza odrzuca (klucz obcy). P2: ten sam zapis bez rocznika
-- (tak ponawiała strona) trafia do rocznika administratora = BM. P3: po dodaniu rocznika paczka z rocznikiem EaIA
-- zatrzymuje się na inny_rocznik, więc bez v51 nie da się jej wgrać.
reset role;
delete from public.nauka_docs where id like 'eaia26-%' or id = 'bm51';
delete from public.nauka_roczniki where id = 'wefiz-eaia-1-st-2026';
select test.jako('s@x.pl'); set role authenticated;
do $$ begin
  begin
    insert into public.nauka_docs (kolekcja, id, data, rocznik_id) values ('materials', 'eaia26-an-01-functions', '{"title":"Functions"}', 'wefiz-eaia-1-st-2026');
    perform test.chk('P1 rocznik spoza bazy: zapis odrzucony', false, null);
  exception when foreign_key_violation then
    perform test.chk('P1 rocznik spoza bazy: zapis odrzucony (klucz obcy, w komunikacie rocznik_id)', sqlerrm like '%rocznik_id%', jsonb_build_object('e', sqlerrm));
  end;
end $$;
insert into public.nauka_docs (kolekcja, id, data) values
  ('materials', 'eaia26-an-01-functions', '{"subjectId":"analiza-matematyczna","title":"Functions"}'),
  ('materialContent', 'eaia26-an-01-functions', '{"quiz":[]}'),
  ('materialSimple', 'eaia26-an-01-functions', '{"parts":[]}'),
  ('materialSimple', 'eaia26-an-01-functions~ez', '{"items":{}}'),
  ('quizWhy', 'eaia26-an-01-functions', '{"items":{}}'),
  ('materialSources', 'eaia26-an-01-functions', '{"items":[]}'),
  ('materials', 'bm51', '{"subjectId":"analiza-matematyczna","title":"Lekcja BM"}');
reset role;
do $$ declare n int; begin
  select count(*) into n from public.nauka_docs where id like 'eaia26-%' and rocznik_id = 'wefiz-bm-1-st-2026';
  perform test.chk('P2 zapis bez rocznika trafił do BM (6 wierszy)', n = 6, to_jsonb(n));
end $$;
insert into public.nauka_roczniki (id, kierunek_id, nabor, status) values ('wefiz-eaia-1-st-2026', 'wefiz-eaia-1-st', 2026, 'oczekujacy') on conflict do nothing;
select test.jako('s@x.pl'); set role authenticated;
do $$ begin
  begin
    insert into public.nauka_docs (kolekcja, id, data, rocznik_id) values ('materials', 'eaia26-an-01-functions', '{"title":"Functions 2"}', 'wefiz-eaia-1-st-2026')
    on conflict (kolekcja, id) do update set data = excluded.data, rocznik_id = excluded.rocznik_id;
    perform test.chk('P3 paczka EaIA zatrzymana przed v51', false, null);
  exception when others then
    perform test.chk('P3 paczka EaIA zatrzymana przed v51 (inny_rocznik)', sqlerrm like 'inny_rocznik%', jsonb_build_object('e', sqlerrm));
  end;
end $$;
reset role;
