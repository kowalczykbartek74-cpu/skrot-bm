-- Skrót v34: lista oczekujących na kierunki, których jeszcze nie ma (etap 5 „Systemy z Zdawalni w Skrócie”).
-- Wklej w Supabase → SQL Editor → Run, po v33 (albo po v32, jeśli retencja jeszcze czeka). Można uruchamiać wielokrotnie.
-- Port matura-app lib/waitlist.ts: limit 5 zapisów z jednej sieci na godzinę (po skrócie IP), ta sama odpowiedź dla
-- nowego, czekającego i potwierdzonego adresu (formularzem nie da się sprawdzić, kto jest na liście), mail ponownie
-- najwyżej co 10 minut i najwyżej 4 razy, token tylko jako skrót.
-- Tabelę czyta i pisze wyłącznie funkcja Edge `zapisz-sie` (service_role); e-maile widzi tylko administrator (panel).
-- Kierunki do wyboru: z publicznej strony planów WEFiZ (scripts/kierunki-wefiz.mjs → supabase/kierunki-wefiz.json),
-- wpisane niżej do nauka_kierunki (lata = lata z planem na uczelni).

alter table public.nauka_kierunki add column if not exists lata smallint[];
alter table public.nauka_kierunki add column if not exists zapisy boolean not null default false; -- do wyboru na liście oczekujących

create table if not exists public.nauka_oczekujacy (
  id              bigint generated always as identity primary key,
  email           text not null unique check (email = lower(email) and length(email) between 5 and 254),
  wydzial         text check (wydzial is null or length(wydzial) <= 20),
  kierunek_id     text references public.nauka_kierunki (id) on delete set null,
  kierunek_tekst  text check (kierunek_tekst is null or length(kierunek_tekst) between 2 and 120),
  stopien         smallint check (stopien is null or stopien in (0, 1, 2)),
  rok             smallint check (rok is null or rok between 1 and 6),
  tryb            text check (tryb is null or tryb in ('st', 'nst')),
  zrodlo          text check (zrodlo is null or zrodlo ~ '^[a-z0-9._-]{1,40}$'),
  status          text not null default 'pending' check (status in ('pending', 'confirmed', 'unsubscribed')),
  token_hash      text not null unique,
  ip_hash         text,
  zgoda_wersja    text not null,
  send_count      int not null default 0,
  confirm_sent_at timestamptz,
  confirmed_at    timestamptz,
  unsubscribed_at timestamptz,
  created_at      timestamptz not null default now(),
  check (kierunek_id is not null or kierunek_tekst is not null)
);
create index if not exists nauka_oczekujacy_ip on public.nauka_oczekujacy (ip_hash, created_at desc);
alter table public.nauka_oczekujacy enable row level security; -- bez polityk: przeglądarka nie ma dostępu wprost

-- ---------- funkcje dla zapisz-sie (service_role) ----------
create or replace function public.nauka_oczekujacy_zapisz(p jsonb, p_token_hash text, p_ip_hash text) returns jsonb
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
end $$;

create or replace function public.nauka_oczekujacy_wyslano(p_email text) returns void
language sql volatile security definer set search_path = public as $$
  update public.nauka_oczekujacy set confirm_sent_at = now(), send_count = send_count + 1 where email = lower(p_email)
$$;

-- Kliknięcie „Potwierdź” z maila. first = to kliknięcie potwierdziło po raz pierwszy.
create or replace function public.nauka_oczekujacy_potwierdz(p_token_hash text) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare e record;
begin
  select * into e from public.nauka_oczekujacy where token_hash = p_token_hash for update;
  if not found or e.status = 'unsubscribed' then return jsonb_build_object('ok', false); end if;
  if e.status = 'confirmed' then return jsonb_build_object('ok', true, 'first', false); end if;
  update public.nauka_oczekujacy set status = 'confirmed', confirmed_at = now() where id = e.id;
  return jsonb_build_object('ok', true, 'first', true);
end $$;

-- „Usuń mój zapis” (działa dla czekających i potwierdzonych). Wpis zostaje 30 dni jako wypisany, potem znika.
create or replace function public.nauka_oczekujacy_wypisz(p_token_hash text) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
begin
  update public.nauka_oczekujacy set status = 'unsubscribed', unsubscribed_at = coalesce(unsubscribed_at, now())
   where token_hash = p_token_hash;
  return jsonb_build_object('ok', found);
end $$;

revoke execute on function public.nauka_oczekujacy_zapisz(jsonb, text, text), public.nauka_oczekujacy_wyslano(text),
  public.nauka_oczekujacy_potwierdz(text), public.nauka_oczekujacy_wypisz(text) from public, anon, authenticated;
