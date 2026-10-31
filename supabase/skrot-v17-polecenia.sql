-- Skrót BM v17: kody polecające. Student z opłaconym dostępem tworzy swój kod; kto wpisze go przy zakupie planu
-- „do końca 2. semestru” (199 zł), płaci normalną cenę, a właścicielowi kodu należy się 30 zł.
-- Wklej w Supabase → SQL Editor → Run, PO skrot-v16-proba.sql (na końcu). Można uruchamiać wielokrotnie (nie kasuje danych).
-- Potem wdróż nową wersję funkcji stripe-webhook (zapisuje polecenie po płatności) i dodaj w Stripe do endpointu
-- „skrotbm-supabase” zdarzenia charge.refunded i charge.dispute.created (zwrot albo spór anuluje nagrodę).
--
-- Zasady:
--   • Kod może założyć tylko osoba z dostępem OPŁACONYM przez Stripe (sam okres próbny ani dostęp dany ręcznie nie wystarcza) albo starosta.
--   • Kupujący wpisuje kod w oknie „Zanim zapłacisz” (albo przychodzi z linku skrotbm.pl/?kod=KOD). Strona dokleja go
--     do client_reference_id w linku Stripe („<id konta>__KOD”), a webhook po opłaceniu woła nauka_polec_zapisz.
--   • Liczy się tylko jednorazowy plan 199 zł (tryb „payment”, kwota ≥ min_kwota_gr). Plan miesięczny nie.
--   • Nie można polecić samego siebie (to samo konto albo ten sam e-mail). Jeden kupujący (e-mail) = jedno polecenie.
--   • Nagroda „czeka” 14 dni od zakupu, potem jest „do wypłaty”. Zwrot pełnej kwoty albo spór (chargeback)
--     przed wypłatą anuluje nagrodę. Starosta wypłaca ręcznie (BLIK / przelew) i odhacza w panelu.
--   • Przeglądarka nie czyta ani nie pisze tabel bezpośrednio (RLS bez reguł); wszystko przez funkcje poniżej.
--     Właściciel kodu widzi tylko daty i stan swoich poleceń, nigdy e-maili kupujących.

-- =====================================================================
-- 1) Ustawienia
-- =====================================================================
create or replace function public.nauka_polec_cfg() returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object(
    'nagroda_gr', 3000,      -- 30 zł dla właściciela kodu
    'dni', 14,               -- po tylu dniach od zakupu nagroda jest do wypłaty
    'min_kwota_gr', 19900    -- tylko zakup planu 199 zł (jednorazowo)
  )
$$;

-- =====================================================================
-- 2) Tabele
-- =====================================================================
create table if not exists public.nauka_kody (
  user_id      uuid primary key,
  email        text not null check (email = lower(email)),
  kod          text not null unique check (kod ~ '^[A-Z0-9]{4,16}$'),
  wyplata      text check (wyplata is null or char_length(wyplata) between 3 and 120),
  created_at   timestamptz not null default now(),
  zmieniony_at timestamptz not null default now()
);
alter table public.nauka_kody enable row level security;
revoke all on public.nauka_kody from anon, authenticated;

create table if not exists public.nauka_polecenia (
  id             bigint generated always as identity primary key,
  kod            text not null,
  polecajacy     uuid not null,
  kupujacy_email text not null check (kupujacy_email = lower(kupujacy_email)),
  kupujacy_uid   uuid,
  stripe_session text not null unique,
  stripe_payment text,
  kwota_gr       int,
  nagroda_gr     int  not null check (nagroda_gr >= 0),
  status         text not null default 'nalicza' check (status in ('nalicza', 'wyplacone', 'anulowane')),
  powod          text,
  created_at     timestamptz not null default now(),
  wyplacone_at   timestamptz
);
create index if not exists nauka_polecenia_polecajacy on public.nauka_polecenia (polecajacy, created_at desc);
create index if not exists nauka_polecenia_payment on public.nauka_polecenia (stripe_payment);
-- Jeden kupujący daje najwyżej jedno (nieanulowane) polecenie.
create unique index if not exists nauka_polecenia_kupujacy on public.nauka_polecenia (kupujacy_email) where status <> 'anulowane';
alter table public.nauka_polecenia enable row level security;
revoke all on public.nauka_polecenia from anon, authenticated;

