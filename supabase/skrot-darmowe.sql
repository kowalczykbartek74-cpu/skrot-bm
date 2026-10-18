-- Darmowa próbka także dla NOWYCH materiałów i NOWYCH przedmiotów.
-- Wcześniej skrot-platnosci.sql oznaczył „free” tylko raz, więc pierwszy materiał nowego przedmiotu był zablokowany.
-- Teraz reguła działa na bieżąco:
--   • materiał z data.free = true jest darmowy,
--   • a gdy w przedmiocie żaden materiał nie ma „free”, darmowy jest najstarszy materiał tego przedmiotu.
-- Strona (index.html, funkcja isFree) stosuje dokładnie tę samą regułę.
-- Wklej w Supabase → SQL Editor → Run. Można uruchamiać wielokrotnie. Wymaga wcześniej skrot-platnosci.sql.

create or replace function public.nauka_darmowy(doc_id text) returns boolean
language sql stable security definer set search_path = '' as $$
  with m as (
    select data ->> 'subjectId' as sid,
           coalesce((data ->> 'free')::boolean, false) as f
    from public.nauka_docs
    where kolekcja = 'materials' and id = doc_id
  )
  select coalesce((
    select m.f or (
      not exists (select 1 from public.nauka_docs x
                  where x.kolekcja = 'materials'
                    and x.data ->> 'subjectId' is not distinct from m.sid
                    and coalesce((x.data ->> 'free')::boolean, false))
      and doc_id = (select y.id from public.nauka_docs y
                    where y.kolekcja = 'materials'
                      and y.data ->> 'subjectId' is not distinct from m.sid
                    order by coalesce((y.data ->> 'createdAt')::bigint, 0) asc, y.id collate "C" asc
                    limit 1))
    from m), false)
$$;

revoke all on function public.nauka_darmowy(text) from public;
grant execute on function public.nauka_darmowy(text) to anon, authenticated;
