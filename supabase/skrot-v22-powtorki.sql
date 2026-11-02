-- Skrót BM v22: lekcje v4 – pomiar powtórek (spec „lekcje v4”, sekcja 9).
-- 1) Klucze powtórek z pytaniami lekcji: q:<mid>:<hash>, d:<mid>:<atom>, n:<mid>:<szablon> (przedmiot z drugiego segmentu).
-- 2) nauka_rp_powtorka(klucz, ok, first, wiek): to samo co wersja z jednym argumentem + wpis do nauka_powtorki_log
--    (czy dobrze, czy pierwsza odpowiedź w sesji, ile dni od zdania biletu). Tylko płacący, jak dotąd.
-- Główna miara (liczona później): % ok przy first and wiek >= 7, na przedmiot i tydzień.
-- Uruchom w Supabase → SQL Editor (po v13). Można uruchomić ponownie. Bez tego strona woła starą wersję (bez pomiaru).

create table if not exists public.nauka_powtorki_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  klucz text not null,
  sid text,
  ok boolean not null,
  first boolean not null,
  wiek int,
  at timestamptz not null default now()
);
create index if not exists nauka_powtorki_log_sid_at on public.nauka_powtorki_log (sid, at);
alter table public.nauka_powtorki_log enable row level security;
-- Bez polityk: czytać i pisać może tylko funkcja poniżej (security definer) i administrator w SQL Editor.

create or replace function public.nauka_rp_klucz_sid(p_klucz text) returns text
language sql stable security definer set search_path = '' as $$
  select case
    when p_klucz like 'g:%' then split_part(p_klucz, ':', 2)
    when split_part(p_klucz, ':', 1) in ('q', 'd', 'n') then public.nauka_rp_sid(split_part(p_klucz, ':', 2))
    else public.nauka_rp_sid(split_part(p_klucz, ':', 1)) end
$$;

create or replace function public.nauka_rp_powtorka(p_klucz text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_sid text; v_pkt int;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if not public.nauka_rp_mozna() then return jsonb_build_object('ok', false, 'code', 'no_access'); end if;
  if p_klucz is null or char_length(p_klucz) not between 3 and 180 then return jsonb_build_object('ok', false, 'code', 'bad_key'); end if;
  v_sid := public.nauka_rp_klucz_sid(p_klucz);
  v_pkt := public.nauka_rp_dodaj(auth.uid(), 'powtorka', 'p:' || p_klucz, v_sid, (public.nauka_rp_cfg()->>'pkt_powtorka')::int);
  return jsonb_build_object('ok', true, 'pkt', v_pkt);
end $$;

create or replace function public.nauka_rp_powtorka(p_klucz text, p_ok boolean, p_first boolean, p_wiek int) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r jsonb;
begin
  r := public.nauka_rp_powtorka(p_klucz);
  if coalesce((r->>'ok')::boolean, false) then
    insert into public.nauka_powtorki_log (user_id, klucz, sid, ok, first, wiek)
    values (auth.uid(), p_klucz, public.nauka_rp_klucz_sid(p_klucz), coalesce(p_ok, false), coalesce(p_first, true),
            case when p_wiek between 0 and 3650 then p_wiek end);
  end if;
  return r;
end $$;

revoke execute on function public.nauka_rp_klucz_sid(text), public.nauka_rp_powtorka(text, boolean, boolean, int) from public, anon, authenticated;
grant execute on function public.nauka_rp_powtorka(text), public.nauka_rp_powtorka(text, boolean, boolean, int) to authenticated;

-- Miara do sprawdzania (SQL Editor): pamiętanie po ≥ 7 dniach, na przedmiot i tydzień.
-- select sid, date_trunc('week', at) tydz, count(*) n, round(100.0 * avg(ok::int), 1) proc_ok
--   from public.nauka_powtorki_log where first and wiek >= 7 group by 1, 2 order by 2 desc, 1;
-- Pytania do sprawdzenia: < 40% dobrze przy ≥ 20 odpowiedziach.
-- select klucz, count(*) n, round(100.0 * avg(ok::int)) proc_ok from public.nauka_powtorki_log
--   where first and klucz ~ '^[qdn]:' group by 1 having count(*) >= 20 and avg(ok::int) < 0.4 order by 3;

notify pgrst, 'reload schema';
