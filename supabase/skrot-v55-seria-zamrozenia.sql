do $$ begin
  if 'ąćęłńóśźż' <> U&'\0105\0107\0119\0142\0144\00F3\015B\017A\017C' then
    raise exception 'Polskie znaki doszły zepsute. Skopiuj plik z github.com (Raw), nie przez Terminal.';
  end if;
end $$;
-- Skrót v55 (pętla UX-2, etapy 1–2): seria przyjazna studentom.
-- Wklej w Supabase → SQL Editor → Run, po v54 (pętla UX-1; bez niej po v51) i po v24 z zamrożeniami serii.
-- Kopiuj z github.com (przycisk „Copy raw file”), nie przez Terminal. Można uruchomić ponownie (drugi raz nic nie zmienia).
--
-- Co daje:
--  1. nauka_przerwa(dzień): dni przerw z kalendarza uczelni (okresy z „Przerwa” w opisie i dni wolne), te same co CAL_DEFAULT
--     w index.html (rok 2026/27). W te dni seria czeka: nie spada i nie rośnie, zamrożenie się nie zużywa.
--  2. nauka_zamrozenie_uzyj_dni(dni): zamrożenia na kilka opuszczonych dni naraz (weekend = 2 zamrożenia). Tylko ostatnie 3 dni,
--     tylko dni bez nauki, dzień przerwy bez zużycia. Stara nauka_zamrozenie_uzyj() (wczoraj) zostaje bez zmian.
--  3. nauka_zamrozenie_prezent(): jedno zamrożenie w prezencie, raz na konto, gdy seria osiąga 2 (nauka_seria_na).
--     Wpis do nauka_zamrozenia (req „prezent:konto”, cena 0). Bez zmian w nauka_kosm_cfg i katalogu sklepu (pętla 5).
--  4. nauka_seria_na(osoba, dzień) i nauka_seria(): seria liczona w bazie tak samo jak na stronie (dni nauki, zamrożone i przerwy
--     nie zrywają; zamrożone i przerwy nie dodają dni), np. do rankingu.
-- Monet, punktów rankingu ani XP to nie zmienia.

-- Dni przerw 2026/27 (kalendarz uczelni: plan.zdawalni.pl/plan.json → kalendarz; kopia w index.html CAL_DEFAULT).
-- Uwaga: to kalendarz Uniwersytetu Szczecińskiego (wspólny dla roczników US z plan.zdawalni.pl). Rocznik z innym kalendarzem
-- potrzebuje okresów w danych rocznika; do tego czasu baza zna tylko te daty (zapis w RAPORT pętli UX-2).
-- Nowy rok akademicki: dopisz okresy i dni wolne tutaj i uruchom plik ponownie.
create or replace function public.nauka_przerwa(p_dzien date) returns boolean
language sql immutable set search_path = '' as $$
  select p_dzien = any (array['2026-10-01', '2026-11-02', '2026-11-11']::date[])            -- dni wolne (dzień rektorski, święto)
      or p_dzien between date '2026-12-24' and date '2027-01-06'                              -- Przerwa świąteczna
      or p_dzien between date '2027-02-16' and date '2027-02-21'                              -- Przerwa po sesji zimowej
$$;

-- Czy dzień był dniem nauki. v55: punkty rankingu (nauka_rp). v56 zmienia to na tabelę nauka_dni (jedno źródło dnia nauki).
-- Gdy jest już tabela nauka_dni (v56), pyta też ją: ponowne uruchomienie v55 po v56 niczego nie cofa.
create or replace function public.nauka_dzien_nauki(p_user uuid, p_dzien date) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare r boolean := false;
begin
  if exists (select 1 from public.nauka_rp where user_id = p_user and dzien = p_dzien) then return true; end if;
  if to_regclass('public.nauka_dni') is not null then
    execute 'select exists (select 1 from public.nauka_dni where user_id = $1 and dzien = $2)' into r using p_user, p_dzien;
  end if;
  return coalesce(r, false);
