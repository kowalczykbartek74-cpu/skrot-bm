-- Skrót BM v18: imię i nazwisko właściciela kodu polecającego (żeby starosta wiedział, komu wypłaca).
-- Wklej w Supabase → SQL Editor → Run, PO skrot-v17-polecenia.sql. Można uruchamiać wielokrotnie (nie kasuje danych).
-- Kto już ma kod bez imienia, zobaczy na ekranie „Polecaj i zarabiaj” prośbę o uzupełnienie.

alter table public.nauka_kody add column if not exists imie text;
alter table public.nauka_kody drop constraint if exists nauka_kody_imie_check;
alter table public.nauka_kody add constraint nauka_kody_imie_check check (imie is null or char_length(imie) between 3 and 80);

drop function if exists public.nauka_polec_ustaw(text);

create or replace function public.nauka_polec_moj() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  k public.nauka_kody;
  cfg jsonb := public.nauka_polec_cfg();
begin
  if uid is null then return jsonb_build_object('ok', false, 'code', 'nie_zalogowany'); end if;
  select * into k from public.nauka_kody where user_id = uid;
  return jsonb_build_object(
    'ok', true,
    'mozna', public.nauka_polec_mozna(),
    'kod', k.kod,
    'wyplata', k.wyplata,
    'imie', k.imie,
    'nagroda_gr', (cfg->>'nagroda_gr')::int,
    'dni', (cfg->>'dni')::int,
    'polecone', (select count(*) from public.nauka_polecenia p where p.polecajacy = uid and p.status <> 'anulowane'),
    'czeka_gr', (select coalesce(sum(p.nagroda_gr), 0) from public.nauka_polecenia p where p.polecajacy = uid and public.nauka_polec_stan(p) = 'czeka'),
    'do_wyplaty_gr', (select coalesce(sum(p.nagroda_gr), 0) from public.nauka_polecenia p where p.polecajacy = uid and public.nauka_polec_stan(p) = 'do_wyplaty'),
    'wyplacone_gr', (select coalesce(sum(p.nagroda_gr), 0) from public.nauka_polecenia p where p.polecajacy = uid and p.status = 'wyplacone'),
    'lista', coalesce((select jsonb_agg(jsonb_build_object(
                'dzien', (p.created_at at time zone 'Europe/Warsaw')::date,
                'do_wyplaty_od', ((p.created_at at time zone 'Europe/Warsaw')::date + (cfg->>'dni')::int),
                'nagroda_gr', p.nagroda_gr,
                'stan', public.nauka_polec_stan(p),
                'wyplacone', (p.wyplacone_at at time zone 'Europe/Warsaw')::date) order by p.created_at desc)
              from public.nauka_polecenia p where p.polecajacy = uid), '[]'::jsonb)
  );
end $$;

-- Załóż albo zmień kod. Błędy (code): nie_zalogowany | brak_dostepu | zly_kod | zajety | zarezerwowany | zle_imie
create or replace function public.nauka_polec_ustaw(p_kod text, p_imie text default null) returns jsonb
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
end $$;

create or replace function public.nauka_admin_polecenia() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.nauka_admin() then raise exception 'brak_dostepu'; end if;
  return jsonb_build_object(
    'osoby', coalesce((select jsonb_agg(x order by x.do_wyplaty_gr desc, x.czeka_gr desc, x.email) from (
      select k.user_id, k.email, k.imie, k.kod, k.wyplata,
             count(p.id) filter (where p.status <> 'anulowane') as polecone,
             coalesce(sum(p.nagroda_gr) filter (where public.nauka_polec_stan(p) = 'czeka'), 0) as czeka_gr,
             coalesce(sum(p.nagroda_gr) filter (where public.nauka_polec_stan(p) = 'do_wyplaty'), 0) as do_wyplaty_gr,
             coalesce(sum(p.nagroda_gr) filter (where p.status = 'wyplacone'), 0) as wyplacone_gr
      from public.nauka_kody k left join public.nauka_polecenia p on p.polecajacy = k.user_id
      group by k.user_id, k.email, k.imie, k.kod, k.wyplata) x), '[]'::jsonb),
    'polecenia', coalesce((select jsonb_agg(jsonb_build_object(
        'id', p.id, 'kod', p.kod, 'polecajacy', p.polecajacy, 'imie', (select k.imie from public.nauka_kody k where k.user_id = p.polecajacy), 'kupujacy', p.kupujacy_email,
        'kwota_gr', p.kwota_gr, 'nagroda_gr', p.nagroda_gr, 'stan', public.nauka_polec_stan(p), 'powod', p.powod,
        'kiedy', (p.created_at at time zone 'Europe/Warsaw')::date, 'wyplacone_at', (p.wyplacone_at at time zone 'Europe/Warsaw')::date) order by p.created_at desc)
      from public.nauka_polecenia p), '[]'::jsonb)
  );
end $$;

revoke all on function public.nauka_polec_ustaw(text, text) from public, anon;
grant execute on function public.nauka_polec_moj(), public.nauka_polec_ustaw(text, text), public.nauka_admin_polecenia() to authenticated;
