do $$ begin
  if 'ąćęłńóśźż' <> U&'\0105\0107\0119\0142\0144\00F3\015B\017A\017C' then
    raise exception 'Polskie znaki doszły zepsute. Skopiuj plik z github.com (Raw), nie przez Terminal.';
  end if;
end $$;

-- Skrót v63 (pętla UX-6): porównanie grup roku w Rankingu („Czy moja grupa wypada lepiej niż inne?”).
-- Wklej w Supabase → SQL Editor → Run, po v60. Kopiuj z github.com („Copy raw file”). Można uruchomić ponownie.
--
-- nauka_ranking_grupy(p_zakres 'tydzien' | 'semestr'): dla każdej grupy rocznika osoby: liczba aktywnych osób (punkty > 0 w zakresie)
-- i średnia punktów na aktywną osobę. Bez nicków i bez danych pojedynczych osób; grupa z mniej niż 3 aktywnymi osobami
-- nie ma średniej („za mało osób”). Liczą się wszyscy aktywni z rocznika (także ukryci w rankingu osób – to tylko suma),
-- bez zablokowanych kont i (gdy tak ustawione w nauka_rp_cfg) bez adminów. Punkty liczy baza jak w nauka_ranking.
create or replace function public.nauka_ranking_grupy(p_zakres text default 'tydzien')
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  c jsonb := public.nauka_rp_cfg();
  v_d date := public.nauka_dzis();
  v_od date; v_do date; v_rok text; v_out jsonb;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_platny() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  if p_zakres = 'semestr' then v_od := (c->>'semestr_od')::date; v_do := v_d;
  else v_od := public.nauka_tydzien(v_d); v_do := v_od + 6; end if;
  select p.rocznik_id into v_rok from public.nauka_profil p where p.user_id = auth.uid();
  v_rok := coalesce(v_rok, public.nauka_bm());
  with suma as (
    select r.user_id, sum(r.pkt)::int pkt from public.nauka_rp r
     where r.dzien between v_od and v_do group by r.user_id having sum(r.pkt) > 0),
  osoby as (
    select s.user_id, s.pkt, public.nauka_rp_grupa(s.user_id) grupa from suma s
      left join public.nauka_profil p on p.user_id = s.user_id
     where coalesce(p.rocznik_id, public.nauka_bm()) = v_rok
       and not exists (select 1 from public.nauka_konta k where k.user_id = s.user_id and k.zablokowane)
       and not (coalesce((c->>'ukryj_adminow')::boolean, false) and public.nauka_rp_admin_uid(s.user_id))),
  g as (select grupa, count(*)::int n, round(avg(pkt))::int sr from osoby where grupa is not null group by grupa)
  select jsonb_build_object('ok', true, 'zakres', coalesce(p_zakres, 'tydzien'), 'od', v_od, 'do', v_do,
    'moja', public.nauka_rp_grupa(auth.uid()), 'min', 3,
    'grupy', coalesce((select jsonb_agg(jsonb_build_object('grupa', g.grupa, 'aktywne', g.n, 'srednia', case when g.n >= 3 then g.sr end) order by g.grupa) from g), '[]'::jsonb))
  into v_out;
  return v_out;
end $$;