end $$;

-- Zamrożenia na listę dni (strona woła przy pierwszej nauce dnia z dniami opuszczonymi od ostatniej nauki).
-- Wynik dla każdego dnia: uzyte | juz (już chroniony) | przerwa (dzień przerwy, bez zużycia) | nauka (był dniem nauki) |
-- za_stary (poza ostatnimi 3 dniami) | brak (zabrakło zamrożeń). Wszystkie albo żaden: przy „brak” albo „za_stary” nic nie jest
-- zużyte (ok = false).
create or replace function public.nauka_zamrozenie_uzyj_dni(p_dni date[]) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); dzis date := public.nauka_dzis(); d date; wyn text; out jsonb := '[]'::jsonb; ok boolean := true;
  potrzeba date[] := '{}'; ma int;
begin
  if u is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if p_dni is null or cardinality(p_dni) = 0 or cardinality(p_dni) > 3 then return jsonb_build_object('ok', false, 'code', 'bad_days'); end if;
  perform pg_advisory_xact_lock(hashtext('nauka_mon:' || u::text));
  -- 1. Które dni naprawdę trzeba chronić. 2. Wszystkie albo żaden: gdy zapasu nie starcza, nic się nie zużywa
  --    (seria i tak się kończy, a student nie traci jeszcze zamrożeń).
  for d in select distinct x from unnest(p_dni) x order by 1 loop
    if d is null or d >= dzis or d < dzis - 3 then ok := false;
    elsif exists (select 1 from public.nauka_zamrozenia where user_id = u and uzyte_dzien = d) or public.nauka_przerwa(d) or public.nauka_dzien_nauki(u, d) then null;
    else potrzeba := potrzeba || d;
    end if;
  end loop;
  select count(*) into ma from public.nauka_zamrozenia where user_id = u and uzyte_dzien is null;
  if cardinality(potrzeba) > ma then ok := false; end if;
  for d in select distinct x from unnest(p_dni) x order by 1 loop
    if d is null or d >= dzis or d < dzis - 3 then wyn := 'za_stary';
    elsif exists (select 1 from public.nauka_zamrozenia where user_id = u and uzyte_dzien = d) then wyn := 'juz';
    elsif public.nauka_przerwa(d) then wyn := 'przerwa';
    elsif public.nauka_dzien_nauki(u, d) then wyn := 'nauka';
    elsif not ok then wyn := 'brak';
    else
      update public.nauka_zamrozenia set uzyte_dzien = d, uzyte_at = now()
       where id = (select id from public.nauka_zamrozenia where user_id = u and uzyte_dzien is null order by created_at, id limit 1);
      wyn := 'uzyte';
    end if;
    out := out || jsonb_build_object('dzien', d, 'wynik', wyn);
  end loop;
  return jsonb_build_object('ok', ok, 'dni', out,
    'zostalo', (select count(*) from public.nauka_zamrozenia where user_id = u and uzyte_dzien is null));
end $$;

-- Zamrożenie w prezencie: raz na konto, gdy seria (nauka_seria_na) osiąga 2. Gdy zapas jest pełny (max z nauka_kosm_cfg),
-- prezent czeka (code „pelne”) i przyjdzie przy następnym wywołaniu, kiedy zwolni się miejsce.
create or replace function public.nauka_zamrozenie_prezent() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); mx int; ma int; dni int;
begin
  if u is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  perform pg_advisory_xact_lock(hashtext('nauka_mon:' || u::text));
  if exists (select 1 from public.nauka_zamrozenia where user_id = u and req = 'prezent:konto') then
    return jsonb_build_object('ok', true, 'juz', true, 'zostalo', (select count(*) from public.nauka_zamrozenia where user_id = u and uzyte_dzien is null));
  end if;
  dni := public.nauka_seria_na(u, public.nauka_dzis());
  if dni < 2 then return jsonb_build_object('ok', false, 'code', 'za_wczesnie', 'seria', dni); end if;
  mx := coalesce((public.nauka_kosm_cfg()->>'zamrozenia_max')::int, 2);
  select count(*) into ma from public.nauka_zamrozenia where user_id = u and uzyte_dzien is null;
  if ma >= mx then return jsonb_build_object('ok', false, 'code', 'pelne', 'zostalo', ma); end if;
  insert into public.nauka_zamrozenia (user_id, req, cena) values (u, 'prezent:konto', 0) on conflict (user_id, req) do nothing;
  return jsonb_build_object('ok', true, 'nowe', true, 'zostalo', (select count(*) from public.nauka_zamrozenia where user_id = u and uzyte_dzien is null));
