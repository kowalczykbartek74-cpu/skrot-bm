-- Skrót: naprawa zepsutych polskich znaków w bazie (wygenerowane: node scripts/funkcje-sql.mjs --naprawa).
-- Wklej w Supabase → SQL Editor → Run. Kopiuj z github.com (przycisk „Copy raw file”), nie przez Terminal.
-- Można uruchamiać wiele razy. Funkcję podmienia tylko wtedy, gdy ta w bazie ma zepsute litery (wtedy na najnowszą wersję
-- z repo), więc niczego, co działa, nie cofa. Na końcu lista: co naprawiono i co dalej jest zepsute.

-- Strażnik kodowania: polskie litery wpisane wprost muszą być równe tym samym literom zapisanym kodami (same znaki ASCII).
-- Gdy plik przeszedł przez Terminal albo zły schowek, litery z pierwszej strony się psują („Ňā”, „√≥”), a kody nie,
-- więc warunek nie przechodzi i plik zatrzymuje się na pierwszej instrukcji, zanim cokolwiek zmieni.
-- Ten blok wklejamy na sam początek każdej nowej migracji (od v44); pilnuje tego tests/migracje.test.js.
do $$ begin
  if 'ąćęłńóśźż' <> U&'\0105\0107\0119\0142\0144\00F3\015B\017A\017C' then
    raise exception 'Polskie znaki doszły zepsute. Skopiuj plik z github.com (Raw), nie przez Terminal.';
  end if;
end $$;

create temp table if not exists znaki_naprawione (co text);
truncate znaki_naprawione;

-- nauka_wydzialy: jak w skrot-v31-roczniki.sql
insert into public.nauka_wydzialy (kod, nazwa_pl, nazwa_en, kampus, dos_url)
values ('WEFiZ', 'Wydział Ekonomii, Finansów i Zarządzania', 'Faculty of Economics, Finance and Management',
        'Cukrowa 8', 'https://dos.usz.edu.pl/cukrowa/zajecia-cukrowa/')
on conflict (kod) do update set nazwa_pl = excluded.nazwa_pl, nazwa_en = excluded.nazwa_en,
  kampus = excluded.kampus, dos_url = excluded.dos_url;

-- nauka_kierunki: jak w skrot-v31-roczniki.sql
insert into public.nauka_kierunki (id, wydzial, kod, nazwa_pl, nazwa_en, stopien, tryb, jezyk)
values ('wefiz-bm-1-st', 'WEFiZ', 'BM', 'Business Management', 'Business Management', 1, 'st', 'en')
on conflict (id) do update set nazwa_pl = excluded.nazwa_pl, nazwa_en = excluded.nazwa_en, jezyk = excluded.jezyk;

-- nazwy kierunków jak w skrot-v34-oczekujacy.sql (29)
update public.nauka_kierunki k set nazwa_pl = v.nazwa
  from (values
    ('wefiz-af-2-st', 'Audyt finansowy'),
    ('wefiz-biwg-1-st', 'Business Intelligence w gospodarce'),
    ('wefiz-bm-1-st', 'Business Management'),
    ('wefiz-bm-2-st', 'Business Management'),
    ('wefiz-ds-2-st', 'Data Science'),
    ('wefiz-eaia-1-st', 'Economics and IT Applications'),
    ('wefiz-ek-1-st', 'Ekonomia'),
    ('wefiz-ek-2-st', 'Ekonomia'),
    ('wefiz-fir-1-st', 'Finanse i Rachunkowość'),
    ('wefiz-fir-2-st', 'Finanse i Rachunkowość'),
    ('wefiz-gn-1-st', 'Gospodarka Nieruchomościami'),
    ('wefiz-gpi-1-st', 'Gospodarka Przestrzenna inż.'),
    ('wefiz-iie-1-st', 'Informatyka i Ekonometria'),
    ('wefiz-iwb-1-st', 'Informatyka w Biznesie'),
    ('wefiz-iwb-2-st', 'Informatyka w Biznesie'),
    ('wefiz-kipb-1-st', 'Komunikacja i psychologia w biznesie'),
    ('wefiz-kipb-2-st', 'Komunikacja i psychologia w biznesie'),
    ('wefiz-log-1-st', 'Logistyka'),
    ('wefiz-log-2-st', 'Logistyka'),
    ('wefiz-li-1-st', 'Logistyka inż.'),
    ('wefiz-mkt-2-st', 'Marketing'),
    ('wefiz-mbt-2-st', 'Międzynarodowy biznes turystyczny'),
    ('wefiz-pii-1-st', 'Przedsiębiorczość i Inwestycje'),
    ('wefiz-rn-2-st', 'Rynek Nieruchomości'),
    ('wefiz-tir-1-st', 'Turystyka i Rekreacja'),
    ('wefiz-zarz-1-st', 'Zarządzanie'),
    ('wefiz-zarz-2-st', 'Zarządzanie'),
    ('wefiz-zloz-1-st', 'Zarządzanie Logistyczne w Ochronie Zdrowia'),
    ('wefiz-zoze-1-st', 'Zarządzanie odnawialnymi źródłami energii')) v(id, nazwa)
 where k.id = v.id and k.nazwa_pl ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]';

-- public.admin_ok(text): skrot-v12-zabezpieczenia.sql
do $napraw$ begin
  if to_regprocedure('public.admin_ok(text)') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.admin_ok(text)') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.admin_ok(p_haslo text) returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_ip text := coalesce(public.nauka_ip(), '');
  v_ok boolean;
begin
  if (select count(*) from public.admin_proby p where p.at > now() - interval '15 minutes' and p.ip = v_ip) >= 10
     or (select count(*) from public.admin_proby p where p.at > now() - interval '15 minutes') >= 60 then
    raise exception 'Za dużo prób hasła. Spróbuj za 15 minut.';
  end if;
  v_ok := exists (select 1 from public.admin_haslo
                  where hash = encode(extensions.digest(coalesce(p_haslo, ''), 'sha256'), 'hex'));
  if not v_ok then
    insert into public.admin_proby (ip) values (v_ip);
    delete from public.admin_proby where at < now() - interval '1 day';
  end if;
  return v_ok;
end $$$tresc$;
    insert into znaki_naprawione values ('public.admin_ok(text) (skrot-v12-zabezpieczenia.sql)');
  end if;
end $napraw$;

-- public.nauka_admin_aktywnosc(): skrot-v11-aktywnosc.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_admin_aktywnosc()') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_admin_aktywnosc()') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_admin_aktywnosc() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  konta jsonb;
begin
  if not public.nauka_admin() then raise exception 'brak_dostepu'; end if;

  -- Wszystkie konta z Supabase Auth (data założenia i ostatniego logowania). Gdyby dostęp do auth był zablokowany,
  -- panel i tak działa, tylko bez tej listy.
  begin
    select coalesce(jsonb_agg(jsonb_build_object(
             'user_id', u.id, 'email', lower(coalesce(u.email, '')), 'od', u.created_at, 'logowanie', u.last_sign_in_at,
             'ostatnio', (select max(o.last_seen) from public.nauka_obecnosc o where o.user_id = u.id),
             'platny', exists (select 1 from public.nauka_dostep d where d.do_kiedy >= current_date
                                 and (d.user_id = u.id or d.email = lower(coalesce(u.email, '')))),
             'admin', exists (select 1 from public.nauka_admini a where a.email = lower(coalesce(u.email, '')))
           ) order by greatest(u.last_sign_in_at,
                               (select max(o.last_seen) from public.nauka_obecnosc o where o.user_id = u.id)) desc nulls last), '[]'::jsonb)
      into konta
      from auth.users u;
  exception when others then
    konta := null;
  end;

  return jsonb_build_object(
    'teraz', now(),
    'online', coalesce((
      select jsonb_agg(jsonb_build_object('user_id', o.user_id, 'email', o.email, 'nazwa', o.nazwa, 'od', o.od, 'last_seen', o.last_seen)
                       order by o.od)
      from public.nauka_obecnosc o where o.last_seen >= now() - public.nauka_online_okno()), '[]'::jsonb),
    'dzis', (select count(distinct w.user_id) from public.nauka_wizyty w where w.koniec >= date_trunc('day', now() at time zone 'Europe/Warsaw') at time zone 'Europe/Warsaw'),
    'tydzien', (select count(distinct w.user_id) from public.nauka_wizyty w where w.koniec >= now() - interval '7 days'),
    'logowania', coalesce((
      select jsonb_agg(jsonb_build_object('user_id', l.user_id, 'email', l.email, 'metoda', l.metoda, 'nazwa', l.nazwa, 'ip', l.ip, 'at', l.at) order by l.at desc)
      from (select * from public.nauka_logowania order by at desc limit 300) l), '[]'::jsonb),
    'wizyty', coalesce((
      select jsonb_agg(jsonb_build_object('user_id', w.user_id, 'email', w.email, 'nazwa', w.nazwa, 'od', w.od, 'koniec', w.koniec) order by w.od desc)
      from (select * from public.nauka_wizyty order by od desc limit 300) w), '[]'::jsonb),
    'konta', konta
  );
end $$$tresc$;
    insert into znaki_naprawione values ('public.nauka_admin_aktywnosc() (skrot-v11-aktywnosc.sql)');
  end if;
end $napraw$;

-- public.nauka_admin_oczekujacy(): skrot-v34-oczekujacy.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_admin_oczekujacy()') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_admin_oczekujacy()') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_admin_oczekujacy() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.nauka_admin() then return jsonb_build_object('ok', false, 'code', 'not_admin'); end if;
  return jsonb_build_object('ok', true,
    'potwierdzone', (select count(*) from public.nauka_oczekujacy where status = 'confirmed'),
    'czeka', (select count(*) from public.nauka_oczekujacy where status = 'pending'),
    'kierunki', coalesce((select jsonb_agg(x order by x.n desc, x.nazwa) from (
        select o.kierunek_id as id, k.nazwa_pl as nazwa, k.stopien, o.rok, count(*) as n
          from public.nauka_oczekujacy o join public.nauka_kierunki k on k.id = o.kierunek_id
         where o.status = 'confirmed' group by o.kierunek_id, k.nazwa_pl, k.stopien, o.rok) x), '[]'::jsonb),
    'wpisane', coalesce((select jsonb_agg(x order by x.n desc, x.klucz) from (
        select regexp_replace(lower(o.kierunek_tekst), '[^a-ząćęłńóśźż0-9]+', ' ', 'g') as klucz,
               (array_agg(o.kierunek_tekst order by o.created_at))[1:3] as przyklady, count(*) as n
          from public.nauka_oczekujacy o
         where o.status = 'confirmed' and o.kierunek_id is null group by 1) x), '[]'::jsonb),
    'zrodla', coalesce((select jsonb_object_agg(coalesce(z, '-'), n) from (
        select zrodlo as z, count(*) as n from public.nauka_oczekujacy where status = 'confirmed' group by zrodlo) s), '{}'::jsonb));
end $$$tresc$;
    insert into znaki_naprawione values ('public.nauka_admin_oczekujacy() (skrot-v34-oczekujacy.sql)');
  end if;
end $napraw$;

-- public.nauka_boss_odswiez(): skrot-v15-gry2.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_boss_odswiez()') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_boss_odswiez()') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_boss_odswiez() returns void
language plpgsql security definer set search_path = '' as $$
declare c jsonb := public.nauka_gry2_cfg(); d date := public.nauka_dzis(); b record;
begin
  insert into public.nauka_boss (id, sid, typ, tytul, termin, start, grupy, hp)
  select x.id, x.data->>'subjectId', x.data->>'type', x.data->>'title', (x.data->>'date')::date,
         greatest(d, (x.data->>'date')::date - (c->>'boss_dni')::int), gr.g, public.nauka_boss_hp(gr.g)
    from public.nauka_docs x
    cross join lateral (select coalesce(array(select jsonb_array_elements_text(
                          case when jsonb_typeof(x.data->'groups') = 'array' then x.data->'groups' else '[]'::jsonb end)), '{}') g) gr
   where x.kolekcja = 'deadlines'
     and x.data->>'type' in ('kolokwium', 'egzamin')
     and coalesce(x.data->>'subjectId', '') <> ''
     and coalesce((x.data->>'approx')::boolean, false) = false
     and x.data->>'date' ~ '^\d{4}-\d{2}-\d{2}$'
     and (x.data->>'date')::date > d
     and (x.data->>'date')::date <= d + (c->>'boss_dni')::int
  on conflict (id) do nothing;
  -- termin przeniesiony przez starostę: boss idzie za nim (życie bez zmian)
  update public.nauka_boss nb set termin = (x.data->>'date')::date
    from public.nauka_docs x
   where x.kolekcja = 'deadlines' and x.id = nb.id and nb.pokonany_at is null
     and x.data->>'date' ~ '^\d{4}-\d{2}-\d{2}$' and (x.data->>'date')::date <> nb.termin;
  for b in select * from public.nauka_boss where pokonany_at is null and termin > d - 1 and not ukryty loop
    if (select coalesce(sum(ciosy), 0) from public.nauka_boss_ciosy(b.id)) >= b.hp then
      update public.nauka_boss set pokonany_at = now() where id = b.id and pokonany_at is null;
    end if;
  end loop;
end $$$tresc$;
    insert into znaki_naprawione values ('public.nauka_boss_odswiez() (skrot-v15-gry2.sql)');
  end if;
end $napraw$;

