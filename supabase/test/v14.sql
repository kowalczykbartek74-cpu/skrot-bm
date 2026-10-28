-- Testy M1–M8 dla skrot-v14-monety.sql uruchomionego PO skrot-v15-gry2.sql (kolejność jak na produkcji).
-- Tylko lokalnie, na atrapie z test/stub.sql. Uruchamiaj po test/v13.sql (test.jako, test.chk, s@x.pl = starosta).
-- Własne konta (m1 z dostępem, m2 bez dostępu), żeby punkty z v13/v15 nie wpływały na wyniki.
-- Każdy test kończy się komunikatem „OK …”; pierwszy błąd przerywa plik wyjątkiem „BŁĄD …”.

reset role;
insert into auth.users (id, email)
select ('00000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid, e
from (values (51,'m1@x.pl'),(52,'m2@x.pl')) v(i, e);
insert into public.nauka_dostep (email, do_kiedy, user_id)
select u.email, current_date + 300, u.id from auth.users u where u.email = 'm1@x.pl';
insert into public.nauka_urzadzenia (user_id, device_id, nazwa)
select u.id, '11111111-1111-1111-1111-' || right(u.id::text, 12), 'test' from auth.users u where u.email in ('m1@x.pl','m2@x.pl');

-- ---------- M1 trigger: punkty ze wszystkich źródeł (także haslo i boss z v15) → monety ----------
do $$ declare u uuid := (select id from auth.users where email = 'm1@x.pl'); a int; b int; c int;
begin
  a := public.nauka_rp_dodaj(u, 'lekcja', 'l:test', 'makro', 30);
  b := public.nauka_rp_dodaj(u, 'haslo', 'h:' || public.nauka_dzis()::text, 'makro', 20);
  c := public.nauka_rp_dodaj(u, 'boss', 'b:test', 'makro', 50);
  perform test.chk('M1 lekcja 30 + Hasło 20 + Boss 50 = 100 pkt → 10 monet (wpis nauka:<dziś>)',
    a = 30 and b = 20 and c = 50 and public.nauka_saldo(u) = 10
    and (select count(*) from public.nauka_monety m where m.user_id = u and m.zrodlo = 'nauka') = 1,
    jsonb_build_array(a, b, c, public.nauka_saldo(u)));
end $$;

-- ---------- M2 stan sklepu i dzienny limit z Hasłem dnia ----------
select test.jako('m1@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_sklep_stan();
begin
  perform test.chk('M2 nauka_sklep_stan: saldo 10, dziś 10, limit 64 (62 + Hasło 20 pkt), mozna',
    (r->>'ok')::boolean and (r->>'saldo')::int = 10 and (r->>'dzis_nauka')::int = 10 and (r->>'dzis_max')::int = 64
    and (r->>'mozna')::boolean and jsonb_array_length(r->'katalog') = 4, r);
end $$;

-- ---------- M3 Zadania dnia: 3 dzienne + 1 tygodniowa, „Rozwiąż Hasło dnia” liczy źródło haslo ----------
do $$ declare r jsonb := public.nauka_misje();
begin
  perform test.chk('M3a nauka_misje: 3 dzienne + 1 tygodniowa, odblokowane',
    (r->>'ok')::boolean and jsonb_array_length(r->'misje') = 4 and not (r->>'zablokowane')::boolean
    and (select count(*) from jsonb_array_elements(r->'misje') e where e->>'okres' = 'dzien') = 3, r);
end $$;
reset role;
do $$ declare u uuid := (select id from auth.users where email = 'm1@x.pl');
  m jsonb := (select e from jsonb_array_elements(public.nauka_misje_pula()) e where e->>'id' = 'haslo1');
begin
  perform test.chk('M3b haslo1 w puli', m is not null, null);
  perform test.chk('M3c postęp haslo1 = 1 po Haśle dnia', public.nauka_misja_postep(u, m, public.nauka_dzis()) = 1, m);
  -- rotacja: każda dzienna z puli wypada w ciągu 8 kolejnych dni
  perform test.chk('M3d haslo1 pojawia się w rotacji',
    exists (select 1 from generate_series(0, 7) i, jsonb_array_elements(public.nauka_misje_na(public.nauka_dzis() + i)) e where e->>'id' = 'haslo1'), null);
  -- komplet wierszy na dziś, żeby każda dzienna misja była zrobiona (q:, z:, p:, l:, r:, h: już jest)
  insert into public.nauka_rp (user_id, dzien, tydzien, zrodlo, klucz, sid, pkt)
  select u, public.nauka_dzis(), public.nauka_tydzien(public.nauka_dzis()), z, k, 'makro', 1
  from (select 'quiz' z, 'q:t:' || i k from generate_series(1, 25) i
        union all select 'quiz', 'z:t:' || i from generate_series(1, 2) i
        union all select 'powtorka', 'p:t:' || i from generate_series(1, 10) i
        union all select 'wynik', 'r:t') x;
end $$;

-- ---------- M4 odbiór nagrody za misję (raz) ----------
select test.jako('m1@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_misje(); m jsonb; s0 int; a jsonb; b jsonb;
begin
  select e into m from jsonb_array_elements(r->'misje') e where e->>'okres' = 'dzien' limit 1;
  s0 := (public.nauka_sklep_stan()->>'saldo')::int;
  a := public.nauka_misja_odbierz(m->>'id');
  b := public.nauka_misja_odbierz(m->>'id');
  perform test.chk('M4 odbiór: +nagroda, drugi raz „already”',
    (m->>'postep')::int = (m->>'ile')::int and (a->>'ok')::boolean and (a->>'saldo')::int = s0 + (m->>'nagroda')::int
    and b->>'code' = 'already', jsonb_build_array(m, a, b));
  perform test.chk('M4b obca misja → not_today', public.nauka_misja_odbierz('nie_ma')->>'code' = 'not_today', null);
end $$;

-- ---------- M5 sklep: za mało monet, monety od starosty, zakup, drugi zakup ----------
do $$ declare r jsonb := public.nauka_sklep_kup('motyw:bow');
begin
  perform test.chk('M5a za mało monet → no_coins z brakuje', r->>'code' = 'no_coins' and (r->>'brakuje')::int > 0, r);
  perform test.chk('M5b student nie daje monet → not_admin',
    public.nauka_admin_monety(auth.uid(), 500, 'x')->>'code' = 'not_admin', null);
end $$;
reset role;
select test.jako('s@x.pl'); set role authenticated;
do $$ declare u uuid := '00000000-0000-0000-0000-000000000051'; a jsonb; b jsonb; st jsonb;
begin
  a := public.nauka_admin_monety(u, 400, 'Konkurs');
  b := public.nauka_admin_monety(u, -100000, 'Za dużo');
  st := public.nauka_admin_monety_stat();
  perform test.chk('M5c starosta: +400, nie poniżej zera, statystyka z dzis_max',
    (a->>'ok')::boolean and b->>'code' in ('below_zero','bad_delta') and (st->>'dzis_max')::int = 64
    and exists (select 1 from jsonb_array_elements(st->'konta') k where (k->>'user_id')::uuid = u), jsonb_build_array(a, b));
end $$;
reset role;
select test.jako('m1@x.pl'); set role authenticated;
do $$ declare s0 int := (public.nauka_sklep_stan()->>'saldo')::int; a jsonb; b jsonb; c jsonb; st jsonb;
begin
  a := public.nauka_sklep_kup('motyw:bow');
  b := public.nauka_sklep_kup('motyw:bow');
  c := public.nauka_sklep_kup('motyw:sea');
  st := public.nauka_sklep_stan();
  perform test.chk('M5d zakup motywu: −350, posiadane, drugi raz owned, Nocny rejs no_coins',
    (a->>'ok')::boolean and (a->>'saldo')::int = s0 - 350 and b->>'code' = 'owned' and c->>'code' = 'no_coins'
    and st->'posiadane' ? 'motyw:bow' and (st->>'saldo')::int = s0 - 350 and (st->>'wydane_lacznie')::int = 350,
    jsonb_build_array(a, b, c, st));
  perform test.chk('M5e historia ma zakup', exists (select 1 from jsonb_array_elements(public.nauka_monety_historia(10)->'wpisy') w where w->>'zrodlo' = 'zakup'), null);
end $$;

-- ---------- M6 bez pełnego dostępu: zablokowane ----------
reset role;
select test.jako('m2@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_misje();
begin
  perform test.chk('M6 bez dostępu: misje zablokowane, odbiór no_access, sklep_stan mozna=false',
    (r->>'zablokowane')::boolean and public.nauka_misja_odbierz((r->'misje'->0)->>'id')->>'code' = 'no_access'
    and not (public.nauka_sklep_stan()->>'mozna')::boolean, r);
end $$;

-- ---------- M7 uprawnienia ----------
do $$ declare n int := 0; begin
  begin perform 1 from public.nauka_monety limit 1; exception when insufficient_privilege then n := n + 1; end;
  begin perform 1 from public.nauka_posiadane limit 1; exception when insufficient_privilege then n := n + 1; end;
  begin perform public.nauka_saldo(auth.uid()); exception when insufficient_privilege then n := n + 1; end;
  begin perform public.nauka_mon_dzis_max(); exception when insufficient_privilege then n := n + 1; end;
  perform test.chk('M7 permission denied ×4', n = 4, to_jsonb(n));
end $$;
reset role;

-- ---------- M8 ponowne uruchomienie v14 nie dubluje monet ----------
do $$ declare u uuid := (select id from auth.users where email = 'm1@x.pl');
begin
  perform test.chk('M8 jeden wpis nauka:<dziś> mimo dwóch uruchomień v14',
    (select count(*) from public.nauka_monety where user_id = u and klucz = 'nauka:' || public.nauka_dzis()::text) = 1, null);
end $$;

do $$ begin raise notice 'WSZYSTKIE TESTY M1–M8 OK'; end $$;
