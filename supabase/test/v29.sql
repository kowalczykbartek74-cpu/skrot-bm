-- Testy W1–W5 dla skrot-v29-powtorki.sql (lekcje v4: pomiar powtórek). Konta w1 (dostęp) i w2 (bez dostępu).
reset role;
insert into auth.users (id, email)
select ('00000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid, e from (values (291,'w1@x.pl'),(292,'w2@x.pl')) v(i, e);
insert into public.nauka_dostep (email, do_kiedy, user_id) select u.email, current_date + 300, u.id from auth.users u where u.email = 'w1@x.pl';
insert into public.nauka_urzadzenia (user_id, device_id, nazwa)
select u.id, '11111111-1111-1111-1111-' || right(u.id::text, 12), 'test' from auth.users u where u.email in ('w1@x.pl','w2@x.pl');
insert into public.nauka_docs (kolekcja, id, data) values ('materials', 'v29mat', '{"subjectId": "makroekonomia", "title": "x"}')
on conflict (kolekcja, id) do update set data = excluded.data;

-- W1 przedmiot z klucza: q:/d:/n: biorą drugi segment, g: przedmiot wprost, stare klucze pierwszy segment
do $$ begin perform test.chk('W1 sid z kluczy v4 i starych',
  public.nauka_rp_klucz_sid('q:v29mat:abc') = 'makroekonomia' and public.nauka_rp_klucz_sid('d:v29mat:a1') = 'makroekonomia'
  and public.nauka_rp_klucz_sid('n:v29mat:s1') = 'makroekonomia' and public.nauka_rp_klucz_sid('v29mat:123') = 'makroekonomia'
  and public.nauka_rp_klucz_sid('g:logistyka:9') = 'logistyka'); end $$;

select test.jako('w1@x.pl'); set role authenticated;
-- W2 cztery argumenty: punkt za powtórkę + wpis w logu (wiek poza zakresem → null)
do $$ declare a jsonb := public.nauka_rp_powtorka('q:v29mat:abc', true, true, 8); b jsonb := public.nauka_rp_powtorka('d:v29mat:a1', false, false, 99999);
begin perform test.chk('W2 4 argumenty: ok', (a->>'ok')::boolean and (b->>'ok')::boolean, jsonb_build_array(a, b)); end $$;
-- W3 stara wersja z jednym argumentem dalej działa (strona sprzed v4)
do $$ declare a jsonb := public.nauka_rp_powtorka('v29mat:123');
begin perform test.chk('W3 1 argument: ok', (a->>'ok')::boolean, a); end $$;
-- W4 tabela logu niedostępna wprost dla ucznia
do $$ begin
  begin perform 1 from public.nauka_powtorki_log; perform test.chk('W4 log niedostępny wprost', false);
  exception when insufficient_privilege then perform test.chk('W4 log niedostępny wprost', true); end;
end $$;
reset role;
do $$ declare u uuid := (select id from auth.users where email = 'w1@x.pl'); n int; s text; w int;
begin
  select count(*), min(sid) into n, s from public.nauka_powtorki_log where user_id = u;
  select wiek into w from public.nauka_powtorki_log where user_id = u and klucz = 'd:v29mat:a1';
  perform test.chk('W2b dwa wpisy z przedmiotem, zły wiek = null', n = 2 and s = 'makroekonomia' and w is null, jsonb_build_object('n', n, 's', s, 'w', w));
end $$;
-- W5 bez dostępu: bez punktów i bez wpisu
select test.jako('w2@x.pl'); set role authenticated;
do $$ declare a jsonb := public.nauka_rp_powtorka('q:v29mat:abc', true, true, 8);
begin perform test.chk('W5 bez dostępu: no_access', a->>'code' = 'no_access', a); end $$;
reset role;
do $$ begin perform test.chk('W5b bez wpisu w logu', not exists (select 1 from public.nauka_powtorki_log l join auth.users u on u.id = l.user_id where u.email = 'w2@x.pl')); end $$;