-- public.nauka_duet_rozlicz(uuid, date): skrot-v37-paczka.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_duet_rozlicz(uuid, date)') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_duet_rozlicz(uuid, date)') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_duet_rozlicz(p_duet uuid, p_tydzien date) returns int
language plpgsql volatile security definer set search_path = '' as $$
declare
  c jsonb := public.nauka_paczka_cfg();
  d public.nauka_duety; v_klucz text := 'misja:duet:' || p_tydzien::text; nagroda int := (c->>'duet_nagroda')::int;
  u uuid; n int; dodane int := 0; v_dzien date;
begin
  select * into d from public.nauka_duety x where x.id = p_duet and x.stan = 'aktywny';
  if not found or d.od is null or d.od > p_tydzien + 6 or p_tydzien > public.nauka_dzis() then return 0; end if;
  -- obie osoby już mają nagrodę za ten tydzień: nic nie liczymy
  if (select count(*) from public.nauka_monety m where m.klucz = v_klucz and m.user_id in (d.user_id, d.partner_id)) >= 2 then return 0; end if;
  if public.nauka_duet_sesje(d.user_id, d.od, p_tydzien) + public.nauka_duet_sesje(d.partner_id, d.od, p_tydzien) < (c->>'duet_cel')::int then
    return 0;
  end if;
  v_dzien := least(p_tydzien + 6, public.nauka_dzis());
  -- blokady w stałej kolejności (bez zakleszczeń), jak nauka_misja_odbierz
  for u in select x from unnest(array[d.user_id, d.partner_id]) x order by x loop
    perform pg_advisory_xact_lock(hashtext('nauka_mon:' || u::text));
  end loop;
  foreach u in array array[d.user_id, d.partner_id] loop
    continue when not public.nauka_paczka_moze_zarobic(u);
    continue when public.nauka_saldo(u) + nagroda > (public.nauka_mon_cfg()->>'max_saldo')::int;
    insert into public.nauka_monety (user_id, dzien, delta, zrodlo, klucz, opis)
    values (u, v_dzien, nagroda, 'misja', v_klucz, 'Duet tygodnia')
    on conflict (user_id, klucz) do nothing;
    get diagnostics n = row_count;
    dodane := dodane + n;
  end loop;
  return dodane;
end $$$tresc$;
    insert into znaki_naprawione values ('public.nauka_duet_rozlicz(uuid, date) (skrot-v37-paczka.sql)');
  end if;
end $napraw$;

-- public.nauka_gablota_ustaw(text[]): skrot-v24-kosmetyki.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_gablota_ustaw(text[])') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_gablota_ustaw(text[])') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_gablota_ustaw(p_odznaki text[]) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); m int; zdob text[]; o text; lista text[] := '{}';
begin
  if u is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  m := public.nauka_gablota_miejsca(u);
  zdob := public.nauka_postep_klucze(public.nauka_postep(u), 'odznaki');
  foreach o in array coalesce(p_odznaki, '{}') loop
    if not o = any(lista) then lista := lista || o; end if;     -- bez powtórzeń, kolejność zostaje
  end loop;
  if cardinality(lista) > m then return jsonb_build_object('ok', false, 'code', 'too_many', 'miejsca', m); end if;
  if exists (select 1 from unnest(lista) x where not x = any(zdob)) then
    return jsonb_build_object('ok', false, 'code', 'not_earned');
  end if;
  insert into public.nauka_gablota (user_id, odznaki) values (u, lista)
  on conflict (user_id) do update set odznaki = excluded.odznaki, updated_at = now();
  return jsonb_build_object('ok', true, 'odznaki', to_jsonb(lista), 'miejsca', m);
end $$$tresc$;
    insert into znaki_naprawione values ('public.nauka_gablota_ustaw(text[]) (skrot-v24-kosmetyki.sql)');
  end if;
end $napraw$;

-- public.nauka_gra_koniec(uuid, int, int, int): skrot-v15-gry2.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_gra_koniec(uuid, int, int, int)') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_gra_koniec(uuid, int, int, int)') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_gra_koniec(p_run uuid, p_wynik int, p_czas_ms int, p_bledy int default 0)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  c jsonb := public.nauka_rp_cfg(); c2 jsonb := public.nauka_gry2_cfg();
  r public.nauka_gry; v_s numeric; v_max int; v_status text := 'ok'; v_powod text; v_pkt int := 0; v_raw int;
  v_rekord int; v_nowy boolean; v_dobre int;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  select * into r from public.nauka_gry g where g.id = p_run and g.user_id = auth.uid() for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'bad_run'); end if;
  if r.status <> 'trwa' then return jsonb_build_object('ok', false, 'code', 'already_finished'); end if;
  v_s := extract(epoch from (now() - r.start));
  if p_wynik is null or p_wynik < 0 or p_wynik > 100000 then v_status := 'podejrzana'; v_powod := 'wynik spoza zakresu'; end if;
  if v_status = 'ok' and p_czas_ms is not null and p_czas_ms > v_s * 1000 + 5000 then
    v_status := 'podejrzana'; v_powod := 'czas z przeglądarki dłuższy niż na serwerze';
  end if;
  if v_status = 'ok' then
    v_max := case r.gra
      when 'frun'    then ceil(v_s * 1.1)::int + 3
      when 'przejdz' then ceil(v_s * 5)::int + 5
      when 'pary'    then 10
      when 'drabina' then 12 end;
    if p_wynik > v_max then v_status := 'podejrzana'; v_powod := format('wynik %s > możliwe %s w %ss', p_wynik, v_max, round(v_s)); end if;
    if r.gra = 'pary' and p_wynik > 0 and v_s < p_wynik * 1.2 then v_status := 'podejrzana'; v_powod := 'plansza za szybko'; end if;
    if r.gra = 'drabina' and v_status = 'ok' then
      -- każdy szczebel = dobra odpowiedź sprawdzona przez bazę w tej rundzie
      select count(*) into v_dobre from public.nauka_odp o where o.run_id = r.id and o.ok;
      if p_wynik > v_dobre then v_status := 'podejrzana'; v_powod := format('szczeble %s > dobre odpowiedzi %s', p_wynik, v_dobre);
      elsif p_wynik > 0 and v_s < p_wynik * (c2->>'drabina_s_min')::int then v_status := 'podejrzana'; v_powod := 'drabina za szybko';
      end if;
    end if;
  end if;
  if v_status = 'ok' and public.nauka_rp_mozna() then
    v_raw := case r.gra
      when 'frun'    then p_wynik / 2
      when 'przejdz' then p_wynik / 5
      when 'pary'    then 2 * p_wynik + case when coalesce(p_bledy, 0) = 0 and p_wynik >= 6 then 10 else 0 end
      when 'drabina' then case when p_wynik >= 12 then 20 when p_wynik >= 8 then 10 when p_wynik >= 4 then 5 else 0 end end;
    v_raw := least(v_raw, (c->>'max_wynik_runda')::int);
    if (select count(*) from public.nauka_gry g where g.user_id = auth.uid() and g.gra = r.gra and g.status = 'ok' and g.pkt > 0
          and g.start >= (public.nauka_dzis()::timestamp at time zone 'Europe/Warsaw')) < (c->>'rundy_z_pkt_dzien')::int then
      v_pkt := public.nauka_rp_dodaj(auth.uid(), 'wynik', 'r:' || r.id::text, r.sid, v_raw, r.id);
    end if;
  end if;
  select max(g.wynik) into v_rekord from public.nauka_gry g
   where g.user_id = auth.uid() and g.gra = r.gra and g.status = 'ok' and g.id <> r.id
     and (r.gra <> 'pary' or g.sid is not distinct from r.sid);
  v_nowy := v_status = 'ok' and p_wynik > coalesce(v_rekord, 0);
  update public.nauka_gry set koniec = now(), wynik = p_wynik, czas_ms = p_czas_ms, bledy = p_bledy,
    status = v_status, powod = v_powod, pkt = v_pkt where id = r.id;
  return jsonb_build_object('ok', true, 'status', v_status, 'pkt', v_pkt,
    'rekord', greatest(coalesce(v_rekord, 0), case when v_status = 'ok' then p_wynik else 0 end), 'nowy_rekord', v_nowy,
    'pkt_runda', (select coalesce(sum(x.pkt), 0) from public.nauka_rp x where x.user_id = auth.uid() and x.run_id = r.id));
end $$$tresc$;
    insert into znaki_naprawione values ('public.nauka_gra_koniec(uuid, int, int, int) (skrot-v15-gry2.sql)');
  end if;
end $napraw$;

-- public.nauka_gra_start(text, text): skrot-v15-gry2.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_gra_start(text, text)') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_gra_start(text, text)') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_gra_start(p_gra text, p_sid text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare c jsonb := public.nauka_rp_cfg(); v_id uuid; v_seed int;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_rp_mozna() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  if p_gra not in ('frun','pary','przejdz','drabina') then return jsonb_build_object('ok', false, 'code', 'bad_game'); end if;
  if p_sid is not null and char_length(p_sid) > 80 then return jsonb_build_object('ok', false, 'code', 'bad_subject'); end if;
  if (select count(*) from public.nauka_gry g where g.user_id = auth.uid() and g.start >= (public.nauka_dzis()::timestamp at time zone 'Europe/Warsaw'))
     >= (c->>'max_rund_dzien')::int then
    return jsonb_build_object('ok', false, 'code', 'too_many_runs');
  end if;
  -- stare, niezakończone rundy tej osoby zamykamy jako porzucone
  update public.nauka_gry set status = 'porzucona', koniec = now()
   where user_id = auth.uid() and status = 'trwa' and start < now() - interval '2 hours';
  v_seed := floor(random() * 2147483646)::int + 1;
  insert into public.nauka_gry (user_id, gra, sid, seed) values (auth.uid(), p_gra, p_sid, v_seed) returning id into v_id;
  -- sprzątanie historii starszej niż 12 miesięcy (tanio, przy okazji)
  delete from public.nauka_odp where created_at < now() - interval '12 months';
  delete from public.nauka_gry where start < now() - interval '12 months';
  delete from public.nauka_rp  where dzien < public.nauka_dzis() - 400;
  return jsonb_build_object('ok', true, 'run', v_id, 'seed', v_seed);
end $$$tresc$;
    insert into znaki_naprawione values ('public.nauka_gra_start(text, text) (skrot-v15-gry2.sql)');
  end if;
end $napraw$;

-- public.nauka_gry2_cfg(): skrot-v15-gry2.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_gry2_cfg()') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_gry2_cfg()') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_gry2_cfg() returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object(
    'haslo_min', 5, 'haslo_max', 9,           -- długość słowa (same litery A–Z)
    'haslo_proby', 6,
    'haslo_pkt', '[0,20,20,15,12,10,8]'::jsonb, -- punkty za rozwiązanie w 1…6 próbie (indeks = numer próby)
    'drabina_progi', '[4,8]'::jsonb,           -- szczeble gwarantowane
    'drabina_s_min', 2,                       -- min. sekund na pytanie (kontrola wyniku)
    'boss_dni', 7,                            -- boss pojawia się tyle dni przed terminem
    'boss_hp_osoba', 12, 'boss_hp_min', 150,  -- życie = 12 × aktywne osoby (14 dni), co najmniej 150
    'boss_cios_dzien', 40,                    -- max ciosów jednej osoby dziennie
    'boss_cios_zadanie', 3,                   -- zadanie liczbowe = 3 ciosy, ABCD = 1
    'boss_min_ciosow', 10,                    -- tyle ciosów, żeby odebrać nagrodę
    'boss_pkt', 50, 'boss_odbior_dni', 14,
    'min_osob', 5
  )
$$$tresc$;
    insert into znaki_naprawione values ('public.nauka_gry2_cfg() (skrot-v15-gry2.sql)');
  end if;
end $napraw$;

-- public.nauka_haslo_dzis(): skrot-v15-gry2.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_haslo_dzis()') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_haslo_dzis()') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_haslo_dzis() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  c jsonb := public.nauka_gry2_cfg(); d date := public.nauka_dzis(); s public.nauka_haslo_dni; g public.nauka_haslo;
  v_koniec boolean; v_stat jsonb; v_seria int; v_d date;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  s := public.nauka_haslo_slowo(d);
  if s.dzien is null then return jsonb_build_object('ok', false, 'code', 'no_words'); end if;
  select * into g from public.nauka_haslo where user_id = auth.uid() and dzien = d;
  v_koniec := g.wynik is not null;
  -- seria: kolejne dni z rozwiązanym Hasłem, kończąca się dziś (albo wczoraj, gdy dziś jeszcze nie rozwiązane)
  v_seria := 0; v_d := case when g.wynik > 0 then d else d - 1 end;
  while exists (select 1 from public.nauka_haslo h where h.user_id = auth.uid() and h.dzien = v_d and h.wynik > 0) loop
    v_seria := v_seria + 1; v_d := v_d - 1;
  end loop;
  -- statystyki dnia: tylko po końcu własnej gry i przy ≥ min_osob zakończonych
  if v_koniec then
    select case when count(*) >= (c->>'min_osob')::int then jsonb_build_object(
             'grali', count(*), 'zgadli', count(*) filter (where wynik > 0),
             'rozklad', (select jsonb_agg((select count(*) from public.nauka_haslo x where x.dzien = d and x.wynik = k) order by k)
                           from generate_series(0, (c->>'haslo_proby')::int) k)) end
      into v_stat from public.nauka_haslo where dzien = d and wynik is not null;
  end if;
  return jsonb_build_object('ok', true, 'dzien', d, 'nr', (select count(*) from public.nauka_haslo_dni x where x.dzien <= d),  -- numer Hasła (od pierwszego dnia gry)
    'dlugosc', char_length(s.slowo), 'sid', s.sid, 'max', (c->>'haslo_proby')::int,
    'proby', coalesce(to_jsonb(g.proby), '[]'::jsonb), 'wzory', coalesce(to_jsonb(g.wzory), '[]'::jsonb),
    -- po 3 nieudanych próbach podpowiedź: definicja z ukrytym słowem
    'podpowiedz', case when coalesce(array_length(g.proby, 1), 0) >= 3 and s.def is not null
                       then regexp_replace(s.def, s.term, repeat('_', char_length(s.term)), 'gi') end,
    'koniec', v_koniec, 'wynik', g.wynik, 'pkt', coalesce(g.pkt, 0), 'seria', coalesce(v_seria, 0),
    'slowo', case when v_koniec then s.term end, 'pl', case when v_koniec then s.pl end,
    'def', case when v_koniec then s.def end, 'mid', case when v_koniec then s.mid end,
    'stat', v_stat);