end $$;

-- Seria w bazie, tym samym wzorem co strona: od dziś (albo od wczoraj, gdy dziś jeszcze bez nauki) wstecz; dzień nauki +1,
-- dzień zamrożony albo przerwy nic nie zmienia, inny dzień bez nauki kończy serię. p_zapas = ile niezużytych zamrożeń może pokryć
-- opuszczone dni tuż przed dziś (najwyżej 2, tylko z ostatnich 3 dni) – tak jak strona, zanim zamrożenia zużyje dzisiejsza nauka.
create or replace function public.nauka_seria_na(p_user uuid, p_dzien date, p_zapas int default 0) returns int
language plpgsql stable security definer set search_path = '' as $$
declare d date := p_dzien; n int := 0; i int := 0; zapas int := least(greatest(coalesce(p_zapas, 0), 0), 2);
begin
  if p_user is null or p_dzien is null then return 0; end if;
  if not public.nauka_dzien_nauki(p_user, d) then d := d - 1; end if;
  while i < 400 loop
    i := i + 1;
    if public.nauka_dzien_nauki(p_user, d) then n := n + 1;
    elsif public.nauka_przerwa(d) or exists (select 1 from public.nauka_zamrozenia where user_id = p_user and uzyte_dzien = d) then null;
    elsif n = 0 and zapas > 0 and d >= p_dzien - 3 then zapas := zapas - 1;
    else exit;
    end if;
    d := d - 1;
  end loop;
  return n;
end $$;
drop function if exists public.nauka_seria_na(uuid, date);

-- seria = jak na stronie (z dniami, które pokryją zamrożenia przy dzisiejszej nauce); czeka = ile takich dni; bez_zamrozen = seria
-- bez nich (gdyby dziś nie było nauki ani zamrożeń).
create or replace function public.nauka_seria() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare u uuid := auth.uid(); d date := public.nauka_dzis(); ma int; s0 int; s1 int; c int := 0; x date;
begin
  if u is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  select count(*) into ma from public.nauka_zamrozenia where user_id = u and uzyte_dzien is null;
  s0 := public.nauka_seria_na(u, d, 0);
  s1 := public.nauka_seria_na(u, d, ma);
  if s1 > s0 and not public.nauka_dzien_nauki(u, d) then
    x := d - 1;
    while x >= d - 3 and not public.nauka_dzien_nauki(u, x) loop
      if not public.nauka_przerwa(x) and not exists (select 1 from public.nauka_zamrozenia where user_id = u and uzyte_dzien = x) then c := c + 1; end if;
      x := x - 1;
    end loop;
  end if;
  return jsonb_build_object('ok', true, 'dzien', d, 'seria', s1, 'czeka', c, 'bez_zamrozen', s0, 'przerwa', public.nauka_przerwa(d));
end $$;

revoke all on function public.nauka_przerwa(date), public.nauka_dzien_nauki(uuid, date), public.nauka_zamrozenie_uzyj_dni(date[]),
  public.nauka_zamrozenie_prezent(), public.nauka_seria_na(uuid, date, int), public.nauka_seria() from public, anon, authenticated;
grant execute on function public.nauka_przerwa(date), public.nauka_zamrozenie_uzyj_dni(date[]), public.nauka_zamrozenie_prezent(), public.nauka_seria()
  to authenticated;

notify pgrst, 'reload schema';
