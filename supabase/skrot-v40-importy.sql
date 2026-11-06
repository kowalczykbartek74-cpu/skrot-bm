-- Skrót v40: kolejka importów „PDF → szkic AI → zatwierdzenie → import” (etap 14 „Systemy z Zdawalni w Skrócie”),
-- funkcja serwerowa supabase/functions/importy, panel Narzędzia starosty → Importy, logika importy.js.
-- Wklej w Supabase → SQL Editor → Run, po v39. Można uruchamiać wielokrotnie.
--
-- Port pomysłu z matura-app app/admin/arkusze (szkic z PDF-u, decyzja przy każdej pozycji, import dopiero po zatwierdzeniu).
-- 1. Tabela nauka_importy: typ (sylabus | plan | tresc), wydział (kod profilu importy/<WYDZIAŁ>.json), rocznik (opcjonalnie),
--    plik (sha256, nazwa, rozmiar, liczba stron), stan szkic → do_sprawdzenia → zatwierdzony / odrzucony, pozycje (JSON z decyzją
--    przy każdej: null | tak | popraw | nie), uwagi, gotowy wynik po zatwierdzeniu (gotowe), kto i kiedy.
-- 2. Wszystko tylko dla administratora (nauka_admin()). Wyjątek: nauka_import_plan_publiczny(rocznik) — zatwierdzony plan
--    zajęć dla repozytorium plan-bm (anon, jak nauka_odwolania_publiczne z v26). Nic z AI nie wychodzi bez zatwierdzenia.
-- 3. PDF w prywatnym buckecie Storage „importy” (<id importu>.pdf, tylko PDF, do 15 MB, bez polityk dla anon/authenticated:
--    zapisuje i czyta wyłącznie funkcja Edge kluczem serwisowym). Kasowany po zatwierdzeniu/odrzuceniu (panel woła
--    „sprzataj”) albo po 30 dniach: codziennie pg_cron (nauka_importy_retencja) i przy każdym wgraniu nowego PDF-u.
--    Supabase nie pozwala kasować plików prosto z SQL w nowszych projektach (storage.protect_delete): wtedy cron tylko
--    zostawia notkę, a pliki kasuje funkcja Edge przez API Storage przy najbliższym użyciu importów.

-- ---------- 1) bucket ----------
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('importy', 'importy', false, 15728640, array['application/pdf'])
    on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
    raise notice 'OK bucket importy (prywatny)';
  else
    raise notice 'Brak schematu storage (lokalny test): bucket pominięty';
  end if;
end $$;

-- ---------- 2) tabela ----------
create table if not exists public.nauka_importy (
  id              uuid primary key default gen_random_uuid(),
  typ             text not null check (typ in ('sylabus', 'plan', 'tresc')),
  wydzial         text not null check (wydzial ~ '^[A-Za-z]{2,12}$'),
  rocznik_id      text references public.nauka_roczniki (id),
  opis            text check (opis is null or char_length(opis) <= 300),
  plik_sha256     text not null check (plik_sha256 ~ '^[0-9a-f]{64}$'),
  plik_nazwa      text not null check (char_length(plik_nazwa) between 1 and 200),
  plik_bajty      int  not null check (plik_bajty between 1 and 15728640),
  strony          int  not null check (strony between 1 and 2000),
  czesci          int  not null check (czesci between 1 and 500),
  przeczytane     int[] not null default '{}',
  stan            text not null default 'szkic' check (stan in ('szkic', 'do_sprawdzenia', 'zatwierdzony', 'odrzucony')),
  pozycje         jsonb not null default '[]'::jsonb check (jsonb_typeof(pozycje) = 'array'),
  uwagi_ai        jsonb not null default '{}'::jsonb,          -- { "<część>": "uwagi modelu" }
  uwagi           text check (uwagi is null or char_length(uwagi) <= 2000),
  gotowe          jsonb,                                       -- wynik po zatwierdzeniu (format sylabus.json / plan.json)
  model           text,
  tokeny          jsonb not null default '{"input_tokens":0,"output_tokens":0}'::jsonb,
  pdf_sciezka     text,
  pdf_usuniety_at timestamptz,
  utworzyl        uuid,
  utworzony_at    timestamptz not null default now(),
  zmieniony_at    timestamptz not null default now(),
  zakonczyl       uuid,
  zakonczony_at   timestamptz
);
create index if not exists nauka_importy_stan on public.nauka_importy (typ, rocznik_id, stan, zakonczony_at desc);
create index if not exists nauka_importy_sha on public.nauka_importy (plik_sha256);
alter table public.nauka_importy enable row level security;
revoke all on public.nauka_importy from public, anon, authenticated;

