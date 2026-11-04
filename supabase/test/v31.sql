-- Testy R1–R10 dla skrot-v31-roczniki.sql (na gałęzi kierunki był to v22). Uruchamiaj po test/v18.sql (te same konta i profile z test/v13.sql).
reset role;
grant usage on schema test to anon; grant execute on function test.chk(text, boolean, jsonb) to anon;
do $$ begin
  perform test.chk('R1 jeden rocznik BM 2026 ze statusem platny',
    (select count(*) = 1 from public.nauka_roczniki where id = 'wefiz-bm-1-st-2026' and status = 'platny'), null);
  perform test.chk('R2 każdy istniejący profil BM 2026 ma rocznik_id',
    not exists (select 1 from public.nauka_profil where rocznik_id is distinct from 'wefiz-bm-1-st-2026')
    and exists (select 1 from public.nauka_profil), (select jsonb_agg(p) from public.nauka_profil p));
end $$;

-- R3: nowy profil (zakładany przez nauka_profil_moj jak w aplikacji) dostaje rocznik BM sam
insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000000231', 'nowy22@x.pl') on conflict do nothing;
insert into public.nauka_dostep (email, do_kiedy, zrodlo, plan) values ('nowy22@x.pl', current_date + 100, 'stripe', 'rok');
select test.jako('nowy22@x.pl'); set role authenticated;
do $$ begin perform public.nauka_profil_moj(); end $$;
reset role;
do $$ begin
  perform test.chk('R3 nowy profil ma rocznik_id BM',
    (select rocznik_id from public.nauka_profil where user_id = '00000000-0000-0000-0000-000000000231') = 'wefiz-bm-1-st-2026', null);
end $$;

-- R4: przeglądarka nie czyta tabel wprost, tylko przez funkcję
set role anon;
do $$ begin
  begin perform 1 from public.nauka_roczniki; raise exception 'BŁĄD R4 anon czyta nauka_roczniki';
  exception when insufficient_privilege then raise notice 'OK R4 tabele zamknięte dla przeglądarki'; end;
end $$;
-- R5: lista roczników działa bez logowania i nie ma danych osób
do $$ declare l jsonb := public.nauka_roczniki_lista(); begin
  perform test.chk('R5 lista roczników: BM, WEFiZ, status',
    jsonb_array_length(l) = 1 and l->0->>'id' = 'wefiz-bm-1-st-2026' and l->0->'kierunek'->>'kod' = 'BM'
    and l->0->'wydzial'->>'kod' = 'WEFiZ' and l->0->>'status' = 'platny' and l::text not like '%@%', l);
end $$;
reset role;

-- R6: drugi rocznik da się dopisać, a zły identyfikator jest odrzucany
insert into public.nauka_kierunki (id, wydzial, kod, nazwa_pl, stopien, tryb) values ('wefiz-zarz-1-st', 'WEFiZ', 'ZARZ', 'Zarządzanie', 1, 'st');
insert into public.nauka_roczniki (id, kierunek_id, nabor) values ('wefiz-zarz-1-st-2026', 'wefiz-zarz-1-st', 2026);
do $$ begin
  begin insert into public.nauka_roczniki (id, kierunek_id, nabor) values ('wefiz-zarz-1-st-2027', 'wefiz-zarz-1-st', 2026);
        raise exception 'BŁĄD R6 przyjęto id niezgodne z naborem';
  exception when check_violation then null; end;
  perform test.chk('R6 drugi rocznik (status plan) i kontrola id',
    (select status from public.nauka_roczniki where id = 'wefiz-zarz-1-st-2026') = 'plan'
    and jsonb_array_length(public.nauka_roczniki_lista()) = 2, public.nauka_roczniki_lista());
end $$;
delete from public.nauka_roczniki where id = 'wefiz-zarz-1-st-2026';
delete from public.nauka_kierunki where id = 'wefiz-zarz-1-st';
-- R7–R10 wybór kierunku w profilu. Konto k1: nowe (bez profilu, bez dostępu) → wybór raz; potem juz_wybrany.
reset role;
insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000000391', 'kier1@x.pl'), ('00000000-0000-0000-0000-000000000392', 'kier2@x.pl');
insert into public.nauka_roczniki (id, kierunek_id, nabor, status) values ('wefiz-bm-1-st-2027', 'wefiz-bm-1-st', 2027, 'plan') on conflict (id) do nothing;
select test.jako('kier1@x.pl'); set role authenticated;
do $$ declare m jsonb := public.nauka_rocznik_moj(); a jsonb; b jsonb; c jsonb;
begin
  perform test.chk('R7 nowe konto: BM domyślnie, jeszcze nie wybrane', m->>'rocznik_id' = 'wefiz-bm-1-st-2026' and not (m->>'wybrany')::boolean, m);
  a := public.nauka_rocznik_ustaw('wefiz-bm-1-st-2027');
  perform test.chk('R8 rocznik ze statusem plan nie do wyboru', a->>'code' = 'zly_rocznik', a);
  b := public.nauka_rocznik_ustaw('wefiz-bm-1-st-2026');
  perform test.chk('R9 wybór zapisany w profilu', (b->>'wybrany')::boolean and b->>'rocznik_id' = 'wefiz-bm-1-st-2026' and b->>'status' = 'platny', b);
  c := public.nauka_rocznik_ustaw('wefiz-bm-1-st-2026');
  perform test.chk('R10 drugi wybór: juz_wybrany', c->>'code' = 'juz_wybrany', c);
end $$;
reset role;
do $$ begin
  perform test.chk('R9b wiersz profilu z rocznikiem i datą wyboru', exists (select 1 from public.nauka_profil
    where user_id = '00000000-0000-0000-0000-000000000391' and rocznik_id = 'wefiz-bm-1-st-2026' and kierunek = 'BM' and rocznik_wybrany_at is not null));
  perform test.chk('R10b anon nie wywoła wyboru', not has_function_privilege('anon', 'public.nauka_rocznik_ustaw(text)', 'execute'));
end $$;
delete from public.nauka_roczniki where id = 'wefiz-bm-1-st-2027';
do $$ begin raise notice 'WSZYSTKIE TESTY v31 OK'; end $$;
