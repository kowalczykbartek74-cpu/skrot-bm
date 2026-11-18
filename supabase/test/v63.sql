-- Testy dla skrot-v63-ranking-grupy.sql (po dwóch uruchomieniach v63). G1–G5.
reset role;
insert into auth.users (id, email)
select ('00000000-0000-0000-0000-0000000063' || lpad(i::text, 2, '0'))::uuid, 'g63-' || i || '@x.pl' from generate_series(1, 6) i on conflict do nothing;
insert into public.nauka_profil (user_id, rocznik_id)
select u.id, 'wefiz-test-1-st-2026' from auth.users u where u.email like 'g63-%' on conflict (user_id) do update set rocznik_id = excluded.rocznik_id;
insert into public.nauka_dostep (email, do_kiedy, user_id, rocznik_id)
select u.email, current_date + 300, u.id, 'wefiz-test-1-st-2026' from auth.users u where u.email like 'g63-%' on conflict do nothing;
insert into public.nauka_urzadzenia (user_id, device_id, nazwa)
select u.id, '11111111-1111-1111-1111-' || right(u.id::text, 12), 'test' from auth.users u where u.email like 'g63-%' on conflict do nothing;
-- grupy: g63-1..3 → T1, g63-4..5 → T2, g63-6 → T1 bez punktów (nieaktywny)
insert into public.nauka_docs (kolekcja, id, data)
select 'progress', u.id::text, jsonb_build_object('group', case when right(u.email, 7) in ('-4@x.pl', '-5@x.pl') then 'T2' else 'T1' end)
from auth.users u where u.email like 'g63-%' on conflict (kolekcja, id) do update set data = excluded.data;
insert into public.nauka_rp (user_id, dzien, tydzien, zrodlo, klucz, pkt)
select u.id, public.nauka_dzis(), public.nauka_tydzien(public.nauka_dzis()), 'quiz', 'q:g63', p
from (values ('g63-1@x.pl', 10), ('g63-2@x.pl', 20), ('g63-3@x.pl', 30), ('g63-4@x.pl', 40), ('g63-5@x.pl', 50)) v(e, p) join auth.users u on u.email = v.e;

select test.jako('g63-1@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_ranking_grupy('tydzien'); t1 jsonb; t2 jsonb; begin
  select x into t1 from jsonb_array_elements(r->'grupy') x where x->>'grupa' = 'T1';
  select x into t2 from jsonb_array_elements(r->'grupy') x where x->>'grupa' = 'T2';
  perform test.chk('G1 ok, moja grupa T1', (r->>'ok')::boolean and r->>'moja' = 'T1', r);
  perform test.chk('G2 T1: 3 aktywne (bez osoby bez punktów), średnia 20', (t1->>'aktywne')::int = 3 and (t1->>'srednia')::int = 20, t1);
  perform test.chk('G3 T2: 2 aktywne → bez średniej (za mało osób)', (t2->>'aktywne')::int = 2 and t2->'srednia' = 'null'::jsonb, t2);
  perform test.chk('G4 tylko grupy tego rocznika (bez C111/C112 z BM), bez nicków i adresów', jsonb_array_length(r->'grupy') = 2 and r::text not like '%@%', r);
end $$;
reset role;
select test.jako('c@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_ranking_grupy(); begin perform test.chk('G5 bez dostępu → no_access', r->>'code' = 'no_access', r); end $$;
reset role;