grant execute on function public.nauka_oczekujacy_zapisz(jsonb, text, text), public.nauka_oczekujacy_wyslano(text),
  public.nauka_oczekujacy_potwierdz(text), public.nauka_oczekujacy_wypisz(text) to service_role;

-- ---------- lista kierunków do formularza (bez logowania, bez danych osób) ----------
create or replace function public.nauka_kierunki_zapisy() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', k.id, 'wydzial', k.wydzial, 'kod', k.kod, 'nazwa', k.nazwa_pl, 'stopien', k.stopien,
           'tryb', k.tryb, 'lata', coalesce(to_jsonb(k.lata), '[]'::jsonb),
           'jest', exists (select 1 from public.nauka_roczniki r where r.kierunek_id = k.id and r.status in ('platny', 'oczekujacy')))
         order by k.nazwa_pl, k.stopien), '[]'::jsonb)
    from public.nauka_kierunki k where k.zapisy
$$;
grant execute on function public.nauka_kierunki_zapisy() to anon, authenticated;

-- ---------- panel administratora (Narzędzia starosty → Kierunki) ----------
-- Liczą się tylko potwierdzone zapisy. Wpisane ręcznie nazwy są pogrupowane po uproszczonym tekście.
create or replace function public.nauka_admin_oczekujacy() returns jsonb
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
end $$;

-- Eksport CSV: potwierdzone zapisy z e-mailem (tylko administrator).
create or replace function public.nauka_admin_oczekujacy_csv() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.nauka_admin() then return jsonb_build_object('ok', false, 'code', 'not_admin'); end if;
  return jsonb_build_object('ok', true, 'wiersze', coalesce((select jsonb_agg(jsonb_build_object(
      'email', o.email, 'wydzial', coalesce(o.wydzial, k.wydzial), 'kierunek', coalesce(k.nazwa_pl, o.kierunek_tekst), 'kierunek_id', o.kierunek_id,
      'stopien', coalesce(o.stopien, k.stopien), 'rok', o.rok, 'tryb', coalesce(o.tryb, k.tryb), 'zrodlo', o.zrodlo,
      'zapis', o.created_at, 'potwierdzony', o.confirmed_at) order by o.confirmed_at)
    from public.nauka_oczekujacy o left join public.nauka_kierunki k on k.id = o.kierunek_id where o.status = 'confirmed'), '[]'::jsonb));
end $$;
revoke execute on function public.nauka_admin_oczekujacy(), public.nauka_admin_oczekujacy_csv() from public, anon;
grant execute on function public.nauka_admin_oczekujacy(), public.nauka_admin_oczekujacy_csv() to authenticated;

