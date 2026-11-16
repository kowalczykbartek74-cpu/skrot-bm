do $$ begin
  if 'ąćęłńóśźż' <> U&'\0105\0107\0119\0142\0144\00F3\015B\017A\017C' then
    raise exception 'Polskie znaki doszły zepsute. Skopiuj plik z github.com (Raw), nie przez Terminal.';
  end if;
end $$;
-- Skrót v58 (pętla UX-5, etap G1): nagroda za zaliczony dział kursu: „Dział N zaliczony: +20 monet”.
-- Wklej w Supabase → SQL Editor → Run, po v57 (kolejność plików: README → RAPORT pętli 5). Kopiuj z github.com („Copy raw file”).
-- Można uruchomić ponownie (drugi raz nic nie zmienia).
--
-- Zasada: monety przyznaje tylko baza. Dział jest zaliczony, gdy KAŻDA lekcja działu (materials, kind = lesson,
-- ten sam subjectId i unit, rocznik osoby) ma w nauka_rp punkt „lekcja” tej osoby (klucz l:<id>, czyli zdany bilet wyjścia).
-- Nagroda raz na konto i dział: wpis w nauka_monety z unikalnym kluczem misja:dzial:<przedmiot>:<dział>.
-- Nie zmienia nauka_mon_z_rp ani funkcji zadań dnia (właściciel: pętla 2) – to osobna funkcja.

create or replace function public.nauka_dzial_cfg() returns jsonb
language sql immutable set search_path = '' as $$ select jsonb_build_object('monety', 20) $$;

create or replace function public.nauka_dzial_nagroda(p_sid text, p_unit text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid(); v_rok text; v_n int; v_brak int; v_ile int := (public.nauka_dzial_cfg()->>'monety')::int;
  v_klucz text;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_rp_mozna() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  if p_sid is null or p_unit is null or char_length(p_sid) > 120 or char_length(p_unit) > 20 then
    return jsonb_build_object('ok', false, 'code', 'bad_input');
  end if;
  v_rok := public.nauka_moj_rocznik();
  select count(*),
         count(*) filter (where not exists (select 1 from public.nauka_rp r where r.user_id = v_uid and r.zrodlo = 'lekcja' and r.klucz = 'l:' || d.id))
    into v_n, v_brak
    from public.nauka_docs d
   where d.kolekcja = 'materials' and d.data->>'kind' = 'lesson'
     and d.data->>'subjectId' = p_sid and d.data->>'unit' = p_unit
     and (d.rocznik_id is null or d.rocznik_id = v_rok);
  if v_n = 0 then return jsonb_build_object('ok', false, 'code', 'no_unit'); end if;
  if v_brak > 0 then return jsonb_build_object('ok', false, 'code', 'nie_wszystkie', 'brak', v_brak, 'lekcji', v_n); end if;
  v_klucz := 'misja:dzial:' || p_sid || ':' || p_unit;
  insert into public.nauka_monety (user_id, delta, zrodlo, klucz, opis)
  values (v_uid, v_ile, 'misja', v_klucz, 'Dział ' || p_unit || ' zaliczony')
  on conflict (user_id, klucz) do nothing;
  if not found then return jsonb_build_object('ok', true, 'juz', true, 'monety', 0); end if;
  return jsonb_build_object('ok', true, 'juz', false, 'monety', v_ile, 'lekcji', v_n);
end $$;

revoke execute on function public.nauka_dzial_cfg(), public.nauka_dzial_nagroda(text, text) from public, anon, authenticated;
-- Kwotę czyta też strona (podpis skrzynki przed odbiorem): jedno źródło prawdy.
grant execute on function public.nauka_dzial_cfg(), public.nauka_dzial_nagroda(text, text) to authenticated;

notify pgrst, 'reload schema';
