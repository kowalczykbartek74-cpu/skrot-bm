-- Testy K1–K15 dla skrot-v24-kosmetyki.sql (po v22 i jego testach). Tylko lokalnie, na atrapie z test/stub.sql.
-- Konta k1 (pełny dostęp) i k2 (pełny dostęp, drugi rocznik do sprawdzenia wyglądu). Każdy test kończy się „OK …”.

reset role;
insert into auth.users (id, email)
select ('00000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid, e
from (values (91,'k1@x.pl'),(92,'k2@x.pl')) v(i, e);
insert into public.nauka_dostep (email, do_kiedy, user_id)
select u.email, current_date + 300, u.id from auth.users u where u.email in ('k1@x.pl','k2@x.pl');
insert into public.nauka_urzadzenia (user_id, device_id, nazwa)
select u.id, '11111111-1111-1111-1111-' || right(u.id::text, 12), 'test' from auth.users u where u.email in ('k1@x.pl','k2@x.pl');
-- k1 miał już motyw z v14 (migracja ma go zachować) i 100 monet
insert into public.nauka_posiadane (user_id, item, cena) select id, 'motyw:meadow', 350 from auth.users where email = 'k1@x.pl';
insert into public.nauka_monety (user_id, delta, zrodlo, klucz, opis) select id, 100, 'admin', 'admin:k1start', 'test' from auth.users where email = 'k1@x.pl';
insert into public.nauka_profil (user_id, nick, w_rankingu) select id, 'kosma', true from auth.users where email = 'k1@x.pl';
insert into public.nauka_profil (user_id, nick, w_rankingu) select id, 'kasia', true from auth.users where email = 'k2@x.pl';
-- postęp k1: 0 XP, dwie zdobyte odznaki, jeden tytuł za osiągnięcie
insert into public.nauka_docs (kolekcja, id, data)
select 'progress', id::text, '{"xp":{"t":0},"odznaki":{"frun10":20,"pary0":21},"tytuly":{"tytul:pogromca:makroekonomia":22}}'::jsonb
from auth.users where email = 'k1@x.pl';

create or replace function test.k1() returns uuid language sql as $$ select id from auth.users where email = 'k1@x.pl' $$;
create or replace function test.ustaw_xp(e text, xp int) returns void language sql as $$
  update public.nauka_docs set data = jsonb_set(data, '{xp,t}', to_jsonb(xp))
   where kolekcja = 'progress' and id = (select id::text from auth.users where email = e) $$;

-- ---------- K1 migracja: stary motyw zostaje, stan ma stare i nowe pola ----------
select test.jako('k1@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_sklep_stan();
begin
  perform test.chk('K1 stan: motyw:meadow zostaje, saldo 100, poziom 1, nowe pola',
    (r->>'ok')::boolean and r->'posiadane' ? 'motyw:meadow' and (r->>'saldo')::int = 100 and (r->>'poziom')::int = 1
    and r ? 'zalozone' and r ? 'gablota' and r ? 'zamrozenia' and r ? 'sezony' and r ? 'tytuly' and r ? 'dzis_pkt'
    and (r->'gablota'->>'miejsca')::int = 1 and (r->'zamrozenia'->>'max')::int = 2
    and (select count(*) from jsonb_array_elements(r->'katalog') e where e->>'kat' = 'motywy') = 6
    and r->'tytuly' ? 'tytul:pogromca:makroekonomia', r);
end $$;

-- ---------- K2 za mało monet: nic się nie zmienia ----------
do $$ declare r jsonb := public.nauka_sklep_kup('ramka:gwiazdy');
begin
  perform test.chk('K2 ramka 260 przy saldzie 100 → no_coins, brakuje 160', not (r->>'ok')::boolean and r->>'code' = 'no_coins' and (r->>'brakuje')::int = 160, r);
end $$;
reset role;
do $$ begin perform test.chk('K2b saldo dalej 100, brak posiadania',
  public.nauka_saldo(test.k1()) = 100 and not exists (select 1 from public.nauka_posiadane where user_id = test.k1() and item = 'ramka:gwiazdy'), null); end $$;

-- ---------- K3 zakup: cena z katalogu, posiadanie i odjęcie w jednej transakcji; drugi raz = owned ----------
insert into public.nauka_monety (user_id, delta, zrodlo, klucz, opis) values (test.k1(), 2000, 'admin', 'admin:k1dod', 'test');
select test.jako('k1@x.pl'); set role authenticated;
do $$ declare a jsonb := public.nauka_sklep_kup('ramka:liscie'); b jsonb := public.nauka_sklep_kup('ramka:liscie');
begin
  perform test.chk('K3 kup ramka:liscie → ok, cena 200, saldo 1900; drugie kliknięcie → owned, saldo 1900',
    (a->>'ok')::boolean and (a->>'cena')::int = 200 and (a->>'saldo')::int = 1900
    and not (b->>'ok')::boolean and b->>'code' = 'owned' and (b->>'saldo')::int = 1900, jsonb_build_array(a, b));
end $$;
reset role;
do $$ begin perform test.chk('K3b w księdze jeden wpis zakupu −200',
  (select count(*) from public.nauka_monety where user_id = test.k1() and klucz = 'zakup:ramka:liscie' and delta = -200) = 1
  and public.nauka_saldo(test.k1()) = 1900, null); end $$;

-- ---------- K4 nieznany przedmiot i rzeczy nie na sprzedaż ----------
select test.jako('k1@x.pl'); set role authenticated;
do $$ declare a jsonb := public.nauka_sklep_kup('ramka:nieistnieje'); b jsonb := public.nauka_sklep_kup('ramka:zlota');
  c jsonb := public.nauka_sklep_kup('tytul:pogromca'); d jsonb := public.nauka_sklep_kup('tytul:pogromca:makroekonomia');
begin
  perform test.chk('K4 no_item / złota ramka i tytuł za osiągnięcie → not_for_sale',
    a->>'code' = 'no_item' and b->>'code' = 'not_for_sale' and c->>'code' = 'not_for_sale' and d->>'code' = 'no_item', jsonb_build_array(a, b, c, d));
end $$;

-- ---------- K5 min_poziom: Latarnia od poziomu 8 ----------
do $$ declare r jsonb := public.nauka_sklep_kup('skorka:latarnia');
begin perform test.chk('K5 Latarnia na poziomie 1 → level 8', r->>'code' = 'level' and (r->>'poziom')::int = 8, r); end $$;
reset role;
select test.ustaw_xp('k1@x.pl', 2799);   -- poziom 7 (próg 8 = 2800)
select test.jako('k1@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_sklep_kup('skorka:latarnia');
begin perform test.chk('K5b 2799 XP = poziom 7 → dalej level', r->>'code' = 'level' and (public.nauka_sklep_stan()->>'poziom')::int = 7, r); end $$;
reset role;
select test.ustaw_xp('k1@x.pl', 2800);
select test.jako('k1@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_sklep_kup('skorka:latarnia');
begin perform test.chk('K5c 2800 XP = poziom 8 → kupiona za 800, saldo 1100', (r->>'ok')::boolean and (r->>'saldo')::int = 1100, r); end $$;

-- ---------- K6 tylko za poziom: złota ramka od poziomu 10 ----------
do $$ declare r jsonb := public.nauka_sklep_zaloz('ramka', 'ramka:zlota');
begin perform test.chk('K6 złota ramka na poziomie 8 → not_owned', r->>'code' = 'not_owned', r); end $$;
reset role;
select test.ustaw_xp('k1@x.pl', 4500);
select test.jako('k1@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_sklep_zaloz('ramka', 'ramka:zlota'); s jsonb := public.nauka_sklep_stan();
begin perform test.chk('K6b poziom 10 → złota ramka założona bez zakupu',
  (r->>'ok')::boolean and s->'zalozone'->>'ramka' = 'ramka:zlota' and (s->>'poziom')::int = 10 and (s->>'saldo')::int = 1100, jsonb_build_array(r, s)); end $$;

-- ---------- K7 zakładanie: tylko posiadane, tylko właściwy slot, zdejmowanie ----------
do $$ declare a jsonb := public.nauka_sklep_zaloz('ramka', 'ramka:fale'); b jsonb := public.nauka_sklep_zaloz('kolor', 'ramka:liscie');
  c jsonb := public.nauka_sklep_zaloz('nieznany', 'ramka:liscie'); d jsonb := public.nauka_sklep_zaloz('ramka', 'ramka:liscie');
  e jsonb := public.nauka_sklep_zaloz('tytul', 'tytul:pogromca:makroekonomia'); f jsonb := public.nauka_sklep_zaloz('tytul', 'tytul:pogromca:finanse');
  g jsonb := public.nauka_sklep_zaloz('skorka', 'skorka:latarnia'); x jsonb := public.nauka_sklep_zaloz('skorka', null);
  s jsonb := public.nauka_sklep_stan();
begin perform test.chk('K7 not_owned / wrong_slot / bad_slot / ok / tytuł za osiągnięcie ok, cudzy nie / zdjęcie skórki',
  a->>'code' = 'not_owned' and b->>'code' = 'wrong_slot' and c->>'code' = 'bad_slot' and (d->>'ok')::boolean
  and (e->>'ok')::boolean and f->>'code' = 'not_owned' and (g->>'ok')::boolean and (x->>'ok')::boolean
  and s->'zalozone'->>'ramka' = 'ramka:liscie' and s->'zalozone'->>'tytul' = 'tytul:pogromca:makroekonomia' and not (s->'zalozone' ? 'skorka'),
  jsonb_build_array(a, b, c, d, e, f, g, x, s->'zalozone')); end $$;

-- ---------- K8 zestaw: płacisz za brakujące części, nie więcej niż cena zestawu ----------
do $$ declare a jsonb := public.nauka_sklep_kup('skorka:owca'); r jsonb := public.nauka_sklep_kup('zestaw:laka');
begin perform test.chk('K8 mam Liście + Owca → zestaw Łąka kosztuje tylko brakujące Dzień (160)',
  (a->>'ok')::boolean and (a->>'saldo')::int = 540 and (r->>'ok')::boolean and (r->>'cena')::int = 160 and (r->>'saldo')::int = 380
  and r->'czesci' = '["tlo:dzien"]'::jsonb, jsonb_build_array(a, r)); end $$;
do $$ declare r jsonb := public.nauka_sklep_kup('zestaw:laka'); z jsonb := public.nauka_sklep_zaloz('tlo', 'tlo:dzien');
begin perform test.chk('K8b zestaw drugi raz → owned; tło z zestawu da się założyć', r->>'code' = 'owned' and (z->>'ok')::boolean, jsonb_build_array(r, z)); end $$;

-- ---------- K9 sezon: zamknięte okno blokuje zakup, posiadane sezonowe zostają ----------
do $$ declare r jsonb := public.nauka_sklep_kup('ramka:szron');
begin perform test.chk('K9 sezon otwarty → Szron kupiony (240), saldo 140', (r->>'ok')::boolean and (r->>'saldo')::int = 140, r); end $$;
reset role;
create or replace function public.nauka_sezony() returns jsonb language sql stable set search_path = '' as $$
  select '{"zima": {"od": "2025-12-01", "do": "2026-02-28", "pl": "Sesja zimowa", "en": "Winter exam session"}}'::jsonb $$;
select test.jako('k1@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_sklep_kup('efekt:snieg'); z jsonb := public.nauka_sklep_zaloz('ramka', 'ramka:szron');
begin perform test.chk('K9b po sezonie: zakup → season, saldo bez zmian; kupiony Szron dalej da się założyć',
  r->>'code' = 'season' and (r->>'saldo')::int = 140 and (z->>'ok')::boolean, jsonb_build_array(r, z)); end $$;
reset role;
create or replace function public.nauka_sezony() returns jsonb language sql stable set search_path = '' as $$
  select '{"zima": {"od": "2026-01-01", "do": "2099-12-31", "pl": "Sesja zimowa", "en": "Winter exam session"}}'::jsonb $$;

-- ---------- K10 gablota: miejsca, kolejność zakupu, tylko zdobyte odznaki ----------
select test.jako('k1@x.pl'); set role authenticated;
do $$ declare a jsonb := public.nauka_gablota_ustaw(array['frun10','pary0']); b jsonb := public.nauka_gablota_ustaw(array['top10']);
  c jsonb := public.nauka_gablota_ustaw(array['pary0']); d jsonb := public.nauka_sklep_kup('gablota:3');
begin perform test.chk('K10 1 miejsce: dwie → too_many, niezdobyta → not_earned, jedna ok; gablota:3 bez 2 → needs',
  a->>'code' = 'too_many' and b->>'code' = 'not_earned' and (c->>'ok')::boolean and d->>'code' = 'needs', jsonb_build_array(a, b, c, d)); end $$;
reset role;
insert into public.nauka_monety (user_id, delta, zrodlo, klucz, opis) values (test.k1(), 600, 'admin', 'admin:k1gab', 'test');
select test.jako('k1@x.pl'); set role authenticated;
do $$ declare a jsonb := public.nauka_sklep_kup('gablota:2'); b jsonb := public.nauka_gablota_ustaw(array['frun10','pary0','frun10']);
begin perform test.chk('K10b kup 2. miejsce (600) → dwie odznaki ok (powtórka usunięta)',
  (a->>'ok')::boolean and (a->>'saldo')::int = 140 and (b->>'ok')::boolean and b->'odznaki' = '["frun10","pary0"]'::jsonb, jsonb_build_array(a, b)); end $$;

-- ---------- K11 zamrożenie serii: żądanie, idempotencja, limit 2, użycie ----------
do $$ declare a jsonb := public.nauka_sklep_kup('zamrozenie'); b jsonb := public.nauka_sklep_kup('zamrozenie', 'req-aaaaaaaa');
  c jsonb := public.nauka_sklep_kup('zamrozenie', 'req-aaaaaaaa'); d jsonb := public.nauka_sklep_kup('zamrozenie', 'req-bbbbbbbb');
  e jsonb := public.nauka_sklep_kup('zamrozenie', 'req-cccccccc');
begin perform test.chk('K11 bez req → no_req; kup (40) → 100; to samo req → juz bez opłaty; drugie → 60; trzecie → max',
  a->>'code' = 'no_req' and (b->>'ok')::boolean and (b->>'saldo')::int = 100 and (c->>'juz')::boolean and (c->>'saldo')::int = 100
  and (d->>'ok')::boolean and (d->>'saldo')::int = 60 and (d->>'zamrozenia')::int = 2 and e->>'code' = 'max', jsonb_build_array(a, b, c, d, e)); end $$;
reset role;
-- wczoraj były punkty → nic do chronienia
insert into public.nauka_rp (user_id, dzien, tydzien, zrodlo, klucz, sid, pkt)
values (test.k1(), public.nauka_dzis() - 1, public.nauka_tydzien(public.nauka_dzis() - 1), 'quiz', 'q:k11', 'makro', 10);
select test.jako('k1@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_zamrozenie_uzyj();
begin perform test.chk('K11b wczoraj była nauka → not_missed', r->>'code' = 'not_missed', r); end $$;
reset role;
delete from public.nauka_rp where user_id = test.k1() and klucz = 'q:k11';
create temp table k11_przed as select (select count(*) from public.nauka_rp where user_id = test.k1()) rp, public.nauka_saldo(test.k1()) saldo,
  (select data->'xp' from public.nauka_docs where kolekcja = 'progress' and id = test.k1()::text) xp;
grant select on k11_przed to authenticated;
select test.jako('k1@x.pl'); set role authenticated;
do $$ declare a jsonb := public.nauka_zamrozenie_uzyj(); b jsonb := public.nauka_zamrozenie_uzyj(); s jsonb := public.nauka_sklep_stan();
begin perform test.chk('K11c opuszczony wczoraj → chroniony, zostało 1; drugi raz → juz; dzień w stanie',
  (a->>'ok')::boolean and (a->>'dzien')::date = (s->>'dzis')::date - 1 and (a->>'zostalo')::int = 1 and (b->>'juz')::boolean
  and (s->'zamrozenia'->>'ma')::int = 1 and s->'zamrozenia'->'dni' ? ((s->>'dzis')::date - 1)::text, jsonb_build_array(a, b, s->'zamrozenia')); end $$;
reset role;
do $$ begin perform test.chk('K11d zamrożenie nie dodaje punktów rankingu, monet ani XP',
  (select count(*) from public.nauka_rp where user_id = test.k1()) = (select rp from k11_przed)
  and public.nauka_saldo(test.k1()) = (select saldo from k11_przed)
  and (select data->'xp' from public.nauka_docs where kolekcja = 'progress' and id = test.k1()::text) = (select xp from k11_przed), null); end $$;

-- ---------- K12 zestaw z poziomem i saldo nigdy poniżej zera ----------
do $$ begin perform test.chk('K12 saldo k1 ≥ 0 i każdy zakup ma wpis w księdze (poza częściami zestawu)',
  public.nauka_saldo(test.k1()) >= 0
  and not exists (select 1 from public.nauka_posiadane p where p.user_id = test.k1() and p.cena > 0 and p.item <> 'motyw:meadow'   -- ten wstawił test bez księgi
                   and not exists (select 1 from public.nauka_monety m where m.user_id = p.user_id and m.klucz = 'zakup:' || p.item)), null); end $$;

-- ---------- K13 wygląd w rankingu: tylko założone i posiadane; gablota tylko ze zdobytych ----------
select test.jako('k2@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_wyglad(array['kosma','kasia','nieznany']);
begin perform test.chk('K13 k2 widzi wygląd k1 (ramka Szron, tytuł, gablota) i własny pusty',
  (r->>'ok')::boolean and r->'osoby'->'kosma'->'zalozone'->>'ramka' = 'ramka:szron'
  and r->'osoby'->'kosma'->'zalozone'->>'tytul' = 'tytul:pogromca:makroekonomia'
  and r->'osoby'->'kosma'->'gablota' = '["frun10","pary0"]'::jsonb and (r->'osoby'->'kosma'->>'poziom')::int = 10
  and r->'osoby'->'kasia'->'zalozone' = '{}'::jsonb and not (r->'osoby' ? 'nieznany'), r); end $$;
reset role;
-- k1 traci odznakę w postępie → znika z gabloty u innych; spada poziom → złota ramka nie byłaby pokazana
update public.nauka_docs set data = data #- '{odznaki,pary0}' where kolekcja = 'progress' and id = test.k1()::text;
select test.jako('k2@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_wyglad(array['kosma']);
begin perform test.chk('K13b gablota pokazuje tylko zdobyte odznaki', r->'osoby'->'kosma'->'gablota' = '["frun10"]'::jsonb, r); end $$;

-- ---------- K14 przeglądarka nie czyta tabel wprost ----------
do $$ declare ok boolean := false;
begin
  begin perform 1 from public.nauka_zalozone limit 1; exception when insufficient_privilege then ok := true; end;
  perform test.chk('K14 nauka_zalozone niedostępna bez funkcji', ok, null);
end $$;
do $$ declare ok boolean := false;
begin
  begin perform public.nauka_ma(test.k1(), 'ramka:liscie'); exception when insufficient_privilege then ok := true; end;
  perform test.chk('K14b funkcje pomocnicze niedostępne dla strony', ok, null);
end $$;

-- ---------- K15 stary sposób wołania zakupu (jeden argument) dalej działa ----------
reset role;
insert into public.nauka_monety (user_id, delta, zrodlo, klucz, opis) values (test.k1(), 60, 'admin', 'admin:k1kol', 'test');
select test.jako('k1@x.pl'); set role authenticated;
do $$ declare r jsonb := public.nauka_sklep_kup(p_item => 'kolor:las');
begin perform test.chk('K15 nauka_sklep_kup(p_item) bez p_req → ok', (r->>'ok')::boolean and (r->>'cena')::int = 60, r); end $$;
reset role;
do $$ begin raise notice 'OK v24: K1–K15'; end $$;
