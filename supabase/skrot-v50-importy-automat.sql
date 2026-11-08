-- Skrót v50: szkice planów z parsera plan-bm w kolejce importów (Etap 5 planu całego US: plany z PDF przez zatwierdzanie).
-- Wklej w Supabase → SQL Editor → Run, po v49 (wymaga v40). Można uruchamiać wielokrotnie.
-- Kopiuj z github.com (przycisk „Copy raw file”), nie przez Terminal.
--
-- 1. Token automatu: tabela nauka_import_tokeny trzyma tylko skrót sha256 tokenu. Token generujesz raz (krok 4 na dole),
--    wklejasz do GitHub → plan-bm → Settings → Secrets → PLAN_IMPORT_TOKEN. Wycofanie: delete from nauka_import_tokeny.
-- 2. nauka_importy.plan_rocznik: id rocznika z plan-bm (np. wpia-prawo-0-st-2026). Bez klucza obcego – roczniki planu
--    nie muszą istnieć w nauka_roczniki (to nie zmienia sprzedaży ani dostępu w Skrócie).
-- 3. nauka_import_szkic_automat(...): parser plan-bm dodaje szkic planu od razu w stanie do_sprawdzenia (pozycje policzone
--    przez parser, bez AI). Pozycje z decyzją „tak” (bez zmian względem zatwierdzonego planu) zostają zatwierdzone,
--    reszta czeka na Twoją decyzję w panelu Importy. Ten sam plik (sha256) drugi raz = ten sam szkic.
-- 4. nauka_import_plan_publiczny(rocznik) zwraca też sha pliku i szuka po rocznik_id albo plan_rocznik.
-- Nic z parsera nie trafia na stronę bez zatwierdzenia w panelu.

do $$ begin
  if 'ąćęłńóśźż' <> U&'\0105\0107\0119\0142\0144\00F3\015B\017A\017C' then
    raise exception 'Polskie znaki doszły zepsute. Skopiuj plik z github.com (Raw), nie przez Terminal.';
  end if;
end $$;

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.nauka_import_tokeny (
  id           uuid primary key default gen_random_uuid(),
  nazwa        text not null check (char_length(nazwa) between 1 and 80),
  sha256       text not null unique check (sha256 ~ '^[0-9a-f]{64}$'),
  utworzony_at timestamptz not null default now()
);
alter table public.nauka_import_tokeny enable row level security;
revoke all on public.nauka_import_tokeny from public, anon, authenticated;

alter table public.nauka_importy add column if not exists plan_rocznik text check (plan_rocznik is null or plan_rocznik ~ '^[a-z0-9-]{5,60}$');
create index if not exists nauka_importy_plan_rocznik on public.nauka_importy (plan_rocznik, stan, zakonczony_at desc);

create or replace function public.nauka_import_szkic_automat(p_token text, p_wydzial text, p_rocznik text, p_opis text,
  p_sha text, p_nazwa text, p_source text, p_pozycje jsonb) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare r public.nauka_importy; nid uuid; poz jsonb;
