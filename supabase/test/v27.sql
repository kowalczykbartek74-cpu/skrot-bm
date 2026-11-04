-- Test dla skrot-v27-kalendarz-moje.sql: dane do kalendarza w telefonie z wpisami, własnymi datami i planem.
-- m1@x.pl (opłacony dostęp, test/v14.sql) i m2@x.pl (bez dostępu).
reset role;
insert into public.nauka_kalendarz (user_id, email, token)
select u.id, u.email, 'tok-' || split_part(u.email, '@', 1) from auth.users u where u.email in ('m1@x.pl', 'm2@x.pl')
on conflict (user_id) do update set token = excluded.token;
insert into public.nauka_docs (kolekcja, id, data)
select 'progress', u.id::text, '{"group": "C112", "sub": "A",
  "myEvents": [{"id": "e1", "title": "Nauka z makro", "date": "2026-11-10", "time": "18:00", "kind": "nauka"}],
  "exams": {"ochrona-wlasnosci-intelektualnej-W": {"date": "2026-11-30", "att": []}, "makroekonomia-CW": {"keep": []}},
  "planDays": [{"date": "2026-11-05", "sid": "ochrona-wlasnosci-intelektualnej", "part": "W", "title": "OWI · Industrial property · ok. 31 min", "min": 31}]}'::jsonb
from auth.users u where u.email in ('m1@x.pl', 'm2@x.pl')
on conflict (kolekcja, id) do update set data = excluded.data;
do $$ declare a jsonb := public.nauka_kalendarz_dane('tok-m1'); b jsonb := public.nauka_kalendarz_dane('tok-m2');
begin
  perform test.chk('K1 m1: wpis, własna data OWI 30.11, dzień planu', a->>'platny' = 'true'
    and a #>> '{moje,0,title}' = 'Nauka z makro' and jsonb_array_length(a->'zaliczenia') = 1
    and a #>> '{zaliczenia,0,k}' = 'ochrona-wlasnosci-intelektualnej-W' and a #>> '{zaliczenia,0,date}' = '2026-11-30'
    and a #>> '{plan,0,min}' = '31' and a->>'grupa' = 'C112', a);
  perform test.chk('K2 m2 bez dostępu: puste moje, zaliczenia i plan', b->>'platny' = 'false'
    and b->'moje' = '[]'::jsonb and b->'zaliczenia' = '[]'::jsonb and b->'plan' = '[]'::jsonb, b);
end $$;
select 'OK v27' as wynik;
