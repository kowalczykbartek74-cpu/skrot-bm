-- Skrót v49: nowy rocznik bez własnej migracji. Wklej w Supabase → SQL Editor → Run, po v48.
-- Kopiuj z github.com (przycisk „Copy raw file”), nie przez Terminal. Można uruchomić ponownie. Dla BM nic się nie zmienia.
--
-- Dotąd każdy kierunek miał swój plik SQL (v47 Zarządzanie, v48 FiR) z jednym wierszem w nauka_roczniki.
-- Od v49 wiersz dodaje administrator przyciskiem „Dodaj do bazy” w Panelu kierunków (dane z roczniki-dane.js),
-- a status (w planach → lista oczekujących → płatny) zmienia tam samo. To ostatnia migracja potrzebna do dodawania kierunków.
--
-- Funkcje (tylko administrator, nauka_admin()):
--   nauka_admin_rocznik_zapisz(p jsonb)        wydział musi być w bazie; kierunek dopisany albo uzupełniony; rocznik dopisany;
--                                              status z p tylko w górę (ponowne kliknięcie nie cofa sprzedaży)
--   nauka_admin_rocznik_status(p_id, p_status) świadoma zmiana statusu w obie strony (np. start sprzedaży: platny)
-- Błędy zwracane jako { ok: false, code }: not_admin | dane | id | wydzial | kierunek | status | brak.

do $$ begin
  if 'ąćęłńóśźż' <> U&'\0105\0107\0119\0142\0144\00F3\015B\017A\017C' then
    raise exception 'Polskie znaki doszły zepsute. Skopiuj plik z github.com (Raw), nie przez Terminal.';
  end if;
end $$;

create or replace function public.nauka_admin_rocznik_zapisz(p jsonb) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_id   text := p->>'id';
  v_kid  text := p->>'kierunek_id';
  v_nab  int;
  v_st   text := coalesce(nullif(p->>'status', ''), 'plan');
  k      jsonb := p->'kierunek';
  v_wyd  text := p->'wydzial'->>'kod';
  v_kod  text := k->>'kod';
  v_pl   text := nullif(trim(coalesce(k->>'pl', '')), '');
  v_en   text := nullif(trim(coalesce(k->>'en', '')), '');
  v_stp  smallint;
  v_tryb text := k->>'tryb';
  v_jez  text := coalesce(nullif(k->>'jezyk', ''), 'pl');
  v_stary text;
  v_nowy boolean;
  r      record;
begin
  if not public.nauka_admin() then return jsonb_build_object('ok', false, 'code', 'not_admin'); end if;
  if p is null or jsonb_typeof(p) <> 'object' or jsonb_typeof(k) is distinct from 'object' then
    return jsonb_build_object('ok', false, 'code', 'dane');
  end if;
  begin
    v_nab := (p->>'nabor')::int;
    v_stp := (k->>'stopien')::smallint;
  exception when others then return jsonb_build_object('ok', false, 'code', 'dane'); end;
  if v_nab is null or v_stp is null or v_wyd is null or v_kod is null or v_tryb is null then
    return jsonb_build_object('ok', false, 'code', 'dane');
  end if;
  -- id: <wydział>-<kierunek>-<stopień>-<tryb>-<nabór>, a kierunek_id to id bez naboru (te same reguły co w v31)
  if v_id is null or v_id !~ '^[a-z]+-[a-z0-9]+-[012]-(st|nst)-20[0-9]{2}$' or v_kid is null or v_id <> v_kid || '-' || v_nab
     or v_kid <> lower(coalesce(v_wyd, '')) || '-' || lower(coalesce(v_kod, '')) || '-' || v_stp || '-' || coalesce(v_tryb, '') then
    return jsonb_build_object('ok', false, 'code', 'id');
  end if;
  if v_st not in ('plan', 'oczekujacy', 'platny') then return jsonb_build_object('ok', false, 'code', 'status'); end if;
  if not exists (select 1 from public.nauka_wydzialy w where w.kod = v_wyd) then
    return jsonb_build_object('ok', false, 'code', 'wydzial', 'wydzial', v_wyd);
  end if;
  if v_kod !~ '^[A-Z]{2,6}$' or v_pl is null or length(v_pl) > 120 or length(coalesce(v_en, '')) > 120
     or v_stp not in (0, 1, 2) or v_tryb not in ('st', 'nst') or v_jez not in ('pl', 'en') then
    return jsonb_build_object('ok', false, 'code', 'kierunek');
  end if;

  -- kierunek: często już jest z listy kierunków (v34); wtedy uzupełniamy tylko nazwę EN i język zajęć, jak migracje v47/v48
  insert into public.nauka_kierunki (id, wydzial, kod, nazwa_pl, nazwa_en, stopien, tryb, jezyk)
  values (v_kid, v_wyd, v_kod, v_pl, v_en, v_stp, v_tryb, v_jez)
  on conflict (id) do update set nazwa_en = coalesce(public.nauka_kierunki.nazwa_en, excluded.nazwa_en), jezyk = excluded.jezyk;

  select r0.status into v_stary from public.nauka_roczniki r0 where r0.id = v_id;
  v_nowy := not found;
  -- adres planu wpisuje wyzwalacz z v46; status tylko w górę
  insert into public.nauka_roczniki (id, kierunek_id, nabor, status)
  values (v_id, v_kid, v_nab, v_st)
  on conflict (id) do update set status = excluded.status
    where array_position(array['plan', 'oczekujacy', 'platny'], public.nauka_roczniki.status)
        < array_position(array['plan', 'oczekujacy', 'platny'], excluded.status);

  select r1.id, r1.status, r1.plan_url into r from public.nauka_roczniki r1 where r1.id = v_id;
  return jsonb_build_object('ok', true, 'id', r.id, 'status', r.status, 'plan_url', r.plan_url, 'nowy', v_nowy, 'byl', v_stary);
end $$;
revoke all on function public.nauka_admin_rocznik_zapisz(jsonb) from public, anon;
grant execute on function public.nauka_admin_rocznik_zapisz(jsonb) to authenticated;

create or replace function public.nauka_admin_rocznik_status(p_id text, p_status text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v_stary text;
begin
  if not public.nauka_admin() then return jsonb_build_object('ok', false, 'code', 'not_admin'); end if;
  if p_status is null or p_status not in ('plan', 'oczekujacy', 'platny') then return jsonb_build_object('ok', false, 'code', 'status'); end if;
  select r.status into v_stary from public.nauka_roczniki r where r.id = p_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'brak'); end if;
  -- BM sprzedaje się od startu strony: tego rocznika nie da się tu wyłączyć
  if p_id = public.nauka_bm() and p_status <> 'platny' then return jsonb_build_object('ok', false, 'code', 'status'); end if;
  update public.nauka_roczniki set status = p_status where id = p_id;
  return jsonb_build_object('ok', true, 'id', p_id, 'status', p_status, 'byl', v_stary);
end $$;
revoke all on function public.nauka_admin_rocznik_status(text, text) from public, anon;
grant execute on function public.nauka_admin_rocznik_status(text, text) to authenticated;

-- Podgląd po Run: wszystkie roczniki w bazie (kolejne dochodzą przyciskiem w Panelu kierunków).
select r.id, r.status, r.plan_url from public.nauka_roczniki r order by r.id;

notify pgrst, 'reload schema';
