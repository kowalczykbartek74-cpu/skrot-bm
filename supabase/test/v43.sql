-- Test v43: „Dla Ciebie na dziś” w lejku. Dane z test/v35.sql (6 osób, rocznik wefiz-ek-1-st-2026, lekcja ek-lekcja-1).
do $$
declare i int; u uuid;
begin
  for i in 1..6 loop
    u := ('00000000-0000-0000-0000-0000000035' || lpad(i::text, 2, '0'))::uuid;
    -- osoby 1–5: karta dziś; 1–3 lekcja dziś; porzucenia w segmencie 3 (Fruń) u 1–5, pominięty Staś u 1–2, Drabina ukończona dobrze u 1–4
    if i <= 5 then
      insert into public.nauka_zdarzenia (user_id, klient_id, typ, kiedy, dane) values
        (u, gen_random_uuid(), 'activity', now() - interval '2 hours', '{"kind":"ld","koniec":"karta","rola":null,"segmenty":3}'),
        (u, gen_random_uuid(), 'activity', now() - interval '2 hours', '{"kind":"ld","seg":3,"mech":"frun","stan":"porzucona","dobrze":null}');
    end if;
    if i <= 3 then insert into public.nauka_zdarzenia (user_id, klient_id, typ, kiedy, dane) values (u, gen_random_uuid(), 'activity', now() - interval '1 hour', '{"kind":"ld","koniec":"lekcja","rola":"najwazniejsze","segmenty":8}'); end if;
    if i <= 2 then insert into public.nauka_zdarzenia (user_id, klient_id, typ, kiedy, dane) values (u, gen_random_uuid(), 'activity', now() - interval '1 hour', '{"kind":"ld","seg":4,"mech":"stas","stan":"pominieta","dobrze":null}'); end if;
    if i <= 4 then insert into public.nauka_zdarzenia (user_id, klient_id, typ, kiedy, dane) values (u, gen_random_uuid(), 'activity', now() - interval '1 hour', '{"kind":"ld","seg":7,"mech":"drabina","stan":"ukonczona","dobrze":true}'); end if;
    -- zły wpis (mech z niedozwolonymi znakami) się nie liczy
    if i = 1 then insert into public.nauka_zdarzenia (user_id, klient_id, typ, kiedy, dane) values (u, gen_random_uuid(), 'activity', now() - interval '1 hour', '{"kind":"ld","seg":1,"mech":"<script>","stan":"ukonczona"}'); end if;
    -- „czy uczy”: osoby 1–5 robiły lekcję ek-lekcja-2 w bloku 20 dni temu; potem powtórki po ≥ 7 dniach: lekcja 2 dobrze, lekcja 1 (spoza bloku) źle
    if i <= 5 then
      insert into public.nauka_zdarzenia (user_id, klient_id, typ, kiedy, dane) values (u, gen_random_uuid(), 'activity', now() - interval '20 days', '{"kind":"ld","materialId":"ek-lekcja-2","ok":3,"total":4,"ld":"najwazniejsze"}');
      insert into public.nauka_powtorki_log (user_id, klucz, ok, first, wiek, at) values (u, 'q:ek-lekcja-2:z', true, true, 9, now() - interval '2 days'), (u, 'ek-lekcja-1:f', false, true, 9, now() - interval '2 days');
    end if;
  end loop;
end $$;

do $$ declare r jsonb; ld jsonb; d text := to_char((now() at time zone 'Europe/Warsaw')::date, 'YYYY-MM-DD'); begin
  perform public.nauka_lejek_policz();
  select dane into r from public.nauka_lejek_dzien where rocznik_id = 'wefiz-ek-1-st-2026' order by dzien desc limit 1;
  ld := r->'ld';
  perform test.chk('D1 lejek ma nadal swoje pola (v35) i „ld”', r ? 'lejek' and r ? 'retencja' and r ? 'uczy' and ld is not null, r);
  perform test.chk('D2 dziś: kartę skończyło 5 osób, lekcję 3 osoby (3 lekcje)',
    (select x from jsonb_array_elements(ld->'dni') x where x->>'dzien' = d) @> '{"karta_osoby":5,"karty":5,"lekcja_osoby":3,"lekcje":3}', ld->'dni');
  perform test.chk('D3 przerwania: segment 3, 5 porzuceń, 5 osób', (ld->'segmenty') @> '[{"seg":3,"porzucone":5,"osoby":5}]', ld->'segmenty');
  perform test.chk('D4 mechaniki: Fruń porzucony 5×, Drabina 4× ukończona dobrze, Staś 2× pominięty; zły wpis pominięty',
    (ld->'mechaniki') @> '[{"mech":"frun","porzucone":5,"osoby":5},{"mech":"drabina","ukonczone":4,"dobrze":4},{"mech":"stas","pominiete":2}]'
    and not (ld->'mechaniki')::text like '%script%', ld->'mechaniki');
  perform test.chk('D5 czy uczy: tematy z bloku 5/5 dobrze, spoza bloku z nowych wpisów źle',
    (ld->'uczy'->'ld') @> '{"odp":5,"ok":5,"osoby":5}' and (ld->'uczy'->'inne'->>'odp')::int >= 5, ld->'uczy');
  perform test.chk('D6 osoby w bloku (28 dni)', (ld->>'osoby')::int = 5, ld->'osoby');
  select dane into r from public.nauka_lejek_dzien where rocznik_id = '*' order by dzien desc limit 1;
  perform test.chk('D7 „*” = wszystkie roczniki też ma „ld”', r->'ld'->'segmenty' @> '[{"seg":3,"porzucone":5}]', r->'ld');
end $$;

set role authenticated;
do $$ begin
  begin perform public.nauka_lejek_ld('*'); perform test.chk('D8 przeglądarka nie woła nauka_lejek_ld', false, null);
  exception when insufficient_privilege then perform test.chk('D8 przeglądarka nie woła nauka_lejek_ld', true, null); end;
end $$;
reset role;
do $$ begin raise notice 'WSZYSTKIE testy v43 OK'; end $$;