-- Wiersz dla panelu i funkcji Edge (z pozycjami albo bez, dla listy).
create or replace function public.nauka_import_json(r public.nauka_importy, p_pelny boolean) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', r.id, 'typ', r.typ, 'wydzial', r.wydzial, 'rocznik_id', r.rocznik_id, 'opis', r.opis,
    'plik_sha256', r.plik_sha256, 'plik_nazwa', r.plik_nazwa, 'plik_bajty', r.plik_bajty, 'strony', r.strony, 'czesci', r.czesci,
    'przeczytane', to_jsonb(r.przeczytane), 'stan', r.stan, 'uwagi', r.uwagi, 'model', r.model, 'tokeny', r.tokeny,
    'pdf_sciezka', r.pdf_sciezka, 'pdf_usuniety_at', r.pdf_usuniety_at,
    'utworzony_at', r.utworzony_at, 'zmieniony_at', r.zmieniony_at, 'zakonczony_at', r.zakonczony_at,
    'licznik', (select jsonb_build_object(
        'razem', count(*),
        'czeka', count(*) filter (where p->>'decyzja' is null),
        'tak', count(*) filter (where p->>'decyzja' = 'tak'),
        'popraw', count(*) filter (where p->>'decyzja' = 'popraw'),
        'nie', count(*) filter (where p->>'decyzja' = 'nie'))
      from jsonb_array_elements(r.pozycje) p))
  || case when p_pelny then jsonb_build_object('pozycje', r.pozycje, 'uwagi_ai', r.uwagi_ai, 'gotowe', r.gotowe) else '{}'::jsonb end
$$;
revoke all on function public.nauka_import_json(public.nauka_importy, boolean) from public, anon, authenticated;

-- ---------- 3) funkcje dla panelu i funkcji Edge (tylko administrator) ----------
-- Nowy import po wgraniu PDF-u. Ten sam plik (sha256) dla tego samego typu i wydziału, jeszcze otwarty → ten sam import.
-- Zwraca {ok, id, sciezka, istnieje, pdf (czy plik jest jeszcze w buckecie)} albo {ok:false, code}.
create or replace function public.nauka_import_nowy(p_typ text, p_wydzial text, p_rocznik text, p_opis text, p_sha text,
  p_nazwa text, p_bajty int, p_strony int, p_czesci int) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare r public.nauka_importy; nid uuid;
begin
  if not public.nauka_admin() then return jsonb_build_object('ok', false, 'code', 'not_admin'); end if;
  if p_typ is null or p_typ not in ('sylabus', 'plan', 'tresc') then return jsonb_build_object('ok', false, 'code', 'bad_type'); end if;
  if p_rocznik is not null and not exists (select 1 from public.nauka_roczniki k where k.id = p_rocznik) then
    return jsonb_build_object('ok', false, 'code', 'bad_rocznik');
  end if;
  select * into r from public.nauka_importy i
   where i.plik_sha256 = p_sha and i.typ = p_typ and i.wydzial = p_wydzial and i.stan in ('szkic', 'do_sprawdzenia')
   order by i.utworzony_at desc limit 1;
  if found then
    return jsonb_build_object('ok', true, 'id', r.id, 'sciezka', r.pdf_sciezka, 'istnieje', true, 'pdf', r.pdf_usuniety_at is null);
  end if;
  nid := gen_random_uuid();
  insert into public.nauka_importy (id, typ, wydzial, rocznik_id, opis, plik_sha256, plik_nazwa, plik_bajty, strony, czesci, pdf_sciezka, utworzyl)
  values (nid, p_typ, p_wydzial, p_rocznik, nullif(btrim(coalesce(p_opis, '')), ''), p_sha, p_nazwa, p_bajty, p_strony, p_czesci,
          nid::text || '.pdf', auth.uid());
  return jsonb_build_object('ok', true, 'id', nid, 'sciezka', nid::text || '.pdf', 'istnieje', false, 'pdf', false);
end $$;