-- ---------- kierunki WEFiZ (z supabase/kierunki-wefiz.json, wstawia scripts/kierunki-sql.mjs) ----------
-- KIERUNKI-START (https://planyzajec-efz.usz.edu.pl/plan, pobrano 2026-11-05, 29 pozycji: kierunek + stopień)
insert into public.nauka_kierunki (id, wydzial, kod, nazwa_pl, stopien, tryb, lata, zapisy) values
  ('wefiz-af-2-st', 'WEFiZ', 'AF', 'Audyt finansowy', 2, 'st', array[1, 2]::smallint[], true),
  ('wefiz-biwg-1-st', 'WEFiZ', 'BIWG', 'Business Intelligence w gospodarce', 1, 'st', array[1, 2, 3]::smallint[], true),
  ('wefiz-bm-1-st', 'WEFiZ', 'BM', 'Business Management', 1, 'st', array[1, 2, 3]::smallint[], true),
  ('wefiz-bm-2-st', 'WEFiZ', 'BM', 'Business Management', 2, 'st', array[1, 2]::smallint[], true),
  ('wefiz-ds-2-st', 'WEFiZ', 'DS', 'Data Science', 2, 'st', array[1, 2]::smallint[], true),
  ('wefiz-eaia-1-st', 'WEFiZ', 'EAIA', 'Economics and IT Applications', 1, 'st', array[1, 2]::smallint[], true),
  ('wefiz-ek-1-st', 'WEFiZ', 'EK', 'Ekonomia', 1, 'st', array[1, 2, 3]::smallint[], true),
  ('wefiz-ek-2-st', 'WEFiZ', 'EK', 'Ekonomia', 2, 'st', array[1, 2]::smallint[], true),
  ('wefiz-fir-1-st', 'WEFiZ', 'FIR', 'Finanse i Rachunkowość', 1, 'st', array[1, 2, 3]::smallint[], true),
  ('wefiz-fir-2-st', 'WEFiZ', 'FIR', 'Finanse i Rachunkowość', 2, 'st', array[1, 2]::smallint[], true),
  ('wefiz-gn-1-st', 'WEFiZ', 'GN', 'Gospodarka Nieruchomościami', 1, 'st', array[1, 2, 3]::smallint[], true),
  ('wefiz-gpi-1-st', 'WEFiZ', 'GPI', 'Gospodarka Przestrzenna inż.', 1, 'st', array[1, 2, 3, 4]::smallint[], true),
  ('wefiz-iie-1-st', 'WEFiZ', 'IIE', 'Informatyka i Ekonometria', 1, 'st', array[1, 2, 3]::smallint[], true),
  ('wefiz-iwb-1-st', 'WEFiZ', 'IWB', 'Informatyka w Biznesie', 1, 'st', array[1, 2, 3]::smallint[], true),
  ('wefiz-iwb-2-st', 'WEFiZ', 'IWB', 'Informatyka w Biznesie', 2, 'st', array[1, 2]::smallint[], true),
  ('wefiz-kipb-1-st', 'WEFiZ', 'KIPB', 'Komunikacja i psychologia w biznesie', 1, 'st', array[1, 2, 3]::smallint[], true),
  ('wefiz-kipb-2-st', 'WEFiZ', 'KIPB', 'Komunikacja i psychologia w biznesie', 2, 'st', array[1, 2]::smallint[], true),
  ('wefiz-log-1-st', 'WEFiZ', 'LOG', 'Logistyka', 1, 'st', array[1, 2, 3]::smallint[], true),
  ('wefiz-log-2-st', 'WEFiZ', 'LOG', 'Logistyka', 2, 'st', array[1, 2]::smallint[], true),
  ('wefiz-li-1-st', 'WEFiZ', 'LI', 'Logistyka inż.', 1, 'st', array[1, 2, 3, 4]::smallint[], true),
  ('wefiz-mkt-2-st', 'WEFiZ', 'MKT', 'Marketing', 2, 'st', array[1, 2]::smallint[], true),
  ('wefiz-mbt-2-st', 'WEFiZ', 'MBT', 'Międzynarodowy biznes turystyczny', 2, 'st', array[1]::smallint[], true),
  ('wefiz-pii-1-st', 'WEFiZ', 'PII', 'Przedsiębiorczość i Inwestycje', 1, 'st', array[1, 2, 3]::smallint[], true),
  ('wefiz-rn-2-st', 'WEFiZ', 'RN', 'Rynek Nieruchomości', 2, 'st', array[1, 2]::smallint[], true),
  ('wefiz-tir-1-st', 'WEFiZ', 'TIR', 'Turystyka i Rekreacja', 1, 'st', array[1, 2, 3]::smallint[], true),
  ('wefiz-zarz-1-st', 'WEFiZ', 'ZARZ', 'Zarządzanie', 1, 'st', array[1, 2, 3]::smallint[], true),
  ('wefiz-zarz-2-st', 'WEFiZ', 'ZARZ', 'Zarządzanie', 2, 'st', array[1, 2]::smallint[], true),
  ('wefiz-zloz-1-st', 'WEFiZ', 'ZLOZ', 'Zarządzanie Logistyczne w Ochronie Zdrowia', 1, 'st', array[1]::smallint[], true),
  ('wefiz-zoze-1-st', 'WEFiZ', 'ZOZE', 'Zarządzanie odnawialnymi źródłami energii', 1, 'st', array[1, 2, 3]::smallint[], true)
on conflict (id) do update set lata = excluded.lata, zapisy = true;
-- Kierunek, którego uczelnia już nie ma w planach, znika z listy wyboru (zapisy zostają).
update public.nauka_kierunki set zapisy = false where wydzial = 'WEFiZ' and tryb = 'st' and id not in ('wefiz-af-2-st', 'wefiz-biwg-1-st', 'wefiz-bm-1-st', 'wefiz-bm-2-st', 'wefiz-ds-2-st', 'wefiz-eaia-1-st', 'wefiz-ek-1-st', 'wefiz-ek-2-st', 'wefiz-fir-1-st', 'wefiz-fir-2-st', 'wefiz-gn-1-st', 'wefiz-gpi-1-st', 'wefiz-iie-1-st', 'wefiz-iwb-1-st', 'wefiz-iwb-2-st', 'wefiz-kipb-1-st', 'wefiz-kipb-2-st', 'wefiz-log-1-st', 'wefiz-log-2-st', 'wefiz-li-1-st', 'wefiz-mkt-2-st', 'wefiz-mbt-2-st', 'wefiz-pii-1-st', 'wefiz-rn-2-st', 'wefiz-tir-1-st', 'wefiz-zarz-1-st', 'wefiz-zarz-2-st', 'wefiz-zloz-1-st', 'wefiz-zoze-1-st');
-- KIERUNKI-KONIEC

notify pgrst, 'reload schema';
