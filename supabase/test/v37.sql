-- Testy K1–K14 dla skrot-v37-paczka.sql (po test/v36.sql).
-- Osoby: ola (BM 2026, dostęp), kuba (inny rocznik: wefiz-zarz-1-st-2026 z test/v31.sql, dostęp), ewa (bez dostępu),
-- 6 osób do sprawdzenia limitu 8 i jedna dziewiąta. Tydzień liczymy względem dzisiejszego dnia (czas polski):
-- duet rozliczamy za MINIONY tydzień (7 pełnych dni), więc test nie zależy od dnia tygodnia.
reset role;
grant execute on function test.chk(text, boolean, jsonb) to anon, authenticated, service_role;
alter role service_role bypassrls;
create table if not exists test.k37 (k text primary key, v text);
grant select, insert, update on test.k37 to authenticated;
insert into auth.users (id, email)
select ('00000000-0000-0000-0000-0000000037' || lpad(i::text, 2, '0'))::uuid, e
from (values (1,'ola37@x.pl'),(2,'kuba37@x.pl'),(3,'ewa37@x.pl'),(4,'o4@x.pl'),(5,'o5@x.pl'),(6,'o6@x.pl'),(7,'o7@x.pl'),(8,'o8@x.pl'),(9,'o9@x.pl'),(10,'o10@x.pl')) v(i, e)
on conflict do nothing;
insert into public.nauka_dostep (email, do_kiedy, user_id) select u.email, current_date + 300, u.id from auth.users u
 where u.email in ('ola37@x.pl','kuba37@x.pl','o4@x.pl') on conflict do nothing;
insert into public.nauka_urzadzenia (user_id, device_id, nazwa)
select u.id, '11111111-1111-1111-1111-' || right(u.id::text, 12), 'test' from auth.users u where u.email like '%37@x.pl' or u.email ~ '^o[0-9]+@x\.pl$'
on conflict do nothing;
insert into public.nauka_kierunki (id, wydzial, kod, nazwa_pl, stopien, tryb) values ('wefiz-zarz-1-st', 'WEFiZ', 'ZARZ', 'Zarządzanie', 1, 'st') on conflict (id) do nothing;
insert into public.nauka_roczniki (id, kierunek_id, nabor) values ('wefiz-zarz-1-st-2026', 'wefiz-zarz-1-st', 2026) on conflict (id) do nothing;
insert into public.nauka_profil (user_id, kierunek, rocznik, nick, rocznik_id) values
  ('00000000-0000-0000-0000-000000003701', 'BM', 2026, 'Ola37', 'wefiz-bm-1-st-2026'),
  ('00000000-0000-0000-0000-000000003702', 'ZARZ', 2026, 'Kuba37', 'wefiz-zarz-1-st-2026'),
  ('00000000-0000-0000-0000-000000003703', 'BM', 2026, 'Ewa37', 'wefiz-bm-1-st-2026')
on conflict (user_id) do update set nick = excluded.nick, rocznik_id = excluded.rocznik_id, kierunek = excluded.kierunek;
-- punkty rankingu ola i kuba (żeby ranking i statystyki miały co pokazać)
insert into public.nauka_rp (user_id, zrodlo, klucz, sid, pkt, dzien, tydzien)
select u, 'quiz', 'q:k37:' || u::text, 'makro', 10, public.nauka_dzis(), public.nauka_tydzien(public.nauka_dzis())
from unnest(array['00000000-0000-0000-0000-000000003701'::uuid, '00000000-0000-0000-0000-000000003702'::uuid]) u
on conflict do nothing;

-- K1: anon nic; zalogowany nie czyta tabel wprost i nie woła funkcji wewnętrznych
set role anon;
do $$ begin
  begin perform public.nauka_paczka(); perform test.chk('K1 anon nie woła nauka_paczka', false, null);
  exception when insufficient_privilege then perform test.chk('K1 anon nie woła nauka_paczka', true, null); end;
  begin perform count(*) from public.nauka_paczki; perform test.chk('K1 anon nie czyta paczek', false, null);
  exception when insufficient_privilege then perform test.chk('K1 anon nie czyta paczek', true, null); end;
