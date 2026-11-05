-- Skrót v32: usuwanie konta (etap 4 „Systemy z Zdawalni w Skrócie”).
-- Wklej w Supabase → SQL Editor → Run, po v31. Można uruchamiać wielokrotnie.
-- Funkcje woła tylko funkcja Edge `usun-konto` kluczem serwisowym (service_role); przeglądarka nie ma do nich dostępu.
--
-- Zasada (decyzja D3, do potwierdzenia z księgową): z bazy znika wszystko, co dotyczy osoby; historia transakcji zostaje w Stripe.
-- Żeby nowa tabela z kolumną user_id albo email nie została pominięta, funkcja sama przechodzi po wszystkich tabelach
-- schematu public, które mają taką kolumnę. Ręcznie obsługujemy tylko:
--   • nauka_docs: postęp (kolekcja progress, id = konto) i „Moje materiały” (myMaterials, myContent) kasujemy, a we wspólnych
--     kolekcjach (np. zgłoszenia błędów) zostaje treść bez autora (created_by = null, bez pola „by”);
--   • nauka_polecenia: polecenia tej osoby (polecajacy) kasujemy; jako kupującego anonimizujemy (wpis jest też nagrodą
--     polecającego, więc nie znika mu z konta);
--   • nauka_admini: konta administratora tak nie usuwamy (funkcja Edge odmawia wcześniej).

-- Tabele, które obsługujemy ręcznie albo których nie ruszamy przy przeglądzie kolumn.
create or replace function public.nauka_konto_wyjatki() returns text[] language sql immutable as $$
  select array['nauka_docs', 'nauka_polecenia', 'nauka_admini']
$$;

-- Ile wierszy w bazie dotyczy osoby (zapytanie kontrolne: po usunięciu wszystko ma być 0).
create or replace function public.nauka_konto_slady(p_uid uuid, p_email text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  em text := lower(coalesce(p_email, ''));
  t record; n bigint; out jsonb := '{}'::jsonb;
begin
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
    execute format('select count(*) from public.%I where %s', t.table_name,
      concat_ws(' or ',
        case when t.has_uid then 'user_id::text = $1::text' end,
        case when t.has_email then '(email is not null and lower(email) = $2 and $2 <> '''')' end))
      into n using p_uid, em;
    if n > 0 then out := out || jsonb_build_object(t.table_name, n); end if;
  end loop;
  select count(*) into n from public.nauka_docs d
   where (d.kolekcja = 'progress' and d.id = p_uid::text) or d.created_by = p_uid or d.data->>'by' = p_uid::text;
  if n > 0 then out := out || jsonb_build_object('nauka_docs', n); end if;
  select count(*) into n from public.nauka_polecenia p
   where p.polecajacy = p_uid or p.kupujacy_uid = p_uid or (em <> '' and p.kupujacy_email = em);
  if n > 0 then out := out || jsonb_build_object('nauka_polecenia', n); end if;
  if to_regclass('auth.users') is not null then
    select count(*) into n from auth.users u where u.id = p_uid;
    if n > 0 then out := out || jsonb_build_object('auth.users', n); end if;
  end if;
  return out;
end $$;

-- Usuwa dane osoby ze wszystkich tabel (bez konta w Auth: to robi funkcja Edge na końcu). Zwraca, ile wierszy z której tabeli.
create or replace function public.nauka_konto_usun_dane(p_uid uuid, p_email text) returns jsonb
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
end $$;

revoke execute on function public.nauka_konto_slady(uuid, text), public.nauka_konto_usun_dane(uuid, text), public.nauka_konto_wyjatki() from public, anon, authenticated;
grant execute on function public.nauka_konto_slady(uuid, text), public.nauka_konto_usun_dane(uuid, text), public.nauka_konto_wyjatki() to service_role;

notify pgrst, 'reload schema';