-- =====================================================================
-- 3) Pomocnicze
-- =====================================================================
-- Czy ta osoba może mieć kod: starosta albo dostęp opłacony przez Stripe (bez okresu próbnego i dostępu dawanego ręcznie).
create or replace function public.nauka_polec_mozna() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.nauka_admin()
      or exists (select 1 from public.nauka_dostep d
                 where d.do_kiedy >= current_date and d.zrodlo like 'stripe%'
                   and (d.email = public.nauka_email() or d.user_id = auth.uid()))
$$;

-- To samo dla dowolnego właściciela kodu (webhook sprawdza, czy kod wciąż działa).
create or replace function public.nauka_polec_mozna_uid(p_user uuid, p_email text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.nauka_admini a where a.email = p_email)
      or exists (select 1 from public.nauka_dostep d
                 where d.do_kiedy >= current_date and d.zrodlo like 'stripe%' and (d.user_id = p_user or d.email = p_email))
$$;

-- Stan polecenia do pokazania: czeka | do_wyplaty | wyplacone | anulowane.
create or replace function public.nauka_polec_stan(p public.nauka_polecenia) returns text
language sql stable set search_path = '' as $$
  select case
    when p.status = 'nalicza' and p.created_at > now() - make_interval(days => (public.nauka_polec_cfg()->>'dni')::int) then 'czeka'
    when p.status = 'nalicza' then 'do_wyplaty'
    else p.status end
$$;

-- Kod: wielkie litery i cyfry, bez spacji i polskich znaków (ą → A itd.).
create or replace function public.nauka_polec_norm(p text) returns text
language sql immutable set search_path = '' as $$
  select regexp_replace(upper(translate(coalesce(p, ''), 'ąćęłńóśźżĄĆĘŁŃÓŚŹŻ', 'acelnoszzACELNOSZZ')), '[^A-Z0-9]', '', 'g')
$$;

-- =====================================================================
-- 4) Dla studenta
-- =====================================================================
-- Mój kod i moje polecenia (bez e-maili kupujących).
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

-- Załóż albo zmień kod. Błędy (code): nie_zalogowany | brak_dostepu | zly_kod | zajety | zarezerwowany
create or replace function public.nauka_polec_ustaw(p_kod text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  em text := public.nauka_email();
  v_kod text := public.nauka_polec_norm(p_kod);
begin
  if uid is null or coalesce(em, '') = '' then return jsonb_build_object('ok', false, 'code', 'nie_zalogowany'); end if;
  if not public.nauka_polec_mozna() then return jsonb_build_object('ok', false, 'code', 'brak_dostepu'); end if;
  if v_kod !~ '^[A-Z0-9]{4,16}$' then return jsonb_build_object('ok', false, 'code', 'zly_kod'); end if;
  if v_kod in ('SKROT', 'SKROTBM', 'ADMIN', 'STAROSTA', 'PROMO', 'RABAT', 'ZNIZKA', 'TEST', 'STRIPE') then
    return jsonb_build_object('ok', false, 'code', 'zarezerwowany');
  end if;
  if exists (select 1 from public.nauka_kody k where k.kod = v_kod and k.user_id <> uid) then
    return jsonb_build_object('ok', false, 'code', 'zajety');
  end if;
  begin
    insert into public.nauka_kody (user_id, email, kod) values (uid, em, v_kod)
    on conflict (user_id) do update set kod = excluded.kod, email = excluded.email, zmieniony_at = now();
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'code', 'zajety');
  end;
  return jsonb_build_object('ok', true, 'kod', v_kod);
end $$;

-- Dane do wypłaty (numer telefonu do BLIK albo numer konta i imię). Pusty tekst = usuń.
create or replace function public.nauka_polec_wyplata(p_txt text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare t text := nullif(btrim(coalesce(p_txt, '')), '');
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'nie_zalogowany'); end if;
  if t is not null and char_length(t) not between 3 and 120 then return jsonb_build_object('ok', false, 'code', 'zle_dane'); end if;
  update public.nauka_kody set wyplata = t where user_id = auth.uid();
  if not found then return jsonb_build_object('ok', false, 'code', 'brak_kodu'); end if;
  return jsonb_build_object('ok', true);
end $$;