-- Pozycje jednej przeczytanej części (szkic). Ponowne czytanie tej samej części podmienia jej pozycje; numery n od 1 po kolei
-- (część, strona). Gdy przeczytane są wszystkie części → do_sprawdzenia.
create or replace function public.nauka_import_czesc(p_id uuid, p_czesc int, p_pozycje jsonb, p_uwagi text, p_model text, p_usage jsonb)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare r public.nauka_importy; nowe jsonb; prz int[];
begin
  if not public.nauka_admin() then return jsonb_build_object('ok', false, 'code', 'not_admin'); end if;
  select * into r from public.nauka_importy i where i.id = p_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if r.stan <> 'szkic' then return jsonb_build_object('ok', false, 'code', 'bad_state'); end if;
  if p_czesc is null or p_czesc < 1 or p_czesc > r.czesci then return jsonb_build_object('ok', false, 'code', 'bad_part'); end if;
  if p_pozycje is null or jsonb_typeof(p_pozycje) <> 'array' or jsonb_array_length(p_pozycje) > 200
     or exists (select 1 from jsonb_array_elements(p_pozycje) p
                 where jsonb_typeof(p) <> 'object' or jsonb_typeof(p->'dane') is distinct from 'object'
                    or jsonb_typeof(p->'strona') is distinct from 'number')
     or octet_length(p_pozycje::text) > 2000000 then
    return jsonb_build_object('ok', false, 'code', 'bad_items');
  end if;
  select coalesce(jsonb_agg(x.p || jsonb_build_object('n', x.rn) order by x.rn), '[]'::jsonb) into nowe
  from (select q.p, row_number() over (order by q.cz, q.st, q.ord) rn
        from (select e.p, (e.p->>'czesc')::int cz, (e.p->>'strona')::int st, e.ord
                from jsonb_array_elements(r.pozycje) with ordinality e(p, ord) where (e.p->>'czesc')::int <> p_czesc
              union all
              select jsonb_build_object('czesc', p_czesc, 'strona', (e.p->>'strona')::int, 'fragment', left(coalesce(e.p->>'fragment', ''), 400),
                       'dane', e.p->'dane', 'decyzja', null), p_czesc, (e.p->>'strona')::int, 100000 + e.ord
                from jsonb_array_elements(p_pozycje) with ordinality e(p, ord)) q) x;
  select array(select distinct v from unnest(r.przeczytane || p_czesc) v order by v) into prz;
  update public.nauka_importy i set
    pozycje = nowe, przeczytane = prz,
    uwagi_ai = case when nullif(btrim(coalesce(p_uwagi, '')), '') is null then i.uwagi_ai - p_czesc::text
                    else i.uwagi_ai || jsonb_build_object(p_czesc::text, left(p_uwagi, 2000)) end,
    model = coalesce(left(p_model, 80), i.model),
    tokeny = jsonb_build_object(
      'input_tokens', coalesce((i.tokeny->>'input_tokens')::bigint, 0) + coalesce((p_usage->>'input_tokens')::bigint, 0),
      'output_tokens', coalesce((i.tokeny->>'output_tokens')::bigint, 0) + coalesce((p_usage->>'output_tokens')::bigint, 0)),
    stan = case when cardinality(prz) >= i.czesci then 'do_sprawdzenia' else 'szkic' end,
    zmieniony_at = now()
  where i.id = p_id returning * into r;
  return jsonb_build_object('ok', true, 'stan', r.stan, 'przeczytane', to_jsonb(r.przeczytane), 'czesci', r.czesci, 'pozycji', jsonb_array_length(r.pozycje));
end $$;

-- Decyzja przy jednej pozycji (do_sprawdzenia): null (cofnij) | tak | popraw (z poprawionymi danymi) | nie.
-- Schemat danych sprawdza panel (importy.js waliduj według profilu); baza pilnuje, że to obiekt rozsądnej wielkości.
create or replace function public.nauka_import_decyzja(p_id uuid, p_n int, p_decyzja text, p_dane jsonb default null, p_uwaga text default null)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare r public.nauka_importy;
begin
  if not public.nauka_admin() then return jsonb_build_object('ok', false, 'code', 'not_admin'); end if;
  if p_decyzja is not null and p_decyzja not in ('tak', 'popraw', 'nie') then return jsonb_build_object('ok', false, 'code', 'bad_decision'); end if;
  if p_decyzja = 'popraw' and (p_dane is null or jsonb_typeof(p_dane) <> 'object' or octet_length(p_dane::text) > 200000) then
    return jsonb_build_object('ok', false, 'code', 'bad_data');
  end if;
  select * into r from public.nauka_importy i where i.id = p_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if r.stan <> 'do_sprawdzenia' then return jsonb_build_object('ok', false, 'code', 'bad_state'); end if;
  if not exists (select 1 from jsonb_array_elements(r.pozycje) p where (p->>'n')::int = p_n) then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;
  update public.nauka_importy i set
    pozycje = (select jsonb_agg(case when (e.p->>'n')::int = p_n then
                  (e.p - 'poprawione' - 'uwaga') || jsonb_build_object('decyzja', p_decyzja)
                  || case when p_decyzja = 'popraw' then jsonb_build_object('poprawione', p_dane) else '{}'::jsonb end
                  || case when nullif(btrim(coalesce(p_uwaga, '')), '') is not null then jsonb_build_object('uwaga', left(p_uwaga, 500)) else '{}'::jsonb end
                else e.p end order by e.ord)
               from jsonb_array_elements(i.pozycje) with ordinality e(p, ord)),
    zmieniony_at = now()
  where i.id = p_id returning * into r;
  return jsonb_build_object('ok', true, 'licznik', public.nauka_import_json(r, false)->'licznik');