end $$;
reset role;
select test.jako('ola37@x.pl'); set role authenticated;
do $$ begin
  begin perform count(*) from public.nauka_paczka_czlonkowie; perform test.chk('K1 zalogowany nie czyta członków wprost', false, null);
  exception when insufficient_privilege then perform test.chk('K1 zalogowany nie czyta członków wprost', true, null); end;
  begin perform count(*) from public.nauka_duety; perform test.chk('K1 zalogowany nie czyta duetów wprost', false, null);
  exception when insufficient_privilege then perform test.chk('K1 zalogowany nie czyta duetów wprost', true, null); end;
  begin perform public.nauka_duet_rozlicz(gen_random_uuid(), current_date); perform test.chk('K1 zalogowany nie rozlicza duetu', false, null);
  exception when insufficient_privilege then perform test.chk('K1 zalogowany nie rozlicza duetu', true, null); end;
end $$;

-- K2: bez paczki → paczka null; zakładam → kod 6 znaków, jestem właścicielem; drugi raz → juz_w_paczce
do $$ declare a jsonb := public.nauka_paczka(); b jsonb; c jsonb;
begin
  perform test.chk('K2 bez paczki', (a->>'ok')::boolean and a->'paczka' = 'null'::jsonb and (a->'cfg'->>'max_osob')::int = 8, a);
  b := public.nauka_paczka_zaloz();
  perform test.chk('K2 założona', b #>> '{paczka,kod}' ~ '^[A-Z0-9]{6}$' and (b #>> '{paczka,wlasciciel}')::boolean
    and jsonb_array_length(b #> '{paczka,czlonkowie}') = 1, b);
  c := public.nauka_paczka_zaloz();
  perform test.chk('K2 druga paczka → juz_w_paczce', c->>'code' = 'juz_w_paczce', c);
  insert into test.k37 values ('kod', b #>> '{paczka,kod}') on conflict (k) do update set v = excluded.v;
end $$;
reset role;

-- K3: kuba (inny rocznik) widzi podgląd i dołącza kodem wpisanym małymi literami z myślnikiem; zły kod → zly_kod / nie_ma
select test.jako('kuba37@x.pl'); set role authenticated;
do $$ declare kd text := (select v from test.k37 where k = 'kod'); a jsonb; b jsonb; c jsonb; d jsonb;
begin
  a := public.nauka_paczka_podglad(lower(left(kd, 3) || '-' || right(kd, 3)));
  perform test.chk('K3 podgląd: 1 osoba, nie pełna, właścicielka Ola37', (a->>'ok')::boolean and (a->>'osob')::int = 1 and not (a->>'pelna')::boolean
    and a->>'wlasciciel_nick' = 'Ola37' and not (a->>'moja')::boolean, a);
  b := public.nauka_paczka_podglad('ab');
  c := public.nauka_paczka_dolacz('ZZZZZZ');
  perform test.chk('K3 zły kod / nie ma', b->>'code' = 'zly_kod' and c->>'code' = 'nie_ma', jsonb_build_array(b, c));
  d := public.nauka_paczka_dolacz(lower(kd));
  perform test.chk('K3 kuba w paczce (2 osoby)', (d->>'ok')::boolean and jsonb_array_length(d #> '{paczka,czlonkowie}') = 2 and not (d #>> '{paczka,wlasciciel}')::boolean, d);
end $$;
reset role;
select test.jako('ewa37@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_paczka_dolacz((select v from test.k37 where k = 'kod'));
begin perform test.chk('K3 ewa (bez dostępu) też może dołączyć', jsonb_array_length(r #> '{paczka,czlonkowie}') = 3, r); end $$;
reset role;

-- K4: zdarzenia nauki: ola dziś i w minionym tygodniu, kuba w minionym tygodniu; ranking i statystyki przed duetem
insert into public.nauka_zdarzenia (user_id, klient_id, typ, kiedy, dane)
select '00000000-0000-0000-0000-000000003701', gen_random_uuid(), 'activity', (public.nauka_dzis()::timestamp + interval '1 minute') at time zone 'Europe/Warsaw', '{"kind":"quiz"}';
insert into public.nauka_zdarzenia (user_id, klient_id, typ, kiedy, dane)
values ('00000000-0000-0000-0000-000000003702', gen_random_uuid(), 'profile_test', now(), '{}');  -- test „Jak się uczysz?” to nie nauka
select test.jako('ola37@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_paczka(); o jsonb; kb jsonb;
begin
  select x into o from jsonb_array_elements(r #> '{paczka,czlonkowie}') x where x->>'nick' = 'Ola37';
  select x into kb from jsonb_array_elements(r #> '{paczka,czlonkowie}') x where x->>'nick' = 'Kuba37';
  perform test.chk('K4 ola uczyła się dziś (1 dzień), kuba nie (profile_test się nie liczy)',
    (o->>'dzis')::boolean and (o->>'dni')::int = 1 and (o->>'ja')::boolean and not (kb->>'dzis')::boolean and (kb->>'dni')::int = 0, r);
  -- K5: widać tylko wysiłek: pseudonim, dziś, dni, duet; bez punktów, wyników, monet, rocznika, e-maila
  perform test.chk('K5 tylko wysiłek (klucze członka)', (select array_agg(x order by x) from jsonb_object_keys(kb) x) = array['dni','dzis','id','ja','nick','w_duecie','wlasciciel'], kb);
  perform test.chk('K5 bez rocznika, punktów i e-maili w odpowiedzi', r::text !~ '(rocznik|pkt|wynik|saldo|xp|@x\.pl|ZARZ|wefiz)', r);
  insert into test.k37 values ('rank', public.nauka_ranking('tydzien')::text), ('stat', public.nauka_kierunek_stat()::text)
  on conflict (k) do update set v = excluded.v;
end $$;
reset role;
insert into test.k37 select 'rp', (select count(*) || ':' || sum(pkt) from public.nauka_rp) on conflict (k) do update set v = excluded.v;

-- K6: duet: ola zaprasza kubę, kuba przyjmuje; ewa nie może zaprosić zajętej oli
select test.jako('ola37@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_duet_zapros('00000000-0000-0000-0000-000000003702'); s jsonb := public.nauka_duet_zapros('00000000-0000-0000-0000-000000003701');
  t jsonb := public.nauka_duet_zapros('00000000-0000-0000-0000-000000003709');
begin perform test.chk('K6 zaproszenie wysłane; siebie / spoza paczki → nie_ma_osoby', r #>> '{duet,stan}' = 'zaproszenie' and (r #>> '{duet,od_mnie}')::boolean
  and s->>'code' = 'nie_ma_osoby' and t->>'code' = 'nie_ma_osoby', jsonb_build_array(r, s, t)); end $$;
reset role;
select test.jako('kuba37@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_paczka(); a jsonb;
begin
  perform test.chk('K6 kuba widzi zaproszenie', jsonb_array_length(r->'zaproszenia') = 1 and r->'zaproszenia'->0->>'od' = '00000000-0000-0000-0000-000000003701', r);
  a := public.nauka_duet_odpowiedz((r->'zaproszenia'->0->>'id')::uuid, true);
  perform test.chk('K6 duet aktywny od dziś, cel 8, nagroda 20', a #>> '{duet,stan}' = 'aktywny' and a #>> '{duet,od}' = a->>'dzis'
    and (a #>> '{duet,cel}')::int = 8 and (a #>> '{duet,nagroda}')::int = 20 and jsonb_array_length(a->'zaproszenia') = 0, a);
end $$;
reset role;
select test.jako('ewa37@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_duet_zapros('00000000-0000-0000-0000-000000003701');
begin perform test.chk('K6 ola zajęta → zajety', r->>'code' = 'zajety', r); end $$;
reset role;

-- K7: za mało sesji w minionym tygodniu (ola 3 dni + kuba 4 dni = 7 < 8) → bez monet
update public.nauka_duety set od = public.nauka_tydzien(public.nauka_dzis()) - 7 where user_id = '00000000-0000-0000-0000-000000003701';
insert into public.nauka_zdarzenia (user_id, klient_id, typ, kiedy, dane)
select '00000000-0000-0000-0000-000000003701'::uuid, gen_random_uuid(), 'activity', ((public.nauka_tydzien(public.nauka_dzis()) - 7 + i)::timestamp + interval '10 hours') at time zone 'Europe/Warsaw', '{}'::jsonb
from generate_series(0, 2) i;
insert into public.nauka_zdarzenia (user_id, klient_id, typ, kiedy, dane)
select '00000000-0000-0000-0000-000000003702'::uuid, gen_random_uuid(), 'activity', ((public.nauka_tydzien(public.nauka_dzis()) - 7 + i)::timestamp + interval '11 hours') at time zone 'Europe/Warsaw', '{}'::jsonb
from generate_series(0, 3) i;
-- drugi wpis tego samego dnia to dalej jeden dzień nauki
insert into public.nauka_zdarzenia (user_id, klient_id, typ, kiedy, dane)
select '00000000-0000-0000-0000-000000003702', gen_random_uuid(), 'activity', ((public.nauka_tydzien(public.nauka_dzis()) - 7)::timestamp + interval '20 hours') at time zone 'Europe/Warsaw', '{}';
select test.jako('ola37@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_paczka(); begin
  perform test.chk('K7 7 sesji < 8 → bez monet', not (r #>> '{duet,odebrane}')::boolean, r); end $$;
reset role;
do $$ begin perform test.chk('K7 brak wpisów duetu w księdze', not exists (select 1 from public.nauka_monety where klucz like 'misja:duet:%'
  and user_id in ('00000000-0000-0000-0000-000000003701', '00000000-0000-0000-0000-000000003702')), null); end $$;

-- K8: ósma sesja (powtórka kuby w niedzielę minionego tygodnia) → wyzwalacz przyznaje obu po 20 monet, raz
do $$ declare s1 int := public.nauka_saldo('00000000-0000-0000-0000-000000003701'); s2 int := public.nauka_saldo('00000000-0000-0000-0000-000000003702');
begin insert into test.k37 values ('s1', s1::text), ('s2', s2::text) on conflict (k) do update set v = excluded.v; end $$;
insert into public.nauka_powtorki_log (user_id, klucz, ok, first, at)
values ('00000000-0000-0000-0000-000000003702', 'q:k37', true, true, ((public.nauka_tydzien(public.nauka_dzis()) - 1)::timestamp + interval '12 hours') at time zone 'Europe/Warsaw');
-- przyznaje sam wyzwalacz (tydzień dnia tej powtórki), bez otwierania widoku
do $$ declare kl text := 'misja:duet:' || (public.nauka_tydzien(public.nauka_dzis()) - 7)::text; n int; s1 int; s2 int;
begin
  select count(*) into n from public.nauka_monety where klucz = kl and delta = 20 and zrodlo = 'misja'
    and user_id in ('00000000-0000-0000-0000-000000003701', '00000000-0000-0000-0000-000000003702');
  s1 := public.nauka_saldo('00000000-0000-0000-0000-000000003701'); s2 := public.nauka_saldo('00000000-0000-0000-0000-000000003702');
  perform test.chk('K8 wyzwalacz: obie osoby +20 monet za miniony tydzień', n = 2 and s1 = (select v::int from test.k37 where k = 's1') + 20
    and s2 = (select v::int from test.k37 where k = 's2') + 20, jsonb_build_object('n', n, 's1', s1, 's2', s2));
end $$;

select test.jako('kuba37@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_paczka(); begin perform test.chk('K8 widok paczki działa po nagrodzie', (r->>'ok')::boolean, r); end $$;
reset role;
-- K9: raz w tygodniu: kolejne otwarcia, kolejne zdarzenia i nowa para w tym samym tygodniu nie dają drugiej nagrody
select test.jako('ola37@x.pl'); set role authenticated;
do $$ begin perform public.nauka_paczka(); perform public.nauka_paczka(); end $$;
reset role;
insert into public.nauka_zdarzenia (user_id, klient_id, typ, kiedy, dane)
select '00000000-0000-0000-0000-000000003701'::uuid, gen_random_uuid(), 'activity', ((public.nauka_tydzien(public.nauka_dzis()) - 7 + i)::timestamp + interval '15 hours') at time zone 'Europe/Warsaw', '{}'::jsonb
from generate_series(3, 6) i;
do $$ begin perform public.nauka_duet_rozlicz(d.id, public.nauka_tydzien(public.nauka_dzis()) - 7) from public.nauka_duety d where d.user_id = '00000000-0000-0000-0000-000000003701'; end $$;
do $$ declare n int;
begin
  select count(*) into n from public.nauka_monety where klucz like 'misja:duet:%' and user_id in ('00000000-0000-0000-0000-000000003701', '00000000-0000-0000-0000-000000003702');
  perform test.chk('K9 dalej po jednym wpisie na osobę', n = 2, jsonb_build_object('n', n));
end $$;

-- K10: ranking i statystyki rocznika bez zmian, nauka_rp bez nowych wierszy
select test.jako('ola37@x.pl'); set role authenticated;
do $$ begin
  perform test.chk('K10 ranking bez zmian', public.nauka_ranking('tydzien')::text = (select v from test.k37 where k = 'rank'), public.nauka_ranking('tydzien'));
  perform test.chk('K10 statystyki rocznika bez zmian', public.nauka_kierunek_stat()::text = (select v from test.k37 where k = 'stat'), public.nauka_kierunek_stat());
end $$;
reset role;
do $$ begin perform test.chk('K10 nauka_rp bez nowych wierszy', (select count(*) || ':' || sum(pkt) from public.nauka_rp) = (select v from test.k37 where k = 'rp'), null); end $$;

-- K11: bez dostępu monet nie ma: duet ewa + o4 (o4 ma dostęp) w minionym tygodniu → tylko o4 dostaje
select test.jako('o4@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_paczka_dolacz((select v from test.k37 where k = 'kod')); a jsonb;
begin
  a := public.nauka_duet_zapros('00000000-0000-0000-0000-000000003703');
  perform test.chk('K11 o4 w paczce, zaprasza ewę', jsonb_array_length(r #> '{paczka,czlonkowie}') = 4 and a #>> '{duet,stan}' = 'zaproszenie', jsonb_build_array(r, a));
end $$;
reset role;
select test.jako('ewa37@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_duet_zapros('00000000-0000-0000-0000-000000003704');
begin perform test.chk('K11 wzajemne zaproszenie = duet', r #>> '{duet,stan}' = 'aktywny' and not (r #>> '{duet,moze_zarobic}')::boolean, r); end $$;
reset role;
update public.nauka_duety set od = public.nauka_tydzien(public.nauka_dzis()) - 7 where user_id = '00000000-0000-0000-0000-000000003704' or partner_id = '00000000-0000-0000-0000-000000003704';
insert into public.nauka_zdarzenia (user_id, klient_id, typ, kiedy, dane)
select u, gen_random_uuid(), 'activity', ((public.nauka_tydzien(public.nauka_dzis()) - 7 + i)::timestamp + interval '9 hours') at time zone 'Europe/Warsaw', '{}'::jsonb
from generate_series(0, 3) i, unnest(array['00000000-0000-0000-0000-000000003703'::uuid, '00000000-0000-0000-0000-000000003704'::uuid]) u;
do $$ begin perform public.nauka_duet_rozlicz(d.id, public.nauka_tydzien(public.nauka_dzis()) - 7) from public.nauka_duety d where d.partner_id = '00000000-0000-0000-0000-000000003704' or d.user_id = '00000000-0000-0000-0000-000000003704'; end $$;
do $$ begin perform test.chk('K11 o4 +20, ewa (bez dostępu) nic',
  exists (select 1 from public.nauka_monety where user_id = '00000000-0000-0000-0000-000000003704' and klucz like 'misja:duet:%')
  and not exists (select 1 from public.nauka_monety where user_id = '00000000-0000-0000-0000-000000003703'), null); end $$;

-- K12: limit 8 osób; usuwanie osoby tylko przez właściciela
do $$ declare i int; r jsonb; begin
  for i in 5..9 loop
    perform test.jako('o' || i || '@x.pl'); set local role authenticated;
    r := public.nauka_paczka_dolacz((select v from test.k37 where k = 'kod'));
    reset role;
    if i <= 8 then perform test.chk('K12 o' || i || ' dołącza', (r->>'ok')::boolean, r);
    else perform test.chk('K12 dziewiąta osoba → pelna', r->>'code' = 'pelna', r); end if;
  end loop;
end $$;
select test.jako('kuba37@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_paczka_usun_osobe('00000000-0000-0000-0000-000000003708');
begin perform test.chk('K12 nie-właściciel nie usuwa', r->>'code' = 'nie_wlasciciel', r); end $$;
reset role;
select test.jako('ola37@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_paczka_usun_osobe('00000000-0000-0000-0000-000000003708'); s jsonb := public.nauka_paczka_usun_osobe('00000000-0000-0000-0000-000000003701');
begin perform test.chk('K12 właścicielka usuwa o8 (7 osób), siebie nie', jsonb_array_length(r #> '{paczka,czlonkowie}') = 7 and s->>'code' = 'sam_siebie', jsonb_build_array(r, s)); end $$;
reset role;

-- K13: właścicielka wychodzi → własność przechodzi na kubę (najdłużej w paczce), duet ola–kuba znika, paczka zostaje
select test.jako('ola37@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_paczka_wyjdz(); s jsonb := public.nauka_paczka();
begin perform test.chk('K13 ola poza paczką', (r->>'ok')::boolean and s->'paczka' = 'null'::jsonb, jsonb_build_array(r, s)); end $$;
reset role;
select test.jako('kuba37@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_paczka();
begin perform test.chk('K13 kuba właścicielem, 6 osób, bez duetu', (r #>> '{paczka,wlasciciel}')::boolean and jsonb_array_length(r #> '{paczka,czlonkowie}') = 6
  and r->'duet' = 'null'::jsonb, r); end $$;
reset role;

-- K14: usunięcie konta (v32): ślady w nowych tabelach widać, po usunięciu znikają, paczka pozostałych działa dalej
do $$ declare a jsonb := public.nauka_konto_slady('00000000-0000-0000-0000-000000003704', 'o4@x.pl'); b jsonb; c jsonb;
begin
  perform test.chk('K14 ślady o4: członkostwo, duet, monety', (a->>'nauka_paczka_czlonkowie')::int = 1 and (a->>'nauka_duety')::int = 1 and (a->>'nauka_monety')::int >= 1, a);
  perform public.nauka_konto_usun_dane('00000000-0000-0000-0000-000000003704', 'o4@x.pl');
  b := public.nauka_konto_slady('00000000-0000-0000-0000-000000003704', 'o4@x.pl');
  perform test.chk('K14 po usunięciu tylko auth.users', (select array_agg(x) from jsonb_object_keys(b) x) <@ array['auth.users'], b);
  perform test.chk('K14 duet ewy z o4 zniknął', not exists (select 1 from public.nauka_duety where '00000000-0000-0000-0000-000000003704' in (user_id, partner_id))
    and not exists (select 1 from public.nauka_duety where '00000000-0000-0000-0000-000000003703' in (user_id, partner_id)), null);
  -- usunięcie konta właściciela (kuby) też nie kasuje paczki: własność przechodzi na ewę
  perform public.nauka_konto_usun_dane('00000000-0000-0000-0000-000000003702', 'kuba37@x.pl');
  c := public.nauka_konto_slady('00000000-0000-0000-0000-000000003702', 'kuba37@x.pl');
  perform test.chk('K14 konto właściciela usunięte bez śladów', (select coalesce(array_agg(x), '{}') from jsonb_object_keys(c) x) <@ array['auth.users'], c);
  perform test.chk('K14 paczka została, właścicielką ewa, 4 osoby',
    (select p.wlasciciel from public.nauka_paczki p where p.kod = (select v from test.k37 where k = 'kod')) = '00000000-0000-0000-0000-000000003703'
    and (select count(*) from public.nauka_paczka_czlonkowie m join public.nauka_paczki p on p.id = m.paczka_id where p.kod = (select v from test.k37 where k = 'kod')) = 4, null);
end $$;
select test.jako('ewa37@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_paczka();
begin perform test.chk('K14 ewa widzi paczkę jako właścicielka', (r #>> '{paczka,wlasciciel}')::boolean and jsonb_array_length(r #> '{paczka,czlonkowie}') = 4, r); end $$;
-- ostatnia osoba wychodzi → paczka znika (sprawdzone na osobnej paczce ewy)
do $$ declare r jsonb; begin
  perform public.nauka_paczka_wyjdz(); r := public.nauka_paczka_zaloz();
  insert into test.k37 values ('kod2', r #>> '{paczka,kod}') on conflict (k) do update set v = excluded.v;
  perform public.nauka_paczka_wyjdz();
  r := public.nauka_paczka_podglad((select v from test.k37 where k = 'kod2'));
  perform test.chk('K14 ostatnia osoba wyszła → paczki nie ma', r->>'code' = 'nie_ma', r);
end $$;
reset role;
do $$ begin raise notice 'OK v37: wszystkie testy paczki i duetu'; end $$;
