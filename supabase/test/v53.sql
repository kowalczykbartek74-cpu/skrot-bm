-- Testy Z1–Z7 dla skrot-v53-proba-przypomnienie.sql (mail przed końcem próby tylko za zgodą). Po test/v52.sql.
reset role;
grant select on public.nauka_proby to service_role;
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000005301', 'z53a@x.pl'), ('00000000-0000-0000-0000-000000005302', 'z53b@x.pl'), ('00000000-0000-0000-0000-000000005303', 'z53c@x.pl')
on conflict do nothing;
insert into public.nauka_proby (user_id, email, do_kiedy) values
  ('00000000-0000-0000-0000-000000005301', 'z53a@x.pl', now() + interval '24 hours'),
  ('00000000-0000-0000-0000-000000005302', 'z53b@x.pl', now() + interval '24 hours'),
  ('00000000-0000-0000-0000-000000005303', 'z53c@x.pl', now() + interval '60 hours')
on conflict (user_id) do update set do_kiedy = excluded.do_kiedy, przypomnij = false, przypomniano_at = null;

-- Z1: domyślnie brak zgody → nikt nie jest kandydatem
set role service_role;
select test.chk('Z1 domyślnie bez zgody: brak kandydatów z53', not exists (select 1 from jsonb_array_elements(public.nauka_proba_kandydaci()->'osoby') e where e->>'email' like 'z53%'), public.nauka_proba_kandydaci());
reset role;

-- Z2: zgoda studenta (przez RPC, z językiem) → kandydat przy do_kiedy = now() + 24 h
select test.jako('z53a@x.pl'); set role authenticated;
select test.chk('Z2 nauka_proba_przypomnij(true, en) → ok', (public.nauka_proba_przypomnij(true, 'en')->>'przypomnij')::boolean, null);
reset role; select test.jako('z53c@x.pl'); set role authenticated;
select test.chk('Z2b zgoda przy końcu za 60 h → ok, ale jeszcze nie kandydat', (public.nauka_proba_przypomnij(true)->>'ok')::boolean, null);
reset role; set role service_role;
do $$ declare k jsonb := public.nauka_proba_kandydaci()->'osoby'; begin
  perform test.chk('Z2 kandydat: z53a (zgoda, koniec za 24 h, jezyk en)', exists (select 1 from jsonb_array_elements(k) e where e->>'email' = 'z53a@x.pl' and e->>'jezyk' = 'en'), k);
  perform test.chk('Z3 bez zgody (z53b) nigdy kandydatem', not exists (select 1 from jsonb_array_elements(k) e where e->>'email' = 'z53b@x.pl'), k);
  perform test.chk('Z4 koniec za 60 h (z53c) jeszcze nie kandydatem', not exists (select 1 from jsonb_array_elements(k) e where e->>'email' = 'z53c@x.pl'), k);
end $$;
-- Z5: po wysłaniu (znacznik) już nie kandydat
select test.chk('Z5 nauka_proba_przypomniano → true', public.nauka_proba_przypomniano('00000000-0000-0000-0000-000000005301'), null);
select test.chk('Z5 po wysłaniu z53a nie jest kandydatem', not exists (select 1 from jsonb_array_elements(public.nauka_proba_kandydaci()->'osoby') e where e->>'email' = 'z53a@x.pl'), null);
reset role;
-- Z6: po zakupie nie kandydat (z53c, przy końcu za 24 h)
update public.nauka_proby set do_kiedy = now() + interval '24 hours' where email = 'z53c@x.pl';
set role service_role;
select test.chk('Z6 przed zakupem z53c (zgoda, 24 h) jest kandydatem', exists (select 1 from jsonb_array_elements(public.nauka_proba_kandydaci()->'osoby') e where e->>'email' = 'z53c@x.pl'), null);
reset role;
insert into public.nauka_dostep (email, do_kiedy, zrodlo, user_id, rocznik_id) values ('z53c@x.pl', current_date + 200, 'stripe', '00000000-0000-0000-0000-000000005303', 'wefiz-bm-1-st-2026')
on conflict (email, rocznik_id) do update set do_kiedy = excluded.do_kiedy;
set role service_role;
select test.chk('Z6 po zakupie z53c nie jest kandydatem', not exists (select 1 from jsonb_array_elements(public.nauka_proba_kandydaci()->'osoby') e where e->>'email' = 'z53c@x.pl'), null);
reset role;
-- Z7: przeglądarka nie wywoła funkcji dla serwera; wyłączenie zgody działa
select test.jako('z53b@x.pl'); set role authenticated;
do $$ begin
  begin perform public.nauka_proba_kandydaci(); perform test.chk('Z7 authenticated nie wywoła nauka_proba_kandydaci', false, null);
  exception when insufficient_privilege then perform test.chk('Z7 authenticated nie wywoła nauka_proba_kandydaci', true, null); end;
  perform test.chk('Z7 nauka_proba_przypomnij(false) → przypomnij false', not (public.nauka_proba_przypomnij(false)->>'przypomnij')::boolean, null);
end $$;
-- Z8: limit dnia: przy wyczerpanym limicie (60 wpisów w logu dziś) nikt nie jest kandydatem; wpis „proba” w logu wyklucza tę osobę
reset role;
update public.nauka_dostep set do_kiedy = current_date - 1 where email = 'z53c@x.pl';
select public.nauka_przypomnienia_log_dodaj('00000000-0000-0000-0000-000000005303', (now() at time zone 'Europe/Warsaw')::date, 'proba');
set role service_role;
select test.chk('Z8 osoba z wpisem w logu dziś (proba) nie jest kandydatem', not exists (select 1 from jsonb_array_elements(public.nauka_proba_kandydaci()->'osoby') e where e->>'email' = 'z53c@x.pl'), null);
select test.chk('Z8 kandydaci zwracają dzien i zostalo', public.nauka_proba_kandydaci() ? 'zostalo' and public.nauka_proba_kandydaci() ? 'dzien', public.nauka_proba_kandydaci());
reset role;
delete from public.nauka_przypomnienia_log where user_id = '00000000-0000-0000-0000-000000005303';
delete from public.nauka_dostep where email = 'z53c@x.pl';
delete from public.nauka_proby where email like 'z53%';