begin
  if p_token is null or char_length(p_token) < 32
     or not exists (select 1 from public.nauka_import_tokeny t where t.sha256 = encode(extensions.digest(p_token, 'sha256'), 'hex')) then
    return jsonb_build_object('ok', false, 'code', 'bad_token');
  end if;
  if p_wydzial is null or p_wydzial !~ '^[A-Za-zŚś]{2,12}$' then return jsonb_build_object('ok', false, 'code', 'bad_wydzial'); end if;
  if p_rocznik is null or p_rocznik !~ '^[a-z0-9-]{5,60}$' then return jsonb_build_object('ok', false, 'code', 'bad_rocznik'); end if;
  if p_sha is null or p_sha !~ '^[0-9a-f]{64}$' then return jsonb_build_object('ok', false, 'code', 'bad_sha'); end if;
  if p_pozycje is null or jsonb_typeof(p_pozycje) <> 'array' or jsonb_array_length(p_pozycje) < 1 or jsonb_array_length(p_pozycje) > 600
     or octet_length(p_pozycje::text) > 2000000
     or exists (select 1 from jsonb_array_elements(p_pozycje) p where jsonb_typeof(p) <> 'object') then
    return jsonb_build_object('ok', false, 'code', 'bad_items');
  end if;
  -- ten sam plik dla tego rocznika już czeka albo jest zatwierdzony → nic nowego
  select * into r from public.nauka_importy i
   where i.typ = 'plan' and i.plan_rocznik = p_rocznik and i.plik_sha256 = p_sha and i.stan in ('do_sprawdzenia', 'zatwierdzony')
   order by i.utworzony_at desc limit 1;
  if found then return jsonb_build_object('ok', true, 'id', r.id, 'istnieje', true, 'stan', r.stan); end if;
  -- starszy, niezatwierdzony szkic tego rocznika zastępuje nowy (odrzucamy go, żeby w panelu był jeden)
  update public.nauka_importy i set stan = 'odrzucony', uwagi = left(coalesce(i.uwagi || ' ', '') || 'Zastąpiony nowszą wersją pliku.', 2000),
         zakonczony_at = now(), zmieniony_at = now()
   where i.typ = 'plan' and i.plan_rocznik = p_rocznik and i.stan in ('szkic', 'do_sprawdzenia');
  select coalesce(jsonb_agg(jsonb_build_object('czesc', 1, 'strona', 1, 'fragment', '', 'n', e.ord,
           'dane', (e.p - 'decyzja'), 'decyzja', case when e.p->>'decyzja' = 'tak' then 'tak' else null end) order by e.ord), '[]'::jsonb)
    into poz from jsonb_array_elements(p_pozycje) with ordinality e(p, ord);
  nid := gen_random_uuid();
  insert into public.nauka_importy (id, typ, wydzial, rocznik_id, plan_rocznik, opis, plik_sha256, plik_nazwa, plik_bajty, strony, czesci,
                                    przeczytane, stan, pozycje, uwagi_ai, model)
  values (nid, 'plan', p_wydzial, (select k.id from public.nauka_roczniki k where k.id = p_rocznik), p_rocznik,
          left(nullif(btrim(coalesce(p_opis, '')), ''), 300), p_sha, left(coalesce(nullif(p_nazwa, ''), 'plan.pdf'), 200), 1, 1, 1,
          '{1}', 'do_sprawdzenia', poz, jsonb_build_object('1', left('Szkic z parsera plan-bm. Plik: ' || coalesce(p_source, ''), 2000)), 'parser plan-bm');
  return jsonb_build_object('ok', true, 'id', nid, 'istnieje', false, 'stan', 'do_sprawdzenia');
end $$;

create or replace function public.nauka_import_plan_publiczny(p_rocznik text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce((
    select jsonb_build_object('ok', true, 'id', i.id, 'zatwierdzony_at', i.zakonczony_at, 'sha', i.plik_sha256,
             'source', left(coalesce(i.gotowe->>'source', ''), 300), 'groups', coalesce(i.gotowe->'groups', '{}'::jsonb))
      from public.nauka_importy i
     where i.typ = 'plan' and i.stan = 'zatwierdzony' and (i.rocznik_id = p_rocznik or i.plan_rocznik = p_rocznik)
       and jsonb_typeof(i.gotowe->'groups') = 'object'
     order by i.zakonczony_at desc limit 1), jsonb_build_object('ok', false))
$$;

revoke all on function public.nauka_import_szkic_automat(text, text, text, text, text, text, text, jsonb) from public;
grant execute on function public.nauka_import_szkic_automat(text, text, text, text, text, text, text, jsonb) to anon, authenticated;
grant execute on function public.nauka_import_plan_publiczny(text) to anon, authenticated;

do $$ begin raise notice 'OK v50: szkice planów z plan-bm (nauka_import_szkic_automat), plan_rocznik, token automatu'; end $$;

-- ---------- 4) token automatu (jednorazowo) ----------
-- Odkomentuj, uruchom, skopiuj wartość „token” do sekretu PLAN_IMPORT_TOKEN w GitHub (plan-bm), potem zakomentuj z powrotem.
-- with t as (select encode(extensions.gen_random_bytes(32), 'hex') as token)
-- insert into public.nauka_import_tokeny (nazwa, sha256)
--   select 'plan-bm GitHub Actions', encode(extensions.digest(t.token, 'sha256'), 'hex') from t
--   returning (select token from t) as token;
