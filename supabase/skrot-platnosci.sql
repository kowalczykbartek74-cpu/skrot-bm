-- Skrót BM jako płatna platforma: podgląd za darmo, pełny dostęp po opłacie (Stripe).
-- Wymaga wcześniej nauka.sql i skrot.sql. Można uruchamiać wielokrotnie.
--
-- Kto co widzi:
--   • każdy (także niezalogowany): lista materiałów (tytuły, przedmioty, liczby fiszek i pytań)
--   • każdy zalogowany: pełna treść materiałów oznaczonych jako darmowa próbka (data.free = true)
--   • z wykupionym dostępem (nauka_dostep, do_kiedy >= dziś) i administratorzy: wszystko
--   • postęp nauki: tylko właściciel; zgłoszenia: tylko administratorzy

-- ---------- Dostęp: kto zapłacił ----------
alter table public.nauka_dostep add column if not exists user_id uuid;
alter table public.nauka_dostep add column if not exists stripe_session text;
alter table public.nauka_dostep add column if not exists kwota_gr integer;

create or replace function public.nauka_platny() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.nauka_admin()
      or exists (select 1 from public.nauka_dostep d
                 where d.do_kiedy >= current_date
                   and (d.email = public.nauka_email() or d.user_id = auth.uid()))
$$;

create or replace function public.nauka_darmowy(doc_id text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.nauka_docs m
                 where m.kolekcja = 'materials' and m.id = doc_id and (m.data ->> 'free')::boolean)
$$;

create or replace function public.nauka_ja() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'email', public.nauka_email(),
    'admin', public.nauka_admin(),
    'platny', public.nauka_platny(),
    'czytelnik', public.nauka_platny(),
    'dostep_do', (select max(d.do_kiedy) from public.nauka_dostep d
                  where d.email = public.nauka_email() or d.user_id = auth.uid())
  )
$$;

-- ---------- Reguły dla tabeli z treściami ----------
grant select on public.nauka_docs to anon;

-- Czy materiał o tym id jest opracowaniem z sylabusa (security definer: bez rekurencji w regułach tabeli).
create or replace function public.nauka_z_sylabusa(doc_id text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.nauka_docs s
                 where s.kolekcja = 'materials' and s.id = doc_id and s.data ->> 'source' = 'sylabus')
$$;
revoke all on function public.nauka_z_sylabusa(text) from public;
grant execute on function public.nauka_z_sylabusa(text) to anon, authenticated;

drop policy if exists "nauka czytaj" on public.nauka_docs;
create policy "nauka czytaj" on public.nauka_docs for select to anon, authenticated using (
     kolekcja = 'materials'
  or (kolekcja in ('materialContent','materialSimple','quizWhy')
        and (public.nauka_platny() or (auth.uid() is not null and public.nauka_darmowy(id))))
  -- tekst źródła: studenci widzą tylko sekcje sylabusa; tekstu slajdów prowadzących nie czyta nikt poza starostą
  or (kolekcja = 'materialSources'
        and (public.nauka_admin()
             or ((public.nauka_platny() or (auth.uid() is not null and public.nauka_darmowy(id)))
                 and public.nauka_z_sylabusa(id))))
  or (kolekcja in ('tasks','meta','deadlines','announcements') and public.nauka_platny())
  or (kolekcja = 'reports'  and public.nauka_admin())
  or (kolekcja = 'progress' and id = auth.uid()::text)
);

drop policy if exists "nauka dodaj" on public.nauka_docs;
create policy "nauka dodaj" on public.nauka_docs for insert to authenticated with check (
     (kolekcja in ('deadlines','reports') and public.nauka_platny())
  or (kolekcja = 'progress' and id = auth.uid()::text)
  or (kolekcja in ('materials','materialContent','materialSources','materialSimple','quizWhy',
                   'tasks','meta','announcements') and public.nauka_admin())
);

-- Zmiana i usuwanie bez zmian względem skrot.sql (autor terminu albo admin; postęp: właściciel)

revoke all on function public.nauka_platny(), public.nauka_darmowy(text) from public;
grant execute on function public.nauka_platny(), public.nauka_darmowy(text), public.nauka_email(), public.nauka_admin()
  to anon, authenticated;
grant execute on function public.nauka_ja() to authenticated;

-- ---------- Darmowe próbki: pierwszy materiał z każdego przedmiotu ----------
update public.nauka_docs m set data = m.data || '{"free": true}'::jsonb
where m.kolekcja = 'materials' and m.id in (
  select distinct on (data ->> 'subjectId') id from public.nauka_docs
  where kolekcja = 'materials'
  order by data ->> 'subjectId', (data ->> 'createdAt')::bigint asc, id asc
) and not coalesce((m.data ->> 'free')::boolean, false);