end $$;

-- „Zatwierdź pozostałe”: decyzja tak przy wszystkich pozycjach jeszcze bez decyzji (świadomy klik administratora).
create or replace function public.nauka_import_reszta_tak(p_id uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare r public.nauka_importy; k int;
begin
  if not public.nauka_admin() then return jsonb_build_object('ok', false, 'code', 'not_admin'); end if;
  select * into r from public.nauka_importy i where i.id = p_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if r.stan <> 'do_sprawdzenia' then return jsonb_build_object('ok', false, 'code', 'bad_state'); end if;
  select count(*) into k from jsonb_array_elements(r.pozycje) p where p->>'decyzja' is null;
  update public.nauka_importy i set
    pozycje = (select coalesce(jsonb_agg(case when e.p->>'decyzja' is null then e.p || '{"decyzja":"tak"}'::jsonb else e.p end order by e.ord), '[]'::jsonb)
               from jsonb_array_elements(i.pozycje) with ordinality e(p, ord)),
    zmieniony_at = now()
  where i.id = p_id returning * into r;
  return jsonb_build_object('ok', true, 'zmienione', k, 'licznik', public.nauka_import_json(r, false)->'licznik');
end $$;

-- Koniec kolejki. zatwierdzony: z do_sprawdzenia, każda pozycja ma decyzję, co najmniej jedna tak/popraw, p_gotowe = wynik
-- policzony przez importy.js (eksport) z zatwierdzonych pozycji. odrzucony: ze szkicu albo do_sprawdzenia.
create or replace function public.nauka_import_zakoncz(p_id uuid, p_stan text, p_gotowe jsonb default null, p_uwagi text default null)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare r public.nauka_importy; czeka int; dobre int;
begin
  if not public.nauka_admin() then return jsonb_build_object('ok', false, 'code', 'not_admin'); end if;
  select * into r from public.nauka_importy i where i.id = p_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if p_stan = 'zatwierdzony' then
    if r.stan <> 'do_sprawdzenia' then return jsonb_build_object('ok', false, 'code', 'bad_state'); end if;
    select count(*) filter (where p->>'decyzja' is null), count(*) filter (where p->>'decyzja' in ('tak', 'popraw'))
      into czeka, dobre from jsonb_array_elements(r.pozycje) p;
    if czeka > 0 then return jsonb_build_object('ok', false, 'code', 'undecided', 'czeka', czeka); end if;
    if dobre = 0 then return jsonb_build_object('ok', false, 'code', 'nothing_approved'); end if;
    if p_gotowe is null or jsonb_typeof(p_gotowe) <> 'object' or octet_length(p_gotowe::text) > 5000000 then
      return jsonb_build_object('ok', false, 'code', 'bad_result');
    end if;
  elsif p_stan = 'odrzucony' then
    if r.stan not in ('szkic', 'do_sprawdzenia') then return jsonb_build_object('ok', false, 'code', 'bad_state'); end if;
  else
    return jsonb_build_object('ok', false, 'code', 'bad_state');
  end if;
  update public.nauka_importy i set stan = p_stan, gotowe = case when p_stan = 'zatwierdzony' then p_gotowe else null end,
    uwagi = coalesce(left(nullif(btrim(coalesce(p_uwagi, '')), ''), 2000), i.uwagi),
    zakonczyl = auth.uid(), zakonczony_at = now(), zmieniony_at = now()
  where i.id = p_id returning * into r;
  return jsonb_build_object('ok', true, 'stan', r.stan);
end $$;

create or replace function public.nauka_importy_lista() returns jsonb
language sql stable security definer set search_path = '' as $$
  select case when not public.nauka_admin() then jsonb_build_object('ok', false, 'code', 'not_admin')
    else jsonb_build_object('ok', true, 'importy', coalesce((
      select jsonb_agg(public.nauka_import_json(i, false) order by i.utworzony_at desc)
        from (select * from public.nauka_importy order by utworzony_at desc limit 100) i), '[]'::jsonb)) end
$$;

create or replace function public.nauka_import_pobierz(p_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select case when not public.nauka_admin() then jsonb_build_object('ok', false, 'code', 'not_admin')
    else coalesce((select jsonb_build_object('ok', true, 'import', public.nauka_import_json(i, true)) from public.nauka_importy i where i.id = p_id),
                  jsonb_build_object('ok', false, 'code', 'not_found')) end
$$;

-- PDF-y do skasowania z bucketu: zatwierdzone/odrzucone albo starsze niż 30 dni, jeszcze nie skasowane.
create or replace function public.nauka_importy_do_sprzatniecia() returns jsonb
language sql stable security definer set search_path = '' as $$
  select case when not public.nauka_admin() then '[]'::jsonb else coalesce((
    select jsonb_agg(jsonb_build_object('id', i.id, 'sciezka', i.pdf_sciezka))
      from public.nauka_importy i
     where i.pdf_sciezka is not null and i.pdf_usuniety_at is null
       and (i.stan in ('zatwierdzony', 'odrzucony') or i.utworzony_at < now() - interval '30 days')), '[]'::jsonb) end
$$;

create or replace function public.nauka_import_pdf_usuniety(p_id uuid) returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare k int;
begin
  if not public.nauka_admin() then return false; end if;
  update public.nauka_importy i set pdf_usuniety_at = now() where i.id = p_id and i.pdf_usuniety_at is null;
  get diagnostics k = row_count;
  return k > 0;
end $$;

-- ---------- 4) zatwierdzony plan zajęć dla plan-bm (publiczne, jak nauka_odwolania_publiczne) ----------
-- Najnowszy zatwierdzony import typu plan dla rocznika: {ok, id, zatwierdzony_at, groups} albo {ok:false}. Bez pozycji, PDF-u i uwag.
create or replace function public.nauka_import_plan_publiczny(p_rocznik text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce((
    select jsonb_build_object('ok', true, 'id', i.id, 'zatwierdzony_at', i.zakonczony_at, 'source', left(coalesce(i.gotowe->>'source', ''), 300),
             'groups', coalesce(i.gotowe->'groups', '{}'::jsonb))
      from public.nauka_importy i
     where i.typ = 'plan' and i.stan = 'zatwierdzony' and i.rocznik_id = p_rocznik and jsonb_typeof(i.gotowe->'groups') = 'object'
     order by i.zakonczony_at desc limit 1), jsonb_build_object('ok', false))
$$;

-- ---------- 5) retencja PDF-ów (pg_cron) ----------
create or replace function public.nauka_importy_retencja() returns jsonb
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
end $$;

revoke all on function public.nauka_import_nowy(text, text, text, text, text, text, int, int, int), public.nauka_import_czesc(uuid, int, jsonb, text, text, jsonb),
  public.nauka_import_decyzja(uuid, int, text, jsonb, text), public.nauka_import_reszta_tak(uuid), public.nauka_import_zakoncz(uuid, text, jsonb, text),
  public.nauka_importy_lista(), public.nauka_import_pobierz(uuid), public.nauka_importy_do_sprzatniecia(), public.nauka_import_pdf_usuniety(uuid),
  public.nauka_importy_retencja(), public.nauka_import_plan_publiczny(text) from public, anon, authenticated;
grant execute on function public.nauka_import_nowy(text, text, text, text, text, text, int, int, int), public.nauka_import_czesc(uuid, int, jsonb, text, text, jsonb),
  public.nauka_import_decyzja(uuid, int, text, jsonb, text), public.nauka_import_reszta_tak(uuid), public.nauka_import_zakoncz(uuid, text, jsonb, text),
  public.nauka_importy_lista(), public.nauka_import_pobierz(uuid), public.nauka_importy_do_sprzatniecia(), public.nauka_import_pdf_usuniety(uuid) to authenticated;
grant execute on function public.nauka_import_plan_publiczny(text) to anon, authenticated;
grant execute on function public.nauka_importy_retencja() to service_role;

-- Codziennie o 2:45 UTC (po retencji v33). Bez pg_cron: tylko komunikat (pliki i tak kasuje funkcja Edge).
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') or exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron with schema pg_catalog;
    if exists (select 1 from cron.job where jobname = 'skrot-importy') then perform cron.unschedule('skrot-importy'); end if;
    perform cron.schedule('skrot-importy', '45 2 * * *', 'select public.nauka_importy_retencja()');
    raise notice 'OK importy: zadanie skrot-importy codziennie 2:45 UTC';
  else
    raise notice 'pg_cron niedostępny: włącz Integrations → Cron i uruchom ten plik jeszcze raz';
  end if;
end $$;

notify pgrst, 'reload schema';