-- Sprawdzenie kodu przed płatnością (okno „Zanim zapłacisz”). Błędy: brak | wlasny | juz_polecony | nieaktywny
create or replace function public.nauka_polec_sprawdz(p_kod text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_kod text := public.nauka_polec_norm(p_kod);
  k public.nauka_kody;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'nie_zalogowany'); end if;
  select * into k from public.nauka_kody where nauka_kody.kod = v_kod;
  if not found then return jsonb_build_object('ok', false, 'code', 'brak'); end if;
  if k.user_id = auth.uid() or k.email = public.nauka_email() then return jsonb_build_object('ok', false, 'code', 'wlasny'); end if;
  if not public.nauka_polec_mozna_uid(k.user_id, k.email) then return jsonb_build_object('ok', false, 'code', 'nieaktywny'); end if;
  if exists (select 1 from public.nauka_polecenia p where p.kupujacy_email = public.nauka_email() and p.status <> 'anulowane') then
    return jsonb_build_object('ok', false, 'code', 'juz_polecony');
  end if;
  return jsonb_build_object('ok', true, 'kod', v_kod);
end $$;

-- =====================================================================
-- 5) Dla webhooka Stripe (tylko service_role)
-- =====================================================================
-- Zapis polecenia po opłaceniu. Zwraca {ok:true} albo {ok:false, code}; nigdy nie rzuca błędu,
-- żeby problem z kodem nie zablokował wpisania dostępu.
create or replace function public.nauka_polec_zapisz(p_kod text, p_sesja text, p_email text, p_uid uuid, p_kwota_gr int, p_payment text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  v_kod text := public.nauka_polec_norm(p_kod);
  em text := lower(coalesce(p_email, ''));
  cfg jsonb := public.nauka_polec_cfg();
  k public.nauka_kody;
  n int;
begin
  if v_kod = '' or coalesce(p_sesja, '') = '' or em = '' then return jsonb_build_object('ok', false, 'code', 'brak_danych'); end if;
  if coalesce(p_kwota_gr, 0) < (cfg->>'min_kwota_gr')::int then return jsonb_build_object('ok', false, 'code', 'zly_plan'); end if;
  select * into k from public.nauka_kody where nauka_kody.kod = v_kod;
  if not found then return jsonb_build_object('ok', false, 'code', 'brak'); end if;
  if k.user_id = p_uid or k.email = em then return jsonb_build_object('ok', false, 'code', 'wlasny'); end if;
  if not public.nauka_polec_mozna_uid(k.user_id, k.email) then return jsonb_build_object('ok', false, 'code', 'nieaktywny'); end if;
  begin
    insert into public.nauka_polecenia (kod, polecajacy, kupujacy_email, kupujacy_uid, stripe_session, stripe_payment, kwota_gr, nagroda_gr)
    values (v_kod, k.user_id, em, p_uid, p_sesja, nullif(p_payment, ''), p_kwota_gr, (cfg->>'nagroda_gr')::int)
    on conflict (stripe_session) do nothing;
    get diagnostics n = row_count;
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'code', 'juz_polecony');
  end;
  if n = 0 then return jsonb_build_object('ok', false, 'code', 'duplikat'); end if;
  return jsonb_build_object('ok', true, 'kod', v_kod, 'polecajacy', k.user_id);
end $$;

-- Zwrot albo spór w Stripe: anuluj niewypłaconą nagrodę. Wypłaconą tylko oznacz powodem (do wyjaśnienia ręcznie).
create or replace function public.nauka_polec_cofnij(p_payment text, p_powod text) returns jsonb
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
end $$;

