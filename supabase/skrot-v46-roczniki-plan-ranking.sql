-- Skrót v46: plan i kalendarz per rocznik, ranking po roczniku (spec „Fundament pod inne kierunki”, Etapy 5–6).
-- Wklej w Supabase → SQL Editor → Run, po v45. Kopiuj z github.com (przycisk „Copy raw file”), nie przez Terminal.
-- Można uruchomić ponownie. Dla BM nic się nie zmienia.

-- Strażnik kodowania: polskie litery wpisane wprost muszą być równe tym samym literom zapisanym kodami (same znaki ASCII).
-- Gdy plik przeszedł przez Terminal albo zły schowek, litery z pierwszej strony się psują („Ňā”, „√≥”), a kody nie,
-- więc warunek nie przechodzi i plik zatrzymuje się na pierwszej instrukcji, zanim cokolwiek zmieni.
-- Ten blok wklejamy na sam początek każdej nowej migracji (od v44); pilnuje tego tests/migracje.test.js.
do $$ begin
  if 'ąćęłńóśźż' <> U&'\0105\0107\0119\0142\0144\00F3\015B\017A\017C' then
    raise exception 'Polskie znaki doszły zepsute. Skopiuj plik z github.com (Raw), nie przez Terminal.';
  end if;
end $$;

-- ================= Etap 5: plan i kalendarz per rocznik =================
-- Plany wszystkich roczników na hoście plan.skrotbm.pl (CSP strony bez zmian): BM dalej plan.json, inne plan/<rocznik>.json.
alter table public.nauka_roczniki add column if not exists plan_url text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'nauka_roczniki_plan_url_chk') then
    alter table public.nauka_roczniki add constraint nauka_roczniki_plan_url_chk
      check (plan_url is null or plan_url ~ '^https://plan\.skrotbm\.pl/[a-z0-9/._-]+\.json$');
  end if;
end $$;
update public.nauka_roczniki set plan_url = 'https://plan.skrotbm.pl/plan.json' where id = public.nauka_bm() and plan_url is null;
update public.nauka_roczniki set plan_url = 'https://plan.skrotbm.pl/plan/' || id || '.json' where id <> public.nauka_bm() and plan_url is null;
-- nowy rocznik dostaje adres sam (wpis bez plan_url)
create or replace function public.nauka_roczniki_plan_url() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.plan_url is null then
    new.plan_url := case when new.id = public.nauka_bm() then 'https://plan.skrotbm.pl/plan.json' else 'https://plan.skrotbm.pl/plan/' || new.id || '.json' end;
  end if;
  return new;
end $$;
drop trigger if exists nauka_roczniki_plan_url on public.nauka_roczniki;
create trigger nauka_roczniki_plan_url before insert on public.nauka_roczniki for each row execute function public.nauka_roczniki_plan_url();

-- Lista roczników (v31) + adres planu i sekcja Działu Obsługi Studenta wydziału (odwołane zajęcia bez Teams, importer planu).
create or replace function public.nauka_roczniki_lista() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', r.id, 'nabor', r.nabor, 'status', r.status, 'plan_url', r.plan_url,
    'kierunek', jsonb_build_object('id', k.id, 'kod', k.kod, 'pl', k.nazwa_pl, 'en', k.nazwa_en,
                                   'stopien', k.stopien, 'tryb', k.tryb, 'jezyk', k.jezyk),
    'wydzial', jsonb_build_object('kod', w.kod, 'pl', w.nazwa_pl, 'en', w.nazwa_en, 'dos_url', w.dos_url)
  ) order by w.kod, k.nazwa_pl, r.nabor desc), '[]'::jsonb)
  from public.nauka_roczniki r
  join public.nauka_kierunki k on k.id = r.kierunek_id
  join public.nauka_wydzialy w on w.kod = k.wydzial
$$;

create or replace function public.nauka_kalendarz_dane(p_token text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare k public.nauka_kalendarz; prog jsonb; ok boolean;
begin
  select * into k from public.nauka_kalendarz where token = p_token;
  if not found then return null; end if;
  update public.nauka_kalendarz set uzyty_at = now() where user_id = k.user_id;
  ok := exists (select 1 from public.nauka_admini a where a.email = k.email)
     or ((exists (select 1 from public.nauka_dostep d
                 where d.do_kiedy >= current_date and d.rocznik_id = public.nauka_rocznik_uid(k.user_id)
                   and (d.user_id = k.user_id or (k.email <> '' and d.email = k.email)))
             or exists (select 1 from public.nauka_proby p where p.user_id = k.user_id and p.do_kiedy > now()))
         and not exists (select 1 from public.nauka_konta b where b.user_id = k.user_id and b.zablokowane));
  select d.data into prog from public.nauka_docs d where d.kolekcja = 'progress' and d.id = k.user_id::text;
  return jsonb_build_object(
    'platny', ok,
    -- v46: plan rocznika właściciela linku (funkcja kalendarz bierze go zamiast plan.json BM)
    'plan_url', (select r.plan_url from public.nauka_roczniki r where r.id = public.nauka_rocznik_uid(k.user_id)),
    'grupa', prog ->> 'group',
    'podgrupa', prog ->> 'sub',
    'terminy', case when ok then coalesce((select jsonb_agg(d.data || jsonb_build_object('id', d.id))
                                            from public.nauka_docs d where d.kolekcja = 'deadlines'
                                             and (d.rocznik_id is null or d.rocznik_id = public.nauka_rocznik_uid(k.user_id))), '[]'::jsonb)
                    else '[]'::jsonb end,
    'moje', case when ok and jsonb_typeof(prog -> 'myEvents') = 'array'
                 then coalesce((select jsonb_agg(e) from (select e from jsonb_array_elements(prog -> 'myEvents') e
                                where jsonb_typeof(e) = 'object' limit 400) x), '[]'::jsonb)
                 else '[]'::jsonb end,
    'zaliczenia', case when ok and jsonb_typeof(prog -> 'exams') = 'object'
                       then coalesce((select jsonb_agg(jsonb_build_object('k', x.key, 'date', x.value ->> 'date'))
                                        from jsonb_each(prog -> 'exams') x
                                       where jsonb_typeof(x.value) = 'object' and (x.value ->> 'date') ~ '^\d{4}-\d{2}-\d{2}$'), '[]'::jsonb)
                       else '[]'::jsonb end,
    'plan', case when ok and jsonb_typeof(prog -> 'planDays') = 'array'
                 then coalesce((select jsonb_agg(e) from (select e from jsonb_array_elements(prog -> 'planDays') e
                                where jsonb_typeof(e) = 'object' limit 200) x), '[]'::jsonb)
                 else '[]'::jsonb end
  );
end $$;

notify pgrst, 'reload schema';
