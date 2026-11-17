-- Testy M1–M5 dla skrot-v59-motywy-ceny.sql (pętla UX-5, etap G2). Tylko lokalnie (PGlite, po test/v58.sql).
reset role;
select set_config('request.jwt.claims', '', false);
do $$ declare k jsonb := public.nauka_sklep_katalog(); c jsonb := public.nauka_motywy_cfg(); t text; e jsonb;
begin
  -- M1: każdy z 8 motywów w katalogu ma cenę i poziom z konfiguracji (także Riwiera v41 i Jachtklub v42)
  foreach t in array array['pink','sea','bow','noc','meadow','lilia','riwiera','klub'] loop
    select value into e from jsonb_array_elements(k) where value->>'id' = 'motyw:' || t;
    perform test.chk('V59 M1 motyw ' || t || ' w katalogu: cena i poziom jak w cfg', e is not null and e->'cena' = c->t->'cena' and e->'poziom' = c->t->'poziom', jsonb_build_array(e, c->t));
  end loop;
  -- M2: tabela B1
  perform test.chk('V59 M2 ceny: 80/450/200/600/200/350/750/900',
    (select string_agg((c->m->>'cena'), '/' order by o) from unnest(array['pink','sea','bow','noc','meadow','lilia','riwiera','klub']) with ordinality u(m, o)) = '80/450/200/600/200/350/750/900', c);
  perform test.chk('V59 M2 poziomy: 4/4/6/6/8/9/14/16, niewybrane 10 i 12',
    (select string_agg((c->m->>'poziom'), '/' order by o) from unnest(array['pink','sea','bow','noc','meadow','lilia','riwiera','klub']) with ordinality u(m, o)) = '4/4/6/6/8/9/14/16'
    and (c->'pink'->>'poziom_wybor')::int = 10 and (c->'noc'->>'poziom_wybor')::int = 12, c);
  -- M3: reszta katalogu bez zmian (ramki, gablota, zamrożenie są dalej)
  perform test.chk('V59 M3 pozostałe pozycje katalogu zostały', exists (select 1 from jsonb_array_elements(k) where value->>'id' = 'zamrozenie') and exists (select 1 from jsonb_array_elements(k) where value->>'id' = 'ramka:liscie'), null);
end $$;
-- M4: zakup za nową cenę: 100 monet → Jednorożec (80) można kupić, Nocny rejs (450) nie
insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000005901', 'ux5m1@x.pl') on conflict do nothing;
insert into public.nauka_dostep (email, do_kiedy, user_id) values ('ux5m1@x.pl', current_date + 300, '00000000-0000-0000-0000-000000005901') on conflict do nothing;
insert into public.nauka_urzadzenia (user_id, device_id, nazwa) values ('00000000-0000-0000-0000-000000005901', '11111111-1111-1111-1111-000000005901', 'test') on conflict do nothing;
insert into public.nauka_monety (user_id, delta, zrodlo, klucz, opis) values ('00000000-0000-0000-0000-000000005901', 100, 'admin', 'test:v59', 'test') on conflict do nothing;
select test.jako('ux5m1@x.pl'); set role authenticated;
do $$ declare a jsonb := public.nauka_sklep_kup('motyw:pink'); b jsonb := public.nauka_sklep_kup('motyw:sea');
begin
  perform test.chk('V59 M4 Jednorożec za 80 kupiony, saldo 20', (a->>'ok')::boolean and (a->>'saldo')::int = 20, a);
  perform test.chk('V59 M4 Nocny rejs za 450: brak monet', b->>'code' = 'no_coins', b);
  perform test.chk('V59 M5 zalogowany czyta cfg motywów', (public.nauka_motywy_cfg()->'klub'->>'cena')::int = 900, null);
end $$;
reset role;
