-- Skrót BM v11: zabezpieczenia (28.10.2026).
-- Wklej w Supabase → SQL Editor → Run. Można uruchamiać wielokrotnie.
--
-- 1) Funkcje pomocnicze bez dostępu z zewnątrz.
--    Supabase domyślnie daje rolom anon i authenticated prawo wywołania każdej nowej funkcji,
--    a „revoke ... from public” tego nie odbiera. Przez to nauka_urz_lista(p_user) i nauka_urz_zmiana_od(p_user)
--    dało się wywołać dla dowolnego konta (nazwy urządzeń, daty logowania). Korzystają z nich tylko inne funkcje bazy.
-- 2) Zgody przed płatnością (skrot-v10-zgody.sql nie był uruchomiony, więc zgody nie zapisywały się w bazie).
-- 3) Skrzynka na plan.skrotbm.pl: limit prób hasła starosty (wcześniej hasło dało się zgadywać bez limitu).

-- ---------- 1) Funkcje pomocnicze ----------
revoke execute on function public.nauka_urz_lista(uuid, text) from public, anon, authenticated;
revoke execute on function public.nauka_urz_zmiana_od(uuid) from public, anon, authenticated;
revoke execute on function public.nauka_przed_zapisem() from public, anon, authenticated;
revoke execute on function public.limit_wpisow() from public, anon, authenticated;

-- ---------- 2) Zgody przed płatnością (treść jak w skrot-v10-zgody.sql) ----------
create table if not exists public.nauka_zgody (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  email text not null,
  plan text not null check (plan in ('rok', 'miesiac')),
  tresc text not null,
  wersja text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists nauka_zgody_user_idx on public.nauka_zgody (user_id, created_at desc);
create index if not exists nauka_zgody_email_idx on public.nauka_zgody (email, created_at desc);
alter table public.nauka_zgody enable row level security;
revoke all on public.nauka_zgody from anon, authenticated;
grant select on public.nauka_zgody to authenticated;

drop policy if exists "zgody czytaj" on public.nauka_zgody;
create policy "zgody czytaj" on public.nauka_zgody for select to authenticated
  using (user_id = auth.uid() or public.nauka_admin());

create or replace function public.nauka_zgoda(p_plan text, p_tresc text, p_wersja text, p_ua text default null)
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
$$;
revoke all on function public.nauka_zgoda(text, text, text, text) from public, anon;
grant execute on function public.nauka_zgoda(text, text, text, text) to authenticated;

-- ---------- 3) Skrzynka: limit prób hasła starosty ----------
-- Najwyżej 10 błędnych prób z jednego adresu IP i 60 ze wszystkich adresów w ciągu 15 minut.
create table if not exists public.admin_proby (
  id  bigint generated always as identity primary key,
  at  timestamptz not null default now(),
  ip  text
);
create index if not exists admin_proby_at_idx on public.admin_proby (at);
alter table public.admin_proby enable row level security;
revoke all on public.admin_proby from anon, authenticated;
-- brak reguł: tabelę czyta i zapisuje tylko funkcja admin_ok

create or replace function public.admin_ok(p_haslo text) returns boolean
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
end $$;

-- Ważne: przy złym haśle te funkcje NIE zgłaszają błędu, tylko kończą się bez zmian.
-- Błąd cofnąłby całą transakcję razem z zapisem nieudanej próby, a wtedy limit by nie działał.
-- admin_lista przy złym haśle zwraca {"blad": "haslo"} (skrzynka.html pokazuje wtedy „Złe hasło starosty”).
create or replace function public.admin_lista(p_haslo text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
begin
  if not public.admin_ok(p_haslo) then return jsonb_build_object('blad', 'haslo'); end if;
  return jsonb_build_object(
    'prosby', coalesce((select jsonb_agg(to_jsonb(p) order by p.id) from public.prosby p), '[]'::jsonb),
    'komentarze', coalesce((select jsonb_agg(to_jsonb(k) order by k.id) from public.komentarze k), '[]'::jsonb));
end $$;

create or replace function public.admin_prosba(p_haslo text, p_id bigint, p_status text, p_odpowiedz text, p_ukryta boolean)
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
  if not public.admin_ok(p_haslo) then return; end if;
  update public.prosby set
    status = coalesce(p_status, status),
    odpowiedz = case when p_odpowiedz is null then odpowiedz else nullif(btrim(p_odpowiedz), '') end,
    ukryta = coalesce(p_ukryta, ukryta),
    updated_at = now()
  where id = p_id;
end $$;

create or replace function public.admin_komentarz(p_haslo text, p_id bigint, p_ukryty boolean)
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
  if not public.admin_ok(p_haslo) then return; end if;
  update public.komentarze set ukryty = p_ukryty where id = p_id;
end $$;

revoke all on function public.admin_ok(text), public.admin_lista(text),
  public.admin_prosba(text, bigint, text, text, boolean), public.admin_komentarz(text, bigint, boolean) from public;
grant execute on function public.admin_ok(text), public.admin_lista(text),
  public.admin_prosba(text, bigint, text, text, boolean), public.admin_komentarz(text, bigint, boolean) to anon, authenticated;

notify pgrst, 'reload schema';