end $$$tresc$;
    insert into znaki_naprawione values ('public.nauka_haslo_dzis() (skrot-v15-gry2.sql)');
  end if;
end $napraw$;

-- public.nauka_haslo_proba(text): skrot-v15-gry2.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_haslo_proba(text)') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_haslo_proba(text)') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_haslo_proba(p_proba text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  c jsonb := public.nauka_gry2_cfg(); d date := public.nauka_dzis(); s public.nauka_haslo_dni; g public.nauka_haslo;
  v_p text := upper(btrim(coalesce(p_proba, ''))); v_w text; v_n int; v_max int := (c->>'haslo_proby')::int; v_pkt int := 0;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  s := public.nauka_haslo_slowo(d);
  if s.dzien is null then return jsonb_build_object('ok', false, 'code', 'no_words'); end if;
  if v_p !~ '^[A-Z]+$' then return jsonb_build_object('ok', false, 'code', 'bad_letters'); end if;
  if char_length(v_p) <> char_length(s.slowo) then return jsonb_build_object('ok', false, 'code', 'bad_length'); end if;
  insert into public.nauka_haslo (user_id, dzien) values (auth.uid(), d) on conflict do nothing;
  select * into g from public.nauka_haslo where user_id = auth.uid() and dzien = d for update;
  if g.wynik is not null then return jsonb_build_object('ok', false, 'code', 'finished'); end if;
  if v_p = any (g.proby) then return jsonb_build_object('ok', false, 'code', 'repeated'); end if;
  v_w := public.nauka_haslo_wzor(s.slowo, v_p);
  v_n := coalesce(array_length(g.proby, 1), 0) + 1;
  -- retencja: przy pierwszej próbie dnia (tanio, przy okazji) usuwamy próby wszystkich osób starsze niż 12 miesięcy.
  -- nauka_haslo_dni zostaje (słowa dnia służą do niepowtarzania słów).
  if v_n = 1 then
    delete from public.nauka_haslo where dzien < (d - interval '12 months')::date;
  end if;
  g.proby := g.proby || v_p; g.wzory := g.wzory || v_w;
  if v_p = s.slowo then
    g.wynik := v_n;
    if public.nauka_rp_mozna() then
      v_pkt := public.nauka_rp_dodaj(auth.uid(), 'haslo', 'h:' || d::text, s.sid, (c->'haslo_pkt'->>v_n)::int);
    end if;
  elsif v_n >= v_max then
    g.wynik := 0;
  end if;
  update public.nauka_haslo set proby = g.proby, wzory = g.wzory, wynik = g.wynik, pkt = v_pkt,
    koniec = case when g.wynik is not null then now() end
   where user_id = auth.uid() and dzien = d;
  return jsonb_build_object('ok', true, 'wzor', v_w, 'proba', v_n, 'koniec', g.wynik is not null, 'wynik', g.wynik, 'pkt', v_pkt);
end $$$tresc$;
    insert into znaki_naprawione values ('public.nauka_haslo_proba(text) (skrot-v15-gry2.sql)');
  end if;
end $napraw$;

-- public.nauka_importy_retencja(): skrot-v40-importy.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_importy_retencja()') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_importy_retencja()') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_importy_retencja() returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare k int := 0; x record;
begin
  for x in select i.id, i.pdf_sciezka from public.nauka_importy i
            where i.pdf_sciezka is not null and i.pdf_usuniety_at is null
              and (i.stan in ('zatwierdzony', 'odrzucony') or i.utworzony_at < now() - interval '30 days') loop
    begin
      if to_regclass('storage.objects') is not null then
        execute 'delete from storage.objects where bucket_id = ''importy'' and name = $1' using x.pdf_sciezka;
        update public.nauka_importy i set pdf_usuniety_at = now() where i.id = x.id;
        k := k + 1;
      end if;
    exception when others then
      raise notice 'importy: pliku % nie da się skasować z SQL (%); skasuje go funkcja Edge przy najbliższym użyciu', x.pdf_sciezka, sqlerrm;
    end;
  end loop;
  return jsonb_build_object('ok', true, 'usuniete', k);
end $$$tresc$;
    insert into znaki_naprawione values ('public.nauka_importy_retencja() (skrot-v40-importy.sql)');
  end if;
end $napraw$;

-- public.nauka_ja(): skrot-v16-proba.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_ja()') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_ja()') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_ja() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'email', public.nauka_email(),
    'admin', public.nauka_admin(),
    'platny', public.nauka_platny(),
    'czytelnik', public.nauka_platny(),
    'platny_konto', public.nauka_admin() or public.nauka_platny_konto(),
    'dostep_do', (select max(d.do_kiedy) from public.nauka_dostep d
                  where d.email = public.nauka_email() or d.user_id = auth.uid()),
    'plan', (select d.plan from public.nauka_dostep d
             where d.email = public.nauka_email() or d.user_id = auth.uid()
             order by d.do_kiedy desc limit 1),
    -- Koniec okresu próbnego, tylko gdy to on daje dostęp (opłacony dostęp wygrywa).
    'proba_do', case when public.nauka_admin() or exists (
                  select 1 from public.nauka_dostep d
                  where d.do_kiedy >= current_date and (d.email = public.nauka_email() or d.user_id = auth.uid()))
                then null else public.nauka_proba_do() end,
    -- Czy przycisk „Wypróbuj” ma sens: nie było okresu próbnego ani opłaconego dostępu.
    'proba_mozna', not public.nauka_admin()
                   and not exists (select 1 from public.nauka_proby p where p.user_id = auth.uid() or p.email = public.nauka_email())
                   and not exists (select 1 from public.nauka_dostep d where d.email = public.nauka_email() or d.user_id = auth.uid()),
    'proba_dni', public.nauka_proba_dni()
  )
$$$tresc$;
    insert into znaki_naprawione values ('public.nauka_ja() (skrot-v16-proba.sql)');
  end if;
end $napraw$;

-- public.nauka_kierunek_stat(): skrot-v13-gry.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_kierunek_stat()') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_kierunek_stat()') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_kierunek_stat() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  c jsonb := public.nauka_rp_cfg();
  v_t date := public.nauka_tydzien(public.nauka_dzis());
  v_od timestamptz := (v_t::timestamp at time zone 'Europe/Warsaw');
  v_min_o int := (c->>'min_osob_stat')::int; v_min_a int := (c->>'min_odp_stat')::int;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_platny() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  return jsonb_build_object('ok', true, 'tydzien', v_t,
    'aktywni', (select count(distinct r.user_id) from public.nauka_rp r where r.tydzien = v_t),
    'przedmioty', coalesce((
      select jsonb_agg(jsonb_build_object('sid', x.sid, 'proc', x.proc, 'proc_poprz', x.proc_poprz, 'osob', x.osob, 'odp', x.odp, 'moj_proc', x.moj_proc,
                                          'lepiej_niz', x.lepiej_niz) order by x.proc)
      from (
        select o.sid,
               round(100.0 * avg((o.ok)::int) filter (where o.created_at >= v_od))::int proc,
               round(100.0 * avg((o.ok)::int) filter (where o.created_at < v_od))::int proc_poprz,
               count(distinct o.user_id) filter (where o.created_at >= v_od) osob,
               count(*) filter (where o.created_at >= v_od) odp,
               round(100.0 * avg((o.ok)::int) filter (where o.created_at >= v_od and o.user_id = auth.uid()))::int moj_proc,
               -- odsetek osób z niższą skutecznością niż moja w tym tygodniu (tylko gdy mam ≥ 10 odpowiedzi)
               (select round(100.0 * count(*) filter (where u.p < m.p) / nullif(count(*), 0))::int
                  from (select o2.user_id, avg((o2.ok)::int) p from public.nauka_odp o2
                         where o2.sid = o.sid and o2.created_at >= v_od group by o2.user_id having count(*) >= 10) u,
                       (select avg((o3.ok)::int) p from public.nauka_odp o3
                         where o3.sid = o.sid and o3.created_at >= v_od and o3.user_id = auth.uid() having count(*) >= 10) m) lepiej_niz
          from public.nauka_odp o
         where o.created_at >= v_od - interval '7 days' and o.sid is not null
         group by o.sid
        having count(distinct o.user_id) filter (where o.created_at >= v_od) >= v_min_o
           and count(*) filter (where o.created_at >= v_od) >= v_min_a) x), '[]'::jsonb),
    'trudne', coalesce((
      select jsonb_agg(jsonb_build_object('mid', y.mid, 'sid', y.sid, 'proc', y.proc, 'odp', y.odp) order by y.proc)
      from (select o.mid, max(o.sid) sid, round(100.0 * avg((o.ok)::int))::int proc, count(*) odp
              from public.nauka_odp o where o.created_at >= v_od - interval '7 days'
             group by o.mid having count(*) >= v_min_a and count(distinct o.user_id) >= v_min_o
             order by avg((o.ok)::int) limit 5) y), '[]'::jsonb));
end $$$tresc$;
    insert into znaki_naprawione values ('public.nauka_kierunek_stat() (skrot-v13-gry.sql)');
  end if;
end $napraw$;

-- public.nauka_konto_usun_dane(uuid, text): skrot-v32-usun-konto.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_konto_usun_dane(uuid, text)') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_konto_usun_dane(uuid, text)') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_konto_usun_dane(p_uid uuid, p_email text) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  em text := lower(coalesce(p_email, ''));
  t record; n bigint; n2 bigint; out jsonb := '{}'::jsonb;