-- =====================================================================
-- 6) Panel starosty
-- =====================================================================
-- Kto ma kod, ile komu się należy i wszystkie polecenia.
create or replace function public.nauka_admin_polecenia() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.nauka_admin() then raise exception 'brak_dostepu'; end if;
  return jsonb_build_object(
    'osoby', coalesce((select jsonb_agg(x order by x.do_wyplaty_gr desc, x.czeka_gr desc, x.email) from (
      select k.user_id, k.email, k.kod, k.wyplata,
             count(p.id) filter (where p.status <> 'anulowane') as polecone,
             coalesce(sum(p.nagroda_gr) filter (where public.nauka_polec_stan(p) = 'czeka'), 0) as czeka_gr,
             coalesce(sum(p.nagroda_gr) filter (where public.nauka_polec_stan(p) = 'do_wyplaty'), 0) as do_wyplaty_gr,
             coalesce(sum(p.nagroda_gr) filter (where p.status = 'wyplacone'), 0) as wyplacone_gr
      from public.nauka_kody k left join public.nauka_polecenia p on p.polecajacy = k.user_id
      group by k.user_id, k.email, k.kod, k.wyplata) x), '[]'::jsonb),
    'polecenia', coalesce((select jsonb_agg(jsonb_build_object(
        'id', p.id, 'kod', p.kod, 'polecajacy', p.polecajacy, 'kupujacy', p.kupujacy_email,
        'kwota_gr', p.kwota_gr, 'nagroda_gr', p.nagroda_gr, 'stan', public.nauka_polec_stan(p), 'powod', p.powod,
        'kiedy', (p.created_at at time zone 'Europe/Warsaw')::date, 'wyplacone_at', (p.wyplacone_at at time zone 'Europe/Warsaw')::date) order by p.created_at desc)
      from public.nauka_polecenia p), '[]'::jsonb)
  );
end $$;

-- Wypłacone: oznacza wszystkie nagrody tej osoby, które są już „do wypłaty”. Zwraca wypłaconą kwotę.
create or replace function public.nauka_admin_polec_wyplac(p_user uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare suma int;
begin
  if not public.nauka_admin() then raise exception 'brak_dostepu'; end if;
  with u as (
    update public.nauka_polecenia p set status = 'wyplacone', wyplacone_at = now()
    where p.polecajacy = p_user and public.nauka_polec_stan(p) = 'do_wyplaty'
    returning p.nagroda_gr)
  select coalesce(sum(nagroda_gr), 0) into suma from u;
  return jsonb_build_object('ok', true, 'wyplacone_gr', suma);
end $$;

-- Ręczne anulowanie jednego polecenia (np. podejrzane), z powodem.
create or replace function public.nauka_admin_polec_anuluj(p_id bigint, p_powod text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
begin
  if not public.nauka_admin() then raise exception 'brak_dostepu'; end if;
  update public.nauka_polecenia set status = 'anulowane', powod = nullif(btrim(coalesce(p_powod, '')), '')
    where id = p_id and status = 'nalicza';
  return jsonb_build_object('ok', found);
end $$;

-- Usunięcie kodu (np. obraźliwy). Polecenia zostają, nowe zakupy z tym kodem już się nie liczą.
create or replace function public.nauka_admin_kod_usun(p_user uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
begin
  if not public.nauka_admin() then raise exception 'brak_dostepu'; end if;
  delete from public.nauka_kody where user_id = p_user;
  return jsonb_build_object('ok', found);
end $$;

-- =====================================================================
-- 7) Uprawnienia
-- =====================================================================
revoke all on function public.nauka_polec_mozna(), public.nauka_polec_mozna_uid(uuid, text),
  public.nauka_polec_moj(), public.nauka_polec_ustaw(text), public.nauka_polec_wyplata(text), public.nauka_polec_sprawdz(text),
  public.nauka_polec_zapisz(text, text, text, uuid, int, text), public.nauka_polec_cofnij(text, text),
  public.nauka_admin_polecenia(), public.nauka_admin_polec_wyplac(uuid), public.nauka_admin_polec_anuluj(bigint, text),
  public.nauka_admin_kod_usun(uuid)
  from public, anon;
revoke all on function public.nauka_polec_mozna_uid(uuid, text),
  public.nauka_polec_zapisz(text, text, text, uuid, int, text), public.nauka_polec_cofnij(text, text) from authenticated;
grant execute on function public.nauka_polec_moj(), public.nauka_polec_ustaw(text), public.nauka_polec_wyplata(text),
  public.nauka_polec_sprawdz(text), public.nauka_admin_polecenia(), public.nauka_admin_polec_wyplac(uuid),
  public.nauka_admin_polec_anuluj(bigint, text), public.nauka_admin_kod_usun(uuid) to authenticated;
grant execute on function public.nauka_polec_zapisz(text, text, text, uuid, int, text), public.nauka_polec_cofnij(text, text) to service_role;