begin
  if p_uid is null then raise exception 'brak konta'; end if;
  if em <> '' and exists (select 1 from public.nauka_admini a where lower(a.email) = em) then
    raise exception 'konto administratora usuwa się ręcznie';
  end if;
  for t in
    select c.table_name,
           bool_or(c.column_name = 'user_id') as has_uid,
           bool_or(c.column_name = 'email') as has_email
      from information_schema.columns c
      join information_schema.tables tb on tb.table_schema = c.table_schema and tb.table_name = c.table_name and tb.table_type = 'BASE TABLE'
     where c.table_schema = 'public' and c.column_name in ('user_id', 'email')
       and c.table_name <> all (public.nauka_konto_wyjatki())
     group by c.table_name
  loop
    execute format('delete from public.%I where %s', t.table_name,
      concat_ws(' or ',
        case when t.has_uid then 'user_id::text = $1::text' end,
        case when t.has_email then '(email is not null and lower(email) = $2 and $2 <> '''')' end))
      using p_uid, em;
    get diagnostics n = row_count;
    if n > 0 then out := out || jsonb_build_object(t.table_name, n); end if;
  end loop;
  -- nauka_docs: osobiste kasujemy, we wspólnych zostaje treść bez autora
  delete from public.nauka_docs d
   where (d.kolekcja = 'progress' and d.id = p_uid::text)
      or (d.kolekcja in ('myMaterials', 'myContent') and d.created_by = p_uid);
  get diagnostics n = row_count;
  -- Wyzwalacz nauka_przed_zapisem trzyma autora na stałe; wyłączamy go tylko w tej transakcji (inne sesje tego nie widzą,
  -- błąd cofa wszystko razem z wyłączeniem).
  alter table public.nauka_docs disable trigger nauka_przed_zapisem;
  update public.nauka_docs d set created_by = case when d.created_by = p_uid then null else d.created_by end,
         data = case when d.data->>'by' = p_uid::text then d.data - 'by' else d.data end
   where d.created_by = p_uid or d.data->>'by' = p_uid::text;
  get diagnostics n2 = row_count;
  alter table public.nauka_docs enable trigger nauka_przed_zapisem;
  out := out || jsonb_build_object('nauka_docs', n, 'nauka_docs_bez_autora', n2);
  -- nauka_polecenia: swoje polecenia znikają, zakup przez cudze polecenie zostaje bez danych kupującego
  delete from public.nauka_polecenia p where p.polecajacy = p_uid;
  get diagnostics n = row_count;
  out := out || jsonb_build_object('nauka_polecenia', n);
  update public.nauka_polecenia p set kupujacy_uid = null, kupujacy_email = 'usuniete-' || p.id || '@usuniete.invalid'
   where p.kupujacy_uid = p_uid or (em <> '' and p.kupujacy_email = em);
  get diagnostics n = row_count;
  out := out || jsonb_build_object('nauka_polecenia_anonim', n);
  return out;
end $$$tresc$;
    insert into znaki_naprawione values ('public.nauka_konto_usun_dane(uuid, text) (skrot-v32-usun-konto.sql)');
  end if;
end $napraw$;

-- public.nauka_kosm_cfg(): skrot-v24-kosmetyki.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_kosm_cfg()') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_kosm_cfg()') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_kosm_cfg() returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object(
    'zamrozenia_max', 2,     -- najwięcej zamrożeń serii naraz
    'gablota_bazowo', 1,     -- miejsca w gablocie bez zakupów
    'sloty', jsonb_build_array('ramka','kolor','tytul','skorka','tlo','fiszki','efekt','dzwieki','plomien')
  )
$$$tresc$;
    insert into znaki_naprawione values ('public.nauka_kosm_cfg() (skrot-v24-kosmetyki.sql)');
  end if;
end $napraw$;

-- public.nauka_lejek_dane(text): skrot-v35-lejek.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_lejek_dane(text)') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_lejek_dane(text)') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_lejek_dane(p_rocznik text) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  t date := (now() at time zone 'Europe/Warsaw')::date;
  tw date := date_trunc('week', (now() at time zone 'Europe/Warsaw'))::date;  -- poniedziałek bieżącego tygodnia
  lejek jsonb := '{}'::jsonb; w int; x jsonb;
  ret jsonb; tyg jsonb; uczy jsonb; rew jsonb; ab jsonb; ocz jsonb := null; zr jsonb := null;
begin
  create temp table if not exists lejek_k (user_id uuid primary key, rocznik_id text, d0 date, wybrany boolean, proba boolean, zakup boolean) on commit drop;
  create temp table if not exists lejek_d (user_id uuid, dzien date) on commit drop;
  truncate pg_temp.lejek_k; truncate pg_temp.lejek_d;
  insert into pg_temp.lejek_k select * from public.nauka_lejek_konta() k where p_rocznik = '*' or k.rocznik_id = p_rocznik;
  insert into pg_temp.lejek_d select d.* from public.nauka_lejek_dni_nauki() d join pg_temp.lejek_k k on k.user_id = d.user_id;

  -- Lejek: ostatnie 28 dni i od początku. Kroki liczone z kont założonych w tym okresie (kohorta).
  foreach w in array array[28, 0] loop
    select jsonb_build_object(
      'wejscia', (select coalesce(sum(e.wejscia), 0) from public.nauka_wejscia_dzien e
                   where (p_rocznik = '*' or e.rocznik_id = p_rocznik) and (w = 0 or e.dzien > t - w)),
      'konta', count(*), 'wybor', count(*) filter (where k.wybrany),
      'proba', count(*) filter (where k.proba), 'zakup', count(*) filter (where k.zakup))
      into x from pg_temp.lejek_k k where w = 0 or k.d0 > t - w;
    lejek := lejek || jsonb_build_object(case when w = 0 then 'wszystko' else 'd' || w end, x);
  end loop;

  -- Powroty D1 / D7 / D30 (port retentionDays): konta dość stare i ile z nich się uczyło.
  select jsonb_build_object(
    'd1',  jsonb_build_object('mozliwe', count(*) filter (where k.d0 + 1 <= t),
             'aktywne', count(*) filter (where k.d0 + 1 <= t and exists (select 1 from pg_temp.lejek_d d where d.user_id = k.user_id and d.dzien = k.d0 + 1))),
    'd7',  jsonb_build_object('mozliwe', count(*) filter (where k.d0 + 13 <= t),
             'aktywne', count(*) filter (where k.d0 + 13 <= t and exists (select 1 from pg_temp.lejek_d d where d.user_id = k.user_id and d.dzien between k.d0 + 7 and k.d0 + 13))),
    'd30', jsonb_build_object('mozliwe', count(*) filter (where k.d0 + 36 <= t),
             'aktywne', count(*) filter (where k.d0 + 36 <= t and exists (select 1 from pg_temp.lejek_d d where d.user_id = k.user_id and d.dzien between k.d0 + 30 and k.d0 + 36))))
    into ret from pg_temp.lejek_k k;

  -- Dni nauki w tygodniu: 4 ostatnie pełne tygodnie, wśród osób, które w danym tygodniu uczyły się choć raz.
  select coalesce(jsonb_agg(jsonb_build_object('tydzien', to_char(q.tydzien, 'YYYY-MM-DD'), 'osoby', q.osoby, 'mediana', q.mediana, 'srednio', q.srednio)
           order by q.tydzien desc), '[]'::jsonb) into tyg
  from (select u.tydzien, count(*)::int as osoby,
               percentile_cont(0.5) within group (order by u.dni)::float8 as mediana, round(avg(u.dni)::numeric, 1)::float8 as srednio
        from (select date_trunc('week', d.dzien)::date as tydzien, d.user_id, count(distinct d.dzien)::int as dni
              from pg_temp.lejek_d d where d.dzien >= tw - 28 and d.dzien < tw group by 1, 2) u
        group by u.tydzien) q;

  -- „Czy strona uczy”: pierwsze odpowiedzi w powtórkach przy wieku ≥ 7 dni, 8 tygodni (z bieżącym), na przedmiot i razem ('*').
  select coalesce(jsonb_agg(jsonb_build_object('tydzien', to_char(q.tydzien, 'YYYY-MM-DD'), 'sid', q.sid, 'osoby', q.osoby, 'odp', q.odp, 'ok', q.ok)
           order by q.tydzien desc, q.sid), '[]'::jsonb) into uczy
  from (select s.tydzien, v.sid, count(distinct s.user_id)::int as osoby, count(*)::int as odp, count(*) filter (where s.ok)::int as ok
        from (select date_trunc('week', (l.at at time zone 'Europe/Warsaw'))::date as tydzien,
                     coalesce(public.nauka_rp_klucz_sid(l.klucz), '?') as sid0, l.user_id, l.ok
              from public.nauka_powtorki_log l join pg_temp.lejek_k k on k.user_id = l.user_id
              where l.first and l.wiek >= 7 and (l.at at time zone 'Europe/Warsaw')::date >= tw - 49) s
        cross join lateral (values (s.sid0), ('*')) v(sid)
        group by s.tydzien, v.sid) q;

  -- Rewanże z ostatnich 28 dni: wygrane (z pokonanymi) / wszystkie rozegrane.
  select jsonb_build_object('wygrane', count(*) filter (where z.dane->>'wynik' in ('won', 'defeated')),
           'pokonane', count(*) filter (where z.dane->>'wynik' = 'defeated'),
           'wszystkie', count(*), 'osoby', count(distinct z.user_id))
    into rew
  from public.nauka_zdarzenia z join pg_temp.lejek_k k on k.user_id = z.user_id
  where z.typ = 'activity' and z.dane->>'kind' = 'rewanz' and z.dane->>'wynik' in ('won', 'defeated', 'lost')
    and z.kiedy > now() - interval '28 days';

  -- Test A/B haczyka (od początku): wariant lekcji z biletu wyjścia (pole 'hak'), bilety zdane (≥ 2 z 3 albo wszystkie,
  -- gdy pytań mniej) i „czy uczy” w powtórkach z tych lekcji (klucze q:/d:/n:<lekcja>:…).
  with bil as (
    select z.user_id, z.dane->>'lessonId' as mid, z.dane->>'hak' as hak,
           public.nauka_lejek_int(z.dane->>'score') as sc, public.nauka_lejek_int(z.dane->>'max') as mx
    from public.nauka_zdarzenia z join pg_temp.lejek_k k on k.user_id = z.user_id
    where z.typ = 'exit_ticket' and z.dane->>'hak' in ('haczyk', 'bez')
  ), war as (select distinct on (b.mid) b.mid, b.hak from bil b where b.mid is not null order by b.mid, b.hak),
  pow as (
    select w.hak, l.user_id, l.ok
    from public.nauka_powtorki_log l join pg_temp.lejek_k k on k.user_id = l.user_id
    join war w on w.mid = split_part(l.klucz, ':', 2)
    where split_part(l.klucz, ':', 1) in ('q', 'd', 'n') and l.first and l.wiek >= 7
  )
  select coalesce(jsonb_object_agg(v.hak, jsonb_build_object(
           'bilety', (select count(*) from bil b where b.hak = v.hak),
           'zdane', (select count(*) from bil b where b.hak = v.hak and b.sc is not null and b.mx > 0 and b.sc >= least(2, b.mx)),
           'osoby', (select count(distinct b.user_id) from bil b where b.hak = v.hak),
           'odp', (select count(*) from pow p where p.hak = v.hak),
           'ok', (select count(*) from pow p where p.hak = v.hak and p.ok),
           'osoby_odp', (select count(distinct p.user_id) from pow p where p.hak = v.hak))), '{}'::jsonb)
    into ab
  from (values ('haczyk'), ('bez')) v(hak);

  -- Tylko w podsumowaniu wszystkich roczników: lista oczekujących (międzykierunkowa) i wejścia według źródła.
  if p_rocznik = '*' then
    foreach w in array array[28, 0] loop
      select jsonb_build_object('potwierdzone', count(*),
               'kierunki', coalesce((select jsonb_agg(jsonb_build_object('nazwa', g.nazwa, 'n', g.n) order by g.n desc, g.nazwa)
                 from (select coalesce(kk.nazwa_pl || case kk.stopien when 1 then ' · I st.' when 2 then ' · II st.' else '' end, 'wpisane ręcznie') as nazwa, count(*)::int as n
                       from public.nauka_oczekujacy o2 left join public.nauka_kierunki kk on kk.id = o2.kierunek_id
                       where o2.status = 'confirmed' and (w = 0 or o2.confirmed_at > now() - make_interval(days => w)) group by 1) g), '[]'::jsonb),
               'zrodla', coalesce((select jsonb_object_agg(g.z, g.n)
                 from (select coalesce(o3.zrodlo, '') as z, count(*)::int as n from public.nauka_oczekujacy o3
                       where o3.status = 'confirmed' and (w = 0 or o3.confirmed_at > now() - make_interval(days => w)) group by 1) g), '{}'::jsonb))
        into x from public.nauka_oczekujacy o where o.status = 'confirmed' and (w = 0 or o.confirmed_at > now() - make_interval(days => w));
      ocz := coalesce(ocz, '{}'::jsonb) || jsonb_build_object(case when w = 0 then 'wszystko' else 'd' || w end, x);
    end loop;
    select coalesce(jsonb_object_agg(g.zrodlo, g.n), '{}'::jsonb) into zr
    from (select e.zrodlo, sum(e.wejscia)::int as n from public.nauka_wejscia_dzien e where e.dzien > t - 28 group by 1) g;
  end if;

  return jsonb_build_object('rocznik', p_rocznik, 'dzien', t, 'lejek', lejek, 'retencja', ret, 'tygodnie', tyg,
    'uczy', uczy, 'rewanze', rew, 'ab', jsonb_build_object('haczyk', ab), 'oczekujacy', ocz, 'wejscia_zrodla', zr,
    -- etap 11 (źródła wejść kont) dopisze tu podział lejka na źródło: 'zrodla': { '<źródło>': { …jak lejek… } }
    'zrodla', null);
end $$$tresc$;
    insert into znaki_naprawione values ('public.nauka_lejek_dane(text) (skrot-v35-lejek.sql)');
  end if;
end $napraw$;

-- public.nauka_lejek_ld(text): skrot-v43-lekcja-dnia.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_lejek_ld(text)') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_lejek_ld(text)') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_lejek_ld(p_rocznik text) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  t date := (now() at time zone 'Europe/Warsaw')::date;
  tw date := date_trunc('week', (now() at time zone 'Europe/Warsaw'))::date;
  dni jsonb; segi jsonb; mech jsonb; uczy jsonb;
begin
  create temp table if not exists ld_k (user_id uuid primary key) on commit drop;
  create temp table if not exists ld_z (user_id uuid, kiedy timestamptz, dane jsonb) on commit drop;
  truncate pg_temp.ld_k; truncate pg_temp.ld_z;
  insert into pg_temp.ld_k select k.user_id from public.nauka_lejek_konta() k where p_rocznik = '*' or k.rocznik_id = p_rocznik;
  insert into pg_temp.ld_z select z.user_id, z.kiedy, z.dane from public.nauka_zdarzenia z join pg_temp.ld_k k on k.user_id = z.user_id
    where z.typ = 'activity' and z.dane->>'kind' = 'ld' and z.kiedy > now() - interval '63 days';

  -- Dziennie (28 dni): ile osób skończyło kartę 5 min, ile osób skończyło lekcję i ile lekcji.
  select coalesce(jsonb_agg(jsonb_build_object('dzien', to_char(q.dzien, 'YYYY-MM-DD'), 'karta_osoby', q.ko, 'karty', q.kn, 'lekcja_osoby', q.lo, 'lekcje', q.ln)
           order by q.dzien desc), '[]'::jsonb) into dni
  from (select (z.kiedy at time zone 'Europe/Warsaw')::date as dzien,
               count(distinct z.user_id) filter (where z.dane->>'koniec' = 'karta')::int as ko, count(*) filter (where z.dane->>'koniec' = 'karta')::int as kn,
               count(distinct z.user_id) filter (where z.dane->>'koniec' = 'lekcja')::int as lo, count(*) filter (where z.dane->>'koniec' = 'lekcja')::int as ln
        from pg_temp.ld_z z where z.dane ? 'koniec' and (z.kiedy at time zone 'Europe/Warsaw')::date > t - 28 group by 1) q;

  -- W którym segmencie lekcji ludzie najczęściej przerywają (porzucenia na numer segmentu, 28 dni).
  select coalesce(jsonb_agg(jsonb_build_object('seg', q.seg, 'porzucone', q.n, 'osoby', q.o) order by q.seg), '[]'::jsonb) into segi
  from (select public.nauka_lejek_int(z.dane->>'seg') as seg, count(*)::int as n, count(distinct z.user_id)::int as o
        from pg_temp.ld_z z where z.dane->>'stan' = 'porzucona' and z.kiedy > now() - interval '28 days' and public.nauka_lejek_int(z.dane->>'seg') is not null group by 1) q;

  -- Mechaniki (28 dni): ukończone (z „dobrze”), porzucone, pominięte i liczba osób.
  select coalesce(jsonb_agg(jsonb_build_object('mech', q.mech, 'ukonczone', q.u, 'dobrze', q.d, 'porzucone', q.p, 'pominiete', q.s, 'osoby', q.o) order by q.u + q.p + q.s desc, q.mech), '[]'::jsonb) into mech
  from (select z.dane->>'mech' as mech,
               count(*) filter (where z.dane->>'stan' = 'ukonczona')::int as u, count(*) filter (where z.dane->>'stan' = 'ukonczona' and z.dane->>'dobrze' = 'true')::int as d,
               count(*) filter (where z.dane->>'stan' = 'porzucona')::int as p, count(*) filter (where z.dane->>'stan' = 'pominieta')::int as s,
               count(distinct z.user_id)::int as o
        from pg_temp.ld_z z where z.dane ? 'stan' and z.dane->>'mech' ~ '^[a-z]{2,20}$' and z.kiedy > now() - interval '28 days' group by 1) q;

  -- „Czy uczy”: dobre PIERWSZE odpowiedzi w powtórkach przy wieku ≥ 7 dni (8 tygodni), osobno dla tematów, które ta osoba
  -- wcześniej robiła w bloku „Dla Ciebie na dziś” (materialId ze zdarzeń), i dla pozostałych.
  with ldm as (
    select z.user_id, z.dane->>'materialId' as mid, min(z.kiedy) as od from pg_temp.ld_z z where z.dane ? 'materialId' and z.dane->>'materialId' <> '' group by 1, 2
  ), log as (
    select l.user_id, l.ok, l.at,
           case when split_part(l.klucz, ':', 1) in ('q', 'd', 'n', 'z') then split_part(l.klucz, ':', 2) when split_part(l.klucz, ':', 1) = 'g' then null else split_part(l.klucz, ':', 1) end as mid
    from public.nauka_powtorki_log l join pg_temp.ld_k k on k.user_id = l.user_id
    where l.first and l.wiek >= 7 and (l.at at time zone 'Europe/Warsaw')::date >= tw - 49
  ), oz as (
    select g.user_id, g.ok, case when exists (select 1 from ldm m where m.user_id = g.user_id and m.mid = g.mid and m.od < g.at) then 'ld' else 'inne' end as grupa
    from log g where g.mid is not null
  )
  select coalesce(jsonb_object_agg(v.grupa, jsonb_build_object('odp', (select count(*) from oz where oz.grupa = v.grupa), 'ok', (select count(*) from oz where oz.grupa = v.grupa and oz.ok),
           'osoby', (select count(distinct oz.user_id) from oz where oz.grupa = v.grupa))), '{}'::jsonb) into uczy
  from (values ('ld'), ('inne')) v(grupa);

  return jsonb_build_object('dni', dni, 'segmenty', segi, 'mechaniki', mech, 'uczy', uczy,
    'osoby', (select count(distinct z.user_id) from pg_temp.ld_z z where z.kiedy > now() - interval '28 days'));
end $$$tresc$;
    insert into znaki_naprawione values ('public.nauka_lejek_ld(text) (skrot-v43-lekcja-dnia.sql)');
  end if;
end $napraw$;

-- public.nauka_lejek_zrodla_dane(): skrot-v38-admin.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_lejek_zrodla_dane()') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_lejek_zrodla_dane()') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_lejek_zrodla_dane() returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare t date := (now() at time zone 'Europe/Warsaw')::date; w int; out jsonb := '{}'::jsonb; x jsonb;
begin
  create temp table if not exists lejek_z (user_id uuid primary key, zrodlo text, d0 date, wybrany boolean, zakup boolean, zakup_z text, zakup_d date) on commit drop;
  truncate pg_temp.lejek_z;
  insert into pg_temp.lejek_z
  select k.user_id, coalesce(nullif(kz.zrodlo, ''), ''), k.d0, k.wybrany, k.zakup,
         (select coalesce(d.zrodlo_wejscia, nullif(kz.zrodlo, ''), '') from public.nauka_dostep d
           where (d.user_id = k.user_id or d.email = lower(u.email)) and (d.zrodlo like 'stripe%' or d.stripe_session is not null or d.stripe_subscription is not null) limit 1),
         (select (d.created_at at time zone 'Europe/Warsaw')::date from public.nauka_dostep d
           where (d.user_id = k.user_id or d.email = lower(u.email)) and (d.zrodlo like 'stripe%' or d.stripe_session is not null or d.stripe_subscription is not null) limit 1)
  from public.nauka_lejek_konta() k join auth.users u on u.id = k.user_id
  left join public.nauka_konto_zrodlo kz on kz.user_id = k.user_id;

  foreach w in array array[28, 0] loop
    select coalesce(jsonb_object_agg(s.z, jsonb_build_object(
             'wejscia', (select coalesce(sum(e.wejscia), 0) from public.nauka_wejscia_dzien e where e.zrodlo = s.z and (w = 0 or e.dzien > t - w)),
             'konta', (select count(*) from pg_temp.lejek_z k where k.zrodlo = s.z and (w = 0 or k.d0 > t - w)),
             'wybor', (select count(*) from pg_temp.lejek_z k where k.zrodlo = s.z and k.wybrany and (w = 0 or k.d0 > t - w)),
             'proba', (select count(*) from public.nauka_proby p join pg_temp.lejek_z k on k.user_id = p.user_id
                        where coalesce(p.zrodlo, '') = s.z and (w = 0 or (p.od at time zone 'Europe/Warsaw')::date > t - w)),
             'zakup', (select count(*) from pg_temp.lejek_z k where k.zakup and k.zakup_z = s.z and (w = 0 or k.zakup_d > t - w)),
             'lista', (select count(*) from public.nauka_oczekujacy o where o.status = 'confirmed' and coalesce(o.zrodlo, '') = s.z
                        and (w = 0 or o.confirmed_at > now() - make_interval(days => w))))), '{}'::jsonb)
      into x
    from (select q.z from (
            select e.zrodlo as z, sum(e.wejscia) as n from public.nauka_wejscia_dzien e group by 1
            union all select k.zrodlo, 0 from pg_temp.lejek_z k
            union all select coalesce(p.zrodlo, ''), 0 from public.nauka_proby p
            union all select coalesce(o.zrodlo, ''), 0 from public.nauka_oczekujacy o where o.status = 'confirmed') q
          group by q.z order by sum(q.n) desc, q.z limit 60) s;
    out := out || jsonb_build_object(case when w = 0 then 'wszystko' else 'd' || w end, x);
  end loop;
  -- { d28: { źródło: kroki }, wszystko: {…} } → { źródło: { d28: kroki, wszystko: kroki } }
  return coalesce((select jsonb_object_agg(k.z, jsonb_build_object('d28', out->'d28'->k.z, 'wszystko', out->'wszystko'->k.z))
                   from jsonb_object_keys(out->'wszystko') k(z)), '{}'::jsonb);
end $$$tresc$;
    insert into znaki_naprawione values ('public.nauka_lejek_zrodla_dane() (skrot-v38-admin.sql)');
  end if;
end $napraw$;

-- public.nauka_misje_pula(): skrot-v14-monety.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_misje_pula()') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_misje_pula()') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_misje_pula() returns jsonb
language sql immutable set search_path = '' as $$
  select '[
    {"id":"odp10",  "okres":"dzien",   "co":"wiersze", "zrodla":["quiz","gra"], "prefix":"q:", "ile":10, "nagroda":8,  "pl":"Odpowiedz dobrze na 10 pytań",            "en":"Answer 10 questions correctly"},
    {"id":"odp25",  "okres":"dzien",   "co":"wiersze", "zrodla":["quiz","gra"], "prefix":"q:", "ile":25, "nagroda":15, "pl":"Odpowiedz dobrze na 25 pytań",            "en":"Answer 25 questions correctly"},
    {"id":"zad2",   "okres":"dzien",   "co":"wiersze", "zrodla":["quiz","gra"], "prefix":"z:", "ile":2,  "nagroda":10, "pl":"Rozwiąż 2 zadania liczbowe",              "en":"Solve 2 numeric problems"},
    {"id":"pow10",  "okres":"dzien",   "co":"wiersze", "zrodla":["powtorka"],   "prefix":"p:", "ile":10, "nagroda":6,  "pl":"Zrób 10 powtórek fiszek",                 "en":"Do 10 flashcard reviews"},
    {"id":"lek1",   "okres":"dzien",   "co":"wiersze", "zrodla":["lekcja"],     "prefix":"l:", "ile":1,  "nagroda":10, "pl":"Skończ jedną lekcję",                     "en":"Finish one lesson"},
    {"id":"gra1",   "okres":"dzien",   "co":"wiersze", "zrodla":["wynik"],      "prefix":"r:", "ile":1,  "nagroda":5,  "pl":"Zagraj jedną rundę gry",                  "en":"Play one game round"},
    {"id":"haslo1", "okres":"dzien",   "co":"wiersze", "zrodla":["haslo"],      "prefix":"h:", "ile":1,  "nagroda":5,  "pl":"Rozwiąż Hasło dnia",                      "en":"Solve the Word of the Day"},
    {"id":"pkt60",  "okres":"dzien",   "co":"pkt",     "zrodla":null,           "prefix":null, "ile":60, "nagroda":8,  "pl":"Zbierz dziś 60 pkt",                      "en":"Earn 60 points today"},
    {"id":"tyd_l5", "okres":"tydzien", "co":"wiersze", "zrodla":["lekcja"],     "prefix":"l:", "ile":5,  "nagroda":40, "pl":"Skończ 5 lekcji w tym tygodniu",          "en":"Finish 5 lessons this week"},
    {"id":"tyd_d5", "okres":"tydzien", "co":"dni",     "zrodla":null,           "prefix":null, "ile":5,  "nagroda":50, "pl":"Ucz się 5 dni w tym tygodniu",            "en":"Study on 5 days this week"}
  ]'::jsonb
$$$tresc$;
    insert into znaki_naprawione values ('public.nauka_misje_pula() (skrot-v14-monety.sql)');
  end if;
end $napraw$;

-- public.nauka_mon_z_rp(): skrot-v14-monety.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_mon_z_rp()') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_mon_z_rp()') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_mon_z_rp() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  kurs int := (public.nauka_mon_cfg()->>'kurs_pkt')::int;
  suma int; ile int;
begin
  select coalesce(sum(pkt), 0) into suma from public.nauka_rp where user_id = new.user_id and dzien = new.dzien;
  ile := suma / kurs;                                  -- dzielenie całkowite = w dół
  if ile <= 0 then return null; end if;
  insert into public.nauka_monety (user_id, dzien, delta, zrodlo, klucz, opis)
  values (new.user_id, new.dzien, ile, 'nauka', 'nauka:' || new.dzien::text, 'Nauka: ' || suma || ' pkt')
  on conflict (user_id, klucz) do update set delta = excluded.delta, opis = excluded.opis
  where public.nauka_monety.delta < excluded.delta;    -- tylko w górę
  return null;
end $$$tresc$;
    insert into znaki_naprawione values ('public.nauka_mon_z_rp() (skrot-v14-monety.sql)');
  end if;
end $napraw$;

-- public.nauka_nick_ok(text): skrot-v13-gry.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_nick_ok(text)') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_nick_ok(text)') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_nick_ok(p text) returns text
language plpgsql immutable set search_path = '' as $$
declare n text := regexp_replace(btrim(coalesce(p, '')), '\s+', ' ', 'g'); l text;
begin
  if char_length(n) < 3 or char_length(n) > 20 then return 'nick_dlugosc'; end if;
  if n !~ '^[A-Za-z0-9ĄĆĘŁŃÓŚŹŻąćęłńóśźż _.-]+$' then return 'nick_znaki'; end if;
  l := lower(translate(n, 'ĄĆĘŁŃÓŚŹŻąćęłńóśźż0134 _.-', 'acelnoszzacelnoszzoiea'));
  if l ~ '(admin|starost|skrot|moderat|support|pomoc|anthropic|claude)' then return 'nick_zastrzezony'; end if;
  -- Rdzenie wulgaryzmów i obelg (PL + EN). Celowo bez krótkich rdzeni, które psują zwykłe słowa (np. „anal” → analiza, „rape” → grape).
  if l ~ ('(kurw|kurew|huj|jeb|pierd|pizd|cipa|cipk|kutas|fiut|dziwk|szmat|dupa|dupek|cwel|ciota|pedal|frajer|debil|kretyn|idiot|zjeb|sperm'
        || '|fuck|fuk|shit|bitch|cunt|dick|cock|pussy|whore|slut|nigg|fag|retard|asshole|bastard|penis|vagin|porn|nazi|hitler)') then
    return 'nick_zastrzezony';
  end if;
  return null;
end $$$tresc$;
    insert into znaki_naprawione values ('public.nauka_nick_ok(text) (skrot-v13-gry.sql)');
  end if;
end $napraw$;

-- public.nauka_obecny(text): skrot-v11-aktywnosc.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_obecny(text)') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_obecny(text)') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_obecny(p_nazwa text default '') returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  dev text := coalesce(public.nauka_urzadzenie_id(), '');
  adres text := public.nauka_ip();
  mail text := public.nauka_email();
  o public.nauka_obecnosc;
  w bigint;
begin
  if uid is null then raise exception 'nie_zalogowany'; end if;
  p_nazwa := left(coalesce(p_nazwa, ''), 60);
  select * into o from public.nauka_obecnosc where user_id = uid and device_id = dev;
  -- Częściej niż co 20 s nic nie zapisujemy (np. kilka kart naraz).
  if found and o.last_seen > now() - interval '20 seconds' then return jsonb_build_object('ok', true); end if;

  if not found or o.wizyta_id is null or o.last_seen < now() - public.nauka_wizyta_przerwa() then
    insert into public.nauka_wizyty (user_id, email, device_id, nazwa, ip) values (uid, mail, nullif(dev, ''), p_nazwa, adres)
      returning id into w;
    insert into public.nauka_obecnosc (user_id, device_id, email, nazwa, ip, wizyta_id, od, last_seen)
      values (uid, dev, mail, p_nazwa, adres, w, now(), now())
      on conflict (user_id, device_id) do update
        set email = excluded.email, nazwa = excluded.nazwa, ip = excluded.ip, wizyta_id = excluded.wizyta_id, od = now(), last_seen = now();
    -- Sprzątanie starej historii przy okazji (rzadko: tylko przy nowej wizycie).
    delete from public.nauka_wizyty where od < now() - public.nauka_historia_trzymaj();
  else
    update public.nauka_obecnosc
       set last_seen = now(), email = mail, ip = coalesce(adres, ip), nazwa = case when p_nazwa <> '' then p_nazwa else nazwa end
     where user_id = uid and device_id = dev;
    update public.nauka_wizyty set koniec = now() where id = o.wizyta_id;
  end if;
  return jsonb_build_object('ok', true);
end $$$tresc$;
    insert into znaki_naprawione values ('public.nauka_obecny(text) (skrot-v11-aktywnosc.sql)');
  end if;
end $napraw$;

-- public.nauka_ocena_ai_bierz(text, int): skrot-v25-ocena-ai.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_ocena_ai_bierz(text, int)') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_ocena_ai_bierz(text, int)') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_ocena_ai_bierz(p_run text, p_limit int) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  d date := (now() at time zone 'Europe/Warsaw')::date;
  n int;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'uzyte', 0, 'limit', p_limit); end if;
  if p_run is null or length(p_run) > 120 then return jsonb_build_object('ok', false, 'uzyte', 0, 'limit', p_limit); end if;
  -- Ten test już był liczony dziś: można go ocenić jeszcze raz bez kosztu w limicie.
  if exists (select 1 from public.nauka_ocena_ai o where o.user_id = auth.uid() and o.dzien = d and o.run = p_run) then
    select count(*) into n from public.nauka_ocena_ai o where o.user_id = auth.uid() and o.dzien = d;
    return jsonb_build_object('ok', true, 'uzyte', n, 'limit', p_limit);
  end if;
  perform pg_advisory_xact_lock(hashtext('nauka_ocena_ai:' || auth.uid()::text));
  select count(*) into n from public.nauka_ocena_ai o where o.user_id = auth.uid() and o.dzien = d;
  if n >= greatest(0, coalesce(p_limit, 5)) and not public.nauka_admin() then
    return jsonb_build_object('ok', false, 'uzyte', n, 'limit', p_limit);
  end if;
  insert into public.nauka_ocena_ai (user_id, dzien, run) values (auth.uid(), d, p_run) on conflict do nothing;
  return jsonb_build_object('ok', true, 'uzyte', n + 1, 'limit', p_limit);
end $$$tresc$;
    insert into znaki_naprawione values ('public.nauka_ocena_ai_bierz(text, int) (skrot-v25-ocena-ai.sql)');
  end if;
end $napraw$;

-- public.nauka_oczekujacy_zapisz(jsonb, text, text): skrot-v34-oczekujacy.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_oczekujacy_zapisz(jsonb, text, text)') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_oczekujacy_zapisz(jsonb, text, text)') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_oczekujacy_zapisz(p jsonb, p_token_hash text, p_ip_hash text) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  em text := lower(trim(coalesce(p->>'email', '')));
  kid text := nullif(p->>'kierunek_id', '');
  ktxt text := nullif(trim(coalesce(p->>'kierunek_tekst', '')), '');
  n int; e record;
begin
  if em !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(em) > 254 then return jsonb_build_object('kind', 'invalid', 'pole', 'email'); end if;
  if kid is not null and not exists (select 1 from public.nauka_kierunki k where k.id = kid) then kid := null; end if;
  if kid is null and (ktxt is null or length(ktxt) < 2) then return jsonb_build_object('kind', 'invalid', 'pole', 'kierunek'); end if;
  -- Sprzątanie przy okazji: niepotwierdzone i wypisane po 30 dniach znikają.
  delete from public.nauka_oczekujacy where status in ('pending', 'unsubscribed') and coalesce(unsubscribed_at, created_at) < now() - interval '30 days';
  -- Skrót IP jest potrzebny tylko do limitu z ostatniej godziny: po dobie znika.
  update public.nauka_oczekujacy set ip_hash = null where ip_hash is not null and created_at < now() - interval '1 day';
  if p_ip_hash is not null then
    select count(*) into n from public.nauka_oczekujacy where ip_hash = p_ip_hash and created_at > now() - interval '1 hour';
    if n >= 5 then return jsonb_build_object('kind', 'rate_limited'); end if;
  end if;
  -- Dwa kliknięcia naraz: drugi zapis jest pomijany, nie jest błędem.
  insert into public.nauka_oczekujacy (email, wydzial, kierunek_id, kierunek_tekst, stopien, rok, tryb, zrodlo, token_hash, ip_hash, zgoda_wersja)
  values (em, nullif(p->>'wydzial', ''), kid, case when kid is null then left(ktxt, 120) end,
          nullif(p->>'stopien', '')::smallint, nullif(p->>'rok', '')::smallint, nullif(p->>'tryb', ''),
          nullif(p->>'zrodlo', ''), p_token_hash, p_ip_hash, coalesce(nullif(p->>'zgoda_wersja', ''), '1'))
  on conflict (email) do nothing;
  if found then return jsonb_build_object('kind', 'send'); end if;
  select * into e from public.nauka_oczekujacy where email = em for update;
  if e.status = 'confirmed' or coalesce(e.confirm_sent_at > now() - interval '10 minutes', false)
     or (e.send_count >= 4 and e.status <> 'unsubscribed') then
    return jsonb_build_object('kind', 'noop');
  end if;
  -- Czekający (zgubił maila) albo wypisany i zapisuje się znowu: nowy token i zgoda, nowe dane kierunku.
  update public.nauka_oczekujacy set status = 'pending', token_hash = p_token_hash, zgoda_wersja = coalesce(nullif(p->>'zgoda_wersja', ''), '1'),
         kierunek_id = coalesce(kid, kierunek_id), kierunek_tekst = case when kid is null then left(ktxt, 120) else null end,
         stopien = coalesce(nullif(p->>'stopien', '')::smallint, stopien), rok = coalesce(nullif(p->>'rok', '')::smallint, rok),
         tryb = coalesce(nullif(p->>'tryb', ''), tryb), wydzial = coalesce(nullif(p->>'wydzial', ''), wydzial), zrodlo = coalesce(zrodlo, nullif(p->>'zrodlo', '')),
         send_count = case when status = 'unsubscribed' then 0 else send_count end, unsubscribed_at = null
   where id = e.id;
  return jsonb_build_object('kind', 'send');
end $$$tresc$;
    insert into znaki_naprawione values ('public.nauka_oczekujacy_zapisz(jsonb, text, text) (skrot-v34-oczekujacy.sql)');
  end if;
end $napraw$;

-- public.nauka_paczka_cfg(): skrot-v37-paczka.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_paczka_cfg()') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_paczka_cfg()') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_paczka_cfg() returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object(
    'min_osob', 2,         -- SQUAD.minMembers
    'max_osob', 8,         -- SQUAD.maxMembers
    'plan_dni', 3,         -- zaplanowane dni nauki na osobę w tygodniu (Skrót nie ma planu sesji, więc stała)
    'udzial', 0.7,         -- SQUAD.goalShare: cel paczki = 70% zaplanowanych dni wszystkich
    'duet_cel', 8,         -- DUO_TARGET w Skrócie: 8 sesji (dni nauki) łącznie, np. po 4 na osobę
    'duet_nagroda', 20     -- monety dla każdej z dwóch osób, raz w tygodniu
  )
$$$tresc$;
    insert into znaki_naprawione values ('public.nauka_paczka_cfg() (skrot-v37-paczka.sql)');
  end if;
end $napraw$;

-- public.nauka_ping(text, boolean, boolean): skrot-v8-urzadzenia.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_ping(text, boolean, boolean)') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_ping(text, boolean, boolean)') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_ping(p_nazwa text default '', p_przejmij boolean default false, p_zwolnij boolean default false)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  dev text := public.nauka_urzadzenie_id();
  adres text := public.nauka_ip();
  k public.nauka_konta;
  u public.nauka_urzadzenia;
  ile int;
  inne text;
begin
  if uid is null then raise exception 'nie_zalogowany'; end if;
  p_nazwa := left(coalesce(p_nazwa, ''), 60);
  -- Starosta: bez limitu i bez jednej sesji, ale jego urządzenia też trafiają na listę („Twoje urządzenia”).
  if public.nauka_admin() then
    if dev is not null and not p_zwolnij then
      insert into public.nauka_urzadzenia (user_id, device_id, nazwa, ip) values (uid, dev, p_nazwa, adres)
        on conflict (user_id, device_id) do update
          set nazwa = case when excluded.nazwa <> '' then excluded.nazwa else public.nauka_urzadzenia.nazwa end,
              ip = coalesce(excluded.ip, public.nauka_urzadzenia.ip), last_seen = now(), usuniete_at = null;
    end if;
    return jsonb_build_object('stan', 'ok', 'admin', true);
  end if;
  if not public.nauka_platny_konto() then return jsonb_build_object('stan', 'brak_dostepu'); end if;
  if dev is null then return jsonb_build_object('stan', 'brak_id'); end if;

  insert into public.nauka_konta (user_id, email) values (uid, public.nauka_email())
    on conflict (user_id) do update set email = excluded.email
    returning * into k;
  if k.zablokowane then return jsonb_build_object('stan', 'zablokowane', 'powod', k.powod); end if;

  select * into u from public.nauka_urzadzenia where user_id = uid and device_id = dev;
  if not found or u.usuniete_at is not null or u.last_seen < now() - public.nauka_urz_wygasa() then
    -- nowe urządzenie (albo wcześniej usunięte / dawno nieużywane): mieści się w limicie?
    select count(*) into ile from public.nauka_urzadzenia
     where user_id = uid and device_id <> dev and usuniete_at is null and last_seen >= now() - public.nauka_urz_wygasa();
    if ile >= public.nauka_urz_limit() then
      if not exists (select 1 from public.nauka_urzadzenia_log l where l.user_id = uid and l.device_id = dev
                       and l.zdarzenie = 'limit' and l.at > now() - interval '1 day') then
        insert into public.nauka_urzadzenia_log (user_id, device_id, zdarzenie, ip) values (uid, dev, 'limit', adres);
      end if;
      return jsonb_build_object('stan', 'limit', 'limit', public.nauka_urz_limit(),
        'urzadzenia', public.nauka_urz_lista(uid, dev), 'zmiana_od', public.nauka_urz_zmiana_od(uid));
    end if;
    insert into public.nauka_urzadzenia (user_id, device_id, nazwa, ip)
      values (uid, dev, p_nazwa, adres)
      on conflict (user_id, device_id) do update
        set nazwa = case when excluded.nazwa <> '' then excluded.nazwa else public.nauka_urzadzenia.nazwa end, ip = excluded.ip, created_at = now(), last_seen = now(), usuniete_at = null;
    insert into public.nauka_urzadzenia_log (user_id, device_id, zdarzenie, ip) values (uid, dev, 'nowe', adres);
  else
    update public.nauka_urzadzenia
       set last_seen = now(), ip = coalesce(adres, ip), nazwa = case when p_nazwa <> '' then p_nazwa else u.nazwa end
     where user_id = uid and device_id = dev;
  end if;

  if p_zwolnij then
    update public.nauka_konta set aktywne_ping = null where user_id = uid and aktywne_urzadzenie = dev;
    return jsonb_build_object('stan', 'ok');
  end if;

  if k.aktywne_urzadzenie is not null and k.aktywne_urzadzenie <> dev
     and k.aktywne_ping >= now() - public.nauka_urz_okno() then
    if not p_przejmij then
      select x.nazwa into inne from public.nauka_urzadzenia x where x.user_id = uid and x.device_id = k.aktywne_urzadzenie;
      return jsonb_build_object('stan', 'zajete', 'inne', coalesce(inne, ''));
    end if;
    insert into public.nauka_urzadzenia_log (user_id, device_id, zdarzenie, ip) values (uid, dev, 'przejecie', adres);
  end if;

  update public.nauka_konta set aktywne_urzadzenie = dev, aktywne_ping = now() where user_id = uid;
  return jsonb_build_object('stan', 'ok');
end $$$tresc$;
    insert into znaki_naprawione values ('public.nauka_ping(text, boolean, boolean) (skrot-v8-urzadzenia.sql)');
  end if;
end $napraw$;

-- public.nauka_polec_cfg(): skrot-v17-polecenia.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_polec_cfg()') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_polec_cfg()') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_polec_cfg() returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object(
    'nagroda_gr', 3000,      -- 30 zł dla właściciela kodu
    'dni', 14,               -- po tylu dniach od zakupu nagroda jest do wypłaty
    'min_kwota_gr', 19900    -- tylko zakup planu 199 zł (jednorazowo)
  )
$$$tresc$;
    insert into znaki_naprawione values ('public.nauka_polec_cfg() (skrot-v17-polecenia.sql)');
  end if;
end $napraw$;

-- public.nauka_polec_cofnij(text, text): skrot-v17-polecenia.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_polec_cofnij(text, text)') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_polec_cofnij(text, text)') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_polec_cofnij(p_payment text, p_powod text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare a int; w int;
begin
  if coalesce(p_payment, '') = '' then return jsonb_build_object('ok', false, 'code', 'brak_danych'); end if;
  update public.nauka_polecenia set status = 'anulowane', powod = p_powod
    where stripe_payment = p_payment and status = 'nalicza';
  get diagnostics a = row_count;
  update public.nauka_polecenia set powod = p_powod || ' (już wypłacone)'
    where stripe_payment = p_payment and status = 'wyplacone';
  get diagnostics w = row_count;
  return jsonb_build_object('ok', true, 'anulowane', a, 'po_wyplacie', w);
end $$$tresc$;
    insert into znaki_naprawione values ('public.nauka_polec_cofnij(text, text) (skrot-v17-polecenia.sql)');
  end if;
end $napraw$;

-- public.nauka_polec_norm(text): skrot-v17-polecenia.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_polec_norm(text)') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_polec_norm(text)') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_polec_norm(p text) returns text
language sql immutable set search_path = '' as $$
  select regexp_replace(upper(translate(coalesce(p, ''), 'ąćęłńóśźżĄĆĘŁŃÓŚŹŻ', 'acelnoszzACELNOSZZ')), '[^A-Z0-9]', '', 'g')
$$$tresc$;
    insert into znaki_naprawione values ('public.nauka_polec_norm(text) (skrot-v17-polecenia.sql)');
  end if;
end $napraw$;

-- public.nauka_polec_ustaw(text, text): skrot-v18-imie-polecajacego.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_polec_ustaw(text, text)') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_polec_ustaw(text, text)') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_polec_ustaw(p_kod text, p_imie text default null) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  em text := public.nauka_email();
  v_kod text := public.nauka_polec_norm(p_kod);
  v_imie text := nullif(regexp_replace(btrim(coalesce(p_imie, '')), '\s+', ' ', 'g'), '');
  stare text;
begin
  if uid is null or coalesce(em, '') = '' then return jsonb_build_object('ok', false, 'code', 'nie_zalogowany'); end if;
  if not public.nauka_polec_mozna() then return jsonb_build_object('ok', false, 'code', 'brak_dostepu'); end if;
  -- Imię i nazwisko: wymagane przy zakładaniu kodu (żeby starosta wiedział, komu wypłaca); przy zmianie kodu można pominąć.
  select k.imie into stare from public.nauka_kody k where k.user_id = uid;
  if v_imie is null then v_imie := stare; end if;
  if v_imie is null or char_length(v_imie) not between 3 and 80 or v_imie !~ '\S+\s+\S+' then
    return jsonb_build_object('ok', false, 'code', 'zle_imie');
  end if;
  if v_kod !~ '^[A-Z0-9]{4,16}$' then return jsonb_build_object('ok', false, 'code', 'zly_kod'); end if;
  if v_kod in ('SKROT', 'SKROTBM', 'ADMIN', 'STAROSTA', 'PROMO', 'RABAT', 'ZNIZKA', 'TEST', 'STRIPE') then
    return jsonb_build_object('ok', false, 'code', 'zarezerwowany');
  end if;
  if exists (select 1 from public.nauka_kody k where k.kod = v_kod and k.user_id <> uid) then
    return jsonb_build_object('ok', false, 'code', 'zajety');
  end if;
  begin
    insert into public.nauka_kody (user_id, email, kod, imie) values (uid, em, v_kod, v_imie)
    on conflict (user_id) do update set kod = excluded.kod, email = excluded.email, imie = excluded.imie, zmieniony_at = now();
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'code', 'zajety');
  end;
  return jsonb_build_object('ok', true, 'kod', v_kod);
end $$$tresc$;
    insert into znaki_naprawione values ('public.nauka_polec_ustaw(text, text) (skrot-v18-imie-polecajacego.sql)');
  end if;
end $napraw$;

-- public.nauka_przed_zapisem(): skrot-v4-moje.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_przed_zapisem()') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_przed_zapisem()') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_przed_zapisem() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.created_at := now();
    if new.kolekcja in ('deadlines','reports') and not public.nauka_admin() then
      if (select count(*) from public.nauka_docs d
          where d.created_by = auth.uid() and d.kolekcja = new.kolekcja
            and d.created_at > now() - interval '1 hour') >= 20 then
        raise exception 'Za dużo wpisów w ciągu godziny. Spróbuj później.';
      end if;
    end if;
    if new.kolekcja = 'myMaterials' and not public.nauka_admin() then
      if (select count(*) from public.nauka_docs d
          where d.created_by = auth.uid() and d.kolekcja = 'myMaterials'
            and d.created_at > now() - interval '1 hour') >= 30 then
        raise exception 'Za dużo nowych materiałów w ciągu godziny. Spróbuj później.';
      end if;
    end if;
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end $$$tresc$;
    insert into znaki_naprawione values ('public.nauka_przed_zapisem() (skrot-v4-moje.sql)');
  end if;
end $napraw$;

-- public.nauka_przypomnienia_cfg(): skrot-v36-przypomnienia.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_przypomnienia_cfg()') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_przypomnienia_cfg()') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_przypomnienia_cfg() returns jsonb
language sql immutable set search_path = '' as $$
  -- limit_dzien: najwyżej tyle przypomnień na dobę UTC (Resend Free = 100 maili na dobę razem z mailami logowania).
  -- Po przejściu na Resend Pro podnieś (np. 1500). okno_min: jak długo po wybranej godzinie mail może jeszcze wyjść.
  select '{"limit_dzien": 60, "okno_min": 60, "log_dni": 180}'::jsonb
$$$tresc$;
    insert into znaki_naprawione values ('public.nauka_przypomnienia_cfg() (skrot-v36-przypomnienia.sql)');
  end if;
end $napraw$;

-- public.nauka_ranking(text, text, text): skrot-v13-gry.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_ranking(text, text, text)') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_ranking(text, text, text)') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_ranking(p_zakres text default 'tydzien', p_grupa text default null, p_sid text default null)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  c jsonb := public.nauka_rp_cfg();
  v_d date := public.nauka_dzis();
  v_od date; v_do date; me public.nauka_profil; v_moje int; v_out jsonb;
  v_w_grupie boolean := p_grupa is null or coalesce(public.nauka_rp_grupa(auth.uid()) = p_grupa, false);
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_platny() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  if p_zakres = 'semestr' then v_od := (c->>'semestr_od')::date; v_do := v_d;
  else v_od := public.nauka_tydzien(v_d); v_do := v_od + 6; end if;
  select * into me from public.nauka_profil where user_id = auth.uid();
  select coalesce(sum(r.pkt), 0) into v_moje from public.nauka_rp r
   where r.user_id = auth.uid() and r.dzien between v_od and v_do and (p_sid is null or r.sid = p_sid);

  with suma as (
    select r.user_id, sum(r.pkt)::int pkt from public.nauka_rp r
     where r.dzien between v_od and v_do and (p_sid is null or r.sid = p_sid)
     group by r.user_id),
  widoczni as (
    select s.user_id, p.nick, s.pkt from suma s join public.nauka_profil p on p.user_id = s.user_id
     where p.w_rankingu and p.nick is not null and s.pkt > 0
       and p.kierunek = coalesce(me.kierunek, c->>'kierunek') and p.rocznik = coalesce(me.rocznik, (c->>'rocznik')::int)
       and (p_grupa is null or public.nauka_rp_grupa(s.user_id) = p_grupa)
       and not exists (select 1 from public.nauka_konta k where k.user_id = s.user_id and k.zablokowane)
       and not ((c->>'ukryj_adminow')::boolean and public.nauka_rp_admin_uid(s.user_id))),
  miejsca as (
    select w.*, rank() over (order by w.pkt desc) miejsce, row_number() over (order by w.pkt desc, lower(w.nick)) lp
      from widoczni w),
  ja as (select * from miejsca where user_id = auth.uid())
  select jsonb_build_object(
    'ok', true, 'zakres', coalesce(p_zakres, 'tydzien'), 'od', v_od, 'do', v_do, 'grupa', p_grupa, 'sid', p_sid,
    'n', (select count(*) from miejsca),
    'top', coalesce((select jsonb_agg(jsonb_build_object('miejsce', m.miejsce, 'nick', m.nick, 'pkt', m.pkt, 'ja', m.user_id = auth.uid()) order by m.lp)
                     from miejsca m where m.lp <= 10), '[]'::jsonb),
    'sasiedzi', coalesce((select jsonb_agg(jsonb_build_object('miejsce', m.miejsce, 'nick', m.nick, 'pkt', m.pkt, 'ja', m.user_id = auth.uid()) order by m.lp)
                          from miejsca m, ja where m.lp between ja.lp - 2 and ja.lp + 2 and ja.lp > 10), '[]'::jsonb),
    -- „ja”: moje miejsce. Gdy jestem ukryty, liczymy, które miejsce bym miał (inni widzą listę bez mnie).
    -- Gdy filtr grupy to nie moja grupa: tylko moje punkty, bez miejsca.
    'ja', jsonb_build_object(
       'pkt', v_moje,
       'widoczny', exists (select 1 from ja),
       'w_grupie', v_w_grupie,
       'miejsce', case when not v_w_grupie then null
                       else coalesce((select miejsce from ja), case when v_moje > 0 then 1 + (select count(*) from miejsca where pkt > v_moje) end) end,
       'z', case when not v_w_grupie then null
                 else (select count(*) from miejsca) + case when exists (select 1 from ja) or v_moje = 0 then 0 else 1 end end)
  ) into v_out;
  return v_out;
end $$$tresc$;
    insert into znaki_naprawione values ('public.nauka_ranking(text, text, text) (skrot-v13-gry.sql)');
  end if;
end $napraw$;

-- public.nauka_rocznik_zapisz(uuid, text): skrot-v31-roczniki.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_rocznik_zapisz(uuid, text)') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_rocznik_zapisz(uuid, text)') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_rocznik_zapisz(p_user uuid, p_rocznik text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare k record;
begin
  select r.id, r.nabor, kk.kod into k from public.nauka_roczniki r join public.nauka_kierunki kk on kk.id = r.kierunek_id
   where r.id = p_rocznik and r.status in ('oczekujacy', 'platny');
  if not found then return false; end if;
  begin
    insert into public.nauka_profil (user_id, kierunek, rocznik, rocznik_id, rocznik_wybrany_at)
    values (p_user, k.kod, k.nabor, k.id, now())
    on conflict (user_id) do update set kierunek = excluded.kierunek, rocznik = excluded.rocznik,
      rocznik_id = excluded.rocznik_id, rocznik_wybrany_at = now(), updated_at = now();
  exception when unique_violation then
    -- ten sam pseudonim jest już w rankingu nowego rocznika: pseudonim do ustawienia od nowa
    update public.nauka_profil set nick = null, w_rankingu = false, nick_zmiana = null, kierunek = k.kod, rocznik = k.nabor,
      rocznik_id = k.id, rocznik_wybrany_at = now(), updated_at = now() where user_id = p_user;
  end;
  return true;
end $$$tresc$;
    insert into znaki_naprawione values ('public.nauka_rocznik_zapisz(uuid, text) (skrot-v31-roczniki.sql)');
  end if;
end $napraw$;

-- public.nauka_rp_cfg(): skrot-v13-gry.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_rp_cfg()') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_rp_cfg()') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_rp_cfg() returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object(
    'kierunek', 'BM', 'rocznik', 2026,
    'semestr_od', '2026-10-01',        -- początek semestru do widoku „Semestr”; w lutym zmień na datę 2. semestru
    'pkt_abcd', 10, 'pkt_zadanie', 20, 'pkt_powtorka', 1, 'pkt_lekcja', 30, 'pkt_seria', 5,
    'max_dzien_gry', 150,              -- odpowiedzi w grach + punkty za wynik
    'max_dzien_quiz', 300,
    'max_dzien_powtorki', 20,
    'max_dzien_lekcje', 150,
    'max_wynik_runda', 20, 'rundy_z_pkt_dzien', 3,
    'max_odp_minuta', 20, 'max_rund_dzien', 40, 'max_pytan_runda', 12,
    'min_osob_stat', 5, 'min_odp_stat', 20,
    'ukryj_adminow', true
  )
$$$tresc$;
    insert into znaki_naprawione values ('public.nauka_rp_cfg() (skrot-v13-gry.sql)');
  end if;
end $napraw$;

-- public.nauka_rp_dodaj(uuid, text, text, text, int, uuid): skrot-v13-gry.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_rp_dodaj(uuid, text, text, text, int, uuid)') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_rp_dodaj(uuid, text, text, text, int, uuid)') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_rp_dodaj(p_user uuid, p_zrodlo text, p_klucz text, p_sid text, p_pkt int, p_run uuid default null)
returns int
language plpgsql security definer set search_path = '' as $$
declare
  c jsonb := public.nauka_rp_cfg();
  d date := public.nauka_dzis();
  pula text := public.nauka_rp_pula(p_zrodlo);
  limit_ int;
  uzyte int;
  dam int;
  n int;
  pierwsze boolean;
begin
  if p_pkt is null or p_pkt <= 0 then return 0; end if;
  limit_ := case pula when 'gry' then (c->>'max_dzien_gry')::int when 'quiz' then (c->>'max_dzien_quiz')::int
                      when 'powtorki' then (c->>'max_dzien_powtorki')::int when 'lekcje' then (c->>'max_dzien_lekcje')::int
                      else 1000 end;
  -- blokada na osobę, żeby dwa równoległe zapytania nie przekroczyły limitu
  perform pg_advisory_xact_lock(hashtext('nauka_rp:' || p_user::text));
  select coalesce(sum(r.pkt), 0) into uzyte from public.nauka_rp r
   where r.user_id = p_user and r.dzien = d and public.nauka_rp_pula(r.zrodlo) = pula;
  dam := least(p_pkt, greatest(0, limit_ - uzyte));
  if dam <= 0 then return 0; end if;
  pierwsze := not exists (select 1 from public.nauka_rp r where r.user_id = p_user and r.dzien = d);
  insert into public.nauka_rp (user_id, dzien, tydzien, zrodlo, klucz, sid, pkt, run_id)
  values (p_user, d, public.nauka_tydzien(d), p_zrodlo, left(p_klucz, 200), p_sid, dam, p_run)
  on conflict (user_id, dzien, klucz) do nothing;
  get diagnostics n = row_count;
  if n = 0 then return 0; end if;
  if pierwsze and exists (select 1 from public.nauka_rp r where r.user_id = p_user and r.dzien = d - 1) then
    insert into public.nauka_rp (user_id, dzien, tydzien, zrodlo, klucz, sid, pkt)
    values (p_user, d, public.nauka_tydzien(d), 'seria', 'seria', null, (c->>'pkt_seria')::int)
    on conflict (user_id, dzien, klucz) do nothing;
  end if;
  return dam;
end $$$tresc$;
    insert into znaki_naprawione values ('public.nauka_rp_dodaj(uuid, text, text, text, int, uuid) (skrot-v13-gry.sql)');
  end if;
end $napraw$;

-- public.nauka_sklep_kup(text, text): skrot-v24-kosmetyki.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_sklep_kup(text, text)') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_sklep_kup(text, text)') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_sklep_kup(p_item text, p_req text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  u uuid := auth.uid();
  it jsonb; cena int; s int; lv int; minlv int; brak text[]; c text; n int;
begin
  if u is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  perform pg_advisory_xact_lock(hashtext('nauka_mon:' || u::text));
  it := public.nauka_kat_item(p_item);
  if it is null then return jsonb_build_object('ok', false, 'code', 'no_item'); end if;
  s := public.nauka_saldo(u);
  if it->'cena' is null or jsonb_typeof(it->'cena') <> 'number' then
    return jsonb_build_object('ok', false, 'code', 'not_for_sale', 'saldo', s);
  end if;
  if not public.nauka_sezon_otwarty(it->>'sezon') then
    return jsonb_build_object('ok', false, 'code', 'season', 'saldo', s);
  end if;
  if it ? 'wymaga' and not public.nauka_ma(u, it->>'wymaga') then
    return jsonb_build_object('ok', false, 'code', 'needs', 'wymaga', it->>'wymaga', 'saldo', s);
  end if;

  -- Zamrożenie serii: przedmiot „na sztuki”, najwyżej max w zapasie.
  if p_item = 'zamrozenie' then
    if p_req is null or p_req !~ '^[A-Za-z0-9-]{8,64}$' then return jsonb_build_object('ok', false, 'code', 'no_req'); end if;
    if exists (select 1 from public.nauka_zamrozenia where user_id = u and req = p_req) then
      return jsonb_build_object('ok', true, 'item', p_item, 'juz', true, 'saldo', s,
        'zamrozenia', (select count(*) from public.nauka_zamrozenia where user_id = u and uzyte_dzien is null));
    end if;
    if (select count(*) from public.nauka_zamrozenia where user_id = u and uzyte_dzien is null) >= (it->>'max')::int then
      return jsonb_build_object('ok', false, 'code', 'max', 'saldo', s);
    end if;
    cena := (it->>'cena')::int;
    if s < cena then return jsonb_build_object('ok', false, 'code', 'no_coins', 'brakuje', cena - s, 'saldo', s); end if;
    insert into public.nauka_zamrozenia (user_id, req, cena) values (u, p_req, cena);
    insert into public.nauka_monety (user_id, delta, zrodlo, klucz, opis)
    values (u, -cena, 'zakup', 'zakup:zamrozenie:' || p_req, 'Zakup: ' || (it->>'pl'));
    return jsonb_build_object('ok', true, 'item', p_item, 'cena', cena, 'saldo', s - cena,
      'zamrozenia', (select count(*) from public.nauka_zamrozenia where user_id = u and uzyte_dzien is null));
  end if;

  if exists (select 1 from public.nauka_posiadane where user_id = u and item = p_item) then
    return jsonb_build_object('ok', false, 'code', 'owned', 'saldo', s);
  end if;
  lv := public.nauka_poziom(u);

  if it ? 'czesci' then
    -- Zestaw: płacisz za brakujące części, nigdy więcej niż za nie osobno.
    select coalesce(array_agg(x order by o), '{}') into brak
      from jsonb_array_elements_text(it->'czesci') with ordinality t(x, o)
     where not exists (select 1 from public.nauka_posiadane p where p.user_id = u and p.item = x);
    if cardinality(brak) = 0 then return jsonb_build_object('ok', false, 'code', 'owned', 'saldo', s); end if;
    select coalesce(max((public.nauka_kat_item(x)->>'min_poziom')::int), 0),
           least((it->>'cena')::int, coalesce(sum((public.nauka_kat_item(x)->>'cena')::int), 0))
      into minlv, cena from unnest(brak) x;
    if lv < minlv then return jsonb_build_object('ok', false, 'code', 'level', 'poziom', minlv, 'saldo', s); end if;
    if s < cena then return jsonb_build_object('ok', false, 'code', 'no_coins', 'brakuje', cena - s, 'saldo', s); end if;
    insert into public.nauka_posiadane (user_id, item, cena) values (u, p_item, cena);
    foreach c in array brak loop
      insert into public.nauka_posiadane (user_id, item, cena, powod) values (u, c, 0, p_item) on conflict do nothing;
    end loop;
  else
    if it ? 'min_poziom' and lv < (it->>'min_poziom')::int then
      return jsonb_build_object('ok', false, 'code', 'level', 'poziom', (it->>'min_poziom')::int, 'saldo', s);
    end if;
    cena := (it->>'cena')::int;
    if s < cena then return jsonb_build_object('ok', false, 'code', 'no_coins', 'brakuje', cena - s, 'saldo', s); end if;
    insert into public.nauka_posiadane (user_id, item, cena) values (u, p_item, cena);
  end if;

  if cena > 0 then
    insert into public.nauka_monety (user_id, delta, zrodlo, klucz, opis)
    values (u, -cena, 'zakup', 'zakup:' || p_item, 'Zakup: ' || (it->>'pl'))
    on conflict (user_id, klucz) do nothing;
    get diagnostics n = row_count;
    if n = 0 then raise exception 'nauka_sklep_kup: podwójny wpis zakupu %', p_item; end if;   -- cofa całą transakcję
  end if;
  return jsonb_build_object('ok', true, 'item', p_item, 'cena', cena, 'saldo', s - cena,
    'czesci', case when it ? 'czesci' then to_jsonb(brak) end);
end $$$tresc$;
    insert into znaki_naprawione values ('public.nauka_sklep_kup(text, text) (skrot-v24-kosmetyki.sql)');
  end if;
end $napraw$;

-- public.nauka_zalogowano(text, text): skrot-v11-aktywnosc.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_zalogowano(text, text)') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_zalogowano(text, text)') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_zalogowano(p_metoda text default '', p_nazwa text default '') returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  dev text := public.nauka_urzadzenie_id();
begin
  if uid is null then raise exception 'nie_zalogowany'; end if;
  p_metoda := case when p_metoda in ('kod', 'haslo', 'link') then p_metoda else '' end;
  -- To samo logowanie zgłoszone dwa razy (np. dwie karty) zapisujemy raz.
  if exists (select 1 from public.nauka_logowania l where l.user_id = uid and l.device_id is not distinct from dev
               and l.at > now() - interval '2 minutes') then
    return jsonb_build_object('ok', true);
  end if;
  insert into public.nauka_logowania (user_id, email, metoda, device_id, nazwa, ip)
    values (uid, public.nauka_email(), p_metoda, dev, left(coalesce(p_nazwa, ''), 60), public.nauka_ip());
  delete from public.nauka_logowania where at < now() - public.nauka_historia_trzymaj();
  return jsonb_build_object('ok', true);
end $$$tresc$;
    insert into znaki_naprawione values ('public.nauka_zalogowano(text, text) (skrot-v11-aktywnosc.sql)');
  end if;
end $napraw$;

-- public.nauka_zdarzenia_typy(): skrot-v30-profil.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_zdarzenia_typy()') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_zdarzenia_typy()') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_zdarzenia_typy()
returns jsonb language sql immutable set search_path = '' as $$
  select jsonb_build_object(
    'review_graded', true,   -- ocena fiszki: termin następnej powtórki (FSRS)
    'exit_ticket', true,     -- bilet wyjścia: „umiesz” i powtórki po lekcji
    'lesson_step', false,    -- kroki lekcji: które pomagają
    'session_started', false,
    'session_ended', false,  -- czas aktywny sesji: długość bloku
    'break_event', false,
    'profile_test', false,   -- przebieg testu „Jak się uczysz?”
    'activity', true         -- aktywność nauki (quiz, gra, Po zajęciach, Staś…): dzień, temat i wynik; potrzebne do serii,
                             -- przypomnień i duetu (etapy 7 i 10), dlatego zapisywane także przy wyłączonym „Ucz się na moich danych”
  );
$$$tresc$;
    insert into znaki_naprawione values ('public.nauka_zdarzenia_typy() (skrot-v30-profil.sql)');
  end if;
end $napraw$;

-- public.nauka_zgoda(text, text, text, text): skrot-v12-zabezpieczenia.sql
do $napraw$ begin
  if to_regprocedure('public.nauka_zgoda(text, text, text, text)') is not null
     and exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.nauka_zgoda(text, text, text, text)') and p.prosrc ~ 'Ň|ń[ÖáôĄÜė]|√[≥ď]') then
    execute $tresc$create or replace function public.nauka_zgoda(p_plan text, p_tresc text, p_wersja text, p_ua text default null)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_id bigint;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'code', 'not_logged_in');
  end if;
  if p_plan not in ('rok', 'miesiac') then
    return jsonb_build_object('ok', false, 'code', 'bad_plan');
  end if;
  -- ochrona przed zasypaniem tabeli: najwyżej 20 zgód na godzinę na konto
  if (select count(*) from public.nauka_zgody z where z.user_id = auth.uid() and z.created_at > now() - interval '1 hour') >= 20 then
    return jsonb_build_object('ok', false, 'code', 'too_many');
  end if;
  insert into public.nauka_zgody (user_id, email, plan, tresc, wersja, user_agent)
  values (auth.uid(), v_email, p_plan, left(coalesce(p_tresc, ''), 2000), left(coalesce(p_wersja, ''), 40), left(p_ua, 400))
  returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$$tresc$;
    insert into znaki_naprawione values ('public.nauka_zgoda(text, text, text, text) (skrot-v12-zabezpieczenia.sql)');
  end if;
end $napraw$;

-- SPRAWDZENIE-START
create temp table if not exists znaki_zostalo (co text);
truncate znaki_zostalo;
do $sprawdz$
declare c record; n bigint; wzor text := 'Ň|ń[ÖáôĄÜė]|√[≥ď]';
begin
  for c in select p.oid::regprocedure::text s from pg_proc p
            where p.pronamespace = 'public'::regnamespace and p.prosrc ~ wzor order by 1 loop
    insert into znaki_zostalo values ('funkcja ' || c.s);
  end loop;
  for c in select col.table_name t, col.column_name k
             from information_schema.columns col
             join information_schema.tables tb on tb.table_schema = col.table_schema and tb.table_name = col.table_name
            where col.table_schema = 'public' and tb.table_type = 'BASE TABLE'
              and col.data_type in ('text', 'jsonb', 'json', 'character varying', 'ARRAY')
            order by 1, 2 loop
    execute format('select count(*) from public.%I where %I::text ~ $1', c.t, c.k) into n using wzor;
    if n > 0 then insert into znaki_zostalo values ('tabela ' || c.t || '.' || c.k || ': ' || n || ' wierszy'); end if;
  end loop;
end $sprawdz$;

select 'naprawiono: ' || co as wynik from znaki_naprawione
union all select 'ZOSTAŁO: ' || co from znaki_zostalo;
